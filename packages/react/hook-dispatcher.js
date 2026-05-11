'use strict';

const { createUnimplementedError } = require('./placeholder-utils.js');

const invalidHookCallMessage =
  'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
  ' one of the following reasons:\n' +
  '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
  '2. You might be breaking the Rules of Hooks\n' +
  '3. You might have more than one copy of React in the same app\n' +
  'See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.';

const invalidHookCallErrorCode = 'FAST_REACT_INVALID_HOOK_CALL';

const ReactSharedInternals = {
  H: null
};

const privateEffectHookDispatchers = new WeakSet();
const privateEffectHookDispatcherMetadataByDispatcher = new WeakMap();
const privateStateHookDispatchers = new WeakSet();
const privateStateHookDispatcherMetadataByDispatcher = new WeakMap();
const privateCallbackHookDispatchers = new WeakSet();
const privateCallbackHookDispatcherMetadataByDispatcher = new WeakMap();
const privateMemoHookDispatchers = new WeakSet();
const privateMemoHookDispatcherMetadataByDispatcher = new WeakMap();
const privateContextHookDispatchers = new WeakSet();
const privateContextHookDispatcherMetadataByDispatcher = new WeakMap();
const privateTransitionHookDispatchers = new WeakSet();
const privateTransitionHookDispatcherMetadataByDispatcher = new WeakMap();
const unsupportedPlaceholderHookCurrentnessReports = new WeakSet();
const unsupportedPlaceholderHookSurfaceCurrentnessRowsByReport = new WeakMap();
const unsupportedPlaceholderHookCurrentnessReportOverrideKeys = new WeakMap();

const effectRegistrationFieldNames = Object.freeze([
  'hook',
  'effect',
  'instance',
  'phase',
  'tag',
  'create',
  'dependencies',
  'fiber_flags'
]);
const effectUpdateQueueRecordFieldNames = Object.freeze([
  'update_index',
  'fiber',
  'hook_list',
  'hook',
  'previous_effect',
  'effect',
  'instance',
  'phase',
  'tag',
  'create',
  'destroy',
  'previous_dependencies',
  'dependencies',
  'dependency_status'
]);
const effectDependencyStatusNames = Object.freeze(['Changed', 'Unchanged']);
const hookRenderPhaseNames = Object.freeze(['Mount', 'Update']);
const passiveEffectMetadataFieldNames = Object.freeze([
  'fiber',
  'render_phase',
  'hook_list',
  'effect_index',
  'effect',
  'instance',
  'tag',
  'create',
  'destroy',
  'dependencies',
  'lanes'
]);
const pendingPassiveCommitHandoffFieldNames = Object.freeze([
  'root',
  'fiber',
  'phase',
  'lanes',
  'records'
]);
const pendingPassiveEffectCommitFieldNames = Object.freeze([
  'fiber',
  'effect_index',
  'effect',
  'instance',
  'unmount_order',
  'mount_order'
]);
const pendingPassivePhaseNames = Object.freeze(['Unmount', 'Mount']);
const noPassiveFieldNames = Object.freeze([]);
const noPassivePhaseNames = Object.freeze([]);
const contextReadRecordFieldNames = Object.freeze([
  'read_index',
  'fiber',
  'context',
  'default_value',
  'value',
  'active_provider_count',
  'dependency'
]);
const contextDependencyRecordFieldNames = Object.freeze([
  'handle',
  'fiber',
  'context',
  'memoized_value',
  'read_index',
  'render_read_index',
  'render_lanes',
  'dependency_lanes',
  'next',
  'renderer_visible_propagation',
  'propagation_flags'
]);
const contextPropagationDependencyRecordFieldNames = Object.freeze([
  'dependency',
  'fiber',
  'context',
  'memoized_value',
  'previous_value',
  'next_value',
  'propagation_lanes',
  'previous_dependency_lanes',
  'dependency_lanes',
  'root'
]);
const contextPropagationRecordFieldNames = Object.freeze([
  'render',
  'change',
  'propagation_lanes',
  'scanned_dependency_count',
  'marked_dependencies',
  'roots'
]);
const transitionHookNames = freezeArray(['useDeferredValue', 'useTransition']);
const transitionHookPublicShapeBlockerFields = freezeArray([
  'hookName',
  'expectedName',
  'expectedLength',
  'currentPublicExport',
  'blocker'
]);
const transitionHookPublicShapeBlockers = freezeRecordArray([
  {
    hookName: 'useDeferredValue',
    expectedName: '',
    expectedLength: 2,
    currentPublicExport: 'react.useDeferredValue placeholder',
    blocker:
      'public export remains a createUnimplementedFunction placeholder until deferred value scheduling is admitted'
  },
  {
    hookName: 'useTransition',
    expectedName: '',
    expectedLength: 0,
    currentPublicExport: 'react.useTransition placeholder',
    blocker:
      'public export remains a createUnimplementedFunction placeholder until transition scheduling is admitted'
  }
]);
const transitionStartTransitionPublicRoutingBlockerFields = freezeArray([
  'apiName',
  'currentPublicExport',
  'blocker'
]);
const transitionStartTransitionPublicRoutingBlocker = freezeRecord({
  apiName: 'startTransition',
  currentPublicExport: 'react.startTransition facade',
  blocker:
    'public startTransition does not route through the hook dispatcher, request transition lanes, or schedule root work until transition execution is admitted'
});
const transitionActionIdentityFieldNames = freezeArray([
  'action',
  'actionName',
  'actionLength'
]);
const transitionLaneMetadataFieldNames = freezeArray([
  'laneChoiceRecord',
  'laneChoiceSourcePriority',
  'transitionUpdateLaneClaim',
  'transitionDeferredLaneClaim',
  'scheduleUpdateRecord',
  'entanglementRecord',
  'pendingLanesBeforeEnqueueField',
  'pendingLanesAfterEnqueueField',
  'selectedNextLanesField'
]);
const transitionLaneMetadata = freezeRecord({
  laneChoiceRecord: 'RootUpdateLaneChoiceRecord',
  laneChoiceSourcePriority: 'RootUpdateLaneSourcePriority::TransitionLane',
  transitionUpdateLaneClaim:
    'LaneClaimers.claim_next_transition_update_lane',
  transitionDeferredLaneClaim:
    'LaneClaimers.claim_next_transition_deferred_lane',
  scheduleUpdateRecord: 'RootScheduleUpdateRecord',
  entanglementRecord: 'RootTransitionEntanglementRecord',
  pendingLanesBeforeEnqueueField:
    'UpdateContainerResult.pending_lanes_before_enqueue',
  pendingLanesAfterEnqueueField:
    'UpdateContainerResult.pending_lanes_after_enqueue',
  selectedNextLanesField: 'UpdateContainerResult.selected_next_lanes'
});
const transitionPendingStateTupleFieldNames = freezeArray([
  'tupleKind',
  'tupleLength',
  'pendingStateSlot',
  'startTransitionSlot',
  'initialPendingState',
  'optimisticPendingState',
  'finishedPendingState'
]);
const transitionPendingStateTupleShape = freezeRecord({
  tupleKind: 'useTransition',
  tupleLength: 2,
  pendingStateSlot: 'isPending',
  startTransitionSlot: 'startTransition',
  initialPendingState: false,
  optimisticPendingState: true,
  finishedPendingState: false
});
const startTransitionRoutingRecordFieldNames = freezeArray([
  'dispatcher',
  'action',
  'actionName',
  'actionLength',
  'metadata',
  'laneMetadata',
  'pendingStateTupleShape',
  'schedulerExecutionBlocked',
  'rootSchedulingBlocked',
  'rootExecutionBlocked',
  'callbackExecutionBlocked',
  'publicStartTransitionDispatcherRouting',
  'compatibilityClaimed'
]);
const transitionAcceptedReconcilerRecords = freezeArray([
  'RootUpdateLaneChoiceRecord',
  'RootUpdateLaneSourcePriority',
  'RootScheduleUpdateRecord',
  'RootTransitionEntanglementRecord',
  'UpdateContainerResult'
]);
const transitionHookMissingSchedulerPrerequisites = freezeArray([
  'getCurrentUpdatePriority',
  'setCurrentUpdatePriority',
  'higherEventPriority',
  'requestUpdateLane',
  'requestDeferredLane',
  'dispatchOptimisticSetState',
  'dispatchSetStateInternal',
  'markSkippedUpdateLanes',
  'useThenable'
]);
const transitionHookMissingRootLanePrerequisites = freezeArray([
  'LaneClaimers.claim_next_transition_update_lane',
  'LaneClaimers.claim_next_transition_deferred_lane',
  'RootLaneState.mark_updated',
  'RootLaneState.mark_entangled',
  'UpdateQueueStore.entangle_transition_update'
]);
const transitionHookCompatibilityFalseFlags = freezeArray([
  'compatibilityClaimed',
  'exposesPublicHookImplementation',
  'publicStartTransitionDispatcherRouting',
  'publicUseTransitionImplementation',
  'hookExecutionCompatibility',
  'publicActIntegration',
  'publicSchedulerTimingCompatibility',
  'rendererIntegration',
  'rendererCompatibility',
  'schedulerIntegration',
  'rootLaneIntegration',
  'schedulerExecution',
  'rootScheduling',
  'rootExecution',
  'schedulesTransitionUpdates',
  'schedulesDeferredValueUpdates',
  'executesTransitionCallbacks',
  'returnsPendingState',
  'readsThenables'
]);
const transitionHookBlockerCurrentnessFieldNames = freezeArray([
  'status',
  'compatibilityTarget',
  'startTransitionRootlessCurrent',
  'publicUseTransitionBlocked',
  'publicUseDeferredValueBlocked',
  'schedulerPrerequisitesBlocked',
  'rootLanePrerequisitesBlocked',
  'rootSchedulingBlocked',
  'laneIntegrationBlocked',
  'hookExecutionCompatibilityBlocked',
  'publicActBlocked',
  'publicSchedulerTimingBlocked',
  'rendererCompatibilityBlocked',
  'compatibilityClaimed'
]);
const transitionHookBlockerCurrentness = freezeRecord({
  status: 'blocked-until-scheduler-root-lanes-and-renderer-hooks-admitted',
  compatibilityTarget: 'react@19.2.6',
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
});
const unsupportedPlaceholderHookNames = freezeArray([
  'useActionState',
  'useOptimistic',
  'useSyncExternalStore',
  'useEffectEvent',
  'useId',
  'useDebugValue'
]);
const unsupportedPlaceholderHookPublicShapeBlockerFields = freezeArray([
  'hookName',
  'reactSourceFunction',
  'reactDispatcherMethod',
  'reactSourceLength',
  'currentPublicExport',
  'currentName',
  'currentLength',
  'blocker'
]);
const unsupportedPlaceholderHookPublicShapeBlockers = freezeRecordArray([
  {
    hookName: 'useActionState',
    reactSourceFunction: 'ReactHooks.useActionState',
    reactDispatcherMethod: 'dispatcher.useActionState',
    reactSourceLength: 3,
    currentPublicExport: 'react.useActionState placeholder',
    currentName: 'useActionState',
    currentLength: 0,
    blocker:
      'public export remains a createUnimplementedFunction placeholder until action state queues, async action lifecycle, scheduler lanes, and renderer compatibility are admitted'
  },
  {
    hookName: 'useOptimistic',
    reactSourceFunction: 'ReactHooks.useOptimistic',
    reactDispatcherMethod: 'dispatcher.useOptimistic',
    reactSourceLength: 2,
    currentPublicExport: 'react.useOptimistic placeholder',
    currentName: 'useOptimistic',
    currentLength: 0,
    blocker:
      'public export remains a createUnimplementedFunction placeholder until optimistic state queues, revert lanes, and renderer scheduling are admitted'
  },
  {
    hookName: 'useSyncExternalStore',
    reactSourceFunction: 'ReactHooks.useSyncExternalStore',
    reactDispatcherMethod: 'dispatcher.useSyncExternalStore',
    reactSourceLength: 3,
    currentPublicExport: 'react.useSyncExternalStore placeholder',
    currentName: 'useSyncExternalStore',
    currentLength: 0,
    blocker:
      'public export remains a createUnimplementedFunction placeholder until external store subscription, snapshot consistency, hydration, and renderer scheduling are admitted'
  },
  {
    hookName: 'useEffectEvent',
    reactSourceFunction: 'ReactHooks.useEffectEvent',
    reactDispatcherMethod: 'dispatcher.useEffectEvent',
    reactSourceLength: 1,
    currentPublicExport: 'react.useEffectEvent placeholder',
    currentName: 'useEffectEvent',
    currentLength: 0,
    blocker:
      'public export remains a createUnimplementedFunction placeholder until effect-event callback identity and commit-time invocation rules are admitted'
  },
  {
    hookName: 'useId',
    reactSourceFunction: 'ReactHooks.useId',
    reactDispatcherMethod: 'dispatcher.useId',
    reactSourceLength: 0,
    currentPublicExport: 'react.useId placeholder',
    currentName: 'useId',
    currentLength: 0,
    blocker:
      'public export remains a createUnimplementedFunction placeholder until root tree-id allocation, hydration id prefixes, and renderer output compatibility are admitted'
  },
  {
    hookName: 'useDebugValue',
    reactSourceFunction: 'ReactHooks.useDebugValue',
    reactDispatcherMethod: 'dispatcher.useDebugValue',
    reactSourceLength: 2,
    currentPublicExport: 'react.useDebugValue placeholder',
    currentName: 'useDebugValue',
    currentLength: 0,
    blocker:
      'public export remains a createUnimplementedFunction placeholder until devtools debug-value formatting and renderer instrumentation are admitted'
  }
]);
const unsupportedPlaceholderHookSourceReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'reactSourceTag',
  'reactSourceCommit',
  'reactHooksSource',
  'reactClientSource',
  'reactReconcilerSource',
  'fastReactSource',
  'hookCount',
  'dispatcherMethodsCurrentInReactSource',
  'publicExportsPlaceholderBlocked',
  'compatibilityClaimed'
]);
const unsupportedPlaceholderHookSourceReport = freezeRecord({
  kind: 'fast-react.private.unsupported_placeholder_hook_source_report',
  version: 1,
  status: 'source-current-for-react-19.2.6-unsupported-placeholder-hooks',
  reactSourceTag: 'v19.2.6',
  reactSourceCommit: 'eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401',
  reactHooksSource: 'packages/react/src/ReactHooks.js',
  reactClientSource: 'packages/react/src/ReactClient.js',
  reactReconcilerSource: 'packages/react-reconciler/src/ReactFiberHooks.js',
  fastReactSource: 'packages/react/index.js',
  hookCount: 6,
  dispatcherMethodsCurrentInReactSource: true,
  publicExportsPlaceholderBlocked: true,
  compatibilityClaimed: false
});
const unsupportedPlaceholderHookBlockerCurrentnessFieldNames = freezeArray([
  'status',
  'compatibilityTarget',
  'sourceReportCurrent',
  'publicExportsPlaceholderBlocked',
  'dispatcherRoutingBlocked',
  'dispatcherPrerequisitesBlocked',
  'schedulerPrerequisitesBlocked',
  'rootLanePrerequisitesBlocked',
  'rootSchedulingBlocked',
  'rendererCompatibilityBlocked',
  'callbackInvocationBlocked',
  'externalStoreInvocationBlocked',
  'idGenerationBlocked',
  'debugValueInstrumentationBlocked',
  'publicCompatibilityClaimed',
  'compatibilityClaimed'
]);
const unsupportedPlaceholderHookBlockerCurrentness = freezeRecord({
  status:
    'blocked-until-dispatcher-scheduler-root-renderer-and-hook-semantics-admitted',
  compatibilityTarget: 'react@19.2.6',
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
});
const unsupportedPlaceholderHookCallbackInvocationReportFieldNames =
  freezeArray([
    'useActionStateActionInvocationBlocked',
    'useOptimisticReducerInvocationBlocked',
    'useEffectEventCallbackInvocationBlocked',
    'useDebugValueFormatterInvocationBlocked',
    'invokesActionStateAction',
    'invokesOptimisticReducer',
    'invokesEffectEventCallback',
    'invokesDebugValueFormatter',
    'callbackExecutionClaimed',
    'compatibilityClaimed'
  ]);
