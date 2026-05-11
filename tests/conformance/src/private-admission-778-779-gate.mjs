import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_778_779_GATE_ID =
  "private-admission-778-779-resource-form-ledger-1";
export const PRIVATE_ADMISSION_778_779_GATE_STATUS =
  "recognized-accepted-private-diagnostics-778-779-public-compatibility-blocked";
export const PRIVATE_ADMISSION_778_779_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-778-779-with-violations";

const worker778 = "worker-778-resource-root-map-storage-preflight";
const worker779 = "worker-779-form-action-rejected-error-preflight";

export const PRIVATE_ADMISSION_778_779_PUBLIC_COMPATIBILITY_CLAIMS =
  freezeArray([
    "publicResourceRootMapStorageCompatibilityClaimed",
    "publicResourceMapCommitCompatibilityClaimed",
    "publicResourceHintDomInsertionCompatibilityClaimed",
    "publicResourceDispatchCompatibilityClaimed",
    "publicScriptModuleResourceCompatibilityClaimed",
    "publicStylesheetLoadStateCompatibilityClaimed",
    "publicDomHeadMutationCompatibilityClaimed",
    "publicFormRejectedErrorCompatibilityClaimed",
    "publicFormSubmissionCompatibilityClaimed",
    "publicFormSubmitDispatchCompatibilityClaimed",
    "publicFormResetCompatibilityClaimed",
    "publicFormActionInvocationCompatibilityClaimed",
    "publicFormErrorRoutingCompatibilityClaimed",
    "publicReactUpdateCompatibilityClaimed",
    "publicPackageCompatibilityClaimed",
    "publicPackageExportsCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_778_779_BLOCKED_SURFACES = freezeArray([
  "react-dom-resource-root-map-storage",
  "react-dom-resource-map-commit-public-behavior",
  "react-dom-public-resource-dispatch",
  "react-dom-resource-dom-head-mutation",
  "react-dom-script-module-resource-dispatch",
  "react-dom-stylesheet-load-state-dispatch",
  "react-dom-form-rejected-error-preflight",
  "react-dom-public-form-submission",
  "react-dom-form-submit-dispatch",
  "react-dom-request-form-reset",
  "react-dom-form-action-invocation",
  "react-dom-form-error-routing",
  "react-dom-form-react-update-queue",
  "package-compatibility",
  "package-exports"
]);

export const PRIVATE_ADMISSION_778_779_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    [worker778]: freezeArray([
      "resource-hint-root-map-storage-preflight-private-gate-1",
      "fast.react_dom.private_resource_hint_root_map_storage_preflight_record",
      "resource-hint-root-map-storage-preflight",
      "react-19.2.6-resource-root-map-storage-preflight"
    ]),
    [worker779]: freezeArray([
      "form-action-rejected-error-preflight-private-gate-1",
      "fast.react_dom.private_form_action_rejected_error_preflight_record",
      "form-action-rejected-error-preflight.diagnostic",
      "form-action-rejected-error-preflight"
    ])
  });

export const PRIVATE_ADMISSION_778_779_REQUIRED_STATUSES = freezeRecord({
  [worker778]: freezeArray([
    "preflighted-private-resource-hint-root-map-storage-record",
    "diagnosed-private-resource-hint-root-map-storage-preflight",
    "blocked-private-resource-hint-root-map-storage-preflight-compatibility",
    "blocked-public-resource-root-map-storage",
    "validated-private-resource-root-map-storage-preflight"
  ]),
  [worker779]: freezeArray([
    "private-form-action-rejected-error-preflight-metadata-only",
    "recorded-private-form-action-rejected-error-preflight",
    "preflighted-private-form-action-rejected-error-metadata",
    "blocked-public-form-action-reset-and-rejected-error-routing",
    "blocked-public-form-action-rejected-error-preflight-compatibility"
  ])
});

