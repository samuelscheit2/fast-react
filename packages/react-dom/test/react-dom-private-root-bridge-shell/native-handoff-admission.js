'use strict';

const {
  assert,
  test,
  rootBridge,
  rootMarkers,
  listenerRegistry,
  rootListeners,
  assertNativeHandoff,
  assertNativeRequestRecord,
  assertHiddenNativePayload,
  assertBridgeDidNotTouchContainer,
  createDocument,
  createElement
} = require('./context.js');

test('private root bridge native handoff mirrors create/render/update/unmount records only', () => {
  const document = createDocument('native-handoff');
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'hello'
    },
    type: 'span'
  };
  const updatedElement = {
    props: {
      children: 'hello again'
    },
    type: 'span'
  };
  const callback = function afterRootUpdate() {};
  const bridge = rootBridge.createPrivateRootBridgeShell({
    nativeEnvironmentId: 269,
    nativeHandoffIdPrefix: 'handoff'
  });

  const create = bridge.createClientRoot(container, {
    identifierPrefix: 'native-bridge-'
  });
  const render = bridge.renderContainer(create.handle, element, callback);
  const update = bridge.renderContainer(
    create.handle,
    updatedElement,
    callback
  );
  const unmount = bridge.unmountContainer(create.handle);
  const secondUnmount = bridge.unmountContainer(create.handle);

  const createHandoff = bridge.createNativeRequestHandoff(create);
  const renderHandoff = bridge.createNativeRequestHandoff(render);
  const updateHandoff = bridge.createNativeRequestHandoff(update);
  const unmountHandoff = bridge.createNativeRequestHandoff(unmount);
  const secondUnmountHandoff = bridge.createNativeRequestHandoff(secondUnmount);

  assert.equal(
    rootBridge.createNativeRootBridgeHandoffRecord(render),
    renderHandoff
  );
  assert.equal(
    rootBridge.createNativeRootBridgeHandoffRecord(update),
    updateHandoff
  );
  assert.equal(bridge.createNativeRequestHandoff(create), createHandoff);

  assertNativeHandoff(createHandoff, {
    handoffId: 'handoff:1',
    handoffSequence: 1,
    operation: 'create',
    sourceLifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_CREATED,
    sourceLifecycleStatusBefore: null,
    sourceRequestId: 'request:1',
    sourceRequestSequence: 1,
    sourceRequestType: 'createRoot'
  });
  assertNativeRequestRecord(createHandoff.nativeRequestRecord, {
    kind: rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_CREATE,
    requestId: 1,
    rootHandleState: rootBridge.NATIVE_ROOT_BRIDGE_ROOT_HANDLE_ACTIVE,
    rootSlot: 1,
    rootValue: 1,
    valueSlot: 2
  });

  assertNativeHandoff(renderHandoff, {
    handoffId: 'handoff:2',
    handoffSequence: 2,
    operation: 'render',
    sourceLifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_RENDERED,
    sourceLifecycleStatusBefore: rootBridge.ROOT_LIFECYCLE_CREATED,
    sourceRequestId: 'request:2',
    sourceRequestSequence: 2,
    sourceRequestType: 'root.render'
  });
  assertNativeRequestRecord(renderHandoff.nativeRequestRecord, {
    kind: rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_RENDER,
    requestId: 2,
    rootHandleState: rootBridge.NATIVE_ROOT_BRIDGE_ROOT_HANDLE_ACTIVE,
    rootSlot: 1,
    rootValue: 1,
    valueSlot: 3
  });
  assert.equal(
    renderHandoff.nativeRequestRecord.rootHandle,
    createHandoff.nativeRequestRecord.rootHandle
  );

  assertNativeHandoff(updateHandoff, {
    handoffId: 'handoff:3',
    handoffSequence: 3,
    operation: 'render',
    sourceLifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_RENDERED,
    sourceLifecycleStatusBefore: rootBridge.ROOT_LIFECYCLE_RENDERED,
    sourceRequestId: 'request:3',
    sourceRequestSequence: 3,
    sourceRequestType: 'root.render'
  });
  assertNativeRequestRecord(updateHandoff.nativeRequestRecord, {
    kind: rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_RENDER,
    requestId: 3,
    rootHandleState: rootBridge.NATIVE_ROOT_BRIDGE_ROOT_HANDLE_ACTIVE,
    rootSlot: 1,
    rootValue: 1,
    valueSlot: 4
  });
  assert.equal(
    updateHandoff.nativeRequestRecord.rootHandle,
    createHandoff.nativeRequestRecord.rootHandle
  );

  assertNativeHandoff(unmountHandoff, {
    handoffId: 'handoff:4',
    handoffSequence: 4,
    operation: 'unmount',
    sourceLifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_UNMOUNTED,
    sourceLifecycleStatusBefore: rootBridge.ROOT_LIFECYCLE_RENDERED,
    sourceRequestId: 'request:4',
    sourceRequestSequence: 4,
    sourceRequestType: 'root.unmount'
  });
  assertNativeRequestRecord(unmountHandoff.nativeRequestRecord, {
    kind: rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT,
    requestId: 4,
    rootHandleState: rootBridge.NATIVE_ROOT_BRIDGE_ROOT_HANDLE_RETIRED,
    rootSlot: 1,
    rootValue: 1,
    valueSlot: null
  });
  assert.equal(
    unmountHandoff.nativeRequestRecord.rootHandle,
    createHandoff.nativeRequestRecord.rootHandle
  );

  assertNativeHandoff(secondUnmountHandoff, {
    handoffId: 'handoff:5',
    handoffSequence: 5,
    operation: 'unmount',
    sourceLifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_UNMOUNTED,
    sourceLifecycleStatusBefore: rootBridge.ROOT_LIFECYCLE_UNMOUNTED,
    sourceRequestId: 'request:5',
    sourceRequestSequence: 5,
    sourceRequestType: 'root.unmount'
  });
  assertNativeRequestRecord(secondUnmountHandoff.nativeRequestRecord, {
    kind: rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT,
    requestId: 5,
    rootHandleState: rootBridge.NATIVE_ROOT_BRIDGE_ROOT_HANDLE_RETIRED,
    rootSlot: 1,
    rootValue: 1,
    valueSlot: null
  });

  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(createHandoff).sourceRecord,
    create
  );
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(createHandoff).value,
    container
  );
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(renderHandoff).sourceRecord,
    render
  );
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(renderHandoff).value,
    element
  );
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(updateHandoff).sourceRecord,
    update
  );
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(updateHandoff).value,
    updatedElement
  );
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(unmountHandoff).value,
    null
  );
  assert.equal(rootBridge.isNativeRootBridgeHandoffRecord(createHandoff), true);
  assert.equal(rootBridge.isNativeRootBridgeHandoffRecord({}), false);
  assert.equal(rootBridge.getNativeRootBridgeHandoffPayload({}), null);

  assertHiddenNativePayload(createHandoff);
  assertHiddenNativePayload(renderHandoff);
  assertHiddenNativePayload(updateHandoff);
  assertHiddenNativePayload(unmountHandoff);
  assertBridgeDidNotTouchContainer(container, document);
});

