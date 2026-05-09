export const REACT_DOM_CLIENT_ROOT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-client-root-oracle.json";

export const REACT_DOM_CLIENT_ROOT_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_CLIENT_ROOT_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-client-root-target"
};

export const REACT_DOM_CLIENT_ROOT_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-client-root-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-client-root-probes"
  }
];

export const REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET = {
  packageName: "@fast-react/react-dom",
  version: "0.0.0",
  role: "workspace-fast-react-react-dom-placeholder",
  expectedStatus: "unsupported-placeholder-or-known-mismatch"
};

export const REACT_DOM_CLIENT_ROOT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development captures client-root warnings, root object shape, and callback option storage."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production captures the same public behavior without development warnings."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition makes react-dom/client and react-dom/profiling throw before root APIs are usable."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "Production react-server throwing branches are recorded separately because the package condition is public behavior."
  }
];

export const REACT_DOM_CLIENT_ROOT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-036-react-dom-export-oracle.md",
  "worker-progress/worker-044-react-dom-client-roots-plan.md",
  REACT_DOM_CLIENT_ROOT_RUNTIME_INVENTORY_PATH
];
