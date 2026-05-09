export const WRAPPER_OBJECT_SCENARIOS = [
  {
    id: "wrapper-export-shape",
    area: "memo/lazy exports",
    entrypoints: ["react"],
    captures: [
      "root export descriptors",
      "function names and lengths",
      "function own-key order",
      "function property descriptors"
    ]
  },
  {
    id: "memo-wrapper-object",
    area: "memo wrapper object",
    entrypoints: ["react"],
    captures: [
      "valid and invalid type values",
      "$$typeof tag",
      "type and compare values",
      "own-key order and descriptors",
      "prototype",
      "freeze, seal, and extensibility state",
      "development nullish-type warnings",
      "development displayName accessor"
    ]
  },
  {
    id: "memo-arguments-and-display-name",
    area: "memo invocation details",
    entrypoints: ["react"],
    captures: [
      "omitted, null, undefined, function, and non-function compare values",
      "extra arguments",
      "call, apply, bind, and constructor this handling",
      "development displayName setter side effects",
      "production displayName assignment behavior"
    ]
  },
  {
    id: "lazy-wrapper-object",
    area: "lazy wrapper object",
    entrypoints: ["react"],
    captures: [
      "valid and invalid loader values without invoking them",
      "$$typeof tag",
      "_payload and _init values",
      "own-key order and descriptors",
      "prototype",
      "freeze, seal, and extensibility state",
      "development _debugInfo and _ioInfo fields"
    ]
  },
  {
    id: "lazy-init-behavior",
    area: "lazy direct _init behavior",
    entrypoints: ["react"],
    captures: [
      "fulfilled thenables",
      "rejected thenables",
      "pending thenables",
      "throwing loaders",
      "non-thenable loader results",
      "missing default module warnings",
      "undefined module behavior",
      "payload status/result mutation",
      "development thenable instrumentation"
    ]
  }
];

export const WRAPPER_OBJECT_SCENARIO_IDS = WRAPPER_OBJECT_SCENARIOS.map(
  (scenario) => scenario.id
);
