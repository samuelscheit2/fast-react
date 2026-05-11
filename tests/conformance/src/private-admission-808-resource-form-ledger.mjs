import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_778_779_GATE_ID,
  PRIVATE_ADMISSION_778_779_GATE_STATUS,
  evaluatePrivateAdmission778779Gate
} from "./private-admission-778-779-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_808_GATE_ID =
  "private-admission-808-resource-form-hardening-ledger-1";
export const PRIVATE_ADMISSION_808_GATE_STATUS =
  "recognized-accepted-resource-form-private-hardening-public-compatibility-blocked";
export const PRIVATE_ADMISSION_808_VIOLATION_STATUS =
  "blocked-accepted-resource-form-private-hardening-with-violations";

const worker778 = "worker-778-resource-root-map-storage-preflight";
const worker779 = "worker-779-form-action-rejected-error-preflight";
const worker794 = "worker-794-resource-root-map-conformance-gate";
const worker796 = "worker-796-private-admission-778-779-resource-form-ledger";
const worker800 = "worker-800-form-rejected-error-blocker-hardening";
const worker802 = "worker-802-resource-root-map-negative-matrix";

export const PRIVATE_ADMISSION_808_WORKERS = freezeArray([
  worker778,
  worker779,
  worker794,
  worker796,
  worker800,
  worker802
]);

export const PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS = freezeRecord({
  [worker778]: freezeArray([
    "resource-hint-root-map-storage-preflight-private-gate-1",
    "fast.react_dom.private_resource_hint_root_map_storage_preflight_record",
    "react-19.2.6-resource-root-map-storage-preflight"
  ]),
  [worker779]: freezeArray([
    "form-action-rejected-error-preflight-private-gate-1",
    "fast.react_dom.private_form_action_rejected_error_preflight_record",
    "form-action-rejected-error-preflight.diagnostic"
  ]),
  [worker794]: freezeArray([
    "canonical-resource-root-map-storage",
    "react-19.2.6-resource-root-map-storage-preflight",
    "preload-props-map-is-not-root-owned-storage"
  ]),
  [worker796]: freezeArray([
    PRIVATE_ADMISSION_778_779_GATE_ID,
    PRIVATE_ADMISSION_778_779_GATE_STATUS,
    "private-admission-778-779-resource-form-ledger-1"
  ]),
  [worker800]: freezeArray([
    "form-action-rejected-error-preflight-private-gate-1",
    "form-action-async-callback-execution-private-gate-1",
    "failed-private-form-action-async-callback-rejected"
  ]),
  [worker802]: freezeArray([
    "root-map-storage-preflight-skipped-preload-props",
    "validated-private-resource-root-map-storage-preflight",
    "FAST_REACT_DOM_RESOURCE_HINT_ROOT_MAP_STORAGE_PREFLIGHT_INVALID_ADMISSION"
  ])
});

export const PRIVATE_ADMISSION_808_REQUIRED_STATUSES = freezeRecord({
  [worker778]: freezeArray([
    "preflighted-private-resource-hint-root-map-storage-record",
    "diagnosed-private-resource-hint-root-map-storage-preflight",
    "blocked-private-resource-hint-root-map-storage-preflight-compatibility",
    "blocked-public-resource-root-map-storage"
  ]),
  [worker779]: freezeArray([
    "private-form-action-rejected-error-preflight-metadata-only",
    "recorded-private-form-action-rejected-error-preflight",
    "preflighted-private-form-action-rejected-error-metadata",
    "blocked-public-form-action-reset-and-rejected-error-routing",
    "blocked-public-form-action-rejected-error-preflight-compatibility"
  ]),
  [worker794]: freezeArray([
    "validated-private-resource-root-map-storage-preflight",
    "preflighted-private-resource-hint-root-map-storage-record",
    "blocked-public-resource-root-map-storage"
  ]),
  [worker796]: freezeArray([
    PRIVATE_ADMISSION_778_779_GATE_STATUS,
    "blocked-accepted-private-diagnostics-778-779-with-violations",
    "recognized-accepted-private-diagnostics-778-779-public-compatibility-blocked"
  ]),
  [worker800]: freezeArray([
    "private-form-action-rejected-error-preflight-metadata-only",
    "recorded-private-form-action-rejected-error-preflight",
    "failed-private-form-action-async-callback-rejected",
    "blocked-public-form-action-rejected-error-preflight-compatibility"
  ]),
  [worker802]: freezeArray([
    "validated-private-resource-root-map-storage-preflight",
    "blocked-public-resource-root-map-storage",
    "blocked-private-resource-hint-root-map-storage-preflight-compatibility"
  ])
});

