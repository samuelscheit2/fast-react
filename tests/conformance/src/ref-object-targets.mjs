export const REF_OBJECT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-ref-object-oracle.json";

export const REF_OBJECT_REACT_TARGET = {
  packageName: "react",
  version: "19.2.6",
  role: "official-react-runtime-target"
};

export const REF_OBJECT_FAST_REACT_TARGET = {
  packageName: "@fast-react/react",
  version: "0.0.0",
  role: "workspace-fast-react-js-create-ref",
  expectedStatus: "matches-without-compatibility-claim"
};

export const REF_OBJECT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development createRef returns a sealed mutable ref object."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production createRef returns an extensible mutable ref object."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition exposes createRef from a separate React root entrypoint in development."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "The react-server condition exposes createRef from a separate React root entrypoint in production."
  }
];

export const REF_OBJECT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-004-api-inventory.md",
  "worker-progress/worker-014-react-entrypoint-placeholders.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-020-element-object-conformance-probes.md",
  "worker-progress/worker-021-element-object-oracle.md",
  "worker-progress/worker-023-js-element-factory.md"
];
