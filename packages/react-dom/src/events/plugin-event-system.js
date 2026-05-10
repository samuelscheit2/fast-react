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
const DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND =
  'FastReactDomDispatchListenerInvocationCanaryRecord';
const DISPATCH_LISTENER_CANARY_EVENT_KIND =
  'FastReactDomDispatchListenerCanaryEvent';
const DISPATCH_QUEUE_INVOCATION_CANARY_RECORD_KIND =
  'FastReactDomDispatchQueueInvocationCanaryRecord';
const SYNTHETIC_EVENT_SHAPE_RECORD_KIND =
  'FastReactDomSyntheticEventShapeRecord';
const SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND =
  'FastReactDomSyntheticEventShapeGateRecord';
const DISPATCH_PROPAGATION_STOP_DIAGNOSTIC_RECORD_KIND =
  'FastReactDomDispatchPropagationStopDiagnosticRecord';
const DISPATCH_LISTENER_ERROR_ROUTE_RECORD_KIND =
  'FastReactDomDispatchListenerErrorRouteRecord';
const HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND =
  'FastReactDomHydrationReplayEventQueueDiagnostic';
const HYDRATION_REPLAY_EVENT_QUEUE_ENTRY_RECORD_KIND =
  'FastReactDomHydrationReplayEventQueueEntryRecord';
const HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND =
  'FastReactDomHydrationReplayQueueDrainOrderDiagnostic';
const HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND =
  'FastReactDomHydrationDehydratedTargetResolutionDiagnostic';
const HYDRATION_DEHYDRATED_ROOT_OWNER_RECORD_KIND =
  'FastReactDomHydrationDehydratedRootOwnerRecord';
const HYDRATION_DEHYDRATED_BOUNDARY_OWNER_RECORD_KIND =
  'FastReactDomHydrationDehydratedBoundaryOwnerRecord';
const HYDRATION_HYDRATABLE_EVENT_TARGET_LOOKUP_RECORD_KIND =
  'FastReactDomHydrationHydratableEventTargetLookupRecord';

const EVENT_DISPATCH_BLOCKED_CODE = 'FAST_REACT_DOM_EVENT_DISPATCH_BLOCKED';
const PLUGIN_EXTRACTION_BLOCKED_CODE =
  'FAST_REACT_DOM_PLUGIN_EXTRACTION_BLOCKED';
const EVENT_TARGET_RESOLUTION_BLOCKED_CODE =
  'FAST_REACT_DOM_EVENT_TARGET_RESOLUTION_BLOCKED';
const SYNTHETIC_EVENT_BLOCKED_CODE =
  'FAST_REACT_DOM_SYNTHETIC_EVENT_BLOCKED';
const PUBLIC_EVENT_DISPATCH_BLOCKED_CODE =
  'FAST_REACT_DOM_PUBLIC_EVENT_DISPATCH_BLOCKED';
const PROPAGATION_STOP_DIAGNOSTIC_BLOCKED_CODE =
  'FAST_REACT_DOM_PROPAGATION_STOP_DIAGNOSTIC_BLOCKED';
const LISTENER_ERROR_ROUTING_BLOCKED_CODE =
  'FAST_REACT_DOM_LISTENER_ERROR_ROUTING_BLOCKED';
const HYDRATION_REPLAY_BLOCKED_CODE =
  'FAST_REACT_DOM_HYDRATION_REPLAY_BLOCKED';
const CONTROLLED_STATE_RESTORE_BLOCKED_CODE =
  'FAST_REACT_DOM_CONTROLLED_STATE_RESTORE_BLOCKED';
const INVALID_EVENT_WRAPPER_RECORD_CODE =
  'FAST_REACT_DOM_INVALID_EVENT_WRAPPER_RECORD';
const INVALID_EVENT_DISPATCH_RECORD_CODE =
  'FAST_REACT_DOM_INVALID_EVENT_DISPATCH_RECORD';
const INVALID_DISPATCH_LISTENER_RECORD_CODE =
  'FAST_REACT_DOM_INVALID_DISPATCH_LISTENER_RECORD';
const PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS =
  'admitted-private-fake-dom-event-dispatch-metadata';
const PRIVATE_SINGLE_LISTENER_INVOCATION_CANARY_STATUS =
  'controlled-private-single-listener-invocation-canary';
const PRIVATE_DISPATCH_QUEUE_INVOCATION_CANARY_STATUS =
  'controlled-private-dispatch-queue-invocation-canary';
const PRIVATE_SYNTHETIC_EVENT_SHAPE_GATE_STATUS =
  'controlled-private-synthetic-event-shape-gate';
const PRIVATE_SYNTHETIC_EVENT_SHAPE_STATUS =
  'validated-private-synthetic-event-shape';
const PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS =
  'controlled-private-propagation-stop-diagnostic';
const PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS =
  'controlled-private-listener-error-routing-diagnostic';

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
const hydrationDiscreteReplayableEventNames = Object.freeze([
  'mousedown',
  'mouseup',
  'touchcancel',
  'touchend',
  'touchstart',
  'auxclick',
  'dblclick',
  'pointercancel',
  'pointerdown',
  'pointerup',
  'dragend',
  'dragstart',
  'drop',
  'compositionend',
  'compositionstart',
  'keydown',
  'keypress',
  'keyup',
  'input',
  'textInput',
  'copy',
  'cut',
  'paste',
  'click',
  'change',
  'contextmenu',
  'reset'
]);
const hydrationDiscreteReplayableEventNameSet = new Set(
  hydrationDiscreteReplayableEventNames
);
const hydrationContinuousReplayQueueNames = Object.freeze({
  focusin: 'queuedFocus',
  focusout: 'queuedFocus',
  dragenter: 'queuedDrag',
  dragleave: 'queuedDrag',
  mouseover: 'queuedMouse',
  mouseout: 'queuedMouse',
  pointerover: 'queuedPointers',
  pointerout: 'queuedPointers',
  gotpointercapture: 'queuedPointerCaptures',
  lostpointercapture: 'queuedPointerCaptures'
});
const simpleEventReactNames = createSimpleEventReactNameMap();
const dispatchListenerRecordPayloads = new WeakMap();
const dispatchQueueEntryRecordPayloads = new WeakMap();
const dispatchListenerInvocationCanaryRecordPayloads = new WeakMap();
const dispatchQueueInvocationCanaryRecordPayloads = new WeakMap();
const syntheticEventShapeRecordPayloads = new WeakMap();
const syntheticEventShapeGateRecordPayloads = new WeakMap();
const dispatchListenerErrorRouteRecordPayloads = new WeakMap();
const hydrationDehydratedTargetResolutionDiagnosticPayloads =
  new WeakMap();

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

function createPluginEventSystemError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function functionThatReturnsTrue() {
  return true;
}

