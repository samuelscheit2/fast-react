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
const privateRoutes = Object.freeze([
  updatePrivateRoute,
  unmountPrivateRoute
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
  unmountPrivateRoute
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
      actSchedulerGate
    );
  };

  return defineFunctionShape(fn, name, length);
}

function createRendererUnsupportedFunction(
  exportName,
  length,
  detail,
  routingGate
) {
  const fn = function fastReactTestRendererRendererPlaceholder() {
    throw createUnsupportedError(
      exportName,
      'was called',
      detail,
      routingGate
    );
  };

  return defineFunctionShape(fn, exportName.split('.').pop(), length);
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

function createPlaceholderRenderer(routingGate) {
  const renderer = {
    _Scheduler: schedulerPlaceholder,
    root: undefined,
    toJSON: createRendererUnsupportedFunction(
      'create().toJSON',
      0,
      'Serialization is intentionally blocked until committed test-renderer host output and serializer APIs exist.',
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
      routingGate
    ),
    unmount: createRendererUnsupportedFunction(
      'create().unmount',
      0,
      'Root unmount is intentionally blocked until the JavaScript facade can route through the Rust TestRendererRoot.',
      routingGate
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

function create() {
  return createPlaceholderRenderer(createRoutingGate);
}

exports._Scheduler = schedulerPlaceholder;
exports.act = isProduction
  ? undefined
  : createUnsupportedFunction(
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
