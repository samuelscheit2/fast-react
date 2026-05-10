import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_685_714_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_685_714_GATE_STATUS,
  PRIVATE_ADMISSION_685_714_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_685_714_ROWS,
  PRIVATE_ADMISSION_685_714_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_685_714_VIOLATION_STATUS,
  PRIVATE_ADMISSION_685_714_WORKERS,
  evaluatePrivateAdmission685714Gate
} from "../src/private-admission-685-714-gate.mjs";

const expected685714Workers = [
  "worker-685-root-work-loop-finished-work-handoff",
  "worker-686-host-root-update-queue-multiple-reduction",
  "worker-687-function-component-usememo-callback-execution",
  "worker-688-function-component-effect-dependency-update",
  "worker-689-layout-effect-error-cleanup-order",
  "worker-690-context-nested-provider-consumer-execution",
  "worker-691-suspense-ping-retry-lane-execution",
  "worker-692-offscreen-hidden-update-reveal-lane",
  "worker-693-deletion-subtree-ref-passive-host-order",
  "worker-694-sync-flush-nested-act-root-continuation",
  "worker-695-test-renderer-root-create-workloop-execution",
  "worker-696-test-renderer-root-update-prop-style-execution",
  "worker-697-test-renderer-tojson-multichild-native-execution",
  "worker-698-test-renderer-totree-composite-native-execution",
  "worker-699-test-renderer-testinstance-class-query-execution",
  "worker-700-test-renderer-act-nested-scope-passive-flush",
  "worker-701-test-renderer-error-boundary-commit-recovery",
  "worker-702-test-renderer-production-private-metadata-parity",
  "worker-703-dom-root-render-hosttext-component-execution",
  "worker-704-dom-root-update-style-dangerous-html-execution",
  "worker-705-dom-root-unmount-ref-passive-cleanup-execution",
  "worker-706-dom-event-click-after-root-render-execution",
  "worker-707-dom-controlled-select-textarea-restore-execution",
  "worker-708-dom-hydration-claim-text-patch-execution",
  "worker-709-dom-portal-root-render-event-handoff",
  "worker-710-dom-resource-dedupe-load-order-execution",
  "worker-711-dom-form-action-async-callback-execution",
  "worker-712-scheduler-mock-expired-lane-root-continuation",
  "worker-713-scheduler-posttask-priority-timeout-continuation"
];

test("private admission 685-714 manifest records accepted private diagnostics only", () => {
  assert.deepEqual(PRIVATE_ADMISSION_685_714_WORKERS, expected685714Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_685_714_ROWS.map((row) => row.workerId),
    expected685714Workers
  );
  assert.deepEqual(PRIVATE_ADMISSION_685_714_SKIPPED_WORKERS, [
    "worker-714-package-private-admission-audit-655-684"
  ]);
  assert.equal(PRIVATE_ADMISSION_685_714_ROWS.length, 29);
  assert.equal(new Set(PRIVATE_ADMISSION_685_714_WORKERS).size, 29);
  assert.equal(
    PRIVATE_ADMISSION_685_714_WORKERS.includes(
      "worker-714-package-private-admission-audit-655-684"
    ),
    false
  );
});

test("private admission 685-714 gate recognizes accepted diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission685714Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_685_714_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_685_714_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_685_714_WORKERS);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(
    gate.manifest.skippedWorkerIds,
    PRIVATE_ADMISSION_685_714_SKIPPED_WORKERS
  );

  for (const row of gate.rows) {
    assert.equal(row.privateAdmission, "accepted-private-diagnostic", row.workerId);
    assert.equal(row.sourceQueue, "685-714", row.workerId);
    assert.equal(row.recognized, true, row.workerId);
    assert.equal(row.evidenceRecognized, true, row.workerId);
    assert.equal(row.compatibilityClaimed, false, row.workerId);
    assert.equal(row.promotion, "rejected", row.workerId);
    assert.equal(row.privateEvidenceOnly, true, row.workerId);
    assert.ok(row.acceptedDiagnosticIds.length > 0, row.workerId);
    assert.ok(row.evidence.length > 0, row.workerId);
    assert.deepEqual(row.publicCompatibilityViolations, [], row.workerId);
    assert.deepEqual(
      row.blockedPublicCompatibilitySurfaces,
      PRIVATE_ADMISSION_685_714_BLOCKED_SURFACES,
      row.workerId
    );
    assert.deepEqual(
      Object.keys(row.publicCompatibilityClaims).sort(),
      [...PRIVATE_ADMISSION_685_714_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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

test("private admission 685-714 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission685714Gate({
    rowOverrides: {
      "worker-685-root-work-loop-finished-work-handoff": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_685_714_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: ["worker-685-root-work-loop-finished-work-handoff"]
    }
  ]);
});

