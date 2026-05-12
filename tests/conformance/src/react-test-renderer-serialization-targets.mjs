export const REACT_TEST_RENDERER_SERIALIZATION_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-test-renderer-serialization-oracle.json";

export const REACT_TEST_RENDERER_SERIALIZATION_TARGET = {
  packageName: "react-test-renderer",
  version: "19.2.6",
  role: "official-react-test-renderer-runtime-target",
  registry: {
    distTarball:
      "https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz",
    distIntegrity:
      "sha512-GbS6V23YduFTPiWJ5xICbKEjRcqx1Z90js/V5miqhz7qp/d6xSe9Dd6NjSQODFRdzdsqRMPW82E/sFpPRbY5Mw=="
  }
};

export const REACT_TEST_RENDERER_SERIALIZATION_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-test-renderer-peer-needed-for-serialization-probes",
    registry: {
      distTarball: "https://registry.npmjs.org/react/-/react-19.2.6.tgz",
      distIntegrity:
        "sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q=="
    }
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-test-renderer-runtime-dependency",
    registry: {
      distTarball:
        "https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz",
      distIntegrity:
        "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q=="
    }
  },
  {
    packageName: "react-is",
    version: "19.2.6",
    role: "react-test-renderer-runtime-dependency",
    registry: {
      distTarball: "https://registry.npmjs.org/react-is/-/react-is-19.2.6.tgz",
      distIntegrity:
        "sha512-XjBR15BhXuylgWGuslhDKqlSayuqvqBX91BP8pauG8kd1zY8kotkNWbXksTCNRarse4kuGbe2kIY05ARtwNIvw=="
    }
  }
];

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS =
  freezeRecord({
    packageName: "@fast-react/react-test-renderer",
    status: "placeholder-present",
    comparedToReactTestRenderer: false,
    behaviorCompatibilityClaimed: false,
    compatibilityClaimed: false,
    reason:
      "The current workspace has a local JS react-test-renderer placeholder package for private diagnostics, but no public Fast React test-renderer compatibility package to execute in this conformance oracle."
  });

export const REACT_TEST_RENDERER_SERIALIZATION_PACKAGES = [
  REACT_TEST_RENDERER_SERIALIZATION_TARGET,
  ...REACT_TEST_RENDERER_SERIALIZATION_SUPPORTING_TARGETS
];

export const REACT_TEST_RENDERER_SERIALIZATION_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    mountStrategy: "act-create",
    reason:
      "Development probes can mount through public react-test-renderer act and capture deprecation diagnostics."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    mountStrategy: "create-null-then-unstable-flush-sync-update",
    reason:
      "Production react-test-renderer does not expose a callable act export, so probes mount by updating a null renderer inside the public unstable_flushSync method."
  }
];

export const REACT_TEST_RENDERER_SERIALIZATION_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-073-test-renderer-update-model-plan.md"
];

function freezeRecord(value) {
  return Object.freeze(value);
}
