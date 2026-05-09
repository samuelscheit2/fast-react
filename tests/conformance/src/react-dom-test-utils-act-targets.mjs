export const REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-test-utils-act-oracle.json";

export const REACT_DOM_TEST_UTILS_ACT_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_TEST_UTILS_ACT_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-test-utils-act-target",
  subpath: "./test-utils",
  specifier: "react-dom/test-utils"
};

export const REACT_DOM_TEST_UTILS_ACT_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-test-utils-act-peer-and-public-act-target"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-included-for-exact-package-tree"
  }
];

export const REACT_DOM_TEST_UTILS_ACT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development exposes React.act and records the deprecation wrapper's normal delegation behavior."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production records the published test-utils wrapper when the React production entrypoint omits React.act."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The react-server condition leaves react-dom/test-utils public, while the React server entrypoint omits React.act."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "Production react-server records the same public wrapper against the production React server entrypoint."
  }
];

export const REACT_DOM_TEST_UTILS_ACT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-036-react-dom-export-oracle.md",
  REACT_DOM_TEST_UTILS_ACT_RUNTIME_INVENTORY_PATH
];
