import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const reactPackageRoot = path.join(repoRoot, "packages", "react");
const React = require(path.join(reactPackageRoot, "index.js"));
const ReactCjsDevelopment = require(path.join(
  reactPackageRoot,
  "cjs",
  "react.development.js"
));
const ReactCjsProduction = require(path.join(
  reactPackageRoot,
  "cjs",
  "react.production.js"
));
const ReactServer = require(path.join(
  reactPackageRoot,
  "react.react-server.js"
));
const hookDispatcher = require(path.join(
  reactPackageRoot,
  "hook-dispatcher.js"
));

const expectedTransitionHookNames = ["useDeferredValue", "useTransition"];
const expectedPublicShapeBlockerFields = [
  "hookName",
  "expectedName",
  "expectedLength",
  "currentPublicExport",
  "blocker"
];
const expectedPublicShapeBlockers = [
  {
    hookName: "useDeferredValue",
    expectedName: "",
    expectedLength: 2,
    currentPublicExport: "react.useDeferredValue placeholder",
    blocker:
      "public export remains a createUnimplementedFunction placeholder until deferred value scheduling is admitted"
  },
  {
    hookName: "useTransition",
    expectedName: "",
    expectedLength: 0,
    currentPublicExport: "react.useTransition placeholder",
    blocker:
      "public export remains a createUnimplementedFunction placeholder until transition scheduling is admitted"
  }
];
const expectedStartTransitionPublicRoutingBlockerFields = [
  "apiName",
  "currentPublicExport",
  "blocker"
];
const expectedStartTransitionPublicRoutingBlocker = {
  apiName: "startTransition",
  currentPublicExport: "react.startTransition facade",
  blocker:
    "public startTransition does not route through the hook dispatcher, request transition lanes, or schedule root work until transition execution is admitted"
};
const expectedTransitionActionIdentityFieldNames = [
  "action",
  "actionName",
  "actionLength"
];
const expectedTransitionLaneMetadataFieldNames = [
  "laneChoiceRecord",
  "laneChoiceSourcePriority",
  "transitionUpdateLaneClaim",
  "transitionDeferredLaneClaim",
  "scheduleUpdateRecord",
  "entanglementRecord",
  "pendingLanesBeforeEnqueueField",
  "pendingLanesAfterEnqueueField",
  "selectedNextLanesField"
];
const expectedTransitionLaneMetadata = {
  laneChoiceRecord: "RootUpdateLaneChoiceRecord",
  laneChoiceSourcePriority: "RootUpdateLaneSourcePriority::TransitionLane",
  transitionUpdateLaneClaim: "LaneClaimers.claim_next_transition_update_lane",
  transitionDeferredLaneClaim:
    "LaneClaimers.claim_next_transition_deferred_lane",
  scheduleUpdateRecord: "RootScheduleUpdateRecord",
  entanglementRecord: "RootTransitionEntanglementRecord",
  pendingLanesBeforeEnqueueField:
    "UpdateContainerResult.pending_lanes_before_enqueue",
  pendingLanesAfterEnqueueField:
    "UpdateContainerResult.pending_lanes_after_enqueue",
  selectedNextLanesField: "UpdateContainerResult.selected_next_lanes"
};
const expectedTransitionPendingStateTupleFieldNames = [
  "tupleKind",
  "tupleLength",
  "pendingStateSlot",
  "startTransitionSlot",
  "initialPendingState",
  "optimisticPendingState",
  "finishedPendingState"
];
const expectedTransitionPendingStateTupleShape = {
  tupleKind: "useTransition",
  tupleLength: 2,
  pendingStateSlot: "isPending",
  startTransitionSlot: "startTransition",
  initialPendingState: false,
  optimisticPendingState: true,
  finishedPendingState: false
};
const expectedStartTransitionRoutingRecordFieldNames = [
  "dispatcher",
  "action",
  "actionName",
  "actionLength",
  "metadata",
  "laneMetadata",
  "pendingStateTupleShape",
  "schedulerExecutionBlocked",
  "rootSchedulingBlocked",
  "rootExecutionBlocked",
  "callbackExecutionBlocked",
  "publicStartTransitionDispatcherRouting",
  "compatibilityClaimed"
];
const expectedMissingSchedulerPrerequisites = [
  "getCurrentUpdatePriority",
  "setCurrentUpdatePriority",
  "higherEventPriority",
  "requestUpdateLane",
  "requestDeferredLane",
  "dispatchOptimisticSetState",
  "dispatchSetStateInternal",
  "markSkippedUpdateLanes",
  "useThenable"
];
const expectedMissingRootLanePrerequisites = [
  "LaneClaimers.claim_next_transition_update_lane",
  "LaneClaimers.claim_next_transition_deferred_lane",
  "RootLaneState.mark_updated",
  "RootLaneState.mark_entangled",
  "UpdateQueueStore.entangle_transition_update"
];
const expectedCompatibilityFalseFlags = [
  "compatibilityClaimed",
  "exposesPublicHookImplementation",
  "publicStartTransitionDispatcherRouting",
  "publicUseTransitionImplementation",
  "hookExecutionCompatibility",
  "publicActIntegration",
  "publicSchedulerTimingCompatibility",
  "rendererIntegration",
  "rendererCompatibility",
  "schedulerIntegration",
  "rootLaneIntegration",
  "schedulerExecution",
  "rootScheduling",
  "rootExecution",
  "schedulesTransitionUpdates",
  "schedulesDeferredValueUpdates",
  "executesTransitionCallbacks",
  "returnsPendingState",
  "readsThenables"
];
const expectedBlockerCurrentnessFieldNames = [
  "status",
  "compatibilityTarget",
  "startTransitionRootlessCurrent",
  "publicUseTransitionBlocked",
  "publicUseDeferredValueBlocked",
  "schedulerPrerequisitesBlocked",
  "rootLanePrerequisitesBlocked",
  "rootSchedulingBlocked",
  "laneIntegrationBlocked",
  "hookExecutionCompatibilityBlocked",
  "publicActBlocked",
  "publicSchedulerTimingBlocked",
  "rendererCompatibilityBlocked",
  "compatibilityClaimed"
];
const expectedBlockerCurrentness = {
  status: "blocked-until-scheduler-root-lanes-and-renderer-hooks-admitted",
  compatibilityTarget: "react@19.2.6",
  startTransitionRootlessCurrent: true,
  publicUseTransitionBlocked: true,
  publicUseDeferredValueBlocked: true,
  schedulerPrerequisitesBlocked: true,
  rootLanePrerequisitesBlocked: true,
  rootSchedulingBlocked: true,
  laneIntegrationBlocked: true,
  hookExecutionCompatibilityBlocked: true,
  publicActBlocked: true,
  publicSchedulerTimingBlocked: true,
  rendererCompatibilityBlocked: true,
  compatibilityClaimed: false
};
const expectedAcceptedTransitionReconcilerRecords = [
  "RootUpdateLaneChoiceRecord",
  "RootUpdateLaneSourcePriority",
  "RootScheduleUpdateRecord",
  "RootTransitionEntanglementRecord",
  "UpdateContainerResult"
];
const expectedUseRefHookNames = ["useRef"];
const expectedUseRefPublicShapeBlockerFields = [
  "hookName",
  "reactSourceFunction",
  "reactDispatcherMethod",
  "reactSourceLength",
  "currentPublicExport",
  "currentName",
  "currentLength",
  "blocker"
];
const expectedUseRefPublicShapeBlockers = [
  {
    hookName: "useRef",
    reactSourceFunction: "ReactHooks.useRef",
    reactDispatcherMethod: "dispatcher.useRef",
    reactSourceLength: 1,
    currentPublicExport: "react.useRef private-dispatcher guarded facade",
    currentName: "",
    currentLength: 1,
    blocker:
      "public export rejects generic dispatcher forwarding until a source-owned private useRef hook dispatcher is admitted"
  }
];
const expectedUseRefSourceReportFieldNames = [
  "kind",
  "version",
  "status",
  "reactSourceTag",
  "reactSourceCommit",
  "reactHooksSource",
  "reactClientSource",
  "reactServerSource",
  "reactReconcilerSource",
  "fastReactSource",
  "reactMountFunction",
  "reactUpdateFunction",
  "dispatcherMethodCurrentInReactSource",
  "publicRootExportCurrent",
  "reactServerExportAbsentCurrent",
  "compatibilityClaimed"
];
const expectedUseRefSourceReport = {
  kind: "fast-react.private.use_ref_hook_source_report",
  version: 1,
  status: "source-current-for-react-19.2.6-useRef-private-dispatcher",
  reactSourceTag: "v19.2.6",
  reactSourceCommit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
  reactHooksSource: "packages/react/src/ReactHooks.js",
  reactClientSource: "packages/react/src/ReactClient.js",
  reactServerSource: "packages/react/src/ReactServer.js",
  reactReconcilerSource: "packages/react-reconciler/src/ReactFiberHooks.js",
  fastReactSource: "packages/react/hook-dispatcher.js",
  reactMountFunction: "mountRef",
  reactUpdateFunction: "updateRef",
  dispatcherMethodCurrentInReactSource: true,
  publicRootExportCurrent: true,
  reactServerExportAbsentCurrent: true,
  compatibilityClaimed: false
};
const expectedUseRefBlockerCurrentnessFieldNames = [
  "status",
  "compatibilityTarget",
  "sourceReportCurrent",
  "publicRootlessInvalidHookBlocked",
  "genericDispatcherForwardingBlocked",
  "privateDispatcherMarkerRequired",
  "cjsSurfaceCurrentnessBlocked",
  "reactServerSurfaceCurrentnessBlocked",
  "schedulerPrerequisitesBlocked",
  "rootLanePrerequisitesBlocked",
  "rootSchedulingBlocked",
  "rendererCompatibilityBlocked",
  "callbackInvocationBlocked",
  "externalStoreInvocationBlocked",
  "idGenerationBlocked",
  "refIdentityCompatibilityClaimed",
  "publicCompatibilityClaimed",
  "compatibilityClaimed"
];
const expectedUseRefBlockerCurrentness = {
  status:
    "blocked-until-private-useRef-dispatcher-root-and-renderer-currentness-admitted",
  compatibilityTarget: "react@19.2.6",
  sourceReportCurrent: true,
  publicRootlessInvalidHookBlocked: true,
  genericDispatcherForwardingBlocked: true,
  privateDispatcherMarkerRequired: true,
  cjsSurfaceCurrentnessBlocked: true,
  reactServerSurfaceCurrentnessBlocked: true,
  schedulerPrerequisitesBlocked: true,
  rootLanePrerequisitesBlocked: true,
  rootSchedulingBlocked: true,
  rendererCompatibilityBlocked: true,
  callbackInvocationBlocked: true,
  externalStoreInvocationBlocked: true,
  idGenerationBlocked: true,
  refIdentityCompatibilityClaimed: false,
  publicCompatibilityClaimed: false,
  compatibilityClaimed: false
};
const expectedUseRefSurfaceCurrentnessFieldNames = [
  "surfaceId",
  "source",
  "entrypoint",
  "moduleShape",
  "sameAsRootExport",
  "hookName",
  "useRefExportPolicy",
  "sourceFunctionCurrent",
  "hasUseRefExport",
  "currentName",
  "currentLength",
  "expectedName",
  "expectedLength",
  "useRefPolicyCurrent",
  "rootlessInvalidHookBlocked",
  "genericDispatcherForwardingBlocked",
  "privateDispatcherRequired",
  "publicCompatibilityClaimed",
  "compatibilityClaimed"
];
const expectedUseRefSurfaceCurrentnessRows = [
  {
    surfaceId: "react-root",
    source: "packages/react/index.js",
    entrypoint: "react",
    moduleShape: "default-root",
    sameAsRootExport: true,
    hookName: "useRef",
    useRefExportPolicy: "available-root-hook",
    sourceFunctionCurrent: true,
    hasUseRefExport: true,
    currentName: "",
    currentLength: 1,
    expectedName: "",
    expectedLength: 1,
    useRefPolicyCurrent: true,
    rootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherRequired: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  },
  {
    surfaceId: "react-cjs-development",
    source: "packages/react/cjs/react.development.js",
    entrypoint: "react",
    moduleShape: "cjs-root-alias",
    sameAsRootExport: true,
    hookName: "useRef",
    useRefExportPolicy: "available-root-hook",
    sourceFunctionCurrent: true,
    hasUseRefExport: true,
    currentName: "",
    currentLength: 1,
    expectedName: "",
    expectedLength: 1,
    useRefPolicyCurrent: true,
    rootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherRequired: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  },
  {
    surfaceId: "react-cjs-production",
    source: "packages/react/cjs/react.production.js",
    entrypoint: "react",
    moduleShape: "cjs-root-alias",
    sameAsRootExport: true,
    hookName: "useRef",
    useRefExportPolicy: "available-root-hook",
    sourceFunctionCurrent: true,
    hasUseRefExport: true,
    currentName: "",
    currentLength: 1,
    expectedName: "",
    expectedLength: 1,
    useRefPolicyCurrent: true,
    rootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherRequired: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  },
  {
    surfaceId: "react-server",
    source: "packages/react/react.react-server.js",
    entrypoint: "react react-server",
    moduleShape: "react-server-root",
    sameAsRootExport: false,
    hookName: "useRef",
    useRefExportPolicy: "absent-react-server-hook",
    sourceFunctionCurrent: true,
    hasUseRefExport: false,
    currentName: null,
    currentLength: null,
    expectedName: null,
    expectedLength: null,
    useRefPolicyCurrent: true,
    rootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherRequired: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  }
];
const expectedUseRefCompatibilityFalseFlags = [
  "compatibilityClaimed",
  "publicCompatibilityClaimed",
  "publicHookCompatibility",
  "exposesPublicHookImplementation",
  "hookExecutionCompatibility",
  "refIdentityCompatibility",
  "refObjectCompatibility",
  "rendererIntegration",
  "rendererCompatibility",
  "publicActIntegration",
  "schedulerIntegration",
  "schedulerPrerequisitesReady",
  "rootLaneIntegration",
  "rootScheduling",
  "rootExecution",
  "callbackExecutionClaimed",
  "externalStoreSubscriptionClaimed",
  "externalStoreSnapshotReadClaimed",
  "idGenerationClaimed",
  "packageCompatibility"
];
const expectedUseRefExecutionSourceReportFieldNames = [
  "kind",
  "version",
  "status",
  "reactSourceTag",
  "reactSourceCommit",
  "reactHooksSource",
  "reactReconcilerSource",
  "fastReactSource",
  "reactHookSourceFunction",
  "reactMountFunction",
  "reactUpdateFunction",
  "mountCreatesRefObject",
  "mountStoresRefObjectInMemoizedState",
  "updateReturnsMemoizedState",
  "updateIgnoresInitialValue",
  "dispatcherMethodCurrentInReactSource",
  "compatibilityClaimed"
];
const expectedUseRefExecutionSourceReport = {
  kind: "fast-react.private.use_ref_hook_execution_source_report",
  version: 1,
  status: "source-current-for-react-19.2.6-useRef-mount-update-ref-identity",
  reactSourceTag: "v19.2.6",
  reactSourceCommit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
  reactHooksSource: "packages/react/src/ReactHooks.js",
  reactReconcilerSource: "packages/react-reconciler/src/ReactFiberHooks.js",
  fastReactSource: "packages/react/hook-dispatcher.js",
  reactHookSourceFunction: "ReactHooks.useRef",
  reactMountFunction: "mountRef",
  reactUpdateFunction: "updateRef",
  mountCreatesRefObject: true,
  mountStoresRefObjectInMemoizedState: true,
  updateReturnsMemoizedState: true,
  updateIgnoresInitialValue: true,
  dispatcherMethodCurrentInReactSource: true,
  compatibilityClaimed: false
};
const expectedUseRefExecutionCallRecordFieldNames = [
  "phase",
  "hookName",
  "callIndex",
  "initialValue",
  "metadataIdentityCurrent",
  "thisMatchesDispatcher",
  "privateDispatcherMarked",
  "returnedRefObject",
  "returnedCurrent",
  "executionErrorCode"
];
const expectedUseRefRefIdentityRecordFieldNames = [
  "mountRefObject",
  "updateRefObject",
  "sourceOwnedRefObject",
  "mountUpdateRefObjectSame",
  "mountCurrentValue",
  "updateCurrentValue",
  "updateInitialValue",
  "updateInitialValueIgnored",
  "callerSuppliedRefObjectAccepted",
  "refIdentityCompatibilityClaimed",
  "refObjectCompatibilityClaimed"
];
const expectedUseRefExecutionEvidenceFieldNames = [
  "kind",
  "version",
  "status",
  "compatibilityTarget",
  "hookNames",
  "sourceReport",
  "currentnessReport",
  "mountCallRecord",
  "updateCallRecord",
  "refIdentityRecord",
  "rootUseRefSourceFunctionCurrent",
  "privateDispatcherMarked",
  "sourceOwnedDispatcherExecution",
  "sourceOwnedRefObject",
  "publicRootlessInvalidHookBlocked",
  "genericDispatcherForwardingBlocked",
  "privateDispatcherRequired",
  "publicRootRenderingBlocked",
  "rootSchedulerIntegrationBlocked",
  "schedulerTimingBlocked",
  "actIntegrationBlocked",
  "rendererCompatibilityBlocked",
  "callbackInvocationBlocked",
  "externalStoreInvocationBlocked",
  "idGenerationBlocked",
  ...expectedUseRefCompatibilityFalseFlags
];
const expectedUseRefRendererLifecycleSourceReportFieldNames = [
  "kind",
  "version",
  "status",
  "reactSourceTag",
  "reactSourceCommit",
  "fastReactSource",
  "privateCurrentnessStatus",
  "privateExecutionEvidenceStatus",
  "rendererRootLifecycleCompatibilityAdmitted",
  "publicUseRefCompatibilityAdmitted",
  "compatibilityClaimed"
];
const expectedUseRefRendererLifecycleSourceReport = {
  kind: "fast-react.private.use_ref_hook_renderer_lifecycle_blocker_source_report",
  version: 1,
  status: "source-current-for-react-19.2.6-useRef-renderer-lifecycle-blockers",
  reactSourceTag: "v19.2.6",
  reactSourceCommit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
  fastReactSource: "packages/react/hook-dispatcher.js",
  privateCurrentnessStatus: "accepted-blocked-private-useRef-hook-currentness",
  privateExecutionEvidenceStatus:
    "accepted-source-owned-private-useRef-execution-evidence",
  rendererRootLifecycleCompatibilityAdmitted: false,
  publicUseRefCompatibilityAdmitted: false,
  compatibilityClaimed: false
};
const expectedUseRefRendererLifecycleBlockerRowFieldNames = [
  "blockerId",
  "acceptedPrivateEvidenceStatus",
  "sourceOwnedPrivateEvidence",
  "missingRendererRootPrerequisite",
  "requiredPublicEvidence",
  "currentBlocked",
  "compatibilityClaimed"
];
const expectedUseRefRendererLifecycleBlockerRows = [
  {
    blockerId: "private-currentness-is-not-public-useRef-compatibility",
    acceptedPrivateEvidenceStatus:
      "accepted-blocked-private-useRef-hook-currentness",
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      "renderer-owned hook dispatcher lifecycle during root render",
    requiredPublicEvidence:
      "root renderWithHooks dispatcher installation and teardown evidence",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: "private-execution-is-not-renderer-ref-object-compatibility",
    acceptedPrivateEvidenceStatus:
      "accepted-source-owned-private-useRef-execution-evidence",
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      "real mutable JavaScript ref object identity through a renderer root",
    requiredPublicEvidence:
      "renderer/root-backed mount and update ref object identity and mutability evidence",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: "dispatcher-lifecycle-not-root-backed",
    acceptedPrivateEvidenceStatus:
      "accepted-source-owned-private-useRef-execution-evidence",
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      "mount/update dispatcher switching owned by a renderer root",
    requiredPublicEvidence:
      "dispatcher lifecycle evidence tied to the current render fiber and root",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: "root-rendering-and-hook-list-rebinding-not-admitted",
    acceptedPrivateEvidenceStatus:
      "accepted-source-owned-private-useRef-execution-evidence",
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      "root rendering, commit handoff, and hook-list rebinding",
    requiredPublicEvidence:
      "HostRoot render/update/commit evidence with current hook-list rebinding",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: "scheduler-and-act-timing-not-admitted",
    acceptedPrivateEvidenceStatus:
      "accepted-source-owned-private-useRef-execution-evidence",
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      "Scheduler timing and public act lifecycle integration",
    requiredPublicEvidence:
      "Scheduler callback timing and act-flush evidence under a public root",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: "adjacent-hooks-and-package-compatibility-not-admitted",
    acceptedPrivateEvidenceStatus:
      "accepted-source-owned-private-useRef-execution-evidence",
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      "callback, external-store, id-generation, and package compatibility",
    requiredPublicEvidence:
      "cross-hook and published package compatibility evidence",
    currentBlocked: true,
    compatibilityClaimed: false
  }
];
const expectedUseRefRendererLifecycleCompatibilityFalseFlags = [
  ...expectedUseRefCompatibilityFalseFlags,
  "realJsRefObjectRendererCompatibility",
  "refObjectMutabilityCompatibility",
  "dispatcherLifecycleCompatibility",
  "rootRenderingCompatibility",
  "schedulerTimingCompatibility",
  "actCompatibility"
];
const expectedUseRefRendererLifecycleReportFieldNames = [
  "kind",
  "version",
  "status",
  "compatibilityTarget",
  "hookNames",
  "sourceReport",
  "privateCurrentnessReport",
  "privateExecutionEvidence",
  "acceptedPrivateCurrentnessStatus",
  "acceptedPrivateExecutionEvidenceStatus",
  "blockerRowFieldNames",
  "blockerRows",
  "rootUseRefSourceFunctionCurrent",
  "privateDispatcherMetadataIdentityCurrent",
  "sourceOwnedPrivateDispatcherExecution",
  "sourceOwnedPrivateRefObject",
  "sourceOwnedPrivateRefObjectFrozen",
  "callerSuppliedRefObjectAccepted",
  "publicUseRefCompatibilityBlocked",
  "rendererRefObjectIdentityBlocked",
  "rendererRefObjectMutabilityBlocked",
  "dispatcherLifecycleBlocked",
  "rootRenderingBlocked",
  "rootCommitHookListRebindingBlocked",
  "rootSchedulerIntegrationBlocked",
  "schedulerTimingBlocked",
  "actIntegrationBlocked",
  "callbackHookCompatibilityBlocked",
  "externalStoreCompatibilityBlocked",
  "idGenerationCompatibilityBlocked",
  "packageCompatibilityBlocked",
  ...expectedUseRefRendererLifecycleCompatibilityFalseFlags
];
const expectedContextHookNames = ["useContext"];
const expectedContextRendererReadinessSourceReportFieldNames = [
  "kind",
  "version",
  "status",
  "reactSourceTag",
  "reactSourceCommit",
  "reactHooksSource",
  "reactClientSource",
  "reactReconcilerSource",
  "fastReactSource",
  "fastReactContextObjectSource",
  "privateDispatcherMetadataCapability",
  "createContextDirectObjectBehaviorAdmitted",
  "privateUseContextProviderReadinessAccepted",
  "publicUseContextCompatibilityAdmitted",
  "compatibilityClaimed"
];
const expectedContextRendererReadinessSourceReport = {
  kind: "fast-react.private.context_hook_renderer_readiness_source_report",
  version: 1,
  status:
    "source-current-for-react-19.2.6-useContext-provider-renderer-blockers",
  reactSourceTag: "v19.2.6",
  reactSourceCommit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
  reactHooksSource: "packages/react/src/ReactHooks.js",
  reactClientSource: "packages/react/src/ReactClient.js",
  reactReconcilerSource:
    "packages/react-reconciler/src/ReactFiberNewContext.js",
  fastReactSource: "packages/react/hook-dispatcher.js",
  fastReactContextObjectSource: "packages/react/context-object.js",
  privateDispatcherMetadataCapability:
    "fast-react.private.context_hook_dispatcher",
  createContextDirectObjectBehaviorAdmitted: true,
  privateUseContextProviderReadinessAccepted: false,
  publicUseContextCompatibilityAdmitted: false,
  compatibilityClaimed: false
};
const expectedContextRendererReadinessRowFieldNames = [
  "rowId",
  "acceptedPrivateEvidence",
  "sourceOwnedEvidence",
  "missingRendererProviderPrerequisite",
  "requiredPublicEvidence",
  "currentBlocked",
  "compatibilityClaimed"
];
const expectedContextRendererReadinessRows = [
  {
    rowId: "context-object-consumption-not-source-owned-renderer-read",
    acceptedPrivateEvidence: "React.createContext direct object oracle",
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      "source-owned context object consumption through renderer-owned Provider state",
    requiredPublicEvidence:
      "useContext reads the nearest Provider value through a renderer root",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: "private-dispatcher-not-root-render-backed",
    acceptedPrivateEvidence: "private context hook dispatcher marker",
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      "renderer-owned dispatcher installation during function component render",
    requiredPublicEvidence:
      "renderWithHooks installs and tears down the context dispatcher for the current fiber",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: "provider-begin-work-not-default-renderer-integrated",
    acceptedPrivateEvidence: "private ContextProvider begin-work handoffs",
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      "default begin-work ContextProvider traversal for public Provider elements",
    requiredPublicEvidence:
      "Provider fibers push values, reconcile children, and unwind in broad renderer trees",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: "context-dependencies-not-renderer-visible",
    acceptedPrivateEvidence: "private context dependency metadata",
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      "fiber-owned context dependency list and propagation lanes",
    requiredPublicEvidence:
      "changed Provider values mark dependent consumers under renderer-visible dependencies",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: "suspense-nested-provider-propagation-not-admitted",
    acceptedPrivateEvidence: "private exact nested-provider canaries",
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      "Suspense, Offscreen, sibling, array, and nested-provider propagation",
    requiredPublicEvidence:
      "broad context propagation remains current across interrupted and nested renderer work",
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: "root-scheduler-package-compatibility-not-admitted",
    acceptedPrivateEvidence: "blocked package-private context diagnostics",
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      "root scheduling, Scheduler timing, act, and package compatibility evidence",
    requiredPublicEvidence:
      "published React surfaces prove useContext/provider compatibility under public roots",
    currentBlocked: true,
    compatibilityClaimed: false
  }
];
const expectedContextRendererReadinessCompatibilityFalseFlags = [
  "compatibilityClaimed",
  "publicCompatibilityClaimed",
  "publicHookCompatibility",
  "exposesPublicHookImplementation",
  "hookExecutionCompatibility",
  "contextObjectConsumptionCompatibility",
  "providerRenderCompatibility",
  "runtimeProviderPropagation",
  "rendererVisiblePropagation",
  "rendererIntegration",
  "rendererCompatibility",
  "publicActIntegration",
  "schedulerIntegration",
  "schedulerPrerequisitesReady",
  "schedulerTimingCompatibility",
  "rootLaneIntegration",
  "rootScheduling",
  "rootExecution",
  "suspenseContextPropagation",
  "packageCompatibility",
  "publicPackageCompatibility"
];
const expectedContextRendererReadinessReportFieldNames = [
  "kind",
  "version",
  "status",
  "compatibilityTarget",
  "hookNames",
  "sourceReport",
  "privateDispatcherMetadata",
  "readinessRowFieldNames",
  "readinessRows",
  "contextObjectRecord",
  "rootUseContextSourceFunctionCurrent",
  "sourceOwnedContextObject",
  "sourceOwnedContextObjectConsumed",
  "callerSuppliedContextObjectAccepted",
  "privateDispatcherMarked",
  "privateDispatcherMetadataIdentityCurrent",
  "sourceOwnedPrivateDispatcher",
  "callerSuppliedDispatcherAccepted",
  "publicUseContextCompatibilityBlocked",
  "contextObjectConsumptionBlocked",
  "providerRendererLifecycleBlocked",
  "contextDependencyPropagationBlocked",
  "rootRendererSchedulingBlocked",
  "schedulerTimingBlocked",
  "actIntegrationBlocked",
  "suspenseContextPropagationBlocked",
  "packageCompatibilityBlocked",
  ...expectedContextRendererReadinessCompatibilityFalseFlags
];
const expectedUnsupportedPlaceholderHookNames = [
  "useActionState",
  "useOptimistic",
  "useSyncExternalStore",
  "useEffectEvent",
  "useId",
  "useDebugValue"
];
const expectedUnsupportedPublicShapeBlockerFields = [
  "hookName",
  "reactSourceFunction",
  "reactDispatcherMethod",
  "reactSourceLength",
  "currentPublicExport",
  "currentName",
  "currentLength",
  "blocker"
];
const expectedUnsupportedPublicShapeBlockers = [
  {
    hookName: "useActionState",
    reactSourceFunction: "ReactHooks.useActionState",
    reactDispatcherMethod: "dispatcher.useActionState",
    reactSourceLength: 3,
    currentPublicExport: "react.useActionState placeholder",
    currentName: "useActionState",
    currentLength: 0,
    blocker:
      "public export remains a createUnimplementedFunction placeholder until action state queues, async action lifecycle, scheduler lanes, and renderer compatibility are admitted"
  },
  {
    hookName: "useOptimistic",
    reactSourceFunction: "ReactHooks.useOptimistic",
    reactDispatcherMethod: "dispatcher.useOptimistic",
    reactSourceLength: 2,
    currentPublicExport: "react.useOptimistic placeholder",
    currentName: "useOptimistic",
    currentLength: 0,
    blocker:
      "public export remains a createUnimplementedFunction placeholder until optimistic state queues, revert lanes, and renderer scheduling are admitted"
  },
  {
    hookName: "useSyncExternalStore",
    reactSourceFunction: "ReactHooks.useSyncExternalStore",
    reactDispatcherMethod: "dispatcher.useSyncExternalStore",
    reactSourceLength: 3,
    currentPublicExport: "react.useSyncExternalStore placeholder",
    currentName: "useSyncExternalStore",
    currentLength: 0,
    blocker:
      "public export remains a createUnimplementedFunction placeholder until external store subscription, snapshot consistency, hydration, and renderer scheduling are admitted"
  },
  {
    hookName: "useEffectEvent",
    reactSourceFunction: "ReactHooks.useEffectEvent",
    reactDispatcherMethod: "dispatcher.useEffectEvent",
    reactSourceLength: 1,
    currentPublicExport: "react.useEffectEvent placeholder",
    currentName: "useEffectEvent",
    currentLength: 0,
    blocker:
      "public export remains a createUnimplementedFunction placeholder until effect-event callback identity and commit-time invocation rules are admitted"
  },
  {
    hookName: "useId",
    reactSourceFunction: "ReactHooks.useId",
    reactDispatcherMethod: "dispatcher.useId",
    reactSourceLength: 0,
    currentPublicExport: "react.useId placeholder",
    currentName: "useId",
    currentLength: 0,
    blocker:
      "public export remains a createUnimplementedFunction placeholder until root tree-id allocation, hydration id prefixes, and renderer output compatibility are admitted"
  },
  {
    hookName: "useDebugValue",
    reactSourceFunction: "ReactHooks.useDebugValue",
    reactDispatcherMethod: "dispatcher.useDebugValue",
    reactSourceLength: 2,
    currentPublicExport: "react.useDebugValue placeholder",
    currentName: "useDebugValue",
    currentLength: 0,
    blocker:
      "public export remains a createUnimplementedFunction placeholder until devtools debug-value formatting and renderer instrumentation are admitted"
  }
];
const expectedUnsupportedSourceReportFieldNames = [
  "kind",
  "version",
  "status",
  "reactSourceTag",
  "reactSourceCommit",
  "reactHooksSource",
  "reactClientSource",
  "reactReconcilerSource",
  "fastReactSource",
  "hookCount",
  "dispatcherMethodsCurrentInReactSource",
  "publicExportsPlaceholderBlocked",
  "compatibilityClaimed"
];
const expectedUnsupportedSourceReport = {
  kind: "fast-react.private.unsupported_placeholder_hook_source_report",
  version: 1,
  status: "source-current-for-react-19.2.6-unsupported-placeholder-hooks",
  reactSourceTag: "v19.2.6",
  reactSourceCommit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
  reactHooksSource: "packages/react/src/ReactHooks.js",
  reactClientSource: "packages/react/src/ReactClient.js",
  reactReconcilerSource: "packages/react-reconciler/src/ReactFiberHooks.js",
  fastReactSource: "packages/react/index.js",
  hookCount: 6,
  dispatcherMethodsCurrentInReactSource: true,
  publicExportsPlaceholderBlocked: true,
  compatibilityClaimed: false
};
const expectedUnsupportedBlockerCurrentnessFieldNames = [
  "status",
  "compatibilityTarget",
  "sourceReportCurrent",
  "publicExportsPlaceholderBlocked",
  "dispatcherRoutingBlocked",
  "dispatcherPrerequisitesBlocked",
  "schedulerPrerequisitesBlocked",
  "rootLanePrerequisitesBlocked",
  "rootSchedulingBlocked",
  "rendererCompatibilityBlocked",
  "callbackInvocationBlocked",
  "externalStoreInvocationBlocked",
  "idGenerationBlocked",
  "debugValueInstrumentationBlocked",
  "publicCompatibilityClaimed",
  "compatibilityClaimed"
];
const expectedUnsupportedBlockerCurrentness = {
  status:
    "blocked-until-dispatcher-scheduler-root-renderer-and-hook-semantics-admitted",
  compatibilityTarget: "react@19.2.6",
  sourceReportCurrent: true,
  publicExportsPlaceholderBlocked: true,
  dispatcherRoutingBlocked: true,
  dispatcherPrerequisitesBlocked: true,
  schedulerPrerequisitesBlocked: true,
  rootLanePrerequisitesBlocked: true,
  rootSchedulingBlocked: true,
  rendererCompatibilityBlocked: true,
  callbackInvocationBlocked: true,
  externalStoreInvocationBlocked: true,
  idGenerationBlocked: true,
  debugValueInstrumentationBlocked: true,
  publicCompatibilityClaimed: false,
  compatibilityClaimed: false
};
const expectedUnsupportedCallbackInvocationReportFieldNames = [
  "useActionStateActionInvocationBlocked",
  "useOptimisticReducerInvocationBlocked",
  "useEffectEventCallbackInvocationBlocked",
  "useDebugValueFormatterInvocationBlocked",
  "invokesActionStateAction",
  "invokesOptimisticReducer",
  "invokesEffectEventCallback",
  "invokesDebugValueFormatter",
  "callbackExecutionClaimed",
  "compatibilityClaimed"
];
const expectedUnsupportedCallbackInvocationReport = {
  useActionStateActionInvocationBlocked: true,
  useOptimisticReducerInvocationBlocked: true,
  useEffectEventCallbackInvocationBlocked: true,
  useDebugValueFormatterInvocationBlocked: true,
  invokesActionStateAction: false,
  invokesOptimisticReducer: false,
  invokesEffectEventCallback: false,
  invokesDebugValueFormatter: false,
  callbackExecutionClaimed: false,
  compatibilityClaimed: false
};
const expectedUnsupportedExternalStoreInvocationReportFieldNames = [
  "subscribeInvocationBlocked",
  "getSnapshotInvocationBlocked",
  "getServerSnapshotInvocationBlocked",
  "invokesSubscribe",
  "invokesGetSnapshot",
  "invokesGetServerSnapshot",
  "externalStoreSubscriptionClaimed",
  "externalStoreSnapshotReadClaimed",
  "compatibilityClaimed"
];
const expectedUnsupportedExternalStoreInvocationReport = {
  subscribeInvocationBlocked: true,
  getSnapshotInvocationBlocked: true,
  getServerSnapshotInvocationBlocked: true,
  invokesSubscribe: false,
  invokesGetSnapshot: false,
  invokesGetServerSnapshot: false,
  externalStoreSubscriptionClaimed: false,
  externalStoreSnapshotReadClaimed: false,
  compatibilityClaimed: false
};
const expectedUnsupportedIdGenerationReportFieldNames = [
  "idGenerationBlocked",
  "treeIdAllocationBlocked",
  "hydrationPrefixBlocked",
  "generatesIds",
  "allocatesTreeIds",
  "claimsHydrationIdPrefix",
  "compatibilityClaimed"
];
const expectedUnsupportedIdGenerationReport = {
  idGenerationBlocked: true,
  treeIdAllocationBlocked: true,
  hydrationPrefixBlocked: true,
  generatesIds: false,
  allocatesTreeIds: false,
  claimsHydrationIdPrefix: false,
  compatibilityClaimed: false
};
const expectedUnsupportedServerAvailableHookNames = [
  "useId",
  "useDebugValue"
];
const expectedUnsupportedServerAbsentHookNames = [
  "useActionState",
  "useOptimistic",
  "useSyncExternalStore",
  "useEffectEvent"
];
const expectedUnsupportedSurfaceCurrentnessFieldNames = [
  "surfaceId",
  "source",
  "entrypoint",
  "moduleShape",
  "sameAsRootExport",
  "hookNames",
  "availableHookNames",
  "absentHookNames",
  "placeholderThrowHookNames",
  "unexpectedReturnHookNames",
  "unexpectedErrorHookNames",
  "probeSideEffectNames",
  "publicExportsPlaceholderOrAbsentBlocked",
  "dispatcherRoutingBlocked",
  "dispatcherPrerequisitesBlocked",
  "rootSchedulingBlocked",
  "callbackInvocationBlocked",
  "externalStoreInvocationBlocked",
  "idGenerationBlocked",
  "debugValueInstrumentationBlocked",
  "publicCompatibilityClaimed",
  "compatibilityClaimed"
];
const expectedUnsupportedSurfaceCurrentnessRows = [
  {
    surfaceId: "react-root",
    source: "packages/react/index.js",
    entrypoint: "react",
    moduleShape: "default-root",
    sameAsRootExport: true,
    hookNames: expectedUnsupportedPlaceholderHookNames,
    availableHookNames: expectedUnsupportedPlaceholderHookNames,
    absentHookNames: [],
    placeholderThrowHookNames: expectedUnsupportedPlaceholderHookNames,
    unexpectedReturnHookNames: [],
    unexpectedErrorHookNames: [],
    probeSideEffectNames: [],
    publicExportsPlaceholderOrAbsentBlocked: true,
    dispatcherRoutingBlocked: true,
    dispatcherPrerequisitesBlocked: true,
    rootSchedulingBlocked: true,
    callbackInvocationBlocked: true,
    externalStoreInvocationBlocked: true,
    idGenerationBlocked: true,
    debugValueInstrumentationBlocked: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  },
  {
    surfaceId: "react-cjs-development",
    source: "packages/react/cjs/react.development.js",
    entrypoint: "react",
    moduleShape: "cjs-root-alias",
    sameAsRootExport: true,
    hookNames: expectedUnsupportedPlaceholderHookNames,
    availableHookNames: expectedUnsupportedPlaceholderHookNames,
    absentHookNames: [],
    placeholderThrowHookNames: expectedUnsupportedPlaceholderHookNames,
    unexpectedReturnHookNames: [],
    unexpectedErrorHookNames: [],
    probeSideEffectNames: [],
    publicExportsPlaceholderOrAbsentBlocked: true,
    dispatcherRoutingBlocked: true,
    dispatcherPrerequisitesBlocked: true,
    rootSchedulingBlocked: true,
    callbackInvocationBlocked: true,
    externalStoreInvocationBlocked: true,
    idGenerationBlocked: true,
    debugValueInstrumentationBlocked: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  },
  {
    surfaceId: "react-cjs-production",
    source: "packages/react/cjs/react.production.js",
    entrypoint: "react",
    moduleShape: "cjs-root-alias",
    sameAsRootExport: true,
    hookNames: expectedUnsupportedPlaceholderHookNames,
    availableHookNames: expectedUnsupportedPlaceholderHookNames,
    absentHookNames: [],
    placeholderThrowHookNames: expectedUnsupportedPlaceholderHookNames,
    unexpectedReturnHookNames: [],
    unexpectedErrorHookNames: [],
    probeSideEffectNames: [],
    publicExportsPlaceholderOrAbsentBlocked: true,
    dispatcherRoutingBlocked: true,
    dispatcherPrerequisitesBlocked: true,
    rootSchedulingBlocked: true,
    callbackInvocationBlocked: true,
    externalStoreInvocationBlocked: true,
    idGenerationBlocked: true,
    debugValueInstrumentationBlocked: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  },
  {
    surfaceId: "react-server",
    source: "packages/react/react.react-server.js",
    entrypoint: "react react-server",
    moduleShape: "react-server-root",
    sameAsRootExport: false,
    hookNames: expectedUnsupportedPlaceholderHookNames,
    availableHookNames: expectedUnsupportedServerAvailableHookNames,
    absentHookNames: expectedUnsupportedServerAbsentHookNames,
    placeholderThrowHookNames: expectedUnsupportedServerAvailableHookNames,
    unexpectedReturnHookNames: [],
    unexpectedErrorHookNames: [],
    probeSideEffectNames: [],
    publicExportsPlaceholderOrAbsentBlocked: true,
    dispatcherRoutingBlocked: true,
    dispatcherPrerequisitesBlocked: true,
    rootSchedulingBlocked: true,
    callbackInvocationBlocked: true,
    externalStoreInvocationBlocked: true,
    idGenerationBlocked: true,
    debugValueInstrumentationBlocked: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  }
];
const expectedUnsupportedMissingDispatcherPrerequisites = [
  "dispatcher.useActionState",
  "dispatcher.useOptimistic",
  "dispatcher.useSyncExternalStore",
  "dispatcher.useEffectEvent",
  "dispatcher.useId",
  "dispatcher.useDebugValue",
  "private unsupported-placeholder hook dispatcher admission marker"
];
const expectedUnsupportedMissingSchedulerPrerequisites = [
  "mountActionState",
  "updateActionState",
  "rerenderActionState",
  "mountOptimistic",
  "updateOptimistic",
  "rerenderOptimistic",
  "mountSyncExternalStore",
  "updateSyncExternalStore",
  "mountEvent",
  "updateEvent",
  "mountId",
  "updateId",
  "mountDebugValue",
  "updateDebugValue"
];
const expectedUnsupportedMissingRootLanePrerequisites = [
  "requestUpdateLane",
  "dispatchOptimisticSetState",
  "dispatchActionState",
  "enqueueConcurrentHookUpdate",
  "scheduleUpdateOnFiber",
  "entangleTransitionUpdate",
  "markSkippedUpdateLanes",
  "getWorkInProgressRoot",
  "pushTreeId"
];
const expectedUnsupportedPublicCompatibilityFalseFlags = [
  "compatibilityClaimed",
  "publicCompatibilityClaimed",
  "publicHookCompatibility",
  "exposesPublicHookImplementation"
];
const expectedUnsupportedPrerequisiteFalseFlags = [
  "dispatcherRouting",
  "dispatcherPrerequisitesReady",
  "schedulerIntegration",
  "schedulerPrerequisitesReady",
  "rootLaneIntegration",
  "rootScheduling",
  "rendererIntegration",
  "rendererCompatibility"
];
const expectedUnsupportedCallbackInvocationFalseFlags = [
  "invokesCallbacks",
  "invokesActionStateAction",
  "invokesOptimisticReducer",
  "invokesEffectEventCallback",
  "invokesDebugValueFormatter",
  "callbackExecutionClaimed"
];
const expectedUnsupportedExternalStoreInvocationFalseFlags = [
  "invokesExternalStoreSubscribe",
  "invokesExternalStoreGetSnapshot",
  "invokesExternalStoreGetServerSnapshot",
  "externalStoreSubscriptionClaimed",
  "externalStoreSnapshotReadClaimed"
];
const expectedUnsupportedIdGenerationFalseFlags = [
  "generatesIds",
  "allocatesTreeIds",
  "claimsHydrationIdPrefix"
];
const expectedUnsupportedCompatibilityFalseFlags = [
  ...expectedUnsupportedPublicCompatibilityFalseFlags,
  ...expectedUnsupportedPrerequisiteFalseFlags,
  ...expectedUnsupportedCallbackInvocationFalseFlags,
  ...expectedUnsupportedExternalStoreInvocationFalseFlags,
  ...expectedUnsupportedIdGenerationFalseFlags
];

