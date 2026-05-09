import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node react-dom-resource-hints-probe-runner.mjs <package> <scenario>"
  );
}

const RESOURCE_HINT_APIS = [
  "prefetchDNS",
  "preconnect",
  "preload",
  "preloadModule",
  "preinit",
  "preinitModule"
];

const DISPATCHER_METHODS = ["f", "r", "D", "C", "L", "m", "S", "X", "M"];
const DOM_INTERNALS_KEY =
  "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE";

function main() {
  const scenario = scenarios[scenarioId];
  if (!scenario) {
    throw new Error(`Unknown React DOM resource hint scenario: ${scenarioId}`);
  }

  const result = captureScenarioOperation(scenarioId, () =>
    scenario(targetPackage)
  );
  process.stdout.write(
    JSON.stringify({
      targetPackage,
      scenarioId,
      result
    })
  );
}

const scenarios = {
  "resource-hint-export-shape": (target) => {
    const ReactDOM = loadReactDom(target);
    return {
      module: describeModuleResourceShape(ReactDOM),
      dispatcher: describeDefaultDispatcher(ReactDOM)
    };
  },

  "default-dispatcher-public-calls": (target) => {
    const ReactDOM = loadReactDom(target);
    return capturePublicCalls(ReactDOM, [
      [
        "prefetchDNS-valid",
        () => ReactDOM.prefetchDNS("https://dns.example.test")
      ],
      [
        "preconnect-no-options",
        () => ReactDOM.preconnect("https://connect.example.test")
      ],
      [
        "preconnect-use-credentials",
        () =>
          ReactDOM.preconnect("https://connect.example.test", {
            crossOrigin: "use-credentials"
          })
      ],
      [
        "preload-font",
        () =>
          ReactDOM.preload("/font.woff2", {
            as: "font",
            crossOrigin: "use-credentials",
            fetchPriority: "high",
            integrity: "sha256-font",
            media: "print",
            referrerPolicy: "no-referrer",
            type: "font/woff2"
          })
      ],
      [
        "preload-module-default",
        () => ReactDOM.preloadModule("/entry.mjs")
      ],
      [
        "preload-module-worker",
        () =>
          ReactDOM.preloadModule("/worker.mjs", {
            as: "worker",
            crossOrigin: "anonymous",
            integrity: "sha256-worker"
          })
      ],
      [
        "preinit-style",
        () =>
          ReactDOM.preinit("/style.css", {
            as: "style",
            crossOrigin: "anonymous",
            fetchPriority: "low",
            integrity: "sha256-style",
            precedence: "theme"
          })
      ],
      [
        "preinit-script",
        () =>
          ReactDOM.preinit("/script.js", {
            as: "script",
            crossOrigin: "use-credentials",
            fetchPriority: "high",
            integrity: "sha256-script",
            nonce: "nonce-script"
          })
      ],
      [
        "preinit-module-default",
        () => ReactDOM.preinitModule("/module-default.mjs")
      ],
      [
        "preinit-module-script",
        () =>
          ReactDOM.preinitModule("/module-script.mjs", {
            as: "script",
            crossOrigin: "anonymous",
            integrity: "sha256-module",
            nonce: "nonce-module"
          })
      ]
    ]);
  },

  "argument-validation-warnings": (target) => {
    const ReactDOM = loadReactDom(target);
    return capturePublicCalls(ReactDOM, [
      ["prefetchDNS-undefined", () => ReactDOM.prefetchDNS()],
      [
        "prefetchDNS-empty-crossOrigin",
        () => ReactDOM.prefetchDNS("", { crossOrigin: "anonymous" })
      ],
      [
        "prefetchDNS-extra-crossOrigin",
        () =>
          ReactDOM.prefetchDNS("https://dns.example.test", {
            crossOrigin: "anonymous"
          })
      ],
      ["preconnect-null-href", () => ReactDOM.preconnect(null)],
      [
        "preconnect-primitive-options",
        () => ReactDOM.preconnect("https://connect.example.test", "anonymous")
      ],
      [
        "preconnect-null-crossOrigin",
        () =>
          ReactDOM.preconnect("https://connect.example.test", {
            crossOrigin: null
          })
      ],
      ["preload-empty-href", () => ReactDOM.preload("", { as: "script" })],
      ["preload-missing-options", () => ReactDOM.preload("/asset.js")],
      [
        "preload-empty-as",
        () => ReactDOM.preload("/asset.js", { as: "" })
      ],
      [
        "preloadModule-empty-href-options-number",
        () => ReactDOM.preloadModule("", 1)
      ],
      [
        "preloadModule-null-as",
        () => ReactDOM.preloadModule("/module.mjs", { as: null })
      ],
      [
        "preinit-empty-href",
        () => ReactDOM.preinit("", { as: "style" })
      ],
      ["preinit-null-options", () => ReactDOM.preinit("/asset.js", null)],
      [
        "preinit-image-as",
        () => ReactDOM.preinit("/asset.png", { as: "image" })
      ],
      ["preinitModule-empty-href", () => ReactDOM.preinitModule("", {})],
      [
        "preinitModule-string-options",
        () => ReactDOM.preinitModule("/module.mjs", "script")
      ],
      [
        "preinitModule-style-as",
        () => ReactDOM.preinitModule("/module.css", { as: "style" })
      ]
    ]);
  },

  "private-dispatcher-normalization": (target) => {
    const ReactDOM = loadReactDom(target);
    return captureDispatcherCalls(ReactDOM, [
      ["prefetchDNS-empty", () => ReactDOM.prefetchDNS("")],
      [
        "prefetchDNS-extra-options",
        () =>
          ReactDOM.prefetchDNS("https://dns.example.test", {
            crossOrigin: "anonymous"
          })
      ],
      [
        "preconnect-no-options",
        () => ReactDOM.preconnect("https://connect.example.test")
      ],
      [
        "preconnect-anonymous",
        () =>
          ReactDOM.preconnect("https://connect.example.test", {
            crossOrigin: "anonymous"
          })
      ],
      [
        "preconnect-use-credentials",
        () =>
          ReactDOM.preconnect("https://connect.example.test", {
            crossOrigin: "use-credentials"
          })
      ],
      [
        "preload-font-use-credentials",
        () =>
          ReactDOM.preload("/font.woff2", {
            as: "font",
            crossOrigin: "use-credentials",
            fetchPriority: "high",
            integrity: "sha256-font",
            media: "print",
            nonce: "nonce-font",
            referrerPolicy: "no-referrer",
            type: "font/woff2"
          })
      ],
      [
        "preload-image-anonymous",
        () =>
          ReactDOM.preload("/image.png", {
            as: "image",
            crossOrigin: "anonymous",
            imageSizes: "100vw",
            imageSrcSet: "/image.png 1x, /image@2x.png 2x"
          })
      ],
      [
        "preload-empty-as",
        () => ReactDOM.preload("/empty-as", { as: "" })
      ],
      [
        "preloadModule-no-options",
        () => ReactDOM.preloadModule("/module-no-options.mjs")
      ],
      [
        "preloadModule-script",
        () =>
          ReactDOM.preloadModule("/module-script.mjs", {
            as: "script",
            crossOrigin: "use-credentials",
            integrity: "sha256-module-script"
          })
      ],
      [
        "preloadModule-worker",
        () =>
          ReactDOM.preloadModule("/module-worker.mjs", {
            as: "worker",
            crossOrigin: "anonymous",
            integrity: "sha256-module-worker"
          })
      ],
      [
        "preinit-style",
        () =>
          ReactDOM.preinit("/style.css", {
            as: "style",
            crossOrigin: "anonymous",
            fetchPriority: "low",
            integrity: "sha256-style",
            precedence: "theme"
          })
      ],
      [
        "preinit-script",
        () =>
          ReactDOM.preinit("/script.js", {
            as: "script",
            crossOrigin: "use-credentials",
            fetchPriority: "high",
            integrity: "sha256-script",
            nonce: "nonce-script"
          })
      ],
      [
        "preinitModule-no-options",
        () => ReactDOM.preinitModule("/module-no-options.mjs")
      ],
      [
        "preinitModule-script",
        () =>
          ReactDOM.preinitModule("/module-script.mjs", {
            as: "script",
            crossOrigin: "anonymous",
            integrity: "sha256-module-script",
            nonce: "nonce-module"
          })
      ],
      [
        "preinitModule-style-no-dispatch",
        () => ReactDOM.preinitModule("/module-style.mjs", { as: "style" })
      ]
    ]);
  },

  "private-dispatcher-absence": (target) => {
    const ReactDOM = loadReactDom(target);
    return {
      caveat:
        "These probes mutate ReactDOM private internals and are recorded only to document failure shape when the private dispatcher is absent or corrupted.",
      missingMethod: captureMissingDispatcherMethods(ReactDOM),
      nullDispatcher: captureWithDispatcherValue(
        ReactDOM,
        null,
        "prefetchDNS-null-dispatcher",
        () => ReactDOM.prefetchDNS("https://dns.example.test")
      )
    };
  }
};

