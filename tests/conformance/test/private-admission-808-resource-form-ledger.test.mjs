import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_808_GATE_STATUS,
  PRIVATE_ADMISSION_808_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS,
  PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES,
  PRIVATE_ADMISSION_808_REQUIRED_STATUSES,
  PRIVATE_ADMISSION_808_ROWS,
  PRIVATE_ADMISSION_808_VIOLATION_STATUS,
  PRIVATE_ADMISSION_808_WORKERS,
  evaluatePrivateAdmission808Gate
} from "../src/private-admission-808-resource-form-ledger.mjs";

const worker778 = "worker-778-resource-root-map-storage-preflight";
const worker779 = "worker-779-form-action-rejected-error-preflight";
const worker794 = "worker-794-resource-root-map-conformance-gate";
const worker796 = "worker-796-private-admission-778-779-resource-form-ledger";
const worker800 = "worker-800-form-rejected-error-blocker-hardening";
const worker802 = "worker-802-resource-root-map-negative-matrix";

const expectedWorkers = [
  worker778,
  worker779,
  worker794,
  worker796,
  worker800,
  worker802
];

test("private admission 808 manifest pins resource/form hardening workers", () => {
  assert.deepEqual(PRIVATE_ADMISSION_808_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_808_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_808_ROWS.length, 6);
  assert.equal(new Set(PRIVATE_ADMISSION_808_WORKERS).size, 6);

  for (const row of PRIVATE_ADMISSION_808_ROWS) {
    assert.deepEqual(
      Object.keys(row.publicBlockers).sort(),
      [...PRIVATE_ADMISSION_808_PUBLIC_BLOCKER_FIELDS].sort(),
      row.workerId
    );
    assertAllFalse(row.publicBlockers, row.workerId);
    assert.equal(row.sourceTokenChecksOnly, true, row.workerId);
    assert.equal(row.manifestEvaluationOnly, true, row.workerId);
    assert.equal(row.runtimeExecutionClaimed, false, row.workerId);
    assert.equal(row.publicRuntimeExecutionClaimed, false, row.workerId);
  }
});

test("private admission 808 gate recognizes accepted resource/form hardening without public compatibility", () => {
  const gate = evaluatePrivateAdmission808Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_808_GATE_STATUS);
  assert.equal(gate.privateHardeningRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.acceptedIdsRecognized, true);
  assert.equal(gate.statusesRecognized, true);
  assert.equal(gate.fieldNamesRecognized, true);
  assert.equal(gate.priorLedgerRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.publicBlockerViolationIds, []);
  assert.deepEqual(gate.resourceLeakClaimIds, []);
  assert.deepEqual(gate.formLeakClaimIds, []);
  assert.deepEqual(gate.domHeadLifecycleLeakClaimIds, []);
  assert.deepEqual(gate.packageExportLeakClaimIds, []);
  assert.deepEqual(gate.publicCompatibilityClaimIds, []);

  const resourceRow = gate.rowsByWorker[worker794];
  assert.deepEqual(
    resourceRow.acceptedDiagnosticIds,
    PRIVATE_ADMISSION_808_REQUIRED_ACCEPTED_IDS[worker794]
  );
  assert.deepEqual(
    resourceRow.acceptedStatuses,
    PRIVATE_ADMISSION_808_REQUIRED_STATUSES[worker794]
  );
  assert.deepEqual(
    resourceRow.requiredFieldNames,
    PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES[worker794]
  );
  assertIncludes(resourceRow.requiredFieldNames, [
    "expectedSourceResourceMapCommitRowIds",
    "canonicalRootMapStorageRow",
    "acceptedRootMapNames",
    "rejectsStaleSourceRows"
  ]);
  assert.equal(resourceRow.publicBlockers.publicResourceMapCommitBehavior, false);
  assert.equal(resourceRow.publicBlockers.realDocumentMutated, false);
  assert.equal(resourceRow.publicBlockers.scriptExecutionStarted, false);
  assert.equal(resourceRow.publicBlockers.packageCompatibilityClaimed, false);

  const formRow = gate.rowsByWorker[worker800];
  assert.deepEqual(
    formRow.requiredFieldNames,
    PRIVATE_ADMISSION_808_REQUIRED_FIELD_NAMES[worker800]
  );
  assertIncludes(formRow.requiredFieldNames, [
    "consumedRejectedExecutions",
    "consumedFormActionRejectedErrorPreflightExecutions",
    "sourceAsyncCallbackExecutionId",
    "actionInvocationRequested",
    "publicRequestFormResetRequested",
    "publicDomMutationReachable",
    "packageCompatibilityClaimed"
  ]);
  assert.equal(formRow.publicBlockers.publicSubmitDispatchReachable, false);
  assert.equal(formRow.publicBlockers.publicActionInvocationReachable, false);
  assert.equal(formRow.publicBlockers.publicErrorRoutingReachable, false);
  assert.equal(formRow.publicBlockers.formResetCommitted, false);
  assert.equal(formRow.publicBlockers.realFormReset, false);

  for (const row of gate.rows) {
    assert.equal(row.recognized, true, row.workerId);
    assert.equal(row.staticReadOnlyRecognized, true, row.workerId);
    assertAllFalse(row.publicBlockers, row.workerId);
    for (const evidenceRow of row.evidence) {
      assert.equal(evidenceRow.recognized, true, evidenceRow.role);
      assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
      assert.deepEqual(
        evidenceRow.forbiddenTokensPresent,
        [],
        evidenceRow.role
      );
    }
  }
});