test('private native handoff stays fail-closed for invalid or foreign records', () => {
  const document = createDocument('invalid-native-handoff');
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(createElement('DIV', document));

  assert.throws(() => rootBridge.createNativeRootBridgeHandoffRecord({}), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST'
  });
  assert.throws(() => otherBridge.createNativeRequestHandoff(create), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
});

test('private createRoot mark/listen gate applies and reverts explicit side effects', () => {
  const document = createDocument('private-mark-listen');
  const container = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    sideEffectIdPrefix: 'mark-listen'
  });
  const create = bridge.createClientRoot(container);

  assertBridgeDidNotTouchContainer(container, document);

  const sideEffects = bridge.applyCreateRootSideEffects(create);
  assert.equal(bridge.applyCreateRootSideEffects(create), sideEffects);
  assert.equal(Object.isFrozen(sideEffects), true);
  assert.equal(
    sideEffects.$$typeof,
    rootBridge.privateRootCreateSideEffectRecordType
  );
  assert.equal(
    sideEffects.sideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED
  );
  assert.equal(sideEffects.sideEffectId, 'mark-listen:1');
  assert.equal(sideEffects.requestId, create.requestId);
  assert.equal(sideEffects.rootId, create.rootId);
  assert.equal(sideEffects.nativeExecution, false);
  assert.equal(sideEffects.reconcilerExecution, false);
  assert.equal(sideEffects.domMutation, false);
  assert.equal(sideEffects.markerWrites, true);
  assert.equal(sideEffects.listenerInstallation, true);
  assert.equal(sideEffects.hydration, false);
  assert.equal(sideEffects.eventDispatch, false);
  assert.equal(sideEffects.compatibilityClaimed, false);
  assert.equal(sideEffects.reversible, true);

  assert.equal(rootMarkers.getContainerRoot(container), create.owner);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), true);
  assert.equal(
    rootMarkers.inspectContainerRootMarker(container).propertyCount,
    1
  );
  assert.equal(listenerRegistry.hasListeningMarker(container), true);
  assert.equal(listenerRegistry.hasListeningMarker(document), true);
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);
  assert.equal(listenerRegistry.getEventListenerSet(container).size, 138);
  assert.equal(listenerRegistry.getEventListenerSet(document).size, 1);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  assert.equal(
    sideEffects.markerRecord.$$typeof,
    rootMarkers.privateRootMarkerMutationRecordType
  );
  assert.equal(
    sideEffects.markerRecord.markerStatus,
    rootMarkers.ROOT_MARKER_APPLIED
  );
  assert.equal(
    sideEffects.listenerRegistration.$$typeof,
    rootListeners.privateRootListenerRegistrationRecordType
  );
  assert.equal(
    sideEffects.listenerRegistration.registrationStatus,
    rootListeners.ROOT_LISTENERS_REGISTERED
  );
  assert.equal(sideEffects.listenerRegistration.registrationCount, 139);
  assert.equal(sideEffects.listenerRegistration.rootRegistrationCount, 138);
  assert.equal(
    sideEffects.listenerRegistration.ownerDocumentRegistrationCount,
    1
  );

  const serialized = JSON.stringify(sideEffects);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('__FAST_REACT_DOM_EVENT_TARGET__'), false);

  const cleanup = bridge.revertCreateRootSideEffects(sideEffects);
  assert.equal(bridge.revertCreateRootSideEffects(sideEffects), cleanup);
  assert.equal(Object.isFrozen(cleanup), true);
  assert.equal(
    cleanup.$$typeof,
    rootBridge.privateRootCreateSideEffectCleanupRecordType
  );
  assert.equal(
    cleanup.sideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assert.equal(cleanup.sideEffectId, sideEffects.sideEffectId);
  assert.equal(cleanup.nativeExecution, false);
  assert.equal(cleanup.reconcilerExecution, false);
  assert.equal(cleanup.domMutation, false);
  assert.equal(cleanup.markerWrites, false);
  assert.equal(cleanup.listenerInstallation, false);
  assert.equal(cleanup.compatibilityClaimed, false);
  assert.equal(
    cleanup.markerCleanup.$$typeof,
    rootMarkers.privateRootMarkerCleanupRecordType
  );
  assert.equal(
    cleanup.listenerCleanup.$$typeof,
    rootListeners.privateRootListenerCleanupRecordType
  );
  assert.equal(cleanup.listenerCleanup.listenerRemovalCount, 139);

  assertBridgeDidNotTouchContainer(container, document);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      container,
      listenerRegistry.internalEventHandlersKey
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      document,
      listenerRegistry.internalEventHandlersKey
    ),
    false
  );
});

