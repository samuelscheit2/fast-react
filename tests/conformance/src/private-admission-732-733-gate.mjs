import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS
} from "./private-admission-729-731-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_732_733_GATE_ID =
  "private-admission-732-733-local-gate-1";
export const PRIVATE_ADMISSION_732_733_GATE_STATUS =
  "recognized-accepted-private-diagnostics-732-733-public-compatibility-blocked";
export const PRIVATE_ADMISSION_732_733_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-732-733-with-violations";

export const PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
    "publicTestRendererNativeBridgeLoadingCompatibilityClaimed",
    "publicTestRendererUnmountFinishedWorkIdentityAdmissionClaimed",
    "publicTestRendererNestedSourceReportIdentityClaimed",
    "publicTestRendererSiblingSnapshotIdentityClaimed"
  ]);

export const PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES = freezeUniqueArray([
  ...PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
  "test-renderer-native-bridge-loading",
  "test-renderer-public-unmount",
  "test-renderer-public-unmount-finished-work-identity",
  "test-renderer-nested-source-report-identity",
  "test-renderer-sibling-snapshot-identity"
]);

export const PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
    "packageCompatibilityClaimed",
    "publicSerializationAdmissionClaimed",
    "nativeBridgeLoadingClaimed",
    "nativeBridgeExecutionClaimed",
    "nestedSourceReportIdentityClaimed",
    "siblingSnapshotIdentityClaimed",
    "publicPackageCompatibilityPromotionClaimed"
  ]);

const worker733 = "worker-733-test-renderer-unmount-finished-work-identity";
const worker732 = "worker-732-package-private-admission-audit-729-731";

export const PRIVATE_ADMISSION_732_733_SKIPPED_WORKERS = Object.freeze([
  worker732
]);

export const PRIVATE_ADMISSION_732_733_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    [worker733]: freezeArray([
      "test-renderer-unmount-finished-work-identity-admission",
      "private-unmount-tojson-native-finished-work-identity-validation",
      "private-unmount-totree-native-finished-work-identity-validation",
      "private-unmount-native-cleanup-handoff-id-validation"
    ])
  });

export const PRIVATE_ADMISSION_732_733_REQUIRED_DEPENDENCIES = freezeRecord({
  [worker733]: freezeArray([
    "worker-728-test-renderer-unmount-native-identity-argument-guard",
    "worker-730-test-renderer-unmount-native-cleanup-evidence"
  ])
});

export const PRIVATE_ADMISSION_732_733_REQUIRED_DEPENDENCY_DIAGNOSTICS =
  freezeRecord({
    [worker733]: freezeArray([
      "test-renderer-unmount-native-identity-argument-guard",
      "private-unmount-native-serialization-rejects-finished-work-identity-evidence",
      "test-renderer-unmount-native-ref-passive-cleanup-evidence",
      "private-unmount-native-cleanup-handoff-ref-passive-host-proof"
    ])
  });

export const PRIVATE_ADMISSION_732_733_REQUIRED_BLOCKER_CONTEXT = freezeRecord({
  [worker733]: freezeArray([
    "worker-731-tojson-nested-update-native-identity",
    worker732
  ])
});

export const PRIVATE_ADMISSION_732_733_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS =
  freezeRecord({
    [worker733]: freezeArray([
      "private-nested-tojson-update-native-finished-work-identity-validation",
      "private-admission-729-731-local-gate-1",
      "recognized-accepted-private-diagnostics-729-731-public-compatibility-blocked"
    ])
  });

export const PRIVATE_ADMISSION_732_733_REQUIRED_PRIOR_LEDGER_CONTEXT =
  freezeRecord({
    [worker733]: freezeArray([
      "worker-732-package-private-admission-audit-729-731",
      "private-admission-729-731-local-gate-1",
      "worker-730-test-renderer-unmount-native-cleanup-evidence",
      "worker-731-tojson-nested-update-native-identity",
      "recognized-accepted-private-diagnostics-729-731-public-compatibility-blocked"
    ])
  });

export const PRIVATE_ADMISSION_732_733_REQUIRED_IDENTITY_BINDINGS =
  freezeRecord({
    [worker733]: freezeRecord({
      unmountRootBound: true,
      updateSequenceBound: true,
      unmountLifecycleBound: true,
      renderCommitHandlesBound: true,
      finishedLanesBound: true,
      emptyRootRowBound: true,
      deletionHandoffBound: true,
      cleanupHandoffBound: true
    })
  });

