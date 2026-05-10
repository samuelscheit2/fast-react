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
  const update = rootBridge.createRootUpdateRecord(handle, 'manual child');
  const unmount = rootBridge.createRootUnmountRecord(handle);

  assert.equal(rootBridge.isPrivateRootOwner(owner), true);
  assert.equal(rootBridge.isPrivateRootHandle(handle), true);
  assert.equal(rootBridge.getRootOwnerFromHandle(handle), owner);
  assert.equal(update.rootId, 'manual-root:1');
  assert.equal(update.updateId, 'update:1');
  assert.equal(unmount.updateId, 'update:2');
  assert.equal(unmount.sync, true);
  assert.deepEqual(unmount.elementInfo, {type: 'null'});
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
  const update = bridge.updateContainer(create.handle, element, callback);
  const unmount = bridge.unmountContainer(create.handle);

  assertBridgeDidNotTouchContainer(container);
  assert.equal(rootBridge.getPrivateRootRecordPayload(create).container, container);
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(create).rootOptions,
    rootOptions
  );
  assert.equal(rootBridge.getPrivateRootRecordPayload(update).element, element);
  assert.equal(rootBridge.getPrivateRootRecordPayload(update).callback, callback);
  assert.equal(rootBridge.getPrivateRootRecordPayload(unmount).element, null);

  return {
    records: {
      create,
      update,
      unmount
    }
  };
}

function assertPrivateRecordInvariants(scenario) {
  const {create, update, unmount} = scenario.records;

  assert.equal(Object.isFrozen(create), true);
  assert.equal(Object.isFrozen(create.owner), true);
  assert.equal(Object.isFrozen(create.handle), true);
  assert.equal(Object.isFrozen(update), true);
  assert.equal(Object.isFrozen(unmount), true);

  assert.equal(create.$$typeof, rootBridge.privateRootCreateRecordType);
  assert.equal(create.kind, 'FastReactDomPrivateRootCreateRecord');
  assert.equal(create.operation, 'create');
  assert.equal(create.sequence, 1);
  assert.equal(create.rootId, 'root:1');
  assert.equal(create.rootKind, rootBridge.CLIENT_ROOT_KIND);
  assert.equal(create.rootTag, rootBridge.CONCURRENT_ROOT_TAG);
  assert.deepEqual(create.containerInfo, {
    kind: 'object',
    nodeName: 'DIV',
    nodeType: ELEMENT_NODE
  });
  assert.deepEqual(create.rootOptionsInfo, {
    keys: ['identifierPrefix', 'onRecoverableError', 'unstable_strictMode'],
    type: 'object'
  });
  assert.equal(create.owner.$$typeof, rootBridge.privateRootOwnerType);
  assert.equal(create.handle.$$typeof, rootBridge.privateRootHandleType);
  assert.equal(create.handle.owner, create.owner);
  assert.equal(rootBridge.isPrivateRootOwner(create.owner), true);
  assert.equal(rootBridge.isPrivateRootHandle(create.handle), true);

  assert.equal(update.$$typeof, rootBridge.privateRootUpdateRecordType);
  assert.equal(update.kind, 'FastReactDomPrivateRootUpdateRecord');
  assert.equal(update.operation, 'update');
  assert.equal(update.sequence, 1);
  assert.equal(update.updateId, 'update:1');
  assert.equal(update.rootId, create.rootId);
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
  assert.equal(unmount.sequence, 2);
  assert.equal(unmount.updateId, 'update:2');
  assert.equal(unmount.rootId, create.rootId);
  assert.equal(unmount.sync, true);
  assert.deepEqual(unmount.elementInfo, {type: 'null'});
  assert.deepEqual(unmount.callbackInfo, {type: 'undefined'});
}

function assertBridgeDidNotTouchContainer(container) {
  assert.equal(rootMarkers.inspectContainerRootMarker(container).propertyCount, 0);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(container.__registrations.length, 0);
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
  return {
    ...fields,
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    }
  };
}
