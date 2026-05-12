import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_804_GATE_ID =
  "private-admission-804-managed-child-placement-delete-ledger-1";
export const PRIVATE_ADMISSION_804_GATE_STATUS =
  "recognized-accepted-private-managed-child-placement-delete-handoff-public-blocked";
export const PRIVATE_ADMISSION_804_VIOLATION_STATUS =
  "blocked-accepted-private-managed-child-placement-delete-handoff-with-violations";

const worker785 = "worker-785-reconciler-managed-child-placement-delete-handoff";

const completeWorkPath =
  "crates/fast-react-reconciler/src/complete_work/managed_child.rs";
const rootCommitPath =
  "crates/fast-react-reconciler/src/root_commit/managed_child.rs";
const hostWorkPath = "crates/fast-react-reconciler/src/host_work.rs";
const hostWorkDeletionPath =
  "crates/fast-react-reconciler/src/host_work/deletions.rs";
const packageSurfaceGuardPath = "tests/smoke/package-surface-guard.mjs";
const importSmokePath = "tests/smoke/import-entrypoints.mjs";
const rustSourceEvidenceType = "source-owned-rust-implementation-slice";
const jsSourceEvidenceType = "source-owned-js-package-guard-slice";

export const PRIVATE_ADMISSION_804_WORKERS = freezeArray([worker785]);

export const PRIVATE_ADMISSION_804_REQUIRED_CAPABILITIES = freezeArray([
  "complete-work-placement-metadata",
  "complete-work-delete-metadata",
  "root-commit-validation-before-current-switch",
  "host-work-private-append-child",
  "host-work-private-remove-child",
  "host-work-private-delete-cleanup",
  "sole-finished-child-placement-rejection",
  "public-renderer-host-mutation-blocked",
  "react-dom-compatibility-blocked",
  "react-test-renderer-compatibility-blocked",
  "hydration-events-refs-resources-forms-blocked",
  "package-native-compatibility-blocked",
  "public-compatibility-blocked"
]);

export const PRIVATE_ADMISSION_804_REQUIRED_STATUS_IDENTIFIERS = freezeArray([
  "HostComponentManagedChildMutationKindForCanary::Placement",
  "HostComponentManagedChildMutationKindForCanary::DeleteDetach",
  "HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation",
  "TestHostRootMutationHostCall::AppendChild",
  "TestHostRootMutationHostCall::RemoveChild",
  "TestHostRootDeletionCleanupAction::DetachDeletedInstance"
]);

export const PRIVATE_ADMISSION_804_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicRootRenderingAvailable",
  "publicRendererHostMutationAvailable",
  "reactDomManagedChildCompatibilityClaimed",
  "reactTestRendererCompatibilityClaimed",
  "hydrationEventsRefsResourcesFormsClaimed",
  "packageSurfaceCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "nativeBridgeCompatibilityClaimed",
  "nativePackageCompatibilityClaimed",
  "publicCompatibilityClaimed"
]);

export const PRIVATE_ADMISSION_804_EVIDENCE_ROLES = freezeArray([
  "complete-work-managed-child-metadata",
  "root-commit-managed-child-request-record",
  "root-commit-validation-before-current-switch",
  "host-work-managed-child-execution-diagnostic",
  "host-work-managed-child-apply-handoff",
  "host-work-managed-child-append-remove",
  "host-work-managed-child-delete-cleanup",
  "package-surface-private-export-guard",
  "import-smoke-private-export-guard"
]);

