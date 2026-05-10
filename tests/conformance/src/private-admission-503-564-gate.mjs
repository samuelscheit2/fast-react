import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS
} from "./react-dom-root-render-e2e-conformance-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_503_564_GATE_ID =
  "private-admission-503-564-local-gate-1";
export const PRIVATE_ADMISSION_503_564_GATE_STATUS =
  "recognized-accepted-private-diagnostics-503-564-public-compatibility-blocked";
export const PRIVATE_ADMISSION_503_564_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-503-564-with-violations";

export const PRIVATE_ADMISSION_503_564_PUBLIC_COMPATIBILITY_CLAIMS =
  Object.freeze([
    "publicRootCompatibilitySurface",
    "publicRenderCompatibilityClaimed",
    "publicRootRenderCompatibilityClaimed",
    "publicActCompatibilityClaimed",
    "publicHydrationCompatibilityClaimed",
    "publicEventCompatibilityClaimed",
    "publicResourceCompatibilityClaimed",
    "publicFormCompatibilityClaimed",
    "publicControlledInputCompatibilityClaimed",
    "publicTestRendererCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_503_564_BLOCKED_SURFACES = Object.freeze([
  "root",
  "render",
  "root-render",
  "act",
  "hydration",
  "event",
  "resource",
  "form",
  "controlled",
  "test-renderer"
]);

export const PRIVATE_ADMISSION_534_564_SKIPPED_WORKERS = Object.freeze([
  "worker-563-master-docs-accepted-history-compaction"
]);

