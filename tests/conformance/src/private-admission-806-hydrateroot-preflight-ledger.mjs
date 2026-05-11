import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_806_GATE_ID =
  "private-admission-806-hydrateroot-preflight-ledger-1";
export const PRIVATE_ADMISSION_806_GATE_STATUS =
  "recognized-accepted-private-hydrateroot-preflight-evidence-public-blocked";
export const PRIVATE_ADMISSION_806_VIOLATION_STATUS =
  "blocked-accepted-private-hydrateroot-preflight-evidence-with-violations";

const worker762 = "worker-762-hydration-marker-listener-private-gate";
const worker770 = "worker-770-hydrateroot-target-claiming-preflight";
const worker776 = "worker-776-hydrateroot-recoverable-error-preflight";
const worker786 = "worker-786-hydrateroot-event-replay-preflight";
const worker797 = "worker-797-hydrateroot-preflight-conformance-matrix";

export const PRIVATE_ADMISSION_806_REQUIRED_WORKERS = freezeArray([
  worker762,
  worker770,
  worker776,
  worker786,
  worker797
]);

export const PRIVATE_ADMISSION_806_RECORD_TYPES = freezeRecord({
  hydrateRootPublicFacadePreflight:
    "fast.react_dom.private_hydrate_root_public_facade_preflight",
  hydrateRootPublicFacadePreflightRecord:
    "fast.react_dom.private_hydrate_root_public_facade_preflight_record",
  markerListenerPreflight:
    "fast.react_dom.private_hydrate_root_public_facade_marker_listener_preflight_record",
  targetClaimingPreflight:
    "fast.react_dom.private_hydrate_root_public_facade_target_claiming_preflight_record",
  eventReplayPreflight:
    "fast.react_dom.private_hydrate_root_public_facade_event_replay_preflight_record"
});

export const PRIVATE_ADMISSION_806_REQUIRED_STATUSES = freezeRecord({
  [worker762]: freezeArray([
    "preflighted-private-hydrate-root-public-facade-marker-listener-gate",
    "blocked-private-root-bridge-execution",
    "blocked-private-root-bridge-compatibility"
  ]),
  [worker770]: freezeArray([
    "accepted-private-hydration-target-claiming-metadata",
    "preflighted-private-hydrate-root-public-facade-target-claiming-gate",
    "blocked-private-root-bridge-execution",
    "blocked-private-root-bridge-compatibility"
  ]),
  [worker776]: freezeArray([
    "preflighted-private-hydration-text-mismatch-recoverable-error-metadata",
    "blocked-hydration-text-mismatch-recoverable-error-metadata-recorded",
    "blocked-private-root-bridge-execution",
    "blocked-private-root-bridge-compatibility"
  ]),
  [worker786]: freezeArray([
    "blocked-private-hydration-claimed-replay-target-dispatch-execution",
    "preflighted-private-hydrate-root-public-facade-event-replay-gate",
    "blocked-private-root-bridge-execution",
    "blocked-private-root-bridge-compatibility"
  ]),
  [worker797]: freezeArray([
    "accepted-private-react-dom-client-root-public-facade-preflight",
    "preflighted-private-hydrate-root-public-facade-marker-listener-gate",
    "preflighted-private-hydrate-root-public-facade-target-claiming-gate",
    "preflighted-private-hydrate-root-public-facade-event-replay-gate"
  ])
});

export const PRIVATE_ADMISSION_806_REQUIRED_DIAGNOSTIC_IDS = freezeRecord({
  [worker762]: freezeArray([
    "fast.react_dom.private_hydrate_root_public_facade_marker_listener_preflight_record",
    "hydrate-root-marker-guard-snapshot",
    "hydrate-root-listener-guard-snapshot",
    "hydrate-root-marker-listener-state-unchanged"
  ]),
  [worker770]: freezeArray([
    "hydration-target-claiming-private-gate-1",
    "fast.react_dom.private_hydrate_root_public_facade_target_claiming_preflight_record",
    "hydrate-root-marker-listener-preflight-required",
    "hydrate-root-target-dispatch-link-diagnostic",
    "hydrate-root-target-claiming-canonical-evidence",
    "hydrate-root-target-claiming-state-unchanged"
  ]),
  [worker776]: freezeArray([
    "hydration-text-mismatch-recoverable-error-private-preflight-gate-1",
    "hydration-text-mismatch-recoverable-error-preflight",
    "hydration-text-mismatch-recoverable-error-routing",
    "FastReactDomHydrationTextMismatchRecoverableErrorPreflightRecord"
  ]),
  [worker786]: freezeArray([
    "hydration-claimed-replay-target-dispatch-execution-private-gate-1",
    "fast.react_dom.private_hydrate_root_public_facade_event_replay_preflight_record",
    "hydrate-root-target-claiming-preflight-required",
    "hydrate-root-replay-target-dispatch-execution-metadata",
    "hydrate-root-event-replay-state-unchanged"
  ]),
  [worker797]: freezeArray([
    "getPrivateHydrateRootPublicFacadePreflightPayload",
    "getPrivateHydrateRootPublicFacadeMarkerListenerPreflightPayload",
    "getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload",
    "getPrivateHydrateRootPublicFacadeTargetClaimingPreflightPayload",
    "getPrivateHydrationTargetClaimingDiagnosticPayload",
    "getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload",
    "getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload",
    "assertHydrateRootPreflightEvidenceBlocked"
  ])
});

export const PRIVATE_ADMISSION_806_REQUIRED_CHAIN = freezeRecord({
  [worker762]: freezeArray([]),
  [worker770]: freezeArray([worker762]),
  [worker776]: freezeArray([worker762]),
  [worker786]: freezeArray([worker762, worker770, worker776]),
  [worker797]: freezeArray([worker762, worker770, worker776, worker786])
});

export const PRIVATE_ADMISSION_806_MARKER_LISTENER_FIELD_NAMES = freezeArray([
  "markerGuardAction",
  "listenerGuardAction",
  "markerGuardMatchesContainerState",
  "listenerGuardMatchesContainerState",
  "rootMarkerPropertyCount",
  "rootMarkerTruthyCount",
  "rootMarkerNullCount",
  "rootListeningMarkerPropertyCount",
  "rootListeningMarkerTrueValueCount",
  "ownerDocumentListeningMarkerPropertyCount",
  "ownerDocumentListeningMarkerTrueValueCount",
  "rootListenerRegistrationCount",
  "ownerDocumentListenerRegistrationCount",
  "rootListenerSetSize",
  "ownerDocumentListenerSetSize",
  "rootMutationCount",
  "ownerDocumentMutationCount",
  "rootMarkerWriteBlocked",
  "rootListenerInstallationBlocked",
  "hydrationMarkerConsumptionBlocked",
  "eventReplayBlocked",
  "recoverableErrorRoutingBlocked",
  "publicHydrateRootBlocked"
]);

