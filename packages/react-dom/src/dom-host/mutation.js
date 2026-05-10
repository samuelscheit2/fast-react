'use strict';

const {
  ENTRY_NON_PAYLOAD,
  ENTRY_REMOVE_ATTRIBUTE,
  ENTRY_REMOVE_PROPERTY,
  ENTRY_REMOVE_STYLE,
  ENTRY_SET_ATTRIBUTE,
  ENTRY_SET_INNER_HTML,
  ENTRY_SET_PROPERTY,
  ENTRY_SET_STYLE,
  ENTRY_UNSUPPORTED,
  diffDomPropertyPayload,
  isAttributeNameSafe,
  isEventLikeProp,
  isNonPayloadPropertyPayloadEntry,
  isOrdinaryPropertyPayloadEntry,
  isStylePropertyPayloadEntry,
  isStyleDangerousHtmlPayloadEntry
} = require('./property-payload.js');

const blockedPayloadEntryKinds = new Set([
  ENTRY_REMOVE_STYLE,
  ENTRY_SET_STYLE,
  ENTRY_SET_INNER_HTML,
  ENTRY_NON_PAYLOAD,
  ENTRY_UNSUPPORTED
]);

const unsafePropertyNames = new Set([
  '__proto__',
  'constructor',
  'innerHTML',
  'outerHTML',
  'prototype',
  'style',
  'textContent'
]);

const propertyNamePattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const LATEST_PROPS_COMMIT_RECORD = 'latestPropsCommit';
const DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF =
  'domPropertyUpdateLatestPropsHandoff';
const CLEAR_CONTAINER_FOR_ROOT_UNMOUNT_RECORD =
  'clearContainerForRootUnmount';

const latestPropsCommitRecordPayloads = new WeakMap();
const domPropertyUpdateLatestPropsHandoffPayloads = new WeakMap();
const clearContainerForRootUnmountRecordPayloads = new WeakMap();
const domPropertyPayloadMutationRecordsPayloads = new WeakMap();
const latestPropsSafePayloadKinds = new Set([
  ENTRY_SET_ATTRIBUTE,
  ENTRY_REMOVE_ATTRIBUTE,
  ENTRY_SET_PROPERTY,
  ENTRY_REMOVE_PROPERTY,
  ENTRY_SET_STYLE,
  ENTRY_REMOVE_STYLE,
  ENTRY_NON_PAYLOAD
]);
function createDomHostMutationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

const DOM_HOST_TEXT_COMMIT_GATE_METADATA = Object.freeze({
  gateVersion: 1,
  target: 'packages/react-dom/src/dom-host/mutation.js',
  privateTextCreationBridge: 'createDomHostTextInstance',
  publicRootsCompared: false,
  serverRenderingCompared: false,
  hydrationCompared: false,
  browserDomCompared: false,
  compatibilityClaimed: false,
  supportedFakeDomRowIds: Object.freeze([
    'host-text-create-append',
    'host-text-update-node-value',
    'host-text-delete-remove-child',
    'host-text-insert-before',
    'reset-text-content-before-managed-child'
  ])
});

const DOM_TEXT_CONTENT_RESET_UPDATE_MUTATION_GATE_METADATA = Object.freeze({
  gateVersion: 1,
  target: 'packages/react-dom/src/dom-host/mutation.js',
  privateTextContentBridge:
    'setTextContent/resetTextContent/removeChild/appendChild',
  publicRootsCompared: false,
  serverRenderingCompared: false,
  hydrationCompared: false,
  browserDomCompared: false,
  compatibilityClaimed: false,
  supportedFakeDomRowIds: Object.freeze([
    'text-content-reset-before-managed-child-append',
    'managed-child-remove-before-text-content-update'
  ])
});

function appendInitialChild(parentInstance, child) {
  return appendChild(parentInstance, child);
}

function appendChild(parentInstance, child) {
  assertAppendParent(parentInstance, 'appendChild');
  assertChildNode(child, 'appendChild');
  assertCanMoveIntoParent(parentInstance, child, 'appendChild');
  return parentInstance.appendChild(child);
}

function appendChildToContainer(container, child) {
  return appendChild(container, child);
}

function insertBefore(parentInstance, child, beforeChild) {
  assertInsertParent(parentInstance, 'insertBefore');
  assertChildNode(child, 'insertBefore');
  assertChildNode(beforeChild, 'insertBefore');
  assertCanMoveIntoParent(parentInstance, child, 'insertBefore');
  assertCurrentChild(
    parentInstance,
    beforeChild,
    'FAST_REACT_DOM_MISSING_INSERTION_TARGET',
    'Cannot insert before a node that is not a child of the supplied parent.'
  );
  return parentInstance.insertBefore(child, beforeChild);
}

function insertInContainerBefore(container, child, beforeChild) {
  return insertBefore(container, child, beforeChild);
}

function removeChild(parentInstance, child) {
  assertRemoveParent(parentInstance, 'removeChild');
  assertChildNode(child, 'removeChild');
  assertCurrentChild(
    parentInstance,
    child,
    'FAST_REACT_DOM_MISSING_REMOVAL_TARGET',
    'Cannot remove a node that is not a child of the supplied parent.'
  );
  return parentInstance.removeChild(child);
}

function removeChildFromContainer(container, child) {
  return removeChild(container, child);
}

function clearContainer(container) {
  assertRemoveParent(container, 'clearContainer');

  let firstChild = getFirstChild(container);
  while (firstChild !== null) {
    container.removeChild(firstChild);
    firstChild = getFirstChild(container);
  }
}

function clearContainerForRootUnmount(container) {
  assertRemoveParent(container, 'clearContainerForRootUnmount');

  const removedChildren = [];
  let firstChild = getFirstChild(container);
  while (firstChild !== null) {
    removedChildren.push(firstChild);
    container.removeChild(firstChild);
    firstChild = getFirstChild(container);
  }

  const record = Object.freeze({
    kind: CLEAR_CONTAINER_FOR_ROOT_UNMOUNT_RECORD,
    mutation: 'clearContainer',
    removedChildCount: removedChildren.length,
    status: 'cleared'
  });

  clearContainerForRootUnmountRecordPayloads.set(
    record,
    Object.freeze({
      container,
      removedChildren: Object.freeze(removedChildren)
    })
  );

  return record;
}

function commitTextUpdate(textInstance, oldText, newText) {
  setTextNodeValue(textInstance, newText, 'commitTextUpdate');
}

function createDomHostTextInstance(text, rootContainerInstance) {
  const ownerDocument = getOwnerDocumentForHostText(
    rootContainerInstance,
    'createDomHostTextInstance'
  );
  const createText = ownerDocument['create' + 'TextNode'];
  if (typeof createText !== 'function') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_TEXT_CREATION_TARGET',
      'Cannot create HostText without an owner document text-node factory.'
    );
  }

  const textInstance = createText.call(ownerDocument, String(text));
  assertDomLikeObject(textInstance, 'createDomHostTextInstance', 'child');
  return textInstance;
}

