import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_739_745_GATE_ID,
  PRIVATE_ADMISSION_739_745_GATE_STATUS,
  PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS
} from "./private-admission-739-745-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_746_753_GATE_ID =
  "private-admission-746-753-local-gate-1";
export const PRIVATE_ADMISSION_746_753_GATE_STATUS =
  "recognized-accepted-private-diagnostics-746-753-public-compatibility-blocked";
export const PRIVATE_ADMISSION_746_753_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-746-753-with-violations";

export const PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS,
    "publicReactDomRootRenderCompatibilityClaimed",
    "publicReactDomTestUtilsActCompatibilityClaimed",
    "publicReactDomTestUtilsActSyncFlushCompatibilityClaimed",
    "publicReactDomFlushSyncCompatibilityClaimed",
    "publicReactActCompatibilityClaimed",
    "publicHydrationBoundaryMetadataCompatibilityClaimed",
    "publicHydrationResourceFormCompatibilityClaimed",
    "publicSchedulerPostTaskYieldCompatibilityClaimed",
    "publicSchedulerYieldTimingCompatibilityClaimed",
    "publicSchedulerBrowserTaskOrderingCompatibilityClaimed",
    "publicNativeToJSONCompatibilityClaimed",
    "publicNativeExecutionCompatibilityClaimed",
    "publicTestRendererNativeBridgeCompatibilityClaimed",
    "publicRendererCompatibilityClaimed",
    "publicEffectCompatibilityClaimed",
    "publicPackageSurfaceCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES = freezeUniqueArray([
  ...PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES,
  "react-dom-root-render",
  "react-dom-test-utils-act",
  "react-dom-test-utils-act-sync-flush-handoff",
  "react-dom-flush-sync",
  "react-act",
  "hydration-boundary-metadata-public-compatibility",
  "hydration-resource-form-controlled-public-compatibility",
  "scheduler-post-task-yield",
  "scheduler-yield-public-timing",
  "scheduler-browser-task-ordering",
  "test-renderer-sibling-text-native-tojson-identity-consumption",
  "test-renderer-native-bridge-compatibility",
  "native-execution",
  "renderer-work",
  "effects",
  "package-surface-compatibility"
]);

export const PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS,
    "reactDomRootRenderAdmissionClaimed",
    "reactDomTestUtilsActAdmissionClaimed",
    "reactDomTestUtilsActSyncFlushAdmissionClaimed",
    "reactDomFlushSyncAdmissionClaimed",
    "reactActAdmissionClaimed",
    "hydrateRootMetadataPublicPromotionClaimed",
    "hydrationBoundaryMetadataAdmissionClaimed",
    "hydrationResourceFormCompatibilityClaimed",
    "schedulerPostTaskYieldPublicAdmissionClaimed",
    "schedulerYieldTimingAdmissionClaimed",
    "schedulerBrowserCompatibilityClaimed",
    "nativeToJSONPublicAdmissionClaimed",
    "testRendererNativeBridgeCompatibilityClaimed",
    "rendererEffectsAdmissionClaimed",
    "packageSurfaceAdmissionClaimed"
  ]);

const worker746 = "worker-746-record-740-745-docs";
const worker748 = "worker-748-hydrateroot-boundary-metadata-snapshot";
const worker749 = "worker-749-sibling-text-native-tojson-consumes-identity";
const worker751 = "worker-751-scheduler-posttask-yield-handoff";
const worker752 = "worker-752-package-private-admission-audit-739-745";
const worker753 = "worker-753-react-dom-test-utils-act-handoff";

export const PRIVATE_ADMISSION_746_753_SKIPPED_WORKERS = Object.freeze([
  worker746
]);

export const PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    [worker748]: freezeArray([
      "react-dom-client-private-hydrate-root-accepted-metadata-snapshot",
      "accepted-private-hydration-boundary-metadata-diagnostics",
      "hydration-boundary-metadata-public-compatibility-blocked"
    ]),
    [worker749]: freezeArray([
      "fast-react-test-renderer.tojson.sibling-text.native-execution-consumes-identity",
      "fast-react-test-renderer.tojson.sibling-text.finished-work-identity",
      "sibling-text-public-native-package-js-surfaces-blocked"
    ]),
    [worker751]: freezeArray([
      "scheduler-post-task-private-yield-continuation-handoff",
      "accepted-private-scheduler-post-task-act-root-work-handoff",
      "stale-continuation"
    ]),
    [worker752]: freezeArray([
      PRIVATE_ADMISSION_739_745_GATE_ID,
      PRIVATE_ADMISSION_739_745_GATE_STATUS,
      "static-private-admission-ledger-739-745-evidence"
    ]),
    [worker753]: freezeArray([
      "react-dom-test-utils-act-private-sync-flush-root-handoff-gate-1",
      "sync-flush-nested-act-root-continuation-evidence",
      "sync-flush-root-scheduler-finished-work-handoff-evidence"
    ])
  });

export const PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES = freezeRecord({
  [worker748]: freezeArray([
    "worker-741-react-dom-hydrateroot-private-facade-preflight",
    "unsupported-hydration-boundary-diagnostics"
  ]),
  [worker749]: freezeArray([
    "worker-738-real-sibling-text-handoff-report",
    "worker-745-test-renderer-sibling-text-identity-gate"
  ]),
  [worker751]: freezeArray([
    "worker-683-scheduler-posttask-act-root-continuation",
    "worker-713-scheduler-posttask-priority-timeout-continuation"
  ]),
  [worker752]: freezeArray([
    worker746,
    PRIVATE_ADMISSION_739_745_GATE_ID
  ]),
  [worker753]: freezeArray([
    "worker-694-sync-flush-nested-act-root-continuation",
    "worker-718-sync-flush-root-scheduler-finished-work-handoff"
  ])
});

export const PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS =
  freezeRecord({
    [worker748]: freezeArray([
      "acceptedPrivateMetadataDiagnostics",
      "acceptedPrivateMetadataIds",
      "acceptedPrivateMetadataGateIds",
      "metadataRows"
    ]),
    [worker749]: freezeArray([
      "TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME",
      "consumes_private_sibling_text_finished_work_identity_gate",
      "sibling-text-finished-work-identity-gate-not-implemented"
    ]),
    [worker751]: freezeArray([
      "controlled-shim-scheduler-yield-continuation",
      "scheduler.yield",
      "callbackRunCountAtSchedule"
    ]),
    [worker752]: freezeArray([
      PRIVATE_ADMISSION_739_745_GATE_ID,
      PRIVATE_ADMISSION_739_745_GATE_STATUS,
      "public root/act/flushSync/Scheduler timing/hydration/test-renderer"
    ]),
    [worker753]: freezeArray([
      "SyncFlushRootRecord.finished_work",
      "SyncFlushRootRecord.finished_lanes",
      "FiberRoot.finished_work",
      "FiberRoot.finished_lanes"
    ])
  });