export const PRIVATE_ADMISSION_806_TARGET_CLAIMING_FIELD_NAMES = freezeArray([
  "markerListenerPreflightRequired",
  "markerListenerPreflightAccepted",
  "canonicalTargetClaimingEvidence",
  "targetClaimingDiagnosticImmutable",
  "targetDispatchLinkDiagnosticImmutable",
  "ownershipDiagnosticsImmutable",
  "targetClaimingPayloadAccepted",
  "targetDispatchLinkPayloadAccepted",
  "targetPathDeterministicallySelected",
  "targetPathResolvedToDispatchTarget",
  "targetPathUniqueInContainer",
  "hydratableLookupTargetPathRetained",
  "targetDispatchLinkDiagnostic",
  "ownershipDiagnostics",
  "ownershipRetainedThroughDrainOrder",
  "targetClaimingDiagnostic",
  "targetClaimingGateId",
  "targetClaimingStatus",
  "targetClaimExecuted",
  "publicHydrationTargetClaimed",
  "hydrateInstanceBlocked",
  "eventDispatchBlocked",
  "replayQueueDrainBlocked"
]);

export const PRIVATE_ADMISSION_806_RECOVERABLE_ERROR_FIELD_NAMES =
  freezeArray([
    "recoverableErrorPreflight",
    "recoverableErrorPreflightId",
    "recoverableErrorPreflightStatus",
    "recoverableErrorPreflightAccepted",
    "recoverableErrorMetadataAccepted",
    "recoverableErrorMetadataStatus",
    "recoverableErrorMetadataCount",
    "queuedRecoverableErrorCount",
    "wouldQueueRecoverableErrorCount",
    "recoverableErrorsQueued",
    "willQueueRecoverableErrors",
    "onRecoverableErrorConfigured",
    "onRecoverableErrorInvoked",
    "publicOnRecoverableErrorInvoked",
    "rootErrorCallbackInvocationCount",
    "privatePreflight",
    "diagnosticOnly",
    "readOnly",
    "acceptedBoundaryMetadataDiagnostics",
    "acceptedBoundaryMetadataRow",
    "callbackInvocationRecordCount",
    "callbackInvocationPreflight"
  ]);

export const PRIVATE_ADMISSION_806_EVENT_REPLAY_FIELD_NAMES = freezeArray([
  "targetClaimingPreflightRequired",
  "targetClaimingPreflightAccepted",
  "targetClaimingCanonicalEvidence",
  "canonicalReplayExecutionMetadata",
  "replayExecutionRecordImmutable",
  "blockedDispatchRecord",
  "clickReplayDispatchDiagnosticBlocked",
  "replayExecutionRecord",
  "replayExecutionGateId",
  "replayExecutionStatus",
  "replayExecutionPayloadAccepted",
  "replayTargetDispatchExecutionRecorded",
  "replayTargetDispatchExecutionBlocked",
  "dispatchExecutionRecorded",
  "dispatchExecutionBlocked",
  "targetDispatchExecuted",
  "eventReplayDispatchAttempted",
  "pluginDispatchEventForPluginEventSystemCalled",
  "nativeEventRedispatched",
  "syntheticEventCreated",
  "listenerInvocationCount",
  "willInvokeListeners"
]);

export const PRIVATE_ADMISSION_806_MATRIX_FIELD_NAMES = freezeArray([
  "preflightRecords",
  "markerListenerPreflightRecords",
  "recoverableErrorPreflightRecords",
  "targetClaimingPreflightRecords",
  "eventReplayPreflightRecords",
  "markerListenerPayload",
  "recoverableErrorPayload",
  "targetClaimPayload",
  "claimPayload",
  "eventReplayPayload",
  "executionPayload",
  "hydrationBoundaryRecord",
  "targetClaimingDiagnosticPayload",
  "targetDispatchLinkPayload",
  "recoverableErrorMetadata"
]);

export const PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicHydrateRootEnabled",
  "publicHydrateRootSupported",
  "publicRootCreated",
  "publicRootObjectExposed",
  "publicRootCompatibilitySurface",
  "containerMarked",
  "listenersAttached",
  "domMutated",
  "domMutation",
  "markerWrites",
  "listenerInstallation",
  "hydration",
  "canHydrate",
  "eventDispatch",
  "eventReplayInstalled",
  "eventReplaySupported",
  "hydrationReplaySupported",
  "eventsReplayed",
  "hydrateInstanceCalled",
  "hydrateTextInstanceCalled",
  "replayQueueDrained",
  "replayQueuesDrained",
  "publicDispatchEnabled",
  "targetDispatchExecuted",
  "eventReplayDispatchAttempted",
  "pluginDispatchEventForPluginEventSystemCalled",
  "nativeEventRedispatched",
  "syntheticEventCreated",
  "listenerInvocationCount",
  "willInvokeListeners",
  "recoverableErrorsQueued",
  "willQueueRecoverableErrors",
  "onRecoverableErrorInvoked",
  "publicOnRecoverableErrorInvoked",
  "rootErrorCallbackInvocationCount",
  "rootScheduled",
  "suspenseHydrationScheduled",
  "publicHydrationTargetClaimed",
  "publicRootBehaviorChanged",
  "queueMutationAllowed",
  "queued",
  "targetClaimExecuted",
  "willDispatch",
  "willDrainReplayQueues",
  "willHydrate",
  "willReplay",
  "nativeExecution",
  "reconcilerExecution",
  "compatibilityClaimed",
  "publicHydrationCompatibilityClaimed",
  "publicHydrationReplayCompatibilityClaimed",
  "browserDomEventCompatibilityClaimed",
  "packageCompatibilityClaimed",
  "packageExportsChanged"
]);

const rootBridgePath = "packages/react-dom/src/client/root-bridge.js";
const hydrationBoundaryGatePath =
  "packages/react-dom/src/client/hydration-boundary-gate.js";
const reactDomClientPath = "packages/react-dom/client.js";
const rootFacadeConformancePath =
  "tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs";
const hydrationBoundaryConformancePath =
  "tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs";
const rootBridgePackageTestPath =
  "packages/react-dom/test/react-dom-private-root-bridge-shell.test.js";
const packageJsonPath = "packages/react-dom/package.json";
const packageSurfaceGuardPath = "tests/smoke/package-surface-guard.mjs";
const importSmokePath = "tests/smoke/import-entrypoints.mjs";
const rootFacadeBlockedHelperSliceStart =
  "function assertHydrateRootPreflightEvidenceBlocked(rows) {";
const rootFacadeBlockedHelperSliceEnd = "function createPrivateGateDocument";
const rootBridgePackageBlockedHelperSliceStart =
  "function assertHydrateRootPreflightRowsBlocked(rows) {";
const rootBridgePackageBlockedHelperSliceEnd =
  "function assertBridgeDidNotTouchContainer";
const rootBridgeHydrateRootPreflightSliceStart =
  "function createPrivateHydrateRootPublicFacadePreflight(options) {";
const rootBridgeHydrateRootPreflightSliceEnd =
  "function createPrivateHydrateRootPublicFacadePreflightRecord(";
const packageSurfaceReactDomManifestSliceStart =
  "const surfaceManifest = manifestSurface(packageJson);";
