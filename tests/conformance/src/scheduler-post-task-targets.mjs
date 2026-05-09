export const SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH =
  "oracles/scheduler-0.27.0-post-task-oracle.json";

export const SCHEDULER_POST_TASK_TARGET = {
  packageName: "scheduler",
  version: "0.27.0",
  entrypoint: "scheduler/unstable_post_task",
  role: "official-scheduler-post-task-variant-target",
  targetStatus: "browser-task-scheduling-api-dependent-variant",
  expectedDistIntegrity:
    "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
  expectedDistShasum: "0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd"
};

export const SCHEDULER_POST_TASK_PROBE_MODES = [
  {
    id: "node-development",
    nodeEnv: "development",
    nodeArgs: [],
    reason:
      "The scheduler/unstable_post_task wrapper selects cjs/scheduler-unstable_post_task.development.js when NODE_ENV is not production."
  },
  {
    id: "node-production",
    nodeEnv: "production",
    nodeArgs: [],
    reason:
      "The scheduler/unstable_post_task wrapper selects cjs/scheduler-unstable_post_task.production.js when NODE_ENV is production."
  }
];

export const SCHEDULER_POST_TASK_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-007-scheduler-fiber.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-034-scheduler-package-inventory.md",
  "worker-progress/worker-038-scheduler-root-oracle.md",
  "worker-progress/worker-039-scheduler-variant-oracles.md"
];
