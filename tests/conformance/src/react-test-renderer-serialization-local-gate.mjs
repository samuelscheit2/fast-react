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
    id: "js-tojson-broader-host-shape-diagnostics",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toJSON facade must cover multiple host children, text siblings, prop elision, and empty roots while public toJSON stays blocked."
  },
  {
    id: "js-tojson-exposes-private-diagnostic-result",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toJSON facade must expose an evidence-backed diagnostic result record without turning the public toJSON method on."
  },
  {
    id: "js-tojson-update-unmount-host-output-rows",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toJSON facade must expose explicit update and unmount host-output rows with dependency metadata while public serialization stays blocked."
  },
  {
    id: "js-tojson-update-prop-and-text-diagnostics",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toJSON facade must retain an accepted HostComponent prop plus text update payload while public serialization stays blocked."
  },
  {
    id: "js-tojson-finished-work-identity-gate",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toJSON facade must validate serialization evidence against the committed HostRoot finished_work identity and lane handoff."
  },
  {
    id: "js-tojson-public-serialization-blocked",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toJSON gate must keep public serialization, native bridge execution, and compatibility claims false."
  }
];

export const REACT_TEST_RENDERER_TOTREE_PRIVATE_METADATA_REQUIREMENTS = [
  {
    id: "js-totree-private-host-output-metadata-gate",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The JS react-test-renderer facade must record private toTree metadata without exposing public toTree output."
  },
  {
    id: "js-totree-private-facade-gate",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The JS react-test-renderer facade must expose a hidden private toTree facade without making create().toTree public."
  },
  {
    id: "js-totree-consumes-accepted-rust-private-tree-metadata",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toTree facade must consume the accepted Rust private tree metadata report, not only JS-local shape metadata."
  },
  {
    id: "js-totree-recognizes-accepted-minimal-host-output-shape",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toTree metadata must be tied to the accepted HostRoot -> HostComponent -> HostText canary shape."
  },
  {
    id: "js-totree-private-composite-function-metadata",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toTree metadata must record the FunctionComponent tree wrapper above the accepted committed host output without exposing public toTree."
  },
  {
    id: "js-totree-private-multi-child-metadata",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toTree metadata must record minimal multi-child host output and composite-above-multi-child shapes without exposing public toTree."
  },
  {
    id: "js-totree-private-committed-fiber-shape-diagnostics",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toTree metadata must be backed by committed-fiber inspection shape diagnostics for multi-child and FunctionComponent wrapper shapes."
  },
  {
    id: "js-totree-finished-work-identity-gate",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toTree facade must validate metadata against the committed HostRoot finished_work identity and lane handoff."
  },
  {
    id: "js-totree-public-tree-blocked",
    requiredBeforePrivateDiagnostics: true,
    reason:
      "The private toTree metadata must keep public toTree, native bridge execution, and compatibility claims false."
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
    localChecks.privateJsonDiagnosticsPresent &&
    localChecks.privateSerializationLifecycleSourceEvidencePresent;
  const privateToJSONFacadeGateReady =
    privateDiagnosticsReady &&
    localChecks.privateToJSONSerializationFacadeGatePresent &&
    localChecks.privateToJSONSerializationFacadeRecognizesRustDiagnostics &&
    localChecks.privateToJSONSerializationFacadeSerializesHostOutputDiagnostics &&
    localChecks.privateToJSONSerializationFacadeCoversBroaderHostShapes &&
    localChecks.privateToJSONSerializationFacadeExposesDiagnosticResult &&
    localChecks.privateToJSONUpdateUnmountRowsPresent &&
    localChecks.privateToJSONUpdatePropAndTextDiagnosticsPresent &&
    localChecks.privateToJSONFinishedWorkIdentityGatePresent &&
    localChecks.privateToJSONSerializationFacadePubliclyBlocked;
  const privateToTreeMetadataGateReady =
    privateDiagnosticsReady &&
    localChecks.privateToTreeHostOutputMetadataGatePresent &&
    localChecks.privateToTreePrivateFacadeGatePresent &&
    localChecks.privateToTreePrivateFacadeConsumesRustTreeMetadata &&
    localChecks.privateToTreeHostOutputMetadataRecognizesMinimalShape &&
    localChecks.privateToTreeCompositeFunctionMetadataPresent &&
    localChecks.privateToTreeMultiChildMetadataPresent &&
    localChecks.privateToTreeCommittedFiberInspectionShapeDiagnosticsPresent &&
    localChecks.privateToTreeFinishedWorkIdentityGatePresent &&
    localChecks.privateToTreeHostOutputMetadataPubliclyBlocked;
  const requiredLocalTargetsReady =
    privateToJSONFacadeGateReady && privateToTreeMetadataGateReady;
  const publicCompatibilityReady =
    requiredLocalTargetsReady &&
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
  const privateToTreeMetadataBlockers =
    REACT_TEST_RENDERER_TOTREE_PRIVATE_METADATA_REQUIREMENTS.filter(
      (requirement) => {
        if (requirement.id === "js-totree-private-host-output-metadata-gate") {
          return !localChecks.privateToTreeHostOutputMetadataGatePresent;
        }
        if (requirement.id === "js-totree-private-facade-gate") {
          return !localChecks.privateToTreePrivateFacadeGatePresent;
        }
        if (
          requirement.id ===
          "js-totree-consumes-accepted-rust-private-tree-metadata"
        ) {
          return !localChecks.privateToTreePrivateFacadeConsumesRustTreeMetadata;
        }
        if (
          requirement.id ===
          "js-totree-recognizes-accepted-minimal-host-output-shape"
        ) {
          return !localChecks.privateToTreeHostOutputMetadataRecognizesMinimalShape;
        }
        if (
          requirement.id === "js-totree-private-composite-function-metadata"
        ) {
          return !localChecks.privateToTreeCompositeFunctionMetadataPresent;
        }
        if (requirement.id === "js-totree-private-multi-child-metadata") {
          return !localChecks.privateToTreeMultiChildMetadataPresent;
        }
        if (
          requirement.id ===
          "js-totree-private-committed-fiber-shape-diagnostics"
        ) {
          return !localChecks.privateToTreeCommittedFiberInspectionShapeDiagnosticsPresent;
        }
        if (requirement.id === "js-totree-finished-work-identity-gate") {
          return !localChecks.privateToTreeFinishedWorkIdentityGatePresent;
        }
        if (requirement.id === "js-totree-public-tree-blocked") {
          return !localChecks.privateToTreeHostOutputMetadataPubliclyBlocked;
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
        if (requirement.id === "js-tojson-broader-host-shape-diagnostics") {
          return !localChecks.privateToJSONSerializationFacadeCoversBroaderHostShapes;
        }
        if (
          requirement.id === "js-tojson-exposes-private-diagnostic-result"
        ) {
          return !localChecks.privateToJSONSerializationFacadeExposesDiagnosticResult;
        }
        if (
          requirement.id === "js-tojson-update-unmount-host-output-rows"
        ) {
          return !localChecks.privateToJSONUpdateUnmountRowsPresent;
        }
        if (
          requirement.id === "js-tojson-update-prop-and-text-diagnostics"
        ) {
          return !localChecks.privateToJSONUpdatePropAndTextDiagnosticsPresent;
        }
        if (requirement.id === "js-tojson-finished-work-identity-gate") {
          return !localChecks.privateToJSONFinishedWorkIdentityGatePresent;
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
        : requiredLocalTargetsReady
        ? REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS
        : REACT_TEST_RENDERER_SERIALIZATION_PRIVATE_DIAGNOSTICS_BLOCKED_STATUS,
    requiredLocalTargetsReady,
    privateDiagnosticsReady,
    privateDiagnosticBlockers,
    privateToJSONFacadeGateReady,
    privateToJSONFacadeBlockers,
    privateToTreeMetadataGateReady,
    privateToTreeMetadataBlockers,
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

const sharedFinishedWorkIdentitySourceAssertions = freezeArray([
  jsBooleanPropertyAssertion("privateFinishedWorkIdentityGateAvailable", true),
  jsBooleanPropertyAssertion("privateUnmountFinishedWorkIdentityGateAvailable", true),
  jsBooleanPropertyAssertion(
    "unmountNativeExecutionRequiresFinishedWorkIdentity",
    true
  ),
  jsBooleanPropertyAssertion("rejectsStaleUnmountFinishedWorkIdentity", true),
  jsBooleanPropertyAssertion(
    "requiresUnmountDeletionCleanupHandoffEvidence",
    true
  ),
  jsBooleanPropertyAssertion(
    "privateRootLifecycleExecutionEvidenceRequired",
    true
  )
]);

const sharedPublicBlockerSourceAssertions = freezeArray([
  jsBooleanPropertyAssertion("publicRouteAvailable", false),
  jsBooleanPropertyAssertion("nativeBridgeAvailable", false),
  jsBooleanPropertyAssertion("nativeExecution", false),
  jsBooleanPropertyAssertion("compatibilityClaimed", false)
]);

const privateToJSONFinishedWorkIdentitySourceAssertions = freezeArray([
  ...sharedFinishedWorkIdentitySourceAssertions
]);

const privateToJSONPublicBlockerSourceAssertions = freezeArray([
  ...sharedPublicBlockerSourceAssertions,
  jsBooleanPropertyAssertion("publicSerializationAvailable", false)
]);

const privateToJSONHostOutputDiagnosticGateSourceAssertions = freezeArray([
  jsStringPropertyAssertion(
    "id",
    "react-test-renderer-tojson-private-serialization-facade-gate"
  ),
  jsBooleanPropertyAssertion("privateHostOutputDiagnosticsSerializable", true),
  jsSourcePropertyAssertion(
    "privateSerializationFacadeSymbol",
    "privateToJSONSerializationFacadeSymbol.description"
  ),
  jsBooleanPropertyAssertion("acceptedRustPrivateJsonDiagnostics", true),
  jsBooleanPropertyAssertion("hostOutputSnapshotFreshnessRequired", true),
  jsBooleanPropertyAssertion("staleSnapshotRejection", true),
  jsBooleanPropertyAssertion("publicSerializationAvailable", false),
  jsBooleanPropertyAssertion("publicRouteAvailable", false),
  jsBooleanPropertyAssertion("nativeBridgeAvailable", false),
  jsBooleanPropertyAssertion("nativeExecution", false),
  jsBooleanPropertyAssertion("compatibilityClaimed", false)
]);

const privateToTreeFinishedWorkIdentitySourceAssertions = freezeArray([
  ...sharedFinishedWorkIdentitySourceAssertions
]);

const privateToTreePublicBlockerSourceAssertions = freezeArray([
  ...sharedPublicBlockerSourceAssertions,
  jsBooleanPropertyAssertion("publicTreeAvailable", false)
]);

const publicJsReactTestRendererEntrypointSourcePaths = freezeArray([
  "packages/react-test-renderer/index.js",
  "packages/react-test-renderer/cjs/react-test-renderer.development.js",
  "packages/react-test-renderer/cjs/react-test-renderer.production.js"
]);

const privateSerializationLifecycleSourceTokens = freezeArray([
  "rootLifecycleExecutionEvidences",
  "validatePrivateSerializationLifecycleExecutionEvidence",
  "validatePrivateSerializationRootLifecycleExecutionEvidence",
  "validatePrivateSerializationHostOutputLifecycleExecutionEvidence"
]);

const privateToJSONHostOutputDiagnosticSourceTokens = freezeArray([
  "privateToJSONSerializationFacadeSymbol",
  "createPrivateToJSONSerializationFacade",
  "serializeAcceptedHostOutputDiagnostic",
  "hostOutputSnapshotCurrent"
]);

const privateToJSONHostOutputDiagnosticFunctionSourceTokens = freezeArray([
  "validatePrivateToJSONHostOutputDiagnostic",
  "validatePrivateSerializationHostOutputLifecycleExecutionEvidence",
  "diagnostic.hostOutputUpdateKind",
  "rootLifecycleExecutionEvidence",
  "return diagnostic.result"
]);

const privateToJSONHostOutputDiagnosticFunctionSourceCalls = freezeArray([
  freezeRecord({
    callee: "validatePrivateToJSONHostOutputDiagnostic",
    arguments: freezeArray(["report"])
  }),
  freezeRecord({
    callee:
      "validatePrivateSerializationHostOutputLifecycleExecutionEvidence",
    arguments: freezeArray([
      "'create().toJSON'",
      "rootRequest",
      "diagnostic.hostOutputUpdateKind",
      "rootLifecycleExecutionEvidence"
    ])
  })
]);

const privateToJSONHostOutputDiagnosticFacadeSourceCalls = freezeArray([
  freezeRecord({
    methodName: "canSerializeAcceptedHostOutputDiagnostic",
    callee: "serializePrivateToJSONHostOutputDiagnostic",
    arguments: freezeArray([
      "report",
      "rootRequest",
      "rootLifecycleExecutionEvidence"
    ])
  }),
  freezeRecord({
    methodName: "serializeAcceptedHostOutputDiagnostic",
    callee: "serializePrivateToJSONHostOutputDiagnostic",
    arguments: freezeArray([
      "report",
      "rootRequest",
      "rootLifecycleExecutionEvidence"
    ])
  })
]);

const updateUnmountRustLifecycleDiagnosticGateSourceAssertions = freezeArray([
  jsStringPropertyAssertion(
    "id",
    "react-test-renderer-update-unmount-rust-lifecycle-diagnostic-gate"
  ),
  jsBooleanPropertyAssertion("privateDiagnosticConsumptionAvailable", true),
  jsBooleanPropertyAssertion("publicCreateUpdateUnmountBehaviorAvailable", false),
  jsBooleanPropertyAssertion("publicRouteAvailable", false),
  jsBooleanPropertyAssertion("nativeBridgeAvailable", false),
  jsBooleanPropertyAssertion("nativeExecution", false),
  jsBooleanPropertyAssertion("compatibilityClaimed", false)
]);

const updatePrivateRouteLifecycleSourceAssertions = freezeArray([
  jsStringPropertyAssertion("id", "react-test-renderer-update-private-route"),
  jsBooleanPropertyAssertion("privateRustCanaryAccepted", true),
  jsBooleanPropertyAssertion("acceptedRustLifecycleDiagnostics", true),
  jsBooleanPropertyAssertion("consumesAcceptedRustLifecycleDiagnostics", true),
  jsSourcePropertyAssertion(
    "lifecycleDiagnosticGate",
    "updateUnmountRustLifecycleDiagnosticGate"
  ),
  jsBooleanPropertyAssertion("publicRouteAvailable", false),
  jsBooleanPropertyAssertion("nativeBridgeAvailable", false),
  jsBooleanPropertyAssertion("nativeExecution", false)
]);

const unmountPrivateRouteLifecycleSourceAssertions = freezeArray([
  jsStringPropertyAssertion("id", "react-test-renderer-unmount-private-route"),
  jsBooleanPropertyAssertion("privateRustCanaryAccepted", true),
  jsBooleanPropertyAssertion("acceptedRustLifecycleDiagnostics", true),
  jsBooleanPropertyAssertion("consumesAcceptedRustLifecycleDiagnostics", true),
  jsSourcePropertyAssertion(
    "lifecycleDiagnosticGate",
    "updateUnmountRustLifecycleDiagnosticGate"
  ),
  jsBooleanPropertyAssertion("publicRouteAvailable", false),
  jsBooleanPropertyAssertion("nativeBridgeAvailable", false),
  jsBooleanPropertyAssertion("nativeExecution", false)
]);

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
  const publicJsReactTestRendererEntrypointSources =
    publicJsReactTestRendererEntrypointSourcePaths.map((path) =>
      readWorkspaceFile(workspaceRoot, path)
    );
  const privateToJSONFinishedWorkIdentitySourceEvidencePresent =
    publicJsReactTestRendererEntrypointSources.every((source) =>
      jsObjectSourceAssertionsPass({
        source,
        declaration:
          "const toJSONPrivateSerializationFacadeGate = Object.freeze",
        assertions: privateToJSONFinishedWorkIdentitySourceAssertions
      })
    );
  const privateToJSONPublicBlockerSourceEvidencePresent =
    publicJsReactTestRendererEntrypointSources.every((source) =>
      jsObjectSourceAssertionsPass({
        source,
        declaration:
          "const toJSONPrivateSerializationFacadeGate = Object.freeze",
        assertions: privateToJSONPublicBlockerSourceAssertions
      })
    );
  const privateToTreeFinishedWorkIdentitySourceEvidencePresent =
    publicJsReactTestRendererEntrypointSources.every((source) =>
      jsObjectSourceAssertionsPass({
        source,
        declaration: "const toTreePrivateFacadeGate = Object.freeze",
        assertions: privateToTreeFinishedWorkIdentitySourceAssertions
      })
    );
  const privateToTreePublicBlockerSourceEvidencePresent =
    publicJsReactTestRendererEntrypointSources.every((source) =>
      jsObjectSourceAssertionsPass({
        source,
        declaration: "const toTreePrivateFacadeGate = Object.freeze",
        assertions: privateToTreePublicBlockerSourceAssertions
      })
    );
  const privateSerializationLifecycleSourceEvidencePresent =
    publicJsReactTestRendererEntrypointSources.every((source) =>
      jsSourceTokensOutsideCommentsAndStringsPass(
        source,
        privateSerializationLifecycleSourceTokens
      )
    );
  const privateToJSONHostOutputDiagnosticSourceEvidencePresent =
    publicJsReactTestRendererEntrypointSources.every(
      (source) =>
        jsObjectSourceAssertionsPass({
          source,
          declaration:
            "const toJSONPrivateSerializationFacadeGate = Object.freeze",
          assertions: privateToJSONHostOutputDiagnosticGateSourceAssertions
        }) &&
        jsSourceTokensOutsideCommentsAndStringsPass(
          source,
          privateToJSONHostOutputDiagnosticSourceTokens
        ) &&
        jsFunctionDeclarationSourceTokensPass({
          source,
          functionName: "serializePrivateToJSONHostOutputDiagnostic",
          afterDeclaration:
            "function createPrivateToJSONHostOutputDiagnosticResult",
          tokens: privateToJSONHostOutputDiagnosticFunctionSourceTokens
        }) &&
        jsFunctionDeclarationSourceCallsPass({
          source,
          functionName: "serializePrivateToJSONHostOutputDiagnostic",
          calls: privateToJSONHostOutputDiagnosticFunctionSourceCalls
        }) &&
        jsFunctionDeclarationReturnedFreezeRecordMethodSourceCallsPass({
          source,
          functionName: "createPrivateToJSONSerializationFacade",
          methodCalls: privateToJSONHostOutputDiagnosticFacadeSourceCalls
        })
    );

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
  const privateTreeMetadataPresent = hasSourcePattern(
    testRendererSource,
    /\bTestRendererPrivateTreeMetadataReport\b/u
  ) && hasSourcePattern(
    testRendererSource,
    /\bdescribe_private_tree_metadata_for_canary\b/u
  ) && hasSourcePattern(
    testRendererSource,
    /\bdescribe_private_tree_metadata_after_update_for_canary\b/u
  ) && hasSourcePattern(
    testRendererSource,
    /\bTEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME\b/u
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
    privateToJSONHostOutputDiagnosticSourceEvidencePresent &&
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
  const privateToJSONSerializationFacadeCoversBroaderHostShapes =
    privateToJSONSerializationFacadeSerializesHostOutputDiagnostics &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bacceptedHostRootShapes\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpropElisionFromSerializedProps\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bcreatePrivateToJSONRenderedRoot\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bnormalizePrivateToJSONProps\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateJsonRenderedRoot\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_to_json_host_shape_from_snapshot_for_diagnostics\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_shape_diagnostics_serialize_empty_root_as_null\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_shape_diagnostics_serialize_multiple_host_children_and_text_siblings\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_shape_diagnostics_elide_children_prop\b/u
    );
  const privateToJSONSerializationFacadeExposesDiagnosticResult =
    privateToJSONSerializationFacadeGatePresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateDiagnosticResultAvailable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bacceptedRustPrivateToJSONFacadeResult\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bfast-react-test-renderer\.tojson\.private-facade-result\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererRoot::describe_private_to_json_facade_result_for_canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererRoot::describe_private_to_json_facade_result_after_update_for_canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bcreateAcceptedHostOutputDiagnosticResult\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-private-tojson-diagnostic-result\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateToJsonFacadeResult\b/u
    );
  const privateToJSONBaseUpdateUnmountRowsPresent =
    privateToJSONSerializationFacadeExposesDiagnosticResult &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-tojson-update-host-output-private-diagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-tojson-unmount-host-output-private-diagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateToJSONUpdateUnmountDependencyMetadata\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bmismatchedUpdateUnmountRecordRejection\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bacceptedHostOutputUpdateKinds\b[\s\S]*\bUnmount\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatePrivateToJSONUpdateUnmountRowMetadata\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicTestInstanceAvailable\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bnativeExecutionAvailable\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateToJsonHostOutputRow\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateToJsonHostOutputDependencyDiagnostics\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_to_json_host_output_update_row_for_canary\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_to_json_host_output_unmount_row_for_canary\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_unmount_host_output_row_records_empty_snapshot_blockers\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_update_host_output_row_rejects_mismatched_row_kind\b/u
    );
  const privateToJSONNestedUpdateSiblingTextRowsPresent =
    privateToJSONBaseUpdateUnmountRowsPresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-tojson-nested-host-output-update-private-diagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-tojson-sibling-text-host-output-private-diagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateToJSONUpdateHostOutputRowIds\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bNestedHostText\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bSiblingText\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bmismatchedUpdateShapeRejection\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\binferPrivateToJSONHostOutputShape\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_to_json_nested_host_output_update_row_for_canary\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateToJsonHostOutputShapeDiagnostics\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_nested_host_output_update_row_records_nested_text_rows\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_nested_host_output_update_row_rejects_stale_snapshot\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_sibling_text_host_output_row_records_text_sibling_shape\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_sibling_text_host_output_row_rejects_mismatched_shape\b/u
    );
  const privateToJSONUpdateUnmountRowsPresent =
    privateToJSONBaseUpdateUnmountRowsPresent &&
    privateToJSONNestedUpdateSiblingTextRowsPresent;
  const privateToJSONUpdatePropAndTextDiagnosticsPresent =
    privateToJSONUpdateUnmountRowsPresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateUpdateHostComponentPropSerializationEvidenceAvailable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bHostComponentPropPlusTextUpdate\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-671-test-renderer-root-update-serialization-props\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bupdate_host_component_with_props_and_text_for_canary\b/u
    ) &&
    hasSourcePattern(testRendererSource, /\bdata-state\b/u) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_json_serialization_canary_describes_updated_host_component_text_after_commit\b/u
    );
  const privateToJSONFinishedWorkIdentityGatePresent =
    privateToJSONSerializationFacadeGatePresent &&
    privateToJSONFinishedWorkIdentitySourceEvidencePresent &&
    privateSerializationLifecycleSourceEvidencePresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateFinishedWorkIdentityGateAvailable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bfast-react-test-renderer\.serialization\.private-finished-work-identity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bconsumesCommittedHostRootFinishedWorkIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bconsumesCommittedHostRootFinishedWorkLanes\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidateAcceptedFinishedWorkIdentity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bcreatePrivateSerializationFinishedWorkIdentityGateResult\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatesUpdateRootRequestIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateUnmountFinishedWorkIdentityGateAvailable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatesUnmountRootRequestIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatesUnmountDeletionAndCleanupHandoffIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatePrivateSerializationUnmountHandoffIdentity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateUnmountNativeBridgeCleanupHandoffDiagnosticId\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bunmountNativeExecutionRequiresFinishedWorkIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\brejectsStaleUnmountFinishedWorkIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\brequiresUnmountDeletionCleanupHandoffEvidence\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-733-test-renderer-unmount-finished-work-identity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bgetLatestScheduledRootRequestForSerializationIdentity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bidentityRootRequest\.operation\s*!==\s*rootRequestOperationForHostOutputUpdateKind\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bidentity\.rootRequestOperation\s*!==\s*['"]unmount['"]/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\brootRequestOperationForHostOutputUpdateKind\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatePrivateUnmountNativeExecutionFinishedWorkIdentity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatePrivateUnmountSerializationFinishedWorkIdentitySourceReport\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateSerializationFinishedWorkIdentityGate\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_to_json_finished_work_identity_gate_for_canary\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_serialization_finished_work_identity_gate_accepts_committed_handoff\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_update_serialization_finished_work_identity_gate_accepts_committed_handoff\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_json_unmount_native_execution_requires_finished_work_identity_gate\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_serialization_finished_work_identity_gate_rejects_stale_evidence\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_serialization_finished_work_identity_gate_rejects_lane_mismatch\b/u
    );
  const privateToJSONSerializationFacadePubliclyBlocked =
    privateToJSONSerializationFacadeGatePresent &&
    privateToJSONPublicBlockerSourceEvidencePresent &&
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
  const privateToTreeHostOutputMetadataGatePresent =
    publicJsReactTestRendererFacadePresent &&
    publicJsReactTestRendererFacadePlaceholder &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\btoTreePrivateHostOutputMetadataGate\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-totree-private-host-output-metadata-gate\b/u
    );
  const privateToTreePrivateFacadeGatePresent =
    publicJsReactTestRendererFacadePresent &&
    publicJsReactTestRendererFacadePlaceholder &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\btoTreePrivateFacadeGate\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\breact-test-renderer-totree-private-facade-gate\b/u
    );
  const privateToTreePrivateFacadeConsumesRustTreeMetadata =
    privateTreeMetadataPresent &&
    privateToTreePrivateFacadeGatePresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bacceptedRustPrivateTreeMetadata\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bfast-react-test-renderer\.serialization\.private-tree-canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererRoot::describe_private_tree_metadata_for_canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererRoot::describe_private_tree_metadata_after_update_for_canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererPrivateTreeMetadataReport\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateTreeMetadataSerializable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /fast\.react_test_renderer\.private_totree_facade/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bserializePrivateToTreeMetadataDiagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bserializeAcceptedTreeMetadata\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bhostOutputSnapshotCurrent\b/u
    );
  const privateToTreeHostOutputMetadataRecognizesMinimalShape =
    privateToTreeHostOutputMetadataGatePresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateHostOutputTreeMetadataAvailable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /fast\.react_test_renderer\.private_totree_host_output_metadata/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bacceptedMinimalFiberShape\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /HostRoot[\s\S]*HostComponent[\s\S]*HostText/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bdescribePrivateToTreeHostOutputDiagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bReactTestRenderer\.js toTree\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-364-test-renderer-totree-private-host-output\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-392-test-renderer-public-totree-private-facade\b/u
    );
  const privateToTreeCompositeFunctionMetadataPresent =
    privateToTreeHostOutputMetadataGatePresent &&
    privateToTreePrivateFacadeGatePresent &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateTreeFunctionComponentDiagnostic\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTEST_RENDERER_PRIVATE_TREE_COMPOSITE_ACCEPTED_FIBER_SHAPE\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_tree_metadata_canary_describes_function_component_above_host_output\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bacceptedCompositeFiberShape\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /HostRoot[\s\S]*FunctionComponent[\s\S]*HostComponent[\s\S]*HostText/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateCompositeFunctionMetadataAvailable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateCompositeFunctionMetadataSerializable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bfunctionComponentBehavior\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bFunctionComponent[\s\S]*nodeType[\s\S]*component\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bwrapsCommittedHostOutput\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicTreeAvailable\s*:\s*false\b/u
    );
  const privateToTreeMultiChildMetadataPresent =
    privateToTreeHostOutputMetadataGatePresent &&
    privateToTreePrivateFacadeGatePresent &&
    hasSourcePattern(
      testRendererSource,
      /\bTEST_RENDERER_PRIVATE_TREE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTEST_RENDERER_PRIVATE_TREE_COMPOSITE_MULTI_CHILD_ACCEPTED_FIBER_SHAPE\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateTreeRenderedRoot\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_to_tree_host_shape_from_snapshot_for_diagnostics\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_tree_shape_diagnostics_serialize_multiple_host_children_and_text_siblings\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_tree_shape_diagnostics_wrap_composite_above_multi_child_host_output\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bacceptedMultiChildFiberShape\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /HostRoot[\s\S]*HostText[\s\S]*HostComponent[\s\S]*HostText/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateMultiChildTreeMetadataSerializable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatePrivateToTreeMultiChildHostOutputDiagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-485-test-renderer-totree-multichild-gate\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicTreeAvailable\s*:\s*false\b/u
    );
  const privateToTreeCommittedFiberInspectionShapeDiagnosticsPresent =
    privateToTreeMultiChildMetadataPresent &&
    hasSourcePattern(
      testRendererSource,
      /\bTEST_RENDERER_PRIVATE_TREE_COMMITTED_FIBER_INSPECTION_DIAGNOSTIC_NAME\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateTreeCommittedFiberInspectionReport\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_tree_committed_fiber_inspection_for_canary\b/u
    ) &&
    hasSourcePattern(
      reconcilerSource,
      /\bcommitted_fiber_inspection_describes_multi_child_host_root_shape\b/u
    ) &&
    hasSourcePattern(
      reconcilerSource,
      /\bcommitted_fiber_inspection_describes_function_component_above_multi_child_shape\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateCommittedFiberInspectionShapeDiagnosticsAvailable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatePrivateToTreeCommittedFiberInspectionDiagnostic\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bcommittedFiberInspection\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-516-test-renderer-committed-fiber-tree-inspection\b/u
    );
  const privateToTreeFinishedWorkIdentityGatePresent =
    privateToTreePrivateFacadeGatePresent &&
    privateToTreeFinishedWorkIdentitySourceEvidencePresent &&
    privateSerializationLifecycleSourceEvidencePresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateFinishedWorkIdentityGateAvailable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bfast-react-test-renderer\.serialization\.private-finished-work-identity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bconsumesCommittedHostRootFinishedWorkIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bconsumesCommittedHostRootFinishedWorkLanes\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidateAcceptedFinishedWorkIdentity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bcreatePrivateSerializationFinishedWorkIdentityGateResult\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatesUpdateRootRequestIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateUnmountFinishedWorkIdentityGateAvailable\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatesUnmountRootRequestIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatesUnmountDeletionAndCleanupHandoffIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatePrivateSerializationUnmountHandoffIdentity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateUnmountNativeBridgeCleanupHandoffDiagnosticId\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bunmountNativeExecutionRequiresFinishedWorkIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\brejectsStaleUnmountFinishedWorkIdentity\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\brequiresUnmountDeletionCleanupHandoffEvidence\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-733-test-renderer-unmount-finished-work-identity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bgetLatestScheduledRootRequestForSerializationIdentity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bidentityRootRequest\.operation\s*!==\s*rootRequestOperationForHostOutputUpdateKind\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bidentity\.rootRequestOperation\s*!==\s*['"]unmount['"]/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\brootRequestOperationForHostOutputUpdateKind\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatePrivateUnmountNativeExecutionFinishedWorkIdentity\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bvalidatePrivateUnmountSerializationFinishedWorkIdentitySourceReport\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bTestRendererPrivateSerializationFinishedWorkIdentityGate\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\bdescribe_private_to_tree_finished_work_identity_gate_for_canary\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_tree_serialization_finished_work_identity_gate_accepts_committed_handoff\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_tree_update_serialization_finished_work_identity_gate_accepts_committed_handoff\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate\b/u
    ) &&
    hasSourcePattern(
      testRendererSource,
      /\broot_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence\b/u
    );
  const privateToTreeHostOutputMetadataPubliclyBlocked =
    privateToTreeHostOutputMetadataGatePresent &&
    privateToTreePublicBlockerSourceEvidencePresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicTreeAvailable\s*:\s*false\b/u
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
      /\bcreateRendererUnsupportedFunction\(\s*['"]create\(\)\.toTree['"]/u
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
  const privateTestInstanceBridgeQueryDiagnosticsPresent =
    privateRecordOnlyTestInstanceQueryPathPresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bgetRendererTestInstanceQueryDiagnostics\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bgetTestInstanceQueryDiagnosticsForRootRequest\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bbridgeRouted\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bconsumesRootBridgeMetadata\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bstandaloneWrapperMetadata\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\brootRequestTestInstanceQueryMetadata\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /FastReactTestRendererPrivateRootRequestRecord\.rustCanaryMetadata/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /private-test-instance-query-diagnostics-routed-through-root-bridge/u
    );
  const privateTestInstanceFindAllQueryDiagnosticsPresent =
    privateTestInstanceBridgeQueryDiagnosticsPresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateTestInstanceFindAllPredicateDiagnostics\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /fast-react-test-renderer\.testinstance\.find-all-private-query/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bReactTestInstancePrivateFindAllPredicateMetadata\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpredicateKind\s*:\s*['"]type['"]/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpredicateKind\s*:\s*['"]props['"]/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpredicateKind\s*:\s*['"]predicate-like['"]/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererRoot::describe_private_test_instance_find_all_query_for_canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-463-test-renderer-find-all-private-query\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bpublicPredicateExecutionAvailable\s*:\s*false\b/u
    );
  const privateTestInstanceFindByQueryDiagnosticsPresent =
    privateTestInstanceFindAllQueryDiagnosticsPresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateTestInstanceFindByQueryDiagnostics\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /fast-react-test-renderer\.testinstance\.find-by-private-query/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bReactTestInstancePrivateFindByQueryMetadata\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererRoot::describe_private_test_instance_find_by_query_for_canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-484-test-instance-find-by-private-query-gate\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bexpectOneSource\s*:\s*['"]ReactTestRenderer\.js expectOne['"]/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bbasedOnFindAllPredicateDiagnostics\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bfindByEffectiveDeep\s*:\s*false\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bfindByExpectOne\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bfindByPredicateExecution\s*:\s*false\b/u
    );
  const privateTestInstanceQueryBridgePreflightPresent =
    privateTestInstanceFindByQueryDiagnosticsPresent &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bprivateTestInstanceQueryBridgePreflightGate\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /fast-react-test-renderer\.testinstance\.query-bridge-preflight/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bFastReactTestRendererPrivateTestInstanceQueryBridgePreflight\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bTestRendererRoot::describe_private_test_instance_query_bridge_preflight_for_canary\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bworker-515-test-renderer-live-query-bridge-preflight\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bconsumeAcceptedRustTestInstanceQueryDiagnosticsForRequest\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bgetTestInstanceQueryBridgePreflightForRootRequest\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bconsumesAcceptedRustFindAllDiagnostics\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\bconsumesAcceptedRustFindByDiagnostics\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\brecordOnlyDiagnosticConsumption\s*:\s*true\b/u
    ) &&
    hasSourcePattern(
      publicJsReactTestRendererPackageSource,
      /\brustExecutionFromJs\s*:\s*false\b/u
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
    privateTreeMetadataPresent,
    privateToJSONSerializationFacadeGatePresent,
    privateToJSONSerializationFacadeRecognizesRustDiagnostics,
    privateToJSONHostOutputDiagnosticSourceEvidencePresent,
    privateToJSONSerializationFacadeSerializesHostOutputDiagnostics,
    privateToJSONSerializationFacadeCoversBroaderHostShapes,
    privateToJSONSerializationFacadeExposesDiagnosticResult,
    privateToJSONUpdateUnmountRowsPresent,
    privateToJSONUpdatePropAndTextDiagnosticsPresent,
    privateToJSONFinishedWorkIdentityGatePresent,
    privateSerializationLifecycleSourceEvidencePresent,
    privateToJSONSerializationFacadePubliclyBlocked,
    privateToTreeHostOutputMetadataGatePresent,
    privateToTreePrivateFacadeGatePresent,
    privateToTreePrivateFacadeConsumesRustTreeMetadata,
    privateToTreeHostOutputMetadataRecognizesMinimalShape,
    privateToTreeCompositeFunctionMetadataPresent,
    privateToTreeMultiChildMetadataPresent,
    privateToTreeCommittedFiberInspectionShapeDiagnosticsPresent,
    privateToTreeFinishedWorkIdentityGatePresent,
    privateToTreeHostOutputMetadataPubliclyBlocked,
    privateRecordOnlyTestInstanceWrapperPresent,
    privateRecordOnlyTestInstanceQueryPathPresent,
    privateTestInstanceBridgeQueryDiagnosticsPresent,
    privateTestInstanceFindAllQueryDiagnosticsPresent,
    privateTestInstanceFindByQueryDiagnosticsPresent,
    privateTestInstanceQueryBridgePreflightPresent,
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
  const publicJsReactTestRendererEntrypointSources =
    publicJsReactTestRendererEntrypointSourcePaths.map((path) =>
      readWorkspaceFile(workspaceRoot, path)
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
  const updateUnmountRustLifecycleDiagnosticGateSourceEvidencePresent =
    publicJsReactTestRendererEntrypointSources.every((source) =>
      jsObjectSourceAssertionsPass({
        source,
        declaration:
          "const updateUnmountRustLifecycleDiagnosticGate = Object.freeze",
        assertions: updateUnmountRustLifecycleDiagnosticGateSourceAssertions
      })
    );
  const updatePrivateRouteLifecycleSourceEvidencePresent =
    publicJsReactTestRendererEntrypointSources.every((source) =>
      jsObjectSourceAssertionsPass({
        source,
        declaration: "const updatePrivateRoute = Object.freeze",
        assertions: updatePrivateRouteLifecycleSourceAssertions
      })
    );
  const unmountPrivateRouteLifecycleSourceEvidencePresent =
    publicJsReactTestRendererEntrypointSources.every((source) =>
      jsObjectSourceAssertionsPass({
        source,
        declaration: "const unmountPrivateRoute = Object.freeze",
        assertions: unmountPrivateRouteLifecycleSourceAssertions
      })
    );
  const updatePrivateRoutePresent =
    updatePrivateRouteLifecycleSourceEvidencePresent;
  const updatePrivateRouteConsumesLifecycleDiagnostics =
    updatePrivateRoutePresent &&
    updateUnmountRustLifecycleDiagnosticGateSourceEvidencePresent &&
    serializationLocalChecks.privateSerializationLifecycleSourceEvidencePresent;
  const unmountPrivateRoutePresent =
    unmountPrivateRouteLifecycleSourceEvidencePresent;
  const unmountPrivateRouteConsumesLifecycleDiagnostics =
    unmountPrivateRoutePresent &&
    updateUnmountRustLifecycleDiagnosticGateSourceEvidencePresent &&
    serializationLocalChecks.privateSerializationLifecycleSourceEvidencePresent;
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
    updateUnmountRustLifecycleDiagnosticGateSourceEvidencePresent,
    updatePrivateRouteLifecycleSourceEvidencePresent,
    updatePrivateRoutePresent,
    updatePrivateRouteConsumesLifecycleDiagnostics,
    unmountPrivateRouteLifecycleSourceEvidencePresent,
    unmountPrivateRoutePresent,
    unmountPrivateRouteConsumesLifecycleDiagnostics,
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
      localChecks.updatePrivateRouteConsumesLifecycleDiagnostics &&
      localChecks.publicCreateUpdateUnmountErrorSurfaceBlocked
    );
  }
  if (rowId === "react-test-renderer-unmount-route-private-diagnostic") {
    return (
      localChecks.unmountPrivateRoutePresent &&
      localChecks.unmountPrivateRouteConsumesLifecycleDiagnostics &&
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
      localChecks.privateTestInstanceBridgeQueryDiagnosticsPresent &&
      localChecks.privateTestInstanceQueryBridgePreflightPresent &&
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

function jsBooleanPropertyAssertion(property, value) {
  return freezeRecord({
    kind: "js-boolean-property",
    property,
    value
  });
}

function jsStringPropertyAssertion(property, value) {
  return freezeRecord({
    kind: "js-string-property",
    property,
    value
  });
}

function jsSourcePropertyAssertion(property, value) {
  return freezeRecord({
    kind: "js-source-property",
    property,
    value
  });
}

function jsObjectSourceAssertionsPass({ source, declaration, assertions }) {
  const extracted = extractJsObjectFreezePropertiesForDeclaration({
    source,
    declaration
  });
  if (extracted.ok !== true) {
    return false;
  }

  return assertions.every((assertion) => {
    const actualSource = extracted.properties.get(assertion.property);
    if (assertion.kind === "js-boolean-property") {
      return actualSource === String(assertion.value);
    }
    if (assertion.kind === "js-string-property") {
      return parseJsStringLiteralSource(actualSource) === assertion.value;
    }
    if (assertion.kind === "js-source-property") {
      return actualSource === assertion.value;
    }
    return false;
  });
}

function parseJsStringLiteralSource(source) {
  if (typeof source !== "string" || source.length < 2) {
    return null;
  }
  const quote = source[0];
  if (
    (quote !== "'" && quote !== '"' && quote !== "`") ||
    source[source.length - 1] !== quote
  ) {
    return null;
  }

  let value = "";
  for (let index = 1; index < source.length - 1; index += 1) {
    if (source[index] === "\\") {
      index += 1;
      if (index >= source.length - 1) {
        return null;
      }
    }
    value += source[index];
  }
  return value;
}

function jsSourceTokensOutsideCommentsAndStringsPass(source, tokens) {
  return tokens.every(
    (token) => findJsSourceOutsideCommentsAndStrings(source, token) >= 0
  );
}

function jsFunctionDeclarationSourceTokensPass({
  source,
  functionName,
  afterDeclaration,
  tokens
}) {
  const declaration = extractJsFunctionDeclarationBody({
    source,
    functionName,
    afterDeclaration
  });
  if (declaration.ok !== true) {
    return false;
  }

  return jsSourceTokensOutsideCommentsAndStringsPass(
    declaration.body,
    tokens
  );
}

function jsFunctionDeclarationSourceCallsPass({
  source,
  functionName,
  afterDeclaration = undefined,
  calls
}) {
  const declaration = extractJsFunctionDeclarationBody({
    source,
    functionName,
    afterDeclaration
  });
  if (declaration.ok !== true) {
    return false;
  }

  return calls.every((call) =>
    jsCallExpressionWithArgumentsPass({
      source: declaration.body,
      callee: call.callee,
      expectedArguments: call.arguments
    })
  );
}

function jsFunctionDeclarationReturnedFreezeRecordMethodSourceCallsPass({
  source,
  functionName,
  methodCalls
}) {
  const declaration = extractJsFunctionDeclarationBody({
    source,
    functionName
  });
  if (declaration.ok !== true) {
    return false;
  }

  const returnedObject = extractTopLevelReturnedFreezeRecordObject(
    declaration.body
  );
  if (returnedObject.ok !== true) {
    return false;
  }

  return methodCalls.every((methodCall) => {
    const method = extractTopLevelJsObjectMethodBody({
      source: declaration.body,
      openIndex: returnedObject.openIndex,
      closeIndex: returnedObject.closeIndex,
      methodName: methodCall.methodName
    });
    if (method.ok !== true) {
      return false;
    }

    return jsCallExpressionWithArgumentsPass({
      source: method.body,
      callee: methodCall.callee,
      expectedArguments: methodCall.arguments
    });
  });
}

function extractTopLevelReturnedFreezeRecordObject(source) {
  let index = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;

  while (index < source.length) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    if (
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenDepth === 0 &&
      jsIdentifierAt(source, index, "return")
    ) {
      const calleeIndex = skipJsTrivia(
        source,
        index + "return".length,
        source.length
      );
      if (!jsIdentifierAt(source, calleeIndex, "freezeRecord")) {
        index += "return".length;
        continue;
      }

      const callOpenIndex = skipJsTrivia(
        source,
        calleeIndex + "freezeRecord".length,
        source.length
      );
      if (source[callOpenIndex] !== "(") {
        return freezeRecord({
          ok: false,
          openIndex: -1,
          closeIndex: -1,
          error: "returned-freeze-record-call-not-found"
        });
      }

      const callCloseIndex = findMatchingJsEnclosure(
        source,
        callOpenIndex,
        "(",
        ")"
      );
      if (callCloseIndex < 0) {
        return freezeRecord({
          ok: false,
          openIndex: -1,
          closeIndex: -1,
          error: "returned-freeze-record-call-not-closed"
        });
      }

      const objectOpenIndex = skipJsTrivia(
        source,
        callOpenIndex + 1,
        callCloseIndex
      );
      if (source[objectOpenIndex] !== "{") {
        return freezeRecord({
          ok: false,
          openIndex: -1,
          closeIndex: -1,
          error: "returned-freeze-record-object-not-found"
        });
      }

      const objectCloseIndex = findMatchingJsBrace(source, objectOpenIndex);
      if (objectCloseIndex < 0 || objectCloseIndex > callCloseIndex) {
        return freezeRecord({
          ok: false,
          openIndex: -1,
          closeIndex: -1,
          error: "returned-freeze-record-object-not-closed"
        });
      }

      return freezeRecord({
        ok: true,
        openIndex: objectOpenIndex,
        closeIndex: objectCloseIndex,
        error: null
      });
    }

    const character = source[index];
    if (character === "{" && bracketDepth === 0 && parenDepth === 0) {
      braceDepth += 1;
    } else if (character === "}" && braceDepth > 0) {
      braceDepth -= 1;
    } else if (character === "[" && braceDepth === 0 && parenDepth === 0) {
      bracketDepth += 1;
    } else if (character === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (character === "(" && braceDepth === 0 && bracketDepth === 0) {
      parenDepth += 1;
    } else if (character === ")" && parenDepth > 0) {
      parenDepth -= 1;
    }

    index += 1;
  }

  return freezeRecord({
    ok: false,
    openIndex: -1,
    closeIndex: -1,
    error: "top-level-returned-freeze-record-not-found"
  });
}

function extractJsFunctionDeclarationBody({
  source,
  functionName,
  afterDeclaration = undefined
}) {
  const declarationIndex = findJsSourceOutsideCommentsAndStrings(
    source,
    `function ${functionName}`
  );
  if (declarationIndex < 0) {
    return freezeRecord({
      ok: false,
      body: "",
      bodyOpenIndex: -1,
      bodyCloseIndex: -1,
      error: "function-declaration-not-found"
    });
  }

  const afterNameIndex = declarationIndex + `function ${functionName}`.length;
  if (/[A-Za-z0-9_$]/u.test(source[afterNameIndex] ?? "")) {
    return freezeRecord({
      ok: false,
      body: "",
      bodyOpenIndex: -1,
      bodyCloseIndex: -1,
      error: "function-name-prefix-match"
    });
  }

  const paramsOpenIndex = skipJsTrivia(
    source,
    afterNameIndex,
    source.length
  );
  if (source[paramsOpenIndex] !== "(") {
    return freezeRecord({
      ok: false,
      body: "",
      bodyOpenIndex: -1,
      bodyCloseIndex: -1,
      error: "function-params-not-found"
    });
  }
  const paramsCloseIndex = findMatchingJsEnclosure(
    source,
    paramsOpenIndex,
    "(",
    ")"
  );
  if (paramsCloseIndex < 0) {
    return freezeRecord({
      ok: false,
      body: "",
      bodyOpenIndex: -1,
      bodyCloseIndex: -1,
      error: "function-params-not-closed"
    });
  }
  const bodyOpenIndex = skipJsTrivia(
    source,
    paramsCloseIndex + 1,
    source.length
  );
  if (source[bodyOpenIndex] !== "{") {
    return freezeRecord({
      ok: false,
      body: "",
      bodyOpenIndex: -1,
      bodyCloseIndex: -1,
      error: "function-body-not-found"
    });
  }
  const bodyCloseIndex = findMatchingJsBrace(source, bodyOpenIndex);
  if (bodyCloseIndex < 0) {
    return freezeRecord({
      ok: false,
      body: "",
      bodyOpenIndex: -1,
      bodyCloseIndex: -1,
      error: "function-body-not-closed"
    });
  }
  if (
    typeof afterDeclaration === "string" &&
    findJsSourceOutsideCommentsAndStrings(
      source,
      afterDeclaration,
      bodyCloseIndex + 1
    ) < 0
  ) {
    return freezeRecord({
      ok: false,
      body: "",
      bodyOpenIndex,
      bodyCloseIndex,
      error: "after-declaration-not-found"
    });
  }

  return freezeRecord({
    ok: true,
    body: source.slice(bodyOpenIndex + 1, bodyCloseIndex),
    bodyOpenIndex,
    bodyCloseIndex,
    error: null
  });
}

function extractJsObjectFreezePropertiesForDeclaration({
  source,
  declaration
}) {
  const declarationIndex = findJsSourceOutsideCommentsAndStrings(
    source,
    declaration
  );
  if (declarationIndex < 0) {
    return freezeRecord({
      ok: false,
      properties: new Map(),
      error: "declaration-not-found"
    });
  }

  const openIndex = findNextJsPunctuator(source, declarationIndex, "{");
  if (openIndex < 0) {
    return freezeRecord({
      ok: false,
      properties: new Map(),
      error: "object-freeze-literal-not-found"
    });
  }

  const closeIndex = findMatchingJsBrace(source, openIndex);
  if (closeIndex < 0) {
    return freezeRecord({
      ok: false,
      properties: new Map(),
      error: "object-freeze-literal-not-closed"
    });
  }

  return extractTopLevelJsObjectProperties(source, openIndex, closeIndex);
}

function extractTopLevelJsObjectProperties(source, openIndex, closeIndex) {
  const properties = new Map();
  let index = openIndex + 1;

  while (index < closeIndex) {
    index = skipJsTrivia(source, index, closeIndex);
    while (source[index] === "," && index < closeIndex) {
      index = skipJsTrivia(source, index + 1, closeIndex);
    }
    if (index >= closeIndex) {
      break;
    }

    const propertyKey = readJsObjectPropertyKey(source, index, closeIndex);
    if (propertyKey.ok !== true) {
      const nextIndex = findNextTopLevelPropertySeparator(
        source,
        index,
        closeIndex
      );
      index = nextIndex < closeIndex ? nextIndex + 1 : closeIndex;
      continue;
    }

    index = skipJsTrivia(source, propertyKey.end, closeIndex);
    if (source[index] !== ":") {
      const nextIndex = findNextTopLevelPropertySeparator(
        source,
        index,
        closeIndex
      );
      index = nextIndex < closeIndex ? nextIndex + 1 : closeIndex;
      continue;
    }

    const valueStart = skipJsTrivia(source, index + 1, closeIndex);
    const valueEnd = findNextTopLevelPropertySeparator(
      source,
      valueStart,
      closeIndex
    );
    properties.set(propertyKey.key, source.slice(valueStart, valueEnd).trim());
    index = valueEnd < closeIndex ? valueEnd + 1 : closeIndex;
  }

  return freezeRecord({
    ok: true,
    properties,
    error: null
  });
}

function findJsSourceOutsideCommentsAndStrings(source, needle, fromIndex = 0) {
  let index = fromIndex;

  while (index < source.length) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    if (source.startsWith(needle, index)) {
      return index;
    }

    index += 1;
  }

  return -1;
}

function findNextJsPunctuator(source, startIndex, punctuator) {
  let index = startIndex;

  while (index < source.length) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    if (source[index] === punctuator) {
      return index;
    }

    index += 1;
  }

  return -1;
}

