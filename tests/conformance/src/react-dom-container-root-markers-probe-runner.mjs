import { createRequire } from "node:module";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

const require = createRequire(import.meta.url);

function main() {
  try {
    const probeDom = installProbeDom();
    const ReactDOMClient = require("react-dom/client");

    process.stdout.write(
      JSON.stringify(
        runRootMarkerProbe({
          ReactDOMClient,
          probeDom
        })
      )
    );
  } catch (error) {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exit(1);
  }
}

function runRootMarkerProbe({ ReactDOMClient, probeDom }) {
  return {
    action: "container-root-markers",
    targetPackage: "react-dom",
    reactDomClientVersion: ReactDOMClient.version,
    fakeDomSubstrate: probeDom.describeSubstrate(),
    containerValidation: runContainerValidationMatrix({
      ReactDOMClient,
      probeDom
    }),
    duplicateRootWarning: runDuplicateRootWarningProbe({
      ReactDOMClient,
      probeDom
    }),
    legacyDuplicateRootWarning: runLegacyDuplicateRootWarningProbe({
      ReactDOMClient,
      probeDom
    }),
    unmountMarkerCleanup: runUnmountMarkerCleanupProbe({
      ReactDOMClient,
      probeDom
    }),
    noRenderSideEffects: runNoRenderSideEffectsProbe({
      ReactDOMClient,
      probeDom
    })
  };
}

function runContainerValidationMatrix({ ReactDOMClient, probeDom }) {
  return [
    "element",
    "document",
    "document-fragment",
    "null",
    "undefined",
    "plain-object",
    "text-node",
    "comment-mount-point",
    "comment-other"
  ].map((caseId) => {
    const container = createContainerCase(probeDom.document, caseId);
    probeDom.takeMutationLog();
    const beforeMarker = summarizeReactContainerMarker(container);
    const captured = captureConsoleCalls(() =>
      captureOperation(`createRoot ${caseId}`, () =>
        ReactDOMClient.createRoot(container)
      )
    );
    const createRootMutations = probeDom.takeMutationLog();
    const afterCreateMarker = summarizeReactContainerMarker(container);
    let unmount = null;
    let afterUnmountMarker = null;
    let unmountMutations = [];

    if (captured.result.status === "ok") {
      const root = captured.result.value;
      const unmountCaptured = captureConsoleCalls(() =>
        captureOperation(`unmount ${caseId}`, () => root.unmount())
      );
      unmountMutations = probeDom.takeMutationLog();
      unmount = stripOperationValue(unmountCaptured.result);
      unmount.consoleCalls = unmountCaptured.consoleCalls;
      afterUnmountMarker = summarizeReactContainerMarker(container);
    }

    return {
      caseId,
      nodeSummary: summarizeNode(container),
      beforeMarker,
      createRoot: {
        result: stripOperationValue(captured.result),
        consoleCalls: captured.consoleCalls,
        mutations: createRootMutations
      },
      afterCreateMarker,
      unmount,
      afterUnmountMarker,
      unmountMutations
    };
  });
}

function runDuplicateRootWarningProbe({ ReactDOMClient, probeDom }) {
  const container = probeDom.document.createElement("div");
  probeDom.document.body.appendChild(container);
  probeDom.takeMutationLog();

  const first = captureConsoleCalls(() =>
    captureOperation("first createRoot", () => ReactDOMClient.createRoot(container))
  );
  const afterFirstMarker = summarizeReactContainerMarker(container);
  const firstMutations = probeDom.takeMutationLog();

  const second = captureConsoleCalls(() =>
    captureOperation("second createRoot", () =>
      ReactDOMClient.createRoot(container)
    )
  );
  const afterSecondMarker = summarizeReactContainerMarker(container);
  const secondMutations = probeDom.takeMutationLog();

  return {
    firstCreate: {
      result: stripOperationValue(first.result),
      consoleCalls: first.consoleCalls,
      mutations: firstMutations
    },
    afterFirstMarker,
    secondCreate: {
      result: stripOperationValue(second.result),
      consoleCalls: second.consoleCalls,
      mutations: secondMutations
    },
    afterSecondMarker
  };
}