const privateAdmission804Rows = freezeArray([
  row({
    workerId: worker785,
    privateAdmission:
      "accepted-private-managed-child-placement-delete-handoff",
    rustImplementationPaths: freezeArray([
      completeWorkPath,
      rootCommitPath,
      hostWorkPath,
      hostWorkDeletionPath
    ]),
    requiredCapabilities: PRIVATE_ADMISSION_804_REQUIRED_CAPABILITIES,
    acceptedStatusIdentifiers:
      PRIVATE_ADMISSION_804_REQUIRED_STATUS_IDENTIFIERS,
    evidence: freezeArray([
      evidenceData({
        role: "complete-work-managed-child-metadata",
        path: completeWorkPath,
        sliceStart:
          "pub(crate) enum HostComponentManagedChildMutationKindForCanary {",
        sliceEnd:
          "pub(crate) fn host_component_managed_child_sibling_order_complete_work_record_for_canary(",
        tokens: [
          "pub(crate) enum HostComponentManagedChildMutationKindForCanary",
          "Self::Placement => \"managed-child-placement\"",
          "Self::DeleteDetach => \"managed-child-delete-detach\"",
          "pub(crate) struct HostComponentManagedChildCompleteWorkRecordForCanary",
          "root: FiberRootId",
          "kind: HostComponentManagedChildMutationKindForCanary",
          "parent_current: FiberId",
          "parent_work_in_progress: FiberId",
          "parent_state_node: StateNodeHandle",
          "child: FiberId",
          "child_state_node: StateNodeHandle",
          "child_pending_props: PropsHandle",
          "child_memoized_props: PropsHandle",
          "deletion_list: Option<DeletionListId>",
          "private_reconciler_handoff_only(self) -> bool",
          "public_dom_compatibility_claimed(self) -> bool",
          "test_renderer_compatibility_claimed(self) -> bool",
          "broad_reconciliation_traversal_claimed(self) -> bool",
          "pub(crate) fn host_component_managed_child_complete_work_record_for_canary",
          "if let Some(sibling) = child_node.sibling() {",
          "HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedParentFirstChild",
          "HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedChildSibling",
          "validate_managed_child_deletion_shape_for_canary",
          "HostComponentManagedChildCompleteWorkErrorForCanary::DeletionListChildCountMismatch",
          "HostComponentManagedChildCompleteWorkErrorForCanary::DeletionListChildMismatch",
          "HostComponentManagedChildCompleteWorkErrorForCanary::DeletedChildStillInFinishedChildren"
        ],
        orderedTokens: [
          "if child_node.return_fiber() != Some(parent_work_in_progress)",
          "if let Some(sibling) = child_node.sibling() {",
          "HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedChildSibling",
          "let deletion_list = match kind {",
          "HostComponentManagedChildMutationKindForCanary::Placement => {",
          "if parent_node.child() != Some(child)",
          "HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedParentFirstChild",
          "HostComponentManagedChildMutationKindForCanary::DeleteDetach => {",
          "validate_managed_child_deletion_shape_for_canary("
        ]
      }),
      evidenceData({
        role: "root-commit-managed-child-request-record",
        path: rootCommitPath,
        sliceStart:
          "pub(crate) struct HostRootManagedChildCommitHandoffRecordForCanary {",
        sliceEnd: "impl Display for HostRootManagedChildCommitHandoffErrorForCanary",
        tokens: [
          "pub(crate) struct HostRootManagedChildCommitHandoffRecordForCanary",
          "complete_work: HostComponentManagedChildCompleteWorkRecordForCanary",
          "execution_request: HostRootManagedChildCommitExecutionRequestForCanary",
          "finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary",
          "pub(crate) struct HostRootManagedChildCommitExecutionRequestForCanary",
          "previous_current: FiberId",
          "committed_current: FiberId",
          "source_handoff_order: usize",
          "commit_order: usize",
          "request_order: usize",
          "mutation_index: usize",
          "mutation: HostRootMutationApplyRecord",
          "status: HostRootManagedChildCommitExecutionStatusForCanary",
          "blockers: [HostRootManagedChildCommitExecutionBlockerForCanary; 6]",
          "HostRootManagedChildCommitExecutionStatusForCanary",
          "ValidatedForTestHostMutation",
          "HostRootManagedChildCommitExecutionBlockerForCanary::PublicRootRendering",
          "HostRootManagedChildCommitExecutionBlockerForCanary::PublicRendererHostMutation",
          "HostRootManagedChildCommitExecutionBlockerForCanary::ReactDomManagedChildCompatibilityClaim",
          "HostRootManagedChildCommitExecutionBlockerForCanary::ReactTestRendererCompatibilityClaim",
          "HostRootManagedChildCommitExecutionBlockerForCanary::HydrationEventsRefsResourcesFormsControlledInputClaim",
          "HostRootManagedChildCommitExecutionBlockerForCanary::PublicCompatibilityClaim",
          "MetadataParentStateNodeMismatch",
          "MetadataChildPropsMismatch",
          "MetadataDeletionListMismatch",
          "PublicCompatibilityClaimed",
          "public_root_rendering_blocked(&self) -> bool",
          "public_renderer_mutation_blocked(&self) -> bool",
          "hydration_events_refs_resources_forms_claimed(self) -> bool"
        ]
      }),
      evidenceData({
        role: "root-commit-validation-before-current-switch",
        path: rootCommitPath,
        sliceStart:
          "pub(crate) fn commit_managed_child_complete_work_handoff_for_canary<H: HostTypes>(",
        sliceEnd: "fn managed_child_sibling_order_complete_metadata_matches_mutation",
        tokens: [
          "validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;",
          "validate_managed_child_commit_metadata_for_canary(",
          "commit_finished_host_root_with_finished_work_handoff_for_canary(",
          "collect_host_root_mutation_phase_log",
          "collect_deletion_list_metadata",
          "collect_host_root_mutation_apply_log",
          "validate_managed_child_mutation_record",
          "expected_managed_child_mutation_apply_kind",
          "HostRootMutationApplyRecordKind::AppendPlacementToHostParent",
          "HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent",
          "HostRootMutationApplyRecordSource::DeletionList(actual)",
          "HostRootPlacementSiblingStatus::Append",
          "HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation",
          "HOST_ROOT_MANAGED_CHILD_COMMIT_EXECUTION_BLOCKERS"
        ],
        orderedTokens: [
          "validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;",
          "let execution_request = validate_managed_child_commit_metadata_for_canary(",
          "let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary("
        ]
      }),
      evidenceData({
        role: "host-work-managed-child-execution-diagnostic",
        path: hostWorkPath,
        sliceStart:
          "enum TestHostRootManagedChildExecutionBlockerForCanary {",
        sliceEnd:
          "#[derive(Debug, Clone, PartialEq, Eq)]\npub(crate) enum TestHostRootManagedChildExecutionErrorForCanary",
        tokens: [
          "enum TestHostRootManagedChildExecutionBlockerForCanary",
          "PublicRootRendering",
          "PublicRendererHostMutation",
          "ReactDomManagedChildCompatibility",
          "ReactTestRendererCompatibility",
          "HydrationEventsRefsResourcesFormsControlledInputCompatibility",
          "PublicCompatibilityClaim",
          "struct TestHostRootManagedChildExecutionDiagnosticForCanary",
          "kind: HostComponentManagedChildMutationKindForCanary",
          "mutation: HostRootMutationApplyRecord",
          "mutation_status: TestHostRootMutationApplyStatus",
          "cleanup_status: Option<TestHostRootDeletionCleanupStatus>",
          "applied_host_call_count: usize",
          "deletion_cleanup_apply_count: usize",
          "private_test_host_mutation_executed(&self) -> bool",
          "TestHostRootMutationHostCall::AppendChild",
          "TestHostRootMutationHostCall::RemoveChild",
          "public_root_rendering_blocked(&self) -> bool",
          "public_renderer_mutation_blocked(&self) -> bool",
          "react_dom_compatibility_claimed(&self) -> bool",
          "test_renderer_compatibility_claimed(&self) -> bool",
          "hydration_events_refs_resources_forms_claimed(&self) -> bool"
        ]
      }),
      evidenceData({
        role: "host-work-managed-child-apply-handoff",
        path: hostWorkPath,
        sliceStart: "fn apply_managed_child_complete_work_handoff_for_canary(",
        sliceEnd:
          "fn accept_dangerous_html_text_reset_payload_from_complete_work_handoff_for_canary(",
        tokens: [
          "apply_test_host_root_commit_mutations(",
          "if apply.records().len() != 1",
          "managed_child_apply_status_matches_kind(mutation_status, handoff.kind())",
          "apply_test_host_root_deletion_cleanup(",
          "cleanup_apply.applied_record_count()",
          "blockers: TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS",
          "const fn managed_child_apply_status_matches_kind",
          "TestHostRootMutationHostCall::AppendChild",
          "TestHostRootMutationHostCall::RemoveChild"
        ],
        orderedTokens: [
          "let apply = apply_test_host_root_commit_mutations(",
          "if apply.records().len() != 1",
          "let (cleanup_status, deletion_cleanup_apply_count) = match handoff.kind()",
          "let cleanup_apply = apply_test_host_root_deletion_cleanup(",
          "let cleanup_status = cleanup_apply",
          "if !managed_child_deletion_cleanup_status_matches_tag(",
          "(Some(cleanup_status), cleanup_apply.applied_record_count())",
          "Ok(TestHostRootManagedChildExecutionDiagnosticForCanary",
          "blockers: TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS"
        ]
      }),
      evidenceData({
        role: "host-work-managed-child-append-remove",
        path: hostWorkPath,
        sliceStart: "fn apply_test_host_parent_placement_record(",
        sliceEnd:
          "#[derive(Debug, Clone, PartialEq, Eq)]\nenum OwnedDetachedHostChild",
        tokens: [
          "fn apply_test_host_parent_placement_record",
          "host.append_child(parent, child.as_host_child())?",
          "TestHostRootMutationHostCall::AppendChild",
          "fn apply_test_host_parent_deletion_record",
          "host.remove_child(parent, child.as_host_child())?",
          "TestHostRootMutationHostCall::RemoveChild"
        ]
      }),
      evidenceData({
        role: "host-work-managed-child-delete-cleanup",
        path: hostWorkDeletionPath,
        sliceStart: "fn apply_test_host_root_deletion_cleanup(",
        sliceEnd: "fn apply_deleted_text_cleanup_record(",
        tokens: [
          "fn apply_test_host_root_deletion_cleanup",
          "commit.host_node_deletion_cleanup_log().records()",
          "apply_test_host_root_deletion_cleanup_record",
          "TestHostRootDeletionCleanupStatus::Applied(",
          "TestHostRootDeletionCleanupAction::DetachDeletedInstance",
          "fn apply_deleted_instance_cleanup_record",
          "host.detach_deleted_instance(",
          "detached_hosts.nodes.invalidate_deleted_instance("
        ],
        orderedTokens: [
          "apply_test_host_root_deletion_cleanup_record(store, host, cleanup, detached_hosts)?",
          "TestHostRootDeletionCleanupAction::DetachDeletedInstance",
          "fn apply_deleted_instance_cleanup_record",
          "host.detach_deleted_instance(",
          "detached_hosts.nodes.invalidate_deleted_instance("
        ]
      }),
      evidenceData({
        role: "package-surface-private-export-guard",
        path: packageSurfaceGuardPath,
        sourceEvidenceType: jsSourceEvidenceType,
        tokens: [
          "const privateDiagnosticPublicFileGuards = {",
          "const exactPrivatePublicFileGuards = {",
          "const nativeRuntimeKeys = [",
          "function assertNoPrivateDiagnosticRuntimeExports(",
          "acceptedNativeDiagnosticRuntimeKeys",
          "privateDiagnosticRuntimeExportPattern",
          "assertNativePackageDiagnosticSurface(nativeRuntime)"
        ]
      }),
      evidenceData({
        role: "import-smoke-private-export-guard",
        path: importSmokePath,
        sourceEvidenceType: jsSourceEvidenceType,
        tokens: [
          "reactTestRendererPackageRoot",
          "nativePackageRoot",
          "function assertNoPrivateDiagnosticRuntimeExports(moduleExports, label)",
          "reactTestRendererPrivateRuntimeFacadeSymbols.toJSON",
          "reactTestRendererPrivateRuntimeFacadeSymbols.toTree",
          "assertNoPrivateDiagnosticRuntimeExports(renderer.toJSON,",
          "assertNoPrivateDiagnosticRuntimeExports(renderer.toTree,"
        ]
      })
    ])
  })
]);

