'use strict';

const {ELEMENT_NODE, TEXT_NODE} = require('./dom-container.js');
const {getContainerRoot} = require('./root-markers.js');
const {
  getDomPropertyUpdateLatestPropsHandoffPayload,
  getLatestPropsCommitRecordPayload,
  rollbackDomPropertyUpdateLatestPropsHandoff
} = require('../dom-host/mutation.js');

const hostInstanceMarkerPrefix = '__fastReactHostInstance$';
const latestPropsMarkerPrefix = '__fastReactProps$';
const randomKey = Math.random().toString(36).slice(2);
const internalHostInstanceTokenKey = hostInstanceMarkerPrefix + randomKey;
const internalLatestPropsKey = latestPropsMarkerPrefix + randomKey;
const hostInstanceTokenBrand = Symbol('fast.react.dom.hostInstanceToken');
const EVENT_TARGET_NORMALIZATION_RECORD_KIND =
  'FastReactDomEventTargetNormalizationRecord';
const EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND =
  'FastReactDomEventListenerTargetLookupRecord';
const EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE =
  'FAST_REACT_DOM_EVENT_LISTENER_TARGET_LOOKUP_BLOCKED';
const INVALID_EVENT_TARGET_NORMALIZATION_RECORD_CODE =
  'FAST_REACT_DOM_INVALID_EVENT_TARGET_NORMALIZATION_RECORD';
const EVENT_LISTENER_TARGET_LOOKUP_NODE_MISMATCH_CODE =
  'FAST_REACT_DOM_EVENT_LISTENER_TARGET_LOOKUP_NODE_MISMATCH';
const EVENT_LISTENER_TARGET_LOOKUP_UNMOUNTED_CODE =
  'FAST_REACT_DOM_EVENT_LISTENER_TARGET_LOOKUP_UNMOUNTED';
const INVALID_EVENT_LISTENER_REGISTRATION_NAME_CODE =
  'FAST_REACT_DOM_INVALID_EVENT_LISTENER_REGISTRATION_NAME';
const INVALID_EVENT_LISTENER_LATEST_PROPS_CODE =
  'FAST_REACT_DOM_INVALID_EVENT_LISTENER_LATEST_PROPS';
const INVALID_EVENT_LISTENER_CODE =
  'FAST_REACT_DOM_INVALID_EVENT_LISTENER';
const HOST_INSTANCE_NODE_RECORD_KIND =
  'FastReactDomComponentTreeHostInstanceNodeRecord';
const privateHostInstanceNodeRecordType =
  'fast.react_dom.private_component_tree_host_instance_node_record';

const tokenMetadata = new WeakMap();
const tokenToNode = new WeakMap();
const eventListenerTargetLookupRecordPayloads = new WeakMap();
const hostInstanceNodeRecordPayloads = new WeakMap();

const disabledMouseEventRegistrationNames = new Set([
  'onClick',
  'onClickCapture',
  'onDoubleClick',
  'onDoubleClickCapture',
  'onMouseDown',
  'onMouseDownCapture',
  'onMouseMove',
  'onMouseMoveCapture',
  'onMouseUp',
  'onMouseUpCapture',
  'onMouseEnter'
]);
const interactiveTagNames = new Set([
  'button',
  'input',
  'select',
  'textarea'
]);

