'use strict';

const compatibilityTarget = 'react-test-renderer@19.2.6';
const entrypoint = 'react-test-renderer';
const placeholderVersion = '0.0.0-fast-react-test-renderer-placeholder';
const unimplementedCode = 'FAST_REACT_UNIMPLEMENTED';
const isProduction = process.env.NODE_ENV === 'production';
const actSchedulerGateStatus =
  'blocked-private-react-test-renderer-act-scheduler-metadata-only';
const createRoutingGateStatus =
  'blocked-missing-react-test-renderer-create-routing-prerequisites';
const actSchedulerMissingBeforeExecution = Object.freeze([
  'public-react-test-renderer-act-queue-drain',
  'public-react-test-renderer-scheduler-flush-execution',
  'public-react-test-renderer-root-sync-flush-route',
  'react-test-renderer-renderer-roots-compatibility-admission',
  'react-test-renderer-passive-effect-callback-execution',
  'react-test-renderer-private-root-request-execution'
]);
const privateActQueueFlushDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__';
const reactCompatibilityTarget = 'react@19.2.6';
const schedulerCompatibilityTarget = 'scheduler@0.27.0';
const privateActQueueTestQueueKind =
  'fast-react.react.private-act-queue-test-queue';
const privateActQueueTestTaskKind =
  'fast-react.react.private-act-queue-test-task';
const privateActQueueTestQueueVersion = 1;
const privateActQueueTestQueueBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-queue'
);
const privateActQueueTestTaskBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-task'
);
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
  })
]);
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
    executesQueuedWork: false,
    executesEffects: false
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
  drainsPublicSchedulerTaskQueue: false,
  drainsPublicReactActQueue: false,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  compatibilityClaimed: false,
  executesQueuedWork: false,
  executesEffects: false,
  invokesActCallback: false,
  describeAcceptedInternalActQueue,
  consumeAcceptedSchedulerActQueueDiagnostics,
  drainAcceptedInternalActQueue:
    consumeAcceptedSchedulerActQueueDiagnostics
});
const acceptedPrivateActFlushPrerequisiteIds = Object.freeze([
  'react-act-private-dispatcher-gate',
  'scheduler-react-act-queue-diagnostic-consumption',
  'scheduler-act-queue-routing-records',
  'scheduler-mock-flush-helper-metadata',
  'sync-flush-act-continuation-records',
  'sync-flush-post-passive-continuation-execution-gate',
  'sync-flush-post-passive-private-execution-metadata',
  'passive-effect-flush-metadata',
  'passive-effect-private-callback-execution-metadata',
  'test-renderer-private-root-output-diagnostics',
  'test-renderer-private-root-request-records'
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
  drainsAcceptedInternalTestQueues: true,
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
    'worker-377-scheduler-act-queue-flush-helper-private'
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
  schedulerMockFlushHelperMetadataAccepted: true,
  rootActRecordsAccepted: true,
  syncFlushActRecordsAccepted: true,
  postPassiveContinuationExecutionGateAccepted: true,
  passiveActFlushMetadataAccepted: true,
  rootRequestRecordsAccepted: true,
  privateFlushExecutionMetadataAccepted: true,
  privateSyncFlushExecutionMetadataAccepted: true,
  privatePassiveCallbackExecutionMetadataAccepted: true,
  privateRootOutputDiagnosticsAccepted: true,
  privateFlushPrerequisitesPresent: true,
  privateFlushExecutionReady: false,
  recognizedReactActPrivateDispatcherRecords: reactActPrivateDispatcherRecords,
  recognizedSchedulerReactActQueueDiagnostics:
    schedulerReactActQueueDiagnosticRecords,
  privateActQueueFlushDiagnostics,
  recognizedSchedulerMockFlushHelpers: schedulerMockFlushHelperMetadata,
  recognizedRootActRecords: rootActSchedulerRecords,
  recognizedSyncFlushActRecords: syncFlushActSchedulerRecords,
  recognizedPassiveActFlushRecords: passiveActFlushRecords,
  recognizedRootActFlushRecords: testRendererRootActFlushRecords,
  acceptedPrivateFlushPrerequisites: acceptedPrivateActFlushPrerequisites,
  blockedPrivateFlushPrerequisites: blockedPrivateActFlushPrerequisites,
  acceptedPrivateFlushPrerequisiteIds: acceptedPrivateActFlushPrerequisiteIds,
  blockedPrivateFlushPrerequisiteIds: blockedPrivateActFlushPrerequisiteIds,
  sideEffectPolicy: actSchedulerSideEffectPolicy,
  missingBeforeExecution: actSchedulerMissingBeforeExecution
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
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::update_host_component_with_text_for_canary',
    'TestRendererRoot::render_and_commit_host_output_update_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_host_output_canary_updates_committed_text_with_update_diagnostics',
    'root_host_output_update_canary_fails_closed_without_committed_output'
  ])
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
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::unmount',
    'TestRendererRoot::render_and_commit_host_output_unmount_for_canary'
  ]),
  acceptedRustTests: Object.freeze([
    'root_host_output_canary_unmounts_committed_output_with_deletion_diagnostics'
  ])
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
const privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName =
  'fast-react-test-renderer.tojson.sibling-text.finished-work-identity';
const privateToJSONSiblingTextFinishedWorkIdentityStatus =
  'private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked';
const privateToJSONSiblingTextJSAdmissionDiagnosticName =
  'fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission';
const privateToJSONSiblingTextJSAdmissionStatus =
  'private-tojson-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked';
const privateToJSONSiblingTextIdentityPublicSurface =
  'create().update -> create().toJSON';
const privateToJSONSiblingTextJSAdmissionResultId =
  'react-test-renderer-private-tojson-sibling-text-js-cjs-admission-result';
const privateToTreeSiblingTextJSAdmissionDiagnosticName =
  'fast-react-test-renderer.totree.sibling-text.private-js-cjs-admission';
const privateToTreeSiblingTextJSAdmissionStatus =
  'private-totree-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked';
const privateToTreeSiblingTextIdentityPublicSurface =
  'create().update -> create().toTree';
const privateToTreeSiblingTextJSAdmissionResultId =
  'react-test-renderer-private-totree-sibling-text-js-cjs-admission-result';
const privateUpdateRouteRootWorkLoopAdmissionId =
  'react-test-renderer-update-route-root-work-loop-private-admission';
const privateUpdateRouteRootWorkLoopAdmissionStatus =
  'accepted-private-update-route-root-work-loop-admission-public-update-blocked';
const privateRootFinishedLanesHandoffDiagnosticName =
  'react-test-renderer-root-finished-lanes-handoff-private-diagnostic';
const privateRootFinishedLanesHandoffStatus =
  'private-root-finished-work-lanes-handoff-public-serialization-native-blocked';
const privateToJSONNativeExecutionRecordKind =
  'FastReactTestRendererPrivateRootExecutionResult';
const privateRootLifecycleExecutionDiagnosticName =
  'fast-react-test-renderer.root.private-lifecycle-execution-evidence';
