'use strict';

const {
  assertValidContainer,
  describeContainer,
  getOwnerDocument
} = require('./dom-container.js');
const {
  attachHostInstanceNode,
  commitLatestPropsFromMutationHandoff,
  createHostInstanceToken,
  detachHostInstanceSubtree,
  getLatestPropsFromNode
} = require('./component-tree.js');
const {
  ROOT_MARKER_APPLIED,
  duplicateCreateRootWarning,
  getContainerRoot,
  getCreateRootWarning,
  hasLegacyRootMarker,
  isContainerMarkedAsRoot,
  legacyRootWarning,
  markContainerAsRootWithRevertRecord,
  privateRootMarkerMutationRecordType,
  revertContainerRootMarkerMutation
} = require('./root-markers.js');
const {
  UNSUPPORTED_HYDRATION_ROOT_KIND,
  createHydrationBoundaryGate,
  getPrivateHydrationBoundaryRecordPayload,
  isPrivateHydrationBoundaryRecord
} = require('./hydration-boundary-gate.js');
const {hasListeningMarker} = require('../events/listener-registry.js');
const {
  ROOT_LISTENERS_REGISTERED,
  registerRootListenersForPrivateRoot,
  describePortalContainerListenerGuard,
  privateRootListenerRegistrationRecordType,
  revertRootListenersForPrivateRoot
} = require('../events/root-listeners.js');
const {
  appendChildToContainer,
  appendInitialChild,
  commitDomPropertyUpdateForLatestProps,
  createDomHostElementInstance,
  createDomHostTextInstance,
  getDomPropertyUpdateLatestPropsHandoffPayload,
  removeChild,
  removeChildFromContainer,
  rollbackDomPropertyUpdateLatestPropsHandoff
} = require('../dom-host/mutation.js');
const {
  REACT_PORTAL_TYPE,
  reactDomPortalImplementation
} = require('../shared/create-portal.js');

const CLIENT_ROOT_KIND = 'client';
const CONCURRENT_ROOT_TAG = 'ConcurrentRoot';

const privateRootOwnerType = 'fast.react_dom.private_root_owner';
const privateRootHandleType = 'fast.react_dom.private_root_handle';
const privateRootCreateRecordType =
  'fast.react_dom.private_root_create_record';
const privateRootHydrateRecordType =
  'fast.react_dom.private_root_hydrate_record';
const privateRootUpdateRecordType =
  'fast.react_dom.private_root_update_record';
const privateRootAdmissionRecordType =
  'fast.react_dom.private_root_admission_record';
const privateRootCreateRenderAdmissionRecordType =
  'fast.react_dom.private_root_create_render_admission_record';
const privateRootNativeHandoffRecordType =
  'fast.react_dom.private_root_native_handoff_record';
const privateRootNativeBridgeHandleType =
  'fast.react_dom.private_root_native_bridge_handle';
const privateRootCreateSideEffectRecordType =
  'fast.react_dom.private_root_create_side_effect_record';
const privateRootCreateSideEffectCleanupRecordType =
  'fast.react_dom.private_root_create_side_effect_cleanup_record';
const privateRootInitialHostOutputHandoffRecordType =
  'fast.react_dom.private_root_initial_host_output_handoff_record';
const privateRootInitialHostOutputCleanupRecordType =
  'fast.react_dom.private_root_initial_host_output_cleanup_record';
const privateRootPortalBoundaryRecordType =
  'fast.react_dom.private_root_portal_boundary_record';
const privateRootPortalCommitHandoffRecordType =
  'fast.react_dom.private_root_portal_commit_handoff_record';

const ROOT_LIFECYCLE_CREATED = 'created';
const ROOT_LIFECYCLE_RENDERED = 'rendered';
const ROOT_LIFECYCLE_UNMOUNTED = 'unmounted';
const ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION = 'unsupported-hydration';

const ROOT_BRIDGE_REQUEST_ADMITTED =
  'admitted-private-root-bridge-request-record';
const ROOT_BRIDGE_EXECUTION_BLOCKED =
  'blocked-private-root-bridge-execution';
const ROOT_BRIDGE_COMPATIBILITY_BLOCKED =
  'blocked-private-root-bridge-compatibility';
const ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED =
  'mirrored-private-native-root-request-record';
const ROOT_BRIDGE_MARK_LISTEN_APPLIED =
  'applied-private-root-create-mark-listen-gate';
const ROOT_BRIDGE_MARK_LISTEN_REVERTED =
  'reverted-private-root-create-mark-listen-gate';
const ROOT_BRIDGE_CREATE_RENDER_ADMITTED =
  'admitted-private-root-create-render-path';
const ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED =
  'applied-private-root-initial-host-output';
const ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED =
  'cleaned-private-root-initial-host-output';
const ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED =
  'admitted-private-root-portal-boundary-record';
const ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED =
  'blocked-private-root-portal-diagnostic';
const ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED =
  'admitted-private-root-portal-fake-dom-commit-handoff';
const ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED =
  'blocked-private-root-portal-fake-dom-commit-apply';
const ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED =
  'validated-private-root-portal-container-ownership';
const NATIVE_ROOT_BRIDGE_REQUEST_CREATE = 'create';
const NATIVE_ROOT_BRIDGE_REQUEST_RENDER = 'render';
const NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT = 'unmount';
const NATIVE_ROOT_BRIDGE_HANDLE_ROOT = 'root';
const NATIVE_ROOT_BRIDGE_HANDLE_VALUE = 'value';
const NATIVE_ROOT_BRIDGE_ROOT_HANDLE_ACTIVE = 'active';
const NATIVE_ROOT_BRIDGE_ROOT_HANDLE_RETIRED = 'retired';
const NATIVE_ROOT_BRIDGE_SYNTHETIC_ENVIRONMENT_ID = 1;
const ROOT_BRIDGE_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason: 'No reconciler create/update/unmount execution is admitted.'
  }),
  freezeRecord({
    id: 'dom-mutation',
    blocked: true,
    reason: 'No container children, text, attributes, or HTML may be mutated.'
  }),
  freezeRecord({
    id: 'marker-writes',
    blocked: true,
    reason: 'Root marker writes and clears remain deferred.'
  }),
  freezeRecord({
    id: 'listener-installation',
    blocked: true,
    reason: 'Root listener installation remains deferred.'
  }),
  freezeRecord({
    id: 'hydration',
    blocked: true,
    reason:
      'Hydration root creation, marker consumption, and replay are not admitted.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction and dispatch are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM root lifecycle compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_PORTAL_BOUNDARY_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'portal-child-reconciliation',
    blocked: true,
    reason: 'Portal child reconciliation is not admitted.'
  }),
  freezeRecord({
    id: 'portal-container-mounting',
    blocked: true,
    reason: 'Portal container mounting and preparePortalMount are not admitted.'
  }),
  freezeRecord({
    id: 'portal-container-listeners',
    blocked: true,
    reason: 'Portal container listener installation is deferred.'
  }),
  ...ROOT_BRIDGE_BLOCKED_CAPABILITIES
]);
const ROOT_BRIDGE_CREATE_RENDER_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason: 'No reconciler render, schedule, or commit execution is admitted.'
  }),
  freezeRecord({
    id: 'dom-mutation',
    blocked: true,
    reason: 'No container children, text, attributes, or HTML may be mutated.'
  }),
  freezeRecord({
    id: 'hydration',
    blocked: true,
    reason:
      'Hydration root creation, marker consumption, and replay are not admitted.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction and dispatch are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM root lifecycle compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_CREATE_RENDER_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'create-root-marker-write',
    accepted: true,
    reason:
      'The private createRoot marker mutation record was produced by the explicit mark/listen gate.'
  }),
  freezeRecord({
    id: 'root-listener-installation',
    accepted: true,
    reason:
      'The private root listener registration record was produced by the explicit mark/listen gate.'
  })
]);
const ROOT_BRIDGE_INITIAL_HOST_OUTPUT_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'create-render-admission',
    accepted: true,
    reason:
      'The private create/render admission record validated root marker and listener prerequisites.'
  }),
  freezeRecord({
    id: 'fake-dom-host-component',
    accepted: true,
    reason:
      'A single fake-DOM HostComponent instance was created through the private DOM host adapter.'
  }),
  freezeRecord({
    id: 'fake-dom-host-text',
    accepted: true,
    reason:
      'A single fake-DOM HostText child was created through the private DOM host adapter.'
  }),
  freezeRecord({
    id: 'component-tree-host-instance-map',
    accepted: true,
    reason:
      'HostComponent and HostText fake nodes were attached to private component-tree host instance tokens.'
  }),
  freezeRecord({
    id: 'latest-props-publication',
    accepted: true,
    reason:
      'Latest props were published only after the private mutation handoff was accepted.'
  })
]);
const ROOT_BRIDGE_INITIAL_HOST_OUTPUT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'public-root-object',
    blocked: true,
    reason: 'No public React DOM root object is created or exposed.'
  }),
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason:
      'No reconciler render, schedule, complete-work, or commit traversal is admitted.'
  }),
  freezeRecord({
    id: 'hydration',
    blocked: true,
    reason:
      'Hydration root creation, marker consumption, and replay are not admitted.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction, dispatch, and listener invocation are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM root lifecycle compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_PORTAL_COMMIT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'portal-fake-dom-commit-apply',
    blocked: true,
    reason:
      'Portal fake-DOM container replacement is not admitted by this handoff.'
  }),
  freezeRecord({
    id: 'portal-prepare-mount-listeners',
    blocked: true,
    reason:
      'preparePortalMount and portal listener installation remain blocked.'
  }),
  freezeRecord({
    id: 'portal-resource-side-effects',
    blocked: true,
    reason:
      'Document resource, form, and controlled input side effects remain blocked.'
  }),
  ...ROOT_BRIDGE_PORTAL_BOUNDARY_BLOCKED_CAPABILITIES
]);

