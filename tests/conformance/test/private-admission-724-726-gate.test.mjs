import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_724_726_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_724_726_GATE_STATUS,
  PRIVATE_ADMISSION_724_726_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_724_726_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_724_726_ROWS,
  PRIVATE_ADMISSION_724_726_SKIPPED_ROWS,
  PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_724_726_VIOLATION_STATUS,
  PRIVATE_ADMISSION_724_726_WORKERS,
  evaluatePrivateAdmission724726Gate
} from "../src/private-admission-724-726-gate.mjs";

const expected724726Workers = [
  "worker-725-test-renderer-update-serialization-finished-work-identity",
  "worker-726-test-renderer-update-native-serialization-identity-admission"
];

const expected724726SkippedWorkers = [
  "worker-724-package-private-admission-audit-722-723"
];

const expectedPublicCompatibilityClaims = [
  "publicTestRendererCompatibilityClaimed",
  "publicTestRendererSerializationCompatibilityClaimed",
  "publicTestRendererToJSONCompatibilityClaimed",
  "publicTestRendererToTreeCompatibilityClaimed",
  "publicTestRendererRootCompatibilityClaimed",
  "publicTestRendererUpdateCompatibilityClaimed",
  "publicTestRendererTestInstanceCompatibilityClaimed",
  "publicTestRendererNativeAddonLoadingCompatibilityClaimed",
  "publicTestRendererNativeAddonExecutionCompatibilityClaimed",
  "publicTestRendererNativeBridgeCompatibilityClaimed",
  "publicTestRendererNativeBridgeExecutionClaimed",
  "publicActCompatibilityClaimed",
  "publicTestRendererRootRoutingCompatibilityClaimed",
  "publicTestRendererUpdateNativeSerializationCompatibilityClaimed",
  "publicTestRendererUnmountNativeSerializationCompatibilityClaimed",
  "publicTestRendererMultichildSerializationCompatibilityClaimed",
  "publicTestRendererUnmountIdentityAdmissionClaimed",
  "publicTestRendererMultichildSiblingIdentityAdmissionClaimed",
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
  "test-renderer-public-serialization",
  "test-renderer-to-json",
  "test-renderer-to-tree",
  "test-renderer-root",
  "test-renderer-update",
  "test-renderer-testinstance",
  "test-renderer-native-addon-loading",
  "test-renderer-native-addon-execution",
  "test-renderer-native-bridge",
  "test-renderer-native-bridge-execution",
  "act",
  "test-renderer-root-routing",
  "test-renderer-update-native-serialization",
  "test-renderer-unmount-native-serialization",
  "test-renderer-multichild-serialization",
  "test-renderer-unmount-identity-admission",
  "test-renderer-multichild-sibling-identity-admission",
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

test("private admission 724-726 manifest records one skipped meta row and two accepted diagnostics", () => {
  assert.deepEqual(PRIVATE_ADMISSION_724_726_WORKERS, expected724726Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_724_726_ROWS.map((row) => row.workerId),
    expected724726Workers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS,
    expected724726SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_724_726_SKIPPED_ROWS.map((row) => row.workerId),
    expected724726SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_724_726_PUBLIC_COMPATIBILITY_CLAIMS,
    expectedPublicCompatibilityClaims
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_724_726_BLOCKED_SURFACES,
    expectedBlockedSurfaces
  );
  assert.equal(PRIVATE_ADMISSION_724_726_ROWS.length, 2);
  assert.equal(PRIVATE_ADMISSION_724_726_SKIPPED_ROWS.length, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_724_726_WORKERS).size, 2);
  assert.equal(new Set(PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS).size, 1);
  assert.equal(
    PRIVATE_ADMISSION_724_726_WORKERS.includes(
      "worker-724-package-private-admission-audit-722-723"
    ),
    false
  );
});

