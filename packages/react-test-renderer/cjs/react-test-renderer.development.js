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
  'react-test-renderer-renderer-roots-compatibility-admission'
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
  })
]);
const actSchedulerGate = Object.freeze({
  id: 'react-test-renderer-act-scheduler-private-gate',
  status: actSchedulerGateStatus,
  entrypoint,
  deterministic: true,
  acceptedWorkers: Object.freeze([
    'worker-176-act-queue-routing-skeleton',
    'worker-252-sync-flush-act-continuation-skeleton',
    'worker-280-scheduler-mock-flush-helper-gate',
    'worker-285-sync-flush-act-continuation-post-passive-gate'
  ]),
  publicActBehaviorAvailable: false,
  publicSchedulerFlushExecutionAvailable: false,
  publicRootSyncFlushRouteAvailable: false,
  queuedWorkExecution: false,
  rendererRootsCompatibilityClaimed: false,
  compatibilityClaimed: false,
  schedulerMockFlushHelperMetadataAccepted: true,
  rootActRecordsAccepted: true,
  syncFlushActRecordsAccepted: true,
  recognizedSchedulerMockFlushHelpers: schedulerMockFlushHelperMetadata,
  recognizedRootActRecords: rootActSchedulerRecords,
  recognizedSyncFlushActRecords: syncFlushActSchedulerRecords,
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
const toJSONPrivateSerializationFacadeGate = Object.freeze({
  id: 'react-test-renderer-tojson-private-serialization-facade-gate',
  publicSurface: 'create().toJSON',
  status: 'ready-for-private-diagnostics-public-tojson-blocked',
  deterministic: true,
  privateFacadeGateAvailable: true,
  acceptedRustPrivateJsonDiagnostics: true,
  publicSerializationAvailable: false,
  publicRouteAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false,
  acceptedWorker: 'worker-265-test-renderer-private-json-ready-diagnostics',
  acceptedRustCrate: 'fast-react-test-renderer',
  acceptedRustDiagnosticName:
    'fast-react-test-renderer.serialization.private-json-canary',
  acceptedRustApis: Object.freeze([
    'TestRendererRoot::describe_private_json_serialization_for_canary',
    'TestRendererPrivateJsonSerializationReport',
    'TestRendererPrivateJsonPublicSurfaceBlockers'
  ]),
  acceptedRustNodeKinds: Object.freeze([
    'HostComponent',
    'Text'
  ]),
  acceptedRustTests: Object.freeze([
    'root_private_json_serialization_canary_describes_minimal_host_component_with_text',
    'root_private_json_serialization_canary_rejects_stale_host_output_snapshot',
    'root_private_json_serialization_canary_rejects_stale_commit_after_same_shape_update',
    'root_private_json_serialization_canary_rejects_non_minimal_snapshot_shapes'
  ]),
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
  toJSONSerializationFacadeGate: toJSONPrivateSerializationFacadeGate
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
  schedulerGate
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
    error.rootActRecordsAccepted =
      recognizedActSchedulerGate.rootActRecordsAccepted;
    error.syncFlushActRecordsAccepted =
      recognizedActSchedulerGate.syncFlushActRecordsAccepted;
    error.queuedWorkExecution = recognizedActSchedulerGate.queuedWorkExecution;
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
  getPrivateRootDiagnostics
) {
  const fn = function fastReactTestRendererRendererPlaceholder() {
    const privateRootDiagnostics =
      getPrivateRootDiagnostics === undefined
        ? undefined
        : getPrivateRootDiagnostics(arguments);

    throw createUnsupportedError(
      exportName,
      'was called',
      detail,
      routingGate,
      privateRootDiagnostics
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

function createPlaceholderRenderer(routingGate, element, options) {
  const privateRootBridgeState = createPrivateRootBridgeState(
    element,
    options
  );
  const renderer = {
    _Scheduler: schedulerPlaceholder,
    root: undefined,
    toJSON: createRendererUnsupportedFunction(
      'create().toJSON',
      0,
      'Serialization is intentionally blocked for the public API. The JS facade only records that Rust private JSON diagnostics are accepted; it has no native bridge, public serializer, or compatibility claim.',
      routingGate
    ),
    toTree: createRendererUnsupportedFunction(
      'create().toTree',
      0,
      'Fiber tree inspection is intentionally blocked until a committed-fiber inspection API exists.',
      routingGate
    ),
    update: createRendererUnsupportedFunction(
      'create().update',
      1,
      'Root updates are intentionally blocked until the JavaScript facade can route through the Rust TestRendererRoot.',
      routingGate,
      (args) =>
        createPrivateRootUpdateDiagnostics(privateRootBridgeState, args[0])
    ),
    unmount: createRendererUnsupportedFunction(
      'create().unmount',
      0,
      'Root unmount is intentionally blocked until the JavaScript facade can route through the Rust TestRendererRoot.',
      routingGate,
      () => createPrivateRootUnmountDiagnostics(privateRootBridgeState)
    ),
    getInstance: createRendererUnsupportedFunction(
      'create().getInstance',
      0,
      'Public instance lookup is intentionally blocked until TestInstance and createNodeMock behavior are implemented.',
      routingGate
    ),
    unstable_flushSync: createRendererUnsupportedFunction(
      'create().unstable_flushSync',
      1,
      'Synchronous flushing is intentionally blocked until react-test-renderer act and scheduler integration are wired.',
      routingGate
    )
  };

  Object.defineProperty(renderer, 'root', {
    configurable: true,
    enumerable: true,
    get() {
      throw createUnsupportedError(
        'create().root',
        'was accessed',
        'TestInstance root access is intentionally blocked until committed fiber inspection is implemented.',
        routingGate
      );
    }
  });

  return renderer;
}

function create(element, options) {
  return createPlaceholderRenderer(createRoutingGate, element, options);
}

exports._Scheduler = schedulerPlaceholder;
exports.act = createUnsupportedFunction(
  'act',
  1,
  'Public act execution is intentionally blocked while the private act scheduler gate only records accepted Scheduler and sync-flush metadata.',
  actSchedulerGate
);
exports.create = defineFunctionShape(create, 'create', 2);
exports.unstable_batchedUpdates = createUnsupportedFunction(
  'unstable_batchedUpdates',
  2
);
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports);
