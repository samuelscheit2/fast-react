import { createRequire } from "node:module";
import { relative, sep } from "node:path";

const require = createRequire(import.meta.url);

const packageName = process.argv[2];
const scenarioId = process.argv[3];
const scenarioOptions = process.argv[4] ? JSON.parse(process.argv[4]) : {};

if (!packageName || !scenarioId) {
  throw new Error(
    "Usage: node scheduler-native-entry-probe-runner.mjs <packageName> <scenarioId> [jsonOptions]"
  );
}

const ROOT_EXPORT_KEYS = [
  "unstable_now",
  "unstable_IdlePriority",
  "unstable_ImmediatePriority",
  "unstable_LowPriority",
  "unstable_NormalPriority",
  "unstable_Profiling",
  "unstable_UserBlockingPriority",
  "unstable_cancelCallback",
  "unstable_forceFrameRate",
  "unstable_getCurrentPriorityLevel",
  "unstable_next",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
  "unstable_shouldYield",
  "unstable_wrapCallback"
];

const NATIVE_EXPORT_KEYS = [
  "unstable_IdlePriority",
  "unstable_ImmediatePriority",
  "unstable_LowPriority",
  "unstable_NormalPriority",
  "unstable_Profiling",
  "unstable_UserBlockingPriority",
  "unstable_cancelCallback",
  "unstable_forceFrameRate",
  "unstable_getCurrentPriorityLevel",
  "unstable_next",
  "unstable_now",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
  "unstable_shouldYield",
  "unstable_wrapCallback"
];

const consoleCalls = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  consoleCalls.push({
    method: "error",
    args: args.map((arg) => describeValue(arg))
  });
};
console.warn = (...args) => {
  consoleCalls.push({
    method: "warn",
    args: args.map((arg) => describeValue(arg))
  });
};

try {
  const result = runScenario(scenarioId);
  process.stdout.write(JSON.stringify({ ...result, consoleCalls }));
} catch (error) {
  process.stdout.write(
    JSON.stringify({
      scenarioId,
      status: "throws",
      error: describeThrown(error),
      consoleCalls
    })
  );
  process.exit(0);
} finally {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}

function runScenario(id) {
  switch (id) {
    case "native-file-surface":
      return runNativeFileSurface();
    case "native-entry-loading":
      return runNativeEntryLoading();
    case "native-export-descriptors":
      return runNativeExportDescriptors();
    case "native-fallback-runtime":
      return runNativeFallbackRuntime();
    case "native-runtime-delegation":
      return runNativeRuntimeDelegation();
    case "native-default-relationship":
      return runNativeDefaultRelationship();
    case "direct-native-cjs-loading":
      return runDirectNativeCjsLoading();
    default:
      throw new Error(`Unknown scheduler native entry scenario: ${id}`);
  }
}

function runNativeFileSurface() {
  const packageJson = require(`${packageName}/package.json`);
  const resolutionSpecifiers = scenarioOptions.resolutionSpecifiers ?? [];

  return {
    scenarioId,
    status: "ok",
    packageJson: selectPackageJsonFields(packageJson),
    nativeConditionFields: {
      exports: packageJson.exports ?? null,
      main: packageJson.main ?? null,
      type: packageJson.type ?? null,
      browser: packageJson.browser ?? null,
      reactNative: packageJson["react-native"] ?? packageJson.reactNative ?? null
    },
    resolution: resolutionSpecifiers.map((specifier) =>
      probeResolve(specifier)
    )
  };
}

function runNativeEntryLoading() {
  installFallbackGlobals();
  const beforeFiles = loadedSchedulerFiles();
  const Scheduler = require(`${packageName}/index.native.js`);
  const afterFiles = loadedSchedulerFiles();
  const selectedNativeCjsFile =
    afterFiles.find((file) => /scheduler\.native\.(development|production)\.js$/u.test(file)) ??
    null;

  return {
    scenarioId,
    status: "ok",
    beforeFiles,
    afterFiles,
    selectedNativeCjsFile,
    module: describeModule(Scheduler),
    priorityConstants: readPriorityConstants(Scheduler)
  };
}

