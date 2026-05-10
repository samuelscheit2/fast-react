export const SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH =
  "oracles/scheduler-0.27.0-root-oracle.json";

export const SCHEDULER_ROOT_TARGET = {
  packageName: "scheduler",
  version: "0.27.0",
  role: "official-public-scheduler-root-target",
  expectedDistIntegrity:
    "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
  expectedDistShasum: "0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd"
};

export const SCHEDULER_ROOT_FAST_REACT_TARGET = {
  packageName: "fast-react-scheduler",
  sourcePackageName: "scheduler",
  version: "0.27.0",
  role: "local-fast-react-scheduler-root-implementation",
  targetStatus: "local-workspace-implementation-copied-under-isolated-alias"
};

export const SCHEDULER_ROOT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "The public scheduler root entrypoint selects cjs/scheduler.development.js when NODE_ENV is not production."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "The public scheduler root entrypoint selects cjs/scheduler.production.js when NODE_ENV is production."
  }
];

export const SCHEDULER_ROOT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-007-scheduler-fiber.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-034-scheduler-package-inventory.md",
  "worker-progress/worker-164-scheduler-regression-tests.md"
];
