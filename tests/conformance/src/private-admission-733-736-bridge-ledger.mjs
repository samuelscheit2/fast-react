import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS
} from "./private-admission-734-736-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

const testRendererRustSource = "crates/fast-react-test-renderer/src/lib.rs";
const reconcilerInspectionRustSource =
  "crates/fast-react-reconciler/src/private_fiber_inspection.rs";
const rustIdentifierTokenPolicy =
  "rust-source-identifiers-statuses-function-and-field-names";

const worker733 = "worker-733-test-renderer-unmount-finished-work-identity";
const worker736 = "worker-736-nested-tojson-source-report-identity";

export const PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID =
  "private-admission-733-736-bridge-ledger-1";
export const PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS =
  "recognized-private-admission-733-736-bridge-prerequisites-public-compatibility-blocked";
export const PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_VIOLATION_STATUS =
  "blocked-private-admission-733-736-bridge-prerequisites-with-violations";

export const PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS = freezeArray([
  worker733,
  worker736
]);

export const PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES = freezeArray(
  PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES
);
export const PRIVATE_ADMISSION_733_736_BRIDGE_PUBLIC_COMPATIBILITY_CLAIMS =
  freezeArray(PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS);
export const PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_ADMISSION_CLAIMS =
  freezeArray(PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS);

export const PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS =
  freezeRecord({
    surfaces: freezeArray([
      "package",
      "package-surface",
      "test-renderer",
      "test-renderer-public-serialization",
      "test-renderer-to-json",
      "test-renderer-to-tree",
      "test-renderer-root",
      "test-renderer-root-routing",
      "test-renderer-js-facade",
      "test-renderer-cjs-facade",
      "test-renderer-native-addon-loading",
      "test-renderer-native-addon-execution",
      "test-renderer-native-bridge",
      "test-renderer-native-bridge-execution",
      "test-renderer-native-bridge-loading",
      "test-renderer-update-native-serialization",
      "test-renderer-unmount-native-serialization",
      "test-renderer-public-unmount",
      "test-renderer-public-unmount-finished-work-identity",
      "test-renderer-nested-source-report-identity",
      "test-renderer-public-nested-tojson-source-report-identity",
      "test-renderer-multichild-serialization",
      "test-renderer-multichild-sibling-serialization",
      "test-renderer-sibling-snapshot-serialization",
      "test-renderer-multichild-identity-admission",
      "test-renderer-multichild-sibling-identity-admission",
      "test-renderer-sibling-snapshot-identity-admission",
      "test-renderer-sibling-snapshot-finished-work-identity-blocker",
      "test-renderer-sibling-snapshot-finished-work-identity-admission",
      "act",
      "react-dom-root",
      "scheduler"
    ]),
    publicCompatibilityClaims: freezeArray([
      "publicPackageCompatibilityClaimed",
      "publicPackageSurfaceCompatibilityClaimed",
      "publicTestRendererCompatibilityClaimed",
      "publicTestRendererSerializationCompatibilityClaimed",
      "publicTestRendererToJSONCompatibilityClaimed",
      "publicTestRendererToTreeCompatibilityClaimed",
      "publicTestRendererRootCompatibilityClaimed",
      "publicTestRendererJSFacadeAdmissionClaimed",
      "publicTestRendererCJSFacadeAdmissionClaimed",
      "publicTestRendererNativeAddonLoadingCompatibilityClaimed",
      "publicTestRendererNativeAddonExecutionCompatibilityClaimed",
      "publicTestRendererNativeBridgeCompatibilityClaimed",
      "publicTestRendererNativeBridgeExecutionClaimed",
      "publicTestRendererNativeBridgeLoadingCompatibilityClaimed",
      "publicTestRendererUpdateNativeSerializationCompatibilityClaimed",
      "publicTestRendererUnmountNativeSerializationCompatibilityClaimed",
      "publicTestRendererUnmountFinishedWorkIdentityAdmissionClaimed",
      "publicTestRendererNestedSourceReportIdentityClaimed",
      "publicTestRendererNestedToJSONSourceReportIdentityClaimed",
      "publicTestRendererMultichildSerializationCompatibilityClaimed",
      "publicTestRendererMultichildSiblingSerializationCompatibilityClaimed",
      "publicTestRendererSiblingSnapshotSerializationCompatibilityClaimed",
      "publicTestRendererMultichildIdentityAdmissionClaimed",
      "publicTestRendererMultichildSiblingIdentityAdmissionClaimed",
      "publicTestRendererSiblingSnapshotIdentityAdmissionClaimed",
      "publicTestRendererSiblingSnapshotFinishedWorkIdentityAdmissionClaimed",
      "publicActCompatibilityClaimed",
      "publicReactDomRootCompatibilityClaimed",
      "publicSchedulerCompatibilityClaimed"
    ]),
    blockedAdmissionClaims: freezeArray([
      "nativeExecutionAdmissionClaimed",
      "jsFacadeAdmissionClaimed",
      "cjsFacadeAdmissionClaimed",
      "packageCompatibilityClaimed",
      "publicSerializationAdmissionClaimed",
      "nativeBridgeLoadingClaimed",
      "nativeBridgeExecutionClaimed",
      "nestedSourceReportIdentityClaimed",
      "nestedToJSONSourceReportPublicPromotionClaimed",
      "siblingSnapshotAdmissionClaimed",
      "siblingSnapshotIdentityClaimed",
      "siblingSnapshotFinishedWorkIdentityAdmissionClaimed",
      "toTreePromotionClaimed",
      "publicCompatibilityPromotionClaimed",
      "publicPackageCompatibilityPromotionClaimed",
      "rustOnlyDiagnosticPromotedToPackageClaimed"
    ])
  });

