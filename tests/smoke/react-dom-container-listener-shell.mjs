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

const domContainer = require(
  path.join(repoRoot, 'packages/react-dom/src/client/dom-container.js')
);
const rootMarkers = require(
  path.join(repoRoot, 'packages/react-dom/src/client/root-markers.js')
);
const eventNames = require(
  path.join(repoRoot, 'packages/react-dom/src/events/event-names.js')
);
const listenerRegistry = require(
  path.join(repoRoot, 'packages/react-dom/src/events/listener-registry.js')
);
const rootListeners = require(
  path.join(repoRoot, 'packages/react-dom/src/events/root-listeners.js')
);
const reactDomClient = require(
  path.join(repoRoot, 'packages/react-dom/client.js')
);

const {
  DOCUMENT_FRAGMENT_NODE,
  DOCUMENT_NODE,
  ELEMENT_NODE,
  TEXT_NODE
} = domContainer;

assert.equal(typeof reactDomClient.createRoot, 'function');
assert.equal(reactDomClient.__FAST_REACT_PLACEHOLDER__, true);
assert.throws(() => reactDomClient.createRoot({nodeType: ELEMENT_NODE}), {
  code: 'FAST_REACT_UNIMPLEMENTED'
});

assert.equal(eventNames.allNativeEvents.length, 86);
assert.equal(eventNames.nonDelegatedEvents.length, 32);
assert.equal(
  eventNames.allNativeEvents.filter((name) => name !== 'selectionchange').length,
  85
);

{
  const document = createDocument('validation');
  const validContainers = [
    createElement('DIV', document),
    document,
    createDocumentFragment(document)
  ];
  for (const container of validContainers) {
    assert.equal(domContainer.isValidContainer(container), true);
    assert.equal(domContainer.assertValidContainer(container), container);
  }

  const invalidContainers = [
    null,
    undefined,
    {},
    {nodeType: TEXT_NODE, ownerDocument: document},
    {nodeType: 8, nodeName: '#comment', ownerDocument: document}
  ];
  for (const container of invalidContainers) {
    assert.equal(domContainer.isValidContainer(container), false);
    assert.throws(() => domContainer.assertValidContainer(container), {
      code: 'FAST_REACT_DOM_INVALID_CONTAINER',
      message: domContainer.invalidContainerDevelopmentMessage
    });
    assert.throws(
      () => domContainer.assertValidContainer(container, {production: true}),
      {
        code: 'FAST_REACT_DOM_INVALID_CONTAINER',
        message: domContainer.invalidContainerProductionMessage
      }
    );
  }
}

{
  const document = createDocument('markers');
  const container = createElement('DIV', document);
  const rootOwner = {kind: 'FastReactDomInternalRoot'};

  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(rootMarkers.getCreateRootWarning(container), null);
  rootMarkers.markContainerAsRoot(rootOwner, container);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), true);
  assert.equal(rootMarkers.getContainerRoot(container), rootOwner);
  assert.equal(
    rootMarkers.getCreateRootWarning(container, {development: true}),
    rootMarkers.duplicateCreateRootWarning
  );
  assert.equal(
    rootMarkers.getCreateRootWarning(container, {development: false}),
    null
  );

  const afterMark = rootMarkers.inspectContainerRootMarker(container);
  assert.equal(afterMark.propertyCount, 1);
  assert.equal(afterMark.truthyCount, 1);
  assert.equal(
    afterMark.properties[0].keyPrefix,
    rootMarkers.containerMarkerPrefix
  );

  rootMarkers.unmarkContainerAsRoot(container);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  const afterUnmount = rootMarkers.inspectContainerRootMarker(container);
  assert.equal(afterUnmount.propertyCount, 1);
  assert.equal(afterUnmount.nullCount, 1);

  container[rootMarkers.legacyRootContainerKey] = {};
  assert.equal(
    rootMarkers.getCreateRootWarning(container, {development: true}),
    rootMarkers.legacyRootWarning
  );
}

{
  const document = createDocument('root-listeners');
  const container = createElement('DIV', document);

  rootListeners.listenToAllSupportedEvents(container);
  assertRootListenerSet(container, 'root container');
  assertSelectionChangeOnlyOnDocument(document);
  assert.equal(listenerRegistry.hasListeningMarker(container), true);
  assert.equal(listenerRegistry.hasListeningMarker(document), true);

  rootListeners.listenToAllSupportedEvents(container);
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);

  const secondRoot = createElement('MAIN', document);
  rootListeners.listenToAllSupportedEvents(secondRoot);
  assertRootListenerSet(secondRoot, 'second root');
  assert.equal(document.__registrations.length, 1);

  const portal = createElement('SECTION', document);
  rootListeners.listenToPortalContainerEvents(portal);
  assertRootListenerSet(portal, 'same-document portal');
  assert.equal(document.__registrations.length, 1);

  const otherDocument = createDocument('portal-doc');
  const crossDocumentPortal = createElement('ASIDE', otherDocument);
  rootListeners.listenToPortalContainerEvents(crossDocumentPortal);
  assertRootListenerSet(crossDocumentPortal, 'cross-document portal');
  assertSelectionChangeOnlyOnDocument(otherDocument);

  const documentRoot = document;
  rootListeners.listenToAllSupportedEvents(documentRoot);
  const documentRootSummary = summarizeRegistrations(documentRoot);
  assert.equal(
    documentRootSummary.byEvent.get('selectionchange').bubble,
    1
  );
  assert.equal(documentRootSummary.byEvent.get('click').capture, 1);
  assert.equal(documentRootSummary.byEvent.get('click').bubble, 1);
}