const rootOwnerState = new WeakMap();
const rootHandleState = new WeakMap();
const rootRecordPayloads = new WeakMap();
const rootNativeHandoffPayloads = new WeakMap();
const rootNativeHandoffRecords = new WeakMap();
const rootCreateRenderAdmissionPayloads = new WeakMap();
const rootCreateRenderAdmissionRecords = new WeakMap();
const rootCreateSideEffectPayloads = new WeakMap();
const rootCreateSideEffectRecords = new WeakMap();
const rootCreateSideEffectCleanupRecords = new WeakMap();
const rootInitialHostOutputHandoffPayloads = new WeakMap();
const rootInitialHostOutputHandoffRecords = new WeakMap();
const rootInitialHostOutputCleanupRecords = new WeakMap();
const rootPortalBoundaryPayloads = new WeakMap();
const rootPortalCommitHandoffPayloads = new WeakMap();

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
    createHydrateRoot(container, initialChildren, hydrationOptions) {
      return createHydrateRootRecordWithBridge(
        bridgeState,
        container,
        initialChildren,
        hydrationOptions
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
    },
    admitRequest(record) {
      return admitRootBridgeRequestWithBridge(bridgeState, record);
    },
    admitCreateRenderPath(createRecord, sideEffectRecord, renderRecord) {
      return admitPrivateCreateRenderPathWithBridge(
        bridgeState,
        createRecord,
        sideEffectRecord,
        renderRecord
      );
    },
    applyInitialRenderHostOutput(admissionRecord) {
      return applyPrivateInitialRenderHostOutputWithBridge(
        bridgeState,
        admissionRecord
      );
    },
    cleanupInitialRenderHostOutput(handoffRecord) {
      return cleanupPrivateInitialRenderHostOutputWithBridge(
        bridgeState,
        handoffRecord
      );
    },
    applyCreateRootSideEffects(record, options) {
      return applyPrivateCreateRootSideEffectsWithBridge(
        bridgeState,
        record,
        options
      );
    },
    createNativeRequestHandoff(record) {
      return createNativeRootBridgeHandoffRecordWithBridge(bridgeState, record);
    },
    revertCreateRootSideEffects(record) {
      return revertPrivateCreateRootSideEffectsWithBridge(bridgeState, record);
    },
    createPortalRootBoundary(record) {
      return createPortalRootBoundaryRecordWithBridge(bridgeState, record);
    },
    createPortalCommitHandoff(record, options) {
      return createPortalCommitHandoffRecordWithBridge(
        bridgeState,
        record,
        options
      );
    }
  });
}

const defaultBridgeShell = createPrivateRootBridgeShell();

function createClientRootRecord(container, rootOptions) {
  return defaultBridgeShell.createClientRoot(container, rootOptions);
}

