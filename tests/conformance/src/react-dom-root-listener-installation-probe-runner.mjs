import { createRequire } from "node:module";

import {
  REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS
} from "./react-dom-root-listener-installation-scenarios.mjs";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

const require = createRequire(import.meta.url);
const scenarioId = process.argv[2] ?? null;
const consoleCalls = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  consoleCalls.push({
    method: "error",
    args: args.map((arg) => describeConsoleArg(arg))
  });
};
console.warn = (...args) => {
  consoleCalls.push({
    method: "warn",
    args: args.map((arg) => describeConsoleArg(arg))
  });
};

function main() {
  try {
    if (
      !REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS.some(
        (scenario) => scenario.id === scenarioId
      )
    ) {
      throw new Error(
        `Unknown React DOM root listener installation scenario: ${scenarioId}`
      );
    }

    const probeDom = installProbeDom();
    const React = require("react");
    const ReactDOM = require("react-dom");
    const ReactDOMClient = require("react-dom/client");

    const result = runScenario({
      React,
      ReactDOM,
      ReactDOMClient,
      probeDom,
      scenarioId
    });

    process.stdout.write(
      JSON.stringify({
        ...result,
        consoleCalls
      })
    );
  } catch (error) {
    originalConsoleError(`${error?.stack ?? error}\n`);
    process.exit(1);
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
}

function runScenario({ React, ReactDOM, ReactDOMClient, probeDom, scenarioId }) {
  switch (scenarioId) {
    case "create-root-root-container":
      return runCreateRootRootContainerProbe({ ReactDOMClient, probeDom });
    case "create-root-same-container-dedupe":
      return runCreateRootSameContainerDedupeProbe({
        ReactDOMClient,
        probeDom
      });
    case "hydrate-root-root-container":
      return runHydrateRootRootContainerProbe({
        React,
        ReactDOMClient,
        probeDom
      });
    case "hydrate-root-same-container-dedupe":
      return runHydrateRootSameContainerDedupeProbe({
        React,
        ReactDOMClient,
        probeDom
      });
    case "create-root-then-hydrate-root-same-container-dedupe":
      return runCreateRootThenHydrateRootSameContainerDedupeProbe({
        React,
        ReactDOMClient,
        probeDom
      });
    case "create-root-same-document-dedupe":
      return runCreateRootSameDocumentDedupeProbe({
        ReactDOMClient,
        probeDom
      });
    case "portal-same-document-listeners":
      return runPortalSameDocumentProbe({
        React,
        ReactDOM,
        ReactDOMClient,
        probeDom
      });
    case "portal-cross-document-listeners":
      return runPortalCrossDocumentProbe({
        React,
        ReactDOM,
        ReactDOMClient,
        probeDom
      });
    default:
      throw new Error(`Unhandled scenario: ${scenarioId}`);
  }
}

function runCreateRootRootContainerProbe({ ReactDOMClient, probeDom }) {
  const before = summarizePrimaryTargets(probeDom);
  ReactDOMClient.createRoot(probeDom.container);
  const after = summarizePrimaryTargets(probeDom);

  return {
    scenarioId: "create-root-root-container",
    before,
    after,
    listenerDeltas: diffListenerCounts(before, after),
    passiveListenerSupportDetected: probeDom.primaryWindow
      .passiveListenerSupportDetected
  };
}

function runCreateRootSameContainerDedupeProbe({ ReactDOMClient, probeDom }) {
  ReactDOMClient.createRoot(probeDom.container);
  const afterFirstCreateRoot = summarizePrimaryTargets(probeDom);

  ReactDOMClient.createRoot(probeDom.container);
  const afterSecondCreateRoot = summarizePrimaryTargets(probeDom);

  return {
    scenarioId: "create-root-same-container-dedupe",
    afterFirstCreateRoot,
    afterSecondCreateRoot,
    listenerDeltas: diffListenerCounts(
      afterFirstCreateRoot,
      afterSecondCreateRoot
    ),
    passiveListenerSupportDetected: probeDom.primaryWindow
      .passiveListenerSupportDetected
  };
}

function runHydrateRootRootContainerProbe({ React, ReactDOMClient, probeDom }) {
  const before = summarizePrimaryTargets(probeDom);
  const hydrationRoot = ReactDOMClient.hydrateRoot(
    probeDom.container,
    React.createElement("div", { id: "hydrated-child" }, "hydrated")
  );
  const after = summarizePrimaryTargets(probeDom);

  return {
    scenarioId: "hydrate-root-root-container",
    before,
    after,
    hydrationRoot: summarizeHydrationRoot(hydrationRoot),
    listenerDeltas: diffListenerCounts(before, after),
    passiveListenerSupportDetected: probeDom.primaryWindow
      .passiveListenerSupportDetected
  };
}

function runHydrateRootSameContainerDedupeProbe({
  React,
  ReactDOMClient,
  probeDom
}) {
  ReactDOMClient.hydrateRoot(
    probeDom.container,
    React.createElement("div", { id: "hydrated-child" }, "hydrated")
  );
  const afterFirstHydrateRoot = summarizePrimaryTargets(probeDom);

  ReactDOMClient.hydrateRoot(
    probeDom.container,
    React.createElement("div", { id: "hydrated-child" }, "hydrated again")
  );
  const afterSecondHydrateRoot = summarizePrimaryTargets(probeDom);

  return {
    scenarioId: "hydrate-root-same-container-dedupe",
    afterFirstHydrateRoot,
    afterSecondHydrateRoot,
    listenerDeltas: diffListenerCounts(
      afterFirstHydrateRoot,
      afterSecondHydrateRoot
    ),
    passiveListenerSupportDetected: probeDom.primaryWindow
      .passiveListenerSupportDetected
  };
}

function runCreateRootThenHydrateRootSameContainerDedupeProbe({
  React,
  ReactDOMClient,
  probeDom
}) {
  ReactDOMClient.createRoot(probeDom.container);
  const afterCreateRoot = summarizePrimaryTargets(probeDom);

  ReactDOMClient.hydrateRoot(
    probeDom.container,
    React.createElement("div", { id: "hydrated-child" }, "hydrated")
  );
  const afterHydrateRoot = summarizePrimaryTargets(probeDom);

  return {
    scenarioId: "create-root-then-hydrate-root-same-container-dedupe",
    afterCreateRoot,
    afterHydrateRoot,
    listenerDeltas: diffListenerCounts(afterCreateRoot, afterHydrateRoot),
    passiveListenerSupportDetected: probeDom.primaryWindow
      .passiveListenerSupportDetected
  };
}

function runCreateRootSameDocumentDedupeProbe({ ReactDOMClient, probeDom }) {
  ReactDOMClient.createRoot(probeDom.container);
  const afterFirstRoot = summarizePrimaryTargets(probeDom);

  ReactDOMClient.createRoot(probeDom.secondContainer);
  const afterSecondRoot = {
    primaryRootContainer: summarizeEventTarget(probeDom.container),
    secondRootContainer: summarizeEventTarget(probeDom.secondContainer),
    ownerDocument: summarizeEventTarget(probeDom.primaryDocument),
    primaryRootContainerReactListeningMarker: summarizeReactListeningMarker(
      probeDom.container
    ),
    secondRootContainerReactListeningMarker: summarizeReactListeningMarker(
      probeDom.secondContainer
    ),
    ownerDocumentReactListeningMarker: summarizeReactListeningMarker(
      probeDom.primaryDocument
    )
  };

  return {
    scenarioId: "create-root-same-document-dedupe",
    afterFirstRoot,
    afterSecondRoot,
    ownerDocumentListenerDelta:
      afterSecondRoot.ownerDocument.listenerCount -
      afterFirstRoot.ownerDocument.listenerCount,
    passiveListenerSupportDetected: probeDom.primaryWindow
      .passiveListenerSupportDetected
  };
}

function runPortalSameDocumentProbe({
  React,
  ReactDOM,
  ReactDOMClient,
  probeDom
}) {
  const root = ReactDOMClient.createRoot(probeDom.container);
  const afterCreateRoot = summarizePortalTargets({
    ownerDocument: probeDom.primaryDocument,
    portalContainer: probeDom.sameDocumentPortalContainer,
    rootContainer: probeDom.container
  });

  ReactDOM.flushSync(() => {
    root.render(
      ReactDOM.createPortal(
        React.createElement("span", { id: "same-doc-portal-child" }, "portal"),
        probeDom.sameDocumentPortalContainer
      )
    );
  });
  const afterFirstPortalRender = summarizePortalTargets({
    ownerDocument: probeDom.primaryDocument,
    portalContainer: probeDom.sameDocumentPortalContainer,
    rootContainer: probeDom.container
  });

  ReactDOM.flushSync(() => {
    root.render(
      ReactDOM.createPortal(
        React.createElement(
          "span",
          { id: "same-doc-portal-child" },
          "portal update"
        ),
        probeDom.sameDocumentPortalContainer
      )
    );
  });
  const afterSecondPortalRender = summarizePortalTargets({
    ownerDocument: probeDom.primaryDocument,
    portalContainer: probeDom.sameDocumentPortalContainer,
    rootContainer: probeDom.container
  });

  return {
    scenarioId: "portal-same-document-listeners",
    afterCreateRoot,
    afterFirstPortalRender,
    afterSecondPortalRender,
    portalListenerDeltaAfterSecondRender:
      afterSecondPortalRender.portalContainer.listenerCount -
      afterFirstPortalRender.portalContainer.listenerCount,
    passiveListenerSupportDetected: probeDom.primaryWindow
      .passiveListenerSupportDetected
  };
}

function runPortalCrossDocumentProbe({
  React,
  ReactDOM,
  ReactDOMClient,
  probeDom
}) {
  const root = ReactDOMClient.createRoot(probeDom.container);
  const afterCreateRoot = {
    primaryRootContainer: summarizeEventTarget(probeDom.container),
    primaryOwnerDocument: summarizeEventTarget(probeDom.primaryDocument),
    externalPortalContainer: summarizeEventTarget(
      probeDom.crossDocumentPortalContainer
    ),
    externalOwnerDocument: summarizeEventTarget(probeDom.externalDocument),
    externalPortalContainerReactListeningMarker: summarizeReactListeningMarker(
      probeDom.crossDocumentPortalContainer
    ),
    externalOwnerDocumentReactListeningMarker: summarizeReactListeningMarker(
      probeDom.externalDocument
    )
  };

  ReactDOM.flushSync(() => {
    root.render(
      ReactDOM.createPortal(
        React.createElement("span", { id: "cross-doc-portal-child" }, "portal"),
        probeDom.crossDocumentPortalContainer
      )
    );
  });
  const afterPortalRender = {
    primaryRootContainer: summarizeEventTarget(probeDom.container),
    primaryOwnerDocument: summarizeEventTarget(probeDom.primaryDocument),
    externalPortalContainer: summarizeEventTarget(
      probeDom.crossDocumentPortalContainer
    ),
    externalOwnerDocument: summarizeEventTarget(probeDom.externalDocument),
    externalPortalContainerReactListeningMarker: summarizeReactListeningMarker(
      probeDom.crossDocumentPortalContainer
    ),
    externalOwnerDocumentReactListeningMarker: summarizeReactListeningMarker(
      probeDom.externalDocument
    )
  };

  return {
    scenarioId: "portal-cross-document-listeners",
    afterCreateRoot,
    afterPortalRender,
    externalOwnerDocumentListenerDelta:
      afterPortalRender.externalOwnerDocument.listenerCount -
      afterCreateRoot.externalOwnerDocument.listenerCount,
    passiveListenerSupportDetected:
      probeDom.primaryWindow.passiveListenerSupportDetected ||
      probeDom.externalWindow.passiveListenerSupportDetected
  };
}

function summarizePrimaryTargets(probeDom) {
  return {
    rootContainer: summarizeEventTarget(probeDom.container),
    ownerDocument: summarizeEventTarget(probeDom.primaryDocument),
    window: summarizeEventTarget(probeDom.primaryWindow),
    rootContainerReactListeningMarker: summarizeReactListeningMarker(
      probeDom.container
    ),
    ownerDocumentReactListeningMarker: summarizeReactListeningMarker(
      probeDom.primaryDocument
    )
  };
}

function summarizePortalTargets({ ownerDocument, portalContainer, rootContainer }) {
  return {
    rootContainer: summarizeEventTarget(rootContainer),
    portalContainer: summarizeEventTarget(portalContainer),
    ownerDocument: summarizeEventTarget(ownerDocument),
    rootContainerReactListeningMarker: summarizeReactListeningMarker(
      rootContainer
    ),
    portalContainerReactListeningMarker: summarizeReactListeningMarker(
      portalContainer
    ),
    ownerDocumentReactListeningMarker: summarizeReactListeningMarker(
      ownerDocument
    )
  };
}

function summarizeHydrationRoot(root) {
  return {
    constructorName: root?.constructor?.name ?? null,
    ownKeys: Object.keys(root ?? {}),
    unstableScheduleHydrationType: typeof root?.unstable_scheduleHydration
  };
}

function diffListenerCounts(before, after) {
  return {
    rootContainer:
      after.rootContainer.listenerCount - before.rootContainer.listenerCount,
    ownerDocument:
      after.ownerDocument.listenerCount - before.ownerDocument.listenerCount,
    window: after.window.listenerCount - before.window.listenerCount
  };
}

function installProbeDom() {
  const primaryDocument = new MinimalDocument("primary");
  const primaryWindow = new MinimalWindow(primaryDocument, "primary");
  primaryDocument.defaultView = primaryWindow;
  primaryDocument.parentNode = primaryWindow;

  const externalDocument = new MinimalDocument("external");
  const externalWindow = new MinimalWindow(externalDocument, "external");
  externalDocument.defaultView = externalWindow;
  externalDocument.parentNode = externalWindow;

  const container = primaryDocument.createElement("div");
  container.id = "root";
  primaryDocument.body.appendChild(container);

  const secondContainer = primaryDocument.createElement("div");
  secondContainer.id = "second-root";
  primaryDocument.body.appendChild(secondContainer);

  const sameDocumentPortalContainer = primaryDocument.createElement("div");
  sameDocumentPortalContainer.id = "same-document-portal";
  primaryDocument.body.appendChild(sameDocumentPortalContainer);

  const crossDocumentPortalContainer = externalDocument.createElement("div");
  crossDocumentPortalContainer.id = "cross-document-portal";
  externalDocument.body.appendChild(crossDocumentPortalContainer);

  Object.defineProperties(globalThis, {
    window: {
      configurable: true,
      value: primaryWindow,
      writable: true
    },
    self: {
      configurable: true,
      value: primaryWindow,
      writable: true
    },
    document: {
      configurable: true,
      value: primaryDocument,
      writable: true
    },
    navigator: {
      configurable: true,
      value: primaryWindow.navigator,
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
      value: primaryWindow.HTMLIFrameElement,
      writable: true
    },
    Event: {
      configurable: true,
      value: MinimalEvent,
      writable: true
    },
    MouseEvent: {
      configurable: true,
      value: MinimalMouseEvent,
      writable: true
    },
    WheelEvent: {
      configurable: true,
      value: MinimalWheelEvent,
      writable: true
    }
  });

  return {
    container,
    crossDocumentPortalContainer,
    externalDocument,
    externalWindow,
    primaryDocument,
    primaryWindow,
    sameDocumentPortalContainer,
    secondContainer
  };
}

class MinimalEventTarget {
  constructor(targetKind, label = null) {
    this._targetKind = targetKind;
    this._targetLabel = label;
    this._listeners = new Map();
    this._listenerLog = [];
  }

  addEventListener(type, callback, options = undefined) {
    if (callback == null) {
      return;
    }

    const normalized = normalizeListenerOptions(options);
    const record = {
      type: String(type),
      callback,
      capture: normalized.capture,
      passive: normalized.passive,
      once: normalized.once,
      order: this._listenerLog.length
    };
    const listeners = this._listeners.get(record.type) ?? [];
    listeners.push(record);
    this._listeners.set(record.type, listeners);
    this._listenerLog.push({
      eventName: record.type,
      capture: record.capture,
      passive: record.passive,
      once: record.once,
      order: record.order
    });
  }

  removeEventListener(type, callback, options = undefined) {
    const normalized = normalizeListenerOptions(options);
    const eventName = String(type);
    const listeners = this._listeners.get(eventName);
    if (!listeners) {
      return;
    }

    this._listeners.set(
      eventName,
      listeners.filter(
        (listener) =>
          listener.callback !== callback || listener.capture !== normalized.capture
      )
    );
  }

  dispatchEvent(event) {
    if (event.cancelable && event.defaultPrevented) {
      return false;
    }
    return true;
  }
}

class MinimalNode extends MinimalEventTarget {
  constructor({ nodeName, nodeType, ownerDocument = null }) {
    super("node");
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
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }

    const index =
      beforeChild == null ? -1 : this.childNodes.indexOf(beforeChild);
    if (beforeChild != null && index === -1) {
      throw new Error("insertBefore target is not a child of this node");
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

    return child;
  }

  removeChild(child) {
    const index = this.childNodes.indexOf(child);
    if (index === -1) {
      throw new Error("removeChild target is not a child of this node");
    }

    this.childNodes.splice(index, 1);
    child.parentNode = null;
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

  getRootNode() {
    let current = this;
    while (current.parentNode) {
      current = current.parentNode;
    }
    return current;
  }

  get firstChild() {
    return this.childNodes[0] ?? null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }

  get nextSibling() {
    if (!this.parentNode) {
      return null;
    }
    const index = this.parentNode.childNodes.indexOf(this);
    return this.parentNode.childNodes[index + 1] ?? null;
  }

  get previousSibling() {
    if (!this.parentNode) {
      return null;
    }
    const index = this.parentNode.childNodes.indexOf(this);
    return index > 0 ? this.parentNode.childNodes[index - 1] : null;
  }

  get isConnected() {
    return this.getRootNode()?.nodeType === DOCUMENT_NODE;
  }

  get textContent() {
    if (this.nodeType === TEXT_NODE || this.nodeType === COMMENT_NODE) {
      return this.nodeValue;
    }

    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this.childNodes = [];
    if (value !== "" && value != null) {
      this.appendChild(
        this.ownerDocument.createTextNode(
          typeof value === "string" ? value : String(value)
        )
      );
    }
  }
}

MinimalNode.ELEMENT_NODE = ELEMENT_NODE;
MinimalNode.TEXT_NODE = TEXT_NODE;
MinimalNode.COMMENT_NODE = COMMENT_NODE;
MinimalNode.DOCUMENT_NODE = DOCUMENT_NODE;
MinimalNode.DOCUMENT_FRAGMENT_NODE = DOCUMENT_FRAGMENT_NODE;

class MinimalCharacterData extends MinimalNode {
  constructor({ nodeName, nodeType, nodeValue, ownerDocument }) {
    super({ nodeName, nodeType, ownerDocument });
    this.nodeValue = nodeValue;
    this.data = nodeValue;
  }

  get textContent() {
    return this.nodeValue;
  }

  set textContent(value) {
    this.nodeValue = value == null ? "" : String(value);
    this.data = this.nodeValue;
  }
}

class MinimalText extends MinimalCharacterData {
  constructor(text, ownerDocument) {
    super({
      nodeName: "#text",
      nodeType: TEXT_NODE,
      nodeValue: text,
      ownerDocument
    });
  }
}

class MinimalComment extends MinimalCharacterData {
  constructor(text, ownerDocument) {
    super({
      nodeName: "#comment",
      nodeType: COMMENT_NODE,
      nodeValue: text,
      ownerDocument
    });
  }
}

class MinimalStyle {
  constructor() {
    this._properties = new Map();
  }

  setProperty(name, value) {
    this._properties.set(String(name), String(value));
  }

  removeProperty(name) {
    const key = String(name);
    const value = this._properties.get(key) ?? "";
    this._properties.delete(key);
    return value;
  }
}

class MinimalElement extends MinimalNode {
  constructor(tagName, ownerDocument, namespaceURI = HTML_NAMESPACE) {
    const normalizedName = String(tagName);
    super({
      nodeName:
        namespaceURI === HTML_NAMESPACE
          ? normalizedName.toUpperCase()
          : normalizedName,
      nodeType: ELEMENT_NODE,
      ownerDocument
    });
    this.attributes = new Map();
    this.localName = normalizedName.toLowerCase();
    this.namespaceURI = namespaceURI;
    this.style = new MinimalStyle();
    this.tagName = this.nodeName;
  }

  setAttribute(name, value) {
    const normalizedName = String(name);
    const normalizedValue = String(value);
    this.attributes.set(normalizedName, normalizedValue);
    if (normalizedName === "id") {
      this.id = normalizedValue;
    }
    if (normalizedName === "class") {
      this.className = normalizedValue;
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
    const normalizedName = String(name);
    this.attributes.delete(normalizedName);
    if (normalizedName === "id") {
      this.id = "";
    }
    if (normalizedName === "class") {
      this.className = "";
    }
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  blur() {
    if (this.ownerDocument.activeElement === this) {
      this.ownerDocument.activeElement = this.ownerDocument.body;
    }
  }

  get firstElementChild() {
    return this.childNodes.find((child) => child.nodeType === ELEMENT_NODE) ?? null;
  }

  get children() {
    return this.childNodes.filter((child) => child.nodeType === ELEMENT_NODE);
  }
}

class MinimalDocument extends MinimalNode {
  constructor(label) {
    super({
      nodeName: "#document",
      nodeType: DOCUMENT_NODE,
      ownerDocument: null
    });
    this._targetLabel = label;
    this.ownerDocument = this;
    this.defaultView = null;
    this.documentElement = new MinimalElement("html", this);
    this.body = new MinimalElement("body", this);
    this.activeElement = this.body;
    this.implementation = {
      createHTMLDocument: (title = "") => new MinimalDocument(String(title))
    };

    super.appendChild(this.documentElement);
    this.documentElement.appendChild(this.body);
  }

  createElement(tagName) {
    const element = new MinimalElement(tagName, this, HTML_NAMESPACE);
    if (String(tagName).toLowerCase() === "input") {
      element.value = "";
      element.checked = false;
    }
    return element;
  }

  createElementNS(namespaceURI, qualifiedName) {
    const namespace =
      namespaceURI || String(qualifiedName).toLowerCase() === "svg"
        ? namespaceURI || SVG_NAMESPACE
        : HTML_NAMESPACE;
    return new MinimalElement(qualifiedName, this, namespace);
  }

  createTextNode(text) {
    return new MinimalText(String(text), this);
  }

  createComment(text) {
    return new MinimalComment(String(text), this);
  }

  getElementById(id) {
    return findElementById(this, String(id));
  }
}

class MinimalWindow extends MinimalEventTarget {
  constructor(document, label) {
    super("window", label);
    this.document = document;
    this.navigator = {
      userAgent: "fast-react-root-listener-installation-oracle"
    };
    this.location = {
      protocol: "http:"
    };
    this.passiveListenerSupportDetected = false;
    this.Node = MinimalNode;
    this.Element = MinimalElement;
    this.HTMLElement = MinimalElement;
    this.HTMLButtonElement = MinimalElement;
    this.HTMLDivElement = MinimalElement;
    this.HTMLIFrameElement = class MinimalHTMLIFrameElement extends MinimalElement {};
    this.HTMLInputElement = MinimalElement;
    this.HTMLSelectElement = MinimalElement;
    this.HTMLTextAreaElement = MinimalElement;
    this.SVGElement = MinimalElement;
    this.Event = MinimalEvent;
    this.MouseEvent = MinimalMouseEvent;
    this.WheelEvent = MinimalWheelEvent;
    this.EventTarget = MinimalEventTarget;
  }

  getComputedStyle() {
    return {};
  }

  addEventListener(type, callback, options = undefined) {
    if (options && typeof options === "object") {
      Reflect.get(options, "passive");
      this.passiveListenerSupportDetected = true;
    }
    super.addEventListener(type, callback, options);
  }
}

class MinimalEvent {
  constructor(type, init = {}) {
    this.type = String(type);
    this.bubbles = Boolean(init.bubbles);
    this.cancelable = Boolean(init.cancelable);
    this.defaultPrevented = Boolean(init.defaultPrevented);
    this.eventPhase = 0;
    this.isTrusted = false;
    this.target = null;
    this.currentTarget = null;
    this.srcElement = null;
    this.timeStamp = 1;
    this.cancelBubble = false;
  }

  preventDefault() {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }

  stopPropagation() {
    this.cancelBubble = true;
  }

  stopImmediatePropagation() {
    this.stopPropagation();
  }

  composedPath() {
    return [];
  }
}

class MinimalMouseEvent extends MinimalEvent {}

class MinimalWheelEvent extends MinimalMouseEvent {}

function normalizeListenerOptions(options) {
  if (options === true || options === false) {
    return {
      capture: options,
      once: false,
      passive: null
    };
  }

  if (!options || typeof options !== "object") {
    return {
      capture: false,
      once: false,
      passive: null
    };
  }

  return {
    capture: Boolean(Reflect.get(options, "capture")),
    once: Boolean(Reflect.get(options, "once")),
    passive:
      Reflect.get(options, "passive") === undefined
        ? null
        : Boolean(Reflect.get(options, "passive"))
  };
}

function findElementById(node, id) {
  if (node.nodeType === ELEMENT_NODE && node.id === id) {
    return node;
  }

  for (const child of node.childNodes ?? []) {
    const match = findElementById(child, id);
    if (match) {
      return match;
    }
  }

  return null;
}

function summarizeReactListeningMarker(target) {
  const markerNames = Object.getOwnPropertyNames(target).filter((name) =>
    name.startsWith("_reactListening")
  );
  return {
    propertyCount: markerNames.length,
    trueValueCount: markerNames.filter((name) => target[name] === true).length
  };
}

function summarizeEventTarget(target) {
  const listenerLog = target?._listenerLog ?? [];
  const byEvent = new Map();
  for (const listener of listenerLog) {
    const summary =
      byEvent.get(listener.eventName) ??
      {
        eventName: listener.eventName,
        captureCount: 0,
        bubbleCount: 0,
        passiveTrueCount: 0,
        passiveFalseCount: 0,
        passiveUnspecifiedCount: 0,
        registrations: []
      };

    if (listener.capture) {
      summary.captureCount += 1;
    } else {
      summary.bubbleCount += 1;
    }

    if (listener.passive === true) {
      summary.passiveTrueCount += 1;
    } else if (listener.passive === false) {
      summary.passiveFalseCount += 1;
    } else {
      summary.passiveUnspecifiedCount += 1;
    }

    summary.registrations.push({
      capture: listener.capture,
      once: listener.once,
      order: listener.order,
      passive: listener.passive
    });
    byEvent.set(listener.eventName, summary);
  }

  return {
    kind: describeNode(target).kind,
    id: describeNode(target).id,
    label: target?._targetLabel ?? null,
    listenerCount: listenerLog.length,
    eventNames: [...byEvent.keys()].sort(),
    byEvent: [...byEvent.values()].sort((left, right) =>
      left.eventName.localeCompare(right.eventName)
    )
  };
}

function describeNode(node) {
  if (!node) {
    return {
      id: null,
      kind: "null",
      nodeName: null,
      nodeType: null
    };
  }

  if (node instanceof MinimalWindow) {
    return {
      id: null,
      kind: "window",
      nodeName: "window",
      nodeType: null
    };
  }

  if (node.nodeType === DOCUMENT_NODE) {
    return {
      id: null,
      kind: "document",
      nodeName: "#document",
      nodeType: DOCUMENT_NODE
    };
  }

  return {
    id: node.id ?? null,
    kind: node.nodeType === ELEMENT_NODE ? "element" : "node",
    nodeName: node.nodeName ?? null,
    nodeType: node.nodeType ?? null
  };
}

function describeConsoleArg(arg) {
  if (typeof arg === "string") {
    return {
      type: "string",
      value: arg
    };
  }
  if (arg instanceof Error) {
    return {
      type: "error",
      name: arg.name,
      message: arg.message
    };
  }
  return {
    type: typeof arg,
    value: String(arg)
  };
}

main();
