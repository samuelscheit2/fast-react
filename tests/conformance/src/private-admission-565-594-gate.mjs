import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_565_594_GATE_ID =
  "private-admission-565-594-local-gate-1";
export const PRIVATE_ADMISSION_565_594_GATE_STATUS =
  "recognized-accepted-private-diagnostics-565-594-public-compatibility-blocked";
export const PRIVATE_ADMISSION_565_594_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-565-594-with-violations";

export const PRIVATE_ADMISSION_565_594_PUBLIC_COMPATIBILITY_CLAIMS =
  Object.freeze([
    "publicRootCompatibilitySurface",
    "publicRenderCompatibilityClaimed",
    "publicRootRenderCompatibilityClaimed",
    "publicRootUpdateCompatibilityClaimed",
    "publicRootUnmountCompatibilityClaimed",
    "publicActCompatibilityClaimed",
    "publicHydrationCompatibilityClaimed",
    "publicEventCompatibilityClaimed",
    "publicResourceCompatibilityClaimed",
    "publicFormCompatibilityClaimed",
    "publicControlledInputCompatibilityClaimed",
    "publicTestRendererCompatibilityClaimed",
    "publicSchedulerCompatibilityClaimed",
    "publicNativeCompatibilityClaimed",
    "publicHookCompatibilityClaimed",
    "publicSuspenseOffscreenCompatibilityClaimed",
    "publicElementCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_565_594_BLOCKED_SURFACES = Object.freeze([
  "root",
  "render",
  "root-render",
  "root-update",
  "root-unmount",
  "act",
  "hydration",
  "event",
  "resource",
  "form",
  "controlled",
  "test-renderer",
  "scheduler",
  "native",
  "hooks",
  "suspense-offscreen",
  "element"
]);

export const PRIVATE_ADMISSION_565_594_SKIPPED_WORKERS = Object.freeze([
  "worker-590-package-surface-audit-534-564",
  "worker-591-benchmark-canaries-534-564",
  "worker-592-conformance-private-admission-refresh-534-564",
  "worker-593-root-render-e2e-real-handoff-gate",
  "worker-594-worker-launcher-status-ledger"
]);

