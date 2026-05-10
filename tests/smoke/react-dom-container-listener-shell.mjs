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
const eventPriorities = require(
  path.join(repoRoot, 'packages/react-dom/src/events/event-priorities.js')
);
const eventListener = require(
  path.join(repoRoot, 'packages/react-dom/src/events/react-dom-event-listener.js')
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

assertReactDomClientPlaceholder();

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
  const warningMessages = [];
  assert.equal(
    rootMarkers.warnIfContainerAlreadyRoot(container, {
      console: {
        error(message) {
          warningMessages.push(message);
        }
      },
      development: true
    }),
    true
  );
  assert.deepEqual(warningMessages, [rootMarkers.duplicateCreateRootWarning]);
  assert.equal(rootMarkers.getContainerRoot(container), rootOwner);

  const afterMark = rootMarkers.inspectContainerRootMarker(container);
  assert.equal(afterMark.propertyCount, 1);
  assert.equal(afterMark.truthyCount, 1);
  assert.equal(
    afterMark.properties[0].keyPrefix,
    rootMarkers.containerMarkerPrefix
  );

  const replacementRootOwner = {kind: 'FastReactDomReplacementRoot'};
  rootMarkers.markContainerAsRoot(replacementRootOwner, container);
  assert.equal(rootMarkers.getContainerRoot(container), replacementRootOwner);
  const afterDuplicateMark = rootMarkers.inspectContainerRootMarker(container);
  assert.equal(afterDuplicateMark.propertyCount, 1);
  assert.equal(afterDuplicateMark.truthyCount, 1);
  assert.equal(afterDuplicateMark.nullCount, 0);

  rootMarkers.unmarkContainerAsRoot(container);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(rootMarkers.getCreateRootWarning(container), null);
  const afterUnmount = rootMarkers.inspectContainerRootMarker(container);
  assert.equal(afterUnmount.propertyCount, 1);
  assert.equal(afterUnmount.nullCount, 1);

  rootMarkers.markContainerAsRoot(rootOwner, container);
  assert.equal(rootMarkers.getContainerRoot(container), rootOwner);
  const afterRemark = rootMarkers.inspectContainerRootMarker(container);
  assert.equal(afterRemark.propertyCount, 1);
  assert.equal(afterRemark.truthyCount, 1);
  rootMarkers.unmarkContainerAsRoot(container);

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
  assert.equal(listenerRegistry.getEventListenerSet(container).size, 138);
  assert.equal(listenerRegistry.getEventListenerSet(document).size, 1);

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
  assert.equal(documentRootSummary.listenerCount, 139);
  assert.equal(
    documentRootSummary.byEvent.get('selectionchange').bubble,
    1
  );
  assert.equal(documentRootSummary.byEvent.get('click').capture, 1);
  assert.equal(documentRootSummary.byEvent.get('click').bubble, 1);
}

{
  const document = createDocument('listener-once');
  const container = createElement('DIV', document);

  const firstClickBubble = rootListeners.listenToNativeEvent(
    'click',
    false,
    container
  );
  assert.equal(firstClickBubble.__FAST_REACT_DOM_EVENT_SHELL__, true);
  assert.equal(firstClickBubble.__FAST_REACT_DOM_EVENT_NAME__, 'click');
  assert.equal(firstClickBubble.__FAST_REACT_DOM_EVENT_FLAGS__, 0);
  assert.equal(firstClickBubble.__FAST_REACT_DOM_EVENT_TARGET__, container);
  assertListenerWrapperRecord(firstClickBubble, {
    domEventName: 'click',
    eventPriorityName: 'DiscreteEventPriority',
    target: container,
    wrapperKind: eventListener.DISCRETE_EVENT_WRAPPER
  });
  assert.equal(container.__registrations.length, 1);
  assert.equal(
    rootListeners.listenToNativeEvent('click', false, container),
    null
  );
  assert.equal(container.__registrations.length, 1);

  const firstClickCapture = rootListeners.listenToNativeEvent(
    'click',
    true,
    container
  );
  assert.equal(
    firstClickCapture.__FAST_REACT_DOM_EVENT_FLAGS__,
    rootListeners.IS_CAPTURE_PHASE
  );
  assertListenerWrapperRecord(firstClickCapture, {
    domEventName: 'click',
    eventPriorityName: 'DiscreteEventPriority',
    target: container,
    wrapperKind: eventListener.DISCRETE_EVENT_WRAPPER
  });
  assert.equal(container.__registrations.length, 2);
  assert.equal(
    rootListeners.listenToNativeEvent('click', true, container),
    null
  );
  assert.equal(container.__registrations.length, 2);

  rootListeners.listenToAllSupportedEvents(container);
  assertRootListenerSet(container, 'pre-seeded listener-once root');
  assert.equal(listenerRegistry.getEventListenerSet(container).size, 138);
  assertSelectionChangeOnlyOnDocument(document);

  rootListeners.listenToAllSupportedEvents(container);
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);
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
  assert.equal(listener.__FAST_REACT_DOM_EVENT_NAME__, 'click');
  assert.equal(listener.__FAST_REACT_DOM_EVENT_FLAGS__, 0);
  assert.equal(listener.__FAST_REACT_DOM_EVENT_TARGET__, button);
  assertListenerWrapperRecord(listener, {
    domEventName: 'click',
    eventPriorityName: 'DiscreteEventPriority',
    target: button,
    wrapperKind: eventListener.DISCRETE_EVENT_WRAPPER
  });
  assert.equal(rootListeners.listenToNativeEvent('click', false, button), null);
  assert.equal(
    button.__registrations.filter(
      (entry) => entry.type === 'click' && entry.capture === false
    ).length,
    1
  );

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