function findMatchingJsBrace(source, openIndex) {
  return findMatchingJsEnclosure(source, openIndex, "{", "}");
}

function findMatchingJsEnclosure(source, openIndex, openCharacter, closeCharacter) {
  let depth = 0;
  let index = openIndex;

  while (index < source.length) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    if (source[index] === openCharacter) {
      depth += 1;
    } else if (source[index] === closeCharacter) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }

    index += 1;
  }

  return -1;
}

function extractTopLevelJsObjectMethodBody({
  source,
  openIndex,
  closeIndex,
  methodName
}) {
  let index = openIndex + 1;

  while (index < closeIndex) {
    index = skipJsTrivia(source, index, closeIndex);
    while (source[index] === "," && index < closeIndex) {
      index = skipJsTrivia(source, index + 1, closeIndex);
    }
    if (index >= closeIndex) {
      break;
    }

    const propertyKey = readJsObjectPropertyKey(source, index, closeIndex);
    if (propertyKey.ok !== true) {
      const nextIndex = findNextTopLevelPropertySeparator(
        source,
        index,
        closeIndex
      );
      index = nextIndex < closeIndex ? nextIndex + 1 : closeIndex;
      continue;
    }

    const afterKeyIndex = skipJsTrivia(source, propertyKey.end, closeIndex);
    if (source[afterKeyIndex] === "(") {
      const paramsCloseIndex = findMatchingJsEnclosure(
        source,
        afterKeyIndex,
        "(",
        ")"
      );
      if (paramsCloseIndex < 0) {
        return freezeRecord({
          ok: false,
          body: "",
          bodyOpenIndex: -1,
          bodyCloseIndex: -1,
          error: "object-method-params-not-closed"
        });
      }

      const bodyOpenIndex = skipJsTrivia(
        source,
        paramsCloseIndex + 1,
        closeIndex
      );
      if (source[bodyOpenIndex] !== "{") {
        const nextIndex = findNextTopLevelPropertySeparator(
          source,
          paramsCloseIndex + 1,
          closeIndex
        );
        index = nextIndex < closeIndex ? nextIndex + 1 : closeIndex;
        continue;
      }

      const bodyCloseIndex = findMatchingJsBrace(source, bodyOpenIndex);
      if (bodyCloseIndex < 0 || bodyCloseIndex > closeIndex) {
        return freezeRecord({
          ok: false,
          body: "",
          bodyOpenIndex: -1,
          bodyCloseIndex: -1,
          error: "object-method-body-not-closed"
        });
      }

      if (propertyKey.key === methodName) {
        return freezeRecord({
          ok: true,
          body: source.slice(bodyOpenIndex + 1, bodyCloseIndex),
          bodyOpenIndex,
          bodyCloseIndex,
          error: null
        });
      }

      index = bodyCloseIndex + 1;
      continue;
    }

    const nextIndex = findNextTopLevelPropertySeparator(
      source,
      afterKeyIndex,
      closeIndex
    );
    index = nextIndex < closeIndex ? nextIndex + 1 : closeIndex;
  }

  return freezeRecord({
    ok: false,
    body: "",
    bodyOpenIndex: -1,
    bodyCloseIndex: -1,
    error: "top-level-object-method-not-found"
  });
}

