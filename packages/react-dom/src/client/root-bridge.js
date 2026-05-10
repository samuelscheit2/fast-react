'use strict';

const {
  assertValidContainer,
  describeContainer,
  getOwnerDocument
} = require('./dom-container.js');
const {
  duplicateCreateRootWarning,
  getCreateRootWarning,
  hasLegacyRootMarker,
  isContainerMarkedAsRoot,
  legacyRootWarning
} = require('./root-markers.js');
const {hasListeningMarker} = require('../events/listener-registry.js');

const CLIENT_ROOT_KIND = 'client';
const CONCURRENT_ROOT_TAG = 'ConcurrentRoot';

const privateRootOwnerType = 'fast.react_dom.private_root_owner';
const privateRootHandleType = 'fast.react_dom.private_root_handle';
const privateRootCreateRecordType =
  'fast.react_dom.private_root_create_record';
const privateRootUpdateRecordType =
  'fast.react_dom.private_root_update_record';

const ROOT_LIFECYCLE_CREATED = 'created';
const ROOT_LIFECYCLE_RENDERED = 'rendered';
const ROOT_LIFECYCLE_UNMOUNTED = 'unmounted';

const rootOwnerState = new WeakMap();
const rootHandleState = new WeakMap();
const rootRecordPayloads = new WeakMap();

function createPrivateRootBridgeShell(options) {
  const bridgeState = createBridgeState(options);

  return Object.freeze({
    createClientRoot(container, rootOptions) {
      return createClientRootRecordWithBridge(
        bridgeState,
        container,
        rootOptions
      );
    },
    renderContainer(rootHandle, element, callback) {
      assertHandleBelongsToBridge(rootHandle, bridgeState);
      return createRootUpdateRecordWithBridge(
        bridgeState,
        rootHandle,
        'render',
        false,
        element,
        callback
      );
    },
    updateContainer(rootHandle, element, callback) {
      assertHandleBelongsToBridge(rootHandle, bridgeState);
      return createRootUpdateRecordWithBridge(
        bridgeState,
        rootHandle,
        'render',
        false,
        element,
        callback
      );
    },
    unmountContainer(rootHandle, callback) {
      assertHandleBelongsToBridge(rootHandle, bridgeState);
      return createRootUpdateRecordWithBridge(
        bridgeState,
        rootHandle,
        'unmount',
        true,
        null,
        callback
      );
    }
  });
}

const defaultBridgeShell = createPrivateRootBridgeShell();

function createClientRootRecord(container, rootOptions) {
  return defaultBridgeShell.createClientRoot(container, rootOptions);
}

function createRootUpdateRecord(rootHandle, element, callback) {
  const state = assertPrivateRootHandle(rootHandle);
  return createRootUpdateRecordWithBridge(
    state.bridgeState,
    rootHandle,
    'render',
    false,
    element,
    callback
  );
}

function createRootRenderRecord(rootHandle, element, callback) {
  return createRootUpdateRecord(rootHandle, element, callback);
}

function createRootUnmountRecord(rootHandle, callback) {
  const state = assertPrivateRootHandle(rootHandle);
  return createRootUpdateRecordWithBridge(
    state.bridgeState,
    rootHandle,
    'unmount',
    true,
    null,
    callback
  );
}

function createPrivateRootOwner(rootId, options) {
  if (typeof rootId !== 'string' || rootId.length === 0) {
    const error = new Error('Cannot create a private root owner without a root id.');
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_ID';
    throw error;
  }

  const owner = Object.freeze({
    $$typeof: privateRootOwnerType,
    kind: 'FastReactDomPrivateRootOwner',
    rootId,
    rootKind: getRootKind(options),
    rootTag: getRootTag(options)
  });
  rootOwnerState.set(owner, {
    rootId: owner.rootId,
    rootKind: owner.rootKind,
    rootTag: owner.rootTag
  });
  return owner;
}

function createPrivateRootHandle(owner, container, rootOptions, bridgeState) {
  const ownerState = assertPrivateRootOwner(owner);
  const rootBridgeState = bridgeState || createBridgeState();
  assertValidContainer(container, rootBridgeState.validationOptions);

  const handle = Object.freeze({
    $$typeof: privateRootHandleType,
    kind: 'FastReactDomPrivateRootHandle',
    rootId: ownerState.rootId,
    rootKind: ownerState.rootKind,
    rootTag: ownerState.rootTag,
    owner
  });

  rootHandleState.set(handle, {
    bridgeState: rootBridgeState,
    container,
    containerInfo: freezeRecord(describeContainer(container)),
    lifecycleStatus: ROOT_LIFECYCLE_CREATED,
    renderCount: 0,
    rootOptions
  });

  return handle;
}

function isPrivateRootOwner(value) {
  return rootOwnerState.has(value);
}

function isPrivateRootHandle(value) {
  return rootHandleState.has(value);
}

