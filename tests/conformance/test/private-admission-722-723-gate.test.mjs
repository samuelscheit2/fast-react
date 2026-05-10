import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_722_723_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_722_723_GATE_STATUS,
  PRIVATE_ADMISSION_722_723_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_722_723_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_722_723_ROWS,
  PRIVATE_ADMISSION_722_723_SKIPPED_ROWS,
  PRIVATE_ADMISSION_722_723_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_722_723_VIOLATION_STATUS,
  PRIVATE_ADMISSION_722_723_WORKERS,
  evaluatePrivateAdmission722723Gate
} from "../src/private-admission-722-723-gate.mjs";

const expected722723Workers = [
  "worker-723-test-renderer-native-serialization-identity-gate"
];

const expected722723SkippedWorkers = [
  "worker-722-package-private-admission-audit-715-721"
];

const expectedPublicCompatibilityClaims = [
  "publicTestRendererCompatibilityClaimed",
  "publicTestRendererToJSONCompatibilityClaimed",
  "publicTestRendererToTreeCompatibilityClaimed",
  "publicTestRendererRootCompatibilityClaimed",
  "publicTestRendererTestInstanceCompatibilityClaimed",
  "publicTestRendererNativeBridgeCompatibilityClaimed",
  "publicTestRendererNativeBridgeExecutionClaimed",
  "publicTestRendererNativeAddonExecutionClaimed",
  "publicActCompatibilityClaimed",
  "publicTestRendererRootRoutingCompatibilityClaimed",
  "publicTestRendererUpdateNativeSerializationCompatibilityClaimed",
  "publicTestRendererUnmountNativeSerializationCompatibilityClaimed",
  "publicTestRendererMultichildSerializationCompatibilityClaimed",
  "publicReactDomCompatibilityClaimed",
  "publicReactDomRootCompatibilityClaimed",
  "publicSchedulerCompatibilityClaimed",
  "publicHydrationCompatibilityClaimed",
  "publicEventCompatibilityClaimed",
  "publicRefCompatibilityClaimed",
  "publicResourceCompatibilityClaimed",
  "publicFormCompatibilityClaimed",
  "publicControlledInputCompatibilityClaimed"
];

const expectedBlockedSurfaces = [
  "test-renderer",
  "test-renderer-to-json",
  "test-renderer-to-tree",
  "test-renderer-root",
  "test-renderer-testinstance",
  "test-renderer-native-bridge",
  "test-renderer-native-addon-execution",
  "act",
  "test-renderer-root-routing",
  "test-renderer-update-native-serialization",
  "test-renderer-unmount-native-serialization",
  "test-renderer-multichild-serialization",
  "react-dom",
  "react-dom-root",
  "scheduler",
  "hydration",
  "events",
  "refs",
  "resources",
  "forms",
  "controlled-inputs"
];

test("private admission 722-723 manifest records one skipped meta row and one accepted diagnostic", () => {
  assert.deepEqual(PRIVATE_ADMISSION_722_723_WORKERS, expected722723Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_722_723_ROWS.map((row) => row.workerId),
    expected722723Workers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_722_723_SKIPPED_WORKERS,
    expected722723SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_722_723_SKIPPED_ROWS.map((row) => row.workerId),
    expected722723SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_722_723_PUBLIC_COMPATIBILITY_CLAIMS,
    expectedPublicCompatibilityClaims
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_722_723_BLOCKED_SURFACES,
    expectedBlockedSurfaces
  );
  assert.equal(PRIVATE_ADMISSION_722_723_ROWS.length, 1);
  assert.equal(PRIVATE_ADMISSION_722_723_SKIPPED_ROWS.length, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_722_723_WORKERS).size, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_722_723_SKIPPED_WORKERS).size, 1);
  assert.equal(
    PRIVATE_ADMISSION_722_723_WORKERS.includes(
      "worker-722-package-private-admission-audit-715-721"
    ),
    false
  );
});

