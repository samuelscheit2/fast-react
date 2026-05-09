import { createRequire } from "node:module";

import {
  buildDomNamespaceSvgScenarioElement,
  findDomNamespaceSvgClientScenario,
  findDomNamespaceSvgServerScenario
} from "./dom-namespace-svg-scenarios.mjs";
import { DOM_NAMESPACE_SVG_NAMESPACES } from "./dom-namespace-svg-targets.mjs";

const require = createRequire(import.meta.url);
const action = process.argv[2];
const scenarioId = process.argv[3];

if (!action || !scenarioId) {
  process.stderr.write(
    "Usage: node dom-namespace-svg-probe-runner.mjs <server|client> <scenario-id>\n"
  );
  process.exit(1);
}

try {
  if (action === "server") {
    process.stdout.write(JSON.stringify(runServerProbe(scenarioId)));
    process.exit(0);
  }

  if (action === "client") {
    process.stdout.write(JSON.stringify(runClientProbe(scenarioId)));
    process.exit(0);
  }
} catch (error) {
  process.stdout.write(
    JSON.stringify({
      status: "throws",
      action,
      scenarioId,
      thrown: describeThrown(error)
    })
  );
  process.exit(0);
}

process.stderr.write(`Unsupported dom-namespace-svg probe action: ${action}\n`);
process.exit(1);

function runServerProbe(currentScenarioId) {
  const scenario = findDomNamespaceSvgServerScenario(currentScenarioId);
  const React = require("react");
  const ReactDOMServer = require("react-dom/server");
  const consoleMessages = captureConsole(() => {
    const element = buildDomNamespaceSvgScenarioElement(
      React,
      currentScenarioId
    );
    return {
      renderToStaticMarkup:
        ReactDOMServer.renderToStaticMarkup(element),
      renderToString: ReactDOMServer.renderToString(element)
    };
  });

  return {
    status: "ok",
    action: "server",
    scenarioId: currentScenarioId,
    scenario,
    nodeEnv: process.env.NODE_ENV ?? null,
    console: consoleMessages.messages,
    renderers: consoleMessages.value
  };
}

function runClientProbe(currentScenarioId) {
  const scenario = findDomNamespaceSvgClientScenario(currentScenarioId);
  const fakeDom = installFakeDom();
  const React = require("react");
  const ReactDOM = require("react-dom");
  const ReactDOMClient = require("react-dom/client");

  const consoleMessages = captureConsole(() => {
    const container = fakeDom.createContainer(scenario.container);
    const root = ReactDOMClient.createRoot(container);
    const element = buildDomNamespaceSvgScenarioElement(
      React,
      currentScenarioId
    );

    ReactDOM.flushSync(() => {
      root.render(element);
    });

    return {
      container: summarizeNode(container),
      operations: fakeDom.operations
    };
  });

  return {
    status: "ok",
    action: "client",
    scenarioId: currentScenarioId,
    scenario,
    nodeEnv: process.env.NODE_ENV ?? null,
    hostEnvironment: {
      kind: "deterministic-fake-dom",
      recordsEventListeners: false,
      recordsLayout: false,
      recordsParserBehavior: false
    },
    console: consoleMessages.messages,
    output: consoleMessages.value
  };
}

function captureConsole(callback) {
  const messages = [];
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    messages.push({
      channel: "error",
      args: args.map(describeConsoleValue)
    });
  };
  console.warn = (...args) => {
    messages.push({
      channel: "warn",
      args: args.map(describeConsoleValue)
    });
  };

  try {
    const value = callback();
    return {
      messages,
      value
    };
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
}