function runLegacyDuplicateRootWarningProbe({ ReactDOMClient, probeDom }) {
  const container = probeDom.document.createElement("div");
  probeDom.document.body.appendChild(container);
  probeDom.takeMutationLog();

  const first = captureConsoleCalls(() =>
    captureOperation("first createRoot", () => ReactDOMClient.createRoot(container))
  );
  container._reactRootContainer = {
    marker: "legacy-root-container-placeholder"
  };
  const second = captureConsoleCalls(() =>
    captureOperation("second createRoot with legacy marker", () =>
      ReactDOMClient.createRoot(container)
    )
  );

  return {
    firstCreate: {
      result: stripOperationValue(first.result),
      consoleCalls: first.consoleCalls
    },
    legacyMarkerInjected: true,
    markerBeforeSecondCreate: summarizeReactContainerMarker(container),
    secondCreate: {
      result: stripOperationValue(second.result),
      consoleCalls: second.consoleCalls,
      mutations: probeDom.takeMutationLog()
    },
    markerAfterSecondCreate: summarizeReactContainerMarker(container)
  };
}

function runUnmountMarkerCleanupProbe({ ReactDOMClient, probeDom }) {
  const container = probeDom.document.createElement("div");
  probeDom.document.body.appendChild(container);
  probeDom.takeMutationLog();

  const first = captureConsoleCalls(() =>
    captureOperation("createRoot before unmount", () =>
      ReactDOMClient.createRoot(container)
    )
  );
  const root = first.result.status === "ok" ? first.result.value : null;
  const afterCreateMarker = summarizeReactContainerMarker(container);
  const createRootMutations = probeDom.takeMutationLog();

  const unmount = captureConsoleCalls(() =>
    captureOperation("root.unmount", () => root.unmount())
  );
  const afterUnmountMarker = summarizeReactContainerMarker(container);
  const unmountMutations = probeDom.takeMutationLog();

  const recreate = captureConsoleCalls(() =>
    captureOperation("createRoot after unmount", () =>
      ReactDOMClient.createRoot(container)
    )
  );
  const afterRecreateMarker = summarizeReactContainerMarker(container);
  const recreateMutations = probeDom.takeMutationLog();

  return {
    firstCreate: {
      result: stripOperationValue(first.result),
      consoleCalls: first.consoleCalls,
      mutations: createRootMutations
    },
    afterCreateMarker,
    unmount: {
      result: stripOperationValue(unmount.result),
      consoleCalls: unmount.consoleCalls,
      mutations: unmountMutations
    },
    afterUnmountMarker,
    recreate: {
      result: stripOperationValue(recreate.result),
      consoleCalls: recreate.consoleCalls,
      mutations: recreateMutations
    },
    afterRecreateMarker
  };
}

function runNoRenderSideEffectsProbe({ ReactDOMClient, probeDom }) {
  const container = probeDom.document.createElement("div");
  container.appendChild(probeDom.document.createTextNode("preserved"));
  probeDom.document.body.appendChild(container);
  const beforeTree = dumpNode(container);
  probeDom.takeMutationLog();

  const captured = captureConsoleCalls(() =>
    captureOperation("createRoot no render", () =>
      ReactDOMClient.createRoot(container)
    )
  );
  const createRootMutations = probeDom.takeMutationLog();
  const afterTree = dumpNode(container);

  return {
    createRoot: {
      result: stripOperationValue(captured.result),
      consoleCalls: captured.consoleCalls,
      mutations: createRootMutations
    },
    beforeTree,
    afterTree,
    afterCreateMarker: summarizeReactContainerMarker(container)
  };
}

function createContainerCase(document, caseId) {
  switch (caseId) {
    case "element":
      return document.createElement("div");
    case "document":
      return document;
    case "document-fragment":
      return document.createDocumentFragment();
    case "null":
      return null;
    case "undefined":
      return undefined;
    case "plain-object":
      return {
        nodeType: "1"
      };
    case "text-node":
      return document.createTextNode("text");
    case "comment-mount-point":
      return document.createComment(" react-mount-point-unstable ");
    case "comment-other":
      return document.createComment("not a mount point");
    default:
      throw new Error(`Unknown container case: ${caseId}`);
  }
}

function captureConsoleCalls(operation) {
  const consoleCalls = [];
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    consoleCalls.push({
      method: "error",
      args: args.map(describeValue)
    });
  };
  console.warn = (...args) => {
    consoleCalls.push({
      method: "warn",
      args: args.map(describeValue)
    });
  };

  try {
    return {
      result: operation(),
      consoleCalls
    };
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
}

function captureOperation(label, operation) {
  try {
    return {
      status: "ok",
      label,
      value: operation()
    };
  } catch (error) {
    return {
      status: "throws",
      label,
      error: describeThrown(error)
    };
  }
}

function stripOperationValue(result) {
  if (result?.status !== "ok") {
    return result;
  }

  return {
    status: "ok",
    label: result.label
  };
}

