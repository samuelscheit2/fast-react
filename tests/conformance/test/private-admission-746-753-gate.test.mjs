import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_746_753_GATE_STATUS,
  PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT,
  PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
  PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS,
  PRIVATE_ADMISSION_746_753_REQUIRED_HYDRATE_ROOT_METADATA,
  PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_EVIDENCE,
  PRIVATE_ADMISSION_746_753_REQUIRED_SCHEDULER_YIELD_HANDOFF,
  PRIVATE_ADMISSION_746_753_REQUIRED_SIBLING_NATIVE_TOJSON,
  PRIVATE_ADMISSION_746_753_REQUIRED_TEST_UTILS_ACT_HANDOFF,
  PRIVATE_ADMISSION_746_753_ROWS,
  PRIVATE_ADMISSION_746_753_SKIPPED_ROWS,
  PRIVATE_ADMISSION_746_753_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_746_753_VIOLATION_STATUS,
  PRIVATE_ADMISSION_746_753_WORKERS,
  evaluatePrivateAdmission746753Gate
} from "../src/private-admission-746-753-gate.mjs";
import {
  PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS
} from "../src/private-admission-739-745-gate.mjs";

const worker746 = "worker-746-record-740-745-docs";
const worker748 = "worker-748-hydrateroot-boundary-metadata-snapshot";
const worker749 = "worker-749-sibling-text-native-tojson-consumes-identity";
const worker751 = "worker-751-scheduler-posttask-yield-handoff";
const worker752 = "worker-752-package-private-admission-audit-739-745";
const worker753 = "worker-753-react-dom-test-utils-act-handoff";
const expectedWorkers = [worker748, worker749, worker751, worker752, worker753];
const expectedSkippedWorkers = [worker746];
const unacceptedWorkerIds = [
  "worker-747",
  "worker-750",
  "worker-754",
  "worker-755",
  "worker-756"
];

const rootBridgePath = "packages/react-dom/src/client/root-bridge.js";
const testRendererRustSourcePath = "crates/fast-react-test-renderer/src/lib.rs";
const worker753ProgressPath =
  "worker-progress/worker-753-react-dom-test-utils-act-handoff.md";

const required746SpecificSurfaces = [
  "react-dom-root-render",
  "react-dom-test-utils-act",
  "react-dom-flush-sync",
  "scheduler-post-task-yield",
  "scheduler-browser-task-ordering",
  "test-renderer-sibling-text-native-tojson-identity-consumption",
  "native-execution",
  "renderer-work",
  "effects",
  "package-surface-compatibility"
];
const required746SpecificPublicClaims = [
  "publicReactDomRootRenderCompatibilityClaimed",
  "publicReactDomTestUtilsActCompatibilityClaimed",
  "publicReactDomFlushSyncCompatibilityClaimed",
  "publicReactActCompatibilityClaimed",
  "publicSchedulerPostTaskYieldCompatibilityClaimed",
  "publicSchedulerBrowserTaskOrderingCompatibilityClaimed",
  "publicNativeToJSONCompatibilityClaimed",
  "publicNativeExecutionCompatibilityClaimed",
  "publicRendererCompatibilityClaimed",
  "publicEffectCompatibilityClaimed",
  "publicPackageSurfaceCompatibilityClaimed"
];
const required746SpecificAdmissionClaims = [
  "reactDomRootRenderAdmissionClaimed",
  "reactDomTestUtilsActAdmissionClaimed",
  "reactDomFlushSyncAdmissionClaimed",
  "reactActAdmissionClaimed",
  "schedulerPostTaskYieldPublicAdmissionClaimed",
  "schedulerBrowserCompatibilityClaimed",
  "nativeToJSONPublicAdmissionClaimed",
  "rendererEffectsAdmissionClaimed",
  "packageSurfaceAdmissionClaimed"
];

test("private admission 746-753 manifest records accepted post-745 evidence only", () => {
  assert.deepEqual(PRIVATE_ADMISSION_746_753_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_746_753_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_746_753_SKIPPED_WORKERS,
    expectedSkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_746_753_SKIPPED_ROWS.map((row) => row.workerId),
    expectedSkippedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_746_753_ROWS.length, 5);
  assert.equal(PRIVATE_ADMISSION_746_753_SKIPPED_ROWS.length, 1);

  for (const workerId of unacceptedWorkerIds) {
    assert.equal(PRIVATE_ADMISSION_746_753_WORKERS.includes(workerId), false);
    assert.equal(
      PRIVATE_ADMISSION_746_753_SKIPPED_WORKERS.includes(workerId),
      false
    );
  }

  assertSubset(
    PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES,
    PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES
  );
  assertSubset(
    PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS,
    PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS,
    PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS
  );
  assertSubset(
    required746SpecificSurfaces,
    PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES
  );
  assertSubset(
    required746SpecificPublicClaims,
    PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    required746SpecificAdmissionClaims,
    PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS
  );
});

