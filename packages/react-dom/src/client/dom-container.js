'use strict';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

const invalidContainerErrorCode = 'FAST_REACT_DOM_INVALID_CONTAINER';
const invalidContainerDevelopmentMessage =
  'Target container is not a DOM element.';
const invalidContainerProductionMessage =
  'Minified React error #299; visit https://react.dev/errors/299 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.';

function isValidContainer(container) {
  if (container == null || typeof container !== 'object') {
    return false;
  }

  const nodeType = container.nodeType;
  return (
    nodeType === ELEMENT_NODE ||
    nodeType === DOCUMENT_NODE ||
    nodeType === DOCUMENT_FRAGMENT_NODE
  );
}

function isProductionMode(options) {
  if (options && typeof options.production === 'boolean') {
    return options.production;
  }
  return process.env.NODE_ENV === 'production';
}

function createInvalidContainerError(options) {
  const error = new Error(
    isProductionMode(options)
      ? invalidContainerProductionMessage
      : invalidContainerDevelopmentMessage
  );
  error.code = invalidContainerErrorCode;
  return error;
}

function assertValidContainer(container, options) {
  if (!isValidContainer(container)) {
    throw createInvalidContainerError(options);
  }
  return container;
}

function getOwnerDocument(container) {
  if (container == null || typeof container !== 'object') {
    return null;
  }
  return container.nodeType === DOCUMENT_NODE
    ? container
    : container.ownerDocument || null;
}

function describeContainer(container) {
  if (container == null) {
    return {
      kind: String(container),
      nodeType: null
    };
  }

  if (typeof container !== 'object') {
    return {
      kind: typeof container,
      nodeType: null
    };
  }

  return {
    kind: 'object',
    nodeName: container.nodeName || null,
    nodeType:
      typeof container.nodeType === 'number' ? container.nodeType : null
  };
}

function describeContainerCleanupTarget(container) {
  const info = describeContainer(container);
  if (container == null || typeof container !== 'object') {
    return {
      ...info,
      canRemoveChild: false,
      childNodeCount: 0,
      cleanupTarget: false,
      fakeDomCleanupTarget: false,
      hasChildNodesArray: false
    };
  }

  const hasChildNodesArray = Array.isArray(container.childNodes);
  return {
    ...info,
    canRemoveChild: typeof container.removeChild === 'function',
    childNodeCount: hasChildNodesArray ? container.childNodes.length : 0,
    cleanupTarget: isValidContainer(container),
    fakeDomCleanupTarget:
      isValidContainer(container) &&
      hasChildNodesArray &&
      typeof container.removeChild === 'function',
    hasChildNodesArray
  };
}

module.exports = {
  COMMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
  DOCUMENT_NODE,
  ELEMENT_NODE,
  TEXT_NODE,
  assertValidContainer,
  createInvalidContainerError,
  describeContainer,
  describeContainerCleanupTarget,
  getOwnerDocument,
  invalidContainerDevelopmentMessage,
  invalidContainerErrorCode,
  invalidContainerProductionMessage,
  isValidContainer
};
