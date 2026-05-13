import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID,
  PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS,
  PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS,
  PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS,
  PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_EVIDENCE,
  PRIVATE_ADMISSION_733_736_BRIDGE_ROWS,
  PRIVATE_ADMISSION_733_736_BRIDGE_ROW_CONTRACT,
  PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS,
  evaluatePrivateAdmission733736BridgeLedger
} from "./private-admission-733-736-bridge-ledger.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

const testRendererRustSource = "crates/fast-react-test-renderer/src/lib.rs";
const testRendererConstantsRustSource =
  "crates/fast-react-test-renderer/src/diagnostics/constants.rs";
const testRendererFixturesRustSource =
  "crates/fast-react-test-renderer/src/diagnostics/fixtures.rs";
const testRendererHostNodeCleanupRustSource =
  "crates/fast-react-test-renderer/src/diagnostics/host_node_cleanup.rs";
const testRendererJsonDiagnosticsRustSource =
  "crates/fast-react-test-renderer/src/diagnostics/json.rs";
const testRendererSerializationExecutionRustSource =
  "crates/fast-react-test-renderer/src/root_impl/serialization_execution.rs";
const testRendererUpdateRouteRustSource =
  "crates/fast-react-test-renderer/src/diagnostics/update_route.rs";
const bridgeLedgerSource =
  "tests/conformance/src/private-admission-733-736-bridge-ledger.mjs";
const sourceTokenPolicy =
  "source-owned-identifiers-statuses-functions-fields-and-constants";

const worker816 =
  "worker-816-test-renderer-unmount-nested-source-report-gate";
const worker818 = "worker-818-private-admission-733-736-bridge-ledger";

export const PRIVATE_ADMISSION_825_LEDGER_ID =
  "private-admission-825-test-renderer-816-818-ledger-1";
export const PRIVATE_ADMISSION_825_LEDGER_STATUS =
  "recognized-worker-816-unmount-nested-source-report-and-worker-818-bridge-ledger-public-blocked";
export const PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS =
  "blocked-worker-816-unmount-nested-source-report-and-worker-818-bridge-ledger-with-violations";

export const PRIVATE_ADMISSION_825_WORKERS = freezeArray([
  worker816,
  worker818
]);

export const PRIVATE_ADMISSION_825_REQUIRED_STATUS_IDS = freezeRecord({
  [worker816]: freezeArray([
    "TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME",
    "fast-react-test-renderer.serialization.private-unmount-nested-source-report-gate",
    "TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS",
    "private-unmount-nested-source-report-admission-validated-public-native-package-blocked",
    "TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID",
    "TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS",
    "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID",
    "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS",
    "TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME",
    "TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME"
  ]),
  [worker818]: freezeArray([
    PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID,
    PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS,
    "PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_EVIDENCE",
    "PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS",
    "PRIVATE_ADMISSION_733_736_BRIDGE_ROW_CONTRACT"
  ])
});

export const PRIVATE_ADMISSION_825_REQUIRED_BRIDGE_LEDGER_CONTEXT =
  freezeRecord({
    [worker816]: freezeArray([
      PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID,
      PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS,
      ...PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS
    ]),
    [worker818]: freezeArray([
      PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID,
      PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS,
      "evaluatePrivateAdmission733736BridgeLedger",
      "PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_EVIDENCE",
      "PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS",
      "PRIVATE_ADMISSION_733_736_BRIDGE_ROW_CONTRACT",
      ...PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS
    ])
  });

export const PRIVATE_ADMISSION_825_REQUIRED_REQUIREMENTS = freezeRecord({
  [worker816]: freezeRecord({
    worker816UnmountNestedSourceReportGateAccepted: true,
    consumesWorker733UnmountIdentity: true,
    consumesWorker736NestedSourceReportIdentity: true,
    consumesWorker818BridgeLedger: true,
    nestedRouteAdmissionAccepted: true,
    unmountRouteAdmissionAccepted: true,
    nestedCommittedSourceReportOwnershipAccepted: true,
    unmountDeletionCleanupMetadataAccepted: true,
    nestedHostOutputShape: "NestedHostText",
    unmountHostOutputShape: "EmptyRoot",
    nestedSourceNodeCount: 4,
    nestedHostComponentCount: 2,
    nestedHostTextCount: 2,
    broadMultichildIdentityAvailable: false,
    publicCompatibilityClaimed: false,
    staticReadOnlyLedger: true
  }),
  [worker818]: freezeRecord({
    worker818BridgeLedgerAccepted: true,
    bridgeLedgerStatusAccepted: true,
    bridgeWorkerManifestPinned: true,
    bridgeRequiredEvidencePinned: true,
    bridgeRequiredBindingsPinned: true,
    bridgeRowContractPinned: true,
    bridgeCarryForwardBlockersPinned: true,
    bridgePublicCompatibilityBlocked: true,
    publicCompatibilityClaimed: false,
    staticReadOnlyLedger: true
  })
});

export const PRIVATE_ADMISSION_825_BLOCKED_PUBLIC_CLAIMS = freezeArray(
  uniqueStrings([
    "publicToJSONAvailable",
    "publicToTreeAvailable",
    "publicTestInstanceAvailable",
    "publicSerializationAvailable",
    "publicRouteAvailable",
    "publicRootAvailable",
    "jsFacadeAvailable",
    "cjsFacadeAvailable",
    "packageCompatibilityClaimed",
    "packageExportCompatibilityClaimed",
    "nativeBridgeLoadingAvailable",
    "nativeBridgeAvailable",
    "nativeBridgeExecutionAvailable",
    "nativeExecutionAvailable",
    "rootActSchedulerAdmissionClaimed",
    "publicRootCompatibilityClaimed",
    "publicActCompatibilityClaimed",
    "publicSchedulerCompatibilityClaimed",
    "broadMultichildIdentityAvailable",
    "broadMultichildIdentityAccepted",
    "publicCompatibilityClaimed",
    ...PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS
      .publicCompatibilityClaims,
    ...PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS
      .blockedAdmissionClaims
  ])
);

