import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

const sourceTokenPolicy =
  "source-owned-identifiers-statuses-functions-fields-and-constants";
const rootBridgePath = "packages/react-dom/src/client/root-bridge.js";
const hydrationBoundaryGatePath =
  "packages/react-dom/src/client/hydration-boundary-gate.js";
const worker828 = "worker-828-hydrateroot-text-claim-patch-bridge-execution";

export const PRIVATE_ADMISSION_849_LEDGER_ID =
  "private-admission-849-hydrateroot-text-patch-ledger-1";
export const PRIVATE_ADMISSION_849_LEDGER_STATUS =
  "recognized-worker-828-hydrateroot-text-claim-patch-bridge-execution-public-blocked";
export const PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS =
  "blocked-worker-828-hydrateroot-text-claim-patch-bridge-execution-with-violations";

export const PRIVATE_ADMISSION_849_WORKERS = freezeArray([worker828]);

export const PRIVATE_ADMISSION_849_ROW_CONTRACTS = freezeRecord({
  [worker828]: freezeRecord({
    workerId: worker828,
    ledgerRowId:
      "worker-828-hydrateroot-text-claim-patch-bridge-execution-admission",
    ledgerRole: "accepted-hydrateroot-text-claim-patch-bridge-execution",
    privateAdmission:
      "accepted-private-hydrateroot-post-preflight-text-claim-patch-execution",
    sourceQueue: "849",
    sourceWorkerId: worker828
  })
});

export const PRIVATE_ADMISSION_849_REQUIRED_OPERATION_IDS = freezeRecord({
  [worker828]: freezeArray([
    "hydrate-root-execution-preflight",
    "hydrate-root-text-node-claim-patch-execution",
    "hydration-text-node-claim-patch-execution"
  ])
});

export const PRIVATE_ADMISSION_849_REQUIRED_STATUS_IDS = freezeRecord({
  [worker828]: freezeArray([
    "ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_EXECUTION_PREFLIGHTED",
    "preflighted-private-hydrate-root-public-facade-execution-gate",
    "ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_TEXT_NODE_CLAIM_PATCH_EXECUTED",
    "executed-private-hydrate-root-public-facade-text-node-claim-patch",
    "ROOT_BRIDGE_EXECUTION_BLOCKED",
    "blocked-private-root-bridge-execution",
    "ROOT_BRIDGE_COMPATIBILITY_BLOCKED",
    "blocked-private-root-bridge-compatibility",
    "privateHydrationTextNodeClaimPatchExecutionStatus",
    "executed-private-hydration-text-node-claim-patch",
    "HYDRATION_TEXT_MISMATCH_BLOCKED_REASON",
    "FAST_REACT_DOM_HYDRATION_TEXT_MISMATCH_BLOCKED"
  ])
});

export const PRIVATE_ADMISSION_849_REQUIRED_RECORD_TYPES = freezeRecord({
  [worker828]: freezeArray([
    "privateHydrateRootPublicFacadeExecutionPreflightRecordType",
    "fast.react_dom.private_hydrate_root_public_facade_execution_preflight_record",
    "FastReactDomPrivateHydrateRootPublicFacadeExecutionPreflightRecord",
    "privateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecordType",
    "fast.react_dom.private_hydrate_root_public_facade_text_node_claim_patch_execution_record",
    "FastReactDomPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord",
    "HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_RECORD_KIND",
    "FastReactDomHydrationTextNodeClaimPatchExecutionRecord"
  ])
});

export const PRIVATE_ADMISSION_849_REQUIRED_FUNCTION_NAMES = freezeRecord({
  [worker828]: freezeArray([
    "createPrivateHydrateRootPublicFacadeExecutionPreflightRecord",
    "createPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord",
    "assertPrivateHydrateRootPublicFacadeExecutionPreflightRecordForTextNodeClaimPatch",
    "normalizeHydrateRootTextNodeClaimPatchExecutionOptions",
    "assertHydrateRootTextNodeClaimPatchExecutionRecord",
    "hasHydrateRootTextNodeClaimPatchPublicClaim",
    "getPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionPayload",
    "isPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord",
    "createHydrationTextNodeClaimPatchExecutionRecord",
    "validateHydrationTextNodeClaimPatchExecution",
    "validateHydrationTextNodeClaimPatchAcceptedBoundaryMetadata",
    "validateHydrationTextNodeClaimPatchMismatchMetadata",
    "resolveHydrationTextNodeClaimPatchMismatchRow",
    "validateHydrationTextNodeClaimPatchTarget",
    "isPrivateFakeHydrationTextNode",
    "applyHydrationTextNodeClaimPatch",
    "getPrivateHydrationTextNodeClaimPatchExecutionPayload",
    "isPrivateHydrationTextNodeClaimPatchExecutionRecord"
  ])
});

