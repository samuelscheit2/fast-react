'use strict';

const {
  EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE,
  EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
  createEventListenerTargetLookupRecord,
  createEventTargetDispatchPathRecord,
  createEventTargetNormalizationRecord,
  getEventListenerTargetLookupRecordPayload
} = require('../client/component-tree.js');
const {
  getEventTarget,
  getNativeEventType
} = require('./get-event-target.js');
const {
  isCapturePhase,
  isEventHandleNonManagedNode,
  isNonDelegatedEventSystem,
  shouldProcessPolyfillEventPlugins
} = require('./event-system-flags.js');

const EVENT_WRAPPER_RECORD_KIND = 'FastReactDomEventPriorityWrapperRecord';
const EVENT_DISPATCH_RECORD_KIND = 'FastReactDomEventDispatchRecord';
const PLUGIN_EXTRACTION_RECORD_KIND =
  'FastReactDomPluginExtractionRecord';
const DISPATCH_QUEUE_RECORD_KIND = 'FastReactDomDispatchQueueRecord';
const DISPATCH_QUEUE_ENTRY_RECORD_KIND =
  'FastReactDomDispatchQueueEntryRecord';
const DISPATCH_LISTENER_RECORD_KIND =
  'FastReactDomDispatchListenerRecord';

const EVENT_DISPATCH_BLOCKED_CODE = 'FAST_REACT_DOM_EVENT_DISPATCH_BLOCKED';
const PLUGIN_EXTRACTION_BLOCKED_CODE =
  'FAST_REACT_DOM_PLUGIN_EXTRACTION_BLOCKED';
const EVENT_TARGET_RESOLUTION_BLOCKED_CODE =
  'FAST_REACT_DOM_EVENT_TARGET_RESOLUTION_BLOCKED';
const HYDRATION_REPLAY_BLOCKED_CODE =
  'FAST_REACT_DOM_HYDRATION_REPLAY_BLOCKED';
const CONTROLLED_STATE_RESTORE_BLOCKED_CODE =
  'FAST_REACT_DOM_CONTROLLED_STATE_RESTORE_BLOCKED';
const INVALID_EVENT_WRAPPER_RECORD_CODE =
  'FAST_REACT_DOM_INVALID_EVENT_WRAPPER_RECORD';
const PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS =
  'admitted-private-fake-dom-event-dispatch-metadata';

const SIMPLE_EVENT_PLUGIN_NAME = 'simple-event-plugin';
const POLYFILL_EVENT_PLUGIN_NAMES = Object.freeze([
  'enter-leave-event-plugin',
  'change-event-plugin',
  'select-event-plugin',
  'before-input-event-plugin',
  'form-action-event-plugin'
]);
const SCROLL_END_EVENT_PLUGIN_NAME = 'scroll-end-event-plugin';
const EVENT_PLUGIN_NAMES = Object.freeze([
  SIMPLE_EVENT_PLUGIN_NAME,
  ...POLYFILL_EVENT_PLUGIN_NAMES,
  SCROLL_END_EVENT_PLUGIN_NAME
]);
const simpleEventPluginEvents = Object.freeze([
  'abort',
  'auxClick',
  'beforeToggle',
  'cancel',
  'canPlay',
  'canPlayThrough',
  'click',
  'close',
  'contextMenu',
  'copy',
  'cut',
  'drag',
  'dragEnd',
  'dragEnter',
  'dragExit',
  'dragLeave',
  'dragOver',
  'dragStart',
  'drop',
  'durationChange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'gotPointerCapture',
  'input',
  'invalid',
  'keyDown',
  'keyPress',
  'keyUp',
  'load',
  'loadedData',
  'loadedMetadata',
  'loadStart',
  'lostPointerCapture',
  'mouseDown',
  'mouseMove',
  'mouseOut',
  'mouseOver',
  'mouseUp',
  'paste',
  'pause',
  'play',
  'playing',
  'pointerCancel',
  'pointerDown',
  'pointerMove',
  'pointerOut',
  'pointerOver',
  'pointerUp',
  'progress',
  'rateChange',
  'reset',
  'resize',
  'seeked',
  'seeking',
  'stalled',
  'submit',
  'suspend',
  'timeUpdate',
  'touchCancel',
  'touchEnd',
  'touchMove',
  'touchStart',
  'volumeChange',
  'scroll',
  'scrollEnd',
  'toggle',
  'waiting',
  'wheel'
]);
const simpleEventReactNames = createSimpleEventReactNameMap();
const dispatchListenerRecordPayloads = new WeakMap();
const dispatchQueueEntryRecordPayloads = new WeakMap();

