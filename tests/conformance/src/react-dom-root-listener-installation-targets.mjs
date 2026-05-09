export const REACT_DOM_ROOT_LISTENER_INSTALLATION_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json";

export const REACT_DOM_ROOT_LISTENER_INSTALLATION_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_ROOT_LISTENER_INSTALLATION_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-client-root-listener-target"
};

export const REACT_DOM_ROOT_LISTENER_INSTALLATION_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-root-listener-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-root-listener-probes"
  }
];

export const REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development probes createRoot, hydrateRoot, and portal listener installation with development diagnostics enabled."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production probes the same createRoot, hydrateRoot, and portal listener installation behavior against the production React DOM client bundle."
  }
];

export const REACT_DOM_ROOT_LISTENER_INSTALLATION_DELEGATED_EVENT_EXAMPLES = [
  {
    id: "click",
    nativeEventName: "click",
    expectedCaptureCount: 1,
    expectedBubbleCount: 1,
    expectedPassiveTrueCount: 0,
    reason:
      "Click is a canonical delegated root event with both capture and bubble listeners."
  },
  {
    id: "mousemove",
    nativeEventName: "mousemove",
    expectedCaptureCount: 1,
    expectedBubbleCount: 1,
    expectedPassiveTrueCount: 0,
    reason:
      "Mouse move is a delegated continuous event with capture and bubble root listeners."
  },
  {
    id: "wheel",
    nativeEventName: "wheel",
    expectedCaptureCount: 1,
    expectedBubbleCount: 1,
    expectedPassiveTrueCount: 2,
    reason:
      "Wheel is delegated and uses passive listener options when passive support is detected."
  },
  {
    id: "touchstart",
    nativeEventName: "touchstart",
    expectedCaptureCount: 1,
    expectedBubbleCount: 1,
    expectedPassiveTrueCount: 2,
    reason:
      "Touch start is delegated and uses passive listener options when passive support is detected."
  },
  {
    id: "touchmove",
    nativeEventName: "touchmove",
    expectedCaptureCount: 1,
    expectedBubbleCount: 1,
    expectedPassiveTrueCount: 2,
    reason:
      "Touch move is delegated and uses passive listener options when passive support is detected."
  }
];

export const REACT_DOM_ROOT_LISTENER_INSTALLATION_NON_DELEGATED_EVENT_EXAMPLES = [
  "beforetoggle",
  "cancel",
  "close",
  "scroll",
  "scrollend",
  "load",
  "error",
  "invalid",
  "toggle",
  "abort",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "encrypted",
  "ended",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "resize",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting"
].map((nativeEventName) => ({
  id: nativeEventName,
  nativeEventName,
  expectedCaptureCount: 1,
  expectedBubbleCount: 0,
  expectedPassiveTrueCount: 0,
  reason:
    "React DOM installs this non-delegated native event as a capture-only root listener during all-supported-event setup."
}));

export const REACT_DOM_ROOT_LISTENER_INSTALLATION_SELECTION_EVENT = {
  id: "selectionchange",
  nativeEventName: "selectionchange",
  expectedRootContainerCount: 0,
  expectedOwnerDocumentCaptureCount: 0,
  expectedOwnerDocumentBubbleCount: 1,
  reason:
    "React DOM installs selectionchange on the owner document rather than the root or portal container."
};

export const REACT_DOM_ROOT_LISTENER_INSTALLATION_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-041-dom-events-priority-plan.md",
  "worker-progress/worker-044-react-dom-client-roots-plan.md",
  "worker-progress/worker-055-react-dom-client-roots-implementation-plan.md",
  "worker-progress/worker-057-react-dom-portal-oracle.md",
  "worker-progress/worker-065-dom-event-delegation-oracle.md",
  REACT_DOM_ROOT_LISTENER_INSTALLATION_RUNTIME_INVENTORY_PATH
];
