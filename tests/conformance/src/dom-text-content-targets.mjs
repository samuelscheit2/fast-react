export const DOM_TEXT_CONTENT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-dom-text-content-oracle.json";

export const DOM_TEXT_CONTENT_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const DOM_TEXT_CONTENT_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-text-content-target"
};

export const DOM_TEXT_CONTENT_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-text-content-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-client-text-probes"
  }
];

export const DOM_TEXT_CONTENT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Development mode records React DOM text-content output, mutation boundaries, root errors, and diagnostics."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Production mode records the same text-content output and mutation boundaries without development-only diagnostics."
  }
];

export const DOM_TEXT_CONTENT_NAMESPACES = {
  html: "http://www.w3.org/1999/xhtml",
  svg: "http://www.w3.org/2000/svg",
  mathml: "http://www.w3.org/1998/Math/MathML"
};

export const DOM_TEXT_CONTENT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-061-dom-attribute-property-oracle.md",
  "worker-progress/worker-091-dom-mutation-minimum-plan.md",
  "worker-progress/worker-110-dom-text-content-host-plan.md",
  "worker-progress/worker-154-dom-mutation-adapter-shell.md",
  "worker-progress/worker-185-dom-namespace-context-helper.md",
  "worker-progress/worker-186-dom-property-payload-helper.md",
  "react-dom@19.2.6/cjs/react-dom-client.development.js#shouldSetTextContent",
  DOM_TEXT_CONTENT_RUNTIME_INVENTORY_PATH
];