test.afterEach(() => {
  hookDispatcher.ReactCurrentDispatcher.current = null;
});

test("private transition-hook dispatcher blockers record public shape and lane prerequisites", () => {
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;

  assert.equal(
    metadata.capability,
    "fast-react.private.transition_hook_dispatcher_blockers"
  );
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.deepEqual(metadata.hookNames, expectedTransitionHookNames);
  assert.deepEqual(
    metadata.publicShapeBlockerFields,
    expectedPublicShapeBlockerFields
  );
  assert.deepEqual(metadata.publicShapeBlockers, expectedPublicShapeBlockers);
  assert.deepEqual(
    metadata.startTransitionPublicRoutingBlockerFields,
    expectedStartTransitionPublicRoutingBlockerFields
  );
  assert.deepEqual(
    metadata.startTransitionPublicRoutingBlocker,
    expectedStartTransitionPublicRoutingBlocker
  );
  assert.deepEqual(
    metadata.transitionActionIdentityFieldNames,
    expectedTransitionActionIdentityFieldNames
  );
  assert.deepEqual(
    metadata.transitionLaneMetadataFieldNames,
    expectedTransitionLaneMetadataFieldNames
  );
  assert.deepEqual(
    metadata.transitionLaneMetadata,
    expectedTransitionLaneMetadata
  );
  assert.deepEqual(
    metadata.transitionPendingStateTupleFieldNames,
    expectedTransitionPendingStateTupleFieldNames
  );
  assert.deepEqual(
    metadata.transitionPendingStateTupleShape,
    expectedTransitionPendingStateTupleShape
  );
  assert.deepEqual(
    metadata.startTransitionRoutingRecordFieldNames,
    expectedStartTransitionRoutingRecordFieldNames
  );
  assert.deepEqual(
    metadata.missingSchedulerPrerequisites,
    expectedMissingSchedulerPrerequisites
  );
  assert.deepEqual(
    metadata.missingRootLanePrerequisites,
    expectedMissingRootLanePrerequisites
  );
  assert.deepEqual(
    metadata.compatibilityFalseFlags,
    expectedCompatibilityFalseFlags
  );
  assert.deepEqual(
    metadata.blockerCurrentnessFieldNames,
    expectedBlockerCurrentnessFieldNames
  );
  assert.deepEqual(metadata.blockerCurrentness, expectedBlockerCurrentness);
  assert.deepEqual(
    metadata.acceptedReconcilerRecords,
    expectedAcceptedTransitionReconcilerRecords
  );

  for (const flagName of expectedCompatibilityFalseFlags) {
    assert.equal(metadata[flagName], false, flagName);
  }

  assert.deepEqual(
    hookDispatcher.transitionHookNames,
    expectedTransitionHookNames
  );
  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcherMetadata(metadata),
    true
  );
  assert.equal(Object.isFrozen(metadata), true);

  for (const value of Object.values(metadata)) {
    if (Array.isArray(value)) {
      assert.equal(Object.isFrozen(value), true);
      for (const item of value) {
        if (item !== null && typeof item === "object") {
          assert.equal(Object.isFrozen(item), true);
        }
      }
    }
  }
  assert.equal(Object.isFrozen(metadata.startTransitionPublicRoutingBlocker), true);
  assert.equal(Object.isFrozen(metadata.transitionLaneMetadata), true);
  assert.equal(Object.isFrozen(metadata.transitionPendingStateTupleShape), true);
  assert.equal(Object.isFrozen(metadata.blockerCurrentness), true);

  assert.equal(React.privateTransitionHookDispatcherMetadata, undefined);
  assert.equal(React.markPrivateTransitionHookDispatcher, undefined);
  assert.equal(
    React.recordPrivateStartTransitionDispatcherRouting,
    undefined
  );
});