const privateRootLifecycleExecutionStatus =
  'private-root-lifecycle-host-execution-records-consumed-public-root-native-js-act-scheduler-blocked';
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
  'EmptyRoot'
]);
const privateToJSONNativeExecutionHostOutputRowIds = Object.freeze([
  privateToJSONUpdateHostOutputRowId,
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
  sourceOwnedLifecycleExecutionEvidenceRequiredForUnmountCurrentness: true,
  latestUpdateBeforeUnmountLifecycleRequired: true,
  staleSnapshotRejection: true,
  staleLifecycleExecutionEvidenceRejection: true,
  clonedLifecycleExecutionEvidenceRejection: true,
  crossEntrypointLifecycleExecutionEvidenceRejection: true,
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
  privateUnmountFinishedWorkIdentityGateAvailable: true,
  validatesUpdateRootRequestIdentity: true,
  updateNativeExecutionFinishedWorkIdentityAdmissionWorker:
    'worker-726-test-renderer-update-native-serialization-identity-admission',
  unmountNativeExecutionFinishedWorkIdentityAdmissionWorker:
    'worker-733-test-renderer-unmount-finished-work-identity',
  updateNativeExecutionRequiresFinishedWorkIdentity: true,
  unmountNativeExecutionRequiresFinishedWorkIdentity: true,
  rejectsStaleUpdateFinishedWorkIdentity: true,
  rejectsStaleUnmountFinishedWorkIdentity: true,
  requiresUnmountDeletionCleanupHandoffEvidence: true,
  rejectsMultichildUpdateNativeExecutionIdentityAdmission: true,
  validatesUnmountRootRequestIdentity: true,
  validatesUnmountDeletionAndCleanupHandoffIdentity: true,
  privateFinishedWorkIdentityDiagnosticName:
    privateSerializationFinishedWorkIdentityDiagnosticName,
  privateFinishedWorkIdentityStatus:
    privateSerializationFinishedWorkIdentityStatus,
  consumesCommittedHostRootFinishedWorkIdentity: true,
  consumesCommittedHostRootFinishedWorkLanes: true,
  privateSiblingTextFinishedWorkIdentityGateAvailable: true,
  privateSiblingTextFinishedWorkIdentityDiagnosticName:
    privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName,
  privateSiblingTextFinishedWorkIdentityStatus:
    privateToJSONSiblingTextFinishedWorkIdentityStatus,
  privateSiblingTextJSAdmissionDiagnosticName:
    privateToJSONSiblingTextJSAdmissionDiagnosticName,
  privateSiblingTextJSAdmissionStatus:
    privateToJSONSiblingTextJSAdmissionStatus,
  siblingTextJSAdmissionConsumesDedicatedIdentity: true,
  siblingTextJSAdmissionConsumesRootFinishedLanesHandoff: true,
  siblingTextJSAdmissionConsumesCommittedFiberInspection: true,
  rejectsGenericSiblingTextFinishedWorkIdentity: true,
  rejectsBroadMultichildFinishedWorkIdentity: true,
  rejectsMissingSiblingTextCommittedFiberInspection: true,
  rejectsInvalidSiblingTextCommittedFiberInspection: true,
  privateRootFinishedLanesHandoffGateAvailable: true,
  privateRootFinishedLanesHandoffDiagnosticName,
  privateRootFinishedLanesHandoffStatus,
  requiresRootFinishedLanesHandoffEvidence: true,
  privateRootLifecycleExecutionEvidenceRequired: true,
  privateRootLifecycleExecutionDiagnosticName,
  privateRootLifecycleExecutionStatus,
  requiresLatestUpdateLifecycleBeforeUnmount: true,
  rejectsMissingRootLifecycleExecutionEvidence: true,
  rejectsStaleRootLifecycleExecutionEvidence: true,
  rejectsClonedRootLifecycleExecutionEvidence: true,
  rejectsCrossEntrypointRootLifecycleExecutionEvidence: true,
  rejectsPublicNativePackageRootLifecycleClaims: true,
  rejectsMissingRootFinishedLanesHandoff: true,
  rejectsStaleRootFinishedLanesHandoff: true,
  rejectsPublicNativePackageRootFinishedLanesHandoffClaims: true,
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
    'TestRendererRoot::describe_private_to_json_after_unmount_native_execution_for_canary',
    'TestRendererRoot::describe_private_to_json_finished_work_identity_gate_for_canary',
    'TestRendererPrivateToJsonNativeExecutionEvidence'
  ]),
  nativeExecutionAcceptedRustTests: Object.freeze([
    'root_private_to_json_native_execution_evidence_consumes_create_update_unmount_records',
    'root_private_to_json_update_native_execution_requires_finished_work_identity_gate',
    'root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate',
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
  acceptedUnmountFinishedWorkIdentityWorker:
    'worker-733-test-renderer-unmount-finished-work-identity',
  acceptedUnmountHostOutputUpdateKindForFinishedWorkIdentity: 'Unmount',
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
    'TestRendererRoot::describe_private_to_json_unmount_finished_work_identity_gate_for_canary',
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
    'root_private_to_json_unmount_finished_work_identity_gate_accepts_ref_passive_cleanup_handoff',
    'root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate',
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
  multiChildNativeExecutionEvidenceWorker: null,
  multiChildNativeExecutionEvidenceAvailable: false,
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
  privateUnmountFinishedWorkIdentityGateAvailable: true,
  validatesUpdateRootRequestIdentity: true,
  updateNativeExecutionFinishedWorkIdentityAdmissionWorker:
    'worker-726-test-renderer-update-native-serialization-identity-admission',
  unmountNativeExecutionFinishedWorkIdentityAdmissionWorker:
    'worker-733-test-renderer-unmount-finished-work-identity',
  updateNativeExecutionRequiresFinishedWorkIdentity: true,
  unmountNativeExecutionRequiresFinishedWorkIdentity: true,
  rejectsStaleUpdateFinishedWorkIdentity: true,
  rejectsStaleUnmountFinishedWorkIdentity: true,
  requiresUnmountDeletionCleanupHandoffEvidence: true,
  rejectsMultichildUpdateNativeExecutionIdentityAdmission: true,
  validatesUnmountRootRequestIdentity: true,
  validatesUnmountDeletionAndCleanupHandoffIdentity: true,
  privateFinishedWorkIdentityDiagnosticName:
    privateSerializationFinishedWorkIdentityDiagnosticName,
  privateFinishedWorkIdentityStatus:
    privateSerializationFinishedWorkIdentityStatus,
  consumesCommittedHostRootFinishedWorkIdentity: true,
  consumesCommittedHostRootFinishedWorkLanes: true,
  privateRootFinishedLanesHandoffGateAvailable: true,
  privateRootFinishedLanesHandoffDiagnosticName,
  privateRootFinishedLanesHandoffStatus,
  requiresRootFinishedLanesHandoffEvidence: true,
  privateRootLifecycleExecutionEvidenceRequired: true,
  privateRootLifecycleExecutionDiagnosticName,
  privateRootLifecycleExecutionStatus,
  requiresLatestUpdateLifecycleBeforeUnmount: true,
  rejectsMissingRootLifecycleExecutionEvidence: true,
  rejectsStaleRootLifecycleExecutionEvidence: true,
  rejectsClonedRootLifecycleExecutionEvidence: true,
  rejectsCrossEntrypointRootLifecycleExecutionEvidence: true,
  rejectsPublicNativePackageRootLifecycleClaims: true,
  rejectsMissingRootFinishedLanesHandoff: true,
  rejectsStaleRootFinishedLanesHandoff: true,
  rejectsPublicNativePackageRootFinishedLanesHandoffClaims: true,
  privateSiblingTextFinishedWorkIdentityGateAvailable: true,
  privateSiblingTextFinishedWorkIdentityDiagnosticName:
    privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName,
  privateSiblingTextFinishedWorkIdentityStatus:
    privateToJSONSiblingTextFinishedWorkIdentityStatus,
  privateSiblingTextJSAdmissionDiagnosticName:
    privateToTreeSiblingTextJSAdmissionDiagnosticName,
  privateSiblingTextJSAdmissionStatus:
    privateToTreeSiblingTextJSAdmissionStatus,
  siblingTextJSAdmissionConsumesDedicatedIdentity: true,
  siblingTextJSAdmissionConsumesRootFinishedLanesHandoff: true,
  siblingTextJSAdmissionConsumesCommittedFiberInspection: true,
  rejectsGenericSiblingTextFinishedWorkIdentity: true,
  rejectsBroadMultichildFinishedWorkIdentity: true,
  privateSiblingTextHostOutputRowId: privateToJSONSiblingTextHostOutputRowId,
  privateNativeExecutionFunctionComponentShapeAvailable: true,
  nativeExecutionCompositeAcceptedFiberShape:
    privateToTreeCompositeAcceptedFiberShape,
  nativeExecutionCompositeWorker:
    'worker-698-test-renderer-totree-composite-native-execution',
  acceptedNativeExecutionRecordKind: privateToJSONNativeExecutionRecordKind,
  acceptedNativeExecutionOperations:
    privateToJSONNativeExecutionAcceptedOperations,
  consumesAcceptedNativeCreateUpdateUnmountExecutionRecords: true,
  acceptedUnmountFinishedWorkIdentityWorker:
    'worker-733-test-renderer-unmount-finished-work-identity',
  acceptedUnmountHostOutputUpdateKindForFinishedWorkIdentity: 'Unmount',
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
    'TestRendererRoot::describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary',
    'TestRendererRoot::describe_private_to_tree_finished_work_identity_gate_for_canary',
    'TestRendererRoot::describe_private_to_tree_unmount_finished_work_identity_gate_for_canary',
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
    'root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate',
    'root_private_to_tree_native_execution_evidence_records_composite_host_shape',
    'root_private_to_tree_sibling_text_report_fails_closed_in_generic_finished_work_identity_gate',
    'root_private_to_tree_serialization_finished_work_identity_gate_accepts_committed_handoff',
    'root_private_to_tree_update_serialization_finished_work_identity_gate_accepts_committed_handoff',
    'root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate',
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
const privateTestInstanceWrapperRecordSymbol = Symbol.for(
  'fast.react_test_renderer.private_test_instance_wrapper_record'
);
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
  compatibilityClaimed: false,
  missingPrerequisites: createRoutingMissingPrerequisites,
  prerequisites: createRoutingPrerequisites,
  privateRoutes,
  updatePrivateRoute,
  unmountPrivateRoute,
  updateUnmountRustLifecycleDiagnosticGate,
  privateUpdateUnmountLifecycleDiagnosticsAccepted: true,
  privateUpdateUnmountLifecycleDiagnosticConsumptionAvailable: true,
  toJSONSerializationFacadeGate: toJSONPrivateSerializationFacadeGate,
  toTreeHostOutputMetadataGate: toTreePrivateHostOutputMetadataGate,
  toTreePrivateFacadeGate,
  privateTestInstanceWrapperSkeleton
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
      'worker-208-test-renderer-host-output-canary'
    ]),
    acceptedRustTests: freezeArray([
      'root_create_enqueues_host_root_update_without_host_mutation',
      'root_options_store_strict_mode_and_create_node_mock_without_invocation',
      'root_create_commit_handoff_exposes_visible_callback_snapshot',
      'root_host_output_canary_commits_minimal_host_component_with_text'
    ])
  }),
  update: freezeRecord({
    operation: 'update',
    rootApi: 'TestRendererRoot::update',
    hostOutputCanaryApi:
      'TestRendererRoot::update_host_component_with_text_for_canary',
    hostOutputCommitApi:
      'TestRendererRoot::render_and_commit_host_output_update_for_canary',
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
      'worker-234-test-renderer-host-output-update-unmount-canary'
    ]),
    acceptedRustTests: freezeArray([
      'root_update_reuses_same_fiber_root_and_shared_scheduler_record',
      'root_update_commit_handoff_exposes_visible_callback_snapshot',
      'root_host_output_canary_updates_committed_text_with_update_diagnostics',
      'root_update_after_unmount_does_not_mutate_or_reschedule'
    ])
  }),
  unmount: freezeRecord({
    operation: 'unmount',
    rootApi: 'TestRendererRoot::unmount',
    hostOutputCommitApi:
      'TestRendererRoot::render_and_commit_host_output_unmount_for_canary',
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
      'worker-234-test-renderer-host-output-update-unmount-canary'
    ]),
    acceptedRustTests: freezeArray([
      'root_unmount_enqueues_sync_null_update_before_wrapper_invalidation',
      'root_unmount_commit_handoff_exposes_visible_callback_snapshot',
      'root_host_output_canary_unmounts_committed_output_with_deletion_diagnostics',
      'root_unmount_is_idempotent'
    ])
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
    'worker-265-test-renderer-private-json-ready-diagnostics'
  ]),
  acceptedJsBridgeWorkers: freezeArray([
    'worker-304-test-renderer-js-private-root-request-bridge',
    'worker-306-test-renderer-testinstance-private-wrapper-skeleton',
    'worker-307-test-renderer-update-unmount-private-js-bridge',
    'worker-423-test-renderer-native-root-execution-bridge',
    'worker-426-test-renderer-testinstance-bridge-query'
  ]),
  root: freezeRecord({
    rustType: 'TestRendererRoot',
    rendererType: 'TestRenderer',
    rootStoreType: 'FiberRootStore<TestRenderer>',
    rootTag: 'ConcurrentRoot',
    lifecycleEnum: 'TestRendererRootLifecycle',
    lifecycleValues: freezeArray(['Active', 'UnmountScheduled']),
    optionsType: 'TestRendererOptions',
    rootOptionsType: 'RootOptions'
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
    unmountApi:
      'TestRendererRoot::render_and_commit_host_output_unmount_for_canary',
    diagnostics: 'TestRendererHostOutputDiagnostics',
    fixtureShape: freezeArray(['HostRoot', 'HostComponent', 'HostText']),
    fixtureType: 'span',
    fixtureText: 'hello',
    realHostOutputCanaryAvailable: true,
    generalMutationTraversalAvailable: false
  }),
  privateJson: freezeRecord({
    diagnosticName:
      'fast-react-test-renderer.serialization.private-json-canary',
    report: 'TestRendererPrivateJsonSerializationReport',
    api: 'TestRendererRoot::describe_private_json_serialization_for_canary',
    createApi: 'TestRendererRoot::describe_private_json_serialization_for_canary',
    updateApi:
      'TestRendererRoot::describe_private_json_serialization_after_update_for_canary',
    hostShapeApi:
      'TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics',
    acceptedHostOutputUpdateKinds: freezeArray(['Create', 'Update']),
    acceptedHostRootShapes: freezeArray([
      'EmptyRoot',
      'SingleHostChild',
      'MultipleHostChildren',
      'TextSibling'
    ]),
    propElisionFromSerializedProps: true,
    hostOutputSnapshotFreshnessRequired: true,
    staleSnapshotRejection: true,
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
    error.updatePrivateRoute = routingGate.updatePrivateRoute;
    error.unmountPrivateRoute = routingGate.unmountPrivateRoute;
    error.toJSONSerializationFacadeGate =
      routingGate.toJSONSerializationFacadeGate;
    error.toTreeHostOutputMetadataGate =
      routingGate.toTreeHostOutputMetadataGate;
    error.toTreePrivateFacadeGate = routingGate.toTreePrivateFacadeGate;
  }

  if (privateRootDiagnostics !== undefined) {
    error.privateRootBridgeStatus = privateRootDiagnostics.bridgeStatus;
    error.privateRootCompatibilityStatus =
      privateRootDiagnostics.compatibilityStatus;
    error.privateRootBridgeState = privateRootDiagnostics.bridgeState;
    error.privateRootCreateRequest = privateRootDiagnostics.createRequest;
    error.privateRootRequest = privateRootDiagnostics.request;
    error.privateRootRequestHistory = privateRootDiagnostics.requestHistory;
  }

  if (rootRequest !== undefined) {
    error.rootRequest = rootRequest;
    error.rootRequestStatus = rootRequest.status;
    error.rootRequestExecutionStatus = rootRequest.executionStatus;
    error.rootRequestCompatibilityStatus = rootRequest.compatibilityStatus;
    if (isRootRequestRecord(rootRequest)) {
      error.privateTestInstanceWrapperRecord =
        getTestInstanceQueryDiagnosticsForRootRequest(rootRequest);
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
    requestHistory: Object.freeze(state.history.slice())
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
    queue.drainsAcceptedInternalTestQueues !== true
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
const rootRequestTestInstanceQueryDiagnostics = new WeakMap();
const rootExecutionResults = new WeakSet();
const rootLifecycleExecutionEvidences = new WeakSet();

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
    getTestInstanceQueryDiagnostics(record) {
      return getTestInstanceQueryDiagnosticsForRootRequest(record);
    },
    getRootTestInstanceQueryDiagnostics(rootHandle) {
      const requests = getRootRequestsForHandle(rootHandle);
      return requests.length === 0
        ? null
        : getTestInstanceQueryDiagnosticsForRootRequest(requests[0]);
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
    canConsumePrivateRootLifecycleExecutionEvidence(records) {
      try {
        consumePrivateRootLifecycleExecutionEvidence(records);
        return true;
      } catch (_error) {
        return false;
      }
    },
    consumePrivateRootLifecycleExecutionEvidence(records) {
      return consumePrivateRootLifecycleExecutionEvidence(records);
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
    rustCanaryMetadata: currentRustTestRendererRootCanaryMetadata,
    rustCanaryOperationMetadata: getCurrentRustCanaryOperationMetadata(
      operation
    ),
    canaryShape: freezeRecord({
      rootType: 'TestRendererRoot',
      rootElementHandleType: 'RootElementHandle',
      updateKindEnum: 'TestRendererRootUpdateKind',
      updateKind,
      rootApi,
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
  const executionHandoff =
    handoff === undefined ? createRootExecutionHandoff(record) : handoff;

  const privateUnmountNativeBridgeAdmission =
    record.operation === 'unmount' &&
    (readDiagnosticField(result, [
      'privateUnmountNativeBridgeAdmission',
      'private_unmount_native_bridge_admission',
      'cleanupHandoff',
      'cleanup_handoff',
      'privateUnmountNativeBridgeCleanupHandoff',
      'private_unmount_native_bridge_cleanup_handoff'
    ]) !== undefined)
      ? consumePrivateUnmountNativeBridgeAdmissionForRequest(
          record,
          result,
          consumedLifecycleDiagnostic
        )
      : null;
  const executionResult = freezeRecord({
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
    rootId: record.rootId,
    updateKind: record.updateKind,
    rustOutcome: record.rustOutcome,
    scheduled: record.scheduled,
    rustLifecycleDiagnostic: consumedLifecycleDiagnostic,
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
    privateUnmountNativeBridgeAdmission:
      privateUnmountNativeBridgeAdmission ?? undefined,
    privateUnmountNativeBridgeCleanupHandoff:
      privateUnmountNativeBridgeAdmission === null
        ? undefined
        : privateUnmountNativeBridgeAdmission.cleanupHandoff,
    privateUnmountDeletionCommitHandoff:
      privateUnmountNativeBridgeAdmission === null
        ? undefined
        : privateUnmountNativeBridgeAdmission.deletionCommitHandoff,
    privateUnmountPassiveRefCleanupOrder:
      privateUnmountNativeBridgeAdmission === null
        ? undefined
        : privateUnmountNativeBridgeAdmission.passiveRefCleanupOrder,
    privateUnmountPassiveRefCleanupOrderAvailable:
      privateUnmountNativeBridgeAdmission === null ? undefined : true,
    privateUnmountNativeBridgeCleanupHandoffAvailable:
      privateUnmountNativeBridgeAdmission === null ? undefined : true,
    privateUnmountNativeBridgeAdmissionAvailable:
      privateUnmountNativeBridgeAdmission === null ? undefined : true,
    hostOutputProduced:
      privateUnmountNativeBridgeAdmission === null
        ? false
        : privateUnmountNativeBridgeAdmission.hostOutputProduced === true,
    serializationAvailable: false,
    publicRouteAvailable: false,
    publicCreateUpdateUnmountBehaviorAvailable: false,
    compatibilityClaimed: false
  });
  rootExecutionResults.add(executionResult);
  return executionResult;
}

function consumePrivateRootLifecycleExecutionEvidence(records) {
  const createResult = readLifecycleExecutionResult(records, 'create');
  const updateResult = readLifecycleExecutionResult(records, 'update');
  const unmountResult = readLifecycleExecutionResult(records, 'unmount');

  assertSourceOwnedRootLifecycleExecutionResult(createResult, 'create');
  assertSourceOwnedRootLifecycleExecutionResult(updateResult, 'update');
  assertSourceOwnedRootLifecycleExecutionResult(unmountResult, 'unmount');
  assertRootLifecycleExecutionRowsShareOwner(
    createResult,
    updateResult,
    unmountResult
  );
  assertRootLifecycleExecutionRowsAreCurrent(
    createResult,
    updateResult,
    unmountResult
  );

  const operationEvidence = freezeArray([
    createPrivateRootLifecycleExecutionOperationEvidence(createResult),
    createPrivateRootLifecycleExecutionOperationEvidence(updateResult),
    createPrivateRootLifecycleExecutionOperationEvidence(unmountResult)
  ]);

  const evidence = freezeRecord({
    id: privateRootLifecycleExecutionDiagnosticName,
    kind: 'FastReactTestRendererPrivateRootLifecycleExecutionEvidence',
    diagnosticName: privateRootLifecycleExecutionDiagnosticName,
    status: privateRootLifecycleExecutionStatus,
    entrypoint,
    compatibilityTarget,
    publicSurface: 'create() -> create().update -> create().unmount',
    rootId: createResult.rootId,
    rootSequence: createResult.request.rootSequence,
    create: operationEvidence[0],
    update: operationEvidence[1],
    unmount: operationEvidence[2],
    operationEvidence,
    operations: freezeArray(['create', 'update', 'unmount']),
    sourceExecutionRecordIds: freezeArray(
      operationEvidence.map((evidence) => evidence.sourceExecutionRecordId)
    ),
    sourceExecutionStatuses: freezeArray(
      operationEvidence.map((evidence) => evidence.sourceExecutionStatus)
    ),
    requestSequences: freezeRecord({
      create: createResult.requestSequence,
      update: updateResult.requestSequence,
      unmount: unmountResult.requestSequence
    }),
    sourceRendererOwnerAccepted: true,
    sourceLifecycleRowsAccepted: true,
    sourceReconcilerHostExecutionConsumed: true,
    sourceOwnedExecutionAccepted: true,
    createUpdateUnmountEvidenceConsumed: true,
    snapshotProducedFromExecutedState: true,
    hostOutputSnapshotCurrent: true,
    staleRootLifecycleRejection: true,
    clonedExecutionRejection: true,
    crossSurfaceExecutionRejection: true,
    callerBuiltExecutionRejection: true,
    publicRootAvailable: false,
    publicSerializationAvailable: false,
    publicTestInstanceAvailable: false,
    publicActAvailable: false,
    publicSchedulerAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecutionAvailable: false,
    jsPackageCompatibilityAvailable: false,
    compatibilityClaimed: false
  });
  rootLifecycleExecutionEvidences.add(evidence);
  return evidence;
}

function readLifecycleExecutionResult(records, operation) {
  if (Array.isArray(records)) {
    for (let index = records.length - 1; index >= 0; index--) {
      const record = records[index];
      if (record && record.operation === operation) {
        return record;
      }
    }
    return undefined;
  }
  if (records !== null && typeof records === 'object') {
    return records[operation];
  }
  return undefined;
}

function assertSourceOwnedRootLifecycleExecutionResult(result, operation) {
  if (result === null || typeof result !== 'object') {
    throwInvalidRootRequest(
      `Expected source-owned ${operation} private root lifecycle execution result.`
    );
  }
  if (
    result.kind !== privateToJSONNativeExecutionRecordKind ||
    result.status !== 'accepted-private-test-renderer-root-execution-result'
  ) {
    throwInvalidRootRequest(
      'Expected a FastReactTestRendererPrivateRootExecutionResult lifecycle row.'
    );
  }
  if (!rootExecutionResults.has(result)) {
    throwInvalidRootRequest(
      'Expected source-owned private root lifecycle execution row.'
    );
  }
  if (!isRootRequestRecord(result.request)) {
    throwInvalidRootRequest(
      'Expected lifecycle execution row to carry a private root request.'
    );
  }
  if (result.operation !== operation || result.request.operation !== operation) {
    throwInvalidRootRequest(
      `Expected ${operation} lifecycle execution row, found ${String(result.operation)}.`
    );
  }
  if (
    result.handoff === undefined ||
    result.handoff.requestId !== result.requestId ||
    result.handoff.requestSequence !== result.requestSequence ||
    result.handoff.rootId !== result.rootId
  ) {
    throwInvalidRootRequest(
      'Expected lifecycle execution handoff to belong to the execution request.'
    );
  }
  if (
    result.requestId !== result.request.requestId ||
    result.requestSequence !== result.request.requestSequence ||
    result.rootId !== result.request.rootId ||
    result.updateKind !== result.request.updateKind ||
    result.rustOutcome !== result.request.rustOutcome ||
    result.scheduled !== true ||
    result.privateRootRequestExecution !== true ||
    result.rustRootExecutionBridgeStatus !==
      'admitted-private-test-renderer-native-root-execution-bridge' ||
    result.rustRootExecutionBoundaryCalled !== true ||
    result.rustExecution !== true ||
    result.reconcilerExecution !== true
  ) {
    throwInvalidRootRequest(
      'Expected accepted private root lifecycle execution evidence.'
    );
  }
  if (
    result.serializationAvailable !== false ||
    result.publicRouteAvailable !== false ||
    result.publicCreateUpdateUnmountBehaviorAvailable !== false ||
    result.nativeAddonLoaded === true ||
    result.nativeBridgeAvailable === true ||
    result.nativeExecution === true ||
    result.compatibilityClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Private root lifecycle execution evidence cannot claim public or native compatibility.'
    );
  }
}

function assertRootLifecycleExecutionRowsShareOwner(
  createResult,
  updateResult,
  unmountResult
) {
  const rootHandle = createResult.request.rootHandle;
  if (
    updateResult.request.rootHandle !== rootHandle ||
    unmountResult.request.rootHandle !== rootHandle ||
    updateResult.rootId !== createResult.rootId ||
    unmountResult.rootId !== createResult.rootId ||
    updateResult.entrypoint !== createResult.entrypoint ||
    unmountResult.entrypoint !== createResult.entrypoint
  ) {
    throwInvalidRootRequest(
      'Private root lifecycle execution rows must belong to the same renderer root.'
    );
  }
  if (
    !(
      createResult.requestSequence < updateResult.requestSequence &&
      updateResult.requestSequence < unmountResult.requestSequence
    )
  ) {
    throwInvalidRootRequest(
      'Private root lifecycle execution row sequence is stale.'
    );
  }
}

function assertRootLifecycleExecutionRowsAreCurrent(
  createResult,
  updateResult,
  unmountResult
) {
  const handleState = assertPrivateRootHandle(createResult.request.rootHandle);
  const requests = handleState.requests;
  const createIndex = requests.indexOf(createResult.request);
  const updateIndex = requests.indexOf(updateResult.request);
  const unmountIndex = requests.indexOf(unmountResult.request);
  let latestUpdateIndex = -1;
  for (let index = 0; index < unmountIndex; index++) {
    if (requests[index].operation === 'update') {
      latestUpdateIndex = index;
    }
  }
  if (
    createIndex === -1 ||
    updateIndex === -1 ||
    unmountIndex === -1 ||
    requests[0] !== createResult.request ||
    requests[requests.length - 1] !== unmountResult.request ||
    !(createIndex < updateIndex && updateIndex < unmountIndex) ||
    updateIndex !== latestUpdateIndex
  ) {
    throwInvalidRootRequest(
      'Private root lifecycle execution rows are stale for the current renderer root.'
    );
  }
}

function createPrivateRootLifecycleExecutionOperationEvidence(result) {
  const lifecycle = result.rustLifecycleDiagnostic;
  return freezeRecord({
    diagnosticName: privateRootLifecycleExecutionDiagnosticName,
    status: privateRootLifecycleExecutionStatus,
    operation: result.operation,
    publicSurface: publicSurfaceForRootLifecycleOperation(result.operation),
    sourceExecutionRecordId: sourceExecutionRecordIdForRootLifecycleResult(
      result
    ),
    sourceExecutionStatus: sourceExecutionStatusForRootLifecycleResult(result),
    requestId: result.requestId,
    requestSequence: result.requestSequence,
    rootId: result.rootId,
    rootSequence: result.request.rootSequence,
    lifecycle,
    lifecycleStatusBefore: lifecycle.lifecycleStatusBefore,
    lifecycleStatusAfter: lifecycle.lifecycleStatusAfter,
    scheduledUpdateKind: result.updateKind,
    hostOutputUpdateKind: result.updateKind,
    scheduledUpdateSequence: result.requestSequence,
    updateOutcome: result.rustOutcome,
    scheduled: result.scheduled,
    sourceRendererOwnerAccepted: true,
    sourceLifecycleRowAccepted: true,
    sourceReconcilerHostExecutionConsumed: true,
    snapshotProducedFromExecutedState: true,
    hostOutputSnapshotCurrent: true,
    sourceOwnedExecutionAccepted: true,
    publicRootAvailable: false,
    publicSerializationAvailable: false,
    publicTestInstanceAvailable: false,
    publicActAvailable: false,
    publicSchedulerAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecutionAvailable: false,
    jsPackageCompatibilityAvailable: false,
    compatibilityClaimed: false
  });
}

function publicSurfaceForRootLifecycleOperation(operation) {
  switch (operation) {
    case 'create':
      return 'create()';
    case 'update':
      return 'create().update';
    case 'unmount':
      return 'create().unmount';
  }
  throwInvalidRootRequest(
    `Unsupported private root lifecycle operation: ${String(operation)}.`
  );
}

function sourceExecutionRecordIdForRootLifecycleResult(result) {
  if (result.privateCreateNativeBridgeHostOutputHandoff != null) {
    return result.privateCreateNativeBridgeHostOutputHandoff.id;
  }
  if (result.privateUpdateNativeBridgeAdmission != null) {
    return result.privateUpdateNativeBridgeAdmission.id;
  }
  if (result.privateUnmountNativeBridgeAdmission != null) {
    return result.privateUnmountNativeBridgeAdmission.id;
  }
  return result.requestId;
}

function sourceExecutionStatusForRootLifecycleResult(result) {
  if (result.privateCreateNativeBridgeHostOutputHandoff != null) {
    return result.privateCreateNativeBridgeHostOutputHandoff.status;
  }
  if (result.privateUpdateNativeBridgeAdmission != null) {
    return result.privateUpdateNativeBridgeAdmission.status;
  }
  if (result.privateUnmountNativeBridgeAdmission != null) {
    return result.privateUnmountNativeBridgeAdmission.status;
  }
  return result.status;
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
  if (
    record.rustOutcome ===
      testRendererRootUpdateOutcomeAlreadyUnmountScheduled ||
    record.scheduled !== true
  ) {
    throwInvalidRootRequest(
      'Private unmount native bridge admission requires a scheduled unmount request.'
    );
  }

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
    rustLifecycleDiagnostic: acceptedLifecycleDiagnostic
  });
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
      'Expected a private unmount deletion commit handoff diagnostic object.'
    );
  }

  const blockers = readDiagnosticField(handoff, [
    'hostChildDetachmentBlockers',
    'host_child_detachment_blockers'
  ]);
  const passiveRefCleanupOrder = readDiagnosticField(handoff, [
    'passiveRefCleanupOrder',
    'passiveRefCleanupOrderEvidence',
    'passive_ref_cleanup_order',
    'passive_ref_cleanup_order_evidence'
  ]);
  if (blockers === null || typeof blockers !== 'object') {
    throwInvalidRootRequest(
      'Expected private unmount deletion handoff cleanup blocker metadata.'
    );
  }
  if (
    passiveRefCleanupOrder === null ||
    typeof passiveRefCleanupOrder !== 'object'
  ) {
    throwInvalidRootRequest(
      'Expected private unmount deletion handoff passive/ref cleanup order evidence.'
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
      'root_request_id',
      'requestId',
      'request_id'
    ]),
    requestSequence: readDiagnosticField(handoff, [
      'rootRequestSequence',
      'root_request_sequence',
      'requestSequence',
      'request_sequence'
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
        'updateKind',
        'update_kind'
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
    renderCurrentMatchesCommitPreviousCurrent:
      readBooleanDiagnosticField(handoff, [
        'renderCurrentMatchesCommitPreviousCurrent',
        'render_current_matches_commit_previous_current'
      ]),
    renderFinishedWorkMatchesCommitCurrent:
      readBooleanDiagnosticField(handoff, [
        'renderFinishedWorkMatchesCommitCurrent',
        'render_finished_work_matches_commit_current'
      ]),
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
    publicHostTeardownCompatibilityClaimed:
      readBooleanDiagnosticField(handoff, [
        'publicHostTeardownCompatibilityClaimed',
        'public_host_teardown_compatibility_claimed'
      ]),
    actFlushingClaimed: readBooleanDiagnosticField(handoff, [
      'actFlushingClaimed',
      'act_flushing_claimed'
    ]),
    hostChildDetachmentBlockers:
      normalizeAcceptedRustUnmountCleanupBlockers(blockers),
    passiveRefCleanupOrder:
      normalizeAcceptedRustUnmountPassiveRefCleanupOrder(
        passiveRefCleanupOrder
      )
  });
}

function normalizeAcceptedRustUnmountNativeBridgeCleanupHandoff(evidence) {
  if (evidence === null || typeof evidence !== 'object') {
    throwInvalidRootRequest(
      'Expected private unmount native bridge cleanup handoff evidence.'
    );
  }

  const cleanupHandoff =
    readDiagnosticField(evidence, [
      'privateUnmountNativeBridgeCleanupHandoff',
      'unmountNativeBridgeCleanupHandoff',
      'rustUnmountCleanupHandoff',
      'cleanupHandoff',
      'unmount_cleanup_handoff'
    ]) ?? evidence;
  if (cleanupHandoff === null || typeof cleanupHandoff !== 'object') {
    throwInvalidRootRequest(
      'Expected a private unmount native bridge cleanup handoff diagnostic object.'
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
      ])
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
    requestSequence: readDiagnosticField(cleanupHandoff, [
      'rootRequestSequence',
      'root_request_sequence',
      'requestSequence',
      'request_sequence'
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
        'updateKind',
        'update_kind'
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
    currentRootChildCount: readNonNegativeDiagnosticInteger(
      cleanupHandoff,
      ['currentRootChildCount', 'current_root_child_count']
    ),
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
    refCleanupReturnCount: readNonNegativeDiagnosticInteger(cleanupHandoff, [
      'refCleanupReturnCount',
      'ref_cleanup_return_count'
    ]),
    passiveDestroyCount: readNonNegativeDiagnosticInteger(cleanupHandoff, [
      'passiveDestroyCount',
      'passive_destroy_count'
    ]),
    cleanupOrderRecordCount: readNonNegativeDiagnosticInteger(
      cleanupHandoff,
      ['cleanupOrderRecordCount', 'cleanup_order_record_count']
    ),
    nativeCleanupAfterRefAndPassiveOrdering:
      readBooleanDiagnosticField(cleanupHandoff, [
        'nativeCleanupAfterRefAndPassiveOrdering',
        'native_cleanup_after_ref_and_passive_ordering'
      ]),
    minimalTreeCleanupHandoff: readBooleanDiagnosticField(cleanupHandoff, [
      'minimalTreeCleanupHandoff',
      'minimal_tree_cleanup_handoff'
    ]),
    rustUnmountCleanupHandoffExecuted:
      readBooleanDiagnosticField(cleanupHandoff, [
        'rustUnmountCleanupHandoffExecuted',
        'rust_unmount_cleanup_handoff_executed'
      ]),
    hostOutputProduced: readBooleanDiagnosticField(cleanupHandoff, [
      'hostOutputProduced',
      'host_output_produced'
    ]),
    publicUnmountCompatibilityClaimed:
      readBooleanDiagnosticField(cleanupHandoff, [
        'publicUnmountCompatibilityClaimed',
        'public_unmount_compatibility_claimed'
      ]),
    publicHostTeardownCompatibilityClaimed:
      readBooleanDiagnosticField(cleanupHandoff, [
        'publicHostTeardownCompatibilityClaimed',
        'public_host_teardown_compatibility_claimed'
      ]),
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
      'Expected private unmount passive/ref cleanup order evidence.'
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
    refCleanupReturnPrecedesPassiveDestroy:
      readBooleanDiagnosticField(evidence, [
        'refCleanupReturnPrecedesPassiveDestroy',
        'ref_cleanup_return_precedes_passive_destroy'
      ]),
    hostCleanupFollowsRefCleanupReturn: readBooleanDiagnosticField(evidence, [
      'hostCleanupFollowsRefCleanupReturn',
      'host_cleanup_follows_ref_cleanup_return'
    ]),
    hostCleanupFollowsPassiveDestroy: readBooleanDiagnosticField(evidence, [
      'hostCleanupFollowsPassiveDestroy',
      'host_cleanup_follows_passive_destroy'
    ]),
    nativeCleanupAfterRefAndPassiveOrdering:
      readBooleanDiagnosticField(evidence, [
        'nativeCleanupAfterRefAndPassiveOrdering',
        'native_cleanup_after_ref_and_passive_ordering'
      ]),
    minimalTreeOrderingIsHostCleanupOnly:
      readBooleanDiagnosticField(evidence, [
        'minimalTreeOrderingIsHostCleanupOnly',
        'minimal_tree_ordering_is_host_cleanup_only'
      ]),
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
    publicRefOrEffectCompatibilityClaimed:
      readBooleanDiagnosticField(evidence, [
        'publicRefOrEffectCompatibilityClaimed',
        'public_ref_or_effect_compatibility_claimed'
      ]),
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
  if (
    handoff.diagnosticId !== privateUnmountDeletionCommitHandoffDiagnosticId ||
    handoff.status !== privateUnmountDeletionCommitHandoffStatus ||
    handoff.requestId !== record.requestId ||
    handoff.requestSequence !== record.requestSequence ||
    handoff.rootId !== record.rootId ||
    handoff.lifecycle !== toRustLifecycleStatus(record.lifecycleStatusAfter) ||
    handoff.lifecycle !== testRendererRootLifecycleUnmountScheduled ||
    handoff.scheduledUpdateKind !== testRendererRootUpdateKindUnmount ||
    record.updateKind !== testRendererRootUpdateKindUnmount ||
    handoff.scheduledElementIsNone !== true ||
    record.rootElementHandle.isNone !== true
  ) {
    throwInvalidRootRequest(
      'Private unmount deletion handoff does not match the private request.'
    );
  }
  if (
    handoff.commitCurrentIsStoreCurrent !== true ||
    handoff.renderCurrentMatchesCommitPreviousCurrent !== true ||
    handoff.renderFinishedWorkMatchesCommitCurrent !== true ||
    handoff.deletionListCount < 1 ||
    handoff.deletedRootCount < 1
  ) {
    throwInvalidRootRequest(
      'Private unmount deletion handoff is stale or missing deletion evidence.'
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
      'Private unmount deletion handoff must not claim public compatibility.'
    );
  }
}

function assertAcceptedRustUnmountNativeBridgeCleanupHandoffMatchesRequest(
  record,
  cleanupHandoff
) {
  if (
    cleanupHandoff.diagnosticId !==
      privateUnmountNativeBridgeCleanupHandoffDiagnosticId ||
    cleanupHandoff.status !== privateUnmountNativeBridgeCleanupHandoffStatus ||
    cleanupHandoff.requestId !== record.requestId ||
    cleanupHandoff.requestSequence !== record.requestSequence ||
    cleanupHandoff.rootId !== record.rootId ||
    cleanupHandoff.routeOutcome !== testRendererRootUpdateOutcomeScheduled ||
    cleanupHandoff.lifecycle !== toRustLifecycleStatus(record.lifecycleStatusAfter) ||
    cleanupHandoff.scheduledUpdateKind !== testRendererRootUpdateKindUnmount ||
    cleanupHandoff.scheduledElementIsNone !== true ||
    cleanupHandoff.routeDependencyId !==
      'react-test-renderer-unmount-route-private-diagnostic' ||
    cleanupHandoff.deletionCommitHandoffId !==
      privateUnmountDeletionCommitHandoffDiagnosticId ||
    cleanupHandoff.admissionDiagnosticId !==
      privateUnmountNativeBridgeAdmissionDiagnosticId
  ) {
    throwInvalidRootRequest(
      'Private unmount cleanup handoff does not describe the accepted native bridge admission.'
    );
  }
  assertPrivateUnmountPassiveRefCleanupOrderPresent(cleanupHandoff);
  const hostOnlyCleanupVariant =
    cleanupHandoff.minimalTreeCleanupHandoff === true &&
    cleanupHandoff.hostNodeCleanupCount === 2 &&
    cleanupHandoff.refCleanupReturnCount === 0 &&
    cleanupHandoff.passiveDestroyCount === 0 &&
    cleanupHandoff.cleanupOrderRecordCount === 2 &&
    cleanupHandoff.nativeCleanupAfterRefAndPassiveOrdering === true &&
    cleanupHandoff.passiveRefCleanupOrder
      .minimalTreeOrderingIsHostCleanupOnly === true;
  const refPassiveCleanupVariant =
    cleanupHandoff.minimalTreeCleanupHandoff === false &&
    cleanupHandoff.hostNodeCleanupCount === 2 &&
    cleanupHandoff.refCleanupReturnCount === 1 &&
    cleanupHandoff.passiveDestroyCount === 1 &&
    cleanupHandoff.cleanupOrderRecordCount === 4 &&
    cleanupHandoff.nativeCleanupAfterRefAndPassiveOrdering === true &&
    cleanupHandoff.passiveRefCleanupOrder
      .minimalTreeOrderingIsHostCleanupOnly === false;
  if (
    cleanupHandoff.previousRootChildCount !== 1 ||
    cleanupHandoff.currentRootChildCount !== 0 ||
    cleanupHandoff.detachedInstance !== true ||
    cleanupHandoff.detachedInstanceChildCount !== 0 ||
    (hostOnlyCleanupVariant !== true &&
      refPassiveCleanupVariant !== true)
  ) {
    throwInvalidRootRequest(
      'Private unmount cleanup handoff does not describe an accepted cleanup variant.'
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
      'Private unmount cleanup handoff is missing actual cleanup execution evidence.'
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
      'Private unmount cleanup handoff must not claim public or native compatibility.'
    );
  }
}

function assertPrivateUnmountCleanupBlockersPresent(handoff) {
  if (handoff.hostNodeCleanupCount < 1) {
    throwInvalidRootRequest(
      'Private unmount deletion handoff is missing host cleanup records.'
    );
  }
  if (handoff.cleanupRecordsMatchDeletionCommit !== true) {
    throwInvalidRootRequest(
      'Private unmount deletion handoff cleanup records do not match the commit.'
    );
  }
  const passiveRefCleanupOrder = handoff.passiveRefCleanupOrder;
  const expectedCleanupOrderRecordCount =
    passiveRefCleanupOrder == null
      ? handoff.hostNodeCleanupCount
      : passiveRefCleanupOrder.refCleanupReturnCount +
        passiveRefCleanupOrder.passiveDestroyCount +
        passiveRefCleanupOrder.hostNodeCleanupCount;
  if (handoff.cleanupOrderRecordCount !== expectedCleanupOrderRecordCount) {
    throwInvalidRootRequest(
      'Private unmount deletion handoff cleanup order evidence is incomplete.'
    );
  }

  const blockers = handoff.hostChildDetachmentBlockers;
  if (
    blockers.detachedInstance !== true ||
    blockers.detachedInstanceChildCount !== 0 ||
    blockers.broadHostChildDetachmentBlocked !== true ||
    blockers.hostNodeCleanupInvalidatedCount !==
      handoff.hostNodeCleanupCount ||
    blockers.hostNodeCleanupAlreadyInactiveCount !== 0 ||
    blockers.hostNodeCleanupMissingHostNodeCount !== 0 ||
    blockers.hostNodeCleanupMissingStateNodeCount !== 0 ||
    blockers.publicUnmountCompatibilityClaimed !== false ||
    blockers.publicHostTeardownCompatibilityClaimed !== false ||
    blockers.actFlushingClaimed !== false
  ) {
    throwInvalidRootRequest(
      'Private unmount deletion handoff cleanup blockers are not accepted.'
    );
  }
}

function assertPrivateUnmountPassiveRefCleanupOrderPresent(handoff) {
  const order = handoff.passiveRefCleanupOrder;
  if (order === null || typeof order !== 'object') {
    throwInvalidRootRequest(
      'Private unmount passive/ref cleanup order evidence is missing.'
    );
  }
  if (
    order.diagnosticId !== privateUnmountPassiveRefCleanupOrderDiagnosticId ||
    order.status !== privateUnmountPassiveRefCleanupOrderStatus ||
    order.rootId !== handoff.rootId ||
    order.hostNodeCleanupCount !== handoff.hostNodeCleanupCount ||
    order.cleanupOrderRecordCount !== handoff.cleanupOrderRecordCount ||
    order.cleanupOrderRecordCount !==
      order.refCleanupReturnCount +
        order.passiveDestroyCount +
        order.hostNodeCleanupCount ||
    order.refCleanupReturnPrecedesPassiveDestroy !== true ||
    order.hostCleanupFollowsRefCleanupReturn !== true ||
    order.hostCleanupFollowsPassiveDestroy !== true ||
    order.nativeCleanupAfterRefAndPassiveOrdering !== true
  ) {
    throwInvalidRootRequest(
      'Private unmount passive/ref cleanup order is not accepted.'
    );
  }
  const hostOnlyCleanup =
    order.refCleanupReturnCount === 0 &&
    order.passiveDestroyCount === 0 &&
    order.hostNodeCleanupCount === 2 &&
    order.cleanupOrderRecordCount === 2 &&
    order.firstHostNodeCleanupOrder === 0 &&
    order.lastRefCleanupReturnOrder === null &&
    order.firstPassiveDestroyOrder === null &&
    order.lastPassiveDestroyOrder === null &&
    order.minimalTreeOrderingIsHostCleanupOnly === true;
  const refPassiveCleanup =
    order.refCleanupReturnCount === 1 &&
    order.passiveDestroyCount === 1 &&
    order.hostNodeCleanupCount === 2 &&
    order.cleanupOrderRecordCount === 4 &&
    order.firstHostNodeCleanupOrder === 2 &&
    order.lastRefCleanupReturnOrder === 0 &&
    order.firstPassiveDestroyOrder === 1 &&
    order.lastPassiveDestroyOrder === 1 &&
    order.minimalTreeOrderingIsHostCleanupOnly === false;
  if (hostOnlyCleanup !== true && refPassiveCleanup !== true) {
    throwInvalidRootRequest(
      'Private unmount passive/ref cleanup order does not describe an accepted cleanup variant.'
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
      'Private unmount passive/ref cleanup order must not claim public behavior.'
    );
  }
}

function createPrivateUnmountHostChildDetachmentBlockersGate() {
  return freezeRecord({
    id: 'react-test-renderer-unmount-host-child-detachment-blockers',
    status: 'blocked-public-host-child-detachment-private-cleanup-metadata-only',
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
}

function createPrivateUnmountPassiveRefCleanupOrderGate() {
  return freezeRecord({
    id: privateUnmountPassiveRefCleanupOrderDiagnosticId,
    status: privateUnmountPassiveRefCleanupOrderStatus,
    publicSurface: 'create().unmount',
    deterministic: true,
    acceptedWorker: 'worker-672-test-renderer-unmount-passive-ref-order',
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
}

function createPrivateUnmountDeletionCommitHandoffGate() {
  const passiveRefCleanupOrderGate =
    createPrivateUnmountPassiveRefCleanupOrderGate();

  return freezeRecord({
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
    hostChildDetachmentBlockers:
      createPrivateUnmountHostChildDetachmentBlockersGate(),
    passiveRefCleanupOrderGate,
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
}

function createPrivateUnmountNativeBridgeCleanupHandoffGate() {
  const passiveRefCleanupOrderGate =
    createPrivateUnmountPassiveRefCleanupOrderGate();

  return freezeRecord({
    id: privateUnmountNativeBridgeCleanupHandoffDiagnosticId,
    status: privateUnmountNativeBridgeCleanupHandoffStatus,
    publicSurface: 'create().unmount',
    deterministic: true,
    acceptedWorker: 'worker-672-test-renderer-unmount-passive-ref-order',
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
    deletionCommitHandoffGate: createPrivateUnmountDeletionCommitHandoffGate(),
    passiveRefCleanupOrderGate,
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
}

function createPrivateUnmountNativeBridgeAdmissionGate() {
  const passiveRefCleanupOrderGate =
    createPrivateUnmountPassiveRefCleanupOrderGate();

  return freezeRecord({
    id: privateUnmountNativeBridgeAdmissionDiagnosticId,
    status: privateUnmountNativeBridgeAdmissionStatus,
    publicSurface: 'create().unmount',
    deterministic: true,
    acceptedWorker: 'worker-672-test-renderer-unmount-passive-ref-order',
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
    deletionCommitHandoffGate: createPrivateUnmountDeletionCommitHandoffGate(),
    cleanupHandoffGate: createPrivateUnmountNativeBridgeCleanupHandoffGate(),
    passiveRefCleanupOrderGate,
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
    gate: createPrivateUnmountNativeBridgeAdmissionGate(),
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
  if (!Number.isInteger(value) || value < 0) {
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
  if (!Number.isInteger(value) || value < 0) {
    throwInvalidRootRequest(
      `Expected nullable non-negative integer private unmount diagnostic field: ${names[0]}.`
    );
  }
  return value;
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

  return freezeRecord({
    type: rootOptions === null ? 'null' : typeof rootOptions,
    strictMode: Boolean(isObject && rootOptions.unstable_strictMode),
    hasCreateNodeMock: Boolean(
      isObject && typeof rootOptions.createNodeMock === 'function'
    ),
    concurrentModeRequested: Boolean(
      isObject && rootOptions.unstable_isConcurrent
    )
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
    privateUpdateHostOutputRowId: privateToJSONUpdateHostOutputRowId,
    privateNestedUpdateHostOutputRowId: privateToJSONNestedUpdateHostOutputRowId,
    privateSiblingTextHostOutputRowId: privateToJSONSiblingTextHostOutputRowId,
    privateFinishedWorkIdentityGateAvailable: true,
    privateUpdateFinishedWorkIdentityGateAvailable: true,
    privateUnmountFinishedWorkIdentityGateAvailable: true,
    validatesUpdateRootRequestIdentity: true,
    updateNativeExecutionFinishedWorkIdentityAdmissionWorker:
      toJSONPrivateSerializationFacadeGate.updateNativeExecutionFinishedWorkIdentityAdmissionWorker,
    unmountNativeExecutionFinishedWorkIdentityAdmissionWorker:
      toJSONPrivateSerializationFacadeGate.unmountNativeExecutionFinishedWorkIdentityAdmissionWorker,
    updateNativeExecutionRequiresFinishedWorkIdentity: true,
    unmountNativeExecutionRequiresFinishedWorkIdentity: true,
    rejectsStaleUpdateFinishedWorkIdentity: true,
    rejectsStaleUnmountFinishedWorkIdentity: true,
    requiresUnmountDeletionCleanupHandoffEvidence: true,
    rejectsMultichildUpdateNativeExecutionIdentityAdmission: true,
    validatesUnmountRootRequestIdentity: true,
    validatesUnmountDeletionAndCleanupHandoffIdentity: true,
    privateFinishedWorkIdentityDiagnosticName:
      privateSerializationFinishedWorkIdentityDiagnosticName,
    privateFinishedWorkIdentityStatus:
      privateSerializationFinishedWorkIdentityStatus,
    consumesCommittedHostRootFinishedWorkIdentity: true,
    consumesCommittedHostRootFinishedWorkLanes: true,
    privateSiblingTextFinishedWorkIdentityGateAvailable: true,
    privateSiblingTextFinishedWorkIdentityDiagnosticName:
      privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName,
    privateSiblingTextFinishedWorkIdentityStatus:
      privateToJSONSiblingTextFinishedWorkIdentityStatus,
    privateSiblingTextJSAdmissionDiagnosticName:
      privateToJSONSiblingTextJSAdmissionDiagnosticName,
    privateSiblingTextJSAdmissionStatus:
      privateToJSONSiblingTextJSAdmissionStatus,
    siblingTextJSAdmissionConsumesDedicatedIdentity: true,
    siblingTextJSAdmissionConsumesRootFinishedLanesHandoff: true,
    siblingTextJSAdmissionConsumesCommittedFiberInspection: true,
    rejectsGenericSiblingTextFinishedWorkIdentity: true,
    rejectsBroadMultichildFinishedWorkIdentity: true,
    rejectsMissingSiblingTextCommittedFiberInspection: true,
    rejectsInvalidSiblingTextCommittedFiberInspection: true,
    privateRootFinishedLanesHandoffGateAvailable: true,
    privateRootFinishedLanesHandoffDiagnosticName,
    privateRootFinishedLanesHandoffStatus,
    requiresRootFinishedLanesHandoffEvidence: true,
    privateRootLifecycleExecutionEvidenceRequired: true,
    privateRootLifecycleExecutionDiagnosticName,
    privateRootLifecycleExecutionStatus,
    requiresLatestUpdateLifecycleBeforeUnmount: true,
    rejectsMissingRootLifecycleExecutionEvidence: true,
    rejectsStaleRootLifecycleExecutionEvidence: true,
    rejectsClonedRootLifecycleExecutionEvidence: true,
    rejectsCrossEntrypointRootLifecycleExecutionEvidence: true,
    rejectsPublicNativePackageRootLifecycleClaims: true,
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
    multiChildNativeExecutionEvidenceAvailable:
      toJSONPrivateSerializationFacadeGate.multiChildNativeExecutionEvidenceAvailable,
    mismatchedUpdateUnmountRecordRejection: true,
    mismatchedUpdateShapeRejection: true,
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false,
    canSerializeAcceptedHostOutputDiagnostic(
      report,
      rootLifecycleExecutionEvidence = undefined
    ) {
      try {
        serializePrivateToJSONHostOutputDiagnostic(
          report,
          rootRequest,
          rootLifecycleExecutionEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    serializeAcceptedHostOutputDiagnostic(
      report,
      rootLifecycleExecutionEvidence = undefined
    ) {
      return serializePrivateToJSONHostOutputDiagnostic(
        report,
        rootRequest,
        rootLifecycleExecutionEvidence
      );
    },
    canCreateAcceptedHostOutputDiagnosticResult(
      report,
      rootLifecycleExecutionEvidence = undefined
    ) {
      try {
        createPrivateToJSONHostOutputDiagnosticResult(
          report,
          rootRequest,
          rootLifecycleExecutionEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedHostOutputDiagnosticResult(
      report,
      rootLifecycleExecutionEvidence = undefined
    ) {
      return createPrivateToJSONHostOutputDiagnosticResult(
        report,
        rootRequest,
        rootLifecycleExecutionEvidence
      );
    },
    canCreateAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      finishedWorkIdentityEvidence = undefined,
      rootLifecycleExecutionEvidence = undefined
    ) {
      try {
        createPrivateToJSONNativeExecutionDiagnosticResult(
          rootRequest,
          executionRecord,
          report,
          finishedWorkIdentityEvidence,
          rootLifecycleExecutionEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      finishedWorkIdentityEvidence = undefined,
      rootLifecycleExecutionEvidence = undefined
    ) {
      return createPrivateToJSONNativeExecutionDiagnosticResult(
        rootRequest,
        executionRecord,
        report,
        finishedWorkIdentityEvidence,
        rootLifecycleExecutionEvidence
      );
    },
    canCreateAcceptedSiblingTextDiagnosticResult(
      report,
      siblingTextFinishedWorkIdentityEvidence,
      sourceRootRequest = undefined
    ) {
      try {
        createPrivateToJSONSiblingTextJSAdmissionDiagnosticResult(
          rootRequest,
          report,
          siblingTextFinishedWorkIdentityEvidence,
          sourceRootRequest
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedSiblingTextDiagnosticResult(
      report,
      siblingTextFinishedWorkIdentityEvidence,
      sourceRootRequest = undefined
    ) {
      return createPrivateToJSONSiblingTextJSAdmissionDiagnosticResult(
        rootRequest,
        report,
        siblingTextFinishedWorkIdentityEvidence,
        sourceRootRequest
      );
    },
    canValidateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest = undefined,
      rootLifecycleExecutionEvidence = undefined
    ) {
      try {
        createPrivateSerializationFinishedWorkIdentityGateResult(
          rootRequest,
          'create().toJSON',
          privateToJSONAcceptedDiagnosticName,
          evidence,
          report,
          sourceRootRequest,
          rootLifecycleExecutionEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    validateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest = undefined,
      rootLifecycleExecutionEvidence = undefined
    ) {
      return createPrivateSerializationFinishedWorkIdentityGateResult(
        rootRequest,
        'create().toJSON',
        privateToJSONAcceptedDiagnosticName,
        evidence,
        report,
        sourceRootRequest,
        rootLifecycleExecutionEvidence
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
    canDescribeAcceptedHostOutputDiagnostic(
      report,
      rootLifecycleExecutionEvidence = undefined
    ) {
      try {
        describePrivateToTreeHostOutputDiagnostic(
          report,
          rootRequest,
          rootLifecycleExecutionEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    describeAcceptedHostOutputDiagnostic(
      report,
      rootLifecycleExecutionEvidence = undefined
    ) {
      return describePrivateToTreeHostOutputDiagnostic(
        report,
        rootRequest,
        rootLifecycleExecutionEvidence
      );
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
    privateUnmountFinishedWorkIdentityGateAvailable: true,
    validatesUpdateRootRequestIdentity: true,
    updateNativeExecutionFinishedWorkIdentityAdmissionWorker:
      toTreePrivateFacadeGate.updateNativeExecutionFinishedWorkIdentityAdmissionWorker,
    unmountNativeExecutionFinishedWorkIdentityAdmissionWorker:
      toTreePrivateFacadeGate.unmountNativeExecutionFinishedWorkIdentityAdmissionWorker,
    updateNativeExecutionRequiresFinishedWorkIdentity: true,
    unmountNativeExecutionRequiresFinishedWorkIdentity: true,
    rejectsStaleUpdateFinishedWorkIdentity: true,
    rejectsStaleUnmountFinishedWorkIdentity: true,
    requiresUnmountDeletionCleanupHandoffEvidence: true,
    rejectsMultichildUpdateNativeExecutionIdentityAdmission: true,
    validatesUnmountRootRequestIdentity: true,
    validatesUnmountDeletionAndCleanupHandoffIdentity: true,
    privateFinishedWorkIdentityDiagnosticName:
      privateSerializationFinishedWorkIdentityDiagnosticName,
    privateFinishedWorkIdentityStatus:
      privateSerializationFinishedWorkIdentityStatus,
    consumesCommittedHostRootFinishedWorkIdentity: true,
    consumesCommittedHostRootFinishedWorkLanes: true,
    privateRootFinishedLanesHandoffGateAvailable: true,
    privateRootFinishedLanesHandoffDiagnosticName,
    privateRootFinishedLanesHandoffStatus,
    requiresRootFinishedLanesHandoffEvidence: true,
    privateRootLifecycleExecutionEvidenceRequired: true,
    privateRootLifecycleExecutionDiagnosticName,
    privateRootLifecycleExecutionStatus,
    requiresLatestUpdateLifecycleBeforeUnmount: true,
    rejectsMissingRootLifecycleExecutionEvidence: true,
    rejectsStaleRootLifecycleExecutionEvidence: true,
    rejectsClonedRootLifecycleExecutionEvidence: true,
    rejectsCrossEntrypointRootLifecycleExecutionEvidence: true,
    rejectsPublicNativePackageRootLifecycleClaims: true,
    privateSiblingTextFinishedWorkIdentityGateAvailable: true,
    privateSiblingTextFinishedWorkIdentityDiagnosticName:
      privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName,
    privateSiblingTextFinishedWorkIdentityStatus:
      privateToJSONSiblingTextFinishedWorkIdentityStatus,
    privateSiblingTextJSAdmissionDiagnosticName:
      privateToTreeSiblingTextJSAdmissionDiagnosticName,
    privateSiblingTextJSAdmissionStatus:
      privateToTreeSiblingTextJSAdmissionStatus,
    siblingTextJSAdmissionConsumesDedicatedIdentity: true,
    siblingTextJSAdmissionConsumesRootFinishedLanesHandoff: true,
    siblingTextJSAdmissionConsumesCommittedFiberInspection: true,
    rejectsGenericSiblingTextFinishedWorkIdentity: true,
    rejectsBroadMultichildFinishedWorkIdentity: true,
    privateSiblingTextHostOutputRowId: privateToJSONSiblingTextHostOutputRowId,
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
    canSerializeAcceptedTreeMetadata(
      report,
      rootLifecycleExecutionEvidence = undefined
    ) {
      try {
        serializePrivateToTreeMetadataDiagnostic(
          report,
          rootRequest,
          rootLifecycleExecutionEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    serializeAcceptedTreeMetadata(
      report,
      rootLifecycleExecutionEvidence = undefined
    ) {
      return serializePrivateToTreeMetadataDiagnostic(
        report,
        rootRequest,
        rootLifecycleExecutionEvidence
      );
    },
    canCreateAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      finishedWorkIdentityEvidence = undefined,
      rootLifecycleExecutionEvidence = undefined
    ) {
      try {
        createPrivateToTreeNativeExecutionDiagnosticResult(
          rootRequest,
          executionRecord,
          report,
          finishedWorkIdentityEvidence,
          rootLifecycleExecutionEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      finishedWorkIdentityEvidence = undefined,
      rootLifecycleExecutionEvidence = undefined
    ) {
      return createPrivateToTreeNativeExecutionDiagnosticResult(
        rootRequest,
        executionRecord,
        report,
        finishedWorkIdentityEvidence,
        rootLifecycleExecutionEvidence
      );
    },
    canCreateAcceptedSiblingTextDiagnosticResult(
      report,
      siblingTextFinishedWorkIdentityEvidence,
      sourceRootRequest = undefined
    ) {
      try {
        createPrivateToTreeSiblingTextJSAdmissionDiagnosticResult(
          rootRequest,
          report,
          siblingTextFinishedWorkIdentityEvidence,
          sourceRootRequest
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    createAcceptedSiblingTextDiagnosticResult(
      report,
      siblingTextFinishedWorkIdentityEvidence,
      sourceRootRequest = undefined
    ) {
      return createPrivateToTreeSiblingTextJSAdmissionDiagnosticResult(
        rootRequest,
        report,
        siblingTextFinishedWorkIdentityEvidence,
        sourceRootRequest
      );
    },
    canValidateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest = undefined,
      rootLifecycleExecutionEvidence = undefined
    ) {
      try {
        createPrivateSerializationFinishedWorkIdentityGateResult(
          rootRequest,
          'create().toTree',
          privateToTreeAcceptedDiagnosticName,
          evidence,
          report,
          sourceRootRequest,
          rootLifecycleExecutionEvidence
        );
        return true;
      } catch (_error) {
        return false;
      }
    },
    validateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest = undefined,
      rootLifecycleExecutionEvidence = undefined
    ) {
      return createPrivateSerializationFinishedWorkIdentityGateResult(
        rootRequest,
        'create().toTree',
        privateToTreeAcceptedDiagnosticName,
        evidence,
        report,
        sourceRootRequest,
        rootLifecycleExecutionEvidence
      );
    }
  });
}

function describePrivateToTreeHostOutputDiagnostic(
  report,
  rootRequest = undefined,
  rootLifecycleExecutionEvidence = undefined
) {
  const diagnostic = validatePrivateToTreeHostOutputDiagnostic(report);
  if (rootRequest !== undefined) {
    validatePrivateSerializationHostOutputLifecycleExecutionEvidence(
      'create().toTree',
      rootRequest,
      diagnostic.hostOutputUpdateKind,
      rootLifecycleExecutionEvidence
    );
  }

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

    if (hostOutputUpdateKind === 'Unmount') {
      return validatePrivateToTreeUnmountNativeExecutionDiagnostic(report);
    }

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
      childFiberTags: freezeArray(
        privateToTreeMultiChildAcceptedFiberShape.slice(1)
      ),
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
    hostOutputShape: 'SiblingText',
    rootChildCount,
    sourceFiberCount: componentWrapped
      ? privateToTreeCompositeMultiChildAcceptedFiberShape.length
      : privateToTreeMultiChildAcceptedFiberShape.length,
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
    !Array.isArray(shape) ||
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
    !Array.isArray(shape) ||
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

function serializePrivateToTreeMetadataDiagnostic(
  report,
  rootRequest = undefined,
  rootLifecycleExecutionEvidence = undefined
) {
  const diagnostic = validatePrivateToTreeHostOutputDiagnostic(report);
  if (rootRequest !== undefined) {
    validatePrivateSerializationHostOutputLifecycleExecutionEvidence(
      'create().toTree',
      rootRequest,
      diagnostic.hostOutputUpdateKind,
      rootLifecycleExecutionEvidence
    );
  }

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
  if (diagnostic.hostOutputUpdateKind === 'Unmount') {
    return null;
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

function serializePrivateToJSONHostOutputDiagnostic(
  report,
  rootRequest = undefined,
  rootLifecycleExecutionEvidence = undefined
) {
  const diagnostic = validatePrivateToJSONHostOutputDiagnostic(report);
  if (rootRequest !== undefined) {
    validatePrivateSerializationHostOutputLifecycleExecutionEvidence(
      'create().toJSON',
      rootRequest,
      diagnostic.hostOutputUpdateKind,
      rootLifecycleExecutionEvidence
    );
  }

  return diagnostic.result;
}

function createPrivateToTreeNativeExecutionDiagnosticResult(
  rootRequest,
  executionRecord,
  report,
  finishedWorkIdentityEvidence = undefined,
  rootLifecycleExecutionEvidence = undefined
) {
  const execution = consumeAcceptedToTreeNativeExecutionRecord(
    rootRequest,
    executionRecord
  );
  const finishedWorkIdentity =
    createPrivateSerializationFinishedWorkIdentityGateResult(
      rootRequest,
      'create().toTree',
      privateToTreeAcceptedDiagnosticName,
      finishedWorkIdentityEvidence,
      report,
      execution.request,
      rootLifecycleExecutionEvidence
    );
  validatePrivateUnmountNativeExecutionFinishedWorkIdentity(
    'create().toTree',
    execution,
    finishedWorkIdentity
  );
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

function createPrivateToJSONHostOutputDiagnosticResult(
  report,
  rootRequest = undefined,
  rootLifecycleExecutionEvidenceInput = undefined
) {
  const diagnostic = validatePrivateToJSONHostOutputDiagnostic(report);
  const rootLifecycleExecutionEvidence =
    rootRequest === undefined
      ? null
      : validatePrivateSerializationHostOutputLifecycleExecutionEvidence(
          'create().toJSON',
          rootRequest,
          diagnostic.hostOutputUpdateKind,
          rootLifecycleExecutionEvidenceInput
        );

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
    ...(rootLifecycleExecutionEvidence === null
      ? {}
      : {
          rootLifecycleExecutionEvidence,
          rootLifecycleExecutionDiagnosticName:
            rootLifecycleExecutionEvidence.diagnosticName,
          rootLifecycleExecutionStatus: rootLifecycleExecutionEvidence.status,
          rootLifecycleExecutionEvidenceAccepted: true,
          consumesPrivateRootLifecycleExecutionEvidence: true,
          latestUpdateLifecycleBeforeUnmountAccepted: true
        }),
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
  finishedWorkIdentityEvidence = undefined,
  rootLifecycleExecutionEvidence = undefined
) {
  const execution = consumeAcceptedToJSONNativeExecutionRecord(
    rootRequest,
    executionRecord
  );
  let diagnostic;
  if (
    execution.operation === 'update' &&
    report !== null &&
    typeof report === 'object'
  ) {
    diagnostic = validatePrivateToJSONHostOutputDiagnostic(report);
  }
  const finishedWorkIdentity =
    createPrivateSerializationFinishedWorkIdentityGateResult(
      rootRequest,
      'create().toJSON',
      privateToJSONAcceptedDiagnosticName,
      finishedWorkIdentityEvidence,
      report,
      execution.request,
      rootLifecycleExecutionEvidence
    );
  validatePrivateUnmountNativeExecutionFinishedWorkIdentity(
    'create().toJSON',
    execution,
    finishedWorkIdentity
  );
  if (diagnostic === undefined) {
    diagnostic = validatePrivateToJSONHostOutputDiagnostic(report);
  }
  const expectedHostOutputUpdateKind =
    hostOutputUpdateKindForRootExecutionOperation(execution.operation);

  if (diagnostic.hostOutputUpdateKind !== expectedHostOutputUpdateKind) {
    throwPrivateToJSONSerializationError(
      `Expected private native ${execution.operation} execution to consume ${expectedHostOutputUpdateKind} toJSON evidence.`
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
  if (executionRecord.kind !== privateToJSONNativeExecutionRecordKind) {
    throwPrivateToJSONSerializationError(
      'Expected a FastReactTestRendererPrivateRootExecutionResult record.'
    );
  }
  if (
    executionRecord.status !==
    'accepted-private-test-renderer-root-execution-result'
  ) {
    throwPrivateToJSONSerializationError(
      'Expected an accepted private root execution result status.'
    );
  }
  if (!rootExecutionResults.has(executionRecord)) {
    throwPrivateToJSONSerializationError(
      'Expected a source-owned private native root execution result.'
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
    consumed.requestId !== request.requestId ||
    consumed.requestSequence !== request.requestSequence ||
    consumed.rootId !== request.rootId ||
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
  if (
    consumed.nativeAddonLoaded === true ||
    consumed.nativeBridgeAvailable === true ||
    consumed.nativeExecution === true
  ) {
    throwPrivateToJSONSerializationError(
      'Private native toJSON evidence cannot claim native bridge loading or execution.'
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
  }

  throwPrivateToJSONSerializationError(
    'Expected private native update toJSON evidence to consume an accepted host output row for minimal single-host-text update evidence.'
  );
}

function createPrivateToJSONSiblingTextJSAdmissionDiagnosticResult(
  rootRequest,
  report,
  siblingTextFinishedWorkIdentityEvidence,
  sourceRootRequest = undefined
) {
  const finishedWorkIdentity =
    createPrivateToJSONSiblingTextFinishedWorkIdentityGateResult(
      rootRequest,
      siblingTextFinishedWorkIdentityEvidence,
      report,
      sourceRootRequest
    );
  const diagnostic = validatePrivateToJSONSiblingTextHostOutputDiagnostic(
    report
  );
  if (
    diagnostic.hostOutputUpdateKind !==
      finishedWorkIdentity.hostOutputUpdateKind ||
    diagnostic.hostOutputShape !== finishedWorkIdentity.hostOutputShape ||
    diagnostic.rootChildCount !== finishedWorkIdentity.rootChildCount ||
    diagnostic.sourceNodeCount !== finishedWorkIdentity.sourceNodeCount
  ) {
    throwPrivateToJSONSerializationError(
      'sibling-text-finished-work-identity-source-mismatch'
    );
  }

  return freezeRecord({
    id: privateToJSONSiblingTextJSAdmissionResultId,
    diagnosticName: privateToJSONSiblingTextJSAdmissionDiagnosticName,
    status: privateToJSONSiblingTextJSAdmissionStatus,
    entrypoint,
    publicSurface: privateToJSONSiblingTextIdentityPublicSurface,
    sourceFinishedWorkIdentityDiagnosticName:
      privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName,
    sourceFinishedWorkIdentityStatus:
      privateToJSONSiblingTextFinishedWorkIdentityStatus,
    sourceSerializationDiagnosticName: privateToJSONAcceptedDiagnosticName,
    rootRequest: finishedWorkIdentity.rootRequest,
    rootRequestId: finishedWorkIdentity.rootRequestId,
    rootRequestSequence: finishedWorkIdentity.rootRequestSequence,
    rootRequestOperation: 'update',
    rootId: finishedWorkIdentity.rootId,
    rootFinishedLanesHandoff: finishedWorkIdentity.rootFinishedLanesHandoff,
    rootFinishedLanesHandoffDiagnosticName:
      finishedWorkIdentity.rootFinishedLanesHandoffDiagnosticName,
    rootFinishedLanesHandoffStatus:
      finishedWorkIdentity.rootFinishedLanesHandoffStatus,
    rootFinishedLanesHandoffAccepted: true,
    consumesPrivateRootFinishedLanesHandoffGate: true,
    hostOutputUpdateKind: 'Update',
    hostOutputShape: 'SiblingText',
    rootNodeKind: finishedWorkIdentity.rootNodeKind,
    rootChildCount: 2,
    sourceNodeCount: 3,
    hostOutputRowId: privateToJSONSiblingTextHostOutputRowId,
    hostOutputRow: diagnostic.hostOutputRow,
    result: diagnostic.result,
    committedFiberInspection: diagnostic.committedFiberInspection,
    finishedWorkIdentity,
    consumesPrivateSiblingTextFinishedWorkIdentityGate: true,
    consumesCommittedFiberInspection: true,
    consumesWorker738ReportRow: true,
    consumesPrivateToJSONEvidence: true,
    consumesAcceptedHostOutputRow: true,
    committedFiberInspectionCurrentMatchesCommit: true,
    hostOutputSnapshotCurrent: true,
    siblingTextJSAdmissionAvailable: true,
    genericFinishedWorkIdentityGateAccepted: false,
    broadMultichildIdentityAvailable: false,
    publicToJSONAvailable: false,
    publicToTreeAvailable: false,
    publicTestInstanceAvailable: false,
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeLoadingAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createPrivateToTreeSiblingTextJSAdmissionDiagnosticResult(
  rootRequest,
  report,
  siblingTextFinishedWorkIdentityEvidence,
  sourceRootRequest = undefined
) {
  const finishedWorkIdentity =
    createPrivateToJSONSiblingTextFinishedWorkIdentityGateResult(
      rootRequest,
      siblingTextFinishedWorkIdentityEvidence,
      report,
      sourceRootRequest,
      {
        publicSurface: 'create().toTree',
        sourceReportKind: 'toTree',
        requireRootFinishedLanesHandoff: true
      }
    );
  const diagnostic = validatePrivateToTreeHostOutputDiagnostic(report);
  if (
    diagnostic.kind !== 'multi-child' ||
    diagnostic.hostOutputUpdateKind !==
      finishedWorkIdentity.hostOutputUpdateKind ||
    diagnostic.rootChildCount !== finishedWorkIdentity.rootChildCount ||
    diagnostic.componentWrapped !== true
  ) {
    throwPrivateToTreeMetadataError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }

  return freezeRecord({
    id: privateToTreeSiblingTextJSAdmissionResultId,
    diagnosticName: privateToTreeSiblingTextJSAdmissionDiagnosticName,
    status: privateToTreeSiblingTextJSAdmissionStatus,
    entrypoint,
    publicSurface: privateToTreeSiblingTextIdentityPublicSurface,
    sourceFinishedWorkIdentityDiagnosticName:
      privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName,
    sourceFinishedWorkIdentityStatus:
      privateToJSONSiblingTextFinishedWorkIdentityStatus,
    sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
    sourceJsonDiagnosticName: privateToJSONAcceptedDiagnosticName,
    rootRequest: finishedWorkIdentity.rootRequest,
    rootRequestId: finishedWorkIdentity.rootRequestId,
    rootRequestSequence: finishedWorkIdentity.rootRequestSequence,
    rootRequestOperation: 'update',
    rootId: finishedWorkIdentity.rootId,
    rootFinishedLanesHandoff: finishedWorkIdentity.rootFinishedLanesHandoff,
    rootFinishedLanesHandoffDiagnosticName:
      finishedWorkIdentity.rootFinishedLanesHandoffDiagnosticName,
    rootFinishedLanesHandoffStatus:
      finishedWorkIdentity.rootFinishedLanesHandoffStatus,
    rootFinishedLanesHandoffAccepted: true,
    consumesPrivateRootFinishedLanesHandoffGate: true,
    hostOutputUpdateKind: 'Update',
    hostOutputShape: 'SiblingText',
    rootNodeKind: finishedWorkIdentity.rootNodeKind,
    rootChildCount: 2,
    sourceNodeCount: 3,
    sourceFiberCount: diagnostic.sourceFiberCount,
    hostOutputRowId: privateToJSONSiblingTextHostOutputRowId,
    hostOutputRow: freezeRecord({
      id: privateToJSONSiblingTextHostOutputRowId,
      status: privateToJSONUpdateUnmountRowStatus,
      hostOutputUpdateKind: 'Update',
      hostOutputShape: 'SiblingText'
    }),
    result: serializePrivateToTreeMetadataDiagnostic(report),
    finishedWorkIdentity,
    committedFiberInspection: diagnostic.committedFiberInspection,
    consumesPrivateSiblingTextFinishedWorkIdentityGate: true,
    consumesWorker738ReportRow: true,
    consumesPrivateToTreeEvidence: true,
    consumesAcceptedHostOutputRow: true,
    consumesCommittedFiberInspection: true,
    hostOutputSnapshotCurrent: true,
    siblingTextJSAdmissionAvailable: true,
    functionComponentAboveHostOutputShape: true,
    genericFinishedWorkIdentityGateAccepted: false,
    broadMultichildIdentityAvailable: false,
    publicToJSONAvailable: false,
    publicToTreeAvailable: false,
    publicTestInstanceAvailable: false,
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeLoadingAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createPrivateToJSONSiblingTextFinishedWorkIdentityGateResult(
  rootRequest,
  evidence,
  report,
  sourceRootRequest = undefined,
  options = undefined
) {
  const publicSurface =
    options !== undefined &&
    options !== null &&
    typeof options.publicSurface === 'string'
      ? options.publicSurface
      : privateToJSONSiblingTextIdentityPublicSurface;
  const sourceReportKind =
    options !== undefined &&
    options !== null &&
    options.sourceReportKind === 'toTree'
      ? 'toTree'
      : 'toJSON';
  const throwSiblingTextFinishedWorkIdentityError =
    publicSurface === 'create().toTree'
      ? throwPrivateToTreeMetadataError
      : throwPrivateToJSONSerializationError;
  if (!isRootRequestRecord(rootRequest)) {
    throwSiblingTextFinishedWorkIdentityError(
      'Expected a private root request for sibling-text finished-work identity evidence.'
    );
  }
  if (evidence === null || typeof evidence !== 'object') {
    throwSiblingTextFinishedWorkIdentityError(
      'Expected accepted sibling-text finished-work identity evidence.'
    );
  }
  if (
    readPrivateToJSONField(evidence, 'diagnosticName', 'diagnostic_name') !==
      privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName ||
    readPrivateToJSONField(evidence, 'status') !==
      privateToJSONSiblingTextFinishedWorkIdentityStatus
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-diagnostic-mismatch'
    );
  }

  const normalized =
    normalizePrivateToJSONSiblingTextFinishedWorkIdentityEvidence(evidence);
  if (
    normalized.diagnosticName !==
      privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName ||
    normalized.status !== privateToJSONSiblingTextFinishedWorkIdentityStatus
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-diagnostic-mismatch'
    );
  }
  if (
    normalized.publicSurface !== privateToJSONSiblingTextIdentityPublicSurface ||
    normalized.sourceExecutionRecordId !==
      privateUpdateRouteRootWorkLoopAdmissionId ||
    normalized.sourceExecutionStatus !==
      privateUpdateRouteRootWorkLoopAdmissionStatus ||
    normalized.sourceSerializationDiagnosticName !==
      privateToJSONAcceptedDiagnosticName
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-source-mismatch'
    );
  }

  const identityRootRequest =
    sourceRootRequest === undefined ? rootRequest : sourceRootRequest;
  if (!isRootRequestRecord(identityRootRequest)) {
    throwSiblingTextFinishedWorkIdentityError(
      'Expected a private update root request for sibling-text finished-work identity evidence.'
    );
  }
  if (
    identityRootRequest.rootHandle !== rootRequest.rootHandle ||
    identityRootRequest.rootId !== rootRequest.rootId
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-stale'
    );
  }
  if (
    identityRootRequest.operation !== 'update' ||
    identityRootRequest.scheduled !== true
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-source-mismatch'
    );
  }
  if (
    getLatestScheduledRootRequestForSerializationIdentity(
      identityRootRequest.rootHandle
    ) !== identityRootRequest
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-stale'
    );
  }
  if (
    normalized.rootRequestId !== identityRootRequest.requestId
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-stale'
    );
  }
  if (
    normalized.rootRequestSequence !== identityRootRequest.requestSequence
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-stale'
    );
  }
  if (
    normalized.rootId !== identityRootRequest.rootId
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-stale'
    );
  }

  const rootFinishedLanesHandoff =
    validatePrivateRootFinishedLanesHandoffEvidence(
      publicSurface,
      identityRootRequest,
      normalized,
      evidence
    );
  if (sourceReportKind === 'toTree') {
    validatePrivateToTreeSiblingTextIdentitySourceReport(normalized, report);
  } else {
    validatePrivateToJSONSiblingTextIdentitySourceReport(
      normalized,
      report
    );
  }

  if (
    normalized.worker738ReportRowId !== privateToJSONSiblingTextHostOutputRowId ||
    normalized.hostOutputUpdateKind !== 'Update' ||
    normalized.hostOutputShape !== 'SiblingText' ||
    !isSiblingTextRootNodeKind(normalized.rootNodeKind) ||
    normalized.rootChildCount !== 2 ||
    normalized.sourceNodeCount !== 3
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }
  if (
    normalized.routeHandlesMatchCommittedUpdate !== true ||
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.routeRenderCurrent,
      normalized.renderCurrent
    ) ||
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.routeRenderFinishedWork,
      normalized.renderFinishedWork
    ) ||
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.routeCommitPreviousCurrent,
      normalized.commitPreviousCurrent
    ) ||
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.routeCommitCurrent,
      normalized.commitCurrent
    )
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-route-finished-work-identity-mismatch'
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
      normalized.commitPreviousCurrent,
      normalized.renderCurrent
    ) ||
    normalized.commitCurrentMatchesRenderFinishedWork !== true ||
    normalized.commitPreviousCurrentMatchesRenderCurrent !== true ||
    normalized.reportFinishedWorkMatchesCommitCurrent !== true ||
    normalized.committedFiberInspectionCurrentMatchesCommit !== true
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-mismatch'
    );
  }
  if (
    normalized.renderLanesBits <= 0 ||
    normalized.routeRenderLanesBits !== normalized.renderLanesBits ||
    normalized.routeCommitFinishedLanesBits !==
      normalized.commitFinishedLanesBits ||
    normalized.renderLanesBits !== normalized.commitFinishedLanesBits ||
    normalized.reportFinishedLanesBits !==
      normalized.commitFinishedLanesBits ||
    normalized.commitRemainingLanesBits !== 0 ||
    normalized.commitPendingLanesBits !== 0 ||
    normalized.routeLanesMatchCommittedUpdate !== true ||
    normalized.commitLanesMatchRenderLanes !== true ||
    normalized.reportLanesMatchCommitLanes !== true
  ) {
    throwSiblingTextFinishedWorkIdentityError(
      'sibling-text-finished-work-identity-lane-mismatch'
    );
  }

  for (const fieldName of [
    'committedSiblingTextFiberInspectionAvailable',
    'committedSiblingTextReportShapeAvailable',
    'committedSiblingTextInspectionMatchesOutput',
    'hostOutputSnapshotCurrent',
    'reportHostOutputRowMatchesOutput',
    'reportRootArraySourceNodesMatchCurrentSnapshot',
    'realSiblingTextHandoffAvailable',
    'consumesUpdateRouteAdmission',
    'consumesSiblingTextHostOutput',
    'consumesPrivateToJSONEvidence',
    'consumesWorker738ReportRow',
    'consumesCommittedHostRootFinishedWorkIdentity',
    'consumesCommittedHostRootFinishedWorkLanes',
    'identityAdmissionAvailable'
  ]) {
    if (normalized[fieldName] !== true) {
      throwSiblingTextFinishedWorkIdentityError(
        'sibling-text-finished-work-evidence-not-consumed'
      );
    }
  }
  if (normalized.broadMultichildIdentityAvailable !== false) {
    throwSiblingTextFinishedWorkIdentityError(
      'broad-multichild-identity-unexpectedly-open'
    );
  }
  for (const fieldName of [
    'publicToJSONAvailable',
    'publicToTreeAvailable',
    'publicTestInstanceAvailable',
    'publicSerializationAvailable',
    'publicRouteAvailable',
    'nativeBridgeLoadingAvailable',
    'nativeBridgeAvailable',
    'nativeExecutionAvailable',
    'jsFacadeAvailable',
    'cjsFacadeAvailable',
    'packageCompatibilityClaimed',
    'compatibilityClaimed'
  ]) {
    if (normalized[fieldName] !== false) {
      throwSiblingTextFinishedWorkIdentityError(
        'public-or-native-package-js-compatibility-claim'
      );
    }
  }

  return freezeRecord({
    id: 'react-test-renderer-private-tojson-sibling-text-finished-work-identity-result',
    diagnosticName: privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName,
    status: privateToJSONSiblingTextFinishedWorkIdentityStatus,
    entrypoint,
    publicSurface: privateToJSONSiblingTextIdentityPublicSurface,
    sourceExecutionRecordId: privateUpdateRouteRootWorkLoopAdmissionId,
    sourceExecutionStatus: privateUpdateRouteRootWorkLoopAdmissionStatus,
    sourceSerializationDiagnosticName: privateToJSONAcceptedDiagnosticName,
    worker738ReportRowId: privateToJSONSiblingTextHostOutputRowId,
    rootRequest: identityRootRequest,
    rootRequestId: identityRootRequest.requestId,
    rootRequestSequence: identityRootRequest.requestSequence,
    rootId: identityRootRequest.rootId,
    hostOutputUpdateKind: 'Update',
    hostOutputShape: 'SiblingText',
    rootNodeKind: normalized.rootNodeKind,
    rootChildCount: 2,
    sourceNodeCount: 3,
    rootFinishedLanesHandoff,
    rootFinishedLanesHandoffDiagnosticName:
      rootFinishedLanesHandoff.diagnosticName,
    rootFinishedLanesHandoffStatus: rootFinishedLanesHandoff.status,
    rootFinishedLanesHandoffAccepted: true,
    consumesPrivateRootFinishedLanesHandoffGate: true,
    routeRenderCurrent: normalized.routeRenderCurrent,
    routeRenderFinishedWork: normalized.routeRenderFinishedWork,
    routeCommitPreviousCurrent: normalized.routeCommitPreviousCurrent,
    routeCommitCurrent: normalized.routeCommitCurrent,
    renderCurrent: normalized.renderCurrent,
    renderFinishedWork: normalized.renderFinishedWork,
    commitPreviousCurrent: normalized.commitPreviousCurrent,
    commitCurrent: normalized.commitCurrent,
    reportFinishedWork: normalized.reportFinishedWork,
    routeRenderLanesBits: normalized.routeRenderLanesBits,
    routeCommitFinishedLanesBits:
      normalized.routeCommitFinishedLanesBits,
    renderLanesBits: normalized.renderLanesBits,
    commitFinishedLanesBits: normalized.commitFinishedLanesBits,
    reportFinishedLanesBits: normalized.reportFinishedLanesBits,
    commitRemainingLanesBits: 0,
    commitPendingLanesBits: 0,
    routeHandlesMatchCommittedUpdate: true,
    routeLanesMatchCommittedUpdate: true,
    commitCurrentMatchesRenderFinishedWork: true,
    commitPreviousCurrentMatchesRenderCurrent: true,
    commitLanesMatchRenderLanes: true,
    reportFinishedWorkMatchesCommitCurrent: true,
    reportLanesMatchCommitLanes: true,
    committedFiberInspectionCurrentMatchesCommit: true,
    committedSiblingTextFiberInspectionAvailable: true,
    committedSiblingTextReportShapeAvailable: true,
    committedSiblingTextInspectionMatchesOutput: true,
    hostOutputSnapshotCurrent: true,
    reportHostOutputRowMatchesOutput: true,
    reportRootArraySourceNodesMatchCurrentSnapshot: true,
    realSiblingTextHandoffAvailable: true,
    consumesUpdateRouteAdmission: true,
    consumesSiblingTextHostOutput: true,
    consumesPrivateToJSONEvidence: true,
    consumesWorker738ReportRow: true,
    consumesCommittedHostRootFinishedWorkIdentity: true,
    consumesCommittedHostRootFinishedWorkLanes: true,
    identityAdmissionAvailable: true,
    broadMultichildIdentityAvailable: false,
    publicToJSONAvailable: false,
    publicToTreeAvailable: false,
    publicTestInstanceAvailable: false,
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeLoadingAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecutionAvailable: false,
    jsFacadeAvailable: false,
    cjsFacadeAvailable: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function createPrivateSerializationFinishedWorkIdentityGateResult(
  rootRequest,
  publicSurface,
  sourceSerializationDiagnosticName,
  evidence,
  report,
  sourceRootRequest = undefined,
  rootLifecycleExecutionEvidenceInput = undefined
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
  const rootFinishedLanesHandoff =
    validatePrivateRootFinishedLanesHandoffEvidence(
      publicSurface,
      identityRootRequest,
      normalized,
      evidence
    );
  const unmountHandoffIdentity =
    normalized.hostOutputUpdateKind === 'Unmount'
      ? validatePrivateSerializationUnmountHandoffIdentity(
          publicSurface,
          identityRootRequest,
          evidence
        )
      : null;
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
  const rootLifecycleExecutionEvidence =
    validatePrivateSerializationRootLifecycleExecutionEvidence(
      publicSurface,
      identityRootRequest,
      normalized,
      rootLifecycleExecutionEvidenceInput
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
    rootRequestUpdateKind: identityRootRequest.updateKind,
    rootId: identityRootRequest.rootId,
    hostOutputUpdateKind: normalized.hostOutputUpdateKind,
    rootFinishedLanesHandoff,
    rootFinishedLanesHandoffDiagnosticName:
      rootFinishedLanesHandoff.diagnosticName,
    rootFinishedLanesHandoffStatus: rootFinishedLanesHandoff.status,
    rootFinishedLanesHandoffAccepted: true,
    consumesPrivateRootFinishedLanesHandoffGate: true,
    ...(rootLifecycleExecutionEvidence === null
      ? {}
      : {
          rootLifecycleExecutionEvidence,
          rootLifecycleExecutionDiagnosticName:
            rootLifecycleExecutionEvidence.diagnosticName,
          rootLifecycleExecutionStatus: rootLifecycleExecutionEvidence.status,
          rootLifecycleExecutionEvidenceAccepted: true,
          consumesPrivateRootLifecycleExecutionEvidence: true,
          latestUpdateLifecycleBeforeUnmountAccepted: true
        }),
    ...(unmountHandoffIdentity === null
      ? {}
      : {
          unmountDeletionCommitHandoff:
            unmountHandoffIdentity.deletionCommitHandoff,
          unmountCleanupHandoff: unmountHandoffIdentity.cleanupHandoff,
          unmountDeletionCommitHandoffAccepted: true,
          unmountCleanupHandoffAccepted: true,
          unmountHandoffIdentityAccepted: true,
          cleanupHandoffVariant: unmountHandoffIdentity.cleanupHandoffVariant,
          hostNodeCleanupCount:
            unmountHandoffIdentity.cleanupHandoff.hostNodeCleanupCount,
          refCleanupReturnCount:
            unmountHandoffIdentity.cleanupHandoff.refCleanupReturnCount,
          passiveDestroyCount:
            unmountHandoffIdentity.cleanupHandoff.passiveDestroyCount,
          cleanupOrderRecordCount:
            unmountHandoffIdentity.cleanupHandoff.cleanupOrderRecordCount,
          minimalTreeCleanupHandoff:
            unmountHandoffIdentity.cleanupHandoff.minimalTreeCleanupHandoff
        }),
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

function validatePrivateSerializationRootLifecycleExecutionEvidence(
  publicSurface,
  identityRootRequest,
  identity,
  lifecycleEvidence
) {
  if (identity.hostOutputUpdateKind !== 'Unmount') {
    return null;
  }
  const lifecycle = validatePrivateSerializationLifecycleExecutionEvidence(
    publicSurface,
    identityRootRequest,
    lifecycleEvidence
  );
  if (
    lifecycle.unmountRequest !== identityRootRequest ||
    identity.rootRequestSequence !== lifecycle.unmountRequest.requestSequence
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root lifecycle execution evidence is stale for the current unmount serialization request.'
    );
  }

  return lifecycle.evidence;
}

function validatePrivateSerializationHostOutputLifecycleExecutionEvidence(
  publicSurface,
  rootRequest,
  hostOutputUpdateKind,
  lifecycleEvidence
) {
  if (hostOutputUpdateKind !== 'Unmount') {
    return null;
  }
  const lifecycle = validatePrivateSerializationLifecycleExecutionEvidence(
    publicSurface,
    rootRequest,
    lifecycleEvidence
  );
  if (lifecycle.createRequest !== rootRequest) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root lifecycle execution evidence is stale for the current renderer root.'
    );
  }

  return lifecycle.evidence;
}

function validatePrivateSerializationLifecycleExecutionEvidence(
  publicSurface,
  rootRequest,
  lifecycleEvidence
) {
  if (
    lifecycleEvidence === undefined ||
    lifecycleEvidence === null ||
    typeof lifecycleEvidence !== 'object' ||
    Array.isArray(lifecycleEvidence)
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected source-owned private root lifecycle execution evidence for unmount serialization currentness.'
    );
  }
  if (
    lifecycleEvidence.entrypoint !== entrypoint ||
    lifecycleEvidence.compatibilityTarget !== compatibilityTarget
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root lifecycle execution evidence belongs to a different package entrypoint.'
    );
  }
  if (
    lifecycleEvidence.kind !==
      'FastReactTestRendererPrivateRootLifecycleExecutionEvidence' ||
    lifecycleEvidence.diagnosticName !==
      privateRootLifecycleExecutionDiagnosticName ||
    lifecycleEvidence.status !== privateRootLifecycleExecutionStatus ||
    lifecycleEvidence.publicSurface !==
      'create() -> create().update -> create().unmount'
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root lifecycle execution evidence diagnostic identity is not accepted.'
    );
  }
  if (
    lifecycleEvidence.rootId !== rootRequest.rootId ||
    lifecycleEvidence.rootSequence !== rootRequest.rootSequence
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root lifecycle execution evidence belongs to a foreign root.'
    );
  }
  assertPrivateSerializationRootLifecycleEvidenceDoesNotClaimCompatibility(
    publicSurface,
    lifecycleEvidence
  );

  const requestSequences = lifecycleEvidence.requestSequences;
  if (
    requestSequences === null ||
    typeof requestSequences !== 'object' ||
    Array.isArray(requestSequences)
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected private root lifecycle execution evidence request sequences.'
    );
  }
  const createRequest = findPrivateSerializationLifecycleRequest(
    publicSurface,
    rootRequest.rootHandle,
    'create',
    requestSequences.create
  );
  const updateRequest = findPrivateSerializationLifecycleRequest(
    publicSurface,
    rootRequest.rootHandle,
    'update',
    requestSequences.update
  );
  const unmountRequest = findPrivateSerializationLifecycleRequest(
    publicSurface,
    rootRequest.rootHandle,
    'unmount',
    requestSequences.unmount
  );
  assertPrivateSerializationLifecycleRequestsAreCurrent(
    publicSurface,
    rootRequest.rootHandle,
    createRequest,
    updateRequest,
    unmountRequest
  );
  validatePrivateSerializationRootLifecycleOperationEvidence(
    publicSurface,
    lifecycleEvidence.create,
    createRequest,
    'create'
  );
  validatePrivateSerializationRootLifecycleOperationEvidence(
    publicSurface,
    lifecycleEvidence.update,
    updateRequest,
    'update'
  );
  validatePrivateSerializationRootLifecycleOperationEvidence(
    publicSurface,
    lifecycleEvidence.unmount,
    unmountRequest,
    'unmount'
  );
  if (!rootLifecycleExecutionEvidences.has(lifecycleEvidence)) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected source-owned private root lifecycle execution evidence.'
    );
  }

  return {
    evidence: lifecycleEvidence,
    createRequest,
    updateRequest,
    unmountRequest
  };
}

function findPrivateSerializationLifecycleRequest(
  publicSurface,
  rootHandle,
  operation,
  requestSequence
) {
  if (!Number.isInteger(requestSequence) || requestSequence < 0) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected private root lifecycle execution evidence request sequence.'
    );
  }
  const request = getRootRequestsForHandle(rootHandle).find(
    (candidate) =>
      candidate.requestSequence === requestSequence &&
      candidate.operation === operation
  );
  if (!isRootRequestRecord(request)) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root lifecycle execution evidence is stale for the current renderer root.'
    );
  }
  return request;
}

function assertPrivateSerializationLifecycleRequestsAreCurrent(
  publicSurface,
  rootHandle,
  createRequest,
  updateRequest,
  unmountRequest
) {
  const requests = getRootRequestsForHandle(rootHandle);
  const createIndex = requests.indexOf(createRequest);
  const updateIndex = requests.indexOf(updateRequest);
  const unmountIndex = requests.indexOf(unmountRequest);
  let latestUpdateIndex = -1;
  for (let index = 0; index < unmountIndex; index++) {
    if (requests[index].operation === 'update') {
      latestUpdateIndex = index;
    }
  }
  if (
    createIndex === -1 ||
    updateIndex === -1 ||
    unmountIndex === -1 ||
    requests[0] !== createRequest ||
    requests[requests.length - 1] !== unmountRequest ||
    !(createIndex < updateIndex && updateIndex < unmountIndex) ||
    updateIndex !== latestUpdateIndex
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root lifecycle execution evidence is stale for the current renderer root.'
    );
  }
}

function validatePrivateSerializationRootLifecycleOperationEvidence(
  publicSurface,
  operationEvidence,
  request,
  operation
) {
  if (
    operationEvidence === null ||
    typeof operationEvidence !== 'object' ||
    Array.isArray(operationEvidence)
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected private root lifecycle operation evidence.'
    );
  }
  if (
    operationEvidence.diagnosticName !==
      privateRootLifecycleExecutionDiagnosticName ||
    operationEvidence.status !== privateRootLifecycleExecutionStatus ||
    operationEvidence.operation !== operation ||
    operationEvidence.publicSurface !==
      publicSurfaceForRootLifecycleOperation(operation) ||
    operationEvidence.requestId !== request.requestId ||
    operationEvidence.requestSequence !== request.requestSequence ||
    operationEvidence.rootId !== request.rootId ||
    operationEvidence.rootSequence !== request.rootSequence ||
    operationEvidence.scheduledUpdateKind !== request.updateKind ||
    operationEvidence.hostOutputUpdateKind !== request.updateKind ||
    operationEvidence.scheduledUpdateSequence !== request.requestSequence ||
    operationEvidence.updateOutcome !== request.rustOutcome ||
    operationEvidence.scheduled !== true
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root lifecycle operation evidence does not match the source request.'
    );
  }
  for (const fieldName of [
    'sourceRendererOwnerAccepted',
    'sourceLifecycleRowAccepted',
    'sourceReconcilerHostExecutionConsumed',
    'snapshotProducedFromExecutedState',
    'hostOutputSnapshotCurrent',
    'sourceOwnedExecutionAccepted'
  ]) {
    if (operationEvidence[fieldName] !== true) {
      throwPrivateSerializationFinishedWorkIdentityError(
        publicSurface,
        'Private root lifecycle operation evidence is not accepted.'
      );
    }
  }
  assertPrivateSerializationRootLifecycleEvidenceDoesNotClaimCompatibility(
    publicSurface,
    operationEvidence
  );
}

function assertPrivateSerializationRootLifecycleEvidenceDoesNotClaimCompatibility(
  publicSurface,
  evidence
) {
  for (const fieldName of [
    'publicRootAvailable',
    'publicSerializationAvailable',
    'publicTestInstanceAvailable',
    'publicActAvailable',
    'publicSchedulerAvailable',
    'nativeBridgeAvailable',
    'nativeExecutionAvailable',
    'jsPackageCompatibilityAvailable',
    'compatibilityClaimed'
  ]) {
    if (evidence[fieldName] !== false) {
      throwPrivateSerializationFinishedWorkIdentityError(
        publicSurface,
        'Private root lifecycle execution evidence cannot claim public, native, or package compatibility.'
      );
    }
  }
  for (const fieldName of ['nativeExecution', 'packageCompatibilityClaimed']) {
    if (evidence[fieldName] === true) {
      throwPrivateSerializationFinishedWorkIdentityError(
        publicSurface,
        'Private root lifecycle execution evidence cannot claim public, native, or package compatibility.'
      );
    }
  }
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
    case 'Unmount':
      return 'unmount';
    default:
      throwPrivateSerializationFinishedWorkIdentityError(
        publicSurface,
        'Private serialization finished-work identity host output update kind is not accepted.'
      );
  }
}

function validatePrivateRootFinishedLanesHandoffEvidence(
  publicSurface,
  identityRootRequest,
  identity,
  evidence
) {
  if (
    evidence === null ||
    typeof evidence !== 'object' ||
    !Object.hasOwn(evidence, 'rootFinishedLanesHandoff')
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected canonical private rootFinishedLanesHandoff evidence.'
    );
  }
  const handoff = evidence.rootFinishedLanesHandoff;
  assertPrivateRootFinishedLanesHandoffRecord(
    publicSurface,
    handoff,
    'Expected private root finished_work/finished_lanes handoff evidence.'
  );

  const normalized = freezeRecord({
    diagnosticName: readPrivateRootFinishedLanesHandoffRequiredString(
      publicSurface,
      handoff,
      ['diagnosticName', 'diagnostic_name', 'diagnosticId', 'diagnostic_id', 'id'],
      'diagnostic id'
    ),
    status: readPrivateRootFinishedLanesHandoffRequiredString(
      publicSurface,
      handoff,
      ['status'],
      'status'
    ),
    rootRequestId: readPrivateRootFinishedLanesHandoffRequiredField(
      publicSurface,
      handoff,
      ['rootRequestId', 'root_request_id', 'requestId', 'request_id'],
      'request id'
    ),
    rootRequestSequence:
      readPrivateRootFinishedLanesHandoffRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        [
          'rootRequestSequence',
          'root_request_sequence',
          'requestSequence',
          'request_sequence'
        ],
        'request sequence'
      ),
    rootId: readPrivateRootFinishedLanesHandoffRequiredField(
      publicSurface,
      handoff,
      ['rootId', 'root_id', 'root'],
      'root id'
    ),
    operation: readPrivateRootFinishedLanesHandoffRequiredString(
      publicSurface,
      handoff,
      ['operation', 'rootOperation', 'root_operation'],
      'operation'
    ),
    updateKind: readPrivateRootFinishedLanesHandoffRequiredString(
      publicSurface,
      handoff,
      ['updateKind', 'update_kind', 'scheduledUpdateKind'],
      'update kind'
    ),
    hostOutputUpdateKind: readPrivateRootFinishedLanesHandoffRequiredString(
      publicSurface,
      handoff,
      ['hostOutputUpdateKind', 'host_output_update_kind'],
      'host output update kind'
    ),
    renderCurrent: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateRootFinishedLanesHandoffRequiredField(
        publicSurface,
        handoff,
        ['renderCurrent', 'render_current'],
        'render current'
      ),
      'rootFinishedLanesHandoff.renderCurrent'
    ),
    renderFinishedWork: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateRootFinishedLanesHandoffRequiredField(
        publicSurface,
        handoff,
        ['renderFinishedWork', 'render_finished_work', 'finishedWork', 'finished_work'],
        'render finished_work'
      ),
      'rootFinishedLanesHandoff.renderFinishedWork'
    ),
    commitPreviousCurrent: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateRootFinishedLanesHandoffRequiredField(
        publicSurface,
        handoff,
        ['commitPreviousCurrent', 'commit_previous_current'],
        'commit previous current'
      ),
      'rootFinishedLanesHandoff.commitPreviousCurrent'
    ),
    commitCurrent: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateRootFinishedLanesHandoffRequiredField(
        publicSurface,
        handoff,
        ['commitCurrent', 'commit_current'],
        'commit current'
      ),
      'rootFinishedLanesHandoff.commitCurrent'
    ),
    renderLanesBits: readPrivateRootFinishedLanesHandoffRequiredNonNegativeInteger(
      publicSurface,
      handoff,
      ['renderLanesBits', 'render_lanes_bits'],
      'render lanes bits'
    ),
    commitFinishedLanesBits:
      readPrivateRootFinishedLanesHandoffRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['commitFinishedLanesBits', 'commit_finished_lanes_bits', 'finishedLanesBits', 'finished_lanes_bits'],
        'commit finished lanes bits'
      ),
    commitRemainingLanesBits:
      readPrivateRootFinishedLanesHandoffRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['commitRemainingLanesBits', 'commit_remaining_lanes_bits'],
        'commit remaining lanes bits'
      ),
    commitPendingLanesBits:
      readPrivateRootFinishedLanesHandoffRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['commitPendingLanesBits', 'commit_pending_lanes_bits'],
        'commit pending lanes bits'
      ),
    commitCurrentMatchesRenderFinishedWork:
      readPrivateRootFinishedLanesHandoffRequiredBoolean(
        publicSurface,
        handoff,
        [
          'commitCurrentMatchesRenderFinishedWork',
          'commit_current_matches_render_finished_work'
        ],
        'commit current finished_work match'
      ),
    commitPreviousCurrentMatchesRenderCurrent:
      readPrivateRootFinishedLanesHandoffRequiredBoolean(
        publicSurface,
        handoff,
        [
          'commitPreviousCurrentMatchesRenderCurrent',
          'commit_previous_current_matches_render_current'
        ],
        'commit previous current render current match'
      ),
    commitLanesMatchRenderLanes:
      readPrivateRootFinishedLanesHandoffRequiredBoolean(
        publicSurface,
        handoff,
        ['commitLanesMatchRenderLanes', 'commit_lanes_match_render_lanes'],
        'finished lanes render lanes match'
      ),
    consumesFinishedWork: readPrivateRootFinishedLanesHandoffRequiredBoolean(
      publicSurface,
      handoff,
      ['consumesFinishedWork', 'consumes_finished_work'],
      'finished_work consumption marker'
    ),
    consumesFinishedLanes: readPrivateRootFinishedLanesHandoffRequiredBoolean(
      publicSurface,
      handoff,
      ['consumesFinishedLanes', 'consumes_finished_lanes'],
      'finished_lanes consumption marker'
    ),
    publicSerializationAvailable:
      readPrivateRootFinishedLanesHandoffRequiredBoolean(
        publicSurface,
        handoff,
        ['publicSerializationAvailable', 'public_serialization_available'],
        'public serialization marker'
      ),
    publicRouteAvailable: readPrivateRootFinishedLanesHandoffRequiredBoolean(
      publicSurface,
      handoff,
      ['publicRouteAvailable', 'public_route_available'],
      'public route marker'
    ),
    nativeBridgeAvailable: readPrivateRootFinishedLanesHandoffRequiredBoolean(
      publicSurface,
      handoff,
      ['nativeBridgeAvailable', 'native_bridge_available'],
      'native bridge marker'
    ),
    nativeExecution: readPrivateRootFinishedLanesHandoffRequiredBoolean(
      publicSurface,
      handoff,
      ['nativeExecution', 'native_execution'],
      'native execution marker'
    ),
    packageCompatibilityClaimed:
      readPrivateRootFinishedLanesHandoffRequiredBoolean(
        publicSurface,
        handoff,
        [
          'packageCompatibilityClaimed',
          'package_compatibility_claimed'
        ],
        'package compatibility marker'
      ),
    compatibilityClaimed: readPrivateRootFinishedLanesHandoffRequiredBoolean(
      publicSurface,
      handoff,
      ['compatibilityClaimed', 'compatibility_claimed'],
      'compatibility marker'
    )
  });

  if (
    normalized.diagnosticName !== privateRootFinishedLanesHandoffDiagnosticName ||
    normalized.status !== privateRootFinishedLanesHandoffStatus ||
    normalized.rootRequestId !== identityRootRequest.requestId ||
    normalized.rootRequestSequence !== identityRootRequest.requestSequence ||
    normalized.rootId !== identityRootRequest.rootId ||
    normalized.operation !== identityRootRequest.operation ||
    normalized.updateKind !== identityRootRequest.updateKind ||
    normalized.hostOutputUpdateKind !== identity.hostOutputUpdateKind
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root finished_work/finished_lanes handoff does not match the private root request.'
    );
  }
  if (
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.renderCurrent,
      identity.renderCurrent
    ) ||
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.renderFinishedWork,
      identity.renderFinishedWork
    ) ||
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.commitPreviousCurrent,
      identity.commitPreviousCurrent
    ) ||
    !privateSerializationFinishedWorkHandlesEqual(
      normalized.commitCurrent,
      identity.commitCurrent
    ) ||
    normalized.commitCurrentMatchesRenderFinishedWork !== true ||
    normalized.commitPreviousCurrentMatchesRenderCurrent !== true ||
    normalized.consumesFinishedWork !== true
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root finished_work handoff does not match the committed HostRoot identity.'
    );
  }
  if (
    normalized.renderLanesBits <= 0 ||
    normalized.renderLanesBits !== identity.renderLanesBits ||
    normalized.commitFinishedLanesBits !== identity.commitFinishedLanesBits ||
    normalized.commitRemainingLanesBits !== identity.commitRemainingLanesBits ||
    normalized.commitPendingLanesBits !== identity.commitPendingLanesBits ||
    normalized.commitLanesMatchRenderLanes !== true ||
    normalized.consumesFinishedLanes !== true
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root finished_lanes handoff does not match the committed HostRoot lanes.'
    );
  }
  if (
    normalized.publicSerializationAvailable !== false ||
    normalized.publicRouteAvailable !== false ||
    normalized.nativeBridgeAvailable !== false ||
    normalized.nativeExecution !== false ||
    normalized.packageCompatibilityClaimed !== false ||
    normalized.compatibilityClaimed !== false
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private root finished_work/finished_lanes handoff cannot open public, native, or package compatibility.'
    );
  }

  return normalized;
}

function assertPrivateRootFinishedLanesHandoffRecord(
  publicSurface,
  value,
  message
) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throwPrivateSerializationFinishedWorkIdentityError(publicSurface, message);
  }
}

function readPrivateRootFinishedLanesHandoffField(record, names) {
  for (const name of names) {
    if (Object.hasOwn(record, name)) {
      return record[name];
    }
  }
  return undefined;
}

function readPrivateRootFinishedLanesHandoffRequiredField(
  publicSurface,
  record,
  names,
  label
) {
  const value = readPrivateRootFinishedLanesHandoffField(record, names);
  if (value === undefined) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private root finished_work/finished_lanes handoff ${label}.`
    );
  }
  return value;
}

function readPrivateRootFinishedLanesHandoffRequiredString(
  publicSurface,
  record,
  names,
  label
) {
  const value = readPrivateRootFinishedLanesHandoffRequiredField(
    publicSurface,
    record,
    names,
    label
  );
  if (typeof value !== 'string') {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private root finished_work/finished_lanes handoff ${label} string.`
    );
  }
  return value;
}

function readPrivateRootFinishedLanesHandoffRequiredBoolean(
  publicSurface,
  record,
  names,
  label
) {
  const value = readPrivateRootFinishedLanesHandoffRequiredField(
    publicSurface,
    record,
    names,
    label
  );
  if (typeof value !== 'boolean') {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private root finished_work/finished_lanes handoff ${label} boolean.`
    );
  }
  return value;
}

function readPrivateRootFinishedLanesHandoffRequiredNonNegativeInteger(
  publicSurface,
  record,
  names,
  label
) {
  const value = readPrivateRootFinishedLanesHandoffRequiredField(
    publicSurface,
    record,
    names,
    label
  );
  if (!Number.isInteger(value) || value < 0) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private root finished_work/finished_lanes handoff ${label} non-negative integer.`
    );
  }
  return value;
}

function validatePrivateSerializationUnmountHandoffIdentity(
  publicSurface,
  identityRootRequest,
  evidence
) {
  assertPrivateSerializationUnmountRequestField(
    publicSurface,
    evidence,
    [
      'rootRequestOperation',
      'root_request_operation',
      'operation',
      'rootOperation'
    ],
    identityRootRequest.operation,
    'operation'
  );
  assertPrivateSerializationUnmountRequestField(
    publicSurface,
    evidence,
    [
      'rootRequestUpdateKind',
      'root_request_update_kind',
      'updateKind',
      'update_kind'
    ],
    identityRootRequest.updateKind,
    'update kind'
  );

  const handoffContainer =
    readPrivateSerializationField(evidence, [
      'unmountHandoffIdentity',
      'unmount_handoff_identity',
      'privateUnmountNativeBridgeAdmission',
      'private_unmount_native_bridge_admission',
      'nativeBridgeAdmission',
      'native_bridge_admission'
    ]) ?? evidence;
  const cleanupHandoff = normalizePrivateSerializationUnmountCleanupHandoff(
    publicSurface,
    identityRootRequest,
    readPrivateSerializationField(handoffContainer, [
      'cleanupHandoff',
      'cleanup_handoff',
      'unmountCleanupHandoff',
      'unmount_cleanup_handoff',
      'unmountNativeBridgeCleanupHandoff',
      'unmount_native_bridge_cleanup_handoff',
      'privateUnmountNativeBridgeCleanupHandoff',
      'private_unmount_native_bridge_cleanup_handoff'
    ])
  );
  const deletionHandoff =
    normalizePrivateSerializationUnmountDeletionHandoff(
      publicSurface,
      identityRootRequest,
      readPrivateSerializationField(handoffContainer, [
        'deletionCommitHandoff',
        'deletion_commit_handoff',
        'unmountDeletionCommitHandoff',
        'unmount_deletion_commit_handoff',
        'deletionHandoff',
        'deletion_handoff'
      ])
    );
  const cleanupDeletionHandoff =
    cleanupHandoff.deletionCommitHandoff === null
      ? null
      : normalizePrivateSerializationUnmountDeletionHandoff(
          publicSurface,
          identityRootRequest,
          cleanupHandoff.deletionCommitHandoff.sourceDiagnostic
        );

  if (
    cleanupDeletionHandoff !== null &&
    !privateSerializationUnmountDeletionHandoffsMatch(
      cleanupDeletionHandoff,
      deletionHandoff
    )
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private unmount finished-work identity cleanup handoff points at a different deletion handoff.'
    );
  }
  if (
    cleanupHandoff.deletionCommitHandoffId !== deletionHandoff.diagnosticId
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private unmount finished-work identity cleanup handoff does not reference the accepted deletion handoff.'
    );
  }
  if (
    cleanupHandoff.hostNodeCleanupCount !==
      deletionHandoff.hostNodeCleanupCount ||
    cleanupHandoff.cleanupOrderRecordCount !==
      deletionHandoff.cleanupOrderRecordCount
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private unmount finished-work identity cleanup counts do not match the deletion handoff.'
    );
  }

  return freezeRecord({
    deletionCommitHandoff: deletionHandoff,
    cleanupHandoff,
    cleanupHandoffVariant:
      cleanupHandoff.refCleanupReturnCount === 0 &&
      cleanupHandoff.passiveDestroyCount === 0
        ? 'host-only'
        : 'ref-passive'
  });
}