function functionThatReturnsFalse() {
  return false;
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
    singleListenerInvocationCanaryStatus:
      listenerCount === 0
        ? 'unavailable-no-listeners'
        : 'available-private-helper-only',
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

function invokeSingleListenerCanaryFromDispatchRecord(dispatchRecord, options) {
  const normalizedDispatchRecord = assertEventDispatchRecord(dispatchRecord);
  const invocationOptions = normalizeSingleListenerCanaryOptions(options);
  const dispatchQueue = normalizedDispatchRecord.dispatchQueue;
  const dispatchQueueEntry =
    dispatchQueue.entries[invocationOptions.dispatchQueueEntryIndex] || null;

  if (dispatchQueueEntry === null) {
    return createSkippedSingleListenerInvocationCanaryRecord(
      normalizedDispatchRecord,
      null,
      null,
      invocationOptions,
      'no-dispatch-queue-entry'
    );
  }

  const listenerRecords = invocationOptions.useProcessingOrder
    ? dispatchQueueEntry.processingListenerRecords
    : dispatchQueueEntry.listeners;
  const dispatchListenerRecord =
    listenerRecords[invocationOptions.listenerIndex] || null;

  if (dispatchListenerRecord === null) {
    return createSkippedSingleListenerInvocationCanaryRecord(
      normalizedDispatchRecord,
      dispatchQueueEntry,
      null,
      invocationOptions,
      'no-dispatch-listener-record'
    );
  }

  return invokeDispatchListenerRecordForCanary(dispatchListenerRecord, {
    dispatchQueueEntry,
    dispatchRecord: normalizedDispatchRecord,
    listenerIndex: invocationOptions.listenerIndex,
    selectedFromProcessingOrder: invocationOptions.useProcessingOrder
  });
}

function invokeDispatchQueueCanaryFromDispatchRecords(
  dispatchRecords,
  options
) {
  const normalizedDispatchRecords = normalizeDispatchRecordList(
    dispatchRecords
  );
  const normalizedOptions = normalizeDispatchQueueCanaryOptions(options);
  const useProcessingOrder = normalizedOptions.useProcessingOrder;
  const propagationState =
    createDispatchQueuePropagationDiagnosticState(normalizedOptions);
  const invocationRecords = [];
  const listenerErrorRoutes = [];
  const propagationStopDiagnostics = [];
  let dispatchQueueEntryCount = 0;
  let listenerCandidateCount = 0;
  let listenerInvocationCount = 0;
  let listenerErrorCount = 0;
  let propagationSkippedListenerCount = 0;

  for (
    let dispatchRecordIndex = 0;
    dispatchRecordIndex < normalizedDispatchRecords.length;
    dispatchRecordIndex++
  ) {
    const dispatchRecord = normalizedDispatchRecords[dispatchRecordIndex];
    const dispatchQueue = dispatchRecord.dispatchQueue;

    for (
      let dispatchQueueEntryIndex = 0;
      dispatchQueueEntryIndex < dispatchQueue.entries.length;
      dispatchQueueEntryIndex++
    ) {
      const dispatchQueueEntry = assertDispatchQueueEntryRecord(
        dispatchQueue.entries[dispatchQueueEntryIndex]
      );
      const entryPayload =
        getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
      const listenerRecords = useProcessingOrder
        ? entryPayload.processingListenerRecords
        : entryPayload.listenerRecords;
      const canaryEventContext = createDispatchQueueCanaryEventContext(
        dispatchQueueEntry,
        entryPayload,
        normalizedOptions,
        propagationState
      );
      dispatchQueueEntryCount++;
      listenerCandidateCount += listenerRecords.length;
      let previousInstance = null;

      for (
        let listenerIndex = 0;
        listenerIndex < listenerRecords.length;
        listenerIndex++
      ) {
        const listenerRecord = listenerRecords[listenerIndex];
        if (
          shouldSkipDispatchListenerForPropagationStop(
            listenerRecord,
            previousInstance,
            canaryEventContext
          )
        ) {
          const skippedRecord =
            createSkippedSingleListenerInvocationCanaryRecord(
              dispatchRecord,
              dispatchQueueEntry,
              listenerRecord,
              {
                dispatchQueueEntryIndex,
                listenerIndex,
                useProcessingOrder
              },
              'propagation-stopped'
            );
          invocationRecords.push(skippedRecord);
          propagationSkippedListenerCount++;
          propagationStopDiagnostics.push(
            createDispatchPropagationStopDiagnosticRecord({
              action: 'skip-listener',
              dispatchQueueEntry,
              dispatchRecord,
              listenerRecord,
              propagationState,
              skipped: true
            })
          );
          break;
        }

        prepareDispatchQueueCanaryEventForListener(
          canaryEventContext,
          listenerRecord
        );
        const stopCountBefore =
          propagationState === null
            ? 0
            : propagationState.stopPropagationCallCount;
        const invocationRecord = invokeDispatchListenerRecordForCanary(
          listenerRecord,
          {
            canaryEventContext,
            dispatchQueueEntry,
            dispatchRecord,
            listenerIndex,
            listenerErrorRoutingDiagnosticsEnabled:
              normalizedOptions.enableListenerErrorRoutingDiagnostics,
            selectedFromProcessingOrder: useProcessingOrder
          }
        );
        invocationRecords.push(invocationRecord);
        listenerInvocationCount += invocationRecord.listenerInvocationCount;
        if (invocationRecord.listenerErrorCaptured) {
          listenerErrorCount++;
          if (normalizedOptions.enableListenerErrorRoutingDiagnostics) {
            listenerErrorRoutes.push(
              createDispatchListenerErrorRouteRecord(
                invocationRecord,
                listenerErrorRoutes.length
              )
            );
          }
        }
        if (
          propagationState !== null &&
          propagationState.stopPropagationCallCount > stopCountBefore
        ) {
          propagationStopDiagnostics.push(
            createDispatchPropagationStopDiagnosticRecord({
              action: 'stop-propagation',
              dispatchQueueEntry,
              dispatchRecord,
              listenerRecord,
              propagationState,
              skipped: false
            })
          );
        }
        previousInstance = listenerRecord.targetInst;
      }
      finishDispatchQueueCanaryEventContext(canaryEventContext);
    }
  }

  const frozenInvocationRecords = Object.freeze(invocationRecords.slice());
  const frozenListenerErrorRoutes = Object.freeze(
    listenerErrorRoutes.slice()
  );
  const frozenPropagationStopDiagnostics = Object.freeze(
    propagationStopDiagnostics.slice()
  );
  const invocationOrder = Object.freeze(
    frozenInvocationRecords.map((invocationRecord, index) =>
      Object.freeze({
        currentTarget: invocationRecord.currentTarget,
        dispatchPathIndex: invocationRecord.dispatchPathIndex,
        index,
        invocationStatus: invocationRecord.invocationStatus,
        listenerErrorCaptured: invocationRecord.listenerErrorCaptured,
        phase: invocationRecord.phase,
        registrationName: invocationRecord.registrationName,
        skippedByPropagationStop:
          invocationRecord.invocationStatus ===
          'skipped-propagation-stopped',
        targetInst: invocationRecord.targetInst
      })
    )
  );
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    captureListenerInvocationCount: frozenInvocationRecords.filter(
      (invocationRecord) =>
        invocationRecord.phase === 'capture' &&
        invocationRecord.listenerInvocationCount > 0
    ).length,
    dispatchQueueEntryCount,
    dispatchQueueProcessed: false,
    dispatchRecordCount: normalizedDispatchRecords.length,
    exposesCanaryEvents: false,
    exposesListeners: false,
    exposesNativeEvents: false,
    exposesSyntheticEvent: false,
    invocationOrder,
    invocationRecordCount: frozenInvocationRecords.length,
    invocationStatus:
      frozenInvocationRecords.length === 0
        ? 'skipped-no-listeners'
        : listenerErrorCount === 0
          ? 'invoked-dispatch-queue-canary'
          : 'captured-dispatch-queue-listener-errors',
    kind: DISPATCH_QUEUE_INVOCATION_CANARY_RECORD_KIND,
    listenerCandidateCount,
    listenerErrorCount,
    listenerErrorRouteCount: frozenListenerErrorRoutes.length,
    listenerErrorRoutes: frozenListenerErrorRoutes,
    listenerErrorRoutingBlockedReason:
      LISTENER_ERROR_ROUTING_BLOCKED_CODE,
    listenerErrorRoutingDiagnosticEnabled:
      normalizedOptions.enableListenerErrorRoutingDiagnostics,
    listenerErrorRoutingStatus:
      frozenListenerErrorRoutes.length === 0
        ? 'not-applicable'
        : PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS,
    listenerInvocationCount,
    propagationSkippedListenerCount,
    propagationStopCallCount:
      propagationState === null ? 0 : propagationState.stopPropagationCallCount,
    propagationStopDiagnosticEnabled:
      normalizedOptions.enablePropagationStopDiagnostics,
    propagationStopDiagnosticStatus:
      frozenPropagationStopDiagnostics.length === 0
        ? 'not-applicable'
        : PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS,
    propagationStopDiagnostics: frozenPropagationStopDiagnostics,
    propagationStopNativeCallCount:
      propagationState === null
        ? 0
        : propagationState.nativeStopPropagationCallCount,
    propagationStopBlockedReason:
      PROPAGATION_STOP_DIAGNOSTIC_BLOCKED_CODE,
    propagationStopped:
      propagationState !== null && propagationState.propagationStopped,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    selectedFromProcessingOrder: useProcessingOrder,
    status: PRIVATE_DISPATCH_QUEUE_INVOCATION_CANARY_STATUS,
    syntheticEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    bubbleListenerInvocationCount: frozenInvocationRecords.filter(
      (invocationRecord) =>
        invocationRecord.phase === 'bubble' &&
        invocationRecord.listenerInvocationCount > 0
    ).length,
    willInvokeListeners: false
  });

  dispatchQueueInvocationCanaryRecordPayloads.set(
    record,
    Object.freeze({
      dispatchRecords: Object.freeze(normalizedDispatchRecords.slice()),
      invocationRecords: frozenInvocationRecords,
      listenerErrorRoutes: frozenListenerErrorRoutes,
      options: Object.freeze({
        enableListenerErrorRoutingDiagnostics:
          normalizedOptions.enableListenerErrorRoutingDiagnostics,
        enablePropagationStopDiagnostics:
          normalizedOptions.enablePropagationStopDiagnostics,
        useProcessingOrder
      }),
      propagationStopDiagnostics: frozenPropagationStopDiagnostics
    })
  );

  return record;
}

function normalizeDispatchQueueCanaryOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};

  return {
    enableListenerErrorRoutingDiagnostics:
      normalizedOptions.enableListenerErrorRoutingDiagnostics === true,
    enablePropagationStopDiagnostics:
      normalizedOptions.enablePropagationStopDiagnostics === true,
    useProcessingOrder: normalizedOptions.useProcessingOrder !== false
  };
}

function createDispatchQueuePropagationDiagnosticState(options) {
  if (!options.enablePropagationStopDiagnostics) {
    return null;
  }

  return {
    currentDispatchListenerRecord: null,
    currentTarget: null,
    nativeEvent: null,
    nativeStopPropagationCallCount: 0,
    propagationStopped: false,
    stoppedNativeEvent: null,
    stopPropagationCallCount: 0,
    stopSourceListenerRecord: null
  };
}

function createDispatchQueueCanaryEventContext(
  dispatchQueueEntry,
  entryPayload,
  options,
  propagationState
) {
  if (propagationState === null) {
    return null;
  }

  const listenerRecords = options.useProcessingOrder
    ? entryPayload.processingListenerRecords
    : entryPayload.listenerRecords;
  const firstListenerRecord = listenerRecords[0] || null;
  if (firstListenerRecord === null) {
    return null;
  }

  const firstListenerPayload =
    getDispatchListenerRecordPayload(firstListenerRecord);
  if (firstListenerPayload === null) {
    return null;
  }

  propagationState.nativeEvent = firstListenerPayload.nativeEvent;
  if (propagationState.stoppedNativeEvent !== firstListenerPayload.nativeEvent) {
    propagationState.propagationStopped = false;
  }
  propagationState.nativeStopPropagationCallCount =
    getNativeStopPropagationCallCount(firstListenerPayload.nativeEvent);

  return {
    canaryEvent: createDispatchListenerCanaryEvent(
      firstListenerRecord,
      firstListenerPayload,
      {
        propagationState
      }
    ),
    dispatchQueueEntry,
    propagationState
  };
}

function prepareDispatchQueueCanaryEventForListener(
  canaryEventContext,
  listenerRecord
) {
  if (canaryEventContext === null) {
    return;
  }

  const propagationState = canaryEventContext.propagationState;
  propagationState.currentDispatchListenerRecord = listenerRecord;
  propagationState.currentTarget = listenerRecord.currentTarget;
}

function finishDispatchQueueCanaryEventContext(canaryEventContext) {
  if (canaryEventContext === null) {
    return;
  }

  const propagationState = canaryEventContext.propagationState;
  propagationState.currentDispatchListenerRecord = null;
  propagationState.currentTarget = null;
}

function shouldSkipDispatchListenerForPropagationStop(
  listenerRecord,
  previousInstance,
  canaryEventContext
) {
  if (canaryEventContext === null) {
    return false;
  }

  return (
    canaryEventContext.propagationState.propagationStopped &&
    listenerRecord.targetInst !== previousInstance
  );
}

function createDispatchPropagationStopDiagnosticRecord({
  action,
  dispatchQueueEntry,
  dispatchRecord,
  listenerRecord,
  propagationState,
  skipped
}) {
  return Object.freeze({
    action,
    blockedReason: PROPAGATION_STOP_DIAGNOSTIC_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: listenerRecord.currentTarget,
    diagnosticOnly: true,
    dispatchPathIndex: listenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind: dispatchQueueEntry.kind,
    dispatchRecordKind: dispatchRecord.kind,
    domEventName: listenerRecord.domEventName,
    kind: DISPATCH_PROPAGATION_STOP_DIAGNOSTIC_RECORD_KIND,
    nativeStopPropagationCallCount:
      propagationState.nativeStopPropagationCallCount,
    phase: listenerRecord.phase,
    propagationSkippedListener: skipped,
    propagationStopCallCount:
      propagationState.stopPropagationCallCount,
    propagationStopped: propagationState.propagationStopped,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: listenerRecord.registrationName,
    status: PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS,
    stoppedByCurrentTarget:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.currentTarget,
    stoppedByDispatchPathIndex:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.dispatchPathIndex,
    stoppedByPhase:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.phase,
    stoppedByRegistrationName:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.registrationName,
    stoppedByTargetInst:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.targetInst,
    syntheticEventCount: 0,
    targetInst: listenerRecord.targetInst
  });
}

function createDispatchListenerErrorRouteRecord(
  invocationRecord,
  errorRouteIndex
) {
  const invocationPayload =
    getDispatchListenerInvocationCanaryRecordPayload(invocationRecord);
  const record = Object.freeze({
    blockedReason: LISTENER_ERROR_ROUTING_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: invocationRecord.currentTarget,
    diagnosticOnly: true,
    dispatchPathIndex: invocationRecord.dispatchPathIndex,
    domEventName: invocationRecord.domEventName,
    errorReported: false,
    errorRouteIndex,
    errorRouteTarget: 'reportGlobalError',
    exposesError: false,
    kind: DISPATCH_LISTENER_ERROR_ROUTE_RECORD_KIND,
    listenerErrorCaptured: invocationRecord.listenerErrorCaptured,
    nativeEventType: invocationRecord.nativeEventType,
    phase: invocationRecord.phase,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: invocationRecord.registrationName,
    status: PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS,
    syntheticEventCount: 0,
    targetInst: invocationRecord.targetInst
  });

  dispatchListenerErrorRouteRecordPayloads.set(
    record,
    Object.freeze({
      error: invocationPayload === null ? null : invocationPayload.error,
      invocationPayload,
      invocationRecord
    })
  );

  return record;
}

