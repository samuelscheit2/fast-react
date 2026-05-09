import { createRequire } from "node:module";

import {
  REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS
} from "./react-dom-root-render-e2e-scenarios.mjs";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2] ?? null;
const scenarioId = process.argv[3] ?? null;

const consoleCalls = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

console.error = (...args) => {
  consoleCalls.push({
    method: "error",
    args: args.map(describeConsoleArg)
  });
};
console.warn = (...args) => {
  consoleCalls.push({
    method: "warn",
    args: args.map(describeConsoleArg)
  });
};
console.info = (...args) => {
  consoleCalls.push({
    method: "info",
    args: args.map(describeConsoleArg)
  });
};

function main() {
  try {
    if (!targetPackage || !scenarioId) {
      throw new Error(
        "Usage: node react-dom-root-render-e2e-probe-runner.mjs <package> <scenario>"
      );
    }
    if (!REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.includes(scenarioId)) {
      throw new Error(`Unknown root render e2e scenario: ${scenarioId}`);
    }

    const probeDom = installProbeDom();
    const React = require("react");
    const ReactDOM = loadEntrypoint(targetPackage, ".");
    const ReactDOMClient = loadEntrypoint(targetPackage, "./client");

    process.stdout.write(
      JSON.stringify({
        targetPackage,
        scenarioId,
        result: runScenario({
          React,
          ReactDOM,
          ReactDOMClient,
          probeDom,
          scenarioId
        }),
        consoleCalls
      })
    );
  } catch (error) {
    process.stdout.write(
      JSON.stringify({
        targetPackage,
        scenarioId,
        result: {
          status: "throws",
          thrown: describeThrown(error)
        },
        consoleCalls
      })
    );
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  }
}

function runScenario(context) {
  try {
    return {
      status: "ok",
      value: runScenarioValue(context)
    };
  } catch (error) {
    return {
      status: "throws",
      thrown: describeThrown(error)
    };
  }
}

function runScenarioValue({
  React,
  ReactDOM,
  ReactDOMClient,
  probeDom,
  scenarioId
}) {
  switch (scenarioId) {
    case "create-root-no-render":
      return runCreateRootNoRender({ ReactDOMClient, probeDom });
    case "initial-host-render":
      return runInitialHostRender({ React, ReactDOM, ReactDOMClient, probeDom });
    case "update-host-render":
      return runUpdateHostRender({ React, ReactDOM, ReactDOMClient, probeDom });
    case "replace-host-tree":
      return runReplaceHostTree({ React, ReactDOM, ReactDOMClient, probeDom });
    case "render-null-clears-container":
      return runRenderNullClearsContainer({
        React,
        ReactDOM,
        ReactDOMClient,
        probeDom
      });
    case "root-unmount":
      return runRootUnmount({ React, ReactDOM, ReactDOMClient, probeDom });
    case "double-unmount":
      return runDoubleUnmount({ React, ReactDOM, ReactDOMClient, probeDom });
    case "render-after-unmount":
      return runRenderAfterUnmount({
        React,
        ReactDOM,
        ReactDOMClient,
        probeDom
      });
    case "flush-sync-cross-root-render":
      return runFlushSyncCrossRootRender({
        React,
        ReactDOM,
        ReactDOMClient,
        probeDom
      });
    case "development-warning-boundaries":
      return runDevelopmentWarningBoundaries({
        React,
        ReactDOMClient,
        probeDom
      });
    default:
      throw new Error(`Unhandled root render e2e scenario: ${scenarioId}`);
  }
}

function runCreateRootNoRender({ ReactDOMClient, probeDom }) {
  const container = createAttachedContainer(probeDom, "no-render-root");
  container.appendChild(probeDom.document.createTextNode("preserved"));
  const beforeTree = dumpNode(container);
  const beforeMarker = summarizeReactMarkers(container);
  probeDom.takeMutationLog();

  const createRoot = attemptOperation(
    "createRoot no render",
    () => ReactDOMClient.createRoot(container),
    describeRoot
  );

  return {
    beforeTree,
    beforeMarker,
    createRoot: createRoot.record,
    createRootMutations: probeDom.takeMutationLog(),
    afterTree: dumpNode(container),
    afterMarker: summarizeReactMarkers(container),
    listenerSummary: summarizeEventTarget(container),
    ownerDocumentListenerSummary: summarizeEventTarget(probeDom.document)
  };
}

