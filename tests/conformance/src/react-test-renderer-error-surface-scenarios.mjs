export const REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIOS = [
  {
    id: "test-instance-query-errors",
    area: "TestInstance queries",
    entrypoints: ["react-test-renderer"],
    captures: [
      "find(predicate) no-match message",
      "find(predicate) multiple-match message",
      "findByType no-match and multiple-match messages",
      "findByProps no-match and multiple-match messages",
      "findAll zero and multiple counts as non-throwing query baselines"
    ]
  },
  {
    id: "unmounted-root-access-errors",
    area: "unmounted renderer access",
    entrypoints: ["react-test-renderer"],
    captures: [
      "renderer.root after unmount",
      "retained TestInstance props, children, and query access after unmount",
      "non-throwing toJSON, toTree, getInstance, repeat update, and repeat unmount behavior"
    ]
  },
  {
    id: "invalid-create-update-inputs",
    area: "invalid root inputs",
    entrypoints: ["react-test-renderer"],
    captures: [
      "create with plain object child",
      "create with invalid undefined and null element types",
      "update with plain object child",
      "update with invalid undefined and null element types"
    ]
  },
  {
    id: "shallow-removal-error",
    area: "removed shallow renderer",
    entrypoints: ["react-test-renderer/shallow"],
    captures: [
      "shallow subpath export shape",
      "calling removed shallow renderer",
      "constructing removed shallow renderer"
    ]
  },
  {
    id: "unsupported-use-error",
    area: "unsupported renderer/runtime messages",
    entrypoints: ["react-test-renderer"],
    captures: [
      "component calling React.use with a plain object",
      "unsupported use() error message"
    ]
  }
];

export const REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIO_IDS =
  REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIOS.map((scenario) => scenario.id);