const unsupportedPlaceholderHookCallbackInvocationReport = freezeRecord({
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
});
const unsupportedPlaceholderHookExternalStoreInvocationReportFieldNames =
  freezeArray([
    'subscribeInvocationBlocked',
    'getSnapshotInvocationBlocked',
    'getServerSnapshotInvocationBlocked',
    'invokesSubscribe',
    'invokesGetSnapshot',
    'invokesGetServerSnapshot',
    'externalStoreSubscriptionClaimed',
    'externalStoreSnapshotReadClaimed',
    'compatibilityClaimed'
  ]);
const unsupportedPlaceholderHookExternalStoreInvocationReport = freezeRecord({
  subscribeInvocationBlocked: true,
  getSnapshotInvocationBlocked: true,
  getServerSnapshotInvocationBlocked: true,
  invokesSubscribe: false,
  invokesGetSnapshot: false,
  invokesGetServerSnapshot: false,
  externalStoreSubscriptionClaimed: false,
  externalStoreSnapshotReadClaimed: false,
  compatibilityClaimed: false
});
const unsupportedPlaceholderHookIdGenerationReportFieldNames = freezeArray([
  'idGenerationBlocked',
  'treeIdAllocationBlocked',
  'hydrationPrefixBlocked',
  'generatesIds',
  'allocatesTreeIds',
  'claimsHydrationIdPrefix',
  'compatibilityClaimed'
]);
const unsupportedPlaceholderHookIdGenerationReport = freezeRecord({
  idGenerationBlocked: true,
  treeIdAllocationBlocked: true,
  hydrationPrefixBlocked: true,
  generatesIds: false,
  allocatesTreeIds: false,
  claimsHydrationIdPrefix: false,
  compatibilityClaimed: false
});
const unsupportedPlaceholderHookServerAvailableHookNames = freezeArray([
  'useId',
  'useDebugValue'
]);
const unsupportedPlaceholderHookServerAbsentHookNames = freezeArray([
  'useActionState',
  'useOptimistic',
  'useSyncExternalStore',
  'useEffectEvent'
]);
const unsupportedPlaceholderHookSurfaceCurrentnessFieldNames = freezeArray([
  'surfaceId',
  'source',
  'entrypoint',
  'moduleShape',
  'sameAsRootExport',
  'hookNames',
  'availableHookNames',
  'absentHookNames',
  'placeholderThrowHookNames',
  'unexpectedReturnHookNames',
  'unexpectedErrorHookNames',
  'probeSideEffectNames',
  'publicExportsPlaceholderOrAbsentBlocked',
  'dispatcherRoutingBlocked',
  'dispatcherPrerequisitesBlocked',
  'rootSchedulingBlocked',
  'callbackInvocationBlocked',
  'externalStoreInvocationBlocked',
  'idGenerationBlocked',
  'debugValueInstrumentationBlocked',
  'publicCompatibilityClaimed',
  'compatibilityClaimed'
]);
const unsupportedPlaceholderHookSurfaceCurrentnessArrayFieldNames =
  freezeArray([
    'hookNames',
    'availableHookNames',
    'absentHookNames',
    'placeholderThrowHookNames',
    'unexpectedReturnHookNames',
    'unexpectedErrorHookNames',
    'probeSideEffectNames'
  ]);
