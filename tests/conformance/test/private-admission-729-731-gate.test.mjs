import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_729_731_GATE_STATUS,
  PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT,
  PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
  PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS,
  PRIVATE_ADMISSION_729_731_ROWS,
  PRIVATE_ADMISSION_729_731_SKIPPED_ROWS,
  PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_729_731_VIOLATION_STATUS,
  PRIVATE_ADMISSION_729_731_WORKERS,
  evaluatePrivateAdmission729731Gate
} from "../src/private-admission-729-731-gate.mjs";

const worker730 =
  "worker-730-test-renderer-unmount-native-cleanup-evidence";
const worker731 = "worker-731-tojson-nested-update-native-identity";
const skippedWorker729 =
  "worker-729-package-private-admission-audit-727-728";

const expected729731Workers = [worker730, worker731];
const expected729731SkippedWorkers = [skippedWorker729];

const requiredBroadBlockedSurfaces = [
  "package",
  "package-surface",
  "test-renderer",
  "test-renderer-public-serialization",
  "test-renderer-to-json",
  "test-renderer-to-tree",
  "test-renderer-root",
  "test-renderer-update",
  "test-renderer-unmount",
  "test-renderer-testinstance",
  "test-renderer-native-addon-loading",
  "test-renderer-native-addon-execution",
  "test-renderer-native-bridge",
  "test-renderer-native-bridge-execution",
  "act",
  "react-dom",
  "react-dom-root",
  "scheduler",
  "hydration",
  "events",
  "refs",
  "resources",
  "forms",
  "controlled-inputs",
  "test-renderer-multichild-identity-admission",
  "test-renderer-multichild-sibling-identity-admission",
  "test-renderer-full-unmount-identity-admission"
];

const requiredPublicClaimIds = [
  "publicPackageCompatibilityClaimed",
  "publicPackageSurfaceCompatibilityClaimed",
  "publicTestRendererCompatibilityClaimed",
  "publicTestRendererSerializationCompatibilityClaimed",
  "publicTestRendererToJSONCompatibilityClaimed",
  "publicTestRendererToTreeCompatibilityClaimed",
  "publicTestRendererRootCompatibilityClaimed",
  "publicTestRendererUpdateCompatibilityClaimed",
  "publicTestRendererUnmountCompatibilityClaimed",
  "publicTestRendererTestInstanceCompatibilityClaimed",
  "publicTestRendererNativeAddonLoadingCompatibilityClaimed",
  "publicTestRendererNativeAddonExecutionCompatibilityClaimed",
  "publicTestRendererNativeBridgeCompatibilityClaimed",
  "publicTestRendererNativeBridgeExecutionClaimed",
  "publicActCompatibilityClaimed",
  "publicReactDomCompatibilityClaimed",
  "publicReactDomRootCompatibilityClaimed",
  "publicSchedulerCompatibilityClaimed",
  "publicHydrationCompatibilityClaimed",
  "publicEventCompatibilityClaimed",
  "publicRefCompatibilityClaimed",
  "publicResourceCompatibilityClaimed",
  "publicFormCompatibilityClaimed",
  "publicControlledInputCompatibilityClaimed"
];

test("private admission 729-731 manifest records one skipped meta row and two accepted private diagnostics", () => {
  assert.deepEqual(PRIVATE_ADMISSION_729_731_WORKERS, expected729731Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_729_731_ROWS.map((row) => row.workerId),
    expected729731Workers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS,
    expected729731SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_729_731_SKIPPED_ROWS.map((row) => row.workerId),
    expected729731SkippedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_729_731_ROWS.length, 2);
  assert.equal(PRIVATE_ADMISSION_729_731_SKIPPED_ROWS.length, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_729_731_WORKERS).size, 2);
  assert.equal(new Set(PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS).size, 1);
  assert.equal(PRIVATE_ADMISSION_729_731_WORKERS.includes(skippedWorker729), false);

  for (const surface of requiredBroadBlockedSurfaces) {
    assert.equal(
      PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES.includes(surface),
      true,
      surface
    );
  }
  for (const claimId of requiredPublicClaimIds) {
    assert.equal(
      PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS.includes(claimId),
      true,
      claimId
    );
  }
  assert.deepEqual(PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS, [
    "nativeExecutionAdmissionClaimed",
    "publicUnmountAdmissionClaimed",
    "unmountIdentityAdmissionClaimed",
    "jsFacadeAdmissionClaimed",
    "cjsFacadeAdmissionClaimed",
    "siblingSnapshotAdmissionClaimed",
    "toTreePromotionClaimed",
    "publicCompatibilityPromotionClaimed"
  ]);
});

test("private admission 729-731 gate recognizes accepted private evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission729731Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.blockerContextRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_729_731_WORKERS);
  assert.deepEqual(gate.skippedWorkers, PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_729_731_WORKERS);
  assert.deepEqual(
    gate.recognizedSkippedWorkerIds,
    PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS
  );
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(gate.manifest.missingSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateSkippedWorkerIds, []);

  const unmountCleanupRow = gate.rowsByWorker[worker730];
  assertPrivateDiagnosticRow(unmountCleanupRow, {
    primaryCompatibilityArea:
      "test-renderer-unmount-native-cleanup-ref-passive-host-evidence",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker730],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker730],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker730],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[worker730],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[worker730],
    evidenceRoles: [
      "worker-575-unmount-deletion-commit-dependency",
      "worker-612-unmount-native-bridge-admission-dependency",
      "worker-638-unmount-cleanup-handoff-dependency",
      "worker-725-update-identity-blocker-context",
      "worker-726-update-native-identity-blocker-context",
      "worker-728-unmount-identity-guard-blocker-context",
      "worker-730-unmount-cleanup-report",
      "worker-730-unmount-cleanup-rust-proof"
    ]
  });
  assert.equal(
    unmountCleanupRow.acceptedDiagnosticIds.includes(
      "test-renderer-unmount-identity-admission"
    ),
    false
  );
  assert.equal(
    unmountCleanupRow.blockedAdmissionClaims.nativeExecutionAdmissionClaimed,
    false
  );
  assert.equal(
    unmountCleanupRow.blockedAdmissionClaims.unmountIdentityAdmissionClaimed,
    false
  );

  const nestedIdentityRow = gate.rowsByWorker[worker731];
  assertPrivateDiagnosticRow(nestedIdentityRow, {
    primaryCompatibilityArea:
      "test-renderer-tojson-nested-update-native-identity-admission",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker731],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker731],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker731],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[worker731],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[worker731],
    evidenceRoles: [
      "worker-577-nested-tojson-row-dependency",
      "worker-720-base-finished-work-identity-dependency",
      "worker-725-update-finished-work-identity-dependency",
      "worker-726-update-native-identity-dependency-and-blocker",
      "worker-728-unmount-identity-guard-blocker-context",
      "worker-731-nested-tojson-identity-report",
      "worker-731-nested-tojson-identity-rust-proof"
    ]
  });
  assert.equal(
    nestedIdentityRow.acceptedDiagnosticIds.some((diagnosticId) =>
      diagnosticId.includes("sibling")
    ),
    false
  );
  assert.equal(
    nestedIdentityRow.acceptedDiagnosticIds.some((diagnosticId) =>
      diagnosticId.includes("totree")
    ),
    false
  );
  assert.equal(
    nestedIdentityRow.blockedAdmissionClaims.siblingSnapshotAdmissionClaimed,
    false
  );
  assert.equal(nestedIdentityRow.blockedAdmissionClaims.toTreePromotionClaimed, false);

  for (const row of [...gate.rows, ...gate.skippedRows]) {
    assertNoPublicOrAdmissionClaims(row);
  }
});

test("private admission 729-731 gate recognizes Worker 729 as non-runtime skip meta", () => {
  const gate = evaluatePrivateAdmission729731Gate();
  const row = gate.skippedRowsByWorker[skippedWorker729];

  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "729-731");
  assert.equal(row.runtimeCapabilityAdded, false);
  assert.equal(row.recognized, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "not-applicable");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, []);
  assert.deepEqual(row.dependencyWorkerIds, []);
  assert.deepEqual(row.dependencyDiagnosticIds, []);
  assert.deepEqual(row.blockerContextWorkerIds, []);
  assert.deepEqual(row.blockerContextDiagnosticIds, []);
  assert.equal(row.skipReason.endsWith("no-new-runtime-capability"), true);
  assertNoPublicOrAdmissionClaims(row);
});

test("private admission 729-731 gate rejects missing or unknown accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        acceptedDiagnosticIds: []
      },
      [worker731]: {
        acceptedDiagnosticIds: [
          ...PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker731],
          "unexpected-public-or-sibling-admission"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-id-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedAcceptedDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker730],
          actualAcceptedDiagnosticIds: []
        },
        {
          workerId: worker731,
          expectedAcceptedDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker731],
          actualAcceptedDiagnosticIds: [
            ...PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[
              worker731
            ],
            "unexpected-public-or-sibling-admission"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects accepted diagnostic arrays with hidden extra own keys", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        acceptedDiagnosticIds: withHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker730],
          "hidden-unexpected-private-diagnostic"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assertViolationIds(gate, ["accepted-private-diagnostic-id-mismatch"]);
});

test("private admission 729-731 gate rejects self-consistent proxy diagnostic arrays", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        acceptedDiagnosticIds: withCoordinatedHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker730],
          "coordinated-hidden-private-diagnostic"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assertViolationIds(gate, ["accepted-private-diagnostic-id-mismatch"]);
});