export const PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS =
  freezeRecord({
    [worker778]: freezeArray([
      "publicResourceApisReachable",
      "publicResourceHintCallsReachable",
      "publicRootTouched",
      "rootResourceStorageCreated",
      "rootResourceStorageMutated",
      "realResourceMapsCreated",
      "realResourceMapsMutated",
      "fakeResourceMapsCreated",
      "fakeResourceMapsMutated",
      "hoistableStylesMapMutated",
      "hoistableScriptsMapMutated",
      "publicResourceHintDomInsertion",
      "publicResourceMapCommitBehavior",
      "publicScriptModuleResourceDispatch",
      "publicStylesheetLoadStateDispatch",
      "compatibilityClaimed"
    ]),
    [worker779]: freezeArray([
      "publicFormActionsEnabled",
      "publicFormSubmissionReachable",
      "publicSubmitDispatchReachable",
      "publicRequestFormResetReachable",
      "publicActionInvocationReachable",
      "publicErrorRoutingReachable",
      "publicRootTouched",
      "realFormAccepted",
      "realFormInspected",
      "formDataConstructed",
      "syntheticEventCreated",
      "callbackDispatchExecuted",
      "submitCallbackInvoked",
      "actionFunctionCaptured",
      "actionInvoked",
      "publicActionInvoked",
      "privateAsyncActionCallbackPubliclyReachable",
      "hostTransitionStarted",
      "reactUpdateQueued",
      "previousDispatcherCalled",
      "resetFiberResolved",
      "resetStateQueued",
      "resetFormInstanceCalled",
      "formResetCommitted",
      "rootErrorUpdateScheduled",
      "publicRootErrorCallbackInvoked",
      "errorBoundaryScheduled",
      "realFormReset",
      "compatibilityClaimed"
    ])
  });

