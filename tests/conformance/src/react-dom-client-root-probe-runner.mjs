import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node react-dom-client-root-probe-runner.mjs <package> <scenario>"
  );
}

const consoleCalls = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

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
console.info = (...args) => {
  consoleCalls.push({
    method: "info",
    args: args.map(describeValue)
  });
};

function main() {
  installDomGlobals();

  try {
    const scenario = scenarios[scenarioId];
    if (!scenario) {
      throw new Error(`Unknown React DOM client-root scenario: ${scenarioId}`);
    }

    process.stdout.write(
      JSON.stringify({
        targetPackage,
        scenarioId,
        result: runScenario(scenario, targetPackage),
        consoleCalls
      })
    );
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  }
}

function runScenario(scenario, target) {
  try {
    return {
      status: "ok",
      value: scenario(target)
    };
  } catch (error) {
    return {
      status: "throws",
      thrown: describeThrown(error)
    };
  }
}

const scenarios = {
  "client-entrypoint-shape": (target) => ({
    client: attemptOperation(
      "require react-dom/client",
      () => loadEntrypoint(target, "./client"),
      describeModule
    ).record,
    profiling: attemptOperation(
      "require react-dom/profiling",
      () => loadEntrypoint(target, "./profiling"),
      describeModule
    ).record
  }),

  "create-root-valid-containers": (target) =>
    withClientEntrypoint(target, (client) => {
      const elementDocument = new FakeDocument();
      const documentContainer = new FakeDocument();
      const fragmentDocument = new FakeDocument();
      const containers = [
        ["element", elementDocument.createElement("div")],
        ["document", documentContainer],
        ["fragment", fragmentDocument.createDocumentFragment()]
      ];

      return Object.fromEntries(
        containers.map(([kind, container]) => [
          kind,
          createRootAndSummarize(client, container, kind)
        ])
      );
    }),

  "create-root-invalid-containers": (target) =>
    withClientEntrypoint(target, (client) => {
      const document = currentDocument();
      const invalids = [
        ["null", null],
        ["undefined", undefined],
        ["text", document.createTextNode("not a container")],
        [
          "comment",
          document.createComment(" react-mount-point-unstable ")
        ],
        ["plainObject", {}]
      ];

      return Object.fromEntries(
        invalids.map(([kind, container]) => [
          kind,
          attemptOperation(
            `createRoot invalid ${kind}`,
            () => client.createRoot(container),
            describeRoot
          ).record
        ])
      );
    }),

  "create-root-duplicate-warnings": (target) =>
    withClientEntrypoint(target, (client) => {
      const document = currentDocument();
      const duplicateContainer = document.createElement("div");
      const legacyContainer = document.createElement("div");

      const duplicateFirst = attemptOperation(
        "first createRoot on duplicate container",
        () => client.createRoot(duplicateContainer),
        describeRoot
      );
      const duplicateSecond = attemptOperation(
        "second createRoot on duplicate container",
        () => client.createRoot(duplicateContainer),
        describeRoot
      );

      const legacyFirst = attemptOperation(
        "first createRoot on legacy-marked container",
        () => client.createRoot(legacyContainer),
        describeRoot
      );
      legacyContainer._reactRootContainer = {
        marker: "legacy-root-placeholder"
      };
      const legacySecond = attemptOperation(
        "second createRoot on legacy-marked container",
        () => client.createRoot(legacyContainer),
        describeRoot
      );

      return {
        duplicate: {
          first: duplicateFirst.record,
          second: duplicateSecond.record,
          container: summarizeContainer(duplicateContainer)
        },
        legacy: {
          first: legacyFirst.record,
          second: legacySecond.record,
          container: summarizeContainer(legacyContainer)
        }
      };
    }),

  "create-root-option-warnings": (target) =>
    withClientEntrypoint(target, (client) => {
      const document = currentDocument();
      const jsxLikeOption = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: "div",
        key: null,
        props: {}
      };

      return {
        hydrateOption: attemptOperation(
          "createRoot with hydrate option",
          () => client.createRoot(document.createElement("div"), { hydrate: true }),
          describeRoot
        ).record,
        jsxOption: attemptOperation(
          "createRoot with JSX-like option",
          () => client.createRoot(document.createElement("div"), jsxLikeOption),
          describeRoot
        ).record
      };
    }),

  "create-root-options-stored": (target) =>
    withClientEntrypoint(target, (client) => {
      const document = currentDocument();
      function onUncaughtError() {}
      function onCaughtError() {}
      function onRecoverableError() {}
      function unstableTransitionCallbacks() {}
      function onDefaultTransitionIndicator() {}

      const create = attemptOperation(
        "createRoot with stable and gated options",
        () =>
          client.createRoot(document.createElement("div"), {
            identifierPrefix: "fast-react-root-",
            unstable_strictMode: true,
            onUncaughtError,
            onCaughtError,
            onRecoverableError,
            unstable_transitionCallbacks: unstableTransitionCallbacks,
            onDefaultTransitionIndicator
          }),
        describeRoot
      );

      if (!create.ok) {
        return {
          createRoot: create.record
        };
      }

      return {
        createRoot: create.record,
        optionStorage: summarizeRootOptions(create.value._internalRoot, {
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          unstableTransitionCallbacks,
          onDefaultTransitionIndicator
        })
      };
    }),

  "root-object-shape": (target) =>
    withClientEntrypoint(target, (client) => {
      const create = attemptOperation(
        "createRoot for root object shape",
        () => client.createRoot(currentDocument().createElement("div")),
        describeRoot
      );

      return {
        createRoot: create.record
      };
    }),

  "root-render-second-argument-warnings": (target) =>
    withClientEntrypoint(target, (client) => {
      const document = currentDocument();
      const create = attemptOperation(
        "createRoot before render warnings",
        () => client.createRoot(document.createElement("div")),
        describeRoot
      );

      if (!create.ok) {
        return {
          createRoot: create.record
        };
      }

      const root = create.value;
      return {
        createRoot: create.record,
        oneArgument: attemptOperation("root.render one argument", () =>
          root.render("plain child")
        ).record,
        callbackSecondArg: attemptOperation("root.render callback second arg", () =>
          root.render("callback child", function afterRender() {})
        ).record,
        containerSecondArg: attemptOperation("root.render container second arg", () =>
          root.render("container child", document.createElement("section"))
        ).record,
        genericSecondArg: attemptOperation("root.render generic second arg", () =>
          root.render("generic child", { unexpected: true })
        ).record,
        cleanup: attemptOperation("root.unmount cleanup", () => root.unmount())
          .record
      };
    }),

  "root-render-after-unmount": (target) =>
    withClientEntrypoint(target, (client) => {
      const container = currentDocument().createElement("div");
      const create = attemptOperation(
        "createRoot before render-after-unmount",
        () => client.createRoot(container),
        describeRoot
      );

      if (!create.ok) {
        return {
          createRoot: create.record
        };
      }

      const root = create.value;
      const unmount = attemptOperation("root.unmount before stale render", () =>
        root.unmount()
      );
      const renderAfterUnmount = attemptOperation(
        "root.render after unmount",
        () => root.render("stale child")
      );

      return {
        createRoot: create.record,
        unmount: unmount.record,
        rootAfterUnmount: describeRoot(root),
        renderAfterUnmount: renderAfterUnmount.record,
        containerAfterUnmount: summarizeContainer(container)
      };
    }),

  "root-unmount-behavior": (target) =>
    withClientEntrypoint(target, (client) => {
      const container = currentDocument().createElement("div");
      const create = attemptOperation(
        "createRoot before unmount behavior",
        () => client.createRoot(container),
        describeRoot
      );

      if (!create.ok) {
        return {
          createRoot: create.record
        };
      }

      const root = create.value;
      return {
        createRoot: create.record,
        callbackUnmount: attemptOperation("root.unmount callback argument", () =>
          root.unmount(function afterUnmount() {})
        ).record,
        rootAfterFirstUnmount: describeRoot(root),
        containerAfterFirstUnmount: summarizeContainer(container),
        secondUnmount: attemptOperation("root.unmount second call", () =>
          root.unmount()
        ).record,
        rootAfterSecondUnmount: describeRoot(root),
        containerAfterSecondUnmount: summarizeContainer(container)
      };
    }),

  "profiling-create-root-boundary": (target) => {
    const load = attemptOperation(
      "require react-dom/profiling",
      () => loadEntrypoint(target, "./profiling"),
      describeModule
    );
    if (!load.ok) {
      return {
        profiling: load.record
      };
    }

    const container = currentDocument().createElement("div");
    const create = attemptOperation(
      "profiling createRoot",
      () => load.value.createRoot(container),
      describeRoot
    );

    return {
      profiling: load.record,
      createRoot: create.record,
      containerAfterCreate: summarizeContainer(container)
    };
  }
};

