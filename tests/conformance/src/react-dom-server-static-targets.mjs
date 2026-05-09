export const REACT_DOM_SERVER_STATIC_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-server-static-oracle.json";

export const REACT_DOM_SERVER_STATIC_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_SERVER_STATIC_REACT_DOM_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-server-static-target"
};

export const REACT_DOM_SERVER_STATIC_FAST_REACT_DOM_TARGET = {
  packageName: "@fast-react/react-dom",
  version: "0.0.0",
  role: "workspace-fast-react-dom-server-static-placeholder",
  expectedStatus: "unsupported-placeholder-boundary"
};

export const REACT_DOM_SERVER_STATIC_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-server-static-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-server-static-probes"
  }
];

export const REACT_DOM_SERVER_STATIC_SERVER_SUBPATHS = [
  "./server",
  "./server.node",
  "./server.browser",
  "./server.edge",
  "./server.bun"
];

export const REACT_DOM_SERVER_STATIC_STATIC_SUBPATHS = [
  "./static",
  "./static.node",
  "./static.browser",
  "./static.edge"
];

export const REACT_DOM_SERVER_STATIC_RUNTIME_SUBPATHS = [
  ...REACT_DOM_SERVER_STATIC_SERVER_SUBPATHS,
  ...REACT_DOM_SERVER_STATIC_STATIC_SUBPATHS
];

export const REACT_DOM_SERVER_STATIC_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development captures server/static result shapes, diagnostics, and development Fizz marker details."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production captures the same server/static APIs with production CJS bundles selected by NODE_ENV."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition records the throwing React Server Components boundary for every server/static subpath."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "Production react-server branches are recorded separately because they load production throwing modules."
  }
];

export const REACT_DOM_SERVER_STATIC_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-036-react-dom-export-oracle.md",
  "worker-progress/worker-042-react-dom-server-fizz-plan.md",
  REACT_DOM_SERVER_STATIC_RUNTIME_INVENTORY_PATH
];
