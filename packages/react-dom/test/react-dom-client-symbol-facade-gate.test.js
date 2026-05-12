'use strict';

const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const React = require(path.resolve(packageRoot, '..', 'react', 'index.js'));
const reactDomClient = require(path.join(packageRoot, 'client.js'));
const profiling = require(path.join(packageRoot, 'profiling.js'));
const packageJson = require(path.join(packageRoot, 'package.json'));
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
  ELEMENT_NODE,
  TEXT_NODE
} = require(path.join(packageRoot, 'src/client/dom-container.js'));

const privateFacadeSymbols = Object.freeze([
  rootBridge.privateRootPublicFacadeAdapterSymbol,
  rootBridge.privateRootPublicFacadePreflightSymbol,
  rootBridge.privateHydrateRootPublicFacadePreflightSymbol
]);
const compatibilityClaimKeys = Object.freeze([
  'behaviorCompatibilityClaimed',
  'compatibilityClaimed',
  'nativeExecution',
  'publicCreateRootEnabled',
  'publicHydrateRootEnabled',
  'publicRootCompatibilitySurface',
  'publicRootObjectExposed',
  'reactDomCompatibilityClaimed',
  'schedulerCompatibilityClaimed'
]);

test('react-dom/client private facade symbols are non-enumerable descriptor-stable gates', () => {
  assert.deepEqual(Object.keys(reactDomClient), [
    'createRoot',
    'hydrateRoot',
    'version'
  ]);
  assert.deepEqual(Object.getOwnPropertySymbols(reactDomClient), []);
  assertNoPrivateFacadeSymbols(reactDomClient);
  assertNoEnumerableSymbols(reactDomClient.createRoot);
  assertNoEnumerableSymbols(reactDomClient.hydrateRoot);
  assert.equal(reactDomClient.createRoot.length, 0);
  assert.equal(reactDomClient.hydrateRoot.length, 0);
  assert.equal(
    reactDomClient.version,
    '0.0.0-fast-react-dom-placeholder'
  );

  assert.deepEqual(Object.getOwnPropertySymbols(reactDomClient.createRoot), [
    rootBridge.privateRootPublicFacadeAdapterSymbol,
    rootBridge.privateRootPublicFacadePreflightSymbol
  ]);
  assert.deepEqual(Object.getOwnPropertySymbols(reactDomClient.hydrateRoot), [
    rootBridge.privateHydrateRootPublicFacadePreflightSymbol
  ]);

  assertStablePrivateFacadeDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol,
    rootBridge.createPrivateRootPublicFacadeAdapter,
    'fast.react_dom.client.private_root_public_facade_adapter'
  );
  assertStablePrivateFacadeDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadePreflightSymbol,
    rootBridge.createPrivateRootPublicFacadePreflight,
    'fast.react_dom.client.private_root_public_facade_preflight'
  );
  assertStablePrivateFacadeDescriptor(
    reactDomClient.hydrateRoot,
    rootBridge.privateHydrateRootPublicFacadePreflightSymbol,
    rootBridge.createPrivateHydrateRootPublicFacadePreflight,
    'fast.react_dom.client.private_hydrate_root_public_facade_preflight'
  );

  assert.equal(
    Object.getOwnPropertyDescriptor(
      reactDomClient.hydrateRoot,
      rootBridge.privateRootPublicFacadeAdapterSymbol
    ),
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(
      reactDomClient.hydrateRoot,
      rootBridge.privateRootPublicFacadePreflightSymbol
    ),
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(
      reactDomClient.createRoot,
      rootBridge.privateHydrateRootPublicFacadePreflightSymbol
    ),
    undefined
  );
});

