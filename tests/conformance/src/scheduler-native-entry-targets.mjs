export const SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH =
  "oracles/scheduler-0.27.0-native-entry-oracle.json";

export const SCHEDULER_NATIVE_ENTRY_TARGET = {
  packageName: "scheduler",
  version: "0.27.0",
  role: "official-public-scheduler-native-entry-target",
  targetStatus: "supporting-package-not-official-react-target",
  expectedDistIntegrity:
    "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
  expectedDistShasum: "0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd"
};

export const SCHEDULER_NATIVE_ENTRY_FAST_REACT_TARGET = {
  packageName: "scheduler",
  sourcePackageName: "scheduler",
  version: "0.27.0",
  role: "fast-react-local-scheduler-native-entry-implementation",
  targetStatus: "local-implementation-under-comparison"
};

export const SCHEDULER_NATIVE_ENTRY_PROBE_MODES = [
  {
    id: "node-development",
    nodeEnv: "development",
    nodeArgs: [],
    selectedNativeCjsFile: "node_modules/scheduler/cjs/scheduler.native.development.js",
    reason:
      "scheduler/index.native.js selects the native development CJS file whenever NODE_ENV is not exactly production."
  },
  {
    id: "node-production",
    nodeEnv: "production",
    nodeArgs: [],
    selectedNativeCjsFile: "node_modules/scheduler/cjs/scheduler.native.production.js",
    reason:
      "scheduler/index.native.js selects the native production CJS file when NODE_ENV is exactly production."
  }
];

export const SCHEDULER_NATIVE_ENTRY_SCENARIOS = [
  {
    id: "native-file-surface",
    area: "Published native file surface and Node resolution",
    entrypoints: [
      "scheduler/index.native.js",
      "scheduler/cjs/scheduler.native.development.js",
      "scheduler/cjs/scheduler.native.production.js"
    ],
    captures: [
      "package metadata has no exports, main, type, browser, or react-native condition fields",
      "native wrapper and native CJS files are physically resolvable",
      "resolution paths are normalized under node_modules"
    ]
  },
  {
    id: "native-entry-loading",
    area: "Native wrapper loading behavior",
    entrypoints: ["scheduler/index.native.js"],
    captures: [
      "NODE_ENV-dependent native CJS file selection",
      "loaded scheduler cache files without local temp paths",
      "native entrypoint module identity and priority constants"
    ]
  },
  {
    id: "native-export-descriptors",
    area: "Native export shape and descriptors",
    entrypoints: ["scheduler/index.native.js"],
    captures: [
      "export key order",
      "own key order",
      "data descriptor enumerability, configurability, and writability",
      "function names and lengths",
      "absence of unstable_NoPriority"
    ]
  },
  {
    id: "native-fallback-runtime",
    area: "Fallback runtime scheduling and unsupported APIs",
    entrypoints: ["scheduler/index.native.js"],
    captures: [
      "fallback priority constants",
      "fallback task object shape",
      "scheduleCallback host transport",
      "cancelCallback tombstone mutation",
      "requestPaint and shouldYield interaction",
      "runWithPriority, next, wrapCallback, and forceFrameRate throw Not implemented"
    ]
  },
  {
    id: "native-runtime-delegation",
    area: "nativeRuntimeScheduler delegation",
    entrypoints: ["scheduler/index.native.js"],
    captures: [
      "native runtime constants are exported",
      "scheduleCallback, cancelCallback, priority, yielding, paint, and now delegate to nativeRuntimeScheduler",
      "unsupported priority context helpers remain local Not implemented throwers"
    ]
  },
  {
    id: "native-default-relationship",
    area: "Relationship to the default scheduler entrypoint",
    entrypoints: ["scheduler", "scheduler/index.native.js"],
    captures: [
      "native and default entrypoints expose the same export name set",
      "native and default entrypoints have different export key order",
      "priority constants match in fallback mode",
      "native priority context helpers throw while default helpers execute",
      "native and default modules are distinct CommonJS modules"
    ]
  },
  {
    id: "direct-native-cjs-loading",
    area: "Direct native CJS file loading behavior",
    entrypoints: [
      "scheduler/cjs/scheduler.native.development.js",
      "scheduler/cjs/scheduler.native.production.js"
    ],
    captures: [
      "direct native development CJS require behavior",
      "direct native production CJS require behavior",
      "production NODE_ENV leaves the development CJS guard empty when imported directly"
    ]
  }
];

export const SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS =
  SCHEDULER_NATIVE_ENTRY_SCENARIOS.map((scenario) => scenario.id);

export const SCHEDULER_NATIVE_ENTRY_RESOLUTION_SPECIFIERS = [
  "scheduler",
  "scheduler/index.js",
  "scheduler/index.native.js",
  "scheduler/cjs/scheduler.development.js",
  "scheduler/cjs/scheduler.production.js",
  "scheduler/cjs/scheduler.native.development.js",
  "scheduler/cjs/scheduler.native.production.js",
  "scheduler/package.json"
];

export const SCHEDULER_NATIVE_ENTRY_DIRECT_CJS_SPECIFIERS = [
  "scheduler/cjs/scheduler.native.development.js",
  "scheduler/cjs/scheduler.native.production.js"
];

export const SCHEDULER_NATIVE_ENTRY_NATIVE_FILES = [
  "index.native.js",
  "cjs/scheduler.native.development.js",
  "cjs/scheduler.native.production.js"
];

export const SCHEDULER_NATIVE_ENTRY_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-007-scheduler-fiber.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-034-scheduler-package-inventory.md",
  "worker-progress/worker-038-scheduler-root-oracle.md",
  "worker-progress/worker-039-scheduler-variant-oracles.md"
];