export const PRIVATE_ADMISSION_849_REQUIRED_FIELD_NAMES = freezeRecord({
  [worker828]: freezeArray([
    "preflightExecution",
    "postPreflightExecution",
    "textNodeClaimPatchExecutionRecords",
    "textNodeClaimPatchExecutionRecordsByExecutionPreflight",
    "nextTextNodeClaimPatchExecutionSequence",
    "executionPreflightBoundary",
    "executionPreflightRequired",
    "executionPreflightAccepted",
    "executionPreflightConsumed",
    "privateExecutionPreflight",
    "privateExecution",
    "currentStateMatchesExecutionPreflight",
    "eventReplayPreflightRequired",
    "eventReplayPreflightAccepted",
    "replayExecutionPayloadAccepted",
    "canonicalTextNodeClaimPatchExecution",
    "textNodeClaimPatchExecutionRecordImmutable",
    "hydrationOptionsOwned",
    "acceptedBoundaryMetadataConsumed",
    "acceptedBoundaryMetadataDiagnostics",
    "acceptedBoundaryMetadataRow",
    "rootRecordId",
    "hydrationBoundaryRecord",
    "hydrationOptions",
    "initialChildren",
    "mismatchRow",
    "textNodeClaimPatchOptions",
    "executionPayload",
    "requestRecord",
    "fakeTextNodeMarkerAccepted",
    "fakeTextNodeConstructorName",
    "fakeTextNodeClaimed",
    "fakeTextNodePatched",
    "textNodeClaimRecorded",
    "textNodeClaimExecuted",
    "textPatchAdmitted",
    "textPatchApplied",
    "textPatched",
    "patchWriteCount",
    "patchWriteProperty",
    "patchWrites",
    "claimedTextNode",
    "claimedTextNodeResolution",
    "claimLabel",
    "__fastReactFakeHydrationTextNode"
  ])
});

export const PRIVATE_ADMISSION_849_REQUIRED_CAPABILITY_IDS = freezeRecord({
  [worker828]: freezeArray([
    "hydrate-root-execution-preflight-required",
    "hydrate-root-text-node-claim-patch-execution-record",
    "hydrate-root-text-node-claim-patch-options-owned",
    "hydrate-root-text-node-claim-patch-state-unchanged",
    "public-hydrate-root-execution",
    "public-root-object",
    "native-execution",
    "reconciler-execution",
    "browser-dom-mutation",
    "marker-writes",
    "listener-installation",
    "hydration",
    "events",
    "recoverable-error-callbacks",
    "compatibility-claims"
  ])
});

export const PRIVATE_ADMISSION_849_REQUIRED_REQUIREMENTS = freezeRecord({
  [worker828]: freezeRecord({
    hydrateRootExecutionPreflightBoundary: true,
    postPreflightExecutionBridge: true,
    oneShotExecutionPreflightConsumption: true,
    fakeTextOwnershipGate: true,
    sameBoundaryAndOptionsLinkage: true,
    acceptedBoundaryMetadataConsumed: true,
    textClaimPatchExecutionAccepted: true,
    publicHydrateRootBlocked: true,
    publicRootObjectBlocked: true,
    nativeExecutionBlocked: true,
    reconcilerExecutionBlocked: true,
    browserDomMutationBlocked: true,
    listenerInstallationBlocked: true,
    eventReplayDispatchBlocked: true,
    recoverableCallbackBlocked: true,
    packageCompatibilityBlocked: true,
    staticReadOnlyLedger: true
  })
});

export const PRIVATE_ADMISSION_849_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicHydrateRootEnabled",
  "publicHydrateRootSupported",
  "publicHydrationCompatibilityClaimed",
  "publicHydrationReplayCompatibilityClaimed",
  "hydration",
  "hydrationCompatibilityClaimed",
  "canHydrate",
  "hydrateInstanceCalled",
  "hydrateTextInstanceCalled",
  "hostInstanceHydrationAttempted",
  "diffHydratedTextForDevWarningsCalled",
  "publicRootCreated",
  "publicRootExecution",
  "publicRootObjectExposed",
  "publicRootCompatibilitySurface",
  "rootScheduled",
  "suspenseHydrationScheduled",
  "nativeExecution",
  "reconcilerExecution",
  "containerMarked",
  "domMutated",
  "domMutation",
  "browserDomMutated",
  "markerWrites",
  "listenerInstallation",
  "listenersAttached",
  "eventDispatch",
  "eventReplayInstalled",
  "eventReplaySupported",
  "hydrationReplaySupported",
  "eventsReplayed",
  "replayQueueDrained",
  "replayQueuesDrained",
  "targetDispatchExecuted",
  "eventReplayDispatchAttempted",
  "pluginDispatchEventForPluginEventSystemCalled",
  "nativeEventRedispatched",
  "syntheticEventCreated",
  "listenerInvocationCount",
  "willInvokeListeners",
  "recoverableErrorsQueued",
  "willQueueRecoverableErrors",
  "onRecoverableErrorInvoked",
  "publicOnRecoverableErrorInvoked",
  "rootErrorCallbacksInvoked",
  "publicRootErrorCallbacksInvoked",
  "rootErrorCallbackInvocationCount",
  "rootErrorUpdatesScheduled",
  "reportGlobalErrorInvoked",
  "browserDomEventCompatibilityClaimed",
  "compatibilityClaimed",
  "packageCompatibilityClaimed",
  "packageExportsChanged"
]);

