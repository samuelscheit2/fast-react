import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_805_GATE_ID =
  "private-admission-805-scheduler-diagnostics-ledger-1";
export const PRIVATE_ADMISSION_805_GATE_STATUS =
  "recognized-accepted-private-scheduler-diagnostics-public-flush-blocked";
export const PRIVATE_ADMISSION_805_VIOLATION_STATUS =
  "blocked-accepted-private-scheduler-diagnostics-with-violations";

const worker791 = "worker-791-scheduler-source-proof-private-diagnostics";
const worker792 = "worker-792-react-delayed-renderer-root-preflight";
const worker793 = "worker-793-delayed-renderer-root-negative-coverage";
const worker798 = "worker-798-scheduler-private-diagnostics-integrity";

export const PRIVATE_ADMISSION_805_WORKERS = freezeArray([
  worker791,
  worker792,
  worker793,
  worker798
]);

export const PRIVATE_ADMISSION_805_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicCompatibilityClaimed",
  "compatibilityClaimed",
  "packageCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "publicSchedulerTimingCompatibilityClaimed",
  "publicSchedulerFlushHelperCompatibilityClaimed",
  "publicSchedulerFlushBehaviorExecuted",
  "publicSchedulerFlushExecutionAvailable",
  "routesAcceptedMockSchedulerFlushHelperMetadata",
  "invokesPublicSchedulerFlushHelper",
  "schedulerTimingAdmissionClaimed",
  "schedulerDelayedActRootAdmissionClaimed",
  "schedulerDelayedRendererRootAdmissionClaimed",
  "publicReactActCompatibilityClaimed",
  "publicRootSchedulerCompatibilityClaimed",
  "publicRendererCompatibilityClaimed",
  "acceptsTopLevelDelayedActRootWorkAsPublicActEvidence",
  "queueFlushingReady",
  "rendererRootsReady",
  "passiveEffectsReady",
  "continuationFlushingReady",
  "drainsPublicSchedulerTaskQueue",
  "drainsPublicReactActQueue",
  "executesQueuedWork",
  "executesEffects",
  "executesRendererWork",
  "executesRendererRoots"
]);

export const PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    [worker791]: freezeArray([
      "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
      "private-scheduler-act-queue-flush-diagnostics",
      "fast-react.scheduler.mock-expired-act-root-work-source-validator",
      "providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics",
      "schedulerMockExpiredActRootWorkSourceValidator",
      "isSchedulerMockExpiredActRootWorkSource"
    ]),
    [worker792]: freezeArray([
      "fast-react.scheduler.mock-delayed-act-root-work-diagnostics",
      "preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics",
      "produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata",
      "accepted-renderer-root-metadata",
      "accepted-private-delayed-renderer-root-work-metadata-for-diagnostics",
      "sourceEvidenceMatches"
    ]),
    [worker793]: freezeArray([
      "fast-react.scheduler.mock-delayed-renderer-root-work-metadata",
      "accepted-private-delayed-renderer-root-work-metadata-for-diagnostics",
      "produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff",
      "renderer-root-metadata-public-claim",
      "renderer-root-metadata-execution-claim",
      "renderer-root-metadata-policy",
      "renderer-root-producer-scheduled-virtual-time-mismatch",
      "metadata-source-renderer-root-signature-mismatch"
    ]),
    [worker798]: freezeArray([
      "publicSchedulerFlushHelperCompatibilityClaimed",
      "publicSchedulerFlushBehaviorExecuted",
      "packageCompatibilityClaimed",
      "invokesPublicSchedulerFlushHelper",
      "routesAcceptedMockSchedulerFlushHelperMetadata",
      "schedulerDelayedRendererRootAdmissionClaimed",
      "fast-react.scheduler.mock-expired-act-root-work-source-proof",
      "fast-react.scheduler.mock-expired-act-root-work-source-validator"
    ])
  });