function withClientEntrypoint(target, callback) {
  const load = attemptOperation(
    "require react-dom/client",
    () => loadEntrypoint(target, "./client"),
    describeModule
  );
  if (!load.ok) {
    return {
      client: load.record
    };
  }

  return {
    client: load.record,
    behavior: callback(load.value)
  };
}

function createRootAndSummarize(client, container, kind) {
  const create = attemptOperation(
    `createRoot valid ${kind}`,
    () => client.createRoot(container),
    describeRoot
  );

  if (!create.ok) {
    return {
      createRoot: create.record
    };
  }

  const containerAfterCreate = summarizeContainer(container);
  const unmount = attemptOperation(`unmount valid ${kind}`, () =>
    create.value.unmount()
  );

  return {
    createRoot: create.record,
    containerAfterCreate,
    unmount: unmount.record,
    rootAfterUnmount: describeRoot(create.value),
    containerAfterUnmount: summarizeContainer(container)
  };
}

function attemptOperation(label, fn, describe = describeValue) {
  const consoleStart = consoleCalls.length;
  try {
    const value = fn();
    return {
      ok: true,
      value,
      record: {
        label,
        status: "ok",
        value: describe(value),
        consoleCalls: consoleCalls.slice(consoleStart)
      }
    };
  } catch (error) {
    return {
      ok: false,
      value: undefined,
      record: {
        label,
        status: "throws",
        thrown: describeThrown(error),
        consoleCalls: consoleCalls.slice(consoleStart)
      }
    };
  }
}

