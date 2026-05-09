export const REACT_DOM_FLUSH_SYNC_BATCHING_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-flush-sync-batching-oracle.json";

export const REACT_DOM_FLUSH_SYNC_BATCHING_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_FLUSH_SYNC_BATCHING_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-runtime-target"
};

export const REACT_DOM_FLUSH_SYNC_BATCHING_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-flush-sync-batching-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role:
      "react-dom-runtime-dependency-needed-for-public-priority-observation"
  }
];

export const REACT_DOM_FLUSH_SYNC_BATCHING_ENTRYPOINTS = [
  {
    id: "root",
    subpath: ".",
    publicSpecifier: "react-dom",
    reason:
      "The root React DOM facade publicly exports flushSync and unstable_batchedUpdates in default Node modes."
  },
  {
    id: "profiling",
    subpath: "./profiling",
    publicSpecifier: "react-dom/profiling",
    reason:
      "The profiling facade re-exports the same public flushSync and unstable_batchedUpdates functions while also exposing client root APIs."
  }
];

export const REACT_DOM_FLUSH_SYNC_BATCHING_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development captures callable shape, diagnostics, and rootless behavior for the development bundles."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production captures callable shape and behavior for the production bundles."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition records public absence or unsupported entrypoint loading for these client-only APIs."
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

export const REACT_DOM_FLUSH_SYNC_BATCHING_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-036-react-dom-export-oracle.md",
  "worker-progress/worker-041-dom-events-priority-plan.md",
  "worker-progress/worker-044-react-dom-client-roots-plan.md",
  REACT_DOM_FLUSH_SYNC_BATCHING_RUNTIME_INVENTORY_PATH
];
