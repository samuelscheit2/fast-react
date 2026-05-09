import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const scenarios = {
  "nested-host-callback-ref-mount-unmount": (runtime) => {
    const context = createScenarioContext(runtime);
    const parentRef = context.callbackRef("parent");
    const childRef = context.callbackRef("child");
    const h = runtime.React.createElement;

    const operations = [
      context.flush("mount", () =>
        context.root.render(
          h(
            "section",
            { ref: parentRef },
            h("div", { ref: childRef, "data-role": "child" })
          )
        )
      ),
      context.flush("unmount", () => context.root.unmount())
    ];

    return context.finish(operations);
  },

  "stable-callback-ref-update": (runtime) => {
    const context = createScenarioContext(runtime);
    const ref = context.callbackRef("stable");
    const h = runtime.React.createElement;

    const operations = [
      context.flush("mount", () =>
        context.root.render(h("div", { ref, "data-value": "one" }, "one"))
      ),
      context.flush("update", () =>
        context.root.render(h("div", { ref, "data-value": "two" }, "two"))
      ),
      context.flush("unmount", () => context.root.unmount())
    ];

    return context.finish(operations);
  },

  "callback-ref-identity-update": (runtime) => {
    const context = createScenarioContext(runtime);
    const firstRef = context.callbackRef("first");
    const secondRef = context.callbackRef("second");
    const h = runtime.React.createElement;

    const operations = [
      context.flush("mount-first-ref", () =>
        context.root.render(h("div", { ref: firstRef }))
      ),
      context.flush("update-second-ref", () =>
        context.root.render(h("div", { ref: secondRef }))
      ),
      context.flush("unmount", () => context.root.unmount())
    ];

    return context.finish(operations);
  },

  "host-type-replacement-update": (runtime) => {
    const context = createScenarioContext(runtime);
    const ref = context.callbackRef("host");
    const h = runtime.React.createElement;

    const operations = [
      context.flush("mount-div", () =>
        context.root.render(h("div", { ref, "data-kind": "before" }))
      ),
      context.flush("replace-with-span", () =>
        context.root.render(h("span", { ref, "data-kind": "after" }))
      ),
      context.flush("unmount", () => context.root.unmount())
    ];

    return context.finish(operations);
  },

  "callback-cleanup-return-update-unmount": (runtime) => {
    const context = createScenarioContext(runtime);
    const firstRef = context.callbackRef("first-cleanup", {
      returnsCleanup: true
    });
    const secondRef = context.callbackRef("second-cleanup", {
      returnsCleanup: true
    });
    const h = runtime.React.createElement;

    const operations = [
      context.flush("mount-first-cleanup-ref", () =>
        context.root.render(h("div", { ref: firstRef }))
      ),
      context.flush("update-second-cleanup-ref", () =>
        context.root.render(h("div", { ref: secondRef }))
      ),
      context.flush("unmount", () => context.root.unmount())
    ];

    return context.finish(operations);
  },

  "object-ref-relative-order-and-replacement": (runtime) => {
    const context = createScenarioContext(runtime);
    const objectRef = runtime.React.createRef();
    const observerRef = context.callbackRef("observer", {
      snapshotObjectRef: objectRef
    });
    const h = runtime.React.createElement;
    const fragment = runtime.React.Fragment;

    const operations = [
      context.flush("mount-object-ref", () =>
        context.root.render(
          h(
            fragment,
            null,
            h("div", { ref: objectRef, "data-object": "before" }),
            h("span", { ref: observerRef, "data-observer": "sibling" })
          )
        )
      ),
      context.snapshotObjectRef("after-mount", objectRef),
      context.flush("replace-object-ref-host", () =>
        context.root.render(
          h(
            fragment,
            null,
            h("section", { ref: objectRef, "data-object": "after" }),
            h("span", { ref: observerRef, "data-observer": "sibling" })
          )
        )
      ),
      context.snapshotObjectRef("after-replace", objectRef),
      context.flush("unmount", () => context.root.unmount()),
      context.snapshotObjectRef("after-unmount", objectRef)
    ];

    return context.finish(operations);
  },

  "strict-mode-callback-null-detach-cycle": (runtime) => {
    const context = createScenarioContext(runtime);
    const ref = context.callbackRef("strict-null");
    const h = runtime.React.createElement;

    const operations = [
      context.flush("mount-strict-mode", () =>
        context.root.render(
          h(runtime.React.StrictMode, null, h("div", { ref }))
        )
      ),
      context.flush("unmount", () => context.root.unmount())
    ];

    return context.finish(operations);
  },

  "strict-mode-callback-cleanup-cycle": (runtime) => {
    const context = createScenarioContext(runtime);
    const ref = context.callbackRef("strict-cleanup", {
      returnsCleanup: true
    });
    const h = runtime.React.createElement;

    const operations = [
      context.flush("mount-strict-mode", () =>
        context.root.render(
          h(runtime.React.StrictMode, null, h("div", { ref }))
        )
      ),
      context.flush("unmount", () => context.root.unmount())
    ];

    return context.finish(operations);
  },

  "callback-ref-attach-error-propagation": (runtime) => {
    const context = createScenarioContext(runtime);
    const ref = context.callbackRef("throwing-attach", {
      throwsOnAttach: true
    });
    const h = runtime.React.createElement;

    const operations = [
      context.flush("mount-throwing-ref", () =>
        context.root.render(h("div", { ref }))
      ),
      context.flush("unmount-after-attach-error", () => context.root.unmount())
    ];

    return context.finish(operations);
  },

  "callback-ref-cleanup-error-propagation": (runtime) => {
    const context = createScenarioContext(runtime);
    const ref = context.callbackRef("throwing-cleanup", {
      returnsCleanup: true,
      throwsOnCleanup: true
    });
    const h = runtime.React.createElement;

    const operations = [
      context.flush("mount-cleanup-ref", () =>
        context.root.render(h("div", { ref }))
      ),
      context.flush("unmount-throwing-cleanup", () => context.root.unmount())
    ];

    return context.finish(operations);
  }
};

