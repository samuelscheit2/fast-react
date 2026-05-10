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
const refCallbackGate = require(
  path.join(packageRoot, 'src/client/ref-callback-gate.js')
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
const pluginEventSystem = require(
  path.join(packageRoot, 'src/events/plugin-event-system.js')
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

test('private initial host output handoff applies and cleans fake-DOM host nodes', () => {
  const document = createDocument('private-initial-host-output');
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'hello bridge',
      id: 'root-host',
      onClick() {
        return 'not-invoked';
      },
      title: 'Initial host'
    },
    type: 'main'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: 'initial-admission',
    initialHostOutputIdPrefix: 'initial-output',
    sideEffectIdPrefix: 'initial-side-effect'
  });

  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hidden =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);

  assert.equal(
    rootBridge.applyPrivateInitialRenderHostOutput(admission),
    handoff
  );
  assert.equal(
    rootBridge.isPrivateRootInitialHostOutputHandoffRecord(handoff),
    true
  );
  assert.equal(Object.isFrozen(handoff), true);
  assert.equal(
    handoff.$$typeof,
    rootBridge.privateRootInitialHostOutputHandoffRecordType
  );
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootInitialHostOutputHandoffRecord'
  );
  assert.equal(handoff.operation, 'initial-host-output');
  assert.equal(
    handoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED
  );
  assert.equal(handoff.handoffId, 'initial-output:1');
  assert.equal(handoff.sourceAdmissionId, 'initial-admission:1');
  assert.equal(handoff.rootId, create.rootId);
  assert.equal(handoff.hostType, 'main');
  assert.equal(handoff.containerChildCount, 1);
  assert.equal(handoff.hostChildCount, 1);
  assert.equal(handoff.textContent, 'hello bridge');
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'create-render-admission',
      'fake-dom-host-component',
      'fake-dom-host-text',
      'component-tree-host-instance-map',
      'latest-props-publication'
    ]
  );
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-object',
      'native-execution',
      'reconciler-execution',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(handoff.publicRootCreated, false);
  assert.equal(handoff.publicRootObjectExposed, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.rootScheduled, false);
  assert.equal(handoff.domMutation, true);
  assert.equal(handoff.markerWrites, false);
  assert.equal(handoff.listenerInstallation, false);
  assert.equal(handoff.hydration, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.compatibilityClaimed, false);

  const hostNode = container.childNodes[0];
  const textNode = hostNode.childNodes[0];
  assert.equal(hidden.admissionRecord, admission);
  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.renderRecord, render);
  assert.equal(hidden.sideEffectRecord, sideEffects);
  assert.equal(hidden.container, container);
  assert.equal(hidden.element, element);
  assert.equal(hidden.hostNode, hostNode);
  assert.equal(hidden.textNode, textNode);
  assert.equal(hidden.rootOwner, create.owner);
  assert.deepEqual(hidden.latestPropsBeforeCommit, {});
  assert.equal(hidden.latestPropsAfterCommit, element.props);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), create.owner);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), element.props);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.deepEqual(attributeEntries(hostNode), [
    ['id', 'root-host'],
    ['title', 'Initial host']
  ]);
  assert.deepEqual(hostNode.attributeLog, [
    ['setAttribute', 'id', 'root-host'],
    ['setAttribute', 'title', 'Initial host']
  ]);
  assert.equal(textNode.nodeValue, 'hello bridge');
  assert.deepEqual(container.mutationLog, [['appendChild', 'MAIN']]);
  assert.deepEqual(hostNode.mutationLog, [['appendChild', '#text']]);
  assert.equal(container.textContent, 'hello bridge');
  assert.equal(listenerRegistry.hasListeningMarker(container), true);
  assert.equal(listenerRegistry.hasListeningMarker(document), true);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('hello bridge'), true);
  assert.equal(serialized.includes('not-invoked'), false);

  const cleanup = bridge.cleanupInitialRenderHostOutput(handoff);
  assert.equal(
    rootBridge.cleanupPrivateInitialRenderHostOutput(handoff),
    cleanup
  );
  assert.equal(
    cleanup.$$typeof,
    rootBridge.privateRootInitialHostOutputCleanupRecordType
  );
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED
  );
  assert.equal(cleanup.sourceHandoffId, handoff.handoffId);
  assert.equal(cleanup.removedRootChild, true);
  assert.equal(cleanup.detachedHostInstanceCount, 2);
  assert.equal(cleanup.containerChildCountAfterCleanup, 0);
  assert.equal(cleanup.domMutation, true);
  assert.equal(cleanup.compatibilityClaimed, false);
  assert.equal(container.childNodes.length, 0);
  assert.equal(container.textContent, '');
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), true);
  assert.equal(listenerRegistry.hasListeningMarker(document), true);

  bridge.revertCreateRootSideEffects(sideEffects);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.childNodes.length, 0);
});

test('private initial host output handoff validates admission and rolls back unsupported children', () => {
  const document = createDocument('private-initial-host-output-validation');
  const container = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, {
    props: {
      children: ['unsupported']
    },
    type: 'section'
  });
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );

  assert.throws(() => bridge.applyInitialRenderHostOutput(render), {
    code: 'FAST_REACT_DOM_INVALID_INITIAL_HOST_OUTPUT_HANDOFF'
  });
  assert.throws(() => otherBridge.applyInitialRenderHostOutput(admission), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => bridge.applyInitialRenderHostOutput(admission), {
    code: 'FAST_REACT_DOM_INVALID_INITIAL_HOST_OUTPUT_HANDOFF'
  });
  assert.equal(container.childNodes.length, 0);
  assert.equal(container.__mutationLog.length, 0);

  const validContainer = createElement('DIV', document);
  const validCreate = bridge.createClientRoot(validContainer);
  const validSideEffects = bridge.applyCreateRootSideEffects(validCreate);
  const validRender = bridge.renderContainer(validCreate.handle, {
    props: {
      children: 'after cleanup'
    },
    type: 'article'
  });
  const validAdmission = bridge.admitCreateRenderPath(
    validCreate,
    validSideEffects,
    validRender
  );
  bridge.revertCreateRootSideEffects(validSideEffects);
  assert.throws(() => bridge.applyInitialRenderHostOutput(validAdmission), {
    code: 'FAST_REACT_DOM_INVALID_CREATE_RENDER_ADMISSION'
  });
  assert.equal(validContainer.childNodes.length, 0);

  bridge.revertCreateRootSideEffects(sideEffects);
  assert.equal(container.childNodes.length, 0);
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
    propertyPayloadEvidence: {
      propertyPayloadBacked: true,
      rowCount: 4,
      mutatingRowCount: 3,
      updateRowCount: 3,
      removalRowCount: 0,
      setAttributeCount: 3,
      removeAttributeCount: 0,
      setPropertyCount: 0,
      removePropertyCount: 0,
      setStyleCount: 0,
      removeStyleCount: 0,
      nonPayloadRowCount: 1,
      attributeRowCount: 3,
      propertyRowCount: 0,
      styleRowCount: 0,
      rowKinds: ['setAttribute', 'nonPayload']
    },
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
      'property-payload-evidence',
      'fake-dom-text-update',
      'latest-props-after-mutation',
      'attribute-payload-rows'
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

