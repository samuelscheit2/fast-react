'use strict';

const allNativeEvents = Object.freeze([
  'abort',
  'animationend',
  'animationiteration',
  'animationstart',
  'auxclick',
  'beforetoggle',
  'cancel',
  'canplay',
  'canplaythrough',
  'change',
  'click',
  'close',
  'compositionend',
  'compositionstart',
  'compositionupdate',
  'contextmenu',
  'copy',
  'cut',
  'dblclick',
  'drag',
  'dragend',
  'dragenter',
  'dragexit',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'focusin',
  'focusout',
  'gotpointercapture',
  'input',
  'invalid',
  'keydown',
  'keypress',
  'keyup',
  'load',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'lostpointercapture',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'paste',
  'pause',
  'play',
  'playing',
  'pointercancel',
  'pointerdown',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'progress',
  'ratechange',
  'reset',
  'resize',
  'scroll',
  'scrollend',
  'seeked',
  'seeking',
  'selectionchange',
  'stalled',
  'submit',
  'suspend',
  'textInput',
  'timeupdate',
  'toggle',
  'touchcancel',
  'touchend',
  'touchmove',
  'touchstart',
  'transitioncancel',
  'transitionend',
  'transitionrun',
  'transitionstart',
  'volumechange',
  'waiting',
  'wheel'
]);

const mediaEventTypes = Object.freeze([
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'resize',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting'
]);

const nonDelegatedEvents = Object.freeze([
  'beforetoggle',
  'cancel',
  'close',
  'invalid',
  'load',
  'scroll',
  'scrollend',
  'toggle',
  ...mediaEventTypes
]);

const passiveBrowserEvents = Object.freeze(['touchstart', 'touchmove', 'wheel']);

const allNativeEventSet = new Set(allNativeEvents);
const nonDelegatedEventSet = new Set(nonDelegatedEvents);
const passiveBrowserEventSet = new Set(passiveBrowserEvents);

function isKnownNativeEvent(domEventName) {
  return allNativeEventSet.has(domEventName);
}

function isNonDelegatedEvent(domEventName) {
  return nonDelegatedEventSet.has(domEventName);
}

function isPassiveBrowserEvent(domEventName) {
  return passiveBrowserEventSet.has(domEventName);
}

module.exports = {
  allNativeEventSet,
  allNativeEvents,
  isKnownNativeEvent,
  isNonDelegatedEvent,
  isPassiveBrowserEvent,
  mediaEventTypes,
  nonDelegatedEventSet,
  nonDelegatedEvents,
  passiveBrowserEventSet,
  passiveBrowserEvents
};