function createDomHostElementInstance(type, rootContainerInstance) {
  if (typeof type !== 'string' || type === '') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_ELEMENT_TYPE',
      'Cannot create a HostComponent without a non-empty string element type.'
    );
  }

  const ownerDocument = getOwnerDocumentForHostText(
    rootContainerInstance,
    'createDomHostElementInstance'
  );
  const createElement = ownerDocument.createElement;
  if (typeof createElement !== 'function') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_ELEMENT_CREATION_TARGET',
      'Cannot create HostComponent without an owner document element factory.'
    );
  }

  const instance = createElement.call(ownerDocument, type);
  assertDomLikeObject(instance, 'createDomHostElementInstance', 'child');
  return instance;
}

function resetTextContent(instance) {
  setNodeTextContent(instance, '', 'resetTextContent');
}

function setTextContent(instance, text) {
  setNodeTextContent(instance, text, 'setTextContent');
}

function applyDomPropertyPayload(instance, payload) {
  assertDomLikeObject(instance, 'applyDomPropertyPayload', 'parent');
  if (!Array.isArray(payload)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD',
      'Cannot apply a DOM property payload that is not an array.'
    );
  }

  const entries = payload.map((entry, index) =>
    normalizePropertyPayloadEntry(instance, entry, index)
  );

  for (const entry of entries) {
    applyNormalizedPropertyPayloadEntry(instance, entry);
  }

  return entries.map(createAppliedPropertyPayloadRecord);
}

function commitDomPropertyUpdate(instance, tag, lastProps, nextProps) {
  const payload = diffDomPropertyPayload(tag, lastProps, nextProps);
  return applyAdmittedDomPropertyPayload(instance, payload);
}

function commitDomPropertyUpdateForLatestProps(
  instance,
  tag,
  lastProps,
  nextProps
) {
  const payload = diffDomPropertyPayload(tag, lastProps, nextProps);
  return applyDomPropertyPayloadForLatestProps(instance, payload, nextProps);
}

function applyAdmittedDomPropertyPayload(instance, payload) {
  assertDomLikeObject(instance, 'applyAdmittedDomPropertyPayload', 'parent');
  if (!Array.isArray(payload)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD',
      'Cannot apply an admitted DOM property payload that is not an array.'
    );
  }

  const entries = payload.map((entry, index) =>
    normalizeAdmittedDomPropertyPayloadEntry(instance, entry, index)
  );
  const rollbackRecords = createDomPropertyPayloadRollbackRecords(
    instance,
    entries
  );
  let rollbackLimit = 0;

  try {
    for (let index = 0; index < entries.length; index += 1) {
      rollbackLimit = index + 1;
      applyAdmittedNormalizedPropertyPayloadEntry(instance, entries[index]);
    }
  } catch (error) {
    try {
      rollbackDomPropertyPayloadEntries(
        instance,
        rollbackRecords,
        rollbackLimit
      );
    } catch (rollbackError) {
      // Preserve the original private mutation failure for callers.
    }
    throw error;
  }

  return createDomPropertyPayloadMutationRecords(
    instance,
    entries.map(createAdmittedPropertyPayloadRecord),
    rollbackRecords
  );
}

function applyDomPropertyPayloadForLatestProps(instance, payload, latestProps) {
  assertDomLikeObject(
    instance,
    'applyDomPropertyPayloadForLatestProps',
    'parent'
  );
  if (!Array.isArray(payload)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD',
      'Cannot apply a DOM property payload for latest props that is not an array.'
    );
  }

  const entries = payload.map((entry, index) =>
    normalizeLatestPropsSafeDomPropertyPayloadEntry(instance, entry, index)
  );
  const rollbackRecords =
    createLatestPropsSafeDomPropertyPayloadRollbackRecords(instance, entries);
  let rollbackLimit = 0;

  try {
    for (let index = 0; index < entries.length; index += 1) {
      rollbackLimit = index + 1;
      applyLatestPropsSafeDomPropertyPayloadEntry(instance, entries[index]);
    }

    const mutationRecords = Object.freeze(
      entries.map((entry) =>
        Object.freeze(createAdmittedPropertyPayloadRecord(entry))
      )
    );
    const latestPropsPayloadRecords = Object.freeze(
      entries.map(createLatestPropsPayloadRecord)
    );
    const latestPropsCommitRecord = createLatestPropsCommitRecord(
      instance,
      latestProps,
      latestPropsPayloadRecords
    );

    return createDomPropertyUpdateLatestPropsHandoff(
      mutationRecords,
      latestPropsCommitRecord,
      rollbackRecords
    );
  } catch (error) {
    try {
      rollbackLatestPropsSafeDomPropertyPayloadEntries(
        instance,
        rollbackRecords,
        rollbackLimit
      );
    } catch (rollbackError) {
      // Preserve the original private mutation failure for callers.
    }
    throw error;
  }
}

function applyStyleDangerousHtmlPayload(instance, payload) {
  assertDomLikeObject(instance, 'applyStyleDangerousHtmlPayload', 'parent');

  if (!Array.isArray(payload)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PAYLOAD',
      'Cannot apply style/dangerous HTML payload without an array.'
    );
  }

  const entries = payload.map((entry) =>
    validateStyleDangerousHtmlPayloadEntry(instance, entry)
  );
  const rollbackRecords = createDomPropertyPayloadRollbackRecords(
    instance,
    entries
  );
  let rollbackLimit = 0;

  try {
    for (let index = 0; index < entries.length; index += 1) {
      rollbackLimit = index + 1;
      applyStyleDangerousHtmlPayloadEntry(instance, entries[index]);
    }
  } catch (error) {
    try {
      rollbackDomPropertyPayloadEntries(
        instance,
        rollbackRecords,
        rollbackLimit
      );
    } catch (rollbackError) {
      // Preserve the original private mutation failure for callers.
    }
    throw error;
  }

  return createDomPropertyPayloadMutationRecords(
    instance,
    entries,
    rollbackRecords
  );
}

function createLatestPropsCommitRecord(node, latestProps, payloadRecords) {
  assertDomLikeObject(node, 'createLatestPropsCommitRecord', 'child');

  const safePayloadRecords =
    normalizeLatestPropsCommitPayloadRecords(payloadRecords);
  const record = Object.freeze({
    kind: LATEST_PROPS_COMMIT_RECORD,
    payloadCount: safePayloadRecords.length,
    status: 'safe-for-latest-props'
  });

  latestPropsCommitRecordPayloads.set(
    record,
    Object.freeze({
      latestProps: latestProps === undefined ? null : latestProps,
      node,
      payloadRecords: safePayloadRecords
    })
  );

  return record;
}

