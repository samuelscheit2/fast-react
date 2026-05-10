import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_727_728_GATE_ID =
  "private-admission-727-728-local-gate-1";
export const PRIVATE_ADMISSION_727_728_GATE_STATUS =
  "recognized-accepted-private-diagnostics-727-728-public-compatibility-blocked";
export const PRIVATE_ADMISSION_727_728_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-727-728-with-violations";

export const PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS =
  Object.freeze([
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
  ]);

export const PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES = Object.freeze([
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
]);

export const PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS = Object.freeze([
  "worker-727-package-private-admission-audit-724-726"
]);

export const PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    "worker-728-test-renderer-unmount-native-identity-argument-guard":
      freezeArray([
        "test-renderer-unmount-native-identity-argument-guard",
        "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
      ])
  });

export const PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES = freezeRecord({
  "worker-728-test-renderer-unmount-native-identity-argument-guard":
    freezeArray([
      "worker-612-test-renderer-unmount-native-bridge-admission",
      "worker-638-test-renderer-unmount-native-execution",
      "worker-639-test-renderer-tojson-after-native-execution",
      "worker-667-test-renderer-totree-native-execution"
    ])
});

export const PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS =
  freezeRecord({
    "worker-728-test-renderer-unmount-native-identity-argument-guard":
      freezeArray([
        "react-test-renderer-unmount-native-bridge-admission-private-diagnostic",
        "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic",
        "test-renderer-tojson-native-execution-evidence",
        "test-renderer-totree-native-execution"
      ])
  });

export const PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT = freezeRecord({
  "worker-728-test-renderer-unmount-native-identity-argument-guard":
    freezeArray([
      "worker-725-test-renderer-update-serialization-finished-work-identity",
      "worker-726-test-renderer-update-native-serialization-identity-admission"
    ])
});

export const PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS =
  freezeRecord({
    "worker-728-test-renderer-unmount-native-identity-argument-guard":
      freezeArray([
        "test-renderer-update-serialization-finished-work-identity",
        "test-renderer-update-native-serialization-identity-admission"
      ])
  });

const privateAdmission727728SkippedRowData = Object.freeze([
  skippedRowData({
    workerId: "worker-727-package-private-admission-audit-724-726",
    area: "previous private-admission ledger audit for Workers 724-726",
    skipReason: "ledger-audit-no-new-runtime-capability",
    evidenceRows: [
      evidenceData({
        role: "worker-727-skip-meta-report",
        path: "worker-progress/worker-727-package-private-admission-audit-724-726.md",
        tokens: [
          "# Worker 727: Package Private Admission Audit 724-726",
          "Classified Worker 724 as `skipped-meta` ledger work",
          "No runtime/product code"
        ]
      })
    ]
  })
]);

