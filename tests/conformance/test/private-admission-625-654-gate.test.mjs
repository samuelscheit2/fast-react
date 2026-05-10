import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_625_654_GATE_STATUS,
  PRIVATE_ADMISSION_625_654_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_625_654_ROWS,
  PRIVATE_ADMISSION_625_654_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_625_654_VIOLATION_STATUS,
  PRIVATE_ADMISSION_625_654_WORKERS,
  evaluatePrivateAdmission625654Gate
} from "../src/private-admission-625-654-gate.mjs";

const expected625654Workers = [
  "worker-625-root-scheduler-lane-expiration-commit-execution",
  "worker-626-sync-flush-act-root-execution-path",
  "worker-627-function-component-usestate-render-execution",
  "worker-628-function-component-usereducer-render-execution",
  "worker-629-effect-update-unmount-commit-execution",
  "worker-630-context-consumer-lane-propagation-execution",
  "worker-631-suspense-retry-thenable-execution",
  "worker-632-offscreen-visible-reveal-commit-execution",
  "worker-633-host-child-placement-reorder-execution",
  "worker-634-deletion-ref-passive-cleanup-execution",
  "worker-635-host-style-dangerous-html-rust-commit-handoff",
  "worker-636-test-renderer-create-native-execution",
  "worker-637-test-renderer-update-native-execution",
  "worker-638-test-renderer-unmount-native-execution",
  "worker-639-test-renderer-tojson-after-native-execution",
  "worker-640-test-renderer-act-scheduler-flush-execution",
  "worker-641-react-dom-root-render-facade-execution",
  "worker-642-react-dom-root-update-facade-execution",
  "worker-643-react-dom-root-unmount-facade-execution",
  "worker-644-dom-checkbox-change-restore-execution",
  "worker-645-dom-live-controlled-input-admission-preflight",
  "worker-646-dom-focus-blur-event-dispatch-execution",
  "worker-647-dom-portal-click-delegation-execution",
  "worker-648-hydration-claim-then-replay-execution",
  "worker-649-hydration-recoverable-error-callback-execution",
  "worker-650-resource-stylesheet-commit-load-transition",
  "worker-651-resource-script-modulepreload-commit-execution",
  "worker-652-form-action-submit-reset-execution",
  "worker-653-scheduler-mock-act-flush-all-execution",
  "worker-654-scheduler-posttask-delay-abort-root-execution"
];

test("private admission 625-654 manifest records accepted private diagnostics only", () => {
  assert.deepEqual(PRIVATE_ADMISSION_625_654_WORKERS, expected625654Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_625_654_ROWS.map((row) => row.workerId),
    expected625654Workers
  );
  assert.deepEqual(PRIVATE_ADMISSION_625_654_SKIPPED_WORKERS, []);
  assert.equal(PRIVATE_ADMISSION_625_654_ROWS.length, 30);
  assert.equal(new Set(PRIVATE_ADMISSION_625_654_WORKERS).size, 30);
});

test("private admission 625-654 gate recognizes accepted diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission625654Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_625_654_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_625_654_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_625_654_WORKERS);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(
    gate.manifest.skippedWorkerIds,
    PRIVATE_ADMISSION_625_654_SKIPPED_WORKERS
  );

  for (const row of gate.rows) {
    assert.equal(row.privateAdmission, "accepted-private-diagnostic", row.workerId);
    assert.equal(row.sourceQueue, "625-654", row.workerId);
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
      [...PRIVATE_ADMISSION_625_654_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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
      assert.equal(row.evidenceRecognized, true, row.workerId);
      assert.equal(evidenceRow.recognized, true, `${row.workerId} ${evidenceRow.path}`);
      assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    }
  }
});

test("private admission 625-654 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission625654Gate({
    rowOverrides: {
      "worker-625-root-scheduler-lane-expiration-commit-execution": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_625_654_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: ["worker-625-root-scheduler-lane-expiration-commit-execution"]
    }
  ]);
});

test("private admission 625-654 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission625654Gate({
    rowOverrides: {
      "worker-641-react-dom-root-render-facade-execution": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_625_654_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: ["worker-641-react-dom-root-render-facade-execution"]
    }
  ]);
});

test("private admission 625-654 gate rejects public surface promotion leaks", () => {
  const promotionCases = [
    {
      workerId: "worker-625-root-scheduler-lane-expiration-commit-execution",
      claimId: "publicRootRenderCompatibilityClaimed"
    },
    {
      workerId: "worker-626-sync-flush-act-root-execution-path",
      claimId: "publicFlushSyncCompatibilityClaimed"
    },
    {
      workerId: "worker-627-function-component-usestate-render-execution",
      claimId: "publicHookCompatibilityClaimed"
    },
    {
      workerId: "worker-629-effect-update-unmount-commit-execution",
      claimId: "publicEffectCompatibilityClaimed"
    },
    {
      workerId: "worker-631-suspense-retry-thenable-execution",
      claimId: "publicSuspenseOffscreenCompatibilityClaimed"
    },
    {
      workerId: "worker-634-deletion-ref-passive-cleanup-execution",
      claimId: "publicRefCompatibilityClaimed"
    },
    {
      workerId: "worker-636-test-renderer-create-native-execution",
      claimId: "publicTestRendererCompatibilityClaimed"
    },
    {
      workerId: "worker-644-dom-checkbox-change-restore-execution",
      claimId: "publicControlledInputCompatibilityClaimed"
    },
    {
      workerId: "worker-648-hydration-claim-then-replay-execution",
      claimId: "publicHydrationCompatibilityClaimed"
    },
    {
      workerId: "worker-650-resource-stylesheet-commit-load-transition",
      claimId: "publicResourceCompatibilityClaimed"
    },
    {
      workerId: "worker-652-form-action-submit-reset-execution",
      claimId: "publicFormCompatibilityClaimed"
    },
    {
      workerId: "worker-653-scheduler-mock-act-flush-all-execution",
      claimId: "publicSchedulerCompatibilityClaimed"
    }
  ];

  for (const { workerId, claimId } of promotionCases) {
    const gate = evaluatePrivateAdmission625654Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_625_654_VIOLATION_STATUS);
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