function runInitialHostRender({ React, ReactDOM, ReactDOMClient, probeDom }) {
  const prepared = prepareRoot({ ReactDOMClient, probeDom, id: "initial-root" });
  if (!prepared.createRoot.ok) {
    return preparedFailure(prepared);
  }

  let renderReturn = {
    type: "not-called"
  };
  const flushSync = attemptOperation("flushSync initial root.render", () =>
    ReactDOM.flushSync(() => {
      const value = prepared.root.render(initialElement(React));
      renderReturn = describeValue(value);
      return value;
    })
  );

  return {
    createRoot: prepared.createRoot.record,
    markerAfterCreate: prepared.markerAfterCreate,
    renderReturn,
    flushSync: flushSync.record,
    renderMutations: probeDom.takeMutationLog(),
    afterTree: dumpNode(prepared.container),
    markerAfterRender: summarizeReactMarkers(prepared.container),
    rootAfterRender: describeRoot(prepared.root)
  };
}

function runUpdateHostRender({ React, ReactDOM, ReactDOMClient, probeDom }) {
  const mounted = mountInitialRoot({
    React,
    ReactDOM,
    ReactDOMClient,
    probeDom,
    id: "update-root"
  });
  if (!mounted.ok) {
    return mounted.value;
  }

  let updateReturn = {
    type: "not-called"
  };
  const updateFlushSync = attemptOperation("flushSync update root.render", () =>
    ReactDOM.flushSync(() => {
      const value = mounted.root.render(updatedElement(React));
      updateReturn = describeValue(value);
      return value;
    })
  );

  return {
    createRoot: mounted.createRoot.record,
    initialFlushSync: mounted.initialFlushSync.record,
    treeAfterInitialRender: mounted.treeAfterInitialRender,
    initialMutations: mounted.initialMutations,
    updateReturn,
    updateFlushSync: updateFlushSync.record,
    updateMutations: probeDom.takeMutationLog(),
    treeAfterUpdate: dumpNode(mounted.container),
    markerAfterUpdate: summarizeReactMarkers(mounted.container)
  };
}

function runReplaceHostTree({ React, ReactDOM, ReactDOMClient, probeDom }) {
  const prepared = prepareRoot({ ReactDOMClient, probeDom, id: "replace-root" });
  if (!prepared.createRoot.ok) {
    return preparedFailure(prepared);
  }

  const initialFlushSync = attemptOperation("flushSync initial span render", () =>
    ReactDOM.flushSync(() =>
      prepared.root.render(
        React.createElement(
          "span",
          { id: "replace-before", title: "before" },
          "before"
        )
      )
    )
  );
  const initialMutations = probeDom.takeMutationLog();
  const treeAfterInitialRender = dumpNode(prepared.container);

  const replaceFlushSync = attemptOperation("flushSync replacement render", () =>
    ReactDOM.flushSync(() =>
      prepared.root.render(
        React.createElement(
          "section",
          { id: "replace-after", title: "after" },
          React.createElement("b", null, "after")
        )
      )
    )
  );

  return {
    createRoot: prepared.createRoot.record,
    initialFlushSync: initialFlushSync.record,
    initialMutations,
    treeAfterInitialRender,
    replaceFlushSync: replaceFlushSync.record,
    replaceMutations: probeDom.takeMutationLog(),
    treeAfterReplace: dumpNode(prepared.container),
    markerAfterReplace: summarizeReactMarkers(prepared.container)
  };
}