function describeThrown(error) {
  return {
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error)
  };
}

function summarizeReactContainerMarker(node) {
  if (!node || typeof node !== "object") {
    return {
      inspectable: false,
      propertyCount: 0,
      truthyCount: 0,
      nullCount: 0,
      sanitizedProperties: []
    };
  }

  const properties = Reflect.ownKeys(node)
    .filter(
      (key) => typeof key === "string" && key.startsWith("__reactContainer$")
    )
    .sort()
    .map((key) => {
      const value = node[key];
      return {
        keyPrefix: "__reactContainer$",
        enumerable: Object.prototype.propertyIsEnumerable.call(node, key),
        valueState:
          value === null ? "null" : value === undefined ? "undefined" : "truthy",
        valueType: value === null ? "null" : typeof value,
        valueTag:
          value && typeof value === "object"
            ? Object.prototype.toString.call(value)
            : null
      };
    });

  return {
    inspectable: true,
    propertyCount: properties.length,
    truthyCount: properties.filter((property) => property.valueState === "truthy")
      .length,
    nullCount: properties.filter((property) => property.valueState === "null")
      .length,
    sanitizedProperties: properties
  };
}

function summarizeNode(node) {
  if (!node || typeof node !== "object") {
    return {
      kind: node === null ? "null" : typeof node,
      nodeType: null,
      nodeName: null
    };
  }

  return {
    kind: "object",
    nodeType: typeof node.nodeType === "number" ? node.nodeType : null,
    nodeName: typeof node.nodeName === "string" ? node.nodeName : null,
    nodeValue: typeof node.nodeValue === "string" ? node.nodeValue : null
  };
}

function installProbeDom() {
  const mutationLog = [];
  const document = new MinimalDocument(mutationLog);
  const window = new MinimalWindow(document);
  document.defaultView = window;
  document.parentNode = window;

  Object.defineProperties(globalThis, {
    window: {
      configurable: true,
      value: window,
      writable: true
    },
    self: {
      configurable: true,
      value: window,
      writable: true
    },
    document: {
      configurable: true,
      value: document,
      writable: true
    },
    navigator: {
      configurable: true,
      value: window.navigator,
      writable: true
    },
    Node: {
      configurable: true,
      value: MinimalNode,
      writable: true
    },
    Element: {
      configurable: true,
      value: MinimalElement,
      writable: true
    },
    HTMLElement: {
      configurable: true,
      value: MinimalElement,
      writable: true
    },
    HTMLIFrameElement: {
      configurable: true,
      value: window.HTMLIFrameElement,
      writable: true
    },
    HTMLInputElement: {
      configurable: true,
      value: MinimalElement,
      writable: true
    },
    HTMLSelectElement: {
      configurable: true,
      value: MinimalElement,
      writable: true
    },
    HTMLTextAreaElement: {
      configurable: true,
      value: MinimalElement,
      writable: true
    },
    Document: {
      configurable: true,
      value: MinimalDocument,
      writable: true
    },
    DocumentFragment: {
      configurable: true,
      value: MinimalDocumentFragment,
      writable: true
    },
    Text: {
      configurable: true,
      value: MinimalText,
      writable: true
    },
    Comment: {
      configurable: true,
      value: MinimalComment,
      writable: true
    },
    Event: {
      configurable: true,
      value: MinimalEvent,
      writable: true
    }
  });

  return {
    document,
    window,
    takeMutationLog() {
      return mutationLog.splice(0, mutationLog.length);
    },
    describeSubstrate() {
      return {
        kind: "deterministic-minimal-dom",
        browserNativeDom: false,
        records: [
          "appendChild, insertBefore, removeChild, and textContent writes",
          "createRoot root marker property counts with randomized suffixes removed",
          "console.error and console.warn diagnostics"
        ],
        limitations: [
          "no browser parser, layout, focus, selection, accessibility, or custom element lifecycle behavior",
          "delegated listener installation details are intentionally left to the root-listener oracle track",
          "root.render DOM commits, hydration, resources, and event dispatch are outside this oracle"
        ]
      };
    }
  };
}

class MinimalEventTarget {
  constructor(targetKind) {
    this._targetKind = targetKind;
    this._listeners = new Map();
  }

  addEventListener(type, callback, options = undefined) {
    if (options && typeof options === "object") {
      Reflect.get(options, "passive");
    }
    if (callback == null) {
      return;
    }
    const eventName = String(type);
    const listeners = this._listeners.get(eventName) ?? [];
    listeners.push({
      type: eventName,
      callback,
      capture: options === true || Boolean(options?.capture)
    });
    this._listeners.set(eventName, listeners);
  }