test('public createRoot exposes only minimal host-output render while hydrateRoot stays blocked', () => {
  const adapter =
    reactDomClient.createRoot[
      rootBridge.privateRootPublicFacadeAdapterSymbol
    ]();
  const preflight =
    reactDomClient.createRoot[
      rootBridge.privateRootPublicFacadePreflightSymbol
    ]();
  const hydratePreflight =
    reactDomClient.hydrateRoot[
      rootBridge.privateHydrateRootPublicFacadePreflightSymbol
    ]();
  const profilingAdapter =
    profiling.createRoot[rootBridge.privateRootPublicFacadeAdapterSymbol]();
  const profilingPreflight =
    profiling.createRoot[rootBridge.privateRootPublicFacadePreflightSymbol]();

  assertPrivateFacadePayloadCounts({
    adapter,
    preflight,
    hydratePreflight,
    expectedRootCount: 0,
    expectedPreflightRecordCount: 0,
    expectedHydrateRecordCount: 0
  });
  assertPrivateRootPublicFacadePayloadCounts({
    adapter: profilingAdapter,
    expectedPreflightRecordCount: 0,
    expectedRootCount: 0,
    preflight: profilingPreflight
  });

  let callbackCalls = 0;
  const createRootBlockedArgumentCases = [
    {
      args: [undefined],
      label: 'undefined-options'
    },
    {
      args: [
        {
          onRecoverableError() {
            callbackCalls++;
          }
        }
      ],
      label: 'recoverable-error-options'
    },
    {
      args: [undefined, 'extra'],
      label: 'undefined-options-extra-argument'
    }
  ];

  for (const blockedCase of createRootBlockedArgumentCases) {
    const createRootOptionsDocument = createDocument(
      `public-create-root-${blockedCase.label}-blocked`
    );
    const createRootOptionsContainer = createElement(
      'DIV',
      createRootOptionsDocument
    );
    let createRootOptionsResult;

    assert.throws(
      () => {
        createRootOptionsResult = reactDomClient.createRoot(
          createRootOptionsContainer,
          ...blockedCase.args
        );
      },
      {
        code: 'FAST_REACT_UNIMPLEMENTED',
        entrypoint: 'react-dom/client',
        exportName: 'createRoot'
      }
    );
    assert.equal(createRootOptionsResult, undefined);
    assertContainerUntouched(
      createRootOptionsContainer,
      createRootOptionsDocument
    );
  }

  assert.equal(callbackCalls, 0);

  const createRootDocument = createDocument('public-create-root-minimal');
  const createRootContainer = createRootDocument.createElement('div');
  const createRootResult = reactDomClient.createRoot(createRootContainer);
  const escapedPublicId = 'app&<>"';

  assert.deepEqual(Object.keys(createRootResult), ['render', 'unmount']);
  assert.equal(createRootResult.render.length, 1);
  assert.equal(createRootResult.unmount.length, 0);
  assert.equal(
    createRootResult.render(
      React.createElement('div', {id: escapedPublicId}, 'hello & < >')
    ),
    undefined
  );
  assert.equal(createRootContainer.childNodes.length, 1);
  assert.equal(createRootContainer.children.length, 1);
  assert.equal(
    createRootContainer.firstElementChild,
    createRootContainer.firstChild
  );
  assert.equal(createRootContainer.firstChild.nodeName, 'DIV');
  assert.equal(createRootContainer.firstChild.tagName, 'DIV');
  assert.equal(
    createRootContainer.firstChild.getAttribute('id'),
    escapedPublicId
  );
  assert.deepEqual([...createRootContainer.firstChild.attributes.entries()], [
    ['id', escapedPublicId]
  ]);
  assert.equal(createRootContainer.firstChild.textContent, 'hello & < >');
  assert.equal(
    createRootContainer.firstChild.innerHTML,
    'hello &amp; &lt; &gt;'
  );
  assert.equal(createRootContainer.textContent, 'hello & < >');
  assert.equal(
    createRootContainer.innerHTML,
    '<div id="app&amp;&lt;&gt;&quot;">hello &amp; &lt; &gt;</div>'
  );
  const initialHostNode = createRootContainer.firstChild;
  assert.throws(
    () => {
      createRootResult.render(
        React.createElement('div', null, 'callback'),
        function unsupportedRenderCallback() {}
      );
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'createRoot().render'
    }
  );
  assert.equal(
    createRootResult.render(
      React.createElement('div', {id: escapedPublicId}, 'again & < >')
    ),
    undefined
  );
  assert.equal(createRootContainer.childNodes.length, 1);
  assert.equal(createRootContainer.children.length, 1);
  assert.equal(createRootContainer.firstElementChild, initialHostNode);
  assert.equal(createRootContainer.firstChild, initialHostNode);
  assert.equal(createRootContainer.firstChild.tagName, 'DIV');
  assert.equal(
    createRootContainer.firstChild.getAttribute('id'),
    escapedPublicId
  );
  assert.deepEqual([...createRootContainer.firstChild.attributes.entries()], [
    ['id', escapedPublicId]
  ]);
  assert.equal(createRootContainer.firstChild.textContent, 'again & < >');
  assert.equal(
    createRootContainer.firstChild.innerHTML,
    'again &amp; &lt; &gt;'
  );
  assert.equal(createRootContainer.textContent, 'again & < >');
  assert.equal(
    createRootContainer.innerHTML,
    '<div id="app&amp;&lt;&gt;&quot;">again &amp; &lt; &gt;</div>'
  );
  assertPublicRenderFailureDoesNotLeak(
    React.createElement('div', {className: 'blocked'}, 'blocked'),
    'unsupported-className-prop'
  );
  assertPublicRenderFailureDoesNotLeak(
    React.createElement('span', null, 'blocked type'),
    'unsupported-type'
  );
  assertPublicRenderFailureDoesNotLeak(
    React.createElement('div', {id: {}}, 'blocked id'),
    'unsupported-id-object'
  );
  assertPublicRenderFailureDoesNotLeak(
    [
      React.createElement('div', null, 'blocked array')
    ],
    'unsupported-array'
  );
  assertPublicRenderFailureDoesNotLeak(
    React.createElement(
      Symbol.for('react.fragment'),
      null,
      React.createElement('div', null, 'blocked fragment')
    ),
    'unsupported-fragment'
  );
  assertPublicRenderFailureDoesNotLeak(
    React.createElement(
      'div',
      null,
      React.createElement('span', null, 'blocked nested')
    ),
    'unsupported-nested'
  );
  assertPublicRenderFailureDoesNotLeak(
    React.createElement(function UnsupportedComponent() {
      return React.createElement('div', null, 'blocked component');
    }),
    'unsupported-component'
  );

  const duplicateRootDocument = createDocument('public-create-root-duplicate');
  const duplicateRootContainer = createElement('DIV', duplicateRootDocument);
  reactDomClient.createRoot(duplicateRootContainer);
  assert.throws(
    () => {
      reactDomClient.createRoot(duplicateRootContainer);
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'createRoot'
    }
  );
  assertContainerUntouched(duplicateRootContainer, duplicateRootDocument);

  const occupiedRootDocument = createDocument('public-create-root-occupied');
  const occupiedRootContainer = createElement('DIV', occupiedRootDocument);
  rootMarkers.markContainerAsRoot({kind: 'occupied'}, occupiedRootContainer);
  assert.throws(
    () => {
      reactDomClient.createRoot(occupiedRootContainer);
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'createRoot'
    }
  );

  assert.equal(createRootResult.unmount(), undefined);
  assert.equal(createRootContainer.childNodes.length, 0);
  assert.equal(createRootContainer.children.length, 0);
  assert.equal(createRootContainer.firstElementChild, null);
  assert.equal(createRootContainer.textContent, '');
  assert.equal(createRootContainer.innerHTML, '');
  assert.throws(
    () => {
      createRootResult.render(React.createElement('div', null, 'stale'));
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'createRoot().render'
    }
  );
  assert.throws(
    () => {
      createRootResult.unmount();
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'createRoot().unmount'
    }
  );
  assert.equal(createRootContainer.childNodes.length, 0);
  assert.equal(createRootContainer.children.length, 0);
  assert.equal(createRootContainer.firstElementChild, null);
  assert.equal(createRootContainer.innerHTML, '');

  const recreatedRoot = reactDomClient.createRoot(createRootContainer);
  assert.equal(
    recreatedRoot.render(React.createElement('div', null, 42)),
    undefined
  );
  assert.equal(createRootContainer.childNodes.length, 1);
  assert.equal(createRootContainer.children.length, 1);
  assert.equal(createRootContainer.firstElementChild, createRootContainer.firstChild);
  assert.equal(createRootContainer.textContent, '42');
  assert.equal(createRootContainer.innerHTML, '<div>42</div>');
  assert.equal(recreatedRoot.unmount(), undefined);
  assert.equal(createRootContainer.childNodes.length, 0);
  assert.equal(createRootContainer.children.length, 0);
  assert.equal(createRootContainer.firstElementChild, null);
  assert.equal(createRootContainer.innerHTML, '');

  const hydrateRootDocument = createDocument('public-hydrate-root-placeholder');
  const hydrateRootContainer = createElement('DIV', hydrateRootDocument);
  let hydrateRootResult;
  let recoverableErrorCalls = 0;

  assert.throws(
    () => {
      hydrateRootResult = reactDomClient.hydrateRoot(
        hydrateRootContainer,
        {
          props: {
            children: 'public hydration remains blocked'
          },
          type: 'span'
        },
        {
          onRecoverableError() {
            recoverableErrorCalls++;
          }
        }
      );
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'hydrateRoot'
    }
  );
  assert.equal(hydrateRootResult, undefined);
  assert.equal(recoverableErrorCalls, 0);
  assertContainerUntouched(hydrateRootContainer, hydrateRootDocument);

  const profilingCreateRootDocument = createDocument(
    'public-profiling-create-root-placeholder'
  );
  const profilingCreateRootContainer = createElement(
    'DIV',
    profilingCreateRootDocument
  );
  let profilingCreateRootResult;
  let profilingCallbackCalls = 0;

  assert.throws(
    () => {
      profilingCreateRootResult = profiling.createRoot(
        profilingCreateRootContainer,
        {
          onRecoverableError() {
            profilingCallbackCalls++;
          }
        }
      );
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/profiling',
      exportName: 'createRoot'
    }
  );
  assert.equal(profilingCreateRootResult, undefined);
  assert.equal(profilingCallbackCalls, 0);
  assert.equal(typeof profilingCreateRootResult?.render, 'undefined');
  assertContainerUntouched(
    profilingCreateRootContainer,
    profilingCreateRootDocument
  );

  assertPrivateFacadePayloadCounts({
    adapter,
    preflight,
    hydratePreflight,
    expectedRootCount: 0,
    expectedPreflightRecordCount: 0,
    expectedHydrateRecordCount: 0
  });
  assertPrivateRootPublicFacadePayloadCounts({
    adapter: profilingAdapter,
    expectedPreflightRecordCount: 0,
    expectedRootCount: 0,
    preflight: profilingPreflight
  });
  assertNoCompatibilityClaims(reactDomClient);
  assertNoCompatibilityClaims(profiling);
  assert.equal(Object.hasOwn(reactDomClient, 'unstable_batchedUpdates'), false);
});

