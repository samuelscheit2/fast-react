import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_820_GATE_ID =
  "private-admission-820-reconciler-managed-child-finished-lanes-ledger-1";
export const PRIVATE_ADMISSION_820_GATE_STATUS =
  "recognized-accepted-private-reconciler-sibling-order-and-finished-lanes-negatives-public-blocked";
export const PRIVATE_ADMISSION_820_VIOLATION_STATUS =
  "blocked-accepted-private-reconciler-ledger-with-violations";

const worker803 = "worker-803-reconciler-managed-child-sibling-order";
const worker817 = "worker-817-root-work-loop-finished-lanes-negative-matrix";

const completeWorkPath = "crates/fast-react-reconciler/src/complete_work.rs";
const rootCommitPath = "crates/fast-react-reconciler/src/root_commit.rs";
const hostWorkPath = "crates/fast-react-reconciler/src/host_work.rs";
const rootWorkLoopPath = "crates/fast-react-reconciler/src/root_work_loop.rs";
const rootSchedulerPath = "crates/fast-react-reconciler/src/root_scheduler.rs";
const schedulerBridgePath =
  "crates/fast-react-reconciler/src/scheduler_bridge.rs";
const syncFlushPath = "crates/fast-react-reconciler/src/sync_flush.rs";

export const PRIVATE_ADMISSION_820_WORKERS = freezeArray([
  worker803,
  worker817
]);

export const PRIVATE_ADMISSION_820_REQUIRED_CAPABILITIES = freezeRecord({
  [worker803]: freezeArray([
    "managed-child-placement-next-sibling-order",
    "managed-child-delete-previous-sibling-order",
    "root-commit-insert-before-validation",
    "root-commit-previous-sibling-validation",
    "host-work-private-insert-before",
    "managed-child-sibling-order-negative-guards",
    "public-dom-test-renderer-broad-traversal-blocked"
  ]),
  [worker817]: freezeArray([
    "root-work-loop-stale-render-metadata-rejected",
    "root-work-loop-finished-lanes-mismatch-rejected",
    "sync-flush-finished-lanes-mismatch-rejected",
    "root-scheduler-finished-lanes-mismatch-rejected",
    "scheduler-act-source-record-required",
    "scheduler-act-fabricated-continuation-rejected",
    "expired-lane-foreign-callback-rejected",
    "root-act-scheduler-public-claims-blocked"
  ])
});

export const PRIVATE_ADMISSION_820_REQUIRED_STATUS_IDENTIFIERS = freezeRecord({
  [worker803]: freezeArray([
    "HostComponentManagedChildMutationKindForCanary::Placement",
    "HostComponentManagedChildMutationKindForCanary::DeleteDetach",
    "HostRootPlacementSiblingStatus::InsertBefore",
    "HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore",
    "HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent",
    "HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation",
    "TestHostRootMutationHostCall::InsertBefore",
    "TestHostRootMutationHostCall::RemoveChild",
    "TestHostRootDeletionCleanupAction::DetachDeletedInstance"
  ]),
  [worker817]: freezeArray([
    "HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseWorkMismatch",
    "HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseLanesMismatch",
    "HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseNotCompleted",
    "HostRootFinishedWorkCommitHandoffErrorForCanary::FinishedWorkRootMetadataMismatch",
    "SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff",
    "RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch",
    "RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode",
    "SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation",
    "SchedulerBridgeActContinuationExecutionStatus::BlockedByLaneMismatch",
    "SchedulerActContinuationStatus::PendingContinuation",
    "SchedulerActContinuationStatus::NoContinuation"
  ])
});

export const PRIVATE_ADMISSION_820_REQUIRED_EVIDENCE_ROLES = freezeRecord({
  [worker803]: freezeArray([
    "worker-803-complete-work-sibling-order-record",
    "worker-803-root-commit-sibling-order-validation",
    "worker-803-root-commit-insert-before-status",
    "worker-803-host-work-sibling-order-execution"
  ]),
  [worker817]: freezeArray([
    "worker-817-root-work-loop-finished-work-metadata-handoff",
    "worker-817-root-work-loop-finished-lanes-negative",
    "worker-817-sync-flush-finished-lanes-negative",
    "worker-817-root-scheduler-finished-lanes-negative",
    "worker-817-scheduler-act-source-record-negative",
    "worker-817-expired-lane-callback-negative"
  ])
});

