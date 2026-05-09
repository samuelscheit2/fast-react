export const REACT_TEST_RENDERER_ACT_SCENARIOS = [
  {
    id: "react-test-renderer-act-export-shape",
    area: "Public act and scheduler export shape",
    captures: [
      "react-test-renderer root export keys",
      "act export descriptor and relationship to React.act",
      "_Scheduler mock scheduler descriptor and key order",
      "selected development or production CJS files"
    ]
  },
  {
    id: "react-test-renderer-act-sync-update-flushing",
    area: "Synchronous act update flushing",
    captures: [
      "sync act returns a thenable that resolves to the callback return value",
      "create() does not synchronously commit before act flushes",
      "effect-driven state updates flush before act completes",
      "final toJSON output after the act scope"
    ]
  },
  {
    id: "react-test-renderer-act-async-contracts",
    area: "Awaited async act contracts",
    captures: [
      "awaited async act resolves to the async callback return value",
      "test renderer work scheduled inside async act flushes after the callback resolves",
      "passive effects flush during the awaited act scope",
      "development deprecation diagnostics remain deterministic"
    ]
  },
  {
    id: "react-test-renderer-act-warning-surfaces",
    area: "Deterministic act warnings",
    captures: [
      "missing IS_REACT_ACT_ENVIRONMENT warning while inside act",
      "unawaited async act warning after deterministic microtask flushing",
      "warning capture without real timers"
    ]
  },
  {
    id: "react-test-renderer-act-scheduler-exposure",
    area: "Mock Scheduler exposure",
    captures: [
      "_Scheduler is scheduler/unstable_mock",
      "mock scheduler priority constants",
      "log and clearLog behavior",
      "scheduled callback flush behavior without wall-clock assertions"
    ]
  },
  {
    id: "react-test-renderer-act-unstable-flush-sync",
    area: "Root unstable_flushSync behavior",
    captures: [
      "root object exposes unstable_flushSync",
      "root.update scheduled inside unstable_flushSync commits after the callback",
      "falsy callback and truthy non-function behavior",
      "callback error propagation and later flush recovery"
    ]
  },
  {
    id: "react-test-renderer-act-error-aggregation",
    area: "Thrown error propagation and aggregation",
    captures: [
      "sync act callback errors throw directly",
      "async act callback rejection rejects the act thenable",
      "multiple root render errors inside one act scope aggregate through AggregateError"
    ]
  }
];

export const REACT_TEST_RENDERER_ACT_SCENARIO_IDS =
  REACT_TEST_RENDERER_ACT_SCENARIOS.map((scenario) => scenario.id);
