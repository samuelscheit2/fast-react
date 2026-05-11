import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_778_779_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_778_779_GATE_STATUS,
  PRIVATE_ADMISSION_778_779_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_778_779_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS,
  PRIVATE_ADMISSION_778_779_REQUIRED_STATUSES,
  PRIVATE_ADMISSION_778_779_ROWS,
  PRIVATE_ADMISSION_778_779_VIOLATION_STATUS,
  PRIVATE_ADMISSION_778_779_WORKERS,
  evaluatePrivateAdmission778779Gate
} from "../src/private-admission-778-779-gate.mjs";

const worker778 = "worker-778-resource-root-map-storage-preflight";
const worker779 = "worker-779-form-action-rejected-error-preflight";

const expectedWorkers = [worker778, worker779];

test("private admission 778-779 manifest pins resource/form private workers", () => {
  assert.deepEqual(PRIVATE_ADMISSION_778_779_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_778_779_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_778_779_ROWS.length, 2);
  assert.equal(new Set(PRIVATE_ADMISSION_778_779_WORKERS).size, 2);
  assert.equal(
    PRIVATE_ADMISSION_778_779_BLOCKED_SURFACES.includes(
      "react-dom-resource-root-map-storage"
    ),
    true
  );
  assert.equal(
    PRIVATE_ADMISSION_778_779_BLOCKED_SURFACES.includes(
      "react-dom-form-submit-dispatch"
    ),
    true
  );
  assert.equal(
    PRIVATE_ADMISSION_778_779_PUBLIC_COMPATIBILITY_CLAIMS.includes(
      "publicPackageExportsCompatibilityClaimed"
    ),
    true
  );
});

test("private admission 778-779 gate recognizes accepted diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission778779Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_778_779_GATE_STATUS);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.violations, []);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.equal(gate.runtimeExecutionClaimed, false);
  assert.equal(gate.packageCompatibilityClaimed, false);
  assert.equal(gate.exportsChanged, false);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.publicBlockerViolationIds, []);
  assert.deepEqual(gate.sideEffectClaimViolationIds, []);

  const resourceRow = gate.rowsByWorker[worker778];
  assert.equal(
    resourceRow.privateAdmission,
    "accepted-private-resource-root-map-storage-preflight"
  );
  assert.equal(
    resourceRow.primaryCompatibilityArea,
    "resource-root-map-storage-public-resource-dispatch-blocked"
  );
  assert.deepEqual(
    resourceRow.acceptedDiagnosticIds,
    PRIVATE_ADMISSION_778_779_REQUIRED_ACCEPTED_DIAGNOSTICS[worker778]
  );
  assert.deepEqual(
    resourceRow.acceptedDiagnosticStatuses,
    PRIVATE_ADMISSION_778_779_REQUIRED_STATUSES[worker778]
  );
  assert.deepEqual(
    resourceRow.requiredPublicBlockerFields,
    PRIVATE_ADMISSION_778_779_REQUIRED_PUBLIC_BLOCKERS[worker778]
  );
  assert.equal(
    resourceRow.compatibilityBlockers.publicResourceMapCommitBehavior,
    false
  );
  assert.equal(resourceRow.compatibilityBlockers.rootResourceStorageMutated, false);
  assert.equal(resourceRow.compatibilityBlockers.hoistableStylesMapMutated, false);
  assert.equal(resourceRow.compatibilityBlockers.hoistableScriptsMapMutated, false);

  const formRow = gate.rowsByWorker[worker779];
  assert.equal(
    formRow.privateAdmission,
    "accepted-private-form-action-rejected-error-preflight"
  );
  assert.equal(
    formRow.primaryCompatibilityArea,
    "form-action-rejected-error-public-submit-reset-action-routing-blocked"
  );
  assert.deepEqual(
    formRow.acceptedDiagnosticIds,
    PRIVATE_ADMISSION_778_779_REQUIRED_ACCEPTED_DIAGNOSTICS[worker779]
  );
  assert.deepEqual(
    formRow.acceptedDiagnosticStatuses,
    PRIVATE_ADMISSION_778_779_REQUIRED_STATUSES[worker779]
  );
  assert.equal(
    formRow.compatibilityBlockers.publicSubmitDispatchReachable,
    false
  );
  assert.equal(
    formRow.compatibilityBlockers.publicRequestFormResetReachable,
    false
  );
  assert.equal(formRow.compatibilityBlockers.actionInvoked, false);
  assert.equal(formRow.compatibilityBlockers.publicActionInvoked, false);
  assert.equal(formRow.compatibilityBlockers.rootErrorUpdateScheduled, false);
  assert.equal(formRow.compatibilityBlockers.realFormReset, false);

  for (const row of gate.rows) {
    assert.equal(row.recognized, true, row.workerId);
    assert.equal(row.runtimeCapabilityAdded, true, row.workerId);
    assert.equal(row.sourceTokenChecksOnly, true, row.workerId);
    assert.equal(row.manifestEvaluationOnly, true, row.workerId);
    assert.equal(row.runtimeExecutionClaimed, false, row.workerId);
    assert.equal(row.publicRuntimeExecutionClaimed, false, row.workerId);
    assert.equal(row.packageCompatibilityClaimed, false, row.workerId);
    assert.equal(row.exportsChanged, false, row.workerId);
    assertAllFalse(row.publicCompatibilityClaims, row.workerId);
    assertAllFalse(row.compatibilityBlockers, row.workerId);
    assertAllFalse(row.sideEffectClaims, row.workerId);

    for (const evidenceRow of row.evidence) {
      assert.equal(evidenceRow.recognized, true, evidenceRow.role);
      assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    }
  }
});

