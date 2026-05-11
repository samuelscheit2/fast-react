import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_810_GATE_ID =
  "private-admission-810-react-act-scheduler-diagnostics-ledger-1";
export const PRIVATE_ADMISSION_810_GATE_STATUS =
  "recognized-react-act-scheduler-private-diagnostics-ledger-public-blocked";
export const PRIVATE_ADMISSION_810_VIOLATION_STATUS =
  "blocked-react-act-scheduler-private-diagnostics-ledger-with-violations";

const reactActGatePath = "packages/react/private-act-dispatcher-gate.js";
const schedulerMockPath = "packages/scheduler/unstable_mock.js";
const reactDomTestUtilsActGatePath =
  "packages/react-dom/src/test-utils-act-gate.js";
const reactActOracleTestPath =
  "tests/conformance/test/react-act-oracle.test.mjs";
const reactDomTestUtilsActOracleTestPath =
  "tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs";
const schedulerMockDelayedActRootWorkTestPath =
  "tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs";
const schedulerMockOracleTestPath =
  "tests/conformance/test/scheduler-mock-oracle.test.mjs";
const schedulerNativeEntryOracleTestPath =
  "tests/conformance/test/scheduler-native-entry-oracle.test.mjs";

const worker747 = "worker-747-react-private-act-expired-scheduler-consumer";
const worker772 = "worker-772-scheduler-delayed-root-producer";
const worker773 = "worker-773-test-utils-act-expired-scheduler-handoff";
const worker775 = "worker-775-react-act-delayed-mock-consumer";
const worker791 = "worker-791-scheduler-source-proof-private-diagnostics";
const worker792 = "worker-792-react-delayed-renderer-root-preflight";
const worker793 = "worker-793-delayed-renderer-root-negative-coverage";
const worker798 = "worker-798-scheduler-private-diagnostics-integrity";

export const PRIVATE_ADMISSION_810_WORKERS = freezeArray([
  worker747,
  worker772,
  worker773,
  worker775,
  worker791,
  worker792,
  worker793,
  worker798
]);

export const PRIVATE_ADMISSION_810_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicActReady",
  "publicTestUtilsActReady",
  "publicRootBehaviorReady",
  "publicSchedulerTimingReady",
  "publicSchedulerFlushHelperReady",
  "publicSchedulerFlushExecutionAvailable",
  "publicSchedulerFlushBehaviorExecuted",
  "publicRendererCompatibilityClaimed",
  "publicRootSchedulerCompatibilityClaimed",
  "publicReactActCompatibilityClaimed",
  "publicSchedulerTimingCompatibilityClaimed",
  "publicCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "packageCompatibilityClaimed",
  "drainsPublicSchedulerTaskQueue",
  "drainsPublicReactActQueue",
  "invokesPublicSchedulerFlushHelper",
  "routesAcceptedMockSchedulerFlushHelperMetadata",
  "publicActExecution",
  "publicRootExecution",
  "publicEffectExecution",
  "publicActPassiveDrain",
  "rendererExecutionReady",
  "effectsExecutionReady",
  "executesQueuedWork",
  "executesEffects",
  "executesRendererWork",
  "executesRendererRoots",
  "acceptsTopLevelDelayedActRootWorkAsPublicActEvidence",
  "publicDelayedRendererRootAdmissionClaimed",
  "publicFlushHelperValidatorExposed",
  "packageSurfaceChanged",
  "compatibilityClaimed"
]);

export const PRIVATE_ADMISSION_810_REQUIRED_TRUE_REQUIREMENTS = freezeArray([
  "schedulerOwnedDiagnosticsRecognized",
  "sourceValidatorOwnedByScheduler",
  "schedulerValidatorPrivateDiagnosticsOnly",
  "privateEvidenceOnly",
  "staticReadOnlyLedger",
  "sourceTokenChecksOnly",
  "manifestEvaluationOnly"
]);

export const PRIVATE_ADMISSION_810_REQUIRED_FALSE_REQUIREMENTS = freezeArray([
  "runtimeExecutionClaimed",
  "packageSurfaceChanged",
  "publicCompatibilityClaimed",
  "publicActReady",
  "publicRootBehaviorReady",
  "publicSchedulerTimingReady",
  "publicSchedulerFlushHelperReady",
  "rendererExecutionReady",
  "effectsExecutionReady",
  "packageCompatibilityClaimed",
  "publicFlushHelperValidatorExposed",
  "publicDelayedRendererRootAdmissionClaimed"
]);