test("private admission 729-731 gate rejects sanitizer-discovered stateful proxy diagnostic arrays", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        acceptedDiagnosticIds: withStatefulHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker730],
          "stateful-hidden-private-diagnostic"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.rowsByWorker[worker730].recognized, true);
  assert.deepEqual(gate.reportArrayShapeMismatches, [
    {
      workerId: worker730,
      field: "acceptedDiagnosticIds",
      reason: "acceptedDiagnosticIds-array-next-index-visible"
    }
  ]);
  assert.deepEqual(gate.violations, [
    {
      id: "private-admission-report-array-shape-mismatch",
      rows: [
        {
          workerId: worker730,
          field: "acceptedDiagnosticIds",
          reason: "acceptedDiagnosticIds-array-next-index-visible"
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects sanitizer-discovered array read failures", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        dependencyWorkerIds: withStatefulThrowingNextIndexArray(
          PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker730],
          "sanitizer next-index read blocked"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.rowsByWorker[worker730].recognized, true);
  assert.deepEqual(gate.reportArrayShapeMismatches, [
    {
      workerId: worker730,
      field: "dependencyWorkerIds",
      reason:
        "dependencyWorkerIds-array-unreadable: sanitizer next-index read blocked"
    }
  ]);
  assert.deepEqual(gate.violations, [
    {
      id: "private-admission-report-array-shape-mismatch",
      rows: [
        {
          workerId: worker730,
          field: "dependencyWorkerIds",
          reason:
            "dependencyWorkerIds-array-unreadable: sanitizer next-index read blocked"
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate reports unreadable diagnostic arrays", () => {
  let gate;
  assert.doesNotThrow(() => {
    gate = evaluatePrivateAdmission729731Gate({
      rowOverrides: {
        [worker730]: {
          acceptedDiagnosticIds: withUnreadableArray(
            PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker730]
          )
        }
      }
    });
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assertViolationIds(gate, ["accepted-private-diagnostic-id-mismatch"]);
});

test("private admission 729-731 gate rejects unrecognized accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: [worker730]
    }
  ]);
});

test("private admission 729-731 gate rejects forged recognized overrides over missing evidence", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        recognized: true,
        evidence: withMissingEvidenceToken(
          PRIVATE_ADMISSION_729_731_ROWS[0],
          "worker-730-unmount-cleanup-rust-proof",
          "missing-worker-989-unmount-cleanup-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assert.equal(gate.rowsByWorker[worker730].evidenceRecognized, false);
  assertViolationIds(gate, [
    "private-admission-evidence-token-missing",
    "required-private-diagnostic-not-recognized"
  ]);

  const evidenceViolation = gate.violations.find(
    (violation) => violation.id === "private-admission-evidence-token-missing"
  );
  assert.notEqual(evidenceViolation, undefined);
  assert.deepEqual(evidenceViolation.rows, [
    {
      workerId: worker730,
      role: "worker-730-unmount-cleanup-rust-proof",
      path: "crates/fast-react-test-renderer/src/lib.rs",
      missingTokens: ["missing-worker-989-unmount-cleanup-token"],
      readError: null
    }
  ]);
});

test("private admission 729-731 gate rejects empty required evidence arrays", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        recognized: true,
        evidence: []
      }
    }
  });

  assertEvidenceContextFailure(gate, worker730);
  assertEvidenceContextReasons(gate, worker730, [
    "required-evidence-role-missing"
  ]);
});

test("private admission 729-731 gate rejects proxy-hidden required evidence arrays", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        recognized: true,
        evidence: hideArrayContents(PRIVATE_ADMISSION_729_731_ROWS[0].evidence)
      }
    }
  });

  assertEvidenceContextFailure(gate, worker730);
  assertEvidenceContextReasons(gate, worker730, [
    "evidence-array-not-frozen"
  ]);
});

test("private admission 729-731 gate rejects evidence arrays with hidden extra own keys", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        recognized: true,
        evidence: withHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_ROWS[0].evidence,
          {
            role: "hidden-extra-evidence-row",
            path: "hidden-extra-evidence.js",
            tokens: ["hidden-extra-token"]
          }
        )
      }
    }
  });

  assertEvidenceContextFailure(gate, worker730);
  assertEvidenceContextReasons(gate, worker730, [
    "evidence-array-not-frozen"
  ]);
});

test("private admission 729-731 gate rejects removed required evidence rows", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        recognized: true,
        evidence: withoutEvidenceRole(
          PRIVATE_ADMISSION_729_731_ROWS[0],
          "worker-730-unmount-cleanup-rust-proof"
        )
      }
    }
  });

  assertEvidenceContextFailure(gate, worker730);
  assertEvidenceContextReasons(gate, worker730, [
    "required-evidence-role-missing"
  ]);
  const contextViolation = gate.violations.find(
    (violation) => violation.id === "private-admission-evidence-context-mismatch"
  );
  assert.equal(
    contextViolation.rows.some(
      (row) => row.role === "worker-730-unmount-cleanup-rust-proof"
    ),
    true
  );
});

test("private admission 729-731 gate rejects empty required token arrays", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        recognized: true,
        evidence: withEvidenceTokens(
          PRIVATE_ADMISSION_729_731_ROWS[1],
          "worker-731-nested-tojson-identity-rust-proof",
          freezeTestArray([])
        )
      }
    }
  });

  assertEvidenceContextFailure(gate, worker731);
  assertEvidenceContextReasons(gate, worker731, [
    "evidence-token-array-empty",
    "evidence-token-list-mismatch"
  ]);
});

test("private admission 729-731 gate rejects proxy-hidden required token arrays", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        recognized: true,
        evidence: withEvidenceTokens(
          PRIVATE_ADMISSION_729_731_ROWS[1],
          "worker-731-nested-tojson-identity-rust-proof",
          hideArrayContents(
            PRIVATE_ADMISSION_729_731_ROWS[1].evidence.find(
              (row) => row.role === "worker-731-nested-tojson-identity-rust-proof"
            ).tokens
          )
        )
      }
    }
  });

  assertEvidenceContextFailure(gate, worker731);
  assertEvidenceContextReasons(gate, worker731, [
    "tokens-array-not-frozen"
  ]);
});

test("private admission 729-731 gate rejects token arrays with hidden extra own keys", () => {
  const evidenceRow = PRIVATE_ADMISSION_729_731_ROWS[1].evidence.find(
    (row) => row.role === "worker-731-nested-tojson-identity-rust-proof"
  );
  assert.notEqual(evidenceRow, undefined);

  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        recognized: true,
        evidence: withEvidenceTokens(
          PRIVATE_ADMISSION_729_731_ROWS[1],
          "worker-731-nested-tojson-identity-rust-proof",
          withHiddenExtraArray(
            evidenceRow.tokens,
            "missing-worker-989-hidden-token"
          )
        )
      }
    }
  });

  assertEvidenceContextFailure(gate, worker731);
  assertEvidenceContextReasons(gate, worker731, [
    "tokens-array-not-frozen"
  ]);
});

test("private admission 729-731 gate rejects descriptor/get-mismatched evidence fields", () => {
  const evidenceRow = PRIVATE_ADMISSION_729_731_ROWS[1].evidence.find(
    (row) => row.role === "worker-731-nested-tojson-identity-rust-proof"
  );
  assert.notEqual(evidenceRow, undefined);

  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        recognized: true,
        evidence: withEvidenceRow(
          PRIVATE_ADMISSION_729_731_ROWS[1],
          "worker-731-nested-tojson-identity-rust-proof",
          (row) =>
            withDescriptorGetMismatchVisibleFields(
              row,
              {
                tokens: freezeTestArray([
                  ...evidenceRow.tokens,
                  "descriptor-only-token"
                ])
              },
              {
                tokens: evidenceRow.tokens
              }
            )
        )
      }
    }
  });

  assertEvidenceContextFailure(gate, worker731);
  assertEvidenceContextReasons(gate, worker731, [
    "evidence-tokens-descriptor-get-mismatch",
    "required-evidence-role-missing"
  ]);
});

test("private admission 729-731 gate rejects unknown top-level compatibility aliases", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        publicPackageCompatibilityClaimed: true,
        nativeExecutionAdmissionClaimed: true,
        packageCompatibilityClaimed: true,
        fastReactBehaviorCompatible: true,
        fastReactBehaviorCompatibility: true,
        fastReactBehaviorCompatibilityClaimed: true,
        evidence: withEvidenceCompatibilityAliases(
          PRIVATE_ADMISSION_729_731_ROWS[1],
          "worker-731-nested-tojson-identity-report",
          {
            nativeExecutionAdmissionClaimed: true,
            fastReactBehaviorCompatible: true,
            fastReactBehaviorCompatibility: true,
            fastReactBehaviorCompatibilityClaimed: true
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  for (const key of [
    "publicPackageCompatibilityClaimed",
    "nativeExecutionAdmissionClaimed",
    "packageCompatibilityClaimed",
    "fastReactBehaviorCompatible",
    "fastReactBehaviorCompatibility",
    "fastReactBehaviorCompatibilityClaimed"
  ]) {
    assert.equal(
      claimViolation.rows.some(
        (row) => row.location === "row-override" && row.key === key
      ),
      true,
      key
    );
  }
  assert.equal(
    claimViolation.rows.some(
      (row) =>
        row.location === "evidence" &&
        row.key === "nativeExecutionAdmissionClaimed"
    ),
    true
  );
  for (const key of [
    "fastReactBehaviorCompatible",
    "fastReactBehaviorCompatibility",
    "fastReactBehaviorCompatibilityClaimed"
  ]) {
    assert.equal(
      claimViolation.rows.some(
        (row) => row.location === "evidence" && row.key === key
      ),
      true,
      key
    );
  }
});

test("private admission 729-731 gate rejects non-enumerable broad compatible aliases", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withNonEnumerableCompatibilityAlias(
        {
          recognized: true,
          evidence: withNonEnumerableEvidenceCompatibilityAlias(
            PRIVATE_ADMISSION_729_731_ROWS[0],
            "worker-730-unmount-cleanup-report",
            "fastReactBehaviorCompatibilityClaimed",
            true
          )
        },
        "fastReactBehaviorCompatible",
        true
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  assert.equal(
    claimViolation.rows.some(
      (row) =>
        row.location === "row-override" &&
        row.key === "fastReactBehaviorCompatible"
    ),
    true
  );
  assert.equal(
    claimViolation.rows.some(
      (row) =>
        row.location === "evidence" &&
        row.key === "fastReactBehaviorCompatibilityClaimed"
    ),
    true
  );
});

test("private admission 729-731 gate rejects proxy-hidden broad compatible aliases", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withProxyHiddenCompatibilityAliases(
        {
          recognized: true,
          evidence: withProxyHiddenEvidenceCompatibilityAliases(
            PRIVATE_ADMISSION_729_731_ROWS[1],
            "worker-731-nested-tojson-identity-report",
            {
              fastReactCompatible: true,
              fastReactBehaviorCompatible: true,
              fastReactBehaviorCompatibilityClaimed: true,
              nativeExecutionClaimed: true,
              publicPackageClaimed: true,
              reactCompatible: true,
              testRendererClaimed: true,
              publicTestRendererToJSONCompatible: true
            }
          )
        },
        {
          fastReactCompatible: true,
          fastReactBehaviorCompatible: true,
          fastReactBehaviorCompatibility: true,
          nativeExecutionClaimed: true,
          publicPackageClaimed: true,
          reactCompatible: true,
          testRendererClaimed: true,
          publicTestRendererToJSONCompatible: true
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  for (const key of [
    "fastReactCompatible",
    "fastReactBehaviorCompatible",
    "fastReactBehaviorCompatibility",
    "nativeExecutionClaimed",
    "publicPackageClaimed",
    "reactCompatible",
    "testRendererClaimed",
    "publicTestRendererToJSONCompatible"
  ]) {
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.location === "row-override" &&
          row.key === key &&
          row.reason === "hidden-compatibility-claim-key"
      ),
      true,
      key
    );
  }
  for (const key of [
    "fastReactCompatible",
    "fastReactBehaviorCompatible",
    "fastReactBehaviorCompatibilityClaimed",
    "nativeExecutionClaimed",
    "publicPackageClaimed",
    "reactCompatible",
    "testRendererClaimed",
    "publicTestRendererToJSONCompatible"
  ]) {
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.location === "evidence" &&
          row.key === key &&
          row.reason === "hidden-compatibility-claim-key"
      ),
      true,
      key
    );
  }
});

