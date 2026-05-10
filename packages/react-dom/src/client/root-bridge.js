'use strict';

const {
  assertValidContainer,
  describeContainer,
  getOwnerDocument
} = require('./dom-container.js');
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
  REACT_PORTAL_TYPE,
  reactDomPortalImplementation
} = require('../shared/create-portal.js');
const {
  detachHostInstanceSubtree
} = require('./component-tree.js');
const {
  appendChild,
  appendChildToContainer,
  clearContainerForRootUnmount,
  createDomHostTextInstance,
  getClearContainerForRootUnmountRecordPayload
} = require('../dom-host/mutation.js');

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
const privateRootPortalBoundaryRecordType =
  'fast.react_dom.private_root_portal_boundary_record';
const privateRootPortalCommitHandoffRecordType =
  'fast.react_dom.private_root_portal_commit_handoff_record';
const privateRootUnmountHostOutputCleanupRecordType =
  'fast.react_dom.private_root_unmount_host_output_cleanup_record';
const privateRootPortalFakeDomMountRecordType =
  'fast.react_dom.private_root_portal_fake_dom_mount_record';

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
const ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED =
  'cleaned-private-root-unmount-host-output';
const ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED =
  'applied-private-root-portal-fake-dom-mount-diagnostic';
const ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED =
  'blocked-public-root-portal-mounting';
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
const ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'fake-dom-clear-container',
    accepted: true,
    reason: 'The private unmount cleanup cleared fake-DOM root children.'
  }),
  freezeRecord({
    id: 'component-tree-metadata-detach',
    accepted: true,
    reason:
      'The private unmount cleanup detached component-tree host metadata from removed fake-DOM subtrees.'
  }),
  freezeRecord({
    id: 'root-marker-listener-revert',
    accepted: true,
    reason:
      'The private unmount cleanup reused the root marker/listener side-effect reverter.'
  })
]);
const ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'public-root-unmount',
    blocked: true,
    reason: 'Public react-dom root unmount behavior remains unimplemented.'
  }),
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust unmount execution is admitted by this cleanup.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason: 'No reconciler deletion, ref, passive, or effect traversal runs.'
  }),
  freezeRecord({
    id: 'browser-dom-compatibility',
    blocked: true,
    reason: 'Only fake-DOM containers are admitted by this private cleanup.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction and dispatch are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM root unmount compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'portal-explicit-host-component-mount',
    accepted: true,
    reason:
      'A caller-provided HostComponent child was mounted into a fake-DOM portal container for diagnostics only.'
  }),
  freezeRecord({
    id: 'portal-explicit-host-text-mount',
    accepted: true,
    reason:
      'A caller-provided HostText child was mounted under the fake-DOM HostComponent diagnostic child.'
  })
]);
const ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'portal-public-container-mounting',
    blocked: true,
    reason: 'Public React DOM portal mounting remains blocked.'
  }),
  freezeRecord({
    id: 'portal-child-reconciliation',
    blocked: true,
    reason:
      'Portal child reconciliation is not admitted; only the explicit diagnostic child may be mounted.'
  }),
  freezeRecord({
    id: 'portal-container-replacement',
    blocked: true,
    reason:
      'Replacing portal container children is not admitted by this diagnostic.'
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
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason:
      'No reconciler portal traversal or generic commit execution is admitted.'
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
    reason: 'React DOM portal compatibility remains unclaimed.'
  })
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
const rootPortalBoundaryPayloads = new WeakMap();
const rootPortalCommitHandoffPayloads = new WeakMap();
const rootUnmountHostOutputCleanupPayloads = new WeakMap();
const rootUnmountHostOutputCleanupRecords = new WeakMap();
const rootPortalFakeDomMountPayloads = new WeakMap();

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
    },
    cleanupUnmountHostOutput(admissionRecord, unmountRecord) {
      return cleanupPrivateRootUnmountHostOutputWithBridge(
        bridgeState,
        admissionRecord,
        unmountRecord
      );
    },
    createPortalFakeDomMountDiagnostic(record, options) {
      return createPortalFakeDomMountDiagnosticRecordWithBridge(
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

function cleanupPrivateRootUnmountHostOutput(admissionRecord, unmountRecord) {
  return cleanupPrivateRootUnmountHostOutputWithBridge(
    null,
    admissionRecord,
    unmountRecord
  );
}

function createPortalFakeDomMountDiagnosticRecord(record, options) {
  return createPortalFakeDomMountDiagnosticRecordWithBridge(
    null,
    record,
    options
  );
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

function getPrivateRootUnmountHostOutputCleanupPayload(record) {
  return rootUnmountHostOutputCleanupPayloads.get(record) || null;
}

function isPrivateRootUnmountHostOutputCleanupRecord(value) {
  return rootUnmountHostOutputCleanupPayloads.has(value);
}

function getPrivateRootPortalFakeDomMountPayload(record) {
  return rootPortalFakeDomMountPayloads.get(record) || null;
}

function isPrivateRootPortalFakeDomMountRecord(value) {
  return rootPortalFakeDomMountPayloads.has(value);
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
    replayQueueDiagnostics: hydrationBoundaryRecord.replayQueueDiagnostics,
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
    'replayQueueDiagnostics',
    hydrationBoundaryRecord.replayQueueDiagnostics
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
    replayQueueDiagnostics: record.replayQueueDiagnostics || null,
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
    portalChildren: validation.payload.portalChildren,
    portalContainer,
    rootContainer: validation.rootHandleState.container,
    rootHandle: validation.payload.rootHandle,
    sourceRecord: validation.payload.sourceRecord
  });

  return handoff;
}

function cleanupPrivateRootUnmountHostOutputWithBridge(
  bridgeState,
  admissionRecord,
  unmountRecord
) {
  const cached = getCachedUnmountHostOutputCleanup(
    bridgeState,
    admissionRecord,
    unmountRecord
  );
  if (cached !== null) {
    return cached;
  }

  const validation = validateUnmountHostOutputCleanupRecords(
    admissionRecord,
    unmountRecord
  );
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const rootBridgeState = validation.bridgeState;
  const sequence = rootBridgeState.nextUnmountCleanupSequence++;
  const cleanupId = `${rootBridgeState.unmountCleanupIdPrefix}:${sequence}`;
  const clearContainerRecord = clearContainerForRootUnmount(
    validation.container
  );
  const clearContainerPayload =
    getClearContainerForRootUnmountRecordPayload(clearContainerRecord);
  const componentTreeDetachRecords =
    clearContainerPayload === null
      ? []
      : clearContainerPayload.removedChildren.map((child) =>
          detachHostInstanceSubtree(child, {includeRoot: true})
        );
  const detachedHostInstanceCount = componentTreeDetachRecords.reduce(
    (total, record) => total + record.detachedHostInstanceCount,
    0
  );
  const sideEffectCleanup = revertPrivateCreateRootSideEffectsWithBridge(
    rootBridgeState,
    validation.sideEffectRecord
  );

  const cleanupRecord = freezeRecord({
    $$typeof: privateRootUnmountHostOutputCleanupRecordType,
    kind: 'FastReactDomPrivateRootUnmountHostOutputCleanupRecord',
    operation: 'unmount-host-output-cleanup',
    cleanupId,
    cleanupSequence: sequence,
    cleanupStatus: ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED,
    sourceAdmissionId: admissionRecord.admissionId,
    sourceAdmissionSequence: admissionRecord.admissionSequence,
    sourceRenderRequestId: admissionRecord.renderRequestId,
    sourceRenderRequestSequence: admissionRecord.renderRequestSequence,
    sourceUnmountRequestId: unmountRecord.requestId,
    sourceUnmountRequestSequence: unmountRecord.requestSequence,
    sourceUnmountUpdateId: unmountRecord.updateId,
    sideEffectId: validation.sideEffectRecord.sideEffectId,
    sideEffectCleanupStatus: sideEffectCleanup.sideEffectStatus,
    rootId: unmountRecord.rootId,
    rootKind: unmountRecord.rootKind,
    rootTag: unmountRecord.rootTag,
    lifecyclePrerequisites: freezeRecord({
      accepted: true,
      lifecycleStatusBefore: unmountRecord.lifecycleStatusBefore,
      lifecycleStatusAfter: unmountRecord.lifecycleStatusAfter,
      lifecycleTransition: `${unmountRecord.lifecycleStatusBefore}->${unmountRecord.lifecycleStatusAfter}`,
      operation: 'unmount',
      rootKind: unmountRecord.rootKind,
      rootTag: unmountRecord.rootTag
    }),
    fakeDomCleanup: freezeRecord({
      clearContainerStatus: clearContainerRecord.status,
      componentTreeDetachStatus: 'detached-host-instance-subtree',
      removedRootChildCount: clearContainerRecord.removedChildCount,
      detachedHostInstanceCount,
      detachRecordCount: componentTreeDetachRecords.length
    }),
    clearContainerRecord,
    componentTreeDetachRecords: freezeArray(componentTreeDetachRecords),
    sideEffectCleanup,
    markerCleanup: sideEffectCleanup.markerCleanup,
    listenerCleanup: sideEffectCleanup.listenerCleanup,
    acceptedCapabilities: ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_ACCEPTED_CAPABILITIES,
    blockedCapabilities: ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_BLOCKED_CAPABILITIES,
    fakeDomMutation: true,
    rootContainerChildrenCleared: true,
    componentTreeMetadataDetached: true,
    rootMarkerReverted: true,
    rootListenersReverted: true,
    publicRootUnmounted: false,
    publicRootBehaviorChanged: false,
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

  rootUnmountHostOutputCleanupRecords.set(unmountRecord, cleanupRecord);
  rootUnmountHostOutputCleanupPayloads.set(
    cleanupRecord,
    freezeRecord({
      admissionRecord,
      clearContainerPayload,
      clearContainerRecord,
      componentTreeDetachRecords,
      container: validation.container,
      sideEffectCleanup,
      sideEffectRecord: validation.sideEffectRecord,
      unmountRecord
    })
  );

  return cleanupRecord;
}

function createPortalFakeDomMountDiagnosticRecordWithBridge(
  bridgeState,
  record,
  options
) {
  const validation = validatePortalFakeDomMountHandoffRecord(record);
  if (
    bridgeState !== null &&
    validation.rootHandleState.bridgeState !== bridgeState
  ) {
    const error = new Error(
      'Cannot use a private root bridge portal fake-DOM mount diagnostic ' +
        'with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextPortalMountSequence++;
  const mountDiagnosticId =
    `${rootBridgeState.portalMountIdPrefix}:${sequence}`;
  const portal = validation.payload.portal;
  const portalContainer = validation.payload.portalContainer;
  const explicitChild = getExplicitPortalFakeDomMountChild(
    validation.payload,
    options
  );
  const childDescriptor =
    normalizePortalFakeDomHostChildDescriptor(explicitChild);
  const childCountBefore = getFakeDomChildCount(portalContainer);
  const hostComponentNode = createPortalFakeDomHostComponentNode(
    portalContainer,
    childDescriptor
  );
  const hostTextNode = createDomHostTextInstance(
    childDescriptor.hostText,
    hostComponentNode
  );

  appendChild(hostComponentNode, hostTextNode);
  appendChildToContainer(portalContainer, hostComponentNode);

  const childCountAfter = getFakeDomChildCount(portalContainer);
  const hostComponentChildCountAfter =
    getFakeDomChildCount(hostComponentNode);
  const listenerSideEffects = describePortalCommitListenerSideEffects(
    portalContainer,
    record.listenerSideEffects.portalListenerGuard
  );

  const mountRecord = freezeRecord({
    $$typeof: privateRootPortalFakeDomMountRecordType,
    kind: 'FastReactDomPrivateRootPortalFakeDomMountDiagnosticRecord',
    operation: 'portal-fake-dom-mount-diagnostic',
    mountDiagnosticId,
    mountDiagnosticSequence: sequence,
    mountStatus: ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED,
    publicMountStatus: ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED,
    sourceCommitHandoffId: record.commitHandoffId,
    sourceCommitHandoffSequence: record.commitHandoffSequence,
    sourceCommitHandoffStatus: record.handoffStatus,
    sourceCommitStatus: record.commitStatus,
    sourceBoundaryId: record.sourceBoundaryId,
    sourceBoundarySequence: record.sourceBoundarySequence,
    sourceRequestId: record.sourceRequestId,
    sourceRequestSequence: record.sourceRequestSequence,
    sourceRequestType: record.sourceRequestType,
    sourceUpdateId: record.sourceUpdateId,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    portalKey: portal.key,
    hostFiberPath: freezeArray([
      'HostRoot',
      'HostPortal',
      'HostComponent',
      'HostText'
    ]),
    explicitChildSource: 'portal.children',
    hostComponentType: childDescriptor.hostComponentType,
    hostText: childDescriptor.hostText,
    hostComponentInfo: freezeRecord(describeContainer(hostComponentNode)),
    hostTextInfo: freezeRecord(describeContainer(hostTextNode)),
    portalContainerInfo: record.fakeDomCommitTarget.portalContainerInfo,
    portalContainerChildCountBefore: childCountBefore,
    portalContainerChildCountAfter: childCountAfter,
    hostComponentChildCountAfter,
    portalContainerOwnership: describePortalContainerOwnership(
      validation.payload.rootHandle,
      validation.rootHandleState,
      portalContainer
    ),
    listenerSideEffects,
    acceptedCapabilities:
      ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_ACCEPTED_CAPABILITIES,
    blockedCapabilities: ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_BLOCKED_CAPABILITIES,
    fakeDomCommitHandoff: true,
    fakeDomCommitApplied: true,
    fakeDomPortalMountDiagnostic: true,
    explicitPortalHostChildMounted: true,
    portalContainerChildrenReplaced: false,
    portalChildReconciliation: false,
    portalMounting: false,
    publicPortalMounting: false,
    preparePortalMount: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: true,
    publicDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    resourceSideEffects: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootPortalFakeDomMountPayloads.set(mountRecord, {
    commitHandoffRecord: record,
    explicitChild,
    hostComponentNode,
    hostTextNode,
    portal,
    portalContainer,
    rootContainer: validation.payload.rootContainer,
    rootHandle: validation.payload.rootHandle,
    sourceRecord: validation.payload.sourceRecord
  });

  return mountRecord;
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
    portalMountIdPrefix: getIdPrefix(
      options && options.portalMountIdPrefix,
      'portal-mount'
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
    unmountCleanupIdPrefix: getIdPrefix(
      options && options.unmountCleanupIdPrefix,
      'unmount-cleanup'
    ),
    updateIdPrefix: getIdPrefix(options && options.updateIdPrefix, 'update'),
    nextNativeHandleSlot: 1,
    nextNativeRootId: 1,
    nextCreateRenderAdmissionSequence: 1,
    nextHydrateSequence: 1,
    nextPortalBoundarySequence: 1,
    nextPortalCommitSequence: 1,
    nextPortalMountSequence: 1,
    nextRootSequence: 1,
    nextSideEffectSequence: 1,
    nextUnmountCleanupSequence: 1,
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

function getCachedUnmountHostOutputCleanup(
  bridgeState,
  admissionRecord,
  unmountRecord
) {
  if (!isWeakMapKey(unmountRecord)) {
    return null;
  }

  const existing = rootUnmountHostOutputCleanupRecords.get(unmountRecord);
  if (existing === undefined) {
    return null;
  }

  const payload = rootUnmountHostOutputCleanupPayloads.get(existing);
  if (payload === undefined || payload.admissionRecord !== admissionRecord) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup records must match their source admission.'
    );
  }
  if (bridgeState !== null && payload.unmountRecord !== unmountRecord) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup records must match their source unmount request.'
    );
  }
  if (bridgeState !== null) {
    const validation = validateRootBridgeRequestRecord(unmountRecord);
    if (validation.bridgeState !== bridgeState) {
      throwForeignRootBridgeRequest();
    }
  }

  return existing;
}

function validateUnmountHostOutputCleanupRecords(
  admissionRecord,
  unmountRecord
) {
  const admissionPayload =
    rootCreateRenderAdmissionPayloads.get(admissionRecord);
  if (admissionPayload === undefined) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Expected a private create/render admission record for unmount host-output cleanup.'
    );
  }

  validateCreateRenderAdmissionStillIntact(
    admissionRecord,
    admissionPayload
  );

  const unmountValidation = validateRootBridgeRequestRecord(unmountRecord);
  if (unmountValidation.operation !== 'unmount') {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Expected a private root.unmount request record for host-output cleanup.'
    );
  }
  if (unmountRecord.noOp) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Cannot run host-output cleanup from a no-op private root.unmount request.'
    );
  }
  if (unmountRecord.lifecycleStatusBefore !== ROOT_LIFECYCLE_RENDERED) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup requires a previously rendered root.'
    );
  }

  const createValidation = validateRootBridgeRequestRecord(
    admissionPayload.createRecord
  );
  const sideEffectValidation = validateCreateRenderSideEffectRecord(
    admissionPayload.sideEffectRecord,
    admissionPayload.createRecord,
    createValidation
  );
  const unmountPayload = rootRecordPayloads.get(unmountRecord);
  if (unmountPayload.rootHandle !== admissionPayload.createRecord.handle) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup requires an unmount request for the admitted root handle.'
    );
  }
  if (createValidation.bridgeState !== unmountValidation.bridgeState) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup records must belong to the same root bridge shell.'
    );
  }
  if (sideEffectValidation.bridgeState !== unmountValidation.bridgeState) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup side effects must belong to the same root bridge shell.'
    );
  }
  if (
    admissionPayload.renderRecord.rootId !== unmountRecord.rootId ||
    admissionPayload.renderRecord.rootKind !== unmountRecord.rootKind ||
    admissionPayload.renderRecord.rootTag !== unmountRecord.rootTag
  ) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup root identity must match the admitted render.'
    );
  }
  if (
    admissionPayload.renderRecord.requestSequence >=
    unmountRecord.requestSequence
  ) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup requires root.unmount after the admitted render.'
    );
  }

  return {
    bridgeState: unmountValidation.bridgeState,
    container: sideEffectValidation.container,
    sideEffectRecord: admissionPayload.sideEffectRecord
  };
}