const privateAdmission825Rows = freezeArray([
  rowData({
    workerId: worker816,
    ledgerRole: "accepted-unmount-nested-source-report-gate",
    privateAdmission:
      "accepted-private-test-renderer-unmount-nested-source-report-gate",
    sourceEvidenceArea:
      "test-renderer-unmount-nested-source-report-private-admission",
    implementationPaths: freezeArray([
      testRendererConstantsRustSource,
      testRendererJsonDiagnosticsRustSource,
      testRendererSerializationExecutionRustSource
    ]),
    statusIds: PRIVATE_ADMISSION_825_REQUIRED_STATUS_IDS[worker816],
    bridgeLedgerContext:
      PRIVATE_ADMISSION_825_REQUIRED_BRIDGE_LEDGER_CONTEXT[worker816],
    requirements: PRIVATE_ADMISSION_825_REQUIRED_REQUIREMENTS[worker816],
    evidenceRows: [
      evidenceData({
        evidenceId: "worker-816-unmount-nested-status-constants",
        path: testRendererConstantsRustSource,
        sliceStart: "TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME",
        sliceEnd: "TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_HOST_OUTPUT_ROW_ID",
        tokens: [
          "TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME",
          "fast-react-test-renderer.serialization.private-unmount-nested-source-report-gate",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS",
          "private-unmount-nested-source-report-admission-validated-public-native-package-blocked",
          "TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME",
          "TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME"
        ]
      }),
      evidenceData({
        evidenceId: "worker-816-unmount-nested-gate-record-fields",
        path: testRendererJsonDiagnosticsRustSource,
        sliceStart: "TestRendererPrivateUnmountNestedSourceReportAdmissionGate",
        sliceEnd: "public_native_package_js_surfaces_blocked",
        tokens: [
          "TestRendererPrivateUnmountNestedSourceReportAdmissionGate",
          "diagnostic_name",
          "status",
          "nested_root",
          "unmount_root",
          "nested_route_record_id",
          "nested_route_status",
          "unmount_admission_record_id",
          "unmount_admission_status",
          "nested_identity_diagnostic_name",
          "unmount_identity_diagnostic_name",
          "nested_source_report_diagnostic_name",
          "nested_host_output_shape",
          "unmount_host_output_shape",
          "nested_source_node_count",
          "nested_host_component_count",
          "nested_host_text_count",
          "unmount_host_node_cleanup_count",
          "unmount_cleanup_order_record_count",
          "nested_identity_accepted",
          "unmount_identity_accepted",
          "nested_route_admission_accepted",
          "unmount_route_admission_accepted",
          "nested_committed_source_report_ownership_accepted",
          "unmount_deletion_cleanup_metadata_accepted",
          "consumes_worker_736_nested_source_report_identity",
          "consumes_worker_733_unmount_identity",
          "broad_multichild_identity_available",
          "public_to_json_available",
          "public_to_tree_available",
          "public_test_instance_available",
          "public_serialization_available",
          "public_route_available",
          "native_bridge_loading_available",
          "native_bridge_available",
          "native_execution_available",
          "js_facade_available",
          "cjs_facade_available",
          "package_compatibility_claimed",
          "compatibility_claimed"
        ]
      }),
      evidenceData({
        evidenceId: "worker-816-unmount-nested-gate-methods",
        path: testRendererJsonDiagnosticsRustSource,
        sliceStart: "public_native_package_js_surfaces_blocked",
        sliceEnd: "TestRendererPrivateToJsonSiblingSnapshotFinishedWorkIdentityBlocker",
        tokens: [
          "public_native_package_js_surfaces_blocked",
          "private_admission_ready",
          "nested_identity_accepted",
          "unmount_identity_accepted",
          "nested_route_admission_accepted",
          "unmount_route_admission_accepted",
          "nested_committed_source_report_ownership_accepted",
          "unmount_deletion_cleanup_metadata_accepted",
          "consumes_worker_736_nested_source_report_identity",
          "consumes_worker_733_unmount_identity",
          "broad_multichild_identity_available",
          "public_to_json_available",
          "public_to_tree_available",
          "public_test_instance_available",
          "public_serialization_available",
          "public_route_available",
          "native_bridge_loading_available",
          "native_bridge_available",
          "native_execution_available",
          "js_facade_available",
          "cjs_facade_available",
          "package_compatibility_claimed",
          "compatibility_claimed"
        ]
      }),
      evidenceData({
        evidenceId: "worker-816-unmount-nested-admission-builder",
        path: testRendererSerializationExecutionRustSource,
        sliceStart:
          "describe_private_unmount_nested_source_report_admission_gate_for_canary",
        sliceEnd: "private_to_json_facade_result_from_report",
        tokens: [
          "describe_private_unmount_nested_source_report_admission_gate_for_canary",
          "validate_private_unmount_nested_source_report_nested_route_for_canary",
          "validate_private_serialization_finished_work_identity_for_native_execution",
          "validate_private_nested_update_native_execution_matches_handoff_for_canary",
          "validate_private_unmount_nested_source_report_ownership_for_canary",
          "validate_private_unmount_nested_source_report_unmount_admission_for_canary",
          "validate_private_unmount_native_bridge_handoff_for_canary",
          "validate_private_unmount_native_execution_matches_handoff_for_canary",
          "TestRendererPrivateUnmountNestedSourceReportAdmissionGate",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS",
          "TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME",
          "consumes_worker_736_nested_source_report_identity",
          "consumes_worker_733_unmount_identity",
          "broad_multichild_identity_available",
          "public_to_json_available",
          "public_to_tree_available",
          "public_test_instance_available",
          "native_bridge_loading_available",
          "js_facade_available",
          "cjs_facade_available",
          "package_compatibility_claimed"
        ]
      }),
      evidenceData({
        evidenceId: "worker-816-route-admission-validators",
        path: testRendererSerializationExecutionRustSource,
        tokens: [
          "validate_private_unmount_nested_source_report_nested_route_for_canary",
          "validate_private_unmount_nested_source_report_unmount_admission_for_canary",
          "TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID",
          "TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS",
          "TEST_RENDERER_PRIVATE_UPDATE_ROUTE_DIAGNOSTIC_NAME",
          "TEST_RENDERER_PRIVATE_UPDATE_ROUTE_STATUS",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS",
          "TEST_RENDERER_PRIVATE_TO_JSON_UNMOUNT_ROUTE_DEPENDENCY_ID",
          "TEST_RENDERER_PRIVATE_UNMOUNT_DELETION_COMMIT_HANDOFF_DIAGNOSTIC_ID",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_CLEANUP_HANDOFF_DIAGNOSTIC_ID",
          "consumes_accepted_host_root_update_queue_metadata",
          "consumes_accepted_root_work_loop_metadata",
          "consumes_accepted_host_output_metadata",
          "rejects_stale_root_lifecycle",
          "rejects_stale_host_output",
          "rejects_missing_update_queue_evidence",
          "deletion_commit_handoff_accepted",
          "cleanup_handoff_accepted",
          "lifecycle_evidence_accepted",
          "cleanup_blockers_accepted",
          "passive_ref_cleanup_order_accepted",
          "native_cleanup_after_ref_and_passive_ordering",
          "rust_unmount_cleanup_handoff_executed",
          "host_output_produced",
          "public_root_update_available",
          "public_serialization_available",
          "native_bridge_available",
          "native_execution"
        ]
      }),
      evidenceData({
        evidenceId: "worker-816-nested-source-report-ownership-validator",
        path: testRendererSerializationExecutionRustSource,
        tokens: [
          "validate_private_unmount_nested_source_report_ownership_for_canary",
          "TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME",
          "TestRendererPrivateToJsonHostOutputShape::NestedHostText",
          "TestRendererPrivateJsonNodeKind::HostComponent",
          "TestRendererPrivateJsonNodeKind::Text",
          "TEST_RENDERER_PRIVATE_TO_JSON_NESTED_UPDATE_HOST_OUTPUT_ROW_ID",
          "host_output_snapshot_current",
          "public_blockers",
          "dependency_diagnostics",
          "public_surfaces_blocked",
          "fiber_inspection",
          "root_children",
          "host_components",
          "host_texts",
          "nodes",
          "parent_ordinal",
          "child_ordinals",
          "stable_text",
          "placed_text",
          "report_finished_work",
          "report_finished_lanes_bits",
          "commit_finished_lanes_bits",
          "render_finished_work"
        ]
      }),
      evidenceData({
        evidenceId: "worker-816-unmount-nested-gate-validator",
        path: testRendererSerializationExecutionRustSource,
        sliceStart:
          "validate_private_unmount_nested_source_report_admission_gate_for_canary",
        sliceEnd: "validate_private_update_native_execution_matches_handoff_for_canary",
        tokens: [
          "validate_private_unmount_nested_source_report_admission_gate_for_canary",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_DIAGNOSTIC_NAME",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS",
          "TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID",
          "TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_STATUS",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID",
          "TEST_RENDERER_PRIVATE_UNMOUNT_NATIVE_BRIDGE_ADMISSION_STATUS",
          "TEST_RENDERER_PRIVATE_SERIALIZATION_FINISHED_WORK_IDENTITY_DIAGNOSTIC_NAME",
          "TEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME",
          "TestRendererPrivateToJsonHostOutputShape::NestedHostText",
          "TestRendererPrivateToJsonHostOutputShape::EmptyRoot",
          "nested_source_node_count",
          "nested_host_component_count",
          "nested_host_text_count",
          "unmount_host_node_cleanup_count",
          "unmount_cleanup_order_record_count",
          "consumes_worker_736_nested_source_report_identity",
          "consumes_worker_733_unmount_identity",
          "broad_multichild_identity_available",
          "public_native_package_js_surfaces_blocked"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker818,
    ledgerRole: "accepted-733-736-bridge-ledger-context",
    privateAdmission: "accepted-private-733-736-bridge-ledger-context",
    sourceEvidenceArea:
      "test-renderer-733-736-bridge-ledger-private-admission",
    implementationPaths: freezeArray([bridgeLedgerSource]),
    statusIds: PRIVATE_ADMISSION_825_REQUIRED_STATUS_IDS[worker818],
    bridgeLedgerContext:
      PRIVATE_ADMISSION_825_REQUIRED_BRIDGE_LEDGER_CONTEXT[worker818],
    requirements: PRIVATE_ADMISSION_825_REQUIRED_REQUIREMENTS[worker818],
    evidenceRows: [
      evidenceData({
        evidenceId: "worker-818-bridge-ledger-status-exports",
        path: bridgeLedgerSource,
        sliceStart: "PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID",
        sliceEnd: "PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS",
        tokens: [
          "PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID",
          "private-admission-733-736-bridge-ledger-1",
          "PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS",
          "recognized-private-admission-733-736-bridge-prerequisites-public-compatibility-blocked",
          "PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_VIOLATION_STATUS",
          "blocked-private-admission-733-736-bridge-prerequisites-with-violations",
          "PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS",
          "PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES",
          "PRIVATE_ADMISSION_733_736_BRIDGE_PUBLIC_COMPATIBILITY_CLAIMS",
          "PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_ADMISSION_CLAIMS"
        ]
      }),
      evidenceData({
        evidenceId: "worker-818-bridge-required-bindings-and-evidence",
        path: bridgeLedgerSource,
        sliceStart: "PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS",
        sliceEnd: "PRIVATE_ADMISSION_733_736_BRIDGE_ROW_CONTRACT",
        tokens: [
          "PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS",
          "PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_EVIDENCE",
          "routeAdmissionPinned",
          "finishedWorkIdentityPinned",
          "finishedWorkLanesPinned",
          "deletionCommitMetadataPinned",
          "cleanupHandoffMetadataPinned",
          "sourceReportOwnershipPinned",
          "publicCompatibilityBlocked",
          "worker-733-unmount-native-admission-struct",
          "worker-733-unmount-finished-work-identity-builder",
          "worker-736-nested-current-fibers-validator",
          "worker-736-nested-json-source-nodes",
          "worker-736-generic-finished-work-source-report-identity",
          "worker-736-reconciler-nested-inspection-report"
        ]
      }),
      evidenceData({
        evidenceId: "worker-818-bridge-row-contract-and-evaluator",
        path: bridgeLedgerSource,
        sliceStart: "PRIVATE_ADMISSION_733_736_BRIDGE_ROW_CONTRACT",
        sliceEnd: "rowData",
        tokens: [
          "PRIVATE_ADMISSION_733_736_BRIDGE_ROW_CONTRACT",
          "evaluatePrivateAdmission733736BridgeLedger",
          "privateBridgePrerequisitesRecognized",
          "rustEvidenceRecognized",
          "evidenceContractRecognized",
          "bridgeBindingsRecognized",
          "rowContractRecognized",
          "blockerCarryForwardRecognized",
          "publicCompatibilityClaimed",
          "bridge-worker-manifest-mismatch",
          "bridge-rust-source-identifier-missing",
          "bridge-required-evidence-mismatch",
          "bridge-prerequisite-binding-mismatch",
          "bridge-row-contract-mismatch",
          "bridge-public-compatibility-claim-detected",
          "bridge-blocked-admission-claim-detected",
          "bridge-native-js-package-compatibility-leak-detected"
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_825_ROWS = freezeArray(
  privateAdmission825Rows.map((sourceRow) =>
    ledgerRow({
      ...sourceRow,
      publicBlockerClaims: falseRecord(
        PRIVATE_ADMISSION_825_BLOCKED_PUBLIC_CLAIMS
      )
    })
  )
);

const bridgeLedgerSplitSourcePathByEvidenceId = freezeRecord({
  "worker-733-unmount-native-admission-struct":
    testRendererHostNodeCleanupRustSource,
  "worker-733-unmount-native-status-constants":
    testRendererConstantsRustSource,
  "worker-733-unmount-native-record-validators":
    testRendererSerializationExecutionRustSource,
  "worker-733-unmount-handoff-matches-identity":
    testRendererSerializationExecutionRustSource,
  "worker-736-update-route-admission-record":
    testRendererUpdateRouteRustSource,
  "worker-736-nested-report-struct": testRendererJsonDiagnosticsRustSource,
  "worker-736-nested-current-fibers-variant":
    testRendererFixturesRustSource
});

const bridgeLedgerSplitSourceSliceEndByEvidenceId = freezeRecord({
  "worker-733-unmount-finished-work-identity-builder":
    "const fn instance_state_node_raw",
  "worker-736-nested-report-struct": null,
  "worker-736-nested-current-fibers-variant": null
});

const bridgeLedgerSplitSourceRowOverrides = freezeRecord(
  Object.fromEntries(
    PRIVATE_ADMISSION_733_736_BRIDGE_ROWS.map((row) => [
      row.workerId,
      freezeRecord({
        evidence: freezeArray(
          row.evidence.map((evidenceRow) =>
            freezeRecord({
              ...evidenceRow,
              path:
                bridgeLedgerSplitSourcePathByEvidenceId[
                  evidenceRow.evidenceId
                ] ?? evidenceRow.path,
              sliceEnd: Object.hasOwn(
                bridgeLedgerSplitSourceSliceEndByEvidenceId,
                evidenceRow.evidenceId
              )
                ? bridgeLedgerSplitSourceSliceEndByEvidenceId[
                    evidenceRow.evidenceId
                  ]
                : evidenceRow.sliceEnd
            })
          )
        )
      })
    ])
  )
);

export const PRIVATE_ADMISSION_825_REQUIRED_EVIDENCE = freezeRecord(
  Object.fromEntries(
    PRIVATE_ADMISSION_825_ROWS.map((row) => [
      row.workerId,
      freezeArray(row.evidence.map((evidenceRow) => evidenceRow.evidenceId))
    ])
  )
);

export const PRIVATE_ADMISSION_825_ROW_CONTRACT = freezeRecord({
  sourceQueue: "825",
  localGateCoverage: PRIVATE_ADMISSION_825_LEDGER_ID,
  runtimeCapabilityAdded: false,
  compatibilityClaimed: false,
  promotion: "rejected",
  privateEvidenceOnly: true,
  sourceTokenChecksOnly: true,
  manifestEvaluationOnly: true,
  runtimeExecutionClaimed: false,
  rustExecutionClaimed: false,
  nativeBridgeExecuted: false,
  nativeBridgeLoadAttempted: false,
  packageImportAttempted: false,
  ledgerEvaluationMode: "source-token-checks-and-bridge-ledger-status-only",
  blockedPublicClaims: PRIVATE_ADMISSION_825_BLOCKED_PUBLIC_CLAIMS
});

export const PRIVATE_ADMISSION_825_ROW_CONTRACTS = freezeRecord(
  Object.fromEntries(
    PRIVATE_ADMISSION_825_ROWS.map((row) => [
      row.workerId,
      freezeRecord({
        ...PRIVATE_ADMISSION_825_ROW_CONTRACT,
        privateAdmission: row.privateAdmission
      })
    ])
  )
);

export function evaluatePrivateAdmission825TestRenderer816818Ledger({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  bridgeRowOverrides = {},
  compatibilityClaimed: topLevelCompatibilityClaimed = false
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_825_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((row) =>
    evaluateLedgerRow({ fileCache, row, workspaceRoot })
  );
  const bridgeLedger = evaluatePrivateAdmission733736BridgeLedger({
    workspaceRoot,
    rowOverrides: mergeBridgeRowOverrides(
      bridgeLedgerSplitSourceRowOverrides,
      bridgeRowOverrides
    )
  });

  const actualWorkerIds = rows.map((row) => row.workerId);
  const missingWorkerIds = PRIVATE_ADMISSION_825_WORKERS.filter(
    (workerId) => !actualWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = actualWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_825_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = actualWorkerIds.filter(
    (workerId, index) => actualWorkerIds.indexOf(workerId) !== index
  );

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
  const evidenceContractMismatches = createRequiredSetMismatches({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_825_REQUIRED_EVIDENCE,
    actualKey: "evidence",
    valueSelector: (evidenceRows) =>
      evidenceRows.map((evidenceRow) => evidenceRow.evidenceId),
    expectedKey: "expectedEvidenceIds",
    actualKeyForViolation: "actualEvidenceIds"
  });
  const statusIdMismatches = createRequiredSetMismatches({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_825_REQUIRED_STATUS_IDS,
    actualKey: "statusIds",
    valueSelector: identity,
    expectedKey: "expectedStatusIds",
    actualKeyForViolation: "actualStatusIds"
  });
  const bridgeLedgerContextMismatches = createRequiredSetMismatches({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_825_REQUIRED_BRIDGE_LEDGER_CONTEXT,
    actualKey: "bridgeLedgerContext",
    valueSelector: identity,
    expectedKey: "expectedBridgeLedgerContext",
    actualKeyForViolation: "actualBridgeLedgerContext"
  });
  const requirementMismatches = evaluatedRows.flatMap((row) =>
    createRecordMismatches({
      workerId: row.workerId,
      expected: PRIVATE_ADMISSION_825_REQUIRED_REQUIREMENTS[row.workerId],
      actual: row.requirements,
      fieldKey: "requirement",
      expectedKey: "expected",
      actualKey: "actual"
    })
  );
  const rowContractMismatches = evaluatedRows.flatMap((row) => {
    if (!PRIVATE_ADMISSION_825_WORKERS.includes(row.workerId)) {
      return [];
    }
    const expected = PRIVATE_ADMISSION_825_ROW_CONTRACTS[row.workerId];
    const actual = rowContract(row);
    if (sameRowContract(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedContract: expected,
        actualContract: actual
      })
    ];
  });
  const publicBlockerKeyMismatches = evaluatedRows.flatMap((row) =>
    createExpectedSetMismatch({
      workerId: row.workerId,
      expected: PRIVATE_ADMISSION_825_BLOCKED_PUBLIC_CLAIMS,
      actual: Object.keys(row.publicBlockerClaims ?? {}),
      expectedKey: "expectedPublicBlockerClaims",
      actualKey: "actualPublicBlockerClaims"
    })
  );
  const publicBlockerClaimViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockerClaims ?? {})
      .filter(([, value]) => value !== false)
      .map(([claimId]) => `${row.workerId}.${claimId}`)
  );
  const staticReadOnlyViolations = evaluatedRows
    .filter(
      (row) =>
        row.sourceTokenChecksOnly !== true ||
        row.manifestEvaluationOnly !== true ||
        row.runtimeExecutionClaimed !== false ||
        row.rustExecutionClaimed !== false ||
        row.nativeBridgeExecuted !== false ||
        row.nativeBridgeLoadAttempted !== false ||
        row.packageImportAttempted !== false ||
        row.ledgerEvaluationMode !==
          "source-token-checks-and-bridge-ledger-status-only"
    )
    .map((row) => row.workerId);
  const topLevelCompatibilityViolations =
    topLevelCompatibilityClaimed === false ? [] : ["ledger.compatibilityClaimed"];

  const bridgeLedgerStatusMismatches =
    bridgeLedger.status === PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS &&
    bridgeLedger.privateBridgePrerequisitesRecognized === true &&
    bridgeLedger.evidenceContractRecognized === true &&
    bridgeLedger.bridgeBindingsRecognized === true &&
    bridgeLedger.rowContractRecognized === true &&
    bridgeLedger.blockerCarryForwardRecognized === true &&
    bridgeLedger.publicCompatibilityClaimed === false &&
    bridgeLedger.violations.length === 0 &&
    sameStringSet(bridgeLedger.queueWorkers, PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS)
      ? []
      : [
          freezeRecord({
            ledgerId: PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_ID,
            expectedStatus: PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS,
            actualStatus: bridgeLedger.status,
            bridgeViolationIds: freezeArray(
              bridgeLedger.violations.map((violation) => violation.id)
            )
          })
        ];

  const publicSerializationLeakClaimIds =
    publicBlockerClaimViolations.filter((claimId) =>
      /\.(?:publicToJSONAvailable|publicToTreeAvailable|publicTestInstanceAvailable|publicSerializationAvailable|publicRouteAvailable|publicTestRendererSerializationCompatibilityClaimed|publicTestRendererToJSONCompatibilityClaimed|publicTestRendererToTreeCompatibilityClaimed)$/.test(
        claimId
      )
    );
  const jsCjsPackageLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /\.(?:jsFacadeAvailable|cjsFacadeAvailable|packageCompatibilityClaimed|packageExportCompatibilityClaimed|jsFacadeAdmissionClaimed|cjsFacadeAdmissionClaimed|publicPackageCompatibilityClaimed|publicPackageSurfaceCompatibilityClaimed|publicTestRendererJSFacadeAdmissionClaimed|publicTestRendererCJSFacadeAdmissionClaimed|publicPackageCompatibilityPromotionClaimed|rustOnlyDiagnosticPromotedToPackageClaimed)$/.test(
        claimId
      )
  );
  const nativeBridgeLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /\.(?:nativeBridgeLoadingAvailable|nativeBridgeAvailable|nativeBridgeExecutionAvailable|nativeExecutionAvailable|nativeExecutionAdmissionClaimed|nativeBridgeLoadingClaimed|nativeBridgeExecutionClaimed|publicTestRendererNativeAddonLoadingCompatibilityClaimed|publicTestRendererNativeAddonExecutionCompatibilityClaimed|publicTestRendererNativeBridgeCompatibilityClaimed|publicTestRendererNativeBridgeExecutionClaimed|publicTestRendererNativeBridgeLoadingCompatibilityClaimed)$/.test(
        claimId
      )
  );
  const rootActSchedulerLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /\.(?:publicRootAvailable|rootActSchedulerAdmissionClaimed|publicRootCompatibilityClaimed|publicActCompatibilityClaimed|publicSchedulerCompatibilityClaimed|publicTestRendererRootCompatibilityClaimed|publicReactDomRootCompatibilityClaimed)$/.test(
        claimId
      )
  );
  const broadMultichildLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /\.(?:broadMultichildIdentityAvailable|broadMultichildIdentityAccepted|publicTestRendererMultichildSerializationCompatibilityClaimed|publicTestRendererMultichildSiblingSerializationCompatibilityClaimed|publicTestRendererMultichildIdentityAdmissionClaimed|publicTestRendererMultichildSiblingIdentityAdmissionClaimed)$/.test(
        claimId
      )
  );
  const publicCompatibilityLeakClaimIds =
    publicBlockerClaimViolations.filter((claimId) =>
      /\.(?:publicCompatibilityClaimed|compatibilityClaimed|publicCompatibilityPromotionClaimed|publicTestRendererCompatibilityClaimed|publicTestRendererRootCompatibilityClaimed|publicActCompatibilityClaimed|publicReactDomRootCompatibilityClaimed|publicSchedulerCompatibilityClaimed)$/.test(
        claimId
      )
    );

  const violations = [];
  if (
    missingWorkerIds.length > 0 ||
    unexpectedWorkerIds.length > 0 ||
    duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("private-admission-825-worker-manifest-mismatch", {
        missingWorkerIds: freezeArray(missingWorkerIds),
        unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
        duplicateWorkerIds: freezeArray(duplicateWorkerIds)
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-825-source-evidence-token-missing",
    evidenceTokenMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-825-required-evidence-mismatch",
    evidenceContractMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-825-status-id-mismatch",
    statusIdMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-825-bridge-ledger-context-mismatch",
    bridgeLedgerContextMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-825-requirement-mismatch",
    requirementMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-825-row-contract-mismatch",
    rowContractMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-825-public-blocker-key-mismatch",
    publicBlockerKeyMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-825-static-read-only-mismatch",
    staticReadOnlyViolations
  );
  pushRowsViolation(
    violations,
    "private-admission-825-bridge-ledger-not-recognized",
    bridgeLedgerStatusMismatches
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-825-public-serialization-claim-detected",
    publicSerializationLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-825-js-cjs-package-claim-detected",
    jsCjsPackageLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-825-native-bridge-execution-claim-detected",
    nativeBridgeLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-825-root-act-scheduler-claim-detected",
    rootActSchedulerLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-825-broad-multichild-claim-detected",
    broadMultichildLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-825-public-compatibility-claim-detected",
    publicCompatibilityLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-825-top-level-compatibility-claim-detected",
    topLevelCompatibilityViolations
  );

  const manifestRecognized =
    missingWorkerIds.length === 0 &&
    unexpectedWorkerIds.length === 0 &&
    duplicateWorkerIds.length === 0;
  const evidenceRecognized =
    evidenceTokenMismatches.length === 0 &&
    evidenceContractMismatches.length === 0;
  const statusIdsRecognized = statusIdMismatches.length === 0;
  const bridgeLedgerContextRecognized =
    bridgeLedgerContextMismatches.length === 0 &&
    bridgeLedgerStatusMismatches.length === 0;
  const requirementsRecognized = requirementMismatches.length === 0;
  const rowContractRecognized = rowContractMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerKeyMismatches.length === 0 &&
    publicBlockerClaimViolations.length === 0;
  const staticReadOnlyRecognized =
    staticReadOnlyViolations.length === 0 &&
    topLevelCompatibilityViolations.length === 0;
  const compatibilityClaimed =
    topLevelCompatibilityClaimed !== false ||
    publicBlockerClaimViolations.length > 0;
  const privateAdmissionRecognized =
    manifestRecognized &&
    evidenceRecognized &&
    statusIdsRecognized &&
    bridgeLedgerContextRecognized &&
    requirementsRecognized &&
    rowContractRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    ledgerId: PRIVATE_ADMISSION_825_LEDGER_ID,
    status: privateAdmissionRecognized
      ? PRIVATE_ADMISSION_825_LEDGER_STATUS
      : PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS,
    privateAdmissionRecognized,
    manifestRecognized,
    evidenceRecognized,
    statusIdsRecognized,
    bridgeLedgerContextRecognized,
    requirementsRecognized,
    rowContractRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_825_WORKERS,
    bridgeLedger,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => row.evidenceRecognized === true)
        .map((row) => row.workerId)
    ),
    publicSerializationLeakClaimIds: freezeArray(
      publicSerializationLeakClaimIds
    ),
    jsCjsPackageLeakClaimIds: freezeArray(jsCjsPackageLeakClaimIds),
    nativeBridgeLeakClaimIds: freezeArray(nativeBridgeLeakClaimIds),
    rootActSchedulerLeakClaimIds: freezeArray(rootActSchedulerLeakClaimIds),
    broadMultichildLeakClaimIds: freezeArray(broadMultichildLeakClaimIds),
    publicCompatibilityLeakClaimIds: freezeArray(
      publicCompatibilityLeakClaimIds
    ),
    publicBlockerClaimViolationIds: freezeArray(publicBlockerClaimViolations),
    topLevelCompatibilityViolationIds: freezeArray(
      topLevelCompatibilityViolations
    ),
    manifest: freezeRecord({
      workerIds: freezeArray(actualWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds)
    }),
    rows: freezeArray(evaluatedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    implementationPaths: freezeArray(data.implementationPaths),
    statusIds: freezeArray(data.statusIds),
    bridgeLedgerContext: freezeArray(data.bridgeLedgerContext),
    requirements: freezeRecord(data.requirements),
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
    tokenPolicy: sourceTokenPolicy,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens),
    sliceStart,
    sliceEnd
  });
}

function ledgerRow({
  workerId,
  ledgerRole,
  privateAdmission,
  sourceEvidenceArea,
  implementationPaths,
  statusIds,
  bridgeLedgerContext,
  requirements,
  evidenceRows,
  publicBlockerClaims
}) {
  return freezeRecord({
    workerId,
    ledgerRole,
    privateAdmission,
    sourceQueue: "825",
    localGateCoverage: PRIVATE_ADMISSION_825_LEDGER_ID,
    sourceEvidenceArea,
    implementationPaths: freezeArray(implementationPaths),
    statusIds: freezeArray(statusIds),
    bridgeLedgerContext: freezeArray(bridgeLedgerContext),
    requirements: freezeRecord(requirements),
    evidence: freezeArray(evidenceRows),
    publicBlockerClaims: freezeRecord(publicBlockerClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicBlockerClaims)),
    runtimeCapabilityAdded: false,
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    rustExecutionClaimed: false,
    nativeBridgeExecuted: false,
    nativeBridgeLoadAttempted: false,
    packageImportAttempted: false,
    ledgerEvaluationMode: "source-token-checks-and-bridge-ledger-status-only"
  });
}

function mergeRowOverride(row, override) {
  if (override == null || Object.keys(override).length === 0) {
    return row;
  }

  const merged = { ...row, ...override };
  for (const key of [
    "implementationPaths",
    "statusIds",
    "bridgeLedgerContext",
    "evidence",
    "blockedPublicClaims"
  ]) {
    if (Object.hasOwn(override, key)) {
      merged[key] = freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "requirements")) {
    merged.requirements = freezeRecord({
      ...row.requirements,
      ...override.requirements
    });
  }
  if (Object.hasOwn(override, "publicBlockerClaims")) {
    merged.publicBlockerClaims = freezeRecord({
      ...row.publicBlockerClaims,
      ...override.publicBlockerClaims
    });
  }
  return freezeRecord(merged);
}

function mergeBridgeRowOverrides(defaultOverrides, overrides) {
  const merged = { ...defaultOverrides };
  for (const [workerId, override] of Object.entries(overrides ?? {})) {
    merged[workerId] = freezeRecord({
      ...(defaultOverrides[workerId] ?? {}),
      ...override
    });
  }
  return freezeRecord(merged);
}

function evaluateLedgerRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot })
  );

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceRecognized:
      evidence.length > 0 &&
      evidence.every((evidenceRow) => evidenceRow.recognized === true)
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
  const commentFreeSourceText =
    sourceText.ok === true
      ? stripSourceComments(sourceText.value, evidenceRow.path)
      : "";
  const missingTokens =
    sourceText.ok === true
      ? evidenceRow.tokens.filter(
          (token) => !commentFreeSourceText.includes(token)
        )
      : evidenceRow.tokens;
  const forbiddenTokensPresent =
    sourceText.ok === true
      ? evidenceRow.forbiddenTokens.filter((token) =>
          commentFreeSourceText.includes(token)
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

function stripSourceComments(text, path) {
  const rustSource = path.endsWith(".rs");
  const javascriptSource = /\.(?:cjs|js|mjs)$/.test(path);
  const output = [];
  let index = 0;

  while (index < text.length) {
    const rawStringEnd = rustSource
      ? findRustRawStringEnd(text, index)
      : -1;
    if (rawStringEnd >= 0) {
      output.push(text.slice(index, rawStringEnd));
      index = rawStringEnd;
      continue;
    }

    const character = text[index];
    const nextCharacter = text[index + 1];

    if (
      (character === `"` && rustSource) ||
      (javascriptSource &&
        (character === `"` || character === "'" || character === "`"))
    ) {
      const stringEnd = findQuotedStringEnd(text, index, character);
      output.push(text.slice(index, stringEnd));
      index = stringEnd;
      continue;
    }

    if (character === "/" && nextCharacter === "/") {
      index = skipLineComment(text, index, output);
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      index = skipBlockComment(text, index, output, rustSource);
      continue;
    }

    output.push(character);
    index += 1;
  }

  return output.join("");
}

function findRustRawStringEnd(text, index) {
  let rawPrefixIndex = index;
  if (text[index] === "b" && text[index + 1] === "r") {
    rawPrefixIndex += 1;
  }
  if (text[rawPrefixIndex] !== "r") {
    return -1;
  }

  let cursor = rawPrefixIndex + 1;
  while (text[cursor] === "#") {
    cursor += 1;
  }
  if (text[cursor] !== `"`) {
    return -1;
  }

  const terminator = `"` + "#".repeat(cursor - rawPrefixIndex - 1);
  const endIndex = text.indexOf(terminator, cursor + 1);
  return endIndex < 0 ? text.length : endIndex + terminator.length;
}

function findQuotedStringEnd(text, index, quote) {
  let cursor = index + 1;
  while (cursor < text.length) {
    if (text[cursor] === "\\") {
      cursor += 2;
      continue;
    }
    cursor += 1;
    if (text[cursor - 1] === quote) {
      return cursor;
    }
  }
  return text.length;
}

function skipLineComment(text, index, output) {
  output.push(" ");
  let cursor = index + 2;
  while (cursor < text.length && text[cursor] !== "\n") {
    cursor += 1;
  }
  if (cursor < text.length) {
    output.push(text[cursor]);
    cursor += 1;
  }
  return cursor;
}

function skipBlockComment(text, index, output, nested) {
  output.push(" ");
  let cursor = index + 2;
  let depth = 1;
  while (cursor < text.length && depth > 0) {
    if (nested && text[cursor] === "/" && text[cursor + 1] === "*") {
      depth += 1;
      cursor += 2;
      continue;
    }
    if (text[cursor] === "*" && text[cursor + 1] === "/") {
      depth -= 1;
      cursor += 2;
      continue;
    }
    if (text[cursor] === "\n") {
      output.push("\n");
    }
    cursor += 1;
  }
  output.push(" ");
  return cursor;
}

function createRequiredSetMismatches({
  rows,
  requiredByWorker,
  actualKey,
  valueSelector,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    if (!Object.hasOwn(requiredByWorker, row.workerId)) {
      return [];
    }
    const expected = requiredByWorker[row.workerId];
    const actual = valueSelector(row[actualKey] ?? []);
    if (sameStringSet(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: expected,
        [actualKeyForViolation]: freezeArray(actual),
        missingIds: missingValues(expected, actual),
        unexpectedIds: missingValues(actual, expected),
        duplicateIds: duplicateValues(actual)
      })
    ];
  });
}

