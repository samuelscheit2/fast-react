import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_807_GATE_ID,
  PRIVATE_ADMISSION_807_GATE_STATUS,
  evaluatePrivateAdmission807Gate
} from "./private-admission-807-native-no-load-ledger.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_821_GATE_ID =
  "private-admission-821-native-cleanup-stale-ledger-1";
export const PRIVATE_ADMISSION_821_GATE_STATUS =
  "recognized-accepted-native-cleanup-stale-matrix-public-native-blocked";
export const PRIVATE_ADMISSION_821_VIOLATION_STATUS =
  "blocked-accepted-native-cleanup-stale-matrix-with-violations";

const worker815 = "worker-815-native-worker-thread-cleanup-stale-matrix";

export const PRIVATE_ADMISSION_821_WORKERS = freezeArray([worker815]);

export const PRIVATE_ADMISSION_821_REQUIRED_NATIVE_CLEANUP_EVIDENCE_IDS =
  freezeRecord({
    [worker815]: freezeArray([
      "cleanup-hook-worker-root-before-value-release",
      "cleanup-hook-worker-value-after-root-release",
      "cleanup-hook-stale-worker-transport-evidence-rejected",
      "cleanup-hook-forged-peer-active-evidence-rejected",
      "cleanup-hook-canonical-root-wrong-worker-rejected",
      "cleanup-hook-canonical-root-wrong-environment-rejected",
      "cleanup-hook-canonical-root-as-value-rejected",
      "cleanup-hook-canonical-value-as-root-rejected",
      "cleanup-hook-canonical-value-wrong-source-code-rejected",
      "cleanup-hook-canonical-root-wrong-boundary-code-rejected",
      "cleanup-hook-create-value-stale-after-teardown-rejected",
      "cleanup-hook-root-source-with-value-order-identity-rejected",
      "cleanup-hook-value-source-with-root-order-identity-rejected"
    ])
  });

export const PRIVATE_ADMISSION_821_REQUIRED_CLEANUP_BLOCKER_IDS =
  freezeRecord({
    [worker815]: freezeArray([
      "cleanup-hook-stale-worker-transport-evidence-rejected",
      "cleanup-hook-forged-peer-active-evidence-rejected",
      "cleanup-hook-canonical-root-wrong-worker-rejected",
      "cleanup-hook-canonical-root-wrong-environment-rejected",
      "cleanup-hook-canonical-root-as-value-rejected",
      "cleanup-hook-canonical-value-as-root-rejected",
      "cleanup-hook-canonical-value-wrong-source-code-rejected",
      "cleanup-hook-canonical-root-wrong-boundary-code-rejected",
      "cleanup-hook-create-value-stale-after-teardown-rejected",
      "cleanup-hook-root-source-with-value-order-identity-rejected",
      "cleanup-hook-value-source-with-root-order-identity-rejected",
      "cleanup-hook-root-id-tamper-rejected",
      "cleanup-hook-root-function-token-tamper-rejected",
      "cleanup-hook-root-argument-token-tamper-rejected",
      "cleanup-hook-value-id-tamper-rejected",
      "cleanup-hook-value-function-token-tamper-rejected",
      "cleanup-hook-value-argument-token-tamper-rejected"
    ])
  });

export const PRIVATE_ADMISSION_821_REQUIRED_STATUSES = freezeRecord({
  [worker815]: freezeArray([
    "preflighted-native-root-bridge-worker-thread-cleanup-hook-order",
    "preflighted-native-root-bridge-worker-thread-teardown-boundary",
    "diagnosed-native-root-bridge-transport-worker-thread-teardown",
    "FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT",
    "FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE",
    "FAST_REACT_NAPI_CLEANUP_HOOK_ORDER_MISMATCH",
    "FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH",
    "FAST_REACT_NAPI_STALE_HANDLE",
    "FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"
  ])
});

export const PRIVATE_ADMISSION_821_REQUIRED_FUNCTION_NAMES = freezeRecord({
  [worker815]: freezeArray([
    "native_root_bridge_worker_thread_cleanup_hook_preflight_records_private_order_identity",
    "native_root_bridge_worker_thread_cleanup_hook_preflight_keeps_public_native_blockers_false",
    "native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_stale_and_forged_evidence",
    "native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_stale_source_mismatches",
    "cleanup_hook_preflight_rejects_stale_value_and_order_identity_forgery",
    "native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_identity_tampering",
    "validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight",
    "assertBlockedNativeRootBridgeClaim",
    "assertBlockedNativeRootBridgeHandoff",
    "assertBlockedNativeRootBridgeHandoffClaims",
    "createValidNativeRootBridgeRequestRecord"
  ])
});

export const PRIVATE_ADMISSION_821_REQUIRED_FIELD_NAMES = freezeRecord({
  [worker815]: freezeArray([
    "workerThreadCleanupHookPreflight",
    "cleanupHookPreflightRowFields",
    "sourcePreflightStatus",
    "sourceWorkerThreadId",
    "sourceEnvironmentId",
    "sourceRowId",
    "sourceHandleKind",
    "sourceErrorCode",
    "sourceBoundaryErrorCode",
    "canonicalExecutableEvidence",
    "cleanupHookOrderPrivate",
    "cleanupHookIdentityPrivate",
    "staleOrForgedCleanupEvidenceRejected",
    "nodeWorkerThreadsExecution",
    "napiCleanupHookExecution",
    "nativeAddonLoaded",
    "nativeExecution",
    "rendererExecution",
    "reconcilerExecution",
    "publicNativeCompatibility",
    "reactBehaviorError",
    "compatibilityClaimed",
    "packageCompatibilityClaimed"
  ])
});