test("private useRef hook blockers record source and surface currentness", () => {
  const metadata = hookDispatcher.privateRefHookDispatcherMetadata;

  assert.equal(metadata.capability, "fast-react.private.ref_hook_dispatcher");
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.deepEqual(metadata.hookNames, expectedUseRefHookNames);
  assert.deepEqual(
    metadata.publicShapeBlockerFields,
    expectedUseRefPublicShapeBlockerFields
  );
  assert.deepEqual(
    metadata.publicShapeBlockers,
    expectedUseRefPublicShapeBlockers
  );
  assert.deepEqual(
    metadata.sourceReportFieldNames,
    expectedUseRefSourceReportFieldNames
  );
  assert.deepEqual(metadata.sourceReport, expectedUseRefSourceReport);
  assert.deepEqual(
    metadata.executionSourceReportFieldNames,
    expectedUseRefExecutionSourceReportFieldNames
  );
  assert.deepEqual(
    metadata.executionSourceReport,
    expectedUseRefExecutionSourceReport
  );
  assert.deepEqual(
    metadata.executionEvidenceFieldNames,
    expectedUseRefExecutionEvidenceFieldNames
  );
  assert.deepEqual(
    metadata.executionCallRecordFieldNames,
    expectedUseRefExecutionCallRecordFieldNames
  );
  assert.deepEqual(
    metadata.refIdentityRecordFieldNames,
    expectedUseRefRefIdentityRecordFieldNames
  );
  assert.equal(
    metadata.privateExecutionEvidenceStatus,
    hookDispatcher.useRefHookExecutionEvidenceStatus
  );
  assert.deepEqual(
    metadata.rendererLifecycleBlockerSourceReportFieldNames,
    expectedUseRefRendererLifecycleSourceReportFieldNames
  );
  assert.deepEqual(
    metadata.rendererLifecycleBlockerSourceReport,
    expectedUseRefRendererLifecycleSourceReport
  );
  assert.deepEqual(
    metadata.rendererLifecycleBlockerRowFieldNames,
    expectedUseRefRendererLifecycleBlockerRowFieldNames
  );
  assert.deepEqual(
    metadata.rendererLifecycleBlockerRows,
    expectedUseRefRendererLifecycleBlockerRows
  );
  assert.deepEqual(
    metadata.rendererLifecycleBlockerReportFieldNames,
    expectedUseRefRendererLifecycleReportFieldNames
  );
  assert.equal(
    metadata.rendererLifecycleBlockerStatus,
    hookDispatcher.useRefHookRendererLifecycleBlockerStatus
  );
  assert.deepEqual(
    metadata.rendererLifecycleCompatibilityFalseFlags,
    expectedUseRefRendererLifecycleCompatibilityFalseFlags
  );
  assert.equal(metadata.sourceOwnedPrivateExecutionEvidence, true);
  assert.equal(metadata.callerSuppliedRefObjectsAccepted, false);
  assert.equal(metadata.rowOverridesAccepted, false);
  assert.deepEqual(
    metadata.blockerCurrentnessFieldNames,
    expectedUseRefBlockerCurrentnessFieldNames
  );
  assert.deepEqual(
    metadata.blockerCurrentness,
    expectedUseRefBlockerCurrentness
  );
  assert.deepEqual(
    metadata.surfaceCurrentnessFieldNames,
    expectedUseRefSurfaceCurrentnessFieldNames
  );
  assert.deepEqual(
    metadata.surfaceCurrentnessRows,
    expectedUseRefSurfaceCurrentnessRows
  );
  assert.equal(metadata.cjsSurfaceCurrentnessBlocked, true);
  assert.equal(metadata.reactServerSurfaceCurrentnessBlocked, true);
  assert.deepEqual(
    metadata.compatibilityFalseFlags,
    expectedUseRefCompatibilityFalseFlags
  );

  for (const flagName of expectedUseRefCompatibilityFalseFlags) {
    assert.equal(metadata[flagName], false, flagName);
    assert.equal(
      hookDispatcher.isPrivateRefHookDispatcherMetadata({
        ...metadata,
        [flagName]: true
      }),
      false,
      flagName
    );
  }

  assert.deepEqual(hookDispatcher.useRefHookNames, expectedUseRefHookNames);
  assert.deepEqual(
    hookDispatcher.useRefHookSurfaceCurrentnessFieldNames,
    expectedUseRefSurfaceCurrentnessFieldNames
  );
  assert.deepEqual(
    hookDispatcher.useRefHookSurfaceCurrentnessRows,
    expectedUseRefSurfaceCurrentnessRows
  );
  assert.deepEqual(
    hookDispatcher.useRefHookExecutionSourceReportFieldNames,
    expectedUseRefExecutionSourceReportFieldNames
  );
  assert.deepEqual(
    hookDispatcher.useRefHookExecutionSourceReport,
    expectedUseRefExecutionSourceReport
  );
  assert.deepEqual(
    hookDispatcher.useRefHookExecutionEvidenceFieldNames,
    expectedUseRefExecutionEvidenceFieldNames
  );
  assert.deepEqual(
    hookDispatcher.useRefHookExecutionCallRecordFieldNames,
    expectedUseRefExecutionCallRecordFieldNames
  );
  assert.deepEqual(
    hookDispatcher.useRefHookRefIdentityRecordFieldNames,
    expectedUseRefRefIdentityRecordFieldNames
  );
  assert.deepEqual(
    hookDispatcher.useRefHookRendererLifecycleBlockerSourceReportFieldNames,
    expectedUseRefRendererLifecycleSourceReportFieldNames
  );
  assert.deepEqual(
    hookDispatcher.useRefHookRendererLifecycleBlockerSourceReport,
    expectedUseRefRendererLifecycleSourceReport
  );
  assert.deepEqual(
    hookDispatcher.useRefHookRendererLifecycleBlockerRowFieldNames,
    expectedUseRefRendererLifecycleBlockerRowFieldNames
  );
  assert.deepEqual(
    hookDispatcher.useRefHookRendererLifecycleBlockerRows,
    expectedUseRefRendererLifecycleBlockerRows
  );
  assert.deepEqual(
    hookDispatcher.useRefHookRendererLifecycleBlockerReportFieldNames,
    expectedUseRefRendererLifecycleReportFieldNames
  );
  assert.deepEqual(
    hookDispatcher.useRefHookRendererLifecycleCompatibilityFalseFlags,
    expectedUseRefRendererLifecycleCompatibilityFalseFlags
  );
  assert.equal(
    hookDispatcher.isPrivateRefHookDispatcherMetadata(metadata),
    true
  );
  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(React.privateRefHookDispatcherMetadata, undefined);
  assert.equal(ReactCjsDevelopment.privateRefHookDispatcherMetadata, undefined);
  assert.equal(ReactCjsProduction.privateRefHookDispatcherMetadata, undefined);
  assert.equal(ReactServer.privateRefHookDispatcherMetadata, undefined);
  assert.equal(React.createUseRefHookCurrentnessReport, undefined);
  assert.equal(ReactCjsDevelopment.createUseRefHookCurrentnessReport, undefined);
  assert.equal(ReactCjsProduction.createUseRefHookCurrentnessReport, undefined);
  assert.equal(ReactServer.createUseRefHookCurrentnessReport, undefined);
  assert.equal(React.createUseRefHookExecutionEvidence, undefined);
  assert.equal(ReactCjsDevelopment.createUseRefHookExecutionEvidence, undefined);
  assert.equal(ReactCjsProduction.createUseRefHookExecutionEvidence, undefined);
  assert.equal(ReactServer.createUseRefHookExecutionEvidence, undefined);
  assert.equal(React.createUseRefHookRendererLifecycleBlockerReport, undefined);
  assert.equal(
    ReactCjsDevelopment.createUseRefHookRendererLifecycleBlockerReport,
    undefined
  );
  assert.equal(
    ReactCjsProduction.createUseRefHookRendererLifecycleBlockerReport,
    undefined
  );
  assert.equal(
    ReactServer.createUseRefHookRendererLifecycleBlockerReport,
    undefined
  );
});