test('public createRoot invokes only the private adapter factory while other public placeholders stay inert', () => {
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      [
        '-e',
        createLifecycleFactorySpyScript(packageRoot)
      ],
      {
        encoding: 'utf8'
      }
    )
  );

  assert.deepEqual(result.factoryCalls, [
    'createPrivateRootPublicFacadeAdapter',
    'adapter.createRoot'
  ]);
  assert.deepEqual(result.publicCalls, [
    {
      label: 'createRoot',
      status: 'ok'
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'hydrateRoot',
      label: 'hydrateRoot',
      status: 'throws'
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/profiling',
      exportName: 'createRoot',
      label: 'profiling.createRoot',
      status: 'throws'
    }
  ]);
  assert.equal(result.createRootAdapterDescriptorUsesSpy, true);
  assert.equal(result.createRootPreflightDescriptorUsesSpy, true);
  assert.equal(result.hydrateRootPreflightDescriptorUsesSpy, true);
  assert.equal(result.profilingCreateRootAdapterDescriptorUsesSpy, true);
  assert.equal(result.profilingCreateRootPreflightDescriptorUsesSpy, true);
  assert.deepEqual(result.sideEffects, {
    createRootDocumentListenerCount: 0,
    createRootDocumentMutationCount: 0,
    createRootListenerCount: 0,
    createRootMutationCount: 0,
    hydrateRootDocumentListenerCount: 0,
    hydrateRootDocumentMutationCount: 0,
    hydrateRootListenerCount: 0,
    hydrateRootMutationCount: 0,
    profilingCreateRootDocumentListenerCount: 0,
    profilingCreateRootDocumentMutationCount: 0,
    profilingCreateRootListenerCount: 0,
    profilingCreateRootMutationCount: 0
  });
});

