import { createRequire } from "node:module";

import { DOM_CONTROLLED_INPUT_SCENARIOS } from "./dom-controlled-input-scenarios.mjs";

const require = createRequire(import.meta.url);
const action = process.argv[2];
const scenarioId = process.argv[3];

if (!action || !scenarioId) {
  process.stderr.write(
    "Usage: node dom-controlled-input-probe-runner.mjs <server|client> <scenario>\n"
  );
  process.exit(1);
}

const scenario = DOM_CONTROLLED_INPUT_SCENARIOS.find(
  (candidate) => candidate.id === scenarioId
);
if (!scenario) {
  process.stderr.write(`Unknown dom-controlled-input scenario: ${scenarioId}\n`);
  process.exit(1);
}

try {
  if (action === "server") {
    process.stdout.write(JSON.stringify(runServerProbe(scenario)));
    process.exit(0);
  }

  if (action === "client") {
    process.stdout.write(JSON.stringify(runClientProbe(scenario)));
    process.exit(0);
  }

  process.stderr.write(`Unsupported dom-controlled-input probe action: ${action}\n`);
  process.exit(1);
} catch (error) {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exit(1);
}

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
            materializeElement(React, phase.element)
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
  const fakeDom = installControlledInputDom();
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
            root.render(materializeElement(React, phase.element));
          });
          return fakeDom.dumpContainer(container);
        })
      );

      phases.push({
        phaseId: phase.id,
        result: stripOperationValue(captured.result),
        mutations: fakeDom.takeMutationLog(),
        container: fakeDom.dumpContainer(container),
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

function materializeElement(React, descriptor) {
  if (descriptor.type !== "element") {
    return materializeValue(descriptor);
  }

  const props = materializeProps(descriptor.props);
  const children = descriptor.children.map((child) =>
    child.type === "element"
      ? materializeElement(React, child)
      : materializeValue(child)
  );

  return React.createElement(descriptor.elementType, props, ...children);
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
    case "array":
      return descriptor.items.map(materializeValue);
    case "function":
      return function domControlledInputNoop() {};
    default:
      throw new Error(`Unsupported descriptor type: ${descriptor.type}`);
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
    message: error?.message ?? String(error),
    stack: typeof error?.stack === "string" ? error.stack : null
  };
}

function installControlledInputDom() {
  const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  const mutationLog = [];
  let nextNodeId = 1;

  class NodeBase {
    constructor(ownerDocument) {
      this.__domControlledInputNodeId = nextNodeId;
      nextNodeId += 1;
      this.ownerDocument = ownerDocument;
      this.parentNode = null;
      this.childNodes = [];
    }

    appendChild(child) {
      return this.insertBefore(child, null);
    }

    insertBefore(child, beforeChild) {
      mutationLog.push({
        type: "insertBefore",
        parent: describeNodeName(this),
        child: describeNodeName(child),
        before: beforeChild ? describeNodeName(beforeChild) : null
      });

      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }

      const index =
        beforeChild === null || beforeChild === undefined
          ? -1
          : this.childNodes.indexOf(beforeChild);
      if (index === -1) {
        this.childNodes.push(child);
      } else {
        this.childNodes.splice(index, 0, child);
      }
      child.parentNode = this;
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
      if (index === -1) {
        throw new Error("removeChild target is not a child of this node");
      }
      this.childNodes.splice(index, 1);
      child.parentNode = null;
      return child;
    }

    contains(candidate) {
      let current = candidate;
      while (current) {
        if (current === this) {
          return true;
        }
        current = current.parentNode;
      }
      return false;
    }

    addEventListener() {}

    removeEventListener() {}

    get firstChild() {
      return this.childNodes[0] ?? null;
    }

    get lastChild() {
      return this.childNodes[this.childNodes.length - 1] ?? null;
    }

    get previousSibling() {
      if (!this.parentNode) {
        return null;
      }
      const index = this.parentNode.childNodes.indexOf(this);
      return index > 0 ? this.parentNode.childNodes[index - 1] : null;
    }

    get nextSibling() {
      if (!this.parentNode) {
        return null;
      }
      const index = this.parentNode.childNodes.indexOf(this);
      return index === -1 ? null : this.parentNode.childNodes[index + 1] ?? null;
    }

    get parentElement() {
      return this.parentNode?.nodeType === 1 ? this.parentNode : null;
    }

    get textContent() {
      return this.childNodes
        .map((child) => child.textContent ?? child.nodeValue ?? "")
        .join("");
    }

    set textContent(value) {
      const stringValue = String(value);
      mutationLog.push({
        type: "setTextContent",
        target: describeNodeName(this),
        value: stringValue
      });
      for (const child of this.childNodes) {
        child.parentNode = null;
      }
      this.childNodes = [];
      if (stringValue !== "") {
        this.appendChild(this.ownerDocument.createTextNode(stringValue));
      }
    }
  }

  NodeBase.ELEMENT_NODE = 1;
  NodeBase.TEXT_NODE = 3;
  NodeBase.COMMENT_NODE = 8;
  NodeBase.DOCUMENT_NODE = 9;

  class ElementNode extends NodeBase {
    constructor(tagName, ownerDocument, namespaceURI) {
      super(ownerDocument);
      this.nodeType = 1;
      this.localName = String(tagName).toLowerCase();
      this.nodeName = this.localName.toUpperCase();
      this.tagName = this.nodeName;
      this.namespaceURI = namespaceURI ?? HTML_NAMESPACE;
      this.attributes = new Map();
      this.style = {};
      this._propertyWrites = [];
    }

    setAttribute(name, value) {
      const storedName = normalizeAttributeName(this, name);
      const stringValue = String(value);
      mutationLog.push({
        type: "setAttribute",
        target: describeNodeName(this),
        name,
        storedName,
        value: stringValue
      });
      this.attributes.set(storedName, stringValue);
      this.reflectAttributeWrite(storedName, stringValue);
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

    getAttribute(name) {
      const storedName = normalizeAttributeName(this, name);
      return this.attributes.has(storedName) ? this.attributes.get(storedName) : null;
    }

    removeAttribute(name) {
      const storedName = normalizeAttributeName(this, name);
      mutationLog.push({
        type: "removeAttribute",
        target: describeNodeName(this),
        name,
        storedName,
        hadAttribute: this.attributes.has(storedName)
      });
      this.attributes.delete(storedName);
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

    hasAttribute(name) {
      return this.attributes.has(normalizeAttributeName(this, name));
    }

    reflectAttributeWrite() {}
  }

  class InputElement extends ElementNode {
    constructor(ownerDocument) {
      super("input", ownerDocument);
      this._type = "text";
      this._value = "";
      this._defaultValue = "";
      this._checked = false;
      this._defaultChecked = false;
      this._dirtyValue = false;
      this._dirtyChecked = false;
    }

    reflectAttributeWrite(name, value) {
      if (name === "type") {
        this._type = value;
      } else if (name === "value") {
        this._defaultValue = value;
        if (!this._dirtyValue) {
          this._value = value;
        }
      } else if (name === "checked") {
        this._defaultChecked = true;
        if (!this._dirtyChecked) {
          this._checked = true;
        }
      }
    }

    get type() {
      return this._type;
    }

    set type(value) {
      setTrackedProperty(this, "type", String(value));
    }

    get value() {
      return this._value;
    }

    set value(value) {
      this._dirtyValue = true;
      setTrackedProperty(this, "value", String(value));
    }

    get defaultValue() {
      return this._defaultValue;
    }

    set defaultValue(value) {
      const stringValue = String(value);
      setTrackedProperty(this, "defaultValue", stringValue);
      if (!this._dirtyValue) {
        this._value = stringValue;
      }
    }

    get checked() {
      return this._checked;
    }

    set checked(value) {
      this._dirtyChecked = true;
      setTrackedProperty(this, "checked", Boolean(value));
    }

    get defaultChecked() {
      return this._defaultChecked;
    }

    set defaultChecked(value) {
      const booleanValue = Boolean(value);
      setTrackedProperty(this, "defaultChecked", booleanValue);
      if (!this._dirtyChecked) {
        this._checked = booleanValue;
      }
    }
  }

  class TextAreaElement extends ElementNode {
    constructor(ownerDocument) {
      super("textarea", ownerDocument);
      this._value = "";
      this._defaultValue = "";
      this._dirtyValue = false;
    }

    get value() {
      return this._value;
    }

    set value(value) {
      this._dirtyValue = true;
      setTrackedProperty(this, "value", String(value));
    }

    get defaultValue() {
      return this._defaultValue;
    }

    set defaultValue(value) {
      const stringValue = String(value);
      const shouldSyncCurrentValue = !this._dirtyValue;
      setTrackedProperty(this, "defaultValue", stringValue);
      replaceChildrenWithTextSilently(this, stringValue);
      if (shouldSyncCurrentValue) {
        this._value = stringValue;
      }
    }
  }

  class SelectElement extends ElementNode {
    constructor(ownerDocument) {
      super("select", ownerDocument);
      this._multiple = false;
    }

    get multiple() {
      return this._multiple;
    }

    set multiple(value) {
      setTrackedProperty(this, "multiple", Boolean(value));
    }

    get options() {
      return collectOptions(this);
    }

    get selectedIndex() {
      return this.options.findIndex((optionNode) => optionNode.selected);
    }

    set selectedIndex(value) {
      const selectedIndex = Number(value);
      this.options.forEach((optionNode, index) => {
        optionNode.selected = index === selectedIndex;
      });
    }

    get value() {
      return this.options.find((optionNode) => optionNode.selected)?.value ?? "";
    }

    set value(value) {
      const stringValue = String(value);
      for (const optionNode of this.options) {
        optionNode.selected = optionNode.value === stringValue;
      }
    }
  }

  class OptionElement extends ElementNode {
    constructor(ownerDocument) {
      super("option", ownerDocument);
      this._selected = false;
      this._defaultSelected = false;
      this._dirtySelected = false;
    }

    reflectAttributeWrite(name, value) {
      if (name === "selected") {
        this._defaultSelected = true;
        if (!this._dirtySelected) {
          this._selected = true;
        }
      } else if (name === "value") {
        this.attributes.set("value", value);
      }
    }

    get value() {
      return this.getAttribute("value") ?? this.textContent;
    }

    set value(value) {
      setTrackedProperty(this, "value", String(value));
      this.attributes.set("value", String(value));
    }

    get selected() {
      return this._selected;
    }

    set selected(value) {
      const booleanValue = Boolean(value);
      this._dirtySelected = true;
      setTrackedProperty(this, "selected", booleanValue);
      if (booleanValue) {
        const selectNode = findOwningSelect(this);
        if (selectNode && !selectNode.multiple) {
          for (const optionNode of collectOptions(selectNode)) {
            if (optionNode !== this) {
              optionNode._selected = false;
            }
          }
        }
      }
    }

    get defaultSelected() {
      return this._defaultSelected;
    }

    set defaultSelected(value) {
      const booleanValue = Boolean(value);
      setTrackedProperty(this, "defaultSelected", booleanValue);
      if (!this._dirtySelected) {
        this._selected = booleanValue;
      }
    }
  }

  class TextNode extends NodeBase {
    constructor(text, ownerDocument) {
      super(ownerDocument);
      this.nodeType = 3;
      this.nodeName = "#text";
      this._nodeValue = String(text);
    }

    get nodeValue() {
      return this._nodeValue;
    }

    set nodeValue(value) {
      const stringValue = String(value);
      mutationLog.push({
        type: "setNodeValue",
        target: "#text",
        value: stringValue
      });
      this._nodeValue = stringValue;
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

  class CommentNode extends TextNode {
    constructor(text, ownerDocument) {
      super(text, ownerDocument);
      this.nodeType = 8;
      this.nodeName = "#comment";
    }
  }

  class DocumentNode extends NodeBase {
    constructor() {
      super(null);
      this.nodeType = 9;
      this.nodeName = "#document";
      this.ownerDocument = this;
      this.defaultView = null;
      this.documentElement = new ElementNode("html", this);
      this.body = new ElementNode("body", this);
      this.documentElement.appendChild(this.body);
      this.activeElement = this.body;
    }

    createElement(tagName) {
      const localName = String(tagName).toLowerCase();
      mutationLog.push({
        type: "createElement",
        tagName: localName
      });
      if (localName === "input") {
        return new InputElement(this);
      }
      if (localName === "select") {
        return new SelectElement(this);
      }
      if (localName === "textarea") {
        return new TextAreaElement(this);
      }
      if (localName === "option") {
        return new OptionElement(this);
      }
      return new ElementNode(localName, this);
    }

    createElementNS(namespaceURI, tagName) {
      mutationLog.push({
        type: "createElementNS",
        namespaceURI,
        tagName: String(tagName)
      });
      return new ElementNode(tagName, this, namespaceURI);
    }

    createTextNode(text) {
      mutationLog.push({
        type: "createTextNode",
        value: String(text)
      });
      return new TextNode(text, this);
    }

    createComment(text) {
      mutationLog.push({
        type: "createComment",
        value: String(text)
      });
      return new CommentNode(text, this);
    }
  }

  function setTrackedProperty(node, property, value) {
    const slot = `_${property}`;
    const normalizedValue =
      typeof value === "boolean" ? value : value === undefined ? "" : value;
    node[slot] = normalizedValue;
    const entry = {
      property,
      value: describeValue(normalizedValue)
    };
    node._propertyWrites.push(entry);
    mutationLog.push({
      type: "setProperty",
      target: describeNodeName(node),
      property,
      value: describeValue(normalizedValue)
    });
  }

  function collectOptions(node) {
    const options = [];
    for (const child of node.childNodes) {
      if (child.nodeType === 1 && child.localName === "option") {
        options.push(child);
      }
      if (child.childNodes?.length) {
        options.push(...collectOptions(child));
      }
    }
    return options;
  }

  function findOwningSelect(node) {
    let current = node.parentNode;
    while (current) {
      if (current.nodeType === 1 && current.localName === "select") {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function replaceChildrenWithTextSilently(node, value) {
    for (const child of node.childNodes) {
      child.parentNode = null;
    }
    node.childNodes = [];

    if (value === "") {
      return;
    }

    const textNode = new TextNode(value, node.ownerDocument);
    textNode.parentNode = node;
    node.childNodes = [textNode];
  }

  function normalizeAttributeName(elementNode, name) {
    if (elementNode.namespaceURI === HTML_NAMESPACE) {
      return String(name).toLowerCase();
    }
    return String(name);
  }

  function describeNodeName(node) {
    return node?.nodeName ?? null;
  }

  function dumpContainer(container) {
    return {
      childCount: container.childNodes.length,
      children: container.childNodes.map(dumpNode)
    };
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
      propertyWrites: Array.isArray(node._propertyWrites)
        ? node._propertyWrites
        : [],
      children: node.childNodes.map(dumpNode)
    };

    if (node.nodeType === 1) {
      result.localName = node.localName;
      result.namespaceURI = node.namespaceURI;
      result.formState = describeFormState(node);
    }

    return result;
  }

  function describeFormState(node) {
    if (node.localName === "input") {
      return {
        type: node.type,
        value: node.value,
        defaultValue: node.defaultValue,
        checked: node.checked,
        defaultChecked: node.defaultChecked
      };
    }

    if (node.localName === "textarea") {
      return {
        value: node.value,
        defaultValue: node.defaultValue,
        textContent: node.textContent
      };
    }

    if (node.localName === "select") {
      return {
        multiple: node.multiple,
        value: node.value,
        selectedIndex: node.selectedIndex,
        options: node.options.map((optionNode, index) => ({
          index,
          value: optionNode.value,
          selected: optionNode.selected,
          defaultSelected: optionNode.defaultSelected,
          textContent: optionNode.textContent
        }))
      };
    }

    if (node.localName === "option") {
      return {
        value: node.value,
        selected: node.selected,
        defaultSelected: node.defaultSelected,
        textContent: node.textContent
      };
    }

    return null;
  }

  const document = new DocumentNode();
  const window = {
    document,
    navigator: {
      userAgent: "fast-react-dom-controlled-input-probe"
    },
    Node: NodeBase,
    Element: ElementNode,
    HTMLElement: ElementNode,
    HTMLInputElement: InputElement,
    HTMLSelectElement: SelectElement,
    HTMLTextAreaElement: TextAreaElement,
    HTMLOptionElement: OptionElement,
    HTMLIFrameElement: ElementNode,
    SVGElement: ElementNode,
    Document: DocumentNode,
    Text: TextNode,
    Comment: CommentNode,
    addEventListener() {},
    removeEventListener() {},
    getComputedStyle() {
      return {};
    },
    getSelection() {
      return null;
    }
  };
  document.defaultView = window;

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
      value: NodeBase,
      writable: true
    },
    Element: {
      configurable: true,
      value: ElementNode,
      writable: true
    },
    HTMLElement: {
      configurable: true,
      value: ElementNode,
      writable: true
    },
    HTMLInputElement: {
      configurable: true,
      value: InputElement,
      writable: true
    },
    HTMLSelectElement: {
      configurable: true,
      value: SelectElement,
      writable: true
    },
    HTMLTextAreaElement: {
      configurable: true,
      value: TextAreaElement,
      writable: true
    },
    HTMLOptionElement: {
      configurable: true,
      value: OptionElement,
      writable: true
    },
    HTMLIFrameElement: {
      configurable: true,
      value: ElementNode,
      writable: true
    },
    SVGElement: {
      configurable: true,
      value: ElementNode,
      writable: true
    },
    Document: {
      configurable: true,
      value: DocumentNode,
      writable: true
    },
    Text: {
      configurable: true,
      value: TextNode,
      writable: true
    },
    Comment: {
      configurable: true,
      value: CommentNode,
      writable: true
    }
  });

  return {
    document,
    takeMutationLog() {
      return mutationLog.splice(0, mutationLog.length);
    },
    dumpContainer,
    describeSubstrate() {
      return {
        kind: "deterministic-node-controlled-form-fake-dom",
        browserNativeDom: false,
        records: [
          "input value/defaultValue/checked/defaultChecked property writes",
          "select multiple and option selected/defaultSelected property writes",
          "textarea value/defaultValue property writes",
          "setAttribute and removeAttribute",
          "textContent and text node value writes",
          "appendChild, insertBefore, and removeChild through child order snapshots"
        ],
        limitations: [
          "no native browser value sanitization by input type",
          "no real selection range, focus, form reset, or autofill behavior",
          "no event dispatch semantics beyond React listener installation stubs",
          "no HTML parser, layout, CSSOM, accessibility tree, or hydration behavior"
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

  if (value instanceof Error) {
    return {
      type: "error",
      error: describeThrown(value)
    };
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      items: value.map(describeValue)
    };
  }

  if (valueType === "object") {
    const ownKeys = Reflect.ownKeys(value);
    return {
      type: "object",
      objectTag: Object.prototype.toString.call(value),
      isArray: false,
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
