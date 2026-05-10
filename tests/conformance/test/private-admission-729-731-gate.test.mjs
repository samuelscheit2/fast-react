import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_729_731_GATE_STATUS,
  PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT,
  PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
  PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS,
  PRIVATE_ADMISSION_729_731_ROWS,
  PRIVATE_ADMISSION_729_731_SKIPPED_ROWS,
  PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_729_731_VIOLATION_STATUS,
  PRIVATE_ADMISSION_729_731_WORKERS,
  evaluatePrivateAdmission729731Gate
} from "../src/private-admission-729-731-gate.mjs";

const worker730 =
  "worker-730-test-renderer-unmount-native-cleanup-evidence";
const worker731 = "worker-731-tojson-nested-update-native-identity";
const skippedWorker729 =
  "worker-729-package-private-admission-audit-727-728";

const expected729731Workers = [worker730, worker731];
const expected729731SkippedWorkers = [skippedWorker729];

const requiredBroadBlockedSurfaces = [
  "package",
  "package-surface",
  "test-renderer",
  "test-renderer-public-serialization",
  "test-renderer-to-json",
  "test-renderer-to-tree",
  "test-renderer-root",
  "test-renderer-update",
  "test-renderer-unmount",
  "test-renderer-testinstance",
  "test-renderer-native-addon-loading",
  "test-renderer-native-addon-execution",
  "test-renderer-native-bridge",
  "test-renderer-native-bridge-execution",
  "act",
  "react-dom",
  "react-dom-root",
  "scheduler",
  "hydration",
  "events",
  "refs",
  "resources",
  "forms",
  "controlled-inputs",
  "test-renderer-multichild-identity-admission",
  "test-renderer-multichild-sibling-identity-admission",
  "test-renderer-full-unmount-identity-admission"
];

const requiredPublicClaimIds = [
  "publicPackageCompatibilityClaimed",
  "publicPackageSurfaceCompatibilityClaimed",
  "publicTestRendererCompatibilityClaimed",
  "publicTestRendererSerializationCompatibilityClaimed",
  "publicTestRendererToJSONCompatibilityClaimed",
  "publicTestRendererToTreeCompatibilityClaimed",
  "publicTestRendererRootCompatibilityClaimed",
  "publicTestRendererUpdateCompatibilityClaimed",
  "publicTestRendererUnmountCompatibilityClaimed",
  "publicTestRendererTestInstanceCompatibilityClaimed",
  "publicTestRendererNativeAddonLoadingCompatibilityClaimed",
  "publicTestRendererNativeAddonExecutionCompatibilityClaimed",
  "publicTestRendererNativeBridgeCompatibilityClaimed",
  "publicTestRendererNativeBridgeExecutionClaimed",
  "publicActCompatibilityClaimed",
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

test("private admission 729-731 manifest records one skipped meta row and two accepted private diagnostics", () => {
  assert.deepEqual(PRIVATE_ADMISSION_729_731_WORKERS, expected729731Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_729_731_ROWS.map((row) => row.workerId),
    expected729731Workers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS,
    expected729731SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_729_731_SKIPPED_ROWS.map((row) => row.workerId),
    expected729731SkippedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_729_731_ROWS.length, 2);
  assert.equal(PRIVATE_ADMISSION_729_731_SKIPPED_ROWS.length, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_729_731_WORKERS).size, 2);
  assert.equal(new Set(PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS).size, 1);
  assert.equal(PRIVATE_ADMISSION_729_731_WORKERS.includes(skippedWorker729), false);

  for (const surface of requiredBroadBlockedSurfaces) {
    assert.equal(
      PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES.includes(surface),
      true,
      surface
    );
  }
  for (const claimId of requiredPublicClaimIds) {
    assert.equal(
      PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS.includes(claimId),
      true,
      claimId
    );
  }
  assert.deepEqual(PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS, [
    "nativeExecutionAdmissionClaimed",
    "publicUnmountAdmissionClaimed",
    "unmountIdentityAdmissionClaimed",
    "jsFacadeAdmissionClaimed",
    "cjsFacadeAdmissionClaimed",
    "siblingSnapshotAdmissionClaimed",
    "toTreePromotionClaimed",
    "publicCompatibilityPromotionClaimed"
  ]);
});

