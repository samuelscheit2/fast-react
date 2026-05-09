export const REACT_TEST_RENDERER_SERIALIZATION_SCENARIOS = [
  {
    id: "host-tree-json-and-tree",
    area: "Host node serialization",
    captures: [
      "toJSON host element shape and react.test.json branding",
      "toJSON props excluding children",
      "text child serialization",
      "nested host child serialization",
      "toTree host node rendered children"
    ]
  },
  {
    id: "text-root-json-and-tree",
    area: "Text root serialization",
    captures: [
      "toJSON string output",
      "toTree string output",
      "root getter returning a string for a text-only root"
    ]
  },
  {
    id: "empty-root-nullish-output",
    area: "Empty and nullish root serialization",
    captures: [
      "null root toJSON and toTree",
      "false root toJSON and toTree",
      ".root access error for empty committed output"
    ]
  },
  {
    id: "array-root-json-and-tree",
    area: "Multiple root child serialization",
    captures: [
      "toJSON array output for multiple root children",
      "toTree array output for multiple root children",
      "root TestInstance type and props for fragment-like roots"
    ]
  },
  {
    id: "activity-hidden-json-and-tree",
    area: "Hidden output serialization",
    captures: [
      "React Activity hidden host output omitted from toJSON",
      "visible Activity host output retained in toJSON",
      "toTree public error for Activity fiber tag",
      "TestInstance queries still seeing hidden host instances"
    ]
  },
  {
    id: "composite-to-tree",
    area: "Composite toTree serialization",
    captures: [
      "function component toTree nodeType",
      "composite props",
      "rendered host subtree",
      "root TestInstance children through the composite boundary"
    ]
  },
  {
    id: "test-instance-find-basics",
    area: "TestInstance query basics",
    captures: [
      "find and findAll predicate behavior",
      "findByType and findAllByType behavior",
      "findByProps and findAllByProps behavior",
      "zero-match and multiple-match public error messages"
    ]
  }
];

export const REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS =
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIOS.map((scenario) => scenario.id);