const unsupportedPlaceholderHookSurfaceCurrentnessRows =
  freezeSurfaceCurrentnessRows([
    {
      surfaceId: 'react-root',
      source: 'packages/react/index.js',
      entrypoint: 'react',
      moduleShape: 'default-root',
      sameAsRootExport: true,
      hookNames: unsupportedPlaceholderHookNames,
      availableHookNames: unsupportedPlaceholderHookNames,
      absentHookNames: [],
      placeholderThrowHookNames: unsupportedPlaceholderHookNames,
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
      surfaceId: 'react-cjs-development',
      source: 'packages/react/cjs/react.development.js',
      entrypoint: 'react',
      moduleShape: 'cjs-root-alias',
      sameAsRootExport: true,
      hookNames: unsupportedPlaceholderHookNames,
      availableHookNames: unsupportedPlaceholderHookNames,
      absentHookNames: [],
      placeholderThrowHookNames: unsupportedPlaceholderHookNames,
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
      surfaceId: 'react-cjs-production',
      source: 'packages/react/cjs/react.production.js',
      entrypoint: 'react',
      moduleShape: 'cjs-root-alias',
      sameAsRootExport: true,
      hookNames: unsupportedPlaceholderHookNames,
      availableHookNames: unsupportedPlaceholderHookNames,
      absentHookNames: [],
      placeholderThrowHookNames: unsupportedPlaceholderHookNames,
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
      surfaceId: 'react-server',
      source: 'packages/react/react.react-server.js',
      entrypoint: 'react react-server',
      moduleShape: 'react-server-root',
      sameAsRootExport: false,
      hookNames: unsupportedPlaceholderHookNames,
      availableHookNames: unsupportedPlaceholderHookServerAvailableHookNames,
      absentHookNames: unsupportedPlaceholderHookServerAbsentHookNames,
      placeholderThrowHookNames:
        unsupportedPlaceholderHookServerAvailableHookNames,
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
  ]);
const unsupportedPlaceholderHookMissingDispatcherPrerequisites = freezeArray([
  'dispatcher.useActionState',
  'dispatcher.useOptimistic',
  'dispatcher.useSyncExternalStore',
  'dispatcher.useEffectEvent',
  'dispatcher.useId',
  'dispatcher.useDebugValue',
  'private unsupported-placeholder hook dispatcher admission marker'
]);
const unsupportedPlaceholderHookMissingSchedulerPrerequisites = freezeArray([
  'mountActionState',
  'updateActionState',
  'rerenderActionState',
  'mountOptimistic',
  'updateOptimistic',
  'rerenderOptimistic',
  'mountSyncExternalStore',
  'updateSyncExternalStore',
  'mountEvent',
  'updateEvent',
  'mountId',
  'updateId',
  'mountDebugValue',
  'updateDebugValue'
]);
const unsupportedPlaceholderHookMissingRootLanePrerequisites = freezeArray([
  'requestUpdateLane',
  'dispatchOptimisticSetState',
  'dispatchActionState',
  'enqueueConcurrentHookUpdate',
  'scheduleUpdateOnFiber',
  'entangleTransitionUpdate',
  'markSkippedUpdateLanes',
  'getWorkInProgressRoot',
  'pushTreeId'
]);
const unsupportedPlaceholderHookPublicCompatibilityFalseFlags = freezeArray([
  'compatibilityClaimed',
  'publicCompatibilityClaimed',
  'publicHookCompatibility',
  'exposesPublicHookImplementation'
]);
const unsupportedPlaceholderHookPrerequisiteFalseFlags = freezeArray([
  'dispatcherRouting',
  'dispatcherPrerequisitesReady',
  'schedulerIntegration',
  'schedulerPrerequisitesReady',
  'rootLaneIntegration',
  'rootScheduling',
  'rendererIntegration',
  'rendererCompatibility'
]);
const unsupportedPlaceholderHookCallbackInvocationFalseFlags = freezeArray([
  'invokesCallbacks',
  'invokesActionStateAction',
  'invokesOptimisticReducer',
  'invokesEffectEventCallback',
  'invokesDebugValueFormatter',
  'callbackExecutionClaimed'
]);
const unsupportedPlaceholderHookExternalStoreInvocationFalseFlags = freezeArray([
  'invokesExternalStoreSubscribe',
  'invokesExternalStoreGetSnapshot',
  'invokesExternalStoreGetServerSnapshot',
  'externalStoreSubscriptionClaimed',
  'externalStoreSnapshotReadClaimed'
]);
const unsupportedPlaceholderHookIdGenerationFalseFlags = freezeArray([
  'generatesIds',
  'allocatesTreeIds',
  'claimsHydrationIdPrefix'
]);
const unsupportedPlaceholderHookCompatibilityFalseFlags = freezeArray([
  ...unsupportedPlaceholderHookPublicCompatibilityFalseFlags,
  ...unsupportedPlaceholderHookPrerequisiteFalseFlags,
  ...unsupportedPlaceholderHookCallbackInvocationFalseFlags,
  ...unsupportedPlaceholderHookExternalStoreInvocationFalseFlags,
  ...unsupportedPlaceholderHookIdGenerationFalseFlags
]);
const unsupportedPlaceholderHookCurrentnessReportKind =
  'fast-react.private.unsupported_placeholder_hook_currentness';
const unsupportedPlaceholderHookCurrentnessReportVersion = 1;
const unsupportedPlaceholderHookCurrentnessStatus =
  'blocked-unsupported-placeholder-hook-currentness';
const unsupportedPlaceholderHookCurrentnessConsumptionStatus =
  'accepted-blocked-unsupported-placeholder-hook-currentness';
const privateUnsupportedPlaceholderHookBlockerMetadata = freezeRecord({
  capability: 'fast-react.private.unsupported_placeholder_hook_blockers',
  compatibilityTarget: 'react@19.2.6',
  compatibilityClaimed: false,
  publicCompatibilityClaimed: false,
  publicHookCompatibility: false,
  exposesPublicHookImplementation: false,
  dispatcherRouting: false,
  dispatcherPrerequisitesReady: false,
  schedulerIntegration: false,
  schedulerPrerequisitesReady: false,
  rootLaneIntegration: false,
  rootScheduling: false,
  rendererIntegration: false,
  rendererCompatibility: false,
  invokesCallbacks: false,
  invokesActionStateAction: false,
  invokesOptimisticReducer: false,
  invokesEffectEventCallback: false,
  invokesDebugValueFormatter: false,
  callbackExecutionClaimed: false,
  invokesExternalStoreSubscribe: false,
  invokesExternalStoreGetSnapshot: false,
  invokesExternalStoreGetServerSnapshot: false,
  externalStoreSubscriptionClaimed: false,
  externalStoreSnapshotReadClaimed: false,
  generatesIds: false,
  allocatesTreeIds: false,
  claimsHydrationIdPrefix: false,
  hookNames: unsupportedPlaceholderHookNames,
  publicShapeBlockerFields:
    unsupportedPlaceholderHookPublicShapeBlockerFields,
  publicShapeBlockers: unsupportedPlaceholderHookPublicShapeBlockers,
  sourceReportFieldNames: unsupportedPlaceholderHookSourceReportFieldNames,
  sourceReport: unsupportedPlaceholderHookSourceReport,
  blockerCurrentnessFieldNames:
    unsupportedPlaceholderHookBlockerCurrentnessFieldNames,
  blockerCurrentness: unsupportedPlaceholderHookBlockerCurrentness,
  callbackInvocationReportFieldNames:
    unsupportedPlaceholderHookCallbackInvocationReportFieldNames,
  callbackInvocationReport:
    unsupportedPlaceholderHookCallbackInvocationReport,
  externalStoreInvocationReportFieldNames:
    unsupportedPlaceholderHookExternalStoreInvocationReportFieldNames,
  externalStoreInvocationReport:
    unsupportedPlaceholderHookExternalStoreInvocationReport,
  idGenerationReportFieldNames:
    unsupportedPlaceholderHookIdGenerationReportFieldNames,
  idGenerationReport: unsupportedPlaceholderHookIdGenerationReport,
  surfaceCurrentnessFieldNames:
    unsupportedPlaceholderHookSurfaceCurrentnessFieldNames,
  surfaceCurrentnessRows:
    unsupportedPlaceholderHookSurfaceCurrentnessRows,
  cjsSurfaceCurrentnessBlocked: true,
  reactServerSurfaceCurrentnessBlocked: true,
  missingDispatcherPrerequisites:
    unsupportedPlaceholderHookMissingDispatcherPrerequisites,
  missingSchedulerPrerequisites:
    unsupportedPlaceholderHookMissingSchedulerPrerequisites,
  missingRootLanePrerequisites:
    unsupportedPlaceholderHookMissingRootLanePrerequisites,
  publicCompatibilityFalseFlags:
    unsupportedPlaceholderHookPublicCompatibilityFalseFlags,
  prerequisiteFalseFlags: unsupportedPlaceholderHookPrerequisiteFalseFlags,
  callbackInvocationFalseFlags:
    unsupportedPlaceholderHookCallbackInvocationFalseFlags,
  externalStoreInvocationFalseFlags:
    unsupportedPlaceholderHookExternalStoreInvocationFalseFlags,
  idGenerationFalseFlags: unsupportedPlaceholderHookIdGenerationFalseFlags,
  compatibilityFalseFlags: unsupportedPlaceholderHookCompatibilityFalseFlags
});
const privateUnsupportedPlaceholderHookBlockerMetadataArrayKeys = freezeArray([
  'hookNames',
  'publicShapeBlockerFields',
  'sourceReportFieldNames',
  'blockerCurrentnessFieldNames',
  'callbackInvocationReportFieldNames',
  'externalStoreInvocationReportFieldNames',
  'idGenerationReportFieldNames',
  'surfaceCurrentnessFieldNames',
  'missingDispatcherPrerequisites',
  'missingSchedulerPrerequisites',
  'missingRootLanePrerequisites',
  'publicCompatibilityFalseFlags',
  'prerequisiteFalseFlags',
  'callbackInvocationFalseFlags',
  'externalStoreInvocationFalseFlags',
  'idGenerationFalseFlags',
  'compatibilityFalseFlags'
]);

const effectHookMetadataByHookName = Object.freeze({
  useEffect: createEffectHookMetadata({
    effectPhaseName: 'Passive',
    hasPassiveHandoff: true,
    hookEffectFlagName: 'PASSIVE',
    hookName: 'useEffect',
    mountFiberFlagNames: ['PASSIVE', 'PASSIVE_STATIC'],
    updateFiberFlagNames: ['PASSIVE']
  }),
  useImperativeHandle: createEffectHookMetadata({
    effectPhaseName: 'Layout',
    hasPassiveHandoff: false,
    hookEffectFlagName: 'LAYOUT',
    hookName: 'useImperativeHandle',
    mountFiberFlagNames: ['UPDATE', 'LAYOUT_STATIC'],
    updateFiberFlagNames: ['UPDATE']
  }),
  useInsertionEffect: createEffectHookMetadata({
    effectPhaseName: 'Insertion',
    hasPassiveHandoff: false,
    hookEffectFlagName: 'INSERTION',
    hookName: 'useInsertionEffect',
    mountFiberFlagNames: ['UPDATE'],
    updateFiberFlagNames: ['UPDATE']
  }),
  useLayoutEffect: createEffectHookMetadata({
    effectPhaseName: 'Layout',
    hasPassiveHandoff: false,
    hookEffectFlagName: 'LAYOUT',
    hookName: 'useLayoutEffect',
    mountFiberFlagNames: ['UPDATE', 'LAYOUT_STATIC'],
    updateFiberFlagNames: ['UPDATE']
  })
});
const effectHookNames = Object.freeze(Object.keys(effectHookMetadataByHookName));

const privateEffectHookDispatcherMetadata = freezeRecord({
  capability: 'fast-react.private.effect_hook_dispatcher',
  compatibilityTarget: 'react@19.2.6',
  compatibilityClaimed: false,
  exposesPublicHookImplementation: false,
  rendererIntegration: false,
  schedulesPublicAct: false,
  executesEffectCallbacks: false,
  hookNames: freezeArray(effectHookNames),
  effectRegistrationFieldNames,
  effectUpdateQueueRecordFieldNames,
  effectDependencyStatusNames,
  hookRenderPhaseNames,
  passiveEffectMetadataFieldNames,
  pendingPassiveCommitHandoffFieldNames,
  pendingPassiveEffectCommitFieldNames,
  pendingPassivePhaseNames,
  acceptedReconcilerRecords: freezeArray([
    'FunctionComponentEffectRegistration',
    'FunctionComponentEffectUpdateQueueRecord',
    'FunctionComponentEffectDependencyStatus',
    'FunctionComponentHookRenderPhase',
    'FunctionComponentUseEffectHookRenderRecord',
    'FunctionComponentUseEffectRenderRecord',
    'FunctionComponentPassiveEffectMetadata',
    'FunctionComponentPendingPassiveCommitHandoff',
    'FunctionComponentPendingPassiveEffectCommitRecord'
  ])
});

const privateEffectHookDispatcherMetadataArrayKeys = freezeArray([
  'hookNames',
  'effectRegistrationFieldNames',
  'effectUpdateQueueRecordFieldNames',
  'effectDependencyStatusNames',
  'hookRenderPhaseNames',
  'passiveEffectMetadataFieldNames',
  'pendingPassiveCommitHandoffFieldNames',
  'pendingPassiveEffectCommitFieldNames',
  'pendingPassivePhaseNames',
  'acceptedReconcilerRecords'
]);

const privateContextHookDispatcherMetadata = freezeRecord({
  capability: 'fast-react.private.context_hook_dispatcher',
  compatibilityTarget: 'react@19.2.6',
  compatibilityClaimed: false,
  exposesPublicHookImplementation: false,
  rendererIntegration: false,
  runtimeProviderPropagation: false,
  rendererVisiblePropagation: false,
  hookNames: freezeArray(['useContext']),
  contextReadRecordFields: contextReadRecordFieldNames,
  contextDependencyRecordFields: contextDependencyRecordFieldNames,
  contextPropagationDependencyRecordFields:
    contextPropagationDependencyRecordFieldNames,
  contextPropagationRecordFields: contextPropagationRecordFieldNames,
  acceptedReconcilerRecords: freezeArray([
    'FunctionComponentContextReadRecord',
    'FunctionComponentContextDependencyRecord',
    'FunctionComponentUseContextRenderRecord',
    'FunctionComponentContextChangePropagationDependencyRecord',
    'FunctionComponentContextChangePropagationRecord'
  ])
});

const privateContextHookDispatcherMetadataArrayKeys = freezeArray([
  'hookNames',
  'contextReadRecordFields',
  'contextDependencyRecordFields',
  'contextPropagationDependencyRecordFields',
  'contextPropagationRecordFields',
  'acceptedReconcilerRecords'
]);

const privateTransitionHookDispatcherMetadata = freezeRecord({
  capability: 'fast-react.private.transition_hook_dispatcher_blockers',
  compatibilityTarget: 'react@19.2.6',
  compatibilityClaimed: false,
  exposesPublicHookImplementation: false,
  publicStartTransitionDispatcherRouting: false,
  publicUseTransitionImplementation: false,
  hookExecutionCompatibility: false,
  publicActIntegration: false,
  publicSchedulerTimingCompatibility: false,
  rendererIntegration: false,
  rendererCompatibility: false,
  schedulerIntegration: false,
  rootLaneIntegration: false,
  schedulerExecution: false,
  rootScheduling: false,
  rootExecution: false,
  schedulesTransitionUpdates: false,
  schedulesDeferredValueUpdates: false,
  executesTransitionCallbacks: false,
  returnsPendingState: false,
  readsThenables: false,
  hookNames: transitionHookNames,
  publicShapeBlockerFields: transitionHookPublicShapeBlockerFields,
  publicShapeBlockers: transitionHookPublicShapeBlockers,
  startTransitionPublicRoutingBlockerFields:
    transitionStartTransitionPublicRoutingBlockerFields,
  startTransitionPublicRoutingBlocker:
    transitionStartTransitionPublicRoutingBlocker,
  transitionActionIdentityFieldNames,
  transitionLaneMetadataFieldNames,
  transitionLaneMetadata,
  transitionPendingStateTupleFieldNames,
  transitionPendingStateTupleShape,
  startTransitionRoutingRecordFieldNames,
  missingSchedulerPrerequisites: transitionHookMissingSchedulerPrerequisites,
  missingRootLanePrerequisites: transitionHookMissingRootLanePrerequisites,
  compatibilityFalseFlags: transitionHookCompatibilityFalseFlags,
  blockerCurrentnessFieldNames: transitionHookBlockerCurrentnessFieldNames,
  blockerCurrentness: transitionHookBlockerCurrentness,
  acceptedReconcilerRecords: transitionAcceptedReconcilerRecords
});

const privateTransitionHookDispatcherMetadataArrayKeys = freezeArray([
  'hookNames',
  'publicShapeBlockerFields',
  'startTransitionPublicRoutingBlockerFields',
  'transitionActionIdentityFieldNames',
  'transitionLaneMetadataFieldNames',
  'transitionPendingStateTupleFieldNames',
  'startTransitionRoutingRecordFieldNames',
  'missingSchedulerPrerequisites',
  'missingRootLanePrerequisites',
  'compatibilityFalseFlags',
  'blockerCurrentnessFieldNames',
  'acceptedReconcilerRecords'
]);

const privateStateHookDispatcherMetadata = freezeRecord({
  capability: 'fast-react.private.state_hook_dispatcher',
  compatibilityTarget: 'react@19.2.6',
  compatibilityClaimed: false,
  exposesPublicHookImplementation: false,
  rendererIntegration: false,
  schedulesPublicJsUpdates: false,
  hookNames: freezeArray(['useReducer', 'useState']),
  hookStateRecordFields: freezeArray([
    'memoizedState',
    'baseState',
    'baseQueue',
    'queue',
    'dispatch'
  ]),
  reducerHookRecordFields: freezeArray([
    'memoizedState',
    'baseState',
    'baseQueue',
    'queue',
    'dispatch',
    'reducer'
  ]),
  hookQueueRecordFields: freezeArray([
    'pending',
    'lanes',
    'dispatch',
    'lastRenderedReducer',
    'lastRenderedState'
  ]),
  hookUpdateRecordFields: freezeArray([
    'lane',
    'revertLane',
    'action',
    'hasEagerState',
    'eagerState',
    'next'
  ]),
  stateUpdateRenderRecordFields: freezeArray([
    'fiber',
    'hook',
    'queue',
    'dispatch',
    'lanes',
    'previousMemoizedState',
    'previousBaseState',
    'previousBaseQueue',
    'memoizedState',
    'baseState',
    'baseQueue',
    'remainingLanes',
    'appliedUpdateCount',
    'skippedUpdateCount',
    'revertedUpdateCount',
    'eagerUpdateCount'
  ]),
  reducerUpdateRenderRecordFields: freezeArray([
    'fiber',
    'hook',
    'queue',
    'dispatch',
    'reducer',
    'lanes',
    'previousMemoizedState',
    'previousBaseState',
    'previousBaseQueue',
    'memoizedState',
    'baseState',
    'baseQueue',
    'remainingLanes',
    'appliedUpdateCount',
    'skippedUpdateCount',
    'revertedUpdateCount',
    'eagerUpdateCount'
  ]),
  stateDispatchEagerStateFields: freezeArray([
    'lastRenderedState',
    'eagerState'
  ]),
  stateDispatchRequestFields: freezeArray([
    'dispatch',
    'action',
    'lane',
    'revertLane',
    'eagerState'
  ]),
  stateDispatchRecordFields: freezeArray([
    'fiber',
    'queue',
    'dispatch',
    'update',
    'lane',
    'revertLane',
    'action',
    'hasEagerState',
    'eagerState'
  ]),
  reducerDispatchRequestFields: freezeArray(['dispatch', 'action', 'lane']),
  reducerDispatchRecordFields: freezeArray([
    'fiber',
    'queue',
    'dispatch',
    'reducer',
    'update',
    'lane',
    'action'
  ]),
  acceptedReconcilerRecords: freezeArray([
    'HookStateSlot',
    'HookQueue',
    'HookUpdate',
    'FunctionComponentReducerHandle',
    'FunctionComponentStateReducerId',
    'FunctionComponentReducerHookRecord',
    'FunctionComponentStateUpdateRenderLanes',
    'FunctionComponentStateUpdateRenderRecord',
    'FunctionComponentReducerUpdateRenderRecord',
    'FunctionComponentStateDispatchEagerState',
    'FunctionComponentStateDispatchRequest',
    'FunctionComponentStateDispatchRecord',
    'FunctionComponentReducerDispatchRequest',
    'FunctionComponentReducerDispatchRecord'
  ])
});

const privateStateHookDispatcherMetadataArrayKeys = freezeArray([
  'hookNames',
  'hookStateRecordFields',
  'reducerHookRecordFields',
  'hookQueueRecordFields',
  'hookUpdateRecordFields',
  'stateUpdateRenderRecordFields',
  'reducerUpdateRenderRecordFields',
  'stateDispatchEagerStateFields',
  'stateDispatchRequestFields',
  'stateDispatchRecordFields',
  'reducerDispatchRequestFields',
  'reducerDispatchRecordFields',
  'acceptedReconcilerRecords'
]);

const privateCallbackHookDispatcherMetadata = freezeRecord({
  capability: 'fast-react.private.callback_hook_dispatcher',
  compatibilityTarget: 'react@19.2.6',
  compatibilityClaimed: false,
  exposesPublicHookImplementation: false,
  rendererIntegration: false,
  schedulesPublicJsUpdates: false,
  executesCallback: false,
  hookNames: freezeArray(['useCallback']),
  renderRequestFields: freezeArray(['callback', 'dependencies']),
  hookRecordFields: freezeArray(['hook', 'callback', 'dependencies']),
  updateRecordFields: freezeArray([
    'hook',
    'previousHook',
    'previousCallback',
    'previousDependencies',
    'requestedCallback',
    'callback',
    'dependencies',
    'dependencyStatus'
  ]),
  updateDiagnosticRecordFields: freezeArray([
    'diagnosticIndex',
    'fiber',
    'current',
    'currentHookList',
    'hookList',
    'previousHook',
    'hook',
    'renderLanes',
    'previousCallback',
    'previousDependencies',
    'requestedCallback',
    'callback',
    'dependencies',
    'dependencyStatus'
  ]),
  updateDiagnosticsFields: freezeArray(['hookList', 'records']),
  memoRecordFields: freezeArray(['hook', 'value', 'dependencies']),
  memoUpdateRecordFields: freezeArray([
    'hook',
    'previousHook',
    'previousValue',
    'previousDependencies',
    'requestedValue',
    'value',
    'dependencies',
    'dependencyStatus'
  ]),
  dependencyStatusNames: freezeArray(['Changed', 'Unchanged']),
  acceptedReconcilerRecords: freezeArray([
    'FunctionComponentCallbackHandle',
    'FunctionComponentUseCallbackRenderRequest',
    'FunctionComponentCallbackHookRecord',
    'FunctionComponentCallbackUpdateRecord',
    'FunctionComponentCallbackUpdateDiagnosticRecord',
    'FunctionComponentCallbackUpdateDiagnostics',
    'FunctionComponentUseCallbackHookRenderRecord',
    'FunctionComponentUseCallbackRenderRecord',
    'FunctionComponentMemoDependencyStatus',
    'FunctionComponentMemoHookRecord',
    'FunctionComponentMemoUpdateRecord'
  ])
});

const privateMemoHookDispatcherMetadata = freezeRecord({
  capability: 'fast-react.private.memo_hook_dispatcher',
  compatibilityTarget: 'react@19.2.6',
  compatibilityClaimed: false,
  exposesPublicHookImplementation: false,
  rendererIntegration: false,
  schedulesPublicJsUpdates: false,
  executesCreate: false,
  hookNames: freezeArray(['useMemo']),
  hookCallFields: freezeArray(['create', 'dependencies']),
  renderRequestFields: freezeArray(['value', 'dependencies']),
  hookRecordFields: freezeArray(['hook', 'value', 'dependencies']),
  updateRecordFields: freezeArray([
    'hook',
    'previousHook',
    'previousValue',
    'previousDependencies',
    'requestedValue',
    'value',
    'dependencies',
    'dependencyStatus'
  ]),
  updateDiagnosticRecordFields: freezeArray([
    'diagnosticIndex',
    'fiber',
    'current',
    'currentHookList',
    'hookList',
    'previousHook',
    'hook',
    'renderLanes',
    'previousValue',
    'previousDependencies',
    'requestedValue',
    'value',
    'dependencies',
    'dependencyStatus'
  ]),
  updateDiagnosticsFields: freezeArray(['hookList', 'records']),
  dependencyStatusNames: freezeArray(['Changed', 'Unchanged']),
  acceptedReconcilerRecords: freezeArray([
    'FunctionComponentUseMemoRenderRequest',
    'FunctionComponentMemoDependencyStatus',
    'FunctionComponentMemoHookRecord',
    'FunctionComponentMemoUpdateRecord',
    'FunctionComponentMemoUpdateDiagnosticRecord',
    'FunctionComponentMemoUpdateDiagnostics',
    'FunctionComponentUseMemoHookRenderRecord',
    'FunctionComponentUseMemoRenderRecord',
    'FunctionComponentUseMemoUseRefRenderRecord'
  ])
});

const privateMemoHookDispatcherMetadataArrayKeys = freezeArray([
  'hookNames',
  'hookCallFields',
  'renderRequestFields',
  'hookRecordFields',
  'updateRecordFields',
  'updateDiagnosticRecordFields',
  'updateDiagnosticsFields',
  'dependencyStatusNames',
  'acceptedReconcilerRecords'
]);

const privateCallbackHookDispatcherMetadataArrayKeys = freezeArray([
  'hookNames',
  'renderRequestFields',
  'hookRecordFields',
  'updateRecordFields',
  'updateDiagnosticRecordFields',
  'updateDiagnosticsFields',
  'memoRecordFields',
  'memoUpdateRecordFields',
  'dependencyStatusNames',
  'acceptedReconcilerRecords'
]);

const ReactCurrentDispatcher = {};

Object.defineProperty(ReactCurrentDispatcher, 'current', {
  configurable: true,
  get() {
    return ReactSharedInternals.H;
  },
  set(dispatcher) {
    ReactSharedInternals.H = dispatcher;
  }
});

function createInvalidHookCallError(hookName) {
  const error = new Error(invalidHookCallMessage);
  error.code = invalidHookCallErrorCode;
  error.hookName = hookName;
  return error;
}

function createMissingPrivateStateHookDispatcherError(hookName) {
  return createUnimplementedError(
    'react',
    hookName,
    'was called',
    'Stateful hooks require a private/native hook dispatcher before they can execute.'
  );
}

function createUnsupportedPrivateTransitionCallbackError() {
  const error = new TypeError(
    'Private startTransition dispatcher routing requires a callback function.'
  );
  error.code = 'FAST_REACT_UNSUPPORTED_TRANSITION_CALLBACK';
  error.hookName = 'useTransition';
  error.apiName = 'startTransition';
  return error;
}

function createUnsupportedPlaceholderHookCurrentnessGateError(reason) {
  const error = createUnimplementedError(
    'react',
    'unsupportedPlaceholderHookCurrentness',
    'rejected source/currentness report',
    'Only current source-owned unsupported placeholder hook blocker reports can pass this package-private gate.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicHookCompatibility = false;
  error.exposesPublicHookImplementation = false;
  error.dispatcherRouting = false;
  error.schedulerIntegration = false;
  error.rootLaneIntegration = false;
  error.rootScheduling = false;
  error.rendererCompatibility = false;
  error.invokesCallbacks = false;
  error.invokesExternalStoreSubscribe = false;
  error.invokesExternalStoreGetSnapshot = false;
  error.invokesExternalStoreGetServerSnapshot = false;
  error.generatesIds = false;
  error.compatibilityClaimed = false;
  return error;
}

function createEffectHookMetadata({
  effectPhaseName,
  hasPassiveHandoff,
  hookEffectFlagName,
  hookName,
  mountFiberFlagNames,
  updateFiberFlagNames
}) {
  return Object.freeze({
    compatibilityStatus: 'blocked',
    effectDependencyStatusEnumName: 'FunctionComponentEffectDependencyStatus',
    effectDependencyStatusNames,
    effectPhaseEnumName: 'FunctionComponentEffectPhase',
    effectPhaseName,
    effectRegistrationFieldNames,
    effectRegistrationRecordName: 'FunctionComponentEffectRegistration',
    effectUpdateQueueRecordFieldNames,
    effectUpdateQueueRecordName: 'FunctionComponentEffectUpdateQueueRecord',
    executesEffectCallback: false,
    fiberFlagsRecordName: 'FiberFlags',
    hookEffectFlagName,
    hookEffectFlagsRecordName: 'HookEffectFlags',
    hookName,
    hookRenderPhaseEnumName: 'FunctionComponentHookRenderPhase',
    hookRenderPhaseNames,
    mountFiberFlagNames: Object.freeze(mountFiberFlagNames.slice()),
    passiveEffectMetadataFieldNames: hasPassiveHandoff
      ? passiveEffectMetadataFieldNames
      : noPassiveFieldNames,
    passiveEffectMetadataRecordName: hasPassiveHandoff
      ? 'FunctionComponentPassiveEffectMetadata'
      : null,
    pendingPassiveCommitHandoffFieldNames: hasPassiveHandoff
      ? pendingPassiveCommitHandoffFieldNames
      : noPassiveFieldNames,
    pendingPassiveCommitHandoffRecordName: hasPassiveHandoff
      ? 'FunctionComponentPendingPassiveCommitHandoff'
      : null,
    pendingPassiveEffectCommitFieldNames: hasPassiveHandoff
      ? pendingPassiveEffectCommitFieldNames
      : noPassiveFieldNames,
    pendingPassiveEffectCommitRecordName: hasPassiveHandoff
      ? 'FunctionComponentPendingPassiveEffectCommitRecord'
      : null,
    pendingPassivePhaseNames: hasPassiveHandoff
      ? pendingPassivePhaseNames
      : noPassivePhaseNames,
    schedulesPublicAct: false,
    updateFiberFlagNames: Object.freeze(updateFiberFlagNames.slice())
  });
}

function isObjectLike(value) {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

function getEffectHookMetadata(hookName) {
  if (
    Object.prototype.hasOwnProperty.call(effectHookMetadataByHookName, hookName)
  ) {
    return effectHookMetadataByHookName[hookName];
  }

  return null;
}

function isPrivateStateHookDispatcher(dispatcher) {
  return (
    isObjectLike(dispatcher) &&
    privateStateHookDispatchers.has(dispatcher) &&
    privateStateHookDispatcherMetadataByDispatcher.has(dispatcher)
  );
}

function isPrivateCallbackHookDispatcher(dispatcher) {
  return (
    isObjectLike(dispatcher) &&
    privateCallbackHookDispatchers.has(dispatcher) &&
    privateCallbackHookDispatcherMetadataByDispatcher.has(dispatcher)
  );
}

function isPrivateMemoHookDispatcher(dispatcher) {
  return (
    isObjectLike(dispatcher) &&
    privateMemoHookDispatchers.has(dispatcher) &&
    privateMemoHookDispatcherMetadataByDispatcher.has(dispatcher)
  );
}

function isPrivateContextHookDispatcher(dispatcher) {
  return (
    isObjectLike(dispatcher) &&
    privateContextHookDispatchers.has(dispatcher) &&
    privateContextHookDispatcherMetadataByDispatcher.has(dispatcher)
  );
}

function isPrivateEffectHookDispatcher(dispatcher) {
  return (
    isObjectLike(dispatcher) &&
    privateEffectHookDispatchers.has(dispatcher) &&
    privateEffectHookDispatcherMetadataByDispatcher.has(dispatcher)
  );
}

function isPrivateTransitionHookDispatcher(dispatcher) {
  return (
    isObjectLike(dispatcher) &&
    privateTransitionHookDispatchers.has(dispatcher) &&
    privateTransitionHookDispatcherMetadataByDispatcher.has(dispatcher)
  );
}

function validatePrivateStateHookDispatcher(dispatcher, metadata) {
  if (!isObjectLike(dispatcher)) {
    throw createMissingPrivateStateHookDispatcherError('useState');
  }

  for (const hookName of ['useReducer', 'useState']) {
    if (typeof dispatcher[hookName] !== 'function') {
      throw createMissingPrivateStateHookDispatcherError(hookName);
    }
  }

  validatePrivateStateHookDispatcherMetadata(metadata);
}

function validatePrivateCallbackHookDispatcher(dispatcher, metadata) {
  if (!isObjectLike(dispatcher) || typeof dispatcher.useCallback !== 'function') {
    throw createInvalidHookCallError('useCallback');
  }

  validatePrivateCallbackHookDispatcherMetadata(metadata);
}

function validatePrivateMemoHookDispatcher(dispatcher, metadata) {
  if (!isObjectLike(dispatcher) || typeof dispatcher.useMemo !== 'function') {
    throw createInvalidHookCallError('useMemo');
  }

  validatePrivateMemoHookDispatcherMetadata(metadata);
}

function validatePrivateContextHookDispatcher(dispatcher, metadata) {
  if (!isObjectLike(dispatcher) || typeof dispatcher.useContext !== 'function') {
    throw createInvalidHookCallError('useContext');
  }

  validatePrivateContextHookDispatcherMetadata(metadata);
}

function validatePrivateEffectHookDispatcher(dispatcher, metadata) {
  if (!isObjectLike(dispatcher)) {
    throw createInvalidHookCallError('useEffect');
  }

  for (const hookName of effectHookNames) {
    if (typeof dispatcher[hookName] !== 'function') {
      throw createInvalidHookCallError(hookName);
    }
  }

  validatePrivateEffectHookDispatcherMetadata(metadata);
}

function validatePrivateTransitionHookDispatcher(dispatcher, metadata) {
  if (!isObjectLike(dispatcher)) {
    throw createInvalidHookCallError('useTransition');
  }

  for (const hookName of transitionHookNames) {
    if (typeof dispatcher[hookName] !== 'function') {
      throw createInvalidHookCallError(hookName);
    }
  }

  validatePrivateTransitionHookDispatcherMetadata(metadata);
}

function markPrivateStateHookDispatcher(dispatcher, metadata) {
  validatePrivateStateHookDispatcher(dispatcher, metadata);
  privateStateHookDispatchers.add(dispatcher);
  privateStateHookDispatcherMetadataByDispatcher.set(
    dispatcher,
    privateStateHookDispatcherMetadata
  );
  return dispatcher;
}

function markPrivateCallbackHookDispatcher(dispatcher, metadata) {
  validatePrivateCallbackHookDispatcher(dispatcher, metadata);
  privateCallbackHookDispatchers.add(dispatcher);
  privateCallbackHookDispatcherMetadataByDispatcher.set(
    dispatcher,
    privateCallbackHookDispatcherMetadata
  );
  return dispatcher;
}

function markPrivateMemoHookDispatcher(dispatcher, metadata) {
  validatePrivateMemoHookDispatcher(dispatcher, metadata);
  privateMemoHookDispatchers.add(dispatcher);
  privateMemoHookDispatcherMetadataByDispatcher.set(
    dispatcher,
    privateMemoHookDispatcherMetadata
  );
  return dispatcher;
}

function markPrivateContextHookDispatcher(dispatcher, metadata) {
  validatePrivateContextHookDispatcher(dispatcher, metadata);
  privateContextHookDispatchers.add(dispatcher);
  privateContextHookDispatcherMetadataByDispatcher.set(
    dispatcher,
    privateContextHookDispatcherMetadata
  );
  return dispatcher;
}

function markPrivateEffectHookDispatcher(dispatcher, metadata) {
  validatePrivateEffectHookDispatcher(dispatcher, metadata);
  privateEffectHookDispatchers.add(dispatcher);
  privateEffectHookDispatcherMetadataByDispatcher.set(
    dispatcher,
    privateEffectHookDispatcherMetadata
  );
  return dispatcher;
}

function markPrivateTransitionHookDispatcher(dispatcher, metadata) {
  validatePrivateTransitionHookDispatcher(dispatcher, metadata);
  privateTransitionHookDispatchers.add(dispatcher);
  privateTransitionHookDispatcherMetadataByDispatcher.set(
    dispatcher,
    privateTransitionHookDispatcherMetadata
  );
  return dispatcher;
}

function resolveDispatcher(hookName) {
  const dispatcher = ReactSharedInternals.H;

  if (dispatcher == null) {
    throw createInvalidHookCallError(hookName);
  }

  return dispatcher;
}

function getDispatcherHook(dispatcher, hookName) {
  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createInvalidHookCallError(hookName);
  }

  return hook;
}

function getPrivateEffectDispatcherHook(dispatcher, hookName) {
  if (
    getEffectHookMetadata(hookName) === null ||
    !isPrivateEffectHookDispatcher(dispatcher)
  ) {
    throw createInvalidHookCallError(hookName);
  }

  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createInvalidHookCallError(hookName);
  }

  return hook;
}

function getPrivateStateDispatcherHook(dispatcher, hookName) {
  if (!isPrivateStateHookDispatcher(dispatcher)) {
    throw createMissingPrivateStateHookDispatcherError(hookName);
  }

  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createMissingPrivateStateHookDispatcherError(hookName);
  }

  return hook;
}

