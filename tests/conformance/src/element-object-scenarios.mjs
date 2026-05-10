export const ELEMENT_OBJECT_SCENARIOS = [
  {
    id: "entrypoint-export-shape",
    area: "entrypoints",
    entrypoints: ["react", "react/jsx-runtime", "react/jsx-dev-runtime"],
    captures: [
      "export keys",
      "export descriptors",
      "jsxDEV production undefined behavior",
      "react-server JSX runtime export additions"
    ]
  },
  {
    id: "is-valid-element-brand",
    area: "isValidElement",
    entrypoints: ["react"],
    captures: [
      "transitional element brand",
      "plain object brand acceptance",
      "legacy react.element rejection"
    ]
  },
  {
    id: "create-basic-no-config",
    area: "createElement",
    entrypoints: ["react"],
    captures: [
      "element object keys",
      "own key order",
      "descriptors",
      "dev/prod freeze state",
      "props object shape"
    ]
  },
  {
    id: "create-key-ref-default-props-children",
    area: "createElement",
    entrypoints: ["react"],
    captures: [
      "key coercion",
      "ref as prop",
      "defaultProps",
      "multiple children array identity and freeze state"
    ]
  },
  {
    id: "create-key-warning-access",
    area: "createElement",
    entrypoints: ["react"],
    captures: [
      "dev props.key warning getter",
      "getter name",
      "isReactWarning marker",
      "console error arguments"
    ]
  },
  {
    id: "create-ref-warning-access",
    area: "createElement",
    entrypoints: ["react"],
    captures: [
      "dev element.ref deprecation getter",
      "getter name",
      "console error arguments"
    ]
  },
  {
    id: "create-symbol-key-throws",
    area: "createElement",
    entrypoints: ["react"],
    captures: [
      "unsupported Symbol key warning",
      "key coercion thrown error"
    ]
  },
  {
    id: "create-config-property-copying",
    area: "createElement",
    entrypoints: ["react"],
    captures: [
      "own enumerable string config copy",
      "symbol and non-enumerable config exclusion",
      "accessor evaluation",
      "inherited enumerable prop behavior"
    ]
  },
  {
    id: "create-child-element-validation",
    area: "createElement",
    entrypoints: ["react"],
    captures: [
      "dev child _store.validated mutation",
      "child element store descriptor"
    ]
  },
  {
    id: "clone-preserve-key-ref",
    area: "cloneElement",
    entrypoints: ["react"],
    captures: [
      "undefined key/ref preserve behavior",
      "old props copying",
      "clone element shape"
    ]
  },
  {
    id: "clone-null-overrides-key-ref",
    area: "cloneElement",
    entrypoints: ["react"],
    captures: ["null key/ref override behavior", "clone element shape"]
  },
  {
    id: "clone-invalid-inputs",
    area: "cloneElement",
    entrypoints: ["react"],
    captures: [
      "null and undefined throw behavior",
      "non-element object behavior",
      "primitive input behavior"
    ]
  },
  {
    id: "clone-prop-and-symbol-copying",
    area: "cloneElement",
    entrypoints: ["react"],
    captures: [
      "old props enumerable symbol copying",
      "config symbol exclusion",
      "normal undefined prop override"
    ]
  },
  {
    id: "clone-multiple-children",
    area: "cloneElement",
    entrypoints: ["react"],
    captures: [
      "new children array identity",
      "new children array freeze state",
      "props freeze state"
    ]
  },
  {
    id: "clone-key-ref-warning-access",
    area: "cloneElement",
    entrypoints: ["react"],
    captures: [
      "dev clone props.key warning getter absence",
      "dev clone element.ref deprecation getter",
      "getter name",
      "console error arguments"
    ]
  },
  {
    id: "jsx-no-key-reuses-config",
    area: "jsx",
    entrypoints: ["react/jsx-runtime"],
    captures: [
      "props === config identity",
      "config freeze state",
      "symbols/non-enumerables/accessors preserved by identity"
    ]
  },
  {
    id: "jsx-key-copy-path",
    area: "jsx",
    entrypoints: ["react/jsx-runtime"],
    captures: [
      "config key copy path",
      "props !== config",
      "symbol and non-enumerable exclusion",
      "inherited enumerable prop copy"
    ]
  },
  {
    id: "jsx-maybe-key-and-config-key",
    area: "jsx",
    entrypoints: ["react/jsx-runtime"],
    captures: [
      "maybeKey behavior",
      "config.key override",
      "own undefined key shadowing inherited key"
    ]
  },
  {
    id: "jsx-key-spread-warning",
    area: "jsx",
    entrypoints: ["react/jsx-runtime"],
    captures: ["dev key-spread console error", "key still honored"]
  },
  {
    id: "jsx-key-ref-warning-access",
    area: "jsx",
    entrypoints: ["react/jsx-runtime"],
    captures: [
      "dev props.key warning getter",
      "dev element.ref deprecation getter",
      "getter name",
      "isReactWarning marker",
      "console error arguments"
    ]
  },
  {
    id: "jsxs-static-children-array",
    area: "jsxs",
    entrypoints: ["react/jsx-runtime"],
    captures: [
      "static children array identity",
      "development array freeze",
      "production mutable array"
    ]
  },
  {
    id: "jsxs-static-non-array-warning",
    area: "jsxs",
    entrypoints: ["react/jsx-runtime"],
    captures: ["development static children non-array warning"]
  },
  {
    id: "jsxs-key-ref-warning-access",
    area: "jsxs",
    entrypoints: ["react/jsx-runtime"],
    captures: [
      "dev props.key warning getter",
      "dev element.ref deprecation getter",
      "getter name",
      "isReactWarning marker",
      "console error arguments"
    ]
  },
  {
    id: "jsxdev-basic",
    area: "jsxDEV",
    entrypoints: ["react/jsx-dev-runtime"],
    captures: [
      "jsxDEV element shape",
      "source/self argument behavior",
      "production undefined export behavior"
    ]
  },
  {
    id: "jsxdev-static-non-array-warning",
    area: "jsxDEV",
    entrypoints: ["react/jsx-dev-runtime"],
    captures: ["development static children non-array warning"]
  },
  {
    id: "jsxdev-key-ref-warning-access",
    area: "jsxDEV",
    entrypoints: ["react/jsx-dev-runtime"],
    captures: [
      "dev props.key warning getter",
      "dev element.ref deprecation getter",
      "getter name",
      "isReactWarning marker",
      "console error arguments",
      "production undefined export behavior"
    ]
  }
];

export const ELEMENT_OBJECT_SCENARIO_IDS = ELEMENT_OBJECT_SCENARIOS.map(
  (scenario) => scenario.id
);