function runRenderNullClearsContainer({
  React,
  ReactDOM,
  ReactDOMClient,
  probeDom
}) {
  const mounted = mountInitialRoot({
    React,
    ReactDOM,
    ReactDOMClient,
    probeDom,
    id: "render-null-root"
  });
  if (!mounted.ok) {
    return mounted.value;
  }

  let renderNullReturn = {
    type: "not-called"
  };
  const renderNullFlushSync = attemptOperation("flushSync root.render null", () =>
    ReactDOM.flushSync(() => {
      const value = mounted.root.render(null);
      renderNullReturn = describeValue(value);
      return value;
    })
  );

  return {
    createRoot: mounted.createRoot.record,
    treeAfterInitialRender: mounted.treeAfterInitialRender,
    renderNullReturn,
    renderNullFlushSync: renderNullFlushSync.record,
    renderNullMutations: probeDom.takeMutationLog(),
    treeAfterRenderNull: dumpNode(mounted.container),
    markerAfterRenderNull: summarizeReactMarkers(mounted.container),
    rootAfterRenderNull: describeRoot(mounted.root)
  };
}

function runRootUnmount({ React, ReactDOM, ReactDOMClient, probeDom }) {
  const mounted = mountInitialRoot({
    React,
    ReactDOM,
    ReactDOMClient,
    probeDom,
    id: "unmount-root"
  });
  if (!mounted.ok) {
    return mounted.value;
  }

  const markerBeforeUnmount = summarizeReactMarkers(mounted.container);
  const unmount = attemptOperation("root.unmount", () => mounted.root.unmount());

  return {
    createRoot: mounted.createRoot.record,
    treeBeforeUnmount: mounted.treeAfterInitialRender,
    markerBeforeUnmount,
    unmount: unmount.record,
    unmountMutations: probeDom.takeMutationLog(),
    treeAfterUnmount: dumpNode(mounted.container),
    markerAfterUnmount: summarizeReactMarkers(mounted.container),
    rootAfterUnmount: describeRoot(mounted.root)
  };
}

function runDoubleUnmount({ React, ReactDOM, ReactDOMClient, probeDom }) {
  const mounted = mountInitialRoot({
    React,
    ReactDOM,
    ReactDOMClient,
    probeDom,
    id: "double-unmount-root"
  });
  if (!mounted.ok) {
    return mounted.value;
  }

  const firstUnmount = attemptOperation("first root.unmount", () =>
    mounted.root.unmount()
  );
  const firstUnmountMutations = probeDom.takeMutationLog();
  const afterFirst = {
    tree: dumpNode(mounted.container),
    marker: summarizeReactMarkers(mounted.container),
    root: describeRoot(mounted.root)
  };

  const secondUnmount = attemptOperation("second root.unmount", () =>
    mounted.root.unmount()
  );

  return {
    createRoot: mounted.createRoot.record,
    firstUnmount: firstUnmount.record,
    firstUnmountMutations,
    afterFirst,
    secondUnmount: secondUnmount.record,
    secondUnmountMutations: probeDom.takeMutationLog(),
    afterSecond: {
      tree: dumpNode(mounted.container),
      marker: summarizeReactMarkers(mounted.container),
      root: describeRoot(mounted.root)
    }
  };
}

function runRenderAfterUnmount({ React, ReactDOM, ReactDOMClient, probeDom }) {
  const mounted = mountInitialRoot({
    React,
    ReactDOM,
    ReactDOMClient,
    probeDom,
    id: "render-after-unmount-root"
  });
  if (!mounted.ok) {
    return mounted.value;
  }

  const unmount = attemptOperation("root.unmount before stale render", () =>
    mounted.root.unmount()
  );
  const unmountMutations = probeDom.takeMutationLog();
  const renderAfterUnmount = attemptOperation("root.render after unmount", () =>
    mounted.root.render(React.createElement("div", null, "stale"))
  );

  return {
    createRoot: mounted.createRoot.record,
    unmount: unmount.record,
    unmountMutations,
    rootAfterUnmount: describeRoot(mounted.root),
    markerAfterUnmount: summarizeReactMarkers(mounted.container),
    renderAfterUnmount: renderAfterUnmount.record,
    treeAfterRenderAttempt: dumpNode(mounted.container),
    renderAfterUnmountMutations: probeDom.takeMutationLog()
  };
}

