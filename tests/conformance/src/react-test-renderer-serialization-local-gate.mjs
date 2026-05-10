import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIO_IDS
} from "./react-test-renderer-error-surface-scenarios.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS
} from "./react-test-renderer-serialization-scenarios.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS
} from "./react-test-renderer-serialization-targets.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS =
  "ready-for-private-diagnostics-public-serialization-compatibility-blocked";

export const REACT_TEST_RENDERER_SERIALIZATION_PRIVATE_DIAGNOSTICS_BLOCKED_STATUS =
  "blocked-until-private-serialization-diagnostics";

export const REACT_TEST_RENDERER_SERIALIZATION_PRIVATE_DIAGNOSTIC_REQUIREMENTS = [
  {
    id: "rust-test-renderer-root-facade",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "Public serialization needs a Rust TestRendererRoot that owns reconciler root state instead of direct host snapshots."
  },
  {
    id: "committed-test-renderer-host-output",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "toJSON output must be read after reconciler commit produces test-renderer host output."
  },
  {
    id: "committed-fiber-inspection-api",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "toTree and TestInstance queries need a read-only current-fiber view, not raw mutation host handles."
  },
  {
    id: "private-json-diagnostics",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The Rust test-renderer canary must expose deterministic private JSON diagnostics before any public serializer is considered."
  }
];

export const REACT_TEST_RENDERER_TOJSON_PRIVATE_FACADE_REQUIREMENTS = [
  {
    id: "js-tojson-private-serialization-facade-gate",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The JS react-test-renderer facade must record a private toJSON gate without exposing a public serializer."
  },
  {
    id: "js-tojson-accepted-rust-private-json-diagnostics",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toJSON gate must point at the accepted Rust private JSON diagnostic report, API, and canary tests."
  },
  {
    id: "js-tojson-serializes-accepted-host-output-diagnostics",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toJSON facade must serialize the accepted minimal committed host-output diagnostic shape without exposing public toJSON."
  },
  {
    id: "js-tojson-public-serialization-blocked",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toJSON gate must keep public serialization, native bridge execution, and compatibility claims false."
  }
];

export const REACT_TEST_RENDERER_SERIALIZATION_PUBLIC_COMPATIBILITY_STATUS =
  "blocked-public-react-test-renderer-serialization-compatibility";

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS = [
  {
    id: "public-to-json-api",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public compatibility needs create().toJSON to route to Fast React serialization instead of the placeholder thrower."
  },
  {
    id: "public-to-tree-api",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public compatibility needs create().toTree to expose React-shaped tree output instead of the placeholder thrower."
  },
  {
    id: "public-test-instance-wrappers",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public compatibility needs ReactTestInstance root and query wrappers, not private fiber diagnostics."
  },
  {
    id: "public-js-react-test-renderer-routing",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "A dual-run compatibility claim needs the public JS facade to route create, update, unmount, and serialization through the Rust test renderer."
  }
];

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS =
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS.map((scenarioId) => ({
    scenarioId,
    readyForPrivateDiagnostics: true,
    publicComparisonBlocked: true,
    admittedForFastReactComparison: false,
    compatibilityClaimed: false,
    status: REACT_TEST_RENDERER_SERIALIZATION_PUBLIC_COMPATIBILITY_STATUS,
    unblockRequires:
      REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS.map(
        (requirement) => requirement.id
      )
  }));

export const REACT_TEST_RENDERER_ERROR_SURFACE_LOCAL_GATE_STATUS =
  "ready-for-private-error-diagnostics-public-error-compatibility-blocked";

export const REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTICS_BLOCKED_STATUS =
  "blocked-until-react-test-renderer-private-error-diagnostics";

export const REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTIC_ROW_STATUS =
  "admitted-private-error-diagnostic-row";

export const REACT_TEST_RENDERER_ERROR_SURFACE_PUBLIC_COMPATIBILITY_STATUS =
  "blocked-public-react-test-renderer-error-surface-compatibility";