main();

function loadReactDom(target) {
  return require(target);
}

function describeModuleResourceShape(ReactDOM) {
  const descriptors = Object.getOwnPropertyDescriptors(ReactDOM);
  const exports = {};
  for (const api of RESOURCE_HINT_APIS) {
    exports[api] = {
      descriptor: describeDescriptor(descriptors[api], 0),
      functionObject: describeValue(ReactDOM[api], 0)
    };
  }
  return {
    objectTag: Object.prototype.toString.call(ReactDOM),
    isExtensible: Object.isExtensible(ReactDOM),
    resourceHintExportKeys: RESOURCE_HINT_APIS.filter((api) =>
      Object.prototype.hasOwnProperty.call(ReactDOM, api)
    ),
    exports
  };
}

function describeDefaultDispatcher(ReactDOM) {
  const internals = ReactDOM[DOM_INTERNALS_KEY];
  const dispatcher = internals?.d;
  return {
    internalsExported: !!internals,
    dispatcherType: dispatcher === null ? "null" : typeof dispatcher,
    dispatcherOwnKeys:
      dispatcher && typeof dispatcher === "object" ? Reflect.ownKeys(dispatcher) : [],
    resourceMethods: Object.fromEntries(
      ["D", "C", "L", "m", "S", "X", "M"].map((method) => [
        method,
        describeValue(dispatcher?.[method], 0)
      ])
    )
  };
}

