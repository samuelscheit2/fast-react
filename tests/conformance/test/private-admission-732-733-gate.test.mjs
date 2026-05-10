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
  PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_732_733_GATE_STATUS,
  PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_732_733_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_732_733_REQUIRED_BLOCKER_CONTEXT,
  PRIVATE_ADMISSION_732_733_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
  PRIVATE_ADMISSION_732_733_REQUIRED_CLEANUP_HANDOFF_VALIDATION,
  PRIVATE_ADMISSION_732_733_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_732_733_REQUIRED_DEPENDENCY_DIAGNOSTICS,
  PRIVATE_ADMISSION_732_733_REQUIRED_IDENTITY_BINDINGS,
  PRIVATE_ADMISSION_732_733_REQUIRED_PRIOR_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_732_733_ROWS,
  PRIVATE_ADMISSION_732_733_SKIPPED_ROWS,
  PRIVATE_ADMISSION_732_733_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_732_733_VIOLATION_STATUS,
  PRIVATE_ADMISSION_732_733_WORKERS,
  evaluatePrivateAdmission732733Gate
} from "../src/private-admission-732-733-gate.mjs";
import {
  PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS
} from "../src/private-admission-729-731-gate.mjs";

const worker733 = "worker-733-test-renderer-unmount-finished-work-identity";
const skippedWorker732 =
  "worker-732-package-private-admission-audit-729-731";

const expectedWorkers = [worker733];
const expectedSkippedWorkers = [skippedWorker732];
const rustSourcePath = "crates/fast-react-test-renderer/src/lib.rs";
const cleanupHandoffIdValidationToken =
  "execution.cleanup_handoff_id()\n                != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID";
const cleanupHandoffTamperToken =
  'cleanup_handoff_admission.cleanup_handoff_id = "tampered-cleanup-handoff";';
const toJSONValidationSlice = {
  sliceStart:
    "fn validate_private_to_json_unmount_native_execution_record_for_canary(",
  sliceEnd: "fn private_to_json_native_execution_record_error<T>("
};
const toTreeValidationSlice = {
  sliceStart:
    "fn validate_private_to_tree_unmount_native_execution_record_for_canary(",
  sliceEnd: "fn private_to_tree_native_execution_record_error<T>("
};
const toJSONTamperSlice = {
  sliceStart:
    "fn root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate()",
  sliceEnd:
    "fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate()"
};
const toTreeTamperSlice = {
  sliceStart:
    "fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate()",
  sliceEnd:
    "fn root_private_to_json_nested_host_output_update_row_records_nested_text_rows()"
};

const requiredCarryForwardSurfaces =
  PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES;
const requiredCarryForwardPublicClaims =
  PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS;
const requiredCarryForwardAdmissionClaims =
  PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS;
const requiredPromptCarryForwardSurfaces = [
  "test-renderer-update-native-serialization",
  "test-renderer-full-unmount-identity-admission",
  "test-renderer-multichild-serialization",
  "test-renderer-multichild-sibling-serialization",
  "test-renderer-sibling-snapshot-serialization",
  "test-renderer-multichild-identity-admission",
  "test-renderer-multichild-sibling-identity-admission",
  "test-renderer-sibling-snapshot-identity-admission"
];
const requiredPromptCarryForwardPublicClaims = [
  "publicTestRendererUpdateNativeSerializationCompatibilityClaimed",
  "publicTestRendererFullUnmountIdentityAdmissionClaimed",
  "publicTestRendererMultichildSerializationCompatibilityClaimed",
  "publicTestRendererMultichildSiblingSerializationCompatibilityClaimed",
  "publicTestRendererSiblingSnapshotSerializationCompatibilityClaimed",
  "publicTestRendererMultichildIdentityAdmissionClaimed",
  "publicTestRendererMultichildSiblingIdentityAdmissionClaimed",
  "publicTestRendererSiblingSnapshotIdentityAdmissionClaimed"
];
const requiredPromptCarryForwardAdmissionClaims = [
  "unmountIdentityAdmissionClaimed",
  "siblingSnapshotAdmissionClaimed",
  "toTreePromotionClaimed"
];
const required732SpecificSurfaces = [
  "test-renderer-native-bridge-loading",
  "test-renderer-public-unmount",
  "test-renderer-public-unmount-finished-work-identity",
  "test-renderer-nested-source-report-identity",
  "test-renderer-sibling-snapshot-identity"
];
const required732SpecificPublicClaims = [
  "publicTestRendererNativeBridgeLoadingCompatibilityClaimed",
  "publicTestRendererUnmountFinishedWorkIdentityAdmissionClaimed",
  "publicTestRendererNestedSourceReportIdentityClaimed",
  "publicTestRendererSiblingSnapshotIdentityClaimed"
];
const required732SpecificAdmissionClaims = [
  "packageCompatibilityClaimed",
  "publicSerializationAdmissionClaimed",
  "nativeBridgeLoadingClaimed",
  "nativeBridgeExecutionClaimed",
  "nestedSourceReportIdentityClaimed",
  "siblingSnapshotIdentityClaimed",
  "publicPackageCompatibilityPromotionClaimed"
];