export const REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTIC_ROWS = [
  {
    id: "react-test-renderer-create-routing-private-diagnostic",
    area: "create routing",
    publicSurface: "create()",
    privatePrerequisite: "deterministic create routing gate"
  },
  {
    id: "react-test-renderer-update-route-private-diagnostic",
    area: "root update",
    publicSurface: "create().update",
    privatePrerequisite: "accepted Rust update canary metadata"
  },
  {
    id: "react-test-renderer-unmount-route-private-diagnostic",
    area: "root unmount",
    publicSurface: "create().unmount",
    privatePrerequisite: "accepted Rust unmount canary metadata"
  },
  {
    id: "react-test-renderer-serialization-private-json-diagnostic",
    area: "serialization",
    publicSurface: "create().toJSON/create().toTree",
    privatePrerequisite: "accepted private JSON diagnostics"
  },
  {
    id: "react-test-renderer-test-instance-private-fiber-diagnostic",
    area: "TestInstance",
    publicSurface: "create().root/find*/findBy*",
    privatePrerequisite: "accepted committed-fiber inspection diagnostics"
  },
  {
    id: "react-test-renderer-act-scheduler-private-diagnostic",
    area: "act and Scheduler",
    publicSurface: "act/_Scheduler/unstable_flushSync",
    privatePrerequisite: "accepted private act queue and scheduler shell metadata"
  }
];

export const REACT_TEST_RENDERER_ERROR_SURFACE_PUBLIC_UNBLOCKING_REQUIREMENTS = [
  {
    id: "public-create-update-unmount-error-surface",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public error compatibility needs create, update, and unmount to route through the real renderer instead of placeholder errors."
  },
  {
    id: "public-serialization-error-surface",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public error compatibility needs toJSON and toTree to expose React-shaped serializer errors instead of private diagnostics."
  },
  {
    id: "public-test-instance-error-surface",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public error compatibility needs ReactTestInstance wrappers and query errors, not committed-fiber diagnostic records."
  },
  {
    id: "public-act-scheduler-error-surface",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Public error compatibility needs renderer-backed act, Scheduler, and flushSync behavior before their error surfaces can be compared."
  },
  {
    id: "public-shallow-error-surface",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "The shallow subpath must stay explicitly blocked until its local placeholder error is intentionally reconciled with the React removal message."
  }
];

export const REACT_TEST_RENDERER_ERROR_SURFACE_LOCAL_PUBLIC_SCENARIO_ADMISSIONS =
  REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIO_IDS.map((scenarioId) => ({
    scenarioId,
    rowKind: "public-error-surface",
    status: REACT_TEST_RENDERER_ERROR_SURFACE_PUBLIC_COMPATIBILITY_STATUS,
    publicComparisonBlocked: true,
    admittedForFastReactComparison: false,
    compatibilityClaimed: false,
    unblockRequires:
      REACT_TEST_RENDERER_ERROR_SURFACE_PUBLIC_UNBLOCKING_REQUIREMENTS.map(
        (requirement) => requirement.id
      )
  }));

