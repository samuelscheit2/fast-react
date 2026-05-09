export const REACT_DOM_FORM_ACTIONS_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-form-actions-oracle.json";

export const REACT_DOM_FORM_ACTIONS_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_FORM_ACTIONS_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-form-actions-target"
};

export const REACT_DOM_FORM_ACTIONS_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-form-action-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-form-action-probes"
  }
];

export const REACT_DOM_FORM_ACTIONS_API_NAMES = [
  "requestFormReset",
  "useFormState",
  "useFormStatus"
];

export const REACT_DOM_FORM_ACTIONS_RUNTIME_SUBPATH = ".";

export const REACT_DOM_FORM_ACTIONS_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development records public errors and development-only diagnostics."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production records minified public errors and production return shapes."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition removes the form-action root APIs and makes server rendering unavailable."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "Production react-server behavior is recorded separately for condition-specific absence and throws."
  }
];

export const REACT_DOM_FORM_ACTIONS_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-036-react-dom-export-oracle.md",
  "worker-progress/worker-040-dom-mutation-renderer-plan.md",
  "worker-progress/worker-041-dom-events-priority-plan.md",
  REACT_DOM_FORM_ACTIONS_RUNTIME_INVENTORY_PATH
];