export const PRIVATE_ADMISSION_732_733_REQUIRED_CLEANUP_HANDOFF_VALIDATION =
  freezeRecord({
    [worker733]: freezeRecord({
      deletionHandoffIdValidated: true,
      cleanupHandoffIdValidated: true,
      toJSONRejectsTamperedCleanupHandoffId: true,
      toTreeRejectsTamperedCleanupHandoffId: true
    })
  });

const skippedRowData732733 = Object.freeze([
  skippedRowData({
    workerId: worker732,
    area: "previous private-admission ledger audit for Workers 729-731",
    skipReason: "prior-ledger-context-no-new-runtime-capability",
    evidenceRows: [
      evidenceData({
        role: "worker-732-prior-ledger-report",
        path: "worker-progress/worker-732-package-private-admission-audit-729-731.md",
        tokens: [
          "# Worker 732: Package Private Admission Audit 729-731",
          "Added the static private-admission ledger/audit for Workers 729-731.",
          "Recorded Worker 730 as accepted private Rust unmount native cleanup evidence",
          "Recorded Worker 731 as accepted private Rust nested `toJSON` update native",
          "This is static conformance evidence only."
        ]
      }),
      evidenceData({
        role: "worker-732-prior-ledger-source",
        path: "tests/conformance/src/private-admission-729-731-gate.mjs",
        tokens: [
          "PRIVATE_ADMISSION_729_731_GATE_ID",
          "recognized-accepted-private-diagnostics-729-731-public-compatibility-blocked",
          "worker-730-test-renderer-unmount-native-cleanup-evidence",
          "worker-731-tojson-nested-update-native-identity",
          "publicTestRendererJSFacadeAdmissionClaimed",
          "publicTestRendererCJSFacadeAdmissionClaimed",
          "publicTestRendererSiblingSnapshotIdentityAdmissionClaimed"
        ]
      }),
      evidenceData({
        role: "worker-732-prior-ledger-test",
        path: "tests/conformance/test/private-admission-729-731-gate.test.mjs",
        tokens: [
          "private admission 729-731 gate recognizes accepted private evidence without public compatibility",
          "private admission 729-731 gate rejects blocked admission claim leaks",
          "private admission 729-731 gate rejects public surface promotion leaks"
        ]
      })
    ]
  })
]);

