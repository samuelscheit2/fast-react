export const REACT_DOM_EVENT_PRIORITY_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-event-priority-oracle.json";

export const REACT_DOM_EVENT_PRIORITY_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_EVENT_PRIORITY_REACT_SOURCE_TARGET = {
  repository: "facebook/react",
  tag: "v19.2.6",
  tagObjectSha: "2fcbe419ed90f863e6f67ce5b9738f38dbec640b",
  commit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
  role: "pinned-react-source-target"
};

export const REACT_DOM_EVENT_PRIORITY_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-runtime-target"
};

export const REACT_DOM_EVENT_PRIORITY_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-package-evidence"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-and-message-priority-evidence"
  }
];

export const REACT_DOM_EVENT_PRIORITY_FAST_REACT_TARGETS = [
  {
    packageName: "@fast-react/react-dom",
    version: "0.0.0",
    role: "workspace-fast-react-react-dom-placeholder"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "workspace-fast-react-scheduler-placeholder"
  }
];

export const REACT_DOM_EVENT_PRIORITY_SOURCE_FILES = [
  "ReactVersions.js",
  "packages/react-dom-bindings/src/events/ReactDOMEventListener.js",
  "packages/react-dom-bindings/src/events/DOMEventNames.js",
  "packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js",
  "packages/react-reconciler/src/ReactEventPriorities.js",
  "packages/react-reconciler/src/ReactFiberLane.js"
];

export const REACT_DOM_EVENT_PRIORITY_COMPILED_PACKAGE_FILES = [
  "cjs/react-dom-client.development.js",
  "cjs/react-dom-client.production.js"
];

export const REACT_DOM_EVENT_PRIORITY_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-007-scheduler-fiber.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-030-core-lane-model.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-041-dom-events-priority-plan.md",
  REACT_DOM_EVENT_PRIORITY_RUNTIME_INVENTORY_PATH
];