function createScenarioContext({ ReactDOM, createRoot, document }) {
  const container = document.createElement("div");
  const events = [];
  const rootErrors = [];
  const root = createRoot(container, {
    onUncaughtError(error, errorInfo) {
      const rootError = {
        event: "root-error",
        channel: "onUncaughtError",
        error: describeThrown(error),
        componentStack: describeComponentStack(errorInfo?.componentStack)
      };
      events.push(rootError);
      rootErrors.push(rootError);
    },
    onCaughtError(error, errorInfo) {
      const rootError = {
        event: "root-error",
        channel: "onCaughtError",
        error: describeThrown(error),
        componentStack: describeComponentStack(errorInfo?.componentStack)
      };
      events.push(rootError);
      rootErrors.push(rootError);
    },
    onRecoverableError(error, errorInfo) {
      const rootError = {
        event: "root-error",
        channel: "onRecoverableError",
        error: describeThrown(error),
        componentStack: describeComponentStack(errorInfo?.componentStack)
      };
      events.push(rootError);
      rootErrors.push(rootError);
    }
  });

  return {
    container,
    events,
    root,
    rootErrors,
    callbackRef(label, options = {}) {
      return (node) => {
        const phase = node === null ? "detach" : "attach";
        const event = {
          event: "callback-ref",
          label,
          phase,
          node: describeNode(node)
        };

        if (options.snapshotObjectRef) {
          event.objectRefCurrent = describeNode(options.snapshotObjectRef.current);
        }

        events.push(event);

        if (node !== null && options.throwsOnAttach) {
          throw new Error(`${label} attach error`);
        }
        if (node === null && options.throwsOnDetach) {
          throw new Error(`${label} detach error`);
        }
        if (node !== null && options.returnsCleanup) {
          return () => {
            events.push({
              event: "callback-cleanup",
              label,
              node: describeNode(node)
            });
            if (options.throwsOnCleanup) {
              throw new Error(`${label} cleanup error`);
            }
          };
        }

        return undefined;
      };
    },
    flush(label, fn) {
      return captureOperation(label, () => {
        ReactDOM.flushSync(fn);
        return describeContainer(container);
      });
    },
    snapshotObjectRef(label, ref) {
      const operation = {
        label,
        status: "ok",
        value: {
          current: describeNode(ref.current),
          container: describeContainer(container)
        }
      };
      events.push({
        event: "object-ref-snapshot",
        label,
        current: describeNode(ref.current)
      });
      return operation;
    },
    finish(operations) {
      return {
        operations,
        events,
        rootErrors,
        finalContainer: describeContainer(container)
      };
    }
  };
}

