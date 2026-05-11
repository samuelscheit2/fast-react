import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_850_BLOCKED_PUBLIC_CLAIMS,
  PRIVATE_ADMISSION_850_LEDGER_STATUS,
  PRIVATE_ADMISSION_850_LEDGER_VIOLATION_STATUS,
  PRIVATE_ADMISSION_850_REQUIRED_ACCEPTED_IDS,
  PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE,
  PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE_LINEAGE,
  PRIVATE_ADMISSION_850_REQUIRED_FIELD_NAMES,
  PRIVATE_ADMISSION_850_REQUIRED_SOURCE_VALUES,
  PRIVATE_ADMISSION_850_REQUIRED_STATUSES,
  PRIVATE_ADMISSION_850_ROW_CONTRACT,
  PRIVATE_ADMISSION_850_ROWS,
  PRIVATE_ADMISSION_850_WORKERS,
  evaluatePrivateAdmission850ResourceFormExecutionLedger
} from "../src/private-admission-850-resource-form-execution-ledger.mjs";

const worker829 = "worker-829-resource-root-map-storage-private-execution";
const worker830 = "worker-830-form-action-fulfilled-reset-fake-commit";
const expectedWorkers = [worker829, worker830];
const sourceTokenPolicy =
  "source-owned-identifiers-statuses-functions-fields-and-constants";

test("private admission 850 manifest pins Worker 829 and Worker 830 execution rows", () => {
  assert.deepEqual(PRIVATE_ADMISSION_850_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_850_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_850_ROWS.length, 2);
  assert.equal(new Set(PRIVATE_ADMISSION_850_WORKERS).size, 2);
  assertSubset(
    [
      "publicResourceRootMapStorageCompatibilityClaimed",
      "publicFormSubmissionReachable",
      "publicSubmitDispatchReachable",
      "publicRequestFormResetReachable",
      "actionInvoked",
      "reactUpdateQueued",
      "updateQueueCaptured",
      "resetFormInstanceCalled",
      "domMutation",
      "packageCompatibilityClaimed",
      "publicPackageExportsCompatibilityClaimed"
    ],
    PRIVATE_ADMISSION_850_BLOCKED_PUBLIC_CLAIMS
  );

  for (const row of PRIVATE_ADMISSION_850_ROWS) {
    assert.equal(Object.isFrozen(row), true, row.workerId);
    assert.deepEqual(rowContract(row), PRIVATE_ADMISSION_850_ROW_CONTRACT);
    assert.deepEqual(
      row.evidenceLineage,
      PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE_LINEAGE,
      row.workerId
    );
    assert.deepEqual(
      Object.keys(row.publicBlockerClaims).sort(),
      [...PRIVATE_ADMISSION_850_BLOCKED_PUBLIC_CLAIMS].sort(),
      row.workerId
    );
    assertAllFalse(row.publicBlockerClaims, row.workerId);
    assert.deepEqual(
      row.evidence.map((evidenceRow) => evidenceRow.evidenceId),
      PRIVATE_ADMISSION_850_REQUIRED_EVIDENCE[row.workerId],
      row.workerId
    );

    for (const evidenceRow of row.evidence) {
      assert.equal(evidenceRow.tokenPolicy, sourceTokenPolicy);
      assert.equal(
        evidenceRow.path.startsWith("worker-progress/"),
        false,
        evidenceRow.evidenceId
      );
      assert.equal(
        evidenceRow.path.includes(".test."),
        false,
        evidenceRow.evidenceId
      );
      for (const token of evidenceRow.tokens) {
        assertDurableEvidenceToken(token);
      }
    }
  }
});

