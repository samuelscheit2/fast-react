import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_805_GATE_STATUS,
  PRIVATE_ADMISSION_805_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_805_REQUIRED_REQUIREMENTS,
  PRIVATE_ADMISSION_805_REQUIRED_STATUSES,
  PRIVATE_ADMISSION_805_ROWS,
  PRIVATE_ADMISSION_805_VIOLATION_STATUS,
  PRIVATE_ADMISSION_805_WORKERS,
  evaluatePrivateAdmission805Gate
} from "../src/private-admission-805-scheduler-diagnostics-ledger.mjs";

const worker791 = "worker-791-scheduler-source-proof-private-diagnostics";
const worker792 = "worker-792-react-delayed-renderer-root-preflight";
const worker793 = "worker-793-delayed-renderer-root-negative-coverage";
const worker798 = "worker-798-scheduler-private-diagnostics-integrity";
const expectedWorkers = [worker791, worker792, worker793, worker798];

test("private admission 805 manifest records Scheduler diagnostic hardening rows", () => {
  assert.deepEqual(PRIVATE_ADMISSION_805_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_805_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_805_ROWS.length, 4);

  for (const row of PRIVATE_ADMISSION_805_ROWS) {
    assert.equal(Object.isFrozen(row), true, row.workerId);
    assert.equal(row.privateEvidenceOnly, true, row.workerId);
    assert.equal(row.sourceTokenChecksOnly, true, row.workerId);
    assert.equal(row.manifestEvaluationOnly, true, row.workerId);
    assert.equal(row.runtimeExecutionClaimed, false, row.workerId);
    assert.equal(row.schedulerInternalsExecuted, false, row.workerId);
    assert.equal(row.compatibilityClaimed, false, row.workerId);
    assert.equal(
      row.ledgerEvaluationMode,
      "source-token-checks-and-manifest-only",
      row.workerId
    );
    assert.deepEqual(
      Object.keys(row.publicBlockerClaims).sort(),
      [...PRIVATE_ADMISSION_805_PUBLIC_BLOCKER_FIELDS].sort(),
      row.workerId
    );
    assert.deepEqual(
      Object.values(row.publicBlockerClaims),
      Object.values(row.publicBlockerClaims).map(() => false),
      row.workerId
    );
  }
});

