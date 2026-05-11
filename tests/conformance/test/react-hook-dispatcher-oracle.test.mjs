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
