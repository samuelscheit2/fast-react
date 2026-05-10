import { createRequire } from "node:module";

import {
  findDomTextContentRenderScenario,
  materializeElementDescriptor
} from "./dom-text-content-scenarios.mjs";
import { DOM_TEXT_CONTENT_NAMESPACES } from "./dom-text-content-targets.mjs";

const require = createRequire(import.meta.url);
const action = process.argv[2];
const scenarioId = process.argv[3];

if (!action || !scenarioId) {
  process.stderr.write(
    "Usage: node dom-text-content-probe-runner.mjs <server|client> <scenario>\n"
  );
  process.exit(1);
}

const scenario = findDomTextContentRenderScenario(scenarioId);

if (action === "server") {
  process.stdout.write(JSON.stringify(runServerProbe(scenario)));
  process.exit(0);
}

if (action === "client") {
  process.stdout.write(JSON.stringify(runClientProbe(scenario)));
  process.exit(0);
}

process.stderr.write(`Unsupported dom-text-content probe action: ${action}\n`);
process.exit(1);

function runServerProbe(currentScenario) {
  const React = require("react");
  const ReactDOMServer = require("react-dom/server");
  const ReactDOM = require("react-dom");

  return {
    action: "server",
    scenarioId: currentScenario.id,
    targetPackage: "react-dom",
    reactVersion: React.version,
    reactDomVersion: ReactDOM.version,
    phases: currentScenario.phases.map((phase) => {
      const captured = captureConsoleCalls(() =>
        captureOperation("renderToString", () =>
          ReactDOMServer.renderToString(
            materializeElementDescriptor(React, phase.root)
          )
        )
      );

      return {
        phaseId: phase.id,
        result: captured.result,
        consoleCalls: captured.consoleCalls
      };
    })
  };
}

function runClientProbe(currentScenario) {
  const fakeDom = installFakeDom();
  const React = require("react");
  const ReactDOM = require("react-dom");
  const ReactDOMClient = require("react-dom/client");

  fakeDom.takeMutationLog();
  const container = fakeDom.createContainer(currentScenario.container);
  const containerCreationMutations = fakeDom.takeMutationLog();

  const rootErrors = [];
  const rootSetup = captureConsoleCalls(() =>
    captureOperation("createRoot", () =>
      ReactDOMClient.createRoot(container, createRootErrorHandlers(rootErrors))
    )
  );
  const root = rootSetup.result.status === "ok" ? rootSetup.result.value : null;
  const rootSetupMutations = fakeDom.takeMutationLog();

  const phases = [];
  if (root) {
    for (const phase of currentScenario.phases) {
      fakeDom.takeMutationLog();
      const rootErrorStart = rootErrors.length;
      const captured = captureConsoleCalls(() =>
        captureOperation(`flushSync render ${phase.id}`, () => {
          ReactDOM.flushSync(() => {
            root.render(materializeElementDescriptor(React, phase.root));
          });
        })
      );

      phases.push({
        phaseId: phase.id,
        result: stripOperationValue(captured.result),
        mutations: fakeDom.takeMutationLog(),
        container: fakeDom.dumpNode(container),
        consoleCalls: captured.consoleCalls,
        rootErrors: rootErrors.slice(rootErrorStart)
      });
    }
  }

  return {
    action: "client",
    scenarioId: currentScenario.id,
    targetPackage: "react-dom",
    reactVersion: React.version,
    reactDomVersion: ReactDOM.version,
    fakeDomSubstrate: fakeDom.describeSubstrate(),
    containerCreationMutations,
    rootSetup: {
      result: stripOperationValue(rootSetup.result),
      mutations: rootSetupMutations,
      consoleCalls: rootSetup.consoleCalls,
      rootErrors
    },
    phases
  };
}

function createRootErrorHandlers(rootErrors) {
  return {
    onUncaughtError(error, errorInfo) {
      rootErrors.push({
        channel: "onUncaughtError",
        error: describeThrown(error),
        componentStack: normalizeComponentStack(errorInfo?.componentStack)
      });
    },
    onCaughtError(error, errorInfo) {
      rootErrors.push({
        channel: "onCaughtError",
        error: describeThrown(error),
        componentStack: normalizeComponentStack(errorInfo?.componentStack)
      });
    },
    onRecoverableError(error, errorInfo) {
      rootErrors.push({
        channel: "onRecoverableError",
        error: describeThrown(error),
        componentStack: normalizeComponentStack(errorInfo?.componentStack)
      });
    }
  };
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
    message: error?.message ?? String(error),
    stack: typeof error?.stack === "string" ? error.stack : null
  };
}