{
  const document = createDocument('native-listener');
  const button = createElement('BUTTON', document);

  assert.throws(
    () => rootListeners.listenToNativeEvent('scroll', false, button),
    {
      code: 'FAST_REACT_DOM_NON_DELEGATED_BUBBLE_LISTENER'
    }
  );
  assert.throws(
    () =>
      rootListeners.listenToNativeEvent('definitely-not-react', true, button),
    {
      code: 'FAST_REACT_DOM_UNKNOWN_NATIVE_EVENT'
    }
  );

  const listener = rootListeners.listenToNativeEvent('click', false, button);
  assert.equal(listener.__FAST_REACT_DOM_EVENT_SHELL__, true);
  assert.equal(listener({type: 'click'}), undefined);
  assert.equal(rootListeners.listenToNativeEvent('click', false, button), null);

  rootListeners.listenToNonDelegatedEvent('scroll', button);
  assert.equal(
    button.__registrations.filter((entry) => entry.type === 'scroll').length,
    1
  );
  assert.equal(rootListeners.listenToNonDelegatedEvent('scroll', button), null);
}

console.log(
  'React DOM internal container marker and root listener shell smoke checks passed.'
);

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

function createDocumentFragment(ownerDocument) {
  return {
    nodeName: '#document-fragment',
    nodeType: DOCUMENT_FRAGMENT_NODE,
    ownerDocument
  };
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
        capture: getCapture(options),
        listener,
        options,
        passive: getPassive(options),
        type
      });
    }
  };
}

function getCapture(options) {
  if (typeof options === 'boolean') {
    return options;
  }
  return !!(options && options.capture);
}

function getPassive(options) {
  if (options && typeof options === 'object' && options.passive === true) {
    return true;
  }
  return false;
}

function summarizeRegistrations(target) {
  const byEvent = new Map();
  for (const registration of target.__registrations) {
    let summary = byEvent.get(registration.type);
    if (summary === undefined) {
      summary = {
        bubble: 0,
        capture: 0,
        passiveTrue: 0
      };
      byEvent.set(registration.type, summary);
    }
    if (registration.capture) {
      summary.capture++;
    } else {
      summary.bubble++;
    }
    if (registration.passive) {
      summary.passiveTrue++;
    }
  }
  return {
    byEvent,
    eventNames: [...byEvent.keys()].sort(),
    listenerCount: target.__registrations.length
  };
}

function assertRootListenerSet(target, label) {
  const summary = summarizeRegistrations(target);
  assert.equal(summary.listenerCount, 138, `${label} listener count`);
  assert.equal(summary.eventNames.length, 85, `${label} event count`);
  assert.equal(
    summary.byEvent.has('selectionchange'),
    false,
    `${label} excludes selectionchange`
  );

  for (const name of eventNames.allNativeEvents) {
    if (name === 'selectionchange') {
      continue;
    }
    assert.ok(summary.byEvent.has(name), `${label} has ${name}`);
  }

  for (const name of ['click', 'mousemove']) {
    assert.deepEqual(
      {
        bubble: summary.byEvent.get(name).bubble,
        capture: summary.byEvent.get(name).capture,
        passiveTrue: summary.byEvent.get(name).passiveTrue
      },
      {
        bubble: 1,
        capture: 1,
        passiveTrue: 0
      },
      `${label} delegated ${name}`
    );
  }

  for (const name of eventNames.passiveBrowserEvents) {
    assert.deepEqual(
      {
        bubble: summary.byEvent.get(name).bubble,
        capture: summary.byEvent.get(name).capture,
        passiveTrue: summary.byEvent.get(name).passiveTrue
      },
      {
        bubble: 1,
        capture: 1,
        passiveTrue: 2
      },
      `${label} passive ${name}`
    );
  }

  for (const name of eventNames.nonDelegatedEvents) {
    const eventSummary = summary.byEvent.get(name);
    assert.deepEqual(
      {
        bubble: eventSummary.bubble,
        capture: eventSummary.capture
      },
      {
        bubble: 0,
        capture: 1
      },
      `${label} non-delegated ${name}`
    );
  }
}

function assertSelectionChangeOnlyOnDocument(document) {
  const summary = summarizeRegistrations(document);
  assert.equal(summary.listenerCount, 1, `${document.label} listener count`);
  assert.deepEqual(summary.eventNames, ['selectionchange']);
  assert.deepEqual(summary.byEvent.get('selectionchange'), {
    bubble: 1,
    capture: 0,
    passiveTrue: 0
  });
}