function getRootOwnerFromHandle(rootHandle) {
  return assertPrivateRootHandle(rootHandle).owner;
}

function getPrivateRootRecordPayload(record) {
  return rootRecordPayloads.get(record) || null;
}

function createClientRootRecordWithBridge(bridgeState, container, rootOptions) {
  assertValidContainer(container, bridgeState.validationOptions);

  const sequence = bridgeState.nextRootSequence++;
  const rootId = `${bridgeState.rootIdPrefix}:${sequence}`;
  const owner = createPrivateRootOwner(rootId);
  const handle = createPrivateRootHandle(
    owner,
    container,
    rootOptions,
    bridgeState
  );
  const handleState = rootHandleState.get(handle);
  const requestInfo = createRequestInfo(bridgeState, 'createRoot');

  const record = freezeRecord({
    $$typeof: privateRootCreateRecordType,
    kind: 'FastReactDomPrivateRootCreateRecord',
    operation: 'create',
    requestId: requestInfo.requestId,
    requestSequence: requestInfo.requestSequence,
    requestType: requestInfo.requestType,
    sequence,
    rootId,
    rootKind: CLIENT_ROOT_KIND,
    rootTag: CONCURRENT_ROOT_TAG,
    containerInfo: handleState.containerInfo,
    listenerGuard: describeRootListenerGuard(container),
    markerGuard: describeCreateRootMarkerGuard(
      container,
      bridgeState.markerOptions
    ),
    nativeExecution: false,
    rootOptionsInfo: describeBridgeValue(rootOptions),
    owner,
    handle
  });

  rootRecordPayloads.set(record, {
    container,
    rootOptions
  });

  return record;
}

