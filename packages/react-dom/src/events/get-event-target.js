'use strict';

const {TEXT_NODE} = require('../client/dom-container.js');

function isObjectLike(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function getEventTarget(nativeEvent, fallbackTarget) {
  let target = null;

  if (isObjectLike(nativeEvent)) {
    target = nativeEvent.target || nativeEvent.srcElement || null;
  }

  if (target === null || target === undefined) {
    target = fallbackTarget || null;
  }

  if (isObjectLike(target) && target.correspondingUseElement) {
    target = target.correspondingUseElement;
  }

  if (isObjectLike(target) && target.nodeType === TEXT_NODE) {
    return target.parentNode || null;
  }

  return target;
}

function getNativeEventType(nativeEvent, fallbackEventName) {
  if (isObjectLike(nativeEvent) && typeof nativeEvent.type === 'string') {
    return nativeEvent.type;
  }

  return fallbackEventName;
}

module.exports = {
  getEventTarget,
  getNativeEventType
};