  removeEventListener(type, callback, options = undefined) {
    const eventName = String(type);
    const listeners = this._listeners.get(eventName);
    if (!listeners) {
      return;
    }
    const capture = options === true || Boolean(options?.capture);
    this._listeners.set(
      eventName,
      listeners.filter(
        (listener) => listener.callback !== callback || listener.capture !== capture
      )
    );
  }

  dispatchEvent() {
    return true;
  }
}

class MinimalNode extends MinimalEventTarget {
  constructor({ mutationLog, nodeName, nodeType, ownerDocument = null }) {
    super("node");
    this._mutationLog = mutationLog;
    this.childNodes = [];
    this.nodeName = nodeName;
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
  }

  appendChild(child) {
    return this.insertBefore(child, null);
  }

  insertBefore(child, beforeChild) {
    if (child === this) {
      throw new Error("Cannot insert a node into itself");
    }
    const index =
      beforeChild == null ? -1 : this.childNodes.indexOf(beforeChild);
    if (beforeChild != null && index === -1) {
      throw new Error("insertBefore target is not a child of this node");
    }
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }

    child.parentNode = this;
    if (!child.ownerDocument && this.ownerDocument) {
      child.ownerDocument = this.ownerDocument;
    }

    if (index === -1) {
      this.childNodes.push(child);
    } else {
      this.childNodes.splice(index, 0, child);
    }
    this._mutationLog.push({
      type: "insertBefore",
      parent: describeNodeName(this),
      child: describeNodeName(child),
      before: beforeChild ? describeNodeName(beforeChild) : null
    });
    return child;
  }

  removeChild(child) {
    const index = this.childNodes.indexOf(child);
    if (index === -1) {
      throw new Error("removeChild target is not a child of this node");
    }
    this.childNodes.splice(index, 1);
    child.parentNode = null;
    this._mutationLog.push({
      type: "removeChild",
      parent: describeNodeName(this),
      child: describeNodeName(child)
    });
    return child;
  }

  contains(node) {
    for (let current = node; current; current = current.parentNode) {
      if (current === this) {
        return true;
      }
    }
    return false;
  }

  get firstChild() {
    return this.childNodes[0] ?? null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }

  get textContent() {
    if (this.nodeType === TEXT_NODE || this.nodeType === COMMENT_NODE) {
      return this.nodeValue;
    }
    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    const text = value == null ? "" : String(value);
    this.childNodes = [];
    this._mutationLog.push({
      type: "setTextContent",
      target: describeNodeName(this),
      value: text
    });
    if (text !== "") {
      this.appendChild(this.ownerDocument.createTextNode(text));
    }
  }
}

MinimalNode.ELEMENT_NODE = ELEMENT_NODE;
MinimalNode.TEXT_NODE = TEXT_NODE;
MinimalNode.COMMENT_NODE = COMMENT_NODE;
MinimalNode.DOCUMENT_NODE = DOCUMENT_NODE;
MinimalNode.DOCUMENT_FRAGMENT_NODE = DOCUMENT_FRAGMENT_NODE;

class MinimalCharacterData extends MinimalNode {
  constructor({ mutationLog, nodeName, nodeType, nodeValue, ownerDocument }) {
    super({ mutationLog, nodeName, nodeType, ownerDocument });
    this.nodeValue = nodeValue;
    this.data = nodeValue;
  }

  get textContent() {
    return this.nodeValue;
  }

  set textContent(value) {
    this.nodeValue = value == null ? "" : String(value);
    this.data = this.nodeValue;
    this._mutationLog.push({
      type: "setTextContent",
      target: describeNodeName(this),
      value: this.nodeValue
    });
  }
}

class MinimalText extends MinimalCharacterData {
  constructor(text, ownerDocument, mutationLog) {
    super({
      mutationLog,
      nodeName: "#text",
      nodeType: TEXT_NODE,
      nodeValue: String(text),
      ownerDocument
    });
  }
}

class MinimalComment extends MinimalCharacterData {
  constructor(text, ownerDocument, mutationLog) {
    super({
      mutationLog,
      nodeName: "#comment",
      nodeType: COMMENT_NODE,
      nodeValue: String(text),
      ownerDocument
    });
  }
}

