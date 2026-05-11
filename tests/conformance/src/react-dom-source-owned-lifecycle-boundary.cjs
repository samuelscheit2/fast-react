'use strict';

const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const reactDomClient = require(path.join(
  repoRoot,
  'packages/react-dom/client.js'
));
const rootBridge = require(path.join(
  repoRoot,
  'packages/react-dom/src/client/root-bridge.js'
));
const domContainer = require(path.join(
  repoRoot,
  'packages/react-dom/src/client/dom-container.js'
));

function createSourceOwnedReactDomLifecycleBoundary(label, options = {}) {
  const normalizedLabel = normalizeLifecycleBoundaryLabel(label);
  const document = createPrivateGateDocument(
    `${normalizedLabel}-document`,
    domContainer
  );
  const container = createPrivateGateElement(
    'DIV',
    document,
    domContainer
  );
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  if (descriptor === undefined || typeof descriptor.value !== 'function') {
    throw new Error('Missing private React DOM public-facade adapter.');
  }

  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: `${normalizedLabel}-host-update`,
    initialHostOutputIdPrefix: `${normalizedLabel}-initial`,
    nativeEnvironmentId: options.nativeEnvironmentId ?? 885,
    nativeHandoffIdPrefix: `${normalizedLabel}-native`,
    publicFacadeHostOutputRenderIdPrefix: `${normalizedLabel}-render`,
    publicFacadeHostOutputUpdateIdPrefix: `${normalizedLabel}-update`,
    requestIdPrefix: `${normalizedLabel}-request`,
    rootIdPrefix: `${normalizedLabel}-root`,
    updateIdPrefix: `${normalizedLabel}-update-id`
  });
  const root = adapter.createRoot(container);
  const initialElement = {
    props: {
      children: `${normalizedLabel} initial`,
      id: `${normalizedLabel}-host`
    },
    type: 'section'
  };
  const nextElement = {
    props: {
      children: `${normalizedLabel} updated`,
      id: `${normalizedLabel}-host`,
      title: `${normalizedLabel} updated`
    },
    type: 'section'
  };
  const initialDiagnostic = root.render(initialElement);
  const updateDiagnostic = root.render(nextElement);
  const boundary =
    options.phase === 'render'
      ? initialDiagnostic.sourceContainerSnapshot
      : updateDiagnostic.sourceContainerSnapshot;
  const payload =
    rootBridge.getPrivateRootPublicFacadeLifecycleContainerSnapshotPayload(
      boundary
    );
  if (
    !rootBridge.isPrivateRootPublicFacadeLifecycleContainerSnapshotRecord(
      boundary
    ) ||
    payload === null
  ) {
    throw new Error('React DOM did not create a source-owned lifecycle boundary.');
  }

  return {
    adapter,
    boundary,
    boundaryOptions: createReactDomLifecycleBoundaryOptions(boundary),
    container,
    createRecord: adapter.getRootCreateRecord(root),
    document,
    initialDiagnostic,
    payload,
    root,
    rootBridge,
    rootId: boundary.rootId,
    rootLabel: boundary.rootId,
    updateDiagnostic
  };
}

function createReactDomLifecycleBoundaryOptions(boundary) {
  return {
    lifecycleRequestBoundary: boundary,
    lifecycleRequestId: boundary.sourceRequestId,
    lifecycleRequestSequence: boundary.sourceRequestSequence
  };
}