export const PRIVATE_ADMISSION_810_NON_DURABLE_EVIDENCE_TOKEN_SHAPES =
  freezeArray([
    freezeRecord({
      id: "object-api-expression",
      pattern: /\bObject\.[A-Za-z_$][\w$]*\s*\(/u
    }),
    freezeRecord({
      id: "weak-collection-source-shape",
      pattern: /\bWeak(?:Set|Map)\b/u
    }),
    freezeRecord({
      id: "define-property-source-shape",
      pattern: /\bdefineProperty\b/u
    }),
    freezeRecord({
      id: "source-collection-method-expression",
      pattern: /\.(?:add|set)\s*\(/u
    }),
    freezeRecord({
      id: "source-declaration-snippet",
      pattern: /^\s*(?:const|let|var)\s/u
    }),
    freezeRecord({
      id: "field-value-expression",
      pattern: /:\s*(?:true|false|null|undefined|["']|\d)/u
    }),
    freezeRecord({
      id: "block-or-statement-syntax",
      pattern: /[{};]/u
    })
  ]);

export const PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS = freezeRecord({
  [worker747]: freezeArray([
    "fast-react.scheduler.mock-expired-act-root-work-diagnostics",
    "fast-react.scheduler.mock-expired-act-root-work-metadata",
    "fast-react.scheduler.mock-expired-act-root-work-source-validator"
  ]),
  [worker772]: freezeArray([
    "fast-react.scheduler.mock-delayed-renderer-root-work-metadata",
    "fast-react.scheduler.mock-delayed-act-root-work-metadata",
    "fast-react.scheduler.mock-delayed-act-root-work-diagnostics",
    "fast-react.scheduler.mock-expired-act-root-work-diagnostics"
  ]),
  [worker773]: freezeArray([
    "react-dom-test-utils-act-private-scheduler-mock-expired-act-root-work-gate-1",
    "scheduler-mock-expired-act-root-work-diagnostics",
    "fast-react.scheduler.mock-expired-act-root-work-diagnostics"
  ]),
  [worker775]: freezeArray([
    "fast-react.scheduler.mock-delayed-act-root-work-diagnostics",
    "fast-react.scheduler.mock-expired-act-root-work-diagnostics",
    "fast-react.scheduler.mock-expired-act-root-work-source-validator"
  ]),
  [worker791]: freezeArray([
    "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
    "fast-react.scheduler.mock-expired-act-root-work-source-validator"
  ]),
  [worker792]: freezeArray([
    "fast-react.scheduler.mock-delayed-renderer-root-work-metadata",
    "fast-react.scheduler.mock-delayed-act-root-work-diagnostics",
    "fast-react.scheduler.mock-expired-act-root-work-diagnostics"
  ]),
  [worker793]: freezeArray([
    "fast-react.scheduler.mock-delayed-renderer-root-work-metadata",
    "fast-react.scheduler.mock-delayed-act-root-work-metadata",
    "public-scheduler-flush-helper-blockers"
  ]),
  [worker798]: freezeArray([
    "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
    "fast-react.scheduler.mock-expired-act-root-work-source-validator",
    "public-scheduler-flush-helper-blockers"
  ])
});

export const PRIVATE_ADMISSION_810_REQUIRED_STATUSES = freezeRecord({
  [worker747]: freezeArray([
    "consumed-accepted-scheduler-mock-expired-act-root-work-diagnostics",
    "drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
    "private-scheduler-act-queue-flush-diagnostics",
    "fast-react.scheduler.mock-expired-act-root-work-source-validator"
  ]),
  [worker772]: freezeArray([
    "accepted-private-delayed-renderer-root-work-metadata-for-diagnostics",
    "produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff",
    "produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata",
    "drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics"
  ]),
  [worker773]: freezeArray([
    "accepted-private-test-utils-act-scheduler-mock-expired-act-root-work-diagnostics-without-public-act-routing",
    "consumed-private-test-utils-act-scheduler-mock-expired-act-root-work-diagnostics",
    "consumed-accepted-scheduler-mock-expired-act-root-work-diagnostics"
  ]),
  [worker775]: freezeArray([
    "preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics",
    "drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
    "drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics"
  ]),
  [worker791]: freezeArray([
    "fast-react.scheduler.mock-expired-act-root-work-source-validator",
    "private-scheduler-act-queue-flush-diagnostics"
  ]),
  [worker792]: freezeArray([
    "preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics",
    "accepted-private-delayed-renderer-root-work-metadata-for-diagnostics",
    "produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff"
  ]),
  [worker793]: freezeArray([
    "accepted-private-delayed-renderer-root-work-metadata-for-diagnostics",
    "produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff"
  ]),
  [worker798]: freezeArray([
    "fast-react.scheduler.mock-expired-act-root-work-source-validator",
    "private-scheduler-act-queue-flush-diagnostics"
  ])
});

export const PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS = freezeRecord({
  [worker747]: "scheduler-expired-private-diagnostics",
  [worker772]: "scheduler-delayed-renderer-root-private-producer",
  [worker773]: "react-dom-test-utils-expired-private-handoff",
  [worker775]: "react-act-delayed-nested-expired-preflight",
  [worker791]: "scheduler-source-validator-private-diagnostics-object",
  [worker792]: "react-act-delayed-renderer-root-nested-private-preflight",
  [worker793]: "scheduler-delayed-renderer-root-negative-blockers",
  [worker798]: "scheduler-private-diagnostics-integrity-blockers"
});

export const PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES =
  freezeRecord({
    [worker747]: "not-applicable",
    [worker772]: "scheduler-produced-delayed-renderer-root-private-only",
    [worker773]: "not-applicable",
    [worker775]: "delayed-act-root-private-context-nested-expired-only",
    [worker791]: "source-validator-private-diagnostics-object",
    [worker792]: "delayed-renderer-root-nested-private-only",
    [worker793]: "delayed-renderer-root-public-blockers-only",
    [worker798]: "delayed-renderer-root-public-blockers-only"
  });

const privateAdmission810Rows = freezeArray([
  ledgerRow({
    workerId: worker747,
    privateAdmission: "accepted-private-react-act-expired-scheduler-consumer",
    evidenceKind:
      PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[worker747],
    delayedRendererRootEvidenceScope:
      PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[worker747],
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[worker747],
    acceptedStatuses: PRIVATE_ADMISSION_810_REQUIRED_STATUSES[worker747],
    evidence: freezeArray([
      reactActExpiredConsumerEvidence("worker-747-react-act-source"),
      schedulerSourceValidatorEvidence("worker-747-scheduler-source"),
      evidenceData({
        role: "worker-747-react-act-test-fields",
        path: reactActOracleTestPath,
        tokens: [
          "consumeSchedulerMockExpiredActRootWorkDiagnostics",
          "schedulerMockExpiredActRootWorkConsumptionStatus",
          "schedulerMockExpiredActRootWorkDiagnosticKind",
          "publicSchedulerFlushBehaviorExecuted",
          "publicReactActCompatibilityClaimed",
          "publicRendererCompatibilityClaimed"
        ]
      })
    ])
  }),
  ledgerRow({
    workerId: worker772,
    privateAdmission: "accepted-private-scheduler-delayed-renderer-root-producer",
    evidenceKind:
      PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[worker772],
    delayedRendererRootEvidenceScope:
      PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[worker772],
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[worker772],
    acceptedStatuses: PRIVATE_ADMISSION_810_REQUIRED_STATUSES[worker772],
    evidence: freezeArray([
      schedulerDelayedRendererRootProducerEvidence(
        "worker-772-scheduler-source"
      ),
      evidenceData({
        role: "worker-772-delayed-test-fields",
        path: schedulerMockDelayedActRootWorkTestPath,
        tokens: [
          "createDelayedRendererRootWorkMetadataForDiagnostics",
          "createDelayedActRootWorkMetadataFromAcceptedRendererRootMetadataForDiagnostics",
          "producedByPrivateDelayedRendererRootProducer",
          "sourceEvidenceMatches",
          "privateActRootHandoffOnly",
          "publicSchedulerFlushHelperCompatibilityClaimed"
        ]
      })
    ])
  }),
  ledgerRow({
    workerId: worker773,
    privateAdmission:
      "accepted-private-react-dom-test-utils-expired-scheduler-handoff",
    evidenceKind:
      PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[worker773],
    delayedRendererRootEvidenceScope:
      PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[worker773],
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[worker773],
    acceptedStatuses: PRIVATE_ADMISSION_810_REQUIRED_STATUSES[worker773],
    evidence: freezeArray([
      reactDomTestUtilsExpiredEvidence("worker-773-react-dom-source"),
      evidenceData({
        role: "worker-773-react-dom-test-fields",
        path: reactDomTestUtilsActOracleTestPath,
        tokens: [
          "consumeSchedulerMockExpiredActRootWorkDiagnostics",
          "schedulerMockExpiredActRootWorkDiagnosticKind",
          "publicTestUtilsActReady",
          "publicActExecution",
          "publicRootExecution",
          "publicEffectExecution",
          "publicActPassiveDrain"
        ]
      })
    ])
  }),
  ledgerRow({
    workerId: worker775,
    privateAdmission: "accepted-private-react-act-delayed-nested-expired-preflight",
    evidenceKind:
      PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[worker775],
    delayedRendererRootEvidenceScope:
      PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[worker775],
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[worker775],
    acceptedStatuses: PRIVATE_ADMISSION_810_REQUIRED_STATUSES[worker775],
    evidence: freezeArray([
      reactActDelayedPreflightEvidence("worker-775-react-act-source"),
      schedulerSourceValidatorEvidence("worker-775-scheduler-source"),
      evidenceData({
        role: "worker-775-react-act-test-fields",
        path: reactActOracleTestPath,
        tokens: [
          "preflightSchedulerMockDelayedActRootWorkDiagnostics",
          "nestedExpiredActRootWorkConsumption",
          "acceptsTopLevelDelayedActRootWorkAsPublicActEvidence",
          "publicSchedulerFlushBehaviorExecuted",
          "publicReactActCompatibilityClaimed",
          "publicRendererCompatibilityClaimed"
        ]
      })
    ])
  }),
  ledgerRow({
    workerId: worker791,
    privateAdmission:
      "accepted-private-scheduler-source-validator-private-diagnostics-object",
    evidenceKind:
      PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[worker791],
    delayedRendererRootEvidenceScope:
      PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[worker791],
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[worker791],
    acceptedStatuses: PRIVATE_ADMISSION_810_REQUIRED_STATUSES[worker791],
    evidence: freezeArray([
      schedulerSourceValidatorEvidence("worker-791-scheduler-source"),
      reactActSourceValidatorLookupEvidence("worker-791-react-source"),
      schedulerNativeValidatorIntegrityEvidence("worker-791-native-test-fields")
    ])
  }),
  ledgerRow({
    workerId: worker792,
    privateAdmission:
      "accepted-private-react-act-delayed-renderer-root-nested-preflight",
    evidenceKind:
      PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[worker792],
    delayedRendererRootEvidenceScope:
      PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[worker792],
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[worker792],
    acceptedStatuses: PRIVATE_ADMISSION_810_REQUIRED_STATUSES[worker792],
    evidence: freezeArray([
      reactActDelayedPreflightEvidence("worker-792-react-act-source"),
      schedulerDelayedRendererRootProducerEvidence(
        "worker-792-scheduler-source"
      ),
      evidenceData({
        role: "worker-792-react-act-test-fields",
        path: reactActOracleTestPath,
        tokens: [
          "rendererRootSourceEvidencePresent",
          "rendererRootSourceEvidenceOwned",
          "producedByPrivateDelayedRendererRootProducer",
          "delayedRendererRootMetadata",
          "acceptsTopLevelDelayedActRootWorkAsPublicActEvidence",
          "publicRendererCompatibilityClaimed"
        ]
      })
    ])
  }),
  ledgerRow({
    workerId: worker793,
    privateAdmission:
      "accepted-private-scheduler-delayed-renderer-root-negative-blockers",
    evidenceKind:
      PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[worker793],
    delayedRendererRootEvidenceScope:
      PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[worker793],
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[worker793],
    acceptedStatuses: PRIVATE_ADMISSION_810_REQUIRED_STATUSES[worker793],
    evidence: freezeArray([
      schedulerDelayedRendererRootProducerEvidence(
        "worker-793-scheduler-source"
      ),
      evidenceData({
        role: "worker-793-delayed-negative-test-fields",
        path: schedulerMockDelayedActRootWorkTestPath,
        tokens: [
          "publicSchedulerFlushHelperCompatibilityClaimed",
          "publicSchedulerFlushBehaviorExecuted",
          "publicSchedulerTimingCompatibilityClaimed",
          "publicRendererCompatibilityClaimed",
          "privateActRootHandoffOnly",
          "cloneDelayedRendererRootWorkMetadata"
        ]
      })
    ])
  }),
  ledgerRow({
    workerId: worker798,
    privateAdmission:
      "accepted-private-scheduler-diagnostics-integrity-public-blockers",
    evidenceKind:
      PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[worker798],
    delayedRendererRootEvidenceScope:
      PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[worker798],
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[worker798],
    acceptedStatuses: PRIVATE_ADMISSION_810_REQUIRED_STATUSES[worker798],
    evidence: freezeArray([
      schedulerSourceValidatorEvidence("worker-798-scheduler-source"),
      schedulerNativeValidatorIntegrityEvidence("worker-798-native-test-fields"),
      evidenceData({
        role: "worker-798-scheduler-mock-test-fields",
        path: schedulerMockOracleTestPath,
        tokens: [
          "publicSchedulerTimingCompatibilityClaimed",
          "publicReactActCompatibilityClaimed",
          "publicCompatibilityClaimed",
          "compatibilityClaimed",
          "publicSchedulerFlushBehaviorExecuted"
        ]
      })
    ])
  })
]);

export const PRIVATE_ADMISSION_810_ROWS = freezeArray(
  privateAdmission810Rows.map((row) =>
    freezeRecord({
      ...row,
      requirements: freezeRecord(row.requirements),
      publicBlockerClaims: freezeRecord(row.publicBlockerClaims),
      acceptedDiagnosticIds: freezeArray(row.acceptedDiagnosticIds),
      acceptedStatuses: freezeArray(row.acceptedStatuses),
      evidence: freezeArray(row.evidence)
    })
  )
);

export function evaluatePrivateAdmission810Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_810_ROWS.map((row) =>
    mergeRowOverride(row, rowOverrides[row.workerId] ?? {})
  );
  const evaluatedRows = rows.map((row) =>
    evaluateLedgerRow({ fileCache, row, workspaceRoot })
  );
  const manifestWorkerIds = evaluatedRows.map((row) => row.workerId);
  const manifest = freezeRecord({
    workerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_810_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_810_WORKERS.includes(workerId)
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
      .filter(
        (evidenceRow) =>
          evidenceRow.missingTokens.length > 0 ||
          evidenceRow.forbiddenTokensPresent.length > 0 ||
          evidenceRow.readError !== null
      )
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          nonDurableTokens: evidenceRow.nonDurableTokens,
          readError: evidenceRow.readError
        })
      )
  );
  const nonDurableEvidenceTokenMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.nonDurableTokens.length > 0)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          nonDurableTokens: evidenceRow.nonDurableTokens
        })
      )
  );
  const diagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds"
  });
  const statusMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_810_REQUIRED_STATUSES,
    actualKey: "acceptedStatuses",
    expectedKey: "expectedAcceptedStatuses",
    actualKeyForViolation: "actualAcceptedStatuses"
  });
  const evidenceKindMismatches = compareRequiredValueByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS,
    actualKey: "evidenceKind",
    expectedKey: "expectedEvidenceKind",
    actualKeyForViolation: "actualEvidenceKind"
  });
  const rendererRootScopeMismatches = compareRequiredValueByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES,
    actualKey: "delayedRendererRootEvidenceScope",
    expectedKey: "expectedDelayedRendererRootEvidenceScope",
    actualKeyForViolation: "actualDelayedRendererRootEvidenceScope"
  });
  const requirementMismatches = evaluatedRows.flatMap((row) => {
    const mismatches = [];
    for (const key of PRIVATE_ADMISSION_810_REQUIRED_TRUE_REQUIREMENTS) {
      if (row.requirements[key] !== true) {
        mismatches.push(
          freezeRecord({
            workerId: row.workerId,
            requirement: key,
            expected: true,
            actual: row.requirements[key]
          })
        );
      }
    }
    for (const key of PRIVATE_ADMISSION_810_REQUIRED_FALSE_REQUIREMENTS) {
      if (row.requirements[key] !== false) {
        mismatches.push(
          freezeRecord({
            workerId: row.workerId,
            requirement: key,
            expected: false,
            actual: row.requirements[key]
          })
        );
      }
    }
    return mismatches;
  });
  const publicBlockerFieldMismatches = evaluatedRows.flatMap((row) => {
    const actualFields = Object.keys(row.publicBlockerClaims ?? {});
    if (sameStringSet(PRIVATE_ADMISSION_810_PUBLIC_BLOCKER_FIELDS, actualFields)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicBlockerFields:
          PRIVATE_ADMISSION_810_PUBLIC_BLOCKER_FIELDS,
        actualPublicBlockerFields: freezeArray(actualFields)
      })
    ];
  });
  const publicBlockerClaimViolationIds = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockerClaims ?? {})
      .filter(([, claimed]) => claimed !== false)
      .map(([field]) => `${row.workerId}.${field}`)
  );
  const staticReadOnlyViolationIds = evaluatedRows
    .filter(
      (row) =>
        row.requirements.sourceTokenChecksOnly !== true ||
        row.requirements.manifestEvaluationOnly !== true ||
        row.requirements.staticReadOnlyLedger !== true ||
        row.requirements.runtimeExecutionClaimed !== false ||
        row.requirements.packageSurfaceChanged !== false ||
        row.ledgerEvaluationMode !== "source-token-checks-and-manifest-only"
    )
    .map((row) => row.workerId);
  const sourceValidatorOwnershipViolationIds = evaluatedRows
    .filter(
      (row) =>
        row.requirements.sourceValidatorOwnedByScheduler !== true ||
        row.requirements.schedulerValidatorPrivateDiagnosticsOnly !== true ||
        row.validatorSource !== "scheduler-private-diagnostics-object"
    )
    .map((row) => row.workerId);
  const delayedRendererRootPublicClaimIds = evaluatedRows
    .filter(
      (row) =>
        row.publicBlockerClaims.publicDelayedRendererRootAdmissionClaimed !==
          false ||
        row.publicBlockerClaims.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence !==
          false
    )
    .map((row) => row.workerId);

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("react-act-scheduler-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-source-token-missing",
    evidenceMismatches
  );
  pushRowsViolation(
    violations,
    "non-durable-evidence-token-shape",
    nonDurableEvidenceTokenMismatches
  );
  pushRowsViolation(
    violations,
    "private-diagnostic-id-mismatch",
    diagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "private-diagnostic-status-mismatch",
    statusMismatches
  );
  pushRowsViolation(
    violations,
    "private-evidence-kind-mismatch",
    evidenceKindMismatches
  );
  pushRowsViolation(
    violations,
    "delayed-renderer-root-scope-mismatch",
    rendererRootScopeMismatches
  );
  pushRowsViolation(
    violations,
    "private-ledger-requirement-mismatch",
    requirementMismatches
  );
  pushRowsViolation(
    violations,
    "public-blocker-field-mismatch",
    publicBlockerFieldMismatches
  );
  pushIdsViolation(
    violations,
    "public-compatibility-claim-detected",
    publicBlockerClaimViolationIds
  );
  pushIdsViolation(
    violations,
    "static-read-only-ledger-claim-mismatch",
    staticReadOnlyViolationIds
  );
  pushIdsViolation(
    violations,
    "scheduler-source-validator-ownership-mismatch",
    sourceValidatorOwnershipViolationIds
  );
  pushIdsViolation(
    violations,
    "delayed-renderer-root-public-admission-claim-detected",
    delayedRendererRootPublicClaimIds
  );

  const evidenceRecognized = evidenceMismatches.length === 0;
  const durableEvidenceTokensRecognized =
    nonDurableEvidenceTokenMismatches.length === 0;
  const diagnosticIdsRecognized = diagnosticMismatches.length === 0;
  const statusesRecognized = statusMismatches.length === 0;
  const evidenceKindsRecognized = evidenceKindMismatches.length === 0;
  const rendererRootScopesRecognized =
    rendererRootScopeMismatches.length === 0;
  const requirementsRecognized = requirementMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerFieldMismatches.length === 0 &&
    publicBlockerClaimViolationIds.length === 0;
  const staticReadOnlyRecognized = staticReadOnlyViolationIds.length === 0;
  const sourceValidatorOwnershipRecognized =
    sourceValidatorOwnershipViolationIds.length === 0;
  const delayedRendererRootPrivateOnlyRecognized =
    delayedRendererRootPublicClaimIds.length === 0;
  const compatibilityClaimed = publicBlockerClaimViolationIds.length > 0;
  const privateDiagnosticsRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    evidenceRecognized &&
    durableEvidenceTokensRecognized &&
    diagnosticIdsRecognized &&
    statusesRecognized &&
    evidenceKindsRecognized &&
    rendererRootScopesRecognized &&
    requirementsRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized &&
    sourceValidatorOwnershipRecognized &&
    delayedRendererRootPrivateOnlyRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_810_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_810_GATE_STATUS
      : PRIVATE_ADMISSION_810_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    evidenceRecognized,
    durableEvidenceTokensRecognized,
    diagnosticIdsRecognized,
    statusesRecognized,
    evidenceKindsRecognized,
    rendererRootScopesRecognized,
    requirementsRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    sourceValidatorOwnershipRecognized,
    delayedRendererRootPrivateOnlyRecognized,
    compatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_810_WORKERS,
    recognizedWorkerIds: freezeArray(evaluatedRows.map((row) => row.workerId)),
    publicBlockerClaimViolationIds: freezeArray(
      publicBlockerClaimViolationIds
    ),
    nonDurableEvidenceTokenViolationIds: freezeArray(
      nonDurableEvidenceTokenMismatches.map(
        (mismatch) => `${mismatch.workerId}.${mismatch.role}`
      )
    ),
    staticReadOnlyViolationIds: freezeArray(staticReadOnlyViolationIds),
    sourceValidatorOwnershipViolationIds: freezeArray(
      sourceValidatorOwnershipViolationIds
    ),
    delayedRendererRootPublicClaimIds: freezeArray(
      delayedRendererRootPublicClaimIds
    ),
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    violations: freezeArray(violations)
  });
}