export const PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT =
  freezeRecord({
    [worker748]: freezeArray([
      "react-dom-hydrate-root",
      "react-dom-hydration",
      "react-dom-root-render",
      "hydration-resource-form-controlled-public-compatibility"
    ]),
    [worker749]: freezeArray([
      "test-renderer-sibling-text-tojson-identity-public-serialization",
      "native-bridge-loading",
      "native-execution",
      "js-facade",
      "cjs-facade",
      "package-compatibility"
    ]),
    [worker751]: freezeArray([
      "scheduler-post-task-yield",
      "scheduler-yield-public-timing",
      "scheduler-browser-task-ordering",
      "public-act",
      "renderer-work",
      "effects"
    ]),
    [worker752]: freezeArray([
      PRIVATE_ADMISSION_739_745_GATE_ID,
      "public-root-act-flushsync-reactdom-scheduler-hydration-native-package-blockers"
    ]),
    [worker753]: freezeArray([
      "react-dom-test-utils-act",
      "react-dom-flush-sync",
      "react-act",
      "public-root",
      "renderer-work",
      "effects",
      "native-bridge-execution"
    ])
  });

export const PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS =
  freezeRecord({
    [worker748]: freezeArray([
      "publicRootCreated: false",
      "domMutated: false",
      "eventsReplayed: false",
      "publicResourceDomInsertionCompatibilityClaimed: false"
    ]),
    [worker749]: freezeArray([
      "public_to_json_available: false",
      "public_serialization_available: false",
      "native_bridge_available: false",
      "native_execution_available: false",
      "public-or-native-package-js-compatibility-claim"
    ]),
    [worker751]: freezeArray([
      "publicSchedulerTimingCompatibilityClaimed: false",
      "browserTaskOrderingCompatibilityClaimed: false",
      "publicRootSchedulerCompatibilityClaimed: false",
      "publicRendererCompatibilityClaimed: false",
      "stale-continuation"
    ]),
    [worker752]: freezeArray([
      PRIVATE_ADMISSION_739_745_GATE_STATUS,
      "Public root/act/flushSync/Scheduler timing/hydration/test-renderer serialization",
      "native bridge loading/execution, package compatibility"
    ]),
    [worker753]: freezeArray([
      "publicActExecution: false",
      "publicFlushSyncExecution: false",
      "publicRootExecution: false",
      "publicEffectExecution: false",
      "executesRendererWork: false",
      "compatibilityClaimed: false"
    ])
  });

export const PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT =
  freezeRecord({
    [worker748]: freezeArray([
      worker746,
      "worker-741-react-dom-hydrateroot-private-facade-preflight",
      PRIVATE_ADMISSION_739_745_GATE_ID
    ]),
    [worker749]: freezeArray([
      "worker-745-test-renderer-sibling-text-identity-gate",
      PRIVATE_ADMISSION_739_745_GATE_ID
    ]),
    [worker751]: freezeArray([
      "worker-742-scheduler-mock-delayed-act-root-continuation",
      PRIVATE_ADMISSION_739_745_GATE_ID
    ]),
    [worker752]: freezeArray([
      worker746,
      PRIVATE_ADMISSION_739_745_GATE_ID,
      PRIVATE_ADMISSION_739_745_GATE_STATUS
    ]),
    [worker753]: freezeArray([
      "worker-694-sync-flush-nested-act-root-continuation",
      "worker-718-sync-flush-root-scheduler-finished-work-handoff",
      PRIVATE_ADMISSION_739_745_GATE_ID
    ])
  });

export const PRIVATE_ADMISSION_746_753_REQUIRED_HYDRATE_ROOT_METADATA =
  freezeRecord({
    [worker748]: freezeRecord({
      sharesBoundaryOwnedSnapshot: true,
      recordsMetadataIdsAndGateIds: true,
      validatesSameBoundaryMetadata: true,
      validatesMetadataRows: true,
      rejectsTopLevelPublicFlags: true,
      rejectsRowLevelPublicClaims: true,
      publicHydrateRootBlocked: true,
      nativeHandoffBlocked: true,
      domMutationEventReplayBlocked: true
    })
  });

export const PRIVATE_ADMISSION_746_753_REQUIRED_SIBLING_NATIVE_TOJSON =
  freezeRecord({
    [worker749]: freezeRecord({
      requiresDedicatedSiblingTextIdentityGate: true,
      consumesPrivateSiblingTextFinishedWorkIdentityGate: true,
      recordsSourceIdentityDiagnosticName: true,
      rejectsMissingIdentity: true,
      rejectsStaleRouteAndTamperedIdentity: true,
      rejectsPublicNativePackageJsClaims: true,
      snapshotPathDoesNotConsumeIdentity: true,
      genericSiblingTextGateStillFailsClosed: true,
      publicNativePackageJsBlocked: true
    })
  });

export const PRIVATE_ADMISSION_746_753_REQUIRED_SCHEDULER_YIELD_HANDOFF =
  freezeRecord({
    [worker751]: freezeRecord({
      selectsSchedulerYieldWhenAvailable: true,
      recordsPrivateActRootHandoff: true,
      rejectsRootContinuationAsStale: true,
      controlledShimOnly: true,
      browserOrderingTimingBlocked: true,
      publicSchedulerTimingBlocked: true,
      publicReactActAndRootBlocked: true,
      rendererEffectsBlocked: true
    })
  });

export const PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_EVIDENCE =
  freezeRecord({
    [worker752]: freezeRecord({
      recordsWorker739745Ledger: true,
      carriesForward739745Blockers: true,
      pinsWorker748749751753PrerequisiteBlockers: false,
      staticReadOnlyLedger: true,
      runtimeCapabilityAdded: false
    })
  });

export const PRIVATE_ADMISSION_746_753_REQUIRED_TEST_UTILS_ACT_HANDOFF =
  freezeRecord({
    [worker753]: freezeRecord({
      requiresWorker694NestedActContinuation: true,
      requiresWorker718FinishedWorkAndLanes: true,
      rejectsMissingEvidence: true,
      rejectsStaleEvidence: true,
      rejectsForeignFinishedWorkHandoff: true,
      publicActBlocked: true,
      publicFlushSyncBlocked: true,
      publicRootExecutionBlocked: true,
      effectsRendererNativeBlocked: true,
      compatibilityBlocked: true
    })
  });

const skippedRowData746753 = Object.freeze([
  skippedRowData({
    workerId: worker746,
    area: "coordination docs recording accepted Workers 740-745",
    skipReason: "docs-only-coordination-no-runtime-capability",
    evidenceRows: [
      evidenceData({
        role: "worker-746-progress",
        path: "worker-progress/worker-746-record-740-745-docs.md",
        tokens: [
          "# Worker 746: Record Workers 740-745 Docs",
          "Refreshing `MASTER_PLAN.md` and `MASTER_PROGRESS.md` after accepted Workers",
          "Treating docs-only Workers 739 and 743 as existing coordination history",
          "Worker 740 is accepted as an inert JS/package-surface mirror only",
          "Worker 745 is accepted as a narrow Rust-only private sibling-text `toJSON`"
        ]
      })
    ]
  })
]);