function invokeDispatchListenerRecordForCanary(dispatchListenerRecord, options) {
  const normalizedListenerRecord =
    assertDispatchListenerRecord(dispatchListenerRecord);
  const payload =
    getDispatchListenerRecordPayload(normalizedListenerRecord);
  const normalizedOptions = isObjectLike(options) ? options : {};
  const dispatchRecord =
    normalizedOptions.dispatchRecord === undefined
      ? null
      : assertEventDispatchRecord(normalizedOptions.dispatchRecord);
  const dispatchQueueEntry =
    normalizedOptions.dispatchQueueEntry === undefined
      ? null
      : assertDispatchQueueEntryRecord(normalizedOptions.dispatchQueueEntry);
  const selectedFromProcessingOrder =
    normalizedOptions.selectedFromProcessingOrder !== false;
  const listenerIndex = normalizeNonNegativeInteger(
    normalizedOptions.listenerIndex,
    0,
    'listenerIndex'
  );
  const canaryEventContext = isObjectLike(
    normalizedOptions.canaryEventContext
  )
    ? normalizedOptions.canaryEventContext
    : null;
  const propagationState =
    canaryEventContext === null
      ? null
      : canaryEventContext.propagationState;
  const propagationStoppedBeforeInvocation =
    propagationState !== null && propagationState.propagationStopped;
  const stopPropagationCallCountBefore =
    propagationState === null ? 0 : propagationState.stopPropagationCallCount;

  if (typeof payload.listener !== 'function') {
    return createSkippedSingleListenerInvocationCanaryRecord(
      dispatchRecord,
      dispatchQueueEntry,
      normalizedListenerRecord,
      {
        dispatchQueueEntryIndex: 0,
        listenerIndex,
        useProcessingOrder: selectedFromProcessingOrder
      },
      'missing-listener'
    );
  }

  const canaryEvent =
    canaryEventContext === null
      ? createDispatchListenerCanaryEvent(normalizedListenerRecord, payload)
      : canaryEventContext.canaryEvent;
  let returnValue;
  let error = null;

  try {
    returnValue = payload.listener.call(undefined, canaryEvent);
  } catch (thrownValue) {
    error = thrownValue;
    returnValue = undefined;
  }

  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    canaryEventKind: DISPATCH_LISTENER_CANARY_EVENT_KIND,
    currentTarget: normalizedListenerRecord.currentTarget,
    dispatchPathIndex: normalizedListenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind:
      dispatchQueueEntry === null ? null : dispatchQueueEntry.kind,
    dispatchQueueProcessed: false,
    dispatchRecordKind:
      dispatchRecord === null ? null : dispatchRecord.kind,
    domEventName: normalizedListenerRecord.domEventName,
    exposesCanaryEvent: false,
    exposesLatestProps: false,
    exposesListener: false,
    exposesNativeEvent: false,
    exposesSyntheticEvent: false,
    inCapturePhase: normalizedListenerRecord.inCapturePhase,
    invocationAttempted: true,
    invocationStatus:
      error === null
        ? 'invoked-single-listener'
        : 'captured-single-listener-error',
    kind: DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND,
    latestPropsStatus: normalizedListenerRecord.latestPropsStatus,
    listenerErrorCaptured: error !== null,
    listenerErrorRoutingBlockedReason:
      LISTENER_ERROR_ROUTING_BLOCKED_CODE,
    listenerErrorRoutingDiagnosticEnabled:
      normalizedOptions.listenerErrorRoutingDiagnosticsEnabled === true,
    listenerErrorRoutingStatus:
      error === null
        ? 'not-applicable'
        : normalizedOptions.listenerErrorRoutingDiagnosticsEnabled === true
          ? PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS
          : 'captured-without-routing-diagnostic',
    listenerIndex,
    listenerInvocationCount: 1,
    listenerReturnStatus:
      error === null ? describeReturnValue(returnValue) : 'not-applicable',
    listenerStatus: normalizedListenerRecord.listenerStatus,
    nativeEventTarget: normalizedListenerRecord.nativeEventTarget,
    nativeEventType: normalizedListenerRecord.nativeEventType,
    phase: normalizedListenerRecord.phase,
    propagationDiagnosticEnabled: propagationState !== null,
    propagationSkipped: false,
    propagationStopCallCount:
      propagationState === null
        ? 0
        : propagationState.stopPropagationCallCount,
    propagationStopCallCountDelta:
      propagationState === null
        ? 0
        : propagationState.stopPropagationCallCount -
          stopPropagationCallCountBefore,
    propagationStopDiagnosticStatus:
      propagationState === null
        ? 'not-applicable'
        : PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS,
    propagationStoppedAfterInvocation:
      propagationState !== null && propagationState.propagationStopped,
    propagationStoppedBeforeInvocation,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: normalizedListenerRecord.registrationName,
    selectedFromProcessingOrder,
    status: PRIVATE_SINGLE_LISTENER_INVOCATION_CANARY_STATUS,
    syntheticEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    targetHostInstanceNode:
      normalizedListenerRecord.targetHostInstanceNode,
    targetHostInstanceToken:
      normalizedListenerRecord.targetHostInstanceToken,
    targetInst: normalizedListenerRecord.targetInst,
    targetInstStatus: normalizedListenerRecord.targetInstStatus,
    willInvokeListeners: false
  });

  dispatchListenerInvocationCanaryRecordPayloads.set(
    record,
    Object.freeze({
      canaryEvent,
      dispatchListenerRecord: normalizedListenerRecord,
      dispatchQueueEntry,
      dispatchRecord,
      error,
      latestProps: payload.latestProps,
      listener: payload.listener,
      nativeEvent: payload.nativeEvent,
      nativeEventTarget: payload.nativeEventTarget,
      pathEntry: payload.pathEntry,
      propagationState,
      returnValue,
      targetListenerLookupRecord: payload.targetListenerLookupRecord
    })
  );

  return record;
}

function createSkippedSingleListenerInvocationCanaryRecord(
  dispatchRecord,
  dispatchQueueEntry,
  dispatchListenerRecord,
  options,
  reason
) {
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    canaryEventKind: DISPATCH_LISTENER_CANARY_EVENT_KIND,
    currentTarget:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.currentTarget,
    dispatchPathIndex:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind:
      dispatchQueueEntry === null ? null : dispatchQueueEntry.kind,
    dispatchQueueProcessed: false,
    dispatchRecordKind: dispatchRecord === null ? null : dispatchRecord.kind,
    domEventName:
      dispatchListenerRecord === null
        ? dispatchRecord === null
          ? null
          : dispatchRecord.domEventName
        : dispatchListenerRecord.domEventName,
    exposesCanaryEvent: false,
    exposesLatestProps: false,
    exposesListener: false,
    exposesNativeEvent: false,
    exposesSyntheticEvent: false,
    inCapturePhase:
      dispatchListenerRecord === null
        ? dispatchRecord !== null && dispatchRecord.inCapturePhase === true
        : dispatchListenerRecord.inCapturePhase,
    invocationAttempted: false,
    invocationStatus: 'skipped-' + reason,
    kind: DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND,
    latestPropsStatus:
      dispatchListenerRecord === null
        ? 'not-applicable'
        : dispatchListenerRecord.latestPropsStatus,
    listenerErrorCaptured: false,
    listenerIndex: options.listenerIndex,
    listenerInvocationCount: 0,
    listenerReturnStatus: 'not-applicable',
    listenerStatus:
      dispatchListenerRecord === null
        ? 'not-applicable'
        : dispatchListenerRecord.listenerStatus,
    nativeEventTarget:
      dispatchListenerRecord === null
        ? dispatchRecord === null
          ? null
          : dispatchRecord.nativeEventTarget
        : dispatchListenerRecord.nativeEventTarget,
    nativeEventType:
      dispatchListenerRecord === null
        ? dispatchRecord === null
          ? null
          : dispatchRecord.nativeEventType
        : dispatchListenerRecord.nativeEventType,
    phase:
      dispatchListenerRecord === null ? null : dispatchListenerRecord.phase,
    listenerErrorRoutingBlockedReason:
      LISTENER_ERROR_ROUTING_BLOCKED_CODE,
    listenerErrorRoutingDiagnosticEnabled: false,
    listenerErrorRoutingStatus: 'not-applicable',
    propagationDiagnosticEnabled: reason === 'propagation-stopped',
    propagationSkipped: reason === 'propagation-stopped',
    propagationStopCallCount: 0,
    propagationStopCallCountDelta: 0,
    propagationStopDiagnosticStatus:
      reason === 'propagation-stopped'
        ? PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS
        : 'not-applicable',
    propagationStoppedAfterInvocation: reason === 'propagation-stopped',
    propagationStoppedBeforeInvocation: reason === 'propagation-stopped',
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.registrationName,
    selectedFromProcessingOrder: options.useProcessingOrder,
    status: PRIVATE_SINGLE_LISTENER_INVOCATION_CANARY_STATUS,
    syntheticEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    targetHostInstanceNode:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.targetHostInstanceNode,
    targetHostInstanceToken:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.targetHostInstanceToken,
    targetInst:
      dispatchListenerRecord === null ? null : dispatchListenerRecord.targetInst,
    targetInstStatus:
      dispatchListenerRecord === null
        ? 'not-applicable'
        : dispatchListenerRecord.targetInstStatus,
    willInvokeListeners: false
  });

  dispatchListenerInvocationCanaryRecordPayloads.set(
    record,
    Object.freeze({
      canaryEvent: null,
      dispatchListenerRecord,
      dispatchQueueEntry,
      dispatchRecord,
      error: null,
      latestProps: null,
      listener: null,
      nativeEvent: null,
      nativeEventTarget:
        dispatchListenerRecord === null
          ? dispatchRecord === null
            ? null
            : dispatchRecord.nativeEventTarget
          : dispatchListenerRecord.nativeEventTarget,
      pathEntry: null,
      returnValue: undefined,
      targetListenerLookupRecord: null
    })
  );

  return record;
}

function createDispatchListenerCanaryEvent(
  dispatchListenerRecord,
  payload,
  options
) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const propagationState = isObjectLike(normalizedOptions.propagationState)
    ? normalizedOptions.propagationState
    : null;
  const event = {
    browserDomEventCompatibilityClaimed: false,
    domEventName: dispatchListenerRecord.domEventName,
    kind: DISPATCH_LISTENER_CANARY_EVENT_KIND,
    nativeEventType: dispatchListenerRecord.nativeEventType,
    phase: dispatchListenerRecord.phase,
    propagationStopDiagnosticEnabled: propagationState !== null,
    publicRootBehaviorChanged: false,
    registrationName: dispatchListenerRecord.registrationName,
    status: 'private-canary-not-synthetic-event',
    syntheticEvent: false,
    target: payload.nativeEventTarget,
    targetInst: dispatchListenerRecord.targetInst,
    type: dispatchListenerRecord.nativeEventType
  };

  if (propagationState === null) {
    event.currentTarget = dispatchListenerRecord.currentTarget;
  } else {
    Object.defineProperties(event, {
      currentTarget: {
        enumerable: true,
        get() {
          return propagationState.currentTarget;
        }
      },
      isPropagationStopped: {
        enumerable: true,
        value() {
          return propagationState.propagationStopped;
        }
      },
      stopPropagation: {
        enumerable: true,
        value() {
          propagationState.propagationStopped = true;
          propagationState.stoppedNativeEvent =
            propagationState.nativeEvent;
          propagationState.stopPropagationCallCount++;
          propagationState.stopSourceListenerRecord =
            propagationState.currentDispatchListenerRecord;
          routeCanaryStopPropagationToNativeEvent(
            propagationState.nativeEvent
          );
          propagationState.nativeStopPropagationCallCount =
            getNativeStopPropagationCallCount(
              propagationState.nativeEvent
            );
        }
      }
    });
  }

  return Object.freeze(event);
}

function routeCanaryStopPropagationToNativeEvent(nativeEvent) {
  if (!isObjectLike(nativeEvent)) {
    return;
  }

  if (typeof nativeEvent.stopPropagation === 'function') {
    nativeEvent.stopPropagation();
    return;
  }

  if (typeof nativeEvent.cancelBubble !== 'unknown') {
    nativeEvent.cancelBubble = true;
  }
}

function getNativeStopPropagationCallCount(nativeEvent) {
  if (
    isObjectLike(nativeEvent) &&
    typeof nativeEvent.stopPropagationCallCount === 'number'
  ) {
    return nativeEvent.stopPropagationCallCount;
  }

  return 0;
}

function SyntheticBaseEvent(
  reactName,
  reactEventType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  const defaultPrevented = getNativeEventDefaultPrevented(nativeEvent);

  this._reactName = reactName;
  this._targetInst = targetInst;
  this.type = reactEventType;
  this.nativeEvent = nativeEvent;
  this.target = nativeEventTarget;
  this.currentTarget = null;
  this.defaultPrevented = defaultPrevented;
  this.isDefaultPrevented = defaultPrevented
    ? functionThatReturnsTrue
    : functionThatReturnsFalse;
  this.isPropagationStopped = functionThatReturnsFalse;
}