function loadEntrypoint(target, subpath) {
  if (subpath === ".") {
    return require(target);
  }
  return require(`${target}/${subpath.slice(2)}`);
}

function describeModule(value) {
  const ownKeys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);

  return {
    objectTag: Object.prototype.toString.call(value),
    isExtensible: Object.isExtensible(value),
    exportKeys: Object.keys(value),
    ownPropertyNames: Object.getOwnPropertyNames(value),
    ownSymbolKeys: Object.getOwnPropertySymbols(value).map(describePropertyKey),
    ownKeys: ownKeys.map(describePropertyKey),
    descriptors: ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key])
    }))
  };
}

function describeRoot(root) {
  if (root === null || typeof root !== "object") {
    return describeValue(root);
  }

  const ownKeys = Reflect.ownKeys(root);
  const descriptors = Object.getOwnPropertyDescriptors(root);
  const prototype = Object.getPrototypeOf(root);

  return {
    objectTag: Object.prototype.toString.call(root),
    isExtensible: Object.isExtensible(root),
    ownPropertyNames: Object.getOwnPropertyNames(root),
    ownSymbolKeys: Object.getOwnPropertySymbols(root).map(describePropertyKey),
    ownKeys: ownKeys.map(describePropertyKey),
    descriptors: ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor:
        key === "_internalRoot"
          ? describeInternalRootSlot(descriptors[key])
          : describeDescriptor(descriptors[key])
    })),
    prototype: describePrototype(prototype)
  };
}

function describeInternalRootSlot(descriptor) {
  if (!descriptor || !("value" in descriptor)) {
    return describeDescriptor(descriptor);
  }

  return {
    kind: "data",
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: summarizeInternalRoot(descriptor.value)
  };
}

function describePrototype(prototype) {
  if (!prototype) {
    return null;
  }

  const ownKeys = Reflect.ownKeys(prototype);
  const descriptors = Object.getOwnPropertyDescriptors(prototype);
  return {
    constructorName: prototype.constructor?.name ?? null,
    ownPropertyNames: Object.getOwnPropertyNames(prototype),
    ownSymbolKeys: Object.getOwnPropertySymbols(prototype).map(
      describePropertyKey
    ),
    ownKeys: ownKeys.map(describePropertyKey),
    descriptors: ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key])
    }))
  };
}