function runFlushSyncCrossRootRender({
  React,
  ReactDOM,
  ReactDOMClient,
  probeDom
}) {
  const first = prepareRoot({
    ReactDOMClient,
    probeDom,
    id: "cross-root-a"
  });
  const second = prepareRoot({
    ReactDOMClient,
    probeDom,
    id: "cross-root-b"
  });
  if (!first.createRoot.ok || !second.createRoot.ok) {
    return {
      firstCreateRoot: first.createRoot.record,
      secondCreateRoot: second.createRoot.record
    };
  }

  let firstRenderReturn = {
    type: "not-called"
  };
  let secondRenderReturn = {
    type: "not-called"
  };
  const flushSync = attemptOperation("flushSync render two roots", () =>
    ReactDOM.flushSync(() => {
      firstRenderReturn = describeValue(
        first.root.render(
          React.createElement("div", { id: "cross-a" }, "A")
        )
      );
      secondRenderReturn = describeValue(
        second.root.render(
          React.createElement("div", { id: "cross-b" }, "B")
        )
      );
      return "two-root-flush-complete";
    })
  );

  return {
    firstCreateRoot: first.createRoot.record,
    secondCreateRoot: second.createRoot.record,
    firstRenderReturn,
    secondRenderReturn,
    flushSync: flushSync.record,
    mutations: probeDom.takeMutationLog(),
    firstTreeAfterFlush: dumpNode(first.container),
    secondTreeAfterFlush: dumpNode(second.container),
    firstMarkerAfterFlush: summarizeReactMarkers(first.container),
    secondMarkerAfterFlush: summarizeReactMarkers(second.container)
  };
}

function runDevelopmentWarningBoundaries({
  React,
  ReactDOMClient,
  probeDom
}) {
  const prepared = prepareRoot({ ReactDOMClient, probeDom, id: "warnings-root" });
  if (!prepared.createRoot.ok) {
    return preparedFailure(prepared);
  }

  const callbackSecondArg = attemptOperation(
    "root.render callback second arg",
    () =>
      prepared.root.render(
        React.createElement("div", null, "callback"),
        function afterRender() {}
      )
  );
  const containerSecondArg = attemptOperation(
    "root.render container second arg",
    () =>
      prepared.root.render(
        React.createElement("div", null, "container"),
        probeDom.document.createElement("section")
      )
  );
  const genericSecondArg = attemptOperation(
    "root.render generic second arg",
    () =>
      prepared.root.render(React.createElement("div", null, "generic"), {
        unexpected: true
      })
  );
  const unmountCallback = attemptOperation("root.unmount callback argument", () =>
    prepared.root.unmount(function afterUnmount() {})
  );

  const duplicateContainer = createAttachedContainer(
    probeDom,
    "duplicate-warning-root"
  );
  probeDom.takeMutationLog();
  const duplicateFirst = attemptOperation("first createRoot duplicate", () =>
    ReactDOMClient.createRoot(duplicateContainer)
  );
  const duplicateSecond = attemptOperation("second createRoot duplicate", () =>
    ReactDOMClient.createRoot(duplicateContainer)
  );

  return {
    createRoot: prepared.createRoot.record,
    callbackSecondArg: callbackSecondArg.record,
    containerSecondArg: containerSecondArg.record,
    genericSecondArg: genericSecondArg.record,
    unmountCallback: unmountCallback.record,
    duplicateFirst: duplicateFirst.record,
    duplicateSecond: duplicateSecond.record,
    duplicateMarker: summarizeReactMarkers(duplicateContainer),
    mutationRemainder: probeDom.takeMutationLog()
  };
}

function prepareRoot({ ReactDOMClient, probeDom, id }) {
  const container = createAttachedContainer(probeDom, id);
  probeDom.takeMutationLog();
  const createRoot = attemptOperation(
    `createRoot ${id}`,
    () => ReactDOMClient.createRoot(container),
    describeRoot
  );
  const markerAfterCreate = summarizeReactMarkers(container);
  const createRootMutations = probeDom.takeMutationLog();
  return {
    container,
    createRoot,
    createRootMutations,
    markerAfterCreate,
    root: createRoot.value
  };
}

