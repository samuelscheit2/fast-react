export const COMPONENT_CLASS_SCENARIOS = [
  {
    id: "component-class-export-shape",
    area: "Component and PureComponent exports",
    entrypoints: ["react"],
    captures: [
      "default-root export presence",
      "react-server export absence",
      "export descriptors",
      "function names and lengths",
      "function own-key order",
      "constructor attempts when absent"
    ]
  },
  {
    id: "component-class-prototype-shape",
    area: "Component and PureComponent prototypes",
    entrypoints: ["react"],
    captures: [
      "prototype own-key order",
      "prototype descriptors",
      "isReactComponent marker",
      "isPureReactComponent marker",
      "setState and forceUpdate descriptors",
      "development-only deprecated accessors",
      "PureComponent prototype inheritance"
    ]
  },
  {
    id: "component-class-construction",
    area: "Component and PureComponent construction",
    entrypoints: ["react"],
    captures: [
      "props identity",
      "context identity",
      "custom updater identity",
      "default updater identity",
      "shared refs identity",
      "instance own-key order and descriptors",
      "development and production refs object state"
    ]
  },
  {
    id: "component-class-invocation",
    area: "Component and PureComponent direct invocation",
    entrypoints: ["react"],
    captures: [
      "direct function calls",
      "member calls",
      "call and apply this handling",
      "bind call behavior",
      "bound constructor behavior",
      "new with extra arguments"
    ]
  },
  {
    id: "component-class-custom-updater",
    area: "Component and PureComponent custom updater forwarding",
    entrypoints: ["react"],
    captures: [
      "setState forwarding arguments",
      "forceUpdate forwarding arguments",
      "method return values",
      "callback values are forwarded but not invoked by the class",
      "custom updater identity"
    ]
  },
  {
    id: "component-class-noop-updater",
    area: "Component and PureComponent default no-op updater",
    entrypoints: ["react"],
    captures: [
      "default updater descriptors",
      "isMounted return value",
      "valid setState inputs",
      "invalid setState validation",
      "forceUpdate return value",
      "callback non-invocation",
      "development warning deduplication",
      "production warning absence"
    ]
  },
  {
    id: "component-class-deprecated-accessors",
    area: "Component deprecated accessors",
    entrypoints: ["react"],
    captures: [
      "development isMounted accessor warning",
      "development replaceState accessor warning",
      "production accessor absence",
      "PureComponent inherited deprecated accessor behavior"
    ]
  }
];

export const COMPONENT_CLASS_SCENARIO_IDS = COMPONENT_CLASS_SCENARIOS.map(
  (scenario) => scenario.id
);
