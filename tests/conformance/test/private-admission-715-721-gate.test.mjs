import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_715_721_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_715_721_GATE_STATUS,
  PRIVATE_ADMISSION_715_721_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_715_721_ROWS,
  PRIVATE_ADMISSION_715_721_SKIPPED_ROWS,
  PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_715_721_VIOLATION_STATUS,
  PRIVATE_ADMISSION_715_721_WORKERS,
  evaluatePrivateAdmission715721Gate
} from "../src/private-admission-715-721-gate.mjs";

const expected715721Workers = [
  "worker-717-root-work-loop-finished-work-commit-entrypoint",
  "worker-718-sync-flush-root-scheduler-finished-work-handoff",
  "worker-719-function-effect-destroy-handle-persistence",
  "worker-720-test-renderer-serialization-finished-work-identity",
  "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate"
];

const expected715721SkippedWorkers = [
  "worker-715-clippy-gate-refresh",
  "worker-716-package-private-admission-audit-685-714"
];

test("private admission 715-721 manifest records accepted private diagnostics and skip meta rows", () => {
  assert.deepEqual(PRIVATE_ADMISSION_715_721_WORKERS, expected715721Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_715_721_ROWS.map((row) => row.workerId),
    expected715721Workers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS,
    expected715721SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_715_721_SKIPPED_ROWS.map((row) => row.workerId),
    expected715721SkippedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_715_721_ROWS.length, 5);
  assert.equal(PRIVATE_ADMISSION_715_721_SKIPPED_ROWS.length, 2);
  assert.equal(new Set(PRIVATE_ADMISSION_715_721_WORKERS).size, 5);
  assert.equal(new Set(PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS).size, 2);

  for (const skippedWorkerId of expected715721SkippedWorkers) {
    assert.equal(PRIVATE_ADMISSION_715_721_WORKERS.includes(skippedWorkerId), false);
  }
});

test("private admission 715-721 gate recognizes accepted diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission715721Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_715_721_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_715_721_WORKERS);
  assert.deepEqual(gate.skippedWorkers, PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_715_721_WORKERS);
  assert.deepEqual(
    gate.recognizedSkippedWorkerIds,
    PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS
  );
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(gate.manifest.missingSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateSkippedWorkerIds, []);
  assert.deepEqual(
    gate.manifest.skippedWorkerIds,
    PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS
  );

  for (const row of gate.rows) {
    assert.equal(row.privateAdmission, "accepted-private-diagnostic", row.workerId);
    assert.equal(row.sourceQueue, "715-721", row.workerId);
    assert.equal(row.runtimeCapabilityAdded, true, row.workerId);
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
      PRIVATE_ADMISSION_715_721_BLOCKED_SURFACES,
      row.workerId
    );
    assert.deepEqual(
      Object.keys(row.publicCompatibilityClaims).sort(),
      [...PRIVATE_ADMISSION_715_721_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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

test("private admission 715-721 gate recognizes skip meta rows as non-runtime work", () => {
  const gate = evaluatePrivateAdmission715721Gate();

  for (const row of gate.skippedRows) {
    assert.equal(row.privateAdmission, "skipped-meta", row.workerId);
    assert.equal(row.sourceQueue, "715-721", row.workerId);
    assert.equal(row.runtimeCapabilityAdded, false, row.workerId);
    assert.equal(row.recognized, true, row.workerId);
    assert.equal(row.evidenceRecognized, true, row.workerId);
    assert.equal(row.compatibilityClaimed, false, row.workerId);
    assert.equal(row.promotion, "not-applicable", row.workerId);
    assert.equal(row.privateEvidenceOnly, true, row.workerId);
    assert.deepEqual(row.acceptedDiagnosticIds, [], row.workerId);
    assert.ok(row.skipReason.endsWith("no-new-runtime-capability"), row.workerId);
    assert.deepEqual(row.publicCompatibilityViolations, [], row.workerId);
    assert.deepEqual(
      row.blockedPublicCompatibilitySurfaces,
      PRIVATE_ADMISSION_715_721_BLOCKED_SURFACES,
      row.workerId
    );
    assert.deepEqual(
      Object.keys(row.publicCompatibilityClaims).sort(),
      [...PRIVATE_ADMISSION_715_721_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
      row.workerId
    );

    for (const evidenceRow of row.evidence) {
      assert.equal(evidenceRow.recognized, true, `${row.workerId} ${evidenceRow.path}`);
      assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    }
  }
});

test("private admission 715-721 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission715721Gate({
    rowOverrides: {
      "worker-717-root-work-loop-finished-work-commit-entrypoint": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_715_721_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: ["worker-717-root-work-loop-finished-work-commit-entrypoint"]
    }
  ]);
});

test("private admission 715-721 gate rejects stale or meta worker ids in accepted rows", () => {
  const staleMetaWorkerId =
    "worker-716-package-private-admission-audit-685-714";
  const gate = evaluatePrivateAdmission715721Gate({
    rowOverrides: {
      "worker-718-sync-flush-root-scheduler-finished-work-handoff": {
        workerId: staleMetaWorkerId
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_715_721_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-worker-manifest-mismatch",
      missingWorkerIds: [
        "worker-718-sync-flush-root-scheduler-finished-work-handoff"
      ],
      unexpectedWorkerIds: [staleMetaWorkerId],
      duplicateWorkerIds: []
    }
  ]);
});

test("private admission 715-721 gate rejects skip meta rows that claim runtime capability", () => {
  const gate = evaluatePrivateAdmission715721Gate({
    skippedRowOverrides: {
      "worker-715-clippy-gate-refresh": {
        runtimeCapabilityAdded: true,
        acceptedDiagnosticIds: ["unexpected-runtime-diagnostic"]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_715_721_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "skip-meta-row-claimed-runtime-capability",
      workerIds: ["worker-715-clippy-gate-refresh"]
    }
  ]);
});

test("private admission 715-721 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission715721Gate({
    rowOverrides: {
      "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_715_721_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: [
        "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate"
      ]
    }
  ]);
});