test("private admission 729-731 gate rejects proxy-hidden public package and native compatible aliases", () => {
  const hiddenAliases = {
    publicPackageCompatible: true,
    publicPackageCompatibility: true,
    nativeExecutionCompatible: true
  };
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withProxyHiddenCompatibilityAliases(
        {
          recognized: true,
          evidence: withProxyHiddenEvidenceCompatibilityAliases(
            PRIVATE_ADMISSION_729_731_ROWS[0],
            "worker-730-unmount-cleanup-report",
            hiddenAliases
          )
        },
        hiddenAliases
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  for (const key of Object.keys(hiddenAliases)) {
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.location === "row-override" &&
          row.key === key &&
          row.reason === "hidden-compatibility-claim-key"
      ),
      true,
      key
    );
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.location === "evidence" &&
          row.key === key &&
          row.reason === "hidden-compatibility-claim-key"
      ),
      true,
      key
    );
  }
});

test("private admission 729-731 gate rejects descriptor-hidden compatible aliases when proxy get returns undefined", () => {
  const hiddenAliases = {
    fastReactBehaviorCompatible: true,
    publicPackageCompatible: true,
    nativeExecutionCompatible: true,
    packageCompatibilityClaimed: true
  };
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withOwnKeysHiddenDescriptorFields(
        {
          recognized: true,
          evidence: withDescriptorHiddenEvidenceCompatibilityAliases(
            PRIVATE_ADMISSION_729_731_ROWS[1],
            "worker-731-nested-tojson-identity-report",
            hiddenAliases
          )
        },
        hiddenAliases
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  for (const key of Object.keys(hiddenAliases)) {
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.location === "row-override" &&
          row.key === key &&
          row.reason === "hidden-compatibility-claim-key"
      ),
      true,
      key
    );
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.location === "evidence" &&
          row.key === key &&
          row.reason === "hidden-compatibility-claim-key"
      ),
      true,
      key
    );
  }
});

test("private admission 729-731 gate rejects function proxy hidden compatible aliases", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withFunctionProxyHiddenCompatibilityAliases({
        fastReactBehaviorCompatible: true
      })
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  assert.equal(
    claimViolation.rows.some(
      (row) =>
        row.location === "row-override" &&
        row.key === "fastReactBehaviorCompatible" &&
        row.reason === "hidden-compatibility-claim-key"
    ),
    true
  );
});

test("private admission 729-731 gate rejects hidden nested public compatibility aliases", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: withNonEnumerableCompatibilityAlias(
          {},
          "fastReactBehaviorCompatible",
          true
        )
      },
      [worker731]: {
        publicCompatibilityClaims: withProxyHiddenCompatibilityAliases(
          {},
          {
            publicPackageCompatible: true,
            publicPackageCompatibility: true
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized",
    "public-compatibility-claim-detected",
    "public-compatibility-claim-key-mismatch"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  assert.equal(
    claimViolation.rows.some(
      (row) =>
        row.location === "row-override.publicCompatibilityClaims" &&
        row.key === "fastReactBehaviorCompatible" &&
        row.reason === "unknown-compatibility-claim-key"
    ),
    true
  );
  for (const key of ["publicPackageCompatible", "publicPackageCompatibility"]) {
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.location === "row-override.publicCompatibilityClaims" &&
          row.key === key &&
          row.reason === "hidden-compatibility-claim-key"
      ),
      true,
      key
    );
  }
  const publicViolation = gate.violations.find(
    (violation) => violation.id === "public-compatibility-claim-detected"
  );
  assert.notEqual(publicViolation, undefined);
  for (const claimId of [
    `${worker730}.fastReactBehaviorCompatible`,
    `${worker731}.publicPackageCompatible`,
    `${worker731}.publicPackageCompatibility`
  ]) {
    assert.equal(publicViolation.claimIds.includes(claimId), true, claimId);
  }
});

test("private admission 729-731 gate rejects hidden nested blocked admission aliases", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        blockedAdmissionClaims: withNonEnumerableCompatibilityAlias(
          {},
          "nativeExecutionAdmissionClaimed",
          true
        )
      },
      [worker731]: {
        blockedAdmissionClaims: withProxyHiddenCompatibilityAliases(
          {},
          {
            nativeExecutionAdmissionClaimed: true,
            nativeExecutionCompatible: true
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized",
    "blocked-admission-claim-detected"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  assert.equal(
    claimViolation.rows.some(
      (row) =>
        row.location === "row-override.blockedAdmissionClaims" &&
        row.key === "nativeExecutionCompatible" &&
        row.reason === "hidden-compatibility-claim-key"
    ),
    true
  );
  const blockedViolation = gate.violations.find(
    (violation) => violation.id === "blocked-admission-claim-detected"
  );
  assert.notEqual(blockedViolation, undefined);
  for (const claimId of [
    `${worker730}.nativeExecutionAdmissionClaimed`,
    `${worker731}.nativeExecutionAdmissionClaimed`,
    `${worker731}.nativeExecutionCompatible`
  ]) {
    assert.equal(blockedViolation.claimIds.includes(claimId), true, claimId);
  }
});

test("private admission 729-731 gate rejects proxy-hidden evidence claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        recognized: true,
        evidence: withProxyHiddenEvidenceCompatibilityAliases(
          PRIVATE_ADMISSION_729_731_ROWS[1],
          "worker-731-nested-tojson-identity-report",
          {
            admissionClaims: {
              nativeExecutionAdmissionClaimed: true
            },
            claims: {
              publicPackageCompatibilityClaimed: true
            },
            compatibilityClaims: {
              publicPackageCompatibilityClaimed: true
            },
            evidenceClaims: {
              publicPackageCompatibilityClaimed: true
            },
            publicClaims: {
              publicPackageCompatibilityClaimed: true
            },
            publicCompatibilityClaims: {
              publicPackageCompatibilityClaimed: true
            },
            blockedAdmissionClaims: {
              nativeExecutionAdmissionClaimed: true
            }
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  for (const key of [
    "admissionClaims",
    "claims",
    "compatibilityClaims",
    "evidenceClaims",
    "publicClaims",
    "publicCompatibilityClaims",
    "blockedAdmissionClaims"
  ]) {
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.location === "evidence" &&
          row.key === key &&
          row.reason === "hidden-compatibility-claim-key"
      ),
      true,
      key
    );
  }
});

test("private admission 729-731 gate rejects ownKeys-hidden descriptor public claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withOwnKeysHiddenDescriptorClaimContainers(
        {
          recognized: true
        },
        {
          publicCompatibilityClaims: {
            publicPackageCompatibilityClaimed: true
          }
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assertHiddenRowOverrideReadFailure(
    gate,
    worker730,
    "publicCompatibilityClaims",
    "hidden-compatibility-claim-descriptor-get-mismatch"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "public-compatibility-claim-detected"
  ]);
});

test("private admission 729-731 gate rejects ownKeys-hidden descriptor blocked admission claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withOwnKeysHiddenDescriptorClaimContainers(
        {
          recognized: true
        },
        {
          blockedAdmissionClaims: {
            nativeExecutionAdmissionClaimed: true
          }
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assertHiddenRowOverrideReadFailure(
    gate,
    worker731,
    "blockedAdmissionClaims",
    "hidden-compatibility-claim-descriptor-get-mismatch"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "blocked-admission-claim-detected"
  ]);
});

test("private admission 729-731 gate rejects descriptor-exposed nested public claim containers when proxy get returns undefined", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withDescriptorExposedClaimContainers(
        {
          recognized: true
        },
        {
          publicCompatibilityClaims: {
            publicPackageCompatibilityClaimed: true
          }
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assertHiddenRowOverrideReadFailure(
    gate,
    worker730,
    "publicCompatibilityClaims",
    "hidden-compatibility-claim-descriptor-get-mismatch"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "public-compatibility-claim-detected"
  ]);
});

test("private admission 729-731 gate rejects descriptor-exposed nested blocked admission claim containers when proxy get returns undefined", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withDescriptorExposedClaimContainers(
        {
          recognized: true
        },
        {
          blockedAdmissionClaims: {
            nativeExecutionAdmissionClaimed: true
          }
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assertHiddenRowOverrideReadFailure(
    gate,
    worker731,
    "blockedAdmissionClaims",
    "hidden-compatibility-claim-descriptor-get-mismatch"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "blocked-admission-claim-detected"
  ]);
});

test("private admission 729-731 gate rejects descriptor/get-mismatched top-level claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withDescriptorGetMismatchVisibleFields(
        {
          recognized: true
        },
        {
          publicCompatibilityClaims: undefined
        },
        {
          publicCompatibilityClaims: {
            publicPackageCompatibilityClaimed: true
          }
        }
      ),
      [worker731]: withDescriptorGetMismatchVisibleFields(
        {
          recognized: true
        },
        {
          blockedAdmissionClaims: undefined
        },
        {
          blockedAdmissionClaims: {
            nativeExecutionAdmissionClaimed: true
          }
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assertHiddenRowOverrideReadFailure(
    gate,
    worker730,
    "publicCompatibilityClaims",
    "hidden-compatibility-claim-descriptor-get-mismatch"
  );
  assertHiddenRowOverrideReadFailure(
    gate,
    worker731,
    "blockedAdmissionClaims",
    "hidden-compatibility-claim-descriptor-get-mismatch"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "public-compatibility-claim-detected",
    "blocked-admission-claim-detected"
  ]);
});