export const PRIVATE_ADMISSION_804_ROWS = freezeArray(
  privateAdmission804Rows
);

export const PRIVATE_ADMISSION_804_REQUIRED_EVIDENCE_CONTEXTS = freezeRecord(
  Object.fromEntries(
    PRIVATE_ADMISSION_804_ROWS.map((sourceRow) => [
      sourceRow.workerId,
      evidenceContextsForRow(sourceRow)
    ])
  )
);

export function evaluatePrivateAdmission804Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_804_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow, index) =>
    evaluatePrivateAdmissionRow({
      fileCache,
      row: baseRow,
      sourceRow: PRIVATE_ADMISSION_804_ROWS[index],
      workspaceRoot
    })
  );
  const manifestWorkerIds = rows.map((row) => row.workerId);
  const manifest = freezeRecord({
    workerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_804_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_804_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    )
  });

  const evidenceMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          evidenceContextRecognized: evidenceRow.evidenceContextRecognized,
          evidenceTokenContractRecognized:
            evidenceRow.evidenceTokenContractRecognized,
          expectedEvidenceContext: evidenceRow.expectedEvidenceContext,
          actualEvidenceContext: evidenceRow.actualEvidenceContext,
          missingTokens: evidenceRow.missingTokens,
          orderedTokenViolations: evidenceRow.orderedTokenViolations,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError,
          sliceError: evidenceRow.sliceError
        })
      )
  );
  const capabilityMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredArray: PRIVATE_ADMISSION_804_REQUIRED_CAPABILITIES,
    actualKey: "requiredCapabilities",
    expectedKey: "expectedRequiredCapabilities",
    actualKeyForViolation: "actualRequiredCapabilities"
  });
  const statusIdentifierMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredArray: PRIVATE_ADMISSION_804_REQUIRED_STATUS_IDENTIFIERS,
    actualKey: "acceptedStatusIdentifiers",
    expectedKey: "expectedAcceptedStatusIdentifiers",
    actualKeyForViolation: "actualAcceptedStatusIdentifiers"
  });
  const evidenceContextMismatches = evaluatedRows.flatMap(
    (row) => row.evidenceContextMismatches
  );
  const publicBlockerKeyMismatches = evaluatedRows.flatMap((row) => {
    const actualKeys = Object.keys(row.publicBlockerClaims ?? {});
    if (sameStringSet(PRIVATE_ADMISSION_804_PUBLIC_BLOCKER_FIELDS, actualKeys)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicBlockerFields:
          PRIVATE_ADMISSION_804_PUBLIC_BLOCKER_FIELDS,
        actualPublicBlockerFields: freezeArray(actualKeys)
      })
    ];
  });
  const publicBlockerClaimViolationIds = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockerClaims ?? {})
      .filter(([, claimed]) => claimed !== false)
      .map(([claimId]) => `${row.workerId}.${claimId}`)
  );
  const packageNativeClaimViolationIds = evaluatedRows.flatMap((row) => {
    const ids = [];
    for (const field of [
      "packageSurfaceChanged",
      "packageCompatibilityClaimed",
      "nativeCompatibilityClaimed",
      "nativeBridgeExecuted",
      "packageCodeExecuted"
    ]) {
      if (row[field] !== false) {
        ids.push(`${row.workerId}.${field}`);
      }
    }
    for (const claimId of publicBlockerClaimViolationIds) {
      if (
        claimId.startsWith(`${row.workerId}.`) &&
        /(?:package|native)/iu.test(claimId)
      ) {
        ids.push(claimId);
      }
    }
    return ids;
  });
  const runtimeExecutionClaimViolationIds = evaluatedRows.flatMap((row) => {
    const ids = [];
    for (const field of ["runtimeExecutionClaimed", "rustExecutionClaimed"]) {
      if (row[field] !== false) {
        ids.push(`${row.workerId}.${field}`);
      }
    }
    return ids;
  });
  const staticReadOnlyViolationIds = evaluatedRows
    .filter(
      (row) =>
        row.sourceTokenChecksOnly !== true ||
        row.manifestEvaluationOnly !== true ||
        row.runtimeExecutionClaimed !== false ||
        row.rustExecutionClaimed !== false ||
        row.packageCodeExecuted !== false ||
        row.nativeBridgeExecuted !== false ||
        row.ledgerEvaluationMode !== "source-token-checks-and-manifest-only"
    )
    .map((row) => row.workerId);
  const compatibilityClaimViolationIds = evaluatedRows.flatMap((row) => {
    const ids = [];
    for (const field of [
      "compatibilityClaimed",
      "packageCompatibilityClaimed",
      "nativeCompatibilityClaimed"
    ]) {
      if (row[field] !== false) {
        ids.push(`${row.workerId}.${field}`);
      }
    }
    return ids;
  });

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("private-managed-child-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-managed-child-evidence-mismatch",
    evidenceMismatches
  );
  pushRowsViolation(
    violations,
    "private-managed-child-capability-mismatch",
    capabilityMismatches
  );
  pushRowsViolation(
    violations,
    "private-managed-child-status-identifier-mismatch",
    statusIdentifierMismatches
  );
  pushRowsViolation(
    violations,
    "private-managed-child-evidence-context-mismatch",
    evidenceContextMismatches
  );
  pushRowsViolation(
    violations,
    "private-managed-child-public-blocker-field-mismatch",
    publicBlockerKeyMismatches
  );
  pushIdsViolation(
    violations,
    "private-managed-child-public-blocker-claim-detected",
    publicBlockerClaimViolationIds
  );
  pushIdsViolation(
    violations,
    "private-managed-child-package-native-compatibility-claim-detected",
    packageNativeClaimViolationIds
  );
  pushIdsViolation(
    violations,
    "private-managed-child-runtime-execution-claim",
    runtimeExecutionClaimViolationIds
  );
  pushIdsViolation(
    violations,
    "private-managed-child-static-ledger-mode-mismatch",
    staticReadOnlyViolationIds
  );
  pushIdsViolation(
    violations,
    "private-managed-child-compatibility-claim-detected",
    compatibilityClaimViolationIds
  );

  const evidenceRecognized = evidenceMismatches.length === 0;
  const evidenceContextsRecognized = evidenceContextMismatches.length === 0;
  const capabilitiesRecognized = capabilityMismatches.length === 0;
  const statusIdentifiersRecognized = statusIdentifierMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerKeyMismatches.length === 0 &&
    publicBlockerClaimViolationIds.length === 0;
  const packageNativeCompatibilityRecognized =
    packageNativeClaimViolationIds.length === 0;
  const staticReadOnlyRecognized =
    staticReadOnlyViolationIds.length === 0 &&
    runtimeExecutionClaimViolationIds.length === 0;
  const compatibilityClaimed =
    publicBlockerClaimViolationIds.length > 0 ||
    compatibilityClaimViolationIds.length > 0;
  const privateDiagnosticsRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    evidenceRecognized &&
    evidenceContextsRecognized &&
    capabilitiesRecognized &&
    statusIdentifiersRecognized &&
    blockedPublicClaimsRecognized &&
    packageNativeCompatibilityRecognized &&
    staticReadOnlyRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_804_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_804_GATE_STATUS
      : PRIVATE_ADMISSION_804_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    evidenceRecognized,
    evidenceContextsRecognized,
    capabilitiesRecognized,
    statusIdentifiersRecognized,
    blockedPublicClaimsRecognized,
    packageNativeCompatibilityRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_804_WORKERS,
    recognizedWorkerIds: freezeArray(evaluatedRows.map((row) => row.workerId)),
    publicBlockerClaimViolationIds: freezeArray(
      publicBlockerClaimViolationIds
    ),
    packageNativeClaimViolationIds: freezeArray(packageNativeClaimViolationIds),
    runtimeExecutionClaimViolationIds: freezeArray(
      runtimeExecutionClaimViolationIds
    ),
    staticReadOnlyViolationIds: freezeArray(staticReadOnlyViolationIds),
    compatibilityClaimViolationIds: freezeArray(
      compatibilityClaimViolationIds
    ),
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    violations: freezeArray(violations)
  });
}

