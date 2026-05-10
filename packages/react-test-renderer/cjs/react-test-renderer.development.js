'use strict';

const compatibilityTarget = 'react-test-renderer@19.2.6';
const entrypoint =
  'react-test-renderer/cjs/react-test-renderer.development';
const placeholderVersion = '0.0.0-fast-react-test-renderer-placeholder';
const unimplementedCode = 'FAST_REACT_UNIMPLEMENTED';
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
    privateQueryMetadata: true,
    publicTestInstanceObjectAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    hostOutputProducedFromJs: false
  })
]);
const acceptedPrivateActFlushPrerequisiteIds = Object.freeze([
  'react-act-private-dispatcher-gate',
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
  executesPublicSchedulerTasks: false,
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
    'worker-349-hook-effect-destroy-callback-execution-private'
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
  'rust-native-test-renderer-create-bridge',
  'react-test-renderer-host-output-serialization'
]);
const createRoutingPrerequisites = Object.freeze([
  Object.freeze({
    id: 'rust-native-test-renderer-create-bridge',
    present: false,
    requiredBeforeCreateRouting: true,
    reason:
      'The JS package has no native/Rust bridge entrypoint for TestRendererRoot create, update, or unmount requests.'
  }),
  Object.freeze({
    id: 'react-test-renderer-host-output-serialization',
    present: false,
    requiredBeforeCreateRouting: true,
    reason:
      'The JS package has no public bridge to Rust host-output serialization for toJSON, toTree, or TestInstance surfaces.'
  })
]);
const updatePrivateRoute = Object.freeze({
  id: 'react-test-renderer-update-private-route',
  publicSurface: 'create().update',
  status: 'blocked-js-native-bridge-not-loaded',
  deterministic: true,
  publicRouteAvailable: false,
  privateRustCanaryAccepted: true,
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
  acceptedRustPrivateJsonDiagnostics: true,
  acceptedRustPrivateToJSONFacadeResult: true,
  publicSerializationAvailable: false,
  publicRouteAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false,
  acceptedWorker: 'worker-265-test-renderer-private-json-ready-diagnostics',
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustDiagnosticName: privateToJSONAcceptedDiagnosticName,
  acceptedRustDiagnosticResultName: privateToJSONFacadeResultDiagnosticName,
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_json_serialization_for_canary',
    'TestRendererRoot::describe_private_json_serialization_after_update_for_canary',
    'TestRendererRoot::describe_private_to_json_facade_result_for_canary',
    'TestRendererRoot::describe_private_to_json_facade_result_after_update_for_canary',
    'TestRendererPrivateJsonSerializationReport',
    'TestRendererPrivateToJsonFacadeResult',
    'TestRendererPrivateJsonPublicSurfaceBlockers'
  ]),
  acceptedRustNodeKinds: Object.freeze([
    'HostComponent',
    'Text'
  ]),
  acceptedHostOutputUpdateKinds: Object.freeze([
    'Create',
    'Update'
  ]),
  hostOutputSnapshotFreshnessRequired: true,
  staleSnapshotRejection: true,
  acceptedRustTests: Object.freeze([
    'root_private_json_serialization_canary_describes_minimal_host_component_with_text',
    'root_private_json_serialization_canary_describes_updated_host_component_text_after_commit',
    'root_private_json_serialization_canary_rejects_stale_host_output_snapshot',
    'root_private_json_serialization_canary_rejects_stale_updated_host_output_snapshot',
    'root_private_json_serialization_canary_rejects_stale_commit_after_same_shape_update',
    'root_private_json_serialization_canary_rejects_non_minimal_snapshot_shapes',
    'root_private_to_json_facade_result_canary_wraps_create_serialization_evidence',
    'root_private_to_json_facade_result_canary_wraps_update_serialization_evidence'
  ]),
  acceptedFacadeResultWorker:
    'worker-391-test-renderer-public-tojson-private-facade',
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
const toTreePrivateHostOutputMetadataGate = Object.freeze({
  id: 'react-test-renderer-totree-private-host-output-metadata-gate',
  publicSurface: 'create().toTree',
  status: 'ready-for-private-diagnostics-public-totree-blocked',
  deterministic: true,
  privateHostOutputTreeMetadataAvailable: true,
  privateMetadataSymbol: privateToTreeHostOutputMetadataSymbol.description,
  privateMetadataStatus: privateToTreeHostOutputMetadataStatus,
  acceptedMinimalFiberShape: Object.freeze([
    'HostRoot',
    'HostComponent',
    'HostText'
  ]),
  acceptedReactSourceAlgorithm: 'ReactTestRenderer.js toTree',
  hostRootBehavior: 'childrenToTree(node.child)',
  hostComponentBehavior:
    "returns nodeType 'host' with element type, props, null instance, and rendered children",
  hostTextBehavior: 'returns text string from the HostText state node',
  acceptedRustPrivateJsonDiagnostics: true,
  acceptedCommittedFiberInspection: true,
  publicTreeAvailable: false,
  publicRouteAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false,
  acceptedWorker: 'worker-364-test-renderer-totree-private-host-output',
  acceptedRustWorkers: Object.freeze([
    'worker-235-test-renderer-private-fiber-inspection',
    'worker-265-test-renderer-private-json-ready-diagnostics'
  ]),
  acceptedRustApis: Object.freeze([
    'inspect_test_renderer_committed_fiber_tree',
    'TestRendererCommittedFiberTreeInspection::host_root',
    'TestRendererCommittedFiberTreeInspection::host_component',
    'TestRendererCommittedFiberTreeInspection::host_text',
    'TestRendererRoot::describe_private_json_serialization_for_canary',
    'TestRendererPrivateJsonSerializationReport'
  ]),
  acceptedRustTests: Object.freeze([
    'committed_fiber_inspection_describes_host_root_component_and_text',
    'root_private_json_serialization_canary_describes_minimal_host_component_with_text'
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
    'blocked-private-test-renderer-root-request-execution',
  rootRequestRecordOnly: true,
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
  toJSONSerializationFacadeGate: toJSONPrivateSerializationFacadeGate,
  toTreeHostOutputMetadataGate: toTreePrivateHostOutputMetadataGate,
  privateTestInstanceWrapperSkeleton
});
const rootRequestBridgeSymbol = Symbol.for(
  'fast.react_test_renderer.root_request_bridge'
);
const rootRequestStatus =
  'admitted-private-test-renderer-root-request-record';
const rootRequestExecutionStatus =
  'blocked-private-test-renderer-root-request-execution';
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
  status: 'record-only-current-rust-canary-metadata',
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
    'worker-307-test-renderer-update-unmount-private-js-bridge'
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
    acceptedHostOutputUpdateKinds: freezeArray(['Create', 'Update']),
    hostOutputSnapshotFreshnessRequired: true,
    staleSnapshotRejection: true,
    publicSerializationAvailable: false
  }),
  operations: currentRustTestRendererRootCanaryOperations,
  recordOnlyPrivateBridge: true,
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
      recordOnlyPrivateBridge: true,
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