test("private admission 729-731 gate rejects descriptor/live-get throwing row fields", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withDescriptorGetThrowingVisibleFields(
        {
          recognized: true
        },
        {
          acceptedDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker730],
          publicCompatibilityClaims: {
            publicPackageCompatibilityClaimed: false
          }
        }
      ),
      [worker731]: withDescriptorGetThrowingVisibleFields(
        {
          recognized: true
        },
        {
          blockedAdmissionClaims: {
            nativeExecutionAdmissionClaimed: false
          }
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assert.deepEqual(gate.rowsByWorker[worker730].acceptedDiagnosticIds, []);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  for (const [workerId, key] of [
    [worker730, "acceptedDiagnosticIds"],
    [worker730, "publicCompatibilityClaims"],
    [worker731, "blockedAdmissionClaims"]
  ]) {
    assertHiddenRowOverrideReadFailure(
      gate,
      workerId,
      key,
      "hidden-compatibility-claim-unreadable:"
    );
  }
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "accepted-private-diagnostic-id-mismatch",
    "public-compatibility-claim-detected",
    "blocked-admission-claim-detected"
  ]);
});

test("private admission 729-731 gate rejects descriptor/get-mismatched benign top-level claim containers", () => {
  for (const withMismatch of [
    withDescriptorGetMismatchVisibleFields,
    withAccessorDescriptorGetMismatchVisibleFields
  ]) {
    const gate = evaluatePrivateAdmission729731Gate({
      rowOverrides: {
        [worker730]: withMismatch(
          {
            recognized: true
          },
          {
            publicCompatibilityClaims: {
              publicPackageCompatibilityClaimed: false
            }
          },
          {
            publicCompatibilityClaims: {
              publicPackageCompatibilityClaimed: true
            }
          }
        ),
        [worker731]: withMismatch(
          {
            recognized: true
          },
          {
            blockedAdmissionClaims: {
              nativeExecutionAdmissionClaimed: false
            }
          },
          {
            blockedAdmissionClaims: {
              nativeExecutionAdmissionClaimed: true
            }
          }
        )
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.compatibilityClaimed, true);
    assert.equal(gate.publicCompatibilityClaimed, true);
    assert.equal(gate.blockedAdmissionClaimsRecognized, false);
    assert.equal(gate.rowsByWorker[worker730].recognized, false);
    assert.equal(gate.rowsByWorker[worker731].recognized, false);
    assert.equal(
      gate.rowsByWorker[worker730].publicCompatibilityClaims
        .publicPackageCompatibilityClaimed,
      true
    );
    assert.equal(
      gate.rowsByWorker[worker731].blockedAdmissionClaims
        .nativeExecutionAdmissionClaimed,
      true
    );
    assertHiddenRowOverrideReadFailure(
      gate,
      worker730,
      "publicCompatibilityClaims",
      "hidden-compatibility-claim-descriptor-get-mismatch"
    );
    assertHiddenRowOverrideReadFailure(
      gate,
      worker731,
      "blockedAdmissionClaims",
      "hidden-compatibility-claim-descriptor-get-mismatch"
    );
    assertViolationIds(gate, [
      "hidden-row-override-field-unreadable",
      "required-private-diagnostic-not-recognized",
      "public-compatibility-claim-detected",
      "blocked-admission-claim-detected"
    ]);
  }
});

test("private admission 729-731 gate rejects descriptor/get-mismatched blocklist row fields", () => {
  for (const withMismatch of [
    withDescriptorGetMismatchVisibleFields,
    withAccessorDescriptorGetMismatchVisibleFields
  ]) {
    for (const getFields of [
      {
        blockedPublicCompatibilitySurfaces: [],
        blockedPublicClaims: [],
        blockedAdmissionClaimIds: []
      },
      {
        blockedPublicCompatibilitySurfaces: undefined,
        blockedPublicClaims: undefined,
        blockedAdmissionClaimIds: undefined
      }
    ]) {
      const gate = evaluatePrivateAdmission729731Gate({
        rowOverrides: {
          [worker730]: withMismatch(
            {
              recognized: true
            },
            {
              blockedPublicCompatibilitySurfaces:
                PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
              blockedPublicClaims:
                PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
              blockedAdmissionClaimIds:
                PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS
            },
            getFields
          )
        }
      });

      assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
      assert.equal(gate.privateDiagnosticsRecognized, false);
      assert.equal(gate.blockedPublicSurfacesRecognized, false);
      assert.equal(gate.blockedPublicClaimsRecognized, false);
      assert.equal(gate.blockedAdmissionClaimsRecognized, false);
      assert.equal(gate.rowsByWorker[worker730].recognized, false);
      assert.deepEqual(
        gate.rowsByWorker[worker730].blockedPublicCompatibilitySurfaces,
        []
      );
      assert.deepEqual(gate.rowsByWorker[worker730].blockedPublicClaims, []);
      assert.deepEqual(gate.rowsByWorker[worker730].blockedAdmissionClaimIds, []);
      for (const key of [
        "blockedPublicCompatibilitySurfaces",
        "blockedPublicClaims",
        "blockedAdmissionClaimIds"
      ]) {
        assertHiddenRowOverrideReadFailure(
          gate,
          worker730,
          key,
          "hidden-compatibility-claim-descriptor-get-mismatch"
        );
      }
      assertViolationIds(gate, [
        "hidden-row-override-field-unreadable",
        "required-private-diagnostic-not-recognized",
        "blocked-public-compatibility-surface-mismatch",
        "blocked-public-claim-mismatch",
        "blocked-admission-claim-mismatch"
      ]);
    }
  }
});

test("private admission 729-731 gate rejects descriptor/get-mismatched metadata row fields", () => {
  for (const withMismatch of [
    withDescriptorGetMismatchVisibleFields,
    withAccessorDescriptorGetMismatchVisibleFields
  ]) {
    const gate = evaluatePrivateAdmission729731Gate({
      rowOverrides: {
        [worker730]: withMismatch(
          {
            recognized: true
          },
          {
            runtimeCapabilityAdded: true,
            privateEvidenceOnly: true
          },
          {
            runtimeCapabilityAdded: false,
            privateEvidenceOnly: false
          }
        )
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.rowsByWorker[worker730].recognized, false);
    assert.equal(gate.rowsByWorker[worker730].runtimeCapabilityAdded, true);
    assert.equal(gate.rowsByWorker[worker730].privateEvidenceOnly, false);
    for (const key of ["runtimeCapabilityAdded", "privateEvidenceOnly"]) {
      assertHiddenRowOverrideReadFailure(
        gate,
        worker730,
        key,
        "hidden-compatibility-claim-descriptor-get-mismatch"
      );
    }
    assertViolationIds(gate, [
      "hidden-row-override-field-unreadable",
      "required-private-diagnostic-not-recognized",
      "private-admission-evidence-scope-mismatch"
    ]);
  }
});

test("private admission 729-731 gate rejects descriptor/get-mismatched nested claim keys", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: withDescriptorGetMismatchVisibleFields(
          {},
          {
            publicPackageCompatibilityClaimed: false
          },
          {
            publicPackageCompatibilityClaimed: true
          }
        )
      },
      [worker731]: {
        blockedAdmissionClaims: withDescriptorGetMismatchVisibleFields(
          {},
          {
            nativeExecutionAdmissionClaimed: false
          },
          {
            nativeExecutionAdmissionClaimed: true
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assert.deepEqual(gate.violations, [
    {
      id: "public-compatibility-claim-detected",
      claimIds: [`${worker730}.publicPackageCompatibilityClaimed`]
    },
    {
      id: "blocked-admission-claim-detected",
      claimIds: [`${worker731}.nativeExecutionAdmissionClaimed`]
    }
  ]);
});

test("private admission 729-731 gate rejects descriptor-throwing visible public claim containers when proxy get returns undefined", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withDescriptorThrowingVisibleFields(
        {
          recognized: true
        },
        {
          publicCompatibilityClaims: {
            publicPackageCompatibilityClaimed: true
          }
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assertHiddenRowOverrideReadFailure(
    gate,
    worker730,
    "publicCompatibilityClaims"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "public-compatibility-claim-detected"
  ]);
});

test("private admission 729-731 gate rejects descriptor-throwing visible blocked admission claim containers when proxy get returns undefined", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withDescriptorThrowingVisibleFields(
        {
          recognized: true
        },
        {
          blockedAdmissionClaims: {
            nativeExecutionAdmissionClaimed: true
          }
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assertHiddenRowOverrideReadFailure(
    gate,
    worker731,
    "blockedAdmissionClaims"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "blocked-admission-claim-detected"
  ]);
});

test("private admission 729-731 gate rejects descriptor-throwing visible literal keys inside visible claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: withDescriptorThrowingVisibleFields(
          {},
          {
            publicPackageCompatibilityClaimed: true
          }
        )
      },
      [worker731]: {
        blockedAdmissionClaims: withDescriptorThrowingVisibleFields(
          {},
          {
            nativeExecutionAdmissionClaimed: true
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized",
    "public-compatibility-claim-detected",
    "blocked-admission-claim-detected"
  ]);

  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  for (const [workerId, location, key] of [
    [
      worker730,
      "row-override.publicCompatibilityClaims",
      "publicPackageCompatibilityClaimed"
    ],
    [
      worker731,
      "row-override.blockedAdmissionClaims",
      "nativeExecutionAdmissionClaimed"
    ]
  ]) {
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.workerId === workerId &&
          row.location === location &&
          row.key === key &&
          row.reason.startsWith(
            "hidden-compatibility-claim-descriptor-unreadable:"
          )
      ),
      true,
      key
    );
  }
});

test("private admission 729-731 gate preserves null and false claim containers as empty", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: null,
        blockedAdmissionClaims: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, true);
  assert.deepEqual(gate.violations, []);
  assertNoPublicOrAdmissionClaims(gate.rowsByWorker[worker730]);
});

test("private admission 729-731 gate rejects truthy primitive public claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.deepEqual(gate.violations, [
    {
      id: "public-compatibility-claim-detected",
      claimIds: [`${worker730}.publicPackageCompatibilityClaimed`]
    }
  ]);
});

test("private admission 729-731 gate rejects truthy primitive blocked admission claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedAdmissionClaims: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-admission-claim-detected",
      claimIds: [`${worker731}.nativeExecutionAdmissionClaimed`]
    }
  ]);
});