function createExpectedSetMismatch({
  workerId,
  expected,
  actual,
  expectedKey,
  actualKey
}) {
  if (sameStringSet(expected, actual)) {
    return [];
  }
  return [
    freezeRecord({
      workerId,
      [expectedKey]: expected,
      [actualKey]: freezeArray(actual),
      missingIds: missingValues(expected, actual),
      unexpectedIds: missingValues(actual, expected),
      duplicateIds: duplicateValues(actual)
    })
  ];
}

function createRecordMismatches({
  workerId,
  expected,
  actual,
  fieldKey,
  expectedKey,
  actualKey
}) {
  if (expected == null || actual == null) {
    return [
      freezeRecord({
        workerId,
        [fieldKey]: "<record>",
        [expectedKey]: expected,
        [actualKey]: actual
      })
    ];
  }

  const mismatches = [];
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);
  for (const key of expectedKeys) {
    if (actual[key] !== expected[key]) {
      mismatches.push(
        freezeRecord({
          workerId,
          [fieldKey]: key,
          [expectedKey]: expected[key],
          [actualKey]: actual[key]
        })
      );
    }
  }
  for (const key of actualKeys) {
    if (!expectedKeys.includes(key)) {
      mismatches.push(
        freezeRecord({
          workerId,
          [fieldKey]: key,
          [expectedKey]: undefined,
          [actualKey]: actual[key]
        })
      );
    }
  }
  return mismatches;
}

