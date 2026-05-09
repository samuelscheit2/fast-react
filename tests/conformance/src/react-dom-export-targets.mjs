export const REACT_DOM_EXPORT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-export-oracle.json";

export const REACT_DOM_EXPORT_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_EXPORT_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-runtime-target"
};

export const REACT_DOM_EXPORT_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-runtime-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-runtime-probes"
  }
];

export const REACT_DOM_EXPORT_RUNTIME_SUBPATHS = [
  ".",
  "./client",
  "./server",
  "./server.browser",
  "./server.bun",
  "./server.edge",
  "./server.node",
  "./static",
  "./static.browser",
  "./static.edge",
  "./static.node",
  "./profiling",
  "./test-utils"
];

export const REACT_DOM_EXPORT_PUBLIC_SUBPATHS = [
  ...REACT_DOM_EXPORT_RUNTIME_SUBPATHS,
  "./package.json"
];

export const REACT_DOM_EXPORT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development captures the CommonJS package facade, descriptor shape, and development export values."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production captures the same public subpaths with production CJS bundles selected by NODE_ENV."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition narrows the root facade and makes client, server, static, and profiling branches throw."
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

export const REACT_DOM_EXPORT_CONDITION_MODES = [
  {
    id: "default-node",
    nodeArgs: [],
    reason: "Baseline Node condition set."
  },
  {
    id: "react-server",
    nodeArgs: ["--conditions=react-server"],
    reason: "React Server Components condition branch."
  },
  {
    id: "browser",
    nodeArgs: ["--conditions=browser"],
    reason:
      "Custom browser condition as resolved by Node; Node's built-in node condition may still win."
  },
  {
    id: "worker",
    nodeArgs: ["--conditions=worker"],
    reason:
      "Custom worker condition as resolved by Node for aggregate server and static subpaths."
  },
  {
    id: "edge-light",
    nodeArgs: ["--conditions=edge-light"],
    reason:
      "Custom edge-light condition as resolved by Node; export-map order is captured as evidence."
  },
  {
    id: "workerd",
    nodeArgs: ["--conditions=workerd"],
    reason: "Custom workerd condition as resolved by Node."
  },
  {
    id: "bun",
    nodeArgs: ["--conditions=bun"],
    reason:
      "Custom bun condition as resolved by Node; server chooses the Bun wrapper while static has no bun branch."
  },
  {
    id: "deno",
    nodeArgs: ["--conditions=deno"],
    reason: "Custom deno condition as resolved by Node."
  }
];

export const REACT_DOM_EXPORT_BLOCKED_SUBPATH_MODES = [
  {
    id: "default-node",
    nodeArgs: [],
    reason:
      "Baseline Node proves physical root .js files and CJS implementation files are not public package subpaths."
  },
  {
    id: "react-server",
    nodeArgs: ["--conditions=react-server"],
    reason:
      "The react-server condition still respects package exports before any physical implementation file can be loaded."
  }
];

export const REACT_DOM_EXPORT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-004-api-inventory.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  REACT_DOM_EXPORT_RUNTIME_INVENTORY_PATH
];