function ledgerRow({
  workerId,
  privateAdmission,
  evidenceKind,
  delayedRendererRootEvidenceScope,
  acceptedDiagnosticIds,
  acceptedStatuses,
  evidence
}) {
  return freezeRecord({
    workerId,
    privateAdmission,
    evidenceKind,
    delayedRendererRootEvidenceScope,
    acceptedDiagnosticIds,
    acceptedStatuses,
    evidence,
    validatorSource: "scheduler-private-diagnostics-object",
    ledgerEvaluationMode: "source-token-checks-and-manifest-only",
    requirements: freezeRecord({
      schedulerOwnedDiagnosticsRecognized: true,
      sourceValidatorOwnedByScheduler: true,
      schedulerValidatorPrivateDiagnosticsOnly: true,
      privateEvidenceOnly: true,
      staticReadOnlyLedger: true,
      sourceTokenChecksOnly: true,
      manifestEvaluationOnly: true,
      runtimeExecutionClaimed: false,
      packageSurfaceChanged: false,
      publicCompatibilityClaimed: false,
      publicActReady: false,
      publicRootBehaviorReady: false,
      publicSchedulerTimingReady: false,
      publicSchedulerFlushHelperReady: false,
      rendererExecutionReady: false,
      effectsExecutionReady: false,
      packageCompatibilityClaimed: false,
      publicFlushHelperValidatorExposed: false,
      publicDelayedRendererRootAdmissionClaimed: false
    }),
    publicBlockerClaims: falseRecord(PRIVATE_ADMISSION_810_PUBLIC_BLOCKER_FIELDS)
  });
}