function rowContract(row) {
  return freezeRecord({
    sourceQueue: row.sourceQueue,
    privateAdmission: row.privateAdmission,
    localGateCoverage: row.localGateCoverage,
    runtimeCapabilityAdded: row.runtimeCapabilityAdded,
    compatibilityClaimed: row.compatibilityClaimed,
    promotion: row.promotion,
    privateEvidenceOnly: row.privateEvidenceOnly,
    sourceTokenChecksOnly: row.sourceTokenChecksOnly,
    manifestEvaluationOnly: row.manifestEvaluationOnly,
    runtimeExecutionClaimed: row.runtimeExecutionClaimed,
    rustExecutionClaimed: row.rustExecutionClaimed,
    nativeBridgeExecuted: row.nativeBridgeExecuted,
    nativeBridgeLoadAttempted: row.nativeBridgeLoadAttempted,
    packageImportAttempted: row.packageImportAttempted,
    ledgerEvaluationMode: row.ledgerEvaluationMode,
    blockedPublicClaims: freezeArray(row.blockedPublicClaims ?? [])
  });
}

function sameRowContract(expected, actual) {
  return (
    expected.sourceQueue === actual.sourceQueue &&
    expected.privateAdmission === actual.privateAdmission &&
    expected.localGateCoverage === actual.localGateCoverage &&
    expected.runtimeCapabilityAdded === actual.runtimeCapabilityAdded &&
    expected.compatibilityClaimed === actual.compatibilityClaimed &&
    expected.promotion === actual.promotion &&
    expected.privateEvidenceOnly === actual.privateEvidenceOnly &&
    expected.sourceTokenChecksOnly === actual.sourceTokenChecksOnly &&
    expected.manifestEvaluationOnly === actual.manifestEvaluationOnly &&
    expected.runtimeExecutionClaimed === actual.runtimeExecutionClaimed &&
    expected.rustExecutionClaimed === actual.rustExecutionClaimed &&
    expected.nativeBridgeExecuted === actual.nativeBridgeExecuted &&
    expected.nativeBridgeLoadAttempted === actual.nativeBridgeLoadAttempted &&
    expected.packageImportAttempted === actual.packageImportAttempted &&
    expected.ledgerEvaluationMode === actual.ledgerEvaluationMode &&
    sameStringSet(expected.blockedPublicClaims, actual.blockedPublicClaims)
  );
}

function falseRecord(keys) {
  return freezeRecord(Object.fromEntries(keys.map((key) => [key, false])));
}

function missingValues(expectedSubset, actualSuperset) {
  return freezeArray(
    expectedSubset.filter((value) => !actualSuperset.includes(value))
  );
}

function duplicateValues(values) {
  return freezeArray(
    values.filter((value, index) => values.indexOf(value) !== index)
  );
}

function uniqueStrings(values) {
  return [...new Set(values)];
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

function identity(value) {
  return value;
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(createViolation(id, { rows: freezeArray(rows) }));
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