const rowData732733 = Object.freeze([
  rowData({
    workerId: worker733,
    area: "react-test-renderer Rust-only private unmount finished-work identity admission for toJSON and toTree native diagnostics",
    primaryCompatibilityArea:
      "test-renderer-unmount-finished-work-identity-native-diagnostics",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_732_733_REQUIRED_ACCEPTED_DIAGNOSTICS[worker733],
    dependencyWorkerIds: PRIVATE_ADMISSION_732_733_REQUIRED_DEPENDENCIES[
      worker733
    ],
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
    evidenceRows: [
      evidenceData({
        role: "worker-733-unmount-identity-report",
        path: "worker-progress/worker-733-test-renderer-unmount-finished-work-identity.md",
        tokens: [
          "# Worker 733 Progress",
          "Added dedicated unmount finished-work identity gates for private `toJSON` and `toTree` diagnostics",
          "deletion/cleanup handoff validation",
          "reject stale `cleanup_handoff_id` values",
          "Public, native, JS, and package compatibility remain blocked by diagnostics flags",
          "no JS/CJS, package, conformance, or manifest files were edited"
        ]
      }),
      evidenceData({
        role: "worker-733-unmount-identity-builder-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn describe_private_unmount_serialization_finished_work_identity_gate_for_canary(",
        sliceEnd:
          "clippy::too_many_arguments,\n        reason = \"private test-instance evidence builder mirrors the native query report shape\"",
        tokens: [
          "fn describe_private_unmount_serialization_finished_work_identity_gate_for_canary(",
          "self.validate_private_unmount_native_bridge_handoff_for_canary(scheduled_update, handoff)?;",
          "row.host_output_shape() != TestRendererPrivateToJsonHostOutputShape::EmptyRoot",
          "reason: \"unmount-handoff-finished-work-mismatch\"",
          "commit_current_matches_render_finished_work: true",
          "consumes_committed_host_root_finished_work_identity: true",
          "public_serialization_available: false",
          "compatibility_claimed: false"
        ]
      }),
      evidenceData({
        role: "worker-733-tojson-unmount-cleanup-handoff-id-validation-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn validate_private_to_json_unmount_native_execution_record_for_canary(",
        sliceEnd: "fn private_to_json_native_execution_record_error<T>(",
        tokens: [
          "fn validate_private_to_json_unmount_native_execution_record_for_canary(",
          "execution.deletion_commit_handoff_id()\n                != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID",
          "execution.cleanup_handoff_id()\n                != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID",
          "private_to_json_native_execution_record_error(\"unmount\", \"route-metadata-stale\")"
        ]
      }),
      evidenceData({
        role: "worker-733-totree-unmount-cleanup-handoff-id-validation-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn validate_private_to_tree_unmount_native_execution_record_for_canary(",
        sliceEnd: "fn private_to_tree_native_execution_record_error<T>(",
        tokens: [
          "fn validate_private_to_tree_unmount_native_execution_record_for_canary(",
          "execution.deletion_commit_handoff_id()\n                != TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID",
          "execution.cleanup_handoff_id()\n                != TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID",
          "private_to_tree_native_execution_record_error(\"unmount\", \"route-metadata-stale\")"
        ]
      }),
      evidenceData({
        role: "worker-733-unmount-binding-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn validate_private_unmount_native_execution_matches_handoff_for_canary(",
        sliceEnd: "fn validate_private_to_json_create_native_execution_record_for_canary(",
        tokens: [
          "fn validate_private_unmount_native_execution_matches_handoff_for_canary(",
          "execution.scheduled_update_sequence() != self.scheduled_updates.len()",
          "identity.root_scheduled_update_sequence() != self.scheduled_updates.len()",
          "execution.lifecycle() != TestRendererRootLifecycle::UnmountScheduled",
          "execution.render_current() != fiber_handle!(render.current())",
          "execution.render_finished_work() != fiber_handle!(render.finished_work())",
          "execution.commit_previous_current() != fiber_handle!(commit.previous_current())",
          "execution.commit_current() != fiber_handle!(commit.current())",
          "execution.render_lanes_bits() != identity.render_lanes_bits()",
          "execution.commit_finished_lanes_bits() != identity.commit_finished_lanes_bits()",
          "output.deleted_fibers().host_root() != commit.current()"
        ]
      }),
      evidenceData({
        role: "worker-733-tojson-unmount-native-identity-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate()",
        sliceEnd:
          "fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate()",
        tokens: [
          "fn root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate()",
          "describe_private_to_json_after_unmount_native_execution_for_canary",
          "reason: \"finished-work-identity-missing\"",
          "reason: \"unmount-admission-finished-work-identity-mismatch\"",
          "reason: \"finished-work-identity-public-surface-mismatch\"",
          "reason: \"public-or-native-compatibility-claim\""
        ]
      }),
      evidenceData({
        role: "worker-733-tojson-unmount-cleanup-handoff-tamper-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate()",
        sliceEnd:
          "fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate()",
        tokens: [
          "fn root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate()",
          "cleanup_handoff_admission.cleanup_handoff_id = \"tampered-cleanup-handoff\";",
          "panic!(\"expected private JSON unmount native execution cleanup handoff rejection\");",
          "TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch",
          "operation: \"unmount\"",
          "reason: \"route-metadata-stale\""
        ]
      }),
      evidenceData({
        role: "worker-733-totree-unmount-native-identity-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate()",
        sliceEnd:
          "fn root_private_to_json_nested_host_output_update_row_records_nested_text_rows()",
        tokens: [
          "fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate()",
          "describe_private_to_tree_after_unmount_native_execution_for_canary",
          "TreeNativeExecutionRecordMismatch",
          "reason: \"finished-work-identity-missing\"",
          "reason: \"finished-work-identity-source-report-mismatch\"",
          "reason: \"public-or-native-compatibility-claim\""
        ]
      }),
      evidenceData({
        role: "worker-733-totree-unmount-cleanup-handoff-tamper-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate()",
        sliceEnd:
          "fn root_private_to_json_nested_host_output_update_row_records_nested_text_rows()",
        tokens: [
          "fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate()",
          "cleanup_handoff_admission.cleanup_handoff_id = \"tampered-cleanup-handoff\";",
          "panic!(\"expected private toTree unmount native execution cleanup handoff rejection\");",
          "TestRendererPrivateJsonSerializationError::TreeNativeExecutionRecordMismatch",
          "operation: \"unmount\"",
          "reason: \"route-metadata-stale\""
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_732_733_SKIPPED_ROWS = freezeArray(
  skippedRowData732733.map((sourceRow) =>
    skippedRow({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      skipReason: sourceRow.skipReason,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_732_733_ROWS = freezeArray(
  rowData732733.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      dependencyWorkerIds: sourceRow.dependencyWorkerIds,
      dependencyDiagnosticIds: sourceRow.dependencyDiagnosticIds,
      blockerContextWorkerIds: sourceRow.blockerContextWorkerIds,
      blockerContextDiagnosticIds: sourceRow.blockerContextDiagnosticIds,
      priorLedgerContext: sourceRow.priorLedgerContext,
      identityBindings: sourceRow.identityBindings,
      cleanupHandoffValidation: sourceRow.cleanupHandoffValidation,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_732_733_WORKERS = freezeArray(
  PRIVATE_ADMISSION_732_733_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission732733Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_732_733_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const skippedRows = PRIVATE_ADMISSION_732_733_SKIPPED_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, skippedRowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const evaluatedSkippedRows = skippedRows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const allRows = [...evaluatedRows, ...evaluatedSkippedRows];

  const manifestWorkerIds = rows.map((row) => row.workerId);
  const skippedManifestWorkerIds = skippedRows.map((row) => row.workerId);
  const manifest = {
    workerIds: freezeArray(manifestWorkerIds),
    skippedWorkerIds: freezeArray(skippedManifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_732_733_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_732_733_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    ),
    missingSkippedWorkerIds: freezeArray(
      PRIVATE_ADMISSION_732_733_SKIPPED_WORKERS.filter(
        (workerId) => !skippedManifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedSkippedWorkerIds: freezeArray(
      skippedManifestWorkerIds.filter(
        (workerId) =>
          !PRIVATE_ADMISSION_732_733_SKIPPED_WORKERS.includes(workerId)
      )
    ),
    duplicateSkippedWorkerIds: freezeArray(
      skippedManifestWorkerIds.filter(
        (workerId, index) => skippedManifestWorkerIds.indexOf(workerId) !== index
      )
    )
  };

  const evidenceTokenMismatches = allRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          readError: evidenceRow.readError
        })
      )
  );
  const acceptedDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_732_733_REQUIRED_ACCEPTED_DIAGNOSTICS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds",
    predicate: (row, expected, actual) =>
      row.privateAdmission === "accepted-private-diagnostic" &&
      sameStringSet(expected, actual)
  });
  const dependencyMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_732_733_REQUIRED_DEPENDENCIES,
    actualKey: "dependencyWorkerIds",
    expectedKey: "expectedDependencyWorkerIds",
    actualKeyForViolation: "actualDependencyWorkerIds"
  });
  const dependencyDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_732_733_REQUIRED_DEPENDENCY_DIAGNOSTICS,
    actualKey: "dependencyDiagnosticIds",
    expectedKey: "expectedDependencyDiagnosticIds",
    actualKeyForViolation: "actualDependencyDiagnosticIds"
  });
  const blockerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_732_733_REQUIRED_BLOCKER_CONTEXT,
    actualKey: "blockerContextWorkerIds",
    expectedKey: "expectedBlockerContextWorkerIds",
    actualKeyForViolation: "actualBlockerContextWorkerIds"
  });
  const blockerContextDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_732_733_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
    actualKey: "blockerContextDiagnosticIds",
    expectedKey: "expectedBlockerContextDiagnosticIds",
    actualKeyForViolation: "actualBlockerContextDiagnosticIds"
  });
  const priorLedgerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_732_733_REQUIRED_PRIOR_LEDGER_CONTEXT,
    actualKey: "priorLedgerContext",
    expectedKey: "expectedPriorLedgerContext",
    actualKeyForViolation: "actualPriorLedgerContext"
  });
  const identityBindingMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_732_733_REQUIRED_IDENTITY_BINDINGS,
    actualKey: "identityBindings",
    expectedKey: "expectedIdentityBindings",
    actualKeyForViolation: "actualIdentityBindings"
  });
  const cleanupHandoffValidationMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_732_733_REQUIRED_CLEANUP_HANDOFF_VALIDATION,
    actualKey: "cleanupHandoffValidation",
    expectedKey: "expectedCleanupHandoffValidation",
    actualKeyForViolation: "actualCleanupHandoffValidation"
  });
  const publicCompatibilityClaimKeyMismatches = allRows.flatMap((row) => {
    const actualClaimIds = Object.keys(row.publicCompatibilityClaims ?? {});
    if (
      sameStringSet(
        PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS,
        actualClaimIds
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicCompatibilityClaims:
          PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS,
        actualPublicCompatibilityClaims: freezeArray(actualClaimIds)
      })
    ];
  });
  const blockedSurfaceMismatches = allRows.flatMap((row) => {
    const actualBlockedSurfaces = row.blockedPublicCompatibilitySurfaces ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
        actualBlockedSurfaces
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
        actualBlockedPublicCompatibilitySurfaces: freezeArray(
          actualBlockedSurfaces
        )
      })
    ];
  });
  const blockedPublicClaimMismatches = allRows.flatMap((row) => {
    const actualBlockedClaims = row.blockedPublicClaims ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicClaims:
          PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedPublicClaims: freezeArray(actualBlockedClaims)
      })
    ];
  });
  const blockedAdmissionClaimMismatches = allRows.flatMap((row) => {
    const actualBlockedAdmissionClaims = row.blockedAdmissionClaimIds ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedAdmissionClaims:
          PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims: freezeArray(actualBlockedAdmissionClaims)
      })
    ];
  });

  const skippedRuntimeCapabilityWorkerIds = evaluatedSkippedRows
    .filter(
      (row) =>
        row.privateAdmission !== "skipped-meta" ||
        row.runtimeCapabilityAdded !== false ||
        (row.acceptedDiagnosticIds ?? []).length !== 0
    )
    .map((row) => row.workerId);
  const compatibilityClaimWorkerIds = allRows
    .filter((row) => row.compatibilityClaimed !== false)
    .map((row) => row.workerId);
  const promotionLeakWorkerIds = allRows
    .filter((row) => {
      if (row.privateAdmission === "skipped-meta") {
        return row.promotion !== "not-applicable";
      }
      return row.promotion !== "rejected";
    })
    .map((row) => row.workerId);
  const publicCompatibilityViolations = allRows.flatMap((row) =>
    row.publicCompatibilityViolations.map((claimId) => `${row.workerId}.${claimId}`)
  );
  const blockedAdmissionClaimViolations = allRows.flatMap((row) =>
    row.blockedAdmissionClaimViolations.map((claimId) => `${row.workerId}.${claimId}`)
  );
  const nativeJsPackageLeakClaimIds = blockedAdmissionClaimViolations.filter(
    (claimId) =>
      /(?:packageCompatibilityClaimed|jsFacadeAdmissionClaimed|cjsFacadeAdmissionClaimed|nativeBridgeLoadingClaimed|nativeBridgeExecutionClaimed|nativeExecutionAdmissionClaimed)$/.test(
        claimId
      )
  );
  const unrecognizedWorkerIds = evaluatedRows
    .filter((row) => row.privateAdmission !== "accepted-private-diagnostic")
    .map((row) => row.workerId);
  const unrecognizedSkippedWorkerIds = evaluatedSkippedRows
    .filter((row) => row.privateAdmission !== "skipped-meta")
    .map((row) => row.workerId);

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("accepted-private-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  if (
    manifest.missingSkippedWorkerIds.length > 0 ||
    manifest.unexpectedSkippedWorkerIds.length > 0 ||
    manifest.duplicateSkippedWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("skipped-meta-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingSkippedWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedSkippedWorkerIds,
        duplicateWorkerIds: manifest.duplicateSkippedWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-evidence-token-missing",
    evidenceTokenMismatches
  );
  pushIdsViolation(
    violations,
    "required-private-diagnostic-not-recognized",
    unrecognizedWorkerIds
  );
  pushIdsViolation(
    violations,
    "required-skip-meta-row-not-recognized",
    unrecognizedSkippedWorkerIds
  );
  pushIdsViolation(
    violations,
    "skip-meta-row-claimed-runtime-capability",
    skippedRuntimeCapabilityWorkerIds
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-id-mismatch",
    acceptedDiagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-dependency-mismatch",
    dependencyMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-dependency-diagnostic-mismatch",
    dependencyDiagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-blocker-context-mismatch",
    blockerContextMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-blocker-context-diagnostic-mismatch",
    blockerContextDiagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "prior-private-admission-ledger-context-mismatch",
    priorLedgerContextMismatches
  );
  pushRowsViolation(
    violations,
    "unmount-finished-work-identity-binding-mismatch",
    identityBindingMismatches
  );
  pushRowsViolation(
    violations,
    "unmount-cleanup-handoff-validation-mismatch",
    cleanupHandoffValidationMismatches
  );
  pushRowsViolation(
    violations,
    "public-compatibility-claim-key-mismatch",
    publicCompatibilityClaimKeyMismatches
  );
  pushRowsViolation(
    violations,
    "blocked-public-compatibility-surface-mismatch",
    blockedSurfaceMismatches
  );
  pushRowsViolation(
    violations,
    "blocked-public-claim-mismatch",
    blockedPublicClaimMismatches
  );
  pushRowsViolation(
    violations,
    "blocked-admission-claim-mismatch",
    blockedAdmissionClaimMismatches
  );
  pushIdsViolation(
    violations,
    "private-diagnostic-claimed-compatibility",
    compatibilityClaimWorkerIds
  );
  pushClaimIdsViolation(
    violations,
    "public-compatibility-claim-detected",
    publicCompatibilityViolations
  );
  pushClaimIdsViolation(
    violations,
    "blocked-admission-claim-detected",
    blockedAdmissionClaimViolations
  );
  pushClaimIdsViolation(
    violations,
    "native-js-package-compatibility-leak-detected",
    nativeJsPackageLeakClaimIds
  );
  pushIdsViolation(
    violations,
    "private-diagnostic-public-promotion-leak",
    promotionLeakWorkerIds
  );

  const evidenceRecognized = evidenceTokenMismatches.length === 0;
  const acceptedDiagnosticsRecognized =
    acceptedDiagnosticMismatches.length === 0 && unrecognizedWorkerIds.length === 0;
  const dependenciesRecognized =
    dependencyMismatches.length === 0 &&
    dependencyDiagnosticMismatches.length === 0;
  const blockerContextRecognized =
    blockerContextMismatches.length === 0 &&
    blockerContextDiagnosticMismatches.length === 0;
  const priorLedgerContextRecognized =
    priorLedgerContextMismatches.length === 0 &&
    manifest.missingSkippedWorkerIds.length === 0 &&
    manifest.unexpectedSkippedWorkerIds.length === 0 &&
    manifest.duplicateSkippedWorkerIds.length === 0;
  const unmountIdentityBindingsRecognized =
    identityBindingMismatches.length === 0;
  const cleanupHandoffValidationRecognized =
    cleanupHandoffValidationMismatches.length === 0;
  const blockedPublicSurfacesRecognized =
    blockedSurfaceMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicCompatibilityClaimKeyMismatches.length === 0 &&
    blockedPublicClaimMismatches.length === 0 &&
    publicCompatibilityViolations.length === 0;
  const blockedAdmissionClaimsRecognized =
    blockedAdmissionClaimMismatches.length === 0 &&
    blockedAdmissionClaimViolations.length === 0;
  const skipMetaRecognized =
    skippedRuntimeCapabilityWorkerIds.length === 0 &&
    unrecognizedSkippedWorkerIds.length === 0;
  const compatibilityClaimed =
    compatibilityClaimWorkerIds.length > 0 ||
    publicCompatibilityViolations.length > 0 ||
    blockedAdmissionClaimViolations.length > 0 ||
    promotionLeakWorkerIds.length > 0;
  const publicCompatibilityClaimed = publicCompatibilityViolations.length > 0;
  const privateDiagnosticsRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    acceptedDiagnosticsRecognized &&
    dependenciesRecognized &&
    blockerContextRecognized &&
    priorLedgerContextRecognized &&
    evidenceRecognized &&
    unmountIdentityBindingsRecognized &&
    cleanupHandoffValidationRecognized &&
    blockedPublicSurfacesRecognized &&
    blockedPublicClaimsRecognized &&
    blockedAdmissionClaimsRecognized &&
    skipMetaRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_732_733_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_732_733_GATE_STATUS
      : PRIVATE_ADMISSION_732_733_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    skipMetaRecognized,
    acceptedDiagnosticsRecognized,
    dependenciesRecognized,
    blockerContextRecognized,
    priorLedgerContextRecognized,
    evidenceRecognized,
    unmountIdentityBindingsRecognized,
    cleanupHandoffValidationRecognized,
    blockedPublicSurfacesRecognized,
    blockedPublicClaimsRecognized,
    blockedAdmissionClaimsRecognized,
    compatibilityClaimed,
    publicCompatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_732_733_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_732_733_SKIPPED_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => row.privateAdmission === "accepted-private-diagnostic")
        .map((row) => row.workerId)
    ),
    recognizedSkippedWorkerIds: freezeArray(
      evaluatedSkippedRows
        .filter((row) => row.privateAdmission === "skipped-meta")
        .map((row) => row.workerId)
    ),
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolationIds: freezeArray(
      blockedAdmissionClaimViolations
    ),
    nativeJsPackageLeakClaimIds: freezeArray(nativeJsPackageLeakClaimIds),
    manifest: freezeRecord(manifest),
    rows: freezeArray(evaluatedRows),
    skippedRows: freezeArray(evaluatedSkippedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    skippedRowsByWorker: indexRowsByWorker(evaluatedSkippedRows),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    acceptedDiagnosticIds: freezeArray(data.acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(data.dependencyWorkerIds ?? []),
    dependencyDiagnosticIds: freezeArray(data.dependencyDiagnosticIds ?? []),
    blockerContextWorkerIds: freezeArray(data.blockerContextWorkerIds ?? []),
    blockerContextDiagnosticIds: freezeArray(
      data.blockerContextDiagnosticIds ?? []
    ),
    priorLedgerContext: freezeArray(data.priorLedgerContext ?? []),
    identityBindings: freezeRecord(data.identityBindings ?? {}),
    cleanupHandoffValidation: freezeRecord(data.cleanupHandoffValidation ?? {}),
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function skippedRowData(data) {
  return freezeRecord({
    ...data,
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function evidenceData({
  role,
  path,
  tokens,
  sliceStart = null,
  sliceEnd = null
}) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens),
    sliceStart,
    sliceEnd
  });
}

function admissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function blockedAdmissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function row({
  workerId,
  area,
  primaryCompatibilityArea,
  acceptedDiagnosticIds,
  dependencyWorkerIds,
  dependencyDiagnosticIds,
  blockerContextWorkerIds,
  blockerContextDiagnosticIds,
  priorLedgerContext,
  identityBindings,
  cleanupHandoffValidation,
  evidence,
  publicCompatibilityClaims,
  privateAdmissionClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "732-733",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-732-733-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(dependencyWorkerIds),
    dependencyDiagnosticIds: freezeArray(dependencyDiagnosticIds),
    blockerContextWorkerIds: freezeArray(blockerContextWorkerIds),
    blockerContextDiagnosticIds: freezeArray(blockerContextDiagnosticIds),
    priorLedgerContext: freezeArray(priorLedgerContext),
    identityBindings: freezeRecord(identityBindings),
    cleanupHandoffValidation: freezeRecord(cleanupHandoffValidation),
    evidence: freezeArray(evidence),
    runtimeCapabilityAdded: true,
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims)),
    blockedAdmissionClaims: freezeRecord(privateAdmissionClaims),
    blockedAdmissionClaimIds: freezeArray(Object.keys(privateAdmissionClaims))
  });
}

