import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_715_721_GATE_ID =
  "private-admission-715-721-local-gate-1";
export const PRIVATE_ADMISSION_715_721_GATE_STATUS =
  "recognized-accepted-private-diagnostics-715-721-public-compatibility-blocked";
export const PRIVATE_ADMISSION_715_721_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-715-721-with-violations";

export const PRIVATE_ADMISSION_715_721_PUBLIC_COMPATIBILITY_CLAIMS =
  Object.freeze([
    "publicRootCompatibilitySurface",
    "publicRenderCompatibilityClaimed",
    "publicRootRenderCompatibilityClaimed",
    "publicRootUpdateCompatibilityClaimed",
    "publicRootUnmountCompatibilityClaimed",
    "publicFlushSyncCompatibilityClaimed",
    "publicActCompatibilityClaimed",
    "publicHookCompatibilityClaimed",
    "publicEffectCompatibilityClaimed",
    "publicTestRendererCompatibilityClaimed",
    "publicTestRendererSerializationCompatibilityClaimed",
    "publicTestRendererRootCompatibilityClaimed",
    "publicTestRendererTestInstanceCompatibilityClaimed",
    "publicTestRendererNativeBridgeCompatibilityClaimed",
    "publicNativeCompatibilityClaimed",
    "publicBrowserDomCompatibilityClaimed",
    "publicTextContentCompatibilityClaimed",
    "publicDangerousHtmlCompatibilityClaimed",
    "publicHydrationCompatibilityClaimed",
    "publicEventCompatibilityClaimed",
    "publicRefCompatibilityClaimed",
    "publicResourceCompatibilityClaimed",
    "publicFormCompatibilityClaimed",
    "publicControlledInputCompatibilityClaimed",
    "publicSchedulerCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_715_721_BLOCKED_SURFACES = Object.freeze([
  "root",
  "render",
  "root-render",
  "root-update",
  "root-unmount",
  "flush-sync",
  "act",
  "hooks",
  "effects",
  "test-renderer",
  "test-renderer-serialization",
  "test-renderer-root",
  "test-renderer-testinstance",
  "test-renderer-native-bridge",
  "native",
  "browser-dom",
  "text-content",
  "dangerous-html",
  "hydration",
  "events",
  "refs",
  "resources",
  "forms",
  "controlled-inputs",
  "scheduler"
]);

export const PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS = Object.freeze([
  "worker-715-clippy-gate-refresh",
  "worker-716-package-private-admission-audit-685-714"
]);

const privateAdmission715721SkippedRowData = Object.freeze([
  skippedRowData({
    workerId: "worker-715-clippy-gate-refresh",
    area: "Rust clippy gate refresh maintenance",
    skipReason: "maintenance-only-no-new-runtime-capability",
    evidencePath: "worker-progress/worker-715-clippy-gate-refresh.md",
    evidenceTokens: [
      "# Worker 715 - Clippy Gate Refresh",
      "mechanical lint maintenance",
      "Public behavior and private canary evidence semantics are being preserved"
    ]
  }),
  skippedRowData({
    workerId: "worker-716-package-private-admission-audit-685-714",
    area: "previous private-admission ledger audit",
    skipReason: "previous-ledger-audit-no-new-runtime-capability",
    evidencePath:
      "worker-progress/worker-716-package-private-admission-audit-685-714.md",
    evidenceTokens: [
      "# Worker 716: Package Private Admission Audit 685-714",
      "Scope stayed limited to conformance private-admission source/tests",
      "No product/runtime code"
    ]
  })
]);

const privateAdmission715721RowData = Object.freeze([
  rowData({
    workerId: "worker-717-root-work-loop-finished-work-commit-entrypoint",
    area: "root work-loop finished-work commit entrypoint diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "root-work-loop-finished-work-commit-entrypoint",
      "host-root-finished-work-commit-entrypoint-private-handoff"
    ],
    evidencePath:
      "worker-progress/worker-717-root-work-loop-finished-work-commit-entrypoint.md",
    evidenceTokens: [
      "# Worker 717: Root Work Loop Finished Work Commit Entrypoint",
      "private Rust canary evidence",
      "does not enable public root rendering"
    ]
  }),
  rowData({
    workerId: "worker-718-sync-flush-root-scheduler-finished-work-handoff",
    area: "sync-flush/root-scheduler finished-work handoff diagnostics",
    primaryCompatibilityArea: "flush-sync",
    acceptedDiagnosticIds: [
      "sync-flush-root-scheduler-finished-work-handoff",
      "root-scheduler-sync-continuation-finished-work-identity"
    ],
    evidencePath:
      "worker-progress/worker-718-sync-flush-root-scheduler-finished-work-handoff.md",
    evidenceTokens: [
      "# Worker 718 - Sync Flush Root Scheduler Finished Work Handoff",
      "Strengthened the private sync-flush/root-scheduler finished-work handoff",
      "Preserved Worker 717 public blockers"
    ]
  }),
  rowData({
    workerId: "worker-719-function-effect-destroy-handle-persistence",
    area: "function effect destroy handle persistence diagnostics",
    primaryCompatibilityArea: "effects",
    acceptedDiagnosticIds: [
      "function-effect-destroy-handle-persistence",
      "previous-effect-destroy-handle-private-handoff"
    ],
    evidencePath:
      "worker-progress/worker-719-function-effect-destroy-handle-persistence.md",
    evidenceTokens: [
      "# Worker 719: Function Effect Destroy Handle Persistence",
      "renderer compatibility remain blocked.",
      "test-controlled passive create returned destroy"
    ]
  }),
  rowData({
    workerId: "worker-720-test-renderer-serialization-finished-work-identity",
    area: "react-test-renderer serialization finished-work identity diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-serialization-finished-work-identity",
      "private-tojson-totree-finished-work-identity-validation"
    ],
    evidencePath:
      "worker-progress/worker-720-test-renderer-serialization-finished-work-identity.md",
    evidenceTokens: [
      "# Worker 720 - test renderer serialization finished-work identity",
      "validateAcceptedFinishedWorkIdentity",
      "Public `create().toJSON`, `create().toTree`, `.root`, `TestInstance`, native bridge execution, and compatibility claims must stay blocked."
    ]
  }),
  rowData({
    workerId: "worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate",
    area: "DOM text reset / dangerousHTML fake-DOM execution diagnostics",
    primaryCompatibilityArea: "dangerous-html",
    acceptedDiagnosticIds: [
      "dom-text-reset-dangerous-html-fake-dom-execution",
      "dangerous-html-text-reset-private-fake-dom-admission"
    ],
    evidencePath:
      "worker-progress/worker-721-dom-text-reset-dangerous-html-fake-dom-execution-gate.md",
    evidenceTokens: [
      "# Worker 721: DOM Text Reset / Dangerous HTML Fake-DOM Execution Gate",
      "private fake-DOM execution path",
      "browser DOM compatibility blocked.",
      "WeakSet admission"
    ]
  })
]);