test("private admission 805 gate recognizes Scheduler diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission805Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_805_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.manifestRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.diagnosticStatusesRecognized, true);
  assert.equal(gate.requirementsRecognized, true);
  assert.equal(gate.sourceValidatorPrivateDiagnosticsRecognized, true);
  assert.equal(gate.helperOwnKeysAndSymbolAliasesAbsent, true);
  assert.equal(gate.delayedRendererRootNestedPrivateRecognized, true);
  assert.equal(gate.publicPackageHelperFlushClaimsBlocked, true);
  assert.equal(gate.publicSchedulerTimingFlushBlocked, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.publicBlockerClaimViolationIds, []);

  assertPrivateAdmissionRow(gate.rowsByWorker[worker791], {
    privateAdmission:
      "accepted-private-scheduler-source-validator-diagnostics",
    requiredIds: PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS[worker791],
    requiredStatuses: PRIVATE_ADMISSION_805_REQUIRED_STATUSES[worker791],
    requirementSubset: {
      sourceValidatorPrivateDiagnosticsOnly: true,
      privateDiagnosticsFrozen: true,
      helperOwnKeysAbsent: true,
      helperSymbolAliasesAbsent: true
    },
    evidenceRoles: [
      "worker-791-scheduler-private-diagnostics-source",
      "worker-791-react-private-diagnostics-consumer",
      "worker-791-helper-key-symbol-absence"
    ]
  });
  assertPrivateAdmissionRow(gate.rowsByWorker[worker792], {
    privateAdmission:
      "accepted-private-delayed-renderer-root-preflight-nested-expired",
    requiredIds: PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS[worker792],
    requiredStatuses: PRIVATE_ADMISSION_805_REQUIRED_STATUSES[worker792],
    requirementSubset: {
      delayedRendererRootEvidenceNestedPrivateOnly: true,
      rendererRootSourceEvidencePresent: true,
      rendererRootSourceEvidenceOwned: true,
      topLevelDelayedActRootWorkPublicEvidenceBlocked: true
    },
    evidenceRoles: [
      "worker-792-react-preflight-source",
      "worker-792-react-preflight-test",
      "worker-792-scheduler-delayed-policy"
    ]
  });
  assertPrivateAdmissionRow(gate.rowsByWorker[worker793], {
    privateAdmission:
      "accepted-private-delayed-renderer-root-producer-negative-coverage",
    requiredIds: PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS[worker793],
    requiredStatuses: PRIVATE_ADMISSION_805_REQUIRED_STATUSES[worker793],
    requirementSubset: {
      delayedRendererRootProducerEvidenceOnly: true,
      rendererRootPublicClaimsRejected: true,
      rendererRootPublicFlushExecutionRejected: true,
      rendererRootRequestMutationRejected: true
    },
    evidenceRoles: [
      "worker-793-renderer-root-producer-source",
      "worker-793-renderer-root-negative-test"
    ]
  });
  assertPrivateAdmissionRow(gate.rowsByWorker[worker798], {
    privateAdmission:
      "accepted-private-scheduler-diagnostics-integrity-hardening",
    requiredIds: PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS[worker798],
    requiredStatuses: PRIVATE_ADMISSION_805_REQUIRED_STATUSES[worker798],
    requirementSubset: {
      publicPackageHelperFlushClaimsRejected: true,
      publicSchedulerTimingFlushClaimsRejected: true,
      fakeValidatorMutationRejected: true,
      oldGlobalSourceProofRejected: true
    },
    evidenceRoles: [
      "worker-798-public-package-helper-claim-source",
      "worker-798-expired-lane-public-claim-test",
      "worker-798-expired-act-root-public-claim-test",
      "worker-798-helper-fake-validator-test",
      "worker-798-package-surface-guard",
      "worker-798-import-smoke-private-exports"
    ]
  });
});

