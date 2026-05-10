import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_734_736_GATE_ID,
  PRIVATE_ADMISSION_734_736_GATE_STATUS,
  PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS
} from "./private-admission-734-736-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_737_738_GATE_ID =
  "private-admission-737-738-local-gate-1";
export const PRIVATE_ADMISSION_737_738_GATE_STATUS =
  "recognized-accepted-private-diagnostics-737-738-public-compatibility-blocked";
export const PRIVATE_ADMISSION_737_738_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-737-738-with-violations";

export const PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS,
    "publicTestRendererSiblingTextHostOutputCompatibilityClaimed",
    "publicTestRendererSiblingTextReportCompatibilityClaimed",
    "publicTestRendererSiblingTextFinishedWorkIdentityAdmissionClaimed",
    "publicReactRootCompatibilityClaimed",
    "publicReactActCompatibilityClaimed",
    "publicReactDomFlushSyncCompatibilityClaimed",
    "publicSchedulerTaskCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES = freezeUniqueArray([
  ...PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
  "test-renderer-sibling-text-host-output-prerequisite",
  "test-renderer-sibling-text-private-json-report-prerequisite",
  "test-renderer-sibling-text-finished-work-identity-admission",
  "public-root",
  "public-act",
  "react-dom-flush-sync",
  "scheduler-task"
]);

export const PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS,
    "siblingTextHostOutputPublicPromotionClaimed",
    "siblingTextReportPublicPromotionClaimed",
    "siblingTextFinishedWorkIdentityAdmissionClaimed",
    "siblingTextGenericIdentityGateOpenedClaimed",
    "reactDomRootAdmissionClaimed",
    "reactDomActAdmissionClaimed",
    "flushSyncAdmissionClaimed",
    "schedulerAdmissionClaimed"
  ]);

const worker735 = "worker-735-sibling-snapshot-identity-blocker";
const worker736 = "worker-736-nested-tojson-source-report-identity";
const worker737 = "worker-737-package-private-admission-audit-734-736";
const worker738 = "worker-738-real-sibling-text-handoff-report";

export const PRIVATE_ADMISSION_737_738_SKIPPED_WORKERS = Object.freeze([]);

export const PRIVATE_ADMISSION_737_738_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    [worker737]: freezeArray([
      PRIVATE_ADMISSION_734_736_GATE_ID,
      PRIVATE_ADMISSION_734_736_GATE_STATUS,
      "static-private-admission-ledger-734-736-evidence"
    ]),
    [worker738]: freezeArray([
      "test-renderer-tojson-sibling-text-real-host-output-prerequisite",
      "private-tojson-sibling-text-real-host-output-row",
      "private-tojson-sibling-text-report-root-array-source-nodes",
      "private-tojson-sibling-text-generic-finished-work-identity-fail-closed"
    ])
  });

export const PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCIES = freezeRecord({
  [worker737]: freezeArray([
    "worker-734-package-private-admission-audit-732-733",
    worker735,
    worker736
  ]),
  [worker738]: freezeArray([worker735, worker736, worker737])
});

export const PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCY_DIAGNOSTICS =
  freezeRecord({
    [worker737]: freezeArray([
      PRIVATE_ADMISSION_734_736_GATE_ID,
      PRIVATE_ADMISSION_734_736_GATE_STATUS,
      "private-tojson-sibling-snapshot-finished-work-identity-blocked",
      "private-nested-tojson-source-report-backed-finished-work-identity-validation"
    ]),
    [worker738]: freezeArray([
      "private-tojson-sibling-snapshot-finished-work-identity-blocked",
      "missing-committed-sibling-text-fiber-inspection-and-handoff",
      "private-nested-tojson-source-report-backed-finished-work-identity-validation",
      PRIVATE_ADMISSION_734_736_GATE_ID
    ])
  });

export const PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT =
  freezeRecord({
    [worker737]: freezeArray([
      PRIVATE_ADMISSION_734_736_GATE_ID,
      "test-renderer-sibling-snapshot-finished-work-identity-admission"
    ]),
    [worker738]: freezeArray([
      worker737,
      worker735,
      "test-renderer-sibling-text-finished-work-identity-admission"
    ])
  });