test('profiling createRoot private facade symbols are descriptor-stable without hydrate parity or claims', () => {
  assert.deepEqual(Object.keys(profiling), [
    '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
    'createPortal',
    'createRoot',
    'flushSync',
    'hydrateRoot',
    'preconnect',
    'prefetchDNS',
    'preinit',
    'preinitModule',
    'preload',
    'preloadModule',
    'requestFormReset',
    'unstable_batchedUpdates',
    'useFormState',
    'useFormStatus',
    'version'
  ]);
  assertNoPrivateFacadeSymbols(profiling);
  assertNoPrivateFacadeSymbols(profiling.hydrateRoot);
  assert.deepEqual(Object.getOwnPropertySymbols(profiling), []);
  assertNoEnumerableSymbols(profiling.createRoot);
  assert.deepEqual(Object.getOwnPropertySymbols(profiling.createRoot), [
    rootBridge.privateRootPublicFacadeAdapterSymbol,
    rootBridge.privateRootPublicFacadePreflightSymbol
  ]);
  assert.deepEqual(Object.getOwnPropertySymbols(profiling.hydrateRoot), []);
  assert.equal(profiling.createRoot.length, 2);
  assert.equal(profiling.hydrateRoot.length, 3);
  assert.equal(profiling.version, '19.2.6');

  assertStablePrivateFacadeDescriptor(
    profiling.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol,
    rootBridge.createPrivateRootPublicFacadeAdapter,
    'fast.react_dom.client.private_root_public_facade_adapter'
  );
  assertStablePrivateFacadeDescriptor(
    profiling.createRoot,
    rootBridge.privateRootPublicFacadePreflightSymbol,
    rootBridge.createPrivateRootPublicFacadePreflight,
    'fast.react_dom.client.private_root_public_facade_preflight'
  );

  assert.equal(
    Object.getOwnPropertyDescriptor(
      profiling.hydrateRoot,
      rootBridge.privateHydrateRootPublicFacadePreflightSymbol
    ),
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(
      profiling.createRoot,
      rootBridge.privateHydrateRootPublicFacadePreflightSymbol
    ),
    undefined
  );
  assertNoCompatibilityClaims(profiling);

  assert.throws(
    () => require(path.join(packageRoot, 'client.react-server.js')),
    {
      code: 'FAST_REACT_REACT_SERVER_UNSUPPORTED',
      entrypoint: 'react-dom/client'
    }
  );
  assert.throws(
    () => require(path.join(packageRoot, 'profiling.react-server.js')),
    {
      code: 'FAST_REACT_REACT_SERVER_UNSUPPORTED',
      entrypoint: 'react-dom/profiling'
    }
  );

  for (const key of compatibilityClaimKeys) {
    assert.notEqual(packageJson[key], true, `package.json ${key}`);
  }
});