function jsCallExpressionWithArgumentsPass({
  source,
  callee,
  expectedArguments
}) {
  let searchIndex = 0;

  while (searchIndex < source.length) {
    const calleeIndex = findJsSourceOutsideCommentsAndStrings(
      source,
      callee,
      searchIndex
    );
    if (calleeIndex < 0) {
      return false;
    }

    const beforeCallee = source[calleeIndex - 1] ?? "";
    const afterCalleeIndex = calleeIndex + callee.length;
    const afterCallee = source[afterCalleeIndex] ?? "";
    if (
      /[A-Za-z0-9_$]/u.test(beforeCallee) ||
      /[A-Za-z0-9_$]/u.test(afterCallee)
    ) {
      searchIndex = afterCalleeIndex;
      continue;
    }

    const callOpenIndex = skipJsTrivia(
      source,
      afterCalleeIndex,
      source.length
    );
    if (source[callOpenIndex] !== "(") {
      searchIndex = afterCalleeIndex;
      continue;
    }

    const callCloseIndex = findMatchingJsEnclosure(
      source,
      callOpenIndex,
      "(",
      ")"
    );
    if (callCloseIndex < 0) {
      return false;
    }

    const actualArguments = extractTopLevelJsCallArguments(
      source,
      callOpenIndex,
      callCloseIndex
    );
    if (
      actualArguments.length === expectedArguments.length &&
      actualArguments.every(
        (actualArgument, index) => actualArgument === expectedArguments[index]
      )
    ) {
      return true;
    }

    searchIndex = callCloseIndex + 1;
  }

  return false;
}