test("private admission 685-714 gate rejects stale or meta worker ids", () => {
  const staleMetaWorkerId = "worker-714-package-private-admission-audit-655-684";
  const gate = evaluatePrivateAdmission685714Gate({
    rowOverrides: {
      "worker-686-host-root-update-queue-multiple-reduction": {
        workerId: staleMetaWorkerId
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_685_714_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-worker-manifest-mismatch",
      missingWorkerIds: ["worker-686-host-root-update-queue-multiple-reduction"],
      unexpectedWorkerIds: [staleMetaWorkerId],
      duplicateWorkerIds: []
    }
  ]);
});

test("private admission 685-714 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission685714Gate({
    rowOverrides: {
      "worker-703-dom-root-render-hosttext-component-execution": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_685_714_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: ["worker-703-dom-root-render-hosttext-component-execution"]
    }
  ]);
});

test("private admission 685-714 gate rejects public surface promotion leaks", () => {
  const promotionCases = [
    {
      workerId: "worker-685-root-work-loop-finished-work-handoff",
      claimId: "publicRootRenderCompatibilityClaimed"
    },
    {
      workerId: "worker-686-host-root-update-queue-multiple-reduction",
      claimId: "publicRootUpdateCompatibilityClaimed"
    },
    {
      workerId: "worker-688-function-component-effect-dependency-update",
      claimId: "publicEffectCompatibilityClaimed"
    },
    {
      workerId: "worker-690-context-nested-provider-consumer-execution",
      claimId: "publicHookCompatibilityClaimed"
    },
    {
      workerId: "worker-691-suspense-ping-retry-lane-execution",
      claimId: "publicSuspenseOffscreenCompatibilityClaimed"
    },
    {
      workerId: "worker-694-sync-flush-nested-act-root-continuation",
      claimId: "publicFlushSyncCompatibilityClaimed"
    },
    {
      workerId: "worker-700-test-renderer-act-nested-scope-passive-flush",
      claimId: "publicActCompatibilityClaimed"
    },
    {
      workerId: "worker-695-test-renderer-root-create-workloop-execution",
      claimId: "publicTestRendererCompatibilityClaimed"
    },
    {
      workerId: "worker-705-dom-root-unmount-ref-passive-cleanup-execution",
      claimId: "publicRootUnmountCompatibilityClaimed"
    },
    {
      workerId: "worker-705-dom-root-unmount-ref-passive-cleanup-execution",
      claimId: "publicRefCompatibilityClaimed"
    },
    {
      workerId: "worker-706-dom-event-click-after-root-render-execution",
      claimId: "publicEventCompatibilityClaimed"
    },
    {
      workerId: "worker-707-dom-controlled-select-textarea-restore-execution",
      claimId: "publicControlledInputCompatibilityClaimed"
    },
    {
      workerId: "worker-708-dom-hydration-claim-text-patch-execution",
      claimId: "publicHydrationCompatibilityClaimed"
    },
    {
      workerId: "worker-710-dom-resource-dedupe-load-order-execution",
      claimId: "publicResourceCompatibilityClaimed"
    },
    {
      workerId: "worker-711-dom-form-action-async-callback-execution",
      claimId: "publicFormCompatibilityClaimed"
    },
    {
      workerId: "worker-712-scheduler-mock-expired-lane-root-continuation",
      claimId: "publicSchedulerCompatibilityClaimed"
    }
  ];

  for (const { workerId, claimId } of promotionCases) {
    const gate = evaluatePrivateAdmission685714Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_685_714_VIOLATION_STATUS);
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
