import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_727_728_GATE_STATUS,
  PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT,
  PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
  PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS,
  PRIVATE_ADMISSION_727_728_ROWS,
  PRIVATE_ADMISSION_727_728_SKIPPED_ROWS,
  PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
  PRIVATE_ADMISSION_727_728_WORKERS,
  evaluatePrivateAdmission727728Gate
} from "../src/private-admission-727-728-gate.mjs";

const expected727728Workers = [
  "worker-728-test-renderer-unmount-native-identity-argument-guard"
];

const expected727728SkippedWorkers = [
  "worker-727-package-private-admission-audit-724-726"
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
  "publicTestRendererUnmountIdentityAdmissionClaimed",
  "publicTestRendererMultichildSerializationCompatibilityClaimed",
  "publicTestRendererMultichildSiblingSerializationCompatibilityClaimed",
  "publicTestRendererMultichildIdentityAdmissionClaimed",
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
  "test-renderer-unmount-identity-admission",
  "test-renderer-multichild-serialization",
  "test-renderer-multichild-sibling-serialization",
  "test-renderer-multichild-identity-admission",
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

test("private admission 727-728 manifest records one skipped meta row and one accepted guard", () => {
  assert.deepEqual(PRIVATE_ADMISSION_727_728_WORKERS, expected727728Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_ROWS.map((row) => row.workerId),
    expected727728Workers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
    expected727728SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_SKIPPED_ROWS.map((row) => row.workerId),
    expected727728SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS,
    expectedPublicCompatibilityClaims
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
    expectedBlockedSurfaces
  );
  assert.equal(PRIVATE_ADMISSION_727_728_ROWS.length, 1);
  assert.equal(PRIVATE_ADMISSION_727_728_SKIPPED_ROWS.length, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_727_728_WORKERS).size, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS).size, 1);
  assert.equal(
    PRIVATE_ADMISSION_727_728_WORKERS.includes(
      "worker-727-package-private-admission-audit-724-726"
    ),
    false
  );
});

test("private admission 727-728 gate recognizes the unmount identity argument guard without public compatibility", () => {
  const gate = evaluatePrivateAdmission727728Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.blockerContextRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_727_728_WORKERS);
  assert.deepEqual(gate.skippedWorkers, PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_727_728_WORKERS);
  assert.deepEqual(
    gate.recognizedSkippedWorkerIds,
    PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS
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
    PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS
  );

  const row =
    gate.rowsByWorker[
      "worker-728-test-renderer-unmount-native-identity-argument-guard"
    ];
  assert.equal(row.privateAdmission, "accepted-private-diagnostic");
  assert.equal(row.sourceQueue, "727-728");
  assert.equal(
    row.primaryCompatibilityArea,
    "test-renderer-unmount-native-identity-argument-guard"
  );
  assert.equal(row.runtimeCapabilityAdded, true);
  assert.equal(row.recognized, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "rejected");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, [
    "test-renderer-unmount-native-identity-argument-guard",
    "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
  ]);
  assert.deepEqual(row.acceptedDiagnosticIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS[row.workerId]
  ]);
  assert.equal(
    row.acceptedDiagnosticIds.includes(
      "test-renderer-unmount-identity-admission"
    ),
    false
  );
  assert.deepEqual(row.dependencyWorkerIds, [
    "worker-612-test-renderer-unmount-native-bridge-admission",
    "worker-638-test-renderer-unmount-native-execution",
    "worker-639-test-renderer-tojson-after-native-execution",
    "worker-667-test-renderer-totree-native-execution"
  ]);
  assert.deepEqual(row.dependencyWorkerIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES[row.workerId]
  ]);
  assert.equal(
    row.dependencyWorkerIds.includes(
      "worker-725-test-renderer-update-serialization-finished-work-identity"
    ),
    false
  );
  assert.equal(
    row.dependencyWorkerIds.includes(
      "worker-726-test-renderer-update-native-serialization-identity-admission"
    ),
    false
  );
  assert.deepEqual(row.dependencyDiagnosticIds, [
    "react-test-renderer-unmount-native-bridge-admission-private-diagnostic",
    "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic",
    "test-renderer-tojson-native-execution-evidence",
    "test-renderer-totree-native-execution"
  ]);
  assert.deepEqual(row.dependencyDiagnosticIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS[row.workerId]
  ]);
  assert.deepEqual(row.blockerContextWorkerIds, [
    "worker-725-test-renderer-update-serialization-finished-work-identity",
    "worker-726-test-renderer-update-native-serialization-identity-admission"
  ]);
  assert.deepEqual(row.blockerContextWorkerIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT[row.workerId]
  ]);
  assert.deepEqual(row.blockerContextDiagnosticIds, [
    "test-renderer-update-serialization-finished-work-identity",
    "test-renderer-update-native-serialization-identity-admission"
  ]);
  assert.deepEqual(row.blockerContextDiagnosticIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
      row.workerId
    ]
  ]);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    [
      "worker-612-unmount-route-admission-dependency",
      "worker-638-unmount-cleanup-handoff-dependency",
      "worker-639-tojson-unmount-empty-host-output-dependency",
      "worker-667-totree-unmount-native-output-dependency",
      "worker-725-update-identity-blocker-context",
      "worker-726-update-native-identity-blocker-context",
      "worker-728-unmount-identity-argument-guard-report",
      "worker-728-unmount-identity-argument-guard-conformance"
    ]
  );

  for (const evaluatedRow of gate.rows) {
    assert.deepEqual(
      evaluatedRow.blockedPublicCompatibilitySurfaces,
      PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
      evaluatedRow.workerId
    );
    assert.deepEqual(
      Object.keys(evaluatedRow.publicCompatibilityClaims).sort(),
      [...PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
      evaluatedRow.workerId
    );
    assert.deepEqual(
      Object.values(evaluatedRow.publicCompatibilityClaims),
      Object.values(evaluatedRow.publicCompatibilityClaims).map(() => false),
      evaluatedRow.workerId
    );
    assert.deepEqual(
      evaluatedRow.blockedPublicClaims,
      Object.keys(evaluatedRow.publicCompatibilityClaims),
      evaluatedRow.workerId
    );
    assert.deepEqual(
      evaluatedRow.publicCompatibilityViolations,
      [],
      evaluatedRow.workerId
    );

    for (const evidenceRow of evaluatedRow.evidence) {
      assert.equal(evidenceRow.recognized, true, evidenceRow.role);
      assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    }
  }
});