const privateAdmission778779Rows = freezeArray([
  rowData({
    workerId: worker778,
    area: "resource root-map storage preflight",
    privateAdmission: "accepted-private-resource-root-map-storage-preflight",
    primaryCompatibilityArea:
      "resource-root-map-storage-public-resource-dispatch-blocked",
    runtimeCapabilityAdded: true,
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_778_779_REQUIRED_ACCEPTED_DIAGNOSTICS[worker778],
    acceptedDiagnosticStatuses:
      PRIVATE_ADMISSION_778_779_REQUIRED_STATUSES[worker778],
    requiredPublicBlockerFields:
      PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS[worker778],
    compatibilityBlockers: falseRecord(
      PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS[worker778]
    ),
    evidence: [
      evidenceData({
        role: "worker-778-source-gate",
        path: "packages/react-dom/src/resource-form-internals-gate.js",
        tokens: [
          "privateResourceHintRootMapStoragePreflightGateId",
          "resource-hint-root-map-storage-preflight-private-gate-1",
          "privateResourceHintRootMapStoragePreflightRecordType",
          "fast.react_dom.private_resource_hint_root_map_storage_preflight_record",
          "privateResourceHintRootMapStoragePreflightStatus",
          "preflighted-private-resource-hint-root-map-storage-record",
          "privateResourceHintRootMapStoragePreflightExecutionStatus",
          "diagnosed-private-resource-hint-root-map-storage-preflight",
          "privateResourceHintRootMapStoragePreflightCompatibilityBlockedStatus",
          "blocked-private-resource-hint-root-map-storage-preflight-compatibility",
          "createResourceHintRootMapStoragePreflightGate",
          "recordResourceHintRootMapStoragePreflightWithGate",
          "describePrivateResourceHintRootMapStoragePreflightGate",
          "resourceHintRootMapStoragePreflightBlockedSideEffects",
          "createPublicResourceRootMapStorageBoundary",
          "normalizeResourceHintRootMapStoragePreflightAdmission",
          "assertNoRootMapStoragePreflightTargets",
          "assertNoPublicResourceDispatchClaims",
          "createRootMapStorageValidationBoundary",
          "validated-private-resource-root-map-storage-preflight",
          "resourceHintRootMapStoragePreflightContracts",
          "publicResourceHintDomInsertion",
          "publicResourceMapCommitBehavior",
          "rootResourceStorageMutated",
          "hoistableStylesMapMutated",
          "hoistableScriptsMapMutated"
        ]
      })
    ],
    guardIds: [
      "canonical-root-map-storage-rows-only",
      "preload-props-root-storage-skipped",
      "stale-duplicate-foreign-root-map-storage-rejected",
      "raw-root-map-targets-rejected",
      "public-resource-dispatch-claims-rejected"
    ]
  }),
  rowData({
    workerId: worker779,
    area: "form action rejected-error preflight",
    privateAdmission: "accepted-private-form-action-rejected-error-preflight",
    primaryCompatibilityArea:
      "form-action-rejected-error-public-submit-reset-action-routing-blocked",
    runtimeCapabilityAdded: true,
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_778_779_REQUIRED_ACCEPTED_DIAGNOSTICS[worker779],
    acceptedDiagnosticStatuses:
      PRIVATE_ADMISSION_778_779_REQUIRED_STATUSES[worker779],
    requiredPublicBlockerFields:
      PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS[worker779],
    compatibilityBlockers: falseRecord(
      PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS[worker779]
    ),
    evidence: [
      evidenceData({
        role: "worker-779-source-gate",
        path: "packages/react-dom/src/shared/form-actions.js",
        tokens: [
          "privateFormActionRejectedErrorPreflightGateId",
          "form-action-rejected-error-preflight-private-gate-1",
          "privateFormActionRejectedErrorPreflightRecordType",
          "fast.react_dom.private_form_action_rejected_error_preflight_record",
          "privateFormActionRejectedErrorPreflightStatus",
          "private-form-action-rejected-error-preflight-metadata-only",
          "privateFormActionRejectedErrorPreflightRecordedStatus",
          "recorded-private-form-action-rejected-error-preflight",
          "preflighted-private-form-action-rejected-error-metadata",
          "blocked-public-form-action-reset-and-rejected-error-routing",
          "blocked-public-form-action-rejected-error-preflight-compatibility",
          "createFormActionRejectedErrorPreflightDiagnosticGate",
          "recordFormActionRejectedErrorPreflightWithGate",
          "describePrivateFormActionRejectedErrorPreflightGate",
          "formActionRejectedErrorPreflightBlockedSideEffects",
          "formActionRejectedErrorPreflightDiagnosticSideEffects",
          "createRejectedErrorResetActionPublicBlockers",
          "createPublicFormActionRejectedErrorPreflightBoundary",
          "normalizeFormActionRejectedErrorPreflightAdmission",
          "assertNoRejectedErrorPreflightRawAdmissionFields",
          "privateFormActionRejectedErrorPreflightInvalidAdmissionCode",
          "privateFormActionRejectedErrorPreflightInvalidRecordCode",
          "publicSubmitDispatchReachable",
          "realFormAccepted",
          "realFormInspected",
          "callbackDispatchExecuted",
          "actionFunctionCaptured",
          "hostTransitionStarted",
          "previousDispatcherCalled",
          "resetFiberResolved",
          "resetStateQueued",
          "resetFormInstanceCalled",
          "formResetCommitted",
          "rootErrorUpdateScheduled",
          "realFormReset"
        ]
      }),
      evidenceData({
        role: "worker-779-conformance-gate",
        path: "tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs",
        tokens: [
          "assertPrivateFormActionRejectedErrorPreflightGate",
          "createFormActionRejectedErrorPreflightDiagnosticGate",
          "privateFormActionRejectedErrorPreflightStatus",
          "privateFormActionRejectedErrorPreflightRecordedStatus",
          "formActionRejectedErrorPreflightDiagnosticSideEffects",
          "privateFormActionRejectedErrorPreflightInvalidAdmissionCode",
          "privateFormActionRejectedErrorPreflightInvalidRecordCode"
        ]
      })
    ],
    guardIds: [
      "accepted-rejected-async-callback-only",
      "stale-foreign-fulfilled-rejections-rejected",
      "public-submit-dispatch-rejected",
      "public-error-routing-rejected",
      "raw-error-form-action-targets-rejected"
    ]
  })
]);

export const PRIVATE_ADMISSION_778_779_ROWS = freezeArray(
  privateAdmission778779Rows.map((sourceRow) =>
    row({
      ...sourceRow,
      publicCompatibilityClaims: falseRecord(
        PRIVATE_ADMISSION_778_779_PUBLIC_COMPATIBILITY_CLAIMS
      )
    })
  )
);