function assertReactDomClientPlaceholder() {
  assert.deepEqual(Object.keys(reactDomClient), [
    'createRoot',
    'hydrateRoot',
    'version'
  ]);
  assert.equal(reactDomClient.__FAST_REACT_PLACEHOLDER__, true);
  assert.equal(reactDomClient.__FAST_REACT_ENTRYPOINT__, 'react-dom/client');
  assert.equal(reactDomClient.compatibilityTarget, 'react-dom@19.2.6');
  assert.equal(
    Object.keys(reactDomClient).includes('__FAST_REACT_PLACEHOLDER__'),
    false
  );
  assert.equal(
    Object.keys(reactDomClient).includes('compatibilityTarget'),
    false
  );
  assert.equal(
    reactDomClient.version,
    '0.0.0-fast-react-dom-placeholder'
  );

  const document = createDocument('public-placeholder');
  const container = createElement('DIV', document);
  for (const exportName of ['createRoot', 'hydrateRoot']) {
    const fn = reactDomClient[exportName];
    assert.equal(typeof fn, 'function', exportName);
    assert.equal(fn.name, exportName, exportName);
    assert.equal(fn.length, 0, exportName);
    assert.throws(
      () => fn(container),
      (error) => {
        assert.equal(error.name, 'FastReactDomUnimplementedError', exportName);
        assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED', exportName);
        assert.equal(error.entrypoint, 'react-dom/client', exportName);
        assert.equal(error.exportName, exportName, exportName);
        assert.equal(
          error.compatibilityTarget,
          'react-dom@19.2.6',
          exportName
        );
        return true;
      }
    );
  }
  assert.deepEqual(rootMarkers.inspectContainerRootMarker(container), {
    inspectable: true,
    nullCount: 0,
    properties: [],
    propertyCount: 0,
    truthyCount: 0
  });
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
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

  for (const registration of target.__registrations) {
    assertListenerWrapperRecord(registration.listener, {
      domEventName: registration.type,
      eventPriorityName: eventPriorities.getEventPriorityName(
        eventPriorities.getEventPriority(registration.type)
      ),
      target,
      wrapperKind: expectedWrapperKind(registration.type)
    });
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

function assertListenerWrapperRecord(
  listener,
  {domEventName, eventPriorityName, target, wrapperKind}
) {
  const record = listener.__FAST_REACT_DOM_EVENT_SHELL_WRAPPER_RECORD__;
  assert.equal(listener.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__, record);
  assert.equal(Object.isFrozen(record), true);
  assert.equal(record.kind, eventListener.EVENT_WRAPPER_RECORD_KIND);
  assert.equal(record.domEventName, domEventName);
  assert.equal(record.eventPriorityName, eventPriorityName);
  assert.equal(record.wrapperKind, wrapperKind);
  assert.equal(record.targetContainer, target);
  assert.equal(record.listener, listener);
  assert.equal(record.priorityRecord.eventPriorityName, eventPriorityName);
}

function expectedWrapperKind(domEventName) {
  const eventPriority = eventPriorities.getEventPriority(domEventName);
  if (eventPriority === eventPriorities.DiscreteEventPriority) {
    return eventListener.DISCRETE_EVENT_WRAPPER;
  }
  if (eventPriority === eventPriorities.ContinuousEventPriority) {
    return eventListener.CONTINUOUS_EVENT_WRAPPER;
  }
  return eventListener.DEFAULT_EVENT_WRAPPER;
}
