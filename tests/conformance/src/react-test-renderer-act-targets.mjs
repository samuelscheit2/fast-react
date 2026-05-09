export const REACT_TEST_RENDERER_ACT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-test-renderer-act-oracle.json";

export const REACT_TEST_RENDERER_ACT_TARGET = {
  packageName: "react-test-renderer",
  version: "19.2.6",
  role: "official-react-test-renderer-runtime-target",
  targetStatus: "deprecated-but-published-react-runtime-target",
  expectedDistIntegrity:
    "sha512-GbS6V23YduFTPiWJ5xICbKEjRcqx1Z90js/V5miqhz7qp/d6xSe9Dd6NjSQODFRdzdsqRMPW82E/sFpPRbY5Mw==",
  expectedDistShasum: "42e9f9fcc4fe11d4bbf7acff536a2e5b8a8cfd45"
};

export const REACT_TEST_RENDERER_ACT_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-test-renderer-peer-needed-for-act-probes",
    expectedDistIntegrity:
      "sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==",
    expectedDistShasum: "3dadb8e12b2a7934c1d5317973e5dce1301f9a4d"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-test-renderer-runtime-dependency-and-mock-scheduler-source",
    expectedDistIntegrity:
      "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
    expectedDistShasum: "0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd"
  },
  {
    packageName: "react-is",
    version: "19.2.6",
    role: "react-test-renderer-runtime-dependency",
    expectedDistIntegrity:
      "sha512-XjBR15BhXuylgWGuslhDKqlSayuqvqBX91BP8pauG8kd1zY8kotkNWbXksTCNRarse4kuGbe2kIY05ARtwNIvw==",
    expectedDistShasum: "aeee6159b159eb7f520d672cffcc69e7052d288f"
  }
];

export const REACT_TEST_RENDERER_ACT_PROBE_MODES = [
  {
    id: "node-development",
    nodeEnv: "development",
    nodeArgs: [],
    condition: "default",
    selectedRendererCjsFile:
      "node_modules/react-test-renderer/cjs/react-test-renderer.development.js",
    reason:
      "Development mode exposes React.act through react-test-renderer and emits deterministic act/deprecation diagnostics."
  },
  {
    id: "node-production",
    nodeEnv: "production",
    nodeArgs: [],
    condition: "default",
    selectedRendererCjsFile:
      "node_modules/react-test-renderer/cjs/react-test-renderer.production.js",
    reason:
      "Production mode keeps the public act key but its value is undefined while scheduler and unstable_flushSync surfaces still load."
  }
];

export const REACT_TEST_RENDERER_ACT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-041-dom-events-priority-plan.md",
  "worker-progress/worker-073-test-renderer-update-model-plan.md",
  "worker-progress/worker-083-react-test-renderer-export-oracle.md if present"
];
