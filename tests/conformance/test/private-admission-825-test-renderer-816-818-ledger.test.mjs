import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS,
  PRIVATE_ADMISSION_733_736_BRIDGE_ROWS
} from "../src/private-admission-733-736-bridge-ledger.mjs";
import {
  PRIVATE_ADMISSION_825_BLOCKED_PUBLIC_CLAIMS,
  PRIVATE_ADMISSION_825_LEDGER_STATUS,
  PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS,
  PRIVATE_ADMISSION_825_REQUIRED_BRIDGE_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_825_REQUIRED_EVIDENCE,
  PRIVATE_ADMISSION_825_REQUIRED_REQUIREMENTS,
  PRIVATE_ADMISSION_825_REQUIRED_STATUS_IDS,
  PRIVATE_ADMISSION_825_ROW_CONTRACT,
  PRIVATE_ADMISSION_825_ROW_CONTRACTS,
  PRIVATE_ADMISSION_825_ROWS,
  PRIVATE_ADMISSION_825_WORKERS,
  evaluatePrivateAdmission825TestRenderer816818Ledger
} from "../src/private-admission-825-test-renderer-816-818-ledger.mjs";

const worker816 =
  "worker-816-test-renderer-unmount-nested-source-report-gate";
const worker818 = "worker-818-private-admission-733-736-bridge-ledger";
const worker736 = "worker-736-nested-tojson-source-report-identity";
const expectedWorkers = [worker816, worker818];
const testRendererRustSource = "crates/fast-react-test-renderer/src/lib.rs";
const sourceTokenPolicy =
  "source-owned-identifiers-statuses-functions-fields-and-constants";

test("private admission 825 manifest pins Worker 816 and Worker 818 static ledger rows", () => {
  assert.deepEqual(PRIVATE_ADMISSION_825_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_825_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_825_ROWS.length, 2);
  assert.equal(new Set(PRIVATE_ADMISSION_825_WORKERS).size, 2);
  assertSubset(
    [
      "publicToJSONAvailable",
      "publicToTreeAvailable",
      "publicTestInstanceAvailable",
      "jsFacadeAvailable",
      "cjsFacadeAvailable",
      "packageCompatibilityClaimed",
      "nativeBridgeLoadingAvailable",
      "nativeBridgeExecutionAvailable",
      "publicActCompatibilityClaimed",
      "publicSchedulerCompatibilityClaimed",
      "broadMultichildIdentityAvailable",
      "publicCompatibilityClaimed"
    ],
    PRIVATE_ADMISSION_825_BLOCKED_PUBLIC_CLAIMS
  );

  assertLedgerRow(PRIVATE_ADMISSION_825_ROWS[0], {
    workerId: worker816,
    ledgerRole: "accepted-unmount-nested-source-report-gate",
    privateAdmission:
      "accepted-private-test-renderer-unmount-nested-source-report-gate",
    evidenceIds: [
      "worker-816-unmount-nested-status-constants",
      "worker-816-unmount-nested-gate-record-fields",
      "worker-816-unmount-nested-gate-methods",
      "worker-816-unmount-nested-admission-builder",
      "worker-816-route-admission-validators",
      "worker-816-nested-source-report-ownership-validator",
      "worker-816-unmount-nested-gate-validator"
    ]
  });

  assertLedgerRow(PRIVATE_ADMISSION_825_ROWS[1], {
    workerId: worker818,
    ledgerRole: "accepted-733-736-bridge-ledger-context",
    privateAdmission: "accepted-private-733-736-bridge-ledger-context",
    evidenceIds: [
      "worker-818-bridge-ledger-status-exports",
      "worker-818-bridge-required-bindings-and-evidence",
      "worker-818-bridge-row-contract-and-evaluator"
    ]
  });
});