test('private create/render admission combines mark/listen and render records without DOM mutation', () => {
  const document = createDocument('private-create-render-admission');
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'admitted child'
    },
    type: 'main'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: 'admit-create-render',
    sideEffectIdPrefix: 'admit-side-effect'
  });

  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(create, sideEffects, render);

  assert.equal(
    rootBridge.admitPrivateCreateRenderPath(create, sideEffects, render),
    admission
  );
  assert.equal(
    rootBridge.isPrivateRootCreateRenderAdmissionRecord(admission),
    true
  );
  assert.equal(Object.isFrozen(admission), true);
  assert.equal(
    admission.$$typeof,
    rootBridge.privateRootCreateRenderAdmissionRecordType
  );
  assert.equal(
    admission.kind,
    'FastReactDomPrivateRootCreateRenderAdmissionRecord'
  );
  assert.equal(admission.operation, 'create-render');
  assert.equal(
    admission.admissionStatus,
    rootBridge.ROOT_BRIDGE_CREATE_RENDER_ADMITTED
  );
  assert.equal(
    admission.executionStatus,
    rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED
  );
  assert.equal(
    admission.compatibilityStatus,
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED
  );
  assert.equal(admission.admissionId, 'admit-create-render:1');
  assert.equal(admission.rootId, create.rootId);
  assert.equal(admission.createRequestId, create.requestId);
  assert.equal(admission.renderRequestId, render.requestId);
  assert.equal(admission.renderUpdateId, render.updateId);
  assert.equal(admission.sideEffectId, sideEffects.sideEffectId);
  assert.equal(admission.createAdmission.operation, 'create');
  assert.equal(admission.renderAdmission.operation, 'render');
  assert.equal(admission.markerRecord, sideEffects.markerRecord);
  assert.equal(
    admission.listenerRegistration,
    sideEffects.listenerRegistration
  );
  assert.deepEqual(admission.createRootPrerequisites, {
    accepted: true,
    createRequestAccepted: true,
    markListenAccepted: true,
    markerStatus: rootMarkers.ROOT_MARKER_APPLIED,
    listenerRegistrationStatus: rootListeners.ROOT_LISTENERS_REGISTERED,
    rootMarkerMatchesOwner: true,
    rootListeningMarkerPresent: true,
    ownerDocumentListeningMarkerPresent: true,
    sideEffectActiveAtAdmission: true
  });
  assert.deepEqual(admission.lifecyclePrerequisites, {
    accepted: true,
    lifecycleStatusBefore: null,
    lifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_RENDERED,
    lifecycleTransition: 'none->created->rendered',
    operation: 'create-render',
    rootKind: rootBridge.CLIENT_ROOT_KIND,
    rootTag: rootBridge.CONCURRENT_ROOT_TAG
  });
  assert.deepEqual(
    admission.acceptedCapabilities.map((capability) => capability.id),
    ['create-root-marker-write', 'root-listener-installation']
  );
  assert.deepEqual(
    admission.blockedCapabilities.map((capability) => capability.id),
    [
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(admission.publicRootCreated, false);
  assert.equal(admission.publicRootObjectExposed, false);
  assert.equal(admission.nativeExecution, false);
  assert.equal(admission.reconcilerExecution, false);
  assert.equal(admission.rootScheduled, false);
  assert.equal(admission.domMutation, false);
  assert.equal(admission.markerWrites, true);
  assert.equal(admission.listenerInstallation, true);
  assert.equal(admission.hydration, false);
  assert.equal(admission.eventDispatch, false);
  assert.equal(admission.compatibilityClaimed, false);

  const payload =
    rootBridge.getPrivateRootCreateRenderAdmissionPayload(admission);
  assert.equal(payload.createRecord, create);
  assert.equal(payload.sideEffectRecord, sideEffects);
  assert.equal(payload.renderRecord, render);
  assert.equal(payload.container, container);
  assert.equal(payload.element, element);
  assert.equal(rootBridge.getPrivateRootCreateRenderAdmissionPayload({}), null);
  assert.equal(rootBridge.isPrivateRootCreateRenderAdmissionRecord({}), false);

  assert.equal(rootMarkers.getContainerRoot(container), create.owner);
  assert.equal(listenerRegistry.hasListeningMarker(container), true);
  assert.equal(listenerRegistry.hasListeningMarker(document), true);
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const serialized = JSON.stringify(admission);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('admitted child'), false);
  assert.equal(serialized.includes('__FAST_REACT_DOM_EVENT_TARGET__'), false);

  const cleanup = bridge.revertCreateRootSideEffects(sideEffects);
  assert.equal(
    cleanup.sideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assertBridgeDidNotTouchContainer(container, document);
});

