export const CHILDREN_HELPER_SCENARIOS = [
  {
    id: "children-helper-export-shape",
    area: "Children helper export",
    entrypoints: ["react"],
    captures: [
      "root Children export descriptor",
      "Children object own-key order",
      "Children object mutability state",
      "helper function names, lengths, and descriptors"
    ]
  },
  {
    id: "children-nullish-and-empty-values",
    area: "Children nullish and empty-ish values",
    entrypoints: ["react"],
    captures: [
      "null and undefined top-level children",
      "boolean children callback coercion to null",
      "symbol and function children are ignored",
      "forEach callback counts"
    ]
  },
  {
    id: "children-scalar-values",
    area: "Children scalar values",
    entrypoints: ["react"],
    captures: [
      "string, number, and bigint traversal",
      "callback child values and indexes",
      "map and toArray returned scalar arrays"
    ]
  },
  {
    id: "children-array-and-nested-traversal",
    area: "Children array traversal",
    entrypoints: ["react"],
    captures: [
      "array holes",
      "nested arrays",
      "callback ordering",
      "forEach thisArg and return handling"
    ]
  },
  {
    id: "children-element-and-fragment-leaves",
    area: "Children element and fragment leaves",
    entrypoints: ["react"],
    captures: [
      "created React elements as leaves",
      "fragment elements as leaves without rendering",
      "portal-shaped objects as direct leaves without renderer traversal",
      "Children.only success and failure",
      "mapped element clone identity"
    ]
  },
  {
    id: "children-map-return-handling-and-keys",
    area: "Children.map return handling",
    entrypoints: ["react"],
    captures: [
      "null and undefined callback results",
      "false callback results",
      "array callback results",
      "returned element key synthesis and slash escaping"
    ]
  },
  {
    id: "children-to-array-key-synthesis",
    area: "Children.toArray key synthesis",
    entrypoints: ["react"],
    captures: [
      "key escaping for ':' and '='",
      "nested array key paths",
      "slash-preserving user keys",
      "unkeyed element validation marker"
    ]
  },
  {
    id: "children-key-coercion",
    area: "Children key coercion",
    entrypoints: ["react"],
    captures: [
      "object keys use default-hint coercion for portal-shaped child traversal",
      "callback-returned valid element object keys use default-hint coercion",
      "same-key child and mapped element path avoids extra mapped-key coercion",
      "symbol keys throw with development-only unsupported-key warning"
    ]
  },
  {
    id: "children-iterable-values",
    area: "Children iterable traversal",
    entrypoints: ["react"],
    captures: [
      "Set traversal",
      "generator traversal",
      "Map entry traversal",
      "development Map warning"
    ]
  },
  {
    id: "children-thenable-values",
    area: "Children thenable traversal",
    entrypoints: ["react"],
    captures: [
      "fulfilled thenable unwrapping",
      "synchronously fulfilled thenable unwrapping",
      "rejected thenable errors",
      "pending thenable throw and status mutation"
    ]
  },
  {
    id: "children-lazy-values",
    area: "Children lazy traversal",
    entrypoints: ["react"],
    captures: [
      "fulfilled React.lazy child wrapper traversal",
      "pending React.lazy child wrapper thrown thenable",
      "rejected React.lazy child wrapper thrown reason",
      "loader-thrown error propagation",
      "direct traversal only without renderer, Suspense, owner, root, portal, or ref claims"
    ]
  },
  {
    id: "children-error-behavior",
    area: "Children thrown errors",
    entrypoints: ["react"],
    captures: [
      "plain object child errors",
      "object-toString child errors",
      "missing callback errors",
      "callback-thrown error propagation",
      "iterator-thrown error propagation"
    ]
  }
];

export const CHILDREN_HELPER_SCENARIO_IDS = CHILDREN_HELPER_SCENARIOS.map(
  (scenario) => scenario.id
);
