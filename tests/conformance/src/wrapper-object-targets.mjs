export const WRAPPER_OBJECT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-wrapper-object-oracle.json";

export const WRAPPER_OBJECT_REACT_TARGET = {
  packageName: "react",
  version: "19.2.6",
  role: "official-react-runtime-target"
};

export const WRAPPER_OBJECT_FAST_REACT_TARGET = {
  packageName: "@fast-react/react",
  version: "0.0.0",
  role: "workspace-fast-react-js-wrapper-object",
  expectedStatus: "matches-without-compatibility-claim"
};

export const WRAPPER_OBJECT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development memo/lazy wrapper objects include development-only observable fields and warnings."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production memo/lazy wrapper objects omit development-only fields and warnings."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server root entrypoint exposes memo/lazy wrappers from a separate React bundle in development."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "The react-server root entrypoint exposes memo/lazy wrappers from a separate React bundle in production."
  }
];

export const WRAPPER_OBJECT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-004-api-inventory.md",
  "worker-progress/worker-014-react-entrypoint-placeholders.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-021-element-object-oracle.md",
  "worker-progress/worker-023-js-element-factory.md",
  "worker-progress/worker-024-create-ref-behavior.md",
  "worker-progress/worker-025-children-helpers.md"
];