export const PRIVATE_ADMISSION_778_779_WORKERS = freezeArray(
  PRIVATE_ADMISSION_778_779_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission778779Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  compatibilityClaimed = false,
  publicCompatibilityClaimed = false
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_778_779_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((baseRow) => baseRow.workerId);
  const missingWorkerIds = PRIVATE_ADMISSION_778_779_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_778_779_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = manifestWorkerIds.filter(
    (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
  );
  const unrecognizedWorkerIds = evaluatedRows
    .filter((evaluatedRow) => evaluatedRow.recognized !== true)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const evidenceMissingWorkerIds = evaluatedRows
    .filter((evaluatedRow) => evaluatedRow.evidenceRecognized !== true)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const diagnosticMismatches = evaluatedRows.flatMap((evaluatedRow) =>
    createExpectedSetMismatch({
      workerId: evaluatedRow.workerId,
      expected:
        PRIVATE_ADMISSION_778_779_REQUIRED_ACCEPTED_DIAGNOSTICS[
          evaluatedRow.workerId
        ] ?? [],
      actual: evaluatedRow.acceptedDiagnosticIds,
      expectedKey: "expectedDiagnosticIds",
      actualKey: "actualDiagnosticIds"
    })
  );
  const statusMismatches = evaluatedRows.flatMap((evaluatedRow) =>
    createExpectedSetMismatch({
      workerId: evaluatedRow.workerId,
      expected:
        PRIVATE_ADMISSION_778_779_REQUIRED_STATUSES[evaluatedRow.workerId] ??
        [],
      actual: evaluatedRow.acceptedDiagnosticStatuses,
      expectedKey: "expectedStatuses",
      actualKey: "actualStatuses"
    })
  );
  const blockerFieldMismatches = evaluatedRows.flatMap((evaluatedRow) =>
    createExpectedSetMismatch({
      workerId: evaluatedRow.workerId,
      expected:
        PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS[
          evaluatedRow.workerId
        ] ?? [],
      actual: evaluatedRow.requiredPublicBlockerFields,
      expectedKey: "expectedBlockerFields",
      actualKey: "actualBlockerFields"
    })
  );
  const publicClaimKeyMismatches = evaluatedRows.flatMap((evaluatedRow) =>
    createExpectedSetMismatch({
      workerId: evaluatedRow.workerId,
      expected: PRIVATE_ADMISSION_778_779_PUBLIC_COMPATIBILITY_CLAIMS,
      actual: Object.keys(evaluatedRow.publicCompatibilityClaims),
      expectedKey: "expectedPublicClaims",
      actualKey: "actualPublicClaims"
    })
  );
  const publicCompatibilityViolations = evaluatedRows.flatMap((evaluatedRow) =>
    [
      ...evaluatedRow.publicCompatibilityViolations,
      ...evaluatedRow.rowPublicCompatibilityClaimViolations
    ].map((claimId) => `${evaluatedRow.workerId}.${claimId}`)
  );
  const rowCompatibilityClaimViolations = evaluatedRows.flatMap(
    (evaluatedRow) =>
      evaluatedRow.rowCompatibilityClaimViolations.map(
        (claimId) => `${evaluatedRow.workerId}.${claimId}`
      )
  );
  const publicBlockerViolations = evaluatedRows.flatMap((evaluatedRow) =>
    evaluatedRow.publicBlockerViolations.map(
      (field) => `${evaluatedRow.workerId}.${field}`
    )
  );
  const sideEffectClaimViolations = evaluatedRows.flatMap((evaluatedRow) =>
    evaluatedRow.sideEffectClaimViolations.map(
      (field) => `${evaluatedRow.workerId}.${field}`
    )
  );
  const staticLedgerViolations = evaluatedRows
    .filter((evaluatedRow) => evaluatedRow.staticReadOnlyRecognized !== true)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const topLevelCompatibilityViolations = [];
  if (compatibilityClaimed !== false) {
    topLevelCompatibilityViolations.push("gate.compatibilityClaimed");
  }
  if (publicCompatibilityClaimed !== false) {
    topLevelCompatibilityViolations.push("gate.publicCompatibilityClaimed");
  }
  const violations = [];

  if (
    missingWorkerIds.length > 0 ||
    unexpectedWorkerIds.length > 0 ||
    duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("accepted-private-worker-manifest-mismatch", {
        missingWorkerIds,
        unexpectedWorkerIds,
        duplicateWorkerIds
      })
    );
  }

  if (evidenceMissingWorkerIds.length > 0) {
    violations.push(
      createViolation("required-private-admission-evidence-token-missing", {
        workerIds: evidenceMissingWorkerIds
      })
    );
  }

  if (diagnosticMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-id-mismatch", {
        rows: diagnosticMismatches
      })
    );
  }

  if (statusMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-status-mismatch", {
        rows: statusMismatches
      })
    );
  }

  if (blockerFieldMismatches.length > 0) {
    violations.push(
      createViolation("public-compatibility-blocker-field-mismatch", {
        rows: blockerFieldMismatches
      })
    );
  }

  if (publicClaimKeyMismatches.length > 0) {
    violations.push(
      createViolation("public-compatibility-claim-key-mismatch", {
        rows: publicClaimKeyMismatches
      })
    );
  }

  if (rowCompatibilityClaimViolations.length > 0) {
    violations.push(
      createViolation("private-diagnostic-claimed-compatibility", {
        claimIds: rowCompatibilityClaimViolations
      })
    );
  }

  if (publicCompatibilityViolations.length > 0) {
    violations.push(
      createViolation("public-compatibility-claim-detected", {
        claimIds: publicCompatibilityViolations
      })
    );
  }

  if (publicBlockerViolations.length > 0) {
    violations.push(
      createViolation("public-compatibility-blocker-leak", {
        blockerIds: publicBlockerViolations
      })
    );
  }

  if (sideEffectClaimViolations.length > 0) {
    violations.push(
      createViolation("runtime-or-package-surface-claim-detected", {
        claimIds: sideEffectClaimViolations
      })
    );
  }

  if (staticLedgerViolations.length > 0) {
    violations.push(
      createViolation("static-ledger-mode-mismatch", {
        workerIds: staticLedgerViolations
      })
    );
  }

  if (topLevelCompatibilityViolations.length > 0) {
    violations.push(
      createViolation("top-level-compatibility-claim-detected", {
        claimIds: freezeArray(topLevelCompatibilityViolations)
      })
    );
  }

  if (unrecognizedWorkerIds.length > 0) {
    violations.push(
      createViolation("required-private-admission-row-not-recognized", {
        workerIds: unrecognizedWorkerIds
      })
    );
  }

  return freezeRecord({
    id: PRIVATE_ADMISSION_778_779_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_778_779_GATE_STATUS
        : PRIVATE_ADMISSION_778_779_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_778_779_WORKERS,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: freezeRecord(
      Object.fromEntries(
        evaluatedRows.map((evaluatedRow) => [
          evaluatedRow.workerId,
          evaluatedRow
        ])
      )
    ),
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((evaluatedRow) => evaluatedRow.recognized === true)
        .map((evaluatedRow) => evaluatedRow.workerId)
    ),
    privateDiagnosticsRecognized:
      unrecognizedWorkerIds.length === 0 &&
      diagnosticMismatches.length === 0 &&
      statusMismatches.length === 0 &&
      missingWorkerIds.length === 0 &&
      unexpectedWorkerIds.length === 0 &&
      duplicateWorkerIds.length === 0,
    evidenceRecognized: evidenceMissingWorkerIds.length === 0,
    blockedPublicSurfacesRecognized:
      blockerFieldMismatches.length === 0 &&
      publicBlockerViolations.length === 0,
    blockedPublicClaimsRecognized:
      publicClaimKeyMismatches.length === 0 &&
      publicCompatibilityViolations.length === 0,
    staticReadOnlyRecognized:
      staticLedgerViolations.length === 0 &&
      topLevelCompatibilityViolations.length === 0,
    runtimeExecutionClaimed: sideEffectClaimViolations.some((claimId) =>
      claimId.endsWith(".runtimeExecutionClaimed")
    ),
    packageCompatibilityClaimed: sideEffectClaimViolations.some((claimId) =>
      claimId.endsWith(".packageCompatibilityClaimed")
    ),
    exportsChanged: sideEffectClaimViolations.some((claimId) =>
      claimId.endsWith(".exportsChanged")
    ),
    compatibilityClaimed:
      compatibilityClaimed !== false ||
      publicCompatibilityClaimed !== false ||
      rowCompatibilityClaimViolations.length > 0 ||
      publicCompatibilityViolations.length > 0 ||
      publicBlockerViolations.length > 0 ||
      sideEffectClaimViolations.length > 0,
    publicCompatibilityClaimed:
      publicCompatibilityClaimed !== false ||
      publicCompatibilityViolations.length > 0 ||
      publicBlockerViolations.length > 0,
    rowCompatibilityClaimViolationIds: freezeArray(
      rowCompatibilityClaimViolations
    ),
    publicCompatibilityViolationIds: freezeArray(
      publicCompatibilityViolations
    ),
    publicBlockerViolationIds: freezeArray(publicBlockerViolations),
    sideEffectClaimViolationIds: freezeArray(sideEffectClaimViolations),
    manifest: freezeRecord({
      expectedWorkerIds: PRIVATE_ADMISSION_778_779_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds)
    }),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    acceptedDiagnosticIds: freezeArray(data.acceptedDiagnosticIds),
    acceptedDiagnosticStatuses: freezeArray(data.acceptedDiagnosticStatuses),
    requiredPublicBlockerFields: freezeArray(data.requiredPublicBlockerFields),
    compatibilityBlockers: freezeRecord(data.compatibilityBlockers),
    evidence: freezeArray(data.evidence),
    guardIds: freezeArray(data.guardIds)
  });
}

