import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_808_GATE_STATUS,
  evaluatePrivateAdmission808Gate
} from "./private-admission-808-resource-form-ledger.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

const sourceTokenPolicy =
  "source-owned-identifiers-statuses-functions-fields-and-constants";
const worker829 = "worker-829-resource-root-map-storage-private-execution";
const worker830 = "worker-830-form-action-fulfilled-reset-fake-commit";

const resourceInternalsPath =
  "packages/react-dom/src/resource-form-internals-gate.js";
const formActionsPath = "packages/react-dom/src/shared/form-actions.js";
const resourceFormGatesPath = "packages/react-dom/src/resource-form-gates.js";
const reactDomPackageJsonPath = "packages/react-dom/package.json";

export const PRIVATE_ADMISSION_850_LEDGER_ID =
  "private-admission-850-resource-form-execution-ledger-1";
export const PRIVATE_ADMISSION_850_LEDGER_STATUS =
  "recognized-worker-829-830-resource-form-private-execution-public-blocked";
export const PRIVATE_ADMISSION_850_LEDGER_VIOLATION_STATUS =
  "blocked-worker-829-830-resource-form-private-execution-with-violations";

export const PRIVATE_ADMISSION_850_WORKERS = freezeArray([
  worker829,
  worker830
]);

export const PRIVATE_ADMISSION_850_REQUIRED_ACCEPTED_IDS = freezeRecord({
  [worker829]: freezeArray([
    "resource-hint-root-map-storage-private-gate-1",
    "fast.react_dom.private_resource_hint_root_map_storage_record",
    "react-19.2.6-resource-root-map-storage-private-execution",
    "react-19.2.6-resource-root-map-storage-private-execution-snapshot",
    "deterministic-private-root-map-storage-execution",
    "root-map-storage-execution-0",
    "root-map-storage-entry-0"
  ]),
  [worker830]: freezeArray([
    "form-action-fulfilled-reset-execution-private-gate-1",
    "fast.react_dom.private_form_action_fulfilled_reset_execution_record",
    "form-action-fulfilled-reset-fake-commit",
    "deterministic-private-fulfilled-action-reset-fake-commit",
    "deterministic-fake-reset-state-queue",
    "form-action-fulfilled-reset-execution.fake-commit",
    "fast.react_dom.private_form_action_fulfilled_reset_root_lifecycle_boundary_record",
    "bound-private-form-action-fulfilled-reset-root-lifecycle",
    "after-mutation-form-reset-order"
  ])
});

export const PRIVATE_ADMISSION_850_REQUIRED_STATUSES = freezeRecord({
  [worker829]: freezeArray([
    "executed-private-resource-hint-root-map-storage-record",
    "executed-private-resource-hint-deterministic-fake-root-map-storage",
    "blocked-private-resource-hint-root-map-storage-compatibility",
    "validated-private-resource-root-map-storage-execution",
    "blocked-public-resource-root-map-storage"
  ]),
  [worker830]: freezeArray([
    "private-form-action-fulfilled-reset-execution-fake-commit-only",
    "executed-private-form-action-fulfilled-reset-fake-commit-path",
    "executed-private-form-action-fulfilled-reset-state-queue-fake",
    "executed-private-form-action-fulfilled-reset-commit-fake",
    "bound-private-form-action-fulfilled-reset-root-lifecycle",
    "recorded-private-form-action-fulfilled-result-metadata",
    "blocked-public-form-action-fulfilled-reset-execution-compatibility",
    "executed-private-form-action-async-callback-fulfilled"
  ])
});

export const PRIVATE_ADMISSION_850_REQUIRED_FIELD_NAMES = freezeRecord({
  [worker829]: freezeArray([
    "rootMapStorageExecutionRows",
    "hoistableStylesRootMapExecutionRows",
    "hoistableScriptsRootMapExecutionRows",
    "rootMapStorageSnapshot",
    "rootMapStorageExecutionPlan",
    "rootResourceStorageShape",
    "expectedRootMapStorageRowIds",
    "sourceRootMapStoragePreflightId",
    "storedEntryId",
    "storedInRootMap",
    "deterministicFakeRootMapStorageOnly",
    "fakeRootMapEntryCreated",
    "fakeRootMapEntryMutated",
    "fakeRootResourceStorageMutated",
    "fakeHoistableStylesMapMutated",
    "fakeHoistableScriptsMapMutated",
    "clonedPreflightRecordRejected",
    "fakeRootStorageTargetsRejected",
    "preloadPropsMapMutated",
    "realResourceMapsMutated",
    "publicResourceMapCommitBehavior",
    "compatibilityClaimed"
  ]),
  [worker830]: freezeArray([
    "fulfilledActionResult",
    "rootExecutionBoundary",
    "fakeResetStateQueueExecution",
    "fakeResetCommitExecution",
    "sourceRootBridgeAdmissionId",
    "sourceRootLifecycleBoundaryId",
    "rootExecutionBoundaryId",
    "rootContainerInfo",
    "lifecycleRequestVersion",
    "sourceOwnedRootLifecycleBoundary",
    "fakeResetStateQueueRootExecutionBoundaryId",
    "diagnosticKind",
    "queueExecutionKind",
    "sourceFunctionNames",
    "requestUpdateLaneRecorded",
    "dispatchSetStateInternalRecorded",
    "fakeResetStateQueueExecuted",
    "fakeResetStateUpdateQueued",
    "resetQueuePendingMutated",
    "realReactUpdateQueued",
    "updateQueueCaptured",
    "afterMutationEffectsOrder",
    "fakeFormResetCommitRecorded",
    "fakeResetFormInstanceCallRecorded",
    "resetFormInstanceCalled",
    "formResetCommitted",
    "realFormReset",
    "domMutation",
    "publicFormActionBoundary",
    "reactUpdateQueued",
    "compatibilityClaimed"
  ])
});

