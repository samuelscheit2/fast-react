'use strict';

const ENTRY_SET_ATTRIBUTE = 'setAttribute';
const ENTRY_REMOVE_ATTRIBUTE = 'removeAttribute';
const ENTRY_SET_STYLE = 'setStyle';
const ENTRY_REMOVE_STYLE = 'removeStyle';
const ENTRY_SET_INNER_HTML = 'setInnerHTML';
const ENTRY_NON_PAYLOAD = 'nonPayload';
const ENTRY_UNSUPPORTED = 'unsupported';

function createDomHostMutationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

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

function commitTextUpdate(textInstance, oldText, newText) {
  setTextNodeValue(textInstance, newText, 'commitTextUpdate');
}

function resetTextContent(instance) {
  setNodeTextContent(instance, '', 'resetTextContent');
}

function setTextContent(instance, text) {
  setNodeTextContent(instance, text, 'setTextContent');
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

  for (const entry of entries) {
    applyStyleDangerousHtmlPayloadEntry(instance, entry);
  }

  return entries;
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
  appendChild,
  appendChildToContainer,
  appendInitialChild,
  applyStyleDangerousHtmlPayload,
  clearContainer,
  commitTextUpdate,
  createDomHostMutationError,
  insertBefore,
  insertInContainerBefore,
  removeChild,
  removeChildFromContainer,
  resetTextContent,
  setTextContent
};