test("private admission 778-779 gate rejects public resource and form compatibility leaks", () => {
  const gate = evaluatePrivateAdmission778779Gate({
    rowOverrides: {
      [worker778]: {
        publicCompatibilityClaims: {
          publicResourceRootMapStorageCompatibilityClaimed: true
        },
        compatibilityBlockers: {
          publicResourceMapCommitBehavior: true
        }
      },
      [worker779]: {
        publicCompatibilityClaims: {
          publicFormSubmitDispatchCompatibilityClaimed: true
        },
        compatibilityBlockers: {
          publicSubmitDispatchReachable: true,
          actionInvoked: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_778_779_VIOLATION_STATUS);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(gate.publicCompatibilityViolationIds, [
    `${worker778}.publicResourceRootMapStorageCompatibilityClaimed`,
    `${worker779}.publicFormSubmitDispatchCompatibilityClaimed`
  ]);
  assert.deepEqual(gate.publicBlockerViolationIds, [
    `${worker778}.publicResourceMapCommitBehavior`,
    `${worker779}.publicSubmitDispatchReachable`,
    `${worker779}.actionInvoked`
  ]);
  assertViolationIds(gate, [
    "public-compatibility-claim-detected",
    "public-compatibility-blocker-leak",
    "required-private-admission-row-not-recognized"
  ]);
});

test("private admission 778-779 gate rejects runtime package and export claims", () => {
  const gate = evaluatePrivateAdmission778779Gate({
    rowOverrides: {
      [worker778]: {
        sourceTokenChecksOnly: false,
        sideEffectClaims: {
          runtimeExecutionClaimed: true
        }
      },
      [worker779]: {
        sideEffectClaims: {
          packageCompatibilityClaimed: true,
          exportsChanged: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_778_779_VIOLATION_STATUS);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.runtimeExecutionClaimed, true);
  assert.equal(gate.packageCompatibilityClaimed, true);
  assert.equal(gate.exportsChanged, true);
  assert.deepEqual(gate.sideEffectClaimViolationIds, [
    `${worker778}.runtimeExecutionClaimed`,
    `${worker779}.packageCompatibilityClaimed`,
    `${worker779}.exportsChanged`
  ]);
  assertViolationIds(gate, [
    "runtime-or-package-surface-claim-detected",
    "static-ledger-mode-mismatch",
    "required-private-admission-row-not-recognized"
  ]);
});

test("private admission 778-779 gate rejects stale diagnostic status and false unknown claim keys", () => {
  const gate = evaluatePrivateAdmission778779Gate({
    rowOverrides: {
      [worker778]: {
        publicCompatibilityClaims: {
          unknownCompatibilityClaim: false
        }
      },
      [worker779]: {
        acceptedDiagnosticStatuses: [
          "private-form-action-rejected-error-preflight-metadata-only"
        ],
        requiredPublicBlockerFields: [
          "publicFormActionsEnabled",
          "publicSubmitDispatchReachable"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_778_779_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assertViolationIds(gate, [
    "accepted-private-diagnostic-status-mismatch",
    "public-compatibility-blocker-field-mismatch",
    "public-compatibility-claim-key-mismatch",
    "required-private-admission-row-not-recognized"
  ]);
});

test("private admission 778-779 gate rejects missing static source evidence", () => {
  const gate = evaluatePrivateAdmission778779Gate({
    rowOverrides: {
      [worker778]: {
        evidence: [
          {
            role: "worker-778-missing-token",
            path: "packages/react-dom/src/resource-form-internals-gate.js",
            tokens: ["missing-resource-root-map-storage-token"]
          }
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_778_779_VIOLATION_STATUS);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.rowsByWorker[worker778].evidenceRecognized, false);
  assert.deepEqual(
    gate.rowsByWorker[worker778].evidence[0].missingTokens,
    ["missing-resource-root-map-storage-token"]
  );
  assertViolationIds(gate, [
    "required-private-admission-evidence-token-missing",
    "required-private-admission-row-not-recognized"
  ]);
});

function assertAllFalse(record, label) {
  assert.deepEqual(
    Object.values(record),
    Object.values(record).map(() => false),
    label
  );
}

function assertViolationIds(gate, expectedIds) {
  assert.deepEqual(
    gate.violations.map((violation) => violation.id),
    expectedIds
  );
}