function summarizeRootOptions(internalRoot, expectedCallbacks) {
  return {
    identifierPrefix: internalRoot?.identifierPrefix ?? null,
    tag: internalRoot?.tag ?? null,
    currentMode: internalRoot?.current?.mode ?? null,
    callbacks: {
      onUncaughtError: describeCallbackIdentity(
        internalRoot?.onUncaughtError,
        expectedCallbacks.onUncaughtError
      ),
      onCaughtError: describeCallbackIdentity(
        internalRoot?.onCaughtError,
        expectedCallbacks.onCaughtError
      ),
      onRecoverableError: describeCallbackIdentity(
        internalRoot?.onRecoverableError,
        expectedCallbacks.onRecoverableError
      )
    },
    gatedOptionFields: {
      hasTransitionCallbacksField: Object.hasOwn(
        Object(internalRoot),
        "transitionCallbacks"
      ),
      transitionCallbacksType: typeof internalRoot?.transitionCallbacks,
      transitionCallbacksIsInput:
        internalRoot?.transitionCallbacks ===
        expectedCallbacks.unstableTransitionCallbacks,
      hasOnDefaultTransitionIndicatorField: Object.hasOwn(
        Object(internalRoot),
        "onDefaultTransitionIndicator"
      ),
      onDefaultTransitionIndicatorType:
        typeof internalRoot?.onDefaultTransitionIndicator,
      onDefaultTransitionIndicatorIsInput:
        internalRoot?.onDefaultTransitionIndicator ===
        expectedCallbacks.onDefaultTransitionIndicator
    }
  };
}

function summarizeInternalRoot(internalRoot) {
  if (internalRoot === null) {
    return {
      type: "null"
    };
  }

  if (!internalRoot || typeof internalRoot !== "object") {
    return describeValue(internalRoot);
  }

  const current = internalRoot.current;
  return {
    type: "object",
    objectTag: Object.prototype.toString.call(internalRoot),
    isExtensible: Object.isExtensible(internalRoot),
    ownPropertyNames: Object.getOwnPropertyNames(internalRoot),
    ownSymbolKeys: Object.getOwnPropertySymbols(internalRoot).map(
      describePropertyKey
    ),
    tag: internalRoot.tag,
    identifierPrefix: internalRoot.identifierPrefix ?? null,
    pendingLanes: internalRoot.pendingLanes ?? null,
    callbackPriority: internalRoot.callbackPriority ?? null,
    current: current
      ? {
          tag: current.tag,
          mode: current.mode,
          lanes: current.lanes,
          childLanes: current.childLanes,
          memoizedStateKeys:
            current.memoizedState && typeof current.memoizedState === "object"
              ? Object.keys(current.memoizedState)
              : null,
          memoizedStateIsDehydrated:
            current.memoizedState?.isDehydrated ?? null
        }
      : null,
    callbacks: {
      onUncaughtError: describeFunctionValue(internalRoot.onUncaughtError),
      onCaughtError: describeFunctionValue(internalRoot.onCaughtError),
      onRecoverableError: describeFunctionValue(internalRoot.onRecoverableError)
    },
    gatedOptionFields: {
      hasTransitionCallbacksField: Object.hasOwn(
        internalRoot,
        "transitionCallbacks"
      ),
      transitionCallbacksType: typeof internalRoot.transitionCallbacks,
      hasOnDefaultTransitionIndicatorField: Object.hasOwn(
        internalRoot,
        "onDefaultTransitionIndicator"
      ),
      onDefaultTransitionIndicatorType:
        typeof internalRoot.onDefaultTransitionIndicator
    },
    container: summarizeNode(internalRoot.containerInfo)
  };
}

function describeCallbackIdentity(actual, expected) {
  return {
    actual: describeFunctionValue(actual),
    isExpectedInput: actual === expected
  };
}

function describeDescriptor(descriptor) {
  if (!descriptor) {
    return null;
  }

  const base = {
    kind: "value" in descriptor ? "data" : "accessor",
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable
  };

  if ("value" in descriptor) {
    return {
      ...base,
      writable: descriptor.writable,
      value: describeValue(descriptor.value)
    };
  }

  return {
    ...base,
    get: describeFunctionValue(descriptor.get),
    set: describeFunctionValue(descriptor.set)
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
    return describeFunctionValue(value);
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      values: value.map(describeValue)
    };
  }

  if (valueType === "object") {
    return {
      type: "object",
      objectTag: Object.prototype.toString.call(value),
      isExtensible: Object.isExtensible(value),
      ownPropertyNames: Object.getOwnPropertyNames(value),
      ownSymbolKeys: Object.getOwnPropertySymbols(value).map(
        describePropertyKey
      )
    };
  }

  return {
    type: valueType
  };
}