function capturePublicCalls(ReactDOM, calls) {
  return Object.fromEntries(
    calls.map(([label, fn]) => [label, captureWithConsole(label, fn)])
  );
}

function captureDispatcherCalls(ReactDOM, calls) {
  return Object.fromEntries(
    calls.map(([label, fn]) => [
      label,
      captureWithDispatcherSpy(ReactDOM, label, fn)
    ])
  );
}

function captureMissingDispatcherMethods(ReactDOM) {
  const calls = [
    ["prefetchDNS-missing-D", "D", () => ReactDOM.prefetchDNS("/dns")],
    [
      "preconnect-missing-C",
      "C",
      () => ReactDOM.preconnect("https://connect.example.test")
    ],
    [
      "preload-missing-L",
      "L",
      () => ReactDOM.preload("/asset.js", { as: "script" })
    ],
    [
      "preloadModule-missing-m",
      "m",
      () => ReactDOM.preloadModule("/module.mjs")
    ],
    [
      "preinit-style-missing-S",
      "S",
      () => ReactDOM.preinit("/style.css", { as: "style" })
    ],
    [
      "preinit-script-missing-X",
      "X",
      () => ReactDOM.preinit("/script.js", { as: "script" })
    ],
    [
      "preinitModule-missing-M",
      "M",
      () => ReactDOM.preinitModule("/module.mjs")
    ]
  ];

  return Object.fromEntries(
    calls.map(([label, missingMethod, fn]) => [
      label,
      captureWithMissingDispatcherMethod(ReactDOM, missingMethod, label, fn)
    ])
  );
}

function captureWithDispatcherSpy(ReactDOM, label, fn) {
  const dispatcherCalls = [];
  return captureWithDispatcherValue(
    ReactDOM,
    createDispatcherSpy(dispatcherCalls),
    label,
    fn,
    dispatcherCalls
  );
}

