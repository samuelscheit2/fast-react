import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_473_502_GATE_STATUS,
  PRIVATE_ADMISSION_473_502_ROWS,
  PRIVATE_ADMISSION_473_502_VIOLATION_STATUS,
  PRIVATE_ADMISSION_473_502_WORKERS,
  evaluatePrivateAdmission473502Gate
} from "../src/private-admission-473-502-gate.mjs";

const expectedWorkers = [
  "worker-473-test-renderer-act-passive-effect-drain",
  "worker-474-passive-effect-mount-unmount-execution-gate",
  "worker-475-passive-effect-error-routing-gate",
  "worker-476-root-commit-effect-ordering-canary",
  "worker-477-function-component-use-memo-bailout-gate",
  "worker-478-function-component-use-effect-update-gate",
  "worker-479-context-multi-consumer-propagation-gate",
  "worker-480-suspense-offscreen-blocker-diagnostics",
  "worker-481-deletion-passive-ref-cleanup-order-gate",
  "worker-482-test-renderer-act-scheduler-flush-gate",
  "worker-483-test-renderer-flush-sync-act-routing-gate",
  "worker-484-test-instance-find-by-private-query-gate",
  "worker-485-test-renderer-totree-multichild-gate",
  "worker-486-react-dom-root-render-private-host-output",
  "worker-487-dom-event-prevent-default-gate",
  "worker-488-dom-event-error-routing-gate",
  "worker-489-hydration-event-replay-ownership-gate",
  "worker-490-controlled-checkbox-radio-restore-gate",
  "worker-491-resource-stylesheet-precedence-gate",
  "worker-492-form-submit-action-metadata-gate",
  "worker-493-scheduler-mock-yield-paint-gate",
  "worker-494-scheduler-post-task-abort-diagnostics",
  "worker-495-native-batched-json-transport-gate",
  "worker-496-native-cross-environment-teardown-gate",
  "worker-497-package-surface-private-facade-audit",
  "worker-498-benchmark-act-passive-timing-canaries",
  "worker-499-root-render-e2e-act-passive-admission",
  "worker-500-conformance-act-passive-local-gate-refresh",
  "worker-501-root-commit-callback-lane-order-gate",
  "worker-502-react-dom-test-utils-act-passive-gate"
];

test("private admission 473-502 manifest covers every accepted worker in order", () => {
  assert.deepEqual(PRIVATE_ADMISSION_473_502_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_473_502_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(new Set(PRIVATE_ADMISSION_473_502_WORKERS).size, 30);
});

test("private admission 473-502 gate recognizes local evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission473502Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_473_502_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);

  for (const row of gate.rows) {
    assert.equal(row.privateAdmission, "accepted-private-diagnostic", row.workerId);
    assert.equal(row.recognized, true, row.workerId);
    assert.equal(row.evidenceRecognized, true, row.workerId);
    assert.equal(row.compatibilityClaimed, false, row.workerId);
    assert.ok(row.acceptedDiagnosticIds.length > 0, row.workerId);
    assert.ok(row.evidence.length > 0, row.workerId);
    assert.deepEqual(row.publicCompatibilityViolations, [], row.workerId);
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

test("private admission 473-502 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission473502Gate({
    rowOverrides: {
      "worker-476-root-commit-effect-ordering-canary": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_473_502_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: ["worker-476-root-commit-effect-ordering-canary"]
    }
  ]);
});

test("private admission 473-502 gate rejects compatibility and public claim leaks", () => {
  const gate = evaluatePrivateAdmission473502Gate({
    rowOverrides: {
      "worker-486-react-dom-root-render-private-host-output": {
        compatibilityClaimed: true,
        publicCompatibilityClaims: {
          publicRootCompatibilitySurface: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_473_502_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: ["worker-486-react-dom-root-render-private-host-output"]
    },
    {
      id: "public-compatibility-claim-detected",
      claimIds: [
        "worker-486-react-dom-root-render-private-host-output.publicRootCompatibilitySurface"
      ]
    }
  ]);
});
