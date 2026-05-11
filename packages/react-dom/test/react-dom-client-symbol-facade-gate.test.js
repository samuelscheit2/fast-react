'use strict';

const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
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
  ELEMENT_NODE
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

test('public createRoot and hydrateRoot placeholders throw before root or DOM side effects', () => {
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

  const createRootDocument = createDocument('public-create-root-placeholder');
  const createRootContainer = createElement('DIV', createRootDocument);
  let createRootResult;
  let callbackCalls = 0;

  assert.throws(
    () => {
      createRootResult = reactDomClient.createRoot(createRootContainer, {
        onRecoverableError() {
          callbackCalls++;
        }
      });
    },
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'createRoot'
    }
  );
  assert.equal(createRootResult, undefined);
  assert.equal(callbackCalls, 0);
  assert.equal(typeof createRootResult?.render, 'undefined');
  assertContainerUntouched(createRootContainer, createRootDocument);

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

test('public placeholders do not invoke private lifecycle facade factories', () => {
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

  assert.deepEqual(result.factoryCalls, []);
  assert.deepEqual(result.publicCalls, [
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'createRoot',
      label: 'createRoot',
      status: 'throws'
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
    childNodes: [],
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({listener, options, type});
    },
    removeEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        removed: true,
        type
      });
    },
    appendChild(child) {
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
      const index = this.childNodes.indexOf(child);
      if (index !== -1) {
        this.childNodes.splice(index, 1);
      }
      child.parentNode = null;
      this.__mutationLog.push({child, type: 'removeChild'});
      return child;
    }
  };
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
