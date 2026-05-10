'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const reactDom = require(path.join(packageRoot, 'index.js'));
const reactDomClient = require(path.join(packageRoot, 'client.js'));
const resourceFormGate = require(
  path.join(packageRoot, 'src/resource-form-gates.js')
);
const rootBridge = require(path.join(packageRoot, 'src/client/root-bridge.js'));
const componentTree = require(
  path.join(packageRoot, 'src/client/component-tree.js')
);
const domHost = require(path.join(packageRoot, 'src/dom-host/mutation.js'));
const rootMarkers = require(
  path.join(packageRoot, 'src/client/root-markers.js')
);
const listenerRegistry = require(
  path.join(packageRoot, 'src/events/listener-registry.js')
);
const rootListeners = require(
  path.join(packageRoot, 'src/events/root-listeners.js')
);
const {DOCUMENT_NODE, ELEMENT_NODE, TEXT_NODE} = require(
  path.join(packageRoot, 'src/client/dom-container.js')
);

test('private root bridge native handoff mirrors create/render/unmount records only', () => {
  const document = createDocument('native-handoff');
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'hello'
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
  const unmount = bridge.unmountContainer(create.handle);
  const secondUnmount = bridge.unmountContainer(create.handle);

  const createHandoff = bridge.createNativeRequestHandoff(create);
  const renderHandoff = bridge.createNativeRequestHandoff(render);
  const unmountHandoff = bridge.createNativeRequestHandoff(unmount);
  const secondUnmountHandoff = bridge.createNativeRequestHandoff(secondUnmount);

  assert.equal(
    rootBridge.createNativeRootBridgeHandoffRecord(render),
    renderHandoff
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

  assertNativeHandoff(unmountHandoff, {
    handoffId: 'handoff:3',
    handoffSequence: 3,
    operation: 'unmount',
    sourceLifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_UNMOUNTED,
    sourceLifecycleStatusBefore: rootBridge.ROOT_LIFECYCLE_RENDERED,
    sourceRequestId: 'request:3',
    sourceRequestSequence: 3,
    sourceRequestType: 'root.unmount'
  });
  assertNativeRequestRecord(unmountHandoff.nativeRequestRecord, {
    kind: rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT,
    requestId: 3,
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
    handoffId: 'handoff:4',
    handoffSequence: 4,
    operation: 'unmount',
    sourceLifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_UNMOUNTED,
    sourceLifecycleStatusBefore: rootBridge.ROOT_LIFECYCLE_UNMOUNTED,
    sourceRequestId: 'request:4',
    sourceRequestSequence: 4,
    sourceRequestType: 'root.unmount'
  });
  assertNativeRequestRecord(secondUnmountHandoff.nativeRequestRecord, {
    kind: rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT,
    requestId: 4,
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
    rootBridge.getNativeRootBridgeHandoffPayload(unmountHandoff).value,
    null
  );
  assert.equal(rootBridge.isNativeRootBridgeHandoffRecord(createHandoff), true);
  assert.equal(rootBridge.isNativeRootBridgeHandoffRecord({}), false);
  assert.equal(rootBridge.getNativeRootBridgeHandoffPayload({}), null);

  assertHiddenNativePayload(createHandoff);
  assertHiddenNativePayload(renderHandoff);
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

test('private root host-output update mutates props/text before publishing latest props', () => {
  const document = createHostOutputDocument('private-host-output-update');
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hostOutputUpdateIdPrefix: 'host-update',
    sideEffectIdPrefix: 'host-side-effect'
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputProps('initial');
  const nextProps = createHostOutputProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const update = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });

  mounted.host.attributeLog = [];
  mounted.text.writeLog = [];

  const handoff = bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: mounted.token,
    nextProps,
    tag: 'div',
    textUpdate: {
      newText: 'goodbye',
      oldText: 'hello',
      textInstance: mounted.text
    }
  });
  const hiddenHandoff =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(handoff);

  assert.equal(
    handoff.$$typeof,
    rootBridge.privateRootHostOutputUpdateHandoffRecordType
  );
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootHostOutputUpdateHandoffRecord'
  );
  assert.equal(handoff.handoffId, 'host-update:1');
  assert.equal(
    handoff.updateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(handoff.sourceUpdateId, update.updateId);
  assert.equal(
    handoff.sourceLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    handoff.sourceLifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(handoff.hostTag, 'div');
  assert.deepEqual(handoff.propertyMutation, {
    handoffKind: domHost.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF,
    latestPropsCommitRecordKind: domHost.LATEST_PROPS_COMMIT_RECORD,
    latestPropsCommitRecordStatus: 'safe-for-latest-props',
    mutationRecordCount: 4,
    payloadCount: 4,
    status: 'mutated'
  });
  assert.deepEqual(handoff.textMutation, {
    newTextLength: 7,
    oldTextLength: 5,
    status: 'mutated'
  });
  assert.equal(handoff.latestPropsPublished, true);
  assert.equal(
    handoff.latestPropsPublishOrder,
    'after-property-and-text-mutation'
  );
  assert.equal(handoff.fakeDomMutation, true);
  assert.equal(handoff.domMutation, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'fake-dom-property-update',
      'fake-dom-text-update',
      'latest-props-after-mutation'
    ]
  );
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'hydration',
      'events',
      'refs',
      'compatibility-claims'
    ]
  );
  assert.equal(
    rootBridge.isPrivateRootHostOutputUpdateHandoffRecord(handoff),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootHostOutputUpdateHandoffRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload({}),
    null
  );
  assert.equal(hiddenHandoff.sourceRecord, update);
  assert.equal(hiddenHandoff.rootHandle, create.handle);
  assert.equal(hiddenHandoff.hostInstanceNode, mounted.host);
  assert.equal(hiddenHandoff.hostInstanceToken, mounted.token);
  assert.equal(hiddenHandoff.textInstance, mounted.text);
  assert.equal(hiddenHandoff.previousProps, initialProps);
  assert.equal(hiddenHandoff.nextProps, nextProps);
  assert.equal(hiddenHandoff.latestPropsPublished, true);
  assert.equal(hiddenHandoff.textUpdate.oldText, 'hello');
  assert.equal(hiddenHandoff.textUpdate.newText, 'goodbye');

  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card updated'],
    ['data-phase', 'updated'],
    ['id', 'message'],
    ['title', 'updated title']
  ]);
  assert.deepEqual(mounted.host.attributeLog, [
    ['setAttribute', 'class', 'root-card updated'],
    ['setAttribute', 'title', 'updated title'],
    ['setAttribute', 'data-phase', 'updated']
  ]);
  assert.deepEqual(mounted.text.writeLog, [['nodeValue', 'goodbye']]);
  assert.equal(container.textContent, 'goodbye');
  assert.equal(componentTree.getLatestPropsFromNode(mounted.host), nextProps);
  assert.equal(bridge.applyHostOutputUpdate(update, {}), handoff);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('goodbye'), false);
  assert.equal(serialized.includes('updated title'), false);
  assert.equal(serialized.includes('__registrations'), false);

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root host-output update rolls back props when text mutation fails', () => {
  const document = createHostOutputDocument(
    'private-host-output-update-rollback'
  );
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputProps('initial');
  const nextProps = createHostOutputProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const update = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const thrownError = new Error('fake HostText update failed');

  mounted.host.attributeLog = [];
  mounted.text.writeLog = [];
  Object.defineProperty(mounted.text, 'nodeValue', {
    configurable: true,
    get() {
      return this.data;
    },
    set(value) {
      this.writeLog.push(['nodeValue', String(value), 'throw']);
      throw thrownError;
    }
  });

  assert.throws(
    () =>
      bridge.applyHostOutputUpdate(update, {
        hostInstanceToken: mounted.token,
        nextProps,
        tag: 'div',
        textUpdate: {
          newText: 'goodbye',
          oldText: 'hello',
          textInstance: mounted.text
        }
      }),
    (error) => error === thrownError
  );
  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card'],
    ['data-phase', 'initial'],
    ['id', 'message'],
    ['title', 'initial title']
  ]);
  assert.deepEqual(mounted.host.attributeLog, [
    ['setAttribute', 'class', 'root-card updated'],
    ['setAttribute', 'title', 'updated title'],
    ['setAttribute', 'data-phase', 'updated'],
    ['setAttribute', 'data-phase', 'initial'],
    ['setAttribute', 'title', 'initial title'],
    ['setAttribute', 'class', 'root-card']
  ]);
  assert.deepEqual(mounted.text.writeLog, [['nodeValue', 'goodbye', 'throw']]);
  assert.equal(mounted.text.textContent, 'hello');
  assert.equal(
    componentTree.getLatestPropsFromNode(mounted.host),
    initialProps
  );
  assert.equal(
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(update),
    null
  );

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root host-output update validates initial admission and root ownership', () => {
  const document = createHostOutputDocument('private-host-output-validation');
  const firstContainer = document.createElement('div');
  const secondContainer = document.createElement('section');
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const firstCreate = bridge.createClientRoot(firstContainer);
  const secondCreate = bridge.createClientRoot(secondContainer);
  const firstProps = createHostOutputProps('initial');
  const nextProps = createHostOutputProps('updated');
  const firstInitialRender = bridge.renderContainer(firstCreate.handle, {
    props: firstProps,
    type: 'div'
  });
  const firstUpdate = bridge.renderContainer(firstCreate.handle, {
    props: nextProps,
    type: 'div'
  });
  const firstMounted = mountPrivateHostOutput(
    firstContainer,
    firstCreate.owner,
    firstProps
  );
  const secondMounted = mountPrivateHostOutput(
    secondContainer,
    secondCreate.owner,
    firstProps
  );

  assert.throws(
    () =>
      bridge.applyHostOutputUpdate(firstInitialRender, {
        hostInstanceToken: firstMounted.token,
        nextProps,
        tag: 'div',
        textUpdate: {
          newText: 'goodbye',
          oldText: 'hello',
          textInstance: firstMounted.text
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_HOST_OUTPUT_UPDATE_HANDOFF'
    }
  );
  assert.throws(
    () =>
      bridge.applyHostOutputUpdate(firstUpdate, {
        hostInstanceToken: firstMounted.token,
        nextProps,
        tag: 'div',
        textUpdate: {
          newText: 'goodbye',
          oldText: 'hello',
          textInstance: firstMounted.text
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_HOST_OUTPUT_UPDATE_HANDOFF'
    }
  );

  const firstSideEffects = bridge.applyCreateRootSideEffects(firstCreate);
  bridge.admitCreateRenderPath(
    firstCreate,
    firstSideEffects,
    firstInitialRender
  );
  assert.throws(
    () =>
      bridge.applyHostOutputUpdate(firstUpdate, {
        hostInstanceToken: secondMounted.token,
        nextProps,
        tag: 'div',
        textUpdate: {
          newText: 'goodbye',
          oldText: 'hello',
          textInstance: secondMounted.text
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_HOST_OUTPUT_UPDATE_HANDOFF'
    }
  );

  assert.equal(
    componentTree.detachHostInstanceToken(firstMounted.token),
    firstMounted.token
  );
  assert.equal(
    componentTree.detachHostInstanceToken(secondMounted.token),
    secondMounted.token
  );
  bridge.revertCreateRootSideEffects(firstSideEffects);
});

test('private portal fake-DOM commit handoff validates ownership and blocked side effects', () => {
  const document = createDocument('private-portal-commit');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalChild = {
    props: {
      children: 'portal child'
    },
    type: 'span'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'portal-boundary',
    portalCommitIdPrefix: 'portal-commit'
  });
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    'portal-key'
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const hiddenHandoff =
    rootBridge.getPrivateRootPortalCommitHandoffPayload(handoff);
  const resourceBoundary =
    resourceFormGate.recordResourceFormPortalCommitBlockedRequest(handoff);
  const hiddenResourceBoundary =
    resourceFormGate.getResourceFormPortalCommitBlockedRecordPayload(
      resourceBoundary
    );

  assert.equal(
    handoff.$$typeof,
    rootBridge.privateRootPortalCommitHandoffRecordType
  );
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootPortalFakeDomCommitHandoffRecord'
  );
  assert.equal(
    handoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED
  );
  assert.equal(
    handoff.commitStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED
  );
  assert.equal(handoff.commitHandoffId, 'portal-commit:1');
  assert.equal(handoff.sourceBoundaryId, 'portal-boundary:1');
  assert.equal(handoff.sourceRequestType, 'root.render');
  assert.deepEqual(handoff.fakeDomCommitTarget, {
    canAppendChild: true,
    canRemoveChild: true,
    hasTextContent: true,
    portalContainerInfo: {
      kind: 'object',
      nodeName: 'SECTION',
      nodeType: ELEMENT_NODE
    }
  });
  assert.deepEqual(handoff.pendingChildrenInfo, {
    length: 1,
    type: 'array'
  });
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'portal-fake-dom-commit-apply',
      'portal-prepare-mount-listeners',
      'portal-resource-side-effects',
      'portal-child-reconciliation',
      'portal-container-mounting',
      'portal-container-listeners',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'marker-writes',
      'listener-installation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(handoff.fakeDomCommitHandoff, true);
  assert.equal(handoff.fakeDomCommitApplied, false);
  assert.equal(handoff.portalContainerChildrenReplaced, false);
  assert.equal(handoff.portalChildReconciliation, false);
  assert.equal(handoff.portalMounting, false);
  assert.equal(handoff.preparePortalMount, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.domMutation, false);
  assert.equal(handoff.markerWrites, false);
  assert.equal(handoff.listenerInstallation, false);
  assert.equal(handoff.resourceSideEffects, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.compatibilityClaimed, false);

  assert.equal(
    handoff.portalContainerOwnership.ownershipStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED
  );
  assert.equal(
    handoff.portalContainerOwnership.rootContainerMarkedAsRoot,
    true
  );
  assert.equal(
    handoff.portalContainerOwnership.rootContainerOwnerMatchesHandle,
    true
  );
  assert.equal(
    handoff.portalContainerOwnership.portalContainerMarkedAsRoot,
    false
  );
  assert.equal(
    handoff.portalContainerOwnership.portalContainerOwnerMatchesRoot,
    false
  );
  assert.equal(
    handoff.portalContainerOwnership.portalContainerOwnedByAnotherRoot,
    false
  );
  assert.equal(
    handoff.portalContainerOwnership.portalContainerAvailableForPortal,
    true
  );
  assert.equal(handoff.portalContainerOwnership.sameContainerAsRoot, false);
  assert.equal(handoff.portalContainerOwnership.sameOwnerDocument, true);
  assert.equal(handoff.listenerSideEffects.preparePortalMount, false);
  assert.equal(handoff.listenerSideEffects.listenToAllSupportedEvents, false);
  assert.equal(handoff.listenerSideEffects.listenerInstallation, false);
  assert.equal(handoff.listenerSideEffects.hasPortalListeningMarker, false);
  assert.equal(
    handoff.listenerSideEffects.ownerDocumentHasSelectionChangeMarker,
    true
  );

  assert.equal(hiddenHandoff.boundaryRecord, boundary);
  assert.equal(hiddenHandoff.pendingChildren[0], portalChild);
  assert.equal(hiddenHandoff.portal, portal);
  assert.equal(hiddenHandoff.portalContainer, portalContainer);
  assert.equal(hiddenHandoff.rootContainer, rootContainer);
  assert.equal(hiddenHandoff.rootHandle, create.handle);
  assert.equal(hiddenHandoff.sourceRecord, render);

  assert.equal(
    resourceBoundary.$$typeof,
    resourceFormGate.resourceFormPortalCommitBoundaryRecordType
  );
  assert.equal(
    resourceBoundary.kind,
    'FastReactDomResourceFormPortalCommitBoundaryRecord'
  );
  assert.equal(
    resourceBoundary.resourceSideEffectStatus,
    resourceFormGate.privatePortalCommitResourceBlockedStatus
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.gateStatus,
    resourceFormGate.privateRootBridgeRecordOnlyStatus
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.commitStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED
  );
  assert.equal(resourceBoundary.rootBridgeBoundary.resourceSideEffects, false);
  assert.deepEqual(
    resourceBoundary.sideEffects,
    resourceFormGate.portalCommitResourceSideEffects
  );
  assert.deepEqual(
    resourceBoundary.privateResourceDispatcherBoundary,
    resourceFormGate.describePrivateResourceDispatcherBoundary('resource-hint')
  );
  assert.equal(resourceBoundary.sourceAdapterBoundary.adaptersInvoked, false);
  assert.equal(resourceBoundary.sideEffects.resourcesDispatched, false);
  assert.equal(resourceBoundary.sideEffects.sourceAdaptersInvoked, false);
  assert.equal(resourceBoundary.sideEffects.portalContainerMutated, false);
  assert.equal(hiddenResourceBoundary.portalCommitHandoff, handoff);

  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalContainer.__mutationLog.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.throws(() => bridge.createPortalCommitHandoff({}), {
    code: 'FAST_REACT_DOM_INVALID_PORTAL_COMMIT_HANDOFF_RECORD'
  });
  assert.throws(() => otherBridge.createPortalCommitHandoff(boundary), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(
    () =>
      resourceFormGate.recordResourceFormPortalCommitBlockedRequest({
        ...handoff,
        compatibilityClaimed: true
      }),
    {
      code: resourceFormGate.rootBoundaryInvalidPortalCommitHandoffCode
    }
  );

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assertBridgeDidNotTouchContainer(rootContainer, document);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalContainer.__mutationLog.length, 0);
});

test('public react-dom/client root placeholders remain inert', () => {
  const document = createDocument('public-placeholder');
  const container = createElement('DIV', document);

  assert.deepEqual(Object.keys(reactDomClient), [
    'createRoot',
    'hydrateRoot',
    'version'
  ]);
  assert.equal(reactDomClient.__FAST_REACT_PLACEHOLDER__, true);
  assert.throws(() => reactDomClient.createRoot(container), {
    code: 'FAST_REACT_UNIMPLEMENTED',
    entrypoint: 'react-dom/client',
    exportName: 'createRoot'
  });
  assertBridgeDidNotTouchContainer(container, document);
});

function createHostOutputProps(phase) {
  if (phase === 'updated') {
    return {
      id: 'message',
      className: 'root-card updated',
      title: 'updated title',
      'data-phase': 'updated',
      children: 'goodbye'
    };
  }

  return {
    id: 'message',
    className: 'root-card',
    title: 'initial title',
    'data-phase': 'initial',
    children: 'hello'
  };
}

function mountPrivateHostOutput(container, rootOwner, initialProps) {
  const host = container.ownerDocument.createElement('div');
  const text = container.ownerDocument.createTextNode(initialProps.children);
  const token = componentTree.createHostInstanceToken(
    {kind: 'PrivateRootHostOutputHost'},
    rootOwner
  );

  componentTree.attachHostInstanceNode(host, token, {});
  const propsHandoff = domHost.commitDomPropertyUpdateForLatestProps(
    host,
    'div',
    {},
    initialProps
  );
  componentTree.commitLatestPropsFromMutationHandoff(propsHandoff);
  domHost.appendInitialChild(host, text);
  domHost.appendChildToContainer(container, host);

  return {
    host,
    text,
    token
  };
}

function activeHostOutputAttributes(element) {
  return Array.from(element.attributes.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function assertNativeHandoff(handoff, expected) {
  assert.equal(Object.isFrozen(handoff), true);
  assert.equal(Object.isFrozen(handoff.nativeRequestRecord), true);
  assert.equal(handoff.$$typeof, rootBridge.privateRootNativeHandoffRecordType);
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootNativeRequestHandoffRecord'
  );
  assert.equal(
    handoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(handoff.operation, expected.operation);
  assert.equal(handoff.handoffId, expected.handoffId);
  assert.equal(handoff.handoffSequence, expected.handoffSequence);
  assert.equal(handoff.sourceRequestId, expected.sourceRequestId);
  assert.equal(handoff.sourceRequestSequence, expected.sourceRequestSequence);
  assert.equal(handoff.sourceRequestType, expected.sourceRequestType);
  assert.equal(
    handoff.sourceLifecycleStatusBefore,
    expected.sourceLifecycleStatusBefore
  );
  assert.equal(
    handoff.sourceLifecycleStatusAfter,
    expected.sourceLifecycleStatusAfter
  );
  assert.equal(handoff.rootId, 'root:1');
  assert.equal(handoff.rootKind, rootBridge.CLIENT_ROOT_KIND);
  assert.equal(handoff.rootTag, rootBridge.CONCURRENT_ROOT_TAG);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.domMutation, false);
  assert.equal(handoff.markerWrites, false);
  assert.equal(handoff.listenerInstallation, false);
  assert.equal(handoff.hydration, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.compatibilityClaimed, false);
}

function assertNativeRequestRecord(record, expected) {
  assert.equal(record.requestId, expected.requestId);
  assert.equal(record.kind, expected.kind);
  assert.equal(record.environmentId, 269);
  assert.equal(record.rootId, expected.rootValue);
  assert.equal(record.rootHandleState, expected.rootHandleState);
  assert.equal(Object.isFrozen(record.rootHandle), true);
  assert.deepEqual(record.rootHandle, {
    $$typeof: rootBridge.privateRootNativeBridgeHandleType,
    environmentId: 269,
    generation: 1,
    kind: rootBridge.NATIVE_ROOT_BRIDGE_HANDLE_ROOT,
    slot: expected.rootSlot
  });
  if (expected.valueSlot === null) {
    assert.equal(record.valueHandle, null);
  } else {
    assert.equal(Object.isFrozen(record.valueHandle), true);
    assert.deepEqual(record.valueHandle, {
      $$typeof: rootBridge.privateRootNativeBridgeHandleType,
      environmentId: 269,
      generation: 1,
      kind: rootBridge.NATIVE_ROOT_BRIDGE_HANDLE_VALUE,
      slot: expected.valueSlot
    });
  }
}

function assertHiddenNativePayload(handoff) {
  assert.equal(Object.keys(handoff).includes('sourceRecord'), false);
  assert.equal(Object.keys(handoff).includes('sourcePayload'), false);
  assert.equal(Object.keys(handoff).includes('value'), false);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('afterRootUpdate'), false);
}

function assertBridgeDidNotTouchContainer(container, document) {
  assert.equal(
    rootMarkers.inspectContainerRootMarker(container).propertyCount,
    0
  );
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
}

function createHostOutputDocument(label) {
  return new HostOutputDocument(label);
}

class HostOutputEventTarget {
  constructor(fields) {
    Object.assign(this, fields);
    this.__mutationLog = [];
    this.__removals = [];
    this.__registrations = [];
  }

  addEventListener(type, listener, options) {
    this.__registrations.push({
      listener,
      options,
      type
    });
  }

  removeEventListener(type, listener, options) {
    const index = this.__registrations.findIndex(
      (entry) =>
        entry.type === type &&
        entry.listener === listener &&
        entry.options === options
    );
    if (index !== -1) {
      this.__registrations.splice(index, 1);
    }
    this.__removals.push({
      listener,
      options,
      type
    });
  }
}

class HostOutputDocument extends HostOutputEventTarget {
  constructor(label) {
    super({
      label,
      nodeName: '#document',
      nodeType: DOCUMENT_NODE
    });
    this.ownerDocument = this;
    this.defaultView = new HostOutputEventTarget({
      label: `${label}-window`
    });
  }

  createElement(nodeName) {
    return new HostOutputElement(String(nodeName), this);
  }

  createTextNode(text) {
    return new HostOutputText(text, this);
  }
}

class HostOutputNode extends HostOutputEventTarget {
  constructor(nodeName, nodeType, ownerDocument) {
    super({
      nodeName,
      nodeType,
      ownerDocument
    });
    this.childNodes = [];
    this.parentNode = null;
    this._textContent = '';
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }

  get textContent() {
    if (this.childNodes.length === 0) {
      return this._textContent;
    }
    return this.childNodes.map((child) => child.textContent).join('');
  }

  set textContent(value) {
    for (const child of [...this.childNodes]) {
      detachHostOutputChild(child);
    }
    this._textContent = String(value);
    this.__mutationLog.push({type: 'textContent', value: String(value)});
  }

  appendChild(child) {
    assertHostOutputChild(child);
    assertHostOutputCanAcceptChild(this, child);
    detachHostOutputChild(child);
    this.childNodes.push(child);
    child.parentNode = this;
    this.__mutationLog.push({child, type: 'appendChild'});
    return child;
  }

  insertBefore(child, beforeChild) {
    assertHostOutputChild(child);
    assertHostOutputCanAcceptChild(this, child);
    if (beforeChild.parentNode !== this) {
      throw new Error('Host-output insert target is not a child.');
    }
    if (child === beforeChild) {
      return child;
    }
    detachHostOutputChild(child);
    const insertionIndex = this.childNodes.indexOf(beforeChild);
    this.childNodes.splice(insertionIndex, 0, child);
    child.parentNode = this;
    this.__mutationLog.push({beforeChild, child, type: 'insertBefore'});
    return child;
  }

  removeChild(child) {
    if (child.parentNode !== this) {
      throw new Error('Host-output remove target is not a child.');
    }
    detachHostOutputChild(child);
    this.__mutationLog.push({child, type: 'removeChild'});
    return child;
  }
}

class HostOutputElement extends HostOutputNode {
  constructor(nodeName, ownerDocument) {
    super(nodeName, ELEMENT_NODE, ownerDocument);
    this.attributes = new Map();
    this.attributeLog = [];
  }

  setAttribute(name, value) {
    const attributeName = String(name);
    const stringValue = String(value);
    this.attributeLog.push(['setAttribute', attributeName, stringValue]);
    this.attributes.set(attributeName, stringValue);
  }

  removeAttribute(name) {
    const attributeName = String(name);
    this.attributeLog.push([
      'removeAttribute',
      attributeName,
      this.attributes.has(attributeName)
    ]);
    this.attributes.delete(attributeName);
  }

  getAttribute(name) {
    const attributeName = String(name);
    return this.attributes.has(attributeName)
      ? this.attributes.get(attributeName)
      : null;
  }

  hasAttribute(name) {
    return this.attributes.has(String(name));
  }
}

class HostOutputText extends HostOutputNode {
  constructor(text, ownerDocument) {
    super('#text', TEXT_NODE, ownerDocument);
    this._data = String(text);
    this.writeLog = [];
  }

  get data() {
    return this._data;
  }

  set data(value) {
    const text = String(value);
    this.writeLog.push(['data', text]);
    this._data = text;
  }

  get nodeValue() {
    return this._data;
  }

  set nodeValue(value) {
    const text = String(value);
    this.writeLog.push(['nodeValue', text]);
    this._data = text;
  }

  get textContent() {
    return this._data;
  }

  set textContent(value) {
    const text = String(value);
    this.writeLog.push(['textContent', text]);
    this._data = text;
  }
}

function assertHostOutputChild(child) {
  if (child === null || typeof child !== 'object') {
    throw new Error('Host-output child must be a node.');
  }
}

function assertHostOutputCanAcceptChild(parent, child) {
  let current = parent;
  while (current !== null) {
    if (current === child) {
      throw new Error('Host-output cannot insert an ancestor.');
    }
    current = current.parentNode;
  }
}

function detachHostOutputChild(child) {
  if (child.parentNode === null) {
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: '#document',
    nodeType: DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createEventTarget({label: `${label}-window`});
  return document;
}

function createElement(nodeName, ownerDocument) {
  return createEventTarget({
    nodeName,
    nodeType: ELEMENT_NODE,
    ownerDocument
  });
}

function createEventTarget(fields) {
  const target = {
    ...fields,
    __mutationLog: [],
    __removals: [],
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    },
    removeEventListener(type, listener, options) {
      const index = this.__registrations.findIndex(
        (entry) =>
          entry.type === type &&
          entry.listener === listener &&
          entry.options === options
      );
      if (index !== -1) {
        this.__registrations.splice(index, 1);
      }
      this.__removals.push({
        listener,
        options,
        type
      });
    },
    appendChild(child) {
      this.__mutationLog.push({child, type: 'appendChild'});
    },
    insertBefore(child, beforeChild) {
      this.__mutationLog.push({beforeChild, child, type: 'insertBefore'});
    },
    removeChild(child) {
      this.__mutationLog.push({child, type: 'removeChild'});
    }
  };
  let textContent = '';
  Object.defineProperty(target, 'textContent', {
    configurable: true,
    enumerable: true,
    get() {
      return textContent;
    },
    set(value) {
      textContent = value;
      this.__mutationLog.push({type: 'textContent', value});
    }
  });
  return target;
}
