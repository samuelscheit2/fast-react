export const SCHEDULER_ROOT_SCENARIOS = [
  {
    id: "scheduler-root-export-shape",
    area: "Root exports and constants",
    entrypoints: ["scheduler"],
    captures: [
      "package identity",
      "root export key order",
      "export descriptors",
      "priority constant values",
      "function names and lengths",
      "absence of unstable_NoPriority"
    ]
  },
  {
    id: "scheduler-root-task-object-shape",
    area: "Scheduled task object shape and timeout categories",
    entrypoints: ["scheduler"],
    captures: [
      "returned task own-key order",
      "ready task sortIndex role",
      "delayed task sortIndex role",
      "priority timeout buckets",
      "delayed start bucket",
      "cancellation tombstone mutation"
    ]
  },
  {
    id: "scheduler-root-priority-ordering",
    area: "Priority ordering",
    entrypoints: ["scheduler"],
    captures: [
      "ready callback execution order across all public priorities",
      "current priority level while each callback executes"
    ]
  },
  {
    id: "scheduler-root-equal-priority-fifo",
    area: "Equal-priority FIFO",
    entrypoints: ["scheduler"],
    captures: [
      "same-priority callbacks preserve insertion order",
      "current priority level for FIFO callbacks"
    ]
  },
  {
    id: "scheduler-root-delayed-callbacks",
    area: "Delayed callbacks",
    entrypoints: ["scheduler"],
    captures: [
      "ready work runs before delayed work",
      "delayed task runs after becoming eligible",
      "delayed callback didTimeout value",
      "delayed cancellation prevents callback execution"
    ]
  },
  {
    id: "scheduler-root-cancellation",
    area: "Cancellation tombstones",
    entrypoints: ["scheduler"],
    captures: [
      "cancelCallback nulls the task callback",
      "cancelled ready work is skipped",
      "remaining ready work preserves order"
    ]
  },
  {
    id: "scheduler-root-continuations",
    area: "Continuation callbacks",
    entrypoints: ["scheduler"],
    captures: [
      "callback return function is stored as a continuation",
      "continuation runs before later same-priority work",
      "continuation keeps the same current priority level"
    ]
  },
  {
    id: "scheduler-root-did-timeout",
    area: "didTimeout callback argument",
    entrypoints: ["scheduler"],
    captures: [
      "Immediate callbacks receive didTimeout true",
      "UserBlocking callbacks receive didTimeout true after a blocked event loop",
      "Normal callbacks remain non-timeout under the same generous block"
    ]
  },
  {
    id: "scheduler-root-priority-context",
    area: "Priority context APIs",
    entrypoints: ["scheduler"],
    captures: [
      "default current priority",
      "runWithPriority priority coercion and restoration",
      "next priority lowering rules",
      "wrapCallback priority capture",
      "wrapCallback this, argument, and return forwarding"
    ]
  },
  {
    id: "scheduler-root-yield-paint-frame-rate",
    area: "Yield, paint, and frame-rate APIs",
    entrypoints: ["scheduler"],
    captures: [
      "shouldYield inside scheduled work",
      "requestPaint forces yielding",
      "requestPaint resets on the next host callback",
      "forceFrameRate accepts valid values",
      "forceFrameRate reports invalid values"
    ]
  },
  {
    id: "scheduler-root-node-host-transport",
    area: "Node host callback transport",
    entrypoints: ["scheduler"],
    captures: [
      "setImmediate is captured before requiring scheduler",
      "ready work is scheduled through setImmediate in Node",
      "transport evidence is recorded without temp paths"
    ]
  }
];

export const SCHEDULER_ROOT_SCENARIO_IDS = SCHEDULER_ROOT_SCENARIOS.map(
  (scenario) => scenario.id
);
