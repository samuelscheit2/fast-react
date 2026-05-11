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
const worker908 = "worker-908-napi-cleanup-generation-currentness";
const expectedWorkers = [worker815, worker908];

test("private-admission-821-manifest", () => {
  assert.deepEqual(PRIVATE_ADMISSION_821_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_821_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_821_ROWS.length, 2);
  assert.equal(new Set(PRIVATE_ADMISSION_821_WORKERS).size, 2);
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

  const currentnessRow = gate.rowsByWorker[worker908];
  assert.equal(
    currentnessRow.privateAdmission,
    "accepted-private-native-cleanup-generation-currentness-canary"
  );
  assert.deepEqual(
    currentnessRow.nativeCleanupEvidenceIds,
    PRIVATE_ADMISSION_821_REQUIRED_NATIVE_CLEANUP_EVIDENCE_IDS[worker908]
  );
  assert.deepEqual(
    currentnessRow.cleanupBlockerIds,
    PRIVATE_ADMISSION_821_REQUIRED_CLEANUP_BLOCKER_IDS[worker908]
  );
  assert.deepEqual(
    currentnessRow.requiredStatuses,
    PRIVATE_ADMISSION_821_REQUIRED_STATUSES[worker908]
  );
  assert.deepEqual(
    currentnessRow.requiredFunctionNames,
    PRIVATE_ADMISSION_821_REQUIRED_FUNCTION_NAMES[worker908]
  );
  assert.deepEqual(
    currentnessRow.requiredFieldNames,
    PRIVATE_ADMISSION_821_REQUIRED_FIELD_NAMES[worker908]
  );
  assert.deepEqual(
    currentnessRow.requiredSourceConstants,
    PRIVATE_ADMISSION_821_REQUIRED_SOURCE_CONSTANTS[worker908]
  );
  assert.deepEqual(
    currentnessRow.priorLedgerContext,
    PRIVATE_ADMISSION_821_REQUIRED_PRIOR_LEDGER_CONTEXT[worker908]
  );
  assert.equal(currentnessRow.recognized, true);
  assertAllFalse(currentnessRow.publicBlockers, worker908);

  const currentnessEvidence = currentnessRow.evidence.find(
    (evidenceRow) =>
      evidenceRow.role ===
      "worker-908-fast-react-napi-currentness-validation"
  );
  assert.notEqual(currentnessEvidence, undefined);
  assert.equal(currentnessEvidence.path, "crates/fast-react-napi/src/lib.rs");
  assert.equal(currentnessEvidence.recognized, true);

  const currentnessProgressEvidence = currentnessRow.evidence.find(
    (evidenceRow) =>
      evidenceRow.role === "worker-908-progress-currentness-handoff"
  );
  assert.notEqual(currentnessProgressEvidence, undefined);
  assert.equal(
    currentnessProgressEvidence.path,
    "worker-progress/worker-908-napi-cleanup-generation-currentness.md"
  );
  assert.equal(currentnessProgressEvidence.recognized, true);

  for (const recognizedRow of [row, currentnessRow]) {
    for (const evidenceRow of recognizedRow.evidence) {
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
    worker815,
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
    worker815,
    "worker-815-progress-ownership-evidence",
    false
  );
});

test("private-admission-821-rejects-missing-worker-908-currentness-source-identity", () => {
  const sourceRow = rowByWorker(worker908);
  const gate = evaluatePrivateAdmission821Gate({
    rowOverrides: {
      [worker908]: {
        nativeCleanupEvidenceIds: sourceRow.nativeCleanupEvidenceIds.filter(
          (id) => id !== "cleanup-generation-currentness-canary-1-root"
        ),
        evidence: withMissingEvidenceToken(
          sourceRow,
          "worker-908-fast-react-napi-currentness-validation",
          "cleanup-generation-currentness-missing-source-identity-rejected"
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
  assertEvidenceRoleRecognized(
    gate,
    worker908,
    "worker-908-fast-react-napi-currentness-validation",
    false
  );
});

test("private-admission-821-rejects-worker-908-test-title-or-prose-only-currentness-evidence", () => {
  const sourceRow = rowByWorker(worker908);
  const testTitleOnlyGate = evaluatePrivateAdmission821Gate({
    rowOverrides: {
      [worker908]: {
        evidence: withEvidenceRowOverride(
          sourceRow,
          "worker-908-fast-react-napi-currentness-validation",
          {
            sliceStart:
              "native_root_bridge_cleanup_generation_currentness_canary_accepts_current_private_handoff",
            sliceEnd:
              "native_root_bridge_batch_lifecycle_json_roundtrip_link_rejects_forged_rows"
          }
        )
      }
    }
  });

  assert.equal(
    testTitleOnlyGate.status,
    PRIVATE_ADMISSION_821_VIOLATION_STATUS
  );
  assert.equal(testTitleOnlyGate.privateDiagnosticsRecognized, false);
  assert.equal(testTitleOnlyGate.evidenceRecognized, false);
  assertViolationIds(testTitleOnlyGate, [
    "native-cleanup-stale-evidence-token-missing"
  ]);
  assertEvidenceRoleRecognized(
    testTitleOnlyGate,
    worker908,
    "worker-908-fast-react-napi-currentness-validation",
    false
  );

  const proseOnlyGate = evaluatePrivateAdmission821Gate({
    rowOverrides: {
      [worker908]: {
        evidence: withEvidenceRowOverride(
          sourceRow,
          "worker-908-fast-react-napi-currentness-validation",
          {
            path: "worker-progress/worker-908-napi-cleanup-generation-currentness.md",
            sliceStart: null,
            sliceEnd: null
          }
        )
      }
    }
  });

  assert.equal(proseOnlyGate.status, PRIVATE_ADMISSION_821_VIOLATION_STATUS);
  assert.equal(proseOnlyGate.privateDiagnosticsRecognized, false);
  assert.equal(proseOnlyGate.evidenceRecognized, false);
  assertViolationIds(proseOnlyGate, [
    "native-cleanup-stale-evidence-token-missing"
  ]);
  assertEvidenceRoleRecognized(
    proseOnlyGate,
    worker908,
    "worker-908-fast-react-napi-currentness-validation",
    false
  );
});

test("private-admission-821-rejects-worker-908-stale-replay-and-shape-only-cleanup-rows", () => {
  const sourceRow = rowByWorker(worker908);
  const gate = evaluatePrivateAdmission821Gate({
    rowOverrides: {
      [worker908]: {
        cleanupBlockerIds: sourceRow.cleanupBlockerIds.filter(
          (id) =>
            id !==
            "cleanup-generation-currentness-replayed-or-retired-rejected"
        ),
        requiredFieldNames: sourceRow.requiredFieldNames.filter(
          (fieldName) => fieldName !== "source_owned_cleanup_handoff"
        ),
        evidence: withMissingEvidenceToken(
          sourceRow,
          "worker-908-fast-react-napi-currentness-validation",
          "cleanup-generation-currentness-shape-only-row-accepted"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_821_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.cleanupBlockersRecognized, false);
  assert.equal(gate.fieldNamesRecognized, false);
  assertViolationIds(gate, [
    "native-cleanup-stale-evidence-token-missing",
    "native-cleanup-stale-cleanup-blocker-id-mismatch",
    "native-cleanup-stale-field-name-mismatch"
  ]);
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
      },
      [worker908]: {
        publicBlockers: trueBlockers([
          "nativeAddonLoaded",
          "nodeWorkerThreadsExecution",
          "napiCleanupHookExecution",
          "rendererExecution",
          "reconcilerExecution",
          "publicNativeCompatibility",
          "packageCompatibilityClaimed",
          "packageExportCompatibilityClaimed",
          "staleCleanupEvidenceAccepted",
          "staleWorkerCleanupSourceAccepted",
          "staleCleanupBlockersRemoved"
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
      `${worker815}.publicNativeCompatibility`,
      `${worker908}.nativeAddonLoaded`,
      `${worker908}.nodeWorkerThreadsExecution`,
      `${worker908}.napiCleanupHookExecution`,
      `${worker908}.rendererExecution`,
      `${worker908}.reconcilerExecution`,
      `${worker908}.publicNativeCompatibility`
    ],
    gate.nativeExecutionClaimIds
  );
  assertSubset(
    [
      `${worker815}.packageCompatibilityClaimed`,
      `${worker815}.packageExportCompatibilityClaimed`,
      `${worker908}.packageCompatibilityClaimed`,
      `${worker908}.packageExportCompatibilityClaimed`
    ],
    gate.packageCompatibilityClaimIds
  );
  assertSubset(
    [
      `${worker908}.staleCleanupEvidenceAccepted`,
      `${worker908}.staleWorkerCleanupSourceAccepted`,
      `${worker908}.staleCleanupBlockersRemoved`
    ],
    gate.cleanupBlockerClaimIds
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
      `${worker908}.publicNativeCompatibility`,
      `${worker815}.jsCjsBridgeCompatibilityClaimed`,
      `${worker815}.publicRootRenderCompatibilityClaimed`,
      `${worker815}.publicReactActCompatibilityClaimed`,
      `${worker815}.publicSchedulerCompatibilityClaimed`
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolationIds(gate, [
    "native-cleanup-stale-native-execution-claim-detected",
    "native-cleanup-stale-cleanup-blocker-claim-detected",
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
