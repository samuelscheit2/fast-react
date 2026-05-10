import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_732_733_GATE_ID,
  PRIVATE_ADMISSION_732_733_GATE_STATUS,
  PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS
} from "./private-admission-732-733-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_734_736_GATE_ID =
  "private-admission-734-736-local-gate-1";
export const PRIVATE_ADMISSION_734_736_GATE_STATUS =
  "recognized-accepted-private-diagnostics-734-736-public-compatibility-blocked";
export const PRIVATE_ADMISSION_734_736_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-734-736-with-violations";

export const PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS,
    "publicTestRendererSiblingSnapshotFinishedWorkIdentityAdmissionClaimed",
    "publicTestRendererNestedToJSONSourceReportIdentityClaimed"
  ]);

export const PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES = freezeUniqueArray([
  ...PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
  "test-renderer-sibling-snapshot-finished-work-identity-blocker",
  "test-renderer-sibling-snapshot-finished-work-identity-admission",
  "test-renderer-public-nested-tojson-source-report-identity"
]);

export const PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS,
    "siblingSnapshotFinishedWorkIdentityAdmissionClaimed",
    "nestedToJSONSourceReportPublicPromotionClaimed",
    "rustOnlyDiagnosticPromotedToPackageClaimed"
  ]);

const worker734 = "worker-734-package-private-admission-audit-732-733";
const worker735 = "worker-735-sibling-snapshot-identity-blocker";
const worker736 = "worker-736-nested-tojson-source-report-identity";

export const PRIVATE_ADMISSION_734_736_SKIPPED_WORKERS = Object.freeze([
  worker734
]);

export const PRIVATE_ADMISSION_734_736_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    [worker735]: freezeArray([
      "test-renderer-tojson-sibling-snapshot-finished-work-identity-blocker",
      "private-tojson-sibling-snapshot-finished-work-identity-blocked",
      "private-tojson-sibling-snapshot-fail-closed-tamper-validation"
    ]),
    [worker736]: freezeArray([
      "test-renderer-tojson-nested-source-report-finished-work-identity-generation",
      "private-nested-tojson-source-report-backed-finished-work-identity-validation",
      "private-nested-committed-fiber-inspection-backed-tojson-identity"
    ])
  });

export const PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCIES = freezeRecord({
  [worker735]: freezeArray([
    "worker-720-test-renderer-serialization-finished-work-identity",
    "worker-725-test-renderer-update-serialization-finished-work-identity",
    "worker-726-test-renderer-update-native-serialization-identity-admission",
    "worker-731-tojson-nested-update-native-identity"
  ]),
  [worker736]: freezeArray([
    "worker-731-tojson-nested-update-native-identity",
    worker735
  ])
});

export const PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCY_DIAGNOSTICS =
  freezeRecord({
    [worker735]: freezeArray([
      "test-renderer-serialization-finished-work-identity",
      "test-renderer-update-serialization-finished-work-identity",
      "test-renderer-update-native-serialization-identity-admission",
      "private-nested-tojson-update-native-finished-work-identity-validation"
    ]),
    [worker736]: freezeArray([
      "private-nested-tojson-update-native-finished-work-identity-validation",
      "fast-react-test-renderer.tojson.sibling-snapshot.finished-work-identity-blocker",
      "private-tojson-sibling-snapshot-finished-work-identity-blocked"
    ])
  });

export const PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT =
  freezeRecord({
    [worker735]: freezeArray([
      worker734,
      "worker-733-test-renderer-unmount-finished-work-identity"
    ]),
    [worker736]: freezeArray([worker734, worker735])
  });

export const PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS =
  freezeRecord({
    [worker735]: freezeArray([
      PRIVATE_ADMISSION_732_733_GATE_ID,
      PRIVATE_ADMISSION_732_733_GATE_STATUS,
      "private-unmount-tojson-native-finished-work-identity-validation",
      "private-unmount-totree-native-finished-work-identity-validation"
    ]),
    [worker736]: freezeArray([
      PRIVATE_ADMISSION_732_733_GATE_ID,
      PRIVATE_ADMISSION_732_733_GATE_STATUS,
      "private-tojson-sibling-snapshot-finished-work-identity-blocked",
      "missing-committed-sibling-text-fiber-inspection-and-handoff"
    ])
  });