function createHydrateRootRecord(container, initialChildren, hydrationOptions) {
  return defaultBridgeShell.createHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
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

function admitRootBridgeRequestRecord(record) {
  return admitRootBridgeRequestWithBridge(null, record);
}

function admitPrivateCreateRenderPath(
  createRecord,
  sideEffectRecord,
  renderRecord
) {
  return admitPrivateCreateRenderPathWithBridge(
    null,
    createRecord,
    sideEffectRecord,
    renderRecord
  );
}

function applyPrivateInitialRenderHostOutput(admissionRecord) {
  return applyPrivateInitialRenderHostOutputWithBridge(null, admissionRecord);
}

function cleanupPrivateInitialRenderHostOutput(handoffRecord) {
  return cleanupPrivateInitialRenderHostOutputWithBridge(null, handoffRecord);
}

function createNativeRootBridgeHandoffRecord(record) {
  return createNativeRootBridgeHandoffRecordWithBridge(null, record);
}

function applyPrivateCreateRootSideEffects(record, options) {
  return applyPrivateCreateRootSideEffectsWithBridge(null, record, options);
}

function revertPrivateCreateRootSideEffects(record) {
  return revertPrivateCreateRootSideEffectsWithBridge(null, record);
}

function createPortalRootBoundaryRecord(record) {
  return createPortalRootBoundaryRecordWithBridge(null, record);
}

function createPortalCommitHandoffRecord(record, options) {
  return createPortalCommitHandoffRecordWithBridge(null, record, options);
}

function admitRootBridgeRequestWithBridge(bridgeState, record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root bridge request with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  return createRootBridgeAdmissionRecord(record, validation);
}

function admitPrivateCreateRenderPathWithBridge(
  bridgeState,
  createRecord,
  sideEffectRecord,
  renderRecord
) {
  const createValidation = validateRootBridgeRequestRecord(createRecord);
  const renderValidation = validateRootBridgeRequestRecord(renderRecord);
  if (createValidation.operation !== 'create') {
    throwInvalidCreateRenderAdmission(
      'Expected a private React DOM createRoot record for create/render admission.'
    );
  }
  if (renderValidation.operation !== 'render') {
    throwInvalidCreateRenderAdmission(
      'Expected a private React DOM root.render record for create/render admission.'
    );
  }
  if (bridgeState !== null && createValidation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }
  if (bridgeState !== null && renderValidation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }
  if (createValidation.bridgeState !== renderValidation.bridgeState) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission records must belong to the same root bridge shell.'
    );
  }

  const sideEffectValidation = validateCreateRenderSideEffectRecord(
    sideEffectRecord,
    createRecord,
    createValidation
  );
  if (bridgeState !== null && sideEffectValidation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const renderPayload = rootRecordPayloads.get(renderRecord);
  if (renderPayload.rootHandle !== createRecord.handle) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires a render record for the created root handle.'
    );
  }
  if (createRecord.requestSequence >= renderRecord.requestSequence) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires createRoot before root.render.'
    );
  }

  const existing = rootCreateRenderAdmissionRecords.get(renderRecord);
  if (existing !== undefined) {
    const existingPayload = rootCreateRenderAdmissionPayloads.get(existing);
    if (
      existingPayload !== undefined &&
      existingPayload.sideEffectRecord === sideEffectRecord
    ) {
      return existing;
    }
  }

  const rootBridgeState = createValidation.bridgeState;
  const sequence = rootBridgeState.nextCreateRenderAdmissionSequence++;
  const admissionId = `${rootBridgeState.createRenderAdmissionIdPrefix}:${sequence}`;
  const createAdmission = createRootBridgeAdmissionRecord(
    createRecord,
    createValidation
  );
  const renderAdmission = createRootBridgeAdmissionRecord(
    renderRecord,
    renderValidation
  );
  const admissionRecord = freezeRecord({
    $$typeof: privateRootCreateRenderAdmissionRecordType,
    kind: 'FastReactDomPrivateRootCreateRenderAdmissionRecord',
    operation: 'create-render',
    admissionId,
    admissionSequence: sequence,
    admissionStatus: ROOT_BRIDGE_CREATE_RENDER_ADMITTED,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    rootId: createRecord.rootId,
    rootKind: createRecord.rootKind,
    rootTag: createRecord.rootTag,
    createRequestId: createRecord.requestId,
    createRequestSequence: createRecord.requestSequence,
    createRequestType: createRecord.requestType,
    renderRequestId: renderRecord.requestId,
    renderRequestSequence: renderRecord.requestSequence,
    renderRequestType: renderRecord.requestType,
    renderUpdateId: renderRecord.updateId,
    sideEffectId: sideEffectRecord.sideEffectId,
    sideEffectSequence: sideEffectRecord.sideEffectSequence,
    sideEffectStatus: sideEffectRecord.sideEffectStatus,
    createAdmission,
    renderAdmission,
    markerRecord: sideEffectRecord.markerRecord,
    listenerRegistration: sideEffectRecord.listenerRegistration,
    createRootPrerequisites: freezeRecord({
      accepted: true,
      createRequestAccepted: true,
      markListenAccepted: true,
      markerStatus: sideEffectRecord.markerRecord.markerStatus,
      listenerRegistrationStatus:
        sideEffectRecord.listenerRegistration.registrationStatus,
      rootMarkerMatchesOwner: true,
      rootListeningMarkerPresent: sideEffectValidation.rootListeningMarkerPresent,
      ownerDocumentListeningMarkerPresent:
        sideEffectValidation.ownerDocumentListeningMarkerPresent,
      sideEffectActiveAtAdmission: true
    }),
    lifecyclePrerequisites: freezeRecord({
      accepted: true,
      lifecycleStatusBefore: createRecord.lifecycleStatusBefore,
      lifecycleStatusAfter: renderRecord.lifecycleStatusAfter,
      lifecycleTransition: 'none->created->rendered',
      operation: 'create-render',
      rootKind: createRecord.rootKind,
      rootTag: createRecord.rootTag
    }),
    acceptedCapabilities: ROOT_BRIDGE_CREATE_RENDER_ACCEPTED_CAPABILITIES,
    blockedCapabilities: ROOT_BRIDGE_CREATE_RENDER_BLOCKED_CAPABILITIES,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: false,
    markerWrites: true,
    listenerInstallation: true,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootCreateRenderAdmissionRecords.set(renderRecord, admissionRecord);
  rootCreateRenderAdmissionPayloads.set(admissionRecord, {
    bridgeState: rootBridgeState,
    container: sideEffectValidation.container,
    createRecord,
    element: renderPayload.element,
    renderRecord,
    sideEffectRecord
  });

  return admissionRecord;
}

function applyPrivateInitialRenderHostOutputWithBridge(
  bridgeState,
  admissionRecord
) {
  const validation = validateInitialHostOutputAdmissionRecord(
    bridgeState,
    admissionRecord
  );
  const existing = rootInitialHostOutputHandoffRecords.get(admissionRecord);
  if (existing !== undefined) {
    const existingPayload = rootInitialHostOutputHandoffPayloads.get(existing);
    if (existingPayload && existingPayload.active) {
      return existing;
    }
  }

  assertInitialHostOutputContainerCanReceiveRootChild(validation.container);

  const rootBridgeState = validation.bridgeState;
  const sequence = rootBridgeState.nextInitialHostOutputSequence++;
  const handoffId = `${rootBridgeState.initialHostOutputIdPrefix}:${sequence}`;
  const hostOutput = normalizeInitialHostOutputElement(validation.element);
  const hostOwner = freezeRecord({
    kind: 'FastReactDomPrivateInitialHostComponentOwner',
    handoffId,
    hostType: hostOutput.type,
    renderUpdateId: validation.renderRecord.updateId
  });
  const textOwner = freezeRecord({
    kind: 'FastReactDomPrivateInitialHostTextOwner',
    handoffId,
    hostType: hostOutput.type,
    renderUpdateId: validation.renderRecord.updateId
  });
  let hostNode = null;
  let textNode = null;
  let hostToken = null;
  let textToken = null;
  let latestPropsMutationHandoff = null;
  let latestPropsMutationPayload = null;
  let latestPropsBeforeCommit = null;
  let latestPropsAfterCommit = null;
  let hostAppendedToContainer = false;
  let textAppendedToHost = false;

  try {
    hostNode = createDomHostElementInstance(
      hostOutput.type,
      validation.container
    );
    hostToken = createHostInstanceToken(hostOwner, validation.rootOwner);
    attachHostInstanceNode(hostNode, hostToken, hostOutput.previousProps);

    latestPropsMutationHandoff = commitDomPropertyUpdateForLatestProps(
      hostNode,
      hostOutput.type,
      hostOutput.previousProps,
      hostOutput.nextProps
    );
    latestPropsMutationPayload =
      getDomPropertyUpdateLatestPropsHandoffPayload(
        latestPropsMutationHandoff
      );
    latestPropsBeforeCommit = getLatestPropsFromNode(hostNode);
    latestPropsAfterCommit = requireLatestPropsCommitResult(
      latestPropsMutationHandoff
    );

    textNode = createDomHostTextInstance(
      hostOutput.text,
      validation.container
    );
    textToken = createHostInstanceToken(textOwner, validation.rootOwner);
    attachHostInstanceNode(textNode, textToken, null);
    appendInitialChild(hostNode, textNode);
    textAppendedToHost = true;
    appendChildToContainer(validation.container, hostNode);
    hostAppendedToContainer = true;
  } catch (error) {
    rollbackPartialInitialHostOutput({
      container: validation.container,
      hostAppendedToContainer,
      hostNode,
      latestPropsMutationHandoff,
      textAppendedToHost,
      textNode
    });
    throw error;
  }

  const handoff = freezeRecord({
    $$typeof: privateRootInitialHostOutputHandoffRecordType,
    kind: 'FastReactDomPrivateRootInitialHostOutputHandoffRecord',
    operation: 'initial-host-output',
    handoffId,
    handoffSequence: sequence,
    handoffStatus: ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED,
    sourceAdmissionId: admissionRecord.admissionId,
    sourceAdmissionSequence: admissionRecord.admissionSequence,
    sourceAdmissionStatus: admissionRecord.admissionStatus,
    createRequestId: admissionRecord.createRequestId,
    createRequestSequence: admissionRecord.createRequestSequence,
    renderRequestId: admissionRecord.renderRequestId,
    renderRequestSequence: admissionRecord.renderRequestSequence,
    renderUpdateId: admissionRecord.renderUpdateId,
    sideEffectId: admissionRecord.sideEffectId,
    rootId: admissionRecord.rootId,
    rootKind: admissionRecord.rootKind,
    rootTag: admissionRecord.rootTag,
    hostType: hostOutput.type,
    hostNodeInfo: freezeRecord(describeContainer(hostNode)),
    textNodeInfo: freezeRecord(describeContainer(textNode)),
    containerChildCount: getChildNodeCount(validation.container),
    hostChildCount: getChildNodeCount(hostNode),
    textContent: hostOutput.text,
    acceptedCapabilities: ROOT_BRIDGE_INITIAL_HOST_OUTPUT_ACCEPTED_CAPABILITIES,
    blockedCapabilities: ROOT_BRIDGE_INITIAL_HOST_OUTPUT_BLOCKED_CAPABILITIES,
    cleanupRequired: true,
    cleanupApplied: false,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: true,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootInitialHostOutputHandoffRecords.set(admissionRecord, handoff);
  rootInitialHostOutputHandoffPayloads.set(handoff, {
    active: true,
    admissionRecord,
    bridgeState: rootBridgeState,
    container: validation.container,
    createRecord: validation.createRecord,
    element: validation.element,
    hostNode,
    hostToken,
    latestPropsAfterCommit,
    latestPropsBeforeCommit,
    latestPropsMutationHandoff,
    latestPropsMutationPayload,
    nextProps: hostOutput.nextProps,
    renderRecord: validation.renderRecord,
    rootOwner: validation.rootOwner,
    sideEffectRecord: validation.sideEffectRecord,
    textNode,
    textToken
  });

  return handoff;
}

function cleanupPrivateInitialRenderHostOutputWithBridge(
  bridgeState,
  handoffRecord
) {
  const payload = rootInitialHostOutputHandoffPayloads.get(handoffRecord);
  if (payload === undefined) {
    throwInvalidInitialHostOutputHandoff(
      'Expected a private React DOM initial host-output handoff record.'
    );
  }
  if (bridgeState !== null && payload.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const existingCleanup =
    rootInitialHostOutputCleanupRecords.get(handoffRecord);
  if (!payload.active && existingCleanup !== undefined) {
    return existingCleanup;
  }

  const cleanupResult = cleanupInitialHostOutputPayload(payload);
  payload.active = false;

  const cleanupRecord = freezeRecord({
    $$typeof: privateRootInitialHostOutputCleanupRecordType,
    kind: 'FastReactDomPrivateRootInitialHostOutputCleanupRecord',
    operation: 'initial-host-output-cleanup',
    cleanupStatus: ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED,
    sourceHandoffId: handoffRecord.handoffId,
    sourceHandoffSequence: handoffRecord.handoffSequence,
    sourceHandoffStatus: handoffRecord.handoffStatus,
    sourceAdmissionId: handoffRecord.sourceAdmissionId,
    rootId: handoffRecord.rootId,
    rootKind: handoffRecord.rootKind,
    rootTag: handoffRecord.rootTag,
    removedRootChild: cleanupResult.removedRootChild,
    detachedHostInstanceCount: cleanupResult.detachedHostInstanceCount,
    containerChildCountAfterCleanup:
      cleanupResult.containerChildCountAfterCleanup,
    cleanupRequired: false,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: cleanupResult.removedRootChild,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootInitialHostOutputCleanupRecords.set(handoffRecord, cleanupRecord);
  return cleanupRecord;
}

function createNativeRootBridgeHandoffRecordWithBridge(bridgeState, record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root bridge request with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }
  if (validation.operation === 'hydrate') {
    throwInvalidRootBridgeRequest(
      'Private hydrateRoot bridge records are diagnostic-only and cannot be handed to the native root bridge.'
    );
  }

  const existing = rootNativeHandoffRecords.get(record);
  if (existing !== undefined) {
    return existing;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const handoffSequence = record.requestSequence;
  const payload = rootRecordPayloads.get(record) || null;
  const nativeRequestRecord = createNativeRequestRecordMirror(
    record,
    validation.rootHandleState,
    payload
  );
  const handoff = freezeRecord({
    $$typeof: privateRootNativeHandoffRecordType,
    kind: 'FastReactDomPrivateRootNativeRequestHandoffRecord',
    operation: record.operation,
    handoffId: `${rootBridgeState.nativeHandoffIdPrefix}:${handoffSequence}`,
    handoffSequence,
    handoffStatus: ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED,
    sourceRequestId: record.requestId,
    sourceRequestSequence: record.requestSequence,
    sourceRequestType: record.requestType,
    sourceLifecycleStatusBefore: record.lifecycleStatusBefore,
    sourceLifecycleStatusAfter: record.lifecycleStatusAfter,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    nativeRequestRecord,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootNativeHandoffRecords.set(record, handoff);
  rootNativeHandoffPayloads.set(handoff, {
    sourcePayload: payload,
    sourceRecord: record,
    value: getNativeHandoffSourceValue(record, payload)
  });

  return handoff;
}

function applyPrivateCreateRootSideEffectsWithBridge(
  bridgeState,
  record,
  options
) {
  const validation = validateCreateRootSideEffectRequest(record);
  const rootBridgeState = validation.rootHandleState.bridgeState;
  if (bridgeState !== null && rootBridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root bridge request with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const existing = rootCreateSideEffectRecords.get(record);
  if (existing !== undefined) {
    const existingPayload = rootCreateSideEffectPayloads.get(existing);
    if (existingPayload && existingPayload.active) {
      return existing;
    }
  }

  const sourcePayload = rootRecordPayloads.get(record);
  const container = sourcePayload.container;
  const sideEffectSequence = rootBridgeState.nextSideEffectSequence++;
  const sideEffectId = `${rootBridgeState.sideEffectIdPrefix}:${sideEffectSequence}`;
  let markerRecord = null;
  let listenerRegistration = null;

  try {
    markerRecord = markContainerAsRootWithRevertRecord(
      record.owner,
      container,
      rootBridgeState.markerOptions
    );
    listenerRegistration = registerRootListenersForPrivateRoot(
      container,
      getCreateRootSideEffectListenerOptions(options)
    );
  } catch (error) {
    if (markerRecord !== null) {
      try {
        revertContainerRootMarkerMutation(markerRecord);
      } catch (cleanupError) {
        error.cleanupError = {
          code: cleanupError.code || null,
          message: cleanupError.message
        };
      }
    }
    throw error;
  }

  const sideEffectRecord = freezeRecord({
    $$typeof: privateRootCreateSideEffectRecordType,
    kind: 'FastReactDomPrivateRootCreateSideEffectRecord',
    operation: 'create',
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    requestType: record.requestType,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    sideEffectId,
    sideEffectSequence,
    sideEffectStatus: ROOT_BRIDGE_MARK_LISTEN_APPLIED,
    markerRecord,
    listenerRegistration,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: true,
    listenerInstallation: true,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    reversible: true
  });

  rootCreateSideEffectRecords.set(record, sideEffectRecord);
  rootCreateSideEffectPayloads.set(sideEffectRecord, {
    active: true,
    bridgeState: rootBridgeState,
    container,
    listenerRegistration,
    markerRecord,
    sourceRecord: record
  });

  return sideEffectRecord;
}

function revertPrivateCreateRootSideEffectsWithBridge(bridgeState, record) {
  const payload = rootCreateSideEffectPayloads.get(record);
  if (payload === undefined) {
    const error = new Error(
      'Expected a private React DOM createRoot side-effect record.'
    );
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_SIDE_EFFECT_RECORD';
    throw error;
  }

  if (bridgeState !== null && payload.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot revert a private root bridge side-effect record with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const existingCleanup = rootCreateSideEffectCleanupRecords.get(record);
  if (!payload.active && existingCleanup !== undefined) {
    return existingCleanup;
  }

  const listenerCleanup = revertRootListenersForPrivateRoot(
    payload.listenerRegistration
  );
  const markerCleanup = revertContainerRootMarkerMutation(payload.markerRecord);
  payload.active = false;

  const cleanupRecord = freezeRecord({
    $$typeof: privateRootCreateSideEffectCleanupRecordType,
    kind: 'FastReactDomPrivateRootCreateSideEffectCleanupRecord',
    operation: 'create',
    requestId: payload.sourceRecord.requestId,
    requestSequence: payload.sourceRecord.requestSequence,
    requestType: payload.sourceRecord.requestType,
    rootId: payload.sourceRecord.rootId,
    rootKind: payload.sourceRecord.rootKind,
    rootTag: payload.sourceRecord.rootTag,
    sideEffectId: record.sideEffectId,
    sideEffectSequence: record.sideEffectSequence,
    sideEffectStatus: ROOT_BRIDGE_MARK_LISTEN_REVERTED,
    markerCleanup,
    listenerCleanup,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    reversible: false
  });

  rootCreateSideEffectCleanupRecords.set(record, cleanupRecord);
  return cleanupRecord;
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
  const nativeRootId = rootBridgeState.nextNativeRootId++;
  const nativeRootHandle = createNativeBridgeHandle(
    rootBridgeState,
    NATIVE_ROOT_BRIDGE_HANDLE_ROOT
  );

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
    nativeRootHandle,
    nativeRootId,
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

function getNativeRootBridgeHandoffPayload(record) {
  return rootNativeHandoffPayloads.get(record) || null;
}

function isNativeRootBridgeHandoffRecord(value) {
  return rootNativeHandoffPayloads.has(value);
}

function getPrivateRootCreateRenderAdmissionPayload(record) {
  return rootCreateRenderAdmissionPayloads.get(record) || null;
}

function isPrivateRootCreateRenderAdmissionRecord(value) {
  return rootCreateRenderAdmissionPayloads.has(value);
}

function getPrivateRootInitialHostOutputHandoffPayload(record) {
  return rootInitialHostOutputHandoffPayloads.get(record) || null;
}

function isPrivateRootInitialHostOutputHandoffRecord(value) {
  return rootInitialHostOutputHandoffPayloads.has(value);
}

function getPrivateRootPortalBoundaryPayload(record) {
  return rootPortalBoundaryPayloads.get(record) || null;
}

function isPrivateRootPortalBoundaryRecord(value) {
  return rootPortalBoundaryPayloads.has(value);
}

function getPrivateRootPortalCommitHandoffPayload(record) {
  return rootPortalCommitHandoffPayloads.get(record) || null;
}

function isPrivateRootPortalCommitHandoffRecord(value) {
  return rootPortalCommitHandoffPayloads.has(value);
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
    lifecycleStatusBefore: null,
    lifecycleStatusAfter: ROOT_LIFECYCLE_CREATED,
    containerInfo: handleState.containerInfo,
    listenerGuard: describeRootListenerGuard(container),
    markerGuard: describeCreateRootMarkerGuard(
      container,
      bridgeState.markerOptions
    ),
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    rootOptionsInfo: describeBridgeValue(rootOptions),
    owner,
    handle
  });

  rootRecordPayloads.set(record, {
    container,
    nativeValueHandle: createNativeBridgeHandle(
      bridgeState,
      NATIVE_ROOT_BRIDGE_HANDLE_VALUE
    ),
    rootOptions
  });

  return record;
}

function createHydrateRootRecordWithBridge(
  bridgeState,
  container,
  initialChildren,
  hydrationOptions
) {
  const hydrationBoundaryRecord =
    bridgeState.hydrationBoundaryGate.recordUnsupportedHydrateRoot(
      container,
      initialChildren,
      hydrationOptions
    );
  const sequence = bridgeState.nextHydrateSequence++;
  const hydrateId = `${bridgeState.hydrateIdPrefix}:${sequence}`;
  const requestInfo = createRequestInfo(bridgeState, 'hydrateRoot');
  const record = freezeRecord({
    $$typeof: privateRootHydrateRecordType,
    kind: 'FastReactDomPrivateRootHydrateRecord',
    operation: 'hydrate',
    requestId: requestInfo.requestId,
    requestSequence: requestInfo.requestSequence,
    requestType: requestInfo.requestType,
    sequence,
    hydrateId,
    rootId: null,
    rootKind: UNSUPPORTED_HYDRATION_ROOT_KIND,
    rootTag: CONCURRENT_ROOT_TAG,
    lifecycleStatusBefore: null,
    lifecycleStatusAfter: ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION,
    status: 'unsupported',
    containerInfo: hydrationBoundaryRecord.containerInfo,
    initialChildrenInfo: hydrationBoundaryRecord.initialChildrenInfo,
    optionsInfo: hydrationBoundaryRecord.optionsInfo,
    oracleInfo: hydrationBoundaryRecord.oracleInfo,
    blockedOn: hydrationBoundaryRecord.blockedOn,
    hydrationBoundaryRecord,
    markerDiagnostics: hydrationBoundaryRecord.markerDiagnostics,
    markerParserEvidence: hydrationBoundaryRecord.markerParserEvidence,
    markerEvidence: hydrationBoundaryRecord.markerEvidence,
    eventReplayBlockers: hydrationBoundaryRecord.eventReplayBlockers,
    markerGuard: hydrationBoundaryRecord.markerGuard,
    listenerGuard: hydrationBoundaryRecord.listenerGuard,
    hydrationRequested: true,
    canHydrate: false,
    publicRootCreated: false,
    containerMarked: false,
    listenersAttached: false,
    domMutated: false,
    eventsReplayed: false,
    rootScheduled: false,
    suspenseHydrationScheduled: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootRecordPayloads.set(record, {
    bridgeState,
    container,
    hydrationBoundaryRecord,
    hydrationOptions,
    initialChildren
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
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    noOp,
    renderCount: handleState.renderCount,
    sync: recordSync,
    elementInfo: describeBridgeValue(element),
    callbackInfo: describeBridgeValue(callback)
  });

  rootRecordPayloads.set(record, {
    callback,
    element,
    nativeValueHandle:
      operation === 'render'
        ? createNativeBridgeHandle(
            bridgeState,
            NATIVE_ROOT_BRIDGE_HANDLE_VALUE
          )
        : null,
    rootHandle
  });

  return record;
}

function validateRootBridgeRequestRecord(record) {
  if (!record || typeof record !== 'object') {
    throwInvalidRootBridgeRequest(
      'Expected a private React DOM root bridge request record.'
    );
  }

  if (record.$$typeof === privateRootCreateRecordType) {
    return validateCreateRootBridgeRequestRecord(record);
  }

  if (record.$$typeof === privateRootHydrateRecordType) {
    return validateHydrateRootBridgeRequestRecord(record);
  }

  if (record.$$typeof === privateRootUpdateRecordType) {
    return validateUpdateRootBridgeRequestRecord(record);
  }

  throwInvalidRootBridgeRequest(
    'Expected a private React DOM root bridge create, render, or unmount record.'
  );
}

function validateCreateRootSideEffectRequest(record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (validation.operation !== 'create') {
    throwInvalidRootBridgeRequest(
      'Expected a private React DOM root bridge create record for root marker and listener side effects.'
    );
  }
  return validation;
}

function validateCreateRenderSideEffectRecord(
  sideEffectRecord,
  createRecord,
  createValidation
) {
  const payload = rootCreateSideEffectPayloads.get(sideEffectRecord);
  if (payload === undefined) {
    throwInvalidCreateRenderAdmission(
      'Expected a private React DOM createRoot mark/listen side-effect record.'
    );
  }
  if (payload.bridgeState !== createValidation.bridgeState) {
    throwForeignRootBridgeRequest();
  }
  if (payload.sourceRecord !== createRecord) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires side effects for the same createRoot record.'
    );
  }
  if (!payload.active) {
    throwInvalidCreateRenderAdmission(
      'Cannot admit a private create/render path after createRoot side effects were reverted.'
    );
  }

  assertCreateRenderAdmissionField(
    sideEffectRecord,
    '$$typeof',
    privateRootCreateSideEffectRecordType
  );
  assertCreateRenderAdmissionField(sideEffectRecord, 'operation', 'create');
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'sideEffectStatus',
    ROOT_BRIDGE_MARK_LISTEN_APPLIED
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'requestId',
    createRecord.requestId
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'requestSequence',
    createRecord.requestSequence
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'requestType',
    createRecord.requestType
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'rootId',
    createRecord.rootId
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'rootKind',
    createRecord.rootKind
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'rootTag',
    createRecord.rootTag
  );
  assertCreateRenderAdmissionField(sideEffectRecord, 'nativeExecution', false);
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'reconcilerExecution',
    false
  );
  assertCreateRenderAdmissionField(sideEffectRecord, 'domMutation', false);
  assertCreateRenderAdmissionField(sideEffectRecord, 'markerWrites', true);
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'listenerInstallation',
    true
  );
  assertCreateRenderAdmissionField(sideEffectRecord, 'hydration', false);
  assertCreateRenderAdmissionField(sideEffectRecord, 'eventDispatch', false);
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'compatibilityClaimed',
    false
  );

  if (
    sideEffectRecord.markerRecord !== payload.markerRecord ||
    sideEffectRecord.markerRecord?.$$typeof !==
      privateRootMarkerMutationRecordType ||
    sideEffectRecord.markerRecord.markerStatus !== ROOT_MARKER_APPLIED
  ) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires the accepted root marker mutation record.'
    );
  }
  if (
    sideEffectRecord.listenerRegistration !== payload.listenerRegistration ||
    sideEffectRecord.listenerRegistration?.$$typeof !==
      privateRootListenerRegistrationRecordType ||
    sideEffectRecord.listenerRegistration.registrationStatus !==
      ROOT_LISTENERS_REGISTERED
  ) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires the accepted root listener registration record.'
    );
  }
  if (getContainerRoot(payload.container) !== createRecord.owner) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires the container marker to match the created root owner.'
    );
  }

  const ownerDocument = getOwnerDocument(payload.container);
  const rootListeningMarkerPresent = hasListeningMarker(payload.container);
  const ownerDocumentListeningMarkerPresent =
    ownerDocument === null ? false : hasListeningMarker(ownerDocument);
  if (!rootListeningMarkerPresent) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires an installed root listening marker.'
    );
  }
  if (
    sideEffectRecord.listenerRegistration.ownerDocumentRegistrationCount > 0 &&
    !ownerDocumentListeningMarkerPresent
  ) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires the owner document listening marker.'
    );
  }

  return {
    bridgeState: payload.bridgeState,
    container: payload.container,
    ownerDocument,
    ownerDocumentListeningMarkerPresent,
    rootListeningMarkerPresent
  };
}