function privateSerializationUnmountDeletionHandoffsMatch(left, right) {
  return (
    left.diagnosticId === right.diagnosticId &&
    left.status === right.status &&
    left.requestId === right.requestId &&
    left.requestSequence === right.requestSequence &&
    left.rootId === right.rootId &&
    left.operation === right.operation &&
    left.updateKind === right.updateKind &&
    left.lifecycle === right.lifecycle &&
    left.scheduledElementIsNone === right.scheduledElementIsNone &&
    left.hostNodeCleanupCount === right.hostNodeCleanupCount &&
    left.cleanupOrderRecordCount === right.cleanupOrderRecordCount &&
    left.publicUnmountCompatibilityClaimed ===
      right.publicUnmountCompatibilityClaimed &&
    left.publicHostTeardownCompatibilityClaimed ===
      right.publicHostTeardownCompatibilityClaimed &&
    left.actFlushingClaimed === right.actFlushingClaimed
  );
}

function assertPrivateSerializationUnmountRequestField(
  publicSurface,
  record,
  names,
  expected,
  label
) {
  if (readPrivateSerializationField(record, names) !== expected) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Private unmount finished-work identity ${label} does not match the private request.`
    );
  }
}

function normalizePrivateSerializationUnmountDeletionHandoff(
  publicSurface,
  identityRootRequest,
  handoff
) {
  assertPrivateSerializationRecord(
    publicSurface,
    handoff,
    'Expected private unmount finished-work identity deletion handoff evidence.'
  );

  const normalized = freezeRecord({
    sourceDiagnostic: handoff,
    diagnosticId: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['diagnosticId', 'diagnostic_id', 'id'],
      'deletion handoff diagnostic id'
    ),
    status: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['status'],
      'deletion handoff status'
    ),
    requestId: readPrivateSerializationRequiredField(
      publicSurface,
      handoff,
      ['rootRequestId', 'root_request_id', 'requestId', 'request_id'],
      'deletion handoff request id'
    ),
    requestSequence: readPrivateSerializationRequiredNonNegativeInteger(
      publicSurface,
      handoff,
      [
        'rootRequestSequence',
        'root_request_sequence',
        'requestSequence',
        'request_sequence'
      ],
      'deletion handoff request sequence'
    ),
    rootId: readPrivateSerializationRequiredField(
      publicSurface,
      handoff,
      ['jsRootId', 'js_root_id', 'rootId', 'root_id', 'root'],
      'deletion handoff root id'
    ),
    operation:
      readPrivateSerializationField(handoff, [
        'operation',
        'rootOperation',
        'root_operation'
      ]) ?? identityRootRequest.operation,
    updateKind: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['updateKind', 'update_kind', 'scheduledUpdateKind', 'scheduled_update_kind'],
      'deletion handoff update kind'
    ),
    lifecycle: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['lifecycle', 'lifecycleStatusAfter', 'lifecycle_status_after'],
      'deletion handoff lifecycle'
    ),
    scheduledElementIsNone: readPrivateSerializationRequiredBoolean(
      publicSurface,
      handoff,
      ['scheduledElementIsNone', 'scheduled_element_is_none'],
      'deletion handoff scheduled element'
    ),
    hostNodeCleanupCount:
      readPrivateSerializationRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['hostNodeCleanupCount', 'host_node_cleanup_count'],
        'deletion handoff host cleanup count'
      ),
    cleanupOrderRecordCount:
      readPrivateSerializationRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['cleanupOrderRecordCount', 'cleanup_order_record_count'],
        'deletion handoff cleanup order count'
      ),
    publicUnmountCompatibilityClaimed:
      readPrivateSerializationRequiredBoolean(
        publicSurface,
        handoff,
        [
          'publicUnmountCompatibilityClaimed',
          'public_unmount_compatibility_claimed'
        ],
        'deletion handoff public unmount claim'
      ),
    publicHostTeardownCompatibilityClaimed:
      readPrivateSerializationRequiredBoolean(
        publicSurface,
        handoff,
        [
          'publicHostTeardownCompatibilityClaimed',
          'public_host_teardown_compatibility_claimed'
        ],
        'deletion handoff public host teardown claim'
      ),
    actFlushingClaimed: readPrivateSerializationRequiredBoolean(
      publicSurface,
      handoff,
      ['actFlushingClaimed', 'act_flushing_claimed'],
      'deletion handoff act flushing claim'
    )
  });

  if (
    normalized.diagnosticId !== privateUnmountDeletionCommitHandoffDiagnosticId ||
    normalized.status !== privateUnmountDeletionCommitHandoffStatus ||
    normalized.requestId !== identityRootRequest.requestId ||
    normalized.requestSequence !== identityRootRequest.requestSequence ||
    normalized.rootId !== identityRootRequest.rootId ||
    normalized.operation !== identityRootRequest.operation ||
    normalized.updateKind !== identityRootRequest.updateKind ||
    normalized.lifecycle !== testRendererRootLifecycleUnmountScheduled ||
    normalized.scheduledElementIsNone !== true ||
    normalized.hostNodeCleanupCount < 1 ||
    normalized.cleanupOrderRecordCount < normalized.hostNodeCleanupCount ||
    normalized.publicUnmountCompatibilityClaimed !== false ||
    normalized.publicHostTeardownCompatibilityClaimed !== false ||
    normalized.actFlushingClaimed !== false
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private unmount finished-work identity deletion handoff does not match the private unmount request.'
    );
  }

  return normalized;
}

function normalizePrivateSerializationUnmountCleanupHandoff(
  publicSurface,
  identityRootRequest,
  handoff
) {
  assertPrivateSerializationRecord(
    publicSurface,
    handoff,
    'Expected private unmount finished-work identity cleanup handoff evidence.'
  );

  const deletionCommitHandoff = readPrivateSerializationField(handoff, [
    'deletionCommitHandoff',
    'deletion_commit_handoff'
  ]);
  const normalized = freezeRecord({
    sourceDiagnostic: handoff,
    diagnosticId: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['diagnosticId', 'diagnostic_id', 'id'],
      'cleanup handoff diagnostic id'
    ),
    status: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['status'],
      'cleanup handoff status'
    ),
    requestId: readPrivateSerializationRequiredField(
      publicSurface,
      handoff,
      ['rootRequestId', 'root_request_id', 'requestId', 'request_id'],
      'cleanup handoff request id'
    ),
    requestSequence: readPrivateSerializationRequiredNonNegativeInteger(
      publicSurface,
      handoff,
      [
        'rootRequestSequence',
        'root_request_sequence',
        'requestSequence',
        'request_sequence'
      ],
      'cleanup handoff request sequence'
    ),
    rootId: readPrivateSerializationRequiredField(
      publicSurface,
      handoff,
      ['jsRootId', 'js_root_id', 'rootId', 'root_id', 'root'],
      'cleanup handoff root id'
    ),
    operation:
      readPrivateSerializationField(handoff, [
        'operation',
        'rootOperation',
        'root_operation'
      ]) ?? identityRootRequest.operation,
    updateKind: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['updateKind', 'update_kind', 'scheduledUpdateKind', 'scheduled_update_kind'],
      'cleanup handoff update kind'
    ),
    routeOutcome: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['routeOutcome', 'route_outcome'],
      'cleanup handoff route outcome'
    ),
    lifecycle: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['lifecycle', 'lifecycleStatusAfter', 'lifecycle_status_after'],
      'cleanup handoff lifecycle'
    ),
    scheduledElementIsNone: readPrivateSerializationRequiredBoolean(
      publicSurface,
      handoff,
      ['scheduledElementIsNone', 'scheduled_element_is_none'],
      'cleanup handoff scheduled element'
    ),
    routeDependencyId: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['routeDependencyId', 'route_dependency_id'],
      'cleanup handoff route dependency'
    ),
    deletionCommitHandoffId: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['deletionCommitHandoffId', 'deletion_commit_handoff_id'],
      'cleanup handoff deletion handoff id'
    ),
    admissionDiagnosticId: readPrivateSerializationRequiredString(
      publicSurface,
      handoff,
      ['admissionDiagnosticId', 'admission_diagnostic_id'],
      'cleanup handoff admission id'
    ),
    previousRootChildCount:
      readPrivateSerializationRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['previousRootChildCount', 'previous_root_child_count'],
        'cleanup handoff previous root child count'
      ),
    currentRootChildCount:
      readPrivateSerializationRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['currentRootChildCount', 'current_root_child_count'],
        'cleanup handoff current root child count'
      ),
    detachedInstance: readPrivateSerializationRequiredBoolean(
      publicSurface,
      handoff,
      ['detachedInstance', 'detached_instance'],
      'cleanup handoff detached instance'
    ),
    detachedInstanceChildCount:
      readPrivateSerializationRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['detachedInstanceChildCount', 'detached_instance_child_count'],
        'cleanup handoff detached child count'
      ),
    hostNodeCleanupCount:
      readPrivateSerializationRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['hostNodeCleanupCount', 'host_node_cleanup_count'],
        'cleanup handoff host cleanup count'
      ),
    refCleanupReturnCount:
      readPrivateSerializationRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['refCleanupReturnCount', 'ref_cleanup_return_count'],
        'cleanup handoff ref cleanup count'
      ),
    passiveDestroyCount:
      readPrivateSerializationRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['passiveDestroyCount', 'passive_destroy_count'],
        'cleanup handoff passive destroy count'
      ),
    cleanupOrderRecordCount:
      readPrivateSerializationRequiredNonNegativeInteger(
        publicSurface,
        handoff,
        ['cleanupOrderRecordCount', 'cleanup_order_record_count'],
        'cleanup handoff cleanup order count'
      ),
    nativeCleanupAfterRefAndPassiveOrdering:
      readPrivateSerializationRequiredBoolean(
        publicSurface,
        handoff,
        [
          'nativeCleanupAfterRefAndPassiveOrdering',
          'native_cleanup_after_ref_and_passive_ordering'
        ],
        'cleanup handoff ref/passive ordering'
      ),
    minimalTreeCleanupHandoff: readPrivateSerializationRequiredBoolean(
      publicSurface,
      handoff,
      ['minimalTreeCleanupHandoff', 'minimal_tree_cleanup_handoff'],
      'cleanup handoff minimal tree marker'
    ),
    rustUnmountCleanupHandoffExecuted:
      readPrivateSerializationRequiredBoolean(
        publicSurface,
        handoff,
        [
          'rustUnmountCleanupHandoffExecuted',
          'rust_unmount_cleanup_handoff_executed'
        ],
        'cleanup handoff execution marker'
      ),
    hostOutputProduced: readPrivateSerializationRequiredBoolean(
      publicSurface,
      handoff,
      ['hostOutputProduced', 'host_output_produced'],
      'cleanup handoff host output marker'
    ),
    publicUnmountCompatibilityClaimed:
      readPrivateSerializationRequiredBoolean(
        publicSurface,
        handoff,
        [
          'publicUnmountCompatibilityClaimed',
          'public_unmount_compatibility_claimed'
        ],
        'cleanup handoff public unmount claim'
      ),
    publicHostTeardownCompatibilityClaimed:
      readPrivateSerializationRequiredBoolean(
        publicSurface,
        handoff,
        [
          'publicHostTeardownCompatibilityClaimed',
          'public_host_teardown_compatibility_claimed'
        ],
        'cleanup handoff public host teardown claim'
      ),
    actFlushingClaimed: readPrivateSerializationRequiredBoolean(
      publicSurface,
      handoff,
      ['actFlushingClaimed', 'act_flushing_claimed'],
      'cleanup handoff act flushing claim'
    ),
    nativeBridgeAvailable: readPrivateSerializationRequiredBoolean(
      publicSurface,
      handoff,
      ['nativeBridgeAvailable', 'native_bridge_available'],
      'cleanup handoff native bridge claim'
    ),
    nativeExecution: readPrivateSerializationRequiredBoolean(
      publicSurface,
      handoff,
      ['nativeExecution', 'native_execution'],
      'cleanup handoff native execution claim'
    ),
    deletionCommitHandoff:
      deletionCommitHandoff === undefined
        ? null
        : freezeRecord({ sourceDiagnostic: deletionCommitHandoff })
  });
  const cleanupOnlyCount =
    normalized.hostNodeCleanupCount +
    normalized.refCleanupReturnCount +
    normalized.passiveDestroyCount;
  const refPassiveCleanup =
    normalized.refCleanupReturnCount > 0 ||
    normalized.passiveDestroyCount > 0;

  if (
    normalized.diagnosticId !==
      privateUnmountNativeBridgeCleanupHandoffDiagnosticId ||
    normalized.status !== privateUnmountNativeBridgeCleanupHandoffStatus ||
    normalized.requestId !== identityRootRequest.requestId ||
    normalized.requestSequence !== identityRootRequest.requestSequence ||
    normalized.rootId !== identityRootRequest.rootId ||
    normalized.operation !== identityRootRequest.operation ||
    normalized.updateKind !== identityRootRequest.updateKind ||
    normalized.routeOutcome !== testRendererRootUpdateOutcomeScheduled ||
    normalized.lifecycle !== testRendererRootLifecycleUnmountScheduled ||
    normalized.scheduledElementIsNone !== true ||
    normalized.routeDependencyId !==
      'react-test-renderer-unmount-route-private-diagnostic' ||
    normalized.deletionCommitHandoffId !==
      privateUnmountDeletionCommitHandoffDiagnosticId ||
    normalized.admissionDiagnosticId !==
      privateUnmountNativeBridgeAdmissionDiagnosticId ||
    normalized.previousRootChildCount !== 1 ||
    normalized.currentRootChildCount !== 0 ||
    normalized.detachedInstance !== true ||
    normalized.detachedInstanceChildCount !== 0 ||
    normalized.hostNodeCleanupCount < 1 ||
    normalized.cleanupOrderRecordCount !== cleanupOnlyCount ||
    normalized.nativeCleanupAfterRefAndPassiveOrdering !== true ||
    normalized.rustUnmountCleanupHandoffExecuted !== true ||
    normalized.hostOutputProduced !== true ||
    normalized.publicUnmountCompatibilityClaimed !== false ||
    normalized.publicHostTeardownCompatibilityClaimed !== false ||
    normalized.actFlushingClaimed !== false ||
    normalized.nativeBridgeAvailable !== false ||
    normalized.nativeExecution !== false ||
    (normalized.minimalTreeCleanupHandoff === true && refPassiveCleanup) ||
    (normalized.minimalTreeCleanupHandoff === false && !refPassiveCleanup)
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private unmount finished-work identity cleanup handoff does not match the private unmount request.'
    );
  }

  return normalized;
}

function readPrivateSerializationField(record, names) {
  if (record === null || typeof record !== 'object') {
    return undefined;
  }
  for (const name of names) {
    if (Object.hasOwn(record, name)) {
      return record[name];
    }
  }
  return undefined;
}

function readPrivateSerializationRequiredField(
  publicSurface,
  record,
  names,
  label
) {
  const value = readPrivateSerializationField(record, names);
  if (value === undefined) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private unmount finished-work identity ${label}.`
    );
  }
  return value;
}