const privateAdmission849Rows = freezeArray([
  rowData({
    ...PRIVATE_ADMISSION_849_ROW_CONTRACTS[worker828],
    implementationPaths: freezeArray([rootBridgePath, hydrationBoundaryGatePath]),
    operationIds: PRIVATE_ADMISSION_849_REQUIRED_OPERATION_IDS[worker828],
    statusIds: PRIVATE_ADMISSION_849_REQUIRED_STATUS_IDS[worker828],
    recordTypes: PRIVATE_ADMISSION_849_REQUIRED_RECORD_TYPES[worker828],
    functionNames: PRIVATE_ADMISSION_849_REQUIRED_FUNCTION_NAMES[worker828],
    fieldNames: PRIVATE_ADMISSION_849_REQUIRED_FIELD_NAMES[worker828],
    capabilityIds: PRIVATE_ADMISSION_849_REQUIRED_CAPABILITY_IDS[worker828],
    requirements: PRIVATE_ADMISSION_849_REQUIRED_REQUIREMENTS[worker828],
    evidence: [
      evidenceData({
        role: "worker-828-root-bridge-record-type-status-source",
        path: rootBridgePath,
        sliceStart: "const privateHydrateRootPublicFacadeExecutionPreflightRecordType",
        sliceEnd: "const ROOT_BRIDGE_LIVE_CONTAINER_PREFLIGHT_BLOCKED",
        tokensByKind: {
          constants: [
            "privateHydrateRootPublicFacadeExecutionPreflightRecordType",
            "privateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecordType",
            "ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_EXECUTION_PREFLIGHTED",
            "ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_TEXT_NODE_CLAIM_PATCH_EXECUTED",
            "ROOT_BRIDGE_EXECUTION_BLOCKED",
            "ROOT_BRIDGE_COMPATIBILITY_BLOCKED"
          ],
          recordTypes: [
            "fast.react_dom.private_hydrate_root_public_facade_execution_preflight_record",
            "fast.react_dom.private_hydrate_root_public_facade_text_node_claim_patch_execution_record"
          ],
          statusIds: [
            "preflighted-private-hydrate-root-public-facade-execution-gate",
            "executed-private-hydrate-root-public-facade-text-node-claim-patch",
            "blocked-private-root-bridge-execution",
            "blocked-private-root-bridge-compatibility"
          ]
        }
      }),
      evidenceData({
        role: "worker-828-root-bridge-text-patch-capability-source",
        path: rootBridgePath,
        sliceStart:
          "const ROOT_BRIDGE_HYDRATE_ROOT_TEXT_NODE_CLAIM_PATCH_ACCEPTED_CAPABILITIES",
        sliceEnd:
          "const HYDRATION_BOUNDARY_ACCEPTED_METADATA_BLOCKED_PUBLIC_FIELDS",
        tokensByKind: {
          constants: [
            "ROOT_BRIDGE_HYDRATE_ROOT_TEXT_NODE_CLAIM_PATCH_ACCEPTED_CAPABILITIES",
            "ROOT_BRIDGE_HYDRATE_ROOT_TEXT_NODE_CLAIM_PATCH_BLOCKED_CAPABILITIES"
          ],
          capabilityIds: PRIVATE_ADMISSION_849_REQUIRED_CAPABILITY_IDS[
            worker828
          ]
        }
      }),
      evidenceData({
        role: "worker-828-root-bridge-preflight-method-source",
        path: rootBridgePath,
        sliceStart: "function createPrivateHydrateRootPublicFacadePreflight(options)",
        sliceEnd: "function createPrivateHydrateRootPublicFacadePreflightRecord",
        tokensByKind: {
          functionNames: [
            "preflightExecution",
            "postPreflightExecution",
            "createPrivateHydrateRootPublicFacadeExecutionPreflightRecord",
            "createPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord"
          ],
          fieldNames: [
            "textNodeClaimPatchExecutionRecords",
            "textNodeClaimPatchExecutionRecordsByExecutionPreflight",
            "nextTextNodeClaimPatchExecutionSequence"
          ]
        }
      }),
      evidenceData({
        role: "worker-828-root-bridge-execution-preflight-boundary-source",
        path: rootBridgePath,
        sliceStart:
          "function createPrivateHydrateRootPublicFacadeExecutionPreflightRecord",
        sliceEnd:
          "function createPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord",
        tokensByKind: {
          functionNames: [
            "createPrivateHydrateRootPublicFacadeExecutionPreflightRecord",
            "assertHydrateRootExecutionPreflightReplayExecutionRecord",
            "assertHydrateRootExecutionPreflightEvidenceBlocked"
          ],
          operationIds: ["hydrate-root-execution-preflight"],
          recordTypes: [
            "FastReactDomPrivateHydrateRootPublicFacadeExecutionPreflightRecord"
          ],
          fieldNames: [
            "eventReplayPreflightRequired",
            "eventReplayPreflightAccepted",
            "replayExecutionPayloadAccepted",
            "executionPreflightAccepted",
            "executionPreflightBoundary",
            "privateExecutionPreflight",
            "privateExecution",
            "rootRecordId",
            "nativeExecution",
            "reconcilerExecution",
            "domMutation",
            "listenerInstallation",
            "eventDispatch",
            "recoverableErrorsQueued",
            "onRecoverableErrorInvoked",
            "compatibilityClaimed"
          ]
        }
      }),
      evidenceData({
        role: "worker-828-root-bridge-text-patch-bridge-source",
        path: rootBridgePath,
        sliceStart:
          "function createPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord",
        sliceEnd: "function normalizeHydrateRootTargetClaimingPreflightOptions",
        tokensByKind: {
          functionNames: [
            "createPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord",
            "assertPrivateHydrateRootPublicFacadeExecutionPreflightRecordForTextNodeClaimPatch",
            "normalizeHydrateRootTextNodeClaimPatchExecutionOptions",
            "assertHydrateRootTextNodeClaimPatchExecutionRecord",
            "hasHydrateRootTextNodeClaimPatchPublicClaim"
          ],
          operationIds: ["hydrate-root-text-node-claim-patch-execution"],
          recordTypes: [
            "FastReactDomPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord"
          ],
          fieldNames: [
            "textNodeClaimPatchExecutionRecordsByExecutionPreflight",
            "executionPreflightRequired",
            "executionPreflightAccepted",
            "executionPreflightConsumed",
            "currentStateMatchesExecutionPreflight",
            "canonicalTextNodeClaimPatchExecution",
            "textNodeClaimPatchExecutionRecordImmutable",
            "hydrationOptionsOwned",
            "acceptedBoundaryMetadataConsumed",
            "acceptedBoundaryMetadataDiagnostics",
            "acceptedBoundaryMetadataRow",
            "rootRecordId",
            "hydrationOptions",
            "initialChildren",
            "mismatchRow",
            "textNodeClaimPatchOptions",
            "executionPayload",
            "requestRecord",
            "fakeTextNodeClaimed",
            "fakeTextNodePatched",
            "textNodeClaimRecorded",
            "textNodeClaimExecuted",
            "textPatchAdmitted",
            "textPatchApplied",
            "textPatched",
            "publicHydrateRootSupported",
            "publicRootObjectExposed",
            "nativeExecution",
            "reconcilerExecution",
            "domMutation",
            "listenerInstallation",
            "eventReplayInstalled",
            "recoverableErrorsQueued",
            "onRecoverableErrorInvoked",
            "compatibilityClaimed"
          ]
        }
      }),
      evidenceData({
        role: "worker-828-root-bridge-payload-getter-source",
        path: rootBridgePath,
        sliceStart:
          "function getPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionPayload",
        sliceEnd: "function getPrivateRootLiveContainerPreflightPayload",
        tokensByKind: {
          functionNames: [
            "getPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionPayload",
            "isPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord"
          ]
        }
      }),
      evidenceData({
        role: "worker-828-hydration-gate-text-patch-constant-source",
        path: hydrationBoundaryGatePath,
        sliceStart: "const HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_RECORD_KIND",
        sliceEnd: "const privateHydrationBoundaryRecordType",
        tokensByKind: {
          constants: [
            "HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_RECORD_KIND",
            "HYDRATION_TEXT_MISMATCH_BLOCKED_REASON",
            "privateHydrationTextNodeClaimPatchExecutionGateId",
            "privateHydrationTextNodeClaimPatchExecutionStatus",
            "privateHydrationTextNodeClaimPatchMetadataId"
          ],
          recordTypes: ["FastReactDomHydrationTextNodeClaimPatchExecutionRecord"],
          statusIds: [
            "executed-private-hydration-text-node-claim-patch",
            "FAST_REACT_DOM_HYDRATION_TEXT_MISMATCH_BLOCKED"
          ]
        }
      }),
      evidenceData({
        role: "worker-828-hydration-gate-text-patch-record-source",
        path: hydrationBoundaryGatePath,
        sliceStart:
          "function createHydrationTextNodeClaimPatchExecutionRecord",
        sliceEnd:
          "function assertHydrationClaimedReplayTargetDispatchExecutionClaim",
        tokensByKind: {
          constants: [
            "HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_RECORD_KIND",
            "privateHydrationTextNodeClaimPatchExecutionGateId",
            "privateHydrationTextNodeClaimPatchExecutionStatus",
            "privateHydrationTextNodeClaimPatchMetadataId",
            "HYDRATION_TEXT_MISMATCH_BLOCKED_REASON"
          ],
          functionNames: [
            "createHydrationTextNodeClaimPatchExecutionRecord",
            "validateHydrationTextNodeClaimPatchExecution",
            "applyHydrationTextNodeClaimPatch",
            "getPrivateHydrationTextNodeClaimPatchExecutionPayload",
            "isPrivateHydrationTextNodeClaimPatchExecutionRecord"
          ],
          operationIds: ["hydration-text-node-claim-patch-execution"],
          fieldNames: [
            "acceptedBoundaryMetadataConsumed",
            "acceptedBoundaryMetadataDiagnostics",
            "acceptedBoundaryMetadataRow",
            "hydrationBoundaryRecord",
            "hydrationOptions",
            "initialChildren",
            "mismatchRow",
            "recoverableErrorMetadata",
            "textMismatchDiagnostics",
            "fakeTextNodeMarkerAccepted",
            "fakeTextNodeConstructorName",
            "fakeTextNodeClaimed",
            "fakeTextNodePatched",
            "textNodeClaimRecorded",
            "textNodeClaimExecuted",
            "textPatchAdmitted",
            "textPatchApplied",
            "textPatched",
            "patchWriteCount",
            "patchWriteProperty",
            "patchWrites",
            "claimLabel",
            "publicHydrateRootSupported",
            "publicRootExecution",
            "publicRootObjectExposed",
            "publicRootCreated",
            "nativeExecution",
            "reconcilerExecution",
            "rootScheduled",
            "hydration",
            "canHydrate",
            "hostInstanceHydrationAttempted",
            "hydrateTextInstanceCalled",
            "diffHydratedTextForDevWarningsCalled",
            "domMutation",
            "browserDomMutated",
            "listenerInstallation",
            "eventDispatch",
            "eventReplayInstalled",
            "eventsReplayed",
            "replayQueuesDrained",
            "recoverableErrorsQueued",
            "onRecoverableErrorInvoked",
            "publicOnRecoverableErrorInvoked",
            "compatibilityClaimed",
            "publicHydrationCompatibilityClaimed",
            "publicHydrationReplayCompatibilityClaimed",
            "browserDomEventCompatibilityClaimed"
          ]
        }
      }),
      evidenceData({
        role: "worker-828-hydration-gate-fake-text-ownership-source",
        path: hydrationBoundaryGatePath,
        sliceStart: "function validateHydrationTextNodeClaimPatchExecution",
        sliceEnd:
          "function throwInvalidHydrationTextNodeClaimPatchExecution",
        tokensByKind: {
          functionNames: [
            "validateHydrationTextNodeClaimPatchExecution",
            "validateHydrationTextNodeClaimPatchAcceptedBoundaryMetadata",
            "validateHydrationTextNodeClaimPatchMismatchMetadata",
            "resolveHydrationTextNodeClaimPatchMismatchRow",
            "validateHydrationTextNodeClaimPatchTarget",
            "isPrivateFakeHydrationTextNode",
            "getHydrationTextNodeConstructorName",
            "applyHydrationTextNodeClaimPatch"
          ],
          fieldNames: [
            "claimedTextNode",
            "claimedTextNodeResolution",
            "fakeTextNodeMarkerAccepted",
            "fakeTextNodeConstructorName",
            "__fastReactFakeHydrationTextNode",
            "actualPath",
            "expectedText",
            "actualText",
            "willPatchText",
            "domMutated",
            "patchWriteCount",
            "patchWriteProperty",
            "patchWrites"
          ],
          durableIds: ["PrivateHostOutputText"]
        }
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_849_REQUIRED_EVIDENCE_ROLES = freezeRecord({
  [worker828]: freezeArray(
    privateAdmission849Rows[0].evidence.map((evidenceRow) => evidenceRow.role)
  )
});

export const PRIVATE_ADMISSION_849_ROWS = freezeArray(
  privateAdmission849Rows.map((sourceRow) =>
    row({
      ...sourceRow,
      publicBlockers: falseRecord(PRIVATE_ADMISSION_849_PUBLIC_BLOCKER_FIELDS)
    })
  )
);

export function evaluatePrivateAdmission849HydrateRootTextPatchLedger({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  compatibilityClaimed = false,
  publicCompatibilityClaimed = false
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_849_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((row) => row.workerId);
  const manifest = freezeRecord({
    expectedWorkerIds: PRIVATE_ADMISSION_849_WORKERS,
    actualWorkerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_849_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_849_WORKERS.includes(workerId)
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
          invalidTokens: evidenceRow.invalidTokens,
          unsupportedTokenKinds: evidenceRow.unsupportedTokenKinds,
          sourcePathAllowed: evidenceRow.sourcePathAllowed,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError,
          sliceError: evidenceRow.sliceError
        })
      )
  );
  const brittleEvidenceRows = evidenceMismatches.filter(
    (evidenceRow) =>
      evidenceRow.sourcePathAllowed !== true ||
      evidenceRow.invalidTokens.length > 0 ||
      evidenceRow.unsupportedTokenKinds.length > 0
  );
  const evidenceRoleMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_849_REQUIRED_EVIDENCE_ROLES,
    actualKey: "evidenceRoles",
    expectedKey: "expectedEvidenceRoles",
    actualKeyForViolation: "actualEvidenceRoles"
  });
  const operationMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_849_REQUIRED_OPERATION_IDS,
    actualKey: "operationIds",
    expectedKey: "expectedOperationIds",
    actualKeyForViolation: "actualOperationIds"
  });
  const statusMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_849_REQUIRED_STATUS_IDS,
    actualKey: "statusIds",
    expectedKey: "expectedStatusIds",
    actualKeyForViolation: "actualStatusIds"
  });
  const recordTypeMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_849_REQUIRED_RECORD_TYPES,
    actualKey: "recordTypes",
    expectedKey: "expectedRecordTypes",
    actualKeyForViolation: "actualRecordTypes"
  });
  const functionNameMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_849_REQUIRED_FUNCTION_NAMES,
    actualKey: "functionNames",
    expectedKey: "expectedFunctionNames",
    actualKeyForViolation: "actualFunctionNames"
  });
  const fieldNameMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_849_REQUIRED_FIELD_NAMES,
    actualKey: "fieldNames",
    expectedKey: "expectedFieldNames",
    actualKeyForViolation: "actualFieldNames"
  });
  const capabilityMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_849_REQUIRED_CAPABILITY_IDS,
    actualKey: "capabilityIds",
    expectedKey: "expectedCapabilityIds",
    actualKeyForViolation: "actualCapabilityIds"
  });
  const requirementMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_849_REQUIRED_REQUIREMENTS,
    actualKey: "requirements",
    expectedKey: "expectedRequirements",
    actualKeyForViolation: "actualRequirements"
  });
  const rowContractMismatches = evaluatedRows.flatMap((row) => {
    const expected = PRIVATE_ADMISSION_849_ROW_CONTRACTS[row.workerId];
    const actual = rowContract(row);
    if (expected !== undefined && sameScalarRecord(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedContract: expected ?? null,
        actualContract: actual
      })
    ];
  });
  const publicBlockerKeyMismatches = evaluatedRows.flatMap((row) => {
    const actualKeys = Object.keys(row.publicBlockers);
    if (sameStringSet(PRIVATE_ADMISSION_849_PUBLIC_BLOCKER_FIELDS, actualKeys)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicBlockerFields:
          PRIVATE_ADMISSION_849_PUBLIC_BLOCKER_FIELDS,
        actualPublicBlockerFields: freezeArray(actualKeys)
      })
    ];
  });
  const publicBlockerViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockers)
      .filter(([, value]) => value !== false && value !== 0)
      .map(([field]) => `${row.workerId}.${field}`)
  );
  const rowCompatibilityClaimIds = evaluatedRows.flatMap((row) =>
    row.compatibilityClaimed === false ? [] : [`${row.workerId}.compatibilityClaimed`]
  );
  const rowPublicCompatibilityClaimIds = evaluatedRows.flatMap((row) =>
    row.publicCompatibilityClaimed === false
      ? []
      : [`${row.workerId}.publicCompatibilityClaimed`]
  );
  const staticReadOnlyViolations = evaluatedRows
    .filter((row) => row.staticReadOnlyRecognized !== true)
    .map((row) => row.workerId);
  const topLevelCompatibilityClaimIds = [];
  if (compatibilityClaimed !== false) {
    topLevelCompatibilityClaimIds.push("ledger.compatibilityClaimed");
  }
  if (publicCompatibilityClaimed !== false) {
    topLevelCompatibilityClaimIds.push("ledger.publicCompatibilityClaimed");
  }

  const publicHydrationClaimIds = filterClaimIds(publicBlockerViolations, [
    "publicHydrateRootEnabled",
    "publicHydrateRootSupported",
    "publicHydrationCompatibilityClaimed",
    "publicHydrationReplayCompatibilityClaimed",
    "hydration",
    "hydrationCompatibilityClaimed",
    "canHydrate",
    "hydrateInstanceCalled",
    "hydrateTextInstanceCalled",
    "hostInstanceHydrationAttempted",
    "diffHydratedTextForDevWarningsCalled"
  ]);
  const publicRootClaimIds = filterClaimIds(publicBlockerViolations, [
    "publicRootCreated",
    "publicRootExecution",
    "publicRootObjectExposed",
    "publicRootCompatibilitySurface",
    "rootScheduled",
    "suspenseHydrationScheduled"
  ]);
  const nativeReconcilerClaimIds = filterClaimIds(publicBlockerViolations, [
    "nativeExecution",
    "reconcilerExecution"
  ]);
  const browserDomMutationClaimIds = filterClaimIds(publicBlockerViolations, [
    "containerMarked",
    "domMutated",
    "domMutation",
    "browserDomMutated",
    "markerWrites"
  ]);
  const listenerEventReplayClaimIds = filterClaimIds(publicBlockerViolations, [
    "listenerInstallation",
    "listenersAttached",
    "eventDispatch",
    "eventReplayInstalled",
    "eventReplaySupported",
    "hydrationReplaySupported",
    "eventsReplayed",
    "replayQueueDrained",
    "replayQueuesDrained",
    "targetDispatchExecuted",
    "eventReplayDispatchAttempted",
    "pluginDispatchEventForPluginEventSystemCalled",
    "nativeEventRedispatched",
    "syntheticEventCreated",
    "listenerInvocationCount",
    "willInvokeListeners"
  ]);
  const recoverableCallbackClaimIds = filterClaimIds(
    publicBlockerViolations,
    [
      "recoverableErrorsQueued",
      "willQueueRecoverableErrors",
      "onRecoverableErrorInvoked",
      "publicOnRecoverableErrorInvoked",
      "rootErrorCallbacksInvoked",
      "publicRootErrorCallbacksInvoked",
      "rootErrorCallbackInvocationCount",
      "rootErrorUpdatesScheduled",
      "reportGlobalErrorInvoked"
    ]
  );
  const packageCompatibilityClaimIds = filterClaimIds(publicBlockerViolations, [
    "browserDomEventCompatibilityClaimed",
    "compatibilityClaimed",
    "packageCompatibilityClaimed",
    "packageExportsChanged"
  ]);

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("private-admission-849-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-849-row-contract-mismatch",
    rowContractMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-required-evidence-mismatch",
    evidenceRoleMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-evidence-token-missing",
    evidenceMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-brittle-evidence-detected",
    brittleEvidenceRows
  );
  pushRowsViolation(
    violations,
    "private-admission-849-operation-id-mismatch",
    operationMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-status-id-mismatch",
    statusMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-record-type-mismatch",
    recordTypeMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-function-name-mismatch",
    functionNameMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-field-name-mismatch",
    fieldNameMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-capability-id-mismatch",
    capabilityMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-requirement-mismatch",
    requirementMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-849-public-blocker-field-mismatch",
    publicBlockerKeyMismatches
  );
  pushClaimIdsViolation(
    violations,
    "hydrate-root-public-hydration-claim-detected",
    publicHydrationClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "hydrate-root-public-root-claim-detected",
    publicRootClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "hydrate-root-native-reconciler-claim-detected",
    nativeReconcilerClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "hydrate-root-browser-dom-mutation-claim-detected",
    browserDomMutationClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "hydrate-root-listener-event-replay-claim-detected",
    listenerEventReplayClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "hydrate-root-recoverable-callback-claim-detected",
    recoverableCallbackClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "hydrate-root-package-compatibility-claim-detected",
    packageCompatibilityClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-849-public-claim-detected",
    publicBlockerViolations
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-849-compatibility-claim-detected",
    [
      ...rowCompatibilityClaimIds,
      ...rowPublicCompatibilityClaimIds,
      ...topLevelCompatibilityClaimIds
    ]
  );
  pushIdsViolation(
    violations,
    "private-admission-849-static-ledger-mode-mismatch",
    staticReadOnlyViolations
  );

  const evidenceRecognized =
    evidenceMismatches.length === 0 && evidenceRoleMismatches.length === 0;
  const operationIdsRecognized = operationMismatches.length === 0;
  const statusIdsRecognized = statusMismatches.length === 0;
  const recordTypesRecognized = recordTypeMismatches.length === 0;
  const functionNamesRecognized = functionNameMismatches.length === 0;
  const fieldNamesRecognized = fieldNameMismatches.length === 0;
  const capabilityIdsRecognized = capabilityMismatches.length === 0;
  const requirementsRecognized = requirementMismatches.length === 0;
  const rowContractsRecognized = rowContractMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerViolations.length === 0 &&
    publicBlockerKeyMismatches.length === 0 &&
    rowCompatibilityClaimIds.length === 0 &&
    rowPublicCompatibilityClaimIds.length === 0;
  const staticReadOnlyRecognized =
    staticReadOnlyViolations.length === 0 &&
    topLevelCompatibilityClaimIds.length === 0;
  const manifestRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0;
  const privateAdmissionRecognized =
    manifestRecognized &&
    rowContractsRecognized &&
    evidenceRecognized &&
    operationIdsRecognized &&
    statusIdsRecognized &&
    recordTypesRecognized &&
    functionNamesRecognized &&
    fieldNamesRecognized &&
    capabilityIdsRecognized &&
    requirementsRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized;
  const publicCompatibilityClaimedValue =
    publicCompatibilityClaimed !== false ||
    rowPublicCompatibilityClaimIds.length > 0 ||
    publicBlockerViolations.length > 0;
  const compatibilityClaimedValue =
    compatibilityClaimed !== false ||
    publicCompatibilityClaimedValue ||
    rowCompatibilityClaimIds.length > 0;

  return freezeRecord({
    ledgerId: PRIVATE_ADMISSION_849_LEDGER_ID,
    status: privateAdmissionRecognized
      ? PRIVATE_ADMISSION_849_LEDGER_STATUS
      : PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS,
    privateAdmissionRecognized,
    manifestRecognized,
    rowContractsRecognized,
    evidenceRecognized,
    operationIdsRecognized,
    statusIdsRecognized,
    recordTypesRecognized,
    functionNamesRecognized,
    fieldNamesRecognized,
    capabilityIdsRecognized,
    requirementsRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed: compatibilityClaimedValue,
    publicCompatibilityClaimed: publicCompatibilityClaimedValue,
    queueWorkers: PRIVATE_ADMISSION_849_WORKERS,
    recognizedWorkerIds: freezeArray(evaluatedRows.map((row) => row.workerId)),
    rows: freezeArray(evaluatedRows),
    rowsByWorker: freezeRecord(
      Object.fromEntries(evaluatedRows.map((row) => [row.workerId, row]))
    ),
    manifest,
    evidenceMismatchRows: freezeArray(evidenceMismatches),
    brittleEvidenceRows: freezeArray(brittleEvidenceRows),
    publicBlockerClaimIds: freezeArray(publicBlockerViolations),
    publicHydrationClaimIds: freezeArray(publicHydrationClaimIds),
    publicRootClaimIds: freezeArray(publicRootClaimIds),
    nativeReconcilerClaimIds: freezeArray(nativeReconcilerClaimIds),
    browserDomMutationClaimIds: freezeArray(browserDomMutationClaimIds),
    listenerEventReplayClaimIds: freezeArray(listenerEventReplayClaimIds),
    recoverableCallbackClaimIds: freezeArray(recoverableCallbackClaimIds),
    packageCompatibilityClaimIds: freezeArray(packageCompatibilityClaimIds),
    staticReadOnlyViolationIds: freezeArray(staticReadOnlyViolations),
    violations: freezeArray(violations)
  });
}