test("private admission 850 recognizes accepted private execution evidence without public compatibility", () => {
  const ledger = evaluatePrivateAdmission850ResourceFormExecutionLedger();

  assert.equal(ledger.status, PRIVATE_ADMISSION_850_LEDGER_STATUS);
  assert.equal(ledger.privateExecutionEvidenceRecognized, true);
  assert.equal(ledger.manifestRecognized, true);
  assert.equal(ledger.priorLedgerRecognized, true);
  assert.equal(ledger.evidenceRolesRecognized, true);
  assert.equal(ledger.evidenceRecognized, true);
  assert.equal(ledger.acceptedIdsRecognized, true);
  assert.equal(ledger.statusesRecognized, true);
  assert.equal(ledger.fieldNamesRecognized, true);
  assert.equal(ledger.sourceOwnedValuesRecognized, true);
  assert.equal(ledger.blockedPublicClaimsRecognized, true);
  assert.equal(ledger.rowContractRecognized, true);
  assert.equal(ledger.evidenceLineageRecognized, true);
  assert.equal(ledger.staticReadOnlyRecognized, true);
  assert.equal(ledger.compatibilityClaimed, false);
  assert.equal(ledger.publicCompatibilityClaimed, false);
  assert.deepEqual(ledger.queueWorkers, expectedWorkers);
  assert.deepEqual(ledger.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(ledger.violations, []);
  assert.deepEqual(ledger.resourceLeakClaimIds, []);
  assert.deepEqual(ledger.formLeakClaimIds, []);
  assert.deepEqual(ledger.updateResetDomLeakClaimIds, []);
  assert.deepEqual(ledger.packageExportLeakClaimIds, []);
  assert.deepEqual(ledger.publicCompatibilityLeakClaimIds, []);

  const resource = ledger.rowsByWorker[worker829];
  assert.equal(
    resource.privateAdmission,
    "accepted-private-resource-root-map-storage-execution"
  );
  assert.deepEqual(
    resource.acceptedPrivateEvidenceIds,
    PRIVATE_ADMISSION_850_REQUIRED_ACCEPTED_IDS[worker829]
  );
  assert.deepEqual(
    resource.acceptedStatuses,
    PRIVATE_ADMISSION_850_REQUIRED_STATUSES[worker829]
  );
  assert.deepEqual(
    resource.requiredFieldNames,
    PRIVATE_ADMISSION_850_REQUIRED_FIELD_NAMES[worker829]
  );
  assert.deepEqual(
    resource.sourceOwnedEvidenceValues,
    PRIVATE_ADMISSION_850_REQUIRED_SOURCE_VALUES[worker829]
  );
  assertIncludes(resource.requiredFieldNames, [
    "rootMapStorageExecutionRows",
    "rootMapStorageSnapshot",
    "hoistableStylesRootMapExecutionRows",
    "hoistableScriptsRootMapExecutionRows",
    "storedInRootMap",
    "preloadPropsMapMutated",
    "realResourceMapsMutated"
  ]);

  const form = ledger.rowsByWorker[worker830];
  assert.equal(
    form.privateAdmission,
    "accepted-private-form-action-fulfilled-reset-fake-queue-commit"
  );
  assert.deepEqual(
    form.sourceOwnedEvidenceValues,
    PRIVATE_ADMISSION_850_REQUIRED_SOURCE_VALUES[worker830]
  );
  assertIncludes(form.requiredFieldNames, [
    "fakeResetStateQueueExecution",
    "fakeResetCommitExecution",
    "resetCurrentness",
    "resetCurrentnessId",
    "resetGeneration",
    "resetGenerationCurrent",
    "queueExecutionKind",
    "requestUpdateLaneRecorded",
    "dispatchSetStateInternalRecorded",
    "updateQueueCaptured",
    "resetFormInstanceCalled",
    "domMutation"
  ]);

  for (const row of ledger.rows) {
    assert.equal(row.recognized, true, row.workerId);
    assert.equal(row.staticReadOnlyRecognized, true, row.workerId);
    assertAllFalse(row.publicBlockerClaims, row.workerId);
    for (const evidenceRow of row.evidence) {
      assert.equal(evidenceRow.recognized, true, evidenceRow.evidenceId);
      assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.evidenceId);
      assert.deepEqual(
        evidenceRow.forbiddenTokensPresent,
        [],
        evidenceRow.evidenceId
      );
      assert.deepEqual(
        evidenceRow.unstableEvidenceReasons,
        [],
        evidenceRow.evidenceId
      );
    }
  }
});