function reactActExpiredConsumerEvidence(role) {
  return evidenceData({
    role,
    path: reactActGatePath,
    tokens: [
      "schedulerMockExpiredActRootWorkConsumptionStatus",
      "consumeSchedulerMockExpiredActRootWorkDiagnostics",
      "getSchedulerMockExpiredActRootWorkSourceValidator",
      "providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics",
      "schedulerMockExpiredActRootWorkSourceValidator",
      "schedulerMockExpiredActRootWorkDiagnosticsStatus",
      "drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics",
      "publicSchedulerTimingCompatibilityClaimed",
      "publicReactActCompatibilityClaimed",
      "publicRootSchedulerCompatibilityClaimed",
      "publicRendererCompatibilityClaimed",
      "executesQueuedWork",
      "executesEffects",
      "executesRendererWork",
      "executesRendererRoots"
    ]
  });
}

function reactActDelayedPreflightEvidence(role) {
  return evidenceData({
    role,
    path: reactActGatePath,
    tokens: [
      "schedulerMockDelayedActRootWorkPreflightStatus",
      "preflightSchedulerMockDelayedActRootWorkDiagnostics",
      "acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics",
      "acceptsTopLevelDelayedActRootWorkAsPublicActEvidence",
      "nestedExpiredActRootWorkConsumption",
      "rendererRootSourceEvidencePresent",
      "rendererRootSourceEvidenceOwned",
      "delayedRendererRootMetadata",
      "publicSchedulerTimingCompatibilityClaimed",
      "publicReactActCompatibilityClaimed",
      "publicRootSchedulerCompatibilityClaimed",
      "publicRendererCompatibilityClaimed",
      "publicSchedulerFlushBehaviorExecuted",
      "executesEffects",
      "executesRendererWork",
      "executesRendererRoots"
    ]
  });
}