test("private admission 732-733 manifest records Worker 732 as prior ledger context and Worker 733 as accepted private evidence", () => {
  assert.deepEqual(PRIVATE_ADMISSION_732_733_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_732_733_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_732_733_SKIPPED_WORKERS,
    expectedSkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_732_733_SKIPPED_ROWS.map((row) => row.workerId),
    expectedSkippedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_732_733_ROWS.length, 1);
  assert.equal(PRIVATE_ADMISSION_732_733_SKIPPED_ROWS.length, 1);
  assert.equal(
    PRIVATE_ADMISSION_732_733_WORKERS.includes(skippedWorker732),
    false
  );

  for (const surface of requiredCarryForwardSurfaces) {
    assert.equal(
      PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES.includes(surface),
      true,
      surface
    );
  }
  for (const claimId of requiredCarryForwardPublicClaims) {
    assert.equal(
      PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS.includes(claimId),
      true,
      claimId
    );
  }
  for (const claimId of requiredCarryForwardAdmissionClaims) {
    assert.equal(
      PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS.includes(claimId),
      true,
      claimId
    );
  }
  for (const surface of required732SpecificSurfaces) {
    assert.equal(
      PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES.includes(surface),
      true,
      surface
    );
  }
  for (const claimId of required732SpecificPublicClaims) {
    assert.equal(
      PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS.includes(claimId),
      true,
      claimId
    );
  }
  for (const claimId of required732SpecificAdmissionClaims) {
    assert.equal(
      PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS.includes(claimId),
      true,
      claimId
    );
  }
});

test("private admission 732-733 blockers carry forward the complete 729-731 blocked ledger", () => {
  assertSubset(
    PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
    PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES
  );
  assertSubset(
    PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
    PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
    PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS
  );

  assertSubset(
    requiredPromptCarryForwardSurfaces,
    PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES
  );
  assertSubset(
    requiredPromptCarryForwardSurfaces,
    PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES
  );
  assertSubset(
    requiredPromptCarryForwardPublicClaims,
    PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    requiredPromptCarryForwardPublicClaims,
    PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    requiredPromptCarryForwardAdmissionClaims,
    PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS
  );
  assertSubset(
    requiredPromptCarryForwardAdmissionClaims,
    PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS
  );
});

test("private admission 732-733 gate recognizes accepted Worker 733 evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission732733Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.blockerContextRecognized, true);
  assert.equal(gate.priorLedgerContextRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.unmountIdentityBindingsRecognized, true);
  assert.equal(gate.cleanupHandoffValidationRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, true);
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
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(gate.manifest.missingSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateSkippedWorkerIds, []);

  const row = gate.rowsByWorker[worker733];
  assertPrivateDiagnosticRow(row, {
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_732_733_REQUIRED_ACCEPTED_DIAGNOSTICS[worker733],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_732_733_REQUIRED_DEPENDENCIES[worker733],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_732_733_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker733],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_732_733_REQUIRED_BLOCKER_CONTEXT[worker733],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_732_733_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[worker733],
    priorLedgerContext:
      PRIVATE_ADMISSION_732_733_REQUIRED_PRIOR_LEDGER_CONTEXT[worker733],
    identityBindings:
      PRIVATE_ADMISSION_732_733_REQUIRED_IDENTITY_BINDINGS[worker733],
    cleanupHandoffValidation:
      PRIVATE_ADMISSION_732_733_REQUIRED_CLEANUP_HANDOFF_VALIDATION[worker733],
    evidenceRoles: [
      "worker-733-unmount-identity-report",
      "worker-733-unmount-identity-builder-rust-proof",
      "worker-733-tojson-unmount-cleanup-handoff-id-validation-rust-proof",
      "worker-733-totree-unmount-cleanup-handoff-id-validation-rust-proof",
      "worker-733-unmount-binding-rust-proof",
      "worker-733-tojson-unmount-native-identity-rust-proof",
      "worker-733-tojson-unmount-cleanup-handoff-tamper-rust-proof",
      "worker-733-totree-unmount-native-identity-rust-proof",
      "worker-733-totree-unmount-cleanup-handoff-tamper-rust-proof"
    ]
  });
  assert.equal(
    row.acceptedDiagnosticIds.includes("public-unmount-compatibility"),
    false
  );
  assert.equal(
    row.cleanupHandoffValidation.cleanupHandoffIdValidated,
    true
  );
  assert.equal(
    row.cleanupHandoffValidation.toJSONRejectsTamperedCleanupHandoffId,
    true
  );
  assert.equal(
    row.cleanupHandoffValidation.toTreeRejectsTamperedCleanupHandoffId,
    true
  );

  for (const evaluatedRow of [...gate.rows, ...gate.skippedRows]) {
    assertNoPublicOrAdmissionClaims(evaluatedRow);
  }
});