function describeFunctionValue(value) {
  if (typeof value !== "function") {
    return {
      type: typeof value
    };
  }

  return {
    type: "function",
    name: value.name,
    length: value.length,
    isAsync: value.constructor?.name === "AsyncFunction",
    ownPropertyNames: Object.getOwnPropertyNames(value)
  };
}

function describeThrown(error) {
  return {
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    entrypoint: error?.entrypoint ?? null,
    exportName: error?.exportName ?? null,
    compatibilityTarget: error?.compatibilityTarget ?? null
  };
}

function describePropertyKey(key) {
  if (typeof key === "symbol") {
    return {
      type: "symbol",
      description: key.description ?? null,
      stringValue: String(key)
    };
  }

  return {
    type: "string",
    value: key
  };
}

function summarizeContainer(container) {
  return {
    node: summarizeNode(container),
    markers: summarizeReactMarkers(container),
    listeners: summarizeListeners(container),
    ownerDocumentListeners:
      container?.ownerDocument && container.ownerDocument !== container
        ? summarizeListeners(container.ownerDocument)
        : null
  };
}

function summarizeNode(node) {
  if (!node || typeof node !== "object") {
    return describeValue(node);
  }

  return {
    type: "dom-node",
    nodeType: node.nodeType ?? null,
    nodeName: node.nodeName ?? null,
    tagName: node.tagName ?? null,
    namespaceURI: node.namespaceURI ?? null,
    nodeValue: node.nodeValue ?? null,
    childCount: Array.isArray(node.childNodes) ? node.childNodes.length : null
  };
}

function summarizeReactMarkers(node) {
  if (!node || typeof node !== "object") {
    return {
      reactContainerMarkerCount: 0,
      reactContainerMarkerValueKinds: [],
      reactListeningMarkerCount: 0,
      reactListeningMarkerValueKinds: [],
      legacyRootContainerValueKind: "absent"
    };
  }

  const keys = Reflect.ownKeys(node).filter((key) => typeof key === "string");
  const containerKeys = keys.filter((key) => key.startsWith("__reactContainer$"));
  const listeningKeys = keys.filter((key) => key.startsWith("_reactListening"));

  return {
    reactContainerMarkerCount: containerKeys.length,
    reactContainerMarkerValueKinds: containerKeys.map((key) =>
      describeMarkerValueKind(node[key])
    ),
    reactListeningMarkerCount: listeningKeys.length,
    reactListeningMarkerValueKinds: listeningKeys.map((key) =>
      describeMarkerValueKind(node[key])
    ),
    legacyRootContainerValueKind: Object.hasOwn(node, "_reactRootContainer")
      ? describeMarkerValueKind(node._reactRootContainer)
      : "absent"
  };
}

function describeMarkerValueKind(value) {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "boolean") {
    return `boolean:${value}`;
  }
  if (typeof value === "object") {
    return "object";
  }
  return typeof value;
}

function summarizeListeners(node) {
  const listeners = Array.isArray(node?.listeners) ? node.listeners : [];
  const byType = new Map();
  for (const listener of listeners) {
    const current = byType.get(listener.type) ?? {
      type: listener.type,
      capture: 0,
      bubble: 0
    };
    if (listener.capture) {
      current.capture += 1;
    } else {
      current.bubble += 1;
    }
    byType.set(listener.type, current);
  }

  return {
    count: listeners.length,
    uniqueTypeCount: byType.size,
    firstEntries: listeners.slice(0, 12).map((listener) => ({
      type: listener.type,
      capture: listener.capture
    })),
    selectedEntries: ["click", "selectionchange", "scroll", "abort"]
      .map((type) => byType.get(type))
      .filter(Boolean)
  };
}

let installedDocument = null;

function currentDocument() {
  return installedDocument;
}