function getPrivateCallbackDispatcherHook(dispatcher, hookName) {
  if (hookName !== 'useCallback' || !isPrivateCallbackHookDispatcher(dispatcher)) {
    throw createInvalidHookCallError(hookName);
  }

  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createInvalidHookCallError(hookName);
  }

  return hook;
}

function getPrivateMemoDispatcherHook(dispatcher, hookName) {
  if (hookName !== 'useMemo' || !isPrivateMemoHookDispatcher(dispatcher)) {
    throw createInvalidHookCallError(hookName);
  }

  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createInvalidHookCallError(hookName);
  }

  return hook;
}

function getPrivateContextDispatcherHook(dispatcher, hookName) {
  if (!isPrivateContextHookDispatcher(dispatcher)) {
    throw createInvalidHookCallError(hookName);
  }

  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createInvalidHookCallError(hookName);
  }

  return hook;
}

function callDispatcherHook(hookName, args) {
  if (hookName === 'useCallback') {
    return callPrivateCallbackDispatcherHook(hookName, args);
  }

  if (hookName === 'useMemo') {
    return callPrivateMemoDispatcherHook(hookName, args);
  }

  if (hookName === 'useReducer' || hookName === 'useState') {
    return callPrivateStateDispatcherHook(hookName, args);
  }

  if (hookName === 'useContext') {
    return callPrivateContextDispatcherHook(hookName, args);
  }

  if (getEffectHookMetadata(hookName) !== null) {
    return callPrivateEffectDispatcherHook(hookName, args);
  }

  const dispatcher = resolveDispatcher(hookName);
  const hook = getDispatcherHook(dispatcher, hookName);
  return hook.apply(dispatcher, args);
}