const rowData746753 = Object.freeze([
  rowData({
    workerId: worker748,
    privateAdmission: "accepted-private-hydration-metadata-evidence",
    area: "React DOM hydrateRoot accepted private metadata snapshot evidence",
    primaryCompatibilityArea:
      "react-dom-hydrateroot-boundary-metadata-public-hydration-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker748],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker748],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker748],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker748],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker748
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker748],
    hydrateRootMetadata:
      PRIVATE_ADMISSION_746_753_REQUIRED_HYDRATE_ROOT_METADATA[worker748],
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-748-progress",
        path: "worker-progress/worker-748-hydrateroot-boundary-metadata-snapshot.md",
        tokens: [
          "# Worker 748: hydrateRoot Boundary Metadata Snapshot",
          "acceptedPrivateMetadataDiagnostics",
          "metadata diagnostics are missing, stale, from another boundary record",
          "granular resource DOM insertion, stylesheet, form action, form reset, and",
          "Public `hydrateRoot` remains blocked"
        ]
      }),
      evidenceData({
        role: "worker-748-root-bridge-metadata-source",
        path: "packages/react-dom/src/client/root-bridge.js",
        sliceStart: "function createHydrateRootRecordWithBridge(",
        sliceEnd: "function createRootUpdateRecordWithBridge(",
        tokens: [
          "assertHydrationBoundaryAcceptedPrivateMetadataDiagnostics",
          "acceptedPrivateMetadataDiagnostics",
          "acceptedPrivateMetadataIds:",
          "acceptedPrivateMetadataGateIds:",
          "publicRootCreated: false",
          "domMutated: false",
          "eventsReplayed: false",
          "nativeExecution: false"
        ]
      }),
      evidenceData({
        role: "worker-748-root-bridge-metadata-validator",
        path: "packages/react-dom/src/client/root-bridge.js",
        sliceStart:
          "function assertHydrationBoundaryAcceptedPrivateMetadataDiagnostics(",
        sliceEnd: "function validateHydrateRootBridgeRequestRecord(record) {",
        tokens: [
          "HYDRATION_BOUNDARY_ACCEPTED_METADATA_BLOCKED_PUBLIC_FIELDS",
          "assertHydrationBoundaryAcceptedPrivateMetadataRows",
          "metadataRows.length !== contractCount",
          "row.diagnosticOnly !== true",
          "row.readOnly !== true",
          "HYDRATION_BOUNDARY_ACCEPTED_METADATA_ROW_BLOCKED_PUBLIC_FIELDS",
          "accepted private metadata rows without public compatibility claims"
        ]
      }),
      evidenceData({
        role: "worker-748-public-facade-metadata-test",
        path: "tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs",
        tokens: [
          "record.acceptedPrivateMetadataDiagnostics",
          "record.acceptedPrivateMetadataIds",
          "record.acceptedPrivateMetadataGateIds",
          "metadata.publicResourceDomInsertionCompatibilityClaimed, false",
          "metadata.formResetCommitted, false",
          "record.publicRootCreated, false",
          "publicCompatibilityClaimed"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker749,
    privateAdmission:
      "accepted-private-native-tojson-identity-consumption-evidence",
    area: "Rust-only sibling-text native toJSON identity-consumption evidence",
    primaryCompatibilityArea:
      "test-renderer-sibling-text-native-tojson-public-native-package-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker749],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker749],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker749],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker749],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker749
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker749],
    siblingNativeToJSON:
      PRIVATE_ADMISSION_746_753_REQUIRED_SIBLING_NATIVE_TOJSON[worker749],
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-749-progress",
        path: "worker-progress/worker-749-sibling-text-native-tojson-consumes-identity.md",
        tokens: [
          "# Worker 749: Sibling Text Native toJSON Consumes Identity",
          "Added a Rust-only real-output sibling-text native `toJSON` diagnostic path",
          "continues to report no identity\n  source and no sibling identity-gate consumption",
          "Existing generic `SiblingText` finished-work identity rejection remains",
          "public serialization,\n  JS/CJS admission, native bridge loading/execution, package compatibility"
        ]
      }),
      evidenceData({
        role: "worker-749-native-tojson-source",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn describe_private_to_json_after_sibling_text_update_native_execution_for_canary(",
        sliceEnd:
          "pub fn describe_private_to_json_sibling_text_update_native_execution_from_snapshot_for_diagnostics(",
        tokens: [
          "validate_private_to_json_sibling_text_native_execution_identity_for_canary",
          "TestRendererPrivateJsonSerializationError::NativeExecutionRecordMismatch",
          "source_finished_work_identity_diagnostic_name = Some(identity.diagnostic_name())",
          "consumes_private_sibling_text_finished_work_identity_gate = true"
        ]
      }),
      evidenceData({
        role: "worker-749-native-tojson-tests",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_json_sibling_text_real_output_native_execution_consumes_identity_gate()",
        sliceEnd:
          "fn root_private_to_json_sibling_text_real_output_native_execution_rejects_missing_or_tampered_identity()",
        tokens: [
          "describe_private_to_json_after_sibling_text_update_native_execution_for_canary",
          "TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME",
          "consumes_private_sibling_text_finished_work_identity_gate()",
          "public_to_json_available()",
          "public_serialization_available()",
          "native_bridge_available()",
          "native_execution_available()",
          "compatibility_claimed()"
        ]
      }),
      evidenceData({
        role: "worker-749-native-tojson-tamper-tests",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn root_private_to_json_sibling_text_real_output_native_execution_rejects_missing_or_tampered_identity()",
        sliceEnd:
          "fn root_private_to_json_sibling_text_report_fails_closed_in_generic_finished_work_identity_gate()",
        tokens: [
          "finished-work-identity-missing",
          "sibling-text-finished-work-identity-source-mismatch",
          "sibling-text-route-finished-work-identity-mismatch",
          "update-admission-handoff-mismatch",
          "public-or-native-package-js-compatibility-claim",
          "HostOutputSnapshotStale"
        ]
      }),
      evidenceData({
        role: "worker-749-generic-sibling-gate-still-blocked",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        tokens: [
          "describe_private_to_json_finished_work_identity_gate_for_canary",
          "TestRendererPrivateToJsonHostOutputShape::SiblingText",
          "sibling-text-finished-work-identity-gate-not-implemented"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker751,
    privateAdmission: "accepted-private-scheduler-yield-handoff-evidence",
    area: "Scheduler postTask yield-path private handoff diagnostic evidence",
    primaryCompatibilityArea:
      "scheduler-post-task-yield-private-handoff-public-browser-timing-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker751],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker751],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker751],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker751],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker751
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker751],
    schedulerYieldHandoff:
      PRIVATE_ADMISSION_746_753_REQUIRED_SCHEDULER_YIELD_HANDOFF[worker751],
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-751-progress",
        path: "worker-progress/worker-751-scheduler-posttask-yield-handoff.md",
        tokens: [
          "# Worker 751: Scheduler postTask Yield Handoff",
          "globalThis.scheduler.yield",
          "rejects it as `stale-continuation`",
          "public Scheduler timing, public React act, public root scheduler",
          "renderer\n  work, effects, browser ordering/timing, and compatibility claims false"
        ]
      }),
      evidenceData({
        role: "worker-751-root-continuation-yield-test",
        path: "tests/conformance/test/scheduler-post-task-root-continuation.test.mjs",
        tokens: [
          "private postTask delayed scheduler.yield handoff stays diagnostic-only after continuation execution",
          "['yield', 'yield.then']",
          "continuation.fallback, 'scheduler.yield'",
          "publicSchedulerTimingCompatibilityClaimed, false",
          "publicRootSchedulerCompatibilityClaimed, false",
          "row.rejectionReason, 'stale-continuation'",
          "publicRootSchedulerCompatibilityClaimed: true"
        ]
      }),
      evidenceData({
        role: "worker-751-post-task-oracle-yield-test",
        path: "tests/conformance/test/scheduler-post-task-oracle.test.mjs",
        tokens: [
          "scheduler post-task private diagnostics preserve delayed act/root handoff on scheduler.yield path",
          "controlled-shim-scheduler-yield-continuation",
          "accepted-private-scheduler-post-task-act-root-work-handoff",
          "rendererWorkExecutionBlocked, true",
          "publicSchedulerTimingCompatibilityClaimed, false",
          "publicRootSchedulerCompatibilityClaimed, false",
          "publicRendererCompatibilityClaimed, false"
        ]
      }),
      evidenceData({
        role: "worker-751-root-continuation-stale-guard",
        path: "tests/conformance/src/scheduler-post-task-root-continuation.cjs",
        tokens: [
          "reason: 'stale-continuation'",
          "continuation.callbackRunCountAtSchedule !== currentCallbackRunCount",
          "publicSchedulerTimingCompatibilityClaimed: false",
          "publicRootSchedulerCompatibilityClaimed",
          "publicRendererCompatibilityClaimed"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker752,
    privateAdmission: "accepted-private-ledger-evidence",
    area: "static private-admission ledger evidence for accepted Workers 739-745",
    primaryCompatibilityArea:
      "private-admission-static-ledger-739-745-public-compatibility-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker752],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker752],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker752],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker752],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker752
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker752],
    priorLedgerEvidence:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_EVIDENCE[worker752],
    runtimeCapabilityAdded: false,
    promotion: "not-applicable",
    evidenceRows: [
      evidenceData({
        role: "worker-752-progress",
        path: "worker-progress/worker-752-package-private-admission-audit-739-745.md",
        tokens: [
          "# Worker 752: Package Private Admission Audit 739-745",
          "Added the static/read-only private-admission ledger gate for accepted Workers",
          "Public root/act/flushSync/Scheduler timing/hydration/test-renderer",
          "native bridge loading/execution, package\n  compatibility",
          "This is static conformance evidence only"
        ]
      }),
      evidenceData({
        role: "worker-752-ledger-source",
        path: "tests/conformance/src/private-admission-739-745-gate.mjs",
        tokens: [
          "PRIVATE_ADMISSION_739_745_GATE_ID",
          "recognized-accepted-private-diagnostics-739-745-public-compatibility-blocked",
          "worker-740-native-package-worker-thread-teardown-mirror",
          "worker-741-react-dom-hydrateroot-private-facade-preflight",
          "worker-742-scheduler-mock-delayed-act-root-continuation",
          "worker-745-test-renderer-sibling-text-identity-gate",
          "publicSchedulerTimingCompatibilityClaimed",
          "nativeBridgeExecutionClaimed"
        ]
      }),
      evidenceData({
        role: "worker-752-ledger-test",
        path: "tests/conformance/test/private-admission-739-745-gate.test.mjs",
        tokens: [
          "private admission 739-745 gate recognizes accepted private evidence without compatibility",
          "private admission 739-745 gate rejects removing Worker 742 delayed Scheduler blocker evidence",
          "private admission 739-745 gate rejects removing Worker 745 sibling identity blocker evidence",
          "private admission 739-745 gate rejects public, native, JS, CJS, and package claims",
          "private admission 739-745 gate rejects runtime execution claims in the static ledger"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker753,
    privateAdmission: "accepted-private-test-utils-act-handoff-evidence",
    area: "React DOM test-utils act private sync-flush/root handoff evidence",
    primaryCompatibilityArea:
      "react-dom-test-utils-act-private-handoff-public-act-flushsync-root-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS[worker753],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES[worker753],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker753],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT[worker753],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker753
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT[worker753],
    testUtilsActHandoff:
      PRIVATE_ADMISSION_746_753_REQUIRED_TEST_UTILS_ACT_HANDOFF[worker753],
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-753-progress",
        path: "worker-progress/worker-753-react-dom-test-utils-act-handoff.md",
        tokens: [
          "# Worker 753: React DOM Test-Utils Act Handoff",
          "Worker\n  694 nested sync-flush/act root continuation evidence and Worker 718",
          "public React act,\n  public React DOM `flushSync`, public root execution",
          "missing prerequisite IDs, stale Worker\n  694/718 evidence",
          "real public behavior still needs separate facade and renderer\n  execution gates"
        ]
      }),
      evidenceData({
        role: "worker-753-test-utils-act-gate-source",
        path: "packages/react-dom/src/test-utils-act-gate.js",
        sliceStart: "const privateSyncFlushRootHandoffDiagnosticGateId =",
        sliceEnd:
          "const acceptedPrivatePrerequisitePublicClaimFields = freezeArray([",
        tokens: [
          "react-dom-test-utils-act-private-sync-flush-root-handoff-gate-1",
          "worker-694-sync-flush-nested-act-root-continuation",
          "worker-718-sync-flush-root-scheduler-finished-work-handoff",
          "SyncFlushRootRecord.finished_work",
          "SyncFlushRootRecord.finished_lanes",
          "FiberRoot.finished_work",
          "FiberRoot.finished_lanes",
          "rejectsMissingEvidence: true",
          "rejectsStaleEvidence: true",
          "rejectsForeignFinishedWorkHandoff: true",
          "publicActExecution: false",
          "publicFlushSyncExecution: false",
          "executesRendererWork: false",
          "compatibilityClaimed: false"
        ]
      }),
      evidenceData({
        role: "worker-753-test-utils-act-oracle-test",
        path: "tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs",
        tokens: [
          "Fast React test-utils act private routing gate records accepted prerequisites without opening public act",
          "public-act-flushsync-root-execution-remains-blocked",
          "compatibility-claimed-before-public-act-routing",
          "public-act-routing-opened-before-prerequisites",
          "SyncFlushRootRecord.finished_work",
          "SyncFlushRootRecord.finished_lanes",
          "publicFlushSyncCompatibilityClaimed, false"
        ]
      }),
      evidenceData({
        role: "worker-753-act-passive-local-gate",
        path: "tests/conformance/src/act-passive-local-gate.mjs",
        tokens: [
          "react-dom-test-utils-act.sideEffectPolicy",
          "executesRendererWork",
          "executesPublicFlushSync",
          "publicReactActCompatibilityClaimed",
          "publicSchedulerTimingCompatibilityClaimed"
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_746_753_ROWS = freezeArray(
  rowData746753.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      privateAdmission: sourceRow.privateAdmission,
      area: sourceRow.area,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      dependencyWorkerIds: sourceRow.dependencyWorkerIds,
      dependencyDiagnosticIds: sourceRow.dependencyDiagnosticIds,
      blockerContextWorkerIds: sourceRow.blockerContextWorkerIds,
      blockerContextDiagnosticIds: sourceRow.blockerContextDiagnosticIds,
      priorLedgerContext: sourceRow.priorLedgerContext,
      hydrateRootMetadata: sourceRow.hydrateRootMetadata,
      siblingNativeToJSON: sourceRow.siblingNativeToJSON,
      schedulerYieldHandoff: sourceRow.schedulerYieldHandoff,
      priorLedgerEvidence: sourceRow.priorLedgerEvidence,
      testUtilsActHandoff: sourceRow.testUtilsActHandoff,
      runtimeCapabilityAdded: sourceRow.runtimeCapabilityAdded,
      promotion: sourceRow.promotion,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_746_753_SKIPPED_ROWS = freezeArray(
  skippedRowData746753.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      privateAdmission: "skipped-meta",
      area: sourceRow.area,
      primaryCompatibilityArea: "coordination-docs-no-compatibility-claim",
      acceptedDiagnosticIds: [],
      dependencyWorkerIds: [],
      dependencyDiagnosticIds: [],
      blockerContextWorkerIds: [],
      blockerContextDiagnosticIds: [],
      priorLedgerContext: [],
      hydrateRootMetadata: {},
      siblingNativeToJSON: {},
      schedulerYieldHandoff: {},
      priorLedgerEvidence: {},
      testUtilsActHandoff: {},
      runtimeCapabilityAdded: false,
      promotion: "not-applicable",
      skipReason: sourceRow.skipReason,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_746_753_WORKERS = freezeArray(
  PRIVATE_ADMISSION_746_753_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission746753Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_746_753_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const skippedRows = PRIVATE_ADMISSION_746_753_SKIPPED_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, skippedRowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const evaluatedSkippedRows = skippedRows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const allRows = [...evaluatedRows, ...evaluatedSkippedRows];

  const manifestWorkerIds = rows.map((row) => row.workerId);
  const skippedManifestWorkerIds = skippedRows.map((row) => row.workerId);
  const manifest = freezeRecord({
    workerIds: freezeArray(manifestWorkerIds),
    skippedWorkerIds: freezeArray(skippedManifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_746_753_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_746_753_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    ),
    missingSkippedWorkerIds: freezeArray(
      PRIVATE_ADMISSION_746_753_SKIPPED_WORKERS.filter(
        (workerId) => !skippedManifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedSkippedWorkerIds: freezeArray(
      skippedManifestWorkerIds.filter(
        (workerId) =>
          !PRIVATE_ADMISSION_746_753_SKIPPED_WORKERS.includes(workerId)
      )
    ),
    duplicateSkippedWorkerIds: freezeArray(
      skippedManifestWorkerIds.filter(
        (workerId, index) =>
          skippedManifestWorkerIds.indexOf(workerId) !== index
      )
    )
  });

  const evidenceTokenMismatches = allRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError,
          sliceError: evidenceRow.sliceError
        })
      )
  );
  const acceptedDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_746_753_REQUIRED_ACCEPTED_DIAGNOSTICS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds",
    predicate: (row, expected, actual) =>
      acceptedPrivateAdmissionKinds.has(row.privateAdmission) &&
      sameStringSet(expected, actual)
  });
  const dependencyMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCIES,
    actualKey: "dependencyWorkerIds",
    expectedKey: "expectedDependencyWorkerIds",
    actualKeyForViolation: "actualDependencyWorkerIds"
  });
  const dependencyDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_746_753_REQUIRED_DEPENDENCY_DIAGNOSTICS,
    actualKey: "dependencyDiagnosticIds",
    expectedKey: "expectedDependencyDiagnosticIds",
    actualKeyForViolation: "actualDependencyDiagnosticIds"
  });
  const blockerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT,
    actualKey: "blockerContextWorkerIds",
    expectedKey: "expectedBlockerContextWorkerIds",
    actualKeyForViolation: "actualBlockerContextWorkerIds"
  });
  const blockerContextDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_746_753_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
    actualKey: "blockerContextDiagnosticIds",
    expectedKey: "expectedBlockerContextDiagnosticIds",
    actualKeyForViolation: "actualBlockerContextDiagnosticIds"
  });
  const priorLedgerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_CONTEXT,
    actualKey: "priorLedgerContext",
    expectedKey: "expectedPriorLedgerContext",
    actualKeyForViolation: "actualPriorLedgerContext"
  });
  const hydrateRootMetadataMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_746_753_REQUIRED_HYDRATE_ROOT_METADATA,
    actualKey: "hydrateRootMetadata",
    expectedKey: "expectedHydrateRootMetadata",
    actualKeyForViolation: "actualHydrateRootMetadata"
  });
  const siblingNativeToJSONMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_746_753_REQUIRED_SIBLING_NATIVE_TOJSON,
    actualKey: "siblingNativeToJSON",
    expectedKey: "expectedSiblingNativeToJSON",
    actualKeyForViolation: "actualSiblingNativeToJSON"
  });
  const schedulerYieldHandoffMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_746_753_REQUIRED_SCHEDULER_YIELD_HANDOFF,
    actualKey: "schedulerYieldHandoff",
    expectedKey: "expectedSchedulerYieldHandoff",
    actualKeyForViolation: "actualSchedulerYieldHandoff"
  });
  const priorLedgerEvidenceMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_746_753_REQUIRED_PRIOR_LEDGER_EVIDENCE,
    actualKey: "priorLedgerEvidence",
    expectedKey: "expectedPriorLedgerEvidence",
    actualKeyForViolation: "actualPriorLedgerEvidence"
  });
  const testUtilsActHandoffMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_746_753_REQUIRED_TEST_UTILS_ACT_HANDOFF,
    actualKey: "testUtilsActHandoff",
    expectedKey: "expectedTestUtilsActHandoff",
    actualKeyForViolation: "actualTestUtilsActHandoff"
  });

  const publicCompatibilityClaimKeyMismatches = allRows.flatMap((row) => {
    const actualClaimIds = Object.keys(row.publicCompatibilityClaims ?? {});
    if (
      sameStringSet(
        PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS,
        actualClaimIds
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicCompatibilityClaims:
          PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS,
        actualPublicCompatibilityClaims: freezeArray(actualClaimIds)
      })
    ];
  });
  const blockedSurfaceMismatches = allRows.flatMap((row) => {
    const actualBlockedSurfaces = row.blockedPublicCompatibilitySurfaces ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES,
        actualBlockedSurfaces
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES,
        actualBlockedPublicCompatibilitySurfaces: freezeArray(
          actualBlockedSurfaces
        )
      })
    ];
  });
  const blockedPublicClaimMismatches = allRows.flatMap((row) => {
    const actualBlockedClaims = row.blockedPublicClaims ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicClaims:
          PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedPublicClaims: freezeArray(actualBlockedClaims)
      })
    ];
  });
  const blockedAdmissionClaimMismatches = allRows.flatMap((row) => {
    const actualBlockedAdmissionClaims = row.blockedAdmissionClaimIds ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedAdmissionClaims:
          PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims: freezeArray(actualBlockedAdmissionClaims)
      })
    ];
  });

  const staticReadOnlyViolations = allRows
    .filter(
      (row) =>
        row.sourceTokenChecksOnly !== true ||
        row.manifestEvaluationOnly !== true ||
        row.runtimeExecutionClaimed !== false ||
        row.ledgerEvaluationMode !== "source-token-checks-and-manifest-only"
    )
    .map((row) => row.workerId);
  const compatibilityClaimWorkerIds = allRows
    .filter((row) => row.compatibilityClaimed !== false)
    .map((row) => row.workerId);
  const promotionLeakWorkerIds = allRows
    .filter((row) => {
      if (
        row.privateAdmission === "accepted-private-ledger-evidence" ||
        row.privateAdmission === "skipped-meta"
      ) {
        return row.promotion !== "not-applicable";
      }
      return row.promotion !== "rejected";
    })
    .map((row) => row.workerId);
  const publicCompatibilityViolations = allRows.flatMap((row) =>
    row.publicCompatibilityViolations.map(
      (claimId) => `${row.workerId}.${claimId}`
    )
  );
  const blockedAdmissionClaimViolations = allRows.flatMap((row) =>
    row.blockedAdmissionClaimViolations.map(
      (claimId) => `${row.workerId}.${claimId}`
    )
  );
  const nativeJsPackageLeakClaimIds = blockedAdmissionClaimViolations.filter(
    (claimId) =>
      /(?:packageCompatibilityClaimed|packageSurfaceAdmissionClaimed|rustOnlyDiagnosticPromotedToPackageClaimed|jsFacadeAdmissionClaimed|cjsFacadeAdmissionClaimed|nativeBridgeLoadingClaimed|nativeBridgeExecutionClaimed|nativeExecutionAdmissionClaimed|nativeToJSONPublicAdmissionClaimed|testRendererNativeBridgeCompatibilityClaimed)$/.test(
        claimId
      )
  );
  const publicRendererLeakClaimIds = [
    ...publicCompatibilityViolations,
    ...blockedAdmissionClaimViolations
  ].filter((claimId) =>
    /(?:ReactDom|ReactDOM|ReactAct|FlushSync|Scheduler|HydrateRoot|Hydration|TestRenderer|Serialization|Multichild|Sibling|Renderer|Effect|Native|reactDomRootRenderAdmissionClaimed|reactDomTestUtilsActAdmissionClaimed|reactDomFlushSyncAdmissionClaimed|reactActAdmissionClaimed|hydrationBoundaryMetadataAdmissionClaimed|schedulerPostTaskYieldPublicAdmissionClaimed|schedulerYieldTimingAdmissionClaimed|schedulerBrowserCompatibilityClaimed|rendererEffectsAdmissionClaimed)/.test(
      claimId
    )
  );
  const unrecognizedWorkerIds = evaluatedRows
    .filter((row) => !acceptedPrivateAdmissionKinds.has(row.privateAdmission))
    .map((row) => row.workerId);
  const unrecognizedSkippedWorkerIds = evaluatedSkippedRows
    .filter((row) => row.privateAdmission !== "skipped-meta")
    .map((row) => row.workerId);

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("accepted-private-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  if (
    manifest.missingSkippedWorkerIds.length > 0 ||
    manifest.unexpectedSkippedWorkerIds.length > 0 ||
    manifest.duplicateSkippedWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("skipped-meta-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingSkippedWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedSkippedWorkerIds,
        duplicateWorkerIds: manifest.duplicateSkippedWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-evidence-file-or-token-missing",
    evidenceTokenMismatches
  );
  pushIdsViolation(
    violations,
    "required-private-evidence-not-recognized",
    unrecognizedWorkerIds
  );
  pushIdsViolation(
    violations,
    "required-skip-meta-row-not-recognized",
    unrecognizedSkippedWorkerIds
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-id-mismatch",
    acceptedDiagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-dependency-mismatch",
    dependencyMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-dependency-diagnostic-mismatch",
    dependencyDiagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-blocker-context-mismatch",
    blockerContextMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-private-diagnostic-blocker-context-diagnostic-mismatch",
    blockerContextDiagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "prior-private-admission-ledger-context-mismatch",
    priorLedgerContextMismatches
  );
  pushRowsViolation(
    violations,
    "hydrate-root-metadata-evidence-mismatch",
    hydrateRootMetadataMismatches
  );
  pushRowsViolation(
    violations,
    "sibling-text-native-tojson-evidence-mismatch",
    siblingNativeToJSONMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-yield-handoff-evidence-mismatch",
    schedulerYieldHandoffMismatches
  );
  pushRowsViolation(
    violations,
    "prior-private-admission-ledger-evidence-mismatch",
    priorLedgerEvidenceMismatches
  );
  pushRowsViolation(
    violations,
    "test-utils-act-handoff-evidence-mismatch",
    testUtilsActHandoffMismatches
  );
  pushRowsViolation(
    violations,
    "public-compatibility-claim-key-mismatch",
    publicCompatibilityClaimKeyMismatches
  );
  pushRowsViolation(
    violations,
    "blocked-public-compatibility-surface-mismatch",
    blockedSurfaceMismatches
  );
  pushRowsViolation(
    violations,
    "blocked-public-claim-mismatch",
    blockedPublicClaimMismatches
  );
  pushRowsViolation(
    violations,
    "blocked-admission-claim-mismatch",
    blockedAdmissionClaimMismatches
  );
  pushIdsViolation(
    violations,
    "private-ledger-runtime-execution-claim",
    staticReadOnlyViolations
  );
  pushIdsViolation(
    violations,
    "private-diagnostic-claimed-compatibility",
    compatibilityClaimWorkerIds
  );
  pushClaimIdsViolation(
    violations,
    "public-compatibility-claim-detected",
    publicCompatibilityViolations
  );
  pushClaimIdsViolation(
    violations,
    "blocked-admission-claim-detected",
    blockedAdmissionClaimViolations
  );
  pushClaimIdsViolation(
    violations,
    "native-js-package-compatibility-leak-detected",
    nativeJsPackageLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "public-root-act-flushsync-hydration-test-renderer-scheduler-leak-detected",
    publicRendererLeakClaimIds
  );
  pushIdsViolation(
    violations,
    "private-diagnostic-public-promotion-leak",
    promotionLeakWorkerIds
  );

  const evidenceRecognized = evidenceTokenMismatches.length === 0;
  const acceptedDiagnosticsRecognized =
    acceptedDiagnosticMismatches.length === 0 &&
    unrecognizedWorkerIds.length === 0;
  const dependenciesRecognized =
    dependencyMismatches.length === 0 &&
    dependencyDiagnosticMismatches.length === 0;
  const blockerContextRecognized =
    blockerContextMismatches.length === 0 &&
    blockerContextDiagnosticMismatches.length === 0;
  const priorLedgerContextRecognized =
    priorLedgerContextMismatches.length === 0;
  const hydrateRootMetadataRecognized =
    hydrateRootMetadataMismatches.length === 0;
  const siblingNativeToJSONRecognized =
    siblingNativeToJSONMismatches.length === 0;
  const schedulerYieldHandoffRecognized =
    schedulerYieldHandoffMismatches.length === 0;
  const priorLedgerEvidenceRecognized =
    priorLedgerEvidenceMismatches.length === 0;
  const testUtilsActHandoffRecognized =
    testUtilsActHandoffMismatches.length === 0;
  const blockedPublicSurfacesRecognized =
    blockedSurfaceMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicCompatibilityClaimKeyMismatches.length === 0 &&
    blockedPublicClaimMismatches.length === 0 &&
    publicCompatibilityViolations.length === 0;
  const blockedAdmissionClaimsRecognized =
    blockedAdmissionClaimMismatches.length === 0 &&
    blockedAdmissionClaimViolations.length === 0;
  const staticReadOnlyRecognized = staticReadOnlyViolations.length === 0;
  const skipMetaRecognized = unrecognizedSkippedWorkerIds.length === 0;
  const compatibilityClaimed =
    compatibilityClaimWorkerIds.length > 0 ||
    publicCompatibilityViolations.length > 0 ||
    blockedAdmissionClaimViolations.length > 0 ||
    promotionLeakWorkerIds.length > 0;
  const publicCompatibilityClaimed = publicCompatibilityViolations.length > 0;
  const privateDiagnosticsRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    manifest.missingSkippedWorkerIds.length === 0 &&
    manifest.unexpectedSkippedWorkerIds.length === 0 &&
    manifest.duplicateSkippedWorkerIds.length === 0 &&
    acceptedDiagnosticsRecognized &&
    dependenciesRecognized &&
    blockerContextRecognized &&
    priorLedgerContextRecognized &&
    evidenceRecognized &&
    hydrateRootMetadataRecognized &&
    siblingNativeToJSONRecognized &&
    schedulerYieldHandoffRecognized &&
    priorLedgerEvidenceRecognized &&
    testUtilsActHandoffRecognized &&
    blockedPublicSurfacesRecognized &&
    blockedPublicClaimsRecognized &&
    blockedAdmissionClaimsRecognized &&
    staticReadOnlyRecognized &&
    skipMetaRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_746_753_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_746_753_GATE_STATUS
      : PRIVATE_ADMISSION_746_753_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    skipMetaRecognized,
    acceptedDiagnosticsRecognized,
    dependenciesRecognized,
    blockerContextRecognized,
    priorLedgerContextRecognized,
    evidenceRecognized,
    hydrateRootMetadataRecognized,
    siblingNativeToJSONRecognized,
    schedulerYieldHandoffRecognized,
    priorLedgerEvidenceRecognized,
    testUtilsActHandoffRecognized,
    blockedPublicSurfacesRecognized,
    blockedPublicClaimsRecognized,
    blockedAdmissionClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    publicCompatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_746_753_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_746_753_SKIPPED_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => acceptedPrivateAdmissionKinds.has(row.privateAdmission))
        .map((row) => row.workerId)
    ),
    recognizedSkippedWorkerIds: freezeArray(
      evaluatedSkippedRows
        .filter((row) => row.privateAdmission === "skipped-meta")
        .map((row) => row.workerId)
    ),
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolationIds: freezeArray(
      blockedAdmissionClaimViolations
    ),
    nativeJsPackageLeakClaimIds: freezeArray(nativeJsPackageLeakClaimIds),
    publicRendererLeakClaimIds: freezeArray(publicRendererLeakClaimIds),
    manifest,
    rows: freezeArray(evaluatedRows),
    skippedRows: freezeArray(evaluatedSkippedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    skippedRowsByWorker: indexRowsByWorker(evaluatedSkippedRows),
    violations: freezeArray(violations)
  });
}