function validateInitialHostOutputAdmissionRecord(bridgeState, record) {
  const payload = rootCreateRenderAdmissionPayloads.get(record);
  if (payload === undefined) {
    throwInvalidInitialHostOutputHandoff(
      'Expected a private create/render admission record for initial host output.'
    );
  }
  if (bridgeState !== null && payload.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  if (
    record.$$typeof !== privateRootCreateRenderAdmissionRecordType ||
    record.kind !== 'FastReactDomPrivateRootCreateRenderAdmissionRecord' ||
    record.operation !== 'create-render' ||
    record.admissionStatus !== ROOT_BRIDGE_CREATE_RENDER_ADMITTED ||
    record.executionStatus !== ROOT_BRIDGE_EXECUTION_BLOCKED ||
    record.compatibilityStatus !== ROOT_BRIDGE_COMPATIBILITY_BLOCKED ||
    record.domMutation !== false ||
    record.publicRootCreated !== false ||
    record.publicRootObjectExposed !== false ||
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.rootScheduled !== false ||
    record.hydration !== false ||
    record.eventDispatch !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidInitialHostOutputHandoff(
      'Expected an intact private create/render admission record before initial host output.'
    );
  }

  const createValidation = validateRootBridgeRequestRecord(payload.createRecord);
  const renderValidation = validateRootBridgeRequestRecord(payload.renderRecord);
  if (
    createValidation.operation !== 'create' ||
    renderValidation.operation !== 'render' ||
    createValidation.bridgeState !== payload.bridgeState ||
    renderValidation.bridgeState !== payload.bridgeState
  ) {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output requires matching create and render root bridge records.'
    );
  }
  if (
    renderValidation.rootHandleState.lifecycleStatus ===
    ROOT_LIFECYCLE_UNMOUNTED
  ) {
    throwInvalidInitialHostOutputHandoff(
      'Cannot apply initial host output after the private root was unmounted.'
    );
  }

  validateCreateRenderSideEffectRecord(
    payload.sideEffectRecord,
    payload.createRecord,
    createValidation
  );
  if (
    record.createRequestId !== payload.createRecord.requestId ||
    record.renderRequestId !== payload.renderRecord.requestId ||
    record.renderUpdateId !== payload.renderRecord.updateId ||
    record.sideEffectId !== payload.sideEffectRecord.sideEffectId
  ) {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output payload is inconsistent.'
    );
  }

  return {
    admissionRecord: record,
    bridgeState: payload.bridgeState,
    container: payload.container,
    createRecord: payload.createRecord,
    element: payload.element,
    renderRecord: payload.renderRecord,
    rootOwner: payload.createRecord.owner,
    sideEffectRecord: payload.sideEffectRecord
  };
}

