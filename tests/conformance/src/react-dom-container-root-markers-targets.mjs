export const REACT_DOM_CONTAINER_ROOT_MARKERS_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-container-root-markers-oracle.json";

export const REACT_DOM_CONTAINER_ROOT_MARKERS_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-container-root-marker-target"
};

export const REACT_DOM_CONTAINER_ROOT_MARKERS_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-create-root-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-create-root-probes"
  }
];

export const REACT_DOM_CONTAINER_ROOT_MARKERS_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development probes createRoot validation, marker cleanup, and duplicate-root diagnostics with development warnings enabled."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production probes createRoot validation and marker cleanup without development-only diagnostics."
  }
];

export const REACT_DOM_CONTAINER_ROOT_MARKERS_VALID_CONTAINER_CASES = [
  {
    id: "element",
    nodeType: 1,
    reason: "Element nodes are valid createRoot containers."
  },
  {
    id: "document",
    nodeType: 9,
    reason: "Document nodes are valid createRoot containers."
  },
  {
    id: "document-fragment",
    nodeType: 11,
    reason: "DocumentFragment nodes are valid createRoot containers."
  }
];

export const REACT_DOM_CONTAINER_ROOT_MARKERS_INVALID_CONTAINER_CASES = [
  {
    id: "null",
    nodeType: null,
    reason: "Null is rejected before any root marker side effect."
  },
  {
    id: "undefined",
    nodeType: null,
    reason: "Undefined is rejected before any root marker side effect."
  },
  {
    id: "plain-object",
    nodeType: null,
    reason: "Plain objects without a valid DOM nodeType are rejected."
  },
  {
    id: "text-node",
    nodeType: 3,
    reason: "Text nodes are not valid createRoot containers."
  },
  {
    id: "comment-mount-point",
    nodeType: 8,
    reason:
      "The stable 19.2.6 package rejects comment mount-point containers because comments-as-DOM-containers are disabled."
  },
  {
    id: "comment-other",
    nodeType: 8,
    reason: "Non-mount-point comments are rejected createRoot containers."
  }
];

export const REACT_DOM_CONTAINER_ROOT_MARKERS_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-044-react-dom-client-roots-plan.md",
  "worker-progress/worker-055-react-dom-client-roots-implementation-plan.md",
  REACT_DOM_CONTAINER_ROOT_MARKERS_RUNTIME_INVENTORY_PATH
];