function normalizeComponentStack(componentStack) {
  if (typeof componentStack !== "string") {
    return null;
  }
  return componentStack
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function installFakeDom() {
  const mutationLog = [];
  let document = null;

  class FakeNode {
    constructor(ownerDocument) {
      this.ownerDocument = ownerDocument;
      this.parentNode = null;
      this.childNodes = [];
    }

    appendChild(child) {
      mutationLog.push({
        type: "appendChild",
        parent: describeNodeName(this),
        child: describeNodeName(child)
      });
      moveChildIntoParent(child, this, this.childNodes.length);
      markStructuredChildren(this);
      return child;
    }

    insertBefore(child, beforeChild) {
      const beforeIndex = beforeChild ? this.childNodes.indexOf(beforeChild) : -1;
      mutationLog.push({
        type: "insertBefore",
        parent: describeNodeName(this),
        child: describeNodeName(child),
        before: beforeChild ? describeNodeName(beforeChild) : null,
        beforeFound: beforeIndex !== -1
      });
      moveChildIntoParent(
        child,
        this,
        beforeIndex === -1 ? this.childNodes.length : beforeIndex
      );
      markStructuredChildren(this);
      return child;
    }

    removeChild(child) {
      const index = this.childNodes.indexOf(child);
      mutationLog.push({
        type: "removeChild",
        parent: describeNodeName(this),
        child: describeNodeName(child),
        found: index !== -1
      });
      if (index !== -1) {
        this.childNodes.splice(index, 1);
      }
      child.parentNode = null;
      markStructuredChildren(this);
      return child;
    }

    addEventListener() {}

    removeEventListener() {}

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
      return this.childNodes.map((child) => child.textContent).join("");
    }

    set textContent(value) {
      const text = String(value);
      mutationLog.push({
        type: "setTextContent",
        target: describeNodeName(this),
        value: text
      });
      for (const child of this.childNodes) {
        child.parentNode = null;
      }
      this.childNodes = [];
      markStructuredChildren(this);
      if (text !== "") {
        this.appendChild(this.ownerDocument.createTextNode(text));
      }
    }
  }

  class FakeText extends FakeNode {
    constructor(ownerDocument, text) {
      super(ownerDocument);
      this.nodeType = 3;
      this.nodeName = "#text";
      this._nodeValue = String(text);
    }

    get nodeValue() {
      return this._nodeValue;
    }

    set nodeValue(value) {
      const text = String(value);
      mutationLog.push({
        type: "setNodeValue",
        target: "#text",
        value: text
      });
      this._nodeValue = text;
    }

    get data() {
      return this._nodeValue;
    }

    set data(value) {
      this.nodeValue = value;
    }

    get textContent() {
      return this._nodeValue;
    }

    set textContent(value) {
      this.nodeValue = value;
    }
  }

  class FakeStyle {
    constructor(ownerElement) {
      this._ownerElement = ownerElement;
      this._properties = new Map();

      return new Proxy(this, {
        set: (target, property, value, receiver) => {
          if (shouldRecordStyleProperty(property)) {
            const stringValue = String(value);
            target._properties.set(property, stringValue);
            mutationLog.push({
              type: "stylePropertyAssignment",
              target: describeNodeName(ownerElement),
              property,
              value: stringValue
            });
          }
          return Reflect.set(target, property, value, receiver);
        }
      });
    }

    setProperty(name, value) {
      const propertyName = String(name);
      const stringValue = String(value);
      this._properties.set(propertyName, stringValue);
      mutationLog.push({
        type: "styleSetProperty",
        target: describeNodeName(this._ownerElement),
        name: propertyName,
        value: stringValue
      });
    }

    removeProperty(name) {
      const propertyName = String(name);
      const previousValue = this._properties.get(propertyName) ?? "";
      this._properties.delete(propertyName);
      mutationLog.push({
        type: "styleRemoveProperty",
        target: describeNodeName(this._ownerElement),
        name: propertyName,
        previousValue
      });
      return previousValue;
    }

    getPropertyValue(name) {
      return this._properties.get(String(name)) ?? "";
    }
  }

  class FakeElement extends FakeNode {
    constructor(ownerDocument, tagName, namespaceURI) {
      super(ownerDocument);
      const rawName = String(tagName);
      const namespace =
        namespaceURI ?? DOM_TEXT_CONTENT_NAMESPACES.html;
      const htmlElement = namespace === DOM_TEXT_CONTENT_NAMESPACES.html;
      const localName = htmlElement ? rawName.toLowerCase() : rawName;
      this.nodeType = 1;
      this.localName = localName;
      this.tagName = htmlElement ? localName.toUpperCase() : localName;
      this.nodeName = this.tagName;
      this.namespaceURI = namespace;
      this.attributes = new Map();
      this.style = new FakeStyle(this);
      this._assignedInnerHTML = null;
    }

    setAttribute(name, value) {
      const normalizedName = normalizeAttributeName(this, name);
      const stringValue = String(value);
      mutationLog.push({
        type: "setAttribute",
        target: describeNodeName(this),
        name,
        storedName: normalizedName,
        value: stringValue
      });
      this.attributes.set(normalizedName, stringValue);
    }

    setAttributeNS(namespaceURI, name, value) {
      const stringValue = String(value);
      mutationLog.push({
        type: "setAttributeNS",
        target: describeNodeName(this),
        namespaceURI,
        name,
        storedName: name,
        value: stringValue
      });
      this.attributes.set(name, stringValue);
    }

    removeAttribute(name) {
      const normalizedName = normalizeAttributeName(this, name);
      mutationLog.push({
        type: "removeAttribute",
        target: describeNodeName(this),
        name,
        storedName: normalizedName,
        hadAttribute: this.attributes.has(normalizedName)
      });
      this.attributes.delete(normalizedName);
    }

    removeAttributeNS(namespaceURI, name) {
      mutationLog.push({
        type: "removeAttributeNS",
        target: describeNodeName(this),
        namespaceURI,
        name,
        storedName: name,
        hadAttribute: this.attributes.has(name)
      });
      this.attributes.delete(name);
    }

    getAttribute(name) {
      const normalizedName = normalizeAttributeName(this, name);
      return this.attributes.has(normalizedName)
        ? this.attributes.get(normalizedName)
        : null;
    }

    hasAttribute(name) {
      return this.attributes.has(normalizeAttributeName(this, name));
    }

    get innerHTML() {
      if (this._assignedInnerHTML !== null && this.childNodes.length === 0) {
        return this._assignedInnerHTML;
      }
      return this.textContent;
    }

    set innerHTML(value) {
      const html = String(value);
      mutationLog.push({
        type: "setInnerHTML",
        target: describeNodeName(this),
        value: html
      });
      for (const child of this.childNodes) {
        child.parentNode = null;
      }
      this.childNodes = [];
      this._assignedInnerHTML = html;
    }

    get children() {
      return this.childNodes.filter((child) => child.nodeType === 1);
    }

    get firstElementChild() {
      return this.children[0] ?? null;
    }
  }

  class FakeComment extends FakeText {
    constructor(ownerDocument, text) {
      super(ownerDocument, text);
      this.nodeType = 8;
      this.nodeName = "#comment";
    }
  }

  class FakeDocument extends FakeNode {
    constructor() {
      super(null);
      this.ownerDocument = this;
      this.nodeType = 9;
      this.nodeName = "#document";
      this.documentElement = new FakeElement(this, "html");
      this.body = new FakeElement(this, "body");
      this.documentElement.appendChild(this.body);
      this.activeElement = this.body;
      this.implementation = {
        createHTMLDocument: () => new FakeDocument()
      };
    }

    createElement(tagName) {
      mutationLog.push({
        type: "createElement",
        tagName: String(tagName)
      });
      return new FakeElement(this, tagName);
    }

    createElementNS(namespaceURI, tagName) {
      mutationLog.push({
        type: "createElementNS",
        namespaceURI,
        tagName: String(tagName)
      });
      return new FakeElement(this, tagName, namespaceURI);
    }

    createTextNode(text) {
      mutationLog.push({
        type: "createTextNode",
        value: String(text)
      });
      return new FakeText(this, text);
    }

    createComment(text) {
      mutationLog.push({
        type: "createComment",
        value: String(text)
      });
      return new FakeComment(this, text);
    }

    addEventListener() {}

    removeEventListener() {}
  }

  function createContainer(containerDescriptor) {
    return new FakeElement(
      document,
      containerDescriptor.tagName,
      containerDescriptor.namespaceURI
    );
  }

  function shouldRecordStyleProperty(property) {
    if (typeof property !== "string") {
      return false;
    }
    if (property.startsWith("_")) {
      return false;
    }
    return ![
      "setProperty",
      "removeProperty",
      "getPropertyValue"
    ].includes(property);
  }

  function moveChildIntoParent(child, parent, index) {
    if (child.parentNode) {
      const previousIndex = child.parentNode.childNodes.indexOf(child);
      if (previousIndex !== -1) {
        child.parentNode.childNodes.splice(previousIndex, 1);
      }
    }
    child.parentNode = parent;
    parent.childNodes.splice(index, 0, child);
  }

  function markStructuredChildren(node) {
    if (node?.nodeType === 1) {
      node._assignedInnerHTML = null;
    }
  }

  function normalizeAttributeName(element, name) {
    if (element.namespaceURI === DOM_TEXT_CONTENT_NAMESPACES.html) {
      return String(name).toLowerCase();
    }
    return String(name);
  }

  function describeNodeName(node) {
    return node?.nodeName ?? null;
  }

  function dumpNode(node) {
    if (!node) {
      return null;
    }
    if (node.nodeType === 3 || node.nodeType === 8) {
      return {
        nodeType: node.nodeType,
        nodeName: node.nodeName,
        text: node.nodeValue
      };
    }

    const result = {
      nodeType: node.nodeType,
      nodeName: node.nodeName,
      attributes:
        node.attributes instanceof Map
          ? Array.from(node.attributes.entries()).sort(([left], [right]) =>
              left.localeCompare(right)
            )
          : [],
      children: node.childNodes.map(dumpNode),
      textContent: node.textContent
    };

    if (node.nodeType === 1) {
      result.localName = node.localName;
      result.namespaceURI = node.namespaceURI;
      result.assignedInnerHTML = node._assignedInnerHTML;
    }

    return result;
  }

  document = new FakeDocument();
  const window = {
    document,
    Node: FakeNode,
    Element: FakeElement,
    HTMLElement: FakeElement,
    SVGElement: FakeElement,
    HTMLIFrameElement: class HTMLIFrameElement {},
    HTMLInputElement: FakeElement,
    HTMLSelectElement: FakeElement,
    HTMLTextAreaElement: FakeElement,
    Document: FakeDocument,
    DocumentFragment: FakeNode,
    Text: FakeText,
    Comment: FakeComment,
    addEventListener() {},
    removeEventListener() {},
    getComputedStyle() {
      return {};
    }
  };
  document.defaultView = window;

  globalThis.window = window;
  globalThis.document = document;
  globalThis.Node = FakeNode;
  globalThis.Element = FakeElement;
  globalThis.HTMLElement = FakeElement;
  globalThis.SVGElement = FakeElement;
  globalThis.HTMLIFrameElement = window.HTMLIFrameElement;
  globalThis.HTMLInputElement = FakeElement;
  globalThis.HTMLSelectElement = FakeElement;
  globalThis.HTMLTextAreaElement = FakeElement;
  globalThis.Document = FakeDocument;
  globalThis.Text = FakeText;
  globalThis.Comment = FakeComment;
  Object.defineProperty(globalThis, "navigator", {
    value: {
      userAgent: "fast-react-dom-text-content-fake-dom"
    },
    configurable: true
  });

  return {
    document,
    createContainer,
    takeMutationLog() {
      const result = mutationLog.splice(0, mutationLog.length);
      return result;
    },
    dumpNode,
    describeSubstrate() {
      return {
        kind: "deterministic-node-fake-dom",
        browserNativeDom: false,
        records: [
          "element, namespaced element, text, and comment creation",
          "textContent and text node nodeValue writes",
          "innerHTML assignment without parsing",
          "appendChild, insertBefore, and removeChild",
          "setAttribute, setAttributeNS, removeAttribute, and removeAttributeNS"
        ],
        limitations: [
          "no native HTML parser or browser outerHTML serialization",
          "no layout, CSS cascade, selection, focus, or accessibility tree",
          "no custom element lifecycle callbacks",
          "event listener installation is stubbed because event behavior is covered by a separate oracle track"
        ]
      };
    }
  };
}

function describeValue(value) {
  const valueType = typeof value;

  if (value === null) {
    return {
      type: "null"
    };
  }

  if (valueType === "undefined") {
    return {
      type: "undefined"
    };
  }

  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean" ||
    valueType === "bigint"
  ) {
    return {
      type: valueType,
      value: valueType === "bigint" ? value.toString() : value
    };
  }

  if (valueType === "symbol") {
    return {
      type: "symbol",
      description: value.description ?? null,
      stringValue: String(value)
    };
  }

  if (valueType === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length
    };
  }

  if (valueType === "object") {
    const ownKeys = Reflect.ownKeys(value);
    return {
      type: "object",
      objectTag: Object.prototype.toString.call(value),
      isArray: Array.isArray(value),
      ownKeys: ownKeys.map((key) =>
        typeof key === "symbol"
          ? {
              type: "symbol",
              description: key.description ?? null,
              stringValue: String(key)
            }
          : {
              type: "string",
              value: key
            }
      ),
      entries: Object.entries(value).map(([key, child]) => [
        key,
        describeValue(child)
      ])
    };
  }

  return {
    type: valueType
  };
}