function createSchedulerPlaceholder() {
  const scheduler = {};

  for (const key of schedulerMockKeys) {
    if (Object.hasOwn(schedulerConstantValues, key)) {
      scheduler[key] = schedulerConstantValues[key];
    } else {
      const [name, length] = schedulerFunctionShapes[key];
      scheduler[key] = createSchedulerUnsupportedFunction(key, name, length);
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
    recordOnlyBridge: true,
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
    sync: operation === 'unmount' && scheduled === true,
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
      recordOnlyPrivateBridge: true,
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

function describePrivateToTreeHostOutputDiagnostic(report) {
  const diagnostic = validatePrivateToTreeHostOutputDiagnostic(report);

  return freezeRecord({
    id: 'react-test-renderer-private-totree-minimal-host-output-metadata',
    status: privateToTreeHostOutputMetadataStatus,
    entrypoint,
    publicSurface: 'create().toTree',
    sourceDiagnostic: privateToJSONAcceptedDiagnosticName,
    acceptedMinimalFiberShape:
      toTreePrivateHostOutputMetadataGate.acceptedMinimalFiberShape,
    traversal: freezeRecord({
      source: 'ReactTestRenderer.js toTree',
      order: freezeArray(['HostRoot', 'HostComponent', 'HostText']),
      hostRootDelegatesToChild: true,
      hostComponentProducesHostNodeMetadata: true,
      hostTextProducesTextValueMetadata: true
    }),
    hostRoot: freezeRecord({
      fiberTag: 'HostRoot',
      source: 'ReactTestRenderer.js toTree HostRoot',
      delegatesToChild: true,
      childFiberTag: 'HostComponent',
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
    publicTreeObjectAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function validatePrivateToTreeHostOutputDiagnostic(report) {
  try {
    return validatePrivateToJSONHostOutputDiagnostic(report);
  } catch (error) {
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

function serializePrivateToJSONHostOutputDiagnostic(report) {
  const diagnostic = validatePrivateToJSONHostOutputDiagnostic(report);

  return createPrivateToJSONResultNode(diagnostic);
}

function createPrivateToJSONHostOutputDiagnosticResult(report) {
  const diagnostic = validatePrivateToJSONHostOutputDiagnostic(report);
  const result = createPrivateToJSONResultNode(diagnostic);

  return freezeRecord({
    id: 'react-test-renderer-private-tojson-diagnostic-result',
    diagnosticName: privateToJSONFacadeResultDiagnosticName,
    status: privateToJSONFacadeResultStatus,
    entrypoint,
    publicSurface: 'create().toJSON',
    sourceDiagnostic: privateToJSONAcceptedDiagnosticName,
    hostOutputUpdateKind: diagnostic.hostOutputUpdateKind,
    hostOutputSnapshotCurrent: true,
    result,
    publicBlockers: createPrivateToJSONPublicBlockerRecord(),
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  });
}

function createPrivateToJSONResultNode(diagnostic) {
  return freezeRecord({
    type: diagnostic.type,
    props: diagnostic.props,
    children: freezeArray([diagnostic.text])
  });
}

function validatePrivateToJSONHostOutputDiagnostic(report) {
  assertPrivateToJSONRecord(report, 'report');
  assertPrivateToJSONStringField(
    report,
    'diagnosticName',
    'diagnostic_name',
    privateToJSONAcceptedDiagnosticName
  );
  assertPrivateToJSONNumberField(report, 'rootChildCount', 'root_child_count', 1);
  assertPrivateToJSONKindField(
    report,
    'rootNodeKind',
    'root_node_kind',
    'HostComponent'
  );
  const hostOutputUpdateKind = assertPrivateToJSONHostOutputUpdateKind(report);
  assertPrivateToJSONBooleanField(
    report,
    'hostOutputSnapshotCurrent',
    'host_output_snapshot_current',
    true
  );
  assertPrivateToJSONPublicBlockers(
    readPrivateToJSONRecordField(report, 'publicBlockers', 'public_blockers')
  );
  assertPrivateToJSONGateIfPresent(readPrivateToJSONField(report, 'gate'));

  const nodes = readPrivateToJSONArrayField(report, 'nodes');
  if (nodes.length !== 2) {
    throwPrivateToJSONSerializationError(
      `Expected exactly two private JSON diagnostic nodes, found ${nodes.length}.`
    );
  }

  const componentNode = nodes[0];
  const textNode = nodes[1];
  assertPrivateToJSONRecord(componentNode, 'nodes[0]');
  assertPrivateToJSONRecord(textNode, 'nodes[1]');
  assertPrivateToJSONNumberField(componentNode, 'ordinal', undefined, 0);
  assertPrivateToJSONNumberField(textNode, 'ordinal', undefined, 1);
  assertPrivateToJSONKindField(
    componentNode,
    'nodeKind',
    'node_kind',
    'HostComponent'
  );
  assertPrivateToJSONKindField(textNode, 'nodeKind', 'node_kind', 'Text');
  assertPrivateToJSONParentOrdinal(componentNode, null);
  assertPrivateToJSONParentOrdinal(textNode, 0);
  assertPrivateToJSONChildOrdinals(componentNode, [1]);
  assertPrivateToJSONChildOrdinals(textNode, []);
  assertPrivateToJSONVisibleAttached(componentNode, 'nodes[0]');
  assertPrivateToJSONVisibleAttached(textNode, 'nodes[1]');

  const component = readPrivateToJSONRecordField(report, 'component');
  assertPrivateToJSONKindField(
    component,
    'nodeKind',
    'node_kind',
    'HostComponent'
  );
  assertPrivateToJSONNumberField(component, 'childCount', 'child_count', 1);
  assertPrivateToJSONVisibleAttached(component, 'component');
  const textChild = readPrivateToJSONRecordField(
    component,
    'textChild',
    'text_child'
  );
  assertPrivateToJSONKindField(textChild, 'nodeKind', 'node_kind', 'Text');
  assertPrivateToJSONVisibleAttached(textChild, 'component.textChild');

  const type = readPrivateToJSONElementType(component, componentNode);
  const props = readPrivateToJSONEmptyProps(component, componentNode);
  const nodeText = readPrivateToJSONStringField(textNode, 'text');
  const childText = readPrivateToJSONStringField(textChild, 'text');
  if (nodeText !== childText) {
    throwPrivateToJSONSerializationError(
      'Private JSON diagnostic text node does not match component text child.'
    );
  }

  return {
    hostOutputUpdateKind,
    props,
    text: nodeText,
    type
  };
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
  const actual = readPrivateToJSONField(record, camelName, snakeName);
  if (actual !== expected) {
    throwPrivateToJSONSerializationError(
      `Expected private JSON diagnostic field ${camelName} to be ${expected}.`
    );
  }
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
  if (actual !== 'Create' && actual !== 'Update') {
    throwPrivateToJSONSerializationError(
      'Expected private JSON diagnostic host output update kind to be Create or Update.'
    );
  }
  return actual;
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
    'Fiber tree inspection is intentionally blocked for the public API. The JS facade records private toTree metadata for the accepted HostRoot, HostComponent, and HostText canary; it has no native bridge, public toTree serializer, or compatibility claim.',
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
    value: routingGate.privateTestInstanceWrapperSkeleton,
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
