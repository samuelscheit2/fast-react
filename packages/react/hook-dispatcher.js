'use strict';

const {
  createContext: createSourceOwnedContextObject,
  isSourceOwnedContextObject
} = require('./context-object.js');
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
const privateRefHookDispatchers = new WeakSet();
const privateRefHookDispatcherMetadataByDispatcher = new WeakMap();
const privateContextHookDispatchers = new WeakSet();
const privateContextHookDispatcherMetadataByDispatcher = new WeakMap();
const privateTransitionHookDispatchers = new WeakSet();
const privateTransitionHookDispatcherMetadataByDispatcher = new WeakMap();
const useRefHookCurrentnessReports = new WeakSet();
const useRefHookSurfaceCurrentnessRowsByReport = new WeakMap();
const useRefHookExecutionEvidenceReports = new WeakSet();
const useRefHookExecutionRefObjects = new WeakSet();
const useRefHookExecutionEvidenceOverrideKeysByReport = new WeakMap();
const useRefHookRendererLifecycleBlockerReports = new WeakSet();
const useRefHookRendererLifecycleBlockerRowsByReport = new WeakMap();
const useRefHookRendererLifecycleBlockerOverrideKeysByReport = new WeakMap();
const contextHookRendererReadinessReports = new WeakSet();
const contextHookRendererReadinessRowsByReport = new WeakMap();
const contextHookRendererReadinessOverrideKeysByReport = new WeakMap();
const contextHookRendererReadinessContextObjectSnapshotsByReport =
  new WeakMap();
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
const contextHookNames = freezeArray(['useContext']);
const contextHookRendererReadinessSourceReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'reactSourceTag',
  'reactSourceCommit',
  'reactHooksSource',
  'reactClientSource',
  'reactReconcilerSource',
  'fastReactSource',
  'fastReactContextObjectSource',
  'privateDispatcherMetadataCapability',
  'createContextDirectObjectBehaviorAdmitted',
  'privateUseContextProviderReadinessAccepted',
  'publicUseContextCompatibilityAdmitted',
  'compatibilityClaimed'
]);
const contextHookRendererReadinessSourceReport = freezeRecord({
  kind: 'fast-react.private.context_hook_renderer_readiness_source_report',
  version: 1,
  status:
    'source-current-for-react-19.2.6-useContext-provider-renderer-blockers',
  reactSourceTag: 'v19.2.6',
  reactSourceCommit: 'eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401',
  reactHooksSource: 'packages/react/src/ReactHooks.js',
  reactClientSource: 'packages/react/src/ReactClient.js',
  reactReconcilerSource:
    'packages/react-reconciler/src/ReactFiberNewContext.js',
  fastReactSource: 'packages/react/hook-dispatcher.js',
  fastReactContextObjectSource: 'packages/react/context-object.js',
  privateDispatcherMetadataCapability:
    'fast-react.private.context_hook_dispatcher',
  createContextDirectObjectBehaviorAdmitted: true,
  privateUseContextProviderReadinessAccepted: false,
  publicUseContextCompatibilityAdmitted: false,
  compatibilityClaimed: false
});
const contextHookRendererReadinessRowFieldNames = freezeArray([
  'rowId',
  'acceptedPrivateEvidence',
  'sourceOwnedEvidence',
  'missingRendererProviderPrerequisite',
  'requiredPublicEvidence',
  'currentBlocked',
  'compatibilityClaimed'
]);
const contextHookRendererReadinessRows = freezeContextRendererReadinessRows([
  {
    rowId: 'context-object-consumption-not-source-owned-renderer-read',
    acceptedPrivateEvidence: 'React.createContext direct object oracle',
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      'source-owned context object consumption through renderer-owned Provider state',
    requiredPublicEvidence:
      'useContext reads the nearest Provider value through a renderer root',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: 'private-dispatcher-not-root-render-backed',
    acceptedPrivateEvidence: 'private context hook dispatcher marker',
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      'renderer-owned dispatcher installation during function component render',
    requiredPublicEvidence:
      'renderWithHooks installs and tears down the context dispatcher for the current fiber',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: 'provider-begin-work-not-default-renderer-integrated',
    acceptedPrivateEvidence: 'private ContextProvider begin-work handoffs',
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      'default begin-work ContextProvider traversal for public Provider elements',
    requiredPublicEvidence:
      'Provider fibers push values, reconcile children, and unwind in broad renderer trees',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: 'context-dependencies-not-renderer-visible',
    acceptedPrivateEvidence: 'private context dependency metadata',
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      'fiber-owned context dependency list and propagation lanes',
    requiredPublicEvidence:
      'changed Provider values mark dependent consumers under renderer-visible dependencies',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: 'suspense-nested-provider-propagation-not-admitted',
    acceptedPrivateEvidence: 'private exact nested-provider canaries',
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      'Suspense, Offscreen, sibling, array, and nested-provider propagation',
    requiredPublicEvidence:
      'broad context propagation remains current across interrupted and nested renderer work',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    rowId: 'root-scheduler-package-compatibility-not-admitted',
    acceptedPrivateEvidence: 'blocked package-private context diagnostics',
    sourceOwnedEvidence: true,
    missingRendererProviderPrerequisite:
      'root scheduling, Scheduler timing, act, and package compatibility evidence',
    requiredPublicEvidence:
      'published React surfaces prove useContext/provider compatibility under public roots',
    currentBlocked: true,
    compatibilityClaimed: false
  }
]);
const contextHookRendererReadinessCompatibilityFalseFlags = freezeArray([
  'compatibilityClaimed',
  'publicCompatibilityClaimed',
  'publicHookCompatibility',
  'exposesPublicHookImplementation',
  'hookExecutionCompatibility',
  'contextObjectConsumptionCompatibility',
  'providerRenderCompatibility',
  'runtimeProviderPropagation',
  'rendererVisiblePropagation',
  'rendererIntegration',
  'rendererCompatibility',
  'publicActIntegration',
  'schedulerIntegration',
  'schedulerPrerequisitesReady',
  'schedulerTimingCompatibility',
  'rootLaneIntegration',
  'rootScheduling',
  'rootExecution',
  'suspenseContextPropagation',
  'packageCompatibility',
  'publicPackageCompatibility'
]);
const contextHookRendererReadinessReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'compatibilityTarget',
  'hookNames',
  'sourceReport',
  'privateDispatcherMetadata',
  'readinessRowFieldNames',
  'readinessRows',
  'contextObjectRecord',
  'rootUseContextSourceFunctionCurrent',
  'sourceOwnedContextObject',
  'sourceOwnedContextObjectConsumed',
  'callerSuppliedContextObjectAccepted',
  'privateDispatcherMarked',
  'privateDispatcherMetadataIdentityCurrent',
  'sourceOwnedPrivateDispatcher',
  'callerSuppliedDispatcherAccepted',
  'publicUseContextCompatibilityBlocked',
  'contextObjectConsumptionBlocked',
  'providerRendererLifecycleBlocked',
  'contextDependencyPropagationBlocked',
  'rootRendererSchedulingBlocked',
  'schedulerTimingBlocked',
  'actIntegrationBlocked',
  'suspenseContextPropagationBlocked',
  'packageCompatibilityBlocked',
  ...contextHookRendererReadinessCompatibilityFalseFlags
]);
const contextHookRendererReadinessReportKind =
  'fast-react.private.context_hook_renderer_readiness_blockers';
const contextHookRendererReadinessReportVersion = 1;
const contextHookRendererReadinessStatus =
  'accepted-private-context-useContext-provider-renderer-readiness-blocked';
const contextHookRendererReadinessConsumptionStatus =
  'accepted-context-useContext-provider-renderer-readiness-blockers';
const contextHookRendererReadinessReportOptionNames = freezeArray([
  'hookNames',
  'sourceReport',
  'privateDispatcherMetadata',
  'readinessRows',
  'readinessRowOverrides',
  'contextObject',
  'dispatcher',
  'dispatcherMetadata',
  'useGenericDispatcher',
  'publicUseContextCompatibilityBlocked',
  'contextObjectConsumptionBlocked',
  'providerRendererLifecycleBlocked',
  'contextDependencyPropagationBlocked',
  'rootRendererSchedulingBlocked',
  'schedulerTimingBlocked',
  'actIntegrationBlocked',
  'suspenseContextPropagationBlocked',
  'packageCompatibilityBlocked',
  ...contextHookRendererReadinessCompatibilityFalseFlags
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
  hookNames: contextHookNames,
  contextReadRecordFields: contextReadRecordFieldNames,
  contextDependencyRecordFields: contextDependencyRecordFieldNames,
  contextPropagationDependencyRecordFields:
    contextPropagationDependencyRecordFieldNames,
  contextPropagationRecordFields: contextPropagationRecordFieldNames,
  rendererReadinessSourceReportFieldNames:
    contextHookRendererReadinessSourceReportFieldNames,
  rendererReadinessSourceReport: contextHookRendererReadinessSourceReport,
  rendererReadinessRowFieldNames: contextHookRendererReadinessRowFieldNames,
  rendererReadinessRows: contextHookRendererReadinessRows,
  rendererReadinessReportFieldNames:
    contextHookRendererReadinessReportFieldNames,
  rendererReadinessStatus: contextHookRendererReadinessStatus,
  rendererReadinessCompatibilityFalseFlags:
    contextHookRendererReadinessCompatibilityFalseFlags,
  sourceOwnedContextObjectRequired: true,
  callerSuppliedContextObjectsAccepted: false,
  callerSuppliedDispatchersAccepted: false,
  providerRowOverridesAccepted: false,
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
  'rendererReadinessSourceReportFieldNames',
  'rendererReadinessRowFieldNames',
  'rendererReadinessReportFieldNames',
  'rendererReadinessCompatibilityFalseFlags',
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

const useRefHookNames = freezeArray(['useRef']);
const useRefHookPublicShapeBlockerFields = freezeArray([
  'hookName',
  'reactSourceFunction',
  'reactDispatcherMethod',
  'reactSourceLength',
  'currentPublicExport',
  'currentName',
  'currentLength',
  'blocker'
]);
const useRefHookPublicShapeBlockers = freezeRecordArray([
  {
    hookName: 'useRef',
    reactSourceFunction: 'ReactHooks.useRef',
    reactDispatcherMethod: 'dispatcher.useRef',
    reactSourceLength: 1,
    currentPublicExport: 'react.useRef private-dispatcher guarded facade',
    currentName: '',
    currentLength: 1,
    blocker:
      'public export rejects generic dispatcher forwarding until a source-owned private useRef hook dispatcher is admitted'
  }
]);
const useRefHookSourceReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'reactSourceTag',
  'reactSourceCommit',
  'reactHooksSource',
  'reactClientSource',
  'reactServerSource',
  'reactReconcilerSource',
  'fastReactSource',
  'reactMountFunction',
  'reactUpdateFunction',
  'dispatcherMethodCurrentInReactSource',
  'publicRootExportCurrent',
  'reactServerExportAbsentCurrent',
  'compatibilityClaimed'
]);
const useRefHookSourceReport = freezeRecord({
  kind: 'fast-react.private.use_ref_hook_source_report',
  version: 1,
  status: 'source-current-for-react-19.2.6-useRef-private-dispatcher',
  reactSourceTag: 'v19.2.6',
  reactSourceCommit: 'eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401',
  reactHooksSource: 'packages/react/src/ReactHooks.js',
  reactClientSource: 'packages/react/src/ReactClient.js',
  reactServerSource: 'packages/react/src/ReactServer.js',
  reactReconcilerSource: 'packages/react-reconciler/src/ReactFiberHooks.js',
  fastReactSource: 'packages/react/hook-dispatcher.js',
  reactMountFunction: 'mountRef',
  reactUpdateFunction: 'updateRef',
  dispatcherMethodCurrentInReactSource: true,
  publicRootExportCurrent: true,
  reactServerExportAbsentCurrent: true,
  compatibilityClaimed: false
});
const useRefHookBlockerCurrentnessFieldNames = freezeArray([
  'status',
  'compatibilityTarget',
  'sourceReportCurrent',
  'publicRootlessInvalidHookBlocked',
  'genericDispatcherForwardingBlocked',
  'privateDispatcherMarkerRequired',
  'cjsSurfaceCurrentnessBlocked',
  'reactServerSurfaceCurrentnessBlocked',
  'schedulerPrerequisitesBlocked',
  'rootLanePrerequisitesBlocked',
  'rootSchedulingBlocked',
  'rendererCompatibilityBlocked',
  'callbackInvocationBlocked',
  'externalStoreInvocationBlocked',
  'idGenerationBlocked',
  'refIdentityCompatibilityClaimed',
  'publicCompatibilityClaimed',
  'compatibilityClaimed'
]);
const useRefHookBlockerCurrentness = freezeRecord({
  status:
    'blocked-until-private-useRef-dispatcher-root-and-renderer-currentness-admitted',
  compatibilityTarget: 'react@19.2.6',
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
});
const useRefHookSurfaceCurrentnessFieldNames = freezeArray([
  'surfaceId',
  'source',
  'entrypoint',
  'moduleShape',
  'sameAsRootExport',
  'hookName',
  'useRefExportPolicy',
  'sourceFunctionCurrent',
  'hasUseRefExport',
  'currentName',
  'currentLength',
  'expectedName',
  'expectedLength',
  'useRefPolicyCurrent',
  'rootlessInvalidHookBlocked',
  'genericDispatcherForwardingBlocked',
  'privateDispatcherRequired',
  'publicCompatibilityClaimed',
  'compatibilityClaimed'
]);
const useRefHookSurfaceCurrentnessRows = freezeUseRefSurfaceCurrentnessRows([
  {
    surfaceId: 'react-root',
    source: 'packages/react/index.js',
    entrypoint: 'react',
    moduleShape: 'default-root',
    sameAsRootExport: true,
    hookName: 'useRef',
    useRefExportPolicy: 'available-root-hook',
    sourceFunctionCurrent: true,
    hasUseRefExport: true,
    currentName: '',
    currentLength: 1,
    expectedName: '',
    expectedLength: 1,
    useRefPolicyCurrent: true,
    rootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherRequired: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  },
  {
    surfaceId: 'react-cjs-development',
    source: 'packages/react/cjs/react.development.js',
    entrypoint: 'react',
    moduleShape: 'cjs-root-alias',
    sameAsRootExport: true,
    hookName: 'useRef',
    useRefExportPolicy: 'available-root-hook',
    sourceFunctionCurrent: true,
    hasUseRefExport: true,
    currentName: '',
    currentLength: 1,
    expectedName: '',
    expectedLength: 1,
    useRefPolicyCurrent: true,
    rootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherRequired: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  },
  {
    surfaceId: 'react-cjs-production',
    source: 'packages/react/cjs/react.production.js',
    entrypoint: 'react',
    moduleShape: 'cjs-root-alias',
    sameAsRootExport: true,
    hookName: 'useRef',
    useRefExportPolicy: 'available-root-hook',
    sourceFunctionCurrent: true,
    hasUseRefExport: true,
    currentName: '',
    currentLength: 1,
    expectedName: '',
    expectedLength: 1,
    useRefPolicyCurrent: true,
    rootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherRequired: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  },
  {
    surfaceId: 'react-server',
    source: 'packages/react/react.react-server.js',
    entrypoint: 'react react-server',
    moduleShape: 'react-server-root',
    sameAsRootExport: false,
    hookName: 'useRef',
    useRefExportPolicy: 'absent-react-server-hook',
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
]);
const useRefHookMissingDispatcherPrerequisites = freezeArray([
  'dispatcher.useRef',
  'private useRef hook dispatcher admission marker',
  'FunctionComponentUseRefHookRenderRecord currentness handoff'
]);
const useRefHookMissingSchedulerPrerequisites = freezeArray([
  'root scheduler render entry currentness',
  'act/Scheduler timing integration remains blocked'
]);
const useRefHookMissingRootLanePrerequisites = freezeArray([
  'public root renderWithHooks dispatcher installation',
  'FunctionComponent current hook-list rebinding through commit',
  'HostRoot render/update execution admission',
  'renderer-owned hook dispatcher lifecycle'
]);
const useRefHookCompatibilityFalseFlags = freezeArray([
  'compatibilityClaimed',
  'publicCompatibilityClaimed',
  'publicHookCompatibility',
  'exposesPublicHookImplementation',
  'hookExecutionCompatibility',
  'refIdentityCompatibility',
  'refObjectCompatibility',
  'rendererIntegration',
  'rendererCompatibility',
  'publicActIntegration',
  'schedulerIntegration',
  'schedulerPrerequisitesReady',
  'rootLaneIntegration',
  'rootScheduling',
  'rootExecution',
  'callbackExecutionClaimed',
  'externalStoreSubscriptionClaimed',
  'externalStoreSnapshotReadClaimed',
  'idGenerationClaimed',
  'packageCompatibility'
]);
const useRefHookExecutionMountInitialValue =
  'fast-react-private-useRef-mount-initial';
const useRefHookExecutionUpdateInitialValue =
  'fast-react-private-useRef-update-ignored';
const useRefHookExecutionSourceReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'reactSourceTag',
  'reactSourceCommit',
  'reactHooksSource',
  'reactReconcilerSource',
  'fastReactSource',
  'reactHookSourceFunction',
  'reactMountFunction',
  'reactUpdateFunction',
  'mountCreatesRefObject',
  'mountStoresRefObjectInMemoizedState',
  'updateReturnsMemoizedState',
  'updateIgnoresInitialValue',
  'dispatcherMethodCurrentInReactSource',
  'compatibilityClaimed'
]);
const useRefHookExecutionSourceReport = freezeRecord({
  kind: 'fast-react.private.use_ref_hook_execution_source_report',
  version: 1,
  status: 'source-current-for-react-19.2.6-useRef-mount-update-ref-identity',
  reactSourceTag: 'v19.2.6',
  reactSourceCommit: 'eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401',
  reactHooksSource: 'packages/react/src/ReactHooks.js',
  reactReconcilerSource: 'packages/react-reconciler/src/ReactFiberHooks.js',
  fastReactSource: 'packages/react/hook-dispatcher.js',
  reactHookSourceFunction: 'ReactHooks.useRef',
  reactMountFunction: 'mountRef',
  reactUpdateFunction: 'updateRef',
  mountCreatesRefObject: true,
  mountStoresRefObjectInMemoizedState: true,
  updateReturnsMemoizedState: true,
  updateIgnoresInitialValue: true,
  dispatcherMethodCurrentInReactSource: true,
  compatibilityClaimed: false
});
const useRefHookExecutionCallRecordFieldNames = freezeArray([
  'phase',
  'hookName',
  'callIndex',
  'initialValue',
  'metadataIdentityCurrent',
  'thisMatchesDispatcher',
  'privateDispatcherMarked',
  'returnedRefObject',
  'returnedCurrent',
  'executionErrorCode'
]);
const useRefHookRefIdentityRecordFieldNames = freezeArray([
  'mountRefObject',
  'updateRefObject',
  'sourceOwnedRefObject',
  'mountUpdateRefObjectSame',
  'mountCurrentValue',
  'updateCurrentValue',
  'updateInitialValue',
  'updateInitialValueIgnored',
  'callerSuppliedRefObjectAccepted',
  'refIdentityCompatibilityClaimed',
  'refObjectCompatibilityClaimed'
]);
const useRefHookExecutionEvidenceFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'compatibilityTarget',
  'hookNames',
  'sourceReport',
  'currentnessReport',
  'mountCallRecord',
  'updateCallRecord',
  'refIdentityRecord',
  'rootUseRefSourceFunctionCurrent',
  'privateDispatcherMarked',
  'sourceOwnedDispatcherExecution',
  'sourceOwnedRefObject',
  'publicRootlessInvalidHookBlocked',
  'genericDispatcherForwardingBlocked',
  'privateDispatcherRequired',
  'publicRootRenderingBlocked',
  'rootSchedulerIntegrationBlocked',
  'schedulerTimingBlocked',
  'actIntegrationBlocked',
  'rendererCompatibilityBlocked',
  'callbackInvocationBlocked',
  'externalStoreInvocationBlocked',
  'idGenerationBlocked',
  ...useRefHookCompatibilityFalseFlags
]);
const useRefHookExecutionEvidenceReportKind =
  'fast-react.private.use_ref_hook_execution_evidence';
