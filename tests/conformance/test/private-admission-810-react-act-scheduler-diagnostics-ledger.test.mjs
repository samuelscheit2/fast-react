import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_810_APPROVED_EVIDENCE_CONTEXTS_BY_ROLE,
  PRIVATE_ADMISSION_810_DURABLE_EVIDENCE_TOKEN_CLASSES,
  PRIVATE_ADMISSION_810_GATE_STATUS,
  PRIVATE_ADMISSION_810_NON_DURABLE_EVIDENCE_TOKEN_SHAPES,
  PRIVATE_ADMISSION_810_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS,
  PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS,
  PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_ROLES,
  PRIVATE_ADMISSION_810_REQUIRED_FALSE_REQUIREMENTS,
  PRIVATE_ADMISSION_810_REQUIRED_REQUIREMENT_FIELDS,
  PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES,
  PRIVATE_ADMISSION_810_REQUIRED_STATUSES,
  PRIVATE_ADMISSION_810_REQUIRED_TRUE_REQUIREMENTS,
  PRIVATE_ADMISSION_810_ROWS,
  PRIVATE_ADMISSION_810_VIOLATION_STATUS,
  PRIVATE_ADMISSION_810_WORKERS,
  evaluatePrivateAdmission810Gate
} from "../src/private-admission-810-react-act-scheduler-diagnostics-ledger.mjs";

const worker747 = "worker-747-react-private-act-expired-scheduler-consumer";
const worker772 = "worker-772-scheduler-delayed-root-producer";
const worker773 = "worker-773-test-utils-act-expired-scheduler-handoff";
const worker775 = "worker-775-react-act-delayed-mock-consumer";
const worker791 = "worker-791-scheduler-source-proof-private-diagnostics";
const worker792 = "worker-792-react-delayed-renderer-root-preflight";
const worker793 = "worker-793-delayed-renderer-root-negative-coverage";
const worker798 = "worker-798-scheduler-private-diagnostics-integrity";

const expectedWorkers = [
  worker747,
  worker772,
  worker773,
  worker775,
  worker791,
  worker792,
  worker793,
  worker798
];

test("private admission 810 manifest pins accepted React act and Scheduler handoffs", () => {
  assert.deepEqual(PRIVATE_ADMISSION_810_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_810_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_810_ROWS.length, 8);
  assert.equal(new Set(PRIVATE_ADMISSION_810_WORKERS).size, 8);

  assert.deepEqual(
    PRIVATE_ADMISSION_810_ROWS.map((row) => row.evidenceKind),
    expectedWorkers.map(
      (workerId) => PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[workerId]
    )
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_810_ROWS.map(
      (row) => row.delayedRendererRootEvidenceScope
    ),
    expectedWorkers.map(
      (workerId) =>
        PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[workerId]
    )
  );

  for (const row of PRIVATE_ADMISSION_810_ROWS) {
    assert.deepEqual(
      row.acceptedDiagnosticIds,
      PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[row.workerId],
      row.workerId
    );
    assert.deepEqual(
      row.acceptedStatuses,
      PRIVATE_ADMISSION_810_REQUIRED_STATUSES[row.workerId],
      row.workerId
    );
    assert.deepEqual(
      Object.keys(row.publicBlockerClaims).sort(),
      [...PRIVATE_ADMISSION_810_PUBLIC_BLOCKER_FIELDS].sort(),
      row.workerId
    );
    assert.deepEqual(
      row.evidence.map((evidenceRow) => evidenceRow.role),
      PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_ROLES[row.workerId],
      row.workerId
    );
    for (const evidenceRow of row.evidence) {
      assert.deepEqual(
        PRIVATE_ADMISSION_810_APPROVED_EVIDENCE_CONTEXTS_BY_ROLE[
          evidenceRow.role
        ],
        {
          path: evidenceRow.path,
          tokens: evidenceRow.tokens
        },
        evidenceRow.role
      );
    }
    assert.deepEqual(
      Object.keys(row.requirements).sort(),
      [...PRIVATE_ADMISSION_810_REQUIRED_REQUIREMENT_FIELDS].sort(),
      row.workerId
    );
    assertAllFalse(row.publicBlockerClaims, row.workerId);
  }
});

