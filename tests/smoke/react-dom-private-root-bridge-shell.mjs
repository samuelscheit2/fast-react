import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

const reactDomClient = require(
  path.join(repoRoot, 'packages/react-dom/client.js')
);
const React = require(path.join(repoRoot, 'packages/react/index.js'));
const rootBridge = require(
  path.join(repoRoot, 'packages/react-dom/src/client/root-bridge.js')
);
const rootMarkers = require(
  path.join(repoRoot, 'packages/react-dom/src/client/root-markers.js')
);
const listenerRegistry = require(
  path.join(repoRoot, 'packages/react-dom/src/events/listener-registry.js')
);
const componentTree = require(
  path.join(repoRoot, 'packages/react-dom/src/client/component-tree.js')
);
const {
  DOCUMENT_NODE,
  ELEMENT_NODE,
  TEXT_NODE
} = require(path.join(repoRoot, 'packages/react-dom/src/client/dom-container.js'));

assert.deepEqual(Object.keys(reactDomClient), [
  'createRoot',
  'hydrateRoot',
  'version'
]);
assert.equal(reactDomClient.__FAST_REACT_PLACEHOLDER__, true);
assert.equal(
  Object.keys(reactDomClient).includes('__FAST_REACT_PLACEHOLDER__'),
  false
);
assert.equal(reactDomClient.__FAST_REACT_ENTRYPOINT__, 'react-dom/client');
assert.equal(reactDomClient.compatibilityTarget, 'react-dom@19.2.6');
assert.equal(reactDomClient.createRoot.length, 0);
assert.equal(reactDomClient.createRoot.name, 'createRoot');