function validateCreateRenderAdmissionStillIntact(
  admissionRecord,
  admissionPayload
) {
  if (
    admissionRecord.$$typeof !== privateRootCreateRenderAdmissionRecordType ||
    admissionRecord.kind !==
      'FastReactDomPrivateRootCreateRenderAdmissionRecord' ||
    admissionRecord.operation !== 'create-render' ||
    admissionRecord.admissionStatus !== ROOT_BRIDGE_CREATE_RENDER_ADMITTED ||
    admissionRecord.executionStatus !== ROOT_BRIDGE_EXECUTION_BLOCKED ||
    admissionRecord.compatibilityStatus !== ROOT_BRIDGE_COMPATIBILITY_BLOCKED ||
    admissionRecord.nativeExecution !== false ||
    admissionRecord.reconcilerExecution !== false ||
    admissionRecord.domMutation !== false ||
    admissionRecord.hydration !== false ||
    admissionRecord.eventDispatch !== false ||
    admissionRecord.compatibilityClaimed !== false
  ) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Expected an intact private create/render admission record.'
    );
  }

  if (
    admissionRecord.createAdmission?.operation !== 'create' ||
    admissionRecord.renderAdmission?.operation !== 'render' ||
    admissionRecord.markerRecord !== admissionPayload.sideEffectRecord.markerRecord ||
    admissionRecord.listenerRegistration !==
      admissionPayload.sideEffectRecord.listenerRegistration
  ) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup admission payload does not match the admission record.'
    );
  }
}