function createRootUpdateRecordWithBridge(
  bridgeState,
  rootHandle,
  operation,
  sync,
  element,
  callback
) {
  const handleState = getPrivateRootHandleState(rootHandle);
  if (handleState.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root handle with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const lifecycleStatusBefore = handleState.lifecycleStatus;
  let lifecycleStatusAfter = lifecycleStatusBefore;
  let noOp = false;
  let recordSync = sync;
  let requestType = 'root.render';

  if (operation === 'render') {
    assertRootHandleCanRender(handleState);
    lifecycleStatusAfter = ROOT_LIFECYCLE_RENDERED;
    handleState.renderCount++;
  } else if (operation === 'unmount') {
    requestType = 'root.unmount';
    if (lifecycleStatusBefore === ROOT_LIFECYCLE_UNMOUNTED) {
      noOp = true;
      recordSync = false;
    } else {
      lifecycleStatusAfter = ROOT_LIFECYCLE_UNMOUNTED;
    }
  }

  handleState.lifecycleStatus = lifecycleStatusAfter;

  const sequence = bridgeState.nextUpdateSequence++;
  const updateId = `${bridgeState.updateIdPrefix}:${sequence}`;
  const requestInfo = createRequestInfo(bridgeState, requestType);
  const record = freezeRecord({
    $$typeof: privateRootUpdateRecordType,
    kind: 'FastReactDomPrivateRootUpdateRecord',
    operation,
    requestId: requestInfo.requestId,
    requestSequence: requestInfo.requestSequence,
    requestType: requestInfo.requestType,
    sequence,
    updateId,
    rootId: rootHandle.rootId,
    rootKind: rootHandle.rootKind,
    rootTag: rootHandle.rootTag,
    lifecycleStatusAfter,
    lifecycleStatusBefore,
    markerGuard:
      operation === 'unmount'
        ? describeUnmountMarkerGuard(handleState.container)
        : null,
    nativeExecution: false,
    noOp,
    renderCount: handleState.renderCount,
    sync: recordSync,
    elementInfo: describeBridgeValue(element),
    callbackInfo: describeBridgeValue(callback)
  });

  rootRecordPayloads.set(record, {
    callback,
    element,
    rootHandle
  });

  return record;
}

function getPrivateRootHandleState(rootHandle) {
  const state = rootHandleState.get(rootHandle);
  if (state === undefined) {
    const error = new Error('Expected a private React DOM root handle.');
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_HANDLE';
    throw error;
  }
  return state;
}

function assertPrivateRootOwner(owner) {
  const state = rootOwnerState.get(owner);
  if (state === undefined) {
    const error = new Error('Expected a private React DOM root owner.');
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_OWNER';
    throw error;
  }
  return state;
}

function assertPrivateRootHandle(rootHandle) {
  const state = getPrivateRootHandleState(rootHandle);
  return {
    ...state,
    owner: rootHandle.owner
  };
}

function assertHandleBelongsToBridge(rootHandle, bridgeState) {
  const state = assertPrivateRootHandle(rootHandle);
  if (state.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root handle with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }
  return state;
}

function getIdPrefix(value, fallback) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function createBridgeState(options) {
  return {
    markerOptions: options && options.markerOptions,
    nextRequestSequence: 1,
    rootIdPrefix: getIdPrefix(options && options.rootIdPrefix, 'root'),
    requestIdPrefix: getIdPrefix(
      options && options.requestIdPrefix,
      'request'
    ),
    updateIdPrefix: getIdPrefix(options && options.updateIdPrefix, 'update'),
    nextRootSequence: 1,
    nextUpdateSequence: 1,
    validationOptions: options && options.validationOptions
  };
}

function getRootKind(options) {
  return (options && options.rootKind) || CLIENT_ROOT_KIND;
}

function getRootTag(options) {
  return (options && options.rootTag) || CONCURRENT_ROOT_TAG;
}

function createRequestInfo(bridgeState, requestType) {
  const requestSequence = bridgeState.nextRequestSequence++;
  return freezeRecord({
    requestId: `${bridgeState.requestIdPrefix}:${requestSequence}`,
    requestSequence,
    requestType
  });
}

function assertRootHandleCanRender(handleState) {
  if (handleState.lifecycleStatus === ROOT_LIFECYCLE_UNMOUNTED) {
    const error = new Error('Cannot update an unmounted root.');
    error.code = 'FAST_REACT_DOM_UNMOUNTED_ROOT';
    throw error;
  }
}

function describeCreateRootMarkerGuard(container, options) {
  const warningMessage = getCreateRootWarning(container, options);
  return freezeRecord({
    action: 'defer-mark-container-as-root',
    hasLegacyRootMarker: hasLegacyRootMarker(container),
    isContainerMarkedAsRoot: isContainerMarkedAsRoot(container),
    warning: describeCreateRootWarning(warningMessage)
  });
}

function describeCreateRootWarning(message) {
  if (message === null) {
    return null;
  }

  let warningType = 'unknown';
  if (message === duplicateCreateRootWarning) {
    warningType = 'duplicate-create-root';
  } else if (message === legacyRootWarning) {
    warningType = 'legacy-root-container';
  }

  return freezeRecord({
    message,
    type: warningType
  });
}

function describeUnmountMarkerGuard(container) {
  return freezeRecord({
    action: 'defer-unmark-container-as-root-after-sync-flush',
    isContainerMarkedAsRoot: isContainerMarkedAsRoot(container)
  });
}

function describeRootListenerGuard(container) {
  const ownerDocument = getOwnerDocument(container);
  return freezeRecord({
    action: 'defer-listen-to-all-supported-events',
    canInstallRootListeners: canInstallListener(container),
    hasRootListeningMarker: hasListeningMarker(container),
    ownerDocumentCanInstallSelectionChange: canInstallListener(ownerDocument),
    ownerDocumentHasSelectionChangeMarker: hasListeningMarker(ownerDocument),
    ownerDocumentInfo:
      ownerDocument === null
        ? null
        : freezeRecord(describeContainer(ownerDocument)),
    rootEventTargetInfo: freezeRecord(describeContainer(container))
  });
}

function canInstallListener(target) {
  return !!(
    target != null &&
    (typeof target === 'object' || typeof target === 'function') &&
    typeof target.addEventListener === 'function'
  );
}

function describeBridgeValue(value) {
  if (value === null) {
    return Object.freeze({
      type: 'null'
    });
  }

  const type = typeof value;
  if (type === 'undefined') {
    return Object.freeze({
      type: 'undefined'
    });
  }

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return Object.freeze({
      type,
      value
    });
  }

  if (type === 'function') {
    return Object.freeze({
      length: value.length,
      name: value.name || '',
      type: 'function'
    });
  }

  if (type === 'symbol') {
    return Object.freeze({
      description: value.description || null,
      type: 'symbol'
    });
  }

  if (Array.isArray(value)) {
    return Object.freeze({
      length: value.length,
      type: 'array'
    });
  }

  return Object.freeze({
    keys: Object.keys(value).sort(),
    type: 'object'
  });
}

function freezeRecord(record) {
  return Object.freeze(record);
}

module.exports = {
  CLIENT_ROOT_KIND,
  CONCURRENT_ROOT_TAG,
  ROOT_LIFECYCLE_CREATED,
  ROOT_LIFECYCLE_RENDERED,
  ROOT_LIFECYCLE_UNMOUNTED,
  createClientRootRecord,
  createPrivateRootBridgeShell,
  createPrivateRootHandle,
  createPrivateRootOwner,
  createRootRenderRecord,
  createRootUnmountRecord,
  createRootUpdateRecord,
  describeCreateRootMarkerGuard,
  describeRootListenerGuard,
  describeUnmountMarkerGuard,
  getPrivateRootRecordPayload,
  getRootOwnerFromHandle,
  isPrivateRootHandle,
  isPrivateRootOwner,
  privateRootCreateRecordType,
  privateRootHandleType,
  privateRootOwnerType,
  privateRootUpdateRecordType
};