function getLatestPropsCommitRecordPayload(record) {
  if (!isWeakMapKey(record)) {
    return null;
  }
  return latestPropsCommitRecordPayloads.get(record) || null;
}

function isLatestPropsCommitRecord(record) {
  return getLatestPropsCommitRecordPayload(record) !== null;
}

function getDomPropertyUpdateLatestPropsHandoffPayload(handoff) {
  if (!isWeakMapKey(handoff)) {
    return null;
  }
  return domPropertyUpdateLatestPropsHandoffPayloads.get(handoff) || null;
}

function isDomPropertyUpdateLatestPropsHandoff(handoff) {
  return getDomPropertyUpdateLatestPropsHandoffPayload(handoff) !== null;
}

function getClearContainerForRootUnmountRecordPayload(record) {
  if (!isWeakMapKey(record)) {
    return null;
  }
  return clearContainerForRootUnmountRecordPayloads.get(record) || null;
}

function isClearContainerForRootUnmountRecord(record) {
  return getClearContainerForRootUnmountRecordPayload(record) !== null;
}

function getDomPropertyPayloadMutationRecordsPayload(records) {
  if (!isWeakMapKey(records)) {
    return null;
  }
  return domPropertyPayloadMutationRecordsPayloads.get(records) || null;
}

function isDomPropertyPayloadMutationRecords(records) {
  return getDomPropertyPayloadMutationRecordsPayload(records) !== null;
}

function assertAppendParent(parent, operation) {
  assertDomLikeObject(parent, operation, 'parent');
  if (typeof parent.appendChild !== 'function') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PARENT_NODE',
      `Cannot ${operation} on a parent without appendChild.`
    );
  }
}

function assertInsertParent(parent, operation) {
  assertDomLikeObject(parent, operation, 'parent');
  if (typeof parent.insertBefore !== 'function') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PARENT_NODE',
      `Cannot ${operation} on a parent without insertBefore.`
    );
  }
}

function assertRemoveParent(parent, operation) {
  assertDomLikeObject(parent, operation, 'parent');
  if (typeof parent.removeChild !== 'function') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PARENT_NODE',
      `Cannot ${operation} on a parent without removeChild.`
    );
  }
}

function normalizePropertyPayloadEntry(instance, entry, index) {
  if (!isOrdinaryPropertyPayloadEntry(entry)) {
    throw createUnsupportedPayloadEntryError(entry, index);
  }

  switch (entry.kind) {
    case ENTRY_SET_ATTRIBUTE:
      return normalizeSetAttributePayloadEntry(instance, entry, index);
    case ENTRY_REMOVE_ATTRIBUTE:
      return normalizeRemoveAttributePayloadEntry(instance, entry, index);
    case ENTRY_SET_PROPERTY:
      return normalizeSetPropertyPayloadEntry(instance, entry, index);
    case ENTRY_REMOVE_PROPERTY:
      return normalizeRemovePropertyPayloadEntry(instance, entry, index);
    default:
      throw createUnsupportedPayloadEntryError(entry, index);
  }
}

function normalizeAdmittedDomPropertyPayloadEntry(instance, entry, index) {
  if (isOrdinaryPropertyPayloadEntry(entry)) {
    return normalizePropertyPayloadEntry(instance, entry, index);
  }

  if (isStyleDangerousHtmlPayloadEntry(entry)) {
    return validateStyleDangerousHtmlPayloadEntry(instance, entry);
  }

  if (isNonPayloadPropertyPayloadEntry(entry)) {
    return normalizeNonPayloadPropertyPayloadEntry(entry, index);
  }

  throw createBlockedAdmittedPayloadEntryError(entry, index);
}

function normalizeSetAttributePayloadEntry(instance, entry, index) {
  assertAttributePayloadTarget(instance, 'setAttribute');
  const attributeName = normalizePayloadAttributeName(entry, index);
  if (typeof entry.value !== 'string') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_ENTRY',
      `Cannot apply setAttribute payload entry ${index} without a string value.`
    );
  }

  return {
    kind: ENTRY_SET_ATTRIBUTE,
    attributeName,
    propName: normalizePayloadPropName(entry, index, attributeName),
    value: entry.value
  };
}

function normalizeRemoveAttributePayloadEntry(instance, entry, index) {
  assertAttributePayloadTarget(instance, 'removeAttribute');
  const attributeName = normalizePayloadAttributeName(entry, index);
  return {
    kind: ENTRY_REMOVE_ATTRIBUTE,
    attributeName,
    propName: normalizePayloadPropName(entry, index, attributeName)
  };
}

function normalizeSetPropertyPayloadEntry(instance, entry, index) {
  const propertyName = normalizePayloadPropertyName(entry, index);
  assertPropertyPayloadTarget(instance, propertyName);
  assertSafePropertyPayloadValue(entry.value, index);

  return {
    kind: ENTRY_SET_PROPERTY,
    propertyName,
    propName: normalizePayloadPropName(entry, index, propertyName),
    value: entry.value
  };
}

function normalizeRemovePropertyPayloadEntry(instance, entry, index) {
  const propertyName = normalizePayloadPropertyName(entry, index);
  assertPropertyPayloadTarget(instance, propertyName);

  return {
    kind: ENTRY_REMOVE_PROPERTY,
    propertyName,
    propName: normalizePayloadPropName(entry, index, propertyName),
    value: null
  };
}

function normalizeNonPayloadPropertyPayloadEntry(entry, index) {
  if (
    typeof entry.propName !== 'string' ||
    typeof entry.category !== 'string' ||
    typeof entry.reason !== 'string'
  ) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_ENTRY',
      `Cannot skip non-payload DOM property payload entry ${index} without string metadata.`
    );
  }

  return {
    kind: ENTRY_NON_PAYLOAD,
    propName: entry.propName,
    category: entry.category,
    reason: entry.reason,
    status: 'skipped'
  };
}

function normalizePayloadAttributeName(entry, index) {
  const attributeName = entry.attributeName;
  if (
    typeof attributeName !== 'string' ||
    attributeName === '' ||
    !isAttributeNameSafe(attributeName)
  ) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_ENTRY',
      `Cannot apply payload entry ${index} with an unsafe attribute name.`
    );
  }

  return attributeName;
}

function normalizePayloadPropertyName(entry, index) {
  const propertyName = entry.propertyName;
  if (!isSafePayloadPropertyName(propertyName)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_ENTRY',
      `Cannot apply payload entry ${index} with an unsafe property name.`
    );
  }

  return propertyName;
}