const acceptedPrivateAdmissionKinds = new Set([
  "accepted-private-hydration-metadata-evidence",
  "accepted-private-native-tojson-identity-consumption-evidence",
  "accepted-private-scheduler-yield-handoff-evidence",
  "accepted-private-ledger-evidence",
  "accepted-private-test-utils-act-handoff-evidence"
]);

function rowData(data) {
  return freezeRecord({
    ...data,
    acceptedDiagnosticIds: freezeArray(data.acceptedDiagnosticIds ?? []),
    dependencyWorkerIds: freezeArray(data.dependencyWorkerIds ?? []),
    dependencyDiagnosticIds: freezeArray(data.dependencyDiagnosticIds ?? []),
    blockerContextWorkerIds: freezeArray(data.blockerContextWorkerIds ?? []),
    blockerContextDiagnosticIds: freezeArray(
      data.blockerContextDiagnosticIds ?? []
    ),
    priorLedgerContext: freezeArray(data.priorLedgerContext ?? []),
    hydrateRootMetadata: freezeRecord(data.hydrateRootMetadata ?? {}),
    siblingNativeToJSON: freezeRecord(data.siblingNativeToJSON ?? {}),
    schedulerYieldHandoff: freezeRecord(data.schedulerYieldHandoff ?? {}),
    priorLedgerEvidence: freezeRecord(data.priorLedgerEvidence ?? {}),
    testUtilsActHandoff: freezeRecord(data.testUtilsActHandoff ?? {}),
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function skippedRowData(data) {
  return rowData(data);
}

function evidenceData({
  role,
  path,
  tokens,
  forbiddenTokens = [],
  sliceStart = null,
  sliceEnd = null
}) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens),
    sliceStart,
    sliceEnd
  });
}

function admissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function blockedAdmissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function row({
  workerId,
  privateAdmission,
  area,
  primaryCompatibilityArea,
  acceptedDiagnosticIds,
  dependencyWorkerIds,
  dependencyDiagnosticIds,
  blockerContextWorkerIds,
  blockerContextDiagnosticIds,
  priorLedgerContext,
  hydrateRootMetadata,
  siblingNativeToJSON,
  schedulerYieldHandoff,
  priorLedgerEvidence,
  testUtilsActHandoff,
  runtimeCapabilityAdded,
  promotion,
  skipReason = null,
  evidence,
  publicCompatibilityClaims,
  privateAdmissionClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "746-753",
    privateAdmission,
    localGateCoverage: "private-admission-746-753-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(dependencyWorkerIds),
    dependencyDiagnosticIds: freezeArray(dependencyDiagnosticIds),
    blockerContextWorkerIds: freezeArray(blockerContextWorkerIds),
    blockerContextDiagnosticIds: freezeArray(blockerContextDiagnosticIds),
    priorLedgerContext: freezeArray(priorLedgerContext),
    hydrateRootMetadata: freezeRecord(hydrateRootMetadata),
    siblingNativeToJSON: freezeRecord(siblingNativeToJSON),
    schedulerYieldHandoff: freezeRecord(schedulerYieldHandoff),
    priorLedgerEvidence: freezeRecord(priorLedgerEvidence),
    testUtilsActHandoff: freezeRecord(testUtilsActHandoff),
    evidence: freezeArray(evidence),
    runtimeCapabilityAdded,
    compatibilityClaimed: false,
    promotion,
    skipReason,
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    ledgerEvaluationMode: "source-token-checks-and-manifest-only",
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims)),
    blockedAdmissionClaims: freezeRecord(privateAdmissionClaims),
    blockedAdmissionClaimIds: freezeArray(Object.keys(privateAdmissionClaims))
  });
}