const packageSurfaceReactDomManifestSliceEnd =
  "const actualPublicFiles = await publicResolverFiles(";
const importSmokeRuntimeExportGuardSliceStart =
  "function assertNoPrivateDiagnosticRuntimeExports(moduleExports, label) {";
const importSmokeRuntimeExportGuardSliceEnd =
  "function assertPrivateRuntimeFacadeSymbols";

export const PRIVATE_ADMISSION_806_ROWS = freezeArray([
  row({
    workerId: worker762,
    privateAdmission: "accepted-private-hydrateroot-marker-listener-preflight",
    area: "hydrateRoot marker/listener preconditions",
    evidenceChain: "marker-listener-preflight",
    requiredFieldNames: PRIVATE_ADMISSION_806_MARKER_LISTENER_FIELD_NAMES,
    evidence: [
      evidenceData({
        role: "worker-762-root-bridge-marker-listener-source",
        path: rootBridgePath,
        tokens: [
          "privateHydrateRootPublicFacadeMarkerListenerPreflightRecordType",
          PRIVATE_ADMISSION_806_RECORD_TYPES.markerListenerPreflight,
          "ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED",
          "preflighted-private-hydrate-root-public-facade-marker-listener-gate",
          "createPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord(",
          "getPrivateHydrateRootPublicFacadeMarkerListenerPreflightPayload",
          "isPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord"
        ],
        fieldNames: PRIVATE_ADMISSION_806_MARKER_LISTENER_FIELD_NAMES
      }),
      evidenceData({
        role: "worker-762-root-facade-conformance",
        path: rootFacadeConformancePath,
        tokens: [
          "assertHydrateRootPreflightEvidenceBlocked",
          "markerListenerPreflight.preconditions.accepted",
          "markerListenerPreflight.preconditions.stateUnchanged",
          "markerListenerPreflight.blockerEvidence.rootMarkerWriteBlocked",
          "markerListenerPreflight.blockerEvidence.rootListenerInstallationBlocked",
          "getContainerRoot",
          "hasListeningMarker",
          "__mutationLog"
        ]
      })
    ]
  }),
  row({
    workerId: worker770,
    privateAdmission: "accepted-private-hydrateroot-target-claiming-preflight",
    area: "hydrateRoot target claiming preconditions",
    evidenceChain: "marker-listener-to-target-claiming",
    requiredFieldNames: PRIVATE_ADMISSION_806_TARGET_CLAIMING_FIELD_NAMES,
    evidence: [
      evidenceData({
        role: "worker-770-root-bridge-target-claiming-source",
        path: rootBridgePath,
        tokens: [
          "privateHydrateRootPublicFacadeTargetClaimingPreflightRecordType",
          PRIVATE_ADMISSION_806_RECORD_TYPES.targetClaimingPreflight,
          "ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_TARGET_CLAIMING_PREFLIGHTED",
          "preflighted-private-hydrate-root-public-facade-target-claiming-gate",
          "preflightTargetClaiming(",
          "createPrivateHydrateRootPublicFacadeTargetClaimingPreflightRecord(",
          "assertCanonicalPrivateHydrationTargetClaimingDiagnostic(",
          "targetPathDeterministicallySelected",
          "targetPathResolvedToDispatchTarget",
          "targetPathUniqueInContainer",
          "hydratableLookupTargetPathRetained",
          "publicHydrationCompatibilityClaimed",
          "browserDomEventCompatibilityClaimed"
        ],
        fieldNames: PRIVATE_ADMISSION_806_TARGET_CLAIMING_FIELD_NAMES
      }),
      evidenceData({
        role: "worker-770-hydration-boundary-target-claiming-source",
        path: hydrationBoundaryGatePath,
        tokens: [
          "privateHydrationTargetClaimingGateId",
          "hydration-target-claiming-private-gate-1",
          "privateHydrationTargetClaimingMetadataStatus",
          "accepted-private-hydration-target-claiming-metadata",
          "createHydrationTargetClaimingDiagnostic(",
          "assertCanonicalPrivateHydrationTargetClaimingDiagnostic(",
          "hydrationTargetClaimingDiagnosticPayloads.set(",
          "targetClaimExecuted",
          "publicHydrationTargetClaimed",
          "targetPathDeterministicallySelected",
          "hydratableLookupTargetPathRetained"
        ]
      }),
      evidenceData({
        role: "worker-770-root-facade-conformance",
        path: rootFacadeConformancePath,
        tokens: [
          "preflight.preflightTargetClaiming(",
          "targetClaimRecord.preconditions.markerListenerPreflightRequired",
          "targetClaimRecord.preconditions.canonicalTargetClaimingEvidence",
          "targetClaimPayload.targetClaimingPayload",
          "claimPayload.hydrationBoundaryRecord",
          "claimPayload.targetPathResolution.node",
          "hydrate-root-target-claiming-canonical-evidence",
          "hydrationReplay"
        ]
      })
    ]
  }),
  row({
    workerId: worker776,
    privateAdmission:
      "accepted-private-hydrateroot-recoverable-error-preflight",
    area: "hydrateRoot recoverable-error routing metadata",
    evidenceChain: "recoverable-error-preflight",
    requiredFieldNames: PRIVATE_ADMISSION_806_RECOVERABLE_ERROR_FIELD_NAMES,
    evidence: [
      evidenceData({
        role: "worker-776-root-bridge-recoverable-source",
        path: rootBridgePath,
        tokens: [
          "recoverableErrorPreflightRecords",
          "createHydrationTextMismatchRecoverableErrorPreflightRecord(",
          "private-hydrate-root-public-facade-recoverable-error-preflight",
          "recoverableErrorPreflightAccepted",
          "recoverableErrorMetadataAccepted",
          "recoverableErrorMetadataStatus",
          "queuedRecoverableErrorCount",
          "wouldQueueRecoverableErrorCount",
          "recoverableErrorsQueued",
          "onRecoverableErrorInvoked",
          "publicOnRecoverableErrorInvoked",
          "rootErrorCallbackInvocationCount"
        ],
        fieldNames: freezeArray([
          "recoverableErrorPreflight",
          "recoverableErrorPreflightId",
          "recoverableErrorPreflightStatus",
          "recoverableErrorPreflightAccepted",
          "recoverableErrorMetadataAccepted",
          "recoverableErrorMetadataStatus",
          "recoverableErrorMetadataCount",
          "queuedRecoverableErrorCount",
          "wouldQueueRecoverableErrorCount",
          "recoverableErrorsQueued",
          "willQueueRecoverableErrors",
          "onRecoverableErrorConfigured",
          "onRecoverableErrorInvoked",
          "publicOnRecoverableErrorInvoked",
          "rootErrorCallbackInvocationCount"
        ])
      }),
      evidenceData({
        role: "worker-776-hydration-boundary-recoverable-source",
        path: hydrationBoundaryGatePath,
        tokens: [
          "privateHydrationTextMismatchRecoverableErrorPreflightGateId",
          "hydration-text-mismatch-recoverable-error-private-preflight-gate-1",
          "privateHydrationTextMismatchRecoverableErrorPreflightStatus",
          "preflighted-private-hydration-text-mismatch-recoverable-error-metadata",
          "createHydrationTextMismatchRecoverableErrorPreflightRecord(",
          "privatePreflight",
          "diagnosticOnly",
          "readOnly",
          "publicHydrateRootSupported",
          "rootErrorUpdatesScheduled",
          "recoverableErrorsQueued",
          "willQueueRecoverableErrors",
          "callbackInvocationRecordCount",
          "privateOnRecoverableErrorInvoked",
          "publicOnRecoverableErrorInvoked",
          "acceptedPrivateMetadataPreflight",
          "queuedRecoverableErrorPreflight",
          "callbackInvocationPreflight",
          "validateHydrationTextMismatchRecoverableErrorPreflightMetadata",
          "metadata-recorded-callback-not-invoked"
        ],
        fieldNames: freezeArray([
          "privatePreflight",
          "diagnosticOnly",
          "readOnly",
          "acceptedBoundaryMetadataDiagnostics",
          "acceptedBoundaryMetadataRow",
          "callbackInvocationRecordCount",
          "callbackInvocationPreflight"
        ])
      }),
      evidenceData({
        role: "worker-776-hydration-conformance",
        path: hydrationBoundaryConformancePath,
        tokens: [
          "createHydrationTextMismatchRecoverableErrorPreflightRecord(",
          "getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload(",
          "recoverableErrorMetadataAccepted",
          "recoverableErrorsQueued",
          "onRecoverableErrorInvoked",
          "recoverableErrorCalls"
        ]
      })
    ]
  }),
  row({
    workerId: worker786,
    privateAdmission: "accepted-private-hydrateroot-event-replay-preflight",
    area: "hydrateRoot event replay preflight",
    evidenceChain: "target-claiming-to-event-replay",
    requiredFieldNames: PRIVATE_ADMISSION_806_EVENT_REPLAY_FIELD_NAMES,
    evidence: [
      evidenceData({
        role: "worker-786-root-bridge-event-replay-source",
        path: rootBridgePath,
        tokens: [
          "privateHydrateRootPublicFacadeEventReplayPreflightRecordType",
          PRIVATE_ADMISSION_806_RECORD_TYPES.eventReplayPreflight,
          "ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_EVENT_REPLAY_PREFLIGHTED",
          "preflighted-private-hydrate-root-public-facade-event-replay-gate",
          "preflightEventReplay(",
          "createPrivateHydrateRootPublicFacadeEventReplayPreflightRecord(",
          "assertCanonicalPrivateHydrationClaimedReplayTargetDispatchExecutionRecord(",
          "canonicalReplayExecutionMetadata",
          "replayExecutionRecordImmutable",
          "blockedDispatchRecord",
          "clickReplayDispatchDiagnosticBlocked",
          "replayExecutionRecord",
          "replayExecutionGateId",
          "targetDispatchExecuted",
          "eventReplayDispatchAttempted",
          "pluginDispatchEventForPluginEventSystemCalled",
          "nativeEventRedispatched",
          "syntheticEventCreated",
          "listenerInvocationCount",
          "recoverableErrorsQueued"
        ],
        fieldNames: PRIVATE_ADMISSION_806_EVENT_REPLAY_FIELD_NAMES
      }),
      evidenceData({
        role: "worker-786-hydration-boundary-replay-source",
        path: hydrationBoundaryGatePath,
        tokens: [
          "privateHydrationClaimedReplayTargetDispatchExecutionGateId",
          "hydration-claimed-replay-target-dispatch-execution-private-gate-1",
          "privateHydrationClaimedReplayTargetDispatchExecutionStatus",
          "blocked-private-hydration-claimed-replay-target-dispatch-execution",
          "createHydrationClaimedReplayTargetDispatchExecutionRecord(",
          "replayTargetDispatchExecutionRecorded",
          "replayTargetDispatchExecutionBlocked",
          "dispatchExecutionBlocked",
          "eventReplayDispatchAttempted",
          "pluginDispatchEventForPluginEventSystemCalled",
          "hydrateInstanceCalled",
          "onRecoverableErrorInvoked",
          "hydrationEventReplayBlockerCount",
          "assertCanonicalPrivateHydrationClaimedReplayTargetDispatchExecutionRecord("
        ]
      }),
      evidenceData({
        role: "worker-786-root-facade-conformance",
        path: rootFacadeConformancePath,
        tokens: [
          "preflight.preflightEventReplay(",
          "eventReplayRecord.preconditions.targetClaimingPreflightRequired",
          "eventReplayRecord.preconditions.canonicalReplayExecutionMetadata",
          "eventReplayRecord.dispatchRecordStatus",
          "eventReplayRecord.targetDispatchExecuted",
          "eventReplayRecord.eventReplayDispatchAttempted",
          "eventReplayRecord.listenerInvocationCount",
          "eventReplayPayload.replayExecutionPayload",
          "executionPayload.dispatchRecord",
          "hydrate-root-replay-target-dispatch-execution-metadata"
        ]
      })
    ]
  }),
  row({
    workerId: worker797,
    privateAdmission:
      "accepted-private-hydrateroot-preflight-ownership-matrix",
    area: "hydrateRoot preflight matrix ownership chain",
    evidenceChain: "marker-listener-recoverable-target-event-matrix",
    requiredFieldNames: PRIVATE_ADMISSION_806_MATRIX_FIELD_NAMES,
    evidence: [
      evidenceData({
        role: "worker-797-conformance-matrix",
        path: rootFacadeConformancePath,
        tokens: [
          "getPrivateHydrateRootPublicFacadePreflightPayload",
          "getPrivateHydrateRootPublicFacadeMarkerListenerPreflightPayload",
          "getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload",
          "getPrivateHydrateRootPublicFacadeTargetClaimingPreflightPayload",
          "getPrivateHydrationTargetClaimingDiagnosticPayload",
          "getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload",
          "getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload",
          "assertHydrateRootPreflightEvidenceBlocked",
          "preflightPayload.preflightRecords",
          "preflightPayload.markerListenerPreflightRecords",
          "preflightPayload.recoverableErrorPreflightRecords",
          "preflightPayload.targetClaimingPreflightRecords",
          "preflightPayload.eventReplayPreflightRecords",
          "markerListenerPayload.requestRecord",
          "recoverableErrorPayload.hydrationBoundaryRecord",
          "recoverableErrorPayload.recoverableErrorMetadata",
          "targetClaimPayload.markerListenerPayload",
          "targetClaimPayload.targetClaimingPayload",
          "claimPayload.targetDispatchLinkDiagnostic",
          "claimPayload.ownershipDiagnostics",
          "eventReplayPayload.targetClaimingPayload",
          "eventReplayPayload.replayExecutionPayload",
          "executionPayload.targetClaimingDiagnosticPayload",
          "executionPayload.targetDispatchLinkPayload",
          "executionPayload.recoverableErrorMetadata",
          "recoverableErrorCalls",
          "hydrationReplay"
        ],
        fieldNames: PRIVATE_ADMISSION_806_MATRIX_FIELD_NAMES
      }),
      evidenceData({
        role: "worker-797-package-matrix",
        path: rootBridgePackageTestPath,
        tokens: [
          "getPrivateHydrateRootPublicFacadePreflightPayload",
          "getPrivateHydrateRootPublicFacadeMarkerListenerPreflightPayload",
          "getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload",
          "getPrivateHydrateRootPublicFacadeTargetClaimingPreflightPayload",
          "getPrivateHydrationTargetClaimingDiagnosticPayload",
          "getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload",
          "getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload",
          "assertHydrateRootPreflightRowsBlocked",
          "preflightPayload.preflightRecords",
          "preflightPayload.markerListenerPreflightRecords",
          "preflightPayload.recoverableErrorPreflightRecords",
          "preflightPayload.targetClaimingPreflightRecords",
          "preflightPayload.eventReplayPreflightRecords",
          "markerListenerPayload.requestRecord",
          "recoverableErrorPayload.hydrationBoundaryRecord",
          "targetClaimPayload.markerListenerPayload",
          "eventReplayPayload.replayExecutionPayload",
          "executionPayload.targetClaimingDiagnosticPayload",
          "executionPayload.targetDispatchLinkPayload",
          "recoverableErrorCalls"
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_806_WORKERS = freezeArray(
  PRIVATE_ADMISSION_806_ROWS.map((row) => row.workerId)
);

export const PRIVATE_ADMISSION_806_PACKAGE_SURFACE_EVIDENCE = freezeArray([
  evidenceData({
    role: "react-dom-client-private-hydrateroot-symbol",
    path: reactDomClientPath,
    tokens: [
      "privateHydrateRootPublicFacadePreflightSymbol",
      "createPrivateHydrateRootPublicFacadePreflight",
      "Object.defineProperty",
      "hydrateRoot"
    ]
  }),
  evidenceData({
    role: "react-dom-package-exports-public-client-only",
    path: packageJsonPath,
    tokens: ["./client", "./package.json"],
    forbiddenTokens: [
      '"./src/client/root-bridge"',
      '"./src/client/hydration-boundary-gate"',
      '"./root-bridge"',
      '"./hydration-boundary-gate"'
    ]
  }),
  evidenceData({
    role: "react-dom-package-surface-private-file-guard",
    path: packageSurfaceGuardPath,
    tokens: [
      "'src/client/root-bridge.js'",
      "'src/client/hydration-boundary-gate.js'",
      "assertNoPrivateDiagnosticExportKeys(surfaceManifest.exports, packageName)",
      "assertNoPrivateDiagnosticPublicFiles(actualPublicFiles, packageName)"
    ]
  }),
  evidenceData({
    role: "react-dom-import-smoke-private-symbol-only",
    path: importSmokePath,
    tokens: [
      "assertPrivateRuntimeFacadeSymbols(",
      "cjsModule.hydrateRoot",
      "reactDomClientPrivateRuntimeFacadeSymbols.hydrateRoot",
      "assertNoPrivateDiagnosticRuntimeExports(moduleExports, label)"
    ]
  })
]);

const rootFacadePublicBlockerHelperFields = freezeArray([
  "browserDomEventCompatibilityClaimed",
  "canHydrate",
  "compatibilityClaimed",
  "containerMarked",
  "domMutated",
  "domMutation",
  "eventDispatch",
  "eventReplayInstalled",
  "eventReplaySupported",
  "eventsReplayed",
  "hydration",
  "hydrationReplaySupported",
  "listenerInstallation",
  "listenersAttached",
  "markerWrites",
  "publicHydrateRootEnabled",
  "publicHydrateRootSupported",
  "publicHydrationCompatibilityClaimed",
  "publicHydrationReplayCompatibilityClaimed",
  "publicRootBehaviorChanged",
  "publicRootCompatibilitySurface",
  "publicRootCreated",
  "publicRootObjectExposed",
  "queueMutationAllowed",
  "queued",
  "rootScheduled",
  "suspenseHydrationScheduled",
  "willDispatch",
  "willHydrate",
  "willReplay"
]);

const rootBridgePackagePublicBlockerHelperFields = freezeArray([
  "eventReplayDispatchAttempted",
  "hydrateInstanceCalled",
  "hydrateTextInstanceCalled",
  "listenerInvocationCount",
  "nativeEventRedispatched",
  "onRecoverableErrorInvoked",
  "pluginDispatchEventForPluginEventSystemCalled",
  "publicDispatchEnabled",
  "publicHydrationTargetClaimed",
  "publicOnRecoverableErrorInvoked",
  "recoverableErrorsQueued",
  "replayQueueDrained",
  "replayQueuesDrained",
  "rootErrorCallbackInvocationCount",
  "syntheticEventCreated",
  "targetClaimExecuted",
  "targetDispatchExecuted",
  "willDrainReplayQueues",
  "willInvokeListeners",
  "willQueueRecoverableErrors"
]);

const rootBridgeHydrateRootPreflightBlockerFields = freezeArray([
  "nativeExecution",
  "reconcilerExecution"
]);

const publicBlockerCounterFieldNames = freezeArray([
  "listenerInvocationCount",
  "rootErrorCallbackInvocationCount"
]);

export const PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELD_EVIDENCE = freezeArray([
  ...rootFacadePublicBlockerHelperFields.map((field) =>
    publicBlockerHelperEvidenceData({
      field,
      path: rootFacadeConformancePath,
      helperName: "assertHydrateRootPreflightEvidenceBlocked",
      sliceStart: rootFacadeBlockedHelperSliceStart,
      sliceEnd: rootFacadeBlockedHelperSliceEnd
    })
  ),
  ...rootBridgePackagePublicBlockerHelperFields.map((field) =>
    publicBlockerHelperEvidenceData({
      field,
      path: rootBridgePackageTestPath,
      helperName: "assertHydrateRootPreflightRowsBlocked",
      sliceStart: rootBridgePackageBlockedHelperSliceStart,
      sliceEnd: rootBridgePackageBlockedHelperSliceEnd
    })
  ),
  ...rootBridgeHydrateRootPreflightBlockerFields.map((field) =>
    publicBlockerEvidenceData({
      field,
      path: rootBridgePath,
      tokens: [
        field,
        "createPrivateHydrateRootPublicFacadePreflight",
        "ROOT_BRIDGE_EXECUTION_BLOCKED",
        "ROOT_BRIDGE_COMPATIBILITY_BLOCKED"
      ],
      fieldNames: [field],
      sliceStart: rootBridgeHydrateRootPreflightSliceStart,
      sliceEnd: rootBridgeHydrateRootPreflightSliceEnd
    })
  ),
  publicBlockerEvidenceData({
    field: "packageCompatibilityClaimed",
    path: importSmokePath,
    tokens: [
      "assertNoPrivateDiagnosticRuntimeExports",
      "privateDiagnosticRuntimeExportPattern",
      "allowedRuntimeMetadataKeys"
    ],
    sliceStart: importSmokeRuntimeExportGuardSliceStart,
    sliceEnd: importSmokeRuntimeExportGuardSliceEnd
  }),
  publicBlockerEvidenceData({
    field: "packageExportsChanged",
    path: packageSurfaceGuardPath,
    tokens: [
      "manifestSurface",
      "assertNoPrivateDiagnosticExportKeys",
      "assertPrivateImplementationExportMapBlocked"
    ],
    sliceStart: packageSurfaceReactDomManifestSliceStart,
    sliceEnd: packageSurfaceReactDomManifestSliceEnd
  })
]);

export function evaluatePrivateAdmission806Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  packageSurfaceEvidence = PRIVATE_ADMISSION_806_PACKAGE_SURFACE_EVIDENCE,
  publicBlockerFieldEvidence =
    PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELD_EVIDENCE,
  compatibilityClaimed = false,
  publicCompatibilityClaimed = false
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_806_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const packageEvidence = freezeArray(
    packageSurfaceEvidence.map((evidenceRow) =>
      evaluateEvidenceRow({
        evidenceRow,
        fileCache,
        workspaceRoot
      })
    )
  );
  const publicBlockerEvidence = freezeArray(
    publicBlockerFieldEvidence.map((evidenceRow) =>
      evaluatePublicBlockerEvidenceRow({
        evidenceRow,
        fileCache,
        workspaceRoot
      })
    )
  );

  const manifestWorkerIds = rows.map((row) => row.workerId);
  const manifest = freezeRecord({
    expectedWorkerIds: PRIVATE_ADMISSION_806_REQUIRED_WORKERS,
    actualWorkerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_806_REQUIRED_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_806_REQUIRED_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    )
  });

  const evidenceTokenMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        evidenceViolationDetails({ row, evidenceRow })
      )
  );
  const packageEvidenceMismatches = packageEvidence
    .filter((evidenceRow) => evidenceRow.recognized !== true)
    .map((evidenceRow) =>
      freezeRecord({
        role: evidenceRow.role,
        path: evidenceRow.path,
        missingTokens: evidenceRow.missingTokens,
        missingFieldNames: evidenceRow.missingFieldNames,
        forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
        readError: evidenceRow.readError,
        sliceError: evidenceRow.sliceError
      })
    );
  const diagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_806_REQUIRED_DIAGNOSTIC_IDS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedDiagnosticIds",
    actualKeyForViolation: "actualDiagnosticIds"
  });
  const statusMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_806_REQUIRED_STATUSES,
    actualKey: "acceptedStatuses",
    expectedKey: "expectedStatuses",
    actualKeyForViolation: "actualStatuses"
  });
  const chainMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_806_REQUIRED_CHAIN,
    actualKey: "requiredPriorWorkers",
    expectedKey: "expectedPriorWorkers",
    actualKeyForViolation: "actualPriorWorkers"
  });
  const fieldMismatches = evaluatedRows.flatMap((row) => {
    if (sameStringSet(row.requiredFieldNames, row.observedFieldNames)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedFieldNames: row.requiredFieldNames,
        actualFieldNames: row.observedFieldNames
      })
    ];
  });
  const publicBlockerEvidenceMismatches = publicBlockerEvidence
    .filter((evidenceRow) => evidenceRow.recognized !== true)
    .map((evidenceRow) =>
      freezeRecord({
        field: evidenceRow.field,
        path: evidenceRow.path,
        role: evidenceRow.role,
        missingTokens: evidenceRow.missingTokens,
        missingFieldNames: evidenceRow.missingFieldNames,
        forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
        readError: evidenceRow.readError,
        sliceError: evidenceRow.sliceError
      })
    );
  const observedPublicBlockerFields = freezeArray(
    publicBlockerEvidence
      .filter((evidenceRow) => evidenceRow.recognized === true)
      .map((evidenceRow) => evidenceRow.field)
  );
  const publicBlockerFieldMismatches = sameStringSet(
    PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS,
    observedPublicBlockerFields
  )
    ? []
    : [
        freezeRecord({
          expectedPublicBlockerFields:
            PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS,
          actualPublicBlockerFields: observedPublicBlockerFields
        })
      ];
  const publicBlockerClaimViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockerClaims ?? {})
      .filter(([, value]) => value !== false && value !== 0)
      .map(([claimId]) => `${row.workerId}.${claimId}`)
  );
  const rowCompatibilityClaimViolations = evaluatedRows.flatMap((row) =>
    row.compatibilityClaimed === false ? [] : [`${row.workerId}.compatibilityClaimed`]
  );
  const rowPublicCompatibilityClaimViolations = evaluatedRows.flatMap((row) =>
    row.publicCompatibilityClaimed === false
      ? []
      : [`${row.workerId}.publicCompatibilityClaimed`]
  );
  const staticReadOnlyViolations = evaluatedRows
    .filter((row) => row.staticReadOnlyRecognized !== true)
    .map((row) => row.workerId);
  const topLevelCompatibilityClaimViolations = [];
  if (compatibilityClaimed !== false) {
    topLevelCompatibilityClaimViolations.push("gate.compatibilityClaimed");
  }
  if (publicCompatibilityClaimed !== false) {
    topLevelCompatibilityClaimViolations.push(
      "gate.publicCompatibilityClaimed"
    );
  }

  const publicHydrateRootClaimIds = publicBlockerClaimViolations.filter(
    (claimId) => /(?:publicHydrateRootEnabled|publicHydrateRootSupported)$/.test(claimId)
  );
  const rootCreationClaimIds = publicBlockerClaimViolations.filter((claimId) =>
    /(?:publicRootCreated|publicRootObjectExposed|publicRootCompatibilitySurface|rootScheduled|suspenseHydrationScheduled)$/.test(
      claimId
    )
  );
  const domMutationClaimIds = publicBlockerClaimViolations.filter((claimId) =>
    /(?:containerMarked|domMutated|domMutation|markerWrites)$/.test(claimId)
  );
  const listenerInstallationClaimIds = publicBlockerClaimViolations.filter(
    (claimId) => /(?:listenersAttached|listenerInstallation)$/.test(claimId)
  );
  const eventReplayDrainDispatchClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /(?:eventDispatch|eventReplayInstalled|eventReplaySupported|hydrationReplaySupported|eventsReplayed|replayQueueDrained|replayQueuesDrained|targetDispatchExecuted|eventReplayDispatchAttempted|pluginDispatchEventForPluginEventSystemCalled|nativeEventRedispatched|syntheticEventCreated)$/.test(
        claimId
      )
  );
  const callbackInvocationClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /(?:listenerInvocationCount|willInvokeListeners|recoverableErrorsQueued|willQueueRecoverableErrors|onRecoverableErrorInvoked|publicOnRecoverableErrorInvoked|rootErrorCallbackInvocationCount)$/.test(
        claimId
      )
  );
  const packageCompatibilityClaimIds = publicBlockerClaimViolations.filter(
    (claimId) => /(?:packageCompatibilityClaimed|packageExportsChanged)$/.test(claimId)
  );
  const publicHydrationCompatibilityClaimIds =
    publicBlockerClaimViolations.filter((claimId) =>
      /(?:canHydrate|hydration|publicHydrationCompatibilityClaimed|publicHydrationReplayCompatibilityClaimed|browserDomEventCompatibilityClaimed|compatibilityClaimed)$/.test(
        claimId
      )
    );

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("hydrateroot-admission-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "hydrateroot-admission-evidence-token-missing",
    evidenceTokenMismatches
  );
  pushRowsViolation(
    violations,
    "hydrateroot-package-surface-evidence-mismatch",
    packageEvidenceMismatches
  );
  pushRowsViolation(
    violations,
    "hydrateroot-admission-diagnostic-id-mismatch",
    diagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "hydrateroot-admission-status-mismatch",
    statusMismatches
  );
  pushRowsViolation(
    violations,
    "hydrateroot-admission-ownership-chain-mismatch",
    chainMismatches
  );
  pushRowsViolation(
    violations,
    "hydrateroot-admission-field-name-mismatch",
    fieldMismatches
  );
  pushRowsViolation(
    violations,
    "hydrateroot-public-blocker-field-mismatch",
    publicBlockerFieldMismatches
  );
  pushRowsViolation(
    violations,
    "hydrateroot-public-blocker-evidence-missing",
    publicBlockerEvidenceMismatches
  );
  pushClaimIdsViolation(
    violations,
    "public-hydrateroot-claim-detected",
    publicHydrateRootClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "root-creation-claim-detected",
    rootCreationClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "dom-mutation-claim-detected",
    domMutationClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "listener-installation-claim-detected",
    listenerInstallationClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "event-replay-drain-dispatch-claim-detected",
    eventReplayDrainDispatchClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "callback-invocation-claim-detected",
    callbackInvocationClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "package-compatibility-claim-detected",
    packageCompatibilityClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "public-hydration-compatibility-claim-detected",
    publicHydrationCompatibilityClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "public-blocker-claim-detected",
    publicBlockerClaimViolations
  );
  pushClaimIdsViolation(
    violations,
    "private-diagnostic-compatibility-claim-detected",
    [
      ...rowCompatibilityClaimViolations,
      ...rowPublicCompatibilityClaimViolations
    ]
  );
  pushIdsViolation(
    violations,
    "static-ledger-mode-mismatch",
    staticReadOnlyViolations
  );
  pushClaimIdsViolation(
    violations,
    "top-level-compatibility-claim-detected",
    topLevelCompatibilityClaimViolations
  );

  const evidenceRecognized =
    evidenceTokenMismatches.length === 0 &&
    packageEvidenceMismatches.length === 0;
  const diagnosticsRecognized = diagnosticMismatches.length === 0;
  const statusesRecognized = statusMismatches.length === 0;
  const ownershipChainRecognized = chainMismatches.length === 0;
  const fieldNamesRecognized = fieldMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerFieldMismatches.length === 0 &&
    publicBlockerEvidenceMismatches.length === 0 &&
    publicBlockerClaimViolations.length === 0 &&
    rowCompatibilityClaimViolations.length === 0 &&
    rowPublicCompatibilityClaimViolations.length === 0;
  const staticReadOnlyRecognized =
    staticReadOnlyViolations.length === 0 &&
    topLevelCompatibilityClaimViolations.length === 0;
  const publicCompatibilityLeakDetected =
    publicCompatibilityClaimed !== false ||
    publicBlockerClaimViolations.length > 0 ||
    rowPublicCompatibilityClaimViolations.length > 0;
  const compatibilityLeakDetected =
    compatibilityClaimed !== false ||
    publicCompatibilityLeakDetected ||
    rowCompatibilityClaimViolations.length > 0;
  const privateDiagnosticsRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    evidenceRecognized &&
    diagnosticsRecognized &&
    statusesRecognized &&
    ownershipChainRecognized &&
    fieldNamesRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_806_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_806_GATE_STATUS
      : PRIVATE_ADMISSION_806_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    evidenceRecognized,
    diagnosticsRecognized,
    statusesRecognized,
    ownershipChainRecognized,
    fieldNamesRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed: compatibilityLeakDetected,
    publicCompatibilityClaimed: publicCompatibilityLeakDetected,
    queueWorkers: PRIVATE_ADMISSION_806_REQUIRED_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows.map((row) => row.workerId)
    ),
    rows: freezeArray(evaluatedRows),
    rowsByWorker: freezeRecord(
      Object.fromEntries(evaluatedRows.map((row) => [row.workerId, row]))
    ),
    packageSurfaceEvidence: packageEvidence,
    publicBlockerEvidence,
    publicBlockerFieldCoverageFields: observedPublicBlockerFields,
    manifest,
    evidenceTokenMismatchRows: freezeArray(evidenceTokenMismatches),
    packageEvidenceMismatchRows: freezeArray(packageEvidenceMismatches),
    publicBlockerEvidenceMismatchRows: freezeArray(
      publicBlockerEvidenceMismatches
    ),
    publicBlockerClaimViolationIds: freezeArray(publicBlockerClaimViolations),
    publicHydrateRootClaimIds: freezeArray(publicHydrateRootClaimIds),
    rootCreationClaimIds: freezeArray(rootCreationClaimIds),
    domMutationClaimIds: freezeArray(domMutationClaimIds),
    listenerInstallationClaimIds: freezeArray(listenerInstallationClaimIds),
    eventReplayDrainDispatchClaimIds: freezeArray(
      eventReplayDrainDispatchClaimIds
    ),
    callbackInvocationClaimIds: freezeArray(callbackInvocationClaimIds),
    packageCompatibilityClaimIds: freezeArray(packageCompatibilityClaimIds),
    publicHydrationCompatibilityClaimIds: freezeArray(
      publicHydrationCompatibilityClaimIds
    ),
    staticReadOnlyViolationIds: freezeArray(staticReadOnlyViolations),
    violations: freezeArray(violations)
  });
}