export const PRIVATE_ADMISSION_734_736_REQUIRED_PRIOR_LEDGER_CONTEXT =
  freezeRecord({
    [worker735]: freezeArray([
      worker734,
      PRIVATE_ADMISSION_732_733_GATE_ID,
      PRIVATE_ADMISSION_732_733_GATE_STATUS,
      "worker-732-package-private-admission-audit-729-731",
      "worker-733-test-renderer-unmount-finished-work-identity"
    ]),
    [worker736]: freezeArray([
      worker734,
      PRIVATE_ADMISSION_732_733_GATE_ID,
      PRIVATE_ADMISSION_732_733_GATE_STATUS,
      "worker-733-test-renderer-unmount-finished-work-identity",
      worker735
    ])
  });

export const PRIVATE_ADMISSION_734_736_REQUIRED_SIBLING_SNAPSHOT_BLOCKER =
  freezeRecord({
    [worker735]: freezeRecord({
      snapshotBasedHostOutputRow: true,
      candidateIdentityMatchesUpdateRouteHandoff: true,
      candidateIdentitySourceReportMatchesToJSON: true,
      plausibleIdentityRejected: true,
      missingCommittedSiblingTextFiberInspection: true,
      missingCommittedSiblingTextReportShape: true,
      missingRealSiblingTextHandoff: true,
      identityAdmissionBlocked: true,
      tamperFailsClosed: true,
      publicNativePackageBlocked: true
    })
  });

export const PRIVATE_ADMISSION_734_736_REQUIRED_NESTED_SOURCE_REPORT_EVIDENCE =
  freezeRecord({
    [worker736]: freezeRecord({
      committedNestedFiberInspectionBacked: true,
      nestedOutputOwnsCommittedInspection: true,
      sourceReportBackedIdentity: true,
      sourceReportNodeShapeBound: true,
      helperRemoved: true,
      siblingSnapshotRemainsBlocked: true
    })
  });

const skippedRowData734736 = Object.freeze([
  skippedRowData({
    workerId: worker734,
    area: "previous private-admission ledger audit for Workers 732-733",
    skipReason: "prior-ledger-context-no-new-runtime-capability",
    evidenceRows: [
      evidenceData({
        role: "worker-734-prior-ledger-report",
        path: "worker-progress/worker-734-package-private-admission-audit-732-733.md",
        tokens: [
          "# Worker 734: Package Private Admission Audit 732-733",
          "Added the static private-admission ledger/audit for Workers 732-733.",
          "Recorded Worker 733 as accepted Rust-only private unmount finished-work",
          "nested source-report identity, and",
          "Scope first-class nested source-report identity and sibling snapshot identity"
        ]
      }),
      evidenceData({
        role: "worker-734-prior-ledger-source",
        path: "tests/conformance/src/private-admission-732-733-gate.mjs",
        tokens: [
          "PRIVATE_ADMISSION_732_733_GATE_ID",
          "recognized-accepted-private-diagnostics-732-733-public-compatibility-blocked",
          "worker-733-test-renderer-unmount-finished-work-identity",
          "nestedSourceReportIdentityClaimed",
          "siblingSnapshotIdentityClaimed",
          "publicTestRendererJSFacadeAdmissionClaimed",
          "publicTestRendererCJSFacadeAdmissionClaimed"
        ]
      }),
      evidenceData({
        role: "worker-734-prior-ledger-test",
        path: "tests/conformance/test/private-admission-732-733-gate.test.mjs",
        tokens: [
          "private admission 732-733 gate recognizes accepted Worker 733 evidence without public compatibility",
          "private admission 732-733 gate rejects native, JS, CJS, and package leaks",
          "private admission 732-733 gate rejects removing a 729-731 carried-forward admission blocker"
        ]
      })
    ]
  })
]);