function isObjectLike(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function isHostInstanceNode(node) {
  if (!isObjectLike(node)) {
    return false;
  }

  return node.nodeType === ELEMENT_NODE || node.nodeType === TEXT_NODE;
}

function createComponentTreeError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertHostInstanceNode(node) {
  if (!isHostInstanceNode(node)) {
    throw createComponentTreeError(
      'Cannot attach React DOM component tree metadata to a non-host DOM node.',
      'FAST_REACT_DOM_INVALID_HOST_INSTANCE_NODE'
    );
  }
  return node;
}

function assertOwner(owner, message, code) {
  if (owner == null) {
    throw createComponentTreeError(message, code);
  }
  return owner;
}

function createHostInstanceToken(hostOwner, rootOwner) {
  assertOwner(
    hostOwner,
    'Cannot create a React DOM host instance token without a host owner.',
    'FAST_REACT_DOM_MISSING_HOST_OWNER'
  );
  assertOwner(
    rootOwner,
    'Cannot create a React DOM host instance token without a root owner.',
    'FAST_REACT_DOM_MISSING_ROOT_OWNER'
  );

  const token = Object.create(null);
  Object.defineProperties(token, {
    [hostInstanceTokenBrand]: {
      value: true
    },
    [Symbol.toStringTag]: {
      value: 'FastReactDomHostInstanceToken'
    }
  });

  tokenMetadata.set(token, {
    hostOwner,
    rootOwner
  });

  return Object.freeze(token);
}

function isHostInstanceToken(value) {
  return isObjectLike(value) && value[hostInstanceTokenBrand] === true;
}

function getHostInstanceMetadata(token) {
  if (!isHostInstanceToken(token)) {
    return null;
  }
  return tokenMetadata.get(token) || null;
}

function assertKnownHostInstanceToken(token) {
  const metadata = getHostInstanceMetadata(token);
  if (metadata === null) {
    throw createComponentTreeError(
      'Cannot use an unknown or detached React DOM host instance token.',
      'FAST_REACT_DOM_INVALID_HOST_INSTANCE_TOKEN'
    );
  }
  return metadata;
}

function getMountedHostInstanceNodeFromToken(token) {
  if (getHostInstanceMetadata(token) === null) {
    return null;
  }

  const node = tokenToNode.get(token);
  if (node === undefined) {
    return null;
  }

  return node[internalHostInstanceTokenKey] === token ? node : null;
}

function assertMountedHostInstanceToken(token) {
  assertKnownHostInstanceToken(token);

  const node = getMountedHostInstanceNodeFromToken(token);
  if (node === null) {
    throw createComponentTreeError(
      'Cannot use an unmounted React DOM host instance token.',
      'FAST_REACT_DOM_UNMOUNTED_HOST_INSTANCE_TOKEN'
    );
  }

  return node;
}

function getAttachedNodeFromHostInstanceToken(token) {
  return getMountedHostInstanceNodeFromToken(token);
}

function getHostInstanceTokenFromNode(node) {
  if (!isObjectLike(node)) {
    return null;
  }

  const token = node[internalHostInstanceTokenKey];
  if (getHostInstanceMetadata(token) === null) {
    return null;
  }

  return tokenToNode.get(token) === node ? token : null;
}

function getMountedHostInstanceTokenFromNode(node) {
  return getHostInstanceTokenFromNode(node);
}

function getClosestMountedHostInstanceTokenFromNode(targetNode) {
  let currentNode = isObjectLike(targetNode) ? targetNode : null;

  while (currentNode !== null) {
    const token = getMountedHostInstanceTokenFromNode(currentNode);
    if (token !== null) {
      return token;
    }

    if (getContainerRoot(currentNode) !== null) {
      return null;
    }

    currentNode = isObjectLike(currentNode.parentNode)
      ? currentNode.parentNode
      : null;
  }

  return null;
}

function getClosestMountedHostInstanceNodeFromNode(targetNode) {
  const token = getClosestMountedHostInstanceTokenFromNode(targetNode);
  return token === null ? null : getMountedHostInstanceNodeFromToken(token);
}

function createEventTargetNormalizationRecord(targetNode) {
  const normalizedTargetNode = isObjectLike(targetNode) ? targetNode : null;
  const closestMountedHostInstanceToken =
    getClosestMountedHostInstanceTokenFromNode(normalizedTargetNode);
  const directMountedHostInstanceToken =
    getMountedHostInstanceTokenFromNode(normalizedTargetNode);
  const closestMountedHostInstanceNode =
    closestMountedHostInstanceToken === null
      ? null
      : getMountedHostInstanceNodeFromToken(closestMountedHostInstanceToken);
  const hostOwner =
    closestMountedHostInstanceToken === null
      ? null
      : getHostInstanceOwnerFromToken(closestMountedHostInstanceToken);
  const rootOwner =
    closestMountedHostInstanceToken === null
      ? null
      : getRootOwnerFromHostInstanceToken(closestMountedHostInstanceToken);
  const latestProps =
    closestMountedHostInstanceToken === null
      ? null
      : getLatestPropsFromHostInstanceToken(closestMountedHostInstanceToken);

  return Object.freeze({
    closestMountedHostInstanceNode,
    closestMountedHostInstanceToken,
    directMountedHostInstanceToken,
    hostOwner,
    isDirectMountedHostInstance:
      directMountedHostInstanceToken !== null &&
      directMountedHostInstanceToken === closestMountedHostInstanceToken,
    kind: EVENT_TARGET_NORMALIZATION_RECORD_KIND,
    latestPropsStatus: latestProps === null ? 'missing' : 'present',
    mountedHostInstanceFound: closestMountedHostInstanceToken !== null,
    rootOwner,
    status:
      closestMountedHostInstanceToken === null
        ? 'no-mounted-host-instance'
        : 'mounted-host-instance',
    targetNode: normalizedTargetNode,
    targetNodeType:
      normalizedTargetNode !== null &&
      typeof normalizedTargetNode.nodeType === 'number'
        ? normalizedTargetNode.nodeType
        : null
  });
}

function createMountedHostInstanceNodeRecord(token) {
  assertKnownHostInstanceToken(token);

  const node = getMountedHostInstanceNodeFromToken(token);
  if (node === null) {
    throw createComponentTreeError(
      'Cannot create a React DOM host instance node record from an unmounted token.',
      'FAST_REACT_DOM_UNMOUNTED_HOST_INSTANCE_TOKEN'
    );
  }

  const hostOwner = getHostInstanceOwnerFromToken(token);
  const rootOwner = getRootOwnerFromHostInstanceToken(token);
  const latestProps = getLatestPropsFromNode(node);
  const hasLatestRef =
    latestProps !== null &&
    typeof latestProps === 'object' &&
    Object.prototype.hasOwnProperty.call(latestProps, 'ref');
  const latestRef = hasLatestRef ? latestProps.ref : undefined;

  const record = Object.freeze({
    $$typeof: privateHostInstanceNodeRecordType,
    kind: HOST_INSTANCE_NODE_RECORD_KIND,
    status: 'mounted-host-instance-node',
    hostInstanceToken: token,
    hostOwner,
    rootOwner,
    nodeType: typeof node.nodeType === 'number' ? node.nodeType : null,
    latestPropsStatus: latestProps === null ? 'missing' : 'present',
    latestRefStatus: hasLatestRef ? 'present' : 'missing',
    exposesHostNode: false,
    exposesLatestProps: false
  });

  hostInstanceNodeRecordPayloads.set(
    record,
    Object.freeze({
      node,
      token,
      hostOwner,
      rootOwner,
      latestProps,
      hasLatestRef,
      latestRef
    })
  );

  return record;
}

function createEventListenerTargetLookupRecord(
  targetNormalizationRecord,
  registrationName
) {
  const normalizedTargetRecord =
    assertEventTargetNormalizationRecord(targetNormalizationRecord);
  const normalizedRegistrationName =
    normalizeEventListenerRegistrationName(registrationName);
  assertTargetNodeDoesNotHaveMismatchedHostInstanceToken(
    normalizedTargetRecord.targetNode
  );
  const hostInstanceToken =
    normalizedTargetRecord.closestMountedHostInstanceToken;

  if (hostInstanceToken === null) {
    return createEventListenerTargetLookupRecordFromPayload({
      componentTreeStatus: normalizedTargetRecord.status,
      hostInstanceNode: null,
      hostInstanceToken: null,
      latestProps: null,
      latestPropsStatus: 'missing',
      listener: null,
      listenerFound: false,
      listenerStatus:
        normalizedRegistrationName === null
          ? 'not-applicable'
          : 'no-mounted-host-instance',
      listenerType: 'missing',
      normalizedTargetRecord,
      registrationName: normalizedRegistrationName
    });
  }

  const hostInstanceNode = getMountedHostInstanceNodeFromToken(
    hostInstanceToken
  );
  if (hostInstanceNode === null) {
    throw createComponentTreeError(
      'Cannot look up a React DOM event listener for an unmounted host instance token.',
      EVENT_LISTENER_TARGET_LOOKUP_UNMOUNTED_CODE
    );
  }

  if (
    hostInstanceNode !==
    normalizedTargetRecord.closestMountedHostInstanceNode
  ) {
    throw createComponentTreeError(
      'Cannot look up a React DOM event listener when the target record node does not match the mounted host instance token.',
      EVENT_LISTENER_TARGET_LOOKUP_NODE_MISMATCH_CODE
    );
  }

  const latestProps = getLatestPropsFromNode(hostInstanceNode);
  if (latestProps === null) {
    return createEventListenerTargetLookupRecordFromPayload({
      componentTreeStatus: normalizedTargetRecord.status,
      hostInstanceNode,
      hostInstanceToken,
      latestProps: null,
      latestPropsStatus: 'missing',
      listener: null,
      listenerFound: false,
      listenerStatus: 'missing-latest-props',
      listenerType: 'missing',
      normalizedTargetRecord,
      registrationName: normalizedRegistrationName
    });
  }

  if (!isObjectLike(latestProps)) {
    throw createComponentTreeError(
      'Cannot look up a React DOM event listener from non-object latest props.',
      INVALID_EVENT_LISTENER_LATEST_PROPS_CODE
    );
  }

  if (normalizedRegistrationName === null) {
    return createEventListenerTargetLookupRecordFromPayload({
      componentTreeStatus: normalizedTargetRecord.status,
      hostInstanceNode,
      hostInstanceToken,
      latestProps,
      latestPropsStatus: 'present',
      listener: null,
      listenerFound: false,
      listenerStatus: 'not-applicable',
      listenerType: 'missing',
      normalizedTargetRecord,
      registrationName: null
    });
  }

  const listener = Object.prototype.hasOwnProperty.call(
    latestProps,
    normalizedRegistrationName
  )
    ? latestProps[normalizedRegistrationName]
    : null;

  if (
    listener != null &&
    shouldPreventMouseEvent(
      normalizedRegistrationName,
      hostInstanceNode,
      latestProps
    )
  ) {
    return createEventListenerTargetLookupRecordFromPayload({
      componentTreeStatus: normalizedTargetRecord.status,
      hostInstanceNode,
      hostInstanceToken,
      latestProps,
      latestPropsStatus: 'present',
      listener: null,
      listenerFound: false,
      listenerStatus: 'disabled-interactive-blocked',
      listenerType: 'blocked',
      normalizedTargetRecord,
      registrationName: normalizedRegistrationName
    });
  }

  if (listener != null && typeof listener !== 'function') {
    throw createComponentTreeError(
      `Expected \`${normalizedRegistrationName}\` listener to be a function, instead got a value of \`${typeof listener}\` type.`,
      INVALID_EVENT_LISTENER_CODE
    );
  }

  return createEventListenerTargetLookupRecordFromPayload({
    componentTreeStatus: normalizedTargetRecord.status,
    hostInstanceNode,
    hostInstanceToken,
    latestProps,
    latestPropsStatus: 'present',
    listener: listener == null ? null : listener,
    listenerFound: listener != null,
    listenerStatus: listener == null ? 'missing' : 'present',
    listenerType: listener == null ? 'missing' : 'function',
    normalizedTargetRecord,
    registrationName: normalizedRegistrationName
  });
}

function getEventListenerTargetLookupRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return eventListenerTargetLookupRecordPayloads.get(record) || null;
}