function mergeRowOverride(row, override) {
  if (override == null || Object.keys(override).length === 0) {
    return row;
  }

  const merged = { ...row, ...override };
  const arrayKeys = [
    "acceptedDiagnosticIds",
    "dependencyWorkerIds",
    "dependencyDiagnosticIds",
    "blockerContextWorkerIds",
    "blockerContextDiagnosticIds",
    "priorLedgerContext",
    "blockedPublicCompatibilitySurfaces",
    "blockedPublicClaims",
    "blockedAdmissionClaimIds",
    "evidence"
  ];
  for (const key of arrayKeys) {
    if (Object.hasOwn(override, key)) {
      merged[key] = freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "publicCompatibilityClaims")) {
    merged.publicCompatibilityClaims = freezeRecord({
      ...row.publicCompatibilityClaims,
      ...override.publicCompatibilityClaims
    });
  }
  if (Object.hasOwn(override, "blockedAdmissionClaims")) {
    merged.blockedAdmissionClaims = freezeRecord({
      ...row.blockedAdmissionClaims,
      ...override.blockedAdmissionClaims
    });
  }
  if (Object.hasOwn(override, "hydrateRootMetadata")) {
    merged.hydrateRootMetadata = freezeRecord({
      ...row.hydrateRootMetadata,
      ...override.hydrateRootMetadata
    });
  }
  if (Object.hasOwn(override, "siblingNativeToJSON")) {
    merged.siblingNativeToJSON = freezeRecord({
      ...row.siblingNativeToJSON,
      ...override.siblingNativeToJSON
    });
  }
  if (Object.hasOwn(override, "schedulerYieldHandoff")) {
    merged.schedulerYieldHandoff = freezeRecord({
      ...row.schedulerYieldHandoff,
      ...override.schedulerYieldHandoff
    });
  }
  if (Object.hasOwn(override, "priorLedgerEvidence")) {
    merged.priorLedgerEvidence = freezeRecord({
      ...row.priorLedgerEvidence,
      ...override.priorLedgerEvidence
    });
  }
  if (Object.hasOwn(override, "testUtilsActHandoff")) {
    merged.testUtilsActHandoff = freezeRecord({
      ...row.testUtilsActHandoff,
      ...override.testUtilsActHandoff
    });
  }

  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot })
  );
  const publicCompatibilityViolations = Object.entries(
    row.publicCompatibilityClaims ?? {}
  )
    .filter(([, claimed]) => claimed !== false)
    .map(([claimId]) => claimId);
  const blockedAdmissionClaimViolations = Object.entries(
    row.blockedAdmissionClaims ?? {}
  )
    .filter(([, claimed]) => claimed !== false)
    .map(([claimId]) => claimId);

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceRecognized: evidence.every(
      (evidenceRow) => evidenceRow.recognized === true
    ),
    publicCompatibilityViolations: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolations: freezeArray(
      blockedAdmissionClaimViolations
    )
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const fileText = readWorkspaceFile({
    fileCache,
    path: evidenceRow.path,
    workspaceRoot
  });
  const sourceText =
    fileText.ok === true
      ? extractEvidenceSourceSlice({
          text: fileText.value,
          sliceStart: evidenceRow.sliceStart,
          sliceEnd: evidenceRow.sliceEnd
        })
      : fileText;
  const missingTokens =
    sourceText.ok === true
      ? evidenceRow.tokens.filter((token) => !sourceText.value.includes(token))
      : evidenceRow.tokens;
  const forbiddenTokensPresent =
    sourceText.ok === true
      ? evidenceRow.forbiddenTokens.filter((token) =>
          sourceText.value.includes(token)
        )
      : [];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      sourceText.ok === true &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0,
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    readError: fileText.ok === true ? null : fileText.error,
    sliceError: sourceText.ok === true ? null : sourceText.error
  });
}

