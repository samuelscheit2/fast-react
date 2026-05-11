import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_804_EVIDENCE_ROLES,
  PRIVATE_ADMISSION_804_GATE_STATUS,
  PRIVATE_ADMISSION_804_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_804_REQUIRED_CAPABILITIES,
  PRIVATE_ADMISSION_804_REQUIRED_STATUS_IDENTIFIERS,
  PRIVATE_ADMISSION_804_ROWS,
  PRIVATE_ADMISSION_804_VIOLATION_STATUS,
  PRIVATE_ADMISSION_804_WORKERS,
  evaluatePrivateAdmission804Gate
} from "../src/private-admission-804-managed-child-placement-delete-ledger.mjs";

const worker785 =
  "worker-785-reconciler-managed-child-placement-delete-handoff";
const expectedWorkers = [worker785];

test("private admission 804 manifest pins Worker 785 managed child handoff", () => {
  assert.deepEqual(PRIVATE_ADMISSION_804_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_804_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_804_ROWS.length, 1);
  assert.deepEqual(
    PRIVATE_ADMISSION_804_ROWS[0].requiredCapabilities,
    PRIVATE_ADMISSION_804_REQUIRED_CAPABILITIES
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_804_ROWS[0].acceptedStatusIdentifiers,
    PRIVATE_ADMISSION_804_REQUIRED_STATUS_IDENTIFIERS
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_804_ROWS[0].evidence.map((row) => row.role),
    PRIVATE_ADMISSION_804_EVIDENCE_ROLES
  );
});

test("private admission 804 recognizes static managed child placement/delete evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission804Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_804_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.capabilitiesRecognized, true);
  assert.equal(gate.statusIdentifiersRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.packageNativeCompatibilityRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.publicBlockerClaimViolationIds, []);
  assert.deepEqual(gate.packageNativeClaimViolationIds, []);
  assert.deepEqual(gate.runtimeExecutionClaimViolationIds, []);

  const row = gate.rowsByWorker[worker785];
  assert.equal(
    row.privateAdmission,
    "accepted-private-managed-child-placement-delete-handoff"
  );
  assert.equal(row.sourceQueue, "804");
  assert.equal(row.privateEvidenceOnly, true);
  assert.equal(row.sourceTokenChecksOnly, true);
  assert.equal(row.manifestEvaluationOnly, true);
  assert.equal(row.runtimeExecutionClaimed, false);
  assert.equal(row.rustExecutionClaimed, false);
  assert.equal(row.packageCodeExecuted, false);
  assert.equal(row.nativeBridgeExecuted, false);
  assert.equal(row.packageSurfaceChanged, false);
  assert.equal(row.packageCompatibilityClaimed, false);
  assert.equal(row.nativeCompatibilityClaimed, false);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(
    row.ledgerEvaluationMode,
    "source-token-checks-and-manifest-only"
  );
  assert.deepEqual(
    Object.keys(row.publicBlockerClaims).sort(),
    [...PRIVATE_ADMISSION_804_PUBLIC_BLOCKER_FIELDS].sort()
  );
  assert.deepEqual(
    Object.values(row.publicBlockerClaims),
    Object.values(row.publicBlockerClaims).map(() => false)
  );

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.orderedTokenViolations, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.role);
  }
});

