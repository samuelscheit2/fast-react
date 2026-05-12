import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_737_738_GATE_ID,
  PRIVATE_ADMISSION_737_738_GATE_STATUS,
  PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS
} from "./private-admission-737-738-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_739_745_GATE_ID =
  "private-admission-739-745-local-gate-1";
export const PRIVATE_ADMISSION_739_745_GATE_STATUS =
  "recognized-accepted-private-diagnostics-739-745-public-compatibility-blocked";
export const PRIVATE_ADMISSION_739_745_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-739-745-with-violations";

export const PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS,
    "publicNativeWorkerThreadTeardownCompatibilityClaimed",
    "publicNativeBridgeCompatibilityClaimed",
    "publicReactDomHydrateRootCompatibilityClaimed",
    "publicReactDomHydrationCompatibilityClaimed",
    "publicSchedulerDelayedActRootWorkCompatibilityClaimed",
    "publicSchedulerTimingCompatibilityClaimed",
    "publicTestRendererSiblingTextToJSONIdentityCompatibilityClaimed",
    "publicTestRendererSerializationCompatibilityClaimed",
    "publicTestRendererBroadMultichildIdentityClaimed",
    "publicTestRendererSiblingSnapshotIdentityClaimed",
    "publicJSFacadeCompatibilityClaimed",
    "publicCJSFacadeCompatibilityClaimed",
    "publicPackageCompatibilityClaimed",
    "publicCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES = freezeUniqueArray([
  ...PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES,
  "native-worker-thread-teardown-mirror",
  "native-bridge-loading",
  "native-bridge-execution",
  "native-public-compatibility",
  "react-dom-hydrate-root",
  "react-dom-hydration",
  "scheduler-delayed-act-root-work",
  "scheduler-public-timing",
  "scheduler-public-flush-helper",
  "test-renderer-sibling-text-tojson-identity-public-serialization",
  "test-renderer-broad-multichild-identity",
  "test-renderer-sibling-snapshot-identity",
  "js-facade",
  "cjs-facade",
  "package-compatibility",
  "public-compatibility"
]);

export const PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS =
  freezeUniqueArray([
    ...PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS,
    "nativeWorkerThreadTeardownPublicAdmissionClaimed",
    "nativeWorkerThreadExecutionAdmissionClaimed",
    "nativeBridgeLoadingClaimed",
    "nativeBridgeExecutionClaimed",
    "nativeExecutionAdmissionClaimed",
    "reactDomHydrateRootAdmissionClaimed",
    "hydrationAdmissionClaimed",
    "schedulerDelayedActRootAdmissionClaimed",
    "schedulerTimingAdmissionClaimed",
    "publicSchedulerFlushHelperCompatibilityClaimed",
    "siblingTextToJSONPublicSerializationClaimed",
    "siblingTextIdentityPromotedToJSClaimed",
    "broadMultichildIdentityAdmissionClaimed",
    "siblingSnapshotIdentityAdmissionClaimed",
    "jsFacadeAdmissionClaimed",
    "cjsFacadeAdmissionClaimed",
    "packageCompatibilityClaimed",
    "rustOnlyDiagnosticPromotedToPackageClaimed",
    "publicCompatibilityClaimed"
  ]);

const worker739 = "worker-739-record-worker-737-docs";
const worker740 = "worker-740-native-package-worker-thread-teardown-mirror";
const worker741 = "worker-741-react-dom-hydrateroot-private-facade-preflight";
const worker742 = "worker-742-scheduler-mock-delayed-act-root-continuation";
const worker743 = "worker-743-record-worker-738-docs";
const worker744 = "worker-744-package-private-admission-audit-737-738";
const worker745 = "worker-745-test-renderer-sibling-text-identity-gate";

export const PRIVATE_ADMISSION_739_745_SKIPPED_WORKERS = Object.freeze([
  worker739,
  worker743
]);

export const PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    [worker740]: freezeArray([
      "native-root-bridge-transport-worker-thread-teardown-mirror",
      "diagnosed-native-root-bridge-transport-worker-thread-teardown",
      "worker-thread-teardown-public-native-compatibility-blocked"
    ]),
    [worker741]: freezeArray([
      "react-dom-client-private-hydrate-root-public-facade-preflight",
      "private-hydrate-root-bridge-request-admission",
      "unsupported-hydration-boundary-diagnostics"
    ]),
    [worker742]: freezeArray([
      "scheduler-mock-delayed-act-root-work-diagnostics",
      "drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
      "callback-continuation-not-branded-internal-test-callback"
    ]),
    [worker744]: freezeArray([
      PRIVATE_ADMISSION_737_738_GATE_ID,
      PRIVATE_ADMISSION_737_738_GATE_STATUS,
      "static-private-admission-ledger-737-738-evidence"
    ]),
    [worker745]: freezeArray([
      "fast-react-test-renderer.tojson.sibling-text.finished-work-identity",
      "private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked",
      "sibling-text-public-native-package-js-surfaces-blocked"
    ])
  });

export const PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES = freezeRecord({
  [worker740]: freezeArray([
    "worker-524-native-transport-worker-thread-teardown",
    "worker-532-native-package-surface-guard-refresh"
  ]),
  [worker741]: freezeArray([
    "react-dom-private-root-bridge-shell",
    "react-dom-root-public-facade-blocked-gate"
  ]),
  [worker742]: freezeArray([
    "scheduler-mock-expired-act-root-work-private-route",
    "accepted-private-act-root-work-metadata"
  ]),
  [worker744]: freezeArray([
    worker739,
    worker743,
    "worker-737-package-private-admission-audit-734-736",
    "worker-738-real-sibling-text-handoff-report"
  ]),
  [worker745]: freezeArray([
    "worker-738-real-sibling-text-handoff-report",
    worker744
  ])
});