SyntheticBaseEvent.prototype.preventDefault = function preventDefault() {
  this.defaultPrevented = true;
  const nativeEvent = this.nativeEvent;
  if (isObjectLike(nativeEvent)) {
    if (typeof nativeEvent.preventDefault === 'function') {
      nativeEvent.preventDefault();
    } else if (typeof nativeEvent.returnValue !== 'unknown') {
      nativeEvent.returnValue = false;
    }
  }
  this.isDefaultPrevented = functionThatReturnsTrue;
};

SyntheticBaseEvent.prototype.stopPropagation = function stopPropagation() {
  const nativeEvent = this.nativeEvent;
  if (isObjectLike(nativeEvent)) {
    if (typeof nativeEvent.stopPropagation === 'function') {
      nativeEvent.stopPropagation();
    } else if (typeof nativeEvent.cancelBubble !== 'unknown') {
      nativeEvent.cancelBubble = true;
    }
  }
  this.isPropagationStopped = functionThatReturnsTrue;
};

SyntheticBaseEvent.prototype.persist = function persist() {};
SyntheticBaseEvent.prototype.isPersistent = functionThatReturnsTrue;

function createSyntheticEventShapeGateFromDispatchRecords(
  dispatchRecords,
  options
) {
  const normalizedDispatchRecords = normalizeDispatchRecordList(
    dispatchRecords
  );
  const normalizedOptions = isObjectLike(options) ? options : {};
  const useProcessingOrder = normalizedOptions.useProcessingOrder !== false;
  const preventDefaultAtPhase = normalizePreventDefaultAtPhase(
    normalizedOptions.preventDefaultAtPhase
  );
  const shapeRecords = [];
  let dispatchQueueEntryCount = 0;
  let listenerCandidateCount = 0;
  let preventDefaultConsumed = false;

  for (
    let dispatchRecordIndex = 0;
    dispatchRecordIndex < normalizedDispatchRecords.length;
    dispatchRecordIndex++
  ) {
    const dispatchRecord = normalizedDispatchRecords[dispatchRecordIndex];
    const dispatchQueue = dispatchRecord.dispatchQueue;

    for (
      let dispatchQueueEntryIndex = 0;
      dispatchQueueEntryIndex < dispatchQueue.entries.length;
      dispatchQueueEntryIndex++
    ) {
      const dispatchQueueEntry = assertDispatchQueueEntryRecord(
        dispatchQueue.entries[dispatchQueueEntryIndex]
      );
      const entryPayload =
        getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
      const listenerRecords = useProcessingOrder
        ? entryPayload.processingListenerRecords
        : entryPayload.listenerRecords;
      dispatchQueueEntryCount++;
      listenerCandidateCount += listenerRecords.length;

      for (
        let listenerIndex = 0;
        listenerIndex < listenerRecords.length;
        listenerIndex++
      ) {
        const listenerRecord = listenerRecords[listenerIndex];
        const shouldPreventDefault =
          preventDefaultAtPhase !== null &&
          preventDefaultConsumed === false &&
          listenerRecord.phase === preventDefaultAtPhase;
        const shapeRecord =
          createSyntheticEventShapeRecordForDispatchListenerRecord(
            listenerRecord,
            {
              dispatchQueueEntry,
              dispatchRecord,
              listenerIndex,
              preventDefault: shouldPreventDefault,
              selectedFromProcessingOrder: useProcessingOrder
            }
          );
        shapeRecords.push(shapeRecord);
        if (shouldPreventDefault) {
          preventDefaultConsumed = true;
        }
      }
    }
  }

  const frozenShapeRecords = Object.freeze(shapeRecords.slice());
  const syntheticEventShapeOrder = Object.freeze(
    frozenShapeRecords.map((shapeRecord, index) =>
      Object.freeze({
        currentTarget: shapeRecord.currentTargetDuringDispatch,
        defaultPreventedAfterAction:
          shapeRecord.defaultPreventedAfterAction,
        dispatchPathIndex: shapeRecord.dispatchPathIndex,
        index,
        phase: shapeRecord.phase,
        preventDefaultInvoked: shapeRecord.preventDefaultInvoked,
        registrationName: shapeRecord.registrationName,
        target: shapeRecord.target,
        targetInst: shapeRecord.targetInst
      })
    )
  );
  const preventDefaultShapeCount = frozenShapeRecords.filter(
    (shapeRecord) => shapeRecord.preventDefaultInvoked
  ).length;
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    broadDispatchQueueProcessing: false,
    browserDomEventCompatibilityClaimed: false,
    dispatchQueueEntryCount,
    dispatchQueueProcessed: false,
    dispatchRecordCount: normalizedDispatchRecords.length,
    exposesSyntheticEvent: false,
    kind: SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND,
    listenerCandidateCount,
    listenerInvocationCount: 0,
    preventDefaultAtPhase,
    preventDefaultShapeCount,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    selectedFromProcessingOrder: useProcessingOrder,
    status: PRIVATE_SYNTHETIC_EVENT_SHAPE_GATE_STATUS,
    syntheticEventCompatibilityClaimed: false,
    syntheticEventCount: frozenShapeRecords.length,
    syntheticEventDispatchCount: 0,
    syntheticEventShapeCount: frozenShapeRecords.length,
    syntheticEventShapeOrder,
    syntheticEventShapeRecords: frozenShapeRecords,
    willInvokeListeners: false
  });

  syntheticEventShapeGateRecordPayloads.set(
    record,
    Object.freeze({
      dispatchRecords: Object.freeze(normalizedDispatchRecords.slice()),
      options: Object.freeze({
        preventDefaultAtPhase,
        useProcessingOrder
      }),
      shapeRecords: frozenShapeRecords
    })
  );

  return record;
}

function createSyntheticEventShapeRecordForDispatchListenerRecord(
  dispatchListenerRecord,
  options
) {
  const normalizedListenerRecord =
    assertDispatchListenerRecord(dispatchListenerRecord);
  const payload =
    getDispatchListenerRecordPayload(normalizedListenerRecord);
  const normalizedOptions = isObjectLike(options) ? options : {};
  const dispatchRecord =
    normalizedOptions.dispatchRecord === undefined
      ? null
      : assertEventDispatchRecord(normalizedOptions.dispatchRecord);
  const dispatchQueueEntry =
    normalizedOptions.dispatchQueueEntry === undefined
      ? null
      : assertDispatchQueueEntryRecord(normalizedOptions.dispatchQueueEntry);
  const shouldPreventDefault = normalizedOptions.preventDefault === true;
  const selectedFromProcessingOrder =
    normalizedOptions.selectedFromProcessingOrder !== false;
  const listenerIndex =
    typeof normalizedOptions.listenerIndex === 'number'
      ? normalizedOptions.listenerIndex
      : 0;
  const syntheticEvent = new SyntheticBaseEvent(
    normalizedListenerRecord.registrationName,
    normalizedListenerRecord.nativeEventType,
    normalizedListenerRecord.targetInst,
    payload.nativeEvent,
    payload.nativeEventTarget
  );
  const beforeDispatch = createSyntheticEventShapeSnapshot(
    syntheticEvent,
    payload.nativeEvent
  );

  syntheticEvent.currentTarget = normalizedListenerRecord.currentTarget;
  const duringBeforeAction = createSyntheticEventShapeSnapshot(
    syntheticEvent,
    payload.nativeEvent
  );

  if (shouldPreventDefault) {
    syntheticEvent.preventDefault();
  }

  const duringAfterAction = createSyntheticEventShapeSnapshot(
    syntheticEvent,
    payload.nativeEvent
  );
  syntheticEvent.currentTarget = null;
  const afterDispatch = createSyntheticEventShapeSnapshot(
    syntheticEvent,
    payload.nativeEvent
  );
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    constructorName: afterDispatch.constructorName,
    currentTargetAfterAction: duringAfterAction.currentTarget,
    currentTargetAfterDispatch: afterDispatch.currentTarget,
    currentTargetBeforeDispatch: beforeDispatch.currentTarget,
    currentTargetDuringDispatch: duringBeforeAction.currentTarget,
    defaultPreventedAfterAction: duringAfterAction.defaultPrevented,
    defaultPreventedAfterDispatch: afterDispatch.defaultPrevented,
    defaultPreventedBeforeAction: duringBeforeAction.defaultPrevented,
    dispatchPathIndex: normalizedListenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind:
      dispatchQueueEntry === null ? null : dispatchQueueEntry.kind,
    dispatchQueueProcessed: false,
    dispatchRecordKind:
      dispatchRecord === null ? null : dispatchRecord.kind,
    domEventName: normalizedListenerRecord.domEventName,
    exposesSyntheticEvent: false,
    hasPersist: afterDispatch.hasPersist,
    hasPreventDefault: afterDispatch.hasPreventDefault,
    initialDefaultPrevented: beforeDispatch.defaultPrevented,
    isDefaultPreventedAfterAction:
      duringAfterAction.isDefaultPrevented,
    isDefaultPreventedAfterDispatch: afterDispatch.isDefaultPrevented,
    isDefaultPreventedBeforeAction:
      duringBeforeAction.isDefaultPrevented,
    kind: SYNTHETIC_EVENT_SHAPE_RECORD_KIND,
    listenerIndex,
    listenerInvocationCount: 0,
    nativeDefaultPreventedAfterAction:
      duringAfterAction.nativeDefaultPrevented,
    nativeDefaultPreventedAfterDispatch:
      afterDispatch.nativeDefaultPrevented,
    nativeDefaultPreventedBeforeAction:
      duringBeforeAction.nativeDefaultPrevented,
    nativeEventPreventDefaultCallCountAfterAction:
      duringAfterAction.nativePreventDefaultCallCount,
    nativeEventPreventDefaultCallCountBeforeAction:
      duringBeforeAction.nativePreventDefaultCallCount,
    nativeEventType: normalizedListenerRecord.nativeEventType,
    phase: normalizedListenerRecord.phase,
    preventDefaultApplied:
      shouldPreventDefault && duringAfterAction.defaultPrevented === true,
    preventDefaultInvoked: shouldPreventDefault,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: normalizedListenerRecord.registrationName,
    selectedFromProcessingOrder,
    status: PRIVATE_SYNTHETIC_EVENT_SHAPE_STATUS,
    syntheticEventCompatibilityClaimed: false,
    syntheticEventDispatchCount: 0,
    syntheticEventShapeOnly: true,
    target: syntheticEvent.target,
    targetInst: normalizedListenerRecord.targetInst,
    targetInstStatus: normalizedListenerRecord.targetInstStatus,
    targetMatchesNativeEventTarget:
      syntheticEvent.target === payload.nativeEventTarget,
    type: syntheticEvent.type,
    willInvokeListener: false
  });

  syntheticEventShapeRecordPayloads.set(
    record,
    Object.freeze({
      afterDispatch,
      beforeDispatch,
      dispatchListenerRecord: normalizedListenerRecord,
      dispatchQueueEntry,
      dispatchRecord,
      duringAfterAction,
      duringBeforeAction,
      nativeEvent: payload.nativeEvent,
      nativeEventTarget: payload.nativeEventTarget,
      syntheticEvent
    })
  );

  return record;
}

function createSyntheticEventShapeSnapshot(syntheticEvent, nativeEvent) {
  return Object.freeze({
    constructorName:
      syntheticEvent.constructor &&
      typeof syntheticEvent.constructor.name === 'string'
        ? syntheticEvent.constructor.name
        : null,
    currentTarget: syntheticEvent.currentTarget,
    defaultPrevented: syntheticEvent.defaultPrevented === true,
    hasPersist: typeof syntheticEvent.persist === 'function',
    hasPreventDefault:
      typeof syntheticEvent.preventDefault === 'function',
    isDefaultPrevented: syntheticEvent.isDefaultPrevented(),
    nativeDefaultPrevented: getNativeEventDefaultPrevented(nativeEvent),
    nativePreventDefaultCallCount:
      getNativeEventPreventDefaultCallCount(nativeEvent),
    target: syntheticEvent.target,
    type: syntheticEvent.type
  });
}

