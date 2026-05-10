'use strict';

const NoEventPriority = 0;
const DiscreteEventPriority = 2;
const ContinuousEventPriority = 8;
const DefaultEventPriority = 32;
const IdleEventPriority = 268435456;

const ImmediateSchedulerPriority = 1;
const UserBlockingSchedulerPriority = 2;
const NormalSchedulerPriority = 3;
const LowSchedulerPriority = 4;
const IdleSchedulerPriority = 5;

const discreteEventNames = Object.freeze([
  'beforetoggle',
  'cancel',
  'click',
  'close',
  'contextmenu',
  'copy',
  'cut',
  'auxclick',
  'dblclick',
  'dragend',
  'dragstart',
  'drop',
  'focusin',
  'focusout',
  'input',
  'invalid',
  'keydown',
  'keypress',
  'keyup',
  'mousedown',
  'mouseup',
  'paste',
  'pause',
  'play',
  'pointercancel',
  'pointerdown',
  'pointerup',
  'ratechange',
  'reset',
  'resize',
  'seeked',
  'submit',
  'toggle',
  'touchcancel',
  'touchend',
  'touchstart',
  'volumechange',
  'change',
  'selectionchange',
  'textInput',
  'compositionstart',
  'compositionend',
  'compositionupdate',
  'beforeblur',
  'afterblur',
  'beforeinput',
  'blur',
  'fullscreenchange',
  'focus',
  'hashchange',
  'popstate',
  'select',
  'selectstart'
]);

const continuousEventNames = Object.freeze([
  'drag',
  'dragenter',
  'dragexit',
  'dragleave',
  'dragover',
  'mousemove',
  'mouseout',
  'mouseover',
  'pointermove',
  'pointerout',
  'pointerover',
  'scroll',
  'touchmove',
  'wheel',
  'mouseenter',
  'mouseleave',
  'pointerenter',
  'pointerleave'
]);

const discreteEventNameSet = new Set(discreteEventNames);
const continuousEventNameSet = new Set(continuousEventNames);

const eventPriorityNames = Object.freeze({
  [NoEventPriority]: 'NoEventPriority',
  [DiscreteEventPriority]: 'DiscreteEventPriority',
  [ContinuousEventPriority]: 'ContinuousEventPriority',
  [DefaultEventPriority]: 'DefaultEventPriority',
  [IdleEventPriority]: 'IdleEventPriority'
});

const eventPriorityLabels = Object.freeze({
  [NoEventPriority]: 'none',
  [DiscreteEventPriority]: 'discrete',
  [ContinuousEventPriority]: 'continuous',
  [DefaultEventPriority]: 'default',
  [IdleEventPriority]: 'idle'
});

function schedulerPriorityToEventPriority(schedulerPriority) {
  switch (schedulerPriority) {
    case ImmediateSchedulerPriority:
      return DiscreteEventPriority;
    case UserBlockingSchedulerPriority:
      return ContinuousEventPriority;
    case NormalSchedulerPriority:
    case LowSchedulerPriority:
      return DefaultEventPriority;
    case IdleSchedulerPriority:
      return IdleEventPriority;
    default:
      return DefaultEventPriority;
  }
}

function resolveCurrentSchedulerPriority(options) {
  if (
    options &&
    Object.prototype.hasOwnProperty.call(options, 'schedulerPriority')
  ) {
    return options.schedulerPriority;
  }

  if (
    options &&
    typeof options.getCurrentSchedulerPriorityLevel === 'function'
  ) {
    return options.getCurrentSchedulerPriorityLevel();
  }

  return NormalSchedulerPriority;
}

function getEventPriority(domEventName, options) {
  if (discreteEventNameSet.has(domEventName)) {
    return DiscreteEventPriority;
  }

  if (continuousEventNameSet.has(domEventName)) {
    return ContinuousEventPriority;
  }

  if (domEventName === 'message') {
    return schedulerPriorityToEventPriority(
      resolveCurrentSchedulerPriority(options)
    );
  }

  return DefaultEventPriority;
}

function getEventPriorityName(priority) {
  return eventPriorityNames[priority] || 'DefaultEventPriority';
}

function getEventPriorityLabel(priority) {
  return eventPriorityLabels[priority] || 'default';
}

function eventPriorityToLane(updatePriority) {
  return updatePriority;
}

module.exports = {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  IdleEventPriority,
  IdleSchedulerPriority,
  ImmediateSchedulerPriority,
  LowSchedulerPriority,
  NoEventPriority,
  NormalSchedulerPriority,
  UserBlockingSchedulerPriority,
  continuousEventNameSet,
  continuousEventNames,
  discreteEventNameSet,
  discreteEventNames,
  eventPriorityToLane,
  getEventPriority,
  getEventPriorityLabel,
  getEventPriorityName,
  resolveCurrentSchedulerPriority,
  schedulerPriorityToEventPriority
};

