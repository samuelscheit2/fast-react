'use strict';

const listenerSetMarkerPrefix = '__reactEvents$';
const listeningMarkerPrefix = '_reactListening';
const PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_RECORD_KIND =
  'FastReactDomPrivateEventListenerQueueEntryRecord';
const PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_STATUS =
  'registered-private-event-listener-queue-entry';
const INVALID_PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_CODE =
  'FAST_REACT_DOM_INVALID_PRIVATE_EVENT_LISTENER_QUEUE_ENTRY';
const randomKey = Math.random().toString(36).slice(2);
const internalEventHandlersKey = listenerSetMarkerPrefix + randomKey;
const internalListeningMarker = listeningMarkerPrefix + randomKey;
const privateEventListenerQueuesByTarget = new WeakMap();
const privateEventListenerQueueEntryPayloads = new WeakMap();

function assertEventTarget(target) {
  if (
    target == null ||
    (typeof target !== 'object' && typeof target !== 'function') ||
    typeof target.addEventListener !== 'function'
  ) {
    const error = new Error(
      'Cannot install React DOM listeners on a target without addEventListener.'
    );
    error.code = 'FAST_REACT_DOM_INVALID_EVENT_TARGET';
    throw error;
  }
  return target;
}

function getEventListenerSet(target) {
  assertEventTarget(target);
  let listenerSet = target[internalEventHandlersKey];
  if (listenerSet === undefined) {
    listenerSet = target[internalEventHandlersKey] = new Set();
  }
  return listenerSet;
}

function getListenerSetKey(domEventName, capture) {
  return `${domEventName}__${capture ? 'capture' : 'bubble'}`;
}

function markTargetAsListening(target) {
  assertEventTarget(target);
  target[internalListeningMarker] = true;
}

function hasListeningMarker(target) {
  return !!(
    target != null &&
    (typeof target === 'object' || typeof target === 'function') &&
    target[internalListeningMarker]
  );
}

function inspectListeningMarker(target) {
  if (
    target == null ||
    (typeof target !== 'object' && typeof target !== 'function')
  ) {
    return {
      inspectable: false,
      propertyCount: 0,
      trueValueCount: 0
    };
  }

  const properties = Object.keys(target).filter((key) =>
    key.startsWith(listeningMarkerPrefix)
  );
  return {
    inspectable: true,
    propertyCount: properties.length,
    trueValueCount: properties.filter((key) => target[key] === true).length
  };
}

function createPrivateEventListenerQueueError(message) {
  const error = new Error(message);
  error.code = INVALID_PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_CODE;
  return error;
}

function assertPrivateEventListenerQueueTarget(target) {
  if (
    target == null ||
    (typeof target !== 'object' && typeof target !== 'function')
  ) {
    throw createPrivateEventListenerQueueError(
      'Cannot register a private React DOM event listener queue entry on a non-object target.'
    );
  }
  return target;
}

function assertPrivateEventListenerQueueEntryRecord(record) {
  const payload = getPrivateEventListenerQueueEntryPayload(record);
  if (payload === null) {
    throw createPrivateEventListenerQueueError(
      'Expected a private React DOM event listener queue entry record.'
    );
  }
  return payload;
}

function registerPrivateEventListenerQueueEntry(
  target,
  domEventName,
  capture,
  listener,
  options
) {
  assertPrivateEventListenerQueueTarget(target);
  if (typeof domEventName !== 'string' || domEventName === '') {
    throw createPrivateEventListenerQueueError(
      'Private React DOM event listener queue entries require a native event name.'
    );
  }
  if (typeof listener !== 'function') {
    throw createPrivateEventListenerQueueError(
      'Private React DOM event listener queue entries require a function listener.'
    );
  }

  const inCapturePhase = capture === true;
  const listenerSetKey = getListenerSetKey(domEventName, inCapturePhase);
  let targetQueue = privateEventListenerQueuesByTarget.get(target);
  if (targetQueue === undefined) {
    targetQueue = [];
    privateEventListenerQueuesByTarget.set(target, targetQueue);
  }

  const listenerQueueIndex = targetQueue.filter((entryRecord) => {
    const payload = privateEventListenerQueueEntryPayloads.get(entryRecord);
    return (
      payload !== undefined &&
      payload.active &&
      payload.domEventName === domEventName &&
      payload.capture === inCapturePhase
    );
  }).length;
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};
  const record = Object.freeze({
    browserDomEventCompatibilityClaimed: false,
    capture: inCapturePhase,
    diagnosticOnly: true,
    domEventName,
    exposesListener: false,
    kind: PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_RECORD_KIND,
    listenerQueueIndex,
    listenerQueueKey: listenerSetKey,
    listenerStatus: 'present',
    listenerType:
      typeof normalizedOptions.listenerType === 'string'
        ? normalizedOptions.listenerType
        : 'private-event-listener-queue',
    publicRootBehaviorChanged: false,
    status: PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_STATUS
  });

  privateEventListenerQueueEntryPayloads.set(record, {
    active: true,
    capture: inCapturePhase,
    domEventName,
    listener,
    listenerSetKey,
    record,
    target
  });
  targetQueue.push(record);
  return record;
}

function removePrivateEventListenerQueueEntry(record) {
  const payload = assertPrivateEventListenerQueueEntryRecord(record);
  if (!payload.active) {
    return false;
  }
  payload.active = false;
  return true;
}

function getPrivateEventListenerQueueEntries(target, domEventName, capture) {
  if (
    target == null ||
    (typeof target !== 'object' && typeof target !== 'function')
  ) {
    return Object.freeze([]);
  }

  const targetQueue = privateEventListenerQueuesByTarget.get(target);
  if (targetQueue === undefined) {
    return Object.freeze([]);
  }

  const inCapturePhase = capture === true;
  return Object.freeze(
    targetQueue.filter((entryRecord) => {
      const payload = privateEventListenerQueueEntryPayloads.get(entryRecord);
      return (
        payload !== undefined &&
        payload.active &&
        payload.domEventName === domEventName &&
        payload.capture === inCapturePhase
      );
    })
  );
}

function getPrivateEventListenerQueueEntryPayload(record) {
  if (
    record === null ||
    (typeof record !== 'object' && typeof record !== 'function')
  ) {
    return null;
  }

  return privateEventListenerQueueEntryPayloads.get(record) || null;
}

function isPrivateEventListenerQueueEntryRecord(record) {
  return getPrivateEventListenerQueueEntryPayload(record) !== null;
}

module.exports = {
  INVALID_PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_CODE,
  PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_RECORD_KIND,
  PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_STATUS,
  assertEventTarget,
  getPrivateEventListenerQueueEntries,
  getPrivateEventListenerQueueEntryPayload,
  getEventListenerSet,
  getListenerSetKey,
  hasListeningMarker,
  inspectListeningMarker,
  internalEventHandlersKey,
  internalListeningMarker,
  isPrivateEventListenerQueueEntryRecord,
  listenerSetMarkerPrefix,
  listeningMarkerPrefix,
  markTargetAsListening,
  registerPrivateEventListenerQueueEntry,
  removePrivateEventListenerQueueEntry
};
