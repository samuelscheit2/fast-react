export const REF_OBJECT_SCENARIOS = [
  {
    id: "create-ref-export-shape",
    area: "createRef export",
    entrypoints: ["react"],
    captures: [
      "root export presence",
      "export descriptor",
      "function name and length",
      "function own-key order",
      "function property descriptors"
    ]
  },
  {
    id: "create-ref-object-shape",
    area: "createRef object",
    entrypoints: ["react"],
    captures: [
      "call result own-key order",
      "current property descriptor",
      "prototype",
      "freeze, seal, and extensibility state",
      "initial current value",
      "arguments are ignored"
    ]
  },
  {
    id: "create-ref-identity-and-invocation",
    area: "createRef invocation",
    entrypoints: ["react"],
    captures: [
      "per-call object identity",
      "call/apply/bind this handling",
      "constructor call behavior",
      "this argument remains untouched"
    ]
  },
  {
    id: "create-ref-mutability",
    area: "createRef mutability",
    entrypoints: ["react"],
    captures: [
      "current assignment",
      "extra property addability",
      "Object.defineProperty behavior on extra properties",
      "extra property deletion",
      "current property deletion behavior",
      "strict assignment and deletion behavior",
      "final ref object shape"
    ]
  }
];

export const REF_OBJECT_SCENARIO_IDS = REF_OBJECT_SCENARIOS.map(
  (scenario) => scenario.id
);
