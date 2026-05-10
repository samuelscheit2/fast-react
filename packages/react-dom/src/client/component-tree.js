'use strict';

const {ELEMENT_NODE, TEXT_NODE} = require('./dom-container.js');

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

function getAttachedNodeFromHostInstanceToken(token) {
  if (getHostInstanceMetadata(token) === null) {
    return null;
  }
  return tokenToNode.get(token) || null;
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

function getLatestPropsFromNode(node) {
  if (getHostInstanceTokenFromNode(node) === null) {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(node, internalLatestPropsKey)
    ? node[internalLatestPropsKey]
    : null;
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

module.exports = {
  assertHostInstanceNode,
  attachHostInstanceNode,
  createHostInstanceToken,
  detachHostInstanceNode,
  getAttachedNodeFromHostInstanceToken,
  getHostInstanceOwnerFromNode,
  getHostInstanceOwnerFromToken,
  getHostInstanceTokenFromNode,
  getLatestPropsFromNode,
  getRootOwnerFromHostInstanceToken,
  getRootOwnerFromNode,
  hostInstanceMarkerPrefix,
  internalHostInstanceTokenKey,
  internalLatestPropsKey,
  isHostInstanceNode,
  isHostInstanceToken,
  latestPropsMarkerPrefix,
  updateLatestPropsForNode
};
