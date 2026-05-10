import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_724_726_GATE_ID =
  "private-admission-724-726-local-gate-1";
export const PRIVATE_ADMISSION_724_726_GATE_STATUS =
  "recognized-accepted-private-diagnostics-724-726-public-compatibility-blocked";
export const PRIVATE_ADMISSION_724_726_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-724-726-with-violations";

export const PRIVATE_ADMISSION_724_726_PUBLIC_COMPATIBILITY_CLAIMS =
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
  ]);

export const PRIVATE_ADMISSION_724_726_BLOCKED_SURFACES = Object.freeze([
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
]);

export const PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS = Object.freeze([
  "worker-724-package-private-admission-audit-722-723"
]);

export const PRIVATE_ADMISSION_724_726_REQUIRED_DEPENDENCIES = freezeRecord({
  "worker-725-test-renderer-update-serialization-finished-work-identity":
    freezeArray(["worker-720-test-renderer-serialization-finished-work-identity"]),
  "worker-726-test-renderer-update-native-serialization-identity-admission":
    freezeArray([
      "worker-725-test-renderer-update-serialization-finished-work-identity"
    ])
});

const privateAdmission724726SkippedRowData = Object.freeze([
  skippedRowData({
    workerId: "worker-724-package-private-admission-audit-722-723",
    area: "previous private-admission ledger audit for Workers 722-723",
    skipReason: "ledger-audit-no-new-runtime-capability",
    evidenceRows: [
      evidenceData({
        role: "worker-724-skip-meta-report",
        path: "worker-progress/worker-724-package-private-admission-audit-722-723.md",
        tokens: [
          "# Worker 724: Package Private Admission Audit 722-723",
          "Scope stayed limited to conformance source/tests and this progress report.",
          "No runtime/product code"
        ]
      })
    ]
  })
]);