test("private admission 729-731 gate recognizes accepted private evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission729731Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.blockerContextRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_729_731_WORKERS);
  assert.deepEqual(gate.skippedWorkers, PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_729_731_WORKERS);
  assert.deepEqual(
    gate.recognizedSkippedWorkerIds,
    PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS
  );
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(gate.manifest.missingSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateSkippedWorkerIds, []);

  const unmountCleanupRow = gate.rowsByWorker[worker730];
  assertPrivateDiagnosticRow(unmountCleanupRow, {
    primaryCompatibilityArea:
      "test-renderer-unmount-native-cleanup-ref-passive-host-evidence",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker730],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker730],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker730],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[worker730],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[worker730],
    evidenceRoles: [
      "worker-575-unmount-deletion-commit-dependency",
      "worker-612-unmount-native-bridge-admission-dependency",
      "worker-638-unmount-cleanup-handoff-dependency",
      "worker-725-update-identity-blocker-context",
      "worker-726-update-native-identity-blocker-context",
      "worker-728-unmount-identity-guard-blocker-context",
      "worker-730-unmount-cleanup-report",
      "worker-730-unmount-cleanup-rust-proof"
    ]
  });
  assert.equal(
    unmountCleanupRow.acceptedDiagnosticIds.includes(
      "test-renderer-unmount-identity-admission"
    ),
    false
  );
  assert.equal(
    unmountCleanupRow.blockedAdmissionClaims.nativeExecutionAdmissionClaimed,
    false
  );
  assert.equal(
    unmountCleanupRow.blockedAdmissionClaims.unmountIdentityAdmissionClaimed,
    false
  );

  const nestedIdentityRow = gate.rowsByWorker[worker731];
  assertPrivateDiagnosticRow(nestedIdentityRow, {
    primaryCompatibilityArea:
      "test-renderer-tojson-nested-update-native-identity-admission",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker731],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker731],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker731],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[worker731],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[worker731],
    evidenceRoles: [
      "worker-577-nested-tojson-row-dependency",
      "worker-720-base-finished-work-identity-dependency",
      "worker-725-update-finished-work-identity-dependency",
      "worker-726-update-native-identity-dependency-and-blocker",
      "worker-728-unmount-identity-guard-blocker-context",
      "worker-731-nested-tojson-identity-report",
      "worker-731-nested-tojson-identity-rust-proof"
    ]
  });
  assert.equal(
    nestedIdentityRow.acceptedDiagnosticIds.some((diagnosticId) =>
      diagnosticId.includes("sibling")
    ),
    false
  );
  assert.equal(
    nestedIdentityRow.acceptedDiagnosticIds.some((diagnosticId) =>
      diagnosticId.includes("totree")
    ),
    false
  );
  assert.equal(
    nestedIdentityRow.blockedAdmissionClaims.siblingSnapshotAdmissionClaimed,
    false
  );
  assert.equal(nestedIdentityRow.blockedAdmissionClaims.toTreePromotionClaimed, false);

  for (const row of [...gate.rows, ...gate.skippedRows]) {
    assertNoPublicOrAdmissionClaims(row);
  }
});

test("private admission 729-731 gate recognizes Worker 729 as non-runtime skip meta", () => {
  const gate = evaluatePrivateAdmission729731Gate();
  const row = gate.skippedRowsByWorker[skippedWorker729];

  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "729-731");
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
  assertNoPublicOrAdmissionClaims(row);
});

test("private admission 729-731 gate rejects missing or unknown accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        acceptedDiagnosticIds: []
      },
      [worker731]: {
        acceptedDiagnosticIds: [
          ...PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker731],
          "unexpected-public-or-sibling-admission"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-id-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedAcceptedDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker730],
          actualAcceptedDiagnosticIds: []
        },
        {
          workerId: worker731,
          expectedAcceptedDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[worker731],
          actualAcceptedDiagnosticIds: [
            ...PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[
              worker731
            ],
            "unexpected-public-or-sibling-admission"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects unrecognized accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: [worker730]
    }
  ]);
});

test("private admission 729-731 gate rejects stale or meta worker ids in accepted rows", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        workerId: skippedWorker729
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-worker-manifest-mismatch",
      missingWorkerIds: [worker730],
      unexpectedWorkerIds: [skippedWorker729],
      duplicateWorkerIds: []
    }
  ]);
});

test("private admission 729-731 gate rejects skip meta rows that claim runtime capability", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    skippedRowOverrides: {
      [skippedWorker729]: {
        runtimeCapabilityAdded: true,
        acceptedDiagnosticIds: ["unexpected-runtime-diagnostic"]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "skip-meta-row-claimed-runtime-capability",
      workerIds: [skippedWorker729]
    }
  ]);
});

