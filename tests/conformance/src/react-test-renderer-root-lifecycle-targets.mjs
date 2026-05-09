export const REACT_TEST_RENDERER_ROOT_LIFECYCLE_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json";

export const REACT_TEST_RENDERER_ROOT_LIFECYCLE_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_TEST_RENDERER_ROOT_LIFECYCLE_TARGET = {
  packageName: "react-test-renderer",
  version: "19.2.6",
  role: "official-react-test-renderer-root-lifecycle-target",
  expectedDistIntegrity:
    "sha512-GbS6V23YduFTPiWJ5xICbKEjRcqx1Z90js/V5miqhz7qp/d6xSe9Dd6NjSQODFRdzdsqRMPW82E/sFpPRbY5Mw=="
};

export const REACT_TEST_RENDERER_ROOT_LIFECYCLE_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-test-renderer-peer-needed-for-root-lifecycle-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-test-renderer-runtime-dependency-needed-for-root-lifecycle-probes"
  },
  {
    packageName: "react-is",
    version: "19.2.6",
    role: "react-test-renderer-runtime-dependency-needed-for-root-lifecycle-probes",
    expectedDistIntegrity:
      "sha512-XjBR15BhXuylgWGuslhDKqlSayuqvqBX91BP8pauG8kd1zY8kotkNWbXksTCNRarse4kuGbe2kIY05ARtwNIvw=="
  }
];

export const REACT_TEST_RENDERER_ROOT_LIFECYCLE_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development captures the public root lifecycle, act flushing, deprecation warnings, strict mode render replay, and post-unmount errors."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production records the production public surface where act is not available and raw root updates remain uncommitted."
  }
];

export const REACT_TEST_RENDERER_ROOT_LIFECYCLE_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-073-test-renderer-update-model-plan.md",
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_RUNTIME_INVENTORY_PATH
];