function runNativeExportDescriptors() {
  installFallbackGlobals();
  const Scheduler = require(`${packageName}/index.native.js`);
  const exportKeys = Object.keys(Scheduler);

  return {
    scenarioId,
    status: "ok",
    expectedNativeExportKeys: NATIVE_EXPORT_KEYS,
    exportKeys,
    ownKeys: Reflect.ownKeys(Scheduler).map(describeKey),
    constants: readPriorityConstants(Scheduler),
    unstableNoPriority: {
      hasIn: "unstable_NoPriority" in Scheduler,
      hasOwn: Object.hasOwn(Scheduler, "unstable_NoPriority")
    },
    descriptors: exportKeys.map((key) => ({
      key,
      descriptor: describeDescriptor(
        Object.getOwnPropertyDescriptor(Scheduler, key)
      )
    })),
    functionExports: exportKeys
      .filter((key) => typeof Scheduler[key] === "function")
      .map((key) => ({
        key,
        value: describeValue(Scheduler[key]),
        ownKeys: Reflect.ownKeys(Scheduler[key]).map(describeKey)
      }))
  };
}

function runNativeFallbackRuntime() {
  const globals = installFallbackGlobals();
  const Scheduler = require(`${packageName}/index.native.js`);
  const beforePaintShouldYield = Scheduler.unstable_shouldYield();
  const requestPaint = describeValue(Scheduler.unstable_requestPaint());
  const afterPaintShouldYield = Scheduler.unstable_shouldYield();
  const task = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => "should-not-run"
  );
  const taskBeforeCancel = describeNativeTask(task);
  Scheduler.unstable_cancelCallback(task);
  const taskAfterCancel = describeNativeTask(task);

  return {
    scenarioId,
    status: "ok",
    exportKeys: Object.keys(Scheduler),
    priorityConstants: readPriorityConstants(Scheduler),
    nowInitial: Scheduler.unstable_now(),
    currentPriority: Scheduler.unstable_getCurrentPriorityLevel(),
    shouldYield: {
      beforePaint: beforePaintShouldYield,
      requestPaint,
      afterPaint: afterPaintShouldYield
    },
    scheduledTask: {
      beforeCancel: taskBeforeCancel,
      afterCancel: taskAfterCancel
    },
    throwers: readNativeThrowers(Scheduler),
    hostEvents: globals.events
  };
}

function runNativeRuntimeDelegation() {
  const globals = installFallbackGlobals();
  const events = [];

  globalThis.nativeRuntimeScheduler = {
    unstable_ImmediatePriority: 11,
    unstable_UserBlockingPriority: 12,
    unstable_NormalPriority: 13,
    unstable_LowPriority: 14,
    unstable_IdlePriority: 15,
    unstable_scheduleCallback(priority, callback, options) {
      events.push([
        "schedule",
        priority,
        describeValue(callback),
        options?.delay ?? null
      ]);
      return {
        nativeTask: true,
        priority,
        delay: options?.delay ?? null
      };
    },
    unstable_cancelCallback(task) {
      events.push(["cancel", task.nativeTask === true, task.priority, task.delay]);
    },
    unstable_getCurrentPriorityLevel() {
      events.push(["getCurrentPriorityLevel"]);
      return 13;
    },
    unstable_shouldYield() {
      events.push(["shouldYield"]);
      return "native-should-yield";
    },
    unstable_requestPaint() {
      events.push(["requestPaint"]);
      return "native-request-paint";
    },
    unstable_now() {
      events.push(["now"]);
      return 123;
    },
    unstable_runWithPriority() {
      events.push(["unexpected-runWithPriority"]);
      return "unexpected-runWithPriority";
    },
    unstable_next() {
      events.push(["unexpected-next"]);
      return "unexpected-next";
    },
    unstable_wrapCallback() {
      events.push(["unexpected-wrapCallback"]);
      return "unexpected-wrapCallback";
    },
    unstable_forceFrameRate() {
      events.push(["unexpected-forceFrameRate"]);
      return "unexpected-forceFrameRate";
    }
  };

  const Scheduler = require(`${packageName}/index.native.js`);
  const task = Scheduler.unstable_scheduleCallback(12, () => "native-callback", {
    delay: 4
  });
  Scheduler.unstable_cancelCallback(task);

  return {
    scenarioId,
    status: "ok",
    exportKeys: Object.keys(Scheduler),
    priorityConstants: readPriorityConstants(Scheduler),
    scheduledTask: task,
    currentPriority: Scheduler.unstable_getCurrentPriorityLevel(),
    shouldYield: Scheduler.unstable_shouldYield(),
    now: Scheduler.unstable_now(),
    requestPaint: describeValue(Scheduler.unstable_requestPaint()),
    throwers: readNativeThrowers(Scheduler),
    nativeRuntimeEvents: events,
    fallbackHostEvents: globals.events
  };
}