export const PRIVATE_ADMISSION_820_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicRootRenderingClaimed",
  "publicRootCompatibilityClaimed",
  "rootFacadeCompatibilityClaimed",
  "rootCommitPublicCompatibilityClaimed",
  "publicRendererHostMutationClaimed",
  "reactDomCompatibilityClaimed",
  "reactTestRendererCompatibilityClaimed",
  "broadReconcilerTraversalClaimed",
  "publicActCompatibilityClaimed",
  "drainsPublicReactActQueue",
  "actRuntimeExecutionClaimed",
  "publicSchedulerTimingCompatibilityClaimed",
  "publicSchedulerFlushCompatibilityClaimed",
  "publicSchedulerContinuationClaimed",
  "schedulerRuntimeExecutionClaimed",
  "packageSurfaceChanged",
  "packageCodeExecuted",
  "packageCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "nativeBridgeExecuted",
  "nativeCompatibilityClaimed",
  "nativePackageCompatibilityClaimed",
  "publicCompatibilityClaimed",
  "compatibilityClaimed"
]);

export const PRIVATE_ADMISSION_820_TOP_LEVEL_PUBLIC_CLAIM_FIELDS =
  freezeArray([
    "publicRootRenderingClaimed",
    "publicRootRenderingAvailable",
    "publicRootCompatibilityClaimed",
    "rootFacadeCompatibilityClaimed",
    "rootCommitPublicCompatibilityClaimed",
    "rootCommitCompatibilityClaimed",
    "publicRendererHostMutationClaimed",
    "publicRendererHostMutationAvailable",
    "publicRendererCompatibilityClaimed",
    "reactDomCompatibilityClaimed",
    "reactTestRendererCompatibilityClaimed",
    "broadReconcilerTraversalClaimed",
    "publicActCompatibilityClaimed",
    "publicReactActCompatibilityClaimed",
    "publicReactDomTestUtilsActCompatibilityClaimed",
    "publicAsyncActCompatibilityClaimed",
    "publicSchedulerCompatibilityClaimed",
    "publicSchedulerTaskCompatibilityClaimed",
    "publicRootSchedulerCompatibilityClaimed",
    "publicSchedulerTimingCompatibilityClaimed",
    "publicSchedulerFlushCompatibilityClaimed",
    "publicSchedulerFlushHelperCompatibilityClaimed",
    "publicSchedulerContinuationClaimed",
    "schedulerCompatibilityClaimed",
    "schedulerDelayedActRootAdmissionClaimed",
    "schedulerDelayedRendererRootAdmissionClaimed",
    "packageCompatibilityClaimed",
    "packageSurfaceCompatibilityClaimed",
    "publicPackageCompatibilityClaimed",
    "nativeCompatibilityClaimed",
    "nativePackageCompatibilityClaimed",
    "rootCompatibilityClaimed",
    "actCompatibilityClaimed",
    "publicCompatibilityClaimed",
    "compatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_820_TOP_LEVEL_RUNTIME_CLAIM_FIELDS =
  freezeArray([
    "runtimeExecutionClaimed",
    "rustExecutionClaimed",
    "rootRuntimeExecuted",
    "rootRuntimeExecutionClaimed",
    "rootCommitRuntimeExecutionClaimed",
    "actRuntimeExecuted",
    "actRuntimeExecutionClaimed",
    "schedulerRuntimeExecuted",
    "schedulerRuntimeExecutionClaimed",
    "publicSchedulerFlushBehaviorExecuted",
    "publicSchedulerFlushExecutionAvailable",
    "schedulerRuntimeClaimed",
    "drainsPublicReactActQueue",
    "drainsPublicSchedulerTaskQueue",
    "executesQueuedWork",
    "executesEffects",
    "executesRendererWork",
    "executesRendererRoots",
    "packageSurfaceChanged",
    "packageCodeExecuted",
    "nativeBridgeExecuted"
  ]);

const privateAdmission820Rows = freezeArray([
  row({
    workerId: worker803,
    privateAdmission: "accepted-private-managed-child-sibling-order-handoff",
    area: "managed-child sibling-order handoff evidence",
    rustImplementationPaths: freezeArray([
      completeWorkPath,
      rootCommitPath,
      hostWorkPath
    ]),
    requiredCapabilities:
      PRIVATE_ADMISSION_820_REQUIRED_CAPABILITIES[worker803],
    acceptedStatusIdentifiers:
      PRIVATE_ADMISSION_820_REQUIRED_STATUS_IDENTIFIERS[worker803],
    evidence: freezeArray([
      evidenceData({
        role: "worker-803-complete-work-sibling-order-record",
        path: completeWorkPath,
        tokens: [
          "HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary",
          "host_component_managed_child_sibling_order_complete_work_record_for_canary",
          "validate_managed_child_placement_sibling_order_shape_for_canary",
          "validate_managed_child_deletion_sibling_order_shape_for_canary",
          "order_sibling",
          "order_sibling_tag",
          "order_sibling_state_node",
          "order_sibling_pending_props",
          "order_sibling_memoized_props",
          "order_sibling_alternate",
          "order_sibling_flags",
          "order_evidence_name",
          "with_order_sibling_state_node_for_canary",
          "HostComponentManagedChildCompleteWorkErrorForCanary::ExpectedHostComponentOrderSibling",
          "HostComponentManagedChildCompleteWorkErrorForCanary::OrderSiblingParentMismatch",
          "HostComponentManagedChildCompleteWorkErrorForCanary::MissingOrderSiblingStateNode",
          "HostComponentManagedChildCompleteWorkErrorForCanary::OrderSiblingStillBeingPlaced",
          "HostComponentManagedChildCompleteWorkErrorForCanary::SiblingOrderShapeMismatch"
        ]
      }),
      evidenceData({
        role: "worker-803-root-commit-sibling-order-validation",
        path: rootCommitPath,
        tokens: [
          "HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary",
          "HostRootManagedChildSiblingOrderCommitExecutionRequestForCanary",
          "commit_managed_child_sibling_order_complete_work_handoff_for_canary",
          "validate_managed_child_sibling_order_commit_metadata_for_canary",
          "validate_managed_child_sibling_order_topology",
          "validate_managed_child_sibling_order_mutation_record",
          "validate_managed_child_sibling_order_mutation_source",
          "validate_managed_child_sibling_order_apply_evidence",
          "expected_managed_child_sibling_order_mutation_apply_kind",
          "managed_child_sibling_order_complete_metadata_matches_mutation",
          "HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingMismatch",
          "HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingTagMismatch",
          "HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingStateNodeMismatch",
          "HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingPropsMismatch",
          "HostRootManagedChildCommitHandoffErrorForCanary::MetadataOrderSiblingAlternateMismatch",
          "HostRootManagedChildCommitHandoffErrorForCanary::MetadataPreviousSiblingOrderMismatch",
          "HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS"
        ]
      }),
      evidenceData({
        role: "worker-803-root-commit-insert-before-status",
        path: rootCommitPath,
        tokens: [
          "HostRootPlacementSiblingStatus::InsertBefore",
          "HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore",
          "HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent",
          "HostRootMutationApplyRecordSource::DeletionList",
          "HostRootMutationPhaseRecordKind::Placement",
          "placement_sibling",
          "skipped_pending_sibling_count",
          "can_insert_before",
          "order_sibling_state_node",
          "HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation"
        ]
      }),
      evidenceData({
        role: "worker-803-host-work-sibling-order-execution",
        path: hostWorkPath,
        tokens: [
          "TestHostRootManagedChildSiblingOrderExecutionDiagnosticForCanary",
          "apply_managed_child_sibling_order_complete_work_handoff_for_canary",
          "managed_child_sibling_order_apply_status_matches_kind",
          "TestHostRootMutationHostCall::InsertBefore",
          "TestHostRootMutationHostCall::RemoveChild",
          "TestHostRootDeletionCleanupAction::DetachDeletedInstance",
          "TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS",
          "order_evidence_name",
          "order_sibling",
          "order_sibling_state_node"
        ]
      })
    ])
  }),
  row({
    workerId: worker817,
    privateAdmission: "accepted-private-finished-lanes-handoff-negative-matrix",
    area: "finished-lanes handoff negative evidence",
    rustImplementationPaths: freezeArray([
      rootWorkLoopPath,
      rootCommitPath,
      rootSchedulerPath,
      schedulerBridgePath,
      syncFlushPath
    ]),
    requiredCapabilities:
      PRIVATE_ADMISSION_820_REQUIRED_CAPABILITIES[worker817],
    acceptedStatusIdentifiers:
      PRIVATE_ADMISSION_820_REQUIRED_STATUS_IDENTIFIERS[worker817],
    evidence: freezeArray([
      evidenceData({
        role: "worker-817-root-work-loop-finished-work-metadata-handoff",
        path: rootWorkLoopPath,
        tokens: [
          "HostRootRenderFinishedWorkCommitMetadataHandoffRecord",
          "HostRootRenderFinishedWorkCommitMetadataHandoffError",
          "handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary",
          "validate_completed_host_root_render_for_finished_work_commit_metadata_handoff",
          "records_completed_render_as_root_finished_work",
          "host_mutation_blocked",
          "public_root_rendering_blocked",
          "root_finished_work_before_handoff",
          "root_finished_lanes_before_handoff",
          "root_finished_work_after_handoff",
          "root_finished_lanes_after_handoff",
          "pending_commit",
          "RenderPhaseWorkMismatch",
          "RenderPhaseLanesMismatch",
          "RenderPhaseNotCompleted"
        ]
      }),
      evidenceData({
        role: "worker-817-root-work-loop-finished-lanes-negative",
        path: rootWorkLoopPath,
        tokens: [
          "commit_finished_host_root_with_finished_work_handoff_for_canary",
          "record_host_root_finished_work_pending_commit_for_canary",
          "HostRootFinishedWorkCommitHandoffErrorForCanary::FinishedWorkRootMetadataMismatch",
          "expected_finished_lanes",
          "actual_finished_lanes",
          "root_finished_lanes_before_handoff",
          "root_finished_lanes_after_handoff"
        ]
      }),
      evidenceData({
        role: "worker-817-sync-flush-finished-lanes-negative",
        path: syncFlushPath,
        tokens: [
          "SyncFlushRootCommitContinuationStatusForCanary::RejectedStaleFinishedWorkHandoff",
          "SyncFlushFinishedWorkHandoffIdentityForCanary",
          "commit_sync_flush_root_finished_work_continuation_for_canary",
          "sync_flush_finished_work_handoff_identity_for_canary",
          "accepted_current_finished_work_record_shape",
          "handoff_identity",
          "root_finished_work_before_commit",
          "root_finished_lanes_before_commit",
          "selected_lanes_are_sync_flush_lanes"
        ]
      }),
      evidenceData({
        role: "worker-817-root-scheduler-finished-lanes-negative",
        path: rootSchedulerPath,
        tokens: [
          "RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch",
          "RootSyncSchedulerFinishedWorkHandoffIdentityForCanary",
          "execute_sync_scheduler_continuation_for_render_handoff",
          "root_sync_scheduler_finished_work_handoff_identity_for_canary",
          "accepted_for_root_scheduler_commit_handoff",
          "finished_work_handoff_identity",
          "root_finished_work_before_commit",
          "root_finished_lanes_before_commit",
          "render_phase_lanes_before_commit"
        ]
      }),
      evidenceData({
        role: "worker-817-scheduler-act-source-record-negative",
        path: rootSchedulerPath,
        tokens: [
          "SyncFlushActContinuationDrainRecord",
          "matches_source_act_continuation",
          "execute_scheduler_bridge_act_continuations",
          "execute_scheduler_bridge_act_continuation",
          "SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation",
          "SchedulerBridgeActContinuationExecutionStatus::BlockedByLaneMismatch",
          "rejected_unaccepted_continuation",
          "blocked_by_lane_mismatch",
          "act_continuation_records",
          "source_status",
          "drains_public_react_act_queue",
          "public_act_compatibility_claimed",
          "public_scheduler_timing_compatibility_claimed"
        ]
      }),
      evidenceData({
        role: "worker-817-expired-lane-callback-negative",
        path: rootSchedulerPath,
        tokens: [
          "RootExpiredLaneSyncSchedulerContinuationStatus::StaleCallbackNode",
          "execute_expired_lane_sync_scheduler_continuation_for_root_for_canary",
          "expired_lane_sync_scheduler_status_from_sync_continuation",
          "requested_callback_node",
          "current_callback_node",
          "rejected_stale_callback_node",
          "async_callback_execution_blocked",
          "public_update_scheduling_blocked"
        ]
      })
    ])
  })
]);

export const PRIVATE_ADMISSION_820_ROWS = freezeArray(
  privateAdmission820Rows
);

export function evaluatePrivateAdmission820Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rows = PRIVATE_ADMISSION_820_ROWS,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const evaluatedRows = rows
    .map((baseRow) => mergeRowOverride(baseRow, rowOverrides[baseRow.workerId]))
    .map((rowData) =>
      evaluatePrivateAdmissionRow({ fileCache, row: rowData, workspaceRoot })
    );
  const manifestWorkerIds = evaluatedRows.map((rowData) => rowData.workerId);
  const manifest = manifestForWorkerIds(manifestWorkerIds);

  const evidenceMismatches = evaluatedRows.flatMap((rowData) =>
    rowData.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: rowData.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          unstableEvidenceReasons: evidenceRow.unstableEvidenceReasons,
          readError: evidenceRow.readError
        })
      )
  );
  const evidenceRoleMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_820_REQUIRED_EVIDENCE_ROLES,
    actualForRow: (rowData) => rowData.evidence.map((evidenceRow) => evidenceRow.role),
    expectedKey: "expectedEvidenceRoles",
    actualKey: "actualEvidenceRoles"
  });
  const capabilityMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_820_REQUIRED_CAPABILITIES,
    actualForRow: (rowData) => rowData.requiredCapabilities,
    expectedKey: "expectedRequiredCapabilities",
    actualKey: "actualRequiredCapabilities"
  });
  const statusIdentifierMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_820_REQUIRED_STATUS_IDENTIFIERS,
    actualForRow: (rowData) => rowData.acceptedStatusIdentifiers,
    expectedKey: "expectedAcceptedStatusIdentifiers",
    actualKey: "actualAcceptedStatusIdentifiers"
  });

  const publicBlockerFieldMismatches = evaluatedRows.flatMap((rowData) => {
    const actualKeys = Object.keys(rowData.publicBlockerClaims ?? {});
    if (sameStringSet(PRIVATE_ADMISSION_820_PUBLIC_BLOCKER_FIELDS, actualKeys)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: rowData.workerId,
        expectedPublicBlockerFields: PRIVATE_ADMISSION_820_PUBLIC_BLOCKER_FIELDS,
        actualPublicBlockerFields: freezeArray(actualKeys)
      })
    ];
  });
  const publicClaimViolationIds = evaluatedRows.flatMap((rowData) =>
    [
      ...Object.entries(rowData.publicBlockerClaims ?? {})
        .filter(([, claimed]) => claimed !== false)
        .map(([claimId]) => `${rowData.workerId}.${claimId}`),
      ...PRIVATE_ADMISSION_820_TOP_LEVEL_PUBLIC_CLAIM_FIELDS.filter(
        (field) => rowData[field] !== false
      ).map((field) => `${rowData.workerId}.${field}`)
    ]
  );
  const runtimeExecutionClaimViolationIds = evaluatedRows.flatMap((rowData) =>
    PRIVATE_ADMISSION_820_TOP_LEVEL_RUNTIME_CLAIM_FIELDS
      .filter((field) => rowData[field] !== false)
      .map((field) => `${rowData.workerId}.${field}`)
  );
  const staticReadOnlyViolationIds = evaluatedRows
    .filter(
      (rowData) =>
        rowData.privateEvidenceOnly !== true ||
        rowData.sourceTokenChecksOnly !== true ||
        rowData.manifestEvaluationOnly !== true ||
        PRIVATE_ADMISSION_820_TOP_LEVEL_RUNTIME_CLAIM_FIELDS.some(
          (field) => rowData[field] !== false
        ) ||
        rowData.ledgerEvaluationMode !== "source-token-checks-and-manifest-only"
    )
    .map((rowData) => rowData.workerId);
  const publicCompatibilityClaimIds = evaluatedRows.flatMap((rowData) =>
    PRIVATE_ADMISSION_820_TOP_LEVEL_PUBLIC_CLAIM_FIELDS
      .filter((field) => rowData[field] !== false)
      .map((field) => `${rowData.workerId}.${field}`)
  );

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("private-admission-820-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-820-evidence-role-mismatch",
    evidenceRoleMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-820-evidence-token-missing-or-unstable",
    evidenceMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-820-capability-mismatch",
    capabilityMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-820-status-identifier-mismatch",
    statusIdentifierMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-820-public-blocker-field-mismatch",
    publicBlockerFieldMismatches
  );
  pushIdsViolation(
    violations,
    "private-admission-820-public-claim-detected",
    publicClaimViolationIds
  );
  pushIdsViolation(
    violations,
    "private-admission-820-runtime-execution-claim",
    runtimeExecutionClaimViolationIds
  );
  pushIdsViolation(
    violations,
    "private-admission-820-static-ledger-mode-mismatch",
    staticReadOnlyViolationIds
  );
  pushIdsViolation(
    violations,
    "private-admission-820-public-compatibility-claim-detected",
    publicCompatibilityClaimIds
  );

  const manifestRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0;
  const evidenceRolesRecognized = evidenceRoleMismatches.length === 0;
  const evidenceRecognized = evidenceMismatches.length === 0;
  const capabilitiesRecognized = capabilityMismatches.length === 0;
  const statusIdentifiersRecognized = statusIdentifierMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerFieldMismatches.length === 0 &&
    publicClaimViolationIds.length === 0;
  const staticReadOnlyRecognized =
    staticReadOnlyViolationIds.length === 0 &&
    runtimeExecutionClaimViolationIds.length === 0;
  const compatibilityClaimed =
    publicClaimViolationIds.length > 0 ||
    publicCompatibilityClaimIds.length > 0;
  const privateDiagnosticsRecognized =
    manifestRecognized &&
    evidenceRolesRecognized &&
    evidenceRecognized &&
    capabilitiesRecognized &&
    statusIdentifiersRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_820_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_820_GATE_STATUS
      : PRIVATE_ADMISSION_820_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    manifestRecognized,
    evidenceRolesRecognized,
    evidenceRecognized,
    capabilitiesRecognized,
    statusIdentifiersRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_820_WORKERS,
    recognizedWorkerIds: freezeArray(manifestWorkerIds),
    publicClaimViolationIds: freezeArray(publicClaimViolationIds),
    runtimeExecutionClaimViolationIds: freezeArray(
      runtimeExecutionClaimViolationIds
    ),
    staticReadOnlyViolationIds: freezeArray(staticReadOnlyViolationIds),
    publicCompatibilityClaimIds: freezeArray(publicCompatibilityClaimIds),
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    violations: freezeArray(violations)
  });
}

