import { createRequire } from "node:module";

import {
  DOM_EVENT_DELEGATION_SCENARIOS
} from "./dom-event-delegation-scenarios.mjs";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

const require = createRequire(import.meta.url);
const action = process.argv[2];
const scenarioId = process.argv[3] ?? null;

function main() {
  if (!["installation", "scenario"].includes(action)) {
    process.stderr.write(
      "Usage: node dom-event-delegation-probe-runner.mjs <installation|scenario> [scenario-id]\n"
    );
    process.exit(1);
  }

  try {
    const probeDom = installProbeDom();
    const React = require("react");
    const ReactDOM = require("react-dom");
    const ReactDOMClient = require("react-dom/client");

    if (action === "installation") {
      process.stdout.write(
        JSON.stringify(
          runInstallationProbe({
            ReactDOMClient,
            probeDom
          })
        )
      );
      process.exit(0);
    }

    const scenario = DOM_EVENT_DELEGATION_SCENARIOS.find(
      (candidate) => candidate.id === scenarioId
    );
    if (!scenario) {
      throw new Error(`Unknown dom-event-delegation scenario: ${scenarioId}`);
    }

    process.stdout.write(
      JSON.stringify(
        runScenarioProbe({
          React,
          ReactDOM,
          ReactDOMClient,
          probeDom,
          scenario
        })
      )
    );
  } catch (error) {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exit(1);
  }
}

function runInstallationProbe({ ReactDOMClient, probeDom }) {
  ReactDOMClient.createRoot(probeDom.container);

  return {
    action: "installation",
    rootContainer: summarizeEventTarget(probeDom.container),
    ownerDocument: summarizeEventTarget(probeDom.document),
    window: summarizeEventTarget(probeDom.window),
    rootContainerReactListeningMarker: summarizeReactListeningMarker(
      probeDom.container
    ),
    ownerDocumentReactListeningMarker: summarizeReactListeningMarker(
      probeDom.document
    ),
    passiveListenerSupportDetected: probeDom.passiveListenerSupportDetected()
  };
}

function runScenarioProbe({
  React,
  ReactDOM,
  ReactDOMClient,
  probeDom,
  scenario
}) {
  const handlerLog = [];
  const retainedSyntheticEvents = [];
  const root = ReactDOMClient.createRoot(probeDom.container);
  const element = createScenarioElement({
    React,
    handlerLog,
    retainedSyntheticEvents,
    scenario
  });

  ReactDOM.flushSync(() => {
    root.render(element);
  });

  const parent = probeDom.document.getElementById("parent");
  const child = probeDom.document.getElementById("child");
  if (!parent || !child) {
    throw new Error("React DOM did not render the expected parent/child nodes");
  }

  const nativeEvent = createNativeEvent(
    probeDom.window,
    scenario.eventName,
    scenario.eventInit
  );
  const dispatchReturnValue = child.dispatchEvent(nativeEvent);

  return {
    action: "scenario",
    scenarioId: scenario.id,
    eventName: scenario.eventName,
    reactProp: scenario.reactProp,
    dispatchReturnValue,
    handlerLog,
    retainedSyntheticEvents: retainedSyntheticEvents.map((entry) => ({
      label: entry.label,
      afterDispatch: describeSyntheticEvent(entry.event)
    })),
    nativeEventAfterDispatch: describeNativeEvent(nativeEvent),
    domAfterRender: {
      rootContainer: summarizeEventTarget(probeDom.container),
      ownerDocument: summarizeEventTarget(probeDom.document),
      parentElement: summarizeEventTarget(parent),
      childElement: summarizeEventTarget(child),
      rootContainerReactListeningMarker: summarizeReactListeningMarker(
        probeDom.container
      )
    }
  };
}

function createScenarioElement({
  React,
  handlerLog,
  retainedSyntheticEvents,
  scenario
}) {
  const parentProps = {
    id: "parent"
  };
  const childProps = {
    id: "child"
  };

  for (const label of scenario.configuredHandlers) {
    const [nodeName, phaseName] = label.split("-");
    const props = nodeName === "parent" ? parentProps : childProps;
    const propName =
      phaseName === "capture"
        ? `${scenario.reactProp}Capture`
        : scenario.reactProp;

    props[propName] = (event) => {
      const beforeAction = describeSyntheticEvent(event);
      let action = "none";

      if (scenario.stopAt === label) {
        event.stopPropagation();
        action = "stopPropagation";
      }
      if (scenario.preventDefaultAt === label) {
        event.preventDefault();
        action = "preventDefault";
      }
      if (scenario.captureSyntheticShape) {
        retainedSyntheticEvents.push({
          label,
          event
        });
      }

      handlerLog.push({
        label,
        nodeName,
        phaseName,
        action,
        beforeAction,
        afterAction: describeSyntheticEvent(event)
      });
    };
  }

  return React.createElement(
    "section",
    parentProps,
    React.createElement("button", childProps, "Child")
  );
}