function runNativeDefaultRelationship() {
  installFallbackGlobals();
  const Scheduler = require(packageName);
  const NativeScheduler = require(`${packageName}/index.native.js`);
  const schedulerKeys = Object.keys(Scheduler);
  const nativeKeys = Object.keys(NativeScheduler);

  return {
    scenarioId,
    status: "ok",
    defaultExportKeys: schedulerKeys,
    nativeExportKeys: nativeKeys,
    sortedExportNameSetsEqual:
      JSON.stringify([...schedulerKeys].sort()) ===
      JSON.stringify([...nativeKeys].sort()),
    exactExportOrderEqual: JSON.stringify(schedulerKeys) === JSON.stringify(nativeKeys),
    defaultOnlyExportKeys: schedulerKeys.filter(
      (key) => !nativeKeys.includes(key)
    ),
    nativeOnlyExportKeys: nativeKeys.filter((key) => !schedulerKeys.includes(key)),
    moduleIdentitySame: Scheduler === NativeScheduler,
    priorityConstantsEqual:
      JSON.stringify(readPriorityConstants(Scheduler)) ===
      JSON.stringify(readPriorityConstants(NativeScheduler)),
    defaultPriorityConstants: readPriorityConstants(Scheduler),
    nativePriorityConstants: readPriorityConstants(NativeScheduler),
    functionIdentityEqual: nativeKeys
      .filter((key) => typeof NativeScheduler[key] === "function")
      .map((key) => ({
        key,
        sameIdentity: Scheduler[key] === NativeScheduler[key],
        defaultValue: describeValue(Scheduler[key]),
        nativeValue: describeValue(NativeScheduler[key])
      })),
    defaultPriorityHelpers: {
      runWithPriorityUserBlocking: captureCall(() =>
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_UserBlockingPriority,
          () => Scheduler.unstable_getCurrentPriorityLevel()
        )
      ),
      nextInsideImmediate: captureCall(() =>
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_ImmediatePriority,
          () => Scheduler.unstable_next(() => Scheduler.unstable_getCurrentPriorityLevel())
        )
      ),
      wrapCallbackCapturedPriority: captureCall(() =>
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_UserBlockingPriority,
          () => {
            const wrapped = Scheduler.unstable_wrapCallback(() =>
              Scheduler.unstable_getCurrentPriorityLevel()
            );
            return Scheduler.unstable_runWithPriority(
              Scheduler.unstable_LowPriority,
              () => wrapped()
            );
          }
        )
      ),
      forceFrameRate: captureCall(() => Scheduler.unstable_forceFrameRate(60))
    },
    nativePriorityHelpers: readNativeThrowers(NativeScheduler),
    loadedFiles: loadedSchedulerFiles()
  };
}

function runDirectNativeCjsLoading() {
  installFallbackGlobals();
  const specifiers = scenarioOptions.directCjsSpecifiers ?? [];

  return {
    scenarioId,
    status: "ok",
    probes: specifiers.map((specifier) => probeRequire(specifier)),
    loadedFiles: loadedSchedulerFiles()
  };
}

function installFallbackGlobals() {
  const events = [];
  let now = 0;
  let nextHandleId = 1;

  globalThis.performance = {
    now: () => now
  };
  globalThis.setImmediate = (callback) => {
    const handle = { type: "setImmediate", id: nextHandleId++ };
    events.push(["setImmediate", handle.id, describeValue(callback)]);
    return handle;
  };
  globalThis.setTimeout = (callback, ms) => {
    const handle = { type: "setTimeout", id: nextHandleId++ };
    events.push(["setTimeout", ms, handle.id, describeValue(callback)]);
    return handle;
  };
  globalThis.clearTimeout = (handle) => {
    events.push(["clearTimeout", handle?.type ?? typeof handle, handle?.id ?? null]);
  };

  return {
    events,
    setNow(value) {
      now = value;
    }
  };
}

function readNativeThrowers(Scheduler) {
  return Object.fromEntries(
    [
      [
        "unstable_runWithPriority",
        () => Scheduler.unstable_runWithPriority(3, () => "never")
      ],
      ["unstable_next", () => Scheduler.unstable_next(() => "never")],
      [
        "unstable_wrapCallback",
        () => Scheduler.unstable_wrapCallback(() => "never")
      ],
      ["unstable_forceFrameRate", () => Scheduler.unstable_forceFrameRate(60)]
    ].map(([key, callback]) => [key, captureCall(callback)])
  );
}

function readPriorityConstants(Scheduler) {
  return {
    unstable_ImmediatePriority: Scheduler.unstable_ImmediatePriority,
    unstable_UserBlockingPriority: Scheduler.unstable_UserBlockingPriority,
    unstable_NormalPriority: Scheduler.unstable_NormalPriority,
    unstable_LowPriority: Scheduler.unstable_LowPriority,
    unstable_IdlePriority: Scheduler.unstable_IdlePriority,
    unstable_Profiling: Scheduler.unstable_Profiling
  };
}

