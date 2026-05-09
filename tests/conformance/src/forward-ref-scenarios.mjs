export const FORWARD_REF_SCENARIOS = [
  {
    id: "forward-ref-export-shape",
    area: "forwardRef export",
    entrypoints: ["react"],
    captures: [
      "root export descriptor",
      "function name and length",
      "function own-key order",
      "function property descriptors"
    ]
  },
  {
    id: "forward-ref-wrapper-object",
    area: "forwardRef wrapper object",
    entrypoints: ["react"],
    captures: [
      "function render arity values",
      "nullish, object, string, memo, and lazy render values",
      "$$typeof tag",
      "render value identity",
      "own-key order and descriptors",
      "prototype",
      "freeze, seal, and extensibility state",
      "development warnings for invalid values, memo inputs, arity, and defaultProps",
      "development displayName accessor"
    ]
  },
  {
    id: "forward-ref-invocation",
    area: "forwardRef invocation",
    entrypoints: ["react"],
    captures: [
      "extra arguments",
      "call, apply, bind, and constructor this handling",
      "constructor return object behavior",
      "this argument remains untouched"
    ]
  },
  {
    id: "forward-ref-display-name",
    area: "forwardRef displayName",
    entrypoints: ["react"],
    captures: [
      "development displayName setter storage",
      "anonymous render name and displayName side effects",
      "named render side effects",
      "invalid render displayName assignment errors",
      "production displayName assignment behavior"
    ]
  }
];

export const FORWARD_REF_SCENARIO_IDS = FORWARD_REF_SCENARIOS.map(
  (scenario) => scenario.id
);
