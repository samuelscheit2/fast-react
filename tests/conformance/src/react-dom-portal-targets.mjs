export const REACT_DOM_PORTAL_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-portal-oracle.json";

export const REACT_DOM_PORTAL_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_PORTAL_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-create-portal-target"
};

export const REACT_DOM_PORTAL_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-create-portal-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-create-portal-probes"
  }
];

export const REACT_DOM_PORTAL_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development captures the CommonJS createPortal facade, development warnings, and portal object shape."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production captures production createPortal behavior without development-only warnings."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition proves createPortal is outside the React Server Components root surface."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "Production react-server condition records the same unsupported createPortal boundary through production branches."
  }
];

export const REACT_DOM_PORTAL_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-036-react-dom-export-oracle.md",
  "worker-progress/worker-040-dom-mutation-renderer-plan.md",
  REACT_DOM_PORTAL_RUNTIME_INVENTORY_PATH
];