function row({
  workerId,
  privateAdmission,
  rustImplementationPaths,
  requiredCapabilities,
  acceptedStatusIdentifiers,
  evidence
}) {
  return freezeRecord({
    workerId,
    privateAdmission,
    sourceQueue: "804",
    localGateCoverage: PRIVATE_ADMISSION_804_GATE_ID,
    acceptedWorker: worker785,
    rustImplementationPaths: freezeArray(rustImplementationPaths),
    requiredCapabilities: freezeArray(requiredCapabilities),
    acceptedStatusIdentifiers: freezeArray(acceptedStatusIdentifiers),
    evidence: freezeArray(evidence),
    publicBlockerClaims: falseRecord(PRIVATE_ADMISSION_804_PUBLIC_BLOCKER_FIELDS),
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    rustExecutionClaimed: false,
    packageCodeExecuted: false,
    nativeBridgeExecuted: false,
    packageSurfaceChanged: false,
    packageCompatibilityClaimed: false,
    nativeCompatibilityClaimed: false,
    compatibilityClaimed: false,
    ledgerEvaluationMode: "source-token-checks-and-manifest-only"
  });
}

function evidenceData({
  role,
  path,
  tokens,
  orderedTokens = [],
  forbiddenTokens = [],
  sourceEvidenceType = rustSourceEvidenceType,
  sliceStart = null,
  sliceEnd = null
}) {
  return freezeRecord({
    role,
    path,
    sourceEvidenceType,
    tokens: freezeArray(tokens),
    orderedTokens: freezeArray(orderedTokens),
    forbiddenTokens: freezeArray(forbiddenTokens),
    sliceStart,
    sliceEnd
  });
}