test("useRef hook currentness rejects stale source, surface drift, and forged claims", () => {
  const report = hookDispatcher.createUseRefHookCurrentnessReport();

  assert.equal(
    report.kind,
    "fast-react.private.use_ref_hook_currentness"
  );
  assert.equal(report.version, 1);
  assert.equal(report.status, hookDispatcher.useRefHookCurrentnessStatus);
  assert.deepEqual(report.hookNames, expectedUseRefHookNames);
  assert.deepEqual(
    report.publicShapeBlockers,
    expectedUseRefPublicShapeBlockers
  );
  assert.deepEqual(report.sourceReport, expectedUseRefSourceReport);
  assert.deepEqual(
    report.blockerCurrentness,
    expectedUseRefBlockerCurrentness
  );
  assert.deepEqual(
    report.surfaceCurrentnessFieldNames,
    expectedUseRefSurfaceCurrentnessFieldNames
  );
  assert.deepEqual(
    report.surfaceCurrentnessRows,
    expectedUseRefSurfaceCurrentnessRows
  );
  assert.equal(report.cjsSurfaceCurrentnessBlocked, true);
  assert.equal(report.reactServerSurfaceCurrentnessBlocked, true);
  assert.equal(report.publicRootlessInvalidHookBlocked, true);
  assert.equal(report.genericDispatcherForwardingBlocked, true);
  assert.equal(report.privateDispatcherRequired, true);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.hookNames), true);
  assert.equal(Object.isFrozen(report.publicShapeBlockers), true);
  assert.equal(Object.isFrozen(report.sourceReport), true);
  assert.equal(Object.isFrozen(report.blockerCurrentness), true);
  assert.equal(Object.isFrozen(report.surfaceCurrentnessFieldNames), true);
  assert.equal(Object.isFrozen(report.surfaceCurrentnessRows), true);
  for (const row of report.surfaceCurrentnessRows) {
    assert.equal(Object.isFrozen(row), true, row.surfaceId);
  }
  assert.equal(
    hookDispatcher.validateUseRefHookCurrentnessReport(report),
    null
  );
  assert.equal(hookDispatcher.isUseRefHookCurrentnessReport(report), true);

  const consumption = hookDispatcher.consumeUseRefHookCurrentnessReport(report);
  assert.equal(
    consumption.status,
    hookDispatcher.useRefHookCurrentnessConsumptionStatus
  );
  assert.equal(consumption.accepted, true);
  assert.deepEqual(
    consumption.surfaceCurrentnessRows,
    expectedUseRefSurfaceCurrentnessRows
  );
  assert.equal(consumption.cjsSurfaceCurrentnessBlocked, true);
  assert.equal(consumption.reactServerSurfaceCurrentnessBlocked, true);
  assert.equal(consumption.publicRootlessInvalidHookBlocked, true);
  assert.equal(consumption.genericDispatcherForwardingBlocked, true);
  assert.equal(consumption.privateDispatcherRequired, true);
  assert.equal(consumption.dispatcherPrerequisitesReady, false);
  assert.equal(consumption.schedulerPrerequisitesReady, false);
  assert.equal(consumption.rootLaneIntegration, false);
  assert.equal(consumption.rootScheduling, false);
  assert.equal(consumption.rootExecution, false);
  assert.equal(consumption.rendererCompatibility, false);
  assert.equal(consumption.refIdentityCompatibilityClaimed, false);
  assert.equal(consumption.callbackInvocationBlocked, true);
  assert.equal(consumption.externalStoreInvocationBlocked, true);
  assert.equal(consumption.idGenerationBlocked, true);
  assert.equal(consumption.publicCompatibilityClaimed, false);
  assert.equal(consumption.compatibilityClaimed, false);

  assertUseRefCurrentnessRejected(
    Object.freeze({ ...report }),
    "useRef-hook-currentness-source-proof"
  );
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport({
      publicShapeBlockers: [
        {
          ...expectedUseRefPublicShapeBlockers[0],
          currentLength: 2
        }
      ]
    }),
    "useRef-hook-currentness-public-shape"
  );
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport({
      sourceReport: {
        reactSourceCommit: "forged"
      }
    }),
    "useRef-hook-currentness-source-report"
  );
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport({
      blockerCurrentness: {
        genericDispatcherForwardingBlocked: false
      }
    }),
    "useRef-hook-currentness-blocker-currentness"
  );
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport({
      surfaceCurrentnessRowOverrides: {
        "react-server": {
          hasUseRefExport: true
        }
      }
    }),
    "useRef-hook-currentness-surface-currentness-source-proof"
  );
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport({
      surfaceCurrentnessRowOverrides: {
        "react-cjs-development": {
          sameAsRootExport: false
        }
      }
    }),
    "useRef-hook-currentness-surface-currentness-source-proof"
  );
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport({
      surfaceCurrentnessRows: report.surfaceCurrentnessRows
    }),
    "useRef-hook-currentness-surface-currentness-source-proof"
  );
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport({
      surfaceCurrentnessRows: expectedUseRefSurfaceCurrentnessRows.map(
        (row) => ({ ...row })
      )
    }),
    "useRef-hook-currentness-surface-currentness-source-proof"
  );
  let accessorRead = false;
  const accessorOptions = {};
  Object.defineProperty(accessorOptions, "surfaceCurrentnessRows", {
    enumerable: true,
    get() {
      accessorRead = true;
      return report.surfaceCurrentnessRows;
    }
  });
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport(accessorOptions),
    "useRef-hook-currentness-source-proof"
  );
  assert.equal(accessorRead, false);
  const ambiguousProxyOptions = new Proxy(
    {},
    {
      ownKeys() {
        throw new Error("ambiguous useRef options");
      }
    }
  );
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport(ambiguousProxyOptions),
    "useRef-hook-currentness-source-proof"
  );
  assertUseRefCurrentnessRejected(
    hookDispatcher.createUseRefHookCurrentnessReport({
      publicRootlessInvalidHookBlocked: false
    }),
    "useRef-hook-currentness-shape"
  );

  for (const flagName of expectedUseRefCompatibilityFalseFlags) {
    assertUseRefCurrentnessRejected(
      hookDispatcher.createUseRefHookCurrentnessReport({
        [flagName]: true
      }),
      "useRef-hook-currentness-compatibility-or-prerequisite-claim"
    );
  }
});

test("useRef hook currentness rejects same-shaped fake root useRef", () => {
  const originalUseRef = React.useRef;
  const fakeUseRef = function (initialValue) {
    return { current: initialValue };
  };

  Object.defineProperties(fakeUseRef, {
    length: {
      configurable: true,
      value: 1
    },
    name: {
      configurable: true,
      value: ""
    }
  });

  React.useRef = fakeUseRef;

  try {
    assert.equal(React.useRef.name, "");
    assert.equal(React.useRef.length, 1);
    assert.equal(ReactCjsDevelopment.useRef, fakeUseRef);
    assert.equal(ReactCjsProduction.useRef, fakeUseRef);

    const report = hookDispatcher.createUseRefHookCurrentnessReport();
    const rootRow = report.surfaceCurrentnessRows.find(
      (row) => row.surfaceId === "react-root"
    );
    assert.equal(rootRow.sourceFunctionCurrent, false);
    assert.equal(rootRow.rootlessInvalidHookBlocked, false);
    assert.equal(rootRow.genericDispatcherForwardingBlocked, false);
    assert.equal(rootRow.privateDispatcherRequired, false);

    assertUseRefCurrentnessRejected(
      report,
      "useRef-hook-currentness-surface-currentness"
    );

    const inheritedOverrideOptions = Object.create({
      surfaceCurrentnessRowOverrides: Object.fromEntries(
        expectedUseRefSurfaceCurrentnessRows.map((row) => [
          row.surfaceId,
          { ...row }
        ])
      )
    });
    assertUseRefCurrentnessRejected(
      hookDispatcher.createUseRefHookCurrentnessReport(
        inheritedOverrideOptions
      ),
      "useRef-hook-currentness-source-proof"
    );
  } finally {
    React.useRef = originalUseRef;
  }
});

test("private useRef execution evidence records source-owned mount/update ref identity", () => {
  const report = hookDispatcher.createUseRefHookExecutionEvidence();
  const mountRefObject = report.refIdentityRecord.mountRefObject;

  assert.equal(report.kind, "fast-react.private.use_ref_hook_execution_evidence");
  assert.equal(report.version, 1);
  assert.equal(
    report.status,
    hookDispatcher.useRefHookExecutionEvidenceStatus
  );
  assert.equal(report.compatibilityTarget, "react@19.2.6");
  assert.deepEqual(
    Object.keys(report),
    expectedUseRefExecutionEvidenceFieldNames
  );
  assert.deepEqual(report.hookNames, expectedUseRefHookNames);
  assert.deepEqual(report.sourceReport, expectedUseRefExecutionSourceReport);
  assert.equal(
    hookDispatcher.validateUseRefHookCurrentnessReport(report.currentnessReport),
    null
  );
  assert.deepEqual(
    Object.keys(report.mountCallRecord),
    expectedUseRefExecutionCallRecordFieldNames
  );
  assert.deepEqual(
    Object.keys(report.updateCallRecord),
    expectedUseRefExecutionCallRecordFieldNames
  );
  assert.deepEqual(
    Object.keys(report.refIdentityRecord),
    expectedUseRefRefIdentityRecordFieldNames
  );
  assert.equal(report.rootUseRefSourceFunctionCurrent, true);
  assert.equal(report.privateDispatcherMarked, true);
  assert.equal(report.sourceOwnedDispatcherExecution, true);
  assert.equal(report.sourceOwnedRefObject, true);
  assert.equal(report.mountCallRecord.phase, "Mount");
  assert.equal(report.mountCallRecord.hookName, "useRef");
  assert.equal(report.mountCallRecord.callIndex, 0);
  assert.equal(
    report.mountCallRecord.initialValue,
    "fast-react-private-useRef-mount-initial"
  );
  assert.equal(report.mountCallRecord.metadataIdentityCurrent, true);
  assert.equal(report.mountCallRecord.thisMatchesDispatcher, true);
  assert.equal(report.mountCallRecord.privateDispatcherMarked, true);
  assert.equal(report.mountCallRecord.returnedRefObject, mountRefObject);
  assert.equal(
    report.mountCallRecord.returnedCurrent,
    "fast-react-private-useRef-mount-initial"
  );
  assert.equal(report.mountCallRecord.executionErrorCode, null);
  assert.equal(report.updateCallRecord.phase, "Update");
  assert.equal(report.updateCallRecord.hookName, "useRef");
  assert.equal(report.updateCallRecord.callIndex, 1);
  assert.equal(
    report.updateCallRecord.initialValue,
    "fast-react-private-useRef-update-ignored"
  );
  assert.equal(report.updateCallRecord.metadataIdentityCurrent, true);
  assert.equal(report.updateCallRecord.thisMatchesDispatcher, true);
  assert.equal(report.updateCallRecord.privateDispatcherMarked, true);
  assert.equal(report.updateCallRecord.returnedRefObject, mountRefObject);
  assert.equal(
    report.updateCallRecord.returnedCurrent,
    "fast-react-private-useRef-mount-initial"
  );
  assert.equal(report.updateCallRecord.executionErrorCode, null);
  assert.equal(report.refIdentityRecord.updateRefObject, mountRefObject);
  assert.equal(report.refIdentityRecord.sourceOwnedRefObject, true);
  assert.equal(report.refIdentityRecord.mountUpdateRefObjectSame, true);
  assert.equal(
    report.refIdentityRecord.mountCurrentValue,
    "fast-react-private-useRef-mount-initial"
  );
  assert.equal(
    report.refIdentityRecord.updateCurrentValue,
    "fast-react-private-useRef-mount-initial"
  );
  assert.equal(
    report.refIdentityRecord.updateInitialValue,
    "fast-react-private-useRef-update-ignored"
  );
  assert.equal(report.refIdentityRecord.updateInitialValueIgnored, true);
  assert.equal(report.refIdentityRecord.callerSuppliedRefObjectAccepted, false);
  assert.equal(report.refIdentityRecord.refIdentityCompatibilityClaimed, false);
  assert.equal(report.refIdentityRecord.refObjectCompatibilityClaimed, false);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.mountCallRecord), true);
  assert.equal(Object.isFrozen(report.updateCallRecord), true);
  assert.equal(Object.isFrozen(report.refIdentityRecord), true);
  assert.equal(Object.isFrozen(mountRefObject), true);

  for (const flagName of expectedUseRefCompatibilityFalseFlags) {
    assert.equal(report[flagName], false, flagName);
  }

  assert.equal(hookDispatcher.validateUseRefHookExecutionEvidence(report), null);
  assert.equal(hookDispatcher.isUseRefHookExecutionEvidence(report), true);

  const consumption = hookDispatcher.consumeUseRefHookExecutionEvidence(report);
  assert.equal(
    consumption.status,
    hookDispatcher.useRefHookExecutionEvidenceConsumptionStatus
  );
  assert.equal(consumption.accepted, true);
  assert.equal(consumption.mountRefObject, mountRefObject);
  assert.equal(consumption.updateRefObject, mountRefObject);
  assert.equal(consumption.refIdentityStable, true);
  assert.equal(consumption.updateInitialValueIgnored, true);
  assert.equal(consumption.sourceOwnedDispatcherExecution, true);
  assert.equal(consumption.sourceOwnedRefObject, true);
  assert.equal(consumption.currentnessReportAccepted, true);
  assert.equal(consumption.publicRootRenderingBlocked, true);
  assert.equal(consumption.rootSchedulerIntegrationBlocked, true);
  assert.equal(consumption.schedulerTimingBlocked, true);
  assert.equal(consumption.actIntegrationBlocked, true);
  assert.equal(consumption.rendererCompatibilityBlocked, true);
  assert.equal(consumption.callbackInvocationBlocked, true);
  assert.equal(consumption.externalStoreInvocationBlocked, true);
  assert.equal(consumption.idGenerationBlocked, true);
  assert.equal(consumption.publicCompatibilityClaimed, false);
  assert.equal(consumption.compatibilityClaimed, false);

  assert.equal(React.createUseRefHookExecutionEvidence, undefined);
  assert.equal(ReactCjsDevelopment.createUseRefHookExecutionEvidence, undefined);
  assert.equal(ReactCjsProduction.createUseRefHookExecutionEvidence, undefined);
  assert.equal(ReactServer.createUseRefHookExecutionEvidence, undefined);
  assert.equal(React.consumeUseRefHookExecutionEvidence, undefined);
  assert.equal(ReactCjsDevelopment.consumeUseRefHookExecutionEvidence, undefined);
  assert.equal(ReactCjsProduction.consumeUseRefHookExecutionEvidence, undefined);
  assert.equal(ReactServer.consumeUseRefHookExecutionEvidence, undefined);
});

