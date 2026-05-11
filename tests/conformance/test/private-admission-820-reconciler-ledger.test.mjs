import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_820_GATE_STATUS,
  PRIVATE_ADMISSION_820_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_820_REQUIRED_CAPABILITIES,
  PRIVATE_ADMISSION_820_REQUIRED_EVIDENCE_ROLES,
  PRIVATE_ADMISSION_820_REQUIRED_STATUS_IDENTIFIERS,
  PRIVATE_ADMISSION_820_ROWS,
  PRIVATE_ADMISSION_820_TOP_LEVEL_PUBLIC_CLAIM_FIELDS,
  PRIVATE_ADMISSION_820_TOP_LEVEL_RUNTIME_CLAIM_FIELDS,
  PRIVATE_ADMISSION_820_VIOLATION_STATUS,
  PRIVATE_ADMISSION_820_WORKERS,
  evaluatePrivateAdmission820Gate
} from "../src/private-admission-820-reconciler-ledger.mjs";

const worker803 = "worker-803-reconciler-managed-child-sibling-order";
const worker817 = "worker-817-root-work-loop-finished-lanes-negative-matrix";
const expectedWorkers = [worker803, worker817];

test("private admission 820 manifest pins accepted reconciler ledger workers", () => {
  assert.deepEqual(PRIVATE_ADMISSION_820_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_820_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_820_ROWS.length, 2);

  for (const row of PRIVATE_ADMISSION_820_ROWS) {
    assert.equal(Object.isFrozen(row), true, row.workerId);
    assert.equal(row.sourceQueue, "820", row.workerId);
    assert.equal(row.privateEvidenceOnly, true, row.workerId);
    assert.equal(row.sourceTokenChecksOnly, true, row.workerId);
    assert.equal(row.manifestEvaluationOnly, true, row.workerId);
    assert.equal(row.runtimeExecutionClaimed, false, row.workerId);
    assert.equal(row.rustExecutionClaimed, false, row.workerId);
    assert.equal(row.rootRuntimeExecuted, false, row.workerId);
    assert.equal(row.actRuntimeExecuted, false, row.workerId);
    assert.equal(row.schedulerRuntimeExecuted, false, row.workerId);
    assert.equal(row.packageCodeExecuted, false, row.workerId);
    assert.equal(row.nativeBridgeExecuted, false, row.workerId);
    assert.equal(row.compatibilityClaimed, false, row.workerId);
    for (const field of PRIVATE_ADMISSION_820_TOP_LEVEL_PUBLIC_CLAIM_FIELDS) {
      assert.equal(row[field], false, `${row.workerId}.${field}`);
    }
    for (const field of PRIVATE_ADMISSION_820_TOP_LEVEL_RUNTIME_CLAIM_FIELDS) {
      assert.equal(row[field], false, `${row.workerId}.${field}`);
    }
    assert.equal(
      row.ledgerEvaluationMode,
      "source-token-checks-and-manifest-only",
      row.workerId
    );
    assert.deepEqual(
      row.requiredCapabilities,
      PRIVATE_ADMISSION_820_REQUIRED_CAPABILITIES[row.workerId],
      row.workerId
    );
    assert.deepEqual(
      row.acceptedStatusIdentifiers,
      PRIVATE_ADMISSION_820_REQUIRED_STATUS_IDENTIFIERS[row.workerId],
      row.workerId
    );
    assert.deepEqual(
      row.evidence.map((evidenceRow) => evidenceRow.role),
      PRIVATE_ADMISSION_820_REQUIRED_EVIDENCE_ROLES[row.workerId],
      row.workerId
    );
    assert.deepEqual(
      Object.keys(row.publicBlockerClaims).sort(),
      [...PRIVATE_ADMISSION_820_PUBLIC_BLOCKER_FIELDS].sort(),
      row.workerId
    );
    assertAllFalse(row.publicBlockerClaims, row.workerId);

    for (const evidenceRow of row.evidence) {
      assert.equal(
        evidenceRow.path.startsWith("worker-progress/"),
        false,
        evidenceRow.role
      );
      for (const token of evidenceRow.tokens) {
        assert.equal(/\s/u.test(token), false, token);
        assert.equal(/[(){};]/u.test(token), false, token);
      }
    }
  }
});