function callPrivateContextDispatcherHook(hookName, args) {
  const dispatcher = resolveDispatcher(hookName);
  const hook = getPrivateContextDispatcherHook(dispatcher, hookName);
  return hook.apply(dispatcher, args);
}

function callPrivateCallbackDispatcherHook(hookName, args) {
  const dispatcher = resolveDispatcher(hookName);
  const hook = getPrivateCallbackDispatcherHook(dispatcher, hookName);
  return hook.apply(
    dispatcher,
    createPrivateCallbackHookArgs(args, privateCallbackHookDispatcherMetadata)
  );
}

function callPrivateMemoDispatcherHook(hookName, args) {
  const dispatcher = resolveDispatcher(hookName);
  const hook = getPrivateMemoDispatcherHook(dispatcher, hookName);
  return hook.apply(
    dispatcher,
    createPrivateMemoHookArgs(args, privateMemoHookDispatcherMetadata)
  );
}

function callPrivateEffectDispatcherHook(hookName, args) {
  const dispatcher = resolveDispatcher(hookName);
  const hook = getPrivateEffectDispatcherHook(dispatcher, hookName);
  const metadata = getEffectHookMetadata(hookName);
  return hook.apply(dispatcher, createPrivateEffectHookArgs(args, metadata));
}

function callPrivateStateDispatcherHook(hookName, args) {
  const dispatcher = resolveDispatcher(hookName);
  const hook = getPrivateStateDispatcherHook(dispatcher, hookName);
  return hook.apply(dispatcher, args);
}

function recordPrivateStartTransitionDispatcherRouting(callback, metadata) {
  const dispatcher = resolveDispatcher('useTransition');

  if (!isPrivateTransitionHookDispatcher(dispatcher)) {
    throw createInvalidHookCallError('useTransition');
  }

  validatePrivateTransitionHookDispatcherMetadata(metadata);

  if (typeof callback !== 'function') {
    throw createUnsupportedPrivateTransitionCallbackError();
  }

  return freezeRecord({
    dispatcher,
    action: callback,
    actionName: callback.name,
    actionLength: callback.length,
    metadata,
    laneMetadata: privateTransitionHookDispatcherMetadata.transitionLaneMetadata,
    pendingStateTupleShape:
      privateTransitionHookDispatcherMetadata.transitionPendingStateTupleShape,
    schedulerExecutionBlocked: true,
    rootSchedulingBlocked: true,
    rootExecutionBlocked: true,
    callbackExecutionBlocked: true,
    publicStartTransitionDispatcherRouting: false,
    compatibilityClaimed: false
  });
}