function row({
  workerId,
  privateAdmission,
  area,
  evidenceChain,
  requiredFieldNames,
  evidence
}) {
  return freezeRecord({
    workerId,
    sourceQueue: "806",
    privateAdmission,
    area,
    evidenceChain,
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_806_REQUIRED_DIAGNOSTIC_IDS[workerId],
    acceptedStatuses: PRIVATE_ADMISSION_806_REQUIRED_STATUSES[workerId],
    requiredPriorWorkers: PRIVATE_ADMISSION_806_REQUIRED_CHAIN[workerId],
    requiredFieldNames,
    evidence: freezeArray(evidence),
    promotion: "rejected",
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    publicRuntimeExecutionClaimed: false,
    compatibilityClaimed: false,
    publicCompatibilityClaimed: false,
    ledgerEvaluationMode: "source-token-checks-and-manifest-only"
  });
}

function evidenceData({
  role,
  path,
  tokens,
  fieldNames = [],
  forbiddenTokens = [],
  sliceStart = null,
  sliceEnd = null
}) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens),
    fieldNames: freezeArray(fieldNames),
    forbiddenTokens: freezeArray(forbiddenTokens),
    sliceStart,
    sliceEnd
  });
}

function publicBlockerHelperEvidenceData({
  field,
  path,
  helperName,
  sliceStart,
  sliceEnd
}) {
  return publicBlockerEvidenceData({
    field,
    path,
    tokens: [
      field,
      helperName,
      publicBlockerCounterFieldNames.includes(field)
        ? "Object.prototype.hasOwnProperty.call"
        : "blockedBooleanFields"
    ],
    fieldNames: [field],
    sliceStart,
    sliceEnd
  });
}