function row(sourceRow) {
  return freezeRecord({
    ...sourceRow,
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    staticReadOnlyLedger: true,
    runtimeExecutionClaimed: false,
    publicRuntimeExecutionClaimed: false,
    packageImportAttempted: false,
    packageCompatibilityClaimed: false,
    packageExportsChanged: false,
    compatibilityClaimed: false,
    publicCompatibilityClaimed: false,
    ledgerEvaluationMode: "source-token-checks-and-manifest-only"
  });
}

function rowData(sourceRow) {
  return freezeRecord({
    ...sourceRow,
    implementationPaths: freezeArray(sourceRow.implementationPaths),
    operationIds: freezeArray(sourceRow.operationIds),
    statusIds: freezeArray(sourceRow.statusIds),
    recordTypes: freezeArray(sourceRow.recordTypes),
    functionNames: freezeArray(sourceRow.functionNames),
    fieldNames: freezeArray(sourceRow.fieldNames),
    capabilityIds: freezeArray(sourceRow.capabilityIds),
    requirements: freezeRecord(sourceRow.requirements),
    evidence: freezeArray(sourceRow.evidence)
  });
}

function evidenceData({
  role,
  path,
  tokensByKind,
  forbiddenTokens = [],
  sliceStart = null,
  sliceEnd = null,
  tokenPolicy = sourceTokenPolicy
}) {
  return freezeRecord({
    role,
    path,
    tokenPolicy,
    tokensByKind: freezeTokenGroups(tokensByKind),
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
    "implementationPaths",
    "operationIds",
    "statusIds",
    "recordTypes",
    "functionNames",
    "fieldNames",
    "capabilityIds",
    "evidence"
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
  if (Object.hasOwn(override, "publicBlockers")) {
    merged.publicBlockers = freezeRecord({
      ...row.publicBlockers,
      ...override.publicBlockers
    });
  }
  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({
      evidenceRow,
      fileCache,
      workspaceRoot
    })
  );
  const staticReadOnlyRecognized =
    row.privateEvidenceOnly === true &&
    row.sourceTokenChecksOnly === true &&
    row.manifestEvaluationOnly === true &&
    row.staticReadOnlyLedger === true &&
    row.runtimeExecutionClaimed === false &&
    row.publicRuntimeExecutionClaimed === false &&
    row.packageImportAttempted === false &&
    row.packageCompatibilityClaimed === false &&
    row.packageExportsChanged === false &&
    row.compatibilityClaimed === false &&
    row.publicCompatibilityClaimed === false &&
    row.ledgerEvaluationMode === "source-token-checks-and-manifest-only";

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceRoles: freezeArray(evidence.map((evidenceRow) => evidenceRow.role)),
    evidenceRecognized: evidence.every(
      (evidenceRow) => evidenceRow.recognized === true
    ),
    staticReadOnlyRecognized
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
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

  const tokenGroups = evidenceRow.tokensByKind ?? freezeRecord({});
  const allTokens = flattenTokenGroups(tokenGroups);
  const unsupportedTokenKinds = Object.keys(tokenGroups).filter(
    (kind) => !supportedEvidenceTokenKinds.has(kind)
  );
  const invalidTokens = evidenceTokenPolicyViolations(tokenGroups);
  const sourcePathAllowed = allowedSourceEvidencePaths.has(evidenceRow.path);
  const missingTokens =
    readResult.readError === null && sliceError === null
      ? allTokens.filter((token) => !text.includes(token))
      : [...allTokens];
  const forbiddenTokensPresent =
    readResult.readError === null && sliceError === null
      ? evidenceRow.forbiddenTokens.filter((token) => text.includes(token))
      : [];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      evidenceRow.tokenPolicy === sourceTokenPolicy &&
      sourcePathAllowed === true &&
      readResult.readError === null &&
      sliceError === null &&
      missingTokens.length === 0 &&
      invalidTokens.length === 0 &&
      unsupportedTokenKinds.length === 0 &&
      forbiddenTokensPresent.length === 0,
    sourcePathAllowed,
    missingTokens: freezeArray(missingTokens),
    invalidTokens: freezeArray(invalidTokens),
    unsupportedTokenKinds: freezeArray(unsupportedTokenKinds),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    readError: readResult.readError,
    sliceError
  });
}