function validateCreateRootBridgeRequestRecord(record) {
  const payload = rootRecordPayloads.get(record);
  if (payload === undefined) {
    throwInvalidRootBridgeRequest(
      'Expected a root bridge create record produced by the private root bridge.'
    );
  }

  assertRecordField(record, 'operation', 'create');
  assertRecordField(record, 'requestType', 'createRoot');
  assertRecordField(record, 'rootKind', CLIENT_ROOT_KIND);
  assertRecordField(record, 'rootTag', CONCURRENT_ROOT_TAG);
  assertRecordField(record, 'lifecycleStatusBefore', null);
  assertRecordField(
    record,
    'lifecycleStatusAfter',
    ROOT_LIFECYCLE_CREATED
  );
  assertExecutionIsBlockedOnRequestRecord(record);

  const rootHandleState = getPrivateRootHandleState(record.handle);
  const ownerState = assertPrivateRootOwner(record.owner);
  assertRootIdentityMatchesRecord({
    handle: record.handle,
    ownerState,
    record
  });

  return {
    bridgeState: rootHandleState.bridgeState,
    lifecycleTransition: 'none->created',
    operation: 'create',
    rootHandleState
  };
}

function validateHydrateRootBridgeRequestRecord(record) {
  const payload = rootRecordPayloads.get(record);
  if (payload === undefined) {
    throwInvalidRootBridgeRequest(
      'Expected a hydrateRoot bridge record produced by the private root bridge.'
    );
  }

  assertRecordField(record, 'operation', 'hydrate');
  assertRecordField(record, 'requestType', 'hydrateRoot');
  assertRecordField(record, 'rootId', null);
  assertRecordField(record, 'rootKind', UNSUPPORTED_HYDRATION_ROOT_KIND);
  assertRecordField(record, 'rootTag', CONCURRENT_ROOT_TAG);
  assertRecordField(record, 'lifecycleStatusBefore', null);
  assertRecordField(
    record,
    'lifecycleStatusAfter',
    ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION
  );
  assertRecordField(record, 'status', 'unsupported');
  assertRecordField(record, 'hydrationRequested', true);
  assertRecordField(record, 'canHydrate', false);
  assertRecordField(record, 'publicRootCreated', false);
  assertRecordField(record, 'containerMarked', false);
  assertRecordField(record, 'listenersAttached', false);
  assertRecordField(record, 'domMutated', false);
  assertRecordField(record, 'eventsReplayed', false);
  assertRecordField(record, 'rootScheduled', false);
  assertRecordField(record, 'suspenseHydrationScheduled', false);
  assertExecutionIsBlockedOnRequestRecord(record);

  const hydrationBoundaryRecord = record.hydrationBoundaryRecord;
  if (!isPrivateHydrationBoundaryRecord(hydrationBoundaryRecord)) {
    throwInvalidRootBridgeRequest(
      'Expected hydrateRoot bridge records to include a private hydration boundary record.'
    );
  }

  const hydrationPayload = getPrivateHydrationBoundaryRecordPayload(
    hydrationBoundaryRecord
  );
  if (
    hydrationPayload === null ||
    hydrationPayload.container !== payload.container ||
    hydrationPayload.initialChildren !== payload.initialChildren ||
    hydrationPayload.hydrationOptions !== payload.hydrationOptions ||
    payload.hydrationBoundaryRecord !== hydrationBoundaryRecord
  ) {
    throwInvalidRootBridgeRequest(
      'Private hydrateRoot bridge payload does not match its hydration boundary record.'
    );
  }

  assertRecordField(
    record,
    'markerDiagnostics',
    hydrationBoundaryRecord.markerDiagnostics
  );
  assertRecordField(
    record,
    'markerParserEvidence',
    hydrationBoundaryRecord.markerParserEvidence
  );
  assertRecordField(
    record,
    'markerEvidence',
    hydrationBoundaryRecord.markerEvidence
  );
  assertRecordField(
    record,
    'eventReplayBlockers',
    hydrationBoundaryRecord.eventReplayBlockers
  );
  assertRecordField(record, 'markerGuard', hydrationBoundaryRecord.markerGuard);
  assertRecordField(
    record,
    'listenerGuard',
    hydrationBoundaryRecord.listenerGuard
  );

  return {
    bridgeState: payload.bridgeState,
    lifecycleTransition: `none->${ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION}`,
    operation: 'hydrate',
    rootHandleState: null
  };
}

