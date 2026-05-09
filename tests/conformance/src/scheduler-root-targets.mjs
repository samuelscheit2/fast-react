export const SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH =
  "oracles/scheduler-0.27.0-root-oracle.json";

export const SCHEDULER_ROOT_TARGET = {
  packageName: "scheduler",
  version: "0.27.0",
  role: "official-public-scheduler-root-target"
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
  "worker-progress/worker-034-scheduler-package-inventory.md"
];