export const PRIVATE_ADMISSION_821_REQUIRED_SOURCE_CONSTANTS = freezeRecord({
  [worker815]: freezeArray([
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS",
    "NATIVE_ROOT_BRIDGE_TRANSPORT_WORKER_THREAD_TEARDOWN_GATE_STATUS",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_EVIDENCE_CODE",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ORDER_MISMATCH_CODE",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_IDENTITY_MISMATCH_CODE",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ID",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ID",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_FUNCTION_IDENTITY_TOKEN",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_FUNCTION_IDENTITY_TOKEN",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ARGUMENT_IDENTITY_TOKEN",
    "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ARGUMENT_IDENTITY_TOKEN"
  ])
});

export const PRIVATE_ADMISSION_821_REQUIRED_PRIOR_LEDGER_CONTEXT =
  freezeRecord({
    [worker815]: freezeArray([
      PRIVATE_ADMISSION_807_GATE_ID,
      PRIVATE_ADMISSION_807_GATE_STATUS,
      "worker-790-native-cleanup-hook-identity-tamper-gate",
      "worker-801-native-no-load-transitive-matrix"
    ])
  });

export const PRIVATE_ADMISSION_821_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicCompatibilityClaimed",
  "compatibilityClaimed",
  "publicNativeCompatibility",
  "publicNativeExecution",
  "nativeAddonLoadingAvailable",
  "nativeAddonLoaded",
  "nativeExecutionAvailable",
  "nativeExecution",
  "workerThreadCreationAvailable",
  "nodeWorkerThreadsExecution",
  "napiCleanupHookExecution",
  "rendererExecution",
  "reconcilerExecution",
  "staleCleanupEvidenceAccepted",
  "staleWorkerCleanupSourceAccepted",
  "staleCleanupBlockersRemoved",
  "forgedCleanupEvidenceAccepted",
  "cleanupHookIdentityForgeryAccepted",
  "cleanupHookOrderMismatchAccepted",
  "cleanupHookPublicExecutionClaimed",
  "packageCompatibilityClaimed",
  "packageExportCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "publicPackageExportsCompatibilityClaimed",
  "nativePrivateSubpathsExported",
  "packageExportsMutated",
  "packageJsonExportsMutated",
  "rootManifestsOrLockfilesMutated",
  "jsCjsBridgeCompatibilityClaimed",
  "jsCjsBridgeExportClaimed",
  "commonJsBridgeRuntimeClaimed",
  "esmBridgeRuntimeClaimed",
  "nativeLoaderPublicCompatibilityClaimed",
  "nativeRequestShapePublicClaimed",
  "publicRootRenderCompatibilityClaimed",
  "publicRootWorkLoopCompatibilityClaimed",
  "rootCommitExecutionClaimed",
  "publicReactActCompatibilityClaimed",
  "publicActCompatibilityClaimed",
  "actQueueFlushingClaimed",
  "publicSchedulerCompatibilityClaimed",
  "publicSchedulerFlushBehaviorExecuted",
  "publicSchedulerTimingCompatibilityClaimed",
  "schedulerDelayedActRootAdmissionClaimed",
  "schedulerDelayedRendererRootAdmissionClaimed"
]);

const nativeIndexPath = "bindings/node/index.cjs";
const nativeNoLoadGuardTestPath =
  "bindings/node/test/native-no-load-guard.test.cjs";
const fastReactNapiSourcePath = "crates/fast-react-napi/src/lib.rs";
const worker815ProgressPath =
  "worker-progress/worker-815-native-worker-thread-cleanup-stale-matrix.md";