{
  const publicDocument = createDocument('public');
  const publicContainer = publicDocument.createElement('div');
  publicDocument.__mutationLog.length = 0;
  const root = reactDomClient.createRoot(publicContainer);
  const renderReturn = root.render(
    React.createElement('div', {id: 'app'}, 'hello')
  );

  assert.equal(renderReturn, undefined);
  assert.equal(publicContainer.childNodes.length, 1);
  assert.equal(publicContainer.firstChild.nodeName, 'DIV');
  assert.equal(publicContainer.firstChild.getAttribute('id'), 'app');
  assert.equal(publicContainer.textContent, 'hello');
  assert.equal(publicContainer.__registrations.length, 0);
  assert.equal(publicDocument.__registrations.length, 0);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(publicContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(publicContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(publicDocument), false);
  const initialHostNode = publicContainer.firstChild;
  const updateReturn = root.render(
    React.createElement('div', {id: 'app'}, 'again')
  );
  assert.equal(updateReturn, undefined);
  assert.equal(publicContainer.childNodes.length, 1);
  assert.equal(publicContainer.firstChild, initialHostNode);
  assert.equal(publicContainer.firstChild.getAttribute('id'), 'app');
  assert.equal(publicContainer.textContent, 'again');
  const unmountReturn = root.unmount();
  assert.equal(unmountReturn, undefined);
  assert.equal(publicContainer.childNodes.length, 0);
  assert.equal(publicContainer.textContent, '');
  assert.equal(publicContainer.__registrations.length, 0);
  assert.equal(publicDocument.__registrations.length, 0);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(publicContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(publicContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(publicDocument), false);
  const staleRenderError = captureThrown(() =>
    root.render(React.createElement('div', null, 'stale'))
  );
  assert.equal(staleRenderError.code, 'FAST_REACT_UNIMPLEMENTED');
  assert.equal(staleRenderError.entrypoint, 'react-dom/client');
  assert.equal(staleRenderError.exportName, 'createRoot().render');
  const secondUnmountError = captureThrown(() => root.unmount());
  assert.equal(secondUnmountError.code, 'FAST_REACT_UNIMPLEMENTED');
  assert.equal(secondUnmountError.entrypoint, 'react-dom/client');
  assert.equal(secondUnmountError.exportName, 'createRoot().unmount');
  assert.equal(publicContainer.childNodes.length, 0);
}

const first = createBridgeScenario('first');
const second = createBridgeScenario('second');

assert.deepEqual(first.records, second.records);
assertPrivateRecordInvariants(first);
assertPrivateRecordInvariants(second);

{
  const document = createDocument('manual');
  const container = createElement('SECTION', document);
  const owner = rootBridge.createPrivateRootOwner('manual-root:1');
  const handle = rootBridge.createPrivateRootHandle(owner, container);
  const update = rootBridge.createRootRenderRecord(handle, 'manual child');
  const unmount = rootBridge.createRootUnmountRecord(handle);

  assert.equal(rootBridge.isPrivateRootOwner(owner), true);
  assert.equal(rootBridge.isPrivateRootHandle(handle), true);
  assert.equal(rootBridge.getRootOwnerFromHandle(handle), owner);
  assert.equal(update.rootId, 'manual-root:1');
  assert.equal(update.operation, 'render');
  assert.equal(update.requestId, 'request:1');
  assert.equal(update.requestType, 'root.render');
  assert.equal(update.updateId, 'update:1');
  assert.equal(update.lifecycleStatusBefore, rootBridge.ROOT_LIFECYCLE_CREATED);
  assert.equal(update.lifecycleStatusAfter, rootBridge.ROOT_LIFECYCLE_RENDERED);
  assert.equal(unmount.updateId, 'update:2');
  assert.equal(unmount.requestId, 'request:2');
  assert.equal(unmount.requestType, 'root.unmount');
  assert.equal(unmount.sync, true);
  assert.equal(unmount.noOp, false);
  assert.equal(
    unmount.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    unmount.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.deepEqual(unmount.elementInfo, {type: 'null'});
  assert.throws(() => rootBridge.createRootRenderRecord(handle, 'late child'), {
    code: 'FAST_REACT_DOM_UNMOUNTED_ROOT',
    message: 'Cannot update an unmounted root.'
  });
  assertBridgeDidNotTouchContainer(container);
}

{
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const document = createDocument('invalid');

  assert.throws(
    () =>
      bridge.createClientRoot({
        nodeName: '#text',
        nodeType: TEXT_NODE,
        ownerDocument: document
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_CONTAINER'
    }
  );
  assert.throws(() => bridge.updateContainer({rootId: 'root:1'}, 'child'), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_HANDLE'
  });

  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const record = bridge.createClientRoot(createElement('DIV', document));
  assert.throws(() => otherBridge.updateContainer(record.handle, 'child'), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => otherBridge.admitRequest(record), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => rootBridge.admitRootBridgeRequestRecord({}), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST'
  });
  assert.throws(() => rootBridge.admitRootBridgeRequestRecord(null), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST'
  });
}

{
  const document = createDocument('guards');
  const container = createElement('DIV', document);
  const existingOwner = rootBridge.createPrivateRootOwner('existing-root:1');
  rootMarkers.markContainerAsRoot(existingOwner, container);
  listenerRegistry.markTargetAsListening(container);
  listenerRegistry.markTargetAsListening(document);

  const bridge = rootBridge.createPrivateRootBridgeShell();
  const markerBefore = rootMarkers.inspectContainerRootMarker(container);
  const containerRegistrationsBefore = container.__registrations.length;
  const documentRegistrationsBefore = document.__registrations.length;
  const create = bridge.createClientRoot(container);
  const markerAfter = rootMarkers.inspectContainerRootMarker(container);

  assert.deepEqual(create.markerGuard, {
    action: 'defer-mark-container-as-root',
    hasLegacyRootMarker: false,
    isContainerMarkedAsRoot: true,
    warning: {
      message: rootMarkers.duplicateCreateRootWarning,
      type: 'duplicate-create-root'
    }
  });
  assert.equal(create.listenerGuard.hasRootListeningMarker, true);
  assert.equal(create.listenerGuard.ownerDocumentHasSelectionChangeMarker, true);
  assert.deepEqual(markerAfter, markerBefore);
  assert.equal(rootMarkers.getContainerRoot(container), existingOwner);
  assert.equal(container.__registrations.length, containerRegistrationsBefore);
  assert.equal(document.__registrations.length, documentRegistrationsBefore);

  const unmount = bridge.unmountContainer(create.handle);
  assert.deepEqual(unmount.markerGuard, {
    action: 'defer-unmark-container-as-root-after-sync-flush',
    isContainerMarkedAsRoot: true
  });
  assert.equal(rootMarkers.getContainerRoot(container), existingOwner);
  assertBridgeDidNotTouchRegisteredContainer(container, document);
}

{
  const document = createDocument('legacy-warning');
  const container = createElement('DIV', document);
  container[rootMarkers.legacyRootContainerKey] = {};

  assert.deepEqual(rootBridge.describeCreateRootMarkerGuard(container), {
    action: 'defer-mark-container-as-root',
    hasLegacyRootMarker: true,
    isContainerMarkedAsRoot: false,
    warning: {
      message: rootMarkers.legacyRootWarning,
      type: 'legacy-root-container'
    }
  });
}

{
  const document = createDocument('private-root-output');
  const container = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: 'root-output-admission',
    hostOutputUpdateIdPrefix: 'root-output-update',
    initialHostOutputIdPrefix: 'root-output-initial',
    rootIdPrefix: 'root-output-root',
    sideEffectIdPrefix: 'root-output-side-effect',
    unmountCleanupIdPrefix: 'root-output-unmount'
  });
  const initialElement = {
    props: {
      children: 'hello',
      className: 'root-card',
      'data-phase': 'initial',
      id: 'message',
      title: 'initial title'
    },
    type: 'div'
  };
  const updatedElement = {
    props: {
      children: 'goodbye',
      className: 'root-card updated',
      'data-phase': 'updated',
      id: 'message',
      title: 'updated title'
    },
    type: 'div'
  };

  const create = bridge.createClientRoot(container);
  const render = bridge.renderContainer(create.handle, initialElement);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const admission = bridge.admitCreateRenderPath(create, sideEffects, render);

  assert.equal(sideEffects.sideEffectStatus, rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED);
  assert.equal(sideEffects.markerWrites, true);
  assert.equal(sideEffects.listenerInstallation, true);
  assert.equal(sideEffects.domMutation, false);
  assert.equal(sideEffects.compatibilityClaimed, false);
  assert.equal(rootMarkers.getContainerRoot(container), create.owner);
  assert.equal(sideEffects.listenerRegistration.rootRegistrationCount, 138);
  assert.equal(sideEffects.listenerRegistration.ownerDocumentRegistrationCount, 1);

  assert.equal(
    admission.admissionStatus,
    rootBridge.ROOT_BRIDGE_CREATE_RENDER_ADMITTED
  );
  assert.deepEqual(
    capabilityIds(admission.acceptedCapabilities),
    ['create-root-marker-write', 'root-listener-installation']
  );
  assert.deepEqual(
    capabilityIds(admission.blockedCapabilities),
    [
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assertAllCapabilitiesBlocked(admission.blockedCapabilities);
  assert.equal(admission.publicRootCreated, false);
  assert.equal(admission.reconcilerExecution, false);
  assert.equal(admission.eventDispatch, false);
  assert.equal(admission.compatibilityClaimed, false);

  const initialHandoff = bridge.applyInitialRenderHostOutput(admission);
  const initialPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(initialHandoff);
  assert.equal(
    initialHandoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED
  );
  assert.deepEqual(
    capabilityIds(initialHandoff.acceptedCapabilities),
    [
      'create-render-admission',
      'fake-dom-host-component',
      'fake-dom-host-text',
      'component-tree-host-instance-map',
      'latest-props-publication'
    ]
  );
  assert.deepEqual(
    capabilityIds(initialHandoff.blockedCapabilities),
    [
      'public-root-object',
      'native-execution',
      'reconciler-execution',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assertAllCapabilitiesBlocked(initialHandoff.blockedCapabilities);
  assert.equal(initialHandoff.domMutation, true);
  assert.equal(initialHandoff.publicRootCreated, false);
  assert.equal(initialHandoff.nativeExecution, false);
  assert.equal(initialHandoff.reconcilerExecution, false);
  assert.equal(initialHandoff.eventDispatch, false);
  assert.equal(initialHandoff.compatibilityClaimed, false);
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild, initialPayload.hostNode);
  assert.equal(initialPayload.hostNode.nodeName, 'DIV');
  assert.equal(initialPayload.hostNode.firstChild, initialPayload.textNode);
  assert.equal(initialPayload.hostNode.textContent, 'hello');
  assert.deepEqual(attributeEntries(initialPayload.hostNode), [
    ['class', 'root-card'],
    ['data-phase', 'initial'],
    ['id', 'message'],
    ['title', 'initial title']
  ]);
  assert.equal(
    componentTree.getLatestPropsFromNode(initialPayload.hostNode),
    initialElement.props
  );
  assert.equal(
    componentTree.getMountedHostInstanceTokenFromNode(initialPayload.hostNode),
    initialPayload.hostToken
  );

  const update = bridge.renderContainer(create.handle, updatedElement);
  const updateHandoff = bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: initialPayload.hostToken,
    nextProps: updatedElement.props,
    tag: 'div',
    textUpdate: {
      newText: 'goodbye',
      oldText: 'hello',
      textInstance: initialPayload.textNode
    }
  });
  const updatePayload =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(updateHandoff);
  assert.equal(
    updateHandoff.updateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.deepEqual(
    capabilityIds(updateHandoff.acceptedCapabilities),
    [
      'fake-dom-property-update',
      'property-payload-evidence',
      'fake-dom-text-update',
      'latest-props-after-mutation',
      'attribute-payload-rows'
    ]
  );
  assert.deepEqual(
    capabilityIds(updateHandoff.blockedCapabilities),
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
  assertAllCapabilitiesBlocked(updateHandoff.blockedCapabilities);
  assert.equal(updateHandoff.fakeDomMutation, true);
  assert.equal(updateHandoff.browserDomMutation, false);
  assert.equal(updateHandoff.reconcilerExecution, false);
  assert.equal(updateHandoff.eventDispatch, false);
  assert.equal(updateHandoff.refEffects, false);
  assert.equal(updateHandoff.compatibilityClaimed, false);
  assert.equal(updateHandoff.latestPropsPublished, true);
  assert.equal(updatePayload.nextProps, updatedElement.props);
  assert.deepEqual(updatePayload.textUpdate, {
    newText: 'goodbye',
    oldText: 'hello'
  });
  assert.equal(initialPayload.hostNode.textContent, 'goodbye');
  assert.deepEqual(attributeEntries(initialPayload.hostNode), [
    ['class', 'root-card updated'],
    ['data-phase', 'updated'],
    ['id', 'message'],
    ['title', 'updated title']
  ]);
  assert.equal(
    componentTree.getLatestPropsFromNode(initialPayload.hostNode),
    updatedElement.props
  );

  const unmount = bridge.unmountContainer(create.handle);
  const cleanup = bridge.cleanupUnmountHostOutput(admission, unmount);
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED
  );
  assert.deepEqual(
    capabilityIds(cleanup.acceptedCapabilities),
    [
      'root-unmount-admission-metadata',
      'fake-dom-clear-container',
      'fake-dom-container-cleanup-metadata',
      'deletion-cleanup-metadata',
      'component-tree-metadata-detach',
      'root-marker-listener-revert'
    ]
  );
  assert.deepEqual(
    capabilityIds(cleanup.blockedCapabilities),
    [
      'public-root-unmount',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'events',
      'compatibility-claims'
    ]
  );
  assertAllCapabilitiesBlocked(cleanup.blockedCapabilities);
  assert.equal(cleanup.fakeDomMutation, true);
  assert.equal(cleanup.rootContainerChildrenCleared, true);
  assert.equal(cleanup.componentTreeMetadataDetached, true);
  assert.equal(cleanup.rootMarkerReverted, true);
  assert.equal(cleanup.rootListenersReverted, true);
  assert.equal(cleanup.publicRootUnmounted, false);
  assert.equal(cleanup.reconcilerExecution, false);
  assert.equal(cleanup.eventDispatch, false);
  assert.equal(cleanup.compatibilityClaimed, false);
  assert.equal(container.childNodes.length, 0);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(componentTree.getLatestPropsFromNode(initialPayload.hostNode), null);
  assert.equal(
    componentTree.getMountedHostInstanceTokenFromNode(initialPayload.hostNode),
    null
  );
}

console.log('React DOM private root bridge shell smoke checks passed.');

function createBridgeScenario(label) {
  const document = createDocument(label);
  const container = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const rootOptions = {
    identifierPrefix: 'fast-',
    onRecoverableError: function onRecoverableError() {},
    unstable_strictMode: true
  };
  const element = {
    props: {
      children: 'hello'
    },
    type: 'span'
  };
  const callback = function afterRootUpdate() {};

  const create = bridge.createClientRoot(container, rootOptions);
  const createAdmission = bridge.admitRequest(create);
  const update = bridge.renderContainer(create.handle, element, callback);
  const updateAdmission = bridge.admitRequest(update);
  const unmount = bridge.unmountContainer(create.handle);
  const unmountAdmission = bridge.admitRequest(unmount);
  const secondUnmount = bridge.unmountContainer(create.handle);
  const secondUnmountAdmission = bridge.admitRequest(secondUnmount);

  assertBridgeDidNotTouchContainer(container);
  assert.equal(rootBridge.getPrivateRootRecordPayload(create).container, container);
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(create).rootOptions,
    rootOptions
  );
  assert.equal(rootBridge.getPrivateRootRecordPayload(update).element, element);
  assert.equal(rootBridge.getPrivateRootRecordPayload(update).callback, callback);
  assert.equal(rootBridge.getPrivateRootRecordPayload(unmount).element, null);
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(secondUnmount).element,
    null
  );
  assertAdmissionBlocksExecution(createAdmission, {
    lifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_CREATED,
    lifecycleStatusBefore: null,
    lifecycleTransition: 'none->created',
    operation: 'create',
    requestId: 'request:1',
    requestType: 'createRoot',
    rootId: 'root:1',
    sequence: 1,
    updateId: null
  });
  assertAdmissionBlocksExecution(updateAdmission, {
    lifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_RENDERED,
    lifecycleStatusBefore: rootBridge.ROOT_LIFECYCLE_CREATED,
    lifecycleTransition: 'created->rendered',
    operation: 'render',
    requestId: 'request:2',
    requestType: 'root.render',
    rootId: 'root:1',
    sequence: 1,
    updateId: 'update:1'
  });
  assertAdmissionBlocksExecution(unmountAdmission, {
    lifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_UNMOUNTED,
    lifecycleStatusBefore: rootBridge.ROOT_LIFECYCLE_RENDERED,
    lifecycleTransition: 'rendered->unmounted',
    operation: 'unmount',
    requestId: 'request:3',
    requestType: 'root.unmount',
    rootId: 'root:1',
    sequence: 2,
    updateId: 'update:2'
  });
  assertAdmissionBlocksExecution(secondUnmountAdmission, {
    lifecycleStatusAfter: rootBridge.ROOT_LIFECYCLE_UNMOUNTED,
    lifecycleStatusBefore: rootBridge.ROOT_LIFECYCLE_UNMOUNTED,
    lifecycleTransition: 'unmounted->unmounted',
    operation: 'unmount',
    requestId: 'request:4',
    requestType: 'root.unmount',
    rootId: 'root:1',
    sequence: 3,
    updateId: 'update:3'
  });
  assertBridgeDidNotTouchContainer(container);
  assert.throws(() => bridge.renderContainer(create.handle, 'after unmount'), {
    code: 'FAST_REACT_DOM_UNMOUNTED_ROOT'
  });

  return {
    records: {
      create,
      update,
      unmount,
      secondUnmount
    }
  };
}