export const PRIVATE_ADMISSION_805_REQUIRED_STATUSES = freezeRecord({
  [worker791]: freezeArray([
    "private-scheduler-act-queue-flush-diagnostics",
    "fast-react.scheduler.mock-expired-act-root-work-source-validator"
  ]),
  [worker792]: freezeArray([
    "preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics",
    "drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
    "drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
    "produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata"
  ]),
  [worker793]: freezeArray([
    "accepted-private-delayed-renderer-root-work-metadata-for-diagnostics",
    "produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff",
    "renderer-root-metadata-public-claim",
    "renderer-root-metadata-execution-claim",
    "renderer-root-metadata-policy",
    "renderer-root-producer-priority-timeout-mismatch",
    "renderer-root-metadata-source-proof",
    "metadata-source-renderer-root-signature-mismatch"
  ]),
  [worker798]: freezeArray([
    "metadata-public-claim",
    "metadata-execution-claim",
    "producer-public-claim",
    "producer-execution-claim",
    "scheduler-expired-act-root-diagnostics-source-proof",
    "scheduler-delayed-act-root-diagnostics-source-proof",
    "scheduler-delayed-act-root-diagnostics-public-claim"
  ])
});

export const PRIVATE_ADMISSION_805_REQUIRED_REQUIREMENTS = freezeRecord({
  [worker791]: freezeRecord({
    sourceValidatorPrivateDiagnosticsOnly: true,
    privateDiagnosticsFrozen: true,
    validatorFrozen: true,
    helperOwnKeysAbsent: true,
    helperSymbolAliasesAbsent: true,
    reactConsumerLoadsValidatorFromPrivateDiagnostics: true,
    schedulerInternalsExecuted: false,
    staticReadOnlyLedger: true
  }),
  [worker792]: freezeRecord({
    delayedRendererRootPreflightOnly: true,
    delayedRendererRootEvidenceNestedPrivateOnly: true,
    rendererRootSourceEvidencePresent: true,
    rendererRootSourceEvidenceOwned: true,
    sourceEvidenceMatches: true,
    topLevelDelayedActRootWorkPublicEvidenceBlocked: true,
    nestedExpiredDiagnosticsConsumedOnlyAfterPreflight: true,
    schedulerInternalsExecuted: false,
    staticReadOnlyLedger: true
  }),
  [worker793]: freezeRecord({
    delayedRendererRootProducerEvidenceOnly: true,
    delayedRendererRootEvidenceNestedPrivateOnly: true,
    rendererRootPublicClaimsRejected: true,
    rendererRootPublicFlushExecutionRejected: true,
    rendererRootTimingMismatchesRejected: true,
    rendererRootRequestMutationRejected: true,
    privateActRootHandoffOnly: true,
    schedulerInternalsExecuted: false,
    staticReadOnlyLedger: true
  }),
  [worker798]: freezeRecord({
    publicPackageHelperFlushClaimsRejected: true,
    publicSchedulerTimingFlushClaimsRejected: true,
    helperOwnKeysAbsent: true,
    helperSymbolAliasesAbsent: true,
    fakeValidatorMutationRejected: true,
    oldGlobalSourceProofRejected: true,
    sourceValidatorPrivateDiagnosticsOnly: true,
    schedulerInternalsExecuted: false,
    staticReadOnlyLedger: true
  })
});

const schedulerMockSourcePath = "packages/scheduler/unstable_mock.js";
const reactActGatePath = "packages/react/private-act-dispatcher-gate.js";
const schedulerNativeEntryTestPath =
  "tests/conformance/test/scheduler-native-entry-oracle.test.mjs";
const schedulerDelayedTestPath =
  "tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs";
const schedulerExpiredLaneTestPath =
  "tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs";
const schedulerMockOracleTestPath =
  "tests/conformance/test/scheduler-mock-oracle.test.mjs";
const reactActOracleTestPath =
  "tests/conformance/test/react-act-oracle.test.mjs";
const packageSurfaceGuardPath = "tests/smoke/package-surface-guard.mjs";
const importEntrySmokePath = "tests/smoke/import-entrypoints.mjs";