function extractTopLevelJsCallArguments(source, openIndex, closeIndex) {
  const callArguments = [];
  let index = openIndex + 1;

  while (index < closeIndex) {
    const argumentStart = skipJsTrivia(source, index, closeIndex);
    if (argumentStart >= closeIndex) {
      break;
    }

    const argumentEnd = findNextTopLevelPropertySeparator(
      source,
      argumentStart,
      closeIndex
    );
    callArguments.push(source.slice(argumentStart, argumentEnd).trim());
    index = argumentEnd < closeIndex ? argumentEnd + 1 : closeIndex;
  }

  return callArguments;
}

function findNextTopLevelPropertySeparator(source, startIndex, endIndex) {
  let index = startIndex;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;

  while (index < endIndex) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    const character = source[index];
    if (character === "{" && bracketDepth === 0 && parenDepth === 0) {
      braceDepth += 1;
    } else if (character === "}" && braceDepth > 0) {
      braceDepth -= 1;
    } else if (character === "[" && braceDepth === 0 && parenDepth === 0) {
      bracketDepth += 1;
    } else if (character === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (character === "(" && braceDepth === 0 && bracketDepth === 0) {
      parenDepth += 1;
    } else if (character === ")" && parenDepth > 0) {
      parenDepth -= 1;
    } else if (
      character === "," &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenDepth === 0
    ) {
      return index;
    }

    index += 1;
  }

  return endIndex;
}

