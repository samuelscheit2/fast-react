'use strict';

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

module.exports = {
  appendChild,
  appendChildToContainer,
  appendInitialChild,
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