test("private admission 724-726 gate recognizes accepted diagnostics without public compatibility", () => {
  const gate = evaluatePrivateAdmission724726Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_724_726_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_724_726_WORKERS);
  assert.deepEqual(gate.skippedWorkers, PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_724_726_WORKERS);
  assert.deepEqual(
    gate.recognizedSkippedWorkerIds,
    PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS
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
    PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS
  );

  const updateIdentityRow =
    gate.rowsByWorker[
      "worker-725-test-renderer-update-serialization-finished-work-identity"
    ];
  assert.equal(updateIdentityRow.privateAdmission, "accepted-private-diagnostic");
  assert.equal(updateIdentityRow.sourceQueue, "724-726");
  assert.equal(
    updateIdentityRow.primaryCompatibilityArea,
    "test-renderer-update-serialization-finished-work-identity"
  );
  assert.equal(updateIdentityRow.runtimeCapabilityAdded, true);
  assert.equal(updateIdentityRow.recognized, true);
  assert.equal(updateIdentityRow.evidenceRecognized, true);
  assert.equal(updateIdentityRow.compatibilityClaimed, false);
  assert.equal(updateIdentityRow.promotion, "rejected");
  assert.equal(updateIdentityRow.privateEvidenceOnly, true);
  assert.deepEqual(updateIdentityRow.acceptedDiagnosticIds, [
    "test-renderer-update-serialization-finished-work-identity",
    "private-update-tojson-totree-finished-work-identity-validation"
  ]);
  assert.deepEqual(updateIdentityRow.dependencyWorkerIds, [
    "worker-720-test-renderer-serialization-finished-work-identity"
  ]);
  assert.deepEqual(updateIdentityRow.dependencyWorkerIds, [
    ...PRIVATE_ADMISSION_724_726_REQUIRED_DEPENDENCIES[
      updateIdentityRow.workerId
    ]
  ]);
  assert.deepEqual(updateIdentityRow.dependencyDiagnosticIds, [
    "test-renderer-serialization-finished-work-identity",
    "private-tojson-totree-finished-work-identity-validation"
  ]);
  assert.deepEqual(
    updateIdentityRow.evidence.map((evidenceRow) => evidenceRow.role),
    [
      "worker-720-base-finished-work-identity-dependency",
      "worker-725-update-finished-work-identity-report"
    ]
  );

  const updateNativeAdmissionRow =
    gate.rowsByWorker[
      "worker-726-test-renderer-update-native-serialization-identity-admission"
    ];
  assert.equal(
    updateNativeAdmissionRow.privateAdmission,
    "accepted-private-diagnostic"
  );
  assert.equal(updateNativeAdmissionRow.sourceQueue, "724-726");
  assert.equal(
    updateNativeAdmissionRow.primaryCompatibilityArea,
    "test-renderer-update-native-serialization-identity-admission"
  );
  assert.equal(updateNativeAdmissionRow.runtimeCapabilityAdded, true);
  assert.equal(updateNativeAdmissionRow.recognized, true);
  assert.equal(updateNativeAdmissionRow.evidenceRecognized, true);
  assert.equal(updateNativeAdmissionRow.compatibilityClaimed, false);
  assert.equal(updateNativeAdmissionRow.promotion, "rejected");
  assert.equal(updateNativeAdmissionRow.privateEvidenceOnly, true);
  assert.deepEqual(updateNativeAdmissionRow.acceptedDiagnosticIds, [
    "test-renderer-update-native-serialization-identity-admission",
    "private-update-tojson-totree-native-diagnostic-admission"
  ]);
  assert.deepEqual(updateNativeAdmissionRow.dependencyWorkerIds, [
    "worker-725-test-renderer-update-serialization-finished-work-identity"
  ]);
  assert.deepEqual(updateNativeAdmissionRow.dependencyWorkerIds, [
    ...PRIVATE_ADMISSION_724_726_REQUIRED_DEPENDENCIES[
      updateNativeAdmissionRow.workerId
    ]
  ]);
  assert.deepEqual(updateNativeAdmissionRow.dependencyDiagnosticIds, [
    "test-renderer-update-serialization-finished-work-identity",
    "private-update-tojson-totree-finished-work-identity-validation"
  ]);
  assert.deepEqual(
    updateNativeAdmissionRow.evidence.map((evidenceRow) => evidenceRow.role),
    [
      "worker-725-update-finished-work-identity-dependency",
      "worker-726-update-native-identity-admission-report"
    ]
  );

  for (const row of gate.rows) {
    assert.deepEqual(
      row.blockedPublicCompatibilitySurfaces,
      PRIVATE_ADMISSION_724_726_BLOCKED_SURFACES,
      row.workerId
    );
    assert.deepEqual(
      Object.keys(row.publicCompatibilityClaims).sort(),
      [...PRIVATE_ADMISSION_724_726_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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
    assert.deepEqual(row.publicCompatibilityViolations, [], row.workerId);

    for (const evidenceRow of row.evidence) {
      assert.equal(evidenceRow.recognized, true, evidenceRow.role);
      assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    }
  }
});

test("private admission 724-726 gate recognizes Worker 724 as non-runtime skip meta", () => {
  const gate = evaluatePrivateAdmission724726Gate();
  const row =
    gate.skippedRowsByWorker[
      "worker-724-package-private-admission-audit-722-723"
    ];

  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "724-726");
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
    PRIVATE_ADMISSION_724_726_BLOCKED_SURFACES
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_724_726_PUBLIC_COMPATIBILITY_CLAIMS].sort()
  );

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
  }
});