test("private admission 727-728 gate recognizes Worker 727 as non-runtime skip meta", () => {
  const gate = evaluatePrivateAdmission727728Gate();
  const row =
    gate.skippedRowsByWorker[
      "worker-727-package-private-admission-audit-724-726"
    ];

  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "727-728");
  assert.equal(row.runtimeCapabilityAdded, false);
  assert.equal(row.recognized, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "not-applicable");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, []);
  assert.deepEqual(row.dependencyWorkerIds, []);
  assert.deepEqual(row.dependencyDiagnosticIds, []);
  assert.deepEqual(row.blockerContextWorkerIds, []);
  assert.deepEqual(row.blockerContextDiagnosticIds, []);
  assert.equal(row.skipReason.endsWith("no-new-runtime-capability"), true);
  assert.deepEqual(row.publicCompatibilityViolations, []);
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS].sort()
  );

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
  }
});

test("private admission 727-728 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        acceptedDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-id-mismatch",
      rows: [
        {
          workerId:
            "worker-728-test-renderer-unmount-native-identity-argument-guard",
          expectedAcceptedDiagnosticIds: [
            "test-renderer-unmount-native-identity-argument-guard",
            "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
          ],
          actualAcceptedDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects unrecognized accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: [
        "worker-728-test-renderer-unmount-native-identity-argument-guard"
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects stale or meta worker ids in accepted rows", () => {
  const staleMetaWorkerId =
    "worker-727-package-private-admission-audit-724-726";
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        workerId: staleMetaWorkerId
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-worker-manifest-mismatch",
      missingWorkerIds: [
        "worker-728-test-renderer-unmount-native-identity-argument-guard"
      ],
      unexpectedWorkerIds: [staleMetaWorkerId],
      duplicateWorkerIds: []
    }
  ]);
});

test("private admission 727-728 gate rejects skip meta rows that claim runtime capability", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    skippedRowOverrides: {
      "worker-727-package-private-admission-audit-724-726": {
        runtimeCapabilityAdded: true,
        acceptedDiagnosticIds: ["unexpected-runtime-diagnostic"]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "skip-meta-row-claimed-runtime-capability",
      workerIds: ["worker-727-package-private-admission-audit-724-726"]
    }
  ]);
});

