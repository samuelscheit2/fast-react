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
  REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPARISON_CLAIM_FIELDS,
  REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPATIBILITY_CLAIM_FIELDS,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS
} from "./react-test-renderer-serialization-targets.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS =
  "ready-for-private-diagnostics-public-serialization-compatibility-blocked";

export const REACT_TEST_RENDERER_SERIALIZATION_PRIVATE_DIAGNOSTICS_BLOCKED_STATUS =
  "blocked-until-private-serialization-diagnostics";

export const REACT_TEST_RENDERER_SERIALIZATION_PRIVATE_DIAGNOSTIC_REQUIREMENTS =
  freezeArray([
    freezeRecord({
      id: "rust-test-renderer-root-facade",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "Public serialization needs a Rust TestRendererRoot that owns reconciler root state instead of direct host snapshots."
    }),
    freezeRecord({
      id: "committed-test-renderer-host-output",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "toJSON output must be read after reconciler commit produces test-renderer host output."
    }),
    freezeRecord({
      id: "committed-fiber-inspection-api",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "toTree and TestInstance queries need a read-only current-fiber view, not raw mutation host handles."
    }),
    freezeRecord({
      id: "private-json-diagnostics",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The Rust test-renderer canary must expose deterministic private JSON diagnostics before any public serializer is considered."
    })
  ]);

export const REACT_TEST_RENDERER_TOJSON_PRIVATE_FACADE_REQUIREMENTS =
  freezeArray([
    freezeRecord({
      id: "js-tojson-private-serialization-facade-gate",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The JS react-test-renderer facade must record a private toJSON gate without exposing a public serializer."
    }),
    freezeRecord({
      id: "js-tojson-accepted-rust-private-json-diagnostics",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toJSON gate must point at the accepted Rust private JSON diagnostic report, API, and canary tests."
    }),
    freezeRecord({
      id: "js-tojson-serializes-accepted-host-output-diagnostics",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toJSON facade must serialize the accepted minimal committed host-output diagnostic shape without exposing public toJSON."
    }),
    freezeRecord({
      id: "js-tojson-broader-host-shape-diagnostics",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toJSON facade must cover multiple host children, text siblings, prop elision, and empty roots while public toJSON stays blocked."
    }),
    freezeRecord({
      id: "js-tojson-exposes-private-diagnostic-result",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toJSON facade must expose an evidence-backed diagnostic result record without turning the public toJSON method on."
    }),
    freezeRecord({
      id: "js-tojson-update-unmount-host-output-rows",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toJSON facade must expose explicit update and unmount host-output rows with dependency metadata while public serialization stays blocked."
    }),
    freezeRecord({
      id: "js-tojson-update-prop-and-text-diagnostics",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toJSON facade must retain an accepted HostComponent prop plus text update payload while public serialization stays blocked."
    }),
    freezeRecord({
      id: "js-tojson-finished-work-identity-gate",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toJSON facade must validate serialization evidence against the committed HostRoot finished_work identity and lane handoff."
    }),
    freezeRecord({
      id: "js-tojson-public-serialization-blocked",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toJSON gate must keep public serialization, native bridge execution, and compatibility claims false."
    })
  ]);

export const REACT_TEST_RENDERER_TOTREE_PRIVATE_METADATA_REQUIREMENTS =
  freezeArray([
    freezeRecord({
      id: "js-totree-private-host-output-metadata-gate",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The JS react-test-renderer facade must record private toTree metadata without exposing public toTree output."
    }),
    freezeRecord({
      id: "js-totree-private-facade-gate",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The JS react-test-renderer facade must expose a hidden private toTree facade without making create().toTree public."
    }),
    freezeRecord({
      id: "js-totree-consumes-accepted-rust-private-tree-metadata",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toTree facade must consume the accepted Rust private tree metadata report, not only JS-local shape metadata."
    }),
    freezeRecord({
      id: "js-totree-recognizes-accepted-minimal-host-output-shape",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toTree metadata must be tied to the accepted HostRoot -> HostComponent -> HostText canary shape."
    }),
    freezeRecord({
      id: "js-totree-private-composite-function-metadata",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toTree metadata must record the FunctionComponent tree wrapper above the accepted committed host output without exposing public toTree."
    }),
    freezeRecord({
      id: "js-totree-private-multi-child-metadata",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toTree metadata must record minimal multi-child host output and composite-above-multi-child shapes without exposing public toTree."
    }),
    freezeRecord({
      id: "js-totree-private-committed-fiber-shape-diagnostics",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toTree metadata must be backed by committed-fiber inspection shape diagnostics for multi-child and FunctionComponent wrapper shapes."
    }),
    freezeRecord({
      id: "js-totree-finished-work-identity-gate",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toTree facade must validate metadata against the committed HostRoot finished_work identity and lane handoff."
    }),
    freezeRecord({
      id: "js-totree-public-tree-blocked",
      requiredBeforePrivateDiagnostics: true,
      reason:
        "The private toTree metadata must keep public toTree, native bridge execution, and compatibility claims false."
    })
  ]);

export const REACT_TEST_RENDERER_SERIALIZATION_PUBLIC_COMPATIBILITY_STATUS =
  "blocked-public-react-test-renderer-serialization-compatibility";

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS =
  freezeArray([
    freezeRecord({
      id: "public-to-json-api",
      requiredBeforeCompatibilityClaim: true,
      reason:
        "Public compatibility needs create().toJSON to route to Fast React serialization instead of the placeholder thrower."
    }),
    freezeRecord({
      id: "public-to-tree-api",
      requiredBeforeCompatibilityClaim: true,
      reason:
        "Public compatibility needs create().toTree to expose React-shaped tree output instead of the placeholder thrower."
    }),
    freezeRecord({
      id: "public-test-instance-wrappers",
      requiredBeforeCompatibilityClaim: true,
      reason:
        "Public compatibility needs ReactTestInstance root and query wrappers, not private fiber diagnostics."
    }),
    freezeRecord({
      id: "public-js-react-test-renderer-routing",
      requiredBeforeCompatibilityClaim: true,
      reason:
        "A dual-run compatibility claim needs the public JS facade to route create, update, unmount, and serialization through the Rust test renderer."
    })
  ]);

export const REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS =
  freezeArray(
    REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS.map((scenarioId) =>
      freezeRecord({
        scenarioId,
        readyForPrivateDiagnostics: true,
        publicComparisonBlocked: true,
        admittedForFastReactComparison: false,
        compatibilityClaimed: false,
        status: REACT_TEST_RENDERER_SERIALIZATION_PUBLIC_COMPATIBILITY_STATUS,
        unblockRequires: freezeArray(
          REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS.map(
            (requirement) => requirement.id
          )
        )
      })
    )
  );

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
    privatePrerequisite:
      "accepted CJS TestInstance query bridge preflight diagnostics"
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
    hasReactTestRendererSerializationFastReactClaim(oracle.conformanceClaims) ||
      hasReactTestRendererSerializationFastReactClaim(oracle.evidenceClaims) ||
      hasReactTestRendererSerializationFastReactClaim(
        oracle.localFastReactStatus
      ) ||
      hasReactTestRendererSerializationFastReactClaim(
        REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS
      )
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
  const localFastReactStatusViolations =
    validateReactTestRendererSerializationLocalFastReactStatus({
      localChecks,
      oracleStatus: oracle.localFastReactStatus,
      sourceStatus: REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS
    });
  violations.push(...localFastReactStatusViolations);

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
    localFastReactStatusViolations,
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

const publicJsReactTestRendererCjsEntrypointSourcePaths = freezeArray([
  "packages/react-test-renderer/cjs/react-test-renderer.development.js",
  "packages/react-test-renderer/cjs/react-test-renderer.production.js"
]);

const publicJsReactTestRendererExactPlaceholderPackageRoot =
  "packages/react-test-renderer";

const reactTestRendererCompatibilityTarget = "react-test-renderer@19.2.6";

const reactTestRendererPlaceholderVersion =
  "0.0.0-fast-react-test-renderer-placeholder";

const reactTestRendererExpectedRendererExportNames = freezeArray([
  "_Scheduler",
  "act",
  "create",
  "unstable_batchedUpdates",
  "version"
]);

const reactTestRendererPlaceholderClaimFieldNames = freezeArray([
  "ReactTestInstance",
  "TestInstance",
  "browserDomCompatibilityClaimed",
  "compatibilityClaim",
  "compatibilityClaimed",
  "createRouteAvailable",
  "fastReactBehaviorCompatible",
  "nativeAddonLoaded",
  "nativeBridgeAvailable",
  "nativeBridgeLoadingAvailable",
  "nativeExecution",
  "nativeExecutionAvailable",
  "packageCompatibilityClaimed",
  "publicCompatibilityClaimed",
  "publicJsFacadeRoutingPresent",
  "publicSerializationAvailable",
  "publicTestInstanceWrappersPresent",
  "reactTestRendererCompatibilityClaimed",
  "rendererCompatibilityClaimed",
  "rootCompatibilityClaimed",
  "serializationAvailable",
  "serializationCompatibilityClaimed",
  "testInstanceCompatibilityClaimed"
]);