function describeConsoleValue(value) {
  if (value instanceof Error) {
    return describeThrown(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }

  return String(value);
}

function installFakeDom() {
  const operations = [];
  let nodeId = 0;

  class FakeNode {
    constructor({ nodeName, nodeType, namespaceURI, ownerDocument }) {
      this.__fakeNodeId = ++nodeId;
      this.nodeType = nodeType;
      this.nodeName = nodeName;
      this.tagName = nodeType === 1 ? nodeName : undefined;
      this.namespaceURI = namespaceURI;
      this.ownerDocument = ownerDocument;
      this.parentNode = null;
      this.childNodes = [];
      this.attributes = [];
      this.style = {};
      this._attributesByName = new Map();
      this._textContent = null;
    }

    appendChild(child) {
      operations.push({
        type: "appendChild",
        parentNodeName: this.nodeName,
        childNodeName: child.nodeName
      });
      attachChild(this, child, null);
      return child;
    }

    insertBefore(child, beforeChild) {
      operations.push({
        type: "insertBefore",
        parentNodeName: this.nodeName,
        childNodeName: child.nodeName,
        beforeNodeName: beforeChild?.nodeName ?? null
      });
      attachChild(this, child, beforeChild ?? null);
      return child;
    }

    removeChild(child) {
      operations.push({
        type: "removeChild",
        parentNodeName: this.nodeName,
        childNodeName: child.nodeName
      });
      detachChild(this, child);
      return child;
    }

    setAttribute(name, value) {
      operations.push({
        type: "setAttribute",
        targetNodeName: this.nodeName,
        name,
        value: String(value)
      });
      setAttributeRecord(this, null, name, String(value));
    }

    setAttributeNS(namespaceURI, qualifiedName, value) {
      operations.push({
        type: "setAttributeNS",
        targetNodeName: this.nodeName,
        namespaceURI,
        name: qualifiedName,
        value: String(value)
      });
      setAttributeRecord(this, namespaceURI, qualifiedName, String(value));
    }

    removeAttribute(name) {
      operations.push({
        type: "removeAttribute",
        targetNodeName: this.nodeName,
        name
      });
      this._attributesByName.delete(name);
      this.attributes = [...this._attributesByName.values()];
    }

    removeAttributeNS(namespaceURI, localName) {
      operations.push({
        type: "removeAttributeNS",
        targetNodeName: this.nodeName,
        namespaceURI,
        name: localName
      });
      for (const [key, value] of this._attributesByName) {
        if (value.namespaceURI === namespaceURI && value.localName === localName) {
          this._attributesByName.delete(key);
        }
      }
      this.attributes = [...this._attributesByName.values()];
    }

    addEventListener() {}

    removeEventListener() {}

    contains(candidate) {
      if (candidate === this) {
        return true;
      }
      return this.childNodes.some((child) => child.contains?.(candidate));
    }

    get firstChild() {
      return this.childNodes[0] ?? null;
    }

    get lastChild() {
      return this.childNodes[this.childNodes.length - 1] ?? null;
    }

    set textContent(value) {
      operations.push({
        type: "setTextContent",
        targetNodeName: this.nodeName,
        value: String(value)
      });
      for (const child of this.childNodes) {
        child.parentNode = null;
      }
      this.childNodes = [];
      this._textContent = String(value);
    }

    get textContent() {
      if (this._textContent !== null) {
        return this._textContent;
      }
      return this.childNodes.map((child) => child.textContent).join("");
    }
  }

  class FakeText extends FakeNode {
    constructor(text, ownerDocument) {
      super({
        nodeName: "#text",
        nodeType: 3,
        namespaceURI: null,
        ownerDocument
      });
      this._textContent = String(text);
      this.data = String(text);
      this.nodeValue = String(text);
    }
  }

  class FakeComment extends FakeNode {
    constructor(text, ownerDocument) {
      super({
        nodeName: "#comment",
        nodeType: 8,
        namespaceURI: null,
        ownerDocument
      });
      this._textContent = String(text);
      this.data = String(text);
      this.nodeValue = String(text);
    }
  }

  class FakeDocument {
    constructor() {
      this.nodeType = 9;
      this.nodeName = "#document";
      this.namespaceURI = null;
      this.ownerDocument = this;
      this.defaultView = globalThis;
      this.documentElement = new FakeNode({
        nodeName: "HTML",
        nodeType: 1,
        namespaceURI: DOM_NAMESPACE_SVG_NAMESPACES.html,
        ownerDocument: this
      });
      this.body = new FakeNode({
        nodeName: "BODY",
        nodeType: 1,
        namespaceURI: DOM_NAMESPACE_SVG_NAMESPACES.html,
        ownerDocument: this
      });
      this.activeElement = this.body;
    }

    createElement(name) {
      operations.push({
        type: "createElement",
        name
      });
      return new FakeNode({
        nodeName: name.toUpperCase(),
        nodeType: 1,
        namespaceURI: DOM_NAMESPACE_SVG_NAMESPACES.html,
        ownerDocument: this
      });
    }

    createElementNS(namespaceURI, qualifiedName) {
      operations.push({
        type: "createElementNS",
        namespaceURI,
        name: qualifiedName
      });
      return new FakeNode({
        nodeName: qualifiedName,
        nodeType: 1,
        namespaceURI,
        ownerDocument: this
      });
    }

    createTextNode(text) {
      operations.push({
        type: "createTextNode",
        value: String(text)
      });
      return new FakeText(String(text), this);
    }

    createComment(text) {
      operations.push({
        type: "createComment",
        value: String(text)
      });
      return new FakeComment(String(text), this);
    }

    addEventListener() {}

    removeEventListener() {}
  }

  function attachChild(parent, child, beforeChild) {
    if (child.parentNode) {
      detachChild(child.parentNode, child);
    }

    const insertIndex =
      beforeChild === null ? -1 : parent.childNodes.indexOf(beforeChild);
    if (insertIndex === -1) {
      parent.childNodes.push(child);
    } else {
      parent.childNodes.splice(insertIndex, 0, child);
    }
    child.parentNode = parent;
    parent._textContent = null;
  }

  function detachChild(parent, child) {
    const index = parent.childNodes.indexOf(child);
    if (index !== -1) {
      parent.childNodes.splice(index, 1);
    }
    child.parentNode = null;
  }

  function setAttributeRecord(node, namespaceURI, qualifiedName, value) {
    const localName = qualifiedName.includes(":")
      ? qualifiedName.slice(qualifiedName.indexOf(":") + 1)
      : qualifiedName;
    node._attributesByName.set(qualifiedName, {
      name: qualifiedName,
      localName,
      namespaceURI,
      value
    });
    node.attributes = [...node._attributesByName.values()];
  }

  const document = new FakeDocument();
  Object.assign(globalThis, {
    window: globalThis,
    document,
    Node: FakeNode,
    Element: FakeNode,
    HTMLElement: FakeNode,
    SVGElement: FakeNode,
    Text: FakeText,
    Comment: FakeComment,
    Document: FakeDocument,
    DocumentFragment: FakeNode,
    HTMLIFrameElement: function HTMLIFrameElement() {}
  });
  globalThis.addEventListener = globalThis.addEventListener ?? (() => {});
  globalThis.removeEventListener = globalThis.removeEventListener ?? (() => {});

  return {
    operations,
    createContainer({ nodeName, namespaceURI }) {
      return new FakeNode({
        nodeName,
        nodeType: 1,
        namespaceURI,
        ownerDocument: document
      });
    }
  };
}

function summarizeNode(node) {
  const summary = {
    nodeType: node.nodeType,
    nodeName: node.nodeName,
    namespaceURI: node.namespaceURI ?? null
  };

  if (node.attributes?.length) {
    summary.attributes = node.attributes.map((attribute) => ({
      name: attribute.name,
      localName: attribute.localName,
      namespaceURI: attribute.namespaceURI,
      value: attribute.value
    }));
  } else {
    summary.attributes = [];
  }

  if (node._textContent !== null) {
    summary.textContent = node._textContent;
  }

  summary.children = node.childNodes.map(summarizeNode);
  return summary;
}

function describeThrown(error) {
  return {
    name: error?.name ?? null,
    message: error?.message ?? String(error),
    code: error?.code ?? null,
    stack: typeof error?.stack === "string" ? error.stack : null
  };
}