const privateAdmission565594RowData = Object.freeze([
  rowData({
    workerId: "worker-565-root-commit-finished-work-execution-gate",
    area: "root commit finished-work execution diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "root-commit-finished-work-execution",
      "finished-work-stale-rejection"
    ],
    evidencePath:
      "worker-progress/worker-565-root-commit-finished-work-execution-gate.md",
    evidenceTokens: [
      "# Worker 565",
      "HostRoot finished-work commit execution request",
      "public root rendering"
    ]
  }),
  rowData({
    workerId: "worker-566-root-scheduler-transition-lane-routing",
    area: "root scheduler transition-lane routing diagnostics",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "transition-lane-routing",
      "transition-lane-rejection"
    ],
    evidencePath:
      "worker-progress/worker-566-root-scheduler-transition-lane-routing.md",
    evidenceTokens: [
      "# Worker 566",
      "private root-scheduler transition routing record",
      "public update scheduling claims"
    ]
  }),
  rowData({
    workerId: "worker-567-host-root-update-queue-callback-order",
    area: "HostRoot update queue callback-order diagnostics",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "hostroot-callback-order",
      "stale-queue-snapshot"
    ],
    evidencePath:
      "worker-progress/worker-567-host-root-update-queue-callback-order.md",
    evidenceTokens: [
      "# Worker 567",
      "HostRoot queued-callback order diagnostics",
      "public callback compatibility"
    ]
  }),
  rowData({
    workerId: "worker-568-function-component-reducer-dispatch-queue",
    area: "function component reducer dispatch queue diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "reducer-dispatch-queue",
      "dispatch-handle-validation"
    ],
    evidencePath:
      "worker-progress/worker-568-function-component-reducer-dispatch-queue.md",
    evidenceTokens: [
      "# Worker 568",
      "private reducer dispatch queue diagnostic",
      "public `useReducer` compatibility"
    ]
  }),
  rowData({
    workerId: "worker-569-effect-list-commit-phase-order",
    area: "effect-list commit phase ordering diagnostics",
    primaryCompatibilityArea: "render",
    acceptedDiagnosticIds: [
      "effect-list-commit-phase-order",
      "passive-order-rejection"
    ],
    evidencePath:
      "worker-progress/worker-569-effect-list-commit-phase-order.md",
    evidenceTokens: [
      "# Worker 569",
      "effect-list commit phase order",
      "public act execution"
    ]
  }),
  rowData({
    workerId: "worker-570-context-multi-provider-lane-propagation",
    area: "context multi-provider lane propagation diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "context-multi-provider-lanes",
      "sibling-provider-lanes"
    ],
    evidencePath:
      "worker-progress/worker-570-context-multi-provider-lane-propagation.md",
    evidenceTokens: [
      "# Worker 570",
      "multiple providers and consumer lane propagation",
      "Public context compatibility remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-571-suspense-retry-root-scheduler-link",
    area: "Suspense retry root scheduler diagnostics",
    primaryCompatibilityArea: "suspense-offscreen",
    acceptedDiagnosticIds: [
      "suspense-retry-root-scheduler",
      "offscreen-retry-rejection"
    ],
    evidencePath:
      "worker-progress/worker-571-suspense-retry-root-scheduler-link.md",
    evidenceTokens: [
      "# Worker 571",
      "private root scheduler retry request record",
      "public Suspense compatibility"
    ]
  }),
  rowData({
    workerId: "worker-572-offscreen-visibility-complete-work-bubble",
    area: "Offscreen complete-work visibility bubbling diagnostics",
    primaryCompatibilityArea: "suspense-offscreen",
    acceptedDiagnosticIds: [
      "offscreen-complete-work-bubble",
      "visibility-blocker"
    ],
    evidencePath:
      "worker-progress/worker-572-offscreen-visibility-complete-work-bubble.md",
    evidenceTokens: [
      "# Worker 572",
      "complete-work Offscreen visibility blocker",
      "visibility effect scheduling"
    ]
  }),
  rowData({
    workerId: "worker-573-test-renderer-private-root-work-loop-preflight",
    area: "react-test-renderer root-create work-loop preflight diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-root-create-work-loop-preflight"
    ],
    evidencePath:
      "worker-progress/worker-573-test-renderer-private-root-work-loop-preflight.md",
    evidenceTokens: [
      "# Worker 573",
      "root-create work-loop",
      "public create"
    ]
  }),
  rowData({
    workerId: "worker-574-test-renderer-update-via-root-work-loop",
    area: "react-test-renderer update route work-loop diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-update-root-work-loop-route"
    ],
    evidencePath:
      "worker-progress/worker-574-test-renderer-update-via-root-work-loop.md",
    evidenceTokens: [
      "# Worker 574",
      "private test-renderer update diagnostics",
      "Public `create().update`"
    ]
  }),
  rowData({
    workerId: "worker-575-test-renderer-unmount-deletion-commit-link",
    area: "react-test-renderer unmount deletion commit diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-unmount-deletion-commit"
    ],
    evidencePath:
      "worker-progress/worker-575-test-renderer-unmount-deletion-commit-link.md",
    evidenceTokens: [
      "# Worker 575",
      "unmount deletion-commit handoff diagnostic",
      "public root unmount compatibility"
    ]
  }),
  rowData({
    workerId: "worker-576-test-renderer-act-private-root-passive-sequence",
    area: "react-test-renderer act root/passive sequencing diagnostics",
    primaryCompatibilityArea: "act",
    acceptedDiagnosticIds: [
      "test-renderer-act-root-passive-sequence"
    ],
    evidencePath:
      "worker-progress/worker-576-test-renderer-act-private-root-passive-sequence.md",
    evidenceTokens: [
      "# Worker 576",
      "react-test-renderer `act` sequence",
      "callback execution"
    ]
  }),
  rowData({
    workerId: "worker-577-test-renderer-nested-tojson-update-refresh",
    area: "react-test-renderer nested toJSON update diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-tojson-nested-row",
      "test-renderer-tojson-sibling-text-row"
    ],
    evidencePath:
      "worker-progress/worker-577-test-renderer-nested-tojson-update-refresh.md",
    evidenceTokens: [
      "# Worker 577",
      "toJSON host-output row shape diagnostics",
      "public `toJSON`"
    ]
  }),
  rowData({
    workerId: "worker-578-react-dom-root-facade-root-work-loop-link",
    area: "React DOM root facade root work-loop handoff diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "react-dom-facade-root-work-loop-link"
    ],
    evidencePath:
      "worker-progress/worker-578-react-dom-root-facade-root-work-loop-link.md",
    evidenceTokens: [
      "# Worker 578",
      "root work-loop finished-work handoff record",
      "Public `createRoot`"
    ]
  }),
  rowData({
    workerId: "worker-579-dom-style-payload-fake-dom-commit-link",
    area: "DOM style fake-DOM commit metadata diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "dom-style-fake-dom-commit-link"
    ],
    evidencePath:
      "worker-progress/worker-579-dom-style-payload-fake-dom-commit-link.md",
    evidenceTokens: [
      "# Worker 579",
      "style fake-DOM commit metadata",
      "public style compatibility"
    ]
  }),
  rowData({
    workerId: "worker-580-dom-dangerous-html-fake-dom-commit-link",
    area: "DOM dangerousHTML/text-reset fake-DOM commit diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "dom-dangerous-html-fake-dom-commit-link",
      "dom-text-reset-fake-dom-commit-link"
    ],
    evidencePath:
      "worker-progress/worker-580-dom-dangerous-html-fake-dom-commit-link.md",
    evidenceTokens: [
      "# Worker 580",
      "dangerousHTML/text-reset diagnostic payloads",
      "public root execution"
    ]
  }),
  rowData({
    workerId: "worker-581-dom-change-event-controlled-restore-link",
    area: "DOM input/change event to controlled restore bridge diagnostics",
    primaryCompatibilityArea: "event",
    acceptedDiagnosticIds: [
      "dom-change-controlled-restore-bridge"
    ],
    evidencePath:
      "worker-progress/worker-581-dom-change-event-controlled-restore-link.md",
    evidenceTokens: [
      "# Worker 581",
      "input/change extraction preflight gate",
      "DOM mutation blocked"
    ]
  }),
  rowData({
    workerId: "worker-582-controlled-restore-wrapper-mutation-intent",
    area: "controlled restore wrapper mutation intent diagnostics",
    primaryCompatibilityArea: "controlled",
    acceptedDiagnosticIds: [
      "controlled-restore-wrapper-mutation-intent"
    ],
    evidencePath:
      "worker-progress/worker-582-controlled-restore-wrapper-mutation-intent.md",
    evidenceTokens: [
      "# Worker 582",
      "wrapper mutation-intent gate",
      "public compatibility claim"
    ]
  }),
  rowData({
    workerId: "worker-583-hydration-replay-target-dispatch-link",
    area: "hydration replay target dispatch diagnostics",
    primaryCompatibilityArea: "hydration",
    acceptedDiagnosticIds: [
      "hydration-replay-target-dispatch-link"
    ],
    evidencePath:
      "worker-progress/worker-583-hydration-replay-target-dispatch-link.md",
    evidenceTokens: [
      "# Worker 583",
      "FastReactDomHydrationReplayTargetDispatchLinkDiagnostic",
      "public compatibility"
    ]
  }),
  rowData({
    workerId: "worker-584-resource-modulepreload-order-commit-gate",
    area: "resource modulepreload/preinitModule commit order diagnostics",
    primaryCompatibilityArea: "resource",
    acceptedDiagnosticIds: [
      "resource-modulepreload-order-commit",
      "module-dedupe-key-rows"
    ],
    evidencePath:
      "worker-progress/worker-584-resource-modulepreload-order-commit-gate.md",
    evidenceTokens: [
      "# Worker 584",
      "modulepreload/preinitModule/script ordering evidence",
      "React DOM compatibility"
    ]
  }),
  rowData({
    workerId: "worker-585-scheduler-mock-expired-lane-flush",
    area: "Scheduler mock expired lane flush diagnostics",
    primaryCompatibilityArea: "scheduler",
    acceptedDiagnosticIds: [
      "scheduler-mock-expired-lane-flush"
    ],
    evidencePath:
      "worker-progress/worker-585-scheduler-mock-expired-lane-flush.md",
    evidenceTokens: [
      "# Worker 585",
      "expired-lane flush diagnostics",
      "public act draining"
    ]
  }),
  rowData({
    workerId: "worker-586-scheduler-posttask-root-continuation-link",
    area: "Scheduler postTask root continuation metadata diagnostics",
    primaryCompatibilityArea: "scheduler",
    acceptedDiagnosticIds: [
      "scheduler-posttask-root-continuation"
    ],
    evidencePath:
      "worker-progress/worker-586-scheduler-posttask-root-continuation-link.md",
    evidenceTokens: [
      "# Worker 586",
      "private Scheduler postTask root-continuation metadata helper",
      "public scheduler exports"
    ]
  }),
  rowData({
    workerId: "worker-587-native-json-stream-batch-roundtrip",
    area: "native JSON stream batch roundtrip diagnostics",
    primaryCompatibilityArea: "native",
    acceptedDiagnosticIds: [
      "native-json-stream-batch-roundtrip",
      "stream-chunk-rejection"
    ],
    evidencePath:
      "worker-progress/worker-587-native-json-stream-batch-roundtrip.md",
    evidenceTokens: [
      "# Worker 587",
      "stream batch roundtrip diagnostic",
      "public native compatibility"
    ]
  }),
  rowData({
    workerId: "worker-588-react-transition-dispatcher-routing",
    area: "React transition dispatcher routing diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "react-transition-dispatcher-routing"
    ],
    evidencePath:
      "worker-progress/worker-588-react-transition-dispatcher-routing.md",
    evidenceTokens: [
      "# Worker 588",
      "startTransition` routing diagnostic",
      "compatibility claims blocked"
    ]
  }),
  rowData({
    workerId: "worker-589-react-key-ref-warning-refresh",
    area: "React key/ref warning oracle diagnostics",
    primaryCompatibilityArea: "element",
    acceptedDiagnosticIds: [
      "react-key-ref-warning-refresh"
    ],
    evidencePath:
      "worker-progress/worker-589-react-key-ref-warning-refresh.md",
    evidenceTokens: [
      "# Worker 589",
      "key/ref warning access",
      "compatibility claims still false"
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
      PRIVATE_ADMISSION_565_594_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
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
    sourceQueue: "565-594",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-565-594-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_565_594_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_565_594_ROWS = freezeArray(
  privateAdmission565594RowData.map((sourceRow) =>
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

export const PRIVATE_ADMISSION_565_594_WORKERS = freezeArray(
  PRIVATE_ADMISSION_565_594_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission565594Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_565_594_ROWS.map((baseRow) => {
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
  const missingWorkerIds = PRIVATE_ADMISSION_565_594_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_565_594_WORKERS.includes(workerId)
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
    id: PRIVATE_ADMISSION_565_594_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_565_594_GATE_STATUS
        : PRIVATE_ADMISSION_565_594_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_565_594_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_565_594_SKIPPED_WORKERS,
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
      expectedWorkerIds: PRIVATE_ADMISSION_565_594_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_565_594_SKIPPED_WORKERS
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
