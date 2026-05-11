import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_807_ACCEPTED_WORKERS,
  PRIVATE_ADMISSION_807_BLOCKED_PUBLIC_CLAIMS,
  PRIVATE_ADMISSION_807_CONTEXT_WORKERS,
  PRIVATE_ADMISSION_807_GATE_STATUS,
  PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS,
  PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_807_ROWS,
  PRIVATE_ADMISSION_807_VIOLATION_STATUS,
  PRIVATE_ADMISSION_807_WORKERS,
  evaluatePrivateAdmission807Gate
} from "../src/private-admission-807-native-no-load-ledger.mjs";

const worker788 = "worker-788-native-no-worker-threads-load-guard";
const worker801 = "worker-801-native-no-load-transitive-matrix";
const worker789 = "worker-789-native-private-subpath-blocklist-refresh";
const worker790 = "worker-790-native-cleanup-hook-identity-tamper-gate";

const expectedAcceptedWorkers = [worker788, worker801];
const expectedContextWorkers = [worker789, worker790];
const expectedWorkers = [...expectedAcceptedWorkers, ...expectedContextWorkers];

test("private admission 807 manifest pins native no-load evidence and contextual blockers", () => {
  assert.deepEqual(PRIVATE_ADMISSION_807_ACCEPTED_WORKERS, expectedAcceptedWorkers);
  assert.deepEqual(PRIVATE_ADMISSION_807_CONTEXT_WORKERS, expectedContextWorkers);
  assert.deepEqual(PRIVATE_ADMISSION_807_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_807_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_807_ROWS.map((row) => row.ledgerRole),
    [
      "accepted-native-no-load-evidence",
      "accepted-native-no-load-evidence",
      "context-native-package-surface-blocker",
      "context-native-cleanup-hook-blocker"
    ]
  );
  assert.equal(PRIVATE_ADMISSION_807_ROWS.length, 4);
  assert.equal(new Set(PRIVATE_ADMISSION_807_WORKERS).size, 4);
  assertSubset(
    [
      "nativeAddonLoaded",
      "workerThreadCreationAvailable",
      "nodeWorkerThreadsExecution",
      "rendererExecution",
      "reconcilerExecution",
      "publicNativeCompatibility",
      "packageExportCompatibilityClaimed",
      "staleCleanupHookEvidenceAccepted",
      "staleCleanupHookIdentityAccepted"
    ],
    PRIVATE_ADMISSION_807_BLOCKED_PUBLIC_CLAIMS
  );

  for (const row of PRIVATE_ADMISSION_807_ROWS) {
    assert.deepEqual(
      row.guardIds,
      PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS[row.workerId],
      row.workerId
    );
    assert.deepEqual(
      row.priorLedgerContext,
      PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT[row.workerId],
      row.workerId
    );
    assertAllFalse(row.publicBlockerClaims, row.workerId);
    assert.equal(row.sourceQueue, "807", row.workerId);
    assert.equal(row.privateEvidenceOnly, true, row.workerId);
    assert.equal(row.sourceTokenChecksOnly, true, row.workerId);
    assert.equal(row.manifestEvaluationOnly, true, row.workerId);
    assert.equal(row.runtimeExecutionClaimed, false, row.workerId);
    assert.equal(row.nativeAddonLoadAttempted, false, row.workerId);
    assert.equal(row.workerCreationAttempted, false, row.workerId);
  }
});

test("private admission 807 gate recognizes source-token evidence without native or public compatibility", () => {
  const gate = evaluatePrivateAdmission807Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_807_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.manifestRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.guardIdsRecognized, true);
  assert.equal(gate.priorLedgerContextRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.acceptedWorkers, expectedAcceptedWorkers);
  assert.deepEqual(gate.contextWorkers, expectedContextWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.nativeRuntimeLeakClaimIds, []);
  assert.deepEqual(gate.rendererReconcilerLeakClaimIds, []);
  assert.deepEqual(gate.publicNativeCompatibilityLeakClaimIds, []);
  assert.deepEqual(gate.packageExportLeakClaimIds, []);
  assert.deepEqual(gate.staleCleanupHookClaimIds, []);
  assert.deepEqual(gate.publicBlockerClaimViolationIds, []);

  assertNativeNoLoadRow(gate.rowsByWorker[worker788], {
    privateAdmission: "accepted-private-native-worker-thread-no-load-guard",
    evidenceRoles: [
      "worker-788-direct-worker-thread-load-guard-test",
      "worker-788-native-placeholder-public-blockers"
    ],
    implementationPaths: [
      "bindings/node/test/native-no-load-guard.test.cjs",
      "bindings/node/index.cjs"
    ]
  });
  assertNativeNoLoadRow(gate.rowsByWorker[worker801], {
    privateAdmission: "accepted-private-native-no-load-transitive-matrix",
    evidenceRoles: [
      "worker-801-transitive-fixture-matrix",
      "worker-801-module-guard-teardown-test",
      "worker-801-no-runtime-native-execution-test"
    ],
    implementationPaths: ["bindings/node/test/native-no-load-guard.test.cjs"]
  });
  assertNativeNoLoadRow(gate.rowsByWorker[worker789], {
    privateAdmission: "context-native-private-subpaths-remain-blocked",
    evidenceRoles: [
      "worker-789-native-import-smoke-blocklist",
      "worker-789-native-package-export-map"
    ],
    implementationPaths: [
      "tests/smoke/import-entrypoints.mjs",
      "bindings/node/package.json"
    ]
  });
  assertNativeNoLoadRow(gate.rowsByWorker[worker790], {
    privateAdmission: "context-native-cleanup-hook-stale-values-blocked",
    evidenceRoles: [
      "worker-790-cleanup-hook-js-mirror-blockers",
      "worker-790-cleanup-hook-rust-identity-tamper-test"
    ],
    implementationPaths: [
      "bindings/node/index.cjs",
      "crates/fast-react-napi/src/lib.rs"
    ]
  });
});