function skipJsTrivia(source, startIndex, endIndex) {
  let index = startIndex;

  while (index < endIndex) {
    const character = source[index];
    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }
    if (source.startsWith("//", index)) {
      const lineEnd = source.indexOf("\n", index + 2);
      index = lineEnd < 0 ? endIndex : lineEnd + 1;
      continue;
    }
    if (source.startsWith("/*", index)) {
      const blockEnd = source.indexOf("*/", index + 2);
      index = blockEnd < 0 ? endIndex : blockEnd + 2;
      continue;
    }
    break;
  }

  return index;
}

function skipJsCommentStringOrRegex(source, index) {
  const nextIndex = skipJsCommentOrString(source, index);
  if (nextIndex !== index) {
    return nextIndex;
  }

  const character = source[index];
  if (character === "/" && isJsRegexLiteralStart(source, index)) {
    const regexEnd = skipJsRegexLiteral(source, index);
    if (regexEnd !== index) {
      return regexEnd;
    }
  }

  return index;
}

function skipJsCommentOrString(source, index) {
  if (source.startsWith("//", index)) {
    const lineEnd = source.indexOf("\n", index + 2);
    return lineEnd < 0 ? source.length : lineEnd + 1;
  }
  if (source.startsWith("/*", index)) {
    const blockEnd = source.indexOf("*/", index + 2);
    return blockEnd < 0 ? source.length : blockEnd + 2;
  }

  const character = source[index];
  if (character === "'" || character === '"' || character === "`") {
    return skipQuotedJsLiteral(source, index);
  }

  return index;
}

