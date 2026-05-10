import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_685_714_GATE_ID =
  "private-admission-685-714-local-gate-1";
export const PRIVATE_ADMISSION_685_714_GATE_STATUS =
  "recognized-accepted-private-diagnostics-685-714-public-compatibility-blocked";
export const PRIVATE_ADMISSION_685_714_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-685-714-with-violations";

export const PRIVATE_ADMISSION_685_714_PUBLIC_COMPATIBILITY_CLAIMS =
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

export const PRIVATE_ADMISSION_685_714_BLOCKED_SURFACES = Object.freeze([
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

export const PRIVATE_ADMISSION_685_714_SKIPPED_WORKERS = Object.freeze([
  "worker-714-package-private-admission-audit-655-684"
]);

const privateAdmission685714RowData = Object.freeze([
  rowData({
    workerId: "worker-685-root-work-loop-finished-work-handoff",
    area: "root work-loop finished-work commit handoff diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "root-work-loop-finished-work-commit-handoff",
      "host-root-finished-work-metadata-consumption"
    ],
    evidencePath:
      "worker-progress/worker-685-root-work-loop-finished-work-handoff.md",
    evidenceTokens: [
      "# Worker 685",
      "keeps public root rendering blocked",
      "private/test-only canary plumbing"
    ]
  }),
  rowData({
    workerId: "worker-686-host-root-update-queue-multiple-reduction",
    area: "HostRoot multiple-update queue reduction diagnostics",
    primaryCompatibilityArea: "root-update",
    acceptedDiagnosticIds: [
      "host-root-update-queue-multiple-reduction",
      "host-root-callback-stable-order-private-handoff"
    ],
    evidencePath:
      "worker-progress/worker-686-host-root-update-queue-multiple-reduction.md",
    evidenceTokens: [
      "# Worker 686",
      "without opening public root rendering",
      "No JS package or public conformance files were touched."
    ]
  }),
  rowData({
    workerId: "worker-687-function-component-usememo-callback-execution",
    area: "function component useMemo/useCallback update reuse diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "function-component-usememo-update-deps-reuse",
      "function-component-usecallback-update-deps-reuse"
    ],
    evidencePath:
      "worker-progress/worker-687-function-component-usememo-callback-execution.md",
    evidenceTokens: [
      "# Worker 687",
      "Kept the behavior private:",
      "do not claim public React hook compatibility"
    ]
  }),
  rowData({
    workerId: "worker-688-function-component-effect-dependency-update",
    area: "function component effect dependency update diagnostics",
    primaryCompatibilityArea: "effects",
    acceptedDiagnosticIds: [
      "passive-effect-dependency-update-schedule-skip",
      "changed-passive-destroy-create-private-execution"
    ],
    evidencePath:
      "worker-progress/worker-688-function-component-effect-dependency-update.md",
    evidenceTokens: [
      "# Worker 688",
      "This is private Rust evidence only.",
      "keeps public effect, act, and scheduler-driven passive flags false"
    ]
  }),
  rowData({
    workerId: "worker-689-layout-effect-error-cleanup-order",
    area: "layout effect create-error cleanup order diagnostics",
    primaryCompatibilityArea: "effects",
    acceptedDiagnosticIds: [
      "layout-effect-create-throw-destroy-before-create",
      "layout-error-capture-fail-closed-metadata"
    ],
    evidencePath:
      "worker-progress/worker-689-layout-effect-error-cleanup-order.md",
    evidenceTokens: [
      "# Worker 689",
      "no public effect compatibility claim",
      "private test-control evidence only"
    ]
  }),
  rowData({
    workerId: "worker-690-context-nested-provider-consumer-execution",
    area: "nested context provider/consumer execution diagnostics",
    primaryCompatibilityArea: "hooks",
    acceptedDiagnosticIds: [
      "nested-context-provider-consumer-private-execution",
      "inner-provider-update-marks-inner-consumer-only"
    ],
    evidencePath:
      "worker-progress/worker-690-context-nested-provider-consumer-execution.md",
    evidenceTokens: [
      "# Worker 690",
      "Kept public compatibility blocked:",
      "does not open public `useContext` compatibility"
    ]
  }),
  rowData({
    workerId: "worker-691-suspense-ping-retry-lane-execution",
    area: "Suspense ping retry lane render-handoff diagnostics",
    primaryCompatibilityArea: "suspense-offscreen",
    acceptedDiagnosticIds: [
      "suspense-thenable-ping-retry-lane-scheduling",
      "suspense-retry-render-handoff-private-proof"
    ],
    evidencePath:
      "worker-progress/worker-691-suspense-ping-retry-lane-execution.md",
    evidenceTokens: [
      "# Worker 691",
      "accepted retry request",
      "public Suspense/root compatibility remains unclaimed"
    ]
  }),
  rowData({
    workerId: "worker-692-offscreen-hidden-update-reveal-lane",
    area: "Offscreen hidden update reveal-lane diagnostics",
    primaryCompatibilityArea: "suspense-offscreen",
    acceptedDiagnosticIds: [
      "offscreen-hidden-update-deferred-reveal-lane",
      "hidden-callback-deferred-lane-commit-metadata"
    ],
    evidencePath:
      "worker-progress/worker-692-offscreen-hidden-update-reveal-lane.md",
    evidenceTokens: [
      "# Worker 692",
      "without opening public Offscreen compatibility",
      "This is private evidence only"
    ]
  }),
  rowData({
    workerId: "worker-693-deletion-subtree-ref-passive-host-order",
    area: "nested deletion subtree ref/passive/host cleanup diagnostics",
    primaryCompatibilityArea: "root-unmount",
    acceptedDiagnosticIds: [
      "nested-deletion-ref-passive-host-order",
      "deleted-subtree-ref-cleanup-before-passive-destroy"
    ],
    evidencePath:
      "worker-progress/worker-693-deletion-subtree-ref-passive-host-order.md",
    evidenceTokens: [
      "# Worker 693",
      "No public React DOM/test-renderer unmount or passive facade behavior was changed or claimed.",
      "Public blockers remain asserted false"
    ]
  }),
  rowData({
    workerId: "worker-694-sync-flush-nested-act-root-continuation",
    area: "nested sync-flush/act root continuation diagnostics",
    primaryCompatibilityArea: "act",
    acceptedDiagnosticIds: [
      "sync-flush-nested-act-root-continuation",
      "act-continuation-lane-preservation"
    ],
    evidencePath:
      "worker-progress/worker-694-sync-flush-nested-act-root-continuation.md",
    evidenceTokens: [
      "# Worker 694",
      "fail-closed public act/flushSync compatibility",
      "private Rust canary evidence only"
    ]
  }),
  rowData({
    workerId: "worker-695-test-renderer-root-create-workloop-execution",
    area: "react-test-renderer create work-loop handoff diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-create-workloop-finished-work-handoff",
      "create-route-finished-work-identity-validation"
    ],
    evidencePath:
      "worker-progress/worker-695-test-renderer-root-create-workloop-execution.md",
    evidenceTokens: [
      "# Worker 695",
      "Kept public `create()` behavior blocked",
      "private diagnostic plumbing only"
    ]
  }),
  rowData({
    workerId: "worker-696-test-renderer-root-update-prop-style-execution",
    area: "react-test-renderer prop/style/text update diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-update-prop-style-text-execution",
      "host-component-prop-style-text-private-admission"
    ],
    evidencePath:
      "worker-progress/worker-696-test-renderer-root-update-prop-style-execution.md",
    evidenceTokens: [
      "# Worker 696",
      "without public compatibility",
      "intentionally private test-renderer canary data"
    ]
  }),
  rowData({
    workerId: "worker-697-test-renderer-tojson-multichild-native-execution",
    area: "react-test-renderer toJSON multi-child native diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-tojson-multichild-native-execution",
      "sibling-text-tojson-native-execution-diagnostic"
    ],
    evidencePath:
      "worker-progress/worker-697-test-renderer-tojson-multichild-native-execution.md",
    evidenceTokens: [
      "# Worker 697",
      "without enabling public `toJSON()`",
      "Public `renderer.toJSON()` remains an unsupported public function"
    ]
  }),
  rowData({
    workerId: "worker-698-test-renderer-totree-composite-native-execution",
    area: "react-test-renderer toTree composite native diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-totree-composite-native-execution",
      "composite-committed-fiber-totree-private-evidence"
    ],
    evidencePath:
      "worker-progress/worker-698-test-renderer-totree-composite-native-execution.md",
    evidenceTokens: [
      "# Worker 698",
      "preserving blocked public `toTree()`",
      "leaving public `create().toTree()` blocked"
    ]
  }),
  rowData({
    workerId: "worker-699-test-renderer-testinstance-class-query-execution",
    area: "react-test-renderer TestInstance class-root query diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-testinstance-class-query-execution",
      "class-root-updated-host-child-query-evidence"
    ],
    evidencePath:
      "worker-progress/worker-699-test-renderer-testinstance-class-query-execution.md",
    evidenceTokens: [
      "# Worker 699",
      "public `.root`, `find*`, TestInstance wrappers",
      "private diagnostic metadata"
    ]
  }),
  rowData({
    workerId: "worker-700-test-renderer-act-nested-scope-passive-flush",
    area: "react-test-renderer nested act passive flush diagnostics",
    primaryCompatibilityArea: "act",
    acceptedDiagnosticIds: [
      "test-renderer-act-nested-scope-passive-flush",
      "nested-act-passive-private-order"
    ],
    evidencePath:
      "worker-progress/worker-700-test-renderer-act-nested-scope-passive-flush.md",
    evidenceTokens: [
      "# Worker 700",
      "nested act scope passive flush evidence",
      "Public `act()` remains intentionally blocked."
    ]
  }),
  rowData({
    workerId: "worker-701-test-renderer-error-boundary-commit-recovery",
    area: "react-test-renderer commit-phase error recovery diagnostics",
    primaryCompatibilityArea: "test-renderer",
    acceptedDiagnosticIds: [
      "test-renderer-error-boundary-commit-recovery",
      "update-failure-commit-recovery-metadata"
    ],
    evidencePath:
      "worker-progress/worker-701-test-renderer-error-boundary-commit-recovery.md",
    evidenceTokens: [
      "# Worker 701",
      "without exposing public error-boundary compatibility",
      "does not schedule public recovery work"
    ]
  }),
  rowData({
    workerId: "worker-702-test-renderer-production-private-metadata-parity",
    area: "react-test-renderer production private metadata parity diagnostics",
    primaryCompatibilityArea: "act",
    acceptedDiagnosticIds: [
      "test-renderer-production-private-metadata-parity",
      "production-act-private-diagnostic-parity"
    ],
    evidencePath:
      "worker-progress/worker-702-test-renderer-production-private-metadata-parity.md",
    evidenceTokens: [
      "# Worker 702",
      "without broadening public production behavior or package exports",
      "`exports.act` remains `undefined`",
      "compatibilityClaimed: false"
    ]
  }),
  rowData({
    workerId: "worker-703-dom-root-render-hosttext-component-execution",
    area: "React DOM root-render HostText/HostComponent diagnostics",
    primaryCompatibilityArea: "root-render",
    acceptedDiagnosticIds: [
      "react-dom-root-render-hosttext-component-execution",
      "root-render-host-output-finished-work-handoff"
    ],
    evidencePath:
      "worker-progress/worker-703-dom-root-render-hosttext-component-execution.md",
    evidenceTokens: [
      "# Worker 703",
      "while public createRoot().render stays blocked",
      "new execution is private and fake-DOM-only"
    ]
  }),
  rowData({
    workerId: "worker-704-dom-root-update-style-dangerous-html-execution",
    area: "React DOM root-update style/dangerousHTML diagnostics",
    primaryCompatibilityArea: "root-update",
    acceptedDiagnosticIds: [
      "react-dom-root-update-style-dangerous-html-execution",
      "style-dangerous-html-root-update-fake-dom"
    ],
    evidencePath:
      "worker-progress/worker-704-dom-root-update-style-dangerous-html-execution.md",
    evidenceTokens: [
      "# Worker 704",
      "no public root compatibility",
      "Public root compatibility remains intentionally unclaimed."
    ]
  }),
  rowData({
    workerId: "worker-705-dom-root-unmount-ref-passive-cleanup-execution",
    area: "React DOM root-unmount ref/passive cleanup diagnostics",
    primaryCompatibilityArea: "root-unmount",
    acceptedDiagnosticIds: [
      "react-dom-root-unmount-ref-passive-cleanup-execution",
      "ref-cleanup-passive-destroy-before-host-cleanup-order"
    ],
    evidencePath:
      "worker-progress/worker-705-dom-root-unmount-ref-passive-cleanup-execution.md",
    evidenceTokens: [
      "# Worker 705",
      "public root unmount and passive behavior remain blocked",
      "No public unmount, public passive drain"
    ]
  }),
  rowData({
    workerId: "worker-706-dom-event-click-after-root-render-execution",
    area: "React DOM click delegation after private root-render diagnostics",
    primaryCompatibilityArea: "event",
    acceptedDiagnosticIds: [
      "dom-event-click-after-root-render-execution",
      "root-render-target-click-accepted-listener-order"
    ],
    evidencePath:
      "worker-progress/worker-706-dom-event-click-after-root-render-execution.md",
    evidenceTokens: [
      "# Worker 706",
      "without public event compatibility",
      "`publicDispatchEnabled: false`",
      "does not claim public DOM event compatibility"
    ]
  }),
  rowData({
    workerId: "worker-707-dom-controlled-select-textarea-restore-execution",
    area: "React DOM controlled select/textarea fake-DOM restore diagnostics",
    primaryCompatibilityArea: "controlled",
    acceptedDiagnosticIds: [
      "dom-controlled-select-textarea-restore-execution",
      "controlled-select-textarea-fake-dom-restore"
    ],
    evidencePath:
      "worker-progress/worker-707-dom-controlled-select-textarea-restore-execution.md",
    evidenceTokens: [
      "# Worker 707",
      "private controlled post-event restore fake-DOM execution path",
      "value-tracker compatibility remain blocked"
    ]
  }),
  rowData({
    workerId: "worker-708-dom-hydration-claim-text-patch-execution",
    area: "React DOM hydration fake text-node claim/patch diagnostics",
    primaryCompatibilityArea: "hydration",
    acceptedDiagnosticIds: [
      "hydration-text-node-claim-patch-execution",
      "fake-text-node-mismatch-patch-record"
    ],
    evidencePath:
      "worker-progress/worker-708-dom-hydration-claim-text-patch-execution.md",
    evidenceTokens: [
      "# Worker 708",
      "without enabling public hydrateRoot behavior.",
      "Public hydrateRoot/root behavior remains blocked",
      "does not call `onRecoverableError`"
    ]
  }),
  rowData({
    workerId: "worker-709-dom-portal-root-render-event-handoff",
    area: "React DOM portal owner-root event handoff diagnostics",
    primaryCompatibilityArea: "event",
    acceptedDiagnosticIds: [
      "dom-portal-root-render-event-handoff",
      "portal-secondary-root-owner-event-handoff"
    ],
    evidencePath:
      "worker-progress/worker-709-dom-portal-root-render-event-handoff.md",
    evidenceTokens: [
      "# Worker 709",
      "while public portal/event compatibility stays blocked",
      "Public portal mounting, public event bubbling"
    ]
  }),
  rowData({
    workerId: "worker-710-dom-resource-dedupe-load-order-execution",
    area: "React DOM fake-head resource dedupe/load-order diagnostics",
    primaryCompatibilityArea: "resource",
    acceptedDiagnosticIds: [
      "resource-dedupe-load-order-fake-head-execution",
      "resource-preload-preinit-script-module-ordering"
    ],
    evidencePath:
      "worker-progress/worker-710-dom-resource-dedupe-load-order-execution.md",
    evidenceTokens: [
      "# Worker 710",
      "private resource-map fake-head execution path",
      "Public resource-hint behavior remains unsupported"
    ]
  }),
  rowData({
    workerId: "worker-711-dom-form-action-async-callback-execution",
    area: "React DOM form-action async callback diagnostics",
    primaryCompatibilityArea: "form",
    acceptedDiagnosticIds: [
      "form-action-async-callback-execution",
      "private-form-action-pending-reset-callback-outcome"
    ],
    evidencePath:
      "worker-progress/worker-711-dom-form-action-async-callback-execution.md",
    evidenceTokens: [
      "# Worker 711",
      "without enabling public form action compatibility",
      "keeps public submit dispatch, client form data construction"
    ]
  }),
  rowData({
    workerId: "worker-712-scheduler-mock-expired-lane-root-continuation",
    area: "Scheduler mock expired lane/root continuation diagnostics",
    primaryCompatibilityArea: "scheduler",
    acceptedDiagnosticIds: [
      "scheduler-mock-expired-lane-root-continuation",
      "expired-callback-root-continuation-order"
    ],
    evidencePath:
      "worker-progress/worker-712-scheduler-mock-expired-lane-root-continuation.md",
    evidenceTokens: [
      "# Worker 712",
      "with public mock helper compatibility still scoped",
      "public Scheduler/React/root/renderer compatibility claims remain false."
    ]
  }),
  rowData({
    workerId: "worker-713-scheduler-posttask-priority-timeout-continuation",
    area: "Scheduler postTask priority/timeout continuation diagnostics",
    primaryCompatibilityArea: "scheduler",
    acceptedDiagnosticIds: [
      "scheduler-posttask-priority-timeout-continuation",
      "posttask-priority-timeout-root-continuation"
    ],
    evidencePath:
      "worker-progress/worker-713-scheduler-posttask-priority-timeout-continuation.md",
    evidenceTokens: [
      "# Worker 713",
      "without broad browser compatibility claims.",
      "priority-timeout record is private metadata only",
      "public Scheduler timing compatibility"
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
      PRIVATE_ADMISSION_685_714_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
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
    sourceQueue: "685-714",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-685-714-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_685_714_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_685_714_ROWS = freezeArray(
  privateAdmission685714RowData.map((sourceRow) =>
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

export const PRIVATE_ADMISSION_685_714_WORKERS = freezeArray(
  PRIVATE_ADMISSION_685_714_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission685714Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_685_714_ROWS.map((baseRow) => {
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
  const missingWorkerIds = PRIVATE_ADMISSION_685_714_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_685_714_WORKERS.includes(workerId)
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
    id: PRIVATE_ADMISSION_685_714_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_685_714_GATE_STATUS
        : PRIVATE_ADMISSION_685_714_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_685_714_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_685_714_SKIPPED_WORKERS,
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
      expectedWorkerIds: PRIVATE_ADMISSION_685_714_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_685_714_SKIPPED_WORKERS
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
