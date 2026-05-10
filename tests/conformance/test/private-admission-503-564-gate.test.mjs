import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_503_533_ROWS,
  PRIVATE_ADMISSION_503_533_WORKERS,
  PRIVATE_ADMISSION_503_564_GATE_STATUS,
  PRIVATE_ADMISSION_503_564_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_503_564_ROWS,
  PRIVATE_ADMISSION_503_564_VIOLATION_STATUS,
  PRIVATE_ADMISSION_503_564_WORKERS,
  PRIVATE_ADMISSION_534_564_ROWS,
  PRIVATE_ADMISSION_534_564_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_534_564_WORKERS,
  evaluatePrivateAdmission503564Gate
} from "../src/private-admission-503-564-gate.mjs";
import {
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";

const expected534564Workers = [
  "worker-534-root-work-loop-finished-work-commit-handoff",
  "worker-535-lane-priority-root-scheduling-canary",
  "worker-536-function-component-use-callback-gate",
  "worker-537-layout-effect-metadata-gate",
  "worker-538-context-provider-update-lane-gate",
  "worker-539-test-renderer-live-rust-root-create-preflight",
  "worker-540-test-renderer-tojson-update-unmount-refresh",
  "worker-541-test-renderer-act-nested-scope-blockers",
  "worker-542-react-dom-facade-nested-host-output-update",
  "worker-543-dom-input-change-event-extraction-preflight",
  "worker-544-dom-focus-blur-event-blocker-gate",
  "worker-545-hydration-form-resource-boundary-refresh",
  "worker-546-resource-script-module-preinit-gate",
  "worker-547-controlled-restore-queue-write-execution-gate",
  "worker-548-controlled-restore-flush-execution-blocker",
  "worker-549-form-action-formdata-blocker-diagnostic",
  "worker-550-scheduler-mock-frame-budget-gate",
  "worker-551-scheduler-post-task-delay-abort-refresh",
  "worker-552-native-json-batch-response-sequence",
  "worker-553-package-surface-private-audit-503-533",
  "worker-554-benchmark-private-canaries-503-533",
  "worker-555-conformance-public-facade-refresh-503-533",
  "worker-556-root-render-e2e-private-metadata-503-533",
  "worker-557-react-hook-dispatcher-transition-blockers",
  "worker-558-suspense-thenable-ping-blocker-refresh",
  "worker-559-offscreen-visibility-transition-blocker",
  "worker-560-portal-nested-event-propagation-refresh",
  "worker-561-dom-style-object-diff-private-gate",
  "worker-562-dom-dangerous-html-text-reset-gate",
  "worker-564-react-clone-element-child-array-freeze"
];

const expected503533Workers =
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.map(
    (row) => row.id
  );

test("private admission 503-564 manifest preserves 503-533 rows and appends accepted 534-564 diagnostics", () => {
  assert.deepEqual(PRIVATE_ADMISSION_503_533_WORKERS, expected503533Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_503_533_ROWS.map((row) => row.workerId),
    expected503533Workers
  );
  assert.deepEqual(PRIVATE_ADMISSION_534_564_WORKERS, expected534564Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_534_564_ROWS.map((row) => row.workerId),
    expected534564Workers
  );
  assert.deepEqual(PRIVATE_ADMISSION_503_564_WORKERS, [
    ...expected503533Workers,
    ...expected534564Workers
  ]);
  assert.deepEqual(PRIVATE_ADMISSION_534_564_SKIPPED_WORKERS, [
    "worker-563-master-docs-accepted-history-compaction"
  ]);
  assert.equal(PRIVATE_ADMISSION_503_533_ROWS.length, 31);
  assert.equal(PRIVATE_ADMISSION_534_564_ROWS.length, 30);
  assert.equal(PRIVATE_ADMISSION_503_564_ROWS.length, 61);
  assert.equal(new Set(PRIVATE_ADMISSION_503_564_WORKERS).size, 61);
});

test("private admission 503-564 gate recognizes accepted diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission503564Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_503_564_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_503_564_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_503_564_WORKERS);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(
    gate.manifest.skippedWorkerIds,
    PRIVATE_ADMISSION_534_564_SKIPPED_WORKERS
  );

  for (const row of gate.rows) {
    assert.equal(row.privateAdmission, "accepted-private-diagnostic", row.workerId);
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
      [...PRIVATE_ADMISSION_503_564_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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

test("private admission 503-564 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission503564Gate({
    rowOverrides: {
      "worker-534-root-work-loop-finished-work-commit-handoff": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_503_564_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: ["worker-534-root-work-loop-finished-work-commit-handoff"]
    }
  ]);
});

test("private admission 503-564 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission503564Gate({
    rowOverrides: {
      "worker-542-react-dom-facade-nested-host-output-update": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_503_564_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: ["worker-542-react-dom-facade-nested-host-output-update"]
    }
  ]);
});

test("private admission 503-564 gate rejects public surface promotion leaks", () => {
  const promotionCases = [
    {
      workerId: "worker-542-react-dom-facade-nested-host-output-update",
      claimId: "publicRootCompatibilitySurface"
    },
    {
      workerId: "worker-534-root-work-loop-finished-work-commit-handoff",
      claimId: "publicRenderCompatibilityClaimed"
    },
    {
      workerId: "worker-541-test-renderer-act-nested-scope-blockers",
      claimId: "publicActCompatibilityClaimed"
    },
    {
      workerId: "worker-546-resource-script-module-preinit-gate",
      claimId: "publicResourceCompatibilityClaimed"
    },
    {
      workerId: "worker-549-form-action-formdata-blocker-diagnostic",
      claimId: "publicFormCompatibilityClaimed"
    },
    {
      workerId: "worker-547-controlled-restore-queue-write-execution-gate",
      claimId: "publicControlledInputCompatibilityClaimed"
    },
    {
      workerId: "worker-539-test-renderer-live-rust-root-create-preflight",
      claimId: "publicTestRendererCompatibilityClaimed"
    }
  ];

  for (const { workerId, claimId } of promotionCases) {
    const gate = evaluatePrivateAdmission503564Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_503_564_VIOLATION_STATUS);
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
