import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_655_684_GATE_ID =
  "private-admission-655-684-local-gate-1";
export const PRIVATE_ADMISSION_655_684_GATE_STATUS =
  "recognized-accepted-private-diagnostics-655-684-public-compatibility-blocked";
export const PRIVATE_ADMISSION_655_684_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-655-684-with-violations";

export const PRIVATE_ADMISSION_655_684_PUBLIC_COMPATIBILITY_CLAIMS =
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

export const PRIVATE_ADMISSION_655_684_BLOCKED_SURFACES = Object.freeze([
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

export const PRIVATE_ADMISSION_655_684_SKIPPED_WORKERS = Object.freeze([
  "worker-684-package-surface-private-admission-refresh"
]);

const privateAdmission655684RowData = Object.freeze([
  rowData({
    workerId: "worker-655-root-commit-text-replacement-execution",
    area: "HostText root-commit replacement execution diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "host-text-replacement-root-commit-execution",
      "host-node-text-update-ledger"
    ],
    evidencePath:
      "worker-progress/worker-655-root-commit-text-replacement-execution.md",
    evidenceTokens: [
      "# Worker 655",
      "private text record changes from `before` to `after`",
      "React DOM/test-renderer compatibility remains unclaimed"
    ]
  }),
  rowData({
    workerId: "worker-656-host-component-prop-style-commit-execution",
    area: "HostComponent prop/style private-store commit diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "host-component-style-private-store-commit",
      "latest-props-ordering-private-store"
    ],
    evidencePath:
      "worker-progress/worker-656-host-component-prop-style-commit-execution.md",
    evidenceTokens: [
      "# Worker 656",
      "host-node store now records a property payload update",
      "compatibility booleans false"
    ]
  }),
  rowData({
    workerId: "worker-657-root-commit-multi-child-placement-execution",
    area: "multi-child HostComponent/HostText placement execution diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "multi-child-root-placement-execution",
      "stable-sibling-skipped-placement-order"
    ],
    evidencePath:
      "worker-progress/worker-657-root-commit-multi-child-placement-execution.md",
    evidenceTokens: [
      "# Worker 657",
      "skipped pending sibling count",
      "public rendering remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-658-function-passive-effect-destroy-create-execution",
    area: "function passive destroy/create execution diagnostics",
    primaryCompatibilityArea: "effects",
    acceptedDiagnosticIds: [
      "function-passive-destroy-create-execution",
      "committed-passive-effect-queue-validation"
    ],
    evidencePath:
      "worker-progress/worker-658-function-passive-effect-destroy-create-execution.md",
    evidenceTokens: [
      "# Worker 658",
      "destroy/create pair under test control",
      "public passive effect compatibility remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-659-layout-effect-destroy-create-commit-execution",
    area: "layout effect destroy/create commit execution diagnostics",
    primaryCompatibilityArea: "effects",
    acceptedDiagnosticIds: [
      "layout-effect-destroy-create-commit-execution",
      "layout-effect-error-capture-metadata"
    ],
    evidencePath:
      "worker-progress/worker-659-layout-effect-destroy-create-commit-execution.md",
    evidenceTokens: [
      "# Worker 659",
      "destroy before create under test control",
      "public `useLayoutEffect`"
    ]
  }),
  rowData({
    workerId: "worker-660-ref-detach-attach-update-execution",
    area: "HostComponent ref detach/update/attach order diagnostics",
    primaryCompatibilityArea: "refs",
    acceptedDiagnosticIds: [
      "ref-detach-update-attach-order",
      "host-component-ref-update-private-order"
    ],
    evidencePath:
      "worker-progress/worker-660-ref-detach-attach-update-execution.md",
    evidenceTokens: [
      "# Worker 660",
      "`ref-detach -> host-component-update -> ref-attach`",
      "Public ref callback compatibility remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-661-context-provider-update-commit-propagation",
    area: "context provider update commit propagation diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "context-provider-update-commit-propagation",
      "marked-consumer-lanes-survive-commit"
    ],
    evidencePath:
      "worker-progress/worker-661-context-provider-update-commit-propagation.md",
    evidenceTokens: [
      "# Worker 661",
      "marked consumer lanes survive the `DEFAULT` commit",
      "does not expose public `useContext`"
    ]
  }),
  rowData({
    workerId: "worker-662-suspense-fallback-retry-commit-execution",
    area: "Suspense fallback/content retry commit diagnostics",
    primaryCompatibilityArea: "suspense-offscreen",
    acceptedDiagnosticIds: [
      "suspense-retry-fallback-content-commit-handoff",
      "thenable-ping-render-commit-proof"
    ],
    evidencePath:
      "worker-progress/worker-662-suspense-fallback-retry-commit-execution.md",
    evidenceTokens: [
      "# Worker 662",
      "committed fallback/content handoff",
      "public Suspense compatibility"
    ]
  }),
  rowData({
    workerId: "worker-663-offscreen-passive-defer-reveal-execution",
    area: "Offscreen passive defer/reveal execution diagnostics",
    primaryCompatibilityArea: "suspense-offscreen",
    acceptedDiagnosticIds: [
      "offscreen-passive-deferral-reveal-evidence",
      "hidden-subtree-passive-record-validation"
    ],
    evidencePath:
      "worker-progress/worker-663-offscreen-passive-defer-reveal-execution.md",
    evidenceTokens: [
      "# Worker 663",
      "passive callbacks remain deferred",
      "does not traverse Offscreen"
    ]
  }),
  rowData({
    workerId: "worker-664-root-error-recovery-commit-execution",
    area: "root render failure recovery commit diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "root-render-failure-recovery-metadata",
      "sync-flush-render-failure-error-options"
    ],
    evidencePath:
      "worker-progress/worker-664-root-error-recovery-commit-execution.md",
    evidenceTokens: [
      "# Worker 664",
      "proving no public retry/callback behavior executes",
      "no public error-boundary/recoverable-error compatibility"
    ]
  }),
  rowData({
    workerId: "worker-665-sync-flush-cross-root-callback-execution",
    area: "sync-flush cross-root visible callback execution diagnostics",
    primaryCompatibilityArea: "flush-sync",
    acceptedDiagnosticIds: [
      "sync-flush-cross-root-visible-callback-execution",
      "committed-root-callback-order"
    ],
    evidencePath:
      "worker-progress/worker-665-sync-flush-cross-root-callback-execution.md",
    evidenceTokens: [
      "# Worker 665",
      "accepted callback snapshots",
      "Public callback compatibility remains explicitly unclaimed"
    ]
  }),
  rowData({
    workerId: "worker-666-hook-reducer-transition-lane-execution",
    area: "useReducer transition-lane execution diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "use-reducer-transition-lane-rebase-execution",
      "transition-lane-commit-handoff"
    ],
    evidencePath:
      "worker-progress/worker-666-hook-reducer-transition-lane-execution.md",
    evidenceTokens: [
      "# Worker 666",
      "TRANSITION_1` update is skipped",
      "without public transition compatibility"
    ]
  }),
  rowData({
    workerId: "worker-667-test-renderer-totree-native-execution",
    area: "react-test-renderer toTree native execution diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-totree-native-execution",
      "native-create-update-unmount-totree-evidence"
    ],
    evidencePath:
      "worker-progress/worker-667-test-renderer-totree-native-execution.md",
    evidenceTokens: [
      "# Worker 667",
      "private `toTree` facade metadata/methods",
      "public `toTree()` compatibility stays blocked"
    ]
  }),
  rowData({
    workerId: "worker-668-test-renderer-testinstance-native-query-execution",
    area: "react-test-renderer TestInstance native query execution diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-testinstance-native-query-execution",
      "host-component-findbytype-private-query"
    ],
    evidencePath:
      "worker-progress/worker-668-test-renderer-testinstance-native-query-execution.md",
    evidenceTokens: [
      "# Worker 668",
      "private TestInstance native-query execution evidence",
      "public `.root`, TestInstance query methods"
    ]
  }),
  rowData({
    workerId: "worker-669-test-renderer-error-boundary-native-execution",
    area: "react-test-renderer error-boundary native execution diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-error-boundary-native-execution",
      "update-failure-private-error-boundary-consumer"
    ],
    evidencePath:
      "worker-progress/worker-669-test-renderer-error-boundary-native-execution.md",
    evidenceTokens: [
      "# Worker 669",
      "private error-boundary native execution evidence",
      "public error recovery remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-670-test-renderer-act-passive-native-flush",
    area: "react-test-renderer act passive native flush diagnostics",
    primaryCompatibilityArea: "act",
    acceptedDiagnosticIds: [
      "test-renderer-act-native-update-passive-drain",
      "accepted-native-update-pending-passive-flush"
    ],
    evidencePath:
      "worker-progress/worker-670-test-renderer-act-passive-native-flush.md",
    evidenceTokens: [
      "# Worker 670",
      "consume one accepted native update execution result",
      "without opening public `act()` compatibility"
    ]
  }),
  rowData({
    workerId: "worker-671-test-renderer-root-update-serialization-props",
    area: "react-test-renderer HostComponent prop-plus-text serialization diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-update-prop-plus-text-serialization",
      "host-component-prop-plus-text-update"
    ],
    evidencePath:
      "worker-progress/worker-671-test-renderer-root-update-serialization-props.md",
    evidenceTokens: [
      "# Worker 671",
      "HostComponent prop plus text update",
      "Public `create().toJSON()` and `create().toTree()` remain blocked"
    ]
  }),
  rowData({
    workerId: "worker-672-test-renderer-unmount-passive-ref-order",
    area: "react-test-renderer unmount passive/ref cleanup order diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-unmount-passive-ref-cleanup-order",
      "native-cleanup-passive-ref-order-validation"
    ],
    evidencePath:
      "worker-progress/worker-672-test-renderer-unmount-passive-ref-order.md",
    evidenceTokens: [
      "# Worker 672",
      "TestRendererUnmountPassiveRefCleanupOrderEvidence",
      "public unmount behavior remains blocked"
    ]
  }),
  rowData({
    workerId: "worker-673-dom-root-live-container-preflight",
    area: "React DOM root live-container preflight diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "react-dom-root-live-container-preflight",
      "blocked-live-container-facade-preflight"
    ],
    evidencePath:
      "worker-progress/worker-673-dom-root-live-container-preflight.md",
    evidenceTokens: [
      "# Worker 673",
      "private root live-container preflight",
      "does not claim public"
    ]
  }),
  rowData({
    workerId: "worker-674-dom-root-ref-passive-unmount-facade",
    area: "React DOM root ref/passive unmount facade diagnostics",
    primaryCompatibilityArea: "root-unmount",
    acceptedDiagnosticIds: [
      "react-dom-root-unmount-ref-passive-evidence",
      "fake-dom-ref-passive-unmount-metadata"
    ],
    evidencePath:
      "worker-progress/worker-674-dom-root-ref-passive-unmount-facade.md",
    evidenceTokens: [
      "# Worker 674",
      "conditional private facade `root.unmount()` ref/passive evidence",
      "Public root unmount"
    ]
  }),
  rowData({
    workerId: "worker-675-dom-root-fragment-array-fake-dom-render",
    area: "React DOM Fragment/array fake-DOM render diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "react-dom-fragment-array-fake-dom-render",
      "fragment-array-host-output-handoff"
    ],
    evidencePath:
      "worker-progress/worker-675-dom-root-fragment-array-fake-dom-render.md",
    evidenceTokens: [
      "# Worker 675",
      "unkeyed Fragment/direct-array host-child shape",
      "public `react-dom/client.createRoot` blocked"
    ]
  }),
  rowData({
    workerId: "worker-676-dom-controlled-live-text-restore-preflight",
    area: "controlled text-input live restore preflight diagnostics",
    primaryCompatibilityArea: "controlled",
    acceptedDiagnosticIds: [
      "controlled-text-live-restore-preflight",
      "descriptor-value-tracker-blockers"
    ],
    evidencePath:
      "worker-progress/worker-676-dom-controlled-live-text-restore-preflight.md",
    evidenceTokens: [
      "# Worker 676",
      "descriptor-access and value-tracker-access blockers",
      "does not implement real live DOM mutation"
    ]
  }),
  rowData({
    workerId: "worker-677-dom-hydration-text-mismatch-recovery-execution",
    area: "hydration text mismatch recoverable-error execution diagnostics",
    primaryCompatibilityArea: "hydration",
    acceptedDiagnosticIds: [
      "hydration-text-mismatch-recoverable-error-execution",
      "owned-recoverable-error-callback-routing"
    ],
    evidencePath:
      "worker-progress/worker-677-dom-hydration-text-mismatch-recovery-execution.md",
    evidenceTokens: [
      "# Worker 677",
      "private hydration-boundary recoverable-error routing execution gate",
      "Public `hydrateRoot`"
    ]
  }),
  rowData({
    workerId: "worker-678-dom-hydration-replay-click-dispatch",
    area: "hydration replay click-dispatch diagnostics",
    primaryCompatibilityArea: "hydration",
    acceptedDiagnosticIds: [
      "hydration-replay-click-dispatch-diagnostic",
      "claimed-target-click-replay-order"
    ],
    evidencePath:
      "worker-progress/worker-678-dom-hydration-replay-click-dispatch.md",
    evidenceTokens: [
      "# Worker 678",
      "FastReactDomHydrationReplayClickDispatchDiagnostic",
      "Public hydrateRoot"
    ]
  }),
  rowData({
    workerId: "worker-679-dom-resource-preload-preinit-fake-head-execution",
    area: "resource preload/preinit fake-head execution diagnostics",
    primaryCompatibilityArea: "resource",
    acceptedDiagnosticIds: [
      "resource-preload-preinit-fake-head-execution",
      "stylesheet-precedence-fake-link-insertion"
    ],
    evidencePath:
      "worker-progress/worker-679-dom-resource-preload-preinit-fake-head-execution.md",
    evidenceTokens: [
      "# Worker 679",
      "private fake-head execution admission",
      "public resource dispatch"
    ]
  }),
  rowData({
    workerId: "worker-680-dom-stylesheet-load-state-commit-execution",
    area: "stylesheet load-state commit execution diagnostics",
    primaryCompatibilityArea: "resource",
    acceptedDiagnosticIds: [
      "stylesheet-load-state-commit-execution",
      "fake-stylesheet-load-error-transition"
    ],
    evidencePath:
      "worker-progress/worker-680-dom-stylesheet-load-state-commit-execution.md",
    evidenceTokens: [
      "# Worker 680",
      "stylesheet load-state commit execution metadata",
      "public stylesheet compatibility"
    ]
  }),
  rowData({
    workerId: "worker-681-dom-script-modulepreload-order-execution",
    area: "script/modulepreload ordering execution diagnostics",
    primaryCompatibilityArea: "resource",
    acceptedDiagnosticIds: [
      "script-modulepreload-order-execution",
      "fake-resource-ordering-dedupe-states"
    ],
    evidencePath:
      "worker-progress/worker-681-dom-script-modulepreload-order-execution.md",
    evidenceTokens: [
      "# Worker 681",
      "private fake-resource ordering execution",
      "public resource API"
    ]
  }),
  rowData({
    workerId: "worker-682-dom-form-action-callback-preflight",
    area: "form action callback/action invocation preflight diagnostics",
    primaryCompatibilityArea: "form",
    acceptedDiagnosticIds: [
      "form-action-callback-action-preflight",
      "submit-reset-metadata-callback-action-blockers"
    ],
    evidencePath:
      "worker-progress/worker-682-dom-form-action-callback-preflight.md",
    evidenceTokens: [
      "# Worker 682",
      "private form action callback/action invocation preflight",
      "callbacks and actions remain uninvoked"
    ]
  }),
  rowData({
    workerId: "worker-683-scheduler-posttask-act-root-continuation",
    area: "Scheduler postTask delayed act/root continuation diagnostics",
    primaryCompatibilityArea: "scheduler",
    acceptedDiagnosticIds: [
      "scheduler-posttask-delayed-act-root-continuation",
      "posttask-private-handoff-compatibility-blocked"
    ],
    evidencePath:
      "worker-progress/worker-683-scheduler-posttask-act-root-continuation.md",
    evidenceTokens: [
      "# Worker 683",
      "delayed-continuation act/root",
      "without public Scheduler timing compatibility claims"
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
      PRIVATE_ADMISSION_655_684_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
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
    sourceQueue: "655-684",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-655-684-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_655_684_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_655_684_ROWS = freezeArray(
  privateAdmission655684RowData.map((sourceRow) =>
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

export const PRIVATE_ADMISSION_655_684_WORKERS = freezeArray(
  PRIVATE_ADMISSION_655_684_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission655684Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_655_684_ROWS.map((baseRow) => {
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
  const missingWorkerIds = PRIVATE_ADMISSION_655_684_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_655_684_WORKERS.includes(workerId)
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
    id: PRIVATE_ADMISSION_655_684_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_655_684_GATE_STATUS
        : PRIVATE_ADMISSION_655_684_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_655_684_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_655_684_SKIPPED_WORKERS,
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
      expectedWorkerIds: PRIVATE_ADMISSION_655_684_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_655_684_SKIPPED_WORKERS
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