function getNativeEventDefaultPrevented(nativeEvent) {
  if (!isObjectLike(nativeEvent)) {
    return false;
  }
  if (nativeEvent.defaultPrevented != null) {
    return nativeEvent.defaultPrevented === true;
  }
  return nativeEvent.returnValue === false;
}

function getNativeEventPreventDefaultCallCount(nativeEvent) {
  return isObjectLike(nativeEvent) &&
    typeof nativeEvent.preventDefaultCallCount === 'number'
    ? nativeEvent.preventDefaultCallCount
    : null;
}

function normalizePreventDefaultAtPhase(value) {
  if (value === undefined || value === null || value === false) {
    return null;
  }
  if (value === 'capture' || value === 'bubble') {
    return value;
  }
  throw createPluginEventSystemError(
    'Expected preventDefaultAtPhase to be "capture", "bubble", or null.',
    INVALID_EVENT_DISPATCH_RECORD_CODE
  );
}

function getSyntheticEventShapeRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return syntheticEventShapeRecordPayloads.get(record) || null;
}

function isSyntheticEventShapeRecord(record) {
  return getSyntheticEventShapeRecordPayload(record) !== null;
}

function getSyntheticEventShapeGateRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return syntheticEventShapeGateRecordPayloads.get(record) || null;
}

function isSyntheticEventShapeGateRecord(record) {
  return getSyntheticEventShapeGateRecordPayload(record) !== null;
}

function getDispatchListenerInvocationCanaryRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchListenerInvocationCanaryRecordPayloads.get(record) || null;
}

function isDispatchListenerInvocationCanaryRecord(record) {
  return getDispatchListenerInvocationCanaryRecordPayload(record) !== null;
}

function getDispatchQueueInvocationCanaryRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchQueueInvocationCanaryRecordPayloads.get(record) || null;
}

function isDispatchQueueInvocationCanaryRecord(record) {
  return getDispatchQueueInvocationCanaryRecordPayload(record) !== null;
}

function getDispatchListenerErrorRouteRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchListenerErrorRouteRecordPayloads.get(record) || null;
}

function isDispatchListenerErrorRouteRecord(record) {
  return getDispatchListenerErrorRouteRecordPayload(record) !== null;
}

function assertEventDispatchRecord(record) {
  if (
    !isObjectLike(record) ||
    record.kind !== EVENT_DISPATCH_RECORD_KIND ||
    !isObjectLike(record.dispatchQueue) ||
    record.dispatchQueue.kind !== DISPATCH_QUEUE_RECORD_KIND ||
    !Array.isArray(record.dispatchQueue.entries)
  ) {
    throw createPluginEventSystemError(
      'Cannot invoke a React DOM event listener canary without a private event dispatch record.',
      INVALID_EVENT_DISPATCH_RECORD_CODE
    );
  }

  return record;
}

function assertDispatchQueueEntryRecord(record) {
  if (!isDispatchQueueEntryRecord(record)) {
    throw createPluginEventSystemError(
      'Cannot invoke a React DOM event listener canary without a private dispatch queue entry record.',
      INVALID_EVENT_DISPATCH_RECORD_CODE
    );
  }

  return record;
}

function assertDispatchListenerRecord(record) {
  if (!isDispatchListenerRecord(record)) {
    throw createPluginEventSystemError(
      'Cannot invoke a React DOM event listener canary without a private dispatch listener record.',
      INVALID_DISPATCH_LISTENER_RECORD_CODE
    );
  }

  return record;
}

function normalizeSingleListenerCanaryOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};

  return {
    dispatchQueueEntryIndex: normalizeNonNegativeInteger(
      normalizedOptions.dispatchQueueEntryIndex,
      0,
      'dispatchQueueEntryIndex'
    ),
    listenerIndex: normalizeNonNegativeInteger(
      normalizedOptions.listenerIndex,
      0,
      'listenerIndex'
    ),
    useProcessingOrder: normalizedOptions.useProcessingOrder !== false
  };
}

function normalizeDispatchRecordList(dispatchRecords) {
  if (Array.isArray(dispatchRecords)) {
    return dispatchRecords.map((dispatchRecord) =>
      assertEventDispatchRecord(dispatchRecord)
    );
  }

  return [assertEventDispatchRecord(dispatchRecords)];
}

function normalizeNonNegativeInteger(value, fallback, fieldName) {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw createPluginEventSystemError(
      `Expected ${fieldName} to be a non-negative integer.`,
      INVALID_EVENT_DISPATCH_RECORD_CODE
    );
  }

  return value;
}

function describeReturnValue(value) {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
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

function createHydrationReplayEventQueueDiagnostic(dispatchRecords, options) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const source =
    typeof normalizedOptions.source === 'string'
      ? normalizedOptions.source
      : 'private-event-dispatch-records';
  const normalizedDispatchRecords =
    normalizeHydrationReplayDispatchRecords(dispatchRecords);
  const markerReplayTargetCandidates = Object.freeze(
    Array.isArray(normalizedOptions.markerReplayTargetCandidates)
      ? normalizedOptions.markerReplayTargetCandidates.slice()
      : []
  );
  const sourceDehydratedTargetResolution =
    normalizedOptions.dehydratedTargetResolution ||
    normalizedOptions.targetResolutionDiagnostics;
  const dehydratedTargetResolutionDiagnostics =
    normalizedDispatchRecords.length === 0 &&
    sourceDehydratedTargetResolution !== undefined &&
    sourceDehydratedTargetResolution !== null
      ? getSourceDehydratedTargetResolutionDiagnostic({
          dehydratedTargetResolution: sourceDehydratedTargetResolution
        })
      : createHydrationDehydratedTargetResolutionDiagnostic(
          normalizedDispatchRecords,
          {
            dehydratedTargetResolution: sourceDehydratedTargetResolution,
            markerReplayTargetCandidates,
            source
          }
        );
  const hydratableEventTargetLookups = Array.isArray(
    dehydratedTargetResolutionDiagnostics.hydratableEventTargetLookups
  )
    ? dehydratedTargetResolutionDiagnostics.hydratableEventTargetLookups
    : [];
  const blockedEventReplayTargets = Object.freeze(
    normalizedDispatchRecords.map((dispatchRecord, index) =>
      createHydrationReplayEventQueueEntryRecord(
        dispatchRecord,
        index,
        hydratableEventTargetLookups[index] || null
      )
    )
  );
  const replayQueueDrainOrderDiagnostics =
    createHydrationReplayQueueDrainOrderDiagnostic(
      blockedEventReplayTargets,
      {
        dehydratedTargetResolutionDiagnostics,
        source
      }
    );

  return Object.freeze({
    kind: HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND,
    status:
      blockedEventReplayTargets.length === 0
        ? 'blocked-no-event-replay-targets-recorded'
        : 'blocked-event-replay-targets-recorded',
    source:
      source,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    hostInstanceHydrationAttempted: false,
    hasScheduledReplayAttempt: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    markerReplayTargetCandidateCount: markerReplayTargetCandidates.length,
    markerReplayTargetCandidates,
    dehydratedTargetResolutionDiagnostics,
    targetResolutionDiagnosticsAccepted:
      dehydratedTargetResolutionDiagnostics.kind ===
      HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND,
    dehydratedRootOwnerStatus:
      dehydratedTargetResolutionDiagnostics.dehydratedRootOwner.status,
    dehydratedBoundaryOwnerCount:
      dehydratedTargetResolutionDiagnostics.dehydratedBoundaryOwnerCount,
    hydratableEventTargetLookupCount:
      dehydratedTargetResolutionDiagnostics.hydratableEventTargetLookupCount,
    eventDispatchRecordCount: normalizedDispatchRecords.length,
    blockedEventReplayTargetCount: blockedEventReplayTargets.length,
    queuedEventReplayTargetCount: 0,
    replayedEventCount: 0,
    eventQueueOrder:
      createHydrationReplayEventQueueOrder(blockedEventReplayTargets),
    priorityQueueOrder:
      createHydrationReplayEventPriorityOrder(blockedEventReplayTargets),
    replayQueueDrainOrderDiagnostics,
    drainOrderDiagnosticsAccepted:
      replayQueueDrainOrderDiagnostics.kind ===
      HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND,
    drainOrderCount: replayQueueDrainOrderDiagnostics.drainOrderCount,
    drainOrder: replayQueueDrainOrderDiagnostics.drainOrder,
    blockedEventReplayTargets
  });
}

function normalizeHydrationReplayDispatchRecords(dispatchRecords) {
  if (dispatchRecords === undefined || dispatchRecords === null) {
    return [];
  }

  if (!Array.isArray(dispatchRecords)) {
    return [assertEventDispatchRecord(dispatchRecords)];
  }

  return dispatchRecords.map((dispatchRecord) =>
    assertEventDispatchRecord(dispatchRecord)
  );
}

function createHydrationDehydratedTargetResolutionDiagnostic(
  dispatchRecords,
  options
) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const normalizedDispatchRecords =
    normalizeHydrationReplayDispatchRecords(dispatchRecords);
  const sourceDiagnostic = getSourceDehydratedTargetResolutionDiagnostic(
    normalizedOptions
  );
  const sourcePayload =
    sourceDiagnostic === null
      ? null
      : hydrationDehydratedTargetResolutionDiagnosticPayloads.get(
          sourceDiagnostic
        ) || null;
  const markerReplayTargetCandidates =
    normalizeMarkerReplayTargetCandidates(normalizedOptions, sourcePayload);
  const rootContainer = normalizeTargetResolutionRootContainer(
    normalizedOptions,
    sourcePayload
  );
  const markerDiagnostics = normalizeTargetResolutionMarkerDiagnostics(
    normalizedOptions,
    sourcePayload
  );
  const rootRecordId = normalizeTargetResolutionStringOption(
    normalizedOptions.rootRecordId,
    sourcePayload && sourcePayload.rootRecordId,
    sourceDiagnostic && sourceDiagnostic.rootRecordId
  );
  const rootKind = normalizeTargetResolutionStringOption(
    normalizedOptions.rootKind,
    sourcePayload && sourcePayload.rootKind,
    sourceDiagnostic && sourceDiagnostic.rootKind
  );
  const rootTag = normalizeTargetResolutionStringOption(
    normalizedOptions.rootTag,
    sourcePayload && sourcePayload.rootTag,
    sourceDiagnostic && sourceDiagnostic.rootTag
  );
  const rootOwner = createHydrationDehydratedRootOwnerRecord({
    rootContainer,
    rootKind,
    rootRecordId,
    rootTag
  });
  const boundaryOwners = createHydrationDehydratedBoundaryOwnerRecords(
    markerReplayTargetCandidates,
    {
      rootRecordId
    }
  );
  const targetLookups = Object.freeze(
    normalizedDispatchRecords.map((dispatchRecord, inputOrder) =>
      createHydratableEventTargetLookupRecord(dispatchRecord, inputOrder, {
        boundaryOwners,
        markerDiagnostics,
        rootContainer,
        rootOwner
      })
    )
  );
  const record = Object.freeze({
    kind: HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND,
    status:
      targetLookups.length === 0
        ? 'blocked-no-hydratable-event-targets-recorded'
        : 'blocked-hydratable-event-targets-recorded',
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-target-resolution',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    eventTargetResolutionSupported: false,
    hydrationReplaySupported: false,
    eventReplaySupported: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    blockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    hydrationReplayBlockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    rootRecordId,
    rootKind,
    rootTag,
    dehydratedRootOwner: rootOwner,
    dehydratedRootOwnerStatus: rootOwner.status,
    markerReplayTargetCandidateCount: markerReplayTargetCandidates.length,
    markerReplayTargetCandidates,
    dehydratedBoundaryOwnerCount: boundaryOwners.length,
    dehydratedBoundaryOwners: boundaryOwners,
    eventDispatchRecordCount: normalizedDispatchRecords.length,
    hydratableEventTargetLookupCount: targetLookups.length,
    hydratableEventTargetLookups: targetLookups,
    queuedEventReplayTargetCount: 0,
    replayedEventCount: 0
  });

  hydrationDehydratedTargetResolutionDiagnosticPayloads.set(
    record,
    Object.freeze({
      markerDiagnostics,
      markerReplayTargetCandidates,
      rootContainer,
      rootKind,
      rootRecordId,
      rootTag
    })
  );

  return record;
}

