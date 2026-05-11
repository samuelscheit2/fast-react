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
  PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_739_745_GATE_STATUS,
  PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT,
  PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
  PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS,
  PRIVATE_ADMISSION_739_745_REQUIRED_HYDRATE_ROOT_PREFLIGHT,
  PRIVATE_ADMISSION_739_745_REQUIRED_NATIVE_TEARDOWN_MIRROR,
  PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_739_745_REQUIRED_SCHEDULER_DELAYED_ROUTE,
  PRIVATE_ADMISSION_739_745_REQUIRED_SIBLING_TEXT_IDENTITY_GATE,
  PRIVATE_ADMISSION_739_745_REQUIRED_STATIC_LEDGER_EVIDENCE,
  PRIVATE_ADMISSION_739_745_ROWS,
  PRIVATE_ADMISSION_739_745_SKIPPED_ROWS,
  PRIVATE_ADMISSION_739_745_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_739_745_VIOLATION_STATUS,
  PRIVATE_ADMISSION_739_745_WORKERS,
  evaluatePrivateAdmission739745Gate
} from "../src/private-admission-739-745-gate.mjs";
import {
  PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS
} from "../src/private-admission-737-738-gate.mjs";

const worker739 = "worker-739-record-worker-737-docs";
const worker740 = "worker-740-native-package-worker-thread-teardown-mirror";
const worker741 = "worker-741-react-dom-hydrateroot-private-facade-preflight";
const worker742 = "worker-742-scheduler-mock-delayed-act-root-continuation";
const worker743 = "worker-743-record-worker-738-docs";
const worker744 = "worker-744-package-private-admission-audit-737-738";
const worker745 = "worker-745-test-renderer-sibling-text-identity-gate";
const expectedWorkers = [worker740, worker741, worker742, worker744, worker745];
const expectedSkippedWorkers = [worker739, worker743];
const schedulerMockSourcePath = "packages/scheduler/unstable_mock.js";
const testRendererRustSourcePath = "crates/fast-react-test-renderer/src/lib.rs";

const required739SpecificSurfaces = [
  "native-worker-thread-teardown-mirror",
  "native-bridge-loading",
  "native-bridge-execution",
  "react-dom-hydrate-root",
  "react-dom-hydration",
  "scheduler-delayed-act-root-work",
  "scheduler-public-timing",
  "test-renderer-sibling-text-tojson-identity-public-serialization",
  "test-renderer-broad-multichild-identity",
  "test-renderer-sibling-snapshot-identity",
  "js-facade",
  "cjs-facade",
  "package-compatibility",
  "public-compatibility"
];
const required739SpecificPublicClaims = [
  "publicNativeWorkerThreadTeardownCompatibilityClaimed",
  "publicNativeBridgeCompatibilityClaimed",
  "publicReactDomHydrateRootCompatibilityClaimed",
  "publicReactDomHydrationCompatibilityClaimed",
  "publicSchedulerDelayedActRootWorkCompatibilityClaimed",
  "publicSchedulerTimingCompatibilityClaimed",
  "publicTestRendererSiblingTextToJSONIdentityCompatibilityClaimed",
  "publicTestRendererSerializationCompatibilityClaimed",
  "publicTestRendererBroadMultichildIdentityClaimed",
  "publicTestRendererSiblingSnapshotIdentityClaimed",
  "publicJSFacadeCompatibilityClaimed",
  "publicCJSFacadeCompatibilityClaimed",
  "publicPackageCompatibilityClaimed"
];
const required739SpecificAdmissionClaims = [
  "nativeWorkerThreadTeardownPublicAdmissionClaimed",
  "nativeBridgeLoadingClaimed",
  "nativeBridgeExecutionClaimed",
  "reactDomHydrateRootAdmissionClaimed",
  "hydrationAdmissionClaimed",
  "schedulerDelayedActRootAdmissionClaimed",
  "schedulerTimingAdmissionClaimed",
  "siblingTextToJSONPublicSerializationClaimed",
  "broadMultichildIdentityAdmissionClaimed",
  "siblingSnapshotIdentityAdmissionClaimed",
  "jsFacadeAdmissionClaimed",
  "cjsFacadeAdmissionClaimed",
  "packageCompatibilityClaimed"
];

test("private admission 739-745 manifest records docs-only coordination and accepted private evidence", () => {
  assert.deepEqual(PRIVATE_ADMISSION_739_745_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_739_745_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_739_745_SKIPPED_WORKERS,
    expectedSkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_739_745_SKIPPED_ROWS.map((row) => row.workerId),
    expectedSkippedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_739_745_ROWS.length, 5);
  assert.equal(PRIVATE_ADMISSION_739_745_SKIPPED_ROWS.length, 2);

  assertSubset(
    PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES,
    PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES
  );
  assertSubset(
    PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS,
    PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS,
    PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS
  );
  assertSubset(
    required739SpecificSurfaces,
    PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES
  );
  assertSubset(
    required739SpecificPublicClaims,
    PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    required739SpecificAdmissionClaims,
    PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS
  );
});