function skippedRow({
  workerId,
  area,
  skipReason,
  evidence,
  publicCompatibilityClaims,
  privateAdmissionClaims
}) {
  return freezeRecord({
    workerId,
    area,
    skipReason,
    sourceQueue: "732-733",
    privateAdmission: "skipped-meta",
    localGateCoverage: "private-admission-732-733-local-gate",
    acceptedDiagnosticIds: freezeArray([]),
    dependencyWorkerIds: freezeArray([]),
    dependencyDiagnosticIds: freezeArray([]),
    blockerContextWorkerIds: freezeArray([]),
    blockerContextDiagnosticIds: freezeArray([]),
    priorLedgerContext: freezeArray([]),
    identityBindings: freezeRecord({}),
    cleanupHandoffValidation: freezeRecord({}),
    evidence: freezeArray(evidence),
    runtimeCapabilityAdded: false,
    compatibilityClaimed: false,
    promotion: "not-applicable",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims)),
    blockedAdmissionClaims: freezeRecord(privateAdmissionClaims),
    blockedAdmissionClaimIds: freezeArray(Object.keys(privateAdmissionClaims))
  });
}

function mergeRowOverride(row, override) {
  if (override == null || Object.keys(override).length === 0) {
    return row;
  }

  const merged = { ...row, ...override };
  const arrayKeys = [
    "acceptedDiagnosticIds",
    "dependencyWorkerIds",
    "dependencyDiagnosticIds",
    "blockerContextWorkerIds",
    "blockerContextDiagnosticIds",
    "priorLedgerContext",
    "blockedPublicCompatibilitySurfaces",
    "blockedPublicClaims",
    "blockedAdmissionClaimIds",
    "evidence"
  ];
  for (const key of arrayKeys) {
    if (Object.hasOwn(override, key)) {
      merged[key] = freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "publicCompatibilityClaims")) {
    merged.publicCompatibilityClaims = freezeRecord({
      ...row.publicCompatibilityClaims,
      ...override.publicCompatibilityClaims
    });
  }
  if (Object.hasOwn(override, "blockedAdmissionClaims")) {
    merged.blockedAdmissionClaims = freezeRecord({
      ...row.blockedAdmissionClaims,
      ...override.blockedAdmissionClaims
    });
  }
  if (Object.hasOwn(override, "identityBindings")) {
    merged.identityBindings = freezeRecord({
      ...row.identityBindings,
      ...override.identityBindings
    });
  }
  if (Object.hasOwn(override, "cleanupHandoffValidation")) {
    merged.cleanupHandoffValidation = freezeRecord({
      ...row.cleanupHandoffValidation,
      ...override.cleanupHandoffValidation
    });
  }

  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot })
  );
  const publicCompatibilityViolations = Object.entries(
    row.publicCompatibilityClaims ?? {}
  )
    .filter(([, claimed]) => claimed !== false)
    .map(([claimId]) => claimId);
  const blockedAdmissionClaimViolations = Object.entries(
    row.blockedAdmissionClaims ?? {}
  )
    .filter(([, claimed]) => claimed !== false)
    .map(([claimId]) => claimId);

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceRecognized: evidence.every(
      (evidenceRow) => evidenceRow.recognized === true
    ),
    publicCompatibilityViolations: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolations: freezeArray(
      blockedAdmissionClaimViolations
    )
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const fileText = readWorkspaceFile({
    fileCache,
    path: evidenceRow.path,
    workspaceRoot
  });
  const sourceText =
    fileText.ok === true
      ? extractEvidenceSourceSlice({
          text: fileText.value,
          sliceStart: evidenceRow.sliceStart,
          sliceEnd: evidenceRow.sliceEnd
        })
      : fileText;
  const missingTokens =
    sourceText.ok === true
      ? evidenceRow.tokens.filter((token) => !sourceText.value.includes(token))
      : evidenceRow.tokens;

  return freezeRecord({
    ...evidenceRow,
    recognized: sourceText.ok === true && missingTokens.length === 0,
    missingTokens: freezeArray(missingTokens),
    readError: fileText.ok === true ? null : fileText.error,
    sliceError: sourceText.ok === true ? null : sourceText.error
  });
}

