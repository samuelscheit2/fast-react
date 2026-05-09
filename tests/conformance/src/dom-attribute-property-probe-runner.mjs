import { createRequire } from "node:module";

import { DOM_ATTRIBUTE_PROPERTY_SCENARIOS } from "./dom-attribute-property-scenarios.mjs";

const require = createRequire(import.meta.url);
const action = process.argv[2];
const scenarioId = process.argv[3];

if (!action || !scenarioId) {
  process.stderr.write(
    "Usage: node dom-attribute-property-probe-runner.mjs <server|client> <scenario>\n"
  );
  process.exit(1);
}

const scenario = DOM_ATTRIBUTE_PROPERTY_SCENARIOS.find(
  (candidate) => candidate.id === scenarioId
);
if (!scenario) {
  process.stderr.write(`Unknown dom-attribute-property scenario: ${scenarioId}\n`);
  process.exit(1);
}

if (action === "server") {
  process.stdout.write(JSON.stringify(runServerProbe(scenario)));
  process.exit(0);
}

if (action === "client") {
  process.stdout.write(JSON.stringify(runClientProbe(scenario)));
  process.exit(0);
}

process.stderr.write(`Unsupported dom-attribute-property probe action: ${action}\n`);
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
            React.createElement(
              currentScenario.elementType,
              materializeProps(phase.props)
            )
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
  const container = fakeDom.document.createElement("div");
  fakeDom.takeMutationLog();

  const rootSetup = captureConsoleCalls(() =>
    captureOperation("createRoot", () => ReactDOMClient.createRoot(container))
  );
  const root = rootSetup.result.status === "ok" ? rootSetup.result.value : null;
  const rootSetupMutations = fakeDom.takeMutationLog();

  const phases = [];
  if (root) {
    for (const phase of currentScenario.phases) {
      fakeDom.takeMutationLog();
      const captured = captureConsoleCalls(() =>
        captureOperation(`flushSync render ${phase.id}`, () => {
          ReactDOM.flushSync(() => {
            root.render(
              React.createElement(
                currentScenario.elementType,
                materializeProps(phase.props)
              )
            );
          });
        })
      );

      phases.push({
        phaseId: phase.id,
        result: stripOperationValue(captured.result),
        mutations: fakeDom.takeMutationLog(),
        container: fakeDom.dumpNode(container),
        consoleCalls: captured.consoleCalls
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
    rootSetup: {
      result: stripOperationValue(rootSetup.result),
      mutations: rootSetupMutations,
      consoleCalls: rootSetup.consoleCalls
    },
    phases
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

function materializeProps(entries) {
  const props = {};
  for (const [key, valueDescriptor] of entries) {
    props[key] = materializeValue(valueDescriptor);
  }
  return props;
}

function materializeValue(descriptor) {
  switch (descriptor.type) {
    case "string":
    case "number":
    case "boolean":
      return descriptor.value;
    case "null":
      return null;
    case "undefined":
      return undefined;
    case "object":
      return Object.fromEntries(
        descriptor.entries.map(([key, value]) => [key, materializeValue(value)])
      );
    default:
      throw new Error(`Unsupported value descriptor type: ${descriptor.type}`);
  }
}

function installFakeDom() {
  const mutationLog = [];
  let document = null;

  const ignoredPropertyNames = new Set([
    "attributes",
    "childNodes",
    "data",
    "defaultValue",
    "documentElement",
    "firstChild",
    "lastChild",
    "localName",
    "namespaceURI",
    "nodeName",
    "nodeType",
    "nodeValue",
    "ownerDocument",
    "parentNode",
    "style",
    "tagName",
    "textContent"
  ]);

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
      return child;
    }

    insertBefore(child, beforeChild) {
      const beforeIndex = beforeChild ? this.childNodes.indexOf(beforeChild) : -1;
      mutationLog.push({
        type: "insertBefore",
        parent: describeNodeName(this),
        child: describeNodeName(child),
        before: beforeChild ? describeNodeName(beforeChild) : null
      });
      moveChildIntoParent(
        child,
        this,
        beforeIndex === -1 ? this.childNodes.length : beforeIndex
      );
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
      return child;
    }

    addEventListener() {}

    removeEventListener() {}

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

  class FakeElement extends FakeNode {
    constructor(ownerDocument, tagName, namespaceURI) {
      super(ownerDocument);
      const localName = String(tagName).toLowerCase();
      this.nodeType = 1;
      this.localName = localName;
      this.tagName = localName.toUpperCase();
      this.nodeName = this.tagName;
      this.namespaceURI = namespaceURI ?? "http://www.w3.org/1999/xhtml";
      this.attributes = new Map();
      this.style = {};
      this._propertyWrites = new Map();

      if (localName.includes("-")) {
        this.objectProp = null;
        this.boolProp = null;
        this.falseProp = null;
      }

      return new Proxy(this, {
        set: (target, property, value, receiver) => {
          if (shouldRecordPropertyWrite(property)) {
            target._propertyWrites.set(property, describeValue(value));
            mutationLog.push({
              type: "setProperty",
              target: describeNodeName(target),
              property,
              value: describeValue(value)
            });
          }
          return Reflect.set(target, property, value, receiver);
        }
      });
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
  }

  function shouldRecordPropertyWrite(property) {
    if (typeof property !== "string") {
      return false;
    }
    if (property.startsWith("__react") || property.startsWith("_react")) {
      return false;
    }
    if (property.startsWith("_")) {
      return false;
    }
    return !ignoredPropertyNames.has(property);
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

  function normalizeAttributeName(element, name) {
    if (element.namespaceURI === "http://www.w3.org/1999/xhtml") {
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
      propertyWrites:
        node._propertyWrites instanceof Map
          ? Array.from(node._propertyWrites.entries()).sort(([left], [right]) =>
              left.localeCompare(right)
            )
          : [],
      children: node.childNodes.map(dumpNode)
    };

    if (node.nodeType === 1) {
      result.localName = node.localName;
      result.namespaceURI = node.namespaceURI;
    }

    return result;
  }

  document = new FakeDocument();
  const window = {
    document,
    Node: FakeNode,
    Element: FakeElement,
    HTMLElement: FakeElement,
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
  globalThis.HTMLIFrameElement = window.HTMLIFrameElement;
  globalThis.HTMLInputElement = FakeElement;
  globalThis.HTMLSelectElement = FakeElement;
  globalThis.HTMLTextAreaElement = FakeElement;
  globalThis.Document = FakeDocument;
  globalThis.Text = FakeText;
  globalThis.Comment = FakeComment;
  Object.defineProperty(globalThis, "navigator", {
    value: {
      userAgent: "fast-react-deterministic-fake-dom"
    },
    configurable: true
  });

  return {
    document,
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
          "element and text creation",
          "setAttribute and removeAttribute",
          "setAttributeNS and removeAttributeNS",
          "selected property assignments",
          "textContent and text node value writes",
          "appendChild, insertBefore, and removeChild"
        ],
        limitations: [
          "no HTML parser or real browser outerHTML serialization",
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
