export const DOM_EVENT_DELEGATION_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-dom-event-delegation-oracle.json";

export const DOM_EVENT_DELEGATION_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const DOM_EVENT_DELEGATION_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-client-event-target"
};

export const DOM_EVENT_DELEGATION_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-event-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-event-probes"
  }
];

export const DOM_EVENT_DELEGATION_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development probes delegated React DOM event registration and synthetic event dispatch with development diagnostics enabled."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production probes the same delegated event behavior against the production React DOM client bundle."
  }
];

export const DOM_EVENT_DELEGATION_EVENT_EXAMPLES = [
  {
    id: "click",
    nativeEventName: "click",
    reactProp: "onClick",
    family: "mouse",
    category: "discrete-example",
    reason:
      "Click is the canonical delegated discrete mouse event used for capture, bubble, stopPropagation, preventDefault, and synthetic event shape evidence."
  },
  {
    id: "mousemove",
    nativeEventName: "mousemove",
    reactProp: "onMouseMove",
    family: "mouse",
    category: "continuous-example",
    reason:
      "Mouse move is a delegated continuous mouse event with normal capture and bubble dispatch."
  },
  {
    id: "wheel",
    nativeEventName: "wheel",
    reactProp: "onWheel",
    family: "wheel",
    category: "continuous-example",
    reason:
      "Wheel is a delegated continuous event whose root listener registration uses passive browser event options when support is detected."
  }
];

export const DOM_EVENT_DELEGATION_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-041-dom-events-priority-plan.md",
  DOM_EVENT_DELEGATION_RUNTIME_INVENTORY_PATH
];