function createNativeEvent(window, eventName, eventInit) {
  if (eventName === "wheel") {
    return new window.WheelEvent(eventName, eventInit);
  }
  if (eventName.startsWith("mouse") || eventName === "click") {
    return new window.MouseEvent(eventName, eventInit);
  }
  return new window.Event(eventName, eventInit);
}

function installProbeDom() {
  const document = new MinimalDocument();
  const window = new MinimalWindow(document);
  document.defaultView = window;
  document.parentNode = window;

  const container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);

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
    document,
    passiveListenerSupportDetected: () => window.passiveListenerSupportDetected,
    window
  };
}

class MinimalEventTarget {
  constructor(targetKind) {
    this._targetKind = targetKind;
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
    return dispatchNativeEvent(this, event);
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
  constructor() {
    super({
      nodeName: "#document",
      nodeType: DOCUMENT_NODE,
      ownerDocument: null
    });
    this.ownerDocument = this;
    this.defaultView = null;
    this.documentElement = new MinimalElement("html", this);
    this.body = new MinimalElement("body", this);
    this.activeElement = this.body;
    this.implementation = {
      createHTMLDocument: () => new MinimalDocument()
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
  constructor(document) {
    super("window");
    this.document = document;
    this.navigator = {
      userAgent: "fast-react-dom-event-delegation-oracle"
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
    this._immediatePropagationStopped = false;
    this._path = [];
    this._preventDefaultCallCount = 0;
    this._stopImmediatePropagationCallCount = 0;
    this._stopPropagationCallCount = 0;
  }

  preventDefault() {
    this._preventDefaultCallCount += 1;
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }

  stopPropagation() {
    this._stopPropagationCallCount += 1;
    this.cancelBubble = true;
  }

  stopImmediatePropagation() {
    this._stopImmediatePropagationCallCount += 1;
    this._immediatePropagationStopped = true;
    this.stopPropagation();
  }

  composedPath() {
    return [...this._path];
  }
}

class MinimalMouseEvent extends MinimalEvent {
  constructor(type, init = {}) {
    super(type, init);
    this.screenX = init.screenX ?? 0;
    this.screenY = init.screenY ?? 0;
    this.clientX = init.clientX ?? 0;
    this.clientY = init.clientY ?? 0;
    this.pageX = init.pageX ?? this.clientX;
    this.pageY = init.pageY ?? this.clientY;
    this.movementX = init.movementX ?? 0;
    this.movementY = init.movementY ?? 0;
    this.ctrlKey = Boolean(init.ctrlKey);
    this.shiftKey = Boolean(init.shiftKey);
    this.altKey = Boolean(init.altKey);
    this.metaKey = Boolean(init.metaKey);
    this.button = init.button ?? 0;
    this.buttons = init.buttons ?? 0;
    this.relatedTarget = init.relatedTarget ?? null;
  }
}

class MinimalWheelEvent extends MinimalMouseEvent {
  constructor(type, init = {}) {
    super(type, init);
    this.deltaX = init.deltaX ?? 0;
    this.deltaY = init.deltaY ?? 0;
    this.deltaZ = init.deltaZ ?? 0;
    this.deltaMode = init.deltaMode ?? 0;
  }
}

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

function dispatchNativeEvent(target, event) {
  if (!(event instanceof MinimalEvent)) {
    throw new TypeError("Minimal DOM can only dispatch MinimalEvent instances");
  }

  if (!event.target) {
    event.target = target;
    event.srcElement = target;
  }

  const path = [];
  for (let current = target; current; current = current.parentNode) {
    path.push(current);
  }
  event._path = [...path];

  const ancestors = path.slice(1);
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    invokeListeners(ancestors[index], event, true, 1);
    if (event.cancelBubble) {
      finishDispatch(event);
      return !event.defaultPrevented;
    }
  }

  invokeListeners(target, event, true, 2);
  if (!event._immediatePropagationStopped) {
    invokeListeners(target, event, false, 2);
  }
  if (event.cancelBubble) {
    finishDispatch(event);
    return !event.defaultPrevented;
  }

  if (event.bubbles) {
    for (const ancestor of ancestors) {
      invokeListeners(ancestor, event, false, 3);
      if (event.cancelBubble) {
        break;
      }
    }
  }

  finishDispatch(event);
  return !event.defaultPrevented;
}

function invokeListeners(target, event, capture, eventPhase) {
  const listeners = target._listeners?.get(event.type) ?? [];
  const matching = listeners.filter((listener) => listener.capture === capture);
  if (matching.length === 0) {
    return;
  }

  const window = target.ownerDocument?.defaultView ?? target.document?.defaultView ?? target;
  const previousEvent = window.event;
  event.currentTarget = target;
  event.eventPhase = eventPhase;

  try {
    window.event = event;
    for (const listener of matching) {
      if (event._immediatePropagationStopped) {
        break;
      }

      if (typeof listener.callback === "function") {
        listener.callback.call(target, event);
      } else if (typeof listener.callback?.handleEvent === "function") {
        listener.callback.handleEvent(event);
      }

      if (listener.once) {
        target.removeEventListener(event.type, listener.callback, {
          capture: listener.capture
        });
      }
    }
  } finally {
    window.event = previousEvent;
  }
}

function finishDispatch(event) {
  event.currentTarget = null;
  event.eventPhase = 0;
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
  return {
    propertyCount: Object.getOwnPropertyNames(target).filter((name) =>
      name.startsWith("_reactListening")
    ).length
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
      passive: listener.passive
    });
    byEvent.set(listener.eventName, summary);
  }

  return {
    kind: describeNode(target).kind,
    id: describeNode(target).id,
    listenerCount: listenerLog.length,
    eventNames: [...byEvent.keys()].sort(),
    byEvent: [...byEvent.values()].sort((left, right) =>
      left.eventName.localeCompare(right.eventName)
    )
  };
}

function describeSyntheticEvent(event) {
  return {
    type: event.type,
    constructorName: event.constructor?.name ?? null,
    objectTag: Object.prototype.toString.call(event),
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    defaultPrevented: event.defaultPrevented,
    eventPhase: event.eventPhase,
    isDefaultPrevented:
      typeof event.isDefaultPrevented === "function"
        ? event.isDefaultPrevented()
        : null,
    isPersistent:
      typeof event.isPersistent === "function" ? event.isPersistent() : null,
    isPropagationStopped:
      typeof event.isPropagationStopped === "function"
        ? event.isPropagationStopped()
        : null,
    hasPersist: typeof event.persist === "function",
    hasPreventDefault: typeof event.preventDefault === "function",
    hasStopPropagation: typeof event.stopPropagation === "function",
    target: describeNode(event.target),
    currentTarget: describeNode(event.currentTarget),
    nativeEvent: describeNativeEvent(event.nativeEvent),
    fields: {
      button: event.button ?? null,
      buttons: event.buttons ?? null,
      clientX: event.clientX ?? null,
      clientY: event.clientY ?? null,
      deltaMode: event.deltaMode ?? null,
      deltaX: event.deltaX ?? null,
      deltaY: event.deltaY ?? null,
      movementX: event.movementX ?? null,
      movementY: event.movementY ?? null,
      timeStampType: typeof event.timeStamp
    }
  };
}

function describeNativeEvent(event) {
  if (!event) {
    return null;
  }

  return {
    type: event.type,
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    defaultPrevented: event.defaultPrevented,
    cancelBubble: event.cancelBubble,
    eventPhase: event.eventPhase,
    target: describeNode(event.target),
    currentTarget: describeNode(event.currentTarget),
    preventDefaultCallCount: event._preventDefaultCallCount ?? 0,
    stopImmediatePropagationCallCount:
      event._stopImmediatePropagationCallCount ?? 0,
    stopPropagationCallCount: event._stopPropagationCallCount ?? 0,
    button: event.button ?? null,
    buttons: event.buttons ?? null,
    clientX: event.clientX ?? null,
    clientY: event.clientY ?? null,
    deltaMode: event.deltaMode ?? null,
    deltaX: event.deltaX ?? null,
    deltaY: event.deltaY ?? null,
    movementX: event.movementX ?? null,
    movementY: event.movementY ?? null
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

main();