test("private admission 732-733 gate recognizes Worker 732 as non-runtime prior ledger context", () => {
  const gate = evaluatePrivateAdmission732733Gate();
  const row = gate.skippedRowsByWorker[skippedWorker732];

  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "732-733");
  assert.equal(row.runtimeCapabilityAdded, false);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "not-applicable");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, []);
  assert.equal(row.skipReason, "prior-ledger-context-no-new-runtime-capability");
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    [
      "worker-732-prior-ledger-report",
      "worker-732-prior-ledger-source",
      "worker-732-prior-ledger-test"
    ]
  );
  assertNoPublicOrAdmissionClaims(row);
});

test("private admission 732-733 gate rejects missing Worker 733 evidence tokens", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        evidence: withMissingEvidenceToken(
          PRIVATE_ADMISSION_732_733_ROWS[0],
          "worker-733-tojson-unmount-native-identity-rust-proof",
          "missing-stable-worker-733-tojson-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, ["private-admission-evidence-token-missing"]);
  const tokenViolation = gate.violations.find(
    (violation) => violation.id === "private-admission-evidence-token-missing"
  );
  assert.equal(tokenViolation.rows.length, 1);
  assert.equal(
    tokenViolation.rows[0].role,
    "worker-733-tojson-unmount-native-identity-rust-proof"
  );
  assert.deepEqual(tokenViolation.rows[0].missingTokens, [
    "missing-stable-worker-733-tojson-token"
  ]);
});

test("private admission 732-733 gate rejects missing cleanup handoff validation", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        cleanupHandoffValidation: {
          cleanupHandoffIdValidated: false,
          toTreeRejectsTamperedCleanupHandoffId: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.cleanupHandoffValidationRecognized, false);
  assertViolationIds(gate, ["unmount-cleanup-handoff-validation-mismatch"]);
});