function evidenceData({ role, path, tokens }) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens)
  });
}

function row(data) {
  const sideEffectClaims = falseRecord([
    "runtimeExecutionClaimed",
    "publicResourcesClaimed",
    "publicFormsClaimed",
    "domHeadMutationClaimed",
    "submitDispatchClaimed",
    "resetInvocationClaimed",
    "actionInvocationClaimed",
    "packageCompatibilityClaimed",
    "exportsChanged"
  ]);

  return freezeRecord({
    ...data,
    sourceQueue: "778-779",
    localGateCoverage: "private-admission-778-779-resource-form-ledger",
    runtimeCapabilityAdded: data.runtimeCapabilityAdded,
    compatibilityClaimed: false,
    publicCompatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    publicRuntimeExecutionClaimed: false,
    publicCompatibilityClaims: freezeRecord(data.publicCompatibilityClaims),
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_778_779_BLOCKED_SURFACES,
    sideEffectClaims,
    packageCompatibilityClaimed: false,
    exportsChanged: false
  });
}

function mergeRowOverride(baseRow, override) {
  return freezeRecord({
    ...baseRow,
    ...override,
    acceptedDiagnosticIds: freezeArray(
      override.acceptedDiagnosticIds ?? baseRow.acceptedDiagnosticIds
    ),
    acceptedDiagnosticStatuses: freezeArray(
      override.acceptedDiagnosticStatuses ?? baseRow.acceptedDiagnosticStatuses
    ),
    requiredPublicBlockerFields: freezeArray(
      override.requiredPublicBlockerFields ??
        baseRow.requiredPublicBlockerFields
    ),
    publicCompatibilityClaims: freezeRecord({
      ...baseRow.publicCompatibilityClaims,
      ...(override.publicCompatibilityClaims ?? {})
    }),
    compatibilityBlockers: freezeRecord({
      ...baseRow.compatibilityBlockers,
      ...(override.compatibilityBlockers ?? {})
    }),
    sideEffectClaims: freezeRecord({
      ...baseRow.sideEffectClaims,
      ...(override.sideEffectClaims ?? {})
    }),
    evidence: freezeArray(override.evidence ?? baseRow.evidence),
    guardIds: freezeArray(override.guardIds ?? baseRow.guardIds)
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
  const diagnosticsRecognized = sameStringSet(
    PRIVATE_ADMISSION_778_779_REQUIRED_ACCEPTED_DIAGNOSTICS[row.workerId] ??
      [],
    row.acceptedDiagnosticIds
  );
  const statusesRecognized = sameStringSet(
    PRIVATE_ADMISSION_778_779_REQUIRED_STATUSES[row.workerId] ?? [],
    row.acceptedDiagnosticStatuses
  );
  const blockerFieldsRecognized = sameStringSet(
    PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS[row.workerId] ?? [],
    row.requiredPublicBlockerFields
  );
  const claimKeysRecognized = sameStringSet(
    PRIVATE_ADMISSION_778_779_PUBLIC_COMPATIBILITY_CLAIMS,
    Object.keys(row.publicCompatibilityClaims)
  );
  const publicCompatibilityViolations = Object.entries(
    row.publicCompatibilityClaims
  )
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);
  const rowCompatibilityClaimViolations =
    row.compatibilityClaimed === false ? [] : ["compatibilityClaimed"];
  const rowPublicCompatibilityClaimViolations =
    row.publicCompatibilityClaimed === false
      ? []
      : ["publicCompatibilityClaimed"];
  const publicBlockerViolations = row.requiredPublicBlockerFields.filter(
    (field) => row.compatibilityBlockers[field] !== false
  );
  const sideEffectClaimViolations = Object.entries(row.sideEffectClaims)
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);
  const staticReadOnlyRecognized =
    row.sourceTokenChecksOnly === true &&
    row.manifestEvaluationOnly === true &&
    row.runtimeExecutionClaimed === false &&
    row.publicRuntimeExecutionClaimed === false &&
    row.packageCompatibilityClaimed === false &&
    row.exportsChanged === false &&
    row.compatibilityClaimed === false &&
    row.publicCompatibilityClaimed === false;

  return freezeRecord({
    ...row,
    evidence: freezeArray(evaluatedEvidence),
    evidenceRecognized,
    diagnosticsRecognized,
    statusesRecognized,
    blockerFieldsRecognized,
    claimKeysRecognized,
    publicCompatibilityViolations: freezeArray(publicCompatibilityViolations),
    rowCompatibilityClaimViolations: freezeArray(
      rowCompatibilityClaimViolations
    ),
    rowPublicCompatibilityClaimViolations: freezeArray(
      rowPublicCompatibilityClaimViolations
    ),
    publicBlockerViolations: freezeArray(publicBlockerViolations),
    sideEffectClaimViolations: freezeArray(sideEffectClaimViolations),
    staticReadOnlyRecognized,
    recognized:
      evidenceRecognized === true &&
      diagnosticsRecognized === true &&
      statusesRecognized === true &&
      blockerFieldsRecognized === true &&
      claimKeysRecognized === true &&
      publicCompatibilityViolations.length === 0 &&
      rowCompatibilityClaimViolations.length === 0 &&
      rowPublicCompatibilityClaimViolations.length === 0 &&
      publicBlockerViolations.length === 0 &&
      sideEffectClaimViolations.length === 0 &&
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
  const missingTokens = tokenResults
    .filter((tokenResult) => tokenResult.present !== true)
    .map((tokenResult) => tokenResult.token);

  return freezeRecord({
    ...evidenceRow,
    tokenResults: freezeArray(tokenResults),
    missingTokens: freezeArray(missingTokens),
    recognized: source.ok === true && missingTokens.length === 0,
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

function createExpectedSetMismatch({
  workerId,
  expected,
  actual,
  expectedKey,
  actualKey
}) {
  if (sameStringSet(expected, actual) === true) {
    return [];
  }

  return [
    freezeRecord({
      workerId,
      [expectedKey]: freezeArray(expected),
      [actualKey]: freezeArray(actual)
    })
  ];
}

function falseRecord(keys) {
  return freezeRecord(
    Object.fromEntries(keys.map((key) => [key, false]))
  );
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