function isObjectLike(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function createInvalidEventWrapperRecordError() {
  const error = new Error(
    'Cannot create a React DOM event dispatch record without a private listener wrapper record.'
  );
  error.code = INVALID_EVENT_WRAPPER_RECORD_CODE;
  return error;
}

function getWrapperRecord(listenerOrWrapperRecord) {
  if (
    typeof listenerOrWrapperRecord === 'function' &&
    listenerOrWrapperRecord.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__
  ) {
    return listenerOrWrapperRecord.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__;
  }

  return listenerOrWrapperRecord;
}

function assertEventListenerWrapperRecord(listenerOrWrapperRecord) {
  const wrapperRecord = getWrapperRecord(listenerOrWrapperRecord);
  if (
    wrapperRecord === null ||
    typeof wrapperRecord !== 'object' ||
    wrapperRecord.kind !== EVENT_WRAPPER_RECORD_KIND ||
    typeof wrapperRecord.domEventName !== 'string' ||
    typeof wrapperRecord.eventSystemFlags !== 'number'
  ) {
    throw createInvalidEventWrapperRecordError();
  }

  return wrapperRecord;
}

function createDispatchQueueRecord(entries) {
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  const frozenEntries = Object.freeze(normalizedEntries.slice());
  const listenerCount = frozenEntries.reduce(
    (count, entry) => count + entry.listenerCount,
    0
  );

  return Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    entries: frozenEntries,
    kind: DISPATCH_QUEUE_RECORD_KIND,
    length: frozenEntries.length,
    listenerCount,
    listenerInvocationCount: 0,
    publicRootBehaviorChanged: false,
    status:
      frozenEntries.length === 0
        ? 'empty'
        : 'blocked-listener-metadata-recorded',
    syntheticEventCount: 0,
    willInvokeListeners: false
  });
}

function createPluginRecord(
  pluginName,
  extractionStatus,
  blockedReason,
  metadata
) {
  return Object.freeze({
    blockedReason,
    dispatchEntryCount:
      metadata && typeof metadata.dispatchEntryCount === 'number'
        ? metadata.dispatchEntryCount
        : 0,
    extractionStatus,
    listenerMetadataCount:
      metadata && typeof metadata.listenerMetadataCount === 'number'
        ? metadata.listenerMetadataCount
        : 0,
    listenerInvocationCount: 0,
    pluginName,
    syntheticEventCount: 0
  });
}

function createPluginRecords(eventSystemFlags, dispatchQueue) {
  const processPolyfills =
    shouldProcessPolyfillEventPlugins(eventSystemFlags);
  const records = [
    createPluginRecord(
      SIMPLE_EVENT_PLUGIN_NAME,
      'blocked',
      PLUGIN_EXTRACTION_BLOCKED_CODE,
      {
        dispatchEntryCount: dispatchQueue.length,
        listenerMetadataCount: dispatchQueue.listenerCount
      }
    )
  ];

  for (const pluginName of POLYFILL_EVENT_PLUGIN_NAMES) {
    records.push(
      createPluginRecord(
        pluginName,
        processPolyfills ? 'blocked' : 'skipped-by-event-system-flags',
        processPolyfills
          ? PLUGIN_EXTRACTION_BLOCKED_CODE
          : null
      )
    );
  }

  records.push(
    createPluginRecord(
      SCROLL_END_EVENT_PLUGIN_NAME,
      'blocked-by-feature-gate',
      PLUGIN_EXTRACTION_BLOCKED_CODE
    )
  );

  return Object.freeze(records);
}

