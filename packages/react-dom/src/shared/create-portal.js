'use strict';

const {assertValidContainer} = require('../client/dom-container.js');
const {defineFunctionShape} = require('../../placeholder-utils.js');

const REACT_PORTAL_TYPE = Symbol.for('react.portal');
const unsupportedKeyWarning =
  'The provided key is an unsupported type %s. This value must be coerced to a string before using it here.';

function createPortalObject(children, containerInfo, implementation, key) {
  if (isDevelopmentMode()) {
    checkKeyStringCoercion(key);
  }

  return {
    $$typeof: REACT_PORTAL_TYPE,
    key: key == null ? null : '' + key,
    children,
    containerInfo,
    implementation
  };
}

const createPortal = defineFunctionShape(function (children, container, key) {
  assertValidContainer(container);
  return createPortalObject(children, container, null, key);
}, '', 2);

function isDevelopmentMode() {
  return process.env.NODE_ENV !== 'production';
}

function checkKeyStringCoercion(value) {
  try {
    testStringCoercion(value);
  } catch (_error) {
    console.error(unsupportedKeyWarning, getUnsupportedKeyTypeName(value));
    return testStringCoercion(value);
  }

  return undefined;
}

function testStringCoercion(value) {
  return '' + value;
}

function getUnsupportedKeyTypeName(value) {
  return (
    (typeof Symbol === 'function' &&
      Symbol.toStringTag &&
      value &&
      value[Symbol.toStringTag]) ||
    value?.constructor?.name ||
    'Object'
  );
}

module.exports = {
  REACT_PORTAL_TYPE,
  checkKeyStringCoercion,
  createPortal,
  createPortalObject,
  unsupportedKeyWarning
};
