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
const rootBridge = require(
  path.join(repoRoot, 'packages/react-dom/src/client/root-bridge.js')
);
const rootMarkers = require(
  path.join(repoRoot, 'packages/react-dom/src/client/root-markers.js')
);
const listenerRegistry = require(
  path.join(repoRoot, 'packages/react-dom/src/events/listener-registry.js')
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
  const publicContainer = createElement('DIV', createDocument('public'));
  const error = captureThrown(() => reactDomClient.createRoot(publicContainer));
  assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED');
  assert.equal(error.entrypoint, 'react-dom/client');
  assert.equal(error.exportName, 'createRoot');
  assertBridgeDidNotTouchContainer(publicContainer);
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
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
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