function createSimpleEventDispatchMetadata(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  targetNormalizationRecord,
  targetDispatchPathRecord
) {
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const registrationName = getSimpleEventRegistrationName(
    wrapperRecord.domEventName,
    eventSystemFlags
  );
  const targetListenerLookupRecords = [];
  const listenerRecords = [];

  if (targetDispatchPathRecord.entries.length === 0) {
    targetListenerLookupRecords.push(
      createEventListenerTargetLookupRecord(
        targetNormalizationRecord,
        registrationName
      )
    );
  } else {
    for (const pathEntry of targetDispatchPathRecord.entries) {
      const listenerTargetNormalizationRecord =
        pathEntry.index === 0
          ? targetNormalizationRecord
          : createEventTargetNormalizationRecord(
              pathEntry.targetHostInstanceNode
            );
      const lookupRecord = createEventListenerTargetLookupRecord(
        listenerTargetNormalizationRecord,
        registrationName
      );

      targetListenerLookupRecords.push(lookupRecord);
      if (lookupRecord.listenerFound) {
        listenerRecords.push(
          createDispatchListenerRecord(
            wrapperRecord,
            nativeEvent,
            nativeEventTarget,
            pathEntry,
            lookupRecord
          )
        );
      }
    }
  }

  const dispatchEntries =
    listenerRecords.length === 0
      ? []
      : [
          createDispatchQueueEntryRecord(
            wrapperRecord,
            nativeEvent,
            nativeEventTarget,
            listenerRecords
          )
        ];

  return {
    dispatchQueue: createDispatchQueueRecord(dispatchEntries),
    targetListenerLookupRecord:
      targetListenerLookupRecords.length === 0
        ? null
        : targetListenerLookupRecords[0],
    targetListenerLookupRecords: Object.freeze(
      targetListenerLookupRecords.slice()
    )
  };
}

function createDispatchListenerRecord(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  pathEntry,
  lookupRecord
) {
  const lookupPayload =
    getEventListenerTargetLookupRecordPayload(lookupRecord);
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const inCapturePhase = isCapturePhase(eventSystemFlags);
  const nativeEventType = getNativeEventType(
    nativeEvent,
    wrapperRecord.domEventName
  );
  const record = Object.freeze({
    blockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: pathEntry.targetHostInstanceNode,
    dispatchPathIndex: pathEntry.index,
    domEventName: wrapperRecord.domEventName,
    exposesLatestProps: false,
    exposesListener: false,
    hostOwner: pathEntry.hostOwner,
    inCapturePhase,
    instance: pathEntry.targetHostInstanceToken,
    kind: DISPATCH_LISTENER_RECORD_KIND,
    latestPropsStatus: lookupRecord.latestPropsStatus,
    listenerFound: lookupRecord.listenerFound,
    listenerInvocationCount: 0,
    listenerStatus: lookupRecord.listenerStatus,
    listenerType: lookupRecord.listenerType,
    nativeEventTarget,
    nativeEventType,
    phase: inCapturePhase ? 'capture' : 'bubble',
    publicRootBehaviorChanged: false,
    registrationName: lookupRecord.registrationName,
    rootOwner: pathEntry.rootOwner,
    status: 'blocked-listener-metadata-recorded',
    syntheticEventCount: 0,
    targetHostInstanceNode: pathEntry.targetHostInstanceNode,
    targetHostInstanceStatus: pathEntry.targetHostInstanceStatus,
    targetHostInstanceToken: pathEntry.targetHostInstanceToken,
    targetInst: pathEntry.targetHostInstanceToken,
    targetInstStatus: 'resolved-component-tree-host-instance',
    targetListenerLookupRecord: lookupRecord,
    willInvokeListener: false
  });

  dispatchListenerRecordPayloads.set(
    record,
    Object.freeze({
      latestProps: lookupPayload === null ? null : lookupPayload.latestProps,
      listener: lookupPayload === null ? null : lookupPayload.listener,
      nativeEvent,
      nativeEventTarget,
      pathEntry,
      targetListenerLookupRecord: lookupRecord
    })
  );

  return record;
}