function describeNativeTask(task) {
  return {
    ownKeys: Object.keys(task),
    id: task.id,
    callback: describeValue(task.callback),
    priorityLevel: task.priorityLevel,
    startTime: task.startTime,
    expirationTime: task.expirationTime,
    sortIndex: task.sortIndex
  };
}

function probeResolve(specifier) {
  try {
    return {
      specifier,
      status: "ok",
      path: normalizePath(require.resolve(specifier))
    };
  } catch (error) {
    return {
      specifier,
      ...describeThrown(error)
    };
  }
}

function probeRequire(specifier) {
  const resolution = probeResolve(specifier);

  try {
    return {
      specifier,
      requireResolve: resolution,
      require: describeModule(require(specifier))
    };
  } catch (error) {
    return {
      specifier,
      requireResolve: resolution,
      require: describeThrown(error)
    };
  }
}

function describeModule(moduleValue) {
  const exportKeys = Object.keys(moduleValue);
  const priorityConstants = ROOT_EXPORT_KEYS.some((key) => key in moduleValue)
    ? readPriorityConstants(moduleValue)
    : null;

  return {
    status: "ok",
    exportKeys,
    priorityConstants,
    exportDetails: exportKeys.map((key) => ({
      key,
      descriptor: describeDescriptor(Object.getOwnPropertyDescriptor(moduleValue, key))
    }))
  };
}

function describeDescriptor(descriptor) {
  if (!descriptor) {
    return null;
  }

  if ("value" in descriptor) {
    return {
      kind: "data",
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: descriptor.writable,
      value: describeValue(descriptor.value)
    };
  }

  return {
    kind: "accessor",
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get: describeValue(descriptor.get),
    set: describeValue(descriptor.set)
  };
}

function describeValue(value) {
  if (value === null) {
    return { type: "null" };
  }

  if (value === undefined) {
    return { type: "undefined" };
  }

  if (typeof value === "number") {
    return {
      type: "number",
      value: Number.isNaN(value) ? "NaN" : value
    };
  }

  if (typeof value === "string") {
    return {
      type: "string",
      value
    };
  }

  if (typeof value === "boolean") {
    return {
      type: "boolean",
      value
    };
  }

  if (typeof value === "symbol") {
    return {
      type: "symbol",
      key: Symbol.keyFor(value) ?? null,
      description: value.description ?? null,
      stringValue: String(value)
    };
  }

  if (typeof value === "function") {
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
      items: value.map(describeValue)
    };
  }

  if (typeof value === "object") {
    return {
      type: "object",
      objectTag: Object.prototype.toString.call(value),
      ownKeys: Reflect.ownKeys(value).map(describeKey)
    };
  }

  return {
    type: typeof value
  };
}

function describeKey(key) {
  if (typeof key === "symbol") {
    return {
      type: "symbol",
      key: Symbol.keyFor(key) ?? null,
      description: key.description ?? null
    };
  }

  return {
    type: "string",
    value: key
  };
}

function captureCall(callback) {
  try {
    return {
      status: "ok",
      value: describeValue(callback())
    };
  } catch (error) {
    return describeThrown(error);
  }
}

function describeThrown(error) {
  return {
    status: "throws",
    name: error?.name ?? null,
    code: error?.code ?? null,
    message:
      typeof error?.message === "string"
        ? normalizePathFragments(error.message)
        : String(error)
  };
}

function loadedSchedulerFiles() {
  return Object.keys(require.cache)
    .map((file) => normalizePath(file))
    .filter((file) => file.startsWith("node_modules/scheduler/"))
    .sort();
}

function normalizePath(path) {
  const relativePath = relative(process.cwd(), path).split(sep).join("/");
  if (relativePath.startsWith("node_modules/")) {
    return relativePath;
  }

  return "<outside-project>";
}

function normalizePathFragments(message) {
  return message
    .replace(/file:\/\/[^\s)]+/gu, "file://<path>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>");
}

function selectPackageJsonFields(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description ?? null,
    main: packageJson.main ?? null,
    type: packageJson.type ?? null,
    exports: packageJson.exports ?? null,
    browser: packageJson.browser ?? null,
    reactNative: packageJson["react-native"] ?? packageJson.reactNative ?? null,
    files: packageJson.files ?? null,
    dependencies: packageJson.dependencies ?? null,
    peerDependencies: packageJson.peerDependencies ?? null,
    engines: packageJson.engines ?? null,
    license: packageJson.license ?? null,
    repository: packageJson.repository ?? null,
    bugs: packageJson.bugs ?? null,
    homepage: packageJson.homepage ?? null
  };
}