test("private admission 729-731 gate rejects descriptor-hidden literal keys inside visible claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: withOwnKeysHiddenDescriptorFields(
          {},
          {
            publicPackageCompatibilityClaimed: true
          }
        )
      },
      [worker731]: {
        blockedAdmissionClaims: withOwnKeysHiddenDescriptorFields(
          {},
          {
            nativeExecutionAdmissionClaimed: true
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assert.deepEqual(gate.violations, [
    {
      id: "public-compatibility-claim-detected",
      claimIds: [`${worker730}.publicPackageCompatibilityClaimed`]
    },
    {
      id: "blocked-admission-claim-detected",
      claimIds: [`${worker731}.nativeExecutionAdmissionClaimed`]
    }
  ]);
});

test("private admission 729-731 gate rejects accessor descriptor-hidden dependency diagnostic ids", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withOwnKeysHiddenAccessorDescriptorFields(
        {
          recognized: true
        },
        {
          dependencyDiagnosticIds: []
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.equal(gate.rowsByWorker[worker730].recognized, false);
  assert.deepEqual(gate.rowsByWorker[worker730].dependencyDiagnosticIds, []);
  assertHiddenRowOverrideReadFailure(
    gate,
    worker730,
    "dependencyDiagnosticIds",
    "hidden-compatibility-claim-descriptor-get-mismatch"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "accepted-private-diagnostic-dependency-diagnostic-mismatch"
  ]);
});

test("private admission 729-731 gate rejects accessor descriptor-hidden blocker context diagnostic ids", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withOwnKeysHiddenAccessorDescriptorFields(
        {
          recognized: true
        },
        {
          blockerContextDiagnosticIds: []
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assert.deepEqual(gate.rowsByWorker[worker731].blockerContextDiagnosticIds, []);
  assertHiddenRowOverrideReadFailure(
    gate,
    worker731,
    "blockerContextDiagnosticIds",
    "hidden-compatibility-claim-descriptor-get-mismatch"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "accepted-private-diagnostic-blocker-context-diagnostic-mismatch"
  ]);
});

test("private admission 729-731 gate rejects accessor descriptor-hidden nested public package claims", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: withOwnKeysHiddenAccessorDescriptorFields(
          {},
          {
            publicPackageCompatibilityClaimed: true
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(
    gate.rowsByWorker[worker730].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.deepEqual(gate.violations, [
    {
      id: "public-compatibility-claim-detected",
      claimIds: [`${worker730}.publicPackageCompatibilityClaimed`]
    }
  ]);
});

test("private admission 729-731 gate rejects accessor descriptor-hidden nested native admission claims", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedAdmissionClaims: withOwnKeysHiddenAccessorDescriptorFields(
          {},
          {
            nativeExecutionAdmissionClaimed: true
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-admission-claim-detected",
      claimIds: [`${worker731}.nativeExecutionAdmissionClaimed`]
    }
  ]);
});

test("private admission 729-731 gate rejects ownKeys-hidden critical row override fields", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withOwnKeysHiddenRowFields(
        {
          recognized: true
        },
        {
          acceptedDiagnosticIds: [],
          dependencyWorkerIds: [],
          blockerContextWorkerIds: [],
          evidence: []
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.deepEqual(gate.rowsByWorker[worker730].acceptedDiagnosticIds, []);
  assert.deepEqual(gate.rowsByWorker[worker730].dependencyWorkerIds, []);
  assert.deepEqual(gate.rowsByWorker[worker730].blockerContextWorkerIds, []);
  assert.equal(
    gate.rowsByWorker[worker730].evidence.every(
      (evidenceRow) => evidenceRow.recognized === false
    ),
    true
  );
  assertViolationIds(gate, [
    "private-admission-evidence-context-mismatch",
    "required-private-diagnostic-not-recognized",
    "accepted-private-diagnostic-id-mismatch",
    "accepted-private-diagnostic-dependency-mismatch",
    "accepted-private-diagnostic-blocker-context-mismatch"
  ]);
});

test("private admission 729-731 gate rejects ownKeys-hidden blocklist row override fields", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withOwnKeysHiddenRowFields(
        {
          recognized: true
        },
        {
          blockedPublicCompatibilitySurfaces: [],
          blockedPublicClaims: [],
          blockedAdmissionClaimIds: []
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.deepEqual(
    gate.rowsByWorker[worker730].blockedPublicCompatibilitySurfaces,
    []
  );
  assert.deepEqual(gate.rowsByWorker[worker730].blockedPublicClaims, []);
  assert.deepEqual(gate.rowsByWorker[worker730].blockedAdmissionClaimIds, []);
  assert.deepEqual(gate.rowOverrideReadFailures, []);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-public-compatibility-surface-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedBlockedPublicCompatibilitySurfaces:
            PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
          actualBlockedPublicCompatibilitySurfaces: []
        }
      ]
    },
    {
      id: "blocked-public-claim-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedBlockedPublicClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims: []
        }
      ]
    },
    {
      id: "blocked-admission-claim-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedBlockedAdmissionClaims:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaimIds: [],
          actualBlockedAdmissionClaims:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects ownKeys-hidden critical metadata row fields", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withOwnKeysHiddenRowFields(
        {
          recognized: true
        },
        {
          workerId: skippedWorker729,
          privateAdmission: "skipped-meta",
          runtimeCapabilityAdded: false,
          promotion: "accepted-public",
          privateEvidenceOnly: false,
          recognized: false
        }
      )
    },
    skippedRowOverrides: {
      [skippedWorker729]: withOwnKeysHiddenRowFields(
        {},
        {
          runtimeCapabilityAdded: true,
          privateEvidenceOnly: false
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.skipMetaRecognized, false);
  assert.equal(gate.rowsByWorker[skippedWorker729].workerId, skippedWorker729);
  assert.equal(
    gate.rowsByWorker[skippedWorker729].privateAdmission,
    "skipped-meta"
  );
  assert.equal(gate.rowsByWorker[skippedWorker729].promotion, "accepted-public");
  assert.equal(
    gate.rowsByWorker[skippedWorker729].runtimeCapabilityAdded,
    false
  );
  assert.equal(gate.rowsByWorker[skippedWorker729].privateEvidenceOnly, false);
  assert.equal(gate.rowsByWorker[skippedWorker729].recognized, false);
  assert.equal(
    gate.skippedRowsByWorker[skippedWorker729].runtimeCapabilityAdded,
    true
  );
  assert.equal(
    gate.skippedRowsByWorker[skippedWorker729].privateEvidenceOnly,
    false
  );
  assert.deepEqual(gate.rowOverrideReadFailures, []);
  assertViolationIds(gate, [
    "accepted-private-worker-manifest-mismatch",
    "skip-meta-row-claimed-runtime-capability",
    "accepted-private-runtime-capability-mismatch",
    "private-admission-kind-mismatch",
    "private-diagnostic-public-promotion-leak",
    "private-admission-evidence-scope-mismatch"
  ]);
});

test("private admission 729-731 gate rejects ownKeys-hidden static metadata row fields", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withOwnKeysHiddenRowFields(
        {
          recognized: true
        },
        {
          area: "unexpected-area",
          sourceQueue: "unexpected-queue",
          localGateCoverage: "unexpected-local-gate",
          primaryCompatibilityArea: "unexpected-primary-area"
        }
      )
    },
    skippedRowOverrides: {
      [skippedWorker729]: withOwnKeysHiddenRowFields(
        {},
        {
          area: "unexpected-skipped-area",
          sourceQueue: "unexpected-skipped-queue",
          localGateCoverage: "unexpected-skipped-local-gate",
          primaryCompatibilityArea: "unexpected-skipped-primary-area",
          skipReason: "unexpected-skip-reason"
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.skipMetaRecognized, false);
  assert.equal(gate.rowsByWorker[worker730].area, "unexpected-area");
  assert.equal(gate.rowsByWorker[worker730].sourceQueue, "unexpected-queue");
  assert.equal(
    gate.rowsByWorker[worker730].localGateCoverage,
    "unexpected-local-gate"
  );
  assert.equal(
    gate.rowsByWorker[worker730].primaryCompatibilityArea,
    "unexpected-primary-area"
  );
  assert.equal(
    gate.skippedRowsByWorker[skippedWorker729].skipReason,
    "unexpected-skip-reason"
  );
  const metadataViolation = gate.violations.find(
    (violation) => violation.id === "private-admission-static-metadata-mismatch"
  );
  assert.notEqual(metadataViolation, undefined);
  for (const field of [
    "area",
    "sourceQueue",
    "localGateCoverage",
    "primaryCompatibilityArea"
  ]) {
    assert.equal(
      metadataViolation.rows.some(
        (row) => row.baseWorkerId === worker730 && row.field === field
      ),
      true,
      field
    );
  }
  for (const field of [
    "area",
    "sourceQueue",
    "localGateCoverage",
    "primaryCompatibilityArea",
    "skipReason"
  ]) {
    assert.equal(
      metadataViolation.rows.some(
        (row) => row.baseWorkerId === skippedWorker729 && row.field === field
      ),
      true,
      field
    );
  }
});