test('private root host-output update admits attribute and style rows without text canary', () => {
  const document = createHostOutputDocument('private-host-output-prop-update');
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hostOutputUpdateIdPrefix: 'host-prop-update',
    sideEffectIdPrefix: 'host-prop-side-effect'
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputAttributeStyleProps('initial');
  const nextProps = createHostOutputAttributeStyleProps('updated');
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
  mounted.host.styleLog = [];
  mounted.text.writeLog = [];

  const handoff = bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: mounted.token,
    nextProps,
    tag: 'div'
  });
  const hiddenHandoff =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(handoff);

  assert.equal(handoff.handoffId, 'host-prop-update:1');
  assert.equal(
    handoff.updateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.deepEqual(handoff.propertyMutation, {
    handoffKind: domHost.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF,
    latestPropsCommitRecordKind: domHost.LATEST_PROPS_COMMIT_RECORD,
    latestPropsCommitRecordStatus: 'safe-for-latest-props',
    mutationRecordCount: 8,
    payloadCount: 8,
    propertyPayloadEvidence: {
      propertyPayloadBacked: true,
      rowCount: 8,
      mutatingRowCount: 8,
      updateRowCount: 4,
      removalRowCount: 4,
      setAttributeCount: 2,
      removeAttributeCount: 2,
      setPropertyCount: 0,
      removePropertyCount: 0,
      setStyleCount: 2,
      removeStyleCount: 2,
      nonPayloadRowCount: 0,
      attributeRowCount: 4,
      propertyRowCount: 0,
      styleRowCount: 4,
      rowKinds: [
        'removeAttribute',
        'setAttribute',
        'removeStyle',
        'setStyle'
      ]
    },
    status: 'mutated'
  });
  assert.deepEqual(handoff.textMutation, {
    newTextLength: null,
    oldTextLength: null,
    status: 'not-requested'
  });
  assert.equal(handoff.latestPropsPublished, true);
  assert.equal(handoff.latestPropsPublishOrder, 'after-property-mutation');
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'fake-dom-property-update',
      'property-payload-evidence',
      'latest-props-after-mutation',
      'attribute-payload-rows',
      'style-payload-rows'
    ]
  );
  assert.equal(hiddenHandoff.sourceRecord, update);
  assert.equal(hiddenHandoff.hostInstanceNode, mounted.host);
  assert.equal(hiddenHandoff.textInstance, null);
  assert.equal(hiddenHandoff.textUpdate, null);
  assert.equal(hiddenHandoff.previousProps, initialProps);
  assert.equal(hiddenHandoff.nextProps, nextProps);
  assert.equal(hiddenHandoff.propertyMutationEvidence.styleRowCount, 4);

  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card updated'],
    ['data-phase', 'updated'],
    ['id', 'message']
  ]);
  assert.deepEqual(activeHostOutputStyleProperties(mounted.host), [
    ['color', 'blue'],
    ['width', '12px']
  ]);
  assert.deepEqual(mounted.host.attributeLog, [
    ['removeAttribute', 'title', true],
    ['removeAttribute', 'hidden', true],
    ['setAttribute', 'class', 'root-card updated'],
    ['setAttribute', 'data-phase', 'updated']
  ]);
  assert.deepEqual(mounted.host.styleLog, [
    ['stylePropertyAssignment', 'marginTop', ''],
    ['styleSetProperty', '--gap', ''],
    ['stylePropertyAssignment', 'color', 'blue'],
    ['stylePropertyAssignment', 'width', '12px']
  ]);
  assert.deepEqual(mounted.text.writeLog, []);
  assert.equal(container.textContent, 'stable');
  assert.equal(componentTree.getLatestPropsFromNode(mounted.host), nextProps);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('blue'), false);
  assert.equal(serialized.includes('root-card updated'), false);

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root commit HostComponent update consumes reconciler metadata for fake-DOM mutation', () => {
  const document = createHostOutputDocument(
    'private-root-commit-host-component-update'
  );
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hostOutputUpdateIdPrefix: 'root-commit-host-output',
    rootCommitHostComponentUpdateIdPrefix: 'root-commit-host-component',
    sideEffectIdPrefix: 'root-commit-side-effect'
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputAttributeStyleProps('initial');
  const nextProps = createHostOutputAttributeStyleProps('updated');
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
  const rootCommitMetadata = {
    kind: 'HostRootCommitRecord',
    mutationApplyRecords: [
      {
        kind: 'commit-host-text-update',
        tag: 'HostText',
        stateNodeRaw: 902,
        pendingPropsRaw: 4003,
        memoizedPropsRaw: 4003,
        alternateMemoizedPropsRaw: 4001
      },
      createRootCommitHostComponentUpdateRecord({
        recordIndex: 1,
        stateNodeRaw: 901
      })
    ]
  };

  mounted.host.attributeLog = [];
  mounted.host.styleLog = [];
  mounted.text.writeLog = [];

  const handoff = bridge.applyRootCommitHostComponentUpdate(
    update,
    rootCommitMetadata,
    {
      hostInstanceToken: mounted.token,
      nextProps,
      tag: 'div',
      stateNodeRaw: 901
    }
  );
  const hiddenHandoff =
    rootBridge.getPrivateRootCommitHostComponentUpdateHandoffPayload(
      handoff
    );

  assert.equal(
    handoff.$$typeof,
    rootBridge.privateRootCommitHostComponentUpdateHandoffRecordType
  );
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootCommitHostComponentUpdateHandoffRecord'
  );
  assert.equal(handoff.handoffId, 'root-commit-host-component:1');
  assert.equal(
    handoff.updateStatus,
    rootBridge.ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_APPLIED
  );
  assert.equal(handoff.sourceUpdateId, update.updateId);
  assert.equal(handoff.hostTag, 'div');
  assert.equal(handoff.rootCommitMetadataSource, 'mutationApplyRecords');
  assert.equal(handoff.rootCommitMetadataRecordCount, 2);
  assert.equal(handoff.rootCommitHostComponentUpdateRecordCount, 1);
  assert.deepEqual(handoff.rootCommitHostComponentUpdate, {
    metadataSource: 'mutationApplyRecords',
    recordIndex: 1,
    recordKind: 'CommitHostComponentUpdate',
    applyKind: 'commit-host-component-update',
    phaseKind: null,
    tag: 'HostComponent',
    parentTag: 'HostRoot',
    stateNodeRaw: 901,
    pendingPropsRaw: 3003,
    memoizedPropsRaw: 3003,
    alternateMemoizedPropsRaw: 3001,
    rootInfo: {
      keys: ['slot'],
      type: 'object'
    },
    hostRootInfo: {
      keys: ['slot'],
      type: 'object'
    },
    parentInfo: {
      keys: ['slot'],
      type: 'object'
    },
    fiberInfo: {
      keys: ['slot'],
      type: 'object'
    },
    alternateFiberInfo: {
      keys: ['slot'],
      type: 'object'
    },
    sourceInfo: {
      keys: ['kind'],
      type: 'object'
    }
  });
  assert.equal(
    handoff.hostOutputUpdateHandoffId,
    'root-commit-host-output:1'
  );
  assert.equal(
    handoff.hostOutputUpdateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(handoff.propertyMutation.mutationRecordCount, 8);
  assert.equal(
    handoff.propertyMutation.propertyPayloadEvidence.styleRowCount,
    4
  );
  assert.deepEqual(handoff.textMutation, {
    newTextLength: null,
    oldTextLength: null,
    status: 'not-requested'
  });
  assert.equal(handoff.latestPropsPublished, true);
  assert.equal(handoff.latestPropsPublishOrder, 'after-property-mutation');
  assert.equal(handoff.fakeDomMutation, true);
  assert.equal(handoff.domMutation, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.refEffects, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'root-commit-host-component-update-metadata',
      'fake-dom-property-update',
      'property-payload-evidence',
      'latest-props-after-mutation',
      'attribute-payload-rows',
      'style-payload-rows'
    ]
  );
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'host-text-update',
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
    rootBridge.isPrivateRootCommitHostComponentUpdateHandoffRecord(handoff),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootCommitHostComponentUpdateHandoffRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootCommitHostComponentUpdateHandoffPayload({}),
    null
  );
  assert.equal(hiddenHandoff.sourceRecord, update);
  assert.equal(hiddenHandoff.rootHandle, create.handle);
  assert.equal(hiddenHandoff.hostInstanceNode, mounted.host);
  assert.equal(hiddenHandoff.hostInstanceToken, mounted.token);
  assert.equal(hiddenHandoff.previousProps, initialProps);
  assert.equal(hiddenHandoff.nextProps, nextProps);
  assert.equal(hiddenHandoff.latestPropsPublished, true);
  assert.equal(hiddenHandoff.rootCommitMetadata, rootCommitMetadata);
  assert.equal(
    hiddenHandoff.selectedRootCommitRecord,
    rootCommitMetadata.mutationApplyRecords[1]
  );
  assert.equal(
    hiddenHandoff.hostOutputHandoff.handoffId,
    handoff.hostOutputUpdateHandoffId
  );
  assert.equal(
    rootBridge.applyPrivateRootCommitHostComponentUpdate(
      update,
      rootCommitMetadata,
      {}
    ),
    handoff
  );

  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card updated'],
    ['data-phase', 'updated'],
    ['id', 'message']
  ]);
  assert.deepEqual(activeHostOutputStyleProperties(mounted.host), [
    ['color', 'blue'],
    ['width', '12px']
  ]);
  assert.deepEqual(mounted.text.writeLog, []);
  assert.equal(container.textContent, 'stable');
  assert.equal(componentTree.getLatestPropsFromNode(mounted.host), nextProps);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('blue'), false);
  assert.equal(serialized.includes('root-card updated'), false);

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root commit HostComponent update validates reconciler metadata fail-closed', () => {
  const document = createHostOutputDocument(
    'private-root-commit-host-component-update-validation'
  );
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputAttributeStyleProps('initial');
  const nextProps = createHostOutputAttributeStyleProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const noHostUpdate = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const ambiguousUpdate = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const mismatchUpdate = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const textUpdate = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });

  assert.throws(
    () =>
      bridge.applyRootCommitHostComponentUpdate(
        noHostUpdate,
        {
          mutationApplyRecords: [
            {
              kind: 'commit-host-text-update',
              tag: 'HostText',
              stateNodeRaw: 902,
              pendingPropsRaw: 4003,
              memoizedPropsRaw: 4003,
              alternateMemoizedPropsRaw: 4001
            }
          ]
        },
        {
          hostInstanceToken: mounted.token,
          nextProps,
          tag: 'div'
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_ROOT_COMMIT_HOST_COMPONENT_UPDATE_HANDOFF'
    }
  );
  assert.throws(
    () =>
      bridge.applyRootCommitHostComponentUpdate(
        ambiguousUpdate,
        {
          mutation_apply_records: [
            createRootCommitHostComponentUpdateRecord({
              stateNodeRaw: 901
            }),
            createRootCommitHostComponentUpdateRecord({
              stateNodeRaw: 903
            })
          ]
        },
        {
          hostInstanceToken: mounted.token,
          nextProps,
          tag: 'div'
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_ROOT_COMMIT_HOST_COMPONENT_UPDATE_HANDOFF'
    }
  );
  assert.throws(
    () =>
      bridge.applyRootCommitHostComponentUpdate(
        mismatchUpdate,
        {
          mutationApplyRecords: [
            createRootCommitHostComponentUpdateRecord({
              stateNodeRaw: 901
            })
          ]
        },
        {
          hostInstanceToken: mounted.token,
          nextProps,
          tag: 'div',
          stateNodeRaw: 999
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_ROOT_COMMIT_HOST_COMPONENT_UPDATE_HANDOFF'
    }
  );
  assert.throws(
    () =>
      bridge.applyRootCommitHostComponentUpdate(
        textUpdate,
        {
          mutationApplyRecords: [
            createRootCommitHostComponentUpdateRecord({
              stateNodeRaw: 901
            })
          ]
        },
        {
          hostInstanceToken: mounted.token,
          nextProps,
          tag: 'div',
          textUpdate: {
            newText: 'updated text',
            oldText: 'stable',
            textInstance: mounted.text
          }
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_ROOT_COMMIT_HOST_COMPONENT_UPDATE_HANDOFF'
    }
  );

  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card'],
    ['data-phase', 'initial'],
    ['hidden', ''],
    ['id', 'message'],
    ['title', 'initial title']
  ]);
  assert.deepEqual(activeHostOutputStyleProperties(mounted.host), [
    ['--gap', '4px'],
    ['color', 'red'],
    ['marginTop', '4px']
  ]);
  assert.equal(componentTree.getLatestPropsFromNode(mounted.host), initialProps);

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

test('private portal preparePortalMount listener intent records without installing', () => {
  const document = createDocument('private-portal-prepare-listener');
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
    portalPrepareMountListenerIdPrefix: 'portal-listener'
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

  const intent = bridge.createPortalPrepareMountListenerIntent(boundary);
  const hiddenIntent =
    rootBridge.getPrivateRootPortalPrepareMountListenerIntentPayload(
      intent
    );
  const eventIntentPayload =
    rootListeners.getPortalPrepareMountListenerIntentPayload(
      hiddenIntent.listenerIntentRecord
    );

  assert.equal(
    intent.$$typeof,
    rootBridge.privateRootPortalPrepareMountListenerIntentRecordType
  );
  assert.equal(
    intent.kind,
    'FastReactDomPrivateRootPortalPrepareMountListenerIntentRecord'
  );
  assert.equal(intent.operation, 'portal-prepare-mount-listener-intent');
  assert.equal(intent.intentId, 'portal-listener:1');
  assert.equal(
    intent.intentStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_INTENT_ADMITTED
  );
  assert.equal(
    intent.listenerInstallationStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_LISTENER_INSTALLATION_BLOCKED
  );
  assert.equal(intent.sourceBoundaryId, boundary.boundaryId);
  assert.equal(intent.sourceRequestId, render.requestId);
  assert.equal(intent.portalKey, 'portal-key');
  assert.deepEqual(intent.hostFiberPath, ['HostRoot', 'HostPortal']);
  assert.deepEqual(
    intent.acceptedCapabilities.map((capability) => capability.id),
    [
      'portal-accepted-boundary',
      'portal-prepare-mount-listener-intent',
      'portal-listen-to-all-supported-events-plan'
    ]
  );
  assert.deepEqual(
    intent.blockedCapabilities.map((capability) => capability.id),
    [
      'portal-public-container-mounting',
      'portal-listener-installation',
      'portal-event-dispatch',
      'portal-child-reconciliation',
      'portal-container-replacement',
      'portal-resource-side-effects',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'hydration',
      'compatibility-claims'
    ]
  );
  assert.equal(intent.preparePortalMountIntent, true);
  assert.equal(intent.preparePortalMount, false);
  assert.equal(intent.listenToAllSupportedEventsIntent, true);
  assert.equal(intent.listenToAllSupportedEvents, false);
  assert.equal(intent.portalListenerIntentRecorded, true);
  assert.equal(intent.portalContainerChildrenReplaced, false);
  assert.equal(intent.portalChildReconciliation, false);
  assert.equal(intent.portalMounting, false);
  assert.equal(intent.publicPortalMounting, false);
  assert.equal(intent.nativeExecution, false);
  assert.equal(intent.reconcilerExecution, false);
  assert.equal(intent.domMutation, false);
  assert.equal(intent.publicDomMutation, false);
  assert.equal(intent.markerWrites, false);
  assert.equal(intent.listenerInstallation, false);
  assert.equal(intent.resourceSideEffects, false);
  assert.equal(intent.eventDispatch, false);
  assert.equal(intent.compatibilityClaimed, false);
  assert.equal(
    intent.portalListenerGuard.action,
    'record-prepare-portal-mount-listener-intent'
  );
  assert.equal(intent.portalListenerGuard.hasPortalListeningMarker, false);
  assert.equal(intent.listenerIntent.listenerIntentCount, 138);
  assert.equal(intent.listenerIntent.portalListenerIntentCount, 138);
  assert.equal(intent.listenerIntent.ownerDocumentListenerIntentCount, 0);
  assert.equal(intent.listenerIntent.passiveListenerIntentCount, 6);
  assert.equal(intent.listenerIntent.portalAlreadyListening, false);
  assert.equal(intent.listenerIntent.ownerDocumentAlreadyListening, true);
  assert.equal(
    intent.listenerIntent.eventIntentMatchesPreparePortalMount,
    true
  );
  assert.equal(
    intent.listenerIntent.eventRecordType,
    rootListeners.privatePortalPrepareMountListenerIntentRecordType
  );
  assert.equal(
    intent.portalContainerOwnership.ownershipStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED
  );
  assert.equal(
    intent.portalContainerOwnership.rootContainerOwnerMatchesHandle,
    true
  );
  assert.equal(
    intent.portalContainerOwnership.portalContainerAvailableForPortal,
    true
  );

  assert.equal(
    rootBridge.isPrivateRootPortalPrepareMountListenerIntentRecord(intent),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPortalPrepareMountListenerIntentRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPortalPrepareMountListenerIntentPayload({}),
    null
  );
  assert.equal(
    rootListeners.isPortalPrepareMountListenerIntentRecord(
      hiddenIntent.listenerIntentRecord
    ),
    true
  );
  assert.equal(hiddenIntent.boundaryRecord, boundary);
  assert.equal(hiddenIntent.listenerIntentPayload, eventIntentPayload);
  assert.equal(hiddenIntent.portal, portal);
  assert.equal(hiddenIntent.portalContainer, portalContainer);
  assert.equal(hiddenIntent.rootContainer, rootContainer);
  assert.equal(hiddenIntent.rootHandle, create.handle);
  assert.equal(hiddenIntent.sourceRecord, render);
  assert.equal(eventIntentPayload.portalContainer, portalContainer);
  assert.equal(eventIntentPayload.ownerDocument, document);
  assert.equal(eventIntentPayload.portalListenerIntents.length, 138);
  assert.equal(eventIntentPayload.ownerDocumentListenerIntents.length, 0);
  assert.equal(eventIntentPayload.listenerIntents.length, 138);

  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalContainer.__mutationLog.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      portalContainer,
      listenerRegistry.internalEventHandlersKey
    ),
    false
  );
  assert.equal(rootContainer.__mutationLog.length, 0);

  const serialized = JSON.stringify(intent);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('__FAST_REACT_DOM_EVENT_TARGET__'), false);

  assert.throws(() => bridge.createPortalPrepareMountListenerIntent({}), {
    code: 'FAST_REACT_DOM_INVALID_PORTAL_PREPARE_MOUNT_LISTENER_RECORD'
  });
  assert.throws(
    () => otherBridge.createPortalPrepareMountListenerIntent(boundary),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(portalContainer.__registrations.length, 0);
});