function installDomShim() {
  let nextNodeId = 1;

  class NodeBase {
    constructor(ownerDocument) {
      this.__domRefCallbackNodeId = nextNodeId;
      nextNodeId += 1;
      this.ownerDocument = ownerDocument;
      this.parentNode = null;
      this.childNodes = [];
    }

    appendChild(child) {
      return this.insertBefore(child, null);
    }

    insertBefore(child, beforeChild) {
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
      this.namespaceURI = namespaceURI ?? "http://www.w3.org/1999/xhtml";
      this.attributes = {};
      this.style = {};
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }

    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    }

    removeAttribute(name) {
      delete this.attributes[name];
    }

    hasAttribute(name) {
      return Object.hasOwn(this.attributes, name);
    }

    get textContent() {
      return this.childNodes
        .map((child) => child.textContent ?? child.nodeValue ?? "")
        .join("");
    }

    set textContent(value) {
      for (const child of this.childNodes) {
        child.parentNode = null;
      }
      this.childNodes = [];
      if (value !== "") {
        this.appendChild(this.ownerDocument.createTextNode(value));
      }
    }
  }

  class TextNode extends NodeBase {
    constructor(text, ownerDocument) {
      super(ownerDocument);
      this.nodeType = 3;
      this.nodeName = "#text";
      this.nodeValue = String(text);
      this.data = String(text);
    }

    get textContent() {
      return this.nodeValue;
    }

    set textContent(value) {
      this.nodeValue = String(value);
      this.data = String(value);
    }
  }

  class CommentNode extends NodeBase {
    constructor(text, ownerDocument) {
      super(ownerDocument);
      this.nodeType = 8;
      this.nodeName = "#comment";
      this.nodeValue = String(text);
      this.data = String(text);
    }

    get textContent() {
      return this.nodeValue;
    }

    set textContent(value) {
      this.nodeValue = String(value);
      this.data = String(value);
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
      this.activeElement = this.body;
    }

    createElement(tagName) {
      return new ElementNode(tagName, this);
    }

    createElementNS(namespaceURI, tagName) {
      return new ElementNode(tagName, this, namespaceURI);
    }

    createTextNode(text) {
      return new TextNode(text, this);
    }

    createComment(text) {
      return new CommentNode(text, this);
    }
  }

  const document = new DocumentNode();
  const window = {
    document,
    navigator: {
      userAgent: "fast-react-dom-ref-callback-probe"
    },
    Node: NodeBase,
    Element: ElementNode,
    HTMLElement: ElementNode,
    HTMLIFrameElement: ElementNode,
    SVGElement: ElementNode,
    Document: DocumentNode,
    Text: TextNode,
    Comment: CommentNode,
    getSelection() {
      return null;
    }
  };
  document.defaultView = window;

  globalThis.window = window;
  globalThis.document = document;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: window.navigator,
    writable: true
  });
  globalThis.Node = NodeBase;
  globalThis.Element = ElementNode;
  globalThis.HTMLElement = ElementNode;
  globalThis.HTMLIFrameElement = ElementNode;
  globalThis.SVGElement = ElementNode;
  globalThis.Document = DocumentNode;
  globalThis.Text = TextNode;
  globalThis.Comment = CommentNode;
}

function describeContainer(container) {
  return {
    childCount: container.childNodes.length,
    children: container.childNodes.map(describeNode)
  };
}

function describeNode(node) {
  if (node === null || node === undefined) {
    return {
      type: "null"
    };
  }

  if (node.nodeType === 1) {
    return {
      type: "element",
      id: node.__domRefCallbackNodeId,
      nodeName: node.nodeName,
      localName: node.localName,
      namespaceURI: node.namespaceURI,
      attributes: Object.keys(node.attributes)
        .sort()
        .map((name) => ({
          name,
          value: node.attributes[name]
        }))
    };
  }

  if (node.nodeType === 3) {
    return {
      type: "text",
      id: node.__domRefCallbackNodeId,
      nodeValue: node.nodeValue
    };
  }

  if (node.nodeType === 8) {
    return {
      type: "comment",
      id: node.__domRefCallbackNodeId,
      nodeValue: node.nodeValue
    };
  }

  return {
    type: "node",
    id: node.__domRefCallbackNodeId ?? null,
    nodeType: node.nodeType ?? null,
    nodeName: node.nodeName ?? null
  };
}

function captureOperation(label, fn) {
  try {
    return {
      label,
      status: "ok",
      value: fn()
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      error: describeThrown(error)
    };
  }
}

function describeThrown(error) {
  const described = {
    name: error?.name ?? null,
    message: error?.message ?? String(error)
  };

  if (error?.code !== undefined) {
    described.code = error.code;
  }
  if (Array.isArray(error?.errors)) {
    described.errors = error.errors.map(describeThrown);
  }

  return described;
}

function describeComponentStack(componentStack) {
  return typeof componentStack === "string" ? componentStack : "";
}

function describeConsoleValue(value) {
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
    valueType === "boolean" ||
    valueType === "bigint"
  ) {
    return {
      type: valueType,
      value: valueType === "bigint" ? value.toString() : value
    };
  }
  if (value instanceof Error) {
    return {
      type: "error",
      error: describeThrown(value)
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

function main() {
  const scenarioId = process.argv[2];

  if (!scenarioId) {
    throw new Error("Usage: node dom-ref-callback-probe-runner.mjs <scenario>");
  }

  const consoleCalls = [];
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args) => {
    consoleCalls.push({
      method: "error",
      args: args.map(describeConsoleValue)
    });
  };
  console.warn = (...args) => {
    consoleCalls.push({
      method: "warn",
      args: args.map(describeConsoleValue)
    });
  };

  try {
    installDomShim();

    const React = require("react");
    const ReactDOM = require("react-dom");
    const { createRoot } = require("react-dom/client");
    const scenario = scenarios[scenarioId];

    if (!scenario) {
      throw new Error(`Unknown DOM ref callback scenario: ${scenarioId}`);
    }

    const result = captureOperation(scenarioId, () =>
      scenario({
        React,
        ReactDOM,
        createRoot,
        document: globalThis.document
      })
    );

    process.stdout.write(
      JSON.stringify({
        scenarioId,
        nodeEnv: process.env.NODE_ENV ?? null,
        result,
        consoleCalls
      })
    );
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
}

main();