function createDispatchQueueEntryRecord(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  listenerRecords
) {
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const inCapturePhase = isCapturePhase(eventSystemFlags);
  const listeners = Object.freeze(listenerRecords.slice());
  const processingListeners = inCapturePhase
    ? Object.freeze(listenerRecords.slice().reverse())
    : listeners;
  const record = Object.freeze({
    accumulationOrder: 'target-to-root',
    blockedReason: PLUGIN_EXTRACTION_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    domEventName: wrapperRecord.domEventName,
    exposesSyntheticEvent: false,
    inCapturePhase,
    kind: DISPATCH_QUEUE_ENTRY_RECORD_KIND,
    listenerCount: listeners.length,
    listenerInvocationCount: 0,
    listeners,
    nativeEventTarget,
    nativeEventType: getNativeEventType(
      nativeEvent,
      wrapperRecord.domEventName
    ),
    pluginName: SIMPLE_EVENT_PLUGIN_NAME,
    processingListenerRecords: processingListeners,
    processingOrder: inCapturePhase ? 'root-to-target' : 'target-to-root',
    publicRootBehaviorChanged: false,
    reactName: getSimpleEventReactName(wrapperRecord.domEventName),
    registrationName:
      listeners.length === 0 ? null : listeners[0].registrationName,
    status: 'blocked-listener-metadata-recorded',
    syntheticEventCount: 0,
    syntheticEventStatus: 'not-created',
    willInvokeListeners: false
  });

  dispatchQueueEntryRecordPayloads.set(
    record,
    Object.freeze({
      listenerRecords: listeners,
      nativeEvent,
      nativeEventTarget,
      processingListenerRecords: processingListeners
    })
  );

  return record;
}

function getDispatchListenerRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchListenerRecordPayloads.get(record) || null;
}

function isDispatchListenerRecord(record) {
  return getDispatchListenerRecordPayload(record) !== null;
}

function getDispatchQueueEntryRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchQueueEntryRecordPayloads.get(record) || null;
}

function isDispatchQueueEntryRecord(record) {
  return getDispatchQueueEntryRecordPayload(record) !== null;
}

function createPluginExtractionRecord(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  targetNormalizationRecord,
  targetListenerLookupRecord,
  targetDispatchPathRecord
) {
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const resolvedTargetDispatchPathRecord =
    targetDispatchPathRecord === undefined
      ? createEventTargetDispatchPathRecord(targetNormalizationRecord)
      : targetDispatchPathRecord;
  const simpleEventDispatchMetadata = createSimpleEventDispatchMetadata(
    wrapperRecord,
    nativeEvent,
    nativeEventTarget,
    targetNormalizationRecord,
    resolvedTargetDispatchPathRecord
  );
  const dispatchQueue = simpleEventDispatchMetadata.dispatchQueue;
  const resolvedTargetListenerLookupRecord =
    targetListenerLookupRecord === undefined
      ? simpleEventDispatchMetadata.targetListenerLookupRecord
      : targetListenerLookupRecord;

  return Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    blockedReason: PLUGIN_EXTRACTION_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    dispatchQueue,
    domEventName: wrapperRecord.domEventName,
    eventSystemFlags,
    inCapturePhase: isCapturePhase(eventSystemFlags),
    kind: PLUGIN_EXTRACTION_RECORD_KIND,
    listenerInvocationCount: 0,
    nativeEventTarget,
    nativeEventType: getNativeEventType(nativeEvent, wrapperRecord.domEventName),
    pluginRecords: createPluginRecords(eventSystemFlags, dispatchQueue),
    publicRootBehaviorChanged: false,
    shouldProcessPolyfillPlugins:
      shouldProcessPolyfillEventPlugins(eventSystemFlags),
    status: 'blocked',
    syntheticEventCount: 0,
    targetContainer: wrapperRecord.targetContainer,
    targetDispatchPathRecord: resolvedTargetDispatchPathRecord,
    targetDispatchPathStatus: resolvedTargetDispatchPathRecord.status,
    targetDispatchPathLength: resolvedTargetDispatchPathRecord.length,
    targetInst: resolvedTargetDispatchPathRecord.targetInst,
    targetInstStatus: resolvedTargetDispatchPathRecord.targetInstStatus,
    targetListenerFound:
      resolvedTargetListenerLookupRecord === null
        ? false
        : resolvedTargetListenerLookupRecord.listenerFound,
    targetListenerLookupRecord: resolvedTargetListenerLookupRecord,
    targetListenerLookupRecords:
      simpleEventDispatchMetadata.targetListenerLookupRecords,
    targetListenerLookupCount:
      simpleEventDispatchMetadata.targetListenerLookupRecords.length,
    targetListenerLookupStatus:
      resolvedTargetListenerLookupRecord === null
        ? 'not-applicable'
        : resolvedTargetListenerLookupRecord.listenerStatus,
    targetListenerRegistrationName:
      resolvedTargetListenerLookupRecord === null
        ? null
        : resolvedTargetListenerLookupRecord.registrationName,
    targetNormalizationRecord,
    willInvokeListeners: false
  });
}

