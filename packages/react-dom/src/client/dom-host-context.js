'use strict';

const {
  DOCUMENT_FRAGMENT_NODE,
  DOCUMENT_NODE,
  getOwnerDocument
} = require('./dom-container.js');
const {
  HTML_NAMESPACE,
  getChildDOMNamespace,
  getDOMElementNamespace,
  normalizeDOMNamespace
} = require('./dom-namespaces.js');

const domHostContextErrorCode = 'FAST_REACT_DOM_HOST_CONTEXT';

function createDOMHostContextError(message) {
  const error = new Error(message);
  error.name = 'FastReactDomHostContextError';
  error.code = domHostContextErrorCode;
  return error;
}

function createDOMHostContext(ownerDocument, namespaceURI) {
  if (ownerDocument == null || typeof ownerDocument !== 'object') {
    throw createDOMHostContextError(
      'React DOM host context requires an owner document.'
    );
  }

  return Object.freeze({
    namespaceURI: normalizeDOMNamespace(namespaceURI),
    ownerDocument
  });
}

function getOwnerDocumentFromDOMContainer(container) {
  return getOwnerDocument(container);
}

function createRootDOMHostContext(container) {
  const ownerDocument = getOwnerDocumentFromDOMContainer(container);
  return createDOMHostContext(ownerDocument, getRootDOMNamespace(container));
}

function getChildDOMHostContext(parentHostContext, type) {
  const context = requireDOMHostContext(parentHostContext);
  const parentNamespace = normalizeDOMNamespace(context.namespaceURI);
  const namespaceURI = getChildDOMNamespace(parentNamespace, type);

  if (
    namespaceURI === parentNamespace &&
    context.namespaceURI === parentNamespace
  ) {
    return context;
  }

  return createDOMHostContext(context.ownerDocument, namespaceURI);
}

function createDOMElement(type, hostContext) {
  const context = requireDOMHostContext(hostContext);
  const ownerDocument = context.ownerDocument;
  const namespaceURI = getDOMElementNamespace(context.namespaceURI, type);

  if (namespaceURI === HTML_NAMESPACE) {
    if (typeof ownerDocument.createElement !== 'function') {
      throw createDOMHostContextError(
        'React DOM host context owner document is missing createElement.'
      );
    }
    return ownerDocument.createElement(type);
  }

  if (typeof ownerDocument.createElementNS !== 'function') {
    throw createDOMHostContextError(
      'React DOM host context owner document is missing createElementNS.'
    );
  }
  return ownerDocument.createElementNS(namespaceURI, type);
}

function getRootDOMNamespace(container) {
  if (container == null || typeof container !== 'object') {
    return HTML_NAMESPACE;
  }

  const nodeType = container.nodeType;
  if (nodeType === DOCUMENT_NODE || nodeType === DOCUMENT_FRAGMENT_NODE) {
    const root = container.documentElement;
    return root && typeof root === 'object'
      ? normalizeDOMNamespace(root.namespaceURI)
      : HTML_NAMESPACE;
  }

  const type = getContainerType(container);
  return getChildDOMNamespace(container.namespaceURI, type);
}

function getContainerType(container) {
  return (
    container.localName ||
    container.tagName ||
    container.nodeName ||
    ''
  );
}

function requireDOMHostContext(hostContext) {
  if (
    hostContext == null ||
    typeof hostContext !== 'object' ||
    hostContext.ownerDocument == null ||
    typeof hostContext.ownerDocument !== 'object'
  ) {
    throw createDOMHostContextError(
      'React DOM host context requires an owner document.'
    );
  }

  return hostContext;
}

module.exports = {
  createDOMElement,
  createDOMHostContext,
  createDOMHostContextError,
  createRootDOMHostContext,
  domHostContextErrorCode,
  getChildDOMHostContext,
  getOwnerDocumentFromDOMContainer,
  getRootDOMNamespace
};