test('private root unmount host-output cleanup clears fake DOM and metadata', () => {
  const document = createDocument('private-unmount-host-output');
  const container = createElement('DIV', document);
  const hostChild = createElement('SECTION', document);
  const textChild = createTextNode('committed text', document);
  const hostOwner = {kind: 'HostComponentOwner'};
  const textOwner = {kind: 'HostTextOwner'};
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: 'unmount-admission',
    sideEffectIdPrefix: 'unmount-side-effects',
    unmountCleanupIdPrefix: 'unmount-cleanup'
  });
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, {
    props: {
      children: 'committed text'
    },
    type: 'section'
  });
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const hostToken = componentTree.createHostInstanceToken(
    hostOwner,
    create.owner
  );
  const textToken = componentTree.createHostInstanceToken(
    textOwner,
    create.owner
  );

  container.appendChild(hostChild);
  hostChild.appendChild(textChild);
  container.__mutationLog.length = 0;
  hostChild.__mutationLog.length = 0;
  componentTree.attachHostInstanceNode(hostChild, hostToken, {
    id: 'host-child'
  });
  componentTree.attachHostInstanceNode(textChild, textToken, null);

  assert.equal(container.childNodes.length, 1);
  assert.equal(componentTree.getHostInstanceTokenFromNode(hostChild), hostToken);
  assert.equal(componentTree.getHostInstanceTokenFromNode(textChild), textToken);
  assert.equal(rootMarkers.getContainerRoot(container), create.owner);
  assert.equal(listenerRegistry.hasListeningMarker(container), true);

  const unmount = bridge.unmountContainer(create.handle);
  const cleanup = bridge.cleanupUnmountHostOutput(admission, unmount);
  const hiddenCleanup =
    rootBridge.getPrivateRootUnmountHostOutputCleanupPayload(cleanup);

  assert.equal(
    rootBridge.cleanupPrivateRootUnmountHostOutput(admission, unmount),
    cleanup
  );
  assert.equal(bridge.cleanupUnmountHostOutput(admission, unmount), cleanup);
  assert.equal(Object.isFrozen(cleanup), true);
  assert.equal(
    cleanup.$$typeof,
    rootBridge.privateRootUnmountHostOutputCleanupRecordType
  );
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED
  );
  assert.equal(cleanup.cleanupId, 'unmount-cleanup:1');
  assert.equal(cleanup.sourceAdmissionId, 'unmount-admission:1');
  assert.equal(cleanup.sourceUnmountRequestId, unmount.requestId);
  assert.equal(cleanup.sideEffectId, sideEffects.sideEffectId);
  assert.deepEqual(cleanup.fakeDomCleanup, {
    clearContainerStatus: 'cleared',
    componentTreeDetachStatus: 'detached-host-instance-subtree',
    removedRootChildCount: 1,
    detachedHostInstanceCount: 2,
    detachRecordCount: 1
  });
  assert.equal(cleanup.clearContainerRecord.removedChildCount, 1);
  assert.equal(cleanup.componentTreeDetachRecords.length, 1);
  assert.equal(
    cleanup.componentTreeDetachRecords[0].detachedHostInstanceCount,
    2
  );
  assert.equal(
    cleanup.sideEffectCleanup.sideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assert.deepEqual(
    cleanup.acceptedCapabilities.map((capability) => capability.id),
    [
      'fake-dom-clear-container',
      'component-tree-metadata-detach',
      'root-marker-listener-revert'
    ]
  );
  assert.deepEqual(
    cleanup.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-unmount',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(cleanup.fakeDomMutation, true);
  assert.equal(cleanup.rootContainerChildrenCleared, true);
  assert.equal(cleanup.componentTreeMetadataDetached, true);
  assert.equal(cleanup.rootMarkerReverted, true);
  assert.equal(cleanup.rootListenersReverted, true);
  assert.equal(cleanup.publicRootUnmounted, false);
  assert.equal(cleanup.publicRootBehaviorChanged, false);
  assert.equal(cleanup.nativeExecution, false);
  assert.equal(cleanup.reconcilerExecution, false);
  assert.equal(cleanup.domMutation, true);
  assert.equal(cleanup.markerWrites, false);
  assert.equal(cleanup.listenerInstallation, false);
  assert.equal(cleanup.compatibilityClaimed, false);

  assert.equal(hiddenCleanup.admissionRecord, admission);
  assert.equal(hiddenCleanup.unmountRecord, unmount);
  assert.equal(hiddenCleanup.container, container);
  assert.equal(hiddenCleanup.clearContainerPayload.removedChildren[0], hostChild);
  assert.equal(hiddenCleanup.componentTreeDetachRecords.length, 1);
  assert.equal(
    rootBridge.isPrivateRootUnmountHostOutputCleanupRecord(cleanup),
    true
  );
  assert.equal(
    rootBridge.getPrivateRootUnmountHostOutputCleanupPayload({}),
    null
  );

  assert.deepEqual(container.childNodes, []);
  assert.equal(hostChild.parentNode, null);
  assert.equal(textChild.parentNode, hostChild);
  assert.equal(componentTree.getHostInstanceTokenFromNode(hostChild), null);
  assert.equal(componentTree.getHostInstanceTokenFromNode(textChild), null);
  assert.equal(componentTree.getLatestPropsFromNode(hostChild), null);
  assert.equal(componentTree.getLatestPropsFromHostInstanceToken(hostToken), null);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.deepEqual(container.__mutationLog, [
    {
      child: hostChild,
      type: 'removeChild'
    }
  ]);
  assert.equal(hostChild.__mutationLog.length, 0);

  assert.throws(() => bridge.cleanupUnmountHostOutput({}, unmount), {
    code: 'FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD'
  });
  assert.throws(
    () => otherBridge.cleanupUnmountHostOutput(admission, unmount),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );
});