const allowedSourceEvidencePaths = new Set([
  rootBridgePath,
  hydrationBoundaryGatePath
]);

const supportedEvidenceTokenKinds = new Set([
  "constants",
  "functionNames",
  "fieldNames",
  "statusIds",
  "operationIds",
  "recordTypes",
  "capabilityIds",
  "durableIds"
]);

function evidenceTokenPolicyViolations(tokenGroups) {
  return freezeArray(
    Object.entries(tokenGroups).flatMap(([kind, tokens]) => {
      if (!supportedEvidenceTokenKinds.has(kind)) {
        return tokens.map((token) =>
          tokenViolation({ kind, token, reason: "unsupported-token-kind" })
        );
      }
      return tokens.flatMap((token) => {
        const reason = validateEvidenceToken({ kind, token });
        return reason === null
          ? []
          : [tokenViolation({ kind, token, reason })];
      });
    })
  );
}

function validateEvidenceToken({ kind, token }) {
  if (typeof token !== "string" || token.length === 0) {
    return "empty-token";
  }
  if (/\s/.test(token)) {
    return "prose-test-title-or-error-text";
  }
  if (/[()[\]{};=><'"`,]/.test(token)) {
    return "source-syntax-token";
  }
  if (
    /^[A-Za-z_$][A-Za-z0-9_$]*\.[A-Za-z_$][A-Za-z0-9_$]*/.test(token) &&
    !token.startsWith("fast.")
  ) {
    return "member-expression-token";
  }
  if (
    (kind === "constants" ||
      kind === "functionNames" ||
      kind === "fieldNames") &&
    !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(token)
  ) {
    return "identifier-token-required";
  }
  if (
    (kind === "statusIds" ||
      kind === "operationIds" ||
      kind === "capabilityIds") &&
    !/^(?:[a-z0-9][a-z0-9:-]*|FAST_REACT_[A-Z0-9_]+)$/.test(token)
  ) {
    return "durable-status-or-id-token-required";
  }
  if (
    kind === "recordTypes" &&
    !/^(?:[A-Z][A-Za-z0-9_]*|fast\.[a-z0-9_.]+)$/.test(token)
  ) {
    return "record-type-token-required";
  }
  if (
    kind === "durableIds" &&
    !/^(?:[A-Za-z_$][A-Za-z0-9_$]*|[a-z0-9][a-z0-9:-]*|fast\.[a-z0-9_.]+)$/.test(
      token
    )
  ) {
    return "durable-id-token-required";
  }
  return null;
}

function tokenViolation({ kind, token, reason }) {
  return freezeRecord({ kind, token, reason });
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

function compareRequiredRecordByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId] ?? freezeRecord({});
    const actual = row[actualKey] ?? freezeRecord({});
    if (sameScalarRecord(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: expected,
        [actualKeyForViolation]: actual
      })
    ];
  });
}