test("private admission 808 gate rejects public resource and form compatibility claims", () => {
  const gate = evaluatePrivateAdmission808Gate({
    rowOverrides: {
      [worker778]: {
        publicBlockers: trueBlockers([
          "publicResourceRootMapStorageCompatibilityClaimed",
          "publicResourceMapCommitBehavior"
        ])
      },
      [worker779]: {
        publicBlockers: trueBlockers([
          "publicFormRejectedErrorCompatibilityClaimed",
          "publicSubmitDispatchReachable"
        ])
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_808_VIOLATION_STATUS);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.deepEqual(gate.resourceLeakClaimIds, [
    `${worker778}.publicResourceMapCommitBehavior`
  ]);
  assert.deepEqual(gate.formLeakClaimIds, [
    `${worker779}.publicSubmitDispatchReachable`
  ]);
  assert.deepEqual(gate.publicCompatibilityClaimIds, [
    `${worker778}.publicResourceRootMapStorageCompatibilityClaimed`,
    `${worker779}.publicFormRejectedErrorCompatibilityClaimed`
  ]);
  assertViolationIds(gate, [
    "resource-public-claim-detected",
    "form-public-claim-detected",
    "public-compatibility-claim-detected"
  ]);
});

test("private admission 808 gate rejects submit reset action and error routing leaks", () => {
  const gate = evaluatePrivateAdmission808Gate({
    rowOverrides: {
      [worker800]: {
        publicBlockers: trueBlockers([
          "publicFormSubmissionReachable",
          "publicSubmitDispatchReachable",
          "publicRequestFormResetReachable",
          "publicActionInvocationReachable",
          "publicErrorRoutingReachable",
          "actionInvocationRequested",
          "actionInvoked",
          "publicActionInvoked",
          "resetStateQueued",
          "resetUpdateEnqueued",
          "publicRequestFormResetRequested",
          "afterMutationEffectsVisited",
          "resetFormInstanceCalled",
          "formResetCommitted",
          "realFormReset",
          "rootErrorUpdateScheduled",
          "publicRootErrorCallbackInvoked",
          "errorBoundaryScheduled"
        ])
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_808_VIOLATION_STATUS);
  assert.deepEqual(gate.formLeakClaimIds, [
    `${worker800}.publicFormSubmissionReachable`,
    `${worker800}.publicSubmitDispatchReachable`,
    `${worker800}.publicRequestFormResetReachable`,
    `${worker800}.publicActionInvocationReachable`,
    `${worker800}.publicErrorRoutingReachable`,
    `${worker800}.actionInvocationRequested`,
    `${worker800}.actionInvoked`,
    `${worker800}.publicActionInvoked`,
    `${worker800}.resetStateQueued`,
    `${worker800}.resetUpdateEnqueued`,
    `${worker800}.publicRequestFormResetRequested`,
    `${worker800}.afterMutationEffectsVisited`,
    `${worker800}.resetFormInstanceCalled`,
    `${worker800}.formResetCommitted`,
    `${worker800}.realFormReset`,
    `${worker800}.rootErrorUpdateScheduled`,
    `${worker800}.publicRootErrorCallbackInvoked`,
    `${worker800}.errorBoundaryScheduled`
  ]);
  assertViolationIds(gate, ["form-public-claim-detected"]);
});

test("private admission 808 gate rejects DOM head lifecycle package and export leaks", () => {
  const gate = evaluatePrivateAdmission808Gate({
    rowOverrides: {
      [worker802]: {
        sourceTokenChecksOnly: false,
        runtimeExecutionClaimed: true,
        publicBlockers: trueBlockers([
          "realDocumentMutated",
          "fakeHeadMutated",
          "publicHeadSingletonBehavior",
          "publicStylesheetResourceBehavior",
          "publicStylesheetPrecedenceBehavior",
          "scriptExecutionStarted",
          "stylesheetLoadStateMutated",
          "packageCompatibilityClaimed",
          "packageExportCompatibilityClaimed",
          "rootManifestsOrLockfilesMutated",
          "exportsPrivateResourceHintRootMapStoragePreflight",
          "compatibilityClaimed"
        ])
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_808_VIOLATION_STATUS);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.deepEqual(gate.staticReadOnlyViolationIds, [worker802]);
  assert.deepEqual(gate.resourceLeakClaimIds, [
    `${worker802}.publicStylesheetResourceBehavior`,
    `${worker802}.publicStylesheetPrecedenceBehavior`
  ]);
  assert.deepEqual(gate.domHeadLifecycleLeakClaimIds, [
    `${worker802}.realDocumentMutated`,
    `${worker802}.fakeHeadMutated`,
    `${worker802}.publicHeadSingletonBehavior`,
    `${worker802}.scriptExecutionStarted`,
    `${worker802}.stylesheetLoadStateMutated`
  ]);
  assert.deepEqual(gate.packageExportLeakClaimIds, [
    `${worker802}.packageCompatibilityClaimed`,
    `${worker802}.packageExportCompatibilityClaimed`,
    `${worker802}.rootManifestsOrLockfilesMutated`,
    `${worker802}.exportsPrivateResourceHintRootMapStoragePreflight`
  ]);
  assert.deepEqual(gate.publicCompatibilityClaimIds, [
    `${worker802}.compatibilityClaimed`
  ]);
  assertViolationIds(gate, [
    "resource-form-hardening-static-mode-mismatch",
    "resource-public-claim-detected",
    "dom-head-or-lifecycle-claim-detected",
    "package-or-export-compatibility-claim-detected",
    "public-compatibility-claim-detected"
  ]);
});

test("private admission 808 gate rejects stale ids fields and missing source evidence", () => {
  const gate = evaluatePrivateAdmission808Gate({
    rowOverrides: {
      [worker794]: {
        acceptedStatuses: ["validated-private-resource-root-map-storage-preflight"],
        requiredFieldNames: ["rootMapName"],
        evidence: [
          {
            role: "worker-794-missing-root-map-token",
            path: "tests/conformance/test/react-dom-resource-hints-oracle.test.mjs",
            tokens: ["missing-root-map-negative-matrix-token"],
            forbiddenTokens: []
          }
        ]
      },
      [worker802]: {
        acceptedDiagnosticIds: [
          "root-map-storage-preflight-skipped-preload-props"
        ],
        publicBlockers: {
          unknownPublicClaimField: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_808_VIOLATION_STATUS);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.acceptedIdsRecognized, false);
  assert.equal(gate.statusesRecognized, false);
  assert.equal(gate.fieldNamesRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assertViolationIds(gate, [
    "resource-form-hardening-evidence-token-missing",
    "resource-form-hardening-accepted-id-mismatch",
    "resource-form-hardening-status-mismatch",
    "resource-form-hardening-field-name-mismatch",
    "resource-form-hardening-public-blocker-field-mismatch"
  ]);
  assert.deepEqual(
    gate.rowsByWorker[worker794].evidence[0].missingTokens,
    ["missing-root-map-negative-matrix-token"]
  );
});

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

function trueBlockers(fields) {
  return Object.fromEntries(fields.map((field) => [field, true]));
}

function assertViolationIds(gate, expectedIds) {
  assert.deepEqual(
    gate.violations.map((violation) => violation.id),
    expectedIds
  );
}
