export const ELEMENT_OBJECT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-element-object-oracle.json";

export const ELEMENT_OBJECT_REACT_TARGET = {
  packageName: "react",
  version: "19.2.6",
  role: "official-react-runtime-target"
};

export const ELEMENT_OBJECT_FAST_REACT_TARGET = {
  packageName: "@fast-react/react",
  version: "0.0.0",
  role: "workspace-fast-react-js-element-factory",
  expectedStatus: "matches-or-known-mismatch-without-compatibility-claim"
};

export const ELEMENT_OBJECT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development element objects expose warning getters, debug fields, and frozen objects."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production element objects are mutable and omit development diagnostics."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition has separate React and JSX runtime entrypoint behavior in development."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "The react-server condition has separate React and JSX runtime entrypoint behavior in production."
  }
];

export const ELEMENT_OBJECT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-004-api-inventory.md",
  "worker-progress/worker-014-react-entrypoint-placeholders.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-020-element-object-conformance-probes.md"
];