function isEventListenerTargetLookupRecord(record) {
  return getEventListenerTargetLookupRecordPayload(record) !== null;
}

function getPrivateHostInstanceNodeRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return hostInstanceNodeRecordPayloads.get(record) || null;
}

function isPrivateHostInstanceNodeRecord(value) {
  return getPrivateHostInstanceNodeRecordPayload(value) !== null;
}

function createEventListenerTargetLookupRecordFromPayload(payload) {
  const record = Object.freeze({
    blockedReason: EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE,
    componentTreeStatus: payload.componentTreeStatus,
    exposesLatestProps: false,
    exposesListener: false,
    hostOwner:
      payload.hostInstanceToken === null
        ? null
        : getHostInstanceOwnerFromToken(payload.hostInstanceToken),
    kind: EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
    latestPropsStatus: payload.latestPropsStatus,
    listenerFound: payload.listenerFound,
    listenerInvocationCount: 0,
    listenerStatus: payload.listenerStatus,
    listenerType: payload.listenerType,
    publicRootBehaviorChanged: false,
    registrationName: payload.registrationName,
    rootOwner:
      payload.hostInstanceToken === null
        ? null
        : getRootOwnerFromHostInstanceToken(payload.hostInstanceToken),
    status: 'blocked',
    syntheticEventCount: 0,
    targetHostInstanceNode: payload.hostInstanceNode,
    targetHostInstanceStatus: payload.componentTreeStatus,
    targetHostInstanceToken: payload.hostInstanceToken,
    targetNode: payload.normalizedTargetRecord.targetNode,
    targetNormalizationRecord: payload.normalizedTargetRecord,
    willInvokeListener: false
  });

  eventListenerTargetLookupRecordPayloads.set(
    record,
    Object.freeze({
      hostInstanceNode: payload.hostInstanceNode,
      hostInstanceToken: payload.hostInstanceToken,
      latestProps: payload.latestProps,
      listener: payload.listener,
      targetNormalizationRecord: payload.normalizedTargetRecord
    })
  );

  return record;
}