test("private admission 739-745 gate recognizes accepted private evidence without compatibility", () => {
  const gate = evaluatePrivateAdmission739745Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_739_745_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.blockerContextRecognized, true);
  assert.equal(gate.priorLedgerContextRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.nativeTeardownMirrorRecognized, true);
  assert.equal(gate.hydrateRootPreflightRecognized, true);
  assert.equal(gate.schedulerDelayedRouteRecognized, true);
  assert.equal(gate.staticLedgerEvidenceRecognized, true);
  assert.equal(gate.siblingTextIdentityGateRecognized, true);
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

  assertPrivateEvidenceRow(gate.rowsByWorker[worker740], {
    privateAdmission: "accepted-private-package-mirror-evidence",
    primaryCompatibilityArea:
      "native-root-bridge-worker-thread-teardown-public-native-compatibility-blocked",
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker740],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker740],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker740],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker740],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker740
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker740],
    nativeTeardownMirror:
      PRIVATE_ADMISSION_739_745_REQUIRED_NATIVE_TEARDOWN_MIRROR[worker740],
    evidenceRoles: [
      "worker-740-progress",
      "worker-740-native-loader-source",
      "worker-740-native-loader-test"
    ]
  });

  assertPrivateEvidenceRow(gate.rowsByWorker[worker741], {
    privateAdmission: "accepted-private-facade-preflight-evidence",
    primaryCompatibilityArea:
      "react-dom-client-hydrateroot-private-facade-public-hydration-blocked",
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker741],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker741],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker741],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker741],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker741
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker741],
    hydrateRootPreflight:
      PRIVATE_ADMISSION_739_745_REQUIRED_HYDRATE_ROOT_PREFLIGHT[worker741],
    evidenceRoles: [
      "worker-741-progress",
      "worker-741-client-symbol-source",
      "worker-741-root-bridge-preflight-source",
      "worker-741-root-public-facade-test"
    ]
  });

  assertPrivateEvidenceRow(gate.rowsByWorker[worker742], {
    privateAdmission: "accepted-private-scheduler-diagnostic-evidence",
    primaryCompatibilityArea:
      "scheduler-mock-delayed-act-root-private-diagnostic-public-timing-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker742],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker742],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker742],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker742],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker742
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker742],
    schedulerDelayedRoute:
      PRIVATE_ADMISSION_739_745_REQUIRED_SCHEDULER_DELAYED_ROUTE[worker742],
    evidenceRoles: [
      "worker-742-progress",
      "worker-742-delayed-route-source",
      "worker-742-delayed-validator-source",
      "worker-742-continuation-guard-source",
      "worker-742-delayed-test"
    ]
  });

  assertPrivateEvidenceRow(gate.rowsByWorker[worker744], {
    privateAdmission: "accepted-private-ledger-evidence",
    primaryCompatibilityArea:
      "private-admission-static-ledger-737-738-public-compatibility-blocked",
    runtimeCapabilityAdded: false,
    promotion: "not-applicable",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker744],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker744],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker744],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker744],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker744
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker744],
    staticLedgerEvidence:
      PRIVATE_ADMISSION_739_745_REQUIRED_STATIC_LEDGER_EVIDENCE[worker744],
    evidenceRoles: [
      "worker-744-progress",
      "worker-744-ledger-source",
      "worker-744-ledger-test"
    ]
  });

  assertPrivateEvidenceRow(gate.rowsByWorker[worker745], {
    privateAdmission: "accepted-private-identity-gate-evidence",
    primaryCompatibilityArea:
      "test-renderer-sibling-text-tojson-private-identity-public-serialization-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker745],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker745],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker745],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker745],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker745
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker745],
    siblingTextIdentityGate:
      PRIVATE_ADMISSION_739_745_REQUIRED_SIBLING_TEXT_IDENTITY_GATE[worker745],
    evidenceRoles: [
      "worker-745-progress",
      "worker-745-identity-constants-rust-proof",
      "worker-745-identity-gate-rust-proof",
      "worker-745-identity-validator-rust-proof",
      "worker-745-identity-tests-rust-proof",
      "worker-745-generic-gate-still-blocked-rust-proof"
    ]
  });

  assertSkippedMetaRow(gate.skippedRowsByWorker[worker739], [
    "worker-739-docs-progress"
  ]);
  assertSkippedMetaRow(gate.skippedRowsByWorker[worker743], [
    "worker-743-docs-progress"
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

test("private admission 739-745 gate rejects removing Worker 742 delayed Scheduler blocker evidence", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: schedulerMockSourcePath,
    find: "rejectsDelayedActRootWorkPublicCompatibilityClaims: true",
    replace: "rejectsDelayedActRootWorkPublicCompatibilityClaims: false",
    replaceAll: true
  });

  try {
    const gate = evaluatePrivateAdmission739745Gate({
      workspaceRoot: workspace.root,
      rowOverrides: {
        [worker742]: {
          schedulerDelayedRoute: {
            rejectsPublicCompatibilityClaims: false,
            publicSchedulerActRootRendererBlocked: false
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_739_745_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assert.equal(gate.schedulerDelayedRouteRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      worker742,
      "worker-742-delayed-route-source",
      false
    );
    assertViolationIds(gate, [
      "private-admission-evidence-token-missing",
      "scheduler-delayed-act-root-evidence-mismatch"
    ]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 739-745 gate rejects removing Worker 745 sibling identity blocker evidence", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: testRendererRustSourcePath,
    sliceStart:
      "pub fn describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(",
    sliceEnd:
      "pub fn describe_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(",
    find: "broad_multichild_identity_available: false",
    replace: "broad_multichild_identity_available: true",
    expectedReplacements: 1
  });

  try {
    const gate = evaluatePrivateAdmission739745Gate({
      workspaceRoot: workspace.root,
      rowOverrides: {
        [worker745]: {
          siblingTextIdentityGate: {
            broadMultichildIdentityBlocked: false,
            publicNativePackageJsSurfacesBlocked: false
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_739_745_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assert.equal(gate.siblingTextIdentityGateRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      worker745,
      "worker-745-identity-gate-rust-proof",
      false
    );
    assertViolationIds(gate, [
      "private-admission-evidence-token-missing",
      "sibling-text-identity-gate-evidence-mismatch"
    ]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 739-745 gate rejects public, native, JS, CJS, and package claims", () => {
  const gate = evaluatePrivateAdmission739745Gate({
    rowOverrides: {
      [worker745]: {
        compatibilityClaimed: true,
        promotion: "accepted-public",
        publicCompatibilityClaims: {
          publicTestRendererSiblingTextToJSONIdentityCompatibilityClaimed: true,
          publicTestRendererSerializationCompatibilityClaimed: true,
          publicPackageCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          nativeBridgeLoadingClaimed: true,
          nativeBridgeExecutionClaimed: true,
          nativeExecutionAdmissionClaimed: true,
          jsFacadeAdmissionClaimed: true,
          cjsFacadeAdmissionClaimed: true,
          packageCompatibilityClaimed: true,
          rustOnlyDiagnosticPromotedToPackageClaimed: true,
          siblingTextToJSONPublicSerializationClaimed: true,
          broadMultichildIdentityAdmissionClaimed: true,
          siblingSnapshotIdentityAdmissionClaimed: true
        }
      },
      [worker742]: {
        publicCompatibilityClaims: {
          publicSchedulerDelayedActRootWorkCompatibilityClaimed: true,
          publicSchedulerTimingCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          schedulerDelayedActRootAdmissionClaimed: true,
          schedulerTimingAdmissionClaimed: true,
          publicSchedulerFlushHelperCompatibilityClaimed: true
        }
      },
      [worker741]: {
        publicCompatibilityClaims: {
          publicReactDomHydrateRootCompatibilityClaimed: true,
          publicReactDomHydrationCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          reactDomHydrateRootAdmissionClaimed: true,
          hydrationAdmissionClaimed: true
        }
      },
      [worker740]: {
        publicCompatibilityClaims: {
          publicNativeWorkerThreadTeardownCompatibilityClaimed: true,
          publicNativeBridgeCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          nativeWorkerThreadTeardownPublicAdmissionClaimed: true,
          nativeWorkerThreadExecutionAdmissionClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_739_745_VIOLATION_STATUS);
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
      `${worker745}.nativeBridgeLoadingClaimed`,
      `${worker745}.nativeBridgeExecutionClaimed`,
      `${worker745}.jsFacadeAdmissionClaimed`,
      `${worker745}.cjsFacadeAdmissionClaimed`,
      `${worker745}.packageCompatibilityClaimed`,
      `${worker740}.nativeWorkerThreadTeardownPublicAdmissionClaimed`
    ],
    gate.nativeJsPackageLeakClaimIds
  );
  assertSubset(
    [
      `${worker742}.publicSchedulerTimingCompatibilityClaimed`,
      `${worker742}.schedulerDelayedActRootAdmissionClaimed`,
      `${worker741}.publicReactDomHydrateRootCompatibilityClaimed`,
      `${worker741}.reactDomHydrateRootAdmissionClaimed`,
      `${worker745}.publicTestRendererSerializationCompatibilityClaimed`,
      `${worker745}.broadMultichildIdentityAdmissionClaimed`
    ],
    gate.publicRendererLeakClaimIds
  );
});

test("private admission 739-745 gate rejects removing carried-forward 737-738 blockers", () => {
  const gate = evaluatePrivateAdmission739745Gate({
    rowOverrides: {
      [worker744]: {
        blockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES.filter(
            (surface) => surface !== "scheduler-task"
          ),
        blockedPublicClaims:
          PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS.filter(
            (claimId) => claimId !== "publicSchedulerTaskCompatibilityClaimed"
          ),
        blockedAdmissionClaimIds:
          PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS.filter(
            (claimId) => claimId !== "schedulerAdmissionClaimed"
          )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_739_745_VIOLATION_STATUS);
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

test("private admission 739-745 gate rejects runtime execution claims in the static ledger", () => {
  const gate = evaluatePrivateAdmission739745Gate({
    rowOverrides: {
      [worker744]: {
        sourceTokenChecksOnly: false,
        manifestEvaluationOnly: false,
        runtimeExecutionClaimed: true,
        ledgerEvaluationMode: "runtime-execution"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_739_745_VIOLATION_STATUS);
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
    nativeTeardownMirror = {},
    hydrateRootPreflight = {},
    schedulerDelayedRoute = {},
    staticLedgerEvidence = {},
    siblingTextIdentityGate = {},
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, privateAdmission);
  assert.equal(row.sourceQueue, "739-745");
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
  assert.deepEqual(row.nativeTeardownMirror, nativeTeardownMirror);
  assert.deepEqual(row.hydrateRootPreflight, hydrateRootPreflight);
  assert.deepEqual(row.schedulerDelayedRoute, schedulerDelayedRoute);
  assert.deepEqual(row.staticLedgerEvidence, staticLedgerEvidence);
  assert.deepEqual(row.siblingTextIdentityGate, siblingTextIdentityGate);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
}

function assertSkippedMetaRow(row, evidenceRoles) {
  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "739-745");
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
    PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES,
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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
    [...PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS].sort(),
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

function createWorkspaceWithMutatedEvidenceFile({
  evidencePath,
  find,
  replace,
  replaceAll = false,
  sliceStart = null,
  sliceEnd = null,
  expectedReplacements = null
}) {
  const root = mkdtempSync(join(tmpdir(), "private-admission-739-745-"));
  const workspaceRoot = findWorkspaceRoot();
  const evidencePaths = new Set(
    [
      ...PRIVATE_ADMISSION_739_745_ROWS,
      ...PRIVATE_ADMISSION_739_745_SKIPPED_ROWS
    ].flatMap((row) => row.evidence).map((evidenceRow) => evidenceRow.path)
  );

  for (const path of evidencePaths) {
    const sourcePath = join(workspaceRoot, path);
    const targetPath = join(root, path);
    mkdirSync(dirname(targetPath), { recursive: true });
    let text = readFileSync(sourcePath, "utf8");
    if (path === evidencePath) {
      const replacement =
        sliceStart === null && sliceEnd === null
          ? replaceInText({ text, find, replace, replaceAll })
          : replaceInSourceSlice({
              text,
              sliceStart,
              sliceEnd,
              find,
              replace,
              replaceAll
            });
      text = replacement.text;
      if (expectedReplacements !== null) {
        assert.equal(replacement.count, expectedReplacements, find);
      }
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
  return {
    text: text.replace(find, replace),
    count: 1
  };
}

function replaceEvery(text, find, replace) {
  assert.equal(text.includes(find), true, find);
  const parts = text.split(find);
  return {
    text: parts.join(replace),
    count: parts.length - 1
  };
}

function replaceInSourceSlice({
  text,
  sliceStart,
  sliceEnd,
  find,
  replace,
  replaceAll
}) {
  const startIndex = sliceStart === null ? 0 : text.indexOf(sliceStart);
  assert.notEqual(startIndex, -1, sliceStart);
  const endSearchIndex =
    sliceStart === null ? startIndex : startIndex + sliceStart.length;
  const endIndex =
    sliceEnd === null ? text.length : text.indexOf(sliceEnd, endSearchIndex);
  assert.notEqual(endIndex, -1, sliceEnd);

  const before = text.slice(0, startIndex);
  const sourceSlice = text.slice(startIndex, endIndex);
  const after = text.slice(endIndex);
  const replacement = replaceInText({
    text: sourceSlice,
    find,
    replace,
    replaceAll
  });

  return {
    text: before + replacement.text + after,
    count: replacement.count
  };
}

function replaceInText({ text, find, replace, replaceAll }) {
  return replaceAll
    ? replaceEvery(text, find, replace)
    : replaceFirst(text, find, replace);
}