function getSourceDehydratedTargetResolutionDiagnostic(options) {
  const sourceDiagnostic =
    options.dehydratedTargetResolution ||
    options.targetResolutionDiagnostics ||
    null;
  if (sourceDiagnostic === null || sourceDiagnostic === undefined) {
    return null;
  }

  if (!isHydrationDehydratedTargetResolutionDiagnostic(sourceDiagnostic)) {
    throw createPluginEventSystemError(
      'Cannot resolve hydration event targets without a private dehydrated target-resolution diagnostic.',
      INVALID_EVENT_DISPATCH_RECORD_CODE
    );
  }

  return sourceDiagnostic;
}

function getHydrationDehydratedTargetResolutionDiagnosticPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return (
    hydrationDehydratedTargetResolutionDiagnosticPayloads.get(record) ||
    null
  );
}

function isHydrationDehydratedTargetResolutionDiagnostic(record) {
  return (
    isObjectLike(record) &&
    record.kind === HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND &&
    hydrationDehydratedTargetResolutionDiagnosticPayloads.has(record)
  );
}

function normalizeMarkerReplayTargetCandidates(options, sourcePayload) {
  if (Array.isArray(options.markerReplayTargetCandidates)) {
    return Object.freeze(options.markerReplayTargetCandidates.slice());
  }

  if (
    sourcePayload !== null &&
    Array.isArray(sourcePayload.markerReplayTargetCandidates)
  ) {
    return Object.freeze(sourcePayload.markerReplayTargetCandidates.slice());
  }

  return Object.freeze([]);
}

function normalizeTargetResolutionRootContainer(options, sourcePayload) {
  if (Object.prototype.hasOwnProperty.call(options, 'rootContainer')) {
    return isObjectLike(options.rootContainer) ? options.rootContainer : null;
  }

  return sourcePayload === null ? null : sourcePayload.rootContainer;
}

function normalizeTargetResolutionMarkerDiagnostics(options, sourcePayload) {
  if (
    Object.prototype.hasOwnProperty.call(options, 'markerDiagnostics') &&
    isObjectLike(options.markerDiagnostics)
  ) {
    return options.markerDiagnostics;
  }

  return sourcePayload === null ? null : sourcePayload.markerDiagnostics;
}

function normalizeTargetResolutionStringOption(
  optionValue,
  payloadValue,
  recordValue
) {
  if (typeof optionValue === 'string') {
    return optionValue;
  }
  if (typeof payloadValue === 'string') {
    return payloadValue;
  }
  if (typeof recordValue === 'string') {
    return recordValue;
  }
  return null;
}

function createHydrationDehydratedRootOwnerRecord({
  rootContainer,
  rootKind,
  rootRecordId,
  rootTag
}) {
  return Object.freeze({
    kind: HYDRATION_DEHYDRATED_ROOT_OWNER_RECORD_KIND,
    status:
      rootContainer === null
        ? 'blocked-no-dehydrated-root-container-payload'
        : 'recorded-unsupported-dehydrated-root-owner',
    rootRecordId,
    rootKind,
    rootTag,
    dehydrated: true,
    unsupported: true,
    canHydrate: false,
    hydrationRootSupported: false,
    targetResolutionSupported: false,
    containerInfo: describeHydrationReplayEventTargetInfo(rootContainer)
  });
}

function createHydrationDehydratedBoundaryOwnerRecords(
  markerReplayTargetCandidates,
  options
) {
  return Object.freeze(
    markerReplayTargetCandidates.map((candidate, index) =>
      Object.freeze({
        kind: HYDRATION_DEHYDRATED_BOUNDARY_OWNER_RECORD_KIND,
        status: 'recorded-marker-derived-dehydrated-boundary-owner',
        ownerId: createHydrationBoundaryOwnerId(
          options.rootRecordId,
          index
        ),
        index,
        rootRecordId: options.rootRecordId,
        area: candidate.area || null,
        boundaryKind:
          typeof candidate.replayTargetKind === 'string'
            ? candidate.replayTargetKind
            : inferHydrationReplayTargetKind(candidate.contractId),
        contractId:
          typeof candidate.contractId === 'string'
            ? candidate.contractId
            : null,
        markerKind: typeof candidate.kind === 'string' ? candidate.kind : null,
        path: typeof candidate.path === 'string' ? candidate.path : null,
        dehydrated: true,
        rootOwned: true,
        canHydrate: false,
        queueEligible: false,
        queued: false,
        blockedReason: HYDRATION_REPLAY_BLOCKED_CODE
      })
    )
  );
}

function createHydrationBoundaryOwnerId(rootRecordId, index) {
  const prefix =
    typeof rootRecordId === 'string' && rootRecordId !== ''
      ? rootRecordId
      : 'hydration-target-resolution';
  return `${prefix}:boundary:${index}`;
}

function inferHydrationReplayTargetKind(contractId) {
  if (typeof contractId !== 'string') {
    return 'unknown';
  }
  if (contractId.startsWith('activity-')) {
    return 'activity-boundary';
  }
  if (contractId.startsWith('suspense-')) {
    return 'suspense-boundary';
  }
  if (contractId.startsWith('form-state-')) {
    return 'form-state';
  }
  return 'unknown';
}

function createHydratableEventTargetLookupRecord(
  dispatchRecord,
  inputOrder,
  options
) {
  const nativeEventTarget = dispatchRecord.nativeEventTarget;
  const rootContainer = options.rootContainer;
  const targetPathRecord = findHydrationTargetPath(
    rootContainer,
    nativeEventTarget
  );
  const targetWithinRootContainer =
    rootContainer !== null &&
    (targetPathRecord.found ||
      isHydrationTargetDescendantOfRoot(rootContainer, nativeEventTarget));
  const targetContainerMatchesRoot =
    rootContainer !== null && dispatchRecord.targetContainer === rootContainer;
  const rootOwned = targetContainerMatchesRoot || targetWithinRootContainer;
  const boundaryOwner = rootOwned
    ? findDehydratedBoundaryOwnerForTargetPath(
        targetPathRecord.path,
        options.boundaryOwners,
        options.markerDiagnostics
      )
    : null;
  const queueInfo = getHydrationReplayEventQueueInfo(
    dispatchRecord.domEventName
  );
  const targetInstResolved = dispatchRecord.targetInst !== null;
  const lookupStatus = getHydratableEventTargetLookupStatus({
    boundaryOwner,
    rootOwned,
    targetInstResolved,
    targetPathRecord
  });

  return Object.freeze({
    kind: HYDRATION_HYDRATABLE_EVENT_TARGET_LOOKUP_RECORD_KIND,
    status: lookupStatus,
    inputOrder,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    domEventName: dispatchRecord.domEventName,
    nativeEventType: dispatchRecord.nativeEventType,
    eventPriorityLabel: dispatchRecord.eventPriorityLabel,
    eventPriorityLane: dispatchRecord.eventPriorityLane,
    eventPriorityName: dispatchRecord.eventPriorityName,
    queueCategory: queueInfo.queueCategory,
    queueName: queueInfo.queueName,
    replayableEvent: queueInfo.replayableEvent,
    targetContainerMatchesRoot,
    targetWithinRootContainer,
    rootOwnershipStatus: getHydrationRootOwnershipStatus({
      rootContainer,
      rootOwned
    }),
    dehydratedRootOwnerStatus: options.rootOwner.status,
    dehydratedBoundaryOwner: boundaryOwner,
    dehydratedBoundaryOwnerId:
      boundaryOwner === null ? null : boundaryOwner.ownerId,
    dehydratedBoundaryOwnerStatus:
      boundaryOwner === null ? 'not-found' : boundaryOwner.status,
    blockedOnKind:
      boundaryOwner === null
        ? rootOwned
          ? 'dehydrated-root'
          : null
        : boundaryOwner.boundaryKind,
    blockedOnStatus:
      boundaryOwner === null
        ? rootOwned
          ? 'blocked-on-dehydrated-root'
          : 'unavailable-no-dehydrated-owner'
        : 'blocked-on-dehydrated-boundary',
    targetPath: targetPathRecord.path,
    targetPathStatus: targetPathRecord.status,
    targetNodeInfo: describeHydrationReplayEventTargetInfo(nativeEventTarget),
    targetContainerInfo: describeHydrationReplayEventTargetInfo(
      dispatchRecord.targetContainer
    ),
    targetDispatchPathLength: dispatchRecord.targetDispatchPathLength,
    targetDispatchPathStatus: dispatchRecord.targetDispatchPathStatus,
    targetHostInstanceStatus: dispatchRecord.targetHostInstanceStatus,
    targetInstStatus: dispatchRecord.targetInstStatus,
    targetListenerFound: dispatchRecord.targetListenerFound,
    targetListenerLookupCount: dispatchRecord.targetListenerLookupCount,
    targetListenerLookupStatus: dispatchRecord.targetListenerLookupStatus,
    targetResolutionBlockedReason:
      dispatchRecord.targetResolutionBlockedReason,
    targetResolutionStatus: dispatchRecord.targetResolutionStatus,
    targetResolutionSupported: false,
    queued: false,
    queueMutationAllowed: false,
    replayQueueDrained: false,
    willDrainReplayQueues: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false,
    blockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    hydrationReplayBlockedReason: HYDRATION_REPLAY_BLOCKED_CODE
  });
}

function getHydratableEventTargetLookupStatus({
  boundaryOwner,
  rootOwned,
  targetInstResolved,
  targetPathRecord
}) {
  if (targetInstResolved) {
    return 'skipped-mounted-host-instance-target';
  }
  if (!rootOwned) {
    return 'blocked-no-dehydrated-owner';
  }
  if (boundaryOwner !== null) {
    return 'blocked-on-dehydrated-boundary';
  }
  if (targetPathRecord.found) {
    return 'blocked-on-dehydrated-root';
  }
  return 'blocked-on-dehydrated-root-unlisted-target';
}

function getHydrationRootOwnershipStatus({rootContainer, rootOwned}) {
  if (rootContainer === null) {
    return 'unavailable-no-dehydrated-root-container-payload';
  }
  return rootOwned
    ? 'owned-by-dehydrated-root'
    : 'not-owned-by-dehydrated-root';
}

function findHydrationTargetPath(rootContainer, targetNode) {
  if (rootContainer === null) {
    return Object.freeze({
      found: false,
      path: null,
      status: 'unavailable-no-root-container'
    });
  }
  if (!isObjectLike(targetNode)) {
    return Object.freeze({
      found: false,
      path: null,
      status: 'unavailable-non-object-target'
    });
  }
  if (targetNode === rootContainer) {
    return Object.freeze({
      found: true,
      path: 'container',
      status: 'found-container-target'
    });
  }

  const visitedNodes = new Set();
  const path = findHydrationTargetPathInChildren(
    rootContainer,
    'container',
    targetNode,
    visitedNodes
  );
  if (path !== null) {
    return Object.freeze({
      found: true,
      path,
      status: 'found-in-container-child-list'
    });
  }
  if (isHydrationTargetDescendantOfRoot(rootContainer, targetNode)) {
    return Object.freeze({
      found: false,
      path: null,
      status: 'owned-by-parent-chain-not-child-list'
    });
  }

  return Object.freeze({
    found: false,
    path: null,
    status: 'not-contained-in-dehydrated-root'
  });
}