test("private admission 729-731 gate rejects descriptor-throwing hidden critical row fields", () => {
  const cases = [
    {
      key: "acceptedDiagnosticIds",
      expectedViolationIds: [
        "hidden-row-override-field-unreadable",
        "required-private-diagnostic-not-recognized",
        "accepted-private-diagnostic-id-mismatch"
      ]
    },
    {
      key: "blockedAdmissionClaimIds",
      expectedViolationIds: [
        "hidden-row-override-field-unreadable",
        "required-private-diagnostic-not-recognized",
        "blocked-admission-claim-mismatch"
      ]
    },
    {
      key: "blockedPublicClaims",
      expectedViolationIds: [
        "hidden-row-override-field-unreadable",
        "required-private-diagnostic-not-recognized",
        "blocked-public-claim-mismatch"
      ]
    },
    {
      key: "blockedPublicCompatibilitySurfaces",
      expectedViolationIds: [
        "hidden-row-override-field-unreadable",
        "required-private-diagnostic-not-recognized",
        "blocked-public-compatibility-surface-mismatch"
      ]
    },
    {
      key: "dependencyWorkerIds",
      expectedViolationIds: [
        "hidden-row-override-field-unreadable",
        "required-private-diagnostic-not-recognized",
        "accepted-private-diagnostic-dependency-mismatch"
      ]
    },
    {
      key: "dependencyDiagnosticIds",
      expectedViolationIds: [
        "hidden-row-override-field-unreadable",
        "required-private-diagnostic-not-recognized",
        "accepted-private-diagnostic-dependency-diagnostic-mismatch"
      ]
    },
    {
      key: "blockerContextWorkerIds",
      expectedViolationIds: [
        "hidden-row-override-field-unreadable",
        "required-private-diagnostic-not-recognized",
        "accepted-private-diagnostic-blocker-context-mismatch"
      ]
    },
    {
      key: "blockerContextDiagnosticIds",
      expectedViolationIds: [
        "hidden-row-override-field-unreadable",
        "required-private-diagnostic-not-recognized",
        "accepted-private-diagnostic-blocker-context-diagnostic-mismatch"
      ]
    },
    {
      key: "evidence",
      expectedViolationIds: [
        "hidden-row-override-field-unreadable",
        "private-admission-evidence-context-mismatch",
        "required-private-diagnostic-not-recognized"
      ]
    }
  ];

  for (const { key, expectedViolationIds } of cases) {
    const gate = evaluatePrivateAdmission729731Gate({
      rowOverrides: {
        [worker730]: withDescriptorThrowingHiddenRowFields(
          {
            recognized: true
          },
          {
            [key]: []
          }
        )
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS, key);
    assert.equal(gate.privateDiagnosticsRecognized, false, key);
    assert.equal(gate.rowsByWorker[worker730].recognized, false, key);
    assertHiddenRowOverrideReadFailure(gate, worker730, key);
    assertViolationIds(gate, expectedViolationIds);

    if (key === "evidence") {
      assert.equal(gate.evidenceRecognized, false);
      assert.equal(gate.rowsByWorker[worker730].evidenceRecognized, false);
      assert.equal(
        gate.rowsByWorker[worker730].evidence.every(
          (evidenceRow) => evidenceRow.recognized === false
        ),
        true
      );
    } else {
      assert.deepEqual(gate.rowsByWorker[worker730][key], [], key);
    }
  }
});

test("private admission 729-731 gate rejects descriptor-throwing hidden claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withDescriptorThrowingHiddenRowFields(
        {
          recognized: true
        },
        {
          publicCompatibilityClaims: {
            publicPackageCompatibilityClaimed: true
          },
          blockedAdmissionClaims: {
            nativeExecutionAdmissionClaimed: true
          }
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(gate.rowsByWorker[worker731].recognized, false);
  assert.equal(
    gate.rowsByWorker[worker731].publicCompatibilityClaims
      .publicPackageCompatibilityClaimed,
    true
  );
  assert.equal(
    gate.rowsByWorker[worker731].blockedAdmissionClaims
      .nativeExecutionAdmissionClaimed,
    true
  );
  assertHiddenRowOverrideReadFailure(
    gate,
    worker731,
    "publicCompatibilityClaims"
  );
  assertHiddenRowOverrideReadFailure(
    gate,
    worker731,
    "blockedAdmissionClaims"
  );
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "public-compatibility-claim-detected",
    "blocked-admission-claim-detected"
  ]);
});

test("private admission 729-731 gate rejects descriptor-throwing hidden compatibilityClaimed", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withDescriptorThrowingHiddenRowFields(
        {
          recognized: true
        },
        {
          compatibilityClaimed: true
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker731].compatibilityClaimed, true);
  assertHiddenRowOverrideReadFailure(gate, worker731, "compatibilityClaimed");
  assertViolationIds(gate, [
    "hidden-row-override-field-unreadable",
    "required-private-diagnostic-not-recognized",
    "private-diagnostic-claimed-compatibility"
  ]);
});

test("private admission 729-731 gate rejects descriptor-throwing hidden literal keys inside visible claim containers", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: withDescriptorThrowingHiddenRowFields(
          {},
          {
            publicPackageCompatibilityClaimed: true
          }
        )
      },
      [worker731]: {
        blockedAdmissionClaims: withDescriptorThrowingHiddenRowFields(
          {},
          {
            nativeExecutionAdmissionClaimed: true
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, true);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized"
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  for (const [workerId, location, key] of [
    [
      worker730,
      "row-override.publicCompatibilityClaims",
      "publicPackageCompatibilityClaimed"
    ],
    [
      worker731,
      "row-override.blockedAdmissionClaims",
      "nativeExecutionAdmissionClaimed"
    ]
  ]) {
    assert.equal(
      claimViolation.rows.some(
        (row) =>
          row.workerId === workerId &&
          row.location === location &&
          row.key === key &&
          row.reason.startsWith(
            "hidden-compatibility-claim-descriptor-unreadable:"
          )
      ),
      true,
      key
    );
  }
});

test("private admission 729-731 gate rejects ownKeys-hidden dependency diagnostic ids", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withOwnKeysHiddenRowFields(
        {
          recognized: true
        },
        {
          dependencyDiagnosticIds: []
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.rowsByWorker[worker730].dependencyDiagnosticIds, []);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-diagnostic-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedDependencyDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[
              worker730
            ],
          actualDependencyDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects ownKeys-hidden blocker context diagnostic ids", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withOwnKeysHiddenRowFields(
        {
          recognized: true
        },
        {
          blockerContextDiagnosticIds: []
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.deepEqual(gate.rowsByWorker[worker731].blockerContextDiagnosticIds, []);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-blocker-context-diagnostic-mismatch",
      rows: [
        {
          workerId: worker731,
          expectedBlockerContextDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
              worker731
            ],
          actualBlockerContextDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects stale or meta worker ids in accepted rows", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        workerId: skippedWorker729
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-worker-manifest-mismatch",
      missingWorkerIds: [worker730],
      unexpectedWorkerIds: [skippedWorker729],
      duplicateWorkerIds: []
    }
  ]);
});

test("private admission 729-731 gate rejects skip meta rows that claim runtime capability", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    skippedRowOverrides: {
      [skippedWorker729]: {
        runtimeCapabilityAdded: true,
        acceptedDiagnosticIds: ["unexpected-runtime-diagnostic"]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "skip-meta-row-claimed-runtime-capability",
      workerIds: [skippedWorker729]
    }
  ]);
});

test("private admission 729-731 gate rejects skip meta compatibility and blocklist drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    skippedRowOverrides: {
      [skippedWorker729]: {
        compatibilityClaimed: true,
        promotion: "accepted-public",
        publicCompatibilityClaims: {
          publicPackageCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          nativeExecutionAdmissionClaimed: true
        },
        blockedPublicClaims: [],
        blockedPublicCompatibilitySurfaces: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "private-diagnostic-claimed-compatibility",
    "public-compatibility-claim-detected",
    "blocked-admission-claim-detected",
    "private-diagnostic-public-promotion-leak",
    "blocked-public-compatibility-surface-mismatch",
    "blocked-public-claim-mismatch"
  ]);
});

test("private admission 729-731 gate rejects skip meta diagnostic context drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    skippedRowOverrides: {
      [skippedWorker729]: withOwnKeysHiddenRowFields(
        {
          acceptedDiagnosticIds: null
        },
        {
          dependencyWorkerIds: ["worker-x"],
          dependencyDiagnosticIds: ["diagnostic-x"],
          blockerContextWorkerIds: ["worker-y"],
          blockerContextDiagnosticIds: null
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assert.equal(gate.skippedRowsByWorker[skippedWorker729].acceptedDiagnosticIds, null);
  assert.deepEqual(
    gate.skippedRowsByWorker[skippedWorker729].dependencyWorkerIds,
    ["worker-x"]
  );
  assert.deepEqual(
    gate.skippedRowsByWorker[skippedWorker729].dependencyDiagnosticIds,
    ["diagnostic-x"]
  );
  assert.deepEqual(
    gate.skippedRowsByWorker[skippedWorker729].blockerContextWorkerIds,
    ["worker-y"]
  );
  assert.equal(
    gate.skippedRowsByWorker[skippedWorker729].blockerContextDiagnosticIds,
    null
  );
  assertViolationIds(gate, [
    "skip-meta-row-claimed-runtime-capability",
    "skip-meta-row-diagnostic-context-mismatch"
  ]);
});

test("private admission 729-731 gate rejects skip meta arrays that report empty length", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    skippedRowOverrides: {
      [skippedWorker729]: {
        acceptedDiagnosticIds: withReportedLengthZeroArray([
          "unexpected-runtime-diagnostic"
        ]),
        dependencyWorkerIds: withReportedLengthZeroArray(["worker-x"]),
        dependencyDiagnosticIds: withReportedLengthZeroArray(["diagnostic-x"]),
        blockerContextWorkerIds: withReportedLengthZeroArray(["worker-y"]),
        blockerContextDiagnosticIds: withReportedLengthZeroArray(["diagnostic-y"])
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assertViolationIds(gate, [
    "skip-meta-row-claimed-runtime-capability",
    "skip-meta-row-diagnostic-context-mismatch"
  ]);
});

test("private admission 729-731 gate rejects visible runtime and admission metadata drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        runtimeCapabilityAdded: false,
        privateAdmission: "skipped-meta",
        privateEvidenceOnly: false
      }
    },
    skippedRowOverrides: {
      [skippedWorker729]: {
        privateAdmission: "accepted-private-diagnostic",
        privateEvidenceOnly: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.skipMetaRecognized, false);
  assert.equal(gate.rowsByWorker[worker730].runtimeCapabilityAdded, false);
  assert.equal(
    gate.rowsByWorker[worker730].privateAdmission,
    "skipped-meta"
  );
  assert.equal(gate.rowsByWorker[worker730].privateEvidenceOnly, false);
  assert.equal(
    gate.skippedRowsByWorker[skippedWorker729].privateAdmission,
    "accepted-private-diagnostic"
  );
  assert.equal(
    gate.skippedRowsByWorker[skippedWorker729].privateEvidenceOnly,
    false
  );
  assertViolationIds(gate, [
    "skip-meta-row-claimed-runtime-capability",
    "accepted-private-runtime-capability-mismatch",
    "private-admission-kind-mismatch",
    "accepted-private-diagnostic-id-mismatch",
    "private-admission-evidence-scope-mismatch"
  ]);
});

test("private admission 729-731 gate rejects dependency worker drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        dependencyWorkerIds: []
      },
      [worker731]: {
        dependencyWorkerIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedDependencyWorkerIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker730],
          actualDependencyWorkerIds: []
        },
        {
          workerId: worker731,
          expectedDependencyWorkerIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker731],
          actualDependencyWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects dependency diagnostic drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        dependencyDiagnosticIds: []
      },
      [worker731]: {
        dependencyDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-diagnostic-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedDependencyDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[
              worker730
            ],
          actualDependencyDiagnosticIds: []
        },
        {
          workerId: worker731,
          expectedDependencyDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[
              worker731
            ],
          actualDependencyDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects blocker context worker drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        blockerContextWorkerIds: []
      },
      [worker731]: {
        blockerContextWorkerIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-blocker-context-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedBlockerContextWorkerIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[worker730],
          actualBlockerContextWorkerIds: []
        },
        {
          workerId: worker731,
          expectedBlockerContextWorkerIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[worker731],
          actualBlockerContextWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects blocker context diagnostic drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        blockerContextDiagnosticIds: []
      },
      [worker731]: {
        blockerContextDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-blocker-context-diagnostic-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedBlockerContextDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
              worker730
            ],
          actualBlockerContextDiagnosticIds: []
        },
        {
          workerId: worker731,
          expectedBlockerContextDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
              worker731
            ],
          actualBlockerContextDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects dependency and blocker arrays with hidden extra own keys", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        dependencyWorkerIds: withHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker730],
          "worker-hidden-extra-dependency"
        ),
        dependencyDiagnosticIds: withHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker730],
          "hidden-extra-dependency-diagnostic"
        )
      },
      [worker731]: {
        blockerContextWorkerIds: withHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[worker731],
          "worker-hidden-extra-blocker"
        ),
        blockerContextDiagnosticIds: withHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
            worker731
          ],
          "hidden-extra-blocker-diagnostic"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assertViolationIds(gate, [
    "accepted-private-diagnostic-dependency-mismatch",
    "accepted-private-diagnostic-dependency-diagnostic-mismatch",
    "accepted-private-diagnostic-blocker-context-mismatch",
    "accepted-private-diagnostic-blocker-context-diagnostic-mismatch"
  ]);
});