export const PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS =
  freezeRecord({
    [worker740]: freezeArray([
      "diagnosed-native-root-bridge-transport-worker-thread-teardown",
      "worker-root-stale-after-thread-teardown",
      "peer-root-active-after-worker-thread-teardown"
    ]),
    [worker741]: freezeArray([
      "admitted-private-root-bridge-request-record",
      "hydrate-root-records-are-diagnostic-only",
      "FAST_REACT_UNIMPLEMENTED"
    ]),
    [worker742]: freezeArray([
      "accepted-delayed-act-root-work-metadata",
      "accepted-expired-act-root-work-metadata",
      "consumed-accepted-expired-act-root-work-records"
    ]),
    [worker744]: freezeArray([
      PRIVATE_ADMISSION_737_738_GATE_ID,
      PRIVATE_ADMISSION_737_738_GATE_STATUS,
      "sibling-text-finished-work-identity-gate-not-implemented"
    ]),
    [worker745]: freezeArray([
      "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic",
      "HostRoot->[HostText,HostComponent->HostText]",
      "sibling-text-finished-work-identity-gate-not-implemented"
    ])
  });

export const PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT =
  freezeRecord({
    [worker740]: freezeArray([
      "native-bridge-loading",
      "native-bridge-execution",
      "native-public-compatibility"
    ]),
    [worker741]: freezeArray([
      "react-dom-hydrate-root",
      "react-dom-hydration",
      "public-root"
    ]),
    [worker742]: freezeArray([
      "scheduler-delayed-act-root-work",
      "scheduler-public-timing",
      "public-act"
    ]),
    [worker744]: freezeArray([
      PRIVATE_ADMISSION_737_738_GATE_ID,
      "public-root-act-flushsync-reactdom-scheduler-blockers",
      "sibling-text-finished-work-identity-admission"
    ]),
    [worker745]: freezeArray([
      worker744,
      "test-renderer-sibling-text-tojson-identity-public-serialization",
      "test-renderer-broad-multichild-identity"
    ])
  });

export const PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS =
  freezeRecord({
    [worker740]: freezeArray([
      "nativeAddonLoaded: false",
      "nativeExecution: false",
      "publicNativeCompatibility: false"
    ]),
    [worker741]: freezeArray([
      "publicHydrateRootEnabled: false",
      "nativeHandoffRecord: null",
      "domMutated: false",
      "compatibilityClaimed: false"
    ]),
    [worker742]: freezeArray([
      "publicSchedulerTimingCompatibilityClaimed: false",
      "publicReactActCompatibilityClaimed: false",
      "publicRootSchedulerCompatibilityClaimed: false",
      "publicRendererCompatibilityClaimed: false"
    ]),
    [worker744]: freezeArray([
      PRIVATE_ADMISSION_737_738_GATE_STATUS,
      "private-admission-737-738 gate rejects compatibility, public, native, JS, package, React DOM, act, flushSync, and Scheduler leaks",
      "siblingTextFinishedWorkIdentityAdmissionClaimed"
    ]),
    [worker745]: freezeArray([
      "public_native_package_js_surfaces_blocked",
      "broad-multichild-identity-unexpectedly-open",
      "public-or-native-package-js-compatibility-claim"
    ])
  });

export const PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT =
  freezeRecord({
    [worker740]: freezeArray([
      worker744,
      PRIVATE_ADMISSION_737_738_GATE_ID,
      PRIVATE_ADMISSION_737_738_GATE_STATUS
    ]),
    [worker741]: freezeArray([
      worker744,
      PRIVATE_ADMISSION_737_738_GATE_ID,
      PRIVATE_ADMISSION_737_738_GATE_STATUS
    ]),
    [worker742]: freezeArray([
      worker744,
      PRIVATE_ADMISSION_737_738_GATE_ID,
      PRIVATE_ADMISSION_737_738_GATE_STATUS
    ]),
    [worker744]: freezeArray([
      PRIVATE_ADMISSION_737_738_GATE_ID,
      PRIVATE_ADMISSION_737_738_GATE_STATUS,
      "worker-737-package-private-admission-audit-734-736",
      "worker-738-real-sibling-text-handoff-report"
    ]),
    [worker745]: freezeArray([
      worker744,
      PRIVATE_ADMISSION_737_738_GATE_ID,
      PRIVATE_ADMISSION_737_738_GATE_STATUS,
      "worker-738-real-sibling-text-handoff-report"
    ])
  });

export const PRIVATE_ADMISSION_739_745_REQUIRED_NATIVE_TEARDOWN_MIRROR =
  freezeRecord({
    [worker740]: freezeRecord({
      packageSurfaceMirror: true,
      recordsWorkerAndPeerEnvironmentIds: true,
      staleWorkerRowsAndActivePeerRow: true,
      nativeAddonLoadingBlocked: true,
      nativeExecutionBlocked: true,
      rendererExecutionBlocked: true,
      reconcilerExecutionBlocked: true,
      publicNativeCompatibilityBlocked: true,
      reactBehaviorErrorBlocked: true
    })
  });

export const PRIVATE_ADMISSION_739_745_REQUIRED_HYDRATE_ROOT_PREFLIGHT =
  freezeRecord({
    [worker741]: freezeRecord({
      symbolOnlyFacadePreflight: true,
      requestAdmissionOnly: true,
      unsupportedHydrationRoot: true,
      nativeHandoffBlocked: true,
      publicRootObjectBlocked: true,
      domMutationBlocked: true,
      markerListenerHydrationEventBlocked: true,
      compatibilityBlocked: true
    })
  });

export const PRIVATE_ADMISSION_739_745_REQUIRED_SCHEDULER_DELAYED_ROUTE =
  freezeRecord({
    [worker742]: freezeRecord({
      delayedMetadataBrandedPrivate: true,
      validatesDelayStartExpirationPriority: true,
      promotesVirtualTimeOnlyToExpiration: true,
      reusesExpiredActRootRoute: true,
      guardsUnbrandedContinuation: true,
      rejectsAmbiguousDelayedOrExpiredHandles: true,
      rejectsPublicCompatibilityClaims: true,
      publicSchedulerActRootRendererBlocked: true
    })
  });

