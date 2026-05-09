export const SCHEDULER_MOCK_SCENARIOS = [
  {
    id: "scheduler-mock-export-shape",
    area: "Mock exports and constants",
    entrypoints: ["scheduler/unstable_mock"],
    captures: [
      "package identity",
      "mock export key order",
      "export descriptors",
      "priority constant values",
      "function names and lengths",
      "absence of unstable_NoPriority"
    ]
  },
  {
    id: "scheduler-mock-virtual-time-and-logs",
    area: "Virtual time and logs",
    entrypoints: ["scheduler/unstable_mock"],
    captures: [
      "initial virtual time",
      "advanceTime mutates virtual time",
      "log and clearLog behavior",
      "disable-yield-value behavior for logs and virtual time"
    ]
  },
  {
    id: "scheduler-mock-task-object-shape",
    area: "Task object shape and virtual timeout buckets",
    entrypoints: ["scheduler/unstable_mock"],
    captures: [
      "returned task own-key order",
      "ready task sortIndex role",
      "delayed task sortIndex role",
      "priority timeout buckets",
      "cancellation tombstone mutation"
    ]
  },
  {
    id: "scheduler-mock-priority-context",
    area: "Priority context APIs",
    entrypoints: ["scheduler/unstable_mock"],
    captures: [
      "default current priority",
      "runWithPriority priority coercion and restoration",
      "priority restoration after throws",
      "next priority lowering rules",
      "wrapCallback priority capture with this and argument forwarding"
    ]
  },
  {
    id: "scheduler-mock-priority-flush-order",
    area: "Priority ordering and flushAllWithoutAsserting",
    entrypoints: ["scheduler/unstable_mock"],
    captures: [
      "ready callback execution order across public priorities",
      "didTimeout values from virtual expiration",
      "log order",
      "pending-work state before and after flushing"
    ]
  },
  {
    id: "scheduler-mock-flush-helpers",
    area: "Flush helper return and assertion behavior",
    entrypoints: ["scheduler/unstable_mock"],
    captures: [
      "empty flush helper return values",
      "flushAll pre-existing log assertion",
      "flushAll yielded-value assertion",
      "flushNumberOfYields stop behavior"
    ]
  },
  {
    id: "scheduler-mock-pending-delayed-expired",
    area: "Pending, delayed, expired, and cancelled work",
    entrypoints: ["scheduler/unstable_mock"],
    captures: [
      "ready work flushes before delayed work",
      "advanceTime moves delayed work into pending work",
      "flushExpired only flushes expired work",
      "delayed cancellation prevents callback execution"
    ]
  },
  {
    id: "scheduler-mock-continuations-and-paint",
    area: "Continuation callbacks and paint yielding",
    entrypoints: ["scheduler/unstable_mock"],
    captures: [
      "callback return function is stored as a continuation",
      "continuation runs before lower-priority work",
      "flushUntilNextPaint stops after requestPaint",
      "paint-yielded continuation remains pending"
    ]
  },
  {
    id: "scheduler-mock-reset-behavior",
    area: "Reset behavior and reset guards",
    entrypoints: ["scheduler/unstable_mock"],
    captures: [
      "reset clears virtual time, log, and scheduled callback handles",
      "reset while flushing throws",
      "reset with pending work clears scheduled handles but stale queue state can keep fresh equal-priority work non-flushable"
    ]
  }
];

export const SCHEDULER_MOCK_SCENARIO_IDS = SCHEDULER_MOCK_SCENARIOS.map(
  (scenario) => scenario.id
);