function rowContract(row) {
  return freezeRecord({
    workerId: row.workerId,
    ledgerRowId: row.ledgerRowId,
    ledgerRole: row.ledgerRole,
    privateAdmission: row.privateAdmission,
    sourceQueue: row.sourceQueue,
    sourceWorkerId: row.sourceWorkerId
  });
}

function filterClaimIds(claimIds, fieldNames) {
  const fieldSet = new Set(fieldNames);
  return freezeArray(
    claimIds.filter((claimId) => fieldSet.has(claimId.split(".").at(-1)))
  );
}

function createViolation(id, details = {}) {
  return freezeRecord({ id, ...details });
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

function flattenTokenGroups(tokensByKind) {
  return freezeArray(
    Object.values(tokensByKind).flatMap((tokens) => [...tokens])
  );
}

function freezeTokenGroups(tokensByKind) {
  return freezeRecord(
    Object.fromEntries(
      Object.entries(tokensByKind).map(([kind, tokens]) => [
        kind,
        freezeArray(tokens)
      ])
    )
  );
}

function falseRecord(fields) {
  return freezeRecord(Object.fromEntries(fields.map((field) => [field, false])));
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

function sameScalarRecord(expected, actual) {
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);
  return (
    sameStringSet(expectedKeys, actualKeys) &&
    expectedKeys.every((key) => Object.is(expected[key], actual[key]))
  );
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze(record);
}
