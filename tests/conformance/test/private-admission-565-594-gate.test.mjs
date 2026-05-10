import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_565_594_GATE_STATUS,
  PRIVATE_ADMISSION_565_594_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_565_594_ROWS,
  PRIVATE_ADMISSION_565_594_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_565_594_VIOLATION_STATUS,
  PRIVATE_ADMISSION_565_594_WORKERS,
  evaluatePrivateAdmission565594Gate
} from "../src/private-admission-565-594-gate.mjs";

const expected565594Workers = [
  "worker-565-root-commit-finished-work-execution-gate",
  "worker-566-root-scheduler-transition-lane-routing",
  "worker-567-host-root-update-queue-callback-order",
  "worker-568-function-component-reducer-dispatch-queue",
  "worker-569-effect-list-commit-phase-order",
  "worker-570-context-multi-provider-lane-propagation",
  "worker-571-suspense-retry-root-scheduler-link",
  "worker-572-offscreen-visibility-complete-work-bubble",
  "worker-573-test-renderer-private-root-work-loop-preflight",
  "worker-574-test-renderer-update-via-root-work-loop",
  "worker-575-test-renderer-unmount-deletion-commit-link",
  "worker-576-test-renderer-act-private-root-passive-sequence",
  "worker-577-test-renderer-nested-tojson-update-refresh",
  "worker-578-react-dom-root-facade-root-work-loop-link",
  "worker-579-dom-style-payload-fake-dom-commit-link",
  "worker-580-dom-dangerous-html-fake-dom-commit-link",
  "worker-581-dom-change-event-controlled-restore-link",
  "worker-582-controlled-restore-wrapper-mutation-intent",
  "worker-583-hydration-replay-target-dispatch-link",
  "worker-584-resource-modulepreload-order-commit-gate",
  "worker-585-scheduler-mock-expired-lane-flush",
  "worker-586-scheduler-posttask-root-continuation-link",
  "worker-587-native-json-stream-batch-roundtrip",
  "worker-588-react-transition-dispatcher-routing",
  "worker-589-react-key-ref-warning-refresh"
];

test("private admission 565-594 manifest records accepted private diagnostics only", () => {
  assert.deepEqual(PRIVATE_ADMISSION_565_594_WORKERS, expected565594Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_565_594_ROWS.map((row) => row.workerId),
    expected565594Workers
  );
  assert.deepEqual(PRIVATE_ADMISSION_565_594_SKIPPED_WORKERS, [
    "worker-590-package-surface-audit-534-564",
    "worker-591-benchmark-canaries-534-564",
    "worker-592-conformance-private-admission-refresh-534-564",
    "worker-593-root-render-e2e-real-handoff-gate",
    "worker-594-worker-launcher-status-ledger"
  ]);
  assert.equal(PRIVATE_ADMISSION_565_594_ROWS.length, 25);
  assert.equal(new Set(PRIVATE_ADMISSION_565_594_WORKERS).size, 25);
});

test("private admission 565-594 gate recognizes accepted diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission565594Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_565_594_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_565_594_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_565_594_WORKERS);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(
    gate.manifest.skippedWorkerIds,
    PRIVATE_ADMISSION_565_594_SKIPPED_WORKERS
  );

  for (const row of gate.rows) {
    assert.equal(row.privateAdmission, "accepted-private-diagnostic", row.workerId);
    assert.equal(row.sourceQueue, "565-594", row.workerId);
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
      [...PRIVATE_ADMISSION_565_594_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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

test("private admission 565-594 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission565594Gate({
    rowOverrides: {
      "worker-565-root-commit-finished-work-execution-gate": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_565_594_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: ["worker-565-root-commit-finished-work-execution-gate"]
    }
  ]);
});

test("private admission 565-594 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission565594Gate({
    rowOverrides: {
      "worker-578-react-dom-root-facade-root-work-loop-link": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_565_594_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: ["worker-578-react-dom-root-facade-root-work-loop-link"]
    }
  ]);
});

test("private admission 565-594 gate rejects public surface promotion leaks", () => {
  const promotionCases = [
    {
      workerId: "worker-565-root-commit-finished-work-execution-gate",
      claimId: "publicRootRenderCompatibilityClaimed"
    },
    {
      workerId: "worker-566-root-scheduler-transition-lane-routing",
      claimId: "publicRenderCompatibilityClaimed"
    },
    {
      workerId: "worker-575-test-renderer-unmount-deletion-commit-link",
      claimId: "publicRootUnmountCompatibilityClaimed"
    },
    {
      workerId: "worker-576-test-renderer-act-private-root-passive-sequence",
      claimId: "publicActCompatibilityClaimed"
    },
    {
      workerId: "worker-583-hydration-replay-target-dispatch-link",
      claimId: "publicHydrationCompatibilityClaimed"
    },
    {
      workerId: "worker-584-resource-modulepreload-order-commit-gate",
      claimId: "publicResourceCompatibilityClaimed"
    },
    {
      workerId: "worker-585-scheduler-mock-expired-lane-flush",
      claimId: "publicSchedulerCompatibilityClaimed"
    },
    {
      workerId: "worker-587-native-json-stream-batch-roundtrip",
      claimId: "publicNativeCompatibilityClaimed"
    },
    {
      workerId: "worker-588-react-transition-dispatcher-routing",
      claimId: "publicHookCompatibilityClaimed"
    },
    {
      workerId: "worker-589-react-key-ref-warning-refresh",
      claimId: "publicElementCompatibilityClaimed"
    }
  ];

  for (const { workerId, claimId } of promotionCases) {
    const gate = evaluatePrivateAdmission565594Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_565_594_VIOLATION_STATUS);
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