function extractEvidenceSourceSlice({ text, sliceStart, sliceEnd }) {
  if (sliceStart == null && sliceEnd == null) {
    return freezeRecord({ ok: true, value: text });
  }

  const startIndex = sliceStart == null ? 0 : text.indexOf(sliceStart);
  if (startIndex < 0) {
    return freezeRecord({
      ok: false,
      error: `slice-start-not-found: ${sliceStart}`
    });
  }

  const endSearchIndex =
    sliceStart == null ? startIndex : startIndex + sliceStart.length;
  const endIndex =
    sliceEnd == null ? text.length : text.indexOf(sliceEnd, endSearchIndex);
  if (endIndex < 0) {
    return freezeRecord({
      ok: false,
      error: `slice-end-not-found: ${sliceEnd}`
    });
  }

  return freezeRecord({
    ok: true,
    value: text.slice(startIndex, endIndex)
  });
}

function readWorkspaceFile({ fileCache, path, workspaceRoot }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  let result;
  try {
    result = freezeRecord({
      ok: true,
      value: readFileSync(join(workspaceRoot, path), "utf8")
    });
  } catch (error) {
    result = freezeRecord({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
  fileCache.set(path, result);
  return result;
}

function compareRequiredArrayByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation,
  predicate = (_row, expected, actual) => sameStringSet(expected, actual)
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId] ?? [];
    const actual = row[actualKey] ?? [];
    if (predicate(row, expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: freezeArray(expected),
        [actualKeyForViolation]: freezeArray(actual)
      })
    ];
  });
}

function compareRequiredRecordByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId] ?? {};
    const actual = row[actualKey] ?? {};
    if (sameRecord(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: freezeRecord(expected),
        [actualKeyForViolation]: freezeRecord(actual)
      })
    ];
  });
}

function createViolation(id, details = {}) {
  return freezeRecord({ id, ...details });
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(createViolation(id, { rows: freezeArray(rows) }));
  }
}

function pushIdsViolation(violations, id, workerIds) {
  if (workerIds.length > 0) {
    violations.push(createViolation(id, { workerIds: freezeArray(workerIds) }));
  }
}

function pushClaimIdsViolation(violations, id, claimIds) {
  if (claimIds.length > 0) {
    violations.push(createViolation(id, { claimIds: freezeArray(claimIds) }));
  }
}

function indexRowsByWorker(rows) {
  return freezeRecord(
    Object.fromEntries(rows.map((row) => [row.workerId, row]))
  );
}

function sameStringSet(left, right) {
  return (
    left.length === right.length && left.every((value) => right.includes(value))
  );
}

function sameRecord(left, right) {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    sameStringSet(leftKeys, rightKeys) &&
    leftKeys.every((key) => left[key] === right[key])
  );
}

function freezeUniqueArray(values) {
  return freezeArray([...new Set(values)]);
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze({ ...record });
}
