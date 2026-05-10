import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_655_684_GATE_STATUS,
  PRIVATE_ADMISSION_655_684_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_655_684_ROWS,
  PRIVATE_ADMISSION_655_684_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_655_684_VIOLATION_STATUS,
  PRIVATE_ADMISSION_655_684_WORKERS,
  evaluatePrivateAdmission655684Gate
} from "../src/private-admission-655-684-gate.mjs";

const expected655684Workers = [
  "worker-655-root-commit-text-replacement-execution",
  "worker-656-host-component-prop-style-commit-execution",
  "worker-657-root-commit-multi-child-placement-execution",
  "worker-658-function-passive-effect-destroy-create-execution",
  "worker-659-layout-effect-destroy-create-commit-execution",
  "worker-660-ref-detach-attach-update-execution",
  "worker-661-context-provider-update-commit-propagation",
  "worker-662-suspense-fallback-retry-commit-execution",
  "worker-663-offscreen-passive-defer-reveal-execution",
  "worker-664-root-error-recovery-commit-execution",
  "worker-665-sync-flush-cross-root-callback-execution",
  "worker-666-hook-reducer-transition-lane-execution",
  "worker-667-test-renderer-totree-native-execution",
  "worker-668-test-renderer-testinstance-native-query-execution",
  "worker-669-test-renderer-error-boundary-native-execution",
  "worker-670-test-renderer-act-passive-native-flush",
  "worker-671-test-renderer-root-update-serialization-props",
  "worker-672-test-renderer-unmount-passive-ref-order",
  "worker-673-dom-root-live-container-preflight",
  "worker-674-dom-root-ref-passive-unmount-facade",
  "worker-675-dom-root-fragment-array-fake-dom-render",
  "worker-676-dom-controlled-live-text-restore-preflight",
  "worker-677-dom-hydration-text-mismatch-recovery-execution",
  "worker-678-dom-hydration-replay-click-dispatch",
  "worker-679-dom-resource-preload-preinit-fake-head-execution",
  "worker-680-dom-stylesheet-load-state-commit-execution",
  "worker-681-dom-script-modulepreload-order-execution",
  "worker-682-dom-form-action-callback-preflight",
  "worker-683-scheduler-posttask-act-root-continuation"
];

test("private admission 655-684 manifest records accepted private diagnostics only", () => {
  assert.deepEqual(PRIVATE_ADMISSION_655_684_WORKERS, expected655684Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_655_684_ROWS.map((row) => row.workerId),
    expected655684Workers
  );
  assert.deepEqual(PRIVATE_ADMISSION_655_684_SKIPPED_WORKERS, [
    "worker-684-package-surface-private-admission-refresh"
  ]);
  assert.equal(PRIVATE_ADMISSION_655_684_ROWS.length, 29);
  assert.equal(new Set(PRIVATE_ADMISSION_655_684_WORKERS).size, 29);
});

test("private admission 655-684 gate recognizes accepted diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission655684Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_655_684_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_655_684_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_655_684_WORKERS);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(
    gate.manifest.skippedWorkerIds,
    PRIVATE_ADMISSION_655_684_SKIPPED_WORKERS
  );

  for (const row of gate.rows) {
    assert.equal(row.privateAdmission, "accepted-private-diagnostic", row.workerId);
    assert.equal(row.sourceQueue, "655-684", row.workerId);
    assert.equal(row.recognized, true, row.workerId);
    assert.equal(row.evidenceRecognized, true, row.workerId);
    assert.equal(row.compatibilityClaimed, false, row.workerId);
    assert.equal(row.promotion, "rejected", row.workerId);
    assert.equal(row.privateEvidenceOnly, true, row.workerId);
    assert.ok(row.acceptedDiagnosticIds.length > 0, row.workerId);
    assert.ok(row.evidence.length > 0, row.workerId);
    assert.deepEqual(row.publicCompatibilityViolations, [], row.workerId);
    assert.deepEqual(
      Object.keys(row.publicCompatibilityClaims).sort(),
      [...PRIVATE_ADMISSION_655_684_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
      row.workerId
    );
    assert.deepEqual(
      Object.values(row.publicCompatibilityClaims),
      Object.values(row.publicCompatibilityClaims).map(() => false),
      row.workerId
    );
    assert.deepEqual(
      row.blockedPublicClaims,
      Object.keys(row.publicCompatibilityClaims),
      row.workerId
    );

    for (const evidenceRow of row.evidence) {
      assert.equal(evidenceRow.recognized, true, `${row.workerId} ${evidenceRow.path}`);
      assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    }
  }
});