const rowData734736 = Object.freeze([
  rowData({
    workerId: worker735,
    area: "react-test-renderer Rust-only sibling snapshot finished-work identity blocker diagnostic",
    primaryCompatibilityArea:
      "test-renderer-tojson-sibling-snapshot-finished-work-identity-blocker",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_ACCEPTED_DIAGNOSTICS[worker735],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCIES[worker735],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker735],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT[worker735],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[worker735],
    priorLedgerContext:
      PRIVATE_ADMISSION_734_736_REQUIRED_PRIOR_LEDGER_CONTEXT[worker735],
    siblingSnapshotBlocker:
      PRIVATE_ADMISSION_734_736_REQUIRED_SIBLING_SNAPSHOT_BLOCKER[worker735],
    nestedSourceReportEvidence: {},
    evidenceRows: [
      evidenceData({
        role: "worker-735-sibling-snapshot-blocker-report",
        path: "worker-progress/worker-735-sibling-snapshot-identity-blocker.md",
        tokens: [
          "# Worker 735 - sibling snapshot identity blocker",
          "Added a Rust-only private `toJSON` sibling snapshot finished-work identity",
          "because the path has no committed",
          "sibling-text fiber inspection/report shape and no real sibling-text handoff.",
          "Tamper validation rejects attempts to mark the missing sibling-text handoff",
          "Public serialization, JS/CJS admission, native bridge loading/execution,"
        ]
      }),
      evidenceData({
        role: "worker-735-sibling-snapshot-blocker-constants-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_DIAGNOSTIC_NAME",
        sliceEnd: "pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID",
        tokens: [
          "TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_DIAGNOSTIC_NAME",
          "fast-react-test-renderer.tojson.sibling-snapshot.finished-work-identity-blocker",
          "TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_STATUS",
          "private-tojson-sibling-snapshot-finished-work-identity-blocked",
          "TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_SNAPSHOT_IDENTITY_BLOCKER_REASON",
          "missing-committed-sibling-text-fiber-inspection-and-handoff"
        ]
      }),
      evidenceData({
        role: "worker-735-sibling-snapshot-blocker-struct-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub struct TestRendererPrivateToJsonSiblingSnapshotFinishedWorkIdentityBlocker",
        sliceEnd: "pub struct TestRendererPrivateJsonSerializationReport",
        tokens: [
          "snapshot_based_host_output_row: bool",
          "candidate_identity_source_report_matches_to_json: bool",
          "candidate_identity_matches_update_route_handoff: bool",
          "plausible_finished_work_identity_rejected: bool",
          "committed_sibling_text_fiber_inspection_available: bool",
          "committed_sibling_text_report_shape_available: bool",
          "real_sibling_text_handoff_available: bool",
          "identity_admission_blocked(self) -> bool",
          "&& !self.native_bridge_available()",
          "&& !self.native_execution_available()",
          "&& !self.package_compatibility_claimed()"
        ]
      }),
      evidenceData({
        role: "worker-735-sibling-snapshot-preflight-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn describe_private_to_json_sibling_text_snapshot_finished_work_identity_blocker_for_diagnostics",
        sliceEnd:
          "pub fn describe_private_to_json_after_unmount_native_execution_for_canary",
        tokens: [
          "self.validate_private_to_json_update_native_execution_record_for_canary(execution)?;",
          "candidate_identity_source_report_matches_to_json",
          "candidate_identity_matches_update_route_handoff",
          "plausible_finished_work_identity_rejected:",
          "committed_sibling_text_fiber_inspection_available: false",
          "committed_sibling_text_report_shape_available: false",
          "real_sibling_text_handoff_available: false",
          "identity_admission_available: false",
          "native_bridge_available: false",
          "native_execution_available: false",
          "package_compatibility_claimed: false"
        ]
      }),
      evidenceData({
        role: "worker-735-sibling-snapshot-validator-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn validate_private_to_json_sibling_snapshot_finished_work_identity_blocker_for_diagnostics",
        sliceEnd: "fn validate_private_update_native_execution_matches_handoff_for_canary",
        tokens: [
          "sibling-snapshot-identity-blocker-diagnostic-mismatch",
          "sibling-snapshot-identity-binding-unexpectedly-open",
          "sibling-snapshot-finished-work-identity-admitted",
          "sibling-snapshot-plausible-identity-not-rejected",
          "sibling-snapshot-identity-blocker-reason-mismatch",
          "public-or-native-compatibility-claim"
        ]
      }),
      evidenceData({
        role: "worker-735-sibling-snapshot-success-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_json_sibling_snapshot_finished_work_identity_blocker_rejects_plausible_identity",
        sliceEnd:
          "fn root_private_to_json_sibling_snapshot_finished_work_identity_blocker_fails_closed_when_tampered",
        tokens: [
          "assert!(blocker.candidate_identity_plausible_for_update_to_json());",
          "assert!(blocker.candidate_identity_matches_update_route_handoff());",
          "assert!(blocker.plausible_finished_work_identity_rejected());",
          "assert!(!blocker.committed_sibling_text_fiber_inspection_available());",
          "assert!(!blocker.committed_sibling_text_report_shape_available());",
          "assert!(!blocker.real_sibling_text_handoff_available());",
          "assert!(!blocker.identity_admission_available());",
          "assert!(!blocker.native_bridge_available());",
          "assert!(!blocker.native_execution_available());",
          "assert!(!blocker.package_compatibility_claimed());"
        ]
      }),
      evidenceData({
        role: "worker-735-sibling-snapshot-tamper-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_json_sibling_snapshot_finished_work_identity_blocker_fails_closed_when_tampered",
        sliceEnd:
          "fn root_private_to_json_native_execution_evidence_rejects_row_id_shape_mismatch",
        tokens: [
          "assert!(blocker.identity_admission_blocked());",
          "blocker.real_sibling_text_handoff_available = true;",
          "validate_private_to_json_sibling_snapshot_finished_work_identity_blocker_for_diagnostics",
          "sibling-snapshot-identity-binding-unexpectedly-open"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker736,
    area: "react-test-renderer Rust-only nested toJSON source-report finished-work identity generation",
    primaryCompatibilityArea:
      "test-renderer-tojson-nested-source-report-finished-work-identity",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_ACCEPTED_DIAGNOSTICS[worker736],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCIES[worker736],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker736],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT[worker736],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[worker736],
    priorLedgerContext:
      PRIVATE_ADMISSION_734_736_REQUIRED_PRIOR_LEDGER_CONTEXT[worker736],
    siblingSnapshotBlocker: {},
    nestedSourceReportEvidence:
      PRIVATE_ADMISSION_734_736_REQUIRED_NESTED_SOURCE_REPORT_EVIDENCE[
        worker736
      ],
    evidenceRows: [
      evidenceData({
        role: "worker-736-nested-source-report-progress",
        path: "worker-progress/worker-736-nested-tojson-source-report-identity.md",
        tokens: [
          "# Worker 736 Nested toJSON Source Report Identity",
          "Rust-only nested `toJSON` source-report finished-work identity generation",
          "backed by committed nested fiber inspection",
          "Removed `accepted_nested_to_json_identity_for_root`",
          "Worker 735's `sibling_snapshot` blocker tests pass unchanged",
          "Sibling snapshot finished-work identity remains intentionally blocked"
        ]
      }),
      evidenceData({
        role: "worker-736-reconciler-nested-inspection-rust-proof",
        path: "crates/fast-react-reconciler/src/private_fiber_inspection.rs",
        sliceStart: "fn finish_nested_host_component_shape(",
        sliceEnd: "fn finish_function_component_shape(",
        tokens: [
          "HostRoot->HostComponent->HostComponent->HostText",
          "HostRoot->HostComponent->HostComponent->[HostText,HostText]",
          "nodes.push(nested.outer);",
          "nodes.push(nested.inner);",
          "nodes.extend(nested.texts.iter().copied());",
          "vec![nested.outer, nested.inner]",
          "nested.texts.clone()"
        ]
      }),
      evidenceData({
        role: "worker-736-reconciler-nested-inspection-test-rust-proof",
        path: "crates/fast-react-reconciler/src/private_fiber_inspection.rs",
        sliceStart:
          "fn committed_fiber_inspection_describes_nested_host_component_shape()",
        sliceEnd: "fn committed_fiber_inspection_rejects_empty_current_host_root()",
        tokens: [
          "HostRoot->HostComponent->HostComponent->[HostText,HostText]",
          "assert_eq!(inspection.host_components().len(), 2);",
          "assert_eq!(inspection.host_texts().len(), 2);",
          "assert!(inspection.is_nested_host_component_shape());",
          "assert_eq!(first_text.sibling(), Some(second_text.fiber()));",
          "assert!(outer.state_node_present());",
          "assert!(inner.state_node_present());",
          "assert!(second_text.state_node_present());"
        ]
      }),
      evidenceData({
        role: "worker-736-nested-output-owns-inspection-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn render_and_commit_nested_host_parent_text_placement_for_canary",
        sliceEnd:
          "pub fn render_and_commit_host_output_insert_before_stable_sibling_for_canary",
        tokens: [
          "let scheduled_update_sequence = self.scheduled_updates.len();",
          "let fiber_inspection = self.describe_committed_fiber_tree_for_canary(&commit)?;",
          "TestRendererNestedHostParentPlacedHostOutput {",
          "outer_fibers: next_outer_fibers",
          "inner_fibers: next_inner_fibers",
          "fiber_inspection",
          "host_parent_placement_apply_count"
        ]
      }),
      evidenceData({
        role: "worker-736-nested-json-report-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn describe_private_json_serialization_after_nested_update_for_canary",
        sliceEnd: "pub fn describe_private_to_json_host_output_update_row_for_canary",
        tokens: [
          "self.describe_private_to_json_nested_host_output_update_row_for_canary(output)?",
          "output.fiber_inspection()",
          "TestRendererPrivateJsonCurrentFibersForCanary::Nested",
          "outer: output.outer_fibers()",
          "inner: output.inner_fibers()",
          "Some(host_output_row)"
        ]
      }),
      evidenceData({
        role: "worker-736-nested-json-current-fibers-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart: "fn validate_private_json_nested_canary_current_fibers",
        sliceEnd: "fn validate_private_json_raw_handle",
        tokens: [
          "fiber_inspection.is_nested_host_component_shape()",
          "fiber_inspection.host_components().len() != 2",
          "fiber_inspection.host_texts().len() != 2",
          "let outer_component = fiber_inspection.host_components()[0];",
          "let inner_component = fiber_inspection.host_components()[1];",
          "let stable_text = fiber_inspection.host_texts()[0];",
          "let placed_text = fiber_inspection.host_texts()[1];",
          "placed_text.pending_props() != placed_text.memoized_props()",
          "|| !placed_text.state_node_present()"
        ]
      }),
      evidenceData({
        role: "worker-736-nested-json-source-nodes-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart: "fn private_json_nested_nodes_from_component_and_fibers",
        sliceEnd: "fn private_json_rendered_root_from_component",
        tokens: [
          "let host_components = fiber_inspection.host_components();",
          "let host_texts = fiber_inspection.host_texts();",
          "child_ordinals: vec![1]",
          "fiber: Self::private_json_fiber_diagnostic(host_components[0])",
          "fiber: Self::private_json_fiber_diagnostic(host_components[1])",
          "fiber: Self::private_json_fiber_diagnostic(host_texts[index])",
          "text: Some(text.text().to_owned())"
        ]
      }),
      evidenceData({
        role: "worker-736-nested-identity-source-report-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn describe_private_to_json_nested_finished_work_identity_gate_for_canary",
        sliceEnd:
          "pub fn describe_private_to_json_unmount_finished_work_identity_gate_for_canary",
        tokens: [
          "output: &TestRendererNestedHostParentPlacedHostOutput",
          "report: Option<&TestRendererPrivateJsonSerializationReport>",
          "TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME",
          "report.host_output_update_kind()",
          "report.host_output_snapshot_current()",
          "report.public_blockers()",
          "Some(output.render())",
          "Some(output.commit())",
          "report.gate()"
        ]
      }),
      evidenceData({
        role: "worker-736-finished-work-identity-committed-inspection-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn describe_private_serialization_finished_work_identity_gate_for_canary",
        sliceEnd:
          "fn describe_private_unmount_serialization_finished_work_identity_gate_for_canary",
        tokens: [
          "let Some(fiber_inspection) = report_gate.fiber_inspection() else",
          "reason: \"missing-committed-fiber-inspection\"",
          "if fiber_inspection.current() != commit.current()",
          "reason: \"committed-fiber-inspection-current-mismatch\"",
          "committed_fiber_inspection_current_matches_commit: true",
          "consumes_committed_host_root_finished_work_identity: true",
          "consumes_committed_host_root_finished_work_lanes: true",
          "public_serialization_available: false",
          "compatibility_claimed: false"
        ]
      }),
      evidenceData({
        role: "worker-736-nested-source-report-test-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_json_nested_update_native_execution_requires_finished_work_identity_gate()",
        sliceEnd:
          "fn root_private_to_json_nested_update_native_execution_evidence_consumes_multichild_row()",
        tokens: [
          "describe_private_json_serialization_after_nested_update_for_canary(&placed)",
          "let report_fibers = report.gate().fiber_inspection().unwrap();",
          "TestRendererPrivateToJsonHostOutputShape::NestedHostText",
          "assert_eq!(report.node_count(), 4);",
          "assert_eq!(report_fibers.host_components().len(), 2);",
          "assert_eq!(report_fibers.host_texts().len(), 2);",
          "describe_private_to_json_nested_finished_work_identity_gate_for_canary",
          "reason: \"finished-work-identity-missing\"",
          "reason: \"update-admission-finished-work-identity-mismatch\"",
          "reason: \"update-admission-finished-work-identity-lane-mismatch\""
        ]
      }),
      evidenceData({
        role: "worker-736-helper-removed-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        tokens: [
          "pub fn describe_private_to_json_nested_finished_work_identity_gate_for_canary"
        ],
        forbiddenTokens: [
          "fn accepted_nested_to_json_identity_for_root",
          "accepted_nested_to_json_identity_for_root("
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_734_736_SKIPPED_ROWS = freezeArray(
  skippedRowData734736.map((sourceRow) =>
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

export const PRIVATE_ADMISSION_734_736_ROWS = freezeArray(
  rowData734736.map((sourceRow) =>
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
      siblingSnapshotBlocker: sourceRow.siblingSnapshotBlocker,
      nestedSourceReportEvidence: sourceRow.nestedSourceReportEvidence,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_734_736_WORKERS = freezeArray(
  PRIVATE_ADMISSION_734_736_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission734736Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_734_736_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const skippedRows = PRIVATE_ADMISSION_734_736_SKIPPED_ROWS.map((baseRow) =>
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
      PRIVATE_ADMISSION_734_736_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_734_736_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    ),
    missingSkippedWorkerIds: freezeArray(
      PRIVATE_ADMISSION_734_736_SKIPPED_WORKERS.filter(
        (workerId) => !skippedManifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedSkippedWorkerIds: freezeArray(
      skippedManifestWorkerIds.filter(
        (workerId) =>
          !PRIVATE_ADMISSION_734_736_SKIPPED_WORKERS.includes(workerId)
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
    requiredByWorker: PRIVATE_ADMISSION_734_736_REQUIRED_ACCEPTED_DIAGNOSTICS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds",
    predicate: (row, expected, actual) =>
      row.privateAdmission === "accepted-private-diagnostic" &&
      sameStringSet(expected, actual)
  });
  const dependencyMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCIES,
    actualKey: "dependencyWorkerIds",
    expectedKey: "expectedDependencyWorkerIds",
    actualKeyForViolation: "actualDependencyWorkerIds"
  });
  const dependencyDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCY_DIAGNOSTICS,
    actualKey: "dependencyDiagnosticIds",
    expectedKey: "expectedDependencyDiagnosticIds",
    actualKeyForViolation: "actualDependencyDiagnosticIds"
  });
  const blockerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT,
    actualKey: "blockerContextWorkerIds",
    expectedKey: "expectedBlockerContextWorkerIds",
    actualKeyForViolation: "actualBlockerContextWorkerIds"
  });
  const blockerContextDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
    actualKey: "blockerContextDiagnosticIds",
    expectedKey: "expectedBlockerContextDiagnosticIds",
    actualKeyForViolation: "actualBlockerContextDiagnosticIds"
  });
  const priorLedgerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_734_736_REQUIRED_PRIOR_LEDGER_CONTEXT,
    actualKey: "priorLedgerContext",
    expectedKey: "expectedPriorLedgerContext",
    actualKeyForViolation: "actualPriorLedgerContext"
  });
  const siblingSnapshotBlockerMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_734_736_REQUIRED_SIBLING_SNAPSHOT_BLOCKER,
    actualKey: "siblingSnapshotBlocker",
    expectedKey: "expectedSiblingSnapshotBlocker",
    actualKeyForViolation: "actualSiblingSnapshotBlocker"
  });
  const nestedSourceReportEvidenceMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_734_736_REQUIRED_NESTED_SOURCE_REPORT_EVIDENCE,
    actualKey: "nestedSourceReportEvidence",
    expectedKey: "expectedNestedSourceReportEvidence",
    actualKeyForViolation: "actualNestedSourceReportEvidence"
  });
  const publicCompatibilityClaimKeyMismatches = allRows.flatMap((row) => {
    const actualClaimIds = Object.keys(row.publicCompatibilityClaims ?? {});
    if (
      sameStringSet(
        PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS,
        actualClaimIds
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicCompatibilityClaims:
          PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS,
        actualPublicCompatibilityClaims: freezeArray(actualClaimIds)
      })
    ];
  });
  const blockedSurfaceMismatches = allRows.flatMap((row) => {
    const actualBlockedSurfaces = row.blockedPublicCompatibilitySurfaces ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
        actualBlockedSurfaces
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
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
        PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicClaims:
          PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedPublicClaims: freezeArray(actualBlockedClaims)
      })
    ];
  });
  const blockedAdmissionClaimMismatches = allRows.flatMap((row) => {
    const actualBlockedAdmissionClaims = row.blockedAdmissionClaimIds ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedAdmissionClaims:
          PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS,
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
    "sibling-snapshot-blocker-evidence-mismatch",
    siblingSnapshotBlockerMismatches
  );
  pushRowsViolation(
    violations,
    "nested-source-report-evidence-mismatch",
    nestedSourceReportEvidenceMismatches
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
    acceptedDiagnosticMismatches.length === 0 &&
    unrecognizedWorkerIds.length === 0;
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
  const siblingSnapshotBlockerRecognized =
    siblingSnapshotBlockerMismatches.length === 0;
  const nestedSourceReportEvidenceRecognized =
    nestedSourceReportEvidenceMismatches.length === 0;
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
    siblingSnapshotBlockerRecognized &&
    nestedSourceReportEvidenceRecognized &&
    blockedPublicSurfacesRecognized &&
    blockedPublicClaimsRecognized &&
    blockedAdmissionClaimsRecognized &&
    skipMetaRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_734_736_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_734_736_GATE_STATUS
      : PRIVATE_ADMISSION_734_736_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    skipMetaRecognized,
    acceptedDiagnosticsRecognized,
    dependenciesRecognized,
    blockerContextRecognized,
    priorLedgerContextRecognized,
    evidenceRecognized,
    siblingSnapshotBlockerRecognized,
    nestedSourceReportEvidenceRecognized,
    blockedPublicSurfacesRecognized,
    blockedPublicClaimsRecognized,
    blockedAdmissionClaimsRecognized,
    compatibilityClaimed,
    publicCompatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_734_736_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_734_736_SKIPPED_WORKERS,
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
    manifest,
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
    siblingSnapshotBlocker: freezeRecord(data.siblingSnapshotBlocker ?? {}),
    nestedSourceReportEvidence: freezeRecord(
      data.nestedSourceReportEvidence ?? {}
    ),
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
      PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
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
      PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS.map((claimId) => [
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
  siblingSnapshotBlocker,
  nestedSourceReportEvidence,
  evidence,
  publicCompatibilityClaims,
  privateAdmissionClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "734-736",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-734-736-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(dependencyWorkerIds),
    dependencyDiagnosticIds: freezeArray(dependencyDiagnosticIds),
    blockerContextWorkerIds: freezeArray(blockerContextWorkerIds),
    blockerContextDiagnosticIds: freezeArray(blockerContextDiagnosticIds),
    priorLedgerContext: freezeArray(priorLedgerContext),
    siblingSnapshotBlocker: freezeRecord(siblingSnapshotBlocker),
    nestedSourceReportEvidence: freezeRecord(nestedSourceReportEvidence),
    evidence: freezeArray(evidence),
    runtimeCapabilityAdded: true,
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
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
    sourceQueue: "734-736",
    privateAdmission: "skipped-meta",
    localGateCoverage: "private-admission-734-736-local-gate",
    acceptedDiagnosticIds: freezeArray([]),
    dependencyWorkerIds: freezeArray([]),
    dependencyDiagnosticIds: freezeArray([]),
    blockerContextWorkerIds: freezeArray([]),
    blockerContextDiagnosticIds: freezeArray([]),
    priorLedgerContext: freezeArray([]),
    siblingSnapshotBlocker: freezeRecord({}),
    nestedSourceReportEvidence: freezeRecord({}),
    evidence: freezeArray(evidence),
    runtimeCapabilityAdded: false,
    compatibilityClaimed: false,
    promotion: "not-applicable",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
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
  if (Object.hasOwn(override, "siblingSnapshotBlocker")) {
    merged.siblingSnapshotBlocker = freezeRecord({
      ...row.siblingSnapshotBlocker,
      ...override.siblingSnapshotBlocker
    });
  }
  if (Object.hasOwn(override, "nestedSourceReportEvidence")) {
    merged.nestedSourceReportEvidence = freezeRecord({
      ...row.nestedSourceReportEvidence,
      ...override.nestedSourceReportEvidence
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