function mountInitialRoot({ React, ReactDOM, ReactDOMClient, probeDom, id }) {
  const prepared = prepareRoot({ ReactDOMClient, probeDom, id });
  if (!prepared.createRoot.ok) {
    return {
      ok: false,
      value: preparedFailure(prepared)
    };
  }

  const initialFlushSync = attemptOperation("flushSync initial root.render", () =>
    ReactDOM.flushSync(() => prepared.root.render(initialElement(React)))
  );
  const initialMutations = probeDom.takeMutationLog();

  return {
    ok: true,
    container: prepared.container,
    createRoot: prepared.createRoot,
    initialFlushSync,
    initialMutations,
    markerAfterCreate: prepared.markerAfterCreate,
    root: prepared.root,
    treeAfterInitialRender: dumpNode(prepared.container)
  };
}

function preparedFailure(prepared) {
  return {
    createRoot: prepared.createRoot.record,
    markerAfterCreate: prepared.markerAfterCreate,
    createRootMutations: prepared.createRootMutations,
    treeAfterCreate: dumpNode(prepared.container)
  };
}

function initialElement(React) {
  return React.createElement(
    "div",
    {
      id: "message",
      className: "root-card",
      title: "initial title",
      "data-phase": "initial"
    },
    "hello"
  );
}

function updatedElement(React) {
  return React.createElement(
    "div",
    {
      id: "message",
      className: "root-card updated",
      title: "updated title",
      "data-phase": "updated"
    },
    "goodbye"
  );
}

function createAttachedContainer(probeDom, id) {
  const container = probeDom.document.createElement("div");
  container.setAttribute("id", id);
  probeDom.document.body.appendChild(container);
  return container;
}

