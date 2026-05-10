'use strict';

const {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  createEventPriorityRecordFromPriority,
  eventPriorityToLane,
  getEventPriority,
  getEventPriorityLabel,
  getEventPriorityName
} = require('./event-priorities.js');
const {
  createEventDispatchRecordFromWrapperRecord
} = require('./plugin-event-system.js');

const DISCRETE_EVENT_WRAPPER = 'discrete';
const CONTINUOUS_EVENT_WRAPPER = 'continuous';
const DEFAULT_EVENT_WRAPPER = 'default';
const EVENT_WRAPPER_RECORD_KIND = 'FastReactDomEventPriorityWrapperRecord';

function dispatchEvent(wrapperRecord, nativeEvent) {
  return createEventDispatchRecordFromWrapperRecord(
    wrapperRecord,
    nativeEvent
  );
}

function dispatchDiscreteEvent(wrapperRecord, nativeEvent) {
  return createEventDispatchRecordFromWrapperRecord(
    wrapperRecord,
    nativeEvent
  );
}

function dispatchContinuousEvent(wrapperRecord, nativeEvent) {
  return createEventDispatchRecordFromWrapperRecord(
    wrapperRecord,
    nativeEvent
  );
}

function createEventListenerWrapper(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  return createEventListenerWrapperRecord(
    targetContainer,
    domEventName,
    eventSystemFlags
  ).listener;
}

function createEventListenerWrapperRecord(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  return createInertEventListenerWrapperRecord(
    dispatchEvent,
    'dispatchEvent',
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
  return createEventListenerWrapperRecordWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags,
    options
  ).listener;
}

function createEventListenerWrapperRecordWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags,
  options
) {
  const eventPriority = getEventPriority(domEventName, options);
  switch (eventPriority) {
    case DiscreteEventPriority:
      return createInertEventListenerWrapperRecord(
        dispatchDiscreteEvent,
        'dispatchDiscreteEvent',
        DISCRETE_EVENT_WRAPPER,
        eventPriority,
        targetContainer,
        domEventName,
        eventSystemFlags
      );
    case ContinuousEventPriority:
      return createInertEventListenerWrapperRecord(
        dispatchContinuousEvent,
        'dispatchContinuousEvent',
        CONTINUOUS_EVENT_WRAPPER,
        eventPriority,
        targetContainer,
        domEventName,
        eventSystemFlags
      );
    case DefaultEventPriority:
    default:
      return createInertEventListenerWrapperRecord(
        dispatchEvent,
        'dispatchEvent',
        DEFAULT_EVENT_WRAPPER,
        eventPriority,
        targetContainer,
        domEventName,
        eventSystemFlags
      );
  }
}

function createInertEventListenerWrapperRecord(
  dispatcher,
  dispatcherName,
  wrapperKind,
  eventPriority,
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  let record;
  const listener = function reactDomEventListenerWrapper(nativeEvent) {
    dispatcher(record, nativeEvent);
    return undefined;
  };
  const priorityRecord = createEventPriorityRecordFromPriority(
    domEventName,
    eventPriority
  );
  record = Object.freeze({
    dispatcherName,
    domEventName,
    eventPriority,
    eventPriorityLabel: getEventPriorityLabel(eventPriority),
    eventPriorityLane: eventPriorityToLane(eventPriority),
    eventPriorityName: getEventPriorityName(eventPriority),
    eventSystemFlags,
    kind: EVENT_WRAPPER_RECORD_KIND,
    listener,
    priorityRecord,
    targetContainer,
    wrapperKind
  });

  Object.defineProperties(listener, {
    __FAST_REACT_DOM_EVENT_WRAPPER_RECORD__: {
      value: record
    },
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

  return record;
}

module.exports = {
  CONTINUOUS_EVENT_WRAPPER,
  DEFAULT_EVENT_WRAPPER,
  DISCRETE_EVENT_WRAPPER,
  EVENT_WRAPPER_RECORD_KIND,
  createEventListenerWrapper,
  createEventListenerWrapperRecord,
  createEventListenerWrapperRecordWithPriority,
  createEventListenerWrapperWithPriority,
  dispatchContinuousEvent,
  dispatchDiscreteEvent,
  dispatchEvent
};
