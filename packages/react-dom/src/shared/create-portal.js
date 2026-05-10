'use strict';

const {assertValidContainer} = require('../client/dom-container.js');
const {defineFunctionShape} = require('../../placeholder-utils.js');

const REACT_PORTAL_TYPE = Symbol.for('react.portal');
const reactDomPortalImplementation = null;
const unsupportedPortalImplementationErrorCode =
  'FAST_REACT_DOM_PORTAL_IMPLEMENTATION_UNSUPPORTED';
const unnormalizedPortalKeyErrorCode =
  'FAST_REACT_DOM_PORTAL_KEY_UNNORMALIZED';
const unsupportedKeyWarning =
  'The provided key is an unsupported type %s. This value must be coerced to a string before using it here.';

function createPortalObject(children, containerInfo, implementation, key) {
  return createPortalRecordFromNormalizedParts(
    normalizePortalKey(key),
    children,
    containerInfo,
    implementation
  );
}

function createPortalRecordFromNormalizedParts(
  key,
  children,
  containerInfo,
  implementation
) {
  assertNormalizedPortalKey(key);
  assertSupportedPortalImplementation(implementation);

  return {
    $$typeof: REACT_PORTAL_TYPE,
    key,
    children,
    containerInfo,
    implementation
  };
}

function normalizePortalKey(key) {
  if (isDevelopmentMode()) {
    checkKeyStringCoercion(key);
  }

  return key == null ? null : '' + key;
}

const createPortal = defineFunctionShape(function (children, container, key) {
  assertValidContainer(container);
  return createPortalObject(
    children,
    container,
    reactDomPortalImplementation,
    key
  );
}, '', 2);

function assertNormalizedPortalKey(key) {
  if (key === null || typeof key === 'string') {
    return;
  }

  const error = new Error(
    'React DOM portal records require an already-normalized null or string key.'
  );
  error.name = 'FastReactDomPortalRecordError';
  error.code = unnormalizedPortalKeyErrorCode;
  throw error;
}

function assertSupportedPortalImplementation(implementation) {
  if (implementation === reactDomPortalImplementation) {
    return;
  }

  const error = new Error(
    '[fast-react] React DOM createPortal currently supports only the public ' +
      'portal object record with implementation null. Portal reconciliation, ' +
      'commit mounting, root scheduling, and event bubbling are not implemented.'
  );
  error.name = 'FastReactDomPortalRecordError';
  error.code = unsupportedPortalImplementationErrorCode;
  throw error;
}

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
  createPortalRecordFromNormalizedParts,
  normalizePortalKey,
  reactDomPortalImplementation,
  unnormalizedPortalKeyErrorCode,
  unsupportedPortalImplementationErrorCode,
  unsupportedKeyWarning
};
