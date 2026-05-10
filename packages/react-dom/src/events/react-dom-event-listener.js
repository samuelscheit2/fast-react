'use strict';

const {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getEventPriority,
  getEventPriorityLabel,
  getEventPriorityName
} = require('./event-priorities.js');

const DISCRETE_EVENT_WRAPPER = 'discrete';
const CONTINUOUS_EVENT_WRAPPER = 'continuous';
const DEFAULT_EVENT_WRAPPER = 'default';

function dispatchEvent() {
  return undefined;
}

function dispatchDiscreteEvent() {
  return undefined;
}

function dispatchContinuousEvent() {
  return undefined;
}

function createEventListenerWrapper(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  return createInertEventListenerWrapper(
    dispatchEvent,
    DEFAULT_EVENT_WRAPPER,
    DefaultEventPriority,
    targetContainer,
    domEventName,
    eventSystemFlags
  );
}

function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags,
  options
) {
  const eventPriority = getEventPriority(domEventName, options);
  switch (eventPriority) {
    case DiscreteEventPriority:
      return createInertEventListenerWrapper(
        dispatchDiscreteEvent,
        DISCRETE_EVENT_WRAPPER,
        eventPriority,
        targetContainer,
        domEventName,
        eventSystemFlags
      );
    case ContinuousEventPriority:
      return createInertEventListenerWrapper(
        dispatchContinuousEvent,
        CONTINUOUS_EVENT_WRAPPER,
        eventPriority,
        targetContainer,
        domEventName,
        eventSystemFlags
      );
    case DefaultEventPriority:
    default:
      return createInertEventListenerWrapper(
        dispatchEvent,
        DEFAULT_EVENT_WRAPPER,
        eventPriority,
        targetContainer,
        domEventName,
        eventSystemFlags
      );
  }
}

function createInertEventListenerWrapper(
  dispatcher,
  wrapperKind,
  eventPriority,
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  const listener = function reactDomEventListenerWrapper(nativeEvent) {
    return dispatcher(
      domEventName,
      eventSystemFlags,
      targetContainer,
      nativeEvent
    );
  };

  Object.defineProperties(listener, {
    __FAST_REACT_DOM_EVENT_WRAPPER__: {
      value: true
    },
    __FAST_REACT_DOM_EVENT_WRAPPER_KIND__: {
      value: wrapperKind
    },
    __FAST_REACT_DOM_EVENT_PRIORITY__: {
      value: eventPriority
    },
    __FAST_REACT_DOM_EVENT_PRIORITY_LABEL__: {
      value: getEventPriorityLabel(eventPriority)
    },
    __FAST_REACT_DOM_EVENT_PRIORITY_NAME__: {
      value: getEventPriorityName(eventPriority)
    }
  });

  return listener;
}

module.exports = {
  CONTINUOUS_EVENT_WRAPPER,
  DEFAULT_EVENT_WRAPPER,
  DISCRETE_EVENT_WRAPPER,
  createEventListenerWrapper,
  createEventListenerWrapperWithPriority,
  dispatchContinuousEvent,
  dispatchDiscreteEvent,
  dispatchEvent
};