function normalizePayloadPropName(entry, index, fallbackName) {
  const propName = entry.propName === undefined ? fallbackName : entry.propName;
  if (typeof propName !== 'string' || propName === '') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_ENTRY',
      `Cannot apply payload entry ${index} without a string propName.`
    );
  }

  return propName;
}

function isSafePayloadPropertyName(propertyName) {
  return (
    typeof propertyName === 'string' &&
    propertyNamePattern.test(propertyName) &&
    !unsafePropertyNames.has(propertyName) &&
    propertyName[0] !== '_' &&
    !isEventLikeProp(propertyName)
  );
}

function assertAttributePayloadTarget(instance, methodName) {
  if (typeof instance[methodName] !== 'function') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_TARGET',
      `Cannot apply a DOM property payload on a node without ${methodName}.`
    );
  }
}

function assertPropertyPayloadTarget(instance, propertyName) {
  if (!(propertyName in instance)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_TARGET',
      'Cannot apply a DOM property payload to a missing target property.'
    );
  }
}

function assertSafePropertyPayloadValue(value, index) {
  if (typeof value === 'function' || typeof value === 'symbol') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_ENTRY',
      `Cannot apply setProperty payload entry ${index} with a callback or symbol value.`
    );
  }
}

function createUnsupportedPayloadEntryError(entry, index) {
  const kind = entry && typeof entry === 'object' ? entry.kind : undefined;
  const code =
    kind !== undefined && blockedPayloadEntryKinds.has(kind)
      ? 'FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY'
      : 'FAST_REACT_DOM_UNSUPPORTED_PROPERTY_PAYLOAD_ENTRY';
  return createDomHostMutationError(
    code,
    `Cannot apply unsupported DOM property payload entry ${index}.`
  );
}

function createBlockedAdmittedPayloadEntryError(entry, index) {
  const kind = entry && typeof entry === 'object' ? entry.kind : undefined;
  const code =
    kind === ENTRY_UNSUPPORTED
      ? 'FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY'
      : 'FAST_REACT_DOM_UNSUPPORTED_PROPERTY_PAYLOAD_ENTRY';
  return createDomHostMutationError(
    code,
    `Cannot apply unsupported admitted DOM property payload entry ${index}.`
  );
}

function createBlockedLatestPropsPayloadEntryError(entry, index) {
  const kind = entry && typeof entry === 'object' ? entry.kind : undefined;
  const code =
    kind !== undefined && blockedPayloadEntryKinds.has(kind)
      ? 'FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY'
      : 'FAST_REACT_DOM_UNSUPPORTED_PROPERTY_PAYLOAD_ENTRY';
  return createDomHostMutationError(
    code,
    `Cannot apply unsupported latest-props DOM property payload entry ${index}.`
  );
}

function applyNormalizedPropertyPayloadEntry(instance, entry) {
  switch (entry.kind) {
    case ENTRY_SET_ATTRIBUTE:
      instance.setAttribute(entry.attributeName, entry.value);
      return;
    case ENTRY_REMOVE_ATTRIBUTE:
      instance.removeAttribute(entry.attributeName);
      return;
    case ENTRY_SET_PROPERTY:
      instance[entry.propertyName] = entry.value;
      return;
    case ENTRY_REMOVE_PROPERTY:
      instance[entry.propertyName] = null;
      return;
  }
}

function normalizeLatestPropsSafeDomPropertyPayloadEntry(instance, entry, index) {
  if (isOrdinaryPropertyPayloadEntry(entry)) {
    return normalizePropertyPayloadEntry(instance, entry, index);
  }

  if (isStylePropertyPayloadEntry(entry)) {
    return validateStylePayloadEntry(instance, entry, entry.kind);
  }

  if (isNonPayloadPropertyPayloadEntry(entry)) {
    return normalizeNonPayloadPropertyPayloadEntry(entry, index);
  }

  throw createBlockedLatestPropsPayloadEntryError(entry, index);
}

function applyLatestPropsSafeDomPropertyPayloadEntry(instance, entry) {
  if (isOrdinaryPropertyPayloadEntry(entry)) {
    applyNormalizedPropertyPayloadEntry(instance, entry);
    return;
  }

  if (isStylePropertyPayloadEntry(entry)) {
    applyStylePayloadEntry(instance, entry);
  }
}

function applyAdmittedNormalizedPropertyPayloadEntry(instance, entry) {
  if (isOrdinaryPropertyPayloadEntry(entry)) {
    applyNormalizedPropertyPayloadEntry(instance, entry);
    return;
  }

  if (isStyleDangerousHtmlPayloadEntry(entry)) {
    applyStyleDangerousHtmlPayloadEntry(instance, entry);
    return;
  }

  if (isNonPayloadPropertyPayloadEntry(entry)) {
    return;
  }

  throw createDomHostMutationError(
    'FAST_REACT_DOM_UNSUPPORTED_PROPERTY_PAYLOAD_ENTRY',
    'Cannot apply an unrecognized admitted DOM property payload entry.'
  );
}

function createAppliedPropertyPayloadRecord(entry) {
  if (entry.kind === ENTRY_SET_ATTRIBUTE) {
    return {
      kind: entry.kind,
      attributeName: entry.attributeName,
      value: entry.value
    };
  }

  if (entry.kind === ENTRY_REMOVE_ATTRIBUTE) {
    return {
      kind: entry.kind,
      attributeName: entry.attributeName
    };
  }

  return {
    kind: entry.kind,
    propertyName: entry.propertyName,
    value: entry.value
  };
}

function createAdmittedPropertyPayloadRecord(entry) {
  if (isOrdinaryPropertyPayloadEntry(entry)) {
    return createAppliedPropertyPayloadRecord(entry);
  }

  return {...entry};
}

function createLatestPropsPayloadRecord(entry) {
  if (entry.kind === ENTRY_SET_ATTRIBUTE) {
    return Object.freeze({
      kind: entry.kind,
      attributeName: entry.attributeName,
      propName: entry.propName,
      value: entry.value
    });
  }

  if (entry.kind === ENTRY_REMOVE_ATTRIBUTE) {
    return Object.freeze({
      kind: entry.kind,
      attributeName: entry.attributeName,
      propName: entry.propName
    });
  }

  if (entry.kind === ENTRY_SET_PROPERTY) {
    return Object.freeze({
      kind: entry.kind,
      propertyName: entry.propertyName,
      propName: entry.propName,
      value: entry.value
    });
  }

  if (entry.kind === ENTRY_REMOVE_PROPERTY) {
    return Object.freeze({
      kind: entry.kind,
      propertyName: entry.propertyName,
      propName: entry.propName,
      value: null
    });
  }

  if (entry.kind === ENTRY_SET_STYLE || entry.kind === ENTRY_REMOVE_STYLE) {
    return Object.freeze({
      kind: entry.kind,
      mutation: entry.mutation,
      propName: entry.propName,
      styleName: entry.styleName,
      value: entry.value
    });
  }

  return Object.freeze({...entry});
}

