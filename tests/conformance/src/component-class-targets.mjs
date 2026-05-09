export const COMPONENT_CLASS_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-component-class-oracle.json";

export const COMPONENT_CLASS_REACT_TARGET = {
  packageName: "react",
  version: "19.2.6",
  role: "official-react-runtime-target"
};

export const COMPONENT_CLASS_FAST_REACT_TARGET = {
  packageName: "@fast-react/react",
  version: "0.0.0",
  role: "workspace-fast-react-js-component-class",
  expectedStatus: "matches-without-compatibility-claim"
};

export const COMPONENT_CLASS_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development Component and PureComponent expose dev-only deprecation accessors, frozen shared refs, and no-op updater warnings."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production Component and PureComponent omit dev-only deprecation accessors, frozen refs, and no-op updater warnings."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server root entrypoint does not expose Component or PureComponent in development."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "The react-server root entrypoint does not expose Component or PureComponent in production."
  }
];

export const COMPONENT_CLASS_SOURCE_DOCUMENTS = [
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
  "worker-progress/worker-027-forward-ref-behavior.md",
  "worker-progress/worker-028-create-context-behavior.md"
];
