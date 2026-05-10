'use strict';

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

function createDispatchQueueRecord() {
  return Object.freeze({
    entries: Object.freeze([]),
    kind: DISPATCH_QUEUE_RECORD_KIND,
    length: 0,
    listenerInvocationCount: 0,
    status: 'empty',
    syntheticEventCount: 0
  });
}

function createPluginRecord(pluginName, extractionStatus, blockedReason) {
  return Object.freeze({
    blockedReason,
    extractionStatus,
    listenerInvocationCount: 0,
    pluginName,
    syntheticEventCount: 0
  });
}

function createPluginRecords(eventSystemFlags) {
  const processPolyfills =
    shouldProcessPolyfillEventPlugins(eventSystemFlags);
  const records = [
    createPluginRecord(
      SIMPLE_EVENT_PLUGIN_NAME,
      'blocked',
      PLUGIN_EXTRACTION_BLOCKED_CODE
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

function createPluginExtractionRecord(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget
) {
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const dispatchQueue = createDispatchQueueRecord();

  return Object.freeze({
    blockedReason: PLUGIN_EXTRACTION_BLOCKED_CODE,
    dispatchQueue,
    domEventName: wrapperRecord.domEventName,
    eventSystemFlags,
    inCapturePhase: isCapturePhase(eventSystemFlags),
    kind: PLUGIN_EXTRACTION_RECORD_KIND,
    listenerInvocationCount: 0,
    nativeEventTarget,
    nativeEventType: getNativeEventType(nativeEvent, wrapperRecord.domEventName),
    pluginRecords: createPluginRecords(eventSystemFlags),
    shouldProcessPolyfillPlugins:
      shouldProcessPolyfillEventPlugins(eventSystemFlags),
    status: 'blocked',
    syntheticEventCount: 0,
    targetContainer: wrapperRecord.targetContainer,
    targetInst: null,
    targetInstStatus: 'not-resolved',
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
  const extractionRecord = createPluginExtractionRecord(
    wrapperRecord,
    nativeEvent,
    nativeEventTarget
  );

  return Object.freeze({
    blockedReason: EVENT_DISPATCH_BLOCKED_CODE,
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
    targetInst: null,
    targetInstStatus: 'not-resolved',
    targetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    targetResolutionStatus: 'blocked',
    willInvokeListeners: false,
    wrapperKind: wrapperRecord.wrapperKind,
    wrapperRecord
  });
}

module.exports = {
  CONTROLLED_STATE_RESTORE_BLOCKED_CODE,
  DISPATCH_QUEUE_RECORD_KIND,
  EVENT_DISPATCH_BLOCKED_CODE,
  EVENT_DISPATCH_RECORD_KIND,
  EVENT_PLUGIN_NAMES,
  EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
  HYDRATION_REPLAY_BLOCKED_CODE,
  INVALID_EVENT_WRAPPER_RECORD_CODE,
  PLUGIN_EXTRACTION_BLOCKED_CODE,
  PLUGIN_EXTRACTION_RECORD_KIND,
  POLYFILL_EVENT_PLUGIN_NAMES,
  SCROLL_END_EVENT_PLUGIN_NAME,
  SIMPLE_EVENT_PLUGIN_NAME,
  assertEventListenerWrapperRecord,
  createEventDispatchRecordFromWrapperRecord,
  createPluginExtractionRecord,
  getWrapperRecord
};