function assertPrivateRecordInvariants(scenario) {
  const {create, update, unmount, secondUnmount} = scenario.records;

  assert.equal(Object.isFrozen(create), true);
  assert.equal(Object.isFrozen(create.owner), true);
  assert.equal(Object.isFrozen(create.handle), true);
  assert.equal(Object.isFrozen(update), true);
  assert.equal(Object.isFrozen(unmount), true);
  assert.equal(Object.isFrozen(secondUnmount), true);

  assert.equal(create.$$typeof, rootBridge.privateRootCreateRecordType);
  assert.equal(create.kind, 'FastReactDomPrivateRootCreateRecord');
  assert.equal(create.operation, 'create');
  assert.equal(create.requestId, 'request:1');
  assert.equal(create.requestSequence, 1);
  assert.equal(create.requestType, 'createRoot');
  assert.equal(create.sequence, 1);
  assert.equal(create.rootId, 'root:1');
  assert.equal(create.rootKind, rootBridge.CLIENT_ROOT_KIND);
  assert.equal(create.rootTag, rootBridge.CONCURRENT_ROOT_TAG);
  assert.equal(create.lifecycleStatusBefore, null);
  assert.equal(
    create.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_CREATED
  );
  assert.deepEqual(create.containerInfo, {
    kind: 'object',
    nodeName: 'DIV',
    nodeType: ELEMENT_NODE
  });
  assert.deepEqual(create.rootOptionsInfo, {
    keys: ['identifierPrefix', 'onRecoverableError', 'unstable_strictMode'],
    type: 'object'
  });
  assert.deepEqual(create.markerGuard, {
    action: 'defer-mark-container-as-root',
    hasLegacyRootMarker: false,
    isContainerMarkedAsRoot: false,
    warning: null
  });
  assert.deepEqual(create.listenerGuard, {
    action: 'defer-listen-to-all-supported-events',
    canInstallRootListeners: true,
    hasRootListeningMarker: false,
    ownerDocumentCanInstallSelectionChange: true,
    ownerDocumentHasSelectionChangeMarker: false,
    ownerDocumentInfo: {
      kind: 'object',
      nodeName: '#document',
      nodeType: DOCUMENT_NODE
    },
    rootEventTargetInfo: {
      kind: 'object',
      nodeName: 'DIV',
      nodeType: ELEMENT_NODE
    }
  });
  assert.equal(create.nativeExecution, false);
  assert.equal(create.owner.$$typeof, rootBridge.privateRootOwnerType);
  assert.equal(create.handle.$$typeof, rootBridge.privateRootHandleType);
  assert.equal(create.handle.owner, create.owner);
  assert.equal(rootBridge.isPrivateRootOwner(create.owner), true);
  assert.equal(rootBridge.isPrivateRootHandle(create.handle), true);

  assert.equal(update.$$typeof, rootBridge.privateRootUpdateRecordType);
  assert.equal(update.kind, 'FastReactDomPrivateRootUpdateRecord');
  assert.equal(update.operation, 'render');
  assert.equal(update.requestId, 'request:2');
  assert.equal(update.requestSequence, 2);
  assert.equal(update.requestType, 'root.render');
  assert.equal(update.sequence, 1);
  assert.equal(update.updateId, 'update:1');
  assert.equal(update.rootId, create.rootId);
  assert.equal(
    update.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_CREATED
  );
  assert.equal(
    update.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(update.markerGuard, null);
  assert.equal(update.nativeExecution, false);
  assert.equal(update.noOp, false);
  assert.equal(update.renderCount, 1);
  assert.equal(update.sync, false);
  assert.deepEqual(update.elementInfo, {
    keys: ['props', 'type'],
    type: 'object'
  });
  assert.deepEqual(update.callbackInfo, {
    length: 0,
    name: 'afterRootUpdate',
    type: 'function'
  });

  assert.equal(unmount.operation, 'unmount');
  assert.equal(unmount.requestId, 'request:3');
  assert.equal(unmount.requestSequence, 3);
  assert.equal(unmount.requestType, 'root.unmount');
  assert.equal(unmount.sequence, 2);
  assert.equal(unmount.updateId, 'update:2');
  assert.equal(unmount.rootId, create.rootId);
  assert.equal(
    unmount.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    unmount.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.deepEqual(unmount.markerGuard, {
    action: 'defer-unmark-container-as-root-after-sync-flush',
    isContainerMarkedAsRoot: false
  });
  assert.equal(unmount.nativeExecution, false);
  assert.equal(unmount.noOp, false);
  assert.equal(unmount.renderCount, 1);
  assert.equal(unmount.sync, true);
  assert.deepEqual(unmount.elementInfo, {type: 'null'});
  assert.deepEqual(unmount.callbackInfo, {type: 'undefined'});

  assert.equal(secondUnmount.operation, 'unmount');
  assert.equal(secondUnmount.requestId, 'request:4');
  assert.equal(secondUnmount.requestSequence, 4);
  assert.equal(secondUnmount.requestType, 'root.unmount');
  assert.equal(secondUnmount.sequence, 3);
  assert.equal(secondUnmount.updateId, 'update:3');
  assert.equal(secondUnmount.rootId, create.rootId);
  assert.equal(
    secondUnmount.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(
    secondUnmount.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(secondUnmount.noOp, true);
  assert.equal(secondUnmount.sync, false);
  assert.deepEqual(secondUnmount.elementInfo, {type: 'null'});
}

function assertAdmissionBlocksExecution(admission, expected) {
  assert.equal(Object.isFrozen(admission), true);
  assert.equal(Object.isFrozen(admission.lifecyclePrerequisites), true);
  assert.equal(Object.isFrozen(admission.blockedCapabilities), true);
  assert.equal(admission.$$typeof, rootBridge.privateRootAdmissionRecordType);
  assert.equal(admission.kind, 'FastReactDomPrivateRootAdmissionRecord');
  assert.equal(
    admission.admissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    admission.executionStatus,
    rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED
  );
  assert.equal(
    admission.compatibilityStatus,
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED
  );
  assert.equal(admission.operation, expected.operation);
  assert.equal(admission.requestId, expected.requestId);
  assert.equal(admission.requestType, expected.requestType);
  assert.equal(admission.rootId, expected.rootId);
  assert.equal(admission.rootKind, rootBridge.CLIENT_ROOT_KIND);
  assert.equal(admission.rootTag, rootBridge.CONCURRENT_ROOT_TAG);
  assert.equal(admission.sequence, expected.sequence);
  assert.equal(admission.updateId, expected.updateId);
  assert.deepEqual(admission.lifecyclePrerequisites, {
    accepted: true,
    lifecycleStatusAfter: expected.lifecycleStatusAfter,
    lifecycleStatusBefore: expected.lifecycleStatusBefore,
    lifecycleTransition: expected.lifecycleTransition,
    operation: expected.operation,
    rootKind: rootBridge.CLIENT_ROOT_KIND,
    rootTag: rootBridge.CONCURRENT_ROOT_TAG
  });
  assert.deepEqual(
    admission.blockedCapabilities.map((capability) => capability.id),
    [
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
  assert.ok(
    admission.blockedCapabilities.every(
      (capability) => Object.isFrozen(capability) && capability.blocked === true
    )
  );
  assert.equal(admission.nativeExecution, false);
  assert.equal(admission.reconcilerExecution, false);
  assert.equal(admission.domMutation, false);
  assert.equal(admission.markerWrites, false);
  assert.equal(admission.listenerInstallation, false);
  assert.equal(admission.hydration, false);
  assert.equal(admission.eventDispatch, false);
  assert.equal(admission.compatibilityClaimed, false);
}

function capabilityIds(capabilities) {
  return capabilities.map((capability) => capability.id);
}

function assertAllCapabilitiesBlocked(capabilities) {
  assert.ok(
    capabilities.every(
      (capability) => Object.isFrozen(capability) && capability.blocked === true
    )
  );
}

function attributeEntries(node) {
  return Array.from(node.__attributes.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function assertBridgeDidNotTouchContainer(container) {
  assert.equal(rootMarkers.inspectContainerRootMarker(container).propertyCount, 0);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
}

function assertBridgeDidNotTouchRegisteredContainer(container, document) {
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
}

function captureThrown(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }

  throw new assert.AssertionError({
    message: 'Expected callback to throw.'
  });
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: '#document',
    nodeType: DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createEventTarget({label: `${label}-window`});
  document.createElement = (type) => createElement(type, document);
  document.createTextNode = (text) => createTextNode(text, document);
  return document;
}

function createElement(nodeName, ownerDocument) {
  const normalizedNodeName = String(nodeName).toUpperCase();
  return createEventTarget({
    localName: String(nodeName).toLowerCase(),
    nodeName: normalizedNodeName,
    nodeType: ELEMENT_NODE,
    ownerDocument,
    style: createStyleDeclaration(),
    tagName: normalizedNodeName
  });
}

function createTextNode(text, ownerDocument) {
  return createEventTarget({
    nodeName: '#text',
    nodeType: TEXT_NODE,
    ownerDocument,
    text
  });
}

function createEventTarget(fields) {
  const childNodes = [];
  const attributes = new Map();
  let textContent = fields.nodeType === TEXT_NODE ? String(fields.text) : '';
  const target = {
    ...fields,
    __attributes: attributes,
    childNodes,
    __mutationLog: [],
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
        (registration) =>
          registration.type === type &&
          registration.listener === listener &&
          registration.options === options
      );
      if (index !== -1) {
        this.__registrations.splice(index, 1);
      }
    },
    appendChild(child) {
      appendChildNode(this, child);
      this.__mutationLog.push({child, type: 'appendChild'});
      return child;
    },
    insertBefore(child, beforeChild) {
      insertChildNode(this, child, beforeChild);
      this.__mutationLog.push({beforeChild, child, type: 'insertBefore'});
      return child;
    },
    removeChild(child) {
      removeChildNode(this, child);
      this.__mutationLog.push({child, type: 'removeChild'});
      return child;
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    hasAttribute(name) {
      return attributes.has(name);
    },
    removeAttribute(name) {
      attributes.delete(name);
      this.__mutationLog.push({attributeName: name, type: 'removeAttribute'});
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
      this.__mutationLog.push({
        attributeName: name,
        type: 'setAttribute',
        value: String(value)
      });
    }
  };

  Object.defineProperty(target, 'firstChild', {
    configurable: true,
    enumerable: true,
    get() {
      return childNodes.length === 0 ? null : childNodes[0];
    }
  });
  Object.defineProperty(target, 'lastChild', {
    configurable: true,
    enumerable: true,
    get() {
      return childNodes.length === 0 ? null : childNodes[childNodes.length - 1];
    }
  });
  if (fields.nodeType === TEXT_NODE) {
    Object.defineProperty(target, 'data', {
      configurable: true,
      enumerable: true,
      get() {
        return textContent;
      },
      set(value) {
        textContent = String(value);
        this.__mutationLog.push({type: 'data', value: textContent});
      }
    });
    Object.defineProperty(target, 'nodeValue', {
      configurable: true,
      enumerable: true,
      get() {
        return textContent;
      },
      set(value) {
        textContent = String(value);
        this.__mutationLog.push({type: 'nodeValue', value: textContent});
      }
    });
  }
  Object.defineProperty(target, 'textContent', {
    configurable: true,
    enumerable: true,
    get() {
      if (this.nodeType === TEXT_NODE) {
        return textContent;
      }
      if (childNodes.length > 0) {
        return childNodes
          .map((child) => child.textContent ?? child.nodeValue ?? '')
          .join('');
      }
      return textContent;
    },
    set(value) {
      textContent = String(value);
      while (childNodes.length > 0) {
        const child = childNodes.pop();
        child.parentNode = null;
      }
      this.__mutationLog.push({type: 'textContent', value: textContent});
    }
  });
  return target;
}

function createStyleDeclaration() {
  return {
    setProperty(name, value) {
      this[name] = String(value);
    }
  };
}

function appendChildNode(parent, child) {
  detachFromParent(child);
  child.parentNode = parent;
  parent.childNodes.push(child);
}

function insertChildNode(parent, child, beforeChild) {
  const index = parent.childNodes.indexOf(beforeChild);
  if (index === -1) {
    throw new Error('Cannot insert before a node that is not a child.');
  }
  detachFromParent(child);
  child.parentNode = parent;
  parent.childNodes.splice(index, 0, child);
}

function removeChildNode(parent, child) {
  const index = parent.childNodes.indexOf(child);
  if (index === -1) {
    throw new Error('Cannot remove a node that is not a child.');
  }
  parent.childNodes.splice(index, 1);
  child.parentNode = null;
}

function detachFromParent(child) {
  if (child.parentNode === null || child.parentNode === undefined) {
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}