test("private admission 655-684 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission655684Gate({
    rowOverrides: {
      "worker-655-root-commit-text-replacement-execution": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_655_684_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: ["worker-655-root-commit-text-replacement-execution"]
    }
  ]);
});

test("private admission 655-684 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission655684Gate({
    rowOverrides: {
      "worker-673-dom-root-live-container-preflight": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_655_684_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: ["worker-673-dom-root-live-container-preflight"]
    }
  ]);
});

test("private admission 655-684 gate rejects public surface promotion leaks", () => {
  const promotionCases = [
    {
      workerId: "worker-655-root-commit-text-replacement-execution",
      claimId: "publicRootRenderCompatibilityClaimed"
    },
    {
      workerId: "worker-658-function-passive-effect-destroy-create-execution",
      claimId: "publicEffectCompatibilityClaimed"
    },
    {
      workerId: "worker-660-ref-detach-attach-update-execution",
      claimId: "publicRefCompatibilityClaimed"
    },
    {
      workerId: "worker-661-context-provider-update-commit-propagation",
      claimId: "publicHookCompatibilityClaimed"
    },
    {
      workerId: "worker-662-suspense-fallback-retry-commit-execution",
      claimId: "publicSuspenseOffscreenCompatibilityClaimed"
    },
    {
      workerId: "worker-665-sync-flush-cross-root-callback-execution",
      claimId: "publicFlushSyncCompatibilityClaimed"
    },
    {
      workerId: "worker-667-test-renderer-totree-native-execution",
      claimId: "publicTestRendererCompatibilityClaimed"
    },
    {
      workerId: "worker-670-test-renderer-act-passive-native-flush",
      claimId: "publicActCompatibilityClaimed"
    },
    {
      workerId: "worker-674-dom-root-ref-passive-unmount-facade",
      claimId: "publicRootUnmountCompatibilityClaimed"
    },
    {
      workerId: "worker-676-dom-controlled-live-text-restore-preflight",
      claimId: "publicControlledInputCompatibilityClaimed"
    },
    {
      workerId: "worker-677-dom-hydration-text-mismatch-recovery-execution",
      claimId: "publicHydrationCompatibilityClaimed"
    },
    {
      workerId: "worker-678-dom-hydration-replay-click-dispatch",
      claimId: "publicEventCompatibilityClaimed"
    },
    {
      workerId: "worker-679-dom-resource-preload-preinit-fake-head-execution",
      claimId: "publicResourceCompatibilityClaimed"
    },
    {
      workerId: "worker-682-dom-form-action-callback-preflight",
      claimId: "publicFormCompatibilityClaimed"
    },
    {
      workerId: "worker-683-scheduler-posttask-act-root-continuation",
      claimId: "publicSchedulerCompatibilityClaimed"
    }
  ];

  for (const { workerId, claimId } of promotionCases) {
    const gate = evaluatePrivateAdmission655684Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_655_684_VIOLATION_STATUS);
    assert.equal(gate.compatibilityClaimed, true);
    assert.equal(gate.publicCompatibilityClaimed, true);
    assert.deepEqual(gate.violations, [
      {
        id: "public-compatibility-claim-detected",
        claimIds: [`${workerId}.${claimId}`]
      }
    ]);
  }
});