export const PRIVATE_ADMISSION_850_REQUIRED_SOURCE_VALUES = freezeRecord({
  [worker829]: freezeRecord({
    executionKind: "deterministic-private-root-map-storage-execution",
    storageKind: "react-19.2.6-resource-root-map-storage-private-execution",
    snapshotKind:
      "react-19.2.6-resource-root-map-storage-private-execution-snapshot",
    executionStatus:
      "executed-private-resource-hint-deterministic-fake-root-map-storage",
    compatibilityStatus:
      "blocked-private-resource-hint-root-map-storage-compatibility"
  }),
  [worker830]: freezeRecord({
    diagnosticKind:
      "deterministic-private-fulfilled-action-reset-fake-commit",
    queueExecutionKind: "deterministic-fake-reset-state-queue",
    commitKind: "after-mutation-form-reset-order",
    rootLifecycleBoundaryStatus:
      "bound-private-form-action-fulfilled-reset-root-lifecycle",
    queueStatus:
      "executed-private-form-action-fulfilled-reset-state-queue-fake",
    commitStatus: "executed-private-form-action-fulfilled-reset-commit-fake"
  })
});

export const PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE = freezeRecord({
  [worker829]: freezeArray([
    "worker-829-resource-execution-record-source",
    "worker-829-resource-execution-snapshot-and-rows",
    "worker-829-resource-execution-admission-guards",
    "worker-829-resource-bridge-summary",
    "react-dom-private-resource-execution-package-export-blocker"
  ]),
  [worker830]: freezeArray([
    "worker-830-fulfilled-reset-record-source",
    "worker-830-fulfilled-reset-fake-queue-source",
    "worker-830-fulfilled-reset-fake-commit-source",
    "worker-830-fulfilled-reset-admission-guards",
    "worker-830-form-resource-bridge-summary",
    "react-dom-private-form-execution-package-export-blocker"
  ])
});

export const PRIVATE_ADMISSION_850_BLOCKED_PUBLIC_CLAIMS = freezeArray([
  "publicResourceApisReachable",
  "publicResourceHintCallsReachable",
  "publicResourceHintDomInsertion",
  "publicResourceMapCommitBehavior",
  "publicResourceDispatchCompatibilityClaimed",
  "publicResourceRootMapStorageCompatibilityClaimed",
  "publicResourceMapCommitCompatibilityClaimed",
  "publicScriptModuleResourceDispatch",
  "publicStylesheetLoadStateDispatch",
  "publicStylesheetResourceBehavior",
  "publicStylesheetPrecedenceBehavior",
  "publicRootTouched",
  "realDocumentMutated",
  "realHeadMutated",
  "fakeHeadMutated",
  "domMutation",
  "publicDomMutationReachable",
  "realResourceMapsCreated",
  "realResourceMapsMutated",
  "preloadPropsMapCreated",
  "preloadPropsMapMutated",
  "resourceFetchStarted",
  "preloadStarted",
  "modulePreloadStarted",
  "scriptPreinitStarted",
  "moduleScriptPreinitStarted",
  "scriptExecutionStarted",
  "resourceLoadStateMutated",
  "stylesheetLoadStateMutated",
  "publicFormActionsEnabled",
  "publicFormSubmissionReachable",
  "publicSubmitDispatchReachable",
  "publicRequestFormResetReachable",
  "publicRequestFormResetRequested",
  "publicActionInvocationReachable",
  "publicActionInvocationRequested",
  "publicErrorRoutingReachable",
  "realFormAccepted",
  "realFormInspected",
  "formDataConstructed",
  "syntheticEventCreated",
  "callbackDispatchExecuted",
  "submitCallbackInvoked",
  "privateAsyncActionCallbackInvoked",
  "privateAsyncActionCallbackPubliclyReachable",
  "actionFunctionCaptured",
  "actionInvocationRequested",
  "actionInvoked",
  "publicActionInvoked",
  "hostTransitionStarted",
  "previousDispatcherCalled",
  "resetFiberResolved",
  "resetStateQueued",
  "resetUpdateEnqueued",
  "reactUpdateQueued",
  "realReactUpdateQueued",
  "updateQueueCaptured",
  "publicReactUpdateCompatibilityClaimed",
  "afterMutationEffectsVisited",
  "resetFormInstanceCalled",
  "formResetCommitted",
  "realFormReset",
  "publicFormActionCompatibilityClaimed",
  "publicFormSubmitDispatchCompatibilityClaimed",
  "publicFormResetCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "publicPackageExportsCompatibilityClaimed",
  "packageCompatibilityClaimed",
  "packageExportCompatibilityClaimed",
  "packageExportsMutated",
  "packageJsonExportsMutated",
  "rootManifestsOrLockfilesMutated",
  "resourceFormGatesExported",
  "exportsPrivateResourceHintRootMapStorage",
  "exportsPrivateFormActionFulfilledResetExecution",
  "publicCompatibilityClaimed",
  "compatibilityClaimed"
]);

export const PRIVATE_ADMISSION_850_ROW_CONTRACT = freezeRecord({
  sourceQueue: "829-830",
  ledgerEvaluationMode: "static-source-owned-evidence-only",
  privateEvidenceOnly: true,
  sourceTokenChecksOnly: true,
  manifestEvaluationOnly: true,
  staticReadOnlyLedger: true,
  acceptedPrivateExecutionEvidence: true,
  executesPublicBehavior: false,
  runtimeExecutionClaimed: false,
  publicRuntimeExecutionClaimed: false,
  publicResourcesClaimed: false,
  publicFormsClaimed: false,
  packageCompatibilityClaimed: false,
  exportsChanged: false,
  publicCompatibilityClaimed: false,
  compatibilityClaimed: false,
  promotion: "rejected-public-compatibility"
});