test("private admission 810 gate recognizes private source-owned diagnostics while public surfaces stay blocked", () => {
  const gate = evaluatePrivateAdmission810Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_810_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.evidenceRolesRecognized, true);
  assert.equal(gate.durableEvidenceTokensRecognized, true);
  assert.equal(gate.diagnosticIdsRecognized, true);
  assert.equal(gate.statusesRecognized, true);
  assert.equal(gate.evidenceKindsRecognized, true);
  assert.equal(gate.rendererRootScopesRecognized, true);
  assert.equal(gate.requirementsRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.sourceValidatorOwnershipRecognized, true);
  assert.equal(gate.delayedRendererRootPrivateOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.publicBlockerClaimViolationIds, []);
  assert.deepEqual(gate.nonDurableEvidenceTokenViolationIds, []);
  assert.deepEqual(gate.evidenceRoleViolationIds, []);
  assert.deepEqual(gate.requirementFieldViolationIds, []);
  assert.deepEqual(gate.staticReadOnlyViolationIds, []);
  assert.deepEqual(gate.sourceValidatorOwnershipViolationIds, []);
  assert.deepEqual(gate.delayedRendererRootPublicClaimIds, []);

  assertLedgerRow(gate.rowsByWorker[worker747], {
    evidenceKind: "scheduler-expired-private-diagnostics",
    delayedRendererRootEvidenceScope: "not-applicable",
    privateAdmission:
      "accepted-private-react-act-expired-scheduler-consumer",
    evidenceRoles: [
      "worker-747-react-act-source",
      "worker-747-scheduler-source",
      "worker-747-react-act-test-fields"
    ]
  });
  assertLedgerRow(gate.rowsByWorker[worker772], {
    evidenceKind: "scheduler-delayed-renderer-root-private-producer",
    delayedRendererRootEvidenceScope:
      "scheduler-produced-delayed-renderer-root-private-only",
    privateAdmission:
      "accepted-private-scheduler-delayed-renderer-root-producer",
    evidenceRoles: [
      "worker-772-scheduler-source",
      "worker-772-delayed-test-fields"
    ]
  });
  assertLedgerRow(gate.rowsByWorker[worker773], {
    evidenceKind: "react-dom-test-utils-expired-private-handoff",
    delayedRendererRootEvidenceScope: "not-applicable",
    privateAdmission:
      "accepted-private-react-dom-test-utils-expired-scheduler-handoff",
    evidenceRoles: [
      "worker-773-react-dom-source",
      "worker-773-react-dom-test-fields"
    ]
  });
  assertLedgerRow(gate.rowsByWorker[worker775], {
    evidenceKind: "react-act-delayed-nested-expired-preflight",
    delayedRendererRootEvidenceScope:
      "delayed-act-root-private-context-nested-expired-only",
    privateAdmission:
      "accepted-private-react-act-delayed-nested-expired-preflight",
    evidenceRoles: [
      "worker-775-react-act-source",
      "worker-775-scheduler-source",
      "worker-775-react-act-test-fields"
    ]
  });
  assertLedgerRow(gate.rowsByWorker[worker791], {
    evidenceKind: "scheduler-source-validator-private-diagnostics-object",
    delayedRendererRootEvidenceScope:
      "source-validator-private-diagnostics-object",
    privateAdmission:
      "accepted-private-scheduler-source-validator-private-diagnostics-object",
    evidenceRoles: [
      "worker-791-scheduler-source",
      "worker-791-react-source",
      "worker-791-native-test-fields"
    ]
  });
  assertLedgerRow(gate.rowsByWorker[worker792], {
    evidenceKind:
      "react-act-delayed-renderer-root-nested-private-preflight",
    delayedRendererRootEvidenceScope:
      "delayed-renderer-root-nested-private-only",
    privateAdmission:
      "accepted-private-react-act-delayed-renderer-root-nested-preflight",
    evidenceRoles: [
      "worker-792-react-act-source",
      "worker-792-scheduler-source",
      "worker-792-react-act-test-fields"
    ]
  });
  assertLedgerRow(gate.rowsByWorker[worker793], {
    evidenceKind: "scheduler-delayed-renderer-root-negative-blockers",
    delayedRendererRootEvidenceScope:
      "delayed-renderer-root-public-blockers-only",
    privateAdmission:
      "accepted-private-scheduler-delayed-renderer-root-negative-blockers",
    evidenceRoles: [
      "worker-793-scheduler-source",
      "worker-793-delayed-negative-test-fields"
    ]
  });
  assertLedgerRow(gate.rowsByWorker[worker798], {
    evidenceKind: "scheduler-private-diagnostics-integrity-blockers",
    delayedRendererRootEvidenceScope:
      "delayed-renderer-root-public-blockers-only",
    privateAdmission:
      "accepted-private-scheduler-diagnostics-integrity-public-blockers",
    evidenceRoles: [
      "worker-798-scheduler-source",
      "worker-798-native-test-fields",
      "worker-798-scheduler-mock-test-fields"
    ]
  });
});