function assertStablePrivateFacadeDescriptor(owner, symbol, value, symbolKey) {
  const descriptor = Object.getOwnPropertyDescriptor(owner, symbol);
  assert.deepEqual(descriptor, {
    configurable: false,
    enumerable: false,
    value,
    writable: false
  });
  assert.equal(Symbol.keyFor(symbol), symbolKey);
  assert.equal(Object.prototype.propertyIsEnumerable.call(owner, symbol), false);

  assert.throws(() => {
    owner[symbol] = function poisonedPrivateFacadeFactory() {};
  }, TypeError);
  assert.throws(() => {
    Object.defineProperty(owner, symbol, {
      enumerable: true
    });
  }, TypeError);
  assert.deepEqual(Object.getOwnPropertyDescriptor(owner, symbol), descriptor);
}

function assertNoPrivateFacadeSymbols(owner) {
  for (const symbol of privateFacadeSymbols) {
    assert.equal(Object.getOwnPropertyDescriptor(owner, symbol), undefined);
  }
}

function assertNoEnumerableSymbols(owner) {
  const enumerableSymbols = Object.getOwnPropertySymbols(owner).filter(
    (symbol) => Object.getOwnPropertyDescriptor(owner, symbol).enumerable
  );
  assert.deepEqual(enumerableSymbols, []);
  assert.deepEqual(Object.getOwnPropertySymbols(Object.assign({}, owner)), []);
}

