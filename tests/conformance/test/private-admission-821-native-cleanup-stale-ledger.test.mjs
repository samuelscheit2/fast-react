import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_821_GATE_STATUS,
  PRIVATE_ADMISSION_821_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_821_REQUIRED_CLEANUP_BLOCKER_IDS,
  PRIVATE_ADMISSION_821_REQUIRED_FIELD_NAMES,
  PRIVATE_ADMISSION_821_REQUIRED_FUNCTION_NAMES,
  PRIVATE_ADMISSION_821_REQUIRED_NATIVE_CLEANUP_EVIDENCE_IDS,
  PRIVATE_ADMISSION_821_REQUIRED_PRIOR_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_821_REQUIRED_SOURCE_CONSTANTS,
  PRIVATE_ADMISSION_821_REQUIRED_STATUSES,
  PRIVATE_ADMISSION_821_ROWS,
  PRIVATE_ADMISSION_821_VIOLATION_STATUS,
  PRIVATE_ADMISSION_821_WORKERS,
  evaluatePrivateAdmission821Gate
} from "../src/private-admission-821-native-cleanup-stale-ledger.mjs";

const worker815 = "worker-815-native-worker-thread-cleanup-stale-matrix";
const expectedWorkers = [worker815];

test("private-admission-821-manifest", () => {
  assert.deepEqual(PRIVATE_ADMISSION_821_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_821_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_821_ROWS.length, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_821_WORKERS).size, 1);
  assertSubset(
    [
      "nativeAddonLoaded",
      "nodeWorkerThreadsExecution",
      "napiCleanupHookExecution",
      "publicNativeCompatibility",
      "staleCleanupBlockersRemoved",
      "packageCompatibilityClaimed",
      "jsCjsBridgeCompatibilityClaimed",
      "publicRootRenderCompatibilityClaimed",
      "publicReactActCompatibilityClaimed",
      "publicSchedulerCompatibilityClaimed"
    ],
    PRIVATE_ADMISSION_821_PUBLIC_BLOCKER_FIELDS
  );

  for (const row of PRIVATE_ADMISSION_821_ROWS) {
    assert.equal(row.sourceQueue, "821", row.workerId);
    assert.equal(
      row.ledgerEvaluationMode,
      "source-token-checks-and-manifest-only",
      row.workerId
    );
    assert.equal(row.sourceTokenChecksOnly, true, row.workerId);
    assert.equal(row.manifestEvaluationOnly, true, row.workerId);
    assert.equal(row.privateEvidenceOnly, true, row.workerId);
    assert.equal(row.staticReadOnlyLedger, true, row.workerId);
    assert.equal(row.runtimeExecutionClaimed, false, row.workerId);
    assert.equal(row.publicRuntimeExecutionClaimed, false, row.workerId);
    assert.equal(row.nativeLoadingAttempted, false, row.workerId);
    assert.equal(row.rustExecutionAttempted, false, row.workerId);
    assert.equal(row.packageImportSideEffects, false, row.workerId);
    assertAllFalse(row.publicBlockers, row.workerId);
  }
});

test("private-admission-821-accepted", () => {
  const gate = evaluatePrivateAdmission821Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_821_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.nativeCleanupEvidenceRecognized, true);
  assert.equal(gate.cleanupBlockersRecognized, true);
  assert.equal(gate.statusesRecognized, true);
  assert.equal(gate.functionNamesRecognized, true);
  assert.equal(gate.fieldNamesRecognized, true);
  assert.equal(gate.sourceConstantsRecognized, true);
  assert.equal(gate.priorLedgerContextRecognized, true);
  assert.equal(gate.priorLedgerRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.nativeExecutionClaimIds, []);
  assert.deepEqual(gate.cleanupBlockerClaimIds, []);
  assert.deepEqual(gate.packageCompatibilityClaimIds, []);
  assert.deepEqual(gate.jsCjsBridgeClaimIds, []);
  assert.deepEqual(gate.rootActSchedulerClaimIds, []);
  assert.deepEqual(gate.publicCompatibilityClaimIds, []);

  const row = gate.rowsByWorker[worker815];
  assert.equal(
    row.privateAdmission,
    "accepted-private-native-cleanup-stale-matrix"
  );
  assert.deepEqual(
    row.nativeCleanupEvidenceIds,
    PRIVATE_ADMISSION_821_REQUIRED_NATIVE_CLEANUP_EVIDENCE_IDS[worker815]
  );
  assert.deepEqual(
    row.cleanupBlockerIds,
    PRIVATE_ADMISSION_821_REQUIRED_CLEANUP_BLOCKER_IDS[worker815]
  );
  assert.deepEqual(
    row.requiredStatuses,
    PRIVATE_ADMISSION_821_REQUIRED_STATUSES[worker815]
  );
  assert.deepEqual(
    row.requiredFunctionNames,
    PRIVATE_ADMISSION_821_REQUIRED_FUNCTION_NAMES[worker815]
  );
  assert.deepEqual(
    row.requiredFieldNames,
    PRIVATE_ADMISSION_821_REQUIRED_FIELD_NAMES[worker815]
  );
  assert.deepEqual(
    row.requiredSourceConstants,
    PRIVATE_ADMISSION_821_REQUIRED_SOURCE_CONSTANTS[worker815]
  );
  assert.deepEqual(
    row.priorLedgerContext,
    PRIVATE_ADMISSION_821_REQUIRED_PRIOR_LEDGER_CONTEXT[worker815]
  );
  assert.equal(row.recognized, true);
  assertAllFalse(row.publicBlockers, worker815);

  const progressEvidence = row.evidence.find(
    (evidenceRow) =>
      evidenceRow.role === "worker-815-progress-ownership-evidence"
  );
  assert.notEqual(progressEvidence, undefined);
  assert.equal(
    progressEvidence.path,
    "worker-progress/worker-815-native-worker-thread-cleanup-stale-matrix.md"
  );
  assert.equal(progressEvidence.recognized, true);

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
    assert.deepEqual(
      evidenceRow.forbiddenTokensPresent,
      [],
      evidenceRow.role
    );
    assert.equal(evidenceRow.readError, null, evidenceRow.role);
    assert.equal(evidenceRow.sliceError, null, evidenceRow.role);
  }
});