function createUnsupportedPlaceholderHookSurfaceCurrentnessRows(
  rowOverridesBySurfaceId
) {
  const rootReact = require('./index.js');
  const cjsDevelopmentReact = require('./cjs/react.development.js');
  const cjsProductionReact = require('./cjs/react.production.js');
  const reactServer = require('./react.react-server.js');
  const rowOverrides = rowOverridesBySurfaceId ?? {};
  const previousDispatcher = ReactSharedInternals.H;

  ReactSharedInternals.H = null;

  try {
    return freezeSurfaceCurrentnessRows(
      [
        describeUnsupportedPlaceholderHookSurfaceCurrentness({
          surfaceId: 'react-root',
          source: 'packages/react/index.js',
          entrypoint: 'react',
          moduleShape: 'default-root',
          moduleExports: rootReact,
          rootExports: rootReact
        }),
        describeUnsupportedPlaceholderHookSurfaceCurrentness({
          surfaceId: 'react-cjs-development',
          source: 'packages/react/cjs/react.development.js',
          entrypoint: 'react',
          moduleShape: 'cjs-root-alias',
          moduleExports: cjsDevelopmentReact,
          rootExports: rootReact
        }),
        describeUnsupportedPlaceholderHookSurfaceCurrentness({
          surfaceId: 'react-cjs-production',
          source: 'packages/react/cjs/react.production.js',
          entrypoint: 'react',
          moduleShape: 'cjs-root-alias',
          moduleExports: cjsProductionReact,
          rootExports: rootReact
        }),
        describeUnsupportedPlaceholderHookSurfaceCurrentness({
          surfaceId: 'react-server',
          source: 'packages/react/react.react-server.js',
          entrypoint: 'react react-server',
          moduleShape: 'react-server-root',
          moduleExports: reactServer,
          rootExports: rootReact
        })
      ].map((row) =>
        Object.prototype.hasOwnProperty.call(rowOverrides, row.surfaceId)
          ? { ...row, ...rowOverrides[row.surfaceId] }
          : row
      )
    );
  } finally {
    ReactSharedInternals.H = previousDispatcher;
  }
}

function describeUnsupportedPlaceholderHookSurfaceCurrentness({
  surfaceId,
  source,
  entrypoint,
  moduleShape,
  moduleExports,
  rootExports
}) {
  const availableHookNames = [];
  const absentHookNames = [];
  const placeholderThrowHookNames = [];
  const unexpectedReturnHookNames = [];
  const unexpectedErrorHookNames = [];
  const probeSideEffectNames = [];
  const probeArgsByHookName =
    createUnsupportedPlaceholderHookProbeArgs(probeSideEffectNames);

  for (const hookName of unsupportedPlaceholderHookNames) {
    if (!Object.prototype.hasOwnProperty.call(moduleExports, hookName)) {
      absentHookNames.push(hookName);
      continue;
    }

    availableHookNames.push(hookName);

    try {
      moduleExports[hookName].apply(
        moduleExports,
        probeArgsByHookName[hookName]
      );
      unexpectedReturnHookNames.push(hookName);
    } catch (error) {
      if (isUnsupportedPlaceholderHookProbeError(error, hookName)) {
        placeholderThrowHookNames.push(hookName);
      } else {
        unexpectedErrorHookNames.push(hookName);
      }
    }
  }

  return {
    surfaceId,
    source,
    entrypoint: moduleExports.__FAST_REACT_ENTRYPOINT__ ?? entrypoint,
    moduleShape,
    sameAsRootExport: moduleExports === rootExports,
    hookNames: unsupportedPlaceholderHookNames,
    availableHookNames,
    absentHookNames,
    placeholderThrowHookNames,
    unexpectedReturnHookNames,
    unexpectedErrorHookNames,
    probeSideEffectNames,
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
  };
}

function createUnsupportedPlaceholderHookProbeArgs(sideEffects) {
  return {
    useActionState: [
      () => {
        sideEffects.push('useActionStateAction');
        return 'action';
      },
      'initial',
      '/permalink'
    ],
    useOptimistic: [
      'passthrough',
      () => {
        sideEffects.push('useOptimisticReducer');
        return 'optimistic';
      }
    ],
    useSyncExternalStore: [
      () => {
        sideEffects.push('useSyncExternalStoreSubscribe');
        return () => {
          sideEffects.push('useSyncExternalStoreUnsubscribe');
        };
      },
      () => {
        sideEffects.push('useSyncExternalStoreGetSnapshot');
        return 'snapshot';
      },
      () => {
        sideEffects.push('useSyncExternalStoreGetServerSnapshot');
        return 'serverSnapshot';
      }
    ],
    useEffectEvent: [
      () => {
        sideEffects.push('useEffectEventCallback');
      }
    ],
    useId: [],
    useDebugValue: [
      'debug-value',
      () => {
        sideEffects.push('useDebugValueFormatter');
        return 'debug';
      }
    ]
  };
}

function isUnsupportedPlaceholderHookProbeError(error, hookName) {
  return (
    isObjectLike(error) &&
    error.name === 'FastReactUnimplementedError' &&
    error.code === 'FAST_REACT_UNIMPLEMENTED' &&
    error.entrypoint === 'react' &&
    error.exportName === hookName &&
    error.compatibilityTarget === 'react@19.2.6'
  );
}

function createUnsupportedPlaceholderHookCurrentnessReport(overrides = {}) {
  const normalized = overrides ?? {};
  const hasSurfaceCurrentnessRowsOverride =
    Object.prototype.hasOwnProperty.call(normalized, 'surfaceCurrentnessRows');
  const surfaceCurrentnessRows = hasSurfaceCurrentnessRowsOverride
    ? freezeSurfaceCurrentnessRows(normalized.surfaceCurrentnessRows)
    : createUnsupportedPlaceholderHookSurfaceCurrentnessRows(
        normalized.surfaceCurrentnessRowOverrides
      );
  const report = freezeRecord({
    kind: unsupportedPlaceholderHookCurrentnessReportKind,
    version: unsupportedPlaceholderHookCurrentnessReportVersion,
    status: unsupportedPlaceholderHookCurrentnessStatus,
    compatibilityTarget: 'react@19.2.6',
    hookNames: freezeArray(
      normalized.hookNames ?? unsupportedPlaceholderHookNames
    ),
    publicShapeBlockers: freezeRecordArray(
      normalized.publicShapeBlockers ??
        unsupportedPlaceholderHookPublicShapeBlockers
    ),
    sourceReport: freezeRecord({
      ...unsupportedPlaceholderHookSourceReport,
      ...(normalized.sourceReport ?? {})
    }),
    blockerCurrentness: freezeRecord({
      ...unsupportedPlaceholderHookBlockerCurrentness,
      ...(normalized.blockerCurrentness ?? {})
    }),
    callbackInvocationReport: freezeRecord({
      ...unsupportedPlaceholderHookCallbackInvocationReport,
      ...(normalized.callbackInvocationReport ?? {})
    }),
    externalStoreInvocationReport: freezeRecord({
      ...unsupportedPlaceholderHookExternalStoreInvocationReport,
      ...(normalized.externalStoreInvocationReport ?? {})
    }),
    idGenerationReport: freezeRecord({
      ...unsupportedPlaceholderHookIdGenerationReport,
      ...(normalized.idGenerationReport ?? {})
    }),
    surfaceCurrentnessFieldNames: freezeArray(
      normalized.surfaceCurrentnessFieldNames ??
        unsupportedPlaceholderHookSurfaceCurrentnessFieldNames
    ),
    surfaceCurrentnessRows,
    cjsSurfaceCurrentnessBlocked:
      normalized.cjsSurfaceCurrentnessBlocked ?? true,
    reactServerSurfaceCurrentnessBlocked:
      normalized.reactServerSurfaceCurrentnessBlocked ?? true,
    publicExportsPlaceholderBlocked:
      normalized.publicExportsPlaceholderBlocked ?? true,
    compatibilityClaimed: normalized.compatibilityClaimed ?? false,
    publicCompatibilityClaimed:
      normalized.publicCompatibilityClaimed ?? false,
    publicHookCompatibility: normalized.publicHookCompatibility ?? false,
    exposesPublicHookImplementation:
      normalized.exposesPublicHookImplementation ?? false,
    dispatcherRouting: normalized.dispatcherRouting ?? false,
    dispatcherPrerequisitesReady:
      normalized.dispatcherPrerequisitesReady ?? false,
    schedulerIntegration: normalized.schedulerIntegration ?? false,
    schedulerPrerequisitesReady:
      normalized.schedulerPrerequisitesReady ?? false,
    rootLaneIntegration: normalized.rootLaneIntegration ?? false,
    rootScheduling: normalized.rootScheduling ?? false,
    rendererIntegration: normalized.rendererIntegration ?? false,
    rendererCompatibility: normalized.rendererCompatibility ?? false,
    invokesCallbacks: normalized.invokesCallbacks ?? false,
    invokesActionStateAction:
      normalized.invokesActionStateAction ?? false,
    invokesOptimisticReducer:
      normalized.invokesOptimisticReducer ?? false,
    invokesEffectEventCallback:
      normalized.invokesEffectEventCallback ?? false,
    invokesDebugValueFormatter:
      normalized.invokesDebugValueFormatter ?? false,
    callbackExecutionClaimed:
      normalized.callbackExecutionClaimed ?? false,
    invokesExternalStoreSubscribe:
      normalized.invokesExternalStoreSubscribe ?? false,
    invokesExternalStoreGetSnapshot:
      normalized.invokesExternalStoreGetSnapshot ?? false,
    invokesExternalStoreGetServerSnapshot:
      normalized.invokesExternalStoreGetServerSnapshot ?? false,
    externalStoreSubscriptionClaimed:
      normalized.externalStoreSubscriptionClaimed ?? false,
    externalStoreSnapshotReadClaimed:
      normalized.externalStoreSnapshotReadClaimed ?? false,
    generatesIds: normalized.generatesIds ?? false,
    allocatesTreeIds: normalized.allocatesTreeIds ?? false,
    claimsHydrationIdPrefix:
      normalized.claimsHydrationIdPrefix ?? false
  });

  if (!hasSurfaceCurrentnessRowsOverride) {
    unsupportedPlaceholderHookSurfaceCurrentnessRowsByReport.set(
      report,
      surfaceCurrentnessRows
    );
  }

  unsupportedPlaceholderHookCurrentnessReports.add(report);
  unsupportedPlaceholderHookCurrentnessReportOverrideKeys.set(
    report,
    freezeArray(Object.keys(normalized))
  );
  return report;
}