function assertEventTargetNormalizationRecord(record) {
  if (
    !isObjectLike(record) ||
    record.kind !== EVENT_TARGET_NORMALIZATION_RECORD_KIND
  ) {
    throw createComponentTreeError(
      'Cannot look up a React DOM event listener without a private target normalization record.',
      INVALID_EVENT_TARGET_NORMALIZATION_RECORD_CODE
    );
  }

  const hasMountedHostInstance =
    record.closestMountedHostInstanceToken !== null;
  if (
    hasMountedHostInstance !==
    (record.status === 'mounted-host-instance')
  ) {
    throw createComponentTreeError(
      'Cannot look up a React DOM event listener from an inconsistent target normalization record.',
      INVALID_EVENT_TARGET_NORMALIZATION_RECORD_CODE
    );
  }

  return record;
}

function assertTargetNodeDoesNotHaveMismatchedHostInstanceToken(targetNode) {
  if (
    !isObjectLike(targetNode) ||
    !Object.prototype.hasOwnProperty.call(
      targetNode,
      internalHostInstanceTokenKey
    )
  ) {
    return;
  }

  if (getHostInstanceTokenFromNode(targetNode) === null) {
    throw createComponentTreeError(
      'Cannot look up a React DOM event listener from a target node with mismatched host instance metadata.',
      EVENT_LISTENER_TARGET_LOOKUP_NODE_MISMATCH_CODE
    );
  }
}

