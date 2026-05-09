export const DOM_STYLE_DANGEROUS_HTML_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-dom-style-dangerous-html-oracle.json";

export const DOM_STYLE_DANGEROUS_HTML_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const DOM_STYLE_DANGEROUS_HTML_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-style-dangerous-html-target"
};

export const DOM_STYLE_DANGEROUS_HTML_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-style-and-inner-html-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-client-probes"
  }
];

export const DOM_STYLE_DANGEROUS_HTML_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Development mode records React DOM style/innerHTML output plus warnings and validation errors."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Production mode records style/innerHTML serialization and mutation output without development-only warnings."
  }
];

export const DOM_STYLE_DANGEROUS_HTML_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-040-dom-mutation-renderer-plan.md",
  DOM_STYLE_DANGEROUS_HTML_RUNTIME_INVENTORY_PATH
];
