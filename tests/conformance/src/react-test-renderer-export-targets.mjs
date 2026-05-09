export const REACT_TEST_RENDERER_EXPORT_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-test-renderer-export-oracle.json";

export const REACT_TEST_RENDERER_EXPORT_TARGET = {
  packageName: "react-test-renderer",
  version: "19.2.6",
  role: "official-react-test-renderer-runtime-target",
  targetStatus: "deprecated-package-still-published",
  expectedDistIntegrity:
    "sha512-GbS6V23YduFTPiWJ5xICbKEjRcqx1Z90js/V5miqhz7qp/d6xSe9Dd6NjSQODFRdzdsqRMPW82E/sFpPRbY5Mw==",
  expectedDistShasum: "42e9f9fcc4fe11d4bbf7acff536a2e5b8a8cfd45"
};

export const REACT_TEST_RENDERER_EXPORT_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-test-renderer-peer-needed-for-runtime-probes",
    expectedDistIntegrity:
      "sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==",
    expectedDistShasum: "3dadb8e12b2a7934c1d5317973e5dce1301f9a4d"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-test-renderer-runtime-dependency-needed-for-runtime-probes",
    expectedDistIntegrity:
      "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
    expectedDistShasum: "0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd"
  },
  {
    packageName: "react-is",
    version: "19.2.6",
    role: "react-test-renderer-declared-dependency-not-loaded-by-export-probes",
    expectedDistIntegrity:
      "sha512-XjBR15BhXuylgWGuslhDKqlSayuqvqBX91BP8pauG8kd1zY8kotkNWbXksTCNRarse4kuGbe2kIY05ARtwNIvw==",
    expectedDistShasum: "aeee6159b159eb7f520d672cffcc69e7052d288f"
  }
];

export const REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS = [
  ".",
  "./index.js",
  "./shallow",
  "./shallow.js",
  "./cjs/react-test-renderer.development.js",
  "./cjs/react-test-renderer.production.js",
  "./package.json"
];

export const REACT_TEST_RENDERER_EXPORT_SHALLOW_SUBPATHS = [
  "./shallow",
  "./shallow.js"
];

export const REACT_TEST_RENDERER_EXPORT_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development selects the development CJS facade, captures export descriptors, and surfaces the create() deprecation warning."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production selects the production CJS facade and records production-only export value differences."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    condition: "react-server",
    reason:
      "The package has no react-server branch, so the condition reaches the React peer and exposes unsupported renderer loading behavior."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    condition: "react-server",
    reason:
      "Production react-server loading is recorded separately because direct development CJS loading is gated by NODE_ENV."
  }
];

export const REACT_TEST_RENDERER_EXPORT_CONDITION_MODES = [
  {
    id: "default-node",
    nodeArgs: [],
    reason: "Baseline Node resolution without custom conditions."
  },
  {
    id: "react-server",
    nodeArgs: ["--conditions=react-server"],
    reason:
      "React Server Components condition; react-test-renderer has no export map branch, but its React peer does."
  },
  {
    id: "browser",
    nodeArgs: ["--conditions=browser"],
    reason:
      "Custom browser condition as resolved by Node; no package exports map means physical CommonJS paths still resolve."
  },
  {
    id: "worker",
    nodeArgs: ["--conditions=worker"],
    reason:
      "Custom worker condition as resolved by Node; no package exports map means physical CommonJS paths still resolve."
  },
  {
    id: "edge-light",
    nodeArgs: ["--conditions=edge-light"],
    reason:
      "Custom edge-light condition as resolved by Node; no package exports map means physical CommonJS paths still resolve."
  },
  {
    id: "workerd",
    nodeArgs: ["--conditions=workerd"],
    reason:
      "Custom workerd condition as resolved by Node; no package exports map means physical CommonJS paths still resolve."
  },
  {
    id: "bun",
    nodeArgs: ["--conditions=bun"],
    reason:
      "Custom bun condition as resolved by Node; no package exports map means physical CommonJS paths still resolve."
  },
  {
    id: "deno",
    nodeArgs: ["--conditions=deno"],
    reason:
      "Custom deno condition as resolved by Node; no package exports map means physical CommonJS paths still resolve."
  }
];

export const REACT_TEST_RENDERER_EXPORT_CREATE_WARNING_SCENARIOS = [
  {
    id: "development-default-global",
    nodeArgs: [],
    nodeEnv: "development",
    reactNativeTestEnvironment: false,
    reason:
      "Development create() emits the react-test-renderer deprecation warning when the React Native test global is not set."
  },
  {
    id: "development-react-native-test-global",
    nodeArgs: [],
    nodeEnv: "development",
    reactNativeTestEnvironment: true,
    reason:
      "Development create() suppresses the deprecation warning when IS_REACT_NATIVE_TEST_ENVIRONMENT is true."
  },
  {
    id: "production-default-global",
    nodeArgs: [],
    nodeEnv: "production",
    reactNativeTestEnvironment: false,
    reason: "Production create() does not include the development warning call."
  },
  {
    id: "production-react-native-test-global",
    nodeArgs: [],
    nodeEnv: "production",
    reactNativeTestEnvironment: true,
    reason:
      "Production create() remains warning-free even with the React Native test global set."
  }
];

export const REACT_TEST_RENDERER_EXPORT_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-073-test-renderer-update-model-plan.md"
];