test('private portal fake-DOM mount diagnostic appends one explicit HostComponent and HostText child', () => {
  const document = createDocument('private-portal-fake-dom-mount');
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
    portalCommitIdPrefix: 'portal-commit',
    portalMountIdPrefix: 'portal-mount'
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

  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const hiddenMount =
    rootBridge.getPrivateRootPortalFakeDomMountPayload(mount);
  const resourceBoundary =
    resourceFormGate.recordResourceFormPortalFakeDomMountBlockedRequest(
      mount
    );
  const hiddenResourceBoundary =
    resourceFormGate.getResourceFormPortalFakeDomMountBlockedRecordPayload(
      resourceBoundary
    );

  assert.equal(
    mount.$$typeof,
    rootBridge.privateRootPortalFakeDomMountRecordType
  );
  assert.equal(
    mount.kind,
    'FastReactDomPrivateRootPortalFakeDomMountDiagnosticRecord'
  );
  assert.equal(mount.operation, 'portal-fake-dom-mount-diagnostic');
  assert.equal(
    mount.mountStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED
  );
  assert.equal(
    mount.publicMountStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED
  );
  assert.equal(mount.mountDiagnosticId, 'portal-mount:1');
  assert.equal(mount.sourceCommitHandoffId, handoff.commitHandoffId);
  assert.equal(mount.sourceCommitStatus, handoff.commitStatus);
  assert.deepEqual(mount.hostFiberPath, [
    'HostRoot',
    'HostPortal',
    'HostComponent',
    'HostText'
  ]);
  assert.deepEqual(
    mount.acceptedCapabilities.map((capability) => capability.id),
    [
      'portal-explicit-host-component-mount',
      'portal-explicit-host-text-mount',
      'portal-component-tree-host-instance-map'
    ]
  );
  assert.deepEqual(
    mount.blockedCapabilities.map((capability) => capability.id),
    [
      'portal-public-container-mounting',
      'portal-child-reconciliation',
      'portal-container-replacement',
      'portal-prepare-mount-listeners',
      'portal-resource-side-effects',
      'native-execution',
      'reconciler-execution',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(mount.explicitChildSource, 'portal.children');
  assert.equal(mount.hostComponentType, 'span');
  assert.equal(mount.hostText, 'portal child');
  assert.deepEqual(mount.hostComponentInfo, {
    kind: 'object',
    nodeName: 'SPAN',
    nodeType: ELEMENT_NODE
  });
  assert.deepEqual(mount.hostTextInfo, {
    kind: 'object',
    nodeName: '#text',
    nodeType: TEXT_NODE
  });
  assert.equal(mount.portalContainerChildCountBefore, 0);
  assert.equal(mount.portalContainerChildCountAfter, 1);
  assert.equal(mount.hostComponentChildCountAfter, 1);
  assert.equal(mount.fakeDomCommitHandoff, true);
  assert.equal(mount.fakeDomCommitApplied, true);
  assert.equal(mount.fakeDomPortalMountDiagnostic, true);
  assert.equal(mount.explicitPortalHostChildMounted, true);
  assert.equal(mount.componentTreeMetadataAttached, true);
  assert.equal(mount.portalContainerChildrenReplaced, false);
  assert.equal(mount.portalChildReconciliation, false);
  assert.equal(mount.portalMounting, false);
  assert.equal(mount.publicPortalMounting, false);
  assert.equal(mount.preparePortalMount, false);
  assert.equal(mount.nativeExecution, false);
  assert.equal(mount.reconcilerExecution, false);
  assert.equal(mount.domMutation, true);
  assert.equal(mount.publicDomMutation, false);
  assert.equal(mount.listenerInstallation, false);
  assert.equal(mount.resourceSideEffects, false);
  assert.equal(mount.eventDispatch, false);
  assert.equal(mount.compatibilityClaimed, false);
  assert.equal(mount.listenerSideEffects.preparePortalMount, false);
  assert.equal(mount.listenerSideEffects.listenToAllSupportedEvents, false);
  assert.equal(mount.listenerSideEffects.listenerInstallation, false);
  assert.equal(mount.listenerSideEffects.hasPortalListeningMarker, false);
  assert.equal(
    mount.listenerSideEffects.ownerDocumentHasSelectionChangeMarker,
    true
  );

  assert.equal(hiddenMount.commitHandoffRecord, handoff);
  assert.equal(hiddenMount.explicitChild, portalChild);
  assert.equal(hiddenMount.hostComponentNode, portalContainer.firstChild);
  assert.equal(hiddenMount.hostTextNode, hiddenMount.hostComponentNode.firstChild);
  assert.equal(hiddenMount.hostComponentNode.parentNode, portalContainer);
  assert.equal(hiddenMount.hostTextNode.parentNode, hiddenMount.hostComponentNode);
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(
      hiddenMount.hostInstanceToken
    ),
    create.owner
  );
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(hiddenMount.hostTextToken),
    create.owner
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(hiddenMount.hostComponentNode),
    portalChild.props
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(hiddenMount.hostTextNode),
    null
  );
  assert.equal(hiddenMount.hostComponentNode.textContent, 'portal child');
  assert.equal(hiddenMount.hostTextNode.nodeValue, 'portal child');
  assert.equal(hiddenMount.portalContainer, portalContainer);
  assert.equal(hiddenMount.rootContainer, rootContainer);
  assert.equal(hiddenMount.sourceRecord, render);
  assert.equal(portalContainer.childNodes.length, 1);
  assert.equal(portalContainer.firstChild.nodeName, 'SPAN');
  assert.equal(portalContainer.textContent, 'portal child');
  assert.deepEqual(
    document.__mutationLog.map((entry) => entry.type),
    ['createElement', 'createTextNode']
  );
  assert.deepEqual(portalContainer.__mutationLog, [
    {
      child: hiddenMount.hostComponentNode,
      type: 'appendChild'
    }
  ]);
  assert.deepEqual(hiddenMount.hostComponentNode.__mutationLog, [
    {
      child: hiddenMount.hostTextNode,
      type: 'appendChild'
    }
  ]);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.equal(rootContainer.__mutationLog.length, 0);

  assert.equal(
    resourceBoundary.$$typeof,
    resourceFormGate.resourceFormPortalFakeDomMountBoundaryRecordType
  );
  assert.equal(
    resourceBoundary.kind,
    'FastReactDomResourceFormPortalFakeDomMountBoundaryRecord'
  );
  assert.equal(
    resourceBoundary.resourceSideEffectStatus,
    resourceFormGate.privatePortalFakeDomMountResourceBlockedStatus
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.fakeDomCommitApplied,
    true
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.publicDomMutation,
    false
  );
  assert.equal(resourceBoundary.rootBridgeBoundary.resourceSideEffects, false);
  assert.deepEqual(
    resourceBoundary.sideEffects,
    resourceFormGate.portalFakeDomMountResourceSideEffects
  );
  assert.equal(resourceBoundary.sideEffects.portalContainerMutated, true);
  assert.equal(resourceBoundary.sideEffects.resourcesDispatched, false);
  assert.equal(resourceBoundary.sideEffects.sourceAdaptersInvoked, false);
  assert.equal(resourceBoundary.sideEffects.portalListenersInstalled, false);
  assert.equal(
    resourceFormGate.isResourceFormPortalFakeDomMountBlockedRecord(
      resourceBoundary
    ),
    true
  );
  assert.equal(hiddenResourceBoundary.mountRecord, mount);

  assert.throws(() => bridge.createPortalFakeDomMountDiagnostic(handoff), {
    code: 'FAST_REACT_DOM_INVALID_PORTAL_FAKE_DOM_MOUNT_RECORD'
  });
  assert.throws(
    () =>
      bridge.createPortalFakeDomMountDiagnostic(handoff, {
        explicitChild: {
          props: {
            children: 'not the portal child'
          },
          type: 'span'
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_PORTAL_FAKE_DOM_MOUNT_RECORD'
    }
  );
  assert.throws(
    () =>
      otherBridge.createPortalFakeDomMountDiagnostic(handoff, {
        explicitChild: portalChild
      }),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.recordResourceFormPortalFakeDomMountBlockedRequest({
        ...mount,
        compatibilityClaimed: true
      }),
    {
      code: resourceFormGate.rootBoundaryInvalidPortalCommitHandoffCode
    }
  );

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
});

test('private portal event owner-root gate records portal child event path ownership only', () => {
  const document = createDocument('private-portal-event-owner-root');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalChild = {
    props: {
      children: 'portal child',
      onClick() {
        throw new Error('portal child listener should not run');
      }
    },
    type: 'span'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'portal-boundary',
    portalCommitIdPrefix: 'portal-commit',
    portalEventOwnerRootIdPrefix: 'portal-owner',
    portalMountIdPrefix: 'portal-mount'
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
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const ownerGate = bridge.createPortalEventOwnerRootGate(mount);
  const hiddenGate =
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload(ownerGate);
  const eventGate = hiddenGate.eventOwnerRootGateRecord;
  const eventGatePayload =
    pluginEventSystem.getPortalEventOwnerRootGateRecordPayload(eventGate);

  assert.equal(
    ownerGate.$$typeof,
    rootBridge.privateRootPortalEventOwnerRootGateRecordType
  );
  assert.equal(
    ownerGate.kind,
    'FastReactDomPrivateRootPortalEventOwnerRootGateRecord'
  );
  assert.equal(ownerGate.operation, 'portal-event-owner-root-gate');
  assert.equal(ownerGate.gateId, 'portal-owner:1');
  assert.equal(
    ownerGate.gateStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_RECORDED
  );
  assert.equal(
    ownerGate.eventBubblingStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_EVENT_BUBBLING_BLOCKED
  );
  assert.equal(ownerGate.sourceMountDiagnosticId, mount.mountDiagnosticId);
  assert.equal(ownerGate.sourceCommitHandoffId, handoff.commitHandoffId);
  assert.equal(ownerGate.sourceBoundaryId, boundary.boundaryId);
  assert.equal(ownerGate.portalKey, 'portal-key');
  assert.deepEqual(ownerGate.hostFiberPath, [
    'HostRoot',
    'HostPortal',
    'HostComponent'
  ]);
  assert.deepEqual(
    ownerGate.acceptedCapabilities.map((capability) => capability.id),
    [
      'portal-mounted-child-owner-root',
      'portal-event-target-dispatch-path',
      'portal-event-owner-root-diagnostic'
    ]
  );
  assert.deepEqual(
    ownerGate.blockedCapabilities.map((capability) => capability.id),
    [
      'public-portal-event-bubbling',
      'portal-event-dispatch',
      'portal-listener-installation',
      'browser-dom-compatibility',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'hydration',
      'compatibility-claims'
    ]
  );
  assert.deepEqual(ownerGate.ownerRootAttachment, {
    eventTargetRootOwnerMatchesPortalOwner: true,
    hostComponentRootOwnerMatchesPortalOwner: true,
    hostTextRootOwnerMatchesPortalOwner: true
  });
  assert.equal(ownerGate.targetDispatchPathLength, 1);
  assert.equal(
    ownerGate.targetDispatchPathStatus,
    'resolved-component-tree-dispatch-path'
  );
  assert.equal(ownerGate.dispatchPathRootOwnerMatchCount, 1);
  assert.equal(ownerGate.dispatchPathRootOwnerMismatchCount, 0);
  assert.equal(ownerGate.portalContainerContainsEventTarget, true);
  assert.equal(ownerGate.rootContainerContainsEventTarget, false);
  assert.equal(ownerGate.portalContainerIsRootContainer, false);
  assert.equal(ownerGate.portalOwnerRootAttached, true);
  assert.equal(ownerGate.portalEventPathDiagnostic, true);
  assert.equal(ownerGate.portalEventBubbling, false);
  assert.equal(ownerGate.publicPortalBubbling, false);
  assert.equal(ownerGate.eventDispatch, false);
  assert.equal(ownerGate.listenerInvocationCount, 0);
  assert.equal(ownerGate.syntheticEventCount, 0);
  assert.equal(ownerGate.browserDomEventCompatibilityClaimed, false);
  assert.equal(ownerGate.fakeDomEventCompatibilityClaimed, false);
  assert.equal(ownerGate.compatibilityClaimed, false);
  assert.equal(ownerGate.listenerSideEffects.listenerInstallation, false);
  assert.equal(ownerGate.listenerSideEffects.hasPortalListeningMarker, false);
  assert.deepEqual(ownerGate.eventOwnerRootGate, {
    blockedReason: pluginEventSystem.PORTAL_EVENT_BUBBLING_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    dispatchPathRootOwnerMatchCount: 1,
    dispatchPathRootOwnerMismatchCount: 0,
    eventDispatch: false,
    eventRecordKind:
      pluginEventSystem.PORTAL_EVENT_OWNER_ROOT_GATE_RECORD_KIND,
    eventRecordStatus:
      pluginEventSystem.PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS,
    listenerInvocationCount: 0,
    ownerRootMatchesTargetRoot: true,
    portalContainerContainsTarget: true,
    publicPortalBubblingEnabled: false,
    rootContainerContainsTarget: false,
    syntheticEventCount: 0,
    targetDispatchPathLength: 1,
    targetDispatchPathStatus: 'resolved-component-tree-dispatch-path',
    targetInstStatus: 'resolved-component-tree-host-instance'
  });

  assert.equal(
    rootBridge.isPrivateRootPortalEventOwnerRootGateRecord(ownerGate),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPortalEventOwnerRootGateRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload({}),
    null
  );
  assert.equal(hiddenGate.mountRecord, mount);
  assert.equal(hiddenGate.portal, portal);
  assert.equal(hiddenGate.portalContainer, portalContainer);
  assert.equal(hiddenGate.rootContainer, rootContainer);
  assert.equal(hiddenGate.rootHandle, create.handle);
  assert.equal(
    pluginEventSystem.isPortalEventOwnerRootGateRecord(eventGate),
    true
  );
  assert.equal(eventGatePayload.ownerRoot, create.owner);
  assert.equal(eventGatePayload.portalContainer, portalContainer);
  assert.equal(eventGatePayload.rootContainer, rootContainer);
  assert.equal(
    eventGatePayload.targetDispatchPathRecord,
    hiddenGate.targetDispatchPathRecord
  );
  assert.equal(
    hiddenGate.targetDispatchPathRecord.entries[0].rootOwner,
    create.owner
  );
  assert.equal(
    hiddenGate.targetDispatchPathRecord.entries[0].targetHostInstanceNode,
    hiddenGate.hostComponentNode
  );
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.equal(hiddenGate.hostComponentNode.__registrations.length, 0);

  assert.throws(() => bridge.createPortalEventOwnerRootGate({}), {
    code: 'FAST_REACT_DOM_INVALID_PORTAL_EVENT_OWNER_ROOT_GATE_RECORD'
  });
  assert.throws(() => otherBridge.createPortalEventOwnerRootGate(mount), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(portalContainer.__registrations.length, 0);
});

test('private portal child reconciliation diagnostic updates one mounted fake-DOM HostComponent', () => {
  const document = createDocument('private-portal-child-reconciliation');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalChild = {
    props: {
      children: 'portal child'
    },
    type: 'span'
  };
  const updatedPortalChild = {
    props: {
      children: 'updated portal child',
      'data-phase': 'updated',
      title: 'updated title'
    },
    type: 'span'
  };
  const replacementPortalChild = {
    props: {
      children: 'replacement portal child'
    },
    type: 'strong'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'portal-boundary',
    portalChildReconciliationIdPrefix: 'portal-child',
    portalCommitIdPrefix: 'portal-commit',
    portalMountIdPrefix: 'portal-mount'
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
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const hiddenMount =
    rootBridge.getPrivateRootPortalFakeDomMountPayload(mount);

  assert.throws(
    () =>
      bridge.createPortalChildReconciliationDiagnostic(mount, boundary, {
        explicitChild: portalChild
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_PORTAL_CHILD_RECONCILIATION_RECORD'
    }
  );
  assert.throws(
    () =>
      bridge.createPortalChildReconciliationDiagnostic(mount, boundary),
    {
      code: 'FAST_REACT_DOM_INVALID_PORTAL_CHILD_RECONCILIATION_RECORD'
    }
  );
  const replacementPortal = reactDom.createPortal(
    replacementPortalChild,
    portalContainer,
    'portal-key'
  );
  const replacementRender = bridge.renderContainer(
    create.handle,
    replacementPortal
  );
  const replacementBoundary =
    bridge.createPortalRootBoundary(replacementRender);
  assert.throws(
    () =>
      bridge.createPortalChildReconciliationDiagnostic(
        mount,
        replacementBoundary,
        {
          explicitChild: replacementPortalChild
        }
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_PORTAL_CHILD_RECONCILIATION_RECORD'
    }
  );

  const updatedPortal = reactDom.createPortal(
    updatedPortalChild,
    portalContainer,
    'portal-key'
  );
  const updateRender = bridge.renderContainer(create.handle, updatedPortal);
  const updateBoundary = bridge.createPortalRootBoundary(updateRender);
  assert.throws(
    () =>
      otherBridge.createPortalChildReconciliationDiagnostic(
        mount,
        updateBoundary,
        {
          explicitChild: updatedPortalChild
        }
      ),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );
  hiddenMount.hostComponentNode.attributeLog = [];
  hiddenMount.hostTextNode.writeLog = [];

  const diagnostic = bridge.createPortalChildReconciliationDiagnostic(
    mount,
    updateBoundary,
    {
      explicitChild: updatedPortalChild
    }
  );
  const hiddenDiagnostic =
    rootBridge.getPrivateRootPortalChildReconciliationDiagnosticPayload(
      diagnostic
    );

  assert.equal(
    diagnostic.$$typeof,
    rootBridge.privateRootPortalChildReconciliationDiagnosticRecordType
  );
  assert.equal(
    diagnostic.kind,
    'FastReactDomPrivateRootPortalChildReconciliationDiagnosticRecord'
  );
  assert.equal(diagnostic.operation, 'portal-child-reconciliation-diagnostic');
  assert.equal(diagnostic.diagnosticId, 'portal-child:1');
  assert.equal(
    diagnostic.reconciliationStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_ADMITTED
  );
  assert.equal(
    diagnostic.publicMountStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED
  );
  assert.equal(diagnostic.sourceMountDiagnosticId, mount.mountDiagnosticId);
  assert.equal(diagnostic.sourceBoundaryId, updateBoundary.boundaryId);
  assert.equal(diagnostic.sourceUpdateId, updateRender.updateId);
  assert.deepEqual(diagnostic.hostFiberPath, [
    'HostRoot',
    'HostPortal',
    'HostComponent',
    'HostText'
  ]);
  assert.equal(diagnostic.hostComponentType, 'span');
  assert.equal(diagnostic.previousHostText, 'portal child');
  assert.equal(diagnostic.nextHostText, 'updated portal child');
  assert.deepEqual(diagnostic.propertyMutation, {
    handoffKind: domHost.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF,
    latestPropsCommitRecordKind: domHost.LATEST_PROPS_COMMIT_RECORD,
    latestPropsCommitRecordStatus: 'safe-for-latest-props',
    mutationRecordCount: 3,
    payloadCount: 3,
    status: 'mutated'
  });
  assert.deepEqual(diagnostic.textMutation, {
    newTextLength: 20,
    oldTextLength: 12,
    status: 'mutated'
  });
  assert.equal(diagnostic.latestPropsPublished, true);
  assert.equal(
    diagnostic.latestPropsPublishOrder,
    'after-portal-property-and-text-mutation'
  );
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      'portal-accepted-boundary',
      'portal-fake-dom-host-component-update',
      'portal-fake-dom-host-text-update',
      'portal-latest-props-after-mutation'
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      'portal-public-container-mounting',
      'portal-generic-child-reconciliation',
      'portal-container-replacement',
      'portal-prepare-mount-listeners',
      'portal-resource-side-effects',
      'native-execution',
      'reconciler-execution',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(diagnostic.fakeDomCommitApplied, true);
  assert.equal(diagnostic.fakeDomPortalMountDiagnostic, true);
  assert.equal(diagnostic.portalChildReconciliation, true);
  assert.equal(diagnostic.singleHostComponentUpdate, true);
  assert.equal(diagnostic.portalHostComponentUpdated, true);
  assert.equal(diagnostic.portalHostTextUpdated, true);
  assert.equal(diagnostic.portalContainerChildrenReplaced, false);
  assert.equal(diagnostic.portalMounting, false);
  assert.equal(diagnostic.publicPortalMounting, false);
  assert.equal(diagnostic.preparePortalMount, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.domMutation, true);
  assert.equal(diagnostic.publicDomMutation, false);
  assert.equal(diagnostic.listenerInstallation, false);
  assert.equal(diagnostic.resourceSideEffects, false);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(diagnostic.listenerSideEffects.preparePortalMount, false);
  assert.equal(diagnostic.listenerSideEffects.listenerInstallation, false);
  assert.equal(diagnostic.listenerSideEffects.hasPortalListeningMarker, false);

  assert.equal(
    rootBridge.isPrivateRootPortalChildReconciliationDiagnosticRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPortalChildReconciliationDiagnosticRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPortalChildReconciliationDiagnosticPayload({}),
    null
  );
  assert.equal(hiddenDiagnostic.mountRecord, mount);
  assert.equal(hiddenDiagnostic.boundaryRecord, updateBoundary);
  assert.equal(hiddenDiagnostic.previousChild, portalChild);
  assert.equal(hiddenDiagnostic.nextChild, updatedPortalChild);
  assert.equal(hiddenDiagnostic.previousProps, portalChild.props);
  assert.equal(hiddenDiagnostic.nextProps, updatedPortalChild.props);
  assert.equal(hiddenDiagnostic.hostComponentNode, hiddenMount.hostComponentNode);
  assert.equal(hiddenDiagnostic.hostTextNode, hiddenMount.hostTextNode);
  assert.equal(hiddenDiagnostic.latestPropsBeforeCommit, portalChild.props);
  assert.equal(
    hiddenDiagnostic.latestPropsAfterCommit,
    updatedPortalChild.props
  );
  assert.deepEqual(hiddenDiagnostic.textUpdate, {
    newText: 'updated portal child',
    oldText: 'portal child'
  });

  assert.deepEqual(attributeEntries(hiddenMount.hostComponentNode), [
    ['data-phase', 'updated'],
    ['title', 'updated title']
  ]);
  assert.deepEqual(hiddenMount.hostComponentNode.attributeLog, [
    ['setAttribute', 'data-phase', 'updated'],
    ['setAttribute', 'title', 'updated title']
  ]);
  assert.deepEqual(hiddenMount.hostTextNode.writeLog, [
    ['nodeValue', 'updated portal child']
  ]);
  assert.equal(portalContainer.childNodes.length, 1);
  assert.equal(portalContainer.firstChild, hiddenMount.hostComponentNode);
  assert.equal(portalContainer.textContent, 'updated portal child');
  assert.equal(
    componentTree.getLatestPropsFromNode(hiddenMount.hostComponentNode),
    updatedPortalChild.props
  );
  assert.equal(rootContainer.__mutationLog.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);

  const serialized = JSON.stringify(diagnostic);
  assert.equal(serialized.includes('updated title'), false);
  assert.equal(serialized.includes('__registrations'), false);

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(portalContainer.__registrations.length, 0);
});

test('private root bridge ref ordering diagnostic wraps update and unmount canary evidence', () => {
  const document = createDocument('private-ref-ordering');
  const container = createElement('DIV', document);
  const hostNode = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const initialRender = bridge.renderContainer(create.handle, {
    props: {children: 'initial'},
    type: 'div'
  });
  const updateRender = bridge.renderContainer(create.handle, {
    props: {children: 'updated'},
    type: 'div'
  });
  const unmount = bridge.unmountContainer(create.handle);
  const rootOwner = rootBridge.getRootOwnerFromHandle(create.handle);
  const hostOwner = {kind: 'PrivateRootBridgeRefOrderingHost'};
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const calls = [];
  const firstRefHandle = {id: 'first-ref'};
  const secondRefHandle = {id: 'second-ref'};

  function firstCleanup() {
    calls.push('first:cleanup');
  }
  function secondCleanup() {
    calls.push('second:cleanup');
  }
  function firstRef(value) {
    calls.push(`first:attach:${value.localName}`);
    return firstCleanup;
  }
  function secondRef(value) {
    calls.push(`second:attach:${value.localName}`);
    return secondCleanup;
  }

  componentTree.attachHostInstanceNode(hostNode, token, {ref: firstRef});
  const initialAttach = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'initial-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: firstRefHandle,
    ref: firstRef,
    sourceToken: 'commit:first'
  });

  const updatedProps = {ref: secondRef};
  const updateDetach = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'update-current-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: firstRefHandle,
    ref: firstRef,
    expectedLatestRef: secondRef,
    sourceToken: 'deletion:first',
    detachReason: refCallbackGate.REF_DETACH_REASON_REF_CHANGED
  });
  const updateAttach = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'update-finished-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: secondRefHandle,
    ref: secondRef,
    sourceToken: 'commit:second'
  });
  const unmountDetach = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'unmount-current-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: secondRefHandle,
    ref: secondRef,
    sourceToken: 'deletion:second',
    detachReason: refCallbackGate.REF_DETACH_REASON_DELETED
  });
  const initialMetadata = bridge.admitRootCommitRefMetadata(
    initialRender,
    {detach: [], attach: [initialAttach]},
    {label: 'initial-ref-attach'}
  );
  const updateMetadata = bridge.admitRootCommitRefMetadata(
    updateRender,
    {
      detach: [updateDetach],
      attach: [updateAttach]
    },
    {label: 'update-ref-change'}
  );
  const unmountMetadata = bridge.admitRootCommitRefMetadata(
    unmount,
    {detach: [unmountDetach], attach: []},
    {label: 'unmount-ref-cleanup'}
  );

  assert.equal(
    initialMetadata.$$typeof,
    rootBridge.privateRootCommitRefMetadataRecordType
  );
  assert.equal(
    initialMetadata.metadataStatus,
    rootBridge.ROOT_BRIDGE_ROOT_COMMIT_REF_METADATA_ACCEPTED
  );
  assert.equal(initialMetadata.hostOutputCanary, 'initial-host-output');
  assert.equal(initialMetadata.attachCount, 1);
  assert.equal(initialMetadata.detachCount, 0);
  assert.equal(initialMetadata.callbackRefsInvoked, false);
  assert.equal(initialMetadata.objectRefsMutated, false);
  assert.equal(initialMetadata.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootCommitRefMetadataRecord(initialMetadata),
    true
  );
  assert.equal(
    rootBridge.getPrivateRootCommitRefMetadataPayload(
      initialMetadata
    ).sourceRecord,
    initialRender
  );
  assert.equal(
    rootBridge.getPrivateRootCommitRefMetadataPayload(
      initialMetadata
    ).rootCommitRefMetadataSnapshot.status,
    refCallbackGate.REF_CALLBACK_ROOT_COMMIT_METADATA_SNAPSHOT_STATUS
  );

  const diagnostic =
    rootBridge.createRefCallbackHostOutputOrderingDiagnosticRecord(
      [create, initialRender, updateRender, unmount],
      {
        steps: [
          {
            hostOutputCanary: 'initial-host-output'
          },
          {
            hostOutputCanary: 'update-host-output',
            latestPropsUpdates: [
              {
                hostInstanceToken: token,
                latestProps: updatedProps
              }
            ]
          },
          {
            hostOutputCanary: 'unmount-host-output'
          }
        ]
      }
    );

  assert.equal(
    rootBridge.isPrivateRootRefCallbackHostOutputOrderingDiagnosticRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_ADMITTED
  );
  assert.equal(diagnostic.updateRenderRequestCount, 1);
  assert.equal(diagnostic.unmountRequestCount, 1);
  assert.equal(diagnostic.updateBeforeUnmount, true);
  assert.equal(
    diagnostic.rootCommitRefMetadataSource,
    'accepted-root-commit-ref-metadata'
  );
  assert.equal(diagnostic.acceptedRootCommitRefMetadataCount, 3);
  assert.equal(diagnostic.refOrderingRecordCount, 4);
  assert.equal(diagnostic.callbackIdentityChangedCount, 1);
  assert.equal(diagnostic.callbackCleanupReturnHandleCount, 2);
  assert.equal(diagnostic.cleanupReturnMatchedCount, 2);
  assert.equal(diagnostic.cleanupInvocationAttemptCount, 2);
  assert.equal(diagnostic.cleanupReturnHandleConsumedCount, 2);
  assert.equal(diagnostic.callbackNullDetachAttemptCount, 0);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.domMutation, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.deepEqual(calls, [
    'first:attach:div',
    'first:cleanup',
    'second:attach:div',
    'second:cleanup'
  ]);
  assert.equal(container.__mutationLog.length, 0);

  const payload =
    rootBridge.getPrivateRootRefCallbackHostOutputOrderingDiagnosticPayload(
      diagnostic
    );
  assert.equal(payload.rootRequestRecords[2], updateRender);
  assert.equal(payload.rootRequestRecords[3], unmount);
  assert.deepEqual(payload.acceptedRootCommitRefMetadataRecords, [
    initialMetadata,
    updateMetadata,
    unmountMetadata
  ]);
  assert.equal(payload.refOrderingSnapshot, diagnostic.refOrderingSnapshot);
  assert.deepEqual(
    diagnostic.refOrderingSnapshot.records.map((record) => [
      record.action,
      record.hostOutputCanary,
      record.callbackIdentityStatus,
      record.cleanupReturnMatchesPreviousAttach,
      record.cleanupReturnHandleMatchesPreviousAttach
    ]),
    [
      ['attach', 'initial-host-output', 'new-active-ref', null, null],
      ['detach', 'update-host-output', 'matches-active-ref', true, true],
      ['attach', 'update-host-output', 'changed-from-detached-ref', null, null],
      ['detach', 'unmount-host-output', 'matches-active-ref', true, true]
    ]
  );

  assert.throws(
    () =>
      rootBridge.createRefCallbackHostOutputOrderingDiagnosticRecord(
        [create, initialRender, unmount],
        {
          steps: [
            {
              hostOutputCanary: 'unmount-host-output',
              rootCommitRefMetadata: {detach: [unmountDetach], attach: []}
            }
          ]
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC'
    }
  );

  assert.equal(componentTree.detachHostInstanceToken(token), token);
  assertBridgeDidNotTouchContainer(container, document);
});