function readPrivateSerializationRequiredString(
  publicSurface,
  record,
  names,
  label
) {
  const value = readPrivateSerializationRequiredField(
    publicSurface,
    record,
    names,
    label
  );
  if (typeof value !== 'string') {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private unmount finished-work identity ${label} string.`
    );
  }
  return value;
}

function readPrivateSerializationRequiredBoolean(
  publicSurface,
  record,
  names,
  label
) {
  const value = readPrivateSerializationRequiredField(
    publicSurface,
    record,
    names,
    label
  );
  if (typeof value !== 'boolean') {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private unmount finished-work identity ${label} boolean.`
    );
  }
  return value;
}

function readPrivateSerializationRequiredNonNegativeInteger(
  publicSurface,
  record,
  names,
  label
) {
  const value = readPrivateSerializationRequiredField(
    publicSurface,
    record,
    names,
    label
  );
  if (!Number.isInteger(value) || value < 0) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private unmount finished-work identity ${label} non-negative integer.`
    );
  }
  return value;
}

function assertPrivateSerializationRecord(publicSurface, value, message) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throwPrivateSerializationFinishedWorkIdentityError(publicSurface, message);
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

function normalizePrivateToJSONSiblingTextFinishedWorkIdentityEvidence(
  evidence
) {
  const publicSurface = privateToJSONSiblingTextIdentityPublicSurface;
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
    sourceExecutionRecordId: readPrivateToJSONField(
      evidence,
      'sourceExecutionRecordId',
      'source_execution_record_id'
    ),
    sourceExecutionStatus: readPrivateToJSONField(
      evidence,
      'sourceExecutionStatus',
      'source_execution_status'
    ),
    sourceSerializationDiagnosticName: readPrivateToJSONField(
      evidence,
      'sourceSerializationDiagnosticName',
      'source_serialization_diagnostic_name'
    ),
    worker738ReportRowId: readPrivateToJSONField(
      evidence,
      'worker738ReportRowId',
      'worker_738_report_row_id'
    ),
    rootRequestId: readPrivateToJSONField(
      evidence,
      'rootRequestId',
      'root_request_id'
    ),
    rootRequestSequence: readPrivateToJSONSiblingTextIdentityInteger(
      evidence,
      'rootRequestSequence',
      'root_request_sequence',
      'rootScheduledUpdateSequence',
      'root_scheduled_update_sequence'
    ),
    rootId:
      readPrivateToJSONField(evidence, 'rootId', 'root_id') ??
      readPrivateToJSONField(evidence, 'root'),
    hostOutputUpdateKind: readPrivateToJSONField(
      evidence,
      'hostOutputUpdateKind',
      'host_output_update_kind'
    ),
    hostOutputShape: readPrivateToJSONField(
      evidence,
      'hostOutputShape',
      'host_output_shape'
    ),
    rootNodeKind: readPrivateToJSONField(
      evidence,
      'rootNodeKind',
      'root_node_kind'
    ),
    rootChildCount: readPrivateToJSONSiblingTextIdentityInteger(
      evidence,
      'rootChildCount',
      'root_child_count'
    ),
    sourceNodeCount: readPrivateToJSONSiblingTextIdentityInteger(
      evidence,
      'sourceNodeCount',
      'source_node_count'
    ),
    routeRenderCurrent: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateToJSONField(
        evidence,
        'routeRenderCurrent',
        'route_render_current'
      ),
      'routeRenderCurrent'
    ),
    routeRenderFinishedWork: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateToJSONField(
        evidence,
        'routeRenderFinishedWork',
        'route_render_finished_work'
      ),
      'routeRenderFinishedWork'
    ),
    routeCommitPreviousCurrent:
      normalizePrivateSerializationFinishedWorkHandle(
        publicSurface,
        readPrivateToJSONField(
          evidence,
          'routeCommitPreviousCurrent',
          'route_commit_previous_current'
        ),
        'routeCommitPreviousCurrent'
      ),
    routeCommitCurrent: normalizePrivateSerializationFinishedWorkHandle(
      publicSurface,
      readPrivateToJSONField(
        evidence,
        'routeCommitCurrent',
        'route_commit_current'
      ),
      'routeCommitCurrent'
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
    routeRenderLanesBits: readPrivateSerializationLaneBits(
      publicSurface,
      evidence,
      'routeRenderLanesBits',
      'route_render_lanes_bits'
    ),
    routeCommitFinishedLanesBits: readPrivateSerializationLaneBits(
      publicSurface,
      evidence,
      'routeCommitFinishedLanesBits',
      'route_commit_finished_lanes_bits'
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
    routeHandlesMatchCommittedUpdate: readPrivateToJSONField(
      evidence,
      'routeHandlesMatchCommittedUpdate',
      'route_handles_match_committed_update'
    ),
    routeLanesMatchCommittedUpdate: readPrivateToJSONField(
      evidence,
      'routeLanesMatchCommittedUpdate',
      'route_lanes_match_committed_update'
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
    committedSiblingTextFiberInspectionAvailable: readPrivateToJSONField(
      evidence,
      'committedSiblingTextFiberInspectionAvailable',
      'committed_sibling_text_fiber_inspection_available'
    ),
    committedSiblingTextReportShapeAvailable: readPrivateToJSONField(
      evidence,
      'committedSiblingTextReportShapeAvailable',
      'committed_sibling_text_report_shape_available'
    ),
    committedSiblingTextInspectionMatchesOutput: readPrivateToJSONField(
      evidence,
      'committedSiblingTextInspectionMatchesOutput',
      'committed_sibling_text_inspection_matches_output'
    ),
    hostOutputSnapshotCurrent: readPrivateToJSONField(
      evidence,
      'hostOutputSnapshotCurrent',
      'host_output_snapshot_current'
    ),
    reportHostOutputRowMatchesOutput: readPrivateToJSONField(
      evidence,
      'reportHostOutputRowMatchesOutput',
      'report_host_output_row_matches_output'
    ),
    reportRootArraySourceNodesMatchCurrentSnapshot: readPrivateToJSONField(
      evidence,
      'reportRootArraySourceNodesMatchCurrentSnapshot',
      'report_root_array_source_nodes_match_current_snapshot'
    ),
    realSiblingTextHandoffAvailable: readPrivateToJSONField(
      evidence,
      'realSiblingTextHandoffAvailable',
      'real_sibling_text_handoff_available'
    ),
    consumesUpdateRouteAdmission: readPrivateToJSONField(
      evidence,
      'consumesUpdateRouteAdmission',
      'consumes_update_route_admission'
    ),
    consumesSiblingTextHostOutput: readPrivateToJSONField(
      evidence,
      'consumesSiblingTextHostOutput',
      'consumes_sibling_text_host_output'
    ),
    consumesPrivateToJSONEvidence: readPrivateToJSONField(
      evidence,
      'consumesPrivateToJSONEvidence',
      'consumes_private_to_json_evidence'
    ),
    consumesWorker738ReportRow: readPrivateToJSONField(
      evidence,
      'consumesWorker738ReportRow',
      'consumes_worker_738_report_row'
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
    identityAdmissionAvailable: readPrivateToJSONField(
      evidence,
      'identityAdmissionAvailable',
      'identity_admission_available'
    ),
    broadMultichildIdentityAvailable: readPrivateToJSONField(
      evidence,
      'broadMultichildIdentityAvailable',
      'broad_multichild_identity_available'
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
    publicRouteAvailable: readPrivateToJSONField(
      evidence,
      'publicRouteAvailable',
      'public_route_available'
    ),
    nativeBridgeLoadingAvailable: readPrivateToJSONField(
      evidence,
      'nativeBridgeLoadingAvailable',
      'native_bridge_loading_available'
    ),
    nativeBridgeAvailable: readPrivateToJSONField(
      evidence,
      'nativeBridgeAvailable',
      'native_bridge_available'
    ),
    nativeExecutionAvailable: readPrivateToJSONField(
      evidence,
      'nativeExecutionAvailable',
      'native_execution_available'
    ),
    jsFacadeAvailable: readPrivateToJSONField(
      evidence,
      'jsFacadeAvailable',
      'js_facade_available'
    ),
    cjsFacadeAvailable: readPrivateToJSONField(
      evidence,
      'cjsFacadeAvailable',
      'cjs_facade_available'
    ),
    packageCompatibilityClaimed: readPrivateToJSONField(
      evidence,
      'packageCompatibilityClaimed',
      'package_compatibility_claimed'
    ),
    compatibilityClaimed: readPrivateToJSONField(
      evidence,
      'compatibilityClaimed',
      'compatibility_claimed'
    )
  });
}

function readPrivateToJSONSiblingTextIdentityInteger(
  record,
  camelName,
  snakeName,
  alternateCamelName,
  alternateSnakeName
) {
  const value =
    readPrivateToJSONField(record, camelName, snakeName) ??
    readPrivateToJSONField(
      record,
      alternateCamelName,
      alternateSnakeName
    );
  if (!isPrivateSerializationNonNegativeInteger(value)) {
    throwPrivateToJSONSerializationError(
      `Expected sibling-text finished-work identity ${camelName} to be a non-negative integer.`
    );
  }
  return value;
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
    !isPrivateSerializationNonNegativeInteger(arenaId) ||
    !isPrivateSerializationNonNegativeInteger(slot) ||
    !isPrivateSerializationNonNegativeInteger(generation)
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
  if (!isPrivateSerializationNonNegativeInteger(value)) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      `Expected private serialization finished-work identity ${camelName} lane bits.`
    );
  }
  return value;
}

function isPrivateSerializationNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
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
  const hostOutputRow = readPrivateToJSONField(
    report,
    'hostOutputRow',
    'host_output_row'
  ) ?? readPrivateToJSONField(report, 'privateHostOutputRow');
  const directHostOutputRowId =
    readPrivateToJSONField(report, 'hostOutputRowId', 'host_output_row_id') ??
    readPrivateToJSONField(report, 'privateRowId', 'private_row_id');
  const requiresHostOutputRow =
    identity.hostOutputUpdateKind === 'Update' ||
    identity.hostOutputUpdateKind === 'Unmount';
  if (
    requiresHostOutputRow &&
    (hostOutputRow === undefined ||
      hostOutputRow === null ||
      typeof hostOutputRow !== 'object')
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected private serialization source report hostOutputRow.'
    );
  }
  const embeddedHostOutputRowId = readPrivateToJSONField(hostOutputRow, 'id');
  if (requiresHostOutputRow && embeddedHostOutputRowId === undefined) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected private serialization source report hostOutputRow.id.'
    );
  }
  if (
    directHostOutputRowId !== undefined &&
    embeddedHostOutputRowId !== undefined &&
    directHostOutputRowId !== embeddedHostOutputRowId
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Expected private serialization source report hostOutputRowId to match hostOutputRow.id.'
    );
  }
  const hostOutputRowId =
    embeddedHostOutputRowId ?? directHostOutputRowId;
  const directHostOutputShape =
    readPrivateToJSONField(report, 'hostOutputShape', 'host_output_shape') ??
    readPrivateToJSONField(hostOutputRow, 'hostOutputShape', 'host_output_shape');
  if (hostOutputRow !== undefined && hostOutputRow !== null) {
    const rowHostOutputKind = readPrivateToJSONField(
      hostOutputRow,
      'hostOutputUpdateKind',
      'host_output_update_kind'
    );
    if (rowHostOutputKind === undefined) {
      throwPrivateSerializationFinishedWorkIdentityError(
        publicSurface,
        'Expected private serialization source report hostOutputRow.hostOutputUpdateKind.'
      );
    }
    if (
      rowHostOutputKind !== undefined &&
      rowHostOutputKind !== identity.hostOutputUpdateKind
    ) {
      throwPrivateSerializationFinishedWorkIdentityError(
        publicSurface,
        'Private serialization source report row update kind does not match identity evidence.'
      );
    }
    if (
      readPrivateToJSONField(
        hostOutputRow,
        'hostOutputShape',
        'host_output_shape'
      ) === undefined
    ) {
      throwPrivateSerializationFinishedWorkIdentityError(
        publicSurface,
        'Expected private serialization source report hostOutputRow.hostOutputShape.'
      );
    }
  }
  const hostOutputShape = directHostOutputShape;
  if (
    hostOutputShape === 'SiblingText' ||
    hostOutputRowId === privateToJSONSiblingTextHostOutputRowId
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'sibling-text-finished-work-identity-gate-not-implemented'
    );
  }
  const rootChildCount = readPrivateToJSONField(
    report,
    'rootChildCount',
    'root_child_count'
  );
  const rootNodeKind = readPrivateToJSONField(
    report,
    'rootNodeKind',
    'root_node_kind'
  );
  const rootChildren =
    readPrivateToJSONField(report, 'rootChildren', 'root_children') ??
    readPrivateToJSONField(report, 'hostChildren', 'host_children');
  if (
    (Number.isInteger(rootChildCount) && rootChildCount > 1) ||
    isSiblingTextRootNodeKind(rootNodeKind) ||
    (Array.isArray(rootChildren) && rootChildren.length > 1)
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'broad-multichild-identity-unexpectedly-open'
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
  if (identity.hostOutputUpdateKind === 'Unmount') {
    validatePrivateSerializationUnmountSourceReport(publicSurface, report);
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

function validatePrivateSerializationUnmountSourceReport(
  publicSurface,
  report
) {
  if (
    publicSurface === 'create().toTree' &&
    readPrivateToJSONField(
      report,
      'sourceJsonDiagnosticName',
      'source_json_diagnostic_name'
    ) !== privateToJSONAcceptedDiagnosticName
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private unmount finished-work identity source tree report does not reference the accepted JSON diagnostic.'
    );
  }
  if (
    readPrivateSerializationRequiredNonNegativeInteger(
      publicSurface,
      report,
      ['rootChildCount', 'root_child_count'],
      'unmount source root child count'
    ) !== 0
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private unmount finished-work identity source report is not an empty root.'
    );
  }

  const row = readPrivateSerializationField(report, [
    'hostOutputRow',
    'host_output_row'
  ]);
  assertPrivateSerializationRecord(
    publicSurface,
    row,
    'Expected private unmount finished-work identity host output row evidence.'
  );
  if (
    readPrivateSerializationRequiredString(
      publicSurface,
      row,
      ['id'],
      'unmount host output row id'
    ) !== privateToJSONUnmountHostOutputRowId ||
    readPrivateSerializationRequiredString(
      publicSurface,
      row,
      ['status'],
      'unmount host output row status'
    ) !== privateToJSONUpdateUnmountRowStatus ||
    readPrivateSerializationRequiredString(
      publicSurface,
      row,
      ['hostOutputUpdateKind', 'host_output_update_kind'],
      'unmount host output row update kind'
    ) !== 'Unmount' ||
    readPrivateSerializationRequiredNonNegativeInteger(
      publicSurface,
      row,
      ['previousRootChildCount', 'previous_root_child_count'],
      'unmount host output row previous child count'
    ) !== 1 ||
    readPrivateSerializationRequiredNonNegativeInteger(
      publicSurface,
      row,
      ['currentRootChildCount', 'current_root_child_count'],
      'unmount host output row current child count'
    ) !== 0
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private unmount finished-work identity host output row is not the accepted empty-root unmount row.'
    );
  }
}

function validatePrivateUnmountNativeExecutionFinishedWorkIdentity(
  publicSurface,
  execution,
  identity
) {
  if (execution.operation !== 'unmount') {
    return;
  }
  const request = execution.request;
  if (!isRootRequestRecord(request) || request.operation !== 'unmount') {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private native unmount serialization requires an unmount root request.'
    );
  }
  if (
    execution.requestId !== request.requestId ||
    execution.requestSequence !== request.requestSequence ||
    execution.rootId !== request.rootId ||
    identity.rootRequest !== request ||
    identity.rootRequestId !== request.requestId ||
    identity.rootRequestSequence !== request.requestSequence ||
    identity.rootRequestOperation !== 'unmount' ||
    identity.rootId !== request.rootId ||
    identity.hostOutputUpdateKind !== 'Unmount'
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private native unmount serialization finished-work identity is stale.'
    );
  }

  const admission = readDiagnosticField(execution, [
    'privateUnmountNativeBridgeAdmission',
    'private_unmount_native_bridge_admission'
  ]);
  if (!isObjectLike(admission)) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private native unmount serialization requires accepted deletion and cleanup handoff evidence.'
    );
  }
  const rawCleanupHandoff =
    readDiagnosticField(execution, [
      'privateUnmountNativeBridgeCleanupHandoff',
      'private_unmount_native_bridge_cleanup_handoff'
    ]) ??
    readDiagnosticField(admission, ['cleanupHandoff', 'cleanup_handoff']);
  const rawDeletionCommitHandoff =
    readDiagnosticField(admission, [
      'deletionCommitHandoff',
      'deletion_commit_handoff'
    ]) ??
    readDiagnosticField(rawCleanupHandoff, [
      'deletionCommitHandoff',
      'deletion_commit_handoff'
    ]);
  if (
    !isObjectLike(rawCleanupHandoff) ||
    !isObjectLike(rawDeletionCommitHandoff)
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private native unmount serialization requires accepted deletion and cleanup handoff evidence.'
    );
  }

  if (
    admission.id !== privateUnmountNativeBridgeAdmissionDiagnosticId ||
    admission.status !== privateUnmountNativeBridgeAdmissionStatus ||
    admission.operation !== 'unmount' ||
    admission.request !== request ||
    admission.requestId !== request.requestId ||
    admission.requestSequence !== request.requestSequence ||
    admission.rootId !== request.rootId ||
    admission.updateKind !== testRendererRootUpdateKindUnmount ||
    admission.updateOutcome !== testRendererRootUpdateOutcomeScheduled ||
    admission.scheduled !== true ||
    admission.cleanupHandoffDiagnosticId !==
      privateUnmountNativeBridgeCleanupHandoffDiagnosticId ||
    admission.deletionCommitHandoffDiagnosticId !==
      privateUnmountDeletionCommitHandoffDiagnosticId
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private native unmount serialization admission metadata is stale.'
    );
  }
  for (const field of [
    'consumesPrivateUnmountRouteMetadata',
    'consumesAcceptedRustLifecycleDiagnostics',
    'consumesAcceptedDeletionCommitHandoff',
    'consumesActualRustCleanupHandoff',
    'requiresActualRustCleanupHandoff',
    'deletionCommitHandoffAccepted',
    'cleanupHandoffAccepted',
    'lifecycleEvidenceAccepted',
    'cleanupBlockersAccepted',
    'passiveRefCleanupOrderAccepted',
    'nativeCleanupAfterRefAndPassiveOrdering',
    'rustUnmountCleanupHandoffExecuted',
    'hostOutputProduced'
  ]) {
    if (admission[field] !== true) {
      throwPrivateSerializationFinishedWorkIdentityError(
        publicSurface,
        'Private native unmount serialization admission is missing cleanup/deletion evidence.'
      );
    }
  }
  if (
    admission.publicRouteAvailable !== false ||
    admission.publicUnmountCompatibilityClaimed !== false ||
    admission.publicHostTeardownCompatibilityClaimed !== false ||
    admission.actFlushingClaimed !== false ||
    admission.nativeBridgeAvailable !== false ||
    admission.nativeExecution !== false ||
    admission.compatibilityClaimed !== false ||
    execution.serializationAvailable !== false ||
    execution.publicRouteAvailable !== false ||
    execution.publicCreateUpdateUnmountBehaviorAvailable !== false ||
    execution.nativeAddonLoaded !== false ||
    execution.nativeBridgeAvailable !== false ||
    execution.nativeExecution !== false ||
    execution.compatibilityClaimed !== false
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private native unmount serialization cannot claim public or native compatibility.'
    );
  }
  if (
    rawDeletionCommitHandoff.requestId !== request.requestId ||
    rawDeletionCommitHandoff.requestSequence !== request.requestSequence ||
    rawDeletionCommitHandoff.rootId !== request.rootId ||
    rawCleanupHandoff.requestId !== request.requestId ||
    rawCleanupHandoff.requestSequence !== request.requestSequence ||
    rawCleanupHandoff.rootId !== request.rootId
  ) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private native unmount serialization cleanup handoff evidence is not accepted.'
    );
  }

  try {
    const cleanupHandoff =
      normalizeAcceptedRustUnmountNativeBridgeCleanupHandoff({
        cleanupHandoff: rawCleanupHandoff
      });
    const deletionCommitHandoff =
      normalizeAcceptedRustUnmountDeletionCommitHandoff(
        rawDeletionCommitHandoff
      );
    assertAcceptedRustUnmountDeletionCommitHandoffMatchesRequest(
      request,
      deletionCommitHandoff
    );
    assertAcceptedRustUnmountNativeBridgeCleanupHandoffMatchesRequest(
      request,
      cleanupHandoff
    );
  } catch (_error) {
    throwPrivateSerializationFinishedWorkIdentityError(
      publicSurface,
      'Private native unmount serialization cleanup handoff evidence is not accepted.'
    );
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

function validatePrivateToJSONSiblingTextHostOutputDiagnostic(report) {
  assertPrivateToJSONRecord(report, 'report');
  assertPrivateToJSONStringField(
    report,
    'diagnosticName',
    'diagnostic_name',
    privateToJSONAcceptedDiagnosticName
  );
  const hostOutputUpdateKind = assertPrivateToJSONHostOutputUpdateKind(report);
  if (hostOutputUpdateKind !== 'Update') {
    throwPrivateToJSONSerializationError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }
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
  const rootNodeKind = readPrivateToJSONField(
    report,
    'rootNodeKind',
    'root_node_kind'
  );
  if (rootChildCount !== 2 || !isSiblingTextRootNodeKind(rootNodeKind)) {
    throwPrivateToJSONSerializationError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }
  const hostOutputRow = validatePrivateToJSONSiblingTextHostOutputRow(
    report,
    rootChildCount
  );
  assertPrivateToJSONPublicBlockers(
    readPrivateToJSONRecordField(report, 'publicBlockers', 'public_blockers')
  );
  assertPrivateToJSONSiblingTextGateIfPresent(
    readPrivateToJSONField(report, 'gate')
  );
  const committedFiberInspection =
    validatePrivateToJSONSiblingTextCommittedFiberInspectionDiagnostic(report);

  const nodes = readPrivateToJSONArrayField(report, 'nodes');
  const diagnosticNodes = validatePrivateToJSONDiagnosticNodes(nodes);
  const rootOrdinals = diagnosticNodes
    .filter((node) => node.parentOrdinal === null)
    .map((node) => node.ordinal);
  if (
    diagnosticNodes.length !== 3 ||
    rootOrdinals.length !== 2 ||
    rootOrdinals[0] !== 0 ||
    rootOrdinals[1] !== 1
  ) {
    throwPrivateToJSONSerializationError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }
  const rootText = diagnosticNodes[0];
  const hostSibling = diagnosticNodes[1];
  const hostText = diagnosticNodes[2];
  if (
    rootText.nodeKind !== 'Text' ||
    rootText.parentOrdinal !== null ||
    hostSibling.nodeKind !== 'HostComponent' ||
    hostSibling.parentOrdinal !== null ||
    hostSibling.childOrdinals.length !== 1 ||
    hostSibling.childOrdinals[0] !== 2 ||
    hostText.nodeKind !== 'Text' ||
    hostText.parentOrdinal !== 1
  ) {
    throwPrivateToJSONSerializationError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }

  return {
    hostOutputUpdateKind,
    hostOutputShape: 'SiblingText',
    hostOutputRow,
    result: createPrivateToJSONRenderedRoot(diagnosticNodes, rootOrdinals),
    rootChildCount,
    committedFiberInspection,
    sourceNodeCount: diagnosticNodes.length
  };
}

function validatePrivateToJSONSiblingTextHostOutputRow(
  report,
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
  if (
    directRowId !== undefined &&
    directRowId !== privateToJSONSiblingTextHostOutputRowId
  ) {
    throwPrivateToJSONSerializationError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }
  if (row === undefined || row === null) {
    throwPrivateToJSONSerializationError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }

  assertPrivateToJSONRecord(row, 'hostOutputRow');
  const rowId = readPrivateToJSONStringField(row, 'id');
  if (rowId !== privateToJSONSiblingTextHostOutputRowId) {
    throwPrivateToJSONSerializationError(
      'sibling-text-report-row-or-shape-mismatch'
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
    'Update'
  );
  assertPrivateToJSONStringField(
    row,
    'hostOutputShape',
    'host_output_shape',
    'SiblingText'
  );
  const currentRootChildCount = readPrivateToJSONField(
    row,
    'currentRootChildCount',
    'current_root_child_count'
  );
  if (
    currentRootChildCount !== undefined &&
    currentRootChildCount !== rootChildCount
  ) {
    throwPrivateToJSONSerializationError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }
  const dependencyMetadata =
    readPrivateToJSONField(row, 'dependencyMetadata', 'dependency_metadata') ??
    readPrivateToJSONField(
      row,
      'dependencyDiagnostics',
      'dependency_diagnostics'
    );
  assertPrivateToJSONRecord(
    dependencyMetadata,
    'hostOutputRow.dependencyMetadata'
  );
  assertPrivateToJSONUpdateUnmountDependencyMetadata(
    dependencyMetadata,
    'Update'
  );
  for (const [camelName, snakeName] of [
    ['publicToJSONAvailable', 'public_to_json_available'],
    ['publicTestInstanceAvailable', 'public_test_instance_available'],
    ['nativeExecution', 'native_execution'],
    ['compatibilityClaimed', 'compatibility_claimed']
  ]) {
    if (readPrivateToJSONField(row, camelName, snakeName) !== false) {
      throwPrivateToJSONSerializationError(
        'sibling-text-host-output-row-public-native-package-claim'
      );
    }
  }

  return freezeRecord({
    id: privateToJSONSiblingTextHostOutputRowId,
    status: privateToJSONUpdateUnmountRowStatus,
    hostOutputUpdateKind: 'Update',
    hostOutputShape: 'SiblingText',
    dependencyMetadata
  });
}

function validatePrivateToJSONSiblingTextCommittedFiberInspectionDiagnostic(
  report
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
    'sourceJsonDiagnosticName',
    'source_json_diagnostic_name',
    privateToJSONAcceptedDiagnosticName
  );
  assertPrivateToJSONSiblingTextStringArrayField(
    record,
    'fiberShape',
    'fiber_shape',
    privateToTreeMultiChildAcceptedFiberShape
  );
  assertPrivateToJSONSiblingTextStringArrayField(
    record,
    'rootChildFiberTags',
    'root_child_fiber_tags',
    ['HostText', 'HostComponent']
  );
  assertPrivateToJSONSiblingTextStringArrayField(
    record,
    'hostChildFiberTags',
    'host_child_fiber_tags',
    ['HostText', 'HostComponent']
  );
  assertPrivateToJSONNumberField(record, 'rootChildCount', 'root_child_count', 2);
  assertPrivateToJSONNumberField(record, 'hostChildCount', 'host_child_count', 2);
  assertPrivateToJSONNumberField(
    record,
    'hostComponentCount',
    'host_component_count',
    1
  );
  assertPrivateToJSONNumberField(record, 'hostTextCount', 'host_text_count', 2);
  assertPrivateToJSONBooleanField(
    record,
    'functionComponentPresent',
    'function_component_present',
    false
  );
  const functionTag = readPrivateToJSONField(
    record,
    'functionComponentFiberTag',
    'function_component_fiber_tag'
  );
  if (functionTag !== undefined && functionTag !== null) {
    throwPrivateToJSONSerializationError(
      'Expected private JSON sibling-text committedFiberInspection to omit FunctionComponent metadata.'
    );
  }
  assertPrivateToJSONBooleanField(
    record,
    'wrapsCommittedHostOutput',
    'wraps_committed_host_output',
    false
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
    sourceJsonDiagnosticName: privateToJSONAcceptedDiagnosticName,
    fiberShape: freezeArray(privateToTreeMultiChildAcceptedFiberShape),
    rootChildFiberTags: freezeArray(['HostText', 'HostComponent']),
    hostChildFiberTags: freezeArray(['HostText', 'HostComponent']),
    rootChildCount: 2,
    hostChildCount: 2,
    hostComponentCount: 1,
    hostTextCount: 2,
    functionComponentFiberTag: null,
    functionComponentPresent: false,
    wrapsCommittedHostOutput: false,
    publicTreeObjectAvailable: false,
    compatibilityClaimed: false
  });
}

function assertPrivateToJSONSiblingTextStringArrayField(
  record,
  camelName,
  snakeName,
  expected
) {
  const actual = readPrivateToJSONArrayField(record, camelName, snakeName);
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON sibling-text committedFiberInspection ${camelName} to be ${expected.join(', ')}.`
    );
  }
}

