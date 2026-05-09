export const CONTEXT_OBJECT_SCENARIOS = [
  {
    id: "context-export-shape",
    area: "createContext export",
    entrypoints: ["react"],
    captures: [
      "default-root export presence",
      "react-server export absence",
      "export descriptor",
      "function name and length",
      "function own-key order",
      "function property descriptors"
    ]
  },
  {
    id: "context-default-values",
    area: "createContext default values",
    entrypoints: ["react"],
    captures: [
      "nullish default values",
      "scalar default values",
      "object and array default identity",
      "symbol default identity",
      "_currentValue and _currentValue2 identity"
    ]
  },
  {
    id: "context-object-shape",
    area: "createContext object shape",
    entrypoints: ["react"],
    captures: [
      "context own-key order",
      "property descriptors",
      "prototype",
      "freeze, seal, and extensibility state",
      "React context and consumer symbol tags",
      "development renderer slots"
    ]
  },
  {
    id: "context-invocation",
    area: "createContext invocation",
    entrypoints: ["react"],
    captures: [
      "per-call object identity",
      "extra arguments are ignored",
      "call/apply/bind this handling",
      "constructor call behavior",
      "this argument remains untouched"
    ]
  },
  {
    id: "context-provider-consumer-identity",
    area: "createContext provider and consumer identity",
    entrypoints: ["react"],
    captures: [
      "Provider identity",
      "Consumer identity",
      "Consumer._context identity",
      "Provider and Consumer descriptors",
      "Consumer object shape"
    ]
  },
  {
    id: "context-display-name",
    area: "createContext displayName assignment",
    entrypoints: ["react"],
    captures: [
      "context displayName assignment",
      "Provider displayName aliasing",
      "Consumer displayName independence",
      "displayName descriptors",
      "displayName deletion behavior"
    ]
  },
  {
    id: "context-mutability-and-slots",
    area: "createContext mutability and slots",
    entrypoints: ["react"],
    captures: [
      "_currentValue assignment",
      "_currentValue2 assignment",
      "_threadCount assignment",
      "renderer slot assignment",
      "extra property addability",
      "property deletion behavior",
      "final context and consumer shape"
    ]
  }
];

export const CONTEXT_OBJECT_SCENARIO_IDS = CONTEXT_OBJECT_SCENARIOS.map(
  (scenario) => scenario.id
);