const privateAdmission727728RowData = Object.freeze([
  rowData({
    workerId: "worker-728-test-renderer-unmount-native-identity-argument-guard",
    area: "react-test-renderer unmount native serialization identity argument guard diagnostics",
    primaryCompatibilityArea:
      "test-renderer-unmount-native-identity-argument-guard",
    acceptedDiagnosticIds: [
      "test-renderer-unmount-native-identity-argument-guard",
      "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
    ],
    dependencyWorkerIds: [
      "worker-612-test-renderer-unmount-native-bridge-admission",
      "worker-638-test-renderer-unmount-native-execution",
      "worker-639-test-renderer-tojson-after-native-execution",
      "worker-667-test-renderer-totree-native-execution"
    ],
    dependencyDiagnosticIds: [
      "react-test-renderer-unmount-native-bridge-admission-private-diagnostic",
      "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic",
      "test-renderer-tojson-native-execution-evidence",
      "test-renderer-totree-native-execution"
    ],
    blockerContextWorkerIds: [
      "worker-725-test-renderer-update-serialization-finished-work-identity",
      "worker-726-test-renderer-update-native-serialization-identity-admission"
    ],
    blockerContextDiagnosticIds: [
      "test-renderer-update-serialization-finished-work-identity",
      "test-renderer-update-native-serialization-identity-admission"
    ],
    evidenceRows: [
      evidenceData({
        role: "worker-612-unmount-route-admission-dependency",
        path: "worker-progress/worker-612-test-renderer-unmount-native-bridge-admission.md",
        tokens: [
          "# Worker 612: Test Renderer Unmount Native Bridge Admission",
          "accepted unmount route outcome plus deletion commit handoff evidence",
          "public unmount compatibility",
          "native bridge availability"
        ]
      }),
      evidenceData({
        role: "worker-638-unmount-cleanup-handoff-dependency",
        path: "worker-progress/worker-638-test-renderer-unmount-native-execution.md",
        tokens: [
          "# Worker 638: Test Renderer Unmount Native Execution",
          "TestRendererUnmountNativeBridgeCleanupHandoff",
          "execute_private_unmount_native_bridge_cleanup_handoff_for_canary",
          "Kept public unmount compatibility"
        ]
      }),
      evidenceData({
        role: "worker-639-tojson-unmount-empty-host-output-dependency",
        path: "worker-progress/worker-639-test-renderer-tojson-after-native-execution.md",
        tokens: [
          "# Worker 639: Test Renderer toJSON After Native Execution",
          "create, update, and unmount",
          "minimal private `toJSON` output evidence",
          "Public serialization"
        ]
      }),
      evidenceData({
        role: "worker-667-totree-unmount-native-output-dependency",
        path: "worker-progress/worker-667-test-renderer-totree-native-execution.md",
        tokens: [
          "# Worker 667: Test Renderer toTree Native Execution",
          "native create/update/unmount execution records",
          "public `toTree()` compatibility stays blocked"
        ]
      }),
      evidenceData({
        role: "worker-725-update-identity-blocker-context",
        path: "worker-progress/worker-725-test-renderer-update-serialization-finished-work-identity.md",
        tokens: [
          "# Worker 725 - test renderer update serialization finished-work identity",
          "Kept update, unmount, multichild, and native execution admission unchanged.",
          "This is private evidence only."
        ]
      }),
      evidenceData({
        role: "worker-726-update-native-identity-blocker-context",
        path: "worker-progress/worker-726-test-renderer-update-native-serialization-identity-admission.md",
        tokens: [
          "# Worker 726 - test renderer update native serialization identity admission",
          "Kept unmount identity admission out of scope",
          "Unmount and broader multichild/sibling identity admission remain intentionally"
        ]
      }),
      evidenceData({
        role: "worker-728-unmount-identity-argument-guard-report",
        path: "worker-progress/worker-728-test-renderer-unmount-native-identity-argument-guard.md",
        tokens: [
          "# Worker 728: Test Renderer Unmount Native Identity Argument Guard",
          "rejects any non-`undefined` `finishedWorkIdentityEvidence` argument",
          "finishedWorkIdentity: null",
          "consumesAcceptedFinishedWorkIdentityGate: false",
          "Did not add a Rust unmount identity adapter."
        ]
      }),
      evidenceData({
        role: "worker-728-unmount-identity-argument-guard-conformance",
        path: "tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs",
        tokens: [
          'test("react-test-renderer JS private native unmount serialization rejects finished-work identity evidence"',
          "createAcceptedEmptyRootHostOutputDiagnostic({",
          'hostOutputUpdateKind: "Unmount"',
          "createAcceptedUnmountTreeMetadataDiagnostic()",
          "assert.equal(jsonUnmountResult.finishedWorkIdentity, null);",
          "assert.equal(treeUnmountResult.finishedWorkIdentity, null);"
        ]
      })
    ]
  })
]);