test("private useRef execution evidence rejects forged execution and compatibility claims", () => {
  const report = hookDispatcher.createUseRefHookExecutionEvidence();

  assertUseRefExecutionEvidenceRejected(
    Object.freeze({ ...report }),
    "useRef-hook-execution-source-proof"
  );
  assertUseRefExecutionEvidenceRejected(
    hookDispatcher.createUseRefHookExecutionEvidence({
      dispatcherMetadata: {
        ...hookDispatcher.privateRefHookDispatcherMetadata
      }
    }),
    "useRef-hook-execution-private-execution"
  );
  assertUseRefExecutionEvidenceRejected(
    hookDispatcher.createUseRefHookExecutionEvidence({
      useGenericDispatcher: true
    }),
    "useRef-hook-execution-private-execution"
  );
  assertUseRefExecutionEvidenceRejected(
    hookDispatcher.createUseRefHookExecutionEvidence({
      currentnessReport: hookDispatcher.createUseRefHookCurrentnessReport({
        sourceReport: {
          reactSourceCommit: "forged"
        }
      })
    }),
    "useRef-hook-execution-currentness-report"
  );
  assertUseRefExecutionEvidenceRejected(
    hookDispatcher.createUseRefHookExecutionEvidence({
      refObject: { current: "fast-react-private-useRef-mount-initial" }
    }),
    "useRef-hook-execution-caller-ref-object"
  );
  assertUseRefExecutionEvidenceRejected(
    hookDispatcher.createUseRefHookExecutionEvidence({
      surfaceCurrentnessRowOverrides: {
        "react-root": {
          sourceFunctionCurrent: true
        }
      }
    }),
    "useRef-hook-execution-row-overrides"
  );

  for (const flagName of [
    "publicCompatibilityClaimed",
    "hookExecutionCompatibility",
    "refIdentityCompatibility",
    "packageCompatibility"
  ]) {
    assertUseRefExecutionEvidenceRejected(
      hookDispatcher.createUseRefHookExecutionEvidence({
        [flagName]: true
      }),
      "useRef-hook-execution-compatibility-or-prerequisite-claim"
    );
  }

  for (const prerequisiteSmuggling of [
    { publicRootRenderingBlocked: false },
    { rootExecution: true },
    { rendererCompatibility: true }
  ]) {
    assertUseRefExecutionEvidenceRejected(
      hookDispatcher.createUseRefHookExecutionEvidence(prerequisiteSmuggling),
      "useRef-hook-execution-root-renderer-prerequisite-smuggling"
    );
  }
});

test("private useRef execution evidence rejects same-shaped fake root useRef", () => {
  const originalUseRef = React.useRef;
  const currentnessReport = hookDispatcher.createUseRefHookCurrentnessReport();
  const fakeRefObject = { current: "fast-react-private-useRef-mount-initial" };
  const fakeUseRef = function () {
    return fakeRefObject;
  };

  Object.defineProperties(fakeUseRef, {
    length: {
      configurable: true,
      value: 1
    },
    name: {
      configurable: true,
      value: ""
    }
  });

  React.useRef = fakeUseRef;

  try {
    assert.equal(React.useRef.name, "");
    assert.equal(React.useRef.length, 1);
    assertUseRefExecutionEvidenceRejected(
      hookDispatcher.createUseRefHookExecutionEvidence({
        currentnessReport
      }),
      "useRef-hook-execution-source-function"
    );
  } finally {
    React.useRef = originalUseRef;
  }
});

test("private useRef renderer lifecycle blockers separate private evidence from public compatibility", () => {
  const report = hookDispatcher.createUseRefHookRendererLifecycleBlockerReport();

  assert.equal(
    report.kind,
    "fast-react.private.use_ref_hook_renderer_lifecycle_blockers"
  );
  assert.equal(report.version, 1);
  assert.equal(
    report.status,
    hookDispatcher.useRefHookRendererLifecycleBlockerStatus
  );
  assert.equal(report.compatibilityTarget, "react@19.2.6");
  assert.deepEqual(Object.keys(report), expectedUseRefRendererLifecycleReportFieldNames);
  assert.deepEqual(report.hookNames, expectedUseRefHookNames);
  assert.deepEqual(
    report.sourceReport,
    expectedUseRefRendererLifecycleSourceReport
  );
  assert.equal(
    hookDispatcher.validateUseRefHookCurrentnessReport(
      report.privateCurrentnessReport
    ),
    null
  );
  assert.equal(
    hookDispatcher.validateUseRefHookExecutionEvidence(
      report.privateExecutionEvidence
    ),
    null
  );
  assert.equal(
    report.acceptedPrivateCurrentnessStatus,
    hookDispatcher.useRefHookCurrentnessConsumptionStatus
  );
  assert.equal(
    report.acceptedPrivateExecutionEvidenceStatus,
    hookDispatcher.useRefHookExecutionEvidenceConsumptionStatus
  );
  assert.deepEqual(
    report.blockerRowFieldNames,
    expectedUseRefRendererLifecycleBlockerRowFieldNames
  );
  assert.deepEqual(
    report.blockerRows,
    expectedUseRefRendererLifecycleBlockerRows
  );
  assert.equal(report.rootUseRefSourceFunctionCurrent, true);
  assert.equal(report.privateDispatcherMetadataIdentityCurrent, true);
  assert.equal(report.sourceOwnedPrivateDispatcherExecution, true);
  assert.equal(report.sourceOwnedPrivateRefObject, true);
  assert.equal(report.sourceOwnedPrivateRefObjectFrozen, true);
  assert.equal(report.callerSuppliedRefObjectAccepted, false);
  assert.equal(report.publicUseRefCompatibilityBlocked, true);
  assert.equal(report.rendererRefObjectIdentityBlocked, true);
  assert.equal(report.rendererRefObjectMutabilityBlocked, true);
  assert.equal(report.dispatcherLifecycleBlocked, true);
  assert.equal(report.rootRenderingBlocked, true);
  assert.equal(report.rootCommitHookListRebindingBlocked, true);
  assert.equal(report.rootSchedulerIntegrationBlocked, true);
  assert.equal(report.schedulerTimingBlocked, true);
  assert.equal(report.actIntegrationBlocked, true);
  assert.equal(report.callbackHookCompatibilityBlocked, true);
  assert.equal(report.externalStoreCompatibilityBlocked, true);
  assert.equal(report.idGenerationCompatibilityBlocked, true);
  assert.equal(report.packageCompatibilityBlocked, true);

  for (const flagName of expectedUseRefRendererLifecycleCompatibilityFalseFlags) {
    assert.equal(report[flagName], false, flagName);
  }

  assert.equal(
    hookDispatcher.validateUseRefHookRendererLifecycleBlockerReport(report),
    null
  );
  assert.equal(
    hookDispatcher.isUseRefHookRendererLifecycleBlockerReport(report),
    true
  );

  const consumption =
    hookDispatcher.consumeUseRefHookRendererLifecycleBlockerReport(report);
  assert.equal(
    consumption.status,
    hookDispatcher.useRefHookRendererLifecycleBlockerConsumptionStatus
  );
  assert.equal(consumption.accepted, true);
  assert.deepEqual(
    consumption.blockerRows,
    expectedUseRefRendererLifecycleBlockerRows
  );
  assert.equal(consumption.publicUseRefCompatibilityBlocked, true);
  assert.equal(consumption.rendererRefObjectIdentityBlocked, true);
  assert.equal(consumption.rendererRefObjectMutabilityBlocked, true);
  assert.equal(consumption.dispatcherLifecycleBlocked, true);
  assert.equal(consumption.rootRenderingBlocked, true);
  assert.equal(consumption.schedulerTimingBlocked, true);
  assert.equal(consumption.actIntegrationBlocked, true);
  assert.equal(consumption.callbackHookCompatibilityBlocked, true);
  assert.equal(consumption.externalStoreCompatibilityBlocked, true);
  assert.equal(consumption.idGenerationCompatibilityBlocked, true);
  assert.equal(consumption.packageCompatibilityBlocked, true);
  assert.equal(consumption.publicCompatibilityClaimed, false);
  assert.equal(consumption.compatibilityClaimed, false);

  assert.equal(React.consumeUseRefHookRendererLifecycleBlockerReport, undefined);
  assert.equal(
    ReactCjsDevelopment.consumeUseRefHookRendererLifecycleBlockerReport,
    undefined
  );
  assert.equal(
    ReactCjsProduction.consumeUseRefHookRendererLifecycleBlockerReport,
    undefined
  );
  assert.equal(
    ReactServer.consumeUseRefHookRendererLifecycleBlockerReport,
    undefined
  );
});

test("private useRef renderer lifecycle blockers reject forged public lifecycle claims", () => {
  const report = hookDispatcher.createUseRefHookRendererLifecycleBlockerReport();

  assertUseRefRendererLifecycleRejected(
    Object.freeze({ ...report }),
    "useRef-hook-renderer-lifecycle-source-proof"
  );
  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport({
      sourceReport: {
        reactSourceCommit: "forged"
      }
    }),
    "useRef-hook-renderer-lifecycle-source-report"
  );
  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport({
      blockerRows: expectedUseRefRendererLifecycleBlockerRows.map((row) => ({
        ...row
      }))
    }),
    "useRef-hook-renderer-lifecycle-blocker-rows-source-proof"
  );
  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport({
      blockerRowOverrides: {
        "root-rendering-and-hook-list-rebinding-not-admitted": {
          currentBlocked: false
        }
      }
    }),
    "useRef-hook-renderer-lifecycle-blocker-rows-source-proof"
  );
  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport({
      privateCurrentnessReport: hookDispatcher.createUseRefHookCurrentnessReport({
        sourceReport: {
          reactSourceCommit: "forged"
        }
      })
    }),
    "useRef-hook-renderer-lifecycle-private-currentness-report"
  );
  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport({
      privateExecutionEvidence: hookDispatcher.createUseRefHookExecutionEvidence({
        refObject: { current: "fast-react-private-useRef-mount-initial" }
      })
    }),
    "useRef-hook-renderer-lifecycle-caller-ref-object"
  );
  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport({
      privateExecutionEvidence: hookDispatcher.createUseRefHookExecutionEvidence({
        dispatcherMetadata: {
          ...hookDispatcher.privateRefHookDispatcherMetadata
        }
      })
    }),
    "useRef-hook-renderer-lifecycle-dispatcher-source-identity"
  );

  for (const prerequisiteSmuggling of [
    { rootRenderingBlocked: false },
    { rootSchedulerIntegrationBlocked: false },
    { schedulerTimingBlocked: false },
    { actIntegrationBlocked: false },
    { rootExecution: true },
    { schedulerIntegration: true },
    { publicActIntegration: true }
  ]) {
    assertUseRefRendererLifecycleRejected(
      hookDispatcher.createUseRefHookRendererLifecycleBlockerReport(
        prerequisiteSmuggling
      ),
      "useRef-hook-renderer-lifecycle-prerequisite-smuggling"
    );
  }

  for (const flagName of [
    "publicCompatibilityClaimed",
    "publicHookCompatibility",
    "hookExecutionCompatibility",
    "refIdentityCompatibility",
    "packageCompatibility"
  ]) {
    assertUseRefRendererLifecycleRejected(
      hookDispatcher.createUseRefHookRendererLifecycleBlockerReport({
        [flagName]: true
      }),
      "useRef-hook-renderer-lifecycle-public-compatibility-claim"
    );
  }
});

test("private useRef renderer lifecycle blockers reject hidden caller claims", () => {
  let accessorRead = false;
  const accessorOptions = {};
  Object.defineProperty(accessorOptions, "publicCompatibilityClaimed", {
    enumerable: true,
    get() {
      accessorRead = true;
      return true;
    }
  });

  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport(
      accessorOptions
    ),
    "useRef-hook-renderer-lifecycle-caller-overrides"
  );
  assert.equal(accessorRead, false);

  const symbolClaim = Symbol("publicCompatibilityClaimed");
  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport({
      [symbolClaim]: true
    }),
    "useRef-hook-renderer-lifecycle-caller-overrides"
  );

  const nonEnumerableOptions = {};
  Object.defineProperty(nonEnumerableOptions, "publicCompatibilityClaimed", {
    enumerable: false,
    value: true
  });
  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport(
      nonEnumerableOptions
    ),
    "useRef-hook-renderer-lifecycle-public-compatibility-claim"
  );

  const proxyHiddenOptions = new Proxy(
    {},
    {
      ownKeys() {
        return [];
      },
      getOwnPropertyDescriptor(_target, key) {
        if (key === "publicCompatibilityClaimed") {
          return {
            configurable: true,
            enumerable: true,
            value: true
          };
        }

        return undefined;
      }
    }
  );
  assertUseRefRendererLifecycleRejected(
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport(
      proxyHiddenOptions
    ),
    "useRef-hook-renderer-lifecycle-caller-overrides"
  );
});

test("private useRef renderer lifecycle blockers reject same-shaped fake root useRef", () => {
  const originalUseRef = React.useRef;
  const currentnessReport = hookDispatcher.createUseRefHookCurrentnessReport();
  const fakeRefObject = { current: "fast-react-private-useRef-mount-initial" };
  const fakeUseRef = function () {
    return fakeRefObject;
  };

  Object.defineProperties(fakeUseRef, {
    length: {
      configurable: true,
      value: 1
    },
    name: {
      configurable: true,
      value: ""
    }
  });

  React.useRef = fakeUseRef;

  try {
    assertUseRefRendererLifecycleRejected(
      hookDispatcher.createUseRefHookRendererLifecycleBlockerReport({
        privateExecutionEvidence: hookDispatcher.createUseRefHookExecutionEvidence({
          currentnessReport
        })
      }),
      "useRef-hook-renderer-lifecycle-dispatcher-source-identity"
    );
  } finally {
    React.useRef = originalUseRef;
  }
});