function normalizeLifecycleBoundaryLabel(label) {
  return String(label)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function createPrivateGateDocument(label, containerModule) {
  const document = createPrivateGateEventTarget({
    label,
    nodeName: '#document',
    nodeType: containerModule.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createPrivateGateEventTarget({
    label: `${label}-window`
  });
  document.createElement = function createPrivateGateFakeElement(tagName) {
    return createPrivateGateElement(
      String(tagName).toUpperCase(),
      this,
      containerModule
    );
  };
  document.createTextNode = function createPrivateGateFakeText(text) {
    return createPrivateGateTextNode(String(text), this, containerModule);
  };
  return document;
}

function createPrivateGateElement(nodeName, ownerDocument, containerModule) {
  return createPrivateGateEventTarget({
    nodeName,
    nodeType: containerModule.ELEMENT_NODE,
    ownerDocument
  });
}

function createPrivateGateTextNode(text, ownerDocument, containerModule) {
  const target = createPrivateGateEventTarget({
    nodeName: '#text',
    nodeType: containerModule.TEXT_NODE,
    ownerDocument
  });
  target.writeLog = [];
  target.textContent = text;
  Object.defineProperties(target, {
    data: {
      configurable: true,
      enumerable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        const textValue = String(value);
        this.writeLog.push(['data', textValue]);
        this.textContent = textValue;
      }
    },
    nodeValue: {
      configurable: true,
      enumerable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        const textValue = String(value);
        this.writeLog.push(['nodeValue', textValue]);
        this.textContent = textValue;
      }
    }
  });
  return target;
}

function createPrivateGateEventTarget(fields) {
  const target = {
    ...fields,
    attributeLog: [],
    attributes: new Map(),
    childNodes: [],
    __mutationLog: [],
    __registrations: [],
    mutationLog: [],
    parentNode: null,
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    },
    removeEventListener(type, listener, options) {
      const index = this.__registrations.findIndex(
        (entry) =>
          entry.type === type &&
          entry.listener === listener &&
          entry.options === options
      );
      if (index !== -1) {
        this.__registrations.splice(index, 1);
      }
    },
    appendChild(child) {
      detachPrivateGateChild(child);
      this.childNodes.push(child);
      child.parentNode = this;
      this.__mutationLog.push({ child, type: 'appendChild' });
      this.mutationLog.push(['appendChild', child.nodeName]);
      return child;
    },
    insertBefore(child, beforeChild) {
      if (beforeChild.parentNode !== this) {
        throw new Error('Cannot insert before a child from another parent.');
      }
      detachPrivateGateChild(child);
      const index = this.childNodes.indexOf(beforeChild);
      this.childNodes.splice(index, 0, child);
      child.parentNode = this;
      this.__mutationLog.push({ beforeChild, child, type: 'insertBefore' });
      this.mutationLog.push([
        'insertBefore',
        child.nodeName,
        beforeChild.nodeName
      ]);
      return child;
    },
    removeChild(child) {
      if (child.parentNode !== this) {
        throw new Error('Cannot remove a child from another parent.');
      }
      detachPrivateGateChild(child);
      this.__mutationLog.push({ child, type: 'removeChild' });
      this.mutationLog.push(['removeChild', child.nodeName]);
      return child;
    },
    setAttribute(name, value) {
      const attributeName = String(name);
      const stringValue = String(value);
      this.attributes.set(attributeName, stringValue);
      this.attributeLog.push(['setAttribute', attributeName, stringValue]);
    },
    removeAttribute(name) {
      const attributeName = String(name);
      const hadAttribute = this.attributes.has(attributeName);
      this.attributes.delete(attributeName);
      this.attributeLog.push(['removeAttribute', attributeName, hadAttribute]);
    },
    hasAttribute(name) {
      return this.attributes.has(String(name));
    },
    getAttribute(name) {
      const attributeName = String(name);
      return this.attributes.has(attributeName)
        ? this.attributes.get(attributeName)
        : null;
    }
  };
  let textContent = '';
  Object.defineProperty(target, 'textContent', {
    configurable: true,
    enumerable: true,
    get() {
      if (this.childNodes.length > 0) {
        return this.childNodes.map((child) => child.textContent).join('');
      }
      return textContent;
    },
    set(value) {
      for (const child of [...this.childNodes]) {
        detachPrivateGateChild(child);
      }
      textContent = String(value);
      this.__mutationLog.push({ type: 'textContent', value });
      this.mutationLog.push(['textContent', textContent]);
    }
  });
  Object.defineProperties(target, {
    firstChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[0] || null;
      }
    },
    lastChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[this.childNodes.length - 1] || null;
      }
    }
  });
  return target;
}

function detachPrivateGateChild(child) {
  if (child == null || typeof child !== 'object') {
    throw new Error('Expected a fake-DOM child object.');
  }
  if (child.parentNode == null) {
    child.parentNode = null;
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}

module.exports = {
  createReactDomLifecycleBoundaryOptions,
  createSourceOwnedReactDomLifecycleBoundary
};
