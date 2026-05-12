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
const componentTree = require(path.join(
  packageRoot,
  'src/client/component-tree.js'
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
const publicRenderCapabilityRejectionLabels = Object.freeze([
  'unsupported-onClick-prop',
  'unsupported-onClickCapture-prop',
  'unsupported-onSubmit-prop',
  'unsupported-onChange-prop',
  'unsupported-callback-ref-prop',
  'unsupported-object-ref-prop',
  'unsupported-className-prop',
  'unsupported-style-prop',
  'unsupported-dangerouslySetInnerHTML-prop',
  'unsupported-keyed-div',
  'unsupported-span-type',
  'unsupported-nested-child',
  'unsupported-fragment',
  'unsupported-array',
  'unsupported-suppressHydrationWarning-prop',
  'unsupported-id-object',
  'unsupported-link-resource-type',
  'unsupported-script-resource-type',
  'unsupported-style-resource-type',
  'unsupported-form-type',
  'unsupported-input-type',
  'unsupported-button-type',
  'unsupported-textarea-type',
  'unsupported-action-prop',
  'unsupported-formAction-prop',
  'unsupported-value-prop',
  'unsupported-defaultValue-prop',
  'unsupported-checked-prop',
  'unsupported-name-prop',
  'unsupported-type-prop',
  'unsupported-component',
  'unsupported-memo-component',
  'unsupported-forwardRef-component',
  'unsupported-lazy-component'
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
  const updatedEscapedPublicId = 'next&<>"';
  const removedPublicIdText = 'id removed & < >';
  const initialPublicElement = React.createElement(
    'div',
    {id: escapedPublicId},
    'hello & < >'
  );
  const updatedPublicElement = React.createElement(
    'div',
    {id: updatedEscapedPublicId},
    'again & < >'
  );
  const idRemovalPublicElement = React.createElement(
    'div',
    null,
    removedPublicIdText
  );

  assert.deepEqual(Object.keys(createRootResult), ['render', 'unmount']);
  assert.equal(createRootResult.render.length, 1);
  assert.equal(createRootResult.unmount.length, 0);
  assert.equal(
    createRootResult.render(initialPublicElement),
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
  assert.equal(
    componentTree.getLatestPropsFromNode(createRootContainer.firstChild),
    initialPublicElement.props
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(createRootContainer.firstChild).id,
    escapedPublicId
  );
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
  assertNoRootMarkerOrListenerLeak(createRootContainer, createRootDocument);
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
    createRootResult.render(updatedPublicElement),
    undefined
  );
  assert.equal(createRootContainer.childNodes.length, 1);
  assert.equal(createRootContainer.children.length, 1);
  assert.equal(createRootContainer.firstElementChild, initialHostNode);
  assert.equal(createRootContainer.firstChild, initialHostNode);
  assert.equal(createRootContainer.firstChild.tagName, 'DIV');
  assert.equal(
    createRootContainer.firstChild.getAttribute('id'),
    updatedEscapedPublicId
  );
  assert.deepEqual([...createRootContainer.firstChild.attributes.entries()], [
    ['id', updatedEscapedPublicId]
  ]);
  assert.equal(
    componentTree.getLatestPropsFromNode(createRootContainer.firstChild),
    updatedPublicElement.props
  );
  assert.notEqual(
    componentTree.getLatestPropsFromNode(createRootContainer.firstChild),
    initialPublicElement.props
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(createRootContainer.firstChild).id,
    updatedEscapedPublicId
  );
  assert.equal(createRootContainer.firstChild.textContent, 'again & < >');
  assert.equal(
    createRootContainer.firstChild.innerHTML,
    'again &amp; &lt; &gt;'
  );
  assert.equal(createRootContainer.textContent, 'again & < >');
  assert.equal(
    createRootContainer.innerHTML,
    '<div id="next&amp;&lt;&gt;&quot;">again &amp; &lt; &gt;</div>'
  );
  assertNoRootMarkerOrListenerLeak(createRootContainer, createRootDocument);
  assert.equal(
    createRootResult.render(idRemovalPublicElement),
    undefined
  );
  assert.equal(createRootContainer.childNodes.length, 1);
  assert.equal(createRootContainer.children.length, 1);
  assert.equal(createRootContainer.firstElementChild, initialHostNode);
  assert.equal(createRootContainer.firstChild, initialHostNode);
  assert.equal(createRootContainer.firstChild.tagName, 'DIV');
  assert.equal(createRootContainer.firstChild.getAttribute('id'), null);
  assert.deepEqual([...createRootContainer.firstChild.attributes.entries()], []);
  assert.equal(
    componentTree.getLatestPropsFromNode(createRootContainer.firstChild),
    idRemovalPublicElement.props
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      componentTree.getLatestPropsFromNode(createRootContainer.firstChild),
      'id'
    ),
    false
  );
  assert.equal(createRootContainer.firstChild.textContent, removedPublicIdText);
  assert.equal(
    createRootContainer.firstChild.innerHTML,
    'id removed &amp; &lt; &gt;'
  );
  assert.equal(createRootContainer.textContent, removedPublicIdText);
  assert.equal(
    createRootContainer.innerHTML,
    '<div>id removed &amp; &lt; &gt;</div>'
  );
  assertNoRootMarkerOrListenerLeak(createRootContainer, createRootDocument);
  for (const createCase of createPublicRenderCapabilityRejectionCaseFactories()) {
    const freshCase = createCase();
    assertPublicRenderFailureDoesNotLeak(
      freshCase.element,
      freshCase.label,
      freshCase.assertNoCapabilityEffects
    );
    const updateCase = createCase();
    assertPublicRenderUpdateFailureDoesNotLeak(
      updateCase.element,
      updateCase.label,
      updateCase.assertNoCapabilityEffects
    );
  }

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
  assertNoRootMarkerOrListenerLeak(createRootContainer, createRootDocument);
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
  assertNoRootMarkerOrListenerLeak(createRootContainer, createRootDocument);

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
  assertNoRootMarkerOrListenerLeak(createRootContainer, createRootDocument);

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

  let hydrateRootCallbackCalls = 0;
  const hydrateRootBlockedOptionCases = [
    {
      label: 'recoverable-error-callback',
      options: {
        onRecoverableError() {
          hydrateRootCallbackCalls++;
        }
      }
    },
    {
      label: 'caught-error-callback',
      options: {
        onCaughtError() {
          hydrateRootCallbackCalls++;
        }
      }
    },
    {
      label: 'uncaught-error-callback',
      options: {
        onUncaughtError() {
          hydrateRootCallbackCalls++;
        }
      }
    },
    {
      label: 'identifier-prefix-option',
      options: {
        identifierPrefix: 'blocked-'
      }
    },
    {
      label: 'hydration-form-state-option',
      options: {
        formState: {blocked: true}
      }
    }
  ];
  for (const blockedCase of hydrateRootBlockedOptionCases) {
    const blockedHydrateRootDocument = createDocument(
      `public-hydrate-root-${blockedCase.label}`
    );
    const blockedHydrateRootContainer = createElement(
      'DIV',
      blockedHydrateRootDocument
    );

    assert.throws(
      () => {
        reactDomClient.hydrateRoot(
          blockedHydrateRootContainer,
          React.createElement('div', null, 'blocked hydration'),
          blockedCase.options
        );
      },
      {
        code: 'FAST_REACT_UNIMPLEMENTED',
        entrypoint: 'react-dom/client',
        exportName: 'hydrateRoot'
      }
    );
    assertContainerUntouched(
      blockedHydrateRootContainer,
      blockedHydrateRootDocument
    );
  }
  assert.equal(hydrateRootCallbackCalls, 0);

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

test('public createRoot render rejects unsupported inputs before adapter root.render', () => {
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      [
        '-e',
        createRenderCapabilityRejectionSpyScript(packageRoot)
      ],
      {
        encoding: 'utf8'
      }
    )
  );

  assert.deepEqual(
    result.freshRejectedLabels,
    publicRenderCapabilityRejectionLabels
  );
  assert.deepEqual(
    result.postAcceptedRejectedLabels,
    publicRenderCapabilityRejectionLabels
  );
  assert.equal(result.adapterCreateRootCalls, 1);
  assert.equal(result.adapterRenderCalls, 1);
  assert.deepEqual(result.adapterRenderLabels, ['accepted-minimal-div']);
  assert.equal(result.eventCallbackCalls, 0);
  assert.equal(result.forwardRefRefCurrent, null);
  assert.equal(result.refCallbackCalls, 0);
  assert.equal(result.formCallbackCalls, 0);
  assert.equal(result.objectRefCurrent, null);
  assert.equal(result.unsupportedComponentCalls, 0);
  assert.equal(result.unsupportedMemoComponentCalls, 0);
  assert.equal(result.unsupportedForwardRefRenderCalls, 0);
  assert.equal(result.unsupportedLazyLoaderCalls, 0);
  assert.deepEqual(
    result.freshErrors.map((error) => error.exportName),
    publicRenderCapabilityRejectionLabels.map(() => 'createRoot().render')
  );
  assert.deepEqual(
    result.postAcceptedErrors.map((error) => error.exportName),
    publicRenderCapabilityRejectionLabels.map(() => 'createRoot().render')
  );
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

function createPublicRenderCapabilityRejectionCaseFactories() {
  const fragmentType = React.Fragment || Symbol.for('react.fragment');
  const factories = [
    createEventPropRejectionCaseFactory('unsupported-onClick-prop', 'onClick'),
    createEventPropRejectionCaseFactory(
      'unsupported-onClickCapture-prop',
      'onClickCapture'
    ),
    createEventPropRejectionCaseFactory('unsupported-onSubmit-prop', 'onSubmit'),
    createEventPropRejectionCaseFactory('unsupported-onChange-prop', 'onChange'),
    () => {
      let refCallbackCalls = 0;
      return {
        label: 'unsupported-callback-ref-prop',
        element: React.createElement(
          'div',
          {
            ref() {
              refCallbackCalls++;
            }
          },
          'blocked ref'
        ),
        assertNoCapabilityEffects() {
          assert.equal(refCallbackCalls, 0);
        }
      };
    },
    () => {
      const ref = {current: null};
      return {
        label: 'unsupported-object-ref-prop',
        element: React.createElement('div', {ref}, 'blocked ref'),
        assertNoCapabilityEffects() {
          assert.equal(ref.current, null);
        }
      };
    },
    () => ({
      label: 'unsupported-className-prop',
      element: React.createElement('div', {className: 'blocked'}, 'blocked')
    }),
    () => ({
      label: 'unsupported-style-prop',
      element: React.createElement(
        'div',
        {style: {color: 'red'}},
        'blocked style'
      )
    }),
    () => ({
      label: 'unsupported-dangerouslySetInnerHTML-prop',
      element: React.createElement('div', {
        dangerouslySetInnerHTML: {__html: '<span>blocked</span>'}
      })
    }),
    () => ({
      label: 'unsupported-keyed-div',
      element: React.createElement('div', {key: 'blocked'}, 'blocked key')
    }),
    () => ({
      label: 'unsupported-span-type',
      element: React.createElement('span', null, 'blocked type')
    }),
    () => ({
      label: 'unsupported-nested-child',
      element: React.createElement(
        'div',
        null,
        React.createElement('span', null, 'blocked nested')
      )
    }),
    () => ({
      label: 'unsupported-fragment',
      element: React.createElement(
        fragmentType,
        null,
        React.createElement('div', null, 'blocked fragment')
      )
    }),
    () => ({
      label: 'unsupported-array',
      element: [React.createElement('div', {key: 'array'}, 'blocked array')]
    }),
    () => ({
      label: 'unsupported-suppressHydrationWarning-prop',
      element: React.createElement(
        'div',
        {suppressHydrationWarning: true},
        'blocked hydration prop'
      )
    }),
    () => ({
      label: 'unsupported-id-object',
      element: React.createElement('div', {id: {}}, 'blocked id')
    }),
    () => ({
      label: 'unsupported-link-resource-type',
      element: React.createElement('link', {
        href: '/blocked.css',
        rel: 'stylesheet'
      })
    }),
    () => ({
      label: 'unsupported-script-resource-type',
      element: React.createElement('script', {src: '/blocked.js'})
    }),
    () => ({
      label: 'unsupported-style-resource-type',
      element: React.createElement('style', null, '.blocked{}')
    }),
    createFormCallbackRejectionCaseFactory(
      'unsupported-form-type',
      'form',
      'action'
    ),
    () => ({
      label: 'unsupported-input-type',
      element: React.createElement('input', {
        checked: true,
        defaultValue: 'fallback',
        name: 'blocked-input',
        type: 'checkbox',
        value: 'blocked'
      })
    }),
    createFormCallbackRejectionCaseFactory(
      'unsupported-button-type',
      'button',
      'formAction'
    ),
    () => ({
      label: 'unsupported-textarea-type',
      element: React.createElement('textarea', {
        defaultValue: 'fallback',
        name: 'blocked-textarea',
        value: 'blocked'
      })
    }),
    createFormCallbackRejectionCaseFactory(
      'unsupported-action-prop',
      'div',
      'action'
    ),
    createFormCallbackRejectionCaseFactory(
      'unsupported-formAction-prop',
      'div',
      'formAction'
    ),
    () => ({
      label: 'unsupported-value-prop',
      element: React.createElement('div', {value: 'blocked'}, 'blocked value')
    }),
    () => ({
      label: 'unsupported-defaultValue-prop',
      element: React.createElement(
        'div',
        {defaultValue: 'blocked'},
        'blocked defaultValue'
      )
    }),
    () => ({
      label: 'unsupported-checked-prop',
      element: React.createElement('div', {checked: true}, 'blocked checked')
    }),
    () => ({
      label: 'unsupported-name-prop',
      element: React.createElement('div', {name: 'blocked'}, 'blocked name')
    }),
    () => ({
      label: 'unsupported-type-prop',
      element: React.createElement('div', {type: 'button'}, 'blocked type prop')
    }),
    createUnsupportedComponentRejectionCase,
    createUnsupportedMemoComponentRejectionCase,
    createUnsupportedForwardRefComponentRejectionCase,
    createUnsupportedLazyComponentRejectionCase
  ];

  assert.deepEqual(
    factories.map((factory) => factory().label),
    publicRenderCapabilityRejectionLabels
  );
  return factories;
}

function createUnsupportedComponentRejectionCase() {
  let componentCalls = 0;
  return {
    label: 'unsupported-component',
    element: React.createElement(function UnsupportedComponent() {
      componentCalls++;
      return React.createElement('div', null, 'blocked component');
    }),
    assertNoCapabilityEffects() {
      assert.equal(componentCalls, 0);
    }
  };
}

function createUnsupportedMemoComponentRejectionCase() {
  let componentCalls = 0;
  const MemoComponent = React.memo(function UnsupportedMemoComponent() {
    componentCalls++;
    return React.createElement('div', null, 'blocked memo component');
  });

  return {
    label: 'unsupported-memo-component',
    element: React.createElement(MemoComponent),
    assertNoCapabilityEffects() {
      assert.equal(componentCalls, 0);
    }
  };
}

function createUnsupportedForwardRefComponentRejectionCase() {
  let renderCalls = 0;
  const ref = {current: null};
  const ForwardRefComponent = React.forwardRef(
    function UnsupportedForwardRefComponent(props, forwardedRef) {
      renderCalls++;
      if (forwardedRef !== null && typeof forwardedRef === 'object') {
        forwardedRef.current = 'touched';
      }
      return React.createElement('div', null, 'blocked forwardRef component');
    }
  );

  return {
    label: 'unsupported-forwardRef-component',
    element: React.createElement(ForwardRefComponent, {ref}),
    assertNoCapabilityEffects() {
      assert.equal(renderCalls, 0);
      assert.equal(ref.current, null);
    }
  };
}

function createUnsupportedLazyComponentRejectionCase() {
  let loaderCalls = 0;
  const LazyComponent = React.lazy(function loadUnsupportedLazyComponent() {
    loaderCalls++;
    throw new Error('unsupported lazy component loader must not be called');
  });

  return {
    label: 'unsupported-lazy-component',
    element: React.createElement(LazyComponent),
    assertNoCapabilityEffects() {
      assert.equal(loaderCalls, 0);
    }
  };
}

function createEventPropRejectionCaseFactory(label, propName) {
  return () => {
    let callbackCalls = 0;
    return {
      label,
      element: React.createElement(
        'div',
        {
          [propName]() {
            callbackCalls++;
          }
        },
        `blocked ${propName}`
      ),
      assertNoCapabilityEffects() {
        assert.equal(callbackCalls, 0);
      }
    };
  };
}

function createFormCallbackRejectionCaseFactory(label, type, propName) {
  return () => {
    let callbackCalls = 0;
    return {
      label,
      element: React.createElement(
        type,
        {
          [propName]() {
            callbackCalls++;
          }
        },
        `blocked ${propName}`
      ),
      assertNoCapabilityEffects() {
        assert.equal(callbackCalls, 0);
      }
    };
  };
}

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

function assertNoRootMarkerOrListenerLeak(container, document) {
  assert.equal(
    rootMarkers.inspectContainerRootMarker(container).propertyCount,
    0
  );
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
}

function assertPublicRenderFailureDoesNotLeak(
  element,
  label,
  assertNoCapabilityEffects = () => {}
) {
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
  assertContainerUntouched(container, document);
  assertNoCapabilityEffects();
}

function assertPublicRenderUpdateFailureDoesNotLeak(
  element,
  label,
  assertNoCapabilityEffects = () => {}
) {
  const document = createDocument(`public-create-root-update-${label}`);
  const container = document.createElement('div');
  document.__mutationLog.length = 0;
  const root = reactDomClient.createRoot(container);
  const acceptedElement = React.createElement('div', {id: 'safe'}, 'safe');

  assert.equal(root.render(acceptedElement), undefined);
  const initialHostNode = container.firstChild;
  const latestPropsBefore = componentTree.getLatestPropsFromNode(
    initialHostNode
  );
  const stateBefore = summarizePublicRenderState(container, document);
  assert.equal(container.innerHTML, '<div id="safe">safe</div>');
  assert.equal(initialHostNode.getAttribute('id'), 'safe');
  assert.equal(latestPropsBefore, acceptedElement.props);

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
  const latestPropsAfter = componentTree.getLatestPropsFromNode(
    container.firstChild
  );
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.children.length, 1);
  assert.equal(container.firstElementChild, initialHostNode);
  assert.equal(container.firstChild, initialHostNode);
  assert.equal(container.firstChild.getAttribute('id'), 'safe');
  assert.equal(latestPropsAfter, latestPropsBefore);
  assert.equal(latestPropsAfter, acceptedElement.props);
  assert.deepEqual(
    summarizePublicRenderState(container, document),
    stateBefore
  );
  assert.equal(container.innerHTML, '<div id="safe">safe</div>');
  assert.equal(container.textContent, 'safe');
  assertNoRootMarkerOrListenerLeak(container, document);
  assert.equal(container.__mutationLog.length, 1);
  assert.equal(document.__mutationLog.length, 2);
  assertNoCapabilityEffects();
}

function summarizePublicRenderState(container, document) {
  const firstChild = container.firstChild;
  return {
    attributes: firstChild === null ? null : attributeEntries(firstChild),
    childNodeNames: container.childNodes.map((child) => child.nodeName),
    childNodesLength: container.childNodes.length,
    childrenLength: container.children.length,
    documentMutationLog: summarizeMutationLog(document.__mutationLog),
    firstChildGetAttributeId:
      firstChild === null ? null : firstChild.getAttribute('id'),
    firstChildInnerHTML: firstChild === null ? null : firstChild.innerHTML,
    firstChildNodeName: firstChild === null ? null : firstChild.nodeName,
    firstChildTextContent: firstChild === null ? null : firstChild.textContent,
    innerHTML: container.innerHTML,
    mutationLog: summarizeMutationLog(container.__mutationLog),
    textContent: container.textContent
  };
}

function summarizeMutationLog(mutationLog) {
  return mutationLog.map((entry) => ({
    beforeChild: entry.beforeChild?.nodeName ?? null,
    child: entry.child?.nodeName ?? null,
    nodeName: entry.nodeName ?? null,
    type: entry.type,
    value: Object.prototype.hasOwnProperty.call(entry, 'value')
      ? String(entry.value)
      : null
  }));
}

function attributeEntries(node) {
  if (!(node.attributes instanceof Map)) {
    return null;
  }
  return [...node.attributes.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
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

function createRenderCapabilityRejectionSpyScript(packageRootPath) {
  return `
'use strict';

const path = require('node:path');
const packageRoot = ${JSON.stringify(packageRootPath)};
const rootBridgePath = path.join(packageRoot, 'src/client/root-bridge.js');
const rootBridgeCacheKey = require.resolve(rootBridgePath);
const adapterRenderLabels = [];
const freshErrors = [];
const postAcceptedErrors = [];
const expectedLabels = ${JSON.stringify(publicRenderCapabilityRejectionLabels)};
let adapterCreateRootCalls = 0;
let adapterRenderCalls = 0;
let currentRenderLabel = null;
let eventCallbackCalls = 0;
let unsupportedComponentCalls = 0;
let unsupportedForwardRefRenderCalls = 0;
let unsupportedLazyLoaderCalls = 0;
let unsupportedMemoComponentCalls = 0;
let formCallbackCalls = 0;
let refCallbackCalls = 0;
const objectRef = {current: null};
const forwardRefRef = {current: null};

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
  createPrivateRootPublicFacadeAdapter() {
    return {
      createRoot() {
        adapterCreateRootCalls++;
        return {
          render() {
            adapterRenderCalls++;
            adapterRenderLabels.push(currentRenderLabel);
          },
          unmount() {}
        };
      }
    };
  },
  createPrivateRootPublicFacadePreflight() {
    return {};
  },
  createPrivateHydrateRootPublicFacadePreflight() {
    return {};
  }
});

require.cache[rootBridgeCacheKey] = {
  id: rootBridgeCacheKey,
  filename: rootBridgeCacheKey,
  loaded: true,
  exports: rootBridge
};

const client = require(path.join(packageRoot, 'client.js'));
const React = require(path.join(packageRoot, '..', 'react', 'index.js'));
const root = client.createRoot({});

for (const rejectionCase of createCases()) {
  renderExpectingRejection(root, rejectionCase, freshErrors);
}

currentRenderLabel = 'accepted-minimal-div';
root.render(React.createElement('div', {id: 'safe'}, 'safe'));
currentRenderLabel = null;

for (const rejectionCase of createCases()) {
  renderExpectingRejection(root, rejectionCase, postAcceptedErrors);
}

process.stdout.write(JSON.stringify({
  adapterCreateRootCalls,
  adapterRenderCalls,
  adapterRenderLabels,
  eventCallbackCalls,
  forwardRefRefCurrent: forwardRefRef.current,
  formCallbackCalls,
  freshErrors,
  freshRejectedLabels: freshErrors.map((error) => error.label),
  objectRefCurrent: objectRef.current,
  postAcceptedErrors,
  postAcceptedRejectedLabels: postAcceptedErrors.map((error) => error.label),
  refCallbackCalls,
  unsupportedComponentCalls,
  unsupportedForwardRefRenderCalls,
  unsupportedLazyLoaderCalls,
  unsupportedMemoComponentCalls
}));

function renderExpectingRejection(root, rejectionCase, errors) {
  currentRenderLabel = rejectionCase.label;
  try {
    root.render(rejectionCase.element);
    errors.push({
      label: rejectionCase.label,
      status: 'ok'
    });
  } catch (error) {
    errors.push({
      code: error.code,
      entrypoint: error.entrypoint,
      exportName: error.exportName,
      label: rejectionCase.label,
      status: 'throws'
    });
  } finally {
    currentRenderLabel = null;
  }
}

function createCases() {
  const fragmentType = React.Fragment || Symbol.for('react.fragment');
  return [
    eventCase('unsupported-onClick-prop', 'onClick'),
    eventCase('unsupported-onClickCapture-prop', 'onClickCapture'),
    eventCase('unsupported-onSubmit-prop', 'onSubmit'),
    eventCase('unsupported-onChange-prop', 'onChange'),
    {
      label: 'unsupported-callback-ref-prop',
      element: React.createElement(
        'div',
        {
          ref() {
            refCallbackCalls++;
          }
        },
        'blocked ref'
      )
    },
    {
      label: 'unsupported-object-ref-prop',
      element: React.createElement('div', {ref: objectRef}, 'blocked ref')
    },
    {
      label: 'unsupported-className-prop',
      element: React.createElement('div', {className: 'blocked'}, 'blocked')
    },
    {
      label: 'unsupported-style-prop',
      element: React.createElement(
        'div',
        {style: {color: 'red'}},
        'blocked style'
      )
    },
    {
      label: 'unsupported-dangerouslySetInnerHTML-prop',
      element: React.createElement('div', {
        dangerouslySetInnerHTML: {__html: '<span>blocked</span>'}
      })
    },
    {
      label: 'unsupported-keyed-div',
      element: React.createElement('div', {key: 'blocked'}, 'blocked key')
    },
    {
      label: 'unsupported-span-type',
      element: React.createElement('span', null, 'blocked type')
    },
    {
      label: 'unsupported-nested-child',
      element: React.createElement(
        'div',
        null,
        React.createElement('span', null, 'blocked nested')
      )
    },
    {
      label: 'unsupported-fragment',
      element: React.createElement(
        fragmentType,
        null,
        React.createElement('div', null, 'blocked fragment')
      )
    },
    {
      label: 'unsupported-array',
      element: [
        React.createElement('div', {key: 'array'}, 'blocked array')
      ]
    },
    {
      label: 'unsupported-suppressHydrationWarning-prop',
      element: React.createElement(
        'div',
        {suppressHydrationWarning: true},
        'blocked hydration prop'
      )
    },
    {
      label: 'unsupported-id-object',
      element: React.createElement('div', {id: {}}, 'blocked id')
    },
    {
      label: 'unsupported-link-resource-type',
      element: React.createElement('link', {
        href: '/blocked.css',
        rel: 'stylesheet'
      })
    },
    {
      label: 'unsupported-script-resource-type',
      element: React.createElement('script', {src: '/blocked.js'})
    },
    {
      label: 'unsupported-style-resource-type',
      element: React.createElement('style', null, '.blocked{}')
    },
    formCase('unsupported-form-type', 'form', 'action'),
    {
      label: 'unsupported-input-type',
      element: React.createElement('input', {
        checked: true,
        defaultValue: 'fallback',
        name: 'blocked-input',
        type: 'checkbox',
        value: 'blocked'
      })
    },
    formCase('unsupported-button-type', 'button', 'formAction'),
    {
      label: 'unsupported-textarea-type',
      element: React.createElement('textarea', {
        defaultValue: 'fallback',
        name: 'blocked-textarea',
        value: 'blocked'
      })
    },
    formCase('unsupported-action-prop', 'div', 'action'),
    formCase('unsupported-formAction-prop', 'div', 'formAction'),
    {
      label: 'unsupported-value-prop',
      element: React.createElement('div', {value: 'blocked'}, 'blocked value')
    },
    {
      label: 'unsupported-defaultValue-prop',
      element: React.createElement(
        'div',
        {defaultValue: 'blocked'},
        'blocked defaultValue'
      )
    },
    {
      label: 'unsupported-checked-prop',
      element: React.createElement('div', {checked: true}, 'blocked checked')
    },
    {
      label: 'unsupported-name-prop',
      element: React.createElement('div', {name: 'blocked'}, 'blocked name')
    },
    {
      label: 'unsupported-type-prop',
      element: React.createElement(
        'div',
        {type: 'button'},
        'blocked type prop'
      )
    },
    {
      label: 'unsupported-component',
      element: React.createElement(function UnsupportedComponent() {
        unsupportedComponentCalls++;
        return React.createElement('div', null, 'blocked component');
      })
    },
    {
      label: 'unsupported-memo-component',
      element: React.createElement(
        React.memo(function UnsupportedMemoComponent() {
          unsupportedMemoComponentCalls++;
          return React.createElement('div', null, 'blocked memo component');
        })
      )
    },
    {
      label: 'unsupported-forwardRef-component',
      element: React.createElement(
        React.forwardRef(function UnsupportedForwardRefComponent(
          props,
          ref
        ) {
          unsupportedForwardRefRenderCalls++;
          if (ref !== null && typeof ref === 'object') {
            ref.current = 'touched';
          }
          return React.createElement(
            'div',
            null,
            'blocked forwardRef component'
          );
        }),
        {ref: forwardRefRef}
      )
    },
    {
      label: 'unsupported-lazy-component',
      element: React.createElement(
        React.lazy(function loadUnsupportedLazyComponent() {
          unsupportedLazyLoaderCalls++;
          throw new Error(
            'unsupported lazy component loader must not be called'
          );
        })
      )
    }
  ];
}

function eventCase(label, propName) {
  return {
    label,
    element: React.createElement(
      'div',
      {
        [propName]() {
          eventCallbackCalls++;
        }
      },
      \`blocked \${propName}\`
    )
  };
}

function formCase(label, type, propName) {
  return {
    label,
    element: React.createElement(
      type,
      {
        [propName]() {
          formCallbackCalls++;
        }
      },
      \`blocked \${propName}\`
    )
  };
}

if (
  freshErrors.map((error) => error.label).join('\\n') !==
    expectedLabels.join('\\n') ||
  postAcceptedErrors.map((error) => error.label).join('\\n') !==
    expectedLabels.join('\\n')
) {
  throw new Error('Public render rejection labels drifted.');
}
`;
}