const reactTestRendererRendererEntrypointPlaceholderSpecs = freezeArray([
  freezeRecord({
    relativePath: "index.js",
    entrypoint: "react-test-renderer",
    actExport: "environment-blocked"
  }),
  freezeRecord({
    relativePath: "cjs/react-test-renderer.development.js",
    entrypoint: "react-test-renderer/cjs/react-test-renderer.development",
    actExport: "blocked-function"
  }),
  freezeRecord({
    relativePath: "cjs/react-test-renderer.production.js",
    entrypoint: "react-test-renderer/cjs/react-test-renderer.production",
    actExport: "undefined"
  })
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

const createRoutingGateSourceAssertions = freezeArray([
  jsStringPropertyAssertion(
    "id",
    "react-test-renderer-create-routing-prerequisite-gate"
  ),
  jsSourcePropertyAssertion("status", "createRoutingGateStatus"),
  jsBooleanPropertyAssertion("deterministic", true),
  jsBooleanPropertyAssertion("nativeBridgeAvailable", false),
  jsBooleanPropertyAssertion("nativeExecution", false),
  jsBooleanPropertyAssertion("privateRootRequestBridgeAvailable", true),
  jsStringPropertyAssertion(
    "privateRootRequestBridgeStatus",
    "admitted-private-test-renderer-root-request-record"
  ),
  jsStringPropertyAssertion(
    "privateRootRequestBridgeExecutionStatus",
    "admitted-private-test-renderer-root-execution-bridge"
  ),
  jsBooleanPropertyAssertion("rootRequestRecordOnly", false),
  jsBooleanPropertyAssertion("privateRootExecutionBridgeAvailable", true),
  jsBooleanPropertyAssertion("rustRootExecutionBoundaryCallable", true),
  jsBooleanPropertyAssertion("createRouteAvailable", false),
  jsBooleanPropertyAssertion("updateRouteAvailable", false),
  jsBooleanPropertyAssertion("unmountRouteAvailable", false),
  jsBooleanPropertyAssertion("serializationAvailable", false),
  jsBooleanPropertyAssertion("actIntegrationAvailable", false),
  jsBooleanPropertyAssertion("schedulerIntegrationAvailable", false),
  jsBooleanPropertyAssertion("compatibilityClaimed", false)
]);

const createRoutingGateCreateFunctionSourceCalls = freezeArray([
  freezeRecord({
    callee: "createPlaceholderRenderer",
    arguments: freezeArray([
      "createRoutingGate",
      "element",
      "options",
      "createRequest"
    ])
  })
]);

const privateTestInstanceQueryBridgePreflightGateSourceAssertions = freezeArray([
  jsQuotedStringPropertyAssertion(
    "id",
    "react-test-renderer-private-test-instance-query-bridge-preflight-gate"
  ),
  jsSourcePropertyAssertion(
    "diagnosticName",
    "privateTestInstanceQueryBridgePreflightDiagnosticName"
  ),
  jsSourcePropertyAssertion(
    "status",
    "privateTestInstanceQueryBridgePreflightStatus"
  ),
  jsQuotedStringPropertyAssertion(
    "publicSurface",
    "create().root/ReactTestInstance.find*"
  ),
  jsQuotedStringPropertyAssertion(
    "acceptedWorker",
    "worker-515-test-renderer-live-query-bridge-preflight"
  ),
  jsQuotedStringPropertyAssertion("acceptedRustCrate", "fast-react-test-renderer"),
  jsSourcePropertyAssertion(
    "acceptedRustDiagnosticName",
    "privateTestInstanceQueryBridgePreflightDiagnosticName"
  ),
  jsQuotedStringArrayPropertyIncludesAssertion("acceptedRustApis", [
    "TestRendererRoot::describe_private_test_instance_query_bridge_preflight_for_canary",
    "TestRendererRoot::describe_private_test_instance_query_bridge_preflight_after_update_for_canary",
    "TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics"
  ]),
  jsQuotedStringArrayPropertyIncludesAssertion("acceptedRustTests", [
    "root_private_test_instance_query_bridge_preflight_ties_find_all_and_find_by_records",
    "root_private_test_instance_query_bridge_preflight_follows_update_records"
  ]),
  jsQuotedStringPropertyAssertion(
    "bridgeSource",
    "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery"
  ),
  jsSourcePropertyAssertion(
    "wrapperRecordSymbol",
    "privateTestInstanceWrapperRecordSymbol.description"
  ),
  jsSourcePropertyAssertion(
    "sourceFindAllDiagnosticName",
    "privateTestInstanceFindAllPredicateDiagnostics.diagnosticName"
  ),
  jsSourcePropertyAssertion(
    "sourceFindByDiagnosticName",
    "privateTestInstanceFindByQueryDiagnostics.diagnosticName"
  ),
  jsBooleanPropertyAssertion("consumesAcceptedRustFindAllDiagnostics", true),
  jsBooleanPropertyAssertion("consumesAcceptedRustFindByDiagnostics", true),
  jsBooleanPropertyAssertion("recordOnlyDiagnosticConsumption", true),
  jsBooleanPropertyAssertion("publicRootAvailable", false),
  jsBooleanPropertyAssertion("publicQueryMethodsAvailable", false),
  jsBooleanPropertyAssertion("publicTestInstanceObjectAvailable", false),
  jsBooleanPropertyAssertion("nativeBridgeAvailable", false),
  jsBooleanPropertyAssertion("nativeExecution", false),
  jsBooleanPropertyAssertion("rustExecutionFromJs", false),
  jsBooleanPropertyAssertion("compatibilityClaimed", false)
]);

const privateTestInstanceQueryBridgePreflightRecordSourceAssertions =
  freezeArray([
    jsQuotedStringPropertyAssertion(
      "id",
      "react-test-renderer-private-test-instance-query-bridge-preflight"
    ),
    jsQuotedStringPropertyAssertion(
      "kind",
      "FastReactTestRendererPrivateTestInstanceQueryBridgePreflight"
    ),
    jsSourcePropertyAssertion(
      "diagnosticName",
      "privateTestInstanceQueryBridgePreflightDiagnosticName"
    ),
    jsSourcePropertyAssertion(
      "status",
      "privateTestInstanceQueryBridgePreflightStatus"
    ),
    jsSourcePropertyAssertion("gate", "privateTestInstanceQueryBridgePreflightGate"),
    jsBooleanPropertyAssertion("privateRootLifecycleEvidenceAccepted", true),
    jsQuotedStringPropertyAssertion(
      "bridgeSource",
      "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery"
    ),
    jsSourcePropertyAssertion(
      "wrapperRecordSymbol",
      "privateTestInstanceWrapperRecordSymbol.description"
    ),
    jsSourcePropertyAssertion(
      "sourceFindAllDiagnosticName",
      "normalizedFindAll.diagnosticName"
    ),
    jsSourcePropertyAssertion(
      "sourceFindByDiagnosticName",
      "normalizedFindBy.diagnosticName"
    ),
    jsBooleanPropertyAssertion("consumesAcceptedRustFindAllDiagnostics", true),
    jsBooleanPropertyAssertion("consumesAcceptedRustFindByDiagnostics", true),
    jsBooleanPropertyAssertion(
      "consumesPrivateRootLifecycleExecutionEvidence",
      true
    ),
    jsBooleanPropertyAssertion("recordOnlyDiagnosticConsumption", true),
    jsBooleanPropertyAssertion("publicRootAvailable", false),
    jsBooleanPropertyAssertion("publicQueryMethodsAvailable", false),
    jsBooleanPropertyAssertion("publicTestInstanceObjectAvailable", false),
    jsBooleanPropertyAssertion("nativeBridgeAvailable", false),
    jsBooleanPropertyAssertion("nativeExecution", false),
    jsBooleanPropertyAssertion("rustExecutionFromJs", false),
    jsBooleanPropertyAssertion("compatibilityClaimed", false)
  ]);

const privateTestInstanceWrapperQueryBridgePreflightSourceAssertions =
  freezeArray([
    jsSourcePropertyAssertion("queryBridgePreflight", "queryBridgePreflight"),
    jsSourcePropertyAssertion(
      "acceptedRustFindAllDiagnostics",
      "queryBridgePreflight.acceptedRustFindAllDiagnostics"
    ),
    jsSourcePropertyAssertion(
      "acceptedRustFindByDiagnostics",
      "queryBridgePreflight.acceptedRustFindByDiagnostics"
    )
  ]);

const cjsTestInstanceQueryBridgePreflightSourceEvidenceCache = new Map();

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
  const publicJsReactTestRendererCjsEntrypointSources =
    publicJsReactTestRendererCjsEntrypointSourcePaths.map((path) =>
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
    isPlaceholderReactTestRendererPackage(
      workspaceRoot,
      publicJsReactTestRendererExactPlaceholderPackageRoot
    ) &&
    publicJsReactTestRendererPackageRoots.every(
      (packageRoot) =>
        packageRoot === publicJsReactTestRendererExactPlaceholderPackageRoot ||
        !existsWorkspacePath(workspaceRoot, `${packageRoot}/package.json`)
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
  const privateCjsTestInstanceQueryBridgePreflightPresent =
    publicJsReactTestRendererFacadePresent &&
    publicJsReactTestRendererCjsEntrypointSources.length ===
      publicJsReactTestRendererCjsEntrypointSourcePaths.length &&
    publicJsReactTestRendererCjsEntrypointSources.every((source) =>
      cjsTestInstanceQueryBridgePreflightSourceEvidencePresent(source)
    );
  const privateTestInstanceQueryBridgePreflightPresent =
    privateCjsTestInstanceQueryBridgePreflightPresent;
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
    privateCjsTestInstanceQueryBridgePreflightPresent,
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
    publicJsReactTestRendererEntrypointSources.every(
      (source) =>
        jsObjectSourceAssertionsPass({
          source,
          declaration: "const createRoutingGate = Object.freeze",
          assertions: createRoutingGateSourceAssertions
        }) &&
        jsFunctionDeclarationSourceCallsPass({
          source,
          functionName: "create",
          calls: createRoutingGateCreateFunctionSourceCalls
        })
    );
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

function validateReactTestRendererSerializationLocalFastReactStatus({
  localChecks,
  oracleStatus,
  sourceStatus
}) {
  const expectedStatus =
    expectedReactTestRendererSerializationLocalFastReactStatus(localChecks);
  const violations = [];

  if (!oracleStatus || typeof oracleStatus !== "object") {
    violations.push(
      freezeRecord({
        id: "local-fast-react-status-oracle-missing",
        reason:
          "The serialization oracle must record the local Fast React test-renderer status."
      })
    );
  } else {
    appendLocalFastReactStatusSourceMismatchViolations({
      actualStatus: oracleStatus,
      expectedStatus: sourceStatus,
      sourceName: "oracle.localFastReactStatus",
      violations
    });
    appendLocalFastReactStatusClaimViolations({
      status: oracleStatus,
      sourceName: "oracle.localFastReactStatus",
      violations
    });
    if (oracleStatus.status !== expectedStatus) {
      violations.push(
        freezeRecord({
          id: "local-fast-react-status-oracle-stale",
          reason:
            "The serialization oracle local status must match the current workspace react-test-renderer package state.",
          expectedStatus,
          actualStatus: oracleStatus.status,
          localPackageStatus: localChecks.publicJsReactTestRendererFacadeStatus
        })
      );
    }
  }

  appendLocalFastReactStatusClaimViolations({
    status: sourceStatus,
    sourceName: "source.localFastReactStatus",
    violations
  });
  if (sourceStatus.status !== expectedStatus) {
    violations.push(
      freezeRecord({
        id: "local-fast-react-status-source-stale",
        reason:
          "The source-owned local Fast React status must match the current workspace react-test-renderer package state.",
        expectedStatus,
        actualStatus: sourceStatus.status,
        localPackageStatus: localChecks.publicJsReactTestRendererFacadeStatus
      })
    );
  }

  return freezeArray(violations);
}

function appendLocalFastReactStatusSourceMismatchViolations({
  actualStatus,
  expectedStatus,
  sourceName,
  violations
}) {
  for (const key of Object.keys(expectedStatus)) {
    if (actualStatus[key] !== expectedStatus[key]) {
      violations.push(
        freezeRecord({
          id: "local-fast-react-status-source-mismatch",
          source: sourceName,
          field: key,
          expected: expectedStatus[key],
          actual: actualStatus[key]
        })
      );
    }
  }
}

function appendLocalFastReactStatusClaimViolations({
  status,
  sourceName,
  violations
}) {
  if (!status || typeof status !== "object") {
    return;
  }

  appendLocalFastReactStatusClaimFieldViolations({
    status,
    sourceName,
    fields: REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPARISON_CLAIM_FIELDS,
    id: "local-fast-react-status-claims-fast-react-comparison",
    reason:
      "The React-only serialization oracle must not claim a Fast React react-test-renderer comparison.",
    violations
  });
  appendLocalFastReactStatusClaimFieldViolations({
    status,
    sourceName,
    fields:
      REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPATIBILITY_CLAIM_FIELDS,
    id: "local-fast-react-status-claims-compatibility",
    reason:
      "The React-only serialization oracle must not claim Fast React react-test-renderer compatibility.",
    violations
  });
}

function appendLocalFastReactStatusClaimFieldViolations({
  status,
  sourceName,
  fields,
  id,
  reason,
  violations
}) {
  for (const field of fields) {
    if (Object.hasOwn(status, field) && status[field] !== false) {
      violations.push(
        freezeRecord({
          id,
          source: sourceName,
          field,
          reason
        })
      );
    }
  }
}

function hasReactTestRendererSerializationFastReactClaim(record) {
  if (!record || typeof record !== "object") {
    return false;
  }

  return [
    ...REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPARISON_CLAIM_FIELDS,
    ...REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPATIBILITY_CLAIM_FIELDS
  ].some((field) => Object.hasOwn(record, field) && record[field] !== false);
}

function expectedReactTestRendererSerializationLocalFastReactStatus(localChecks) {
  if (
    localChecks.publicJsReactTestRendererFacadeStatus === "placeholder-present"
  ) {
    return "placeholder-present";
  }
  if (localChecks.publicJsReactTestRendererFacadeStatus === "present") {
    return "present-in-workspace";
  }
  return "not-present-in-workspace";
}

function isPlaceholderReactTestRendererPackage(workspaceRoot, packageRoot) {
  if (packageRoot !== publicJsReactTestRendererExactPlaceholderPackageRoot) {
    return false;
  }

  if (!isExactReactTestRendererPlaceholderPackageJson(workspaceRoot)) {
    return false;
  }

  return (
    reactTestRendererRendererEntrypointPlaceholderSpecs.every((spec) =>
      isExactReactTestRendererPlaceholderRendererEntrypoint(
        workspaceRoot,
        spec
      )
    ) &&
    isExactReactTestRendererPlaceholderShallowEntrypoint(workspaceRoot)
  );
}

function isExactReactTestRendererPlaceholderPackageJson(workspaceRoot) {
  const packageJson = readWorkspaceFile(
    workspaceRoot,
    `${publicJsReactTestRendererExactPlaceholderPackageRoot}/package.json`
  );
  if (packageJson === "") {
    return false;
  }

  let parsed;
  try {
    parsed = JSON.parse(packageJson);
  } catch {
    return false;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return false;
  }

  return (
    parsed.name === "@fast-react/react-test-renderer" &&
    parsed.version === "0.0.0" &&
    parsed.private === true &&
    parsed.main === "index.js" &&
    parsed.dependencies?.scheduler === "^0.27.0" &&
    parsed.peerDependencies?.["@fast-react/react"] === "0.0.0" &&
    parsed.engines?.node === ">=26.0.0" &&
    !Object.hasOwn(parsed, "exports") &&
    !Object.hasOwn(parsed, "module") &&
    !Object.hasOwn(parsed, "browser") &&
    !Object.hasOwn(parsed, "react-native") &&
    !Object.hasOwn(parsed, "types") &&
    !jsonRecordContainsClaimField(parsed)
  );
}

function jsonRecordContainsClaimField(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some((item) => jsonRecordContainsClaimField(item));
  }

  return Object.entries(value).some(
    ([key, nestedValue]) =>
      reactTestRendererPlaceholderClaimFieldNames.includes(key) ||
      jsonRecordContainsClaimField(nestedValue)
  );
}

function isExactReactTestRendererPlaceholderRendererEntrypoint(
  workspaceRoot,
  spec
) {
  const relativePath =
    `${publicJsReactTestRendererExactPlaceholderPackageRoot}/` +
    spec.relativePath;
  const source = readWorkspaceFile(workspaceRoot, relativePath);
  if (source === "") {
    return false;
  }
  const sourceHeader = source.slice(0, 20000);
  const placeholderSurfaceIndex = findJsSourceOutsideCommentsAndStrings(
    source,
    "function definePlaceholderMetadata"
  );
  if (placeholderSurfaceIndex < 0) {
    return false;
  }
  const sourceFooter = source.slice(placeholderSurfaceIndex);

  return (
    readJsConstStringLiteral(sourceHeader, "compatibilityTarget") ===
      reactTestRendererCompatibilityTarget &&
    readJsConstStringLiteral(sourceHeader, "entrypoint") === spec.entrypoint &&
    readJsConstStringLiteral(sourceHeader, "placeholderVersion") ===
      reactTestRendererPlaceholderVersion &&
    jsPlaceholderMetadataFunctionPass(sourceFooter) &&
    jsExactSourceStatementPass(
      sourceFooter,
      "definePlaceholderMetadata(module.exports);"
    ) &&
    jsExactSourceStatementPass(
      sourceFooter,
      "exports.version = placeholderVersion;"
    ) &&
    jsExactCommonJsNamedExportsPass(
      source,
      reactTestRendererExpectedRendererExportNames
    ) &&
    jsRendererPublicBlockerSurfacePass(sourceFooter, spec) &&
    !jsContainsCommonJsAliasSmuggling(source)
  );
}

function isExactReactTestRendererPlaceholderShallowEntrypoint(workspaceRoot) {
  const source = readWorkspaceFile(
    workspaceRoot,
    `${publicJsReactTestRendererExactPlaceholderPackageRoot}/shallow.js`
  );
  if (source === "") {
    return false;
  }

  return (
    readJsConstStringLiteral(source, "compatibilityTarget") ===
      reactTestRendererCompatibilityTarget &&
    readJsConstStringLiteral(source, "entrypoint") ===
      "react-test-renderer/shallow" &&
    readJsConstStringLiteral(source, "shallowUnsupportedCode") ===
      "FAST_REACT_TEST_RENDERER_SHALLOW_UNSUPPORTED" &&
    jsDefinePropertiesDescriptorsPass({
      source,
      targetSource: "shallow",
      descriptors: reactTestRendererPlaceholderMetadataDescriptors()
    }) &&
    jsFunctionDeclarationSourceCallPrefixesPass({
      source,
      functionName: "shallow",
      calls: freezeArray([
        freezeRecord({
          callee: "createShallowUnsupportedError",
          arguments: freezeArray(["'was called'"])
        })
      ])
    }) &&
    jsExactCommonJsModuleExportPass(source, "shallow") &&
    !jsContainsCommonJsAliasSmuggling(source, {
      allowModuleExportsAssignment: "shallow"
    })
  );
}

function reactTestRendererPlaceholderMetadataDescriptors() {
  return freezeArray([
    freezeRecord({
      property: "__FAST_REACT_PLACEHOLDER__",
      assertions: freezeArray([
        jsBooleanPropertyAssertion("enumerable", false),
        jsBooleanPropertyAssertion("value", true)
      ])
    }),
    freezeRecord({
      property: "__FAST_REACT_ENTRYPOINT__",
      assertions: freezeArray([
        jsBooleanPropertyAssertion("enumerable", false),
        jsSourcePropertyAssertion("value", "entrypoint")
      ])
    }),
    freezeRecord({
      property: "compatibilityTarget",
      assertions: freezeArray([
        jsBooleanPropertyAssertion("enumerable", false),
        jsSourcePropertyAssertion("value", "compatibilityTarget")
      ])
    })
  ]);
}

function jsPlaceholderMetadataFunctionPass(source) {
  const declaration = extractJsFunctionDeclarationBody({
    source,
    functionName: "definePlaceholderMetadata",
    afterDeclaration: "function createPlaceholderRenderer"
  });
  if (declaration.ok !== true) {
    return false;
  }

  return jsDefinePropertiesDescriptorsPass({
    source: declaration.body,
    targetSource: "exportsObject",
    descriptors: reactTestRendererPlaceholderMetadataDescriptors()
  });
}

function jsRendererPublicBlockerSurfacePass(source, spec) {
  const rendererCallsPass = jsFunctionDeclarationSourceCallPrefixesPass({
    source,
    functionName: "createPlaceholderRenderer",
    calls: freezeArray([
      freezeRecord({
        callee: "createRendererUnsupportedFunction",
        arguments: freezeArray(["'create().toJSON'", "0"])
      }),
      freezeRecord({
        callee: "createRendererUnsupportedFunction",
        arguments: freezeArray(["'create().toTree'", "0"])
      }),
      freezeRecord({
        callee: "createRendererUnsupportedFunction",
        arguments: freezeArray(["'create().update'", "1"])
      }),
      freezeRecord({
        callee: "createRendererUnsupportedFunction",
        arguments: freezeArray(["'create().unmount'", "0"])
      }),
      freezeRecord({
        callee: "createRendererUnsupportedFunction",
        arguments: freezeArray(["'create().getInstance'", "0"])
      }),
      freezeRecord({
        callee: "createRendererUnsupportedFunction",
        arguments: freezeArray(["'create().unstable_flushSync'", "1"])
      }),
      freezeRecord({
        callee: "createUnsupportedError",
        arguments: freezeArray(["'create().root'", "'was accessed'"])
      })
    ])
  });

  if (rendererCallsPass !== true) {
    return false;
  }

  const unstableBatchedUpdatesBlocked =
    jsCallExpressionWithArgumentPrefixPass({
      source,
      callee: "createUnsupportedFunction",
      expectedArgumentsPrefix: freezeArray(["'unstable_batchedUpdates'", "2"])
    });

  if (
    !unstableBatchedUpdatesBlocked ||
    !jsExactSourceStatementPass(source, "exports._Scheduler = schedulerPlaceholder;") ||
    !jsExactSourceStatementPass(source, "exports.create = createExport;") ||
    !jsExactSourceStatementPass(source, "const createExport = defineFunctionShape(create, 'create', 2);")
  ) {
    return false;
  }

  if (spec.actExport === "undefined") {
    return jsExactSourceStatementPass(source, "exports.act = undefined;");
  }

  const actBlocked = jsCallExpressionWithArgumentPrefixPass({
    source,
    callee: "createUnsupportedFunction",
    expectedArgumentsPrefix: freezeArray(["'act'", "1"])
  });

  if (spec.actExport === "blocked-function") {
    return (
      actBlocked &&
      jsExactSourceStatementPass(source, "exports.act = createUnsupportedFunction(")
    );
  }

  return (
    actBlocked &&
    jsExactSourceStatementPass(source, "exports.act = isProduction")
  );
}

function jsDefinePropertiesDescriptorsPass({
  source,
  targetSource,
  descriptors
}) {
  let searchIndex = 0;

  while (searchIndex < source.length) {
    const calleeIndex = findJsSourceOutsideCommentsAndStrings(
      source,
      "Object.defineProperties",
      searchIndex
    );
    if (calleeIndex < 0) {
      return false;
    }

    const callOpenIndex = skipJsTrivia(
      source,
      calleeIndex + "Object.defineProperties".length,
      source.length
    );
    if (source[callOpenIndex] !== "(") {
      searchIndex = calleeIndex + "Object.defineProperties".length;
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

    const args = extractTopLevelJsCallArguments(
      source,
      callOpenIndex,
      callCloseIndex
    );
    if (args.length >= 2 && args[0] === targetSource) {
      const descriptorObject = extractJsObjectLiteralProperties(args[1]);
      if (
        descriptorObject.ok === true &&
        jsPropertyDescriptorAssertionsPass({
          properties: descriptorObject.properties,
          descriptors
        })
      ) {
        return true;
      }
    }

    searchIndex = callCloseIndex + 1;
  }

  return false;
}

function jsPropertyDescriptorAssertionsPass({ properties, descriptors }) {
  return descriptors.every((descriptor) => {
    const descriptorSource = properties.get(descriptor.property);
    const descriptorProperties = extractJsObjectLiteralProperties(
      descriptorSource
    );
    return (
      descriptorProperties.ok === true &&
      descriptor.assertions.every((assertion) =>
        jsObjectPropertyAssertionPass({
          properties: descriptorProperties.properties,
          assertion
        })
      )
    );
  });
}

function jsObjectPropertyAssertionPass({ properties, assertion }) {
  const actualSource = properties.get(assertion.property);
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
}

function extractJsObjectLiteralProperties(source) {
  if (typeof source !== "string") {
    return freezeRecord({
      ok: false,
      properties: new Map(),
      error: "object-source-not-string"
    });
  }

  const openIndex = skipJsTrivia(source, 0, source.length);
  if (source[openIndex] !== "{") {
    return freezeRecord({
      ok: false,
      properties: new Map(),
      error: "object-literal-not-found"
    });
  }

  const closeIndex = findMatchingJsBrace(source, openIndex);
  if (closeIndex < 0) {
    return freezeRecord({
      ok: false,
      properties: new Map(),
      error: "object-literal-not-closed"
    });
  }

  const endIndex = skipJsTrivia(source, closeIndex + 1, source.length);
  if (endIndex !== source.length) {
    return freezeRecord({
      ok: false,
      properties: new Map(),
      error: "object-literal-has-trailing-source"
    });
  }

  return extractTopLevelJsObjectProperties(source, openIndex, closeIndex);
}

function readJsConstStringLiteral(source, constName) {
  const declarationIndex = findJsSourceOutsideCommentsAndStrings(
    source,
    `const ${constName}`
  );
  if (declarationIndex < 0) {
    return null;
  }

  const afterNameIndex = declarationIndex + `const ${constName}`.length;
  if (/[A-Za-z0-9_$]/u.test(source[afterNameIndex] ?? "")) {
    return null;
  }

  const assignmentIndex = skipJsTrivia(
    source,
    afterNameIndex,
    source.length
  );
  if (source[assignmentIndex] !== "=") {
    return null;
  }

  const valueStart = skipJsTrivia(
    source,
    assignmentIndex + 1,
    source.length
  );
  const valueEnd = skipQuotedJsLiteral(source, valueStart);
  if (valueEnd === valueStart) {
    return null;
  }

  const statementEnd = skipJsTrivia(source, valueEnd, source.length);
  if (source[statementEnd] !== ";") {
    return null;
  }

  return parseJsStringLiteralSource(source.slice(valueStart, valueEnd));
}

function jsExactSourceStatementPass(source, statement) {
  return findJsSourceOutsideCommentsAndStrings(source, statement) >= 0;
}

function jsExactCommonJsNamedExportsPass(source, expectedNames) {
  const operations = readCommonJsExportOperations(source);
  const actualNames = operations.map((operation) => operation.property);
  return (
    operations.length === expectedNames.length &&
    operations.every(
      (operation) =>
        operation.kind === "property-assignment" &&
        operation.base === "exports" &&
        operation.access === "dot"
    ) &&
    expectedNames.every((expectedName) => actualNames.includes(expectedName))
  );
}

function jsExactCommonJsModuleExportPass(source, expectedValue) {
  const operations = readCommonJsExportOperations(source);
  return (
    operations.length === 1 &&
    operations[0].kind === "module-assignment" &&
    operations[0].base === "module.exports" &&
    operations[0].value === expectedValue
  );
}

function readCommonJsNamedExportAssignmentNames(source) {
  return freezeArray(
    readCommonJsExportOperations(source)
      .filter((operation) => operation.kind === "property-assignment")
      .map((operation) => operation.property)
  );
}

function readCommonJsExportOperations(source) {
  const aliases = new Set();
  const operations = [];
  collectCommonJsExportOperations({
    source,
    startIndex: 0,
    endIndex: source.length,
    aliases,
    operations
  });
  return freezeArray(operations.map((operation) => freezeRecord(operation)));
}

function collectCommonJsExportOperations({
  source,
  startIndex,
  endIndex,
  aliases,
  operations
}) {
  let index = startIndex;

  while (index < endIndex) {
    if (source.startsWith("//", index)) {
      const lineEnd = source.indexOf("\n", index + 2);
      index = lineEnd < 0 ? endIndex : Math.min(lineEnd + 1, endIndex);
      continue;
    }
    if (source.startsWith("/*", index)) {
      const blockEnd = source.indexOf("*/", index + 2);
      index = blockEnd < 0 ? endIndex : Math.min(blockEnd + 2, endIndex);
      continue;
    }

    const character = source[index];
    if (character === "'" || character === '"') {
      index = Math.min(skipQuotedJsLiteral(source, index), endIndex);
      continue;
    }
    if (character === "`") {
      index = collectCommonJsExportOperationsFromTemplate({
        source,
        templateStartIndex: index,
        endIndex,
        aliases,
        operations
      });
      continue;
    }
    if (character === "/" && isJsRegexLiteralStart(source, index)) {
      const regexEnd = skipJsRegexLiteral(source, index);
      if (regexEnd !== index) {
        index = Math.min(regexEnd, endIndex);
        continue;
      }
    }

    const aliasDeclaration = readCommonJsAliasDeclarationAt({
      source,
      index,
      endIndex
    });
    if (aliasDeclaration.ok === true) {
      aliases.add(aliasDeclaration.name);
      index = aliasDeclaration.end;
      continue;
    }

    const objectMutation = readCommonJsObjectMutationCallAt({
      source,
      index,
      endIndex,
      aliases
    });
    if (objectMutation.ok === true) {
      operations.push(objectMutation.operation);
      index = objectMutation.end;
      continue;
    }

    const assignment = readCommonJsExportAssignmentAt({
      source,
      index,
      endIndex,
      aliases
    });
    if (assignment.ok === true) {
      operations.push(assignment.operation);
      index = assignment.end;
      continue;
    }

    index += 1;
  }
}

function collectCommonJsExportOperationsFromTemplate({
  source,
  templateStartIndex,
  endIndex,
  aliases,
  operations
}) {
  let index = templateStartIndex + 1;

  while (index < endIndex) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }
    if (source[index] === "`") {
      return index + 1;
    }
    if (source.startsWith("${", index)) {
      const expressionOpenIndex = index + 1;
      const expressionCloseIndex = findMatchingJsBrace(
        source,
        expressionOpenIndex
      );
      if (expressionCloseIndex < 0 || expressionCloseIndex >= endIndex) {
        return endIndex;
      }
      collectCommonJsExportOperations({
        source,
        startIndex: expressionOpenIndex + 1,
        endIndex: expressionCloseIndex,
        aliases,
        operations
      });
      index = expressionCloseIndex + 1;
      continue;
    }

    index += 1;
  }

  return endIndex;
}

function readCommonJsAliasDeclarationAt({ source, index, endIndex }) {
  const declarationKeyword = ["const", "let", "var"].find((keyword) =>
    jsIdentifierAt(source, index, keyword)
  );
  if (declarationKeyword === undefined) {
    return freezeRecord({
      ok: false,
      name: "",
      end: index
    });
  }

  const nameStart = skipJsTrivia(
    source,
    index + declarationKeyword.length,
    endIndex
  );
  const name = readJsIdentifier(source, nameStart, endIndex);
  if (name.ok !== true) {
    return freezeRecord({
      ok: false,
      name: "",
      end: index
    });
  }

  const assignmentIndex = skipJsTrivia(source, name.end, endIndex);
  if (!isJsAssignmentOperatorAt(source, assignmentIndex)) {
    return freezeRecord({
      ok: false,
      name: "",
      end: index
    });
  }

  const target = readCommonJsExportTargetAt({
    source,
    index: assignmentIndex + 1,
    endIndex,
    aliases: new Set()
  });
  if (
    target.ok !== true ||
    (target.base !== "exports" && target.base !== "module.exports")
  ) {
    return freezeRecord({
      ok: false,
      name: "",
      end: index
    });
  }

  return freezeRecord({
    ok: true,
    name: name.name,
    end: target.end
  });
}

function readCommonJsObjectMutationCallAt({
  source,
  index,
  endIndex,
  aliases
}) {
  if (!jsIdentifierAt(source, index, "Object")) {
    return freezeRecord({
      ok: false,
      operation: null,
      end: index
    });
  }

  let cursor = skipJsTrivia(source, index + "Object".length, endIndex);
  if (source[cursor] !== ".") {
    return freezeRecord({
      ok: false,
      operation: null,
      end: index
    });
  }
  cursor = skipJsTrivia(source, cursor + 1, endIndex);
  const method = readJsIdentifier(source, cursor, endIndex);
  if (
    method.ok !== true ||
    !["assign", "defineProperties", "defineProperty"].includes(method.name)
  ) {
    return freezeRecord({
      ok: false,
      operation: null,
      end: index
    });
  }

  const callOpenIndex = skipJsTrivia(source, method.end, endIndex);
  if (source[callOpenIndex] !== "(") {
    return freezeRecord({
      ok: false,
      operation: null,
      end: index
    });
  }

  const callCloseIndex = findMatchingJsEnclosure(
    source,
    callOpenIndex,
    "(",
    ")"
  );
  if (callCloseIndex < 0 || callCloseIndex > endIndex) {
    return freezeRecord({
      ok: false,
      operation: null,
      end: index
    });
  }

  const args = extractTopLevelJsCallArguments(
    source,
    callOpenIndex,
    callCloseIndex
  );
  if (
    args.length === 0 ||
    !isCommonJsExportTargetSource(args[0], aliases)
  ) {
    return freezeRecord({
      ok: false,
      operation: null,
      end: index
    });
  }

  return freezeRecord({
    ok: true,
    operation: {
      kind: "object-mutation",
      base: readCommonJsExportTargetSourceBase(args[0], aliases),
      method: method.name,
      property:
        method.name === "defineProperty" && args.length > 1
          ? parseJsStringLiteralSource(args[1]) ?? "<computed>"
          : "<computed>",
      access: method.name,
      value: "",
      end: callCloseIndex + 1
    },
    end: callCloseIndex + 1
  });
}

function readCommonJsExportAssignmentAt({
  source,
  index,
  endIndex,
  aliases
}) {
  const target = readCommonJsExportTargetAt({
    source,
    index,
    endIndex,
    aliases
  });
  if (target.ok !== true) {
    return freezeRecord({
      ok: false,
      operation: null,
      end: index
    });
  }

  let cursor = skipJsTrivia(source, target.end, endIndex);
  const moduleAssignmentOperator = readJsAssignmentOperatorAt(source, cursor);
  if (
    target.base === "module.exports" &&
    moduleAssignmentOperator.ok === true
  ) {
    const valueStart = skipJsTrivia(
      source,
      moduleAssignmentOperator.end,
      endIndex
    );
    const valueEnd = findJsStatementEnd(source, valueStart);
    return freezeRecord({
      ok: true,
      operation: {
        kind: "module-assignment",
        base: target.base,
        property: "module.exports",
        access: "assignment",
        value:
          valueEnd < 0
            ? source.slice(valueStart, endIndex).trim()
            : source.slice(valueStart, valueEnd).trim(),
        end: valueEnd < 0 ? endIndex : valueEnd + 1
      },
      end: valueStart
    });
  }

  const member = readJsMemberPropertyAt({
    source,
    index: cursor,
    endIndex
  });
  if (member.ok !== true) {
    return freezeRecord({
      ok: false,
      operation: null,
      end: index
    });
  }

  cursor = skipJsTrivia(source, member.end, endIndex);
  const assignmentOperator = readJsAssignmentOperatorAt(source, cursor);
  if (assignmentOperator.ok !== true) {
    return freezeRecord({
      ok: false,
      operation: null,
      end: index
    });
  }

  const valueStart = skipJsTrivia(source, assignmentOperator.end, endIndex);
  const valueEnd = findJsStatementEnd(source, valueStart);
  return freezeRecord({
    ok: true,
    operation: {
      kind: "property-assignment",
      base: target.base,
      aliasName: target.aliasName,
      property: member.property,
      access: member.access,
      value:
        valueEnd < 0
          ? source.slice(valueStart, endIndex).trim()
          : source.slice(valueStart, valueEnd).trim(),
      end: valueEnd < 0 ? endIndex : valueEnd + 1
    },
    end: valueStart
  });
}

function readCommonJsExportTargetAt({ source, index, endIndex, aliases }) {
  const targetStart = skipJsTrivia(source, index, endIndex);
  if (jsIdentifierAt(source, targetStart, "exports")) {
    return freezeRecord({
      ok: true,
      base: "exports",
      aliasName: null,
      end: targetStart + "exports".length
    });
  }

  if (jsIdentifierAt(source, targetStart, "module")) {
    let cursor = skipJsTrivia(source, targetStart + "module".length, endIndex);
    if (source[cursor] === ".") {
      cursor = skipJsTrivia(source, cursor + 1, endIndex);
      if (jsIdentifierAt(source, cursor, "exports")) {
        return freezeRecord({
          ok: true,
          base: "module.exports",
          aliasName: null,
          end: cursor + "exports".length
        });
      }
    }
  }

  const alias = readJsIdentifier(source, targetStart, endIndex);
  if (alias.ok === true && aliases.has(alias.name)) {
    return freezeRecord({
      ok: true,
      base: "alias",
      aliasName: alias.name,
      end: alias.end
    });
  }

  return freezeRecord({
    ok: false,
    base: "",
    aliasName: null,
    end: index
  });
}

function isCommonJsExportTargetSource(source, aliases) {
  const target = readCommonJsExportTargetAt({
    source,
    index: 0,
    endIndex: source.length,
    aliases
  });
  return (
    target.ok === true &&
    skipJsTrivia(source, target.end, source.length) === source.length
  );
}

function readCommonJsExportTargetSourceBase(source, aliases) {
  const target = readCommonJsExportTargetAt({
    source,
    index: 0,
    endIndex: source.length,
    aliases
  });
  return target.ok === true ? target.base : "";
}

function readJsMemberPropertyAt({ source, index, endIndex }) {
  let cursor = skipJsTrivia(source, index, endIndex);
  if (source[cursor] === ".") {
    cursor = skipJsTrivia(source, cursor + 1, endIndex);
    const property = readJsIdentifier(source, cursor, endIndex);
    if (property.ok === true) {
      return freezeRecord({
        ok: true,
        property: property.name,
        access: "dot",
        end: property.end
      });
    }
  }

  if (source[cursor] === "[") {
    const closeIndex = findMatchingJsEnclosure(source, cursor, "[", "]");
    if (closeIndex < 0 || closeIndex > endIndex) {
      return freezeRecord({
        ok: false,
        property: "",
        access: "",
        end: index
      });
    }
    const propertySource = source
      .slice(cursor + 1, closeIndex)
      .trim();
    return freezeRecord({
      ok: true,
      property: parseJsStringLiteralSource(propertySource) ?? "<computed>",
      access: "bracket",
      end: closeIndex + 1
    });
  }

  return freezeRecord({
    ok: false,
    property: "",
    access: "",
    end: index
  });
}

function isJsAssignmentOperatorAt(source, index) {
  return (
    source[index] === "=" &&
    source[index + 1] !== "=" &&
    source[index + 1] !== ">" &&
    source[index - 1] !== "=" &&
    source[index - 1] !== "!" &&
    source[index - 1] !== "<" &&
    source[index - 1] !== ">"
  );
}

function readJsAssignmentOperatorAt(source, index) {
  if (isJsAssignmentOperatorAt(source, index)) {
    return freezeRecord({
      ok: true,
      end: index + 1
    });
  }

  for (const operator of [
    ">>>=",
    "&&=",
    "||=",
    "??=",
    "**=",
    "<<=",
    ">>=",
    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "&=",
    "|=",
    "^="
  ]) {
    if (source.startsWith(operator, index)) {
      return freezeRecord({
        ok: true,
        end: index + operator.length
      });
    }
  }

  return freezeRecord({
    ok: false,
    end: index
  });
}

function readJsIdentifier(source, startIndex, endIndex) {
  if (!/[A-Za-z_$]/u.test(source[startIndex] ?? "")) {
    return freezeRecord({
      ok: false,
      name: "",
      end: startIndex
    });
  }

  let index = startIndex + 1;
  while (index < endIndex && /[A-Za-z0-9_$]/u.test(source[index])) {
    index += 1;
  }

  return freezeRecord({
    ok: true,
    name: source.slice(startIndex, index),
    end: index
  });
}

function jsFunctionDeclarationSourceCallPrefixesPass({
  source,
  functionName,
  calls
}) {
  const declaration = extractJsFunctionDeclarationBody({
    source,
    functionName
  });
  if (declaration.ok !== true) {
    return false;
  }

  return calls.every((call) =>
    jsCallExpressionWithArgumentPrefixPass({
      source: declaration.body,
      callee: call.callee,
      expectedArgumentsPrefix: call.arguments
    })
  );
}

function jsCallExpressionWithArgumentPrefixPass({
  source,
  callee,
  expectedArgumentsPrefix
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
      actualArguments.length >= expectedArgumentsPrefix.length &&
      expectedArgumentsPrefix.every(
        (expectedArgument, index) =>
          actualArguments[index] === expectedArgument
      )
    ) {
      return true;
    }

    searchIndex = callCloseIndex + 1;
  }

  return false;
}

function jsContainsCommonJsAliasSmuggling(
  source,
  { allowModuleExportsAssignment = null } = {}
) {
  return readCommonJsExportOperations(source).some((operation) => {
    if (
      operation.kind === "property-assignment" &&
      operation.base === "exports" &&
      operation.access === "dot" &&
      reactTestRendererExpectedRendererExportNames.includes(operation.property)
    ) {
      return false;
    }
    if (
      operation.kind === "module-assignment" &&
      operation.base === "module.exports" &&
      operation.value === allowModuleExportsAssignment
    ) {
      return false;
    }
    return true;
  });
}

function findJsStatementEnd(source, startIndex) {
  let index = startIndex;

  while (index < source.length) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    if (source[index] === ";") {
      return index;
    }

    index += 1;
  }

  return -1;
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

function jsQuotedStringPropertyAssertion(property, value) {
  return freezeRecord({
    kind: "js-quoted-string-property",
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

function jsQuotedStringArrayPropertyIncludesAssertion(property, values) {
  return freezeRecord({
    kind: "js-quoted-string-array-property-includes",
    property,
    values: freezeArray(values)
  });
}

function cjsTestInstanceQueryBridgePreflightSourceEvidencePresent(source) {
  if (cjsTestInstanceQueryBridgePreflightSourceEvidenceCache.has(source)) {
    return cjsTestInstanceQueryBridgePreflightSourceEvidenceCache.get(source);
  }

  const present =
    cjsTestInstanceQueryBridgePreflightSourceEvidencePresentUncached(source);
  cjsTestInstanceQueryBridgePreflightSourceEvidenceCache.set(source, present);
  return present;
}

function cjsTestInstanceQueryBridgePreflightSourceEvidencePresentUncached(
  source
) {
  return (
    jsFunctionDeclarationReturnedFreezeRecordMethodReturnedCallsPass({
      source,
      functionName: "createTestRendererRootRequestBridge",
      methodCalls: freezeArray([
        freezeRecord({
          methodName: "getTestInstanceQueryBridgePreflight",
          callee: "getTestInstanceQueryBridgePreflightForRootRequest",
          arguments: freezeArray(["record"])
        }),
        freezeRecord({
          methodName: "getRootTestInstanceQueryBridgePreflight",
          callee: "getTestInstanceQueryBridgePreflightForRootRequest",
          arguments: freezeArray(["request"])
        }),
        freezeRecord({
          methodName: "getRendererTestInstanceQueryBridgePreflight",
          callee: "getTestInstanceQueryBridgePreflightForRootRequest",
          arguments: freezeArray(["request"])
        })
      ])
    }) &&
    jsFunctionDeclarationReturnedFreezeRecordMethodSourceCallsPass({
      source,
      functionName: "createTestRendererRootRequestBridge",
      methodCalls: freezeArray([
        freezeRecord({
          methodName: "canConsumeAcceptedRustTestInstanceQueryDiagnostics",
          callee: "consumeAcceptedRustTestInstanceQueryDiagnosticsForRequest",
          arguments: freezeArray(["record", "diagnostics"])
        }),
        freezeRecord({
          methodName: "consumeAcceptedRustTestInstanceQueryDiagnostics",
          callee: "consumeAcceptedRustTestInstanceQueryDiagnosticsForRequest",
          arguments: freezeArray(["record", "diagnostics"])
        })
      ])
    }) &&
    jsFunctionDeclarationSourceCallsPass({
      source,
      functionName: "getTestInstanceQueryDiagnosticsForRootRequest",
      calls: freezeArray([
        freezeRecord({
          callee: "createPrivateTestInstanceWrapperRecordForRootRequest",
          arguments: freezeArray(["record", "lifecycleEvidence"])
        })
      ])
    }) &&
    jsFunctionDeclarationConstInitializerCallPass({
      source,
      functionName: "createPrivateTestInstanceWrapperRecordForRootRequest",
      name: "queryBridgePreflight",
      callee: "createPrivateTestInstanceQueryBridgePreflightRecord",
      arguments: freezeArray([
        "rootRequest",
        "undefined",
        "acceptedLifecycleEvidence"
      ])
    }) &&
    jsFunctionDeclarationReturnedFreezeRecordAssertionsPass({
      source,
      functionName: "createPrivateTestInstanceWrapperRecordForRootRequest",
      assertions:
        privateTestInstanceWrapperQueryBridgePreflightSourceAssertions
    }) &&
    jsConstQuotedStringDeclarationPass({
      source,
      name: "privateTestInstanceQueryBridgePreflightDiagnosticName",
      value: "fast-react-test-renderer.testinstance.query-bridge-preflight"
    }) &&
    jsConstQuotedStringDeclarationPass({
      source,
      name: "privateTestInstanceQueryBridgePreflightStatus",
      value:
        "private-test-instance-query-bridge-preflight-ready-public-test-instance-blocked"
    }) &&
    jsObjectSourceAssertionsPass({
      source,
      declaration:
        "const privateTestInstanceQueryBridgePreflightGate = Object.freeze",
      assertions: privateTestInstanceQueryBridgePreflightGateSourceAssertions
    }) &&
    jsFunctionDeclarationConstInitializerBeforeTopLevelReturnExpressionPass({
      source,
      functionName: "getTestInstanceQueryBridgePreflightForRootRequest",
      name: "diagnostics",
      callee: "getTestInstanceQueryDiagnosticsForRootRequest",
      arguments: freezeArray(["record"]),
      expression: "diagnostics.queryBridgePreflight ?? diagnostics"
    }) &&
    jsFunctionDeclarationSourceCallsPass({
      source,
      functionName: "consumeAcceptedRustTestInstanceQueryDiagnosticsForRequest",
      calls: freezeArray([
        freezeRecord({
          callee: "assertAcceptedTestInstanceLifecycleEvidenceForRootRequest",
          arguments: freezeArray(["record"])
        }),
        freezeRecord({
          callee: "createPrivateTestInstanceQueryBridgePreflightRecord",
          arguments: freezeArray(["record", "diagnostics", "lifecycleEvidence"])
        })
      ])
    }) &&
    jsFunctionDeclarationReturnedFreezeRecordAssertionsPass({
      source,
      functionName: "createPrivateTestInstanceQueryBridgePreflightRecord",
      assertions: privateTestInstanceQueryBridgePreflightRecordSourceAssertions
    })
  );
}

function jsObjectSourceAssertionsPass({ source, declaration, assertions }) {
  const extracted = extractJsObjectFreezePropertiesForDeclaration({
    source,
    declaration
  });
  if (extracted.ok !== true) {
    return false;
  }

  if (
    jsObjectSpreadsCanOverrideAssertedProperties({
      extracted,
      assertions
    })
  ) {
    return false;
  }

  return jsObjectPropertyAssertionsPass(extracted.properties, assertions);
}

function jsObjectSpreadsCanOverrideAssertedProperties({
  extracted,
  assertions
}) {
  if (
    extracted.spreadStartIndexes.length === 0 &&
    extracted.unsupportedKeyStartIndexes.length === 0
  ) {
    return false;
  }

  return assertions.some((assertion) => {
    const propertyStartIndex = extracted.propertyStartIndexes.get(
      assertion.property
    );
    if (propertyStartIndex === undefined) {
      return false;
    }

    return (
      extracted.spreadStartIndexes.some(
        (spreadStartIndex) => spreadStartIndex > propertyStartIndex
      ) ||
      extracted.unsupportedKeyStartIndexes.some(
        (unsupportedKeyStartIndex) =>
          unsupportedKeyStartIndex > propertyStartIndex
      )
    );
  });
}

function jsObjectPropertyCanBeOverriddenAfterStartIndex({
  extracted,
  property,
  propertyStartIndex
}) {
  const occurrenceStartIndexes =
    extracted.propertyOccurrenceStartIndexes.get(property) ?? freezeArray([]);
  return (
    occurrenceStartIndexes.some(
      (occurrenceStartIndex) => occurrenceStartIndex > propertyStartIndex
    ) ||
    extracted.spreadStartIndexes.some(
      (spreadStartIndex) => spreadStartIndex > propertyStartIndex
    ) ||
    extracted.unsupportedKeyStartIndexes.some(
      (unsupportedKeyStartIndex) =>
        unsupportedKeyStartIndex > propertyStartIndex
    )
  );
}

function jsObjectPropertyAssertionsPass(properties, assertions) {
  return assertions.every((assertion) => {
    const actualSource = properties.get(assertion.property);
    if (assertion.kind === "js-boolean-property") {
      return actualSource === String(assertion.value);
    }
    if (assertion.kind === "js-string-property") {
      return parseJsStringLiteralSource(actualSource) === assertion.value;
    }
    if (assertion.kind === "js-quoted-string-property") {
      return parseJsQuotedStringLiteralSource(actualSource) === assertion.value;
    }
    if (assertion.kind === "js-source-property") {
      return actualSource === assertion.value;
    }
    if (assertion.kind === "js-quoted-string-array-property-includes") {
      const actualValues = parseJsQuotedStringArrayExpressionSource(actualSource);
      return (
        actualValues !== null &&
        assertion.values.every((value) => actualValues.includes(value))
      );
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
      if (source[index] === "u") {
        const escaped = readJsUnicodeEscapeSequence(source, index);
        if (escaped === null || escaped.end >= source.length) {
          return null;
        }
        value += escaped.value;
        index = escaped.end - 1;
        continue;
      }
      if (source[index] === "x") {
        const escaped = readJsHexEscapeSequence(source, index);
        if (escaped === null || escaped.end >= source.length) {
          return null;
        }
        value += escaped.value;
        index = escaped.end - 1;
        continue;
      }
      if (source[index] === "\r" || source[index] === "\n") {
        if (source[index] === "\r" && source[index + 1] === "\n") {
          index += 1;
        }
        continue;
      }
      if (source[index] === "b") {
        value += "\b";
        continue;
      }
      if (source[index] === "f") {
        value += "\f";
        continue;
      }
      if (source[index] === "n") {
        value += "\n";
        continue;
      }
      if (source[index] === "r") {
        value += "\r";
        continue;
      }
      if (source[index] === "t") {
        value += "\t";
        continue;
      }
      if (source[index] === "v") {
        value += "\x0b";
        continue;
      }
      if (
        source[index] === "0" &&
        !/[0-9]/u.test(source[index + 1] ?? "")
      ) {
        value += "\0";
        continue;
      }
    }
    value += source[index];
  }
  return value;
}

function readJsUnicodeEscapeSequence(source, index) {
  if (source[index] !== "u") {
    return null;
  }

  if (source[index + 1] === "{") {
    const closeIndex = source.indexOf("}", index + 2);
    if (closeIndex < 0) {
      return null;
    }
    const hexSource = source.slice(index + 2, closeIndex);
    if (!/^[0-9A-Fa-f]{1,6}$/u.test(hexSource)) {
      return null;
    }
    const codePoint = Number.parseInt(hexSource, 16);
    if (!Number.isSafeInteger(codePoint) || codePoint > 0x10ffff) {
      return null;
    }
    return freezeRecord({
      value: String.fromCodePoint(codePoint),
      end: closeIndex + 1
    });
  }

  const hexSource = source.slice(index + 1, index + 5);
  if (!/^[0-9A-Fa-f]{4}$/u.test(hexSource)) {
    return null;
  }
  return freezeRecord({
    value: String.fromCharCode(Number.parseInt(hexSource, 16)),
    end: index + 5
  });
}

function readJsHexEscapeSequence(source, index) {
  if (source[index] !== "x") {
    return null;
  }

  const hexSource = source.slice(index + 1, index + 3);
  if (!/^[0-9A-Fa-f]{2}$/u.test(hexSource)) {
    return null;
  }
  return freezeRecord({
    value: String.fromCharCode(Number.parseInt(hexSource, 16)),
    end: index + 3
  });
}

function parseJsQuotedStringLiteralSource(source) {
  if (typeof source !== "string" || source[0] === "`") {
    return null;
  }
  return parseJsStringLiteralSource(source);
}

function parseJsQuotedStringArrayExpressionSource(source) {
  if (typeof source !== "string") {
    return null;
  }

  const calleeIndex = skipJsTrivia(source, 0, source.length);
  if (!source.startsWith("Object.freeze", calleeIndex)) {
    return null;
  }
  const callOpenIndex = skipJsTrivia(
    source,
    calleeIndex + "Object.freeze".length,
    source.length
  );
  if (source[callOpenIndex] !== "(") {
    return null;
  }
  const callCloseIndex = findMatchingJsEnclosure(
    source,
    callOpenIndex,
    "(",
    ")"
  );
  if (callCloseIndex < 0) {
    return null;
  }
  const openIndex = skipJsTrivia(source, callOpenIndex + 1, callCloseIndex);
  if (source[openIndex] !== "[") {
    return null;
  }
  const closeIndex = findMatchingJsEnclosure(source, openIndex, "[", "]");
  if (closeIndex < 0 || closeIndex > callCloseIndex) {
    return null;
  }

  const elements = extractTopLevelJsCallArguments(source, openIndex, closeIndex);
  const values = [];
  for (const element of elements) {
    const value = parseJsQuotedStringLiteralSource(element);
    if (value === null) {
      return null;
    }
    values.push(value);
  }
  return freezeArray(values);
}

function jsConstQuotedStringDeclarationPass({ source, name, value }) {
  const declaration = extractJsConstDeclarationInitializerSource({
    source,
    name
  });
  return (
    declaration.ok === true &&
    parseJsQuotedStringLiteralSource(declaration.initializer) === value
  );
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

function jsFunctionDeclarationConstInitializerCallPass({
  source,
  functionName,
  name,
  callee,
  arguments: expectedArguments
}) {
  const declaration = extractJsFunctionDeclarationBody({
    source,
    functionName
  });
  if (declaration.ok !== true) {
    return false;
  }

  const initializer = extractTopLevelJsConstDeclarationInitializerSource({
    source: declaration.body,
    name
  });
  return (
    initializer.ok === true &&
    jsExactCallExpressionWithArgumentsPass({
      source: initializer.initializer,
      callee,
      expectedArguments
    })
  );
}

function jsFunctionDeclarationTopLevelReturnExpressionPass({
  source,
  functionName,
  expression
}) {
  const declaration = extractJsFunctionDeclarationBody({
    source,
    functionName
  });
  if (declaration.ok !== true) {
    return false;
  }

  return jsTopLevelReturnExpressionPass(declaration.body, expression);
}

function jsFunctionDeclarationConstInitializerBeforeTopLevelReturnExpressionPass({
  source,
  functionName,
  name,
  callee,
  arguments: expectedArguments,
  expression
}) {
  const declaration = extractJsFunctionDeclarationBody({
    source,
    functionName
  });
  if (declaration.ok !== true) {
    return false;
  }

  const returnExpressions = readTopLevelJsReturnExpressions(declaration.body);
  if (
    returnExpressions === null ||
    returnExpressions.length !== 1 ||
    normalizeJsExpressionSource(returnExpressions[0].expression) !==
      normalizeJsExpressionSource(expression)
  ) {
    return false;
  }

  const initializer = extractTopLevelJsConstDeclarationInitializerSource({
    source: declaration.body,
    name,
    beforeIndex: returnExpressions[0].returnIndex
  });
  return (
    initializer.ok === true &&
    jsExactCallExpressionWithArgumentsPass({
      source: initializer.initializer,
      callee,
      expectedArguments
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
  const extracted = extractTopLevelJsObjectProperties(
    declaration.body,
    returnedObject.openIndex,
    returnedObject.closeIndex
  );
  if (extracted.ok !== true) {
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
    if (
      jsObjectPropertyCanBeOverriddenAfterStartIndex({
        extracted,
        property: methodCall.methodName,
        propertyStartIndex: method.propertyStartIndex
      })
    ) {
      return false;
    }

    return jsCallExpressionWithArgumentsPass({
      source: method.body,
      callee: methodCall.callee,
      expectedArguments: methodCall.arguments
    });
  });
}

function jsFunctionDeclarationReturnedFreezeRecordMethodReturnedCallsPass({
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
  const extracted = extractTopLevelJsObjectProperties(
    declaration.body,
    returnedObject.openIndex,
    returnedObject.closeIndex
  );
  if (extracted.ok !== true) {
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
    if (
      jsObjectPropertyCanBeOverriddenAfterStartIndex({
        extracted,
        property: methodCall.methodName,
        propertyStartIndex: method.propertyStartIndex
      })
    ) {
      return false;
    }

    return jsTopLevelReturnCallExpressionWithArgumentsPass({
      source: method.body,
      params: method.params,
      callee: methodCall.callee,
      expectedArguments: methodCall.arguments
    });
  });
}

function jsFunctionDeclarationReturnedFreezeRecordAssertionsPass({
  source,
  functionName,
  assertions
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

  const extracted = extractTopLevelJsObjectProperties(
    declaration.body,
    returnedObject.openIndex,
    returnedObject.closeIndex
  );
  if (extracted.ok !== true) {
    return false;
  }

  if (
    jsObjectSpreadsCanOverrideAssertedProperties({
      extracted,
      assertions
    })
  ) {
    return false;
  }

  return jsObjectPropertyAssertionsPass(extracted.properties, assertions);
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

    if (jsIdentifierAt(source, index, "return")) {
      if (braceDepth !== 0 || bracketDepth !== 0 || parenDepth !== 0) {
        return freezeRecord({
          ok: false,
          openIndex: -1,
          closeIndex: -1,
          error: "nested-return-before-top-level-freeze-record"
        });
      }
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
        return freezeRecord({
          ok: false,
          openIndex: -1,
          closeIndex: -1,
          error: "first-top-level-return-not-freeze-record"
        });
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
  const declarationNeedle = `function ${functionName}`;
  let declarationIndex = -1;
  let searchIndex = 0;

  while (searchIndex < source.length) {
    declarationIndex = findJsSourceOutsideCommentsAndStrings(
      source,
      declarationNeedle,
      searchIndex
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

    const afterCandidateNameIndex =
      declarationIndex + declarationNeedle.length;
    if (!/[A-Za-z0-9_$]/u.test(source[afterCandidateNameIndex] ?? "")) {
      break;
    }

    searchIndex = afterCandidateNameIndex;
  }

  const afterNameIndex = declarationIndex + declarationNeedle.length;
  const paramsOpenIndex = skipJsTrivia(source, afterNameIndex, source.length);
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
    params: freezeArray(
      extractTopLevelJsCallArguments(source, paramsOpenIndex, paramsCloseIndex)
    ),
    bodyOpenIndex,
    bodyCloseIndex,
    error: null
  });
}

function extractJsConstDeclarationInitializerSource({ source, name }) {
  let searchIndex = 0;
  const declarationPrefix = "const ";

  while (searchIndex < source.length) {
    const declarationIndex = findJsSourceOutsideCommentsAndStrings(
      source,
      declarationPrefix,
      searchIndex
    );
    if (declarationIndex < 0) {
      return freezeRecord({
        ok: false,
        initializer: "",
        error: "const-declaration-not-found"
      });
    }

    const nameIndex = skipJsTrivia(
      source,
      declarationIndex + declarationPrefix.length,
      source.length
    );
    if (!jsIdentifierAt(source, nameIndex, name)) {
      searchIndex = declarationIndex + declarationPrefix.length;
      continue;
    }

    const afterNameIndex = nameIndex + name.length;
    const equalsIndex = skipJsTrivia(source, afterNameIndex, source.length);
    if (source[equalsIndex] !== "=") {
      searchIndex = afterNameIndex;
      continue;
    }

    const initializerStart = skipJsTrivia(
      source,
      equalsIndex + 1,
      source.length
    );
    const statementEnd = findJsStatementEnd(source, initializerStart);
    if (statementEnd < 0) {
      return freezeRecord({
        ok: false,
        initializer: "",
        error: "const-declaration-not-terminated"
      });
    }

    return freezeRecord({
      ok: true,
      initializer: source.slice(initializerStart, statementEnd).trim(),
      error: null
    });
  }

  return freezeRecord({
    ok: false,
    initializer: "",
    error: "const-declaration-not-found"
  });
}

function extractTopLevelJsConstDeclarationInitializerSource({
  source,
  name,
  beforeIndex = source.length
}) {
  let index = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  const declarationPrefix = "const ";

  while (index < source.length && index < beforeIndex) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    if (
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenDepth === 0 &&
      index < beforeIndex &&
      source.startsWith(declarationPrefix, index)
    ) {
      const nameIndex = skipJsTrivia(
        source,
        index + declarationPrefix.length,
        source.length
      );
      if (!jsIdentifierAt(source, nameIndex, name)) {
        index += declarationPrefix.length;
        continue;
      }

      const afterNameIndex = nameIndex + name.length;
      const equalsIndex = skipJsTrivia(
        source,
        afterNameIndex,
        source.length
      );
      if (source[equalsIndex] !== "=") {
        index = afterNameIndex;
        continue;
      }

      const initializerStart = skipJsTrivia(
        source,
        equalsIndex + 1,
        source.length
      );
      const statementEnd = findJsStatementEnd(source, initializerStart);
      if (statementEnd < 0 || statementEnd >= beforeIndex) {
        return freezeRecord({
          ok: false,
          initializer: "",
          declarationIndex: -1,
          statementEnd: -1,
          error: "const-declaration-not-terminated"
        });
      }

      return freezeRecord({
        ok: true,
        initializer: source.slice(initializerStart, statementEnd).trim(),
        declarationIndex: index,
        statementEnd,
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
    initializer: "",
    declarationIndex: -1,
    statementEnd: -1,
    error: "top-level-const-declaration-not-found"
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
  const propertyStartIndexes = new Map();
  const propertyOccurrenceStartIndexes = new Map();
  const spreadStartIndexes = [];
  const unsupportedKeyStartIndexes = [];
  let index = openIndex + 1;

  while (index < closeIndex) {
    index = skipJsTrivia(source, index, closeIndex);
    while (source[index] === "," && index < closeIndex) {
      index = skipJsTrivia(source, index + 1, closeIndex);
    }
    if (index >= closeIndex) {
      break;
    }

    if (source.startsWith("...", index)) {
      spreadStartIndexes.push(index);
      const nextIndex = findNextTopLevelPropertySeparator(
        source,
        index + "...".length,
        closeIndex
      );
      index = nextIndex < closeIndex ? nextIndex + 1 : closeIndex;
      continue;
    }

    const propertyStartIndex = index;
    const propertyKey = readJsObjectPropertyKey(source, index, closeIndex);
    if (propertyKey.ok !== true) {
      unsupportedKeyStartIndexes.push(index);
      const nextIndex = findNextTopLevelPropertySeparator(
        source,
        index,
        closeIndex
      );
      index = nextIndex < closeIndex ? nextIndex + 1 : closeIndex;
      continue;
    }

    index = skipJsTrivia(source, propertyKey.end, closeIndex);
    if (source[index] === "(") {
      const paramsCloseIndex = findMatchingJsEnclosure(
        source,
        index,
        "(",
        ")"
      );
      if (paramsCloseIndex < 0 || paramsCloseIndex > closeIndex) {
        unsupportedKeyStartIndexes.push(propertyStartIndex);
        return freezeRecord({
          ok: true,
          properties,
          propertyStartIndexes,
          propertyOccurrenceStartIndexes:
            freezeJsObjectPropertyOccurrenceStartIndexes(
              propertyOccurrenceStartIndexes
            ),
          spreadStartIndexes: freezeArray(spreadStartIndexes),
          unsupportedKeyStartIndexes: freezeArray(unsupportedKeyStartIndexes),
          error: null
        });
      }

      const bodyOpenIndex = skipJsTrivia(
        source,
        paramsCloseIndex + 1,
        closeIndex
      );
      if (source[bodyOpenIndex] !== "{") {
        unsupportedKeyStartIndexes.push(propertyStartIndex);
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
        unsupportedKeyStartIndexes.push(propertyStartIndex);
        return freezeRecord({
          ok: true,
          properties,
          propertyStartIndexes,
          propertyOccurrenceStartIndexes:
            freezeJsObjectPropertyOccurrenceStartIndexes(
              propertyOccurrenceStartIndexes
            ),
          spreadStartIndexes: freezeArray(spreadStartIndexes),
          unsupportedKeyStartIndexes: freezeArray(unsupportedKeyStartIndexes),
          error: null
        });
      }

      properties.set(
        propertyKey.key,
        source.slice(propertyStartIndex, bodyCloseIndex + 1).trim()
      );
      propertyStartIndexes.set(propertyKey.key, propertyStartIndex);
      recordJsObjectPropertyOccurrenceStartIndex(
        propertyOccurrenceStartIndexes,
        propertyKey.key,
        propertyStartIndex
      );
      index = bodyCloseIndex + 1;
      continue;
    }

    if (source[index] !== ":") {
      const nextIndex = findNextTopLevelPropertySeparator(
        source,
        index,
        closeIndex
      );
      if (source.slice(index, nextIndex).trim() === "") {
        properties.set(propertyKey.key, propertyKey.key);
        propertyStartIndexes.set(propertyKey.key, propertyStartIndex);
        recordJsObjectPropertyOccurrenceStartIndex(
          propertyOccurrenceStartIndexes,
          propertyKey.key,
          propertyStartIndex
        );
      } else {
        unsupportedKeyStartIndexes.push(propertyStartIndex);
      }
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
    propertyStartIndexes.set(propertyKey.key, propertyStartIndex);
    recordJsObjectPropertyOccurrenceStartIndex(
      propertyOccurrenceStartIndexes,
      propertyKey.key,
      propertyStartIndex
    );
    index = valueEnd < closeIndex ? valueEnd + 1 : closeIndex;
  }

  return freezeRecord({
    ok: true,
    properties,
    propertyStartIndexes,
    propertyOccurrenceStartIndexes:
      freezeJsObjectPropertyOccurrenceStartIndexes(
        propertyOccurrenceStartIndexes
      ),
    spreadStartIndexes: freezeArray(spreadStartIndexes),
    unsupportedKeyStartIndexes: freezeArray(unsupportedKeyStartIndexes),
    error: null
  });
}

function recordJsObjectPropertyOccurrenceStartIndex(
  propertyOccurrenceStartIndexes,
  property,
  propertyStartIndex
) {
  const startIndexes = propertyOccurrenceStartIndexes.get(property) ?? [];
  startIndexes.push(propertyStartIndex);
  propertyOccurrenceStartIndexes.set(property, startIndexes);
}

function freezeJsObjectPropertyOccurrenceStartIndexes(
  propertyOccurrenceStartIndexes
) {
  const frozen = new Map();
  for (const [property, startIndexes] of propertyOccurrenceStartIndexes) {
    frozen.set(property, freezeArray(startIndexes));
  }
  return frozen;
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
  let matchedMethod = null;

  while (index < closeIndex) {
    index = skipJsTrivia(source, index, closeIndex);
    while (source[index] === "," && index < closeIndex) {
      index = skipJsTrivia(source, index + 1, closeIndex);
    }
    if (index >= closeIndex) {
      break;
    }

    if (source.startsWith("...", index)) {
      if (matchedMethod !== null) {
        return freezeRecord({
          ok: false,
          body: "",
          bodyOpenIndex: -1,
          bodyCloseIndex: -1,
          error: "object-method-overridden-by-spread"
        });
      }

      const nextIndex = findNextTopLevelPropertySeparator(
        source,
        index + "...".length,
        closeIndex
      );
      index = nextIndex < closeIndex ? nextIndex + 1 : closeIndex;
      continue;
    }

    const propertyKey = readJsObjectPropertyKey(source, index, closeIndex);
    if (propertyKey.ok !== true) {
      if (matchedMethod !== null) {
        return freezeRecord({
          ok: false,
          body: "",
          bodyOpenIndex: -1,
          bodyCloseIndex: -1,
          error: "object-method-overridden-by-unsupported-key"
        });
      }

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
        if (matchedMethod !== null) {
          return freezeRecord({
            ok: false,
            body: "",
            bodyOpenIndex: -1,
            bodyCloseIndex: -1,
            error: "object-method-overridden-by-duplicate-method"
          });
        }

        matchedMethod = freezeRecord({
          ok: true,
          body: source.slice(bodyOpenIndex + 1, bodyCloseIndex),
          params: freezeArray(
            extractTopLevelJsCallArguments(
              source,
              afterKeyIndex,
              paramsCloseIndex
            )
          ),
          propertyStartIndex: index,
          bodyOpenIndex,
          bodyCloseIndex,
          error: null
        });
      }

      index = bodyCloseIndex + 1;
      continue;
    }

    if (propertyKey.key === methodName && matchedMethod !== null) {
      return freezeRecord({
        ok: false,
        body: "",
        bodyOpenIndex: -1,
        bodyCloseIndex: -1,
        error: "object-method-overridden-by-property"
      });
    }

    const nextIndex = findNextTopLevelPropertySeparator(
      source,
      afterKeyIndex,
      closeIndex
    );
    index = nextIndex < closeIndex ? nextIndex + 1 : closeIndex;
  }

  if (matchedMethod !== null) {
    return matchedMethod;
  }

  return freezeRecord({
    ok: false,
    body: "",
    bodyOpenIndex: -1,
    bodyCloseIndex: -1,
    error: "top-level-object-method-not-found"
  });
}

function jsTopLevelReturnExpressionPass(source, expectedExpression) {
  const returnExpressions = readTopLevelJsReturnExpressions(source);
  return (
    returnExpressions !== null &&
    returnExpressions.length === 1 &&
    normalizeJsExpressionSource(returnExpressions[0].expression) ===
      normalizeJsExpressionSource(expectedExpression)
  );
}

function jsTopLevelReturnCallExpressionWithArgumentsPass({
  source,
  params = freezeArray([]),
  callee,
  expectedArguments
}) {
  const returnExpressions = readTopLevelJsReturnExpressions(source, {
    allowGuardedNestedNullReturns: true,
    params
  });
  return (
    returnExpressions !== null &&
    returnExpressions.length === 1 &&
    jsExpressionReturnsCallExpressionWithArgumentsPass({
      source: returnExpressions[0].expression,
      contextSource: source,
      params,
      beforeIndex: returnExpressions[0].returnIndex,
      callee,
      expectedArguments
    })
  );
}

function readTopLevelJsReturnExpressions(source, options = freezeRecord({})) {
  const returnExpressions = [];
  let index = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  const braceStack = [];

  while (index < source.length) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    if (
      bracketDepth === 0 &&
      parenDepth === 0 &&
      jsIdentifierAt(source, index, "return")
    ) {
      const expressionStart = skipJsTrivia(
        source,
        index + "return".length,
        source.length
      );
      const statementEnd = findJsStatementEnd(source, expressionStart);
      if (statementEnd < 0) {
        return null;
      }
      const expression = source.slice(expressionStart, statementEnd).trim();
      if (braceDepth !== 0) {
        if (
          !jsNestedReturnAllowed({
            source,
            expression,
            returnIndex: index,
            braceStack,
            options
          })
        ) {
          return null;
        }
        index = statementEnd + 1;
        continue;
      }
      returnExpressions.push(
        freezeRecord({
          expression,
          returnIndex: index
        })
      );
      index = statementEnd + 1;
      continue;
    }

    const character = source[index];
    if (character === "{" && bracketDepth === 0 && parenDepth === 0) {
      braceDepth += 1;
      braceStack.push(readJsControlBlockHeader(source, index));
    } else if (character === "}" && braceDepth > 0) {
      braceDepth -= 1;
      braceStack.pop();
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

  return freezeArray(returnExpressions);
}

function readJsControlBlockHeader(source, blockOpenIndex) {
  const closeParenIndex = skipJsWhitespaceBackward(
    source,
    blockOpenIndex - 1
  );
  if (source[closeParenIndex] !== ")") {
    return freezeRecord({
      kind: "block",
      test: ""
    });
  }

  const openParenIndex = findMatchingJsOpeningEnclosure(
    source,
    closeParenIndex,
    "(",
    ")"
  );
  if (openParenIndex < 0) {
    return freezeRecord({
      kind: "block",
      test: ""
    });
  }

  const keyword = readPreviousJsIdentifier(source, openParenIndex);
  if (keyword.value !== "if") {
    return freezeRecord({
      kind: "block",
      test: ""
    });
  }

  return freezeRecord({
    kind: "if",
    test: source.slice(openParenIndex + 1, closeParenIndex).trim()
  });
}

function jsNestedReturnAllowed({
  source,
  expression,
  returnIndex,
  braceStack,
  options
}) {
  if (
    options.allowGuardedNestedNullReturns !== true ||
    !isJsNullLiteralExpression(expression)
  ) {
    return false;
  }

  const block = braceStack[braceStack.length - 1];
  if (block === undefined || block.kind !== "if") {
    return false;
  }

  const guard = parseJsNullishEqualityGuardExpression(block.test);
  return (
    guard !== null &&
    jsExpressionHasLiveBindingProof({
      source,
      expression: guard.operand,
      params: options.params ?? freezeArray([]),
      beforeIndex: returnIndex
    })
  );
}

function jsCallArgumentsHaveLiveBindingProof({
  source,
  expectedArguments,
  params,
  beforeIndex
}) {
  return expectedArguments.every((expectedArgument) =>
    jsExpressionHasLiveBindingProof({
      source,
      expression: expectedArgument,
      params,
      beforeIndex
    })
  );
}

function jsExpressionHasLiveBindingProof({
  source,
  expression,
  params,
  beforeIndex
}) {
  const identifier = normalizeJsExpressionSource(expression);
  if (!isSimpleJsIdentifierExpression(identifier)) {
    return false;
  }

  if (params.includes(identifier)) {
    return !jsIdentifierHasAssignmentBeforeIndex({
      source,
      identifier,
      beforeIndex,
      treatDeclarationsAsAssignments: true
    });
  }

  const declaration = extractTopLevelJsConstDeclarationInitializerSource({
    source,
    name: identifier,
    beforeIndex
  });
  return (
    declaration.ok === true &&
    !jsIdentifierHasAssignmentBeforeIndex({
      source,
      identifier,
      beforeIndex,
      ignoredDeclarationIndex: declaration.declarationIndex,
      treatDeclarationsAsAssignments: true
    }) &&
    jsConstInitializerHasLiveBindingProof({
      source,
      initializer: declaration.initializer,
      params,
      beforeIndex: declaration.declarationIndex
    })
  );
}

function jsConstInitializerHasLiveBindingProof({
  source,
  initializer,
  params,
  beforeIndex
}) {
  const expression = stripOuterJsExpressionParentheses(initializer);
  if (isJsNullishLiteralExpression(expression)) {
    return false;
  }

  const call = parseJsSimpleCallExpression(expression);
  if (call === null || call.arguments.length !== 1) {
    return false;
  }

  if (
    call.callee !== "getCurrentRootRequestForHandle" &&
    call.callee !== "rendererRootHandles.get"
  ) {
    return false;
  }

  return jsExpressionHasLiveBindingProof({
    source,
    expression: call.arguments[0],
    params,
    beforeIndex
  });
}

function jsIdentifierHasAssignmentBeforeIndex({
  source,
  identifier,
  beforeIndex,
  ignoredDeclarationIndex = -1,
  treatDeclarationsAsAssignments = false
}) {
  if (
    treatDeclarationsAsAssignments &&
    jsIdentifierHasBindingDeclarationBeforeIndex({
      source,
      identifier,
      beforeIndex,
      ignoredDeclarationIndex
    })
  ) {
    return true;
  }

  if (
    jsIdentifierAppearsInDestructuringAssignmentBeforeIndex({
      source,
      identifier,
      beforeIndex
    })
  ) {
    return true;
  }

  let index = 0;

  while (index < beforeIndex) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    if (!jsIdentifierAt(source, index, identifier)) {
      index += 1;
      continue;
    }

    const previousToken = findPreviousJsSignificantToken(source, index);
    const afterIdentifierIndex = skipJsTrivia(
      source,
      index + identifier.length,
      beforeIndex
    );
    if (
      previousToken !== null &&
      previousToken.type === "word" &&
      ["class", "const", "let", "var", "function"].includes(
        previousToken.value
      )
    ) {
      if (
        treatDeclarationsAsAssignments &&
        previousToken.start !== ignoredDeclarationIndex
      ) {
        return true;
      }
      index = afterIdentifierIndex + 1;
      continue;
    }

    if (
      readJsAssignmentOperatorAt(source, afterIdentifierIndex).ok === true ||
      source.startsWith("++", afterIdentifierIndex) ||
      source.startsWith("--", afterIdentifierIndex) ||
      jsPrefixUpdateOperatorBefore(source, index)
    ) {
      return true;
    }

    index += identifier.length;
  }

  return false;
}

function jsIdentifierAppearsInDestructuringAssignmentBeforeIndex({
  source,
  identifier,
  beforeIndex
}) {
  let index = 0;

  while (index < beforeIndex) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    const assignmentOperator = readJsAssignmentOperatorAt(source, index);
    if (assignmentOperator.ok !== true) {
      index += 1;
      continue;
    }

    const pattern = readJsDestructuringAssignmentPatternBeforeOperator(
      source,
      index
    );
    if (
      pattern !== null &&
      jsDestructuringAssignmentPatternContainsIdentifier(pattern, identifier)
    ) {
      return true;
    }

    index = assignmentOperator.end;
  }

  return false;
}

function readJsDestructuringAssignmentPatternBeforeOperator(
  source,
  operatorIndex
) {
  const patternEnd = skipJsWhitespaceBackward(source, operatorIndex - 1);
  const closeCharacter = source[patternEnd];
  const openCharacter =
    closeCharacter === "}" ? "{" : closeCharacter === "]" ? "[" : "";
  if (openCharacter === "") {
    return null;
  }

  const patternOpenIndex = findMatchingJsOpeningEnclosure(
    source,
    patternEnd,
    openCharacter,
    closeCharacter
  );
  if (patternOpenIndex < 0) {
    return null;
  }

  return source.slice(patternOpenIndex, patternEnd + 1);
}

function jsDestructuringAssignmentPatternContainsIdentifier(
  source,
  identifier
) {
  const bindings = new Set();
  collectJsIdentifiersInSource(source, bindings);
  return bindings.has(identifier);
}

function jsIdentifierHasBindingDeclarationBeforeIndex({
  source,
  identifier,
  beforeIndex,
  ignoredDeclarationIndex
}) {
  let index = 0;

  while (index < beforeIndex) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    const declaration = readJsBindingDeclarationAt({
      source,
      index,
      endIndex: beforeIndex
    });
    if (declaration.ok === true) {
      if (
        declaration.start !== ignoredDeclarationIndex &&
        declaration.bindings.includes(identifier)
      ) {
        return true;
      }
      index = Math.max(index + 1, declaration.nameSearchEnd);
      continue;
    }

    index += 1;
  }

  return false;
}

function readJsBindingDeclarationAt({ source, index, endIndex }) {
  const variableDeclaration = readJsVariableBindingDeclarationAt({
    source,
    index,
    endIndex
  });
  if (variableDeclaration.ok === true) {
    return variableDeclaration;
  }

  const functionDeclaration = readJsFunctionBindingDeclarationAt({
    source,
    index,
    endIndex
  });
  if (functionDeclaration.ok === true) {
    return functionDeclaration;
  }

  return readJsClassBindingDeclarationAt({ source, index, endIndex });
}

function readJsVariableBindingDeclarationAt({ source, index, endIndex }) {
  const keyword = ["const", "let", "var"].find((candidate) =>
    jsIdentifierAt(source, index, candidate)
  );
  if (keyword === undefined) {
    return freezeRecord({
      ok: false,
      start: index,
      bindings: freezeArray([]),
      nameSearchEnd: index
    });
  }

  const declaratorsStart = skipJsTrivia(
    source,
    index + keyword.length,
    endIndex
  );
  const statementEnd = findJsStatementEnd(source, declaratorsStart);
  const declarationEnd =
    statementEnd < 0 || statementEnd > endIndex ? endIndex : statementEnd;
  const bindings = new Set();
  let cursor = declaratorsStart;

  while (cursor < declarationEnd) {
    const declaratorStart = skipJsTrivia(source, cursor, declarationEnd);
    if (declaratorStart >= declarationEnd) {
      break;
    }

    const declaratorEnd = findNextTopLevelPropertySeparator(
      source,
      declaratorStart,
      declarationEnd
    );
    collectJsVariableDeclaratorBindingIdentifiers(
      source.slice(declaratorStart, declaratorEnd),
      bindings
    );
    cursor = declaratorEnd < declarationEnd ? declaratorEnd + 1 : declarationEnd;
  }

  return freezeRecord({
    ok: true,
    start: index,
    bindings: freezeArray(bindings),
    nameSearchEnd: declaratorsStart
  });
}

function collectJsVariableDeclaratorBindingIdentifiers(source, bindings) {
  const startIndex = skipJsTrivia(source, 0, source.length);
  const character = source[startIndex];
  if (character === "{" || character === "[") {
    const closeCharacter = character === "{" ? "}" : "]";
    const patternEnd = findMatchingJsEnclosure(
      source,
      startIndex,
      character,
      closeCharacter
    );
    if (patternEnd >= 0) {
      collectJsIdentifiersInSource(
        source.slice(startIndex, patternEnd + 1),
        bindings
      );
    }
    return;
  }

  const identifier = readJsIdentifier(source, startIndex, source.length);
  if (identifier.ok === true) {
    bindings.add(identifier.name);
  }
}

function readJsFunctionBindingDeclarationAt({ source, index, endIndex }) {
  const startIndex = index;
  let cursor = index;

  if (jsIdentifierAt(source, cursor, "async")) {
    cursor = skipJsTrivia(source, cursor + "async".length, endIndex);
    if (!jsIdentifierAt(source, cursor, "function")) {
      return freezeRecord({
        ok: false,
        start: startIndex,
        bindings: freezeArray([]),
        nameSearchEnd: index
      });
    }
  } else if (!jsIdentifierAt(source, cursor, "function")) {
    return freezeRecord({
      ok: false,
      start: startIndex,
      bindings: freezeArray([]),
      nameSearchEnd: index
    });
  }

  cursor = skipJsTrivia(source, cursor + "function".length, endIndex);
  if (source[cursor] === "*") {
    cursor = skipJsTrivia(source, cursor + 1, endIndex);
  }

  const identifier = readJsIdentifier(source, cursor, endIndex);
  if (identifier.ok !== true) {
    return freezeRecord({
      ok: false,
      start: startIndex,
      bindings: freezeArray([]),
      nameSearchEnd: cursor
    });
  }

  return freezeRecord({
    ok: true,
    start: startIndex,
    bindings: freezeArray([identifier.name]),
    nameSearchEnd: identifier.end
  });
}

function readJsClassBindingDeclarationAt({ source, index, endIndex }) {
  if (!jsIdentifierAt(source, index, "class")) {
    return freezeRecord({
      ok: false,
      start: index,
      bindings: freezeArray([]),
      nameSearchEnd: index
    });
  }

  const nameStart = skipJsTrivia(source, index + "class".length, endIndex);
  const identifier = readJsIdentifier(source, nameStart, endIndex);
  if (identifier.ok !== true) {
    return freezeRecord({
      ok: false,
      start: index,
      bindings: freezeArray([]),
      nameSearchEnd: nameStart
    });
  }

  return freezeRecord({
    ok: true,
    start: index,
    bindings: freezeArray([identifier.name]),
    nameSearchEnd: identifier.end
  });
}

function collectJsIdentifiersInSource(source, bindings) {
  let index = 0;

  while (index < source.length) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    const identifier = readJsIdentifier(source, index, source.length);
    if (identifier.ok === true) {
      bindings.add(identifier.name);
      index = identifier.end;
      continue;
    }

    index += 1;
  }
}

function parseJsSimpleCallExpression(source) {
  const expression = stripOuterJsExpressionParentheses(source);
  const callOpenIndex = findTopLevelJsCallOpenIndex(expression);
  if (callOpenIndex < 0) {
    return null;
  }

  const callee = expression.slice(0, callOpenIndex).trim();
  if (!isSimpleJsMemberExpression(callee)) {
    return null;
  }

  const callCloseIndex = findMatchingJsEnclosure(
    expression,
    callOpenIndex,
    "(",
    ")"
  );
  if (callCloseIndex < 0) {
    return null;
  }

  const trailingIndex = skipJsTrivia(
    expression,
    callCloseIndex + 1,
    expression.length
  );
  if (trailingIndex !== expression.length) {
    return null;
  }

  return freezeRecord({
    callee,
    arguments: freezeArray(
      extractTopLevelJsCallArguments(expression, callOpenIndex, callCloseIndex)
    )
  });
}

function findTopLevelJsCallOpenIndex(source) {
  let index = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  while (index < source.length) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    const character = source[index];
    if (character === "{" && bracketDepth === 0) {
      braceDepth += 1;
    } else if (character === "}" && braceDepth > 0) {
      braceDepth -= 1;
    } else if (character === "[" && braceDepth === 0) {
      bracketDepth += 1;
    } else if (character === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (
      character === "(" &&
      braceDepth === 0 &&
      bracketDepth === 0
    ) {
      return index;
    }

    index += 1;
  }

  return -1;
}

function jsExpressionReturnsCallExpressionWithArgumentsPass({
  source,
  contextSource = "",
  params = freezeArray([]),
  beforeIndex = 0,
  callee,
  expectedArguments
}) {
  const expression = stripOuterJsExpressionParentheses(source);
  if (
    jsExactCallExpressionWithArgumentsPass({
      source: expression,
      callee,
      expectedArguments
    })
  ) {
    return jsCallArgumentsHaveLiveBindingProof({
      source: contextSource,
      expectedArguments,
      params,
      beforeIndex
    });
  }

  const conditional = splitTopLevelJsConditionalExpression(expression);
  if (conditional === null) {
    return false;
  }

  const nullishGuard = parseJsNullishEqualityGuardExpression(
    conditional.test
  );
  if (
    nullishGuard === null ||
    expectedArguments.length !== 1 ||
    normalizeJsExpressionSource(nullishGuard.operand) !==
      normalizeJsExpressionSource(expectedArguments[0]) ||
    !jsExpressionHasLiveBindingProof({
      source: contextSource,
      expression: expectedArguments[0],
      params,
      beforeIndex
    })
  ) {
    return false;
  }

  if (nullishGuard.operator === "===") {
    return (
      isJsNullLiteralExpression(conditional.consequent) &&
      jsExactCallExpressionWithArgumentsPass({
        source: conditional.alternate,
        callee,
        expectedArguments
      })
    );
  }

  return (
    isJsNullLiteralExpression(conditional.alternate) &&
    jsExactCallExpressionWithArgumentsPass({
      source: conditional.consequent,
      callee,
      expectedArguments
    })
  );
}

function parseJsNullishEqualityGuardExpression(source) {
  const expression = normalizeJsExpressionSource(source);
  const direct = expression.match(/^(.+?)\s*(===|!==)\s*(null|undefined)$/u);
  if (
    direct !== null &&
    isSimpleJsMemberExpression(direct[1].trim())
  ) {
    return freezeRecord({
      operand: direct[1].trim(),
      operator: direct[2]
    });
  }

  const reversed = expression.match(/^(null|undefined)\s*(===|!==)\s*(.+)$/u);
  if (
    reversed !== null &&
    isSimpleJsMemberExpression(reversed[3].trim())
  ) {
    return freezeRecord({
      operand: reversed[3].trim(),
      operator: reversed[2]
    });
  }

  return null;
}

function isSimpleJsMemberExpression(source) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*$/u.test(
    source
  );
}

function isSimpleJsIdentifierExpression(source) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(source);
}

function isJsNullLiteralExpression(source) {
  return normalizeJsExpressionSource(source) === "null";
}

function isJsNullishLiteralExpression(source) {
  const expression = normalizeJsExpressionSource(source);
  return expression === "null" || expression === "undefined";
}

function jsExactCallExpressionWithArgumentsPass({
  source,
  callee,
  expectedArguments
}) {
  const expression = stripOuterJsExpressionParentheses(source);
  const calleeIndex = skipJsTrivia(expression, 0, expression.length);
  if (!jsIdentifierAt(expression, calleeIndex, callee)) {
    return false;
  }

  const callOpenIndex = skipJsTrivia(
    expression,
    calleeIndex + callee.length,
    expression.length
  );
  if (expression[callOpenIndex] !== "(") {
    return false;
  }

  const callCloseIndex = findMatchingJsEnclosure(
    expression,
    callOpenIndex,
    "(",
    ")"
  );
  if (callCloseIndex < 0) {
    return false;
  }

  const trailingIndex = skipJsTrivia(
    expression,
    callCloseIndex + 1,
    expression.length
  );
  if (trailingIndex !== expression.length) {
    return false;
  }

  const actualArguments = extractTopLevelJsCallArguments(
    expression,
    callOpenIndex,
    callCloseIndex
  );
  return (
    actualArguments.length === expectedArguments.length &&
    actualArguments.every(
      (actualArgument, index) => actualArgument === expectedArguments[index]
    )
  );
}

function splitTopLevelJsConditionalExpression(source) {
  const expression = stripOuterJsExpressionParentheses(source);
  let questionIndex = -1;
  let nestedConditionalDepth = 0;
  let index = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;

  while (index < expression.length) {
    const nextIndex = skipJsCommentStringOrRegex(expression, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    const character = expression[index];
    if (braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
      if (character === "?") {
        if (questionIndex < 0) {
          questionIndex = index;
        } else {
          nestedConditionalDepth += 1;
        }
        index += 1;
        continue;
      }
      if (character === ":" && questionIndex >= 0) {
        if (nestedConditionalDepth === 0) {
          return freezeRecord({
            test: expression.slice(0, questionIndex).trim(),
            consequent: expression.slice(questionIndex + 1, index).trim(),
            alternate: expression.slice(index + 1).trim()
          });
        }
        nestedConditionalDepth -= 1;
        index += 1;
        continue;
      }
    }

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

  return null;
}

function stripOuterJsExpressionParentheses(source) {
  let expression = source.trim();

  while (expression[0] === "(") {
    const closeIndex = findMatchingJsEnclosure(expression, 0, "(", ")");
    if (closeIndex !== expression.length - 1) {
      break;
    }
    expression = expression.slice(1, -1).trim();
  }

  return expression;
}

function normalizeJsExpressionSource(source) {
  return stripOuterJsExpressionParentheses(source).replace(/\s+/gu, " ");
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
        value: source.slice(start, cursor),
        start,
        end: cursor
      });
      continue;
    }

    previousToken = freezeRecord({
      type: "punctuator",
      value: character,
      start: cursor,
      end: cursor + 1
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

function readPreviousJsIdentifier(source, endIndex) {
  let index = skipJsWhitespaceBackward(source, endIndex - 1);
  const end = index + 1;
  while (index >= 0 && /[A-Za-z0-9_$]/u.test(source[index])) {
    index -= 1;
  }
  const start = index + 1;
  if (start >= end || !/[A-Za-z_$]/u.test(source[start])) {
    return freezeRecord({
      value: "",
      start: -1,
      end: -1
    });
  }

  return freezeRecord({
    value: source.slice(start, end),
    start,
    end
  });
}

function skipJsWhitespaceBackward(source, startIndex) {
  let index = startIndex;
  while (index >= 0 && /\s/u.test(source[index])) {
    index -= 1;
  }
  return index;
}

function findMatchingJsOpeningEnclosure(
  source,
  closeIndex,
  openCharacter,
  closeCharacter
) {
  let index = 0;

  while (index < closeIndex) {
    const nextIndex = skipJsCommentStringOrRegex(source, index);
    if (nextIndex !== index) {
      index = nextIndex;
      continue;
    }

    if (source[index] === openCharacter) {
      const matchingCloseIndex = findMatchingJsEnclosure(
        source,
        index,
        openCharacter,
        closeCharacter
      );
      if (matchingCloseIndex === closeIndex) {
        return index;
      }
      if (matchingCloseIndex > index) {
        index = matchingCloseIndex + 1;
        continue;
      }
    }

    index += 1;
  }

  return -1;
}

function jsPrefixUpdateOperatorBefore(source, index) {
  const beforeIndex = skipJsWhitespaceBackward(source, index - 1);
  return (
    source.slice(beforeIndex - 1, beforeIndex + 1) === "++" ||
    source.slice(beforeIndex - 1, beforeIndex + 1) === "--"
  );
}

function readJsObjectPropertyKey(source, startIndex, endIndex) {
  const character = source[startIndex];
  if (character === "'" || character === '"') {
    const literalEnd = skipQuotedJsLiteral(source, startIndex);
    if (literalEnd > endIndex) {
      return freezeRecord({
        ok: false,
        key: null,
        end: startIndex,
        error: "quoted-property-key-not-closed"
      });
    }

    const key = parseJsQuotedStringLiteralSource(
      source.slice(startIndex, literalEnd)
    );
    if (key === null) {
      return freezeRecord({
        ok: false,
        key: null,
        end: literalEnd,
        error: "quoted-property-key-not-supported"
      });
    }

    return freezeRecord({
      ok: true,
      key,
      end: literalEnd,
      error: null
    });
  }

  if (character === "[") {
    const computedEnd = findMatchingJsEnclosure(
      source,
      startIndex,
      "[",
      "]"
    );
    if (computedEnd < 0 || computedEnd > endIndex) {
      return freezeRecord({
        ok: false,
        key: null,
        end: startIndex,
        error: "computed-property-key-not-closed"
      });
    }

    const expression = source.slice(startIndex + 1, computedEnd).trim();
    const key = parseJsQuotedStringLiteralSource(expression);
    if (key === null) {
      return freezeRecord({
        ok: false,
        key: null,
        end: computedEnd + 1,
        error: "computed-property-key-not-supported"
      });
    }

    return freezeRecord({
      ok: true,
      key,
      end: computedEnd + 1,
      error: null
    });
  }

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