test("private admission 820 recognizes static source-owned evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission820Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_820_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.manifestRecognized, true);
  assert.equal(gate.evidenceRolesRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.capabilitiesRecognized, true);
  assert.equal(gate.statusIdentifiersRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.publicClaimViolationIds, []);
  assert.deepEqual(gate.runtimeExecutionClaimViolationIds, []);
  assert.deepEqual(gate.staticReadOnlyViolationIds, []);
  assert.deepEqual(gate.publicCompatibilityClaimIds, []);

  const managedChild = gate.rowsByWorker[worker803];
  assert.equal(
    managedChild.privateAdmission,
    "accepted-private-managed-child-sibling-order-handoff"
  );
  assertIncludes(managedChild.acceptedStatusIdentifiers, [
    "HostRootPlacementSiblingStatus::InsertBefore",
    "TestHostRootMutationHostCall::InsertBefore",
    "HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation"
  ]);
  assertEvidenceRolesRecognized(managedChild);

  const finishedLanes = gate.rowsByWorker[worker817];
  assert.equal(
    finishedLanes.privateAdmission,
    "accepted-private-finished-lanes-handoff-negative-matrix"
  );
  assertIncludes(finishedLanes.acceptedStatusIdentifiers, [
    "HostRootFinishedWorkCommitHandoffErrorForCanary::FinishedWorkRootMetadataMismatch",
    "RootSyncSchedulerContinuationExecutionStatus::BlockedByFinishedWorkHandoffMismatch",
    "SchedulerBridgeActContinuationExecutionStatus::RejectedContinuation"
  ]);
  assertEvidenceRolesRecognized(finishedLanes);
});

test("private admission 820 rejects missing, extra, and duplicate workers", () => {
  const duplicate803 = {
    ...rowByWorker(worker803),
    area: "duplicate managed-child row"
  };
  const unexpected = {
    ...rowByWorker(worker803),
    workerId: "worker-999-unexpected-private-ledger-row"
  };
  const gate = evaluatePrivateAdmission820Gate({
    rows: [rowByWorker(worker803), duplicate803, unexpected]
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_820_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.manifestRecognized, false);
  assert.deepEqual(gate.manifest.missingWorkerIds, [worker817]);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, [
    "worker-999-unexpected-private-ledger-row"
  ]);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, [worker803]);
  assertViolationIds(gate, ["private-admission-820-worker-manifest-mismatch"]);
});