function findHydrationTargetPathInChildren(
  parentNode,
  parentPath,
  targetNode,
  visitedNodes
) {
  if (!isObjectLike(parentNode) || visitedNodes.has(parentNode)) {
    return null;
  }
  visitedNodes.add(parentNode);

  const childNodes = getHydrationChildNodesSnapshot(parentNode);
  for (let index = 0; index < childNodes.length; index++) {
    const childNode = childNodes[index];
    if (!isObjectLike(childNode)) {
      continue;
    }

    const path = `${parentPath}.childNodes[${index}]`;
    if (childNode === targetNode) {
      return path;
    }

    const childPath = findHydrationTargetPathInChildren(
      childNode,
      path,
      targetNode,
      visitedNodes
    );
    if (childPath !== null) {
      return childPath;
    }
  }

  return null;
}

function isHydrationTargetDescendantOfRoot(rootContainer, targetNode) {
  let currentNode = isObjectLike(targetNode) ? targetNode : null;
  while (currentNode !== null) {
    if (currentNode === rootContainer) {
      return true;
    }
    currentNode = isObjectLike(currentNode.parentNode)
      ? currentNode.parentNode
      : null;
  }
  return false;
}

function getHydrationChildNodesSnapshot(node) {
  if (!isObjectLike(node)) {
    return [];
  }

  const childNodes = node.childNodes;
  if (Array.isArray(childNodes)) {
    return childNodes.slice();
  }
  if (
    isObjectLike(childNodes) &&
    Number.isSafeInteger(childNodes.length) &&
    childNodes.length >= 0
  ) {
    const snapshot = [];
    for (let index = 0; index < childNodes.length; index += 1) {
      snapshot.push(childNodes[index]);
    }
    return snapshot;
  }

  return [];
}

function findDehydratedBoundaryOwnerForTargetPath(
  targetPath,
  boundaryOwners,
  markerDiagnostics
) {
  const targetPositions = getHydrationTargetPathPositions(targetPath);
  if (targetPositions.length === 0) {
    return null;
  }

  const boundaryOwnersByPath = new Map();
  for (const boundaryOwner of boundaryOwners) {
    if (typeof boundaryOwner.path === 'string') {
      boundaryOwnersByPath.set(boundaryOwner.path, boundaryOwner);
    }
  }

  const markerRows =
    markerDiagnostics !== null && Array.isArray(markerDiagnostics.markers)
      ? markerDiagnostics.markers
      : [];
  let selectedOwner = null;
  for (const targetPosition of targetPositions) {
    const boundaryStack = [];
    const sameParentMarkers = markerRows
      .map((marker) => ({
        marker,
        pathParts: parseHydrationContainerPath(marker.path)
      }))
      .filter(
        ({pathParts}) =>
          pathParts !== null &&
          pathParts.parentPath === targetPosition.parentPath &&
          pathParts.index < targetPosition.index
      )
      .sort((a, b) => a.pathParts.index - b.pathParts.index);

    for (const {marker} of sameParentMarkers) {
      const owner = boundaryOwnersByPath.get(marker.path) || null;
      if (owner !== null) {
        boundaryStack.push(owner);
      } else if (isHydrationBoundaryEndMarker(marker.contractId)) {
        popHydrationBoundaryOwnerForEndMarker(
          boundaryStack,
          marker.contractId
        );
      }
    }

    if (boundaryStack.length > 0) {
      selectedOwner = boundaryStack[boundaryStack.length - 1];
    }
  }

  return selectedOwner;
}

function getHydrationTargetPathPositions(targetPath) {
  const segments = parseHydrationContainerPathSegments(targetPath);
  if (segments === null || segments.length === 0) {
    return [];
  }

  const positions = [];
  let parentPath = 'container';
  for (let depth = 0; depth < segments.length; depth++) {
    positions.push({
      index: segments[depth],
      parentPath
    });
    parentPath += `.childNodes[${segments[depth]}]`;
  }
  return positions;
}

function parseHydrationContainerPath(path) {
  const segments = parseHydrationContainerPathSegments(path);
  if (segments === null || segments.length === 0) {
    return null;
  }

  const index = segments[segments.length - 1];
  let parentPath = 'container';
  for (let depth = 0; depth < segments.length - 1; depth++) {
    parentPath += `.childNodes[${segments[depth]}]`;
  }

  return {
    index,
    parentPath
  };
}

function parseHydrationContainerPathSegments(path) {
  if (typeof path !== 'string' || !path.startsWith('container')) {
    return null;
  }

  const suffix = path.slice('container'.length);
  if (suffix === '') {
    return [];
  }

  const segments = [];
  const pathPattern = /\.childNodes\[(\d+)\]/g;
  let offset = 0;
  let match;
  while ((match = pathPattern.exec(suffix)) !== null) {
    if (match.index !== offset) {
      return null;
    }
    segments.push(Number(match[1]));
    offset = match.index + match[0].length;
  }

  return offset === suffix.length ? segments : null;
}

function isHydrationBoundaryEndMarker(contractId) {
  return contractId === 'suspense-end' || contractId === 'activity-end';
}

function popHydrationBoundaryOwnerForEndMarker(boundaryStack, contractId) {
  const expectedBoundaryKind =
    contractId === 'activity-end' ? 'activity-boundary' : 'suspense-boundary';
  for (let index = boundaryStack.length - 1; index >= 0; index -= 1) {
    if (boundaryStack[index].boundaryKind === expectedBoundaryKind) {
      boundaryStack.splice(index, 1);
      return;
    }
  }
}

function createHydrationReplayQueueDrainOrderDiagnostic(
  blockedEventReplayTargets,
  options
) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const dehydratedTargetResolutionDiagnostics =
    normalizedOptions.dehydratedTargetResolutionDiagnostics || null;
  const drainOrderCandidates = blockedEventReplayTargets.map(
    createHydrationReplayQueueDrainOrderCandidate
  );
  const drainOrder = Object.freeze(
    drainOrderCandidates
      .slice()
      .sort(compareHydrationReplayQueueDrainOrderCandidates)
      .map((candidate, drainOrderIndex) =>
        Object.freeze({
          ...candidate,
          drainOrder: drainOrderIndex
        })
      )
  );

  return Object.freeze({
    kind: HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND,
    status:
      drainOrder.length === 0
        ? 'blocked-no-replay-queue-drain-order-targets-recorded'
        : 'blocked-replay-queue-drain-order-recorded',
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-replay-queue-drain-order',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    hostInstanceHydrationAttempted: false,
    hasScheduledReplayAttempt: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    orderSource: 'dehydrated-target-root-metadata',
    targetResolutionDiagnosticsAccepted:
      dehydratedTargetResolutionDiagnostics !== null &&
      dehydratedTargetResolutionDiagnostics.kind ===
        HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND,
    dehydratedRootOwnerStatus:
      dehydratedTargetResolutionDiagnostics === null
        ? null
        : dehydratedTargetResolutionDiagnostics.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwnerCount:
      dehydratedTargetResolutionDiagnostics === null
        ? 0
        : dehydratedTargetResolutionDiagnostics.dehydratedBoundaryOwnerCount,
    hydratableEventTargetLookupCount:
      dehydratedTargetResolutionDiagnostics === null
        ? 0
        : dehydratedTargetResolutionDiagnostics
            .hydratableEventTargetLookupCount,
    blockedEventReplayTargetCount: blockedEventReplayTargets.length,
    queuedEventReplayTargetCount: 0,
    replayedEventCount: 0,
    drainOrderCount: drainOrder.length,
    drainOrder
  });
}

function createHydrationReplayQueueDrainOrderCandidate(entry) {
  const targetPathSegments =
    getHydrationReplayDrainTargetPathSegments(entry.targetPath);

  return {
    kind: 'FastReactDomHydrationReplayQueueDrainOrderEntryRecord',
    status: 'blocked-replay-queue-drain-order-entry-recorded',
    inputOrder: entry.inputOrder,
    replayQueueOrder: entry.replayQueueOrder,
    prioritySortKey: entry.prioritySortKey,
    domEventName: entry.domEventName,
    nativeEventType: entry.nativeEventType,
    queueCategory: entry.queueCategory,
    queueName: entry.queueName,
    queuePolicy: entry.queuePolicy,
    replayableEvent: entry.replayableEvent,
    rootOwnershipStatus: entry.rootOwnershipStatus,
    dehydratedRootOwnerStatus: entry.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwnerId: entry.dehydratedBoundaryOwnerId,
    dehydratedBoundaryOwnerIndex: entry.dehydratedBoundaryOwnerIndex,
    dehydratedBoundaryOwnerPath: entry.dehydratedBoundaryOwnerPath,
    dehydratedBoundaryOwnerStatus: entry.dehydratedBoundaryOwnerStatus,
    blockedOnKind: entry.blockedOnKind,
    blockedOnStatus: entry.blockedOnStatus,
    blockedOnSortKey: createHydrationReplayDrainBlockedOnSortKey(entry),
    ownerSortKey: getHydrationReplayDrainOwnerSortKey(entry),
    targetPath: entry.targetPath,
    targetPathStatus: entry.targetPathStatus,
    targetPathSegments,
    targetPathSortKey: createHydrationReplayDrainTargetPathSortKey(
      targetPathSegments,
      entry.inputOrder
    ),
    queued: false,
    replayQueueDrained: false,
    willDrainReplayQueues: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false
  };
}

function compareHydrationReplayQueueDrainOrderCandidates(a, b) {
  const targetPathComparison = compareHydrationReplayDrainPathSegments(
    a.targetPathSegments,
    b.targetPathSegments
  );
  if (targetPathComparison !== 0) {
    return targetPathComparison;
  }

  if (a.ownerSortKey !== b.ownerSortKey) {
    return a.ownerSortKey - b.ownerSortKey;
  }

  if (a.dehydratedBoundaryOwnerIndex !== b.dehydratedBoundaryOwnerIndex) {
    return (
      normalizeHydrationReplayDrainBoundaryIndex(
        a.dehydratedBoundaryOwnerIndex
      ) -
      normalizeHydrationReplayDrainBoundaryIndex(
        b.dehydratedBoundaryOwnerIndex
      )
    );
  }

  return a.inputOrder - b.inputOrder;
}

function compareHydrationReplayDrainPathSegments(a, b) {
  if (a === null && b === null) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }

  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    if (a[index] !== b[index]) {
      return a[index] - b[index];
    }
  }

  return a.length - b.length;
}

function normalizeHydrationReplayDrainBoundaryIndex(index) {
  return Number.isSafeInteger(index) ? index : Number.MAX_SAFE_INTEGER;
}

function getHydrationReplayDrainTargetPathSegments(targetPath) {
  const segments = parseHydrationContainerPathSegments(targetPath);
  return segments === null ? null : Object.freeze(segments.slice());
}

function createHydrationReplayDrainTargetPathSortKey(
  targetPathSegments,
  inputOrder
) {
  if (targetPathSegments === null) {
    return `unlisted:${inputOrder}`;
  }

  if (targetPathSegments.length === 0) {
    return 'container';
  }

  return targetPathSegments
    .map((segment) => String(segment).padStart(8, '0'))
    .join('.');
}

function getHydrationReplayDrainOwnerSortKey(entry) {
  if (entry.dehydratedBoundaryOwnerId !== null) {
    return 0;
  }
  if (entry.rootOwnershipStatus === 'owned-by-dehydrated-root') {
    return 1;
  }
  return 2;
}

function createHydrationReplayDrainBlockedOnSortKey(entry) {
  if (entry.dehydratedBoundaryOwnerId !== null) {
    const ownerPath =
      typeof entry.dehydratedBoundaryOwnerPath === 'string'
        ? entry.dehydratedBoundaryOwnerPath
        : 'unknown-boundary-path';
    return `boundary:${ownerPath}:${entry.dehydratedBoundaryOwnerId}`;
  }

  if (entry.rootOwnershipStatus === 'owned-by-dehydrated-root') {
    const targetPath =
      typeof entry.targetPath === 'string'
        ? entry.targetPath
        : 'unknown-root-target-path';
    return `root:${targetPath}:${entry.dehydratedRootOwnerStatus}`;
  }

  return `unowned:${entry.inputOrder}`;
}