function consumeUnsupportedPlaceholderHookCurrentnessReport(report) {
  const rejectionReason =
    validateUnsupportedPlaceholderHookCurrentnessReport(report);

  if (rejectionReason !== null) {
    throw createUnsupportedPlaceholderHookCurrentnessGateError(
      rejectionReason
    );
  }

  return freezeRecord({
    status: unsupportedPlaceholderHookCurrentnessConsumptionStatus,
    accepted: true,
    currentnessStatus: report.status,
    compatibilityTarget: 'react@19.2.6',
    hookNames: report.hookNames,
    surfaceCurrentnessRows: report.surfaceCurrentnessRows,
    cjsSurfaceCurrentnessBlocked: true,
    reactServerSurfaceCurrentnessBlocked: true,
    publicExportsPlaceholderBlocked: true,
    dispatcherRoutingBlocked: true,
    dispatcherPrerequisitesReady: false,
    schedulerPrerequisitesReady: false,
    rootLaneIntegration: false,
    rootScheduling: false,
    rendererCompatibility: false,
    callbackInvocationBlocked: true,
    externalStoreInvocationBlocked: true,
    idGenerationBlocked: true,
    debugValueInstrumentationBlocked: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createPrivateEffectHookArgs(args, metadata) {
  const privateArgs = Array.prototype.slice.call(args);
  privateArgs.push(metadata);
  return privateArgs;
}

function createPrivateCallbackHookArgs(args, metadata) {
  const privateArgs = Array.prototype.slice.call(args);
  privateArgs.push(metadata);
  return privateArgs;
}

function createPrivateMemoHookArgs(args, metadata) {
  const privateArgs = Array.prototype.slice.call(args);
  privateArgs.push(metadata);
  return privateArgs;
}

function getPrivateCallbackHookDispatcherMetadata(dispatcher) {
  if (!isPrivateCallbackHookDispatcher(dispatcher)) {
    return null;
  }

  return privateCallbackHookDispatcherMetadataByDispatcher.get(dispatcher);
}

function getPrivateMemoHookDispatcherMetadata(dispatcher) {
  if (!isPrivateMemoHookDispatcher(dispatcher)) {
    return null;
  }

  return privateMemoHookDispatcherMetadataByDispatcher.get(dispatcher);
}

function getPrivateContextHookDispatcherMetadata(dispatcher) {
  if (!isPrivateContextHookDispatcher(dispatcher)) {
    return null;
  }

  return privateContextHookDispatcherMetadataByDispatcher.get(dispatcher);
}

function getPrivateEffectHookDispatcherMetadata(dispatcher) {
  if (!isPrivateEffectHookDispatcher(dispatcher)) {
    return null;
  }

  return privateEffectHookDispatcherMetadataByDispatcher.get(dispatcher);
}

function getPrivateStateHookDispatcherMetadata(dispatcher) {
  if (!isPrivateStateHookDispatcher(dispatcher)) {
    return null;
  }

  return privateStateHookDispatcherMetadataByDispatcher.get(dispatcher);
}

function getPrivateTransitionHookDispatcherMetadata(dispatcher) {
  if (!isPrivateTransitionHookDispatcher(dispatcher)) {
    return null;
  }

  return privateTransitionHookDispatcherMetadataByDispatcher.get(dispatcher);
}

function isPrivateStateHookDispatcherMetadata(metadata) {
  if (
    !isObjectLike(metadata) ||
    metadata.capability !== privateStateHookDispatcherMetadata.capability ||
    metadata.compatibilityTarget !==
      privateStateHookDispatcherMetadata.compatibilityTarget ||
    metadata.compatibilityClaimed !== false ||
    metadata.exposesPublicHookImplementation !== false ||
    metadata.rendererIntegration !== false ||
    metadata.schedulesPublicJsUpdates !== false
  ) {
    return false;
  }

  for (const key of privateStateHookDispatcherMetadataArrayKeys) {
    if (
      !hasSameStringArray(
        metadata[key],
        privateStateHookDispatcherMetadata[key]
      )
    ) {
      return false;
    }
  }

  return true;
}

function isPrivateCallbackHookDispatcherMetadata(metadata) {
  if (
    !isObjectLike(metadata) ||
    metadata.capability !== privateCallbackHookDispatcherMetadata.capability ||
    metadata.compatibilityTarget !==
      privateCallbackHookDispatcherMetadata.compatibilityTarget ||
    metadata.compatibilityClaimed !== false ||
    metadata.exposesPublicHookImplementation !== false ||
    metadata.rendererIntegration !== false ||
    metadata.schedulesPublicJsUpdates !== false ||
    metadata.executesCallback !== false
  ) {
    return false;
  }

  for (const key of privateCallbackHookDispatcherMetadataArrayKeys) {
    if (
      !hasSameStringArray(
        metadata[key],
        privateCallbackHookDispatcherMetadata[key]
      )
    ) {
      return false;
    }
  }

  return true;
}

function isPrivateMemoHookDispatcherMetadata(metadata) {
  if (
    !isObjectLike(metadata) ||
    metadata.capability !== privateMemoHookDispatcherMetadata.capability ||
    metadata.compatibilityTarget !==
      privateMemoHookDispatcherMetadata.compatibilityTarget ||
    metadata.compatibilityClaimed !== false ||
    metadata.exposesPublicHookImplementation !== false ||
    metadata.rendererIntegration !== false ||
    metadata.schedulesPublicJsUpdates !== false ||
    metadata.executesCreate !== false
  ) {
    return false;
  }

  for (const key of privateMemoHookDispatcherMetadataArrayKeys) {
    if (
      !hasSameStringArray(metadata[key], privateMemoHookDispatcherMetadata[key])
    ) {
      return false;
    }
  }

  return true;
}

function isPrivateContextHookDispatcherMetadata(metadata) {
  if (
    !isObjectLike(metadata) ||
    metadata.capability !== privateContextHookDispatcherMetadata.capability ||
    metadata.compatibilityTarget !==
      privateContextHookDispatcherMetadata.compatibilityTarget ||
    metadata.compatibilityClaimed !== false ||
    metadata.exposesPublicHookImplementation !== false ||
    metadata.rendererIntegration !== false ||
    metadata.runtimeProviderPropagation !== false ||
    metadata.rendererVisiblePropagation !== false
  ) {
    return false;
  }

  for (const key of privateContextHookDispatcherMetadataArrayKeys) {
    if (
      !hasSameStringArray(
        metadata[key],
        privateContextHookDispatcherMetadata[key]
      )
    ) {
      return false;
    }
  }

  return true;
}

function isPrivateEffectHookDispatcherMetadata(metadata) {
  if (
    !isObjectLike(metadata) ||
    metadata.capability !== privateEffectHookDispatcherMetadata.capability ||
    metadata.compatibilityTarget !==
      privateEffectHookDispatcherMetadata.compatibilityTarget ||
    metadata.compatibilityClaimed !== false ||
    metadata.exposesPublicHookImplementation !== false ||
    metadata.rendererIntegration !== false ||
    metadata.schedulesPublicAct !== false ||
    metadata.executesEffectCallbacks !== false
  ) {
    return false;
  }

  for (const key of privateEffectHookDispatcherMetadataArrayKeys) {
    if (
      !hasSameStringArray(
        metadata[key],
        privateEffectHookDispatcherMetadata[key]
      )
    ) {
      return false;
    }
  }

  return true;
}

function isPrivateTransitionHookDispatcherMetadata(metadata) {
  if (
    !isObjectLike(metadata) ||
    metadata.capability !==
      privateTransitionHookDispatcherMetadata.capability ||
    metadata.compatibilityTarget !==
      privateTransitionHookDispatcherMetadata.compatibilityTarget
  ) {
    return false;
  }

  for (const flagName of transitionHookCompatibilityFalseFlags) {
    if (metadata[flagName] !== false) {
      return false;
    }
  }

  for (const key of privateTransitionHookDispatcherMetadataArrayKeys) {
    if (
      !hasSameStringArray(
        metadata[key],
        privateTransitionHookDispatcherMetadata[key]
      )
    ) {
      return false;
    }
  }

  return (
    hasSamePublicShapeBlockers(
      metadata.publicShapeBlockers,
      privateTransitionHookDispatcherMetadata.publicShapeBlockers
    ) &&
    hasSameRecordFields(
      metadata.startTransitionPublicRoutingBlocker,
      privateTransitionHookDispatcherMetadata.startTransitionPublicRoutingBlocker,
      transitionStartTransitionPublicRoutingBlockerFields
    ) &&
    hasSameRecordFields(
      metadata.transitionLaneMetadata,
      privateTransitionHookDispatcherMetadata.transitionLaneMetadata,
      transitionLaneMetadataFieldNames
    ) &&
    hasSameRecordFields(
      metadata.transitionPendingStateTupleShape,
      privateTransitionHookDispatcherMetadata.transitionPendingStateTupleShape,
      transitionPendingStateTupleFieldNames
    ) &&
    hasSameRecordFields(
      metadata.blockerCurrentness,
      privateTransitionHookDispatcherMetadata.blockerCurrentness,
      transitionHookBlockerCurrentnessFieldNames
    )
  );
}

function isPrivateUnsupportedPlaceholderHookBlockerMetadata(metadata) {
  if (
    !isObjectLike(metadata) ||
    metadata.capability !==
      privateUnsupportedPlaceholderHookBlockerMetadata.capability ||
    metadata.compatibilityTarget !==
      privateUnsupportedPlaceholderHookBlockerMetadata.compatibilityTarget ||
    metadata.cjsSurfaceCurrentnessBlocked !== true ||
    metadata.reactServerSurfaceCurrentnessBlocked !== true
  ) {
    return false;
  }

  for (const flagName of unsupportedPlaceholderHookCompatibilityFalseFlags) {
    if (metadata[flagName] !== false) {
      return false;
    }
  }

  for (const key of privateUnsupportedPlaceholderHookBlockerMetadataArrayKeys) {
    if (
      !hasSameStringArray(
        metadata[key],
        privateUnsupportedPlaceholderHookBlockerMetadata[key]
      )
    ) {
      return false;
    }
  }

  return (
    hasSameRecordArrayFields(
      metadata.publicShapeBlockers,
      privateUnsupportedPlaceholderHookBlockerMetadata.publicShapeBlockers,
      unsupportedPlaceholderHookPublicShapeBlockerFields
    ) &&
    hasSameRecordFields(
      metadata.sourceReport,
      privateUnsupportedPlaceholderHookBlockerMetadata.sourceReport,
      unsupportedPlaceholderHookSourceReportFieldNames
    ) &&
    hasSameRecordFields(
      metadata.blockerCurrentness,
      privateUnsupportedPlaceholderHookBlockerMetadata.blockerCurrentness,
      unsupportedPlaceholderHookBlockerCurrentnessFieldNames
    ) &&
    hasSameRecordFields(
      metadata.callbackInvocationReport,
      privateUnsupportedPlaceholderHookBlockerMetadata.callbackInvocationReport,
      unsupportedPlaceholderHookCallbackInvocationReportFieldNames
    ) &&
    hasSameRecordFields(
      metadata.externalStoreInvocationReport,
      privateUnsupportedPlaceholderHookBlockerMetadata
        .externalStoreInvocationReport,
      unsupportedPlaceholderHookExternalStoreInvocationReportFieldNames
    ) &&
    hasSameRecordFields(
      metadata.idGenerationReport,
      privateUnsupportedPlaceholderHookBlockerMetadata.idGenerationReport,
      unsupportedPlaceholderHookIdGenerationReportFieldNames
    ) &&
    hasSameSurfaceCurrentnessRows(
      metadata.surfaceCurrentnessRows,
      privateUnsupportedPlaceholderHookBlockerMetadata.surfaceCurrentnessRows
    )
  );
}

function isUnsupportedPlaceholderHookCurrentnessReport(report) {
  return validateUnsupportedPlaceholderHookCurrentnessReport(report) === null;
}

function validateUnsupportedPlaceholderHookCurrentnessReport(report) {
  if (!isObjectLike(report) || !Object.isFrozen(report)) {
    return 'unsupported-placeholder-hook-currentness-not-frozen';
  }

  if (!unsupportedPlaceholderHookCurrentnessReports.has(report)) {
    return 'unsupported-placeholder-hook-currentness-source-proof';
  }

  if (
    report.kind !== unsupportedPlaceholderHookCurrentnessReportKind ||
    report.version !== unsupportedPlaceholderHookCurrentnessReportVersion ||
    report.status !== unsupportedPlaceholderHookCurrentnessStatus ||
    report.compatibilityTarget !== 'react@19.2.6' ||
    !hasSameStringArray(report.hookNames, unsupportedPlaceholderHookNames) ||
    !hasSameStringArray(
      report.surfaceCurrentnessFieldNames,
      unsupportedPlaceholderHookSurfaceCurrentnessFieldNames
    ) ||
    report.cjsSurfaceCurrentnessBlocked !== true ||
    report.reactServerSurfaceCurrentnessBlocked !== true ||
    report.publicExportsPlaceholderBlocked !== true
  ) {
    return 'unsupported-placeholder-hook-currentness-shape';
  }

  if (
    !hasSameRecordArrayFields(
      report.publicShapeBlockers,
      unsupportedPlaceholderHookPublicShapeBlockers,
      unsupportedPlaceholderHookPublicShapeBlockerFields
    )
  ) {
    return 'unsupported-placeholder-hook-currentness-public-shape';
  }

  if (
    !hasSameRecordFields(
      report.sourceReport,
      unsupportedPlaceholderHookSourceReport,
      unsupportedPlaceholderHookSourceReportFieldNames
    )
  ) {
    return 'unsupported-placeholder-hook-currentness-source-report';
  }

  if (
    !hasSameRecordFields(
      report.blockerCurrentness,
      unsupportedPlaceholderHookBlockerCurrentness,
      unsupportedPlaceholderHookBlockerCurrentnessFieldNames
    )
  ) {
    return 'unsupported-placeholder-hook-currentness-blocker-currentness';
  }

  if (
    unsupportedPlaceholderHookSurfaceCurrentnessRowsByReport.get(report) !==
    report.surfaceCurrentnessRows
  ) {
    return 'unsupported-placeholder-hook-currentness-surface-currentness-source-proof';
  }

  if (
    !hasSameSurfaceCurrentnessRows(
      report.surfaceCurrentnessRows,
      unsupportedPlaceholderHookSurfaceCurrentnessRows
    )
  ) {
    return 'unsupported-placeholder-hook-currentness-surface-currentness';
  }

  if (!hasBlockedUnsupportedPlaceholderHookPublicCompatibilityClaims(report)) {
    return 'unsupported-placeholder-hook-currentness-public-compatibility-claim';
  }

  if (!hasBlockedUnsupportedPlaceholderHookPrerequisites(report)) {
    return 'unsupported-placeholder-hook-currentness-prerequisite-smuggling';
  }

  if (!hasBlockedUnsupportedPlaceholderHookCallbackInvocations(report)) {
    return 'unsupported-placeholder-hook-currentness-callback-invocation-claim';
  }

  if (!hasBlockedUnsupportedPlaceholderHookExternalStoreInvocations(report)) {
    return 'unsupported-placeholder-hook-currentness-external-store-claim';
  }

  if (!hasBlockedUnsupportedPlaceholderHookIdGeneration(report)) {
    return 'unsupported-placeholder-hook-currentness-id-generation-claim';
  }

  const overrideKeys =
    unsupportedPlaceholderHookCurrentnessReportOverrideKeys.get(report) ||
    freezeArray([]);
  if (overrideKeys.length > 0) {
    return 'unsupported-placeholder-hook-currentness-caller-overrides';
  }

  return null;
}

function validatePrivateStateHookDispatcherMetadata(metadata) {
  if (!isPrivateStateHookDispatcherMetadata(metadata)) {
    throw createMissingPrivateStateHookDispatcherError('useState');
  }
}

function validatePrivateCallbackHookDispatcherMetadata(metadata) {
  if (!isPrivateCallbackHookDispatcherMetadata(metadata)) {
    throw createInvalidHookCallError('useCallback');
  }
}

function validatePrivateMemoHookDispatcherMetadata(metadata) {
  if (!isPrivateMemoHookDispatcherMetadata(metadata)) {
    throw createInvalidHookCallError('useMemo');
  }
}

function validatePrivateContextHookDispatcherMetadata(metadata) {
  if (!isPrivateContextHookDispatcherMetadata(metadata)) {
    throw createInvalidHookCallError('useContext');
  }
}

function validatePrivateEffectHookDispatcherMetadata(metadata) {
  if (!isPrivateEffectHookDispatcherMetadata(metadata)) {
    throw createInvalidHookCallError('useEffect');
  }
}

function validatePrivateTransitionHookDispatcherMetadata(metadata) {
  if (!isPrivateTransitionHookDispatcherMetadata(metadata)) {
    throw createInvalidHookCallError('useTransition');
  }
}

function hasSameStringArray(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      return false;
    }
  }

  return true;
}

function hasSamePublicShapeBlockers(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    const actualRecord = actual[index];
    const expectedRecord = expected[index];

    if (!isObjectLike(actualRecord)) {
      return false;
    }

    for (const fieldName of transitionHookPublicShapeBlockerFields) {
      if (actualRecord[fieldName] !== expectedRecord[fieldName]) {
        return false;
      }
    }
  }

  return true;
}