test("private admission 810 gate rejects missing Scheduler-owned source validator evidence", () => {
  const gate = evaluatePrivateAdmission810Gate({
    rowOverrides: {
      [worker791]: {
        evidence: withMissingEvidenceToken(
          rowByWorker(worker791),
          "worker-791-scheduler-source",
          "missing-scheduler-owned-source-validator-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_810_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, ["private-admission-source-token-missing"]);
  assertEvidenceRoleRecognized(
    gate,
    worker791,
    "worker-791-scheduler-source",
    false
  );
});

test("private admission 810 gate rejects empty, missing, and extra evidence roles", () => {
  const worker772Row = rowByWorker(worker772);
  const worker798Row = rowByWorker(worker798);
  const extraEvidenceRow = {
    ...worker798Row.evidence[0],
    role: "worker-798-unexpected-extra-evidence"
  };
  const gate = evaluatePrivateAdmission810Gate({
    rowOverrides: {
      [worker791]: {
        evidence: []
      },
      [worker772]: {
        evidence: worker772Row.evidence.filter(
          (evidenceRow) => evidenceRow.role !== "worker-772-delayed-test-fields"
        )
      },
      [worker798]: {
        evidence: [...worker798Row.evidence, extraEvidenceRow]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_810_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.evidenceRolesRecognized, false);
  assert.deepEqual(gate.evidenceRoleViolationIds, [
    worker772,
    worker791,
    worker798
  ]);
  assertViolationIds(gate, ["evidence-role-manifest-mismatch"]);

  const rows = getViolationRows(gate, "evidence-role-manifest-mismatch");
  const row772 = rows.find((row) => row.workerId === worker772);
  const row791 = rows.find((row) => row.workerId === worker791);
  const row798 = rows.find((row) => row.workerId === worker798);
  assert.deepEqual(row772.missingEvidenceRoles, [
    "worker-772-delayed-test-fields"
  ]);
  assert.deepEqual(row772.unexpectedEvidenceRoles, []);
  assert.deepEqual(row791.actualEvidenceRoles, []);
  assert.deepEqual(
    row791.missingEvidenceRoles,
    PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_ROLES[worker791]
  );
  assert.deepEqual(row798.missingEvidenceRoles, []);
  assert.deepEqual(row798.unexpectedEvidenceRoles, [
    "worker-798-unexpected-extra-evidence"
  ]);
});

test("private admission 810 gate rejects source-syntax evidence tokens", () => {
  assert.deepEqual(
    PRIVATE_ADMISSION_810_DURABLE_EVIDENCE_TOKEN_CLASSES.map(
      (tokenClass) => tokenClass.id
    ),
    [
      "js-identifier-field-function-or-constant",
      "diagnostic-or-status-id"
    ]
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_810_NON_DURABLE_EVIDENCE_TOKEN_SHAPES.map(
      (shape) => shape.id
    ),
    [
      "object-api-expression",
      "weak-collection-source-shape",
      "define-property-source-shape",
      "source-collection-method-expression",
      "source-declaration-snippet",
      "field-value-expression",
      "comma-suffixed-snippet",
      "string-literal-snippet",
      "member-call-expression",
      "member-expression-snippet",
      "block-or-statement-syntax",
      "not-allowed-durable-token-class"
    ]
  );

  const gate = evaluatePrivateAdmission810Gate({
    rowOverrides: {
      [worker791]: {
        evidence: withAdditionalEvidenceTokens(
          rowByWorker(worker791),
          "worker-791-scheduler-source",
          [
            "Object.defineProperty(wrappedFunction, privateActQueueFlushDiagnosticsExport",
            "const schedulerMockExpiredActRootWorkSources = new WeakSet();",
            "delayedRendererRootWorkMetadataSources.set(metadata",
            "publicSchedulerTimingCompatibilityClaimed: false"
          ]
        )
      },
      [worker775]: {
        evidence: withAdditionalEvidenceTokens(
          rowByWorker(worker775),
          "worker-775-react-act-source",
          [
            "Scheduler,",
            "'unstable_flushExpired'",
            "diagnostics.schedulerMockExpiredActRootWorkSourceValidator",
            "validator.isSchedulerMockExpiredActRootWorkSource(diagnostics)"
          ]
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_810_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.durableEvidenceTokensRecognized, false);
  assert.deepEqual(gate.nonDurableEvidenceTokenViolationIds, [
    `${worker775}.worker-775-react-act-source`,
    `${worker791}.worker-791-scheduler-source`
  ]);
  assertViolationIds(gate, ["non-durable-evidence-token-shape"]);

  const schedulerEvidenceRow = gate.rowsByWorker[worker791].evidence.find(
    (row) => row.role === "worker-791-scheduler-source"
  );
  const reactActEvidenceRow = gate.rowsByWorker[worker775].evidence.find(
    (row) => row.role === "worker-775-react-act-source"
  );
  assert.notEqual(schedulerEvidenceRow, undefined);
  assert.notEqual(reactActEvidenceRow, undefined);
  assert.equal(schedulerEvidenceRow.recognized, false);
  assert.equal(reactActEvidenceRow.recognized, false);
  assert.deepEqual(schedulerEvidenceRow.missingTokens, []);
  assert.deepEqual(reactActEvidenceRow.missingTokens, []);
  assert.deepEqual(
    schedulerEvidenceRow.nonDurableTokens.map((entry) => entry.shapeId),
    [
      "object-api-expression",
      "weak-collection-source-shape",
      "source-collection-method-expression",
      "field-value-expression"
    ]
  );
  assert.deepEqual(
    reactActEvidenceRow.nonDurableTokens.map((entry) => entry.shapeId),
    [
      "comma-suffixed-snippet",
      "string-literal-snippet",
      "member-expression-snippet",
      "member-call-expression"
    ]
  );
});

test("private admission 810 gate rejects prose, test-title, and error-message evidence tokens", () => {
  const gate = evaluatePrivateAdmission810Gate({
    rowOverrides: {
      [worker772]: {
        evidence: withAdditionalEvidenceTokens(
          rowByWorker(worker772),
          "worker-772-delayed-test-fields",
          ["scheduler mock rejects unsafe delayed renderer-root producer metadata"]
        )
      },
      [worker775]: {
        evidence: withAdditionalEvidenceTokens(
          rowByWorker(worker775),
          "worker-775-react-act-source",
          [
            "Only accepted private scheduler/unstable_mock delayed act/root work diagnostics with nested expired act/root evidence can pass this package-private preflight."
          ]
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_810_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.durableEvidenceTokensRecognized, false);
  assert.deepEqual(gate.nonDurableEvidenceTokenViolationIds, [
    `${worker772}.worker-772-delayed-test-fields`,
    `${worker775}.worker-775-react-act-source`
  ]);
  assertViolationIds(gate, ["non-durable-evidence-token-shape"]);

  const delayedTestEvidence = gate.rowsByWorker[worker772].evidence.find(
    (row) => row.role === "worker-772-delayed-test-fields"
  );
  const reactActSourceEvidence = gate.rowsByWorker[worker775].evidence.find(
    (row) => row.role === "worker-775-react-act-source"
  );
  assert.notEqual(delayedTestEvidence, undefined);
  assert.notEqual(reactActSourceEvidence, undefined);
  assert.deepEqual(delayedTestEvidence.missingTokens, []);
  assert.deepEqual(reactActSourceEvidence.missingTokens, []);
  assert.deepEqual(
    delayedTestEvidence.nonDurableTokens.map((entry) => entry.shapeId),
    ["not-allowed-durable-token-class"]
  );
  assert.deepEqual(
    reactActSourceEvidence.nonDurableTokens.map((entry) => entry.shapeId),
    ["not-allowed-durable-token-class"]
  );
});

test("private admission 810 gate rejects single-word prose evidence fragments", () => {
  const gate = evaluatePrivateAdmission810Gate({
    rowOverrides: {
      [worker772]: {
        evidence: withAdditionalEvidenceTokens(
          rowByWorker(worker772),
          "worker-772-delayed-test-fields",
          ["unsafe"]
        )
      },
      [worker775]: {
        evidence: withAdditionalEvidenceTokens(
          rowByWorker(worker775),
          "worker-775-react-act-source",
          ["Only", "accepted"]
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_810_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.durableEvidenceTokensRecognized, false);
  assert.deepEqual(gate.nonDurableEvidenceTokenViolationIds, [
    `${worker772}.worker-772-delayed-test-fields`,
    `${worker775}.worker-775-react-act-source`
  ]);
  assertViolationIds(gate, ["non-durable-evidence-token-shape"]);

  const delayedTestEvidence = gate.rowsByWorker[worker772].evidence.find(
    (row) => row.role === "worker-772-delayed-test-fields"
  );
  const reactActSourceEvidence = gate.rowsByWorker[worker775].evidence.find(
    (row) => row.role === "worker-775-react-act-source"
  );
  assert.notEqual(delayedTestEvidence, undefined);
  assert.notEqual(reactActSourceEvidence, undefined);
  assert.equal(delayedTestEvidence.recognized, false);
  assert.equal(reactActSourceEvidence.recognized, false);
  assert.deepEqual(delayedTestEvidence.missingTokens, []);
  assert.deepEqual(reactActSourceEvidence.missingTokens, []);
  assert.deepEqual(
    delayedTestEvidence.nonDurableTokens.map((entry) => entry.token),
    ["unsafe"]
  );
  assert.deepEqual(
    reactActSourceEvidence.nonDurableTokens.map((entry) => entry.token),
    ["Only", "accepted"]
  );
  assert.deepEqual(
    delayedTestEvidence.nonDurableTokens.map((entry) => entry.shapeId),
    ["not-allowed-durable-token-class"]
  );
  assert.deepEqual(
    reactActSourceEvidence.nonDurableTokens.map((entry) => entry.shapeId),
    [
      "not-allowed-durable-token-class",
      "not-allowed-durable-token-class"
    ]
  );
});

test("private admission 810 gate rejects public act, root, Scheduler, renderer, effects, and package claims", () => {
  const gate = evaluatePrivateAdmission810Gate({
    rowOverrides: {
      [worker792]: {
        publicBlockerClaims: {
          publicActReady: true,
          publicRootBehaviorReady: true,
          publicSchedulerTimingReady: true,
          publicSchedulerFlushHelperReady: true,
          publicRendererCompatibilityClaimed: true,
          publicEffectExecution: true,
          packageCompatibilityClaimed: true,
          acceptsTopLevelDelayedActRootWorkAsPublicActEvidence: true,
          publicDelayedRendererRootAdmissionClaimed: true
        },
        requirements: {
          publicActReady: true,
          publicRootBehaviorReady: true,
          publicSchedulerTimingReady: true,
          publicSchedulerFlushHelperReady: true,
          rendererExecutionReady: true,
          effectsExecutionReady: true,
          packageCompatibilityClaimed: true,
          publicDelayedRendererRootAdmissionClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_810_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.requirementsRecognized, false);
  assert.equal(gate.delayedRendererRootPrivateOnlyRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertViolationIds(gate, [
    "public-compatibility-claim-detected",
    "private-ledger-requirement-mismatch",
    "delayed-renderer-root-public-admission-claim-detected"
  ]);
  assertSubset(
    [
      `${worker792}.publicActReady`,
      `${worker792}.publicRootBehaviorReady`,
      `${worker792}.publicSchedulerTimingReady`,
      `${worker792}.publicSchedulerFlushHelperReady`,
      `${worker792}.publicRendererCompatibilityClaimed`,
      `${worker792}.publicEffectExecution`,
      `${worker792}.packageCompatibilityClaimed`,
      `${worker792}.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence`,
      `${worker792}.publicDelayedRendererRootAdmissionClaimed`
    ],
    gate.publicBlockerClaimViolationIds
  );
  assert.deepEqual(gate.delayedRendererRootPublicClaimIds, [worker792]);
});

test("private admission 810 gate rejects unexpected requirement fields", () => {
  const gate = evaluatePrivateAdmission810Gate({
    rowOverrides: {
      [worker798]: {
        requirements: {
          publicSchedulerFlushBehaviorExecuted: true,
          executesRendererRoots: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_810_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.requirementsRecognized, false);
  assert.deepEqual(gate.requirementFieldViolationIds, [worker798]);
  assertViolationIds(gate, ["requirement-field-mismatch"]);

  const rows = getViolationRows(gate, "requirement-field-mismatch");
  assert.deepEqual(rows, [
    {
      workerId: worker798,
      expectedRequirementFields: PRIVATE_ADMISSION_810_REQUIRED_REQUIREMENT_FIELDS,
      actualRequirementFields: [
        ...PRIVATE_ADMISSION_810_REQUIRED_REQUIREMENT_FIELDS,
        "publicSchedulerFlushBehaviorExecuted",
        "executesRendererRoots"
      ],
      missingRequirementFields: [],
      unexpectedRequirementFields: [
        "publicSchedulerFlushBehaviorExecuted",
        "executesRendererRoots"
      ]
    }
  ]);
});

test("private admission 810 gate rejects non-static evaluation and non-Scheduler validator ownership", () => {
  const gate = evaluatePrivateAdmission810Gate({
    rowOverrides: {
      [worker798]: {
        validatorSource: "public-flush-helper",
        ledgerEvaluationMode: "runtime-execution",
        requirements: {
          sourceValidatorOwnedByScheduler: false,
          schedulerValidatorPrivateDiagnosticsOnly: false,
          sourceTokenChecksOnly: false,
          runtimeExecutionClaimed: true,
          packageSurfaceChanged: true,
          publicFlushHelperValidatorExposed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_810_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.sourceValidatorOwnershipRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assertViolationIds(gate, [
    "private-ledger-requirement-mismatch",
    "static-read-only-ledger-claim-mismatch",
    "scheduler-source-validator-ownership-mismatch"
  ]);
  assert.deepEqual(gate.staticReadOnlyViolationIds, [worker798]);
  assert.deepEqual(gate.sourceValidatorOwnershipViolationIds, [worker798]);
});

test("private admission 810 gate rejects stale diagnostic status and delayed renderer-root scope", () => {
  const gate = evaluatePrivateAdmission810Gate({
    rowOverrides: {
      [worker772]: {
        acceptedStatuses:
          PRIVATE_ADMISSION_810_REQUIRED_STATUSES[worker772].filter(
            (status) =>
              status !==
              "produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff"
          ),
        delayedRendererRootEvidenceScope: "public-delayed-renderer-root"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_810_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.statusesRecognized, false);
  assert.equal(gate.rendererRootScopesRecognized, false);
  assertViolationIds(gate, [
    "private-diagnostic-status-mismatch",
    "delayed-renderer-root-scope-mismatch"
  ]);
});

function assertLedgerRow(
  row,
  {
    evidenceKind,
    delayedRendererRootEvidenceScope,
    privateAdmission,
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, privateAdmission);
  assert.equal(row.evidenceKind, evidenceKind);
  assert.equal(row.delayedRendererRootEvidenceScope, delayedRendererRootEvidenceScope);
  assert.equal(row.validatorSource, "scheduler-private-diagnostics-object");
  assert.equal(
    row.ledgerEvaluationMode,
    "source-token-checks-and-manifest-only"
  );
  assert.deepEqual(
    row.acceptedDiagnosticIds,
    PRIVATE_ADMISSION_810_REQUIRED_DIAGNOSTIC_IDS[row.workerId]
  );
  assert.deepEqual(
    row.acceptedStatuses,
    PRIVATE_ADMISSION_810_REQUIRED_STATUSES[row.workerId]
  );
  for (const key of PRIVATE_ADMISSION_810_REQUIRED_TRUE_REQUIREMENTS) {
    assert.equal(row.requirements[key], true, `${row.workerId}.${key}`);
  }
  for (const key of PRIVATE_ADMISSION_810_REQUIRED_FALSE_REQUIREMENTS) {
    assert.equal(row.requirements[key], false, `${row.workerId}.${key}`);
  }
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
  assert.equal(row.evidenceRecognized, true);
  assertAllFalse(row.publicBlockerClaims, row.workerId);
  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.path);
    assert.deepEqual(evidenceRow.nonDurableTokens, [], evidenceRow.path);
  }
}

function assertAllFalse(record, label) {
  assert.deepEqual(
    Object.values(record),
    Object.values(record).map(() => false),
    label
  );
}

function assertViolationIds(gate, expectedIds) {
  const actualIds = gate.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}

function getViolationRows(gate, id) {
  const violation = gate.violations.find((candidate) => candidate.id === id);
  assert.notEqual(violation, undefined, id);
  return violation.rows;
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function assertEvidenceRoleRecognized(
  gate,
  workerId,
  role,
  expectedRecognized
) {
  const evidenceRow = gate.rowsByWorker[workerId].evidence.find(
    (row) => row.role === role
  );
  assert.notEqual(evidenceRow, undefined, role);
  assert.equal(evidenceRow.recognized, expectedRecognized, role);
}

function rowByWorker(workerId) {
  const row = PRIVATE_ADMISSION_810_ROWS.find(
    (candidate) => candidate.workerId === workerId
  );
  assert.notEqual(row, undefined, workerId);
  return row;
}

function withMissingEvidenceToken(row, role, token) {
  return withAdditionalEvidenceTokens(row, role, [token]);
}

function withAdditionalEvidenceTokens(row, role, tokens) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      tokens: [...evidenceRow.tokens, ...tokens]
    };
  });
}