function validateUpdateRootBridgeRequestRecord(record) {
  const payload = rootRecordPayloads.get(record);
  if (payload === undefined) {
    throwInvalidRootBridgeRequest(
      'Expected a root bridge render or unmount record produced by the private root bridge.'
    );
  }

  assertRecordField(record, 'rootKind', CLIENT_ROOT_KIND);
  assertRecordField(record, 'rootTag', CONCURRENT_ROOT_TAG);
  assertExecutionIsBlockedOnRequestRecord(record);

  const rootHandle = payload.rootHandle;
  const rootHandleState = getPrivateRootHandleState(rootHandle);
  const ownerState = assertPrivateRootOwner(rootHandle.owner);
  assertRootIdentityMatchesRecord({
    handle: rootHandle,
    ownerState,
    record
  });

  if (record.operation === 'render') {
    assertRecordField(record, 'requestType', 'root.render');
    assertRecordField(record, 'lifecycleStatusAfter', ROOT_LIFECYCLE_RENDERED);
    assertRecordField(record, 'markerGuard', null);
    assertRecordField(record, 'noOp', false);
    assertRecordField(record, 'sync', false);
    assertAllowedLifecycleBefore(record, [
      ROOT_LIFECYCLE_CREATED,
      ROOT_LIFECYCLE_RENDERED
    ]);
    return {
      bridgeState: rootHandleState.bridgeState,
      lifecycleTransition: `${record.lifecycleStatusBefore}->${record.lifecycleStatusAfter}`,
      operation: 'render',
      rootHandleState
    };
  }

  if (record.operation === 'unmount') {
    assertRecordField(record, 'requestType', 'root.unmount');
    assertRecordField(record, 'lifecycleStatusAfter', ROOT_LIFECYCLE_UNMOUNTED);
    assertAllowedLifecycleBefore(record, [
      ROOT_LIFECYCLE_CREATED,
      ROOT_LIFECYCLE_RENDERED,
      ROOT_LIFECYCLE_UNMOUNTED
    ]);
    if (record.lifecycleStatusBefore === ROOT_LIFECYCLE_UNMOUNTED) {
      assertRecordField(record, 'noOp', true);
      assertRecordField(record, 'sync', false);
    } else {
      assertRecordField(record, 'noOp', false);
      assertRecordField(record, 'sync', true);
    }
    if (record.markerGuard === null || typeof record.markerGuard !== 'object') {
      throwInvalidRootBridgeRequest(
        'Expected an unmount request to include a deferred marker guard.'
      );
    }
    return {
      bridgeState: rootHandleState.bridgeState,
      lifecycleTransition: `${record.lifecycleStatusBefore}->${record.lifecycleStatusAfter}`,
      operation: 'unmount',
      rootHandleState
    };
  }

  throwInvalidRootBridgeRequest(
    `Unsupported private root bridge request operation: ${String(record.operation)}.`
  );
}

function createRootBridgeAdmissionRecord(record, validation) {
  return freezeRecord({
    $$typeof: privateRootAdmissionRecordType,
    kind: 'FastReactDomPrivateRootAdmissionRecord',
    operation: record.operation,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    requestType: record.requestType,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    hydrateId: record.hydrateId || null,
    updateId: record.updateId || null,
    sequence: record.sequence,
    admissionStatus: ROOT_BRIDGE_REQUEST_ADMITTED,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    lifecyclePrerequisites: freezeRecord({
      accepted: true,
      lifecycleStatusBefore: record.lifecycleStatusBefore,
      lifecycleStatusAfter: record.lifecycleStatusAfter,
      lifecycleTransition: validation.lifecycleTransition,
      operation: validation.operation,
      rootKind: record.rootKind,
      rootTag: record.rootTag
    }),
    markerParserEvidence: record.markerParserEvidence || null,
    markerEvidence: record.markerEvidence || null,
    eventReplayBlockers: record.eventReplayBlockers || null,
    blockedCapabilities: ROOT_BRIDGE_BLOCKED_CAPABILITIES,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });
}

function createNativeRequestRecordMirror(record, rootHandleState, payload) {
  let requestKind = null;
  let rootHandleStateAfter = NATIVE_ROOT_BRIDGE_ROOT_HANDLE_ACTIVE;
  let valueHandle = null;

  if (record.operation === 'create') {
    requestKind = NATIVE_ROOT_BRIDGE_REQUEST_CREATE;
    valueHandle = payload.nativeValueHandle;
  } else if (record.operation === 'render') {
    requestKind = NATIVE_ROOT_BRIDGE_REQUEST_RENDER;
    valueHandle = payload.nativeValueHandle;
  } else if (record.operation === 'unmount') {
    requestKind = NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT;
    rootHandleStateAfter = NATIVE_ROOT_BRIDGE_ROOT_HANDLE_RETIRED;
  } else {
    throwInvalidRootBridgeRequest(
      `Unsupported private root bridge request operation: ${String(record.operation)}.`
    );
  }

  return freezeRecord({
    requestId: record.requestSequence,
    kind: requestKind,
    environmentId: rootHandleState.nativeRootHandle.environmentId,
    rootHandle: rootHandleState.nativeRootHandle,
    rootId: rootHandleState.nativeRootId,
    valueHandle,
    rootHandleState: rootHandleStateAfter
  });
}