export const PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES = freezeRecord({
  [worker778]: freezeArray([
    "rootMapStorageRows",
    "rootResourceStorageShape",
    "rootMapPublicBoundary",
    "hoistableStylesMapMutated",
    "hoistableScriptsMapMutated",
    "publicResourceMapCommitBehavior",
    "publicScriptModuleResourceDispatch",
    "publicStylesheetLoadStateDispatch"
  ]),
  [worker779]: freezeArray([
    "rejectedAsyncActionError",
    "actionErrorPreflight",
    "resetActionPublicBlockers",
    "publicFormActionBoundary",
    "publicSubmitDispatchReachable",
    "publicRequestFormResetReachable",
    "publicActionInvocationReachable",
    "publicErrorRoutingReachable",
    "rootErrorUpdateScheduled"
  ]),
  [worker794]: freezeArray([
    "expectedSourceResourceMapCommitRowIds",
    "canonicalRootMapStorageRow",
    "rootMapName",
    "rootMapDedupeKey",
    "skippedPreloadPropsRows",
    "expectedSourceRowsValidated",
    "acceptedRootMapNames",
    "rejectsStaleSourceRows"
  ]),
  [worker796]: freezeArray([
    "PRIVATE_ADMISSION_778_779_PUBLIC_COMPATIBILITY_CLAIMS",
    "PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS",
    "compatibilityBlockers",
    "publicCompatibilityClaims",
    "rowCompatibilityClaimViolationIds",
    "publicBlockerViolationIds",
    "sideEffectClaimViolationIds",
    "staticReadOnlyRecognized"
  ]),
  [worker800]: freezeArray([
    "consumedRejectedExecutions",
    "consumedFormActionRejectedErrorPreflightExecutions",
    "sourceAsyncCallbackExecutionId",
    "rejectsStaleRejections",
    "actionInvocationRequested",
    "publicRequestFormResetRequested",
    "publicDomMutationReachable",
    "resetUpdateEnqueued",
    "afterMutationEffectsVisited",
    "publicFormActionCompatibilityClaimed",
    "packageCompatibilityClaimed"
  ]),
  [worker802]: freezeArray([
    "rejectsMixedRootMapRowKinds",
    "rejectsPreloadPropsRootStorageClaims",
    "rejectsPublicHeadMutationClaims",
    "rejectsStylesheetScriptLifecycleClaims",
    "rejectsPackageCompatibilityClaims",
    "publicStylesheetResourceBehavior",
    "publicStylesheetPrecedenceBehavior",
    "rootManifestsOrLockfilesMutated",
    "blockedTargetFields",
    "lifecycleClaimFields",
    "packageClaimFields"
  ])
});

export const PRIVATE_ADMISSION_808_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicResourceApisReachable",
  "publicResourceHintCallsReachable",
  "publicResourceHintDomInsertion",
  "publicResourceMapCommitBehavior",
  "publicScriptModuleResourceDispatch",
  "publicStylesheetLoadStateDispatch",
  "publicStylesheetResourceBehavior",
  "publicStylesheetPrecedenceBehavior",
  "publicFormActionsEnabled",
  "publicFormSubmissionReachable",
  "publicSubmitDispatchReachable",
  "publicRequestFormResetReachable",
  "publicActionInvocationReachable",
  "publicErrorRoutingReachable",
  "publicDomMutationReachable",
  "publicRootTouched",
  "realFormAccepted",
  "realFormInspected",
  "formDataConstructed",
  "syntheticEventCreated",
  "callbackDispatchExecuted",
  "submitCallbackInvoked",
  "actionFunctionCaptured",
  "actionInvocationRequested",
  "actionInvoked",
  "publicActionInvoked",
  "privateAsyncActionCallbackPubliclyReachable",
  "hostTransitionStarted",
  "previousDispatcherCalled",
  "resetFiberResolved",
  "resetStateQueued",
  "resetUpdateEnqueued",
  "publicRequestFormResetRequested",
  "afterMutationEffectsVisited",
  "resetFormInstanceCalled",
  "formResetCommitted",
  "realFormReset",
  "rootErrorUpdateScheduled",
  "publicRootErrorCallbackInvoked",
  "errorBoundaryScheduled",
  "reactUpdateQueued",
  "domMutation",
  "publicDomMutationEnabled",
  "realDocumentMutated",
  "realHeadMutated",
  "fakeHeadMutated",
  "publicHeadSingletonBehavior",
  "publicSingletonBehavior",
  "singletonResolutionReachable",
  "headChildrenCleared",
  "rootResourceStorageMutated",
  "hoistableStylesMapMutated",
  "hoistableScriptsMapMutated",
  "preloadPropsMapMutated",
  "realResourceMapsMutated",
  "fakeResourceMapsMutated",
  "resourceFetchStarted",
  "preloadStarted",
  "modulePreloadStarted",
  "scriptPreinitStarted",
  "moduleScriptPreinitStarted",
  "scriptExecutionStarted",
  "resourceLoadStateMutated",
  "stylesheetLoadStateMutated",
  "preloadOrStyleDomWorkDispatched",
  "loadEventSubscribed",
  "errorEventSubscribed",
  "packageCompatibilityClaimed",
  "packageExportCompatibilityClaimed",
  "packageExportsMutated",
  "packageJsonExportsMutated",
  "rootManifestsOrLockfilesMutated",
  "resourceFormGatesExported",
  "exportsPrivateResourceHintRootMapStoragePreflight",
  "publicFormActionCompatibilityClaimed",
  "publicResourceRootMapStorageCompatibilityClaimed",
  "publicFormRejectedErrorCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "publicPackageExportsCompatibilityClaimed",
  "publicCompatibilityClaimed",
  "compatibilityClaimed"
]);