function publicBlockerEvidenceData({
  field,
  path,
  tokens,
  fieldNames = [],
  forbiddenTokens = [],
  sliceStart = null,
  sliceEnd = null
}) {
  return freezeRecord({
    field,
    role: `public-blocker-${field}`,
    path,
    tokens: freezeArray(tokens),
    fieldNames: freezeArray(fieldNames),
    forbiddenTokens: freezeArray(forbiddenTokens),
    sliceStart,
    sliceEnd
  });
}

function mergeRowOverride(row, override) {
  if (override == null || Object.keys(override).length === 0) {
    return row;
  }

  const merged = { ...row, ...override };
  for (const key of [
    "acceptedDiagnosticIds",
    "acceptedStatuses",
    "requiredPriorWorkers",
    "requiredFieldNames",
    "evidence"
  ]) {
    if (Object.hasOwn(override, key)) {
      merged[key] = freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "publicBlockerClaims")) {
    merged.publicBlockerClaims = freezeRecord({
      ...(row.publicBlockerClaims ?? {}),
      ...override.publicBlockerClaims
    });
  }
  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({
      evidenceRow,
      fileCache,
      workspaceRoot
    })
  );
  const observedFieldNames = freezeArray(
    row.requiredFieldNames.filter((fieldName) =>
      evidence.some((evidenceRow) =>
        evidenceRow.coveredFieldNames.includes(fieldName)
      )
    )
  );
  const staticReadOnlyRecognized =
    row.privateEvidenceOnly === true &&
    row.sourceTokenChecksOnly === true &&
    row.manifestEvaluationOnly === true &&
    row.runtimeExecutionClaimed === false &&
    row.publicRuntimeExecutionClaimed === false &&
    (row.packageCompatibilityClaimed === undefined ||
      row.packageCompatibilityClaimed === false) &&
    (row.packageExportsChanged === undefined ||
      row.packageExportsChanged === false) &&
    row.compatibilityClaimed === false &&
    row.publicCompatibilityClaimed === false &&
    row.ledgerEvaluationMode === "source-token-checks-and-manifest-only";

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    observedFieldNames,
    evidenceRecognized: evidence.every(
      (evidenceRow) => evidenceRow.recognized === true
    ),
    staticReadOnlyRecognized
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const readResult = readEvidenceFile({
    fileCache,
    path: evidenceRow.path,
    workspaceRoot
  });
  let text = readResult.text;
  let sliceError = null;
  if (readResult.readError === null) {
    const sliceResult = sliceEvidenceText({
      path: evidenceRow.path,
      text,
      sliceStart: evidenceRow.sliceStart,
      sliceEnd: evidenceRow.sliceEnd
    });
    text = sliceResult.text;
    sliceError = sliceResult.sliceError;
  }

  const missingTokens =
    readResult.readError === null && sliceError === null
      ? evidenceRow.tokens.filter((token) => !text.includes(token))
      : [...evidenceRow.tokens];
  const forbiddenTokensPresent =
    readResult.readError === null && sliceError === null
      ? evidenceRow.forbiddenTokens.filter((token) => text.includes(token))
      : [];
  const coveredFieldNames =
    readResult.readError === null && sliceError === null
      ? evidenceRow.fieldNames.filter((fieldName) => text.includes(fieldName))
      : [];
  const missingFieldNames =
    readResult.readError === null && sliceError === null
      ? evidenceRow.fieldNames.filter((fieldName) => !text.includes(fieldName))
      : [...evidenceRow.fieldNames];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      readResult.readError === null &&
      sliceError === null &&
      missingTokens.length === 0 &&
      missingFieldNames.length === 0 &&
      forbiddenTokensPresent.length === 0,
    missingTokens: freezeArray(missingTokens),
    coveredFieldNames: freezeArray(coveredFieldNames),
    missingFieldNames: freezeArray(missingFieldNames),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    readError: readResult.readError,
    sliceError
  });
}

