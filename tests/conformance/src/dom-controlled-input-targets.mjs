export const DOM_CONTROLLED_INPUT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-dom-controlled-input-oracle.json";

export const DOM_CONTROLLED_INPUT_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const DOM_CONTROLLED_INPUT_REACT_DOM_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-controlled-input-target"
};

export const DOM_CONTROLLED_INPUT_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-controlled-form-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-client-form-probes"
  }
];

export const DOM_CONTROLLED_INPUT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Development mode captures controlled/uncontrolled and read-only form warnings plus observable DOM property writes."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Production mode captures the same form control output without development-only warnings."
  }
];

export const DOM_CONTROLLED_INPUT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-040-dom-mutation-renderer-plan.md",
  "worker-progress/worker-041-dom-events-priority-plan.md",
  "worker-progress/worker-061-dom-attribute-property-oracle.md",
  DOM_CONTROLLED_INPUT_RUNTIME_INVENTORY_PATH
];