function mergeRowOverride(row, override) {
  if (override == null || Object.keys(override).length === 0) {
    return row;
  }

  const merged = { ...row, ...override };
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
      ...row.publicBlockerClaims,
      ...override.publicBlockerClaims
    });
  }
  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, sourceRow, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow, index) =>
    evaluateEvidenceRow({
      evidenceRow,
      expectedEvidenceRow: sourceRow?.evidence[index] ?? null,
      fileCache,
      workspaceRoot
    })
  );
  const evidenceContextMismatches = createEvidenceContextMismatches(row);

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceContextsRecognized: evidenceContextMismatches.length === 0,
    evidenceContextMismatches: freezeArray(evidenceContextMismatches),
    evidenceRecognized: evidence.every(
      (evidenceRow) => evidenceRow.recognized === true
    )
  });
}

function evaluateEvidenceRow({
  evidenceRow,
  expectedEvidenceRow,
  fileCache,
  workspaceRoot
}) {
  const expectedEvidenceContext = expectedEvidenceRow
    ? evidenceContextForEvidenceRow(expectedEvidenceRow)
    : null;
  const actualEvidenceContext = evidenceContextForEvidenceRow(evidenceRow);
  const evidenceContextRecognized = sameEvidenceContext(
    actualEvidenceContext,
    expectedEvidenceContext
  );
  const expectedTokens = expectedEvidenceRow?.tokens ?? freezeArray([]);
  const expectedOrderedTokens =
    expectedEvidenceRow?.orderedTokens ?? freezeArray([]);
  const expectedForbiddenTokens =
    expectedEvidenceRow?.forbiddenTokens ?? freezeArray([]);
  const evidenceTokenContractRecognized =
    expectedEvidenceRow != null &&
    sameStringArray(evidenceRow.tokens, expectedTokens) &&
    sameStringArray(evidenceRow.orderedTokens, expectedOrderedTokens) &&
    sameStringArray(evidenceRow.forbiddenTokens, expectedForbiddenTokens);
  const readResult = readEvidenceFile({
    fileCache,
    path: evidenceRow.path,
    workspaceRoot
  });
  let text = readResult.text;
  let sliceError = null;
  if (readResult.readError === null) {
    const sliceResult = sliceEvidenceText({
      path: evidenceRow.path,
      text,
      sliceStart: evidenceRow.sliceStart,
      sliceEnd: evidenceRow.sliceEnd
    });
    text = sliceResult.text;
    sliceError = sliceResult.sliceError;
  }

  const canCheckText = readResult.readError === null && sliceError === null;
  const missingTokens = canCheckText
    ? expectedTokens.filter((token) => !text.includes(token))
    : [...expectedTokens];
  const orderedTokenViolations = canCheckText
    ? orderedTokenMismatches(text, expectedOrderedTokens)
    : [...expectedOrderedTokens];
  const forbiddenTokensPresent = canCheckText
    ? expectedForbiddenTokens.filter((token) => text.includes(token))
    : [];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      evidenceContextRecognized &&
      evidenceTokenContractRecognized &&
      canCheckText &&
      missingTokens.length === 0 &&
      orderedTokenViolations.length === 0 &&
      forbiddenTokensPresent.length === 0,
    evidenceContextRecognized,
    evidenceTokenContractRecognized,
    expectedEvidenceContext,
    actualEvidenceContext,
    missingTokens: freezeArray(missingTokens),
    orderedTokenViolations: freezeArray(orderedTokenViolations),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    readError: readResult.readError,
    sliceError
  });
}