test("private admission 727-728 gate rejects missing dependency metadata", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        dependencyWorkerIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-mismatch",
      rows: [
        {
          workerId:
            "worker-728-test-renderer-unmount-native-identity-argument-guard",
          expectedDependencyWorkerIds: [
            "worker-612-test-renderer-unmount-native-bridge-admission",
            "worker-638-test-renderer-unmount-native-execution",
            "worker-639-test-renderer-tojson-after-native-execution",
            "worker-667-test-renderer-totree-native-execution"
          ],
          actualDependencyWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects missing dependency diagnostic metadata", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        dependencyDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-diagnostic-mismatch",
      rows: [
        {
          workerId:
            "worker-728-test-renderer-unmount-native-identity-argument-guard",
          expectedDependencyDiagnosticIds: [
            "react-test-renderer-unmount-native-bridge-admission-private-diagnostic",
            "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic",
            "test-renderer-tojson-native-execution-evidence",
            "test-renderer-totree-native-execution"
          ],
          actualDependencyDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects missing blocker context metadata", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        blockerContextWorkerIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-blocker-context-mismatch",
      rows: [
        {
          workerId:
            "worker-728-test-renderer-unmount-native-identity-argument-guard",
          expectedBlockerContextWorkerIds: [
            "worker-725-test-renderer-update-serialization-finished-work-identity",
            "worker-726-test-renderer-update-native-serialization-identity-admission"
          ],
          actualBlockerContextWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects missing blocker context diagnostic metadata", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        blockerContextDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-blocker-context-diagnostic-mismatch",
      rows: [
        {
          workerId:
            "worker-728-test-renderer-unmount-native-identity-argument-guard",
          expectedBlockerContextDiagnosticIds: [
            "test-renderer-update-serialization-finished-work-identity",
            "test-renderer-update-native-serialization-identity-admission"
          ],
          actualBlockerContextDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: [
        "worker-728-test-renderer-unmount-native-identity-argument-guard"
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects blocked public surface drift", () => {
  const workerId =
    "worker-728-test-renderer-unmount-native-identity-argument-guard";
  const skippedWorkerId = "worker-727-package-private-admission-audit-724-726";
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      [workerId]: {
        blockedPublicCompatibilitySurfaces: []
      }
    },
    skippedRowOverrides: {
      [skippedWorkerId]: {
        blockedPublicCompatibilitySurfaces: [
          "test-renderer",
          "unexpected-public-surface"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-public-compatibility-surface-mismatch",
      rows: [
        {
          workerId,
          expectedBlockedPublicCompatibilitySurfaces: expectedBlockedSurfaces,
          actualBlockedPublicCompatibilitySurfaces: []
        },
        {
          workerId: skippedWorkerId,
          expectedBlockedPublicCompatibilitySurfaces: expectedBlockedSurfaces,
          actualBlockedPublicCompatibilitySurfaces: [
            "test-renderer",
            "unexpected-public-surface"
          ]
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects blocked public claim drift", () => {
  const workerId =
    "worker-728-test-renderer-unmount-native-identity-argument-guard";
  const skippedWorkerId = "worker-727-package-private-admission-audit-724-726";
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      [workerId]: {
        blockedPublicClaims: []
      }
    },
    skippedRowOverrides: {
      [skippedWorkerId]: {
        blockedPublicClaims: [
          "publicTestRendererCompatibilityClaimed",
          "unexpectedPublicClaim"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-public-claim-mismatch",
      rows: [
        {
          workerId,
          expectedBlockedPublicClaims: expectedPublicCompatibilityClaims,
          actualBlockedPublicClaims: []
        },
        {
          workerId: skippedWorkerId,
          expectedBlockedPublicClaims: expectedPublicCompatibilityClaims,
          actualBlockedPublicClaims: [
            "publicTestRendererCompatibilityClaimed",
            "unexpectedPublicClaim"
          ]
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects public surface promotion leaks", () => {
  const workerId =
    "worker-728-test-renderer-unmount-native-identity-argument-guard";

  for (const claimId of expectedPublicCompatibilityClaims) {
    const gate = evaluatePrivateAdmission727728Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
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