function evaluatePublicBlockerEvidenceRow({
  evidenceRow,
  fileCache,
  workspaceRoot
}) {
  const evaluated = evaluateEvidenceRow({
    evidenceRow,
    fileCache,
    workspaceRoot
  });
  return freezeRecord({
    ...evaluated,
    recognized:
      PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS.includes(evidenceRow.field) &&
      evaluated.recognized === true
  });
}

function readEvidenceFile({ fileCache, path, workspaceRoot }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }
  let result;
  try {
    result = freezeRecord({
      text: readFileSync(join(workspaceRoot, path), "utf8"),
      readError: null
    });
  } catch (error) {
    result = freezeRecord({
      text: "",
      readError: error instanceof Error ? error.message : String(error)
    });
  }
  fileCache.set(path, result);
  return result;
}

function sliceEvidenceText({ path, text, sliceStart, sliceEnd }) {
  let startIndex = 0;
  let endIndex = text.length;
  if (sliceStart !== null) {
    startIndex = text.indexOf(sliceStart);
    if (startIndex === -1) {
      return freezeRecord({
        text: "",
        sliceError: `sliceStart not found in ${path}`
      });
    }
  }
  if (sliceEnd !== null) {
    endIndex = text.indexOf(sliceEnd, startIndex);
    if (endIndex === -1) {
      return freezeRecord({
        text: "",
        sliceError: `sliceEnd not found in ${path}`
      });
    }
  }
  return freezeRecord({
    text: text.slice(startIndex, endIndex),
    sliceError: null
  });
}

function evidenceViolationDetails({ row, evidenceRow }) {
  return freezeRecord({
    workerId: row.workerId,
    role: evidenceRow.role,
    path: evidenceRow.path,
    missingTokens: evidenceRow.missingTokens,
    missingFieldNames: evidenceRow.missingFieldNames,
    forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
    readError: evidenceRow.readError,
    sliceError: evidenceRow.sliceError
  });
}

function compareRequiredArrayByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId] ?? [];
    const actual = row[actualKey] ?? [];
    if (sameStringSet(expected, actual)) {
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

function sameStringSet(expected, actual) {
  if (expected.length !== actual.length) {
    return false;
  }
  const actualSet = new Set(actual);
  if (actualSet.size !== actual.length) {
    return false;
  }
  return expected.every((value) => actualSet.has(value));
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze(record);
}