function evidenceContextsForRow(row) {
  return freezeRecord(
    Object.fromEntries(
      row.evidence.map((evidenceRow) => [
        evidenceRow.role,
        evidenceContextForEvidenceRow(evidenceRow)
      ])
    )
  );
}

function evidenceContextForEvidenceRow(evidenceRow) {
  return freezeRecord({
    role: evidenceRow.role,
    path: evidenceRow.path,
    sliceStart: evidenceRow.sliceStart,
    sliceEnd: evidenceRow.sliceEnd,
    sourceEvidenceType: evidenceRow.sourceEvidenceType,
    tokens: freezeArray(evidenceRow.tokens),
    orderedTokens: freezeArray(evidenceRow.orderedTokens),
    forbiddenTokens: freezeArray(evidenceRow.forbiddenTokens)
  });
}

function createEvidenceContextMismatches(row) {
  const expected =
    PRIVATE_ADMISSION_804_REQUIRED_EVIDENCE_CONTEXTS[row.workerId] ??
    freezeRecord({});
  const actual = evidenceContextsForRow(row);
  const expectedRoles = Object.keys(expected);
  const actualRoles = row.evidence.map((evidenceRow) => evidenceRow.role);
  const rolesMatch = sameStringArray(expectedRoles, actualRoles);
  const contextsMatch =
    rolesMatch &&
    expectedRoles.every((role) =>
      sameEvidenceContext(actual[role], expected[role])
    );

  if (contextsMatch) {
    return [];
  }

  return [
    freezeRecord({
      workerId: row.workerId,
      expectedEvidenceRoles: freezeArray(expectedRoles),
      actualEvidenceRoles: freezeArray(actualRoles),
      expectedEvidenceContexts: expected,
      actualEvidenceContexts: actual
    })
  ];
}