test("private admission 825 ledger recognizes source-owned evidence without public compatibility", () => {
  const ledger = evaluatePrivateAdmission825TestRenderer816818Ledger();

  assert.equal(ledger.status, PRIVATE_ADMISSION_825_LEDGER_STATUS);
  assert.equal(ledger.privateAdmissionRecognized, true);
  assert.equal(ledger.manifestRecognized, true);
  assert.equal(ledger.evidenceRecognized, true);
  assert.equal(ledger.statusIdsRecognized, true);
  assert.equal(ledger.bridgeLedgerContextRecognized, true);
  assert.equal(ledger.requirementsRecognized, true);
  assert.equal(ledger.rowContractRecognized, true);
  assert.equal(ledger.blockedPublicClaimsRecognized, true);
  assert.equal(ledger.staticReadOnlyRecognized, true);
  assert.equal(ledger.compatibilityClaimed, false);
  assert.equal(ledger.bridgeLedger.status, PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS);
  assert.deepEqual(ledger.violations, []);
  assert.deepEqual(ledger.queueWorkers, expectedWorkers);
  assert.deepEqual(ledger.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(ledger.publicSerializationLeakClaimIds, []);
  assert.deepEqual(ledger.jsCjsPackageLeakClaimIds, []);
  assert.deepEqual(ledger.nativeBridgeLeakClaimIds, []);
  assert.deepEqual(ledger.rootActSchedulerLeakClaimIds, []);
  assert.deepEqual(ledger.broadMultichildLeakClaimIds, []);
  assert.deepEqual(ledger.publicCompatibilityLeakClaimIds, []);
  assert.deepEqual(ledger.manifest.missingWorkerIds, []);
  assert.deepEqual(ledger.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(ledger.manifest.duplicateWorkerIds, []);

  for (const row of ledger.rows) {
    assert.deepEqual(
      row.statusIds,
      PRIVATE_ADMISSION_825_REQUIRED_STATUS_IDS[row.workerId],
      row.workerId
    );
    assert.deepEqual(
      row.bridgeLedgerContext,
      PRIVATE_ADMISSION_825_REQUIRED_BRIDGE_LEDGER_CONTEXT[row.workerId],
      row.workerId
    );
    assert.deepEqual(
      row.requirements,
      PRIVATE_ADMISSION_825_REQUIRED_REQUIREMENTS[row.workerId],
      row.workerId
    );
    assert.deepEqual(
      rowContract(row),
      PRIVATE_ADMISSION_825_ROW_CONTRACTS[row.workerId],
      row.workerId
    );
    assertAllFalse(row.publicBlockerClaims, row.workerId);
    assert.equal(row.runtimeExecutionClaimed, false, row.workerId);
    assert.equal(row.rustExecutionClaimed, false, row.workerId);
    assert.equal(row.nativeBridgeExecuted, false, row.workerId);
    assert.equal(row.nativeBridgeLoadAttempted, false, row.workerId);
    assert.equal(row.packageImportAttempted, false, row.workerId);

    for (const evidenceRow of row.evidence) {
      assert.equal(evidenceRow.recognized, true, evidenceRow.evidenceId);
      assert.equal(evidenceRow.tokenPolicy, sourceTokenPolicy);
      assert.equal(evidenceRow.path.includes("worker-progress"), false);
      assert.equal(evidenceRow.path.includes(".test."), false);
      assert.deepEqual(evidenceRow.missingTokens, []);
      assert.deepEqual(evidenceRow.forbiddenTokensPresent, []);
      for (const token of evidenceRow.tokens) {
        assert.equal(/\s/.test(token), false, `${evidenceRow.evidenceId}:${token}`);
        assert.equal(token.includes("panic!("), false, evidenceRow.evidenceId);
        assert.equal(token.includes("reason:"), false, evidenceRow.evidenceId);
        assert.equal(token.includes("assert_"), false, evidenceRow.evidenceId);
      }
    }
  }
});

test("private admission 825 ledger rejects unexpected and duplicate worker ids", () => {
  const unexpected = evaluatePrivateAdmission825TestRenderer816818Ledger({
    rowOverrides: {
      [worker818]: {
        workerId: "worker-818-stale-bridge-ledger"
      }
    }
  });

  assert.equal(unexpected.status, PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS);
  assert.equal(unexpected.privateAdmissionRecognized, false);
  assert.equal(unexpected.manifestRecognized, false);
  assert.deepEqual(unexpected.manifest.missingWorkerIds, [worker818]);
  assert.deepEqual(unexpected.manifest.unexpectedWorkerIds, [
    "worker-818-stale-bridge-ledger"
  ]);
  assert.deepEqual(unexpected.manifest.duplicateWorkerIds, []);
  assertViolationIds(unexpected, [
    "private-admission-825-worker-manifest-mismatch"
  ]);

  const duplicate = evaluatePrivateAdmission825TestRenderer816818Ledger({
    rowOverrides: {
      [worker818]: {
        workerId: worker816
      }
    }
  });

  assert.equal(duplicate.status, PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS);
  assert.equal(duplicate.manifestRecognized, false);
  assert.deepEqual(duplicate.manifest.missingWorkerIds, [worker818]);
  assert.deepEqual(duplicate.manifest.duplicateWorkerIds, [worker816]);
  assertViolationIds(duplicate, [
    "private-admission-825-worker-manifest-mismatch"
  ]);
});

test("private admission 825 ledger rejects missing evidence, stale status ids, and row contract tampering", () => {
  const missingEvidence = evaluatePrivateAdmission825TestRenderer816818Ledger({
    rowOverrides: {
      [worker816]: {
        evidence: []
      }
    }
  });

  assert.equal(
    missingEvidence.status,
    PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS
  );
  assert.equal(missingEvidence.evidenceRecognized, false);
  assert.equal(missingEvidence.rowsByWorker[worker816].evidenceRecognized, false);
  assert.deepEqual(missingEvidence.rowsByWorker[worker816].evidence, []);
  assertViolationIds(missingEvidence, [
    "private-admission-825-required-evidence-mismatch"
  ]);
  const evidenceViolation = missingEvidence.violations.find(
    (violation) =>
      violation.id === "private-admission-825-required-evidence-mismatch"
  );
  assert.deepEqual(
    evidenceViolation.rows[0].missingIds,
    PRIVATE_ADMISSION_825_REQUIRED_EVIDENCE[worker816]
  );

  const staleStatusAndContext =
    evaluatePrivateAdmission825TestRenderer816818Ledger({
      rowOverrides: {
        [worker816]: {
          statusIds: PRIVATE_ADMISSION_825_REQUIRED_STATUS_IDS[
            worker816
          ].filter(
            (statusId) =>
              statusId !==
              "TEST_RENDERER_PRIVATE_UNMOUNT_NESTED_SOURCE_REPORT_GATE_STATUS"
          )
        },
        [worker818]: {
          bridgeLedgerContext: []
        }
      }
    });

  assert.equal(
    staleStatusAndContext.status,
    PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS
  );
  assert.equal(staleStatusAndContext.statusIdsRecognized, false);
  assert.equal(staleStatusAndContext.bridgeLedgerContextRecognized, false);
  assertViolationIds(staleStatusAndContext, [
    "private-admission-825-status-id-mismatch",
    "private-admission-825-bridge-ledger-context-mismatch"
  ]);

  const rowTamper = evaluatePrivateAdmission825TestRenderer816818Ledger({
    rowOverrides: {
      [worker818]: {
        sourceQueue: "public-compatibility",
        privateAdmission: "accepted-public-test-renderer-compatibility",
        localGateCoverage: "public-test-renderer-ledger",
        runtimeCapabilityAdded: true,
        compatibilityClaimed: true,
        promotion: "accepted-public",
        privateEvidenceOnly: false,
        sourceTokenChecksOnly: false,
        manifestEvaluationOnly: false,
        runtimeExecutionClaimed: true,
        rustExecutionClaimed: true,
        nativeBridgeExecuted: true,
        nativeBridgeLoadAttempted: true,
        packageImportAttempted: true,
        ledgerEvaluationMode: "runtime-package-probe",
        blockedPublicClaims: []
      }
    }
  });

  assert.equal(rowTamper.status, PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS);
  assert.equal(rowTamper.rowContractRecognized, false);
  assert.equal(rowTamper.staticReadOnlyRecognized, false);
  assertViolationIds(rowTamper, [
    "private-admission-825-row-contract-mismatch",
    "private-admission-825-static-read-only-mismatch"
  ]);
  const rowContractViolation = rowTamper.violations.find(
    (violation) => violation.id === "private-admission-825-row-contract-mismatch"
  );
  assert.deepEqual(
    rowContractViolation.rows[0].expectedContract,
    PRIVATE_ADMISSION_825_ROW_CONTRACTS[worker818]
  );
  assert.deepEqual(rowContractViolation.rows[0].actualContract.blockedPublicClaims, []);
  assert.deepEqual(PRIVATE_ADMISSION_825_ROW_CONTRACT.sourceQueue, "825");
});

test("private admission 825 ledger rejects corrupted Worker 816 source and Worker 818 bridge ledger evidence", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: testRendererRustSource,
    find: "private-unmount-nested-source-report-admission-validated-public-native-package-blocked",
    replace:
      "private-unmount-nested-source-report-admission-stale-public-native-package-blocked"
  });

  try {
    const sourceLedger = evaluatePrivateAdmission825TestRenderer816818Ledger({
      workspaceRoot: workspace.root
    });

    assert.equal(
      sourceLedger.status,
      PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS
    );
    assert.equal(sourceLedger.evidenceRecognized, false);
    assertEvidenceRecognized(
      sourceLedger,
      worker816,
      "worker-816-unmount-nested-status-constants",
      false
    );
    assertEvidenceRecognized(
      sourceLedger,
      worker818,
      "worker-818-bridge-ledger-status-exports",
      true
    );
    assertViolationIds(sourceLedger, [
      "private-admission-825-source-evidence-token-missing"
    ]);
  } finally {
    workspace.cleanup();
  }

  const bridgeLedger = evaluatePrivateAdmission825TestRenderer816818Ledger({
    bridgeRowOverrides: {
      [worker736]: {
        evidence: []
      }
    }
  });

  assert.equal(bridgeLedger.status, PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS);
  assert.equal(bridgeLedger.privateAdmissionRecognized, false);
  assert.equal(bridgeLedger.bridgeLedgerContextRecognized, false);
  assert.notEqual(
    bridgeLedger.bridgeLedger.status,
    PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS
  );
  assertViolationIds(bridgeLedger, [
    "private-admission-825-bridge-ledger-not-recognized"
  ]);
  const bridgeViolation = bridgeLedger.violations.find(
    (violation) =>
      violation.id === "private-admission-825-bridge-ledger-not-recognized"
  );
  assert.deepEqual(bridgeViolation.rows[0].bridgeViolationIds, [
    "bridge-required-evidence-mismatch"
  ]);
});