const rowData805 = freezeArray([
  rowData({
    workerId: worker791,
    area: "Scheduler mock source validator moved behind frozen private diagnostics",
    privateAdmission:
      "accepted-private-scheduler-source-validator-diagnostics",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS[worker791],
    acceptedDiagnosticStatuses:
      PRIVATE_ADMISSION_805_REQUIRED_STATUSES[worker791],
    requirements: PRIVATE_ADMISSION_805_REQUIRED_REQUIREMENTS[worker791],
    evidenceRows: [
      evidenceData({
        role: "worker-791-scheduler-private-diagnostics-source",
        path: schedulerMockSourcePath,
        tokens: [
          "privateActQueueFlushDiagnosticsExport",
          "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
          "schedulerMockExpiredActRootWorkSourceValidator",
          "providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics",
          "freezeSchedulerOwnedExpiredActRootWorkSource",
          "isSchedulerMockExpiredActRootWorkSource",
          "shouldAttachPrivateActQueueFlushDiagnostics"
        ]
      }),
      evidenceData({
        role: "worker-791-react-private-diagnostics-consumer",
        path: reactActGatePath,
        tokens: [
          "getSchedulerMockExpiredActRootWorkSourceValidator",
          "Object.getOwnPropertyDescriptor",
          "privateActQueueFlushDiagnosticsExport",
          "Object.isFrozen(value)",
          "validator.isSchedulerMockExpiredActRootWorkSource(value)"
        ]
      }),
      evidenceData({
        role: "worker-791-helper-key-symbol-absence",
        path: schedulerNativeEntryTestPath,
        tokens: [
          "assertSchedulerMockSourceValidatorOnlyThroughPrivateDiagnostics",
          "schedulerMockExpiredActRootWorkSourceValidator",
          "isSchedulerMockExpiredActRootWorkSource",
          "privateSymbolDescriptions(helper)",
          "fast-react.scheduler.mock-expired-act-root-work-source-validator"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker792,
    area: "React preflight for delayed renderer-root Scheduler evidence",
    privateAdmission:
      "accepted-private-delayed-renderer-root-preflight-nested-expired",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS[worker792],
    acceptedDiagnosticStatuses:
      PRIVATE_ADMISSION_805_REQUIRED_STATUSES[worker792],
    requirements: PRIVATE_ADMISSION_805_REQUIRED_REQUIREMENTS[worker792],
    evidenceRows: [
      evidenceData({
        role: "worker-792-react-preflight-source",
        path: reactActGatePath,
        tokens: [
          "schedulerMockDelayedActRootWorkPreflightStatus",
          "preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics",
          "isAcceptedSchedulerMockDelayedRendererRootWorkMetadataSummary",
          "rendererRootSourceEvidenceOwned",
          "acceptsTopLevelDelayedActRootWorkAsPublicActEvidence",
          "scheduler-delayed-act-root-diagnostics-renderer-root-source"
        ]
      }),
      evidenceData({
        role: "worker-792-react-preflight-test",
        path: reactActOracleTestPath,
        tokens: [
          "renderer-root-mutated-source-evidence",
          "renderer-root-missing-top-level-source",
          "accepted-renderer-root-metadata",
          "produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata",
          "acceptsTopLevelDelayedActRootWorkAsPublicActEvidence",
          "rendererRootSourceEvidenceOwned"
        ]
      }),
      evidenceData({
        role: "worker-792-scheduler-delayed-policy",
        path: schedulerMockSourcePath,
        tokens: [
          "producesDelayedActRootWorkMetadataFromAcceptedRendererRootMetadata",
          "bindsProducedDelayedActRootWorkNestedEvidence",
          "rejectsMutatedDelayedActRootWorkNestedEvidence",
          "produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker793,
    area: "Scheduler delayed renderer-root producer negative coverage",
    privateAdmission:
      "accepted-private-delayed-renderer-root-producer-negative-coverage",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS[worker793],
    acceptedDiagnosticStatuses:
      PRIVATE_ADMISSION_805_REQUIRED_STATUSES[worker793],
    requirements: PRIVATE_ADMISSION_805_REQUIRED_REQUIREMENTS[worker793],
    evidenceRows: [
      evidenceData({
        role: "worker-793-renderer-root-producer-source",
        path: schedulerMockSourcePath,
        tokens: [
          "createDelayedRendererRootWorkMetadataForDiagnostics",
          "validateDelayedRendererRootWorkMetadata",
          "getRejectedDelayedRendererRootProducerOptionsReason",
          "renderer-root-metadata-source-proof",
          "renderer-root-producer-scheduled-virtual-time-mismatch",
          "renderer-root-producer-delay-metadata-mismatch",
          "metadata-source-renderer-root-signature-mismatch",
          "privateActRootHandoffOnly"
        ]
      }),
      evidenceData({
        role: "worker-793-renderer-root-negative-test",
        path: schedulerDelayedTestPath,
        tokens: [
          "renderer-root-public-flush-helper-claim",
          "renderer-root-package-claim",
          "renderer-root-public-scheduler-flush-executed",
          "renderer-root-public-handoff-policy-claim",
          "renderer-root-producer-priority-timeout-mismatch",
          "renderer-root-request-id-mutation",
          "renderer-root-delayed-request-id-after",
          "metadata-source-renderer-root-signature-mismatch",
          "mock-delayed-renderer-root-793"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker798,
    area: "Scheduler private diagnostics integrity and public flush blockers",
    privateAdmission:
      "accepted-private-scheduler-diagnostics-integrity-hardening",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS[worker798],
    acceptedDiagnosticStatuses:
      PRIVATE_ADMISSION_805_REQUIRED_STATUSES[worker798],
    requirements: PRIVATE_ADMISSION_805_REQUIRED_REQUIREMENTS[worker798],
    evidenceRows: [
      evidenceData({
        role: "worker-798-public-package-helper-claim-source",
        path: schedulerMockSourcePath,
        tokens: [
          "hasPublicPackageOrFlushHelperCompatibilityClaim",
          "hasPublicSchedulerFlushExecutionClaim",
          "publicSchedulerFlushHelperCompatibilityClaimed",
          "publicPackageCompatibilityClaimed",
          "schedulerTimingAdmissionClaimed",
          "schedulerDelayedActRootAdmissionClaimed",
          "schedulerDelayedRendererRootAdmissionClaimed",
          "routesAcceptedMockSchedulerFlushHelperMetadata",
          "publicSchedulerFlushBehaviorExecuted"
        ]
      }),
      evidenceData({
        role: "worker-798-expired-lane-public-claim-test",
        path: schedulerExpiredLaneTestPath,
        tokens: [
          "public-scheduler-flush-helper-claim",
          "package-compatibility-claim",
          "invokes-public-scheduler-flush-helper",
          "public-scheduler-flush-executed",
          "metadata-public-claim",
          "metadata-execution-claim"
        ]
      }),
      evidenceData({
        role: "worker-798-expired-act-root-public-claim-test",
        path: schedulerMockOracleTestPath,
        tokens: [
          "expired-public-flush-helper-claim",
          "expired-package-claim",
          "expired-public-flush-helper-execution",
          "metadata-public-claim"
        ]
      }),
      evidenceData({
        role: "worker-798-helper-fake-validator-test",
        path: reactActOracleTestPath,
        tokens: [
          "assertSchedulerFlushHelperRejectsFakeValidatorMutation",
          "createFakeSchedulerPrivateDiagnostics",
          "createFakeSchedulerSourceValidator",
          "fast-react.scheduler.mock-expired-act-root-work-source-proof",
          "scheduler-delayed-act-root-diagnostics-source-proof"
        ]
      }),
      evidenceData({
        role: "worker-798-package-surface-guard",
        path: packageSurfaceGuardPath,
        tokens: [
          "assertNoPrivateDiagnosticRuntimeExports",
          "assertNoPrivateDiagnosticPublicFiles",
          "assertNoPrivateDiagnosticExportKeys",
          "unstable_mock-flush-helpers.js"
        ]
      }),
      evidenceData({
        role: "worker-798-import-smoke-private-exports",
        path: importEntrySmokePath,
        tokens: [
          "assertNoPrivateDiagnosticRuntimeExports",
          "scheduler/unstable_mock",
          "scheduler/unstable_mock-flush-helpers"
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_805_ROWS = freezeArray(
  rowData805.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      privateAdmission: sourceRow.privateAdmission,
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      acceptedDiagnosticStatuses: sourceRow.acceptedDiagnosticStatuses,
      requirements: sourceRow.requirements,
      evidence: sourceRow.evidenceRows,
      publicBlockerClaims: publicBlockerClaims()
    })
  )
);

export function evaluatePrivateAdmission805Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_805_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((row) => row.workerId);
  const manifest = freezeRecord({
    workerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_805_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_805_WORKERS.includes(workerId)
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
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          unstableEvidenceReasons: evidenceRow.unstableEvidenceReasons,
          readError: evidenceRow.readError
        })
      )
  );
  const acceptedDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds"
  });
  const statusMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_805_REQUIRED_STATUSES,
    actualKey: "acceptedDiagnosticStatuses",
    expectedKey: "expectedAcceptedDiagnosticStatuses",
    actualKeyForViolation: "actualAcceptedDiagnosticStatuses"
  });
  const requirementMismatches = compareRequiredRequirements(evaluatedRows);
  const publicBlockerFieldMismatches = evaluatedRows.flatMap((row) => {
    const actualKeys = Object.keys(row.publicBlockerClaims ?? {});
    if (sameStringSet(PRIVATE_ADMISSION_805_PUBLIC_BLOCKER_FIELDS, actualKeys)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicBlockerFields: PRIVATE_ADMISSION_805_PUBLIC_BLOCKER_FIELDS,
        actualPublicBlockerFields: freezeArray(actualKeys)
      })
    ];
  });
  const publicBlockerClaimViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockerClaims ?? {})
      .filter(([, claimed]) => claimed !== false)
      .map(([claimId]) => `${row.workerId}.${claimId}`)
  );
  const staticReadOnlyViolations = evaluatedRows
    .filter(
      (row) =>
        row.sourceTokenChecksOnly !== true ||
        row.manifestEvaluationOnly !== true ||
        row.schedulerInternalsExecuted !== false ||
        row.runtimeExecutionClaimed !== false ||
        row.ledgerEvaluationMode !== "source-token-checks-and-manifest-only"
    )
    .map((row) => row.workerId);
  const compatibilityClaimWorkerIds = evaluatedRows
    .filter((row) => row.compatibilityClaimed !== false)
    .map((row) => row.workerId);
  const publicPackageHelperFlushClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /(?:packageCompatibilityClaimed|publicPackageCompatibilityClaimed|publicSchedulerFlushHelperCompatibilityClaimed|schedulerTimingAdmissionClaimed|schedulerDelayedActRootAdmissionClaimed|schedulerDelayedRendererRootAdmissionClaimed|routesAcceptedMockSchedulerFlushHelperMetadata)$/.test(
        claimId
      )
  );
  const publicSchedulerTimingFlushClaimIds =
    publicBlockerClaimViolations.filter((claimId) =>
      /(?:publicSchedulerTimingCompatibilityClaimed|invokesPublicSchedulerFlushHelper|publicSchedulerFlushBehaviorExecuted|publicSchedulerFlushExecutionAvailable|drainsPublicSchedulerTaskQueue)$/.test(
        claimId
      )
    );
  const publicActRootRendererClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /(?:publicReactActCompatibilityClaimed|publicRootSchedulerCompatibilityClaimed|publicRendererCompatibilityClaimed|acceptsTopLevelDelayedActRootWorkAsPublicActEvidence|queueFlushingReady|rendererRootsReady|passiveEffectsReady|continuationFlushingReady|drainsPublicReactActQueue|executesQueuedWork|executesEffects|executesRendererWork|executesRendererRoots|publicCompatibilityClaimed|compatibilityClaimed)$/.test(
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
      createViolation("scheduler-diagnostics-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-evidence-token-missing-or-unstable",
    evidenceTokenMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-diagnostic-id-mismatch",
    acceptedDiagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-diagnostic-status-mismatch",
    statusMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-diagnostic-requirement-mismatch",
    requirementMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-public-blocker-field-mismatch",
    publicBlockerFieldMismatches
  );
  pushIdsViolation(
    violations,
    "scheduler-ledger-runtime-execution-claim",
    staticReadOnlyViolations
  );
  pushIdsViolation(
    violations,
    "private-diagnostic-claimed-compatibility",
    compatibilityClaimWorkerIds
  );
  pushClaimIdsViolation(
    violations,
    "public-package-or-helper-flush-claim-detected",
    publicPackageHelperFlushClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "public-scheduler-timing-or-flush-behavior-claim-detected",
    publicSchedulerTimingFlushClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "public-act-root-renderer-claim-detected",
    publicActRootRendererClaimIds
  );

  const manifestRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0;
  const evidenceRecognized = evidenceTokenMismatches.length === 0;
  const acceptedDiagnosticsRecognized =
    acceptedDiagnosticMismatches.length === 0;
  const diagnosticStatusesRecognized = statusMismatches.length === 0;
  const requirementsRecognized = requirementMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerFieldMismatches.length === 0 &&
    publicBlockerClaimViolations.length === 0 &&
    compatibilityClaimWorkerIds.length === 0;
  const staticReadOnlyRecognized = staticReadOnlyViolations.length === 0;
  const sourceValidatorPrivateDiagnosticsRecognized =
    requirementsRecognized &&
    [worker791, worker798].every((workerId) => {
      const row = evaluatedRows.find((candidate) => candidate.workerId === workerId);
      return (
        row?.requirements.sourceValidatorPrivateDiagnosticsOnly === true &&
        row?.requirements.helperOwnKeysAbsent === true &&
        row?.requirements.helperSymbolAliasesAbsent === true
      );
    });
  const delayedRendererRootNestedPrivateRecognized =
    requirementsRecognized &&
    [worker792, worker793].every((workerId) => {
      const row = evaluatedRows.find((candidate) => candidate.workerId === workerId);
      return (
        row?.requirements.delayedRendererRootEvidenceNestedPrivateOnly ===
          true
      );
    });
  const publicPackageHelperFlushClaimsBlocked =
    blockedPublicClaimsRecognized &&
    publicPackageHelperFlushClaimIds.length === 0;
  const publicSchedulerTimingFlushBlocked =
    blockedPublicClaimsRecognized &&
    publicSchedulerTimingFlushClaimIds.length === 0;
  const compatibilityClaimed =
    publicBlockerClaimViolations.length > 0 ||
    compatibilityClaimWorkerIds.length > 0;
  const privateDiagnosticsRecognized =
    manifestRecognized &&
    evidenceRecognized &&
    acceptedDiagnosticsRecognized &&
    diagnosticStatusesRecognized &&
    requirementsRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized &&
    sourceValidatorPrivateDiagnosticsRecognized &&
    delayedRendererRootNestedPrivateRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_805_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_805_GATE_STATUS
      : PRIVATE_ADMISSION_805_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    manifestRecognized,
    evidenceRecognized,
    acceptedDiagnosticsRecognized,
    diagnosticStatusesRecognized,
    requirementsRecognized,
    sourceValidatorPrivateDiagnosticsRecognized,
    helperOwnKeysAndSymbolAliasesAbsent: sourceValidatorPrivateDiagnosticsRecognized,
    delayedRendererRootNestedPrivateRecognized,
    publicPackageHelperFlushClaimsBlocked,
    publicSchedulerTimingFlushBlocked,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_805_WORKERS,
    recognizedWorkerIds: freezeArray(evaluatedRows.map((row) => row.workerId)),
    publicBlockerClaimViolationIds: freezeArray(publicBlockerClaimViolations),
    publicPackageHelperFlushClaimIds: freezeArray(
      publicPackageHelperFlushClaimIds
    ),
    publicSchedulerTimingFlushClaimIds: freezeArray(
      publicSchedulerTimingFlushClaimIds
    ),
    publicActRootRendererClaimIds: freezeArray(publicActRootRendererClaimIds),
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    acceptedDiagnosticIds: freezeArray(data.acceptedDiagnosticIds),
    acceptedDiagnosticStatuses: freezeArray(data.acceptedDiagnosticStatuses),
    requirements: freezeRecord(data.requirements),
    evidenceRows: freezeArray(data.evidenceRows)
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

function row({
  workerId,
  area,
  privateAdmission,
  acceptedDiagnosticIds,
  acceptedDiagnosticStatuses,
  requirements,
  evidence,
  publicBlockerClaims
}) {
  return freezeRecord({
    workerId,
    area,
    privateAdmission,
    sourceQueue: "791-798-scheduler-diagnostics",
    localGateCoverage: PRIVATE_ADMISSION_805_GATE_ID,
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    acceptedDiagnosticStatuses: freezeArray(acceptedDiagnosticStatuses),
    requirements: freezeRecord(requirements),
    evidence: freezeArray(evidence),
    publicBlockerClaims: freezeRecord(publicBlockerClaims),
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    schedulerInternalsExecuted: false,
    compatibilityClaimed: false,
    ledgerEvaluationMode: "source-token-checks-and-manifest-only"
  });
}

function publicBlockerClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_805_PUBLIC_BLOCKER_FIELDS.map((claimId) => [
        claimId,
        false
      ])
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
    "acceptedDiagnosticIds",
    "acceptedDiagnosticStatuses",
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
  if (Object.hasOwn(override, "publicBlockerClaims")) {
    merged.publicBlockerClaims = freezeRecord({
      ...row.publicBlockerClaims,
      ...override.publicBlockerClaims
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

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceRecognized: evidence.every(
      (evidenceRow) => evidenceRow.recognized === true
    )
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const tokens = evidenceRow.tokens ?? [];
  const forbiddenTokens = evidenceRow.forbiddenTokens ?? [];
  const readResult = readEvidenceFile({
    fileCache,
    path: evidenceRow.path,
    workspaceRoot
  });
  const unstableEvidenceReasons = [];
  if (evidenceRow.path.startsWith("worker-progress/")) {
    unstableEvidenceReasons.push("worker-progress-evidence-path");
  }
  for (const token of tokens) {
    if (/\s/u.test(token)) {
      unstableEvidenceReasons.push(`prose-or-formatted-token:${token}`);
    }
  }

  const missingTokens =
    readResult.readError === null
      ? tokens.filter((token) => !readResult.text.includes(token))
      : [...tokens];
  const forbiddenTokensPresent =
    readResult.readError === null
      ? forbiddenTokens.filter((token) => readResult.text.includes(token))
      : [];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      readResult.readError === null &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0 &&
      unstableEvidenceReasons.length === 0,
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    unstableEvidenceReasons: freezeArray(unstableEvidenceReasons),
    readError: readResult.readError
  });
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

function compareRequiredRequirements(rows) {
  return rows.flatMap((row) => {
    const expectedRequirements =
      PRIVATE_ADMISSION_805_REQUIRED_REQUIREMENTS[row.workerId] ?? {};
    const mismatches = [];
    for (const [requirement, expected] of Object.entries(
      expectedRequirements
    )) {
      if (row.requirements[requirement] !== expected) {
        mismatches.push(
          freezeRecord({
            workerId: row.workerId,
            requirement,
            expected,
            actual: row.requirements[requirement]
          })
        );
      }
    }
    return mismatches;
  });
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

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze(record);
}