test("private admission 724-726 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission724726Gate({
    rowOverrides: {
      "worker-725-test-renderer-update-serialization-finished-work-identity": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_724_726_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: [
        "worker-725-test-renderer-update-serialization-finished-work-identity"
      ]
    }
  ]);
});

test("private admission 724-726 gate rejects stale or meta worker ids in accepted rows", () => {
  const staleMetaWorkerId =
    "worker-724-package-private-admission-audit-722-723";
  const gate = evaluatePrivateAdmission724726Gate({
    rowOverrides: {
      "worker-725-test-renderer-update-serialization-finished-work-identity": {
        workerId: staleMetaWorkerId
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_724_726_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-worker-manifest-mismatch",
      missingWorkerIds: [
        "worker-725-test-renderer-update-serialization-finished-work-identity"
      ],
      unexpectedWorkerIds: [staleMetaWorkerId],
      duplicateWorkerIds: []
    }
  ]);
});

test("private admission 724-726 gate rejects skip meta rows that claim runtime capability", () => {
  const gate = evaluatePrivateAdmission724726Gate({
    skippedRowOverrides: {
      "worker-724-package-private-admission-audit-722-723": {
        runtimeCapabilityAdded: true,
        acceptedDiagnosticIds: ["unexpected-runtime-diagnostic"]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_724_726_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "skip-meta-row-claimed-runtime-capability",
      workerIds: ["worker-724-package-private-admission-audit-722-723"]
    }
  ]);
});

test("private admission 724-726 gate rejects missing dependency metadata", () => {
  const gate = evaluatePrivateAdmission724726Gate({
    rowOverrides: {
      "worker-725-test-renderer-update-serialization-finished-work-identity": {
        dependencyWorkerIds: []
      },
      "worker-726-test-renderer-update-native-serialization-identity-admission":
        {
          dependencyWorkerIds: []
        }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_724_726_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-mismatch",
      rows: [
        {
          workerId:
            "worker-725-test-renderer-update-serialization-finished-work-identity",
          expectedDependencyWorkerIds: [
            "worker-720-test-renderer-serialization-finished-work-identity"
          ],
          actualDependencyWorkerIds: []
        },
        {
          workerId:
            "worker-726-test-renderer-update-native-serialization-identity-admission",
          expectedDependencyWorkerIds: [
            "worker-725-test-renderer-update-serialization-finished-work-identity"
          ],
          actualDependencyWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 724-726 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission724726Gate({
    rowOverrides: {
      "worker-726-test-renderer-update-native-serialization-identity-admission":
        {
          compatibilityClaimed: true
        }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_724_726_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: [
        "worker-726-test-renderer-update-native-serialization-identity-admission"
      ]
    }
  ]);
});

test("private admission 724-726 gate rejects public surface promotion leaks", () => {
  const workerId =
    "worker-726-test-renderer-update-native-serialization-identity-admission";

  for (const claimId of expectedPublicCompatibilityClaims) {
    const gate = evaluatePrivateAdmission724726Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_724_726_VIOLATION_STATUS);
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