test('private createRoot mark/listen gate validates records before side effects', () => {
  const document = createDocument('private-mark-listen-validation');
  const container = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const render = bridge.renderContainer(create.handle, {
    props: {},
    type: 'span'
  });

  assert.throws(() => bridge.applyCreateRootSideEffects(render), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST'
  });
  assert.throws(() => otherBridge.applyCreateRootSideEffects(create), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assertBridgeDidNotTouchContainer(container, document);

  const validDocument = createDocument('private-mark-listen-valid-revert');
  const validContainer = createElement('DIV', validDocument);
  const validCreate = bridge.createClientRoot(validContainer);
  const sideEffects = bridge.applyCreateRootSideEffects(validCreate);
  assert.throws(() => otherBridge.revertCreateRootSideEffects(sideEffects), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  bridge.revertCreateRootSideEffects(sideEffects);
  assertBridgeDidNotTouchContainer(validContainer, validDocument);

  const invalidDocument = createDocument('private-mark-listen-no-remove');
  const invalidContainer = createElement('DIV', invalidDocument);
  delete invalidContainer.removeEventListener;
  const invalidCreate = bridge.createClientRoot(invalidContainer);
  assert.throws(() => bridge.applyCreateRootSideEffects(invalidCreate), {
    code: 'FAST_REACT_DOM_LISTENER_REVERT_UNSUPPORTED'
  });
  assertBridgeDidNotTouchContainer(invalidContainer, invalidDocument);

  const occupiedDocument = createDocument('private-mark-listen-occupied');
  const occupiedContainer = createElement('DIV', occupiedDocument);
  const existingOwner = rootBridge.createPrivateRootOwner('occupied-root:1');
  rootMarkers.markContainerAsRoot(existingOwner, occupiedContainer);
  const occupiedCreate = bridge.createClientRoot(occupiedContainer);
  assert.throws(() => bridge.applyCreateRootSideEffects(occupiedCreate), {
    code: 'FAST_REACT_DOM_ROOT_MARKER_OCCUPIED'
  });
  assert.equal(rootMarkers.getContainerRoot(occupiedContainer), existingOwner);
  assert.equal(occupiedContainer.__registrations.length, 0);
  assert.equal(occupiedDocument.__registrations.length, 0);
});

test('private create/render admission validates bridge ownership and active mark/listen records', () => {
  const document = createDocument('private-create-render-validation');
  const container = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, {
    props: {},
    type: 'section'
  });

  assert.throws(
    () => otherBridge.admitCreateRenderPath(create, sideEffects, render),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );
  assert.throws(() => bridge.admitCreateRenderPath(create, render, render), {
    code: 'FAST_REACT_DOM_INVALID_CREATE_RENDER_ADMISSION'
  });

  const secondDocument = createDocument('private-create-render-other-root');
  const secondContainer = createElement('DIV', secondDocument);
  const secondCreate = bridge.createClientRoot(secondContainer);
  const secondRender = bridge.renderContainer(secondCreate.handle, {
    props: {},
    type: 'aside'
  });
  assert.throws(
    () => bridge.admitCreateRenderPath(create, sideEffects, secondRender),
    {
      code: 'FAST_REACT_DOM_INVALID_CREATE_RENDER_ADMISSION'
    }
  );

  bridge.revertCreateRootSideEffects(sideEffects);
  assert.throws(
    () => bridge.admitCreateRenderPath(create, sideEffects, render),
    {
      code: 'FAST_REACT_DOM_INVALID_CREATE_RENDER_ADMISSION'
    }
  );

  bridge.revertCreateRootSideEffects(
    bridge.applyCreateRootSideEffects(secondCreate)
  );
  assertBridgeDidNotTouchContainer(container, document);
  assertBridgeDidNotTouchContainer(secondContainer, secondDocument);
});