test("private admission 722-723 gate recognizes accepted diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission722723Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_722_723_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_722_723_WORKERS);
  assert.deepEqual(gate.skippedWorkers, PRIVATE_ADMISSION_722_723_SKIPPED_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_722_723_WORKERS);
  assert.deepEqual(
    gate.recognizedSkippedWorkerIds,
    PRIVATE_ADMISSION_722_723_SKIPPED_WORKERS
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
    PRIVATE_ADMISSION_722_723_SKIPPED_WORKERS
  );

  const row =
    gate.rowsByWorker[
      "worker-723-test-renderer-native-serialization-identity-gate"
    ];
  assert.equal(row.privateAdmission, "accepted-private-diagnostic");
  assert.equal(row.sourceQueue, "722-723");
  assert.equal(row.primaryCompatibilityArea, "test-renderer-create-native-serialization");
  assert.equal(row.runtimeCapabilityAdded, true);
  assert.equal(row.recognized, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "rejected");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, [
    "test-renderer-create-native-serialization-finished-work-identity-admission",
    "private-tojson-totree-create-native-diagnostic-admission"
  ]);
  assert.deepEqual(row.dependencyWorkerIds, [
    "worker-720-test-renderer-serialization-finished-work-identity"
  ]);
  assert.deepEqual(row.dependencyWorkerIds, [
    ...PRIVATE_ADMISSION_722_723_REQUIRED_DEPENDENCIES[row.workerId]
  ]);
  assert.deepEqual(row.dependencyDiagnosticIds, [
    "test-renderer-serialization-finished-work-identity",
    "private-tojson-totree-finished-work-identity-validation"
  ]);
  assert.deepEqual(row.evidence.map((evidenceRow) => evidenceRow.role), [
    "worker-720-finished-work-identity-dependency",
    "worker-723-create-path-native-serialization-report"
  ]);
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_722_723_BLOCKED_SURFACES
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_722_723_PUBLIC_COMPATIBILITY_CLAIMS].sort()
  );
  assert.deepEqual(
    Object.values(row.publicCompatibilityClaims),
    Object.values(row.publicCompatibilityClaims).map(() => false)
  );
  assert.deepEqual(row.blockedPublicClaims, Object.keys(row.publicCompatibilityClaims));
  assert.deepEqual(row.publicCompatibilityViolations, []);

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
  }
});

test("private admission 722-723 gate recognizes Worker 722 as non-runtime skip meta", () => {
  const gate = evaluatePrivateAdmission722723Gate();
  const row =
    gate.skippedRowsByWorker[
      "worker-722-package-private-admission-audit-715-721"
    ];

  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "722-723");
  assert.equal(row.runtimeCapabilityAdded, false);
  assert.equal(row.recognized, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "not-applicable");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, []);
  assert.deepEqual(row.dependencyWorkerIds, []);
  assert.deepEqual(row.dependencyDiagnosticIds, []);
  assert.equal(row.skipReason.endsWith("no-new-runtime-capability"), true);
  assert.deepEqual(row.publicCompatibilityViolations, []);
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_722_723_BLOCKED_SURFACES
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_722_723_PUBLIC_COMPATIBILITY_CLAIMS].sort()
  );

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
  }
});

test("private admission 722-723 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission722723Gate({
    rowOverrides: {
      "worker-723-test-renderer-native-serialization-identity-gate": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_722_723_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: [
        "worker-723-test-renderer-native-serialization-identity-gate"
      ]
    }
  ]);
});

test("private admission 722-723 gate rejects stale or meta worker ids in accepted rows", () => {
  const staleMetaWorkerId =
    "worker-722-package-private-admission-audit-715-721";
  const gate = evaluatePrivateAdmission722723Gate({
    rowOverrides: {
      "worker-723-test-renderer-native-serialization-identity-gate": {
        workerId: staleMetaWorkerId
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_722_723_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-worker-manifest-mismatch",
      missingWorkerIds: [
        "worker-723-test-renderer-native-serialization-identity-gate"
      ],
      unexpectedWorkerIds: [staleMetaWorkerId],
      duplicateWorkerIds: []
    }
  ]);
});

test("private admission 722-723 gate rejects skip meta rows that claim runtime capability", () => {
  const gate = evaluatePrivateAdmission722723Gate({
    skippedRowOverrides: {
      "worker-722-package-private-admission-audit-715-721": {
        runtimeCapabilityAdded: true,
        acceptedDiagnosticIds: ["unexpected-runtime-diagnostic"]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_722_723_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "skip-meta-row-claimed-runtime-capability",
      workerIds: ["worker-722-package-private-admission-audit-715-721"]
    }
  ]);
});

test("private admission 722-723 gate rejects missing dependency metadata", () => {
  const gate = evaluatePrivateAdmission722723Gate({
    rowOverrides: {
      "worker-723-test-renderer-native-serialization-identity-gate": {
        dependencyWorkerIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_722_723_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-mismatch",
      rows: [
        {
          workerId: "worker-723-test-renderer-native-serialization-identity-gate",
          expectedDependencyWorkerIds: [
            "worker-720-test-renderer-serialization-finished-work-identity"
          ],
          actualDependencyWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 722-723 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission722723Gate({
    rowOverrides: {
      "worker-723-test-renderer-native-serialization-identity-gate": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_722_723_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: [
        "worker-723-test-renderer-native-serialization-identity-gate"
      ]
    }
  ]);
});

test("private admission 722-723 gate rejects public surface promotion leaks", () => {
  const workerId =
    "worker-723-test-renderer-native-serialization-identity-gate";

  for (const claimId of expectedPublicCompatibilityClaims) {
    const gate = evaluatePrivateAdmission722723Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_722_723_VIOLATION_STATUS);
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