test("private admission 746-753 gate recognizes accepted static evidence without compatibility", () => {
  const gate = evaluatePrivateAdmission746753Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_746_753_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.blockerContextRecognized, true);
  assert.equal(gate.priorLedgerContextRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.hydrateRootMetadataRecognized, true);
  assert.equal(gate.siblingNativeToJSONRecognized, true);
  assert.equal(gate.schedulerYieldHandoffRecognized, true);
  assert.equal(gate.priorLedgerEvidenceRecognized, true);
  assert.equal(gate.testUtilsActHandoffRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.skippedWorkers, expectedSkippedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.recognizedSkippedWorkerIds, expectedSkippedWorkers);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);
  assert.deepEqual(gate.nativeJsPackageLeakClaimIds, []);
  assert.deepEqual(gate.publicRendererLeakClaimIds, []);

  assertPrivateEvidenceRow(gate.rowsByWorker[worker748], {
    privateAdmission: "accepted-private-hydration-metadata-evidence",
    primaryCompatibilityArea:
      "react-dom-hydrateroot-boundary-metadata-public-hydration-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker748],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker748],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker748],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker748],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker748
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker748],
    hydrateRootMetadata:
      PRIVATE_ADMISSION_746_753_REQUIRED_HYDRATE_ROOT_METADATA[worker748],
    evidenceRoles: [
      "worker-748-progress",
      "worker-748-root-bridge-metadata-source",
      "worker-748-root-bridge-metadata-validator",
      "worker-748-public-facade-metadata-test"
    ]
  });

  assertPrivateEvidenceRow(gate.rowsByWorker[worker749], {
    privateAdmission:
      "accepted-private-native-tojson-identity-consumption-evidence",
    primaryCompatibilityArea:
      "test-renderer-sibling-text-native-tojson-public-native-package-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker749],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker749],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker749],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker749],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker749
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker749],
    siblingNativeToJSON:
      PRIVATE_ADMISSION_746_753_REQUIRED_SIBLING_NATIVE_TOJSON[worker749],
    evidenceRoles: [
      "worker-749-progress",
      "worker-749-native-tojson-source",
      "worker-749-native-tojson-tests",
      "worker-749-native-tojson-tamper-tests",
      "worker-749-generic-sibling-gate-still-blocked"
    ]
  });

  assertPrivateEvidenceRow(gate.rowsByWorker[worker751], {
    privateAdmission: "accepted-private-scheduler-yield-handoff-evidence",
    primaryCompatibilityArea:
      "scheduler-post-task-yield-private-handoff-public-browser-timing-blocked",
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker751],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker751],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker751],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker751],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker751
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker751],
    schedulerYieldHandoff:
      PRIVATE_ADMISSION_746_753_REQUIRED_SCHEDULER_YIELD_HANDOFF[worker751],
    evidenceRoles: [
      "worker-751-progress",
      "worker-751-root-continuation-yield-test",
      "worker-751-post-task-oracle-yield-test",
      "worker-751-root-continuation-stale-guard"
    ]
  });

  assertPrivateEvidenceRow(gate.rowsByWorker[worker752], {
    privateAdmission: "accepted-private-ledger-evidence",
    primaryCompatibilityArea:
      "private-admission-static-ledger-739-745-public-compatibility-blocked",
    runtimeCapabilityAdded: false,
    promotion: "not-applicable",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker752],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker752],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker752],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker752],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker752
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker752],
    priorLedgerEvidence:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_EVIDENCE[worker752],
    evidenceRoles: [
      "worker-752-progress",
      "worker-752-ledger-source",
      "worker-752-ledger-test"
    ]
  });

  assertPrivateEvidenceRow(gate.rowsByWorker[worker753], {
    privateAdmission: "accepted-private-test-utils-act-handoff-evidence",
    primaryCompatibilityArea:
      "react-dom-test-utils-act-private-handoff-public-act-flushsync-root-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker753],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker753],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker753],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker753],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker753
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker753],
    testUtilsActHandoff:
      PRIVATE_ADMISSION_746_753_REQUIRED_TEST_UTILS_ACT_HANDOFF[worker753],
    evidenceRoles: [
      "worker-753-progress",
      "worker-753-test-utils-act-gate-source",
      "worker-753-test-utils-act-oracle-test",
      "worker-753-act-passive-local-gate"
    ]
  });

  assertSkippedMetaRow(gate.skippedRowsByWorker[worker746], [
    "worker-746-progress"
  ]);

  for (const evaluatedRow of [...gate.rows, ...gate.skippedRows]) {
    assertNoPublicOrAdmissionClaims(evaluatedRow);
    assert.equal(evaluatedRow.sourceTokenChecksOnly, true);
    assert.equal(evaluatedRow.manifestEvaluationOnly, true);
    assert.equal(evaluatedRow.runtimeExecutionClaimed, false);
    assert.equal(
      evaluatedRow.ledgerEvaluationMode,
      "source-token-checks-and-manifest-only"
    );
  }
});