function createDomPropertyUpdateLatestPropsHandoff(
  mutationRecords,
  latestPropsCommitRecord,
  rollbackRecords
) {
  const handoff = Object.freeze({
    kind: DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF,
    mutation: 'propertyUpdate',
    payloadCount: mutationRecords.length,
    status: 'mutated'
  });

  domPropertyUpdateLatestPropsHandoffPayloads.set(
    handoff,
    Object.freeze({
      latestPropsCommitRecord,
      mutationRecords,
      rollbackRecords
    })
  );

  return handoff;
}

function createDomPropertyPayloadMutationRecords(
  instance,
  records,
  rollbackRecords
) {
  const mutationRecords = Object.freeze(
    records.map((record) => Object.freeze({...record}))
  );
  const rollbackRecordCount = rollbackRecords.filter(Boolean).length;

  domPropertyPayloadMutationRecordsPayloads.set(
    mutationRecords,
    Object.freeze({
      mutationRecords,
      node: instance,
      rollbackRecordCount,
      rollbackRecords,
      rollbackSupported: true,
      status: 'mutated'
    })
  );

  return mutationRecords;
}

function rollbackDomPropertyUpdateLatestPropsHandoff(handoff) {
  const payload = getDomPropertyUpdateLatestPropsHandoffPayload(handoff);
  if (payload === null) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_MUTATION_HANDOFF_ROLLBACK',
      'Cannot roll back an invalid DOM property latest-props mutation handoff.'
    );
  }

  const latestPropsPayload = getLatestPropsCommitRecordPayload(
    payload.latestPropsCommitRecord
  );
  if (latestPropsPayload === null) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_COMMIT_ROLLBACK',
      'Cannot roll back a latest-props mutation handoff without a commit payload.'
    );
  }

  rollbackLatestPropsSafeDomPropertyPayloadEntries(
    latestPropsPayload.node,
    payload.rollbackRecords,
    payload.rollbackRecords.length
  );
  return payload.rollbackRecords.filter(Boolean).length;
}

function rollbackDomPropertyPayloadMutationRecords(records) {
  const payload = getDomPropertyPayloadMutationRecordsPayload(records);
  if (payload === null) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_MUTATION_ROLLBACK',
      'Cannot roll back invalid DOM property payload mutation records.'
    );
  }

  rollbackDomPropertyPayloadEntries(
    payload.node,
    payload.rollbackRecords,
    payload.rollbackRecords.length
  );
  return payload.rollbackRecordCount;
}

function createDomPropertyPayloadRollbackRecords(instance, entries) {
  return Object.freeze(
    entries.map((entry) => {
      const rollbackRecord = createDomPropertyPayloadRollbackRecord(
        instance,
        entry
      );
      return rollbackRecord === null ? null : Object.freeze(rollbackRecord);
    })
  );
}

function createDomPropertyPayloadRollbackRecord(instance, entry) {
  if (entry.kind === ENTRY_SET_ATTRIBUTE) {
    return createAttributePayloadRollbackRecord(
      instance,
      entry.attributeName
    );
  }

  if (entry.kind === ENTRY_REMOVE_ATTRIBUTE) {
    return createAttributePayloadRollbackRecord(
      instance,
      entry.attributeName
    );
  }

  if (entry.kind === ENTRY_SET_PROPERTY) {
    return createPropertyPayloadRollbackRecord(
      instance,
      entry.propertyName
    );
  }

  if (entry.kind === ENTRY_REMOVE_PROPERTY) {
    return createPropertyPayloadRollbackRecord(
      instance,
      entry.propertyName
    );
  }

  if (entry.kind === ENTRY_SET_STYLE || entry.kind === ENTRY_REMOVE_STYLE) {
    return createStylePayloadRollbackRecord(instance, entry);
  }

  if (entry.kind === ENTRY_SET_INNER_HTML) {
    return createInnerHtmlPayloadRollbackRecord(instance);
  }

  return null;
}

function createLatestPropsSafeDomPropertyPayloadRollbackRecords(
  instance,
  entries
) {
  return Object.freeze(
    entries.map((entry) => {
      const rollbackRecord =
        createLatestPropsSafeDomPropertyPayloadRollbackRecord(instance, entry);
      return rollbackRecord === null ? null : Object.freeze(rollbackRecord);
    })
  );
}

function createLatestPropsSafeDomPropertyPayloadRollbackRecord(
  instance,
  entry
) {
  if (entry.kind === ENTRY_SET_ATTRIBUTE) {
    return createAttributePayloadRollbackRecord(
      instance,
      entry.attributeName
    );
  }

  if (entry.kind === ENTRY_REMOVE_ATTRIBUTE) {
    return createAttributePayloadRollbackRecord(
      instance,
      entry.attributeName
    );
  }

  if (entry.kind === ENTRY_SET_PROPERTY) {
    return createPropertyPayloadRollbackRecord(
      instance,
      entry.propertyName
    );
  }

  if (entry.kind === ENTRY_REMOVE_PROPERTY) {
    return createPropertyPayloadRollbackRecord(
      instance,
      entry.propertyName
    );
  }

  if (entry.kind === ENTRY_SET_STYLE || entry.kind === ENTRY_REMOVE_STYLE) {
    return createStylePayloadRollbackRecord(instance, entry);
  }

  return null;
}

function createAttributePayloadRollbackRecord(instance, attributeName) {
  assertAttributeRollbackTarget(instance);
  const snapshot = getAttributeRollbackSnapshot(instance, attributeName);
  return {
    kind: 'attributeRollback',
    attributeName,
    hadAttribute: snapshot.hadAttribute,
    value: snapshot.value
  };
}

function createPropertyPayloadRollbackRecord(instance, propertyName) {
  return {
    kind: 'propertyRollback',
    propertyName,
    value: instance[propertyName]
  };
}

function createStylePayloadRollbackRecord(instance, entry) {
  return {
    kind: 'styleRollback',
    mutation: entry.mutation,
    styleName: entry.styleName,
    value: getStyleRollbackSnapshot(instance, entry)
  };
}

function createInnerHtmlPayloadRollbackRecord(instance) {
  return {
    kind: 'innerHTMLRollback',
    childNodes: getInnerHtmlRollbackChildNodes(instance),
    propertyName: 'innerHTML',
    value: getInnerHtmlRollbackSnapshot(instance)
  };
}

