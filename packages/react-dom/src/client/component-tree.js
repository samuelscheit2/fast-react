'use strict';

const {ELEMENT_NODE, TEXT_NODE} = require('./dom-container.js');
const {getContainerRoot} = require('./root-markers.js');
const {
  getLatestPropsCommitRecordPayload
} = require('../dom-host/mutation.js');

const hostInstanceMarkerPrefix = '__fastReactHostInstance$';
const latestPropsMarkerPrefix = '__fastReactProps$';
const randomKey = Math.random().toString(36).slice(2);
const internalHostInstanceTokenKey = hostInstanceMarkerPrefix + randomKey;
const internalLatestPropsKey = latestPropsMarkerPrefix + randomKey;
const hostInstanceTokenBrand = Symbol('fast.react.dom.hostInstanceToken');

const tokenMetadata = new WeakMap();
const tokenToNode = new WeakMap();

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

function normalizeLatestPropsCommitRecords(records) {
  if (!Array.isArray(records)) {
    throw createComponentTreeError(
      'Cannot commit latest props from a non-array mutation record batch.',
      'FAST_REACT_DOM_INVALID_LATEST_PROPS_COMMIT_BATCH'
    );
  }

  return records.map((record) => getLatestPropsCommitPayload(record));
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
  assertMountedHostInstanceToken,
  assertHostInstanceNode,
  attachHostInstanceNode,
  commitLatestPropsFromMutationRecord,
  commitLatestPropsFromMutationRecords,
  createHostInstanceToken,
  detachHostInstanceNode,
  detachHostInstanceToken,
  getAttachedNodeFromHostInstanceToken,
  getClosestMountedHostInstanceNodeFromNode,
  getClosestMountedHostInstanceTokenFromNode,
  getHostInstanceOwnerFromNode,
  getHostInstanceOwnerFromToken,
  getHostInstanceTokenFromNode,
  getLatestPropsFromHostInstanceToken,
  getLatestPropsFromNode,
  getMountedHostInstanceNodeFromToken,
  getMountedHostInstanceTokenFromNode,
  getRootOwnerFromHostInstanceToken,
  getRootOwnerFromNode,
  hostInstanceMarkerPrefix,
  internalHostInstanceTokenKey,
  internalLatestPropsKey,
  isHostInstanceNode,
  isHostInstanceToken,
  latestPropsMarkerPrefix,
  updateLatestPropsForHostInstanceToken,
  updateLatestPropsForNode
};