test("private admission 732-733 gate rejects corrupted toJSON cleanup handoff id validation slice", () => {
  const workspace = createWorkspaceWithMutatedRustSlice({
    ...toJSONValidationSlice,
    find: cleanupHandoffIdValidationToken,
    replace:
      "execution.cleanup_handoff_id()\n                == TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID"
  });

  try {
    const gate = evaluatePrivateAdmission732733Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      "worker-733-tojson-unmount-cleanup-handoff-id-validation-rust-proof",
      false
    );
    assertEvidenceRoleRecognized(
      gate,
      "worker-733-totree-unmount-cleanup-handoff-id-validation-rust-proof",
      true
    );
    assertViolationIds(gate, ["private-admission-evidence-token-missing"]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 732-733 gate rejects corrupted toTree cleanup handoff id validation slice", () => {
  const workspace = createWorkspaceWithMutatedRustSlice({
    ...toTreeValidationSlice,
    find: cleanupHandoffIdValidationToken,
    replace:
      "execution.cleanup_handoff_id()\n                == TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID"
  });

  try {
    const gate = evaluatePrivateAdmission732733Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      "worker-733-tojson-unmount-cleanup-handoff-id-validation-rust-proof",
      true
    );
    assertEvidenceRoleRecognized(
      gate,
      "worker-733-totree-unmount-cleanup-handoff-id-validation-rust-proof",
      false
    );
    assertViolationIds(gate, ["private-admission-evidence-token-missing"]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 732-733 gate rejects corrupted toJSON cleanup handoff tamper slice", () => {
  const workspace = createWorkspaceWithMutatedRustSlice({
    ...toJSONTamperSlice,
    find: cleanupHandoffTamperToken,
    replace:
      'cleanup_handoff_admission.cleanup_handoff_id = "stale-cleanup-handoff";'
  });

  try {
    const gate = evaluatePrivateAdmission732733Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      "worker-733-tojson-unmount-cleanup-handoff-tamper-rust-proof",
      false
    );
    assertEvidenceRoleRecognized(
      gate,
      "worker-733-totree-unmount-cleanup-handoff-tamper-rust-proof",
      true
    );
    assertViolationIds(gate, ["private-admission-evidence-token-missing"]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 732-733 gate rejects corrupted toTree cleanup handoff tamper slice", () => {
  const workspace = createWorkspaceWithMutatedRustSlice({
    ...toTreeTamperSlice,
    find: cleanupHandoffTamperToken,
    replace:
      'cleanup_handoff_admission.cleanup_handoff_id = "stale-cleanup-handoff";'
  });

  try {
    const gate = evaluatePrivateAdmission732733Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      "worker-733-tojson-unmount-cleanup-handoff-tamper-rust-proof",
      true
    );
    assertEvidenceRoleRecognized(
      gate,
      "worker-733-totree-unmount-cleanup-handoff-tamper-rust-proof",
      false
    );
    assertViolationIds(gate, ["private-admission-evidence-token-missing"]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 732-733 gate rejects stale worker id and stale evidence path", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        workerId: "worker-733-stale-unmount-identity-ledger",
        evidence: withStaleEvidencePath(
          PRIVATE_ADMISSION_732_733_ROWS[0],
          "worker-733-unmount-identity-report",
          "worker-progress/worker-733-stale-unmount-identity.md"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.manifest.missingWorkerIds, [worker733]);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, [
    "worker-733-stale-unmount-identity-ledger"
  ]);
  assertViolationIds(gate, [
    "accepted-private-worker-manifest-mismatch",
    "private-admission-evidence-token-missing"
  ]);
});

test("private admission 732-733 gate rejects missing Worker 733 diagnostic ids", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        acceptedDiagnosticIds:
          PRIVATE_ADMISSION_732_733_REQUIRED_ACCEPTED_DIAGNOSTICS[
            worker733
          ].filter(
            (diagnosticId) =>
              diagnosticId !==
              "private-unmount-totree-native-finished-work-identity-validation"
          )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assertViolationIds(gate, ["accepted-private-diagnostic-id-mismatch"]);
});

test("private admission 732-733 gate rejects weakened unmount identity bindings", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        identityBindings: {
          renderCommitHandlesBound: false,
          finishedLanesBound: false,
          emptyRootRowBound: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.unmountIdentityBindingsRecognized, false);
  assertViolationIds(gate, ["unmount-finished-work-identity-binding-mismatch"]);
});

test("private admission 732-733 gate rejects compatibility and public promotion leaks", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        compatibilityClaimed: true,
        promotion: "accepted-public",
        publicCompatibilityClaims: {
          publicTestRendererUnmountCompatibilityClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assertViolationIds(gate, [
    "private-diagnostic-claimed-compatibility",
    "public-compatibility-claim-detected",
    "private-diagnostic-public-promotion-leak"
  ]);
});

test("private admission 732-733 gate rejects native, JS, CJS, and package leaks", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        blockedAdmissionClaims: {
          packageCompatibilityClaimed: true,
          jsFacadeAdmissionClaimed: true,
          cjsFacadeAdmissionClaimed: true,
          nativeBridgeLoadingClaimed: true,
          nativeBridgeExecutionClaimed: true,
          nativeExecutionAdmissionClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "blocked-admission-claim-detected",
    "native-js-package-compatibility-leak-detected"
  ]);
  assert.deepEqual(gate.nativeJsPackageLeakClaimIds, [
    `${worker733}.nativeExecutionAdmissionClaimed`,
    `${worker733}.jsFacadeAdmissionClaimed`,
    `${worker733}.cjsFacadeAdmissionClaimed`,
    `${worker733}.packageCompatibilityClaimed`,
    `${worker733}.nativeBridgeLoadingClaimed`,
    `${worker733}.nativeBridgeExecutionClaimed`
  ]);
});

test("private admission 732-733 gate rejects missing blocked surfaces and claims", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        blockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES.filter(
            (surface) => surface !== "package"
          ),
        blockedPublicClaims:
          PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS.filter(
            (claimId) => claimId !== "publicPackageCompatibilityClaimed"
          ),
        blockedAdmissionClaimIds:
          PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS.filter(
            (claimId) => claimId !== "packageCompatibilityClaimed"
          )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
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

test("private admission 732-733 gate rejects removing a 729-731 carried-forward blocked surface", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        blockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES.filter(
            (surface) =>
              surface !== "test-renderer-full-unmount-identity-admission"
          )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assertViolationIds(gate, ["blocked-public-compatibility-surface-mismatch"]);
});

