export const REACT_DOM_PORTAL_SCENARIOS = [
  {
    id: "portal-export-descriptors",
    area: "exports",
    entrypoints: ["react-dom", "react-dom/profiling", "react-dom/client"],
    captures: [
      "root createPortal export presence and descriptor",
      "profiling createPortal export presence and descriptor",
      "client subpath createPortal absence",
      "react-server unsupported branch behavior"
    ]
  },
  {
    id: "portal-valid-containers",
    area: "container validation",
    entrypoints: ["react-dom"],
    captures: [
      "Element nodeType 1 acceptance",
      "Document nodeType 9 acceptance",
      "DocumentFragment nodeType 11 acceptance",
      "portal containerInfo identity"
    ]
  },
  {
    id: "portal-invalid-containers",
    area: "container validation",
    entrypoints: ["react-dom"],
    captures: [
      "null and undefined rejection",
      "primitive and plain object rejection",
      "text and comment node rejection",
      "thrown error name and message"
    ]
  },
  {
    id: "portal-key-handling",
    area: "keys",
    entrypoints: ["react-dom"],
    captures: [
      "omitted, undefined, and null key behavior",
      "string, number, boolean, bigint, and object key coercion",
      "Symbol key development warning and thrown TypeError",
      "production Symbol key throw without console warning"
    ]
  },
  {
    id: "portal-object-shape",
    area: "object shape",
    entrypoints: ["react-dom"],
    captures: [
      "react.portal symbol tag",
      "own-key order and descriptors",
      "children and container identity",
      "mutability and React.isValidElement result"
    ]
  },
  {
    id: "portal-invocation-boundaries",
    area: "invocation",
    entrypoints: ["react-dom"],
    captures: [
      "this binding ignored for call/apply",
      "extra arguments ignored",
      "constructor invocation behavior",
      "unavailable createPortal call boundary under react-server"
    ]
  }
];

export const REACT_DOM_PORTAL_SCENARIO_IDS = REACT_DOM_PORTAL_SCENARIOS.map(
  (scenario) => scenario.id
);