function normalizeEventListenerRegistrationName(registrationName) {
  if (registrationName == null) {
    return null;
  }

  if (typeof registrationName !== 'string' || registrationName === '') {
    throw createComponentTreeError(
      'Cannot look up a React DOM event listener without a valid registration name.',
      INVALID_EVENT_LISTENER_REGISTRATION_NAME_CODE
    );
  }

  return registrationName;
}

function shouldPreventMouseEvent(registrationName, node, latestProps) {
  return !!(
    latestProps.disabled &&
    disabledMouseEventRegistrationNames.has(registrationName) &&
    interactiveTagNames.has(getHostNodeName(node))
  );
}

function getHostNodeName(node) {
  if (!isObjectLike(node)) {
    return '';
  }

  if (typeof node.nodeName === 'string') {
    return node.nodeName.toLowerCase();
  }

  if (typeof node.tagName === 'string') {
    return node.tagName.toLowerCase();
  }

  return '';
}

function getHostInstanceOwnerFromToken(token) {
  const metadata = getHostInstanceMetadata(token);
  return metadata === null ? null : metadata.hostOwner;
}

function getRootOwnerFromHostInstanceToken(token) {
  const metadata = getHostInstanceMetadata(token);
  return metadata === null ? null : metadata.rootOwner;
}

function getHostInstanceOwnerFromNode(node) {
  return getHostInstanceOwnerFromToken(getHostInstanceTokenFromNode(node));
}

function getRootOwnerFromNode(node) {
  return getRootOwnerFromHostInstanceToken(getHostInstanceTokenFromNode(node));
}

function attachHostInstanceNode(node, token, latestProps) {
  assertHostInstanceNode(node);
  assertKnownHostInstanceToken(token);

  const attachedNode = tokenToNode.get(token);
  if (attachedNode !== undefined && attachedNode !== node) {
    throw createComponentTreeError(
      'Cannot attach one React DOM host instance token to multiple nodes.',
      'FAST_REACT_DOM_HOST_INSTANCE_TOKEN_ALREADY_ATTACHED'
    );
  }

  const currentToken = getHostInstanceTokenFromNode(node);
  if (currentToken !== null && currentToken !== token) {
    throw createComponentTreeError(
      'Cannot attach multiple React DOM host instance tokens to one node.',
      'FAST_REACT_DOM_HOST_INSTANCE_NODE_ALREADY_ATTACHED'
    );
  }

  node[internalHostInstanceTokenKey] = token;
  node[internalLatestPropsKey] = latestProps === undefined ? null : latestProps;
  tokenToNode.set(token, node);
  return token;
}