const useRefHookExecutionEvidenceReportVersion = 1;
const useRefHookExecutionEvidenceStatus =
  'source-owned-private-useRef-mount-update-ref-identity-evidence';
const useRefHookExecutionEvidenceConsumptionStatus =
  'accepted-source-owned-private-useRef-execution-evidence';
const useRefHookCurrentnessReportKind =
  'fast-react.private.use_ref_hook_currentness';
const useRefHookCurrentnessReportVersion = 1;
const useRefHookCurrentnessStatus =
  'blocked-private-useRef-hook-currentness';
const useRefHookCurrentnessConsumptionStatus =
  'accepted-blocked-private-useRef-hook-currentness';
const useRefHookRendererLifecycleBlockerSourceReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'reactSourceTag',
  'reactSourceCommit',
  'fastReactSource',
  'privateCurrentnessStatus',
  'privateExecutionEvidenceStatus',
  'rendererRootLifecycleCompatibilityAdmitted',
  'publicUseRefCompatibilityAdmitted',
  'compatibilityClaimed'
]);
const useRefHookRendererLifecycleBlockerSourceReport = freezeRecord({
  kind: 'fast-react.private.use_ref_hook_renderer_lifecycle_blocker_source_report',
  version: 1,
  status: 'source-current-for-react-19.2.6-useRef-renderer-lifecycle-blockers',
  reactSourceTag: 'v19.2.6',
  reactSourceCommit: 'eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401',
  fastReactSource: 'packages/react/hook-dispatcher.js',
  privateCurrentnessStatus: useRefHookCurrentnessConsumptionStatus,
  privateExecutionEvidenceStatus: useRefHookExecutionEvidenceConsumptionStatus,
  rendererRootLifecycleCompatibilityAdmitted: false,
  publicUseRefCompatibilityAdmitted: false,
  compatibilityClaimed: false
});
const useRefHookRendererLifecycleBlockerRowFieldNames = freezeArray([
  'blockerId',
  'acceptedPrivateEvidenceStatus',
  'sourceOwnedPrivateEvidence',
  'missingRendererRootPrerequisite',
  'requiredPublicEvidence',
  'currentBlocked',
  'compatibilityClaimed'
]);
const useRefHookRendererLifecycleBlockerRows = freezeUseRefRendererLifecycleBlockerRows([
  {
    blockerId: 'private-currentness-is-not-public-useRef-compatibility',
    acceptedPrivateEvidenceStatus: useRefHookCurrentnessConsumptionStatus,
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      'renderer-owned hook dispatcher lifecycle during root render',
    requiredPublicEvidence:
      'root renderWithHooks dispatcher installation and teardown evidence',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: 'private-execution-is-not-renderer-ref-object-compatibility',
    acceptedPrivateEvidenceStatus: useRefHookExecutionEvidenceConsumptionStatus,
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      'real mutable JavaScript ref object identity through a renderer root',
    requiredPublicEvidence:
      'renderer/root-backed mount and update ref object identity and mutability evidence',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: 'dispatcher-lifecycle-not-root-backed',
    acceptedPrivateEvidenceStatus: useRefHookExecutionEvidenceConsumptionStatus,
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      'mount/update dispatcher switching owned by a renderer root',
    requiredPublicEvidence:
      'dispatcher lifecycle evidence tied to the current render fiber and root',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: 'root-rendering-and-hook-list-rebinding-not-admitted',
    acceptedPrivateEvidenceStatus: useRefHookExecutionEvidenceConsumptionStatus,
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      'root rendering, commit handoff, and hook-list rebinding',
    requiredPublicEvidence:
      'HostRoot render/update/commit evidence with current hook-list rebinding',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: 'scheduler-and-act-timing-not-admitted',
    acceptedPrivateEvidenceStatus: useRefHookExecutionEvidenceConsumptionStatus,
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      'Scheduler timing and public act lifecycle integration',
    requiredPublicEvidence:
      'Scheduler callback timing and act-flush evidence under a public root',
    currentBlocked: true,
    compatibilityClaimed: false
  },
  {
    blockerId: 'adjacent-hooks-and-package-compatibility-not-admitted',
    acceptedPrivateEvidenceStatus: useRefHookExecutionEvidenceConsumptionStatus,
    sourceOwnedPrivateEvidence: true,
    missingRendererRootPrerequisite:
      'callback, external-store, id-generation, and package compatibility',
    requiredPublicEvidence:
      'cross-hook and published package compatibility evidence',
    currentBlocked: true,
    compatibilityClaimed: false
  }
]);
const useRefHookRendererLifecycleCompatibilityFalseFlags = freezeArray([
  ...useRefHookCompatibilityFalseFlags,
  'realJsRefObjectRendererCompatibility',
  'refObjectMutabilityCompatibility',
  'dispatcherLifecycleCompatibility',
  'rootRenderingCompatibility',
  'schedulerTimingCompatibility',
  'actCompatibility'
]);
const useRefHookRendererLifecycleBlockerReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'compatibilityTarget',
  'hookNames',
  'sourceReport',
  'privateCurrentnessReport',
  'privateExecutionEvidence',
  'acceptedPrivateCurrentnessStatus',
  'acceptedPrivateExecutionEvidenceStatus',
  'blockerRowFieldNames',
  'blockerRows',
  'rootUseRefSourceFunctionCurrent',
  'privateDispatcherMetadataIdentityCurrent',
  'sourceOwnedPrivateDispatcherExecution',
  'sourceOwnedPrivateRefObject',
  'sourceOwnedPrivateRefObjectFrozen',
  'callerSuppliedRefObjectAccepted',
  'publicUseRefCompatibilityBlocked',
  'rendererRefObjectIdentityBlocked',
  'rendererRefObjectMutabilityBlocked',
  'dispatcherLifecycleBlocked',
  'rootRenderingBlocked',
  'rootCommitHookListRebindingBlocked',
  'rootSchedulerIntegrationBlocked',
  'schedulerTimingBlocked',
  'actIntegrationBlocked',
  'callbackHookCompatibilityBlocked',
  'externalStoreCompatibilityBlocked',
  'idGenerationCompatibilityBlocked',
  'packageCompatibilityBlocked',
  ...useRefHookRendererLifecycleCompatibilityFalseFlags
]);
const useRefHookRendererLifecycleBlockerReportKind =
  'fast-react.private.use_ref_hook_renderer_lifecycle_blockers';
const useRefHookRendererLifecycleBlockerReportVersion = 1;
const useRefHookRendererLifecycleBlockerStatus =
  'accepted-private-useRef-evidence-public-renderer-lifecycle-blocked';
const useRefHookRendererLifecycleBlockerConsumptionStatus =
  'accepted-useRef-renderer-lifecycle-blockers';
const useRefHookRendererLifecycleBlockerReportOptionNames = freezeArray([
  'hookNames',
  'sourceReport',
  'privateCurrentnessReport',
  'privateExecutionEvidence',
  'blockerRows',
  'blockerRowOverrides',
  'publicUseRefCompatibilityBlocked',
  'rendererRefObjectIdentityBlocked',
  'rendererRefObjectMutabilityBlocked',
  'dispatcherLifecycleBlocked',
  'rootRenderingBlocked',
  'rootCommitHookListRebindingBlocked',
  'rootSchedulerIntegrationBlocked',
  'schedulerTimingBlocked',
  'actIntegrationBlocked',
  'callbackHookCompatibilityBlocked',
  'externalStoreCompatibilityBlocked',
  'idGenerationCompatibilityBlocked',
  'packageCompatibilityBlocked',
  ...useRefHookRendererLifecycleCompatibilityFalseFlags
]);
const useRefHookCurrentnessReportOptionNames = freezeArray([
  'hookNames',
  'publicShapeBlockers',
  'sourceReport',
  'blockerCurrentness',
  'surfaceCurrentnessFieldNames',
  'surfaceCurrentnessRows',
  'surfaceCurrentnessRowOverrides',
  'cjsSurfaceCurrentnessBlocked',
  'reactServerSurfaceCurrentnessBlocked',
  'publicRootlessInvalidHookBlocked',
  'genericDispatcherForwardingBlocked',
  'privateDispatcherRequired',
  ...useRefHookCompatibilityFalseFlags
]);
const privateRefHookDispatcherMetadata = freezeRecord({
  capability: 'fast-react.private.ref_hook_dispatcher',
  compatibilityTarget: 'react@19.2.6',
  compatibilityClaimed: false,
  publicCompatibilityClaimed: false,
  publicHookCompatibility: false,
  exposesPublicHookImplementation: false,
  hookExecutionCompatibility: false,
  refIdentityCompatibility: false,
  refObjectCompatibility: false,
  rendererIntegration: false,
  rendererCompatibility: false,
  publicActIntegration: false,
  schedulerIntegration: false,
  schedulerPrerequisitesReady: false,
  rootLaneIntegration: false,
  rootScheduling: false,
  rootExecution: false,
  callbackExecutionClaimed: false,
  externalStoreSubscriptionClaimed: false,
  externalStoreSnapshotReadClaimed: false,
  idGenerationClaimed: false,
  packageCompatibility: false,
  hookNames: useRefHookNames,
  publicShapeBlockerFields: useRefHookPublicShapeBlockerFields,
  publicShapeBlockers: useRefHookPublicShapeBlockers,
  sourceReportFieldNames: useRefHookSourceReportFieldNames,
  sourceReport: useRefHookSourceReport,
  executionSourceReportFieldNames: useRefHookExecutionSourceReportFieldNames,
  executionSourceReport: useRefHookExecutionSourceReport,
  executionEvidenceFieldNames: useRefHookExecutionEvidenceFieldNames,
  executionCallRecordFieldNames: useRefHookExecutionCallRecordFieldNames,
  refIdentityRecordFieldNames: useRefHookRefIdentityRecordFieldNames,
  privateExecutionEvidenceStatus: useRefHookExecutionEvidenceStatus,
  rendererLifecycleBlockerSourceReportFieldNames:
    useRefHookRendererLifecycleBlockerSourceReportFieldNames,
  rendererLifecycleBlockerSourceReport:
    useRefHookRendererLifecycleBlockerSourceReport,
  rendererLifecycleBlockerRowFieldNames:
    useRefHookRendererLifecycleBlockerRowFieldNames,
  rendererLifecycleBlockerRows: useRefHookRendererLifecycleBlockerRows,
  rendererLifecycleBlockerReportFieldNames:
    useRefHookRendererLifecycleBlockerReportFieldNames,
  rendererLifecycleBlockerStatus: useRefHookRendererLifecycleBlockerStatus,
  rendererLifecycleCompatibilityFalseFlags:
    useRefHookRendererLifecycleCompatibilityFalseFlags,
  sourceOwnedPrivateExecutionEvidence: true,
  callerSuppliedRefObjectsAccepted: false,
  rowOverridesAccepted: false,
  blockerCurrentnessFieldNames: useRefHookBlockerCurrentnessFieldNames,
  blockerCurrentness: useRefHookBlockerCurrentness,
  surfaceCurrentnessFieldNames: useRefHookSurfaceCurrentnessFieldNames,
  surfaceCurrentnessRows: useRefHookSurfaceCurrentnessRows,
  cjsSurfaceCurrentnessBlocked: true,
  reactServerSurfaceCurrentnessBlocked: true,
  hookCallFields: freezeArray(['initialValue']),
  renderRequestFields: freezeArray(['initialValue']),
  hookRecordFields: freezeArray(['hook', 'refObject', 'initialValue']),
  updateRecordFields: freezeArray([
    'hook',
    'refObject',
    'initialValue',
    'ignoredInitialValue'
  ]),
  hookRenderRecordFields: freezeArray(['phase', 'hook', 'refObject', 'initialValue']),
  missingDispatcherPrerequisites: useRefHookMissingDispatcherPrerequisites,
  missingSchedulerPrerequisites: useRefHookMissingSchedulerPrerequisites,
  missingRootLanePrerequisites: useRefHookMissingRootLanePrerequisites,
  compatibilityFalseFlags: useRefHookCompatibilityFalseFlags,
  acceptedReconcilerRecords: freezeArray([
    'FunctionComponentRefObjectHandle',
    'FunctionComponentRefHookRecord',
    'FunctionComponentRefUpdateRecord',
    'FunctionComponentUseRefHookRenderRecord',
    'FunctionComponentUseMemoUseRefRenderRecord'
  ])
});