test("private context renderer readiness blockers separate useContext/provider evidence from compatibility", () => {
  const report = hookDispatcher.createContextHookRendererReadinessReport();

  assert.equal(
    report.kind,
    "fast-react.private.context_hook_renderer_readiness_blockers"
  );
  assert.equal(report.version, 1);
  assert.equal(
    report.status,
    hookDispatcher.contextHookRendererReadinessStatus
  );
  assert.equal(report.compatibilityTarget, "react@19.2.6");
  assert.deepEqual(
    Object.keys(report),
    expectedContextRendererReadinessReportFieldNames
  );
  assert.deepEqual(report.hookNames, expectedContextHookNames);
  assert.deepEqual(
    report.sourceReport,
    expectedContextRendererReadinessSourceReport
  );
  assert.equal(
    report.privateDispatcherMetadata,
    hookDispatcher.privateContextHookDispatcherMetadata
  );
  assert.deepEqual(
    report.readinessRowFieldNames,
    expectedContextRendererReadinessRowFieldNames
  );
  assert.deepEqual(
    report.readinessRows,
    expectedContextRendererReadinessRows
  );
  assert.equal(report.rootUseContextSourceFunctionCurrent, true);
  assert.equal(report.sourceOwnedContextObject, true);
  assert.equal(report.sourceOwnedContextObjectConsumed, true);
  assert.equal(report.callerSuppliedContextObjectAccepted, false);
  assert.equal(report.privateDispatcherMarked, true);
  assert.equal(report.privateDispatcherMetadataIdentityCurrent, true);
  assert.equal(report.sourceOwnedPrivateDispatcher, true);
  assert.equal(report.callerSuppliedDispatcherAccepted, false);
  assert.equal(report.contextObjectRecord.sourceOwnedContextObject, true);
  assert.equal(report.contextObjectRecord.providerEqualsContext, true);
  assert.equal(report.contextObjectRecord.consumerContextMatchesContext, true);
  assert.equal(report.contextObjectRecord.contextTypeMatchesReactContextSymbol, true);
  assert.equal(
    report.contextObjectRecord.consumedContextObject,
    report.contextObjectRecord.contextObject
  );
  assert.equal(report.contextObjectRecord.consumedSourceOwnedContextObject, true);
  assert.equal(
    report.contextObjectRecord.readValue,
    "fast-react-private-context-default"
  );
  assert.equal(report.contextObjectRecord.readErrorCode, null);
  assert.equal(report.contextObjectRecord.callerSuppliedContextObjectAccepted, false);
  assert.equal(report.publicUseContextCompatibilityBlocked, true);
  assert.equal(report.contextObjectConsumptionBlocked, true);
  assert.equal(report.providerRendererLifecycleBlocked, true);
  assert.equal(report.contextDependencyPropagationBlocked, true);
  assert.equal(report.rootRendererSchedulingBlocked, true);
  assert.equal(report.schedulerTimingBlocked, true);
  assert.equal(report.actIntegrationBlocked, true);
  assert.equal(report.suspenseContextPropagationBlocked, true);
  assert.equal(report.packageCompatibilityBlocked, true);

  for (const flagName of expectedContextRendererReadinessCompatibilityFalseFlags) {
    assert.equal(report[flagName], false, flagName);
  }

  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.hookNames), true);
  assert.equal(Object.isFrozen(report.sourceReport), true);
  assert.equal(Object.isFrozen(report.readinessRows), true);
  assert.equal(Object.isFrozen(report.contextObjectRecord), true);
  for (const row of report.readinessRows) {
    assert.equal(Object.isFrozen(row), true, row.rowId);
  }

  assert.equal(
    hookDispatcher.validateContextHookRendererReadinessReport(report),
    null
  );
  assert.equal(
    hookDispatcher.isContextHookRendererReadinessReport(report),
    true
  );

  const consumption =
    hookDispatcher.consumeContextHookRendererReadinessReport(report);
  assert.equal(
    consumption.status,
    hookDispatcher.contextHookRendererReadinessConsumptionStatus
  );
  assert.equal(consumption.accepted, true);
  assert.deepEqual(
    consumption.readinessRows,
    expectedContextRendererReadinessRows
  );
  assert.equal(consumption.sourceOwnedContextObject, true);
  assert.equal(consumption.sourceOwnedContextObjectConsumed, true);
  assert.equal(consumption.sourceOwnedPrivateDispatcher, true);
  assert.equal(consumption.publicUseContextCompatibilityBlocked, true);
  assert.equal(consumption.contextObjectConsumptionBlocked, true);
  assert.equal(consumption.providerRendererLifecycleBlocked, true);
  assert.equal(consumption.contextDependencyPropagationBlocked, true);
  assert.equal(consumption.rootRendererSchedulingBlocked, true);
  assert.equal(consumption.schedulerTimingBlocked, true);
  assert.equal(consumption.actIntegrationBlocked, true);
  assert.equal(consumption.suspenseContextPropagationBlocked, true);
  assert.equal(consumption.packageCompatibilityBlocked, true);
  assert.equal(consumption.publicCompatibilityClaimed, false);
  assert.equal(consumption.publicPackageCompatibility, false);
  assert.equal(consumption.compatibilityClaimed, false);

  assert.equal(React.createContextHookRendererReadinessReport, undefined);
  assert.equal(
    ReactCjsDevelopment.createContextHookRendererReadinessReport,
    undefined
  );
  assert.equal(
    ReactCjsProduction.createContextHookRendererReadinessReport,
    undefined
  );
  assert.equal(ReactServer.createContextHookRendererReadinessReport, undefined);
  assert.equal(React.consumeContextHookRendererReadinessReport, undefined);
  assert.equal(
    ReactCjsDevelopment.consumeContextHookRendererReadinessReport,
    undefined
  );
  assert.equal(
    ReactCjsProduction.consumeContextHookRendererReadinessReport,
    undefined
  );
  assert.equal(ReactServer.consumeContextHookRendererReadinessReport, undefined);
});

test("private context renderer readiness rejects forged context and provider claims", () => {
  const report = hookDispatcher.createContextHookRendererReadinessReport();

  assertContextRendererReadinessRejected(
    Object.freeze({ ...report }),
    "context-hook-renderer-readiness-source-proof"
  );
  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport({
      sourceReport: {
        reactSourceCommit: "forged"
      }
    }),
    "context-hook-renderer-readiness-source-report"
  );
  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport({
      privateDispatcherMetadata: {
        ...hookDispatcher.privateContextHookDispatcherMetadata
      }
    }),
    "context-hook-renderer-readiness-dispatcher-source-identity"
  );
  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport({
      readinessRows: expectedContextRendererReadinessRows.map((row) => ({
        ...row
      }))
    }),
    "context-hook-renderer-readiness-provider-rows-source-proof"
  );
  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport({
      readinessRowOverrides: {
        "provider-begin-work-not-default-renderer-integrated": {
          currentBlocked: false
        }
      }
    }),
    "context-hook-renderer-readiness-provider-rows-source-proof"
  );
  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport({
      contextObject: {
        $$typeof: Symbol.for("react.context"),
        _currentValue: "fast-react-private-context-default",
        Provider: null,
        Consumer: null
      }
    }),
    "context-hook-renderer-readiness-caller-context-object"
  );
  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport({
      dispatcher: {
        useContext(context) {
          return context._currentValue;
        }
      }
    }),
    "context-hook-renderer-readiness-caller-dispatcher"
  );

  for (const prerequisiteSmuggling of [
    { rootRendererSchedulingBlocked: false },
    { schedulerTimingBlocked: false },
    { actIntegrationBlocked: false },
    { runtimeProviderPropagation: true },
    { rendererVisiblePropagation: true },
    { schedulerIntegration: true },
    { rootExecution: true },
    { suspenseContextPropagation: true }
  ]) {
    assertContextRendererReadinessRejected(
      hookDispatcher.createContextHookRendererReadinessReport(
        prerequisiteSmuggling
      ),
      "context-hook-renderer-readiness-prerequisite-smuggling"
    );
  }

  for (const flagName of [
    "publicCompatibilityClaimed",
    "publicHookCompatibility",
    "hookExecutionCompatibility",
    "packageCompatibility",
    "publicPackageCompatibility"
  ]) {
    assertContextRendererReadinessRejected(
      hookDispatcher.createContextHookRendererReadinessReport({
        [flagName]: true
      }),
      "context-hook-renderer-readiness-public-compatibility-claim"
    );
  }
});

test("private context renderer readiness rejects stale root useContext reports", () => {
  const report = hookDispatcher.createContextHookRendererReadinessReport();
  const originalUseContext = React.useContext;

  try {
    React.useContext = function replacedUseContext() {
      return "stale-root-use-context";
    };

    assertContextRendererReadinessRejected(
      report,
      "context-hook-renderer-readiness-dispatcher-source-identity"
    );
  } finally {
    React.useContext = originalUseContext;
  }
});

test("private context renderer readiness rejects stale context object mutations", () => {
  for (const [fieldName, mutateContextObject] of [
    [
      "Provider",
      (contextObject) => {
        contextObject.Provider = {
          $$typeof: Symbol.for("react.context"),
          _context: contextObject
        };
      }
    ],
    [
      "Consumer",
      (contextObject) => {
        contextObject.Consumer = {
          $$typeof: Symbol.for("react.consumer"),
          _context: contextObject
        };
      }
    ],
    [
      "$$typeof",
      (contextObject) => {
        contextObject.$$typeof = Symbol.for("react.memo");
      }
    ],
    [
      "_currentValue",
      (contextObject) => {
        contextObject._currentValue = "stale-context-value";
      }
    ]
  ]) {
    const report = hookDispatcher.createContextHookRendererReadinessReport();

    mutateContextObject(report.contextObjectRecord.contextObject);

    assertContextRendererReadinessRejected(
      report,
      "context-hook-renderer-readiness-context-object-source-identity",
      fieldName
    );
  }
});

test("private context renderer readiness rejects hidden caller compatibility aliases", () => {
  let accessorRead = false;
  const accessorOptions = {};
  Object.defineProperty(accessorOptions, "publicCompatibilityClaimed", {
    enumerable: true,
    get() {
      accessorRead = true;
      return true;
    }
  });

  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport(accessorOptions),
    "context-hook-renderer-readiness-caller-overrides"
  );
  assert.equal(accessorRead, false);

  const symbolClaim = Symbol("publicPackageCompatibility");
  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport({
      [symbolClaim]: true
    }),
    "context-hook-renderer-readiness-caller-overrides"
  );

  const nonEnumerableOptions = {};
  Object.defineProperty(nonEnumerableOptions, "publicPackageCompatibility", {
    enumerable: false,
    value: true
  });
  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport(
      nonEnumerableOptions
    ),
    "context-hook-renderer-readiness-public-compatibility-claim"
  );

  const proxyHiddenOptions = new Proxy(
    {},
    {
      ownKeys() {
        return [];
      },
      getOwnPropertyDescriptor(_target, key) {
        if (key === "publicPackageCompatibility") {
          return {
            configurable: true,
            enumerable: true,
            value: true
          };
        }

        return undefined;
      }
    }
  );
  assertContextRendererReadinessRejected(
    hookDispatcher.createContextHookRendererReadinessReport(
      proxyHiddenOptions
    ),
    "context-hook-renderer-readiness-caller-overrides"
  );
});

test("private unsupported placeholder hook blockers record source and currentness reports", () => {
  const metadata =
    hookDispatcher.privateUnsupportedPlaceholderHookBlockerMetadata;

  assert.equal(
    metadata.capability,
    "fast-react.private.unsupported_placeholder_hook_blockers"
  );
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.deepEqual(metadata.hookNames, expectedUnsupportedPlaceholderHookNames);
  assert.deepEqual(
    metadata.publicShapeBlockerFields,
    expectedUnsupportedPublicShapeBlockerFields
  );
  assert.deepEqual(
    metadata.publicShapeBlockers,
    expectedUnsupportedPublicShapeBlockers
  );
  assert.deepEqual(
    metadata.sourceReportFieldNames,
    expectedUnsupportedSourceReportFieldNames
  );
  assert.deepEqual(metadata.sourceReport, expectedUnsupportedSourceReport);
  assert.deepEqual(
    metadata.blockerCurrentnessFieldNames,
    expectedUnsupportedBlockerCurrentnessFieldNames
  );
  assert.deepEqual(
    metadata.blockerCurrentness,
    expectedUnsupportedBlockerCurrentness
  );
  assert.deepEqual(
    metadata.callbackInvocationReportFieldNames,
    expectedUnsupportedCallbackInvocationReportFieldNames
  );
  assert.deepEqual(
    metadata.callbackInvocationReport,
    expectedUnsupportedCallbackInvocationReport
  );
  assert.deepEqual(
    metadata.externalStoreInvocationReportFieldNames,
    expectedUnsupportedExternalStoreInvocationReportFieldNames
  );
  assert.deepEqual(
    metadata.externalStoreInvocationReport,
    expectedUnsupportedExternalStoreInvocationReport
  );
  assert.deepEqual(
    metadata.idGenerationReportFieldNames,
    expectedUnsupportedIdGenerationReportFieldNames
  );
  assert.deepEqual(
    metadata.idGenerationReport,
    expectedUnsupportedIdGenerationReport
  );
  assert.deepEqual(
    metadata.surfaceCurrentnessFieldNames,
    expectedUnsupportedSurfaceCurrentnessFieldNames
  );
  assert.deepEqual(
    metadata.surfaceCurrentnessRows,
    expectedUnsupportedSurfaceCurrentnessRows
  );
  assert.equal(metadata.cjsSurfaceCurrentnessBlocked, true);
  assert.equal(metadata.reactServerSurfaceCurrentnessBlocked, true);
  assert.deepEqual(
    metadata.missingDispatcherPrerequisites,
    expectedUnsupportedMissingDispatcherPrerequisites
  );
  assert.deepEqual(
    metadata.missingSchedulerPrerequisites,
    expectedUnsupportedMissingSchedulerPrerequisites
  );
  assert.deepEqual(
    metadata.missingRootLanePrerequisites,
    expectedUnsupportedMissingRootLanePrerequisites
  );
  assert.deepEqual(
    metadata.publicCompatibilityFalseFlags,
    expectedUnsupportedPublicCompatibilityFalseFlags
  );
  assert.deepEqual(
    metadata.prerequisiteFalseFlags,
    expectedUnsupportedPrerequisiteFalseFlags
  );
  assert.deepEqual(
    metadata.callbackInvocationFalseFlags,
    expectedUnsupportedCallbackInvocationFalseFlags
  );
  assert.deepEqual(
    metadata.externalStoreInvocationFalseFlags,
    expectedUnsupportedExternalStoreInvocationFalseFlags
  );
  assert.deepEqual(
    metadata.idGenerationFalseFlags,
    expectedUnsupportedIdGenerationFalseFlags
  );
  assert.deepEqual(
    metadata.compatibilityFalseFlags,
    expectedUnsupportedCompatibilityFalseFlags
  );

  for (const flagName of expectedUnsupportedCompatibilityFalseFlags) {
    assert.equal(metadata[flagName], false, flagName);
    assert.equal(
      hookDispatcher.isPrivateUnsupportedPlaceholderHookBlockerMetadata({
        ...metadata,
        [flagName]: true
      }),
      false,
      flagName
    );
  }

  assert.deepEqual(
    hookDispatcher.unsupportedPlaceholderHookNames,
    expectedUnsupportedPlaceholderHookNames
  );
  assert.equal(
    hookDispatcher.isPrivateUnsupportedPlaceholderHookBlockerMetadata(
      metadata
    ),
    true
  );
  assert.equal(Object.isFrozen(metadata), true);

  for (const value of Object.values(metadata)) {
    if (Array.isArray(value)) {
      assert.equal(Object.isFrozen(value), true);
      for (const item of value) {
        if (item !== null && typeof item === "object") {
          assert.equal(Object.isFrozen(item), true);
        }
      }
    } else if (value !== null && typeof value === "object") {
      assert.equal(Object.isFrozen(value), true);
    }
  }

  assert.equal(
    React.privateUnsupportedPlaceholderHookBlockerMetadata,
    undefined
  );
  assert.equal(
    ReactCjsDevelopment.privateUnsupportedPlaceholderHookBlockerMetadata,
    undefined
  );
  assert.equal(
    ReactCjsProduction.privateUnsupportedPlaceholderHookBlockerMetadata,
    undefined
  );
  assert.equal(
    ReactServer.privateUnsupportedPlaceholderHookBlockerMetadata,
    undefined
  );
  assert.equal(
    React.createUnsupportedPlaceholderHookCurrentnessReport,
    undefined
  );
  assert.equal(
    ReactCjsDevelopment.createUnsupportedPlaceholderHookCurrentnessReport,
    undefined
  );
  assert.equal(
    ReactCjsProduction.createUnsupportedPlaceholderHookCurrentnessReport,
    undefined
  );
  assert.equal(
    ReactServer.createUnsupportedPlaceholderHookCurrentnessReport,
    undefined
  );
  assert.equal(
    React.consumeUnsupportedPlaceholderHookCurrentnessReport,
    undefined
  );
  assert.equal(
    ReactCjsDevelopment.consumeUnsupportedPlaceholderHookCurrentnessReport,
    undefined
  );
  assert.equal(
    ReactCjsProduction.consumeUnsupportedPlaceholderHookCurrentnessReport,
    undefined
  );
  assert.equal(
    ReactServer.consumeUnsupportedPlaceholderHookCurrentnessReport,
    undefined
  );
});