function assertNoCompatibilityClaims(source) {
  for (const key of compatibilityClaimKeys) {
    assert.notEqual(source[key], true, key);
  }
}

function assertPrivateFacadePayloadCounts({
  adapter,
  preflight,
  hydratePreflight,
  expectedRootCount,
  expectedPreflightRecordCount,
  expectedHydrateRecordCount
}) {
  assertPrivateRootPublicFacadePayloadCounts({
    adapter,
    expectedPreflightRecordCount,
    expectedRootCount,
    preflight
  });
  const hydratePreflightPayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(
      hydratePreflight
    );
  assert.equal(
    hydratePreflightPayload.preflightRecordCount,
    expectedHydrateRecordCount
  );
  assert.equal(
    hydratePreflightPayload.lifecycleRequestBoundaryRecordCount,
    expectedHydrateRecordCount
  );
  assert.equal(
    hydratePreflightPayload.markerListenerPreflightRecordCount,
    expectedHydrateRecordCount
  );
}

function assertPrivateRootPublicFacadePayloadCounts({
  adapter,
  preflight,
  expectedRootCount,
  expectedPreflightRecordCount
}) {
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeAdapterPayload(adapter).rootCount,
    expectedRootCount
  );
  const preflightPayload =
    rootBridge.getPrivateRootPublicFacadePreflightPayload(preflight);
  assert.equal(preflightPayload.rootCount, expectedRootCount);
  assert.equal(
    preflightPayload.preflightRecordCount,
    expectedPreflightRecordCount
  );
}

function assertContainerUntouched(container, document) {
  assert.equal(container.childNodes.length, 0);
  assert.equal(container.children.length, 0);
  assert.equal(container.firstElementChild, null);
  assert.equal(container.innerHTML, '');
  assert.equal(container.textContent, '');
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

function assertPublicRenderFailureDoesNotLeak(element, label) {
  const document = createDocument(`public-create-root-${label}`);
  const container = document.createElement('div');
  document.__mutationLog.length = 0;
  const root = reactDomClient.createRoot(container);

  assert.throws(
    () => {
      root.render(element);
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'createRoot().render'
    }
  );
  assert.equal(container.childNodes.length, 0);
  assert.equal(container.children.length, 0);
  assert.equal(container.firstElementChild, null);
  assert.equal(container.innerHTML, '');
  assert.equal(container.textContent, '');
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
  document.defaultView = createEventTarget({
    label: `${label}-window`,
    nodeName: 'window'
  });
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
    attributes: new Map(),
    nodeName,
    nodeType: ELEMENT_NODE,
    ownerDocument
  });
}

function createTextNode(text, ownerDocument) {
  const target = createEventTarget({
    nodeName: '#text',
    nodeType: 3,
    ownerDocument
  });
  let textValue = String(text);
  Object.defineProperties(target, {
    data: {
      configurable: true,
      enumerable: true,
      get() {
        return textValue;
      },
      set(value) {
        textValue = String(value);
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
      }
    }
  });
  return target;
}

function createEventTarget(fields) {
  const target = {
    ...fields,
    attributeLog: [],
    attributes: fields.attributes || new Map(),
    childNodes: [],
    __mutationLog: [],
    __removals: [],
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({listener, options, type});
    },
    removeEventListener(type, listener, options) {
      const index = this.__registrations.findIndex(
        (entry) =>
          entry.listener === listener &&
          entry.options === options &&
          entry.type === type
      );
      if (index !== -1) {
        this.__registrations.splice(index, 1);
      }
      this.__removals.push({listener, options, type});
    },
    appendChild(child) {
      detachChildFromParent(child);
      this.childNodes.push(child);
      child.parentNode = this;
      this.__mutationLog.push({child, type: 'appendChild'});
      return child;
    },
    insertBefore(child, beforeChild) {
      const index = this.childNodes.indexOf(beforeChild);
      this.childNodes.splice(index, 0, child);
      child.parentNode = this;
      this.__mutationLog.push({beforeChild, child, type: 'insertBefore'});
      return child;
    },
    removeChild(child) {
      detachChildFromParent(child);
      child.parentNode = null;
      this.__mutationLog.push({child, type: 'removeChild'});
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
    getAttribute(name) {
      const attributeName = String(name);
      return this.attributes.has(attributeName)
        ? this.attributes.get(attributeName)
        : null;
    }
  };
  let textContent = '';
  Object.defineProperties(target, {
    children: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes.filter(isFakeDomElementNode);
      }
    },
    firstChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[0] || null;
      }
    },
    firstElementChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.children[0] || null;
      }
    },
    innerHTML: {
      configurable: true,
      enumerable: true,
      get() {
        if (this.childNodes.length > 0) {
          return this.childNodes.map(serializeFakeDomNode).join('');
        }
        return escapeFakeDomText(this.textContent);
      }
    },
    tagName: {
      configurable: true,
      enumerable: true,
      get() {
        return this.nodeType === ELEMENT_NODE ? this.nodeName : undefined;
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
      }
    }
  });
  return target;
}