test('private root bridge ref callback error routing records metadata without public root callbacks', () => {
  const document = createDocument('private-ref-error-routing');
  const container = createElement('DIV', document);
  const attachNode = createElement('DIV', document);
  const cleanupNode = createElement('SPAN', document);
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const publicRootErrorCalls = [];
  function onUncaughtError(error) {
    publicRootErrorCalls.push(['uncaught', error.message]);
  }
  function onCaughtError(error) {
    publicRootErrorCalls.push(['caught', error.message]);
  }
  function onRecoverableError(error) {
    publicRootErrorCalls.push(['recoverable', error.message]);
  }

  const create = bridge.createClientRoot(container, {
    onCaughtError,
    onRecoverableError,
    onUncaughtError
  });
  const render = bridge.renderContainer(create.handle, {
    props: {children: 'private error route'},
    type: 'div'
  });
  const unmount = bridge.unmountContainer(create.handle);
  const rootOwner = rootBridge.getRootOwnerFromHandle(create.handle);
  const attachHostOwner = {kind: 'PrivateRootBridgeRefErrorAttachHost'};
  const cleanupHostOwner = {kind: 'PrivateRootBridgeRefErrorCleanupHost'};
  const attachToken = componentTree.createHostInstanceToken(
    attachHostOwner,
    rootOwner
  );
  const cleanupToken = componentTree.createHostInstanceToken(
    cleanupHostOwner,
    rootOwner
  );
  const attachError = new Error('bridge attach route error');
  attachError.code = 'BRIDGE_ATTACH_ROUTE';
  const cleanupError = new TypeError('bridge cleanup route error');

  function throwingAttachRef() {
    throw attachError;
  }

  function cleanupRef() {}

  function throwingCleanup() {
    throw cleanupError;
  }

  componentTree.attachHostInstanceNode(attachNode, attachToken, {
    ref: throwingAttachRef
  });
  componentTree.attachHostInstanceNode(cleanupNode, cleanupToken, {
    ref: cleanupRef
  });

  const attachMetadata = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner: attachHostOwner,
    hostInstanceToken: attachToken,
    fiber: {id: 'bridge-attach-error-fiber'},
    stateNode: {id: 'bridge-attach-state-node'},
    refHandle: {id: 'bridge-throwing-attach-ref'},
    ref: throwingAttachRef,
    sourceToken: 'commit:bridge-attach-error'
  });
  const cleanupMetadata = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner: cleanupHostOwner,
    hostInstanceToken: cleanupToken,
    fiber: {id: 'bridge-cleanup-error-fiber'},
    stateNode: {id: 'bridge-cleanup-state-node'},
    refHandle: {id: 'bridge-cleanup-ref'},
    ref: cleanupRef,
    refCleanup: throwingCleanup,
    sourceToken: 'deletion:bridge-cleanup-error',
    detachReason: refCallbackGate.REF_DETACH_REASON_DELETED
  });
  const renderMetadata = bridge.admitRootCommitRefMetadata(
    render,
    {detach: [], attach: [attachMetadata]},
    {label: 'bridge-attach-error'}
  );
  const unmountMetadata = bridge.admitRootCommitRefMetadata(
    unmount,
    {detach: [cleanupMetadata], attach: []},
    {label: 'bridge-cleanup-error'}
  );

  const routing = bridge.createRefCallbackRootErrorRouting(
    [create, render, unmount],
    {
      steps: [
        {label: 'bridge-attach-error-route'},
        {label: 'bridge-cleanup-error-route'}
      ]
    }
  );

  assert.equal(
    rootBridge.isPrivateRootRefCallbackErrorRoutingRecord(routing),
    true
  );
  assert.equal(
    routing.$$typeof,
    rootBridge.privateRootRefCallbackErrorRoutingRecordType
  );
  assert.equal(
    routing.routingStatus,
    rootBridge.ROOT_BRIDGE_REF_CALLBACK_ERROR_ROUTING_RECORDED
  );
  assert.equal(
    routing.rootCommitRefMetadataSource,
    'accepted-root-commit-ref-metadata'
  );
  assert.equal(routing.acceptedRootCommitRefMetadataCount, 2);
  assert.equal(routing.rootErrorRoutingRecordCount, 2);
  assert.equal(routing.callbackAttachErrorCount, 1);
  assert.equal(routing.cleanupReturnErrorCount, 1);
  assert.equal(routing.rootErrorChannel, 'onUncaughtError');
  assert.equal(routing.onUncaughtErrorConfigured, true);
  assert.equal(routing.onCaughtErrorConfigured, true);
  assert.equal(routing.onRecoverableErrorConfigured, true);
  assert.equal(routing.rootErrorUpdatesScheduled, false);
  assert.equal(routing.publicRootErrorCallbacksInvoked, false);
  assert.equal(routing.rootErrorCallbackInvocationCount, 0);
  assert.equal(routing.rootErrorsReported, false);
  assert.equal(routing.publicRootExecution, false);
  assert.equal(routing.reconcilerExecution, false);
  assert.equal(routing.compatibilityClaimed, false);
  assert.deepEqual(publicRootErrorCalls, []);
  assert.deepEqual(
    routing.rootErrorRoutingSnapshot.records.map((record) => [
      record.sourceStepLabel,
      record.sourceHostOutputCanary,
      record.errorName,
      record.errorMessage,
      record.errorCode,
      record.publicRootErrorCallbackInvoked
    ]),
    [
      [
        'bridge-attach-error-route',
        'initial-host-output',
        'Error',
        'bridge attach route error',
        'BRIDGE_ATTACH_ROUTE',
        false
      ],
      [
        'bridge-cleanup-error-route',
        'unmount-host-output',
        'TypeError',
        'bridge cleanup route error',
        null,
        false
      ]
    ]
  );

  const payload =
    rootBridge.getPrivateRootRefCallbackErrorRoutingPayload(routing);
  assert.deepEqual(payload.acceptedRootCommitRefMetadataRecords, [
    renderMetadata,
    unmountMetadata
  ]);
  assert.equal(payload.rootOptions.onUncaughtError, onUncaughtError);
  assert.equal(payload.rootOptions.onCaughtError, onCaughtError);
  assert.equal(payload.rootOptions.onRecoverableError, onRecoverableError);
  assert.equal(
    payload.rootErrorRoutingPayload.records[0].error,
    attachError
  );
  assert.equal(
    payload.rootErrorRoutingPayload.records[1].error,
    cleanupError
  );
  assert.equal(Object.hasOwn(routing, 'error'), false);
  assert.equal(Object.hasOwn(routing, 'ref'), false);

  assert.equal(componentTree.detachHostInstanceToken(attachToken), attachToken);
  assert.equal(
    componentTree.detachHostInstanceToken(cleanupToken),
    cleanupToken
  );
  assertBridgeDidNotTouchContainer(container, document);
});