test("private-admission-821-rejects-missing-stale-evidence", () => {
  const sourceRow = rowByWorker(worker815);
  const gate = evaluatePrivateAdmission821Gate({
    rowOverrides: {
      [worker815]: {
        nativeCleanupEvidenceIds: sourceRow.nativeCleanupEvidenceIds.filter(
          (id) => id !== "cleanup-hook-canonical-root-wrong-worker-rejected"
        ),
        evidence: withMissingEvidenceToken(
          sourceRow,
          "worker-815-fast-react-napi-cleanup-stale-matrix",
          "cleanup-hook-missing-stale-matrix-rejected"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_821_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.nativeCleanupEvidenceRecognized, false);
  assertViolationIds(gate, [
    "native-cleanup-stale-evidence-token-missing",
    "native-cleanup-stale-evidence-id-mismatch"
  ]);
});

test("private-admission-821-rejects-missing-worker-815-ownership-evidence", () => {
  const sourceRow = rowByWorker(worker815);
  const staleGate = evaluatePrivateAdmission821Gate({
    rowOverrides: {
      [worker815]: {
        evidence: withEvidenceRowOverride(
          sourceRow,
          "worker-815-progress-ownership-evidence",
          {
            tokens: [
              ...progressEvidenceRow(sourceRow).tokens,
              "worker-815-stale-progress-ownership-token"
            ]
          }
        )
      }
    }
  });

  assert.equal(staleGate.status, PRIVATE_ADMISSION_821_VIOLATION_STATUS);
  assert.equal(staleGate.privateDiagnosticsRecognized, false);
  assert.equal(staleGate.evidenceRecognized, false);
  assertViolationIds(staleGate, [
    "native-cleanup-stale-evidence-token-missing"
  ]);
  assertEvidenceRoleRecognized(
    staleGate,
    "worker-815-progress-ownership-evidence",
    false
  );

  const missingGate = evaluatePrivateAdmission821Gate({
    rowOverrides: {
      [worker815]: {
        evidence: withEvidenceRowOverride(
          sourceRow,
          "worker-815-progress-ownership-evidence",
          {
            path: "worker-progress/missing-worker-815-native-worker-thread-cleanup-stale-matrix.md"
          }
        )
      }
    }
  });

  assert.equal(missingGate.status, PRIVATE_ADMISSION_821_VIOLATION_STATUS);
  assert.equal(missingGate.privateDiagnosticsRecognized, false);
  assert.equal(missingGate.evidenceRecognized, false);
  assertViolationIds(missingGate, [
    "native-cleanup-stale-evidence-token-missing"
  ]);
  assertEvidenceRoleRecognized(
    missingGate,
    "worker-815-progress-ownership-evidence",
    false
  );
});

test("private-admission-821-rejects-missing-cleanup-blockers", () => {
  const sourceRow = rowByWorker(worker815);
  const gate = evaluatePrivateAdmission821Gate({
    rowOverrides: {
      [worker815]: {
        cleanupBlockerIds: sourceRow.cleanupBlockerIds.filter(
          (id) => id !== "cleanup-hook-canonical-root-as-value-rejected"
        ),
        publicBlockers: trueBlockers([
          "staleCleanupBlockersRemoved",
          "cleanupHookIdentityForgeryAccepted"
        ])
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_821_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.cleanupBlockersRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(gate.cleanupBlockerClaimIds, [
    `${worker815}.staleCleanupBlockersRemoved`,
    `${worker815}.cleanupHookIdentityForgeryAccepted`
  ]);
  assertViolationIds(gate, [
    "native-cleanup-stale-cleanup-blocker-id-mismatch",
    "native-cleanup-stale-cleanup-blocker-claim-detected"
  ]);
});

test("private-admission-821-rejects-public-compatibility-claims", () => {
  const gate = evaluatePrivateAdmission821Gate({
    rowOverrides: {
      [worker815]: {
        publicBlockers: trueBlockers([
          "nativeAddonLoaded",
          "nodeWorkerThreadsExecution",
          "napiCleanupHookExecution",
          "rendererExecution",
          "reconcilerExecution",
          "publicNativeCompatibility",
          "packageCompatibilityClaimed",
          "packageExportCompatibilityClaimed",
          "jsCjsBridgeCompatibilityClaimed",
          "commonJsBridgeRuntimeClaimed",
          "publicRootRenderCompatibilityClaimed",
          "publicReactActCompatibilityClaimed",
          "publicSchedulerCompatibilityClaimed"
        ])
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_821_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertSubset(
    [
      `${worker815}.nativeAddonLoaded`,
      `${worker815}.nodeWorkerThreadsExecution`,
      `${worker815}.napiCleanupHookExecution`,
      `${worker815}.rendererExecution`,
      `${worker815}.reconcilerExecution`,
      `${worker815}.publicNativeCompatibility`
    ],
    gate.nativeExecutionClaimIds
  );
  assertSubset(
    [
      `${worker815}.packageCompatibilityClaimed`,
      `${worker815}.packageExportCompatibilityClaimed`
    ],
    gate.packageCompatibilityClaimIds
  );
  assertSubset(
    [
      `${worker815}.jsCjsBridgeCompatibilityClaimed`,
      `${worker815}.commonJsBridgeRuntimeClaimed`
    ],
    gate.jsCjsBridgeClaimIds
  );
  assertSubset(
    [
      `${worker815}.publicRootRenderCompatibilityClaimed`,
      `${worker815}.publicReactActCompatibilityClaimed`,
      `${worker815}.publicSchedulerCompatibilityClaimed`
    ],
    gate.rootActSchedulerClaimIds
  );
  assertSubset(
    [
      `${worker815}.publicNativeCompatibility`,
      `${worker815}.jsCjsBridgeCompatibilityClaimed`,
      `${worker815}.publicRootRenderCompatibilityClaimed`,
      `${worker815}.publicReactActCompatibilityClaimed`,
      `${worker815}.publicSchedulerCompatibilityClaimed`
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolationIds(gate, [
    "native-cleanup-stale-native-execution-claim-detected",
    "native-cleanup-stale-package-compatibility-claim-detected",
    "native-cleanup-stale-js-cjs-bridge-claim-detected",
    "native-cleanup-stale-root-act-scheduler-claim-detected",
    "native-cleanup-stale-public-compatibility-claim-detected"
  ]);
});

test("private-admission-821-rejects-static-ledger-drift", () => {
  const gate = evaluatePrivateAdmission821Gate({
    compatibilityClaimed: true,
    rowOverrides: {
      [worker815]: {
        ledgerEvaluationMode: "native-runtime-probe",
        runtimeExecutionClaimed: true,
        nativeLoadingAttempted: true,
        rustExecutionAttempted: true,
        packageImportSideEffects: true,
        packageCompatibilityClaimed: true,
        jsCjsBridgeClaimed: true,
        rootActSchedulerClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_821_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.staticReadOnlyViolationIds, [worker815]);
  assert.deepEqual(gate.topLevelCompatibilityViolationIds, [
    "gate.compatibilityClaimed"
  ]);
  assertViolationIds(gate, [
    "native-cleanup-stale-static-mode-mismatch",
    "native-cleanup-stale-top-level-compatibility-claim-detected"
  ]);
});

function assertAllFalse(record, label) {
  assert.deepEqual(
    Object.keys(record).sort(),
    [...PRIVATE_ADMISSION_821_PUBLIC_BLOCKER_FIELDS].sort(),
    label
  );
  for (const [key, value] of Object.entries(record)) {
    assert.equal(value, false, `${label}.${key}`);
  }
}

function assertViolationIds(gate, expectedIds) {
  const actualIds = gate.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function assertEvidenceRoleRecognized(gate, role, expectedRecognized) {
  const evidenceRow = gate.rowsByWorker[worker815].evidence.find(
    (row) => row.role === role
  );
  assert.notEqual(evidenceRow, undefined, role);
  assert.equal(evidenceRow.recognized, expectedRecognized, role);
}

function rowByWorker(workerId) {
  const row = PRIVATE_ADMISSION_821_ROWS.find(
    (candidate) => candidate.workerId === workerId
  );
  assert.notEqual(row, undefined, workerId);
  return row;
}

function trueBlockers(fields) {
  return Object.fromEntries(fields.map((field) => [field, true]));
}

function withMissingEvidenceToken(row, role, token) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      tokens: [...evidenceRow.tokens, token]
    };
  });
}

function withEvidenceRowOverride(row, role, override) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      ...override
    };
  });
}

function progressEvidenceRow(row) {
  const evidenceRow = row.evidence.find(
    (candidate) =>
      candidate.role === "worker-815-progress-ownership-evidence"
  );
  assert.notEqual(evidenceRow, undefined);
  return evidenceRow;
}
