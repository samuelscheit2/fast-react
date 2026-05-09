export const DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-dom-ref-callback-oracle.json";

export const DOM_REF_CALLBACK_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const DOM_REF_CALLBACK_REACT_DOM_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-runtime-target"
};

export const DOM_REF_CALLBACK_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-ref-callback-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-ref-callback-probes"
  }
];

export const DOM_REF_CALLBACK_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development captures synchronous createRoot ref commits plus StrictMode ref replay behavior."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production captures the same synchronous ref commit scenarios without development StrictMode replay."
  }
];

export const DOM_REF_CALLBACK_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-040-dom-mutation-renderer-plan.md",
  "worker-progress/worker-044-react-dom-client-roots-plan.md",
  DOM_REF_CALLBACK_RUNTIME_INVENTORY_PATH
];
