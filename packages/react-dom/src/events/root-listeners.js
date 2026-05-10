'use strict';

const {DOCUMENT_NODE, getOwnerDocument} = require('../client/dom-container.js');
const {
  allNativeEvents,
  isKnownNativeEvent,
  isNonDelegatedEvent,
  isPassiveBrowserEvent
} = require('./event-names.js');
const {
  assertEventTarget,
  getEventListenerSet,
  getListenerSetKey,
  markTargetAsListening
} = require('./listener-registry.js');
const {
  createEventListenerWrapperRecordWithPriority
} = require('./react-dom-event-listener.js');

const IS_CAPTURE_PHASE = 1 << 2;
const IS_NON_DELEGATED = 1 << 1;

function createEventListenerShell(target, domEventName, eventSystemFlags) {
  const wrapperRecord = createEventListenerWrapperRecordWithPriority(
    target,
    domEventName,
    eventSystemFlags
  );
  const listener = wrapperRecord.listener;

  Object.defineProperties(listener, {
    __FAST_REACT_DOM_EVENT_SHELL__: {
      value: true
    },
    __FAST_REACT_DOM_EVENT_FLAGS__: {
      value: eventSystemFlags
    },
    __FAST_REACT_DOM_EVENT_NAME__: {
      value: domEventName
    },
    __FAST_REACT_DOM_EVENT_TARGET__: {
      value: target
    },
    __FAST_REACT_DOM_EVENT_SHELL_WRAPPER_RECORD__: {
      value: wrapperRecord
    }
  });

  return listener;
}

function getAddEventListenerOptions(
  domEventName,
  isCapturePhaseListener,
  options
) {
  const passiveBrowserEventsSupported =
    !options || options.passiveBrowserEventsSupported !== false;

  if (passiveBrowserEventsSupported && isPassiveBrowserEvent(domEventName)) {
    return isCapturePhaseListener
      ? {
          capture: true,
          passive: true
        }
      : {
          passive: true
        };
  }

  return isCapturePhaseListener;
}

function addTrappedEventListener(
  target,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener,
  options
) {
  assertEventTarget(target);
  const listener = createEventListenerShell(
    target,
    domEventName,
    eventSystemFlags
  );
  const listenerOptions = getAddEventListenerOptions(
    domEventName,
    isCapturePhaseListener,
    options
  );

  target.addEventListener(domEventName, listener, listenerOptions);
  return listener;
}

function listenToNativeEvent(
  domEventName,
  isCapturePhaseListener,
  target,
  options
) {
  if (!isKnownNativeEvent(domEventName)) {
    const error = new Error(
      `Unsupported native React DOM event "${domEventName}".`
    );
    error.code = 'FAST_REACT_DOM_UNKNOWN_NATIVE_EVENT';
    throw error;
  }

  if (isNonDelegatedEvent(domEventName) && !isCapturePhaseListener) {
    const error = new Error(
      `Cannot install non-delegated React DOM event "${domEventName}" in the bubble phase.`
    );
    error.code = 'FAST_REACT_DOM_NON_DELEGATED_BUBBLE_LISTENER';
    throw error;
  }

  const listenerSet = getEventListenerSet(target);
  const listenerSetKey = getListenerSetKey(
    domEventName,
    isCapturePhaseListener
  );
  if (listenerSet.has(listenerSetKey)) {
    return null;
  }

  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }

  const listener = addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener,
    options
  );
  listenerSet.add(listenerSetKey);
  return listener;
}

function listenToNonDelegatedEvent(domEventName, target, options) {
  if (!isNonDelegatedEvent(domEventName)) {
    const error = new Error(
      `Expected "${domEventName}" to be a non-delegated React DOM event.`
    );
    error.code = 'FAST_REACT_DOM_EXPECTED_NON_DELEGATED_EVENT';
    throw error;
  }

  const listenerSet = getEventListenerSet(target);
  const listenerSetKey = getListenerSetKey(domEventName, false);
  if (listenerSet.has(listenerSetKey)) {
    return null;
  }

  const listener = addTrappedEventListener(
    target,
    domEventName,
    IS_NON_DELEGATED,
    false,
    options
  );
  listenerSet.add(listenerSetKey);
  return listener;
}

function listenToAllSupportedEvents(rootContainerElement, options) {
  assertEventTarget(rootContainerElement);
  markTargetAsListening(rootContainerElement);

  for (const domEventName of allNativeEvents) {
    if (domEventName === 'selectionchange') {
      continue;
    }

    if (!isNonDelegatedEvent(domEventName)) {
      listenToNativeEvent(domEventName, false, rootContainerElement, options);
    }
    listenToNativeEvent(domEventName, true, rootContainerElement, options);
  }

  const ownerDocument = getOwnerDocument(rootContainerElement);
  if (ownerDocument !== null) {
    assertEventTarget(ownerDocument);
    markTargetAsListening(ownerDocument);
    listenToNativeEvent('selectionchange', false, ownerDocument, options);
  }
}

function listenToPortalContainerEvents(portalContainer, options) {
  listenToAllSupportedEvents(portalContainer, options);
}

function getRootEventTargetOwnerDocument(rootContainerElement) {
  return rootContainerElement && rootContainerElement.nodeType === DOCUMENT_NODE
    ? rootContainerElement
    : getOwnerDocument(rootContainerElement);
}

module.exports = {
  IS_CAPTURE_PHASE,
  IS_NON_DELEGATED,
  addTrappedEventListener,
  createEventListenerShell,
  getAddEventListenerOptions,
  getRootEventTargetOwnerDocument,
  listenToAllSupportedEvents,
  listenToNativeEvent,
  listenToNonDelegatedEvent,
  listenToPortalContainerEvents
};
