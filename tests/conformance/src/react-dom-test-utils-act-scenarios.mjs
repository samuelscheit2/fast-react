export const REACT_DOM_TEST_UTILS_ACT_SCENARIOS = [
  {
    id: "module-export-shape",
    area: "test-utils act export and public React.act relationship",
    entrypoints: ["react-dom/test-utils", "react"],
    captures: [
      "CommonJS export keys and descriptors",
      "dynamic import namespace keys and descriptors",
      "act function name, length, and own-key shape",
      "React.act presence across default, production, and react-server modes",
      "react-dom/test-utils act identity relative to React.act"
    ]
  },
  {
    id: "descriptor-mutability",
    area: "CommonJS and dynamic import descriptor behavior",
    entrypoints: ["react-dom/test-utils"],
    captures: [
      "CommonJS act descriptor writability",
      "CommonJS assignment and delete behavior",
      "dynamic import namespace descriptor shape",
      "dynamic import namespace assignment and delete failures",
      "default and module.exports interop after CommonJS mutation"
    ]
  },
  {
    id: "deprecation-warning-dedup",
    area: "ReactDOMTestUtils.act deprecation warning policy",
    entrypoints: ["react-dom/test-utils"],
    captures: [
      "first call warning",
      "second call deduplication",
      "callback invocation count when React.act is available",
      "callback non-invocation when React.act is absent"
    ]
  },
  {
    id: "sync-callback-return",
    area: "sync callback return behavior",
    entrypoints: ["react-dom/test-utils", "react"],
    captures: [
      "returned act thenable shape",
      "thenable settlement value",
      "callback invocation count",
      "observable parity with React.act in default development",
      "production and react-server absence of React.act"
    ]
  },
  {
    id: "async-callback-return",
    area: "async callback return behavior",
    entrypoints: ["react-dom/test-utils", "react"],
    captures: [
      "Promise-returning callback behavior",
      "returned act thenable shape",
      "thenable resolved value",
      "callback invocation count",
      "observable parity with React.act in default development"
    ]
  },
  {
    id: "callback-throws",
    area: "synchronous thrown callback errors",
    entrypoints: ["react-dom/test-utils", "react"],
    captures: [
      "synchronous callback throw propagation",
      "thrown error name and message",
      "callback invocation count",
      "React.act absence errors before callback invocation"
    ]
  },
  {
    id: "async-callback-rejects",
    area: "async rejected callback errors",
    entrypoints: ["react-dom/test-utils", "react"],
    captures: [
      "Promise-rejecting callback behavior",
      "returned thenable rejection",
      "rejected error name and message",
      "callback invocation count",
      "observable parity with React.act in default development"
    ]
  },
  {
    id: "thenable-classification",
    area: "thenable detection and settlement",
    entrypoints: ["react-dom/test-utils", "react"],
    captures: [
      "object thenable detection",
      "function with then property treated as sync return",
      "object with non-function then treated as sync return",
      "null return handling",
      "then callback invocation side effects"
    ]
  },
  {
    id: "async-not-awaited-warning",
    area: "async act without awaiting returned thenable",
    entrypoints: ["react-dom/test-utils"],
    captures: [
      "deprecation warning",
      "React act async no-await warning",
      "returned thenable shape without settlement",
      "callback invocation count"
    ]
  }
];

export const REACT_DOM_TEST_UTILS_ACT_SCENARIO_IDS =
  REACT_DOM_TEST_UTILS_ACT_SCENARIOS.map((scenario) => scenario.id);