test("private admission 820 rejects stale statuses, capabilities, and missing evidence roles", () => {
  const base = rowByWorker(worker803);
  const gate = evaluatePrivateAdmission820Gate({
    rowOverrides: {
      [worker803]: {
        requiredCapabilities: base.requiredCapabilities.filter(
          (capability) => capability !== "host-work-private-insert-before"
        ),
        acceptedStatusIdentifiers: base.acceptedStatusIdentifiers.filter(
          (identifier) =>
            identifier !== "HostRootPlacementSiblingStatus::InsertBefore"
        ),
        evidence: base.evidence.filter(
          (evidenceRow) =>
            evidenceRow.role !== "worker-803-host-work-sibling-order-execution"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_820_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRolesRecognized, false);
  assert.equal(gate.capabilitiesRecognized, false);
  assert.equal(gate.statusIdentifiersRecognized, false);
  assertViolationIds(gate, [
    "private-admission-820-evidence-role-mismatch",
    "private-admission-820-capability-mismatch",
    "private-admission-820-status-identifier-mismatch"
  ]);
});

test("private admission 820 rejects missing evidence and unstable progress or snippet evidence", () => {
  const gate = evaluatePrivateAdmission820Gate({
    rowOverrides: {
      [worker817]: {
        evidence: withMissingEvidenceToken(
          rowByWorker(worker817),
          "worker-817-root-scheduler-finished-lanes-negative",
          "MissingSourceOwnedFinishedLanesIdentifierForCanary"
        )
      },
      [worker803]: {
        evidence: [
          {
            role: "worker-803-progress-prose",
            path: "worker-progress/worker-803-reconciler-managed-child-sibling-order.md",
            tokens: [
              "Public root rendering",
              "host_component_managed_child_sibling_order_complete_work_record_for_canary()"
            ],
            forbiddenTokens: []
          }
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_820_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.evidenceRolesRecognized, false);
  assertViolationIds(gate, [
    "private-admission-820-evidence-role-mismatch",
    "private-admission-820-evidence-token-missing-or-unstable"
  ]);

  const evidenceViolation = gate.violations.find(
    (violation) =>
      violation.id === "private-admission-820-evidence-token-missing-or-unstable"
  );
  const progressMismatch = evidenceViolation.rows.find(
    (row) => row.role === "worker-803-progress-prose"
  );
  assertSubset(
    [
      "worker-progress-evidence-path",
      "prose-or-formatted-token:Public root rendering",
      "source-snippet-token:host_component_managed_child_sibling_order_complete_work_record_for_canary()"
    ],
    progressMismatch.unstableEvidenceReasons
  );
  const missingTokenMismatch = evidenceViolation.rows.find(
    (row) => row.role === "worker-817-root-scheduler-finished-lanes-negative"
  );
  assert.deepEqual(missingTokenMismatch.missingTokens, [
    "MissingSourceOwnedFinishedLanesIdentifierForCanary"
  ]);
});

test("private admission 820 rejects top-level public and runtime alias claims", () => {
  const gate = evaluatePrivateAdmission820Gate({
    rowOverrides: {
      [worker803]: {
        reactDomCompatibilityClaimed: true,
        reactTestRendererCompatibilityClaimed: true,
        broadReconcilerTraversalClaimed: true,
        rootCommitPublicCompatibilityClaimed: true,
        publicRendererHostMutationClaimed: true,
        publicPackageCompatibilityClaimed: true,
        nativePackageCompatibilityClaimed: true,
        actRuntimeExecutionClaimed: true,
        schedulerRuntimeExecutionClaimed: true,
        publicReactActCompatibilityClaimed: true,
        publicRootSchedulerCompatibilityClaimed: true,
        publicSchedulerCompatibilityClaimed: true,
        publicSchedulerFlushHelperCompatibilityClaimed: true,
        rootRuntimeExecutionClaimed: true,
        rootCommitRuntimeExecutionClaimed: true,
        packageSurfaceChanged: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_820_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.staticReadOnlyViolationIds, [worker803]);
  assertViolationIds(gate, [
    "private-admission-820-public-claim-detected",
    "private-admission-820-runtime-execution-claim",
    "private-admission-820-static-ledger-mode-mismatch",
    "private-admission-820-public-compatibility-claim-detected"
  ]);
  assertSubset(
    [
      `${worker803}.reactDomCompatibilityClaimed`,
      `${worker803}.reactTestRendererCompatibilityClaimed`,
      `${worker803}.broadReconcilerTraversalClaimed`,
      `${worker803}.rootCommitPublicCompatibilityClaimed`,
      `${worker803}.publicRendererHostMutationClaimed`,
      `${worker803}.publicPackageCompatibilityClaimed`,
      `${worker803}.nativePackageCompatibilityClaimed`,
      `${worker803}.publicReactActCompatibilityClaimed`,
      `${worker803}.publicRootSchedulerCompatibilityClaimed`,
      `${worker803}.publicSchedulerCompatibilityClaimed`,
      `${worker803}.publicSchedulerFlushHelperCompatibilityClaimed`
    ],
    gate.publicClaimViolationIds
  );
  assertSubset(
    [
      `${worker803}.actRuntimeExecutionClaimed`,
      `${worker803}.schedulerRuntimeExecutionClaimed`,
      `${worker803}.rootRuntimeExecutionClaimed`,
      `${worker803}.rootCommitRuntimeExecutionClaimed`,
      `${worker803}.packageSurfaceChanged`
    ],
    gate.runtimeExecutionClaimViolationIds
  );
  assertSubset(
    [
      `${worker803}.reactDomCompatibilityClaimed`,
      `${worker803}.reactTestRendererCompatibilityClaimed`,
      `${worker803}.broadReconcilerTraversalClaimed`,
      `${worker803}.rootCommitPublicCompatibilityClaimed`,
      `${worker803}.publicRendererHostMutationClaimed`,
      `${worker803}.publicPackageCompatibilityClaimed`,
      `${worker803}.nativePackageCompatibilityClaimed`
    ],
    gate.publicCompatibilityClaimIds
  );
});

test("private admission 820 rejects root, act, Scheduler, package, native, runtime, and public compatibility claims", () => {
  const gate = evaluatePrivateAdmission820Gate({
    rowOverrides: {
      [worker817]: {
        sourceTokenChecksOnly: false,
        manifestEvaluationOnly: false,
        runtimeExecutionClaimed: true,
        rustExecutionClaimed: true,
        rootRuntimeExecuted: true,
        actRuntimeExecuted: true,
        schedulerRuntimeExecuted: true,
        packageCodeExecuted: true,
        nativeBridgeExecuted: true,
        compatibilityClaimed: true,
        publicCompatibilityClaimed: true,
        packageCompatibilityClaimed: true,
        nativeCompatibilityClaimed: true,
        rootCompatibilityClaimed: true,
        actCompatibilityClaimed: true,
        schedulerCompatibilityClaimed: true,
        ledgerEvaluationMode: "runtime-execution",
        publicBlockerClaims: {
          publicRootCompatibilityClaimed: true,
          rootFacadeCompatibilityClaimed: true,
          publicActCompatibilityClaimed: true,
          drainsPublicReactActQueue: true,
          publicSchedulerTimingCompatibilityClaimed: true,
          publicSchedulerFlushCompatibilityClaimed: true,
          publicSchedulerContinuationClaimed: true,
          packageCompatibilityClaimed: true,
          publicPackageCompatibilityClaimed: true,
          nativeBridgeExecuted: true,
          nativeCompatibilityClaimed: true,
          publicCompatibilityClaimed: true,
          compatibilityClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_820_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertViolationIds(gate, [
    "private-admission-820-public-claim-detected",
    "private-admission-820-runtime-execution-claim",
    "private-admission-820-static-ledger-mode-mismatch",
    "private-admission-820-public-compatibility-claim-detected"
  ]);
  assertSubset(
    [
      `${worker817}.publicRootCompatibilityClaimed`,
      `${worker817}.publicActCompatibilityClaimed`,
      `${worker817}.publicSchedulerTimingCompatibilityClaimed`,
      `${worker817}.publicSchedulerContinuationClaimed`,
      `${worker817}.packageCompatibilityClaimed`,
      `${worker817}.nativeCompatibilityClaimed`,
      `${worker817}.publicCompatibilityClaimed`
    ],
    gate.publicClaimViolationIds
  );
  assertSubset(
    [
      `${worker817}.runtimeExecutionClaimed`,
      `${worker817}.rustExecutionClaimed`,
      `${worker817}.rootRuntimeExecuted`,
      `${worker817}.actRuntimeExecuted`,
      `${worker817}.schedulerRuntimeExecuted`,
      `${worker817}.packageCodeExecuted`,
      `${worker817}.nativeBridgeExecuted`
    ],
    gate.runtimeExecutionClaimViolationIds
  );
  assertSubset(
    [
      `${worker817}.compatibilityClaimed`,
      `${worker817}.publicCompatibilityClaimed`,
      `${worker817}.packageCompatibilityClaimed`,
      `${worker817}.nativeCompatibilityClaimed`,
      `${worker817}.rootCompatibilityClaimed`,
      `${worker817}.actCompatibilityClaimed`,
      `${worker817}.schedulerCompatibilityClaimed`
    ],
    gate.publicCompatibilityClaimIds
  );
});

function assertEvidenceRolesRecognized(row) {
  assert.equal(row.evidenceRecognized, true, row.workerId);
  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.unstableEvidenceReasons, [], evidenceRow.role);
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

function assertIncludes(actual, expectedSubset) {
  for (const expected of expectedSubset) {
    assert.equal(actual.includes(expected), true, expected);
  }
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const expected of expectedSubset) {
    assert.equal(actualSuperset.includes(expected), true, expected);
  }
}

function rowByWorker(workerId) {
  const row = PRIVATE_ADMISSION_820_ROWS.find(
    (candidate) => candidate.workerId === workerId
  );
  assert.notEqual(row, undefined, workerId);
  return row;
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