function attemptOperation(label, operation, describe = describeValue) {
  const consoleStart = consoleCalls.length;
  try {
    const value = operation();
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

function describeRoot(root) {
  if (!root || typeof root !== "object") {
    return describeValue(root);
  }

  const descriptors = Object.getOwnPropertyDescriptors(root);
  const prototype = Object.getPrototypeOf(root);
  const internalDescriptor = descriptors._internalRoot;
  return {
    type: "object",
    objectTag: Object.prototype.toString.call(root),
    ownPropertyNames: Object.getOwnPropertyNames(root),
    internalRootSlot: internalDescriptor
      ? {
          enumerable: internalDescriptor.enumerable,
          configurable: internalDescriptor.configurable,
          writable: internalDescriptor.writable,
          value: summarizeInternalRoot(internalDescriptor.value)
        }
      : null,
    prototype: prototype
      ? {
          constructorName: prototype.constructor?.name ?? null,
          ownPropertyNames: Object.getOwnPropertyNames(prototype),
          methods: Object.getOwnPropertyNames(prototype)
            .map((key) => [key, prototype[key]])
            .filter(([, value]) => typeof value === "function")
            .map(([key, value]) => ({
              key,
              name: value.name,
              length: value.length
            }))
        }
      : null
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

  return {
    type: "object",
    objectTag: Object.prototype.toString.call(internalRoot),
    tag: internalRoot.tag ?? null,
    pendingLanes: internalRoot.pendingLanes ?? null,
    callbackPriority: internalRoot.callbackPriority ?? null,
    current: internalRoot.current
      ? {
          tag: internalRoot.current.tag ?? null,
          mode: internalRoot.current.mode ?? null,
          lanes: internalRoot.current.lanes ?? null,
          childLanes: internalRoot.current.childLanes ?? null
        }
      : null
  };
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
      ownPropertyNames: Object.getOwnPropertyNames(value)
    };
  }
  return {
    type: valueType
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
  return describeValue(arg);
}

function summarizeReactMarkers(node) {
  if (!node || typeof node !== "object") {
    return {
      inspectable: false,
      reactContainerMarkerCount: 0,
      reactContainerMarkerValueStates: [],
      reactListeningMarkerCount: 0,
      reactListeningMarkerValueStates: []
    };
  }

  const names = Object.getOwnPropertyNames(node);
  const containerNames = names
    .filter((name) => name.startsWith("__reactContainer$"))
    .sort();
  const listeningNames = names
    .filter((name) => name.startsWith("_reactListening"))
    .sort();

  return {
    inspectable: true,
    reactContainerMarkerCount: containerNames.length,
    reactContainerMarkerValueStates: containerNames.map((name) =>
      describeMarkerValueState(node[name])
    ),
    reactListeningMarkerCount: listeningNames.length,
    reactListeningMarkerValueStates: listeningNames.map((name) =>
      describeMarkerValueState(node[name])
    )
  };
}

function describeMarkerValueState(value) {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (value === true || value === false) {
    return `boolean:${value}`;
  }
  if (typeof value === "object") {
    return "object";
  }
  return typeof value;
}

function summarizeEventTarget(target) {
  const listenerLog = target?._listenerLog ?? [];
  const byEvent = new Map();
  for (const listener of listenerLog) {
    const current =
      byEvent.get(listener.type) ??
      {
        type: listener.type,
        capture: 0,
        bubble: 0
      };
    if (listener.capture) {
      current.capture += 1;
    } else {
      current.bubble += 1;
    }
    byEvent.set(listener.type, current);
  }
  return {
    listenerCount: listenerLog.length,
    uniqueTypeCount: byEvent.size,
    selectedEntries: ["click", "selectionchange", "scroll", "wheel"]
      .map((type) => byEvent.get(type))
      .filter(Boolean)
  };
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
  if (node.nodeType === DOCUMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE) {
    return {
      nodeType: node.nodeType,
      nodeName: node.nodeName,
      childCount: node.childNodes.length,
      children: node.childNodes.map(dumpNode)
    };
  }
  return {
    nodeType: node.nodeType,
    nodeName: node.nodeName,
    localName: node.localName ?? null,
    namespaceURI: node.namespaceURI ?? null,
    id: node.id ?? null,
    className: node.className ?? null,
    attributes: [...(node.attributes?.entries?.() ?? [])].sort(([left], [right]) =>
      left.localeCompare(right)
    ),
    style: node.style?.toJSON?.() ?? null,
    textContent: node.textContent,
    childCount: node.childNodes.length,
    children: node.childNodes.map(dumpNode)
  };
}

function installProbeDom() {
  const mutationLog = [];
  const document = new MinimalDocument("primary", mutationLog);
  const window = new MinimalWindow(document, "primary");
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
    SVGElement: {
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

  mutationLog.splice(0, mutationLog.length);

  return {
    document,
    window,
    takeMutationLog() {
      return mutationLog.splice(0, mutationLog.length);
    }
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
      type: record.type,
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
    this._mutationLog.push({
      type: "insertBefore",
      parent: describeNodeForLog(this),
      child: describeNodeForLog(child),
      before: beforeChild ? describeNodeForLog(beforeChild) : null
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
      parent: describeNodeForLog(this),
      child: describeNodeForLog(child)
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
    const text = value == null ? "" : String(value);
    for (const child of this.childNodes) {
      child.parentNode = null;
    }
    this.childNodes = [];
    this._mutationLog.push({
      type: "setTextContent",
      target: describeNodeForLog(this),
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
MinimalNode.DOCUMENT_POSITION_DISCONNECTED = 1;
MinimalNode.DOCUMENT_POSITION_PRECEDING = 2;
MinimalNode.DOCUMENT_POSITION_FOLLOWING = 4;
MinimalNode.DOCUMENT_POSITION_CONTAINS = 8;
MinimalNode.DOCUMENT_POSITION_CONTAINED_BY = 16;

class MinimalCharacterData extends MinimalNode {
  constructor({ mutationLog, nodeName, nodeType, nodeValue, ownerDocument }) {
    super({ mutationLog, nodeName, nodeType, ownerDocument });
    this._nodeValue = String(nodeValue);
  }

  get nodeValue() {
    return this._nodeValue;
  }

  set nodeValue(value) {
    this._nodeValue = value == null ? "" : String(value);
    this._mutationLog.push({
      type: "setNodeValue",
      target: describeNodeForLog(this),
      value: this._nodeValue
    });
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

class MinimalText extends MinimalCharacterData {
  constructor(text, ownerDocument, mutationLog) {
    super({
      mutationLog,
      nodeName: "#text",
      nodeType: TEXT_NODE,
      nodeValue: text,
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
      nodeValue: text,
      ownerDocument
    });
  }
}

class MinimalElement extends MinimalNode {
  constructor(tagName, ownerDocument, mutationLog, namespaceURI = HTML_NAMESPACE) {
    const normalizedName = String(tagName);
    super({
      mutationLog,
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
    this.style = createStyleDeclaration(this, mutationLog);
    this.tagName = this.nodeName;
    this.className = "";
    this.id = "";
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
    this._mutationLog.push({
      type: "setAttribute",
      target: describeNodeForLog(this),
      name: normalizedName,
      value: normalizedValue
    });
  }

  setAttributeNS(namespace, name, value) {
    this.setAttribute(name, value);
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
    this._mutationLog.push({
      type: "removeAttribute",
      target: describeNodeForLog(this),
      name: normalizedName
    });
  }

  removeAttributeNS(_namespace, name) {
    this.removeAttribute(name);
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
  constructor(label, mutationLog) {
    super({
      mutationLog,
      nodeName: "#document",
      nodeType: DOCUMENT_NODE,
      ownerDocument: null
    });
    this._targetLabel = label;
    this.ownerDocument = this;
    this.defaultView = null;
    this.documentElement = new MinimalElement("html", this, mutationLog);
    this.body = new MinimalElement("body", this, mutationLog);
    this.activeElement = this.body;
    this.implementation = {
      createHTMLDocument: (title = "") => new MinimalDocument(String(title), mutationLog)
    };
    super.appendChild(this.documentElement);
    this.documentElement.appendChild(this.body);
  }

  createElement(tagName) {
    return new MinimalElement(tagName, this, this._mutationLog, HTML_NAMESPACE);
  }

  createElementNS(namespaceURI, qualifiedName) {
    const namespace =
      namespaceURI || String(qualifiedName).toLowerCase() === "svg"
        ? namespaceURI || SVG_NAMESPACE
        : HTML_NAMESPACE;
    return new MinimalElement(
      qualifiedName,
      this,
      this._mutationLog,
      namespace
    );
  }

  createTextNode(text) {
    return new MinimalText(String(text), this, this._mutationLog);
  }

  createComment(text) {
    return new MinimalComment(String(text), this, this._mutationLog);
  }

  createDocumentFragment() {
    return new MinimalDocumentFragment(this, this._mutationLog);
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
      userAgent: "fast-react-root-render-e2e-oracle"
    };
    this.location = {
      protocol: "http:"
    };
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

function createStyleDeclaration(element, mutationLog) {
  const properties = new Map();
  const target = {
    setProperty(name, value) {
      const key = String(name);
      const normalizedValue = String(value);
      properties.set(key, normalizedValue);
      mutationLog.push({
        type: "styleSetProperty",
        target: describeNodeForLog(element),
        name: key,
        value: normalizedValue
      });
    },
    removeProperty(name) {
      const key = String(name);
      const previous = properties.get(key) ?? "";
      properties.delete(key);
      mutationLog.push({
        type: "styleRemoveProperty",
        target: describeNodeForLog(element),
        name: key
      });
      return previous;
    },
    toJSON() {
      return [...properties.entries()].sort(([left], [right]) =>
        left.localeCompare(right)
      );
    }
  };

  return new Proxy(target, {
    get(styleTarget, property, receiver) {
      if (typeof property === "string" && properties.has(property)) {
        return properties.get(property);
      }
      return Reflect.get(styleTarget, property, receiver);
    },
    set(styleTarget, property, value, receiver) {
      if (typeof property === "string" && !(property in styleTarget)) {
        properties.set(property, value == null ? "" : String(value));
        mutationLog.push({
          type: "styleSet",
          target: describeNodeForLog(element),
          name: property,
          value: value == null ? "" : String(value)
        });
        return true;
      }
      return Reflect.set(styleTarget, property, value, receiver);
    }
  });
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

function describeNodeForLog(node) {
  if (!node) {
    return null;
  }
  if (node.nodeType === TEXT_NODE || node.nodeType === COMMENT_NODE) {
    return {
      nodeName: node.nodeName,
      text: node.nodeValue
    };
  }
  return {
    nodeName: node.nodeName ?? null,
    id: node.id || node.getAttribute?.("id") || null
  };
}

main();