const privateAdmission534564RowData = Object.freeze([
  rowData({
    workerId: "worker-534-root-work-loop-finished-work-commit-handoff",
    area: "root work-loop finished-work commit handoff",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "hostroot-finished-work-commit-handoff-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-534-root-work-loop-finished-work-commit-handoff.md",
    evidenceTokens: [
      "# Worker 534",
      "HostRoot finished-work-to-commit handoff diagnostic",
      "public rendering compatibility"
    ]
  }),
  rowData({
    workerId: "worker-535-lane-priority-root-scheduling-canary",
    area: "lane priority root scheduling diagnostics",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: ["root-lane-scheduling-snapshot"],
    evidencePath:
      "worker-progress/worker-535-lane-priority-root-scheduling-canary.md",
    evidenceTokens: [
      "# Worker 535",
      "RootLaneSchedulingSnapshot",
      "public scheduling compatibility"
    ]
  }),
  rowData({
    workerId: "worker-536-function-component-use-callback-gate",
    area: "function component useCallback update diagnostics",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "function-component-callback-update-diagnostic-record"
    ],
    evidencePath:
      "worker-progress/worker-536-function-component-use-callback-gate.md",
    evidenceTokens: [
      "# Worker 536",
      "private callback update diagnostic record",
      "public hook compatibility"
    ]
  }),
  rowData({
    workerId: "worker-537-layout-effect-metadata-gate",
    area: "layout effect mount/update metadata",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "function-component-layout-effect-mount-update-metadata"
    ],
    evidencePath: "worker-progress/worker-537-layout-effect-metadata-gate.md",
    evidenceTokens: [
      "# Worker 537",
      "private function-component layout effect metadata",
      "public effect compatibility"
    ]
  }),
  rowData({
    workerId: "worker-538-context-provider-update-lane-gate",
    area: "context provider update lane diagnostics",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: ["context-provider-update-lane-diagnostic"],
    evidencePath:
      "worker-progress/worker-538-context-provider-update-lane-gate.md",
    evidenceTokens: [
      "# Worker 538",
      "context provider update lane diagnostic",
      "public context compatibility"
    ]
  }),
  rowData({
    workerId: "worker-539-test-renderer-live-rust-root-create-preflight",
    area: "react-test-renderer live Rust root-create preflight",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-rust-root-create-preflight-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-539-test-renderer-live-rust-root-create-preflight.md",
    evidenceTokens: [
      "# Worker 539",
      "root-create preflight diagnostic",
      "public renderer root"
    ]
  }),
  rowData({
    workerId: "worker-540-test-renderer-tojson-update-unmount-refresh",
    area: "react-test-renderer toJSON update/unmount diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-tojson-update-unmount-host-output-diagnostics"
    ],
    evidencePath:
      "worker-progress/worker-540-test-renderer-tojson-update-unmount-refresh.md",
    evidenceTokens: [
      "# Worker 540",
      "toJSON diagnostics",
      "public serialization"
    ]
  }),
  rowData({
    workerId: "worker-541-test-renderer-act-nested-scope-blockers",
    area: "react-test-renderer act nested-scope blocker diagnostics",
    primaryCompatibilityArea: "act",
    acceptedDiagnosticIds: [
      "react-test-renderer-act-nested-scope-blocker-diagnostics"
    ],
    evidencePath:
      "worker-progress/worker-541-test-renderer-act-nested-scope-blockers.md",
    evidenceTokens: [
      "# Worker 541",
      "act nested-scope",
      "public act behavior"
    ]
  }),
  rowData({
    workerId: "worker-542-react-dom-facade-nested-host-output-update",
    area: "React DOM public facade nested host-output update diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "react-dom-facade-nested-host-output-update-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-542-react-dom-facade-nested-host-output-update.md",
    evidenceTokens: [
      "# Worker 542",
      "nested host-output update diagnostic",
      "public root facade remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-543-dom-input-change-event-extraction-preflight",
    area: "DOM input/change event extraction preflight",
    primaryCompatibilityArea: "event",
    acceptedDiagnosticIds: [
      "change-event-plugin-extraction-preflight-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-543-dom-input-change-event-extraction-preflight.md",
    evidenceTokens: [
      "# Worker 543",
      "ChangeEventPlugin extraction preflight diagnostic",
      "public React DOM event compatibility"
    ]
  }),
  rowData({
    workerId: "worker-544-dom-focus-blur-event-blocker-gate",
    area: "DOM focus/blur event blocker diagnostics",
    primaryCompatibilityArea: "event",
    acceptedDiagnosticIds: ["focus-blur-event-blocker-diagnostics"],
    evidencePath:
      "worker-progress/worker-544-dom-focus-blur-event-blocker-gate.md",
    evidenceTokens: [
      "# Worker 544",
      "focus/blur event blocker gate",
      "public/browser DOM compatibility"
    ]
  }),
  rowData({
    workerId: "worker-545-hydration-form-resource-boundary-refresh",
    area: "hydration form/resource accepted metadata diagnostics",
    primaryCompatibilityArea: "hydration",
    acceptedDiagnosticIds: [
      "hydration-form-resource-accepted-metadata-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-545-hydration-form-resource-boundary-refresh.md",
    evidenceTokens: [
      "# Worker 545",
      "private accepted-metadata diagnostic",
      "promoting hydration or root-render compatibility"
    ]
  }),
  rowData({
    workerId: "worker-546-resource-script-module-preinit-gate",
    area: "resource script/modulepreload/preinit diagnostics",
    primaryCompatibilityArea: "resource",
    acceptedDiagnosticIds: [
      "resource-script-module-preinit-private-diagnostics"
    ],
    evidencePath:
      "worker-progress/worker-546-resource-script-module-preinit-gate.md",
    evidenceTokens: [
      "# Worker 546",
      "private, record-only diagnostics for script, modulepreload, and",
      "resource compatibility"
    ]
  }),
  rowData({
    workerId: "worker-547-controlled-restore-queue-write-execution-gate",
    area: "controlled restore queue write execution diagnostics",
    primaryCompatibilityArea: "controlled",
    acceptedDiagnosticIds: [
      "controlled-restore-queue-write-execution-gate"
    ],
    evidencePath:
      "worker-progress/worker-547-controlled-restore-queue-write-execution-gate.md",
    evidenceTokens: [
      "# Worker 547",
      "controlled post-event restore queue write execution gate",
      "public controlled-input compatibility"
    ]
  }),
  rowData({
    workerId: "worker-548-controlled-restore-flush-execution-blocker",
    area: "controlled restore flush execution blocker diagnostics",
    primaryCompatibilityArea: "controlled",
    acceptedDiagnosticIds: [
      "controlled-restore-flush-execution-blocker-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-548-controlled-restore-flush-execution-blocker.md",
    evidenceTokens: [
      "# Worker 548",
      "private flush-blocker record path",
      "public controlled behavior blocked"
    ]
  }),
  rowData({
    workerId: "worker-549-form-action-formdata-blocker-diagnostic",
    area: "form action FormData blocker diagnostics",
    primaryCompatibilityArea: "form",
    acceptedDiagnosticIds: ["form-action-formdata-blocker-diagnostic"],
    evidencePath:
      "worker-progress/worker-549-form-action-formdata-blocker-diagnostic.md",
    evidenceTokens: [
      "# Worker 549",
      "form-action diagnostic gate",
      "Public form action behavior remains intentionally blocked"
    ]
  }),
  rowData({
    workerId: "worker-550-scheduler-mock-frame-budget-gate",
    area: "Scheduler mock frame-budget diagnostics",
    primaryCompatibilityArea: "act",
    acceptedDiagnosticIds: [
      "fast-react.scheduler.mock-frame-budget-diagnostics"
    ],
    evidencePath:
      "worker-progress/worker-550-scheduler-mock-frame-budget-gate.md",
    evidenceTokens: [
      "# Worker 550",
      "mock-frame-budget-diagnostics",
      "Public Scheduler timing"
    ]
  }),
  rowData({
    workerId: "worker-551-scheduler-post-task-delay-abort-refresh",
    area: "Scheduler postTask delay plus abort diagnostics",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "scheduler-post-task-delay-abort-ordering-diagnostics"
    ],
    evidencePath:
      "worker-progress/worker-551-scheduler-post-task-delay-abort-refresh.md",
    evidenceTokens: [
      "# Worker 551",
      "__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__",
      "browser compatibility claims remain"
    ]
  }),
  rowData({
    workerId: "worker-552-native-json-batch-response-sequence",
    area: "native JSON batch response sequence diagnostics",
    primaryCompatibilityArea: "root",
    acceptedDiagnosticIds: [
      "native-json-batch-response-sequence-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-552-native-json-batch-response-sequence.md",
    evidenceTokens: [
      "# Worker 552",
      "batch response sequence diagnostic",
      "blocked native execution flags"
    ]
  }),
  rowData({
    workerId: "worker-553-package-surface-private-audit-503-533",
    area: "package surface private audit for 503-533",
    primaryCompatibilityArea: "root",
    acceptedDiagnosticIds: [
      "package-surface-private-audit-503-533-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-553-package-surface-private-audit-503-533.md",
    evidenceTokens: [
      "# Worker 553",
      "private facade symbols",
      "public exports"
    ]
  }),
  rowData({
    workerId: "worker-554-benchmark-private-canaries-503-533",
    area: "benchmark private diagnostic canaries for 503-533",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: ["private-503-533-diagnostic-canaries"],
    evidencePath:
      "worker-progress/worker-554-benchmark-private-canaries-503-533.md",
    evidenceTokens: [
      "# Worker 554",
      "private-503-533-diagnostic-canaries",
      "public-promotion milestone"
    ]
  }),
  rowData({
    workerId: "worker-555-conformance-public-facade-refresh-503-533",
    area: "public facade private promotion rejection rows for 503-533",
    primaryCompatibilityArea: "root",
    acceptedDiagnosticIds: [
      "public-facade-private-promotion-503-533-blocked-gate"
    ],
    evidencePath:
      "worker-progress/worker-555-conformance-public-facade-refresh-503-533.md",
    evidenceTokens: [
      "# Worker 555",
      "public-promotion rejection rows",
      "public compatibility"
    ]
  }),
  rowData({
    workerId: "worker-556-root-render-e2e-private-metadata-503-533",
    area: "root-render E2E private React DOM metadata admissions for 503-533",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "root-render-e2e-private-react-dom-metadata-503-533"
    ],
    evidencePath:
      "worker-progress/worker-556-root-render-e2e-private-metadata-503-533.md",
    evidenceTokens: [
      "# Worker 556",
      "root-render E2E private React DOM metadata gate",
      "Public root render"
    ]
  }),
  rowData({
    workerId: "worker-557-react-hook-dispatcher-transition-blockers",
    area: "React hook dispatcher transition blockers",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "transition-hook-dispatcher-blocker-metadata"
    ],
    evidencePath:
      "worker-progress/worker-557-react-hook-dispatcher-transition-blockers.md",
    evidenceTokens: [
      "# Worker 557",
      "transition-hook dispatcher blocker metadata",
      "public transition behavior"
    ]
  }),
  rowData({
    workerId: "worker-558-suspense-thenable-ping-blocker-refresh",
    area: "Suspense thenable ping blocker diagnostics",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: ["unsupported-thenable-ping-blocker-record"],
    evidencePath:
      "worker-progress/worker-558-suspense-thenable-ping-blocker-refresh.md",
    evidenceTokens: [
      "# Worker 558",
      "UnsupportedThenablePingBlockerRecord",
      "Suspense rendering compatibility"
    ]
  }),
  rowData({
    workerId: "worker-559-offscreen-visibility-transition-blocker",
    area: "Offscreen visibility transition blocker diagnostics",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "offscreen-visibility-transition-blocker-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-559-offscreen-visibility-transition-blocker.md",
    evidenceTokens: [
      "# Worker 559",
      "Offscreen visibility transition blocker",
      "public compatibility blocked"
    ]
  }),
  rowData({
    workerId: "worker-560-portal-nested-event-propagation-refresh",
    area: "portal nested event propagation diagnostics",
    primaryCompatibilityArea: "event",
    acceptedDiagnosticIds: [
      "portal-nested-event-propagation-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-560-portal-nested-event-propagation-refresh.md",
    evidenceTokens: [
      "# Worker 560",
      "portal owner-root event gate",
      "public portal event bubbling"
    ]
  }),
  rowData({
    workerId: "worker-561-dom-style-object-diff-private-gate",
    area: "DOM style object diff private diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: ["dom-style-object-diff-private-diagnostic"],
    evidencePath:
      "worker-progress/worker-561-dom-style-object-diff-private-gate.md",
    evidenceTokens: [
      "# Worker 561",
      "DOM style object diff diagnostic",
      "public React DOM style compatibility"
    ]
  }),
  rowData({
    workerId: "worker-562-dom-dangerous-html-text-reset-gate",
    area: "DOM dangerous HTML text reset diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "dom-dangerous-html-text-reset-private-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-562-dom-dangerous-html-text-reset-gate.md",
    evidenceTokens: [
      "# Worker 562",
      "dangerouslySetInnerHTML",
      "false public compatibility"
    ]
  }),
  rowData({
    workerId: "worker-564-react-clone-element-child-array-freeze",
    area: "React cloneElement child array freeze oracle admission",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "react-clone-element-child-array-freeze-known-mismatch"
    ],
    evidencePath:
      "worker-progress/worker-564-react-clone-element-child-array-freeze.md",
    evidenceTokens: [
      "# Worker 564",
      "cloneElement",
      "compatibility-claimed flags false"
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

function admissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_503_564_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
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
  sourceQueue,
  acceptedDiagnosticIds,
  evidence: evidenceRows,
  publicCompatibilityClaims,
  sourcePromotionRowId = null
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue,
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-503-564-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    sourcePromotionRowId,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_503_564_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_503_533_ROWS = freezeArray(
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.map((sourceRow) =>
    row({
      workerId: sourceRow.id,
      area: `${sourceRow.category} accepted private promotion blocker`,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      sourceQueue: "503-533",
      acceptedDiagnosticIds: sourceRow.acceptedPrivateMetadataIds,
      evidence: [
        evidence(
          "tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs",
          [sourceRow.id, ...sourceRow.acceptedPrivateMetadataIds]
        )
      ],
      publicCompatibilityClaims: admissionClaims(
        sourceRow.publicCompatibilityClaims
      ),
      sourcePromotionRowId: sourceRow.id
    })
  )
);

export const PRIVATE_ADMISSION_534_564_ROWS = freezeArray(
  privateAdmission534564RowData.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      sourceQueue: "534-564",
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      evidence: [evidence(sourceRow.evidencePath, sourceRow.evidenceTokens)],
      publicCompatibilityClaims: admissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_503_564_ROWS = freezeArray([
  ...PRIVATE_ADMISSION_503_533_ROWS,
  ...PRIVATE_ADMISSION_534_564_ROWS
]);

export const PRIVATE_ADMISSION_503_533_WORKERS = freezeArray(
  PRIVATE_ADMISSION_503_533_ROWS.map((row) => row.workerId)
);
export const PRIVATE_ADMISSION_534_564_WORKERS = freezeArray(
  PRIVATE_ADMISSION_534_564_ROWS.map((row) => row.workerId)
);
export const PRIVATE_ADMISSION_503_564_WORKERS = freezeArray(
  PRIVATE_ADMISSION_503_564_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission503564Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_503_564_ROWS.map((baseRow) => {
    const override = rowOverrides[baseRow.workerId] ?? {};
    return freezeRecord({
      ...baseRow,
      ...override,
      publicCompatibilityClaims: freezeRecord({
        ...baseRow.publicCompatibilityClaims,
        ...(override.publicCompatibilityClaims ?? {})
      })
    });
  });
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((baseRow) => baseRow.workerId);
  const missingWorkerIds = PRIVATE_ADMISSION_503_564_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_503_564_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = manifestWorkerIds.filter(
    (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
  );
  const unrecognizedWorkerIds = evaluatedRows
    .filter((evaluatedRow) => evaluatedRow.recognized !== true)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const compatibilityClaimWorkerIds = evaluatedRows
    .filter((evaluatedRow) => evaluatedRow.compatibilityClaimed !== false)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const publicCompatibilityViolations = evaluatedRows.flatMap((evaluatedRow) =>
    evaluatedRow.publicCompatibilityViolations.map((claimId) =>
      `${evaluatedRow.workerId}.${claimId}`
    )
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

  if (unrecognizedWorkerIds.length > 0) {
    violations.push(
      createViolation("required-private-diagnostic-not-recognized", {
        workerIds: unrecognizedWorkerIds
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
    id: PRIVATE_ADMISSION_503_564_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_503_564_GATE_STATUS
        : PRIVATE_ADMISSION_503_564_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_503_564_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_534_564_SKIPPED_WORKERS,
    rows: evaluatedRows,
    rowsByWorker: freezeRecord(
      Object.fromEntries(
        evaluatedRows.map((evaluatedRow) => [
          evaluatedRow.workerId,
          evaluatedRow
        ])
      )
    ),
    recognizedWorkerIds: evaluatedRows
      .filter((evaluatedRow) => evaluatedRow.recognized === true)
      .map((evaluatedRow) => evaluatedRow.workerId),
    privateDiagnosticsRecognized:
      unrecognizedWorkerIds.length === 0 &&
      missingWorkerIds.length === 0 &&
      unexpectedWorkerIds.length === 0 &&
      duplicateWorkerIds.length === 0,
    compatibilityClaimed:
      compatibilityClaimWorkerIds.length > 0 ||
      publicCompatibilityViolations.length > 0,
    publicCompatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    manifest: freezeRecord({
      expectedWorkerIds: PRIVATE_ADMISSION_503_564_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_534_564_SKIPPED_WORKERS
    }),
    violations: freezeArray(violations)
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
  const source = readWorkspaceFile({ fileCache, workspaceRoot, path: evidenceRow.path });
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