function assertAttributeRollbackTarget(instance) {
  if (
    typeof instance.setAttribute === 'function' &&
    typeof instance.removeAttribute === 'function'
  ) {
    return;
  }

  throw createDomHostMutationError(
    'FAST_REACT_DOM_UNSUPPORTED_PROPERTY_PAYLOAD_ROLLBACK_TARGET',
    'Cannot publish latest props from a node without reversible attribute mutation methods.'
  );
}

function getAttributeRollbackSnapshot(instance, attributeName) {
  if (
    typeof instance.hasAttribute === 'function' &&
    typeof instance.getAttribute === 'function'
  ) {
    const hadAttribute = !!instance.hasAttribute(attributeName);
    return {
      hadAttribute,
      value: hadAttribute ? String(instance.getAttribute(attributeName)) : null
    };
  }

  if (instance.attributes instanceof Map) {
    const hadAttribute = instance.attributes.has(attributeName);
    return {
      hadAttribute,
      value: hadAttribute ? String(instance.attributes.get(attributeName)) : null
    };
  }

  throw createDomHostMutationError(
    'FAST_REACT_DOM_UNSUPPORTED_PROPERTY_PAYLOAD_ROLLBACK_TARGET',
    'Cannot publish latest props from a node without attribute snapshot support.'
  );
}

function rollbackDomPropertyPayloadEntries(
  instance,
  rollbackRecords,
  rollbackLimit
) {
  let firstRollbackError = null;
  for (let index = rollbackLimit - 1; index >= 0; index -= 1) {
    const rollbackRecord = rollbackRecords[index];
    if (rollbackRecord === null) {
      continue;
    }
    try {
      applyDomPropertyPayloadRollbackRecord(instance, rollbackRecord);
    } catch (error) {
      if (firstRollbackError === null) {
        firstRollbackError = error;
      }
    }
  }

  if (firstRollbackError !== null) {
    throw firstRollbackError;
  }
}

function rollbackLatestPropsSafeDomPropertyPayloadEntries(
  instance,
  rollbackRecords,
  rollbackLimit
) {
  rollbackDomPropertyPayloadEntries(instance, rollbackRecords, rollbackLimit);
}

function applyDomPropertyPayloadRollbackRecord(
  instance,
  rollbackRecord
) {
  if (rollbackRecord.kind === 'attributeRollback') {
    if (attributeRollbackRecordMatchesCurrentValue(instance, rollbackRecord)) {
      return;
    }

    if (rollbackRecord.hadAttribute) {
      instance.setAttribute(
        rollbackRecord.attributeName,
        rollbackRecord.value
      );
    } else {
      instance.removeAttribute(rollbackRecord.attributeName);
    }
    return;
  }

  if (rollbackRecord.kind === 'propertyRollback') {
    if (instance[rollbackRecord.propertyName] === rollbackRecord.value) {
      return;
    }

    instance[rollbackRecord.propertyName] = rollbackRecord.value;
    return;
  }

  if (rollbackRecord.kind === 'styleRollback') {
    if (styleRollbackRecordMatchesCurrentValue(instance, rollbackRecord)) {
      return;
    }
    applyStyleRollbackRecord(instance, rollbackRecord);
    return;
  }

  if (rollbackRecord.kind === 'innerHTMLRollback') {
    if (innerHtmlRollbackRecordMatchesCurrentValue(instance, rollbackRecord)) {
      return;
    }
    applyInnerHtmlRollbackRecord(instance, rollbackRecord);
    return;
  }

  throw createDomHostMutationError(
    'FAST_REACT_DOM_INVALID_PROPERTY_PAYLOAD_ROLLBACK_RECORD',
    'Cannot roll back an invalid DOM property payload record.'
  );
}

function attributeRollbackRecordMatchesCurrentValue(instance, rollbackRecord) {
  const snapshot = getAttributeRollbackSnapshot(
    instance,
    rollbackRecord.attributeName
  );
  return (
    snapshot.hadAttribute === rollbackRecord.hadAttribute &&
    snapshot.value === rollbackRecord.value
  );
}

function getStyleRollbackSnapshot(instance, entry) {
  assertStyleTarget(instance);

  const style = instance.style;
  if (entry.mutation === 'setProperty') {
    if (typeof style.getPropertyValue === 'function') {
      return String(style.getPropertyValue(entry.styleName) || '');
    }
    if (style.properties instanceof Map) {
      return style.properties.has(entry.styleName)
        ? String(style.properties.get(entry.styleName))
        : '';
    }
  }

  const value = style[entry.styleName];
  return value == null ? '' : String(value);
}

function getInnerHtmlRollbackSnapshot(instance) {
  if (!('innerHTML' in instance)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_UNSUPPORTED_PROPERTY_PAYLOAD_ROLLBACK_TARGET',
      'Cannot roll back an innerHTML payload on a node without innerHTML.'
    );
  }

  return String(instance.innerHTML);
}

function getInnerHtmlRollbackChildNodes(instance) {
  if (!Array.isArray(instance.childNodes)) {
    return null;
  }

  return Object.freeze(instance.childNodes.slice());
}

function styleRollbackRecordMatchesCurrentValue(instance, rollbackRecord) {
  return (
    getStyleRollbackSnapshot(instance, rollbackRecord) ===
    rollbackRecord.value
  );
}

function innerHtmlRollbackRecordMatchesCurrentValue(instance, rollbackRecord) {
  if (getInnerHtmlRollbackSnapshot(instance) !== rollbackRecord.value) {
    return false;
  }

  if (rollbackRecord.childNodes === null) {
    return true;
  }

  return childNodeSnapshotsMatch(instance.childNodes, rollbackRecord.childNodes);
}

function childNodeSnapshotsMatch(currentChildNodes, rollbackChildNodes) {
  if (!Array.isArray(currentChildNodes)) {
    return false;
  }

  if (currentChildNodes.length !== rollbackChildNodes.length) {
    return false;
  }

  for (let index = 0; index < currentChildNodes.length; index += 1) {
    if (currentChildNodes[index] !== rollbackChildNodes[index]) {
      return false;
    }
  }

  return true;
}

function applyStyleRollbackRecord(instance, rollbackRecord) {
  assertStyleTarget(instance);
  if (rollbackRecord.mutation === 'setProperty') {
    assertStyleSetPropertyTarget(instance);
    instance.style.setProperty(
      rollbackRecord.styleName,
      rollbackRecord.value
    );
    return;
  }

  instance.style[rollbackRecord.styleName] = rollbackRecord.value;
}