function isJsRegexLiteralStart(source, index) {
  const previousToken = findPreviousJsSignificantToken(source, index);
  if (previousToken === null) {
    return true;
  }
  if (previousToken.type === "word") {
    return [
      "await",
      "case",
      "delete",
      "else",
      "in",
      "instanceof",
      "new",
      "of",
      "return",
      "throw",
      "typeof",
      "void",
      "yield"
    ].includes(previousToken.value);
  }
  return "({[=,:;!?&|^~+-*%<>}".includes(previousToken.value);
}

function findPreviousJsSignificantToken(source, index) {
  let cursor = 0;
  let previousToken = null;

  while (cursor < index) {
    const nextIndex = skipJsCommentOrString(source, cursor);
    if (nextIndex !== cursor) {
      cursor = nextIndex;
      continue;
    }

    const character = source[cursor];
    if (/\s/u.test(character)) {
      cursor += 1;
      continue;
    }
    if (/[A-Za-z0-9_$]/u.test(character)) {
      const start = cursor;
      cursor += 1;
      while (cursor < index && /[A-Za-z0-9_$]/u.test(source[cursor])) {
        cursor += 1;
      }
      previousToken = freezeRecord({
        type: "word",
        value: source.slice(start, cursor)
      });
      continue;
    }

    previousToken = freezeRecord({
      type: "punctuator",
      value: character
    });
    cursor += 1;
  }

  return previousToken;
}