function row({
  workerId,
  privateAdmission,
  area,
  rustImplementationPaths,
  requiredCapabilities,
  acceptedStatusIdentifiers,
  evidence
}) {
  return freezeRecord({
    workerId,
    privateAdmission,
    area,
    sourceQueue: "820",
    localGateCoverage: PRIVATE_ADMISSION_820_GATE_ID,
    rustImplementationPaths,
    requiredCapabilities,
    acceptedStatusIdentifiers,
    evidence,
    publicBlockerClaims: falseRecord(PRIVATE_ADMISSION_820_PUBLIC_BLOCKER_FIELDS),
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    ...falseRecord(PRIVATE_ADMISSION_820_TOP_LEVEL_RUNTIME_CLAIM_FIELDS),
    ...falseRecord(PRIVATE_ADMISSION_820_TOP_LEVEL_PUBLIC_CLAIM_FIELDS),
    ledgerEvaluationMode: "source-token-checks-and-manifest-only"
  });
}

function evidenceData({ role, path, tokens, forbiddenTokens = [] }) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens)
  });
}

function mergeRowOverride(rowData, override = {}) {
  if (override == null || Object.keys(override).length === 0) {
    return rowData;
  }

  const merged = { ...rowData, ...override };
  for (const key of [
    "rustImplementationPaths",
    "requiredCapabilities",
    "acceptedStatusIdentifiers",
    "evidence"
  ]) {
    if (Object.hasOwn(override, key)) {
      merged[key] = freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "publicBlockerClaims")) {
    merged.publicBlockerClaims = freezeRecord({
      ...rowData.publicBlockerClaims,
      ...override.publicBlockerClaims
    });
  }
  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot })
  );
  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceRecognized: evidence.every(
      (evidenceRow) => evidenceRow.recognized === true
    )
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const tokens = evidenceRow.tokens ?? [];
  const forbiddenTokens = evidenceRow.forbiddenTokens ?? [];
  const readResult = readEvidenceFile({
    fileCache,
    path: evidenceRow.path,
    workspaceRoot
  });
  const unstableEvidenceReasons = evidenceStabilityReasons(evidenceRow);
  const missingTokens =
    readResult.readError === null
      ? tokens.filter((token) => !readResult.text.includes(token))
      : [...tokens];
  const forbiddenTokensPresent =
    readResult.readError === null
      ? forbiddenTokens.filter((token) => readResult.text.includes(token))
      : [];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      readResult.readError === null &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0 &&
      unstableEvidenceReasons.length === 0,
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    unstableEvidenceReasons: freezeArray(unstableEvidenceReasons),
    readError: readResult.readError
  });
}