function createPortalRootBoundaryRecordWithBridge(bridgeState, record) {
  const validation = validatePortalRootBoundaryRequestRecord(record);
  if (
    bridgeState !== null &&
    validation.rootHandleState.bridgeState !== bridgeState
  ) {
    const error = new Error(
      'Cannot use a private root bridge portal boundary with a different ' +
        'root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextPortalBoundarySequence++;
  const boundaryId = `${rootBridgeState.portalBoundaryIdPrefix}:${sequence}`;
  const portal = validation.portal;
  const portalContainer = portal.containerInfo;
  const boundaryRecord = freezeRecord({
    $$typeof: privateRootPortalBoundaryRecordType,
    kind: 'FastReactDomPrivateRootPortalBoundaryRecord',
    operation: 'portal-root-boundary',
    boundaryId,
    boundarySequence: sequence,
    boundaryStatus: ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED,
    diagnosticStatus: ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED,
    sourceOperation: record.operation,
    sourceRequestId: record.requestId,
    sourceRequestSequence: record.requestSequence,
    sourceRequestType: record.requestType,
    sourceUpdateId: record.updateId || null,
    sourceLifecycleStatusBefore: record.lifecycleStatusBefore,
    sourceLifecycleStatusAfter: record.lifecycleStatusAfter,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    portalKey: portal.key,
    portalObjectInfo: describeBridgeValue(portal),
    portalChildrenInfo: describeBridgeValue(portal.children),
    portalContainerInfo: freezeRecord(describeContainer(portalContainer)),
    portalImplementationInfo: describeBridgeValue(portal.implementation),
    portalListenerGuard: describePortalContainerListenerGuard(
      portalContainer,
      {
        action: 'defer-listen-to-portal-container-events-for-root-boundary'
      }
    ),
    portalContainerOwnership: describePortalContainerOwnership(
      validation.payload.rootHandle,
      validation.rootHandleState,
      portalContainer
    ),
    reconcilerDiagnostic: freezeRecord({
      beginWorkRecord: 'UnsupportedPortalBeginWorkRecord',
      failClosedBeforeChildren: true,
      feature: 'portal',
      rootPreflightError:
        'HostRootChildBeginWorkPreflightError::UnsupportedPortal',
      unsupportedFeature: 'PORTAL_RECONCILER_UNSUPPORTED_FEATURE'
    }),
    blockedCapabilities: ROOT_BRIDGE_PORTAL_BOUNDARY_BLOCKED_CAPABILITIES,
    acceptedPortalObjectShape: true,
    nativeExecution: false,
    reconcilerExecution: false,
    portalChildReconciliation: false,
    portalMounting: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootPortalBoundaryPayloads.set(boundaryRecord, {
    portal,
    portalChildren: portal.children,
    portalContainer,
    rootHandle: validation.payload.rootHandle,
    sourceRecord: record
  });

  return boundaryRecord;
}

function createPortalCommitHandoffRecordWithBridge(
  bridgeState,
  record,
  options
) {
  const validation = validatePortalCommitHandoffBoundaryRecord(record);
  if (
    bridgeState !== null &&
    validation.rootHandleState.bridgeState !== bridgeState
  ) {
    const error = new Error(
      'Cannot use a private root bridge portal commit handoff with a ' +
        'different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextPortalCommitSequence++;
  const commitHandoffId = `${rootBridgeState.portalCommitIdPrefix}:${sequence}`;
  const portal = validation.payload.portal;
  const portalContainer = validation.payload.portalContainer;
  const pendingChildren = getPortalCommitPendingChildren(portal, options);
  const portalContainerOwnership = describePortalContainerOwnership(
    validation.payload.rootHandle,
    validation.rootHandleState,
    portalContainer
  );
  const listenerSideEffects = describePortalCommitListenerSideEffects(
    portalContainer,
    record.portalListenerGuard
  );

  const handoff = freezeRecord({
    $$typeof: privateRootPortalCommitHandoffRecordType,
    kind: 'FastReactDomPrivateRootPortalFakeDomCommitHandoffRecord',
    operation: 'portal-fake-dom-commit-handoff',
    commitHandoffId,
    commitHandoffSequence: sequence,
    handoffStatus: ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED,
    commitStatus: ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED,
    sourceBoundaryId: record.boundaryId,
    sourceBoundarySequence: record.boundarySequence,
    sourceBoundaryStatus: record.boundaryStatus,
    sourceDiagnosticStatus: record.diagnosticStatus,
    sourceRequestId: record.sourceRequestId,
    sourceRequestSequence: record.sourceRequestSequence,
    sourceRequestType: record.sourceRequestType,
    sourceUpdateId: record.sourceUpdateId,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    fakeDomCommitTarget: freezeRecord({
      canAppendChild: typeof portalContainer.appendChild === 'function',
      canRemoveChild: typeof portalContainer.removeChild === 'function',
      hasTextContent: 'textContent' in portalContainer,
      portalContainerInfo: record.portalContainerInfo
    }),
    pendingChildrenInfo: describeBridgeValue(pendingChildren),
    portalContainerOwnership,
    listenerSideEffects,
    blockedCapabilities: ROOT_BRIDGE_PORTAL_COMMIT_BLOCKED_CAPABILITIES,
    fakeDomCommitHandoff: true,
    fakeDomCommitApplied: false,
    portalContainerChildrenReplaced: false,
    portalChildReconciliation: false,
    portalMounting: false,
    preparePortalMount: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    resourceSideEffects: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootPortalCommitHandoffPayloads.set(handoff, {
    boundaryRecord: record,
    pendingChildren,
    portal,
    portalContainer,
    rootContainer: validation.rootHandleState.container,
    rootHandle: validation.payload.rootHandle,
    sourceRecord: validation.payload.sourceRecord
  });

  return handoff;
}

function normalizeInitialHostOutputElement(element) {
  if (element === null || typeof element !== 'object') {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output requires a private HostComponent element object.'
    );
  }
  if (typeof element.type !== 'string' || element.type === '') {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output supports only one string HostComponent element.'
    );
  }

  const props =
    element.props !== null && typeof element.props === 'object'
      ? element.props
      : {};
  const text = getInitialHostTextChild(props.children);

  return {
    nextProps: props,
    previousProps: freezeRecord({}),
    text,
    type: element.type
  };
}

function getInitialHostTextChild(children) {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  throwInvalidInitialHostOutputHandoff(
    'Initial host output supports exactly one HostText string or number child.'
  );
}

function requireLatestPropsCommitResult(handoff) {
  return commitLatestPropsFromMutationHandoff(handoff);
}

function rollbackPartialInitialHostOutput({
  container,
  hostAppendedToContainer,
  hostNode,
  latestPropsMutationHandoff,
  textAppendedToHost,
  textNode
}) {
  if (hostAppendedToContainer) {
    try {
      removeChildFromContainer(container, hostNode);
    } catch (error) {
      // Preserve the original private initial host-output failure.
    }
  }
  if (textAppendedToHost) {
    try {
      removeChild(hostNode, textNode);
    } catch (error) {
      // Preserve the original private initial host-output failure.
    }
  }
  if (latestPropsMutationHandoff !== null) {
    try {
      rollbackDomPropertyUpdateLatestPropsHandoff(latestPropsMutationHandoff);
    } catch (error) {
      // Preserve the original private initial host-output failure.
    }
  }
  if (hostNode !== null) {
    detachHostInstanceSubtree(hostNode);
  } else if (textNode !== null) {
    detachHostInstanceSubtree(textNode);
  }
}

function cleanupInitialHostOutputPayload(payload) {
  const removedRootChild = removeInitialHostOutputRootChild(
    payload.container,
    payload.hostNode
  );
  const detachedHostInstanceCount = detachHostInstanceSubtree(payload.hostNode);

  return {
    containerChildCountAfterCleanup: getChildNodeCount(payload.container),
    detachedHostInstanceCount,
    removedRootChild
  };
}

function removeInitialHostOutputRootChild(container, hostNode) {
  if (!isCurrentChild(container, hostNode)) {
    return false;
  }

  removeChildFromContainer(container, hostNode);
  return true;
}

function assertInitialHostOutputContainerCanReceiveRootChild(container) {
  if (getChildNodeCount(container) !== 0 || getFirstChild(container) !== null) {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output requires an empty fake-DOM root container.'
    );
  }
}

function isCurrentChild(parent, child) {
  if (child === null || child === undefined) {
    return false;
  }
  if (child.parentNode === parent) {
    return true;
  }
  return Array.isArray(parent.childNodes) && parent.childNodes.includes(child);
}

function getChildNodeCount(parent) {
  return Array.isArray(parent.childNodes) ? parent.childNodes.length : 0;
}

function getFirstChild(parent) {
  if (parent == null || typeof parent !== 'object') {
    return null;
  }
  if (parent.firstChild !== undefined) {
    return parent.firstChild || null;
  }
  return Array.isArray(parent.childNodes) && parent.childNodes.length > 0
    ? parent.childNodes[0]
    : null;
}

function createNativeBridgeHandle(bridgeState, kind) {
  return freezeRecord({
    $$typeof: privateRootNativeBridgeHandleType,
    environmentId: bridgeState.nativeEnvironmentId,
    slot: bridgeState.nextNativeHandleSlot++,
    generation: 1,
    kind
  });
}

function getNativeHandoffSourceValue(record, payload) {
  if (payload === null) {
    return null;
  }
  if (record.operation === 'create') {
    return payload.container;
  }
  if (record.operation === 'render') {
    return payload.element;
  }
  return null;
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
  const hydrationBoundaryOptions = {
    markerOptions: options && options.markerOptions,
    recordIdPrefix: getIdPrefix(
      options && options.hydrationRecordIdPrefix,
      'hydration'
    ),
    validationOptions: options && options.validationOptions
  };
  if (options && Object.prototype.hasOwnProperty.call(options, 'markerOracle')) {
    hydrationBoundaryOptions.markerOracle = options.markerOracle;
  }
  const hydrationBoundaryGate = createHydrationBoundaryGate(
    hydrationBoundaryOptions
  );

  return {
    hydrateIdPrefix: getIdPrefix(options && options.hydrateIdPrefix, 'hydrate'),
    hydrationBoundaryGate,
    markerOptions: options && options.markerOptions,
    createRenderAdmissionIdPrefix: getIdPrefix(
      options && options.createRenderAdmissionIdPrefix,
      'create-render-admission'
    ),
    initialHostOutputIdPrefix: getIdPrefix(
      options && options.initialHostOutputIdPrefix,
      'initial-host-output'
    ),
    nativeEnvironmentId: getPositiveInteger(
      options && options.nativeEnvironmentId,
      NATIVE_ROOT_BRIDGE_SYNTHETIC_ENVIRONMENT_ID
    ),
    nativeHandoffIdPrefix: getIdPrefix(
      options && options.nativeHandoffIdPrefix,
      'native-handoff'
    ),
    nextRequestSequence: 1,
    portalBoundaryIdPrefix: getIdPrefix(
      options && options.portalBoundaryIdPrefix,
      'portal-boundary'
    ),
    portalCommitIdPrefix: getIdPrefix(
      options && options.portalCommitIdPrefix,
      'portal-commit'
    ),
    rootIdPrefix: getIdPrefix(options && options.rootIdPrefix, 'root'),
    requestIdPrefix: getIdPrefix(
      options && options.requestIdPrefix,
      'request'
    ),
    sideEffectIdPrefix: getIdPrefix(
      options && options.sideEffectIdPrefix,
      'side-effect'
    ),
    updateIdPrefix: getIdPrefix(options && options.updateIdPrefix, 'update'),
    nextNativeHandleSlot: 1,
    nextNativeRootId: 1,
    nextCreateRenderAdmissionSequence: 1,
    nextHydrateSequence: 1,
    nextInitialHostOutputSequence: 1,
    nextPortalBoundarySequence: 1,
    nextPortalCommitSequence: 1,
    nextRootSequence: 1,
    nextSideEffectSequence: 1,
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

function getPositiveInteger(value, fallback) {
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function getCreateRootSideEffectListenerOptions(options) {
  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'listenerOptions')
  ) {
    return options.listenerOptions;
  }
  return options;
}

function assertRootHandleCanRender(handleState) {
  if (handleState.lifecycleStatus === ROOT_LIFECYCLE_UNMOUNTED) {
    const error = new Error('Cannot update an unmounted root.');
    error.code = 'FAST_REACT_DOM_UNMOUNTED_ROOT';
    throw error;
  }
}

function assertRootIdentityMatchesRecord({handle, ownerState, record}) {
  if (
    handle.rootId !== record.rootId ||
    ownerState.rootId !== record.rootId ||
    handle.rootKind !== record.rootKind ||
    ownerState.rootKind !== record.rootKind ||
    handle.rootTag !== record.rootTag ||
    ownerState.rootTag !== record.rootTag
  ) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request identity does not match its root handle.'
    );
  }
}

function assertExecutionIsBlockedOnRequestRecord(record) {
  if (record.nativeExecution !== false) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim native execution.'
    );
  }
  if (record.reconcilerExecution === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim reconciler execution.'
    );
  }
  if (record.domMutation === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim DOM mutation.'
    );
  }
  if (record.markerWrites === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim marker writes.'
    );
  }
  if (record.listenerInstallation === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim listener installation.'
    );
  }
  if (record.hydration === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim hydration.'
    );
  }
  if (record.eventDispatch === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim event dispatch.'
    );
  }
  if (record.compatibilityClaimed === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim compatibility.'
    );
  }
}

function assertAllowedLifecycleBefore(record, allowedStatuses) {
  if (!allowedStatuses.includes(record.lifecycleStatusBefore)) {
    throwInvalidRootBridgeRequest(
      `Unexpected lifecycle state before ${record.operation} request: ${String(
        record.lifecycleStatusBefore
      )}.`
    );
  }
}

function assertRecordField(record, field, expectedValue) {
  if (!Object.is(record[field], expectedValue)) {
    throwInvalidRootBridgeRequest(
      `Invalid private root bridge request field ${field}.`
    );
  }
}

function assertCreateRenderAdmissionField(record, field, expectedValue) {
  if (!Object.is(record[field], expectedValue)) {
    throwInvalidCreateRenderAdmission(
      `Invalid private create/render admission field ${field}.`
    );
  }
}

function validatePortalRootBoundaryRequestRecord(record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (validation.operation !== 'render') {
    throwInvalidPortalRootBoundaryRecord(
      'Expected a private root.render request record for a portal root boundary.'
    );
  }

  const payload = rootRecordPayloads.get(record);
  const portal = payload && payload.element;
  assertAcceptedReactDomPortalObject(portal, validation.rootHandleState);

  return {
    ...validation,
    payload,
    portal
  };
}