function rowData(data) {
  return freezeRecord({
    ...data,
    acceptedDiagnosticIds: freezeArray(data.acceptedDiagnosticIds),
    evidenceTokens: freezeArray(data.evidenceTokens)
  });
}

function skippedRowData(data) {
  return freezeRecord({
    ...data,
    evidenceTokens: freezeArray(data.evidenceTokens)
  });
}

function admissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_715_721_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function evidence(path, tokens) {
  return freezeRecord({
    path,
    tokens: freezeArray(tokens)
  });
}

function row({
  workerId,
  area,
  primaryCompatibilityArea,
  acceptedDiagnosticIds,
  evidence: evidenceRows,
  publicCompatibilityClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "715-721",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-715-721-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    runtimeCapabilityAdded: true,
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_715_721_BLOCKED_SURFACES,
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
    sourceQueue: "715-721",
    privateAdmission: "skipped-meta",
    localGateCoverage: "private-admission-715-721-local-gate",
    acceptedDiagnosticIds: freezeArray([]),
    evidence: freezeArray(evidenceRows),
    runtimeCapabilityAdded: false,
    compatibilityClaimed: false,
    promotion: "not-applicable",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_715_721_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_715_721_SKIPPED_ROWS = freezeArray(
  privateAdmission715721SkippedRowData.map((sourceRow) =>
    skippedRow({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      skipReason: sourceRow.skipReason,
      evidence: [evidence(sourceRow.evidencePath, sourceRow.evidenceTokens)],
      publicCompatibilityClaims: admissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_715_721_ROWS = freezeArray(
  privateAdmission715721RowData.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      evidence: [evidence(sourceRow.evidencePath, sourceRow.evidenceTokens)],
      publicCompatibilityClaims: admissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_715_721_WORKERS = freezeArray(
  PRIVATE_ADMISSION_715_721_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission715721Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_715_721_ROWS.map((baseRow) => {
    const override = rowOverrides[baseRow.workerId] ?? {};
    return mergeRowOverride(baseRow, override);
  });
  const skippedRows = PRIVATE_ADMISSION_715_721_SKIPPED_ROWS.map((baseRow) => {
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
  const missingWorkerIds = PRIVATE_ADMISSION_715_721_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_715_721_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = manifestWorkerIds.filter(
    (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
  );
  const missingSkippedWorkerIds =
    PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS.filter(
      (workerId) => !skippedManifestWorkerIds.includes(workerId)
    );
  const unexpectedSkippedWorkerIds = skippedManifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS.includes(workerId)
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
    id: PRIVATE_ADMISSION_715_721_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_715_721_GATE_STATUS
        : PRIVATE_ADMISSION_715_721_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_715_721_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS,
    rows: evaluatedRows,
    skippedRows: evaluatedSkippedRows,
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
    recognizedWorkerIds: evaluatedRows
      .filter((evaluatedRow) => evaluatedRow.recognized === true)
      .map((evaluatedRow) => evaluatedRow.workerId),
    recognizedSkippedWorkerIds: evaluatedSkippedRows
      .filter((evaluatedRow) => evaluatedRow.recognized === true)
      .map((evaluatedRow) => evaluatedRow.workerId),
    privateDiagnosticsRecognized:
      unrecognizedWorkerIds.length === 0 &&
      missingWorkerIds.length === 0 &&
      unexpectedWorkerIds.length === 0 &&
      duplicateWorkerIds.length === 0,
    skipMetaRecognized:
      unrecognizedSkippedWorkerIds.length === 0 &&
      missingSkippedWorkerIds.length === 0 &&
      unexpectedSkippedWorkerIds.length === 0 &&
      duplicateSkippedWorkerIds.length === 0 &&
      skippedRuntimeCapabilityWorkerIds.length === 0,
    compatibilityClaimed:
      compatibilityClaimWorkerIds.length > 0 ||
      publicCompatibilityViolations.length > 0,
    publicCompatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    manifest: freezeRecord({
      expectedWorkerIds: PRIVATE_ADMISSION_715_721_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS,
      expectedSkippedWorkerIds: PRIVATE_ADMISSION_715_721_SKIPPED_WORKERS,
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
    path: evidenceRow.path,
    tokens: evidenceRow.tokens,
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
