export const REACT_DOM_CLIENT_ROOT_SCENARIOS = [
  {
    id: "client-entrypoint-shape",
    area: "Entrypoint surface",
    entrypoints: ["react-dom/client"],
    captures: [
      "CommonJS export key order",
      "createRoot, hydrateRoot, and version descriptors",
      "function names and arities"
    ]
  },
  {
    id: "create-root-valid-containers",
    area: "Container validation",
    entrypoints: ["react-dom/client"],
    captures: [
      "element, document, and document-fragment containers are accepted",
      "root object summaries",
      "container root/listening markers without recording random key suffixes",
      "delegated listener counts"
    ]
  },
  {
    id: "create-root-invalid-containers",
    area: "Container validation",
    entrypoints: ["react-dom/client"],
    captures: [
      "null, undefined, text, comment, and plain-object containers throw",
      "published stable rejection of comment containers"
    ]
  },
  {
    id: "create-root-duplicate-warnings",
    area: "Development warnings",
    entrypoints: ["react-dom/client"],
    captures: [
      "duplicate createRoot warning on an already marked container",
      "legacy _reactRootContainer warning branch",
      "warnings remain non-fatal"
    ]
  },
  {
    id: "create-root-option-warnings",
    area: "Development warnings",
    entrypoints: ["react-dom/client"],
    captures: [
      "deprecated hydrate option warning",
      "JSX-as-options warning",
      "production omission of development-only warnings"
    ]
  },
  {
    id: "create-root-options-stored",
    area: "Root options",
    entrypoints: ["react-dom/client"],
    captures: [
      "identifierPrefix storage",
      "unstable_strictMode mode bit effect",
      "root-level error callback identity",
      "stable omission of transition tracing and default indicator option fields"
    ]
  },
  {
    id: "root-object-shape",
    area: "Root object",
    entrypoints: ["react-dom/client"],
    captures: [
      "own _internalRoot slot descriptor",
      "prototype render and unmount descriptors",
      "root object extensibility and own key order"
    ]
  },
  {
    id: "root-render-second-argument-warnings",
    area: "Root render",
    entrypoints: ["react-dom/client"],
    captures: [
      "one-argument render accepts children and returns undefined",
      "callback second-argument warning",
      "container second-argument warning",
      "generic second-argument warning",
      "render returns undefined"
    ]
  },
  {
    id: "root-render-after-unmount",
    area: "Root lifecycle",
    entrypoints: ["react-dom/client"],
    captures: [
      "unmount nulls the public internal root slot",
      "render after unmount throws Cannot update an unmounted root",
      "container root marker is cleared"
    ]
  },
  {
    id: "root-unmount-behavior",
    area: "Root lifecycle",
    entrypoints: ["react-dom/client"],
    captures: [
      "unmount callback warning",
      "first unmount returns undefined",
      "second unmount is a no-op",
      "container root marker is cleared after synchronous null update"
    ]
  },
  {
    id: "profiling-create-root-boundary",
    area: "Profiling entrypoint boundary",
    entrypoints: ["react-dom/profiling"],
    captures: [
      "profiling entrypoint exposes createRoot with the same public root shape",
      "profiling createRoot installs client-root container markers",
      "react-server profiling branch throws before root APIs are usable"
    ]
  }
];

export const REACT_DOM_CLIENT_ROOT_SCENARIO_IDS =
  REACT_DOM_CLIENT_ROOT_SCENARIOS.map((scenario) => scenario.id);