function updateLatestPropsForNode(node, latestProps) {
  if (getHostInstanceTokenFromNode(node) === null) {
    throw createComponentTreeError(
      'Cannot update latest props for an unattached React DOM host instance node.',
      'FAST_REACT_DOM_UNATTACHED_HOST_INSTANCE_NODE'
    );
  }

  node[internalLatestPropsKey] = latestProps === undefined ? null : latestProps;
  return node[internalLatestPropsKey];
}

function updateLatestPropsForHostInstanceToken(token, latestProps) {
  return updateLatestPropsForNode(
    assertMountedHostInstanceToken(token),
    latestProps
  );
}

function commitLatestPropsFromMutationRecord(record) {
  const payload = getLatestPropsCommitPayload(record);
  assertAttachedLatestPropsCommitPayload(payload);
  return updateLatestPropsForNode(payload.node, payload.latestProps);
}

function commitLatestPropsFromMutationRecords(records) {
  const payloads = normalizeLatestPropsCommitRecords(records);

  for (const payload of payloads) {
    assertAttachedLatestPropsCommitPayload(payload);
  }

  for (const payload of payloads) {
    updateLatestPropsForNode(payload.node, payload.latestProps);
  }

  return payloads.length;
}

function commitLatestPropsFromMutationHandoff(handoff) {
  const payload = getLatestPropsMutationHandoffPayload(handoff);
  try {
    return commitLatestPropsFromMutationRecord(payload.latestPropsCommitRecord);
  } catch (error) {
    rollbackLatestPropsMutationHandoffs([handoff]);
    throw error;
  }
}

function commitLatestPropsFromMutationHandoffs(handoffs) {
  if (!Array.isArray(handoffs)) {
    throw createComponentTreeError(
      'Cannot commit latest props from a non-array mutation handoff batch.',
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_MUTATION_HANDOFF_BATCH'
    );
  }

  const normalizedHandoffs = [];
  let latestPropsPayloads;
  try {
    for (const handoff of handoffs) {
      normalizedHandoffs.push({
        handoff,
        payload: getLatestPropsMutationHandoffPayload(handoff)
      });
    }

    latestPropsPayloads = normalizedHandoffs.map(({payload}) =>
      getLatestPropsCommitPayload(payload.latestPropsCommitRecord)
    );

    for (const latestPropsPayload of latestPropsPayloads) {
      assertAttachedLatestPropsCommitPayload(latestPropsPayload);
    }
  } catch (error) {
    rollbackLatestPropsMutationHandoffs(
      normalizedHandoffs.map(({handoff}) => handoff)
    );
    throw error;
  }

  for (const latestPropsPayload of latestPropsPayloads) {
    updateLatestPropsForNode(
      latestPropsPayload.node,
      latestPropsPayload.latestProps
    );
  }

  return latestPropsPayloads.length;
}

function normalizeLatestPropsCommitRecords(records) {
  if (!Array.isArray(records)) {
    throw createComponentTreeError(
      'Cannot commit latest props from a non-array mutation record batch.',
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_COMMIT_BATCH'
    );
  }

  return records.map((record) => getLatestPropsCommitPayload(record));
}

function rollbackLatestPropsMutationHandoffs(handoffs) {
  for (let index = handoffs.length - 1; index >= 0; index -= 1) {
    try {
      rollbackDomPropertyUpdateLatestPropsHandoff(handoffs[index]);
    } catch (error) {
      // Rollback is best effort on already-failed private handoff admission.
    }
  }
}

function getLatestPropsMutationHandoffPayload(handoff) {
  const payload = getDomPropertyUpdateLatestPropsHandoffPayload(handoff);
  if (payload === null) {
    throw createComponentTreeError(
      'Cannot commit latest props from an invalid mutation handoff.',
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_MUTATION_HANDOFF'
    );
  }
  return payload;
}