test("unsupported placeholder hook currentness rejects stale source and forged claims", () => {
  const report =
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport();

  assert.equal(
    report.kind,
    "fast-react.private.unsupported_placeholder_hook_currentness"
  );
  assert.equal(report.version, 1);
  assert.equal(report.status, hookDispatcher.unsupportedPlaceholderHookCurrentnessStatus);
  assert.deepEqual(report.hookNames, expectedUnsupportedPlaceholderHookNames);
  assert.deepEqual(
    report.publicShapeBlockers,
    expectedUnsupportedPublicShapeBlockers
  );
  assert.deepEqual(report.sourceReport, expectedUnsupportedSourceReport);
  assert.deepEqual(
    report.blockerCurrentness,
    expectedUnsupportedBlockerCurrentness
  );
  assert.deepEqual(
    report.callbackInvocationReport,
    expectedUnsupportedCallbackInvocationReport
  );
  assert.deepEqual(
    report.externalStoreInvocationReport,
    expectedUnsupportedExternalStoreInvocationReport
  );
  assert.deepEqual(
    report.idGenerationReport,
    expectedUnsupportedIdGenerationReport
  );
  assert.deepEqual(
    report.surfaceCurrentnessFieldNames,
    expectedUnsupportedSurfaceCurrentnessFieldNames
  );
  assert.deepEqual(
    report.surfaceCurrentnessRows,
    expectedUnsupportedSurfaceCurrentnessRows
  );
  assert.equal(report.cjsSurfaceCurrentnessBlocked, true);
  assert.equal(report.reactServerSurfaceCurrentnessBlocked, true);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.hookNames), true);
  assert.equal(Object.isFrozen(report.publicShapeBlockers), true);
  assert.equal(Object.isFrozen(report.sourceReport), true);
  assert.equal(Object.isFrozen(report.blockerCurrentness), true);
  assert.equal(Object.isFrozen(report.callbackInvocationReport), true);
  assert.equal(Object.isFrozen(report.externalStoreInvocationReport), true);
  assert.equal(Object.isFrozen(report.idGenerationReport), true);
  assert.equal(Object.isFrozen(report.surfaceCurrentnessFieldNames), true);
  assert.equal(Object.isFrozen(report.surfaceCurrentnessRows), true);
  for (const row of report.surfaceCurrentnessRows) {
    assert.equal(Object.isFrozen(row), true, row.surfaceId);
    for (const value of Object.values(row)) {
      if (Array.isArray(value)) {
        assert.equal(Object.isFrozen(value), true, row.surfaceId);
      }
    }
  }
  assert.equal(
    hookDispatcher.validateUnsupportedPlaceholderHookCurrentnessReport(report),
    null
  );
  assert.equal(
    hookDispatcher.isUnsupportedPlaceholderHookCurrentnessReport(report),
    true
  );

  const consumption =
    hookDispatcher.consumeUnsupportedPlaceholderHookCurrentnessReport(report);
  assert.equal(
    consumption.status,
    hookDispatcher.unsupportedPlaceholderHookCurrentnessConsumptionStatus
  );
  assert.equal(consumption.accepted, true);
  assert.deepEqual(
    consumption.surfaceCurrentnessRows,
    expectedUnsupportedSurfaceCurrentnessRows
  );
  assert.equal(consumption.cjsSurfaceCurrentnessBlocked, true);
  assert.equal(consumption.reactServerSurfaceCurrentnessBlocked, true);
  assert.equal(consumption.publicExportsPlaceholderBlocked, true);
  assert.equal(consumption.callbackInvocationBlocked, true);
  assert.equal(consumption.externalStoreInvocationBlocked, true);
  assert.equal(consumption.idGenerationBlocked, true);
  assert.equal(consumption.debugValueInstrumentationBlocked, true);
  assert.equal(consumption.dispatcherPrerequisitesReady, false);
  assert.equal(consumption.schedulerPrerequisitesReady, false);
  assert.equal(consumption.rootLaneIntegration, false);
  assert.equal(consumption.rootScheduling, false);
  assert.equal(consumption.rendererCompatibility, false);
  assert.equal(consumption.publicCompatibilityClaimed, false);
  assert.equal(consumption.compatibilityClaimed, false);

  assertUnsupportedCurrentnessRejected(
    Object.freeze({ ...report }),
    "unsupported-placeholder-hook-currentness-source-proof"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      publicExportsPlaceholderBlocked: true
    }),
    "unsupported-placeholder-hook-currentness-caller-overrides"
  );
  const nonEnumerablePlaceholderOverride = {};
  Object.defineProperty(
    nonEnumerablePlaceholderOverride,
    "publicExportsPlaceholderBlocked",
    {
      configurable: true,
      enumerable: false,
      value: true
    }
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport(
      nonEnumerablePlaceholderOverride
    ),
    "unsupported-placeholder-hook-currentness-caller-overrides"
  );
  const deletingPlaceholderOverride = {};
  Object.defineProperty(
    deletingPlaceholderOverride,
    "publicExportsPlaceholderBlocked",
    {
      configurable: true,
      enumerable: false,
      get() {
        delete deletingPlaceholderOverride.publicExportsPlaceholderBlocked;
        return true;
      }
    }
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport(
      deletingPlaceholderOverride
    ),
    "unsupported-placeholder-hook-currentness-caller-overrides"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport(
      Object.create({ publicExportsPlaceholderBlocked: true })
    ),
    "unsupported-placeholder-hook-currentness-caller-overrides"
  );
  const proxyPlaceholderOverride = new Proxy(
    {},
    {
      ownKeys() {
        return [];
      },
      getOwnPropertyDescriptor() {
        return undefined;
      },
      get(_target, key) {
        return key === "publicExportsPlaceholderBlocked" ? true : undefined;
      }
    }
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport(
      proxyPlaceholderOverride
    ),
    "unsupported-placeholder-hook-currentness-caller-overrides"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      publicShapeBlockers: [
        {
          ...expectedUnsupportedPublicShapeBlockers[0],
          currentLength: 3
        },
        ...expectedUnsupportedPublicShapeBlockers.slice(1)
      ]
    }),
    "unsupported-placeholder-hook-currentness-public-shape"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      sourceReport: {
        reactSourceCommit: "forged"
      }
    }),
    "unsupported-placeholder-hook-currentness-source-report"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      blockerCurrentness: {
        schedulerPrerequisitesBlocked: false
      }
    }),
    "unsupported-placeholder-hook-currentness-blocker-currentness"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      surfaceCurrentnessRowOverrides: {
        "react-root": {
          placeholderThrowHookNames:
            expectedUnsupportedPlaceholderHookNames.slice(1)
        }
      }
    }),
    "unsupported-placeholder-hook-currentness-surface-currentness"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      surfaceCurrentnessRowOverrides: {
        "react-cjs-development": {
          sameAsRootExport: false
        }
      }
    }),
    "unsupported-placeholder-hook-currentness-surface-currentness"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      surfaceCurrentnessRowOverrides: {
        "react-server": {
          availableHookNames: expectedUnsupportedPlaceholderHookNames,
          absentHookNames: []
        }
      }
    }),
    "unsupported-placeholder-hook-currentness-surface-currentness"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      surfaceCurrentnessRowOverrides: {
        "react-cjs-production": {
          publicCompatibilityClaimed: true
        }
      }
    }),
    "unsupported-placeholder-hook-currentness-surface-currentness"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      surfaceCurrentnessRowOverrides: {
        "react-root": {
          callbackInvocationBlocked: "true"
        }
      }
    }),
    "unsupported-placeholder-hook-currentness-surface-currentness"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      surfaceCurrentnessRows: report.surfaceCurrentnessRows
    }),
    "unsupported-placeholder-hook-currentness-surface-currentness-source-proof"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      surfaceCurrentnessRows: report.surfaceCurrentnessRows.map((row) => ({
        ...row,
        hookNames: [...row.hookNames],
        availableHookNames: [...row.availableHookNames],
        absentHookNames: [...row.absentHookNames],
        placeholderThrowHookNames: [...row.placeholderThrowHookNames],
        unexpectedReturnHookNames: [...row.unexpectedReturnHookNames],
        unexpectedErrorHookNames: [...row.unexpectedErrorHookNames],
        probeSideEffectNames: [...row.probeSideEffectNames]
      }))
    }),
    "unsupported-placeholder-hook-currentness-surface-currentness-source-proof"
  );

  for (const flagName of expectedUnsupportedPublicCompatibilityFalseFlags) {
    assertUnsupportedCurrentnessRejected(
      hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
        [flagName]: true
      }),
      "unsupported-placeholder-hook-currentness-public-compatibility-claim"
    );
  }

  for (const flagName of [
    "dispatcherRouting",
    "dispatcherPrerequisitesReady",
    "schedulerIntegration",
    "schedulerPrerequisitesReady",
    "rootLaneIntegration",
    "rootScheduling",
    "rendererCompatibility"
  ]) {
    assertUnsupportedCurrentnessRejected(
      hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
        [flagName]: true
      }),
      "unsupported-placeholder-hook-currentness-prerequisite-smuggling"
    );
  }

  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      invokesCallbacks: "false"
    }),
    "unsupported-placeholder-hook-currentness-callback-invocation-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      callbackInvocationReport: {
        invokesEffectEventCallback: true
      }
    }),
    "unsupported-placeholder-hook-currentness-callback-invocation-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      invokesActionStateAction: true
    }),
    "unsupported-placeholder-hook-currentness-callback-invocation-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      callbackInvocationReport: {
        invokesDebugValueFormatter: "false"
      }
    }),
    "unsupported-placeholder-hook-currentness-callback-invocation-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      externalStoreSnapshotReadClaimed: 0
    }),
    "unsupported-placeholder-hook-currentness-external-store-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      externalStoreInvocationReport: {
        invokesGetSnapshot: true
      }
    }),
    "unsupported-placeholder-hook-currentness-external-store-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      invokesExternalStoreSubscribe: true
    }),
    "unsupported-placeholder-hook-currentness-external-store-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      externalStoreInvocationReport: {
        invokesGetServerSnapshot: "false"
      }
    }),
    "unsupported-placeholder-hook-currentness-external-store-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      generatesIds: "false"
    }),
    "unsupported-placeholder-hook-currentness-id-generation-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      idGenerationReport: {
        generatesIds: true
      }
    }),
    "unsupported-placeholder-hook-currentness-id-generation-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      idGenerationReport: {
        claimsHydrationIdPrefix: "false"
      }
    }),
    "unsupported-placeholder-hook-currentness-id-generation-claim"
  );
  assertUnsupportedCurrentnessRejected(
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport({
      claimsHydrationIdPrefix: true
    }),
    "unsupported-placeholder-hook-currentness-id-generation-claim"
  );
});

test("private hook currentness validators source-proof caller objects before inspection", () => {
  const useRefCurrentness = hookDispatcher.createUseRefHookCurrentnessReport();
  assertUseRefCurrentnessRejected(
    { ...useRefCurrentness },
    "useRef-hook-currentness-source-proof"
  );
  assertHostileReportProxyRejected(
    assertUseRefCurrentnessRejected,
    "useRef-hook-currentness-source-proof",
    "useRef currentness"
  );

  const useRefExecution = hookDispatcher.createUseRefHookExecutionEvidence();
  assertUseRefExecutionEvidenceRejected(
    { ...useRefExecution },
    "useRef-hook-execution-source-proof"
  );
  assertHostileReportProxyRejected(
    assertUseRefExecutionEvidenceRejected,
    "useRef-hook-execution-source-proof",
    "useRef execution"
  );

  const useRefRendererLifecycle =
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport();
  assertUseRefRendererLifecycleRejected(
    { ...useRefRendererLifecycle },
    "useRef-hook-renderer-lifecycle-source-proof"
  );
  assertHostileReportProxyRejected(
    assertUseRefRendererLifecycleRejected,
    "useRef-hook-renderer-lifecycle-source-proof",
    "useRef renderer lifecycle"
  );

  const contextReadiness =
    hookDispatcher.createContextHookRendererReadinessReport();
  assertContextRendererReadinessRejected(
    { ...contextReadiness },
    "context-hook-renderer-readiness-source-proof"
  );
  assertHostileReportProxyRejected(
    assertContextRendererReadinessRejected,
    "context-hook-renderer-readiness-source-proof",
    "context renderer readiness"
  );

  const unsupportedCurrentness =
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport();
  assertUnsupportedCurrentnessRejected(
    { ...unsupportedCurrentness },
    "unsupported-placeholder-hook-currentness-source-proof"
  );
  assertHostileReportProxyRejected(
    assertUnsupportedCurrentnessRejected,
    "unsupported-placeholder-hook-currentness-source-proof",
    "unsupported placeholder currentness"
  );
});

test("private hook currentness validators keep helper-owned mutable reports not-frozen", () => {
  const useRefCurrentness = withObjectFreezeBypassed(() =>
    hookDispatcher.createUseRefHookCurrentnessReport()
  );
  assert.equal(Object.isFrozen(useRefCurrentness), false);
  assertUseRefCurrentnessRejected(
    useRefCurrentness,
    "useRef-hook-currentness-not-frozen"
  );

  const useRefExecution = withObjectFreezeBypassed(() =>
    hookDispatcher.createUseRefHookExecutionEvidence()
  );
  assert.equal(Object.isFrozen(useRefExecution), false);
  assertUseRefExecutionEvidenceRejected(
    useRefExecution,
    "useRef-hook-execution-not-frozen"
  );

  const useRefRendererLifecycle = withObjectFreezeBypassed(() =>
    hookDispatcher.createUseRefHookRendererLifecycleBlockerReport()
  );
  assert.equal(Object.isFrozen(useRefRendererLifecycle), false);
  assertUseRefRendererLifecycleRejected(
    useRefRendererLifecycle,
    "useRef-hook-renderer-lifecycle-not-frozen"
  );

  const contextReadiness = withObjectFreezeBypassed(() =>
    hookDispatcher.createContextHookRendererReadinessReport()
  );
  assert.equal(Object.isFrozen(contextReadiness), false);
  assertContextRendererReadinessRejected(
    contextReadiness,
    "context-hook-renderer-readiness-not-frozen"
  );

  const unsupportedCurrentness = withObjectFreezeBypassed(() =>
    hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport()
  );
  assert.equal(Object.isFrozen(unsupportedCurrentness), false);
  assertUnsupportedCurrentnessRejected(
    unsupportedCurrentness,
    "unsupported-placeholder-hook-currentness-not-frozen"
  );
});

test("unsupported public placeholder hooks do not call dispatcher methods or user callbacks across root surfaces", () => {
  const calls = [];
  const sideEffects = [];
  const defaultSurfaces = [
    ["react-root", React],
    ["react-cjs-development", ReactCjsDevelopment],
    ["react-cjs-production", ReactCjsProduction]
  ];
  const dispatcher = Object.fromEntries(
    expectedUnsupportedPlaceholderHookNames.map((hookName) => [
      hookName,
      function (...args) {
        calls.push([hookName, args]);
        return `return:${hookName}`;
      }
    ])
  );
  const action = () => {
    sideEffects.push("action");
    return "action";
  };
  const reducer = () => {
    sideEffects.push("reducer");
    return "reduced";
  };
  const subscribe = () => {
    sideEffects.push("subscribe");
    return () => sideEffects.push("unsubscribe");
  };
  const getSnapshot = () => {
    sideEffects.push("getSnapshot");
    return "snapshot";
  };
  const getServerSnapshot = () => {
    sideEffects.push("getServerSnapshot");
    return "serverSnapshot";
  };
  const eventCallback = () => {
    sideEffects.push("effectEvent");
  };
  const debugFormatter = () => {
    sideEffects.push("debugFormatter");
    return "debug";
  };
  const scenarios = [
    ["useActionState", [action, "initial", "/permalink"]],
    ["useOptimistic", ["passthrough", reducer]],
    [
      "useSyncExternalStore",
      [subscribe, getSnapshot, getServerSnapshot]
    ],
    ["useEffectEvent", [eventCallback]],
    ["useId", []],
    ["useDebugValue", ["debug-value", debugFormatter]]
  ];

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  for (const [surfaceId, ReactSurface] of defaultSurfaces) {
    for (const [hookName, args] of scenarios) {
      assert.equal(ReactSurface[hookName].name, hookName, surfaceId);
      assert.equal(ReactSurface[hookName].length, 0, surfaceId);
      assertUnimplemented(() => ReactSurface[hookName](...args), {
        exportName: hookName
      });
    }
  }

  assert.equal(ReactCjsDevelopment, React);
  assert.equal(ReactCjsProduction, React);

  for (const hookName of expectedUnsupportedServerAbsentHookNames) {
    assert.equal(Object.hasOwn(ReactServer, hookName), false, hookName);
  }

  for (const [hookName, args] of scenarios.filter(([hookName]) =>
    expectedUnsupportedServerAvailableHookNames.includes(hookName)
  )) {
    assert.equal(ReactServer[hookName].name, hookName);
    assert.equal(ReactServer[hookName].length, 0);
    assertUnimplemented(() => ReactServer[hookName](...args), {
      exportName: hookName
    });
  }

  assert.deepEqual(calls, []);
  assert.deepEqual(sideEffects, []);
});

test("public transition hooks remain placeholder-blocked and do not call an installed dispatcher", () => {
  const calls = [];
  const publicStartTransitionCalls = [];
  const dispatcher = {
    useDeferredValue(value, initialValue) {
      calls.push(["useDeferredValue", value, initialValue]);
      return value;
    },
    useTransition() {
      calls.push(["useTransition"]);
      return [false, () => calls.push(["startTransition"])];
    }
  };

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assert.equal(React.useDeferredValue.name, "useDeferredValue");
  assert.equal(React.useDeferredValue.length, 0);
  assert.equal(React.useTransition.name, "useTransition");
  assert.equal(React.useTransition.length, 0);
  assertUnimplemented(() => React.useDeferredValue("next", "initial"), {
    exportName: "useDeferredValue"
  });
  assertUnimplemented(() => React.useTransition(), {
    exportName: "useTransition"
  });
  React.startTransition(() => {
    publicStartTransitionCalls.push("scope");
  });
  assert.deepEqual(publicStartTransitionCalls, ["scope"]);
  assert.deepEqual(calls, []);
});

test("private transition-hook dispatcher marker rejects blocker metadata drift", () => {
  const calls = [];
  const dispatcher = {
    useDeferredValue(value) {
      calls.push(["useDeferredValue", value]);
      return value;
    },
    useTransition() {
      calls.push(["useTransition"]);
      return [false, () => calls.push(["startTransition"])];
    }
  };
  const driftedMetadata = {
    ...hookDispatcher.privateTransitionHookDispatcherMetadata,
    missingSchedulerPrerequisites: ["requestUpdateLane"]
  };

  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.markPrivateTransitionHookDispatcher(
        dispatcher,
        driftedMetadata
      ),
    "useTransition"
  );
  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcher(dispatcher),
    false
  );
  assert.deepEqual(calls, []);
});

test("private transition-hook dispatcher marker rejects forged blocker currentness metadata", () => {
  const calls = [];
  const dispatcher = {
    useDeferredValue(value) {
      calls.push(["useDeferredValue", value]);
      return value;
    },
    useTransition() {
      calls.push(["useTransition"]);
      return [false, () => calls.push(["startTransition"])];
    }
  };
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;
  const forgedMetadata = {
    ...metadata,
    blockerCurrentness: {
      ...metadata.blockerCurrentness,
      schedulerPrerequisitesBlocked: false
    }
  };

  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcherMetadata(forgedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.markPrivateTransitionHookDispatcher(
        dispatcher,
        forgedMetadata
      ),
    "useTransition"
  );
  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcher(dispatcher),
    false
  );
  assert.deepEqual(calls, []);
});

