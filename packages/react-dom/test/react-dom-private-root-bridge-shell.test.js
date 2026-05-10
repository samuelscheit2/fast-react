'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const reactDomClient = require(path.join(packageRoot, 'client.js'));
const rootBridge = require(path.join(
  packageRoot,
  'src/client/root-bridge.js'
));
const rootMarkers = require(path.join(
  packageRoot,
  'src/client/root-markers.js'
));
const listenerRegistry = require(path.join(
  packageRoot,
  'src/events/listener-registry.js'
));
const {
  DOCUMENT_NODE,
  ELEMENT_NODE
} = require(path.join(packageRoot, 'src/client/dom-container.js'));

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

function assertNativeHandoff(handoff, expected) {
  assert.equal(Object.isFrozen(handoff), true);
  assert.equal(Object.isFrozen(handoff.nativeRequestRecord), true);
  assert.equal(handoff.$$typeof, rootBridge.privateRootNativeHandoffRecordType);
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootNativeRequestHandoffRecord'
  );
  assert.equal(handoff.handoffStatus, rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED);
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
  assert.equal(rootMarkers.inspectContainerRootMarker(container).propertyCount, 0);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
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
