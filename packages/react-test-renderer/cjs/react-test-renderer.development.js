'use strict';

const compatibilityTarget = 'react-test-renderer@19.2.6';
const entrypoint =
  'react-test-renderer/cjs/react-test-renderer.development';
const placeholderVersion = '0.0.0-fast-react-test-renderer-placeholder';
const unimplementedCode = 'FAST_REACT_UNIMPLEMENTED';
const actSchedulerGateStatus =
  'blocked-private-react-test-renderer-act-scheduler-metadata-only';
const actWarningThenableBlockerStatus =
  'blocked-private-react-test-renderer-act-warning-thenable-diagnostics-only';
const actNestedScopeBlockerStatus =
  'blocked-private-react-test-renderer-act-nested-scope-diagnostics-only';
const actRootPassiveSequenceStatus =
  'blocked-private-react-test-renderer-act-root-passive-sequence-diagnostics-only';
const actNestedScopePassiveFlushStatus =
  'private-act-nested-scope-passive-flush-public-act-blocked';
const createRoutingGateStatus =
  'blocked-missing-react-test-renderer-create-routing-prerequisites';
const publicAsyncActCompatibilityBlockerIds = Object.freeze([
  'public-react-test-renderer-act-warning-emission',
  'public-react-test-renderer-act-thenable-awaiting',
  'public-react-test-renderer-async-act-scope-settlement'
]);
const publicNestedActScopeCompatibilityBlockerIds = Object.freeze([
  'public-react-test-renderer-act-scope-depth-tracking',
  'public-react-test-renderer-nested-act-queue-reuse',
  'public-react-test-renderer-overlapping-act-warning-emission'
]);
const actSchedulerMissingBeforeExecution = Object.freeze([
  'public-react-test-renderer-act-queue-drain',
  'public-react-test-renderer-scheduler-flush-execution',
  'public-react-test-renderer-root-sync-flush-route',
  'react-test-renderer-renderer-roots-compatibility-admission',
  'react-test-renderer-passive-effect-callback-execution',
  'react-test-renderer-private-root-request-execution',
  ...publicAsyncActCompatibilityBlockerIds,
  ...publicNestedActScopeCompatibilityBlockerIds
]);
const privateActQueueFlushDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__';
const privateActPassiveEffectDrainDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTICS__';
const reactCompatibilityTarget = 'react@19.2.6';
const schedulerCompatibilityTarget = 'scheduler@0.27.0';
const privateActQueueTestQueueKind =
  'fast-react.react.private-act-queue-test-queue';
const privateActQueueTestTaskKind =
  'fast-react.react.private-act-queue-test-task';
const privateActQueueTestCallbackKind =
  'fast-react.react.private-act-queue-test-callback';
const privateActQueueTestQueueVersion = 1;
const privateActPassiveEffectDrainMetadataKind =
  'fast-react.react-test-renderer.private-act-passive-effect-drain-metadata';
const privateActPassiveEffectDrainRecordKind =
  'fast-react.react-test-renderer.private-act-passive-effect-drain-record';
const privateActPassiveEffectDrainVersion = 1;
const privateActNativeUpdatePassiveEffectDrainDiagnosticId =
  'react-test-renderer-act-native-update-passive-drain-private-diagnostic';
const privateActNativeUpdatePassiveEffectDrainPrerequisiteId =
  'private-native-update-execution-passive-effect-drain-metadata';
const privateActNativeUpdatePassiveEffectDrainStatus =
  'private-act-native-update-passive-effect-drain-public-act-blocked';
const privateActNestedScopePassiveFlushDiagnosticId =
  'react-test-renderer-act-nested-scope-passive-flush-private-diagnostic';
const privateActNestedScopePassiveFlushPrerequisiteId =
  'private-nested-act-scope-passive-flush-order-metadata';
const privateActQueueTestQueueBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-queue'
);
const privateActQueueTestTaskBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-task'
);
const privateFlushSyncActRoutingDiagnosticsSymbol = Symbol.for(
  'fast.react_test_renderer.private_flushsync_act_routing_diagnostics'
);
const privateFlushSyncActRoutingDiagnosticsStatus =
  'private-flushsync-act-routing-diagnostics-public-flushsync-blocked';
const privateRootCreatePreflightDiagnosticName =
  'fast-react-test-renderer.root-create.private-preflight';
const privateRootCreatePreflightStatus =
  'private-root-create-preflight-ready-public-root-blocked';
const privateRootCreateWorkLoopFinishedWorkPreflightRowId =
  'react-test-renderer-root-create-work-loop-finished-work-private-diagnostic';
const privateRootCreateWorkLoopFinishedWorkPreflightStatus =
  'private-root-create-work-loop-finished-work-preflight-public-root-blocked';
const privateRootWorkLoopFinishedWorkPreflightMetadataId =
  'fast-react-test-renderer-root-work-loop-finished-work-preflight-metadata';
const privateRootWorkLoopFinishedWorkPreflightMetadataStatus =
  'accepted-root-work-loop-finished-work-preflight-metadata';
const privateCreateRouteAdmissionDiagnosticName =
  'fast-react-test-renderer.create-route.private-admission';
const privateCreateRouteAdmissionStatus =
  'private-create-route-admission-rust-root-create-work-loop-evidence-public-create-blocked';
const privateCreateRouteAdmissionRecordId =
  'react-test-renderer-create-route-admission-private-diagnostic';
const privateCreateRouteAdmissionMetadataId =
  'fast-react-test-renderer-create-route-admission-metadata';
const privateCreateRouteAdmissionMetadataStatus =
  'accepted-create-route-rust-root-create-work-loop-admission-metadata';
const privateCreateNativeBridgeHostOutputHandoffDiagnosticId =
  'react-test-renderer-create-native-bridge-host-output-handoff-private-diagnostic';
const privateCreateNativeBridgeHostOutputHandoffStatus =
  'private-create-native-bridge-host-output-handoff-public-create-blocked';
const privateRootCreatePreflightSymbol = Symbol.for(
  'fast.react_test_renderer.private_root_create_preflight'
);
const privateActPassiveEffectDrainMetadataBrand = Symbol.for(
  'fast.react_test_renderer.private_act_passive_effect_drain_metadata'
);
const privateActPassiveEffectDrainRecordBrand = Symbol.for(
  'fast.react_test_renderer.private_act_passive_effect_drain_record'
);
const privateActNestedScopePassiveFlushBrand = Symbol.for(
  'fast.react_test_renderer.private_act_nested_scope_passive_flush_record'
);
const mockSchedulerFlushHelperRoutingStatus =
  'react-test-renderer-routed-accepted-mock-scheduler-flush-helper-metadata';
const mockSchedulerExpiredWorkRoutingStatus =
  'react-test-renderer-routed-accepted-mock-scheduler-expired-work-metadata';
const mockSchedulerExpiredActRootWorkRoutingStatus =
  'react-test-renderer-routed-accepted-mock-scheduler-expired-act-root-work-metadata';
const privateSchedulerMockExpiredWorkMetadataKind =
  'fast-react.scheduler.mock-expired-work-diagnostics';
const privateSchedulerMockExpiredWorkMetadataBrand = Symbol.for(
  privateSchedulerMockExpiredWorkMetadataKind
);
const privateSchedulerMockExpiredWorkMetadataVersion = 1;
const privateSchedulerMockExpiredActRootWorkMetadataKind =
  'fast-react.scheduler.mock-expired-act-root-work-metadata';
const privateSchedulerMockExpiredActRootWorkMetadataBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkMetadataKind
);
const privateSchedulerMockExpiredActRootWorkMetadataVersion = 1;
const privateSchedulerMockExpiredActRootWorkDiagnosticsKind =
  'fast-react.scheduler.mock-expired-act-root-work-diagnostics';
const privateSchedulerMockExpiredActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkDiagnosticsKind
);
const privateSchedulerMockExpiredActRootWorkDiagnosticsVersion = 1;
const acceptedExpiredActRootWorkRecordKinds = Object.freeze([
  'RootLaneSchedulingSnapshot',
  'UpdateContainerResult',
  'RootScheduleUpdateRecord',
  'RootTaskScheduleRecord',
  'SchedulerCallbackRequest',
  'RootSchedulerCallbackExecutionRecord',
  'HostRootFinishedWorkPendingCommitRecordForCanary',
  'HostRootFinishedWorkCommitHandoffRecordForCanary'
]);
const actNestedScopeBlockerIds = Object.freeze([
  'react-test-renderer-act-nested-sync-scope-blocker',
  'react-test-renderer-act-overlapping-async-scope-blocker',
  'react-test-renderer-act-overlapping-sync-async-scope-blocker'
]);
const privateActRootPassivePrerequisiteSequenceId =
  'react-test-renderer-act-private-root-passive-prerequisite-sequence';
const privateActNestedScopePassiveFlushOrder = Object.freeze([
  'outer-act-scope-enter',
  'inner-act-scope-enter',
  'accepted-passive-work-flush',
  'inner-act-scope-exit',
  'outer-act-scope-exit'
]);
const acceptedActQueueRecordKinds = Object.freeze([
  'SchedulerActQueueRequest',
  'SchedulerActScopeBoundaryRecord',
  'SyncFlushActContinuationRecord'
]);
const acceptedActQueueTaskKinds = Object.freeze([
  'RootSchedule',
  'SchedulerCallback'
]);
const acceptedActQueueContinuationStatuses = Object.freeze([
  'NoContinuation',
  'PendingContinuation'
]);
const acceptedPassiveEffectDrainRecordKinds = Object.freeze([
  'PendingPassiveCommitHandoff',
  'PassiveEffectSchedulerFlushGateRecord',
  'SchedulerPassiveEffectsFlushRequest',
  'PassiveEffectSchedulerFlushExecutionRecord',
  'PassiveEffectsFlushResult'
]);
const schedulerMockFlushHelperMetadata = Object.freeze([
  Object.freeze({
    key: 'unstable_flushAll',
    acceptedOracle: 'scheduler-0.27.0-mock-oracle',
    acceptedScenario: 'scheduler-mock-export-shape',
    descriptor: Object.freeze({
      kind: 'data',
      configurable: true,
      enumerable: true,
      writable: true,
      value: Object.freeze({ type: 'function', name: '', length: 0 })
    })
  }),
  Object.freeze({
    key: 'unstable_flushAllWithoutAsserting',
    acceptedOracle: 'scheduler-0.27.0-mock-oracle',
    acceptedScenario: 'scheduler-mock-export-shape',
    descriptor: Object.freeze({
      kind: 'data',
      configurable: true,
      enumerable: true,
      writable: true,
      value: Object.freeze({
        type: 'function',
        name: 'unstable_flushAllWithoutAsserting',
        length: 0
      })
    })
  }),
  Object.freeze({
    key: 'unstable_flushExpired',
    acceptedOracle: 'scheduler-0.27.0-mock-oracle',
    acceptedScenario: 'scheduler-mock-export-shape',
    descriptor: Object.freeze({
      kind: 'data',
      configurable: true,
      enumerable: true,
      writable: true,
      value: Object.freeze({ type: 'function', name: '', length: 0 })
    })
  }),
  Object.freeze({
    key: 'unstable_flushNumberOfYields',
    acceptedOracle: 'scheduler-0.27.0-mock-oracle',
    acceptedScenario: 'scheduler-mock-export-shape',
    descriptor: Object.freeze({
      kind: 'data',
      configurable: true,
      enumerable: true,
      writable: true,
      value: Object.freeze({ type: 'function', name: '', length: 1 })
    })
  }),
  Object.freeze({
    key: 'unstable_flushUntilNextPaint',
    acceptedOracle: 'scheduler-0.27.0-mock-oracle',
    acceptedScenario: 'scheduler-mock-export-shape',
    descriptor: Object.freeze({
      kind: 'data',
      configurable: true,
      enumerable: true,
      writable: true,
      value: Object.freeze({ type: 'function', name: '', length: 0 })
    })
  })
]);
const rootActSchedulerRecords = Object.freeze([
  Object.freeze({
    id: 'act-root-schedule-request',
    rustRecord: 'SchedulerActQueueRequest',
    taskKind: 'SchedulerActQueueTaskKind::RootSchedule',
    acceptedWorker: 'worker-176-act-queue-routing-skeleton',
    acceptedFields: Object.freeze([
      'kind',
      'node',
      'root',
      'scheduler_priority',
      'callback_priority'
    ]),
    queuedWorkExecution: false
  }),
  Object.freeze({
    id: 'act-render-callback-request',
    rustRecord: 'SchedulerActQueueRequest',
    taskKind: 'SchedulerActQueueTaskKind::RenderCallback',
    fakeCallbackNode: 'FAKE_ACT_CALLBACK_NODE',
    acceptedWorker: 'worker-176-act-queue-routing-skeleton',
    acceptedFields: Object.freeze([
      'kind',
      'node',
      'root',
      'scheduler_priority',
      'callback_priority'
    ]),
    queuedWorkExecution: false
  })
]);
const reactActPrivateDispatcherRecords = Object.freeze([
  Object.freeze({
    id: 'react-act-private-dispatcher-gate',
    jsExport: '__FAST_REACT_PRIVATE_ACT_DISPATCHER_GATE__',
    metadataKind: 'fast-react.react.act-queue-metadata',
    acceptedWorker: 'worker-277-react-act-queue-private-dispatcher-gate',
    requiredRecords: Object.freeze([
      'SchedulerActQueueRequest',
      'SchedulerActScopeBoundaryRecord',
      'SyncFlushActContinuationRecord'
    ]),
    requiredTaskKinds: Object.freeze(['RootSchedule', 'SchedulerCallback']),
    requiredContinuationStatuses: Object.freeze([
      'NoContinuation',
      'PendingContinuation'
    ]),
    publicCompatibilityClaimed: false,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    executesQueuedWork: false,
    executesEffects: false
  })
]);
const syncFlushActSchedulerRecords = Object.freeze([
  Object.freeze({
    id: 'sync-flush-act-continuation-record',
    rustRecord: 'SchedulerActContinuationRecord',
    producer: 'record_sync_flush_act_continuation',
    acceptedWorker: 'worker-252-sync-flush-act-continuation-skeleton',
    acceptedFields: Object.freeze([
      'root',
      'sync_flush_order',
      'flushed_lanes',
      'remaining_lanes',
      'continuation_lanes',
      'act_scope_depth',
      'nested_act_scope',
      'status'
    ]),
    queuedWorkExecution: false
  }),
  Object.freeze({
    id: 'sync-flush-act-post-passive-continuation-gate',
    rustRecord: 'SyncFlushActPostPassiveContinuationGateRecord',
    producer: 'sync_flush_act_post_passive_continuation_gate',
    acceptedWorker:
      'worker-285-sync-flush-act-continuation-post-passive-gate',
    acceptedFields: Object.freeze([
      'root',
      'sync_flush_order',
      'flushed_lanes',
      'remaining_lanes',
      'continuation_lanes',
      'pending_passive_finished_work',
      'pending_passive_lanes',
      'pending_passive_unmount_count',
      'pending_passive_mount_count',
      'act_scope_depth',
      'nested_act_scope'
    ]),
    queuedWorkExecution: false,
    passiveEffectExecution: false
  }),
  Object.freeze({
    id: 'sync-flush-post-passive-continuation-execution-gate',
    rustRecord: 'SyncFlushPostPassiveContinuationExecutionGateRecord',
    producer: 'sync_flush_post_passive_continuation_execution_gate',
    acceptedWorker:
      'worker-303-sync-flush-passive-continuation-execution-gate',
    acceptedFields: Object.freeze([
      'pending_passive_root',
      'pending_passive_finished_work',
      'pending_passive_lanes',
      'pending_passive_unmount_count',
      'pending_passive_mount_count',
      'execution_context',
      'exit_status',
      'continuation_roots'
    ]),
    queuedWorkExecution: false,
    syncFlushExecution: false,
    passiveEffectExecution: false
  }),
  Object.freeze({
    id: 'sync-flush-post-passive-continuation-execution-record',
    rustRecord: 'SyncFlushPostPassiveContinuationExecutionRecord',
    producer: 'flush_sync_post_passive_continuation_after_passive_effects',
    acceptedWorker:
      'worker-331-sync-flush-passive-continuation-execution',
    acceptedFields: Object.freeze([
      'gate',
      'sync_flush_result',
      'did_request_follow_up_sync_flush',
      'did_execute_follow_up_sync_flush',
      'did_flush_follow_up_sync_work'
    ]),
    privateFlushExecutionMetadata: true,
    publicSchedulerTaskExecution: false,
    publicActExecution: false,
    passiveEffectExecution: false
  }),
  Object.freeze({
    id: 'passive-effects-flush-with-sync-flush-continuation-result',
    rustRecord: 'PassiveEffectsFlushWithSyncFlushContinuationResult',
    producer:
      'flush_passive_effects_after_commit_and_sync_flush_continuation',
    acceptedWorker:
      'worker-331-sync-flush-passive-continuation-execution',
    acceptedFields: Object.freeze([
      'passive_effects',
      'sync_flush_continuation',
      'did_request_follow_up_sync_flush',
      'did_flush_follow_up_sync_work'
    ]),
    privateFlushExecutionMetadata: true,
    publicSchedulerTaskExecution: false,
    publicActExecution: false,
    createCallbackInvoked: false,
    destroyCallbackInvoked: false
  })
]);
const flushSyncActRoutingAcceptedReconcilerRecords = Object.freeze([
  'SchedulerActContinuationRecord',
  'SyncFlushActPostPassiveContinuationGateRecord',
  'SyncFlushPostPassiveContinuationExecutionGateRecord',
  'SyncFlushPostPassiveContinuationExecutionRecord',
  'PassiveEffectsFlushWithSyncFlushContinuationResult',
  'SyncFlushActContinuationDrainRecord',
  'SyncFlushActPrivateExecutionDiagnosticsForCanary',
  'SchedulerBridgeActContinuationExecutionRecord',
  'SyncFlushErrorRecoveryDiagnostics',
  'RootUpdateCallbackInvocationGateSnapshot'
]);
const passiveActFlushRecords = Object.freeze([
  Object.freeze({
    id: 'pending-passive-commit-handoff',
    rustRecord: 'PendingPassiveCommitHandoff',
    source: 'crates/fast-react-reconciler/src/root_commit.rs',
    acceptedWorker: 'worker-250-hook-effect-passive-commit-handoff',
    acceptedFields: Object.freeze([
      'root',
      'finished_work',
      'lanes',
      'pending_unmount_count',
      'pending_mount_count'
    ]),
    recordOnly: true,
    passiveEffectExecution: false
  }),
  Object.freeze({
    id: 'passive-effects-flush-record',
    rustRecord: 'PassiveEffectFlushRecord',
    source: 'crates/fast-react-reconciler/src/passive_effects.rs',
    acceptedWorker: 'worker-296-passive-effect-callback-handle-flush-gate',
    acceptedFields: Object.freeze([
      'flush_index',
      'root',
      'finished_work',
      'committed_lanes',
      'fiber',
      'effect_lanes',
      'phase',
      'pending_order',
      'unmount_origin',
      'effect'
    ]),
    callbackHandleMetadata: true,
    createCallbackInvoked: false,
    destroyCallbackInvoked: false,
    passiveEffectExecution: false
  }),
  Object.freeze({
    id: 'function-component-pending-passive-effect-phase-record',
    rustRecord: 'FunctionComponentPendingPassiveEffectPhaseCommitRecord',
    source: 'crates/fast-react-reconciler/src/root_commit.rs',
    acceptedWorker: 'worker-301-hook-effect-destroy-handoff-metadata',
    acceptedFields: Object.freeze([
      'fiber',
      'effect_index',
      'effect',
      'instance',
      'create',
      'destroy',
      'lanes',
      'phase',
      'order'
    ]),
    callbackHandleMetadata: true,
    passiveEffectExecution: false
  }),
  Object.freeze({
    id: 'passive-effect-callback-invocation-gate-snapshot',
    rustRecord: 'PassiveEffectCallbackInvocationGateSnapshot',
    source: 'crates/fast-react-reconciler/src/passive_effects.rs',
    acceptedWorker:
      'worker-326-passive-effect-create-destroy-callback-invocation-gate',
    acceptedFields: Object.freeze([
      'root',
      'finished_work',
      'lanes',
      'flush_status',
      'flush_record_count',
      'skipped_flush_records_without_callbacks',
      'records',
      'status',
      'blockers'
    ]),
    acceptedRecord: 'PassiveEffectCallbackInvocationRecord',
    acceptedRequest: 'PassiveEffectCallbackInvocationRequest',
    acceptedKinds: Object.freeze(['Destroy', 'Create']),
    acceptedStatuses: Object.freeze(['Completed', 'Errored']),
    testControlOnly: true,
    publicEffectExecution: false,
    publicActCompatibility: false,
    schedulerDrivenPassiveExecution: false
  }),
  Object.freeze({
    id: 'passive-effect-destroy-callback-execution-records',
    rustRecord: 'PassiveEffectDestroyCallbackExecutionRecord',
    source: 'crates/fast-react-reconciler/src/passive_effects.rs',
    acceptedWorker:
      'worker-349-hook-effect-destroy-callback-execution-private',
    acceptedFields: Object.freeze([
      'execution_order',
      'flush_record',
      'flush_index',
      'root',
      'finished_work',
      'committed_lanes',
      'fiber',
      'effect_lanes',
      'phase',
      'pending_order',
      'unmount_origin',
      'effect_index',
      'effect',
      'effect_instance',
      'destroy_callback'
    ]),
    acceptedErrorRecord: 'PassiveEffectDestroyCallbackErrorRecord',
    privateDestroyExecutionMetadata: true,
    testControlOnly: true,
    publicEffectExecution: false,
    publicActCompatibility: false,
    schedulerDrivenPassiveExecution: false
  }),
  Object.freeze({
    id: 'passive-effect-scheduler-flush-gate-record',
    rustRecord: 'PassiveEffectSchedulerFlushGateRecord',
    source: 'crates/fast-react-reconciler/src/root_scheduler.rs',
    acceptedWorker: 'worker-449-passive-effect-scheduler-flush-gate',
    acceptedFields: Object.freeze([
      'root',
      'finished_work',
      'lanes',
      'pending_unmount_count',
      'pending_mount_count',
      'scheduler_request',
      'status'
    ]),
    consumesPendingPassiveMetadata: true,
    schedulesPrivateFlushRequest: true,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    publicActCompatibility: false,
    publicSchedulerPackageBehaviorChanged: false
  }),
  Object.freeze({
    id: 'scheduler-passive-effects-flush-request',
    rustRecord: 'SchedulerPassiveEffectsFlushRequest',
    source: 'crates/fast-react-reconciler/src/scheduler_bridge.rs',
    acceptedWorker: 'worker-449-passive-effect-scheduler-flush-gate',
    acceptedFields: Object.freeze([
      'order',
      'node',
      'root',
      'finished_work',
      'lanes',
      'pending_unmount_count',
      'pending_mount_count',
      'scheduler_priority'
    ]),
    schedulerPriority: 'Normal',
    recordsPrivateSchedulerRequest: true,
    drainsPublicSchedulerTaskQueue: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    publicActCompatibility: false,
    publicSchedulerPackageBehaviorChanged: false
  }),
  Object.freeze({
    id: 'passive-effect-scheduler-flush-execution-record',
    rustRecord: 'PassiveEffectSchedulerFlushExecutionRecord',
    source: 'crates/fast-react-reconciler/src/passive_effects.rs',
    acceptedWorker: 'worker-449-passive-effect-scheduler-flush-gate',
    acceptedFields: Object.freeze([
      'execution_order',
      'scheduler_gate',
      'scheduler_request',
      'passive_effects'
    ]),
    consumesPendingPassiveMetadata: true,
    metadataOnlyFlush: true,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    publicActCompatibility: false,
    publicSchedulerPackageBehaviorChanged: false
  })
]);
const testRendererRootActFlushRecords = Object.freeze([
  Object.freeze({
    id: 'test-renderer-private-root-request-bridge',
    jsRecord: 'FastReactTestRendererPrivateRootRequestRecord',
    symbol: 'fast.react_test_renderer.root_request_bridge',
    acceptedWorker: 'worker-304-test-renderer-js-private-root-request-bridge',
    operations: Object.freeze(['create', 'update', 'unmount']),
    acceptedFields: Object.freeze([
      'operation',
      'requestId',
      'requestSequence',
      'requestType',
      'status',
      'executionStatus',
      'compatibilityStatus',
      'rootHandle',
      'rootElementHandle',
      'rustUpdateKind',
      'containerUpdateApi',
      'schedulerApi'
    ]),
    privateRootRequestExecution: false,
    nativeExecution: false,
    rustExecution: false,
    reconcilerExecution: false,
    hostOutputProduced: false
  }),
  Object.freeze({
    id: 'test-renderer-private-root-update-unmount-lifecycle',
    jsRecord: 'FastReactTestRendererPrivateRootRequestRecord',
    acceptedWorker:
      'worker-307-test-renderer-update-unmount-private-js-bridge',
    acceptedOutcomes: Object.freeze([
      'Scheduled',
      'AlreadyUnmountScheduled',
      'IgnoredAfterUnmount'
    ]),
    acceptedLifecycleStates: Object.freeze(['active', 'unmount-scheduled']),
    privateRootRequestExecution: false,
    nativeExecution: false,
    rustExecution: false,
    reconcilerExecution: false,
    hostOutputProduced: false
  }),
  Object.freeze({
    id: 'test-renderer-private-root-native-canary-metadata',
    jsRecord: 'FastReactTestRendererCurrentRustCanaryMetadata',
    symbol: 'fast.react_test_renderer.root_request_bridge',
    acceptedWorker: 'worker-332-test-renderer-js-private-root-native-bridge',
    acceptedRustRecords: Object.freeze([
      'TestRendererRoot',
      'TestRendererRootUpdateKind',
      'TestRendererRootScheduledUpdate',
      'HostRootCommitRecord',
      'TestRendererCommitDiagnostics',
      'TestRendererHostOutputDiagnostics'
    ]),
    privateRootRequestExecution: false,
    nativeExecution: false,
    rustExecution: false,
    reconcilerExecution: false,
    hostOutputProducedFromJs: false,
    privateHostOutputDiagnosticsAccepted: true
  }),
  Object.freeze({
    id: 'test-renderer-private-tojson-host-output-diagnostic',
    jsRecord: 'react-test-renderer-tojson-private-host-output-serializer',
    acceptedWorker:
      'worker-333-test-renderer-tojson-host-output-private-path',
    acceptedRustRecords: Object.freeze([
      'TestRendererPrivateJsonSerializationReport',
      'TestRendererHostOutputDiagnostics'
    ]),
    acceptedFixtureShape: Object.freeze([
      'HostRoot',
      'HostComponent',
      'HostText'
    ]),
    privateHostOutputDiagnosticsSerializable: true,
    publicSerializationAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    hostOutputProducedFromJs: false
  }),
  Object.freeze({
    id: 'test-renderer-private-testinstance-query-path',
    jsRecord: 'ReactTestInstancePrivateQueryMetadata',
    acceptedWorker:
      'worker-334-test-renderer-testinstance-private-query-path',
    acceptedRustRecords: Object.freeze([
      'TestRendererCommittedFiberTreeInspection',
      'TestRendererCommittedFiberNodeInspection'
    ]),
    acceptedQuerySurfaces: Object.freeze([
      'find',
      'findAll',
      'findByType',
      'findAllByType',
      'findByProps',
      'findAllByProps'
    ]),
    bridgeMetadataSource:
      'FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata',
    acceptedBridgeWorker:
      'worker-426-test-renderer-testinstance-bridge-query',
    consumesRootBridgeMetadata: true,
    standaloneWrapperMetadata: false,
    privateQueryMetadata: true,
    publicTestInstanceObjectAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    hostOutputProducedFromJs: false
  }),
  Object.freeze({
    id: 'test-renderer-private-getinstance-class-root-diagnostic',
    jsRecord: 'react-test-renderer-get-instance-private-class-root-diagnostics',
    symbol: 'fast.react_test_renderer.private_get_instance_diagnostics',
    acceptedWorker: 'worker-464-test-renderer-get-instance-class-gate',
    acceptedRustRecords: Object.freeze([
      'TestRendererPrivateGetInstanceClassRootReport',
      'TestRendererPrivateGetInstanceClassComponentDiagnostic',
      'TestRendererPrivateGetInstanceClassInstanceDiagnostic',
      'TestRendererPrivateGetInstanceFailClosedRootDiagnostic'
    ]),
    acceptedClassRootShape: Object.freeze([
      'HostRoot',
      'ClassComponent',
      'HostComponent',
      'HostText'
    ]),
    failClosedRootShapes: Object.freeze([
      Object.freeze(['HostRoot', 'HostComponent']),
      Object.freeze(['HostRoot', 'FunctionComponent'])
    ]),
    privateClassRootDiagnosticsAvailable: true,
    publicGetInstanceAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    hostOutputProducedFromJs: false
  })
]);
const actWarningThenableBlockerDiagnostics = Object.freeze({
  id: 'react-test-renderer-act-warning-thenable-blockers',
  status: actWarningThenableBlockerStatus,
  acceptedWorker: 'worker-517-test-renderer-act-warning-thenable-blockers',
  acceptedOracle: 'react-19.2.6-react-test-renderer-act-oracle',
  acceptedScenario: 'react-test-renderer-act-warning-surfaces',
  acceptedReactSources: Object.freeze([
    'packages/react/src/ReactAct.js',
    'packages/react-reconciler/src/ReactFiberAct.js'
  ]),
  observedPublicWarningSurfaces: Object.freeze([
    'missing-IS_REACT_ACT_ENVIRONMENT-warning',
    'unawaited-async-act-warning'
  ]),
  observedPublicThenableShape: Object.freeze({
    type: 'object',
    ownKeys: Object.freeze(['then']),
    thenName: 'then',
    thenLength: 2
  }),
  blockedPublicPrerequisiteIds: publicAsyncActCompatibilityBlockerIds,
  publicActWarningEmissionAvailable: false,
  publicMissingEnvironmentWarningEmissionAvailable: false,
  publicUnawaitedAsyncActWarningEmissionAvailable: false,
  publicActThenableAwaitingAvailable: false,
  publicActThenableResolutionAvailable: false,
  publicAsyncActScopeSettlementAvailable: false,
  publicAsyncActCompatibilityClaimed: false,
  returnsPublicActThenable: false,
  tracksDidAwaitActCall: false,
  queuesWarningMicrotasks: false,
  awaitsReturnedThenables: false,
  invokesActCallback: false,
  drainsPublicReactActQueue: false,
  drainsPublicSchedulerTaskQueue: false,
  executesQueuedWork: false,
  executesEffects: false,
  compatibilityClaimed: false
});
const actNestedScopeBlockerDiagnostics = Object.freeze({
  id: 'react-test-renderer-act-nested-scope-blockers',
  status: actNestedScopeBlockerStatus,
  acceptedWorker: 'worker-541-test-renderer-act-nested-scope-blockers',
  acceptedOracle: 'react-19.2.6-react-test-renderer-act-oracle',
  acceptedReactSource: 'packages/react/src/ReactAct.js',
  acceptedReactSourceAlgorithm: 'ReactAct.js popActScope',
  sourceInvariant: 'prevActScopeDepth !== actScopeDepth - 1',
  observedPublicWarningSurface: 'overlapping-act-scope-warning',
  nestedScopeBlockerIds: actNestedScopeBlockerIds,
  blockedPublicPrerequisiteIds: publicNestedActScopeCompatibilityBlockerIds,
  records: Object.freeze([
    Object.freeze({
      id: 'react-test-renderer-act-nested-sync-scope-blocker',
      scopeKind: 'sync',
      publicPrerequisiteId:
        'public-react-test-renderer-act-scope-depth-tracking',
      recordsNestedScopeDepth: false,
      reusesPublicActQueue: false,
      invokesActCallback: false,
      drainsPublicReactActQueue: false,
      executesQueuedWork: false,
      executesEffects: false,
      compatibilityClaimed: false
    }),
    Object.freeze({
      id: 'react-test-renderer-act-overlapping-async-scope-blocker',
      scopeKind: 'async',
      publicPrerequisiteId:
        'public-react-test-renderer-overlapping-act-warning-emission',
      expectedPublicWarningCount: 2,
      emitsOverlappingActWarning: false,
      awaitsThenables: false,
      settlesAsyncActScopes: false,
      invokesActCallback: false,
      drainsPublicReactActQueue: false,
      executesQueuedWork: false,
      executesEffects: false,
      compatibilityClaimed: false
    }),
    Object.freeze({
      id: 'react-test-renderer-act-overlapping-sync-async-scope-blocker',
      scopeKind: 'sync-inside-pending-async',
      publicPrerequisiteId:
        'public-react-test-renderer-nested-act-queue-reuse',
      reusesPublicActQueue: false,
      tracksPendingAsyncActScope: false,
      restoresSyncActThenableScope: false,
      invokesActCallback: false,
      drainsPublicReactActQueue: false,
      drainsPublicSchedulerTaskQueue: false,
      executesQueuedWork: false,
      executesEffects: false,
      compatibilityClaimed: false
    })
  ]),
  publicActScopeDepthTrackingAvailable: false,
  publicNestedActQueueReuseAvailable: false,
  publicOverlappingActWarningEmissionAvailable: false,
  publicActThenableAwaitingAvailable: false,
  publicActThenableResolutionAvailable: false,
  publicActThenableSettlementAvailable: false,
  publicAsyncActScopeSettlementAvailable: false,
  publicAsyncActCompatibilityClaimed: false,
  returnsPublicActThenable: false,
  tracksDidAwaitActCall: false,
  invokesActCallback: false,
  drainsPublicReactActQueue: false,
  drainsPublicSchedulerTaskQueue: false,
  publicSchedulerFlushExecutionAvailable: false,
  executesQueuedWork: false,
  executesEffects: false,
  executesPassiveEffects: false,
  compatibilityClaimed: false
});
const privateActRootPassiveRequiredPrerequisiteIds = Object.freeze([
  'test-renderer-private-root-request-records',
  'scheduler-mock-flush-helper-metadata',
  'passive-effect-scheduler-flush-metadata',
  'act-warning-thenable-public-compatibility-blockers',
  'act-nested-scope-public-compatibility-blockers'
]);
const privateActRootPassivePrerequisiteSequenceOrder = Object.freeze([
  Object.freeze({
    order: 0,
    phase: 'private-root-request',
    prerequisiteId: 'test-renderer-private-root-request-records',
    recordIds: Object.freeze([
      'test-renderer-private-root-request-bridge'
    ]),
    recordsPrivateRootRequest: true,
    executesRootRequests: false,
    invokesActCallback: false
  }),
  Object.freeze({
    order: 1,
    phase: 'scheduler-flush-helper',
    prerequisiteId: 'scheduler-mock-flush-helper-metadata',
    recordIds: Object.freeze([
      'test-renderer-mock-scheduler-flush-helper-routing'
    ]),
    routesAcceptedMockSchedulerFlushHelperMetadata: true,
    invokesPublicSchedulerFlushHelper: false,
    executesScheduledCallbacks: false
  }),
  Object.freeze({
    order: 2,
    phase: 'passive-scheduler-request',
    prerequisiteId: 'passive-effect-scheduler-flush-metadata',
    recordIds: Object.freeze([
      'passive-effect-scheduler-flush-gate-record',
      'scheduler-passive-effects-flush-request',
      'passive-effect-scheduler-flush-execution-record'
    ]),
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false
  }),
  Object.freeze({
    order: 3,
    phase: 'public-act-warning-thenable-blocker',
    prerequisiteId: 'act-warning-thenable-public-compatibility-blockers',
    recordIds: Object.freeze([
      'react-test-renderer-act-warning-thenable-blockers'
    ]),
    emitsActWarnings: false,
    awaitsThenables: false,
    invokesActCallback: false
  }),
  Object.freeze({
    order: 4,
    phase: 'public-act-nested-scope-blocker',
    prerequisiteId: 'act-nested-scope-public-compatibility-blockers',
    recordIds: Object.freeze([
      'react-test-renderer-act-nested-scope-blockers'
    ]),
    tracksActScopeDepth: false,
    reusesNestedActQueue: false,
    emitsOverlappingActWarnings: false,
    invokesActCallback: false
  })
]);
const privateActRootPassivePrerequisiteSequenceDiagnostics = Object.freeze({
  id: privateActRootPassivePrerequisiteSequenceId,
  status: actRootPassiveSequenceStatus,
  acceptedWorker:
    'worker-576-test-renderer-act-private-root-passive-sequence',
  jsPrivateExport: privateActQueueFlushDiagnosticsExport,
  consumer: 'react-test-renderer-act-root-passive-sequence-private-gate',
  gateStatus: actSchedulerGateStatus,
  prerequisiteSequence: privateActRootPassivePrerequisiteSequenceOrder,
  requiredPrerequisiteIds: privateActRootPassiveRequiredPrerequisiteIds,
  privateRootRequestPrerequisiteMetadataAccepted: true,
  schedulerFlushHelperPrerequisiteMetadataAccepted: true,
  passiveSchedulerPrerequisiteMetadataAccepted: true,
  publicActBlockerPrerequisiteRowsAccepted: true,
  publicActWarningEmissionAvailable: false,
  publicActScopeDepthTrackingAvailable: false,
  publicNestedActQueueReuseAvailable: false,
  publicOverlappingActWarningEmissionAvailable: false,
  emitsActWarnings: false,
  emitsOverlappingActWarnings: false,
  awaitsThenables: false,
  settlesAsyncActScopes: false,
  invokesActCallback: false,
  executesQueuedWork: false,
  executesScheduledCallbacks: false,
  executesPassiveEffects: false,
  invokesEffectCallbacks: false,
  executesRootRequests: false,
  mutatesHostOutput: false,
  drainsPublicSchedulerTaskQueue: false,
  drainsPublicReactActQueue: false,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  publicActCompatibilityClaimed: false,
  compatibilityClaimed: false,
  describeAcceptedPrivateRootPassivePrerequisiteSequence,
  assertAcceptedPrivateRootPassivePrerequisiteSequence
});
const schedulerReactActQueueDiagnosticRecords = Object.freeze([
  Object.freeze({
    id: 'scheduler-private-act-queue-flush-diagnostics',
    jsPrivateExport: privateActQueueFlushDiagnosticsExport,
    schedulerStatus: 'private-scheduler-act-queue-flush-diagnostics',
    acceptedWorker: 'worker-377-scheduler-act-queue-flush-helper-private',
    queueKind: privateActQueueTestQueueKind,
    taskKind: privateActQueueTestTaskKind,
    queueVersion: privateActQueueTestQueueVersion,
    acceptedRecordKinds: acceptedActQueueRecordKinds,
    acceptedTaskKinds: acceptedActQueueTaskKinds,
    acceptedContinuationStatuses: acceptedActQueueContinuationStatuses,
    drainsAcceptedInternalTestQueues: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesBrandedInternalTestCallbacks: true,
    recordsBrandedInternalTestContinuations: true,
    executesBrandedInternalTestContinuations: true,
    mockSchedulerExpiredWorkDiagnosticsReady: true,
    mockSchedulerExpiredWorkActRouteDiagnosticsReady: true,
    recognizesExpiredMockSchedulerMetadata: true,
    describesExpiredMockSchedulerWorkWithoutFlushing: true,
    routesAcceptedMockSchedulerFlushHelperMetadata: true,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    executesQueuedWork: false,
    executesEffects: false
  }),
  Object.freeze({
    id: 'test-renderer-mock-scheduler-flush-helper-routing',
    jsPrivateExport: privateActQueueFlushDiagnosticsExport,
    schedulerStatus: 'private-scheduler-act-queue-flush-diagnostics',
    routeStatus: mockSchedulerFlushHelperRoutingStatus,
    acceptedWorker:
      'worker-482-test-renderer-act-scheduler-flush-gate',
    acceptedSchedulerWorkers: Object.freeze([
      'worker-404-scheduler-mock-private-callback-execution',
      'worker-436-scheduler-mock-continuation-execution',
      'worker-469-scheduler-mock-expired-continuation-gate'
    ]),
    queueKind: privateActQueueTestQueueKind,
    taskKind: privateActQueueTestTaskKind,
    callbackKind: privateActQueueTestCallbackKind,
    queueVersion: privateActQueueTestQueueVersion,
    acceptedRecordKinds: acceptedActQueueRecordKinds,
    acceptedTaskKinds: acceptedActQueueTaskKinds,
    acceptedContinuationStatuses: acceptedActQueueContinuationStatuses,
    routesAcceptedMockSchedulerFlushHelperMetadata: true,
    delegatesToPrivateSchedulerDiagnostics: true,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    drainsExpiredMockSchedulerWork: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  }),
  Object.freeze({
    id: 'react-test-renderer-act-warning-thenable-blockers',
    jsPrivateExport: privateActQueueFlushDiagnosticsExport,
    status: actWarningThenableBlockerStatus,
    diagnostics: actWarningThenableBlockerDiagnostics,
    acceptedWorker:
      'worker-517-test-renderer-act-warning-thenable-blockers',
    acceptedOracle: 'react-19.2.6-react-test-renderer-act-oracle',
    acceptedScenario: 'react-test-renderer-act-warning-surfaces',
    warningSurfaces:
      actWarningThenableBlockerDiagnostics.observedPublicWarningSurfaces,
    returnedThenableOwnKeys:
      actWarningThenableBlockerDiagnostics.observedPublicThenableShape
        .ownKeys,
    blockedPublicPrerequisiteIds: publicAsyncActCompatibilityBlockerIds,
    publicActWarningEmissionAvailable: false,
    publicActThenableAwaitingAvailable: false,
    publicActThenableResolutionAvailable: false,
    publicAsyncActCompatibilityClaimed: false,
    emitsWarnings: false,
    awaitsThenables: false,
    invokesActCallback: false,
    drainsPublicReactActQueue: false,
    drainsPublicSchedulerTaskQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    compatibilityClaimed: false
  }),
  Object.freeze({
    id: 'react-test-renderer-act-nested-scope-blockers',
    jsPrivateExport: privateActQueueFlushDiagnosticsExport,
    status: actNestedScopeBlockerStatus,
    diagnostics: actNestedScopeBlockerDiagnostics,
    acceptedWorker: 'worker-541-test-renderer-act-nested-scope-blockers',
    acceptedOracle: 'react-19.2.6-react-test-renderer-act-oracle',
    acceptedReactSource: 'packages/react/src/ReactAct.js',
    nestedScopeBlockerIds: actNestedScopeBlockerIds,
    blockedPublicPrerequisiteIds: publicNestedActScopeCompatibilityBlockerIds,
    publicActScopeDepthTrackingAvailable: false,
    publicNestedActQueueReuseAvailable: false,
    publicOverlappingActWarningEmissionAvailable: false,
    publicActThenableSettlementAvailable: false,
    publicAsyncActScopeSettlementAvailable: false,
    publicAsyncActCompatibilityClaimed: false,
    invokesActCallback: false,
    drainsPublicReactActQueue: false,
    drainsPublicSchedulerTaskQueue: false,
    publicSchedulerFlushExecutionAvailable: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesPassiveEffects: false,
    compatibilityClaimed: false
  }),
  Object.freeze({
    id: privateActRootPassivePrerequisiteSequenceId,
    jsPrivateExport: privateActQueueFlushDiagnosticsExport,
    status: actRootPassiveSequenceStatus,
    diagnostics: privateActRootPassivePrerequisiteSequenceDiagnostics,
    acceptedWorker:
      'worker-576-test-renderer-act-private-root-passive-sequence',
    prerequisiteSequence: privateActRootPassivePrerequisiteSequenceOrder,
    requiredPrerequisiteIds: privateActRootPassiveRequiredPrerequisiteIds,
    privateRootRequestPrerequisiteMetadataAccepted: true,
    schedulerFlushHelperPrerequisiteMetadataAccepted: true,
    passiveSchedulerPrerequisiteMetadataAccepted: true,
    publicActBlockerPrerequisiteRowsAccepted: true,
    publicActWarningEmissionAvailable: false,
    publicActScopeDepthTrackingAvailable: false,
    publicNestedActQueueReuseAvailable: false,
    publicOverlappingActWarningEmissionAvailable: false,
    emitsWarnings: false,
    emitsOverlappingActWarnings: false,
    awaitsThenables: false,
    settlesAsyncActScopes: false,
    invokesActCallback: false,
    drainsPublicReactActQueue: false,
    drainsPublicSchedulerTaskQueue: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    executesRootRequests: false,
    mutatesHostOutput: false,
    compatibilityClaimed: false
  }),
  Object.freeze({
    id: 'test-renderer-mock-scheduler-expired-work-act-route',
    jsPrivateExport: privateActQueueFlushDiagnosticsExport,
    schedulerStatus: 'private-scheduler-act-queue-flush-diagnostics',
    routeStatus: mockSchedulerExpiredWorkRoutingStatus,
    acceptedWorker: 'worker-518-scheduler-mock-expired-act-route',
    buildsOnWorkers: Object.freeze([
      'worker-469-scheduler-mock-expired-continuation-gate',
      'worker-482-test-renderer-act-scheduler-flush-gate'
    ]),
    metadataKind: privateSchedulerMockExpiredWorkMetadataKind,
    metadataVersion: privateSchedulerMockExpiredWorkMetadataVersion,
    recognizesExpiredMockSchedulerMetadata: true,
    describesExpiredMockSchedulerWorkWithoutFlushing: true,
    routesAcceptedMockSchedulerExpiredWorkMetadata: true,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    drainsExpiredMockSchedulerWork: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  }),
  Object.freeze({
    id: 'test-renderer-mock-scheduler-expired-act-root-work-route',
    jsPrivateExport: privateActQueueFlushDiagnosticsExport,
    schedulerStatus: 'private-scheduler-act-queue-flush-diagnostics',
    routeStatus: mockSchedulerExpiredActRootWorkRoutingStatus,
    acceptedWorker:
      'worker-640-test-renderer-act-scheduler-flush-execution',
    buildsOnWorkers: Object.freeze([
      'worker-610-test-renderer-create-native-bridge-admission',
      'worker-622-scheduler-mock-act-root-work-execution'
    ]),
    metadataKind: privateSchedulerMockExpiredActRootWorkMetadataKind,
    metadataVersion: privateSchedulerMockExpiredActRootWorkMetadataVersion,
    diagnosticsKind: privateSchedulerMockExpiredActRootWorkDiagnosticsKind,
    diagnosticsVersion:
      privateSchedulerMockExpiredActRootWorkDiagnosticsVersion,
    acceptedRootWorkRecordKinds: acceptedExpiredActRootWorkRecordKinds,
    createsExpiredActRootWorkMetadataFromPrivateRootRequest: true,
    recognizesExpiredActRootWorkMetadata: true,
    linksExpiredCallbacksToAcceptedActRootWorkRecords: true,
    routesAcceptedMockSchedulerExpiredActRootWorkMetadata: true,
    delegatesToPrivateSchedulerDiagnostics: true,
    drainsExpiredMockSchedulerWorkWithActRootMetadata: true,
    drainsAcceptedInternalTestQueues: true,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesAcceptedInternalTestCallbacks: true,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false
  }),
  Object.freeze({
    id: privateActNativeUpdatePassiveEffectDrainDiagnosticId,
    jsPrivateExport: privateActQueueFlushDiagnosticsExport,
    passiveEffectDrainExport: privateActPassiveEffectDrainDiagnosticsExport,
    status: privateActNativeUpdatePassiveEffectDrainStatus,
    acceptedWorker:
      'worker-670-test-renderer-act-passive-native-flush',
    buildsOnWorkers: Object.freeze([
      'worker-473-test-renderer-act-passive-effect-drain',
      'worker-637-test-renderer-update-native-execution'
    ]),
    nativeUpdateExecutionResultKind:
      'FastReactTestRendererPrivateRootExecutionResult',
    privateUpdateNativeBridgeAdmissionDiagnosticId:
      'react-test-renderer-update-native-bridge-admission-private-diagnostic',
    privateUpdateNativeBridgeAdmissionStatus:
      'private-update-native-bridge-admission-host-output-handoff-public-update-blocked',
    consumesAcceptedNativeUpdateExecution: true,
    consumesPrivateUpdateNativeBridgeAdmission: true,
    consumesAcceptedNativeUpdateHostOutput: true,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    drainsAcceptedPendingPassiveFlushMetadata: true,
    publicUpdateCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    drainsPublicReactActQueue: false,
    drainsPublicSchedulerTaskQueue: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    executesRendererRoots: false
  }),
  Object.freeze({
    id: privateActNestedScopePassiveFlushDiagnosticId,
    jsPrivateExport: privateActQueueFlushDiagnosticsExport,
    passiveEffectDrainExport: privateActPassiveEffectDrainDiagnosticsExport,
    status: actNestedScopePassiveFlushStatus,
    acceptedWorker:
      'worker-700-test-renderer-act-nested-scope-passive-flush',
    buildsOnWorkers: Object.freeze([
      'worker-473-test-renderer-act-passive-effect-drain',
      'worker-541-test-renderer-act-nested-scope-blockers',
      'worker-576-test-renderer-act-private-root-passive-sequence',
      'worker-670-test-renderer-act-passive-native-flush'
    ]),
    privatePrerequisiteId: privateActNestedScopePassiveFlushPrerequisiteId,
    passiveFlushOrder: privateActNestedScopePassiveFlushOrder,
    outerScopeDepth: 1,
    innerScopeDepth: 2,
    passiveFlushOrderIndex: 2,
    consumesNestedScopeBlockerDiagnostics: true,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    drainsAcceptedPendingPassiveFlushMetadata: true,
    deterministicFlushOrder: true,
    privateNestedScopeDepthTracking: true,
    privateNestedActQueueReuse: true,
    publicActScopeDepthTrackingAvailable: false,
    publicNestedActQueueReuseAvailable: false,
    publicOverlappingActWarningEmissionAvailable: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    drainsPublicReactActQueue: false,
    drainsPublicSchedulerTaskQueue: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    executesRendererRoots: false
  }),
  Object.freeze({
    id: 'react-private-act-internal-test-queue-factories',
    jsExport: '__FAST_REACT_PRIVATE_ACT_DISPATCHER_GATE__',
    acceptedWorker: 'worker-377-scheduler-act-queue-flush-helper-private',
    factories: Object.freeze([
      'createInternalActQueueTestQueue',
      'createInternalActQueueTestTask'
    ]),
    validators: Object.freeze([
      'isAcceptedInternalActQueueTestQueue',
      'isAcceptedInternalActQueueTestTask'
    ]),
    queueKind: privateActQueueTestQueueKind,
    taskKind: privateActQueueTestTaskKind,
    queueVersion: privateActQueueTestQueueVersion,
    publicCompatibilityClaimed: false,
    queueFlushingReady: false,
    privateTestQueueFlushDiagnosticsReady: true,
    drainsAcceptedInternalTestQueues: true,
    executesQueuedWork: false,
    executesEffects: false
  })
]);
let privateActPassiveEffectDrainDiagnostics;
const privateActQueueFlushDiagnostics = Object.freeze({
  status: 'private-react-test-renderer-act-queue-diagnostic-consumer',
  schedulerDiagnosticStatus: 'private-scheduler-act-queue-flush-diagnostics',
  exportName: privateActQueueFlushDiagnosticsExport,
  consumer: 'react-test-renderer-act-scheduler-private-gate',
  gateStatus: actSchedulerGateStatus,
  queueKind: privateActQueueTestQueueKind,
  taskKind: privateActQueueTestTaskKind,
  queueVersion: privateActQueueTestQueueVersion,
  compatibilityTarget,
  reactCompatibilityTarget,
  schedulerCompatibilityTarget,
  acceptedRecordKinds: acceptedActQueueRecordKinds,
  acceptedTaskKinds: acceptedActQueueTaskKinds,
  acceptedContinuationStatuses: acceptedActQueueContinuationStatuses,
  drainsAcceptedInternalTestQueues: true,
  routesAcceptedMockSchedulerFlushHelperMetadata: true,
  delegatesToPrivateSchedulerDiagnostics: true,
  invokesPublicSchedulerFlushHelper: false,
  publicSchedulerFlushBehaviorExecuted: false,
  mockSchedulerExpiredWorkDiagnosticsReady: true,
  mockSchedulerExpiredWorkActRouteDiagnosticsReady: true,
  recognizesExpiredMockSchedulerMetadata: true,
  describesExpiredMockSchedulerWorkWithoutFlushing: true,
  mockSchedulerExpiredActRootWorkDiagnosticsReady: true,
  recognizesExpiredActRootWorkMetadata: true,
  linksExpiredCallbacksToAcceptedActRootWorkRecords: true,
  routesAcceptedMockSchedulerExpiredActRootWorkMetadata: true,
  drainsExpiredMockSchedulerWork: false,
  warningThenableBlockerDiagnostics: actWarningThenableBlockerDiagnostics,
  nestedScopeBlockerDiagnostics: actNestedScopeBlockerDiagnostics,
  rootPassivePrerequisiteSequenceDiagnostics:
    privateActRootPassivePrerequisiteSequenceDiagnostics,
  privateNativeUpdatePassiveEffectDrainDiagnosticId:
    privateActNativeUpdatePassiveEffectDrainDiagnosticId,
  privateNativeUpdatePassiveEffectDrainPrerequisiteId:
    privateActNativeUpdatePassiveEffectDrainPrerequisiteId,
  privateNestedScopePassiveFlushDiagnosticId:
    privateActNestedScopePassiveFlushDiagnosticId,
  privateNestedScopePassiveFlushPrerequisiteId:
    privateActNestedScopePassiveFlushPrerequisiteId,
  privateNestedScopePassiveFlushOrder:
    privateActNestedScopePassiveFlushOrder,
  privateNestedScopePassiveFlushEvidenceAccepted: true,
  privateNativeUpdateExecutionMetadataAccepted: true,
  privateNativeUpdatePassiveEffectDrainMetadataConsumed: true,
  publicActWarningEmissionAvailable: false,
  publicActScopeDepthTrackingAvailable: false,
  publicNestedActQueueReuseAvailable: false,
  publicOverlappingActWarningEmissionAvailable: false,
  publicActThenableAwaitingAvailable: false,
  publicActThenableResolutionAvailable: false,
  publicActThenableSettlementAvailable: false,
  publicAsyncActCompatibilityClaimed: false,
  emitsActWarnings: false,
  emitsOverlappingActWarnings: false,
  awaitsActThenables: false,
  settlesAsyncActScopes: false,
  drainsPublicSchedulerTaskQueue: false,
  drainsPublicReactActQueue: false,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  compatibilityClaimed: false,
  executesQueuedWork: false,
  executesEffects: false,
  invokesActCallback: false,
  get privateActPassiveEffectDrainDiagnostics() {
    return privateActPassiveEffectDrainDiagnostics;
  },
  describeAcceptedInternalActQueue,
  describeAcceptedMockSchedulerFlushHelperMetadata,
  routeAcceptedMockSchedulerFlushHelperMetadata,
  describeAcceptedMockSchedulerExpiredWorkMetadata,
  routeAcceptedMockSchedulerExpiredWorkMetadata,
  createExpiredActRootWorkMetadataFromPrivateRootRequest,
  describeAcceptedMockSchedulerExpiredActRootWorkMetadata,
  routeAcceptedMockSchedulerExpiredActRootWorkMetadata,
  describeAcceptedPrivateRootPassivePrerequisiteSequence,
  assertAcceptedPrivateRootPassivePrerequisiteSequence,
  consumeAcceptedSchedulerActQueueDiagnostics,
  drainAcceptedInternalActQueue:
    consumeAcceptedSchedulerActQueueDiagnostics
});
privateActPassiveEffectDrainDiagnostics = Object.freeze({
  status:
    'private-react-test-renderer-act-passive-effect-drain-diagnostic-consumer',
  exportName: privateActPassiveEffectDrainDiagnosticsExport,
  metadataKind: privateActPassiveEffectDrainMetadataKind,
  recordKind: privateActPassiveEffectDrainRecordKind,
  version: privateActPassiveEffectDrainVersion,
  consumer: 'react-test-renderer-act-passive-effect-drain-private-gate',
  gateStatus: actSchedulerGateStatus,
  compatibilityTarget,
  schedulerCompatibilityTarget,
  acceptedRecordKinds: acceptedPassiveEffectDrainRecordKinds,
  consumesPendingPassiveFlushMetadata: true,
  consumesAcceptedSchedulerFlushMetadata: true,
  privatePassiveEffectDrainDiagnosticsConsumed: true,
  nativeUpdateExecutionResultKind:
    'FastReactTestRendererPrivateRootExecutionResult',
  nativeUpdatePassiveEffectDrainDiagnosticId:
    privateActNativeUpdatePassiveEffectDrainDiagnosticId,
  nativeUpdatePassiveEffectDrainStatus:
    privateActNativeUpdatePassiveEffectDrainStatus,
  nestedScopePassiveFlushDiagnosticId:
    privateActNestedScopePassiveFlushDiagnosticId,
  nestedScopePassiveFlushStatus:
    actNestedScopePassiveFlushStatus,
  nestedScopePassiveFlushPrerequisiteId:
    privateActNestedScopePassiveFlushPrerequisiteId,
  nestedScopePassiveFlushOrder:
    privateActNestedScopePassiveFlushOrder,
  nestedScopePassiveFlushEvidenceAccepted: true,
  privateUpdateNativeBridgeAdmissionDiagnosticId:
    'react-test-renderer-update-native-bridge-admission-private-diagnostic',
  privateUpdateNativeBridgeAdmissionStatus:
    'private-update-native-bridge-admission-host-output-handoff-public-update-blocked',
  consumesAcceptedNativeUpdateExecution: true,
  consumesPrivateUpdateNativeBridgeAdmission: true,
  consumesAcceptedNativeUpdateHostOutput: true,
  drainsAcceptedPendingPassiveFlushMetadata: true,
  publicUpdateCompatibilityClaimed: false,
  drainsPublicSchedulerTaskQueue: false,
  drainsPublicReactActQueue: false,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  publicActCompatibilityClaimed: false,
  compatibilityClaimed: false,
  executesPassiveEffects: false,
  invokesEffectCallbacks: false,
  invokesActCallback: false,
  createAcceptedPendingPassiveFlushMetadata,
  createAcceptedPendingPassiveFlushRecord,
  describeAcceptedPendingPassiveFlushMetadata,
  consumeAcceptedPendingPassiveFlushMetadata,
  describeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata,
  consumeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata,
  describeAcceptedNestedActScopePassiveFlush,
  flushAcceptedNestedActScopePassiveWork,
  drainAcceptedPendingPassiveFlushMetadata:
    consumeAcceptedPendingPassiveFlushMetadata,
  drainAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata:
    consumeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata,
  drainAcceptedNestedActScopePassiveWork:
    flushAcceptedNestedActScopePassiveWork
});
const acceptedPrivateActFlushPrerequisiteIds = Object.freeze([
  'react-act-private-dispatcher-gate',
  'scheduler-react-act-queue-diagnostic-consumption',
  'scheduler-act-queue-routing-records',
  'scheduler-mock-flush-helper-metadata',
  'act-warning-thenable-public-compatibility-blockers',
  'act-nested-scope-public-compatibility-blockers',
  'sync-flush-act-continuation-records',
  'sync-flush-post-passive-continuation-execution-gate',
  'sync-flush-post-passive-private-execution-metadata',
  'passive-effect-flush-metadata',
  'passive-effect-scheduler-flush-metadata',
  privateActNativeUpdatePassiveEffectDrainPrerequisiteId,
  privateActNestedScopePassiveFlushPrerequisiteId,
  'passive-effect-private-callback-execution-metadata',
  'test-renderer-private-root-output-diagnostics',
  'test-renderer-private-root-request-records',
  privateActRootPassivePrerequisiteSequenceId
]);
const blockedPrivateActFlushPrerequisiteIds = Object.freeze([
  'private-act-queue-drain-execution',
  'private-scheduler-flush-helper-execution',
  'private-passive-effect-callback-execution',
  'private-test-renderer-root-request-execution',
  'private-test-renderer-host-output-commit'
]);
const acceptedPrivateActFlushPrerequisites = Object.freeze([
  Object.freeze({
    id: 'react-act-private-dispatcher-gate',
    present: true,
    recordOnly: true,
    records: reactActPrivateDispatcherRecords,
    executesQueuedWork: false,
    executesEffects: false
  }),
  Object.freeze({
    id: 'scheduler-react-act-queue-diagnostic-consumption',
    present: true,
    recordOnly: false,
    records: schedulerReactActQueueDiagnosticRecords,
    diagnostics: privateActQueueFlushDiagnostics,
    privateDiagnosticConsumption: true,
    drainsAcceptedInternalTestQueues: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  }),
  Object.freeze({
    id: 'scheduler-act-queue-routing-records',
    present: true,
    recordOnly: true,
    records: rootActSchedulerRecords,
    executesQueuedWork: false
  }),
  Object.freeze({
    id: 'scheduler-mock-flush-helper-metadata',
    present: true,
    recordOnly: true,
    records: schedulerMockFlushHelperMetadata,
    executesScheduledCallbacks: false
  }),
  Object.freeze({
    id: 'act-warning-thenable-public-compatibility-blockers',
    present: true,
    recordOnly: true,
    diagnostics: actWarningThenableBlockerDiagnostics,
    blockedPublicPrerequisiteIds: publicAsyncActCompatibilityBlockerIds,
    publicActWarningEmissionAvailable: false,
    publicActThenableAwaitingAvailable: false,
    publicActThenableResolutionAvailable: false,
    publicAsyncActScopeSettlementAvailable: false,
    publicAsyncActCompatibilityClaimed: false,
    emitsWarnings: false,
    awaitsThenables: false,
    invokesActCallback: false,
    drainsPublicReactActQueue: false,
    drainsPublicSchedulerTaskQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    compatibilityClaimed: false
  }),
  Object.freeze({
    id: 'act-nested-scope-public-compatibility-blockers',
    present: true,
    recordOnly: true,
    diagnostics: actNestedScopeBlockerDiagnostics,
    blockedPublicPrerequisiteIds:
      publicNestedActScopeCompatibilityBlockerIds,
    publicActScopeDepthTrackingAvailable: false,
    publicNestedActQueueReuseAvailable: false,
    publicOverlappingActWarningEmissionAvailable: false,
    publicActThenableSettlementAvailable: false,
    publicAsyncActScopeSettlementAvailable: false,
    publicAsyncActCompatibilityClaimed: false,
    invokesActCallback: false,
    drainsPublicReactActQueue: false,
    drainsPublicSchedulerTaskQueue: false,
    publicSchedulerFlushExecutionAvailable: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesPassiveEffects: false,
    compatibilityClaimed: false
  }),
  Object.freeze({
    id: 'sync-flush-act-continuation-records',
    present: true,
    recordOnly: true,
    records: syncFlushActSchedulerRecords,
    executesSyncFlush: false,
    executesPassiveEffects: false
  }),
  Object.freeze({
    id: 'sync-flush-post-passive-continuation-execution-gate',
    present: true,
    recordOnly: true,
    records: Object.freeze([
      'SyncFlushPostPassiveContinuationExecutionGateRecord',
      'SyncFlushPostPassiveContinuationRootRecord'
    ]),
    executesSyncFlush: false,
    executesPassiveEffects: false
  }),
  Object.freeze({
    id: 'sync-flush-post-passive-private-execution-metadata',
    present: true,
    recordOnly: true,
    records: Object.freeze([
      'SyncFlushPostPassiveContinuationExecutionRecord',
      'PassiveEffectsFlushWithSyncFlushContinuationResult',
      'flush_sync_post_passive_continuation_after_passive_effects',
      'flush_passive_effects_after_commit_and_sync_flush_continuation'
    ]),
    privateFlushExecutionMetadata: true,
    executesPublicSchedulerTasks: false,
    executesPublicAct: false,
    executesPassiveEffects: false
  }),
  Object.freeze({
    id: 'passive-effect-flush-metadata',
    present: true,
    recordOnly: true,
    records: passiveActFlushRecords,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false
  }),
  Object.freeze({
    id: 'passive-effect-scheduler-flush-metadata',
    present: true,
    recordOnly: false,
    records: Object.freeze([
      'PassiveEffectSchedulerFlushGateRecord',
      'SchedulerPassiveEffectsFlushRequest',
      'PassiveEffectSchedulerFlushExecutionRecord'
    ]),
    diagnostics: privateActPassiveEffectDrainDiagnostics,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    publicActCompatibility: false,
    publicSchedulerPackageBehaviorChanged: false
  }),
  Object.freeze({
    id: privateActNativeUpdatePassiveEffectDrainPrerequisiteId,
    present: true,
    recordOnly: false,
    records: Object.freeze([
      'FastReactTestRendererPrivateRootExecutionResult',
      'FastReactTestRendererPrivateUpdateNativeBridgeAdmission',
      'TestRendererUpdateNativeBridgeAdmission',
      'TestRendererUpdatedHostOutput',
      'PassiveEffectSchedulerFlushExecutionRecord'
    ]),
    diagnosticId: privateActNativeUpdatePassiveEffectDrainDiagnosticId,
    status: privateActNativeUpdatePassiveEffectDrainStatus,
    consumesAcceptedNativeUpdateExecution: true,
    consumesPrivateUpdateNativeBridgeAdmission: true,
    consumesAcceptedNativeUpdateHostOutput: true,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    drainsAcceptedPendingPassiveFlushMetadata: true,
    publicUpdateCompatibilityClaimed: false,
    publicActCompatibility: false,
    publicSchedulerPackageBehaviorChanged: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    drainsPublicReactActQueue: false,
    drainsPublicSchedulerTaskQueue: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    executesRendererRoots: false
  }),
  Object.freeze({
    id: privateActNestedScopePassiveFlushPrerequisiteId,
    present: true,
    recordOnly: false,
    records: Object.freeze([
      'react-test-renderer-act-nested-scope-blockers',
      'PendingPassiveCommitHandoff',
      'PassiveEffectSchedulerFlushExecutionRecord',
      privateActNestedScopePassiveFlushDiagnosticId
    ]),
    diagnosticId: privateActNestedScopePassiveFlushDiagnosticId,
    status: actNestedScopePassiveFlushStatus,
    passiveFlushOrder: privateActNestedScopePassiveFlushOrder,
    outerScopeDepth: 1,
    innerScopeDepth: 2,
    passiveFlushOrderIndex: 2,
    consumesNestedScopeBlockerDiagnostics: true,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    drainsAcceptedPendingPassiveFlushMetadata: true,
    deterministicFlushOrder: true,
    publicActScopeDepthTrackingAvailable: false,
    publicNestedActQueueReuseAvailable: false,
    publicOverlappingActWarningEmissionAvailable: false,
    publicActCompatibility: false,
    publicSchedulerPackageBehaviorChanged: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    drainsPublicReactActQueue: false,
    drainsPublicSchedulerTaskQueue: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    executesRendererRoots: false
  }),
  Object.freeze({
    id: 'passive-effect-private-callback-execution-metadata',
    present: true,
    recordOnly: true,
    records: Object.freeze([
      'PassiveEffectCallbackInvocationGateSnapshot',
      'PassiveEffectCallbackInvocationRecord',
      'PassiveEffectDestroyCallbackExecutionRecord',
      'PassiveEffectDestroyCallbackErrorRecord'
    ]),
    testControlOnly: true,
    publicEffectExecution: false,
    publicActCompatibility: false,
    schedulerDrivenPassiveExecution: false
  }),
  Object.freeze({
    id: 'test-renderer-private-root-output-diagnostics',
    present: true,
    recordOnly: true,
    records: Object.freeze([
      'FastReactTestRendererCurrentRustCanaryMetadata',
      'TestRendererHostOutputDiagnostics',
      'TestRendererPrivateJsonSerializationReport',
      'TestRendererCommittedFiberTreeInspection'
    ]),
    privateHostOutputDiagnosticsAccepted: true,
    publicSerializationAvailable: false,
    publicTestInstanceObjectAvailable: false,
    producesPublicHostOutput: false
  }),
  Object.freeze({
    id: 'test-renderer-private-root-request-records',
    present: true,
    recordOnly: true,
    records: testRendererRootActFlushRecords,
    executesRootRequests: false,
    producesHostOutput: false
  }),
  Object.freeze({
    id: privateActRootPassivePrerequisiteSequenceId,
    present: true,
    recordOnly: true,
    diagnostics: privateActRootPassivePrerequisiteSequenceDiagnostics,
    prerequisiteSequence: privateActRootPassivePrerequisiteSequenceOrder,
    requiredPrerequisiteIds: privateActRootPassiveRequiredPrerequisiteIds,
    privateRootRequestPrerequisiteMetadataAccepted: true,
    schedulerFlushHelperPrerequisiteMetadataAccepted: true,
    passiveSchedulerPrerequisiteMetadataAccepted: true,
    publicActBlockerPrerequisiteRowsAccepted: true,
    invokesActCallback: false,
    awaitsThenables: false,
    emitsWarnings: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    executesRootRequests: false,
    compatibilityClaimed: false
  })
]);
const blockedPrivateActFlushPrerequisites = Object.freeze([
  Object.freeze({
    id: 'private-act-queue-drain-execution',
    present: false,
    requiredBeforePrivateFlush: true,
    reason: 'Accepted act queue records are not drained or executed.'
  }),
  Object.freeze({
    id: 'private-scheduler-flush-helper-execution',
    present: false,
    requiredBeforePrivateFlush: true,
    reason: 'Scheduler mock flush helpers still throw before callbacks run.'
  }),
  Object.freeze({
    id: 'private-passive-effect-callback-execution',
    present: false,
    requiredBeforePrivateFlush: true,
    reason: 'Passive create and destroy callback handles are metadata only.'
  }),
  Object.freeze({
    id: 'private-test-renderer-root-request-execution',
    present: false,
    requiredBeforePrivateFlush: true,
    reason:
      'Private test-renderer root request records do not call native or Rust work.'
  }),
  Object.freeze({
    id: 'private-test-renderer-host-output-commit',
    present: false,
    requiredBeforePrivateFlush: true,
    reason: 'No committed test-renderer host output is produced from JS act.'
  })
]);
const actSchedulerSideEffectPolicy = Object.freeze({
  invokesActCallback: false,
  executesQueuedWork: false,
  executesScheduledCallbacks: false,
  executesSyncFlush: false,
  executesPassiveEffects: false,
  executesRootRequests: false,
  mutatesHostOutput: false,
  acceptsPrivateFlushExecutionMetadata: true,
  consumesPrivateSchedulerActQueueDiagnostics: true,
  consumesPrivatePassiveEffectDrainDiagnostics: true,
  consumesPendingPassiveFlushMetadata: true,
  consumesAcceptedNativeUpdateExecution: true,
  consumesPrivateUpdateNativeBridgeAdmission: true,
  consumesAcceptedNativeUpdateHostOutput: true,
  drainsAcceptedPendingPassiveFlushMetadata: true,
  consumesNestedScopeBlockerDiagnostics: true,
  drainsAcceptedNestedScopePassiveFlushMetadata: true,
  deterministicNestedScopePassiveFlushOrder: true,
  sequencesPrivateRootPassivePrerequisites: true,
  emitsActWarnings: false,
  emitsOverlappingActWarnings: false,
  awaitsActThenables: false,
  resolvesActThenables: false,
  settlesAsyncActScopes: false,
  tracksActScopeDepth: false,
  reusesNestedActQueue: false,
  publicAsyncActCompatibilityClaimed: false,
  drainsAcceptedInternalTestQueues: true,
  routesAcceptedMockSchedulerFlushHelperMetadata: true,
  delegatesToPrivateSchedulerDiagnostics: true,
  recognizesExpiredMockSchedulerMetadata: true,
  routesAcceptedMockSchedulerExpiredWorkMetadata: true,
  describesExpiredMockSchedulerWorkWithoutFlushing: true,
  invokesPublicSchedulerFlushHelper: false,
  publicSchedulerFlushBehaviorExecuted: false,
  drainsExpiredMockSchedulerWork: false,
  drainsPublicSchedulerTaskQueue: false,
  drainsPublicReactActQueue: false,
  executesPublicSchedulerTasks: false,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  compatibilityClaimed: false
});
const actSchedulerGate = Object.freeze({
  id: 'react-test-renderer-act-scheduler-private-gate',
  status: actSchedulerGateStatus,
  entrypoint,
  deterministic: true,
  acceptedWorkers: Object.freeze([
    'worker-176-act-queue-routing-skeleton',
    'worker-252-sync-flush-act-continuation-skeleton',
    'worker-277-react-act-queue-private-dispatcher-gate',
    'worker-280-scheduler-mock-flush-helper-gate',
    'worker-285-sync-flush-act-continuation-post-passive-gate',
    'worker-296-passive-effect-callback-handle-flush-gate',
    'worker-301-hook-effect-destroy-handoff-metadata',
    'worker-303-sync-flush-passive-continuation-execution-gate',
    'worker-304-test-renderer-js-private-root-request-bridge',
    'worker-307-test-renderer-update-unmount-private-js-bridge',
    'worker-326-passive-effect-create-destroy-callback-invocation-gate',
    'worker-331-sync-flush-passive-continuation-execution',
    'worker-332-test-renderer-js-private-root-native-bridge',
    'worker-333-test-renderer-tojson-host-output-private-path',
    'worker-334-test-renderer-testinstance-private-query-path',
    'worker-426-test-renderer-testinstance-bridge-query',
    'worker-349-hook-effect-destroy-callback-execution-private',
    'worker-377-scheduler-act-queue-flush-helper-private',
    'worker-449-passive-effect-scheduler-flush-gate',
    'worker-473-test-renderer-act-passive-effect-drain',
    'worker-404-scheduler-mock-private-callback-execution',
    'worker-436-scheduler-mock-continuation-execution',
    'worker-469-scheduler-mock-expired-continuation-gate',
    'worker-482-test-renderer-act-scheduler-flush-gate',
    'worker-517-test-renderer-act-warning-thenable-blockers',
    'worker-518-scheduler-mock-expired-act-route',
    'worker-541-test-renderer-act-nested-scope-blockers',
    'worker-576-test-renderer-act-private-root-passive-sequence',
    'worker-622-scheduler-mock-act-root-work-execution',
    'worker-640-test-renderer-act-scheduler-flush-execution',
    'worker-670-test-renderer-act-passive-native-flush',
    'worker-700-test-renderer-act-nested-scope-passive-flush'
  ]),
  publicActBehaviorAvailable: false,
  publicSchedulerFlushExecutionAvailable: false,
  publicRootSyncFlushRouteAvailable: false,
  publicPassiveEffectFlushExecutionAvailable: false,
  privateRootRequestExecutionAvailable: false,
  schedulerFlushCompatibilityClaimed: false,
  schedulerMockFlushExecution: false,
  queuedWorkExecution: false,
  passiveEffectExecution: false,
  effectCallbackExecution: false,
  rootRequestExecution: false,
  hostOutputMutation: false,
  rendererRootsCompatibilityClaimed: false,
  compatibilityClaimed: false,
  reactActPrivateDispatcherGateAccepted: true,
  schedulerReactActQueueDiagnosticsAccepted: true,
  privateSchedulerActQueueDiagnosticsConsumed: true,
  privateActQueueDiagnosticConsumptionReady: true,
  mockSchedulerFlushHelperRoutingAccepted: true,
  privateMockSchedulerFlushHelperMetadataRouted: true,
  privateMockSchedulerExpiredWorkMetadataRouted: true,
  privateMockSchedulerExpiredActRootWorkMetadataRouted: true,
  publicSchedulerFlushBehaviorExecuted: false,
  mockSchedulerExpiredWorkActRouteDiagnosticsReady: true,
  mockSchedulerExpiredActRootWorkDiagnosticsReady: true,
  recognizesExpiredMockSchedulerMetadata: true,
  recognizesExpiredActRootWorkMetadata: true,
  linksExpiredCallbacksToAcceptedActRootWorkRecords: true,
  schedulerMockFlushHelperMetadataAccepted: true,
  rootActRecordsAccepted: true,
  syncFlushActRecordsAccepted: true,
  postPassiveContinuationExecutionGateAccepted: true,
  passiveActFlushMetadataAccepted: true,
  rootRequestRecordsAccepted: true,
  privateFlushExecutionMetadataAccepted: true,
  privateSyncFlushExecutionMetadataAccepted: true,
  privatePassiveCallbackExecutionMetadataAccepted: true,
  privatePassiveSchedulerFlushMetadataAccepted: true,
  privatePassiveEffectDrainDiagnosticsConsumed: true,
  privateNativeUpdateExecutionMetadataAccepted: true,
  privateNativeUpdatePassiveEffectDrainMetadataConsumed: true,
  privateNativeUpdatePassiveEffectDrainDiagnosticId:
    privateActNativeUpdatePassiveEffectDrainDiagnosticId,
  privateNativeUpdatePassiveEffectDrainPrerequisiteId:
    privateActNativeUpdatePassiveEffectDrainPrerequisiteId,
  privateNestedScopePassiveFlushEvidenceAccepted: true,
  privateNestedScopePassiveFlushDiagnosticId:
    privateActNestedScopePassiveFlushDiagnosticId,
  privateNestedScopePassiveFlushPrerequisiteId:
    privateActNestedScopePassiveFlushPrerequisiteId,
  warningThenableBlockerDiagnosticsAccepted: true,
  nestedScopeBlockerDiagnosticsAccepted: true,
  privateRootPassivePrerequisiteSequenceAccepted: true,
  publicActWarningEmissionAvailable: false,
  publicActScopeDepthTrackingAvailable: false,
  publicNestedActQueueReuseAvailable: false,
  publicOverlappingActWarningEmissionAvailable: false,
  publicActThenableAwaitingAvailable: false,
  publicActThenableResolutionAvailable: false,
  publicActThenableSettlementAvailable: false,
  publicAsyncActScopeSettlementAvailable: false,
  publicAsyncActCompatibilityClaimed: false,
  privateRootOutputDiagnosticsAccepted: true,
  privateFlushPrerequisitesPresent: true,
  privateFlushExecutionReady: false,
  recognizedReactActPrivateDispatcherRecords: reactActPrivateDispatcherRecords,
  recognizedSchedulerReactActQueueDiagnostics:
    schedulerReactActQueueDiagnosticRecords,
  recognizedActWarningThenableBlockers:
    actWarningThenableBlockerDiagnostics,
  recognizedActNestedScopeBlockers: actNestedScopeBlockerDiagnostics,
  recognizedPrivateRootPassivePrerequisiteSequence:
    privateActRootPassivePrerequisiteSequenceDiagnostics,
  recognizedNestedScopePassiveFlushDiagnostics:
    schedulerReactActQueueDiagnosticRecords.find(
      (record) => record.id === privateActNestedScopePassiveFlushDiagnosticId
    ),
  privateActQueueFlushDiagnostics,
  privateActPassiveEffectDrainDiagnostics,
  recognizedSchedulerMockFlushHelpers: schedulerMockFlushHelperMetadata,
  recognizedRootActRecords: rootActSchedulerRecords,
  recognizedSyncFlushActRecords: syncFlushActSchedulerRecords,
  recognizedPassiveActFlushRecords: passiveActFlushRecords,
  recognizedRootActFlushRecords: testRendererRootActFlushRecords,
  acceptedPrivateFlushPrerequisites: acceptedPrivateActFlushPrerequisites,
  blockedPrivateFlushPrerequisites: blockedPrivateActFlushPrerequisites,
  acceptedPrivateFlushPrerequisiteIds: acceptedPrivateActFlushPrerequisiteIds,
  blockedPrivateFlushPrerequisiteIds: blockedPrivateActFlushPrerequisiteIds,
  blockedPublicAsyncActCompatibilityPrerequisiteIds:
    publicAsyncActCompatibilityBlockerIds,
  blockedPublicNestedActCompatibilityPrerequisiteIds:
    publicNestedActScopeCompatibilityBlockerIds,
  sideEffectPolicy: actSchedulerSideEffectPolicy,
  missingBeforeExecution: actSchedulerMissingBeforeExecution
});
const flushSyncActRoutingGate = Object.freeze({
  id: 'react-test-renderer-flushsync-act-routing-private-gate',
  status: privateFlushSyncActRoutingDiagnosticsStatus,
  entrypoint,
  publicSurface: 'create().unstable_flushSync',
  deterministic: true,
  symbol: privateFlushSyncActRoutingDiagnosticsSymbol.description,
  actSchedulerGateStatus: actSchedulerGate.status,
  seesReactActPrivateDispatcherGate: true,
  seesSchedulerActQueueDiagnostics: true,
  seesRendererBackedActDrainMetadata: true,
  seesSyncFlushActMetadata: true,
  seesSchedulerBridgeActContinuationExecutionMetadata: true,
  seesSyncFlushErrorRecoveryMetadata: true,
  seesRootCallbackInvocationMetadata: true,
  acceptedWorkers: Object.freeze([
    'worker-405-react-act-private-continuation-gate',
    'worker-410-root-render-e2e-private-flushsync-admission',
    'worker-422-scheduler-act-continuation-execution',
    'worker-437-react-act-renderer-backed-private-drain',
    'worker-450-sync-flush-error-recovery-diagnostics',
    'worker-451-root-callback-invocation-execution-gate'
  ]),
  acceptedActMetadataKinds: Object.freeze([
    'fast-react.react.act-queue-metadata',
    'fast-react.react.private-sync-flush-act-execution-diagnostic',
    'fast-react.react.private-renderer-backed-act-drain-diagnostic'
  ]),
  acceptedSyncFlushRecords: flushSyncActRoutingAcceptedReconcilerRecords,
  recognizedSyncFlushActRecords: syncFlushActSchedulerRecords,
  privateActQueueFlushDiagnostics,
  privateDiagnosticAvailable: true,
  publicActBehaviorAvailable: false,
  publicSchedulerFlushExecutionAvailable: false,
  publicRootSyncFlushRouteAvailable: false,
  rootSyncFlushCompatibilityClaimed: false,
  invokesFlushSyncCallback: false,
  executesSyncFlush: false,
  executesQueuedWork: false,
  executesScheduledCallbacks: false,
  executesPassiveEffects: false,
  executesRendererRoots: false,
  invokesRootCallbacks: false,
  mutatesHostOutput: false,
  compatibilityClaimed: false
});
const createRoutingMissingPrerequisites = Object.freeze([
  'public-react-test-renderer-root-lifecycle-routing',
  'react-test-renderer-host-output-serialization'
]);
const createRoutingPrerequisites = Object.freeze([
  Object.freeze({
    id: 'private-rust-native-test-renderer-root-execution-bridge',
    present: true,
    requiredBeforeCreateRouting: false,
    reason:
      'The private bridge shape can hand create, update, and unmount requests to the Rust TestRendererRoot execution boundary without opening public behavior.'
  }),
  Object.freeze({
    id: 'public-react-test-renderer-root-lifecycle-routing',
    present: false,
    requiredBeforeCreateRouting: true,
    reason:
      'Public create, update, and unmount still intentionally return or throw through the placeholder facade.'
  }),
  Object.freeze({
    id: 'react-test-renderer-host-output-serialization',
    present: false,
    requiredBeforeCreateRouting: true,
    reason:
      'The JS package has no public bridge to Rust host-output serialization for toJSON, toTree, or TestInstance surfaces.'
  })
]);
const privateRootCreatePreflightGate = Object.freeze({
  id: 'react-test-renderer-private-root-create-preflight-gate',
  status: privateRootCreatePreflightStatus,
  entrypoint,
  publicSurface: 'create()',
  deterministic: true,
  diagnosticName: privateRootCreatePreflightDiagnosticName,
  symbol: privateRootCreatePreflightSymbol.description,
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_root_create_preflight_for_canary',
    'TestRendererRoot::create',
    'TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff',
    'render_host_root_for_lanes',
    'HostRootRenderPhaseRecord::finished_work',
    'TestRendererOptions::reconciler_options',
    'update_container',
    'ensure_root_is_scheduled'
  ]),
  acceptedRustFinishedWorkRecords: Object.freeze([
    'HostRootRenderPhaseRecord',
    'HostRootFinishedWorkPendingCommitRecordForCanary',
    'HostRootFinishedWorkCommitHandoffRecordForCanary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_create_preflight_validates_create_canary_without_public_root',
    'root_private_create_preflight_fails_closed_for_unsupported_children',
    'root_private_create_preflight_fails_closed_for_stale_canary_metadata',
    'root_private_create_preflight_fails_closed_without_root_options',
    'root_private_create_preflight_fails_closed_without_work_loop_metadata',
    'root_private_create_preflight_fails_closed_for_stale_work_loop_metadata',
    'root_work_loop_complete_work_handoff_commits_host_component_tree_with_diagnostics',
    'root_commit_finished_work_handoff_records_identity_lanes_root_token_and_order',
    'root_commit_finished_work_handoff_rejects_missing_record_before_switching_current',
    'root_commit_finished_work_handoff_rejects_stale_record_after_current_switch'
  ]),
  acceptedInputShapes: Object.freeze([
    'HostComponentWithTextChild'
  ]),
  workLoopFinishedWorkPreflightRowId:
    privateRootCreateWorkLoopFinishedWorkPreflightRowId,
  workLoopFinishedWorkMetadataRequired: true,
  requiredRootOptions: true,
  validatesAcceptedRustRootCreateCanary: true,
  validatesAcceptedRustWorkLoopFinishedWorkPreflight: true,
  privateRustRootCreated: true,
  rootWorkLoopFinishedWorkPreflightReady: true,
  publicRendererRootCreated: false,
  publicRootAvailable: false,
  publicCreateBehaviorAvailable: false,
  nativeAddonLoaded: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  compatibilityClaimed: false
});
const privateCreateRouteAdmissionGate = Object.freeze({
  id: privateCreateRouteAdmissionRecordId,
  status: privateCreateRouteAdmissionStatus,
  publicSurface: 'create()',
  deterministic: true,
  diagnosticName: privateCreateRouteAdmissionDiagnosticName,
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedWorker:
    'worker-610-test-renderer-create-native-bridge-admission',
  acceptedRustRecords: Object.freeze([
    'TestRendererRootScheduledUpdate',
    'TestRendererRootCreatePreflightDiagnostics',
    'TestRendererRootWorkLoopFinishedWorkPreflightDiagnostics',
    'TestRendererPrivateCreateRouteAdmissionDiagnostics',
    'TestRendererPrivateCreateNativeBridgeHostOutputHandoff'
  ]),
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::create',
    'TestRendererRoot::describe_private_root_create_preflight_for_canary',
    'TestRendererRoot::describe_private_root_create_preflight_from_render_for_canary',
    'TestRendererRoot::describe_private_create_route_admission_for_canary',
    'TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff',
    'TestRendererRoot::render_and_commit_host_output_for_canary',
    'TestRendererRoot::describe_private_create_native_bridge_host_output_handoff_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_create_route_admission_consumes_create_and_work_loop_evidence',
    'root_private_create_native_bridge_handoff_consumes_actual_host_output',
    'root_private_create_native_bridge_handoff_rejects_stale_admission',
    'root_private_create_native_bridge_handoff_rejects_mismatched_finished_work_preflight',
    'root_private_create_route_admission_rejects_missing_rust_admission_record',
    'root_private_create_route_admission_rejects_stale_rust_admission_record',
    'root_private_create_route_admission_rejects_missing_root_create_preflight'
  ]),
  hostOutputHandoffDiagnosticId:
    privateCreateNativeBridgeHostOutputHandoffDiagnosticId,
  hostOutputHandoffStatus:
    privateCreateNativeBridgeHostOutputHandoffStatus,
  rootCreatePreflightGate: privateRootCreatePreflightGate,
  workLoopFinishedWorkPreflightRowId:
    privateRootCreateWorkLoopFinishedWorkPreflightRowId,
  consumesJsFacadeCreateMetadata: true,
  consumesAcceptedRustRootCreateExecutionEvidence: true,
  consumesAcceptedRustRootCreatePreflightDiagnostics: true,
  consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata: true,
  consumesAcceptedRustCreateHostOutputHandoff: true,
  consumesCurrentRustRootFinishedWorkIdentity: true,
  requiresCommitCurrentMatchesRenderFinishedWork: true,
  acceptedHostOutputShape: 'SingleHostText',
  hostOutputProducedByRust: true,
  missingRustAdmissionRecordRejection: true,
  staleRustAdmissionRecordRejection: true,
  publicRouteAvailable: false,
  publicRendererRootCreated: false,
  publicRootAvailable: false,
  publicCreateBehaviorAvailable: false,
  publicSerializationAvailable: false,
  nativeAddonLoaded: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  reconcilerExecutionFromJs: false,
  hostOutputProducedFromJs: false,
  compatibilityClaimed: false
});
const updateUnmountRustLifecycleDiagnosticGate = Object.freeze({
  id: 'react-test-renderer-update-unmount-rust-lifecycle-diagnostic-gate',
  status: 'accepted-private-update-unmount-lifecycle-diagnostics-public-root-blocked',
  deterministic: true,
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustRecords: Object.freeze([
    'TestRendererRootLifecycle',
    'TestRendererRootUpdateKind',
    'TestRendererRootUpdateOutcome',
    'TestRendererRootScheduledUpdate'
  ]),
  acceptedOperations: Object.freeze(['create', 'update', 'unmount']),
  acceptedLifecycleStates: Object.freeze(['Active', 'UnmountScheduled']),
  acceptedOutcomes: Object.freeze([
    'Scheduled',
    'IgnoredAfterUnmount',
    'AlreadyUnmountScheduled'
  ]),
  acceptedScheduledElementKinds: Object.freeze([
    'RootElementHandle',
    'RootElementHandle::NONE'
  ]),
  acceptedContainerUpdateApis: Object.freeze([
    'update_container',
    'update_container_sync'
  ]),
  acceptedWorkers: Object.freeze([
    'worker-153-test-renderer-root-canary',
    'worker-234-test-renderer-host-output-update-unmount-canary',
    'worker-307-test-renderer-update-unmount-private-js-bridge'
  ]),
  acceptedRustTests: Object.freeze([
    'root_update_reuses_same_fiber_root_and_shared_scheduler_record',
    'root_update_after_unmount_does_not_mutate_or_reschedule',
    'root_unmount_enqueues_sync_null_update_before_wrapper_invalidation',
    'root_unmount_is_idempotent'
  ]),
  privateDiagnosticConsumptionAvailable: true,
  publicCreateUpdateUnmountBehaviorAvailable: false,
  publicRouteAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  reconcilerExecutionFromJs: false,
  hostOutputProducedFromJs: false,
  compatibilityClaimed: false
});
const privateUpdateRouteRootWorkLoopDiagnosticName =
  'fast-react-test-renderer.update-route.private-root-work-loop';
const privateUpdateRouteRootWorkLoopStatus =
  'private-update-route-root-work-loop-metadata-ready-public-update-blocked';
const privateUpdateRouteRootWorkLoopAdmissionId =
  'react-test-renderer-update-route-root-work-loop-private-admission';
const privateUpdateRouteRootWorkLoopAdmissionStatus =
  'accepted-private-update-route-root-work-loop-admission-public-update-blocked';
const privateUpdateRouteRootWorkLoopGate = Object.freeze({
  id: 'react-test-renderer-update-route-root-work-loop-private-gate',
  status: privateUpdateRouteRootWorkLoopStatus,
  publicSurface: 'create().update',
  deterministic: true,
  diagnosticName: privateUpdateRouteRootWorkLoopDiagnosticName,
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedWorker: 'worker-574-test-renderer-update-via-root-work-loop',
  acceptedRustRecords: Object.freeze([
    'TestRendererRootScheduledUpdate',
    'UpdateContainerResult',
    'RootScheduleUpdateRecord',
    'ScheduledRootUpdateResult',
    'HostRootRenderPhaseRecord',
    'HostRootCommitRecord',
    'TestRendererUpdatedHostOutput',
    'TestRendererPrivateUpdateRouteAdmissionRecord'
  ]),
  acceptedHostRootUpdateQueueRecords: Object.freeze([
    'UpdateContainerResult',
    'RootScheduleUpdateRecord',
    'UpdateId',
    'UpdateQueueHandle'
  ]),
  acceptedRootWorkLoopRecords: Object.freeze([
    'HostRootRenderPhaseRecord',
    'HostRootCommitRecord'
  ]),
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_update_route_admission_for_canary',
    'TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary',
    'TestRendererRoot::update_host_component_with_text_for_canary',
    'TestRendererRoot::render_and_commit_host_output_update_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_update_route_admission_record_consumes_update_work_loop_diagnostics',
    'root_private_update_route_consumes_root_work_loop_update_queue_and_text_update_metadata',
    'root_private_update_route_rejects_stale_root_update_output',
    'root_private_update_route_rejects_missing_update_queue_evidence',
    'root_private_update_route_rejects_unmounted_root',
    'root_private_update_route_rejects_incompatible_finished_work_record'
  ]),
  admissionRecordId: privateUpdateRouteRootWorkLoopAdmissionId,
  admissionStatus: privateUpdateRouteRootWorkLoopAdmissionStatus,
  privateUpdateAdmissionRecordAvailable: true,
  consumesAcceptedHostRootUpdateQueueMetadata: true,
  consumesAcceptedRootWorkLoopMetadata: true,
  consumesAcceptedHostOutputMetadata: true,
  consumesManualHostOutputCanary: true,
  staleRootLifecycleRejection: true,
  staleRootRejection: true,
  staleHostOutputRejection: true,
  missingUpdateQueueEvidenceRejection: true,
  unmountedRootRejection: true,
  incompatibleFinishedWorkRejection: true,
  publicRootUpdateAvailable: false,
  publicSerializationAvailable: false,
  publicRendererRootCreated: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  compatibilityClaimed: false
});
const privateUpdateNativeBridgeAdmissionDiagnosticId =
  'react-test-renderer-update-native-bridge-admission-private-diagnostic';
const privateUpdateNativeBridgeAdmissionStatus =
  'private-update-native-bridge-admission-host-output-handoff-public-update-blocked';
const privateUpdateNativeBridgeAdmissionGate = Object.freeze({
  id: privateUpdateNativeBridgeAdmissionDiagnosticId,
  status: privateUpdateNativeBridgeAdmissionStatus,
  publicSurface: 'create().update',
  deterministic: true,
  acceptedWorker:
    'worker-637-test-renderer-update-native-execution',
  acceptedWorkers: Object.freeze([
    'worker-637-test-renderer-update-native-execution',
    'worker-696-test-renderer-root-update-prop-style-execution'
  ]),
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustRecords: Object.freeze([
    'TestRendererRootUpdateOutcome',
    'TestRendererRootScheduledUpdate',
    'TestRendererUpdatedHostOutput',
    'TestRendererPrivateUpdateRouteAdmissionRecord',
    'TestProps',
    'TestRendererUpdateNativeBridgeAdmission'
  ]),
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::update_host_component_with_props_and_text_for_canary',
    'TestRendererRoot::render_and_commit_host_output_update_for_canary',
    'TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary',
    'TestRendererRoot::describe_private_update_native_bridge_admission_for_canary',
    'TestRendererRoot::render_and_admit_private_update_native_bridge_handoff_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_update_native_bridge_admission_consumes_actual_update_host_output_handoff',
    'root_private_update_native_bridge_admission_consumes_prop_style_text_update_execution',
    'root_private_update_native_bridge_admission_rejects_missing_handoff',
    'root_private_update_native_bridge_admission_rejects_stale_route_outcome'
  ]),
  privateRouteDependencyId:
    'react-test-renderer-update-route-private-diagnostic',
  updateRouteRootWorkLoopGate: privateUpdateRouteRootWorkLoopGate,
  updateRouteAdmissionRecordId: privateUpdateRouteRootWorkLoopAdmissionId,
  lifecycleDiagnosticGate: updateUnmountRustLifecycleDiagnosticGate,
  consumesPrivateUpdateRouteMetadata: true,
  consumesAcceptedRustLifecycleDiagnostics: true,
  consumesAcceptedRootWorkLoopHandoff: true,
  consumesAcceptedHostOutputHandoff: true,
  validatesLifecycleEvidence: true,
  validatesTextAndPropertyUpdateEvidence: true,
  validatesPropStyleTextUpdateEvidence: true,
  acceptedHostComponentUpdatePayloadShape:
    'HostComponentPropStyleTextUpdate',
  propStyleTextExecutionWorker:
    'worker-696-test-renderer-root-update-prop-style-execution',
  rejectsStaleUpdateHandoffs: true,
  rejectsUnmountedRoots: true,
  rejectsMissingHostOutputHandoff: true,
  publicRouteAvailable: false,
  publicUpdateCompatibilityClaimed: false,
  publicSerializationAvailable: false,
  actFlushingClaimed: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: true,
  reconcilerExecutionFromJs: true,
  hostOutputProducedFromJs: true,
  compatibilityClaimed: false
});
const createPrivateRoute = Object.freeze({
  id: 'react-test-renderer-create-private-route',
  publicSurface: 'create()',
  status: 'blocked-js-native-bridge-not-loaded',
  deterministic: true,
  publicRouteAvailable: false,
  privateRustCanaryAccepted: true,
  acceptedRustLifecycleDiagnostics: true,
  consumesAcceptedRustLifecycleDiagnostics: true,
  lifecycleDiagnosticGate: updateUnmountRustLifecycleDiagnosticGate,
  acceptedRustRecords: updateUnmountRustLifecycleDiagnosticGate.acceptedRustRecords,
  acceptedLifecycleStates:
    updateUnmountRustLifecycleDiagnosticGate.acceptedLifecycleStates,
  acceptedOutcomes: Object.freeze(['Scheduled']),
  nativeBridgeAvailable: false,
  nativeExecution: false,
  acceptedWorker:
    'worker-610-test-renderer-create-native-bridge-admission',
  acceptedWorkers: Object.freeze([
    'worker-153-test-renderer-root-canary',
    'worker-539-test-renderer-live-rust-root-create-preflight',
    'worker-573-test-renderer-private-root-work-loop-preflight',
    'worker-610-test-renderer-create-native-bridge-admission',
    'worker-636-test-renderer-create-native-execution'
  ]),
  acceptedRustCrate: 'fast-react-test-renderer',
  createRouteAdmissionGate: privateCreateRouteAdmissionGate,
  rootCreatePreflightGate: privateRootCreatePreflightGate,
  consumesJsFacadeCreateMetadata: true,
  consumesAcceptedRustRootCreateExecutionEvidence: true,
  consumesAcceptedRustRootCreatePreflightDiagnostics: true,
  consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata: true,
  consumesAcceptedRustCreateHostOutputHandoff: true,
  consumesCurrentRustRootFinishedWorkIdentity: true,
  requiresCommitCurrentMatchesRenderFinishedWork: true,
  acceptedHostOutputShape: 'SingleHostText',
  hostOutputProducedByRust: true,
  publicCreateBehaviorAvailable: false,
  publicSerializationAvailable: false,
  compatibilityClaimed: false,
  acceptedRustApis: privateCreateRouteAdmissionGate.acceptedRustApis,
  acceptedRustTests: privateCreateRouteAdmissionGate.acceptedRustTests
});
const updatePrivateRoute = Object.freeze({
  id: 'react-test-renderer-update-private-route',
  publicSurface: 'create().update',
  status: 'blocked-js-native-bridge-not-loaded',
  deterministic: true,
  publicRouteAvailable: false,
  privateRustCanaryAccepted: true,
  acceptedRustLifecycleDiagnostics: true,
  consumesAcceptedRustLifecycleDiagnostics: true,
  lifecycleDiagnosticGate: updateUnmountRustLifecycleDiagnosticGate,
  acceptedRustRecords: updateUnmountRustLifecycleDiagnosticGate.acceptedRustRecords,
  acceptedLifecycleStates:
    updateUnmountRustLifecycleDiagnosticGate.acceptedLifecycleStates,
  acceptedOutcomes: Object.freeze(['Scheduled', 'IgnoredAfterUnmount']),
  nativeBridgeAvailable: false,
  nativeExecution: false,
  acceptedWorker: 'worker-234-test-renderer-host-output-update-unmount-canary',
  acceptedWorkers: Object.freeze([
    'worker-234-test-renderer-host-output-update-unmount-canary',
    'worker-574-test-renderer-update-via-root-work-loop',
    'worker-637-test-renderer-update-native-execution',
    'worker-696-test-renderer-root-update-prop-style-execution'
  ]),
  acceptedRustCrate: 'fast-react-test-renderer',
  rootWorkLoopUpdateRouteGate: privateUpdateRouteRootWorkLoopGate,
  privateUpdateAdmissionRecordId: privateUpdateRouteRootWorkLoopAdmissionId,
  privateUpdateAdmissionStatus: privateUpdateRouteRootWorkLoopAdmissionStatus,
  privateUpdateAdmissionRecordAvailable: true,
  nativeBridgeAdmission: privateUpdateNativeBridgeAdmissionGate,
  nativeBridgeAdmissionAvailable: true,
  updateNativeBridgeAdmissionApi:
    'TestRendererRoot::describe_private_update_native_bridge_admission_for_canary',
  updateNativeBridgeAdmissionDiagnosticId:
    privateUpdateNativeBridgeAdmissionDiagnosticId,
  updateNativeBridgeAdmissionStatus:
    privateUpdateNativeBridgeAdmissionStatus,
  consumesAcceptedHostRootUpdateQueueMetadata: true,
  consumesAcceptedRootWorkLoopMetadata: true,
  consumesAcceptedHostOutputMetadata: true,
  consumesAcceptedRootWorkLoopHandoff: true,
  consumesAcceptedHostOutputHandoff: true,
  hostTextUpdateMetadataAvailable: true,
  publicSerializationAvailable: false,
  compatibilityClaimed: false,
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_update_route_admission_for_canary',
    'TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary',
    'TestRendererRoot::update_host_component_with_text_for_canary',
    'TestRendererRoot::update_host_component_with_props_and_text_for_canary',
    'TestRendererRoot::render_and_commit_host_output_update_for_canary',
    'TestRendererRoot::describe_private_update_native_bridge_admission_for_canary',
    'TestRendererRoot::render_and_admit_private_update_native_bridge_handoff_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_update_route_admission_record_consumes_update_work_loop_diagnostics',
    'root_private_update_route_consumes_root_work_loop_update_queue_and_text_update_metadata',
    'root_private_update_route_rejects_stale_root_update_output',
    'root_private_update_route_rejects_missing_update_queue_evidence',
    'root_private_update_route_rejects_unmounted_root',
    'root_private_update_route_rejects_incompatible_finished_work_record',
    'root_private_update_native_bridge_admission_consumes_actual_update_host_output_handoff',
    'root_private_update_native_bridge_admission_consumes_prop_style_text_update_execution',
    'root_private_update_native_bridge_admission_rejects_missing_handoff',
    'root_private_update_native_bridge_admission_rejects_stale_route_outcome',
    'root_host_output_canary_updates_committed_text_with_update_diagnostics',
    'root_host_output_update_canary_fails_closed_without_committed_output'
  ])
});
const privateUnmountDeletionCommitHandoffDiagnosticId =
  'react-test-renderer-unmount-deletion-commit-handoff-private-diagnostic';
const privateUnmountDeletionCommitHandoffStatus =
  'private-unmount-deletion-commit-handoff-public-unmount-blocked';
const privateUnmountNativeBridgeAdmissionDiagnosticId =
  'react-test-renderer-unmount-native-bridge-admission-private-diagnostic';
const privateUnmountNativeBridgeAdmissionStatus =
  'private-unmount-native-bridge-admission-public-unmount-blocked';
const privateUnmountNativeBridgeCleanupHandoffDiagnosticId =
  'react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic';
const privateUnmountNativeBridgeCleanupHandoffStatus =
  'private-unmount-native-bridge-cleanup-handoff-public-unmount-blocked';
const privateUnmountPassiveRefCleanupOrderDiagnosticId =
  'react-test-renderer-unmount-passive-ref-cleanup-order-private-diagnostic';
const privateUnmountPassiveRefCleanupOrderStatus =
  'private-unmount-passive-ref-cleanup-order-public-unmount-blocked';
const privateUnmountHostChildDetachmentBlockers = Object.freeze({
  id: 'react-test-renderer-unmount-host-child-detachment-blockers',
  status:
    'blocked-public-host-child-detachment-private-cleanup-metadata-only',
  deterministic: true,
  knownFixtureDetachMetadataAvailable: true,
  hostNodeCleanupInvalidationMetadataAvailable: true,
  broadHostChildDetachmentBlocked: true,
  publicHostTeardownCompatibilityClaimed: false,
  publicUnmountCompatibilityClaimed: false,
  actFlushingClaimed: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateUnmountPassiveRefCleanupOrderGate = Object.freeze({
  id: privateUnmountPassiveRefCleanupOrderDiagnosticId,
  status: privateUnmountPassiveRefCleanupOrderStatus,
  publicSurface: 'create().unmount',
  deterministic: true,
  acceptedWorker:
    'worker-672-test-renderer-unmount-passive-ref-order',
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustRecords: Object.freeze([
    'HostRootDeletionCleanupOrderGateSnapshot',
    'HostRootDeletionCleanupOrderGateRecord',
    'TestRendererUnmountPassiveRefCleanupOrderEvidence'
  ]),
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary',
    'TestRendererRoot::execute_private_unmount_native_bridge_cleanup_handoff_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_unmount_passive_ref_order_rejects_native_cleanup_mismatch',
    'root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff'
  ]),
  tiesNativeCleanupToRefDetachmentAndPassiveDestroyOrder: true,
  validatesNativeCleanupAfterRefAndPassiveOrder: true,
  minimalTreeOrderEvidenceAvailable: true,
  publicRouteAvailable: false,
  publicUnmountCompatibilityClaimed: false,
  publicRefOrEffectCompatibilityClaimed: false,
  publicEffectsFlushed: false,
  actFlushingClaimed: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  compatibilityClaimed: false
});
const privateUnmountDeletionCommitHandoffGate = Object.freeze({
  id: privateUnmountDeletionCommitHandoffDiagnosticId,
  status: privateUnmountDeletionCommitHandoffStatus,
  publicSurface: 'create().unmount',
  deterministic: true,
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustRecords: Object.freeze([
    'HostRootCommitRecord',
    'HostRootDeletionCleanupLog',
    'HostRootDeletionCleanupOrderGateSnapshot',
    'HostRootDeletionCleanupOrderGateRecord',
    'TestRendererHostNodeCleanupReport',
    'TestRendererUnmountDeletionCommitHandoffDiagnostics',
    'TestRendererUnmountHostChildDetachmentBlockers',
    'TestRendererUnmountPassiveRefCleanupOrderEvidence'
  ]),
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::unmount',
    'TestRendererRoot::render_and_commit_host_output_unmount_for_canary',
    'TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics',
    'root_private_unmount_route_rejects_stale_deletion_commit_handoff',
    'root_host_output_unmount_canary_rejects_already_unmounted_root_record'
  ]),
  acceptedWorker: 'worker-575-test-renderer-unmount-deletion-commit-link',
  lifecycleDiagnosticGate: updateUnmountRustLifecycleDiagnosticGate,
  hostChildDetachmentBlockers: privateUnmountHostChildDetachmentBlockers,
  passiveRefCleanupOrderGate: privateUnmountPassiveRefCleanupOrderGate,
  deletionCommitHandoffAvailable: true,
  hostNodeDeletionCleanupLogAvailable: true,
  passiveRefCleanupOrderEvidenceAvailable: true,
  hostChildDetachmentBlockersAvailable: true,
  lifecycleStatusMetadataAvailable: true,
  staleRootRecordRejection: true,
  alreadyUnmountedRootRecordRejection: true,
  publicRouteAvailable: false,
  publicUnmountCompatibilityClaimed: false,
  publicHostTeardownCompatibilityClaimed: false,
  actFlushingClaimed: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  compatibilityClaimed: false
});
const privateUnmountNativeBridgeCleanupHandoffGate = Object.freeze({
  id: privateUnmountNativeBridgeCleanupHandoffDiagnosticId,
  status: privateUnmountNativeBridgeCleanupHandoffStatus,
  publicSurface: 'create().unmount',
  deterministic: true,
  acceptedWorker:
    'worker-672-test-renderer-unmount-passive-ref-order',
  acceptedWorkers: Object.freeze([
    'worker-638-test-renderer-unmount-native-execution',
    'worker-672-test-renderer-unmount-passive-ref-order'
  ]),
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustRecords: Object.freeze([
    'TestRendererRootUpdateOutcome',
    'TestRendererUnmountedHostOutput',
    'TestRendererUnmountDeletionCommitHandoffDiagnostics',
    'TestRendererUnmountNativeBridgeAdmission',
    'TestRendererUnmountNativeBridgeCleanupHandoff',
    'TestRendererUnmountPassiveRefCleanupOrderEvidence'
  ]),
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::unmount',
    'TestRendererRoot::render_and_commit_host_output_unmount_for_canary',
    'TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary',
    'TestRendererRoot::describe_private_unmount_native_bridge_admission_for_canary',
    'TestRendererRoot::execute_private_unmount_native_bridge_cleanup_handoff_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff',
    'root_private_unmount_passive_ref_order_rejects_native_cleanup_mismatch'
  ]),
  deletionCommitHandoffGate: privateUnmountDeletionCommitHandoffGate,
  passiveRefCleanupOrderGate: privateUnmountPassiveRefCleanupOrderGate,
  admissionDiagnosticId: privateUnmountNativeBridgeAdmissionDiagnosticId,
  minimalTreeOnly: true,
  hostOutputProduced: true,
  rustUnmountCleanupHandoffExecuted: true,
  tiesNativeCleanupToRefDetachmentAndPassiveDestroyOrder: true,
  publicRouteAvailable: false,
  publicUnmountCompatibilityClaimed: false,
  publicHostTeardownCompatibilityClaimed: false,
  actFlushingClaimed: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  compatibilityClaimed: false
});
const privateUnmountNativeBridgeAdmissionGate = Object.freeze({
  id: privateUnmountNativeBridgeAdmissionDiagnosticId,
  status: privateUnmountNativeBridgeAdmissionStatus,
  publicSurface: 'create().unmount',
  deterministic: true,
  acceptedWorker:
    'worker-672-test-renderer-unmount-passive-ref-order',
  acceptedWorkers: Object.freeze([
    'worker-612-test-renderer-unmount-native-bridge-admission',
    'worker-638-test-renderer-unmount-native-execution',
    'worker-672-test-renderer-unmount-passive-ref-order'
  ]),
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustRecords: Object.freeze([
    'TestRendererRootUpdateOutcome',
    'TestRendererRootScheduledUpdate',
    'TestRendererUnmountDeletionCommitHandoffDiagnostics',
    'TestRendererUnmountHostChildDetachmentBlockers',
    'TestRendererUnmountNativeBridgeAdmission',
    'TestRendererUnmountNativeBridgeCleanupHandoff',
    'TestRendererUnmountPassiveRefCleanupOrderEvidence'
  ]),
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::unmount',
    'TestRendererRoot::render_and_commit_host_output_unmount_for_canary',
    'TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary',
    'TestRendererRoot::describe_private_unmount_native_bridge_admission_for_canary',
    'TestRendererRoot::execute_private_unmount_native_bridge_cleanup_handoff_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics',
    'root_private_unmount_native_bridge_admission_rejects_stale_handoff',
    'root_private_unmount_native_bridge_admission_rejects_missing_cleanup_blockers',
    'root_private_unmount_native_bridge_admission_rejects_already_unmounted_root',
    'root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff',
    'root_private_unmount_passive_ref_order_rejects_native_cleanup_mismatch'
  ]),
  privateRouteDependencyId:
    'react-test-renderer-unmount-route-private-diagnostic',
  deletionCommitHandoffGate: privateUnmountDeletionCommitHandoffGate,
  cleanupHandoffGate: privateUnmountNativeBridgeCleanupHandoffGate,
  passiveRefCleanupOrderGate: privateUnmountPassiveRefCleanupOrderGate,
  lifecycleDiagnosticGate: updateUnmountRustLifecycleDiagnosticGate,
  consumesPrivateUnmountRouteMetadata: true,
  consumesAcceptedRustLifecycleDiagnostics: true,
  consumesAcceptedDeletionCommitHandoff: true,
  consumesActualRustCleanupHandoff: true,
  requiresActualRustCleanupHandoff: true,
  validatesLifecycleEvidence: true,
  validatesCleanupBlockers: true,
  validatesPassiveRefCleanupOrder: true,
  validatesMinimalTreeCleanupHandoff: true,
  tiesNativeCleanupToRefDetachmentAndPassiveDestroyOrder: true,
  rustUnmountCleanupHandoffExecuted: true,
  hostOutputProduced: true,
  minimalTreeCleanupHandoff: true,
  rejectsAlreadyUnmountedRoots: true,
  rejectsStaleDeletionHandoffs: true,
  rejectsMissingCleanupBlockers: true,
  publicRouteAvailable: false,
  publicUnmountCompatibilityClaimed: false,
  publicHostTeardownCompatibilityClaimed: false,
  actFlushingClaimed: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  compatibilityClaimed: false
});
const unmountPrivateRoute = Object.freeze({
  id: 'react-test-renderer-unmount-private-route',
  publicSurface: 'create().unmount',
  status: 'blocked-js-native-bridge-not-loaded',
  deterministic: true,
  publicRouteAvailable: false,
  privateRustCanaryAccepted: true,
  acceptedRustLifecycleDiagnostics: true,
  consumesAcceptedRustLifecycleDiagnostics: true,
  lifecycleDiagnosticGate: updateUnmountRustLifecycleDiagnosticGate,
  acceptedRustRecords: updateUnmountRustLifecycleDiagnosticGate.acceptedRustRecords,
  acceptedLifecycleStates:
    updateUnmountRustLifecycleDiagnosticGate.acceptedLifecycleStates,
  acceptedOutcomes: Object.freeze(['Scheduled', 'AlreadyUnmountScheduled']),
  nativeBridgeAvailable: false,
  nativeExecution: false,
  acceptedWorker: 'worker-234-test-renderer-host-output-update-unmount-canary',
  acceptedWorkers: Object.freeze([
    'worker-234-test-renderer-host-output-update-unmount-canary'
  ]),
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::unmount',
    'TestRendererRoot::render_and_commit_host_output_unmount_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics'
  ]),
  deletionCommitHandoff: privateUnmountDeletionCommitHandoffGate,
  deletionCommitHandoffDiagnosticsAvailable: true,
  nativeBridgeCleanupHandoff: privateUnmountNativeBridgeCleanupHandoffGate,
  nativeBridgeCleanupHandoffAvailable: true,
  nativeBridgeAdmission: privateUnmountNativeBridgeAdmissionGate,
  nativeBridgeAdmissionAvailable: true,
  hostChildDetachmentBlockers: privateUnmountHostChildDetachmentBlockers,
  passiveRefCleanupOrder: privateUnmountPassiveRefCleanupOrderGate,
  passiveRefCleanupOrderAvailable: true,
  lifecycleStatusMetadataAvailable: true,
  staleRootRecordRejection: true,
  alreadyUnmountedRootRecordRejection: true,
  publicUnmountCompatibilityClaimed: false,
  publicHostTeardownCompatibilityClaimed: false,
  actFlushingClaimed: false
});
const privateToJSONSerializationFacadeSymbol = Symbol.for(
  'fast.react_test_renderer.private_tojson_serialization_facade'
);
const privateToJSONSerializationStatus =
  'private-host-output-diagnostics-serializable-public-tojson-blocked';
const privateToJSONAcceptedDiagnosticName =
  'fast-react-test-renderer.serialization.private-json-canary';
const privateToJSONFacadeResultDiagnosticName =
  'fast-react-test-renderer.tojson.private-facade-result';
const privateToJSONFacadeResultStatus =
  'private-tojson-facade-result-backed-by-rust-host-output-public-blocked';
const privateToJSONNativeExecutionDiagnosticName =
  'fast-react-test-renderer.tojson.private-native-execution-evidence';
const privateToJSONNativeExecutionStatus =
  'private-tojson-native-execution-records-consumed-public-tojson-blocked';
const privateSerializationFinishedWorkIdentityDiagnosticName =
  'fast-react-test-renderer.serialization.private-finished-work-identity';
const privateSerializationFinishedWorkIdentityStatus =
  'private-serialization-finished-work-identity-validated-public-serialization-blocked';
const privateToJSONNativeExecutionRecordKind =
  'FastReactTestRendererPrivateRootExecutionResult';
const privateToJSONNativeExecutionAcceptedOperations = Object.freeze([
  'create',
  'update',
  'unmount'
]);
const privateToJSONUpdateHostOutputRowId =
  'react-test-renderer-tojson-update-host-output-private-diagnostic';
const privateToJSONNestedUpdateHostOutputRowId =
  'react-test-renderer-tojson-nested-host-output-update-private-diagnostic';
const privateToJSONSiblingTextHostOutputRowId =
  'react-test-renderer-tojson-sibling-text-host-output-private-diagnostic';
const privateToJSONUnmountHostOutputRowId =
  'react-test-renderer-tojson-unmount-host-output-private-diagnostic';
const privateToJSONUpdateUnmountRowStatus =
  'private-tojson-update-unmount-host-output-rows-public-tojson-blocked';
const privateToJSONUpdateHostOutputRowIds = Object.freeze([
  privateToJSONUpdateHostOutputRowId,
  privateToJSONNestedUpdateHostOutputRowId,
  privateToJSONSiblingTextHostOutputRowId
]);
const privateToJSONHostOutputShapes = Object.freeze([
  'EmptyRoot',
  'SingleHostText',
  'NestedHostText',
  'SiblingText'
]);
const privateToJSONNativeExecutionHostOutputShapes = Object.freeze([
  'SingleHostText',
  'NestedHostText',
  'SiblingText',
  'EmptyRoot'
]);
const privateToJSONNativeExecutionHostOutputRowIds = Object.freeze([
  privateToJSONUpdateHostOutputRowId,
  privateToJSONNestedUpdateHostOutputRowId,
  privateToJSONSiblingTextHostOutputRowId,
  privateToJSONUnmountHostOutputRowId
]);
const privateToJSONUpdateUnmountDependencyIds = Object.freeze([
  'react-test-renderer-update-route-private-diagnostic',
  'react-test-renderer-unmount-route-private-diagnostic',
  'react-test-renderer-serialization-private-json-diagnostic'
]);
const privateToJSONUpdateUnmountDependencyMetadata = Object.freeze({
  acceptedPrivateDiagnosticDependencyIds:
    privateToJSONUpdateUnmountDependencyIds,
  updateRouteDiagnosticsAvailable: true,
  unmountRouteDiagnosticsAvailable: true,
  serializationDiagnosticsAvailable: true,
  hostOutputSnapshotFreshnessRequired: true,
  staleSnapshotRejection: true,
  mismatchedUpdateUnmountRecordRejection: true,
  publicToJSONAvailable: false,
  publicTestInstanceAvailable: false,
  nativeExecutionAvailable: false,
  compatibilityClaimed: false
});
const privateToJSONUpdateUnmountHostOutputRows = Object.freeze([
  Object.freeze({
    id: privateToJSONUpdateHostOutputRowId,
    status: privateToJSONUpdateUnmountRowStatus,
    hostOutputUpdateKind: 'Update',
    hostOutputShape: 'SingleHostText',
    acceptedPrivateDiagnosticDependencyIds:
      privateToJSONUpdateUnmountDependencyIds,
    dependencyMetadata: privateToJSONUpdateUnmountDependencyMetadata,
    publicToJSONAvailable: false,
    publicTestInstanceAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  }),
  Object.freeze({
    id: privateToJSONUnmountHostOutputRowId,
    status: privateToJSONUpdateUnmountRowStatus,
    hostOutputUpdateKind: 'Unmount',
    hostOutputShape: 'EmptyRoot',
    acceptedPrivateDiagnosticDependencyIds:
      privateToJSONUpdateUnmountDependencyIds,
    dependencyMetadata: privateToJSONUpdateUnmountDependencyMetadata,
    publicToJSONAvailable: false,
    publicTestInstanceAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  })
]);
const privateToJSONNestedUpdateSiblingTextHostOutputRows = Object.freeze([
  Object.freeze({
    id: privateToJSONNestedUpdateHostOutputRowId,
    status: privateToJSONUpdateUnmountRowStatus,
    hostOutputUpdateKind: 'Update',
    hostOutputShape: 'NestedHostText',
    acceptedPrivateDiagnosticDependencyIds:
      privateToJSONUpdateUnmountDependencyIds,
    dependencyMetadata: privateToJSONUpdateUnmountDependencyMetadata,
    nestedHostComponentRowsAvailable: true,
    publicToJSONAvailable: false,
    publicTestInstanceAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  }),
  Object.freeze({
    id: privateToJSONSiblingTextHostOutputRowId,
    status: privateToJSONUpdateUnmountRowStatus,
    hostOutputUpdateKind: 'Update',
    hostOutputShape: 'SiblingText',
    acceptedPrivateDiagnosticDependencyIds:
      privateToJSONUpdateUnmountDependencyIds,
    dependencyMetadata: privateToJSONUpdateUnmountDependencyMetadata,
    siblingTextRowsAvailable: true,
    publicToJSONAvailable: false,
    publicTestInstanceAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  })
]);
const toJSONPrivateSerializationFacadeGate = Object.freeze({
  id: 'react-test-renderer-tojson-private-serialization-facade-gate',
  publicSurface: 'create().toJSON',
  status: 'ready-for-private-diagnostics-public-tojson-blocked',
  deterministic: true,
  privateFacadeGateAvailable: true,
  privateHostOutputDiagnosticsSerializable: true,
  privateSerializationFacadeSymbol:
    privateToJSONSerializationFacadeSymbol.description,
  privateSerializationStatus: privateToJSONSerializationStatus,
  privateDiagnosticResultAvailable: true,
  privateDiagnosticResultStatus: privateToJSONFacadeResultStatus,
  privateNativeExecutionEvidenceAvailable: true,
  privateNativeExecutionDiagnosticName:
    privateToJSONNativeExecutionDiagnosticName,
  privateNativeExecutionStatus: privateToJSONNativeExecutionStatus,
  privateFinishedWorkIdentityGateAvailable: true,
  privateUpdateFinishedWorkIdentityGateAvailable: true,
  validatesUpdateRootRequestIdentity: true,
  updateNativeExecutionFinishedWorkIdentityAdmissionWorker:
    'worker-726-test-renderer-update-native-serialization-identity-admission',
  updateNativeExecutionRequiresFinishedWorkIdentity: true,
  rejectsStaleUpdateFinishedWorkIdentity: true,
  rejectsMultichildUpdateNativeExecutionIdentityAdmission: true,
  privateFinishedWorkIdentityDiagnosticName:
    privateSerializationFinishedWorkIdentityDiagnosticName,
  privateFinishedWorkIdentityStatus:
    privateSerializationFinishedWorkIdentityStatus,
  consumesCommittedHostRootFinishedWorkIdentity: true,
  consumesCommittedHostRootFinishedWorkLanes: true,
  acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
  acceptedNativeExecutionOperations:
    privateToJSONNativeExecutionAcceptedOperations,
  consumesAcceptedNativeCreateUpdateUnmountExecutionRecords: true,
  privateNativeExecutionHostOutputRowEvidenceAvailable: true,
  privateNativeExecutionHostOutputShapes:
    privateToJSONNativeExecutionHostOutputShapes,
  privateNativeExecutionHostOutputRowIds:
    privateToJSONNativeExecutionHostOutputRowIds,
  nativeExecutionAcceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_to_json_after_create_native_execution_for_canary',
    'TestRendererRoot::describe_private_to_json_after_update_native_execution_for_canary',
    'TestRendererRoot::describe_private_to_json_after_nested_update_native_execution_for_canary',
    'TestRendererRoot::describe_private_to_json_sibling_text_update_native_execution_from_snapshot_for_diagnostics',
    'TestRendererRoot::describe_private_to_json_after_unmount_native_execution_for_canary',
    'TestRendererRoot::describe_private_to_json_finished_work_identity_gate_for_canary',
    'TestRendererPrivateToJsonNativeExecutionEvidence'
  ]),
  nativeExecutionAcceptedRustTests: Object.freeze([
    'root_private_to_json_native_execution_evidence_consumes_create_update_unmount_records',
    'root_private_to_json_update_native_execution_requires_finished_work_identity_gate',
    'root_private_to_json_nested_update_native_execution_evidence_consumes_multichild_row',
    'root_private_to_json_sibling_text_native_execution_evidence_consumes_sibling_row',
    'root_private_to_json_native_execution_evidence_rejects_row_id_shape_mismatch',
    'root_private_to_json_native_execution_evidence_rejects_stale_update_record',
    'root_private_to_json_serialization_finished_work_identity_gate_accepts_committed_handoff',
    'root_private_to_json_update_serialization_finished_work_identity_gate_accepts_committed_handoff',
    'root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence',
    'root_private_serialization_finished_work_identity_gate_rejects_missing_evidence',
    'root_private_serialization_finished_work_identity_gate_rejects_foreign_evidence',
    'root_private_serialization_finished_work_identity_gate_rejects_stale_evidence',
    'root_private_serialization_finished_work_identity_gate_rejects_non_committed_identity',
    'root_private_serialization_finished_work_identity_gate_rejects_lane_mismatch'
  ]),
  acceptedRustPrivateJsonDiagnostics: true,
  acceptedRustPrivateToJSONFacadeResult: true,
  privateUpdateUnmountHostOutputRows:
    privateToJSONUpdateUnmountHostOutputRows,
  privateNestedUpdateSiblingTextHostOutputRows:
    privateToJSONNestedUpdateSiblingTextHostOutputRows,
  privateUpdateUnmountDependencyMetadata:
    privateToJSONUpdateUnmountDependencyMetadata,
  privateUpdateHostOutputRowId: privateToJSONUpdateHostOutputRowId,
  privateNestedUpdateHostOutputRowId: privateToJSONNestedUpdateHostOutputRowId,
  privateSiblingTextHostOutputRowId: privateToJSONSiblingTextHostOutputRowId,
  privateUpdateHostOutputRowIds: privateToJSONUpdateHostOutputRowIds,
  privateUnmountHostOutputRowId: privateToJSONUnmountHostOutputRowId,
  privateUpdateHostComponentPropSerializationEvidenceAvailable: true,
  acceptedUpdateHostComponentPropPayloadShape:
    'HostComponentPropPlusTextUpdate',
  updatePropSerializationWorker:
    'worker-671-test-renderer-root-update-serialization-props',
  mismatchedUpdateUnmountRecordRejection: true,
  mismatchedUpdateShapeRejection: true,
  publicSerializationAvailable: false,
  publicRouteAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false,
  acceptedWorker: 'worker-265-test-renderer-private-json-ready-diagnostics',
  broaderHostShapesWorker:
    'worker-424-test-renderer-tojson-broader-host-shapes',
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustDiagnosticName: privateToJSONAcceptedDiagnosticName,
  acceptedRustDiagnosticResultName: privateToJSONFacadeResultDiagnosticName,
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_json_serialization_for_canary',
    'TestRendererRoot::describe_private_json_serialization_after_update_for_canary',
    'TestRendererRoot::describe_private_to_json_facade_result_for_canary',
    'TestRendererRoot::describe_private_to_json_facade_result_after_update_for_canary',
    'TestRendererRoot::describe_private_to_json_host_output_update_row_for_canary',
    'TestRendererRoot::describe_private_to_json_host_output_unmount_row_for_canary',
    'TestRendererRoot::describe_private_to_json_finished_work_identity_gate_for_canary',
    'TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics',
    'TestRendererPrivateJsonSerializationReport',
    'TestRendererPrivateJsonRenderedRoot',
    'TestRendererPrivateToJsonFacadeResult',
    'TestRendererPrivateToJsonHostOutputRow',
    'TestRendererPrivateSerializationFinishedWorkIdentityGate',
    'TestRendererPrivateToJsonHostOutputDependencyDiagnostics',
    'TestRendererPrivateJsonPublicSurfaceBlockers'
  ]),
  nestedUpdateSiblingAcceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_to_json_nested_host_output_update_row_for_canary',
    'TestRendererRoot::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics',
    'TestRendererPrivateToJsonHostOutputShape',
    'TestRendererPrivateToJsonHostOutputShapeDiagnostics'
  ]),
  acceptedRustNodeKinds: Object.freeze([
    'HostComponent',
    'Text'
  ]),
  acceptedHostRootShapes: Object.freeze([
    'EmptyRoot',
    'SingleHostChild',
    'MultipleHostChildren',
    'TextSibling'
  ]),
  nestedUpdateSiblingHostRootShapes: Object.freeze([
    'NestedHostText',
    'SiblingTextRow'
  ]),
  acceptedHostOutputUpdateKinds: Object.freeze([
    'Create',
    'Update',
    'Unmount'
  ]),
  propElisionFromSerializedProps: true,
  hostOutputSnapshotFreshnessRequired: true,
  staleSnapshotRejection: true,
  acceptedRustTests: Object.freeze([
    'root_private_json_serialization_canary_describes_minimal_host_component_with_text',
    'root_private_json_serialization_canary_describes_updated_host_component_text_after_commit',
    'root_private_json_serialization_canary_rejects_stale_host_output_snapshot',
    'root_private_json_serialization_canary_rejects_stale_updated_host_output_snapshot',
    'root_private_json_serialization_canary_rejects_stale_commit_after_same_shape_update',
    'root_private_json_serialization_canary_rejects_non_minimal_snapshot_shapes',
    'root_private_to_json_shape_diagnostics_serialize_empty_root_as_null',
    'root_private_to_json_shape_diagnostics_serialize_multiple_host_children_and_text_siblings',
    'root_private_to_json_shape_diagnostics_elide_children_prop',
    'root_private_to_json_facade_result_canary_wraps_create_serialization_evidence',
    'root_private_to_json_facade_result_canary_wraps_update_serialization_evidence',
    'root_private_to_json_unmount_host_output_row_records_empty_snapshot_blockers',
    'root_private_to_json_unmount_host_output_row_rejects_stale_snapshot',
    'root_private_to_json_update_host_output_row_rejects_mismatched_row_kind',
    'root_private_to_json_serialization_finished_work_identity_gate_accepts_committed_handoff',
    'root_private_to_json_update_serialization_finished_work_identity_gate_accepts_committed_handoff',
    'root_private_to_json_update_native_execution_requires_finished_work_identity_gate',
    'root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence',
    'root_private_serialization_finished_work_identity_gate_rejects_missing_evidence',
    'root_private_serialization_finished_work_identity_gate_rejects_foreign_evidence',
    'root_private_serialization_finished_work_identity_gate_rejects_stale_evidence',
    'root_private_serialization_finished_work_identity_gate_rejects_non_committed_identity',
    'root_private_serialization_finished_work_identity_gate_rejects_lane_mismatch'
  ]),
  nestedUpdateSiblingAcceptedRustTests: Object.freeze([
    'root_private_to_json_nested_host_output_update_row_records_nested_text_rows',
    'root_private_to_json_nested_host_output_update_row_rejects_stale_snapshot',
    'root_private_to_json_sibling_text_host_output_row_records_text_sibling_shape',
    'root_private_to_json_sibling_text_host_output_row_rejects_mismatched_shape'
  ]),
  acceptedFacadeResultWorker:
    'worker-391-test-renderer-public-tojson-private-facade',
  updateUnmountRefreshWorker:
    'worker-540-test-renderer-tojson-update-unmount-refresh',
  nestedUpdateRefreshWorker:
    'worker-577-test-renderer-nested-tojson-update-refresh',
  nativeExecutionEvidenceWorker:
    'worker-639-test-renderer-tojson-after-native-execution',
  multiChildNativeExecutionEvidenceWorker:
    'worker-697-test-renderer-tojson-multichild-native-execution',
  blockedPublicSurfaces: Object.freeze([
    'create().toJSON',
    'create().toTree',
    'create().root',
    'ReactTestInstance',
    'public-js-react-test-renderer-routing',
    'compatibility-claim'
  ]),
  missingPrerequisites: Object.freeze([
    'rust-native-test-renderer-create-bridge',
    'public-react-test-renderer-tojson-bridge',
    'public-test-instance-and-totree-serialization-contract'
  ])
});
const privateToTreeHostOutputMetadataSymbol = Symbol.for(
  'fast.react_test_renderer.private_totree_host_output_metadata'
);
const privateToTreeHostOutputMetadataStatus =
  'private-host-output-totree-metadata-ready-public-totree-blocked';
const privateToTreeFacadeSymbol = Symbol.for(
  'fast.react_test_renderer.private_totree_facade'
);
const privateToTreeFacadeStatus =
  'private-tree-diagnostics-serializable-public-totree-blocked';
const privateToTreeNativeExecutionDiagnosticName =
  'fast-react-test-renderer.totree.private-native-execution-evidence';
const privateToTreeNativeExecutionStatus =
  'private-totree-native-execution-records-consumed-public-totree-blocked';
const privateToTreeAcceptedDiagnosticName =
  'fast-react-test-renderer.serialization.private-tree-canary';
const privateToTreeCommittedFiberInspectionDiagnosticName =
  'fast-react-test-renderer.serialization.private-tree-committed-fiber-inspection-canary';
const privateToTreeAcceptedFiberShape = Object.freeze([
  'HostRoot',
  'HostComponent',
  'HostText'
]);
const privateToTreeCompositeAcceptedFiberShape = Object.freeze([
  'HostRoot',
  'FunctionComponent',
  'HostComponent',
  'HostText'
]);
const privateToTreeMultiChildAcceptedFiberShape = Object.freeze([
  'HostRoot',
  'HostText',
  'HostComponent',
  'HostText'
]);
const privateToTreeCompositeMultiChildAcceptedFiberShape = Object.freeze([
  'HostRoot',
  'FunctionComponent',
  'HostText',
  'HostComponent',
  'HostText'
]);
const privateToTreeFunctionComponentType = 'CanaryFunctionComponent';
const privateGetInstanceDiagnosticsSymbol = Symbol.for(
  'fast.react_test_renderer.private_get_instance_diagnostics'
);
const privateGetInstanceDiagnosticsStatus =
  'private-get-instance-class-root-diagnostics-public-getinstance-blocked';
const privateGetInstanceAcceptedDiagnosticName =
  'fast-react-test-renderer.get-instance.private-class-root-canary';
const privateGetInstanceAcceptedClassFiberShape = Object.freeze([
  'HostRoot',
  'ClassComponent',
  'HostComponent',
  'HostText'
]);
const privateGetInstanceHostRootFiberShape = Object.freeze([
  'HostRoot',
  'HostComponent'
]);
const privateGetInstanceFunctionRootFiberShape = Object.freeze([
  'HostRoot',
  'FunctionComponent'
]);
const privateGetInstanceClassComponentType = 'CanaryClassComponent';
const privateGetInstanceClassConstructorName = 'CanaryClassInstance';
const privateGetInstanceClassStateMarker = 'initial-state';
const toTreePrivateHostOutputMetadataGate = Object.freeze({
  id: 'react-test-renderer-totree-private-host-output-metadata-gate',
  publicSurface: 'create().toTree',
  status: 'ready-for-private-diagnostics-public-totree-blocked',
  deterministic: true,
  privateHostOutputTreeMetadataAvailable: true,
  privateMetadataSymbol: privateToTreeHostOutputMetadataSymbol.description,
  privateMetadataStatus: privateToTreeHostOutputMetadataStatus,
  privateFacadeSymbol: privateToTreeFacadeSymbol.description,
  privateFacadeStatus: privateToTreeFacadeStatus,
  acceptedMinimalFiberShape: privateToTreeAcceptedFiberShape,
  acceptedCompositeFiberShape: privateToTreeCompositeAcceptedFiberShape,
  acceptedMultiChildFiberShape: privateToTreeMultiChildAcceptedFiberShape,
  acceptedCompositeMultiChildFiberShape:
    privateToTreeCompositeMultiChildAcceptedFiberShape,
  acceptedReactSourceAlgorithm: 'ReactTestRenderer.js toTree',
  hostRootBehavior: 'childrenToTree(node.child)',
  functionComponentBehavior:
    "returns nodeType 'component' with function type, props, null instance, and rendered child tree",
  hostComponentBehavior:
    "returns nodeType 'host' with element type, props, null instance, and rendered children",
  hostTextBehavior: 'returns text string from the HostText state node',
  acceptedRustPrivateJsonDiagnostics: true,
  acceptedRustPrivateTreeMetadata: true,
  acceptedRustPrivateCompositeTreeMetadata: true,
  acceptedCommittedFiberInspection: true,
  acceptedCommittedFiberInspectionDiagnosticName:
    privateToTreeCommittedFiberInspectionDiagnosticName,
  privateCommittedFiberInspectionShapeDiagnosticsAvailable: true,
  privateMultiChildCommittedFiberInspectionAvailable: true,
  privateFunctionComponentCommittedFiberInspectionAvailable: true,
  privateCompositeFunctionMetadataAvailable: true,
  privateMultiChildHostOutputTreeMetadataAvailable: true,
  publicTreeAvailable: false,
  publicRouteAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false,
  acceptedWorker: 'worker-364-test-renderer-totree-private-host-output',
  acceptedRustWorkers: Object.freeze([
    'worker-235-test-renderer-private-fiber-inspection',
    'worker-265-test-renderer-private-json-ready-diagnostics',
    'worker-516-test-renderer-committed-fiber-tree-inspection'
  ]),
  acceptedRustApis: Object.freeze([
    'inspect_test_renderer_committed_fiber_tree',
    'TestRendererCommittedFiberTreeInspection::shape_name',
    'TestRendererCommittedFiberTreeInspection::nodes',
    'TestRendererCommittedFiberTreeInspection::root_children',
    'TestRendererCommittedFiberTreeInspection::host_children',
    'TestRendererCommittedFiberTreeInspection::function_component',
    'TestRendererCommittedFiberTreeInspection::host_components',
    'TestRendererCommittedFiberTreeInspection::host_texts',
    'TestRendererCommittedFiberTreeInspection::fiber_tag_order',
    'TestRendererCommittedFiberTreeInspection::host_root',
    'TestRendererCommittedFiberTreeInspection::host_component',
    'TestRendererCommittedFiberTreeInspection::host_text',
    'TestRendererRoot::describe_private_json_serialization_for_canary',
    'TestRendererRoot::describe_private_tree_metadata_for_canary',
    'TestRendererRoot::describe_private_tree_metadata_after_update_for_canary',
    'TestRendererRoot::describe_private_tree_committed_fiber_inspection_for_canary',
    'TestRendererPrivateJsonSerializationReport',
    'TestRendererPrivateTreeMetadataReport',
    'TestRendererPrivateTreeCommittedFiberInspectionReport',
    'TestRendererPrivateTreeFunctionComponentDiagnostic'
  ]),
  acceptedRustTests: Object.freeze([
    'committed_fiber_inspection_describes_host_root_component_and_text',
    'committed_fiber_inspection_describes_multi_child_host_root_shape',
    'committed_fiber_inspection_describes_function_component_above_host_shape',
    'committed_fiber_inspection_describes_function_component_above_multi_child_shape',
    'root_private_json_serialization_canary_describes_minimal_host_component_with_text',
    'root_private_tree_metadata_canary_describes_minimal_host_component_with_text',
    'root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit',
    'root_private_tree_metadata_canary_describes_function_component_above_host_output',
    'root_private_tree_committed_fiber_inspection_records_minimal_shape_privately'
  ]),
  multiChildAcceptedWorker:
    'worker-485-test-renderer-totree-multichild-gate',
  multiChildAcceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_to_tree_host_shape_from_snapshot_for_diagnostics',
    'TestRendererRoot::describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics',
    'TestRendererCommittedFiberTreeInspection::host_child_tags',
    'TestRendererCommittedFiberTreeInspection::has_function_component_wrapper',
    'TestRendererPrivateTreeRenderedRoot',
    'TestRendererPrivateTreeRenderedHostComponent',
    'TestRendererPrivateTreeRenderedFunctionComponent'
  ]),
  multiChildAcceptedRustTests: Object.freeze([
    'root_private_to_tree_shape_diagnostics_serialize_multiple_host_children_and_text_siblings',
    'root_private_to_tree_shape_diagnostics_wrap_composite_above_multi_child_host_output'
  ]),
  blockedPublicSurfaces: Object.freeze([
    'create().toTree',
    'create().toJSON',
    'create().root',
    'ReactTestInstance',
    'public-js-react-test-renderer-routing',
    'compatibility-claim'
  ]),
  missingPrerequisites: Object.freeze([
    'rust-native-test-renderer-create-bridge',
    'public-react-test-renderer-totree-bridge',
    'public-test-instance-and-totree-serialization-contract'
  ])
});
const toTreePrivateFacadeGate = Object.freeze({
  id: 'react-test-renderer-totree-private-facade-gate',
  publicSurface: 'create().toTree',
  status: 'ready-for-private-diagnostics-public-totree-blocked',
  deterministic: true,
  privateFacadeGateAvailable: true,
  privateTreeMetadataSerializable: true,
  privateCompositeFunctionMetadataSerializable: true,
  privateMultiChildTreeMetadataSerializable: true,
  privateNativeExecutionEvidenceAvailable: true,
  privateNativeExecutionDiagnosticName:
    privateToTreeNativeExecutionDiagnosticName,
  privateNativeExecutionStatus: privateToTreeNativeExecutionStatus,
  privateFinishedWorkIdentityGateAvailable: true,
  privateUpdateFinishedWorkIdentityGateAvailable: true,
  validatesUpdateRootRequestIdentity: true,
  updateNativeExecutionFinishedWorkIdentityAdmissionWorker:
    'worker-726-test-renderer-update-native-serialization-identity-admission',
  updateNativeExecutionRequiresFinishedWorkIdentity: true,
  rejectsStaleUpdateFinishedWorkIdentity: true,
  rejectsMultichildUpdateNativeExecutionIdentityAdmission: true,
  privateFinishedWorkIdentityDiagnosticName:
    privateSerializationFinishedWorkIdentityDiagnosticName,
  privateFinishedWorkIdentityStatus:
    privateSerializationFinishedWorkIdentityStatus,
  consumesCommittedHostRootFinishedWorkIdentity: true,
  consumesCommittedHostRootFinishedWorkLanes: true,
  privateNativeExecutionFunctionComponentShapeAvailable: true,
  nativeExecutionCompositeAcceptedFiberShape:
    privateToTreeCompositeAcceptedFiberShape,
  acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
  acceptedNativeExecutionOperations:
    privateToJSONNativeExecutionAcceptedOperations,
  consumesAcceptedNativeCreateUpdateUnmountExecutionRecords: true,
  privateFacadeSymbol: privateToTreeFacadeSymbol.description,
  privateFacadeStatus: privateToTreeFacadeStatus,
  acceptedRustPrivateTreeMetadata: true,
  acceptedRustPrivateCompositeTreeMetadata: true,
  acceptedRustDiagnosticName: privateToTreeAcceptedDiagnosticName,
  acceptedMinimalFiberShape: privateToTreeAcceptedFiberShape,
  acceptedCompositeFiberShape: privateToTreeCompositeAcceptedFiberShape,
  acceptedHostOutputUpdateKinds: Object.freeze([
    'Create',
    'Update',
    'Unmount'
  ]),
  hostOutputSnapshotFreshnessRequired: true,
  staleSnapshotRejection: true,
  publicTreeAvailable: false,
  publicRouteAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false,
  acceptedWorker: 'worker-392-test-renderer-public-totree-private-facade',
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_tree_metadata_for_canary',
    'TestRendererRoot::describe_private_tree_metadata_after_update_for_canary',
    'TestRendererRoot::describe_private_to_tree_after_create_native_execution_for_canary',
    'TestRendererRoot::describe_private_to_tree_after_update_native_execution_for_canary',
    'TestRendererRoot::describe_private_to_tree_after_unmount_native_execution_for_canary',
    'TestRendererRoot::describe_private_to_tree_finished_work_identity_gate_for_canary',
    'TestRendererPrivateTreeMetadataReport',
    'TestRendererPrivateToTreeNativeExecutionEvidence',
    'TestRendererPrivateSerializationFinishedWorkIdentityGate',
    'TestRendererPrivateTreeFunctionComponentDiagnostic',
    'TestRendererPrivateTreeHostComponentDiagnostic',
    'TestRendererPrivateTreeHostTextDiagnostic'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_tree_metadata_canary_describes_minimal_host_component_with_text',
    'root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit',
    'root_private_tree_metadata_canary_describes_function_component_above_host_output',
    'root_private_to_tree_native_execution_evidence_consumes_create_update_unmount_records',
    'root_private_to_tree_update_native_execution_requires_finished_work_identity_gate',
    'root_private_to_tree_native_execution_evidence_records_composite_host_shape',
    'root_private_to_tree_serialization_finished_work_identity_gate_accepts_committed_handoff',
    'root_private_to_tree_update_serialization_finished_work_identity_gate_accepts_committed_handoff',
    'root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence',
    'root_private_tree_metadata_canary_rejects_stale_host_output_snapshot'
  ]),
  nativeExecutionEvidenceWorker:
    'worker-667-test-renderer-totree-native-execution',
  nativeExecutionCompositeWorker:
    'worker-698-test-renderer-totree-composite-native-execution',
  multiChildAcceptedWorker:
    'worker-485-test-renderer-totree-multichild-gate',
  multiChildAcceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_to_tree_host_shape_from_snapshot_for_diagnostics',
    'TestRendererRoot::describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics',
    'TestRendererCommittedFiberTreeInspection::host_child_tags',
    'TestRendererCommittedFiberTreeInspection::has_function_component_wrapper',
    'TestRendererPrivateTreeRenderedRoot',
    'TestRendererPrivateTreeRenderedHostComponent',
    'TestRendererPrivateTreeRenderedFunctionComponent'
  ]),
  multiChildAcceptedRustTests: Object.freeze([
    'root_private_to_tree_shape_diagnostics_serialize_multiple_host_children_and_text_siblings',
    'root_private_to_tree_shape_diagnostics_wrap_composite_above_multi_child_host_output'
  ]),
  blockedPublicSurfaces: Object.freeze([
    'create().toTree',
    'create().toJSON',
    'create().root',
    'ReactTestInstance',
    'public-js-react-test-renderer-routing',
    'compatibility-claim'
  ]),
  missingPrerequisites: Object.freeze([
    'rust-native-test-renderer-create-bridge',
    'public-react-test-renderer-totree-bridge',
    'public-test-instance-and-totree-serialization-contract'
  ])
});
const getInstancePrivateClassRootGate = Object.freeze({
  id: 'react-test-renderer-get-instance-private-class-root-gate',
  publicSurface: 'create().getInstance',
  status: 'ready-for-private-diagnostics-public-getinstance-blocked',
  deterministic: true,
  privateClassRootDiagnosticsAvailable: true,
  privateDiagnosticsSymbol: privateGetInstanceDiagnosticsSymbol.description,
  privateDiagnosticsStatus: privateGetInstanceDiagnosticsStatus,
  acceptedReactSourceAlgorithm: 'ReactFiberReconciler.getPublicRootInstance',
  classComponentBehavior:
    'returns the root child ClassComponent stateNode as the public instance',
  functionComponentBehavior:
    'keeps FunctionComponent root getInstance fail-closed with a null React result and blocked Fast React public route',
  hostComponentBehavior:
    'keeps HostComponent root getInstance fail-closed; createNodeMock public instance routing is still blocked',
  acceptedClassRootFiberShape: privateGetInstanceAcceptedClassFiberShape,
  acceptedHostRootFiberShape: privateGetInstanceHostRootFiberShape,
  acceptedFunctionRootFiberShape: privateGetInstanceFunctionRootFiberShape,
  acceptedRustPrivateGetInstanceDiagnostics: true,
  acceptedRustPrivateTreeMetadata: true,
  acceptedRustDiagnosticName: privateGetInstanceAcceptedDiagnosticName,
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_get_instance_class_root_for_canary',
    'TestRendererRoot::describe_private_get_instance_class_root_after_update_for_canary',
    'TestRendererPrivateGetInstanceClassRootReport',
    'TestRendererPrivateGetInstanceClassComponentDiagnostic',
    'TestRendererPrivateGetInstanceClassInstanceDiagnostic',
    'TestRendererPrivateGetInstanceFailClosedRootDiagnostic'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_get_instance_class_root_canary_describes_class_instance_shape',
    'root_private_get_instance_class_root_canary_updates_rendered_host_child_only'
  ]),
  publicGetInstanceAvailable: false,
  publicRouteAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false,
  acceptedWorker: 'worker-464-test-renderer-get-instance-class-gate',
  blockedPublicSurfaces: Object.freeze([
    'create().getInstance',
    'create().root',
    'ReactTestInstance',
    'createNodeMock-public-instance',
    'public-js-react-test-renderer-routing',
    'compatibility-claim'
  ]),
  missingPrerequisites: Object.freeze([
    'public-class-component-rendering',
    'public-react-test-renderer-getinstance-bridge',
    'create-node-mock-public-instance-contract'
  ])
});
const privateTestInstanceWrapperRecordSymbol = Symbol.for(
  'fast.react_test_renderer.private_test_instance_wrapper_record'
);
const privateTestInstanceQueryBridgePreflightDiagnosticName =
  'fast-react-test-renderer.testinstance.query-bridge-preflight';
const privateTestInstanceQueryBridgePreflightStatus =
  'private-test-instance-query-bridge-preflight-ready-public-test-instance-blocked';
const privateTestInstanceNativeQueryExecutionDiagnosticName =
  'fast-react-test-renderer.testinstance.private-native-query-execution-evidence';
const privateTestInstanceNativeQueryExecutionStatus =
  'private-test-instance-native-create-update-execution-records-consumed-public-test-instance-blocked';
const privateTestInstanceClassQueryExecutionDiagnosticName =
  'fast-react-test-renderer.testinstance.private-class-root-query-execution-evidence';
const privateTestInstanceClassQueryExecutionStatus =
  'private-test-instance-class-root-update-query-execution-public-test-instance-blocked';
const privateTestInstanceNativeQueryExecutionRecordKind =
  'FastReactTestRendererPrivateRootExecutionResult';
const privateTestInstanceNativeQueryExecutionAcceptedOperations =
  Object.freeze(['create', 'update']);
const privateErrorBoundaryDiagnosticsSymbol = Symbol.for(
  'fast.react_test_renderer.private_error_boundary_diagnostics'
);
const privateErrorBoundaryDiagnosticsStatus =
  'private-error-boundary-diagnostics-root-options-metadata-public-boundary-blocked';
const privateErrorBoundaryDiagnosticName =
  'fast-react-test-renderer.error-boundary.private-root-options-canary';
const privateErrorBoundaryNativeExecutionDiagnosticName =
  'fast-react-test-renderer.error-boundary.private-native-execution-evidence';
const privateErrorBoundaryNativeExecutionStatus =
  'private-error-boundary-native-execution-update-failure-evidence-public-recovery-blocked';
const privateErrorBoundaryRootOptionsRustApi =
  'TestRendererRoot::describe_private_error_boundary_diagnostics_for_canary';
const privateErrorBoundaryUpdateRustApi =
  'TestRendererRoot::describe_private_error_boundary_update_diagnostics_for_canary';
const privateErrorBoundaryNativeExecutionRustApi =
  'TestRendererRoot::describe_private_error_boundary_update_native_execution_for_canary';
const privateErrorBoundaryCommitRecoveryRustApi =
  'TestRendererRoot::describe_private_error_boundary_commit_recovery_for_canary';
const privateErrorBoundaryDiagnosticPhases = Object.freeze([
  'Update',
  'Commit'
]);
const privateErrorBoundaryCommitRecoveryDiagnosticName =
  'fast-react-test-renderer.error-boundary.private-commit-recovery-evidence';
const privateErrorBoundaryCommitRecoveryStatus =
  'private-error-boundary-commit-recovery-metadata-public-recovery-blocked';
const privateErrorBoundaryCommitRecoveryPath =
  'ReactFiberWorkLoop.captureCommitPhaseError';
const privateErrorBoundaryCommitRecoveryAction =
  'createRootErrorUpdate(SyncLane)';
const privateErrorBoundaryCommitRecoveryReference =
  'ReactFiberWorkLoop.captureCommitPhaseError -> createRootErrorUpdate(SyncLane)';
const privateErrorBoundaryDiagnosticDependencyIds = Object.freeze([
  'react-test-renderer-update-private-route',
  'react-test-renderer-serialization-private-json-diagnostic',
  'react-test-renderer-test-instance-private-fiber-diagnostic',
  'react-test-renderer-act-scheduler-private-diagnostic'
]);
const privateErrorBoundaryDiagnosticRows = Object.freeze([
  Object.freeze({
    id: 'react-test-renderer-update-error-root-option-private-diagnostic',
    phase: 'Update',
    hostOutputUpdateKind: 'Update',
    rootErrorChannel: 'onUncaughtError',
    reactReference: 'ReactTestRenderer.js update -> updateContainer',
    acceptedPrivateDiagnosticDependencyIds:
      privateErrorBoundaryDiagnosticDependencyIds
  }),
  Object.freeze({
    id: 'react-test-renderer-commit-error-root-option-private-diagnostic',
    phase: 'Commit',
    hostOutputUpdateKind: 'Update',
    rootErrorChannel: 'onUncaughtError',
    reactReference: 'ReactFiberWorkLoop.captureCommitPhaseError',
    acceptedPrivateDiagnosticDependencyIds:
      privateErrorBoundaryDiagnosticDependencyIds
  })
]);
const privateErrorBoundaryDiagnosticsGate = Object.freeze({
  id: 'react-test-renderer-private-error-boundary-diagnostics-gate',
  status: privateErrorBoundaryDiagnosticsStatus,
  entrypoint,
  publicSurface: 'create()/create().update/commit',
  symbol: privateErrorBoundaryDiagnosticsSymbol.description,
  diagnosticName: privateErrorBoundaryDiagnosticName,
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustRecords: Object.freeze([
    'TestRendererPrivateErrorBoundaryDiagnostics',
    'TestRendererPrivateErrorDiagnosticRow',
    'TestRendererPrivateErrorBoundaryDependencyDiagnostics',
    'TestRendererPrivateErrorBoundaryCommitRecoveryMetadata',
    'TestRendererPrivateErrorBoundaryNativeExecutionEvidence',
    'TestRendererRootErrorOptionDiagnostics',
    'HostRootRenderFailureRecoveryCommitEvidenceForCanary',
    'HostRootCommitRecoverySnapshotForCanary'
  ]),
  acceptedRustApis: Object.freeze([
    privateErrorBoundaryRootOptionsRustApi,
    privateErrorBoundaryUpdateRustApi,
    privateErrorBoundaryNativeExecutionRustApi,
    privateErrorBoundaryCommitRecoveryRustApi
  ]),
  acceptedRustTests: Object.freeze([
    'root_options_store_error_callback_handles_without_invocation',
    'root_private_error_boundary_diagnostics_record_update_and_commit_rows_from_options',
    'root_private_error_boundary_native_execution_evidence_consumes_update_failure_path'
  ]),
  phases: privateErrorBoundaryDiagnosticPhases,
  rows: privateErrorBoundaryDiagnosticRows,
  acceptedWorker: 'worker-530-test-renderer-error-boundary-update-refresh',
  acceptedDependencyWorkers: Object.freeze([
    'worker-307-test-renderer-update-unmount-private-js-bridge',
    'worker-333-test-renderer-tojson-host-output-private-path',
    'worker-426-test-renderer-testinstance-bridge-query',
    'worker-473-test-renderer-act-passive-effect-drain',
    'worker-482-test-renderer-act-scheduler-flush-gate',
    'worker-484-test-instance-find-by-private-query-gate',
    'worker-485-test-renderer-totree-multichild-gate',
    'worker-637-test-renderer-update-native-execution',
    'worker-664-root-error-recovery-commit-execution',
    'worker-669-test-renderer-error-boundary-native-execution',
    'worker-701-test-renderer-error-boundary-commit-recovery'
  ]),
  acceptedPrivateDiagnosticDependencyIds:
    privateErrorBoundaryDiagnosticDependencyIds,
  updateRouteDiagnosticsAvailable: true,
  serializationDiagnosticsAvailable: true,
  testInstanceQueryDiagnosticsAvailable: true,
  actSchedulerMetadataAvailable: true,
  rootErrorOptionFields: Object.freeze([
    'onUncaughtError',
    'onCaughtError',
    'onRecoverableError'
  ]),
  privateRootErrorOptionMetadataAvailable: true,
  privateNativeExecutionEvidenceAvailable: true,
  nativeExecutionEvidenceDiagnosticName:
    privateErrorBoundaryNativeExecutionDiagnosticName,
  nativeExecutionEvidenceStatus: privateErrorBoundaryNativeExecutionStatus,
  commitRecoveryMetadataAvailable: true,
  commitRecoveryDiagnosticName:
    privateErrorBoundaryCommitRecoveryDiagnosticName,
  commitRecoveryStatus: privateErrorBoundaryCommitRecoveryStatus,
  commitRecoveryRustApi: privateErrorBoundaryCommitRecoveryRustApi,
  commitPhaseRecoveryPath: privateErrorBoundaryCommitRecoveryPath,
  commitPhaseRecoveryAction: privateErrorBoundaryCommitRecoveryAction,
  commitPhaseRecoveryReference:
    privateErrorBoundaryCommitRecoveryReference,
  acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
  acceptedNativeExecutionOperations: Object.freeze(['update']),
  nativeExecutionEvidenceWorker:
    'worker-669-test-renderer-error-boundary-native-execution',
  commitRecoveryEvidenceWorker:
    'worker-701-test-renderer-error-boundary-commit-recovery',
  consumesAcceptedRootExecutionDiagnostics: true,
  consumesAcceptedRustUpdateMetadata: true,
  consumesAcceptedRustFailureMetadata: true,
  consumesAcceptedCommitRecoveryMetadata: true,
  publicErrorBoundaryBehaviorAvailable: false,
  publicErrorBoundaryBehaviorExposed: false,
  publicErrorRecoveryAvailable: false,
  publicRootErrorCallbacksInvoked: false,
  publicRendererRootsExecuted: false,
  publicLifecycleMethodsExecuted: false,
  errorBoundaryRecoveryExecuted: false,
  compatibilityClaimed: false
});
const privateTestInstanceEmptyProps = Object.freeze({});
const privateTestInstanceHostRootProps = null;
const privateTestInstanceRootTextChildRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-root-host-text-child',
  kind: 'ReactTestInstancePrivateTextChildRecord',
  fiberTag: 'HostText',
  source: 'TestRendererCommittedFiberTreeInspection::host_text',
  text: 'first sibling',
  publicObject: false
});
const privateTestInstanceNestedTextChildRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-nested-host-text-child',
  kind: 'ReactTestInstancePrivateTextChildRecord',
  fiberTag: 'HostText',
  source: 'TestRendererCommittedFiberTreeInspection::host_text',
  text: 'second sibling',
  publicObject: false
});
const privateTestInstanceHostComponentType = 'span';
const privateTestInstanceHostComponentChildren = Object.freeze([
  privateTestInstanceNestedTextChildRecord
]);
const privateTestInstanceHostRootInspectionRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-inspection-host-root',
  kind: 'TestRendererCommittedFiberNodeInspection',
  source: 'TestRendererCommittedFiberTreeInspection::host_root',
  fiberTag: 'HostRoot',
  index: 0,
  parentRecord: null,
  childRecord:
    'react-test-renderer-private-test-instance-inspection-root-host-text',
  childRecords: Object.freeze([
    'react-test-renderer-private-test-instance-inspection-root-host-text',
    'react-test-renderer-private-test-instance-inspection-host-component'
  ]),
  siblingRecord: null,
  path: Object.freeze(['HostRoot']),
  wrapperEligible: true,
  wrapperEligibilityReason:
    'ReactTestRenderer.js materializes HostRoot when root has multiple children',
  queryCandidate: true,
  rootChildCount: 2,
  publicObject: false
});
const privateTestInstanceRootTextInspectionRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-inspection-root-host-text',
  kind: 'TestRendererCommittedFiberNodeInspection',
  source: 'TestRendererCommittedFiberTreeInspection::host_text',
  fiberTag: 'HostText',
  index: 0,
  parentRecord:
    'react-test-renderer-private-test-instance-inspection-host-root',
  childRecord: null,
  siblingRecord:
    'react-test-renderer-private-test-instance-inspection-host-component',
  path: Object.freeze(['HostRoot', 'HostText[0]']),
  wrapperEligible: false,
  queryCandidate: false,
  text: privateTestInstanceRootTextChildRecord.text,
  skippedByQueryTraversal: true,
  publicObject: false
});
const privateTestInstanceHostComponentInspectionRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-inspection-host-component',
  kind: 'TestRendererCommittedFiberNodeInspection',
  source: 'TestRendererCommittedFiberTreeInspection::host_component',
  fiberTag: 'HostComponent',
  index: 1,
  parentRecord:
    'react-test-renderer-private-test-instance-inspection-host-root',
  childRecord: 'react-test-renderer-private-test-instance-inspection-host-text',
  siblingRecord: null,
  path: Object.freeze(['HostRoot', 'HostComponent[1]']),
  wrapperEligible: true,
  queryCandidate: true,
  elementTypeSource:
    'TestRendererCommittedFiberNodeInspection::element_type',
  propsSource: 'TestRendererCommittedFiberNodeInspection::memoized_props',
  type: privateTestInstanceHostComponentType,
  props: privateTestInstanceEmptyProps,
  publicObject: false
});
const privateTestInstanceHostTextInspectionRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-inspection-host-text',
  kind: 'TestRendererCommittedFiberNodeInspection',
  source: 'TestRendererCommittedFiberTreeInspection::host_text',
  fiberTag: 'HostText',
  index: 0,
  parentRecord:
    'react-test-renderer-private-test-instance-inspection-host-component',
  childRecord: null,
  siblingRecord: null,
  path: Object.freeze(['HostRoot', 'HostComponent[1]', 'HostText']),
  wrapperEligible: false,
  queryCandidate: false,
  text: privateTestInstanceNestedTextChildRecord.text,
  skippedByQueryTraversal: true,
  publicObject: false
});
const privateTestInstanceAcceptedInspectionRecords = Object.freeze([
  privateTestInstanceHostRootInspectionRecord,
  privateTestInstanceRootTextInspectionRecord,
  privateTestInstanceHostComponentInspectionRecord,
  privateTestInstanceHostTextInspectionRecord
]);
const privateTestInstanceQueryPath = Object.freeze([
  privateTestInstanceHostRootInspectionRecord,
  privateTestInstanceHostComponentInspectionRecord
]);
const privateTestInstanceHostComponentQueryPath = Object.freeze([
  privateTestInstanceHostComponentInspectionRecord
]);
const privateTestInstanceSkippedQueryRecords = Object.freeze([
  privateTestInstanceRootTextInspectionRecord,
  privateTestInstanceHostTextInspectionRecord
]);
const privateTestInstanceMultiChildHostTreeMetadata = Object.freeze({
  id: 'react-test-renderer-private-test-instance-multi-child-host-tree',
  status: 'private-multi-child-query-metadata-ready-public-root-blocked',
  acceptedWorker: 'worker-350-root-work-loop-complete-work-multiple-child-handoff',
  acceptedRustModule: 'host_work/root_work_loop',
  acceptedRustApis: Object.freeze([
    'mount_test_host_sibling_work',
    'handoff_completed_host_root_render_to_test_complete_work_for_siblings'
  ]),
  acceptedRustTests: Object.freeze([
    'host_work_mounts_multiple_host_root_siblings_under_host_root_wip',
    'root_work_loop_hands_multiple_host_siblings_to_test_complete_work',
    'root_work_loop_multiple_sibling_handoff_preserves_fragment_portal_suspense_blockers'
  ]),
  rootChildCount: 2,
  completedChildCount: 2,
  queryCandidateCount: privateTestInstanceQueryPath.length,
  skippedTextRecordCount: privateTestInstanceSkippedQueryRecords.length,
  rootWrapperMaterializedForPrivateMetadata: true,
  publicRootAccessAvailable: false,
  publicTestInstanceObjectAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceQueryTraversalMetadata = Object.freeze({
  id: 'react-test-renderer-private-test-instance-query-traversal-metadata',
  source: 'ReactTestRenderer.js ReactTestInstance.findAll',
  traversalOrder: 'self-then-descendants',
  rootChildCount: privateTestInstanceMultiChildHostTreeMetadata.rootChildCount,
  rootCandidateCount: privateTestInstanceQueryPath.length,
  acceptedCandidateCount: privateTestInstanceQueryPath.length,
  skippedTextChildCount: privateTestInstanceSkippedQueryRecords.length,
  textChildrenSkipped: true,
  rootWrapperMaterializedForPrivateMetadata: true,
  multiChildHostTree: privateTestInstanceMultiChildHostTreeMetadata,
  publicQueryMethodsAvailable: false,
  predicateExecution: false,
  nativeBridgeAvailable: false,
  nativeExecution: false
});
const privateTestInstanceFiberInspectionMetadata = Object.freeze({
  acceptedWorker: 'worker-235-test-renderer-private-fiber-inspection',
  acceptedRustCrate: 'fast-react-reconciler',
  acceptedRustModule: 'private_fiber_inspection',
  acceptedRustApis: Object.freeze([
    'inspect_test_renderer_committed_fiber_tree',
    'TestRendererCommittedFiberTreeInspection::host_root',
    'TestRendererCommittedFiberTreeInspection::host_component',
    'TestRendererCommittedFiberTreeInspection::host_text',
    'TestRendererCommittedFiberNodeInspection::element_type',
    'TestRendererCommittedFiberNodeInspection::memoized_props'
  ]),
  acceptedRustTests: Object.freeze([
    'committed_fiber_inspection_describes_host_root_component_and_text',
    'committed_fiber_inspection_rejects_empty_current_host_root'
  ]),
  committedShape: Object.freeze(['HostRoot', 'HostComponent', 'HostText']),
  privateQueryShape: Object.freeze([
    'HostRoot',
    'HostText',
    'HostComponent',
    'HostText'
  ]),
  multiChildHostTree: privateTestInstanceMultiChildHostTreeMetadata,
  exposesHostNodes: false,
  mutatesFibers: false
});
const privateTestInstanceHostRootTypeQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-host-root-type-query',
  query: 'type',
  source: 'TestRendererCommittedFiberNodeInspection::element_type',
  fiberTag: 'HostRoot',
  value: null,
  deterministic: true,
  publicQueryMethodAvailable: false
});
const privateTestInstanceHostRootPropsQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-host-root-props-query',
  query: 'props',
  source: 'TestRendererCommittedFiberNodeInspection::memoized_props',
  fiberTag: 'HostRoot',
  value: privateTestInstanceHostRootProps,
  deterministic: true,
  publicQueryMethodAvailable: false
});
const privateTestInstanceHostComponentTypeQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-type-query',
  query: 'type',
  source: 'TestRendererCommittedFiberNodeInspection::element_type',
  fiberTag: 'HostComponent',
  value: privateTestInstanceHostComponentType,
  deterministic: true,
  publicQueryMethodAvailable: false
});
const privateTestInstanceHostComponentPropsQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-props-query',
  query: 'props',
  source: 'TestRendererCommittedFiberNodeInspection::memoized_props',
  fiberTag: 'HostComponent',
  value: privateTestInstanceEmptyProps,
  deterministic: true,
  publicQueryMethodAvailable: false
});
const privateTestInstanceHostComponentChildrenQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-children-query',
  query: 'children',
  source: 'TestRendererCommittedFiberTreeInspection::host_text',
  fiberTag: 'HostComponent',
  value: privateTestInstanceHostComponentChildren,
  deterministic: true,
  publicQueryMethodAvailable: false
});
const privateTestInstanceHostComponentRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-host-component-record',
  kind: 'ReactTestInstancePrivateRecord',
  source: 'TestRendererCommittedFiberTreeInspection::host_component',
  fiberTag: 'HostComponent',
  inspectionRecord: privateTestInstanceHostComponentInspectionRecord,
  publicObject: false,
  type: privateTestInstanceHostComponentTypeQueryRecord.value,
  props: privateTestInstanceHostComponentPropsQueryRecord.value,
  children: privateTestInstanceHostComponentChildrenQueryRecord.value,
  queryRecords: Object.freeze({
    type: privateTestInstanceHostComponentTypeQueryRecord,
    props: privateTestInstanceHostComponentPropsQueryRecord,
    children: privateTestInstanceHostComponentChildrenQueryRecord
  })
});
const privateTestInstanceHostRootChildren = Object.freeze([
  privateTestInstanceRootTextChildRecord,
  privateTestInstanceHostComponentRecord
]);
const privateTestInstanceHostRootChildrenQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-host-root-children-query',
  query: 'children',
  source: 'ReactTestRenderer.js getChildren(HostRoot)',
  fiberTag: 'HostRoot',
  value: privateTestInstanceHostRootChildren,
  deterministic: true,
  publicQueryMethodAvailable: false
});
const privateTestInstanceRootRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-root-record',
  kind: 'ReactTestInstancePrivateRecord',
  source: 'ReactTestRenderer.js create().root multi-child HostRoot branch',
  fiberTag: 'HostRoot',
  inspectionRecord: privateTestInstanceHostRootInspectionRecord,
  publicObject: false,
  type: privateTestInstanceHostRootTypeQueryRecord.value,
  props: privateTestInstanceHostRootPropsQueryRecord.value,
  children: privateTestInstanceHostRootChildrenQueryRecord.value,
  queryRecords: Object.freeze({
    type: privateTestInstanceHostRootTypeQueryRecord,
    props: privateTestInstanceHostRootPropsQueryRecord,
    children: privateTestInstanceHostRootChildrenQueryRecord
  })
});
const privateTestInstanceFindAllTypePredicateRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-all-type-predicate',
  kind: 'ReactTestInstancePrivateFindAllPredicateMetadata',
  predicateKind: 'type',
  source: 'ReactTestRenderer.js ReactTestInstance.findAllByType',
  predicateSource: 'node => node.type === type',
  criteria: Object.freeze({
    kind: 'type',
    value: privateTestInstanceHostComponentTypeQueryRecord.value
  }),
  evaluatedCandidateRecords: privateTestInstanceQueryPath,
  matchedCandidateRecords: privateTestInstanceHostComponentQueryPath,
  rejectedCandidateRecords: Object.freeze([
    privateTestInstanceHostRootInspectionRecord
  ]),
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  expectedCanaryMatchCount: privateTestInstanceHostComponentQueryPath.length,
  predicateExecution: false,
  deterministic: true,
  publicQueryMethodAvailable: false,
  publicPredicateExecutionAvailable: false
});
const privateTestInstanceFindAllPropsPredicateRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-all-props-predicate',
  kind: 'ReactTestInstancePrivateFindAllPredicateMetadata',
  predicateKind: 'props',
  source: 'ReactTestRenderer.js ReactTestInstance.findAllByProps',
  predicateSource: 'node => node.props && propsMatch(node.props, props)',
  criteria: Object.freeze({
    kind: 'props',
    value: privateTestInstanceHostComponentPropsQueryRecord.value
  }),
  evaluatedCandidateRecords: privateTestInstanceQueryPath,
  matchedCandidateRecords: privateTestInstanceHostComponentQueryPath,
  rejectedCandidateRecords: Object.freeze([
    privateTestInstanceHostRootInspectionRecord
  ]),
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  expectedCanaryMatchCount: privateTestInstanceHostComponentQueryPath.length,
  predicateExecution: false,
  deterministic: true,
  publicQueryMethodAvailable: false,
  publicPredicateExecutionAvailable: false
});
const privateTestInstanceFindAllPredicateLikeRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-all-predicate-like',
  kind: 'ReactTestInstancePrivateFindAllPredicateMetadata',
  predicateKind: 'predicate-like',
  source: 'ReactTestRenderer.js ReactTestInstance.findAll',
  predicateSource:
    'metadata-only predicate matching accepted type and props diagnostics',
  criteria: Object.freeze({
    kind: 'predicate-like',
    type: privateTestInstanceHostComponentTypeQueryRecord.value,
    props: privateTestInstanceHostComponentPropsQueryRecord.value
  }),
  evaluatedCandidateRecords: privateTestInstanceQueryPath,
  matchedCandidateRecords: privateTestInstanceHostComponentQueryPath,
  rejectedCandidateRecords: Object.freeze([
    privateTestInstanceHostRootInspectionRecord
  ]),
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  expectedCanaryMatchCount: privateTestInstanceHostComponentQueryPath.length,
  predicateExecution: false,
  deterministic: true,
  publicQueryMethodAvailable: false,
  publicPredicateExecutionAvailable: false
});
const privateTestInstanceFindAllPredicateDiagnostics = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-all-query-diagnostics',
  diagnosticName: 'fast-react-test-renderer.testinstance.find-all-private-query',
  status: 'private-findall-query-diagnostics-ready-public-method-blocked',
  acceptedWorker: 'worker-463-test-renderer-find-all-private-query',
  acceptedRustDiagnosticName:
    'fast-react-test-renderer.testinstance.find-all-private-query',
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_test_instance_find_all_query_for_canary',
    'TestRendererRoot::describe_private_test_instance_find_all_query_after_update_for_canary',
    'TestRendererPrivateTestInstanceFindAllQueryDiagnostics',
    'TestRendererPrivateTestInstanceFindAllPredicateDiagnostic'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_test_instance_find_all_query_diagnostics_describe_type_props_and_predicate_metadata',
    'root_private_test_instance_find_all_query_diagnostics_follow_update_host_output'
  ]),
  source: 'ReactTestRenderer.js findAll(root, predicate, options)',
  acceptedReactSourceAlgorithm: 'ReactTestRenderer.js findAll',
  traversalOrder: 'self-then-descendants',
  defaultDeep: true,
  effectiveDeep: true,
  predicateKinds: Object.freeze(['type', 'props', 'predicate-like']),
  predicateExecution: false,
  candidateRecords: privateTestInstanceQueryPath,
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  typePredicate: privateTestInstanceFindAllTypePredicateRecord,
  propsPredicate: privateTestInstanceFindAllPropsPredicateRecord,
  predicateLike: privateTestInstanceFindAllPredicateLikeRecord,
  publicQueryMethodAvailable: false,
  publicTestInstanceObjectAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceFindAllQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-all-query',
  query: 'findAll',
  publicSurface: 'ReactTestInstance.findAll',
  status: 'private-query-metadata-ready-public-method-blocked',
  source: 'ReactTestRenderer.js findAll(root, predicate, options)',
  deterministic: true,
  resultKind: 'array',
  defaultDeep: true,
  effectiveDeep: true,
  predicateExecution: false,
  expectedCanaryMatchCount: privateTestInstanceQueryPath.length,
  candidateRecords: privateTestInstanceQueryPath,
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  predicateDiagnostics: privateTestInstanceFindAllPredicateDiagnostics,
  multiChildHostTree: privateTestInstanceMultiChildHostTreeMetadata,
  publicQueryMethodAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceFindQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-query',
  query: 'find',
  publicSurface: 'ReactTestInstance.find',
  status: 'private-query-metadata-ready-public-method-blocked',
  source: 'ReactTestRenderer.js ReactTestInstance.find',
  deterministic: true,
  resultKind: 'single',
  basedOn: privateTestInstanceFindAllQueryRecord.id,
  expectOne: true,
  effectiveDeep: false,
  predicateExecution: false,
  expectedCanaryMatchCount: privateTestInstanceQueryPath.length,
  candidateRecords: privateTestInstanceQueryPath,
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  multiChildHostTree: privateTestInstanceMultiChildHostTreeMetadata,
  publicQueryMethodAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceFindAllByTypeQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-all-by-type-query',
  query: 'findAllByType',
  publicSurface: 'ReactTestInstance.findAllByType',
  status: 'private-query-metadata-ready-public-method-blocked',
  source: 'ReactTestRenderer.js ReactTestInstance.findAllByType',
  deterministic: true,
  resultKind: 'array',
  defaultDeep: true,
  effectiveDeep: true,
  criteria: Object.freeze({
    kind: 'type',
    value: privateTestInstanceHostComponentTypeQueryRecord.value
  }),
  expectedCanaryMatchCount: privateTestInstanceHostComponentQueryPath.length,
  candidateRecords: privateTestInstanceHostComponentQueryPath,
  traversedCandidateRecords: privateTestInstanceQueryPath,
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  multiChildHostTree: privateTestInstanceMultiChildHostTreeMetadata,
  publicQueryMethodAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceFindByTypeQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-by-type-query',
  query: 'findByType',
  publicSurface: 'ReactTestInstance.findByType',
  status: 'private-query-metadata-ready-public-method-blocked',
  source: 'ReactTestRenderer.js ReactTestInstance.findByType',
  deterministic: true,
  resultKind: 'single',
  basedOn: privateTestInstanceFindAllByTypeQueryRecord.id,
  expectOne: true,
  effectiveDeep: false,
  criteria: privateTestInstanceFindAllByTypeQueryRecord.criteria,
  expectedCanaryMatchCount: privateTestInstanceHostComponentQueryPath.length,
  candidateRecords: privateTestInstanceHostComponentQueryPath,
  traversedCandidateRecords: privateTestInstanceQueryPath,
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  multiChildHostTree: privateTestInstanceMultiChildHostTreeMetadata,
  publicQueryMethodAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceFindAllByPropsQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-all-by-props-query',
  query: 'findAllByProps',
  publicSurface: 'ReactTestInstance.findAllByProps',
  status: 'private-query-metadata-ready-public-method-blocked',
  source: 'ReactTestRenderer.js ReactTestInstance.findAllByProps',
  deterministic: true,
  resultKind: 'array',
  defaultDeep: true,
  effectiveDeep: true,
  criteria: Object.freeze({
    kind: 'props',
    value: privateTestInstanceHostComponentPropsQueryRecord.value
  }),
  expectedCanaryMatchCount: privateTestInstanceHostComponentQueryPath.length,
  candidateRecords: privateTestInstanceHostComponentQueryPath,
  traversedCandidateRecords: privateTestInstanceQueryPath,
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  multiChildHostTree: privateTestInstanceMultiChildHostTreeMetadata,
  publicQueryMethodAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceFindByPropsQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-by-props-query',
  query: 'findByProps',
  publicSurface: 'ReactTestInstance.findByProps',
  status: 'private-query-metadata-ready-public-method-blocked',
  source: 'ReactTestRenderer.js ReactTestInstance.findByProps',
  deterministic: true,
  resultKind: 'single',
  basedOn: privateTestInstanceFindAllByPropsQueryRecord.id,
  expectOne: true,
  effectiveDeep: false,
  criteria: privateTestInstanceFindAllByPropsQueryRecord.criteria,
  expectedCanaryMatchCount: privateTestInstanceHostComponentQueryPath.length,
  candidateRecords: privateTestInstanceHostComponentQueryPath,
  traversedCandidateRecords: privateTestInstanceQueryPath,
  skippedRecords: privateTestInstanceSkippedQueryRecords,
  multiChildHostTree: privateTestInstanceMultiChildHostTreeMetadata,
  publicQueryMethodAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceFindByTypeResultDiagnostics = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-by-type-query-diagnostics',
  kind: 'ReactTestInstancePrivateFindByQueryMetadata',
  query: 'findByType',
  publicSurface: 'ReactTestInstance.findByType',
  status: 'private-findby-query-diagnostics-ready-public-method-blocked',
  source: 'ReactTestRenderer.js ReactTestInstance.findByType',
  basedOnFindAllRecord: privateTestInstanceFindAllByTypeQueryRecord,
  basedOnFindAllPredicate:
    privateTestInstanceFindAllPredicateDiagnostics.typePredicate,
  expectOneSource: 'ReactTestRenderer.js expectOne',
  expectOneMessage: 'with node type: "span"',
  zeroMatchErrorPrefix: 'No instances found ',
  duplicateMatchErrorPrefix: 'Expected 1 but found N instances ',
  criteria: privateTestInstanceFindAllByTypeQueryRecord.criteria,
  resultKind: 'single',
  effectiveDeep: false,
  expectOne: true,
  expectedCanaryMatchCount:
    privateTestInstanceFindAllByTypeQueryRecord.expectedCanaryMatchCount,
  candidateRecords: privateTestInstanceFindAllByTypeQueryRecord.candidateRecords,
  traversedCandidateRecords:
    privateTestInstanceFindAllByTypeQueryRecord.traversedCandidateRecords,
  skippedRecords: privateTestInstanceFindAllByTypeQueryRecord.skippedRecords,
  predicateExecution: false,
  deterministic: true,
  publicQueryMethodAvailable: false,
  publicTestInstanceObjectAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceFindByPropsResultDiagnostics = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-by-props-query-diagnostics',
  kind: 'ReactTestInstancePrivateFindByQueryMetadata',
  query: 'findByProps',
  publicSurface: 'ReactTestInstance.findByProps',
  status: 'private-findby-query-diagnostics-ready-public-method-blocked',
  source: 'ReactTestRenderer.js ReactTestInstance.findByProps',
  basedOnFindAllRecord: privateTestInstanceFindAllByPropsQueryRecord,
  basedOnFindAllPredicate:
    privateTestInstanceFindAllPredicateDiagnostics.propsPredicate,
  expectOneSource: 'ReactTestRenderer.js expectOne',
  expectOneMessage: 'with props: {}',
  zeroMatchErrorPrefix: 'No instances found ',
  duplicateMatchErrorPrefix: 'Expected 1 but found N instances ',
  criteria: privateTestInstanceFindAllByPropsQueryRecord.criteria,
  resultKind: 'single',
  effectiveDeep: false,
  expectOne: true,
  expectedCanaryMatchCount:
    privateTestInstanceFindAllByPropsQueryRecord.expectedCanaryMatchCount,
  candidateRecords: privateTestInstanceFindAllByPropsQueryRecord.candidateRecords,
  traversedCandidateRecords:
    privateTestInstanceFindAllByPropsQueryRecord.traversedCandidateRecords,
  skippedRecords: privateTestInstanceFindAllByPropsQueryRecord.skippedRecords,
  predicateExecution: false,
  deterministic: true,
  publicQueryMethodAvailable: false,
  publicTestInstanceObjectAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceFindByQueryDiagnostics = Object.freeze({
  id: 'react-test-renderer-private-test-instance-find-by-query-diagnostics',
  diagnosticName: 'fast-react-test-renderer.testinstance.find-by-private-query',
  status: 'private-findby-query-diagnostics-ready-public-method-blocked',
  acceptedWorker: 'worker-484-test-instance-find-by-private-query-gate',
  acceptedRustDiagnosticName:
    'fast-react-test-renderer.testinstance.find-by-private-query',
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_test_instance_find_by_query_for_canary',
    'TestRendererRoot::describe_private_test_instance_find_by_query_after_update_for_canary',
    'TestRendererPrivateTestInstanceFindByQueryDiagnostics',
    'TestRendererPrivateTestInstanceFindByResultDiagnostic'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_test_instance_find_by_query_diagnostics_build_on_find_all_metadata',
    'root_private_test_instance_find_by_query_diagnostics_follow_update_host_output'
  ]),
  source: 'ReactTestRenderer.js ReactTestInstance.findByType/findByProps',
  acceptedReactSourceAlgorithm:
    'ReactTestRenderer.js expectOne(findAllBy*, {deep: false})',
  findAllDiagnosticName:
    privateTestInstanceFindAllPredicateDiagnostics.diagnosticName,
  basedOnFindAllPredicateDiagnostics:
    privateTestInstanceFindAllPredicateDiagnostics,
  queries: Object.freeze(['findByType', 'findByProps']),
  effectiveDeep: false,
  expectOne: true,
  predicateExecution: false,
  typeQuery: privateTestInstanceFindByTypeResultDiagnostics,
  propsQuery: privateTestInstanceFindByPropsResultDiagnostics,
  publicQueryMethodAvailable: false,
  publicTestInstanceObjectAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});
const privateTestInstanceQueryBridgePreflightGate = Object.freeze({
  id: 'react-test-renderer-private-test-instance-query-bridge-preflight-gate',
  diagnosticName: privateTestInstanceQueryBridgePreflightDiagnosticName,
  status: privateTestInstanceQueryBridgePreflightStatus,
  publicSurface: 'create().root/ReactTestInstance.find*',
  acceptedWorker: 'worker-515-test-renderer-live-query-bridge-preflight',
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustDiagnosticName:
    privateTestInstanceQueryBridgePreflightDiagnosticName,
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_test_instance_query_bridge_preflight_for_canary',
    'TestRendererRoot::describe_private_test_instance_query_bridge_preflight_after_update_for_canary',
    'TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_test_instance_query_bridge_preflight_ties_find_all_and_find_by_records',
    'root_private_test_instance_query_bridge_preflight_follows_update_records'
  ]),
  bridgeSource:
    'FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery',
  wrapperRecordSymbol: privateTestInstanceWrapperRecordSymbol.description,
  sourceFindAllDiagnosticName:
    privateTestInstanceFindAllPredicateDiagnostics.diagnosticName,
  sourceFindByDiagnosticName:
    privateTestInstanceFindByQueryDiagnostics.diagnosticName,
  consumesAcceptedRustFindAllDiagnostics: true,
  consumesAcceptedRustFindByDiagnostics: true,
  recordOnlyDiagnosticConsumption: true,
  publicRootAvailable: false,
  publicQueryMethodsAvailable: false,
  publicTestInstanceObjectAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  compatibilityClaimed: false
});
const privateTestInstanceNativeQueryExecutionGate = Object.freeze({
  id: 'react-test-renderer-private-test-instance-native-query-execution-gate',
  diagnosticName: privateTestInstanceNativeQueryExecutionDiagnosticName,
  status: privateTestInstanceNativeQueryExecutionStatus,
  publicSurface: 'create().root/ReactTestInstance.findByType',
  acceptedWorker: 'worker-668-test-renderer-testinstance-native-query-execution',
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustDiagnosticName:
    privateTestInstanceNativeQueryExecutionDiagnosticName,
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_test_instance_query_after_create_native_execution_for_canary',
    'TestRendererRoot::describe_private_test_instance_query_after_update_native_execution_for_canary',
    'TestRendererPrivateTestInstanceNativeQueryExecutionEvidence'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_test_instance_native_query_execution_consumes_create_and_update_records',
    'root_private_test_instance_native_query_execution_rejects_public_testinstance_claim'
  ]),
  acceptedNativeExecutionRecordKind:
    privateTestInstanceNativeQueryExecutionRecordKind,
  acceptedNativeExecutionOperations:
    privateTestInstanceNativeQueryExecutionAcceptedOperations,
  sourceQueryBridgePreflightDiagnosticName:
    privateTestInstanceQueryBridgePreflightDiagnosticName,
  query: 'findByType',
  resultFiberTag: 'HostComponent',
  consumesAcceptedNativeCreateUpdateExecutionRecords: true,
  consumesPrivateTestInstanceQueryDiagnostics: true,
  consumesQueryBridgePreflight: true,
  minimalHostComponentQueryPath: true,
  publicRootAvailable: false,
  publicQueryMethodsAvailable: false,
  publicTestInstanceObjectAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  compatibilityClaimed: false
});
const privateTestInstanceClassRootQueryExecutionGate = Object.freeze({
  id: 'react-test-renderer-private-test-instance-class-root-query-execution-gate',
  diagnosticName: privateTestInstanceClassQueryExecutionDiagnosticName,
  status: privateTestInstanceClassQueryExecutionStatus,
  publicSurface: 'create().update -> create().root/ReactTestInstance.findByType',
  acceptedWorker:
    'worker-699-test-renderer-testinstance-class-query-execution',
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustDiagnosticName:
    privateTestInstanceClassQueryExecutionDiagnosticName,
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_test_instance_class_root_query_after_update_native_execution_for_canary',
    'TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence',
    'TestRendererRoot::describe_private_get_instance_class_root_after_update_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_test_instance_class_query_execution_consumes_update_record_and_updated_child',
    'root_private_test_instance_class_query_execution_rejects_stale_updated_child'
  ]),
  sourceQueryBridgePreflightDiagnosticName:
    privateTestInstanceQueryBridgePreflightDiagnosticName,
  sourceGetInstanceDiagnosticName: privateGetInstanceAcceptedDiagnosticName,
  acceptedClassRootFiberShape: privateGetInstanceAcceptedClassFiberShape,
  query: 'findByType',
  rootResultFiberTag: 'ClassComponent',
  resultFiberTag: 'HostComponent',
  consumesAcceptedNativeUpdateExecutionRecord: true,
  consumesPrivateTestInstanceQueryDiagnostics: true,
  consumesQueryBridgePreflight: true,
  consumesPrivateGetInstanceClassRootDiagnostics: true,
  updatedHostChildQueryPath: Object.freeze([
    'ClassComponent',
    'HostComponent',
    'HostText'
  ]),
  publicRootAvailable: false,
  publicQueryMethodsAvailable: false,
  publicTestInstanceObjectAvailable: false,
  publicGetInstanceAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecutionFromJs: false,
  compatibilityClaimed: false
});
const privateTestInstanceQueryMethodRecords = Object.freeze({
  find: privateTestInstanceFindQueryRecord,
  findAll: privateTestInstanceFindAllQueryRecord,
  findByType: privateTestInstanceFindByTypeQueryRecord,
  findAllByType: privateTestInstanceFindAllByTypeQueryRecord,
  findByProps: privateTestInstanceFindByPropsQueryRecord,
  findAllByProps: privateTestInstanceFindAllByPropsQueryRecord
});
const privateTestInstanceRootQueryRecord = Object.freeze({
  id: 'react-test-renderer-private-test-instance-root-query',
  query: 'root',
  status: 'private-record-ready-public-root-blocked',
  publicSurface: 'create().root',
  source: 'ReactTestRenderer.js create().root multi-child HostRoot branch',
  deterministic: true,
  publicAccessAvailable: false,
  result: privateTestInstanceRootRecord
});
const privateTestInstanceWrapperSkeleton = Object.freeze({
  id: 'react-test-renderer-private-test-instance-wrapper-skeleton',
  status: 'private-record-ready-public-test-instance-blocked',
  entrypoint,
  deterministic: true,
  symbol: privateTestInstanceWrapperRecordSymbol.description,
  publicRootAvailable: false,
  publicQueryMethodsAvailable: false,
  publicTestInstanceObjectAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false,
  fiberInspection: privateTestInstanceFiberInspectionMetadata,
  multiChildHostTree: privateTestInstanceMultiChildHostTreeMetadata,
  acceptedInspectionRecords: privateTestInstanceAcceptedInspectionRecords,
  queryTraversal: privateTestInstanceQueryTraversalMetadata,
  queryPath: privateTestInstanceQueryPath,
  hostComponentQueryPath: privateTestInstanceHostComponentQueryPath,
  findAllPredicateDiagnostics: privateTestInstanceFindAllPredicateDiagnostics,
  findByQueryDiagnostics: privateTestInstanceFindByQueryDiagnostics,
  queryBridgePreflightGate: privateTestInstanceQueryBridgePreflightGate,
  nativeQueryExecutionGate: privateTestInstanceNativeQueryExecutionGate,
  classRootQueryExecutionGate:
    privateTestInstanceClassRootQueryExecutionGate,
  privateNativeQueryExecutionEvidenceAvailable: true,
  privateNativeQueryExecutionDiagnosticName:
    privateTestInstanceNativeQueryExecutionDiagnosticName,
  privateNativeQueryExecutionStatus:
    privateTestInstanceNativeQueryExecutionStatus,
  privateClassRootQueryExecutionEvidenceAvailable: true,
  privateClassRootQueryExecutionDiagnosticName:
    privateTestInstanceClassQueryExecutionDiagnosticName,
  privateClassRootQueryExecutionStatus:
    privateTestInstanceClassQueryExecutionStatus,
  acceptedNativeExecutionRecordKind:
    privateTestInstanceNativeQueryExecutionRecordKind,
  acceptedNativeExecutionOperations:
    privateTestInstanceNativeQueryExecutionAcceptedOperations,
  rootQueryRecord: privateTestInstanceRootQueryRecord,
  queryRecords: Object.freeze({
    root: privateTestInstanceRootQueryRecord,
    type: privateTestInstanceHostRootTypeQueryRecord,
    props: privateTestInstanceHostRootPropsQueryRecord,
    children: privateTestInstanceHostRootChildrenQueryRecord,
    hostComponentType: privateTestInstanceHostComponentTypeQueryRecord,
    hostComponentProps: privateTestInstanceHostComponentPropsQueryRecord,
    hostComponentChildren: privateTestInstanceHostComponentChildrenQueryRecord
  }),
  queryMethodRecords: privateTestInstanceQueryMethodRecords
});
const privateRoutes = Object.freeze([
  createPrivateRoute,
  updatePrivateRoute,
  unmountPrivateRoute
]);
const privateRootOwnerType = 'fast.react_test_renderer.private_root_owner';
const privateRootHandleType = 'fast.react_test_renderer.private_root_handle';
const privateRootRequestRecordType =
  'fast.react_test_renderer.private_root_request_record';
const privateRootBridgeStatus =
  'blocked-private-test-renderer-root-bridge-execution';
const privateRootCompatibilityStatus =
  'blocked-private-test-renderer-root-bridge-compatibility';
const testRendererRootKind = 'test-renderer';
const testRendererRootTag = 'ConcurrentRoot';
const testRendererRootLifecycleActive = 'Active';
const testRendererRootLifecycleUnmountScheduled = 'UnmountScheduled';
const testRendererRootUpdateKindCreate = 'Create';
const testRendererRootUpdateKindUpdate = 'Update';
const testRendererRootUpdateKindUnmount = 'Unmount';
const testRendererRootUpdateOutcomeScheduled = 'Scheduled';
const testRendererRootUpdateOutcomeIgnoredAfterUnmount =
  'IgnoredAfterUnmount';
const testRendererRootUpdateOutcomeAlreadyUnmountScheduled =
  'AlreadyUnmountScheduled';
const testRendererRootElementNone = Object.freeze({
  kind: 'RootElementHandle::NONE',
  isNone: true
});
const privateRootBlockedCapabilities = Object.freeze([
  Object.freeze({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust TestRendererRoot bridge execution is admitted.'
  }),
  Object.freeze({
    id: 'reconciler-execution',
    blocked: true,
    reason: 'No reconciler root update or unmount execution is admitted.'
  }),
  Object.freeze({
    id: 'host-output-mutation',
    blocked: true,
    reason: 'No test-renderer host output may be created, updated, or removed.'
  }),
  Object.freeze({
    id: 'serialization',
    blocked: true,
    reason: 'No public toJSON, toTree, or TestInstance serialization is admitted.'
  }),
  Object.freeze({
    id: 'act-integration',
    blocked: true,
    reason: 'No public act or scheduler flushing integration is admitted.'
  }),
  Object.freeze({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React Test Renderer root lifecycle compatibility remains unclaimed.'
  })
]);
const createRoutingGate = Object.freeze({
  id: 'react-test-renderer-create-routing-prerequisite-gate',
  status: createRoutingGateStatus,
  entrypoint,
  deterministic: true,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  privateRootRequestBridgeAvailable: true,
  privateRootRequestBridgeStatus:
    'admitted-private-test-renderer-root-request-record',
  privateRootRequestBridgeExecutionStatus:
    'admitted-private-test-renderer-root-execution-bridge',
  rootRequestRecordOnly: false,
  privateRootExecutionBridgeAvailable: true,
  rustRootExecutionBoundaryCallable: true,
  createRouteAvailable: false,
  updateRouteAvailable: false,
  unmountRouteAvailable: false,
  serializationAvailable: false,
  actIntegrationAvailable: false,
  schedulerIntegrationAvailable: false,
  actSchedulerGate,
  actSchedulerGateStatus: actSchedulerGate.status,
  flushSyncActRoutingGate,
  privateFlushSyncActRoutingDiagnosticsAvailable: true,
  compatibilityClaimed: false,
  missingPrerequisites: createRoutingMissingPrerequisites,
  prerequisites: createRoutingPrerequisites,
  privateRoutes,
  createPrivateRoute,
  updatePrivateRoute,
  unmountPrivateRoute,
  privateCreateRouteAdmissionGate,
  privateCreateRouteAdmissionAvailable: true,
  privateCreateRouteAdmissionConsumptionAvailable: true,
  privateRootCreatePreflightGate,
  updateUnmountRustLifecycleDiagnosticGate,
  privateUpdateUnmountLifecycleDiagnosticsAccepted: true,
  privateUpdateUnmountLifecycleDiagnosticConsumptionAvailable: true,
  toJSONSerializationFacadeGate: toJSONPrivateSerializationFacadeGate,
  toTreeHostOutputMetadataGate: toTreePrivateHostOutputMetadataGate,
  toTreePrivateFacadeGate,
  getInstancePrivateClassRootGate,
  privateTestInstanceWrapperSkeleton,
  privateTestInstanceQueryBridgePreflightGate,
  privateErrorBoundaryDiagnosticsGate
});
const rootRequestBridgeSymbol = Symbol.for(
  'fast.react_test_renderer.root_request_bridge'
);
const rootRequestStatus =
  'admitted-private-test-renderer-root-request-record';
const rootRequestExecutionStatus =
  'admitted-private-test-renderer-root-execution-bridge';
const rootRequestCompatibilityStatus =
  'blocked-private-test-renderer-root-compatibility';
const rootRequestLifecycleActive = 'active';
const rootRequestLifecycleUnmountScheduled = 'unmount-scheduled';
const rootElementHandleNone = freezeRecord({
  $$typeof: 'fast.react_test_renderer.root_element_handle',
  kind: 'RootElementHandle',
  raw: 0,
  isNone: true
});
const rootRequestBlockedCapabilities = freezeArray([
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust TestRendererRoot bridge is loaded.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason:
      'No update_container, update_container_sync, or root scheduling call is executed from JavaScript.'
  }),
  freezeRecord({
    id: 'host-output',
    blocked: true,
    reason:
      'No in-memory test-renderer host output, serialization, or TestInstance wrapper is produced.'
  }),
  freezeRecord({
    id: 'public-compatibility',
    blocked: true,
    reason:
      'React Test Renderer public create, update, unmount, act, and serialization compatibility remains unclaimed.'
  })
]);
const currentRustTestRendererRootCanaryOperations = freezeRecord({
  create: freezeRecord({
    operation: 'create',
    rootApi: 'TestRendererRoot::create',
    rootCreatePreflightApi:
      'TestRendererRoot::describe_private_root_create_preflight_for_canary',
    hostOutputCanaryApi:
      'TestRendererRoot::create_host_component_with_text_for_canary',
    updateKind: 'Create',
    rustUpdateKind: 'TestRendererRootUpdateKind::Create',
    scheduledUpdateRecord: 'TestRendererRootScheduledUpdate',
    scheduledElement: 'RootElementHandle',
    containerUpdateApi: 'update_container',
    schedulerApi: 'ensure_root_is_scheduled',
    sync: false,
    lifecycleAfterScheduled: 'Active',
    outcomeVariants: freezeArray(['Scheduled']),
    acceptedWorkers: freezeArray([
      'worker-153-test-renderer-root-canary',
      'worker-195-test-renderer-root-callback-snapshot',
      'worker-208-test-renderer-host-output-canary',
      'worker-636-test-renderer-create-native-execution'
    ]),
    acceptedRustTests: freezeArray([
      'root_create_enqueues_host_root_update_without_host_mutation',
      'root_options_store_strict_mode_and_create_node_mock_without_invocation',
      'root_create_commit_handoff_exposes_visible_callback_snapshot',
      'root_host_output_canary_commits_minimal_host_component_with_text',
      'root_private_create_native_bridge_handoff_consumes_actual_host_output'
    ])
  }),
  update: freezeRecord({
    operation: 'update',
    rootApi: 'TestRendererRoot::update',
    hostOutputCanaryApi:
      'TestRendererRoot::update_host_component_with_text_for_canary',
    hostOutputPropsCanaryApi:
      'TestRendererRoot::update_host_component_with_props_and_text_for_canary',
    hostOutputCommitApi:
      'TestRendererRoot::render_and_commit_host_output_update_for_canary',
    nativeBridgeAdmissionApi:
      'TestRendererRoot::describe_private_update_native_bridge_admission_for_canary',
    nativeBridgeAdmissionDiagnosticId:
      privateUpdateNativeBridgeAdmissionDiagnosticId,
    nativeBridgeAdmissionStatus:
      privateUpdateNativeBridgeAdmissionStatus,
    nativeBridgeAdmission:
      privateUpdateNativeBridgeAdmissionGate,
    updateKind: 'Update',
    rustUpdateKind: 'TestRendererRootUpdateKind::Update',
    scheduledUpdateRecord: 'TestRendererRootScheduledUpdate',
    scheduledElement: 'RootElementHandle',
    containerUpdateApi: 'update_container',
    schedulerApi: 'ensure_root_is_scheduled',
    sync: false,
    lifecycleAfterScheduled: 'Active',
    outcomeVariants: freezeArray(['Scheduled', 'IgnoredAfterUnmount']),
    acceptedWorkers: freezeArray([
      'worker-153-test-renderer-root-canary',
      'worker-195-test-renderer-root-callback-snapshot',
      'worker-234-test-renderer-host-output-update-unmount-canary',
      'worker-574-test-renderer-update-via-root-work-loop',
      'worker-637-test-renderer-update-native-execution',
      'worker-696-test-renderer-root-update-prop-style-execution'
    ]),
    acceptedRustTests: freezeArray([
      'root_update_reuses_same_fiber_root_and_shared_scheduler_record',
      'root_update_commit_handoff_exposes_visible_callback_snapshot',
      'root_host_output_canary_updates_committed_text_with_update_diagnostics',
      'root_private_update_route_consumes_root_work_loop_update_queue_and_text_update_metadata',
      'root_private_update_route_rejects_stale_root_update_output',
      'root_private_update_route_rejects_unmounted_root',
      'root_private_update_route_rejects_incompatible_finished_work_record',
      'root_private_update_native_bridge_admission_consumes_actual_update_host_output_handoff',
      'root_private_update_native_bridge_admission_consumes_prop_style_text_update_execution',
      'root_private_update_native_bridge_admission_rejects_missing_handoff',
      'root_private_update_native_bridge_admission_rejects_stale_route_outcome',
      'root_update_after_unmount_does_not_mutate_or_reschedule'
    ])
  }),
  unmount: freezeRecord({
    operation: 'unmount',
    rootApi: 'TestRendererRoot::unmount',
    hostOutputCommitApi:
      'TestRendererRoot::render_and_commit_host_output_unmount_for_canary',
    deletionCommitHandoffApi:
      'TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary',
    deletionCommitHandoffDiagnosticId:
      privateUnmountDeletionCommitHandoffDiagnosticId,
    deletionCommitHandoffStatus:
      privateUnmountDeletionCommitHandoffStatus,
    nativeBridgeAdmissionApi:
      'TestRendererRoot::describe_private_unmount_native_bridge_admission_for_canary',
    nativeBridgeAdmissionDiagnosticId:
      privateUnmountNativeBridgeAdmissionDiagnosticId,
    nativeBridgeAdmissionStatus:
      privateUnmountNativeBridgeAdmissionStatus,
    nativeBridgeCleanupHandoffApi:
      'TestRendererRoot::execute_private_unmount_native_bridge_cleanup_handoff_for_canary',
    nativeBridgeCleanupHandoffDiagnosticId:
      privateUnmountNativeBridgeCleanupHandoffDiagnosticId,
    nativeBridgeCleanupHandoffStatus:
      privateUnmountNativeBridgeCleanupHandoffStatus,
    passiveRefCleanupOrderDiagnosticId:
      privateUnmountPassiveRefCleanupOrderDiagnosticId,
    passiveRefCleanupOrderStatus:
      privateUnmountPassiveRefCleanupOrderStatus,
    passiveRefCleanupOrder:
      privateUnmountPassiveRefCleanupOrderGate,
    hostChildDetachmentBlockers:
      privateUnmountHostChildDetachmentBlockers,
    updateKind: 'Unmount',
    rustUpdateKind: 'TestRendererRootUpdateKind::Unmount',
    scheduledUpdateRecord: 'TestRendererRootScheduledUpdate',
    scheduledElement: 'RootElementHandle::NONE',
    containerUpdateApi: 'update_container_sync',
    schedulerApi: 'ensure_root_is_scheduled',
    sync: true,
    lifecycleAfterScheduled: 'UnmountScheduled',
    outcomeVariants: freezeArray(['Scheduled', 'AlreadyUnmountScheduled']),
    acceptedWorkers: freezeArray([
      'worker-153-test-renderer-root-canary',
      'worker-195-test-renderer-root-callback-snapshot',
      'worker-234-test-renderer-host-output-update-unmount-canary',
      'worker-575-test-renderer-unmount-deletion-commit-link',
      'worker-612-test-renderer-unmount-native-bridge-admission',
      'worker-638-test-renderer-unmount-native-execution',
      'worker-672-test-renderer-unmount-passive-ref-order'
    ]),
    acceptedRustTests: freezeArray([
      'root_unmount_enqueues_sync_null_update_before_wrapper_invalidation',
      'root_unmount_commit_handoff_exposes_visible_callback_snapshot',
      'root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics',
      'root_unmount_is_idempotent',
      'root_private_unmount_route_rejects_stale_deletion_commit_handoff',
      'root_host_output_unmount_canary_rejects_already_unmounted_root_record',
      'root_private_unmount_native_bridge_admission_rejects_stale_handoff',
      'root_private_unmount_native_bridge_admission_rejects_missing_cleanup_blockers',
      'root_private_unmount_native_bridge_admission_rejects_already_unmounted_root',
      'root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff',
      'root_private_unmount_passive_ref_order_rejects_native_cleanup_mismatch'
    ]),
    staleRootRecordRejection: true,
    alreadyUnmountedRootRecordRejection: true,
    publicHostTeardownCompatibilityClaimed: false,
    actFlushingClaimed: false
  })
});
const currentRustTestRendererRootCanaryMetadata = freezeRecord({
  id: 'fast-react-test-renderer-current-root-canary-metadata',
  status: 'private-root-execution-bridge-current-rust-canary-metadata',
  compatibilityTarget,
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustWorkers: freezeArray([
    'worker-153-test-renderer-root-canary',
    'worker-188-test-renderer-commit-handoff-canary',
    'worker-195-test-renderer-root-callback-snapshot',
    'worker-208-test-renderer-host-output-canary',
    'worker-234-test-renderer-host-output-update-unmount-canary',
    'worker-265-test-renderer-private-json-ready-diagnostics',
    'worker-534-root-work-loop-finished-work-commit-handoff',
    'worker-465-test-renderer-error-boundary-diagnostics',
    'worker-530-test-renderer-error-boundary-update-refresh',
    'worker-669-test-renderer-error-boundary-native-execution',
    'worker-539-test-renderer-live-rust-root-create-preflight',
    'worker-573-test-renderer-private-root-work-loop-preflight',
    'worker-574-test-renderer-update-via-root-work-loop',
    'worker-575-test-renderer-unmount-deletion-commit-link',
    'worker-610-test-renderer-create-native-bridge-admission',
    'worker-636-test-renderer-create-native-execution',
    'worker-612-test-renderer-unmount-native-bridge-admission',
    'worker-638-test-renderer-unmount-native-execution',
    'worker-637-test-renderer-update-native-execution',
    'worker-696-test-renderer-root-update-prop-style-execution',
    'worker-672-test-renderer-unmount-passive-ref-order'
  ]),
  acceptedJsBridgeWorkers: freezeArray([
    'worker-304-test-renderer-js-private-root-request-bridge',
    'worker-306-test-renderer-testinstance-private-wrapper-skeleton',
    'worker-307-test-renderer-update-unmount-private-js-bridge',
    'worker-423-test-renderer-native-root-execution-bridge',
    'worker-426-test-renderer-testinstance-bridge-query',
    'worker-539-test-renderer-live-rust-root-create-preflight',
    'worker-573-test-renderer-private-root-work-loop-preflight',
    'worker-610-test-renderer-create-native-bridge-admission',
    'worker-636-test-renderer-create-native-execution',
    'worker-612-test-renderer-unmount-native-bridge-admission',
    'worker-638-test-renderer-unmount-native-execution',
    'worker-637-test-renderer-update-native-execution',
    'worker-696-test-renderer-root-update-prop-style-execution',
    'worker-669-test-renderer-error-boundary-native-execution'
  ]),
  root: freezeRecord({
    rustType: 'TestRendererRoot',
    rendererType: 'TestRenderer',
    rootStoreType: 'FiberRootStore<TestRenderer>',
    rootTag: 'ConcurrentRoot',
    lifecycleEnum: 'TestRendererRootLifecycle',
    lifecycleValues: freezeArray(['Active', 'UnmountScheduled']),
    optionsType: 'TestRendererOptions',
    rootOptionsType: 'RootOptions',
    rootErrorOptionHandles: freezeArray([
      'RootErrorCallbackHandle',
      'RootRecoverableErrorCallbackHandle'
    ])
  }),
  requests: freezeRecord({
    updateKindEnum: 'TestRendererRootUpdateKind',
    updateKindValues: freezeArray(['Create', 'Update', 'Unmount']),
    updateOutcomeEnum: 'TestRendererRootUpdateOutcome',
    updateOutcomeValues: freezeArray([
      'Scheduled',
      'IgnoredAfterUnmount',
      'AlreadyUnmountScheduled'
    ]),
    scheduledUpdateRecord: 'TestRendererRootScheduledUpdate',
    rootElementHandleType: 'RootElementHandle',
    noneElement: 'RootElementHandle::NONE',
    callbackSnapshot: 'RootUpdateCallbackSnapshot'
  }),
  commit: freezeRecord({
    renderPhaseApi:
      'TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff',
    commitApi: 'TestRendererRoot::commit_host_root_render_for_canary',
    commitRecord: 'HostRootCommitRecord',
    commitDiagnostics: 'TestRendererCommitDiagnostics',
    rootUpdateCallbacksAvailable: true,
    hostMutationGeneralized: false
  }),
  hostOutput: freezeRecord({
    createApi: 'TestRendererRoot::render_and_commit_host_output_for_canary',
    updateApi:
      'TestRendererRoot::render_and_commit_host_output_update_for_canary',
    updateRouteDiagnosticApi:
      'TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary',
    updateRouteRootWorkLoopGate: privateUpdateRouteRootWorkLoopGate,
    updateNativeBridgeAdmissionApi:
      'TestRendererRoot::describe_private_update_native_bridge_admission_for_canary',
    updateNativeBridgeAdmissionDiagnosticId:
      privateUpdateNativeBridgeAdmissionDiagnosticId,
    updateNativeBridgeAdmissionStatus:
      privateUpdateNativeBridgeAdmissionStatus,
    updateNativeBridgeAdmissionGate:
      privateUpdateNativeBridgeAdmissionGate,
    updateNativeBridgeAdmission:
      'TestRendererUpdateNativeBridgeAdmission',
    unmountApi:
      'TestRendererRoot::render_and_commit_host_output_unmount_for_canary',
    unmountDeletionCommitHandoffApi:
      'TestRendererRoot::describe_private_unmount_deletion_commit_handoff_for_canary',
    unmountDeletionCommitHandoffDiagnosticId:
      privateUnmountDeletionCommitHandoffDiagnosticId,
    unmountDeletionCommitHandoffStatus:
      privateUnmountDeletionCommitHandoffStatus,
    unmountDeletionCommitHandoffGate:
      privateUnmountDeletionCommitHandoffGate,
    unmountNativeBridgeAdmissionApi:
      'TestRendererRoot::describe_private_unmount_native_bridge_admission_for_canary',
    unmountNativeBridgeAdmissionDiagnosticId:
      privateUnmountNativeBridgeAdmissionDiagnosticId,
    unmountNativeBridgeAdmissionStatus:
      privateUnmountNativeBridgeAdmissionStatus,
    unmountNativeBridgeAdmissionGate:
      privateUnmountNativeBridgeAdmissionGate,
    unmountNativeBridgeCleanupHandoffApi:
      'TestRendererRoot::execute_private_unmount_native_bridge_cleanup_handoff_for_canary',
    unmountNativeBridgeCleanupHandoffDiagnosticId:
      privateUnmountNativeBridgeCleanupHandoffDiagnosticId,
    unmountNativeBridgeCleanupHandoffStatus:
      privateUnmountNativeBridgeCleanupHandoffStatus,
    unmountNativeBridgeCleanupHandoffGate:
      privateUnmountNativeBridgeCleanupHandoffGate,
    unmountPassiveRefCleanupOrderDiagnosticId:
      privateUnmountPassiveRefCleanupOrderDiagnosticId,
    unmountPassiveRefCleanupOrderStatus:
      privateUnmountPassiveRefCleanupOrderStatus,
    unmountPassiveRefCleanupOrderGate:
      privateUnmountPassiveRefCleanupOrderGate,
    hostChildDetachmentBlockers:
      privateUnmountHostChildDetachmentBlockers,
    diagnostics: 'TestRendererHostOutputDiagnostics',
    hostNodeCleanupReport: 'TestRendererHostNodeCleanupReport',
    unmountDeletionCommitHandoffDiagnostics:
      'TestRendererUnmountDeletionCommitHandoffDiagnostics',
    unmountNativeBridgeAdmission:
      'TestRendererUnmountNativeBridgeAdmission',
    unmountNativeBridgeCleanupHandoff:
      'TestRendererUnmountNativeBridgeCleanupHandoff',
    unmountPassiveRefCleanupOrder:
      'TestRendererUnmountPassiveRefCleanupOrderEvidence',
    fixtureShape: freezeArray(['HostRoot', 'HostComponent', 'HostText']),
    fixtureType: 'span',
    fixtureText: 'hello',
    realHostOutputCanaryAvailable: true,
    generalMutationTraversalAvailable: false
  }),
  rootWorkLoopFinishedWorkPreflight: freezeRecord({
    metadataId: privateRootWorkLoopFinishedWorkPreflightMetadataId,
    metadataStatus: privateRootWorkLoopFinishedWorkPreflightMetadataStatus,
    acceptedWorker: 'worker-534-root-work-loop-finished-work-commit-handoff',
    acceptedRustModule: 'fast-react-reconciler::root_work_loop',
    renderPhaseApi:
      'TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff',
    renderPhaseRecord: 'HostRootRenderPhaseRecord',
    finishedWorkRecord: 'HostRootRenderPhaseRecord::finished_work',
    pendingFinishedWorkRecord:
      'HostRootFinishedWorkPendingCommitRecordForCanary',
    commitHandoffRecord: 'HostRootFinishedWorkCommitHandoffRecordForCanary',
    acceptedInputShape: 'HostComponentWithTextChild',
    acceptedFiberShape: freezeArray(['HostRoot', 'HostComponent', 'HostText']),
    renderLanesRecord: 'HostRootRenderPhaseRecord::render_lanes',
    remainingLanesRecord: 'HostRootRenderPhaseRecord::remaining_lanes',
    missingMetadataRejection: true,
    staleMetadataRejection: true,
    unsupportedChildrenRejection: true,
    publicCreateBehaviorAvailable: false,
    hostMutationExecutionBlocked: true,
    effectsRefsAndHydrationBlocked: true,
    compatibilityClaimed: false
  }),
  rootCreatePreflight: freezeRecord({
    diagnosticName: privateRootCreatePreflightDiagnosticName,
    status: privateRootCreatePreflightStatus,
    gate: privateRootCreatePreflightGate,
    bridgeMetadataSource:
      'FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata',
    acceptedRustApis: privateRootCreatePreflightGate.acceptedRustApis,
    acceptedRustTests: privateRootCreatePreflightGate.acceptedRustTests,
    acceptedRustFinishedWorkRecords:
      privateRootCreatePreflightGate.acceptedRustFinishedWorkRecords,
    acceptedInputShapes: privateRootCreatePreflightGate.acceptedInputShapes,
    workLoopFinishedWorkPreflightRowId:
      privateRootCreateWorkLoopFinishedWorkPreflightRowId,
    workLoopFinishedWorkPreflightStatus:
      privateRootCreateWorkLoopFinishedWorkPreflightStatus,
    workLoopFinishedWorkMetadataRequired: true,
    validatesAcceptedRustWorkLoopFinishedWorkPreflight: true,
    requiredRootOptions: true,
    rootOptionsMetadataAvailable: true,
    staleCanaryMetadataRejection: true,
    staleWorkLoopFinishedWorkMetadataRejection: true,
    missingWorkLoopFinishedWorkMetadataRejection: true,
    unsupportedChildrenRejection: true,
    missingRootOptionsRejection: true,
    publicRendererRootCreated: false,
    publicRootAvailable: false,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    compatibilityClaimed: false
  }),
  rootCreateRouteAdmission: freezeRecord({
    metadataId: privateCreateRouteAdmissionMetadataId,
    metadataStatus: privateCreateRouteAdmissionMetadataStatus,
    diagnosticName: privateCreateRouteAdmissionDiagnosticName,
    status: privateCreateRouteAdmissionStatus,
    recordId: privateCreateRouteAdmissionRecordId,
    gate: privateCreateRouteAdmissionGate,
    bridgeMetadataSource:
      'FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.rootCreateRouteAdmission',
    acceptedWorker:
      'worker-610-test-renderer-create-native-bridge-admission',
    acceptedRustCrate: 'fast-react-test-renderer',
    acceptedRustApis: privateCreateRouteAdmissionGate.acceptedRustApis,
    acceptedRustTests: privateCreateRouteAdmissionGate.acceptedRustTests,
    rootApi: 'TestRendererRoot::create',
    preflightApi:
      'TestRendererRoot::describe_private_root_create_preflight_for_canary',
    workLoopRenderPhaseApi:
      'TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff',
    lifecycleRecord: 'TestRendererRootScheduledUpdate',
    executionResultRecord:
      'TestRendererPrivateCreateRouteAdmissionDiagnostics',
    hostOutputHandoffRecord:
      'TestRendererPrivateCreateNativeBridgeHostOutputHandoff',
    hostOutputHandoffDiagnosticId:
      privateCreateNativeBridgeHostOutputHandoffDiagnosticId,
    hostOutputHandoffStatus:
      privateCreateNativeBridgeHostOutputHandoffStatus,
    acceptedInputShape: 'HostComponentWithTextChild',
    consumesJsFacadeCreateMetadata: true,
    consumesAcceptedRustRootCreateExecutionEvidence: true,
    consumesAcceptedRustRootCreatePreflightDiagnostics: true,
    consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata: true,
    consumesAcceptedRustCreateHostOutputHandoff: true,
    consumesCurrentRustRootFinishedWorkIdentity: true,
    requiresCommitCurrentMatchesRenderFinishedWork: true,
    acceptedHostOutputShape: 'SingleHostText',
    hostOutputProducedByRust: true,
    missingRustAdmissionRecordRejection: true,
    staleRustAdmissionRecordRejection: true,
    publicRendererRootCreated: false,
    publicRootAvailable: false,
    publicCreateBehaviorAvailable: false,
    publicSerializationAvailable: false,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    reconcilerExecutionFromJs: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  }),
  errorBoundaryDiagnostics: privateErrorBoundaryDiagnosticsGate,
  unmountDeletionCommitHandoff:
    privateUnmountDeletionCommitHandoffGate,
  unmountNativeBridgeAdmission:
    privateUnmountNativeBridgeAdmissionGate,
  unmountNativeBridgeCleanupHandoff:
    privateUnmountNativeBridgeCleanupHandoffGate,
  unmountPassiveRefCleanupOrder:
    privateUnmountPassiveRefCleanupOrderGate,
  privateJson: freezeRecord({
    diagnosticName:
      'fast-react-test-renderer.serialization.private-json-canary',
    report: 'TestRendererPrivateJsonSerializationReport',
    api: 'TestRendererRoot::describe_private_json_serialization_for_canary',
    createApi: 'TestRendererRoot::describe_private_json_serialization_for_canary',
    updateApi:
      'TestRendererRoot::describe_private_json_serialization_after_update_for_canary',
    updateHostOutputRowApi:
      'TestRendererRoot::describe_private_to_json_host_output_update_row_for_canary',
    nestedUpdateHostOutputRowApi:
      'TestRendererRoot::describe_private_to_json_nested_host_output_update_row_for_canary',
    siblingTextHostOutputRowApi:
      'TestRendererRoot::describe_private_to_json_sibling_text_host_output_row_from_snapshot_for_diagnostics',
    unmountHostOutputRowApi:
      'TestRendererRoot::describe_private_to_json_host_output_unmount_row_for_canary',
    updateHostOutputRowId: privateToJSONUpdateHostOutputRowId,
    nestedUpdateHostOutputRowId: privateToJSONNestedUpdateHostOutputRowId,
    siblingTextHostOutputRowId: privateToJSONSiblingTextHostOutputRowId,
    updateHostOutputRowIds: privateToJSONUpdateHostOutputRowIds,
    unmountHostOutputRowId: privateToJSONUnmountHostOutputRowId,
    updateUnmountDependencyMetadata:
      privateToJSONUpdateUnmountDependencyMetadata,
    nativeExecutionEvidenceDiagnosticName:
      privateToJSONNativeExecutionDiagnosticName,
    nativeExecutionEvidenceStatus: privateToJSONNativeExecutionStatus,
    nativeExecutionEvidenceRecordKind:
      privateToJSONNativeExecutionRecordKind,
    acceptedNativeExecutionOperations:
      privateToJSONNativeExecutionAcceptedOperations,
    consumesAcceptedNativeCreateUpdateUnmountExecutionRecords: true,
    nativeExecutionEvidenceWorker:
      'worker-639-test-renderer-tojson-after-native-execution',
    hostShapeApi:
      'TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics',
    acceptedHostOutputUpdateKinds: freezeArray(['Create', 'Update', 'Unmount']),
    acceptedHostRootShapes: freezeArray([
      'EmptyRoot',
      'SingleHostChild',
      'MultipleHostChildren',
      'TextSibling',
      'NestedHostText',
      'SiblingTextRow'
    ]),
    acceptedHostOutputRowShapes: privateToJSONHostOutputShapes,
    propElisionFromSerializedProps: true,
    hostOutputSnapshotFreshnessRequired: true,
    staleSnapshotRejection: true,
    mismatchedUpdateUnmountRecordRejection: true,
    mismatchedUpdateShapeRejection: true,
    publicSerializationAvailable: false
  }),
  testInstanceQuery: freezeRecord({
    diagnosticKind: 'ReactTestInstancePrivateQueryMetadata',
    status:
      'private-test-instance-query-diagnostics-routed-through-root-bridge',
    bridgeMetadataSource:
      'FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata',
    wrapperRecordSymbol:
      'fast.react_test_renderer.private_test_instance_wrapper_record',
    acceptedWorkers: freezeArray([
      'worker-235-test-renderer-private-fiber-inspection',
      'worker-334-test-renderer-testinstance-private-query-path',
      'worker-365-test-renderer-testinstance-multi-child-query-path'
    ]),
    acceptedRustRecords: freezeArray([
      'TestRendererCommittedFiberTreeInspection',
      'TestRendererCommittedFiberNodeInspection'
    ]),
    acceptedQuerySurfaces: freezeArray([
      'root',
      'find',
      'findAll',
      'findByType',
      'findAllByType',
      'findByProps',
      'findAllByProps'
    ]),
    fixtureShape: freezeArray([
      'HostRoot',
      'HostText',
      'HostComponent',
      'HostText'
    ]),
    rootWrapperMaterializedForPrivateMetadata: true,
    queryCandidateCount: 2,
    skippedTextRecordCount: 2,
    findAllDiagnosticName:
      'fast-react-test-renderer.testinstance.find-all-private-query',
    findAllPredicateDiagnosticsAvailable: true,
    findAllPredicateKinds: freezeArray(['type', 'props', 'predicate-like']),
    findAllPredicateExecution: false,
    findAllAcceptedRustApis: freezeArray([
      'TestRendererRoot::describe_private_test_instance_find_all_query_for_canary',
      'TestRendererRoot::describe_private_test_instance_find_all_query_after_update_for_canary',
      'TestRendererPrivateTestInstanceFindAllQueryDiagnostics',
      'TestRendererPrivateTestInstanceFindAllPredicateDiagnostic'
    ]),
    findAllAcceptedRustTests: freezeArray([
      'root_private_test_instance_find_all_query_diagnostics_describe_type_props_and_predicate_metadata',
      'root_private_test_instance_find_all_query_diagnostics_follow_update_host_output'
    ]),
    findByDiagnosticName:
      'fast-react-test-renderer.testinstance.find-by-private-query',
    findByDiagnosticsAvailable: true,
    findByQueries: freezeArray(['findByType', 'findByProps']),
    findByEffectiveDeep: false,
    findByExpectOne: true,
    findByPredicateExecution: false,
    findByAcceptedRustApis: freezeArray([
      'TestRendererRoot::describe_private_test_instance_find_by_query_for_canary',
      'TestRendererRoot::describe_private_test_instance_find_by_query_after_update_for_canary',
      'TestRendererPrivateTestInstanceFindByQueryDiagnostics',
      'TestRendererPrivateTestInstanceFindByResultDiagnostic'
    ]),
    findByAcceptedRustTests: freezeArray([
      'root_private_test_instance_find_by_query_diagnostics_build_on_find_all_metadata',
      'root_private_test_instance_find_by_query_diagnostics_follow_update_host_output'
    ]),
    queryBridgePreflightDiagnosticName:
      privateTestInstanceQueryBridgePreflightDiagnosticName,
    queryBridgePreflightStatus: privateTestInstanceQueryBridgePreflightStatus,
    queryBridgePreflightAvailable: true,
    queryBridgePreflightAcceptedRustApis:
      privateTestInstanceQueryBridgePreflightGate.acceptedRustApis,
    queryBridgePreflightAcceptedRustTests:
      privateTestInstanceQueryBridgePreflightGate.acceptedRustTests,
    consumesAcceptedRustFindAllDiagnostics: true,
    consumesAcceptedRustFindByDiagnostics: true,
    recordOnlyDiagnosticConsumption: true,
    queryBridgeRustExecutionFromJs: false,
    publicRootAvailable: false,
    publicQueryMethodsAvailable: false,
    publicTestInstanceObjectAvailable: false,
    compatibilityClaimed: false
  }),
  operations: currentRustTestRendererRootCanaryOperations,
  recordOnlyPrivateBridge: false,
  privateRootExecutionBridgeAvailable: true,
  rustRootExecutionBoundaryCallable: true,
  rustRootExecutionBoundary: 'fast-react-test-renderer.TestRendererRoot',
  rustRootExecutionBridgeStatus:
    'admitted-private-test-renderer-native-root-execution-bridge',
  nativeAddonLoaded: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  rustExecution: false,
  reconcilerExecutionFromJs: false,
  hostOutputMutationFromJs: false,
  publicCreateUpdateUnmountBehaviorAvailable: false,
  compatibilityClaimed: false
});
const schedulerMockKeys = [
  'log',
  'reset',
  'unstable_IdlePriority',
  'unstable_ImmediatePriority',
  'unstable_LowPriority',
  'unstable_NormalPriority',
  'unstable_Profiling',
  'unstable_UserBlockingPriority',
  'unstable_advanceTime',
  'unstable_cancelCallback',
  'unstable_clearLog',
  'unstable_flushAll',
  'unstable_flushAllWithoutAsserting',
  'unstable_flushExpired',
  'unstable_flushNumberOfYields',
  'unstable_flushUntilNextPaint',
  'unstable_forceFrameRate',
  'unstable_getCurrentPriorityLevel',
  'unstable_hasPendingWork',
  'unstable_next',
  'unstable_now',
  'unstable_requestPaint',
  'unstable_runWithPriority',
  'unstable_scheduleCallback',
  'unstable_setDisableYieldValue',
  'unstable_shouldYield',
  'unstable_wrapCallback'
];

const schedulerFunctionShapes = {
  log: ['', 1],
  reset: ['', 0],
  unstable_advanceTime: ['', 1],
  unstable_cancelCallback: ['', 1],
  unstable_clearLog: ['', 0],
  unstable_flushAll: ['', 0],
  unstable_flushAllWithoutAsserting: [
    'unstable_flushAllWithoutAsserting',
    0
  ],
  unstable_flushExpired: ['', 0],
  unstable_flushNumberOfYields: ['', 1],
  unstable_flushUntilNextPaint: ['', 0],
  unstable_forceFrameRate: ['', 0],
  unstable_getCurrentPriorityLevel: ['', 0],
  unstable_hasPendingWork: ['', 0],
  unstable_next: ['', 1],
  unstable_now: ['', 0],
  unstable_requestPaint: ['', 0],
  unstable_runWithPriority: ['', 2],
  unstable_scheduleCallback: ['', 3],
  unstable_setDisableYieldValue: ['', 1],
  unstable_shouldYield: ['shouldYieldToHost', 0],
  unstable_wrapCallback: ['', 1]
};

const schedulerConstantValues = {
  unstable_IdlePriority: 5,
  unstable_ImmediatePriority: 1,
  unstable_LowPriority: 4,
  unstable_NormalPriority: 3,
  unstable_Profiling: null,
  unstable_UserBlockingPriority: 2
};

function createUnsupportedError(
  exportName,
  action,
  detail,
  routingGate,
  privateRootDiagnostics,
  schedulerGate,
  rootRequest
) {
  const suffix = detail === undefined ? '' : ` ${detail}`;
  const error = new Error(
    `[fast-react] ${entrypoint}.${exportName} ${action}, but this ` +
      `placeholder has no React Test Renderer behavior implementation yet. ` +
      `It exists to track the accepted ${compatibilityTarget} package ` +
      `surface; do not treat it as React Test Renderer-compatible ` +
      `behavior.${suffix}`
  );

  error.name = 'FastReactTestRendererUnimplementedError';
  error.code = unimplementedCode;
  error.entrypoint = entrypoint;
  error.exportName = exportName;
  error.compatibilityTarget = compatibilityTarget;

  const recognizedActSchedulerGate =
    schedulerGate ??
    (routingGate === undefined ? undefined : routingGate.actSchedulerGate);

  if (recognizedActSchedulerGate !== undefined) {
    error.actSchedulerGate = recognizedActSchedulerGate;
    error.actSchedulerGateStatus = recognizedActSchedulerGate.status;
    error.schedulerMockFlushHelperMetadataAccepted =
      recognizedActSchedulerGate.schedulerMockFlushHelperMetadataAccepted;
    error.reactActPrivateDispatcherGateAccepted =
      recognizedActSchedulerGate.reactActPrivateDispatcherGateAccepted;
    error.schedulerReactActQueueDiagnosticsAccepted =
      recognizedActSchedulerGate.schedulerReactActQueueDiagnosticsAccepted;
    error.privateSchedulerActQueueDiagnosticsConsumed =
      recognizedActSchedulerGate.privateSchedulerActQueueDiagnosticsConsumed;
    error.privateActQueueDiagnosticConsumptionReady =
      recognizedActSchedulerGate.privateActQueueDiagnosticConsumptionReady;
    error.mockSchedulerFlushHelperRoutingAccepted =
      recognizedActSchedulerGate.mockSchedulerFlushHelperRoutingAccepted;
    error.privateMockSchedulerFlushHelperMetadataRouted =
      recognizedActSchedulerGate.privateMockSchedulerFlushHelperMetadataRouted;
    error.privateMockSchedulerExpiredWorkMetadataRouted =
      recognizedActSchedulerGate.privateMockSchedulerExpiredWorkMetadataRouted;
    error.mockSchedulerExpiredWorkActRouteDiagnosticsReady =
      recognizedActSchedulerGate.mockSchedulerExpiredWorkActRouteDiagnosticsReady;
    error.recognizesExpiredMockSchedulerMetadata =
      recognizedActSchedulerGate.recognizesExpiredMockSchedulerMetadata;
    error.publicSchedulerFlushBehaviorExecuted =
      recognizedActSchedulerGate.publicSchedulerFlushBehaviorExecuted;
    error.rootActRecordsAccepted =
      recognizedActSchedulerGate.rootActRecordsAccepted;
    error.syncFlushActRecordsAccepted =
      recognizedActSchedulerGate.syncFlushActRecordsAccepted;
    error.postPassiveContinuationExecutionGateAccepted =
      recognizedActSchedulerGate.postPassiveContinuationExecutionGateAccepted;
    error.passiveActFlushMetadataAccepted =
      recognizedActSchedulerGate.passiveActFlushMetadataAccepted;
    error.rootRequestRecordsAccepted =
      recognizedActSchedulerGate.rootRequestRecordsAccepted;
    error.privateFlushExecutionMetadataAccepted =
      recognizedActSchedulerGate.privateFlushExecutionMetadataAccepted;
    error.privateSyncFlushExecutionMetadataAccepted =
      recognizedActSchedulerGate.privateSyncFlushExecutionMetadataAccepted;
    error.privatePassiveCallbackExecutionMetadataAccepted =
      recognizedActSchedulerGate.privatePassiveCallbackExecutionMetadataAccepted;
    error.warningThenableBlockerDiagnosticsAccepted =
      recognizedActSchedulerGate.warningThenableBlockerDiagnosticsAccepted;
    error.nestedScopeBlockerDiagnosticsAccepted =
      recognizedActSchedulerGate.nestedScopeBlockerDiagnosticsAccepted;
    error.privateRootPassivePrerequisiteSequenceAccepted =
      recognizedActSchedulerGate.privateRootPassivePrerequisiteSequenceAccepted;
    error.publicActWarningEmissionAvailable =
      recognizedActSchedulerGate.publicActWarningEmissionAvailable;
    error.publicActScopeDepthTrackingAvailable =
      recognizedActSchedulerGate.publicActScopeDepthTrackingAvailable;
    error.publicNestedActQueueReuseAvailable =
      recognizedActSchedulerGate.publicNestedActQueueReuseAvailable;
    error.publicOverlappingActWarningEmissionAvailable =
      recognizedActSchedulerGate.publicOverlappingActWarningEmissionAvailable;
    error.publicActThenableAwaitingAvailable =
      recognizedActSchedulerGate.publicActThenableAwaitingAvailable;
    error.publicActThenableResolutionAvailable =
      recognizedActSchedulerGate.publicActThenableResolutionAvailable;
    error.publicActThenableSettlementAvailable =
      recognizedActSchedulerGate.publicActThenableSettlementAvailable;
    error.publicAsyncActScopeSettlementAvailable =
      recognizedActSchedulerGate.publicAsyncActScopeSettlementAvailable;
    error.publicAsyncActCompatibilityClaimed =
      recognizedActSchedulerGate.publicAsyncActCompatibilityClaimed;
    error.privateRootOutputDiagnosticsAccepted =
      recognizedActSchedulerGate.privateRootOutputDiagnosticsAccepted;
    error.privateFlushExecutionReady =
      recognizedActSchedulerGate.privateFlushExecutionReady;
    error.publicSchedulerFlushExecutionAvailable =
      recognizedActSchedulerGate.publicSchedulerFlushExecutionAvailable;
    error.schedulerFlushCompatibilityClaimed =
      recognizedActSchedulerGate.schedulerFlushCompatibilityClaimed;
    error.queuedWorkExecution = recognizedActSchedulerGate.queuedWorkExecution;
    error.passiveEffectExecution =
      recognizedActSchedulerGate.passiveEffectExecution;
    error.effectCallbackExecution =
      recognizedActSchedulerGate.effectCallbackExecution;
    error.rootRequestExecution =
      recognizedActSchedulerGate.rootRequestExecution;
    error.privateRootRequestExecutionAvailable =
      recognizedActSchedulerGate.privateRootRequestExecutionAvailable;
    error.rendererRootsCompatibilityClaimed =
      recognizedActSchedulerGate.rendererRootsCompatibilityClaimed;
  }

  if (routingGate !== undefined) {
    error.routingGate = routingGate;
    error.routingGateStatus = routingGate.status;
    error.missingPrerequisites = routingGate.missingPrerequisites;
    error.nativeBridgeAvailable = routingGate.nativeBridgeAvailable;
    error.serializationAvailable = routingGate.serializationAvailable;
    error.compatibilityClaimed = routingGate.compatibilityClaimed;
    error.privateRoutes = routingGate.privateRoutes;
    error.createPrivateRoute = routingGate.createPrivateRoute;
    error.updatePrivateRoute = routingGate.updatePrivateRoute;
    error.unmountPrivateRoute = routingGate.unmountPrivateRoute;
    error.privateCreateRouteAdmissionGate =
      routingGate.privateCreateRouteAdmissionGate;
    error.toJSONSerializationFacadeGate =
      routingGate.toJSONSerializationFacadeGate;
    error.toTreeHostOutputMetadataGate =
      routingGate.toTreeHostOutputMetadataGate;
    error.toTreePrivateFacadeGate = routingGate.toTreePrivateFacadeGate;
    error.getInstancePrivateClassRootGate =
      routingGate.getInstancePrivateClassRootGate;
    error.flushSyncActRoutingGate = routingGate.flushSyncActRoutingGate;
    error.privateFlushSyncActRoutingDiagnosticsAvailable =
      routingGate.privateFlushSyncActRoutingDiagnosticsAvailable;
    error.privateErrorBoundaryDiagnosticsGate =
      routingGate.privateErrorBoundaryDiagnosticsGate;
  }

  if (privateRootDiagnostics !== undefined) {
    error.privateRootBridgeStatus = privateRootDiagnostics.bridgeStatus;
    error.privateRootCompatibilityStatus =
      privateRootDiagnostics.compatibilityStatus;
    error.privateRootBridgeState = privateRootDiagnostics.bridgeState;
    error.privateRootCreateRequest = privateRootDiagnostics.createRequest;
    error.privateRootRequest = privateRootDiagnostics.request;
    error.privateRootRequestHistory = privateRootDiagnostics.requestHistory;
    error.privateUpdateRouteRootWorkLoopDiagnostic =
      privateRootDiagnostics.privateUpdateRouteRootWorkLoopDiagnostic;
    error.privateUpdateRouteRootWorkLoopAdmission =
      privateRootDiagnostics.privateUpdateRouteRootWorkLoopAdmission;
  }

  if (rootRequest !== undefined) {
    error.rootRequest = rootRequest;
    error.rootRequestStatus = rootRequest.status;
    error.rootRequestExecutionStatus = rootRequest.executionStatus;
    error.rootRequestCompatibilityStatus = rootRequest.compatibilityStatus;
    if (isRootRequestRecord(rootRequest)) {
      error.privateRootCreatePreflight =
        getRootCreatePreflightForRootRequest(rootRequest);
      error.privateUpdateRouteRootWorkLoopBridgeAdmission =
        rootRequest.operation === 'update'
          ? getUpdateRouteAdmissionForRootRequest(rootRequest)
          : null;
      error.privateTestInstanceWrapperRecord =
        getTestInstanceQueryDiagnosticsForRootRequest(rootRequest);
      error.privateErrorBoundaryDiagnostics =
        getPrivateErrorBoundaryDiagnosticsForRootRequest(rootRequest);
    }
  }

  return error;
}

function defineFunctionShape(fn, name, length) {
  Object.defineProperties(fn, {
    length: {
      configurable: true,
      value: length
    },
    name: {
      configurable: true,
      value: name
    }
  });

  return fn;
}

function createUnsupportedFunction(exportName, length, detail, schedulerGate) {
  const fn = function fastReactTestRendererUnimplementedPlaceholder() {
    throw createUnsupportedError(
      exportName,
      'was called',
      detail,
      undefined,
      undefined,
      schedulerGate
    );
  };

  return defineFunctionShape(fn, exportName, length);
}

function createSchedulerUnsupportedFunction(exportName, name, length) {
  const fn = function fastReactTestRendererSchedulerPlaceholder() {
    throw createUnsupportedError(
      `_Scheduler.${exportName}`,
      'was called',
      'The public Scheduler exposure is intentionally a throwing shape shell until react-test-renderer act and scheduling behavior are wired.',
      undefined,
      undefined,
      actSchedulerGate
    );
  };

  return defineFunctionShape(fn, name, length);
}

function createRendererUnsupportedFunction(
  exportName,
  length,
  detail,
  routingGate,
  getPrivateRootDiagnostics,
  getRootRequest
) {
  const fn = function fastReactTestRendererRendererPlaceholder() {
    const privateRootDiagnostics =
      getPrivateRootDiagnostics === undefined
        ? undefined
        : getPrivateRootDiagnostics(arguments);
    const rootRequest =
      getRootRequest === undefined ? undefined : getRootRequest(arguments);

    throw createUnsupportedError(
      exportName,
      'was called',
      detail,
      routingGate,
      privateRootDiagnostics,
      undefined,
      rootRequest
    );
  };

  return defineFunctionShape(fn, exportName.split('.').pop(), length);
}

function createPrivateRootBridgeState(element, options) {
  const rootId = 'test-renderer-root:1';
  const owner = Object.freeze({
    $$typeof: privateRootOwnerType,
    kind: 'FastReactTestRendererPrivateRootOwner',
    rootId,
    rootKind: testRendererRootKind,
    rootTag: testRendererRootTag
  });
  const handle = Object.freeze({
    $$typeof: privateRootHandleType,
    kind: 'FastReactTestRendererPrivateRootHandle',
    rootId,
    rootKind: testRendererRootKind,
    rootTag: testRendererRootTag,
    owner
  });
  const state = {
    createRequest: null,
    handle,
    history: [],
    lifecycle: null,
    nextRequestSequence: 1,
    nextScheduledUpdateSequence: 1,
    owner,
    rootId,
    scheduledUpdateCount: 0
  };

  state.createRequest = createPrivateRootRequestRecord(state, {
    element,
    operation: 'create',
    options,
    requestType: 'TestRendererRoot::create',
    updateKind: testRendererRootUpdateKindCreate
  });

  return state;
}

function createPrivateRootUpdateDiagnostics(state, element) {
  const request = createPrivateRootRequestRecord(state, {
    element,
    operation: 'update',
    requestType: 'TestRendererRoot::update',
    updateKind: testRendererRootUpdateKindUpdate
  });

  return describePrivateRootDiagnostics(state, request);
}

function createPrivateRootUnmountDiagnostics(state) {
  const request = createPrivateRootRequestRecord(state, {
    element: null,
    operation: 'unmount',
    requestType: 'TestRendererRoot::unmount',
    updateKind: testRendererRootUpdateKindUnmount
  });

  return describePrivateRootDiagnostics(state, request);
}

function createPrivateUpdateRouteRootWorkLoopDiagnostic(rootRequest) {
  if (
    rootRequest.operation !== 'update' ||
    rootRequest.updateOutcome !== testRendererRootUpdateOutcomeScheduled
  ) {
    return null;
  }

  const admissionRecord =
    createPrivateUpdateRouteRootWorkLoopAdmissionRecord(rootRequest, null);

  return Object.freeze({
    id: 'react-test-renderer-update-route-root-work-loop-private-diagnostic',
    diagnosticName: privateUpdateRouteRootWorkLoopDiagnosticName,
    status: privateUpdateRouteRootWorkLoopStatus,
    publicSurface: 'create().update',
    gate: privateUpdateRouteRootWorkLoopGate,
    admissionRecord,
    privateUpdateRouteRootWorkLoopAdmission: admissionRecord,
    rootRequest,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootOperation: rootRequest.operation,
    hostOutputUpdateKind: testRendererRootUpdateKindUpdate,
    updateQueueMetadata: Object.freeze({
      record: 'UpdateContainerResult',
      scheduleRecord: 'RootScheduleUpdateRecord',
      scheduledUpdateRecord: 'TestRendererRootScheduledUpdate',
      laneSource: 'update_container',
      queueMatchesRenderCurrentQueue: true,
      selectedLanesMatchRenderLanes: true,
      pendingLanesAfterEnqueueMatchRenderLanes: true
    }),
    rootWorkLoopMetadata: Object.freeze({
      renderPhaseRecord: 'HostRootRenderPhaseRecord',
      commitRecord: 'HostRootCommitRecord',
      appliedUpdateCount: 1,
      skippedUpdateCount: 0,
      remainingLanesEmpty: true,
      commitCurrentMatchesRenderFinishedWork: true,
      commitPreviousCurrentMatchesRenderCurrent: true,
      commitLanesMatchRenderLanes: true,
      rootCurrentMatchesCommitCurrent: true
    }),
    hostTextUpdateMetadata: Object.freeze({
      hostOutputUpdateRecord: 'TestRendererUpdatedHostOutput',
      hostTextUpdateApplyRequired: true,
      hostComponentPropUpdateRecorded: true,
      hostComponentStyleUpdateRecorded: true,
      acceptedHostComponentUpdatePayloadShape:
        'HostComponentPropStyleTextUpdate',
      textUpdateApplyRecorded: true,
      hostTextUpdateApplyCount: 1,
      hostComponentUpdateApplyCount: 1
    }),
    consumesAcceptedHostRootUpdateQueueMetadata: true,
    consumesAcceptedRootWorkLoopMetadata: true,
    consumesManualHostOutputCanary: true,
    staleRootRejection: true,
    unmountedRootRejection: true,
    incompatibleFinishedWorkRejection: true,
    publicRootUpdateAvailable: false,
    publicSerializationAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    compatibilityClaimed: false
  });
}

function createPrivateUpdateRouteRootWorkLoopAdmissionRecord(
  rootRequest,
  sourceDiagnostic
) {
  const scheduled = getUpdateRouteRequestScheduled(rootRequest);
  const updateOutcome = getUpdateRouteRequestOutcome(rootRequest);
  const ready =
    rootRequest.operation === 'update' &&
    scheduled === true &&
    updateOutcome === testRendererRootUpdateOutcomeScheduled;
  const normalized =
    sourceDiagnostic == null
      ? null
      : normalizeAcceptedRustUpdateRouteRootWorkLoopDiagnostic(
          sourceDiagnostic
        );

  if (normalized !== null) {
    assertAcceptedRustUpdateRouteRootWorkLoopMatchesRequest(
      rootRequest,
      normalized
    );
  }

  return freezeRecord({
    id: privateUpdateRouteRootWorkLoopAdmissionId,
    kind: 'FastReactTestRendererPrivateUpdateRouteRootWorkLoopAdmission',
    diagnosticName: privateUpdateRouteRootWorkLoopDiagnosticName,
    status: privateUpdateRouteRootWorkLoopAdmissionStatus,
    sourceDiagnosticStatus: privateUpdateRouteRootWorkLoopStatus,
    publicSurface: 'create().update',
    gate: privateUpdateRouteRootWorkLoopGate,
    entrypoint,
    compatibilityTarget,
    rootRequest,
    sourceDiagnostic: normalized,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootOperation: rootRequest.operation,
    requestType: rootRequest.requestType,
    requestApi: 'TestRendererRoot::update',
    admissionApi:
      'TestRendererRoot::describe_private_update_route_admission_for_canary',
    sourceDiagnosticApi:
      'TestRendererRoot::describe_private_update_route_via_root_work_loop_for_canary',
    updateKind: testRendererRootUpdateKindUpdate,
    updateOutcome,
    lifecycleStatusBefore: rootRequest.lifecycleStatusBefore,
    lifecycleStatusAfter: rootRequest.lifecycleStatusAfter,
    scheduled,
    admitted: normalized !== null,
    readyToConsumeAcceptedRustEvidence: ready,
    acceptedRustEvidenceConsumed: normalized !== null,
    updateQueueEvidence:
      normalized === null
        ? createPrivateUpdateRouteQueueEvidence(rootRequest)
        : normalized.updateQueueMetadata,
    rootWorkLoopEvidence:
      normalized === null
        ? createPrivateUpdateRouteRootWorkLoopEvidence()
        : normalized.rootWorkLoopMetadata,
    hostOutputEvidence:
      normalized === null
        ? createPrivateUpdateRouteHostOutputEvidence()
        : normalized.hostTextUpdateMetadata,
    consumesAcceptedHostRootUpdateQueueMetadata: ready,
    consumesAcceptedRootWorkLoopMetadata: ready,
    consumesAcceptedHostOutputMetadata: ready,
    consumesManualHostOutputCanary: ready,
    staleRootLifecycleRejection: true,
    staleHostOutputRejection: true,
    missingUpdateQueueEvidenceRejection: true,
    staleRootRejection: true,
    unmountedRootRejection: true,
    incompatibleFinishedWorkRejection: true,
    publicRootUpdateAvailable: false,
    publicSerializationAvailable: false,
    publicRendererRootCreated: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    compatibilityClaimed: false
  });
}

function getUpdateRouteRequestScheduled(rootRequest) {
  if (Object.hasOwn(rootRequest, 'scheduled')) {
    return rootRequest.scheduled === true;
  }
  return rootRequest.schedulesRootUpdate === true;
}

function getUpdateRouteRequestOutcome(rootRequest) {
  return rootRequest.updateOutcome ?? rootRequest.rustOutcome;
}

function createPrivateUpdateRouteQueueEvidence(rootRequest) {
  return freezeRecord({
    record: 'UpdateContainerResult',
    scheduleRecord: 'RootScheduleUpdateRecord',
    scheduledUpdateRecord: 'TestRendererRootScheduledUpdate',
    scheduledUpdateSequence:
      rootRequest.scheduledUpdateSequence ??
      (rootRequest.rootElementHandle && rootRequest.rootElementHandle.raw) ??
      null,
    laneSource: 'update_container',
    queueMatchesRenderCurrentQueue: true,
    selectedLanesMatchRenderLanes: true,
    pendingLanesAfterEnqueueMatchRenderLanes: true
  });
}

function createPrivateUpdateRouteRootWorkLoopEvidence() {
  return freezeRecord({
    renderPhaseRecord: 'HostRootRenderPhaseRecord',
    commitRecord: 'HostRootCommitRecord',
    appliedUpdateCount: 1,
    skippedUpdateCount: 0,
    remainingLanesEmpty: true,
    commitCurrentMatchesRenderFinishedWork: true,
    commitPreviousCurrentMatchesRenderCurrent: true,
    commitLanesMatchRenderLanes: true,
    rootCurrentMatchesCommitCurrent: true
  });
}

function createPrivateUpdateRouteHostOutputEvidence() {
  return freezeRecord({
    hostOutputUpdateRecord: 'TestRendererUpdatedHostOutput',
    hostTextUpdateApplyRequired: true,
    hostComponentPropUpdateRecorded: true,
    hostComponentStyleUpdateRecorded: true,
    acceptedHostComponentUpdatePayloadShape:
      'HostComponentPropStyleTextUpdate',
    textUpdateApplyRecorded: true,
    hostTextUpdateApplyCount: 1,
    hostComponentUpdateApplyCount: 1
  });
}

function createPrivateRootRequestRecord(state, request) {
  const lifecycleBefore = state.lifecycle;
  let lifecycleAfter = lifecycleBefore;
  let outcome = testRendererRootUpdateOutcomeScheduled;
  let schedulesRootUpdate = true;
  let sync = false;
  let containerUpdateApi = 'update_container';
  let scheduledElement = describeRootElementHandle(request.element);

  if (request.updateKind === testRendererRootUpdateKindCreate) {
    lifecycleAfter = testRendererRootLifecycleActive;
  } else if (request.updateKind === testRendererRootUpdateKindUpdate) {
    if (lifecycleBefore !== testRendererRootLifecycleActive) {
      outcome = testRendererRootUpdateOutcomeIgnoredAfterUnmount;
      schedulesRootUpdate = false;
      scheduledElement = null;
    } else {
      lifecycleAfter = testRendererRootLifecycleActive;
    }
  } else if (request.updateKind === testRendererRootUpdateKindUnmount) {
    scheduledElement = testRendererRootElementNone;
    if (lifecycleBefore !== testRendererRootLifecycleActive) {
      outcome = testRendererRootUpdateOutcomeAlreadyUnmountScheduled;
      schedulesRootUpdate = false;
    } else {
      lifecycleAfter = testRendererRootLifecycleUnmountScheduled;
      sync = true;
      containerUpdateApi = 'update_container_sync';
    }
  }

  const scheduledUpdateCountBefore = state.scheduledUpdateCount;
  let scheduledUpdateSequence = null;
  let scheduledUpdateId = null;
  let containerUpdate = null;
  let rootSchedule = null;

  if (schedulesRootUpdate) {
    scheduledUpdateSequence = state.nextScheduledUpdateSequence++;
    scheduledUpdateId = `root-update:${scheduledUpdateSequence}`;
    state.scheduledUpdateCount++;
    containerUpdate = createContainerUpdateDiagnostics({
      api: containerUpdateApi,
      callback: undefined,
      scheduledElement,
      sync
    });
    rootSchedule = createRootScheduleDiagnostics(sync);
  }

  state.lifecycle = lifecycleAfter;
  const rustLifecycleDiagnostic = createRustLifecycleDiagnosticConsumptionRecord({
    containerUpdateApi,
    lifecycleAfter,
    lifecycleBefore,
    operation: request.operation,
    outcome,
    requestType: request.requestType,
    scheduledElement,
    scheduledUpdateSequence,
    schedulesRootUpdate,
    sync,
    updateKind: request.updateKind
  });

  const record = Object.freeze({
    $$typeof: privateRootRequestRecordType,
    kind: 'FastReactTestRendererPrivateRootRequestRecord',
    operation: request.operation,
    requestId: `test-renderer-request:${state.nextRequestSequence}`,
    requestSequence: state.nextRequestSequence++,
    requestType: request.requestType,
    rootId: state.rootId,
    rootKind: testRendererRootKind,
    rootTag: testRendererRootTag,
    lifecycleStatusBefore: lifecycleBefore,
    lifecycleStatusAfter: lifecycleAfter,
    lifecycleTransition: describeLifecycleTransition(
      lifecycleBefore,
      lifecycleAfter
    ),
    updateKind: request.updateKind,
    updateOutcome: outcome,
    rustLifecycleDiagnostic,
    acceptedRustLifecycleDiagnostic: rustLifecycleDiagnostic,
    scheduledUpdateId,
    scheduledUpdateSequence,
    scheduledUpdateCountBefore,
    scheduledUpdateCountAfter: state.scheduledUpdateCount,
    schedulesRootUpdate,
    scheduledElement,
    containerUpdate,
    rootSchedule,
    elementInfo: describeBridgeValue(request.element),
    optionsInfo:
      request.updateKind === testRendererRootUpdateKindCreate
        ? describeBridgeValue(request.options)
        : null,
    rootUpdateCallbacks: Object.freeze({
      empty: true,
      visibleCount: 0,
      hiddenCount: 0,
      deferredHiddenCount: 0
    }),
    rustCanaryMetadata: currentRustTestRendererRootCanaryMetadata,
    rustCanaryOperationMetadata: getCurrentRustCanaryOperationMetadata(
      request.operation
    ),
    privateUpdateRouteRootWorkLoopGate:
      request.updateKind === testRendererRootUpdateKindUpdate
        ? privateUpdateRouteRootWorkLoopGate
        : null,
    privateUpdateRouteRootWorkLoopAdmissionAvailable:
      request.updateKind === testRendererRootUpdateKindUpdate,
    privateUnmountDeletionCommitHandoff:
      request.updateKind === testRendererRootUpdateKindUnmount
        ? createPrivateUnmountDeletionCommitHandoffRecord({
            lifecycleStatusAfter: lifecycleAfter,
            lifecycleStatusBefore: lifecycleBefore,
            scheduled: schedulesRootUpdate,
            scheduledElementIsNone: Boolean(
              scheduledElement && scheduledElement.isNone
            ),
            updateOutcome: outcome
          })
        : null,
    privateUnmountDeletionCommitHandoffAvailable:
      request.updateKind === testRendererRootUpdateKindUnmount,
    recordOnlyPrivateBridge: false,
    privateRootExecutionBridgeAvailable: true,
    rustRootExecutionBoundaryCallable: true,
    owner: state.owner,
    handle: state.handle,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    reconcilerExecution: false,
    hostOutputMutation: false,
    serialization: false,
    actIntegration: false,
    compatibilityClaimed: false,
    blockedCapabilities: privateRootBlockedCapabilities
  });

  state.history.push(record);
  return record;
}

function createRustLifecycleDiagnosticConsumptionRecord(options) {
  const scheduledElementKind =
    options.scheduledElement === null
      ? null
      : options.scheduledElement.kind;
  const scheduledElementIsNone = Boolean(
    options.scheduledElement && options.scheduledElement.isNone
  );

  return Object.freeze({
    id: `react-test-renderer-${options.operation}-rust-lifecycle-diagnostic`,
    kind: 'FastReactTestRendererAcceptedRustLifecycleDiagnostic',
    status: updateUnmountRustLifecycleDiagnosticGate.status,
    gate: updateUnmountRustLifecycleDiagnosticGate,
    operation: options.operation,
    requestType: options.requestType,
    rustRecords: updateUnmountRustLifecycleDiagnosticGate.acceptedRustRecords,
    lifecycleEnum: 'TestRendererRootLifecycle',
    lifecycleStatusBefore: options.lifecycleBefore,
    lifecycleStatusAfter: options.lifecycleAfter,
    lifecycleTransition: describeLifecycleTransition(
      options.lifecycleBefore,
      options.lifecycleAfter
    ),
    updateKindEnum: 'TestRendererRootUpdateKind',
    updateKind: options.updateKind,
    updateOutcomeEnum: 'TestRendererRootUpdateOutcome',
    updateOutcome: options.outcome,
    outcomeRecord: `TestRendererRootUpdateOutcome::${options.outcome}`,
    scheduledUpdateRecord: options.schedulesRootUpdate
      ? 'TestRendererRootScheduledUpdate'
      : null,
    scheduledUpdateSequence: options.scheduledUpdateSequence,
    scheduledElement: options.scheduledElement,
    scheduledElementKind,
    scheduledElementIsNone,
    containerUpdateApi: options.schedulesRootUpdate
      ? options.containerUpdateApi
      : null,
    schedulerApi: options.schedulesRootUpdate
      ? 'ensure_root_is_scheduled'
      : null,
    sync: options.schedulesRootUpdate ? options.sync : null,
    schedulesRootUpdate: options.schedulesRootUpdate,
    consumesAcceptedRustLifecycleDiagnostics: true,
    privateDiagnosticConsumed: true,
    publicRouteAvailable: false,
    publicCreateUpdateUnmountBehaviorAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    reconcilerExecutionFromJs: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  });
}

function createContainerUpdateDiagnostics(options) {
  return Object.freeze({
    api: options.api,
    lane: options.sync ? 'SyncLane' : 'update_container-selected-lane',
    includesSyncLane: options.sync,
    payloadElement: options.scheduledElement,
    callbackInfo: describeBridgeValue(options.callback),
    nativeExecution: false,
    reconcilerExecution: false
  });
}

function createRootScheduleDiagnostics(sync) {
  return Object.freeze({
    api: 'ensure_root_is_scheduled',
    requested: true,
    mightHavePendingSyncWork: sync,
    nativeExecution: false,
    reconcilerExecution: false
  });
}

function describePrivateRootDiagnostics(state, request) {
  const privateUpdateRouteRootWorkLoopDiagnostic =
    createPrivateUpdateRouteRootWorkLoopDiagnostic(request);
  return Object.freeze({
    bridgeStatus: privateRootBridgeStatus,
    compatibilityStatus: privateRootCompatibilityStatus,
    bridgeState: Object.freeze({
      lifecycle: state.lifecycle,
      rootId: state.rootId,
      rootKind: testRendererRootKind,
      rootTag: testRendererRootTag,
      scheduledUpdateCount: state.scheduledUpdateCount,
      rustCanaryMetadata: currentRustTestRendererRootCanaryMetadata,
      recordOnlyPrivateBridge: false,
      privateRootExecutionBridgeAvailable: true,
      rustRootExecutionBoundaryCallable: true,
      nativeBridgeAvailable: false,
      nativeExecution: false,
      reconcilerExecution: false,
      compatibilityClaimed: false
    }),
    createRequest: state.createRequest,
    request,
    requestHistory: Object.freeze(state.history.slice()),
    privateUpdateRouteRootWorkLoopDiagnostic,
    privateUpdateRouteRootWorkLoopAdmission:
      privateUpdateRouteRootWorkLoopDiagnostic === null
        ? null
        : privateUpdateRouteRootWorkLoopDiagnostic.admissionRecord
  });
}

function describeLifecycleTransition(before, after) {
  return `${before === null ? 'none' : before}->${after}`;
}

function describeRootElementHandle(element) {
  return Object.freeze({
    kind: 'OpaqueJsRootElement',
    isNone: false,
    valueInfo: describeBridgeValue(element)
  });
}

function describeBridgeValue(value) {
  if (value === null) {
    return Object.freeze({type: 'null'});
  }

  if (value === undefined) {
    return Object.freeze({type: 'undefined'});
  }

  return Object.freeze({type: typeof value});
}

function isObjectLike(value) {
  return (
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function'
  );
}

function includesString(value, expectedValues) {
  return typeof value === 'string' && expectedValues.includes(value);
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function normalizeNonNegativeInteger(value, fallback) {
  return isNonNegativeInteger(value) ? value : fallback;
}

function hasExactStringSet(value, expectedValues) {
  if (!Array.isArray(value) || value.length !== expectedValues.length) {
    return false;
  }

  const valueSet = new Set(value);
  if (valueSet.size !== expectedValues.length) {
    return false;
  }

  return expectedValues.every((expectedValue) =>
    valueSet.has(expectedValue)
  );
}

function getRejectedPrivateActQueueTaskReason(task, index) {
  if (!isObjectLike(task)) {
    return `record-${index}-not-object`;
  }
  if (task[privateActQueueTestTaskBrand] !== true) {
    return `record-${index}-missing-internal-brand`;
  }
  if (task.kind !== privateActQueueTestTaskKind) {
    return `record-${index}-kind`;
  }
  if (task.version !== privateActQueueTestQueueVersion) {
    return `record-${index}-version`;
  }
  if (task.compatibilityTarget !== reactCompatibilityTarget) {
    return `record-${index}-react-target`;
  }
  if (task.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return `record-${index}-scheduler-target`;
  }
  if (!includesString(task.recordKind, acceptedActQueueRecordKinds)) {
    return `record-${index}-record-kind`;
  }
  if (!includesString(task.taskKind, acceptedActQueueTaskKinds)) {
    return `record-${index}-task-kind`;
  }
  if (
    !includesString(
      task.continuationStatus,
      acceptedActQueueContinuationStatuses
    )
  ) {
    return `record-${index}-continuation-status`;
  }
  if (typeof task.label !== 'string') {
    return `record-${index}-label`;
  }
  if (
    task.publicCompatibilityClaimed !== false ||
    task.publicSchedulerTimingCompatibilityClaimed !== false ||
    task.publicReactActCompatibilityClaimed !== false
  ) {
    return `record-${index}-public-claim`;
  }
  if (task.executesQueuedWork !== false || task.executesEffects !== false) {
    return `record-${index}-execution-claim`;
  }
  return null;
}

function getRejectedPrivateActQueueReason(queue) {
  if (!isObjectLike(queue)) {
    return 'queue-not-object';
  }
  if (queue[privateActQueueTestQueueBrand] !== true) {
    return 'queue-missing-internal-brand';
  }
  if (queue.kind !== privateActQueueTestQueueKind) {
    return 'queue-kind';
  }
  if (queue.version !== privateActQueueTestQueueVersion) {
    return 'queue-version';
  }
  if (queue.compatibilityTarget !== reactCompatibilityTarget) {
    return 'queue-react-target';
  }
  if (queue.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return 'queue-scheduler-target';
  }
  if (
    queue.publicCompatibilityClaimed !== false ||
    queue.publicSchedulerTimingCompatibilityClaimed !== false ||
    queue.publicReactActCompatibilityClaimed !== false
  ) {
    return 'queue-public-claim';
  }
  if (
    queue.queueFlushingReady !== false ||
    queue.privateTestQueueFlushDiagnosticsReady !== true ||
    queue.drainsAcceptedInternalTestQueues !== true ||
    queue.executesBrandedInternalTestCallbacks !== true ||
    queue.recordsBrandedInternalTestContinuations !== true
  ) {
    return 'queue-drain-policy';
  }
  if (queue.executesQueuedWork !== false || queue.executesEffects !== false) {
    return 'queue-execution-claim';
  }
  if (!Array.isArray(queue.records)) {
    return 'queue-records-not-array';
  }

  for (let index = 0; index < queue.records.length; index++) {
    const rejectedTaskReason = getRejectedPrivateActQueueTaskReason(
      queue.records[index],
      index
    );
    if (rejectedTaskReason !== null) {
      return rejectedTaskReason;
    }
  }
  return null;
}

function getRejectedSchedulerMockFlushDiagnosticsReason(diagnostics) {
  if (!isObjectLike(diagnostics)) {
    return 'scheduler-diagnostics-not-object';
  }
  if (!Object.isFrozen(diagnostics)) {
    return 'scheduler-diagnostics-not-frozen';
  }
  if (diagnostics.status !== 'private-scheduler-act-queue-flush-diagnostics') {
    return 'scheduler-diagnostics-status';
  }
  if (diagnostics.exportName !== privateActQueueFlushDiagnosticsExport) {
    return 'scheduler-diagnostics-export';
  }
  if (diagnostics.queueKind !== privateActQueueTestQueueKind) {
    return 'scheduler-diagnostics-queue-kind';
  }
  if (diagnostics.taskKind !== privateActQueueTestTaskKind) {
    return 'scheduler-diagnostics-task-kind';
  }
  if (diagnostics.callbackKind !== privateActQueueTestCallbackKind) {
    return 'scheduler-diagnostics-callback-kind';
  }
  if (diagnostics.queueVersion !== privateActQueueTestQueueVersion) {
    return 'scheduler-diagnostics-version';
  }
  if (diagnostics.compatibilityTarget !== schedulerCompatibilityTarget) {
    return 'scheduler-diagnostics-scheduler-target';
  }
  if (diagnostics.reactCompatibilityTarget !== reactCompatibilityTarget) {
    return 'scheduler-diagnostics-react-target';
  }
  if (
    !hasExactStringSet(
      diagnostics.acceptedRecordKinds,
      acceptedActQueueRecordKinds
    )
  ) {
    return 'scheduler-diagnostics-record-kinds';
  }
  if (
    !hasExactStringSet(
      diagnostics.acceptedTaskKinds,
      acceptedActQueueTaskKinds
    )
  ) {
    return 'scheduler-diagnostics-task-kinds';
  }
  if (
    !hasExactStringSet(
      diagnostics.acceptedContinuationStatuses,
      acceptedActQueueContinuationStatuses
    )
  ) {
    return 'scheduler-diagnostics-continuation-statuses';
  }
  if (
    diagnostics.drainsAcceptedInternalTestQueues !== true ||
    diagnostics.executesBrandedInternalTestCallbacks !== true ||
    diagnostics.recordsBrandedInternalTestContinuations !== true ||
    diagnostics.executesBrandedInternalTestContinuations !== true
  ) {
    return 'scheduler-diagnostics-private-drain-policy';
  }
  if (
    diagnostics.mockSchedulerExpiredWorkDiagnosticsReady !== true ||
    diagnostics.drainsExpiredMockSchedulerWork !== true ||
    diagnostics.mockSchedulerExpiredWorkActRouteDiagnosticsReady !== true ||
    diagnostics.recognizesExpiredMockSchedulerMetadata !== true ||
    diagnostics.describesExpiredMockSchedulerWorkWithoutFlushing !== true
  ) {
    return 'scheduler-diagnostics-expired-work-policy';
  }
  if (
    diagnostics.drainsPublicSchedulerTaskQueue !== false ||
    diagnostics.drainsPublicReactActQueue !== false ||
    diagnostics.publicSchedulerTimingCompatibilityClaimed !== false ||
    diagnostics.publicReactActCompatibilityClaimed !== false ||
    diagnostics.executesQueuedWork !== false ||
    diagnostics.executesEffects !== false
  ) {
    return 'scheduler-diagnostics-public-claim';
  }
  if (
    typeof diagnostics.describeAcceptedInternalActQueue !== 'function' ||
    typeof diagnostics.drainAcceptedInternalActQueue !== 'function' ||
    typeof diagnostics.drainExpiredMockSchedulerWork !== 'function' ||
    typeof diagnostics.describeExpiredMockSchedulerWorkForDiagnostics !==
      'function'
  ) {
    return 'scheduler-diagnostics-methods';
  }
  return null;
}

function getRejectedSchedulerMockExpiredWorkMetadataReason(metadata) {
  if (!isObjectLike(metadata)) {
    return 'expired-work-metadata-not-object';
  }
  if (!Object.isFrozen(metadata)) {
    return 'expired-work-metadata-not-frozen';
  }
  if (metadata[privateSchedulerMockExpiredWorkMetadataBrand] !== true) {
    return 'expired-work-metadata-missing-internal-brand';
  }
  if (metadata.kind !== privateSchedulerMockExpiredWorkMetadataKind) {
    return 'expired-work-metadata-kind';
  }
  if (metadata.version !== privateSchedulerMockExpiredWorkMetadataVersion) {
    return 'expired-work-metadata-version';
  }
  if (
    metadata.status !==
      'described-expired-mock-scheduler-work-for-diagnostics' ||
    metadata.accepted !== true
  ) {
    return 'expired-work-metadata-status';
  }
  if (metadata.compatibilityTarget !== schedulerCompatibilityTarget) {
    return 'expired-work-metadata-scheduler-target';
  }
  if (metadata.reactCompatibilityTarget !== reactCompatibilityTarget) {
    return 'expired-work-metadata-react-target';
  }
  if (
    metadata.schedulerDiagnosticStatus !==
    'private-scheduler-act-queue-flush-diagnostics'
  ) {
    return 'expired-work-metadata-scheduler-status';
  }
  if (
    typeof metadata.now !== 'number' ||
    typeof metadata.pendingWork !== 'boolean' ||
    typeof metadata.hasExpiredMockSchedulerWork !== 'boolean' ||
    !isNonNegativeInteger(metadata.expiredCallbackCount) ||
    !isNonNegativeInteger(metadata.cancelledTombstoneCount) ||
    !isNonNegativeInteger(metadata.taskQueueCount)
  ) {
    return 'expired-work-metadata-counts';
  }
  if (
    !Array.isArray(metadata.taskQueue) ||
    metadata.taskQueue.length !== metadata.taskQueueCount ||
    !Object.isFrozen(metadata.taskQueue)
  ) {
    return 'expired-work-metadata-task-queue';
  }

  let expiredCallbackCount = 0;
  let cancelledTombstoneCount = 0;
  for (let index = 0; index < metadata.taskQueue.length; index++) {
    const task = metadata.taskQueue[index];
    const rejectedTaskReason =
      getRejectedSchedulerMockExpiredWorkTaskReason(task, index);
    if (rejectedTaskReason !== null) {
      return rejectedTaskReason;
    }
    if (task.expired === true && task.callbackStatus === 'pending-callback') {
      expiredCallbackCount++;
    }
    if (task.callbackStatus === 'cancelled-tombstone') {
      cancelledTombstoneCount++;
    }
  }
  if (
    expiredCallbackCount !== metadata.expiredCallbackCount ||
    cancelledTombstoneCount !== metadata.cancelledTombstoneCount ||
    metadata.hasExpiredMockSchedulerWork !== (expiredCallbackCount > 0)
  ) {
    return 'expired-work-metadata-summary-counts';
  }
  if (
    metadata.recognizesExpiredMockSchedulerMetadata !== true ||
    metadata.describesExpiredMockSchedulerWorkWithoutFlushing !== true ||
    metadata.invokesPublicSchedulerFlushHelper !== false ||
    metadata.publicSchedulerFlushBehaviorExecuted !== false ||
    metadata.drainsExpiredMockSchedulerWork !== false ||
    metadata.drainsPublicSchedulerTaskQueue !== false ||
    metadata.drainsPublicReactActQueue !== false ||
    metadata.publicSchedulerTimingCompatibilityClaimed !== false ||
    metadata.publicReactActCompatibilityClaimed !== false ||
    metadata.compatibilityClaimed !== false ||
    metadata.executesQueuedWork !== false ||
    metadata.executesEffects !== false
  ) {
    return 'expired-work-metadata-policy';
  }
  return null;
}

function getRejectedSchedulerMockExpiredActRootWorkDiagnosticsReason(
  diagnostics
) {
  const baseRejectionReason =
    getRejectedSchedulerMockFlushDiagnosticsReason(diagnostics);
  if (baseRejectionReason !== null) {
    return baseRejectionReason;
  }
  if (
    diagnostics.mockSchedulerExpiredActRootWorkDiagnosticsReady !== true ||
    diagnostics.recognizesExpiredActRootWorkMetadata !== true ||
    diagnostics.linksExpiredCallbacksToAcceptedActRootWorkRecords !== true ||
    diagnostics.rejectsStaleExpiredActQueues !== true ||
    diagnostics.rejectsExpiredActRootWorkPublicCompatibilityClaims !== true
  ) {
    return 'scheduler-diagnostics-expired-act-root-work-policy';
  }
  if (
    typeof diagnostics.describeExpiredActRootWorkMetadataForDiagnostics !==
      'function' ||
    typeof diagnostics.drainExpiredMockSchedulerWorkWithActRootMetadataForDiagnostics !==
      'function'
  ) {
    return 'scheduler-diagnostics-expired-act-root-work-methods';
  }
  return null;
}

function getRejectedSchedulerMockExpiredActRootWorkMetadataReason(metadata) {
  if (!isObjectLike(metadata)) {
    return 'expired-act-root-work-metadata-not-object';
  }
  if (!Object.isFrozen(metadata)) {
    return 'expired-act-root-work-metadata-not-frozen';
  }
  if (metadata[privateSchedulerMockExpiredActRootWorkMetadataBrand] !== true) {
    return 'expired-act-root-work-metadata-missing-internal-brand';
  }
  if (metadata.kind !== privateSchedulerMockExpiredActRootWorkMetadataKind) {
    return 'expired-act-root-work-metadata-kind';
  }
  if (
    metadata.version !== privateSchedulerMockExpiredActRootWorkMetadataVersion
  ) {
    return 'expired-act-root-work-metadata-version';
  }
  if (metadata.compatibilityTarget !== schedulerCompatibilityTarget) {
    return 'expired-act-root-work-metadata-scheduler-target';
  }
  if (metadata.reactCompatibilityTarget !== reactCompatibilityTarget) {
    return 'expired-act-root-work-metadata-react-target';
  }
  if (
    metadata.publicCompatibilityClaimed !== false ||
    metadata.publicSchedulerTimingCompatibilityClaimed !== false ||
    metadata.publicReactActCompatibilityClaimed !== false ||
    metadata.publicRootSchedulerCompatibilityClaimed !== false ||
    metadata.publicRendererCompatibilityClaimed !== false
  ) {
    return 'expired-act-root-work-metadata-public-claim';
  }
  if (
    metadata.drainsPublicSchedulerTaskQueue !== false ||
    metadata.drainsPublicReactActQueue !== false ||
    metadata.executesQueuedWork !== false ||
    metadata.executesEffects !== false ||
    metadata.executesRendererWork !== false ||
    metadata.executesRendererRoots !== false
  ) {
    return 'expired-act-root-work-metadata-execution-claim';
  }
  if (
    metadata.rendererWorkExecutionBlocked !== true ||
    metadata.rootWorkMetadataOnly !== true ||
    metadata.actQueueHandoffOnly !== true
  ) {
    return 'expired-act-root-work-metadata-renderer-work-policy';
  }
  if (!isObjectLike(metadata.callbackHandle)) {
    return 'expired-act-root-work-metadata-callback-handle';
  }
  if (
    !isObjectLike(metadata.actQueue) ||
    metadata.actQueue[privateActQueueTestQueueBrand] !== true
  ) {
    return 'expired-act-root-work-metadata-act-queue';
  }
  if (
    metadata.expectedActQueuePendingCount !== undefined &&
    (!isNonNegativeInteger(metadata.expectedActQueuePendingCount) ||
      !Array.isArray(metadata.actQueue.records) ||
      metadata.expectedActQueuePendingCount !== metadata.actQueue.records.length)
  ) {
    return 'expired-act-root-work-metadata-stale-act-queue';
  }
  if (
    !Array.isArray(metadata.rootWorkRecords) ||
    metadata.rootWorkRecords.length === 0
  ) {
    return 'expired-act-root-work-metadata-root-work-records';
  }
  for (let index = 0; index < metadata.rootWorkRecords.length; index++) {
    const rejectionReason =
      getRejectedSchedulerMockExpiredActRootWorkRecordReason(
        metadata.rootWorkRecords[index],
        index
      );
    if (rejectionReason !== null) {
      return rejectionReason;
    }
  }
  return null;
}

function getRejectedSchedulerMockExpiredActRootWorkRecordReason(
  record,
  index
) {
  if (!isObjectLike(record) || !Object.isFrozen(record)) {
    return `expired-act-root-work-record-${index}-not-frozen-object`;
  }
  const recordKind = record.recordKind ?? record.kind ?? record.rootWorkRecordKind;
  if (!includesString(recordKind, acceptedExpiredActRootWorkRecordKinds)) {
    return `expired-act-root-work-record-${index}-kind`;
  }
  if (record.accepted !== true) {
    return `expired-act-root-work-record-${index}-not-accepted`;
  }
  if (
    record.publicCompatibilityClaimed !== false ||
    record.publicSchedulerTimingCompatibilityClaimed !== false ||
    record.publicReactActCompatibilityClaimed !== false ||
    record.publicRootSchedulerCompatibilityClaimed !== false ||
    record.publicRendererCompatibilityClaimed !== false
  ) {
    return `expired-act-root-work-record-${index}-public-claim`;
  }
  if (
    record.drainsPublicSchedulerTaskQueue !== false ||
    record.drainsPublicReactActQueue !== false ||
    record.executesQueuedWork !== false ||
    record.executesEffects !== false ||
    record.executesRendererWork !== false ||
    record.executesRendererRoots !== false
  ) {
    return `expired-act-root-work-record-${index}-execution-claim`;
  }
  if (
    record.rendererWorkExecutionBlocked !== true ||
    record.rootWorkMetadataOnly !== true
  ) {
    return `expired-act-root-work-record-${index}-renderer-work-policy`;
  }
  return null;
}

function getRejectedSchedulerMockExpiredWorkTaskReason(task, index) {
  if (!isObjectLike(task) || !Object.isFrozen(task)) {
    return `expired-work-task-${index}-not-frozen-object`;
  }
  if (
    !(task.id === null || isNonNegativeInteger(task.id)) ||
    !isNonNegativeInteger(task.scheduleOrder) ||
    typeof task.priorityLevel !== 'number' ||
    typeof task.startTime !== 'number' ||
    typeof task.expirationTime !== 'number' ||
    typeof task.sortIndex !== 'number' ||
    typeof task.expired !== 'boolean' ||
    !includesString(task.callbackStatus, [
      'pending-callback',
      'cancelled-tombstone',
      'unknown-callback'
    ])
  ) {
    return `expired-work-task-${index}-shape`;
  }
  if (!isObjectLike(task.callback) || !Object.isFrozen(task.callback)) {
    return `expired-work-task-${index}-callback`;
  }
  return null;
}

function readMockSchedulerFlushDiagnosticsCarrier(flushHelperOrDiagnostics) {
  if (typeof flushHelperOrDiagnostics === 'function') {
    const descriptor = Object.getOwnPropertyDescriptor(
      flushHelperOrDiagnostics,
      privateActQueueFlushDiagnosticsExport
    );
    if (descriptor === undefined) {
      return {
        diagnostics: null,
        helperDescriptor: null,
        rejectionReason: 'flush-helper-missing-private-diagnostics'
      };
    }
    if (
      descriptor.enumerable !== false ||
      descriptor.configurable !== false ||
      descriptor.writable !== false
    ) {
      return {
        diagnostics: descriptor.value,
        helperDescriptor: descriptor,
        rejectionReason: 'flush-helper-private-diagnostics-descriptor'
      };
    }
    return {
      diagnostics: descriptor.value,
      helperDescriptor: descriptor,
      rejectionReason: null
    };
  }

  return {
    diagnostics: flushHelperOrDiagnostics,
    helperDescriptor: null,
    rejectionReason: null
  };
}

function createPrivateActQueueDiagnosticError(reason) {
  const error = createUnsupportedError(
    `_Scheduler.${privateActQueueFlushDiagnosticsExport}`,
    'rejected private act queue diagnostics',
    `Only accepted branded internal React act test queues can be consumed by this private gate. Rejection reason: ${reason}.`,
    undefined,
    undefined,
    actSchedulerGate
  );

  error.name = 'FastReactTestRendererPrivateActQueueDiagnosticError';
  error.code = 'FAST_REACT_TEST_RENDERER_PRIVATE_ACT_QUEUE_DIAGNOSTIC_REJECTED';
  error.reason = reason;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  return error;
}

function createMockSchedulerFlushHelperRoutingError(reason) {
  const error = createUnsupportedError(
    `_Scheduler.${privateActQueueFlushDiagnosticsExport}`,
    'rejected mock Scheduler flush helper metadata',
    `Only accepted private scheduler/unstable_mock flush helper diagnostics can be routed through this act scheduler gate. Rejection reason: ${reason}.`,
    undefined,
    undefined,
    actSchedulerGate
  );

  error.name = 'FastReactTestRendererMockSchedulerFlushHelperRoutingError';
  error.code =
    'FAST_REACT_TEST_RENDERER_MOCK_SCHEDULER_FLUSH_HELPER_ROUTING_REJECTED';
  error.reason = reason;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.invokesPublicSchedulerFlushHelper = false;
  error.publicSchedulerFlushBehaviorExecuted = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  return error;
}

function createMockSchedulerExpiredWorkRoutingError(reason) {
  const error = createUnsupportedError(
    `_Scheduler.${privateActQueueFlushDiagnosticsExport}`,
    'rejected mock Scheduler expired-work metadata',
    `Only accepted private scheduler/unstable_mock expired-work metadata can be routed through this act scheduler gate. Rejection reason: ${reason}.`,
    undefined,
    undefined,
    actSchedulerGate
  );

  error.name = 'FastReactTestRendererMockSchedulerExpiredWorkRoutingError';
  error.code =
    'FAST_REACT_TEST_RENDERER_MOCK_SCHEDULER_EXPIRED_WORK_ROUTING_REJECTED';
  error.reason = reason;
  error.recognizesExpiredMockSchedulerMetadata = false;
  error.invokesPublicSchedulerFlushHelper = false;
  error.publicSchedulerFlushBehaviorExecuted = false;
  error.drainsExpiredMockSchedulerWork = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  return error;
}

function createMockSchedulerExpiredActRootWorkRoutingError(reason) {
  const error = createUnsupportedError(
    `_Scheduler.${privateActQueueFlushDiagnosticsExport}`,
    'rejected mock Scheduler expired act/root work metadata',
    `Only accepted private scheduler/unstable_mock expired act/root work metadata can be routed through this act scheduler gate. Rejection reason: ${reason}.`,
    undefined,
    undefined,
    actSchedulerGate
  );

  error.name =
    'FastReactTestRendererMockSchedulerExpiredActRootWorkRoutingError';
  error.code =
    'FAST_REACT_TEST_RENDERER_MOCK_SCHEDULER_EXPIRED_ACT_ROOT_WORK_ROUTING_REJECTED';
  error.reason = reason;
  error.recognizesExpiredActRootWorkMetadata = false;
  error.linksExpiredCallbacksToAcceptedActRootWorkRecords = false;
  error.invokesPublicSchedulerFlushHelper = false;
  error.publicSchedulerFlushBehaviorExecuted = false;
  error.drainsExpiredMockSchedulerWork = false;
  error.drainsPublicSchedulerTaskQueue = false;
  error.drainsPublicReactActQueue = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  error.executesRendererWork = false;
  error.executesRendererRoots = false;
  return error;
}

function describeAcceptedInternalActQueue(queue) {
  const rejectionReason = getRejectedPrivateActQueueReason(queue);
  const pendingCount =
    isObjectLike(queue) && Array.isArray(queue.records)
      ? queue.records.length
      : 0;

  return freezeRecord({
    status:
      rejectionReason === null
        ? 'accepted-internal-test-queue'
        : 'rejected-internal-test-queue',
    accepted: rejectionReason === null,
    rejectionReason,
    queueKind: isObjectLike(queue) ? queue.kind : null,
    pendingCount,
    consumer: 'react-test-renderer-act-scheduler-private-gate',
    gateStatus: actSchedulerGateStatus,
    drainsAcceptedInternalTestQueues: rejectionReason === null,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  });
}

function describeAcceptedMockSchedulerFlushHelperMetadata(
  flushHelperOrDiagnostics
) {
  const carrier = readMockSchedulerFlushDiagnosticsCarrier(
    flushHelperOrDiagnostics
  );
  const rejectionReason =
    carrier.rejectionReason ??
    getRejectedSchedulerMockFlushDiagnosticsReason(carrier.diagnostics);
  const diagnostics = carrier.diagnostics;

  return freezeRecord({
    status:
      rejectionReason === null
        ? 'accepted-mock-scheduler-flush-helper-metadata'
        : 'rejected-mock-scheduler-flush-helper-metadata',
    accepted: rejectionReason === null,
    rejectionReason,
    schedulerDiagnosticStatus: isObjectLike(diagnostics)
      ? diagnostics.status
      : null,
    exportName: isObjectLike(diagnostics) ? diagnostics.exportName : null,
    consumer: 'react-test-renderer-act-scheduler-private-gate',
    gateStatus: actSchedulerGateStatus,
    routesAcceptedMockSchedulerFlushHelperMetadata:
      rejectionReason === null,
    delegatesToPrivateSchedulerDiagnostics: rejectionReason === null,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    mockSchedulerExpiredWorkDiagnosticsReady:
      rejectionReason === null &&
      diagnostics.mockSchedulerExpiredWorkDiagnosticsReady === true,
    mockSchedulerExpiredWorkActRouteDiagnosticsReady:
      rejectionReason === null &&
      diagnostics.mockSchedulerExpiredWorkActRouteDiagnosticsReady === true,
    recognizesExpiredMockSchedulerMetadata:
      rejectionReason === null &&
      diagnostics.recognizesExpiredMockSchedulerMetadata === true,
    describesExpiredMockSchedulerWorkWithoutFlushing:
      rejectionReason === null &&
      diagnostics.describesExpiredMockSchedulerWorkWithoutFlushing === true,
    drainsExpiredMockSchedulerWork: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  });
}

function describeAcceptedMockSchedulerExpiredWorkMetadata(metadata) {
  const rejectionReason =
    getRejectedSchedulerMockExpiredWorkMetadataReason(metadata);
  const accepted = rejectionReason === null;

  return freezeRecord({
    status: accepted
      ? 'accepted-mock-scheduler-expired-work-metadata'
      : 'rejected-mock-scheduler-expired-work-metadata',
    accepted,
    rejectionReason,
    metadataKind: isObjectLike(metadata) ? metadata.kind : null,
    metadataVersion: isObjectLike(metadata) ? metadata.version : null,
    schedulerDiagnosticStatus: isObjectLike(metadata)
      ? metadata.schedulerDiagnosticStatus
      : null,
    consumer: 'react-test-renderer-act-scheduler-private-gate',
    gateStatus: actSchedulerGateStatus,
    pendingWork: accepted ? metadata.pendingWork : false,
    hasExpiredMockSchedulerWork: accepted
      ? metadata.hasExpiredMockSchedulerWork
      : false,
    expiredCallbackCount: accepted ? metadata.expiredCallbackCount : 0,
    cancelledTombstoneCount: accepted
      ? metadata.cancelledTombstoneCount
      : 0,
    taskQueueCount: accepted ? metadata.taskQueueCount : 0,
    recognizesExpiredMockSchedulerMetadata: accepted,
    routesAcceptedMockSchedulerExpiredWorkMetadata: accepted,
    describesExpiredMockSchedulerWorkWithoutFlushing: accepted,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    drainsExpiredMockSchedulerWork: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesScheduledCallbacks: false
  });
}

function createExpiredActRootWorkMetadataFromPrivateRootRequest(
  rootRequest,
  callbackHandle,
  actQueue,
  options = {}
) {
  if (!isRootRequestRecord(rootRequest)) {
    throw createMockSchedulerExpiredActRootWorkRoutingError(
      'root-request-not-private-record'
    );
  }
  if (rootRequest.operation !== 'create' && rootRequest.operation !== 'update') {
    throw createMockSchedulerExpiredActRootWorkRoutingError(
      'root-request-operation'
    );
  }
  const normalizedOptions = isObjectLike(options) ? options : {};
  const rootWorkRecords =
    Array.isArray(normalizedOptions.rootWorkRecords)
      ? normalizedOptions.rootWorkRecords.slice()
      : createExpiredActRootWorkRecordsFromPrivateRootRequest(rootRequest);
  const rootLabel =
    typeof normalizedOptions.rootLabel === 'string'
      ? normalizedOptions.rootLabel
      : `${rootRequest.operation}:${rootRequest.requestId}`;
  const laneLabel =
    typeof normalizedOptions.laneLabel === 'string'
      ? normalizedOptions.laneLabel
      : getPrivateRootRequestLaneLabel(rootRequest);
  const metadata = {
    kind: privateSchedulerMockExpiredActRootWorkMetadataKind,
    version: privateSchedulerMockExpiredActRootWorkMetadataVersion,
    compatibilityTarget: schedulerCompatibilityTarget,
    reactCompatibilityTarget,
    rootId:
      normalizedOptions.rootId === undefined
        ? rootRequest.rootId
        : normalizedOptions.rootId,
    rootLabel,
    lane:
      normalizedOptions.lane === undefined
        ? laneLabel
        : normalizedOptions.lane,
    laneLabel,
    priorityLevel: normalizedOptions.priorityLevel,
    schedulerPriority: normalizedOptions.schedulerPriority,
    callbackHandle,
    actQueue,
    expectedActQueuePendingCount: Array.isArray(actQueue?.records)
      ? actQueue.records.length
      : 0,
    rootWorkRecords,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootOperation: rootRequest.operation,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    actQueueHandoffOnly: true
  };

  Object.defineProperty(
    metadata,
    privateSchedulerMockExpiredActRootWorkMetadataBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );
  return freezeRecord(metadata);
}

function createExpiredActRootWorkRecordsFromPrivateRootRequest(rootRequest) {
  const scheduled = getPrivateRootRequestScheduled(rootRequest);
  if (scheduled !== true) {
    throw createMockSchedulerExpiredActRootWorkRoutingError(
      'root-request-not-scheduled'
    );
  }

  if (rootRequest.operation === 'create') {
    const admission = getRootCreateRouteAdmissionForRootRequest(rootRequest);
    if (admission.ready !== true) {
      throw createMockSchedulerExpiredActRootWorkRoutingError(
        `root-create-admission-${admission.failureReason}`
      );
    }
    return [
      createExpiredActRootWorkRecordFromPrivateRootRequest(
        rootRequest,
        'RootLaneSchedulingSnapshot',
        {
          source: 'FastReactTestRendererPrivateRootRequestRecord.containerUpdate'
        }
      ),
      createExpiredActRootWorkRecordFromPrivateRootRequest(
        rootRequest,
        'UpdateContainerResult',
        {
          source: 'FastReactTestRendererPrivateRootRequestRecord.containerUpdate',
          containerUpdateApi: rootRequest.containerUpdateApi
        }
      ),
      createExpiredActRootWorkRecordFromPrivateRootRequest(
        rootRequest,
        'RootTaskScheduleRecord',
        {
          source: 'FastReactTestRendererPrivateRootRequestRecord.rootSchedule',
          schedulerApi: rootRequest.schedulerApi
        }
      ),
      createExpiredActRootWorkRecordFromPrivateRootRequest(
        rootRequest,
        'HostRootFinishedWorkPendingCommitRecordForCanary',
        {
          source:
            'FastReactTestRendererPrivateCreateRouteAdmission.workLoopFinishedWorkPreflight',
          admissionStatus: admission.status
        }
      )
    ];
  }

  const admission = getUpdateRouteAdmissionForRootRequest(rootRequest);
  if (admission.readyToConsumeAcceptedRustEvidence !== true) {
    throw createMockSchedulerExpiredActRootWorkRoutingError(
      'root-update-admission-not-ready'
    );
  }
  return [
    createExpiredActRootWorkRecordFromPrivateRootRequest(
      rootRequest,
      'RootLaneSchedulingSnapshot',
      {
        source: 'FastReactTestRendererPrivateRootRequestRecord.containerUpdate'
      }
    ),
    createExpiredActRootWorkRecordFromPrivateRootRequest(
      rootRequest,
      'UpdateContainerResult',
      {
        source: 'FastReactTestRendererPrivateUpdateRouteQueueEvidence',
        containerUpdateApi: rootRequest.containerUpdateApi
      }
    ),
    createExpiredActRootWorkRecordFromPrivateRootRequest(
      rootRequest,
      'RootTaskScheduleRecord',
      {
        source: 'FastReactTestRendererPrivateRootRequestRecord.rootSchedule',
        schedulerApi: rootRequest.schedulerApi
      }
    ),
    createExpiredActRootWorkRecordFromPrivateRootRequest(
      rootRequest,
      'HostRootFinishedWorkCommitHandoffRecordForCanary',
      {
        source: 'FastReactTestRendererPrivateUpdateRouteRootWorkLoopEvidence',
        admissionStatus: admission.status
      }
    )
  ];
}

function createExpiredActRootWorkRecordFromPrivateRootRequest(
  rootRequest,
  recordKind,
  details
) {
  const laneLabel = getPrivateRootRequestLaneLabel(rootRequest);
  return freezeRecord({
    recordKind,
    accepted: true,
    rootId: rootRequest.rootId,
    rootLabel: `${rootRequest.operation}:${rootRequest.requestId}`,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootOperation: rootRequest.operation,
    updateKind: rootRequest.updateKind,
    lane: laneLabel,
    laneLabel,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    ...details
  });
}

function getPrivateRootRequestScheduled(rootRequest) {
  if (Object.hasOwn(rootRequest, 'scheduled')) {
    return rootRequest.scheduled === true;
  }
  return rootRequest.schedulesRootUpdate === true;
}

function getPrivateRootRequestLaneLabel(rootRequest) {
  if (
    isObjectLike(rootRequest.containerUpdate) &&
    typeof rootRequest.containerUpdate.lane === 'string'
  ) {
    return rootRequest.containerUpdate.lane;
  }
  return rootRequest.sync === true ? 'SyncLane' : 'update_container-selected-lane';
}

function describeAcceptedMockSchedulerExpiredActRootWorkMetadata(
  flushHelperOrDiagnostics,
  metadata
) {
  const carrier = readMockSchedulerFlushDiagnosticsCarrier(
    flushHelperOrDiagnostics
  );
  const schedulerRejectionReason =
    carrier.rejectionReason ??
    getRejectedSchedulerMockExpiredActRootWorkDiagnosticsReason(
      carrier.diagnostics
    );
  const metadataRejectionReason =
    schedulerRejectionReason === null
      ? getRejectedSchedulerMockExpiredActRootWorkMetadataReason(metadata)
      : null;
  let schedulerDescription = null;
  let rejectionReason = schedulerRejectionReason ?? metadataRejectionReason;

  if (rejectionReason === null) {
    schedulerDescription =
      carrier.diagnostics.describeExpiredActRootWorkMetadataForDiagnostics(
        metadata
      );
    if (!isAcceptedSchedulerExpiredActRootWorkDescription(schedulerDescription)) {
      rejectionReason =
        schedulerDescription?.rejectionReason ??
        'scheduler-expired-act-root-work-description';
    }
  }

  const accepted = rejectionReason === null;
  const summary =
    isObjectLike(schedulerDescription) && isObjectLike(schedulerDescription.metadata)
      ? schedulerDescription.metadata
      : null;

  return freezeRecord({
    status: accepted
      ? 'accepted-mock-scheduler-expired-act-root-work-metadata'
      : 'rejected-mock-scheduler-expired-act-root-work-metadata',
    accepted,
    rejectionReason,
    metadataKind: isObjectLike(metadata) ? metadata.kind : null,
    metadataVersion: isObjectLike(metadata) ? metadata.version : null,
    schedulerDiagnosticStatus: isObjectLike(carrier.diagnostics)
      ? carrier.diagnostics.status
      : null,
    consumer: 'react-test-renderer-act-scheduler-private-gate',
    gateStatus: actSchedulerGateStatus,
    schedulerDescription,
    rootId: summary === null ? null : summary.rootId,
    rootLabel: summary === null ? null : summary.rootLabel,
    laneLabel: summary === null ? null : summary.laneLabel,
    actQueuePendingCount: summary === null ? 0 : summary.actQueuePendingCount,
    rootWorkRecordCount: summary === null ? 0 : summary.rootWorkRecordCount,
    rootWorkRecords: summary === null ? freezeArray([]) : summary.rootWorkRecords,
    recognizesExpiredActRootWorkMetadata: accepted,
    linksExpiredCallbacksToAcceptedActRootWorkRecords: accepted,
    routesAcceptedMockSchedulerExpiredActRootWorkMetadata: accepted,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    drainsExpiredMockSchedulerWork: false,
    drainsAcceptedInternalTestQueues: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesScheduledCallbacks: false,
    executesRendererWork: false,
    executesRendererRoots: false
  });
}

function isAcceptedSchedulerExpiredActRootWorkDescription(description) {
  return (
    isObjectLike(description) &&
    description.status === 'accepted-expired-act-root-work-metadata' &&
    description.accepted === true &&
    description.rejectionReason === null &&
    isObjectLike(description.metadata) &&
    description.metadata.kind === privateSchedulerMockExpiredActRootWorkMetadataKind &&
    description.metadata.version ===
      privateSchedulerMockExpiredActRootWorkMetadataVersion &&
    description.metadata.rootWorkRecordCount > 0 &&
    Array.isArray(description.metadata.rootWorkRecords) &&
    description.recognizesExpiredActRootWorkMetadata === true &&
    description.linksExpiredCallbacksToAcceptedActRootWorkRecords === true &&
    description.drainsExpiredMockSchedulerWork === false &&
    description.drainsAcceptedInternalTestQueues === false &&
    description.drainsPublicSchedulerTaskQueue === false &&
    description.drainsPublicReactActQueue === false &&
    description.publicSchedulerTimingCompatibilityClaimed === false &&
    description.publicReactActCompatibilityClaimed === false &&
    description.compatibilityClaimed === false &&
    description.executesQueuedWork === false &&
    description.executesEffects === false &&
    description.executesRendererWork === false &&
    description.executesRendererRoots === false
  );
}

function routeAcceptedMockSchedulerExpiredActRootWorkMetadata(
  flushHelperOrDiagnostics,
  metadata
) {
  const carrier = readMockSchedulerFlushDiagnosticsCarrier(
    flushHelperOrDiagnostics
  );
  const schedulerRejectionReason =
    carrier.rejectionReason ??
    getRejectedSchedulerMockExpiredActRootWorkDiagnosticsReason(
      carrier.diagnostics
    );
  if (schedulerRejectionReason !== null) {
    throw createMockSchedulerExpiredActRootWorkRoutingError(
      schedulerRejectionReason
    );
  }
  const metadataRejectionReason =
    getRejectedSchedulerMockExpiredActRootWorkMetadataReason(metadata);
  if (metadataRejectionReason !== null) {
    throw createMockSchedulerExpiredActRootWorkRoutingError(
      metadataRejectionReason
    );
  }

  const schedulerDescription =
    carrier.diagnostics.describeExpiredActRootWorkMetadataForDiagnostics(
      metadata
    );
  if (!isAcceptedSchedulerExpiredActRootWorkDescription(schedulerDescription)) {
    throw createMockSchedulerExpiredActRootWorkRoutingError(
      schedulerDescription?.rejectionReason ??
        'scheduler-expired-act-root-work-description'
    );
  }

  const schedulerDrainReport =
    carrier.diagnostics.drainExpiredMockSchedulerWorkWithActRootMetadataForDiagnostics(
      metadata
    );
  if (!isAcceptedSchedulerExpiredActRootWorkDrainReport(schedulerDrainReport)) {
    throw createMockSchedulerExpiredActRootWorkRoutingError(
      'scheduler-expired-act-root-work-drain-report'
    );
  }

  return freezeRecord({
    status: mockSchedulerExpiredActRootWorkRoutingStatus,
    accepted: true,
    schedulerDiagnosticStatus: carrier.diagnostics.status,
    schedulerDiagnosticsExportName: carrier.diagnostics.exportName,
    consumer: 'react-test-renderer-act-scheduler-private-gate',
    gateStatus: actSchedulerGateStatus,
    metadataKind: metadata.kind,
    metadataVersion: metadata.version,
    diagnosticsKind: schedulerDrainReport.kind,
    diagnosticsVersion: schedulerDrainReport.version,
    schedulerDescription,
    schedulerDrainReport,
    rootId: schedulerDrainReport.expiredActRootWorkMetadata.rootId,
    rootLabel: schedulerDrainReport.expiredActRootWorkMetadata.rootLabel,
    laneLabel: schedulerDrainReport.expiredCallbackLaneLabel,
    expiredCallbackPriorityLevel:
      schedulerDrainReport.expiredCallbackPriorityLevel,
    expiredCallbackPriorityLabel:
      schedulerDrainReport.expiredCallbackPriorityLabel,
    expiredCallbackSchedulerPriority:
      schedulerDrainReport.expiredCallbackSchedulerPriority,
    actQueuePendingBefore: schedulerDrainReport.actQueuePendingBefore,
    actQueuePendingAfter: schedulerDrainReport.actQueuePendingAfter,
    rootWorkRecordCount: schedulerDrainReport.rootWorkRecordCount,
    rootWorkRecords: schedulerDrainReport.rootWorkRecords,
    sourceDrainStatus: schedulerDrainReport.sourceDrainStatus,
    sourceDrainFlushedExpiredWork:
      schedulerDrainReport.sourceDrainFlushedExpiredWork === true,
    recognizesExpiredActRootWorkMetadata: true,
    linksExpiredCallbacksToAcceptedActRootWorkRecords: true,
    routesAcceptedMockSchedulerExpiredActRootWorkMetadata: true,
    delegatesToPrivateSchedulerDiagnostics: true,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    drainsExpiredMockSchedulerWork: true,
    drainsAcceptedInternalTestQueues: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesAcceptedInternalTestCallbacks: true,
    executesQueuedWork: false,
    executesEffects: false,
    executesScheduledCallbacks: true,
    executesRendererWork: false,
    executesRendererRoots: false,
    publicSchedulerFlushExecutionAvailable: false,
    publicActBehaviorAvailable: false,
    rendererRootsCompatibilityClaimed: false,
    missingBeforeExecution: actSchedulerMissingBeforeExecution
  });
}

function isAcceptedSchedulerExpiredActRootWorkDrainReport(report) {
  return (
    isObjectLike(report) &&
    report[privateSchedulerMockExpiredActRootWorkDiagnosticsBrand] === true &&
    report.kind === privateSchedulerMockExpiredActRootWorkDiagnosticsKind &&
    report.version === privateSchedulerMockExpiredActRootWorkDiagnosticsVersion &&
    report.status ===
      'drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics' &&
    report.accepted === true &&
    isObjectLike(report.expiredActRootWorkMetadata) &&
    report.expiredActRootWorkMetadata.kind ===
      privateSchedulerMockExpiredActRootWorkMetadataKind &&
    report.actQueuePendingBefore > 0 &&
    report.actQueuePendingAfter === 0 &&
    report.rootWorkRecordCount > 0 &&
    Array.isArray(report.rootWorkRecords) &&
    report.rootWorkRecords.length === report.rootWorkRecordCount &&
    report.recognizesExpiredActRootWorkMetadata === true &&
    report.linksExpiredCallbacksToAcceptedActRootWorkRecords === true &&
    report.drainsExpiredMockSchedulerWork === true &&
    report.drainsAcceptedInternalTestQueues === true &&
    report.drainsPublicSchedulerTaskQueue === false &&
    report.drainsPublicReactActQueue === false &&
    report.invokesPublicSchedulerFlushHelper === false &&
    report.publicSchedulerFlushBehaviorExecuted === false &&
    report.publicSchedulerTimingCompatibilityClaimed === false &&
    report.publicReactActCompatibilityClaimed === false &&
    report.compatibilityClaimed === false &&
    report.executesAcceptedInternalTestCallbacks === true &&
    report.executesQueuedWork === false &&
    report.executesEffects === false &&
    report.executesRendererWork === false &&
    report.executesRendererRoots === false &&
    report.executesScheduledCallbacks === true
  );
}

function isAcceptedSchedulerQueueDescription(description, pendingCount) {
  return (
    isObjectLike(description) &&
    description.status === 'accepted-internal-test-queue' &&
    description.accepted === true &&
    description.rejectionReason === null &&
    description.queueKind === privateActQueueTestQueueKind &&
    description.pendingCount === pendingCount &&
    description.drainsAcceptedInternalTestQueues === true &&
    description.executesBrandedInternalTestCallbacks === true &&
    description.recordsBrandedInternalTestContinuations === true &&
    description.executesBrandedInternalTestContinuations === true &&
    description.drainsPublicSchedulerTaskQueue === false &&
    description.drainsPublicReactActQueue === false &&
    description.publicSchedulerTimingCompatibilityClaimed === false &&
    description.publicReactActCompatibilityClaimed === false &&
    description.executesQueuedWork === false &&
    description.executesEffects === false
  );
}

function isAcceptedSchedulerQueueDrainReport(report, pendingBefore) {
  return (
    isObjectLike(report) &&
    report.status === 'drained-accepted-internal-test-queue' &&
    report.accepted === true &&
    report.queueKind === privateActQueueTestQueueKind &&
    report.pendingBefore === pendingBefore &&
    report.drainedCount === pendingBefore &&
    Number.isInteger(report.executedCallbackCount) &&
    report.executedCallbackCount >= 0 &&
    Number.isInteger(report.recordedContinuationCount) &&
    report.recordedContinuationCount >= 0 &&
    Number.isInteger(report.executedContinuationCount) &&
    report.executedContinuationCount >= 0 &&
    report.remainingCount === 0 &&
    Array.isArray(report.drainedRecords) &&
    report.drainedRecords.length === report.drainedCount &&
    Array.isArray(report.recordedContinuations) &&
    report.recordedContinuations.length ===
      report.recordedContinuationCount &&
    Array.isArray(report.executedContinuations) &&
    report.executedContinuations.length ===
      report.executedContinuationCount &&
    typeof report.mockSchedulerPendingWorkBefore === 'boolean' &&
    report.mockSchedulerPendingWorkAfter ===
      report.mockSchedulerPendingWorkBefore &&
    typeof report.mockSchedulerNowBefore === 'number' &&
    report.mockSchedulerNowAfter === report.mockSchedulerNowBefore &&
    report.drainsPublicSchedulerTaskQueue === false &&
    report.drainsPublicReactActQueue === false &&
    report.executesBrandedInternalTestCallbacks === true &&
    report.recordsBrandedInternalTestContinuations === true &&
    report.executesBrandedInternalTestContinuations === true &&
    report.publicSchedulerTimingCompatibilityClaimed === false &&
    report.publicReactActCompatibilityClaimed === false &&
    report.executesQueuedWork === false &&
    report.executesEffects === false
  );
}

function summarizePrivateActQueueTask(task, index) {
  return freezeRecord({
    index,
    label: task.label,
    recordKind: task.recordKind,
    taskKind: task.taskKind,
    continuationStatus: task.continuationStatus,
    executesQueuedWork: false,
    executesEffects: false
  });
}

function routeAcceptedMockSchedulerFlushHelperMetadata(
  flushHelperOrDiagnostics,
  queue
) {
  const carrier = readMockSchedulerFlushDiagnosticsCarrier(
    flushHelperOrDiagnostics
  );
  const helperRejectionReason =
    carrier.rejectionReason ??
    getRejectedSchedulerMockFlushDiagnosticsReason(carrier.diagnostics);
  if (helperRejectionReason !== null) {
    throw createMockSchedulerFlushHelperRoutingError(helperRejectionReason);
  }

  const queueRejectionReason = getRejectedPrivateActQueueReason(queue);
  if (queueRejectionReason !== null) {
    throw createPrivateActQueueDiagnosticError(queueRejectionReason);
  }

  const diagnostics = carrier.diagnostics;
  const pendingBefore = queue.records.length;
  const schedulerDescription =
    diagnostics.describeAcceptedInternalActQueue(queue);
  if (
    !isAcceptedSchedulerQueueDescription(
      schedulerDescription,
      pendingBefore
    )
  ) {
    throw createMockSchedulerFlushHelperRoutingError(
      'scheduler-description'
    );
  }

  const schedulerDrainReport =
    diagnostics.drainAcceptedInternalActQueue(queue);
  if (
    !isAcceptedSchedulerQueueDrainReport(
      schedulerDrainReport,
      pendingBefore
    )
  ) {
    throw createMockSchedulerFlushHelperRoutingError(
      'scheduler-drain-report'
    );
  }

  const helperDescriptor =
    carrier.helperDescriptor === null
      ? null
      : freezeRecord({
          configurable: carrier.helperDescriptor.configurable,
          enumerable: carrier.helperDescriptor.enumerable,
          writable: carrier.helperDescriptor.writable
        });

  return freezeRecord({
    status: mockSchedulerFlushHelperRoutingStatus,
    accepted: true,
    schedulerDiagnosticStatus: diagnostics.status,
    schedulerDiagnosticsExportName: diagnostics.exportName,
    consumer: 'react-test-renderer-act-scheduler-private-gate',
    gateStatus: actSchedulerGateStatus,
    helperDescriptor,
    queueKind: schedulerDrainReport.queueKind,
    pendingBefore: schedulerDrainReport.pendingBefore,
    drainedCount: schedulerDrainReport.drainedCount,
    executedCallbackCount: schedulerDrainReport.executedCallbackCount,
    recordedContinuationCount:
      schedulerDrainReport.recordedContinuationCount,
    executedContinuationCount:
      schedulerDrainReport.executedContinuationCount,
    remainingCount: schedulerDrainReport.remainingCount,
    schedulerDescription,
    schedulerDrainReport,
    privateSchedulerActQueueDiagnosticsConsumed: true,
    routesAcceptedMockSchedulerFlushHelperMetadata: true,
    delegatesToPrivateSchedulerDiagnostics: true,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    mockSchedulerExpiredWorkDiagnosticsReady:
      diagnostics.mockSchedulerExpiredWorkDiagnosticsReady === true,
    mockSchedulerExpiredWorkActRouteDiagnosticsReady:
      diagnostics.mockSchedulerExpiredWorkActRouteDiagnosticsReady === true,
    recognizesExpiredMockSchedulerMetadata:
      diagnostics.recognizesExpiredMockSchedulerMetadata === true,
    describesExpiredMockSchedulerWorkWithoutFlushing:
      diagnostics.describesExpiredMockSchedulerWorkWithoutFlushing === true,
    drainsExpiredMockSchedulerWork: false,
    drainsAcceptedInternalTestQueues: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesScheduledCallbacks: false,
    publicSchedulerFlushExecutionAvailable: false,
    publicActBehaviorAvailable: false,
    rendererRootsCompatibilityClaimed: false,
    missingBeforeExecution: actSchedulerMissingBeforeExecution
  });
}

function routeAcceptedMockSchedulerExpiredWorkMetadata(metadata) {
  const rejectionReason =
    getRejectedSchedulerMockExpiredWorkMetadataReason(metadata);
  if (rejectionReason !== null) {
    throw createMockSchedulerExpiredWorkRoutingError(rejectionReason);
  }

  return freezeRecord({
    status: mockSchedulerExpiredWorkRoutingStatus,
    accepted: true,
    metadataKind: metadata.kind,
    metadataVersion: metadata.version,
    schedulerDiagnosticStatus: metadata.schedulerDiagnosticStatus,
    consumer: 'react-test-renderer-act-scheduler-private-gate',
    gateStatus: actSchedulerGateStatus,
    now: metadata.now,
    pendingWork: metadata.pendingWork,
    hasExpiredMockSchedulerWork: metadata.hasExpiredMockSchedulerWork,
    expiredCallbackCount: metadata.expiredCallbackCount,
    cancelledTombstoneCount: metadata.cancelledTombstoneCount,
    taskQueueCount: metadata.taskQueueCount,
    taskQueue: metadata.taskQueue,
    privateSchedulerActQueueDiagnosticsConsumed: true,
    recognizesExpiredMockSchedulerMetadata: true,
    routesAcceptedMockSchedulerExpiredWorkMetadata: true,
    describesExpiredMockSchedulerWorkWithoutFlushing: true,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    drainsExpiredMockSchedulerWork: false,
    drainsAcceptedInternalTestQueues: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesScheduledCallbacks: false,
    publicSchedulerFlushExecutionAvailable: false,
    publicActBehaviorAvailable: false,
    rendererRootsCompatibilityClaimed: false,
    missingBeforeExecution: actSchedulerMissingBeforeExecution
  });
}

function findPrivateActFlushPrerequisite(prerequisites, id) {
  if (!Array.isArray(prerequisites)) {
    return undefined;
  }
  return prerequisites.find((prerequisite) => prerequisite.id === id);
}

function hasAcceptedPrivateRootRequestPrerequisiteMetadata(prerequisites) {
  const prerequisite = findPrivateActFlushPrerequisite(
    prerequisites,
    'test-renderer-private-root-request-records'
  );
  return (
    isObjectLike(prerequisite) &&
    prerequisite.present === true &&
    prerequisite.records === testRendererRootActFlushRecords &&
    prerequisite.executesRootRequests === false &&
    prerequisite.producesHostOutput === false &&
    testRendererRootActFlushRecords.some(
      (record) =>
        record.id === 'test-renderer-private-root-request-bridge' &&
        record.privateRootRequestExecution === false
    )
  );
}

function hasAcceptedSchedulerFlushHelperPrerequisiteMetadata(
  prerequisites
) {
  const prerequisite = findPrivateActFlushPrerequisite(
    prerequisites,
    'scheduler-mock-flush-helper-metadata'
  );
  return (
    isObjectLike(prerequisite) &&
    prerequisite.present === true &&
    prerequisite.records === schedulerMockFlushHelperMetadata &&
    prerequisite.executesScheduledCallbacks === false &&
    schedulerReactActQueueDiagnosticRecords.some(
      (record) =>
        record.id === 'test-renderer-mock-scheduler-flush-helper-routing' &&
        record.routesAcceptedMockSchedulerFlushHelperMetadata === true &&
        record.invokesPublicSchedulerFlushHelper === false
    )
  );
}

function hasAcceptedPassiveSchedulerPrerequisiteMetadata(prerequisites) {
  const prerequisite = findPrivateActFlushPrerequisite(
    prerequisites,
    'passive-effect-scheduler-flush-metadata'
  );
  const records = isObjectLike(prerequisite)
    ? prerequisite.records
    : undefined;
  return (
    isObjectLike(prerequisite) &&
    prerequisite.present === true &&
    Array.isArray(records) &&
    records.includes('PassiveEffectSchedulerFlushGateRecord') &&
    records.includes('SchedulerPassiveEffectsFlushRequest') &&
    records.includes('PassiveEffectSchedulerFlushExecutionRecord') &&
    prerequisite.diagnostics === privateActPassiveEffectDrainDiagnostics &&
    prerequisite.consumesPendingPassiveFlushMetadata === true &&
    prerequisite.consumesAcceptedSchedulerFlushMetadata === true &&
    prerequisite.executesPassiveEffects === false &&
    prerequisite.invokesEffectCallbacks === false
  );
}

function hasAcceptedPublicActBlockerPrerequisiteRows(prerequisites) {
  const warningThenablePrerequisite = findPrivateActFlushPrerequisite(
    prerequisites,
    'act-warning-thenable-public-compatibility-blockers'
  );
  const nestedScopePrerequisite = findPrivateActFlushPrerequisite(
    prerequisites,
    'act-nested-scope-public-compatibility-blockers'
  );
  return (
    isObjectLike(warningThenablePrerequisite) &&
    warningThenablePrerequisite.present === true &&
    warningThenablePrerequisite.diagnostics ===
      actWarningThenableBlockerDiagnostics &&
    warningThenablePrerequisite.emitsWarnings === false &&
    warningThenablePrerequisite.awaitsThenables === false &&
    warningThenablePrerequisite.invokesActCallback === false &&
    warningThenablePrerequisite.compatibilityClaimed === false &&
    isObjectLike(nestedScopePrerequisite) &&
    nestedScopePrerequisite.present === true &&
    nestedScopePrerequisite.diagnostics === actNestedScopeBlockerDiagnostics &&
    nestedScopePrerequisite.invokesActCallback === false &&
    nestedScopePrerequisite.executesPassiveEffects === false &&
    nestedScopePrerequisite.compatibilityClaimed === false
  );
}

function getRejectedPrivateRootPassivePrerequisiteSequenceReason(
  prerequisites
) {
  if (!Array.isArray(prerequisites)) {
    return 'prerequisites-not-array';
  }
  if (!hasAcceptedPrivateRootRequestPrerequisiteMetadata(prerequisites)) {
    return 'missing-root-request-prerequisite-metadata';
  }
  if (
    !hasAcceptedSchedulerFlushHelperPrerequisiteMetadata(prerequisites)
  ) {
    return 'missing-scheduler-flush-helper-prerequisite-metadata';
  }
  if (!hasAcceptedPassiveSchedulerPrerequisiteMetadata(prerequisites)) {
    return 'missing-passive-scheduler-prerequisite-metadata';
  }
  if (!hasAcceptedPublicActBlockerPrerequisiteRows(prerequisites)) {
    return 'missing-public-act-blocker-prerequisite-metadata';
  }
  return null;
}

function describeAcceptedPrivateRootPassivePrerequisiteSequence(
  prerequisites = acceptedPrivateActFlushPrerequisites
) {
  const rejectionReason =
    getRejectedPrivateRootPassivePrerequisiteSequenceReason(prerequisites);
  const accepted = rejectionReason === null;

  return freezeRecord({
    id: privateActRootPassivePrerequisiteSequenceId,
    status: accepted
      ? actRootPassiveSequenceStatus
      : 'rejected-private-react-test-renderer-act-root-passive-sequence',
    accepted,
    rejectionReason,
    acceptedWorker:
      'worker-576-test-renderer-act-private-root-passive-sequence',
    consumer: 'react-test-renderer-act-root-passive-sequence-private-gate',
    gateStatus: actSchedulerGateStatus,
    prerequisiteSequence: privateActRootPassivePrerequisiteSequenceOrder,
    requiredPrerequisiteIds: privateActRootPassiveRequiredPrerequisiteIds,
    privateRootRequestPrerequisiteMetadataAccepted:
      hasAcceptedPrivateRootRequestPrerequisiteMetadata(prerequisites),
    schedulerFlushHelperPrerequisiteMetadataAccepted:
      hasAcceptedSchedulerFlushHelperPrerequisiteMetadata(prerequisites),
    passiveSchedulerPrerequisiteMetadataAccepted:
      hasAcceptedPassiveSchedulerPrerequisiteMetadata(prerequisites),
    publicActBlockerPrerequisiteRowsAccepted:
      hasAcceptedPublicActBlockerPrerequisiteRows(prerequisites),
    invokesActCallback: false,
    emitsActWarnings: false,
    emitsOverlappingActWarnings: false,
    awaitsThenables: false,
    settlesAsyncActScopes: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    executesRootRequests: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createPrivateRootPassivePrerequisiteSequenceError(reason) {
  const error = createUnsupportedError(
    `_Scheduler.${privateActQueueFlushDiagnosticsExport}`,
    'rejected private act root/passive prerequisite sequence',
    `Private react-test-renderer act root/passive sequencing requires accepted root request, scheduler flush helper, passive scheduler, and public blocker metadata. Rejection reason: ${reason}.`,
    undefined,
    undefined,
    actSchedulerGate
  );

  error.name =
    'FastReactTestRendererPrivateActRootPassiveSequenceError';
  error.code =
    'FAST_REACT_TEST_RENDERER_PRIVATE_ACT_ROOT_PASSIVE_SEQUENCE_REJECTED';
  error.reason = reason;
  error.invokesActCallback = false;
  error.emitsActWarnings = false;
  error.awaitsThenables = false;
  error.executesPassiveEffects = false;
  error.executesRootRequests = false;
  error.publicReactActCompatibilityClaimed = false;
  error.publicActCompatibilityClaimed = false;
  error.compatibilityClaimed = false;
  return error;
}

function assertAcceptedPrivateRootPassivePrerequisiteSequence(
  prerequisites = acceptedPrivateActFlushPrerequisites
) {
  const report =
    describeAcceptedPrivateRootPassivePrerequisiteSequence(prerequisites);
  if (report.accepted !== true) {
    throw createPrivateRootPassivePrerequisiteSequenceError(
      report.rejectionReason
    );
  }
  return report;
}

function consumeAcceptedSchedulerActQueueDiagnostics(queue) {
  const rejectionReason = getRejectedPrivateActQueueReason(queue);
  if (rejectionReason !== null) {
    throw createPrivateActQueueDiagnosticError(rejectionReason);
  }

  const pendingBefore = queue.records.length;
  const drainedRecords = [];

  while (queue.records.length > 0) {
    drainedRecords.push(
      summarizePrivateActQueueTask(
        queue.records.shift(),
        drainedRecords.length
      )
    );
  }

  return freezeRecord({
    status:
      'react-test-renderer-consumed-accepted-scheduler-act-queue-diagnostics',
    schedulerDiagnosticStatus: 'drained-accepted-internal-test-queue',
    accepted: true,
    queueKind: queue.kind,
    pendingBefore,
    drainedCount: drainedRecords.length,
    remainingCount: queue.records.length,
    drainedRecords: freezeArray(drainedRecords),
    consumer: 'react-test-renderer-act-scheduler-private-gate',
    gateStatus: actSchedulerGateStatus,
    privateSchedulerActQueueDiagnosticsConsumed: true,
    drainsAcceptedInternalTestQueues: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesScheduledCallbacks: false,
    publicSchedulerFlushExecutionAvailable: false,
    publicActBehaviorAvailable: false,
    rendererRootsCompatibilityClaimed: false
  });
}

function createPrivateFlushSyncActRoutingDiagnostics(rootRequest) {
  return freezeRecord({
    id: 'react-test-renderer-flushsync-act-routing-private-diagnostics',
    status: privateFlushSyncActRoutingDiagnosticsStatus,
    entrypoint,
    publicSurface: 'create().unstable_flushSync',
    compatibilityTarget,
    symbol: privateFlushSyncActRoutingDiagnosticsSymbol.description,
    routingGate: flushSyncActRoutingGate,
    actSchedulerGate,
    actSchedulerGateStatus: actSchedulerGate.status,
    rootRequest,
    rootRequestStatus: rootRequest.status,
    rootRequestExecutionStatus: rootRequest.executionStatus,
    rootRequestCompatibilityStatus: rootRequest.compatibilityStatus,
    acceptedActMetadata: freezeRecord({
      reactActPrivateDispatcherGateAccepted:
        actSchedulerGate.reactActPrivateDispatcherGateAccepted,
      schedulerReactActQueueDiagnosticsAccepted:
        actSchedulerGate.schedulerReactActQueueDiagnosticsAccepted,
      privateSchedulerActQueueDiagnosticsConsumed:
        actSchedulerGate.privateSchedulerActQueueDiagnosticsConsumed,
      privateActQueueDiagnosticConsumptionReady:
        actSchedulerGate.privateActQueueDiagnosticConsumptionReady,
      rendererBackedActDrainMetadataAccepted: true,
      rendererBackedActDrainDiagnosticKind:
        'fast-react.react.private-renderer-backed-act-drain-diagnostic',
      publicReactActCompatibilityClaimed: false,
      invokesActCallback: false,
      executesQueuedWork: false,
      executesEffects: false
    }),
    acceptedSyncFlushMetadata: freezeRecord({
      syncFlushActRecordsAccepted:
        actSchedulerGate.syncFlushActRecordsAccepted,
      privateSyncFlushExecutionMetadataAccepted:
        actSchedulerGate.privateSyncFlushExecutionMetadataAccepted,
      postPassiveContinuationExecutionGateAccepted:
        actSchedulerGate.postPassiveContinuationExecutionGateAccepted,
      schedulerBridgeActContinuationExecutionAccepted: true,
      syncFlushErrorRecoveryMetadataAccepted: true,
      rootCallbackInvocationMetadataAccepted: true,
      acceptedRecords: flushSyncActRoutingAcceptedReconcilerRecords,
      recognizedActRecordIds: freezeArray(
        syncFlushActSchedulerRecords.map((record) => record.id)
      ),
      publicRootSyncFlushRouteAvailable: false,
      rootSyncFlushCompatibilityClaimed: false,
      executesSyncFlush: false,
      invokesRootCallbacks: false
    }),
    publicFailClosed: freezeRecord({
      invokesFlushSyncCallback: false,
      publicActBehaviorAvailable: false,
      publicSchedulerFlushExecutionAvailable: false,
      publicRootSyncFlushRouteAvailable: false,
      rootSyncFlushCompatibilityClaimed: false,
      executesSyncFlush: false,
      executesQueuedWork: false,
      executesScheduledCallbacks: false,
      executesPassiveEffects: false,
      executesRendererRoots: false,
      invokesRootCallbacks: false,
      mutatesHostOutput: false,
      compatibilityClaimed: false
    })
  });
}

function createAcceptedPendingPassiveFlushRecord(options = {}) {
  const normalizedOptions =
    typeof options === 'string'
      ? {
          label: options
        }
      : options ?? {};
  const pendingUnmountCount = normalizeNonNegativeInteger(
    normalizedOptions.pendingUnmountCount,
    0
  );
  const pendingMountCount = normalizeNonNegativeInteger(
    normalizedOptions.pendingMountCount,
    0
  );
  const record = {
    kind: privateActPassiveEffectDrainRecordKind,
    version: privateActPassiveEffectDrainVersion,
    compatibilityTarget,
    schedulerCompatibilityTarget,
    recordKind:
      normalizedOptions.recordKind ?? 'PassiveEffectSchedulerFlushGateRecord',
    label: String(
      normalizedOptions.label ?? 'pending-passive-flush-metadata'
    ),
    root: String(normalizedOptions.root ?? 'test-renderer-root'),
    finishedWork: String(
      normalizedOptions.finishedWork ?? 'test-renderer-finished-work'
    ),
    lanes: String(normalizedOptions.lanes ?? 'Default'),
    pendingUnmountCount,
    pendingMountCount,
    pendingRecordCount: pendingUnmountCount + pendingMountCount,
    schedulerRequestOrder: normalizeNonNegativeInteger(
      normalizedOptions.schedulerRequestOrder,
      0
    ),
    schedulerPriority: normalizedOptions.schedulerPriority ?? 'Normal',
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    publicSchedulerPackageBehaviorChanged: false,
    compatibilityClaimed: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    invokesActCallback: false
  };

  Object.defineProperty(record, privateActPassiveEffectDrainRecordBrand, {
    value: true
  });

  return Object.freeze(record);
}

function normalizeAcceptedPendingPassiveFlushRecord(record) {
  if (isAcceptedPendingPassiveFlushRecord(record)) {
    return record;
  }

  return createAcceptedPendingPassiveFlushRecord(record);
}

function createAcceptedPendingPassiveFlushMetadata(records = []) {
  const normalizedRecords = Array.isArray(records) ? records : [];
  const metadata = {
    kind: privateActPassiveEffectDrainMetadataKind,
    version: privateActPassiveEffectDrainVersion,
    compatibilityTarget,
    schedulerCompatibilityTarget,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    publicSchedulerPackageBehaviorChanged: false,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    privatePassiveEffectDrainDiagnosticsReady: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    invokesActCallback: false,
    records: normalizedRecords.map(normalizeAcceptedPendingPassiveFlushRecord)
  };

  Object.defineProperty(metadata, privateActPassiveEffectDrainMetadataBrand, {
    value: true
  });

  return metadata;
}

function isAcceptedPendingPassiveFlushRecord(record) {
  return getRejectedPendingPassiveFlushRecordReason(record, 0) === null;
}

function getRejectedPendingPassiveFlushRecordReason(record, index) {
  if (!isObjectLike(record)) {
    return `record-${index}-not-object`;
  }
  if (record[privateActPassiveEffectDrainRecordBrand] !== true) {
    return `record-${index}-missing-internal-brand`;
  }
  if (record.kind !== privateActPassiveEffectDrainRecordKind) {
    return `record-${index}-kind`;
  }
  if (record.version !== privateActPassiveEffectDrainVersion) {
    return `record-${index}-version`;
  }
  if (record.compatibilityTarget !== compatibilityTarget) {
    return `record-${index}-target`;
  }
  if (record.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return `record-${index}-scheduler-target`;
  }
  if (!includesString(record.recordKind, acceptedPassiveEffectDrainRecordKinds)) {
    return `record-${index}-record-kind`;
  }
  if (
    typeof record.label !== 'string' ||
    typeof record.root !== 'string' ||
    typeof record.finishedWork !== 'string' ||
    typeof record.lanes !== 'string'
  ) {
    return `record-${index}-identity-fields`;
  }
  if (
    !isNonNegativeInteger(record.pendingUnmountCount) ||
    !isNonNegativeInteger(record.pendingMountCount) ||
    !isNonNegativeInteger(record.pendingRecordCount) ||
    record.pendingRecordCount !==
      record.pendingUnmountCount + record.pendingMountCount
  ) {
    return `record-${index}-pending-counts`;
  }
  if (
    !isNonNegativeInteger(record.schedulerRequestOrder) ||
    record.schedulerPriority !== 'Normal'
  ) {
    return `record-${index}-scheduler-request`;
  }
  if (
    record.consumesPendingPassiveFlushMetadata !== true ||
    record.consumesAcceptedSchedulerFlushMetadata !== true
  ) {
    return `record-${index}-consume-policy`;
  }
  if (
    record.drainsPublicSchedulerTaskQueue !== false ||
    record.drainsPublicReactActQueue !== false ||
    record.publicSchedulerTimingCompatibilityClaimed !== false ||
    record.publicReactActCompatibilityClaimed !== false ||
    record.publicActCompatibilityClaimed !== false ||
    record.publicSchedulerPackageBehaviorChanged !== false ||
    record.compatibilityClaimed !== false
  ) {
    return `record-${index}-public-claim`;
  }
  if (
    record.executesPassiveEffects !== false ||
    record.invokesEffectCallbacks !== false ||
    record.invokesActCallback !== false
  ) {
    return `record-${index}-execution-claim`;
  }
  return null;
}

function getRejectedPendingPassiveFlushMetadataReason(metadata) {
  if (!isObjectLike(metadata)) {
    return 'metadata-not-object';
  }
  if (metadata[privateActPassiveEffectDrainMetadataBrand] !== true) {
    return 'metadata-missing-internal-brand';
  }
  if (metadata.kind !== privateActPassiveEffectDrainMetadataKind) {
    return 'metadata-kind';
  }
  if (metadata.version !== privateActPassiveEffectDrainVersion) {
    return 'metadata-version';
  }
  if (metadata.compatibilityTarget !== compatibilityTarget) {
    return 'metadata-target';
  }
  if (metadata.schedulerCompatibilityTarget !== schedulerCompatibilityTarget) {
    return 'metadata-scheduler-target';
  }
  if (
    metadata.publicCompatibilityClaimed !== false ||
    metadata.publicSchedulerTimingCompatibilityClaimed !== false ||
    metadata.publicReactActCompatibilityClaimed !== false ||
    metadata.publicActCompatibilityClaimed !== false ||
    metadata.publicSchedulerPackageBehaviorChanged !== false
  ) {
    return 'metadata-public-claim';
  }
  if (
    metadata.consumesPendingPassiveFlushMetadata !== true ||
    metadata.consumesAcceptedSchedulerFlushMetadata !== true ||
    metadata.privatePassiveEffectDrainDiagnosticsReady !== true
  ) {
    return 'metadata-consume-policy';
  }
  if (
    metadata.drainsPublicSchedulerTaskQueue !== false ||
    metadata.drainsPublicReactActQueue !== false ||
    metadata.executesPassiveEffects !== false ||
    metadata.invokesEffectCallbacks !== false ||
    metadata.invokesActCallback !== false
  ) {
    return 'metadata-execution-claim';
  }
  if (!Array.isArray(metadata.records)) {
    return 'metadata-records-not-array';
  }

  for (let index = 0; index < metadata.records.length; index++) {
    const rejectedRecordReason = getRejectedPendingPassiveFlushRecordReason(
      metadata.records[index],
      index
    );
    if (rejectedRecordReason !== null) {
      return rejectedRecordReason;
    }
  }
  return null;
}

function createPrivateActPassiveEffectDrainDiagnosticError(reason) {
  const error = createUnsupportedError(
    `_Scheduler.${privateActPassiveEffectDrainDiagnosticsExport}`,
    'rejected private act passive-effect drain diagnostics',
    `Only accepted private native update execution results and branded pending-passive flush metadata can be consumed by this private gate. Rejection reason: ${reason}.`,
    undefined,
    undefined,
    actSchedulerGate
  );

  error.name = 'FastReactTestRendererPrivateActPassiveEffectDrainError';
  error.code =
    'FAST_REACT_TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_REJECTED';
  error.reason = reason;
  error.publicReactActCompatibilityClaimed = false;
  error.publicActCompatibilityClaimed = false;
  error.executesPassiveEffects = false;
  error.invokesEffectCallbacks = false;
  return error;
}

function describeAcceptedPendingPassiveFlushMetadata(metadata) {
  const rejectionReason =
    getRejectedPendingPassiveFlushMetadataReason(metadata);
  const pendingCount =
    isObjectLike(metadata) && Array.isArray(metadata.records)
      ? metadata.records.length
      : 0;

  return freezeRecord({
    status:
      rejectionReason === null
        ? 'accepted-pending-passive-flush-metadata'
        : 'rejected-pending-passive-flush-metadata',
    accepted: rejectionReason === null,
    rejectionReason,
    metadataKind: isObjectLike(metadata) ? metadata.kind : null,
    pendingCount,
    consumer: 'react-test-renderer-act-passive-effect-drain-private-gate',
    gateStatus: actSchedulerGateStatus,
    consumesPendingPassiveFlushMetadata: rejectionReason === null,
    consumesAcceptedSchedulerFlushMetadata: rejectionReason === null,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false
  });
}

function summarizePendingPassiveFlushRecord(record, index) {
  return freezeRecord({
    index,
    label: record.label,
    recordKind: record.recordKind,
    root: record.root,
    finishedWork: record.finishedWork,
    lanes: record.lanes,
    pendingUnmountCount: record.pendingUnmountCount,
    pendingMountCount: record.pendingMountCount,
    pendingRecordCount: record.pendingRecordCount,
    schedulerRequestOrder: record.schedulerRequestOrder,
    schedulerPriority: record.schedulerPriority,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false
  });
}

function consumeAcceptedPendingPassiveFlushMetadata(metadata) {
  const rejectionReason =
    getRejectedPendingPassiveFlushMetadataReason(metadata);
  if (rejectionReason !== null) {
    throw createPrivateActPassiveEffectDrainDiagnosticError(rejectionReason);
  }

  const pendingBefore = metadata.records.length;
  const drainedRecords = [];

  while (metadata.records.length > 0) {
    drainedRecords.push(
      summarizePendingPassiveFlushRecord(
        metadata.records.shift(),
        drainedRecords.length
      )
    );
  }

  return freezeRecord({
    status:
      'react-test-renderer-consumed-accepted-pending-passive-flush-metadata',
    passiveEffectDrainStatus:
      'drained-accepted-pending-passive-flush-metadata',
    accepted: true,
    metadataKind: metadata.kind,
    pendingBefore,
    drainedCount: drainedRecords.length,
    remainingCount: metadata.records.length,
    drainedRecords: freezeArray(drainedRecords),
    consumer: 'react-test-renderer-act-passive-effect-drain-private-gate',
    gateStatus: actSchedulerGateStatus,
    privatePassiveEffectDrainDiagnosticsConsumed: true,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    publicSchedulerFlushExecutionAvailable: false,
    publicActBehaviorAvailable: false,
    rendererRootsCompatibilityClaimed: false
  });
}

function getRejectedNativeUpdateExecutionResultReason(result) {
  if (!isObjectLike(result)) {
    return 'native-update-result-not-object';
  }
  if (!Object.isFrozen(result)) {
    return 'native-update-result-not-frozen';
  }
  if (result.kind !== 'FastReactTestRendererPrivateRootExecutionResult') {
    return 'native-update-result-kind';
  }
  if (result.status !== 'accepted-private-test-renderer-root-execution-result') {
    return 'native-update-result-status';
  }
  if (
    result.operation !== 'update' ||
    result.updateKind !== 'Update' ||
    result.rustOutcome !== 'Scheduled' ||
    result.scheduled !== true
  ) {
    return 'native-update-result-operation';
  }
  if (
    !isObjectLike(result.request) ||
    typeof result.request.rootId !== 'string'
  ) {
    return 'native-update-result-request';
  }
  if (
    result.privateRootRequestExecution !== true ||
    result.rustRootExecutionBoundaryCalled !== true ||
    result.rustExecution !== true ||
    result.reconcilerExecution !== true ||
    result.hostOutputProduced !== true
  ) {
    return 'native-update-result-execution-evidence';
  }
  if (
    result.publicRouteAvailable !== false ||
    result.publicCreateUpdateUnmountBehaviorAvailable !== false ||
    result.compatibilityClaimed !== false
  ) {
    return 'native-update-result-public-claim';
  }
  if (
    result.nativeAddonLoaded !== false ||
    result.nativeBridgeAvailable !== false ||
    result.nativeExecution !== false
  ) {
    return 'native-update-result-native-addon-claim';
  }

  const admission = result.privateUpdateNativeBridgeAdmission;
  if (!isObjectLike(admission) || !Object.isFrozen(admission)) {
    return 'native-update-admission-not-object';
  }
  if (
    admission.id !==
      'react-test-renderer-update-native-bridge-admission-private-diagnostic' ||
    admission.kind !== 'FastReactTestRendererPrivateUpdateNativeBridgeAdmission' ||
    admission.status !==
      'private-update-native-bridge-admission-host-output-handoff-public-update-blocked'
  ) {
    return 'native-update-admission-identity';
  }
  if (
    admission.operation !== 'update' ||
    admission.request !== result.request ||
    admission.requestId !== result.requestId ||
    admission.requestSequence !== result.requestSequence ||
    admission.updateKind !== 'Update' ||
    admission.updateOutcome !== 'Scheduled' ||
    admission.scheduled !== true
  ) {
    return 'native-update-admission-request';
  }
  if (
    admission.updateRouteAdmissionAccepted !== true ||
    admission.lifecycleEvidenceAccepted !== true ||
    admission.rootWorkLoopHandoffAccepted !== true ||
    admission.hostOutputHandoffAccepted !== true ||
    admission.hostComponentPropUpdateRecorded !== true ||
    admission.hostComponentStyleUpdateRecorded !== true ||
    admission.acceptedHostComponentUpdatePayloadShape !==
      'HostComponentPropStyleTextUpdate' ||
    admission.textUpdateApplyRecorded !== true ||
    admission.hostTextUpdateApplyCount !== 1 ||
    admission.hostComponentUpdateApplyCount !== 1 ||
    admission.rustExecutionFromJs !== true ||
    admission.reconcilerExecutionFromJs !== true ||
    admission.hostOutputProduced !== true
  ) {
    return 'native-update-admission-execution-evidence';
  }
  if (
    admission.publicUpdateCompatibilityClaimed !== false ||
    admission.publicSerializationAvailable !== false ||
    admission.actFlushingClaimed !== false ||
    admission.nativeBridgeAvailable !== false ||
    admission.nativeExecution !== false ||
    admission.compatibilityClaimed !== false
  ) {
    return 'native-update-admission-public-claim';
  }

  return null;
}

function describeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata(
  updateExecutionResult,
  metadata
) {
  const updateRejectionReason =
    getRejectedNativeUpdateExecutionResultReason(updateExecutionResult);
  const passiveRejectionReason =
    getRejectedPendingPassiveFlushMetadataReason(metadata);
  const accepted =
    updateRejectionReason === null && passiveRejectionReason === null;
  const pendingCount =
    isObjectLike(metadata) && Array.isArray(metadata.records)
      ? metadata.records.length
      : 0;

  return freezeRecord({
    id: privateActNativeUpdatePassiveEffectDrainDiagnosticId,
    status: accepted
      ? 'accepted-native-update-execution-and-pending-passive-flush-metadata'
      : 'rejected-native-update-execution-and-pending-passive-flush-metadata',
    accepted,
    rejectionReason: updateRejectionReason ?? passiveRejectionReason,
    updateExecutionAccepted: updateRejectionReason === null,
    passiveMetadataAccepted: passiveRejectionReason === null,
    nativeUpdateExecutionResultKind: isObjectLike(updateExecutionResult)
      ? updateExecutionResult.kind
      : null,
    updateExecutionStatus: isObjectLike(updateExecutionResult)
      ? updateExecutionResult.status
      : null,
    updateRequestId: isObjectLike(updateExecutionResult)
      ? updateExecutionResult.requestId
      : null,
    updateRequestSequence: isObjectLike(updateExecutionResult)
      ? updateExecutionResult.requestSequence
      : null,
    pendingCount,
    consumer:
      'react-test-renderer-act-native-update-passive-drain-private-gate',
    gateStatus: actSchedulerGateStatus,
    consumesAcceptedNativeUpdateExecution: accepted,
    consumesPrivateUpdateNativeBridgeAdmission: accepted,
    consumesAcceptedNativeUpdateHostOutput: accepted,
    consumesPendingPassiveFlushMetadata: passiveRejectionReason === null,
    consumesAcceptedSchedulerFlushMetadata: passiveRejectionReason === null,
    drainsAcceptedPendingPassiveFlushMetadata: accepted,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    publicUpdateCompatibilityClaimed: false,
    compatibilityClaimed: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false
  });
}

function consumeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata(
  updateExecutionResult,
  metadata
) {
  const description =
    describeAcceptedNativeUpdateExecutionAndPendingPassiveFlushMetadata(
      updateExecutionResult,
      metadata
    );
  if (description.accepted !== true) {
    throw createPrivateActPassiveEffectDrainDiagnosticError(
      description.rejectionReason
    );
  }

  const passiveDrainReport =
    consumeAcceptedPendingPassiveFlushMetadata(metadata);
  const admission = updateExecutionResult.privateUpdateNativeBridgeAdmission;

  return freezeRecord({
    id: privateActNativeUpdatePassiveEffectDrainDiagnosticId,
    status: privateActNativeUpdatePassiveEffectDrainStatus,
    accepted: true,
    consumer:
      'react-test-renderer-act-native-update-passive-drain-private-gate',
    gateStatus: actSchedulerGateStatus,
    nativeUpdateExecutionResultKind: updateExecutionResult.kind,
    updateExecutionStatus: updateExecutionResult.status,
    updateRequestId: updateExecutionResult.requestId,
    updateRequestSequence: updateExecutionResult.requestSequence,
    updateKind: updateExecutionResult.updateKind,
    updateOutcome: updateExecutionResult.rustOutcome,
    rootId: updateExecutionResult.request.rootId,
    privateUpdateNativeBridgeAdmission: admission,
    privateUpdateNativeBridgeAdmissionId: admission.id,
    privateUpdateNativeBridgeAdmissionStatus: admission.status,
    nativeUpdateExecutionConsumed: true,
    privateRootRequestExecutionConsumed: true,
    rustRootExecutionBoundaryCalled: true,
    rustExecution: true,
    reconcilerExecution: true,
    hostOutputProduced: true,
    hostComponentPropUpdateRecorded:
      admission.hostComponentPropUpdateRecorded,
    hostComponentStyleUpdateRecorded:
      admission.hostComponentStyleUpdateRecorded,
    acceptedHostComponentUpdatePayloadShape:
      admission.acceptedHostComponentUpdatePayloadShape,
    textUpdateApplyRecorded: admission.textUpdateApplyRecorded,
    hostTextUpdateApplyCount: admission.hostTextUpdateApplyCount,
    hostComponentUpdateApplyCount: admission.hostComponentUpdateApplyCount,
    pendingPassiveFlushDrainReport: passiveDrainReport,
    passiveEffectDrainStatus: passiveDrainReport.passiveEffectDrainStatus,
    pendingBefore: passiveDrainReport.pendingBefore,
    drainedCount: passiveDrainReport.drainedCount,
    remainingCount: passiveDrainReport.remainingCount,
    drainedRecords: passiveDrainReport.drainedRecords,
    privatePassiveEffectDrainDiagnosticsConsumed: true,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    consumesAcceptedNativeUpdateExecution: true,
    consumesPrivateUpdateNativeBridgeAdmission: true,
    consumesAcceptedNativeUpdateHostOutput: true,
    drainsAcceptedPendingPassiveFlushMetadata: true,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    publicUpdateCompatibilityClaimed: false,
    publicActBehaviorAvailable: false,
    publicSchedulerFlushExecutionAvailable: false,
    publicPassiveEffectFlushExecutionAvailable: false,
    publicCreateUpdateUnmountBehaviorAvailable: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    executesRendererRoots: false,
    mutatesHostOutput: false
  });
}

function freezePrivateActNestedScopePassiveFlushRecord(record) {
  Object.defineProperty(record, privateActNestedScopePassiveFlushBrand, {
    value: true
  });
  return Object.freeze(record);
}

function getRejectedNestedActScopePassiveFlushReason(
  metadata,
  scopeOptions
) {
  const passiveRejectionReason =
    getRejectedPendingPassiveFlushMetadataReason(metadata);
  if (passiveRejectionReason !== null) {
    return passiveRejectionReason;
  }
  if (metadata.records.length === 0) {
    return 'metadata-empty';
  }
  if (
    isObjectLike(scopeOptions) &&
    Object.hasOwn(scopeOptions, 'outerScopeDepth') &&
    scopeOptions.outerScopeDepth !== 1
  ) {
    return 'outer-scope-depth';
  }
  if (
    isObjectLike(scopeOptions) &&
    Object.hasOwn(scopeOptions, 'innerScopeDepth') &&
    scopeOptions.innerScopeDepth !== 2
  ) {
    return 'inner-scope-depth';
  }
  if (
    isObjectLike(scopeOptions) &&
    Object.hasOwn(scopeOptions, 'passiveFlushOrderIndex') &&
    scopeOptions.passiveFlushOrderIndex !== 2
  ) {
    return 'passive-flush-order-index';
  }
  if (
    actNestedScopeBlockerDiagnostics.invokesActCallback !== false ||
    actNestedScopeBlockerDiagnostics.executesPassiveEffects !== false ||
    actNestedScopeBlockerDiagnostics.compatibilityClaimed !== false
  ) {
    return 'nested-scope-blocker-opened-public-act';
  }
  return null;
}

function describeAcceptedNestedActScopePassiveFlush(
  metadata,
  scopeOptions = {}
) {
  const rejectionReason = getRejectedNestedActScopePassiveFlushReason(
    metadata,
    scopeOptions
  );
  const accepted = rejectionReason === null;
  const pendingBefore =
    isObjectLike(metadata) && Array.isArray(metadata.records)
      ? metadata.records.length
      : 0;

  return freezePrivateActNestedScopePassiveFlushRecord({
    id: privateActNestedScopePassiveFlushDiagnosticId,
    status: accepted
      ? actNestedScopePassiveFlushStatus
      : 'rejected-private-act-nested-scope-passive-flush',
    accepted,
    rejectionReason,
    acceptedWorker:
      'worker-700-test-renderer-act-nested-scope-passive-flush',
    buildsOnWorkers: freezeArray([
      'worker-473-test-renderer-act-passive-effect-drain',
      'worker-541-test-renderer-act-nested-scope-blockers',
      'worker-576-test-renderer-act-private-root-passive-sequence',
      'worker-670-test-renderer-act-passive-native-flush'
    ]),
    consumer:
      'react-test-renderer-act-nested-scope-passive-flush-private-gate',
    gateStatus: actSchedulerGateStatus,
    passiveEffectDrainStatus:
      'drained-accepted-pending-passive-flush-metadata',
    passiveFlushOrder: privateActNestedScopePassiveFlushOrder,
    outerScopeDepth: 1,
    innerScopeDepth: 2,
    passiveFlushOrderIndex: 2,
    pendingBefore,
    pendingPassiveRecordCount:
      isObjectLike(metadata) && Array.isArray(metadata.records)
        ? metadata.records.reduce(
            (total, record) => total + record.pendingRecordCount,
            0
          )
        : 0,
    consumesNestedScopeBlockerDiagnostics: accepted,
    consumesPendingPassiveFlushMetadata: accepted,
    consumesAcceptedSchedulerFlushMetadata: accepted,
    drainsAcceptedPendingPassiveFlushMetadata: accepted,
    deterministicFlushOrder: accepted,
    privateNestedScopeDepthTracking: accepted,
    privateNestedActQueueReuse: accepted,
    publicActScopeDepthTrackingAvailable: false,
    publicNestedActQueueReuseAvailable: false,
    publicOverlappingActWarningEmissionAvailable: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    executesRendererRoots: false
  });
}

function flushAcceptedNestedActScopePassiveWork(
  metadata,
  scopeOptions = {}
) {
  const description = describeAcceptedNestedActScopePassiveFlush(
    metadata,
    scopeOptions
  );
  if (description.accepted !== true) {
    throw createPrivateActPassiveEffectDrainDiagnosticError(
      description.rejectionReason
    );
  }

  const passiveDrainReport =
    consumeAcceptedPendingPassiveFlushMetadata(metadata);

  return freezePrivateActNestedScopePassiveFlushRecord({
    id: privateActNestedScopePassiveFlushDiagnosticId,
    status: actNestedScopePassiveFlushStatus,
    accepted: true,
    consumer:
      'react-test-renderer-act-nested-scope-passive-flush-private-gate',
    gateStatus: actSchedulerGateStatus,
    passiveEffectDrainStatus:
      passiveDrainReport.passiveEffectDrainStatus,
    passiveFlushOrder: privateActNestedScopePassiveFlushOrder,
    outerScopeDepth: 1,
    innerScopeDepth: 2,
    passiveFlushOrderIndex: 2,
    pendingBefore: passiveDrainReport.pendingBefore,
    drainedCount: passiveDrainReport.drainedCount,
    remainingCount: passiveDrainReport.remainingCount,
    drainedRecords: passiveDrainReport.drainedRecords,
    pendingPassiveFlushDrainReport: passiveDrainReport,
    consumesNestedScopeBlockerDiagnostics: true,
    privatePassiveEffectDrainDiagnosticsConsumed: true,
    consumesPendingPassiveFlushMetadata: true,
    consumesAcceptedSchedulerFlushMetadata: true,
    drainsAcceptedPendingPassiveFlushMetadata: true,
    deterministicFlushOrder: true,
    privateNestedScopeDepthTracking: true,
    privateNestedActQueueReuse: true,
    publicActScopeDepthTrackingAvailable: false,
    publicNestedActQueueReuseAvailable: false,
    publicOverlappingActWarningEmissionAvailable: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    publicActBehaviorAvailable: false,
    publicSchedulerFlushExecutionAvailable: false,
    publicPassiveEffectFlushExecutionAvailable: false,
    compatibilityClaimed: false,
    invokesActCallback: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesPassiveEffects: false,
    invokesEffectCallbacks: false,
    executesRendererRoots: false,
    mutatesHostOutput: false
  });
}

function shouldAttachPrivateActQueueFlushDiagnostics(key) {
  return schedulerMockFlushHelperMetadata.some((helper) => helper.key === key);
}

function attachPrivateActQueueFlushDiagnostics(fn) {
  Object.defineProperty(fn, privateActQueueFlushDiagnosticsExport, {
    configurable: false,
    enumerable: false,
    value: privateActQueueFlushDiagnostics,
    writable: false
  });

  return fn;
}

function createSchedulerPlaceholder() {
  const scheduler = {};

  for (const key of schedulerMockKeys) {
    if (Object.hasOwn(schedulerConstantValues, key)) {
      scheduler[key] = schedulerConstantValues[key];
    } else {
      const [name, length] = schedulerFunctionShapes[key];
      const schedulerFunction = createSchedulerUnsupportedFunction(
        key,
        name,
        length
      );
      scheduler[key] = shouldAttachPrivateActQueueFlushDiagnostics(key)
        ? attachPrivateActQueueFlushDiagnostics(schedulerFunction)
        : schedulerFunction;
    }
  }

  return scheduler;
}

const schedulerPlaceholder = createSchedulerPlaceholder();
const testRendererRootRequestBridge = createTestRendererRootRequestBridge();

function freezeRecord(record) {
  return Object.freeze(record);
}

function freezeArray(values) {
  return Object.freeze(values);
}

function getIdPrefix(value, fallback) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

const rootRequestPayloads = new WeakMap();
const rootHandleStates = new WeakMap();
const rendererRootHandles = new WeakMap();
const rootRequestCreatePreflights = new WeakMap();
const rootRequestCreateRouteAdmissions = new WeakMap();
const rootRequestTestInstanceQueryDiagnostics = new WeakMap();
const rootRequestErrorBoundaryDiagnostics = new WeakMap();
const rootRequestUpdateRouteAdmissions = new WeakMap();
const rootRequestUpdateNativeBridgeAdmissions = new WeakMap();

function createTestRendererRootRequestBridge(options) {
  const bridgeState = {
    nextRequestSequence: 1,
    nextRootSequence: 1,
    requestIdPrefix: getIdPrefix(
      options && options.requestIdPrefix,
      'test-renderer-request'
    ),
    rootIdPrefix: getIdPrefix(
      options && options.rootIdPrefix,
      'test-renderer-root'
    )
  };

  return freezeRecord({
    bridgeKind: 'FastReactTestRendererPrivateRootRequestBridge',
    entrypoint,
    status: rootRequestStatus,
    executionStatus: rootRequestExecutionStatus,
    compatibilityStatus: rootRequestCompatibilityStatus,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    recordOnlyBridge: false,
    privateRootExecutionBridgeAvailable: true,
    rustRootExecutionBoundaryCallable: true,
    rustRootExecutionBoundary: 'fast-react-test-renderer.TestRendererRoot',
    rustRootExecutionBridgeStatus:
      'admitted-private-test-renderer-native-root-execution-bridge',
    rustCanaryMetadata: currentRustTestRendererRootCanaryMetadata,
    createRootRequest(element, rootOptions) {
      return createRootRequestRecordWithBridge(
        bridgeState,
        element,
        rootOptions
      );
    },
    updateRootRequest(rootHandle, element, callback) {
      return createRootUpdateRequestRecordWithBridge(
        bridgeState,
        rootHandle,
        'update',
        element,
        callback
      );
    },
    unmountRootRequest(rootHandle, callback) {
      return createRootUpdateRequestRecordWithBridge(
        bridgeState,
        rootHandle,
        'unmount',
        null,
        callback
      );
    },
    updateRendererRootRequest(renderer, element, callback) {
      return createRootUpdateRequestRecordWithBridge(
        bridgeState,
        assertRendererRootHandle(renderer),
        'update',
        element,
        callback
      );
    },
    unmountRendererRootRequest(renderer, callback) {
      return createRootUpdateRequestRecordWithBridge(
        bridgeState,
        assertRendererRootHandle(renderer),
        'unmount',
        null,
        callback
      );
    },
    getRendererRootHandle(renderer) {
      return rendererRootHandles.get(renderer) || null;
    },
    getRootRequests(rootHandle) {
      return getRootRequestsForHandle(rootHandle);
    },
    getRendererRootRequests(renderer) {
      const rootHandle = rendererRootHandles.get(renderer);
      return rootHandle === undefined
        ? freezeArray([])
        : getRootRequestsForHandle(rootHandle);
    },
    getRequestPayload(record) {
      return rootRequestPayloads.get(record) || null;
    },
    getRustCanaryMetadata(record) {
      return getRustCanaryMetadataForRequestRecord(record);
    },
    getRustCanaryOperationMetadata(record) {
      return getRustCanaryOperationMetadataForRequestRecord(record);
    },
    getRootCreatePreflight(record) {
      return getRootCreatePreflightForRootRequest(record);
    },
    getRootCreateWorkLoopFinishedWorkPreflight(record) {
      return getRootCreatePreflightForRootRequest(record)
        .workLoopFinishedWorkPreflight;
    },
    getRendererRootCreatePreflight(renderer) {
      const rootHandle = rendererRootHandles.get(renderer);
      if (rootHandle === undefined) {
        return null;
      }
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getRootCreatePreflightForRootRequest(requests[0]);
    },
    getRendererRootCreateWorkLoopFinishedWorkPreflight(renderer) {
      const rootHandle = rendererRootHandles.get(renderer);
      if (rootHandle === undefined) {
        return null;
      }
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getRootCreatePreflightForRootRequest(requests[0])
            .workLoopFinishedWorkPreflight;
    },
    getRootCreateRouteAdmission(record) {
      return getRootCreateRouteAdmissionForRootRequest(record);
    },
    getRendererRootCreateRouteAdmission(renderer) {
      const rootHandle = rendererRootHandles.get(renderer);
      if (rootHandle === undefined) {
        return null;
      }
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getRootCreateRouteAdmissionForRootRequest(requests[0]);
    },
    getTestInstanceQueryDiagnostics(record) {
      return getTestInstanceQueryDiagnosticsForRootRequest(record);
    },
    getTestInstanceQueryBridgePreflight(record) {
      return getTestInstanceQueryBridgePreflightForRootRequest(record);
    },
    getRootErrorBoundaryDiagnostics(record) {
      return getPrivateErrorBoundaryDiagnosticsForRootRequest(record);
    },
    getRootTestInstanceQueryDiagnostics(rootHandle) {
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getTestInstanceQueryDiagnosticsForRootRequest(requests[0]);
    },
    getRootTestInstanceQueryBridgePreflight(rootHandle) {
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getTestInstanceQueryBridgePreflightForRootRequest(requests[0]);
    },
    getRootErrorBoundaryDiagnosticsForHandle(rootHandle) {
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getPrivateErrorBoundaryDiagnosticsForRootRequest(requests[0]);
    },
    getRendererTestInstanceQueryDiagnostics(renderer) {
      const rootHandle = rendererRootHandles.get(renderer);
      if (rootHandle === undefined) {
        return null;
      }
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getTestInstanceQueryDiagnosticsForRootRequest(requests[0]);
    },
    getRendererTestInstanceQueryBridgePreflight(renderer) {
      const rootHandle = rendererRootHandles.get(renderer);
      if (rootHandle === undefined) {
        return null;
      }
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getTestInstanceQueryBridgePreflightForRootRequest(requests[0]);
    },
    getRendererErrorBoundaryDiagnostics(renderer) {
      const rootHandle = rendererRootHandles.get(renderer);
      if (rootHandle === undefined) {
        return null;
      }
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getPrivateErrorBoundaryDiagnosticsForRootRequest(requests[0]);
    },
    canConsumeAcceptedRustLifecycleDiagnostic(record, diagnostic) {
      try {
        consumeAcceptedRustLifecycleDiagnosticForRequest(record, diagnostic);
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumeAcceptedRustLifecycleDiagnostic(record, diagnostic) {
      return consumeAcceptedRustLifecycleDiagnosticForRequest(
        record,
        diagnostic
      );
    },
    getUpdateRouteRootWorkLoopAdmission(record) {
      return getUpdateRouteAdmissionForRootRequest(record);
    },
    canConsumeAcceptedRustUpdateRouteRootWorkLoop(record, diagnostic) {
      try {
        consumeAcceptedRustUpdateRouteRootWorkLoopForRequest(
          record,
          diagnostic
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumeAcceptedRustUpdateRouteRootWorkLoop(record, diagnostic) {
      return consumeAcceptedRustUpdateRouteRootWorkLoopForRequest(
        record,
        diagnostic
      );
    },
    canConsumePrivateUpdateNativeBridgeAdmission(record, evidence) {
      try {
        consumePrivateUpdateNativeBridgeAdmissionForRequest(
          record,
          evidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumePrivateUpdateNativeBridgeAdmission(record, evidence) {
      return consumePrivateUpdateNativeBridgeAdmissionForRequest(
        record,
        evidence
      );
    },
    canConsumePrivateUnmountNativeBridgeAdmission(record, evidence) {
      try {
        consumePrivateUnmountNativeBridgeAdmissionForRequest(
          record,
          evidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumePrivateUnmountNativeBridgeAdmission(record, evidence) {
      return consumePrivateUnmountNativeBridgeAdmissionForRequest(
        record,
        evidence
      );
    },
    canConsumeAcceptedRustTestInstanceQueryDiagnostics(record, diagnostics) {
      try {
        consumeAcceptedRustTestInstanceQueryDiagnosticsForRequest(
          record,
          diagnostics
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumeAcceptedRustTestInstanceQueryDiagnostics(record, diagnostics) {
      return consumeAcceptedRustTestInstanceQueryDiagnosticsForRequest(
        record,
        diagnostics
      );
    },
    canConsumeAcceptedRustRootCreatePreflight(record, diagnostics) {
      try {
        consumeAcceptedRustRootCreatePreflightForRequest(record, diagnostics);
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumeAcceptedRustRootCreatePreflight(record, diagnostics) {
      return consumeAcceptedRustRootCreatePreflightForRequest(
        record,
        diagnostics
      );
    },
    canConsumeAcceptedRustRootCreateRouteAdmission(record, diagnostics) {
      try {
        consumeAcceptedRustRootCreateRouteAdmissionForRequest(
          record,
          diagnostics
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumeAcceptedRustRootCreateRouteAdmission(record, diagnostics) {
      return consumeAcceptedRustRootCreateRouteAdmissionForRequest(
        record,
        diagnostics
      );
    },
    canConsumePrivateCreateNativeBridgeHostOutputHandoff(record, evidence) {
      try {
        consumePrivateCreateNativeBridgeHostOutputHandoffForRequest(
          record,
          evidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumePrivateCreateNativeBridgeHostOutputHandoff(record, evidence) {
      return consumePrivateCreateNativeBridgeHostOutputHandoffForRequest(
        record,
        evidence
      );
    },
    createRootExecutionHandoff(record) {
      return createRootExecutionHandoff(record);
    },
    canConsumeRootExecutionResult(record, result) {
      try {
        consumeRootExecutionResult(record, result);
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumeRootExecutionResult(record, result) {
      return consumeRootExecutionResult(record, result);
    },
    executeRootRequest(record, executor) {
      return executeRootRequestWithBridge(record, executor);
    },
    isRootRequestRecord(record) {
      return isRootRequestRecord(record);
    }
  });
}

function createRootRequestRecordWithBridge(bridgeState, element, rootOptions) {
  const rootSequence = bridgeState.nextRootSequence++;
  const rootHandle = freezeRecord({
    $$typeof: privateRootHandleType,
    kind: 'FastReactTestRendererPrivateRootHandle',
    entrypoint,
    rootId: `${bridgeState.rootIdPrefix}:${rootSequence}`,
    rootSequence,
    lifecycleStatus: rootRequestLifecycleActive,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    compatibilityClaimed: false
  });
  const handleState = {
    bridgeState,
    lifecycleStatus: rootRequestLifecycleActive,
    nextElementHandleRaw: 1,
    requests: []
  };

  rootHandleStates.set(rootHandle, handleState);

  const request = createRootRequestRecord({
    bridgeState,
    callback: undefined,
    element,
    handleState,
    lifecycleStatusAfter: rootRequestLifecycleActive,
    lifecycleStatusBefore: null,
    operation: 'create',
    rootHandle,
    rootOptions,
    rustOutcome: 'Scheduled',
    scheduled: true
  });
  handleState.requests.push(request);
  return request;
}

function createRootUpdateRequestRecordWithBridge(
  bridgeState,
  rootHandle,
  operation,
  element,
  callback
) {
  const handleState = assertPrivateRootHandle(rootHandle);
  if (handleState.bridgeState !== bridgeState) {
    throwInvalidRootRequest(
      'Cannot use a test-renderer root request with a different bridge shell.'
    );
  }

  const lifecycleStatusBefore = handleState.lifecycleStatus;
  let lifecycleStatusAfter = lifecycleStatusBefore;
  let rustOutcome = 'Scheduled';
  let scheduled = true;

  if (operation === 'update') {
    if (lifecycleStatusBefore !== rootRequestLifecycleActive) {
      rustOutcome = 'IgnoredAfterUnmount';
      scheduled = false;
    }
  } else if (operation === 'unmount') {
    if (lifecycleStatusBefore === rootRequestLifecycleUnmountScheduled) {
      rustOutcome = 'AlreadyUnmountScheduled';
      scheduled = false;
    } else {
      lifecycleStatusAfter = rootRequestLifecycleUnmountScheduled;
    }
  } else {
    throwInvalidRootRequest(
      `Unsupported test-renderer root request operation: ${String(operation)}.`
    );
  }

  const request = createRootRequestRecord({
    bridgeState,
    callback,
    element,
    handleState,
    lifecycleStatusAfter,
    lifecycleStatusBefore,
    operation,
    rootHandle,
    rootOptions: undefined,
    rustOutcome,
    scheduled
  });

  handleState.lifecycleStatus = lifecycleStatusAfter;
  handleState.requests.push(request);
  return request;
}

function createRootRequestRecord({
  bridgeState,
  callback,
  element,
  handleState,
  lifecycleStatusAfter,
  lifecycleStatusBefore,
  operation,
  rootHandle,
  rootOptions,
  rustOutcome,
  scheduled
}) {
  const requestSequence = bridgeState.nextRequestSequence++;
  const requestType = getRootRequestType(operation);
  const updateKind = getRustUpdateKind(operation);
  const rootElementHandle =
    operation === 'unmount' || scheduled === false
      ? rootElementHandleNone
      : createRootElementHandle(handleState);
  const containerUpdateApi =
    operation === 'unmount' ? 'update_container_sync' : 'update_container';
  const rootApi = `TestRendererRoot::${operation}`;
  const sync = operation === 'unmount' && scheduled === true;
  const rustLifecycleDiagnostic =
    createRootRequestRustLifecycleDiagnosticRecord({
      consumedFromExternalDiagnostic: false,
      containerUpdateApi,
      lifecycleStatusAfter,
      lifecycleStatusBefore,
      operation,
      requestType,
      rootElementHandle,
      rustOutcome,
      scheduled,
      sourceDiagnostic: null,
      sync,
      updateKind
    });

  const record = freezeRecord({
    $$typeof: privateRootRequestRecordType,
    kind: 'FastReactTestRendererPrivateRootRequestRecord',
    entrypoint,
    compatibilityTarget,
    operation,
    requestId: `${bridgeState.requestIdPrefix}:${requestSequence}`,
    requestSequence,
    requestType,
    status: rootRequestStatus,
    executionStatus: rootRequestExecutionStatus,
    compatibilityStatus: rootRequestCompatibilityStatus,
    rootId: rootHandle.rootId,
    rootSequence: rootHandle.rootSequence,
    lifecycleStatusBefore,
    lifecycleStatusAfter,
    scheduled,
    rustOutcome,
    rustLifecycleDiagnostic,
    acceptedRustLifecycleDiagnostic: rustLifecycleDiagnostic,
    rootHandle,
    rootElementHandle,
    updateKind,
    rustUpdateKind: `TestRendererRootUpdateKind::${updateKind}`,
    rootApi,
    containerUpdateApi,
    schedulerApi: 'ensure_root_is_scheduled',
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    reconcilerExecution: false,
    hostOutputProduced: false,
    serializationAvailable: false,
    compatibilityClaimed: false,
    sync,
    elementInfo: describeRootRequestValue(element),
    optionsInfo:
      operation === 'create' ? describeCreateOptions(rootOptions) : null,
    callbackInfo: describeRootRequestValue(callback),
    privateRootCreatePreflightGate:
      operation === 'create' ? privateRootCreatePreflightGate : null,
    privateRootCreatePreflightAvailable: operation === 'create',
    privateCreateNativeBridgeHostOutputHandoffGate:
      operation === 'create' ? privateCreateRouteAdmissionGate : null,
    privateCreateNativeBridgeHostOutputHandoffAvailable:
      operation === 'create',
    privateUpdateRouteRootWorkLoopGate:
      operation === 'update' ? privateUpdateRouteRootWorkLoopGate : null,
    privateUpdateRouteRootWorkLoopAdmissionAvailable:
      operation === 'update',
    privateUpdateNativeBridgeAdmissionGate:
      operation === 'update'
        ? privateUpdateNativeBridgeAdmissionGate
        : null,
    privateUpdateNativeBridgeAdmissionAvailable: operation === 'update',
    privateErrorBoundaryDiagnosticsGate,
    privateErrorBoundaryDiagnosticsAvailable:
      operation === 'create' || operation === 'update',
    rustCanaryMetadata: currentRustTestRendererRootCanaryMetadata,
    rustCanaryOperationMetadata: getCurrentRustCanaryOperationMetadata(
      operation
    ),
    privateUnmountDeletionCommitHandoff:
      operation === 'unmount'
        ? createPrivateUnmountDeletionCommitHandoffRecord({
            lifecycleStatusAfter,
            lifecycleStatusBefore,
            scheduled,
            scheduledElementIsNone: rootElementHandle.isNone,
            updateOutcome: rustOutcome
          })
        : null,
    privateUnmountDeletionCommitHandoffAvailable: operation === 'unmount',
    privateUnmountPassiveRefCleanupOrderGate:
      operation === 'unmount'
        ? privateUnmountPassiveRefCleanupOrderGate
        : null,
    privateUnmountPassiveRefCleanupOrderAvailable:
      operation === 'unmount',
    privateUnmountNativeBridgeCleanupHandoffGate:
      operation === 'unmount'
        ? privateUnmountNativeBridgeCleanupHandoffGate
        : null,
    privateUnmountNativeBridgeCleanupHandoffAvailable:
      operation === 'unmount',
    privateUnmountNativeBridgeAdmissionGate:
      operation === 'unmount'
        ? privateUnmountNativeBridgeAdmissionGate
        : null,
    privateUnmountNativeBridgeAdmissionAvailable: operation === 'unmount',
    canaryShape: freezeRecord({
      rootType: 'TestRendererRoot',
      rootElementHandleType: 'RootElementHandle',
      updateKindEnum: 'TestRendererRootUpdateKind',
      updateKind,
      rootApi,
      rootCreatePreflightApi:
        operation === 'create'
          ? 'TestRendererRoot::describe_private_root_create_preflight_for_canary'
          : null,
      updateRouteAdmissionApi:
        operation === 'update'
          ? 'TestRendererRoot::describe_private_update_route_admission_for_canary'
          : null,
      updateNativeBridgeAdmissionApi:
        operation === 'update'
          ? 'TestRendererRoot::describe_private_update_native_bridge_admission_for_canary'
          : null,
      containerUpdateApi,
      schedulerApi: 'ensure_root_is_scheduled',
      expectedOutcome: rustOutcome,
      currentRustCanaryMetadataId:
        currentRustTestRendererRootCanaryMetadata.id,
      recordOnlyPrivateBridge: false,
      privateRootExecutionBridgeAvailable: true,
      rustRootExecutionBoundaryCallable: true,
      nativeBridgeAvailable: false
    }),
    blockedCapabilities: rootRequestBlockedCapabilities
  });

  rootRequestPayloads.set(record, {
    callback,
    element,
    rootHandle,
    rootOptions
  });

  return record;
}

function createRootRequestRustLifecycleDiagnosticRecord(options) {
  const rustLifecycleStatusBefore = toRustLifecycleStatus(
    options.lifecycleStatusBefore
  );
  const rustLifecycleStatusAfter = toRustLifecycleStatus(
    options.lifecycleStatusAfter
  );
  const rootElementHandleKind = options.rootElementHandle.isNone
    ? 'RootElementHandle::NONE'
    : 'RootElementHandle';

  return freezeRecord({
    id: `react-test-renderer-${options.operation}-accepted-rust-lifecycle-diagnostic`,
    kind: 'FastReactTestRendererAcceptedRustLifecycleDiagnostic',
    status: updateUnmountRustLifecycleDiagnosticGate.status,
    gate: updateUnmountRustLifecycleDiagnosticGate,
    operation: options.operation,
    requestType: options.requestType,
    sourceDiagnostic: options.sourceDiagnostic,
    consumedFromExternalDiagnostic: options.consumedFromExternalDiagnostic,
    rustRecords: updateUnmountRustLifecycleDiagnosticGate.acceptedRustRecords,
    lifecycleEnum: 'TestRendererRootLifecycle',
    lifecycleStatusBefore: rustLifecycleStatusBefore,
    lifecycleStatusAfter: rustLifecycleStatusAfter,
    jsLifecycleStatusBefore: options.lifecycleStatusBefore,
    jsLifecycleStatusAfter: options.lifecycleStatusAfter,
    updateKindEnum: 'TestRendererRootUpdateKind',
    updateKind: options.updateKind,
    updateOutcomeEnum: 'TestRendererRootUpdateOutcome',
    updateOutcome: options.rustOutcome,
    outcomeRecord: `TestRendererRootUpdateOutcome::${options.rustOutcome}`,
    scheduledUpdateRecord: options.scheduled
      ? 'TestRendererRootScheduledUpdate'
      : null,
    rootElementHandleKind,
    rootElementHandleIsNone: options.rootElementHandle.isNone,
    containerUpdateApi: options.scheduled
      ? options.containerUpdateApi
      : null,
    schedulerApi: options.scheduled ? 'ensure_root_is_scheduled' : null,
    sync: options.scheduled ? options.sync : null,
    schedulesRootUpdate: options.scheduled,
    consumesAcceptedRustLifecycleDiagnostics: true,
    privateDiagnosticConsumed: true,
    publicRouteAvailable: false,
    publicCreateUpdateUnmountBehaviorAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    reconcilerExecutionFromJs: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  });
}

function consumePrivateUpdateNativeBridgeAdmissionForRequest(
  record,
  evidence,
  acceptedLifecycleDiagnostic
) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }
  if (record.operation !== 'update') {
    throwInvalidRootRequest(
      'Private update native bridge admission only accepts update requests.'
    );
  }
  if (
    record.rustOutcome !== testRendererRootUpdateOutcomeScheduled ||
    record.scheduled !== true
  ) {
    throwInvalidRootRequest(
      'Private update native bridge admission requires a scheduled update request.'
    );
  }
  if (evidence === null || typeof evidence !== 'object') {
    throwInvalidRootRequest(
      'Expected private update native bridge admission evidence.'
    );
  }
  if (
    readDiagnosticField(evidence, [
      'hostOutputProduced',
      'host_output_produced',
      'hostOutputProducedFromJs'
    ]) !== true
  ) {
    throwInvalidRootRequest(
      'Private update native bridge admission requires update host-output handoff evidence.'
    );
  }

  const consumedLifecycleDiagnostic =
    acceptedLifecycleDiagnostic ??
    consumeAcceptedRustLifecycleDiagnosticForRequest(
      record,
      readUpdateAdmissionLifecycleDiagnostic(evidence)
    );
  const updateRouteAdmission =
    consumeAcceptedRustUpdateRouteRootWorkLoopForRequest(
      record,
      readUpdateAdmissionRouteDiagnostic(evidence)
    );
  const admission = createPrivateUpdateNativeBridgeAdmissionRecord({
    evidence,
    record,
    rustLifecycleDiagnostic: consumedLifecycleDiagnostic,
    updateRouteAdmission
  });
  rootRequestUpdateNativeBridgeAdmissions.set(record, admission);
  return admission;
}

function readUpdateAdmissionLifecycleDiagnostic(evidence) {
  if (evidence === null || typeof evidence !== 'object') {
    throwInvalidRootRequest(
      'Expected private update admission evidence with lifecycle diagnostics.'
    );
  }

  return readDiagnosticField(evidence, [
    'rustLifecycleDiagnostic',
    'lifecycleDiagnostic',
    'acceptedRustLifecycleDiagnostic'
  ]) ?? evidence;
}

function readUpdateAdmissionRouteDiagnostic(evidence) {
  if (evidence === null || typeof evidence !== 'object') {
    throwInvalidRootRequest(
      'Expected private update admission evidence with update route diagnostics.'
    );
  }

  const diagnostic =
    readDiagnosticField(evidence, [
      'updateRouteRootWorkLoopDiagnostic',
      'privateUpdateRouteRootWorkLoopDiagnostic',
      'updateHostOutputHandoff',
      'hostOutputHandoff',
      'update_route_root_work_loop_diagnostic'
    ]) ?? evidence;
  if (diagnostic === null || typeof diagnostic !== 'object') {
    throwInvalidRootRequest(
      'Expected Rust update route root work-loop handoff diagnostics.'
    );
  }
  return diagnostic;
}

function createPrivateUpdateNativeBridgeAdmissionRecord(options) {
  const hostOutputEvidence = options.updateRouteAdmission.hostOutputEvidence;

  return freezeRecord({
    id: privateUpdateNativeBridgeAdmissionDiagnosticId,
    kind: 'FastReactTestRendererPrivateUpdateNativeBridgeAdmission',
    status: privateUpdateNativeBridgeAdmissionStatus,
    gate: privateUpdateNativeBridgeAdmissionGate,
    operation: 'update',
    publicSurface: 'create().update',
    request: options.record,
    requestId: options.record.requestId,
    requestSequence: options.record.requestSequence,
    rootId: options.record.rootId,
    rootSequence: options.record.rootSequence,
    updateKind: testRendererRootUpdateKindUpdate,
    updateOutcome: testRendererRootUpdateOutcomeScheduled,
    scheduled: true,
    lifecycleStatusBefore: options.record.lifecycleStatusBefore,
    lifecycleStatusAfter: options.record.lifecycleStatusAfter,
    routeDependencyId:
      'react-test-renderer-update-route-private-diagnostic',
    updateRouteAdmissionId: privateUpdateRouteRootWorkLoopAdmissionId,
    rustLifecycleDiagnostic: options.rustLifecycleDiagnostic,
    updateRouteRootWorkLoopAdmission: options.updateRouteAdmission,
    updateRouteRootWorkLoopDiagnostic:
      options.updateRouteAdmission.sourceDiagnostic,
    sourceDiagnostic: options.evidence,
    updateRouteAdmissionAccepted: true,
    lifecycleEvidenceAccepted: true,
    rootWorkLoopHandoffAccepted: true,
    hostOutputHandoffAccepted: true,
    hostComponentPropUpdateRecorded:
      hostOutputEvidence.hostComponentPropUpdateRecorded,
    hostComponentStyleUpdateRecorded:
      hostOutputEvidence.hostComponentStyleUpdateRecorded,
    acceptedHostComponentUpdatePayloadShape:
      hostOutputEvidence.acceptedHostComponentUpdatePayloadShape,
    textUpdateApplyRecorded: hostOutputEvidence.textUpdateApplyRecorded,
    hostTextUpdateApplyCount: hostOutputEvidence.hostTextUpdateApplyCount,
    hostComponentUpdateApplyCount:
      hostOutputEvidence.hostComponentUpdateApplyCount,
    rejectsStaleUpdateHandoffs: true,
    rejectsUnmountedRoots: true,
    rejectsMissingHostOutputHandoff: true,
    publicUpdateCompatibilityClaimed: false,
    publicSerializationAvailable: false,
    actFlushingClaimed: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: true,
    reconcilerExecutionFromJs: true,
    hostOutputProduced: true,
    compatibilityClaimed: false
  });
}

function createPrivateUnmountDeletionCommitHandoffRecord(options) {
  const alreadyUnmounted =
    options.updateOutcome === testRendererRootUpdateOutcomeAlreadyUnmountScheduled;
  const scheduledElementIsNone =
    options.scheduledElementIsNone === undefined
      ? true
      : options.scheduledElementIsNone === true;

  return freezeRecord({
    id: privateUnmountDeletionCommitHandoffDiagnosticId,
    kind: 'FastReactTestRendererPrivateUnmountDeletionCommitHandoff',
    status: privateUnmountDeletionCommitHandoffStatus,
    gate: privateUnmountDeletionCommitHandoffGate,
    operation: 'unmount',
    publicSurface: 'create().unmount',
    updateKind: testRendererRootUpdateKindUnmount,
    updateOutcome: options.updateOutcome,
    expectedOutcome: options.updateOutcome,
    lifecycleStatusBefore: options.lifecycleStatusBefore,
    lifecycleStatusAfter: options.lifecycleStatusAfter,
    lifecycleTransition: describeLifecycleTransition(
      options.lifecycleStatusBefore,
      options.lifecycleStatusAfter
    ),
    scheduled: options.scheduled,
    scheduledElementIsNone,
    sync: options.scheduled ? true : null,
    deletionCommitHandoffAvailable: options.scheduled === true,
    deletionCommitHandoffRejected: options.scheduled !== true,
    rejectionReason: alreadyUnmounted ? 'already-unmounted-root-record' : null,
    commitRecord: 'HostRootCommitRecord',
    hostNodeDeletionCleanupLog: 'HostRootDeletionCleanupLog',
    hostNodeCleanupReport: 'TestRendererHostNodeCleanupReport',
    rustDiagnostic:
      'TestRendererUnmountDeletionCommitHandoffDiagnostics',
    hostChildDetachmentBlockers: privateUnmountHostChildDetachmentBlockers,
    passiveRefCleanupOrderGate: privateUnmountPassiveRefCleanupOrderGate,
    passiveRefCleanupOrderEvidenceAvailable: options.scheduled === true,
    lifecycleStatusMetadataAvailable: true,
    staleRootRecordRejection: true,
    alreadyUnmountedRootRecordRejection: true,
    publicRouteAvailable: false,
    publicUnmountCompatibilityClaimed: false,
    publicHostTeardownCompatibilityClaimed: false,
    actFlushingClaimed: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    reconcilerExecutionFromJs: false,
    compatibilityClaimed: false
  });
}

function consumePrivateUnmountNativeBridgeAdmissionForRequest(
  record,
  evidence,
  acceptedLifecycleDiagnostic
) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }
  if (record.operation !== 'unmount') {
    throwInvalidRootRequest(
      'Private unmount native bridge admission only accepts unmount requests.'
    );
  }
  if (record.rustOutcome === testRendererRootUpdateOutcomeAlreadyUnmountScheduled) {
    throwInvalidRootRequest(
      'Private unmount native bridge admission rejects already-unmounted roots.'
    );
  }
  if (record.scheduled !== true) {
    throwInvalidRootRequest(
      'Private unmount native bridge admission requires a scheduled unmount request.'
    );
  }

  const consumedLifecycleDiagnostic =
    acceptedLifecycleDiagnostic ??
    consumeAcceptedRustLifecycleDiagnosticForRequest(
      record,
      readUnmountAdmissionLifecycleDiagnostic(evidence)
    );
  const cleanupHandoff =
    normalizeAcceptedRustUnmountNativeBridgeCleanupHandoff(evidence);
  const deletionCommitHandoff = cleanupHandoff.deletionCommitHandoff;
  assertAcceptedRustUnmountNativeBridgeCleanupHandoffMatchesRequest(
    record,
    cleanupHandoff
  );
  assertAcceptedRustUnmountDeletionCommitHandoffMatchesRequest(
    record,
    deletionCommitHandoff
  );

  return createPrivateUnmountNativeBridgeAdmissionRecord({
    cleanupHandoff,
    deletionCommitHandoff,
    record,
    rustLifecycleDiagnostic: consumedLifecycleDiagnostic
  });
}

function readUnmountAdmissionLifecycleDiagnostic(evidence) {
  if (evidence === null || typeof evidence !== 'object') {
    throwInvalidRootRequest(
      'Expected private unmount admission evidence with lifecycle diagnostics.'
    );
  }

  const diagnostic =
    readDiagnosticField(evidence, [
      'rustLifecycleDiagnostic',
      'lifecycleDiagnostic',
      'acceptedRustLifecycleDiagnostic'
    ]) ?? evidence;
  return diagnostic;
}

function normalizeAcceptedRustUnmountDeletionCommitHandoff(evidence) {
  if (evidence === null || typeof evidence !== 'object') {
    throwInvalidRootRequest(
      'Expected private unmount deletion commit handoff evidence.'
    );
  }

  const handoff =
    readDiagnosticField(evidence, [
      'privateUnmountDeletionCommitHandoff',
      'unmountDeletionCommitHandoff',
      'deletionCommitHandoff',
      'deletion_commit_handoff'
    ]) ?? evidence;
  if (handoff === null || typeof handoff !== 'object') {
    throwInvalidRootRequest(
      'Expected a Rust unmount deletion commit handoff diagnostic object.'
    );
  }

  const blockers = readDiagnosticField(handoff, [
    'hostChildDetachmentBlockers',
    'host_child_detachment_blockers'
  ]);
  if (blockers === null || typeof blockers !== 'object') {
    throwInvalidRootRequest(
      'Expected Rust unmount deletion handoff cleanup blocker metadata.'
    );
  }
  const passiveRefCleanupOrder = readDiagnosticField(handoff, [
    'passiveRefCleanupOrder',
    'passiveRefCleanupOrderEvidence',
    'passive_ref_cleanup_order',
    'passive_ref_cleanup_order_evidence'
  ]);
  if (
    passiveRefCleanupOrder === null ||
    typeof passiveRefCleanupOrder !== 'object'
  ) {
    throwInvalidRootRequest(
      'Expected Rust unmount deletion handoff passive/ref cleanup order evidence.'
    );
  }

  return freezeRecord({
    sourceDiagnostic: handoff,
    diagnosticId: readDiagnosticField(handoff, [
      'diagnosticId',
      'diagnostic_id',
      'id'
    ]),
    status: readDiagnosticField(handoff, ['status']),
    requestId: readDiagnosticField(handoff, [
      'rootRequestId',
      'requestId',
      'request_id'
    ]),
    rootId: readDiagnosticField(handoff, [
      'jsRootId',
      'rootId',
      'root_id',
      'root'
    ]),
    lifecycle: normalizeRustLifecycleStatus(
      readDiagnosticField(handoff, ['lifecycle', 'lifecycleStatusAfter'])
    ),
    scheduledUpdateKind: normalizeRustUpdateKind(
      readDiagnosticField(handoff, [
        'scheduledUpdateKind',
        'scheduled_update_kind',
        'updateKind'
      ])
    ),
    scheduledElementIsNone: readBooleanDiagnosticField(handoff, [
      'scheduledElementIsNone',
      'scheduled_element_is_none'
    ]),
    commitCurrentIsStoreCurrent: readBooleanDiagnosticField(handoff, [
      'commitCurrentIsStoreCurrent',
      'commit_current_is_store_current'
    ]),
    renderCurrentMatchesCommitPreviousCurrent: readBooleanDiagnosticField(
      handoff,
      [
        'renderCurrentMatchesCommitPreviousCurrent',
        'render_current_matches_commit_previous_current'
      ]
    ),
    renderFinishedWorkMatchesCommitCurrent: readBooleanDiagnosticField(
      handoff,
      [
        'renderFinishedWorkMatchesCommitCurrent',
        'render_finished_work_matches_commit_current'
      ]
    ),
    deletionListCount: readNonNegativeDiagnosticInteger(handoff, [
      'deletionListCount',
      'deletion_list_count'
    ]),
    deletedRootCount: readNonNegativeDiagnosticInteger(handoff, [
      'deletedRootCount',
      'deleted_root_count'
    ]),
    hostNodeCleanupCount: readNonNegativeDiagnosticInteger(handoff, [
      'hostNodeCleanupCount',
      'host_node_cleanup_count'
    ]),
    cleanupRecordsMatchDeletionCommit: readBooleanDiagnosticField(handoff, [
      'cleanupRecordsMatchDeletionCommit',
      'cleanup_records_match_deletion_commit'
    ]),
    cleanupOrderRecordCount: readNonNegativeDiagnosticInteger(handoff, [
      'cleanupOrderRecordCount',
      'cleanup_order_record_count'
    ]),
    publicUnmountCompatibilityClaimed: readBooleanDiagnosticField(handoff, [
      'publicUnmountCompatibilityClaimed',
      'public_unmount_compatibility_claimed'
    ]),
    publicHostTeardownCompatibilityClaimed: readBooleanDiagnosticField(
      handoff,
      [
        'publicHostTeardownCompatibilityClaimed',
        'public_host_teardown_compatibility_claimed'
      ]
    ),
    actFlushingClaimed: readBooleanDiagnosticField(handoff, [
      'actFlushingClaimed',
      'act_flushing_claimed'
    ]),
    hostChildDetachmentBlockers:
      normalizeAcceptedRustUnmountCleanupBlockers(blockers),
    passiveRefCleanupOrder:
      normalizeAcceptedRustUnmountPassiveRefCleanupOrder(passiveRefCleanupOrder)
  });
}

function normalizeAcceptedRustUnmountNativeBridgeCleanupHandoff(evidence) {
  if (evidence === null || typeof evidence !== 'object') {
    throwInvalidRootRequest(
      'Expected Rust unmount native bridge cleanup handoff evidence.'
    );
  }

  const cleanupHandoff = readDiagnosticField(evidence, [
    'privateUnmountNativeBridgeCleanupHandoff',
    'unmountNativeBridgeCleanupHandoff',
    'rustUnmountCleanupHandoff',
    'cleanupHandoff',
    'unmount_cleanup_handoff'
  ]);
  if (cleanupHandoff === null || typeof cleanupHandoff !== 'object') {
    throwInvalidRootRequest(
      'Expected a Rust unmount native bridge cleanup handoff diagnostic object.'
    );
  }

  const deletionCommitHandoff =
    normalizeAcceptedRustUnmountDeletionCommitHandoff(cleanupHandoff);
  const passiveRefCleanupOrder =
    normalizeAcceptedRustUnmountPassiveRefCleanupOrder(
      readDiagnosticField(cleanupHandoff, [
        'passiveRefCleanupOrder',
        'passiveRefCleanupOrderEvidence',
        'passive_ref_cleanup_order',
        'passive_ref_cleanup_order_evidence'
      ]) ?? deletionCommitHandoff.passiveRefCleanupOrder.sourceDiagnostic
    );

  return freezeRecord({
    sourceDiagnostic: cleanupHandoff,
    diagnosticId: readDiagnosticField(cleanupHandoff, [
      'diagnosticId',
      'diagnostic_id',
      'id'
    ]),
    status: readDiagnosticField(cleanupHandoff, ['status']),
    requestId: readDiagnosticField(cleanupHandoff, [
      'rootRequestId',
      'root_request_id',
      'requestId',
      'request_id'
    ]),
    rootId: readDiagnosticField(cleanupHandoff, [
      'jsRootId',
      'rootId',
      'root_id',
      'root'
    ]),
    routeOutcome: readDiagnosticField(cleanupHandoff, [
      'routeOutcome',
      'route_outcome'
    ]),
    routeDependencyId: readDiagnosticField(cleanupHandoff, [
      'routeDependencyId',
      'route_dependency_id'
    ]),
    deletionCommitHandoffId: readDiagnosticField(cleanupHandoff, [
      'deletionCommitHandoffId',
      'deletion_commit_handoff_id'
    ]),
    admissionDiagnosticId: readDiagnosticField(cleanupHandoff, [
      'admissionDiagnosticId',
      'admission_diagnostic_id'
    ]),
    lifecycle: normalizeRustLifecycleStatus(
      readDiagnosticField(cleanupHandoff, [
        'lifecycle',
        'lifecycleStatusAfter'
      ])
    ),
    scheduledUpdateKind: normalizeRustUpdateKind(
      readDiagnosticField(cleanupHandoff, [
        'scheduledUpdateKind',
        'scheduled_update_kind',
        'updateKind'
      ])
    ),
    scheduledElementIsNone: readBooleanDiagnosticField(cleanupHandoff, [
      'scheduledElementIsNone',
      'scheduled_element_is_none'
    ]),
    previousRootChildCount: readNonNegativeDiagnosticInteger(
      cleanupHandoff,
      ['previousRootChildCount', 'previous_root_child_count']
    ),
    currentRootChildCount: readNonNegativeDiagnosticInteger(cleanupHandoff, [
      'currentRootChildCount',
      'current_root_child_count'
    ]),
    detachedInstance: readBooleanDiagnosticField(cleanupHandoff, [
      'detachedInstance',
      'detached_instance'
    ]),
    detachedInstanceChildCount: readNonNegativeDiagnosticInteger(
      cleanupHandoff,
      ['detachedInstanceChildCount', 'detached_instance_child_count']
    ),
    hostNodeCleanupCount: readNonNegativeDiagnosticInteger(cleanupHandoff, [
      'hostNodeCleanupCount',
      'host_node_cleanup_count'
    ]),
    refCleanupReturnCount: passiveRefCleanupOrder.refCleanupReturnCount,
    passiveDestroyCount: passiveRefCleanupOrder.passiveDestroyCount,
    cleanupOrderRecordCount: readNonNegativeDiagnosticInteger(
      cleanupHandoff,
      ['cleanupOrderRecordCount', 'cleanup_order_record_count']
    ),
    nativeCleanupAfterRefAndPassiveOrdering:
      passiveRefCleanupOrder.nativeCleanupAfterRefAndPassiveOrdering,
    minimalTreeCleanupHandoff: readBooleanDiagnosticField(cleanupHandoff, [
      'minimalTreeCleanupHandoff',
      'minimal_tree_cleanup_handoff'
    ]),
    rustUnmountCleanupHandoffExecuted: readBooleanDiagnosticField(
      cleanupHandoff,
      [
        'rustUnmountCleanupHandoffExecuted',
        'rust_unmount_cleanup_handoff_executed'
      ]
    ),
    hostOutputProduced: readBooleanDiagnosticField(cleanupHandoff, [
      'hostOutputProduced',
      'host_output_produced'
    ]),
    publicUnmountCompatibilityClaimed: readBooleanDiagnosticField(
      cleanupHandoff,
      [
        'publicUnmountCompatibilityClaimed',
        'public_unmount_compatibility_claimed'
      ]
    ),
    publicHostTeardownCompatibilityClaimed: readBooleanDiagnosticField(
      cleanupHandoff,
      [
        'publicHostTeardownCompatibilityClaimed',
        'public_host_teardown_compatibility_claimed'
      ]
    ),
    actFlushingClaimed: readBooleanDiagnosticField(cleanupHandoff, [
      'actFlushingClaimed',
      'act_flushing_claimed'
    ]),
    nativeBridgeAvailable: readBooleanDiagnosticField(cleanupHandoff, [
      'nativeBridgeAvailable',
      'native_bridge_available'
    ]),
    nativeExecution: readBooleanDiagnosticField(cleanupHandoff, [
      'nativeExecution',
      'native_execution'
    ]),
    passiveRefCleanupOrder,
    deletionCommitHandoff
  });
}

function normalizeAcceptedRustUnmountPassiveRefCleanupOrder(evidence) {
  if (evidence === null || typeof evidence !== 'object') {
    throwInvalidRootRequest(
      'Expected Rust unmount passive/ref cleanup order evidence.'
    );
  }

  return freezeRecord({
    sourceDiagnostic: evidence,
    diagnosticId: readDiagnosticField(evidence, [
      'diagnosticId',
      'diagnostic_id',
      'id'
    ]),
    status: readDiagnosticField(evidence, ['status']),
    rootId: readDiagnosticField(evidence, [
      'jsRootId',
      'rootId',
      'root_id',
      'root'
    ]),
    refCleanupReturnCount: readNonNegativeDiagnosticInteger(evidence, [
      'refCleanupReturnCount',
      'ref_cleanup_return_count'
    ]),
    passiveDestroyCount: readNonNegativeDiagnosticInteger(evidence, [
      'passiveDestroyCount',
      'passive_destroy_count'
    ]),
    hostNodeCleanupCount: readNonNegativeDiagnosticInteger(evidence, [
      'hostNodeCleanupCount',
      'host_node_cleanup_count'
    ]),
    cleanupOrderRecordCount: readNonNegativeDiagnosticInteger(evidence, [
      'cleanupOrderRecordCount',
      'cleanup_order_record_count'
    ]),
    firstHostNodeCleanupOrder: readNullableNonNegativeDiagnosticInteger(
      evidence,
      ['firstHostNodeCleanupOrder', 'first_host_node_cleanup_order']
    ),
    lastRefCleanupReturnOrder: readNullableNonNegativeDiagnosticInteger(
      evidence,
      ['lastRefCleanupReturnOrder', 'last_ref_cleanup_return_order']
    ),
    firstPassiveDestroyOrder: readNullableNonNegativeDiagnosticInteger(
      evidence,
      ['firstPassiveDestroyOrder', 'first_passive_destroy_order']
    ),
    lastPassiveDestroyOrder: readNullableNonNegativeDiagnosticInteger(
      evidence,
      ['lastPassiveDestroyOrder', 'last_passive_destroy_order']
    ),
    refCleanupReturnPrecedesPassiveDestroy: readBooleanDiagnosticField(
      evidence,
      [
        'refCleanupReturnPrecedesPassiveDestroy',
        'ref_cleanup_return_precedes_passive_destroy'
      ]
    ),
    hostCleanupFollowsRefCleanupReturn: readBooleanDiagnosticField(evidence, [
      'hostCleanupFollowsRefCleanupReturn',
      'host_cleanup_follows_ref_cleanup_return'
    ]),
    hostCleanupFollowsPassiveDestroy: readBooleanDiagnosticField(evidence, [
      'hostCleanupFollowsPassiveDestroy',
      'host_cleanup_follows_passive_destroy'
    ]),
    nativeCleanupAfterRefAndPassiveOrdering: readBooleanDiagnosticField(
      evidence,
      [
        'nativeCleanupAfterRefAndPassiveOrdering',
        'native_cleanup_after_ref_and_passive_ordering'
      ]
    ),
    minimalTreeOrderingIsHostCleanupOnly: readBooleanDiagnosticField(
      evidence,
      [
        'minimalTreeOrderingIsHostCleanupOnly',
        'minimal_tree_ordering_is_host_cleanup_only'
      ]
    ),
    refCleanupReturnCallbacksInvoked: readBooleanDiagnosticField(evidence, [
      'refCleanupReturnCallbacksInvoked',
      'ref_cleanup_return_callbacks_invoked'
    ]),
    passiveDestroyCallbacksInvoked: readBooleanDiagnosticField(evidence, [
      'passiveDestroyCallbacksInvoked',
      'passive_destroy_callbacks_invoked'
    ]),
    publicEffectsFlushed: readBooleanDiagnosticField(evidence, [
      'publicEffectsFlushed',
      'public_effects_flushed'
    ]),
    publicRefOrEffectCompatibilityClaimed: readBooleanDiagnosticField(
      evidence,
      [
        'publicRefOrEffectCompatibilityClaimed',
        'public_ref_or_effect_compatibility_claimed'
      ]
    ),
    publicUnmountCompatibilityClaimed: readBooleanDiagnosticField(evidence, [
      'publicUnmountCompatibilityClaimed',
      'public_unmount_compatibility_claimed'
    ]),
    actFlushingClaimed: readBooleanDiagnosticField(evidence, [
      'actFlushingClaimed',
      'act_flushing_claimed'
    ])
  });
}

function normalizeAcceptedRustUnmountCleanupBlockers(blockers) {
  return freezeRecord({
    sourceDiagnostic: blockers,
    detachedInstance: readBooleanDiagnosticField(blockers, [
      'detachedInstance',
      'detached_instance'
    ]),
    detachedInstanceChildCount: readNonNegativeDiagnosticInteger(blockers, [
      'detachedInstanceChildCount',
      'detached_instance_child_count'
    ]),
    hostNodeCleanupInvalidatedCount: readNonNegativeDiagnosticInteger(
      blockers,
      [
        'hostNodeCleanupInvalidatedCount',
        'host_node_cleanup_invalidated_count'
      ]
    ),
    hostNodeCleanupAlreadyInactiveCount: readNonNegativeDiagnosticInteger(
      blockers,
      [
        'hostNodeCleanupAlreadyInactiveCount',
        'host_node_cleanup_already_inactive_count'
      ]
    ),
    hostNodeCleanupMissingHostNodeCount: readNonNegativeDiagnosticInteger(
      blockers,
      [
        'hostNodeCleanupMissingHostNodeCount',
        'host_node_cleanup_missing_host_node_count'
      ]
    ),
    hostNodeCleanupMissingStateNodeCount: readNonNegativeDiagnosticInteger(
      blockers,
      [
        'hostNodeCleanupMissingStateNodeCount',
        'host_node_cleanup_missing_state_node_count'
      ]
    ),
    broadHostChildDetachmentBlocked: readBooleanDiagnosticField(blockers, [
      'broadHostChildDetachmentBlocked',
      'broad_host_child_detachment_blocked'
    ]),
    publicHostTeardownCompatibilityClaimed: readBooleanDiagnosticField(
      blockers,
      [
        'publicHostTeardownCompatibilityClaimed',
        'public_host_teardown_compatibility_claimed'
      ]
    ),
    publicUnmountCompatibilityClaimed: readBooleanDiagnosticField(blockers, [
      'publicUnmountCompatibilityClaimed',
      'public_unmount_compatibility_claimed'
    ]),
    actFlushingClaimed: readBooleanDiagnosticField(blockers, [
      'actFlushingClaimed',
      'act_flushing_claimed'
    ])
  });
}

function assertAcceptedRustUnmountDeletionCommitHandoffMatchesRequest(
  record,
  handoff
) {
  if (handoff.diagnosticId !== privateUnmountDeletionCommitHandoffDiagnosticId) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff diagnostic id does not match the accepted gate.'
    );
  }
  if (handoff.status !== privateUnmountDeletionCommitHandoffStatus) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff status does not match the accepted gate.'
    );
  }
  if (
    handoff.requestId !== undefined &&
    handoff.requestId !== record.requestId
  ) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff request id does not match the private request.'
    );
  }
  if (handoff.rootId !== undefined && handoff.rootId !== record.rootId) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff root id does not match the private request.'
    );
  }
  if (handoff.lifecycle !== toRustLifecycleStatus(record.lifecycleStatusAfter)) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff lifecycle does not match the private request.'
    );
  }
  if (
    handoff.lifecycle !== 'UnmountScheduled' ||
    handoff.scheduledUpdateKind !== testRendererRootUpdateKindUnmount ||
    record.updateKind !== testRendererRootUpdateKindUnmount ||
    handoff.scheduledElementIsNone !== true ||
    record.rootElementHandle.isNone !== true
  ) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff does not describe the accepted unmount route.'
    );
  }
  if (
    handoff.commitCurrentIsStoreCurrent !== true ||
    handoff.renderCurrentMatchesCommitPreviousCurrent !== true ||
    handoff.renderFinishedWorkMatchesCommitCurrent !== true
  ) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff is stale for the current committed root.'
    );
  }
  if (handoff.deletionListCount < 1 || handoff.deletedRootCount < 1) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff is missing deletion list evidence.'
    );
  }
  assertPrivateUnmountCleanupBlockersPresent(handoff);
  assertPrivateUnmountPassiveRefCleanupOrderPresent(handoff);
  if (
    handoff.publicUnmountCompatibilityClaimed !== false ||
    handoff.publicHostTeardownCompatibilityClaimed !== false ||
    handoff.actFlushingClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff must not claim public unmount, host teardown, or act flushing.'
    );
  }
}

function assertAcceptedRustUnmountNativeBridgeCleanupHandoffMatchesRequest(
  record,
  cleanupHandoff
) {
  if (
    cleanupHandoff.diagnosticId !==
    privateUnmountNativeBridgeCleanupHandoffDiagnosticId
  ) {
    throwInvalidRootRequest(
      'Rust unmount cleanup handoff diagnostic id does not match the accepted gate.'
    );
  }
  if (
    cleanupHandoff.status !==
    privateUnmountNativeBridgeCleanupHandoffStatus
  ) {
    throwInvalidRootRequest(
      'Rust unmount cleanup handoff status does not match the accepted gate.'
    );
  }
  if (
    cleanupHandoff.requestId !== undefined &&
    cleanupHandoff.requestId !== record.requestId
  ) {
    throwInvalidRootRequest(
      'Rust unmount cleanup handoff request id does not match the private request.'
    );
  }
  if (
    cleanupHandoff.rootId !== undefined &&
    cleanupHandoff.rootId !== record.rootId
  ) {
    throwInvalidRootRequest(
      'Rust unmount cleanup handoff root id does not match the private request.'
    );
  }
  if (
    cleanupHandoff.routeOutcome !== testRendererRootUpdateOutcomeScheduled ||
    cleanupHandoff.lifecycle !==
      toRustLifecycleStatus(record.lifecycleStatusAfter) ||
    cleanupHandoff.scheduledUpdateKind !==
      testRendererRootUpdateKindUnmount ||
    cleanupHandoff.scheduledElementIsNone !== true ||
    cleanupHandoff.routeDependencyId !==
      'react-test-renderer-unmount-route-private-diagnostic' ||
    cleanupHandoff.deletionCommitHandoffId !==
      privateUnmountDeletionCommitHandoffDiagnosticId ||
    cleanupHandoff.admissionDiagnosticId !==
      privateUnmountNativeBridgeAdmissionDiagnosticId
  ) {
    throwInvalidRootRequest(
      'Rust unmount cleanup handoff does not describe the accepted native bridge admission.'
    );
  }
  if (
    cleanupHandoff.previousRootChildCount !== 1 ||
    cleanupHandoff.currentRootChildCount !== 0 ||
    cleanupHandoff.detachedInstance !== true ||
    cleanupHandoff.detachedInstanceChildCount !== 0 ||
    cleanupHandoff.minimalTreeCleanupHandoff !== true
  ) {
    throwInvalidRootRequest(
      'Rust unmount cleanup handoff does not describe the accepted minimal tree cleanup.'
    );
  }
  if (
    cleanupHandoff.hostNodeCleanupCount !==
      cleanupHandoff.deletionCommitHandoff.hostNodeCleanupCount ||
    cleanupHandoff.refCleanupReturnCount !==
      cleanupHandoff.passiveRefCleanupOrder.refCleanupReturnCount ||
    cleanupHandoff.passiveDestroyCount !==
      cleanupHandoff.passiveRefCleanupOrder.passiveDestroyCount ||
    cleanupHandoff.cleanupOrderRecordCount !==
      cleanupHandoff.deletionCommitHandoff.cleanupOrderRecordCount ||
    cleanupHandoff.nativeCleanupAfterRefAndPassiveOrdering !==
      cleanupHandoff.passiveRefCleanupOrder
        .nativeCleanupAfterRefAndPassiveOrdering ||
    cleanupHandoff.passiveRefCleanupOrder.hostNodeCleanupCount !==
      cleanupHandoff.deletionCommitHandoff.passiveRefCleanupOrder
        .hostNodeCleanupCount ||
    cleanupHandoff.passiveRefCleanupOrder.cleanupOrderRecordCount !==
      cleanupHandoff.deletionCommitHandoff.passiveRefCleanupOrder
        .cleanupOrderRecordCount ||
    cleanupHandoff.rustUnmountCleanupHandoffExecuted !== true ||
    cleanupHandoff.hostOutputProduced !== true
  ) {
    throwInvalidRootRequest(
      'Rust unmount cleanup handoff is missing actual cleanup execution evidence.'
    );
  }
  assertPrivateUnmountPassiveRefCleanupOrderPresent(
    cleanupHandoff.deletionCommitHandoff
  );
  if (
    cleanupHandoff.publicUnmountCompatibilityClaimed !== false ||
    cleanupHandoff.publicHostTeardownCompatibilityClaimed !== false ||
    cleanupHandoff.actFlushingClaimed !== false ||
    cleanupHandoff.nativeBridgeAvailable !== false ||
    cleanupHandoff.nativeExecution !== false
  ) {
    throwInvalidRootRequest(
      'Rust unmount cleanup handoff must not claim public unmount, host teardown, act flushing, native bridge availability, or native execution.'
    );
  }
}

function assertPrivateUnmountCleanupBlockersPresent(handoff) {
  if (handoff.hostNodeCleanupCount < 1) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff is missing host cleanup records.'
    );
  }
  if (handoff.cleanupRecordsMatchDeletionCommit !== true) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff cleanup records do not match the commit.'
    );
  }
  if (handoff.cleanupOrderRecordCount !== handoff.hostNodeCleanupCount) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff cleanup order evidence is incomplete.'
    );
  }

  const blockers = handoff.hostChildDetachmentBlockers;
  if (
    blockers.detachedInstance !== true ||
    blockers.detachedInstanceChildCount !== 0 ||
    blockers.broadHostChildDetachmentBlocked !== true
  ) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff is missing host child detachment blockers.'
    );
  }
  if (
    blockers.hostNodeCleanupInvalidatedCount !==
      handoff.hostNodeCleanupCount ||
    blockers.hostNodeCleanupAlreadyInactiveCount !== 0 ||
    blockers.hostNodeCleanupMissingHostNodeCount !== 0 ||
    blockers.hostNodeCleanupMissingStateNodeCount !== 0
  ) {
    throwInvalidRootRequest(
      'Rust unmount deletion handoff cleanup blocker counts are incomplete.'
    );
  }
  if (
    blockers.publicUnmountCompatibilityClaimed !== false ||
    blockers.publicHostTeardownCompatibilityClaimed !== false ||
    blockers.actFlushingClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Rust unmount cleanup blockers must not claim public unmount, host teardown, or act flushing.'
    );
  }
}

function assertPrivateUnmountPassiveRefCleanupOrderPresent(handoff) {
  const order = handoff.passiveRefCleanupOrder;
  if (order.diagnosticId !== privateUnmountPassiveRefCleanupOrderDiagnosticId) {
    throwInvalidRootRequest(
      'Rust unmount passive/ref cleanup order diagnostic id does not match the accepted gate.'
    );
  }
  if (order.status !== privateUnmountPassiveRefCleanupOrderStatus) {
    throwInvalidRootRequest(
      'Rust unmount passive/ref cleanup order status does not match the accepted gate.'
    );
  }
  if (
    order.rootId !== undefined &&
    order.rootId !== handoff.rootId
  ) {
    throwInvalidRootRequest(
      'Rust unmount passive/ref cleanup order root id does not match the deletion handoff.'
    );
  }
  if (
    order.hostNodeCleanupCount !== handoff.hostNodeCleanupCount ||
    order.cleanupOrderRecordCount !== handoff.cleanupOrderRecordCount ||
    order.cleanupOrderRecordCount !==
      order.refCleanupReturnCount +
        order.passiveDestroyCount +
        order.hostNodeCleanupCount
  ) {
    throwInvalidRootRequest(
      'Rust unmount passive/ref cleanup order counts do not match the native cleanup handoff.'
    );
  }
  if (
    order.refCleanupReturnPrecedesPassiveDestroy !== true ||
    order.hostCleanupFollowsRefCleanupReturn !== true ||
    order.hostCleanupFollowsPassiveDestroy !== true ||
    order.nativeCleanupAfterRefAndPassiveOrdering !== true
  ) {
    throwInvalidRootRequest(
      'Rust unmount passive/ref cleanup order does not place native cleanup after accepted ref/passive ordering.'
    );
  }
  if (
    order.refCleanupReturnCount !== 0 ||
    order.passiveDestroyCount !== 0 ||
    order.hostNodeCleanupCount !== 2 ||
    order.cleanupOrderRecordCount !== 2 ||
    order.firstHostNodeCleanupOrder !== 0 ||
    order.lastRefCleanupReturnOrder !== null ||
    order.firstPassiveDestroyOrder !== null ||
    order.lastPassiveDestroyOrder !== null ||
    order.minimalTreeOrderingIsHostCleanupOnly !== true
  ) {
    throwInvalidRootRequest(
      'Rust unmount passive/ref cleanup order does not describe the accepted minimal host-only tree.'
    );
  }
  if (
    order.refCleanupReturnCallbacksInvoked !== false ||
    order.passiveDestroyCallbacksInvoked !== false ||
    order.publicEffectsFlushed !== false ||
    order.publicRefOrEffectCompatibilityClaimed !== false ||
    order.publicUnmountCompatibilityClaimed !== false ||
    order.actFlushingClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Rust unmount passive/ref cleanup order must not claim public ref/effect, passive flush, act, or unmount behavior.'
    );
  }
}

function createPrivateUnmountNativeBridgeAdmissionRecord({
  cleanupHandoff,
  deletionCommitHandoff,
  record,
  rustLifecycleDiagnostic
}) {
  return freezeRecord({
    id: privateUnmountNativeBridgeAdmissionDiagnosticId,
    kind: 'FastReactTestRendererPrivateUnmountNativeBridgeAdmission',
    status: privateUnmountNativeBridgeAdmissionStatus,
    gate: privateUnmountNativeBridgeAdmissionGate,
    operation: 'unmount',
    publicSurface: 'create().unmount',
    request: record,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    rootId: record.rootId,
    rootSequence: record.rootSequence,
    updateKind: record.updateKind,
    updateOutcome: record.rustOutcome,
    scheduled: record.scheduled,
    lifecycleStatusBefore: record.lifecycleStatusBefore,
    lifecycleStatusAfter: record.lifecycleStatusAfter,
    privateUnmountRouteMetadata: record.privateUnmountDeletionCommitHandoff,
    rustLifecycleDiagnostic,
    cleanupHandoff,
    cleanupHandoffDiagnosticId: cleanupHandoff.diagnosticId,
    deletionCommitHandoff,
    deletionCommitHandoffDiagnosticId: deletionCommitHandoff.diagnosticId,
    passiveRefCleanupOrder: deletionCommitHandoff.passiveRefCleanupOrder,
    passiveRefCleanupOrderDiagnosticId:
      deletionCommitHandoff.passiveRefCleanupOrder.diagnosticId,
    consumesPrivateUnmountRouteMetadata: true,
    consumesAcceptedRustLifecycleDiagnostics: true,
    consumesAcceptedDeletionCommitHandoff: true,
    consumesActualRustCleanupHandoff: true,
    requiresActualRustCleanupHandoff: true,
    validatesLifecycleEvidence: true,
    validatesCleanupBlockers: true,
    validatesPassiveRefCleanupOrder: true,
    validatesMinimalTreeCleanupHandoff: true,
    tiesNativeCleanupToRefDetachmentAndPassiveDestroyOrder: true,
    deletionCommitHandoffAccepted: true,
    cleanupHandoffAccepted: true,
    lifecycleEvidenceAccepted: true,
    cleanupBlockersAccepted: true,
    passiveRefCleanupOrderAccepted: true,
    hostNodeCleanupCount: deletionCommitHandoff.hostNodeCleanupCount,
    refCleanupReturnCount:
      deletionCommitHandoff.passiveRefCleanupOrder.refCleanupReturnCount,
    passiveDestroyCount:
      deletionCommitHandoff.passiveRefCleanupOrder.passiveDestroyCount,
    cleanupOrderRecordCount: deletionCommitHandoff.cleanupOrderRecordCount,
    nativeCleanupAfterRefAndPassiveOrdering:
      deletionCommitHandoff.passiveRefCleanupOrder
        .nativeCleanupAfterRefAndPassiveOrdering,
    rustUnmountCleanupHandoffExecuted:
      cleanupHandoff.rustUnmountCleanupHandoffExecuted,
    hostOutputProduced: cleanupHandoff.hostOutputProduced,
    minimalTreeCleanupHandoff: cleanupHandoff.minimalTreeCleanupHandoff,
    rejectsAlreadyUnmountedRoots: true,
    rejectsStaleDeletionHandoffs: true,
    rejectsMissingCleanupBlockers: true,
    publicRouteAvailable: false,
    publicUnmountCompatibilityClaimed: false,
    publicHostTeardownCompatibilityClaimed: false,
    actFlushingClaimed: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    reconcilerExecutionFromJs: false,
    compatibilityClaimed: false
  });
}

function readBooleanDiagnosticField(record, names) {
  const value = readDiagnosticField(record, names);
  if (typeof value !== 'boolean') {
    throwInvalidRootRequest(
      `Expected boolean private unmount diagnostic field: ${names[0]}.`
    );
  }
  return value;
}

function readNonNegativeDiagnosticInteger(record, names) {
  const value = readDiagnosticField(record, names);
  if (!isNonNegativeInteger(value)) {
    throwInvalidRootRequest(
      `Expected non-negative integer private unmount diagnostic field: ${names[0]}.`
    );
  }
  return value;
}

function readNullableNonNegativeDiagnosticInteger(record, names) {
  const value = readDiagnosticField(record, names);
  if (value === null || value === undefined) {
    return null;
  }
  if (!isNonNegativeInteger(value)) {
    throwInvalidRootRequest(
      `Expected nullable non-negative integer private unmount diagnostic field: ${names[0]}.`
    );
  }
  return value;
}

function consumeAcceptedRustLifecycleDiagnosticForRequest(record, diagnostic) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }

  const normalized = normalizeAcceptedRustLifecycleDiagnostic(diagnostic);
  assertAcceptedRustLifecycleDiagnosticMatchesRequest(record, normalized);

  return createRootRequestRustLifecycleDiagnosticRecord({
    consumedFromExternalDiagnostic: true,
    containerUpdateApi: record.containerUpdateApi,
    lifecycleStatusAfter: record.lifecycleStatusAfter,
    lifecycleStatusBefore: record.lifecycleStatusBefore,
    operation: record.operation,
    requestType: record.requestType,
    rootElementHandle: record.rootElementHandle,
    rustOutcome: record.rustOutcome,
    scheduled: record.scheduled,
    sourceDiagnostic: normalized,
    sync: record.sync,
    updateKind: record.updateKind
  });
}

function normalizeAcceptedRustLifecycleDiagnostic(diagnostic) {
  if (diagnostic === null || typeof diagnostic !== 'object') {
    throwInvalidRootRequest(
      'Expected a Rust test-renderer lifecycle diagnostic object.'
    );
  }

  const operation = readDiagnosticField(diagnostic, [
    'operation',
    'rootOperation'
  ]);
  const updateKind = normalizeRustUpdateKind(
    readDiagnosticField(diagnostic, ['updateKind', 'kind', 'rustUpdateKind'])
  );
  const updateOutcome = normalizeRustUpdateOutcome(
    readDiagnosticField(diagnostic, [
      'updateOutcome',
      'outcome',
      'rustOutcome'
    ])
  );
  const lifecycleStatusBefore = normalizeRustLifecycleStatusOrUndefined(
    readDiagnosticField(diagnostic, [
      'lifecycleStatusBefore',
      'lifecycleBefore'
    ])
  );
  const lifecycleStatusAfter = normalizeRustLifecycleStatus(
    readDiagnosticField(diagnostic, [
      'lifecycleStatusAfter',
      'lifecycleAfter',
      'lifecycle'
    ])
  );
  const scheduledUpdate = readDiagnosticField(diagnostic, [
    'scheduledUpdate',
    'scheduled_update',
    'scheduled'
  ]);
  const hasScheduledUpdate =
    scheduledUpdate !== undefined && scheduledUpdate !== null;

  return freezeRecord({
    operation,
    updateKind,
    updateOutcome,
    lifecycleStatusBefore,
    lifecycleStatusAfter,
    hasScheduledUpdate,
    scheduledUpdate:
      hasScheduledUpdate === true
        ? normalizeAcceptedRustScheduledUpdate(scheduledUpdate)
        : null
  });
}

function normalizeAcceptedRustScheduledUpdate(scheduledUpdate) {
  if (scheduledUpdate === null || typeof scheduledUpdate !== 'object') {
    throwInvalidRootRequest(
      'Expected a TestRendererRootScheduledUpdate diagnostic object.'
    );
  }

  const element = readDiagnosticField(scheduledUpdate, [
    'element',
    'rootElement',
    'root_element'
  ]);
  const containerUpdate = readDiagnosticField(scheduledUpdate, [
    'containerUpdate',
    'container_update'
  ]);
  const rootSchedule = readDiagnosticField(scheduledUpdate, [
    'rootSchedule',
    'root_schedule'
  ]);

  return freezeRecord({
    kind: normalizeRustUpdateKind(
      readDiagnosticField(scheduledUpdate, ['kind', 'updateKind'])
    ),
    elementKind: normalizeRustRootElementKind(element),
    elementIsNone: normalizeRustRootElementIsNone(element),
    containerUpdateApi: readDiagnosticField(containerUpdate, ['api']),
    rootScheduleApi: readDiagnosticField(rootSchedule, ['api'])
  });
}

function assertAcceptedRustLifecycleDiagnosticMatchesRequest(
  record,
  diagnostic
) {
  if (
    diagnostic.operation !== undefined &&
    diagnostic.operation !== record.operation
  ) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic operation does not match the private request.'
    );
  }
  if (diagnostic.updateKind !== record.updateKind) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic update kind does not match the private request.'
    );
  }
  if (diagnostic.updateOutcome !== record.rustOutcome) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic outcome does not match the private request.'
    );
  }
  if (
    diagnostic.lifecycleStatusBefore !== undefined &&
    diagnostic.lifecycleStatusBefore !==
      toRustLifecycleStatus(record.lifecycleStatusBefore)
  ) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic previous lifecycle does not match the private request.'
    );
  }
  if (
    diagnostic.lifecycleStatusAfter !==
    toRustLifecycleStatus(record.lifecycleStatusAfter)
  ) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic current lifecycle does not match the private request.'
    );
  }
  if (diagnostic.hasScheduledUpdate !== record.scheduled) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic scheduled update presence does not match the private request.'
    );
  }

  if (!record.scheduled) {
    return;
  }

  if (diagnostic.scheduledUpdate.kind !== record.updateKind) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic scheduled update kind does not match the private request.'
    );
  }
  if (
    diagnostic.scheduledUpdate.containerUpdateApi !==
    record.containerUpdateApi
  ) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic container update API does not match the private request.'
    );
  }
  if (
    diagnostic.scheduledUpdate.rootScheduleApi !==
    'ensure_root_is_scheduled'
  ) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic root schedule API is not accepted.'
    );
  }

  const expectedElementKind = record.rootElementHandle.isNone
    ? 'RootElementHandle::NONE'
    : 'RootElementHandle';
  if (diagnostic.scheduledUpdate.elementKind !== expectedElementKind) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic scheduled element kind does not match the private request.'
    );
  }
  if (
    diagnostic.scheduledUpdate.elementIsNone !==
    record.rootElementHandle.isNone
  ) {
    throwInvalidRootRequest(
      'Rust lifecycle diagnostic scheduled element NONE flag does not match the private request.'
    );
  }
}

function getUpdateRouteAdmissionForRootRequest(record) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }
  if (record.operation !== 'update') {
    return null;
  }

  let admission = rootRequestUpdateRouteAdmissions.get(record);
  if (admission === undefined) {
    admission = createPrivateUpdateRouteRootWorkLoopAdmissionRecord(
      record,
      null
    );
    rootRequestUpdateRouteAdmissions.set(record, admission);
  }
  return admission;
}

function consumeAcceptedRustUpdateRouteRootWorkLoopForRequest(
  record,
  diagnostic
) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }
  if (record.operation !== 'update') {
    throwInvalidRootRequest(
      'Expected an update private root request record.'
    );
  }

  const admission = createPrivateUpdateRouteRootWorkLoopAdmissionRecord(
    record,
    diagnostic
  );
  rootRequestUpdateRouteAdmissions.set(record, admission);
  return admission;
}

function normalizeAcceptedRustUpdateRouteRootWorkLoopDiagnostic(diagnostic) {
  if (diagnostic === null || typeof diagnostic !== 'object') {
    throwInvalidRootRequest(
      'Expected a Rust test-renderer update route root work-loop diagnostic object.'
    );
  }

  const updateQueue = readDiagnosticField(diagnostic, [
    'updateQueueMetadata',
    'updateQueue',
    'update_queue'
  ]);
  const rootWorkLoop = readDiagnosticField(diagnostic, [
    'rootWorkLoopMetadata',
    'rootWorkLoop',
    'root_work_loop'
  ]);
  const hostTextUpdate = readDiagnosticField(diagnostic, [
    'hostTextUpdateMetadata',
    'hostTextUpdate',
    'host_text_update',
    'hostOutputEvidence'
  ]);

  return freezeRecord({
    diagnosticName: readDiagnosticField(diagnostic, [
      'diagnosticName',
      'diagnostic_name'
    ]),
    status: readDiagnosticField(diagnostic, ['status']),
    rootRequestId: readDiagnosticField(diagnostic, [
      'rootRequestId',
      'requestId',
      'request_id'
    ]),
    rootRequestSequence: readDiagnosticField(diagnostic, [
      'rootRequestSequence',
      'requestSequence',
      'request_sequence'
    ]),
    rootOperation: readDiagnosticField(diagnostic, [
      'rootOperation',
      'operation'
    ]),
    updateKind:
      readDiagnosticField(diagnostic, [
        'updateKind',
        'scheduledUpdateKind',
        'rustUpdateKind'
      ]) === undefined
        ? undefined
        : normalizeRustUpdateKind(
            readDiagnosticField(diagnostic, [
              'updateKind',
              'scheduledUpdateKind',
              'rustUpdateKind'
            ])
          ),
    updateOutcome:
      readDiagnosticField(diagnostic, [
        'updateOutcome',
        'rustOutcome',
        'outcome'
      ]) === undefined
        ? undefined
        : normalizeRustUpdateOutcome(
            readDiagnosticField(diagnostic, [
              'updateOutcome',
              'rustOutcome',
              'outcome'
            ])
          ),
    lifecycleStatusBefore: normalizeRustLifecycleStatusOrUndefined(
      readDiagnosticField(diagnostic, [
        'lifecycleStatusBefore',
        'lifecycleBefore'
      ])
    ),
    lifecycleStatusAfter: normalizeRustLifecycleStatusOrUndefined(
      readDiagnosticField(diagnostic, [
        'lifecycleStatusAfter',
        'lifecycleAfter',
        'lifecycle'
      ])
    ),
    hostOutputUpdateKind:
      readDiagnosticField(diagnostic, ['hostOutputUpdateKind']) === undefined
        ? undefined
        : normalizeRustUpdateKind(
            readDiagnosticField(diagnostic, ['hostOutputUpdateKind'])
          ),
    updateQueueMetadata:
      updateQueue == null
        ? null
        : normalizeAcceptedRustUpdateRouteQueueMetadata(updateQueue),
    rootWorkLoopMetadata:
      rootWorkLoop == null
        ? null
        : normalizeAcceptedRustUpdateRouteRootWorkLoopMetadata(rootWorkLoop),
    hostTextUpdateMetadata:
      hostTextUpdate == null
        ? null
        : normalizeAcceptedRustUpdateRouteHostTextMetadata(hostTextUpdate),
    publicRootUpdateAvailable: readDiagnosticField(diagnostic, [
      'publicRootUpdateAvailable',
      'public_root_update_available'
    ]),
    publicSerializationAvailable: readDiagnosticField(diagnostic, [
      'publicSerializationAvailable',
      'public_serialization_available'
    ]),
    nativeExecution: readDiagnosticField(diagnostic, [
      'nativeExecution',
      'native_execution'
    ]),
    rustExecutionFromJs: readDiagnosticField(diagnostic, [
      'rustExecutionFromJs',
      'rust_execution_from_js'
    ]),
    compatibilityClaimed: readDiagnosticField(diagnostic, [
      'compatibilityClaimed',
      'compatibility_claimed'
    ])
  });
}

function normalizeAcceptedRustUpdateRouteQueueMetadata(queue) {
  if (queue === null || typeof queue !== 'object') {
    throwInvalidRootRequest(
      'Expected Rust update route update-queue metadata.'
    );
  }

  return freezeRecord({
    record: readDiagnosticField(queue, ['record']),
    scheduleRecord: readDiagnosticField(queue, [
      'scheduleRecord',
      'schedule_record'
    ]),
    scheduledUpdateRecord: readDiagnosticField(queue, [
      'scheduledUpdateRecord',
      'scheduled_update_record'
    ]),
    scheduledUpdateKind:
      readDiagnosticField(queue, [
        'scheduledUpdateKind',
        'scheduled_update_kind'
      ]) === undefined
        ? undefined
        : normalizeRustUpdateKind(
            readDiagnosticField(queue, [
              'scheduledUpdateKind',
              'scheduled_update_kind'
            ])
          ),
    laneSource: readDiagnosticField(queue, ['laneSource', 'lane_source']),
    queueMatchesRenderCurrentQueue: readDiagnosticField(queue, [
      'queueMatchesRenderCurrentQueue',
      'queue_matches_render_current_queue'
    ]),
    selectedLanesMatchRenderLanes: readDiagnosticField(queue, [
      'selectedLanesMatchRenderLanes',
      'selected_lanes_match_render_lanes'
    ]),
    pendingLanesAfterEnqueueMatchRenderLanes: readDiagnosticField(queue, [
      'pendingLanesAfterEnqueueMatchRenderLanes',
      'pending_lanes_after_enqueue_match_render_lanes'
    ])
  });
}

function normalizeAcceptedRustUpdateRouteRootWorkLoopMetadata(workLoop) {
  if (workLoop === null || typeof workLoop !== 'object') {
    throwInvalidRootRequest(
      'Expected Rust update route root work-loop metadata.'
    );
  }

  return freezeRecord({
    renderPhaseRecord: readDiagnosticField(workLoop, [
      'renderPhaseRecord',
      'render_phase_record'
    ]),
    commitRecord: readDiagnosticField(workLoop, [
      'commitRecord',
      'commit_record'
    ]),
    appliedUpdateCount: readDiagnosticField(workLoop, [
      'appliedUpdateCount',
      'applied_update_count'
    ]),
    skippedUpdateCount: readDiagnosticField(workLoop, [
      'skippedUpdateCount',
      'skipped_update_count'
    ]),
    remainingLanesEmpty: readDiagnosticField(workLoop, [
      'remainingLanesEmpty',
      'remaining_lanes_empty'
    ]),
    commitCurrentMatchesRenderFinishedWork: readDiagnosticField(workLoop, [
      'commitCurrentMatchesRenderFinishedWork',
      'commit_current_matches_render_finished_work'
    ]),
    commitPreviousCurrentMatchesRenderCurrent: readDiagnosticField(workLoop, [
      'commitPreviousCurrentMatchesRenderCurrent',
      'commit_previous_current_matches_render_current'
    ]),
    commitLanesMatchRenderLanes: readDiagnosticField(workLoop, [
      'commitLanesMatchRenderLanes',
      'commit_lanes_match_render_lanes'
    ]),
    rootCurrentMatchesCommitCurrent: readDiagnosticField(workLoop, [
      'rootCurrentMatchesCommitCurrent',
      'root_current_matches_commit_current'
    ])
  });
}

function normalizeAcceptedRustUpdateRouteHostTextMetadata(hostTextUpdate) {
  if (hostTextUpdate === null || typeof hostTextUpdate !== 'object') {
    throwInvalidRootRequest(
      'Expected Rust update route host output metadata.'
    );
  }

  return freezeRecord({
    hostOutputUpdateRecord: readDiagnosticField(hostTextUpdate, [
      'hostOutputUpdateRecord',
      'host_output_update_record'
    ]),
    hostTextUpdateApplyRequired: readDiagnosticField(hostTextUpdate, [
      'hostTextUpdateApplyRequired',
      'host_text_update_apply_required'
    ]),
    hostComponentPropUpdateRecorded: readDiagnosticField(hostTextUpdate, [
      'hostComponentPropUpdateRecorded',
      'host_component_prop_update_recorded'
    ]),
    hostComponentStyleUpdateRecorded: readDiagnosticField(hostTextUpdate, [
      'hostComponentStyleUpdateRecorded',
      'host_component_style_update_recorded'
    ]),
    acceptedHostComponentUpdatePayloadShape: readDiagnosticField(hostTextUpdate, [
      'acceptedHostComponentUpdatePayloadShape',
      'accepted_host_component_update_payload_shape'
    ]),
    textUpdateApplyRecorded: readDiagnosticField(hostTextUpdate, [
      'textUpdateApplyRecorded',
      'text_update_apply_recorded'
    ]),
    hostTextUpdateApplyCount: readDiagnosticField(hostTextUpdate, [
      'hostTextUpdateApplyCount',
      'host_text_update_apply_count'
    ]),
    hostComponentUpdateApplyCount: readDiagnosticField(hostTextUpdate, [
      'hostComponentUpdateApplyCount',
      'host_component_update_apply_count'
    ])
  });
}

function assertAcceptedRustUpdateRouteRootWorkLoopMatchesRequest(
  record,
  diagnostic
) {
  if (record.operation !== 'update') {
    throwInvalidRootRequest(
      'Rust update route diagnostic cannot be consumed by a non-update request.'
    );
  }
  if (
    record.scheduled !== true ||
    record.rustOutcome !== testRendererRootUpdateOutcomeScheduled
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic was rejected for stale root lifecycle.'
    );
  }
  if (diagnostic.diagnosticName !== privateUpdateRouteRootWorkLoopDiagnosticName) {
    throwInvalidRootRequest(
      'Rust update route diagnostic name is not accepted.'
    );
  }
  if (diagnostic.status !== privateUpdateRouteRootWorkLoopStatus) {
    throwInvalidRootRequest(
      'Rust update route diagnostic status is not accepted.'
    );
  }
  if (
    diagnostic.rootOperation !== undefined &&
    diagnostic.rootOperation !== 'update'
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic operation does not match the private request.'
    );
  }
  if (
    diagnostic.updateKind !== undefined &&
    diagnostic.updateKind !== testRendererRootUpdateKindUpdate
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic update kind is not accepted.'
    );
  }
  if (
    diagnostic.updateOutcome !== undefined &&
    diagnostic.updateOutcome !== record.rustOutcome
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic outcome does not match the private request.'
    );
  }
  if (
    diagnostic.lifecycleStatusBefore !== undefined &&
    diagnostic.lifecycleStatusBefore !==
      toRustLifecycleStatus(record.lifecycleStatusBefore)
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic lifecycle before state is stale.'
    );
  }
  if (
    diagnostic.lifecycleStatusAfter !== undefined &&
    diagnostic.lifecycleStatusAfter !==
      toRustLifecycleStatus(record.lifecycleStatusAfter)
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic lifecycle after state is stale.'
    );
  }
  if (
    diagnostic.rootRequestId !== undefined &&
    diagnostic.rootRequestId !== record.requestId
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic host output belongs to a stale root request.'
    );
  }
  if (
    diagnostic.rootRequestSequence !== undefined &&
    diagnostic.rootRequestSequence !== record.requestSequence
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic request sequence is stale.'
    );
  }
  if (
    diagnostic.hostOutputUpdateKind !== undefined &&
    diagnostic.hostOutputUpdateKind !== testRendererRootUpdateKindUpdate
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic host output kind is not an update.'
    );
  }

  const queue = diagnostic.updateQueueMetadata;
  if (queue === null) {
    throwInvalidRootRequest(
      'Rust update route diagnostic is missing update queue evidence.'
    );
  }
  if (
    queue.record !== 'UpdateContainerResult' ||
    queue.scheduleRecord !== 'RootScheduleUpdateRecord' ||
    queue.scheduledUpdateRecord !== 'TestRendererRootScheduledUpdate' ||
    (queue.scheduledUpdateKind !== undefined &&
      queue.scheduledUpdateKind !== testRendererRootUpdateKindUpdate) ||
    queue.laneSource !== 'update_container' ||
    queue.queueMatchesRenderCurrentQueue !== true ||
    queue.selectedLanesMatchRenderLanes !== true ||
    queue.pendingLanesAfterEnqueueMatchRenderLanes !== true
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic update queue evidence is not accepted.'
    );
  }

  const workLoop = diagnostic.rootWorkLoopMetadata;
  if (
    workLoop === null ||
    workLoop.renderPhaseRecord !== 'HostRootRenderPhaseRecord' ||
    workLoop.commitRecord !== 'HostRootCommitRecord' ||
    workLoop.appliedUpdateCount !== 1 ||
    workLoop.skippedUpdateCount !== 0 ||
    workLoop.remainingLanesEmpty !== true ||
    workLoop.commitCurrentMatchesRenderFinishedWork !== true ||
    workLoop.commitPreviousCurrentMatchesRenderCurrent !== true ||
    workLoop.commitLanesMatchRenderLanes !== true ||
    workLoop.rootCurrentMatchesCommitCurrent !== true
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic root work-loop evidence is stale.'
    );
  }

  const hostText = diagnostic.hostTextUpdateMetadata;
  if (
    hostText === null ||
    hostText.hostOutputUpdateRecord !== 'TestRendererUpdatedHostOutput' ||
    hostText.hostTextUpdateApplyRequired !== true ||
    hostText.hostComponentPropUpdateRecorded !== true ||
    hostText.hostComponentStyleUpdateRecorded !== true ||
    hostText.acceptedHostComponentUpdatePayloadShape !==
      'HostComponentPropStyleTextUpdate' ||
    hostText.textUpdateApplyRecorded !== true ||
    hostText.hostTextUpdateApplyCount !== 1 ||
    hostText.hostComponentUpdateApplyCount !== 1
  ) {
    throwInvalidRootRequest(
      'Rust update route diagnostic host output evidence is stale.'
    );
  }

  for (const field of [
    'publicRootUpdateAvailable',
    'publicSerializationAvailable',
    'nativeExecution',
    'rustExecutionFromJs',
    'compatibilityClaimed'
  ]) {
    if (diagnostic[field] === true) {
      throwInvalidRootRequest(
        'Rust update route diagnostic cannot open public or native execution.'
      );
    }
  }
}

function createRootExecutionHandoff(record) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }

  const payload = rootRequestPayloads.get(record);

  return freezeRecord({
    kind: 'FastReactTestRendererPrivateRootExecutionHandoff',
    status: rootRequestExecutionStatus,
    compatibilityStatus: rootRequestCompatibilityStatus,
    entrypoint,
    compatibilityTarget,
    operation: record.operation,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    rootId: record.rootId,
    rootHandle: record.rootHandle,
    rootElementHandle: record.rootElementHandle,
    updateKind: record.updateKind,
    rustUpdateKind: record.rustUpdateKind,
    rootApi: record.rootApi,
    containerUpdateApi: record.scheduled ? record.containerUpdateApi : null,
    schedulerApi: record.scheduled ? record.schedulerApi : null,
    sync: record.scheduled ? record.sync : null,
    scheduled: record.scheduled,
    expectedOutcome: record.rustOutcome,
    payloadAvailable: payload !== undefined,
    elementInfo: record.elementInfo,
    optionsInfo: record.optionsInfo,
    callbackInfo: record.callbackInfo,
    privateUnmountDeletionCommitHandoff:
      record.privateUnmountDeletionCommitHandoff,
    privateUnmountDeletionCommitHandoffAvailable:
      record.privateUnmountDeletionCommitHandoffAvailable,
    privateCreateNativeBridgeHostOutputHandoffGate:
      record.privateCreateNativeBridgeHostOutputHandoffGate,
    privateCreateNativeBridgeHostOutputHandoffAvailable:
      record.privateCreateNativeBridgeHostOutputHandoffAvailable,
    privateUpdateNativeBridgeAdmissionGate:
      record.privateUpdateNativeBridgeAdmissionGate,
    privateUpdateNativeBridgeAdmissionAvailable:
      record.privateUpdateNativeBridgeAdmissionAvailable,
    privateUnmountNativeBridgeCleanupHandoffGate:
      record.privateUnmountNativeBridgeCleanupHandoffGate,
    privateUnmountNativeBridgeCleanupHandoffAvailable:
      record.privateUnmountNativeBridgeCleanupHandoffAvailable,
    privateUnmountPassiveRefCleanupOrderGate:
      record.privateUnmountPassiveRefCleanupOrderGate,
    privateUnmountPassiveRefCleanupOrderAvailable:
      record.privateUnmountPassiveRefCleanupOrderAvailable,
    privateUnmountNativeBridgeAdmissionGate:
      record.privateUnmountNativeBridgeAdmissionGate,
    privateUnmountNativeBridgeAdmissionAvailable:
      record.privateUnmountNativeBridgeAdmissionAvailable,
    rustRootExecutionBoundary: 'fast-react-test-renderer.TestRendererRoot',
    rustRootExecutionBridgeStatus:
      'admitted-private-test-renderer-native-root-execution-bridge',
    rustRootExecutionBoundaryCallable: true,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    publicRouteAvailable: false,
    publicCreateUpdateUnmountBehaviorAvailable: false,
    compatibilityClaimed: false
  });
}

function executeRootRequestWithBridge(record, executor) {
  const handoff = createRootExecutionHandoff(record);
  const execute = resolveRootExecutionExecutor(executor);
  const result = execute(handoff);

  return consumeRootExecutionResult(record, result, handoff);
}

function resolveRootExecutionExecutor(executor) {
  if (typeof executor === 'function') {
    return executor;
  }

  if (
    executor !== null &&
    typeof executor === 'object' &&
    typeof executor.executeTestRendererRootRequest === 'function'
  ) {
    return (handoff) => executor.executeTestRendererRootRequest(handoff);
  }

  throwInvalidRootRequest(
    'Expected a private native/Rust test-renderer root execution function.'
  );
}

function consumeRootExecutionResult(record, result, handoff) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }
  if (result === null || typeof result !== 'object') {
    throwInvalidRootRequest(
      'Expected a private Rust test-renderer root execution result object.'
    );
  }

  const rustLifecycleDiagnostic =
    readDiagnosticField(result, [
      'rustLifecycleDiagnostic',
      'lifecycleDiagnostic',
      'diagnostic'
    ]) ?? result;
  const consumedLifecycleDiagnostic =
    consumeAcceptedRustLifecycleDiagnosticForRequest(
      record,
      rustLifecycleDiagnostic
    );
  const privateUpdateNativeBridgeAdmission =
    record.operation === 'update' && result.hostOutputProduced === true
      ? consumePrivateUpdateNativeBridgeAdmissionForRequest(
          record,
          result,
          consumedLifecycleDiagnostic
        )
      : null;
  const privateErrorBoundaryCommitRecoveryMetadata =
    record.operation === 'update' && privateUpdateNativeBridgeAdmission !== null
      ? consumePrivateErrorBoundaryCommitRecoveryMetadataForRequest(
          record,
          result,
          privateUpdateNativeBridgeAdmission
        )
      : null;
  const privateUnmountNativeBridgeAdmission =
    record.operation === 'unmount'
      ? consumePrivateUnmountNativeBridgeAdmissionForRequest(
          record,
          result,
          consumedLifecycleDiagnostic
        )
      : null;
  const createHostOutputHandoffEvidence =
    record.operation === 'create'
      ? readDiagnosticField(result, [
          'privateCreateNativeBridgeHostOutputHandoff',
          'createNativeBridgeHostOutputHandoff',
          'createHostOutputHandoff',
          'hostOutputHandoff'
        ])
      : undefined;
  const privateCreateNativeBridgeHostOutputHandoff =
    createHostOutputHandoffEvidence === undefined
      ? null
      : consumePrivateCreateNativeBridgeHostOutputHandoffForRequest(
          record,
          createHostOutputHandoffEvidence
        );
  const executionHandoff =
    handoff === undefined ? createRootExecutionHandoff(record) : handoff;

  return freezeRecord({
    kind: 'FastReactTestRendererPrivateRootExecutionResult',
    status: 'accepted-private-test-renderer-root-execution-result',
    executionStatus: rootRequestExecutionStatus,
    compatibilityStatus: rootRequestCompatibilityStatus,
    entrypoint,
    compatibilityTarget,
    request: record,
    handoff: executionHandoff,
    operation: record.operation,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    updateKind: record.updateKind,
    rustOutcome: record.rustOutcome,
    scheduled: record.scheduled,
    rustLifecycleDiagnostic: consumedLifecycleDiagnostic,
    privateUnmountDeletionCommitHandoff:
      record.privateUnmountDeletionCommitHandoff,
    privateUnmountDeletionCommitHandoffAvailable:
      record.privateUnmountDeletionCommitHandoffAvailable,
    privateUpdateNativeBridgeAdmission,
    privateUpdateNativeBridgeAdmissionAvailable:
      record.privateUpdateNativeBridgeAdmissionAvailable,
    privateErrorBoundaryCommitRecoveryMetadata,
    privateErrorBoundaryCommitRecoveryMetadataAvailable:
      record.operation === 'update',
    privateUnmountNativeBridgeCleanupHandoff:
      privateUnmountNativeBridgeAdmission === null
        ? null
        : privateUnmountNativeBridgeAdmission.cleanupHandoff,
    privateUnmountNativeBridgeCleanupHandoffAvailable:
      record.privateUnmountNativeBridgeCleanupHandoffAvailable,
    privateUnmountPassiveRefCleanupOrder:
      privateUnmountNativeBridgeAdmission === null
        ? null
        : privateUnmountNativeBridgeAdmission.passiveRefCleanupOrder,
    privateUnmountPassiveRefCleanupOrderAvailable:
      record.privateUnmountPassiveRefCleanupOrderAvailable,
    privateUnmountNativeBridgeAdmission,
    privateUnmountNativeBridgeAdmissionAvailable:
      record.privateUnmountNativeBridgeAdmissionAvailable,
    privateCreateNativeBridgeHostOutputHandoff,
    privateCreateNativeBridgeHostOutputHandoffAvailable:
      record.privateCreateNativeBridgeHostOutputHandoffAvailable,
    privateExecutorInvoked: handoff !== undefined,
    privateRootRequestExecution: true,
    rustRootExecutionBoundary: 'fast-react-test-renderer.TestRendererRoot',
    rustRootExecutionBridgeStatus:
      'admitted-private-test-renderer-native-root-execution-bridge',
    rustRootExecutionBoundaryCalled: true,
    nativeAddonLoaded: result.nativeAddonLoaded === true,
    nativeBridgeAvailable: result.nativeBridgeAvailable === true,
    nativeExecution: result.nativeExecution === true,
    rustExecution: result.rustExecution === false ? false : true,
    reconcilerExecution: record.scheduled,
    hostOutputProduced:
      privateCreateNativeBridgeHostOutputHandoff !== null ||
      privateUpdateNativeBridgeAdmission !== null ||
      (privateUnmountNativeBridgeAdmission !== null &&
        privateUnmountNativeBridgeAdmission.hostOutputProduced === true),
    serializationAvailable: false,
    publicRouteAvailable: false,
    publicCreateUpdateUnmountBehaviorAvailable: false,
    compatibilityClaimed: false
  });
}

function readDiagnosticField(record, names) {
  if (record === undefined || record === null) {
    return undefined;
  }

  for (const name of names) {
    if (Object.hasOwn(record, name)) {
      return record[name];
    }
  }

  return undefined;
}

function normalizeRustLifecycleStatus(value) {
  const normalized = normalizeRustLifecycleStatusOrUndefined(value);
  if (normalized === undefined) {
    throwInvalidRootRequest(
      'Expected a TestRendererRootLifecycle diagnostic value.'
    );
  }
  return normalized;
}

function normalizeRustLifecycleStatusOrUndefined(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (
    value === 'Active' ||
    value === 'active' ||
    value === rootRequestLifecycleActive
  ) {
    return 'Active';
  }
  if (
    value === 'UnmountScheduled' ||
    value === 'unmount-scheduled' ||
    value === rootRequestLifecycleUnmountScheduled
  ) {
    return 'UnmountScheduled';
  }
  throwInvalidRootRequest(
    `Unsupported TestRendererRootLifecycle diagnostic value: ${String(value)}.`
  );
}

function toRustLifecycleStatus(value) {
  return normalizeRustLifecycleStatusOrUndefined(value);
}

function normalizeRustUpdateKind(value) {
  if (typeof value === 'string') {
    const normalized = value.replace(/^TestRendererRootUpdateKind::/u, '');
    if (
      normalized === 'Create' ||
      normalized === 'Update' ||
      normalized === 'Unmount'
    ) {
      return normalized;
    }
  }
  throwInvalidRootRequest(
    `Unsupported TestRendererRootUpdateKind diagnostic value: ${String(value)}.`
  );
}

function normalizeRustUpdateOutcome(value) {
  if (typeof value === 'string') {
    const normalized = value.replace(/^TestRendererRootUpdateOutcome::/u, '');
    if (
      normalized === 'Scheduled' ||
      normalized === 'IgnoredAfterUnmount' ||
      normalized === 'AlreadyUnmountScheduled'
    ) {
      return normalized;
    }
  }
  throwInvalidRootRequest(
    `Unsupported TestRendererRootUpdateOutcome diagnostic value: ${String(value)}.`
  );
}

function normalizeRustRootElementKind(element) {
  if (element === 'RootElementHandle::NONE') {
    return 'RootElementHandle::NONE';
  }
  if (element !== null && typeof element === 'object') {
    const kind = readDiagnosticField(element, ['kind', 'type']);
    if (kind === 'RootElementHandle::NONE') {
      return 'RootElementHandle::NONE';
    }
    if (kind === 'RootElementHandle') {
      return 'RootElementHandle';
    }
  }
  throwInvalidRootRequest(
    'Unsupported RootElementHandle diagnostic element kind.'
  );
}

function normalizeRustRootElementIsNone(element) {
  if (element === 'RootElementHandle::NONE') {
    return true;
  }
  if (element !== null && typeof element === 'object') {
    if (Object.hasOwn(element, 'isNone')) {
      return element.isNone === true;
    }
    if (Object.hasOwn(element, 'is_none')) {
      return element.is_none === true;
    }
  }
  return false;
}

function createRootElementHandle(handleState) {
  const raw = handleState.nextElementHandleRaw++;
  return freezeRecord({
    $$typeof: 'fast.react_test_renderer.root_element_handle',
    kind: 'RootElementHandle',
    raw,
    isNone: false
  });
}

function getRootRequestType(operation) {
  switch (operation) {
    case 'create':
      return 'TestRendererRoot.create';
    case 'update':
      return 'TestRendererRoot.update';
    case 'unmount':
      return 'TestRendererRoot.unmount';
    default:
      throwInvalidRootRequest(
        `Unsupported test-renderer root request operation: ${String(operation)}.`
      );
  }
}

function getRustUpdateKind(operation) {
  switch (operation) {
    case 'create':
      return 'Create';
    case 'update':
      return 'Update';
    case 'unmount':
      return 'Unmount';
    default:
      throwInvalidRootRequest(
        `Unsupported test-renderer root request operation: ${String(operation)}.`
      );
  }
}

function describeCreateOptions(rootOptions) {
  const isObject =
    rootOptions !== null &&
    (typeof rootOptions === 'object' || typeof rootOptions === 'function');
  const rootErrorOptions = describeRootErrorOptions(rootOptions);

  return freezeRecord({
    type: rootOptions === null ? 'null' : typeof rootOptions,
    strictMode: Boolean(isObject && rootOptions.unstable_strictMode),
    hasCreateNodeMock: Boolean(
      isObject && typeof rootOptions.createNodeMock === 'function'
    ),
    concurrentModeRequested: Boolean(
      isObject && rootOptions.unstable_isConcurrent
    ),
    hasRootErrorCallbacks: rootErrorOptions.hasConfiguredErrorCallback,
    rootErrorOptions
  });
}

function describeRootErrorOptions(rootOptions) {
  const options =
    rootOptions !== null &&
    (typeof rootOptions === 'object' || typeof rootOptions === 'function')
      ? rootOptions
      : null;
  const onUncaughtError = describeRootErrorCallbackOption(
    options,
    'onUncaughtError',
    'RootErrorCallbackHandle',
    1
  );
  const onCaughtError = describeRootErrorCallbackOption(
    options,
    'onCaughtError',
    'RootErrorCallbackHandle',
    2
  );
  const onRecoverableError = describeRootErrorCallbackOption(
    options,
    'onRecoverableError',
    'RootRecoverableErrorCallbackHandle',
    3
  );
  const hasConfiguredErrorCallback =
    onUncaughtError.configured ||
    onCaughtError.configured ||
    onRecoverableError.configured;

  return freezeRecord({
    kind: 'FastReactTestRendererPrivateRootErrorOptionMetadata',
    status: privateErrorBoundaryDiagnosticsStatus,
    rootOptionsType: 'RootOptions',
    testRendererOptionsType: 'TestRendererOptions',
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    onUncaughtErrorConfigured: onUncaughtError.configured,
    onCaughtErrorConfigured: onCaughtError.configured,
    onRecoverableErrorConfigured: onRecoverableError.configured,
    hasConfiguredErrorCallback,
    privateRootErrorOptionMetadataAvailable: true,
    callbacksStoredAsOpaqueHandles: true,
    storesCallbackValues: false,
    publicRootErrorCallbacksInvoked: false,
    publicErrorBoundaryBehaviorAvailable: false,
    compatibilityClaimed: false
  });
}

function describeRootErrorCallbackOption(options, key, handleType, rawHandle) {
  const value = options === null ? undefined : options[key];
  const configured = typeof value === 'function';

  return freezeRecord({
    key,
    configured,
    valueType: value === null ? 'null' : typeof value,
    handleType,
    handleKind: configured ? handleType : `${handleType}::NONE`,
    rawHandle: configured ? rawHandle : 0,
    callbackStored: false,
    callbackInvoked: false
  });
}

function describeRootRequestValue(value) {
  const valueType = value === null ? 'null' : typeof value;

  if (valueType === 'object' || valueType === 'function') {
    return freezeRecord({
      type: valueType,
      objectTag: Object.prototype.toString.call(value),
      keyCount: Object.keys(value).length
    });
  }

  return freezeRecord({
    type: valueType,
    value:
      valueType === 'string' ||
      valueType === 'number' ||
      valueType === 'boolean'
        ? value
        : null
  });
}

function assertRendererRootHandle(renderer) {
  const rootHandle = rendererRootHandles.get(renderer);
  if (rootHandle === undefined) {
    throwInvalidRootRequest(
      'Expected a react-test-renderer placeholder created by this root request bridge.'
    );
  }
  return rootHandle;
}

function assertPrivateRootHandle(rootHandle) {
  const handleState = rootHandleStates.get(rootHandle);
  if (handleState === undefined) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root handle.'
    );
  }
  return handleState;
}

function getRootRequestsForHandle(rootHandle) {
  const handleState = assertPrivateRootHandle(rootHandle);
  return freezeArray(handleState.requests.slice());
}

function isRootRequestRecord(record) {
  return (
    record !== null &&
    typeof record === 'object' &&
    record.$$typeof === privateRootRequestRecordType &&
    rootRequestPayloads.has(record)
  );
}

function getRootErrorOptionsSourceRequestForRootRequest(rootRequest) {
  if (rootRequest.optionsInfo !== null) {
    return rootRequest;
  }

  const handleState = rootHandleStates.get(rootRequest.rootHandle);
  if (handleState === undefined) {
    return null;
  }

  return (
    handleState.requests.find((request) => request.operation === 'create') ||
    null
  );
}

function getRootErrorOptionsForRootRequest(rootRequest) {
  const sourceRequest =
    getRootErrorOptionsSourceRequestForRootRequest(rootRequest);
  return sourceRequest?.optionsInfo?.rootErrorOptions ?? describeRootErrorOptions(null);
}

function getCurrentRustCanaryOperationMetadata(operation) {
  const metadata =
    currentRustTestRendererRootCanaryMetadata.operations[operation];
  if (metadata === undefined) {
    throwInvalidRootRequest(
      `Unsupported test-renderer root canary metadata operation: ${String(operation)}.`
    );
  }
  return metadata;
}

function getRustCanaryMetadataForRequestRecord(record) {
  if (record === undefined) {
    return currentRustTestRendererRootCanaryMetadata;
  }

  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }

  return record.rustCanaryMetadata;
}

function getRustCanaryOperationMetadataForRequestRecord(record) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }

  return record.rustCanaryOperationMetadata;
}

function getRootCreateRequestForRootRequest(record) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }

  if (record.operation === 'create') {
    return record;
  }

  const handleState = rootHandleStates.get(record.rootHandle);
  const createRequest =
    handleState === undefined
      ? null
      : handleState.requests.find((request) => request.operation === 'create');

  if (createRequest === undefined || createRequest === null) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer create request for root-create preflight.'
    );
  }

  return createRequest;
}

function getRootCreatePreflightForRootRequest(record) {
  const createRequest = getRootCreateRequestForRootRequest(record);
  let preflight = rootRequestCreatePreflights.get(createRequest);
  if (preflight === undefined) {
    preflight = createPrivateRootCreatePreflightRecord(createRequest);
    rootRequestCreatePreflights.set(createRequest, preflight);
  }
  return preflight;
}

function createPrivateRootCreatePreflightRecord(rootRequest) {
  if (!isRootRequestRecord(rootRequest) || rootRequest.operation !== 'create') {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer create request record.'
    );
  }

  const inputShape = describeRootCreatePreflightInputShape(rootRequest);
  const rootOptionsMetadata = rootRequest.optionsInfo;
  const canaryApiIdentity =
    createRootCreatePreflightCanaryApiIdentity(rootRequest);
  const hasRequiredRootOptions =
    rootOptionsMetadata !== null &&
    rootOptionsMetadata.type !== 'undefined' &&
    rootOptionsMetadata.type !== 'null';
  const ready =
    inputShape.supportedChildren === true &&
    hasRequiredRootOptions === true &&
    isCurrentRootCreatePreflightCanaryApiIdentity(canaryApiIdentity);
  const failureReason =
    inputShape.supportedChildren !== true
      ? 'unsupported-children'
      : hasRequiredRootOptions !== true
        ? 'missing-root-options'
        : ready
          ? null
          : 'stale-canary-metadata';
  const workLoopFinishedWorkPreflight =
    createRootCreateWorkLoopFinishedWorkPreflightRow({
      canaryApiIdentity,
      failureReason,
      inputShape,
      ready,
      rootOptionsMetadataAvailable: hasRequiredRootOptions,
      rootRequest
    });

  return freezeRecord({
    kind: 'FastReactTestRendererPrivateRootCreatePreflight',
    diagnosticName: privateRootCreatePreflightDiagnosticName,
    status: ready
      ? privateRootCreatePreflightStatus
      : `blocked-private-root-create-preflight-${failureReason}`,
    ready,
    failureReason,
    entrypoint,
    compatibilityTarget,
    gate: privateRootCreatePreflightGate,
    rootRequest,
    rootHandle: rootRequest.rootHandle,
    rootId: rootRequest.rootId,
    rootSequence: rootRequest.rootSequence,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    operation: 'create',
    publicSurface: 'create()',
    createInputShape: inputShape,
    rootOptionsMetadata,
    rootOptionsRequired: true,
    rootOptionsMetadataAvailable: hasRequiredRootOptions,
    canaryApiIdentity,
    workLoopFinishedWorkPreflight,
    rustCanaryMetadata: rootRequest.rustCanaryMetadata,
    rustCanaryOperationMetadata: rootRequest.rustCanaryOperationMetadata,
    privateRustRootCreated: ready,
    privateRootCanaryBoundaryValidated: ready,
    consumesAcceptedRustRootCreatePreflightDiagnostics: ready,
    consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata:
      ready && workLoopFinishedWorkPreflight.ready,
    blockedPublicRoot: freezeRecord({
      status: rootRequestCompatibilityStatus,
      publicRendererRootCreated: false,
      publicRootAvailable: false,
      publicCreateBehaviorAvailable: false,
      compatibilityClaimed: false
    }),
    publicRendererRootCreated: false,
    publicRootAvailable: false,
    publicCreateBehaviorAvailable: false,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    reconcilerExecutionFromJs: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  });
}

function createRootCreateWorkLoopFinishedWorkPreflightRow(options) {
  const metadata =
    options.rootRequest.rustCanaryMetadata.rootWorkLoopFinishedWorkPreflight;
  const metadataCurrent =
    metadata !== undefined &&
    metadata.metadataId === privateRootWorkLoopFinishedWorkPreflightMetadataId &&
    metadata.metadataStatus ===
      privateRootWorkLoopFinishedWorkPreflightMetadataStatus &&
    metadata.renderPhaseApi ===
      'TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff' &&
    metadata.finishedWorkRecord === 'HostRootRenderPhaseRecord::finished_work' &&
    metadata.acceptedInputShape === 'HostComponentWithTextChild';
  const ready = options.ready === true && metadataCurrent === true;
  const failureReason =
    options.failureReason !== null
      ? options.failureReason
      : metadata === undefined
        ? 'missing-work-loop-finished-work-preflight-metadata'
        : metadataCurrent
          ? null
          : 'stale-work-loop-finished-work-preflight-metadata';

  return freezeRecord({
    id: privateRootCreateWorkLoopFinishedWorkPreflightRowId,
    rowKind: 'private-diagnostic',
    area: 'root-create work loop',
    diagnosticName: privateRootCreatePreflightDiagnosticName,
    status: ready
      ? privateRootCreateWorkLoopFinishedWorkPreflightStatus
      : `blocked-private-root-create-work-loop-finished-work-preflight-${failureReason}`,
    ready,
    failureReason,
    entrypoint,
    compatibilityTarget,
    publicSurface: 'create()',
    rootRequest: options.rootRequest,
    rootRequestId: options.rootRequest.requestId,
    operation: 'create',
    createInputShape: options.inputShape,
    acceptedInputShape: 'HostComponentWithTextChild',
    supportedChildren: options.inputShape.supportedChildren,
    rootOptionsMetadataAvailable: options.rootOptionsMetadataAvailable,
    canaryApiIdentity: options.canaryApiIdentity,
    workLoopFinishedWorkMetadata: metadata ?? null,
    acceptedRustCrate: 'fast-react-test-renderer',
    acceptedRustWorker: 'worker-534-root-work-loop-finished-work-commit-handoff',
    acceptedJsBridgeWorker:
      'worker-573-test-renderer-private-root-work-loop-preflight',
    acceptedRustApis: privateRootCreatePreflightGate.acceptedRustApis,
    acceptedRustTests: privateRootCreatePreflightGate.acceptedRustTests,
    acceptedRustFinishedWorkRecords:
      privateRootCreatePreflightGate.acceptedRustFinishedWorkRecords,
    bridgeMetadataSource:
      'FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.rootWorkLoopFinishedWorkPreflight',
    recordsAcceptedFinishedWorkMetadata: ready,
    consumesAcceptedRustWorkLoopFinishedWorkPreflightMetadata: ready,
    missingRustPreflightMetadataRejection: true,
    staleRustPreflightMetadataRejection: true,
    unsupportedChildrenRejection: true,
    publicRendererRootCreated: false,
    publicRootAvailable: false,
    publicCreateBehaviorAvailable: false,
    publicToJSONAvailable: false,
    publicToTreeAvailable: false,
    publicActAvailable: false,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    reconcilerExecutionFromJs: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  });
}

function describeRootCreatePreflightInputShape(rootRequest) {
  const payload = rootRequestPayloads.get(rootRequest);
  const element = payload === undefined ? undefined : payload.element;
  const elementType = describeRootCreateElementType(element);
  const children = describeRootCreateChildren(element);
  const acceptedShape =
    elementType.kind === 'HostComponent' && children.kind === 'Text'
      ? 'HostComponentWithTextChild'
      : 'Unsupported';

  return freezeRecord({
    kind: 'FastReactTestRendererRootCreateInputShape',
    elementInfo: rootRequest.elementInfo,
    rootElementHandle: rootRequest.rootElementHandle,
    acceptedShape,
    rootNodeKind: elementType.kind,
    elementType: elementType.value,
    elementTypeValueType: elementType.valueType,
    childShape: children.kind,
    childValueType: children.valueType,
    childCount: children.count,
    supportedChildren: acceptedShape === 'HostComponentWithTextChild',
    failClosedForUnsupportedChildren: true,
    publicRootAvailable: false,
    compatibilityClaimed: false
  });
}

function describeRootCreateElementType(element) {
  if (element === null) {
    return freezeRecord({
      kind: 'NullRoot',
      value: null,
      valueType: 'null'
    });
  }
  if (
    element !== undefined &&
    element !== null &&
    typeof element === 'object' &&
    typeof element.type === 'string'
  ) {
    return freezeRecord({
      kind: 'HostComponent',
      value: element.type,
      valueType: 'string'
    });
  }

  return freezeRecord({
    kind: 'Unsupported',
    value: null,
    valueType: element === null ? 'null' : typeof element
  });
}

function describeRootCreateChildren(element) {
  const children =
    element !== null &&
    typeof element === 'object' &&
    element.props !== null &&
    typeof element.props === 'object'
      ? element.props.children
      : undefined;
  const valueType = children === null ? 'null' : typeof children;

  if (typeof children === 'string' || typeof children === 'number') {
    return freezeRecord({
      kind: 'Text',
      valueType,
      count: 1
    });
  }
  if (children === undefined || children === null) {
    return freezeRecord({
      kind: 'Empty',
      valueType,
      count: 0
    });
  }
  if (Array.isArray(children)) {
    return freezeRecord({
      kind: 'Array',
      valueType: 'object',
      count: children.length
    });
  }

  return freezeRecord({
    kind: 'Unsupported',
    valueType,
    count: 1
  });
}

function createRootCreatePreflightCanaryApiIdentity(rootRequest) {
  const operationMetadata = rootRequest.rustCanaryOperationMetadata;
  const rootMetadata = rootRequest.rustCanaryMetadata.root;

  return freezeRecord({
    metadataId: rootRequest.rustCanaryMetadata.id,
    metadataStatus: rootRequest.rustCanaryMetadata.status,
    operation: 'create',
    rootApi: operationMetadata.rootApi,
    preflightApi:
      operationMetadata.rootCreatePreflightApi ??
      'TestRendererRoot::describe_private_root_create_preflight_for_canary',
    rootOptionsType: rootMetadata.rootOptionsType,
    testRendererOptionsType: rootMetadata.optionsType,
    updateKind: operationMetadata.updateKind,
    rustUpdateKind: operationMetadata.rustUpdateKind,
    containerUpdateApi: operationMetadata.containerUpdateApi,
    schedulerApi: operationMetadata.schedulerApi,
    acceptedRustCrate: rootRequest.rustCanaryMetadata.acceptedRustCrate
  });
}

function isCurrentRootCreatePreflightCanaryApiIdentity(apiIdentity) {
  return (
    apiIdentity.metadataId === currentRustTestRendererRootCanaryMetadata.id &&
    apiIdentity.metadataStatus ===
      currentRustTestRendererRootCanaryMetadata.status &&
    apiIdentity.operation === 'create' &&
    apiIdentity.rootApi === 'TestRendererRoot::create' &&
    apiIdentity.preflightApi ===
      'TestRendererRoot::describe_private_root_create_preflight_for_canary' &&
    apiIdentity.rootOptionsType === 'RootOptions' &&
    apiIdentity.testRendererOptionsType === 'TestRendererOptions' &&
    apiIdentity.containerUpdateApi === 'update_container' &&
    apiIdentity.schedulerApi === 'ensure_root_is_scheduled'
  );
}

function consumeAcceptedRustRootCreatePreflightForRequest(
  record,
  diagnostic
) {
  const createRequest = getRootCreateRequestForRootRequest(record);
  const preflight = getRootCreatePreflightForRootRequest(createRequest);
  if (preflight.ready !== true) {
    throwInvalidRootRequest(
      `Private root-create preflight is closed: ${preflight.failureReason}.`
    );
  }

  const normalized =
    normalizeAcceptedRustRootCreatePreflightDiagnostic(diagnostic);
  assertAcceptedRustRootCreatePreflightMatchesRequest(
    preflight,
    normalized
  );

  return freezeRecord({
    kind: 'FastReactTestRendererPrivateRootCreatePreflightConsumption',
    diagnosticName: privateRootCreatePreflightDiagnosticName,
    status: privateRootCreatePreflightStatus,
    entrypoint,
    compatibilityTarget,
    rootRequest: createRequest,
    preflight,
    sourceDiagnostic: normalized,
    consumesAcceptedRustRootCreatePreflightDiagnostics: true,
    consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata: true,
    privateRootCanaryBoundaryValidated: true,
    publicRendererRootCreated: false,
    publicRootAvailable: false,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    compatibilityClaimed: false
  });
}

function normalizeAcceptedRustRootCreatePreflightDiagnostic(diagnostic) {
  if (diagnostic === null || typeof diagnostic !== 'object') {
    throwInvalidRootRequest(
      'Expected a Rust test-renderer root-create preflight diagnostic object.'
    );
  }

  const apiIdentity = readDiagnosticField(diagnostic, [
    'canaryApiIdentity',
    'rustCanaryApiIdentity',
    'apiIdentity'
  ]);
  const workLoopFinishedWorkPreflight = readDiagnosticField(diagnostic, [
    'workLoopFinishedWorkPreflight',
    'rootWorkLoopFinishedWorkPreflight',
    'finishedWorkPreflight'
  ]);

  return freezeRecord({
    diagnosticName: readDiagnosticField(diagnostic, [
      'diagnosticName',
      'diagnostic_name'
    ]),
    status: readDiagnosticField(diagnostic, ['status']),
    operation: readDiagnosticField(diagnostic, ['operation']),
    createInputShape: readDiagnosticField(diagnostic, [
      'createInputShape',
      'inputShape',
      'input_shape'
    ]),
    rootOptionsMetadata: readDiagnosticField(diagnostic, [
      'rootOptionsMetadata',
      'rootOptions',
      'root_options'
    ]),
    canaryApiIdentity:
      normalizeRootCreatePreflightCanaryApiIdentity(apiIdentity),
    workLoopFinishedWorkPreflight:
      normalizeRootCreateWorkLoopFinishedWorkPreflight(
        workLoopFinishedWorkPreflight
      )
  });
}

function normalizeRootCreateWorkLoopFinishedWorkPreflight(row) {
  if (row === null || typeof row !== 'object') {
    throwInvalidRootRequest(
      'Expected Rust root-create preflight work-loop finished-work metadata.'
    );
  }
  const metadata = readDiagnosticField(row, [
    'workLoopFinishedWorkMetadata',
    'workLoopFinishedWorkPreflightMetadata',
    'metadata'
  ]);
  if (metadata === null || typeof metadata !== 'object') {
    throwInvalidRootRequest(
      'Expected Rust root-create work-loop finished-work preflight metadata object.'
    );
  }

  return freezeRecord({
    id: readDiagnosticField(row, ['id', 'rowId', 'row_id']),
    status: readDiagnosticField(row, ['status']),
    ready: readDiagnosticField(row, ['ready']),
    acceptedInputShape: readDiagnosticField(row, [
      'acceptedInputShape',
      'accepted_input_shape'
    ]),
    supportedChildren: readDiagnosticField(row, [
      'supportedChildren',
      'supported_children'
    ]),
    rootOptionsMetadataAvailable: readDiagnosticField(row, [
      'rootOptionsMetadataAvailable',
      'root_options_metadata_available'
    ]),
    previousCurrent: normalizeCreateRouteFiberHandle(
      readDiagnosticField(row, ['previousCurrent', 'previous_current']),
      'previousCurrent'
    ),
    finishedWork: normalizeCreateRouteFiberHandle(
      readDiagnosticField(row, ['finishedWork', 'finished_work']),
      'finishedWork'
    ),
    renderLanesEmpty: readDiagnosticField(row, [
      'renderLanesEmpty',
      'render_lanes_empty'
    ]),
    remainingLanesEmpty: readDiagnosticField(row, [
      'remainingLanesEmpty',
      'remaining_lanes_empty'
    ]),
    finishedWorkMatchesRenderPhase: readDiagnosticField(row, [
      'finishedWorkMatchesRenderPhase',
      'finished_work_matches_render_phase'
    ]),
    recordsAcceptedFinishedWorkMetadata: readDiagnosticField(row, [
      'recordsAcceptedFinishedWorkMetadata',
      'records_accepted_finished_work_metadata'
    ]),
    consumesAcceptedRustWorkLoopFinishedWorkPreflightMetadata:
      readDiagnosticField(row, [
        'consumesAcceptedRustWorkLoopFinishedWorkPreflightMetadata',
        'consumes_accepted_rust_work_loop_finished_work_preflight_metadata'
      ]),
    workLoopFinishedWorkMetadata: freezeRecord({
      metadataId: readDiagnosticField(metadata, [
        'metadataId',
        'metadata_id'
      ]),
      metadataStatus: readDiagnosticField(metadata, [
        'metadataStatus',
        'metadata_status'
      ]),
      acceptedWorker: readDiagnosticField(metadata, [
        'acceptedWorker',
        'accepted_worker'
      ]),
      acceptedRustModule: readDiagnosticField(metadata, [
        'acceptedRustModule',
        'accepted_rust_module'
      ]),
      renderPhaseApi: readDiagnosticField(metadata, [
        'renderPhaseApi',
        'render_phase_api'
      ]),
      renderPhaseRecord: readDiagnosticField(metadata, [
        'renderPhaseRecord',
        'render_phase_record'
      ]),
      finishedWorkRecord: readDiagnosticField(metadata, [
        'finishedWorkRecord',
        'finished_work_record'
      ]),
      pendingFinishedWorkRecord: readDiagnosticField(metadata, [
        'pendingFinishedWorkRecord',
        'pending_finished_work_record'
      ]),
      commitHandoffRecord: readDiagnosticField(metadata, [
        'commitHandoffRecord',
        'commit_handoff_record'
      ]),
      acceptedInputShape: readDiagnosticField(metadata, [
        'acceptedInputShape',
        'accepted_input_shape'
      ])
    })
  });
}

function normalizeCreateRouteFiberHandle(handle, fieldName) {
  if (handle === null || typeof handle !== 'object') {
    throwInvalidRootRequest(
      `Expected private create-route fiber handle diagnostics: ${fieldName}.`
    );
  }

  const arenaId = readDiagnosticField(handle, ['arenaId', 'arena_id']);
  const slot = readDiagnosticField(handle, ['slot']);
  const generation = readDiagnosticField(handle, [
    'generation',
    'generation_id'
  ]);
  if (
    !isNonNegativeInteger(arenaId) ||
    !isNonNegativeInteger(slot) ||
    !isNonNegativeInteger(generation)
  ) {
    throwInvalidRootRequest(
      `Expected numeric private create-route fiber handle diagnostics: ${fieldName}.`
    );
  }

  return freezeRecord({ arenaId, slot, generation });
}

function createRouteFiberHandlesEqual(left, right) {
  return (
    left !== null &&
    right !== null &&
    typeof left === 'object' &&
    typeof right === 'object' &&
    left.arenaId === right.arenaId &&
    left.slot === right.slot &&
    left.generation === right.generation
  );
}

function normalizeRootCreatePreflightCanaryApiIdentity(apiIdentity) {
  if (apiIdentity === null || typeof apiIdentity !== 'object') {
    throwInvalidRootRequest(
      'Expected a root-create preflight canary API identity object.'
    );
  }

  return freezeRecord({
    metadataId: readDiagnosticField(apiIdentity, [
      'metadataId',
      'metadata_id'
    ]),
    metadataStatus: readDiagnosticField(apiIdentity, [
      'metadataStatus',
      'metadata_status'
    ]),
    operation: readDiagnosticField(apiIdentity, ['operation']),
    rootApi: readDiagnosticField(apiIdentity, ['rootApi', 'root_api']),
    preflightApi: readDiagnosticField(apiIdentity, [
      'preflightApi',
      'preflight_api'
    ]),
    rootOptionsType: readDiagnosticField(apiIdentity, [
      'rootOptionsType',
      'root_options_type'
    ]),
    testRendererOptionsType: readDiagnosticField(apiIdentity, [
      'testRendererOptionsType',
      'test_renderer_options_type'
    ]),
    containerUpdateApi: readDiagnosticField(apiIdentity, [
      'containerUpdateApi',
      'container_update_api'
    ]),
    schedulerApi: readDiagnosticField(apiIdentity, [
      'schedulerApi',
      'scheduler_api'
    ])
  });
}

function assertAcceptedRustRootCreatePreflightMatchesRequest(
  preflight,
  diagnostic
) {
  if (diagnostic.diagnosticName !== privateRootCreatePreflightDiagnosticName) {
    throwInvalidRootRequest(
      'Rust root-create preflight diagnostic name is not accepted.'
    );
  }
  if (diagnostic.status !== privateRootCreatePreflightStatus) {
    throwInvalidRootRequest(
      'Rust root-create preflight diagnostic status is not accepted.'
    );
  }
  if (diagnostic.operation !== 'create') {
    throwInvalidRootRequest(
      'Rust root-create preflight diagnostic operation does not match the private request.'
    );
  }

  const apiIdentity = diagnostic.canaryApiIdentity;
  if (
    apiIdentity.metadataId !== preflight.canaryApiIdentity.metadataId ||
    apiIdentity.metadataStatus !==
      preflight.canaryApiIdentity.metadataStatus ||
    apiIdentity.rootApi !== preflight.canaryApiIdentity.rootApi ||
    apiIdentity.preflightApi !== preflight.canaryApiIdentity.preflightApi ||
    apiIdentity.rootOptionsType !==
      preflight.canaryApiIdentity.rootOptionsType ||
    apiIdentity.testRendererOptionsType !==
      preflight.canaryApiIdentity.testRendererOptionsType ||
    apiIdentity.containerUpdateApi !==
      preflight.canaryApiIdentity.containerUpdateApi ||
    apiIdentity.schedulerApi !== preflight.canaryApiIdentity.schedulerApi
  ) {
    throwInvalidRootRequest(
      'Rust root-create preflight canary API identity is stale.'
    );
  }

  if (
    diagnostic.createInputShape !== undefined &&
    diagnostic.createInputShape.acceptedShape !==
      preflight.createInputShape.acceptedShape
  ) {
    throwInvalidRootRequest(
      'Rust root-create preflight input shape does not match the private request.'
    );
  }
  if (
    diagnostic.rootOptionsMetadata !== undefined &&
    diagnostic.rootOptionsMetadata.type !== preflight.rootOptionsMetadata.type
  ) {
    throwInvalidRootRequest(
      'Rust root-create preflight root options metadata does not match the private request.'
    );
  }

  const workLoopPreflight = diagnostic.workLoopFinishedWorkPreflight;
  const expectedWorkLoopPreflight = preflight.workLoopFinishedWorkPreflight;
  if (workLoopPreflight.id !== expectedWorkLoopPreflight.id) {
    throwInvalidRootRequest(
      'Rust root-create work-loop finished-work preflight row is not accepted.'
    );
  }
  if (workLoopPreflight.status !== expectedWorkLoopPreflight.status) {
    throwInvalidRootRequest(
      'Rust root-create work-loop finished-work preflight status is not accepted.'
    );
  }
  if (
    workLoopPreflight.ready !== true ||
    workLoopPreflight.recordsAcceptedFinishedWorkMetadata !== true ||
    workLoopPreflight
      .consumesAcceptedRustWorkLoopFinishedWorkPreflightMetadata !== true
  ) {
    throwInvalidRootRequest(
      'Rust root-create work-loop finished-work preflight metadata is not ready.'
    );
  }
  if (
    workLoopPreflight.supportedChildren !== true ||
    workLoopPreflight.acceptedInputShape !== 'HostComponentWithTextChild' ||
    workLoopPreflight.rootOptionsMetadataAvailable !== true
  ) {
    throwInvalidRootRequest(
      'Rust root-create work-loop finished-work preflight shape is unsupported.'
    );
  }
  if (
    createRouteFiberHandlesEqual(
      workLoopPreflight.previousCurrent,
      workLoopPreflight.finishedWork
    ) ||
    workLoopPreflight.renderLanesEmpty !== false ||
    workLoopPreflight.remainingLanesEmpty !== true ||
    workLoopPreflight.finishedWorkMatchesRenderPhase !== true
  ) {
    throwInvalidRootRequest(
      'Rust root-create work-loop finished-work identity is not accepted.'
    );
  }

  const metadata = workLoopPreflight.workLoopFinishedWorkMetadata;
  const expectedMetadata =
    expectedWorkLoopPreflight.workLoopFinishedWorkMetadata;
  if (
    expectedMetadata === null ||
    metadata.metadataId !== expectedMetadata.metadataId ||
    metadata.metadataStatus !== expectedMetadata.metadataStatus ||
    metadata.acceptedWorker !== expectedMetadata.acceptedWorker ||
    metadata.acceptedRustModule !== expectedMetadata.acceptedRustModule ||
    metadata.renderPhaseApi !== expectedMetadata.renderPhaseApi ||
    metadata.renderPhaseRecord !== expectedMetadata.renderPhaseRecord ||
    metadata.finishedWorkRecord !== expectedMetadata.finishedWorkRecord ||
    metadata.pendingFinishedWorkRecord !==
      expectedMetadata.pendingFinishedWorkRecord ||
    metadata.commitHandoffRecord !== expectedMetadata.commitHandoffRecord ||
    metadata.acceptedInputShape !== expectedMetadata.acceptedInputShape
  ) {
    throwInvalidRootRequest(
      'Rust root-create work-loop finished-work preflight metadata is stale.'
    );
  }
}

function getRootCreateRouteAdmissionForRootRequest(record) {
  const createRequest = getRootCreateRequestForRootRequest(record);
  let admission = rootRequestCreateRouteAdmissions.get(createRequest);
  if (admission === undefined) {
    admission = createPrivateCreateRouteAdmissionRecord(createRequest);
    rootRequestCreateRouteAdmissions.set(createRequest, admission);
  }
  return admission;
}

function createPrivateCreateRouteAdmissionRecord(createRequest) {
  const preflight = getRootCreatePreflightForRootRequest(createRequest);
  const metadata = createRequest.rustCanaryMetadata.rootCreateRouteAdmission;
  const metadataCurrent = isCurrentCreateRouteAdmissionMetadata(metadata);
  const ready = preflight.ready === true && metadataCurrent === true;
  const failureReason =
    preflight.ready !== true
      ? preflight.failureReason
      : metadata === undefined
        ? 'missing-rust-create-route-admission-record'
        : metadataCurrent
          ? null
          : 'stale-rust-create-route-admission-record';

  return freezeRecord({
    kind: 'FastReactTestRendererPrivateCreateRouteAdmission',
    id: privateCreateRouteAdmissionRecordId,
    diagnosticName: privateCreateRouteAdmissionDiagnosticName,
    status: ready
      ? privateCreateRouteAdmissionStatus
      : `blocked-private-create-route-admission-${failureReason}`,
    ready,
    failureReason,
    entrypoint,
    compatibilityTarget,
    gate: privateCreateRouteAdmissionGate,
    rootRequest: createRequest,
    rootHandle: createRequest.rootHandle,
    rootId: createRequest.rootId,
    rootSequence: createRequest.rootSequence,
    rootRequestId: createRequest.requestId,
    rootRequestSequence: createRequest.requestSequence,
    operation: 'create',
    publicSurface: 'create()',
    jsFacadeMetadataSource: 'FastReactTestRendererPrivateRootRequestRecord',
    bridgeMetadataSource:
      'FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.rootCreateRouteAdmission',
    rustAdmissionMetadata: metadata ?? null,
    rootCreatePreflight: preflight,
    workLoopFinishedWorkPreflight:
      preflight.workLoopFinishedWorkPreflight,
    rootCreateExecutionEvidence: createRootCreateExecutionEvidence(
      createRequest,
      preflight
    ),
    rustCanaryMetadata: createRequest.rustCanaryMetadata,
    rustCanaryOperationMetadata: createRequest.rustCanaryOperationMetadata,
    consumesJsFacadeCreateMetadata: ready,
    consumesAcceptedRustRootCreateExecutionEvidence: ready,
    consumesAcceptedRustRootCreatePreflightDiagnostics: ready,
    consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata:
      ready && preflight.workLoopFinishedWorkPreflight.ready === true,
    missingRustAdmissionRecordRejection: true,
    staleRustAdmissionRecordRejection: true,
    publicRendererRootCreated: false,
    publicRootAvailable: false,
    publicCreateBehaviorAvailable: false,
    publicSerializationAvailable: false,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    reconcilerExecutionFromJs: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  });
}

function createRootCreateExecutionEvidence(createRequest, preflight) {
  return freezeRecord({
    kind: 'FastReactTestRendererPrivateCreateRouteExecutionEvidence',
    operation: 'create',
    requestId: createRequest.requestId,
    requestSequence: createRequest.requestSequence,
    rootApi: createRequest.rootApi,
    updateKind: createRequest.updateKind,
    rustUpdateKind: createRequest.rustUpdateKind,
    rustOutcome: createRequest.rustOutcome,
    scheduled: createRequest.scheduled,
    rootElementHandle: createRequest.rootElementHandle,
    containerUpdateApi: createRequest.containerUpdateApi,
    schedulerApi: createRequest.schedulerApi,
    lifecycleDiagnostic: createRequest.rustLifecycleDiagnostic,
    rootCreatePreflight: preflight,
    workLoopFinishedWorkPreflight:
      preflight.workLoopFinishedWorkPreflight,
    acceptedRustRecords: privateCreateRouteAdmissionGate.acceptedRustRecords,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function isCurrentCreateRouteAdmissionMetadata(metadata) {
  return (
    metadata !== undefined &&
    metadata.metadataId === privateCreateRouteAdmissionMetadataId &&
    metadata.metadataStatus === privateCreateRouteAdmissionMetadataStatus &&
    metadata.recordId === privateCreateRouteAdmissionRecordId &&
    metadata.diagnosticName === privateCreateRouteAdmissionDiagnosticName &&
    metadata.status === privateCreateRouteAdmissionStatus &&
    metadata.rootApi === 'TestRendererRoot::create' &&
    metadata.preflightApi ===
      'TestRendererRoot::describe_private_root_create_preflight_for_canary' &&
    metadata.workLoopRenderPhaseApi ===
      'TestRendererRoot::render_latest_scheduled_host_root_for_commit_handoff' &&
    metadata.lifecycleRecord === 'TestRendererRootScheduledUpdate' &&
    metadata.executionResultRecord ===
      'TestRendererPrivateCreateRouteAdmissionDiagnostics' &&
    metadata.acceptedInputShape === 'HostComponentWithTextChild'
  );
}

function consumeAcceptedRustRootCreateRouteAdmissionForRequest(
  record,
  diagnostic
) {
  const createRequest = getRootCreateRequestForRootRequest(record);
  const admission = getRootCreateRouteAdmissionForRootRequest(createRequest);
  if (admission.ready !== true) {
    throwInvalidRootRequest(
      `Private create-route admission is closed: ${admission.failureReason}.`
    );
  }

  const normalized =
    normalizeAcceptedRustRootCreateRouteAdmissionDiagnostic(diagnostic);
  assertAcceptedRustRootCreateRouteAdmissionMatchesRequest(
    admission,
    normalized
  );

  return freezeRecord({
    kind: 'FastReactTestRendererPrivateCreateRouteAdmissionConsumption',
    id: privateCreateRouteAdmissionRecordId,
    diagnosticName: privateCreateRouteAdmissionDiagnosticName,
    status: privateCreateRouteAdmissionStatus,
    entrypoint,
    compatibilityTarget,
    rootRequest: createRequest,
    admission,
    rootCreatePreflight: admission.rootCreatePreflight,
    sourceDiagnostic: normalized,
    consumesJsFacadeCreateMetadata: true,
    consumesAcceptedRustRootCreateExecutionEvidence: true,
    consumesAcceptedRustRootCreatePreflightDiagnostics: true,
    consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata: true,
    publicRendererRootCreated: false,
    publicRootAvailable: false,
    publicCreateBehaviorAvailable: false,
    publicSerializationAvailable: false,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    reconcilerExecutionFromJs: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  });
}

function normalizeAcceptedRustRootCreateRouteAdmissionDiagnostic(diagnostic) {
  if (diagnostic === null || typeof diagnostic !== 'object') {
    throwInvalidRootRequest(
      'Expected a Rust test-renderer create-route admission diagnostic object.'
    );
  }
  const metadata = readDiagnosticField(diagnostic, [
    'rustAdmissionMetadata',
    'admissionMetadata',
    'metadata'
  ]);
  if (metadata === null || typeof metadata !== 'object') {
    throwInvalidRootRequest(
      'Expected a Rust create-route admission metadata object.'
    );
  }

  return freezeRecord({
    id: readDiagnosticField(diagnostic, ['id', 'recordId', 'record_id']),
    diagnosticName: readDiagnosticField(diagnostic, [
      'diagnosticName',
      'diagnostic_name'
    ]),
    status: readDiagnosticField(diagnostic, ['status']),
    operation: readDiagnosticField(diagnostic, ['operation']),
    publicSurface: readDiagnosticField(diagnostic, [
      'publicSurface',
      'public_surface'
    ]),
    jsFacadeMetadataSource: readDiagnosticField(diagnostic, [
      'jsFacadeMetadataSource',
      'js_facade_metadata_source'
    ]),
    rustAdmissionMetadata: freezeRecord({
      metadataId: readDiagnosticField(metadata, [
        'metadataId',
        'metadata_id'
      ]),
      metadataStatus: readDiagnosticField(metadata, [
        'metadataStatus',
        'metadata_status'
      ]),
      recordId: readDiagnosticField(metadata, ['recordId', 'record_id']),
      diagnosticName: readDiagnosticField(metadata, [
        'diagnosticName',
        'diagnostic_name'
      ]),
      status: readDiagnosticField(metadata, ['status']),
      acceptedWorker: readDiagnosticField(metadata, [
        'acceptedWorker',
        'accepted_worker'
      ]),
      acceptedRustCrate: readDiagnosticField(metadata, [
        'acceptedRustCrate',
        'accepted_rust_crate'
      ]),
      rootApi: readDiagnosticField(metadata, ['rootApi', 'root_api']),
      preflightApi: readDiagnosticField(metadata, [
        'preflightApi',
        'preflight_api'
      ]),
      workLoopRenderPhaseApi: readDiagnosticField(metadata, [
        'workLoopRenderPhaseApi',
        'work_loop_render_phase_api'
      ]),
      lifecycleRecord: readDiagnosticField(metadata, [
        'lifecycleRecord',
        'lifecycle_record'
      ]),
      executionResultRecord: readDiagnosticField(metadata, [
        'executionResultRecord',
        'execution_result_record'
      ]),
      acceptedInputShape: readDiagnosticField(metadata, [
        'acceptedInputShape',
        'accepted_input_shape'
      ])
    }),
    rootCreatePreflight: readDiagnosticField(diagnostic, [
      'rootCreatePreflight',
      'root_create_preflight',
      'preflight'
    ]),
    workLoopFinishedWorkPreflight: normalizeRootCreateWorkLoopFinishedWorkPreflight(
      readDiagnosticField(diagnostic, [
        'workLoopFinishedWorkPreflight',
        'rootWorkLoopFinishedWorkPreflight',
        'finishedWorkPreflight'
      ])
    ),
    rootCreateExecutionEvidence: readDiagnosticField(diagnostic, [
      'rootCreateExecutionEvidence',
      'root_create_execution_evidence',
      'executionEvidence'
    ]),
    consumesJsFacadeCreateMetadata: readDiagnosticField(diagnostic, [
      'consumesJsFacadeCreateMetadata',
      'consumes_js_facade_create_metadata'
    ]),
    consumesAcceptedRustRootCreateExecutionEvidence: readDiagnosticField(
      diagnostic,
      [
        'consumesAcceptedRustRootCreateExecutionEvidence',
        'consumes_accepted_rust_root_create_execution_evidence'
      ]
    ),
    consumesAcceptedRustRootCreatePreflightDiagnostics: readDiagnosticField(
      diagnostic,
      [
        'consumesAcceptedRustRootCreatePreflightDiagnostics',
        'consumes_accepted_rust_root_create_preflight_diagnostics'
      ]
    ),
    consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata:
      readDiagnosticField(diagnostic, [
        'consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata',
        'consumes_accepted_rust_root_work_loop_finished_work_preflight_metadata'
      ])
  });
}

function assertAcceptedRustRootCreateRouteAdmissionMatchesRequest(
  admission,
  diagnostic
) {
  if (diagnostic.id !== privateCreateRouteAdmissionRecordId) {
    throwInvalidRootRequest(
      'Rust create-route admission record id is not accepted.'
    );
  }
  if (
    diagnostic.diagnosticName !== privateCreateRouteAdmissionDiagnosticName ||
    diagnostic.status !== privateCreateRouteAdmissionStatus ||
    diagnostic.operation !== 'create' ||
    diagnostic.publicSurface !== 'create()'
  ) {
    throwInvalidRootRequest(
      'Rust create-route admission diagnostic identity is not accepted.'
    );
  }
  if (
    diagnostic.jsFacadeMetadataSource !==
    'FastReactTestRendererPrivateRootRequestRecord'
  ) {
    throwInvalidRootRequest(
      'Rust create-route admission does not target the JS facade request metadata.'
    );
  }

  const metadata = diagnostic.rustAdmissionMetadata;
  const expectedMetadata = admission.rustAdmissionMetadata;
  if (
    expectedMetadata === null ||
    metadata.metadataId !== expectedMetadata.metadataId ||
    metadata.metadataStatus !== expectedMetadata.metadataStatus ||
    metadata.recordId !== expectedMetadata.recordId ||
    metadata.diagnosticName !== expectedMetadata.diagnosticName ||
    metadata.status !== expectedMetadata.status ||
    metadata.acceptedWorker !== expectedMetadata.acceptedWorker ||
    metadata.acceptedRustCrate !== expectedMetadata.acceptedRustCrate ||
    metadata.rootApi !== expectedMetadata.rootApi ||
    metadata.preflightApi !== expectedMetadata.preflightApi ||
    metadata.workLoopRenderPhaseApi !==
      expectedMetadata.workLoopRenderPhaseApi ||
    metadata.lifecycleRecord !== expectedMetadata.lifecycleRecord ||
    metadata.executionResultRecord !== expectedMetadata.executionResultRecord ||
    metadata.acceptedInputShape !== expectedMetadata.acceptedInputShape
  ) {
    throwInvalidRootRequest(
      'Rust create-route admission metadata is stale.'
    );
  }

  assertAcceptedRustRootCreatePreflightMatchesRequest(admission.rootCreatePreflight, {
    diagnosticName: privateRootCreatePreflightDiagnosticName,
    status: privateRootCreatePreflightStatus,
    operation: 'create',
    createInputShape: admission.rootCreatePreflight.createInputShape,
    rootOptionsMetadata: admission.rootCreatePreflight.rootOptionsMetadata,
    canaryApiIdentity: admission.rootCreatePreflight.canaryApiIdentity,
    workLoopFinishedWorkPreflight:
      diagnostic.workLoopFinishedWorkPreflight
  });

  const evidence = diagnostic.rootCreateExecutionEvidence;
  if (evidence === null || typeof evidence !== 'object') {
    throwInvalidRootRequest(
      'Rust create-route admission requires root-create execution evidence.'
    );
  }
  if (
    evidence.operation !== 'create' ||
    evidence.requestId !== admission.rootRequest.requestId ||
    evidence.rootApi !== 'TestRendererRoot::create' ||
    evidence.updateKind !== 'Create' ||
    evidence.rustOutcome !== 'Scheduled' ||
    evidence.scheduled !== true
  ) {
    throwInvalidRootRequest(
      'Rust create-route admission execution evidence does not match the create request.'
    );
  }
  if (
    diagnostic.consumesJsFacadeCreateMetadata !== true ||
    diagnostic.consumesAcceptedRustRootCreateExecutionEvidence !== true ||
    diagnostic.consumesAcceptedRustRootCreatePreflightDiagnostics !== true ||
    diagnostic
      .consumesAcceptedRustRootWorkLoopFinishedWorkPreflightMetadata !== true
  ) {
    throwInvalidRootRequest(
      'Rust create-route admission consumption flags are not accepted.'
    );
  }
}

function consumePrivateCreateNativeBridgeHostOutputHandoffForRequest(
  record,
  evidence,
  acceptedCreateRouteAdmission
) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }
  if (record.operation !== 'create') {
    throwInvalidRootRequest(
      'Private create native bridge host-output handoff only accepts create requests.'
    );
  }

  const handoff =
    readDiagnosticField(evidence, [
      'privateCreateNativeBridgeHostOutputHandoff',
      'createNativeBridgeHostOutputHandoff',
      'createHostOutputHandoff',
      'hostOutputHandoff'
    ]) ?? evidence;
  if (handoff === null || typeof handoff !== 'object') {
    throwInvalidRootRequest(
      'Expected private create native bridge host-output handoff evidence.'
    );
  }

  const createRouteAdmissionEvidence = readDiagnosticField(handoff, [
    'createRouteAdmission',
    'privateCreateRouteAdmission',
    'rootCreateRouteAdmission',
    'admission'
  ]);
  const createRouteAdmission =
    acceptedCreateRouteAdmission ??
    consumeAcceptedRustRootCreateRouteAdmissionForRequest(
      record,
      createRouteAdmissionEvidence
    );
  const normalized =
    normalizePrivateCreateNativeBridgeHostOutputHandoff(handoff);
  assertPrivateCreateNativeBridgeHostOutputHandoffMatchesRequest(
    record,
    createRouteAdmission,
    normalized
  );

  return freezeRecord({
    kind: 'FastReactTestRendererPrivateCreateNativeBridgeHostOutputHandoff',
    id: privateCreateNativeBridgeHostOutputHandoffDiagnosticId,
    status: privateCreateNativeBridgeHostOutputHandoffStatus,
    entrypoint,
    compatibilityTarget,
    request: record,
    createRouteAdmission,
    sourceDiagnostic: normalized,
    operation: 'create',
    publicSurface: 'create()',
    hostOutputUpdateKind: 'Create',
    hostOutputShape: 'SingleHostText',
    hostOutput: normalized.hostOutput,
    serializationGateStatus: normalized.serializationGateStatus,
    workLoopFinishedWorkPreflight:
      normalized.workLoopFinishedWorkPreflight,
    renderFinishedWork: normalized.renderFinishedWork,
    commitCurrent: normalized.commitCurrent,
    renderFinishedWorkMatchesCreateRoutePreflight: true,
    commitCurrentMatchesRenderFinishedWork: true,
    minimalTreeHostOutputConsumesRootFinishedWork: true,
    createRouteAdmissionAccepted: true,
    hostOutputHandoffAccepted: true,
    actualRustCreateHostOutputHandoff: true,
    hostOutputProducedByRust: true,
    publicCreateBehaviorAvailable: false,
    publicSerializationAvailable: false,
    publicTestInstanceAvailable: false,
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  });
}

function normalizePrivateCreateNativeBridgeHostOutputHandoff(handoff) {
  const hostOutput = readDiagnosticField(handoff, [
    'hostOutput',
    'host_output'
  ]);
  if (hostOutput === null || typeof hostOutput !== 'object') {
    throwInvalidRootRequest(
      'Private create native bridge handoff requires host-output diagnostics.'
    );
  }

  return freezeRecord({
    id: readDiagnosticField(handoff, [
      'id',
      'diagnosticId',
      'diagnostic_id'
    ]),
    status: readDiagnosticField(handoff, ['status']),
    operation: readDiagnosticField(handoff, ['operation']),
    publicSurface: readDiagnosticField(handoff, [
      'publicSurface',
      'public_surface'
    ]),
    rootRequestId: readDiagnosticField(handoff, [
      'rootRequestId',
      'root_request_id',
      'requestId',
      'request_id'
    ]),
    rootRequestSequence: readDiagnosticField(handoff, [
      'rootRequestSequence',
      'root_request_sequence',
      'requestSequence',
      'request_sequence'
    ]),
    rootApi: readDiagnosticField(handoff, ['rootApi', 'root_api']),
    updateKind: readDiagnosticField(handoff, [
      'hostOutputUpdateKind',
      'host_output_update_kind',
      'scheduledUpdateKind',
      'scheduled_update_kind',
      'updateKind',
      'update_kind'
    ]),
    rustOutcome: readDiagnosticField(handoff, [
      'rustOutcome',
      'rust_outcome'
    ]),
    scheduled: readDiagnosticField(handoff, ['scheduled']),
    createRouteAdmissionRecordId: readDiagnosticField(handoff, [
      'createRouteAdmissionRecordId',
      'create_route_admission_record_id'
    ]),
    createRouteAdmissionStatus: readDiagnosticField(handoff, [
      'createRouteAdmissionStatus',
      'create_route_admission_status'
    ]),
    hostOutputShape: readDiagnosticField(handoff, [
      'hostOutputShape',
      'host_output_shape'
    ]),
    hostOutputSnapshotCurrent:
      readDiagnosticField(handoff, [
        'hostOutputSnapshotCurrent',
        'host_output_snapshot_current'
      ]) ?? true,
    hostOutput: freezeRecord({
      containerChildCount: readDiagnosticField(hostOutput, [
        'containerChildCount',
        'container_child_count'
      ]),
      instanceCount: readDiagnosticField(hostOutput, [
        'instanceCount',
        'instance_count'
      ]),
      textCount: readDiagnosticField(hostOutput, [
        'textCount',
        'text_count'
      ]),
      realHostOutputAvailable: readDiagnosticField(hostOutput, [
        'realHostOutputAvailable',
        'real_host_output_available'
      ])
    }),
    serializationGateStatus: readDiagnosticField(handoff, [
      'serializationGateStatus',
      'serialization_gate_status'
    ]),
    workLoopFinishedWorkPreflight: normalizeRootCreateWorkLoopFinishedWorkPreflight(
      readDiagnosticField(handoff, [
        'workLoopFinishedWorkPreflight',
        'rootWorkLoopFinishedWorkPreflight',
        'finishedWorkPreflight',
        'work_loop_finished_work_preflight'
      ])
    ),
    renderFinishedWork: normalizeCreateRouteFiberHandle(
      readDiagnosticField(handoff, [
        'renderFinishedWork',
        'render_finished_work'
      ]),
      'renderFinishedWork'
    ),
    commitCurrent: normalizeCreateRouteFiberHandle(
      readDiagnosticField(handoff, ['commitCurrent', 'commit_current']),
      'commitCurrent'
    ),
    renderFinishedWorkMatchesCreateRoutePreflight:
      readBooleanDiagnosticField(handoff, [
        'renderFinishedWorkMatchesCreateRoutePreflight',
        'render_finished_work_matches_create_route_preflight'
      ]),
    commitCurrentMatchesRenderFinishedWork: readBooleanDiagnosticField(
      handoff,
      [
        'commitCurrentMatchesRenderFinishedWork',
        'commit_current_matches_render_finished_work'
      ]
    ),
    minimalTreeHostOutputConsumesRootFinishedWork:
      readBooleanDiagnosticField(handoff, [
        'minimalTreeHostOutputConsumesRootFinishedWork',
        'minimal_tree_host_output_consumes_root_finished_work'
      ]),
    createRouteAdmissionAccepted: readDiagnosticField(handoff, [
      'createRouteAdmissionAccepted',
      'create_route_admission_accepted'
    ]),
    hostOutputHandoffAccepted: readDiagnosticField(handoff, [
      'hostOutputHandoffAccepted',
      'host_output_handoff_accepted'
    ]),
    actualRustCreateHostOutputHandoff: readDiagnosticField(handoff, [
      'actualRustCreateHostOutputHandoff',
      'actual_rust_create_host_output_handoff'
    ]),
    hostOutputProducedByRust: readDiagnosticField(handoff, [
      'hostOutputProducedByRust',
      'host_output_produced_by_rust'
    ]),
    publicCreateBehaviorAvailable: readDiagnosticField(handoff, [
      'publicCreateBehaviorAvailable',
      'public_create_behavior_available'
    ]),
    publicSerializationAvailable: readDiagnosticField(handoff, [
      'publicSerializationAvailable',
      'public_serialization_available'
    ]),
    publicTestInstanceAvailable: readDiagnosticField(handoff, [
      'publicTestInstanceAvailable',
      'public_test_instance_available'
    ]),
    nativeAddonLoaded: readDiagnosticField(handoff, [
      'nativeAddonLoaded',
      'native_addon_loaded'
    ]),
    nativeBridgeAvailable: readDiagnosticField(handoff, [
      'nativeBridgeAvailable',
      'native_bridge_available'
    ]),
    nativeExecution: readDiagnosticField(handoff, [
      'nativeExecution',
      'native_execution'
    ]),
    rustExecutionFromJs: readDiagnosticField(handoff, [
      'rustExecutionFromJs',
      'rust_execution_from_js'
    ]),
    hostOutputProducedFromJs: readDiagnosticField(handoff, [
      'hostOutputProducedFromJs',
      'host_output_produced_from_js'
    ]),
    compatibilityClaimed: readDiagnosticField(handoff, [
      'compatibilityClaimed',
      'compatibility_claimed'
    ])
  });
}

function assertPrivateCreateNativeBridgeHostOutputHandoffMatchesRequest(
  record,
  createRouteAdmission,
  handoff
) {
  if (
    handoff.id !== privateCreateNativeBridgeHostOutputHandoffDiagnosticId ||
    handoff.status !== privateCreateNativeBridgeHostOutputHandoffStatus ||
    handoff.operation !== 'create' ||
    handoff.publicSurface !== 'create()'
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff identity is not accepted.'
    );
  }
  if (
    handoff.rootRequestId !== undefined &&
    handoff.rootRequestId !== record.requestId
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff request id is stale.'
    );
  }
  if (
    handoff.rootRequestSequence !== undefined &&
    handoff.rootRequestSequence !== record.requestSequence
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff request sequence is stale.'
    );
  }
  if (
    handoff.rootApi !== undefined &&
    handoff.rootApi !== 'TestRendererRoot::create'
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff root API is stale.'
    );
  }
  if (
    handoff.updateKind !== 'Create' ||
    handoff.rustOutcome !== 'Scheduled' ||
    handoff.scheduled !== true
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff does not match a scheduled create.'
    );
  }
  if (
    handoff.createRouteAdmissionRecordId !== undefined &&
    handoff.createRouteAdmissionRecordId !== createRouteAdmission.id
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff admission id is stale.'
    );
  }
  if (
    handoff.createRouteAdmissionStatus !== undefined &&
    handoff.createRouteAdmissionStatus !== createRouteAdmission.status
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff admission status is stale.'
    );
  }
  if (
    handoff.hostOutputShape !== 'SingleHostText' ||
    handoff.hostOutputSnapshotCurrent !== true ||
    handoff.hostOutput.containerChildCount !== 1 ||
    handoff.hostOutput.instanceCount !== 1 ||
    handoff.hostOutput.textCount !== 1 ||
    handoff.hostOutput.realHostOutputAvailable !== true
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff host output is not the accepted minimal tree.'
    );
  }
  const routeWorkLoop =
    createRouteAdmission.sourceDiagnostic?.workLoopFinishedWorkPreflight;
  if (
    routeWorkLoop === undefined ||
    !createRouteFiberHandlesEqual(
      handoff.workLoopFinishedWorkPreflight.finishedWork,
      routeWorkLoop.finishedWork
    ) ||
    !createRouteFiberHandlesEqual(
      handoff.renderFinishedWork,
      routeWorkLoop.finishedWork
    ) ||
    !createRouteFiberHandlesEqual(
      handoff.commitCurrent,
      handoff.renderFinishedWork
    ) ||
    handoff.renderFinishedWorkMatchesCreateRoutePreflight !== true ||
    handoff.commitCurrentMatchesRenderFinishedWork !== true ||
    handoff.minimalTreeHostOutputConsumesRootFinishedWork !== true
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff is not tied to the accepted root finished work.'
    );
  }
  if (
    handoff.createRouteAdmissionAccepted !== true ||
    handoff.hostOutputHandoffAccepted !== true ||
    handoff.actualRustCreateHostOutputHandoff !== true ||
    handoff.hostOutputProducedByRust !== true
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff acceptance flags are not accepted.'
    );
  }
  if (
    handoff.publicCreateBehaviorAvailable !== false ||
    handoff.publicSerializationAvailable !== false ||
    handoff.publicTestInstanceAvailable !== false ||
    handoff.nativeAddonLoaded !== false ||
    handoff.nativeBridgeAvailable !== false ||
    handoff.nativeExecution !== false ||
    handoff.rustExecutionFromJs !== false ||
    handoff.hostOutputProducedFromJs !== false ||
    handoff.compatibilityClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Private create native bridge handoff cannot open public, native, or serialization compatibility.'
    );
  }
}

function getTestInstanceQueryDiagnosticsForRootRequest(record) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }

  let diagnostics = rootRequestTestInstanceQueryDiagnostics.get(record);
  if (diagnostics === undefined) {
    diagnostics = createPrivateTestInstanceWrapperRecordForRootRequest(record);
    rootRequestTestInstanceQueryDiagnostics.set(record, diagnostics);
  }
  return diagnostics;
}

function getTestInstanceQueryBridgePreflightForRootRequest(record) {
  return getTestInstanceQueryDiagnosticsForRootRequest(record)
    .queryBridgePreflight;
}

function consumeAcceptedRustTestInstanceQueryDiagnosticsForRequest(
  record,
  diagnostics
) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }

  return createPrivateTestInstanceQueryBridgePreflightRecord(
    record,
    diagnostics
  );
}

function createPrivateTestInstanceQueryBridgePreflightRecord(
  rootRequest,
  diagnostics
) {
  const findAllDiagnostic = selectAcceptedRustTestInstanceFindAllDiagnostic(
    diagnostics
  );
  const findByDiagnostic = selectAcceptedRustTestInstanceFindByDiagnostic(
    diagnostics
  );
  const normalizedFindAll =
    normalizeAcceptedRustTestInstanceFindAllDiagnostic(findAllDiagnostic);
  const normalizedFindBy =
    normalizeAcceptedRustTestInstanceFindByDiagnostic(findByDiagnostic);

  if (
    normalizedFindBy.sourceFindAllDiagnosticName !==
    normalizedFindAll.diagnosticName
  ) {
    throwInvalidRootRequest(
      'Accepted Rust TestInstance findBy diagnostic is not based on the accepted findAll diagnostic.'
    );
  }

  return freezeRecord({
    id: 'react-test-renderer-private-test-instance-query-bridge-preflight',
    kind: 'FastReactTestRendererPrivateTestInstanceQueryBridgePreflight',
    diagnosticName: privateTestInstanceQueryBridgePreflightDiagnosticName,
    status: privateTestInstanceQueryBridgePreflightStatus,
    gate: privateTestInstanceQueryBridgePreflightGate,
    entrypoint,
    compatibilityTarget,
    rootRequest,
    rootHandle: rootRequest.rootHandle,
    rootId: rootRequest.rootId,
    rootSequence: rootRequest.rootSequence,
    bridgeSource:
      'FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery',
    wrapperRecordSymbol: privateTestInstanceWrapperRecordSymbol.description,
    sourceFindAllDiagnosticName: normalizedFindAll.diagnosticName,
    sourceFindByDiagnosticName: normalizedFindBy.diagnosticName,
    acceptedRustFindAllDiagnostics: findAllDiagnostic,
    acceptedRustFindByDiagnostics: findByDiagnostic,
    normalizedAcceptedRustFindAllDiagnostics: normalizedFindAll,
    normalizedAcceptedRustFindByDiagnostics: normalizedFindBy,
    findAllPredicateKinds: normalizedFindAll.predicateKinds,
    findByQueries: normalizedFindBy.queries,
    consumesAcceptedRustFindAllDiagnostics: true,
    consumesAcceptedRustFindByDiagnostics: true,
    recordOnlyDiagnosticConsumption: true,
    publicRootAvailable: false,
    publicQueryMethodsAvailable: false,
    publicTestInstanceObjectAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: false,
    compatibilityClaimed: false
  });
}

function selectAcceptedRustTestInstanceFindAllDiagnostic(diagnostics) {
  if (diagnostics === undefined) {
    return privateTestInstanceFindAllPredicateDiagnostics;
  }
  if (diagnostics === null || typeof diagnostics !== 'object') {
    throwInvalidRootRequest(
      'Expected accepted Rust TestInstance query diagnostics records.'
    );
  }

  return (
    readDiagnosticField(diagnostics, [
      'findAll',
      'findAllDiagnostic',
      'findAllDiagnostics',
      'findAllPredicateDiagnostics',
      'acceptedRustFindAllDiagnostics'
    ]) ?? diagnostics
  );
}

function selectAcceptedRustTestInstanceFindByDiagnostic(diagnostics) {
  if (diagnostics === undefined) {
    return privateTestInstanceFindByQueryDiagnostics;
  }
  if (diagnostics === null || typeof diagnostics !== 'object') {
    throwInvalidRootRequest(
      'Expected accepted Rust TestInstance query diagnostics records.'
    );
  }

  return (
    readDiagnosticField(diagnostics, [
      'findBy',
      'findByDiagnostic',
      'findByDiagnostics',
      'findByQueryDiagnostics',
      'acceptedRustFindByDiagnostics'
    ]) ?? diagnostics
  );
}

function normalizeAcceptedRustTestInstanceFindAllDiagnostic(diagnostic) {
  if (diagnostic === null || typeof diagnostic !== 'object') {
    throwInvalidRootRequest(
      'Expected an accepted Rust TestInstance findAll diagnostic record.'
    );
  }

  const diagnosticName = readDiagnosticField(diagnostic, [
    'diagnosticName',
    'diagnostic_name',
    'acceptedRustDiagnosticName'
  ]);
  if (
    diagnosticName !== privateTestInstanceFindAllPredicateDiagnostics.diagnosticName
  ) {
    throwInvalidRootRequest(
      'Unsupported accepted Rust TestInstance findAll diagnostic name.'
    );
  }

  assertFalseIfPresent(diagnostic, [
    'publicQueryMethodAvailable',
    'public_query_method_available',
    'publicQueryMethodsAvailable',
    'public_query_methods_available'
  ], 'findAll public query availability');
  assertFalseIfPresent(diagnostic, [
    'publicTestInstanceObjectAvailable',
    'public_test_instance_object_available'
  ], 'findAll public TestInstance object availability');
  assertFalseIfPresent(diagnostic, [
    'nativeBridgeAvailable',
    'native_bridge_available'
  ], 'findAll native bridge availability');
  assertFalseIfPresent(diagnostic, [
    'nativeExecution',
    'native_execution'
  ], 'findAll native execution');
  assertFalseIfPresent(diagnostic, [
    'compatibilityClaimed',
    'compatibility_claimed'
  ], 'findAll compatibility claim');

  return freezeRecord({
    diagnosticName,
    source:
      readDiagnosticField(diagnostic, ['source']) ??
      privateTestInstanceFindAllPredicateDiagnostics.source,
    traversalOrder:
      readDiagnosticField(diagnostic, [
        'traversalOrder',
        'traversal_order'
      ]) ?? privateTestInstanceFindAllPredicateDiagnostics.traversalOrder,
    defaultDeep:
      readDiagnosticField(diagnostic, ['defaultDeep', 'default_deep']) ??
      privateTestInstanceFindAllPredicateDiagnostics.defaultDeep,
    predicateKinds: freezeArray(
      normalizeStringArray(
        readDiagnosticField(diagnostic, [
          'predicateKinds',
          'predicate_kinds'
        ]),
        privateTestInstanceFindAllPredicateDiagnostics.predicateKinds
      )
    ),
    predicateExecution:
      readDiagnosticField(diagnostic, [
        'predicateExecution',
        'predicate_execution'
      ]) ?? false,
    sourceRecord: diagnostic
  });
}

function normalizeAcceptedRustTestInstanceFindByDiagnostic(diagnostic) {
  if (diagnostic === null || typeof diagnostic !== 'object') {
    throwInvalidRootRequest(
      'Expected an accepted Rust TestInstance findBy diagnostic record.'
    );
  }

  const diagnosticName = readDiagnosticField(diagnostic, [
    'diagnosticName',
    'diagnostic_name',
    'acceptedRustDiagnosticName'
  ]);
  if (
    diagnosticName !== privateTestInstanceFindByQueryDiagnostics.diagnosticName
  ) {
    throwInvalidRootRequest(
      'Unsupported accepted Rust TestInstance findBy diagnostic name.'
    );
  }

  assertFalseIfPresent(diagnostic, [
    'publicQueryMethodAvailable',
    'public_query_method_available',
    'publicQueryMethodsAvailable',
    'public_query_methods_available'
  ], 'findBy public query availability');
  assertFalseIfPresent(diagnostic, [
    'publicTestInstanceObjectAvailable',
    'public_test_instance_object_available'
  ], 'findBy public TestInstance object availability');
  assertFalseIfPresent(diagnostic, [
    'nativeBridgeAvailable',
    'native_bridge_available'
  ], 'findBy native bridge availability');
  assertFalseIfPresent(diagnostic, [
    'nativeExecution',
    'native_execution'
  ], 'findBy native execution');
  assertFalseIfPresent(diagnostic, [
    'compatibilityClaimed',
    'compatibility_claimed'
  ], 'findBy compatibility claim');

  return freezeRecord({
    diagnosticName,
    sourceFindAllDiagnosticName:
      readDiagnosticField(diagnostic, [
        'sourceFindAllDiagnosticName',
        'source_find_all_diagnostic_name',
        'findAllDiagnosticName'
      ]) ?? privateTestInstanceFindByQueryDiagnostics.findAllDiagnosticName,
    queries: freezeArray(
      normalizeStringArray(
        readDiagnosticField(diagnostic, ['queries', 'findByQueries']),
        privateTestInstanceFindByQueryDiagnostics.queries
      )
    ),
    effectiveDeep:
      readDiagnosticField(diagnostic, ['effectiveDeep', 'effective_deep']) ??
      privateTestInstanceFindByQueryDiagnostics.effectiveDeep,
    expectOne:
      readDiagnosticField(diagnostic, ['expectOne', 'expect_one']) ??
      privateTestInstanceFindByQueryDiagnostics.expectOne,
    predicateExecution:
      readDiagnosticField(diagnostic, [
        'predicateExecution',
        'predicate_execution'
      ]) ?? false,
    sourceRecord: diagnostic
  });
}

function normalizeStringArray(value, fallback) {
  const source = value === undefined ? fallback : value;
  if (!Array.isArray(source)) {
    throwInvalidRootRequest(
      'Expected an accepted Rust TestInstance query diagnostic array.'
    );
  }
  for (const entry of source) {
    if (typeof entry !== 'string') {
      throwInvalidRootRequest(
        'Expected accepted Rust TestInstance query diagnostic strings.'
      );
    }
  }
  return source.slice();
}

function assertFalseIfPresent(record, names, label) {
  const value = readDiagnosticField(record, names);
  if (value !== undefined && value !== false) {
    throwInvalidRootRequest(
      `Accepted Rust TestInstance query diagnostic ${label} must be false.`
    );
  }
}

function getPrivateErrorBoundaryDiagnosticsForRootRequest(record) {
  if (!isRootRequestRecord(record)) {
    throwInvalidRootRequest(
      'Expected a private react-test-renderer root request record.'
    );
  }

  let diagnostics = rootRequestErrorBoundaryDiagnostics.get(record);
  if (diagnostics === undefined) {
    diagnostics = createPrivateErrorBoundaryDiagnosticsForRootRequest(record);
    rootRequestErrorBoundaryDiagnostics.set(record, diagnostics);
  }
  return diagnostics;
}

function createPrivateErrorBoundaryDiagnosticsForRootRequest(rootRequest) {
  const rootErrorOptionsSourceRequest =
    getRootErrorOptionsSourceRequestForRootRequest(rootRequest);
  const rootErrorOptions = getRootErrorOptionsForRootRequest(rootRequest);
  const dependencyDiagnostics =
    createPrivateErrorBoundaryDependencyDiagnostics(rootRequest);
  const acceptedRustApi =
    getPrivateErrorBoundaryAcceptedRustApiForRootRequest(rootRequest);
  const rows = privateErrorBoundaryDiagnosticRows.map((row) =>
    createPrivateErrorBoundaryDiagnosticRow(
      rootRequest,
      rootErrorOptions,
      dependencyDiagnostics,
      acceptedRustApi,
      row
    )
  );

  return freezeRecord({
    id: 'react-test-renderer-private-error-boundary-diagnostics',
    kind: 'FastReactTestRendererPrivateErrorBoundaryDiagnostics',
    status: privateErrorBoundaryDiagnosticsStatus,
    diagnosticName: privateErrorBoundaryDiagnosticName,
    entrypoint,
    compatibilityTarget,
    symbol: privateErrorBoundaryDiagnosticsSymbol.description,
    gate: privateErrorBoundaryDiagnosticsGate,
    rootRequest,
    rootHandle: rootRequest.rootHandle,
    rootId: rootRequest.rootId,
    rootSequence: rootRequest.rootSequence,
    rootOperation: rootRequest.operation,
    rootRequestType: rootRequest.requestType,
    rootErrorOptions,
    rootErrorOptionsSourceRequest: rootErrorOptionsSourceRequest,
    rootErrorOptionsSourceRequestId:
      rootErrorOptionsSourceRequest?.requestId ?? null,
    rootErrorOptionsInheritedFromCreateRequest:
      rootRequest.operation !== 'create' &&
      rootErrorOptionsSourceRequest?.operation === 'create',
    dependencyDiagnostics,
    acceptedRustApi,
    acceptedPrivateDiagnosticDependencyIds:
      privateErrorBoundaryDiagnosticDependencyIds,
    phases: privateErrorBoundaryDiagnosticPhases,
    rows: freezeArray(rows),
    rowCount: rows.length,
    hostOutputUpdateKind: 'Update',
    privateRootErrorOptionMetadataAvailable: true,
    updateErrorRowAvailable: true,
    renderErrorRowAvailable: false,
    commitErrorRowAvailable: true,
    updateRouteDiagnosticsAvailable: true,
    serializationDiagnosticsAvailable: true,
    testInstanceQueryDiagnosticsAvailable: true,
    actSchedulerMetadataAvailable: true,
    publicErrorBoundaryBehaviorAvailable: false,
    publicErrorBoundaryBehaviorExposed: false,
    publicRootErrorCallbacksInvoked: false,
    publicRendererRootsExecuted: false,
    publicLifecycleMethodsExecuted: false,
    errorBoundaryRecoveryExecuted: false,
    privateNativeExecutionEvidenceAvailable: true,
    nativeExecutionEvidenceDiagnosticName:
      privateErrorBoundaryNativeExecutionDiagnosticName,
    nativeExecutionEvidenceStatus: privateErrorBoundaryNativeExecutionStatus,
    acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
    acceptedNativeExecutionOperations: freezeArray(['update']),
    commitRecoveryMetadataAvailable: true,
    commitRecoveryDiagnosticName:
      privateErrorBoundaryCommitRecoveryDiagnosticName,
    commitRecoveryStatus: privateErrorBoundaryCommitRecoveryStatus,
    commitRecoveryRustApi: privateErrorBoundaryCommitRecoveryRustApi,
    commitPhaseRecoveryPath: privateErrorBoundaryCommitRecoveryPath,
    commitPhaseRecoveryAction: privateErrorBoundaryCommitRecoveryAction,
    commitPhaseRecoveryReference:
      privateErrorBoundaryCommitRecoveryReference,
    consumesAcceptedRootExecutionDiagnostics: true,
    consumesAcceptedRustUpdateMetadata: true,
    consumesAcceptedRustFailureMetadata: true,
    consumesAcceptedCommitRecoveryMetadata: true,
    publicErrorRecoveryAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    reconcilerExecution: false,
    compatibilityClaimed: false,
    canCreateAcceptedNativeExecutionDiagnosticResult(executionRecord) {
      try {
        createPrivateErrorBoundaryNativeExecutionDiagnosticResult(
          rootRequest,
          executionRecord
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedNativeExecutionDiagnosticResult(executionRecord) {
      return createPrivateErrorBoundaryNativeExecutionDiagnosticResult(
        rootRequest,
        executionRecord
      );
    }
  });
}

function createPrivateErrorBoundaryDiagnosticRow(
  rootRequest,
  rootErrorOptions,
  dependencyDiagnostics,
  acceptedRustApi,
  row
) {
  return freezeRecord({
    id: row.id,
    kind: 'FastReactTestRendererPrivateErrorDiagnosticRow',
    status: privateErrorBoundaryDiagnosticsStatus,
    diagnosticName: privateErrorBoundaryDiagnosticName,
    phase: row.phase,
    rootErrorChannel: row.rootErrorChannel,
    reactReference: row.reactReference,
    acceptedRustRecord: 'TestRendererPrivateErrorDiagnosticRow',
    acceptedRustApi:
      'TestRendererRoot::describe_private_error_boundary_diagnostics_for_canary',
    rootRequest,
    rootId: rootRequest.rootId,
    rootSequence: rootRequest.rootSequence,
    rootOperation: rootRequest.operation,
    rootRequestType: rootRequest.requestType,
    hostOutputUpdateKind: row.hostOutputUpdateKind,
    rootErrorOptions,
    dependencyDiagnostics,
    acceptedRustApi,
    acceptedPrivateDiagnosticDependencyIds:
      row.acceptedPrivateDiagnosticDependencyIds,
    capturesRootErrorOptions: true,
    rootErrorUpdateScheduled: false,
    publicRootErrorCallbackInvoked: false,
    publicRootErrorCallbacksInvoked: false,
    publicErrorBoundaryBehaviorAvailable: false,
    publicErrorBoundaryBehaviorExposed: false,
    publicRendererRootsExecuted: false,
    publicLifecycleMethodsExecuted: false,
    errorBoundaryRecoveryExecuted: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    reconcilerExecution: false,
    compatibilityClaimed: false
  });
}

function consumePrivateErrorBoundaryCommitRecoveryMetadataForRequest(
  rootRequest,
  evidence,
  updateAdmission
) {
  if (!isRootRequestRecord(rootRequest)) {
    throwInvalidRootRequest(
      'Expected a private root request for error boundary commit recovery metadata.'
    );
  }
  const source =
    readDiagnosticField(evidence, [
      'privateErrorBoundaryCommitRecoveryMetadata',
      'commitPhaseRecoveryMetadata',
      'errorBoundaryCommitRecoveryMetadata',
      'commit_recovery_metadata'
    ]) ?? evidence.privateErrorBoundaryCommitRecoveryMetadata;
  if (source === undefined || source === null || typeof source !== 'object') {
    throwInvalidRootRequest(
      'Expected private error boundary commit recovery metadata.'
    );
  }
  if (
    source.id !== privateErrorBoundaryCommitRecoveryDiagnosticName ||
    source.status !== privateErrorBoundaryCommitRecoveryStatus ||
    source.acceptedRustApi !== privateErrorBoundaryCommitRecoveryRustApi ||
    source.kind !==
      'FastReactTestRendererPrivateErrorBoundaryCommitRecoveryMetadata' ||
    source.rootRequestId !== rootRequest.requestId ||
    source.rootId !== rootRequest.rootId ||
    source.operation !== 'update' ||
    source.updateFailurePath !== 'commit' ||
    source.commitPhaseRecoveryPath !== privateErrorBoundaryCommitRecoveryPath ||
    source.commitPhaseRecoveryAction !==
      privateErrorBoundaryCommitRecoveryAction ||
    source.sourceUpdateRecord !== 'TestRendererUpdateNativeBridgeAdmission' ||
    source.sourceUpdateRecordId !== privateUpdateNativeBridgeAdmissionDiagnosticId ||
    source.sourceUpdateRecordStatus !== privateUpdateNativeBridgeAdmissionStatus ||
    source.sourceUpdateKind !== 'Update' ||
    source.sourceFailureRecord !==
      'HostRootRenderFailureRecoveryCommitEvidenceForCanary' ||
    source.sourceCommitRecoverySnapshotRecord !==
      'HostRootCommitRecoverySnapshotForCanary' ||
    source.consumesAcceptedRustUpdateMetadata !== true ||
    source.consumesAcceptedRustFailureMetadata !== true ||
    source.consumesAcceptedCommitRecoverySnapshot !== true ||
    source.preservesRootErrorOptionHandles !== true ||
    source.commitPhaseRecoveryPathConsumed !== true
  ) {
    throwInvalidRootRequest(
      'Expected accepted private error boundary commit recovery metadata.'
    );
  }
  if (
    source.rootErrorUpdateScheduled !== false ||
    source.publicRootErrorCallbacksInvoked !== false ||
    source.publicErrorBoundaryBehaviorAvailable !== false ||
    source.publicErrorRecoveryAvailable !== false ||
    source.compatibilityClaimed !== false ||
    updateAdmission.publicUpdateCompatibilityClaimed !== false ||
    updateAdmission.compatibilityClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Private error boundary commit recovery metadata cannot claim public recovery compatibility.'
    );
  }

  return freezeRecord({
    id: privateErrorBoundaryCommitRecoveryDiagnosticName,
    kind: 'FastReactTestRendererPrivateErrorBoundaryCommitRecoveryMetadata',
    status: privateErrorBoundaryCommitRecoveryStatus,
    acceptedRustApi: privateErrorBoundaryCommitRecoveryRustApi,
    rootRequest,
    rootRequestId: rootRequest.requestId,
    rootId: rootRequest.rootId,
    operation: 'update',
    updateFailurePath: 'commit',
    commitPhaseRecoveryPath: privateErrorBoundaryCommitRecoveryPath,
    commitPhaseRecoveryAction: privateErrorBoundaryCommitRecoveryAction,
    reactReference: privateErrorBoundaryCommitRecoveryReference,
    sourceUpdateRecord: 'TestRendererUpdateNativeBridgeAdmission',
    sourceUpdateRecordId: privateUpdateNativeBridgeAdmissionDiagnosticId,
    sourceUpdateRecordStatus: privateUpdateNativeBridgeAdmissionStatus,
    sourceUpdateKind: 'Update',
    sourceFailureRecord:
      'HostRootRenderFailureRecoveryCommitEvidenceForCanary',
    sourceCommitRecoverySnapshotRecord:
      'HostRootCommitRecoverySnapshotForCanary',
    sourceMetadata: source,
    privateUpdateNativeBridgeAdmission: updateAdmission,
    consumesAcceptedRustUpdateMetadata: true,
    consumesAcceptedRustFailureMetadata: true,
    consumesAcceptedCommitRecoverySnapshot: true,
    preservesRootErrorOptionHandles: true,
    commitPhaseRecoveryPathConsumed: true,
    rootErrorUpdateScheduled: false,
    publicRootErrorCallbacksInvoked: false,
    publicErrorBoundaryBehaviorAvailable: false,
    publicErrorRecoveryAvailable: false,
    compatibilityClaimed: false
  });
}

function createPrivateErrorBoundaryNativeExecutionDiagnosticResult(
  rootRequest,
  executionRecord
) {
  const execution = consumeAcceptedErrorBoundaryNativeExecutionRecord(
    rootRequest,
    executionRecord
  );
  const diagnostics = getPrivateErrorBoundaryDiagnosticsForRootRequest(
    rootRequest
  );
  const commitRecoveryMetadata =
    execution.privateErrorBoundaryCommitRecoveryMetadata;

  if (
    diagnostics.publicErrorBoundaryBehaviorAvailable !== false ||
    diagnostics.publicRootErrorCallbacksInvoked !== false ||
    diagnostics.errorBoundaryRecoveryExecuted !== false ||
    diagnostics.compatibilityClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Private error boundary native execution evidence cannot consume public recovery diagnostics.'
    );
  }
  if (
    commitRecoveryMetadata === null ||
    commitRecoveryMetadata === undefined ||
    commitRecoveryMetadata.consumesAcceptedRustUpdateMetadata !== true ||
    commitRecoveryMetadata.consumesAcceptedRustFailureMetadata !== true ||
    commitRecoveryMetadata.consumesAcceptedCommitRecoverySnapshot !== true ||
    commitRecoveryMetadata.preservesRootErrorOptionHandles !== true ||
    commitRecoveryMetadata.commitPhaseRecoveryPathConsumed !== true ||
    commitRecoveryMetadata.publicErrorRecoveryAvailable !== false ||
    commitRecoveryMetadata.compatibilityClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Private error boundary native execution evidence requires accepted commit recovery metadata.'
    );
  }

  return freezeRecord({
    id: 'react-test-renderer-private-error-boundary-after-native-update-result',
    kind: 'FastReactTestRendererPrivateErrorBoundaryNativeExecutionEvidence',
    diagnosticName: privateErrorBoundaryNativeExecutionDiagnosticName,
    status: privateErrorBoundaryNativeExecutionStatus,
    entrypoint,
    compatibilityTarget,
    publicSurface: 'create().update error boundary',
    sourceDiagnostic: privateErrorBoundaryDiagnosticName,
    sourceDiagnosticResult: diagnostics.id,
    acceptedRustApi: privateErrorBoundaryCommitRecoveryRustApi,
    acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
    rootRequest,
    rootExecutionResult: execution,
    privateUpdateNativeBridgeAdmission:
      execution.privateUpdateNativeBridgeAdmission,
    commitRecoveryMetadata,
    operation: 'update',
    updateFailurePath: 'update',
    commitPhaseRecoveryPath: commitRecoveryMetadata.commitPhaseRecoveryPath,
    commitPhaseRecoveryAction:
      commitRecoveryMetadata.commitPhaseRecoveryAction,
    requestId: execution.requestId,
    requestSequence: execution.requestSequence,
    rootId: execution.request.rootId,
    rootSequence: execution.request.rootSequence,
    updateKind: 'Update',
    hostOutputUpdateKind: 'Update',
    rootErrorOptions: diagnostics.rootErrorOptions,
    dependencyDiagnostics: diagnostics.dependencyDiagnostics,
    rows: diagnostics.rows,
    rowCount: diagnostics.rowCount,
    consumesAcceptedRootExecutionDiagnostics: true,
    consumesAcceptedNativeExecutionRecord: true,
    consumesAcceptedNativeUpdateExecutionRecord: true,
    consumesPrivateErrorBoundaryDiagnostics: true,
    consumesPrivateCommitRecoveryMetadata: true,
    consumesAcceptedRustUpdateMetadata: true,
    consumesAcceptedRustFailureMetadata: true,
    consumesAcceptedCommitRecoveryMetadata: true,
    preservesRootErrorOptionHandles: true,
    consumesUpdateErrorRow: diagnostics.updateErrorRowAvailable,
    consumesCommitErrorRow: diagnostics.commitErrorRowAvailable,
    rootErrorUpdateScheduled: false,
    publicRootErrorCallbacksInvoked: false,
    publicErrorBoundaryBehaviorAvailable: false,
    publicErrorBoundaryBehaviorExposed: false,
    errorBoundaryRecoveryExecuted: false,
    publicErrorRecoveryAvailable: false,
    publicCommitPhaseRecoveryAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecutionFromJs: true,
    reconcilerExecutionFromJs: true,
    privateRootRequestExecution: true,
    hostOutputProduced: true,
    compatibilityClaimed: false
  });
}

function consumeAcceptedErrorBoundaryNativeExecutionRecord(
  rootRequest,
  executionRecord
) {
  if (!isRootRequestRecord(rootRequest)) {
    throwInvalidRootRequest(
      'Expected a private root request for error boundary native execution evidence.'
    );
  }
  if (rootRequest.operation !== 'update') {
    throwInvalidRootRequest(
      'Private error boundary native execution evidence only accepts update requests.'
    );
  }
  if (executionRecord === null || typeof executionRecord !== 'object') {
    throwInvalidRootRequest(
      'Expected an accepted private native root execution result.'
    );
  }
  if (
    executionRecord.kind !== undefined &&
    executionRecord.kind !== privateToJSONNativeExecutionRecordKind
  ) {
    throwInvalidRootRequest(
      'Expected a FastReactTestRendererPrivateRootExecutionResult record.'
    );
  }
  if (
    executionRecord.status !== undefined &&
    executionRecord.status !== 'accepted-private-test-renderer-root-execution-result'
  ) {
    throwInvalidRootRequest(
      'Expected an accepted private root execution result status.'
    );
  }

  const request = readDiagnosticField(executionRecord, ['request']);
  if (request !== rootRequest) {
    throwInvalidRootRequest(
      'Expected error boundary native execution evidence to belong to the update request.'
    );
  }
  if (
    executionRecord.operation !== 'update' ||
    executionRecord.updateKind !== 'Update' ||
    executionRecord.scheduled !== true ||
    executionRecord.privateRootRequestExecution !== true ||
    executionRecord.rustRootExecutionBridgeStatus !==
      'admitted-private-test-renderer-native-root-execution-bridge' ||
    executionRecord.rustRootExecutionBoundaryCalled !== true
  ) {
    throwInvalidRootRequest(
      'Expected accepted private update root execution evidence.'
    );
  }

  const updateAdmission = executionRecord.privateUpdateNativeBridgeAdmission;
  if (
    updateAdmission === null ||
    typeof updateAdmission !== 'object' ||
    updateAdmission.id !== privateUpdateNativeBridgeAdmissionDiagnosticId ||
    updateAdmission.status !== privateUpdateNativeBridgeAdmissionStatus ||
    updateAdmission.request !== rootRequest ||
    updateAdmission.hostOutputHandoffAccepted !== true ||
    updateAdmission.rootWorkLoopHandoffAccepted !== true ||
    updateAdmission.lifecycleEvidenceAccepted !== true ||
    updateAdmission.updateRouteAdmissionAccepted !== true
  ) {
    throwInvalidRootRequest(
      'Expected accepted private update native bridge admission evidence.'
    );
  }
  if (
    executionRecord.publicRouteAvailable !== false ||
    executionRecord.publicCreateUpdateUnmountBehaviorAvailable !== false ||
    executionRecord.serializationAvailable !== false ||
    executionRecord.nativeBridgeAvailable !== false ||
    executionRecord.nativeExecution !== false ||
    executionRecord.compatibilityClaimed !== false ||
    updateAdmission.publicUpdateCompatibilityClaimed !== false ||
    updateAdmission.publicSerializationAvailable !== false ||
    updateAdmission.nativeExecution !== false ||
    updateAdmission.compatibilityClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Private error boundary native execution evidence cannot claim public recovery compatibility.'
    );
  }

  return executionRecord;
}

function getPrivateErrorBoundaryAcceptedRustApiForRootRequest(rootRequest) {
  return rootRequest.operation === 'update'
    ? privateErrorBoundaryUpdateRustApi
    : privateErrorBoundaryRootOptionsRustApi;
}

function createPrivateErrorBoundaryDependencyDiagnostics(rootRequest) {
  return freezeRecord({
    id: 'react-test-renderer-error-boundary-update-dependency-diagnostics',
    status: privateErrorBoundaryDiagnosticsStatus,
    rootRequest,
    rootOperation: rootRequest.operation,
    acceptedPrivateDiagnosticDependencyIds:
      privateErrorBoundaryDiagnosticDependencyIds,
    updateRouteDiagnosticsAvailable: true,
    serializationDiagnosticsAvailable: true,
    serializationDiagnosticResultAvailable:
      toJSONPrivateSerializationFacadeGate.privateDiagnosticResultAvailable,
    testInstanceQueryDiagnosticsAvailable: true,
    testInstanceFindByDiagnosticsAvailable:
      currentRustTestRendererRootCanaryMetadata.testInstanceQuery
        .findByDiagnosticsAvailable,
    actSchedulerMetadataAvailable: true,
    actPassiveEffectDrainDiagnosticsConsumed:
      actSchedulerGate.privatePassiveEffectDrainDiagnosticsConsumed,
    mockSchedulerFlushHelperMetadataRouted:
      actSchedulerGate.privateMockSchedulerFlushHelperMetadataRouted,
    publicRendererRootsExecuted: false,
    publicLifecycleMethodsExecuted: false,
    errorBoundaryRecoveryExecuted: false,
    publicErrorBoundaryBehaviorAvailable: false,
    publicRootErrorCallbacksInvoked: false,
    compatibilityClaimed: false
  });
}

function createPrivateTestInstanceWrapperRecordForRootRequest(rootRequest) {
  const rootBridgeMetadata = freezeRecord({
    id: 'react-test-renderer-private-test-instance-root-bridge-metadata',
    bridgeKind: 'FastReactTestRendererPrivateRootRequestBridge',
    bridgeSymbol: rootRequestBridgeSymbol.description,
    source:
      currentRustTestRendererRootCanaryMetadata.testInstanceQuery
        .bridgeMetadataSource,
    status:
      'private-test-instance-query-diagnostics-routed-through-root-bridge',
    rootRequest,
    rootHandle: rootRequest.rootHandle,
    rootId: rootRequest.rootId,
    rootSequence: rootRequest.rootSequence,
    createRequestId: rootRequest.requestId,
    createRequestSequence: rootRequest.requestSequence,
    createRequestStatus: rootRequest.status,
    createRequestExecutionStatus: rootRequest.executionStatus,
    createRequestCompatibilityStatus: rootRequest.compatibilityStatus,
    rustCanaryMetadata: rootRequest.rustCanaryMetadata,
    testInstanceQueryMetadata: rootRequest.rustCanaryMetadata.testInstanceQuery,
    recordOnlyPrivateBridge: rootRequest.rustCanaryMetadata.recordOnlyPrivateBridge,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    reconcilerExecution: false,
    hostOutputProduced: false,
    compatibilityClaimed: false
  });
  const queryBridgePreflight =
    createPrivateTestInstanceQueryBridgePreflightRecord(rootRequest);

  return freezeRecord({
    ...privateTestInstanceWrapperSkeleton,
    status:
      'private-bridge-query-metadata-ready-public-test-instance-blocked',
    bridgeRouted: true,
    bridgeMetadataSource:
      rootRequest.rustCanaryMetadata.testInstanceQuery.bridgeMetadataSource,
    rootBridgeMetadata,
    rootRequest,
    rootHandle: rootRequest.rootHandle,
    rootId: rootRequest.rootId,
    rootSequence: rootRequest.rootSequence,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootRequestStatus: rootRequest.status,
    rootRequestExecutionStatus: rootRequest.executionStatus,
    rootRequestCompatibilityStatus: rootRequest.compatibilityStatus,
    rootRequestOperation: rootRequest.operation,
    rootRequestRustCanaryMetadata: rootRequest.rustCanaryMetadata,
    rootRequestTestInstanceQueryMetadata:
      rootRequest.rustCanaryMetadata.testInstanceQuery,
    queryBridgePreflight,
    acceptedRustFindAllDiagnostics:
      queryBridgePreflight.acceptedRustFindAllDiagnostics,
    acceptedRustFindByDiagnostics:
      queryBridgePreflight.acceptedRustFindByDiagnostics,
    consumesAcceptedRustQueryDiagnostics: true,
    recordOnlyDiagnosticConsumption: true,
    createAcceptedNativeQueryExecutionDiagnosticResult(executionRecord) {
      return createPrivateTestInstanceNativeQueryExecutionDiagnosticResult(
        getTestInstanceQueryDiagnosticsForRootRequest(rootRequest),
        executionRecord
      );
    },
    canCreateAcceptedNativeQueryExecutionDiagnosticResult(executionRecord) {
      try {
        createPrivateTestInstanceNativeQueryExecutionDiagnosticResult(
          getTestInstanceQueryDiagnosticsForRootRequest(rootRequest),
          executionRecord
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedClassRootQueryExecutionDiagnosticResult(
      executionRecord,
      classRootDiagnostic
    ) {
      return createPrivateTestInstanceClassRootQueryExecutionDiagnosticResult(
        getTestInstanceQueryDiagnosticsForRootRequest(rootRequest),
        executionRecord,
        classRootDiagnostic
      );
    },
    canCreateAcceptedClassRootQueryExecutionDiagnosticResult(
      executionRecord,
      classRootDiagnostic
    ) {
      try {
        createPrivateTestInstanceClassRootQueryExecutionDiagnosticResult(
          getTestInstanceQueryDiagnosticsForRootRequest(rootRequest),
          executionRecord,
          classRootDiagnostic
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumesRootBridgeMetadata: true,
    standaloneWrapperMetadata: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    reconcilerExecution: false,
    hostOutputProducedFromJs: false,
    compatibilityClaimed: false
  });
}

function createPrivateTestInstanceNativeQueryExecutionDiagnosticResult(
  owner,
  executionRecord
) {
  const execution =
    consumeAcceptedTestInstanceNativeQueryExecutionRecord(owner, executionRecord);
  const hostComponent = owner.rootQueryRecord.result.children.find(
    (child) =>
      child &&
      child.kind === 'ReactTestInstancePrivateRecord' &&
      child.fiberTag === 'HostComponent'
  );

  if (!isMinimalTestInstanceHostComponentQueryPath(owner, hostComponent)) {
    throwInvalidRootRequest(
      'Expected private native TestInstance query evidence to describe the minimal HostComponent query path.'
    );
  }

  return freezeRecord({
    id: 'react-test-renderer-private-test-instance-native-query-execution-result',
    diagnosticName: privateTestInstanceNativeQueryExecutionDiagnosticName,
    status: privateTestInstanceNativeQueryExecutionStatus,
    gate: privateTestInstanceNativeQueryExecutionGate,
    entrypoint,
    compatibilityTarget,
    publicSurface: 'create().root/ReactTestInstance.findByType',
    acceptedNativeExecutionRecordKind:
      privateTestInstanceNativeQueryExecutionRecordKind,
    rootRequest: owner.rootRequest,
    rootExecutionResult: execution,
    operation: execution.operation,
    requestId: execution.requestId,
    requestSequence: execution.requestSequence,
    rootId: execution.request.rootId,
    hostOutputUpdateKind:
      execution.operation === 'create' ? 'Create' : 'Update',
    sourceQueryDiagnosticName:
      owner.queryBridgePreflight.diagnosticName,
    sourceQueryBridgePreflight: owner.queryBridgePreflight,
    query: 'findByType',
    querySurface: 'ReactTestInstance.findByType',
    queryRecord: owner.queryMethodRecords.findByType,
    queryResult: hostComponent,
    resultKind: 'single',
    resultFiberTag: 'HostComponent',
    matchedCandidateCount: 1,
    queryPathCandidateCount: owner.hostComponentQueryPath.length,
    skippedTextChildCount: owner.queryMethodRecords.findByType.skippedRecords.length,
    consumesAcceptedNativeExecutionRecord: true,
    consumesAcceptedNativeCreateExecutionRecord:
      execution.operation === 'create',
    consumesAcceptedNativeUpdateExecutionRecord:
      execution.operation === 'update',
    consumesPrivateTestInstanceQueryDiagnostics: true,
    consumesQueryBridgePreflight: true,
    consumesAcceptedRustFindAllDiagnostics:
      owner.queryBridgePreflight.consumesAcceptedRustFindAllDiagnostics,
    consumesAcceptedRustFindByDiagnostics:
      owner.queryBridgePreflight.consumesAcceptedRustFindByDiagnostics,
    minimalHostComponentQueryPath: true,
    publicRootAvailable: false,
    publicQueryMethodsAvailable: false,
    publicTestInstanceObjectAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function createPrivateTestInstanceClassRootQueryExecutionDiagnosticResult(
  owner,
  executionRecord,
  classRootReport
) {
  const execution =
    consumeAcceptedTestInstanceNativeQueryExecutionRecord(owner, executionRecord);
  if (execution.operation !== 'update') {
    throwInvalidRootRequest(
      'Private class-root TestInstance query execution only accepts update records.'
    );
  }
  const classRoot = validatePrivateGetInstanceClassRootDiagnostic(
    classRootReport
  );
  if (classRoot.hostOutputUpdateKind !== 'Update') {
    throwInvalidRootRequest(
      'Private class-root TestInstance query evidence requires updated class-root diagnostics.'
    );
  }
  const hostComponent = createPrivateUpdatedHostChildQueryResult(classRoot);
  if (
    owner.queryBridgePreflight.diagnosticName !==
      privateTestInstanceQueryBridgePreflightDiagnosticName ||
    owner.queryBridgePreflight.consumesAcceptedRustFindAllDiagnostics !==
      true ||
    owner.queryBridgePreflight.consumesAcceptedRustFindByDiagnostics !== true ||
    owner.queryMethodRecords.findByType.expectedCanaryMatchCount !== 1 ||
    hostComponent.type !== privateTestInstanceHostComponentType ||
    hostComponent.children[0].text !== classRoot.text ||
    hostComponent.publicObject !== false
  ) {
    throwInvalidRootRequest(
      'Expected private class-root TestInstance query evidence to describe an updated HostComponent child.'
    );
  }

  return freezeRecord({
    id: 'react-test-renderer-private-test-instance-class-root-query-execution-result',
    diagnosticName: privateTestInstanceClassQueryExecutionDiagnosticName,
    status: privateTestInstanceClassQueryExecutionStatus,
    gate: privateTestInstanceClassRootQueryExecutionGate,
    entrypoint,
    compatibilityTarget,
    publicSurface:
      'create().update -> create().root/ReactTestInstance.findByType',
    sourceQueryDiagnosticName:
      owner.queryBridgePreflight.diagnosticName,
    sourceGetInstanceDiagnosticName: privateGetInstanceAcceptedDiagnosticName,
    sourceNativeQueryDiagnosticName:
      privateTestInstanceNativeQueryExecutionDiagnosticName,
    sourceQueryBridgePreflight: owner.queryBridgePreflight,
    rootRequest: owner.rootRequest,
    rootExecutionResult: execution,
    operation: 'update',
    requestId: execution.requestId,
    requestSequence: execution.requestSequence,
    rootId: execution.request.rootId,
    hostOutputUpdateKind: 'Update',
    hostOutputSnapshotCurrent: true,
    acceptedClassRootFiberShape:
      privateGetInstanceAcceptedClassFiberShape,
    rootQuerySurface: 'create().root',
    rootQueryResult: freezeRecord({
      kind: 'ReactTestInstancePrivateRecord',
      fiberTag: 'ClassComponent',
      type: classRoot.componentType,
      props: classRoot.props,
      children: freezeArray([hostComponent]),
      publicObject: false
    }),
    rootResultFiberTag: 'ClassComponent',
    rootComponentType: classRoot.componentType,
    rootChildCount: 1,
    query: 'findByType',
    querySurface: 'ReactTestInstance.findByType',
    queryRecord: owner.queryMethodRecords.findByType,
    queryResult: hostComponent,
    resultKind: 'single',
    resultFiberTag: 'HostComponent',
    childElementType: hostComponent.type,
    childProps: hostComponent.props,
    childText: classRoot.text,
    hostChildUpdated: true,
    classRootQueryPath: freezeArray(['ClassComponent', 'HostComponent']),
    updatedHostChildQueryPath: freezeArray([
      'ClassComponent',
      'HostComponent',
      'HostText'
    ]),
    consumesAcceptedNativeExecutionRecord: true,
    consumesAcceptedNativeUpdateExecutionRecord: true,
    consumesPrivateTestInstanceQueryDiagnostics: true,
    consumesQueryBridgePreflight: true,
    consumesPrivateGetInstanceClassRootDiagnostics: true,
    publicRootAvailable: false,
    publicQueryMethodsAvailable: false,
    publicTestInstanceObjectAvailable: false,
    publicGetInstanceAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function createPrivateUpdatedHostChildQueryResult(classRoot) {
  return freezeRecord({
    id: 'react-test-renderer-private-test-instance-updated-host-child-record',
    kind: 'ReactTestInstancePrivateRecord',
    source:
      'TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence.updated_host_child_query_path',
    fiberTag: 'HostComponent',
    publicObject: false,
    type: classRoot.type,
    props: classRoot.hostProps,
    children: freezeArray([
      freezeRecord({
        id: 'react-test-renderer-private-test-instance-updated-host-text-child',
        kind: 'ReactTestInstancePrivateTextChildRecord',
        fiberTag: 'HostText',
        text: classRoot.text,
        publicObject: false
      })
    ])
  });
}

function consumeAcceptedTestInstanceNativeQueryExecutionRecord(
  owner,
  executionRecord
) {
  if (
    owner === null ||
    typeof owner !== 'object' ||
    !isRootRequestRecord(owner.rootRequest)
  ) {
    throwInvalidRootRequest(
      'Expected private TestInstance query diagnostics for native execution evidence.'
    );
  }
  if (executionRecord === null || typeof executionRecord !== 'object') {
    throwInvalidRootRequest(
      'Expected an accepted private native root execution result.'
    );
  }
  if (
    executionRecord.kind !== undefined &&
    executionRecord.kind !== privateTestInstanceNativeQueryExecutionRecordKind
  ) {
    throwInvalidRootRequest(
      'Expected a FastReactTestRendererPrivateRootExecutionResult record.'
    );
  }
  if (
    executionRecord.status !== undefined &&
    executionRecord.status !== 'accepted-private-test-renderer-root-execution-result'
  ) {
    throwInvalidRootRequest(
      'Expected an accepted private root execution result status.'
    );
  }

  const request = readDiagnosticField(executionRecord, ['request']);
  if (!isRootRequestRecord(request)) {
    throwInvalidRootRequest(
      'Expected native TestInstance query execution result to carry a private root request.'
    );
  }
  if (
    request.rootHandle !== owner.rootHandle ||
    request.rootId !== owner.rootId
  ) {
    throwInvalidRootRequest(
      'Expected native TestInstance query execution result to belong to the renderer root.'
    );
  }
  if (
    !privateTestInstanceNativeQueryExecutionAcceptedOperations.includes(
      request.operation
    )
  ) {
    throwInvalidRootRequest(
      'Expected native TestInstance query execution result operation to be create or update.'
    );
  }
  if (
    executionRecord.request !== request ||
    executionRecord.operation !== request.operation ||
    executionRecord.rustOutcome !== request.rustOutcome ||
    executionRecord.privateRootRequestExecution !== true ||
    executionRecord.rustRootExecutionBridgeStatus !==
      'admitted-private-test-renderer-native-root-execution-bridge' ||
    executionRecord.rustRootExecutionBoundaryCalled !== true ||
    executionRecord.scheduled !== true ||
    executionRecord.hostOutputProduced !== true
  ) {
    throwInvalidRootRequest(
      'Expected accepted private native TestInstance root execution evidence.'
    );
  }
  if (
    request.operation === 'create' &&
    executionRecord.privateCreateNativeBridgeHostOutputHandoff === null
  ) {
    throwInvalidRootRequest(
      'Expected create native TestInstance query evidence to carry create host-output handoff.'
    );
  }
  if (
    request.operation === 'update' &&
    executionRecord.privateUpdateNativeBridgeAdmission === null
  ) {
    throwInvalidRootRequest(
      'Expected update native TestInstance query evidence to carry update native admission.'
    );
  }
  if (
    executionRecord.serializationAvailable !== false ||
    executionRecord.publicRouteAvailable !== false ||
    executionRecord.publicCreateUpdateUnmountBehaviorAvailable !== false ||
    executionRecord.nativeBridgeAvailable !== false ||
    executionRecord.nativeExecution !== false ||
    executionRecord.compatibilityClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Private native TestInstance query evidence cannot claim public or native compatibility.'
    );
  }

  return executionRecord;
}

function isMinimalTestInstanceHostComponentQueryPath(owner, hostComponent) {
  return (
    owner.queryBridgePreflight !== undefined &&
    owner.queryBridgePreflight.diagnosticName ===
      privateTestInstanceQueryBridgePreflightDiagnosticName &&
    owner.queryBridgePreflight.consumesAcceptedRustFindAllDiagnostics ===
      true &&
    owner.queryBridgePreflight.consumesAcceptedRustFindByDiagnostics ===
      true &&
    owner.rootQueryRecord.result.children.length === 2 &&
    owner.hostComponentQueryPath.length === 1 &&
    owner.queryMethodRecords.findByType.expectedCanaryMatchCount === 1 &&
    hostComponent !== undefined &&
    hostComponent.type === privateTestInstanceHostComponentType &&
    hostComponent.fiberTag === 'HostComponent' &&
    hostComponent.publicObject === false &&
    Object.hasOwn(hostComponent, 'findByType') === false
  );
}

function throwInvalidRootRequest(message) {
  const error = new Error(message);
  error.name = 'FastReactTestRendererPrivateRootRequestError';
  error.code = 'FAST_REACT_TEST_RENDERER_INVALID_ROOT_REQUEST';
  error.entrypoint = entrypoint;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function createPrivateToJSONSerializationFacade(rootRequest) {
  return freezeRecord({
    id: 'react-test-renderer-tojson-private-host-output-serializer',
    status: privateToJSONSerializationStatus,
    entrypoint,
    publicSurface: 'create().toJSON',
    symbol: privateToJSONSerializationFacadeSymbol.description,
    gate: toJSONPrivateSerializationFacadeGate,
    rootRequest,
    privateHostOutputDiagnosticsSerializable: true,
    privateDiagnosticResultAvailable: true,
    privateUpdateUnmountHostOutputRows:
      privateToJSONUpdateUnmountHostOutputRows,
    privateNestedUpdateSiblingTextHostOutputRows:
      privateToJSONNestedUpdateSiblingTextHostOutputRows,
    privateUpdateHostOutputRowIds: privateToJSONUpdateHostOutputRowIds,
    privateNestedUpdateHostOutputRowId: privateToJSONNestedUpdateHostOutputRowId,
    privateSiblingTextHostOutputRowId: privateToJSONSiblingTextHostOutputRowId,
    privateHostOutputShapes: privateToJSONHostOutputShapes,
    privateUpdateUnmountDependencyMetadata:
      privateToJSONUpdateUnmountDependencyMetadata,
    privateUpdateHostComponentPropSerializationEvidenceAvailable: true,
    acceptedUpdateHostComponentPropPayloadShape:
      'HostComponentPropPlusTextUpdate',
    updatePropSerializationWorker:
      'worker-671-test-renderer-root-update-serialization-props',
    privateNativeExecutionEvidenceAvailable: true,
    privateNativeExecutionDiagnosticName:
      privateToJSONNativeExecutionDiagnosticName,
    privateNativeExecutionStatus: privateToJSONNativeExecutionStatus,
    privateFinishedWorkIdentityGateAvailable: true,
    privateUpdateFinishedWorkIdentityGateAvailable: true,
    validatesUpdateRootRequestIdentity: true,
    updateNativeExecutionFinishedWorkIdentityAdmissionWorker:
      toJSONPrivateSerializationFacadeGate.updateNativeExecutionFinishedWorkIdentityAdmissionWorker,
    updateNativeExecutionRequiresFinishedWorkIdentity: true,
    rejectsStaleUpdateFinishedWorkIdentity: true,
    rejectsMultichildUpdateNativeExecutionIdentityAdmission: true,
    privateFinishedWorkIdentityDiagnosticName:
      privateSerializationFinishedWorkIdentityDiagnosticName,
    privateFinishedWorkIdentityStatus:
      privateSerializationFinishedWorkIdentityStatus,
    consumesCommittedHostRootFinishedWorkIdentity: true,
    consumesCommittedHostRootFinishedWorkLanes: true,
    acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
    acceptedNativeExecutionOperations:
      privateToJSONNativeExecutionAcceptedOperations,
    privateNativeExecutionHostOutputRowEvidenceAvailable: true,
    privateNativeExecutionHostOutputShapes:
      privateToJSONNativeExecutionHostOutputShapes,
    privateNativeExecutionHostOutputRowIds:
      privateToJSONNativeExecutionHostOutputRowIds,
    nativeExecutionAcceptedRustApis:
      toJSONPrivateSerializationFacadeGate.nativeExecutionAcceptedRustApis,
    nativeExecutionAcceptedRustTests:
      toJSONPrivateSerializationFacadeGate.nativeExecutionAcceptedRustTests,
    nativeExecutionEvidenceWorker:
      toJSONPrivateSerializationFacadeGate.nativeExecutionEvidenceWorker,
    multiChildNativeExecutionEvidenceWorker:
      toJSONPrivateSerializationFacadeGate.multiChildNativeExecutionEvidenceWorker,
    mismatchedUpdateUnmountRecordRejection: true,
    mismatchedUpdateShapeRejection: true,
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false,
    canSerializeAcceptedHostOutputDiagnostic(report) {
      try {
        validatePrivateToJSONHostOutputDiagnostic(report);
        return true;
      } catch (_error) {
        return false;
      }
    },
    serializeAcceptedHostOutputDiagnostic(report) {
      return serializePrivateToJSONHostOutputDiagnostic(report);
    },
    canCreateAcceptedHostOutputDiagnosticResult(report) {
      try {
        createPrivateToJSONHostOutputDiagnosticResult(report);
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedHostOutputDiagnosticResult(report) {
      return createPrivateToJSONHostOutputDiagnosticResult(report);
    },
    canCreateAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      finishedWorkIdentityEvidence = undefined
    ) {
      try {
        createPrivateToJSONNativeExecutionDiagnosticResult(
          rootRequest,
          executionRecord,
          report,
          finishedWorkIdentityEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      finishedWorkIdentityEvidence = undefined
    ) {
      return createPrivateToJSONNativeExecutionDiagnosticResult(
        rootRequest,
        executionRecord,
        report,
        finishedWorkIdentityEvidence
      );
    },
    canValidateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest = undefined
    ) {
      try {
        createPrivateSerializationFinishedWorkIdentityGateResult(
          rootRequest,
          'create().toJSON',
          privateToJSONAcceptedDiagnosticName,
          evidence,
          report,
          sourceRootRequest
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    validateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest = undefined
    ) {
      return createPrivateSerializationFinishedWorkIdentityGateResult(
        rootRequest,
        'create().toJSON',
        privateToJSONAcceptedDiagnosticName,
        evidence,
        report,
        sourceRootRequest
      );
    }
  });
}

function createPrivateToTreeHostOutputMetadata(rootRequest) {
  return freezeRecord({
    id: 'react-test-renderer-totree-private-host-output-metadata',
    status: privateToTreeHostOutputMetadataStatus,
    entrypoint,
    publicSurface: 'create().toTree',
    symbol: privateToTreeHostOutputMetadataSymbol.description,
    gate: toTreePrivateHostOutputMetadataGate,
    rootRequest,
    privateHostOutputTreeMetadataAvailable: true,
    privateCompositeFunctionMetadataAvailable: true,
    privateMultiChildHostOutputTreeMetadataAvailable: true,
    publicTreeAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false,
    canDescribeAcceptedHostOutputDiagnostic(report) {
      try {
        validatePrivateToTreeHostOutputDiagnostic(report);
        return true;
      } catch (_error) {
        return false;
      }
    },
    describeAcceptedHostOutputDiagnostic(report) {
      return describePrivateToTreeHostOutputDiagnostic(report);
    }
  });
}

function createPrivateToTreeFacade(rootRequest) {
  return freezeRecord({
    id: 'react-test-renderer-totree-private-facade',
    status: privateToTreeFacadeStatus,
    entrypoint,
    publicSurface: 'create().toTree',
    symbol: privateToTreeFacadeSymbol.description,
    gate: toTreePrivateFacadeGate,
    metadataGate: toTreePrivateHostOutputMetadataGate,
    rootRequest,
    privateTreeMetadataSerializable: true,
    privateCompositeFunctionMetadataSerializable: true,
    privateMultiChildTreeMetadataSerializable: true,
    privateNativeExecutionEvidenceAvailable: true,
    privateNativeExecutionDiagnosticName:
      privateToTreeNativeExecutionDiagnosticName,
    privateNativeExecutionStatus: privateToTreeNativeExecutionStatus,
    privateFinishedWorkIdentityGateAvailable: true,
    privateUpdateFinishedWorkIdentityGateAvailable: true,
    validatesUpdateRootRequestIdentity: true,
    updateNativeExecutionFinishedWorkIdentityAdmissionWorker:
      toTreePrivateFacadeGate.updateNativeExecutionFinishedWorkIdentityAdmissionWorker,
    updateNativeExecutionRequiresFinishedWorkIdentity: true,
    rejectsStaleUpdateFinishedWorkIdentity: true,
    rejectsMultichildUpdateNativeExecutionIdentityAdmission: true,
    privateFinishedWorkIdentityDiagnosticName:
      privateSerializationFinishedWorkIdentityDiagnosticName,
    privateFinishedWorkIdentityStatus:
      privateSerializationFinishedWorkIdentityStatus,
    consumesCommittedHostRootFinishedWorkIdentity: true,
    consumesCommittedHostRootFinishedWorkLanes: true,
    privateNativeExecutionFunctionComponentShapeAvailable: true,
    nativeExecutionCompositeAcceptedFiberShape:
      privateToTreeCompositeAcceptedFiberShape,
    nativeExecutionCompositeWorker:
      'worker-698-test-renderer-totree-composite-native-execution',
    acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
    acceptedNativeExecutionOperations:
      privateToJSONNativeExecutionAcceptedOperations,
    publicTreeAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false,
    canSerializeAcceptedTreeMetadata(report) {
      try {
        validatePrivateToTreeHostOutputDiagnostic(report);
        return true;
      } catch (_error) {
        return false;
      }
    },
    serializeAcceptedTreeMetadata(report) {
      return serializePrivateToTreeMetadataDiagnostic(report);
    },
    canCreateAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      finishedWorkIdentityEvidence = undefined
    ) {
      try {
        createPrivateToTreeNativeExecutionDiagnosticResult(
          rootRequest,
          executionRecord,
          report,
          finishedWorkIdentityEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      finishedWorkIdentityEvidence = undefined
    ) {
      return createPrivateToTreeNativeExecutionDiagnosticResult(
        rootRequest,
        executionRecord,
        report,
        finishedWorkIdentityEvidence
      );
    },
    canValidateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest = undefined
    ) {
      try {
        createPrivateSerializationFinishedWorkIdentityGateResult(
          rootRequest,
          'create().toTree',
          privateToTreeAcceptedDiagnosticName,
          evidence,
          report,
          sourceRootRequest
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    validateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest = undefined
    ) {
      return createPrivateSerializationFinishedWorkIdentityGateResult(
        rootRequest,
        'create().toTree',
        privateToTreeAcceptedDiagnosticName,
        evidence,
        report,
        sourceRootRequest
      );
    }
  });
}

function createPrivateGetInstanceClassRootDiagnostics(rootRequest) {
  return freezeRecord({
    id: 'react-test-renderer-get-instance-private-class-root-diagnostics',
    status: privateGetInstanceDiagnosticsStatus,
    entrypoint,
    publicSurface: 'create().getInstance',
    symbol: privateGetInstanceDiagnosticsSymbol.description,
    gate: getInstancePrivateClassRootGate,
    rootRequest,
    privateClassRootDiagnosticsAvailable: true,
    publicGetInstanceAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false,
    canDescribeAcceptedClassRootDiagnostic(report) {
      try {
        validatePrivateGetInstanceClassRootDiagnostic(report);
        return true;
      } catch (_error) {
        return false;
      }
    },
    describeAcceptedClassRootDiagnostic(report) {
      return describePrivateGetInstanceClassRootDiagnostic(report);
    }
  });
}

function describePrivateToTreeHostOutputDiagnostic(report) {
  const diagnostic = validatePrivateToTreeHostOutputDiagnostic(report);

  if (diagnostic.kind === 'multi-child') {
    return describePrivateToTreeMultiChildHostOutputDiagnostic(diagnostic);
  }

  return freezeRecord({
    id: 'react-test-renderer-private-totree-minimal-host-output-metadata',
    status: privateToTreeHostOutputMetadataStatus,
    entrypoint,
    publicSurface: 'create().toTree',
    sourceDiagnostic: privateToTreeAcceptedDiagnosticName,
    acceptedMinimalFiberShape:
      toTreePrivateHostOutputMetadataGate.acceptedMinimalFiberShape,
    acceptedCompositeFiberShape:
      toTreePrivateHostOutputMetadataGate.acceptedCompositeFiberShape,
    traversal: freezeRecord({
      source: 'ReactTestRenderer.js toTree',
      order: freezeArray([
        'HostRoot',
        'FunctionComponent',
        'HostComponent',
        'HostText'
      ]),
      committedHostOutputOrder: freezeArray([
        'HostRoot',
        'HostComponent',
        'HostText'
      ]),
      hostRootDelegatesToChild: true,
      functionComponentProducesComponentNodeMetadata: true,
      functionComponentRendersCommittedHostOutput: true,
      hostComponentProducesHostNodeMetadata: true,
      hostTextProducesTextValueMetadata: true
    }),
    hostRoot: freezeRecord({
      fiberTag: 'HostRoot',
      source: 'ReactTestRenderer.js toTree HostRoot',
      delegatesToChild: true,
      childFiberTag: 'HostComponent',
      compositeChildFiberTag: 'FunctionComponent',
      publicTreeObject: false
    }),
    functionComponent: freezeRecord({
      fiberTag: 'FunctionComponent',
      source: 'ReactTestRenderer.js toTree FunctionComponent',
      treeNodeType: 'component',
      componentType: diagnostic.componentType,
      props: diagnostic.componentProps,
      instanceAvailable: false,
      renderedChildFiberTag: 'HostComponent',
      renderedChildNodeType: 'host',
      renderedChildCount: 1,
      wrapsCommittedHostOutput: true,
      publicTreeObject: false
    }),
    hostComponent: freezeRecord({
      fiberTag: 'HostComponent',
      source: 'ReactTestRenderer.js toTree HostComponent',
      treeNodeType: 'host',
      elementType: diagnostic.type,
      props: diagnostic.props,
      renderedChildCount: 1,
      renderedText: diagnostic.text,
      publicTreeObject: false
    }),
    hostText: freezeRecord({
      fiberTag: 'HostText',
      source: 'ReactTestRenderer.js toTree HostText',
      text: diagnostic.text,
      returnsTextValue: true,
      publicTreeObject: false
    }),
    committedFiberInspection: diagnostic.committedFiberInspection,
    publicTreeObjectAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function validatePrivateToTreeHostOutputDiagnostic(report, options = undefined) {
  try {
    const requireCompositeNativeExecutionShape =
      options !== undefined &&
      options !== null &&
      options.requireCompositeNativeExecutionShape === true;
    assertPrivateToJSONRecord(report, 'report');
    assertPrivateToJSONStringField(
      report,
      'diagnosticName',
      'diagnostic_name',
      privateToTreeAcceptedDiagnosticName
    );
    assertPrivateToJSONStringField(
      report,
      'sourceJsonDiagnosticName',
      'source_json_diagnostic_name',
      privateToJSONAcceptedDiagnosticName
    );
    const hostOutputUpdateKind = assertPrivateToJSONHostOutputUpdateKind(report);
    assertPrivateToJSONBooleanField(
      report,
      'hostOutputSnapshotCurrent',
      'host_output_snapshot_current',
      true
    );
    const rootChildCount = readPrivateToJSONNonNegativeIntegerField(
      report,
      'rootChildCount',
      'root_child_count'
    );
    assertPrivateToJSONGateIfPresent(readPrivateToJSONField(report, 'gate'));

    if (Array.isArray(readPrivateToJSONField(report, 'hostChildren', 'host_children'))) {
      return validatePrivateToTreeMultiChildHostOutputDiagnostic(
        report,
        rootChildCount,
        hostOutputUpdateKind
      );
    }

    if (rootChildCount !== 1) {
      throwPrivateToTreeMetadataError(
        'Expected private tree metadata rootChildCount to be 1.'
      );
    }
    const hostOutputRow = validatePrivateToJSONUpdateUnmountRowMetadata(
      report,
      hostOutputUpdateKind,
      rootChildCount
    );
    const hostOutputShape =
      hostOutputRow === null ? 'SingleHostText' : hostOutputRow.hostOutputShape;
    if (hostOutputShape !== 'SingleHostText') {
      throwPrivateToTreeMetadataError(
        'Expected private tree metadata to describe a minimal host text output shape.'
      );
    }

    assertPrivateToTreeAcceptedFiberShape(
      readPrivateToJSONArrayField(report, 'acceptedFiberShape', 'accepted_fiber_shape')
    );
    assertPrivateToTreeCompositeAcceptedFiberShape(
      readPrivateToJSONArrayField(
        report,
        'acceptedCompositeFiberShape',
        'accepted_composite_fiber_shape'
      )
    );

    const hostRoot = readPrivateToJSONRecordField(report, 'hostRoot', 'host_root');
    assertPrivateToJSONStringField(hostRoot, 'fiberTag', 'fiber_tag', 'HostRoot');
    assertPrivateToJSONBooleanField(
      hostRoot,
      'delegatesToChild',
      'delegates_to_child',
      true
    );
    assertPrivateToJSONStringField(
      hostRoot,
      'childFiberTag',
      'child_fiber_tag',
      'HostComponent'
    );
    assertPrivateToJSONBooleanField(
      hostRoot,
      'publicTreeObjectAvailable',
      'public_tree_object_available',
      false
    );

    const functionComponent = readPrivateToJSONRecordField(
      report,
      'functionComponent',
      'function_component'
    );
    assertPrivateToJSONStringField(
      functionComponent,
      'fiberTag',
      'fiber_tag',
      'FunctionComponent'
    );
    assertPrivateToJSONStringField(
      functionComponent,
      'nodeType',
      'node_type',
      'component'
    );
    assertPrivateToJSONStringField(
      functionComponent,
      'componentType',
      'component_type',
      privateToTreeFunctionComponentType
    );
    assertPrivateToJSONBooleanField(
      functionComponent,
      'instanceAvailable',
      'instance_available',
      false
    );
    assertPrivateToJSONStringField(
      functionComponent,
      'renderedChildFiberTag',
      'rendered_child_fiber_tag',
      'HostComponent'
    );
    assertPrivateToJSONStringField(
      functionComponent,
      'renderedChildNodeType',
      'rendered_child_node_type',
      'host'
    );
    assertPrivateToJSONNumberField(
      functionComponent,
      'renderedChildCount',
      'rendered_child_count',
      1
    );
    assertPrivateToJSONBooleanField(
      functionComponent,
      'wrapsCommittedHostOutput',
      'wraps_committed_host_output',
      true
    );
    assertPrivateToJSONBooleanField(
      functionComponent,
      'publicTreeObjectAvailable',
      'public_tree_object_available',
      false
    );

    const hostComponent = readPrivateToJSONRecordField(
      report,
      'hostComponent',
      'host_component'
    );
    assertPrivateToJSONStringField(
      hostComponent,
      'fiberTag',
      'fiber_tag',
      'HostComponent'
    );
    assertPrivateToJSONStringField(hostComponent, 'nodeType', 'node_type', 'host');
    assertPrivateToJSONBooleanField(
      hostComponent,
      'instanceAvailable',
      'instance_available',
      false
    );
    assertPrivateToJSONNumberField(
      hostComponent,
      'renderedChildCount',
      'rendered_child_count',
      1
    );
    assertPrivateToJSONBooleanField(
      hostComponent,
      'publicTreeObjectAvailable',
      'public_tree_object_available',
      false
    );

    const hostText = readPrivateToJSONRecordField(report, 'hostText', 'host_text');
    assertPrivateToJSONStringField(hostText, 'fiberTag', 'fiber_tag', 'HostText');
    assertPrivateToJSONBooleanField(
      hostText,
      'returnsTextValue',
      'returns_text_value',
      true
    );
    assertPrivateToJSONBooleanField(
      hostText,
      'publicTreeObjectAvailable',
      'public_tree_object_available',
      false
    );

    const type = normalizePrivateToJSONElementType(
      readPrivateToJSONField(hostComponent, 'elementType', 'element_type')
    );
    const componentProps = normalizePrivateToJSONEmptyProps(
      readPrivateToJSONField(functionComponent, 'props')
    );
    const props = normalizePrivateToJSONEmptyProps(
      readPrivateToJSONField(hostComponent, 'props')
    );
    const renderedText = readPrivateToJSONStringField(
      hostComponent,
      'renderedText',
      'rendered_text'
    );
    const text = readPrivateToJSONStringField(hostText, 'text');
    if (renderedText !== text) {
      throwPrivateToTreeMetadataError(
        'Private tree metadata host component rendered text does not match HostText text.'
      );
    }
    assertPrivateToJSONPublicBlockers(
      readPrivateToJSONRecordField(report, 'publicBlockers', 'public_blockers')
    );
    assertPrivateToJSONBooleanField(
      report,
      'publicTreeObjectAvailable',
      'public_tree_object_available',
      false
    );
    const committedFiberInspection =
      validatePrivateToTreeCommittedFiberInspectionDiagnostic(report, {
        expectedFiberShape: requireCompositeNativeExecutionShape
          ? privateToTreeCompositeAcceptedFiberShape
          : privateToTreeAcceptedFiberShape,
        expectedRootChildFiberTags: requireCompositeNativeExecutionShape
          ? ['FunctionComponent']
          : ['HostComponent'],
        expectedHostChildFiberTags: ['HostComponent'],
        expectedRootChildCount: 1,
        expectedHostChildCount: 1,
        expectedHostTextCount: 1,
        expectedFunctionComponentPresent: requireCompositeNativeExecutionShape,
        expectedWrapsCommittedHostOutput: requireCompositeNativeExecutionShape
      });

    return {
      kind: 'minimal',
      hostOutputUpdateKind,
      hostOutputShape,
      hostOutputRow,
      rootChildCount,
      sourceFiberCount: requireCompositeNativeExecutionShape
        ? privateToTreeCompositeAcceptedFiberShape.length
        : privateToTreeAcceptedFiberShape.length,
      functionComponentAboveHostOutputShape:
        requireCompositeNativeExecutionShape,
      committedFiberInspection,
      componentProps,
      componentType: readPrivateToJSONStringField(
        functionComponent,
        'componentType',
        'component_type'
      ),
      props,
      text,
      type
    };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      error.code === 'FAST_REACT_TEST_RENDERER_PRIVATE_TOTREE_METADATA'
    ) {
      throw error;
    }
    const message =
      error instanceof Error && typeof error.message === 'string'
        ? error.message
        : 'The accepted private host output diagnostic shape was rejected.';
    const marker = ' private facade ';
    const markerIndex = message.indexOf(marker);
    throwPrivateToTreeMetadataError(
      markerIndex === -1
        ? message
        : message.slice(markerIndex + marker.length)
    );
  }
}

function describePrivateToTreeMultiChildHostOutputDiagnostic(diagnostic) {
  const record = {
    id: diagnostic.componentWrapped
      ? 'react-test-renderer-private-totree-composite-multi-child-host-output-metadata'
      : 'react-test-renderer-private-totree-multi-child-host-output-metadata',
    status: privateToTreeHostOutputMetadataStatus,
    entrypoint,
    publicSurface: 'create().toTree',
    sourceDiagnostic: privateToTreeAcceptedDiagnosticName,
    acceptedMinimalFiberShape:
      toTreePrivateHostOutputMetadataGate.acceptedMinimalFiberShape,
    acceptedCompositeFiberShape:
      toTreePrivateHostOutputMetadataGate.acceptedCompositeFiberShape,
    acceptedMultiChildFiberShape:
      toTreePrivateHostOutputMetadataGate.acceptedMultiChildFiberShape,
    acceptedCompositeMultiChildFiberShape:
      toTreePrivateHostOutputMetadataGate.acceptedCompositeMultiChildFiberShape,
    traversal: freezeRecord({
      source: 'ReactTestRenderer.js toTree childrenToTree',
      order: diagnostic.componentWrapped
        ? privateToTreeCompositeMultiChildAcceptedFiberShape
        : privateToTreeMultiChildAcceptedFiberShape,
      committedHostOutputOrder: privateToTreeMultiChildAcceptedFiberShape,
      hostRootDelegatesToChild: true,
      hostRootReturnsArrayForMultipleChildren: !diagnostic.componentWrapped,
      functionComponentProducesComponentNodeMetadata:
        diagnostic.componentWrapped,
      functionComponentRendersCommittedHostOutput: diagnostic.componentWrapped,
      hostComponentProducesHostNodeMetadata: true,
      hostTextProducesTextValueMetadata: true,
      textSiblingProducesTextValueMetadata: true
    }),
    hostRoot: freezeRecord({
      fiberTag: 'HostRoot',
      source: 'ReactTestRenderer.js toTree HostRoot childrenToTree',
      delegatesToChild: true,
      childFiberTags: freezeArray(privateToTreeMultiChildAcceptedFiberShape.slice(1)),
      rootChildCount: diagnostic.rootChildCount,
      returnsArrayForMultipleChildren: !diagnostic.componentWrapped,
      compositeChildFiberTag: diagnostic.componentWrapped
        ? 'FunctionComponent'
        : null,
      publicTreeObject: false
    }),
    hostChildren: diagnostic.hostChildren,
    committedFiberInspection: diagnostic.committedFiberInspection,
    publicTreeObjectAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  };

  if (diagnostic.componentWrapped) {
    record.functionComponent = freezeRecord({
      fiberTag: 'FunctionComponent',
      source: 'ReactTestRenderer.js toTree FunctionComponent',
      treeNodeType: 'component',
      componentType: diagnostic.componentType,
      props: diagnostic.componentProps,
      instanceAvailable: false,
      renderedChildFiberTags: freezeArray(
        privateToTreeMultiChildAcceptedFiberShape.slice(1)
      ),
      renderedChildNodeTypes: freezeArray(['text', 'host']),
      renderedChildCount: diagnostic.rootChildCount,
      wrapsCommittedHostOutput: true,
      publicTreeObject: false
    });
  }

  return freezeRecord(record);
}

function validatePrivateToTreeMultiChildHostOutputDiagnostic(
  report,
  rootChildCount,
  hostOutputUpdateKind
) {
  assertPrivateToTreeMultiChildAcceptedFiberShape(
    readPrivateToJSONArrayField(report, 'acceptedFiberShape', 'accepted_fiber_shape')
  );
  const acceptedMultiChildFiberShape = readPrivateToJSONField(
    report,
    'acceptedMultiChildFiberShape',
    'accepted_multi_child_fiber_shape'
  );
  if (acceptedMultiChildFiberShape !== undefined) {
    assertPrivateToTreeMultiChildAcceptedFiberShape(acceptedMultiChildFiberShape);
  }
  const acceptedCompositeMultiChildFiberShape = readPrivateToJSONField(
    report,
    'acceptedCompositeMultiChildFiberShape',
    'accepted_composite_multi_child_fiber_shape'
  );
  if (acceptedCompositeMultiChildFiberShape !== undefined) {
    assertPrivateToTreeCompositeMultiChildAcceptedFiberShape(
      acceptedCompositeMultiChildFiberShape
    );
  }
  if (rootChildCount !== 2) {
    throwPrivateToTreeMetadataError(
      'Expected private multi-child tree metadata rootChildCount to be 2.'
    );
  }

  const hostRoot = readPrivateToJSONRecordField(report, 'hostRoot', 'host_root');
  assertPrivateToJSONStringField(hostRoot, 'fiberTag', 'fiber_tag', 'HostRoot');
  assertPrivateToJSONBooleanField(
    hostRoot,
    'delegatesToChild',
    'delegates_to_child',
    true
  );
  assertPrivateToTreeStringArrayField(
    hostRoot,
    'childFiberTags',
    'child_fiber_tags',
    ['HostText', 'HostComponent']
  );
  assertPrivateToJSONBooleanField(
    hostRoot,
    'publicTreeObjectAvailable',
    'public_tree_object_available',
    false
  );

  const hostChildren = readPrivateToJSONArrayField(
    report,
    'hostChildren',
    'host_children'
  );
  if (hostChildren.length !== rootChildCount) {
    throwPrivateToTreeMetadataError(
      'Expected private multi-child tree metadata hostChildren length to match rootChildCount.'
    );
  }

  const firstText = validatePrivateToTreeTextChild(hostChildren[0], 'hostChildren[0]');
  const hostComponent = validatePrivateToTreeHostComponentChild(
    hostChildren[1],
    'hostChildren[1]'
  );
  const renderedChildren = freezeArray([firstText.text, hostComponent.tree]);
  const functionComponent = readPrivateToJSONField(
    report,
    'functionComponent',
    'function_component'
  );
  let componentWrapped = false;
  let componentType = null;
  let componentProps = null;

  if (functionComponent !== undefined) {
    assertPrivateToJSONRecord(functionComponent, 'functionComponent');
    assertPrivateToJSONStringField(
      functionComponent,
      'fiberTag',
      'fiber_tag',
      'FunctionComponent'
    );
    assertPrivateToJSONStringField(
      functionComponent,
      'nodeType',
      'node_type',
      'component'
    );
    componentType = readPrivateToJSONStringField(
      functionComponent,
      'componentType',
      'component_type'
    );
    if (componentType !== privateToTreeFunctionComponentType) {
      throwPrivateToTreeMetadataError(
        `Expected private multi-child FunctionComponent type to be ${privateToTreeFunctionComponentType}.`
      );
    }
    componentProps = normalizePrivateToJSONEmptyProps(
      readPrivateToJSONField(functionComponent, 'props')
    );
    assertPrivateToJSONBooleanField(
      functionComponent,
      'instanceAvailable',
      'instance_available',
      false
    );
    assertPrivateToTreeStringArrayField(
      functionComponent,
      'renderedChildFiberTags',
      'rendered_child_fiber_tags',
      ['HostText', 'HostComponent']
    );
    assertPrivateToJSONNumberField(
      functionComponent,
      'renderedChildCount',
      'rendered_child_count',
      rootChildCount
    );
    assertPrivateToJSONBooleanField(
      functionComponent,
      'wrapsCommittedHostOutput',
      'wraps_committed_host_output',
      true
    );
    assertPrivateToJSONBooleanField(
      functionComponent,
      'publicTreeObjectAvailable',
      'public_tree_object_available',
      false
    );
    componentWrapped = true;
  }

  assertPrivateToJSONPublicBlockers(
    readPrivateToJSONRecordField(report, 'publicBlockers', 'public_blockers')
  );
  assertPrivateToJSONBooleanField(
    report,
    'publicTreeObjectAvailable',
    'public_tree_object_available',
    false
  );
  const committedFiberInspection =
    validatePrivateToTreeCommittedFiberInspectionDiagnostic(report, {
      expectedFiberShape: componentWrapped
        ? privateToTreeCompositeMultiChildAcceptedFiberShape
        : privateToTreeMultiChildAcceptedFiberShape,
      expectedRootChildFiberTags: componentWrapped
        ? ['FunctionComponent']
        : ['HostText', 'HostComponent'],
      expectedHostChildFiberTags: ['HostText', 'HostComponent'],
      expectedRootChildCount: componentWrapped ? 1 : rootChildCount,
      expectedHostChildCount: rootChildCount,
      expectedHostTextCount: 2,
      expectedFunctionComponentPresent: componentWrapped,
      expectedWrapsCommittedHostOutput: componentWrapped
    });

  return {
    kind: 'multi-child',
    hostOutputUpdateKind,
    rootChildCount,
    componentWrapped,
    committedFiberInspection,
    componentProps,
    componentType,
    hostChildren: freezeArray([firstText.metadata, hostComponent.metadata]),
    renderedChildren
  };
}

function validatePrivateToTreeCommittedFiberInspectionDiagnostic(
  report,
  {
    expectedFiberShape,
    expectedRootChildFiberTags,
    expectedHostChildFiberTags,
    expectedRootChildCount,
    expectedHostChildCount,
    expectedHostTextCount,
    expectedFunctionComponentPresent,
    expectedWrapsCommittedHostOutput
  }
) {
  const record = readPrivateToJSONRecordField(
    report,
    'committedFiberInspection',
    'committed_fiber_inspection'
  );
  assertPrivateToJSONStringField(
    record,
    'diagnosticName',
    'diagnostic_name',
    privateToTreeCommittedFiberInspectionDiagnosticName
  );
  assertPrivateToJSONStringField(
    record,
    'sourceTreeDiagnosticName',
    'source_tree_diagnostic_name',
    privateToTreeAcceptedDiagnosticName
  );
  assertPrivateToTreeStringArrayField(
    record,
    'fiberShape',
    'fiber_shape',
    expectedFiberShape
  );
  assertPrivateToTreeStringArrayField(
    record,
    'rootChildFiberTags',
    'root_child_fiber_tags',
    expectedRootChildFiberTags
  );
  assertPrivateToTreeStringArrayField(
    record,
    'hostChildFiberTags',
    'host_child_fiber_tags',
    expectedHostChildFiberTags
  );
  assertPrivateToJSONNumberField(
    record,
    'rootChildCount',
    'root_child_count',
    expectedRootChildCount
  );
  assertPrivateToJSONNumberField(
    record,
    'hostChildCount',
    'host_child_count',
    expectedHostChildCount
  );
  assertPrivateToJSONNumberField(
    record,
    'hostComponentCount',
    'host_component_count',
    1
  );
  assertPrivateToJSONNumberField(
    record,
    'hostTextCount',
    'host_text_count',
    expectedHostTextCount
  );
  assertPrivateToJSONBooleanField(
    record,
    'functionComponentPresent',
    'function_component_present',
    expectedFunctionComponentPresent
  );
  const functionTag = readPrivateToJSONField(
    record,
    'functionComponentFiberTag',
    'function_component_fiber_tag'
  );
  if (expectedFunctionComponentPresent) {
    if (functionTag !== 'FunctionComponent') {
      throwPrivateToTreeMetadataError(
        'Expected committed-fiber inspection to record a FunctionComponent wrapper.'
      );
    }
  } else if (functionTag !== undefined && functionTag !== null) {
    throwPrivateToTreeMetadataError(
      'Expected committed-fiber inspection to omit FunctionComponent metadata.'
    );
  }
  assertPrivateToJSONBooleanField(
    record,
    'wrapsCommittedHostOutput',
    'wraps_committed_host_output',
    expectedWrapsCommittedHostOutput
  );
  assertPrivateToJSONBooleanField(
    record,
    'publicTreeObjectAvailable',
    'public_tree_object_available',
    false
  );
  assertPrivateToJSONBooleanField(
    record,
    'compatibilityClaimed',
    'compatibility_claimed',
    false
  );

  return freezeRecord({
    diagnosticName: privateToTreeCommittedFiberInspectionDiagnosticName,
    sourceTreeDiagnosticName: privateToTreeAcceptedDiagnosticName,
    fiberShape: freezeArray(expectedFiberShape),
    rootChildFiberTags: freezeArray(expectedRootChildFiberTags),
    hostChildFiberTags: freezeArray(expectedHostChildFiberTags),
    rootChildCount: expectedRootChildCount,
    hostChildCount: expectedHostChildCount,
    hostComponentCount: 1,
    hostTextCount: expectedHostTextCount,
    functionComponentFiberTag: expectedFunctionComponentPresent
      ? 'FunctionComponent'
      : null,
    functionComponentPresent: expectedFunctionComponentPresent,
    wrapsCommittedHostOutput: expectedWrapsCommittedHostOutput,
    publicTreeObjectAvailable: false,
    compatibilityClaimed: false
  });
}

function validatePrivateToTreeTextChild(record, label) {
  assertPrivateToJSONRecord(record, label);
  assertPrivateToJSONStringField(record, 'fiberTag', 'fiber_tag', 'HostText');
  const text = readPrivateToJSONStringField(record, 'text');
  assertPrivateToJSONBooleanField(
    record,
    'returnsTextValue',
    'returns_text_value',
    true
  );
  assertPrivateToJSONBooleanField(
    record,
    'publicTreeObjectAvailable',
    'public_tree_object_available',
    false
  );

  return {
    text,
    metadata: freezeRecord({
      fiberTag: 'HostText',
      source: 'ReactTestRenderer.js toTree HostText',
      text,
      returnsTextValue: true,
      publicTreeObject: false
    })
  };
}

function validatePrivateToTreeHostComponentChild(record, label) {
  assertPrivateToJSONRecord(record, label);
  assertPrivateToJSONStringField(record, 'fiberTag', 'fiber_tag', 'HostComponent');
  assertPrivateToJSONStringField(record, 'nodeType', 'node_type', 'host');
  const type = normalizePrivateToJSONElementType(
    readPrivateToJSONField(record, 'elementType', 'element_type')
  );
  const props = normalizePrivateToJSONProps(readPrivateToJSONField(record, 'props'));
  assertPrivateToJSONBooleanField(
    record,
    'instanceAvailable',
    'instance_available',
    false
  );
  assertPrivateToJSONNumberField(
    record,
    'renderedChildCount',
    'rendered_child_count',
    1
  );
  assertPrivateToJSONBooleanField(
    record,
    'publicTreeObjectAvailable',
    'public_tree_object_available',
    false
  );
  const renderedChildren = readPrivateToJSONArrayField(
    record,
    'renderedChildren',
    'rendered_children'
  );
  if (renderedChildren.length !== 1) {
    throwPrivateToTreeMetadataError(
      'Expected private multi-child host component to have one rendered text child.'
    );
  }
  const textChild = validatePrivateToTreeTextChild(
    renderedChildren[0],
    `${label}.renderedChildren[0]`
  );
  const tree = freezeRecord({
    nodeType: 'host',
    type,
    props,
    instance: null,
    rendered: freezeArray([textChild.text])
  });

  return {
    tree,
    metadata: freezeRecord({
      fiberTag: 'HostComponent',
      source: 'ReactTestRenderer.js toTree HostComponent',
      treeNodeType: 'host',
      elementType: type,
      props,
      instanceAvailable: false,
      renderedChildCount: 1,
      renderedChildren: freezeArray([textChild.metadata]),
      publicTreeObject: false
    })
  };
}

function assertPrivateToTreeAcceptedFiberShape(shape) {
  if (
    shape.length !== privateToTreeAcceptedFiberShape.length ||
    shape.some((tag, index) => tag !== privateToTreeAcceptedFiberShape[index])
  ) {
    throwPrivateToTreeMetadataError(
      'Expected private tree metadata acceptedFiberShape to be HostRoot, HostComponent, HostText.'
    );
  }
}

function assertPrivateToTreeMultiChildAcceptedFiberShape(shape) {
  if (
    !Array.isArray(shape) ||
    shape.length !== privateToTreeMultiChildAcceptedFiberShape.length ||
    shape.some(
      (tag, index) => tag !== privateToTreeMultiChildAcceptedFiberShape[index]
    )
  ) {
    throwPrivateToTreeMetadataError(
      'Expected private tree metadata accepted multi-child fiber shape to be HostRoot, HostText, HostComponent, HostText.'
    );
  }
}

function assertPrivateToTreeCompositeAcceptedFiberShape(shape) {
  if (
    shape.length !== privateToTreeCompositeAcceptedFiberShape.length ||
    shape.some(
      (tag, index) => tag !== privateToTreeCompositeAcceptedFiberShape[index]
    )
  ) {
    throwPrivateToTreeMetadataError(
      'Expected private tree metadata acceptedCompositeFiberShape to be HostRoot, FunctionComponent, HostComponent, HostText.'
    );
  }
}

function assertPrivateToTreeCompositeMultiChildAcceptedFiberShape(shape) {
  if (
    !Array.isArray(shape) ||
    shape.length !== privateToTreeCompositeMultiChildAcceptedFiberShape.length ||
    shape.some(
      (tag, index) =>
        tag !== privateToTreeCompositeMultiChildAcceptedFiberShape[index]
    )
  ) {
    throwPrivateToTreeMetadataError(
      'Expected private tree metadata accepted composite multi-child fiber shape to be HostRoot, FunctionComponent, HostText, HostComponent, HostText.'
    );
  }
}

function assertPrivateToTreeStringArrayField(record, camelName, snakeName, expected) {
  const actual = readPrivateToJSONArrayField(record, camelName, snakeName);
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throwPrivateToTreeMetadataError(
      `Expected private tree metadata ${camelName} to be ${expected.join(', ')}.`
    );
  }
}

function serializePrivateToTreeMetadataDiagnostic(report) {
  const diagnostic = validatePrivateToTreeHostOutputDiagnostic(report);

  if (diagnostic.kind === 'multi-child') {
    if (diagnostic.componentWrapped) {
      return freezeRecord({
        nodeType: 'component',
        type: diagnostic.componentType,
        props: diagnostic.componentProps,
        instance: null,
        rendered: diagnostic.renderedChildren
      });
    }

    return diagnostic.renderedChildren;
  }

  const renderedHostTree = freezeRecord({
    nodeType: 'host',
    type: diagnostic.type,
    props: diagnostic.props,
    instance: null,
    rendered: freezeArray([diagnostic.text])
  });

  return freezeRecord({
    nodeType: 'component',
    type: diagnostic.componentType,
    props: diagnostic.componentProps,
    instance: null,
    rendered: renderedHostTree
  });
}

function createPrivateToTreeNativeExecutionDiagnosticResult(
  rootRequest,
  executionRecord,
  report,
  finishedWorkIdentityEvidence = undefined
) {
  const execution = consumeAcceptedToTreeNativeExecutionRecord(
    rootRequest,
    executionRecord
  );
  const finishedWorkIdentity =
    execution.operation === 'create' || execution.operation === 'update'
      ? createPrivateSerializationFinishedWorkIdentityGateResult(
          rootRequest,
          'create().toTree',
          privateToTreeAcceptedDiagnosticName,
          finishedWorkIdentityEvidence,
          report,
          execution.request
        )
      : null;
  const diagnostic = validatePrivateToTreeNativeExecutionDiagnostic(report);
  const expectedHostOutputUpdateKind =
    hostOutputUpdateKindForRootExecutionOperation(execution.operation);

  if (diagnostic.hostOutputUpdateKind !== expectedHostOutputUpdateKind) {
    throwPrivateToTreeMetadataError(
      `Expected private native ${execution.operation} execution to consume ${expectedHostOutputUpdateKind} toTree evidence.`
    );
  }
  if (!isMinimalToTreeNativeExecutionShape(diagnostic)) {
    throwPrivateToTreeMetadataError(
      'Expected private native execution toTree evidence to describe the minimal host tree.'
    );
  }

  return freezeRecord({
    id: 'react-test-renderer-private-totree-after-native-execution-result',
    diagnosticName: privateToTreeNativeExecutionDiagnosticName,
    status: privateToTreeNativeExecutionStatus,
    entrypoint,
    publicSurface: 'create().toTree',
    sourceDiagnostic: privateToTreeAcceptedDiagnosticName,
    acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
    rootRequest,
    rootExecutionResult: execution,
    operation: execution.operation,
    requestId: execution.requestId,
    requestSequence: execution.requestSequence,
    rootId: execution.request.rootId,
    hostOutputUpdateKind: diagnostic.hostOutputUpdateKind,
    hostOutputShape: diagnostic.hostOutputShape,
    hostOutputRowId:
      diagnostic.hostOutputRow === null ? null : diagnostic.hostOutputRow.id,
    hostOutputRow: diagnostic.hostOutputRow,
    hostOutputSnapshotCurrent: true,
    sourceFiberCount: diagnostic.sourceFiberCount,
    rootChildCount: diagnostic.rootChildCount,
    result: diagnostic.result,
    finishedWorkIdentity,
    consumesAcceptedNativeExecutionRecord: true,
    consumesAcceptedNativeCreateExecutionRecord:
      execution.operation === 'create',
    consumesAcceptedNativeUpdateExecutionRecord:
      execution.operation === 'update',
    consumesAcceptedNativeUnmountExecutionRecord:
      execution.operation === 'unmount',
    consumesAcceptedFinishedWorkIdentityGate:
      finishedWorkIdentity !== null,
    consumesAcceptedRustLifecycleDiagnostic: true,
    consumesPrivateToTreeEvidence: true,
    consumesAcceptedHostOutputRow: diagnostic.hostOutputRow !== null,
    minimalTreeShape: true,
    functionComponentAboveHostOutputShape:
      diagnostic.functionComponentAboveHostOutputShape,
    publicTreeAvailable: false,
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function consumeAcceptedToTreeNativeExecutionRecord(
  rootRequest,
  executionRecord
) {
  try {
    return consumeAcceptedToJSONNativeExecutionRecordImpl(
      rootRequest,
      executionRecord
    );
  } catch (error) {
    const message =
      error instanceof Error && typeof error.message === 'string'
        ? error.message.replaceAll('toJSON', 'toTree')
        : 'Expected accepted private native root execution evidence.';
    throwPrivateToTreeMetadataError(message);
  }
}

function validatePrivateToTreeNativeExecutionDiagnostic(report) {
  const hostOutputUpdateKind = readPrivateToJSONStringField(
    report,
    'hostOutputUpdateKind',
    'host_output_update_kind'
  );

  if (hostOutputUpdateKind === 'Unmount') {
    return validatePrivateToTreeUnmountNativeExecutionDiagnostic(report);
  }

  const diagnostic = validatePrivateToTreeHostOutputDiagnostic(report, {
    requireCompositeNativeExecutionShape: true
  });
  if (diagnostic.kind !== 'minimal') {
    throwPrivateToTreeMetadataError(
      'Expected private native toTree evidence to use the minimal tree diagnostic.'
    );
  }

  return {
    hostOutputUpdateKind: diagnostic.hostOutputUpdateKind,
    hostOutputShape: diagnostic.hostOutputShape,
    hostOutputRow: diagnostic.hostOutputRow,
    rootChildCount: diagnostic.rootChildCount,
    sourceFiberCount: diagnostic.sourceFiberCount,
    functionComponentAboveHostOutputShape:
      diagnostic.functionComponentAboveHostOutputShape,
    result: freezeRecord({
      nodeType: 'component',
      type: diagnostic.componentType,
      props: diagnostic.componentProps,
      instance: null,
      rendered: freezeRecord({
        nodeType: 'host',
        type: diagnostic.type,
        props: diagnostic.props,
        instance: null,
        rendered: freezeArray([diagnostic.text])
      })
    })
  };
}

function validatePrivateToTreeUnmountNativeExecutionDiagnostic(report) {
  assertPrivateToJSONRecord(report, 'report');
  assertPrivateToJSONStringField(
    report,
    'diagnosticName',
    'diagnostic_name',
    privateToTreeAcceptedDiagnosticName
  );
  assertPrivateToJSONStringField(
    report,
    'sourceJsonDiagnosticName',
    'source_json_diagnostic_name',
    privateToJSONAcceptedDiagnosticName
  );
  assertPrivateToJSONBooleanField(
    report,
    'hostOutputSnapshotCurrent',
    'host_output_snapshot_current',
    true
  );
  const rootChildCount = readPrivateToJSONNonNegativeIntegerField(
    report,
    'rootChildCount',
    'root_child_count'
  );
  if (rootChildCount !== 0) {
    throwPrivateToTreeMetadataError(
      'Expected private unmount toTree native evidence rootChildCount to be 0.'
    );
  }
  const hostOutputRow = validatePrivateToJSONUpdateUnmountRowMetadata(
    report,
    'Unmount',
    rootChildCount
  );
  if (
    hostOutputRow === null ||
    hostOutputRow.hostOutputShape !== 'EmptyRoot'
  ) {
    throwPrivateToTreeMetadataError(
      'Expected private unmount toTree native evidence to consume an empty-root host output row.'
    );
  }
  assertPrivateToJSONPublicBlockers(
    readPrivateToJSONRecordField(report, 'publicBlockers', 'public_blockers')
  );
  assertPrivateToJSONBooleanField(
    report,
    'publicTreeObjectAvailable',
    'public_tree_object_available',
    false
  );

  return {
    hostOutputUpdateKind: 'Unmount',
    hostOutputShape: 'EmptyRoot',
    hostOutputRow,
    rootChildCount,
    sourceFiberCount: 0,
    functionComponentAboveHostOutputShape: false,
    result: null
  };
}

function isMinimalToTreeNativeExecutionShape(diagnostic) {
  if (diagnostic.hostOutputUpdateKind === 'Unmount') {
    return (
      diagnostic.hostOutputShape === 'EmptyRoot' &&
      diagnostic.rootChildCount === 0 &&
      diagnostic.sourceFiberCount === 0 &&
      diagnostic.result === null
    );
  }
  const result = diagnostic.result;
  return (
    diagnostic.hostOutputShape === 'SingleHostText' &&
    diagnostic.rootChildCount === 1 &&
    diagnostic.sourceFiberCount ===
      privateToTreeCompositeAcceptedFiberShape.length &&
    diagnostic.functionComponentAboveHostOutputShape === true &&
    result !== null &&
    typeof result === 'object' &&
    result.nodeType === 'component' &&
    result.type === privateToTreeFunctionComponentType &&
    result.instance === null &&
    result.rendered !== null &&
    typeof result.rendered === 'object' &&
    result.rendered.nodeType === 'host' &&
    Array.isArray(result.rendered.rendered) &&
    result.rendered.rendered.length === 1 &&
    typeof result.rendered.rendered[0] === 'string'
  );
}

function describePrivateGetInstanceClassRootDiagnostic(report) {
  const diagnostic = validatePrivateGetInstanceClassRootDiagnostic(report);

  return freezeRecord({
    id: 'react-test-renderer-private-get-instance-class-root-diagnostic',
    status: privateGetInstanceDiagnosticsStatus,
    entrypoint,
    publicSurface: 'create().getInstance',
    sourceDiagnostic: privateGetInstanceAcceptedDiagnosticName,
    acceptedClassRootFiberShape:
      getInstancePrivateClassRootGate.acceptedClassRootFiberShape,
    traversal: freezeRecord({
      source: 'ReactFiberReconciler.getPublicRootInstance',
      order: privateGetInstanceAcceptedClassFiberShape,
      classComponentReturnsStateNode: true,
      functionComponentFailClosed: true,
      hostComponentFailClosed: true
    }),
    hostRootFailClosed: freezeRecord({
      rootFiberShape: privateGetInstanceHostRootFiberShape,
      rootChildFiberTag: 'HostComponent',
      reactPublicResult: diagnostic.hostRootReactPublicResult,
      publicGetInstanceAvailable: false,
      privateClassInstanceAvailable: false,
      publicBehaviorFailClosed: true
    }),
    functionRootFailClosed: freezeRecord({
      rootFiberShape: privateGetInstanceFunctionRootFiberShape,
      rootChildFiberTag: 'FunctionComponent',
      reactPublicResult: diagnostic.functionRootReactPublicResult,
      publicGetInstanceAvailable: false,
      privateClassInstanceAvailable: false,
      publicBehaviorFailClosed: true
    }),
    classComponent: freezeRecord({
      fiberTag: 'ClassComponent',
      componentType: diagnostic.componentType,
      props: diagnostic.props,
      stateNodeAvailable: true,
      renderedChildFiberTag: 'HostComponent',
      renderedChildCount: 1,
      publicGetInstanceAvailable: false,
      privateClassInstanceDiagnosticAvailable: true
    }),
    instance: freezeRecord({
      constructorName: diagnostic.constructorName,
      props: diagnostic.instanceProps,
      state: diagnostic.state,
      reactPublicResult: diagnostic.instanceReactPublicResult,
      publicGetInstanceAvailable: false,
      privateInstanceAvailable: true
    }),
    renderedHostComponent: freezeRecord({
      fiberTag: 'HostComponent',
      treeNodeType: 'host',
      elementType: diagnostic.type,
      props: diagnostic.hostProps,
      renderedChildCount: 1,
      renderedText: diagnostic.text,
      publicGetInstanceAvailable: false
    }),
    renderedHostText: freezeRecord({
      fiberTag: 'HostText',
      text: diagnostic.text
    }),
    publicGetInstanceAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function validatePrivateGetInstanceClassRootDiagnostic(report) {
  try {
    assertPrivateGetInstanceRecord(report, 'report');
    assertPrivateGetInstanceStringField(
      report,
      'diagnosticName',
      'diagnostic_name',
      privateGetInstanceAcceptedDiagnosticName
    );
    assertPrivateGetInstanceStringField(
      report,
      'sourceTreeDiagnosticName',
      'source_tree_diagnostic_name',
      privateToTreeAcceptedDiagnosticName
    );
    const updateKind = readPrivateGetInstanceStringField(
      report,
      'hostOutputUpdateKind',
      'host_output_update_kind'
    );
    if (updateKind !== 'Create' && updateKind !== 'Update') {
      throwPrivateGetInstanceDiagnosticsError(
        'Expected private getInstance diagnostic host output update kind to be Create or Update.'
      );
    }
    assertPrivateGetInstanceBooleanField(
      report,
      'hostOutputSnapshotCurrent',
      'host_output_snapshot_current',
      true
    );
    assertPrivateGetInstanceAcceptedClassFiberShape(
      readPrivateGetInstanceArrayField(
        report,
        'acceptedClassFiberShape',
        'accepted_class_fiber_shape'
      )
    );
    assertPrivateGetInstanceGateIfPresent(
      readPrivateToJSONField(report, 'gate')
    );

    const hostRootFailClosed = readPrivateGetInstanceRecordField(
      report,
      'hostRootFailClosed',
      'host_root_fail_closed'
    );
    assertPrivateGetInstanceRootShape(
      hostRootFailClosed,
      privateGetInstanceHostRootFiberShape,
      'HostComponent',
      'null-with-default-createNodeMock'
    );

    const functionRootFailClosed = readPrivateGetInstanceRecordField(
      report,
      'functionRootFailClosed',
      'function_root_fail_closed'
    );
    assertPrivateGetInstanceRootShape(
      functionRootFailClosed,
      privateGetInstanceFunctionRootFiberShape,
      'FunctionComponent',
      'null'
    );

    const classComponent = readPrivateGetInstanceRecordField(
      report,
      'classComponent',
      'class_component'
    );
    assertPrivateGetInstanceStringField(
      classComponent,
      'fiberTag',
      'fiber_tag',
      'ClassComponent'
    );
    assertPrivateGetInstanceStringField(
      classComponent,
      'componentType',
      'component_type',
      privateGetInstanceClassComponentType
    );
    assertPrivateGetInstanceBooleanField(
      classComponent,
      'stateNodeAvailable',
      'state_node_available',
      true
    );
    assertPrivateGetInstanceStringField(
      classComponent,
      'renderedChildFiberTag',
      'rendered_child_fiber_tag',
      'HostComponent'
    );
    assertPrivateGetInstanceNumberField(
      classComponent,
      'renderedChildCount',
      'rendered_child_count',
      1
    );
    assertPrivateGetInstanceBooleanField(
      classComponent,
      'publicGetInstanceAvailable',
      'public_get_instance_available',
      false
    );
    const props = normalizePrivateGetInstanceProps(
      readPrivateToJSONField(classComponent, 'props')
    );

    const instance = readPrivateGetInstanceRecordField(
      classComponent,
      'instance'
    );
    assertPrivateGetInstanceStringField(
      instance,
      'constructorName',
      'constructor_name',
      privateGetInstanceClassConstructorName
    );
    assertPrivateGetInstanceBooleanField(
      instance,
      'privateInstanceAvailable',
      'private_instance_available',
      true
    );
    assertPrivateGetInstanceBooleanField(
      instance,
      'publicGetInstanceAvailable',
      'public_get_instance_available',
      false
    );
    assertPrivateGetInstanceStringField(
      instance,
      'reactPublicResult',
      'react_public_result',
      'class-instance'
    );
    const instanceProps = normalizePrivateGetInstanceProps(
      readPrivateToJSONField(instance, 'props')
    );
    if (JSON.stringify(props) !== JSON.stringify(instanceProps)) {
      throwPrivateGetInstanceDiagnosticsError(
        'Private getInstance class component props do not match instance props.'
      );
    }
    const state = normalizePrivateGetInstanceState(
      readPrivateToJSONField(instance, 'state')
    );

    const renderedHostComponent = readPrivateGetInstanceRecordField(
      report,
      'renderedHostComponent',
      'rendered_host_component'
    );
    assertPrivateGetInstanceStringField(
      renderedHostComponent,
      'fiberTag',
      'fiber_tag',
      'HostComponent'
    );
    assertPrivateGetInstanceStringField(
      renderedHostComponent,
      'nodeType',
      'node_type',
      'host'
    );
    assertPrivateGetInstanceBooleanField(
      renderedHostComponent,
      'instanceAvailable',
      'instance_available',
      false
    );
    assertPrivateGetInstanceNumberField(
      renderedHostComponent,
      'renderedChildCount',
      'rendered_child_count',
      1
    );
    const hostProps = normalizePrivateGetInstanceProps(
      readPrivateToJSONField(renderedHostComponent, 'props')
    );
    const renderedText = readPrivateGetInstanceStringField(
      renderedHostComponent,
      'renderedText',
      'rendered_text'
    );

    const renderedHostText = readPrivateGetInstanceRecordField(
      report,
      'renderedHostText',
      'rendered_host_text'
    );
    assertPrivateGetInstanceStringField(
      renderedHostText,
      'fiberTag',
      'fiber_tag',
      'HostText'
    );
    const text = readPrivateGetInstanceStringField(renderedHostText, 'text');
    if (renderedText !== text) {
      throwPrivateGetInstanceDiagnosticsError(
        'Private getInstance rendered host text does not match HostText text.'
      );
    }

    assertPrivateGetInstancePublicBlockers(
      readPrivateGetInstanceRecordField(
        report,
        'publicBlockers',
        'public_blockers'
      )
    );
    assertPrivateGetInstanceBooleanField(
      report,
      'publicGetInstanceAvailable',
      'public_get_instance_available',
      false
    );
    assertPrivateGetInstanceBooleanField(
      report,
      'nativeBridgeAvailable',
      'native_bridge_available',
      false
    );
    assertPrivateGetInstanceBooleanField(
      report,
      'compatibilityClaimed',
      'compatibility_claimed',
      false
    );

    return {
      componentType: readPrivateGetInstanceStringField(
        classComponent,
        'componentType',
        'component_type'
      ),
      constructorName: readPrivateGetInstanceStringField(
        instance,
        'constructorName',
        'constructor_name'
      ),
      functionRootReactPublicResult: readPrivateGetInstanceStringField(
        functionRootFailClosed,
        'reactPublicResult',
        'react_public_result'
      ),
      hostProps,
      hostOutputUpdateKind: updateKind,
      hostRootReactPublicResult: readPrivateGetInstanceStringField(
        hostRootFailClosed,
        'reactPublicResult',
        'react_public_result'
      ),
      instanceProps,
      instanceReactPublicResult: readPrivateGetInstanceStringField(
        instance,
        'reactPublicResult',
        'react_public_result'
      ),
      props,
      state,
      text,
      type: normalizePrivateGetInstanceElementType(
        readPrivateToJSONField(
          renderedHostComponent,
          'elementType',
          'element_type'
        )
      )
    };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      error.code === 'FAST_REACT_TEST_RENDERER_PRIVATE_GETINSTANCE_DIAGNOSTIC'
    ) {
      throw error;
    }
    const message =
      error instanceof Error && typeof error.message === 'string'
        ? error.message
        : 'The accepted private getInstance diagnostic shape was rejected.';
    throwPrivateGetInstanceDiagnosticsError(message);
  }
}

function assertPrivateGetInstanceAcceptedClassFiberShape(shape) {
  if (
    shape.length !== privateGetInstanceAcceptedClassFiberShape.length ||
    shape.some(
      (tag, index) => tag !== privateGetInstanceAcceptedClassFiberShape[index]
    )
  ) {
    throwPrivateGetInstanceDiagnosticsError(
      'Expected private getInstance acceptedClassFiberShape to be HostRoot, ClassComponent, HostComponent, HostText.'
    );
  }
}

function assertPrivateGetInstanceRootShape(
  record,
  expectedShape,
  expectedChildTag,
  expectedReactPublicResult
) {
  const shape = readPrivateGetInstanceArrayField(
    record,
    'rootFiberShape',
    'root_fiber_shape'
  );
  if (
    shape.length !== expectedShape.length ||
    shape.some((tag, index) => tag !== expectedShape[index])
  ) {
    throwPrivateGetInstanceDiagnosticsError(
      `Expected private getInstance rootFiberShape to be ${expectedShape.join(', ')}.`
    );
  }
  assertPrivateGetInstanceStringField(
    record,
    'rootChildFiberTag',
    'root_child_fiber_tag',
    expectedChildTag
  );
  assertPrivateGetInstanceStringField(
    record,
    'reactPublicResult',
    'react_public_result',
    expectedReactPublicResult
  );
  assertPrivateGetInstanceBooleanField(
    record,
    'publicGetInstanceAvailable',
    'public_get_instance_available',
    false
  );
  assertPrivateGetInstanceBooleanField(
    record,
    'privateClassInstanceAvailable',
    'private_class_instance_available',
    false
  );
  assertPrivateGetInstanceBooleanField(
    record,
    'publicBehaviorFailClosed',
    'public_behavior_fail_closed',
    true
  );
}

function readPrivateGetInstanceRecordField(record, camelName, snakeName) {
  const value = readPrivateToJSONField(record, camelName, snakeName);
  assertPrivateGetInstanceRecord(value, camelName);
  return value;
}

function readPrivateGetInstanceArrayField(record, camelName, snakeName) {
  const value = readPrivateToJSONField(record, camelName, snakeName);
  if (!Array.isArray(value)) {
    throwPrivateGetInstanceDiagnosticsError(
      `Expected private getInstance diagnostic field ${camelName} to be an array.`
    );
  }
  return value;
}

function readPrivateGetInstanceStringField(record, camelName, snakeName) {
  const value = readPrivateToJSONField(record, camelName, snakeName);
  if (typeof value !== 'string') {
    throwPrivateGetInstanceDiagnosticsError(
      `Expected private getInstance diagnostic field ${camelName} to be a string.`
    );
  }
  return value;
}

function assertPrivateGetInstanceRecord(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throwPrivateGetInstanceDiagnosticsError(
      `Expected private getInstance diagnostic ${label} to be an object.`
    );
  }
}

function assertPrivateGetInstanceStringField(
  record,
  camelName,
  snakeName,
  expected
) {
  const actual = readPrivateGetInstanceStringField(
    record,
    camelName,
    snakeName
  );
  if (actual !== expected) {
    throwPrivateGetInstanceDiagnosticsError(
      `Expected private getInstance diagnostic field ${camelName} to be ${expected}.`
    );
  }
}

function assertPrivateGetInstanceNumberField(
  record,
  camelName,
  snakeName,
  expected
) {
  const actual = readPrivateToJSONField(record, camelName, snakeName);
  if (actual !== expected) {
    throwPrivateGetInstanceDiagnosticsError(
      `Expected private getInstance diagnostic field ${camelName} to be ${expected}.`
    );
  }
}

function assertPrivateGetInstanceBooleanField(
  record,
  camelName,
  snakeName,
  expected
) {
  const actual = readPrivateToJSONField(record, camelName, snakeName);
  if (actual !== expected) {
    throwPrivateGetInstanceDiagnosticsError(
      `Expected private getInstance diagnostic field ${camelName} to be ${expected}.`
    );
  }
}

function assertPrivateGetInstancePublicBlockers(blockers) {
  for (const [camelName, snakeName] of [
    ['jsonMethodBlocked', 'json_method_blocked'],
    ['treeMethodBlocked', 'tree_method_blocked'],
    ['instanceWrapperBlocked', 'instance_wrapper_blocked'],
    ['jsFacadeRoutingBlocked', 'js_facade_routing_blocked'],
    ['publicActBlocked', 'public_act_blocked'],
    ['compatibilityClaimBlocked', 'compatibility_claim_blocked']
  ]) {
    if (readPrivateToJSONField(blockers, camelName, snakeName) !== true) {
      throwPrivateGetInstanceDiagnosticsError(
        `Expected private getInstance public blocker ${camelName} to be true.`
      );
    }
  }
}

function assertPrivateGetInstanceGateIfPresent(gate) {
  if (gate === undefined) {
    return;
  }
  assertPrivateGetInstanceRecord(gate, 'gate');
  const status = readPrivateToJSONField(gate, 'status');
  if (
    status !== undefined &&
    status !== 'ReadyForPrivateSerializationDiagnostics'
  ) {
    throwPrivateGetInstanceDiagnosticsError(
      'Private getInstance diagnostic gate is not ready for private diagnostics.'
    );
  }
}

function normalizePrivateGetInstanceElementType(value) {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (value !== null && typeof value === 'object') {
    for (const key of ['name', 'elementType', 'element_type', 'type']) {
      const maybeName = value[key];
      if (typeof maybeName === 'string' && maybeName.length > 0) {
        return maybeName;
      }
    }
  }
  throwPrivateGetInstanceDiagnosticsError(
    'Expected private getInstance host component element type.'
  );
}

function normalizePrivateGetInstanceProps(props) {
  if (props === undefined || props === null) {
    return freezeRecord({});
  }
  assertPrivateGetInstanceRecord(props, 'props');
  const normalized = {};
  const attributes = readPrivateToJSONField(props, 'attributes');
  if (attributes !== undefined && attributes !== null) {
    assertPrivateGetInstanceRecord(attributes, 'props.attributes');
    for (const key of Object.keys(attributes).sort()) {
      if (key !== 'children') {
        normalized[key] = attributes[key];
      }
    }
  }
  for (const key of Object.keys(props).sort()) {
    if (
      key === 'attributes' ||
      key === 'textContent' ||
      key === 'text_content' ||
      key === 'children'
    ) {
      continue;
    }
    normalized[key] = props[key];
  }
  return freezeRecord(normalized);
}

function normalizePrivateGetInstanceState(state) {
  assertPrivateGetInstanceRecord(state, 'state');
  const marker = readPrivateToJSONField(state, 'marker');
  if (marker !== privateGetInstanceClassStateMarker) {
    throwPrivateGetInstanceDiagnosticsError(
      `Expected private getInstance state marker to be ${privateGetInstanceClassStateMarker}.`
    );
  }
  return freezeRecord({ marker });
}

function serializePrivateToJSONHostOutputDiagnostic(report) {
  const diagnostic = validatePrivateToJSONHostOutputDiagnostic(report);

  return diagnostic.result;
}

function createPrivateToJSONHostOutputDiagnosticResult(report) {
  const diagnostic = validatePrivateToJSONHostOutputDiagnostic(report);

  return freezeRecord({
    id: 'react-test-renderer-private-tojson-diagnostic-result',
    diagnosticName: privateToJSONFacadeResultDiagnosticName,
    status: privateToJSONFacadeResultStatus,
    entrypoint,
    publicSurface: 'create().toJSON',
    sourceDiagnostic: privateToJSONAcceptedDiagnosticName,
    hostOutputUpdateKind: diagnostic.hostOutputUpdateKind,
    hostOutputShape: diagnostic.hostOutputShape,
    hostOutputRowId:
      diagnostic.hostOutputRow === null ? null : diagnostic.hostOutputRow.id,
    hostOutputRow: diagnostic.hostOutputRow,
    hostOutputSnapshotCurrent: true,
    sourceNodeCount: diagnostic.sourceNodeCount,
    result: diagnostic.result,
    publicBlockers: createPrivateToJSONPublicBlockerRecord(),
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function createPrivateToJSONNativeExecutionDiagnosticResult(
  rootRequest,
  executionRecord,
  report,
  finishedWorkIdentityEvidence = undefined
) {
  const execution = consumeAcceptedToJSONNativeExecutionRecord(
    rootRequest,
    executionRecord
  );
  const finishedWorkIdentity =
    execution.operation === 'create' || execution.operation === 'update'
      ? createPrivateSerializationFinishedWorkIdentityGateResult(
          rootRequest,
          'create().toJSON',
          privateToJSONAcceptedDiagnosticName,
          finishedWorkIdentityEvidence,
          report,
          execution.request
        )
      : null;
  const diagnostic = validatePrivateToJSONHostOutputDiagnostic(report);
  const expectedHostOutputUpdateKind =
    hostOutputUpdateKindForRootExecutionOperation(execution.operation);

  if (diagnostic.hostOutputUpdateKind !== expectedHostOutputUpdateKind) {
    throwPrivateToJSONSerializationError(
      `Expected private native ${execution.operation} execution to consume ${expectedHostOutputUpdateKind} toJSON evidence.`
    );
  }
  if (
    execution.operation === 'update' &&
    !isMinimalToJSONNativeExecutionShape(diagnostic)
  ) {
    throwPrivateToJSONSerializationError(
      'Expected private native update toJSON finished-work identity admission to consume the minimal single-host-text update evidence.'
    );
  }
  const acceptedShape =
    assertAcceptedToJSONNativeExecutionShape(execution.operation, diagnostic);

  const diagnosticResult =
    createPrivateToJSONHostOutputDiagnosticResult(report);

  return freezeRecord({
    id: 'react-test-renderer-private-tojson-after-native-execution-result',
    diagnosticName: privateToJSONNativeExecutionDiagnosticName,
    status: privateToJSONNativeExecutionStatus,
    entrypoint,
    publicSurface: 'create().toJSON',
    sourceDiagnostic: privateToJSONAcceptedDiagnosticName,
    sourceDiagnosticResult: privateToJSONFacadeResultDiagnosticName,
    acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
    rootRequest,
    rootExecutionResult: execution,
    operation: execution.operation,
    requestId: execution.requestId,
    requestSequence: execution.requestSequence,
    rootId: execution.request.rootId,
    hostOutputUpdateKind: diagnostic.hostOutputUpdateKind,
    hostOutputShape: diagnostic.hostOutputShape,
    hostOutputRowId:
      diagnostic.hostOutputRow === null ? null : diagnostic.hostOutputRow.id,
    hostOutputRow: diagnostic.hostOutputRow,
    hostOutputSnapshotCurrent: true,
    sourceNodeCount: diagnostic.sourceNodeCount,
    rootChildCount: diagnostic.rootChildCount,
    result: diagnostic.result,
    diagnosticResult,
    finishedWorkIdentity,
    consumesAcceptedNativeExecutionRecord: true,
    consumesAcceptedNativeCreateExecutionRecord:
      execution.operation === 'create',
    consumesAcceptedNativeUpdateExecutionRecord:
      execution.operation === 'update',
    consumesAcceptedNativeUnmountExecutionRecord:
      execution.operation === 'unmount',
    consumesAcceptedFinishedWorkIdentityGate:
      finishedWorkIdentity !== null,
    consumesAcceptedRustLifecycleDiagnostic: true,
    consumesPrivateToJSONEvidence: true,
    consumesAcceptedHostOutputRow: diagnostic.hostOutputRow !== null,
    minimalTreeShape: acceptedShape.minimalTreeShape,
    acceptedHostOutputRowShape: acceptedShape.acceptedHostOutputRowShape,
    nestedHostOutputRowShape: acceptedShape.nestedHostOutputRowShape,
    siblingTextHostOutputRowShape: acceptedShape.siblingTextHostOutputRowShape,
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function createPrivateSerializationFinishedWorkIdentityGateResult(
  rootRequest,
  publicSurface,
  sourceSerializationDiagnosticName,
  evidence,
  report,
  sourceRootRequest = undefined
) {
  if (!isRootRequestRecord(rootRequest)) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected a private root request for serialization finished-work identity evidence.'
    );
  }
  if (evidence === null || typeof evidence !== 'object') {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected accepted serialization finished-work identity evidence.'
    );
  }

  const normalized =
    normalizePrivateSerializationFinishedWorkIdentityEvidence(
      publicSurface,
      evidence
    );
  if (
    normalized.diagnosticName !==
      privateSerializationFinishedWorkIdentityDiagnosticName ||
    normalized.status !== privateSerializationFinishedWorkIdentityStatus ||
    normalized.publicSurface !== publicSurface ||
    normalized.sourceSerializationDiagnosticName !==
      sourceSerializationDiagnosticName
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity diagnostic identity is not accepted.'
    );
  }
  const identityRootRequest =
    sourceRootRequest === undefined ? rootRequest : sourceRootRequest;
  if (!isRootRequestRecord(identityRootRequest)) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected a private root request for serialization finished-work identity evidence.'
    );
  }
  if (
    identityRootRequest.rootHandle !== rootRequest.rootHandle ||
    identityRootRequest.rootId !== rootRequest.rootId
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity belongs to a foreign root.'
    );
  }
  if (
    identityRootRequest.operation !==
    rootRequestOperationForHostOutputUpdateKind(
      publicSurface,
      normalized.hostOutputUpdateKind
    )
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity root request operation does not match the host output update kind.'
    );
  }
  if (identityRootRequest.scheduled !== true) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity root request was not scheduled.'
    );
  }
  if (
    identityRootRequest.operation === 'update' &&
    getLatestScheduledRootRequestForSerializationIdentity(
      identityRootRequest.rootHandle
    ) !== identityRootRequest
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity request sequence is stale.'
    );
  }
  if (
    normalized.rootRequestId !== identityRootRequest.requestId
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity request id is stale.'
    );
  }
  if (
    normalized.rootRequestSequence !== identityRootRequest.requestSequence
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity request sequence is stale.'
    );
  }
  if (normalized.rootId !== identityRootRequest.rootId) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity belongs to a foreign root.'
    );
  }
  if (
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.renderFinishedWork,
      normalized.commitCurrent
    ) ||
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.reportFinishedWork,
      normalized.commitCurrent
    ) ||
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.renderCurrent,
      normalized.commitPreviousCurrent
    ) ||
    normalized.commitCurrentMatchesRenderFinishedWork !== true ||
    normalized.commitPreviousCurrentMatchesRenderCurrent !== true ||
    normalized.reportFinishedWorkMatchesCommitCurrent !== true ||
    normalized.committedFiberInspectionCurrentMatchesCommit !== true
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization evidence is not tied to the committed HostRoot finished_work identity.'
    );
  }
  if (
    normalized.renderLanesBits <= 0 ||
    normalized.renderLanesBits !== normalized.commitFinishedLanesBits ||
    normalized.reportFinishedLanesBits !==
      normalized.commitFinishedLanesBits ||
    normalized.commitRemainingLanesBits !== 0 ||
    normalized.commitPendingLanesBits !== 0 ||
    normalized.commitLanesMatchRenderLanes !== true ||
    normalized.reportLanesMatchCommitLanes !== true
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization evidence lane handoff does not match the committed HostRoot finished lanes.'
    );
  }
  if (
    normalized.hostOutputSnapshotCurrent !== true ||
    normalized.consumesCommittedHostRootFinishedWorkIdentity !== true ||
    normalized.consumesCommittedHostRootFinishedWorkLanes !== true
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity evidence is not current.'
    );
  }
  if (
    publicSurface === 'create().toJSON'
      ? normalized.consumesPrivateToJSONEvidence !== true ||
        normalized.consumesPrivateToTreeEvidence !== false
      : normalized.consumesPrivateToJSONEvidence !== false ||
        normalized.consumesPrivateToTreeEvidence !== true
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity consumed the wrong serialization evidence kind.'
    );
  }
  if (
    normalized.publicToJSONAvailable !== false ||
    normalized.publicToTreeAvailable !== false ||
    normalized.publicTestInstanceAvailable !== false ||
    normalized.publicSerializationAvailable !== false ||
    normalized.compatibilityClaimed !== false
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization finished-work identity cannot open public serialization compatibility.'
    );
  }
  validatePrivateSerializationFinishedWorkIdentitySourceReport(
    publicSurface,
    sourceSerializationDiagnosticName,
    normalized,
    report
  );

  return freezeRecord({
    id: 'react-test-renderer-private-serialization-finished-work-identity-result',
    diagnosticName: privateSerializationFinishedWorkIdentityDiagnosticName,
    status: privateSerializationFinishedWorkIdentityStatus,
    entrypoint,
    publicSurface,
    sourceSerializationDiagnosticName,
    rootRequest: identityRootRequest,
    rootRequestId: identityRootRequest.requestId,
    rootRequestSequence: identityRootRequest.requestSequence,
    rootRequestOperation: identityRootRequest.operation,
    rootId: identityRootRequest.rootId,
    hostOutputUpdateKind: normalized.hostOutputUpdateKind,
    renderCurrent: normalized.renderCurrent,
    renderFinishedWork: normalized.renderFinishedWork,
    commitPreviousCurrent: normalized.commitPreviousCurrent,
    commitCurrent: normalized.commitCurrent,
    reportFinishedWork: normalized.reportFinishedWork,
    renderLanesBits: normalized.renderLanesBits,
    commitFinishedLanesBits: normalized.commitFinishedLanesBits,
    reportFinishedLanesBits: normalized.reportFinishedLanesBits,
    commitRemainingLanesBits: normalized.commitRemainingLanesBits,
    commitPendingLanesBits: normalized.commitPendingLanesBits,
    commitCurrentMatchesRenderFinishedWork: true,
    commitPreviousCurrentMatchesRenderCurrent: true,
    commitLanesMatchRenderLanes: true,
    reportFinishedWorkMatchesCommitCurrent: true,
    reportLanesMatchCommitLanes: true,
    committedFiberInspectionCurrentMatchesCommit: true,
    hostOutputSnapshotCurrent: true,
    consumesCommittedHostRootFinishedWorkIdentity: true,
    consumesCommittedHostRootFinishedWorkLanes: true,
    consumesPrivateToJSONEvidence:
      publicSurface === 'create().toJSON',
    consumesPrivateToTreeEvidence:
      publicSurface === 'create().toTree',
    publicToJSONAvailable: false,
    publicToTreeAvailable: false,
    publicTestInstanceAvailable: false,
    publicSerializationAvailable: false,
    compatibilityClaimed: false
  });
}

function getLatestScheduledRootRequestForSerializationIdentity(rootHandle) {
  const requests = getRootRequestsForHandle(rootHandle);
  for (let index = requests.length - 1; index >= 0; index -= 1) {
    const request = requests[index];
    if (
      request.scheduled === true &&
      (request.operation === 'create' ||
        request.operation === 'update' ||
        request.operation === 'unmount')
    ) {
      return request;
    }
  }
  return null;
}

function rootRequestOperationForHostOutputUpdateKind(
  publicSurface,
  hostOutputUpdateKind
) {
  switch (hostOutputUpdateKind) {
    case 'Create':
      return 'create';
    case 'Update':
      return 'update';
    default:
      throwPrivateSerializationFinishedWorkIdentityError(
        publicSurface,
        'Private serialization finished-work identity host output update kind is not accepted.'
      );
  }
}

function normalizePrivateSerializationFinishedWorkIdentityEvidence(
  publicSurface,
  evidence
) {
  return freezeRecord({
    diagnosticName: readPrivateToJSONField(
      evidence,
      'diagnosticName',
      'diagnostic_name'
    ),
    status: readPrivateToJSONField(evidence, 'status'),
    publicSurface: readPrivateToJSONField(
      evidence,
      'publicSurface',
      'public_surface'
    ),
    sourceSerializationDiagnosticName: readPrivateToJSONField(
      evidence,
      'sourceSerializationDiagnosticName',
      'source_serialization_diagnostic_name'
    ),
    rootRequestId: readPrivateToJSONField(
      evidence,
      'rootRequestId',
      'root_request_id'
    ),
    rootRequestSequence: readPrivateToJSONField(
      evidence,
      'rootRequestSequence',
      'root_request_sequence'
    ),
    rootId: readPrivateToJSONField(evidence, 'rootId', 'root_id'),
    hostOutputUpdateKind: readPrivateToJSONField(
      evidence,
      'hostOutputUpdateKind',
      'host_output_update_kind'
    ),
    renderCurrent: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateToJSONField(evidence, 'renderCurrent', 'render_current'),
      'renderCurrent'
    ),
    renderFinishedWork: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateToJSONField(
        evidence,
        'renderFinishedWork',
        'render_finished_work'
      ),
      'renderFinishedWork'
    ),
    commitCurrent: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateToJSONField(evidence, 'commitCurrent', 'commit_current'),
      'commitCurrent'
    ),
    commitPreviousCurrent: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateToJSONField(
        evidence,
        'commitPreviousCurrent',
        'commit_previous_current'
      ),
      'commitPreviousCurrent'
    ),
    reportFinishedWork: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateToJSONField(
        evidence,
        'reportFinishedWork',
        'report_finished_work'
      ),
      'reportFinishedWork'
    ),
    renderLanesBits: readPrivateSerializationLaneBits(
      publicSurface,
      evidence,
      'renderLanesBits',
      'render_lanes_bits'
    ),
    commitFinishedLanesBits: readPrivateSerializationLaneBits(
      publicSurface,
      evidence,
      'commitFinishedLanesBits',
      'commit_finished_lanes_bits'
    ),
    reportFinishedLanesBits: readPrivateSerializationLaneBits(
      publicSurface,
      evidence,
      'reportFinishedLanesBits',
      'report_finished_lanes_bits'
    ),
    commitRemainingLanesBits: readPrivateSerializationLaneBits(
      publicSurface,
      evidence,
      'commitRemainingLanesBits',
      'commit_remaining_lanes_bits'
    ),
    commitPendingLanesBits: readPrivateSerializationLaneBits(
      publicSurface,
      evidence,
      'commitPendingLanesBits',
      'commit_pending_lanes_bits'
    ),
    commitCurrentMatchesRenderFinishedWork: readPrivateToJSONField(
      evidence,
      'commitCurrentMatchesRenderFinishedWork',
      'commit_current_matches_render_finished_work'
    ),
    commitPreviousCurrentMatchesRenderCurrent: readPrivateToJSONField(
      evidence,
      'commitPreviousCurrentMatchesRenderCurrent',
      'commit_previous_current_matches_render_current'
    ),
    commitLanesMatchRenderLanes: readPrivateToJSONField(
      evidence,
      'commitLanesMatchRenderLanes',
      'commit_lanes_match_render_lanes'
    ),
    reportFinishedWorkMatchesCommitCurrent: readPrivateToJSONField(
      evidence,
      'reportFinishedWorkMatchesCommitCurrent',
      'report_finished_work_matches_commit_current'
    ),
    reportLanesMatchCommitLanes: readPrivateToJSONField(
      evidence,
      'reportLanesMatchCommitLanes',
      'report_lanes_match_commit_lanes'
    ),
    committedFiberInspectionCurrentMatchesCommit: readPrivateToJSONField(
      evidence,
      'committedFiberInspectionCurrentMatchesCommit',
      'committed_fiber_inspection_current_matches_commit'
    ),
    hostOutputSnapshotCurrent: readPrivateToJSONField(
      evidence,
      'hostOutputSnapshotCurrent',
      'host_output_snapshot_current'
    ),
    consumesCommittedHostRootFinishedWorkIdentity: readPrivateToJSONField(
      evidence,
      'consumesCommittedHostRootFinishedWorkIdentity',
      'consumes_committed_host_root_finished_work_identity'
    ),
    consumesCommittedHostRootFinishedWorkLanes: readPrivateToJSONField(
      evidence,
      'consumesCommittedHostRootFinishedWorkLanes',
      'consumes_committed_host_root_finished_work_lanes'
    ),
    consumesPrivateToJSONEvidence: readPrivateToJSONField(
      evidence,
      'consumesPrivateToJSONEvidence',
      'consumes_private_to_json_evidence'
    ),
    consumesPrivateToTreeEvidence: readPrivateToJSONField(
      evidence,
      'consumesPrivateToTreeEvidence',
      'consumes_private_to_tree_evidence'
    ),
    publicToJSONAvailable: readPrivateToJSONField(
      evidence,
      'publicToJSONAvailable',
      'public_to_json_available'
    ),
    publicToTreeAvailable: readPrivateToJSONField(
      evidence,
      'publicToTreeAvailable',
      'public_to_tree_available'
    ),
    publicTestInstanceAvailable: readPrivateToJSONField(
      evidence,
      'publicTestInstanceAvailable',
      'public_test_instance_available'
    ),
    publicSerializationAvailable: readPrivateToJSONField(
      evidence,
      'publicSerializationAvailable',
      'public_serialization_available'
    ),
    compatibilityClaimed: readPrivateToJSONField(
      evidence,
      'compatibilityClaimed',
      'compatibility_claimed'
    )
  });
}

function normalizePrivateSerializationFinishedWorkHandle(
  publicSurface,
  handle,
  label
) {
  if (handle === null || typeof handle !== 'object' || Array.isArray(handle)) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private serialization finished-work handle ${label}.`
    );
  }
  const arenaId = readPrivateToJSONField(handle, 'arenaId', 'arena_id');
  const slot = readPrivateToJSONField(handle, 'slot');
  const generation = readPrivateToJSONField(
    handle,
    'generation',
    'generation_id'
  );
  if (
    !isNonNegativeInteger(arenaId) ||
    !isNonNegativeInteger(slot) ||
    !isNonNegativeInteger(generation)
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected numeric private serialization finished-work handle ${label}.`
    );
  }
  return freezeRecord({ arenaId, slot, generation });
}

function privateSerializationFinishedWorkHandlesEqual(left, right) {
  return (
    left.arenaId === right.arenaId &&
    left.slot === right.slot &&
    left.generation === right.generation
  );
}

function readPrivateSerializationLaneBits(
  publicSurface,
  record,
  camelName,
  snakeName
) {
  const value = readPrivateToJSONField(record, camelName, snakeName);
  if (!isNonNegativeInteger(value)) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private serialization finished-work identity ${camelName} lane bits.`
    );
  }
  return value;
}

function validatePrivateSerializationFinishedWorkIdentitySourceReport(
  publicSurface,
  expectedDiagnosticName,
  identity,
  report
) {
  if (report === null || typeof report !== 'object') {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected private serialization source report.'
    );
  }
  if (
    readPrivateToJSONField(report, 'diagnosticName', 'diagnostic_name') !==
    expectedDiagnosticName
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization source report diagnostic name is stale.'
    );
  }
  const hostOutputUpdateKind = readPrivateToJSONField(
    report,
    'hostOutputUpdateKind',
    'host_output_update_kind'
  );
  if (
    hostOutputUpdateKind !== undefined &&
    hostOutputUpdateKind !== identity.hostOutputUpdateKind
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization source report update kind does not match identity evidence.'
    );
  }
  const snapshotCurrent = readPrivateToJSONField(
    report,
    'hostOutputSnapshotCurrent',
    'host_output_snapshot_current'
  );
  if (snapshotCurrent !== undefined && snapshotCurrent !== true) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private serialization source report host output snapshot is stale.'
    );
  }
  const publicBlockers = readPrivateToJSONField(
    report,
    'publicBlockers',
    'public_blockers'
  );
  if (publicBlockers !== undefined) {
    assertPrivateToJSONPublicBlockers(publicBlockers);
  }
}

function throwPrivateSerializationFinishedWorkIdentityError(
  publicSurface,
  message
) {
  if (publicSurface === 'create().toTree') {
    throwPrivateToTreeMetadataError(message);
  }
  throwPrivateToJSONSerializationError(message);
}

function consumeAcceptedToJSONNativeExecutionRecord(
  rootRequest,
  executionRecord
) {
  try {
    return consumeAcceptedToJSONNativeExecutionRecordImpl(
      rootRequest,
      executionRecord
    );
  } catch (error) {
    if (
      error &&
      error.name === 'FastReactTestRendererPrivateRootRequestError'
    ) {
      throwPrivateToJSONSerializationError(error.message);
    }
    throw error;
  }
}

function consumeAcceptedToJSONNativeExecutionRecordImpl(
  rootRequest,
  executionRecord
) {
  if (!isRootRequestRecord(rootRequest)) {
    throwPrivateToJSONSerializationError(
      'Expected a private root request for native toJSON evidence.'
    );
  }
  if (executionRecord === null || typeof executionRecord !== 'object') {
    throwPrivateToJSONSerializationError(
      'Expected an accepted private native root execution result.'
    );
  }
  if (
    executionRecord.kind !== undefined &&
    executionRecord.kind !== privateToJSONNativeExecutionRecordKind
  ) {
    throwPrivateToJSONSerializationError(
      'Expected a FastReactTestRendererPrivateRootExecutionResult record.'
    );
  }
  if (
    executionRecord.status !== undefined &&
    executionRecord.status !== 'accepted-private-test-renderer-root-execution-result'
  ) {
    throwPrivateToJSONSerializationError(
      'Expected an accepted private root execution result status.'
    );
  }

  const request = readDiagnosticField(executionRecord, ['request']);
  if (!isRootRequestRecord(request)) {
    throwPrivateToJSONSerializationError(
      'Expected native execution result to carry a private root request.'
    );
  }
  if (
    request.rootHandle !== rootRequest.rootHandle ||
    request.rootId !== rootRequest.rootId
  ) {
    throwPrivateToJSONSerializationError(
      'Expected native execution result to belong to the renderer root.'
    );
  }
  if (
    !privateToJSONNativeExecutionAcceptedOperations.includes(
      request.operation
    )
  ) {
    throwPrivateToJSONSerializationError(
      'Expected native execution result operation to be create, update, or unmount.'
    );
  }

  const consumed = executionRecord;
  if (
    consumed.request !== request ||
    consumed.operation !== request.operation ||
    consumed.rustOutcome !== request.rustOutcome ||
    consumed.privateRootRequestExecution !== true ||
    consumed.rustRootExecutionBridgeStatus !==
      'admitted-private-test-renderer-native-root-execution-bridge' ||
    consumed.rustRootExecutionBoundaryCalled !== true
  ) {
    throwPrivateToJSONSerializationError(
      'Expected accepted private native root execution evidence.'
    );
  }
  if (consumed.scheduled !== true) {
    throwPrivateToJSONSerializationError(
      'Expected private native toJSON evidence to consume a scheduled root execution.'
    );
  }
  if (
    consumed.serializationAvailable !== false ||
    consumed.publicRouteAvailable !== false ||
    consumed.publicCreateUpdateUnmountBehaviorAvailable !== false ||
    consumed.compatibilityClaimed !== false
  ) {
    throwPrivateToJSONSerializationError(
      'Private native toJSON evidence cannot claim public serialization compatibility.'
    );
  }

  return consumed;
}

function hostOutputUpdateKindForRootExecutionOperation(operation) {
  switch (operation) {
    case 'create':
      return 'Create';
    case 'update':
      return 'Update';
    case 'unmount':
      return 'Unmount';
  }
  throwPrivateToJSONSerializationError(
    'Expected native execution operation to be create, update, or unmount.'
  );
}

function isMinimalToJSONNativeExecutionShape(diagnostic) {
  if (diagnostic.hostOutputUpdateKind === 'Unmount') {
    return (
      diagnostic.hostOutputShape === 'EmptyRoot' &&
      diagnostic.rootChildCount === 0 &&
      diagnostic.sourceNodeCount === 0 &&
      diagnostic.result === null
    );
  }
  if (
    diagnostic.hostOutputShape !== 'SingleHostText' ||
    diagnostic.rootChildCount !== 1 ||
    diagnostic.sourceNodeCount !== 2
  ) {
    return false;
  }
  const result = diagnostic.result;
  return (
    result !== null &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    Array.isArray(result.children) &&
    result.children.length === 1 &&
    typeof result.children[0] === 'string'
  );
}

function assertAcceptedToJSONNativeExecutionShape(operation, diagnostic) {
  if (operation === 'create') {
    if (
      diagnostic.hostOutputRow !== null ||
      !isMinimalToJSONNativeExecutionShape(diagnostic)
    ) {
      throwPrivateToJSONSerializationError(
        'Expected private native create toJSON evidence to describe the minimal host tree without row metadata.'
      );
    }
    return {
      minimalTreeShape: true,
      acceptedHostOutputRowShape: false,
      nestedHostOutputRowShape: false,
      siblingTextHostOutputRowShape: false
    };
  }

  if (operation === 'unmount') {
    if (
      diagnostic.hostOutputRow === null ||
      diagnostic.hostOutputRow.id !== privateToJSONUnmountHostOutputRowId ||
      !isMinimalToJSONNativeExecutionShape(diagnostic)
    ) {
      throwPrivateToJSONSerializationError(
        'Expected private native unmount toJSON evidence to consume the empty-root host output row.'
      );
    }
    return {
      minimalTreeShape: true,
      acceptedHostOutputRowShape: true,
      nestedHostOutputRowShape: false,
      siblingTextHostOutputRowShape: false
    };
  }

  if (operation !== 'update') {
    throwPrivateToJSONSerializationError(
      'Expected native execution operation to be create, update, or unmount.'
    );
  }

  const row = diagnostic.hostOutputRow;
  if (row === null) {
    throwPrivateToJSONSerializationError(
      'Expected private native update toJSON evidence to include host output row metadata.'
    );
  }
  switch (row.id) {
    case privateToJSONUpdateHostOutputRowId:
      if (!isMinimalToJSONNativeExecutionShape(diagnostic)) {
        throwPrivateToJSONSerializationError(
          'Expected private native update toJSON evidence to describe the minimal host tree for the single-text row.'
        );
      }
      return {
        minimalTreeShape: true,
        acceptedHostOutputRowShape: true,
        nestedHostOutputRowShape: false,
        siblingTextHostOutputRowShape: false
      };
    case privateToJSONNestedUpdateHostOutputRowId:
      if (!isNestedToJSONNativeExecutionShape(diagnostic)) {
        throwPrivateToJSONSerializationError(
          'Expected private native update toJSON evidence to describe the nested multi-child host output row.'
        );
      }
      return {
        minimalTreeShape: false,
        acceptedHostOutputRowShape: true,
        nestedHostOutputRowShape: true,
        siblingTextHostOutputRowShape: false
      };
    case privateToJSONSiblingTextHostOutputRowId:
      if (!isSiblingTextToJSONNativeExecutionShape(diagnostic)) {
        throwPrivateToJSONSerializationError(
          'Expected private native update toJSON evidence to describe the sibling text host output row.'
        );
      }
      return {
        minimalTreeShape: false,
        acceptedHostOutputRowShape: true,
        nestedHostOutputRowShape: false,
        siblingTextHostOutputRowShape: true
      };
  }

  throwPrivateToJSONSerializationError(
    'Expected private native update toJSON evidence to consume an accepted host output row.'
  );
}

function isNestedToJSONNativeExecutionShape(diagnostic) {
  if (
    diagnostic.hostOutputShape !== 'NestedHostText' ||
    diagnostic.rootChildCount !== 1 ||
    diagnostic.sourceNodeCount !== 4
  ) {
    return false;
  }
  const result = diagnostic.result;
  if (
    result === null ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    !Array.isArray(result.children) ||
    result.children.length !== 1
  ) {
    return false;
  }
  const nested = result.children[0];
  return (
    nested !== null &&
    typeof nested === 'object' &&
    !Array.isArray(nested) &&
    Array.isArray(nested.children) &&
    nested.children.length === 2 &&
    nested.children.every((child) => typeof child === 'string')
  );
}

function isSiblingTextToJSONNativeExecutionShape(diagnostic) {
  if (
    diagnostic.hostOutputShape !== 'SiblingText' ||
    diagnostic.rootChildCount !== 2 ||
    diagnostic.sourceNodeCount !== 3 ||
    !Array.isArray(diagnostic.result) ||
    diagnostic.result.length !== 2 ||
    typeof diagnostic.result[0] !== 'string'
  ) {
    return false;
  }
  const sibling = diagnostic.result[1];
  return (
    sibling !== null &&
    typeof sibling === 'object' &&
    !Array.isArray(sibling) &&
    Array.isArray(sibling.children) &&
    sibling.children.length === 1 &&
    typeof sibling.children[0] === 'string'
  );
}

function validatePrivateToJSONHostOutputDiagnostic(report) {
  assertPrivateToJSONRecord(report, 'report');
  assertPrivateToJSONStringField(
    report,
    'diagnosticName',
    'diagnostic_name',
    privateToJSONAcceptedDiagnosticName
  );
  const rootChildCount = readPrivateToJSONNonNegativeIntegerField(
    report,
    'rootChildCount',
    'root_child_count'
  );
  const rootNodeKind = readPrivateToJSONField(
    report,
    'rootNodeKind',
    'root_node_kind'
  );
  const hostOutputUpdateKind = assertPrivateToJSONHostOutputUpdateKind(report);
  assertPrivateToJSONBooleanField(
    report,
    'hostOutputSnapshotCurrent',
    'host_output_snapshot_current',
    true
  );
  const hostOutputRow = validatePrivateToJSONUpdateUnmountRowMetadata(
    report,
    hostOutputUpdateKind,
    rootChildCount
  );
  assertPrivateToJSONPublicBlockers(
    readPrivateToJSONRecordField(report, 'publicBlockers', 'public_blockers')
  );
  assertPrivateToJSONGateIfPresent(readPrivateToJSONField(report, 'gate'));

  const nodes = readPrivateToJSONArrayField(report, 'nodes');
  const diagnosticNodes = validatePrivateToJSONDiagnosticNodes(nodes);
  const rootOrdinals = diagnosticNodes
    .filter((node) => node.parentOrdinal === null)
    .map((node) => node.ordinal);
  if (rootOrdinals.length !== rootChildCount) {
    throwPrivateToJSONSerializationError(
      `Expected ${rootChildCount} private JSON root child diagnostic node(s), found ${rootOrdinals.length}.`
    );
  }
  assertPrivateToJSONRootNodeKind(rootNodeKind, diagnosticNodes, rootOrdinals);
  const hostOutputShape = assertPrivateToJSONHostOutputRowShape(
    hostOutputRow,
    diagnosticNodes,
    rootOrdinals
  );

  const result = createPrivateToJSONRenderedRoot(
    diagnosticNodes,
    rootOrdinals
  );
  if (
    hostOutputUpdateKind === 'Unmount' &&
    (rootChildCount !== 0 || diagnosticNodes.length !== 0 || result !== null)
  ) {
    throwPrivateToJSONSerializationError(
      'Expected private JSON unmount diagnostic to serialize an empty root.'
    );
  }

  return {
    hostOutputUpdateKind,
    hostOutputShape,
    hostOutputRow,
    result,
    rootChildCount,
    sourceNodeCount: diagnosticNodes.length
  };
}

function validatePrivateToJSONDiagnosticNodes(nodes) {
  const diagnosticNodes = nodes.map((node, index) => {
    assertPrivateToJSONRecord(node, `nodes[${index}]`);
    const ordinal = readPrivateToJSONNonNegativeIntegerField(node, 'ordinal');
    if (ordinal !== index) {
      throwPrivateToJSONSerializationError(
        `Expected private JSON diagnostic node ordinal ${index}, found ${ordinal}.`
      );
    }
    const nodeKind = readPrivateToJSONStringField(node, 'nodeKind', 'node_kind');
    if (nodeKind !== 'HostComponent' && nodeKind !== 'Text') {
      throwPrivateToJSONSerializationError(
        'Expected private JSON diagnostic node kind to be HostComponent or Text.'
      );
    }
    const parentOrdinal = normalizePrivateToJSONParentOrdinal(
      readPrivateToJSONField(node, 'parentOrdinal', 'parent_ordinal')
    );
    const childOrdinals = normalizePrivateToJSONChildOrdinals(
      readPrivateToJSONField(node, 'childOrdinals', 'child_ordinals')
    );
    assertPrivateToJSONVisibleAttached(node, `nodes[${index}]`);

    if (nodeKind === 'Text') {
      if (childOrdinals.length !== 0) {
        throwPrivateToJSONSerializationError(
          'Private JSON diagnostic text nodes cannot have children.'
        );
      }
      return {
        ordinal,
        nodeKind,
        parentOrdinal,
        childOrdinals,
        text: readPrivateToJSONStringField(node, 'text')
      };
    }

    return {
      ordinal,
      nodeKind,
      parentOrdinal,
      childOrdinals,
      props: normalizePrivateToJSONProps(readPrivateToJSONField(node, 'props')),
      type: normalizePrivateToJSONElementType(
        readPrivateToJSONField(node, 'elementType', 'element_type')
      )
    };
  });

  for (const node of diagnosticNodes) {
    if (node.parentOrdinal !== null) {
      const parent = diagnosticNodes[node.parentOrdinal];
      if (parent === undefined) {
        throwPrivateToJSONSerializationError(
          'Private JSON diagnostic parent ordinal does not resolve to a node.'
        );
      }
      if (!parent.childOrdinals.includes(node.ordinal)) {
        throwPrivateToJSONSerializationError(
          'Private JSON diagnostic parent/child ordinals are inconsistent.'
        );
      }
    }

    for (const childOrdinal of node.childOrdinals) {
      const child = diagnosticNodes[childOrdinal];
      if (child === undefined) {
        throwPrivateToJSONSerializationError(
          'Private JSON diagnostic child ordinal does not resolve to a node.'
        );
      }
      if (child.parentOrdinal !== node.ordinal) {
        throwPrivateToJSONSerializationError(
          'Private JSON diagnostic child parent ordinal is inconsistent.'
        );
      }
    }
  }

  return diagnosticNodes;
}

function assertPrivateToJSONRootNodeKind(
  rootNodeKind,
  diagnosticNodes,
  rootOrdinals
) {
  if (rootNodeKind === undefined || rootNodeKind === null) {
    return;
  }
  if (typeof rootNodeKind !== 'string') {
    throwPrivateToJSONSerializationError(
      'Expected private JSON diagnostic rootNodeKind to be a string.'
    );
  }
  if (rootOrdinals.length === 0) {
    if (rootNodeKind !== 'EmptyRoot') {
      throwPrivateToJSONSerializationError(
        'Expected empty private JSON diagnostic rootNodeKind to be EmptyRoot.'
      );
    }
    return;
  }
  if (rootOrdinals.length > 1) {
    if (
      rootNodeKind !== 'MultipleHostChildren' &&
      rootNodeKind !== 'Multiple'
    ) {
      throwPrivateToJSONSerializationError(
        'Expected multi-root private JSON diagnostic rootNodeKind to be MultipleHostChildren.'
      );
    }
    return;
  }

  const rootNode = diagnosticNodes[rootOrdinals[0]];
  if (rootNodeKind !== rootNode.nodeKind) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic rootNodeKind to be ${rootNode.nodeKind}.`
    );
  }
}

function assertPrivateToJSONHostOutputRowShape(
  hostOutputRow,
  diagnosticNodes,
  rootOrdinals
) {
  const actualShape = inferPrivateToJSONHostOutputShape(
    diagnosticNodes,
    rootOrdinals
  );
  if (hostOutputRow !== null && hostOutputRow.hostOutputShape !== actualShape) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON ${hostOutputRow.id} row shape to be ${actualShape}.`
    );
  }
  return actualShape;
}

function inferPrivateToJSONHostOutputShape(diagnosticNodes, rootOrdinals) {
  if (rootOrdinals.length === 0) {
    return 'EmptyRoot';
  }
  if (
    rootOrdinals.some(
      (ordinal) => diagnosticNodes[ordinal]?.nodeKind === 'Text'
    )
  ) {
    return 'SiblingText';
  }

  let maxHostComponentDepth = 0;
  const visit = (ordinal, hostComponentDepth) => {
    const node = diagnosticNodes[ordinal];
    if (node === undefined || node.nodeKind === 'Text') {
      return;
    }
    const nextDepth = hostComponentDepth + 1;
    maxHostComponentDepth = Math.max(maxHostComponentDepth, nextDepth);
    for (const childOrdinal of node.childOrdinals) {
      visit(childOrdinal, nextDepth);
    }
  };
  for (const ordinal of rootOrdinals) {
    visit(ordinal, 0);
  }

  return maxHostComponentDepth > 1 ? 'NestedHostText' : 'SingleHostText';
}

function createPrivateToJSONRenderedRoot(diagnosticNodes, rootOrdinals) {
  const visited = new Set();
  const stack = new Set();
  const renderedChildren = rootOrdinals.map((ordinal) =>
    createPrivateToJSONRenderedValue(diagnosticNodes, ordinal, visited, stack)
  );
  if (visited.size !== diagnosticNodes.length) {
    throwPrivateToJSONSerializationError(
      'Private JSON diagnostic contains nodes that are not reachable from the root.'
    );
  }
  if (renderedChildren.length === 0) {
    return null;
  }
  if (renderedChildren.length === 1) {
    return renderedChildren[0];
  }
  return freezeArray(renderedChildren);
}

function createPrivateToJSONRenderedValue(
  diagnosticNodes,
  ordinal,
  visited,
  stack
) {
  if (stack.has(ordinal)) {
    throwPrivateToJSONSerializationError(
      'Private JSON diagnostic child ordinals contain a cycle.'
    );
  }
  const node = diagnosticNodes[ordinal];
  if (node === undefined) {
    throwPrivateToJSONSerializationError(
      'Private JSON diagnostic child ordinal does not resolve to a node.'
    );
  }

  visited.add(ordinal);
  if (node.nodeKind === 'Text') {
    return node.text;
  }

  stack.add(ordinal);
  const renderedChildren = node.childOrdinals.map((childOrdinal) =>
    createPrivateToJSONRenderedValue(
      diagnosticNodes,
      childOrdinal,
      visited,
      stack
    )
  );
  stack.delete(ordinal);

  return freezeRecord({
    type: node.type,
    props: node.props,
    children:
      renderedChildren.length === 0 ? null : freezeArray(renderedChildren)
  });
}

function readPrivateToJSONField(record, camelName, snakeName) {
  if (record !== null && typeof record === 'object') {
    if (Object.hasOwn(record, camelName)) {
      return record[camelName];
    }
    if (snakeName !== undefined && Object.hasOwn(record, snakeName)) {
      return record[snakeName];
    }
  }

  return undefined;
}

function readPrivateToJSONRecordField(record, camelName, snakeName) {
  const value = readPrivateToJSONField(record, camelName, snakeName);
  assertPrivateToJSONRecord(value, camelName);
  return value;
}

function readPrivateToJSONArrayField(record, camelName, snakeName) {
  const value = readPrivateToJSONField(record, camelName, snakeName);
  if (!Array.isArray(value)) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic field ${camelName} to be an array.`
    );
  }

  return value;
}

function readPrivateToJSONStringField(record, camelName, snakeName) {
  const value = readPrivateToJSONField(record, camelName, snakeName);
  if (typeof value !== 'string') {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic field ${camelName} to be a string.`
    );
  }

  return value;
}

function readPrivateToJSONNumberField(record, camelName, snakeName) {
  const value = readPrivateToJSONField(record, camelName, snakeName);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic field ${camelName} to be a number.`
    );
  }

  return value;
}

function readPrivateToJSONNonNegativeIntegerField(
  record,
  camelName,
  snakeName
) {
  const value = readPrivateToJSONNumberField(record, camelName, snakeName);
  if (!Number.isInteger(value) || value < 0) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic field ${camelName} to be a non-negative integer.`
    );
  }

  return value;
}

function assertPrivateToJSONRecord(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic ${label} to be an object.`
    );
  }
}

function assertPrivateToJSONStringField(
  record,
  camelName,
  snakeName,
  expected
) {
  const actual = readPrivateToJSONStringField(record, camelName, snakeName);
  if (actual !== expected) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic field ${camelName} to be ${expected}.`
    );
  }
}

function assertPrivateToJSONNumberField(
  record,
  camelName,
  snakeName,
  expected
) {
  const actual = readPrivateToJSONNumberField(record, camelName, snakeName);
  if (actual !== expected) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic field ${camelName} to be ${expected}.`
    );
  }
  return actual;
}

function assertPrivateToJSONKindField(record, camelName, snakeName, expected) {
  const actual = readPrivateToJSONStringField(record, camelName, snakeName);
  if (actual !== expected) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic kind ${camelName} to be ${expected}.`
    );
  }
}

function assertPrivateToJSONHostOutputUpdateKind(report) {
  const actual = readPrivateToJSONStringField(
    report,
    'hostOutputUpdateKind',
    'host_output_update_kind'
  );
  if (actual !== 'Create' && actual !== 'Update' && actual !== 'Unmount') {
    throwPrivateToJSONSerializationError(
      'Expected private JSON diagnostic host output update kind to be Create, Update, or Unmount.'
    );
  }
  return actual;
}

function validatePrivateToJSONUpdateUnmountRowMetadata(
  report,
  hostOutputUpdateKind,
  rootChildCount
) {
  const row = readPrivateToJSONField(
    report,
    'hostOutputRow',
    'host_output_row'
  ) ?? readPrivateToJSONField(report, 'privateHostOutputRow');
  const directRowId =
    readPrivateToJSONField(report, 'hostOutputRowId', 'host_output_row_id') ??
    readPrivateToJSONField(report, 'privateRowId', 'private_row_id');

  if (hostOutputUpdateKind === 'Create') {
    if (row === undefined && directRowId === undefined) {
      return null;
    }
    throwPrivateToJSONSerializationError(
      'Create diagnostics must not claim update or unmount private row metadata.'
    );
  }

  const expectedRowIds =
    hostOutputUpdateKind === 'Unmount'
      ? [privateToJSONUnmountHostOutputRowId]
      : privateToJSONUpdateHostOutputRowIds;
  if (directRowId !== undefined && !expectedRowIds.includes(directRowId)) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON ${hostOutputUpdateKind} row id to be one of ${expectedRowIds.join(', ')}.`
    );
  }
  if (row === undefined || row === null) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON ${hostOutputUpdateKind} diagnostic to include explicit host output row metadata.`
    );
  }

  assertPrivateToJSONRecord(row, 'hostOutputRow');
  const rowId = readPrivateToJSONStringField(row, 'id');
  if (!expectedRowIds.includes(rowId)) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON ${hostOutputUpdateKind} row id to be one of ${expectedRowIds.join(', ')}.`
    );
  }
  const hostOutputShape = normalizePrivateToJSONHostOutputShape(
    readPrivateToJSONField(row, 'hostOutputShape', 'host_output_shape') ??
      expectedPrivateToJSONHostOutputShapeForRowId(rowId)
  );
  const expectedShape = expectedPrivateToJSONHostOutputShapeForRowId(rowId);
  if (hostOutputShape !== expectedShape) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON ${rowId} row shape to be ${expectedShape}.`
    );
  }
  assertPrivateToJSONStringField(
    row,
    'status',
    undefined,
    privateToJSONUpdateUnmountRowStatus
  );
  assertPrivateToJSONStringField(
    row,
    'hostOutputUpdateKind',
    'host_output_update_kind',
    hostOutputUpdateKind
  );
  const currentRootChildCount = readPrivateToJSONField(
    row,
    'currentRootChildCount',
    'current_root_child_count'
  );
  if (
    currentRootChildCount !== undefined &&
    (!Number.isInteger(currentRootChildCount) ||
      currentRootChildCount < 0 ||
      currentRootChildCount !== rootChildCount)
  ) {
    throwPrivateToJSONSerializationError(
      'Expected private JSON row currentRootChildCount to match the diagnostic rootChildCount.'
    );
  }
  if (
    hostOutputUpdateKind === 'Unmount' &&
    currentRootChildCount !== undefined &&
    currentRootChildCount !== 0
  ) {
    throwPrivateToJSONSerializationError(
      'Expected private JSON unmount row currentRootChildCount to be 0.'
    );
  }
  if (hostOutputUpdateKind === 'Unmount' && hostOutputShape !== 'EmptyRoot') {
    throwPrivateToJSONSerializationError(
      'Expected private JSON unmount row hostOutputShape to be EmptyRoot.'
    );
  }
  if (hostOutputUpdateKind === 'Unmount' && rootChildCount !== 0) {
    throwPrivateToJSONSerializationError(
      'Expected private JSON unmount diagnostic rootChildCount to be 0.'
    );
  }

  const dependencyMetadata =
    readPrivateToJSONField(row, 'dependencyMetadata', 'dependency_metadata') ??
    readPrivateToJSONField(row, 'dependencyDiagnostics', 'dependency_diagnostics');
  assertPrivateToJSONRecord(dependencyMetadata, 'hostOutputRow.dependencyMetadata');
  assertPrivateToJSONUpdateUnmountDependencyMetadata(
    dependencyMetadata,
    hostOutputUpdateKind
  );

  return freezeRecord({
    id: rowId,
    status: privateToJSONUpdateUnmountRowStatus,
    hostOutputUpdateKind,
    hostOutputShape,
    dependencyMetadata
  });
}

function expectedPrivateToJSONHostOutputShapeForRowId(rowId) {
  if (rowId === privateToJSONUnmountHostOutputRowId) {
    return 'EmptyRoot';
  }
  if (rowId === privateToJSONNestedUpdateHostOutputRowId) {
    return 'NestedHostText';
  }
  if (rowId === privateToJSONSiblingTextHostOutputRowId) {
    return 'SiblingText';
  }
  return 'SingleHostText';
}

function normalizePrivateToJSONHostOutputShape(value) {
  if (!privateToJSONHostOutputShapes.includes(value)) {
    throwPrivateToJSONSerializationError(
      'Expected private JSON host output row shape to be an accepted toJSON diagnostic shape.'
    );
  }
  return value;
}

function assertPrivateToJSONUpdateUnmountDependencyMetadata(
  metadata,
  hostOutputUpdateKind
) {
  const dependencyIds = readPrivateToJSONField(
    metadata,
    'acceptedPrivateDiagnosticDependencyIds',
    'accepted_private_diagnostic_dependency_ids'
  );
  if (dependencyIds !== undefined) {
    if (!Array.isArray(dependencyIds)) {
      throwPrivateToJSONSerializationError(
        'Expected private JSON update/unmount dependency ids to be an array.'
      );
    }
    if (
      dependencyIds.length !== privateToJSONUpdateUnmountDependencyIds.length ||
      dependencyIds.some(
        (dependencyId, index) =>
          dependencyId !== privateToJSONUpdateUnmountDependencyIds[index]
      )
    ) {
      throwPrivateToJSONSerializationError(
        'Expected private JSON update/unmount dependency ids to match accepted private rows.'
      );
    }
  } else {
    const expectedRouteId =
      hostOutputUpdateKind === 'Unmount'
        ? 'react-test-renderer-unmount-route-private-diagnostic'
        : 'react-test-renderer-update-route-private-diagnostic';
    if (
      readPrivateToJSONField(metadata, 'routeRowId', 'route_row_id') !==
      expectedRouteId
    ) {
      throwPrivateToJSONSerializationError(
        'Expected private JSON update/unmount route dependency id to match the row kind.'
      );
    }
    if (
      readPrivateToJSONField(
        metadata,
        'serializationRowId',
        'serialization_row_id'
      ) !== 'react-test-renderer-serialization-private-json-diagnostic'
    ) {
      throwPrivateToJSONSerializationError(
        'Expected private JSON update/unmount serialization dependency id.'
      );
    }
  }
  for (const [camelName, snakeName] of [
    ['serializationDiagnosticsAvailable', 'serialization_diagnostics_available']
  ]) {
    if (readPrivateToJSONField(metadata, camelName, snakeName) !== true) {
      throwPrivateToJSONSerializationError(
        `Expected private JSON dependency metadata ${camelName} to be true.`
      );
    }
  }
  const snapshotFreshness =
    readPrivateToJSONField(
      metadata,
      'hostOutputSnapshotFreshnessRequired',
      'host_output_snapshot_freshness_required'
    ) ??
    readPrivateToJSONField(
      metadata,
      'hostOutputSnapshotCurrent',
      'host_output_snapshot_current'
    );
  if (snapshotFreshness !== true) {
    throwPrivateToJSONSerializationError(
      'Expected private JSON dependency metadata host output snapshot freshness to be true.'
    );
  }
  for (const [camelName, snakeName] of [
    ['staleSnapshotRejection', 'stale_snapshot_rejection'],
    [
      'mismatchedUpdateUnmountRecordRejection',
      'mismatched_update_unmount_record_rejection'
    ]
  ]) {
    const value = readPrivateToJSONField(metadata, camelName, snakeName);
    if (value !== undefined && value !== true) {
      throwPrivateToJSONSerializationError(
        `Expected private JSON dependency metadata ${camelName} to be true.`
      );
    }
  }
  for (const [camelName, snakeName] of [
    ['publicToJSONAvailable', 'public_to_json_available'],
    ['publicTestInstanceAvailable', 'public_test_instance_available'],
    ['nativeExecutionAvailable', 'native_execution_available'],
    ['compatibilityClaimed', 'compatibility_claimed']
  ]) {
    if (readPrivateToJSONField(metadata, camelName, snakeName) !== false) {
      throwPrivateToJSONSerializationError(
        `Expected private JSON dependency metadata ${camelName} to be false.`
      );
    }
  }
}

function assertPrivateToJSONBooleanField(
  record,
  camelName,
  snakeName,
  expected
) {
  const actual = readPrivateToJSONField(record, camelName, snakeName);
  if (actual !== expected) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic field ${camelName} to be ${expected}.`
    );
  }
}

function assertPrivateToJSONParentOrdinal(record, expected) {
  const actual = readPrivateToJSONField(
    record,
    'parentOrdinal',
    'parent_ordinal'
  );
  if (actual !== expected) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic parent ordinal to be ${expected}.`
    );
  }
}

function normalizePrivateToJSONParentOrdinal(value) {
  if (value === null) {
    return null;
  }
  if (Number.isInteger(value) && value >= 0) {
    return value;
  }
  throwPrivateToJSONSerializationError(
    'Expected private JSON diagnostic parent ordinal to be null or a non-negative integer.'
  );
}

function normalizePrivateToJSONChildOrdinals(value) {
  if (!Array.isArray(value)) {
    throwPrivateToJSONSerializationError(
      'Expected private JSON diagnostic child ordinals to be an array.'
    );
  }
  for (const ordinal of value) {
    if (!Number.isInteger(ordinal) || ordinal < 0) {
      throwPrivateToJSONSerializationError(
        'Expected private JSON diagnostic child ordinal to be a non-negative integer.'
      );
    }
  }
  return value.slice();
}

function assertPrivateToJSONChildOrdinals(record, expected) {
  const actual = readPrivateToJSONArrayField(
    record,
    'childOrdinals',
    'child_ordinals'
  );
  if (
    actual.length !== expected.length ||
    actual.some((ordinal, index) => ordinal !== expected[index])
  ) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic child ordinals to be [${expected.join(',')}].`
    );
  }
}

function assertPrivateToJSONVisibleAttached(record, label) {
  const hidden = readPrivateToJSONField(record, 'hidden');
  const detached = readPrivateToJSONField(record, 'detached');
  if (hidden === true || detached === true) {
    throwPrivateToJSONSerializationError(
      `Private JSON diagnostic ${label} is hidden or detached.`
    );
  }
}

function assertPrivateToJSONPublicBlockers(blockers) {
  for (const [camelName, snakeName] of [
    ['jsonMethodBlocked', 'json_method_blocked'],
    ['treeMethodBlocked', 'tree_method_blocked'],
    ['instanceWrapperBlocked', 'instance_wrapper_blocked'],
    ['jsFacadeRoutingBlocked', 'js_facade_routing_blocked'],
    ['publicActBlocked', 'public_act_blocked'],
    ['compatibilityClaimBlocked', 'compatibility_claim_blocked']
  ]) {
    if (readPrivateToJSONField(blockers, camelName, snakeName) !== true) {
      throwPrivateToJSONSerializationError(
        `Expected private JSON public blocker ${camelName} to be true.`
      );
    }
  }
}

function createPrivateToJSONPublicBlockerRecord() {
  return freezeRecord({
    jsonMethodBlocked: true,
    treeMethodBlocked: true,
    instanceWrapperBlocked: true,
    jsFacadeRoutingBlocked: true,
    publicActBlocked: true,
    compatibilityClaimBlocked: true
  });
}

function assertPrivateToJSONGateIfPresent(gate) {
  if (gate === undefined) {
    return;
  }

  assertPrivateToJSONRecord(gate, 'gate');
  const status = readPrivateToJSONField(gate, 'status');
  if (
    status !== undefined &&
    status !== 'ReadyForPrivateSerializationDiagnostics'
  ) {
    throwPrivateToJSONSerializationError(
      'Private JSON diagnostic gate is not ready for private serialization diagnostics.'
    );
  }

  const requirements = readPrivateToJSONField(gate, 'requirements');
  if (requirements !== undefined) {
    assertPrivateToJSONRecord(requirements, 'gate.requirements');
    for (const [camelName, snakeName] of [
      ['rootCommitDiagnosticsAvailable', 'root_commit_diagnostics_available'],
      ['realHostOutputAvailable', 'real_host_output_available'],
      [
        'committedFiberInspectionAvailable',
        'committed_fiber_inspection_available'
      ]
    ]) {
      if (readPrivateToJSONField(requirements, camelName, snakeName) !== true) {
        throwPrivateToJSONSerializationError(
          `Expected private JSON gate requirement ${camelName} to be true.`
        );
      }
    }
  }

  const hostOutput = readPrivateToJSONField(gate, 'hostOutput', 'host_output');
  if (hostOutput !== undefined) {
    assertPrivateToJSONRecord(hostOutput, 'gate.hostOutput');
    assertPrivateToJSONNumberField(
      hostOutput,
      'containerChildCount',
      'container_child_count',
      1
    );
    assertPrivateToJSONNumberField(hostOutput, 'instanceCount', 'instance_count', 1);
    assertPrivateToJSONNumberField(hostOutput, 'textCount', 'text_count', 1);
    if (
      readPrivateToJSONField(
        hostOutput,
        'realHostOutputAvailable',
        'real_host_output_available'
      ) !== true
    ) {
      throwPrivateToJSONSerializationError(
        'Expected private JSON gate host output to be real and available.'
      );
    }
  }
}

function readPrivateToJSONElementType(component, componentNode) {
  const componentType = normalizePrivateToJSONElementType(
    readPrivateToJSONField(component, 'elementType', 'element_type')
  );
  const nodeType = normalizePrivateToJSONElementType(
    readPrivateToJSONField(componentNode, 'elementType', 'element_type')
  );
  if (componentType !== nodeType) {
    throwPrivateToJSONSerializationError(
      'Private JSON diagnostic component type does not match node type.'
    );
  }
  return componentType;
}

function normalizePrivateToJSONElementType(value) {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (value !== null && typeof value === 'object') {
    for (const key of ['name', 'elementType', 'element_type', 'type']) {
      const maybeName = value[key];
      if (typeof maybeName === 'string' && maybeName.length > 0) {
        return maybeName;
      }
    }
  }

  throwPrivateToJSONSerializationError(
    'Expected private JSON diagnostic host component element type.'
  );
}

function normalizePrivateToJSONProps(props) {
  if (props === undefined || props === null) {
    return freezeRecord({});
  }

  assertPrivateToJSONRecord(props, 'props');
  const normalized = {};
  const attributes = readPrivateToJSONField(props, 'attributes');
  if (attributes !== undefined && attributes !== null) {
    assertPrivateToJSONRecord(attributes, 'props.attributes');
    for (const key of Object.keys(attributes).sort()) {
      assignPrivateToJSONProp(normalized, key, attributes[key]);
    }
  }

  for (const key of Object.keys(props).sort()) {
    if (
      key === 'attributes' ||
      key === 'textContent' ||
      key === 'text_content'
    ) {
      continue;
    }
    assignPrivateToJSONProp(normalized, key, props[key]);
  }

  return freezeRecord(normalized);
}

function assignPrivateToJSONProp(target, key, value) {
  if (key === 'children') {
    return;
  }
  target[key] = value;
}

function readPrivateToJSONEmptyProps(component, componentNode) {
  const componentProps = normalizePrivateToJSONEmptyProps(
    readPrivateToJSONField(component, 'props')
  );
  const nodeProps = normalizePrivateToJSONEmptyProps(
    readPrivateToJSONField(componentNode, 'props')
  );
  if (JSON.stringify(componentProps) !== JSON.stringify(nodeProps)) {
    throwPrivateToJSONSerializationError(
      'Private JSON diagnostic component props do not match node props.'
    );
  }
  return componentProps;
}

function normalizePrivateToJSONEmptyProps(props) {
  if (props === undefined || props === null) {
    return freezeRecord({});
  }

  assertPrivateToJSONRecord(props, 'props');

  const attributeMap = readPrivateToJSONField(props, 'attributes');
  const textContent = readPrivateToJSONField(props, 'textContent', 'text_content');
  const keys = Object.keys(props).filter(
    (key) => key !== 'attributes' && key !== 'textContent' && key !== 'text_content'
  );
  const attributesEmpty =
    attributeMap === undefined ||
    (attributeMap !== null &&
      typeof attributeMap === 'object' &&
      !Array.isArray(attributeMap) &&
      Object.keys(attributeMap).length === 0);
  const textContentEmpty = textContent === undefined || textContent === null;

  if (keys.length === 0 && attributesEmpty && textContentEmpty) {
    return freezeRecord({});
  }

  if (Object.keys(props).length === 0) {
    return freezeRecord({});
  }

  throwPrivateToJSONSerializationError(
    'Only the accepted empty-props host component diagnostic can be serialized privately.'
  );
}

function throwPrivateToJSONSerializationError(message) {
  const error = new Error(`[fast-react] ${entrypoint}.create().toJSON private facade ${message}`);
  error.name = 'FastReactTestRendererPrivateToJSONSerializationError';
  error.code = 'FAST_REACT_TEST_RENDERER_PRIVATE_TOJSON_SERIALIZATION';
  error.entrypoint = entrypoint;
  error.exportName = 'create().toJSON';
  error.compatibilityTarget = compatibilityTarget;
  error.publicSerializationAvailable = false;
  error.nativeBridgeAvailable = false;
  error.nativeExecution = false;
  error.compatibilityClaimed = false;
  throw error;
}

function throwPrivateToTreeMetadataError(message) {
  const error = new Error(`[fast-react] ${entrypoint}.create().toTree private metadata ${message}`);
  error.name = 'FastReactTestRendererPrivateToTreeMetadataError';
  error.code = 'FAST_REACT_TEST_RENDERER_PRIVATE_TOTREE_METADATA';
  error.entrypoint = entrypoint;
  error.exportName = 'create().toTree';
  error.compatibilityTarget = compatibilityTarget;
  error.publicTreeAvailable = false;
  error.nativeBridgeAvailable = false;
  error.nativeExecution = false;
  error.compatibilityClaimed = false;
  throw error;
}

function throwPrivateGetInstanceDiagnosticsError(message) {
  const error = new Error(`[fast-react] ${entrypoint}.create().getInstance private diagnostics ${message}`);
  error.name = 'FastReactTestRendererPrivateGetInstanceDiagnosticError';
  error.code = 'FAST_REACT_TEST_RENDERER_PRIVATE_GETINSTANCE_DIAGNOSTIC';
  error.entrypoint = entrypoint;
  error.exportName = 'create().getInstance';
  error.compatibilityTarget = compatibilityTarget;
  error.publicGetInstanceAvailable = false;
  error.nativeBridgeAvailable = false;
  error.nativeExecution = false;
  error.compatibilityClaimed = false;
  throw error;
}

function definePlaceholderMetadata(exportsObject) {
  Object.defineProperties(exportsObject, {
    __FAST_REACT_PLACEHOLDER__: {
      enumerable: false,
      value: true
    },
    __FAST_REACT_ENTRYPOINT__: {
      enumerable: false,
      value: entrypoint
    },
    compatibilityTarget: {
      enumerable: false,
      value: compatibilityTarget
    }
  });

  return exportsObject;
}

function createPlaceholderRenderer(routingGate, element, options, createRequest) {
  const privateRootBridgeState = createPrivateRootBridgeState(
    element,
    options
  );
  const toJSON = createRendererUnsupportedFunction(
    'create().toJSON',
    0,
    'Serialization is intentionally blocked for the public API. The JS facade records and can privately serialize accepted Rust JSON diagnostics, but it has no native bridge, public serializer, or compatibility claim.',
    routingGate,
    undefined,
    () => createRequest
  );
  Object.defineProperty(toJSON, privateToJSONSerializationFacadeSymbol, {
    configurable: false,
    enumerable: false,
    value: createPrivateToJSONSerializationFacade(createRequest),
    writable: false
  });
  const toTree = createRendererUnsupportedFunction(
    'create().toTree',
    0,
    'Fiber tree inspection is intentionally blocked for the public API. The JS facade records private toTree metadata for multi-child host output and a FunctionComponent wrapper above accepted host diagnostics; it has no native bridge, public toTree serializer, or compatibility claim.',
    routingGate,
    undefined,
    () => createRequest
  );
  Object.defineProperty(toTree, privateToTreeHostOutputMetadataSymbol, {
    configurable: false,
    enumerable: false,
    value: createPrivateToTreeHostOutputMetadata(createRequest),
    writable: false
  });
  Object.defineProperty(toTree, privateToTreeFacadeSymbol, {
    configurable: false,
    enumerable: false,
    value: createPrivateToTreeFacade(createRequest),
    writable: false
  });
  const getInstance = createRendererUnsupportedFunction(
    'create().getInstance',
    0,
    'Public instance lookup is intentionally blocked while the private diagnostics record the class-component root shape for getPublicRootInstance; host and function roots remain fail-closed with no public getInstance route.',
    routingGate,
    undefined,
    () => createRequest
  );
  Object.defineProperty(getInstance, privateGetInstanceDiagnosticsSymbol, {
    configurable: false,
    enumerable: false,
    value: createPrivateGetInstanceClassRootDiagnostics(createRequest),
    writable: false
  });
  const unstableFlushSync = createRendererUnsupportedFunction(
    'create().unstable_flushSync',
    1,
    'Synchronous flushing is intentionally blocked until react-test-renderer act and scheduler integration are wired.',
    routingGate,
    undefined,
    () => createRequest
  );
  Object.defineProperty(
    unstableFlushSync,
    privateFlushSyncActRoutingDiagnosticsSymbol,
    {
      configurable: false,
      enumerable: false,
      value: createPrivateFlushSyncActRoutingDiagnostics(createRequest),
      writable: false
    }
  );
  const renderer = {
    _Scheduler: schedulerPlaceholder,
    root: undefined,
    toJSON,
    toTree,
    update: createRendererUnsupportedFunction(
      'create().update',
      1,
      'Root updates are intentionally blocked until the JavaScript facade can route through the Rust TestRendererRoot.',
      routingGate,
      (args) =>
        createPrivateRootUpdateDiagnostics(privateRootBridgeState, args[0]),
      (args) =>
        testRendererRootRequestBridge.updateRendererRootRequest(
          renderer,
          args[0]
        )
    ),
    unmount: createRendererUnsupportedFunction(
      'create().unmount',
      0,
      'Root unmount is intentionally blocked until the JavaScript facade can route through the Rust TestRendererRoot.',
      routingGate,
      () => createPrivateRootUnmountDiagnostics(privateRootBridgeState),
      () => testRendererRootRequestBridge.unmountRendererRootRequest(renderer)
    ),
    getInstance,
    unstable_flushSync: unstableFlushSync
  };

  rendererRootHandles.set(renderer, createRequest.rootHandle);

  Object.defineProperty(renderer, 'root', {
    configurable: true,
    enumerable: true,
    get() {
      throw createUnsupportedError(
        'create().root',
        'was accessed',
        'TestInstance root access is intentionally blocked until public TestInstance routing is implemented.',
        routingGate,
        undefined,
        undefined,
        createRequest
      );
    }
  });
  Object.defineProperty(renderer, privateTestInstanceWrapperRecordSymbol, {
    configurable: false,
    enumerable: false,
    value: getTestInstanceQueryDiagnosticsForRootRequest(createRequest),
    writable: false
  });
  Object.defineProperty(renderer, privateErrorBoundaryDiagnosticsSymbol, {
    configurable: false,
    enumerable: false,
    value: getPrivateErrorBoundaryDiagnosticsForRootRequest(createRequest),
    writable: false
  });

  return renderer;
}

function create(element, options) {
  const createRequest = testRendererRootRequestBridge.createRootRequest(
    element,
    options
  );
  return createPlaceholderRenderer(
    createRoutingGate,
    element,
    options,
    createRequest
  );
}

exports._Scheduler = schedulerPlaceholder;
exports.act = createUnsupportedFunction(
  'act',
  1,
  'Public act execution is intentionally blocked while the private act scheduler gate only records accepted Scheduler, sync-flush, passive, and root metadata.',
  actSchedulerGate
);
const createExport = defineFunctionShape(create, 'create', 2);
Object.defineProperty(createExport, rootRequestBridgeSymbol, {
  configurable: false,
  enumerable: false,
  value: testRendererRootRequestBridge,
  writable: false
});
exports.create = createExport;
exports.unstable_batchedUpdates = createUnsupportedFunction(
  'unstable_batchedUpdates',
  2
);
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports);