test("private admission 746-753 gate rejects omitted evidence files", () => {
  const workspace = createWorkspaceWithEvidenceFiles({
    omitPath: worker753ProgressPath
  });

  try {
    const gate = evaluatePrivateAdmission746753Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_746_753_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assertEvidenceRoleRecognized(gate, worker753, "worker-753-progress", false);
    const omittedEvidence = gate.rowsByWorker[worker753].evidence.find(
      (row) => row.role === "worker-753-progress"
    );
    assert.match(omittedEvidence.readError, /ENOENT/u);
    assertViolationIds(gate, [
      "private-admission-evidence-file-or-token-missing"
    ]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 746-753 gate rejects removed Worker 748 metadata blocker tokens", () => {
  const workspace = createWorkspaceWithEvidenceFiles({
    mutatePath: rootBridgePath,
    find: "HYDRATION_BOUNDARY_ACCEPTED_METADATA_ROW_BLOCKED_PUBLIC_FIELDS",
    replace: "HYDRATION_BOUNDARY_ACCEPTED_METADATA_ROW_PUBLIC_FIELDS_OPENED",
    replaceAll: true
  });

  try {
    const gate = evaluatePrivateAdmission746753Gate({
      workspaceRoot: workspace.root,
      rowOverrides: {
        [worker748]: {
          hydrateRootMetadata: {
            rejectsRowLevelPublicClaims: false,
            publicHydrateRootBlocked: false
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_746_753_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assert.equal(gate.hydrateRootMetadataRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      worker748,
      "worker-748-root-bridge-metadata-validator",
      false
    );
    assertViolationIds(gate, [
      "private-admission-evidence-file-or-token-missing",
      "hydrate-root-metadata-evidence-mismatch"
    ]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 746-753 gate rejects removed Worker 749 native toJSON identity tokens", () => {
  const workspace = createWorkspaceWithEvidenceFiles({
    mutatePath: testRendererRustSourcePath,
    find: "consumes_private_sibling_text_finished_work_identity_gate = true",
    replace: "consumes_private_sibling_text_finished_work_identity_gate = false"
  });

  try {
    const gate = evaluatePrivateAdmission746753Gate({
      workspaceRoot: workspace.root,
      rowOverrides: {
        [worker749]: {
          siblingNativeToJSON: {
            consumesPrivateSiblingTextFinishedWorkIdentityGate: false,
            publicNativePackageJsBlocked: false
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_746_753_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assert.equal(gate.siblingNativeToJSONRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      worker749,
      "worker-749-native-tojson-source",
      false
    );
    assertViolationIds(gate, [
      "private-admission-evidence-file-or-token-missing",
      "sibling-text-native-tojson-evidence-mismatch"
    ]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 746-753 gate rejects public compatibility promotion", () => {
  const gate = evaluatePrivateAdmission746753Gate({
    rowOverrides: {
      [worker748]: {
        publicCompatibilityClaims: {
          publicReactDomRootRenderCompatibilityClaimed: true,
          publicHydrationBoundaryMetadataCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          reactDomRootRenderAdmissionClaimed: true,
          hydrationBoundaryMetadataAdmissionClaimed: true
        }
      },
      [worker751]: {
        publicCompatibilityClaims: {
          publicSchedulerPostTaskYieldCompatibilityClaimed: true,
          publicSchedulerBrowserTaskOrderingCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          schedulerPostTaskYieldPublicAdmissionClaimed: true,
          schedulerBrowserCompatibilityClaimed: true
        }
      },
      [worker753]: {
        compatibilityClaimed: true,
        promotion: "accepted-public",
        publicCompatibilityClaims: {
          publicReactDomTestUtilsActCompatibilityClaimed: true,
          publicReactDomFlushSyncCompatibilityClaimed: true,
          publicReactActCompatibilityClaimed: true,
          publicRendererCompatibilityClaimed: true,
          publicEffectCompatibilityClaimed: true,
          publicPackageSurfaceCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          reactDomTestUtilsActAdmissionClaimed: true,
          reactDomFlushSyncAdmissionClaimed: true,
          reactActAdmissionClaimed: true,
          rendererEffectsAdmissionClaimed: true,
          packageSurfaceAdmissionClaimed: true,
          nativeBridgeExecutionClaimed: true,
          nativeExecutionAdmissionClaimed: true
        }
      },
      [worker749]: {
        publicCompatibilityClaims: {
          publicNativeToJSONCompatibilityClaimed: true,
          publicNativeExecutionCompatibilityClaimed: true,
          publicTestRendererNativeBridgeCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          nativeToJSONPublicAdmissionClaimed: true,
          testRendererNativeBridgeCompatibilityClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_746_753_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "private-diagnostic-claimed-compatibility",
    "public-compatibility-claim-detected",
    "blocked-admission-claim-detected",
    "native-js-package-compatibility-leak-detected",
    "public-root-act-flushsync-hydration-test-renderer-scheduler-leak-detected",
    "private-diagnostic-public-promotion-leak"
  ]);
  assertSubset(
    [
      `${worker753}.nativeBridgeExecutionClaimed`,
      `${worker753}.nativeExecutionAdmissionClaimed`,
      `${worker753}.packageSurfaceAdmissionClaimed`,
      `${worker749}.nativeToJSONPublicAdmissionClaimed`,
      `${worker749}.testRendererNativeBridgeCompatibilityClaimed`
    ],
    gate.nativeJsPackageLeakClaimIds
  );
  assertSubset(
    [
      `${worker748}.publicReactDomRootRenderCompatibilityClaimed`,
      `${worker751}.publicSchedulerPostTaskYieldCompatibilityClaimed`,
      `${worker753}.publicReactDomTestUtilsActCompatibilityClaimed`,
      `${worker753}.reactDomFlushSyncAdmissionClaimed`,
      `${worker749}.publicNativeExecutionCompatibilityClaimed`
    ],
    gate.publicRendererLeakClaimIds
  );
});

test("private admission 746-753 gate rejects removing carried-forward 739-745 blockers", () => {
  const gate = evaluatePrivateAdmission746753Gate({
    rowOverrides: {
      [worker752]: {
        blockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES.filter(
            (surface) => surface !== "scheduler-public-timing"
          ),
        blockedPublicClaims:
          PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS.filter(
            (claimId) => claimId !== "publicSchedulerTimingCompatibilityClaimed"
          ),
        blockedAdmissionClaimIds:
          PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS.filter(
            (claimId) => claimId !== "schedulerTimingAdmissionClaimed"
          )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_746_753_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "blocked-public-compatibility-surface-mismatch",
    "blocked-public-claim-mismatch",
    "blocked-admission-claim-mismatch"
  ]);
});

test("private admission 746-753 gate rejects runtime execution claims in the static ledger", () => {
  const gate = evaluatePrivateAdmission746753Gate({
    rowOverrides: {
      [worker752]: {
        sourceTokenChecksOnly: false,
        manifestEvaluationOnly: false,
        runtimeExecutionClaimed: true,
        ledgerEvaluationMode: "runtime-execution"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_746_753_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assertViolationIds(gate, ["private-ledger-runtime-execution-claim"]);
});

function assertPrivateEvidenceRow(
  row,
  {
    privateAdmission,
    primaryCompatibilityArea,
    runtimeCapabilityAdded,
    promotion,
    acceptedDiagnosticIds,
    dependencyWorkerIds,
    dependencyDiagnosticIds,
    blockerContextWorkerIds,
    blockerContextDiagnosticIds,
    priorLedgerContext,
    hydrateRootMetadata = {},
    siblingNativeToJSON = {},
    schedulerYieldHandoff = {},
    priorLedgerEvidence = {},
    testUtilsActHandoff = {},
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, privateAdmission);
  assert.equal(row.sourceQueue, "746-753");
  assert.equal(row.primaryCompatibilityArea, primaryCompatibilityArea);
  assert.equal(row.runtimeCapabilityAdded, runtimeCapabilityAdded);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, promotion);
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, [...acceptedDiagnosticIds]);
  assert.deepEqual(row.dependencyWorkerIds, [...dependencyWorkerIds]);
  assert.deepEqual(row.dependencyDiagnosticIds, [...dependencyDiagnosticIds]);
  assert.deepEqual(row.blockerContextWorkerIds, [...blockerContextWorkerIds]);
  assert.deepEqual(row.blockerContextDiagnosticIds, [
    ...blockerContextDiagnosticIds
  ]);
  assert.deepEqual(row.priorLedgerContext, [...priorLedgerContext]);
  assert.deepEqual(row.hydrateRootMetadata, hydrateRootMetadata);
  assert.deepEqual(row.siblingNativeToJSON, siblingNativeToJSON);
  assert.deepEqual(row.schedulerYieldHandoff, schedulerYieldHandoff);
  assert.deepEqual(row.priorLedgerEvidence, priorLedgerEvidence);
  assert.deepEqual(row.testUtilsActHandoff, testUtilsActHandoff);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
}

function assertSkippedMetaRow(row, evidenceRoles) {
  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "746-753");
  assert.equal(row.runtimeCapabilityAdded, false);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "not-applicable");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, []);
  assert.equal(row.skipReason, "docs-only-coordination-no-runtime-capability");
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
}

function assertNoPublicOrAdmissionClaims(row) {
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES,
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.publicCompatibilityClaims),
    Object.values(row.publicCompatibilityClaims).map(() => false),
    row.workerId
  );
  assert.deepEqual(
    row.blockedPublicClaims,
    Object.keys(row.publicCompatibilityClaims),
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.blockedAdmissionClaims).sort(),
    [...PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.blockedAdmissionClaims),
    Object.values(row.blockedAdmissionClaims).map(() => false),
    row.workerId
  );
  assert.deepEqual(row.publicCompatibilityViolations, [], row.workerId);
  assert.deepEqual(row.blockedAdmissionClaimViolations, [], row.workerId);

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.path);
  }
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function assertViolationIds(gate, expectedIds) {
  const actualIds = gate.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}

function assertEvidenceRoleRecognized(
  gate,
  workerId,
  role,
  expectedRecognized
) {
  const evidenceRow = gate.rowsByWorker[workerId].evidence.find(
    (row) => row.role === role
  );
  assert.notEqual(evidenceRow, undefined, role);
  assert.equal(evidenceRow.recognized, expectedRecognized, role);
}

function createWorkspaceWithEvidenceFiles({
  omitPath = null,
  mutatePath = null,
  find = null,
  replace = null,
  replaceAll = false
}) {
  const root = mkdtempSync(join(tmpdir(), "private-admission-746-753-"));
  const workspaceRoot = findWorkspaceRoot();
  const evidencePaths = new Set(
    [
      ...PRIVATE_ADMISSION_746_753_ROWS,
      ...PRIVATE_ADMISSION_746_753_SKIPPED_ROWS
    ]
      .flatMap((row) => row.evidence)
      .map((evidenceRow) => evidenceRow.path)
  );

  for (const path of evidencePaths) {
    if (path === omitPath) {
      continue;
    }
    const sourcePath = join(workspaceRoot, path);
    const targetPath = join(root, path);
    mkdirSync(dirname(targetPath), { recursive: true });
    let text = readFileSync(sourcePath, "utf8");
    if (path === mutatePath) {
      text = replaceAll
        ? replaceEvery(text, find, replace)
        : replaceFirst(text, find, replace);
    }
    writeFileSync(targetPath, text);
  }

  return {
    root,
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    }
  };
}

function findWorkspaceRoot() {
  let current = process.cwd();
  while (true) {
    if (existsSync(join(current, "WORKER_BRIEF.md"))) {
      return current;
    }

    const parent = dirname(current);
    assert.notEqual(parent, current, "workspace root not found");
    current = parent;
  }
}

function replaceFirst(text, find, replace) {
  assert.equal(text.includes(find), true, find);
  return text.replace(find, replace);
}

function replaceEvery(text, find, replace) {
  assert.equal(text.includes(find), true, find);
  return text.split(find).join(replace);
}