export const PRIVATE_ADMISSION_739_745_REQUIRED_STATIC_LEDGER_EVIDENCE =
  freezeRecord({
    [worker744]: freezeRecord({
      recordsWorker737LedgerEvidence: true,
      recordsWorker738SiblingTextPrerequisite: true,
      carriesForward737738Blockers: true,
      staticReadOnlyLedger: true,
      runtimeCapabilityAdded: false
    })
  });

export const PRIVATE_ADMISSION_739_745_REQUIRED_SIBLING_TEXT_IDENTITY_GATE =
  freezeRecord({
    [worker745]: freezeRecord({
      dedicatedSiblingTextGate: true,
      genericGateStillFailsClosed: true,
      consumesWorker738ReportRow: true,
      consumesRouteAdmission: true,
      consumesCommittedHostRootFinishedWorkIdentity: true,
      consumesCommittedHostRootFinishedWorkLanes: true,
      rootArraySourceNodesBound: true,
      broadMultichildIdentityBlocked: true,
      siblingSnapshotIdentityRemainsBlocked: true,
      publicNativePackageJsSurfacesBlocked: true
    })
  });

const skippedRowData739745 = Object.freeze([
  skippedRowData({
    workerId: worker739,
    area: "coordination docs recording Worker 737 acceptance",
    skipReason: "docs-only-coordination-no-runtime-capability",
    evidenceRows: [
      evidenceData({
        role: "worker-739-docs-progress",
        path: "worker-progress/worker-739-record-worker-737-docs.md",
        tokens: [
          "# Worker 739: Record Worker 737 Docs",
          "Updating coordination docs to record Worker 737 as accepted",
          "Keeping Worker 738 active/pending only.",
          "Worker 737 progress records a complete static private-admission ledger",
          "public/package/native/JS compatibility"
        ]
      })
    ]
  }),
  skippedRowData({
    workerId: worker743,
    area: "coordination docs recording Worker 738 acceptance",
    skipReason: "docs-only-coordination-no-runtime-capability",
    evidenceRows: [
      evidenceData({
        role: "worker-743-docs-progress",
        path: "worker-progress/worker-743-record-worker-738-docs.md",
        tokens: [
          "# Worker 743: Record Worker 738 Docs",
          "Updated `MASTER_PROGRESS.md` with a concise accepted-history entry",
          "Worker 738 is no longer listed as active.",
          "Kept public serialization, JS/CJS admission, native bridge",
          "sibling identity admission remain blocked"
        ]
      })
    ]
  })
]);