export function evaluateReactTestRendererSerializationLocalGate({
  oracle,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  if (!oracle) {
    throw new Error("A checked react-test-renderer serialization oracle is required");
  }

  const localChecks = inspectReactTestRendererSerializationLocalTargets({
    workspaceRoot
  });
  const privateDiagnosticsReady =
    localChecks.rustTestRendererRootFacadePresent &&
    localChecks.committedTestRendererHostOutputPresent &&
    localChecks.committedFiberInspectionPresent &&
    localChecks.privateJsonDiagnosticsPresent;
  const privateToJSONFacadeGateReady =
    privateDiagnosticsReady &&
    localChecks.privateToJSONSerializationFacadeGatePresent &&
    localChecks.privateToJSONSerializationFacadeRecognizesRustDiagnostics &&
    localChecks.privateToJSONSerializationFacadeSerializesHostOutputDiagnostics &&
    localChecks.privateToJSONSerializationFacadePubliclyBlocked;
  const requiredLocalTargetsReady = privateToJSONFacadeGateReady;
  const publicCompatibilityReady =
    privateToJSONFacadeGateReady &&
    localChecks.publicJsFacadeRoutingPresent &&
    localChecks.publicToJSONAvailable &&
    localChecks.publicToTreeAvailable &&
    localChecks.publicTestInstanceWrappersPresent;
  const privateDiagnosticBlockers =
    REACT_TEST_RENDERER_SERIALIZATION_PRIVATE_DIAGNOSTIC_REQUIREMENTS.filter(
      (requirement) => {
        if (requirement.id === "rust-test-renderer-root-facade") {
          return !localChecks.rustTestRendererRootFacadePresent;
        }
        if (requirement.id === "committed-test-renderer-host-output") {
          return !localChecks.committedTestRendererHostOutputPresent;
        }
        if (requirement.id === "committed-fiber-inspection-api") {
          return !localChecks.committedFiberInspectionPresent;
        }
        if (requirement.id === "private-json-diagnostics") {
          return !localChecks.privateJsonDiagnosticsPresent;
        }
        return true;
      }
    ).map((requirement) => requirement.id);
  const privateToJSONFacadeBlockers =
    REACT_TEST_RENDERER_TOJSON_PRIVATE_FACADE_REQUIREMENTS.filter(
      (requirement) => {
        if (
          requirement.id === "js-tojson-private-serialization-facade-gate"
        ) {
          return !localChecks.privateToJSONSerializationFacadeGatePresent;
        }
        if (
          requirement.id === "js-tojson-accepted-rust-private-json-diagnostics"
        ) {
          return !localChecks.privateToJSONSerializationFacadeRecognizesRustDiagnostics;
        }
        if (
          requirement.id ===
          "js-tojson-serializes-accepted-host-output-diagnostics"
        ) {
          return !localChecks.privateToJSONSerializationFacadeSerializesHostOutputDiagnostics;
        }
        if (requirement.id === "js-tojson-public-serialization-blocked") {
          return !localChecks.privateToJSONSerializationFacadePubliclyBlocked;
        }
        return true;
      }
    ).map((requirement) => requirement.id);
  const admittedScenarios =
    REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS.filter(
      (scenario) =>
        scenario.admittedForFastReactComparison ||
        scenario.compatibilityClaimed
    );
  const publicCompatibilityClaimed = Boolean(
    oracle.conformanceClaims?.compatibilityClaimed ||
      oracle.conformanceClaims?.fastReactBehaviorCompatible ||
      oracle.localFastReactStatus?.behaviorCompatibilityClaimed ||
      REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS
        .behaviorCompatibilityClaimed
  );
  const publicCompatibilityBlockers =
    REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS.filter(
      (requirement) => {
        if (requirement.id === "public-to-json-api") {
          return !localChecks.publicToJSONAvailable;
        }
        if (requirement.id === "public-to-tree-api") {
          return !localChecks.publicToTreeAvailable;
        }
        if (requirement.id === "public-test-instance-wrappers") {
          return !localChecks.publicTestInstanceWrappersPresent;
        }
        if (requirement.id === "public-js-react-test-renderer-routing") {
          return !localChecks.publicJsFacadeRoutingPresent;
        }
        return true;
      }
    ).map((requirement) => requirement.id);
  const violations = [];

  if (publicCompatibilityClaimed && !publicCompatibilityReady) {
    violations.push({
      id: "compatibility-claimed-before-public-serialization-support",
      reason:
        "react-test-renderer serialization compatibility cannot be claimed while public toJSON, toTree, TestInstance wrappers, and JS facade routing remain blocked.",
      blockers: publicCompatibilityBlockers
    });
  }

  if (admittedScenarios.length > 0 && !publicCompatibilityReady) {
    violations.push({
      id: "scenario-admitted-before-public-serialization-support",
      reason:
        "Scenario admission must remain explicit and blocked until public serialization and TestInstance surfaces are ready.",
      scenarioIds: admittedScenarios.map((scenario) => scenario.scenarioId)
    });
  }

  if (
    localChecks.publicJsReactTestRendererFacadePresent &&
    !localChecks.publicJsReactTestRendererFacadePlaceholder &&
    REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS.status ===
      "not-present-in-workspace"
  ) {
    violations.push({
      id: "local-fast-react-status-stale",
      reason:
        "The local target status still says the JS react-test-renderer facade is absent, but a package facade is present."
    });
  }

  return {
    status:
      violations.length > 0
        ? "blocked-with-violations"
        : privateToJSONFacadeGateReady
        ? REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS
        : REACT_TEST_RENDERER_SERIALIZATION_PRIVATE_DIAGNOSTICS_BLOCKED_STATUS,
    requiredLocalTargetsReady,
    privateDiagnosticsReady,
    privateDiagnosticBlockers,
    privateToJSONFacadeGateReady,
    privateToJSONFacadeBlockers,
    publicCompatibilityReady,
    publicCompatibilityClaimed,
    publicCompatibilityBlockers,
    localChecks,
    admittedScenarios,
    violations
  };
}

export function evaluateReactTestRendererErrorSurfaceLocalGate({
  oracle,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  if (!oracle) {
    throw new Error(
      "A checked react-test-renderer error surface oracle is required"
    );
  }

  const localChecks = inspectReactTestRendererErrorSurfaceLocalTargets({
    workspaceRoot
  });
  const blockedPrivateDiagnosticRows =
    REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTIC_ROWS.filter(
      (row) => !isErrorSurfacePrivateDiagnosticRowReady(row.id, localChecks)
    ).map((row) => row.id);
  const privateDiagnosticsReady = blockedPrivateDiagnosticRows.length === 0;
  const privateDiagnosticRows =
    REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTIC_ROWS.filter((row) =>
      isErrorSurfacePrivateDiagnosticRowReady(row.id, localChecks)
    ).map((row) => ({
      ...row,
      rowKind: "private-diagnostic",
      status: REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTIC_ROW_STATUS,
      admittedForPrivateDiagnostics: true,
      publicComparisonBlocked: true,
      admittedForFastReactComparison: false,
      compatibilityClaimed: false
    }));
  const admittedPublicScenarios =
    REACT_TEST_RENDERER_ERROR_SURFACE_LOCAL_PUBLIC_SCENARIO_ADMISSIONS.filter(
      (scenario) =>
        scenario.admittedForFastReactComparison ||
        scenario.compatibilityClaimed
    );
  const publicCompatibilityClaimed = Boolean(
    oracle.conformanceClaims?.compatibilityClaimed ||
      oracle.conformanceClaims?.fastReactBehaviorCompatible ||
      oracle.evidenceClaims?.fastReactComparedToReactTestRenderer
  );
  const publicCompatibilityBlockers =
    REACT_TEST_RENDERER_ERROR_SURFACE_PUBLIC_UNBLOCKING_REQUIREMENTS.filter(
      (requirement) => {
        if (requirement.id === "public-create-update-unmount-error-surface") {
          return !localChecks.publicCreateUpdateUnmountErrorSurfaceReady;
        }
        if (requirement.id === "public-serialization-error-surface") {
          return !localChecks.publicSerializationErrorSurfaceReady;
        }
        if (requirement.id === "public-test-instance-error-surface") {
          return !localChecks.publicTestInstanceErrorSurfaceReady;
        }
        if (requirement.id === "public-act-scheduler-error-surface") {
          return !localChecks.publicActSchedulerErrorSurfaceReady;
        }
        if (requirement.id === "public-shallow-error-surface") {
          return !localChecks.publicShallowErrorSurfaceReady;
        }
        return true;
      }
    ).map((requirement) => requirement.id);
  const publicCompatibilityReady =
    publicCompatibilityBlockers.length === 0 &&
    localChecks.publicJsFacadeRoutingPresent;
  const violations = [];

  if (publicCompatibilityClaimed && !publicCompatibilityReady) {
    violations.push({
      id: "error-surface-compatibility-claimed-before-public-support",
      reason:
        "react-test-renderer public error compatibility cannot be claimed while create/update/unmount, serialization, TestInstance, act, Scheduler, or shallow error surfaces remain blocked.",
      blockers: publicCompatibilityBlockers
    });
  }

  if (admittedPublicScenarios.length > 0 && !publicCompatibilityReady) {
    violations.push({
      id: "error-surface-public-scenario-admitted-before-public-support",
      reason:
        "Public error-surface oracle scenarios must stay blocked until real public renderer behavior is available.",
      scenarioIds: admittedPublicScenarios.map(
        (scenario) => scenario.scenarioId
      )
    });
  }

  return {
    status:
      violations.length > 0
        ? "blocked-with-violations"
        : privateDiagnosticsReady
        ? REACT_TEST_RENDERER_ERROR_SURFACE_LOCAL_GATE_STATUS
        : REACT_TEST_RENDERER_ERROR_SURFACE_PRIVATE_DIAGNOSTICS_BLOCKED_STATUS,
    privateDiagnosticsReady,
    privateDiagnosticBlockers: blockedPrivateDiagnosticRows,
    privateDiagnosticRows,
    publicScenarioAdmissions:
      REACT_TEST_RENDERER_ERROR_SURFACE_LOCAL_PUBLIC_SCENARIO_ADMISSIONS,
    admittedPublicScenarios,
    publicCompatibilityReady,
    publicCompatibilityClaimed,
    publicCompatibilityBlockers,
    localChecks,
    violations
  };
}

export function inspectReactTestRendererSerializationLocalTargets({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const publicJsReactTestRendererPackageRoots = [
    "packages/react-test-renderer",
    "packages/fast-react-test-renderer"
  ];
  const testRendererCargo = readWorkspaceFile(
    workspaceRoot,
    "crates/fast-react-test-renderer/Cargo.toml"
  );
  const testRendererSource = readWorkspaceTree(
    workspaceRoot,
    "crates/fast-react-test-renderer/src"
  );
  const reconcilerSource = readWorkspaceTree(
    workspaceRoot,
    "crates/fast-react-reconciler/src"
  );
  const publicJsReactTestRendererPackageSource =
    publicJsReactTestRendererPackageRoots.map((packageRoot) =>
      readWorkspaceTree(workspaceRoot, packageRoot)
    ).join("\n");

  const publicJsReactTestRendererFacadePresent =
    publicJsReactTestRendererPackageRoots.some((packageRoot) =>
      existsWorkspacePath(workspaceRoot, `${packageRoot}/package.json`)
    );
  const publicJsReactTestRendererFacadePlaceholder =
    publicJsReactTestRendererPackageRoots.some((packageRoot) =>
      isPlaceholderReactTestRendererPackage(workspaceRoot, packageRoot)
    );
  const publicJsReactTestRendererFacadeStatus =
    publicJsReactTestRendererFacadePresent
      ? publicJsReactTestRendererFacadePlaceholder
        ? "placeholder-present"
        : "present"
      : "absent";
  const rustTestRendererRootFacadePresent =
    hasSourcePattern(testRendererCargo, /\bfast-react-reconciler\b/u) &&
    hasSourcePattern(
      testRendererSource,
      /\b(?:pub\s+)?struct\s+TestRendererRoot\b/u
    );
  const committedTestRendererHostOutputPresent =
    hasSourcePattern(
      testRendererSource,
      /\b(?:pub\s+)?struct\s+TestRendererCommittedHostOutput\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\brender_and_commit_host_output_for_canary\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\breal_host_output_available\b/u
    );
  const committedFiberInspectionPresent = hasSourcePattern(
    reconcilerSource,
    /\bTestRendererCommittedFiberTreeInspection\b|\binspect_test_renderer_committed_fiber_tree\b/u
  );
  const privateJsonDiagnosticsPresent = hasSourcePattern(
    testRendererSource,
    /\bTestRendererPrivateJsonSerializationReport\b/u
  ) && hasSourcePattern(
    testRendererSource,
    /\bdescribe_private_json_serialization_for_canary\b/u
  ) && hasSourcePattern(
    testRendererSource,
    /\bTestRendererPrivateJsonPublicSurfaceBlockers\b/u
  );
  const privateToJSONSerializationFacadeGatePresent =
    publicJsReactTestRendererFacadePresent &&
    publicJsReactTestRendererFacadePlaceholder &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\btoJSONPrivateSerializationFacadeGate\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-tojson-private-serialization-facade-gate\b/u
    );
  const privateToJSONSerializationFacadeRecognizesRustDiagnostics =
    privateToJSONSerializationFacadeGatePresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bacceptedRustPrivateJsonDiagnostics\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bfast-react-test-renderer\.serialization\.private-json-canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererRoot::describe_private_json_serialization_for_canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererRoot::describe_private_json_serialization_after_update_for_canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererPrivateJsonSerializationReport\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\broot_private_json_serialization_canary_describes_minimal_host_component_with_text\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\broot_private_json_serialization_canary_describes_updated_host_component_text_after_commit\b/u
    );
  const privateToJSONSerializationFacadeSerializesHostOutputDiagnostics =
    privateToJSONSerializationFacadeGatePresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateHostOutputDiagnosticsSerializable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateToJSONSerializationFacadeSymbol\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /fast\.react_test_renderer\.private_tojson_serialization_facade/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bserializeAcceptedHostOutputDiagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bserializePrivateToJSONHostOutputDiagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bhostOutputSnapshotFreshnessRequired\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bstaleSnapshotRejection\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bhostOutputSnapshotCurrent\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-tojson-private-host-output-serializer\b/u
    );
  const privateToJSONSerializationFacadePubliclyBlocked =
    privateToJSONSerializationFacadeGatePresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicSerializationAvailable\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicRouteAvailable\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bnativeBridgeAvailable\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bnativeExecution\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bcompatibilityClaimed\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bcreateRendererUnsupportedFunction\(\s*['"]create\(\)\.toJSON['"]/u
    );
  const privateRecordOnlyTestInstanceWrapperPresent =
    publicJsReactTestRendererFacadePresent &&
    publicJsReactTestRendererFacadePlaceholder &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateTestInstanceWrapperRecordSymbol\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateTestInstanceWrapperSkeleton\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /fast\.react_test_renderer\.private_test_instance_wrapper_record/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-235-test-renderer-private-fiber-inspection\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\binspect_test_renderer_committed_fiber_tree\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicRootAvailable\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicQueryMethodsAvailable\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicTestInstanceObjectAvailable\s*:\s*false\b/u
    );
  const privateRecordOnlyTestInstanceQueryPathPresent =
    privateRecordOnlyTestInstanceWrapperPresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateTestInstanceAcceptedInspectionRecords\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateTestInstanceQueryPath\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateTestInstanceQueryMethodRecords\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-private-test-instance-find-all-query\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererCommittedFiberTreeInspection::host_component\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bskippedByQueryTraversal\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpredicateExecution\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicQueryMethodAvailable\s*:\s*false\b/u
    );
  const publicJsFacadeRoutingPresent =
    publicJsReactTestRendererFacadePresent &&
    !publicJsReactTestRendererFacadePlaceholder &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\b(?:nativeBridgeAvailable|createRouteAvailable|serializationAvailable)\s*:\s*true\b/u
    );
  const publicToJSONAvailable =
    publicJsFacadeRoutingPresent &&
    hasSourcePattern(publicJsReactTestRendererPackageSource, /\btoJSON\b/u) &&
    !hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bcreateRendererUnsupportedFunction\(\s*['"]create\(\)\.toJSON['"]/u
    );
  const publicToTreeAvailable =
    publicJsFacadeRoutingPresent &&
    hasSourcePattern(publicJsReactTestRendererPackageSource, /\btoTree\b/u) &&
    !hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bcreateRendererUnsupportedFunction\(\s*['"]create\(\)\.toTree['"]/u
    );
  const publicTestInstanceWrappersPresent =
    publicJsFacadeRoutingPresent &&
    !privateRecordOnlyTestInstanceWrapperPresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bReactTestInstance\b|\bfindAllBy(?:Type|Props)\b|\bfindBy(?:Type|Props)\b/u
    );

  return {
    publicJsReactTestRendererFacadePresent,
    publicJsReactTestRendererFacadePlaceholder,
    publicJsReactTestRendererFacadeStatus,
    rustTestRendererRootFacadePresent,
    committedTestRendererHostOutputPresent,
    committedFiberInspectionPresent,
    privateJsonDiagnosticsPresent,
    privateToJSONSerializationFacadeGatePresent,
    privateToJSONSerializationFacadeRecognizesRustDiagnostics,
    privateToJSONSerializationFacadeSerializesHostOutputDiagnostics,
    privateToJSONSerializationFacadePubliclyBlocked,
    privateRecordOnlyTestInstanceWrapperPresent,
    privateRecordOnlyTestInstanceQueryPathPresent,
    publicToJSONAvailable,
    publicToTreeAvailable,
    publicTestInstanceWrappersPresent,
    publicJsFacadeRoutingPresent
  };
}