function sameEvidenceContext(actual, expected) {
  return (
    actual != null &&
    expected != null &&
    actual.role === expected.role &&
    actual.path === expected.path &&
    actual.sliceStart === expected.sliceStart &&
    actual.sliceEnd === expected.sliceEnd &&
    actual.sourceEvidenceType === expected.sourceEvidenceType &&
    sameStringArray(actual.tokens, expected.tokens) &&
    sameStringArray(actual.orderedTokens, expected.orderedTokens) &&
    sameStringArray(actual.forbiddenTokens, expected.forbiddenTokens)
  );
}

function orderedTokenMismatches(text, tokens) {
  const violations = [];
  let searchIndex = 0;
  for (const token of tokens) {
    const foundIndex = text.indexOf(token, searchIndex);
    if (foundIndex === -1) {
      violations.push(token);
      continue;
    }
    searchIndex = foundIndex + token.length;
  }
  return violations;
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

function sliceEvidenceText({ path, text, sliceStart, sliceEnd }) {
  let startIndex = 0;
  let endIndex = text.length;
  if (sliceStart !== null) {
    startIndex = text.indexOf(sliceStart);
    if (startIndex === -1) {
      return freezeRecord({
        text: "",
        sliceError: `sliceStart not found in ${path}`
      });
    }
  }
  if (sliceEnd !== null) {
    endIndex = text.indexOf(sliceEnd, startIndex);
    if (endIndex === -1) {
      return freezeRecord({
        text: "",
        sliceError: `sliceEnd not found in ${path}`
      });
    }
  }
  return freezeRecord({
    text: text.slice(startIndex, endIndex),
    sliceError: null
  });
}

function compareRequiredArrayByWorker({
  rows,
  requiredArray,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const actual = row[actualKey] ?? [];
    if (sameStringSet(requiredArray, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: freezeArray(requiredArray),
        [actualKeyForViolation]: freezeArray(actual)
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
    Object.fromEntries(rows.map((row) => [row.workerId, row]))
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

function sameStringArray(expected, actual) {
  return (
    expected.length === actual.length &&
    expected.every((value, index) => actual[index] === value)
  );
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze(record);
}