function hasSameRecordFields(actual, expected, fieldNames) {
  if (!isObjectLike(actual)) {
    return false;
  }

  for (const fieldName of fieldNames) {
    if (actual[fieldName] !== expected[fieldName]) {
      return false;
    }
  }

  return true;
}

function hasSameRecordArrayFields(actual, expected, fieldNames) {
  if (!Array.isArray(actual) || actual.length !== expected.length) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (!hasSameRecordFields(actual[index], expected[index], fieldNames)) {
      return false;
    }
  }

  return true;
}

function hasSameSurfaceCurrentnessRows(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (!hasSameSurfaceCurrentnessRow(actual[index], expected[index])) {
      return false;
    }
  }

  return true;
}

function hasSameSurfaceCurrentnessRow(actual, expected) {
  if (!isObjectLike(actual) || !Object.isFrozen(actual)) {
    return false;
  }

  for (const fieldName of unsupportedPlaceholderHookSurfaceCurrentnessFieldNames) {
    const expectedValue = expected[fieldName];
    const actualValue = actual[fieldName];

    if (
      unsupportedPlaceholderHookSurfaceCurrentnessArrayFieldNames.includes(
        fieldName
      )
    ) {
      if (!hasSameStringArray(actualValue, expectedValue)) {
        return false;
      }
      continue;
    }

    if (actualValue !== expectedValue) {
      return false;
    }
  }

  return true;
}

function hasBlockedUnsupportedPlaceholderHookPublicCompatibilityClaims(report) {
  for (const flagName of unsupportedPlaceholderHookPublicCompatibilityFalseFlags) {
    if (report[flagName] !== false) {
      return false;
    }
  }

  return true;
}

function hasBlockedUnsupportedPlaceholderHookPrerequisites(report) {
  for (const flagName of unsupportedPlaceholderHookPrerequisiteFalseFlags) {
    if (report[flagName] !== false) {
      return false;
    }
  }

  return true;
}

function hasBlockedUnsupportedPlaceholderHookCallbackInvocations(report) {
  for (const flagName of unsupportedPlaceholderHookCallbackInvocationFalseFlags) {
    if (report[flagName] !== false) {
      return false;
    }
  }

  return hasSameRecordFields(
    report.callbackInvocationReport,
    unsupportedPlaceholderHookCallbackInvocationReport,
    unsupportedPlaceholderHookCallbackInvocationReportFieldNames
  );
}

function hasBlockedUnsupportedPlaceholderHookExternalStoreInvocations(report) {
  for (const flagName of unsupportedPlaceholderHookExternalStoreInvocationFalseFlags) {
    if (report[flagName] !== false) {
      return false;
    }
  }

  return hasSameRecordFields(
    report.externalStoreInvocationReport,
    unsupportedPlaceholderHookExternalStoreInvocationReport,
    unsupportedPlaceholderHookExternalStoreInvocationReportFieldNames
  );
}

function hasBlockedUnsupportedPlaceholderHookIdGeneration(report) {
  for (const flagName of unsupportedPlaceholderHookIdGenerationFalseFlags) {
    if (report[flagName] !== false) {
      return false;
    }
  }

  return hasSameRecordFields(
    report.idGenerationReport,
    unsupportedPlaceholderHookIdGenerationReport,
    unsupportedPlaceholderHookIdGenerationReportFieldNames
  );
}

function freezeArray(values) {
  return Object.freeze(values.slice());
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function freezeSurfaceCurrentnessRow(row) {
  const surfaceRow = {};

  for (const fieldName of unsupportedPlaceholderHookSurfaceCurrentnessFieldNames) {
    if (
      unsupportedPlaceholderHookSurfaceCurrentnessArrayFieldNames.includes(
        fieldName
      )
    ) {
      surfaceRow[fieldName] = freezeArray(row[fieldName] ?? []);
    } else {
      surfaceRow[fieldName] = row[fieldName];
    }
  }

  return freezeRecord(surfaceRow);
}

function freezeSurfaceCurrentnessRows(rows) {
  return freezeArray((rows ?? []).map(freezeSurfaceCurrentnessRow));
}

function freezeRecordArray(records) {
  return Object.freeze(records.map((record) => freezeRecord({ ...record })));
}

function defineHookFunctionShape(fn, length) {
  Object.defineProperties(fn, {
    length: {
      configurable: true,
      value: length
    },
    name: {
      configurable: true,
      value: ''
    }
  });

  return fn;
}

const use = defineHookFunctionShape(function (usable) {
  return callDispatcherHook('use', arguments);
}, 1);

const useCallback = defineHookFunctionShape(function (callback, deps) {
  return callPrivateCallbackDispatcherHook('useCallback', arguments);
}, 2);

const useContext = defineHookFunctionShape(function (Context) {
  return callPrivateContextDispatcherHook('useContext', arguments);
}, 1);

const useEffect = defineHookFunctionShape(function (create, deps) {
  return callPrivateEffectDispatcherHook('useEffect', arguments);
}, 2);

const useImperativeHandle = defineHookFunctionShape(function (ref, create, deps) {
  return callPrivateEffectDispatcherHook('useImperativeHandle', arguments);
}, 3);

const useInsertionEffect = defineHookFunctionShape(function (create, deps) {
  return callPrivateEffectDispatcherHook('useInsertionEffect', arguments);
}, 2);

const useLayoutEffect = defineHookFunctionShape(function (create, deps) {
  return callPrivateEffectDispatcherHook('useLayoutEffect', arguments);
}, 2);

const useMemo = defineHookFunctionShape(function (create, deps) {
  return callPrivateMemoDispatcherHook('useMemo', arguments);
}, 2);

const useReducer = defineHookFunctionShape(function (reducer, initialArg, init) {
  return callPrivateStateDispatcherHook('useReducer', arguments);
}, 3);

const useRef = defineHookFunctionShape(function (initialValue) {
  return callDispatcherHook('useRef', arguments);
}, 1);

const useState = defineHookFunctionShape(function (initialState) {
  return callPrivateStateDispatcherHook('useState', arguments);
}, 1);

module.exports = {
  ReactCurrentDispatcher,
  ReactSharedInternals,
  callDispatcherHook,
  callPrivateCallbackDispatcherHook,
  callPrivateContextDispatcherHook,
  callPrivateEffectDispatcherHook,
  callPrivateMemoDispatcherHook,
  callPrivateStateDispatcherHook,
  consumeUnsupportedPlaceholderHookCurrentnessReport,
  createInvalidHookCallError,
  createMissingPrivateStateHookDispatcherError,
  createUnsupportedPlaceholderHookCurrentnessReport,
  createUnsupportedPrivateTransitionCallbackError,
  effectHookMetadataByHookName,
  effectHookNames,
  getEffectHookMetadata,
  getPrivateCallbackHookDispatcherMetadata,
  getPrivateContextHookDispatcherMetadata,
  getPrivateEffectHookDispatcherMetadata,
  getPrivateMemoHookDispatcherMetadata,
  getPrivateStateHookDispatcherMetadata,
  getPrivateTransitionHookDispatcherMetadata,
  invalidHookCallErrorCode,
  invalidHookCallMessage,
  isPrivateUnsupportedPlaceholderHookBlockerMetadata,
  isPrivateCallbackHookDispatcher,
  isPrivateCallbackHookDispatcherMetadata,
  isPrivateContextHookDispatcher,
  isPrivateContextHookDispatcherMetadata,
  isPrivateEffectHookDispatcher,
  isPrivateEffectHookDispatcherMetadata,
  isPrivateMemoHookDispatcher,
  isPrivateMemoHookDispatcherMetadata,
  isPrivateStateHookDispatcher,
  isPrivateStateHookDispatcherMetadata,
  isPrivateTransitionHookDispatcher,
  isPrivateTransitionHookDispatcherMetadata,
  isUnsupportedPlaceholderHookCurrentnessReport,
  markPrivateCallbackHookDispatcher,
  markPrivateContextHookDispatcher,
  markPrivateEffectHookDispatcher,
  markPrivateMemoHookDispatcher,
  markPrivateStateHookDispatcher,
  markPrivateTransitionHookDispatcher,
  privateUnsupportedPlaceholderHookBlockerMetadata,
  privateCallbackHookDispatcherMetadata,
  privateContextHookDispatcherMetadata,
  privateEffectHookDispatcherMetadata,
  privateMemoHookDispatcherMetadata,
  privateStateHookDispatcherMetadata,
  privateTransitionHookDispatcherMetadata,
  recordPrivateStartTransitionDispatcherRouting,
  resolveDispatcher,
  transitionHookNames,
  unsupportedPlaceholderHookSurfaceCurrentnessFieldNames,
  unsupportedPlaceholderHookSurfaceCurrentnessRows,
  unsupportedPlaceholderHookCurrentnessConsumptionStatus,
  unsupportedPlaceholderHookCurrentnessStatus,
  unsupportedPlaceholderHookNames,
  validateUnsupportedPlaceholderHookCurrentnessReport,
  use,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState
};