const privateAdmission821Rows = freezeArray([
  rowData({
    workerId: worker815,
    ledgerRole: "accepted-native-cleanup-stale-matrix-evidence",
    privateAdmission: "accepted-private-native-cleanup-stale-matrix",
    implementationPaths: freezeArray([
      fastReactNapiSourcePath,
      nativeIndexPath,
      nativeNoLoadGuardTestPath,
      worker815ProgressPath
    ]),
    nativeCleanupEvidenceIds:
      PRIVATE_ADMISSION_821_REQUIRED_NATIVE_CLEANUP_EVIDENCE_IDS[worker815],
    cleanupBlockerIds:
      PRIVATE_ADMISSION_821_REQUIRED_CLEANUP_BLOCKER_IDS[worker815],
    requiredStatuses: PRIVATE_ADMISSION_821_REQUIRED_STATUSES[worker815],
    requiredFunctionNames:
      PRIVATE_ADMISSION_821_REQUIRED_FUNCTION_NAMES[worker815],
    requiredFieldNames: PRIVATE_ADMISSION_821_REQUIRED_FIELD_NAMES[worker815],
    requiredSourceConstants:
      PRIVATE_ADMISSION_821_REQUIRED_SOURCE_CONSTANTS[worker815],
    priorLedgerContext:
      PRIVATE_ADMISSION_821_REQUIRED_PRIOR_LEDGER_CONTEXT[worker815],
    evidence: [
      evidenceData({
        role: "worker-815-fast-react-napi-cleanup-source-constants",
        path: fastReactNapiSourcePath,
        sliceStart:
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS",
        sliceEnd: "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_COUNT",
        tokens: [
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_EVIDENCE_CODE",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ORDER_MISMATCH_CODE",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_IDENTITY_MISMATCH_CODE",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ID",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ID",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_FUNCTION_IDENTITY_TOKEN",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_FUNCTION_IDENTITY_TOKEN",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ARGUMENT_IDENTITY_TOKEN",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ARGUMENT_IDENTITY_TOKEN"
        ]
      }),
      evidenceData({
        role: "worker-815-fast-react-napi-cleanup-stale-matrix",
        path: fastReactNapiSourcePath,
        sliceStart:
          "native_root_bridge_worker_thread_cleanup_hook_preflight_records_private_order_identity",
        sliceEnd: "native_root_bridge_js_request_shape_metadata_matches_handle_validation_model",
        tokens: [
          "native_root_bridge_worker_thread_cleanup_hook_preflight_records_private_order_identity",
          "native_root_bridge_worker_thread_cleanup_hook_preflight_keeps_public_native_blockers_false",
          "native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_stale_and_forged_evidence",
          "native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_stale_source_mismatches",
          "cleanup_hook_preflight_rejects_stale_value_and_order_identity_forgery",
          "native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_identity_tampering",
          "validate_native_root_bridge_worker_thread_cleanup_hook_evidence_for_preflight",
          "NativeRootBridgeWorkerThreadCleanupHookEvidence",
          "NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus",
          "CleanupHookSourceMismatchCase",
          "CleanupHookOrderIdentityForgeryCase",
          "CleanupHookIdentityTamperCase",
          "cleanup-hook-canonical-root-wrong-worker-rejected",
          "cleanup-hook-canonical-root-wrong-environment-rejected",
          "cleanup-hook-canonical-root-as-value-rejected",
          "cleanup-hook-canonical-value-as-root-rejected",
          "cleanup-hook-canonical-value-wrong-source-code-rejected",
          "cleanup-hook-canonical-root-wrong-boundary-code-rejected",
          "cleanup-hook-create-value-stale-after-teardown-rejected",
          "cleanup-hook-root-source-with-value-order-identity-rejected",
          "cleanup-hook-value-source-with-root-order-identity-rejected",
          "cleanup-hook-root-id-tamper-rejected",
          "cleanup-hook-root-function-token-tamper-rejected",
          "cleanup-hook-root-argument-token-tamper-rejected",
          "cleanup-hook-value-id-tamper-rejected",
          "cleanup-hook-value-function-token-tamper-rejected",
          "cleanup-hook-value-argument-token-tamper-rejected",
          "FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT",
          "FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE",
          "FAST_REACT_NAPI_CLEANUP_HOOK_ORDER_MISMATCH",
          "FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH",
          "FAST_REACT_NAPI_STALE_HANDLE",
          "FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE",
          "node_worker_threads_execution",
          "napi_cleanup_hook_execution",
          "native_addon_loaded",
          "native_execution",
          "renderer_execution",
          "reconciler_execution",
          "public_native_compatibility",
          "react_behavior_error"
        ],
        forbiddenTokens: [
          "rust_root_execution_boundary_called",
          "publicSchedulerCompatibilityClaimed",
          "publicReactActCompatibilityClaimed",
          "publicRootRenderCompatibilityClaimed"
        ]
      }),
      evidenceData({
        role: "worker-815-native-index-cleanup-preflight-mirror",
        path: nativeIndexPath,
        sliceStart: "nativeRootBridgeWorkerThreadCleanupHookPreflightStatus",
        tokens: [
          "nativeRootBridgeWorkerThreadCleanupHookPreflightStatus",
          "nativeRootBridgeWorkerThreadCleanupHookPreflightModel",
          "nativeRootBridgeWorkerThreadCleanupHookPreflightExecutionScope",
          "nativeRootBridgeWorkerThreadCleanupHookStaleEvidenceCode",
          "nativeRootBridgeWorkerThreadCleanupHookForgedEvidenceCode",
          "nativeRootBridgeWorkerThreadCleanupHookPreflightRowFields",
          "nativeRootBridgeWorkerThreadCleanupHookPreflight",
          "cleanupHookPreflightRowFields",
          "sourcePreflightStatus",
          "sourceWorkerThreadId",
          "sourceEnvironmentId",
          "sourceRowId",
          "sourceHandleKind",
          "sourceErrorCode",
          "sourceBoundaryErrorCode",
          "canonicalExecutableEvidence",
          "cleanupHookOrderPrivate",
          "cleanupHookIdentityPrivate",
          "staleOrForgedCleanupEvidenceRejected",
          "cleanup-hook-worker-root-before-value-release",
          "cleanup-hook-worker-value-after-root-release",
          "cleanup-hook-stale-worker-transport-evidence-rejected",
          "cleanup-hook-forged-peer-active-evidence-rejected",
          "preflighted-native-root-bridge-worker-thread-cleanup-hook-order",
          "FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT",
          "FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE",
          "nodeWorkerThreadsExecution",
          "napiCleanupHookExecution",
          "nativeAddonLoaded",
          "nativeExecution",
          "rendererExecution",
          "reconcilerExecution",
          "publicNativeCompatibility",
          "reactBehaviorError"
        ]
      }),
      evidenceData({
        role: "worker-815-native-index-handoff-claim-blockers",
        path: nativeIndexPath,
        tokens: [
          "assertBlockedNativeRootBridgeHandoff",
          "assertBlockedNativeRootBridgeHandoffClaims",
          "nativeAddonLoaded",
          "nativeExecution",
          "rendererExecution",
          "reconcilerExecution",
          "domMutation",
          "markerWrites",
          "listenerInstallation",
          "hydration",
          "eventDispatch",
          "publicNativeCompatibility",
          "compatibilityClaimed",
          "nativeRootBridgeRequestShapeErrorCode"
        ]
      }),
      evidenceData({
        role: "worker-815-native-no-load-guard-claim-blockers",
        path: nativeNoLoadGuardTestPath,
        sliceStart: "createForbiddenLoadFixtureMatrix",
        tokens: [
          "createValidNativeRootBridgeRequestRecord",
          "assertBlockedNativeRootBridgeClaim",
          "nativeAddonLoaded",
          "nativeExecution",
          "rendererExecution",
          "reconcilerExecution",
          "publicNativeCompatibility",
          "compatibilityClaimed",
          "FAST_REACT_NATIVE_ROOT_BRIDGE_REQUEST_SHAPE_INVALID",
          "cjsDynamicNativeAddonEntry",
          "nativeAddonPath"
        ],
        forbiddenTokens: [
          "workerThreadCreationAvailable",
          "publicSchedulerCompatibilityClaimed",
          "publicReactActCompatibilityClaimed"
        ]
      }),
      evidenceData({
        role: "worker-815-native-no-load-guard-cleanup-mirror",
        path: nativeNoLoadGuardTestPath,
        sliceStart: "workerThreadCleanupHookPreflight",
        sliceEnd: "jsonTransportSmoke",
        tokens: [
          "workerThreadCleanupHookPreflight",
          "preflighted-native-root-bridge-worker-thread-cleanup-hook-order",
          "cleanup-hook-worker-root-before-value-release",
          "cleanup-hook-worker-value-after-root-release",
          "cleanup-hook-stale-worker-transport-evidence-rejected",
          "cleanup-hook-forged-peer-active-evidence-rejected",
          "nodeWorkerThreadsExecution",
          "napiCleanupHookExecution",
          "nativeAddonLoaded",
          "nativeExecution",
          "rendererExecution",
          "reconcilerExecution",
          "publicNativeCompatibility",
          "reactBehaviorError"
        ]
      }),
      evidenceData({
        role: "worker-815-progress-ownership-evidence",
        path: worker815ProgressPath,
        tokens: [
          "worker-progress/worker-815-native-worker-thread-cleanup-stale-matrix.md",
          "worker-815-native-worker-thread-cleanup-stale-matrix.md",
          "bindings/node/index.cjs",
          "crates/fast-react-napi/src/lib.rs",
          "bindings/node/test/native-no-load-guard.test.cjs",
          "cargo test -p fast-react-napi --all-features cleanup_hook_preflight",
          "node bindings/node/test/native-no-load-guard.test.cjs",
          "node --check bindings/node/index.cjs",
          "nativeAddonLoaded",
          "rendererExecution",
          "publicNativeCompatibility"
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_821_ROWS = freezeArray(
  privateAdmission821Rows.map((sourceRow) =>
    row({
      ...sourceRow,
      publicBlockers: falseRecord(PRIVATE_ADMISSION_821_PUBLIC_BLOCKER_FIELDS)
    })
  )
);

export function evaluatePrivateAdmission821Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  compatibilityClaimed = false
} = {}) {
  const fileCache = new Map();
  const prior807 = evaluatePrivateAdmission807Gate({ workspaceRoot });
  const rows = PRIVATE_ADMISSION_821_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((row) => row.workerId);
  const manifest = freezeRecord({
    expectedWorkerIds: PRIVATE_ADMISSION_821_WORKERS,
    actualWorkerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_821_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_821_WORKERS.includes(workerId)
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
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError,
          sliceError: evidenceRow.sliceError
        })
      )
  );
  const nativeCleanupEvidenceMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_821_REQUIRED_NATIVE_CLEANUP_EVIDENCE_IDS,
    actualKey: "nativeCleanupEvidenceIds",
    expectedKey: "expectedNativeCleanupEvidenceIds",
    actualKeyForViolation: "actualNativeCleanupEvidenceIds"
  });
  const cleanupBlockerMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_821_REQUIRED_CLEANUP_BLOCKER_IDS,
    actualKey: "cleanupBlockerIds",
    expectedKey: "expectedCleanupBlockerIds",
    actualKeyForViolation: "actualCleanupBlockerIds"
  });
  const statusMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_821_REQUIRED_STATUSES,
    actualKey: "requiredStatuses",
    expectedKey: "expectedStatuses",
    actualKeyForViolation: "actualStatuses"
  });
  const functionNameMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_821_REQUIRED_FUNCTION_NAMES,
    actualKey: "requiredFunctionNames",
    expectedKey: "expectedFunctionNames",
    actualKeyForViolation: "actualFunctionNames"
  });
  const fieldNameMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_821_REQUIRED_FIELD_NAMES,
    actualKey: "requiredFieldNames",
    expectedKey: "expectedFieldNames",
    actualKeyForViolation: "actualFieldNames"
  });
  const sourceConstantMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_821_REQUIRED_SOURCE_CONSTANTS,
    actualKey: "requiredSourceConstants",
    expectedKey: "expectedSourceConstants",
    actualKeyForViolation: "actualSourceConstants"
  });
  const priorLedgerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_821_REQUIRED_PRIOR_LEDGER_CONTEXT,
    actualKey: "priorLedgerContext",
    expectedKey: "expectedPriorLedgerContext",
    actualKeyForViolation: "actualPriorLedgerContext"
  });
  const publicBlockerKeyMismatches = evaluatedRows.flatMap((row) => {
    const actualKeys = Object.keys(row.publicBlockers);
    if (sameStringSet(PRIVATE_ADMISSION_821_PUBLIC_BLOCKER_FIELDS, actualKeys)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicBlockerFields:
          PRIVATE_ADMISSION_821_PUBLIC_BLOCKER_FIELDS,
        actualPublicBlockerFields: freezeArray(actualKeys)
      })
    ];
  });
  const publicBlockerViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockers)
      .filter(([, value]) => value !== false)
      .map(([field]) => `${row.workerId}.${field}`)
  );
  const staticReadOnlyViolations = evaluatedRows
    .filter((row) => row.staticReadOnlyRecognized !== true)
    .map((row) => row.workerId);
  const priorLedgerViolations =
    prior807.status === PRIVATE_ADMISSION_807_GATE_STATUS &&
    prior807.violations.length === 0
      ? []
      : [
          freezeRecord({
            gateId: PRIVATE_ADMISSION_807_GATE_ID,
            status: prior807.status,
            violationIds: freezeArray(
              prior807.violations.map((violation) => violation.id)
            )
          })
        ];
  const topLevelCompatibilityViolations =
    compatibilityClaimed === false ? [] : ["gate.compatibilityClaimed"];

  const nativeExecutionClaimIds = filterClaimIds(publicBlockerViolations, [
    "nativeAddonLoadingAvailable",
    "nativeAddonLoaded",
    "nativeExecutionAvailable",
    "nativeExecution",
    "workerThreadCreationAvailable",
    "nodeWorkerThreadsExecution",
    "napiCleanupHookExecution",
    "rendererExecution",
    "reconcilerExecution",
    "publicNativeExecution",
    "publicNativeCompatibility"
  ]);
  const cleanupBlockerClaimIds = filterClaimIds(publicBlockerViolations, [
    "staleCleanupEvidenceAccepted",
    "staleWorkerCleanupSourceAccepted",
    "staleCleanupBlockersRemoved",
    "forgedCleanupEvidenceAccepted",
    "cleanupHookIdentityForgeryAccepted",
    "cleanupHookOrderMismatchAccepted",
    "cleanupHookPublicExecutionClaimed"
  ]);
  const packageCompatibilityClaimIds = filterClaimIds(
    publicBlockerViolations,
    [
      "packageCompatibilityClaimed",
      "packageExportCompatibilityClaimed",
      "publicPackageCompatibilityClaimed",
      "publicPackageExportsCompatibilityClaimed",
      "nativePrivateSubpathsExported",
      "packageExportsMutated",
      "packageJsonExportsMutated",
      "rootManifestsOrLockfilesMutated"
    ]
  );
  const jsCjsBridgeClaimIds = filterClaimIds(publicBlockerViolations, [
    "jsCjsBridgeCompatibilityClaimed",
    "jsCjsBridgeExportClaimed",
    "commonJsBridgeRuntimeClaimed",
    "esmBridgeRuntimeClaimed",
    "nativeLoaderPublicCompatibilityClaimed",
    "nativeRequestShapePublicClaimed"
  ]);
  const rootActSchedulerClaimIds = filterClaimIds(publicBlockerViolations, [
    "publicRootRenderCompatibilityClaimed",
    "publicRootWorkLoopCompatibilityClaimed",
    "rootCommitExecutionClaimed",
    "publicReactActCompatibilityClaimed",
    "publicActCompatibilityClaimed",
    "actQueueFlushingClaimed",
    "publicSchedulerCompatibilityClaimed",
    "publicSchedulerFlushBehaviorExecuted",
    "publicSchedulerTimingCompatibilityClaimed",
    "schedulerDelayedActRootAdmissionClaimed",
    "schedulerDelayedRendererRootAdmissionClaimed"
  ]);
  const publicCompatibilityClaimIds = filterClaimIds(publicBlockerViolations, [
    "publicCompatibilityClaimed",
    "compatibilityClaimed",
    "publicNativeCompatibility",
    "publicNativeExecution",
    "publicPackageCompatibilityClaimed",
    "publicPackageExportsCompatibilityClaimed",
    "jsCjsBridgeCompatibilityClaimed",
    "nativeLoaderPublicCompatibilityClaimed",
    "publicRootRenderCompatibilityClaimed",
    "publicReactActCompatibilityClaimed",
    "publicSchedulerCompatibilityClaimed"
  ]);

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("native-cleanup-stale-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "native-cleanup-stale-evidence-token-missing",
    evidenceMismatches
  );
  pushRowsViolation(
    violations,
    "native-cleanup-stale-evidence-id-mismatch",
    nativeCleanupEvidenceMismatches
  );
  pushRowsViolation(
    violations,
    "native-cleanup-stale-cleanup-blocker-id-mismatch",
    cleanupBlockerMismatches
  );
  pushRowsViolation(
    violations,
    "native-cleanup-stale-status-mismatch",
    statusMismatches
  );
  pushRowsViolation(
    violations,
    "native-cleanup-stale-function-name-mismatch",
    functionNameMismatches
  );
  pushRowsViolation(
    violations,
    "native-cleanup-stale-field-name-mismatch",
    fieldNameMismatches
  );
  pushRowsViolation(
    violations,
    "native-cleanup-stale-source-constant-mismatch",
    sourceConstantMismatches
  );
  pushRowsViolation(
    violations,
    "native-cleanup-stale-prior-ledger-context-mismatch",
    priorLedgerContextMismatches
  );
  pushRowsViolation(
    violations,
    "native-cleanup-stale-prior-ledger-mismatch",
    priorLedgerViolations
  );
  pushRowsViolation(
    violations,
    "native-cleanup-stale-public-blocker-field-mismatch",
    publicBlockerKeyMismatches
  );
  pushIdsViolation(
    violations,
    "native-cleanup-stale-static-mode-mismatch",
    staticReadOnlyViolations
  );
  pushClaimIdsViolation(
    violations,
    "native-cleanup-stale-native-execution-claim-detected",
    nativeExecutionClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-cleanup-stale-cleanup-blocker-claim-detected",
    cleanupBlockerClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-cleanup-stale-package-compatibility-claim-detected",
    packageCompatibilityClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-cleanup-stale-js-cjs-bridge-claim-detected",
    jsCjsBridgeClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-cleanup-stale-root-act-scheduler-claim-detected",
    rootActSchedulerClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-cleanup-stale-public-compatibility-claim-detected",
    publicCompatibilityClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-cleanup-stale-top-level-compatibility-claim-detected",
    topLevelCompatibilityViolations
  );

  const evidenceRecognized = evidenceMismatches.length === 0;
  const nativeCleanupEvidenceRecognized =
    nativeCleanupEvidenceMismatches.length === 0;
  const cleanupBlockersRecognized = cleanupBlockerMismatches.length === 0;
  const statusesRecognized = statusMismatches.length === 0;
  const functionNamesRecognized = functionNameMismatches.length === 0;
  const fieldNamesRecognized = fieldNameMismatches.length === 0;
  const sourceConstantsRecognized = sourceConstantMismatches.length === 0;
  const priorLedgerContextRecognized =
    priorLedgerContextMismatches.length === 0;
  const priorLedgerRecognized = priorLedgerViolations.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerKeyMismatches.length === 0 &&
    publicBlockerViolations.length === 0;
  const staticReadOnlyRecognized =
    staticReadOnlyViolations.length === 0 &&
    topLevelCompatibilityViolations.length === 0;
  const privateDiagnosticsRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    evidenceRecognized &&
    nativeCleanupEvidenceRecognized &&
    cleanupBlockersRecognized &&
    statusesRecognized &&
    functionNamesRecognized &&
    fieldNamesRecognized &&
    sourceConstantsRecognized &&
    priorLedgerContextRecognized &&
    priorLedgerRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_821_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_821_GATE_STATUS
      : PRIVATE_ADMISSION_821_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    evidenceRecognized,
    nativeCleanupEvidenceRecognized,
    cleanupBlockersRecognized,
    statusesRecognized,
    functionNamesRecognized,
    fieldNamesRecognized,
    sourceConstantsRecognized,
    priorLedgerContextRecognized,
    priorLedgerRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed:
      compatibilityClaimed !== false ||
      publicCompatibilityClaimIds.length > 0 ||
      topLevelCompatibilityViolations.length > 0,
    queueWorkers: PRIVATE_ADMISSION_821_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => row.recognized === true)
        .map((row) => row.workerId)
    ),
    priorLedger: freezeRecord({
      gateId: PRIVATE_ADMISSION_807_GATE_ID,
      status: prior807.status,
      recognized: priorLedgerRecognized
    }),
    nativeExecutionClaimIds: freezeArray(nativeExecutionClaimIds),
    cleanupBlockerClaimIds: freezeArray(cleanupBlockerClaimIds),
    packageCompatibilityClaimIds: freezeArray(packageCompatibilityClaimIds),
    jsCjsBridgeClaimIds: freezeArray(jsCjsBridgeClaimIds),
    rootActSchedulerClaimIds: freezeArray(rootActSchedulerClaimIds),
    publicCompatibilityClaimIds: freezeArray(publicCompatibilityClaimIds),
    publicBlockerViolationIds: freezeArray(publicBlockerViolations),
    topLevelCompatibilityViolationIds: freezeArray(
      topLevelCompatibilityViolations
    ),
    staticReadOnlyViolationIds: freezeArray(staticReadOnlyViolations),
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: freezeRecord(
      Object.fromEntries(
        evaluatedRows.map((row) => [row.workerId, row])
      )
    ),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    nativeCleanupEvidenceIds: freezeArray(data.nativeCleanupEvidenceIds),
    cleanupBlockerIds: freezeArray(data.cleanupBlockerIds),
    requiredStatuses: freezeArray(data.requiredStatuses),
    requiredFunctionNames: freezeArray(data.requiredFunctionNames),
    requiredFieldNames: freezeArray(data.requiredFieldNames),
    requiredSourceConstants: freezeArray(data.requiredSourceConstants),
    priorLedgerContext: freezeArray(data.priorLedgerContext),
    evidence: freezeArray(data.evidence)
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

