export const SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH =
  "oracles/scheduler-0.27.0-variant-oracle.json";

export const SCHEDULER_VARIANT_TARGET = {
  packageName: "scheduler",
  version: "0.27.0",
  role: "react-dom-scheduler-runtime-dependency",
  targetStatus: "supporting-package-not-official-react-target",
  expectedDistIntegrity:
    "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
  expectedDistShasum: "0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd"
};

export const SCHEDULER_VARIANT_PROBE_MODES = [
  {
    id: "node-development",
    nodeEnv: "development",
    nodeArgs: [],
    reason:
      "Development mode selects scheduler development CJS wrappers and exposes development-only direct deep-import behavior."
  },
  {
    id: "node-production",
    nodeEnv: "production",
    nodeArgs: [],
    reason:
      "Production mode selects scheduler production CJS wrappers and exposes production-only direct deep-import behavior."
  }
];

export const SCHEDULER_VARIANT_SCENARIOS = [
  {
    id: "package-metadata-and-resolution",
    area: "package metadata and physical subpath exposure",
    entrypoints: [
      "scheduler",
      "scheduler/package.json",
      "scheduler/index.js",
      "scheduler/index.native.js",
      "scheduler/unstable_mock",
      "scheduler/unstable_post_task",
      "scheduler/cjs/*"
    ]
  },
  {
    id: "unstable-mock",
    area: "scheduler/unstable_mock deterministic test scheduler helpers",
    entrypoints: ["scheduler/unstable_mock"]
  },
  {
    id: "unstable-post-task-plain-node",
    area: "scheduler/unstable_post_task plain Node failure",
    entrypoints: ["scheduler/unstable_post_task"]
  },
  {
    id: "unstable-post-task-shimmed",
    area: "scheduler/unstable_post_task Task Scheduling API behavior",
    entrypoints: ["scheduler/unstable_post_task"]
  },
  {
    id: "unstable-post-task-without-yield",
    area: "scheduler/unstable_post_task continuation fallback",
    entrypoints: ["scheduler/unstable_post_task"]
  },
  {
    id: "native-fallback",
    area: "scheduler/index.native.js fallback behavior",
    entrypoints: ["scheduler/index.native.js"]
  },
  {
    id: "native-runtime-delegation",
    area: "scheduler/index.native.js nativeRuntimeScheduler delegation",
    entrypoints: ["scheduler/index.native.js"]
  },
  {
    id: "deep-cjs-require",
    area: "direct physical CJS import behavior",
    entrypoints: ["scheduler/cjs/*"]
  }
];

export const SCHEDULER_VARIANT_SCENARIO_IDS =
  SCHEDULER_VARIANT_SCENARIOS.map((scenario) => scenario.id);

export const SCHEDULER_VARIANT_RESOLUTION_SPECIFIERS = [
  "scheduler",
  "scheduler/package.json",
  "scheduler/index.js",
  "scheduler/index.native.js",
  "scheduler/unstable_mock",
  "scheduler/unstable_mock.js",
  "scheduler/unstable_post_task",
  "scheduler/unstable_post_task.js",
  "scheduler/cjs/scheduler.development.js",
  "scheduler/cjs/scheduler.production.js",
  "scheduler/cjs/scheduler.native.development.js",
  "scheduler/cjs/scheduler.native.production.js",
  "scheduler/cjs/scheduler-unstable_mock.development.js",
  "scheduler/cjs/scheduler-unstable_mock.production.js",
  "scheduler/cjs/scheduler-unstable_post_task.development.js",
  "scheduler/cjs/scheduler-unstable_post_task.production.js"
];

export const SCHEDULER_VARIANT_DEEP_CJS_SPECIFIERS = [
  "scheduler/cjs/scheduler.development.js",
  "scheduler/cjs/scheduler.production.js",
  "scheduler/cjs/scheduler.native.development.js",
  "scheduler/cjs/scheduler.native.production.js",
  "scheduler/cjs/scheduler-unstable_mock.development.js",
  "scheduler/cjs/scheduler-unstable_mock.production.js",
  "scheduler/cjs/scheduler-unstable_post_task.development.js",
  "scheduler/cjs/scheduler-unstable_post_task.production.js"
];

export const SCHEDULER_VARIANT_GATE_DECISIONS = [
  {
    surface: "scheduler/package.json and package root shape",
    recommendation: "first-milestone-gate",
    reason:
      "scheduler@0.27.0 has no exports map, no explicit main, no type, no runtime dependencies, and exposes package metadata to Node consumers."
  },
  {
    surface: "scheduler/unstable_mock",
    recommendation: "first-milestone-gate",
    reason:
      "The mock scheduler is a real public subpath and is required before upstream React-style scheduler tests can be reused deterministically."
  },
  {
    surface: "root physical JavaScript entry files",
    recommendation: "first-milestone-importability-gate",
    reason:
      "The absence of an exports map means Node consumers can import index.js, unstable_mock.js, unstable_post_task.js, and index.native.js directly; first package scaffolds should not accidentally block these paths."
  },
  {
    surface: "scheduler/unstable_post_task behavior",
    recommendation: "documented-gap",
    reason:
      "This variant depends on browser Task Scheduling API globals and is not used by shipped React DOM Node/CJS bundles; it needs a controlled browser-like harness before behavior compatibility is claimed."
  },
  {
    surface: "scheduler/index.native.js behavior",
    recommendation: "documented-gap",
    reason:
      "The native variant matters for React Native-style consumers, but the first DOM-focused scheduler milestone can document the fallback/delegation shape without implementing it."
  },
  {
    surface: "scheduler/cjs/* physical deep imports",
    recommendation: "documented-gap-with-importability-evidence",
    reason:
      "Every shipped CJS file is physically deep-importable because there is no exports map. Exact behavior is compatibility-sensitive but broad CJS parity should follow root and mock behavior."
  }
];

export const SCHEDULER_VARIANT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-005-upstream-tests.md",
  "worker-progress/worker-007-scheduler-fiber.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-034-scheduler-package-inventory.md"
];
