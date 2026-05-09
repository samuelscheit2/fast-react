export const REACT_ACT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-act-oracle.json";

export const REACT_ACT_REACT_TARGET = {
  packageName: "react",
  version: "19.2.6",
  role: "official-react-runtime-target"
};

export const REACT_ACT_FAST_REACT_TARGET = {
  packageName: "@fast-react/react",
  version: "0.0.0",
  role: "workspace-fast-react-js-react-act",
  expectedStatus: "unsupported-or-known-mismatch-without-compatibility-claim"
};

export const REACT_ACT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development is the only React root mode with callable public act behavior."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production records public act absence on the CommonJS root facade."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition records public act absence on the server-safe React root facade."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "Production react-server behavior is checked separately because it loads production condition branches."
  }
];

export const REACT_ACT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-025-children-helpers.md",
  "worker-progress/worker-067-react-dom-test-utils-act-oracle.md (not present in this worktree)",
  "worker-progress/worker-073-test-renderer-update-model-plan.md",
  "worker-progress/worker-086-react-test-renderer-act-oracle.md (not present in this worktree)"
];