export const PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS =
  freezeRecord({
    [worker737]: freezeArray([
      "private-tojson-sibling-snapshot-finished-work-identity-blocked",
      "missing-committed-sibling-text-fiber-inspection-and-handoff",
      "siblingSnapshotFinishedWorkIdentityAdmissionClaimed"
    ]),
    [worker738]: freezeArray([
      PRIVATE_ADMISSION_734_736_GATE_ID,
      PRIVATE_ADMISSION_734_736_GATE_STATUS,
      "sibling-text-finished-work-identity-gate-not-implemented",
      "siblingTextFinishedWorkIdentityAdmissionClaimed"
    ])
  });

export const PRIVATE_ADMISSION_737_738_REQUIRED_PRIOR_LEDGER_CONTEXT =
  freezeRecord({
    [worker737]: freezeArray([
      PRIVATE_ADMISSION_734_736_GATE_ID,
      PRIVATE_ADMISSION_734_736_GATE_STATUS,
      "worker-734-package-private-admission-audit-732-733",
      worker735,
      worker736
    ]),
    [worker738]: freezeArray([
      worker737,
      PRIVATE_ADMISSION_734_736_GATE_ID,
      PRIVATE_ADMISSION_734_736_GATE_STATUS,
      worker735,
      worker736
    ])
  });

export const PRIVATE_ADMISSION_737_738_REQUIRED_STATIC_LEDGER_EVIDENCE =
  freezeRecord({
    [worker737]: freezeRecord({
      recordsWorker734AsPriorLedger: true,
      recordsWorker735SiblingSnapshotBlocker: true,
      recordsWorker736NestedSourceReport: true,
      carriesForward734736Blockers: true,
      staticReadOnlyLedger: true,
      runtimeCapabilityAdded: false
    })
  });

export const PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_TEXT_PREREQUISITE =
  freezeRecord({
    [worker738]: freezeRecord({
      realCommittedSiblingTextHostOutput: true,
      committedSiblingTextFiberInspectionBacked: true,
      realSiblingTextHostOutputRow: true,
      privateJsonReportRootArraySourceNodes: true,
      reportConsumesCurrentCommittedFibers: true,
      publicNativeJsPackageBlocked: true
    })
  });

export const PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_IDENTITY_GUARD =
  freezeRecord({
    [worker738]: freezeRecord({
      siblingSnapshotIdentityAdmissionBlocked: true,
      genericFinishedWorkIdentityGateFailsClosed: true,
      failClosedReasonPinned: true,
      noDedicatedSiblingIdentityGateClaimed: true
    })
  });