export const PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE_LINEAGE =
  freezeRecord({
    sourceOwnedEvidence: true,
    staticSourceEvidenceOnly: true,
    workerProgressEvidence: false,
    testEvidence: false,
    proseEvidence: false,
    errorMessageEvidence: false,
    sourceSyntaxFragmentEvidence: false,
    clonedEvidence: false,
    tamperedEvidence: false,
    callerSuppliedDiagnosticStrings: false
  });

const privateAdmission850Rows = freezeArray([
  rowData({
    workerId: worker829,
    ledgerRole: "accepted-resource-root-map-storage-execution",
    privateAdmission:
      "accepted-private-resource-root-map-storage-execution",
    sourceEvidenceArea:
      "resource-root-map-storage-private-execution-snapshot-and-rows",
    implementationPaths: freezeArray([
      resourceInternalsPath,
      resourceFormGatesPath
    ]),
    acceptedPrivateEvidenceIds:
      PRIVATE_ADMISSION_850_REQUIRED_ACCEPTED_IDS[worker829],
    acceptedStatuses: PRIVATE_ADMISSION_850_REQUIRED_STATUSES[worker829],
    requiredFieldNames:
      PRIVATE_ADMISSION_850_REQUIRED_FIELD_NAMES[worker829],
    sourceOwnedEvidenceValues:
      PRIVATE_ADMISSION_850_REQUIRED_SOURCE_VALUES[worker829],
    evidence: [
      evidenceData({
        evidenceId: "worker-829-resource-execution-record-source",
        path: resourceInternalsPath,
        tokens: [
          "resourceHintRootMapStorageGateSchemaVersion",
          "privateResourceHintRootMapStorageRecordType",
          "privateResourceHintRootMapStorageGateId",
          "privateResourceHintRootMapStorageStatus",
          "privateResourceHintRootMapStorageExecutionStatus",
          "privateResourceHintRootMapStorageCompatibilityBlockedStatus",
          "recordResourceHintRootMapStorageWithGate",
          "createResourceHintRootMapStoragePlan",
          "resourceHintRootMapStorageContract",
          "react-dom-resource-root-map-storage-private-execution",
          "FastReactDomPrivateResourceHintRootMapStorageRecord",
          "resource-hint-root-map-storage-execution"
        ]
      }),
      evidenceData({
        evidenceId: "worker-829-resource-execution-snapshot-and-rows",
        path: resourceInternalsPath,
        tokens: [
          "createRootMapStorageExecutionRow",
          "createRootMapStorageEntry",
          "createRootMapStorageSnapshot",
          "createRootResourceStorageExecutionShape",
          "createRootMapStorageExecutionPlanSummary",
          "root-map-storage-execution",
          "root-map-storage-entry",
          "react-19.2.6-resource-root-map-storage-private-execution",
          "react-19.2.6-resource-root-map-storage-private-execution-snapshot",
          "rootMapStorageExecutionRows",
          "hoistableStylesRootMapExecutionRows",
          "hoistableScriptsRootMapExecutionRows",
          "rootMapStorageSnapshot",
          "hoistableStylesMapEntries",
          "hoistableScriptsMapEntries",
          "storedEntryId",
          "storedInRootMap",
          "fakeRootMapEntryCreated",
          "fakeRootMapEntryMutated",
          "deterministicFakeRootMapStorageOnly"
        ]
      }),
      evidenceData({
        evidenceId: "worker-829-resource-execution-admission-guards",
        path: resourceInternalsPath,
        tokens: [
          "normalizeResourceHintRootMapStorageAdmission",
          "normalizeExpectedRootMapStorageExecutionRowIds",
          "assertExpectedRootMapStorageExecutionRows",
          "assertNoRootMapStorageExecutionTargets",
          "assertNoRootMapStorageExecutionClaims",
          "assertNoRootMapStorageExecutionClaimFields",
          "createRootMapStorageExecutionValidationBoundary",
          "deterministic-private-root-map-storage-execution",
          "expectedRootMapStorageRowIds",
          "validated-private-resource-root-map-storage-execution",
          "clonedPreflightRecordRejected",
          "fakeRootStorageTargetsRejected",
          "preflightRecordConsumed",
          "preloadPropsMapMutated",
          "realResourceMapsMutated",
          "publicResourceRootMapStorageCompatibilityClaimed",
          "publicPackageExportsCompatibilityClaimed"
        ]
      }),
      evidenceData({
        evidenceId: "worker-829-resource-bridge-summary",
        path: resourceFormGatesPath,
        tokens: [
          "rootMapStorageExecutionRecorded",
          "rootMapStorageExecutionRowsRecorded",
          "canonicalRootMapStorageRowsExecuted",
          "rootMapStorageSnapshotRecorded",
          "deterministicFakeRootMapStorageExecuted",
          "fakeRootResourceStorageMutated",
          "fakeHoistableStylesMapMutated",
          "fakeHoistableScriptsMapMutated",
          "describePrivateResourceFormRootExecutionConsumerBoundary",
          "resourceRootMapStorageExecutionConsumed",
          "deterministicFakeRootMapStorageConsumed",
          "privateResourceFormExecutionAdmissionLedgerId",
          "rootMapStorageGate",
          "describePrivateResourceHintRootMapStorageGate"
        ]
      }),
      packageExportEvidenceData({
        evidenceId:
          "react-dom-private-resource-execution-package-export-blocker"
      })
    ]
  }),
  rowData({
    workerId: worker830,
    ledgerRole: "accepted-form-action-fulfilled-reset-fake-commit",
    privateAdmission:
      "accepted-private-form-action-fulfilled-reset-fake-queue-commit",
    sourceEvidenceArea:
      "form-action-fulfilled-reset-private-fake-queue-and-commit",
    implementationPaths: freezeArray([formActionsPath, resourceFormGatesPath]),
    acceptedPrivateEvidenceIds:
      PRIVATE_ADMISSION_850_REQUIRED_ACCEPTED_IDS[worker830],
    acceptedStatuses: PRIVATE_ADMISSION_850_REQUIRED_STATUSES[worker830],
    requiredFieldNames:
      PRIVATE_ADMISSION_850_REQUIRED_FIELD_NAMES[worker830],
    sourceOwnedEvidenceValues:
      PRIVATE_ADMISSION_850_REQUIRED_SOURCE_VALUES[worker830],
    evidence: [
      evidenceData({
        evidenceId: "worker-830-fulfilled-reset-record-source",
        path: formActionsPath,
        tokens: [
          "formActionFulfilledResetExecutionGateSchemaVersion",
          "privateFormActionFulfilledResetExecutionGateId",
          "privateFormActionFulfilledResetExecutionRecordType",
          "privateFormActionFulfilledResetExecutionStatus",
          "privateFormActionFulfilledResetExecutionRecordedStatus",
          "privateFormActionFulfilledResetRootLifecycleBoundaryRecordType",
          "privateFormActionFulfilledResetRootLifecycleBoundaryStatus",
          "formActionFulfilledResetExecutionDiagnosticKind",
          "formActionFulfilledResetExecutionQueueExecutionKind",
          "createFormActionFulfilledResetExecutionDiagnosticGate",
          "recordFormActionFulfilledResetExecutionWithGate",
          "FastReactDomPrivateFormActionFulfilledResetExecutionRecord",
          "FastReactDomPrivateFormActionFulfilledResetRootLifecycleBoundaryRecord",
          "form-action-fulfilled-reset-execution.fake-commit",
          "form-action-fulfilled-reset-fake-commit"
        ]
      }),
      evidenceData({
        evidenceId: "worker-830-fulfilled-reset-fake-queue-source",
        path: formActionsPath,
        tokens: [
          "createFulfilledResetStateQueueExecution",
          "executed-private-form-action-fulfilled-reset-state-queue-fake",
          "deterministic-fake-reset-state-queue",
          "fakeResetStateQueueExecution",
          "queueExecutionKind",
          "sourceFunctionNames",
          "requestUpdateLaneRecorded",
          "dispatchSetStateInternalRecorded",
          "fakeResetStateQueueExecuted",
          "fakeResetStateUpdateQueued",
          "rootExecutionBoundaryId",
          "sourceRootBridgeAdmissionId",
          "sourceRootLifecycleBoundaryId",
          "rootContainerInfo",
          "sourceOwnedRootLifecycleBoundary",
          "resetQueuePendingMutated",
          "realReactUpdateQueued",
          "updateQueueCaptured",
          "dispatchSetStateInternal",
          "requestUpdateLane"
        ]
      }),
      evidenceData({
        evidenceId: "worker-830-fulfilled-reset-fake-commit-source",
        path: formActionsPath,
        tokens: [
          "createFulfilledResetCommitExecution",
          "executed-private-form-action-fulfilled-reset-commit-fake",
          "fakeResetCommitExecution",
          "fakeFormResetCommitId",
          "fakeResetStateQueueExecutionId",
          "fakeResetStateUpdateId",
          "afterMutationEffectsOrder",
          "fakeResetCommitExecuted",
          "fakeFormResetCommitRecorded",
          "fakeResetFormInstanceCallRecorded",
          "fakeResetStateQueueRootExecutionBoundaryId",
          "fakeResetStateQueueRootLifecycleBoundaryId",
          "resetFormInstance",
          "resetFormInstanceCalled",
          "formResetCommitted",
          "realFormReset"
        ]
      }),
      evidenceData({
        evidenceId: "worker-830-fulfilled-reset-admission-guards",
        path: formActionsPath,
        tokens: [
          "normalizeFormActionFulfilledResetExecutionAdmission",
          "normalizeFormActionFulfilledResetRootLifecycleBinding",
          "assertNoFulfilledResetExecutionRawAdmissionFields",
          "getFulfilledResetExecutionExactStringProperty",
          "assertNoFormActionPublicBehaviorAliasClaims",
          "blockedFulfilledResetExecutionAdmissionFields",
          "rootBridgeAdmission",
          "rootLifecycleRequestBoundary",
          "deterministic-private-fulfilled-action-reset-fake-commit",
          "after-mutation-form-reset-order",
          "publicSubmitDispatchRequested",
          "publicRequestFormResetRequested",
          "actionInvocationRequested",
          "reactUpdateRequested",
          "resetUpdateEnqueued",
          "domMutationRequested",
          "packageCompatibilityClaimed"
        ]
      }),
      evidenceData({
        evidenceId: "worker-830-form-resource-bridge-summary",
        path: resourceFormGatesPath,
        tokens: [
          "fulfilledResetExecutionMetadataRecorded",
          "fulfilledResetExecutionGate",
          "fulfilledResetExecutionGateAvailable",
          "describePrivateFormActionFulfilledResetExecutionBoundary",
          "describePrivateFormActionFulfilledResetExecutionGate",
          "privateAsyncActionCallbackInvoked",
          "resetUpdateEnqueued",
          "resetFormInstanceCalled",
          "formResetCommitted",
          "realFormReset",
          "describePrivateResourceFormRootExecutionConsumerBoundary",
          "requiresFormFulfilledResetRootLifecycleIdentity",
          "rejectsRootlessFormFulfilledResetRecords",
          "rejectsCrossContainerFormFulfilledResetRecords",
          "formFulfilledResetExecutionConsumed",
          "deterministicFakeResetStateQueueConsumed",
          "deterministicFakeResetCommitConsumed",
          "privateResourceFormExecutionAdmissionLedgerId"
        ]
      }),
      packageExportEvidenceData({
        evidenceId: "react-dom-private-form-execution-package-export-blocker"
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_850_ROWS = freezeArray(
  privateAdmission850Rows.map((sourceRow) =>
    row({
      ...sourceRow,
      publicBlockerClaims: falseRecord(
        PRIVATE_ADMISSION_850_BLOCKED_PUBLIC_CLAIMS
      )
    })
  )
);

export function evaluatePrivateAdmission850ResourceFormExecutionLedger({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rows = PRIVATE_ADMISSION_850_ROWS,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const prior808 = evaluatePrivateAdmission808Gate({ workspaceRoot });
  const mergedRows = rows.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = mergedRows.map((baseRow) =>
    evaluatePrivateAdmissionRow({
      fileCache,
      row: baseRow,
      workspaceRoot
    })
  );
  const manifestWorkerIds = mergedRows.map((baseRow) => baseRow.workerId);
  const manifest = freezeRecord({
    expectedWorkerIds: PRIVATE_ADMISSION_850_WORKERS,
    actualWorkerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_850_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_850_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    )
  });

  const evidenceRoleMismatches = evaluatedRows.flatMap((row) =>
    row.evidenceIdsRecognized === true
      ? []
      : [
          freezeRecord({
            workerId: row.workerId,
            expectedEvidenceIds:
              PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE[row.workerId] ?? [],
            actualEvidenceIds: freezeArray(
              row.evidence.map((evidenceRow) => evidenceRow.evidenceId)
            )
          })
        ]
  );
  const evidenceMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          evidenceId: evidenceRow.evidenceId,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          unstableEvidenceReasons: evidenceRow.unstableEvidenceReasons,
          readError: evidenceRow.readError
        })
      )
  );
  const acceptedIdMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_850_REQUIRED_ACCEPTED_IDS,
    actualKey: "acceptedPrivateEvidenceIds",
    expectedKey: "expectedAcceptedIds",
    actualKeyForViolation: "actualAcceptedIds"
  });
  const statusMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_850_REQUIRED_STATUSES,
    actualKey: "acceptedStatuses",
    expectedKey: "expectedStatuses",
    actualKeyForViolation: "actualStatuses"
  });
  const fieldNameMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_850_REQUIRED_FIELD_NAMES,
    actualKey: "requiredFieldNames",
    expectedKey: "expectedFieldNames",
    actualKeyForViolation: "actualFieldNames"
  });
  const sourceValueMismatches = evaluatedRows.flatMap((row) =>
    createRecordMismatch({
      workerId: row.workerId,
      expected: PRIVATE_ADMISSION_850_REQUIRED_SOURCE_VALUES[row.workerId],
      actual: row.sourceOwnedEvidenceValues,
      expectedKey: "expectedSourceOwnedValues",
      actualKey: "actualSourceOwnedValues"
    })
  );
  const publicBlockerFieldMismatches = evaluatedRows.flatMap((row) => {
    const actualKeys = Object.keys(row.publicBlockerClaims);
    if (sameStringSet(PRIVATE_ADMISSION_850_BLOCKED_PUBLIC_CLAIMS, actualKeys)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicBlockerFields:
          PRIVATE_ADMISSION_850_BLOCKED_PUBLIC_CLAIMS,
        actualPublicBlockerFields: freezeArray(actualKeys)
      })
    ];
  });
  const publicClaimViolationIds = evaluatedRows.flatMap((row) =>
    row.publicClaimViolations.map((field) => `${row.workerId}.${field}`)
  );
  const rowContractMismatches = evaluatedRows
    .filter((row) => row.rowContractRecognized !== true)
    .map((row) =>
      freezeRecord({
        workerId: row.workerId,
        expectedContract: PRIVATE_ADMISSION_850_ROW_CONTRACT,
        actualContract: rowContract(row)
      })
    );
  const evidenceLineageMismatches = evaluatedRows
    .filter((row) => row.evidenceLineageRecognized !== true)
    .map((row) =>
      freezeRecord({
        workerId: row.workerId,
        expectedLineage: PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE_LINEAGE,
        actualLineage: row.evidenceLineage
      })
    );
  const staticReadOnlyViolationIds = evaluatedRows
    .filter((row) => row.staticReadOnlyRecognized !== true)
    .map((row) => row.workerId);
  const priorLedgerViolations =
    prior808.status === PRIVATE_ADMISSION_808_GATE_STATUS &&
    prior808.violations.length === 0
      ? []
      : [
          freezeRecord({
            gateId: prior808.gateId,
            status: prior808.status,
            violationIds: freezeArray(
              prior808.violations.map((violation) => violation.id)
            )
          })
        ];

  const resourceLeakClaimIds = filterClaimIds(publicClaimViolationIds, [
    "publicResourceApisReachable",
    "publicResourceHintCallsReachable",
    "publicResourceHintDomInsertion",
    "publicResourceMapCommitBehavior",
    "publicResourceDispatchCompatibilityClaimed",
    "publicResourceRootMapStorageCompatibilityClaimed",
    "publicResourceMapCommitCompatibilityClaimed",
    "publicScriptModuleResourceDispatch",
    "publicStylesheetLoadStateDispatch",
    "publicStylesheetResourceBehavior",
    "publicStylesheetPrecedenceBehavior",
    "realResourceMapsCreated",
    "realResourceMapsMutated",
    "preloadPropsMapCreated",
    "preloadPropsMapMutated"
  ]);
  const formLeakClaimIds = filterClaimIds(publicClaimViolationIds, [
    "publicFormActionsEnabled",
    "publicFormSubmissionReachable",
    "publicSubmitDispatchReachable",
    "publicRequestFormResetReachable",
    "publicRequestFormResetRequested",
    "publicActionInvocationReachable",
    "publicActionInvocationRequested",
    "publicErrorRoutingReachable",
    "realFormAccepted",
    "realFormInspected",
    "formDataConstructed",
    "syntheticEventCreated",
    "callbackDispatchExecuted",
    "submitCallbackInvoked",
    "privateAsyncActionCallbackInvoked",
    "privateAsyncActionCallbackPubliclyReachable",
    "actionFunctionCaptured",
    "actionInvocationRequested",
    "actionInvoked",
    "publicActionInvoked",
    "hostTransitionStarted"
  ]);
  const updateResetDomLeakClaimIds = filterClaimIds(publicClaimViolationIds, [
    "publicRootTouched",
    "realDocumentMutated",
    "realHeadMutated",
    "fakeHeadMutated",
    "domMutation",
    "publicDomMutationReachable",
    "resourceFetchStarted",
    "preloadStarted",
    "modulePreloadStarted",
    "scriptPreinitStarted",
    "moduleScriptPreinitStarted",
    "scriptExecutionStarted",
    "resourceLoadStateMutated",
    "stylesheetLoadStateMutated",
    "previousDispatcherCalled",
    "resetFiberResolved",
    "resetStateQueued",
    "resetUpdateEnqueued",
    "reactUpdateQueued",
    "realReactUpdateQueued",
    "updateQueueCaptured",
    "publicReactUpdateCompatibilityClaimed",
    "afterMutationEffectsVisited",
    "resetFormInstanceCalled",
    "formResetCommitted",
    "realFormReset"
  ]);
  const packageExportLeakClaimIds = filterClaimIds(publicClaimViolationIds, [
    "publicPackageCompatibilityClaimed",
    "publicPackageExportsCompatibilityClaimed",
    "packageCompatibilityClaimed",
    "packageExportCompatibilityClaimed",
    "packageExportsMutated",
    "packageJsonExportsMutated",
    "rootManifestsOrLockfilesMutated",
    "resourceFormGatesExported",
    "exportsPrivateResourceHintRootMapStorage",
    "exportsPrivateFormActionFulfilledResetExecution"
  ]);
  const publicCompatibilityLeakClaimIds = filterClaimIds(
    publicClaimViolationIds,
    [
      "publicResourceRootMapStorageCompatibilityClaimed",
      "publicResourceMapCommitCompatibilityClaimed",
      "publicResourceDispatchCompatibilityClaimed",
      "publicFormActionCompatibilityClaimed",
      "publicFormSubmitDispatchCompatibilityClaimed",
      "publicFormResetCompatibilityClaimed",
      "publicReactUpdateCompatibilityClaimed",
      "publicPackageCompatibilityClaimed",
      "publicPackageExportsCompatibilityClaimed",
      "publicCompatibilityClaimed",
      "compatibilityClaimed"
    ]
  );

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("private-admission-850-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-850-prior-resource-form-ledger-mismatch",
    priorLedgerViolations
  );
  pushRowsViolation(
    violations,
    "private-admission-850-required-evidence-mismatch",
    evidenceRoleMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-850-evidence-token-missing-or-unstable",
    evidenceMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-850-accepted-id-mismatch",
    acceptedIdMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-850-status-mismatch",
    statusMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-850-field-name-mismatch",
    fieldNameMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-850-source-owned-value-mismatch",
    sourceValueMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-850-public-blocker-field-mismatch",
    publicBlockerFieldMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-850-row-contract-mismatch",
    rowContractMismatches
  );
  pushRowsViolation(
    violations,
    "private-admission-850-evidence-lineage-mismatch",
    evidenceLineageMismatches
  );
  pushIdsViolation(
    violations,
    "private-admission-850-static-read-only-mismatch",
    staticReadOnlyViolationIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-850-resource-public-claim-detected",
    resourceLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-850-form-public-claim-detected",
    formLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-850-update-reset-dom-claim-detected",
    updateResetDomLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-850-package-export-claim-detected",
    packageExportLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "private-admission-850-public-compatibility-claim-detected",
    publicCompatibilityLeakClaimIds
  );

  const manifestRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0;
  const priorLedgerRecognized = priorLedgerViolations.length === 0;
  const evidenceRolesRecognized = evidenceRoleMismatches.length === 0;
  const evidenceRecognized = evidenceMismatches.length === 0;
  const acceptedIdsRecognized = acceptedIdMismatches.length === 0;
  const statusesRecognized = statusMismatches.length === 0;
  const fieldNamesRecognized = fieldNameMismatches.length === 0;
  const sourceOwnedValuesRecognized = sourceValueMismatches.length === 0;
  const publicBlockerFieldsRecognized =
    publicBlockerFieldMismatches.length === 0;
  const rowContractRecognized = rowContractMismatches.length === 0;
  const evidenceLineageRecognized = evidenceLineageMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerFieldsRecognized && publicClaimViolationIds.length === 0;
  const staticReadOnlyRecognized = staticReadOnlyViolationIds.length === 0;
  const privateExecutionEvidenceRecognized =
    manifestRecognized &&
    priorLedgerRecognized &&
    evidenceRolesRecognized &&
    evidenceRecognized &&
    acceptedIdsRecognized &&
    statusesRecognized &&
    fieldNamesRecognized &&
    sourceOwnedValuesRecognized &&
    rowContractRecognized &&
    evidenceLineageRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized;

  return freezeRecord({
    ledgerId: PRIVATE_ADMISSION_850_LEDGER_ID,
    status: privateExecutionEvidenceRecognized
      ? PRIVATE_ADMISSION_850_LEDGER_STATUS
      : PRIVATE_ADMISSION_850_LEDGER_VIOLATION_STATUS,
    privateExecutionEvidenceRecognized,
    manifestRecognized,
    priorLedgerRecognized,
    evidenceRolesRecognized,
    evidenceRecognized,
    acceptedIdsRecognized,
    statusesRecognized,
    fieldNamesRecognized,
    sourceOwnedValuesRecognized,
    publicBlockerFieldsRecognized,
    blockedPublicClaimsRecognized,
    rowContractRecognized,
    evidenceLineageRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed: publicClaimViolationIds.length > 0,
    publicCompatibilityClaimed: publicCompatibilityLeakClaimIds.length > 0,
    queueWorkers: PRIVATE_ADMISSION_850_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => row.recognized === true)
        .map((row) => row.workerId)
    ),
    priorLedger: freezeRecord({
      gateId: prior808.gateId,
      status: prior808.status,
      recognized: priorLedgerRecognized
    }),
    resourceLeakClaimIds: freezeArray(resourceLeakClaimIds),
    formLeakClaimIds: freezeArray(formLeakClaimIds),
    updateResetDomLeakClaimIds: freezeArray(updateResetDomLeakClaimIds),
    packageExportLeakClaimIds: freezeArray(packageExportLeakClaimIds),
    publicCompatibilityLeakClaimIds: freezeArray(
      publicCompatibilityLeakClaimIds
    ),
    publicClaimViolationIds: freezeArray(publicClaimViolationIds),
    staticReadOnlyViolationIds: freezeArray(staticReadOnlyViolationIds),
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: freezeRecord(
      Object.fromEntries(evaluatedRows.map((row) => [row.workerId, row]))
    ),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    implementationPaths: freezeArray(data.implementationPaths),
    acceptedPrivateEvidenceIds: freezeArray(data.acceptedPrivateEvidenceIds),
    acceptedStatuses: freezeArray(data.acceptedStatuses),
    requiredFieldNames: freezeArray(data.requiredFieldNames),
    sourceOwnedEvidenceValues: freezeRecord(data.sourceOwnedEvidenceValues),
    evidence: freezeArray(data.evidence)
  });
}