class MinimalElement extends MinimalNode {
  constructor(tagName, ownerDocument, mutationLog, namespaceURI = HTML_NAMESPACE) {
    const localName = String(tagName).toLowerCase();
    super({
      mutationLog,
      nodeName: localName.toUpperCase(),
      nodeType: ELEMENT_NODE,
      ownerDocument
    });
    this.attributes = new Map();
    this.localName = localName;
    this.namespaceURI = namespaceURI;
    this.style = {};
    this.tagName = this.nodeName;
  }

  setAttribute(name, value) {
    const normalizedName = String(name);
    this.attributes.set(normalizedName, String(value));
    if (normalizedName === "id") {
      this.id = String(value);
    }
  }

  getAttribute(name) {
    const normalizedName = String(name);
    return this.attributes.has(normalizedName)
      ? this.attributes.get(normalizedName)
      : null;
  }

  hasAttribute(name) {
    return this.attributes.has(String(name));
  }

  removeAttribute(name) {
    this.attributes.delete(String(name));
  }
}

class MinimalDocumentFragment extends MinimalNode {
  constructor(ownerDocument, mutationLog) {
    super({
      mutationLog,
      nodeName: "#document-fragment",
      nodeType: DOCUMENT_FRAGMENT_NODE,
      ownerDocument
    });
  }
}

class MinimalDocument extends MinimalNode {
  constructor(mutationLog) {
    super({
      mutationLog,
      nodeName: "#document",
      nodeType: DOCUMENT_NODE,
      ownerDocument: null
    });
    this.ownerDocument = this;
    this.defaultView = null;
    this.documentElement = new MinimalElement("html", this, mutationLog);
    this.body = new MinimalElement("body", this, mutationLog);
    this.activeElement = this.body;
    this.implementation = {
      createHTMLDocument: () => new MinimalDocument(mutationLog)
    };
    super.appendChild(this.documentElement);
    this.documentElement.appendChild(this.body);
  }

  createElement(tagName) {
    return new MinimalElement(tagName, this, this._mutationLog);
  }

  createElementNS(namespaceURI, qualifiedName) {
    return new MinimalElement(
      qualifiedName,
      this,
      this._mutationLog,
      namespaceURI || HTML_NAMESPACE
    );
  }

  createTextNode(text) {
    return new MinimalText(text, this, this._mutationLog);
  }

  createComment(text) {
    return new MinimalComment(text, this, this._mutationLog);
  }

  createDocumentFragment() {
    return new MinimalDocumentFragment(this, this._mutationLog);
  }
}

class MinimalWindow extends MinimalEventTarget {
  constructor(document) {
    super("window");
    this.document = document;
    this.navigator = {
      userAgent: "fast-react-container-root-markers-oracle"
    };
    this.location = {
      protocol: "http:"
    };
    this.Node = MinimalNode;
    this.Element = MinimalElement;
    this.HTMLElement = MinimalElement;
    this.HTMLIFrameElement = class MinimalHTMLIFrameElement extends MinimalElement {};
    this.HTMLInputElement = MinimalElement;
    this.HTMLSelectElement = MinimalElement;
    this.HTMLTextAreaElement = MinimalElement;
    this.Document = MinimalDocument;
    this.DocumentFragment = MinimalDocumentFragment;
    this.Text = MinimalText;
    this.Comment = MinimalComment;
    this.Event = MinimalEvent;
    this.EventTarget = MinimalEventTarget;
  }

  getComputedStyle() {
    return {};
  }
}

class MinimalEvent {
  constructor(type, init = {}) {
    this.type = String(type);
    this.bubbles = Boolean(init.bubbles);
    this.cancelable = Boolean(init.cancelable);
    this.defaultPrevented = false;
    this.target = null;
    this.currentTarget = null;
    this.eventPhase = 0;
  }

  preventDefault() {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }

  stopPropagation() {}
}

function dumpNode(node) {
  if (!node) {
    return null;
  }
  if (node.nodeType === TEXT_NODE || node.nodeType === COMMENT_NODE) {
    return {
      nodeType: node.nodeType,
      nodeName: node.nodeName,
      text: node.nodeValue
    };
  }
  return {
    nodeType: node.nodeType,
    nodeName: node.nodeName,
    children: node.childNodes.map(dumpNode)
  };
}

function describeNodeName(node) {
  return node?.nodeName ?? null;
}

function describeValue(value) {
  if (value === null) {
    return {
      type: "null"
    };
  }

  const valueType = typeof value;
  if (valueType === "undefined") {
    return {
      type: "undefined"
    };
  }
  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return {
      type: valueType,
      value
    };
  }

  if (valueType === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length
    };
  }

  return {
    type: valueType,
    stringValue: String(value)
  };
}

main();