const rowData737738 = Object.freeze([
  rowData({
    workerId: worker737,
    privateAdmission: "accepted-private-ledger-evidence",
    area: "static private-admission ledger evidence for accepted Workers 734-736",
    primaryCompatibilityArea:
      "private-admission-static-ledger-734-736-public-compatibility-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_ACCEPTED_DIAGNOSTICS[worker737],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCIES[worker737],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker737],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT[worker737],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker737
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_737_738_REQUIRED_PRIOR_LEDGER_CONTEXT[worker737],
    staticLedgerEvidence:
      PRIVATE_ADMISSION_737_738_REQUIRED_STATIC_LEDGER_EVIDENCE[worker737],
    siblingTextPrerequisite: {},
    siblingIdentityGuard: {},
    runtimeCapabilityAdded: false,
    promotion: "not-applicable",
    evidenceRows: [
      evidenceData({
        role: "worker-737-static-ledger-progress",
        path: "worker-progress/worker-737-package-private-admission-audit-734-736.md",
        tokens: [
          "# Worker 737: Package Private Admission Audit 734-736",
          "Added a static/read-only private-admission ledger for Workers 734-736.",
          "Recorded Worker 735 as accepted Rust-only private sibling snapshot",
          "Recorded Worker 736 as accepted Rust-only private nested `toJSON`",
          "Carried forward the full 732-733 blocked public claims",
          "This is static/read-only conformance evidence only."
        ]
      }),
      evidenceData({
        role: "worker-737-static-ledger-source",
        path: "tests/conformance/src/private-admission-734-736-gate.mjs",
        tokens: [
          "PRIVATE_ADMISSION_734_736_GATE_ID",
          "recognized-accepted-private-diagnostics-734-736-public-compatibility-blocked",
          "worker-735-sibling-snapshot-identity-blocker",
          "worker-736-nested-tojson-source-report-identity",
          "private-tojson-sibling-snapshot-finished-work-identity-blocked",
          "missing-committed-sibling-text-fiber-inspection-and-handoff",
          "publicTestRendererSiblingSnapshotFinishedWorkIdentityAdmissionClaimed",
          "rustOnlyDiagnosticPromotedToPackageClaimed"
        ]
      }),
      evidenceData({
        role: "worker-737-static-ledger-test",
        path: "tests/conformance/test/private-admission-734-736-gate.test.mjs",
        tokens: [
          "private admission 734-736 gate recognizes accepted private evidence without public compatibility",
          "private admission 734-736 gate rejects missing Worker 735 blocker and tamper evidence",
          "private admission 734-736 gate rejects missing Worker 736 committed inspection and source-report evidence",
          "private admission 734-736 gate rejects compatibility, public, native, JS, and package leaks",
          "private admission 734-736 gate rejects removing carried-forward 732-733 blockers"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker738,
    privateAdmission: "accepted-private-prerequisite-evidence",
    area: "Rust-only private real committed sibling-text host-output/report prerequisite evidence",
    primaryCompatibilityArea:
      "test-renderer-tojson-sibling-text-real-host-output-report-prerequisite",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_ACCEPTED_DIAGNOSTICS[worker738],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCIES[worker738],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker738],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT[worker738],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker738
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_737_738_REQUIRED_PRIOR_LEDGER_CONTEXT[worker738],
    staticLedgerEvidence: {},
    siblingTextPrerequisite:
      PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_TEXT_PREREQUISITE[worker738],
    siblingIdentityGuard:
      PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_IDENTITY_GUARD[worker738],
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-738-real-sibling-text-progress",
        path: "worker-progress/worker-738-real-sibling-text-handoff-report.md",
        tokens: [
          "# Worker 738: Real Sibling Text Handoff Report",
          "Added a Rust-only real committed sibling-text host-output update path",
          "Added a real-output sibling `toJSON` host-output row",
          "private JSON",
          "report path that reads a committed root-array source shape",
          "This does not admit sibling snapshot finished-work identity",
          "sibling-text-finished-work-identity-gate-not-implemented"
        ]
      }),
      evidenceData({
        role: "worker-738-sibling-text-output-struct-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart: "pub struct TestRendererSiblingTextHostOutput {",
        sliceEnd: "impl TestRendererSiblingTextHostOutput {",
        tokens: [
          "root_text_fiber: TestRendererFiberHandleDiagnostics",
          "fiber_inspection: TestRendererCommittedFiberTreeInspection",
          "commit_diagnostics: TestRendererHostOutputCanaryCommitDiagnostics",
          "previous_snapshot: TestContainerSnapshot",
          "snapshot: TestContainerSnapshot",
          "root_text_snapshot: TestTextSnapshot"
        ]
      }),
      evidenceData({
        role: "worker-738-reconciler-sibling-text-handoff-rust-proof",
        path: "crates/fast-react-reconciler/src/root_commit.rs",
        sliceStart:
          "pub fn prepare_test_renderer_sibling_text_host_output_update_canary_fibers(",
        sliceEnd:
          "pub fn finish_test_renderer_sibling_text_host_output_update_canary_fibers(",
        tokens: [
          "FiberTag::HostText",
          "PropsHandle::from_raw(root_text_props_raw)",
          "node.merge_flags(FiberFlags::PLACEMENT)",
          "set_children(render.work_in_progress(), &[root_text, stable.component()])?",
          "HostFiberTokenTarget::TextInstance"
        ]
      }),
      evidenceData({
        role: "worker-738-real-output-commit-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn render_and_commit_sibling_text_host_output_update_for_canary(",
        sliceEnd:
          "pub fn render_and_commit_host_parent_text_placement_for_canary(",
        tokens: [
          "prepare_test_renderer_sibling_text_host_output_update_canary_fibers",
          "finish_test_renderer_sibling_text_host_output_update_canary_fibers",
          "describe_committed_fiber_tree_for_canary(&commit)?",
          "placement.apply_kind() != \"insert-placement-in-container-before\"",
          "self.renderer.insert_in_container_before(",
          "current_host_output = None",
          "root_text_fiber: fiber_handle!(root_text_fiber)"
        ]
      }),
      evidenceData({
        role: "worker-738-sibling-text-report-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn describe_private_json_serialization_after_sibling_text_update_for_canary(",
        sliceEnd:
          "pub fn describe_private_to_json_host_output_unmount_row_for_canary(",
        tokens: [
          "describe_private_to_json_sibling_text_host_output_row_for_canary(output)?",
          "TestRendererPrivateJsonCurrentFibersForCanary::SiblingText",
          "root_text: output.root_text_fiber()",
          "TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_HOST_OUTPUT_ROW_ID",
          "TestRendererPrivateToJsonHostOutputShape::SiblingText",
          "output.fiber_inspection().shape_name() != \"HostRoot->[HostText,HostComponent->HostText]\""
        ]
      }),
      evidenceData({
        role: "worker-738-sibling-text-report-tests-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_sibling_text_host_output_update_commits_real_root_text_before_component()",
        sliceEnd:
          "fn root_private_to_json_sibling_text_report_fails_closed_in_generic_finished_work_identity_gate()",
        tokens: [
          "render_and_commit_sibling_text_host_output_update_for_canary(\"first sibling\")",
          "container_element_texts(output.previous_snapshot())",
          "placement.apply_kind()",
          "\"insert-placement-in-container-before\"",
          "inspection.shape_name()",
          "\"HostRoot->[HostText,HostComponent->HostText]\"",
          "describe_private_to_json_sibling_text_host_output_row_for_canary(&output)",
          "describe_private_json_serialization_after_sibling_text_update_for_canary(&output)",
          "TestRendererPrivateJsonNodeKind::RootArray"
        ]
      }),
      evidenceData({
        role: "worker-738-fail-closed-generic-identity-guard-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn describe_private_to_json_finished_work_identity_gate_for_canary(",
        sliceEnd:
          "pub fn describe_private_to_json_nested_finished_work_identity_gate_for_canary(",
        tokens: [
          "if report.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::SiblingText",
          "TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch",
          "reason: \"sibling-text-finished-work-identity-gate-not-implemented\""
        ]
      }),
      evidenceData({
        role: "worker-738-fail-closed-generic-identity-test-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_json_sibling_text_report_fails_closed_in_generic_finished_work_identity_gate()",
        sliceEnd:
          "fn root_private_to_json_sibling_snapshot_finished_work_identity_blocker_rejects_plausible_identity()",
        tokens: [
          "describe_private_to_json_finished_work_identity_gate_for_canary(",
          "Some(output.render())",
          "Some(output.commit())",
          "Some(&report)",
          "unwrap_err()",
          "TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch",
          "reason: \"sibling-text-finished-work-identity-gate-not-implemented\""
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_737_738_ROWS = freezeArray(
  rowData737738.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      privateAdmission: sourceRow.privateAdmission,
      area: sourceRow.area,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      dependencyWorkerIds: sourceRow.dependencyWorkerIds,
      dependencyDiagnosticIds: sourceRow.dependencyDiagnosticIds,
      blockerContextWorkerIds: sourceRow.blockerContextWorkerIds,
      blockerContextDiagnosticIds: sourceRow.blockerContextDiagnosticIds,
      priorLedgerContext: sourceRow.priorLedgerContext,
      staticLedgerEvidence: sourceRow.staticLedgerEvidence,
      siblingTextPrerequisite: sourceRow.siblingTextPrerequisite,
      siblingIdentityGuard: sourceRow.siblingIdentityGuard,
      runtimeCapabilityAdded: sourceRow.runtimeCapabilityAdded,
      promotion: sourceRow.promotion,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_737_738_SKIPPED_ROWS = freezeArray([]);

export const PRIVATE_ADMISSION_737_738_WORKERS = freezeArray(
  PRIVATE_ADMISSION_737_738_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission737738Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_737_738_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const skippedRows = PRIVATE_ADMISSION_737_738_SKIPPED_ROWS.map((baseRow) =>
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
  const manifest = freezeRecord({
    workerIds: freezeArray(manifestWorkerIds),
    skippedWorkerIds: freezeArray(skippedManifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_737_738_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_737_738_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    ),
    missingSkippedWorkerIds: freezeArray(
      PRIVATE_ADMISSION_737_738_SKIPPED_WORKERS.filter(
        (workerId) => !skippedManifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedSkippedWorkerIds: freezeArray(
      skippedManifestWorkerIds.filter(
        (workerId) =>
          !PRIVATE_ADMISSION_737_738_SKIPPED_WORKERS.includes(workerId)
      )
    ),
    duplicateSkippedWorkerIds: freezeArray(
      skippedManifestWorkerIds.filter(
        (workerId, index) =>
          skippedManifestWorkerIds.indexOf(workerId) !== index
      )
    )
  });

  const evidenceTokenMismatches = allRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError,
          sliceError: evidenceRow.sliceError
        })
      )
  );
  const acceptedDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_737_738_REQUIRED_ACCEPTED_DIAGNOSTICS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds",
    predicate: (row, expected, actual) =>
      acceptedPrivateAdmissionKinds.has(row.privateAdmission) &&
      sameStringSet(expected, actual)
  });
  const dependencyMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCIES,
    actualKey: "dependencyWorkerIds",
    expectedKey: "expectedDependencyWorkerIds",
    actualKeyForViolation: "actualDependencyWorkerIds"
  });
  const dependencyDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCY_DIAGNOSTICS,
    actualKey: "dependencyDiagnosticIds",
    expectedKey: "expectedDependencyDiagnosticIds",
    actualKeyForViolation: "actualDependencyDiagnosticIds"
  });
  const blockerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT,
    actualKey: "blockerContextWorkerIds",
    expectedKey: "expectedBlockerContextWorkerIds",
    actualKeyForViolation: "actualBlockerContextWorkerIds"
  });
  const blockerContextDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
    actualKey: "blockerContextDiagnosticIds",
    expectedKey: "expectedBlockerContextDiagnosticIds",
    actualKeyForViolation: "actualBlockerContextDiagnosticIds"
  });
  const priorLedgerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_737_738_REQUIRED_PRIOR_LEDGER_CONTEXT,
    actualKey: "priorLedgerContext",
    expectedKey: "expectedPriorLedgerContext",
    actualKeyForViolation: "actualPriorLedgerContext"
  });
  const staticLedgerEvidenceMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_737_738_REQUIRED_STATIC_LEDGER_EVIDENCE,
    actualKey: "staticLedgerEvidence",
    expectedKey: "expectedStaticLedgerEvidence",
    actualKeyForViolation: "actualStaticLedgerEvidence"
  });
  const siblingTextPrerequisiteMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_TEXT_PREREQUISITE,
    actualKey: "siblingTextPrerequisite",
    expectedKey: "expectedSiblingTextPrerequisite",
    actualKeyForViolation: "actualSiblingTextPrerequisite"
  });
  const siblingIdentityGuardMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_IDENTITY_GUARD,
    actualKey: "siblingIdentityGuard",
    expectedKey: "expectedSiblingIdentityGuard",
    actualKeyForViolation: "actualSiblingIdentityGuard"
  });
  const publicCompatibilityClaimKeyMismatches = allRows.flatMap((row) => {
    const actualClaimIds = Object.keys(row.publicCompatibilityClaims ?? {});
    if (
      sameStringSet(
        PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS,
        actualClaimIds
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicCompatibilityClaims:
          PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS,
        actualPublicCompatibilityClaims: freezeArray(actualClaimIds)
      })
    ];
  });
  const blockedSurfaceMismatches = allRows.flatMap((row) => {
    const actualBlockedSurfaces = row.blockedPublicCompatibilitySurfaces ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES,
        actualBlockedSurfaces
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES,
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
        PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicClaims:
          PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedPublicClaims: freezeArray(actualBlockedClaims)
      })
    ];
  });
  const blockedAdmissionClaimMismatches = allRows.flatMap((row) => {
    const actualBlockedAdmissionClaims = row.blockedAdmissionClaimIds ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedAdmissionClaims:
          PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims: freezeArray(actualBlockedAdmissionClaims)
      })
    ];
  });

  const staticReadOnlyViolations = allRows
    .filter(
      (row) =>
        row.sourceTokenChecksOnly !== true ||
        row.manifestEvaluationOnly !== true ||
        row.runtimeExecutionClaimed !== false ||
        row.ledgerEvaluationMode !== "source-token-checks-and-manifest-only"
    )
    .map((row) => row.workerId);
  const compatibilityClaimWorkerIds = allRows
    .filter((row) => row.compatibilityClaimed !== false)
    .map((row) => row.workerId);
  const promotionLeakWorkerIds = allRows
    .filter((row) => {
      if (row.privateAdmission === "accepted-private-ledger-evidence") {
        return row.promotion !== "not-applicable";
      }
      return row.promotion !== "rejected";
    })
    .map((row) => row.workerId);
  const publicCompatibilityViolations = allRows.flatMap((row) =>
    row.publicCompatibilityViolations.map(
      (claimId) => `${row.workerId}.${claimId}`
    )
  );
  const blockedAdmissionClaimViolations = allRows.flatMap((row) =>
    row.blockedAdmissionClaimViolations.map(
      (claimId) => `${row.workerId}.${claimId}`
    )
  );
  const nativeJsPackageLeakClaimIds = blockedAdmissionClaimViolations.filter(
    (claimId) =>
      /(?:packageCompatibilityClaimed|rustOnlyDiagnosticPromotedToPackageClaimed|jsFacadeAdmissionClaimed|cjsFacadeAdmissionClaimed|nativeBridgeLoadingClaimed|nativeBridgeExecutionClaimed|nativeExecutionAdmissionClaimed)$/.test(
        claimId
      )
  );
  const publicRendererLeakClaimIds = [
    ...publicCompatibilityViolations,
    ...blockedAdmissionClaimViolations
  ].filter((claimId) =>
    /(?:ReactDom|ReactDOM|ReactRoot|ReactAct|FlushSync|Scheduler|reactDomRootAdmissionClaimed|reactDomActAdmissionClaimed|flushSyncAdmissionClaimed|schedulerAdmissionClaimed)/.test(
      claimId
    )
  );
  const unrecognizedWorkerIds = evaluatedRows
    .filter((row) => !acceptedPrivateAdmissionKinds.has(row.privateAdmission))
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
    "required-private-evidence-not-recognized",
    unrecognizedWorkerIds
  );
  pushIdsViolation(
    violations,
    "required-skip-meta-row-not-recognized",
    unrecognizedSkippedWorkerIds
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
    "static-private-admission-ledger-evidence-mismatch",
    staticLedgerEvidenceMismatches
  );
  pushRowsViolation(
    violations,
    "sibling-text-prerequisite-evidence-mismatch",
    siblingTextPrerequisiteMismatches
  );
  pushRowsViolation(
    violations,
    "sibling-text-identity-guard-mismatch",
    siblingIdentityGuardMismatches
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
    "private-ledger-runtime-execution-claim",
    staticReadOnlyViolations
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
  pushClaimIdsViolation(
    violations,
    "public-root-act-flushsync-reactdom-scheduler-leak-detected",
    publicRendererLeakClaimIds
  );
  pushIdsViolation(
    violations,
    "private-diagnostic-public-promotion-leak",
    promotionLeakWorkerIds
  );

  const evidenceRecognized = evidenceTokenMismatches.length === 0;
  const acceptedDiagnosticsRecognized =
    acceptedDiagnosticMismatches.length === 0 &&
    unrecognizedWorkerIds.length === 0;
  const dependenciesRecognized =
    dependencyMismatches.length === 0 &&
    dependencyDiagnosticMismatches.length === 0;
  const blockerContextRecognized =
    blockerContextMismatches.length === 0 &&
    blockerContextDiagnosticMismatches.length === 0;
  const priorLedgerContextRecognized =
    priorLedgerContextMismatches.length === 0;
  const staticLedgerEvidenceRecognized =
    staticLedgerEvidenceMismatches.length === 0;
  const siblingTextPrerequisiteRecognized =
    siblingTextPrerequisiteMismatches.length === 0;
  const siblingIdentityGuardRecognized =
    siblingIdentityGuardMismatches.length === 0;
  const blockedPublicSurfacesRecognized =
    blockedSurfaceMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicCompatibilityClaimKeyMismatches.length === 0 &&
    blockedPublicClaimMismatches.length === 0 &&
    publicCompatibilityViolations.length === 0;
  const blockedAdmissionClaimsRecognized =
    blockedAdmissionClaimMismatches.length === 0 &&
    blockedAdmissionClaimViolations.length === 0;
  const staticReadOnlyRecognized = staticReadOnlyViolations.length === 0;
  const skipMetaRecognized = unrecognizedSkippedWorkerIds.length === 0;
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
    staticLedgerEvidenceRecognized &&
    siblingTextPrerequisiteRecognized &&
    siblingIdentityGuardRecognized &&
    blockedPublicSurfacesRecognized &&
    blockedPublicClaimsRecognized &&
    blockedAdmissionClaimsRecognized &&
    staticReadOnlyRecognized &&
    skipMetaRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_737_738_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_737_738_GATE_STATUS
      : PRIVATE_ADMISSION_737_738_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    skipMetaRecognized,
    acceptedDiagnosticsRecognized,
    dependenciesRecognized,
    blockerContextRecognized,
    priorLedgerContextRecognized,
    evidenceRecognized,
    staticLedgerEvidenceRecognized,
    siblingTextPrerequisiteRecognized,
    siblingIdentityGuardRecognized,
    blockedPublicSurfacesRecognized,
    blockedPublicClaimsRecognized,
    blockedAdmissionClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    publicCompatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_737_738_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_737_738_SKIPPED_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => acceptedPrivateAdmissionKinds.has(row.privateAdmission))
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
    publicRendererLeakClaimIds: freezeArray(publicRendererLeakClaimIds),
    manifest,
    rows: freezeArray(evaluatedRows),
    skippedRows: freezeArray(evaluatedSkippedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    skippedRowsByWorker: indexRowsByWorker(evaluatedSkippedRows),
    violations: freezeArray(violations)
  });
}

