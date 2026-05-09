export const REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIOS = [
  {
    id: "renderer-object-shape",
    area: "root object shape",
    entrypoints: ["react-test-renderer"],
    captures: [
      "create() return own-key order and property descriptors",
      "root accessor descriptor",
      "toJSON, toTree, update, unmount, getInstance, and unstable_flushSync function shapes",
      "act export availability by mode"
    ]
  },
  {
    id: "raw-create-act-boundary",
    area: "create scheduling",
    entrypoints: ["react-test-renderer", "react"],
    captures: [
      "raw create() state before any act flush",
      "development empty act flush committing pending root work",
      "deprecation and not-wrapped-in-act console errors",
      "production lack of act flush support"
    ]
  },
  {
    id: "create-update-unmount-flow",
    area: "root lifecycle",
    entrypoints: ["react-test-renderer", "react"],
    captures: [
      "create() committed host output under act",
      "update() replacing root output under act",
      "unmount() clearing output under act",
      "post-unmount .root, getInstance(), update(), and unmount() behavior"
    ]
  },
  {
    id: "root-access-boundaries",
    area: ".root access",
    entrypoints: ["react-test-renderer", "react"],
    captures: [
      "null root .root error",
      "array root wrapper TestInstance",
      "fragment root wrapper TestInstance",
      "getInstance() null result for non-class roots"
    ]
  },
  {
    id: "get-instance-boundaries",
    area: "getInstance",
    entrypoints: ["react-test-renderer", "react"],
    captures: [
      "host root getInstance() without createNodeMock",
      "function component root getInstance()",
      "class component root getInstance() and root TestInstance",
      "class instance public fields"
    ]
  },
  {
    id: "create-node-mock-ref-lifecycle",
    area: "createNodeMock",
    entrypoints: ["react-test-renderer", "react"],
    captures: [
      "createNodeMock element argument shape",
      "ref attachment and detachment",
      "getInstance() calling createNodeMock for host roots",
      "same-type update and type-change behavior"
    ]
  },
  {
    id: "strict-and-concurrent-options",
    area: "root options",
    entrypoints: ["react-test-renderer", "react"],
    captures: [
      "unstable_strictMode render replay",
      "unstable_isConcurrent option acceptance",
      "React Native test environment deprecation-warning branch",
      "committed output for omitted, false, and true concurrent options"
    ]
  }
];

export const REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIO_IDS =
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIOS.map((scenario) => scenario.id);