function evidenceData({ evidenceId, path, tokens, forbiddenTokens = [] }) {
  return freezeRecord({
    evidenceId,
    path,
    tokenPolicy: sourceTokenPolicy,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens)
  });
}

function packageExportEvidenceData({ evidenceId }) {
  return evidenceData({
    evidenceId,
    path: reactDomPackageJsonPath,
    tokens: ["./client", "./server", "./static", "./test-utils", "./package.json"],
    forbiddenTokens: [
      "./resource-form-gates",
      "./resource-form-internals-gate",
      "./shared/form-actions",
      "./private-resource-form"
    ]
  });
}

function row(data) {
  return freezeRecord({
    ...data,
    ...PRIVATE_ADMISSION_850_ROW_CONTRACT,
    evidenceLineage: PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE_LINEAGE,
    publicBlockerClaims: freezeRecord(data.publicBlockerClaims)
  });
}

function mergeRowOverride(baseRow, override) {
  return freezeRecord({
    ...baseRow,
    ...override,
    implementationPaths: freezeArray(
      override.implementationPaths ?? baseRow.implementationPaths
    ),
    acceptedPrivateEvidenceIds: freezeArray(
      override.acceptedPrivateEvidenceIds ??
        baseRow.acceptedPrivateEvidenceIds
    ),
    acceptedStatuses: freezeArray(
      override.acceptedStatuses ?? baseRow.acceptedStatuses
    ),
    requiredFieldNames: freezeArray(
      override.requiredFieldNames ?? baseRow.requiredFieldNames
    ),
    sourceOwnedEvidenceValues: freezeRecord({
      ...baseRow.sourceOwnedEvidenceValues,
      ...(override.sourceOwnedEvidenceValues ?? {})
    }),
    evidence: freezeArray(override.evidence ?? baseRow.evidence),
    evidenceLineage: freezeRecord({
      ...baseRow.evidenceLineage,
      ...(override.evidenceLineage ?? {})
    }),
    publicBlockerClaims: freezeRecord({
      ...baseRow.publicBlockerClaims,
      ...(override.publicBlockerClaims ?? {})
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
  const evidenceIdsRecognized = sameStringSet(
    PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE[row.workerId] ?? [],
    evaluatedEvidence.map((evidenceRow) => evidenceRow.evidenceId)
  );
  const evidenceRecognized = evaluatedEvidence.every(
    (evidenceRow) => evidenceRow.recognized === true
  );
  const acceptedIdsRecognized = sameStringSet(
    PRIVATE_ADMISSION_850_REQUIRED_ACCEPTED_IDS[row.workerId] ?? [],
    row.acceptedPrivateEvidenceIds
  );
  const statusesRecognized = sameStringSet(
    PRIVATE_ADMISSION_850_REQUIRED_STATUSES[row.workerId] ?? [],
    row.acceptedStatuses
  );
  const fieldNamesRecognized = sameStringSet(
    PRIVATE_ADMISSION_850_REQUIRED_FIELD_NAMES[row.workerId] ?? [],
    row.requiredFieldNames
  );
  const sourceOwnedValuesRecognized =
    createRecordMismatch({
      workerId: row.workerId,
      expected: PRIVATE_ADMISSION_850_REQUIRED_SOURCE_VALUES[row.workerId],
      actual: row.sourceOwnedEvidenceValues
    }).length === 0;
  const publicBlockerFieldsRecognized = sameStringSet(
    PRIVATE_ADMISSION_850_BLOCKED_PUBLIC_CLAIMS,
    Object.keys(row.publicBlockerClaims)
  );
  const publicClaimViolations = Object.entries(row.publicBlockerClaims)
    .filter(([, value]) => value !== false)
    .map(([field]) => field);
  const rowContractRecognized = sameRecord(
    PRIVATE_ADMISSION_850_ROW_CONTRACT,
    rowContract(row)
  );
  const evidenceLineageRecognized = sameRecord(
    PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE_LINEAGE,
    row.evidenceLineage
  );
  const staticReadOnlyRecognized =
    row.staticReadOnlyLedger === true &&
    row.sourceTokenChecksOnly === true &&
    row.manifestEvaluationOnly === true &&
    row.ledgerEvaluationMode === "static-source-owned-evidence-only" &&
    row.runtimeExecutionClaimed === false &&
    row.publicRuntimeExecutionClaimed === false &&
    row.executesPublicBehavior === false &&
    row.packageCompatibilityClaimed === false &&
    row.exportsChanged === false &&
    row.compatibilityClaimed === false &&
    row.publicCompatibilityClaimed === false;

  return freezeRecord({
    ...row,
    evidence: freezeArray(evaluatedEvidence),
    evidenceIdsRecognized,
    evidenceRecognized,
    acceptedIdsRecognized,
    statusesRecognized,
    fieldNamesRecognized,
    sourceOwnedValuesRecognized,
    publicBlockerFieldsRecognized,
    publicClaimViolations: freezeArray(publicClaimViolations),
    rowContractRecognized,
    evidenceLineageRecognized,
    staticReadOnlyRecognized,
    recognized:
      evidenceIdsRecognized === true &&
      evidenceRecognized === true &&
      acceptedIdsRecognized === true &&
      statusesRecognized === true &&
      fieldNamesRecognized === true &&
      sourceOwnedValuesRecognized === true &&
      publicBlockerFieldsRecognized === true &&
      publicClaimViolations.length === 0 &&
      rowContractRecognized === true &&
      evidenceLineageRecognized === true &&
      staticReadOnlyRecognized === true
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const source = readWorkspaceFile({
    fileCache,
    workspaceRoot,
    path: evidenceRow.path
  });
  const tokenResults = evidenceRow.tokens.map((token) =>
    freezeRecord({
      token,
      present: source.text.includes(token)
    })
  );
  const forbiddenTokenResults = evidenceRow.forbiddenTokens.map((token) =>
    freezeRecord({
      token,
      present: source.text.includes(token)
    })
  );
  const missingTokens = tokenResults
    .filter((tokenResult) => tokenResult.present !== true)
    .map((tokenResult) => tokenResult.token);
  const forbiddenTokensPresent = forbiddenTokenResults
    .filter((tokenResult) => tokenResult.present === true)
    .map((tokenResult) => tokenResult.token);
  const unstableEvidenceReasons = findUnstableEvidenceReasons(evidenceRow);

  return freezeRecord({
    ...evidenceRow,
    tokenResults: freezeArray(tokenResults),
    forbiddenTokenResults: freezeArray(forbiddenTokenResults),
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    unstableEvidenceReasons: freezeArray(unstableEvidenceReasons),
    recognized:
      source.ok === true &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0 &&
      unstableEvidenceReasons.length === 0 &&
      evidenceRow.tokenPolicy === sourceTokenPolicy,
    readError: source.error
  });
}

function findUnstableEvidenceReasons(evidenceRow) {
  const reasons = [];
  if (evidenceRow.path.startsWith("worker-progress/")) {
    reasons.push("worker-progress-evidence-path");
  }
  if (
    evidenceRow.path.includes("/test/") ||
    evidenceRow.path.includes(".test.")
  ) {
    reasons.push("test-evidence-path");
  }
  if (evidenceRow.tokenPolicy !== sourceTokenPolicy) {
    reasons.push("token-policy-mismatch");
  }
  for (const token of evidenceRow.tokens) {
    if (typeof token !== "string" || token.length === 0) {
      reasons.push("empty-token");
      continue;
    }
    if (/\s/u.test(token)) {
      reasons.push(`prose-or-formatted-token:${token}`);
    }
    if (/[(){};]/u.test(token) || /=>|===|!==|&&|\|\|/u.test(token)) {
      reasons.push(`source-syntax-token:${token}`);
    }
  }
  return reasons;
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

function createRecordMismatch({
  workerId,
  expected,
  actual,
  expectedKey = "expected",
  actualKey = "actual"
}) {
  if (expected === undefined || sameRecord(expected, actual)) {
    return [];
  }
  return [
    freezeRecord({
      workerId,
      [expectedKey]: expected,
      [actualKey]: freezeRecord({ ...actual })
    })
  ];
}

function rowContract(row) {
  return freezeRecord(
    Object.fromEntries(
      Object.keys(PRIVATE_ADMISSION_850_ROW_CONTRACT).map((key) => [
        key,
        row[key]
      ])
    )
  );
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
    violations.push(createViolation(id, { claimIds: freezeArray(claimIds) }));
  }
}

function falseRecord(keys) {
  return freezeRecord(Object.fromEntries(keys.map((key) => [key, false])));
}

function sameStringSet(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false;
  }
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function sameRecord(left, right) {
  if (left == null || right == null) {
    return left === right;
  }
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (!sameStringSet(leftKeys, rightKeys)) {
    return false;
  }
  return leftKeys.every((key) => left[key] === right[key]);
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