function extractEvidenceSourceSlice({ text, sliceStart, sliceEnd }) {
  if (sliceStart == null && sliceEnd == null) {
    return freezeRecord({ ok: true, value: text });
  }

  const startIndex = sliceStart == null ? 0 : text.indexOf(sliceStart);
  if (startIndex < 0) {
    return freezeRecord({
      ok: false,
      error: `slice-start-not-found: ${sliceStart}`
    });
  }

  const endSearchIndex =
    sliceStart == null ? startIndex : startIndex + sliceStart.length;
  const endIndex =
    sliceEnd == null ? text.length : text.indexOf(sliceEnd, endSearchIndex);
  if (endIndex < 0) {
    return freezeRecord({
      ok: false,
      error: `slice-end-not-found: ${sliceEnd}`
    });
  }

  return freezeRecord({
    ok: true,
    value: text.slice(startIndex, endIndex)
  });
}

function readWorkspaceFile({ fileCache, path, workspaceRoot }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  let result;
  try {
    result = freezeRecord({
      ok: true,
      value: readFileSync(join(workspaceRoot, path), "utf8")
    });
  } catch (error) {
    result = freezeRecord({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
  fileCache.set(path, result);
  return result;
}

function compareRequiredArrayByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation,
  predicate = (_row, expected, actual) => sameStringSet(expected, actual)
}) {
  return rows.flatMap((row) => {
    if (!Object.hasOwn(requiredByWorker, row.workerId)) {
      return [];
    }
    const expected = requiredByWorker[row.workerId];
    const actual = row[actualKey] ?? [];
    if (predicate(row, expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: expected,
        [actualKeyForViolation]: freezeArray(actual)
      })
    ];
  });
}

function compareRequiredRecordByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    if (!Object.hasOwn(requiredByWorker, row.workerId)) {
      return [];
    }
    const expected = requiredByWorker[row.workerId];
    const actual = row[actualKey] ?? {};
    if (sameBooleanRecord(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: expected,
        [actualKeyForViolation]: freezeRecord(actual)
      })
    ];
  });
}

function sameStringSet(expected, actual) {
  if (expected.length !== actual.length) {
    return false;
  }
  return expected.every((value) => actual.includes(value));
}

function sameBooleanRecord(expected, actual) {
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);
  if (!sameStringSet(expectedKeys, actualKeys)) {
    return false;
  }
  return expectedKeys.every((key) => actual[key] === expected[key]);
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(createViolation(id, { rows: freezeArray(rows) }));
  }
}

function pushIdsViolation(violations, id, workerIds) {
  if (workerIds.length > 0) {
    violations.push(createViolation(id, { workerIds: freezeArray(workerIds) }));
  }
}

function pushClaimIdsViolation(violations, id, claimIds) {
  if (claimIds.length > 0) {
    violations.push(createViolation(id, { claimIds: freezeArray(claimIds) }));
  }
}

function createViolation(id, details) {
  return freezeRecord({
    id,
    ...details
  });
}

function indexRowsByWorker(rows) {
  return freezeRecord(
    Object.fromEntries(rows.map((row) => [row.workerId, row]))
  );
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeUniqueArray(values) {
  return freezeArray(new Set(values));
}

function freezeRecord(record) {
  return Object.freeze(record);
}