test("private admission 850 rejects missing stale cloned tampered and caller-supplied evidence", () => {
  const stale = evaluatePrivateAdmission850ResourceFormExecutionLedger({
    rowOverrides: {
      [worker829]: {
        evidence: [],
        acceptedPrivateEvidenceIds:
          PRIVATE_ADMISSION_850_REQUIRED_ACCEPTED_IDS[worker829].filter(
            (id) =>
              id !==
              "react-19.2.6-resource-root-map-storage-private-execution-snapshot"
          ),
        acceptedStatuses: ["executed-private-resource-hint-root-map-storage-record"],
        requiredFieldNames: ["rootMapStorageExecutionRows"],
        evidenceLineage: {
          clonedEvidence: true,
          tamperedEvidence: true
        }
      },
      [worker830]: {
        sourceOwnedEvidenceValues: {
          diagnosticKind: "real-react-update-queue",
          queueExecutionKind: "caller-supplied-reset-queue"
        },
        evidenceLineage: {
          callerSuppliedDiagnosticStrings: true
        }
      }
    }
  });

  assert.equal(stale.status, PRIVATE_ADMISSION_850_LEDGER_VIOLATION_STATUS);
  assert.equal(stale.privateExecutionEvidenceRecognized, false);
  assert.equal(stale.evidenceRolesRecognized, false);
  assert.equal(stale.acceptedIdsRecognized, false);
  assert.equal(stale.statusesRecognized, false);
  assert.equal(stale.fieldNamesRecognized, false);
  assert.equal(stale.sourceOwnedValuesRecognized, false);
  assert.equal(stale.evidenceLineageRecognized, false);
  assertViolationIds(stale, [
    "private-admission-850-required-evidence-mismatch",
    "private-admission-850-accepted-id-mismatch",
    "private-admission-850-status-mismatch",
    "private-admission-850-field-name-mismatch",
    "private-admission-850-source-owned-value-mismatch",
    "private-admission-850-evidence-lineage-mismatch"
  ]);

  const sourceValueViolation = stale.violations.find(
    (violation) =>
      violation.id === "private-admission-850-source-owned-value-mismatch"
  );
  assert.equal(
    sourceValueViolation.rows[0].actualSourceOwnedValues.diagnosticKind,
    "real-react-update-queue"
  );
  const lineageViolation = stale.violations.find(
    (violation) =>
      violation.id === "private-admission-850-evidence-lineage-mismatch"
  );
  assert.equal(
    lineageViolation.rows.some(
      (row) => row.actualLineage.clonedEvidence === true
    ),
    true
  );
  assert.equal(
    lineageViolation.rows.some(
      (row) => row.actualLineage.tamperedEvidence === true
    ),
    true
  );
  assert.equal(
    lineageViolation.rows.some(
      (row) => row.actualLineage.callerSuppliedDiagnosticStrings === true
    ),
    true
  );
});