function isFakeDomElementNode(node) {
  return node?.nodeType === ELEMENT_NODE;
}

function serializeFakeDomNode(node) {
  if (node?.nodeType === TEXT_NODE) {
    return escapeFakeDomText(node.textContent);
  }
  if (isFakeDomElementNode(node)) {
    const tagName = String(node.nodeName).toLowerCase();
    return `<${tagName}${serializeFakeDomAttributes(node)}>${node.innerHTML}</${tagName}>`;
  }
  return '';
}

function serializeFakeDomAttributes(node) {
  if (!(node.attributes instanceof Map) || node.attributes.size === 0) {
    return '';
  }
  return [...node.attributes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([name, value]) =>
        ` ${name}="${escapeFakeDomAttributeValue(String(value))}"`
    )
    .join('');
}

function escapeFakeDomText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeFakeDomAttributeValue(value) {
  return escapeFakeDomText(value).replaceAll('"', '&quot;');
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

function createLifecycleFactorySpyScript(packageRootPath) {
  return `
'use strict';

const path = require('node:path');
const packageRoot = ${JSON.stringify(packageRootPath)};
const rootBridgePath = path.join(packageRoot, 'src/client/root-bridge.js');
const rootBridgeCacheKey = require.resolve(rootBridgePath);
const factoryCalls = [];

const rootBridge = Object.freeze({
  privateRootPublicFacadeAdapterSymbol: Symbol.for(
    'fast.react_dom.client.private_root_public_facade_adapter'
  ),
  privateRootPublicFacadePreflightSymbol: Symbol.for(
    'fast.react_dom.client.private_root_public_facade_preflight'
  ),
  privateHydrateRootPublicFacadePreflightSymbol: Symbol.for(
    'fast.react_dom.client.private_hydrate_root_public_facade_preflight'
  ),
  createPrivateRootPublicFacadeAdapter: createPrivateLifecycleFacadeFactorySpy(
    'createPrivateRootPublicFacadeAdapter'
  ),
  createPrivateRootPublicFacadePreflight:
    createPrivateLifecycleFacadeFactorySpy(
      'createPrivateRootPublicFacadePreflight'
    ),
  createPrivateHydrateRootPublicFacadePreflight:
    createPrivateLifecycleFacadeFactorySpy(
      'createPrivateHydrateRootPublicFacadePreflight'
    )
});

require.cache[rootBridgeCacheKey] = {
  id: rootBridgeCacheKey,
  filename: rootBridgeCacheKey,
  loaded: true,
  exports: rootBridge
};

function createPrivateLifecycleFacadeFactorySpy(key) {
  return function privateLifecycleFacadeFactorySpy(...args) {
    factoryCalls.push(key);
    if (key === 'createPrivateRootPublicFacadeAdapter') {
      return {
        args,
        createRoot() {
          factoryCalls.push('adapter.createRoot');
          return {
            render() {
              factoryCalls.push('root.render');
            },
            unmount() {
              factoryCalls.push('root.unmount');
            }
          };
        },
        key
      };
    }
    return {args, key};
  };
}

const client = require(path.join(packageRoot, 'client.js'));
const profiling = require(path.join(packageRoot, 'profiling.js'));
const createRootDocument = createDocument('spy-create-root');
const createRootContainer = createElement('DIV', createRootDocument);
const hydrateRootDocument = createDocument('spy-hydrate-root');
const hydrateRootContainer = createElement('DIV', hydrateRootDocument);
const profilingCreateRootDocument = createDocument('spy-profiling-create-root');
const profilingCreateRootContainer = createElement(
  'DIV',
  profilingCreateRootDocument
);
const publicCalls = [];

recordPublicCall('createRoot', () => client.createRoot(createRootContainer));
recordPublicCall('hydrateRoot', () =>
  client.hydrateRoot(hydrateRootContainer, 'hydrated text', {
    onRecoverableError() {
      factoryCalls.push('onRecoverableError');
    }
  })
);
recordPublicCall('profiling.createRoot', () =>
  profiling.createRoot(profilingCreateRootContainer, {
    onRecoverableError() {
      factoryCalls.push('profilingOnRecoverableError');
    }
  })
);

process.stdout.write(JSON.stringify({
  factoryCalls,
  publicCalls,
  createRootAdapterDescriptorUsesSpy:
    Object.getOwnPropertyDescriptor(
      client.createRoot,
      rootBridge.privateRootPublicFacadeAdapterSymbol
    ).value === rootBridge.createPrivateRootPublicFacadeAdapter,
  createRootPreflightDescriptorUsesSpy:
    Object.getOwnPropertyDescriptor(
      client.createRoot,
      rootBridge.privateRootPublicFacadePreflightSymbol
    ).value === rootBridge.createPrivateRootPublicFacadePreflight,
  hydrateRootPreflightDescriptorUsesSpy:
    Object.getOwnPropertyDescriptor(
      client.hydrateRoot,
      rootBridge.privateHydrateRootPublicFacadePreflightSymbol
    ).value === rootBridge.createPrivateHydrateRootPublicFacadePreflight,
  profilingCreateRootAdapterDescriptorUsesSpy:
    Object.getOwnPropertyDescriptor(
      profiling.createRoot,
      rootBridge.privateRootPublicFacadeAdapterSymbol
    ).value === rootBridge.createPrivateRootPublicFacadeAdapter,
  profilingCreateRootPreflightDescriptorUsesSpy:
    Object.getOwnPropertyDescriptor(
      profiling.createRoot,
      rootBridge.privateRootPublicFacadePreflightSymbol
    ).value === rootBridge.createPrivateRootPublicFacadePreflight,
  sideEffects: {
    createRootDocumentListenerCount: createRootDocument.__registrations.length,
    createRootDocumentMutationCount: createRootDocument.__mutationLog.length,
    createRootListenerCount: createRootContainer.__registrations.length,
    createRootMutationCount: createRootContainer.__mutationLog.length,
    hydrateRootDocumentListenerCount:
      hydrateRootDocument.__registrations.length,
    hydrateRootDocumentMutationCount: hydrateRootDocument.__mutationLog.length,
    hydrateRootListenerCount: hydrateRootContainer.__registrations.length,
    hydrateRootMutationCount: hydrateRootContainer.__mutationLog.length,
    profilingCreateRootDocumentListenerCount:
      profilingCreateRootDocument.__registrations.length,
    profilingCreateRootDocumentMutationCount:
      profilingCreateRootDocument.__mutationLog.length,
    profilingCreateRootListenerCount:
      profilingCreateRootContainer.__registrations.length,
    profilingCreateRootMutationCount:
      profilingCreateRootContainer.__mutationLog.length
  }
}));

function recordPublicCall(label, fn) {
  try {
    fn();
    publicCalls.push({label, status: 'ok'});
  } catch (error) {
    publicCalls.push({
      code: error.code,
      entrypoint: error.entrypoint,
      exportName: error.exportName,
      label,
      status: 'throws'
    });
  }
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: '#document',
    nodeType: 9
  });
  document.ownerDocument = document;
  document.defaultView = createEventTarget({
    label: \`\${label}-window\`,
    nodeName: 'window'
  });
  return document;
}

function createElement(nodeName, ownerDocument) {
  return createEventTarget({
    nodeName,
    nodeType: 1,
    ownerDocument
  });
}

function createEventTarget(fields) {
  return {
    ...fields,
    childNodes: [],
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({listener, options, type});
    },
    appendChild(child) {
      this.childNodes.push(child);
      child.parentNode = this;
      this.__mutationLog.push({child, type: 'appendChild'});
      return child;
    }
  };
}
`;
}