const acceptedPrivateAdmissionKinds = new Set([
  "accepted-private-ledger-evidence",
  "accepted-private-prerequisite-evidence"
]);

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
    staticLedgerEvidence: freezeRecord(data.staticLedgerEvidence ?? {}),
    siblingTextPrerequisite: freezeRecord(data.siblingTextPrerequisite ?? {}),
    siblingIdentityGuard: freezeRecord(data.siblingIdentityGuard ?? {}),
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function evidenceData({
  role,
  path,
  tokens,
  forbiddenTokens = [],
  sliceStart = null,
  sliceEnd = null
}) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens),
    sliceStart,
    sliceEnd
  });
}

function admissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
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
      PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function row({
  workerId,
  privateAdmission,
  area,
  primaryCompatibilityArea,
  acceptedDiagnosticIds,
  dependencyWorkerIds,
  dependencyDiagnosticIds,
  blockerContextWorkerIds,
  blockerContextDiagnosticIds,
  priorLedgerContext,
  staticLedgerEvidence,
  siblingTextPrerequisite,
  siblingIdentityGuard,
  runtimeCapabilityAdded,
  promotion,
  evidence,
  publicCompatibilityClaims,
  privateAdmissionClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "737-738",
    privateAdmission,
    localGateCoverage: "private-admission-737-738-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(dependencyWorkerIds),
    dependencyDiagnosticIds: freezeArray(dependencyDiagnosticIds),
    blockerContextWorkerIds: freezeArray(blockerContextWorkerIds),
    blockerContextDiagnosticIds: freezeArray(blockerContextDiagnosticIds),
    priorLedgerContext: freezeArray(priorLedgerContext),
    staticLedgerEvidence: freezeRecord(staticLedgerEvidence),
    siblingTextPrerequisite: freezeRecord(siblingTextPrerequisite),
    siblingIdentityGuard: freezeRecord(siblingIdentityGuard),
    evidence: freezeArray(evidence),
    runtimeCapabilityAdded,
    compatibilityClaimed: false,
    promotion,
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    ledgerEvaluationMode: "source-token-checks-and-manifest-only",
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES,
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
  if (Object.hasOwn(override, "staticLedgerEvidence")) {
    merged.staticLedgerEvidence = freezeRecord({
      ...row.staticLedgerEvidence,
      ...override.staticLedgerEvidence
    });
  }
  if (Object.hasOwn(override, "siblingTextPrerequisite")) {
    merged.siblingTextPrerequisite = freezeRecord({
      ...row.siblingTextPrerequisite,
      ...override.siblingTextPrerequisite
    });
  }
  if (Object.hasOwn(override, "siblingIdentityGuard")) {
    merged.siblingIdentityGuard = freezeRecord({
      ...row.siblingIdentityGuard,
      ...override.siblingIdentityGuard
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
  const forbiddenTokensPresent =
    sourceText.ok === true
      ? evidenceRow.forbiddenTokens.filter((token) =>
          sourceText.value.includes(token)
        )
      : [];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      sourceText.ok === true &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0,
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
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