function createHydrationReplayEventQueueEntryRecord(
  dispatchRecord,
  inputOrder,
  hydratableEventTargetLookup
) {
  const queueInfo = getHydrationReplayEventQueueInfo(
    dispatchRecord.domEventName
  );
  const prioritySortKey =
    typeof dispatchRecord.eventPriorityLane === 'number'
      ? dispatchRecord.eventPriorityLane
      : Number.MAX_SAFE_INTEGER;
  const targetLookup = isObjectLike(hydratableEventTargetLookup)
    ? hydratableEventTargetLookup
    : null;
  const dehydratedBoundaryOwner =
    targetLookup !== null && isObjectLike(targetLookup.dehydratedBoundaryOwner)
      ? targetLookup.dehydratedBoundaryOwner
      : null;

  return Object.freeze({
    kind: HYDRATION_REPLAY_EVENT_QUEUE_ENTRY_RECORD_KIND,
    status: 'blocked-event-replay-target-recorded',
    inputOrder,
    replayQueueOrder: inputOrder,
    prioritySortKey,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    dispatchBlockedReason: dispatchRecord.blockedReason,
    targetResolutionBlockedReason:
      dispatchRecord.targetResolutionBlockedReason,
    domEventName: dispatchRecord.domEventName,
    nativeEventType: dispatchRecord.nativeEventType,
    eventPriorityLabel: dispatchRecord.eventPriorityLabel,
    eventPriorityLane: dispatchRecord.eventPriorityLane,
    eventPriorityName: dispatchRecord.eventPriorityName,
    eventSystemFlags: dispatchRecord.eventSystemFlags,
    wrapperKind: dispatchRecord.wrapperKind,
    queueCategory: queueInfo.queueCategory,
    queueName: queueInfo.queueName,
    queuePolicy: queueInfo.queuePolicy,
    replayableEvent: queueInfo.replayableEvent,
    queued: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false,
    blockedOn: null,
    blockedOnKind:
      targetLookup === null ? null : targetLookup.blockedOnKind,
    blockedOnStatus:
      targetLookup === null
        ? 'unavailable-no-dehydrated-boundary'
        : targetLookup.blockedOnStatus,
    hydrationTargetResolutionStatus:
      targetLookup === null
        ? 'unavailable-no-hydratable-event-target-lookup'
        : targetLookup.status,
    rootOwnershipStatus:
      targetLookup === null
        ? 'unavailable-no-dehydrated-root-container-payload'
        : targetLookup.rootOwnershipStatus,
    dehydratedRootOwnerStatus:
      targetLookup === null
        ? 'blocked-no-dehydrated-root-container-payload'
        : targetLookup.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwner:
      dehydratedBoundaryOwner === null ? null : dehydratedBoundaryOwner,
    dehydratedBoundaryOwnerId:
      dehydratedBoundaryOwner === null
        ? null
        : dehydratedBoundaryOwner.ownerId,
    dehydratedBoundaryOwnerIndex:
      dehydratedBoundaryOwner === null ? null : dehydratedBoundaryOwner.index,
    dehydratedBoundaryOwnerPath:
      dehydratedBoundaryOwner === null ? null : dehydratedBoundaryOwner.path,
    dehydratedBoundaryOwnerStatus:
      targetLookup === null
        ? 'not-found'
        : targetLookup.dehydratedBoundaryOwnerStatus,
    targetPath: targetLookup === null ? null : targetLookup.targetPath,
    targetPathStatus:
      targetLookup === null
        ? 'unavailable-no-hydratable-event-target-lookup'
        : targetLookup.targetPathStatus,
    targetContainerMatchesRoot:
      targetLookup === null ? false : targetLookup.targetContainerMatchesRoot,
    targetWithinRootContainer:
      targetLookup === null ? false : targetLookup.targetWithinRootContainer,
    replayQueueDrained: false,
    willDrainReplayQueues: false,
    targetContainerInfo: describeHydrationReplayEventTargetInfo(
      dispatchRecord.targetContainer
    ),
    nativeEventTargetInfo: describeHydrationReplayEventTargetInfo(
      dispatchRecord.nativeEventTarget
    ),
    targetDispatchPathLength: dispatchRecord.targetDispatchPathLength,
    targetDispatchPathStatus: dispatchRecord.targetDispatchPathStatus,
    targetHostInstanceStatus: dispatchRecord.targetHostInstanceStatus,
    targetInstStatus: dispatchRecord.targetInstStatus,
    targetListenerFound: dispatchRecord.targetListenerFound,
    targetListenerLookupCount: dispatchRecord.targetListenerLookupCount,
    targetListenerLookupStatus: dispatchRecord.targetListenerLookupStatus,
    targetResolutionStatus: dispatchRecord.targetResolutionStatus
  });
}

function getHydrationReplayEventQueueInfo(domEventName) {
  if (
    Object.prototype.hasOwnProperty.call(
      hydrationContinuousReplayQueueNames,
      domEventName
    )
  ) {
    return Object.freeze({
      queueCategory: 'continuous-event',
      queueName: hydrationContinuousReplayQueueNames[domEventName],
      queuePolicy:
        domEventName === 'pointerover' ||
        domEventName === 'pointerout' ||
        domEventName === 'gotpointercapture' ||
        domEventName === 'lostpointercapture'
          ? 'latest-event-per-pointer-id'
          : 'latest-event-per-event-family',
      replayableEvent: true
    });
  }

  if (domEventName === 'change') {
    return Object.freeze({
      queueCategory: 'change-event-target',
      queueName: 'queuedChangeEventTargets',
      queuePolicy: 'target-array-drained-after-unblocked-hydration',
      replayableEvent: true
    });
  }

  if (hydrationDiscreteReplayableEventNameSet.has(domEventName)) {
    return Object.freeze({
      queueCategory: 'discrete-event',
      queueName: 'discrete-hydration-replay-attempt',
      queuePolicy: 'capture-phase-synchronous-hydration-attempt-blocked',
      replayableEvent: true
    });
  }

  return Object.freeze({
    queueCategory: 'not-replayable',
    queueName: null,
    queuePolicy: 'dispatch-without-target-when-blocked',
    replayableEvent: false
  });
}

function createHydrationReplayEventQueueOrder(entries) {
  return Object.freeze(
    entries.map((entry) => createHydrationReplayEventQueueOrderEntry(entry))
  );
}

function createHydrationReplayEventPriorityOrder(entries) {
  return Object.freeze(
    entries
      .slice()
      .sort(compareHydrationReplayEventQueueEntriesByPriority)
      .map((entry, priorityOrder) =>
        createHydrationReplayEventQueueOrderEntry(entry, priorityOrder)
      )
  );
}

function compareHydrationReplayEventQueueEntriesByPriority(a, b) {
  if (a.prioritySortKey !== b.prioritySortKey) {
    return a.prioritySortKey - b.prioritySortKey;
  }

  return a.inputOrder - b.inputOrder;
}

function createHydrationReplayEventQueueOrderEntry(entry, overrideOrder) {
  return Object.freeze({
    domEventName: entry.domEventName,
    inputOrder: entry.inputOrder,
    nativeEventType: entry.nativeEventType,
    priorityOrder:
      overrideOrder === undefined ? entry.inputOrder : overrideOrder,
    prioritySortKey: entry.prioritySortKey,
    queueName: entry.queueName,
    targetResolutionStatus: entry.targetResolutionStatus
  });
}

function describeHydrationReplayEventTargetInfo(target) {
  if (target === null || target === undefined) {
    return Object.freeze({
      kind: 'null'
    });
  }

  if (!isObjectLike(target)) {
    return Object.freeze({
      kind: typeof target
    });
  }

  return Object.freeze({
    kind: 'object',
    nodeName:
      typeof target.nodeName === 'string' ? target.nodeName : null,
    nodeType:
      typeof target.nodeType === 'number' ? target.nodeType : null
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
  DISPATCH_LISTENER_CANARY_EVENT_KIND,
  DISPATCH_LISTENER_ERROR_ROUTE_RECORD_KIND,
  DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND,
  DISPATCH_QUEUE_INVOCATION_CANARY_RECORD_KIND,
  DISPATCH_QUEUE_ENTRY_RECORD_KIND,
  DISPATCH_QUEUE_RECORD_KIND,
  DISPATCH_PROPAGATION_STOP_DIAGNOSTIC_RECORD_KIND,
  EVENT_DISPATCH_BLOCKED_CODE,
  EVENT_DISPATCH_RECORD_KIND,
  EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE,
  EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
  EVENT_PLUGIN_NAMES,
  EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
  HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND,
  HYDRATION_REPLAY_EVENT_QUEUE_ENTRY_RECORD_KIND,
  HYDRATION_DEHYDRATED_BOUNDARY_OWNER_RECORD_KIND,
  HYDRATION_DEHYDRATED_ROOT_OWNER_RECORD_KIND,
  HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND,
  HYDRATION_HYDRATABLE_EVENT_TARGET_LOOKUP_RECORD_KIND,
  HYDRATION_REPLAY_BLOCKED_CODE,
  HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND,
  INVALID_DISPATCH_LISTENER_RECORD_CODE,
  INVALID_EVENT_DISPATCH_RECORD_CODE,
  INVALID_EVENT_WRAPPER_RECORD_CODE,
  LISTENER_ERROR_ROUTING_BLOCKED_CODE,
  PLUGIN_EXTRACTION_BLOCKED_CODE,
  PLUGIN_EXTRACTION_RECORD_KIND,
  POLYFILL_EVENT_PLUGIN_NAMES,
  PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
  PRIVATE_DISPATCH_QUEUE_INVOCATION_CANARY_STATUS,
  PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS,
  PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS,
  PRIVATE_SINGLE_LISTENER_INVOCATION_CANARY_STATUS,
  PRIVATE_SYNTHETIC_EVENT_SHAPE_GATE_STATUS,
  PRIVATE_SYNTHETIC_EVENT_SHAPE_STATUS,
  PROPAGATION_STOP_DIAGNOSTIC_BLOCKED_CODE,
  PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
  SCROLL_END_EVENT_PLUGIN_NAME,
  SIMPLE_EVENT_PLUGIN_NAME,
  SYNTHETIC_EVENT_BLOCKED_CODE,
  SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND,
  SYNTHETIC_EVENT_SHAPE_RECORD_KIND,
  assertEventListenerWrapperRecord,
  createEventDispatchRecordFromWrapperRecord,
  createHydrationDehydratedTargetResolutionDiagnostic,
  createHydrationReplayEventQueueDiagnostic,
  createPluginExtractionRecord,
  createSyntheticEventShapeGateFromDispatchRecords,
  createSyntheticEventShapeRecordForDispatchListenerRecord,
  getDispatchListenerErrorRouteRecordPayload,
  getHydrationDehydratedTargetResolutionDiagnosticPayload,
  getDispatchListenerInvocationCanaryRecordPayload,
  getDispatchListenerRecordPayload,
  getDispatchQueueEntryRecordPayload,
  getDispatchQueueInvocationCanaryRecordPayload,
  getSimpleEventReactName,
  getSimpleEventRegistrationName,
  getSyntheticEventShapeGateRecordPayload,
  getSyntheticEventShapeRecordPayload,
  getWrapperRecord,
  invokeDispatchListenerRecordForCanary,
  invokeDispatchQueueCanaryFromDispatchRecords,
  invokeSingleListenerCanaryFromDispatchRecord,
  isHydrationDehydratedTargetResolutionDiagnostic,
  isDispatchListenerInvocationCanaryRecord,
  isDispatchListenerErrorRouteRecord,
  isDispatchListenerRecord,
  isDispatchQueueEntryRecord,
  isDispatchQueueInvocationCanaryRecord,
  isSyntheticEventShapeGateRecord,
  isSyntheticEventShapeRecord
};