test("private admission 804 rejects missing complete-work and host-work source evidence", () => {
  const baseRow = rowByWorker(worker785);
  const gate = evaluatePrivateAdmission804Gate({
    rowOverrides: {
      [worker785]: {
        evidence: withMissingEvidenceTokens(baseRow, [
          {
            role: "complete-work-managed-child-metadata",
            token: "missing-sole-child-placement-guard-token"
          },
          {
            role: "host-work-managed-child-delete-cleanup",
            token: "missing-delete-cleanup-token"
          }
        ])
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_804_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, ["private-managed-child-evidence-mismatch"]);
  assertEvidenceRoleRecognized(
    gate,
    "complete-work-managed-child-metadata",
    false
  );
  assertEvidenceRoleRecognized(
    gate,
    "host-work-managed-child-delete-cleanup",
    false
  );
});

test("private admission 804 rejects root-commit order drift and status/capability drift", () => {
  const baseRow = rowByWorker(worker785);
  const gate = evaluatePrivateAdmission804Gate({
    rowOverrides: {
      [worker785]: {
        requiredCapabilities: PRIVATE_ADMISSION_804_REQUIRED_CAPABILITIES.filter(
          (capability) =>
            capability !== "root-commit-validation-before-current-switch"
        ),
        acceptedStatusIdentifiers:
          PRIVATE_ADMISSION_804_REQUIRED_STATUS_IDENTIFIERS.filter(
            (identifier) =>
              identifier !==
              "HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation"
          ),
        evidence: withOrderedEvidenceTokens(
          baseRow,
          "root-commit-validation-before-current-switch",
          [
            "let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(",
            "validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;"
          ]
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_804_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.capabilitiesRecognized, false);
  assert.equal(gate.statusIdentifiersRecognized, false);
  assertViolationIds(gate, [
    "private-managed-child-evidence-mismatch",
    "private-managed-child-capability-mismatch",
    "private-managed-child-status-identifier-mismatch"
  ]);
  assertEvidenceRoleRecognized(
    gate,
    "root-commit-validation-before-current-switch",
    false
  );
  const evidenceRow = gate.rowsByWorker[worker785].evidence.find(
    (row) => row.role === "root-commit-validation-before-current-switch"
  );
  assert.deepEqual(evidenceRow.orderedTokenViolations, [
    "validate_host_root_finished_work_pending_commit_for_canary(store, render, pending)?;"
  ]);
});

test("private admission 804 rejects public, package/native, and runtime execution claims", () => {
  const gate = evaluatePrivateAdmission804Gate({
    rowOverrides: {
      [worker785]: {
        sourceTokenChecksOnly: false,
        runtimeExecutionClaimed: true,
        rustExecutionClaimed: true,
        packageCodeExecuted: true,
        nativeBridgeExecuted: true,
        packageSurfaceChanged: true,
        packageCompatibilityClaimed: true,
        nativeCompatibilityClaimed: true,
        compatibilityClaimed: true,
        ledgerEvaluationMode: "runtime-execution",
        publicBlockerClaims: {
          publicRendererHostMutationAvailable: true,
          reactDomManagedChildCompatibilityClaimed: true,
          reactTestRendererCompatibilityClaimed: true,
          hydrationEventsRefsResourcesFormsClaimed: true,
          packageSurfaceCompatibilityClaimed: true,
          nativeBridgeCompatibilityClaimed: true,
          publicCompatibilityClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_804_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.packageNativeCompatibilityRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertViolationIds(gate, [
    "private-managed-child-public-blocker-claim-detected",
    "private-managed-child-package-native-compatibility-claim-detected",
    "private-managed-child-runtime-execution-claim",
    "private-managed-child-static-ledger-mode-mismatch",
    "private-managed-child-compatibility-claim-detected"
  ]);
  assertSubset(
    [
      `${worker785}.publicRendererHostMutationAvailable`,
      `${worker785}.reactDomManagedChildCompatibilityClaimed`,
      `${worker785}.reactTestRendererCompatibilityClaimed`,
      `${worker785}.hydrationEventsRefsResourcesFormsClaimed`
    ],
    gate.publicBlockerClaimViolationIds
  );
  assertSubset(
    [
      `${worker785}.packageSurfaceChanged`,
      `${worker785}.packageCompatibilityClaimed`,
      `${worker785}.nativeCompatibilityClaimed`,
      `${worker785}.nativeBridgeExecuted`,
      `${worker785}.packageCodeExecuted`,
      `${worker785}.packageSurfaceCompatibilityClaimed`,
      `${worker785}.nativeBridgeCompatibilityClaimed`
    ],
    gate.packageNativeClaimViolationIds
  );
  assertSubset(
    [`${worker785}.runtimeExecutionClaimed`, `${worker785}.rustExecutionClaimed`],
    gate.runtimeExecutionClaimViolationIds
  );
});

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
  const evidenceRow = gate.rowsByWorker[worker785].evidence.find(
    (row) => row.role === role
  );
  assert.notEqual(evidenceRow, undefined, role);
  assert.equal(evidenceRow.recognized, expectedRecognized, role);
}

function rowByWorker(workerId) {
  const row = PRIVATE_ADMISSION_804_ROWS.find(
    (candidate) => candidate.workerId === workerId
  );
  assert.notEqual(row, undefined, workerId);
  return row;
}

function withMissingEvidenceTokens(row, missingTokens) {
  return row.evidence.map((evidenceRow) => {
    const additions = missingTokens
      .filter((missingToken) => missingToken.role === evidenceRow.role)
      .map((missingToken) => missingToken.token);
    if (additions.length === 0) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      tokens: [...evidenceRow.tokens, ...additions]
    };
  });
}

function withOrderedEvidenceTokens(row, role, orderedTokens) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      orderedTokens
    };
  });
}