function rowData(data) {
  return freezeRecord({
    ...data,
    acceptedDiagnosticIds: freezeArray(data.acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(data.dependencyWorkerIds ?? []),
    dependencyDiagnosticIds: freezeArray(data.dependencyDiagnosticIds ?? []),
    blockerContextWorkerIds: freezeArray(data.blockerContextWorkerIds ?? []),
    blockerContextDiagnosticIds: freezeArray(
      data.blockerContextDiagnosticIds ?? []
    ),
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function skippedRowData(data) {
  return freezeRecord({
    ...data,
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function evidenceData({ role, path, tokens }) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens)
  });
}

function admissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function row({
  workerId,
  area,
  primaryCompatibilityArea,
  acceptedDiagnosticIds,
  dependencyWorkerIds,
  dependencyDiagnosticIds,
  blockerContextWorkerIds,
  blockerContextDiagnosticIds,
  evidence: evidenceRows,
  publicCompatibilityClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "727-728",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-727-728-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(dependencyWorkerIds),
    dependencyDiagnosticIds: freezeArray(dependencyDiagnosticIds),
    blockerContextWorkerIds: freezeArray(blockerContextWorkerIds),
    blockerContextDiagnosticIds: freezeArray(blockerContextDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    runtimeCapabilityAdded: true,
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

function skippedRow({
  workerId,
  area,
  skipReason,
  evidence: evidenceRows,
  publicCompatibilityClaims
}) {
  return freezeRecord({
    workerId,
    area,
    skipReason,
    sourceQueue: "727-728",
    privateAdmission: "skipped-meta",
    localGateCoverage: "private-admission-727-728-local-gate",
    acceptedDiagnosticIds: freezeArray([]),
    dependencyWorkerIds: freezeArray([]),
    dependencyDiagnosticIds: freezeArray([]),
    blockerContextWorkerIds: freezeArray([]),
    blockerContextDiagnosticIds: freezeArray([]),
    evidence: freezeArray(evidenceRows),
    runtimeCapabilityAdded: false,
    compatibilityClaimed: false,
    promotion: "not-applicable",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_727_728_SKIPPED_ROWS = freezeArray(
  privateAdmission727728SkippedRowData.map((sourceRow) =>
    skippedRow({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      skipReason: sourceRow.skipReason,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_727_728_ROWS = freezeArray(
  privateAdmission727728RowData.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      dependencyWorkerIds: sourceRow.dependencyWorkerIds,
      dependencyDiagnosticIds: sourceRow.dependencyDiagnosticIds,
      blockerContextWorkerIds: sourceRow.blockerContextWorkerIds,
      blockerContextDiagnosticIds: sourceRow.blockerContextDiagnosticIds,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_727_728_WORKERS = freezeArray(
  PRIVATE_ADMISSION_727_728_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission727728Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_727_728_ROWS.map((baseRow) => {
    const override = rowOverrides[baseRow.workerId] ?? {};
    return mergeRowOverride(baseRow, override);
  });
  const skippedRows = PRIVATE_ADMISSION_727_728_SKIPPED_ROWS.map((baseRow) => {
    const override = skippedRowOverrides[baseRow.workerId] ?? {};
    return mergeRowOverride(baseRow, override);
  });
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const evaluatedSkippedRows = skippedRows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((baseRow) => baseRow.workerId);
  const skippedManifestWorkerIds = skippedRows.map(
    (baseRow) => baseRow.workerId
  );
  const missingWorkerIds = PRIVATE_ADMISSION_727_728_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_727_728_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = manifestWorkerIds.filter(
    (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
  );
  const missingSkippedWorkerIds =
    PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS.filter(
      (workerId) => !skippedManifestWorkerIds.includes(workerId)
    );
  const unexpectedSkippedWorkerIds = skippedManifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS.includes(workerId)
  );
  const duplicateSkippedWorkerIds = skippedManifestWorkerIds.filter(
    (workerId, index) => skippedManifestWorkerIds.indexOf(workerId) !== index
  );
  const unrecognizedWorkerIds = evaluatedRows
    .filter((evaluatedRow) => evaluatedRow.recognized !== true)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const unrecognizedSkippedWorkerIds = evaluatedSkippedRows
    .filter((evaluatedRow) => evaluatedRow.recognized !== true)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const evaluatedAllRows = [...evaluatedRows, ...evaluatedSkippedRows];
  const compatibilityClaimWorkerIds = evaluatedAllRows
    .filter((evaluatedRow) => evaluatedRow.compatibilityClaimed !== false)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const publicCompatibilityViolations = evaluatedAllRows.flatMap(
    (evaluatedRow) =>
      evaluatedRow.publicCompatibilityViolations.map((claimId) =>
        `${evaluatedRow.workerId}.${claimId}`
      )
  );
  const blockedSurfaceMismatches = evaluatedAllRows.flatMap((evaluatedRow) => {
    const actualBlockedSurfaces =
      evaluatedRow.blockedPublicCompatibilitySurfaces ?? [];

    if (
      sameStringSet(
        PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
        actualBlockedSurfaces
      ) === true
    ) {
      return [];
    }

    return [
      freezeRecord({
        workerId: evaluatedRow.workerId,
        expectedBlockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
        actualBlockedPublicCompatibilitySurfaces: freezeArray(
          actualBlockedSurfaces
        )
      })
    ];
  });
  const blockedPublicClaimMismatches = evaluatedAllRows.flatMap(
    (evaluatedRow) => {
      const actualBlockedPublicClaims = evaluatedRow.blockedPublicClaims ?? [];

      if (
        sameStringSet(
          PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedBlockedPublicClaims:
            PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims: freezeArray(actualBlockedPublicClaims)
        })
      ];
    }
  );
  const skippedRuntimeCapabilityWorkerIds = evaluatedSkippedRows
    .filter(
      (evaluatedRow) =>
        evaluatedRow.privateAdmission !== "skipped-meta" ||
        evaluatedRow.runtimeCapabilityAdded !== false ||
        (evaluatedRow.acceptedDiagnosticIds ?? []).length !== 0
    )
    .map((evaluatedRow) => evaluatedRow.workerId);
  const acceptedDiagnosticMismatches = evaluatedRows.flatMap(
    (evaluatedRow) => {
      if (
        !Object.hasOwn(
          PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS,
          evaluatedRow.workerId
        )
      ) {
        return [];
      }

      const expectedAcceptedDiagnosticIds =
        PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS[
          evaluatedRow.workerId
        ];
      const actualAcceptedDiagnosticIds =
        evaluatedRow.acceptedDiagnosticIds ?? [];

      if (
        evaluatedRow.privateAdmission === "accepted-private-diagnostic" &&
        sameStringSet(
          expectedAcceptedDiagnosticIds,
          actualAcceptedDiagnosticIds
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedAcceptedDiagnosticIds,
          actualAcceptedDiagnosticIds: freezeArray(actualAcceptedDiagnosticIds)
        })
      ];
    }
  );
  const dependencyMismatches = evaluatedRows.flatMap((evaluatedRow) => {
    if (
      !Object.hasOwn(
        PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES,
        evaluatedRow.workerId
      )
    ) {
      return [];
    }

    const expectedDependencyWorkerIds =
      PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES[evaluatedRow.workerId];
    const actualDependencyWorkerIds = evaluatedRow.dependencyWorkerIds ?? [];

    if (
      sameStringSet(expectedDependencyWorkerIds, actualDependencyWorkerIds) ===
      true
    ) {
      return [];
    }

    return [
      freezeRecord({
        workerId: evaluatedRow.workerId,
        expectedDependencyWorkerIds,
        actualDependencyWorkerIds: freezeArray(actualDependencyWorkerIds)
      })
    ];
  });
  const dependencyDiagnosticMismatches = evaluatedRows.flatMap(
    (evaluatedRow) => {
      if (
        !Object.hasOwn(
          PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS,
          evaluatedRow.workerId
        )
      ) {
        return [];
      }

      const expectedDependencyDiagnosticIds =
        PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS[
          evaluatedRow.workerId
        ];
      const actualDependencyDiagnosticIds =
        evaluatedRow.dependencyDiagnosticIds ?? [];

      if (
        sameStringSet(
          expectedDependencyDiagnosticIds,
          actualDependencyDiagnosticIds
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedDependencyDiagnosticIds,
          actualDependencyDiagnosticIds: freezeArray(
            actualDependencyDiagnosticIds
          )
        })
      ];
    }
  );
  const blockerContextMismatches = evaluatedRows.flatMap((evaluatedRow) => {
    if (
      !Object.hasOwn(
        PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT,
        evaluatedRow.workerId
      )
    ) {
      return [];
    }

    const expectedBlockerContextWorkerIds =
      PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT[evaluatedRow.workerId];
    const actualBlockerContextWorkerIds =
      evaluatedRow.blockerContextWorkerIds ?? [];

    if (
      sameStringSet(
        expectedBlockerContextWorkerIds,
        actualBlockerContextWorkerIds
      ) === true
    ) {
      return [];
    }

    return [
      freezeRecord({
        workerId: evaluatedRow.workerId,
        expectedBlockerContextWorkerIds,
        actualBlockerContextWorkerIds: freezeArray(
          actualBlockerContextWorkerIds
        )
      })
    ];
  });
  const blockerContextDiagnosticMismatches = evaluatedRows.flatMap(
    (evaluatedRow) => {
      if (
        !Object.hasOwn(
          PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
          evaluatedRow.workerId
        )
      ) {
        return [];
      }

      const expectedBlockerContextDiagnosticIds =
        PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
          evaluatedRow.workerId
        ];
      const actualBlockerContextDiagnosticIds =
        evaluatedRow.blockerContextDiagnosticIds ?? [];

      if (
        sameStringSet(
          expectedBlockerContextDiagnosticIds,
          actualBlockerContextDiagnosticIds
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedBlockerContextDiagnosticIds,
          actualBlockerContextDiagnosticIds: freezeArray(
            actualBlockerContextDiagnosticIds
          )
        })
      ];
    }
  );
  const violations = [];

  if (
    missingWorkerIds.length > 0 ||
    unexpectedWorkerIds.length > 0 ||
    duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("accepted-private-worker-manifest-mismatch", {
        missingWorkerIds,
        unexpectedWorkerIds,
        duplicateWorkerIds
      })
    );
  }

  if (
    missingSkippedWorkerIds.length > 0 ||
    unexpectedSkippedWorkerIds.length > 0 ||
    duplicateSkippedWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("skipped-meta-worker-manifest-mismatch", {
        missingWorkerIds: missingSkippedWorkerIds,
        unexpectedWorkerIds: unexpectedSkippedWorkerIds,
        duplicateWorkerIds: duplicateSkippedWorkerIds
      })
    );
  }

  if (unrecognizedWorkerIds.length > 0) {
    violations.push(
      createViolation("required-private-diagnostic-not-recognized", {
        workerIds: unrecognizedWorkerIds
      })
    );
  }

  if (unrecognizedSkippedWorkerIds.length > 0) {
    violations.push(
      createViolation("required-skip-meta-row-not-recognized", {
        workerIds: unrecognizedSkippedWorkerIds
      })
    );
  }

  if (skippedRuntimeCapabilityWorkerIds.length > 0) {
    violations.push(
      createViolation("skip-meta-row-claimed-runtime-capability", {
        workerIds: skippedRuntimeCapabilityWorkerIds
      })
    );
  }

  if (acceptedDiagnosticMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-id-mismatch", {
        rows: freezeArray(acceptedDiagnosticMismatches)
      })
    );
  }

  if (dependencyMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-dependency-mismatch", {
        rows: freezeArray(dependencyMismatches)
      })
    );
  }

  if (dependencyDiagnosticMismatches.length > 0) {
    violations.push(
      createViolation(
        "accepted-private-diagnostic-dependency-diagnostic-mismatch",
        {
          rows: freezeArray(dependencyDiagnosticMismatches)
        }
      )
    );
  }

  if (blockerContextMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-blocker-context-mismatch", {
        rows: freezeArray(blockerContextMismatches)
      })
    );
  }

  if (blockerContextDiagnosticMismatches.length > 0) {
    violations.push(
      createViolation(
        "accepted-private-diagnostic-blocker-context-diagnostic-mismatch",
        {
          rows: freezeArray(blockerContextDiagnosticMismatches)
        }
      )
    );
  }

  if (compatibilityClaimWorkerIds.length > 0) {
    violations.push(
      createViolation("private-diagnostic-claimed-compatibility", {
        workerIds: compatibilityClaimWorkerIds
      })
    );
  }

  if (publicCompatibilityViolations.length > 0) {
    violations.push(
      createViolation("public-compatibility-claim-detected", {
        claimIds: publicCompatibilityViolations
      })
    );
  }

  if (blockedSurfaceMismatches.length > 0) {
    violations.push(
      createViolation("blocked-public-compatibility-surface-mismatch", {
        rows: freezeArray(blockedSurfaceMismatches)
      })
    );
  }

  if (blockedPublicClaimMismatches.length > 0) {
    violations.push(
      createViolation("blocked-public-claim-mismatch", {
        rows: freezeArray(blockedPublicClaimMismatches)
      })
    );
  }

  return freezeRecord({
    id: PRIVATE_ADMISSION_727_728_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_727_728_GATE_STATUS
        : PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_727_728_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
    rows: freezeArray(evaluatedRows),
    skippedRows: freezeArray(evaluatedSkippedRows),
    rowsByWorker: freezeRecord(
      Object.fromEntries(
        evaluatedRows.map((evaluatedRow) => [
          evaluatedRow.workerId,
          evaluatedRow
        ])
      )
    ),
    skippedRowsByWorker: freezeRecord(
      Object.fromEntries(
        evaluatedSkippedRows.map((evaluatedRow) => [
          evaluatedRow.workerId,
          evaluatedRow
        ])
      )
    ),
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((evaluatedRow) => evaluatedRow.recognized === true)
        .map((evaluatedRow) => evaluatedRow.workerId)
    ),
    recognizedSkippedWorkerIds: freezeArray(
      evaluatedSkippedRows
        .filter((evaluatedRow) => evaluatedRow.recognized === true)
        .map((evaluatedRow) => evaluatedRow.workerId)
    ),
    privateDiagnosticsRecognized:
      unrecognizedWorkerIds.length === 0 &&
      missingWorkerIds.length === 0 &&
      unexpectedWorkerIds.length === 0 &&
      duplicateWorkerIds.length === 0 &&
      acceptedDiagnosticMismatches.length === 0 &&
      dependencyMismatches.length === 0 &&
      dependencyDiagnosticMismatches.length === 0 &&
      blockerContextMismatches.length === 0 &&
      blockerContextDiagnosticMismatches.length === 0 &&
      blockedSurfaceMismatches.length === 0 &&
      blockedPublicClaimMismatches.length === 0,
    skipMetaRecognized:
      unrecognizedSkippedWorkerIds.length === 0 &&
      missingSkippedWorkerIds.length === 0 &&
      unexpectedSkippedWorkerIds.length === 0 &&
      duplicateSkippedWorkerIds.length === 0 &&
      skippedRuntimeCapabilityWorkerIds.length === 0,
    acceptedDiagnosticsRecognized: acceptedDiagnosticMismatches.length === 0,
    dependenciesRecognized:
      dependencyMismatches.length === 0 &&
      dependencyDiagnosticMismatches.length === 0,
    blockerContextRecognized:
      blockerContextMismatches.length === 0 &&
      blockerContextDiagnosticMismatches.length === 0,
    blockedPublicSurfacesRecognized: blockedSurfaceMismatches.length === 0,
    blockedPublicClaimsRecognized: blockedPublicClaimMismatches.length === 0,
    compatibilityClaimed:
      compatibilityClaimWorkerIds.length > 0 ||
      publicCompatibilityViolations.length > 0,
    publicCompatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    manifest: freezeRecord({
      expectedWorkerIds: PRIVATE_ADMISSION_727_728_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
      expectedSkippedWorkerIds: PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
      actualSkippedWorkerIds: freezeArray(skippedManifestWorkerIds),
      missingSkippedWorkerIds: freezeArray(missingSkippedWorkerIds),
      unexpectedSkippedWorkerIds: freezeArray(unexpectedSkippedWorkerIds),
      duplicateSkippedWorkerIds: freezeArray(duplicateSkippedWorkerIds)
    }),
    violations: freezeArray(violations)
  });
}