function applyInnerHtmlRollbackRecord(instance, rollbackRecord) {
  if (getInnerHtmlRollbackSnapshot(instance) !== rollbackRecord.value) {
    instance.innerHTML = rollbackRecord.value;
  }

  if (
    rollbackRecord.childNodes !== null &&
    Array.isArray(instance.childNodes) &&
    !childNodeSnapshotsMatch(instance.childNodes, rollbackRecord.childNodes)
  ) {
    const nextChildren = rollbackRecord.childNodes.slice();
    for (const child of instance.childNodes) {
      if (
        child &&
        typeof child === 'object' &&
        child.parentNode === instance &&
        !nextChildren.includes(child)
      ) {
        child.parentNode = null;
      }
    }
    for (const child of nextChildren) {
      if (child && typeof child === 'object') {
        child.parentNode = instance;
      }
    }
    instance.childNodes = nextChildren;
  }
}

function assertChildNode(child, operation) {
  assertDomLikeObject(child, operation, 'child');
}

function assertDomLikeObject(value, operation, role) {
  if (value == null || typeof value !== 'object') {
    throw createDomHostMutationError(
      role === 'parent'
        ? 'FAST_REACT_DOM_INVALID_PARENT_NODE'
        : 'FAST_REACT_DOM_INVALID_CHILD_NODE',
      `Cannot ${operation} with an invalid ${role} node.`
    );
  }
}

function isWeakMapKey(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function normalizeLatestPropsCommitPayloadRecords(payloadRecords) {
  if (payloadRecords == null) {
    return Object.freeze([]);
  }

  if (!Array.isArray(payloadRecords)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_PAYLOAD',
      'Cannot create a latest-props commit record from a non-array payload.'
    );
  }

  return Object.freeze(
    payloadRecords.map((payloadRecord, index) =>
      cloneSafeLatestPropsPayloadRecord(payloadRecord, index)
    )
  );
}

function cloneSafeLatestPropsPayloadRecord(payloadRecord, index) {
  if (payloadRecord == null || typeof payloadRecord !== 'object') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_PAYLOAD_RECORD',
      `Cannot include invalid latest-props payload record at index ${index}.`
    );
  }

  const kind = payloadRecord.kind;
  if (!latestPropsSafePayloadKinds.has(kind)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_UNSAFE_LATEST_PROPS_PAYLOAD_RECORD',
      `Cannot publish latest props from unsafe payload record kind ${String(
        kind
      )}.`
    );
  }

  if (kind === 'setAttribute') {
    assertStringPayloadField(payloadRecord, 'propName', index);
    assertStringPayloadField(payloadRecord, 'attributeName', index);
  } else if (kind === 'removeAttribute') {
    assertStringPayloadField(payloadRecord, 'propName', index);
    assertStringPayloadField(payloadRecord, 'attributeName', index);
  } else if (kind === 'setProperty') {
    assertStringPayloadField(payloadRecord, 'propName', index);
    assertStringPayloadField(payloadRecord, 'propertyName', index);
  } else if (kind === 'removeProperty') {
    assertStringPayloadField(payloadRecord, 'propName', index);
    assertStringPayloadField(payloadRecord, 'propertyName', index);
  } else if (kind === 'setStyle' || kind === 'removeStyle') {
    assertStringPayloadField(payloadRecord, 'propName', index);
    assertStringPayloadField(payloadRecord, 'styleName', index);
    assertStringPayloadField(payloadRecord, 'mutation', index);
    assertStringPayloadField(payloadRecord, 'value', index);
  } else {
    assertStringPayloadField(payloadRecord, 'propName', index);
    assertStringPayloadField(payloadRecord, 'category', index);
  }

  return Object.freeze({...payloadRecord});
}

function assertStringPayloadField(payloadRecord, fieldName, index) {
  if (typeof payloadRecord[fieldName] !== 'string') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_PAYLOAD_RECORD',
      `Cannot include latest-props payload record at index ${index} without a string ${fieldName}.`
    );
  }
}

function assertCanMoveIntoParent(parent, child, operation) {
  if (parent === child || isAncestorOf(child, parent)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_MUTATION_TARGET',
      `Cannot ${operation} a parent into itself or one of its descendants.`
    );
  }
}

function assertCurrentChild(parent, child, code, message) {
  if (child.parentNode === parent) {
    return;
  }

  if (Array.isArray(parent.childNodes) && parent.childNodes.includes(child)) {
    return;
  }

  throw createDomHostMutationError(code, message);
}

function getFirstChild(parent) {
  if (parent.firstChild !== undefined) {
    return parent.firstChild || null;
  }

  if (Array.isArray(parent.childNodes) && parent.childNodes.length > 0) {
    return parent.childNodes[0];
  }

  return null;
}

function isAncestorOf(candidateAncestor, node) {
  let current = node;
  while (current != null) {
    if (current === candidateAncestor) {
      return true;
    }
    current = current.parentNode || null;
  }
  return false;
}

function setTextNodeValue(textInstance, text, operation) {
  assertDomLikeObject(textInstance, operation, 'child');
  const stringText = String(text);

  if ('nodeValue' in textInstance) {
    textInstance.nodeValue = stringText;
    return;
  }

  if ('data' in textInstance) {
    textInstance.data = stringText;
    return;
  }

  if ('textContent' in textInstance) {
    textInstance.textContent = stringText;
    return;
  }

  throw createDomHostMutationError(
    'FAST_REACT_DOM_INVALID_TEXT_INSTANCE',
    `Cannot ${operation} on a text node without data, nodeValue, or textContent.`
  );
}

function setNodeTextContent(instance, text, operation) {
  assertDomLikeObject(instance, operation, 'parent');
  if (!('textContent' in instance)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_TEXT_CONTENT_TARGET',
      `Cannot ${operation} on a node without textContent.`
    );
  }

  const stringText = String(text);
  if (stringText !== '') {
    const firstChild = getFirstChild(instance);
    if (
      firstChild !== null &&
      firstChild === getLastChild(instance) &&
      isTextNode(firstChild)
    ) {
      setTextNodeValue(firstChild, stringText, operation);
      return;
    }
  }

  instance.textContent = stringText;
}

function getLastChild(parent) {
  if (parent.lastChild !== undefined) {
    return parent.lastChild || null;
  }

  if (Array.isArray(parent.childNodes) && parent.childNodes.length > 0) {
    return parent.childNodes[parent.childNodes.length - 1];
  }

  return null;
}

function isTextNode(node) {
  return (
    node != null &&
    typeof node === 'object' &&
    (node.nodeType === 3 || node.nodeName === '#text')
  );
}

function getOwnerDocumentForHostText(rootContainerInstance, operation) {
  assertDomLikeObject(rootContainerInstance, operation, 'parent');

  if (rootContainerInstance.nodeType === 9) {
    return rootContainerInstance;
  }

  const ownerDocument = rootContainerInstance.ownerDocument;
  if (ownerDocument != null && typeof ownerDocument === 'object') {
    return ownerDocument;
  }

  throw createDomHostMutationError(
    'FAST_REACT_DOM_INVALID_TEXT_CREATION_TARGET',
    'Cannot create HostText from a container without an owner document.'
  );
}