function createHydrationReplayRecord() {
  return Object.freeze({
    blockedOn: null,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    queued: false,
    status: 'blocked'
  });
}

function createControlledStateRestoreRecord() {
  return Object.freeze({
    blockedReason: CONTROLLED_STATE_RESTORE_BLOCKED_CODE,
    scheduled: false,
    status: 'blocked'
  });
}

function createEventDispatchRecordFromWrapperRecord(
  listenerOrWrapperRecord,
  nativeEvent
) {
  const wrapperRecord =
    assertEventListenerWrapperRecord(listenerOrWrapperRecord);
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const nativeEventTarget = getEventTarget(
    nativeEvent,
    wrapperRecord.targetContainer
  );
  const targetNormalizationRecord =
    createEventTargetNormalizationRecord(nativeEventTarget);
  const targetDispatchPathRecord =
    createEventTargetDispatchPathRecord(targetNormalizationRecord);
  const extractionRecord = createPluginExtractionRecord(
    wrapperRecord,
    nativeEvent,
    nativeEventTarget,
    targetNormalizationRecord,
    undefined,
    targetDispatchPathRecord
  );
  const targetListenerLookupRecord =
    extractionRecord.targetListenerLookupRecord;
  const targetResolutionWasResolved =
    targetDispatchPathRecord.targetInst !== null;

  return Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    blockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    controlledStateRestore: createControlledStateRestoreRecord(),
    dispatchQueue: extractionRecord.dispatchQueue,
    dispatcherName: wrapperRecord.dispatcherName,
    domEventName: wrapperRecord.domEventName,
    eventPriority: wrapperRecord.eventPriority,
    eventPriorityLabel: wrapperRecord.eventPriorityLabel,
    eventPriorityLane: wrapperRecord.eventPriorityLane,
    eventPriorityName: wrapperRecord.eventPriorityName,
    eventSystemFlags,
    extractionRecord,
    hydrationReplay: createHydrationReplayRecord(),
    inCapturePhase: isCapturePhase(eventSystemFlags),
    isEventHandleNonManagedNode:
      isEventHandleNonManagedNode(eventSystemFlags),
    isNonDelegatedEvent: isNonDelegatedEventSystem(eventSystemFlags),
    kind: EVENT_DISPATCH_RECORD_KIND,
    listenerInvocationCount: 0,
    nativeEventTarget,
    nativeEventType: getNativeEventType(nativeEvent, wrapperRecord.domEventName),
    priorityRecord: wrapperRecord.priorityRecord,
    publicRootBehaviorChanged: false,
    status: 'blocked',
    syntheticEventCount: 0,
    targetContainer: wrapperRecord.targetContainer,
    targetDispatchPathRecord,
    targetDispatchPathStatus: targetDispatchPathRecord.status,
    targetDispatchPathLength: targetDispatchPathRecord.length,
    targetHostInstanceNode:
      targetNormalizationRecord.closestMountedHostInstanceNode,
    targetHostInstanceStatus: targetNormalizationRecord.status,
    targetHostInstanceToken:
      targetNormalizationRecord.closestMountedHostInstanceToken,
    targetInst: targetDispatchPathRecord.targetInst,
    targetInstStatus: targetDispatchPathRecord.targetInstStatus,
    targetListenerFound:
      targetListenerLookupRecord === null
        ? false
        : targetListenerLookupRecord.listenerFound,
    targetListenerLookupBlockedReason:
      targetListenerLookupRecord === null
        ? null
        : targetListenerLookupRecord.blockedReason,
    targetListenerLookupRecord,
    targetListenerLookupRecords:
      extractionRecord.targetListenerLookupRecords,
    targetListenerLookupCount:
      extractionRecord.targetListenerLookupCount,
    targetListenerLookupStatus:
      targetListenerLookupRecord === null
        ? 'not-applicable'
        : targetListenerLookupRecord.listenerStatus,
    targetListenerRegistrationName:
      targetListenerLookupRecord === null
        ? null
        : targetListenerLookupRecord.registrationName,
    targetNormalizationRecord,
    targetResolutionBlockedReason: targetResolutionWasResolved
      ? null
      : EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    targetResolutionStatus: targetResolutionWasResolved
      ? 'resolved'
      : 'blocked',
    willInvokeListeners: false,
    wrapperKind: wrapperRecord.wrapperKind,
    wrapperRecord
  });
}

