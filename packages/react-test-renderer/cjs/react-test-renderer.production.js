'use strict';

const compatibilityTarget = 'react-test-renderer@19.2.6';
const entrypoint =
  'react-test-renderer/cjs/react-test-renderer.production';
const placeholderVersion = '0.0.0-fast-react-test-renderer-placeholder';
const unimplementedCode = 'FAST_REACT_UNIMPLEMENTED';
const createRoutingGateStatus =
  'blocked-missing-react-test-renderer-create-routing-prerequisites';
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
  compatibilityClaimed: false,
  missingPrerequisites: createRoutingMissingPrerequisites,
  prerequisites: createRoutingPrerequisites,
  privateRoutes,
  updatePrivateRoute,
  unmountPrivateRoute
});
const rootRequestBridgeSymbol = Symbol.for(
  'fast.react_test_renderer.root_request_bridge'
);
const privateRootHandleType =
  'fast.react_test_renderer.private_root_handle';
const privateRootRequestRecordType =
  'fast.react_test_renderer.private_root_request_record';
const rootRequestStatus =
  'admitted-private-test-renderer-root-request-record';
const rootRequestExecutionStatus =
  'blocked-private-test-renderer-root-request-execution';
const rootRequestCompatibilityStatus =
  'blocked-private-test-renderer-root-compatibility';
const rootLifecycleActive = 'active';
const rootLifecycleUnmountScheduled = 'unmount-scheduled';
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

function createUnsupportedFunction(exportName, length) {
  const fn = function fastReactTestRendererUnimplementedPlaceholder() {
    throw createUnsupportedError(exportName, 'was called');
  };

  return defineFunctionShape(fn, exportName, length);
}

function createSchedulerUnsupportedFunction(exportName, name, length) {
  const fn = function fastReactTestRendererSchedulerPlaceholder() {
    throw createUnsupportedError(
      `_Scheduler.${exportName}`,
      'was called',
      'The public Scheduler exposure is intentionally a throwing shape shell until react-test-renderer act and scheduling behavior are wired.'
    );
  };

  return defineFunctionShape(fn, name, length);
}

function createRendererUnsupportedFunction(
  exportName,
  length,
  detail,
  routingGate,
  rootRequestFactory
) {
  const fn = function fastReactTestRendererRendererPlaceholder() {
    const rootRequest =
      rootRequestFactory === undefined
        ? undefined
        : rootRequestFactory(arguments);

    throw createUnsupportedError(
      exportName,
      'was called',
      detail,
      routingGate,
      rootRequest
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
    lifecycleStatus: rootLifecycleActive,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecution: false,
    compatibilityClaimed: false
  });
  const handleState = {
    bridgeState,
    lifecycleStatus: rootLifecycleActive,
    nextElementHandleRaw: 1,
    requests: []
  };

  rootHandleStates.set(rootHandle, handleState);

  const request = createRootRequestRecord({
    bridgeState,
    callback: undefined,
    element,
    handleState,
    lifecycleStatusAfter: rootLifecycleActive,
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
    if (lifecycleStatusBefore !== rootLifecycleActive) {
      rustOutcome = 'IgnoredAfterUnmount';
      scheduled = false;
    }
  } else if (operation === 'unmount') {
    if (lifecycleStatusBefore === rootLifecycleUnmountScheduled) {
      rustOutcome = 'AlreadyUnmountScheduled';
      scheduled = false;
    } else {
      lifecycleStatusAfter = rootLifecycleUnmountScheduled;
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
    elementInfo: describeBridgeValue(element),
    optionsInfo:
      operation === 'create' ? describeCreateOptions(rootOptions) : null,
    callbackInfo: describeBridgeValue(callback),
    canaryShape: freezeRecord({
      rootType: 'TestRendererRoot',
      rootElementHandleType: 'RootElementHandle',
      updateKindEnum: 'TestRendererRootUpdateKind',
      updateKind,
      rootApi,
      containerUpdateApi,
      schedulerApi: 'ensure_root_is_scheduled',
      expectedOutcome: rustOutcome
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

function describeBridgeValue(value) {
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

function throwInvalidRootRequest(message) {
  const error = new Error(message);
  error.name = 'FastReactTestRendererPrivateRootRequestError';
  error.code = 'FAST_REACT_TEST_RENDERER_INVALID_ROOT_REQUEST';
  error.entrypoint = entrypoint;
  error.compatibilityTarget = compatibilityTarget;
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

function createPlaceholderRenderer(routingGate, createRequest) {
  let renderer;
  renderer = {
    _Scheduler: schedulerPlaceholder,
    root: undefined,
    toJSON: createRendererUnsupportedFunction(
      'create().toJSON',
      0,
      'Serialization is intentionally blocked until committed test-renderer host output and serializer APIs exist.',
      routingGate,
      () => createRequest
    ),
    toTree: createRendererUnsupportedFunction(
      'create().toTree',
      0,
      'Fiber tree inspection is intentionally blocked until a committed-fiber inspection API exists.',
      routingGate,
      () => createRequest
    ),
    update: createRendererUnsupportedFunction(
      'create().update',
      1,
      'Root updates are intentionally blocked until the JavaScript facade can route through the Rust TestRendererRoot.',
      routingGate,
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
      () => testRendererRootRequestBridge.unmountRendererRootRequest(renderer)
    ),
    getInstance: createRendererUnsupportedFunction(
      'create().getInstance',
      0,
      'Public instance lookup is intentionally blocked until TestInstance and createNodeMock behavior are implemented.',
      routingGate,
      () => createRequest
    ),
    unstable_flushSync: createRendererUnsupportedFunction(
      'create().unstable_flushSync',
      1,
      'Synchronous flushing is intentionally blocked until react-test-renderer act and scheduler integration are wired.',
      routingGate,
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
        'TestInstance root access is intentionally blocked until committed fiber inspection is implemented.',
        routingGate,
        createRequest
      );
    }
  });

  return renderer;
}

function create(element, options) {
  const createRequest = testRendererRootRequestBridge.createRootRequest(
    element,
    options
  );
  return createPlaceholderRenderer(createRoutingGate, createRequest);
}

exports._Scheduler = schedulerPlaceholder;
exports.act = undefined;
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