function validatePortalCommitHandoffBoundaryRecord(record) {
  const payload = rootPortalBoundaryPayloads.get(record);
  if (payload === undefined) {
    throwInvalidPortalCommitHandoffRecord(
      'Expected a private React DOM portal root boundary record.'
    );
  }

  if (
    record.$$typeof !== privateRootPortalBoundaryRecordType ||
    record.kind !== 'FastReactDomPrivateRootPortalBoundaryRecord' ||
    record.operation !== 'portal-root-boundary' ||
    record.boundaryStatus !== ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED ||
    record.diagnosticStatus !== ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED ||
    record.acceptedPortalObjectShape !== true
  ) {
    throwInvalidPortalCommitHandoffRecord(
      'Expected an admitted private React DOM portal boundary record.'
    );
  }

  assertPortalBoundaryStillBlocked(record);

  const rootHandleState = getPrivateRootHandleState(payload.rootHandle);
  assertAcceptedReactDomPortalObject(payload.portal, rootHandleState);
  if (
    payload.portal.containerInfo !== payload.portalContainer ||
    payload.portalChildren !== payload.portal.children
  ) {
    throwInvalidPortalCommitHandoffRecord(
      'Private portal boundary payload does not match the portal object.'
    );
  }

  assertFakeDomPortalCommitTarget(payload.portalContainer);

  return {
    payload,
    rootHandleState
  };
}

function assertPortalBoundaryStillBlocked(record) {
  if (
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.portalChildReconciliation !== false ||
    record.portalMounting !== false ||
    record.domMutation !== false ||
    record.markerWrites !== false ||
    record.listenerInstallation !== false ||
    record.hydration !== false ||
    record.eventDispatch !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidPortalCommitHandoffRecord(
      'Private portal boundary records must remain blocked before a commit handoff.'
    );
  }
}

function assertAcceptedReactDomPortalObject(portal, rootHandleState) {
  if (portal === null || typeof portal !== 'object') {
    throwInvalidPortalRootBoundaryRecord(
      'Expected a React DOM portal object for the portal root boundary.'
    );
  }

  const objectKeys = Object.keys(portal);
  if (
    portal.$$typeof !== REACT_PORTAL_TYPE ||
    portal.implementation !== reactDomPortalImplementation ||
    (portal.key !== null && typeof portal.key !== 'string') ||
    objectKeys.length !== 5 ||
    objectKeys[0] !== '$$typeof' ||
    objectKeys[1] !== 'key' ||
    objectKeys[2] !== 'children' ||
    objectKeys[3] !== 'containerInfo' ||
    objectKeys[4] !== 'implementation'
  ) {
    throwInvalidPortalRootBoundaryRecord(
      'Expected an intact React DOM createPortal object shape.'
    );
  }

  assertValidContainer(
    portal.containerInfo,
    rootHandleState.bridgeState.validationOptions
  );
}

function assertFakeDomPortalCommitTarget(portalContainer) {
  if (
    typeof portalContainer.appendChild !== 'function' ||
    typeof portalContainer.removeChild !== 'function' ||
    !('textContent' in portalContainer)
  ) {
    throwInvalidPortalCommitHandoffRecord(
      'Expected a fake-DOM portal container that can model child replacement.'
    );
  }
}

function getPortalCommitPendingChildren(portal, options) {
  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'pendingChildren')
  ) {
    return options.pendingChildren;
  }

  return portal.children === undefined ? null : portal.children;
}

function describePortalContainerOwnership(
  rootHandle,
  rootHandleState,
  portalContainer
) {
  const rootContainer = rootHandleState.container;
  const rootContainerOwner = getContainerRoot(rootContainer);
  const portalContainerOwner = getContainerRoot(portalContainer);
  return freezeRecord({
    ownershipStatus: ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED,
    rootId: rootHandle.rootId,
    rootContainerInfo: rootHandleState.containerInfo,
    portalContainerInfo: freezeRecord(describeContainer(portalContainer)),
    rootContainerMarkedAsRoot: rootContainerOwner !== null,
    rootContainerOwnerMatchesHandle: rootContainerOwner === rootHandle.owner,
    portalContainerMarkedAsRoot: portalContainerOwner !== null,
    portalContainerOwnerMatchesRoot: portalContainerOwner === rootHandle.owner,
    portalContainerOwnedByAnotherRoot:
      portalContainerOwner !== null && portalContainerOwner !== rootHandle.owner,
    portalContainerAvailableForPortal:
      portalContainerOwner === null || portalContainerOwner === rootHandle.owner,
    sameContainerAsRoot: portalContainer === rootContainer,
    sameOwnerDocument:
      getOwnerDocument(portalContainer) === getOwnerDocument(rootContainer),
    containerOwnershipValidated: true
  });
}

function describePortalCommitListenerSideEffects(
  portalContainer,
  portalListenerGuard
) {
  const ownerDocument = getOwnerDocument(portalContainer);
  return freezeRecord({
    gateStatus: ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED,
    preparePortalMount: false,
    listenToAllSupportedEvents: false,
    listenerInstallation: false,
    portalListenerGuard,
    hasPortalListeningMarker: hasListeningMarker(portalContainer),
    ownerDocumentHasSelectionChangeMarker: hasListeningMarker(ownerDocument),
    compatibilityClaimed: false
  });
}

function throwInvalidRootBridgeRequest(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST';
  throw error;
}

function throwInvalidCreateRenderAdmission(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_CREATE_RENDER_ADMISSION';
  throw error;
}

function throwInvalidInitialHostOutputHandoff(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_INITIAL_HOST_OUTPUT_HANDOFF';
  throw error;
}

function throwForeignRootBridgeRequest() {
  const error = new Error(
    'Cannot use a private root bridge request with a different root bridge shell.'
  );
  error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
  throw error;
}

function throwInvalidPortalRootBoundaryRecord(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_PORTAL_ROOT_BOUNDARY_RECORD';
  throw error;
}

function throwInvalidPortalCommitHandoffRecord(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_PORTAL_COMMIT_HANDOFF_RECORD';
  throw error;
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

function freezeArray(array) {
  return Object.freeze(array.slice());
}

module.exports = {
  CLIENT_ROOT_KIND,
  CONCURRENT_ROOT_TAG,
  ROOT_BRIDGE_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
  ROOT_BRIDGE_EXECUTION_BLOCKED,
  ROOT_BRIDGE_CREATE_RENDER_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_CREATE_RENDER_ADMITTED,
  ROOT_BRIDGE_CREATE_RENDER_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_INITIAL_HOST_OUTPUT_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED,
  ROOT_BRIDGE_INITIAL_HOST_OUTPUT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED,
  ROOT_BRIDGE_MARK_LISTEN_APPLIED,
  ROOT_BRIDGE_MARK_LISTEN_REVERTED,
  ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED,
  ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED,
  ROOT_BRIDGE_PORTAL_BOUNDARY_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_COMMIT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED,
  ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED,
  ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED,
  ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED,
  ROOT_BRIDGE_REQUEST_ADMITTED,
  ROOT_LIFECYCLE_CREATED,
  ROOT_LIFECYCLE_RENDERED,
  ROOT_LIFECYCLE_UNMOUNTED,
  ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION,
  NATIVE_ROOT_BRIDGE_HANDLE_ROOT,
  NATIVE_ROOT_BRIDGE_HANDLE_VALUE,
  NATIVE_ROOT_BRIDGE_REQUEST_CREATE,
  NATIVE_ROOT_BRIDGE_REQUEST_RENDER,
  NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT,
  NATIVE_ROOT_BRIDGE_ROOT_HANDLE_ACTIVE,
  NATIVE_ROOT_BRIDGE_ROOT_HANDLE_RETIRED,
  NATIVE_ROOT_BRIDGE_SYNTHETIC_ENVIRONMENT_ID,
  admitPrivateCreateRenderPath,
  admitRootBridgeRequestRecord,
  applyPrivateCreateRootSideEffects,
  applyPrivateInitialRenderHostOutput,
  cleanupPrivateInitialRenderHostOutput,
  createClientRootRecord,
  createHydrateRootRecord,
  createNativeRootBridgeHandoffRecord,
  createPortalCommitHandoffRecord,
  createPortalRootBoundaryRecord,
  createPrivateRootBridgeShell,
  createPrivateRootHandle,
  createPrivateRootOwner,
  createRootRenderRecord,
  createRootUnmountRecord,
  createRootUpdateRecord,
  describeCreateRootMarkerGuard,
  describeRootListenerGuard,
  describeUnmountMarkerGuard,
  getNativeRootBridgeHandoffPayload,
  getPrivateRootCreateRenderAdmissionPayload,
  getPrivateRootInitialHostOutputHandoffPayload,
  getPrivateRootPortalBoundaryPayload,
  getPrivateRootPortalCommitHandoffPayload,
  getPrivateRootRecordPayload,
  getRootOwnerFromHandle,
  isNativeRootBridgeHandoffRecord,
  isPrivateRootCreateRenderAdmissionRecord,
  isPrivateRootInitialHostOutputHandoffRecord,
  isPrivateRootPortalCommitHandoffRecord,
  isPrivateRootPortalBoundaryRecord,
  isPrivateRootHandle,
  isPrivateRootOwner,
  privateRootAdmissionRecordType,
  privateRootCreateRenderAdmissionRecordType,
  privateRootCreateSideEffectCleanupRecordType,
  privateRootCreateSideEffectRecordType,
  privateRootInitialHostOutputCleanupRecordType,
  privateRootInitialHostOutputHandoffRecordType,
  privateRootNativeBridgeHandleType,
  privateRootNativeHandoffRecordType,
  privateRootPortalBoundaryRecordType,
  privateRootPortalCommitHandoffRecordType,
  privateRootCreateRecordType,
  privateRootHandleType,
  privateRootHydrateRecordType,
  privateRootOwnerType,
  privateRootUpdateRecordType,
  revertPrivateCreateRootSideEffects
};