test("private admission 825 ledger rejects public, native, package, root, act, scheduler, broad multichild, and compatibility claims", () => {
  const ledger = evaluatePrivateAdmission825TestRenderer816818Ledger({
    compatibilityClaimed: true,
    rowOverrides: {
      [worker816]: {
        publicBlockerClaims: {
          publicToJSONAvailable: true,
          publicToTreeAvailable: true,
          publicTestInstanceAvailable: true,
          publicSerializationAvailable: true,
          jsFacadeAvailable: true,
          cjsFacadeAvailable: true,
          packageCompatibilityClaimed: true,
          nativeBridgeLoadingAvailable: true,
          nativeBridgeExecutionAvailable: true,
          nativeExecutionAvailable: true,
          publicRootCompatibilityClaimed: true,
          publicActCompatibilityClaimed: true,
          publicSchedulerCompatibilityClaimed: true,
          broadMultichildIdentityAvailable: true,
          publicCompatibilityClaimed: true
        }
      },
      [worker818]: {
        publicBlockerClaims: {
          publicTestRendererToJSONCompatibilityClaimed: true,
          nativeBridgeLoadingClaimed: true,
          jsFacadeAdmissionClaimed: true,
          publicReactDomRootCompatibilityClaimed: true,
          publicSchedulerCompatibilityClaimed: true,
          broadMultichildIdentityAccepted: true,
          publicCompatibilityPromotionClaimed: true
        }
      }
    }
  });

  assert.equal(ledger.status, PRIVATE_ADMISSION_825_LEDGER_VIOLATION_STATUS);
  assert.equal(ledger.privateAdmissionRecognized, false);
  assert.equal(ledger.blockedPublicClaimsRecognized, false);
  assert.equal(ledger.staticReadOnlyRecognized, false);
  assert.equal(ledger.compatibilityClaimed, true);
  assertViolationIds(ledger, [
    "private-admission-825-public-serialization-claim-detected",
    "private-admission-825-js-cjs-package-claim-detected",
    "private-admission-825-native-bridge-execution-claim-detected",
    "private-admission-825-root-act-scheduler-claim-detected",
    "private-admission-825-broad-multichild-claim-detected",
    "private-admission-825-public-compatibility-claim-detected",
    "private-admission-825-top-level-compatibility-claim-detected"
  ]);
  assertSubset(
    [
      `${worker816}.publicToJSONAvailable`,
      `${worker816}.publicToTreeAvailable`,
      `${worker816}.publicTestInstanceAvailable`
    ],
    ledger.publicSerializationLeakClaimIds
  );
  assertSubset(
    [
      `${worker816}.jsFacadeAvailable`,
      `${worker816}.cjsFacadeAvailable`,
      `${worker816}.packageCompatibilityClaimed`,
      `${worker818}.jsFacadeAdmissionClaimed`
    ],
    ledger.jsCjsPackageLeakClaimIds
  );
  assertSubset(
    [
      `${worker816}.nativeBridgeLoadingAvailable`,
      `${worker816}.nativeBridgeExecutionAvailable`,
      `${worker818}.nativeBridgeLoadingClaimed`
    ],
    ledger.nativeBridgeLeakClaimIds
  );
  assertSubset(
    [
      `${worker816}.publicActCompatibilityClaimed`,
      `${worker816}.publicSchedulerCompatibilityClaimed`,
      `${worker818}.publicReactDomRootCompatibilityClaimed`
    ],
    ledger.rootActSchedulerLeakClaimIds
  );
  assertSubset(
    [
      `${worker816}.broadMultichildIdentityAvailable`,
      `${worker818}.broadMultichildIdentityAccepted`
    ],
    ledger.broadMultichildLeakClaimIds
  );
  assertSubset(
    [
      `${worker816}.publicCompatibilityClaimed`,
      `${worker818}.publicCompatibilityPromotionClaimed`
    ],
    ledger.publicCompatibilityLeakClaimIds
  );
});

