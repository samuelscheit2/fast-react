export const SCHEDULER_POST_TASK_SCENARIOS = [
  {
    id: "scheduler-post-task-export-shape",
    area: "post-task export shape and descriptors",
    entrypoints: ["scheduler/unstable_post_task"],
    captures: [
      "package identity",
      "subpath resolution",
      "export key order",
      "priority constants",
      "export descriptors",
      "function names and lengths",
      "no-op paint and frame-rate APIs"
    ]
  },
  {
    id: "scheduler-post-task-environment-require",
    area: "post-task environment feature access",
    entrypoints: ["scheduler/unstable_post_task"],
    captures: [
      "plain Node missing-window import failure",
      "missing window.performance import failure",
      "load success with minimal window globals",
      "schedule failure when TaskController is absent",
      "schedule failure when global scheduler is absent",
      "schedule failure when scheduler.postTask is absent"
    ]
  },
  {
    id: "scheduler-post-task-priority-context",
    area: "post-task priority context APIs",
    entrypoints: ["scheduler/unstable_post_task"],
    captures: [
      "default current priority",
      "runWithPriority priority assignment and restoration",
      "invalid runWithPriority priority preservation",
      "priority restoration after throw",
      "next priority lowering rules",
      "wrapCallback priority capture and forwarding"
    ]
  },
  {
    id: "scheduler-post-task-scheduling",
    area: "post-task scheduling calls under a controlled Task Scheduling API shim",
    entrypoints: ["scheduler/unstable_post_task"],
    captures: [
      "public priority to postTask priority mapping",
      "delay option normalization",
      "returned task node and controller descriptor shape",
      "callback didTimeout argument",
      "current priority during callbacks",
      "deadline-based shouldYield behavior with controlled time"
    ]
  },
  {
    id: "scheduler-post-task-cancellation",
    area: "post-task cancellation through TaskController.abort",
    entrypoints: ["scheduler/unstable_post_task"],
    captures: [
      "cancelCallback return value",
      "controller signal aborted mutation",
      "abort event shape",
      "aborted task is skipped by the controlled shim"
    ]
  },
  {
    id: "scheduler-post-task-continuations",
    area: "post-task continuation scheduling fallback",
    entrypoints: ["scheduler/unstable_post_task"],
    captures: [
      "continuation uses scheduler.yield when available",
      "continuation falls back to scheduler.postTask when scheduler.yield is absent",
      "continuation preserves current priority",
      "continuation reuses the original signal"
    ]
  }
];

export const SCHEDULER_POST_TASK_SCENARIO_IDS =
  SCHEDULER_POST_TASK_SCENARIOS.map((scenario) => scenario.id);