function validatePrivateToJSONSiblingTextIdentitySourceReport(
  identity,
  report
) {
  if (report === null || typeof report !== 'object') {
    throwPrivateToJSONSerializationError(
      'Expected private sibling-text serialization source report.'
    );
  }
  if (
    readPrivateToJSONField(report, 'diagnosticName', 'diagnostic_name') !==
    privateToJSONAcceptedDiagnosticName
  ) {
    throwPrivateToJSONSerializationError(
      'sibling-text-finished-work-identity-source-mismatch'
    );
  }
  const hostOutputUpdateKind = readPrivateToJSONField(
    report,
    'hostOutputUpdateKind',
    'host_output_update_kind'
  );
  const rootChildCount = readPrivateToJSONField(
    report,
    'rootChildCount',
    'root_child_count'
  );
  const rootNodeKind = readPrivateToJSONField(
    report,
    'rootNodeKind',
    'root_node_kind'
  );
  const nodes = readPrivateToJSONField(report, 'nodes');
  if (
    hostOutputUpdateKind !== identity.hostOutputUpdateKind ||
    rootChildCount !== identity.rootChildCount ||
    !isSiblingTextRootNodeKind(rootNodeKind) ||
    (Array.isArray(nodes) && nodes.length !== identity.sourceNodeCount)
  ) {
    throwPrivateToJSONSerializationError(
      'sibling-text-finished-work-identity-source-mismatch'
    );
  }
  const row = readPrivateToJSONField(
    report,
    'hostOutputRow',
    'host_output_row'
  ) ?? readPrivateToJSONField(report, 'privateHostOutputRow');
  if (
    row === undefined ||
    row === null ||
    readPrivateToJSONField(row, 'id') !== privateToJSONSiblingTextHostOutputRowId ||
    readPrivateToJSONField(row, 'hostOutputShape', 'host_output_shape') !==
      'SiblingText'
  ) {
    throwPrivateToJSONSerializationError(
      'sibling-text-report-row-or-shape-mismatch'
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

function validatePrivateToTreeSiblingTextIdentitySourceReport(
  identity,
  report
) {
  if (report === null || typeof report !== 'object') {
    throwPrivateToTreeMetadataError(
      'Expected private sibling-text toTree source report.'
    );
  }
  if (
    readPrivateToJSONField(report, 'diagnosticName', 'diagnostic_name') !==
      privateToTreeAcceptedDiagnosticName ||
    readPrivateToJSONField(
      report,
      'sourceJsonDiagnosticName',
      'source_json_diagnostic_name'
    ) !== privateToJSONAcceptedDiagnosticName
  ) {
    throwPrivateToTreeMetadataError(
      'sibling-text-finished-work-identity-source-mismatch'
    );
  }
  const diagnostic = validatePrivateToTreeHostOutputDiagnostic(report);
  if (
    diagnostic.kind !== 'multi-child' ||
    diagnostic.hostOutputUpdateKind !== identity.hostOutputUpdateKind ||
    diagnostic.rootChildCount !== identity.rootChildCount ||
    diagnostic.componentWrapped !== true ||
    diagnostic.sourceFiberCount !==
      privateToTreeCompositeMultiChildAcceptedFiberShape.length
  ) {
    throwPrivateToTreeMetadataError(
      'sibling-text-report-row-or-shape-mismatch'
    );
  }
}

function isSiblingTextRootNodeKind(rootNodeKind) {
  return (
    rootNodeKind === 'RootArray' ||
    rootNodeKind === 'MultipleHostChildren' ||
    rootNodeKind === 'Multiple'
  );
}

function assertPrivateToJSONSiblingTextGateIfPresent(gate) {
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
    for (const [camelName, snakeName, expected] of [
      ['containerChildCount', 'container_child_count', 2],
      ['instanceCount', 'instance_count', 1],
      ['textCount', 'text_count', 2]
    ]) {
      const value = readPrivateToJSONField(hostOutput, camelName, snakeName);
      if (value !== undefined && value !== expected) {
        throwPrivateToJSONSerializationError(
          `Expected private JSON sibling-text gate host output ${camelName} to be ${expected}.`
        );
      }
    }
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
  if (
    readPrivateToJSONField(
      metadata,
      'serializationDiagnosticsAvailable',
      'serialization_diagnostics_available'
    ) !== true
  ) {
    throwPrivateToJSONSerializationError(
      'Expected private JSON dependency metadata serializationDiagnosticsAvailable to be true.'
    );
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
  if (directRowId !== undefined && directRowId !== rowId) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON ${hostOutputUpdateKind} hostOutputRowId to match hostOutputRow.id.`
    );
  }
  const explicitHostOutputShape = readPrivateToJSONField(
    row,
    'hostOutputShape',
    'host_output_shape'
  );
  if (explicitHostOutputShape === undefined) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON ${hostOutputUpdateKind} row hostOutputShape.`
    );
  }
  const hostOutputShape = normalizePrivateToJSONHostOutputShape(
    explicitHostOutputShape
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
    readPrivateToJSONField(
      row,
      'dependencyDiagnostics',
      'dependency_diagnostics'
    );
  assertPrivateToJSONRecord(
    dependencyMetadata,
    'hostOutputRow.dependencyMetadata'
  );
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
    'Fiber tree inspection is intentionally blocked for the public API. The JS facade records private toTree metadata for a FunctionComponent wrapper above the accepted HostRoot, HostComponent, and HostText canary; it has no native bridge, public toTree serializer, or compatibility claim.',
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
    getInstance: createRendererUnsupportedFunction(
      'create().getInstance',
      0,
      'Public instance lookup is intentionally blocked until TestInstance and createNodeMock behavior are implemented.',
      routingGate,
      undefined,
      () => createRequest
    ),
    unstable_flushSync: createRendererUnsupportedFunction(
      'create().unstable_flushSync',
      1,
      'Synchronous flushing is intentionally blocked until react-test-renderer act and scheduler integration are wired.',
      routingGate,
      undefined,
      () => createRequest
    )
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
exports.act = isProduction
  ? undefined
  : createUnsupportedFunction(
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