function getLatestPropsCommitPayload(record) {
  const payload = getLatestPropsCommitRecordPayload(record);
  if (payload === null) {
    throw createComponentTreeError(
      'Cannot commit latest props from an invalid mutation record.',
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_COMMIT_RECORD'
    );
  }
  return payload;
}

function assertAttachedLatestPropsCommitPayload(payload) {
  if (getHostInstanceTokenFromNode(payload.node) === null) {
    throw createComponentTreeError(
      'Cannot commit latest props for an unattached React DOM host instance node.',
      'FAST_REACT_DOM_UNATTACHED_HOST_INSTANCE_NODE'
    );
  }
}

function getLatestPropsFromNode(node) {
  if (getHostInstanceTokenFromNode(node) === null) {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(node, internalLatestPropsKey)
    ? node[internalLatestPropsKey]
    : null;
}

function getLatestPropsFromHostInstanceToken(token) {
  const node = getMountedHostInstanceNodeFromToken(token);
  return node === null ? null : getLatestPropsFromNode(node);
}

function detachHostInstanceNode(node) {
  if (!isObjectLike(node)) {
    return null;
  }

  const token = getHostInstanceTokenFromNode(node);
  delete node[internalHostInstanceTokenKey];
  delete node[internalLatestPropsKey];

  if (token === null) {
    return null;
  }

  tokenToNode.delete(token);
  tokenMetadata.delete(token);
  return token;
}

function detachHostInstanceToken(token) {
  if (getHostInstanceMetadata(token) === null) {
    return null;
  }

  const node = tokenToNode.get(token);
  if (node !== undefined) {
    if (node[internalHostInstanceTokenKey] === token) {
      delete node[internalHostInstanceTokenKey];
      delete node[internalLatestPropsKey];
    }
    tokenToNode.delete(token);
  }

  tokenMetadata.delete(token);
  return token;
}

module.exports = {
  EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE,
  EVENT_LISTENER_TARGET_LOOKUP_NODE_MISMATCH_CODE,
  EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
  EVENT_LISTENER_TARGET_LOOKUP_UNMOUNTED_CODE,
  EVENT_TARGET_NORMALIZATION_RECORD_KIND,
  HOST_INSTANCE_NODE_RECORD_KIND,
  INVALID_EVENT_LISTENER_CODE,
  INVALID_EVENT_LISTENER_LATEST_PROPS_CODE,
  INVALID_EVENT_LISTENER_REGISTRATION_NAME_CODE,
  INVALID_EVENT_TARGET_NORMALIZATION_RECORD_CODE,
  assertMountedHostInstanceToken,
  assertHostInstanceNode,
  attachHostInstanceNode,
  commitLatestPropsFromMutationHandoff,
  commitLatestPropsFromMutationHandoffs,
  commitLatestPropsFromMutationRecord,
  commitLatestPropsFromMutationRecords,
  createEventListenerTargetLookupRecord,
  createEventTargetNormalizationRecord,
  createHostInstanceToken,
  createMountedHostInstanceNodeRecord,
  detachHostInstanceNode,
  detachHostInstanceToken,
  getAttachedNodeFromHostInstanceToken,
  getClosestMountedHostInstanceNodeFromNode,
  getClosestMountedHostInstanceTokenFromNode,
  getEventListenerTargetLookupRecordPayload,
  getHostInstanceOwnerFromNode,
  getHostInstanceOwnerFromToken,
  getHostInstanceTokenFromNode,
  getLatestPropsFromHostInstanceToken,
  getLatestPropsFromNode,
  getMountedHostInstanceNodeFromToken,
  getMountedHostInstanceTokenFromNode,
  getPrivateHostInstanceNodeRecordPayload,
  getRootOwnerFromHostInstanceToken,
  getRootOwnerFromNode,
  hostInstanceMarkerPrefix,
  internalHostInstanceTokenKey,
  internalLatestPropsKey,
  isEventListenerTargetLookupRecord,
  isHostInstanceNode,
  isPrivateHostInstanceNodeRecord,
  isHostInstanceToken,
  latestPropsMarkerPrefix,
  privateHostInstanceNodeRecordType,
  updateLatestPropsForHostInstanceToken,
  updateLatestPropsForNode
};
