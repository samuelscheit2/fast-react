'use strict';

const {assertValidContainer} = require('./dom-container.js');

const containerMarkerPrefix = '__reactContainer$';
const legacyRootContainerKey = '_reactRootContainer';
const randomKey = Math.random().toString(36).slice(2);
const internalContainerInstanceKey = containerMarkerPrefix + randomKey;
const privateRootMarkerMutationRecordType =
  'fast.react_dom.private_root_marker_mutation_record';
const privateRootMarkerCleanupRecordType =
  'fast.react_dom.private_root_marker_cleanup_record';
const ROOT_MARKER_APPLIED = 'applied-private-root-container-marker';
const ROOT_MARKER_REVERTED = 'reverted-private-root-container-marker';

const duplicateCreateRootWarning =
  'You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.';
const legacyRootWarning =
  'You are calling ReactDOMClient.createRoot() on a container that was previously passed to ReactDOM.render(). This is not supported.';

const privateRootMarkerMutationPayloads = new WeakMap();
const privateRootMarkerCleanupRecords = new WeakMap();

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

function markContainerAsRootWithRevertRecord(rootOwner, container, options) {
  assertValidContainer(container);
  if (rootOwner == null) {
    const error = new Error(
      'Cannot mark a React DOM container without a root owner.'
    );
    error.code = 'FAST_REACT_DOM_MISSING_ROOT_OWNER';
    throw error;
  }

  const hadOwnMarker = Object.prototype.hasOwnProperty.call(
    container,
    internalContainerInstanceKey
  );
  const previousValue = hadOwnMarker
    ? container[internalContainerInstanceKey]
    : undefined;

  if (previousValue != null) {
    const error = new Error(
      'Cannot apply a private React DOM root marker over an existing root marker.'
    );
    error.code = 'FAST_REACT_DOM_ROOT_MARKER_OCCUPIED';
    throw error;
  }

  const beforeMarker = freezeRecord(inspectContainerRootMarker(container));
  const warningMessage = getCreateRootWarning(container, options);
  markContainerAsRoot(rootOwner, container);
  const afterMarker = freezeRecord(inspectContainerRootMarker(container));
  const record = freezeRecord({
    $$typeof: privateRootMarkerMutationRecordType,
    kind: 'FastReactDomPrivateRootMarkerMutationRecord',
    action: 'mark-container-as-root',
    markerStatus: ROOT_MARKER_APPLIED,
    beforeMarker,
    afterMarker,
    hadPreviousMarker: hadOwnMarker,
    previousValueState: describeMarkerValue(previousValue),
    rootOwnerKind: describeRootOwnerKind(rootOwner),
    warning: describeCreateRootWarning(warningMessage),
    reversible: true
  });

  privateRootMarkerMutationPayloads.set(record, {
    active: true,
    container,
    hadOwnMarker,
    previousValue,
    rootOwner
  });

  return record;
}

function unmarkContainerAsRoot(container) {
  assertValidContainer(container);
  container[internalContainerInstanceKey] = null;
}

function revertContainerRootMarkerMutation(record) {
  const payload = privateRootMarkerMutationPayloads.get(record);
  if (payload === undefined) {
    const error = new Error(
      'Expected a private React DOM root marker mutation record.'
    );
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_MARKER_RECORD';
    throw error;
  }

  const existingCleanup = privateRootMarkerCleanupRecords.get(record);
  if (!payload.active && existingCleanup !== undefined) {
    return existingCleanup;
  }

  assertValidContainer(payload.container);
  if (payload.container[internalContainerInstanceKey] !== payload.rootOwner) {
    const error = new Error(
      'Cannot revert a private React DOM root marker after the container marker changed.'
    );
    error.code = 'FAST_REACT_DOM_ROOT_MARKER_CHANGED';
    throw error;
  }

  const beforeMarker = freezeRecord(inspectContainerRootMarker(payload.container));
  if (payload.hadOwnMarker) {
    payload.container[internalContainerInstanceKey] = payload.previousValue;
  } else {
    delete payload.container[internalContainerInstanceKey];
  }
  payload.active = false;

  const cleanupRecord = freezeRecord({
    $$typeof: privateRootMarkerCleanupRecordType,
    kind: 'FastReactDomPrivateRootMarkerCleanupRecord',
    action: 'revert-container-root-marker',
    markerStatus: ROOT_MARKER_REVERTED,
    beforeMarker,
    afterMarker: freezeRecord(inspectContainerRootMarker(payload.container)),
    restoredPreviousMarker: true,
    reversible: false
  });
  privateRootMarkerCleanupRecords.set(record, cleanupRecord);
  return cleanupRecord;
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

function describeCreateRootWarning(message) {
  if (message === null) {
    return null;
  }

  let warningType = 'unknown';
  if (message === duplicateCreateRootWarning) {
    warningType = 'duplicate-create-root';
  } else if (message === legacyRootWarning) {
    warningType = 'legacy-root-container';
  }

  return freezeRecord({
    message,
    type: warningType
  });
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

function describeMarkerValue(value) {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  return value ? 'truthy' : 'falsy';
}

function describeRootOwnerKind(rootOwner) {
  if (rootOwner == null) {
    return String(rootOwner);
  }
  if (typeof rootOwner !== 'object') {
    return typeof rootOwner;
  }
  const ownerKind = rootOwner.kind || rootOwner.$$typeof || 'object';
  return typeof ownerKind === 'symbol' ? String(ownerKind) : ownerKind;
}

function freezeRecord(record) {
  return Object.freeze(record);
}

module.exports = {
  ROOT_MARKER_APPLIED,
  ROOT_MARKER_REVERTED,
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
  markContainerAsRootWithRevertRecord,
  privateRootMarkerCleanupRecordType,
  privateRootMarkerMutationRecordType,
  revertContainerRootMarkerMutation,
  unmarkContainerAsRoot,
  warnIfContainerAlreadyRoot
};