function mergeRowOverride(baseRow, override) {
  return freezeRecord({
    ...baseRow,
    ...override,
    publicCompatibilityClaims: freezeRecord({
      ...baseRow.publicCompatibilityClaims,
      ...(override.publicCompatibilityClaims ?? {})
    })
  });
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evaluatedEvidence = (row.evidence ?? []).map((evidenceRow) =>
    evaluateEvidenceRow({
      evidenceRow,
      fileCache,
      workspaceRoot
    })
  );
  const evidenceRecognized = evaluatedEvidence.every(
    (evidenceRow) => evidenceRow.recognized === true
  );
  const publicCompatibilityViolations = Object.entries(
    row.publicCompatibilityClaims ?? {}
  )
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);

  return freezeRecord({
    ...row,
    evidence: freezeArray(evaluatedEvidence),
    evidenceRecognized,
    recognized:
      typeof row.recognized === "boolean" ? row.recognized : evidenceRecognized,
    publicCompatibilityViolations: freezeArray(publicCompatibilityViolations)
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const source = readWorkspaceFile({
    fileCache,
    workspaceRoot,
    path: evidenceRow.path
  });
  const tokenResults = evidenceRow.tokens.map((token) =>
    freezeRecord({
      token,
      present: source.text.includes(token)
    })
  );
  const missingTokens = tokenResults
    .filter((tokenResult) => tokenResult.present !== true)
    .map((tokenResult) => tokenResult.token);

  return freezeRecord({
    ...evidenceRow,
    tokenResults: freezeArray(tokenResults),
    missingTokens: freezeArray(missingTokens),
    recognized: source.ok === true && missingTokens.length === 0,
    readError: source.error
  });
}

function readWorkspaceFile({ fileCache, workspaceRoot, path }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  let source;
  try {
    source = freezeRecord({
      ok: true,
      text: readFileSync(join(workspaceRoot, path), "utf8"),
      error: null
    });
  } catch (error) {
    source = freezeRecord({
      ok: false,
      text: "",
      error: `${error.name}: ${error.message}`
    });
  }
  fileCache.set(path, source);
  return source;
}

function sameStringSet(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function createViolation(id, fields) {
  return freezeRecord({
    id,
    ...fields
  });
}

function freezeArray(value) {
  return Object.freeze([...value]);
}

function freezeRecord(value) {
  return Object.freeze(value);
}
