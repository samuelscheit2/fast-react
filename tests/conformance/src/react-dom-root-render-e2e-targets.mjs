import {
  REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS
} from "./react-dom-root-render-e2e-scenarios.mjs";

export const REACT_DOM_ROOT_RENDER_E2E_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json";

export const REACT_DOM_ROOT_RENDER_E2E_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_ROOT_RENDER_E2E_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-root-render-e2e-target"
};

export const REACT_DOM_ROOT_RENDER_E2E_SUPPORTING_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "react-dom-peer-needed-for-root-render-e2e-probes"
  },
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-root-render-e2e-probes"
  }
];

export const REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET = {
  packageName: "@fast-react/react-dom",
  version: "0.0.0",
  role: "workspace-fast-react-react-dom-placeholder",
  expectedStatus: "unsupported-placeholder-or-known-mismatch"
};

export const REACT_DOM_ROOT_RENDER_E2E_CONFORMANCE_GATE_ID =
  "root-render-dual-run-gate-1";

export const REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS =
  "blocked-unsupported-root-e2e";

export const REACT_DOM_ROOT_RENDER_E2E_ADMITTED_SCENARIO_IDS = Object.freeze([]);

export const REACT_DOM_ROOT_RENDER_E2E_LOCAL_FAST_REACT_BEHAVIOR =
  REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.map((scenarioId) => ({
    scenarioId,
    admission: "unsupported",
    gateStatus: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS,
    expectedComparisonStatus: "unsupported-placeholder",
    comparedToReactDomOracle: false,
    reason:
      "Fast React has no admitted public root render/update/unmount E2E behavior until the internal reconciler commit and DOM mutation path exists."
  }));

export const REACT_DOM_ROOT_RENDER_E2E_CONFORMANCE_GATE = {
  id: REACT_DOM_ROOT_RENDER_E2E_CONFORMANCE_GATE_ID,
  reactDomOracle: `${REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName}@${REACT_DOM_ROOT_RENDER_E2E_TARGET.version}`,
  localTargetPackageName: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName,
  admittedScenarioIds: REACT_DOM_ROOT_RENDER_E2E_ADMITTED_SCENARIO_IDS,
  unsupportedBehavior: {
    gateStatus: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS,
    expectedComparisonStatus: "unsupported-placeholder",
    compatibilityClaimed: false
  }
};

export const REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    condition: "default",
    reason:
      "Default Node development probes root render/update/unmount behavior and warning surfaces with development diagnostics enabled."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    condition: "default",
    reason:
      "Default Node production probes the same root render/update/unmount behavior without development-only warning output."
  }
];

export const REACT_DOM_ROOT_RENDER_E2E_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-017-runtime-inventory-generation.md",
  "worker-progress/worker-046-react-dom-client-root-oracle.md",
  "worker-progress/worker-088-dom-container-root-markers-oracle.md",
  "worker-progress/worker-089-dom-root-listener-installation-oracle.md",
  "worker-progress/worker-106-root-render-e2e-test-plan.md",
  "worker-progress/worker-117-root-render-implementation-sequencing-plan.md",
  REACT_DOM_ROOT_RENDER_E2E_RUNTIME_INVENTORY_PATH
];