const rowData739745 = Object.freeze([
  rowData({
    workerId: worker740,
    privateAdmission: "accepted-private-package-mirror-evidence",
    area: "native package worker-thread teardown inert mirror evidence",
    primaryCompatibilityArea:
      "native-root-bridge-worker-thread-teardown-public-native-compatibility-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker740],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker740],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker740],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker740],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker740
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker740],
    nativeTeardownMirror:
      PRIVATE_ADMISSION_739_745_REQUIRED_NATIVE_TEARDOWN_MIRROR[worker740],
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-740-progress",
        path: "worker-progress/worker-740-native-package-worker-thread-teardown-mirror.md",
        tokens: [
          "# Worker 740: Native Package Worker-Thread Teardown Mirror",
          "Added a frozen `transportWorkerThreadTeardownGate`",
          "`nativeAddonLoaded`, `nativeExecution`,",
          "`publicNativeCompatibility` remains false",
          "No public export\nkeys, package exports, native addon loading paths"
        ]
      }),
      evidenceData({
        role: "worker-740-native-loader-source",
        path: "bindings/node/index.cjs",
        sliceStart:
          "const nativeRootBridgeTransportWorkerThreadTeardownGate = Object.freeze({",
        sliceEnd:
          "const nativeRootBridgeWorkerThreadTeardownExecutablePreflight = Object.freeze({",
        tokens: [
          "workerThreadTeardownGateStatus:",
          "nativeRootBridgeTransportWorkerThreadTeardownGateStatus",
          "workerThreadId: 524",
          "peerEnvironmentId: 1524",
          "worker-root-stale-after-thread-teardown",
          "worker-create-value-stale-after-thread-teardown",
          "worker-render-value-stale-after-thread-teardown",
          "peer-root-active-after-worker-thread-teardown",
          "nativeAddonLoaded: false",
          "nativeExecution: false",
          "rendererExecution: false",
          "reconcilerExecution: false",
          "publicNativeCompatibility: false",
          "reactBehaviorError: false"
        ]
      }),
      evidenceData({
        role: "worker-740-native-loader-test",
        path: "bindings/node/test/native-loader.test.cjs",
        sliceStart:
          "function assertNativeRootBridgeTransportWorkerThreadTeardownGate(workerGate) {",
        sliceEnd: "function assertBridgeDidNotTouchContainer",
        tokens: [
          "workerGate.workerThreadTeardownGateStatus",
          "diagnosed-native-root-bridge-transport-worker-thread-teardown",
          "workerGate.workerThreadId, 524",
          "workerGate.peerEnvironmentId, 1524",
          "worker-root-stale-after-thread-teardown",
          "peer-root-active-after-worker-thread-teardown",
          "assert.equal(row.nativeAddonLoaded, false)",
          "assert.equal(row.nativeExecution, false)",
          "assert.equal(workerGate.publicNativeCompatibility, false)"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker741,
    privateAdmission: "accepted-private-facade-preflight-evidence",
    area: "React DOM hydrateRoot private public-facade preflight evidence",
    primaryCompatibilityArea:
      "react-dom-client-hydrateroot-private-facade-public-hydration-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker741],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker741],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker741],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker741],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker741
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker741],
    hydrateRootPreflight:
      PRIVATE_ADMISSION_739_745_REQUIRED_HYDRATE_ROOT_PREFLIGHT[worker741],
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-741-progress",
        path: "worker-progress/worker-741-react-dom-hydrateroot-private-facade-preflight.md",
        tokens: [
          "# Worker 741: hydrateRoot Private Facade Preflight",
          "Added a distinct symbol-only private preflight",
          "`fast.react_dom.client.private_hydrate_root_public_facade_preflight`",
          "does not\ncreate a public root object",
          "Public `react-dom/client.hydrateRoot` remains the unsupported placeholder"
        ]
      }),
      evidenceData({
        role: "worker-741-client-symbol-source",
        path: "packages/react-dom/client.js",
        sliceStart:
          "const hydrateRoot = createUnsupportedFunction(entrypoint, 'hydrateRoot');",
        sliceEnd: "exports.version = placeholderVersion;",
        tokens: [
          "Object.defineProperty(target, symbol, {",
          "value,",
          "definePrivateSymbolOnlyFacadeGate(",
          "privateHydrateRootPublicFacadePreflightSymbol",
          "const hydrateRoot = createUnsupportedFunction(entrypoint, 'hydrateRoot')",
          "hydrateRoot,",
          "createPrivateHydrateRootPublicFacadePreflight",
          "exports.hydrateRoot = hydrateRoot"
        ]
      }),
      evidenceData({
        role: "worker-741-root-bridge-preflight-source",
        path: "packages/react-dom/src/client/root-bridge.js",
        sliceStart:
          "function createPrivateHydrateRootPublicFacadePreflight(options) {",
        sliceEnd: "function createPrivateRootPublicFacadeRoot(",
        tokens: [
          "FastReactDomPrivateHydrateRootPublicFacadePreflight",
          "publicHydrateRootEnabled: false",
          "publicRootObjectExposed: false",
          "nativeExecution: false",
          "reconcilerExecution: false",
          "domMutation: false",
          "hydration: false",
          "compatibilityClaimed: false",
          "FastReactDomPrivateHydrateRootPublicFacadePreflightRecord",
          "facadeCall: 'hydrateRoot'",
          "nativeHandoffRecord: null",
          "nativeHandoffBlockedReason: 'hydrate-root-records-are-diagnostic-only'",
          "acceptedCapabilities:",
          "blockedCapabilities:"
        ]
      }),
      evidenceData({
        role: "worker-741-root-public-facade-test",
        path: "tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs",
        sliceStart:
          'test("React DOM client private hydrateRoot facade preflight is symbol-only and blocked", () => {',
        sliceEnd:
          'test("React DOM client private facade preflights marker/listener setup and cleanup without public behavior", () => {',
        tokens: [
          "fast.react_dom.client.private_hydrate_root_public_facade_preflight",
          'assert.equal(record.requestType, "hydrateRoot")',
          'assert.equal(record.rootKind, "unsupported-hydration")',
          "assert.equal(record.nativeHandoffRecord, null)",
          "assert.equal(record.publicRootCreated, false)",
          "assert.equal(record.domMutated, false)",
          "assert.equal(record.hydration, false)",
          "assert.equal(record.compatibilityClaimed, false)",
          'assert.equal(publicBoundary.hydrateRoot.status, "throws")'
        ]
      })
    ]
  }),
  rowData({
    workerId: worker742,
    privateAdmission: "accepted-private-scheduler-diagnostic-evidence",
    area: "Scheduler mock delayed act/root private diagnostic route evidence",
    primaryCompatibilityArea:
      "scheduler-mock-delayed-act-root-private-diagnostic-public-timing-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker742],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker742],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker742],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker742],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker742
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker742],
    schedulerDelayedRoute:
      PRIVATE_ADMISSION_739_745_REQUIRED_SCHEDULER_DELAYED_ROUTE[worker742],
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-742-progress",
        path: "worker-progress/worker-742-scheduler-mock-delayed-act-root-continuation.md",
        tokens: [
          "# Worker 742: Scheduler Mock Delayed Act/Root Continuation",
          "private `scheduler/unstable_mock` delayed act/root work metadata",
          "validates the delayed handle, delay, start time,",
          "callback-continuation-not-branded-internal-test-callback",
          "does not claim\n  public Scheduler timing compatibility"
        ]
      }),
      evidenceData({
        role: "worker-742-delayed-route-source",
        path: "packages/scheduler/unstable_mock.js",
        sliceStart: "function describeDelayedActRootWorkMetadataForDiagnostics(",
        sliceEnd: "function validateDelayedActRootWorkMetadata(",
        tokens: [
          "accepted-delayed-act-root-work-metadata",
          "validatesDelayedCallbackDelayStartAndExpirationMetadata: true",
          "recordsDelayedCallbackVirtualTimePromotionEvidence: true",
          "consumesDelayedActRootWorkThroughExpiredActRootRoute: true",
          "rejectsAmbiguousDelayedOrExpiredCallbackHandles: true",
          "rejectsDelayedActRootWorkPublicCompatibilityClaims: true",
          "drainsPublicSchedulerTaskQueue: false",
          "drainsPublicReactActQueue: false",
          "publicSchedulerTimingCompatibilityClaimed: false",
          "publicReactActCompatibilityClaimed: false",
          "publicRootSchedulerCompatibilityClaimed: false",
          "publicRendererCompatibilityClaimed: false",
          "compatibilityClaimed: false",
          "drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
          "advancesMockVirtualTimeToDelayedCallbackExpiration: true",
          "publicSchedulerFlushBehaviorExecuted: false"
        ]
      }),
      evidenceData({
        role: "worker-742-delayed-validator-source",
        path: "packages/scheduler/unstable_mock.js",
        sliceStart: "function validateDelayedActRootWorkMetadata(",
        sliceEnd: "function isDelayedActRootWorkMetadataObject(value) {",
        tokens: [
          "metadata-missing-internal-brand",
          "metadata-public-claim",
          "metadata-execution-claim",
          "metadata-renderer-work-policy",
          "delay-metadata-mismatch",
          "expiration-time-metadata-mismatch",
          "priority-timeout-metadata-mismatch",
          "callback-handle-not-delayed-pending",
          "ambiguous-delayed-or-expired-callback-handles",
          "expired-act-root-work-callback-handle-mismatch",
          "validateExpiredActRootWorkMetadata("
        ]
      }),
      evidenceData({
        role: "worker-742-continuation-guard-source",
        path: "packages/scheduler/unstable_mock.js",
        sliceStart:
          "function installGuardedExpiredActRootWorkCallback(",
        sliceEnd: "function definePrivateActQueueTestCallbackShape(",
        tokens: [
          "createGuardedExpiredActRootWorkCallback",
          "'callback-continuation'",
          "getRejectedExpiredActRootWorkCallbackReason(",
          "throw createContinuationRejectionError(rejectionReason)",
          "return createGuardedExpiredActRootWorkCallback(",
          "definePrivateActQueueTestCallbackShape(guardedCallback, callback)"
        ]
      }),
      evidenceData({
        role: "worker-742-delayed-test",
        path: "tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs",
        tokens: [
          "scheduler mock promotes delayed act/root metadata through the expired route",
          "scheduler mock rejects unbranded delayed act/root continuations",
          "callback-continuation-not-branded-internal-test-callback",
          "ambiguous-delayed-or-expired-callback-handles",
          "publicSchedulerTimingCompatibilityClaimed",
          "publicRootSchedulerCompatibilityClaimed",
          "publicSchedulerCallbackRan, false"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker744,
    privateAdmission: "accepted-private-ledger-evidence",
    area: "static private-admission ledger evidence for accepted Workers 737-738",
    primaryCompatibilityArea:
      "private-admission-static-ledger-737-738-public-compatibility-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker744],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker744],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker744],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker744],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker744
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker744],
    staticLedgerEvidence:
      PRIVATE_ADMISSION_739_745_REQUIRED_STATIC_LEDGER_EVIDENCE[worker744],
    runtimeCapabilityAdded: false,
    promotion: "not-applicable",
    evidenceRows: [
      evidenceData({
        role: "worker-744-progress",
        path: "worker-progress/worker-744-package-private-admission-audit-737-738.md",
        tokens: [
          "# Worker 744: Package Private Admission Audit 737-738",
          "Added the static/read-only private-admission ledger gate for Workers 737-738.",
          "Recorded Worker 737 as accepted static ledger evidence",
          "Recorded Worker 738 as accepted Rust-only/private prerequisite evidence",
          "Carried forward the 734-736 blocked surfaces",
          "Kept the ledger static"
        ]
      }),
      evidenceData({
        role: "worker-744-ledger-source",
        path: "tests/conformance/src/private-admission-737-738-gate.mjs",
        tokens: [
          "PRIVATE_ADMISSION_737_738_GATE_ID",
          "recognized-accepted-private-diagnostics-737-738-public-compatibility-blocked",
          "worker-737-package-private-admission-audit-734-736",
          "worker-738-real-sibling-text-handoff-report",
          "private-tojson-sibling-text-generic-finished-work-identity-fail-closed",
          "sibling-text-finished-work-identity-gate-not-implemented",
          "schedulerAdmissionClaimed",
          "nativeBridgeExecutionClaimed"
        ]
      }),
      evidenceData({
        role: "worker-744-ledger-test",
        path: "tests/conformance/test/private-admission-737-738-gate.test.mjs",
        tokens: [
          "private admission 737-738 gate recognizes accepted static and prerequisite evidence without compatibility",
          "private admission 737-738 gate rejects missing Worker 738 fail-closed identity guard tokens",
          "private admission 737-738 gate rejects opening sibling finished-work identity admission",
          "private admission 737-738 gate rejects compatibility, public, native, JS, package, React DOM, act, flushSync, and Scheduler leaks",
          "private admission 737-738 gate rejects runtime execution claims in the static ledger"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker745,
    privateAdmission: "accepted-private-identity-gate-evidence",
    area: "Rust-only private sibling-text toJSON finished-work identity gate evidence",
    primaryCompatibilityArea:
      "test-renderer-sibling-text-tojson-private-identity-public-serialization-blocked",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS[worker745],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES[worker745],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker745],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT[worker745],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker745
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT[worker745],
    siblingTextIdentityGate:
      PRIVATE_ADMISSION_739_745_REQUIRED_SIBLING_TEXT_IDENTITY_GATE[worker745],
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRows: [
      evidenceData({
        role: "worker-745-progress",
        path: "worker-progress/worker-745-test-renderer-sibling-text-identity-gate.md",
        tokens: [
          "# Worker 745: Test Renderer Sibling Text Identity Gate",
          "Added a Rust-only private sibling-text `toJSON` finished-work identity gate",
          "Kept the generic",
          "sibling-text-finished-work-identity-gate-not-implemented",
          "public/native/package/JS compatibility and broad multichild identity",
          "remain\n    blocked"
        ]
      }),
      evidenceData({
        role: "worker-745-identity-constants-rust-proof",
        path: "crates/fast-react-test-renderer/src/diagnostics/constants.rs",
        sliceStart:
          "pub const TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME",
        sliceEnd:
          "pub const TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID",
        tokens: [
          "fast-react-test-renderer.tojson.sibling-text.finished-work-identity",
          "private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked",
          "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic"
        ]
      }),
      evidenceData({
        role: "worker-745-identity-gate-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(",
        sliceEnd:
          "pub fn describe_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(",
        tokens: [
          "validate_private_to_json_sibling_text_update_route_admission_record_for_identity",
          "describe_private_to_json_sibling_text_host_output_row_for_canary(output)?",
          "validate_private_to_json_sibling_text_report_for_identity(output, row, report)?",
          "TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME",
          "TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_STATUS",
          "worker_738_report_row_id: row.id()",
          "host_output_shape: report.host_output_shape()",
          "root_node_kind: report.root_node_kind()",
          "source_node_count: report.node_count()",
          "consumes_worker_738_report_row: true",
          "consumes_committed_host_root_finished_work_identity: identity",
          "consumes_committed_host_root_finished_work_lanes: identity",
          "identity_admission_available: true",
          "broad_multichild_identity_available: false",
          "public_to_json_available: false",
          "native_bridge_loading_available: false",
          "js_facade_available: false",
          "cjs_facade_available: false",
          "package_compatibility_claimed: false",
          "compatibility_claimed: false"
        ]
      }),
      evidenceData({
        role: "worker-745-identity-validator-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "fn validate_private_to_json_sibling_text_finished_work_identity_gate_for_canary(",
        sliceEnd:
          "fn validate_private_to_json_multi_child_host_text_finished_work_identity_gate_for_canary(",
        tokens: [
          "sibling-text-finished-work-identity-diagnostic-mismatch",
          "sibling-text-report-row-or-shape-mismatch",
          "sibling-text-route-finished-work-identity-mismatch",
          "sibling-text-finished-work-identity-lane-mismatch",
          "sibling-text-finished-work-evidence-not-consumed",
          "broad-multichild-identity-unexpectedly-open",
          "public-or-native-package-js-compatibility-claim",
          "public_native_package_js_surfaces_blocked()"
        ]
      }),
      evidenceData({
        role: "worker-745-identity-tests-rust-proof",
        path: "crates/fast-react-test-renderer/src/tests/json_serialization.rs",
        sliceStart:
          "fn root_private_to_json_sibling_text_finished_work_identity_gate_consumes_real_output_report_and_route()",
        sliceEnd:
          "fn root_private_to_json_sibling_text_report_fails_closed_in_generic_finished_work_identity_gate()",
        tokens: [
          "describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary",
          "assert!(gate.consumes_worker_738_report_row())",
          "assert!(gate.consumes_committed_host_root_finished_work_identity())",
          "assert!(gate.consumes_committed_host_root_finished_work_lanes())",
          "assert!(!gate.broad_multichild_identity_available())",
          "assert!(gate.public_native_package_js_surfaces_blocked())",
          "assert_eq!(reason, \"public-or-native-package-js-compatibility-claim\")",
          "assert_eq!(reason, \"broad-multichild-identity-unexpectedly-open\")"
        ]
      }),
      evidenceData({
        role: "worker-745-generic-gate-still-blocked-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        sliceStart:
          "pub fn describe_private_to_json_finished_work_identity_gate_for_canary(",
        sliceEnd:
          "pub fn describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary(",
        tokens: [
          "if report.host_output_shape() == TestRendererPrivateToJsonHostOutputShape::SiblingText",
          "TestRendererPrivateSerializationFinishedWorkIdentityError::SerializationEvidenceMismatch",
          "reason: \"sibling-text-finished-work-identity-gate-not-implemented\""
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_739_745_ROWS = freezeArray(
  rowData739745.map((sourceRow) =>
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
      nativeTeardownMirror: sourceRow.nativeTeardownMirror,
      hydrateRootPreflight: sourceRow.hydrateRootPreflight,
      schedulerDelayedRoute: sourceRow.schedulerDelayedRoute,
      staticLedgerEvidence: sourceRow.staticLedgerEvidence,
      siblingTextIdentityGate: sourceRow.siblingTextIdentityGate,
      runtimeCapabilityAdded: sourceRow.runtimeCapabilityAdded,
      promotion: sourceRow.promotion,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_739_745_SKIPPED_ROWS = freezeArray(
  skippedRowData739745.map((sourceRow) =>
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
      nativeTeardownMirror: {},
      hydrateRootPreflight: {},
      schedulerDelayedRoute: {},
      staticLedgerEvidence: {},
      siblingTextIdentityGate: {},
      runtimeCapabilityAdded: false,
      promotion: "not-applicable",
      skipReason: sourceRow.skipReason,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_739_745_WORKERS = freezeArray(
  PRIVATE_ADMISSION_739_745_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission739745Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_739_745_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const skippedRows = PRIVATE_ADMISSION_739_745_SKIPPED_ROWS.map((baseRow) =>
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
      PRIVATE_ADMISSION_739_745_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_739_745_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    ),
    missingSkippedWorkerIds: freezeArray(
      PRIVATE_ADMISSION_739_745_SKIPPED_WORKERS.filter(
        (workerId) => !skippedManifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedSkippedWorkerIds: freezeArray(
      skippedManifestWorkerIds.filter(
        (workerId) =>
          !PRIVATE_ADMISSION_739_745_SKIPPED_WORKERS.includes(workerId)
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
    requiredByWorker: PRIVATE_ADMISSION_739_745_REQUIRED_ACCEPTED_DIAGNOSTICS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds",
    predicate: (row, expected, actual) =>
      acceptedPrivateAdmissionKinds.has(row.privateAdmission) &&
      sameStringSet(expected, actual)
  });
  const dependencyMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCIES,
    actualKey: "dependencyWorkerIds",
    expectedKey: "expectedDependencyWorkerIds",
    actualKeyForViolation: "actualDependencyWorkerIds"
  });
  const dependencyDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_739_745_REQUIRED_DEPENDENCY_DIAGNOSTICS,
    actualKey: "dependencyDiagnosticIds",
    expectedKey: "expectedDependencyDiagnosticIds",
    actualKeyForViolation: "actualDependencyDiagnosticIds"
  });
  const blockerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT,
    actualKey: "blockerContextWorkerIds",
    expectedKey: "expectedBlockerContextWorkerIds",
    actualKeyForViolation: "actualBlockerContextWorkerIds"
  });
  const blockerContextDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_739_745_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
    actualKey: "blockerContextDiagnosticIds",
    expectedKey: "expectedBlockerContextDiagnosticIds",
    actualKeyForViolation: "actualBlockerContextDiagnosticIds"
  });
  const priorLedgerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_739_745_REQUIRED_PRIOR_LEDGER_CONTEXT,
    actualKey: "priorLedgerContext",
    expectedKey: "expectedPriorLedgerContext",
    actualKeyForViolation: "actualPriorLedgerContext"
  });
  const nativeTeardownMirrorMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_739_745_REQUIRED_NATIVE_TEARDOWN_MIRROR,
    actualKey: "nativeTeardownMirror",
    expectedKey: "expectedNativeTeardownMirror",
    actualKeyForViolation: "actualNativeTeardownMirror"
  });
  const hydrateRootPreflightMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_739_745_REQUIRED_HYDRATE_ROOT_PREFLIGHT,
    actualKey: "hydrateRootPreflight",
    expectedKey: "expectedHydrateRootPreflight",
    actualKeyForViolation: "actualHydrateRootPreflight"
  });
  const schedulerDelayedRouteMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_739_745_REQUIRED_SCHEDULER_DELAYED_ROUTE,
    actualKey: "schedulerDelayedRoute",
    expectedKey: "expectedSchedulerDelayedRoute",
    actualKeyForViolation: "actualSchedulerDelayedRoute"
  });
  const staticLedgerEvidenceMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_739_745_REQUIRED_STATIC_LEDGER_EVIDENCE,
    actualKey: "staticLedgerEvidence",
    expectedKey: "expectedStaticLedgerEvidence",
    actualKeyForViolation: "actualStaticLedgerEvidence"
  });
  const siblingTextIdentityGateMismatches = compareRequiredRecordByWorker({
    rows: evaluatedRows,
    requiredByWorker:
      PRIVATE_ADMISSION_739_745_REQUIRED_SIBLING_TEXT_IDENTITY_GATE,
    actualKey: "siblingTextIdentityGate",
    expectedKey: "expectedSiblingTextIdentityGate",
    actualKeyForViolation: "actualSiblingTextIdentityGate"
  });
  const publicCompatibilityClaimKeyMismatches = allRows.flatMap((row) => {
    const actualClaimIds = Object.keys(row.publicCompatibilityClaims ?? {});
    if (
      sameStringSet(
        PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS,
        actualClaimIds
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicCompatibilityClaims:
          PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS,
        actualPublicCompatibilityClaims: freezeArray(actualClaimIds)
      })
    ];
  });
  const blockedSurfaceMismatches = allRows.flatMap((row) => {
    const actualBlockedSurfaces = row.blockedPublicCompatibilitySurfaces ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES,
        actualBlockedSurfaces
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES,
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
        PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedPublicClaims:
          PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS,
        actualBlockedPublicClaims: freezeArray(actualBlockedClaims)
      })
    ];
  });
  const blockedAdmissionClaimMismatches = allRows.flatMap((row) => {
    const actualBlockedAdmissionClaims = row.blockedAdmissionClaimIds ?? [];
    if (
      sameStringSet(
        PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS,
        actualBlockedAdmissionClaims
      )
    ) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedBlockedAdmissionClaims:
          PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS,
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
      /(?:packageCompatibilityClaimed|rustOnlyDiagnosticPromotedToPackageClaimed|jsFacadeAdmissionClaimed|cjsFacadeAdmissionClaimed|nativeBridgeLoadingClaimed|nativeBridgeExecutionClaimed|nativeExecutionAdmissionClaimed|nativeWorkerThreadExecutionAdmissionClaimed|nativeWorkerThreadTeardownPublicAdmissionClaimed)$/.test(
        claimId
      )
  );
  const publicRendererLeakClaimIds = [
    ...publicCompatibilityViolations,
    ...blockedAdmissionClaimViolations
  ].filter((claimId) =>
    /(?:ReactDom|ReactDOM|ReactRoot|ReactAct|FlushSync|Scheduler|HydrateRoot|Hydration|TestRenderer|Serialization|Multichild|Sibling|reactDomRootAdmissionClaimed|reactDomActAdmissionClaimed|reactDomHydrateRootAdmissionClaimed|hydrationAdmissionClaimed|flushSyncAdmissionClaimed|schedulerAdmissionClaimed|schedulerDelayedActRootAdmissionClaimed|schedulerTimingAdmissionClaimed|siblingTextToJSONPublicSerializationClaimed|broadMultichildIdentityAdmissionClaimed|siblingSnapshotIdentityAdmissionClaimed)/.test(
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
    "private-admission-evidence-token-missing",
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
    "native-worker-thread-teardown-mirror-mismatch",
    nativeTeardownMirrorMismatches
  );
  pushRowsViolation(
    violations,
    "hydrate-root-private-preflight-evidence-mismatch",
    hydrateRootPreflightMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-delayed-act-root-evidence-mismatch",
    schedulerDelayedRouteMismatches
  );
  pushRowsViolation(
    violations,
    "static-private-admission-ledger-evidence-mismatch",
    staticLedgerEvidenceMismatches
  );
  pushRowsViolation(
    violations,
    "sibling-text-identity-gate-evidence-mismatch",
    siblingTextIdentityGateMismatches
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
  const nativeTeardownMirrorRecognized =
    nativeTeardownMirrorMismatches.length === 0;
  const hydrateRootPreflightRecognized =
    hydrateRootPreflightMismatches.length === 0;
  const schedulerDelayedRouteRecognized =
    schedulerDelayedRouteMismatches.length === 0;
  const staticLedgerEvidenceRecognized =
    staticLedgerEvidenceMismatches.length === 0;
  const siblingTextIdentityGateRecognized =
    siblingTextIdentityGateMismatches.length === 0;
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
    nativeTeardownMirrorRecognized &&
    hydrateRootPreflightRecognized &&
    schedulerDelayedRouteRecognized &&
    staticLedgerEvidenceRecognized &&
    siblingTextIdentityGateRecognized &&
    blockedPublicSurfacesRecognized &&
    blockedPublicClaimsRecognized &&
    blockedAdmissionClaimsRecognized &&
    staticReadOnlyRecognized &&
    skipMetaRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_739_745_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_739_745_GATE_STATUS
      : PRIVATE_ADMISSION_739_745_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    skipMetaRecognized,
    acceptedDiagnosticsRecognized,
    dependenciesRecognized,
    blockerContextRecognized,
    priorLedgerContextRecognized,
    evidenceRecognized,
    nativeTeardownMirrorRecognized,
    hydrateRootPreflightRecognized,
    schedulerDelayedRouteRecognized,
    staticLedgerEvidenceRecognized,
    siblingTextIdentityGateRecognized,
    blockedPublicSurfacesRecognized,
    blockedPublicClaimsRecognized,
    blockedAdmissionClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    publicCompatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_739_745_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_739_745_SKIPPED_WORKERS,
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
  "accepted-private-package-mirror-evidence",
  "accepted-private-facade-preflight-evidence",
  "accepted-private-scheduler-diagnostic-evidence",
  "accepted-private-ledger-evidence",
  "accepted-private-identity-gate-evidence"
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
    nativeTeardownMirror: freezeRecord(data.nativeTeardownMirror ?? {}),
    hydrateRootPreflight: freezeRecord(data.hydrateRootPreflight ?? {}),
    schedulerDelayedRoute: freezeRecord(data.schedulerDelayedRoute ?? {}),
    staticLedgerEvidence: freezeRecord(data.staticLedgerEvidence ?? {}),
    siblingTextIdentityGate: freezeRecord(data.siblingTextIdentityGate ?? {}),
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
      PRIVATE_ADMISSION_739_745_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
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
      PRIVATE_ADMISSION_739_745_BLOCKED_ADMISSION_CLAIMS.map((claimId) => [
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
  nativeTeardownMirror,
  hydrateRootPreflight,
  schedulerDelayedRoute,
  staticLedgerEvidence,
  siblingTextIdentityGate,
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
    sourceQueue: "739-745",
    privateAdmission,
    localGateCoverage: "private-admission-739-745-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(dependencyWorkerIds),
    dependencyDiagnosticIds: freezeArray(dependencyDiagnosticIds),
    blockerContextWorkerIds: freezeArray(blockerContextWorkerIds),
    blockerContextDiagnosticIds: freezeArray(blockerContextDiagnosticIds),
    priorLedgerContext: freezeArray(priorLedgerContext),
    nativeTeardownMirror: freezeRecord(nativeTeardownMirror),
    hydrateRootPreflight: freezeRecord(hydrateRootPreflight),
    schedulerDelayedRoute: freezeRecord(schedulerDelayedRoute),
    staticLedgerEvidence: freezeRecord(staticLedgerEvidence),
    siblingTextIdentityGate: freezeRecord(siblingTextIdentityGate),
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
      PRIVATE_ADMISSION_739_745_BLOCKED_SURFACES,
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
  if (Object.hasOwn(override, "nativeTeardownMirror")) {
    merged.nativeTeardownMirror = freezeRecord({
      ...row.nativeTeardownMirror,
      ...override.nativeTeardownMirror
    });
  }
  if (Object.hasOwn(override, "hydrateRootPreflight")) {
    merged.hydrateRootPreflight = freezeRecord({
      ...row.hydrateRootPreflight,
      ...override.hydrateRootPreflight
    });
  }
  if (Object.hasOwn(override, "schedulerDelayedRoute")) {
    merged.schedulerDelayedRoute = freezeRecord({
      ...row.schedulerDelayedRoute,
      ...override.schedulerDelayedRoute
    });
  }
  if (Object.hasOwn(override, "staticLedgerEvidence")) {
    merged.staticLedgerEvidence = freezeRecord({
      ...row.staticLedgerEvidence,
      ...override.staticLedgerEvidence
    });
  }
  if (Object.hasOwn(override, "siblingTextIdentityGate")) {
    merged.siblingTextIdentityGate = freezeRecord({
      ...row.siblingTextIdentityGate,
      ...override.siblingTextIdentityGate
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
    if (!Object.hasOwn(requiredByWorker, row.workerId)) {
      return [];
    }
    const expected = requiredByWorker[row.workerId];
    const actual = row[actualKey] ?? [];
    if (predicate(row, expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: expected,
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
    if (!Object.hasOwn(requiredByWorker, row.workerId)) {
      return [];
    }
    const expected = requiredByWorker[row.workerId];
    const actual = row[actualKey] ?? {};
    if (sameBooleanRecord(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: expected,
        [actualKeyForViolation]: freezeRecord(actual)
      })
    ];
  });
}

function sameStringSet(expected, actual) {
  if (expected.length !== actual.length) {
    return false;
  }
  return expected.every((value) => actual.includes(value));
}

function sameBooleanRecord(expected, actual) {
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);
  if (!sameStringSet(expectedKeys, actualKeys)) {
    return false;
  }
  return expectedKeys.every((key) => actual[key] === expected[key]);
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

function createViolation(id, details) {
  return freezeRecord({
    id,
    ...details
  });
}

function indexRowsByWorker(rows) {
  return freezeRecord(
    Object.fromEntries(rows.map((row) => [row.workerId, row]))
  );
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeUniqueArray(values) {
  return freezeArray(new Set(values));
}

function freezeRecord(record) {
  return Object.freeze(record);
}