function captureWithMissingDispatcherMethod(
  ReactDOM,
  missingMethod,
  label,
  fn
) {
  const dispatcherCalls = [];
  const dispatcher = createDispatcherSpy(dispatcherCalls);
  dispatcher[missingMethod] = undefined;
  const result = captureWithDispatcherValue(
    ReactDOM,
    dispatcher,
    label,
    fn,
    dispatcherCalls
  );
  return {
    ...result,
    missingMethod
  };
}

function captureWithDispatcherValue(
  ReactDOM,
  dispatcher,
  label,
  fn,
  dispatcherCalls = []
) {
  const internals = ReactDOM[DOM_INTERNALS_KEY];
  const previousDispatcher = internals.d;
  internals.d = dispatcher;
  try {
    const result = captureWithConsole(label, fn);
    return {
      ...result,
      privateDispatcherMutated: true,
      dispatcherCalls: dispatcherCalls.slice()
    };
  } finally {
    internals.d = previousDispatcher;
  }
}

function createDispatcherSpy(dispatcherCalls) {
  const dispatcher = {};
  for (const method of DISPATCHER_METHODS) {
    dispatcher[method] = function dispatcherMethod(...args) {
      dispatcherCalls.push({
        method,
        args: args.map((arg) => describeValue(arg, 0)),
        thisValue: describeValue(this, 1)
      });
      return {
        dispatcherReturn: method
      };
    };
  }
  return dispatcher;
}

function captureWithConsole(label, fn) {
  const consoleCalls = [];
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  console.error = (...args) => {
    consoleCalls.push({
      method: "error",
      args: args.map((arg) => describeValue(arg, 0))
    });
  };
  console.warn = (...args) => {
    consoleCalls.push({
      method: "warn",
      args: args.map((arg) => describeValue(arg, 0))
    });
  };

  try {
    return {
      label,
      ...captureOperation(label, fn),
      consoleCalls
    };
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
}

function captureOperation(label, fn) {
  try {
    return {
      status: "ok",
      value: describeValue(fn(), 0)
    };
  } catch (error) {
    return {
      status: "throws",
      error: describeError(error)
    };
  }
}

function captureScenarioOperation(label, fn) {
  try {
    return {
      status: "ok",
      value: fn()
    };
  } catch (error) {
    return {
      status: "throws",
      error: describeError(error)
    };
  }
}

function describeError(error) {
  return {
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error)
  };
}

function describeDescriptor(descriptor, depth) {
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
      value: describeValue(descriptor.value, depth)
    };
  }

  return {
    ...base,
    get: describeAccessor(descriptor.get),
    set: describeAccessor(descriptor.set)
  };
}

function describeAccessor(value) {
  return typeof value === "function"
    ? {
        type: "function",
        name: value.name,
        length: value.length
      }
    : {
        type: typeof value
      };
}

function describeValue(value, depth) {
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
      length: value.length,
      isAsync: value.constructor?.name === "AsyncFunction",
      ownPropertyNames: Object.getOwnPropertyNames(value)
    };
  }

  if (valueType === "object") {
    return describeObject(value, depth);
  }

  return {
    type: valueType
  };
}

function describeObject(value, depth) {
  const ownKeys = Reflect.ownKeys(value);
  const summary = {
    type: "object",
    objectTag: Object.prototype.toString.call(value),
    isArray: Array.isArray(value),
    isExtensible: Object.isExtensible(value),
    objectKeys: Object.keys(value),
    ownPropertyNames: Object.getOwnPropertyNames(value),
    ownSymbolKeys: Object.getOwnPropertySymbols(value).map(describePropertyKey),
    ownKeys: ownKeys.map(describePropertyKey)
  };

  if (Array.isArray(value)) {
    return {
      ...summary,
      arrayLength: value.length,
      items:
        depth >= 2
          ? []
          : value.map((item) => describeValue(item, depth + 1))
    };
  }

  if (depth >= 2) {
    return summary;
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  return {
    ...summary,
    descriptors: ownKeys.map((key) => ({
      key: describePropertyKey(key),
      descriptor: describeDescriptor(descriptors[key], depth + 1)
    }))
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