function jsIdentifierAt(source, index, identifier) {
  if (!source.startsWith(identifier, index)) {
    return false;
  }

  const beforeIdentifier = source[index - 1] ?? "";
  const afterIdentifier = source[index + identifier.length] ?? "";
  return (
    !/[A-Za-z0-9_$]/u.test(beforeIdentifier) &&
    !/[A-Za-z0-9_$]/u.test(afterIdentifier)
  );
}

function readJsObjectPropertyKey(source, startIndex, endIndex) {
  const character = source[startIndex];
  if (!/[A-Za-z_$]/u.test(character)) {
    return freezeRecord({
      ok: false,
      key: null,
      end: startIndex,
      error: "property-key-not-supported"
    });
  }

  let index = startIndex + 1;
  while (index < endIndex && /[A-Za-z0-9_$]/u.test(source[index])) {
    index += 1;
  }

  return freezeRecord({
    ok: true,
    key: source.slice(startIndex, index),
    end: index,
    error: null
  });
}

function skipQuotedJsLiteral(source, startIndex) {
  const quote = source[startIndex];
  let index = startIndex + 1;

  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }
    if (source[index] === quote) {
      return index + 1;
    }
    index += 1;
  }

  return source.length;
}

function skipJsRegexLiteral(source, startIndex) {
  let index = startIndex + 1;
  let inCharacterClass = false;

  while (index < source.length) {
    const character = source[index];
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === "\n" || character === "\r") {
      return startIndex;
    }
    if (character === "[") {
      inCharacterClass = true;
      index += 1;
      continue;
    }
    if (character === "]" && inCharacterClass) {
      inCharacterClass = false;
      index += 1;
      continue;
    }
    if (character === "/" && !inCharacterClass) {
      index += 1;
      while (index < source.length && /[A-Za-z]/u.test(source[index])) {
        index += 1;
      }
      return index;
    }
    index += 1;
  }

  return startIndex;
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

function freezeArray(value) {
  return Object.freeze([...value]);
}

function freezeRecord(value) {
  return Object.freeze(value);
}
