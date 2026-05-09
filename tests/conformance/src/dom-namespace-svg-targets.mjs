export const DOM_NAMESPACE_SVG_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-dom-namespace-svg-oracle.json";

export const DOM_NAMESPACE_SVG_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const DOM_NAMESPACE_SVG_REACT_DOM_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-runtime-target"
};

export const DOM_NAMESPACE_SVG_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-rendering-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-client-runtime-dependency-needed-for-client-probes"
  }
];

export const DOM_NAMESPACE_SVG_PROBE_MODES = [
  {
    id: "development",
    nodeEnv: "development",
    reason:
      "Development captures observable host output plus React DOM warning channels."
  },
  {
    id: "production",
    nodeEnv: "production",
    reason:
      "Production captures the minified-runtime host output without development diagnostics."
  }
];

export const DOM_NAMESPACE_SVG_NAMESPACES = {
  html: "http://www.w3.org/1999/xhtml",
  svg: "http://www.w3.org/2000/svg",
  mathml: "http://www.w3.org/1998/Math/MathML",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};

export const DOM_NAMESPACE_SVG_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-040-dom-mutation-renderer-plan.md",
  DOM_NAMESPACE_SVG_RUNTIME_INVENTORY_PATH
];