function validatePortalFakeDomMountHandoffRecord(record) {
  const payload = rootPortalCommitHandoffPayloads.get(record);
  if (payload === undefined) {
    throwInvalidPortalFakeDomMountRecord(
      'Expected a private React DOM portal commit handoff record.'
    );
  }

  if (
    record.$$typeof !== privateRootPortalCommitHandoffRecordType ||
    record.kind !== 'FastReactDomPrivateRootPortalFakeDomCommitHandoffRecord' ||
    record.operation !== 'portal-fake-dom-commit-handoff' ||
    record.handoffStatus !== ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED ||
    record.commitStatus !== ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED ||
    record.fakeDomCommitHandoff !== true ||
    record.fakeDomCommitApplied !== false ||
    record.portalContainerChildrenReplaced !== false ||
    record.portalChildReconciliation !== false ||
    record.portalMounting !== false ||
    record.preparePortalMount !== false ||
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.domMutation !== false ||
    record.listenerInstallation !== false ||
    record.resourceSideEffects !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidPortalFakeDomMountRecord(
      'Expected a blocked private React DOM portal commit handoff record.'
    );
  }

  const rootHandleState = getPrivateRootHandleState(payload.rootHandle);
  assertAcceptedReactDomPortalObject(payload.portal, rootHandleState);
  if (
    payload.portal.containerInfo !== payload.portalContainer ||
    payload.portalChildren !== payload.portal.children
  ) {
    throwInvalidPortalFakeDomMountRecord(
      'Private portal commit handoff payload does not match the portal object.'
    );
  }

  assertFakeDomPortalMountTarget(payload.portalContainer);

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

function assertFakeDomPortalMountTarget(portalContainer) {
  assertFakeDomPortalCommitTarget(portalContainer);

  const ownerDocument = getOwnerDocument(portalContainer);
  if (
    ownerDocument === null ||
    typeof ownerDocument.createElement !== 'function' ||
    typeof ownerDocument.createTextNode !== 'function'
  ) {
    throwInvalidPortalFakeDomMountRecord(
      'Expected a fake-DOM portal container with element and text factories.'
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

function getExplicitPortalFakeDomMountChild(payload, options) {
  if (
    options == null ||
    typeof options !== 'object' ||
    !Object.prototype.hasOwnProperty.call(options, 'explicitChild')
  ) {
    throwInvalidPortalFakeDomMountRecord(
      'Expected an explicit portal HostComponent child for fake-DOM mounting.'
    );
  }

  if (options.explicitChild !== payload.portalChildren) {
    throwInvalidPortalFakeDomMountRecord(
      'The explicit fake-DOM mount child must be the portal children value.'
    );
  }

  return options.explicitChild;
}

function normalizePortalFakeDomHostChildDescriptor(explicitChild) {
  if (explicitChild === null || typeof explicitChild !== 'object') {
    throwInvalidPortalFakeDomMountRecord(
      'Expected an explicit portal HostComponent child object.'
    );
  }

  const hostComponentType = explicitChild.type;
  const props = explicitChild.props;
  const hostText = props && props.children;

  if (
    typeof hostComponentType !== 'string' ||
    hostComponentType.length === 0 ||
    props === null ||
    typeof props !== 'object' ||
    !(
      typeof hostText === 'string' ||
      typeof hostText === 'number' ||
      typeof hostText === 'bigint'
    )
  ) {
    throwInvalidPortalFakeDomMountRecord(
      'Expected a HostComponent child with a primitive HostText children prop.'
    );
  }

  return freezeRecord({
    hostComponentType,
    hostText: String(hostText)
  });
}

function createPortalFakeDomHostComponentNode(
  portalContainer,
  childDescriptor
) {
  const ownerDocument = getOwnerDocument(portalContainer);
  const createElement = ownerDocument && ownerDocument.createElement;
  if (typeof createElement !== 'function') {
    throwInvalidPortalFakeDomMountRecord(
      'Expected a fake-DOM document createElement factory.'
    );
  }

  const hostComponentNode = createElement.call(
    ownerDocument,
    childDescriptor.hostComponentType
  );
  if (hostComponentNode === null || typeof hostComponentNode !== 'object') {
    throwInvalidPortalFakeDomMountRecord(
      'Expected fake-DOM createElement to return a HostComponent node.'
    );
  }

  return hostComponentNode;
}

function getFakeDomChildCount(node) {
  return Array.isArray(node.childNodes) ? node.childNodes.length : null;
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

function throwInvalidUnmountHostOutputCleanupRecord(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD';
  throw error;
}

function throwInvalidPortalFakeDomMountRecord(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_PORTAL_FAKE_DOM_MOUNT_RECORD';
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

function isWeakMapKey(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
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
  ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED,
  ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED,
  ROOT_BRIDGE_REQUEST_ADMITTED,
  ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED,
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
  cleanupPrivateRootUnmountHostOutput,
  createClientRootRecord,
  createHydrateRootRecord,
  createNativeRootBridgeHandoffRecord,
  createPortalCommitHandoffRecord,
  createPortalFakeDomMountDiagnosticRecord,
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
  getPrivateRootPortalBoundaryPayload,
  getPrivateRootPortalCommitHandoffPayload,
  getPrivateRootPortalFakeDomMountPayload,
  getPrivateRootRecordPayload,
  getPrivateRootUnmountHostOutputCleanupPayload,
  getRootOwnerFromHandle,
  isNativeRootBridgeHandoffRecord,
  isPrivateRootCreateRenderAdmissionRecord,
  isPrivateRootPortalCommitHandoffRecord,
  isPrivateRootPortalFakeDomMountRecord,
  isPrivateRootPortalBoundaryRecord,
  isPrivateRootUnmountHostOutputCleanupRecord,
  isPrivateRootHandle,
  isPrivateRootOwner,
  privateRootAdmissionRecordType,
  privateRootCreateRenderAdmissionRecordType,
  privateRootCreateSideEffectCleanupRecordType,
  privateRootCreateSideEffectRecordType,
  privateRootNativeBridgeHandleType,
  privateRootNativeHandoffRecordType,
  privateRootPortalBoundaryRecordType,
  privateRootPortalCommitHandoffRecordType,
  privateRootUnmountHostOutputCleanupRecordType,
  privateRootPortalFakeDomMountRecordType,
  privateRootCreateRecordType,
  privateRootHandleType,
  privateRootHydrateRecordType,
  privateRootOwnerType,
  privateRootUpdateRecordType,
  revertPrivateCreateRootSideEffects
};