test("private admission 732-733 gate rejects removing a 729-731 carried-forward public blocker claim", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        blockedPublicClaims:
          PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS.filter(
            (claimId) =>
              claimId !==
              "publicTestRendererUpdateNativeSerializationCompatibilityClaimed"
          )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assertViolationIds(gate, ["blocked-public-claim-mismatch"]);
});

test("private admission 732-733 gate rejects removing a 729-731 carried-forward admission blocker", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        blockedAdmissionClaimIds:
          PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS.filter(
            (claimId) => claimId !== "siblingSnapshotAdmissionClaimed"
          )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, ["blocked-admission-claim-mismatch"]);
});

test("private admission 732-733 gate rejects stale previous Worker 732 ledger context", () => {
  const gate = evaluatePrivateAdmission732733Gate({
    rowOverrides: {
      [worker733]: {
        priorLedgerContext: [
          "worker-732-package-private-admission-audit-729-731",
          "private-admission-729-731-local-gate-1",
          "worker-730-test-renderer-unmount-native-cleanup-evidence"
        ]
      }
    },
    skippedRowOverrides: {
      [skippedWorker732]: {
        evidence: withMissingEvidenceToken(
          PRIVATE_ADMISSION_732_733_SKIPPED_ROWS[0],
          "worker-732-prior-ledger-source",
          "missing-worker-732-prior-ledger-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_732_733_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.priorLedgerContextRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, [
    "private-admission-evidence-token-missing",
    "prior-private-admission-ledger-context-mismatch"
  ]);
});

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function assertPrivateDiagnosticRow(
  row,
  {
    acceptedDiagnosticIds,
    dependencyWorkerIds,
    dependencyDiagnosticIds,
    blockerContextWorkerIds,
    blockerContextDiagnosticIds,
    priorLedgerContext,
    identityBindings,
    cleanupHandoffValidation,
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, "accepted-private-diagnostic");
  assert.equal(row.sourceQueue, "732-733");
  assert.equal(
    row.primaryCompatibilityArea,
    "test-renderer-unmount-finished-work-identity-native-diagnostics"
  );
  assert.equal(row.runtimeCapabilityAdded, true);
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
  assert.deepEqual(row.priorLedgerContext, [...priorLedgerContext]);
  assert.deepEqual(row.identityBindings, identityBindings);
  assert.deepEqual(row.cleanupHandoffValidation, cleanupHandoffValidation);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
}

function assertNoPublicOrAdmissionClaims(row) {
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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
    [...PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS].sort(),
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

function assertEvidenceRoleRecognized(gate, role, expectedRecognized) {
  const evidenceRow = gate.rowsByWorker[worker733].evidence.find(
    (row) => row.role === role
  );
  assert.notEqual(evidenceRow, undefined, role);
  assert.equal(evidenceRow.recognized, expectedRecognized, role);
}

function createWorkspaceWithMutatedRustSlice({
  sliceStart,
  sliceEnd,
  find,
  replace
}) {
  const root = mkdtempSync(join(tmpdir(), "private-admission-732-733-"));
  const workspaceRoot = findWorkspaceRoot();
  const evidencePaths = new Set(
    [...PRIVATE_ADMISSION_732_733_ROWS, ...PRIVATE_ADMISSION_732_733_SKIPPED_ROWS]
      .flatMap((row) => row.evidence)
      .map((evidenceRow) => evidenceRow.path)
  );

  for (const evidencePath of evidencePaths) {
    const sourcePath = join(workspaceRoot, evidencePath);
    const targetPath = join(root, evidencePath);
    mkdirSync(dirname(targetPath), { recursive: true });
    let text = readFileSync(sourcePath, "utf8");
    if (evidencePath === rustSourcePath) {
      text = replaceWithinSlice(text, {
        sliceStart,
        sliceEnd,
        find,
        replace
      });
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

function replaceWithinSlice(text, { sliceStart, sliceEnd, find, replace }) {
  const startIndex = text.indexOf(sliceStart);
  assert.notEqual(startIndex, -1, sliceStart);
  const endIndex = text.indexOf(sliceEnd, startIndex + sliceStart.length);
  assert.notEqual(endIndex, -1, sliceEnd);

  const before = text.slice(0, startIndex);
  const slice = text.slice(startIndex, endIndex);
  const after = text.slice(endIndex);
  assert.equal(slice.includes(find), true, find);

  return `${before}${slice.replace(find, replace)}${after}`;
}

function withMissingEvidenceToken(row, role, token) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      tokens: [...evidenceRow.tokens, token]
    };
  });
}

function withStaleEvidencePath(row, role, path) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      path
    };
  });
}