test("private admission 850 rejects public resource form update DOM reset package and export claims", () => {
  const ledger = evaluatePrivateAdmission850ResourceFormExecutionLedger({
    rowOverrides: {
      [worker829]: {
        publicBlockerClaims: trueClaims([
          "publicResourceRootMapStorageCompatibilityClaimed",
          "publicResourceMapCommitBehavior",
          "realResourceMapsMutated",
          "preloadPropsMapMutated",
          "realHeadMutated",
          "scriptExecutionStarted",
          "publicPackageExportsCompatibilityClaimed"
        ])
      },
      [worker830]: {
        publicBlockerClaims: trueClaims([
          "publicFormSubmissionReachable",
          "publicSubmitDispatchReachable",
          "publicRequestFormResetReachable",
          "publicActionInvocationRequested",
          "actionInvoked",
          "reactUpdateQueued",
          "updateQueueCaptured",
          "resetFormInstanceCalled",
          "formResetCommitted",
          "domMutation",
          "packageCompatibilityClaimed",
          "publicFormActionCompatibilityClaimed"
        ])
      }
    }
  });

  assert.equal(ledger.status, PRIVATE_ADMISSION_850_LEDGER_VIOLATION_STATUS);
  assert.equal(ledger.blockedPublicClaimsRecognized, false);
  assert.equal(ledger.compatibilityClaimed, true);
  assert.equal(ledger.publicCompatibilityClaimed, true);
  assert.deepEqual(ledger.resourceLeakClaimIds, [
    `${worker829}.publicResourceMapCommitBehavior`,
    `${worker829}.publicResourceRootMapStorageCompatibilityClaimed`,
    `${worker829}.realResourceMapsMutated`,
    `${worker829}.preloadPropsMapMutated`
  ]);
  assert.deepEqual(ledger.formLeakClaimIds, [
    `${worker830}.publicFormSubmissionReachable`,
    `${worker830}.publicSubmitDispatchReachable`,
    `${worker830}.publicRequestFormResetReachable`,
    `${worker830}.publicActionInvocationRequested`,
    `${worker830}.actionInvoked`
  ]);
  assert.deepEqual(ledger.updateResetDomLeakClaimIds, [
    `${worker829}.realHeadMutated`,
    `${worker829}.scriptExecutionStarted`,
    `${worker830}.domMutation`,
    `${worker830}.reactUpdateQueued`,
    `${worker830}.updateQueueCaptured`,
    `${worker830}.resetFormInstanceCalled`,
    `${worker830}.formResetCommitted`
  ]);
  assert.deepEqual(ledger.packageExportLeakClaimIds, [
    `${worker829}.publicPackageExportsCompatibilityClaimed`,
    `${worker830}.packageCompatibilityClaimed`
  ]);
  assert.deepEqual(ledger.publicCompatibilityLeakClaimIds, [
    `${worker829}.publicResourceRootMapStorageCompatibilityClaimed`,
    `${worker829}.publicPackageExportsCompatibilityClaimed`,
    `${worker830}.publicFormActionCompatibilityClaimed`
  ]);
  assertViolationIds(ledger, [
    "private-admission-850-resource-public-claim-detected",
    "private-admission-850-form-public-claim-detected",
    "private-admission-850-update-reset-dom-claim-detected",
    "private-admission-850-package-export-claim-detected",
    "private-admission-850-public-compatibility-claim-detected"
  ]);
});

test("private admission 850 rejects progress prose test-title error-message and source-syntax evidence", () => {
  const ledger = evaluatePrivateAdmission850ResourceFormExecutionLedger({
    rowOverrides: {
      [worker829]: {
        evidence: [
          {
            evidenceId: "worker-829-progress-prose",
            path: "worker-progress/worker-829-resource-root-map-storage-private-execution.md",
            tokenPolicy: sourceTokenPolicy,
            tokens: [
              "Worker 829 accepted private execution",
              "recordResourceHintRootMapStorageWithGate(...)"
            ],
            forbiddenTokens: []
          }
        ]
      },
      [worker830]: {
        evidence: [
          {
            evidenceId: "worker-830-test-title-error-message",
            path: "packages/react-dom/test/form-action-fulfilled-reset-execution.test.js",
            tokenPolicy: sourceTokenPolicy,
            tokens: [
              "private fulfilled form action reset execution records deterministic fake queue and commit evidence",
              "Invalid private React DOM form action fulfilled reset execution record"
            ],
            forbiddenTokens: []
          }
        ]
      }
    }
  });

  assert.equal(ledger.status, PRIVATE_ADMISSION_850_LEDGER_VIOLATION_STATUS);
  assert.equal(ledger.evidenceRolesRecognized, false);
  assert.equal(ledger.evidenceRecognized, false);
  assertViolationIds(ledger, [
    "private-admission-850-required-evidence-mismatch",
    "private-admission-850-evidence-token-missing-or-unstable"
  ]);

  const evidenceViolation = ledger.violations.find(
    (violation) =>
      violation.id === "private-admission-850-evidence-token-missing-or-unstable"
  );
  const progress = evidenceViolation.rows.find(
    (row) => row.evidenceId === "worker-829-progress-prose"
  );
  assertSubset(
    [
      "worker-progress-evidence-path",
      "prose-or-formatted-token:Worker 829 accepted private execution",
      "source-syntax-token:recordResourceHintRootMapStorageWithGate(...)"
    ],
    progress.unstableEvidenceReasons
  );
  const testEvidence = evidenceViolation.rows.find(
    (row) => row.evidenceId === "worker-830-test-title-error-message"
  );
  assertSubset(
    [
      "test-evidence-path",
      "prose-or-formatted-token:private fulfilled form action reset execution records deterministic fake queue and commit evidence",
      "prose-or-formatted-token:Invalid private React DOM form action fulfilled reset execution record"
    ],
    testEvidence.unstableEvidenceReasons
  );
});

