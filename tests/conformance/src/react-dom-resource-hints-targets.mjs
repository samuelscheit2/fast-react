export const REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-resource-hints-oracle.json";

export const REACT_DOM_RESOURCE_HINT_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_RESOURCE_HINT_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-resource-hint-target"
};

export const REACT_DOM_RESOURCE_HINT_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-resource-hint-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-kept-in-the-isolated-node-modules-tree"
  }
];

export const REACT_DOM_RESOURCE_HINT_APIS = [
  "prefetchDNS",
  "preconnect",
  "preload",
  "preloadModule",
  "preinit",
  "preinitModule"
];

export const REACT_DOM_RESOURCE_HINT_PRIVATE_DISPATCHER_METHODS = [
  "D",
  "C",
  "L",
  "m",
  "S",
  "X",
  "M"
];

export const REACT_DOM_RESOURCE_HINT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development captures public warnings, return values, and private dispatcher normalization for the root React DOM facade."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production captures the warning-free production root facade while preserving resource dispatcher argument normalization."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "React Server Components development captures the narrowed root facade and its development resource-hint diagnostics."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "React Server Components production captures the narrowed warning-free root resource-hint facade."
  }
];

export const REACT_DOM_RESOURCE_HINT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-036-react-dom-export-oracle.md",
  REACT_DOM_RESOURCE_HINT_RUNTIME_INVENTORY_PATH
];