function createSimpleEventReactNameMap() {
  const reactNames = Object.create(null);

  for (const eventName of simpleEventPluginEvents) {
    const domEventName = eventName.toLowerCase();
    reactNames[domEventName] =
      'on' + eventName[0].toUpperCase() + eventName.slice(1);
  }

  reactNames.animationend = 'onAnimationEnd';
  reactNames.animationiteration = 'onAnimationIteration';
  reactNames.animationstart = 'onAnimationStart';
  reactNames.dblclick = 'onDoubleClick';
  reactNames.focusin = 'onFocus';
  reactNames.focusout = 'onBlur';
  reactNames.transitioncancel = 'onTransitionCancel';
  reactNames.transitionend = 'onTransitionEnd';
  reactNames.transitionrun = 'onTransitionRun';
  reactNames.transitionstart = 'onTransitionStart';

  return Object.freeze(reactNames);
}

function getSimpleEventReactName(domEventName) {
  return Object.prototype.hasOwnProperty.call(
    simpleEventReactNames,
    domEventName
  )
    ? simpleEventReactNames[domEventName]
    : null;
}

function getSimpleEventRegistrationName(domEventName, eventSystemFlags) {
  const reactName = getSimpleEventReactName(domEventName);
  if (reactName === null) {
    return null;
  }

  return isCapturePhase(eventSystemFlags) ? reactName + 'Capture' : reactName;
}

module.exports = {
  CONTROLLED_STATE_RESTORE_BLOCKED_CODE,
  DISPATCH_LISTENER_RECORD_KIND,
  DISPATCH_QUEUE_ENTRY_RECORD_KIND,
  DISPATCH_QUEUE_RECORD_KIND,
  EVENT_DISPATCH_BLOCKED_CODE,
  EVENT_DISPATCH_RECORD_KIND,
  EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE,
  EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
  EVENT_PLUGIN_NAMES,
  EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
  HYDRATION_REPLAY_BLOCKED_CODE,
  INVALID_EVENT_WRAPPER_RECORD_CODE,
  PLUGIN_EXTRACTION_BLOCKED_CODE,
  PLUGIN_EXTRACTION_RECORD_KIND,
  POLYFILL_EVENT_PLUGIN_NAMES,
  PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
  SCROLL_END_EVENT_PLUGIN_NAME,
  SIMPLE_EVENT_PLUGIN_NAME,
  assertEventListenerWrapperRecord,
  createEventDispatchRecordFromWrapperRecord,
  createPluginExtractionRecord,
  getDispatchListenerRecordPayload,
  getDispatchQueueEntryRecordPayload,
  getSimpleEventReactName,
  getSimpleEventRegistrationName,
  getWrapperRecord,
  isDispatchListenerRecord,
  isDispatchQueueEntryRecord
};