test("private admission 850 rejects row contract static-mode and blocker-field tampering", () => {
  const ledger = evaluatePrivateAdmission850ResourceFormExecutionLedger({
    rowOverrides: {
      [worker830]: {
        sourceQueue: "public-compatibility",
        ledgerEvaluationMode: "runtime-package-probe",
        sourceTokenChecksOnly: false,
        manifestEvaluationOnly: false,
        staticReadOnlyLedger: false,
        runtimeExecutionClaimed: true,
        publicRuntimeExecutionClaimed: true,
        executesPublicBehavior: true,
        publicFormsClaimed: true,
        packageCompatibilityClaimed: true,
        exportsChanged: true,
        compatibilityClaimed: true,
        publicBlockerClaims: {
          unknownPublicCompatibilityClaim: false
        }
      }
    }
  });

  assert.equal(ledger.status, PRIVATE_ADMISSION_850_LEDGER_VIOLATION_STATUS);
  assert.equal(ledger.rowContractRecognized, false);
  assert.equal(ledger.staticReadOnlyRecognized, false);
  assert.equal(ledger.publicBlockerFieldsRecognized, false);
  assert.deepEqual(ledger.staticReadOnlyViolationIds, [worker830]);
  assertViolationIds(ledger, [
    "private-admission-850-public-blocker-field-mismatch",
    "private-admission-850-row-contract-mismatch",
    "private-admission-850-static-read-only-mismatch"
  ]);
  const rowContractViolation = ledger.violations.find(
    (violation) => violation.id === "private-admission-850-row-contract-mismatch"
  );
  assert.deepEqual(
    rowContractViolation.rows[0].expectedContract,
    PRIVATE_ADMISSION_850_ROW_CONTRACT
  );
});

function rowContract(row) {
  return Object.fromEntries(
    Object.keys(PRIVATE_ADMISSION_850_ROW_CONTRACT).map((key) => [
      key,
      row[key]
    ])
  );
}

function trueClaims(fields) {
  return Object.fromEntries(fields.map((field) => [field, true]));
}

function assertAllFalse(record, label) {
  assert.deepEqual(
    Object.values(record),
    Object.values(record).map(() => false),
    label
  );
}

function assertIncludes(actual, expectedSubset) {
  for (const value of expectedSubset) {
    assert.equal(actual.includes(value), true, value);
  }
}

function assertSubset(expectedSubset, actual) {
  for (const value of expectedSubset) {
    assert.equal(actual.includes(value), true, value);
  }
}

function assertDurableEvidenceToken(token) {
  assert.equal(typeof token, "string", token);
  assert.notEqual(token.length, 0, token);
  assert.equal(/\s/u.test(token), false, token);
  assert.equal(/[(){};]/u.test(token), false, token);
  assert.equal(/=>|===|!==|&&|\|\|/u.test(token), false, token);
}

function assertViolationIds(ledger, expectedIds) {
  assert.deepEqual(
    ledger.violations.map((violation) => violation.id),
    expectedIds
  );
}