export const PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS =
  freezeRecord({
    [worker733]: freezeRecord({
      routeAdmissionPinned: true,
      finishedWorkIdentityPinned: true,
      finishedWorkLanesPinned: true,
      deletionCommitMetadataPinned: true,
      cleanupHandoffMetadataPinned: true,
      sourceReportOwnershipPinned: false,
      publicCompatibilityBlocked: true
    }),
    [worker736]: freezeRecord({
      routeAdmissionPinned: true,
      finishedWorkIdentityPinned: true,
      finishedWorkLanesPinned: true,
      deletionCommitMetadataPinned: false,
      cleanupHandoffMetadataPinned: false,
      sourceReportOwnershipPinned: true,
      publicCompatibilityBlocked: true
    })
  });

const rowData733736 = freezeArray([
  rowData({
    workerId: worker733,
    bridgeScope: "unmount-finished-work-identity-to-native-serialization",
    prerequisiteFor: freezeArray([
      "test-renderer-unmount-tojson-native-serialization",
      "test-renderer-unmount-totree-native-serialization"
    ]),
    binding: PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS[worker733],
    evidenceRows: [
      evidenceData({
        evidenceId: "worker-733-unmount-native-admission-struct",
        path: testRendererRustSource,
        sliceStart: "pub struct TestRendererUnmountNativeBridgeAdmission",
        sliceEnd: "pub struct TestRendererUnmountNativeBridgeCleanupHandoff",
        tokens: [
          "pub struct TestRendererUnmountNativeBridgeAdmission",
          "diagnostic_id: &'static str",
          "status: &'static str",
          "route_dependency_id: &'static str",
          "deletion_commit_handoff_id: &'static str",
          "cleanup_handoff_id: &'static str",
          "render_finished_work: TestRendererFiberHandleDiagnostics",
          "commit_finished_lanes_bits: u32",
          "deletion_commit_handoff_accepted: bool",
          "cleanup_handoff_accepted: bool",
          "passive_ref_cleanup_order_accepted: bool",
          "native_bridge_available: bool",
          "native_execution: bool",
          "pub const fn deletion_commit_handoff_id(self) -> &'static str",
          "pub const fn cleanup_handoff_id(self) -> &'static str",
          "pub const fn render_finished_work(self) -> TestRendererFiberHandleDiagnostics",
          "pub const fn commit_finished_lanes_bits(self) -> u32"
        ]
      }),
      evidenceData({
        evidenceId: "worker-733-unmount-native-status-constants",
        path: testRendererRustSource,
        sliceStart: "pub const TEST_RENDERER_SERIALIZATION_CANARY_GATE_NAME",
        sliceEnd: "pub const TEST_RENDERER_PRIVATE_TREE_METADATA_DIAGNOSTIC_NAME",
        tokens: [
          "TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID",
          "TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID",
          "TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_STATUS",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_STATUS",
          "TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME",
          "TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_STATUS",
          "private-unmount-native-bridge-admission-public-unmount-blocked",
          "private-unmount-native-bridge-cleanup-handoff-public-unmount-blocked",
          "private-serialization-finished-work-identity-validated-public-serialization-blocked"
        ]
      }),
      evidenceData({
        evidenceId: "worker-733-unmount-native-record-validators",
        path: testRendererRustSource,
        sliceStart:
          "fn validate_private_to_json_unmount_native_execution_record_for_canary",
        sliceEnd: "fn private_to_tree_native_execution_record_error<T>",
        tokens: [
          "fn validate_private_to_json_unmount_native_execution_record_for_canary",
          "fn validate_private_to_tree_unmount_native_execution_record_for_canary",
          "execution.route_dependency_id()",
          "execution.deletion_commit_handoff_id()",
          "execution.cleanup_handoff_id()",
          "execution.deletion_commit_handoff_accepted()",
          "execution.cleanup_handoff_accepted()",
          "execution.passive_ref_cleanup_order_accepted()",
          "execution.native_bridge_available()",
          "execution.native_execution()"
        ]
      }),
      evidenceData({
        evidenceId: "worker-733-unmount-handoff-matches-identity",
        path: testRendererRustSource,
        sliceStart:
          "fn validate_private_unmount_native_execution_matches_handoff_for_canary",
        sliceEnd: "fn validate_private_to_json_create_native_execution_record_for_canary",
        tokens: [
          "fn validate_private_unmount_native_execution_matches_handoff_for_canary",
          "execution.scheduled_update_sequence()",
          "identity.root_scheduled_update_sequence()",
          "execution.render_finished_work()",
          "identity.render_finished_work()",
          "execution.commit_finished_lanes_bits()",
          "identity.commit_finished_lanes_bits()",
          "row.host_output_shape() != TestRendererPrivateToJsonHostOutputShape::EmptyRoot",
          "output.deleted_fibers().host_root()",
          "passive_ref_cleanup_order_evidence_for_canary"
        ]
      }),
      evidenceData({
        evidenceId: "worker-733-unmount-finished-work-identity-builder",
        path: testRendererRustSource,
        sliceStart:
          "fn describe_private_unmount_serialization_finished_work_identity_gate_for_canary",
        sliceEnd: "fn private_test_instance_native_query_execution_evidence_from_reports",
        tokens: [
          "fn describe_private_unmount_serialization_finished_work_identity_gate_for_canary",
          "self.validate_private_unmount_native_bridge_handoff_for_canary(scheduled_update, handoff)?;",
          "let row = self.describe_private_to_json_host_output_unmount_row_for_canary(output)?;",
          "handoff.render_finished_work()",
          "handoff.commit_finished_lanes_bits()",
          "report_finished_work: fiber_handle!(commit.current())",
          "report_finished_lanes_bits: commit.finished_lanes().bits()",
          "consumes_committed_host_root_finished_work_identity: true",
          "consumes_committed_host_root_finished_work_lanes: true",
          "public_serialization_available: false",
          "compatibility_claimed: false"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker736,
    bridgeScope: "nested-tojson-source-report-finished-work-identity",
    prerequisiteFor: freezeArray([
      "test-renderer-nested-tojson-public-serialization",
      "test-renderer-nested-tojson-native-bridge-source-report"
    ]),
    binding: PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS[worker736],
    evidenceRows: [
      evidenceData({
        evidenceId: "worker-736-update-route-admission-record",
        path: testRendererRustSource,
        sliceStart: "pub struct TestRendererPrivateUpdateRouteAdmissionRecord",
        sliceEnd: "pub struct TestRendererPrivateUpdateRouteDiagnostics",
        tokens: [
          "pub struct TestRendererPrivateUpdateRouteAdmissionRecord",
          "record_id: &'static str",
          "status: &'static str",
          "source_diagnostic_name: &'static str",
          "source_diagnostic_status: &'static str",
          "host_output_update_kind: TestRendererRootUpdateKind",
          "render_finished_work: TestRendererFiberHandleDiagnostics",
          "commit_finished_lanes_bits: u32",
          "consumes_accepted_host_root_update_queue_metadata: bool",
          "consumes_accepted_root_work_loop_metadata: bool",
          "consumes_accepted_host_output_metadata: bool",
          "public_serialization_available: bool",
          "native_execution_available: bool",
          "compatibility_claimed: bool"
        ]
      }),
      evidenceData({
        evidenceId: "worker-736-nested-report-struct",
        path: testRendererRustSource,
        sliceStart: "pub struct TestRendererPrivateJsonSerializationReport",
        sliceEnd: "pub enum TestRendererPrivateTreeNodeType",
        tokens: [
          "pub struct TestRendererPrivateJsonSerializationReport",
          "gate: TestRendererSerializationGateReport",
          "host_output_shape: TestRendererPrivateToJsonHostOutputShape",
          "host_output_row: Option<TestRendererPrivateToJsonHostOutputRow>",
          "host_output_snapshot_current: bool",
          "nodes: Vec<TestRendererPrivateJsonNodeDiagnostic>",
          "component: TestRendererPrivateJsonHostComponentDiagnostic",
          "public_blockers: TestRendererPrivateJsonPublicSurfaceBlockers",
          "pub const fn gate(&self) -> &TestRendererSerializationGateReport",
          "pub fn nodes(&self) -> &[TestRendererPrivateJsonNodeDiagnostic]",
          "pub fn node_count(&self) -> usize"
        ]
      }),
      evidenceData({
        evidenceId: "worker-736-nested-current-fibers-variant",
        path: testRendererRustSource,
        sliceStart: "enum TestRendererPrivateJsonCurrentFibersForCanary",
        sliceEnd: "pub enum TestRendererHostNodeCleanupTarget",
        tokens: [
          "enum TestRendererPrivateJsonCurrentFibersForCanary",
          "Nested {",
          "outer: TestRendererHostOutputCanaryCurrentFibers",
          "inner: TestRendererHostOutputCanaryCurrentFibers"
        ]
      }),
      evidenceData({
        evidenceId: "worker-736-nested-current-fibers-validator",
        path: testRendererRustSource,
        sliceStart: "fn validate_private_json_nested_canary_current_fibers",
        sliceEnd: "fn validate_private_json_raw_handle",
        tokens: [
          "fn validate_private_json_nested_canary_current_fibers",
          "fiber_inspection.is_nested_host_component_shape()",
          "fiber_inspection.host_components().len() != 2",
          "fiber_inspection.host_texts().len() != 2",
          "let outer_component = fiber_inspection.host_components()[0];",
          "let inner_component = fiber_inspection.host_components()[1];",
          "let stable_text = fiber_inspection.host_texts()[0];",
          "let placed_text = fiber_inspection.host_texts()[1];"
        ]
      }),
      evidenceData({
        evidenceId: "worker-736-nested-json-report-builder",
        path: testRendererRustSource,
        sliceStart:
          "pub fn describe_private_json_serialization_after_nested_update_for_canary",
        sliceEnd:
          "pub fn describe_private_json_serialization_after_sibling_text_update_for_canary",
        tokens: [
          "pub fn describe_private_json_serialization_after_nested_update_for_canary",
          "self.describe_private_to_json_nested_host_output_update_row_for_canary(output)?",
          "Some(output.fiber_inspection())",
          "TestRendererPrivateJsonCurrentFibersForCanary::Nested",
          "outer: output.outer_fibers()",
          "inner: output.inner_fibers()",
          "Some(host_output_row)"
        ]
      }),
      evidenceData({
        evidenceId: "worker-736-nested-json-source-nodes",
        path: testRendererRustSource,
        sliceStart: "fn private_json_nested_nodes_from_component_and_fibers",
        sliceEnd: "fn private_json_rendered_root_from_snapshot_for_shape",
        tokens: [
          "fn private_json_nested_nodes_from_component_and_fibers",
          "let host_components = fiber_inspection.host_components();",
          "let host_texts = fiber_inspection.host_texts();",
          "let child_ordinals: Vec<usize> = (2..2 + host_child.text_children().len()).collect();",
          "child_ordinals: vec![1]",
          "fiber: Self::private_json_fiber_diagnostic(host_components[0])",
          "fiber: Self::private_json_fiber_diagnostic(host_components[1])",
          "fiber: Self::private_json_fiber_diagnostic(host_texts[index])",
          "parent_ordinal: Some(1)"
        ]
      }),
      evidenceData({
        evidenceId: "worker-736-nested-identity-builder",
        path: testRendererRustSource,
        sliceStart:
          "pub fn describe_private_to_json_nested_finished_work_identity_gate_for_canary",
        sliceEnd:
          "pub fn describe_private_to_json_unmount_finished_work_identity_gate_for_canary",
        tokens: [
          "pub fn describe_private_to_json_nested_finished_work_identity_gate_for_canary",
          "output: &TestRendererNestedHostParentPlacedHostOutput",
          "report: Option<&TestRendererPrivateJsonSerializationReport>",
          "self.describe_private_serialization_finished_work_identity_gate_for_canary(",
          "Some(output.render())",
          "Some(output.commit())",
          "report.gate()"
        ],
        forbiddenTokens: [
          "fn accepted_nested_to_json_identity_for_root",
          "accepted_nested_to_json_identity_for_root("
        ]
      }),
      evidenceData({
        evidenceId: "worker-736-generic-finished-work-source-report-identity",
        path: testRendererRustSource,
        sliceStart:
          "fn describe_private_serialization_finished_work_identity_gate_for_canary",
        sliceEnd:
          "fn describe_private_unmount_serialization_finished_work_identity_gate_for_canary",
        tokens: [
          "fn describe_private_serialization_finished_work_identity_gate_for_canary",
          "let Some(fiber_inspection) = report_gate.fiber_inspection() else",
          "if fiber_inspection.current() != commit.current()",
          "report_commit.finished_work()",
          "report_commit.finished_lanes_bits()",
          "committed_fiber_inspection_current_matches_commit: true",
          "consumes_committed_host_root_finished_work_identity: true",
          "consumes_committed_host_root_finished_work_lanes: true",
          "public_serialization_available: false",
          "compatibility_claimed: false"
        ]
      }),
      evidenceData({
        evidenceId: "worker-736-reconciler-nested-inspection-report",
        path: reconcilerInspectionRustSource,
        sliceStart: "pub struct TestRendererCommittedFiberTreeInspection",
        sliceEnd: "struct TestRendererCommittedFiberTreeInspectionBuilder",
        tokens: [
          "pub struct TestRendererCommittedFiberTreeInspection",
          "nodes: Vec<TestRendererCommittedFiberNodeInspection>",
          "host_components: Vec<TestRendererCommittedFiberNodeInspection>",
          "host_texts: Vec<TestRendererCommittedFiberNodeInspection>",
          "pub fn is_nested_host_component_shape(&self) -> bool",
          "pub fn nested_host_component(&self) -> Option<TestRendererCommittedFiberNodeInspection>",
          "self.host_components.get(1).copied()"
        ]
      }),
      evidenceData({
        evidenceId: "worker-736-reconciler-nested-inspection-builder",
        path: reconcilerInspectionRustSource,
        sliceStart: "fn finish_nested_host_component_shape",
        sliceEnd: "fn finish_function_component_shape",
        tokens: [
          "fn finish_nested_host_component_shape",
          "nodes.push(nested.outer);",
          "nodes.push(nested.inner);",
          "nodes.extend(nested.texts.iter().copied());",
          "vec![nested.outer, nested.inner]",
          "nested.texts.clone()"
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_733_736_BRIDGE_ROWS = freezeArray(
  rowData733736.map((sourceRow) =>
    bridgeRow({
      workerId: sourceRow.workerId,
      bridgeScope: sourceRow.bridgeScope,
      prerequisiteFor: sourceRow.prerequisiteFor,
      binding: sourceRow.binding,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: publicCompatibilityClaims(),
      blockedAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export function evaluatePrivateAdmission733736BridgeLedger({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_733_736_BRIDGE_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((row) =>
    evaluateBridgeRow({ fileCache, row, workspaceRoot })
  );

  const manifestWorkerIds = rows.map((row) => row.workerId);
  const manifest = freezeRecord({
    workerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) =>
          !PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    )
  });

  const evidenceTokenMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          evidenceId: evidenceRow.evidenceId,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError,
          sliceError: evidenceRow.sliceError
        })
      )
  );
  const bridgeBindingMismatches = evaluatedRows.flatMap((row) => {
    if (
      !Object.hasOwn(
        PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS,
        row.workerId
      )
    ) {
      return [];
    }
    const expected =
      PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS[row.workerId];
    if (sameBooleanRecord(expected, row.binding)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBinding: expected,
        actualBinding: row.binding
      })
    ];
  });
  const blockedSurfaceMismatches = evaluatedRows.flatMap((row) => {
    const missingRequired = missingValues(
      PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS.surfaces,
      row.blockedPublicCompatibilitySurfaces
    );
    if (
      missingRequired.length === 0 &&
      sameStringSet(
        PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES,
        row.blockedPublicCompatibilitySurfaces
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        missingRequiredBlockedSurfaces: missingRequired,
        expectedBlockedSurfaces: PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES,
        actualBlockedSurfaces: row.blockedPublicCompatibilitySurfaces
      })
    ];
  });
  const publicClaimKeyMismatches = evaluatedRows.flatMap((row) => {
    const actualPublicClaims = Object.keys(row.publicCompatibilityClaims ?? {});
    const missingRequired = missingValues(
      PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS
        .publicCompatibilityClaims,
      actualPublicClaims
    );
    if (
      missingRequired.length === 0 &&
      sameStringSet(
        PRIVATE_ADMISSION_733_736_BRIDGE_PUBLIC_COMPATIBILITY_CLAIMS,
        actualPublicClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        missingRequiredPublicClaims: missingRequired,
        expectedPublicClaims:
          PRIVATE_ADMISSION_733_736_BRIDGE_PUBLIC_COMPATIBILITY_CLAIMS,
        actualPublicClaims: freezeArray(actualPublicClaims)
      })
    ];
  });
  const admissionClaimKeyMismatches = evaluatedRows.flatMap((row) => {
    const actualAdmissionClaims = Object.keys(row.blockedAdmissionClaims ?? {});
    const missingRequired = missingValues(
      PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS
        .blockedAdmissionClaims,
      actualAdmissionClaims
    );
    if (
      missingRequired.length === 0 &&
      sameStringSet(
        PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_ADMISSION_CLAIMS,
        actualAdmissionClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        missingRequiredAdmissionClaims: missingRequired,
        expectedAdmissionClaims:
          PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_ADMISSION_CLAIMS,
        actualAdmissionClaims: freezeArray(actualAdmissionClaims)
      })
    ];
  });
  const publicCompatibilityViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicCompatibilityClaims ?? {})
      .filter(([, claimed]) => claimed !== false)
      .map(([claimId]) => `${row.workerId}.${claimId}`)
  );
  const blockedAdmissionClaimViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.blockedAdmissionClaims ?? {})
      .filter(([, claimed]) => claimed !== false)
      .map(([claimId]) => `${row.workerId}.${claimId}`)
  );
  const compatibilityClaimWorkerIds = evaluatedRows
    .filter((row) => row.compatibilityClaimed !== false)
    .map((row) => row.workerId);
  const nativeJsPackageLeakClaimIds = blockedAdmissionClaimViolations.filter(
    (claimId) =>
      /(?:packageCompatibilityClaimed|rustOnlyDiagnosticPromotedToPackageClaimed|jsFacadeAdmissionClaimed|cjsFacadeAdmissionClaimed|nativeBridgeLoadingClaimed|nativeBridgeExecutionClaimed|nativeExecutionAdmissionClaimed)$/.test(
        claimId
      )
  );

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("bridge-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "bridge-rust-source-identifier-missing",
    evidenceTokenMismatches
  );
  pushRowsViolation(
    violations,
    "bridge-prerequisite-binding-mismatch",
    bridgeBindingMismatches
  );
  pushRowsViolation(
    violations,
    "bridge-blocked-surface-carry-forward-mismatch",
    blockedSurfaceMismatches
  );
  pushRowsViolation(
    violations,
    "bridge-public-claim-carry-forward-mismatch",
    publicClaimKeyMismatches
  );
  pushRowsViolation(
    violations,
    "bridge-admission-claim-carry-forward-mismatch",
    admissionClaimKeyMismatches
  );
  pushClaimIdsViolation(
    violations,
    "bridge-public-compatibility-claim-detected",
    publicCompatibilityViolations
  );
  pushClaimIdsViolation(
    violations,
    "bridge-blocked-admission-claim-detected",
    blockedAdmissionClaimViolations
  );
  pushClaimIdsViolation(
    violations,
    "bridge-native-js-package-compatibility-leak-detected",
    nativeJsPackageLeakClaimIds
  );
  pushIdsViolation(
    violations,
    "bridge-claimed-public-compatibility",
    compatibilityClaimWorkerIds
  );

  const rustEvidenceRecognized = evidenceTokenMismatches.length === 0;
  const bridgeBindingsRecognized = bridgeBindingMismatches.length === 0;
  const blockerCarryForwardRecognized =
    blockedSurfaceMismatches.length === 0 &&
    publicClaimKeyMismatches.length === 0 &&
    admissionClaimKeyMismatches.length === 0;
  const publicCompatibilityClaimed =
    publicCompatibilityViolations.length > 0 ||
    compatibilityClaimWorkerIds.length > 0;
  const privateBridgePrerequisitesRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    rustEvidenceRecognized &&
    bridgeBindingsRecognized &&
    blockerCarryForwardRecognized &&
    publicCompatibilityViolations.length === 0 &&
    blockedAdmissionClaimViolations.length === 0 &&
    compatibilityClaimWorkerIds.length === 0;

  return freezeRecord({
    ledgerId: PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID,
    status: privateBridgePrerequisitesRecognized
      ? PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS
      : PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_VIOLATION_STATUS,
    privateBridgePrerequisitesRecognized,
    rustEvidenceRecognized,
    bridgeBindingsRecognized,
    blockerCarryForwardRecognized,
    publicCompatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => row.evidenceRecognized === true)
        .map((row) => row.workerId)
    ),
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolationIds: freezeArray(
      blockedAdmissionClaimViolations
    ),
    nativeJsPackageLeakClaimIds: freezeArray(nativeJsPackageLeakClaimIds),
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    prerequisiteFor: freezeArray(data.prerequisiteFor),
    binding: freezeRecord(data.binding),
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function evidenceData({
  evidenceId,
  path,
  tokens,
  forbiddenTokens = [],
  sliceStart = null,
  sliceEnd = null
}) {
  return freezeRecord({
    evidenceId,
    path,
    tokenPolicy: rustIdentifierTokenPolicy,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens),
    sliceStart,
    sliceEnd
  });
}

function bridgeRow({
  workerId,
  bridgeScope,
  prerequisiteFor,
  binding,
  evidence,
  publicCompatibilityClaims,
  blockedAdmissionClaims
}) {
  return freezeRecord({
    workerId,
    bridgeScope,
    sourceQueue: "733-736-bridge",
    privateAdmission: "accepted-private-diagnostic-bridge-prerequisite",
    localGateCoverage: PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID,
    prerequisiteFor: freezeArray(prerequisiteFor),
    binding: freezeRecord(binding),
    evidence: freezeArray(evidence),
    runtimeCapabilityAdded: false,
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims)),
    blockedAdmissionClaims: freezeRecord(blockedAdmissionClaims),
    blockedAdmissionClaimIds: freezeArray(Object.keys(blockedAdmissionClaims))
  });
}

function publicCompatibilityClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_733_736_BRIDGE_PUBLIC_COMPATIBILITY_CLAIMS.map(
        (claimId) => [claimId, false]
      )
    ),
    ...extraClaims
  });
}

function blockedAdmissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_ADMISSION_CLAIMS.map(
        (claimId) => [claimId, false]
      )
    ),
    ...extraClaims
  });
}

function mergeRowOverride(row, override) {
  if (override == null || Object.keys(override).length === 0) {
    return row;
  }

  const merged = { ...row, ...override };
  for (const key of [
    "blockedPublicCompatibilitySurfaces",
    "blockedPublicClaims",
    "blockedAdmissionClaimIds",
    "evidence",
    "prerequisiteFor"
  ]) {
    if (Object.hasOwn(override, key)) {
      merged[key] = freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "binding")) {
    merged.binding = freezeRecord({
      ...row.binding,
      ...override.binding
    });
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

  return freezeRecord(merged);
}

function evaluateBridgeRow({ fileCache, row, workspaceRoot }) {
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

  return freezeRecord({ ok: true, value: text.slice(startIndex, endIndex) });
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

function missingValues(expectedSubset, actualSuperset) {
  return freezeArray(
    expectedSubset.filter((value) => !actualSuperset.includes(value))
  );
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

function freezeRecord(record) {
  return Object.freeze(record);
}