test('private react-dom/client facade adapter routes root calls to bridge records', () => {
  const document = createDocument('private-client-facade-adapter');
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'private facade child'
    },
    type: 'span'
  };
  const callback = function afterPrivateFacadeRender() {};
  const unmountCallback = function afterPrivateFacadeUnmount() {};
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );

  assert.equal(Object.hasOwn(reactDomClient, 'rootPublicFacadeAdapter'), false);
  assert.equal(
    Object.hasOwn(
      reactDomClient,
      '__FAST_REACT_PRIVATE_ROOT_PUBLIC_FACADE_ADAPTER__'
    ),
    false
  );
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.value, rootBridge.createPrivateRootPublicFacadeAdapter);
  assert.equal(
    Object.getOwnPropertyDescriptor(
      reactDomClient.hydrateRoot,
      rootBridge.privateRootPublicFacadeAdapterSymbol
    ),
    undefined
  );

  const adapter = descriptor.value({
    requestIdPrefix: 'facade-request',
    rootIdPrefix: 'facade-root',
    updateIdPrefix: 'facade-update'
  });
  assert.equal(
    adapter.$$typeof,
    rootBridge.privateRootPublicFacadeAdapterType
  );
  assert.equal(adapter.kind, 'FastReactDomPrivateRootPublicFacadeAdapter');
  assert.equal(adapter.entrypoint, 'react-dom/client');
  assert.equal(
    adapter.adapterStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY
  );
  assert.equal(adapter.recordOnlyBridge, true);
  assert.equal(adapter.publicCreateRootEnabled, false);
  assert.equal(adapter.publicHydrateRootEnabled, false);
  assert.equal(adapter.nativeExecution, false);
  assert.equal(adapter.reconcilerExecution, false);
  assert.equal(adapter.domMutation, false);
  assert.equal(adapter.compatibilityClaimed, false);
  assert.equal(adapter.createRoot.length, 2);
  assert.equal(rootBridge.isPrivateRootPublicFacadeAdapter(adapter), true);
  assert.equal(rootBridge.isPrivateRootPublicFacadeAdapter({}), false);
  assert.equal(Object.isFrozen(adapter), true);

  const root = adapter.createRoot(container, {
    identifierPrefix: 'private-facade-'
  });
  const create = adapter.getRootCreateRecord(root);
  const initialPayload = rootBridge.getPrivateRootPublicFacadeRootPayload(root);

  assert.equal(Object.isFrozen(root), true);
  assert.deepEqual(Object.keys(root), ['render', 'unmount']);
  assert.equal(root.render.length, 1);
  assert.equal(root.unmount.length, 0);
  assert.equal(rootBridge.isPrivateRootPublicFacadeRoot(root), true);
  assert.equal(rootBridge.isPrivateRootPublicFacadeRoot({}), false);
  assert.equal(create.$$typeof, rootBridge.privateRootCreateRecordType);
  assert.equal(create.requestId, 'facade-request:1');
  assert.equal(create.rootId, 'facade-root:1');
  assert.equal(create.requestType, 'createRoot');
  assert.equal(create.nativeExecution, false);
  assert.equal(create.domMutation, false);
  assert.equal(create.markerWrites, false);
  assert.equal(create.listenerInstallation, false);
  assert.equal(create.compatibilityClaimed, false);
  assert.equal(initialPayload.root, root);
  assert.equal(
    initialPayload.rootType,
    rootBridge.privateRootPublicFacadeRootType
  );
  assert.equal(initialPayload.createRecord, create);
  assert.equal(initialPayload.requestRecords.length, 1);
  assert.equal(Object.isFrozen(initialPayload.requestRecords), true);
  assertBridgeDidNotTouchContainer(container, document);

  const render = root.render(element, callback);
  const renderPayload = rootBridge.getPrivateRootRecordPayload(render);
  assert.equal(render.$$typeof, rootBridge.privateRootUpdateRecordType);
  assert.equal(render.requestType, 'root.render');
  assert.equal(render.updateId, 'facade-update:1');
  assert.equal(render.lifecycleStatusBefore, rootBridge.ROOT_LIFECYCLE_CREATED);
  assert.equal(render.lifecycleStatusAfter, rootBridge.ROOT_LIFECYCLE_RENDERED);
  assert.equal(renderPayload.element, element);
  assert.equal(renderPayload.callback, callback);

  const unmount = root.unmount(unmountCallback);
  const unmountPayload = rootBridge.getPrivateRootRecordPayload(unmount);
  assert.equal(unmount.requestType, 'root.unmount');
  assert.equal(unmount.updateId, 'facade-update:2');
  assert.equal(
    unmount.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    unmount.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(unmount.sync, true);
  assert.equal(unmount.noOp, false);
  assert.equal(unmountPayload.callback, unmountCallback);

  const secondUnmount = root.unmount();
  assert.equal(secondUnmount.requestType, 'root.unmount');
  assert.equal(secondUnmount.noOp, true);
  assert.equal(secondUnmount.sync, false);
  assert.throws(() => root.render(element), {
    code: 'FAST_REACT_DOM_UNMOUNTED_ROOT'
  });

  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    render,
    unmount,
    secondUnmount
  ]);
  assert.deepEqual(adapter.getRootPayload(root).renderRecords, [render]);
  assert.deepEqual(adapter.getRootPayload(root).unmountRecords, [
    unmount,
    secondUnmount
  ]);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeAdapterPayload(adapter).rootCount,
    1
  );
  assert.equal(rootBridge.getPrivateRootPublicFacadeRootPayload({}), null);
  assert.equal(rootBridge.getPrivateRootPublicFacadeAdapterPayload({}), null);

  const otherAdapter = descriptor.value();
  assert.throws(() => otherAdapter.getRootCreateRecord(root), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => adapter.getRootCreateRecord({}), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_ADAPTER'
  });
  assertBridgeDidNotTouchContainer(container, document);
});

