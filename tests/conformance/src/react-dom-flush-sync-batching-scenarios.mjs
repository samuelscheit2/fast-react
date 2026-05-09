export const REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIOS = [
  {
    id: "react-dom-flush-sync-batching-export-shape",
    area: "Public export callable shape",
    entrypoints: ["react-dom", "react-dom/profiling"],
    captures: [
      "module load status under default and react-server conditions",
      "flushSync and unstable_batchedUpdates own export presence",
      "export descriptors",
      "function names, lengths, and own-key order"
    ]
  },
  {
    id: "react-dom-flush-sync-batching-callback-contracts",
    area: "Callback return and argument contracts",
    entrypoints: ["react-dom", "react-dom/profiling"],
    captures: [
      "flushSync callback return forwarding",
      "flushSync callback this value and ignored extra arguments",
      "unstable_batchedUpdates callback return forwarding",
      "unstable_batchedUpdates first-argument forwarding and ignored extra arguments"
    ]
  },
  {
    id: "react-dom-flush-sync-batching-rootless-inputs",
    area: "Rootless and no-DOM behavior",
    entrypoints: ["react-dom", "react-dom/profiling"],
    captures: [
      "behavior without a DOM root",
      "behavior without global window or document",
      "flushSync missing and falsy callback behavior",
      "unstable_batchedUpdates missing and non-callable callback errors"
    ]
  },
  {
    id: "react-dom-flush-sync-batching-error-propagation",
    area: "Error propagation and restoration",
    entrypoints: ["react-dom", "react-dom/profiling"],
    captures: [
      "callback errors thrown through flushSync",
      "callback errors thrown through unstable_batchedUpdates",
      "subsequent calls still work after thrown callbacks",
      "public scheduler priority remains restored after thrown callbacks"
    ]
  },
  {
    id: "react-dom-flush-sync-batching-nested-calls",
    area: "Nested calls",
    entrypoints: ["react-dom", "react-dom/profiling"],
    captures: [
      "nested flushSync call order and return values",
      "nested unstable_batchedUpdates call order and return values",
      "flushSync inside unstable_batchedUpdates",
      "unstable_batchedUpdates inside flushSync"
    ]
  },
  {
    id: "react-dom-flush-sync-batching-public-scheduler-priority",
    area: "Public scheduler priority observation",
    entrypoints: ["react-dom", "react-dom/profiling"],
    captures: [
      "Scheduler.unstable_getCurrentPriorityLevel before, inside, and after flushSync",
      "Scheduler.unstable_getCurrentPriorityLevel before, inside, and after unstable_batchedUpdates",
      "runWithPriority contexts observed through public Scheduler APIs",
      "no private React DOM internals read for priority evidence"
    ]
  }
];

export const REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIO_IDS =
  REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIOS.map((scenario) => scenario.id);
