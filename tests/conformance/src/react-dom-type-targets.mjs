export const REACT_DOM_TYPE_INVENTORY_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-type-inventory.json";

export const REACT_DOM_TYPE_RUNTIME_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-runtime-target"
};

export const REACT_DOM_DECLARATION_TARGET = {
  packageName: "@types/react-dom",
  version: "19.2.3",
  role: "react-dom-declaration-compatibility-target"
};

export const REACT_DECLARATION_TARGET = {
  packageName: "@types/react",
  version: "19.2.14",
  role: "react-peer-declaration-compatibility-target"
};

export const REACT_DOM_TYPE_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json"
];

export const REACT_DOM_TYPE_COMPATIBILITY_POLICY = {
  runtimePackageCompatibility:
    "Runtime package compatibility is checked against the published react-dom@19.2.6 package exports and runtime probes.",
  typescriptDeclarationCompatibility:
    "TypeScript declaration compatibility is checked separately against @types/react-dom@19.2.3 plus the pinned @types/react@19.2.14 peer evidence.",
  recommendedFastReactPolicy: [
    "Do not infer runtime support from @types/react-dom declarations, and do not infer TypeScript support from runtime export keys.",
    "Ship or reference React DOM declarations as an explicit TypeScript compatibility product with tracked gaps.",
    "Treat react-server condition declarations as unresolved until Fast React has condition-specific declaration policy.",
    "Do not claim profiling, server/static resume, or client-root declaration parity until missing declaration exports are resolved or documented as intentional."
  ]
};