function row(data) {
  return freezeRecord({
    ...data,
    sourceQueue: "821",
    ledgerEvaluationMode: "source-token-checks-and-manifest-only",
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    privateEvidenceOnly: true,
    staticReadOnlyLedger: true,
    runtimeExecutionClaimed: false,
    publicRuntimeExecutionClaimed: false,
    nativeLoadingAttempted: false,
    nativeAddonLoadAttempted: false,
    workerThreadCreationAttempted: false,
    rustExecutionAttempted: false,
    packageImportSideEffects: false,
    packageCompatibilityClaimed: false,
    packageExportCompatibilityClaimed: false,
    jsCjsBridgeClaimed: false,
    rootActSchedulerClaimed: false,
    exportsChanged: false,
    publicBlockers: freezeRecord(data.publicBlockers)
  });
}

function mergeRowOverride(baseRow, override) {
  return freezeRecord({
    ...baseRow,
    ...override,
    nativeCleanupEvidenceIds: freezeArray(
      override.nativeCleanupEvidenceIds ?? baseRow.nativeCleanupEvidenceIds
    ),
    cleanupBlockerIds: freezeArray(
      override.cleanupBlockerIds ?? baseRow.cleanupBlockerIds
    ),
    requiredStatuses: freezeArray(
      override.requiredStatuses ?? baseRow.requiredStatuses
    ),
    requiredFunctionNames: freezeArray(
      override.requiredFunctionNames ?? baseRow.requiredFunctionNames
    ),
    requiredFieldNames: freezeArray(
      override.requiredFieldNames ?? baseRow.requiredFieldNames
    ),
    requiredSourceConstants: freezeArray(
      override.requiredSourceConstants ?? baseRow.requiredSourceConstants
    ),
    priorLedgerContext: freezeArray(
      override.priorLedgerContext ?? baseRow.priorLedgerContext
    ),
    evidence: freezeArray(override.evidence ?? baseRow.evidence),
    publicBlockers: freezeRecord({
      ...baseRow.publicBlockers,
      ...(override.publicBlockers ?? {})
    })
  });
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evaluatedEvidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({
      evidenceRow,
      fileCache,
      workspaceRoot
    })
  );
  const evidenceRecognized = evaluatedEvidence.every(
    (evidenceRow) => evidenceRow.recognized === true
  );
  const nativeCleanupEvidenceRecognized = sameStringSet(
    PRIVATE_ADMISSION_821_REQUIRED_NATIVE_CLEANUP_EVIDENCE_IDS[
      row.workerId
    ] ?? [],
    row.nativeCleanupEvidenceIds
  );
  const cleanupBlockersRecognized = sameStringSet(
    PRIVATE_ADMISSION_821_REQUIRED_CLEANUP_BLOCKER_IDS[row.workerId] ?? [],
    row.cleanupBlockerIds
  );
  const statusesRecognized = sameStringSet(
    PRIVATE_ADMISSION_821_REQUIRED_STATUSES[row.workerId] ?? [],
    row.requiredStatuses
  );
  const functionNamesRecognized = sameStringSet(
    PRIVATE_ADMISSION_821_REQUIRED_FUNCTION_NAMES[row.workerId] ?? [],
    row.requiredFunctionNames
  );
  const fieldNamesRecognized = sameStringSet(
    PRIVATE_ADMISSION_821_REQUIRED_FIELD_NAMES[row.workerId] ?? [],
    row.requiredFieldNames
  );
  const sourceConstantsRecognized = sameStringSet(
    PRIVATE_ADMISSION_821_REQUIRED_SOURCE_CONSTANTS[row.workerId] ?? [],
    row.requiredSourceConstants
  );
  const priorLedgerContextRecognized = sameStringSet(
    PRIVATE_ADMISSION_821_REQUIRED_PRIOR_LEDGER_CONTEXT[row.workerId] ?? [],
    row.priorLedgerContext
  );
  const publicBlockerKeysRecognized = sameStringSet(
    PRIVATE_ADMISSION_821_PUBLIC_BLOCKER_FIELDS,
    Object.keys(row.publicBlockers)
  );
  const publicBlockerViolations = Object.entries(row.publicBlockers)
    .filter(([, value]) => value !== false)
    .map(([field]) => field);
  const staticReadOnlyRecognized =
    row.sourceTokenChecksOnly === true &&
    row.manifestEvaluationOnly === true &&
    row.privateEvidenceOnly === true &&
    row.staticReadOnlyLedger === true &&
    row.runtimeExecutionClaimed === false &&
    row.publicRuntimeExecutionClaimed === false &&
    row.nativeLoadingAttempted === false &&
    row.nativeAddonLoadAttempted === false &&
    row.workerThreadCreationAttempted === false &&
    row.rustExecutionAttempted === false &&
    row.packageImportSideEffects === false &&
    row.packageCompatibilityClaimed === false &&
    row.packageExportCompatibilityClaimed === false &&
    row.jsCjsBridgeClaimed === false &&
    row.rootActSchedulerClaimed === false &&
    row.exportsChanged === false &&
    row.ledgerEvaluationMode === "source-token-checks-and-manifest-only";

  return freezeRecord({
    ...row,
    evidence: freezeArray(evaluatedEvidence),
    evidenceRecognized,
    nativeCleanupEvidenceRecognized,
    cleanupBlockersRecognized,
    statusesRecognized,
    functionNamesRecognized,
    fieldNamesRecognized,
    sourceConstantsRecognized,
    priorLedgerContextRecognized,
    publicBlockerKeysRecognized,
    publicBlockerViolations: freezeArray(publicBlockerViolations),
    staticReadOnlyRecognized,
    recognized:
      evidenceRecognized === true &&
      nativeCleanupEvidenceRecognized === true &&
      cleanupBlockersRecognized === true &&
      statusesRecognized === true &&
      functionNamesRecognized === true &&
      fieldNamesRecognized === true &&
      sourceConstantsRecognized === true &&
      priorLedgerContextRecognized === true &&
      publicBlockerKeysRecognized === true &&
      publicBlockerViolations.length === 0 &&
      staticReadOnlyRecognized === true
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const source = readWorkspaceFile({
    fileCache,
    workspaceRoot,
    path: evidenceRow.path
  });
  const slice = sliceSource({
    sourceText: source.text,
    sourceOk: source.ok,
    sliceStart: evidenceRow.sliceStart,
    sliceEnd: evidenceRow.sliceEnd
  });
  const tokenResults = evidenceRow.tokens.map((token) =>
    freezeRecord({
      token,
      present: slice.text.includes(token)
    })
  );
  const forbiddenTokenResults = evidenceRow.forbiddenTokens.map((token) =>
    freezeRecord({
      token,
      present: slice.text.includes(token)
    })
  );
  const missingTokens = tokenResults
    .filter((tokenResult) => tokenResult.present !== true)
    .map((tokenResult) => tokenResult.token);
  const forbiddenTokensPresent = forbiddenTokenResults
    .filter((tokenResult) => tokenResult.present === true)
    .map((tokenResult) => tokenResult.token);

  return freezeRecord({
    ...evidenceRow,
    tokenResults: freezeArray(tokenResults),
    forbiddenTokenResults: freezeArray(forbiddenTokenResults),
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    recognized:
      source.ok === true &&
      slice.ok === true &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0,
    readError: source.error,
    sliceError: slice.error
  });
}

function sliceSource({ sourceText, sourceOk, sliceStart, sliceEnd }) {
  if (sourceOk !== true || sliceStart === null) {
    return freezeRecord({ ok: sourceOk === true, text: sourceText, error: null });
  }

  const startIndex = sourceText.indexOf(sliceStart);
  if (startIndex === -1) {
    return freezeRecord({
      ok: false,
      text: "",
      error: `missing-slice-start:${sliceStart}`
    });
  }

  if (sliceEnd === null) {
    return freezeRecord({
      ok: true,
      text: sourceText.slice(startIndex),
      error: null
    });
  }

  const endIndex = sourceText.indexOf(
    sliceEnd,
    startIndex + sliceStart.length
  );
  if (endIndex === -1) {
    return freezeRecord({
      ok: false,
      text: "",
      error: `missing-slice-end:${sliceEnd}`
    });
  }

  return freezeRecord({
    ok: true,
    text: sourceText.slice(startIndex, endIndex),
    error: null
  });
}

function readWorkspaceFile({ fileCache, workspaceRoot, path }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  let source;
  try {
    source = freezeRecord({
      ok: true,
      text: readFileSync(join(workspaceRoot, path), "utf8"),
      error: null
    });
  } catch (error) {
    source = freezeRecord({
      ok: false,
      text: "",
      error: `${error.name}: ${error.message}`
    });
  }
  fileCache.set(path, source);
  return source;
}

function compareRequiredArrayByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId] ?? [];
    const actual = row[actualKey] ?? [];
    if (sameStringSet(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: freezeArray(expected),
        [actualKeyForViolation]: freezeArray(actual)
      })
    ];
  });
}

function filterClaimIds(claimIds, fieldNames) {
  const fieldNameSet = new Set(fieldNames);
  return claimIds.filter((claimId) => {
    const [, field] = claimId.split(".");
    return fieldNameSet.has(field);
  });
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

function pushClaimIdsViolation(violations, id, claimIds) {
  if (claimIds.length > 0) {
    violations.push(
      createViolation(id, { claimIds: freezeArray(claimIds) })
    );
  }
}

function falseRecord(keys) {
  return freezeRecord(Object.fromEntries(keys.map((key) => [key, false])));
}

function sameStringSet(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function createViolation(id, fields) {
  return freezeRecord({
    id,
    ...fields
  });
}

function freezeArray(value) {
  return Object.freeze([...value]);
}

function freezeRecord(value) {
  return Object.freeze(value);
}
