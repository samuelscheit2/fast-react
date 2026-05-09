export const SCHEDULER_MOCK_ORACLE_ARTIFACT_PATH =
  "oracles/scheduler-0.27.0-mock-oracle.json";

export const SCHEDULER_MOCK_TARGET = {
  packageName: "scheduler",
  entrypoint: "scheduler/unstable_mock",
  version: "0.27.0",
  role: "official-public-scheduler-mock-target",
  targetStatus: "supporting-package-not-official-react-target",
  expectedDistIntegrity:
    "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
  expectedDistShasum: "0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd"
};

export const SCHEDULER_MOCK_FAST_REACT_TARGET = {
  packageName: "fast-react-scheduler",
  sourcePackageName: "scheduler",
  entrypoint: "fast-react-scheduler/unstable_mock",
  sourceEntrypoint: "scheduler/unstable_mock",
  version: "0.27.0",
  role: "local-fast-react-scheduler-implementation",
  targetStatus: "local-workspace-implementation-copied-under-isolated-alias"
};

export const SCHEDULER_MOCK_PROBE_MODES = [
  {
    id: "node-development",
    nodeEnv: "development",
    nodeArgs: [],
    condition: "default",
    reason:
      "scheduler/unstable_mock selects cjs/scheduler-unstable_mock.development.js when NODE_ENV is not production."
  },
  {
    id: "node-production",
    nodeEnv: "production",
    nodeArgs: [],
    condition: "default",
    reason:
      "scheduler/unstable_mock selects cjs/scheduler-unstable_mock.production.js when NODE_ENV is production."
  }
];

export const SCHEDULER_MOCK_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-034-scheduler-package-inventory.md",
  "worker-progress/worker-038-scheduler-root-oracle.md",
  "worker-progress/worker-039-scheduler-variant-oracles.md"
];