const resourceInternalsPath =
  "packages/react-dom/src/resource-form-internals-gate.js";
const formActionsPath = "packages/react-dom/src/shared/form-actions.js";
const resourceConformanceTestPath =
  "tests/conformance/test/react-dom-resource-hints-oracle.test.mjs";
const formConformanceSourcePath =
  "tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs";
const formPackageTestPath =
  "packages/react-dom/test/resource-form-unsupported-gates.test.js";
const reactDomPackageJsonPath = "packages/react-dom/package.json";
const ledger778779SourcePath =
  "tests/conformance/src/private-admission-778-779-gate.mjs";
const ledger778779TestPath =
  "tests/conformance/test/private-admission-778-779-gate.test.mjs";

const privateAdmission808Rows = freezeArray([
  rowData({
    workerId: worker778,
    hardeningArea: "resource root-map storage",
    admission: "accepted-private-resource-root-map-storage-preflight",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS[worker778],
    acceptedStatuses: PRIVATE_ADMISSION_808_REQUIRED_STATUSES[worker778],
    requiredFieldNames:
      PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES[worker778],
    evidence: [
      evidenceData({
        role: "worker-778-resource-root-map-source",
        path: resourceInternalsPath,
        tokens: [
          "privateResourceHintRootMapStoragePreflightGateId",
          "privateResourceHintRootMapStoragePreflightRecordType",
          "privateResourceHintRootMapStoragePreflightStatus",
          "privateResourceHintRootMapStoragePreflightExecutionStatus",
          "privateResourceHintRootMapStoragePreflightCompatibilityBlockedStatus",
          "createResourceHintRootMapStoragePreflightGate",
          "recordResourceHintRootMapStoragePreflightWithGate",
          "describePrivateResourceHintRootMapStoragePreflightGate",
          "createPublicResourceRootMapStorageBoundary",
          "assertNoRootMapStoragePreflightTargets",
          "assertNoPublicResourceDispatchClaims",
          "resourceHintRootMapStoragePreflightBlockedSideEffects",
          "publicResourceMapCommitBehavior",
          "publicScriptModuleResourceDispatch",
          "publicStylesheetLoadStateDispatch"
        ]
      }),
      packageExportEvidenceData()
    ]
  }),
  rowData({
    workerId: worker779,
    hardeningArea: "form rejected-error preflight",
    admission: "accepted-private-form-action-rejected-error-preflight",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS[worker779],
    acceptedStatuses: PRIVATE_ADMISSION_808_REQUIRED_STATUSES[worker779],
    requiredFieldNames:
      PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES[worker779],
    evidence: [
      evidenceData({
        role: "worker-779-form-rejected-error-source",
        path: formActionsPath,
        tokens: [
          "privateFormActionRejectedErrorPreflightGateId",
          "privateFormActionRejectedErrorPreflightRecordType",
          "privateFormActionRejectedErrorPreflightStatus",
          "privateFormActionRejectedErrorPreflightRecordedStatus",
          "recordFormActionRejectedErrorPreflightWithGate",
          "describePrivateFormActionRejectedErrorPreflightGate",
          "createRejectedAsyncActionErrorMetadata",
          "createRejectedActionErrorPreflight",
          "createRejectedErrorResetActionPublicBlockers",
          "createPublicFormActionRejectedErrorPreflightBoundary",
          "publicSubmitDispatchReachable",
          "publicActionInvocationReachable",
          "publicErrorRoutingReachable",
          "rootErrorUpdateScheduled",
          "publicRootErrorCallbackInvoked"
        ]
      }),
      evidenceData({
        role: "worker-779-form-conformance-source",
        path: formConformanceSourcePath,
        tokens: [
          "assertPrivateFormActionRejectedErrorPreflightGate",
          "createFormActionRejectedErrorPreflightDiagnosticGate",
          "isPrivateFormActionRejectedErrorPreflightRecord",
          "getPrivateFormActionRejectedErrorPreflightRecordPayload",
          "assertRejectedErrorPreflightPublicBlockersFailClosed",
          "assertRejectedErrorPreflightPublicBoundaryFailClosed",
          "publicSubmitDispatchReachable",
          "publicErrorRoutingReachable"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker794,
    hardeningArea: "resource root-map conformance",
    admission: "accepted-private-resource-root-map-conformance-gate",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS[worker794],
    acceptedStatuses: PRIVATE_ADMISSION_808_REQUIRED_STATUSES[worker794],
    requiredFieldNames:
      PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES[worker794],
    evidence: [
      evidenceData({
        role: "worker-794-resource-conformance-test",
        path: resourceConformanceTestPath,
        tokens: [
          "createRootMapStoragePreflightConformanceScenario",
          "expectedSourceResourceMapCommitRowIds",
          "rootMapStoragePlan.rootMapStorageRowCount",
          "rootResourceStorageShape.hasHoistableStylesMap",
          "rootResourceStorageShape.hasHoistableScriptsMap",
          "rootMapStorageValidationBoundary.expectedSourceRowsValidated",
          "acceptedRootMapNames",
          "skipsPreloadPropsRootStorage",
          "rejectsStaleSourceRows",
          "privateResourceHintRootMapStoragePreflightStatus"
        ]
      }),
      evidenceData({
        role: "worker-794-resource-validation-source",
        path: resourceInternalsPath,
        tokens: [
          "createRootMapStorageValidationBoundary",
          "assertExpectedRootMapStorageSourceRows",
          "expectedSourceRowsValidated",
          "duplicateRootMapStorageRowCount",
          "staleRootMapStorageRowCount",
          "foreignRootMapStorageRowCount",
          "rootOwnerValidated",
          "validationMutatedRecords"
        ]
      }),
      packageExportEvidenceData()
    ]
  }),
  rowData({
    workerId: worker796,
    hardeningArea: "private admission 778-779 ledger",
    admission: "accepted-private-resource-form-static-admission-ledger",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS[worker796],
    acceptedStatuses: PRIVATE_ADMISSION_808_REQUIRED_STATUSES[worker796],
    requiredFieldNames:
      PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES[worker796],
    evidence: [
      evidenceData({
        role: "worker-796-ledger-source",
        path: ledger778779SourcePath,
        tokens: [
          "PRIVATE_ADMISSION_778_779_GATE_ID",
          "PRIVATE_ADMISSION_778_779_GATE_STATUS",
          "PRIVATE_ADMISSION_778_779_PUBLIC_COMPATIBILITY_CLAIMS",
          "PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS",
          "evaluatePrivateAdmission778779Gate",
          "rowCompatibilityClaimViolationIds",
          "publicBlockerViolationIds",
          "sideEffectClaimViolationIds",
          "staticReadOnlyRecognized"
        ]
      }),
      evidenceData({
        role: "worker-796-ledger-test",
        path: ledger778779TestPath,
        tokens: [
          "PRIVATE_ADMISSION_778_779_REQUIRED_ACCEPTED_DIAGNOSTICS",
          "PRIVATE_ADMISSION_778_779_REQUIRED_STATUSES",
          "PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS",
          "publicResourceRootMapStorageCompatibilityClaimed",
          "publicFormSubmitDispatchCompatibilityClaimed",
          "realFormAccepted",
          "privateAsyncActionCallbackPubliclyReachable",
          "packageCompatibilityClaimed",
          "exportsChanged"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker800,
    hardeningArea: "form rejected-error blocker hardening",
    admission: "accepted-private-form-rejected-error-blocker-hardening",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS[worker800],
    acceptedStatuses: PRIVATE_ADMISSION_808_REQUIRED_STATUSES[worker800],
    requiredFieldNames:
      PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES[worker800],
    evidence: [
      evidenceData({
        role: "worker-800-form-stale-rejection-source",
        path: formActionsPath,
        tokens: [
          "consumedFormActionRejectedErrorPreflightExecutions",
          "gateState.consumedRejectedExecutions",
          "normalizeFormActionRejectedErrorPreflightAdmission",
          "assertNoRejectedErrorPreflightRawAdmissionFields",
          "sourceAsyncCallbackExecutionId",
          "rejectsStaleRejections",
          "rejectsPublicDomMutation",
          "rejectsPackageCompatibilityClaims",
          "publicSubmitDispatchRequested",
          "publicFormSubmissionRequested",
          "actionInvocationRequested",
          "publicActionInvocationRequested",
          "publicRequestFormResetRequested",
          "domMutationRequested",
          "publicFormActionCompatibilityClaimed",
          "packageCompatibilityClaimed"
        ]
      }),
      evidenceData({
        role: "worker-800-form-hardening-conformance",
        path: formConformanceSourcePath,
        tokens: [
          "recordRejectedErrorPreflight",
          "privateFormActionRejectedErrorPreflightInvalidAdmissionCode",
          "sourceAsyncCallbackExecutionId",
          "publicDispatchRequested",
          "publicErrorRoutingRequested",
          "publicSubmitDispatchRequested",
          "publicFormSubmissionRequested",
          "actionInvocationRequested",
          "publicActionInvocationRequested",
          "domMutationRequested",
          "publicDomMutationRequested",
          "packageCompatibilityClaimed"
        ]
      }),
      evidenceData({
        role: "worker-800-form-package-test-boundary",
        path: formPackageTestPath,
        tokens: [
          "assertRejectedErrorPreflightPublicBlockersFailClosed",
          "assertRejectedErrorPreflightPublicBoundaryFailClosed",
          "publicSubmitDispatchReachable",
          "publicActionInvocationReachable",
          "publicErrorRoutingReachable",
          "actionInvocationRequested",
          "publicRequestFormResetRequested",
          "resetUpdateEnqueued",
          "afterMutationEffectsVisited",
          "publicFormActionCompatibilityClaimed",
          "packageCompatibilityClaimed"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker802,
    hardeningArea: "resource root-map negative matrix",
    admission: "accepted-private-resource-root-map-negative-matrix",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS[worker802],
    acceptedStatuses: PRIVATE_ADMISSION_808_REQUIRED_STATUSES[worker802],
    requiredFieldNames:
      PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES[worker802],
    evidence: [
      evidenceData({
        role: "worker-802-resource-negative-source",
        path: resourceInternalsPath,
        tokens: [
          "rejectsMixedRootMapRowKinds",
          "rejectsPreloadPropsRootStorageClaims",
          "rejectsPublicHeadMutationClaims",
          "rejectsStylesheetScriptLifecycleClaims",
          "rejectsPackageCompatibilityClaims",
          "assertNoRootMapStoragePreflightClaims",
          "assertNoRootMapStoragePreflightTargets",
          "assertNoRootMapStoragePreflightClaimFields",
          "publicStylesheetResourceBehavior",
          "publicStylesheetPrecedenceBehavior",
          "resourceFetchStarted",
          "scriptExecutionStarted",
          "packageCompatibilityClaimed",
          "rootManifestsOrLockfilesMutated",
          "exportsPrivateResourceHintRootMapStoragePreflight"
        ]
      }),
      evidenceData({
        role: "worker-802-resource-negative-conformance",
        path: resourceConformanceTestPath,
        tokens: [
          "rootStorageClaimFields",
          "headMutationClaimFields",
          "lifecycleClaimFields",
          "packageClaimFields",
          "blockedTargetFields",
          "rejectsPreloadPropsRootStorageClaims",
          "rejectsPublicHeadMutationClaims",
          "rejectsStylesheetScriptLifecycleClaims",
          "rejectsPackageCompatibilityClaims",
          "publicStylesheetResourceBehavior",
          "publicStylesheetPrecedenceBehavior",
          "scriptExecutionStarted",
          "rootManifestsOrLockfilesMutated",
          "packageExportCompatibilityClaimed"
        ]
      }),
      packageExportEvidenceData()
    ]
  })
]);

export const PRIVATE_ADMISSION_808_ROWS = freezeArray(
  privateAdmission808Rows.map((sourceRow) =>
    row({
      ...sourceRow,
      publicBlockers: falseRecord(PRIVATE_ADMISSION_808_PUBLIC_BLOCKER_FIELDS)
    })
  )
);

export function evaluatePrivateAdmission808Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const prior778779 = evaluatePrivateAdmission778779Gate({
    workspaceRoot
  });
  const rows = PRIVATE_ADMISSION_808_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((row) => row.workerId);
  const manifest = freezeRecord({
    expectedWorkerIds: PRIVATE_ADMISSION_808_WORKERS,
    actualWorkerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_808_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_808_WORKERS.includes(workerId)
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
          readError: evidenceRow.readError
        })
      )
  );
  const acceptedIdMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds"
  });
  const statusMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_808_REQUIRED_STATUSES,
    actualKey: "acceptedStatuses",
    expectedKey: "expectedAcceptedStatuses",
    actualKeyForViolation: "actualAcceptedStatuses"
  });
  const fieldNameMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES,
    actualKey: "requiredFieldNames",
    expectedKey: "expectedFieldNames",
    actualKeyForViolation: "actualFieldNames"
  });
  const publicBlockerKeyMismatches = evaluatedRows.flatMap((row) => {
    const actualKeys = Object.keys(row.publicBlockers);
    if (sameStringSet(PRIVATE_ADMISSION_808_PUBLIC_BLOCKER_FIELDS, actualKeys)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicBlockerFields:
          PRIVATE_ADMISSION_808_PUBLIC_BLOCKER_FIELDS,
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
    .filter(
      (row) =>
        row.sourceTokenChecksOnly !== true ||
        row.manifestEvaluationOnly !== true ||
        row.runtimeExecutionClaimed !== false ||
        row.publicRuntimeExecutionClaimed !== false ||
        row.packageCompatibilityClaimed !== false ||
        row.exportsChanged !== false ||
        row.ledgerEvaluationMode !== "source-token-checks-and-manifest-only"
    )
    .map((row) => row.workerId);
  const priorLedgerViolations =
    prior778779.status === PRIVATE_ADMISSION_778_779_GATE_STATUS &&
    prior778779.violations.length === 0
      ? []
      : [
          freezeRecord({
            gateId: PRIVATE_ADMISSION_778_779_GATE_ID,
            status: prior778779.status,
            violationIds: freezeArray(
              prior778779.violations.map((violation) => violation.id)
            )
          })
        ];

  const resourceLeakClaimIds = filterClaimIds(publicBlockerViolations, [
    "publicResourceApisReachable",
    "publicResourceHintCallsReachable",
    "publicResourceHintDomInsertion",
    "publicResourceMapCommitBehavior",
    "publicScriptModuleResourceDispatch",
    "publicStylesheetLoadStateDispatch",
    "publicStylesheetResourceBehavior",
    "publicStylesheetPrecedenceBehavior",
    "rootResourceStorageMutated",
    "hoistableStylesMapMutated",
    "hoistableScriptsMapMutated",
    "preloadPropsMapMutated",
    "realResourceMapsMutated",
    "fakeResourceMapsMutated"
  ]);
  const formLeakClaimIds = filterClaimIds(publicBlockerViolations, [
    "publicFormActionsEnabled",
    "publicFormSubmissionReachable",
    "publicSubmitDispatchReachable",
    "publicRequestFormResetReachable",
    "publicActionInvocationReachable",
    "publicErrorRoutingReachable",
    "realFormAccepted",
    "realFormInspected",
    "callbackDispatchExecuted",
    "submitCallbackInvoked",
    "actionFunctionCaptured",
    "actionInvocationRequested",
    "actionInvoked",
    "publicActionInvoked",
    "privateAsyncActionCallbackPubliclyReachable",
    "hostTransitionStarted",
    "previousDispatcherCalled",
    "resetFiberResolved",
    "resetStateQueued",
    "resetUpdateEnqueued",
    "publicRequestFormResetRequested",
    "afterMutationEffectsVisited",
    "resetFormInstanceCalled",
    "formResetCommitted",
    "realFormReset",
    "rootErrorUpdateScheduled",
    "publicRootErrorCallbackInvoked",
    "errorBoundaryScheduled",
    "reactUpdateQueued"
  ]);
  const domHeadLifecycleLeakClaimIds = filterClaimIds(publicBlockerViolations, [
    "publicDomMutationReachable",
    "domMutation",
    "publicDomMutationEnabled",
    "realDocumentMutated",
    "realHeadMutated",
    "fakeHeadMutated",
    "publicHeadSingletonBehavior",
    "publicSingletonBehavior",
    "singletonResolutionReachable",
    "headChildrenCleared",
    "resourceFetchStarted",
    "preloadStarted",
    "modulePreloadStarted",
    "scriptPreinitStarted",
    "moduleScriptPreinitStarted",
    "scriptExecutionStarted",
    "resourceLoadStateMutated",
    "stylesheetLoadStateMutated",
    "preloadOrStyleDomWorkDispatched",
    "loadEventSubscribed",
    "errorEventSubscribed"
  ]);
  const packageExportLeakClaimIds = filterClaimIds(publicBlockerViolations, [
    "packageCompatibilityClaimed",
    "packageExportCompatibilityClaimed",
    "packageExportsMutated",
    "packageJsonExportsMutated",
    "rootManifestsOrLockfilesMutated",
    "resourceFormGatesExported",
    "exportsPrivateResourceHintRootMapStoragePreflight",
    "publicPackageCompatibilityClaimed",
    "publicPackageExportsCompatibilityClaimed"
  ]);
  const publicCompatibilityClaimIds = filterClaimIds(publicBlockerViolations, [
    "publicResourceRootMapStorageCompatibilityClaimed",
    "publicFormRejectedErrorCompatibilityClaimed",
    "publicFormActionCompatibilityClaimed",
    "publicPackageCompatibilityClaimed",
    "publicPackageExportsCompatibilityClaimed",
    "publicCompatibilityClaimed",
    "compatibilityClaimed"
  ]);

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("resource-form-hardening-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "resource-form-hardening-evidence-token-missing",
    evidenceMismatches
  );
  pushRowsViolation(
    violations,
    "resource-form-hardening-accepted-id-mismatch",
    acceptedIdMismatches
  );
  pushRowsViolation(
    violations,
    "resource-form-hardening-status-mismatch",
    statusMismatches
  );
  pushRowsViolation(
    violations,
    "resource-form-hardening-field-name-mismatch",
    fieldNameMismatches
  );
  pushRowsViolation(
    violations,
    "resource-form-hardening-public-blocker-field-mismatch",
    publicBlockerKeyMismatches
  );
  pushRowsViolation(
    violations,
    "resource-form-hardening-prior-ledger-mismatch",
    priorLedgerViolations
  );
  pushIdsViolation(
    violations,
    "resource-form-hardening-static-mode-mismatch",
    staticReadOnlyViolations
  );
  pushClaimIdsViolation(
    violations,
    "resource-public-claim-detected",
    resourceLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "form-public-claim-detected",
    formLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "dom-head-or-lifecycle-claim-detected",
    domHeadLifecycleLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "package-or-export-compatibility-claim-detected",
    packageExportLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "public-compatibility-claim-detected",
    publicCompatibilityClaimIds
  );

  const evidenceRecognized = evidenceMismatches.length === 0;
  const acceptedIdsRecognized = acceptedIdMismatches.length === 0;
  const statusesRecognized = statusMismatches.length === 0;
  const fieldNamesRecognized = fieldNameMismatches.length === 0;
  const priorLedgerRecognized = priorLedgerViolations.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerKeyMismatches.length === 0 &&
    publicBlockerViolations.length === 0;
  const staticReadOnlyRecognized = staticReadOnlyViolations.length === 0;
  const privateHardeningRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    evidenceRecognized &&
    acceptedIdsRecognized &&
    statusesRecognized &&
    fieldNamesRecognized &&
    priorLedgerRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_808_GATE_ID,
    status: privateHardeningRecognized
      ? PRIVATE_ADMISSION_808_GATE_STATUS
      : PRIVATE_ADMISSION_808_VIOLATION_STATUS,
    privateHardeningRecognized,
    evidenceRecognized,
    acceptedIdsRecognized,
    statusesRecognized,
    fieldNamesRecognized,
    priorLedgerRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed: publicBlockerViolations.length > 0,
    publicCompatibilityClaimed: publicCompatibilityClaimIds.length > 0,
    queueWorkers: PRIVATE_ADMISSION_808_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => row.recognized === true)
        .map((row) => row.workerId)
    ),
    priorLedger: freezeRecord({
      gateId: PRIVATE_ADMISSION_778_779_GATE_ID,
      status: prior778779.status,
      recognized: priorLedgerRecognized
    }),
    resourceLeakClaimIds: freezeArray(resourceLeakClaimIds),
    formLeakClaimIds: freezeArray(formLeakClaimIds),
    domHeadLifecycleLeakClaimIds: freezeArray(domHeadLifecycleLeakClaimIds),
    packageExportLeakClaimIds: freezeArray(packageExportLeakClaimIds),
    publicCompatibilityClaimIds: freezeArray(publicCompatibilityClaimIds),
    publicBlockerViolationIds: freezeArray(publicBlockerViolations),
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
    acceptedDiagnosticIds: freezeArray(data.acceptedDiagnosticIds),
    acceptedStatuses: freezeArray(data.acceptedStatuses),
    requiredFieldNames: freezeArray(data.requiredFieldNames),
    evidence: freezeArray(data.evidence)
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

function packageExportEvidenceData() {
  return evidenceData({
    role: "react-dom-package-export-blocker",
    path: reactDomPackageJsonPath,
    tokens: [
      "\"./client\"",
      "\"./server\"",
      "\"./static\"",
      "\"./test-utils\"",
      "\"./package.json\""
    ],
    forbiddenTokens: [
      "\"./resource-form-gates\"",
      "\"./resource-form-internals-gate\"",
      "\"./shared/form-actions\"",
      "\"./private-resource-form\""
    ]
  });
}

function row(data) {
  return freezeRecord({
    ...data,
    sourceQueue: "778-779-794-796-800-802",
    ledgerEvaluationMode: "source-token-checks-and-manifest-only",
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    privateEvidenceOnly: true,
    runtimeExecutionClaimed: false,
    publicRuntimeExecutionClaimed: false,
    packageCompatibilityClaimed: false,
    exportsChanged: false,
    publicBlockers: freezeRecord(data.publicBlockers)
  });
}

function mergeRowOverride(baseRow, override) {
  return freezeRecord({
    ...baseRow,
    ...override,
    acceptedDiagnosticIds: freezeArray(
      override.acceptedDiagnosticIds ?? baseRow.acceptedDiagnosticIds
    ),
    acceptedStatuses: freezeArray(
      override.acceptedStatuses ?? baseRow.acceptedStatuses
    ),
    requiredFieldNames: freezeArray(
      override.requiredFieldNames ?? baseRow.requiredFieldNames
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
  const acceptedIdsRecognized = sameStringSet(
    PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS[row.workerId] ?? [],
    row.acceptedDiagnosticIds
  );
  const statusesRecognized = sameStringSet(
    PRIVATE_ADMISSION_808_REQUIRED_STATUSES[row.workerId] ?? [],
    row.acceptedStatuses
  );
  const fieldNamesRecognized = sameStringSet(
    PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES[row.workerId] ?? [],
    row.requiredFieldNames
  );
  const publicBlockerKeysRecognized = sameStringSet(
    PRIVATE_ADMISSION_808_PUBLIC_BLOCKER_FIELDS,
    Object.keys(row.publicBlockers)
  );
  const publicBlockerViolations = Object.entries(row.publicBlockers)
    .filter(([, value]) => value !== false)
    .map(([field]) => field);
  const staticReadOnlyRecognized =
    row.sourceTokenChecksOnly === true &&
    row.manifestEvaluationOnly === true &&
    row.runtimeExecutionClaimed === false &&
    row.publicRuntimeExecutionClaimed === false &&
    row.packageCompatibilityClaimed === false &&
    row.exportsChanged === false &&
    row.ledgerEvaluationMode === "source-token-checks-and-manifest-only";

  return freezeRecord({
    ...row,
    evidence: freezeArray(evaluatedEvidence),
    evidenceRecognized,
    acceptedIdsRecognized,
    statusesRecognized,
    fieldNamesRecognized,
    publicBlockerKeysRecognized,
    publicBlockerViolations: freezeArray(publicBlockerViolations),
    staticReadOnlyRecognized,
    recognized:
      evidenceRecognized === true &&
      acceptedIdsRecognized === true &&
      statusesRecognized === true &&
      fieldNamesRecognized === true &&
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

  return freezeRecord({
    ...evidenceRow,
    tokenResults: freezeArray(tokenResults),
    forbiddenTokenResults: freezeArray(forbiddenTokenResults),
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    recognized:
      source.ok === true &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0,
    readError: source.error
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