function reactActSourceValidatorLookupEvidence(role) {
  return evidenceData({
    role,
    path: reactActGatePath,
    tokens: [
      "getSchedulerMockExpiredActRootWorkSourceValidator",
      "unstable_flushExpired",
      "privateActQueueFlushDiagnosticsExport",
      "schedulerMockExpiredActRootWorkSourceValidator",
      "isSchedulerMockExpiredActRootWorkSource",
      "providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics"
    ]
  });
}

function schedulerSourceValidatorEvidence(role) {
  return evidenceData({
    role,
    path: schedulerMockPath,
    tokens: [
      "schedulerMockExpiredActRootWorkSources",
      "schedulerMockExpiredActRootWorkSourceValidator",
      "isSchedulerMockExpiredActRootWorkSource",
      "freezeSchedulerOwnedExpiredActRootWorkSource",
      "providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics",
      "mockSchedulerExpiredActRootWorkDiagnosticsReady",
      "shouldAttachPrivateActQueueFlushDiagnostics",
      "privateActQueueFlushDiagnosticsExport",
      "wrapSchedulerFunction"
    ]
  });
}

function schedulerDelayedRendererRootProducerEvidence(role) {
  return evidenceData({
    role,
    path: schedulerMockPath,
    tokens: [
      "delayedRendererRootWorkMetadataSources",
      "createDelayedRendererRootWorkMetadataForDiagnostics",
      "createDelayedActRootWorkMetadataFromAcceptedRendererRootMetadataForDiagnostics",
      "createDelayedRendererRootWorkSourceEvidence",
      "accepted-private-delayed-renderer-root-work-metadata-for-diagnostics",
      "produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff",
      "produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata",
      "privateActRootHandoffOnly",
      "publicSchedulerTimingCompatibilityClaimed",
      "publicReactActCompatibilityClaimed",
      "publicRootSchedulerCompatibilityClaimed",
      "publicRendererCompatibilityClaimed",
      "executesEffects",
      "executesRendererWork",
      "executesRendererRoots"
    ]
  });
}