const privateAdmission724726RowData = Object.freeze([
  rowData({
    workerId: "worker-725-test-renderer-update-serialization-finished-work-identity",
    area: "react-test-renderer update-path serialization finished-work identity diagnostics",
    primaryCompatibilityArea:
      "test-renderer-update-serialization-finished-work-identity",
    acceptedDiagnosticIds: [
      "test-renderer-update-serialization-finished-work-identity",
      "private-update-tojson-totree-finished-work-identity-validation"
    ],
    dependencyWorkerIds: [
      "worker-720-test-renderer-serialization-finished-work-identity"
    ],
    dependencyDiagnosticIds: [
      "test-renderer-serialization-finished-work-identity",
      "private-tojson-totree-finished-work-identity-validation"
    ],
    evidenceRows: [
      evidenceData({
        role: "worker-720-base-finished-work-identity-dependency",
        path: "worker-progress/worker-720-test-renderer-serialization-finished-work-identity.md",
        tokens: [
          "# Worker 720 - test renderer serialization finished-work identity",
          "TestRendererPrivateSerializationFinishedWorkIdentityGate",
          "Public `create().toJSON`, `create().toTree`, `.root`, `TestInstance`, native bridge execution, and compatibility claims must stay blocked."
        ]
      }),
      evidenceData({
        role: "worker-725-update-finished-work-identity-report",
        path: "worker-progress/worker-725-test-renderer-update-serialization-finished-work-identity.md",
        tokens: [
          "# Worker 725 - test renderer update serialization finished-work identity",
          "Added private update-path finished-work identity evidence",
          "matching private update",
          "Kept public `toJSON`, `toTree`, `.root`, `update`, `TestInstance`, native",
          "This is private evidence only."
        ]
      })
    ]
  }),
  rowData({
    workerId: "worker-726-test-renderer-update-native-serialization-identity-admission",
    area: "react-test-renderer update-path native serialization identity admission diagnostics",
    primaryCompatibilityArea:
      "test-renderer-update-native-serialization-identity-admission",
    acceptedDiagnosticIds: [
      "test-renderer-update-native-serialization-identity-admission",
      "private-update-tojson-totree-native-diagnostic-admission"
    ],
    dependencyWorkerIds: [
      "worker-725-test-renderer-update-serialization-finished-work-identity"
    ],
    dependencyDiagnosticIds: [
      "test-renderer-update-serialization-finished-work-identity",
      "private-update-tojson-totree-finished-work-identity-validation"
    ],
    evidenceRows: [
      evidenceData({
        role: "worker-725-update-finished-work-identity-dependency",
        path: "worker-progress/worker-725-test-renderer-update-serialization-finished-work-identity.md",
        tokens: [
          "# Worker 725 - test renderer update serialization finished-work identity",
          "Added private update-path finished-work identity evidence",
          "matching private update",
          "This is private evidence only."
        ]
      }),
      evidenceData({
        role: "worker-726-update-native-identity-admission-report",
        path: "worker-progress/worker-726-test-renderer-update-native-serialization-identity-admission.md",
        tokens: [
          "# Worker 726 - test renderer update native serialization identity admission",
          "Extended private update-path `toJSON` and `toTree` native serialization",
          "diagnostic admission to require accepted update finished-work identity",
          "`TestRendererPrivateSerializationFinishedWorkIdentityGate` now carry the",
          "nativeBridgeAvailable: false",
          "Unmount and broader multichild/sibling identity admission remain intentionally"
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
      PRIVATE_ADMISSION_724_726_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
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
  evidence: evidenceRows,
  publicCompatibilityClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "724-726",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-724-726-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(dependencyWorkerIds),
    dependencyDiagnosticIds: freezeArray(dependencyDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    runtimeCapabilityAdded: true,
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_724_726_BLOCKED_SURFACES,
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
    sourceQueue: "724-726",
    privateAdmission: "skipped-meta",
    localGateCoverage: "private-admission-724-726-local-gate",
    acceptedDiagnosticIds: freezeArray([]),
    dependencyWorkerIds: freezeArray([]),
    dependencyDiagnosticIds: freezeArray([]),
    evidence: freezeArray(evidenceRows),
    runtimeCapabilityAdded: false,
    compatibilityClaimed: false,
    promotion: "not-applicable",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_724_726_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_724_726_SKIPPED_ROWS = freezeArray(
  privateAdmission724726SkippedRowData.map((sourceRow) =>
    skippedRow({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      skipReason: sourceRow.skipReason,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_724_726_ROWS = freezeArray(
  privateAdmission724726RowData.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      dependencyWorkerIds: sourceRow.dependencyWorkerIds,
      dependencyDiagnosticIds: sourceRow.dependencyDiagnosticIds,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_724_726_WORKERS = freezeArray(
  PRIVATE_ADMISSION_724_726_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission724726Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_724_726_ROWS.map((baseRow) => {
    const override = rowOverrides[baseRow.workerId] ?? {};
    return mergeRowOverride(baseRow, override);
  });
  const skippedRows = PRIVATE_ADMISSION_724_726_SKIPPED_ROWS.map((baseRow) => {
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
  const missingWorkerIds = PRIVATE_ADMISSION_724_726_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_724_726_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = manifestWorkerIds.filter(
    (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
  );
  const missingSkippedWorkerIds =
    PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS.filter(
      (workerId) => !skippedManifestWorkerIds.includes(workerId)
    );
  const unexpectedSkippedWorkerIds = skippedManifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS.includes(workerId)
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
  const skippedRuntimeCapabilityWorkerIds = evaluatedSkippedRows
    .filter(
      (evaluatedRow) =>
        evaluatedRow.privateAdmission !== "skipped-meta" ||
        evaluatedRow.runtimeCapabilityAdded !== false ||
        evaluatedRow.acceptedDiagnosticIds.length !== 0
    )
    .map((evaluatedRow) => evaluatedRow.workerId);
  const dependencyMismatches = evaluatedRows.flatMap((evaluatedRow) => {
    if (
      !Object.hasOwn(
        PRIVATE_ADMISSION_724_726_REQUIRED_DEPENDENCIES,
        evaluatedRow.workerId
      )
    ) {
      return [];
    }

    const expectedDependencyWorkerIds =
      PRIVATE_ADMISSION_724_726_REQUIRED_DEPENDENCIES[evaluatedRow.workerId];
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

  if (dependencyMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-dependency-mismatch", {
        rows: freezeArray(dependencyMismatches)
      })
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

  return freezeRecord({
    id: PRIVATE_ADMISSION_724_726_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_724_726_GATE_STATUS
        : PRIVATE_ADMISSION_724_726_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_724_726_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS,
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
      dependencyMismatches.length === 0,
    skipMetaRecognized:
      unrecognizedSkippedWorkerIds.length === 0 &&
      missingSkippedWorkerIds.length === 0 &&
      unexpectedSkippedWorkerIds.length === 0 &&
      duplicateSkippedWorkerIds.length === 0 &&
      skippedRuntimeCapabilityWorkerIds.length === 0,
    dependenciesRecognized: dependencyMismatches.length === 0,
    compatibilityClaimed:
      compatibilityClaimWorkerIds.length > 0 ||
      publicCompatibilityViolations.length > 0,
    publicCompatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    manifest: freezeRecord({
      expectedWorkerIds: PRIVATE_ADMISSION_724_726_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS,
      expectedSkippedWorkerIds: PRIVATE_ADMISSION_724_726_SKIPPED_WORKERS,
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
