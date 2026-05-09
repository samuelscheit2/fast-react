'use strict';

const {assertValidContainer} = require('./dom-container.js');

const containerMarkerPrefix = '__reactContainer$';
const legacyRootContainerKey = '_reactRootContainer';
const randomKey = Math.random().toString(36).slice(2);
const internalContainerInstanceKey = containerMarkerPrefix + randomKey;

const duplicateCreateRootWarning =
  'You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.';
const legacyRootWarning =
  'You are calling ReactDOMClient.createRoot() on a container that was previously passed to ReactDOM.render(). This is not supported.';

function markContainerAsRoot(rootOwner, container) {
  assertValidContainer(container);
  if (rootOwner == null) {
    const error = new Error(
      'Cannot mark a React DOM container without a root owner.'
    );
    error.code = 'FAST_REACT_DOM_MISSING_ROOT_OWNER';
    throw error;
  }

  container[internalContainerInstanceKey] = rootOwner;
  return rootOwner;
}

function unmarkContainerAsRoot(container) {
  assertValidContainer(container);
  container[internalContainerInstanceKey] = null;
}

function getContainerRoot(container) {
  if (container == null || typeof container !== 'object') {
    return null;
  }
  return container[internalContainerInstanceKey] || null;
}

function isContainerMarkedAsRoot(container) {
  return getContainerRoot(container) !== null;
}

function hasLegacyRootMarker(container) {
  return !!(
    container != null &&
    typeof container === 'object' &&
    container[legacyRootContainerKey]
  );
}

function getCreateRootWarning(container, options) {
  const development =
    options && typeof options.development === 'boolean'
      ? options.development
      : process.env.NODE_ENV !== 'production';

  if (!development) {
    return null;
  }

  if (hasLegacyRootMarker(container)) {
    return legacyRootWarning;
  }

  if (isContainerMarkedAsRoot(container)) {
    return duplicateCreateRootWarning;
  }

  return null;
}

function warnIfContainerAlreadyRoot(container, options) {
  const message = getCreateRootWarning(container, options);
  if (message === null) {
    return false;
  }

  const logger = (options && options.console) || console;
  if (logger && typeof logger.error === 'function') {
    logger.error(message);
  }
  return true;
}

function inspectContainerRootMarker(container) {
  if (container == null || typeof container !== 'object') {
    return {
      inspectable: false,
      nullCount: 0,
      propertyCount: 0,
      truthyCount: 0,
      properties: []
    };
  }

  const properties = Object.keys(container)
    .filter((key) => key.startsWith(containerMarkerPrefix))
    .map((key) => {
      const value = container[key];
      return {
        enumerable: Object.prototype.propertyIsEnumerable.call(container, key),
        keyPrefix: containerMarkerPrefix,
        valueState:
          value === null
            ? 'null'
            : value === undefined
              ? 'undefined'
              : value
                ? 'truthy'
                : 'falsy',
        valueType: value === null ? 'null' : typeof value
      };
    });

  return {
    inspectable: true,
    nullCount: properties.filter((property) => property.valueState === 'null')
      .length,
    properties,
    propertyCount: properties.length,
    truthyCount: properties.filter((property) => property.valueState === 'truthy')
      .length
  };
}

module.exports = {
  containerMarkerPrefix,
  duplicateCreateRootWarning,
  getContainerRoot,
  getCreateRootWarning,
  hasLegacyRootMarker,
  inspectContainerRootMarker,
  internalContainerInstanceKey,
  isContainerMarkedAsRoot,
  legacyRootContainerKey,
  legacyRootWarning,
  markContainerAsRoot,
  unmarkContainerAsRoot,
  warnIfContainerAlreadyRoot
};