function assertLedgerRow(row, { workerId, ledgerRole, privateAdmission, evidenceIds }) {
  assert.equal(row.workerId, workerId);
  assert.equal(row.ledgerRole, ledgerRole);
  assert.equal(row.privateAdmission, privateAdmission);
  assert.equal(row.sourceQueue, "825");
  assert.equal(row.localGateCoverage.includes("private-admission-825"), true);
  assert.equal(row.runtimeCapabilityAdded, false);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "rejected");
  assert.equal(row.privateEvidenceOnly, true);
  assert.equal(row.sourceTokenChecksOnly, true);
  assert.equal(row.manifestEvaluationOnly, true);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.evidenceId),
    evidenceIds
  );
  assert.deepEqual(row.statusIds, PRIVATE_ADMISSION_825_REQUIRED_STATUS_IDS[workerId]);
  assert.deepEqual(
    row.bridgeLedgerContext,
    PRIVATE_ADMISSION_825_REQUIRED_BRIDGE_LEDGER_CONTEXT[workerId]
  );
  assert.deepEqual(
    row.requirements,
    PRIVATE_ADMISSION_825_REQUIRED_REQUIREMENTS[workerId]
  );
}

function assertAllFalse(record, label) {
  assert.deepEqual(
    Object.values(record),
    Object.values(record).map(() => false),
    label
  );
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function assertViolationIds(ledger, expectedIds) {
  const actualIds = ledger.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}

function assertEvidenceRecognized(ledger, workerId, evidenceId, expected) {
  const evidenceRow = ledger.rowsByWorker[workerId].evidence.find(
    (row) => row.evidenceId === evidenceId
  );
  assert.notEqual(evidenceRow, undefined, evidenceId);
  assert.equal(evidenceRow.recognized, expected, evidenceId);
}

function rowContract(row) {
  return {
    sourceQueue: row.sourceQueue,
    privateAdmission: row.privateAdmission,
    localGateCoverage: row.localGateCoverage,
    runtimeCapabilityAdded: row.runtimeCapabilityAdded,
    compatibilityClaimed: row.compatibilityClaimed,
    promotion: row.promotion,
    privateEvidenceOnly: row.privateEvidenceOnly,
    sourceTokenChecksOnly: row.sourceTokenChecksOnly,
    manifestEvaluationOnly: row.manifestEvaluationOnly,
    runtimeExecutionClaimed: row.runtimeExecutionClaimed,
    rustExecutionClaimed: row.rustExecutionClaimed,
    nativeBridgeExecuted: row.nativeBridgeExecuted,
    nativeBridgeLoadAttempted: row.nativeBridgeLoadAttempted,
    packageImportAttempted: row.packageImportAttempted,
    ledgerEvaluationMode: row.ledgerEvaluationMode,
    blockedPublicClaims: row.blockedPublicClaims
  };
}

function createWorkspaceWithMutatedEvidenceFile({ evidencePath, find, replace }) {
  const root = mkdtempSync(join(tmpdir(), "private-admission-825-"));
  const workspaceRoot = findWorkspaceRoot();
  const evidencePaths = new Set([
    ...PRIVATE_ADMISSION_825_ROWS.flatMap((row) =>
      row.evidence.map((evidenceRow) => evidenceRow.path)
    ),
    ...PRIVATE_ADMISSION_733_736_BRIDGE_ROWS.flatMap((row) =>
      row.evidence.map((evidenceRow) => evidenceRow.path)
    )
  ]);

  for (const path of evidencePaths) {
    const sourcePath = join(workspaceRoot, path);
    const targetPath = join(root, path);
    mkdirSync(dirname(targetPath), { recursive: true });
    let text = readFileSync(sourcePath, "utf8");
    if (path === evidencePath) {
      text = replaceFirst(text, find, replace);
    }
    writeFileSync(targetPath, text);
  }

  return {
    root,
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    }
  };
}

function findWorkspaceRoot() {
  let current = process.cwd();
  while (true) {
    if (existsSync(join(current, "WORKER_BRIEF.md"))) {
      return current;
    }

    const parent = dirname(current);
    assert.notEqual(parent, current, "workspace root not found");
    current = parent;
  }
}

function replaceFirst(text, find, replace) {
  assert.equal(text.includes(find), true, find);
  return text.replace(find, replace);
}
