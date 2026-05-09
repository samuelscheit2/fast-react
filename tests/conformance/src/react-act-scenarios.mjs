export const REACT_ACT_SCENARIOS = [
  {
    id: "react-act-export-shape",
    area: "React.act export",
    entrypoints: ["react"],
    captures: [
      "root export own-property presence",
      "Object.keys inclusion",
      "export descriptor",
      "function name, length, and own-key order when callable"
    ]
  },
  {
    id: "react-act-sync-callback-behavior",
    area: "Synchronous callback behavior",
    entrypoints: ["react"],
    captures: [
      "callback call count, this value, and argument count",
      "synchronous callback return forwarding through the act thenable",
      "returned thenable shape",
      "no warning for unawaited rootless sync act"
    ]
  },
  {
    id: "react-act-async-callback-behavior",
    area: "Asynchronous callback behavior",
    entrypoints: ["react"],
    captures: [
      "async callback order around microtasks",
      "awaited async act return forwarding",
      "returned thenable shape",
      "no no-await warning when the act thenable is awaited"
    ]
  },
  {
    id: "react-act-unawaited-async-warning",
    area: "Unawaited async act warning",
    entrypoints: ["react"],
    captures: [
      "development warning for unawaited async act",
      "warning deduplication within a loaded React module",
      "absence behavior in production and react-server modes"
    ]
  },
  {
    id: "react-act-error-propagation",
    area: "Thrown and rejected errors",
    entrypoints: ["react"],
    captures: [
      "synchronous callback throw propagation",
      "subsequent call behavior after synchronous throw",
      "awaited async rejection propagation",
      "custom thenable rejection propagation"
    ]
  },
  {
    id: "react-act-thenable-handling",
    area: "Thenable handling",
    entrypoints: ["react"],
    captures: [
      "custom object thenable resolution",
      "then callback argument types",
      "non-callable then property handling",
      "function values with callable then properties forwarded as sync return values"
    ]
  }
];

export const REACT_ACT_SCENARIO_IDS = REACT_ACT_SCENARIOS.map(
  (scenario) => scenario.id
);