test("private transition-hook metadata rejects compatibility flags flipped true", () => {
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;
  const dispatcher = {
    useDeferredValue(value) {
      return value;
    },
    useTransition() {
      return [false, () => {}];
    }
  };

  for (const flagName of expectedCompatibilityFalseFlags) {
    const forgedMetadata = {
      ...metadata,
      [flagName]: true
    };

    assert.equal(
      hookDispatcher.isPrivateTransitionHookDispatcherMetadata(forgedMetadata),
      false,
      flagName
    );
  }

  assertInvalidHookCall(
    () =>
      hookDispatcher.markPrivateTransitionHookDispatcher(
        dispatcher,
        {
          ...metadata,
          schedulerIntegration: true
        }
      ),
    "useTransition"
  );
  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcher(dispatcher),
    false
  );
});

test("private transition-hook dispatcher marker records diagnostics without executing hooks", () => {
  const calls = [];
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;
  const dispatcher = {
    useDeferredValue(value, initialValue, receivedMetadata) {
      calls.push(["useDeferredValue", value, initialValue, receivedMetadata]);
      return value;
    },
    useTransition(receivedMetadata) {
      calls.push(["useTransition", receivedMetadata]);
      return [false, () => calls.push(["startTransition"])];
    }
  };

  assert.equal(
    hookDispatcher.markPrivateTransitionHookDispatcher(dispatcher, metadata),
    dispatcher
  );
  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcher(dispatcher),
    true
  );
  assert.equal(
    hookDispatcher.getPrivateTransitionHookDispatcherMetadata(dispatcher),
    metadata
  );
  assert.deepEqual(calls, []);
});

test("private startTransition routing rejects missing or unmarked dispatcher context", () => {
  const calls = [];
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;
  const transitionAction = () => calls.push(["transitionAction"]);

  assertInvalidHookCall(
    () =>
      hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
        transitionAction,
        metadata
      ),
    "useTransition"
  );

  const dispatcher = {
    useDeferredValue(value) {
      calls.push(["useDeferredValue", value]);
      return value;
    },
    useTransition() {
      calls.push(["useTransition"]);
      return [false, () => calls.push(["startTransition"])];
    }
  };

  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  assertInvalidHookCall(
    () =>
      hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
        transitionAction,
        metadata
      ),
    "useTransition"
  );
  assert.deepEqual(calls, []);
});

test("private startTransition routing rejects stale transition metadata and unsupported callbacks", () => {
  const calls = [];
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;
  const dispatcher = {
    useDeferredValue(value) {
      calls.push(["useDeferredValue", value]);
      return value;
    },
    useTransition() {
      calls.push(["useTransition"]);
      return [false, () => calls.push(["startTransition"])];
    }
  };

  hookDispatcher.markPrivateTransitionHookDispatcher(dispatcher, metadata);
  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  const driftedMetadata = {
    ...metadata,
    transitionLaneMetadata: {
      ...metadata.transitionLaneMetadata,
      laneChoiceSourcePriority: "RootUpdateLaneSourcePriority::DefaultEventPriority"
    }
  };

  assert.equal(
    hookDispatcher.isPrivateTransitionHookDispatcherMetadata(driftedMetadata),
    false
  );
  assertInvalidHookCall(
    () =>
      hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
        () => calls.push(["transitionAction"]),
        driftedMetadata
      ),
    "useTransition"
  );

  for (const callback of [undefined, null, 42, "scope", {}, { then() {} }]) {
    assertUnsupportedTransitionCallback(
      () =>
        hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
          callback,
          metadata
        ),
      "startTransition"
    );
  }

  assert.deepEqual(calls, []);
});

test("private startTransition routing records action identity and blocked lane execution", () => {
  const calls = [];
  const metadata = hookDispatcher.privateTransitionHookDispatcherMetadata;
  const dispatcher = {
    useDeferredValue(value, initialValue, receivedMetadata) {
      calls.push(["useDeferredValue", value, initialValue, receivedMetadata]);
      return value;
    },
    useTransition(receivedMetadata) {
      calls.push(["useTransition", receivedMetadata]);
      return [false, () => calls.push(["startTransition"])];
    }
  };
  function transitionAction(first, second) {
    calls.push(["transitionAction", first, second]);
  }

  hookDispatcher.markPrivateTransitionHookDispatcher(dispatcher, metadata);
  hookDispatcher.ReactCurrentDispatcher.current = dispatcher;

  const record = hookDispatcher.recordPrivateStartTransitionDispatcherRouting(
    transitionAction,
    metadata
  );

  assert.equal(Object.isFrozen(record), true);
  assert.deepEqual(
    Object.keys(record),
    expectedStartTransitionRoutingRecordFieldNames
  );
  assert.equal(record.dispatcher, dispatcher);
  assert.equal(record.action, transitionAction);
  assert.equal(record.actionName, "transitionAction");
  assert.equal(record.actionLength, 2);
  assert.equal(record.metadata, metadata);
  assert.equal(record.laneMetadata, metadata.transitionLaneMetadata);
  assert.equal(
    record.pendingStateTupleShape,
    metadata.transitionPendingStateTupleShape
  );
  assert.equal(record.schedulerExecutionBlocked, true);
  assert.equal(record.rootSchedulingBlocked, true);
  assert.equal(record.rootExecutionBlocked, true);
  assert.equal(record.callbackExecutionBlocked, true);
  assert.equal(record.publicStartTransitionDispatcherRouting, false);
  assert.equal(record.compatibilityClaimed, false);
  assert.deepEqual(calls, []);
});

function assertContextRendererReadinessRejected(
  report,
  reason,
  message = reason
) {
  assert.equal(
    hookDispatcher.validateContextHookRendererReadinessReport(report),
    reason,
    message
  );
  assert.equal(
    hookDispatcher.isContextHookRendererReadinessReport(report),
    false,
    message
  );
  assert.throws(
    () => hookDispatcher.consumeContextHookRendererReadinessReport(report),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", reason);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", reason);
      assert.equal(error.entrypoint, "react", reason);
      assert.equal(error.exportName, "contextHookRendererReadiness", reason);
      assert.equal(error.compatibilityTarget, "react@19.2.6", reason);
      assert.equal(error.reason, reason);
      assert.equal(error.publicUseContextCompatibilityBlocked, true, reason);
      assert.equal(error.contextObjectConsumptionBlocked, true, reason);
      assert.equal(error.providerRendererLifecycleBlocked, true, reason);
      assert.equal(error.contextDependencyPropagationBlocked, true, reason);
      assert.equal(error.rootRendererSchedulingBlocked, true, reason);
      assert.equal(error.schedulerTimingBlocked, true, reason);
      assert.equal(error.actIntegrationBlocked, true, reason);
      assert.equal(error.suspenseContextPropagationBlocked, true, reason);
      assert.equal(error.packageCompatibilityBlocked, true, reason);
      assert.equal(error.publicCompatibilityClaimed, false, reason);
      assert.equal(error.publicHookCompatibility, false, reason);
      assert.equal(error.exposesPublicHookImplementation, false, reason);
      assert.equal(error.hookExecutionCompatibility, false, reason);
      assert.equal(error.contextObjectConsumptionCompatibility, false, reason);
      assert.equal(error.providerRenderCompatibility, false, reason);
      assert.equal(error.runtimeProviderPropagation, false, reason);
      assert.equal(error.rendererVisiblePropagation, false, reason);
      assert.equal(error.rendererCompatibility, false, reason);
      assert.equal(error.schedulerIntegration, false, reason);
      assert.equal(error.schedulerPrerequisitesReady, false, reason);
      assert.equal(error.schedulerTimingCompatibility, false, reason);
      assert.equal(error.rootLaneIntegration, false, reason);
      assert.equal(error.rootScheduling, false, reason);
      assert.equal(error.rootExecution, false, reason);
      assert.equal(error.suspenseContextPropagation, false, reason);
      assert.equal(error.packageCompatibility, false, reason);
      assert.equal(error.publicPackageCompatibility, false, reason);
      assert.equal(error.compatibilityClaimed, false, reason);
      return true;
    },
    reason
  );
}

function assertHostileReportProxyRejected(assertRejected, reason, label) {
  const hostile = createHostileReportProxy(label);
  assertRejected(hostile.report, reason);
  assert.equal(hostile.getTrapCalls(), 0, label);
}

function createHostileReportProxy(label) {
  let trapCalls = 0;
  const trap = () => {
    trapCalls += 1;
    throw new Error(`${label} inspected before source proof`);
  };

  return {
    report: new Proxy(
      {},
      {
        get: trap,
        getOwnPropertyDescriptor: trap,
        getPrototypeOf: trap,
        isExtensible: trap,
        ownKeys: trap
      }
    ),
    getTrapCalls() {
      return trapCalls;
    }
  };
}

function withObjectFreezeBypassed(callback) {
  const originalFreeze = Object.freeze;
  Object.freeze = (value) => value;

  try {
    return callback();
  } finally {
    Object.freeze = originalFreeze;
  }
}

function assertUseRefExecutionEvidenceRejected(report, reason) {
  assert.equal(
    hookDispatcher.validateUseRefHookExecutionEvidence(report),
    reason
  );
  assert.equal(hookDispatcher.isUseRefHookExecutionEvidence(report), false);
  assert.throws(
    () => hookDispatcher.consumeUseRefHookExecutionEvidence(report),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", reason);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", reason);
      assert.equal(error.entrypoint, "react", reason);
      assert.equal(
        error.exportName,
        "useRefHookExecutionEvidence",
        reason
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6", reason);
      assert.equal(error.reason, reason);
      assert.equal(error.publicCompatibilityClaimed, false, reason);
      assert.equal(error.publicHookCompatibility, false, reason);
      assert.equal(error.exposesPublicHookImplementation, false, reason);
      assert.equal(error.hookExecutionCompatibility, false, reason);
      assert.equal(error.refIdentityCompatibility, false, reason);
      assert.equal(error.refObjectCompatibility, false, reason);
      assert.equal(error.rendererCompatibility, false, reason);
      assert.equal(error.schedulerIntegration, false, reason);
      assert.equal(error.rootLaneIntegration, false, reason);
      assert.equal(error.rootScheduling, false, reason);
      assert.equal(error.rootExecution, false, reason);
      assert.equal(error.callbackExecutionClaimed, false, reason);
      assert.equal(error.externalStoreSubscriptionClaimed, false, reason);
      assert.equal(error.externalStoreSnapshotReadClaimed, false, reason);
      assert.equal(error.idGenerationClaimed, false, reason);
      assert.equal(error.packageCompatibility, false, reason);
      assert.equal(error.compatibilityClaimed, false, reason);
      return true;
    },
    reason
  );
}

function assertUseRefRendererLifecycleRejected(report, reason) {
  assert.equal(
    hookDispatcher.validateUseRefHookRendererLifecycleBlockerReport(report),
    reason
  );
  assert.equal(
    hookDispatcher.isUseRefHookRendererLifecycleBlockerReport(report),
    false
  );
  assert.throws(
    () => hookDispatcher.consumeUseRefHookRendererLifecycleBlockerReport(report),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", reason);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", reason);
      assert.equal(error.entrypoint, "react", reason);
      assert.equal(
        error.exportName,
        "useRefHookRendererLifecycleBlockers",
        reason
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6", reason);
      assert.equal(error.reason, reason);
      assert.equal(error.publicUseRefCompatibilityBlocked, true, reason);
      assert.equal(error.rendererRefObjectIdentityBlocked, true, reason);
      assert.equal(error.rendererRefObjectMutabilityBlocked, true, reason);
      assert.equal(error.dispatcherLifecycleBlocked, true, reason);
      assert.equal(error.rootRenderingBlocked, true, reason);
      assert.equal(error.schedulerTimingBlocked, true, reason);
      assert.equal(error.actIntegrationBlocked, true, reason);
      assert.equal(error.publicCompatibilityClaimed, false, reason);
      assert.equal(error.publicHookCompatibility, false, reason);
      assert.equal(error.exposesPublicHookImplementation, false, reason);
      assert.equal(error.hookExecutionCompatibility, false, reason);
      assert.equal(error.refIdentityCompatibility, false, reason);
      assert.equal(error.refObjectCompatibility, false, reason);
      assert.equal(error.rendererCompatibility, false, reason);
      assert.equal(error.schedulerIntegration, false, reason);
      assert.equal(error.rootLaneIntegration, false, reason);
      assert.equal(error.rootScheduling, false, reason);
      assert.equal(error.rootExecution, false, reason);
      assert.equal(error.callbackExecutionClaimed, false, reason);
      assert.equal(error.externalStoreSubscriptionClaimed, false, reason);
      assert.equal(error.externalStoreSnapshotReadClaimed, false, reason);
      assert.equal(error.idGenerationClaimed, false, reason);
      assert.equal(error.packageCompatibility, false, reason);
      assert.equal(error.compatibilityClaimed, false, reason);
      return true;
    },
    reason
  );
}

function assertUseRefCurrentnessRejected(report, reason) {
  assert.equal(
    hookDispatcher.validateUseRefHookCurrentnessReport(report),
    reason
  );
  assert.equal(hookDispatcher.isUseRefHookCurrentnessReport(report), false);
  assert.throws(
    () => hookDispatcher.consumeUseRefHookCurrentnessReport(report),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", reason);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", reason);
      assert.equal(error.entrypoint, "react", reason);
      assert.equal(error.exportName, "useRefHookCurrentness", reason);
      assert.equal(error.compatibilityTarget, "react@19.2.6", reason);
      assert.equal(error.reason, reason);
      assert.equal(error.publicCompatibilityClaimed, false, reason);
      assert.equal(error.publicHookCompatibility, false, reason);
      assert.equal(error.exposesPublicHookImplementation, false, reason);
      assert.equal(error.hookExecutionCompatibility, false, reason);
      assert.equal(error.refIdentityCompatibility, false, reason);
      assert.equal(error.rendererCompatibility, false, reason);
      assert.equal(error.schedulerIntegration, false, reason);
      assert.equal(error.rootLaneIntegration, false, reason);
      assert.equal(error.rootScheduling, false, reason);
      assert.equal(error.callbackExecutionClaimed, false, reason);
      assert.equal(error.externalStoreSubscriptionClaimed, false, reason);
      assert.equal(error.externalStoreSnapshotReadClaimed, false, reason);
      assert.equal(error.idGenerationClaimed, false, reason);
      assert.equal(error.packageCompatibility, false, reason);
      assert.equal(error.compatibilityClaimed, false, reason);
      return true;
    },
    reason
  );
}

function assertUnsupportedCurrentnessRejected(report, reason) {
  assert.equal(
    hookDispatcher.validateUnsupportedPlaceholderHookCurrentnessReport(report),
    reason
  );
  assert.equal(
    hookDispatcher.isUnsupportedPlaceholderHookCurrentnessReport(report),
    false
  );
  assert.throws(
    () =>
      hookDispatcher.consumeUnsupportedPlaceholderHookCurrentnessReport(report),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", reason);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", reason);
      assert.equal(error.entrypoint, "react", reason);
      assert.equal(
        error.exportName,
        "unsupportedPlaceholderHookCurrentness",
        reason
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6", reason);
      assert.equal(error.reason, reason);
      assert.equal(error.publicCompatibilityClaimed, false, reason);
      assert.equal(error.publicHookCompatibility, false, reason);
      assert.equal(error.exposesPublicHookImplementation, false, reason);
      assert.equal(error.dispatcherRouting, false, reason);
      assert.equal(error.schedulerIntegration, false, reason);
      assert.equal(error.rootLaneIntegration, false, reason);
      assert.equal(error.rootScheduling, false, reason);
      assert.equal(error.rendererCompatibility, false, reason);
      assert.equal(error.invokesCallbacks, false, reason);
      assert.equal(error.invokesExternalStoreSubscribe, false, reason);
      assert.equal(error.invokesExternalStoreGetSnapshot, false, reason);
      assert.equal(error.invokesExternalStoreGetServerSnapshot, false, reason);
      assert.equal(error.generatesIds, false, reason);
      assert.equal(error.compatibilityClaimed, false, reason);
      return true;
    },
    reason
  );
}

function assertUnimplemented(callback, { exportName }) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", exportName);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", exportName);
      assert.equal(error.entrypoint, "react", exportName);
      assert.equal(error.exportName, exportName, exportName);
      assert.equal(error.compatibilityTarget, "react@19.2.6", exportName);
      assert.match(
        error.message,
        /no React behavior implementation yet/u,
        exportName
      );
      return true;
    },
    exportName
  );
}

function assertInvalidHookCall(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, "Error", label);
      assert.equal(error.code, "FAST_REACT_INVALID_HOOK_CALL", label);
      assert.match(error.message, /Invalid hook call/u, label);
      assert.match(
        error.message,
        /Hooks can only be called inside of the body of a function component/u,
        label
      );
      return true;
    },
    label
  );
}

function assertUnsupportedTransitionCallback(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, "TypeError", label);
      assert.equal(
        error.code,
        "FAST_REACT_UNSUPPORTED_TRANSITION_CALLBACK",
        label
      );
      assert.equal(error.hookName, "useTransition", label);
      assert.equal(error.apiName, "startTransition", label);
      assert.match(
        error.message,
        /requires a callback function/u,
        label
      );
      return true;
    },
    label
  );
}
