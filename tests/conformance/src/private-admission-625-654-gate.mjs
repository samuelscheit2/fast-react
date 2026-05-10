import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_625_654_GATE_ID =
  "private-admission-625-654-local-gate-1";
export const PRIVATE_ADMISSION_625_654_GATE_STATUS =
  "recognized-accepted-private-diagnostics-625-654-public-compatibility-blocked";
export const PRIVATE_ADMISSION_625_654_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-625-654-with-violations";

export const PRIVATE_ADMISSION_625_654_PUBLIC_COMPATIBILITY_CLAIMS =
  Object.freeze([
    "publicRootCompatibilitySurface",
    "publicRenderCompatibilityClaimed",
    "publicRootRenderCompatibilityClaimed",
    "publicRootUpdateCompatibilityClaimed",
    "publicRootUnmountCompatibilityClaimed",
    "publicFlushSyncCompatibilityClaimed",
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
    "publicEffectCompatibilityClaimed",
    "publicRefCompatibilityClaimed",
    "publicSuspenseOffscreenCompatibilityClaimed",
    "publicElementCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_625_654_BLOCKED_SURFACES = Object.freeze([
  "root",
  "render",
  "root-render",
  "root-update",
  "root-unmount",
  "flush-sync",
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
  "effects",
  "refs",
  "suspense-offscreen",
  "element"
]);

export const PRIVATE_ADMISSION_625_654_SKIPPED_WORKERS = Object.freeze([]);