function validateStyleDangerousHtmlPayloadEntry(instance, entry) {
  if (entry == null || typeof entry !== 'object') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PAYLOAD_ENTRY',
      'Cannot apply a malformed style/dangerous HTML payload entry.'
    );
  }

  switch (entry.kind) {
    case ENTRY_SET_STYLE:
      return validateStylePayloadEntry(instance, entry, ENTRY_SET_STYLE);
    case ENTRY_REMOVE_STYLE:
      return validateStylePayloadEntry(instance, entry, ENTRY_REMOVE_STYLE);
    case ENTRY_SET_INNER_HTML:
      return validateInnerHtmlPayloadEntry(instance, entry);
    case ENTRY_SET_ATTRIBUTE:
    case ENTRY_REMOVE_ATTRIBUTE:
      throw createDomHostMutationError(
        'FAST_REACT_DOM_UNSUPPORTED_PAYLOAD_ENTRY',
        'Ordinary attribute payload entries are reserved for the DOM attribute applier.'
      );
    case ENTRY_NON_PAYLOAD:
      throw createDomHostMutationError(
        'FAST_REACT_DOM_NON_PAYLOAD_ENTRY',
        'Cannot apply a non-payload entry through the style/dangerous HTML applier.'
      );
    case ENTRY_UNSUPPORTED:
      throw createDomHostMutationError(
        'FAST_REACT_DOM_UNSUPPORTED_PAYLOAD_ENTRY',
        'Cannot apply an unsupported style/dangerous HTML payload entry.'
      );
    default:
      throw createDomHostMutationError(
        'FAST_REACT_DOM_INVALID_PAYLOAD_ENTRY',
        'Cannot apply an unknown style/dangerous HTML payload entry.'
      );
  }
}

function validateStylePayloadEntry(instance, entry, kind) {
  assertStyleTarget(instance);

  const styleName = entry.styleName;
  if (entry.propName !== 'style' || typeof styleName !== 'string') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PAYLOAD_ENTRY',
      'Cannot apply a malformed style payload entry.'
    );
  }

  if (
    entry.mutation !== 'propertyAssignment' &&
    entry.mutation !== 'setProperty'
  ) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PAYLOAD_ENTRY',
      'Cannot apply a style payload entry with an unsupported mutation target.'
    );
  }

  if (entry.mutation === 'setProperty') {
    assertStyleSetPropertyTarget(instance);
  }

  if (kind === ENTRY_REMOVE_STYLE) {
    if (entry.value !== '') {
      throw createDomHostMutationError(
        'FAST_REACT_DOM_INVALID_PAYLOAD_ENTRY',
        'Cannot apply a removeStyle payload entry without an empty string value.'
      );
    }
  } else if (typeof entry.value !== 'string') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PAYLOAD_ENTRY',
      'Cannot apply a setStyle payload entry without a string value.'
    );
  }

  return {
    kind,
    propName: 'style',
    styleName,
    mutation: entry.mutation,
    value: entry.value
  };
}

function validateInnerHtmlPayloadEntry(instance, entry) {
  if (
    entry.propName !== 'dangerouslySetInnerHTML' ||
    entry.propertyName !== 'innerHTML' ||
    typeof entry.value !== 'string'
  ) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_PAYLOAD_ENTRY',
      'Cannot apply a malformed innerHTML payload entry.'
    );
  }

  if (!('innerHTML' in instance)) {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_INNER_HTML_TARGET',
      'Cannot apply an innerHTML payload entry to a node without innerHTML.'
    );
  }

  return {
    kind: ENTRY_SET_INNER_HTML,
    propName: 'dangerouslySetInnerHTML',
    propertyName: 'innerHTML',
    value: entry.value
  };
}

function assertStyleTarget(instance) {
  if (instance.style == null || typeof instance.style !== 'object') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_STYLE_TARGET',
      'Cannot apply a style payload entry to a node without a style object.'
    );
  }
}

function assertStyleSetPropertyTarget(instance) {
  if (typeof instance.style.setProperty !== 'function') {
    throw createDomHostMutationError(
      'FAST_REACT_DOM_INVALID_STYLE_TARGET',
      'Cannot apply a custom style payload entry without style.setProperty.'
    );
  }
}

function applyStyleDangerousHtmlPayloadEntry(instance, entry) {
  switch (entry.kind) {
    case ENTRY_SET_STYLE:
    case ENTRY_REMOVE_STYLE:
      applyStylePayloadEntry(instance, entry);
      return;
    case ENTRY_SET_INNER_HTML:
      instance.innerHTML = entry.value;
      return;
    default:
      throw createDomHostMutationError(
        'FAST_REACT_DOM_INVALID_PAYLOAD_ENTRY',
        'Cannot apply a non-style/dangerous HTML payload entry.'
      );
  }
}

function applyStylePayloadEntry(instance, entry) {
  const style = instance.style;
  if (entry.mutation === 'setProperty') {
    style.setProperty(entry.styleName, entry.value);
    return;
  }

  style[entry.styleName] = entry.value;
}

module.exports = {
  DOM_HOST_TEXT_COMMIT_GATE_METADATA,
  DOM_TEXT_CONTENT_RESET_UPDATE_MUTATION_GATE_METADATA,
  DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF,
  CLEAR_CONTAINER_FOR_ROOT_UNMOUNT_RECORD,
  appendChild,
  appendChildToContainer,
  appendInitialChild,
  applyAdmittedDomPropertyPayload,
  applyDomPropertyPayload,
  applyDomPropertyPayloadForLatestProps,
  applyStyleDangerousHtmlPayload,
  clearContainer,
  clearContainerForRootUnmount,
  commitDomPropertyUpdateForLatestProps,
  commitTextUpdate,
  commitDomPropertyUpdate,
  createDomHostElementInstance,
  createDomHostTextInstance,
  createDomHostMutationError,
  createLatestPropsCommitRecord,
  getClearContainerForRootUnmountRecordPayload,
  getDomPropertyPayloadMutationRecordsPayload,
  getDomPropertyUpdateLatestPropsHandoffPayload,
  getLatestPropsCommitRecordPayload,
  insertBefore,
  insertInContainerBefore,
  isClearContainerForRootUnmountRecord,
  isDomPropertyPayloadMutationRecords,
  isDomPropertyUpdateLatestPropsHandoff,
  isLatestPropsCommitRecord,
  LATEST_PROPS_COMMIT_RECORD,
  removeChild,
  removeChildFromContainer,
  resetTextContent,
  rollbackDomPropertyPayloadMutationRecords,
  rollbackDomPropertyUpdateLatestPropsHandoff,
  setTextContent
};