function reactDomTestUtilsExpiredEvidence(role) {
  return evidenceData({
    role,
    path: reactDomTestUtilsActGatePath,
    tokens: [
      "privateSchedulerMockExpiredActRootWorkDiagnosticStatus",
      "privateSchedulerMockExpiredActRootWorkConsumptionStatus",
      "reactActSchedulerMockExpiredActRootWorkConsumptionStatus",
      "consumeSchedulerMockExpiredActRootWorkDiagnostics",
      "privateSchedulerMockExpiredActRootWorkDiagnosticSummary",
      "requiresSchedulerOwnedSourceProof",
      "publicTestUtilsActReady",
      "publicActExecution",
      "publicRootExecution",
      "publicEffectExecution",
      "publicActPassiveDrain",
      "publicSchedulerTimingCompatibilityClaimed",
      "publicReactActCompatibilityClaimed",
      "publicRootSchedulerCompatibilityClaimed",
      "publicRendererCompatibilityClaimed",
      "executesRendererWork",
      "executesRendererRoots"
    ]
  });
}

function schedulerNativeValidatorIntegrityEvidence(role) {
  return evidenceData({
    role,
    path: schedulerNativeEntryOracleTestPath,
    tokens: [
      "schedulerMockExpiredActRootWorkSourceValidator",
      "isSchedulerMockExpiredActRootWorkSource",
      "privateSymbolDescriptions",
      "createFakeSchedulerMockExpiredActRootWorkSourceValidator",
      "createOldGlobalSchedulerMockExpiredActRootWorkSourceClone",
      "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
    ]
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

function mergeRowOverride(row, override) {
  return freezeRecord({
    ...row,
    ...override,
    acceptedDiagnosticIds: freezeArray(
      override.acceptedDiagnosticIds ?? row.acceptedDiagnosticIds
    ),
    acceptedStatuses: freezeArray(
      override.acceptedStatuses ?? row.acceptedStatuses
    ),
    evidence: freezeArray(override.evidence ?? row.evidence),
    requirements: freezeRecord({
      ...row.requirements,
      ...(override.requirements ?? {})
    }),
    publicBlockerClaims: freezeRecord({
      ...row.publicBlockerClaims,
      ...(override.publicBlockerClaims ?? {})
    })
  });
}

function evaluateLedgerRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot })
  );

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceRecognized: evidence.every((evidenceRow) => evidenceRow.recognized)
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const nonDurableTokens = collectNonDurableEvidenceTokens(evidenceRow.tokens);
  let text;
  try {
    text = readWorkspaceFile({ fileCache, workspaceRoot, path: evidenceRow.path });
  } catch (error) {
    return freezeRecord({
      ...evidenceRow,
      recognized: false,
      missingTokens: evidenceRow.tokens,
      forbiddenTokensPresent: freezeArray([]),
      nonDurableTokens,
      readError: error.message
    });
  }

  const missingTokens = evidenceRow.tokens.filter(
    (token) => !text.includes(token)
  );
  const forbiddenTokensPresent = evidenceRow.forbiddenTokens.filter((token) =>
    text.includes(token)
  );

  return freezeRecord({
    ...evidenceRow,
    recognized:
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0 &&
      nonDurableTokens.length === 0,
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    nonDurableTokens,
    readError: null
  });
}