const privateAdmission625654RowData = Object.freeze([
  rowData({
    workerId: "worker-625-root-scheduler-lane-expiration-commit-execution",
    area: "root scheduler lane expiration commit execution diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "root-scheduler-expired-lane-sync-continuation",
      "expired-lane-render-commit-handoff"
    ],
    evidencePath:
      "worker-progress/worker-625-root-scheduler-lane-expiration-commit-execution.md",
    evidenceTokens: [
      "# Worker 625",
      "expired-lane sync scheduler continuation diagnostic",
      "public root compatibility"
    ]
  }),
  rowData({
    workerId: "worker-626-sync-flush-act-root-execution-path",
    area: "sync-flush act root execution diagnostics",
    primaryCompatibilityArea: "act",
    acceptedDiagnosticIds: [
      "sync-flush-act-root-execution-path",
      "root-scheduler-act-continuation-commit-evidence"
    ],
    evidencePath:
      "worker-progress/worker-626-sync-flush-act-root-execution-path.md",
    evidenceTokens: [
      "# Worker 626",
      "private sync-flush/act test path",
      "public `flushSync` compatibility"
    ]
  }),
  rowData({
    workerId: "worker-627-function-component-usestate-render-execution",
    area: "function component useState render execution diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "function-component-usestate-render-execution",
      "single-host-child-commit-handoff"
    ],
    evidencePath:
      "worker-progress/worker-627-function-component-usestate-render-execution.md",
    evidenceTokens: [
      "# Worker 627",
      "private root-work-loop `useState` dispatch handoff",
      "public `useState` compatibility"
    ]
  }),
  rowData({
    workerId: "worker-628-function-component-usereducer-render-execution",
    area: "function component useReducer render execution diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "function-component-usereducer-render-execution",
      "single-host-update-handoff"
    ],
    evidencePath:
      "worker-progress/worker-628-function-component-usereducer-render-execution.md",
    evidenceTokens: [
      "# Worker 628",
      "render_function_component_with_use_reducer",
      "Public `useReducer` compatibility remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-629-effect-update-unmount-commit-execution",
    area: "effect update and unmount commit execution diagnostics",
    primaryCompatibilityArea: "effects",
    acceptedDiagnosticIds: [
      "effect-update-lifecycle-execution-evidence",
      "deleted-subtree-unmount-lifecycle-execution-evidence"
    ],
    evidencePath:
      "worker-progress/worker-629-effect-update-unmount-commit-execution.md",
    evidenceTokens: [
      "# Worker 629",
      "effect lifecycle execution evidence snapshot",
      "public effect compatibility"
    ]
  }),
  rowData({
    workerId: "worker-630-context-consumer-lane-propagation-execution",
    area: "context consumer lane propagation execution diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "context-provider-consumer-lane-propagation-execution",
      "context-provider-render-commit-traversal-proof"
    ],
    evidencePath:
      "worker-progress/worker-630-context-consumer-lane-propagation-execution.md",
    evidenceTokens: [
      "# Worker 630",
      "HostRoot -> ContextProvider -> FunctionComponent -> HostComponent",
      "Public context compatibility remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-631-suspense-retry-thenable-execution",
    area: "Suspense retry thenable execution diagnostics",
    primaryCompatibilityArea: "suspense-offscreen",
    acceptedDiagnosticIds: [
      "suspense-thenable-retry-root-render-handoff"
    ],
    evidencePath:
      "worker-progress/worker-631-suspense-retry-thenable-execution.md",
    evidenceTokens: [
      "# Worker 631",
      "SuspenseThenableRetryRootRenderHandoffRecord",
      "Public Suspense compatibility remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-632-offscreen-visible-reveal-commit-execution",
    area: "Offscreen visible reveal commit execution diagnostics",
    primaryCompatibilityArea: "suspense-offscreen",
    acceptedDiagnosticIds: [
      "offscreen-reveal-complete-commit-handoff"
    ],
    evidencePath:
      "worker-progress/worker-632-offscreen-visible-reveal-commit-execution.md",
    evidenceTokens: [
      "# Worker 632",
      "Offscreen reveal complete/commit handoff",
      "public Offscreen compatibility"
    ]
  }),
  rowData({
    workerId: "worker-633-host-child-placement-reorder-execution",
    area: "host child placement and reorder execution diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "host-child-placement-reorder-execution",
      "insert-placement-before-stable-sibling"
    ],
    evidencePath:
      "worker-progress/worker-633-host-child-placement-reorder-execution.md",
    evidenceTokens: [
      "# Worker 633",
      "InsertPlacementInHostParentBefore",
      "public React DOM"
    ]
  }),
  rowData({
    workerId: "worker-634-deletion-ref-passive-cleanup-execution",
    area: "deletion ref and passive cleanup execution diagnostics",
    primaryCompatibilityArea: "root-unmount",
    acceptedDiagnosticIds: [
      "deletion-ref-passive-cleanup-execution",
      "host-subtree-detachment-cleanup-order"
    ],
    evidencePath:
      "worker-progress/worker-634-deletion-ref-passive-cleanup-execution.md",
    evidenceTokens: [
      "# Worker 634",
      "deleted-subtree ref/passive cleanup execution canary",
      "public unmount/ref/effect compatibility"
    ]
  }),
  rowData({
    workerId: "worker-635-host-style-dangerous-html-rust-commit-handoff",
    area: "host style and dangerousHTML Rust commit handoff diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "host-style-dangerous-html-rust-commit-handoff",
      "text-reset-host-payload-execution"
    ],
    evidencePath:
      "worker-progress/worker-635-host-style-dangerous-html-rust-commit-handoff.md",
    evidenceTokens: [
      "# Worker 635",
      "style and dangerous HTML rows",
      "public DOM compatibility claims false"
    ]
  }),
  rowData({
    workerId: "worker-636-test-renderer-create-native-execution",
    area: "react-test-renderer create native execution diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-create-native-bridge-host-output-handoff"
    ],
    evidencePath:
      "worker-progress/worker-636-test-renderer-create-native-execution.md",
    evidenceTokens: [
      "# Worker 636",
      "private create native-bridge host-output handoff diagnostic",
      "public create and serialization compatibility blocked"
    ]
  }),
  rowData({
    workerId: "worker-637-test-renderer-update-native-execution",
    area: "react-test-renderer update native execution diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-update-native-bridge-admission",
      "updated-host-output-handoff"
    ],
    evidencePath:
      "worker-progress/worker-637-test-renderer-update-native-execution.md",
    evidenceTokens: [
      "# Worker 637",
      "TestRendererUpdateNativeBridgeAdmission",
      "Public update compatibility remains intentionally blocked"
    ]
  }),
  rowData({
    workerId: "worker-638-test-renderer-unmount-native-execution",
    area: "react-test-renderer unmount native execution diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-unmount-native-bridge-cleanup-handoff"
    ],
    evidencePath:
      "worker-progress/worker-638-test-renderer-unmount-native-execution.md",
    evidenceTokens: [
      "# Worker 638",
      "TestRendererUnmountNativeBridgeCleanupHandoff",
      "public unmount compatibility"
    ]
  }),
  rowData({
    workerId: "worker-639-test-renderer-tojson-after-native-execution",
    area: "react-test-renderer toJSON after native execution diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-tojson-native-execution-evidence"
    ],
    evidencePath:
      "worker-progress/worker-639-test-renderer-tojson-after-native-execution.md",
    evidenceTokens: [
      "# Worker 639",
      "private `toJSON` native-execution evidence records",
      "Public serialization"
    ]
  }),
  rowData({
    workerId: "worker-640-test-renderer-act-scheduler-flush-execution",
    area: "react-test-renderer act scheduler flush execution diagnostics",
    primaryCompatibilityArea: "act",
    acceptedDiagnosticIds: [
      "test-renderer-act-scheduler-flush-execution",
      "scheduler-mock-expired-act-root-work-route"
    ],
    evidencePath:
      "worker-progress/worker-640-test-renderer-act-scheduler-flush-execution.md",
    evidenceTokens: [
      "# Worker 640",
      "private react-test-renderer `act` diagnostics",
      "public act compatibility"
    ]
  }),
  rowData({
    workerId: "worker-641-react-dom-root-render-facade-execution",
    area: "React DOM root render facade execution diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "react-dom-private-facade-root-render-execution"
    ],
    evidencePath:
      "worker-progress/worker-641-react-dom-root-render-facade-execution.md",
    evidenceTokens: [
      "# Worker 641",
      "private facade `root.render` fake-DOM execution",
      "public/root/reconciler/browser compatibility flags false"
    ]
  }),
  rowData({
    workerId: "worker-642-react-dom-root-update-facade-execution",
    area: "React DOM root update facade execution diagnostics",
    primaryCompatibilityArea: "root-update",
    acceptedDiagnosticIds: [
      "react-dom-private-facade-root-update-execution"
    ],
    evidencePath:
      "worker-progress/worker-642-react-dom-root-update-facade-execution.md",
    evidenceTokens: [
      "# Worker 642",
      "HostComponent attribute path",
      "public compatibility flags false"
    ]
  }),
  rowData({
    workerId: "worker-643-react-dom-root-unmount-facade-execution",
    area: "React DOM root unmount facade execution diagnostics",
    primaryCompatibilityArea: "root-unmount",
    acceptedDiagnosticIds: [
      "react-dom-private-facade-root-unmount-execution"
    ],
    evidencePath:
      "worker-progress/worker-643-react-dom-root-unmount-facade-execution.md",
    evidenceTokens: [
      "# Worker 643",
      "root.unmount()",
      "public unmount compatibility false"
    ]
  }),
  rowData({
    workerId: "worker-644-dom-checkbox-change-restore-execution",
    area: "DOM checkbox change restore execution diagnostics",
    primaryCompatibilityArea: "controlled",
    acceptedDiagnosticIds: [
      "dom-checkbox-change-restore-execution",
      "input-checkbox-checked-fake-dom-restore"
    ],
    evidencePath:
      "worker-progress/worker-644-dom-checkbox-change-restore-execution.md",
    evidenceTokens: [
      "# Worker 644",
      "input-checkbox-checked",
      "public controlled-input compatibility"
    ]
  }),
  rowData({
    workerId: "worker-645-dom-live-controlled-input-admission-preflight",
    area: "DOM live controlled input admission preflight diagnostics",
    primaryCompatibilityArea: "controlled",
    acceptedDiagnosticIds: [
      "dom-live-controlled-input-admission-preflight"
    ],
    evidencePath:
      "worker-progress/worker-645-dom-live-controlled-input-admission-preflight.md",
    evidenceTokens: [
      "# Worker 645",
      "live-mutation preflight",
      "liveDomTargetCaptured: false"
    ]
  }),
  rowData({
    workerId: "worker-646-dom-focus-blur-event-dispatch-execution",
    area: "DOM focus and blur event dispatch execution diagnostics",
    primaryCompatibilityArea: "event",
    acceptedDiagnosticIds: [
      "dom-focus-blur-event-dispatch-execution"
    ],
    evidencePath:
      "worker-progress/worker-646-dom-focus-blur-event-dispatch-execution.md",
    evidenceTokens: [
      "# Worker 646",
      "private `focusin`/`focusout` listener queue record",
      "Public browser DOM compatibility remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-647-dom-portal-click-delegation-execution",
    area: "DOM portal click delegation execution diagnostics",
    primaryCompatibilityArea: "event",
    acceptedDiagnosticIds: [
      "dom-portal-click-delegation-execution"
    ],
    evidencePath:
      "worker-progress/worker-647-dom-portal-click-delegation-execution.md",
    evidenceTokens: [
      "# Worker 647",
      "portal owner-root gate",
      "publicPortalBubblingEnabled"
    ]
  }),
  rowData({
    workerId: "worker-648-hydration-claim-then-replay-execution",
    area: "hydration claim then replay execution diagnostics",
    primaryCompatibilityArea: "hydration",
    acceptedDiagnosticIds: [
      "hydration-claimed-replay-target-dispatch-execution"
    ],
    evidencePath:
      "worker-progress/worker-648-hydration-claim-then-replay-execution.md",
    evidenceTokens: [
      "# Worker 648",
      "FastReactDomHydrationClaimedReplayTargetDispatchExecutionRecord",
      "recoverable-error metadata remains callback-free"
    ]
  }),
  rowData({
    workerId: "worker-649-hydration-recoverable-error-callback-execution",
    area: "hydration recoverable error callback execution diagnostics",
    primaryCompatibilityArea: "hydration",
    acceptedDiagnosticIds: [
      "hydration-recoverable-error-callback-invocation"
    ],
    evidencePath:
      "worker-progress/worker-649-hydration-recoverable-error-callback-execution.md",
    evidenceTokens: [
      "# Worker 649",
      "private root-bridge hydration recoverable-error callback invocation",
      "root option ownership"
    ]
  }),
  rowData({
    workerId: "worker-650-resource-stylesheet-commit-load-transition",
    area: "resource stylesheet commit load transition diagnostics",
    primaryCompatibilityArea: "resource",
    acceptedDiagnosticIds: [
      "resource-stylesheet-load-state-commit-transition"
    ],
    evidencePath:
      "worker-progress/worker-650-resource-stylesheet-commit-load-transition.md",
    evidenceTokens: [
      "# Worker 650",
      "stylesheet load-state commit transition",
      "real and fake resource maps unmutated"
    ]
  }),
  rowData({
    workerId: "worker-651-resource-script-modulepreload-commit-execution",
    area: "resource script and modulepreload commit execution diagnostics",
    primaryCompatibilityArea: "resource",
    acceptedDiagnosticIds: [
      "resource-script-modulepreload-fake-dom-commit-execution"
    ],
    evidencePath:
      "worker-progress/worker-651-resource-script-modulepreload-commit-execution.md",
    evidenceTokens: [
      "# Worker 651",
      "scriptModuleFakeDomCommitExecution",
      "dispatch/script execution false"
    ]
  }),
  rowData({
    workerId: "worker-652-form-action-submit-reset-execution",
    area: "form action submit reset execution diagnostics",
    primaryCompatibilityArea: "form",
    acceptedDiagnosticIds: [
      "form-action-submit-reset-execution"
    ],
    evidencePath:
      "worker-progress/worker-652-form-action-submit-reset-execution.md",
    evidenceTokens: [
      "# Worker 652",
      "submit reset execution gate",
      "fake form reset path"
    ]
  }),
  rowData({
    workerId: "worker-653-scheduler-mock-act-flush-all-execution",
    area: "Scheduler mock act flushAll execution diagnostics",
    primaryCompatibilityArea: "scheduler",
    acceptedDiagnosticIds: [
      "scheduler-mock-act-flush-all-execution"
    ],
    evidencePath:
      "worker-progress/worker-653-scheduler-mock-act-flush-all-execution.md",
    evidenceTokens: [
      "# Worker 653",
      "unstable_flushAll",
      "Public Scheduler flush behavior"
    ]
  }),
  rowData({
    workerId: "worker-654-scheduler-posttask-delay-abort-root-execution",
    area: "Scheduler postTask delay/abort root execution diagnostics",
    primaryCompatibilityArea: "scheduler",
    acceptedDiagnosticIds: [
      "scheduler-posttask-delay-abort-root-continuation-execution"
    ],
    evidencePath:
      "worker-progress/worker-654-scheduler-posttask-delay-abort-root-execution.md",
    evidenceTokens: [
      "# Worker 654",
      "private root-continuation execution route",
      "aborted-before-private-root-continuation-execution"
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
      PRIVATE_ADMISSION_625_654_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
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
    sourceQueue: "625-654",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-625-654-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_625_654_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_625_654_ROWS = freezeArray(
  privateAdmission625654RowData.map((sourceRow) =>
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

export const PRIVATE_ADMISSION_625_654_WORKERS = freezeArray(
  PRIVATE_ADMISSION_625_654_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission625654Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_625_654_ROWS.map((baseRow) => {
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
  const missingWorkerIds = PRIVATE_ADMISSION_625_654_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_625_654_WORKERS.includes(workerId)
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
    id: PRIVATE_ADMISSION_625_654_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_625_654_GATE_STATUS
        : PRIVATE_ADMISSION_625_654_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_625_654_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_625_654_SKIPPED_WORKERS,
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
      expectedWorkerIds: PRIVATE_ADMISSION_625_654_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_625_654_SKIPPED_WORKERS
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