test('private react-dom/client facade preflight routes root calls to accepted bridge diagnostics', () => {
  const document = createDocument('private-client-facade-preflight');
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'private preflight child'
    },
    type: 'span'
  };
  const callback = function afterPrivatePreflightRender() {};
  const unmountCallback = function afterPrivatePreflightUnmount() {};
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadePreflightSymbol
  );

  assert.equal(Object.hasOwn(reactDomClient, 'rootPublicFacadePreflight'), false);
  assert.equal(
    Object.hasOwn(
      reactDomClient,
      '__FAST_REACT_PRIVATE_ROOT_PUBLIC_FACADE_PREFLIGHT__'
    ),
    false
  );
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.value, rootBridge.createPrivateRootPublicFacadePreflight);
  assert.equal(
    Object.getOwnPropertyDescriptor(
      reactDomClient.hydrateRoot,
      rootBridge.privateRootPublicFacadePreflightSymbol
    ),
    undefined
  );

  const preflight = descriptor.value({
    nativeEnvironmentId: 427,
    nativeHandoffIdPrefix: 'preflight-native',
    publicFacadePreflightIdPrefix: 'preflight',
    requestIdPrefix: 'preflight-request',
    rootIdPrefix: 'preflight-root',
    updateIdPrefix: 'preflight-update'
  });
  assert.equal(
    preflight.$$typeof,
    rootBridge.privateRootPublicFacadePreflightType
  );
  assert.equal(preflight.kind, 'FastReactDomPrivateRootPublicFacadePreflight');
  assert.equal(preflight.entrypoint, 'react-dom/client');
  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_READY
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicHydrateRootEnabled, false);
  assert.equal(preflight.acceptedPrivateBridgeDiagnostics, true);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.reconcilerExecution, false);
  assert.equal(preflight.domMutation, false);
  assert.equal(preflight.markerWrites, false);
  assert.equal(preflight.listenerInstallation, false);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(preflight.createRoot.length, 2);
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflight(preflight), true);
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflight({}), false);
  assert.equal(Object.isFrozen(preflight), true);

  const root = preflight.createRoot(container, {
    identifierPrefix: 'private-preflight-'
  });
  const createPreflight = preflight.getRootCreatePreflight(root);
  const createPayload =
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(
      createPreflight
    );
  const rootPayload =
    rootBridge.getPrivateRootPublicFacadePreflightRootPayload(root);

  assert.equal(Object.isFrozen(root), true);
  assert.deepEqual(Object.keys(root), ['render', 'unmount']);
  assert.equal(root.render.length, 1);
  assert.equal(root.unmount.length, 0);
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflightRoot(root), true);
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflightRoot({}), false);
  assert.equal(
    rootPayload.rootType,
    rootBridge.privateRootPublicFacadePreflightRootType
  );
  assert.equal(rootPayload.root, root);
  assert.equal(rootPayload.createPreflight, createPreflight);
  assert.deepEqual(rootPayload.preflightRecords, [createPreflight]);
  assert.equal(Object.isFrozen(rootPayload.preflightRecords), true);

  assertPrivatePublicFacadePreflightRecord(createPreflight, {
    facadeCall: 'createRoot',
    nativeHandoffId: 'preflight-native:1',
    operation: 'create',
    preflightId: 'preflight:1',
    requestId: 'preflight-request:1',
    requestType: 'createRoot'
  });
  assert.equal(createPreflight.rootId, 'preflight-root:1');
  assert.equal(createPayload.requestRecord, rootPayload.createRecord);
  assert.equal(createPayload.requestAdmission, createPreflight.requestAdmission);
  assert.equal(createPayload.nativeHandoffRecord, createPreflight.nativeHandoffRecord);
  assert.equal(createPayload.root, root);
  assertBridgeDidNotTouchContainer(container, document);

  const renderPreflight = root.render(element, callback);
  const renderPayload =
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(
      renderPreflight
    );
  assertPrivatePublicFacadePreflightRecord(renderPreflight, {
    facadeCall: 'root.render',
    nativeHandoffId: 'preflight-native:2',
    operation: 'render',
    preflightId: 'preflight:2',
    requestId: 'preflight-request:2',
    requestType: 'root.render'
  });
  assert.equal(renderPreflight.updateId, 'preflight-update:1');
  assert.equal(
    renderPreflight.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_CREATED
  );
  assert.equal(
    renderPreflight.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(renderPayload.requestRecord.updateId, 'preflight-update:1');
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(renderPayload.requestRecord).element,
    element
  );
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(renderPayload.requestRecord).callback,
    callback
  );

  const unmountPreflight = root.unmount(unmountCallback);
  const unmountPayload =
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(
      unmountPreflight
    );
  assertPrivatePublicFacadePreflightRecord(unmountPreflight, {
    facadeCall: 'root.unmount',
    nativeHandoffId: 'preflight-native:3',
    operation: 'unmount',
    preflightId: 'preflight:3',
    requestId: 'preflight-request:3',
    requestType: 'root.unmount'
  });
  assert.equal(unmountPreflight.updateId, 'preflight-update:2');
  assert.equal(unmountPreflight.noOp, false);
  assert.equal(unmountPreflight.sync, true);
  assert.equal(
    unmountPreflight.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    unmountPreflight.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(unmountPayload.requestRecord).callback,
    unmountCallback
  );

  const secondUnmountPreflight = root.unmount();
  assertPrivatePublicFacadePreflightRecord(secondUnmountPreflight, {
    facadeCall: 'root.unmount',
    nativeHandoffId: 'preflight-native:4',
    operation: 'unmount',
    preflightId: 'preflight:4',
    requestId: 'preflight-request:4',
    requestType: 'root.unmount'
  });
  assert.equal(secondUnmountPreflight.noOp, true);
  assert.equal(secondUnmountPreflight.sync, false);
  assert.throws(() => root.render(element), {
    code: 'FAST_REACT_DOM_UNMOUNTED_ROOT'
  });

  assert.deepEqual(preflight.getRootPreflightRecords(root), [
    createPreflight,
    renderPreflight,
    unmountPreflight,
    secondUnmountPreflight
  ]);
  assert.deepEqual(preflight.getRootRequestRecords(root), [
    rootPayload.createRecord,
    renderPayload.requestRecord,
    unmountPayload.requestRecord,
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(
      secondUnmountPreflight
    ).requestRecord
  ]);
  assert.deepEqual(preflight.getRootPayload(root).renderPreflights, [
    renderPreflight
  ]);
  assert.deepEqual(preflight.getRootPayload(root).unmountPreflights, [
    unmountPreflight,
    secondUnmountPreflight
  ]);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightPayload(preflight)
      .preflightRecordCount,
    4
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightPayload(preflight).rootCount,
    1
  );
  assert.equal(rootBridge.getPrivateRootPublicFacadePreflightPayload({}), null);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload({}),
    null
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightRootPayload({}),
    null
  );

  const otherPreflight = descriptor.value();
  assert.throws(() => otherPreflight.getRootCreatePreflight(root), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => preflight.getRootCreatePreflight({}), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
  });
  assertBridgeDidNotTouchContainer(container, document);
});

test('private react-dom/client facade preflights root marker/listener setup and cleanup', () => {
  const document = createDocument('private-client-facade-preflight');
  const container = createElement('DIV', document);
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    publicFacadePreflightIdPrefix: 'facade-preflight',
    requestIdPrefix: 'facade-preflight-request',
    rootIdPrefix: 'facade-preflight-root',
    sideEffectIdPrefix: 'facade-preflight-side-effect'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);

  assertBridgeDidNotTouchContainer(container, document);

  const preflight = adapter.preflightRootMarkerListenerSetupAndCleanup(root);
  const hidden =
    rootBridge.getPrivateRootPublicFacadeMarkerListenerPreflightPayload(
      preflight
    );

  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(
    preflight.$$typeof,
    rootBridge.privateRootPublicFacadeMarkerListenerPreflightRecordType
  );
  assert.equal(
    preflight.kind,
    'FastReactDomPrivateRootPublicFacadeMarkerListenerPreflightRecord'
  );
  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED
  );
  assert.equal(preflight.preflightId, 'facade-preflight:1');
  assert.equal(preflight.rootId, create.rootId);
  assert.equal(preflight.createRequestId, create.requestId);
  assert.equal(
    preflight.sideEffectId,
    'facade-preflight-side-effect:1'
  );
  assert.equal(
    preflight.setupSideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED
  );
  assert.equal(
    preflight.cleanupSideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assert.equal(
    preflight.markerRecordType,
    rootMarkers.privateRootMarkerMutationRecordType
  );
  assert.equal(preflight.markerStatus, rootMarkers.ROOT_MARKER_APPLIED);
  assert.equal(preflight.markerCleanupStatus, rootMarkers.ROOT_MARKER_REVERTED);
  assert.equal(
    preflight.listenerRegistrationType,
    rootListeners.privateRootListenerRegistrationRecordType
  );
  assert.equal(
    preflight.listenerRegistrationStatus,
    rootListeners.ROOT_LISTENERS_REGISTERED
  );
  assert.equal(
    preflight.listenerCleanupType,
    rootListeners.privateRootListenerCleanupRecordType
  );
  assert.equal(
    preflight.listenerCleanupStatus,
    rootListeners.ROOT_LISTENERS_REVERTED
  );
  assert.deepEqual(
    preflight.acceptedCapabilities.map((capability) => capability.id),
    [
      'public-facade-create-root-record',
      'root-marker-setup-cleanup',
      'root-listener-setup-cleanup'
    ]
  );
  assert.deepEqual(
    preflight.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.deepEqual(preflight.setupPrerequisites, {
    accepted: true,
    markerStatus: rootMarkers.ROOT_MARKER_APPLIED,
    listenerRegistrationStatus: rootListeners.ROOT_LISTENERS_REGISTERED,
    rootMarkerMatchesOwner: true,
    rootListeningMarkerPresent: true,
    ownerDocumentListeningMarkerPresent: true,
    listenerRegistrationCount: 139,
    rootRegistrationCount: 138,
    ownerDocumentRegistrationCount: 1
  });
  assert.deepEqual(preflight.cleanupPrerequisites, {
    accepted: true,
    markerCleanupStatus: rootMarkers.ROOT_MARKER_REVERTED,
    listenerCleanupStatus: rootListeners.ROOT_LISTENERS_REVERTED,
    listenerRemovalCount: 139,
    listenerSetKeyRemovalCount: 139,
    restoredTargetCount: 2,
    restoredInitialMarkerState: true,
    finalRootListeningMarkerPresent: false,
    finalOwnerDocumentListeningMarkerPresent: false
  });
  assert.equal(preflight.beforeState.containerMarker.propertyCount, 0);
  assert.equal(preflight.setupState.containerMarker.truthyCount, 1);
  assert.equal(preflight.setupState.rootListenerRegistrationCount, 138);
  assert.equal(
    preflight.setupState.ownerDocumentListenerRegistrationCount,
    1
  );
  assert.equal(preflight.afterState.containerMarker.propertyCount, 0);
  assert.equal(preflight.afterState.rootListenerRegistrationCount, 0);
  assert.equal(
    preflight.afterState.ownerDocumentListenerRegistrationCount,
    0
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicRootCreated, false);
  assert.equal(preflight.publicRootExecution, false);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.reconcilerExecution, false);
  assert.equal(preflight.rootScheduled, false);
  assert.equal(preflight.domMutation, false);
  assert.equal(preflight.markerWrites, false);
  assert.equal(preflight.listenerInstallation, false);
  assert.equal(preflight.setupMarkerWrites, true);
  assert.equal(preflight.setupListenerInstallation, true);
  assert.equal(preflight.cleanupCompleted, true);
  assert.equal(preflight.hydration, false);
  assert.equal(preflight.eventDispatch, false);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(preflight.reversible, false);

  assert.equal(
    rootBridge.isPrivateRootPublicFacadeMarkerListenerPreflightRecord(
      preflight
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeMarkerListenerPreflightRecord({}),
    false
  );
  assert.equal(hidden.adapter, adapter);
  assert.equal(hidden.root, root);
  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.container, container);
  assert.equal(hidden.ownerDocument, document);
  assert.equal(
    hidden.sideEffectRecord.markerRecord.markerStatus,
    rootMarkers.ROOT_MARKER_APPLIED
  );
  assert.equal(
    hidden.cleanupRecord.listenerCleanup.listenerRemovalCount,
    139
  );
  assert.deepEqual(adapter.getRootMarkerListenerPreflightRecords(root), [
    preflight
  ]);
  assert.deepEqual(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .markerListenerPreflightRecords,
    [preflight]
  );
  assert.equal(
    rootBridge.preflightPrivateRootPublicFacadeMarkerListenerSetup(root)
      .preflightId,
    'facade-preflight:2'
  );

  const serialized = JSON.stringify(preflight);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__FAST_REACT_DOM_EVENT_TARGET__'), false);
  assertBridgeDidNotTouchContainer(container, document);
});