function installDomGlobals() {
  installedDocument = new FakeDocument();
  const windowObject = {
    document: installedDocument,
    event: undefined,
    HTMLIFrameElement: function HTMLIFrameElement() {},
    addEventListener() {},
    removeEventListener() {},
    location: {
      protocol: "file:"
    }
  };
  windowObject.top = windowObject;
  windowObject.self = windowObject;
  installedDocument.defaultView = windowObject;

  globalThis.window = windowObject;
  globalThis.document = installedDocument;
  globalThis.Node = FakeNode;
  globalThis.Element = FakeElement;
  globalThis.HTMLElement = FakeElement;
  globalThis.HTMLIFrameElement = windowObject.HTMLIFrameElement;
  globalThis.Document = FakeDocument;
  globalThis.DocumentFragment = FakeDocumentFragment;
  globalThis.Text = FakeText;
  globalThis.Comment = FakeComment;

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      userAgent: "Node.js deterministic React DOM client-root oracle"
    }
  });
}

class FakeNode {
  constructor(nodeType, nodeName, ownerDocument) {
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.ownerDocument = ownerDocument ?? this;
    this.parentNode = null;
    this.childNodes = [];
    this.listeners = [];
    this.nodeValue = null;
  }

  get firstChild() {
    return this.childNodes[0] ?? null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }

  get textContent() {
    return this.childNodes.map((child) => child.textContent ?? "").join("");
  }

  set textContent(value) {
    this.childNodes = [];
    if (value !== "" && value !== null && value !== undefined) {
      this.appendChild(this.ownerDocument.createTextNode(String(value)));
    }
  }

  addEventListener(type, listener, options) {
    this.listeners.push({
      type: String(type),
      capture:
        typeof options === "boolean" ? options : Boolean(options?.capture)
    });
  }

  removeEventListener() {}

  appendChild(child) {
    return this.insertBefore(child, null);
  }

  insertBefore(child, before) {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }

    child.parentNode = this;
    if (before === null || before === undefined) {
      this.childNodes.push(child);
    } else {
      const index = this.childNodes.indexOf(before);
      if (index === -1) {
        this.childNodes.push(child);
      } else {
        this.childNodes.splice(index, 0, child);
      }
    }
    return child;
  }

  removeChild(child) {
    const index = this.childNodes.indexOf(child);
    if (index !== -1) {
      this.childNodes.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }

  contains(candidate) {
    if (candidate === this) {
      return true;
    }

    return this.childNodes.some((child) => child.contains?.(candidate));
  }
}

class FakeElement extends FakeNode {
  constructor(tagName, ownerDocument) {
    super(1, tagName.toUpperCase(), ownerDocument);
    this.tagName = tagName.toUpperCase();
    this.localName = tagName.toLowerCase();
    this.namespaceURI = "http://www.w3.org/1999/xhtml";
    this.attributes = Object.create(null);
    this.style = {};
  }

  setAttribute(name, value) {
    this.attributes[String(name)] = String(value);
  }

  getAttribute(name) {
    return this.attributes[String(name)] ?? null;
  }

  removeAttribute(name) {
    delete this.attributes[String(name)];
  }

  hasAttribute(name) {
    return Object.hasOwn(this.attributes, String(name));
  }
}

class FakeText extends FakeNode {
  constructor(text, ownerDocument) {
    super(3, "#text", ownerDocument);
    this.nodeValue = String(text);
  }

  get textContent() {
    return this.nodeValue;
  }

  set textContent(value) {
    this.nodeValue = String(value);
  }
}

class FakeComment extends FakeNode {
  constructor(text, ownerDocument) {
    super(8, "#comment", ownerDocument);
    this.nodeValue = String(text);
  }

  get textContent() {
    return this.nodeValue;
  }

  set textContent(value) {
    this.nodeValue = String(value);
  }
}

class FakeDocumentFragment extends FakeNode {
  constructor(ownerDocument) {
    super(11, "#document-fragment", ownerDocument);
  }
}

class FakeDocument extends FakeNode {
  constructor() {
    super(9, "#document", null);
    this.ownerDocument = this;
    this.documentElement = new FakeElement("html", this);
    this.body = new FakeElement("body", this);
    this.activeElement = this.body;
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createElementNS(namespaceURI, tagName) {
    const element = new FakeElement(tagName, this);
    element.namespaceURI = namespaceURI;
    return element;
  }

  createTextNode(text) {
    return new FakeText(text, this);
  }

  createComment(text) {
    return new FakeComment(text, this);
  }

  createDocumentFragment() {
    return new FakeDocumentFragment(this);
  }
}

main();
