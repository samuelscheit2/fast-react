'use strict';

const listenerSetMarkerPrefix = '__reactEvents$';
const listeningMarkerPrefix = '_reactListening';
const randomKey = Math.random().toString(36).slice(2);
const internalEventHandlersKey = listenerSetMarkerPrefix + randomKey;
const internalListeningMarker = listeningMarkerPrefix + randomKey;

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

module.exports = {
  assertEventTarget,
  getEventListenerSet,
  getListenerSetKey,
  hasListeningMarker,
  inspectListeningMarker,
  internalEventHandlersKey,
  internalListeningMarker,
  listenerSetMarkerPrefix,
  listeningMarkerPrefix,
  markTargetAsListening
};