export function inspectReactTestRendererErrorSurfaceLocalTargets({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const serializationLocalChecks =
    inspectReactTestRendererSerializationLocalTargets({ workspaceRoot });
  const testRendererSource = readWorkspaceTree(
    workspaceRoot,
    "packages/react-test-renderer"
  );
  const shallowSource = readWorkspaceFile(
    workspaceRoot,
    "packages/react-test-renderer/shallow.js"
  );
  const schedulerBridgeSource = readWorkspaceFile(
    workspaceRoot,
    "crates/fast-react-reconciler/src/scheduler_bridge.rs"
  );
  const rootSchedulerSource = readWorkspaceFile(
    workspaceRoot,
    "crates/fast-react-reconciler/src/root_scheduler.rs"
  );
  const syncFlushSource = readWorkspaceFile(
    workspaceRoot,
    "crates/fast-react-reconciler/src/sync_flush.rs"
  );
  const passiveEffectsSource = readWorkspaceFile(
    workspaceRoot,
    "crates/fast-react-reconciler/src/passive_effects.rs"
  );
  const actQueueSource = [
    schedulerBridgeSource,
    rootSchedulerSource,
    syncFlushSource
  ].join("\n");
  const createRoutingGatePresent =
    hasSourcePattern(
      testRendererSource,
      /\breact-test-renderer-create-routing-prerequisite-gate\b/u
    ) &&
    hasSourcePattern(testRendererSource, /\bcreateRouteAvailable:\s*false\b/u);
  const updatePrivateRoutePresent =
    hasSourcePattern(
      testRendererSource,
      /\breact-test-renderer-update-private-route\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bprivateRustCanaryAccepted:\s*true\b/u
    );
  const unmountPrivateRoutePresent =
    hasSourcePattern(
      testRendererSource,
      /\breact-test-renderer-unmount-private-route\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bprivateRustCanaryAccepted:\s*true\b/u
    );
  const publicCreateUpdateUnmountErrorSurfaceBlocked =
    hasSourcePattern(
      testRendererSource,
      /\bFastReactTestRendererUnimplementedError\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /Root updates are intentionally blocked/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /Root unmount is intentionally blocked/u
    );
  const publicSerializationErrorSurfaceBlocked =
    hasSourcePattern(
      testRendererSource,
      /Serialization is intentionally blocked/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /Fiber tree inspection is intentionally blocked/u
    );
  const publicTestInstanceErrorSurfaceBlocked =
    hasSourcePattern(
      testRendererSource,
      /TestInstance root access is intentionally blocked/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /Public instance lookup is intentionally blocked/u
    );
  const publicActErrorSurfaceBlocked =
    hasSourcePattern(
      testRendererSource,
      /\bactSchedulerGateStatus\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bexports\.act\s*=\s*(?:isProduction\s*\?\s*undefined\s*:\s*)?createUnsupportedFunction\(\s*['"]act['"],\s*1/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /Public act execution is intentionally blocked/u
    );
  const publicSchedulerErrorSurfaceBlocked =
    hasSourcePattern(
      testRendererSource,
      /\bcreateSchedulerUnsupportedFunction\b/u
    ) &&
    hasSourcePattern(testRendererSource, /\bunstable_scheduleCallback\b/u);
  const publicShallowErrorSurfaceBlocked =
    hasSourcePattern(
      shallowSource,
      /\bFastReactTestRendererShallowUnsupportedError\b/u
    ) &&
    hasSourcePattern(
      shallowSource,
      /without claiming shallow renderer behavior/u
    );
  const privateActQueueMetadataPresent =
    hasSourcePattern(actQueueSource, /\bSchedulerActQueueRequest\b/u) &&
    hasSourcePattern(actQueueSource, /\bSchedulerActQueueTaskKind\b/u) &&
    hasSourcePattern(actQueueSource, /\bFAKE_ACT_CALLBACK_NODE\b/u) &&
    hasSourcePattern(actQueueSource, /\bSchedulerActContinuationRecord\b/u) &&
    hasSourcePattern(actQueueSource, /\brecord_sync_flush_act_continuation\b/u);
  const actFlushExecutionPresent = hasSourcePattern(
    actQueueSource,
    /\b(?:flush|drain)_act_queue\b|\b(?:flush|drain)ActQueue\b|\brecursivelyFlushAsyncActWork\b/u
  );
  const effectCallbackExecutionPresent = hasSourcePattern(
    passiveEffectsSource,
    /\b(?:invoke|execute)_(?:layout|passive|hook)_effects?\b|\b(?:invoke|execute)Effect(?:Create|Destroy)\b/u
  );
  const passiveEffectMetadataOnly =
    hasSourcePattern(
      passiveEffectsSource,
      /\bPassiveEffectFlushEffectRecord\b/u
    ) &&
    hasSourcePattern(
      passiveEffectsSource,
      /\bflush_passive_effects_after_commit\b/u
    ) &&
    !effectCallbackExecutionPresent;
  const publicCreateUpdateUnmountErrorSurfaceReady =
    serializationLocalChecks.publicJsFacadeRoutingPresent &&
    !publicCreateUpdateUnmountErrorSurfaceBlocked;
  const publicSerializationErrorSurfaceReady =
    serializationLocalChecks.publicToJSONAvailable &&
    serializationLocalChecks.publicToTreeAvailable &&
    !publicSerializationErrorSurfaceBlocked;
  const publicTestInstanceErrorSurfaceReady =
    serializationLocalChecks.publicTestInstanceWrappersPresent &&
    !publicTestInstanceErrorSurfaceBlocked;
  const publicActSchedulerErrorSurfaceReady =
    actFlushExecutionPresent &&
    effectCallbackExecutionPresent &&
    !publicActErrorSurfaceBlocked &&
    !publicSchedulerErrorSurfaceBlocked;

  return {
    ...serializationLocalChecks,
    createRoutingGatePresent,
    updatePrivateRoutePresent,
    unmountPrivateRoutePresent,
    publicCreateUpdateUnmountErrorSurfaceBlocked,
    publicSerializationErrorSurfaceBlocked,
    publicTestInstanceErrorSurfaceBlocked,
    publicActErrorSurfaceBlocked,
    publicSchedulerErrorSurfaceBlocked,
    publicShallowErrorSurfaceBlocked,
    privateActQueueMetadataPresent,
    actFlushExecutionPresent,
    passiveEffectMetadataOnly,
    effectCallbackExecutionPresent,
    publicCreateUpdateUnmountErrorSurfaceReady,
    publicSerializationErrorSurfaceReady,
    publicTestInstanceErrorSurfaceReady,
    publicActSchedulerErrorSurfaceReady,
    publicShallowErrorSurfaceReady: false
  };
}

function isErrorSurfacePrivateDiagnosticRowReady(rowId, localChecks) {
  if (rowId === "react-test-renderer-create-routing-private-diagnostic") {
    return (
      localChecks.createRoutingGatePresent &&
      localChecks.publicCreateUpdateUnmountErrorSurfaceBlocked
    );
  }
  if (rowId === "react-test-renderer-update-route-private-diagnostic") {
    return (
      localChecks.updatePrivateRoutePresent &&
      localChecks.publicCreateUpdateUnmountErrorSurfaceBlocked
    );
  }
  if (rowId === "react-test-renderer-unmount-route-private-diagnostic") {
    return (
      localChecks.unmountPrivateRoutePresent &&
      localChecks.publicCreateUpdateUnmountErrorSurfaceBlocked
    );
  }
  if (rowId === "react-test-renderer-serialization-private-json-diagnostic") {
    return (
      localChecks.rustTestRendererRootFacadePresent &&
      localChecks.committedTestRendererHostOutputPresent &&
      localChecks.committedFiberInspectionPresent &&
      localChecks.privateJsonDiagnosticsPresent &&
      localChecks.publicSerializationErrorSurfaceBlocked
    );
  }
  if (rowId === "react-test-renderer-test-instance-private-fiber-diagnostic") {
    return (
      localChecks.committedFiberInspectionPresent &&
      localChecks.privateRecordOnlyTestInstanceQueryPathPresent &&
      localChecks.publicTestInstanceErrorSurfaceBlocked &&
      !localChecks.publicTestInstanceWrappersPresent
    );
  }
  if (rowId === "react-test-renderer-act-scheduler-private-diagnostic") {
    return (
      localChecks.privateActQueueMetadataPresent &&
      localChecks.passiveEffectMetadataOnly &&
      localChecks.publicActErrorSurfaceBlocked &&
      localChecks.publicSchedulerErrorSurfaceBlocked
    );
  }
  return false;
}

function isPlaceholderReactTestRendererPackage(workspaceRoot, packageRoot) {
  if (!existsWorkspacePath(workspaceRoot, `${packageRoot}/package.json`)) {
    return false;
  }

  const packageJson = readWorkspaceFile(workspaceRoot, `${packageRoot}/package.json`);
  const packageSource = readWorkspaceTree(workspaceRoot, packageRoot);

  return (
    hasSourcePattern(
      packageJson,
      /"name"\s*:\s*"@fast-react\/react-test-renderer"/u
    ) &&
    hasSourcePattern(packageSource, /\b__FAST_REACT_PLACEHOLDER__\b/u) &&
    hasSourcePattern(
      packageSource,
      /\bFastReactTestRendererUnimplementedError\b/u
    ) &&
    hasSourcePattern(
      packageSource,
      /\b0\.0\.0-fast-react-test-renderer-placeholder\b/u
    )
  );
}

function existsWorkspacePath(workspaceRoot, relativePath) {
  return existsSync(join(workspaceRoot, relativePath));
}

function readWorkspaceFile(workspaceRoot, relativePath) {
  const path = join(workspaceRoot, relativePath);
  if (!existsSync(path)) {
    return "";
  }
  return readFileSync(path, "utf8");
}

function readWorkspaceTree(workspaceRoot, relativePath) {
  const root = join(workspaceRoot, relativePath);
  if (!existsSync(root)) {
    return "";
  }
  return readDirectoryText(root);
}

function readDirectoryText(directory) {
  const chunks = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      chunks.push(readDirectoryText(path));
      continue;
    }
    if (entry.isFile() && isTextSourceFile(path)) {
      chunks.push(readFileSync(path, "utf8"));
    }
  }
  return chunks.join("\n");
}

function isTextSourceFile(path) {
  if (!statSync(path).isFile()) {
    return false;
  }
  return /\.(?:rs|toml|json|mjs|js)$/u.test(path);
}

function hasSourcePattern(source, pattern) {
  return pattern.test(stripLineComments(source));
}

function stripLineComments(source) {
  return source
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
}