test("private admission 807 gate rejects missing dynamic ESM .node fixture evidence", () => {
  const gate = evaluatePrivateAdmission807Gate({
    rowOverrides: {
      [worker801]: {
        evidence: withMissingEvidenceToken(
          rowByWorker(worker801),
          "worker-801-transitive-fixture-matrix",
          "missing-dynamic-esm-native-addon-fixture-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_807_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, [
    "native-no-load-evidence-token-missing",
    "native-no-load-required-row-not-recognized"
  ]);
  assertEvidenceRoleRecognized(
    gate,
    worker801,
    "worker-801-transitive-fixture-matrix",
    false
  );
});

test("private admission 807 gate rejects missing teardown guard ids and static ledger drift", () => {
  const gate = evaluatePrivateAdmission807Gate({
    rowOverrides: {
      [worker801]: {
        guardIds: PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS[worker801].filter(
          (guardId) => guardId !== "native-no-load-module-guard-teardown"
        ),
        manifestEvaluationOnly: false,
        ledgerEvaluationMode: "runtime-native-probe"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_807_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.guardIdsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assertViolationIds(gate, [
    "native-no-load-guard-id-mismatch",
    "native-no-load-static-ledger-mode-mismatch",
    "native-no-load-required-row-not-recognized"
  ]);
});

test("private admission 807 gate rejects native, renderer, package, and stale cleanup-hook claims", () => {
  const gate = evaluatePrivateAdmission807Gate({
    compatibilityClaimed: true,
    rowOverrides: {
      [worker788]: {
        publicBlockerClaims: {
          nativeAddonLoaded: true,
          workerThreadCreationAvailable: true,
          nodeWorkerThreadsExecution: true,
          nativeExecution: true,
          rendererExecution: true,
          reconcilerExecution: true,
          publicNativeCompatibility: true,
          packageCompatibilityClaimed: true,
          packageExportCompatibilityClaimed: true
        }
      },
      [worker790]: {
        publicBlockerClaims: {
          staleCleanupHookEvidenceAccepted: true,
          staleCleanupHookIdentityAccepted: true,
          cleanupHookPublicExecutionClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_807_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertViolationIds(gate, [
    "native-no-load-native-runtime-claim-detected",
    "native-no-load-renderer-reconciler-claim-detected",
    "native-no-load-public-native-compatibility-claim-detected",
    "native-no-load-package-export-compatibility-claim-detected",
    "native-no-load-stale-cleanup-hook-claim-detected",
    "native-no-load-top-level-compatibility-claim-detected",
    "native-no-load-required-row-not-recognized"
  ]);
  assertSubset(
    [
      `${worker788}.nativeAddonLoaded`,
      `${worker788}.workerThreadCreationAvailable`,
      `${worker788}.nodeWorkerThreadsExecution`,
      `${worker788}.nativeExecution`
    ],
    gate.nativeRuntimeLeakClaimIds
  );
  assertSubset(
    [`${worker788}.rendererExecution`, `${worker788}.reconcilerExecution`],
    gate.rendererReconcilerLeakClaimIds
  );
  assertSubset(
    [`${worker788}.publicNativeCompatibility`],
    gate.publicNativeCompatibilityLeakClaimIds
  );
  assertSubset(
    [
      `${worker788}.packageCompatibilityClaimed`,
      `${worker788}.packageExportCompatibilityClaimed`
    ],
    gate.packageExportLeakClaimIds
  );
  assertSubset(
    [
      `${worker790}.staleCleanupHookEvidenceAccepted`,
      `${worker790}.staleCleanupHookIdentityAccepted`,
      `${worker790}.cleanupHookPublicExecutionClaimed`
    ],
    gate.staleCleanupHookClaimIds
  );
  assert.deepEqual(gate.topLevelCompatibilityViolationIds, [
    "gate.compatibilityClaimed"
  ]);
});

function assertNativeNoLoadRow(
  row,
  { privateAdmission, evidenceRoles, implementationPaths }
) {
  assert.equal(row.privateAdmission, privateAdmission);
  assert.deepEqual(row.implementationPaths, implementationPaths);
  assert.deepEqual(
    row.guardIds,
    PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS[row.workerId],
    row.workerId
  );
  assert.deepEqual(
    row.priorLedgerContext,
    PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT[row.workerId],
    row.workerId
  );
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
  assert.equal(row.evidenceRecognized, true, row.workerId);
  assert.equal(row.guardIdsRecognized, true, row.workerId);
  assert.equal(row.priorLedgerContextRecognized, true, row.workerId);
  assert.equal(row.staticReadOnlyRecognized, true, row.workerId);
  assert.equal(row.recognized, true, row.workerId);
  assert.equal(row.runtimeExecutionClaimed, false, row.workerId);
  assert.equal(row.publicRuntimeExecutionClaimed, false, row.workerId);
  assert.equal(row.nativeAddonLoadAttempted, false, row.workerId);
  assert.equal(row.workerCreationAttempted, false, row.workerId);
  assert.equal(row.exportsChanged, false, row.workerId);
  assertAllFalse(row.publicBlockerClaims, row.workerId);

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.path);
  }
}

function assertAllFalse(record, label) {
  assert.deepEqual(
    Object.keys(record).sort(),
    [...PRIVATE_ADMISSION_807_BLOCKED_PUBLIC_CLAIMS].sort(),
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
  const row = PRIVATE_ADMISSION_807_ROWS.find(
    (candidate) => candidate.workerId === workerId
  );
  assert.notEqual(row, undefined, workerId);
  return row;
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
