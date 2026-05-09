export const REACT_TEST_RENDERER_ERROR_SURFACE_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json";

export const REACT_TEST_RENDERER_ERROR_SURFACE_TARGET = {
  packageName: "react-test-renderer",
  version: "19.2.6",
  role: "official-react-test-renderer-public-error-surface-target",
  expectedDistIntegrity:
    "sha512-GbS6V23YduFTPiWJ5xICbKEjRcqx1Z90js/V5miqhz7qp/d6xSe9Dd6NjSQODFRdzdsqRMPW82E/sFpPRbY5Mw==",
  expectedDistShasum: "42e9f9fcc4fe11d4bbf7acff536a2e5b8a8cfd45"
};

export const REACT_TEST_RENDERER_ERROR_SURFACE_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-peer-needed-for-test-renderer-probes",
    expectedDistIntegrity:
      "sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==",
    expectedDistShasum: "3dadb8e12b2a7934c1d5317973e5dce1301f9a4d"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-test-renderer-runtime-dependency-needed-for-probes",
    expectedDistIntegrity:
      "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
    expectedDistShasum: "0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd"
  },
  {
    packageName: "react-is",
    version: "19.2.6",
    role: "react-test-renderer-runtime-dependency-needed-for-probes",
    expectedDistIntegrity:
      "sha512-XjBR15BhXuylgWGuslhDKqlSayuqvqBX91BP8pauG8kd1zY8kotkNWbXksTCNRarse4kuGbe2kIY05ARtwNIvw==",
    expectedDistShasum: "aeee6159b159eb7f520d672cffcc69e7052d288f"
  }
];

export const REACT_TEST_RENDERER_ERROR_SURFACE_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    actWrapped: true,
    reason:
      "Default Node development with act() captures flushed public error messages, deprecation warnings, and removed shallow behavior."
  }
];

export const REACT_TEST_RENDERER_ERROR_SURFACE_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-022-host-operation-errors.md",
  "worker-progress/worker-073-test-renderer-update-model-plan.md"
];