const privateRefHookDispatcherMetadataArrayKeys = freezeArray([
  'hookNames',
  'publicShapeBlockerFields',
  'sourceReportFieldNames',
  'executionSourceReportFieldNames',
  'executionEvidenceFieldNames',
  'executionCallRecordFieldNames',
  'refIdentityRecordFieldNames',
  'rendererLifecycleBlockerSourceReportFieldNames',
  'rendererLifecycleBlockerRowFieldNames',
  'rendererLifecycleBlockerReportFieldNames',
  'rendererLifecycleCompatibilityFalseFlags',
  'blockerCurrentnessFieldNames',
  'surfaceCurrentnessFieldNames',
  'hookCallFields',
  'renderRequestFields',
  'hookRecordFields',
  'updateRecordFields',
  'hookRenderRecordFields',
  'missingDispatcherPrerequisites',
  'missingSchedulerPrerequisites',
  'missingRootLanePrerequisites',
  'compatibilityFalseFlags',
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

function createUseRefHookCurrentnessGateError(reason) {
  const error = createUnimplementedError(
    'react',
    'useRefHookCurrentness',
    'rejected source/currentness report',
    'Only current source-owned useRef hook blocker reports can pass this package-private gate.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicHookCompatibility = false;
  error.exposesPublicHookImplementation = false;
  error.hookExecutionCompatibility = false;
  error.refIdentityCompatibility = false;
  error.rendererCompatibility = false;
  error.schedulerIntegration = false;
  error.rootLaneIntegration = false;
  error.rootScheduling = false;
  error.callbackExecutionClaimed = false;
  error.externalStoreSubscriptionClaimed = false;
  error.externalStoreSnapshotReadClaimed = false;
  error.idGenerationClaimed = false;
  error.packageCompatibility = false;
  error.compatibilityClaimed = false;
  return error;
}

function createUseRefHookExecutionEvidenceGateError(reason) {
  const error = createUnimplementedError(
    'react',
    'useRefHookExecutionEvidence',
    'rejected source-owned private useRef execution evidence',
    'Only current package-owned useRef mount/update execution and ref identity evidence can pass this package-private gate.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicHookCompatibility = false;
  error.exposesPublicHookImplementation = false;
  error.hookExecutionCompatibility = false;
  error.refIdentityCompatibility = false;
  error.refObjectCompatibility = false;
  error.rendererCompatibility = false;
  error.schedulerIntegration = false;
  error.rootLaneIntegration = false;
  error.rootScheduling = false;
  error.rootExecution = false;
  error.callbackExecutionClaimed = false;
  error.externalStoreSubscriptionClaimed = false;
  error.externalStoreSnapshotReadClaimed = false;
  error.idGenerationClaimed = false;
  error.packageCompatibility = false;
  error.compatibilityClaimed = false;
  return error;
}

function createUseRefHookRendererLifecycleBlockerGateError(reason) {
  const error = createUnimplementedError(
    'react',
    'useRefHookRendererLifecycleBlockers',
    'rejected useRef renderer lifecycle blocker report',
    'Only current source-owned useRef renderer/root lifecycle blocker reports can pass this package-private gate.'
  );
  error.reason = reason;
  error.publicUseRefCompatibilityBlocked = true;
  error.rendererRefObjectIdentityBlocked = true;
  error.rendererRefObjectMutabilityBlocked = true;
  error.dispatcherLifecycleBlocked = true;
  error.rootRenderingBlocked = true;
  error.schedulerTimingBlocked = true;
  error.actIntegrationBlocked = true;
  error.publicCompatibilityClaimed = false;
  error.publicHookCompatibility = false;
  error.exposesPublicHookImplementation = false;
  error.hookExecutionCompatibility = false;
  error.refIdentityCompatibility = false;
  error.refObjectCompatibility = false;
  error.rendererCompatibility = false;
  error.schedulerIntegration = false;
  error.rootLaneIntegration = false;
  error.rootScheduling = false;
  error.rootExecution = false;
  error.callbackExecutionClaimed = false;
  error.externalStoreSubscriptionClaimed = false;
  error.externalStoreSnapshotReadClaimed = false;
  error.idGenerationClaimed = false;
  error.packageCompatibility = false;
  error.compatibilityClaimed = false;
  return error;
}

function createContextHookRendererReadinessGateError(reason) {
  const error = createUnimplementedError(
    'react',
    'contextHookRendererReadiness',
    'rejected context/useContext renderer readiness blocker report',
    'Only current source-owned context/useContext renderer readiness blocker reports can pass this package-private gate.'
  );
  error.reason = reason;
  error.publicUseContextCompatibilityBlocked = true;
  error.contextObjectConsumptionBlocked = true;
  error.providerRendererLifecycleBlocked = true;
  error.contextDependencyPropagationBlocked = true;
  error.rootRendererSchedulingBlocked = true;
  error.schedulerTimingBlocked = true;
  error.actIntegrationBlocked = true;
  error.suspenseContextPropagationBlocked = true;
  error.packageCompatibilityBlocked = true;
  error.publicCompatibilityClaimed = false;
  error.publicHookCompatibility = false;
  error.exposesPublicHookImplementation = false;
  error.hookExecutionCompatibility = false;
  error.contextObjectConsumptionCompatibility = false;
  error.providerRenderCompatibility = false;
  error.runtimeProviderPropagation = false;
  error.rendererVisiblePropagation = false;
  error.rendererCompatibility = false;
  error.schedulerIntegration = false;
  error.schedulerPrerequisitesReady = false;
  error.schedulerTimingCompatibility = false;
  error.rootLaneIntegration = false;
  error.rootScheduling = false;
  error.rootExecution = false;
  error.suspenseContextPropagation = false;
  error.packageCompatibility = false;
  error.publicPackageCompatibility = false;
  error.compatibilityClaimed = false;
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

function isPrivateRefHookDispatcher(dispatcher) {
  return (
    isObjectLike(dispatcher) &&
    privateRefHookDispatchers.has(dispatcher) &&
    privateRefHookDispatcherMetadataByDispatcher.has(dispatcher)
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

function validatePrivateRefHookDispatcher(dispatcher, metadata) {
  if (!isObjectLike(dispatcher) || typeof dispatcher.useRef !== 'function') {
    throw createInvalidHookCallError('useRef');
  }

  validatePrivateRefHookDispatcherMetadata(metadata);
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

function markPrivateRefHookDispatcher(dispatcher, metadata) {
  validatePrivateRefHookDispatcher(dispatcher, metadata);
  privateRefHookDispatchers.add(dispatcher);
  privateRefHookDispatcherMetadataByDispatcher.set(
    dispatcher,
    privateRefHookDispatcherMetadata
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

function getPrivateRefDispatcherHook(dispatcher, hookName) {
  if (hookName !== 'useRef' || !isPrivateRefHookDispatcher(dispatcher)) {
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

  if (hookName === 'useRef') {
    return callPrivateRefDispatcherHook(hookName, args);
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

function callPrivateRefDispatcherHook(hookName, args) {
  const dispatcher = resolveDispatcher(hookName);
  const hook = getPrivateRefDispatcherHook(dispatcher, hookName);
  return hook.apply(
    dispatcher,
    createPrivateRefHookArgs(args, privateRefHookDispatcherMetadata)
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

function createUseRefHookSurfaceCurrentnessRows(rowOverridesBySurfaceId) {
  const rootReact = require('./index.js');
  const cjsDevelopmentReact = require('./cjs/react.development.js');
  const cjsProductionReact = require('./cjs/react.production.js');
  const reactServer = require('./react.react-server.js');
  const rowOverrides = rowOverridesBySurfaceId ?? {};
  const previousDispatcher = ReactSharedInternals.H;

  ReactSharedInternals.H = null;

  try {
    return freezeUseRefSurfaceCurrentnessRows(
      [
        describeUseRefHookSurfaceCurrentness({
          surfaceId: 'react-root',
          source: 'packages/react/index.js',
          entrypoint: 'react',
          moduleShape: 'default-root',
          moduleExports: rootReact,
          rootExports: rootReact,
          expectsUseRefExport: true
        }),
        describeUseRefHookSurfaceCurrentness({
          surfaceId: 'react-cjs-development',
          source: 'packages/react/cjs/react.development.js',
          entrypoint: 'react',
          moduleShape: 'cjs-root-alias',
          moduleExports: cjsDevelopmentReact,
          rootExports: rootReact,
          expectsUseRefExport: true
        }),
        describeUseRefHookSurfaceCurrentness({
          surfaceId: 'react-cjs-production',
          source: 'packages/react/cjs/react.production.js',
          entrypoint: 'react',
          moduleShape: 'cjs-root-alias',
          moduleExports: cjsProductionReact,
          rootExports: rootReact,
          expectsUseRefExport: true
        }),
        describeUseRefHookSurfaceCurrentness({
          surfaceId: 'react-server',
          source: 'packages/react/react.react-server.js',
          entrypoint: 'react react-server',
          moduleShape: 'react-server-root',
          moduleExports: reactServer,
          rootExports: rootReact,
          expectsUseRefExport: false
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

function describeUseRefHookSurfaceCurrentness({
  surfaceId,
  source,
  entrypoint,
  moduleShape,
  moduleExports,
  rootExports,
  expectsUseRefExport
}) {
  const hasUseRefExport = Object.prototype.hasOwnProperty.call(
    moduleExports,
    'useRef'
  );
  const currentUseRef = hasUseRefExport ? moduleExports.useRef : null;
  const expectedName = expectsUseRefExport ? '' : null;
  const expectedLength = expectsUseRefExport ? 1 : null;
  const currentName =
    typeof currentUseRef === 'function' ? currentUseRef.name : null;
  const currentLength =
    typeof currentUseRef === 'function' ? currentUseRef.length : null;
  const sourceFunctionCurrent = expectsUseRefExport
    ? currentUseRef === useRef
    : !hasUseRefExport;
  const rootlessInvalidHookBlocked = expectsUseRefExport
    ? probeUseRefRootlessInvalidHookBlocked(currentUseRef)
    : true;
  const genericDispatcherForwardingBlocked = expectsUseRefExport
    ? probeUseRefGenericDispatcherForwardingBlocked(currentUseRef)
    : true;
  const privateDispatcherRequired =
    sourceFunctionCurrent &&
    rootlessInvalidHookBlocked &&
    genericDispatcherForwardingBlocked;
  const useRefPolicyCurrent = expectsUseRefExport
    ? typeof currentUseRef === 'function' &&
      currentName === expectedName &&
      currentLength === expectedLength &&
      sourceFunctionCurrent &&
      privateDispatcherRequired
    : !hasUseRefExport;

  return {
    surfaceId,
    source,
    entrypoint: moduleExports.__FAST_REACT_ENTRYPOINT__ ?? entrypoint,
    moduleShape,
    sameAsRootExport: moduleExports === rootExports,
    hookName: 'useRef',
    useRefExportPolicy: expectsUseRefExport
      ? 'available-root-hook'
      : 'absent-react-server-hook',
    sourceFunctionCurrent,
    hasUseRefExport,
    currentName,
    currentLength,
    expectedName,
    expectedLength,
    useRefPolicyCurrent,
    rootlessInvalidHookBlocked,
    genericDispatcherForwardingBlocked,
    privateDispatcherRequired,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function probeUseRefRootlessInvalidHookBlocked(currentUseRef) {
  if (typeof currentUseRef !== 'function') {
    return false;
  }

  const previousDispatcher = ReactSharedInternals.H;
  ReactSharedInternals.H = null;

  try {
    currentUseRef('rootless-useRef-probe');
    return false;
  } catch (error) {
    return isUseRefInvalidHookCallError(error);
  } finally {
    ReactSharedInternals.H = previousDispatcher;
  }
}

function probeUseRefGenericDispatcherForwardingBlocked(currentUseRef) {
  if (typeof currentUseRef !== 'function') {
    return false;
  }

  const calls = [];
  const previousDispatcher = ReactSharedInternals.H;
  ReactSharedInternals.H = {
    useRef(initialValue) {
      calls.push(initialValue);
      return { current: initialValue };
    }
  };

  try {
    currentUseRef('generic-dispatcher-useRef-probe');
    return false;
  } catch (error) {
    return isUseRefInvalidHookCallError(error) && calls.length === 0;
  } finally {
    ReactSharedInternals.H = previousDispatcher;
  }
}

function isUseRefInvalidHookCallError(error) {
  return (
    isObjectLike(error) &&
    error.code === invalidHookCallErrorCode &&
    error.hookName === 'useRef'
  );
}

function sanitizeUseRefHookCurrentnessReportOptions(overrides) {
  if (overrides == null) {
    return {
      options: {},
      sourceOwnedOptions: true
    };
  }

  if (!isObjectLike(overrides) || typeof overrides === 'function') {
    return {
      options: {},
      sourceOwnedOptions: false
    };
  }

  let prototype;
  let ownKeys;

  try {
    prototype = Object.getPrototypeOf(overrides);
    ownKeys = Reflect.ownKeys(overrides);
  } catch {
    return {
      options: {},
      sourceOwnedOptions: false
    };
  }

  if (prototype !== Object.prototype && prototype !== null) {
    return {
      options: {},
      sourceOwnedOptions: false
    };
  }

  const ownStringKeys = new Set();
  const options = {};

  for (const key of ownKeys) {
    if (
      typeof key !== 'string' ||
      !useRefHookCurrentnessReportOptionNames.includes(key)
    ) {
      return {
        options: {},
        sourceOwnedOptions: false
      };
    }

    let descriptor;

    try {
      descriptor = Object.getOwnPropertyDescriptor(overrides, key);
    } catch {
      return {
        options: {},
        sourceOwnedOptions: false
      };
    }

    if (
      descriptor == null ||
      !Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ) {
      return {
        options: {},
        sourceOwnedOptions: false
      };
    }

    ownStringKeys.add(key);
    options[key] = descriptor.value;
  }

  try {
    for (const key in overrides) {
      if (!ownStringKeys.has(key)) {
        return {
          options: {},
          sourceOwnedOptions: false
        };
      }
    }
  } catch {
    return {
      options: {},
      sourceOwnedOptions: false
    };
  }

  return {
    options,
    sourceOwnedOptions: true
  };
}

function createUseRefHookCurrentnessReport(overrides = {}) {
  const { options: normalized, sourceOwnedOptions } =
    sanitizeUseRefHookCurrentnessReportOptions(overrides);
  const hasSurfaceCurrentnessRowsOverride =
    Object.prototype.hasOwnProperty.call(normalized, 'surfaceCurrentnessRows');
  const hasSurfaceCurrentnessRowOverrides =
    Object.prototype.hasOwnProperty.call(
      normalized,
      'surfaceCurrentnessRowOverrides'
    );
  const surfaceCurrentnessRows = hasSurfaceCurrentnessRowsOverride
    ? freezeUseRefSurfaceCurrentnessRows(normalized.surfaceCurrentnessRows)
    : createUseRefHookSurfaceCurrentnessRows(
        normalized.surfaceCurrentnessRowOverrides
      );
  const report = freezeRecord({
    kind: useRefHookCurrentnessReportKind,
    version: useRefHookCurrentnessReportVersion,
    status: useRefHookCurrentnessStatus,
    compatibilityTarget: 'react@19.2.6',
    hookNames: freezeArray(normalized.hookNames ?? useRefHookNames),
    publicShapeBlockers: freezeRecordArray(
      normalized.publicShapeBlockers ?? useRefHookPublicShapeBlockers
    ),
    sourceReport: freezeRecord({
      ...useRefHookSourceReport,
      ...(normalized.sourceReport ?? {})
    }),
    blockerCurrentness: freezeRecord({
      ...useRefHookBlockerCurrentness,
      ...(normalized.blockerCurrentness ?? {})
    }),
    surfaceCurrentnessFieldNames: freezeArray(
      normalized.surfaceCurrentnessFieldNames ??
        useRefHookSurfaceCurrentnessFieldNames
    ),
    surfaceCurrentnessRows,
    cjsSurfaceCurrentnessBlocked:
      normalized.cjsSurfaceCurrentnessBlocked ?? true,
    reactServerSurfaceCurrentnessBlocked:
      normalized.reactServerSurfaceCurrentnessBlocked ?? true,
    publicRootlessInvalidHookBlocked:
      normalized.publicRootlessInvalidHookBlocked ?? true,
    genericDispatcherForwardingBlocked:
      normalized.genericDispatcherForwardingBlocked ?? true,
    privateDispatcherRequired: normalized.privateDispatcherRequired ?? true,
    compatibilityClaimed: normalized.compatibilityClaimed ?? false,
    publicCompatibilityClaimed:
      normalized.publicCompatibilityClaimed ?? false,
    publicHookCompatibility: normalized.publicHookCompatibility ?? false,
    exposesPublicHookImplementation:
      normalized.exposesPublicHookImplementation ?? false,
    hookExecutionCompatibility:
      normalized.hookExecutionCompatibility ?? false,
    refIdentityCompatibility:
      normalized.refIdentityCompatibility ?? false,
    refObjectCompatibility: normalized.refObjectCompatibility ?? false,
    rendererIntegration: normalized.rendererIntegration ?? false,
    rendererCompatibility: normalized.rendererCompatibility ?? false,
    publicActIntegration: normalized.publicActIntegration ?? false,
    schedulerIntegration: normalized.schedulerIntegration ?? false,
    schedulerPrerequisitesReady:
      normalized.schedulerPrerequisitesReady ?? false,
    rootLaneIntegration: normalized.rootLaneIntegration ?? false,
    rootScheduling: normalized.rootScheduling ?? false,
    rootExecution: normalized.rootExecution ?? false,
    callbackExecutionClaimed:
      normalized.callbackExecutionClaimed ?? false,
    externalStoreSubscriptionClaimed:
      normalized.externalStoreSubscriptionClaimed ?? false,
    externalStoreSnapshotReadClaimed:
      normalized.externalStoreSnapshotReadClaimed ?? false,
    idGenerationClaimed: normalized.idGenerationClaimed ?? false,
    packageCompatibility: normalized.packageCompatibility ?? false
  });

  if (
    sourceOwnedOptions &&
    !hasSurfaceCurrentnessRowsOverride &&
    !hasSurfaceCurrentnessRowOverrides
  ) {
    useRefHookSurfaceCurrentnessRowsByReport.set(
      report,
      surfaceCurrentnessRows
    );
  }

  if (sourceOwnedOptions) {
    useRefHookCurrentnessReports.add(report);
  }
  return report;
}

function consumeUseRefHookCurrentnessReport(report) {
  const rejectionReason = validateUseRefHookCurrentnessReport(report);

  if (rejectionReason !== null) {
    throw createUseRefHookCurrentnessGateError(rejectionReason);
  }

  return freezeRecord({
    status: useRefHookCurrentnessConsumptionStatus,
    accepted: true,
    currentnessStatus: report.status,
    compatibilityTarget: 'react@19.2.6',
    hookNames: report.hookNames,
    surfaceCurrentnessRows: report.surfaceCurrentnessRows,
    cjsSurfaceCurrentnessBlocked: true,
    reactServerSurfaceCurrentnessBlocked: true,
    publicRootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherRequired: true,
    dispatcherPrerequisitesReady: false,
    schedulerPrerequisitesReady: false,
    rootLaneIntegration: false,
    rootScheduling: false,
    rootExecution: false,
    rendererCompatibility: false,
    refIdentityCompatibilityClaimed: false,
    callbackInvocationBlocked: true,
    externalStoreInvocationBlocked: true,
    idGenerationBlocked: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createUseRefHookExecutionEvidence(overrides = {}) {
  const normalized = captureOwnDataOptions(overrides, arguments.length > 0);
  const optionValues = normalized.values;
  const hasOption = (key) =>
    Object.prototype.hasOwnProperty.call(optionValues, key);
  const currentnessReport = hasOption('currentnessReport')
    ? optionValues.currentnessReport
    : createUseRefHookCurrentnessReport(
        hasOption('surfaceCurrentnessRowOverrides')
          ? {
              surfaceCurrentnessRowOverrides:
                optionValues.surfaceCurrentnessRowOverrides
            }
          : {}
      );
  const rootReact = require('./index.js');
  const currentUseRef = rootReact.useRef;
  const mountInitialValue = hasOption('mountInitialValue')
    ? optionValues.mountInitialValue
    : useRefHookExecutionMountInitialValue;
  const updateInitialValue = hasOption('updateInitialValue')
    ? optionValues.updateInitialValue
    : useRefHookExecutionUpdateInitialValue;
  const callerSuppliedRefObject = hasOption('refObject');
  const refObject = callerSuppliedRefObject
    ? optionValues.refObject
    : { current: mountInitialValue };
  const calls = [];
  let dispatcher = null;
  let markError = null;
  let mountError = null;
  let updateError = null;
  let mountReturnedRefObject = null;
  let updateReturnedRefObject = null;

  const dispatcherTarget = {
    useRef(initialValue, receivedMetadata) {
      const callIndex = calls.length;
      const phase = callIndex === 0 ? 'Mount' : 'Update';
      const returnedRefObject = refObject;
      calls.push({
        phase,
        hookName: 'useRef',
        callIndex,
        initialValue,
        metadataIdentityCurrent:
          receivedMetadata === privateRefHookDispatcherMetadata,
        thisMatchesDispatcher: this === dispatcher,
        privateDispatcherMarked: isPrivateRefHookDispatcher(this),
        returnedRefObject,
        returnedCurrent: isObjectLike(returnedRefObject)
          ? returnedRefObject.current
          : undefined,
        executionErrorCode: null
      });
      return returnedRefObject;
    }
  };
  const dispatcherMetadata = hasOption('dispatcherMetadata')
    ? optionValues.dispatcherMetadata
    : privateRefHookDispatcherMetadata;

  try {
    dispatcher = markPrivateRefHookDispatcher(
      dispatcherTarget,
      dispatcherMetadata
    );
  } catch (error) {
    markError = error;
    dispatcher = dispatcherTarget;
  }

  const previousDispatcher = ReactSharedInternals.H;
  if (markError === null) {
    ReactSharedInternals.H = optionValues.useGenericDispatcher === true
      ? {
          useRef(initialValue) {
            return { current: initialValue };
          }
        }
      : dispatcher;

    try {
      mountReturnedRefObject = currentUseRef(mountInitialValue);
    } catch (error) {
      mountError = error;
    }

    if (mountError === null) {
      try {
        updateReturnedRefObject = currentUseRef(updateInitialValue);
      } catch (error) {
        updateError = error;
      }
    }

    ReactSharedInternals.H = previousDispatcher;
  }

  if (!callerSuppliedRefObject && isObjectLike(refObject)) {
    useRefHookExecutionRefObjects.add(refObject);
    Object.freeze(refObject);
  }

  const mountCallRecord = freezeUseRefHookExecutionCallRecord({
    expectedPhase: 'Mount',
    expectedCallIndex: 0,
    expectedInitialValue: mountInitialValue,
    observedCall: calls[0],
    returnedRefObject: mountReturnedRefObject,
    executionError: markError ?? mountError
  });
  const updateCallRecord = freezeUseRefHookExecutionCallRecord({
    expectedPhase: 'Update',
    expectedCallIndex: 1,
    expectedInitialValue: updateInitialValue,
    observedCall: calls[1],
    returnedRefObject: updateReturnedRefObject,
    executionError: updateError
  });
  const refIdentityRecord = freezeRecord({
    mountRefObject: mountReturnedRefObject,
    updateRefObject: updateReturnedRefObject,
    sourceOwnedRefObject:
      !callerSuppliedRefObject && useRefHookExecutionRefObjects.has(refObject),
    mountUpdateRefObjectSame:
      mountReturnedRefObject === updateReturnedRefObject,
    mountCurrentValue: isObjectLike(mountReturnedRefObject)
      ? mountReturnedRefObject.current
      : undefined,
    updateCurrentValue: isObjectLike(updateReturnedRefObject)
      ? updateReturnedRefObject.current
      : undefined,
    updateInitialValue,
    updateInitialValueIgnored:
      mountReturnedRefObject === updateReturnedRefObject &&
      isObjectLike(updateReturnedRefObject) &&
      updateReturnedRefObject.current === mountInitialValue,
    callerSuppliedRefObjectAccepted: callerSuppliedRefObject,
    refIdentityCompatibilityClaimed: false,
    refObjectCompatibilityClaimed: false
  });
  const report = freezeRecord({
    kind: useRefHookExecutionEvidenceReportKind,
    version: useRefHookExecutionEvidenceReportVersion,
    status: useRefHookExecutionEvidenceStatus,
    compatibilityTarget: 'react@19.2.6',
    hookNames: freezeArray(optionValues.hookNames ?? useRefHookNames),
    sourceReport: freezeRecord({
      ...useRefHookExecutionSourceReport,
      ...(optionValues.sourceReport ?? {})
    }),
    currentnessReport,
    mountCallRecord,
    updateCallRecord,
    refIdentityRecord,
    rootUseRefSourceFunctionCurrent: currentUseRef === useRef,
    privateDispatcherMarked: isPrivateRefHookDispatcher(dispatcher),
    sourceOwnedDispatcherExecution:
      calls.length === 2 &&
      calls[0].thisMatchesDispatcher === true &&
      calls[1].thisMatchesDispatcher === true,
    sourceOwnedRefObject:
      !callerSuppliedRefObject && useRefHookExecutionRefObjects.has(refObject),
    publicRootlessInvalidHookBlocked:
      optionValues.publicRootlessInvalidHookBlocked ?? true,
    genericDispatcherForwardingBlocked:
      optionValues.genericDispatcherForwardingBlocked ?? true,
    privateDispatcherRequired: optionValues.privateDispatcherRequired ?? true,
    publicRootRenderingBlocked:
      optionValues.publicRootRenderingBlocked ?? true,
    rootSchedulerIntegrationBlocked:
      optionValues.rootSchedulerIntegrationBlocked ?? true,
    schedulerTimingBlocked: optionValues.schedulerTimingBlocked ?? true,
    actIntegrationBlocked: optionValues.actIntegrationBlocked ?? true,
    rendererCompatibilityBlocked:
      optionValues.rendererCompatibilityBlocked ?? true,
    callbackInvocationBlocked:
      optionValues.callbackInvocationBlocked ?? true,
    externalStoreInvocationBlocked:
      optionValues.externalStoreInvocationBlocked ?? true,
    idGenerationBlocked: optionValues.idGenerationBlocked ?? true,
    compatibilityClaimed: optionValues.compatibilityClaimed ?? false,
    publicCompatibilityClaimed:
      optionValues.publicCompatibilityClaimed ?? false,
    publicHookCompatibility: optionValues.publicHookCompatibility ?? false,
    exposesPublicHookImplementation:
      optionValues.exposesPublicHookImplementation ?? false,
    hookExecutionCompatibility:
      optionValues.hookExecutionCompatibility ?? false,
    refIdentityCompatibility:
      optionValues.refIdentityCompatibility ?? false,
    refObjectCompatibility: optionValues.refObjectCompatibility ?? false,
    rendererIntegration: optionValues.rendererIntegration ?? false,
    rendererCompatibility: optionValues.rendererCompatibility ?? false,
    publicActIntegration: optionValues.publicActIntegration ?? false,
    schedulerIntegration: optionValues.schedulerIntegration ?? false,
    schedulerPrerequisitesReady:
      optionValues.schedulerPrerequisitesReady ?? false,
    rootLaneIntegration: optionValues.rootLaneIntegration ?? false,
    rootScheduling: optionValues.rootScheduling ?? false,
    rootExecution: optionValues.rootExecution ?? false,
    callbackExecutionClaimed:
      optionValues.callbackExecutionClaimed ?? false,
    externalStoreSubscriptionClaimed:
      optionValues.externalStoreSubscriptionClaimed ?? false,
    externalStoreSnapshotReadClaimed:
      optionValues.externalStoreSnapshotReadClaimed ?? false,
    idGenerationClaimed: optionValues.idGenerationClaimed ?? false,
    packageCompatibility: optionValues.packageCompatibility ?? false
  });

  useRefHookExecutionEvidenceReports.add(report);
  useRefHookExecutionEvidenceOverrideKeysByReport.set(
    report,
    normalized.overrideKeys
  );
  return report;
}

function consumeUseRefHookExecutionEvidence(report) {
  const rejectionReason = validateUseRefHookExecutionEvidence(report);

  if (rejectionReason !== null) {
    throw createUseRefHookExecutionEvidenceGateError(rejectionReason);
  }

  return freezeRecord({
    status: useRefHookExecutionEvidenceConsumptionStatus,
    accepted: true,
    executionStatus: report.status,
    compatibilityTarget: 'react@19.2.6',
    hookNames: report.hookNames,
    mountRefObject: report.refIdentityRecord.mountRefObject,
    updateRefObject: report.refIdentityRecord.updateRefObject,
    refIdentityStable: true,
    updateInitialValueIgnored: true,
    sourceOwnedDispatcherExecution: true,
    sourceOwnedRefObject: true,
    currentnessReportAccepted: true,
    publicRootlessInvalidHookBlocked: true,
    genericDispatcherForwardingBlocked: true,
    privateDispatcherRequired: true,
    publicRootRenderingBlocked: true,
    rootSchedulerIntegrationBlocked: true,
    schedulerTimingBlocked: true,
    actIntegrationBlocked: true,
    rendererCompatibilityBlocked: true,
    callbackInvocationBlocked: true,
    externalStoreInvocationBlocked: true,
    idGenerationBlocked: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createUseRefHookRendererLifecycleBlockerReport(overrides = {}) {
  const normalized = captureKnownOwnDataOptions(
    overrides,
    arguments.length > 0,
    useRefHookRendererLifecycleBlockerReportOptionNames
  );
  const optionValues = normalized.values;
  const hasOption = (key) =>
    Object.prototype.hasOwnProperty.call(optionValues, key);
  const privateExecutionEvidence = hasOption('privateExecutionEvidence')
    ? optionValues.privateExecutionEvidence
    : createUseRefHookExecutionEvidence();
  const privateCurrentnessReport = hasOption('privateCurrentnessReport')
    ? optionValues.privateCurrentnessReport
    : isObjectLike(privateExecutionEvidence)
      ? privateExecutionEvidence.currentnessReport
      : null;
  const hasBlockerRowsOverride = hasOption('blockerRows');
  const hasBlockerRowOverrides = hasOption('blockerRowOverrides');
  const blockerRows = hasBlockerRowsOverride
    ? freezeUseRefRendererLifecycleBlockerRows(optionValues.blockerRows)
    : hasBlockerRowOverrides
      ? createUseRefRendererLifecycleBlockerRows(
          optionValues.blockerRowOverrides
        )
      : useRefHookRendererLifecycleBlockerRows;
  const privateCurrentnessAccepted =
    validateUseRefHookCurrentnessReport(privateCurrentnessReport) === null;
  const privateExecutionEvidenceAccepted =
    validateUseRefHookExecutionEvidence(privateExecutionEvidence) === null;
  const refIdentityRecord = isObjectLike(privateExecutionEvidence)
    ? privateExecutionEvidence.refIdentityRecord
    : null;
  const mountCallRecord = isObjectLike(privateExecutionEvidence)
    ? privateExecutionEvidence.mountCallRecord
    : null;
  const updateCallRecord = isObjectLike(privateExecutionEvidence)
    ? privateExecutionEvidence.updateCallRecord
    : null;
  const sourceOwnedPrivateRefObject =
    isObjectLike(privateExecutionEvidence) &&
    privateExecutionEvidence.sourceOwnedRefObject === true &&
    isObjectLike(refIdentityRecord) &&
    refIdentityRecord.sourceOwnedRefObject === true;
  const privateDispatcherMetadataIdentityCurrent =
    isObjectLike(mountCallRecord) &&
    mountCallRecord.metadataIdentityCurrent === true &&
    isObjectLike(updateCallRecord) &&
    updateCallRecord.metadataIdentityCurrent === true;
  const sourceOwnedPrivateRefObjectFrozen =
    isObjectLike(refIdentityRecord) &&
    isObjectLike(refIdentityRecord.mountRefObject) &&
    Object.isFrozen(refIdentityRecord.mountRefObject);
  const report = freezeRecord({
    kind: useRefHookRendererLifecycleBlockerReportKind,
    version: useRefHookRendererLifecycleBlockerReportVersion,
    status: useRefHookRendererLifecycleBlockerStatus,
    compatibilityTarget: 'react@19.2.6',
    hookNames: freezeArray(optionValues.hookNames ?? useRefHookNames),
    sourceReport: freezeRecord({
      ...useRefHookRendererLifecycleBlockerSourceReport,
      ...(optionValues.sourceReport ?? {})
    }),
    privateCurrentnessReport,
    privateExecutionEvidence,
    acceptedPrivateCurrentnessStatus: privateCurrentnessAccepted
      ? useRefHookCurrentnessConsumptionStatus
      : null,
    acceptedPrivateExecutionEvidenceStatus: privateExecutionEvidenceAccepted
      ? useRefHookExecutionEvidenceConsumptionStatus
      : null,
    blockerRowFieldNames: freezeArray(
      useRefHookRendererLifecycleBlockerRowFieldNames
    ),
    blockerRows,
    rootUseRefSourceFunctionCurrent:
      isObjectLike(privateExecutionEvidence) &&
      privateExecutionEvidence.rootUseRefSourceFunctionCurrent === true,
    privateDispatcherMetadataIdentityCurrent,
    sourceOwnedPrivateDispatcherExecution:
      isObjectLike(privateExecutionEvidence) &&
      privateExecutionEvidence.sourceOwnedDispatcherExecution === true,
    sourceOwnedPrivateRefObject,
    sourceOwnedPrivateRefObjectFrozen,
    callerSuppliedRefObjectAccepted:
      isObjectLike(refIdentityRecord) &&
      refIdentityRecord.callerSuppliedRefObjectAccepted === true,
    publicUseRefCompatibilityBlocked:
      optionValues.publicUseRefCompatibilityBlocked ?? true,
    rendererRefObjectIdentityBlocked:
      optionValues.rendererRefObjectIdentityBlocked ?? true,
    rendererRefObjectMutabilityBlocked:
      optionValues.rendererRefObjectMutabilityBlocked ?? true,
    dispatcherLifecycleBlocked:
      optionValues.dispatcherLifecycleBlocked ?? true,
    rootRenderingBlocked: optionValues.rootRenderingBlocked ?? true,
    rootCommitHookListRebindingBlocked:
      optionValues.rootCommitHookListRebindingBlocked ?? true,
    rootSchedulerIntegrationBlocked:
      optionValues.rootSchedulerIntegrationBlocked ?? true,
    schedulerTimingBlocked: optionValues.schedulerTimingBlocked ?? true,
    actIntegrationBlocked: optionValues.actIntegrationBlocked ?? true,
    callbackHookCompatibilityBlocked:
      optionValues.callbackHookCompatibilityBlocked ?? true,
    externalStoreCompatibilityBlocked:
      optionValues.externalStoreCompatibilityBlocked ?? true,
    idGenerationCompatibilityBlocked:
      optionValues.idGenerationCompatibilityBlocked ?? true,
    packageCompatibilityBlocked:
      optionValues.packageCompatibilityBlocked ?? true,
    compatibilityClaimed: optionValues.compatibilityClaimed ?? false,
    publicCompatibilityClaimed:
      optionValues.publicCompatibilityClaimed ?? false,
    publicHookCompatibility: optionValues.publicHookCompatibility ?? false,
    exposesPublicHookImplementation:
      optionValues.exposesPublicHookImplementation ?? false,
    hookExecutionCompatibility:
      optionValues.hookExecutionCompatibility ?? false,
    refIdentityCompatibility:
      optionValues.refIdentityCompatibility ?? false,
    refObjectCompatibility: optionValues.refObjectCompatibility ?? false,
    rendererIntegration: optionValues.rendererIntegration ?? false,
    rendererCompatibility: optionValues.rendererCompatibility ?? false,
    publicActIntegration: optionValues.publicActIntegration ?? false,
    schedulerIntegration: optionValues.schedulerIntegration ?? false,
    schedulerPrerequisitesReady:
      optionValues.schedulerPrerequisitesReady ?? false,
    rootLaneIntegration: optionValues.rootLaneIntegration ?? false,
    rootScheduling: optionValues.rootScheduling ?? false,
    rootExecution: optionValues.rootExecution ?? false,
    callbackExecutionClaimed:
      optionValues.callbackExecutionClaimed ?? false,
    externalStoreSubscriptionClaimed:
      optionValues.externalStoreSubscriptionClaimed ?? false,
    externalStoreSnapshotReadClaimed:
      optionValues.externalStoreSnapshotReadClaimed ?? false,
    idGenerationClaimed: optionValues.idGenerationClaimed ?? false,
    packageCompatibility: optionValues.packageCompatibility ?? false,
    realJsRefObjectRendererCompatibility:
      optionValues.realJsRefObjectRendererCompatibility ?? false,
    refObjectMutabilityCompatibility:
      optionValues.refObjectMutabilityCompatibility ?? false,
    dispatcherLifecycleCompatibility:
      optionValues.dispatcherLifecycleCompatibility ?? false,
    rootRenderingCompatibility:
      optionValues.rootRenderingCompatibility ?? false,
    schedulerTimingCompatibility:
      optionValues.schedulerTimingCompatibility ?? false,
    actCompatibility: optionValues.actCompatibility ?? false
  });

  useRefHookRendererLifecycleBlockerReports.add(report);
  useRefHookRendererLifecycleBlockerOverrideKeysByReport.set(
    report,
    normalized.overrideKeys
  );

  if (!hasBlockerRowsOverride && !hasBlockerRowOverrides) {
    useRefHookRendererLifecycleBlockerRowsByReport.set(report, blockerRows);
  }

  return report;
}

function consumeUseRefHookRendererLifecycleBlockerReport(report) {
  const rejectionReason =
    validateUseRefHookRendererLifecycleBlockerReport(report);

  if (rejectionReason !== null) {
    throw createUseRefHookRendererLifecycleBlockerGateError(rejectionReason);
  }

  return freezeRecord({
    status: useRefHookRendererLifecycleBlockerConsumptionStatus,
    accepted: true,
    blockerStatus: report.status,
    compatibilityTarget: 'react@19.2.6',
    hookNames: report.hookNames,
    acceptedPrivateCurrentnessStatus: useRefHookCurrentnessConsumptionStatus,
    acceptedPrivateExecutionEvidenceStatus:
      useRefHookExecutionEvidenceConsumptionStatus,
    blockerRows: report.blockerRows,
    sourceOwnedPrivateDispatcherExecution: true,
    sourceOwnedPrivateRefObject: true,
    sourceOwnedPrivateRefObjectFrozen: true,
    publicUseRefCompatibilityBlocked: true,
    rendererRefObjectIdentityBlocked: true,
    rendererRefObjectMutabilityBlocked: true,
    dispatcherLifecycleBlocked: true,
    rootRenderingBlocked: true,
    rootCommitHookListRebindingBlocked: true,
    rootSchedulerIntegrationBlocked: true,
    schedulerTimingBlocked: true,
    actIntegrationBlocked: true,
    callbackHookCompatibilityBlocked: true,
    externalStoreCompatibilityBlocked: true,
    idGenerationCompatibilityBlocked: true,
    packageCompatibilityBlocked: true,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createContextHookRendererReadinessReport(overrides = {}) {
  const normalized = captureKnownOwnDataOptions(
    overrides,
    arguments.length > 0,
    contextHookRendererReadinessReportOptionNames
  );
  const optionValues = normalized.values;
  const hasOption = (key) =>
    Object.prototype.hasOwnProperty.call(optionValues, key);
  const contextObject = hasOption('contextObject')
    ? optionValues.contextObject
    : createSourceOwnedContextObject('fast-react-private-context-default');
  const hasRowsOverride = hasOption('readinessRows');
  const hasRowOverrides = hasOption('readinessRowOverrides');
  const readinessRows = hasRowsOverride
    ? freezeContextRendererReadinessRows(optionValues.readinessRows)
    : hasRowOverrides
      ? createContextRendererReadinessRows(optionValues.readinessRowOverrides)
      : contextHookRendererReadinessRows;
  const rootReact = require('./index.js');
  const currentUseContext = rootReact.useContext;
  const calls = [];
  let dispatcher = null;
  let markError = null;
  let readError = null;
  let readValue;

  const dispatcherTarget = hasOption('dispatcher')
    ? optionValues.dispatcher
    : {
        useContext(context) {
          calls.push({
            context,
            thisMatchesDispatcher: this === dispatcher,
            privateDispatcherMarked: isPrivateContextHookDispatcher(this),
            metadataIdentityCurrent:
              getPrivateContextHookDispatcherMetadata(this) ===
              privateContextHookDispatcherMetadata
          });
          return context?._currentValue;
        }
      };
  const dispatcherMetadata = hasOption('dispatcherMetadata')
    ? optionValues.dispatcherMetadata
    : privateContextHookDispatcherMetadata;

  try {
    dispatcher = markPrivateContextHookDispatcher(
      dispatcherTarget,
      dispatcherMetadata
    );
  } catch (error) {
    markError = error;
    dispatcher = dispatcherTarget;
  }

  const previousDispatcher = ReactSharedInternals.H;
  if (markError === null) {
    ReactSharedInternals.H = optionValues.useGenericDispatcher === true
      ? {
          useContext(context) {
            calls.push({
              context,
              thisMatchesDispatcher: false,
              privateDispatcherMarked: false,
              metadataIdentityCurrent: false
            });
            return context?._currentValue;
          }
        }
      : dispatcher;

    try {
      readValue = currentUseContext(contextObject);
    } catch (error) {
      readError = error;
    } finally {
      ReactSharedInternals.H = previousDispatcher;
    }
  }

  const sourceOwnedContextObject = isSourceOwnedContextObject(contextObject);
  const consumedCall = calls[0] ?? null;
  const contextObjectRecord = freezeRecord({
    contextObject,
    sourceOwnedContextObject,
    providerEqualsContext:
      isObjectLike(contextObject) && contextObject.Provider === contextObject,
    consumerContextMatchesContext:
      isObjectLike(contextObject?.Consumer) &&
      contextObject.Consumer._context === contextObject,
    contextTypeMatchesReactContextSymbol:
      isObjectLike(contextObject) &&
      contextObject.$$typeof === Symbol.for('react.context'),
    consumedContextObject: consumedCall?.context ?? null,
    consumedSourceOwnedContextObject:
      sourceOwnedContextObject && consumedCall?.context === contextObject,
    readValue,
    readErrorCode: (markError ?? readError)?.code ?? null,
    callerSuppliedContextObjectAccepted: hasOption('contextObject')
  });
  const report = freezeRecord({
    kind: contextHookRendererReadinessReportKind,
    version: contextHookRendererReadinessReportVersion,
    status: contextHookRendererReadinessStatus,
    compatibilityTarget: 'react@19.2.6',
    hookNames: freezeArray(optionValues.hookNames ?? contextHookNames),
    sourceReport: freezeRecord({
      ...contextHookRendererReadinessSourceReport,
      ...(optionValues.sourceReport ?? {})
    }),
    privateDispatcherMetadata:
      optionValues.privateDispatcherMetadata ?? privateContextHookDispatcherMetadata,
    readinessRowFieldNames: freezeArray(
      contextHookRendererReadinessRowFieldNames
    ),
    readinessRows,
    contextObjectRecord,
    rootUseContextSourceFunctionCurrent: currentUseContext === useContext,
    sourceOwnedContextObject,
    sourceOwnedContextObjectConsumed:
      contextObjectRecord.consumedSourceOwnedContextObject === true &&
      contextObjectRecord.readErrorCode === null,
    callerSuppliedContextObjectAccepted: hasOption('contextObject'),
    privateDispatcherMarked: isPrivateContextHookDispatcher(dispatcher),
    privateDispatcherMetadataIdentityCurrent:
      getPrivateContextHookDispatcherMetadata(dispatcher) ===
      privateContextHookDispatcherMetadata,
    sourceOwnedPrivateDispatcher:
      !hasOption('dispatcher') &&
      consumedCall !== null &&
      consumedCall.thisMatchesDispatcher === true &&
      consumedCall.privateDispatcherMarked === true &&
      consumedCall.metadataIdentityCurrent === true,
    callerSuppliedDispatcherAccepted: hasOption('dispatcher'),
    publicUseContextCompatibilityBlocked:
      optionValues.publicUseContextCompatibilityBlocked ?? true,
    contextObjectConsumptionBlocked:
      optionValues.contextObjectConsumptionBlocked ?? true,
    providerRendererLifecycleBlocked:
      optionValues.providerRendererLifecycleBlocked ?? true,
    contextDependencyPropagationBlocked:
      optionValues.contextDependencyPropagationBlocked ?? true,
    rootRendererSchedulingBlocked:
      optionValues.rootRendererSchedulingBlocked ?? true,
    schedulerTimingBlocked: optionValues.schedulerTimingBlocked ?? true,
    actIntegrationBlocked: optionValues.actIntegrationBlocked ?? true,
    suspenseContextPropagationBlocked:
      optionValues.suspenseContextPropagationBlocked ?? true,
    packageCompatibilityBlocked:
      optionValues.packageCompatibilityBlocked ?? true,
    compatibilityClaimed: optionValues.compatibilityClaimed ?? false,
    publicCompatibilityClaimed:
      optionValues.publicCompatibilityClaimed ?? false,
    publicHookCompatibility: optionValues.publicHookCompatibility ?? false,
    exposesPublicHookImplementation:
      optionValues.exposesPublicHookImplementation ?? false,
    hookExecutionCompatibility:
      optionValues.hookExecutionCompatibility ?? false,
    contextObjectConsumptionCompatibility:
      optionValues.contextObjectConsumptionCompatibility ?? false,
    providerRenderCompatibility:
      optionValues.providerRenderCompatibility ?? false,
    runtimeProviderPropagation:
      optionValues.runtimeProviderPropagation ?? false,
    rendererVisiblePropagation:
      optionValues.rendererVisiblePropagation ?? false,
    rendererIntegration: optionValues.rendererIntegration ?? false,
    rendererCompatibility: optionValues.rendererCompatibility ?? false,
    publicActIntegration: optionValues.publicActIntegration ?? false,
    schedulerIntegration: optionValues.schedulerIntegration ?? false,
    schedulerPrerequisitesReady:
      optionValues.schedulerPrerequisitesReady ?? false,
    schedulerTimingCompatibility:
      optionValues.schedulerTimingCompatibility ?? false,
    rootLaneIntegration: optionValues.rootLaneIntegration ?? false,
    rootScheduling: optionValues.rootScheduling ?? false,
    rootExecution: optionValues.rootExecution ?? false,
    suspenseContextPropagation:
      optionValues.suspenseContextPropagation ?? false,
    packageCompatibility: optionValues.packageCompatibility ?? false,
    publicPackageCompatibility:
      optionValues.publicPackageCompatibility ?? false
  });

  contextHookRendererReadinessReports.add(report);
  contextHookRendererReadinessOverrideKeysByReport.set(
    report,
    normalized.overrideKeys
  );

  if (!hasRowsOverride && !hasRowOverrides) {
    contextHookRendererReadinessRowsByReport.set(report, readinessRows);
  }

  contextHookRendererReadinessContextObjectSnapshotsByReport.set(
    report,
    captureContextHookRendererReadinessContextObjectSnapshot(contextObject)
  );

  return report;
}

function consumeContextHookRendererReadinessReport(report) {
  const rejectionReason = validateContextHookRendererReadinessReport(report);

  if (rejectionReason !== null) {
    throw createContextHookRendererReadinessGateError(rejectionReason);
  }

  return freezeRecord({
    status: contextHookRendererReadinessConsumptionStatus,
    accepted: true,
    readinessStatus: report.status,
    compatibilityTarget: 'react@19.2.6',
    hookNames: report.hookNames,
    readinessRows: report.readinessRows,
    sourceOwnedContextObject: true,
    sourceOwnedContextObjectConsumed: true,
    sourceOwnedPrivateDispatcher: true,
    publicUseContextCompatibilityBlocked: true,
    contextObjectConsumptionBlocked: true,
    providerRendererLifecycleBlocked: true,
    contextDependencyPropagationBlocked: true,
    rootRendererSchedulingBlocked: true,
    schedulerTimingBlocked: true,
    actIntegrationBlocked: true,
    suspenseContextPropagationBlocked: true,
    packageCompatibilityBlocked: true,
    publicCompatibilityClaimed: false,
    publicPackageCompatibility: false,
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
  const normalized = captureOwnDataOptions(overrides, arguments.length > 0);
  const optionValues = normalized.values;
  const hasSurfaceCurrentnessRowsOverride =
    Object.prototype.hasOwnProperty.call(
      optionValues,
      'surfaceCurrentnessRows'
    );
  const surfaceCurrentnessRows = hasSurfaceCurrentnessRowsOverride
    ? freezeSurfaceCurrentnessRows(optionValues.surfaceCurrentnessRows)
    : createUnsupportedPlaceholderHookSurfaceCurrentnessRows(
        optionValues.surfaceCurrentnessRowOverrides
      );
  const report = freezeRecord({
    kind: unsupportedPlaceholderHookCurrentnessReportKind,
    version: unsupportedPlaceholderHookCurrentnessReportVersion,
    status: unsupportedPlaceholderHookCurrentnessStatus,
    compatibilityTarget: 'react@19.2.6',
    hookNames: freezeArray(
      optionValues.hookNames ?? unsupportedPlaceholderHookNames
    ),
    publicShapeBlockers: freezeRecordArray(
      optionValues.publicShapeBlockers ??
        unsupportedPlaceholderHookPublicShapeBlockers
    ),
    sourceReport: freezeRecord({
      ...unsupportedPlaceholderHookSourceReport,
      ...(optionValues.sourceReport ?? {})
    }),
    blockerCurrentness: freezeRecord({
      ...unsupportedPlaceholderHookBlockerCurrentness,
      ...(optionValues.blockerCurrentness ?? {})
    }),
    callbackInvocationReport: freezeRecord({
      ...unsupportedPlaceholderHookCallbackInvocationReport,
      ...(optionValues.callbackInvocationReport ?? {})
    }),
    externalStoreInvocationReport: freezeRecord({
      ...unsupportedPlaceholderHookExternalStoreInvocationReport,
      ...(optionValues.externalStoreInvocationReport ?? {})
    }),
    idGenerationReport: freezeRecord({
      ...unsupportedPlaceholderHookIdGenerationReport,
      ...(optionValues.idGenerationReport ?? {})
    }),
    surfaceCurrentnessFieldNames: freezeArray(
      optionValues.surfaceCurrentnessFieldNames ??
        unsupportedPlaceholderHookSurfaceCurrentnessFieldNames
    ),
    surfaceCurrentnessRows,
    cjsSurfaceCurrentnessBlocked:
      optionValues.cjsSurfaceCurrentnessBlocked ?? true,
    reactServerSurfaceCurrentnessBlocked:
      optionValues.reactServerSurfaceCurrentnessBlocked ?? true,
    publicExportsPlaceholderBlocked:
      optionValues.publicExportsPlaceholderBlocked ?? true,
    compatibilityClaimed: optionValues.compatibilityClaimed ?? false,
    publicCompatibilityClaimed:
      optionValues.publicCompatibilityClaimed ?? false,
    publicHookCompatibility: optionValues.publicHookCompatibility ?? false,
    exposesPublicHookImplementation:
      optionValues.exposesPublicHookImplementation ?? false,
    dispatcherRouting: optionValues.dispatcherRouting ?? false,
    dispatcherPrerequisitesReady:
      optionValues.dispatcherPrerequisitesReady ?? false,
    schedulerIntegration: optionValues.schedulerIntegration ?? false,
    schedulerPrerequisitesReady:
      optionValues.schedulerPrerequisitesReady ?? false,
    rootLaneIntegration: optionValues.rootLaneIntegration ?? false,
    rootScheduling: optionValues.rootScheduling ?? false,
    rendererIntegration: optionValues.rendererIntegration ?? false,
    rendererCompatibility: optionValues.rendererCompatibility ?? false,
    invokesCallbacks: optionValues.invokesCallbacks ?? false,
    invokesActionStateAction:
      optionValues.invokesActionStateAction ?? false,
    invokesOptimisticReducer:
      optionValues.invokesOptimisticReducer ?? false,
    invokesEffectEventCallback:
      optionValues.invokesEffectEventCallback ?? false,
    invokesDebugValueFormatter:
      optionValues.invokesDebugValueFormatter ?? false,
    callbackExecutionClaimed:
      optionValues.callbackExecutionClaimed ?? false,
    invokesExternalStoreSubscribe:
      optionValues.invokesExternalStoreSubscribe ?? false,
    invokesExternalStoreGetSnapshot:
      optionValues.invokesExternalStoreGetSnapshot ?? false,
    invokesExternalStoreGetServerSnapshot:
      optionValues.invokesExternalStoreGetServerSnapshot ?? false,
    externalStoreSubscriptionClaimed:
      optionValues.externalStoreSubscriptionClaimed ?? false,
    externalStoreSnapshotReadClaimed:
      optionValues.externalStoreSnapshotReadClaimed ?? false,
    generatesIds: optionValues.generatesIds ?? false,
    allocatesTreeIds: optionValues.allocatesTreeIds ?? false,
    claimsHydrationIdPrefix:
      optionValues.claimsHydrationIdPrefix ?? false
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
    normalized.overrideKeys
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

function createPrivateRefHookArgs(args, metadata) {
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

function getPrivateRefHookDispatcherMetadata(dispatcher) {
  if (!isPrivateRefHookDispatcher(dispatcher)) {
    return null;
  }

  return privateRefHookDispatcherMetadataByDispatcher.get(dispatcher);
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

function isPrivateRefHookDispatcherMetadata(metadata) {
  if (metadata !== privateRefHookDispatcherMetadata) {
    return false;
  }

  if (
    !isObjectLike(metadata) ||
    metadata.capability !== privateRefHookDispatcherMetadata.capability ||
    metadata.compatibilityTarget !==
      privateRefHookDispatcherMetadata.compatibilityTarget ||
    metadata.cjsSurfaceCurrentnessBlocked !== true ||
    metadata.reactServerSurfaceCurrentnessBlocked !== true ||
    metadata.privateExecutionEvidenceStatus !==
      useRefHookExecutionEvidenceStatus ||
    metadata.sourceOwnedPrivateExecutionEvidence !== true ||
    metadata.callerSuppliedRefObjectsAccepted !== false ||
    metadata.rowOverridesAccepted !== false
  ) {
    return false;
  }

  for (const flagName of useRefHookCompatibilityFalseFlags) {
    if (metadata[flagName] !== false) {
      return false;
    }
  }

  for (const key of privateRefHookDispatcherMetadataArrayKeys) {
    if (
      !hasSameStringArray(metadata[key], privateRefHookDispatcherMetadata[key])
    ) {
      return false;
    }
  }

  return (
    hasSameRecordArrayFields(
      metadata.publicShapeBlockers,
      privateRefHookDispatcherMetadata.publicShapeBlockers,
      useRefHookPublicShapeBlockerFields
    ) &&
    hasSameRecordFields(
      metadata.sourceReport,
      privateRefHookDispatcherMetadata.sourceReport,
      useRefHookSourceReportFieldNames
    ) &&
    hasSameRecordFields(
      metadata.executionSourceReport,
      privateRefHookDispatcherMetadata.executionSourceReport,
      useRefHookExecutionSourceReportFieldNames
    ) &&
    hasSameRecordFields(
      metadata.rendererLifecycleBlockerSourceReport,
      privateRefHookDispatcherMetadata.rendererLifecycleBlockerSourceReport,
      useRefHookRendererLifecycleBlockerSourceReportFieldNames
    ) &&
    hasSameUseRefRendererLifecycleBlockerRows(
      metadata.rendererLifecycleBlockerRows,
      privateRefHookDispatcherMetadata.rendererLifecycleBlockerRows
    ) &&
    hasSameRecordFields(
      metadata.blockerCurrentness,
      privateRefHookDispatcherMetadata.blockerCurrentness,
      useRefHookBlockerCurrentnessFieldNames
    ) &&
    hasSameUseRefSurfaceCurrentnessRows(
      metadata.surfaceCurrentnessRows,
      privateRefHookDispatcherMetadata.surfaceCurrentnessRows
    )
  );
}

function isPrivateContextHookDispatcherMetadata(metadata) {
  if (metadata !== privateContextHookDispatcherMetadata) {
    return false;
  }

  if (
    !isObjectLike(metadata) ||
    metadata.capability !== privateContextHookDispatcherMetadata.capability ||
    metadata.compatibilityTarget !==
      privateContextHookDispatcherMetadata.compatibilityTarget ||
    metadata.compatibilityClaimed !== false ||
    metadata.exposesPublicHookImplementation !== false ||
    metadata.rendererIntegration !== false ||
    metadata.runtimeProviderPropagation !== false ||
    metadata.rendererVisiblePropagation !== false ||
    metadata.sourceOwnedContextObjectRequired !== true ||
    metadata.callerSuppliedContextObjectsAccepted !== false ||
    metadata.callerSuppliedDispatchersAccepted !== false ||
    metadata.providerRowOverridesAccepted !== false
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

  return (
    hasSameRecordFields(
      metadata.rendererReadinessSourceReport,
      privateContextHookDispatcherMetadata.rendererReadinessSourceReport,
      contextHookRendererReadinessSourceReportFieldNames
    ) &&
    hasSameContextRendererReadinessRows(
      metadata.rendererReadinessRows,
      privateContextHookDispatcherMetadata.rendererReadinessRows
    )
  );
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
  if (metadata !== privateTransitionHookDispatcherMetadata) {
    return false;
  }

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

function isUseRefHookCurrentnessReport(report) {
  return validateUseRefHookCurrentnessReport(report) === null;
}

function isUseRefHookExecutionEvidence(report) {
  return validateUseRefHookExecutionEvidence(report) === null;
}

function isUseRefHookRendererLifecycleBlockerReport(report) {
  return validateUseRefHookRendererLifecycleBlockerReport(report) === null;
}

function isContextHookRendererReadinessReport(report) {
  return validateContextHookRendererReadinessReport(report) === null;
}

function validateUseRefHookCurrentnessReport(report) {
  if (!isObjectLike(report)) {
    return 'useRef-hook-currentness-not-frozen';
  }

  if (!useRefHookCurrentnessReports.has(report)) {
    return 'useRef-hook-currentness-source-proof';
  }

  if (!Object.isFrozen(report)) {
    return 'useRef-hook-currentness-not-frozen';
  }

  if (
    report.kind !== useRefHookCurrentnessReportKind ||
    report.version !== useRefHookCurrentnessReportVersion ||
    report.status !== useRefHookCurrentnessStatus ||
    report.compatibilityTarget !== 'react@19.2.6' ||
    !hasSameFrozenStringArray(report.hookNames, useRefHookNames) ||
    !hasSameFrozenStringArray(
      report.surfaceCurrentnessFieldNames,
      useRefHookSurfaceCurrentnessFieldNames
    ) ||
    report.cjsSurfaceCurrentnessBlocked !== true ||
    report.reactServerSurfaceCurrentnessBlocked !== true ||
    report.publicRootlessInvalidHookBlocked !== true ||
    report.genericDispatcherForwardingBlocked !== true ||
    report.privateDispatcherRequired !== true
  ) {
    return 'useRef-hook-currentness-shape';
  }

  if (
    !hasSameFrozenRecordArrayFields(
      report.publicShapeBlockers,
      useRefHookPublicShapeBlockers,
      useRefHookPublicShapeBlockerFields
    )
  ) {
    return 'useRef-hook-currentness-public-shape';
  }

  if (
    !hasSameFrozenRecordFields(
      report.sourceReport,
      useRefHookSourceReport,
      useRefHookSourceReportFieldNames
    )
  ) {
    return 'useRef-hook-currentness-source-report';
  }

  if (
    !hasSameFrozenRecordFields(
      report.blockerCurrentness,
      useRefHookBlockerCurrentness,
      useRefHookBlockerCurrentnessFieldNames
    )
  ) {
    return 'useRef-hook-currentness-blocker-currentness';
  }

  if (
    useRefHookSurfaceCurrentnessRowsByReport.get(report) !==
    report.surfaceCurrentnessRows
  ) {
    return 'useRef-hook-currentness-surface-currentness-source-proof';
  }

  if (
    !hasSameUseRefSurfaceCurrentnessRows(
      report.surfaceCurrentnessRows,
      useRefHookSurfaceCurrentnessRows
    )
  ) {
    return 'useRef-hook-currentness-surface-currentness';
  }

  for (const flagName of useRefHookCompatibilityFalseFlags) {
    if (report[flagName] !== false) {
      return 'useRef-hook-currentness-compatibility-or-prerequisite-claim';
    }
  }

  return null;
}

function validateUseRefHookExecutionEvidence(report) {
  if (!isObjectLike(report)) {
    return 'useRef-hook-execution-not-frozen';
  }

  if (!useRefHookExecutionEvidenceReports.has(report)) {
    return 'useRef-hook-execution-source-proof';
  }

  if (!Object.isFrozen(report)) {
    return 'useRef-hook-execution-not-frozen';
  }

  if (
    report.kind !== useRefHookExecutionEvidenceReportKind ||
    report.version !== useRefHookExecutionEvidenceReportVersion ||
    report.status !== useRefHookExecutionEvidenceStatus ||
    report.compatibilityTarget !== 'react@19.2.6' ||
    !hasSameFrozenStringArray(report.hookNames, useRefHookNames) ||
    report.publicRootlessInvalidHookBlocked !== true ||
    report.genericDispatcherForwardingBlocked !== true ||
    report.privateDispatcherRequired !== true
  ) {
    return 'useRef-hook-execution-shape';
  }

  if (
    !hasSameFrozenRecordFields(
      report.sourceReport,
      useRefHookExecutionSourceReport,
      useRefHookExecutionSourceReportFieldNames
    )
  ) {
    return 'useRef-hook-execution-source-report';
  }

  const overrideKeys =
    useRefHookExecutionEvidenceOverrideKeysByReport.get(report) ||
    freezeArray([]);
  if (
    overrideKeys.includes('surfaceCurrentnessRows') ||
    overrideKeys.includes('surfaceCurrentnessRowOverrides')
  ) {
    return 'useRef-hook-execution-row-overrides';
  }

  if (validateUseRefHookCurrentnessReport(report.currentnessReport) !== null) {
    return 'useRef-hook-execution-currentness-report';
  }

  if (report.rootUseRefSourceFunctionCurrent !== true) {
    return 'useRef-hook-execution-source-function';
  }

  if (!hasSourceOwnedUseRefExecutionRecords(report)) {
    return 'useRef-hook-execution-private-execution';
  }

  if (!hasSourceOwnedUseRefRefObject(report)) {
    return 'useRef-hook-execution-caller-ref-object';
  }

  if (!hasStableUseRefRefIdentityEvidence(report)) {
    return 'useRef-hook-execution-ref-identity';
  }

  if (!hasBlockedUseRefExecutionPrerequisites(report)) {
    return 'useRef-hook-execution-root-renderer-prerequisite-smuggling';
  }

  if (!hasBlockedUseRefExecutionCompatibilityClaims(report)) {
    return 'useRef-hook-execution-compatibility-or-prerequisite-claim';
  }

  if (overrideKeys.length > 0) {
    return 'useRef-hook-execution-caller-overrides';
  }

  return null;
}

function validateUseRefHookRendererLifecycleBlockerReport(report) {
  if (!isObjectLike(report)) {
    return 'useRef-hook-renderer-lifecycle-not-frozen';
  }

  if (!useRefHookRendererLifecycleBlockerReports.has(report)) {
    return 'useRef-hook-renderer-lifecycle-source-proof';
  }

  if (!Object.isFrozen(report)) {
    return 'useRef-hook-renderer-lifecycle-not-frozen';
  }

  if (
    report.kind !== useRefHookRendererLifecycleBlockerReportKind ||
    report.version !== useRefHookRendererLifecycleBlockerReportVersion ||
    report.status !== useRefHookRendererLifecycleBlockerStatus ||
    report.compatibilityTarget !== 'react@19.2.6' ||
    !hasSameFrozenStringArray(report.hookNames, useRefHookNames) ||
    !hasSameFrozenStringArray(
      report.blockerRowFieldNames,
      useRefHookRendererLifecycleBlockerRowFieldNames
    )
  ) {
    return 'useRef-hook-renderer-lifecycle-shape';
  }

  if (
    !hasSameFrozenRecordFields(
      report.sourceReport,
      useRefHookRendererLifecycleBlockerSourceReport,
      useRefHookRendererLifecycleBlockerSourceReportFieldNames
    )
  ) {
    return 'useRef-hook-renderer-lifecycle-source-report';
  }

  const currentnessReason = validateUseRefHookCurrentnessReport(
    report.privateCurrentnessReport
  );
  if (currentnessReason !== null) {
    return 'useRef-hook-renderer-lifecycle-private-currentness-report';
  }

  const executionReason = validateUseRefHookExecutionEvidence(
    report.privateExecutionEvidence
  );
  if (executionReason !== null) {
    if (executionReason === 'useRef-hook-execution-caller-ref-object') {
      return 'useRef-hook-renderer-lifecycle-caller-ref-object';
    }

    if (
      executionReason === 'useRef-hook-execution-source-function' ||
      executionReason === 'useRef-hook-execution-private-execution' ||
      executionReason === 'useRef-hook-execution-ref-identity'
    ) {
      return 'useRef-hook-renderer-lifecycle-dispatcher-source-identity';
    }

    if (
      executionReason ===
      'useRef-hook-execution-root-renderer-prerequisite-smuggling'
    ) {
      return 'useRef-hook-renderer-lifecycle-prerequisite-smuggling';
    }

    return 'useRef-hook-renderer-lifecycle-private-execution-evidence';
  }

  if (
    report.acceptedPrivateCurrentnessStatus !==
      useRefHookCurrentnessConsumptionStatus ||
    report.acceptedPrivateExecutionEvidenceStatus !==
      useRefHookExecutionEvidenceConsumptionStatus
  ) {
    return 'useRef-hook-renderer-lifecycle-private-evidence-status';
  }

  if (
    useRefHookRendererLifecycleBlockerRowsByReport.get(report) !==
    report.blockerRows
  ) {
    return 'useRef-hook-renderer-lifecycle-blocker-rows-source-proof';
  }

  if (
    !hasSameUseRefRendererLifecycleBlockerRows(
      report.blockerRows,
      useRefHookRendererLifecycleBlockerRows
    )
  ) {
    return 'useRef-hook-renderer-lifecycle-blocker-rows';
  }

  if (!hasUseRefRendererLifecyclePrivateEvidenceIdentity(report)) {
    return 'useRef-hook-renderer-lifecycle-dispatcher-source-identity';
  }

  if (report.callerSuppliedRefObjectAccepted !== false) {
    return 'useRef-hook-renderer-lifecycle-caller-ref-object';
  }

  if (!hasBlockedUseRefRendererLifecyclePrerequisites(report)) {
    return 'useRef-hook-renderer-lifecycle-prerequisite-smuggling';
  }

  if (!hasBlockedUseRefRendererLifecycleCompatibilityClaims(report)) {
    return 'useRef-hook-renderer-lifecycle-public-compatibility-claim';
  }

  const overrideKeys =
    useRefHookRendererLifecycleBlockerOverrideKeysByReport.get(report) ||
    freezeArray([]);
  if (overrideKeys.length > 0) {
    return 'useRef-hook-renderer-lifecycle-caller-overrides';
  }

  return null;
}

function validateContextHookRendererReadinessReport(report) {
  if (!isObjectLike(report)) {
    return 'context-hook-renderer-readiness-not-frozen';
  }

  if (!contextHookRendererReadinessReports.has(report)) {
    return 'context-hook-renderer-readiness-source-proof';
  }

  if (!Object.isFrozen(report)) {
    return 'context-hook-renderer-readiness-not-frozen';
  }

  if (
    report.kind !== contextHookRendererReadinessReportKind ||
    report.version !== contextHookRendererReadinessReportVersion ||
    report.status !== contextHookRendererReadinessStatus ||
    report.compatibilityTarget !== 'react@19.2.6' ||
    !hasSameFrozenStringArray(report.hookNames, contextHookNames) ||
    !hasSameFrozenStringArray(
      report.readinessRowFieldNames,
      contextHookRendererReadinessRowFieldNames
    )
  ) {
    return 'context-hook-renderer-readiness-shape';
  }

  if (
    !hasSameFrozenRecordFields(
      report.sourceReport,
      contextHookRendererReadinessSourceReport,
      contextHookRendererReadinessSourceReportFieldNames
    )
  ) {
    return 'context-hook-renderer-readiness-source-report';
  }

  if (report.privateDispatcherMetadata !== privateContextHookDispatcherMetadata) {
    return 'context-hook-renderer-readiness-dispatcher-source-identity';
  }

  if (
    contextHookRendererReadinessRowsByReport.get(report) !==
    report.readinessRows
  ) {
    return 'context-hook-renderer-readiness-provider-rows-source-proof';
  }

  if (
    !hasSameContextRendererReadinessRows(
      report.readinessRows,
      contextHookRendererReadinessRows
    )
  ) {
    return 'context-hook-renderer-readiness-provider-rows';
  }

  if (report.callerSuppliedContextObjectAccepted !== false) {
    return 'context-hook-renderer-readiness-caller-context-object';
  }

  if (report.callerSuppliedDispatcherAccepted !== false) {
    return 'context-hook-renderer-readiness-caller-dispatcher';
  }

  if (
    report.sourceOwnedContextObject !== true ||
    report.sourceOwnedContextObjectConsumed !== true ||
    !hasSourceOwnedContextObjectRecord(
      report.contextObjectRecord,
      contextHookRendererReadinessContextObjectSnapshotsByReport.get(report)
    )
  ) {
    return 'context-hook-renderer-readiness-context-object-source-identity';
  }

  if (
    report.rootUseContextSourceFunctionCurrent !== true ||
    !isRootUseContextSourceFunctionCurrent() ||
    report.privateDispatcherMarked !== true ||
    report.privateDispatcherMetadataIdentityCurrent !== true ||
    report.sourceOwnedPrivateDispatcher !== true
  ) {
    return 'context-hook-renderer-readiness-dispatcher-source-identity';
  }

  if (!hasBlockedContextHookRendererReadinessPrerequisites(report)) {
    return 'context-hook-renderer-readiness-prerequisite-smuggling';
  }

  if (!hasBlockedContextHookRendererReadinessCompatibilityClaims(report)) {
    return 'context-hook-renderer-readiness-public-compatibility-claim';
  }

  const overrideKeys =
    contextHookRendererReadinessOverrideKeysByReport.get(report) ||
    freezeArray([]);
  if (overrideKeys.length > 0) {
    return 'context-hook-renderer-readiness-caller-overrides';
  }

  return null;
}

function isUnsupportedPlaceholderHookCurrentnessReport(report) {
  return validateUnsupportedPlaceholderHookCurrentnessReport(report) === null;
}

function validateUnsupportedPlaceholderHookCurrentnessReport(report) {
  if (!isObjectLike(report)) {
    return 'unsupported-placeholder-hook-currentness-not-frozen';
  }

  if (!unsupportedPlaceholderHookCurrentnessReports.has(report)) {
    return 'unsupported-placeholder-hook-currentness-source-proof';
  }

  if (!Object.isFrozen(report)) {
    return 'unsupported-placeholder-hook-currentness-not-frozen';
  }

  if (
    report.kind !== unsupportedPlaceholderHookCurrentnessReportKind ||
    report.version !== unsupportedPlaceholderHookCurrentnessReportVersion ||
    report.status !== unsupportedPlaceholderHookCurrentnessStatus ||
    report.compatibilityTarget !== 'react@19.2.6' ||
    !hasSameFrozenStringArray(
      report.hookNames,
      unsupportedPlaceholderHookNames
    ) ||
    !hasSameFrozenStringArray(
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
    !hasSameFrozenRecordArrayFields(
      report.publicShapeBlockers,
      unsupportedPlaceholderHookPublicShapeBlockers,
      unsupportedPlaceholderHookPublicShapeBlockerFields
    )
  ) {
    return 'unsupported-placeholder-hook-currentness-public-shape';
  }

  if (
    !hasSameFrozenRecordFields(
      report.sourceReport,
      unsupportedPlaceholderHookSourceReport,
      unsupportedPlaceholderHookSourceReportFieldNames
    )
  ) {
    return 'unsupported-placeholder-hook-currentness-source-report';
  }

  if (
    !hasSameFrozenRecordFields(
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

function validatePrivateRefHookDispatcherMetadata(metadata) {
  if (!isPrivateRefHookDispatcherMetadata(metadata)) {
    throw createInvalidHookCallError('useRef');
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

function hasSameFrozenStringArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    Object.isFrozen(actual) &&
    hasSameStringArray(actual, expected)
  );
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

function hasSameFrozenRecordFields(actual, expected, fieldNames) {
  return (
    isObjectLike(actual) &&
    Object.isFrozen(actual) &&
    hasSameRecordFields(actual, expected, fieldNames)
  );
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

function hasSameFrozenRecordArrayFields(actual, expected, fieldNames) {
  if (
    !Array.isArray(actual) ||
    !Object.isFrozen(actual) ||
    actual.length !== expected.length
  ) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (
      !hasSameFrozenRecordFields(actual[index], expected[index], fieldNames)
    ) {
      return false;
    }
  }

  return true;
}

function hasSameUseRefSurfaceCurrentnessRows(actual, expected) {
  if (
    !Array.isArray(actual) ||
    !Object.isFrozen(actual) ||
    actual.length !== expected.length
  ) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (!hasSameUseRefSurfaceCurrentnessRow(actual[index], expected[index])) {
      return false;
    }
  }

  return true;
}

function hasSameUseRefSurfaceCurrentnessRow(actual, expected) {
  if (!isObjectLike(actual) || !Object.isFrozen(actual)) {
    return false;
  }

  for (const fieldName of useRefHookSurfaceCurrentnessFieldNames) {
    if (actual[fieldName] !== expected[fieldName]) {
      return false;
    }
  }

  return true;
}

function hasSameUseRefRendererLifecycleBlockerRows(actual, expected) {
  if (
    !Array.isArray(actual) ||
    !Object.isFrozen(actual) ||
    actual.length !== expected.length
  ) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (
      !hasSameUseRefRendererLifecycleBlockerRow(actual[index], expected[index])
    ) {
      return false;
    }
  }

  return true;
}

function hasSameUseRefRendererLifecycleBlockerRow(actual, expected) {
  if (!isObjectLike(actual) || !Object.isFrozen(actual)) {
    return false;
  }

  for (const fieldName of useRefHookRendererLifecycleBlockerRowFieldNames) {
    if (actual[fieldName] !== expected[fieldName]) {
      return false;
    }
  }

  return true;
}

function hasUseRefRendererLifecyclePrivateEvidenceIdentity(report) {
  return (
    report.rootUseRefSourceFunctionCurrent === true &&
    report.privateDispatcherMetadataIdentityCurrent === true &&
    report.sourceOwnedPrivateDispatcherExecution === true &&
    report.sourceOwnedPrivateRefObject === true &&
    report.sourceOwnedPrivateRefObjectFrozen === true &&
    report.privateExecutionEvidence.rootUseRefSourceFunctionCurrent === true &&
    report.privateExecutionEvidence.privateDispatcherMarked === true &&
    report.privateExecutionEvidence.sourceOwnedDispatcherExecution === true &&
    report.privateExecutionEvidence.sourceOwnedRefObject === true
  );
}

function hasSourceOwnedUseRefExecutionRecords(report) {
  const mount = report.mountCallRecord;
  const update = report.updateCallRecord;

  if (
    !hasUseRefExecutionCallRecordShape(mount) ||
    !hasUseRefExecutionCallRecordShape(update)
  ) {
    return false;
  }

  return (
    report.privateDispatcherMarked === true &&
    report.sourceOwnedDispatcherExecution === true &&
    mount.phase === 'Mount' &&
    mount.hookName === 'useRef' &&
    mount.callIndex === 0 &&
    mount.initialValue === useRefHookExecutionMountInitialValue &&
    mount.metadataIdentityCurrent === true &&
    mount.thisMatchesDispatcher === true &&
    mount.privateDispatcherMarked === true &&
    mount.executionErrorCode === null &&
    update.phase === 'Update' &&
    update.hookName === 'useRef' &&
    update.callIndex === 1 &&
    update.initialValue === useRefHookExecutionUpdateInitialValue &&
    update.metadataIdentityCurrent === true &&
    update.thisMatchesDispatcher === true &&
    update.privateDispatcherMarked === true &&
    update.executionErrorCode === null &&
    mount.returnedRefObject === report.refIdentityRecord.mountRefObject &&
    update.returnedRefObject === report.refIdentityRecord.updateRefObject
  );
}

function hasUseRefExecutionCallRecordShape(record) {
  if (!isObjectLike(record) || !Object.isFrozen(record)) {
    return false;
  }

  for (const fieldName of useRefHookExecutionCallRecordFieldNames) {
    if (!Object.prototype.hasOwnProperty.call(record, fieldName)) {
      return false;
    }
  }

  return true;
}

function hasSourceOwnedUseRefRefObject(report) {
  const identity = report.refIdentityRecord;

  return (
    isObjectLike(identity) &&
    Object.isFrozen(identity) &&
    identity.callerSuppliedRefObjectAccepted === false &&
    report.sourceOwnedRefObject === true &&
    identity.sourceOwnedRefObject === true &&
    isObjectLike(identity.mountRefObject) &&
    Object.isFrozen(identity.mountRefObject) &&
    useRefHookExecutionRefObjects.has(identity.mountRefObject)
  );
}

function hasStableUseRefRefIdentityEvidence(report) {
  const identity = report.refIdentityRecord;

  if (!isObjectLike(identity) || !Object.isFrozen(identity)) {
    return false;
  }

  for (const fieldName of useRefHookRefIdentityRecordFieldNames) {
    if (!Object.prototype.hasOwnProperty.call(identity, fieldName)) {
      return false;
    }
  }

  return (
    identity.mountRefObject === report.mountCallRecord.returnedRefObject &&
    identity.updateRefObject === report.updateCallRecord.returnedRefObject &&
    identity.mountRefObject === identity.updateRefObject &&
    identity.mountUpdateRefObjectSame === true &&
    identity.mountCurrentValue === useRefHookExecutionMountInitialValue &&
    identity.updateCurrentValue === useRefHookExecutionMountInitialValue &&
    identity.updateInitialValue === useRefHookExecutionUpdateInitialValue &&
    identity.updateInitialValueIgnored === true &&
    identity.refIdentityCompatibilityClaimed === false &&
    identity.refObjectCompatibilityClaimed === false
  );
}

function hasBlockedUseRefExecutionPrerequisites(report) {
  return (
    report.publicRootRenderingBlocked === true &&
    report.rootSchedulerIntegrationBlocked === true &&
    report.schedulerTimingBlocked === true &&
    report.actIntegrationBlocked === true &&
    report.rendererCompatibilityBlocked === true &&
    report.callbackInvocationBlocked === true &&
    report.externalStoreInvocationBlocked === true &&
    report.idGenerationBlocked === true &&
    report.rendererIntegration === false &&
    report.rendererCompatibility === false &&
    report.publicActIntegration === false &&
    report.schedulerIntegration === false &&
    report.schedulerPrerequisitesReady === false &&
    report.rootLaneIntegration === false &&
    report.rootScheduling === false &&
    report.rootExecution === false &&
    report.callbackExecutionClaimed === false &&
    report.externalStoreSubscriptionClaimed === false &&
    report.externalStoreSnapshotReadClaimed === false &&
    report.idGenerationClaimed === false
  );
}

function hasBlockedUseRefExecutionCompatibilityClaims(report) {
  for (const flagName of useRefHookCompatibilityFalseFlags) {
    if (report[flagName] !== false) {
      return false;
    }
  }

  return (
    report.refIdentityRecord.refIdentityCompatibilityClaimed === false &&
    report.refIdentityRecord.refObjectCompatibilityClaimed === false
  );
}

function hasBlockedUseRefRendererLifecyclePrerequisites(report) {
  return (
    report.publicUseRefCompatibilityBlocked === true &&
    report.rendererRefObjectIdentityBlocked === true &&
    report.rendererRefObjectMutabilityBlocked === true &&
    report.dispatcherLifecycleBlocked === true &&
    report.rootRenderingBlocked === true &&
    report.rootCommitHookListRebindingBlocked === true &&
    report.rootSchedulerIntegrationBlocked === true &&
    report.schedulerTimingBlocked === true &&
    report.actIntegrationBlocked === true &&
    report.callbackHookCompatibilityBlocked === true &&
    report.externalStoreCompatibilityBlocked === true &&
    report.idGenerationCompatibilityBlocked === true &&
    report.packageCompatibilityBlocked === true &&
    report.realJsRefObjectRendererCompatibility === false &&
    report.refObjectMutabilityCompatibility === false &&
    report.dispatcherLifecycleCompatibility === false &&
    report.rootRenderingCompatibility === false &&
    report.schedulerTimingCompatibility === false &&
    report.actCompatibility === false &&
    report.rendererIntegration === false &&
    report.rendererCompatibility === false &&
    report.publicActIntegration === false &&
    report.schedulerIntegration === false &&
    report.schedulerPrerequisitesReady === false &&
    report.rootLaneIntegration === false &&
    report.rootScheduling === false &&
    report.rootExecution === false &&
    report.callbackExecutionClaimed === false &&
    report.externalStoreSubscriptionClaimed === false &&
    report.externalStoreSnapshotReadClaimed === false &&
    report.idGenerationClaimed === false
  );
}

function hasBlockedUseRefRendererLifecycleCompatibilityClaims(report) {
  for (const flagName of useRefHookRendererLifecycleCompatibilityFalseFlags) {
    if (report[flagName] !== false) {
      return false;
    }
  }

  return true;
}

function hasSameContextRendererReadinessRows(actual, expected) {
  if (
    !Array.isArray(actual) ||
    !Object.isFrozen(actual) ||
    actual.length !== expected.length
  ) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (!hasSameContextRendererReadinessRow(actual[index], expected[index])) {
      return false;
    }
  }

  return true;
}

function hasSameContextRendererReadinessRow(actual, expected) {
  if (!isObjectLike(actual) || !Object.isFrozen(actual)) {
    return false;
  }

  for (const fieldName of contextHookRendererReadinessRowFieldNames) {
    if (actual[fieldName] !== expected[fieldName]) {
      return false;
    }
  }

  return true;
}

function hasSourceOwnedContextObjectRecord(record, snapshot) {
  if (
    !isObjectLike(record) ||
    !Object.isFrozen(record) ||
    !isObjectLike(snapshot) ||
    snapshot.contextObject !== record.contextObject ||
    !isSourceOwnedContextObject(record.contextObject) ||
    record.sourceOwnedContextObject !== true ||
    record.providerEqualsContext !== true ||
    record.consumerContextMatchesContext !== true ||
    record.contextTypeMatchesReactContextSymbol !== true ||
    record.consumedContextObject !== record.contextObject ||
    record.consumedSourceOwnedContextObject !== true ||
    record.readValue !== snapshot.currentValue ||
    record.readErrorCode !== null ||
    record.callerSuppliedContextObjectAccepted !== false
  ) {
    return false;
  }

  return hasCurrentContextObjectSnapshot(record.contextObject, snapshot);
}

function captureContextHookRendererReadinessContextObjectSnapshot(context) {
  if (!isObjectLike(context)) {
    return null;
  }

  const consumer = context.Consumer;
  return freezeRecord({
    contextObject: context,
    provider: context.Provider,
    consumer,
    contextType: context.$$typeof,
    consumerType: isObjectLike(consumer) ? consumer.$$typeof : undefined,
    consumerContext: isObjectLike(consumer) ? consumer._context : undefined,
    currentValue: context._currentValue,
    currentValue2: context._currentValue2
  });
}

function hasCurrentContextObjectSnapshot(context, snapshot) {
  try {
    const consumer = context.Consumer;

    return (
      isObjectLike(context) &&
      isSourceOwnedContextObject(context) &&
      snapshot.contextObject === context &&
      context.Provider === snapshot.provider &&
      snapshot.provider === context &&
      consumer === snapshot.consumer &&
      isObjectLike(consumer) &&
      consumer.$$typeof === snapshot.consumerType &&
      snapshot.consumerType === Symbol.for('react.consumer') &&
      consumer._context === snapshot.consumerContext &&
      snapshot.consumerContext === context &&
      context.$$typeof === snapshot.contextType &&
      snapshot.contextType === Symbol.for('react.context') &&
      context._currentValue === snapshot.currentValue &&
      context._currentValue2 === snapshot.currentValue2
    );
  } catch (_error) {
    return false;
  }
}

function isRootUseContextSourceFunctionCurrent() {
  try {
    return require('./index.js').useContext === useContext;
  } catch (_error) {
    return false;
  }
}

function hasBlockedContextHookRendererReadinessPrerequisites(report) {
  return (
    report.publicUseContextCompatibilityBlocked === true &&
    report.contextObjectConsumptionBlocked === true &&
    report.providerRendererLifecycleBlocked === true &&
    report.contextDependencyPropagationBlocked === true &&
    report.rootRendererSchedulingBlocked === true &&
    report.schedulerTimingBlocked === true &&
    report.actIntegrationBlocked === true &&
    report.suspenseContextPropagationBlocked === true &&
    report.packageCompatibilityBlocked === true &&
    report.contextObjectConsumptionCompatibility === false &&
    report.providerRenderCompatibility === false &&
    report.runtimeProviderPropagation === false &&
    report.rendererVisiblePropagation === false &&
    report.rendererIntegration === false &&
    report.rendererCompatibility === false &&
    report.publicActIntegration === false &&
    report.schedulerIntegration === false &&
    report.schedulerPrerequisitesReady === false &&
    report.schedulerTimingCompatibility === false &&
    report.rootLaneIntegration === false &&
    report.rootScheduling === false &&
    report.rootExecution === false &&
    report.suspenseContextPropagation === false
  );
}

function hasBlockedContextHookRendererReadinessCompatibilityClaims(report) {
  for (const flagName of contextHookRendererReadinessCompatibilityFalseFlags) {
    if (report[flagName] !== false) {
      return false;
    }
  }

  return true;
}

function hasSameSurfaceCurrentnessRows(actual, expected) {
  if (
    !Array.isArray(actual) ||
    !Object.isFrozen(actual) ||
    actual.length !== expected.length
  ) {
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
      if (!hasSameFrozenStringArray(actualValue, expectedValue)) {
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

  return hasSameFrozenRecordFields(
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

  return hasSameFrozenRecordFields(
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

  return hasSameFrozenRecordFields(
    report.idGenerationReport,
    unsupportedPlaceholderHookIdGenerationReport,
    unsupportedPlaceholderHookIdGenerationReportFieldNames
  );
}

function freezeArray(values) {
  return Object.freeze(values.slice());
}

function captureOwnDataOptions(options, callerProvided) {
  const values = Object.create(null);
  const callerProvidedObject =
    callerProvided && options !== null && options !== undefined;
  const ownKeys = [];

  if (callerProvidedObject) {
    try {
      const descriptors = Object.getOwnPropertyDescriptors(Object(options));
      for (const key of Reflect.ownKeys(descriptors)) {
        ownKeys.push(key);
        const descriptor = descriptors[key];
        if (Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
          values[key] = descriptor.value;
        }
      }
    } catch {
      ownKeys.push('unreadable-caller-options');
    }
  }

  return freezeRecord({
    values,
    overrideKeys: callerProvidedObject
      ? freezeArray(['caller-options-object', ...ownKeys])
      : freezeArray([])
  });
}

function captureKnownOwnDataOptions(options, callerProvided, knownOptionNames) {
  const values = Object.create(null);
  const callerProvidedObject =
    callerProvided && options !== null && options !== undefined;
  const overrideKeys = [];
  const descriptorKeys = new Set();

  if (callerProvidedObject) {
    overrideKeys.push('caller-options-object');

    try {
      const descriptors = Object.getOwnPropertyDescriptors(Object(options));

      for (const key of Reflect.ownKeys(descriptors)) {
        descriptorKeys.add(key);
        overrideKeys.push(key);

        const descriptor = descriptors[key];
        if (
          typeof key === 'string' &&
          knownOptionNames.includes(key) &&
          Object.prototype.hasOwnProperty.call(descriptor, 'value')
        ) {
          values[key] = descriptor.value;
        }
      }
    } catch {
      overrideKeys.push('unreadable-caller-options');
    }

    for (const key of knownOptionNames) {
      if (descriptorKeys.has(key)) {
        continue;
      }

      try {
        if (Object.prototype.hasOwnProperty.call(Object(options), key)) {
          overrideKeys.push(`proxy-hidden:${key}`);
        }
      } catch {
        overrideKeys.push(`unreadable-known-option:${key}`);
      }
    }
  }

  return freezeRecord({
    values,
    overrideKeys: freezeArray(overrideKeys)
  });
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function createUseRefRendererLifecycleBlockerRows(rowOverridesById) {
  const rowOverrides = rowOverridesById ?? {};

  return freezeUseRefRendererLifecycleBlockerRows(
    useRefHookRendererLifecycleBlockerRows.map((row) =>
      Object.prototype.hasOwnProperty.call(rowOverrides, row.blockerId)
        ? { ...row, ...rowOverrides[row.blockerId] }
        : row
    )
  );
}

function createContextRendererReadinessRows(rowOverridesById) {
  const rowOverrides = rowOverridesById ?? {};

  return freezeContextRendererReadinessRows(
    contextHookRendererReadinessRows.map((row) =>
      Object.prototype.hasOwnProperty.call(rowOverrides, row.rowId)
        ? { ...row, ...rowOverrides[row.rowId] }
        : row
    )
  );
}

function freezeUseRefSurfaceCurrentnessRow(row) {
  const surfaceRow = {};

  for (const fieldName of useRefHookSurfaceCurrentnessFieldNames) {
    surfaceRow[fieldName] = row[fieldName];
  }

  return freezeRecord(surfaceRow);
}

function freezeUseRefSurfaceCurrentnessRows(rows) {
  return freezeArray((rows ?? []).map(freezeUseRefSurfaceCurrentnessRow));
}

function freezeUseRefRendererLifecycleBlockerRow(row) {
  const blockerRow = {};

  for (const fieldName of useRefHookRendererLifecycleBlockerRowFieldNames) {
    blockerRow[fieldName] = row[fieldName];
  }

  return freezeRecord(blockerRow);
}

function freezeUseRefRendererLifecycleBlockerRows(rows) {
  return freezeArray(
    (rows ?? []).map(freezeUseRefRendererLifecycleBlockerRow)
  );
}

function freezeContextRendererReadinessRow(row) {
  const readinessRow = {};

  for (const fieldName of contextHookRendererReadinessRowFieldNames) {
    readinessRow[fieldName] = row[fieldName];
  }

  return freezeRecord(readinessRow);
}

function freezeContextRendererReadinessRows(rows) {
  return freezeArray((rows ?? []).map(freezeContextRendererReadinessRow));
}

function freezeUseRefHookExecutionCallRecord({
  expectedPhase,
  expectedCallIndex,
  expectedInitialValue,
  observedCall,
  returnedRefObject,
  executionError
}) {
  return freezeRecord({
    phase: observedCall?.phase ?? expectedPhase,
    hookName: observedCall?.hookName ?? 'useRef',
    callIndex: observedCall?.callIndex ?? expectedCallIndex,
    initialValue: observedCall?.initialValue ?? expectedInitialValue,
    metadataIdentityCurrent:
      observedCall?.metadataIdentityCurrent ?? false,
    thisMatchesDispatcher: observedCall?.thisMatchesDispatcher ?? false,
    privateDispatcherMarked:
      observedCall?.privateDispatcherMarked ?? false,
    returnedRefObject,
    returnedCurrent: isObjectLike(returnedRefObject)
      ? returnedRefObject.current
      : undefined,
    executionErrorCode: executionError?.code ?? null
  });
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
  return callPrivateRefDispatcherHook('useRef', arguments);
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
  callPrivateRefDispatcherHook,
  callPrivateStateDispatcherHook,
  consumeContextHookRendererReadinessReport,
  consumeUseRefHookExecutionEvidence,
  consumeUseRefHookCurrentnessReport,
  consumeUseRefHookRendererLifecycleBlockerReport,
  consumeUnsupportedPlaceholderHookCurrentnessReport,
  createInvalidHookCallError,
  createContextHookRendererReadinessReport,
  createMissingPrivateStateHookDispatcherError,
  createUseRefHookExecutionEvidence,
  createUseRefHookCurrentnessReport,
  createUseRefHookRendererLifecycleBlockerReport,
  createUnsupportedPlaceholderHookCurrentnessReport,
  createUnsupportedPrivateTransitionCallbackError,
  effectHookMetadataByHookName,
  effectHookNames,
  getEffectHookMetadata,
  getPrivateCallbackHookDispatcherMetadata,
  getPrivateContextHookDispatcherMetadata,
  getPrivateEffectHookDispatcherMetadata,
  getPrivateMemoHookDispatcherMetadata,
  getPrivateRefHookDispatcherMetadata,
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
  isPrivateRefHookDispatcher,
  isPrivateRefHookDispatcherMetadata,
  isPrivateStateHookDispatcher,
  isPrivateStateHookDispatcherMetadata,
  isPrivateTransitionHookDispatcher,
  isPrivateTransitionHookDispatcherMetadata,
  isContextHookRendererReadinessReport,
  isUseRefHookExecutionEvidence,
  isUseRefHookCurrentnessReport,
  isUseRefHookRendererLifecycleBlockerReport,
  isUnsupportedPlaceholderHookCurrentnessReport,
  markPrivateCallbackHookDispatcher,
  markPrivateContextHookDispatcher,
  markPrivateEffectHookDispatcher,
  markPrivateMemoHookDispatcher,
  markPrivateRefHookDispatcher,
  markPrivateStateHookDispatcher,
  markPrivateTransitionHookDispatcher,
  privateUnsupportedPlaceholderHookBlockerMetadata,
  privateCallbackHookDispatcherMetadata,
  privateContextHookDispatcherMetadata,
  privateEffectHookDispatcherMetadata,
  privateMemoHookDispatcherMetadata,
  privateRefHookDispatcherMetadata,
  privateStateHookDispatcherMetadata,
  privateTransitionHookDispatcherMetadata,
  recordPrivateStartTransitionDispatcherRouting,
  resolveDispatcher,
  contextHookNames,
  contextHookRendererReadinessConsumptionStatus,
  contextHookRendererReadinessReportFieldNames,
  contextHookRendererReadinessRowFieldNames,
  contextHookRendererReadinessRows,
  contextHookRendererReadinessSourceReport,
  contextHookRendererReadinessSourceReportFieldNames,
  contextHookRendererReadinessStatus,
  contextHookRendererReadinessCompatibilityFalseFlags,
  transitionHookNames,
  useRefHookExecutionEvidenceConsumptionStatus,
  useRefHookExecutionEvidenceStatus,
  useRefHookExecutionEvidenceFieldNames,
  useRefHookExecutionCallRecordFieldNames,
  useRefHookExecutionSourceReportFieldNames,
  useRefHookExecutionSourceReport,
  useRefHookRefIdentityRecordFieldNames,
  useRefHookRendererLifecycleBlockerConsumptionStatus,
  useRefHookRendererLifecycleBlockerReportFieldNames,
  useRefHookRendererLifecycleBlockerRowFieldNames,
  useRefHookRendererLifecycleBlockerRows,
  useRefHookRendererLifecycleBlockerSourceReport,
  useRefHookRendererLifecycleBlockerSourceReportFieldNames,
  useRefHookRendererLifecycleBlockerStatus,
  useRefHookRendererLifecycleCompatibilityFalseFlags,
  useRefHookCurrentnessConsumptionStatus,
  useRefHookCurrentnessStatus,
  useRefHookNames,
  useRefHookSurfaceCurrentnessFieldNames,
  useRefHookSurfaceCurrentnessRows,
  unsupportedPlaceholderHookSurfaceCurrentnessFieldNames,
  unsupportedPlaceholderHookSurfaceCurrentnessRows,
  unsupportedPlaceholderHookCurrentnessConsumptionStatus,
  unsupportedPlaceholderHookCurrentnessStatus,
  unsupportedPlaceholderHookNames,
  validateContextHookRendererReadinessReport,
  validateUseRefHookExecutionEvidence,
  validateUseRefHookCurrentnessReport,
  validateUseRefHookRendererLifecycleBlockerReport,
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