test("private admission 805 gate rejects missing source-validator evidence and IDs", () => {
  const gate = evaluatePrivateAdmission805Gate({
    rowOverrides: {
      [worker791]: {
        acceptedDiagnosticIds:
          PRIVATE_ADMISSION_805_REQUIRED_ACCEPTED_DIAGNOSTICS[
            worker791
          ].filter(
            (id) => id !== "schedulerMockExpiredActRootWorkSourceValidator"
          ),
        evidence: withMissingEvidenceToken(
          rowByWorker(worker791),
          "worker-791-helper-key-symbol-absence",
          "missing-scheduler-source-validator-token"
        ),
        requirements: {
          sourceValidatorPrivateDiagnosticsOnly: false,
          helperSymbolAliasesAbsent: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_805_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assert.equal(gate.sourceValidatorPrivateDiagnosticsRecognized, false);
  assertViolationIds(gate, [
    "private-admission-evidence-token-missing-or-unstable",
    "scheduler-diagnostic-id-mismatch",
    "scheduler-diagnostic-requirement-mismatch"
  ]);
});

test("private admission 805 gate rejects delayed renderer-root public promotion", () => {
  const gate = evaluatePrivateAdmission805Gate({
    rowOverrides: {
      [worker792]: {
        requirements: {
          delayedRendererRootEvidenceNestedPrivateOnly: false,
          sourceEvidenceMatches: false,
          topLevelDelayedActRootWorkPublicEvidenceBlocked: false
        },
        publicBlockerClaims: {
          acceptsTopLevelDelayedActRootWorkAsPublicActEvidence: true,
          publicReactActCompatibilityClaimed: true,
          rendererRootsReady: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_805_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.delayedRendererRootNestedPrivateRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertViolationIds(gate, [
    "scheduler-diagnostic-requirement-mismatch",
    "public-act-root-renderer-claim-detected"
  ]);
  assertSubset(
    [
      `${worker792}.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence`,
      `${worker792}.publicReactActCompatibilityClaimed`,
      `${worker792}.rendererRootsReady`
    ],
    gate.publicActRootRendererClaimIds
  );
});

test("private admission 805 gate rejects public package/helper flush and runtime claims", () => {
  const gate = evaluatePrivateAdmission805Gate({
    rowOverrides: {
      [worker798]: {
        sourceTokenChecksOnly: false,
        runtimeExecutionClaimed: true,
        schedulerInternalsExecuted: true,
        ledgerEvaluationMode: "runtime-execution",
        publicBlockerClaims: {
          packageCompatibilityClaimed: true,
          publicSchedulerFlushHelperCompatibilityClaimed: true,
          publicSchedulerTimingCompatibilityClaimed: true,
          invokesPublicSchedulerFlushHelper: true,
          publicSchedulerFlushBehaviorExecuted: true,
          routesAcceptedMockSchedulerFlushHelperMetadata: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_805_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.publicPackageHelperFlushClaimsBlocked, false);
  assert.equal(gate.publicSchedulerTimingFlushBlocked, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertViolationIds(gate, [
    "scheduler-ledger-runtime-execution-claim",
    "public-package-or-helper-flush-claim-detected",
    "public-scheduler-timing-or-flush-behavior-claim-detected"
  ]);
  assertSubset(
    [
      `${worker798}.packageCompatibilityClaimed`,
      `${worker798}.publicSchedulerFlushHelperCompatibilityClaimed`,
      `${worker798}.routesAcceptedMockSchedulerFlushHelperMetadata`
    ],
    gate.publicPackageHelperFlushClaimIds
  );
  assertSubset(
    [
      `${worker798}.publicSchedulerTimingCompatibilityClaimed`,
      `${worker798}.invokesPublicSchedulerFlushHelper`,
      `${worker798}.publicSchedulerFlushBehaviorExecuted`
    ],
    gate.publicSchedulerTimingFlushClaimIds
  );
});

test("private admission 805 gate rejects progress prose evidence", () => {
  const gate = evaluatePrivateAdmission805Gate({
    rowOverrides: {
      [worker791]: {
        evidence: [
          {
            role: "worker-791-progress-prose",
            path: "worker-progress/worker-791-scheduler-source-proof-private-diagnostics.md",
            tokens: ["Moved the Scheduler mock", "Object.isFrozen(value)"]
          }
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_805_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, [
    "private-admission-evidence-token-missing-or-unstable"
  ]);
  const mismatch = gate.violations.find(
    (violation) =>
      violation.id === "private-admission-evidence-token-missing-or-unstable"
  );
  assertSubset(
    [
      "worker-progress-evidence-path",
      "prose-or-formatted-token:Moved the Scheduler mock",
      "expression-token:Object.isFrozen(value)"
    ],
    mismatch.rows[0].unstableEvidenceReasons
  );
});

function assertPrivateAdmissionRow(
  row,
  { privateAdmission, requiredIds, requiredStatuses, requirementSubset, evidenceRoles }
) {
  assert.equal(row.privateAdmission, privateAdmission);
  assert.deepEqual(row.acceptedDiagnosticIds, requiredIds, row.workerId);
  assert.deepEqual(
    row.acceptedDiagnosticStatuses,
    requiredStatuses,
    row.workerId
  );
  for (const [requirement, expected] of Object.entries(requirementSubset)) {
    assert.equal(row.requirements[requirement], expected, requirement);
  }
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles,
    row.workerId
  );
  assert.equal(row.evidenceRecognized, true, row.workerId);
}

function rowByWorker(workerId) {
  return PRIVATE_ADMISSION_805_ROWS.find((row) => row.workerId === workerId);
}

function withMissingEvidenceToken(row, role, token) {
  return row.evidence.map((evidenceRow) =>
    evidenceRow.role === role
      ? {
          ...evidenceRow,
          tokens: [...evidenceRow.tokens, token]
        }
      : evidenceRow
  );
}

function assertViolationIds(gate, expectedIds) {
  assert.deepEqual(
    gate.violations.map((violation) => violation.id).sort(),
    [...expectedIds].sort()
  );
}

function assertSubset(expectedSubset, actual) {
  for (const expected of expectedSubset) {
    assert.equal(actual.includes(expected), true, expected);
  }
}