test("private admission 715-721 gate rejects public surface promotion leaks", () => {
  const promotionCases = [
    {
      workerId: "worker-717-root-work-loop-finished-work-commit-entrypoint",
      claimId: "publicRootRenderCompatibilityClaimed"
    },
    {
      workerId: "worker-717-root-work-loop-finished-work-commit-entrypoint",
      claimId: "publicRootUpdateCompatibilityClaimed"
    },
    {
      workerId: "worker-717-root-work-loop-finished-work-commit-entrypoint",
      claimId: "publicRootUnmountCompatibilityClaimed"
    },
    {
      workerId: "worker-718-sync-flush-root-scheduler-finished-work-handoff",
      claimId: "publicFlushSyncCompatibilityClaimed"
    },
    {
      workerId: "worker-718-sync-flush-root-scheduler-finished-work-handoff",
      claimId: "publicActCompatibilityClaimed"
    },
    {
      workerId: "worker-718-sync-flush-root-scheduler-finished-work-handoff",
      claimId: "publicSchedulerCompatibilityClaimed"
    },
    {
      workerId: "worker-719-function-effect-destroy-handle-persistence",
      claimId: "publicHookCompatibilityClaimed"
    },
    {
      workerId: "worker-719-function-effect-destroy-handle-persistence",
      claimId: "publicEffectCompatibilityClaimed"
    },
    {
      workerId: "worker-720-test-renderer-serialization-finished-work-identity",
      claimId: "publicTestRendererCompatibilityClaimed"
    },
    {
      workerId: "worker-720-test-renderer-serialization-finished-work-identity",
      claimId: "publicTestRendererSerializationCompatibilityClaimed"
    },
    {
      workerId: "worker-720-test-renderer-serialization-finished-work-identity",
      claimId: "publicTestRendererRootCompatibilityClaimed"
    },
    {
      workerId: "worker-720-test-renderer-serialization-finished-work-identity",
      claimId: "publicTestRendererTestInstanceCompatibilityClaimed"
    },
    {
      workerId: "worker-720-test-renderer-serialization-finished-work-identity",
      claimId: "publicTestRendererNativeBridgeCompatibilityClaimed"
    },
    {
      workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
      claimId: "publicBrowserDomCompatibilityClaimed"
    },
    {
      workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
      claimId: "publicTextContentCompatibilityClaimed"
    },
    {
      workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
      claimId: "publicDangerousHtmlCompatibilityClaimed"
    },
    {
      workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
      claimId: "publicHydrationCompatibilityClaimed"
    },
    {
      workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
      claimId: "publicEventCompatibilityClaimed"
    },
    {
      workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
      claimId: "publicRefCompatibilityClaimed"
    },
    {
      workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
      claimId: "publicResourceCompatibilityClaimed"
    },
    {
      workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
      claimId: "publicFormCompatibilityClaimed"
    },
    {
      workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
      claimId: "publicControlledInputCompatibilityClaimed"
    }
  ];

  for (const { workerId, claimId } of promotionCases) {
    const gate = evaluatePrivateAdmission715721Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_715_721_VIOLATION_STATUS);
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
