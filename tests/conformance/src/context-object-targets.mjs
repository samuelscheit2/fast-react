export const CONTEXT_OBJECT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-context-object-oracle.json";

export const CONTEXT_OBJECT_REACT_TARGET = {
  packageName: "react",
  version: "19.2.6",
  role: "official-react-runtime-target"
};

export const CONTEXT_OBJECT_FAST_REACT_TARGET = {
  packageName: "@fast-react/react",
  version: "0.0.0",
  role: "workspace-fast-react-js-create-context",
  expectedStatus: "matches-without-compatibility-claim"
};

export const CONTEXT_OBJECT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development createContext objects include development-only renderer slots."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production createContext objects omit development-only renderer slots."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server root entrypoint does not expose createContext in development."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "The react-server root entrypoint does not expose createContext in production."
  }
];

export const CONTEXT_OBJECT_SOURCE_DOCUMENTS = [
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
  "worker-progress/worker-025-children-helpers.md",
  "worker-progress/worker-026-memo-lazy-behavior.md",
  "worker-progress/worker-027-forward-ref-behavior.md"
];