test('private react-dom/client facade marker/listener preflight fails closed', () => {
  const document = createDocument('private-client-facade-preflight-invalid');
  const container = createElement('DIV', document);
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value();
  const otherAdapter = descriptor.value();
  const root = adapter.createRoot(container);

  assert.throws(
    () => otherAdapter.preflightRootMarkerListenerSetupAndCleanup(root),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );
  assert.throws(
    () => adapter.preflightRootMarkerListenerSetupAndCleanup({}),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_ADAPTER'
    }
  );

  const occupiedDocument = createDocument('private-client-facade-occupied');
  const occupiedContainer = createElement('DIV', occupiedDocument);
  rootMarkers.markContainerAsRoot(
    rootBridge.createPrivateRootOwner('occupied-public-facade-root:1'),
    occupiedContainer
  );
  const occupiedRoot = adapter.createRoot(occupiedContainer);
  assert.throws(
    () => adapter.preflightRootMarkerListenerSetupAndCleanup(occupiedRoot),
    {
      code: 'FAST_REACT_DOM_ROOT_MARKER_OCCUPIED'
    }
  );
  assert.equal(occupiedContainer.__registrations.length, 0);
  assert.equal(occupiedDocument.__registrations.length, 0);

  const unmountedDocument = createDocument('private-client-facade-unmounted');
  const unmountedContainer = createElement('DIV', unmountedDocument);
  const unmountedRoot = adapter.createRoot(unmountedContainer);
  unmountedRoot.unmount();
  assert.throws(
    () =>
      adapter.preflightRootMarkerListenerSetupAndCleanup(unmountedRoot),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
    }
  );
  assertBridgeDidNotTouchContainer(unmountedContainer, unmountedDocument);
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

function createHostOutputAttributeStyleProps(phase) {
  if (phase === 'updated') {
    return {
      id: 'message',
      className: 'root-card updated',
      style: {
        color: 'blue',
        width: 12
      },
      'data-phase': 'updated',
      children: 'stable'
    };
  }

  return {
    id: 'message',
    className: 'root-card',
    title: 'initial title',
    hidden: true,
    style: {
      color: 'red',
      marginTop: 4,
      '--gap': '4px'
    },
    'data-phase': 'initial',
    children: 'stable'
  };
}

function createRootCommitHostComponentUpdateRecord(options) {
  return {
    kind: 'commit-host-component-update',
    tag: 'HostComponent',
    source: {
      kind: 'Update'
    },
    root: {
      slot: 3
    },
    hostRoot: {
      slot: 4
    },
    parent: {
      slot: 4
    },
    parentTag: 'HostRoot',
    fiber: {
      slot: 12 + (options.recordIndex || 0)
    },
    alternateFiber: {
      slot: 8 + (options.recordIndex || 0)
    },
    stateNodeRaw: options.stateNodeRaw,
    pendingPropsRaw: 3003,
    memoizedPropsRaw: 3003,
    alternateMemoizedPropsRaw: 3001
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

function activeHostOutputStyleProperties(element) {
  return Array.from(element.style.properties.entries())
    .filter(([, value]) => value !== '')
    .sort(([left], [right]) => left.localeCompare(right));
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

function assertPrivatePublicFacadePreflightRecord(record, expected) {
  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    record.$$typeof,
    rootBridge.privateRootPublicFacadePreflightRecordType
  );
  assert.equal(
    record.kind,
    'FastReactDomPrivateRootPublicFacadePreflightRecord'
  );
  assert.equal(record.operation, expected.operation);
  assert.equal(record.facadeCall, expected.facadeCall);
  assert.equal(record.entrypoint, 'react-dom/client');
  assert.equal(record.preflightId, expected.preflightId);
  assert.equal(
    record.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED
  );
  assert.equal(record.executionStatus, rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED);
  assert.equal(
    record.compatibilityStatus,
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED
  );
  assert.equal(record.requestId, expected.requestId);
  assert.equal(record.requestType, expected.requestType);
  assert.equal(
    record.requestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    record.requestAdmission.admissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    record.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(record.nativeHandoffRecord.handoffId, expected.nativeHandoffId);
  assert.equal(
    record.nativeHandoffRecord.handoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    record.nativeHandoffRecord.nativeRequestRecord.environmentId,
    427
  );
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      'private-root-bridge-request-admission',
      'private-native-request-handoff-mirror'
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
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
  assert.equal(
    rootBridge.isPrivateRootPublicFacadePreflightRecord(record),
    true
  );
  assert.equal(record.acceptedPrivateBridgeDiagnostics, true);
  assert.equal(record.publicCreateRootEnabled, false);
  assert.equal(record.publicHydrateRootEnabled, false);
  assert.equal(record.publicRootObjectExposed, false);
  assert.equal(record.publicRootCompatibilitySurface, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.rootScheduled, false);
  assert.equal(record.domMutation, false);
  assert.equal(record.markerWrites, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.hydration, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.compatibilityClaimed, false);
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
    this.styleLog = [];
    this.style = new HostOutputStyle(this);
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

class HostOutputStyle {
  constructor(ownerElement) {
    this.ownerElement = ownerElement;
    this.properties = new Map();

    return new Proxy(this, {
      set(target, property, value, receiver) {
        if (shouldRecordHostOutputStyleProperty(property)) {
          const stringValue = String(value);
          target.properties.set(property, stringValue);
          target.ownerElement.styleLog.push([
            'stylePropertyAssignment',
            property,
            stringValue
          ]);
        }
        return Reflect.set(target, property, value, receiver);
      }
    });
  }

  setProperty(name, value) {
    const propertyName = String(name);
    const stringValue = String(value);
    this.properties.set(propertyName, stringValue);
    this.ownerElement.styleLog.push([
      'styleSetProperty',
      propertyName,
      stringValue
    ]);
  }
}

function shouldRecordHostOutputStyleProperty(property) {
  return (
    typeof property === 'string' &&
    !property.startsWith('_') &&
    !['ownerElement', 'properties', 'setProperty'].includes(property)
  );
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
  document.createElement = function createFakeElement(tagName) {
    const nodeName = String(tagName).toUpperCase();
    this.__mutationLog.push({
      nodeName,
      type: 'createElement'
    });
    return createElement(nodeName, this);
  };
  document.createTextNode = function createFakeTextNode(text) {
    const value = String(text);
    this.__mutationLog.push({
      type: 'createTextNode',
      value
    });
    return createTextNode(value, this);
  };
  return document;
}

function createElement(nodeName, ownerDocument) {
  return createEventTarget({
    nodeName,
    nodeType: ELEMENT_NODE,
    ownerDocument
  });
}

function createTextNode(text, ownerDocument) {
  const target = createEventTarget({
    nodeName: '#text',
    nodeType: TEXT_NODE,
    ownerDocument
  });
  let textValue = String(text);
  target.writeLog = [];
  Object.defineProperties(target, {
    data: {
      configurable: true,
      enumerable: true,
      get() {
        return textValue;
      },
      set(value) {
        textValue = String(value);
        this.writeLog.push(['data', textValue]);
      }
    },
    nodeValue: {
      configurable: true,
      enumerable: true,
      get() {
        return textValue;
      },
      set(value) {
        textValue = String(value);
        this.writeLog.push(['nodeValue', textValue]);
      }
    },
    textContent: {
      configurable: true,
      enumerable: true,
      get() {
        return textValue;
      },
      set(value) {
        textValue = String(value);
        this.writeLog.push(['textContent', textValue]);
      }
    }
  });
  return target;
}

function createEventTarget(fields) {
  const target = {
    ...fields,
    attributeLog: [],
    attributes: new Map(),
    childNodes: [],
    __mutationLog: [],
    __removals: [],
    __registrations: [],
    mutationLog: [],
    parentNode: null,
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
      detachChildFromParent(child);
      this.childNodes.push(child);
      child.parentNode = this;
      this.__mutationLog.push({child, type: 'appendChild'});
      this.mutationLog.push(['appendChild', child.nodeName]);
      return child;
    },
    insertBefore(child, beforeChild) {
      if (beforeChild.parentNode !== this) {
        throw new Error('Cannot insert before a child from another parent.');
      }
      detachChildFromParent(child);
      const index = this.childNodes.indexOf(beforeChild);
      this.childNodes.splice(index, 0, child);
      child.parentNode = this;
      this.__mutationLog.push({beforeChild, child, type: 'insertBefore'});
      this.mutationLog.push([
        'insertBefore',
        child.nodeName,
        beforeChild.nodeName
      ]);
      return child;
    },
    removeChild(child) {
      if (child.parentNode !== this) {
        throw new Error('Cannot remove a child from another parent.');
      }
      detachChildFromParent(child);
      this.__mutationLog.push({child, type: 'removeChild'});
      this.mutationLog.push(['removeChild', child.nodeName]);
      return child;
    },
    setAttribute(name, value) {
      const attributeName = String(name);
      const stringValue = String(value);
      this.attributes.set(attributeName, stringValue);
      this.attributeLog.push(['setAttribute', attributeName, stringValue]);
    },
    removeAttribute(name) {
      const attributeName = String(name);
      const hadAttribute = this.attributes.has(attributeName);
      this.attributes.delete(attributeName);
      this.attributeLog.push(['removeAttribute', attributeName, hadAttribute]);
    },
    hasAttribute(name) {
      return this.attributes.has(String(name));
    },
    getAttribute(name) {
      const attributeName = String(name);
      return this.attributes.has(attributeName)
        ? this.attributes.get(attributeName)
        : null;
    }
  };
  let textContent = '';
  Object.defineProperties(target, {
    firstChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[0] || null;
      }
    },
    lastChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[this.childNodes.length - 1] || null;
      }
    },
    textContent: {
      configurable: true,
      enumerable: true,
      get() {
        if (this.childNodes.length > 0) {
          return this.childNodes.map((child) => child.textContent).join('');
        }
        return textContent;
      },
      set(value) {
        for (const child of [...this.childNodes]) {
          detachChildFromParent(child);
        }
        textContent = String(value);
        this.__mutationLog.push({type: 'textContent', value});
        this.mutationLog.push(['textContent', textContent]);
      }
    }
  });
  return target;
}

function detachChildFromParent(child) {
  if (child == null || typeof child !== 'object') {
    throw new Error('Expected a fake-DOM child object.');
  }
  if (child.parentNode === null || child.parentNode === undefined) {
    child.parentNode = null;
    return;
  }

  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}

function attributeEntries(node) {
  return [...node.attributes.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
}