test("private admission 729-731 gate rejects blocked public surface drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        blockedPublicCompatibilitySurfaces: []
      }
    },
    skippedRowOverrides: {
      [skippedWorker729]: {
        blockedPublicCompatibilitySurfaces: [
          "test-renderer",
          "unexpected-public-surface"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-public-compatibility-surface-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedBlockedPublicCompatibilitySurfaces:
            PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
          actualBlockedPublicCompatibilitySurfaces: []
        },
        {
          workerId: skippedWorker729,
          expectedBlockedPublicCompatibilitySurfaces:
            PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
          actualBlockedPublicCompatibilitySurfaces: [
            "test-renderer",
            "unexpected-public-surface"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects blocked public claim drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedPublicClaims: []
      }
    },
    skippedRowOverrides: {
      [skippedWorker729]: {
        blockedPublicClaims: [
          "publicTestRendererCompatibilityClaimed",
          "unexpectedPublicClaim"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-public-claim-mismatch",
      rows: [
        {
          workerId: worker731,
          expectedBlockedPublicClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims: []
        },
        {
          workerId: skippedWorker729,
          expectedBlockedPublicClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims: [
            "publicTestRendererCompatibilityClaimed",
            "unexpectedPublicClaim"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects blocklist arrays with hidden extra own keys", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedPublicCompatibilitySurfaces: withHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
          "hidden-extra-public-surface"
        ),
        blockedPublicClaims: withHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          "hiddenExtraPublicClaim"
        ),
        blockedAdmissionClaimIds: withHiddenExtraArray(
          PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          "hiddenExtraAdmissionClaimed"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
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

test("private admission 729-731 gate rejects public compatibility claim key drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: {
          unexpectedPublicClaim: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "public-compatibility-claim-key-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedPublicCompatibilityClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualPublicCompatibilityClaims: [
            ...PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
            "unexpectedPublicClaim"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects symbol public compatibility claim key drift", () => {
  const unexpectedPublicClaim = Symbol("unexpectedPublicClaim");
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: {
          [unexpectedPublicClaim]: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "public-compatibility-claim-key-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedPublicCompatibilityClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualPublicCompatibilityClaims: [
            ...PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
            "Symbol(unexpectedPublicClaim)"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects false-valued blocked admission claim key drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedAdmissionClaims: {
          unexpectedNativeAdmissionClaimed: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-admission-claim-mismatch",
      rows: [
        {
          workerId: worker731,
          expectedBlockedAdmissionClaims:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaimIds:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaims: [
            ...PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
            "unexpectedNativeAdmissionClaimed"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects symbol blocked admission claim key drift", () => {
  const unexpectedNativeAdmissionClaimed = Symbol(
    "unexpectedNativeAdmissionClaimed"
  );
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedAdmissionClaims: {
          [unexpectedNativeAdmissionClaimed]: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-admission-claim-mismatch",
      rows: [
        {
          workerId: worker731,
          expectedBlockedAdmissionClaims:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaimIds:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaims: [
            ...PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
            "Symbol(unexpectedNativeAdmissionClaimed)"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects blocked admission claim id drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedAdmissionClaimIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-admission-claim-mismatch",
      rows: [
        {
          workerId: worker731,
          expectedBlockedAdmissionClaims:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaimIds: [],
          actualBlockedAdmissionClaims:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects non-array blocked admission claim ids", () => {
  const iterableClaimIds = {
    length: PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS.length,
    *[Symbol.iterator]() {
      yield* PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS;
    }
  };
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedAdmissionClaimIds: iterableClaimIds
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.equal(
    Array.isArray(gate.rowsByWorker[worker731].blockedAdmissionClaimIds),
    false
  );
  const violation = gate.violations.find(
    (candidate) => candidate.id === "blocked-admission-claim-mismatch"
  );
  assert.notEqual(violation, undefined);
  assert.equal(
    violation.rows[0].actualBlockedAdmissionClaimIds,
    iterableClaimIds
  );
});

test("private admission 729-731 gate rejects true-valued unknown blocked admission claim keys", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedAdmissionClaims: {
          unexpectedNativeAdmissionClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized",
    "blocked-admission-claim-detected",
    "blocked-admission-claim-mismatch"
  ]);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, [
    `${worker731}.unexpectedNativeAdmissionClaimed`
  ]);
  const claimViolation = gate.violations.find(
    (violation) => violation.id === "unknown-compatibility-claim-detected"
  );
  assert.notEqual(claimViolation, undefined);
  assert.equal(
    claimViolation.rows.some(
      (row) =>
        row.location === "row-override.blockedAdmissionClaims" &&
        row.key === "unexpectedNativeAdmissionClaimed" &&
        row.reason === "unknown-compatibility-claim-key"
    ),
    true
  );
  const mismatchViolation = gate.violations.find(
    (violation) => violation.id === "blocked-admission-claim-mismatch"
  );
  assert.notEqual(mismatchViolation, undefined);
  assert.deepEqual(mismatchViolation.rows, [
    {
      workerId: worker731,
      expectedBlockedAdmissionClaims:
        PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
      actualBlockedAdmissionClaimIds:
        PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
      actualBlockedAdmissionClaims: [
        ...PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
        "unexpectedNativeAdmissionClaimed"
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects true-valued symbol blocked admission claim keys", () => {
  const unexpectedNativeAdmissionClaimed = Symbol(
    "unexpectedNativeAdmissionClaimed"
  );
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedAdmissionClaims: {
          [unexpectedNativeAdmissionClaimed]: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "unknown-compatibility-claim-detected",
    "required-private-diagnostic-not-recognized",
    "blocked-admission-claim-detected",
    "blocked-admission-claim-mismatch"
  ]);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, [
    `${worker731}.Symbol(unexpectedNativeAdmissionClaimed)`
  ]);
});

test("private admission 729-731 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: [worker731]
    }
  ]);
});

test("private admission 729-731 gate rejects non-enumerable top-level compatibilityClaimed row overrides", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: withNonEnumerableCompatibilityAlias(
        {
          recognized: true
        },
        "compatibilityClaimed",
        true
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker730].compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: [worker730]
    }
  ]);
});

test("private admission 729-731 gate rejects proxy-hidden top-level compatibilityClaimed row overrides", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: withProxyHiddenCompatibilityAliases(
        {
          recognized: true
        },
        {
          compatibilityClaimed: true
        }
      )
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.rowsByWorker[worker731].compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: [worker731]
    }
  ]);
});

test("private admission 729-731 gate rejects blocked admission claim leaks", () => {
  for (const claimId of PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS) {
    const gate = evaluatePrivateAdmission729731Gate({
      rowOverrides: {
        [worker731]: {
          blockedAdmissionClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.compatibilityClaimed, true);
    assert.equal(gate.blockedAdmissionClaimsRecognized, false);
    assert.deepEqual(gate.violations, [
      {
        id: "blocked-admission-claim-detected",
        claimIds: [`${worker731}.${claimId}`]
      }
    ]);
  }
});

test("private admission 729-731 gate rejects public promotion leaks", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        promotion: "accepted-public"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-public-promotion-leak",
      workerIds: [worker730]
    }
  ]);
});

test("private admission 729-731 gate rejects public surface promotion leaks", () => {
  for (const claimId of PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS) {
    const gate = evaluatePrivateAdmission729731Gate({
      rowOverrides: {
        [worker731]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.compatibilityClaimed, true);
    assert.equal(gate.publicCompatibilityClaimed, true);
    assert.deepEqual(gate.violations, [
      {
        id: "public-compatibility-claim-detected",
        claimIds: [`${worker731}.${claimId}`]
      }
    ]);
  }
});

function assertPrivateDiagnosticRow(
  row,
  {
    primaryCompatibilityArea,
    acceptedDiagnosticIds,
    dependencyWorkerIds,
    dependencyDiagnosticIds,
    blockerContextWorkerIds,
    blockerContextDiagnosticIds,
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, "accepted-private-diagnostic");
  assert.equal(row.sourceQueue, "729-731");
  assert.equal(row.primaryCompatibilityArea, primaryCompatibilityArea);
  assert.equal(row.runtimeCapabilityAdded, true);
  assert.equal(row.recognized, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "rejected");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, [...acceptedDiagnosticIds]);
  assert.deepEqual(row.dependencyWorkerIds, [...dependencyWorkerIds]);
  assert.deepEqual(row.dependencyDiagnosticIds, [...dependencyDiagnosticIds]);
  assert.deepEqual(row.blockerContextWorkerIds, [...blockerContextWorkerIds]);
  assert.deepEqual(row.blockerContextDiagnosticIds, [
    ...blockerContextDiagnosticIds
  ]);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
}

function assertNoPublicOrAdmissionClaims(row) {
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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
    [...PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS].sort(),
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
  }
}

function assertViolationIds(gate, expectedIds) {
  const actualIds = gate.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}

function assertEvidenceContextFailure(gate, workerId) {
  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.rowsByWorker[workerId].recognized, false);
  assert.equal(gate.rowsByWorker[workerId].evidenceRecognized, false);
  assertViolationIds(gate, [
    "private-admission-evidence-context-mismatch",
    "required-private-diagnostic-not-recognized"
  ]);
}

function assertEvidenceContextReasons(gate, workerId, expectedReasons) {
  const contextViolation = gate.violations.find(
    (violation) => violation.id === "private-admission-evidence-context-mismatch"
  );
  assert.notEqual(contextViolation, undefined);
  const actualReasons = contextViolation.rows
    .filter((row) => row.workerId === workerId)
    .map((row) => row.reason);
  for (const expectedReason of expectedReasons) {
    assert.equal(actualReasons.includes(expectedReason), true, expectedReason);
  }
}

function assertHiddenRowOverrideReadFailure(
  gate,
  workerId,
  key,
  reasonPrefix = "hidden-compatibility-claim-descriptor-unreadable:"
) {
  const readFailureViolation = gate.violations.find(
    (violation) => violation.id === "hidden-row-override-field-unreadable"
  );
  assert.notEqual(readFailureViolation, undefined, key);
  assert.equal(
    readFailureViolation.rows.some(
      (row) =>
        row.workerId === workerId &&
        row.location === "row-override" &&
        row.key === key &&
        row.reason.startsWith(reasonPrefix)
    ),
    true,
    key
  );
  assert.equal(
    gate.rowsByWorker[workerId].rowOverrideReadFailures.some(
      (failure) => failure.location === "row-override" && failure.key === key
    ),
    true,
    key
  );
}

function withMissingEvidenceToken(row, role, token) {
  const evidenceRow = row.evidence.find((sourceRow) => sourceRow.role === role);
  assert.notEqual(evidenceRow, undefined, role);
  return withEvidenceTokens(
    row,
    role,
    freezeTestArray([...evidenceRow.tokens, token])
  );
}

function withEvidenceTokens(row, role, tokens) {
  return withEvidenceRow(row, role, (evidenceRow) => ({
    ...evidenceRow,
    tokens
  }));
}

function withEvidenceRow(row, role, update) {
  return freezeTestArray(
    row.evidence.map((evidenceRow) =>
      evidenceRow.role === role ? update(evidenceRow) : evidenceRow
    )
  );
}

function withoutEvidenceRole(row, role) {
  return freezeTestArray(
    row.evidence.filter((evidenceRow) => evidenceRow.role !== role)
  );
}

function freezeTestArray(values) {
  return Object.freeze([...values]);
}

function hideArrayContents(values) {
  return new Proxy([...values], {
    get(target, property, receiver) {
      if (property === "length") {
        return 0;
      }
      return Reflect.get(target, property, receiver);
    }
  });
}

function withHiddenExtraArray(values, extraValue) {
  const visibleLength = values.length;
  return new Proxy([...values, extraValue], {
    get(target, property, receiver) {
      if (property === "length") {
        return visibleLength;
      }
      return Reflect.get(target, property, receiver);
    }
  });
}

function withCoordinatedHiddenExtraArray(values, extraValue) {
  const visibleLength = values.length;
  const hiddenIndex = String(visibleLength);
  return new Proxy(freezeTestArray(values), {
    get(target, property, receiver) {
      if (property === "length") {
        return visibleLength;
      }
      if (property === hiddenIndex) {
        return extraValue;
      }
      return Reflect.get(target, property, receiver);
    }
  });
}

function withStatefulHiddenExtraArray(values, extraValue) {
  const visibleLength = values.length;
  const hiddenIndex = String(visibleLength);
  let reads = 0;
  return new Proxy(freezeTestArray(values), {
    get(target, property, receiver) {
      if (property === hiddenIndex) {
        reads += 1;
        return reads > 2 ? extraValue : undefined;
      }
      return Reflect.get(target, property, receiver);
    }
  });
}

function withStatefulThrowingNextIndexArray(values, message) {
  const visibleLength = values.length;
  const hiddenIndex = String(visibleLength);
  let reads = 0;
  return new Proxy(freezeTestArray(values), {
    get(target, property, receiver) {
      if (property === hiddenIndex) {
        reads += 1;
        if (reads > 2) {
          throw new Error(message);
        }
        return undefined;
      }
      return Reflect.get(target, property, receiver);
    }
  });
}

function withUnreadableArray(values) {
  return new Proxy([...values], {
    get(target, property, receiver) {
      if (property === "length" || property === Symbol.iterator) {
        throw new Error("array read blocked");
      }
      return Reflect.get(target, property, receiver);
    }
  });
}

function withEvidenceCompatibilityAliases(row, role, aliases) {
  return freezeTestArray(
    row.evidence.map((evidenceRow) => {
      if (evidenceRow.role !== role) {
        return evidenceRow;
      }
      return {
        ...evidenceRow,
        ...aliases
      };
    })
  );
}

function withNonEnumerableCompatibilityAlias(row, key, value) {
  const clone = { ...row };
  Object.defineProperty(clone, key, {
    configurable: true,
    enumerable: false,
    value
  });
  return clone;
}

function withNonEnumerableEvidenceCompatibilityAlias(row, role, key, value) {
  return freezeTestArray(
    row.evidence.map((evidenceRow) => {
      if (evidenceRow.role !== role) {
        return evidenceRow;
      }
      return withNonEnumerableCompatibilityAlias(evidenceRow, key, value);
    })
  );
}

function withProxyHiddenCompatibilityAliases(row, aliases) {
  const hiddenAliases = new Map(Object.entries(aliases));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (hiddenAliases.has(property)) {
        return hiddenAliases.get(property);
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (hiddenAliases.has(property)) {
        return undefined;
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(
        (property) => !hiddenAliases.has(property)
      );
    }
  });
}

function withFunctionProxyHiddenCompatibilityAliases(aliases) {
  const hiddenAliases = new Map(Object.entries(aliases));
  return new Proxy(function rowOverride() {}, {
    get(target, property, receiver) {
      if (hiddenAliases.has(property)) {
        return hiddenAliases.get(property);
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (hiddenAliases.has(property)) {
        return undefined;
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(
        (property) => !hiddenAliases.has(property)
      );
    }
  });
}

function withDescriptorExposedClaimContainers(row, claimContainers) {
  const descriptorValues = new Map(Object.entries(claimContainers));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (descriptorValues.has(property)) {
        return undefined;
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (descriptorValues.has(property)) {
        return {
          configurable: true,
          enumerable: true,
          value: descriptorValues.get(property),
          writable: true
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      for (const key of descriptorValues.keys()) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
      return keys;
    }
  });
}

function withDescriptorGetMismatchVisibleFields(
  row,
  descriptorFields,
  getFields
) {
  const descriptorValues = new Map(Object.entries(descriptorFields));
  const getValues = new Map(Object.entries(getFields));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (getValues.has(property)) {
        return getValues.get(property);
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (descriptorValues.has(property)) {
        return {
          configurable: true,
          enumerable: true,
          value: descriptorValues.get(property),
          writable: true
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      for (const key of descriptorValues.keys()) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
      return keys;
    }
  });
}

function withDescriptorGetThrowingVisibleFields(row, descriptorFields) {
  const descriptorValues = new Map(Object.entries(descriptorFields));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (descriptorValues.has(property)) {
        throw new Error(`get trap for ${String(property)}`);
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (descriptorValues.has(property)) {
        return {
          configurable: true,
          enumerable: true,
          value: descriptorValues.get(property),
          writable: true
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      for (const key of descriptorValues.keys()) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
      return keys;
    }
  });
}

function withAccessorDescriptorGetMismatchVisibleFields(
  row,
  descriptorFields,
  getFields
) {
  const descriptorValues = new Map(Object.entries(descriptorFields));
  const getValues = new Map(Object.entries(getFields));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (getValues.has(property)) {
        return getValues.get(property);
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (descriptorValues.has(property)) {
        const value = descriptorValues.get(property);
        return {
          configurable: true,
          enumerable: true,
          get() {
            return value;
          }
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      for (const key of descriptorValues.keys()) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
      return keys;
    }
  });
}

function withDescriptorThrowingVisibleFields(row, fields) {
  const visibleFields = new Map(Object.entries(fields));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (visibleFields.has(property)) {
        return undefined;
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (visibleFields.has(property)) {
        throw new Error(`descriptor trap for ${String(property)}`);
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      for (const key of visibleFields.keys()) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
      return keys;
    }
  });
}

function withOwnKeysHiddenDescriptorClaimContainers(row, claimContainers) {
  return withOwnKeysHiddenDescriptorFields(row, claimContainers);
}

function withOwnKeysHiddenDescriptorFields(row, fields) {
  const descriptorValues = new Map(Object.entries(fields));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (descriptorValues.has(property)) {
        return undefined;
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (descriptorValues.has(property)) {
        return {
          configurable: true,
          enumerable: true,
          value: descriptorValues.get(property),
          writable: true
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(
        (property) => !descriptorValues.has(property)
      );
    }
  });
}

function withOwnKeysHiddenAccessorDescriptorFields(row, fields) {
  const descriptorValues = new Map(Object.entries(fields));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (descriptorValues.has(property)) {
        return undefined;
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (descriptorValues.has(property)) {
        const value = descriptorValues.get(property);
        return {
          configurable: true,
          enumerable: true,
          get() {
            return value;
          }
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(
        (property) => !descriptorValues.has(property)
      );
    }
  });
}

function withOwnKeysHiddenRowFields(row, fields) {
  const hiddenFields = new Map(Object.entries(fields));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (hiddenFields.has(property)) {
        return hiddenFields.get(property);
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (hiddenFields.has(property)) {
        return undefined;
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(
        (property) => !hiddenFields.has(property)
      );
    }
  });
}

function withDescriptorThrowingHiddenRowFields(row, fields) {
  const hiddenFields = new Map(Object.entries(fields));
  return new Proxy({ ...row }, {
    get(target, property, receiver) {
      if (hiddenFields.has(property)) {
        return hiddenFields.get(property);
      }
      return Reflect.get(target, property, receiver);
    },
    getOwnPropertyDescriptor(target, property) {
      if (hiddenFields.has(property)) {
        throw new Error(`descriptor trap for ${String(property)}`);
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(
        (property) => !hiddenFields.has(property)
      );
    }
  });
}

function withReportedLengthZeroArray(values) {
  return new Proxy([...values], {
    get(target, property, receiver) {
      if (property === "length") {
        return 0;
      }
      return Reflect.get(target, property, receiver);
    }
  });
}

function withProxyHiddenEvidenceCompatibilityAliases(row, role, aliases) {
  return freezeTestArray(
    row.evidence.map((evidenceRow) => {
      if (evidenceRow.role !== role) {
        return evidenceRow;
      }
      return withProxyHiddenCompatibilityAliases(evidenceRow, aliases);
    })
  );
}

function withDescriptorHiddenEvidenceCompatibilityAliases(row, role, aliases) {
  return freezeTestArray(
    row.evidence.map((evidenceRow) => {
      if (evidenceRow.role !== role) {
        return evidenceRow;
      }
      return withOwnKeysHiddenDescriptorFields(evidenceRow, aliases);
    })
  );
}