function evidenceStabilityReasons(evidenceRow) {
  const reasons = [];
  if (evidenceRow.path.startsWith("worker-progress/")) {
    reasons.push("worker-progress-evidence-path");
  }
  for (const token of evidenceRow.tokens ?? []) {
    if (/\s/u.test(token)) {
      reasons.push(`prose-or-formatted-token:${token}`);
    }
    if (/[(){};]/u.test(token)) {
      reasons.push(`source-snippet-token:${token}`);
    }
  }
  return reasons;
}

function readEvidenceFile({ fileCache, path, workspaceRoot }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  let result;
  try {
    result = freezeRecord({
      text: readFileSync(join(workspaceRoot, path), "utf8"),
      readError: null
    });
  } catch (error) {
    result = freezeRecord({
      text: "",
      readError: error instanceof Error ? error.message : String(error)
    });
  }
  fileCache.set(path, result);
  return result;
}

function manifestForWorkerIds(workerIds) {
  return freezeRecord({
    workerIds: freezeArray(workerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_820_WORKERS.filter(
        (workerId) => !workerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      workerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_820_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      workerIds.filter((workerId, index) => workerIds.indexOf(workerId) !== index)
    )
  });
}

function compareRequiredArrayByWorker({
  rows,
  requiredByWorker,
  actualForRow,
  expectedKey,
  actualKey
}) {
  return rows.flatMap((rowData) => {
    const expected = requiredByWorker[rowData.workerId] ?? [];
    const actual = actualForRow(rowData) ?? [];
    if (sameStringSet(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: rowData.workerId,
        [expectedKey]: freezeArray(expected),
        [actualKey]: freezeArray(actual)
      })
    ];
  });
}

function falseRecord(keys) {
  return freezeRecord(Object.fromEntries(keys.map((key) => [key, false])));
}

function createViolation(id, details = {}) {
  return freezeRecord({ id, ...details });
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(createViolation(id, { rows: freezeArray(rows) }));
  }
}

function pushIdsViolation(violations, id, ids) {
  if (ids.length > 0) {
    violations.push(createViolation(id, { ids: freezeArray(ids) }));
  }
}

function indexRowsByWorker(rows) {
  return freezeRecord(
    Object.fromEntries(rows.map((rowData) => [rowData.workerId, rowData]))
  );
}

function sameStringSet(expected, actual) {
  if (expected.length !== actual.length) {
    return false;
  }
  const actualSet = new Set(actual);
  if (actualSet.size !== actual.length) {
    return false;
  }
  return expected.every((value) => actualSet.has(value));
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze(record);
}