function collectNonDurableEvidenceTokens(tokens) {
  return freezeArray(
    tokens.flatMap((token) => {
      const shape = PRIVATE_ADMISSION_810_NON_DURABLE_EVIDENCE_TOKEN_SHAPES.find(
        (candidate) => candidate.pattern.test(token)
      );
      if (shape === undefined) {
        return [];
      }
      return [
        freezeRecord({
          token,
          shapeId: shape.id
        })
      ];
    })
  );
}

function readWorkspaceFile({ fileCache, workspaceRoot, path }) {
  const absolutePath = join(workspaceRoot, path);
  if (!fileCache.has(absolutePath)) {
    fileCache.set(absolutePath, readFileSync(absolutePath, "utf8"));
  }
  return fileCache.get(absolutePath);
}

function compareRequiredArrayByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId];
    if (sameStringArray(row[actualKey], expected)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: expected,
        [actualKeyForViolation]: freezeArray(row[actualKey] ?? [])
      })
    ];
  });
}

function compareRequiredValueByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId];
    if (row[actualKey] === expected) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: expected,
        [actualKeyForViolation]: row[actualKey]
      })
    ];
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

function indexRowsByWorker(rows) {
  return freezeRecord(
    Object.fromEntries(rows.map((row) => [row.workerId, row]))
  );
}

function sameStringArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    Array.isArray(expected) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function sameStringSet(expected, actual) {
  if (!Array.isArray(expected) || !Array.isArray(actual)) {
    return false;
  }
  if (expected.length !== actual.length) {
    return false;
  }
  const actualSet = new Set(actual);
  return expected.every((value) => actualSet.has(value));
}

function falseRecord(keys) {
  return freezeRecord(
    Object.fromEntries(keys.map((key) => [key, false]))
  );
}

function createViolation(id, details = {}) {
  return freezeRecord({
    id,
    ...details
  });
}

function freezeArray(values) {
  return Object.freeze(values.slice());
}

function freezeRecord(record) {
  return Object.freeze(record);
}