test("private admission 729-731 gate rejects dependency worker drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        dependencyWorkerIds: []
      },
      [worker731]: {
        dependencyWorkerIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedDependencyWorkerIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker730],
          actualDependencyWorkerIds: []
        },
        {
          workerId: worker731,
          expectedDependencyWorkerIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[worker731],
          actualDependencyWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects dependency diagnostic drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        dependencyDiagnosticIds: []
      },
      [worker731]: {
        dependencyDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-diagnostic-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedDependencyDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[
              worker730
            ],
          actualDependencyDiagnosticIds: []
        },
        {
          workerId: worker731,
          expectedDependencyDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[
              worker731
            ],
          actualDependencyDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects blocker context worker drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        blockerContextWorkerIds: []
      },
      [worker731]: {
        blockerContextWorkerIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-blocker-context-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedBlockerContextWorkerIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[worker730],
          actualBlockerContextWorkerIds: []
        },
        {
          workerId: worker731,
          expectedBlockerContextWorkerIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[worker731],
          actualBlockerContextWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects blocker context diagnostic drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        blockerContextDiagnosticIds: []
      },
      [worker731]: {
        blockerContextDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-blocker-context-diagnostic-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedBlockerContextDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
              worker730
            ],
          actualBlockerContextDiagnosticIds: []
        },
        {
          workerId: worker731,
          expectedBlockerContextDiagnosticIds:
            PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
              worker731
            ],
          actualBlockerContextDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects blocked public surface drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        blockedPublicCompatibilitySurfaces: []
      }
    },
    skippedRowOverrides: {
      [skippedWorker729]: {
        blockedPublicCompatibilitySurfaces: [
          "test-renderer",
          "unexpected-public-surface"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-public-compatibility-surface-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedBlockedPublicCompatibilitySurfaces:
            PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
          actualBlockedPublicCompatibilitySurfaces: []
        },
        {
          workerId: skippedWorker729,
          expectedBlockedPublicCompatibilitySurfaces:
            PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
          actualBlockedPublicCompatibilitySurfaces: [
            "test-renderer",
            "unexpected-public-surface"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects blocked public claim drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        blockedPublicClaims: []
      }
    },
    skippedRowOverrides: {
      [skippedWorker729]: {
        blockedPublicClaims: [
          "publicTestRendererCompatibilityClaimed",
          "unexpectedPublicClaim"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-public-claim-mismatch",
      rows: [
        {
          workerId: worker731,
          expectedBlockedPublicClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims: []
        },
        {
          workerId: skippedWorker729,
          expectedBlockedPublicClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims: [
            "publicTestRendererCompatibilityClaimed",
            "unexpectedPublicClaim"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects public compatibility claim key drift", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        publicCompatibilityClaims: {
          unexpectedPublicClaim: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "public-compatibility-claim-key-mismatch",
      rows: [
        {
          workerId: worker730,
          expectedPublicCompatibilityClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualPublicCompatibilityClaims: [
            ...PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
            "unexpectedPublicClaim"
          ]
        }
      ]
    }
  ]);
});

test("private admission 729-731 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker731]: {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: [worker731]
    }
  ]);
});

test("private admission 729-731 gate rejects blocked admission claim leaks", () => {
  for (const claimId of PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS) {
    const gate = evaluatePrivateAdmission729731Gate({
      rowOverrides: {
        [worker731]: {
          blockedAdmissionClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.compatibilityClaimed, true);
    assert.equal(gate.blockedAdmissionClaimsRecognized, false);
    assert.deepEqual(gate.violations, [
      {
        id: "blocked-admission-claim-detected",
        claimIds: [`${worker731}.${claimId}`]
      }
    ]);
  }
});

test("private admission 729-731 gate rejects public promotion leaks", () => {
  const gate = evaluatePrivateAdmission729731Gate({
    rowOverrides: {
      [worker730]: {
        promotion: "accepted-public"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-public-promotion-leak",
      workerIds: [worker730]
    }
  ]);
});

test("private admission 729-731 gate rejects public surface promotion leaks", () => {
  for (const claimId of PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS) {
    const gate = evaluatePrivateAdmission729731Gate({
      rowOverrides: {
        [worker731]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_729_731_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.compatibilityClaimed, true);
    assert.equal(gate.publicCompatibilityClaimed, true);
    assert.deepEqual(gate.violations, [
      {
        id: "public-compatibility-claim-detected",
        claimIds: [`${worker731}.${claimId}`]
      }
    ]);
  }
});

function assertPrivateDiagnosticRow(
  row,
  {
    primaryCompatibilityArea,
    acceptedDiagnosticIds,
    dependencyWorkerIds,
    dependencyDiagnosticIds,
    blockerContextWorkerIds,
    blockerContextDiagnosticIds,
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, "accepted-private-diagnostic");
  assert.equal(row.sourceQueue, "729-731");
  assert.equal(row.primaryCompatibilityArea, primaryCompatibilityArea);
  assert.equal(row.runtimeCapabilityAdded, true);
  assert.equal(row.recognized, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "rejected");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, [...acceptedDiagnosticIds]);
  assert.deepEqual(row.dependencyWorkerIds, [...dependencyWorkerIds]);
  assert.deepEqual(row.dependencyDiagnosticIds, [...dependencyDiagnosticIds]);
  assert.deepEqual(row.blockerContextWorkerIds, [...blockerContextWorkerIds]);
  assert.deepEqual(row.blockerContextDiagnosticIds, [
    ...blockerContextDiagnosticIds
  ]);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
}

function assertNoPublicOrAdmissionClaims(row) {
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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
  assert.deepEqual(
    Object.keys(row.blockedAdmissionClaims).sort(),
    [...PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.blockedAdmissionClaims),
    Object.values(row.blockedAdmissionClaims).map(() => false),
    row.workerId
  );
  assert.deepEqual(row.publicCompatibilityViolations, [], row.workerId);
  assert.deepEqual(row.blockedAdmissionClaimViolations, [], row.workerId);

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
  }
}
