'use strict';

const test = require('node:test');
const {
  assert,
  path,
  pathToFileURL,
  packageRoot,
  repoRoot,
  sourceRoot,
  resourceFormGate,
  formActions,
  propertyPayload,
  rootBridge,
  componentTree,
  controlledRestoreQueue,
  eventListener,
  pluginEventSystem,
  rootListeners,
  resourceOracle,
  formActionsOracle,
  controlledInputOracle,
  internalsExport,
  unsupportedCode,
  compatibilityTarget,
  placeholderVersion,
  implementedVersion,
  metadataOnlySourceFiles,
  resourceShape,
  formRootShape,
  formServerRootShape,
  disallowedSourcePatterns,
  assertFunctionMatchesOracle,
  assertPlaceholderMetadata,
  assertUnsupportedThrow,
  replaceDispatcherWithSpies,
  assertCallbackActionPreflightPublicBlockersFailClosed,
  assertCallbackActionPreflightPublicBoundaryFailClosed,
  assertRejectedErrorPreflightPublicBlockersFailClosed,
  assertRejectedErrorPreflightPublicBoundaryFailClosed,
  createPrivateGateScenario,
  createPrivateFormActionCallbackPreflightScenario,
  createRootMapStorageExecutionForRoot,
  createPrivateFulfilledResetExecutionRecord,
  createPrivateRejectedFormActionAsyncExecution,
  createPrivateControlledValueTrackerScenario,
  createPrivateControlledWrapperPropertyPayloadScenario,
  createPrivateRootBridgeAdmission,
  createRootBridgeDocument,
  createRootBridgeElement,
  removeRootBridgeEventRegistration,
  createWrapperMutationIntentSources,
  createWrapperMutationIntentSourceSet,
  createControlledInputEventDispatch,
  createControlledInputChangePreflight,
  createControlledLatestPropsLookup,
  createThrowingFakeResourceDocument,
  createThrowingFakeResourceHead,
  createDeterministicFakeResourceDom,
  createDeterministicFakeResourceElement,
  appendFakeHeadChild,
  createControlledInputFakeDomTarget,
  throwingProxy,
  oracleValue,
  summarizeDispatcherRecord,
  summarizeDispatcherArgument,
  summarizeFakeDomAdapterAdmission,
  summarizeFakeDomInsertion,
  summarizeHeadBoundary,
  summarizeHeadClearRetain,
  summarizePreloadPreinitOrder,
  createResourceMapCommitScenario,
  assertRootMapStoragePreflightAdmissionRejects,
  assertRootMapStorageExecutionAdmissionRejects,
  createRootMapStoragePreflightScenario,
  createDuplicateRootMapStoragePreflightScenario,
  createStylesheetPrecedenceLoadErrorStateScenario,
  fakeResourceSourceUsesNoLoadErrorListeners,
  requireFresh,
  findDisallowedSourceMatches,
  formatSourceMatches,
  listJavaScriptFiles,
  dataDescriptorFields
} = require('./helpers.js');

test('private resource hint dispatcher metadata gate validates normalized shapes without dispatching', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-dispatcher-gate'
  });
  const records = [
    gate.recordResourceHintDispatcherRequest('C', [
      'https://connect.example.test',
      null
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: 'sha256-font',
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: 'high',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: 'print'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('m', [
      '/module-worker.mjs',
      {
        as: 'worker',
        crossOrigin: '',
        integrity: 'sha256-module-worker'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'low'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('X', [
      '/script.js',
      {
        crossOrigin: 'use-credentials',
        integrity: 'sha256-script',
        fetchPriority: 'high',
        nonce: 'nonce-script'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('M', [
      '/module-entry.mjs',
      {
        crossOrigin: '',
        integrity: 'sha256-module',
        nonce: 'nonce-module'
      }
    ])
  ];
  const summary =
    resourceFormGate.describePrivateResourceHintDispatcherMetadataGate();

  assert.deepEqual(records.map(summarizeDispatcherRecord), [
    {
      requestId: 'resource-dispatcher-gate:1',
      requestType: 'resource-hint-dispatcher.preconnect',
      contractId: 'preconnect',
      publicName: 'preconnect',
      privateDispatcherKey: 'C',
      argumentNames: ['href', 'crossOrigin'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {name: 'crossOrigin', type: 'null'}
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:2',
      requestType: 'resource-hint-dispatcher.preload',
      contractId: 'preload',
      publicName: 'preload',
      privateDispatcherKey: 'L',
      argumentNames: ['href', 'as', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {name: 'as', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: [
            'crossOrigin',
            'integrity',
            'nonce',
            'type',
            'fetchPriority',
            'referrerPolicy',
            'imageSrcSet',
            'imageSizes',
            'media'
          ],
          fields: [
            {name: 'crossOrigin', type: 'string', empty: true},
            {name: 'integrity', type: 'string', empty: false},
            {name: 'nonce', type: 'undefined'},
            {name: 'type', type: 'string', empty: false},
            {name: 'fetchPriority', type: 'string', empty: false},
            {name: 'referrerPolicy', type: 'undefined'},
            {name: 'imageSrcSet', type: 'undefined'},
            {name: 'imageSizes', type: 'undefined'},
            {name: 'media', type: 'string', empty: false}
          ]
        }
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:3',
      requestType: 'resource-hint-dispatcher.preload-module',
      contractId: 'preload-module',
      publicName: 'preloadModule',
      privateDispatcherKey: 'm',
      argumentNames: ['href', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: ['as', 'crossOrigin', 'integrity'],
          fields: [
            {name: 'as', type: 'string', empty: false},
            {name: 'crossOrigin', type: 'string', empty: true},
            {name: 'integrity', type: 'string', empty: false}
          ]
        }
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:4',
      requestType: 'resource-hint-dispatcher.preinit-style',
      contractId: 'preinit-style',
      publicName: 'preinit',
      privateDispatcherKey: 'S',
      argumentNames: ['href', 'precedence', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {name: 'precedence', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: ['crossOrigin', 'integrity', 'fetchPriority'],
          fields: [
            {name: 'crossOrigin', type: 'string', empty: true},
            {name: 'integrity', type: 'string', empty: false},
            {name: 'fetchPriority', type: 'string', empty: false}
          ]
        }
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:5',
      requestType: 'resource-hint-dispatcher.preinit-script',
      contractId: 'preinit-script',
      publicName: 'preinit',
      privateDispatcherKey: 'X',
      argumentNames: ['href', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: [
            'crossOrigin',
            'integrity',
            'fetchPriority',
            'nonce'
          ],
          fields: [
            {name: 'crossOrigin', type: 'string', empty: false},
            {name: 'integrity', type: 'string', empty: false},
            {name: 'fetchPriority', type: 'string', empty: false},
            {name: 'nonce', type: 'string', empty: false}
          ]
        }
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:6',
      requestType: 'resource-hint-dispatcher.preinit-module-script',
      contractId: 'preinit-module-script',
      publicName: 'preinitModule',
      privateDispatcherKey: 'M',
      argumentNames: ['href', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: ['crossOrigin', 'integrity', 'nonce'],
          fields: [
            {name: 'crossOrigin', type: 'string', empty: true},
            {name: 'integrity', type: 'string', empty: false},
            {name: 'nonce', type: 'string', empty: false}
          ]
        }
      ]
    }
  ]);

  for (const record of records) {
    assert.equal(Object.isFrozen(record), true, record.requestType);
    assert.equal(
      resourceFormGate.isPrivateResourceHintDispatcherMetadataRecord(record),
      true,
      record.requestType
    );
    assert.equal(
      resourceFormGate.getPrivateResourceHintDispatcherMetadataRecordPayload(
        record
      ),
      record,
      record.requestType
    );
    assert.equal(record.status, resourceFormGate.unsupportedStatus);
    assert.deepEqual(
      record.sideEffects,
      resourceFormGate.resourceHintDispatcherSideEffects
    );
    assert.equal(record.sideEffects.resourcesDispatched, false);
    assert.equal(record.sideEffects.privateDispatcherInvoked, false);
    assert.equal(record.sideEffects.sourceAdapterInvoked, false);
    assert.equal(record.sideEffects.documentMutated, false);
    assert.equal(record.sideEffects.headMutated, false);
    assert.equal(record.sideEffects.resourceElementCreated, false);
    assert.equal(record.sideEffects.stylesheetPrecedenceApplied, false);
    assert.equal(record.sideEffects.fizzInstructionEmitted, false);
    assert.equal(record.sideEffects.compatibilityClaimed, false);
  }

  assert.equal(summary.gateId, resourceFormGate.privateResourceHintDispatcherMetadataGateId);
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.deepEqual(summary.sideEffects, resourceFormGate.resourceHintDispatcherSideEffects);
  assert.deepEqual(
    summary.contracts.map((contract) => ({
      id: contract.id,
      publicName: contract.publicName,
      privateDispatcherKey: contract.privateDispatcherKey,
      argumentNames: contract.argumentNames
    })),
    [
      {
        id: 'preconnect',
        publicName: 'preconnect',
        privateDispatcherKey: 'C',
        argumentNames: ['href', 'crossOrigin']
      },
      {
        id: 'preload',
        publicName: 'preload',
        privateDispatcherKey: 'L',
        argumentNames: ['href', 'as', 'options']
      },
      {
        id: 'preload-module',
        publicName: 'preloadModule',
        privateDispatcherKey: 'm',
        argumentNames: ['href', 'options']
      },
      {
        id: 'preinit-style',
        publicName: 'preinit',
        privateDispatcherKey: 'S',
        argumentNames: ['href', 'precedence', 'options']
      },
      {
        id: 'preinit-script',
        publicName: 'preinit',
        privateDispatcherKey: 'X',
        argumentNames: ['href', 'options']
      },
      {
        id: 'preinit-module-script',
        publicName: 'preinitModule',
        privateDispatcherKey: 'M',
        argumentNames: ['href', 'options']
      }
    ]
  );
  assert.equal(JSON.stringify(records).includes('/font.woff2'), false);
  assert.equal(JSON.stringify(records).includes('sha256-script'), false);
  assert.equal(JSON.stringify(records).includes('/module-entry.mjs'), false);
  assert.equal(JSON.stringify(records).includes('nonce-module'), false);
});

test('private resource hint fake-DOM adapter gate admits normalized dispatcher records without side effects', () => {
  const dispatcherGate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-dispatcher-adapter-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'fake-dom-adapter'
  });
  const fakeDomLog = [];
  const fakeDocument = createThrowingFakeResourceDocument(fakeDomLog);
  const fakeHead = createThrowingFakeResourceHead(fakeDomLog);
  const records = [
    dispatcherGate.recordResourceHintDispatcherRequest('C', [
      'https://connect.example.test',
      null
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: 'sha256-font',
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: 'high',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: 'print'
      }
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('m', [
      '/module-worker.mjs',
      {
        as: 'worker',
        crossOrigin: '',
        integrity: 'sha256-module-worker'
      }
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'low'
      }
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('X', [
      '/script.js',
      {
        crossOrigin: 'use-credentials',
        integrity: 'sha256-script',
        fetchPriority: 'high',
        nonce: 'nonce-script'
      }
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('M', [
      '/module-entry.mjs',
      {
        crossOrigin: '',
        integrity: 'sha256-module',
        nonce: 'nonce-module'
      }
    ])
  ];
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'resource-hint-test-adapter',
      targetKind: 'document-head',
      fakeDocument,
      fakeHead
    })
  );
  const summary = resourceFormGate.describePrivateResourceHintFakeDomAdapterGate();

  assert.deepEqual(admissions.map(summarizeFakeDomAdapterAdmission), [
    {
      adapterAdmissionId: 'fake-dom-adapter:1',
      sourceRequestId: 'resource-dispatcher-adapter-source:1',
      requestType: 'resource-hint-fake-dom-adapter.preconnect',
      contractId: 'preconnect',
      privateDispatcherKey: 'C',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'link',
        relationship: 'preconnect',
        attributeNames: ['rel', 'href', 'crossOrigin']
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:2',
      sourceRequestId: 'resource-dispatcher-adapter-source:2',
      requestType: 'resource-hint-fake-dom-adapter.preload',
      contractId: 'preload',
      privateDispatcherKey: 'L',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'link',
        relationship: 'preload',
        attributeNames: [
          'rel',
          'href',
          'as',
          'crossOrigin',
          'integrity',
          'nonce',
          'type',
          'fetchPriority',
          'referrerPolicy',
          'imageSrcSet',
          'imageSizes',
          'media'
        ]
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:3',
      sourceRequestId: 'resource-dispatcher-adapter-source:3',
      requestType: 'resource-hint-fake-dom-adapter.preload-module',
      contractId: 'preload-module',
      privateDispatcherKey: 'm',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'link',
        relationship: 'modulepreload',
        attributeNames: ['rel', 'href', 'as', 'crossOrigin', 'integrity']
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:4',
      sourceRequestId: 'resource-dispatcher-adapter-source:4',
      requestType: 'resource-hint-fake-dom-adapter.preinit-style',
      contractId: 'preinit-style',
      privateDispatcherKey: 'S',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'link',
        relationship: 'stylesheet',
        attributeNames: [
          'rel',
          'href',
          'precedence',
          'crossOrigin',
          'integrity',
          'fetchPriority'
        ]
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:5',
      sourceRequestId: 'resource-dispatcher-adapter-source:5',
      requestType: 'resource-hint-fake-dom-adapter.preinit-script',
      contractId: 'preinit-script',
      privateDispatcherKey: 'X',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'script',
        relationship: 'script',
        attributeNames: [
          'src',
          'async',
          'crossOrigin',
          'integrity',
          'fetchPriority',
          'nonce'
        ]
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:6',
      sourceRequestId: 'resource-dispatcher-adapter-source:6',
      requestType: 'resource-hint-fake-dom-adapter.preinit-module-script',
      contractId: 'preinit-module-script',
      privateDispatcherKey: 'M',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'script',
        relationship: 'module-script',
        attributeNames: [
          'src',
          'async',
          'type',
          'crossOrigin',
          'integrity',
          'nonce'
        ]
      }
    }
  ]);

  for (let index = 0; index < admissions.length; index++) {
    const admission = admissions[index];
    assert.equal(Object.isFrozen(admission), true, admission.requestType);
    assert.equal(
      resourceFormGate.isPrivateResourceHintFakeDomAdapterAdmissionRecord(
        admission
      ),
      true,
      admission.requestType
    );
    assert.equal(
      resourceFormGate.getPrivateResourceHintFakeDomAdapterAdmissionRecordPayload(
        admission
      ),
      admission,
      admission.requestType
    );
    assert.equal(admission.status, resourceFormGate.unsupportedStatus);
    assert.equal(admission.unsupportedCode, unsupportedCode);
    assert.equal(admission.compatibilityTarget, compatibilityTarget);
    assert.equal(
      admission.compatibilityStatus,
      resourceFormGate.privateResourceHintFakeDomAdapterCompatibilityBlockedStatus
    );
    assert.deepEqual(
      admission.dispatcherShape,
      records[index].dispatcherShape
    );
    assert.deepEqual(
      admission.sideEffects,
      resourceFormGate.resourceHintFakeDomAdapterSideEffects
    );
    assert.equal(admission.sideEffects.fakeDomAdapterInvoked, false);
    assert.equal(admission.sideEffects.fakeDocumentRead, false);
    assert.equal(admission.sideEffects.fakeDocumentMutated, false);
    assert.equal(admission.sideEffects.fakeHeadRead, false);
    assert.equal(admission.sideEffects.fakeHeadMutated, false);
    assert.equal(admission.sideEffects.fakeResourceElementCreated, false);
    assert.equal(admission.sideEffects.fakeResourceElementInserted, false);
    assert.equal(admission.sideEffects.resourceFetchStarted, false);
    assert.equal(admission.sideEffects.resourceRecordCommitted, false);
    assert.equal(admission.sideEffects.compatibilityClaimed, false);
    assert.equal(admission.adapterAdmission.explicitAdmission, true);
    assert.equal(admission.adapterAdmission.deterministicFakeDomOnly, true);
    assert.equal(admission.adapterAdmission.rawAdapterCaptured, false);
    assert.equal(admission.adapterAdmission.rawDocumentCaptured, false);
    assert.equal(admission.adapterAdmission.rawHeadCaptured, false);
    assert.equal(admission.adapterAdmission.mutationMethodsCalled, false);
    assert.equal(admission.resourceElementPlan.rawValuesRetained, false);
    assert.equal(admission.resourceElementPlan.elementCreated, false);
    assert.equal(admission.resourceElementPlan.elementInserted, false);
    assert.equal(admission.resourceElementPlan.resourceFetchStarted, false);
    assert.equal(
      admission.resourceElementPlan.stylesheetPrecedenceApplied,
      false
    );
  }

  assert.equal(fakeDomLog.length, 0);
  assert.equal(summary.gateId, resourceFormGate.privateResourceHintFakeDomAdapterGateId);
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate.privateResourceHintFakeDomAdapterAdmissionRequiredStatus
  );
  assert.equal(
    summary.executionStatus,
    resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus
  );
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintFakeDomAdapterSideEffects
  );
  assert.deepEqual(
    summary.contracts.map((contract) => ({
      id: contract.id,
      privateDispatcherKey: contract.privateDispatcherKey,
      elementTag: contract.elementTag,
      relationship: contract.relationship
    })),
    [
      {
        id: 'preconnect',
        privateDispatcherKey: 'C',
        elementTag: 'link',
        relationship: 'preconnect'
      },
      {
        id: 'preload',
        privateDispatcherKey: 'L',
        elementTag: 'link',
        relationship: 'preload'
      },
      {
        id: 'preload-module',
        privateDispatcherKey: 'm',
        elementTag: 'link',
        relationship: 'modulepreload'
      },
      {
        id: 'preinit-style',
        privateDispatcherKey: 'S',
        elementTag: 'link',
        relationship: 'stylesheet'
      },
      {
        id: 'preinit-script',
        privateDispatcherKey: 'X',
        elementTag: 'script',
        relationship: 'script'
      },
      {
        id: 'preinit-module-script',
        privateDispatcherKey: 'M',
        elementTag: 'script',
        relationship: 'module-script'
      }
    ]
  );
  assert.equal(JSON.stringify(admissions).includes('/font.woff2'), false);
  assert.equal(JSON.stringify(admissions).includes('sha256-style'), false);
  assert.equal(JSON.stringify(admissions).includes('nonce-script'), false);
  assert.equal(JSON.stringify(admissions).includes('/module-entry.mjs'), false);
  assert.equal(JSON.stringify(admissions).includes('nonce-module'), false);
});

test('private resource hint fake-DOM insertion gate admits one deterministic preload record only', () => {
  const dispatcherGate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-dispatcher-insertion-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'fake-dom-insertion-adapter'
  });
  const insertionGate = resourceFormGate.createResourceHintFakeDomInsertionGate({
    requestIdPrefix: 'fake-dom-insertion'
  });
  const fakeDom = createDeterministicFakeResourceDom();
  const dispatcherRecord = dispatcherGate.recordResourceHintDispatcherRequest(
    'L',
    [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: 'sha256-font',
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: 'high',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: 'print'
      }
    ]
  );
  const adapterAdmission = adapterGate.admitDispatcherRecord(
    dispatcherRecord,
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'resource-hint-insertion-adapter',
      targetKind: 'document-head'
    }
  );
  const insertion = insertionGate.insertAdapterAdmissionRecord(
    adapterAdmission,
    {
      explicitInsertion: true,
      insertionKind: 'deterministic-fake-dom-head-append',
      insertionId: 'preload-font-private-diagnostic',
      targetKind: 'document-head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintFakeDomInsertionGate();

  assert.equal(Object.isFrozen(insertion), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintFakeDomInsertionRecord(insertion),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintFakeDomInsertionRecordPayload(
      insertion
    ),
    insertion
  );
  assert.deepEqual(summarizeFakeDomInsertion(insertion), {
    insertionId: 'fake-dom-insertion:1',
    sourceAdapterAdmissionId: 'fake-dom-insertion-adapter:1',
    sourceRequestId: 'resource-dispatcher-insertion-source:1',
    requestType: 'resource-hint-fake-dom-insertion.preload',
    contractId: 'preload',
    privateDispatcherKey: 'L',
    insertionStatus:
      resourceFormGate.privateResourceHintFakeDomInsertionStatus,
    executionStatus:
      resourceFormGate.privateResourceHintFakeDomInsertionExecutionStatus,
    elementPlan: {
      elementTag: 'link',
      relationship: 'preload',
      insertionMethod: 'appendChild',
      attributeNames: [
        'rel',
        'href',
        'as',
        'crossOrigin',
        'integrity',
        'type',
        'fetchPriority',
        'media'
      ]
    }
  });
  assert.equal(insertion.status, resourceFormGate.unsupportedStatus);
  assert.equal(insertion.unsupportedCode, unsupportedCode);
  assert.equal(insertion.compatibilityTarget, compatibilityTarget);
  assert.equal(
    insertion.compatibilityStatus,
    resourceFormGate.privateResourceHintFakeDomInsertionCompatibilityBlockedStatus
  );
  assert.deepEqual(
    insertion.sideEffects,
    resourceFormGate.resourceHintFakeDomInsertionSideEffects
  );
  assert.equal(insertion.sideEffects.fakeDomInsertionGateInvoked, true);
  assert.equal(insertion.sideEffects.fakeHeadMutated, true);
  assert.equal(insertion.sideEffects.fakeResourceElementCreated, true);
  assert.equal(insertion.sideEffects.fakeResourceElementInserted, true);
  assert.equal(
    insertion.sideEffects.fakeResourceElementAttributesApplied,
    true
  );
  assert.equal(insertion.sideEffects.resourceFetchStarted, false);
  assert.equal(insertion.sideEffects.realDocumentMutated, false);
  assert.equal(insertion.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(insertion.sideEffects.publicRootTouched, false);
  assert.equal(insertion.sideEffects.compatibilityClaimed, false);
  assert.equal(insertion.insertionAdmission.explicitInsertion, true);
  assert.equal(
    insertion.insertionAdmission.deterministicFakeDomOnly,
    true
  );
  assert.equal(insertion.insertionAdmission.rawDocumentCaptured, false);
  assert.equal(insertion.insertionAdmission.rawHeadCaptured, false);
  assert.equal(insertion.insertionAdmission.rawElementCaptured, false);
  assert.equal(insertion.resourceElementPlan.rawValuesRetained, false);
  assert.equal(insertion.resourceElementPlan.elementCreated, true);
  assert.equal(insertion.resourceElementPlan.elementInserted, true);
  assert.equal(insertion.resourceElementPlan.resourceFetchStarted, false);
  assert.equal(
    insertion.resourceElementPlan.publicResourceHintDomInsertion,
    false
  );
  assert.equal(
    insertion.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(insertion.publicResourceBoundary.publicDispatcherInvoked, false);
  assert.equal(insertion.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(insertion.publicResourceBoundary.realHeadMutated, false);
  assert.equal(insertion.publicResourceBoundary.compatibilityClaimed, false);
  assert.equal(fakeDom.head.childNodes.length, 1);
  assert.equal(fakeDom.head.childNodes[0].nodeName, 'LINK');
  assert.deepEqual(fakeDom.head.childNodes[0].attributes, {
    rel: 'preload',
    href: '[fast-react-redacted-resource-hint:href]',
    as: '[fast-react-redacted-resource-hint:as]',
    crossOrigin: '',
    integrity: '[fast-react-redacted-resource-hint:integrity]',
    type: '[fast-react-redacted-resource-hint:type]',
    fetchPriority: '[fast-react-redacted-resource-hint:fetchPriority]',
    media: '[fast-react-redacted-resource-hint:media]'
  });
  assert.deepEqual(fakeDom.log.map((entry) => entry.type), [
    'document.createElement',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'head.appendChild'
  ]);
  assert.equal(JSON.stringify(insertion).includes('/font.woff2'), false);
  assert.equal(JSON.stringify(insertion).includes('sha256-font'), false);
  assert.equal(JSON.stringify(insertion).includes('font/woff2'), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintFakeDomInsertionGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate.privateResourceHintFakeDomInsertionAdmissionRequiredStatus
  );
  assert.deepEqual(summary.acceptsContractIds, ['preconnect', 'preload']);
  assert.equal(summary.maxInsertionsPerGate, 1);
  assert.equal(summary.publicResourceHintDomInsertion, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintFakeDomInsertionBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintFakeDomInsertionError(
      insertion
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintFakeDomInsertionGateErrorCode
  );
  assert.equal(error.exportName, 'resource-hint-fake-dom-insertion.preload');
  assert.equal(error.insertionId, 'fake-dom-insertion:1');
  assert.equal(error.sourceAdapterAdmissionId, 'fake-dom-insertion-adapter:1');
  assert.equal(error.contractId, 'preload');
  assert.equal(
    error.executionStatus,
    resourceFormGate.privateResourceHintFakeDomInsertionExecutionStatus
  );
  assert.deepEqual(
    error.sideEffects,
    resourceFormGate.resourceHintFakeDomInsertionSideEffects
  );

  assert.throws(
    () =>
      insertionGate.insertAdapterAdmissionRecord(adapterAdmission, {
        explicitInsertion: true,
        fakeDocument: fakeDom.document,
        fakeHead: fakeDom.head
      }),
    {
      code:
        resourceFormGate.privateResourceHintFakeDomInsertionInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'fake DOM insertion gate admits exactly one record'
    }
  );

  const preinitAdapterAdmission = adapterGate.admitDispatcherRecord(
    dispatcherGate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'low'
      }
    ]),
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintFakeDomInsertionGate()
        .insertAdapterAdmissionRecord(preinitAdapterAdmission, {
          explicitInsertion: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head
        }),
    {
      code:
        resourceFormGate.privateResourceHintFakeDomInsertionInvalidRecordCode,
      compatibilityTarget,
      contractId: 'preinit-style'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintFakeDomInsertionGate()
        .insertAdapterAdmissionRecord(adapterAdmission, {
          explicitInsertion: true,
          fakeDocument: {
            createElement() {
              return {};
            }
          },
          fakeHead: {
            appendChild() {}
          }
        }),
    {
      code:
        resourceFormGate.privateResourceHintFakeDomInsertionInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'fakeDocument must be an explicit deterministic fake resource document'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintFakeDomInsertionError({}),
    {
      code:
        resourceFormGate.privateResourceHintFakeDomInsertionInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint head-singleton boundary observes fake-DOM insertion and update only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'head-boundary-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'head-boundary-adapter'
  });
  const insertionGate = resourceFormGate.createResourceHintFakeDomInsertionGate({
    requestIdPrefix: 'head-boundary-insertion'
  });
  const headBoundaryGate =
    resourceFormGate.createResourceHintHeadBoundaryGate({
      requestIdPrefix: 'head-boundary'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const dispatcherRecord = gate.recordResourceHintDispatcherRequest('C', [
    'https://connect.example.test',
    ''
  ]);
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy('head singleton props')
  ]);
  const adapterAdmission = adapterGate.admitDispatcherRecord(
    dispatcherRecord,
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'head-boundary-resource-adapter',
      targetKind: 'document-head'
    }
  );
  const insertion = insertionGate.insertAdapterAdmissionRecord(
    adapterAdmission,
    {
      explicitInsertion: true,
      insertionKind: 'deterministic-fake-dom-head-append',
      insertionId: 'preconnect-head-boundary-insertion',
      targetKind: 'document-head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const boundary = headBoundaryGate.recordInsertionUpdateBoundary(
    insertion,
    headRecord,
    {
      explicitBoundary: true,
      boundaryKind:
        'deterministic-fake-dom-head-singleton-insertion-update',
      boundaryId: 'preconnect-head-boundary-update',
      targetKind: 'document-head',
      hostTag: 'head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintHeadBoundaryGate();

  assert.equal(Object.isFrozen(boundary), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintHeadBoundaryRecord(boundary),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintHeadBoundaryRecordPayload(
      boundary
    ),
    boundary
  );
  assert.deepEqual(summarizeHeadBoundary(boundary), {
    boundaryId: 'head-boundary:1',
    sourceInsertionId: 'head-boundary-insertion:1',
    sourceHeadRequestId: 'head-boundary-source:2',
    requestType: 'resource-hint-head-singleton-boundary.preconnect',
    contractId: 'preconnect',
    boundaryContractId: 'preconnect-head-singleton-boundary',
    headContractId: 'head-singleton',
    hostTag: 'head',
    boundaryStatus: resourceFormGate.privateResourceHintHeadBoundaryStatus,
    executionStatus:
      resourceFormGate.privateResourceHintHeadBoundaryExecutionStatus,
    elementPlan: {
      elementTag: 'link',
      relationship: 'preconnect',
      insertedElementObserved: true,
      updateApplied: true,
      updateAttributeNames: ['data-fast-react-head-boundary']
    }
  });
  assert.equal(boundary.status, resourceFormGate.unsupportedStatus);
  assert.equal(boundary.unsupportedCode, unsupportedCode);
  assert.equal(boundary.compatibilityTarget, compatibilityTarget);
  assert.equal(
    boundary.compatibilityStatus,
    resourceFormGate.privateResourceHintHeadBoundaryCompatibilityBlockedStatus
  );
  assert.deepEqual(
    boundary.sideEffects,
    resourceFormGate.resourceHintHeadBoundarySideEffects
  );
  assert.equal(boundary.sideEffects.singletonsResolved, false);
  assert.equal(boundary.sideEffects.fakeHeadBoundaryInvoked, true);
  assert.equal(boundary.sideEffects.fakeHeadInsertionObserved, true);
  assert.equal(boundary.sideEffects.fakeHeadUpdateApplied, true);
  assert.equal(boundary.sideEffects.fakeHeadMutated, true);
  assert.equal(boundary.sideEffects.fakeResourceElementInserted, false);
  assert.equal(
    boundary.sideEffects.fakeResourceElementAttributesApplied,
    true
  );
  assert.equal(boundary.sideEffects.headSingletonResolved, false);
  assert.equal(boundary.sideEffects.headSingletonAcquired, false);
  assert.equal(boundary.sideEffects.headSingletonReleased, false);
  assert.equal(boundary.sideEffects.headChildrenCleared, false);
  assert.equal(boundary.sideEffects.publicHeadSingletonBehavior, false);
  assert.equal(boundary.sideEffects.realDocumentMutated, false);
  assert.equal(boundary.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(boundary.sideEffects.publicRootTouched, false);
  assert.equal(boundary.sideEffects.compatibilityClaimed, false);
  assert.equal(boundary.sourceInsertion.elementInserted, true);
  assert.equal(
    boundary.sourceInsertion.publicResourceHintDomInsertion,
    false
  );
  assert.equal(boundary.sourceHeadRequest.singletonsResolved, false);
  assert.equal(
    boundary.sourceHeadRequest.compatibilityClaimed,
    false
  );
  assert.equal(boundary.boundaryAdmission.rawDocumentCaptured, false);
  assert.equal(boundary.boundaryAdmission.rawHeadCaptured, false);
  assert.equal(boundary.boundaryAdmission.rawElementCaptured, false);
  assert.equal(
    boundary.boundaryAdmission.singletonResolutionAllowed,
    false
  );
  assert.equal(
    boundary.boundaryAdmission.publicHeadSingletonBehavior,
    false
  );
  assert.equal(boundary.resourceElementPlan.rawValuesRetained, false);
  assert.equal(
    boundary.resourceElementPlan.singletonResolutionAllowed,
    false
  );
  assert.equal(
    boundary.resourceElementPlan.singletonOwnershipClaimed,
    false
  );
  assert.equal(
    boundary.resourceElementPlan.publicHeadSingletonBehavior,
    false
  );
  assert.equal(
    boundary.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(boundary.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(
    boundary.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.equal(
    boundary.publicHeadBoundary.singletonResolutionReachable,
    false
  );
  assert.equal(boundary.publicHeadBoundary.realDocumentMutated, false);
  assert.equal(boundary.publicHeadBoundary.compatibilityClaimed, false);
  assert.equal(fakeDom.head.childNodes.length, 1);
  assert.deepEqual(fakeDom.head.childNodes[0].attributes, {
    rel: 'preconnect',
    href: '[fast-react-redacted-resource-hint:href]',
    crossOrigin: '',
    'data-fast-react-head-boundary':
      '[fast-react-head-boundary:resource-hint-insertion-update]'
  });
  assert.deepEqual(fakeDom.log.map((entry) => entry.type), [
    'document.createElement',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'head.appendChild',
    'element.setAttribute'
  ]);
  assert.equal(JSON.stringify(boundary).includes('connect.example'), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintHeadBoundaryGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate.privateResourceHintHeadBoundaryAdmissionRequiredStatus
  );
  assert.deepEqual(summary.acceptsContractIds, ['preconnect', 'preload']);
  assert.equal(summary.acceptedHostTag, 'head');
  assert.equal(summary.maxBoundariesPerGate, 1);
  assert.equal(summary.publicResourceHintDomInsertion, false);
  assert.equal(summary.publicHeadSingletonBehavior, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintHeadBoundaryBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintHeadBoundaryError(boundary);
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintHeadBoundaryGateErrorCode
  );
  assert.equal(
    error.exportName,
    'resource-hint-head-singleton-boundary.preconnect'
  );
  assert.equal(error.boundaryId, 'head-boundary:1');
  assert.equal(error.sourceInsertionId, 'head-boundary-insertion:1');
  assert.equal(error.sourceHeadRequestId, 'head-boundary-source:2');
  assert.equal(error.boundaryContractId, 'preconnect-head-singleton-boundary');
  assert.equal(error.hostTag, 'head');
  assert.deepEqual(
    error.sideEffects,
    resourceFormGate.resourceHintHeadBoundarySideEffects
  );

  assert.throws(
    () =>
      headBoundaryGate.recordInsertionUpdateBoundary(insertion, headRecord, {
        explicitBoundary: true,
        fakeDocument: fakeDom.document,
        fakeHead: fakeDom.head
      }),
    {
      code:
        resourceFormGate.privateResourceHintHeadBoundaryInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'head boundary gate admits exactly one insertion/update record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintHeadBoundaryGate()
        .recordInsertionUpdateBoundary(
          insertion,
          gate.recordSingletonRequest('body', []),
          {
            explicitBoundary: true,
            fakeDocument: fakeDom.document,
            fakeHead: fakeDom.head
          }
        ),
    {
      code: resourceFormGate.privateResourceHintHeadBoundaryInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintHeadBoundaryGate()
        .recordInsertionUpdateBoundary(insertion, headRecord, {
          explicitBoundary: true,
          fakeDocument: createDeterministicFakeResourceDom().document,
          fakeHead: createDeterministicFakeResourceDom().head
        }),
    {
      code:
        resourceFormGate.privateResourceHintHeadBoundaryInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'fakeHead must belong to the deterministic fake resource document'
    }
  );
  assert.throws(
    () => resourceFormGate.createUnsupportedResourceHintHeadBoundaryError({}),
    {
      code: resourceFormGate.privateResourceHintHeadBoundaryInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint head clear/retain diagnostic records singleton and resource rows only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'head-clear-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'head-clear-adapter'
  });
  const insertionGate = resourceFormGate.createResourceHintFakeDomInsertionGate({
    requestIdPrefix: 'head-clear-insertion'
  });
  const headBoundaryGate =
    resourceFormGate.createResourceHintHeadBoundaryGate({
      requestIdPrefix: 'head-clear-boundary'
    });
  const clearRetainGate =
    resourceFormGate.createResourceHintHeadClearRetainGate({
      requestIdPrefix: 'head-clear-retain'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const dispatcherRecord = gate.recordResourceHintDispatcherRequest('C', [
    'https://connect.example.test',
    ''
  ]);
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy('head clear props')
  ]);
  const adapterAdmission = adapterGate.admitDispatcherRecord(
    dispatcherRecord,
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    }
  );
  const insertion = insertionGate.insertAdapterAdmissionRecord(
    adapterAdmission,
    {
      explicitInsertion: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const boundary = headBoundaryGate.recordInsertionUpdateBoundary(
    insertion,
    headRecord,
    {
      explicitBoundary: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  appendFakeHeadChild(fakeDom, 'script');
  appendFakeHeadChild(fakeDom, 'style');
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'stylesheet',
    'data-precedence': 'theme'
  });
  appendFakeHeadChild(fakeDom, 'meta', {
    name: 'description'
  });

  const diagnostic = clearRetainGate.recordHeadClearRetainDiagnostic(
    boundary,
    {
      explicitClearRetain: true,
      clearRetainKind: 'deterministic-fake-dom-head-clear-retain',
      clearRetainId: 'preconnect-head-clear-retain',
      targetKind: 'document-head',
      hostTag: 'head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintHeadClearRetainGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintHeadClearRetainRecord(diagnostic),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintHeadClearRetainRecordPayload(
      diagnostic
    ),
    diagnostic
  );
  assert.deepEqual(summarizeHeadClearRetain(diagnostic), {
    clearRetainId: 'head-clear-retain:1',
    sourceBoundaryId: 'head-clear-boundary:1',
    sourceInsertionId: 'head-clear-insertion:1',
    sourceHeadRequestId: 'head-clear-source:2',
    requestType: 'resource-hint-head-clear-retain.preconnect',
    contractId: 'preconnect',
    hostTag: 'head',
    clearRetainStatus:
      resourceFormGate.privateResourceHintHeadClearRetainStatus,
    executionStatus:
      resourceFormGate.privateResourceHintHeadClearRetainExecutionStatus,
    singletonRow: {
      rowType: 'host-singleton',
      retainedChildCount: 3,
      clearableChildCount: 2,
      actualHeadChildrenCleared: false
    },
    resourceHintRow: {
      rowType: 'resource-hint',
      childIndex: 0,
      nodeName: 'LINK',
      relationship: 'preconnect',
      clearRetainDecision: 'clear',
      clearReason: 'resource-hint-hoistable-marker-blocked',
      resourceHoistableRetentionBlocked: true
    },
    fakeHeadPlan: {
      childCount: 5,
      retainedChildCount: 3,
      clearableChildCount: 2,
      clearApplied: false
    }
  });
  assert.equal(diagnostic.status, resourceFormGate.unsupportedStatus);
  assert.equal(diagnostic.unsupportedCode, unsupportedCode);
  assert.equal(diagnostic.compatibilityTarget, compatibilityTarget);
  assert.equal(
    diagnostic.compatibilityStatus,
    resourceFormGate.privateResourceHintHeadClearRetainCompatibilityBlockedStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintHeadClearRetainSideEffects
  );
  assert.equal(diagnostic.sideEffects.fakeHeadRead, true);
  assert.equal(
    diagnostic.sideEffects.fakeHeadClearRetainDiagnosticInvoked,
    true
  );
  assert.equal(diagnostic.sideEffects.fakeHeadChildrenScanned, true);
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, false);
  assert.equal(diagnostic.sideEffects.fakeHeadChildRemoved, false);
  assert.equal(diagnostic.sideEffects.headChildrenCleared, false);
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceApplied,
    false
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceBlockedCapabilitiesRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.realDocumentMutated, false);
  assert.equal(diagnostic.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(diagnostic.sideEffects.publicHeadSingletonBehavior, false);
  assert.equal(diagnostic.sideEffects.compatibilityClaimed, false);
  assert.equal(diagnostic.clearRetainAdmission.rawDocumentCaptured, false);
  assert.equal(diagnostic.clearRetainAdmission.rawHeadCaptured, false);
  assert.equal(diagnostic.clearRetainAdmission.fakeHeadRemovalAllowed, false);
  assert.equal(
    diagnostic.clearRetainAdmission.stylesheetPrecedenceAllowed,
    false
  );
  assert.deepEqual(
    diagnostic.headChildRows.map((row) => ({
      childIndex: row.childIndex,
      nodeName: row.nodeName,
      relationship: row.relationship,
      sourceResourceHint: row.sourceResourceHint,
      clearRetainDecision: row.clearRetainDecision,
      retainReason: row.retainReason,
      clearReason: row.clearReason,
      stylesheetPrecedenceCandidate:
        row.stylesheetPrecedenceCandidate,
      actualNodeRemoved: row.actualNodeRemoved
    })),
    [
      {
        childIndex: 0,
        nodeName: 'LINK',
        relationship: 'preconnect',
        sourceResourceHint: true,
        clearRetainDecision: 'clear',
        retainReason: null,
        clearReason: 'resource-hint-hoistable-marker-blocked',
        stylesheetPrecedenceCandidate: false,
        actualNodeRemoved: false
      },
      {
        childIndex: 1,
        nodeName: 'SCRIPT',
        relationship: null,
        sourceResourceHint: false,
        clearRetainDecision: 'retain',
        retainReason: 'script',
        clearReason: null,
        stylesheetPrecedenceCandidate: false,
        actualNodeRemoved: false
      },
      {
        childIndex: 2,
        nodeName: 'STYLE',
        relationship: null,
        sourceResourceHint: false,
        clearRetainDecision: 'retain',
        retainReason: 'style',
        clearReason: null,
        stylesheetPrecedenceCandidate: false,
        actualNodeRemoved: false
      },
      {
        childIndex: 3,
        nodeName: 'LINK',
        relationship: 'stylesheet',
        sourceResourceHint: false,
        clearRetainDecision: 'retain',
        retainReason: 'stylesheet-link',
        clearReason: null,
        stylesheetPrecedenceCandidate: true,
        actualNodeRemoved: false
      },
      {
        childIndex: 4,
        nodeName: 'META',
        relationship: null,
        sourceResourceHint: false,
        clearRetainDecision: 'clear',
        retainReason: null,
        clearReason: 'unretained-head-child',
        stylesheetPrecedenceCandidate: false,
        actualNodeRemoved: false
      }
    ]
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.status,
    resourceFormGate.privateResourceHintHeadStylesheetPrecedenceBlockedStatus
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.stylesheetPrecedenceRowsObserved,
    true
  );
  assert.equal(diagnostic.stylesheetPrecedenceBoundary.stylesheetRowCount, 1);
  assert.deepEqual(
    diagnostic.stylesheetPrecedenceBoundary.blockedCapabilities,
    resourceFormGate.resourceHintHeadStylesheetPrecedenceBlockedCapabilities
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintHeadClearRetainBlockedCapabilities
  );
  assert.equal(
    diagnostic.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.equal(
    diagnostic.publicHeadBoundary.headChildrenCleared,
    false
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(fakeDom.head.childNodes.length, 5);
  assert.equal(fakeDom.head.childNodes[4].nodeName, 'META');
  assert.equal(JSON.stringify(diagnostic).includes('connect.example'), false);
  assert.equal(JSON.stringify(diagnostic).includes('theme'), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintHeadClearRetainGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate.privateResourceHintHeadClearRetainAdmissionRequiredStatus
  );
  assert.deepEqual(summary.acceptsContractIds, ['preconnect', 'preload']);
  assert.equal(summary.maxDiagnosticsPerGate, 1);
  assert.equal(summary.mutatesFakeHead, false);
  assert.equal(summary.mutatesRealHead, false);
  assert.equal(summary.clearsHeadChildren, false);
  assert.equal(summary.recordsSingletonRows, true);
  assert.equal(summary.recordsResourceHintRows, true);
  assert.deepEqual(
    summary.blockedCapabilities,
    resourceFormGate.resourceHintHeadClearRetainBlockedCapabilities
  );
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintHeadClearRetainBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintHeadClearRetainError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintHeadClearRetainGateErrorCode
  );
  assert.equal(
    error.exportName,
    'resource-hint-head-clear-retain.preconnect'
  );
  assert.equal(error.clearRetainId, 'head-clear-retain:1');
  assert.equal(error.sourceBoundaryId, 'head-clear-boundary:1');
  assert.equal(error.sourceInsertionId, 'head-clear-insertion:1');
  assert.equal(error.sourceHeadRequestId, 'head-clear-source:2');
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintHeadClearRetainBlockedCapabilities
  );

  assert.throws(
    () =>
      clearRetainGate.recordHeadClearRetainDiagnostic(boundary, {
        explicitClearRetain: true,
        fakeDocument: fakeDom.document,
        fakeHead: fakeDom.head
      }),
    {
      code:
        resourceFormGate.privateResourceHintHeadClearRetainInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'head clear/retain gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintHeadClearRetainGate()
        .recordHeadClearRetainDiagnostic(insertion, {
          explicitClearRetain: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head
        }),
    {
      code: resourceFormGate.privateResourceHintHeadClearRetainInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintHeadClearRetainGate()
        .recordHeadClearRetainDiagnostic(boundary, {
          explicitClearRetain: true,
          fakeDocument: createDeterministicFakeResourceDom().document,
          fakeHead: createDeterministicFakeResourceDom().head
        }),
    {
      code:
        resourceFormGate.privateResourceHintHeadClearRetainInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'fakeHead must belong to the deterministic fake resource document'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintHeadClearRetainError({}),
    {
      code: resourceFormGate.privateResourceHintHeadClearRetainInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint preload/preinit order diagnostic records dedupe and precedence evidence only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'preload-preinit-order-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'preload-preinit-order-adapter'
  });
  const orderGate =
    resourceFormGate.createResourceHintPreloadPreinitOrderGate({
      requestIdPrefix: 'preload-preinit-order'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const records = [
    gate.recordResourceHintDispatcherRequest('L', [
      '/style.css',
      'style',
      {
        crossOrigin: undefined,
        integrity: undefined,
        nonce: undefined,
        type: undefined,
        fetchPriority: 'low',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style-dupe',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/script.js',
      'script',
      {
        crossOrigin: undefined,
        integrity: 'sha256-script-preload',
        nonce: undefined,
        type: undefined,
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('X', [
      '/script.js',
      {
        crossOrigin: undefined,
        integrity: 'sha256-script',
        fetchPriority: 'high',
        nonce: 'nonce-script'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('m', [
      '/module.mjs',
      {
        as: undefined,
        crossOrigin: '',
        integrity: 'sha256-module-preload'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('M', [
      '/module.mjs',
      {
        crossOrigin: '',
        integrity: 'sha256-module',
        nonce: 'nonce-module'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: undefined,
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ])
  ];
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    })
  );
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'stylesheet',
    'data-precedence': 'theme',
    'data-fast-react-resource-key': 'style-main',
    'data-fast-react-precedence-key': 'precedence-theme'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'preload',
    as: 'style',
    'data-fast-react-resource-key': 'style-main'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'preload',
    as: 'script',
    'data-fast-react-resource-key': 'script-main'
  });
  appendFakeHeadChild(fakeDom, 'script', {
    'data-fast-react-resource-key': 'script-main'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'modulepreload',
    'data-fast-react-resource-key': 'module-main'
  });
  appendFakeHeadChild(fakeDom, 'script', {
    type: 'module',
    'data-fast-react-resource-key': 'module-main'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'preload',
    as: 'font',
    'data-fast-react-resource-key': 'font-main'
  });

  const diagnostic = orderGate.recordPreloadPreinitOrderDiagnostic(
    admissions,
    {
      explicitOrderDiagnostic: true,
      orderKind: 'deterministic-fake-dom-preload-preinit-dedupe-order',
      orderId: 'preload-preinit-dedupe-order',
      targetKind: 'document-head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head,
      resourceDescriptors: [
        {
          sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main'
        },
        {
          sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-theme'
        },
        {
          sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-theme'
        },
        {
          sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'script-main'
        },
        {
          sourceAdapterAdmissionId: admissions[4].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'script-main'
        },
        {
          sourceAdapterAdmissionId: admissions[5].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'module-main'
        },
        {
          sourceAdapterAdmissionId: admissions[6].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'module-main'
        },
        {
          sourceAdapterAdmissionId: admissions[7].adapterAdmissionId,
          resourceKind: 'font',
          resourceKey: 'font-main'
        }
      ]
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintPreloadPreinitOrderGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintPreloadPreinitOrderRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintPreloadPreinitOrderRecordPayload(
      diagnostic
    ),
    diagnostic
  );
  assert.deepEqual(summarizePreloadPreinitOrder(diagnostic), {
    orderDiagnosticId: 'preload-preinit-order:1',
    requestType: 'resource-hint-preload-preinit-dedupe-order',
    orderStatus:
      resourceFormGate.privateResourceHintPreloadPreinitOrderStatus,
    executionStatus:
      resourceFormGate.privateResourceHintPreloadPreinitOrderExecutionStatus,
    dedupeActions: [
      'insert-preload',
      'preinit-adopts-preload',
      'dedupe-preinit',
      'insert-preload',
      'preinit-adopts-preload',
      'insert-preload',
      'preinit-adopts-preload',
      'insert-preload'
    ],
    plannedContractIds: [
      'preinit-style',
      'preload',
      'preload',
      'preinit-script',
      'preload-module',
      'preinit-module-script',
      'preload'
    ],
    observedNodeNames: [
      'LINK',
      'LINK',
      'LINK',
      'SCRIPT',
      'LINK',
      'SCRIPT',
      'LINK'
    ],
    resourceMapPlan: {
      uniqueResourceCount: 4,
      preloadResourceCount: 4,
      preinitResourceCount: 3,
      scriptModuleRowCount: 4,
      dedupedRowCount: 1
    }
  });
  assert.equal(diagnostic.status, resourceFormGate.unsupportedStatus);
  assert.equal(diagnostic.unsupportedCode, unsupportedCode);
  assert.equal(diagnostic.compatibilityTarget, compatibilityTarget);
  assert.equal(
    diagnostic.compatibilityStatus,
    resourceFormGate
      .privateResourceHintPreloadPreinitOrderCompatibilityBlockedStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintPreloadPreinitOrderSideEffects
  );
  assert.equal(diagnostic.sideEffects.fakeHeadRead, true);
  assert.equal(diagnostic.sideEffects.fakeHeadChildrenScanned, true);
  assert.equal(
    diagnostic.sideEffects.fakePreloadPreinitOrderDiagnosticInvoked,
    true
  );
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, false);
  assert.equal(
    diagnostic.sideEffects.fakeHeadInsertionOrderObserved,
    true
  );
  assert.equal(
    diagnostic.sideEffects.fakeHeadInsertionOrderMutated,
    false
  );
  assert.equal(diagnostic.sideEffects.resourceHintDedupeRowsRecorded, true);
  assert.equal(
    diagnostic.sideEffects.resourceHintPrecedenceRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.resourceHintHeadOrderRowsRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.scriptModulePreinitRowsRecorded, true);
  assert.equal(
    diagnostic.sideEffects.scriptModuleFakeHeadOrderRowsRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.modulePreloadStarted, false);
  assert.equal(diagnostic.sideEffects.scriptPreinitStarted, false);
  assert.equal(diagnostic.sideEffects.moduleScriptPreinitStarted, false);
  assert.equal(diagnostic.sideEffects.scriptExecutionStarted, false);
  assert.equal(
    diagnostic.sideEffects.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(diagnostic.sideEffects.preloadPreinitResourceMapCreated, false);
  assert.equal(diagnostic.sideEffects.preloadPreinitResourceMapMutated, false);
  assert.equal(diagnostic.sideEffects.realDocumentMutated, false);
  assert.equal(diagnostic.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(
    diagnostic.sideEffects.publicPreloadPreinitDedupeBehavior,
    false
  );
  assert.equal(diagnostic.sideEffects.compatibilityClaimed, false);
  assert.equal(diagnostic.orderAdmission.rawDocumentCaptured, false);
  assert.equal(diagnostic.orderAdmission.rawHeadCaptured, false);
  assert.equal(diagnostic.orderAdmission.resourceMapCreationAllowed, false);
  assert.equal(diagnostic.orderAdmission.fakeHeadMutationAllowed, false);
  assert.equal(diagnostic.orderAdmission.realHeadMutationAllowed, false);
  assert.deepEqual(
    diagnostic.dedupeRows.map((row) => ({
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      resourceStage: row.resourceStage,
      resourceKind: row.resourceKind,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      dedupeAction: row.dedupeAction,
      dedupeMatched: row.dedupeMatched,
      wouldInsertIntoHead: row.wouldInsertIntoHead,
      resourceMapMutated: row.resourceMapMutated
    })),
    [
      {
        inputIndex: 0,
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        dedupeMatched: false,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 1,
        contractId: 'preinit-style',
        resourceStage: 'preinit',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-theme',
        dedupeAction: 'preinit-adopts-preload',
        dedupeMatched: true,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 2,
        contractId: 'preinit-style',
        resourceStage: 'preinit',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-theme',
        dedupeAction: 'dedupe-preinit',
        dedupeMatched: true,
        wouldInsertIntoHead: false,
        resourceMapMutated: false
      },
      {
        inputIndex: 3,
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKind: 'script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        dedupeMatched: false,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 4,
        contractId: 'preinit-script',
        resourceStage: 'preinit',
        resourceKind: 'script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        dedupeAction: 'preinit-adopts-preload',
        dedupeMatched: true,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 5,
        contractId: 'preload-module',
        resourceStage: 'preload',
        resourceKind: 'script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        dedupeMatched: false,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 6,
        contractId: 'preinit-module-script',
        resourceStage: 'preinit',
        resourceKind: 'script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        dedupeAction: 'preinit-adopts-preload',
        dedupeMatched: true,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 7,
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKind: 'font',
        resourceKey: 'font:font-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        dedupeMatched: false,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      }
    ]
  );
  assert.deepEqual(diagnostic.precedenceRows, [
    {
      rowId: 'stylesheet-precedence-0',
      precedenceIndex: 0,
      precedenceKey: 'precedence-theme',
      sourceAdapterAdmissionIds: [admissions[1].adapterAdmissionId],
      resourceKeys: ['style:style-main'],
      plannedStylesheetCount: 1,
      orderingApplied: false,
      precedenceMapCreated: false,
      precedenceQueryRun: false,
      rawPrecedenceValueRetained: false,
      compatibilityClaimed: false
    }
  ]);
  assert.deepEqual(
    diagnostic.plannedHeadInsertionOrder.rows.map((row) => ({
      headOrderIndex: row.headOrderIndex,
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      placementKind: row.placementKind,
      insertionMethod: row.insertionMethod,
      insertionApplied: row.insertionApplied
    })),
    [
      {
        headOrderIndex: 0,
        inputIndex: 1,
        contractId: 'preinit-style',
        placementKind: 'stylesheet-precedence',
        insertionMethod: 'insert-before-or-after-precedence-peer',
        insertionApplied: false
      },
      {
        headOrderIndex: 1,
        inputIndex: 0,
        contractId: 'preload',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 2,
        inputIndex: 3,
        contractId: 'preload',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 3,
        inputIndex: 4,
        contractId: 'preinit-script',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 4,
        inputIndex: 5,
        contractId: 'preload-module',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 5,
        inputIndex: 6,
        contractId: 'preinit-module-script',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 6,
        inputIndex: 7,
        contractId: 'preload',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.observedHeadOrder.rows.map((row) => ({
      childIndex: row.childIndex,
      nodeName: row.nodeName,
      relationship: row.relationship,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      stylesheetPrecedenceCandidate: row.stylesheetPrecedenceCandidate,
      orderMutated: row.orderMutated
    })),
    [
      {
        childIndex: 0,
        nodeName: 'LINK',
        relationship: 'stylesheet',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-theme',
        stylesheetPrecedenceCandidate: true,
        orderMutated: false
      },
      {
        childIndex: 1,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKey: 'style-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 2,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKey: 'script-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 3,
        nodeName: 'SCRIPT',
        relationship: null,
        resourceKey: 'script-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 4,
        nodeName: 'LINK',
        relationship: 'modulepreload',
        resourceKey: 'module-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 5,
        nodeName: 'SCRIPT',
        relationship: null,
        resourceKey: 'module-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 6,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKey: 'font-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModulePreinitRows.map((row) => ({
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      resourceStage: row.resourceStage,
      resourceKind: row.resourceKind,
      scriptKind: row.scriptKind,
      dedupeKey: row.dedupeKey,
      dedupeAction: row.dedupeAction,
      modulePreload: row.modulePreload,
      moduleScriptPreinit: row.moduleScriptPreinit,
      publicResourceDispatchBlocked: row.publicResourceDispatchBlocked,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch,
      scriptExecutionStarted: row.scriptExecutionStarted
    })),
    [
      {
        inputIndex: 3,
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKind: 'script',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        dedupeAction: 'insert-preload',
        modulePreload: false,
        moduleScriptPreinit: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        inputIndex: 4,
        contractId: 'preinit-script',
        resourceStage: 'preinit',
        resourceKind: 'script',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        dedupeAction: 'preinit-adopts-preload',
        modulePreload: false,
        moduleScriptPreinit: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        inputIndex: 5,
        contractId: 'preload-module',
        resourceStage: 'preload',
        resourceKind: 'script',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        dedupeAction: 'insert-preload',
        modulePreload: true,
        moduleScriptPreinit: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        inputIndex: 6,
        contractId: 'preinit-module-script',
        resourceStage: 'preinit',
        resourceKind: 'script',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        dedupeAction: 'preinit-adopts-preload',
        modulePreload: false,
        moduleScriptPreinit: true,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModuleHeadOrder.plannedRows.map((row) => ({
      headOrderIndex: row.headOrderIndex,
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      resourceKind: row.resourceKind,
      scriptKind: row.scriptKind,
      resourceKey: row.resourceKey,
      insertionApplied: row.insertionApplied,
      publicResourceDispatchBlocked: row.publicResourceDispatchBlocked
    })),
    [
      {
        headOrderIndex: 2,
        inputIndex: 3,
        contractId: 'preload',
        resourceKind: 'script',
        scriptKind: 'classic',
        resourceKey: 'script:script-main',
        insertionApplied: false,
        publicResourceDispatchBlocked: true
      },
      {
        headOrderIndex: 3,
        inputIndex: 4,
        contractId: 'preinit-script',
        resourceKind: 'script',
        scriptKind: 'classic',
        resourceKey: 'script:script-main',
        insertionApplied: false,
        publicResourceDispatchBlocked: true
      },
      {
        headOrderIndex: 4,
        inputIndex: 5,
        contractId: 'preload-module',
        resourceKind: 'script',
        scriptKind: 'module',
        resourceKey: 'script:module-main',
        insertionApplied: false,
        publicResourceDispatchBlocked: true
      },
      {
        headOrderIndex: 5,
        inputIndex: 6,
        contractId: 'preinit-module-script',
        resourceKind: 'script',
        scriptKind: 'module',
        resourceKey: 'script:module-main',
        insertionApplied: false,
        publicResourceDispatchBlocked: true
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModuleHeadOrder.observedRows.map((row) => ({
      childIndex: row.childIndex,
      nodeName: row.nodeName,
      relationship: row.relationship,
      resourceKind: row.resourceKind,
      scriptKind: row.scriptKind,
      resourceKey: row.resourceKey,
      orderMutated: row.orderMutated
    })),
    [
      {
        childIndex: 2,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKind: 'script',
        scriptKind: 'classic',
        resourceKey: 'script-main',
        orderMutated: false
      },
      {
        childIndex: 3,
        nodeName: 'SCRIPT',
        relationship: null,
        resourceKind: 'script',
        scriptKind: 'classic',
        resourceKey: 'script-main',
        orderMutated: false
      },
      {
        childIndex: 4,
        nodeName: 'LINK',
        relationship: 'modulepreload',
        resourceKind: 'script',
        scriptKind: 'module',
        resourceKey: 'module-main',
        orderMutated: false
      },
      {
        childIndex: 5,
        nodeName: 'SCRIPT',
        relationship: null,
        resourceKind: 'script',
        scriptKind: 'module',
        resourceKey: 'module-main',
        orderMutated: false
      }
    ]
  );
  assert.equal(diagnostic.scriptModuleHeadOrder.fakeHeadMutated, false);
  assert.equal(
    diagnostic.scriptModuleHeadOrder.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(diagnostic.scriptModuleHeadOrder.scriptExecutionStarted, false);
  assert.deepEqual(diagnostic.publicScriptModuleDispatchBoundary, {
    status: 'blocked-public-script-module-resource-dispatch',
    scriptModuleRowCount: 4,
    scriptModuleRowsRecorded: true,
    publicResourceDispatchBlocked: true,
    publicScriptModuleResourceDispatch: false,
    publicDispatcherInvoked: false,
    publicResourceApisReachable: false,
    previousDispatcherInvoked: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    networkFetchStarted: false,
    realDocumentMutated: false,
    realHeadMutated: false,
    compatibilityClaimed: false,
    blockedCapabilities:
      resourceFormGate.resourceHintPreloadPreinitOrderBlockedCapabilities
  });
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.status,
    resourceFormGate.privateResourceHintHeadStylesheetPrecedenceBlockedStatus
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.stylesheetPrecedenceRowsObserved,
    true
  );
  assert.equal(diagnostic.stylesheetPrecedenceBoundary.stylesheetRowCount, 1);
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.observedStylesheetRowCount,
    1
  );
  assert.deepEqual(
    diagnostic.stylesheetPrecedenceBoundary.blockedCapabilities,
    resourceFormGate.resourceHintHeadStylesheetPrecedenceBlockedCapabilities
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintPreloadPreinitOrderBlockedCapabilities
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(diagnostic.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(
    diagnostic.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.equal(diagnostic.publicHeadBoundary.realDocumentMutated, false);
  assert.equal(fakeDom.head.childNodes.length, 7);
  assert.equal(
    JSON.stringify(diagnostic).includes('/style.css'),
    false
  );
  assert.equal(
    JSON.stringify(diagnostic).includes('sha256-style'),
    false
  );
  assert.equal(JSON.stringify(diagnostic).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(diagnostic).includes('nonce-module'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintPreloadPreinitOrderGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate
      .privateResourceHintPreloadPreinitOrderAdmissionRequiredStatus
  );
  assert.deepEqual(summary.acceptsContractIds, [
    'preload',
    'preload-module',
    'preinit-style',
    'preinit-script',
    'preinit-module-script'
  ]);
  assert.equal(summary.mutatesFakeHead, false);
  assert.equal(summary.mutatesRealHead, false);
  assert.equal(summary.recordsDedupeRows, true);
  assert.equal(summary.recordsPrecedenceRows, true);
  assert.equal(summary.recordsHeadOrderRows, true);
  assert.equal(summary.recordsScriptModulePreinitRows, true);
  assert.equal(summary.recordsScriptModuleHeadOrderRows, true);
  assert.equal(summary.publicScriptModuleResourceDispatch, false);
  assert.deepEqual(
    summary.blockedCapabilities,
    resourceFormGate.resourceHintPreloadPreinitOrderBlockedCapabilities
  );
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintPreloadPreinitOrderBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintPreloadPreinitOrderError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintPreloadPreinitOrderGateErrorCode
  );
  assert.equal(
    error.exportName,
    'resource-hint-preload-preinit-dedupe-order'
  );
  assert.equal(error.orderDiagnosticId, 'preload-preinit-order:1');
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintPreloadPreinitOrderBlockedCapabilities
  );

  assert.throws(
    () =>
      orderGate.recordPreloadPreinitOrderDiagnostic(admissions, {
        explicitOrderDiagnostic: true,
        fakeDocument: fakeDom.document,
        fakeHead: fakeDom.head,
        resourceDescriptors: []
      }),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'preload/preinit order gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintPreloadPreinitOrderGate()
        .recordPreloadPreinitOrderDiagnostic(admissions, {
          explicitOrderDiagnostic: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head,
          resourceDescriptors: []
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'resourceDescriptors must match the adapter admission count'
    }
  );
  const preconnectAdmission = adapterGate.admitDispatcherRecord(
    gate.recordResourceHintDispatcherRequest('C', [
      'https://connect.example.test',
      ''
    ]),
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintPreloadPreinitOrderGate()
        .recordPreloadPreinitOrderDiagnostic(
          [preconnectAdmission],
          {
            explicitOrderDiagnostic: true,
            fakeDocument: fakeDom.document,
            fakeHead: fakeDom.head,
            resourceDescriptors: [
              {
                sourceAdapterAdmissionId:
                  preconnectAdmission.adapterAdmissionId,
                resourceKind: 'other',
                resourceKey: 'connect-main'
              }
            ]
          }
        ),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidRecordCode,
      compatibilityTarget,
      contractId: 'preconnect'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintPreloadPreinitOrderGate()
        .recordPreloadPreinitOrderDiagnostic([admissions[1]], {
          explicitOrderDiagnostic: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head,
          resourceDescriptors: [
            {
              sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
              resourceKind: 'style',
              resourceKey: 'style-main'
            }
          ]
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'preinit-style descriptors must include precedenceKey'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintPreloadPreinitOrderError(
        {}
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint stylesheet precedence diagnostic records style dedupe and head order only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'stylesheet-precedence-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'stylesheet-precedence-adapter'
  });
  const orderGate =
    resourceFormGate.createResourceHintPreloadPreinitOrderGate({
      requestIdPrefix: 'stylesheet-precedence-order'
    });
  const stylesheetGate =
    resourceFormGate.createResourceHintStylesheetPrecedenceGate({
      requestIdPrefix: 'stylesheet-precedence'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const records = [
    gate.recordResourceHintDispatcherRequest('L', [
      '/style.css',
      'style',
      {
        crossOrigin: undefined,
        integrity: undefined,
        nonce: undefined,
        type: undefined,
        fetchPriority: 'low',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style-dupe',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: undefined,
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ])
  ];
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy('stylesheet precedence head props')
  ]);
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    })
  );

  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'stylesheet',
    'data-precedence': 'theme',
    'data-fast-react-resource-key': 'style-main',
    'data-fast-react-precedence-key': 'precedence-main'
  });
  appendFakeHeadChild(fakeDom, 'style', {
    'data-precedence': 'theme',
    'data-fast-react-resource-key': 'inline-main',
    'data-fast-react-precedence-key': 'precedence-main'
  });
  appendFakeHeadChild(fakeDom, 'meta', {
    name: 'description'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'preload',
    as: 'style',
    'data-fast-react-resource-key': 'style-main'
  });

  const order = orderGate.recordPreloadPreinitOrderDiagnostic(
    admissions,
    {
      explicitOrderDiagnostic: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head,
      resourceDescriptors: [
        {
          sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main'
        },
        {
          sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-main'
        },
        {
          sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-main'
        },
        {
          sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
          resourceKind: 'font',
          resourceKey: 'font-main'
        }
      ]
    }
  );
  const diagnostic = stylesheetGate.recordStylesheetPrecedenceDiagnostic(
    order,
    headRecord,
    {
      explicitStylesheetPrecedenceDiagnostic: true,
      precedenceKind: 'deterministic-fake-dom-stylesheet-precedence-order',
      precedenceId: 'stylesheet-precedence-order',
      targetKind: 'document-head',
      hostTag: 'head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintStylesheetPrecedenceGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintStylesheetPrecedenceRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintStylesheetPrecedenceRecordPayload(
      diagnostic
    ),
    diagnostic
  );
  assert.equal(diagnostic.stylesheetPrecedenceId, 'stylesheet-precedence:1');
  assert.equal(
    diagnostic.stylesheetPrecedenceStatus,
    resourceFormGate.privateResourceHintStylesheetPrecedenceStatus
  );
  assert.equal(
    diagnostic.executionStatus,
    resourceFormGate.privateResourceHintStylesheetPrecedenceExecutionStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintStylesheetPrecedenceSideEffects
  );
  assert.equal(
    diagnostic.sideEffects.fakeStylesheetPrecedenceDiagnosticInvoked,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceDedupeRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceInsertionRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceSingletonOrderRowsRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, false);
  assert.equal(diagnostic.sideEffects.realDocumentMutated, false);
  assert.equal(diagnostic.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(diagnostic.precedenceAdmission.rawDocumentCaptured, false);
  assert.equal(diagnostic.precedenceAdmission.rawHeadCaptured, false);
  assert.equal(
    diagnostic.precedenceAdmission.stylesheetResourceMapCreationAllowed,
    false
  );
  assert.equal(
    diagnostic.precedenceAdmission.headSingletonOrderingAllowed,
    false
  );
  assert.deepEqual(
    diagnostic.stylesheetDedupeRows.map((row) => ({
      contractId: row.contractId,
      resourceStage: row.resourceStage,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      dedupeAction: row.dedupeAction,
      wouldInsertIntoHead: row.wouldInsertIntoHead
    })),
    [
      {
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKey: 'style:style-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        wouldInsertIntoHead: true
      },
      {
        contractId: 'preinit-style',
        resourceStage: 'preinit',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-main',
        dedupeAction: 'preinit-adopts-preload',
        wouldInsertIntoHead: true
      },
      {
        contractId: 'preinit-style',
        resourceStage: 'preinit',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-main',
        dedupeAction: 'dedupe-preinit',
        wouldInsertIntoHead: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.precedenceRows.map((row) => ({
      precedenceKey: row.precedenceKey,
      plannedStylesheetCount: row.plannedStylesheetCount,
      observedStylesheetCount: row.observedStylesheetCount,
      firstObservedHeadIndex: row.firstObservedHeadIndex,
      orderingApplied: row.orderingApplied,
      precedenceMapCreated: row.precedenceMapCreated
    })),
    [
      {
        precedenceKey: 'precedence-main',
        plannedStylesheetCount: 1,
        observedStylesheetCount: 2,
        firstObservedHeadIndex: 0,
        orderingApplied: false,
        precedenceMapCreated: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.plannedStylesheetOrder.rows.map((row) => ({
      plannedStylesheetIndex: row.plannedStylesheetIndex,
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      precedenceKey: row.precedenceKey,
      insertionApplied: row.insertionApplied
    })),
    [
      {
        plannedStylesheetIndex: 0,
        inputIndex: 1,
        contractId: 'preinit-style',
        precedenceKey: 'precedence-main',
        insertionApplied: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.observedStylesheetOrder.rows.map((row) => ({
      childIndex: row.childIndex,
      nodeName: row.nodeName,
      relationship: row.relationship,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      stylesheetPrecedenceCandidate: row.stylesheetPrecedenceCandidate,
      clearRetainDecision: row.clearRetainDecision,
      orderMutated: row.orderMutated
    })),
    [
      {
        childIndex: 0,
        nodeName: 'LINK',
        relationship: 'stylesheet',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main',
        stylesheetPrecedenceCandidate: true,
        clearRetainDecision: 'retain',
        orderMutated: false
      },
      {
        childIndex: 1,
        nodeName: 'STYLE',
        relationship: null,
        resourceKey: 'inline-main',
        precedenceKey: 'precedence-main',
        stylesheetPrecedenceCandidate: true,
        clearRetainDecision: 'retain',
        orderMutated: false
      },
      {
        childIndex: 2,
        nodeName: 'META',
        relationship: null,
        resourceKey: null,
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        clearRetainDecision: 'clear',
        orderMutated: false
      },
      {
        childIndex: 3,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKey: 'style-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        clearRetainDecision: 'clear',
        orderMutated: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.headSingletonOrderBoundary,
    {
      rowId: 'head-singleton-stylesheet-order',
      rowType: 'host-singleton',
      hostTag: 'head',
      sourceHeadRequestId: headRecord.requestId,
      sourceOrderDiagnosticId: order.orderDiagnosticId,
      headContractId: 'head-singleton',
      plannedStylesheetRowCount: 1,
      observedStylesheetRowCount: 2,
      retainedChildCount: 2,
      clearableChildCount: 2,
      clearHeadWouldRun: true,
      clearHeadWouldRetainStylesheets: true,
      releaseSingletonWouldRun: true,
      headSingletonResolved: false,
      headSingletonAcquired: false,
      headSingletonReleased: false,
      headChildrenCleared: false,
      singletonOrderingApplied: false,
      publicHeadSingletonBehavior: false,
      rawValuesRetained: false,
      compatibilityClaimed: false,
      blockedCapabilities:
        resourceFormGate.resourceHintStylesheetPrecedenceBlockedCapabilities
    }
  );
  assert.deepEqual(
    diagnostic.stylesheetResourceMapPlan,
    {
      resourceMapKind:
        'react-19.2.6-stylesheet-precedence-resource-map-diagnostic',
      stylesheetResourceMapCreated: false,
      stylesheetResourceMapMutated: false,
      inputRowCount: 3,
      uniqueStylesheetResourceCount: 1,
      preloadStyleResourceCount: 1,
      preinitStyleResourceCount: 2,
      dedupedStyleRowCount: 1,
      rawValuesRetained: false,
      compatibilityClaimed: false
    }
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.status,
    resourceFormGate.privateResourceHintHeadStylesheetPrecedenceBlockedStatus
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.stylesheetPrecedenceRowsObserved,
    true
  );
  assert.equal(diagnostic.stylesheetPrecedenceBoundary.stylesheetRowCount, 1);
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.observedStylesheetRowCount,
    2
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetPrecedenceBlockedCapabilities
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(
    diagnostic.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.equal(fakeDom.head.childNodes.length, 4);
  assert.equal(JSON.stringify(diagnostic).includes('/style.css'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-style'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintStylesheetPrecedenceGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate
      .privateResourceHintStylesheetPrecedenceAdmissionRequiredStatus
  );
  assert.equal(summary.recordsStylesheetDedupeRows, true);
  assert.equal(summary.recordsStylesheetInsertionRows, true);
  assert.equal(summary.recordsHeadSingletonOrderRows, true);
  assert.deepEqual(
    summary.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetPrecedenceBlockedCapabilities
  );
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintStylesheetPrecedenceBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintStylesheetPrecedenceError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintStylesheetPrecedenceGateErrorCode
  );
  assert.equal(error.exportName, 'resource-hint-stylesheet-precedence-order');
  assert.equal(error.stylesheetPrecedenceId, 'stylesheet-precedence:1');
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetPrecedenceBlockedCapabilities
  );

  assert.throws(
    () =>
      stylesheetGate.recordStylesheetPrecedenceDiagnostic(
        order,
        headRecord,
        {
          explicitStylesheetPrecedenceDiagnostic: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetPrecedenceInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stylesheet precedence gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintStylesheetPrecedenceGate()
        .recordStylesheetPrecedenceDiagnostic(order, {}, {
          explicitStylesheetPrecedenceDiagnostic: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetPrecedenceInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintStylesheetPrecedenceError(
        {}
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetPrecedenceInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint resource-map commit diagnostic executes script/module fake-resource ordering only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-map-commit-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'resource-map-commit-adapter'
  });
  const orderGate =
    resourceFormGate.createResourceHintPreloadPreinitOrderGate({
      requestIdPrefix: 'resource-map-commit-order'
    });
  const stylesheetGate =
    resourceFormGate.createResourceHintStylesheetPrecedenceGate({
      requestIdPrefix: 'resource-map-commit-stylesheet'
    });
  const loadStateGate =
    resourceFormGate.createResourceHintStylesheetLoadErrorStateGate({
      requestIdPrefix: 'resource-map-commit-load-state'
    });
  const commitGate =
    resourceFormGate.createResourceHintResourceMapCommitGate({
      requestIdPrefix: 'resource-map-commit'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const records = [
    gate.recordResourceHintDispatcherRequest('L', [
      '/style.css',
      'style',
      {
        crossOrigin: undefined,
        integrity: undefined,
        nonce: undefined,
        type: undefined,
        fetchPriority: 'low',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/script.js',
      'script',
      {
        crossOrigin: undefined,
        integrity: 'sha256-script-preload',
        nonce: undefined,
        type: undefined,
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('X', [
      '/script.js',
      {
        crossOrigin: undefined,
        integrity: 'sha256-script',
        fetchPriority: 'high',
        nonce: 'nonce-script'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('m', [
      '/module.mjs',
      {
        as: undefined,
        crossOrigin: '',
        integrity: 'sha256-module-preload'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('M', [
      '/module.mjs',
      {
        crossOrigin: '',
        integrity: 'sha256-module',
        nonce: 'nonce-module'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: undefined,
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ])
  ];
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy('resource map commit head props')
  ]);
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    })
  );

  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'stylesheet',
    'data-precedence': 'theme',
    'data-fast-react-resource-key': 'style-main',
    'data-fast-react-precedence-key': 'precedence-main'
  });
  appendFakeHeadChild(fakeDom, 'script', {
    'data-fast-react-resource-key': 'script-main'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'modulepreload',
    'data-fast-react-resource-key': 'module-main'
  });
  appendFakeHeadChild(fakeDom, 'script', {
    type: 'module',
    'data-fast-react-resource-key': 'module-main'
  });

  const order = orderGate.recordPreloadPreinitOrderDiagnostic(
    admissions,
    {
      explicitOrderDiagnostic: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head,
      resourceDescriptors: [
        {
          sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main'
        },
        {
          sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-main'
        },
        {
          sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'script-main'
        },
        {
          sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'script-main'
        },
        {
          sourceAdapterAdmissionId: admissions[4].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'module-main'
        },
        {
          sourceAdapterAdmissionId: admissions[5].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'module-main'
        },
        {
          sourceAdapterAdmissionId: admissions[6].adapterAdmissionId,
          resourceKind: 'font',
          resourceKey: 'font-main'
        }
      ]
    }
  );
  const stylesheet = stylesheetGate.recordStylesheetPrecedenceDiagnostic(
    order,
    headRecord,
    {
      explicitStylesheetPrecedenceDiagnostic: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const loadState = loadStateGate.recordStylesheetLoadErrorStateDiagnostic(
    stylesheet,
    {
      explicitStylesheetLoadErrorStateDiagnostic: true,
      stateKind: 'deterministic-fake-stylesheet-load-error-state',
      stateId: 'resource-map-commit-load-state',
      targetKind: 'stylesheet-resource-state'
    }
  );
  const diagnostic = commitGate.recordResourceMapCommitDiagnostic(
    order,
    stylesheet,
    {
      explicitResourceMapCommitDiagnostic: true,
      commitKind: 'deterministic-private-resource-map-commit',
      commitId: 'resource-map-commit-plan',
      targetKind: 'document-head',
      hostTag: 'head'
    },
    loadState
  );
  const summary =
    resourceFormGate.describePrivateResourceHintResourceMapCommitGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintResourceMapCommitRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintResourceMapCommitRecordPayload(
      diagnostic
    ),
    diagnostic
  );
  assert.equal(diagnostic.resourceMapCommitId, 'resource-map-commit:1');
  assert.equal(
    diagnostic.resourceMapCommitStatus,
    resourceFormGate.privateResourceHintResourceMapCommitStatus
  );
  assert.equal(
    diagnostic.executionStatus,
    resourceFormGate.privateResourceHintResourceMapCommitExecutionStatus
  );
  assert.equal(
    diagnostic.compatibilityStatus,
    resourceFormGate
      .privateResourceHintResourceMapCommitCompatibilityBlockedStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintResourceMapCommitSideEffects
  );
  assert.equal(
    diagnostic.sideEffects.fakeResourceMapCommitDiagnosticInvoked,
    true
  );
  assert.equal(
    diagnostic.sideEffects.privateResourceMapCommitRecordsCreated,
    true
  );
  assert.equal(diagnostic.sideEffects.fakeHeadRead, false);
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, false);
  assert.equal(diagnostic.sideEffects.realResourceMapsCreated, false);
  assert.equal(diagnostic.sideEffects.realResourceMapsMutated, false);
  assert.equal(diagnostic.sideEffects.fakeResourceMapsCreated, false);
  assert.equal(diagnostic.sideEffects.fakeResourceMapsMutated, false);
  assert.equal(
    diagnostic.sideEffects.stylesheetRecordOwnershipClaimed,
    false
  );
  assert.equal(diagnostic.sideEffects.preloadRecordStarted, false);
  assert.equal(diagnostic.sideEffects.scriptRecordLoaded, false);
  assert.equal(diagnostic.sideEffects.modulePreloadStarted, false);
  assert.equal(diagnostic.sideEffects.scriptPreinitStarted, false);
  assert.equal(diagnostic.sideEffects.moduleScriptPreinitStarted, false);
  assert.equal(
    diagnostic.sideEffects.moduleResourceMapOrderRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.moduleResourceMapDedupeKeysRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.fakeScriptModuleCommitExecutionDiagnosticInvoked,
    true
  );
  assert.equal(
    diagnostic.sideEffects.scriptModuleFakeDomCommitRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.scriptResourceFakeDomCommitRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.modulePreloadFakeDomCommitRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadErrorStateRecordConsumed,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateCommitOrderRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateResourceMapRowsValidated,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateCommitTransitionRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.fakeStylesheetResourceCommitTransitionRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects
      .fakeStylesheetLoadStateCommitExecutionDiagnosticInvoked,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateCommitExecutionRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateChangeRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.deterministicStylesheetLoadStateChangesRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.scriptExecutionStarted, false);
  assert.equal(
    diagnostic.sideEffects.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(diagnostic.sideEffects.resourceLoadStateMutated, false);
  assert.equal(diagnostic.sideEffects.resourceFetchStarted, false);
  assert.equal(
    diagnostic.sideEffects.preloadOrStyleDomWorkDispatched,
    false
  );
  assert.equal(diagnostic.commitAdmission.rawResourceMapCaptured, false);
  assert.equal(
    diagnostic.commitAdmission.realResourceMapMutationAllowed,
    false
  );
  assert.equal(
    diagnostic.commitAdmission.fakeResourceMapMutationAllowed,
    false
  );
  assert.equal(
    diagnostic.commitAdmission.privateResourceMapRecordCreationAllowed,
    true
  );
  assert.deepEqual(
    diagnostic.acceptedContractIds,
    [
      'preload',
      'preinit-style',
      'preinit-script',
      'preload-module',
      'preinit-module-script'
    ]
  );
  assert.deepEqual(diagnostic.resourceMapCommitPlan, {
    resourceMapKind:
      'react-19.2.6-resource-map-commit-diagnostic',
    targetKind: 'document-head',
    hostTag: 'head',
    privateResourceMapRecordCount: 7,
    uniquePrivateResourceRecordCount: 7,
    stylesheetRecordCount: 1,
    preloadRecordCount: 4,
    scriptRecordCount: 2,
    modulePreloadRecordCount: 1,
    moduleScriptRecordCount: 1,
    moduleResourceMapOrderRowCount: 4,
    moduleResourceMapDedupeKeyCount: 2,
    scriptModuleFakeDomCommitExecutionRowCount: 4,
    scriptResourceFakeDomCommitExecutionRowCount: 2,
    modulePreloadFakeDomCommitExecutionRowCount: 1,
    scriptModuleFakeResourceOrderExecutionRowCount: 4,
    scriptModuleFakeResourceOrderDedupeStateCount: 2,
    scriptModuleFakeResourceOrderPreloadPropsRecordCount: 2,
    scriptModuleFakeResourceOrderHoistableScriptRecordCount: 2,
    scriptModuleFakeResourceOrderPreloadPropsAdoptionCount: 2,
    stylesheetLoadStateCommitOrderRowCount: 1,
    stylesheetLoadStateResourceCount: 1,
    stylesheetLoadStateCommitTransitionCount: 1,
    stylesheetLoadStateCommitTransitionResourceCount: 1,
    stylesheetLoadStateCommitExecutionRowCount: 1,
    stylesheetLoadStateChangeRowCount: 3,
    unmatchedStylesheetLoadStateResourceCount: 0,
    malformedModuleRowCount: 0,
    conflictingDuplicateRecordCount: 0,
    duplicateStylesheetPrecedenceRowCount: 0,
    staleResourceMapEntryCount: 0,
    dedupedRecordCount: 0,
    wouldInsertRecordCount: 7,
    realResourceMapsCreated: false,
    realResourceMapsMutated: false,
    fakeResourceMapsCreated: false,
    fakeResourceMapsMutated: false,
    hoistableStylesMapCreated: false,
    hoistableStylesMapMutated: false,
    hoistableScriptsMapCreated: false,
    hoistableScriptsMapMutated: false,
    preloadPropsMapCreated: false,
    preloadPropsMapMutated: false,
    scriptModuleFakeDomCommitEvidenceRecorded: true,
    stylesheetLoadStateCommitExecutionRecorded: true,
    deterministicStylesheetLoadStateChangesRecorded: true,
    fakeDomCommitApplied: false,
    scriptModuleFakeResourceOrderingExecuted: true,
    scriptModuleFakeResourceOrderingApplied: true,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    publicScriptModuleResourceDispatch: false,
    preloadOrStyleDomWorkDispatched: false,
    publicResourceMapCommitBehavior: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(
    diagnostic.privateResourceMapRecords.map((row) => ({
      recordKind: row.recordKind,
      mapKind: row.mapKind,
      contractId: row.contractId,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      privateRecordCreated: row.privateRecordCreated,
      realResourceMapMutated: row.realResourceMapMutated,
      fakeResourceMapMutated: row.fakeResourceMapMutated,
      fetchStarted: row.fetchStarted,
      preloadStarted: row.preloadStarted,
      loadEventSubscribed: row.loadEventSubscribed,
      loadingStateMutated: row.loadingStateMutated
    })),
    [
      {
        recordKind: 'preload',
        mapKind: 'preload-props',
        contractId: 'preload',
        resourceKey: 'style:style-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'stylesheet',
        mapKind: 'hoistable-styles',
        contractId: 'preinit-style',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-main',
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'preload',
        mapKind: 'preload-props',
        contractId: 'preload',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        contractId: 'preinit-script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'preload',
        mapKind: 'preload-props',
        contractId: 'preload-module',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        contractId: 'preinit-module-script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'preload',
        mapKind: 'preload-props',
        contractId: 'preload',
        resourceKey: 'font:font-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.privateResourceMapRecords
      .filter((row) =>
        [
          'preload',
          'preinit-script',
          'preload-module',
          'preinit-module-script'
        ].includes(row.contractId)
      )
      .map((row) => ({
        contractId: row.contractId,
        resourceKey: row.resourceKey,
        dedupeKey: row.dedupeKey,
        resourceMapDedupeKey: row.resourceMapDedupeKey,
        scriptKind: row.scriptKind,
        modulePreload: row.modulePreload,
        moduleScript: row.moduleScript,
        publicResourceDispatchBlocked: row.publicResourceDispatchBlocked,
        publicScriptModuleResourceDispatch:
          row.publicScriptModuleResourceDispatch,
        modulePreloadStarted: row.modulePreloadStarted,
        scriptPreinitStarted: row.scriptPreinitStarted,
        moduleScriptPreinitStarted: row.moduleScriptPreinitStarted,
        scriptExecutionStarted: row.scriptExecutionStarted
      })),
    [
      {
        contractId: 'preload',
        resourceKey: 'style:style-main',
        dedupeKey: 'style:style-main',
        resourceMapDedupeKey: 'preload-props:style:style-main',
        scriptKind: null,
        modulePreload: false,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preload',
        resourceKey: 'script:script-main',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'preload-props:script:script-main',
        scriptKind: 'classic',
        modulePreload: false,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preinit-script',
        resourceKey: 'script:script-main',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:script-main',
        scriptKind: 'classic',
        modulePreload: false,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preload-module',
        resourceKey: 'script:module-main',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'preload-props:script:module-main',
        scriptKind: 'module',
        modulePreload: true,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preinit-module-script',
        resourceKey: 'script:module-main',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:module-main',
        scriptKind: 'module',
        modulePreload: false,
        moduleScript: true,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preload',
        resourceKey: 'font:font-main',
        dedupeKey: 'font:font-main',
        resourceMapDedupeKey: 'preload-props:font:font-main',
        scriptKind: null,
        modulePreload: false,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.moduleResourceMapOrder.rows.map((row) => ({
      moduleOrderIndex: row.moduleOrderIndex,
      resourceMapOrderIndex: row.resourceMapOrderIndex,
      contractId: row.contractId,
      recordKind: row.recordKind,
      mapKind: row.mapKind,
      scriptKind: row.scriptKind,
      dedupeKey: row.dedupeKey,
      resourceMapDedupeKey: row.resourceMapDedupeKey,
      modulePreload: row.modulePreload,
      moduleScript: row.moduleScript,
      headInsertionApplied: row.headInsertionApplied,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch,
      scriptExecutionStarted: row.scriptExecutionStarted
    })),
    [
      {
        moduleOrderIndex: 0,
        resourceMapOrderIndex: 2,
        contractId: 'preload',
        recordKind: 'preload',
        mapKind: 'preload-props',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'preload-props:script:script-main',
        modulePreload: false,
        moduleScript: false,
        headInsertionApplied: false,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        moduleOrderIndex: 1,
        resourceMapOrderIndex: 3,
        contractId: 'preinit-script',
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:script-main',
        modulePreload: false,
        moduleScript: false,
        headInsertionApplied: false,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        moduleOrderIndex: 2,
        resourceMapOrderIndex: 4,
        contractId: 'preload-module',
        recordKind: 'preload',
        mapKind: 'preload-props',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'preload-props:script:module-main',
        modulePreload: true,
        moduleScript: false,
        headInsertionApplied: false,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        moduleOrderIndex: 3,
        resourceMapOrderIndex: 5,
        contractId: 'preinit-module-script',
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:module-main',
        modulePreload: false,
        moduleScript: true,
        headInsertionApplied: false,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.moduleResourceMapOrder.dedupeKeys.map((row) => ({
      dedupeKey: row.dedupeKey,
      rowCount: row.rowCount,
      resourceMapDedupeKeys: row.resourceMapDedupeKeys,
      contractIdsInOrder: row.contractIdsInOrder,
      recordKindsInOrder: row.recordKindsInOrder,
      scriptKindsInOrder: row.scriptKindsInOrder,
      hasClassicScriptPreload: row.hasClassicScriptPreload,
      hasModulePreload: row.hasModulePreload,
      hasClassicScriptPreinit: row.hasClassicScriptPreinit,
      hasModuleScriptPreinit: row.hasModuleScriptPreinit,
      conflictStatus: row.conflictStatus
    })),
    [
      {
        dedupeKey: 'script:script-main',
        rowCount: 2,
        resourceMapDedupeKeys: [
          'preload-props:script:script-main',
          'hoistable-scripts:script:script-main'
        ],
        contractIdsInOrder: ['preload', 'preinit-script'],
        recordKindsInOrder: ['preload', 'script'],
        scriptKindsInOrder: ['classic', 'classic'],
        hasClassicScriptPreload: true,
        hasModulePreload: false,
        hasClassicScriptPreinit: true,
        hasModuleScriptPreinit: false,
        conflictStatus: 'validated-no-conflicting-duplicates'
      },
      {
        dedupeKey: 'script:module-main',
        rowCount: 2,
        resourceMapDedupeKeys: [
          'preload-props:script:module-main',
          'hoistable-scripts:script:module-main'
        ],
        contractIdsInOrder: [
          'preload-module',
          'preinit-module-script'
        ],
        recordKindsInOrder: ['preload', 'script'],
        scriptKindsInOrder: ['module', 'module'],
        hasClassicScriptPreload: false,
        hasModulePreload: true,
        hasClassicScriptPreinit: false,
        hasModuleScriptPreinit: true,
        conflictStatus: 'validated-no-conflicting-duplicates'
      }
    ]
  );
  assert.deepEqual(
    {
      executionKind:
        diagnostic.scriptModuleFakeDomCommitExecution.executionKind,
      rowCount: diagnostic.scriptModuleFakeDomCommitExecution.rowCount,
      scriptResourceMapRowCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .scriptResourceMapRowCount,
      modulePreloadResourceMapRowCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .modulePreloadResourceMapRowCount,
      fakeResourceOrderExecutionRowCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecutionRowCount,
      fakeResourceOrderDedupeStateCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderDedupeStateCount,
      fakeResourceOrderPreloadPropsRecordCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderPreloadPropsRecordCount,
      fakeResourceOrderHoistableScriptRecordCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderHoistableScriptRecordCount,
      fakeResourceOrderPreloadPropsAdoptionCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderPreloadPropsAdoptionCount,
      fakeDomCommitEvidenceRecorded:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeDomCommitEvidenceRecorded,
      fakeDomCommitApplied:
        diagnostic.scriptModuleFakeDomCommitExecution.fakeDomCommitApplied,
      fakeResourceOrderingExecuted:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderingExecuted,
      fakeResourceOrderingApplied:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderingApplied,
      publicScriptModuleResourceDispatch:
        diagnostic.scriptModuleFakeDomCommitExecution
          .publicScriptModuleResourceDispatch,
      scriptExecutionStarted:
        diagnostic.scriptModuleFakeDomCommitExecution
          .scriptExecutionStarted
    },
    {
      executionKind:
        'react-19.2.6-script-modulepreload-fake-dom-commit-execution-diagnostic',
      rowCount: 4,
      scriptResourceMapRowCount: 2,
      modulePreloadResourceMapRowCount: 1,
      fakeResourceOrderExecutionRowCount: 4,
      fakeResourceOrderDedupeStateCount: 2,
      fakeResourceOrderPreloadPropsRecordCount: 2,
      fakeResourceOrderHoistableScriptRecordCount: 2,
      fakeResourceOrderPreloadPropsAdoptionCount: 2,
      fakeDomCommitEvidenceRecorded: true,
      fakeDomCommitApplied: false,
      fakeResourceOrderingExecuted: true,
      fakeResourceOrderingApplied: true,
      publicScriptModuleResourceDispatch: false,
      scriptExecutionStarted: false
    }
  );
  assert.deepEqual(
    diagnostic.scriptModuleFakeDomCommitExecution.rows.map((row) => ({
      executionOrderIndex: row.executionOrderIndex,
      moduleOrderIndex: row.moduleOrderIndex,
      sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
      sourceModuleDedupeKeyRowId: row.sourceModuleDedupeKeyRowId,
      contractId: row.contractId,
      recordKind: row.recordKind,
      mapKind: row.mapKind,
      scriptKind: row.scriptKind,
      dedupeKey: row.dedupeKey,
      resourceMapDedupeKey: row.resourceMapDedupeKey,
      fakeDomCommitOperation: row.fakeDomCommitOperation,
      wouldCreatePreloadPropsRecord:
        row.wouldCreatePreloadPropsRecord,
      wouldCreateHoistableScriptResource:
        row.wouldCreateHoistableScriptResource,
      wouldAdoptPreloadProps: row.wouldAdoptPreloadProps,
      fakeDomCommitApplied: row.fakeDomCommitApplied,
      dedupeOrderPreserved: row.dedupeOrderPreserved,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch,
      scriptExecutionStarted: row.scriptExecutionStarted
    })),
    [
      {
        executionOrderIndex: 0,
        moduleOrderIndex: 0,
        sourceResourceMapCommitRowId: 'resource-map-commit-2',
        sourceModuleDedupeKeyRowId: 'module-resource-map-dedupe-key-0',
        contractId: 'preload',
        recordKind: 'preload',
        mapKind: 'preload-props',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'preload-props:script:script-main',
        fakeDomCommitOperation:
          'record-classic-script-preload-props-fake-dom-commit',
        wouldCreatePreloadPropsRecord: true,
        wouldCreateHoistableScriptResource: false,
        wouldAdoptPreloadProps: false,
        fakeDomCommitApplied: false,
        dedupeOrderPreserved: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        executionOrderIndex: 1,
        moduleOrderIndex: 1,
        sourceResourceMapCommitRowId: 'resource-map-commit-3',
        sourceModuleDedupeKeyRowId: 'module-resource-map-dedupe-key-0',
        contractId: 'preinit-script',
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:script-main',
        fakeDomCommitOperation:
          'record-classic-script-hoistable-script-fake-dom-commit',
        wouldCreatePreloadPropsRecord: false,
        wouldCreateHoistableScriptResource: true,
        wouldAdoptPreloadProps: true,
        fakeDomCommitApplied: false,
        dedupeOrderPreserved: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        executionOrderIndex: 2,
        moduleOrderIndex: 2,
        sourceResourceMapCommitRowId: 'resource-map-commit-4',
        sourceModuleDedupeKeyRowId: 'module-resource-map-dedupe-key-1',
        contractId: 'preload-module',
        recordKind: 'preload',
        mapKind: 'preload-props',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'preload-props:script:module-main',
        fakeDomCommitOperation:
          'record-modulepreload-preload-props-fake-dom-commit',
        wouldCreatePreloadPropsRecord: true,
        wouldCreateHoistableScriptResource: false,
        wouldAdoptPreloadProps: false,
        fakeDomCommitApplied: false,
        dedupeOrderPreserved: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        executionOrderIndex: 3,
        moduleOrderIndex: 3,
        sourceResourceMapCommitRowId: 'resource-map-commit-5',
        sourceModuleDedupeKeyRowId: 'module-resource-map-dedupe-key-1',
        contractId: 'preinit-module-script',
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:module-main',
        fakeDomCommitOperation:
          'record-module-script-hoistable-script-fake-dom-commit',
        wouldCreatePreloadPropsRecord: false,
        wouldCreateHoistableScriptResource: true,
        wouldAdoptPreloadProps: true,
        fakeDomCommitApplied: false,
        dedupeOrderPreserved: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModuleFakeDomCommitExecution.dedupeOrderBoundary,
    {
      status:
        'preserved-private-script-module-resource-map-dedupe-order-blocker',
      sourceModuleResourceMapOrderRowCount: 4,
      sourceModuleResourceMapDedupeKeyCount: 2,
      executionRowCount: 4,
      consumedDedupeKeyCount: 2,
      sourceDedupeKeyRowIds: [
        'module-resource-map-dedupe-key-0',
        'module-resource-map-dedupe-key-1'
      ],
      sourceDedupeKeys: [
        'script:script-main',
        'script:module-main'
      ],
      dedupeRowsMutated: false,
      orderRowsMutated: false,
      conflictingDuplicateRecordCount: 0,
      malformedModuleRowCount: 0,
      publicScriptModuleResourceDispatch: false,
      rawValuesRetained: false,
      compatibilityClaimed: false
    }
  );
  assert.deepEqual(
    {
      executionKind:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.executionKind,
      rowCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.rowCount,
      dedupeStateCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.dedupeStateCount,
      preloadPropsRecordCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.preloadPropsRecordCount,
      hoistableScriptResourceCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.hoistableScriptResourceCount,
      preloadPropsAdoptionCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.preloadPropsAdoptionCount,
      fakeResourceOrderingExecuted:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.fakeResourceOrderingExecuted,
      fakeResourceOrderingApplied:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.fakeResourceOrderingApplied,
      preloadPropsMapMutated:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.preloadPropsMapMutated,
      hoistableScriptsMapMutated:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.hoistableScriptsMapMutated,
      scriptExecutionStarted:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.scriptExecutionStarted,
      publicScriptModuleResourceDispatch:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.publicScriptModuleResourceDispatch
    },
    {
      executionKind:
        'react-19.2.6-script-modulepreload-fake-resource-order-execution-diagnostic',
      rowCount: 4,
      dedupeStateCount: 2,
      preloadPropsRecordCount: 2,
      hoistableScriptResourceCount: 2,
      preloadPropsAdoptionCount: 2,
      fakeResourceOrderingExecuted: true,
      fakeResourceOrderingApplied: true,
      preloadPropsMapMutated: false,
      hoistableScriptsMapMutated: false,
      scriptExecutionStarted: false,
      publicScriptModuleResourceDispatch: false
    }
  );
  assert.deepEqual(
    diagnostic.scriptModuleFakeDomCommitExecution
      .fakeResourceOrderExecution.rows.map((row) => ({
        fakeResourceOrderIndex: row.fakeResourceOrderIndex,
        sourceScriptModuleFakeDomCommitRowId:
          row.sourceScriptModuleFakeDomCommitRowId,
        contractId: row.contractId,
        recordKind: row.recordKind,
        scriptKind: row.scriptKind,
        dedupeKey: row.dedupeKey,
        fakeResourceOrderOperation: row.fakeResourceOrderOperation,
        preloadPropsRecordObservedBefore:
          row.preloadPropsRecordObservedBefore,
        hoistableScriptResourceObservedBefore:
          row.hoistableScriptResourceObservedBefore,
        fakePreloadPropsRecordCreated:
          row.fakePreloadPropsRecordCreated,
        fakeHoistableScriptResourceCreated:
          row.fakeHoistableScriptResourceCreated,
        fakePreloadPropsAdopted: row.fakePreloadPropsAdopted,
        fakeResourceOrderingExecuted:
          row.fakeResourceOrderingExecuted,
        preloadPropsMapMutated: row.preloadPropsMapMutated,
        hoistableScriptsMapMutated: row.hoistableScriptsMapMutated,
        scriptExecutionStarted: row.scriptExecutionStarted
      })),
    [
      {
        fakeResourceOrderIndex: 0,
        sourceScriptModuleFakeDomCommitRowId:
          'script-module-fake-dom-commit-0',
        contractId: 'preload',
        recordKind: 'preload',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        fakeResourceOrderOperation:
          'execute-classic-script-preload-props-fake-resource-order',
        preloadPropsRecordObservedBefore: false,
        hoistableScriptResourceObservedBefore: false,
        fakePreloadPropsRecordCreated: true,
        fakeHoistableScriptResourceCreated: false,
        fakePreloadPropsAdopted: false,
        fakeResourceOrderingExecuted: true,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      },
      {
        fakeResourceOrderIndex: 1,
        sourceScriptModuleFakeDomCommitRowId:
          'script-module-fake-dom-commit-1',
        contractId: 'preinit-script',
        recordKind: 'script',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        fakeResourceOrderOperation:
          'execute-classic-script-hoistable-script-fake-resource-order',
        preloadPropsRecordObservedBefore: true,
        hoistableScriptResourceObservedBefore: false,
        fakePreloadPropsRecordCreated: false,
        fakeHoistableScriptResourceCreated: true,
        fakePreloadPropsAdopted: true,
        fakeResourceOrderingExecuted: true,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      },
      {
        fakeResourceOrderIndex: 2,
        sourceScriptModuleFakeDomCommitRowId:
          'script-module-fake-dom-commit-2',
        contractId: 'preload-module',
        recordKind: 'preload',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        fakeResourceOrderOperation:
          'execute-modulepreload-preload-props-fake-resource-order',
        preloadPropsRecordObservedBefore: false,
        hoistableScriptResourceObservedBefore: false,
        fakePreloadPropsRecordCreated: true,
        fakeHoistableScriptResourceCreated: false,
        fakePreloadPropsAdopted: false,
        fakeResourceOrderingExecuted: true,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      },
      {
        fakeResourceOrderIndex: 3,
        sourceScriptModuleFakeDomCommitRowId:
          'script-module-fake-dom-commit-3',
        contractId: 'preinit-module-script',
        recordKind: 'script',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        fakeResourceOrderOperation:
          'execute-module-script-hoistable-script-fake-resource-order',
        preloadPropsRecordObservedBefore: true,
        hoistableScriptResourceObservedBefore: false,
        fakePreloadPropsRecordCreated: false,
        fakeHoistableScriptResourceCreated: true,
        fakePreloadPropsAdopted: true,
        fakeResourceOrderingExecuted: true,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModuleFakeDomCommitExecution
      .fakeResourceOrderExecution.dedupeStates.map((row) => ({
        dedupeKey: row.dedupeKey,
        rowCount: row.rowCount,
        sourceScriptModuleFakeDomCommitRowIds:
          row.sourceScriptModuleFakeDomCommitRowIds,
        contractIdsInOrder: row.contractIdsInOrder,
        scriptKindsInOrder: row.scriptKindsInOrder,
        preloadPropsRecordCreated:
          row.preloadPropsRecordCreated,
        hoistableScriptResourceCreated:
          row.hoistableScriptResourceCreated,
        preloadPropsAdoptionCount: row.preloadPropsAdoptionCount,
        preloadPropsMapMutated: row.preloadPropsMapMutated,
        hoistableScriptsMapMutated: row.hoistableScriptsMapMutated,
        scriptExecutionStarted: row.scriptExecutionStarted
      })),
    [
      {
        dedupeKey: 'script:script-main',
        rowCount: 2,
        sourceScriptModuleFakeDomCommitRowIds: [
          'script-module-fake-dom-commit-0',
          'script-module-fake-dom-commit-1'
        ],
        contractIdsInOrder: ['preload', 'preinit-script'],
        scriptKindsInOrder: ['classic', 'classic'],
        preloadPropsRecordCreated: true,
        hoistableScriptResourceCreated: true,
        preloadPropsAdoptionCount: 1,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      },
      {
        dedupeKey: 'script:module-main',
        rowCount: 2,
        sourceScriptModuleFakeDomCommitRowIds: [
          'script-module-fake-dom-commit-2',
          'script-module-fake-dom-commit-3'
        ],
        contractIdsInOrder: [
          'preload-module',
          'preinit-module-script'
        ],
        scriptKindsInOrder: ['module', 'module'],
        preloadPropsRecordCreated: true,
        hoistableScriptResourceCreated: true,
        preloadPropsAdoptionCount: 1,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    {
      status: diagnostic.resourceMapConflictBoundary.status,
      checkedScriptModuleRecordCount:
        diagnostic.resourceMapConflictBoundary
          .checkedScriptModuleRecordCount,
      checkedDedupeKeyCount:
        diagnostic.resourceMapConflictBoundary.checkedDedupeKeyCount,
      checkedStylesheetPrecedenceRecordCount:
        diagnostic.resourceMapConflictBoundary
          .checkedStylesheetPrecedenceRecordCount,
      checkedStylesheetPrecedenceKeyCount:
        diagnostic.resourceMapConflictBoundary
          .checkedStylesheetPrecedenceKeyCount,
      malformedModuleRowCount:
        diagnostic.resourceMapConflictBoundary.malformedModuleRowCount,
      conflictingDuplicateRecordCount:
        diagnostic.resourceMapConflictBoundary
          .conflictingDuplicateRecordCount,
      duplicateStylesheetPrecedenceRowCount:
        diagnostic.resourceMapConflictBoundary
          .duplicateStylesheetPrecedenceRowCount,
      validationMutatedRecords:
        diagnostic.resourceMapConflictBoundary.validationMutatedRecords
    },
    {
      status: 'validated-private-resource-map-commit-record-conflicts',
      checkedScriptModuleRecordCount: 4,
      checkedDedupeKeyCount: 4,
      checkedStylesheetPrecedenceRecordCount: 1,
      checkedStylesheetPrecedenceKeyCount: 1,
      malformedModuleRowCount: 0,
      conflictingDuplicateRecordCount: 0,
      duplicateStylesheetPrecedenceRowCount: 0,
      validationMutatedRecords: false
    }
  );
  assert.equal(diagnostic.stylesheetResourceMapRecords.length, 1);
  assert.equal(diagnostic.preloadResourceMapRecords.length, 4);
  assert.equal(diagnostic.scriptResourceMapRecords.length, 2);
  assert.deepEqual(
    diagnostic.stylesheetLoadStateCommitOrder.rows.map((row) => ({
      resourceMapOrderIndex: row.resourceMapOrderIndex,
      resourceIndex: row.resourceIndex,
      resourceKey: row.resourceKey,
      resourceMapDedupeKey: row.resourceMapDedupeKey,
      precedenceKey: row.precedenceKey,
      fakeLoadingStateLabels: row.fakeLoadingStateLabels,
      fakeLoadingStateBitmasks: row.fakeLoadingStateBitmasks,
      beforeCommitLoadingStateLabel: row.beforeCommitLoadingStateLabel,
      beforeCommitLoadingStateBitmask:
        row.beforeCommitLoadingStateBitmask,
      afterCommitInsertionLoadingStateLabel:
        row.afterCommitInsertionLoadingStateLabel,
      afterCommitInsertionLoadingStateBitmask:
        row.afterCommitInsertionLoadingStateBitmask,
      afterLoadLoadingStateLabel: row.afterLoadLoadingStateLabel,
      afterLoadLoadingStateBitmask: row.afterLoadLoadingStateBitmask,
      afterErrorLoadingStateLabel: row.afterErrorLoadingStateLabel,
      afterErrorLoadingStateBitmask: row.afterErrorLoadingStateBitmask,
      preloadWouldBeTracked: row.preloadWouldBeTracked,
      preinitSeenBefore: row.preinitSeenBefore,
      commitOrderConsumesFakeLoadState:
        row.commitOrderConsumesFakeLoadState,
      deterministicLoadStateChangesRecorded:
        row.deterministicLoadStateChangesRecorded,
      publicStylesheetLoadStateDispatch:
        row.publicStylesheetLoadStateDispatch
    })),
    [
      {
        resourceMapOrderIndex: 1,
        resourceIndex: 0,
        resourceKey: 'style:style-main',
        resourceMapDedupeKey: 'hoistable-styles:style:style-main',
        precedenceKey: 'precedence-main',
        fakeLoadingStateLabels: [
          'not-loaded',
          'loaded',
          'errored',
          'inserted-not-settled',
          'inserted-loaded',
          'inserted-errored'
        ],
        fakeLoadingStateBitmasks: [0, 1, 2, 4, 5, 6],
        beforeCommitLoadingStateLabel: 'not-loaded',
        beforeCommitLoadingStateBitmask: 0,
        afterCommitInsertionLoadingStateLabel: 'inserted-not-settled',
        afterCommitInsertionLoadingStateBitmask: 4,
        afterLoadLoadingStateLabel: 'inserted-loaded',
        afterLoadLoadingStateBitmask: 5,
        afterErrorLoadingStateLabel: 'inserted-errored',
        afterErrorLoadingStateBitmask: 6,
        preloadWouldBeTracked: true,
        preinitSeenBefore: true,
        commitOrderConsumesFakeLoadState: true,
        deterministicLoadStateChangesRecorded: true,
        publicStylesheetLoadStateDispatch: false
      }
    ]
  );
  assert.deepEqual(
    {
      loadStateConsumed:
        diagnostic.stylesheetLoadStateCommitOrder.loadStateConsumed,
      resourceMapEntriesValidated:
        diagnostic.stylesheetLoadStateCommitOrder
          .resourceMapEntriesValidated,
      rowCount: diagnostic.stylesheetLoadStateCommitOrder.rowCount,
      staleResourceMapEntryCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .staleResourceMapEntryCount,
      commitTransitionCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionCount,
      commitTransitionResourceCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionResourceCount,
      commitTransitionExecutionRowCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionExecutionRowCount,
      loadingStateChangeRowCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .loadingStateChangeRowCount,
      commitTransitionRecorded:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionRecorded,
      fakeResourceCommitTransitionRecorded:
        diagnostic.stylesheetLoadStateCommitOrder
          .fakeResourceCommitTransitionRecorded,
      commitTransitionExecutionRecorded:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionExecutionRecorded,
      deterministicLoadStateChangesRecorded:
        diagnostic.stylesheetLoadStateCommitOrder
          .deterministicLoadStateChangesRecorded,
      publicStylesheetLoadStateDispatch:
        diagnostic.stylesheetLoadStateCommitOrder
          .publicStylesheetLoadStateDispatch
    },
    {
      loadStateConsumed: true,
      resourceMapEntriesValidated: true,
      rowCount: 1,
      staleResourceMapEntryCount: 0,
      commitTransitionCount: 1,
      commitTransitionResourceCount: 1,
      commitTransitionExecutionRowCount: 1,
      loadingStateChangeRowCount: 3,
      commitTransitionRecorded: true,
      fakeResourceCommitTransitionRecorded: true,
      commitTransitionExecutionRecorded: true,
      deterministicLoadStateChangesRecorded: true,
      publicStylesheetLoadStateDispatch: false
    }
  );
  assert.deepEqual(
    {
      transitionKind:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .transitionKind,
      transitionStatus:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .transitionStatus,
      sourceStylesheetLoadErrorStateId:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .sourceStylesheetLoadErrorStateId,
      sourceResourceMapCommitRowIds:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .sourceResourceMapCommitRowIds,
      sourceStylesheetLoadErrorStateRowIds:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .sourceStylesheetLoadErrorStateRowIds,
      fakeResourceKeys:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceKeys,
      fakeResourceMapDedupeKeys:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceMapDedupeKeys,
      fakeResourceRows:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceRows,
      transitionCount:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .transitionCount,
      fakeResourceCount:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceCount,
      fakeResourceCommitTransitionRecorded:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceCommitTransitionRecorded,
      preloadElementCreated:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .preloadElementCreated,
      preloadElementInserted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .preloadElementInserted,
      preloadFetchStarted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .preloadFetchStarted,
      stylesheetElementCreated:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .stylesheetElementCreated,
      stylesheetElementInserted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .stylesheetElementInserted,
      loadEventSubscribed:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .loadEventSubscribed,
      errorEventSubscribed:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .errorEventSubscribed,
      loadingStateMutated:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .loadingStateMutated,
      publicStylesheetLoadStateDispatch:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .publicStylesheetLoadStateDispatch
    },
    {
      transitionKind:
        'react-19.2.6-stylesheet-load-state-fake-resource-map-commit-transition',
      transitionStatus:
        resourceFormGate
          .privateResourceHintStylesheetLoadStateCommitTransitionStatus,
      sourceStylesheetLoadErrorStateId:
        'resource-map-commit-load-state:1',
      sourceResourceMapCommitRowIds: ['resource-map-commit-1'],
      sourceStylesheetLoadErrorStateRowIds: [
        'stylesheet-resource-state-0'
      ],
      fakeResourceKeys: ['style:style-main'],
      fakeResourceMapDedupeKeys: [
        'hoistable-styles:style:style-main'
      ],
      fakeResourceRows: [
        {
          sourceResourceMapCommitRowId: 'resource-map-commit-1',
          sourceStylesheetLoadErrorStateRowId:
            'stylesheet-resource-state-0',
          resourceKey: 'style:style-main',
          resourceMapDedupeKey: 'hoistable-styles:style:style-main',
          precedenceKey: 'precedence-main',
          fakeLoadingStateLabels: [
            'not-loaded',
            'loaded',
            'errored',
            'inserted-not-settled',
            'inserted-loaded',
            'inserted-errored'
          ],
          fakeLoadingStateBitmasks: [0, 1, 2, 4, 5, 6],
          preloadWouldBeTracked: true,
          commitOrderConsumesFakeLoadState: true
        }
      ],
      transitionCount: 1,
      fakeResourceCount: 1,
      fakeResourceCommitTransitionRecorded: true,
      preloadElementCreated: false,
      preloadElementInserted: false,
      preloadFetchStarted: false,
      stylesheetElementCreated: false,
      stylesheetElementInserted: false,
      loadEventSubscribed: false,
      errorEventSubscribed: false,
      loadingStateMutated: false,
      publicStylesheetLoadStateDispatch: false
    }
  );
  assert.deepEqual(
    {
      executionKind:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .executionKind,
      executionStatus:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .executionStatus,
      sourceTransitionId:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .sourceTransitionId,
      rowCount:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .rowCount,
      loadingStateChangeCount:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .loadingStateChangeCount,
      fakeResourceKeys:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .fakeResourceKeys,
      deterministicLoadStateChangesRecorded:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .deterministicLoadStateChangesRecorded,
      fakeResourceCommitTransitionExecuted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .fakeResourceCommitTransitionExecuted,
      stylesheetElementInserted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .stylesheetElementInserted,
      loadEventSubscribed:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .loadEventSubscribed,
      loadEventDispatched:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .loadEventDispatched,
      loadingStateMutated:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .loadingStateMutated,
      publicStylesheetLoadStateDispatch:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .publicStylesheetLoadStateDispatch
    },
    {
      executionKind:
        'react-19.2.6-stylesheet-load-state-fake-dom-commit-execution-diagnostic',
      executionStatus:
        resourceFormGate
          .privateResourceHintStylesheetLoadStateCommitExecutionStatus,
      sourceTransitionId:
        'resource-map-commit-load-state:1:resource-map-commit-transition',
      rowCount: 1,
      loadingStateChangeCount: 3,
      fakeResourceKeys: ['style:style-main'],
      deterministicLoadStateChangesRecorded: true,
      fakeResourceCommitTransitionExecuted: true,
      stylesheetElementInserted: false,
      loadEventSubscribed: false,
      loadEventDispatched: false,
      loadingStateMutated: false,
      publicStylesheetLoadStateDispatch: false
    }
  );
  assert.deepEqual(
    diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
      .rows.map((row) => ({
        sourceStylesheetLoadStateCommitOrderRowId:
          row.sourceStylesheetLoadStateCommitOrderRowId,
        sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
        resourceKey: row.resourceKey,
        beforeCommitLoadingState: row.beforeCommitLoadingState,
        afterCommitInsertionLoadingState:
          row.afterCommitInsertionLoadingState,
        afterLoadLoadingState: row.afterLoadLoadingState,
        afterErrorLoadingState: row.afterErrorLoadingState,
        loadingStateChangeCount: row.loadingStateChangeCount,
        deterministicLoadStateChangesRecorded:
          row.deterministicLoadStateChangesRecorded,
        loadingStateMutated: row.loadingStateMutated,
        publicStylesheetLoadStateDispatch:
          row.publicStylesheetLoadStateDispatch
      })),
    [
      {
        sourceStylesheetLoadStateCommitOrderRowId:
          'stylesheet-load-state-commit-order-0',
        sourceResourceMapCommitRowId: 'resource-map-commit-1',
        resourceKey: 'style:style-main',
        beforeCommitLoadingState: {
          label: 'not-loaded',
          bitmask: 0,
          notLoaded: true,
          loaded: false,
          errored: false,
          settled: false,
          inserted: false,
          loadListenerInstalled: false,
          errorListenerInstalled: false,
          promiseCreated: false,
          eventDispatched: false,
          compatibilityClaimed: false
        },
        afterCommitInsertionLoadingState: {
          label: 'inserted-not-settled',
          bitmask: 4,
          notLoaded: false,
          loaded: false,
          errored: false,
          settled: false,
          inserted: true,
          loadListenerInstalled: false,
          errorListenerInstalled: false,
          promiseCreated: false,
          eventDispatched: false,
          compatibilityClaimed: false
        },
        afterLoadLoadingState: {
          label: 'inserted-loaded',
          bitmask: 5,
          notLoaded: false,
          loaded: true,
          errored: false,
          settled: true,
          inserted: true,
          loadListenerInstalled: false,
          errorListenerInstalled: false,
          promiseCreated: false,
          eventDispatched: false,
          compatibilityClaimed: false
        },
        afterErrorLoadingState: {
          label: 'inserted-errored',
          bitmask: 6,
          notLoaded: false,
          loaded: false,
          errored: true,
          settled: true,
          inserted: true,
          loadListenerInstalled: false,
          errorListenerInstalled: false,
          promiseCreated: false,
          eventDispatched: false,
          compatibilityClaimed: false
        },
        loadingStateChangeCount: 3,
        deterministicLoadStateChangesRecorded: true,
        loadingStateMutated: false,
        publicStylesheetLoadStateDispatch: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
      .loadingStateChanges.map((row) => ({
        triggerKind: row.triggerKind,
        fromLoadingStateLabel: row.fromLoadingStateLabel,
        fromLoadingStateBitmask: row.fromLoadingStateBitmask,
        toLoadingStateLabel: row.toLoadingStateLabel,
        toLoadingStateBitmask: row.toLoadingStateBitmask,
        insertedBitSet: row.insertedBitSet,
        loadedBitSet: row.loadedBitSet,
        erroredBitSet: row.erroredBitSet,
        loadEventDispatched: row.loadEventDispatched,
        errorEventDispatched: row.errorEventDispatched,
        loadingStateMutated: row.loadingStateMutated
      })),
    [
      {
        triggerKind: 'commit-insertion',
        fromLoadingStateLabel: 'not-loaded',
        fromLoadingStateBitmask: 0,
        toLoadingStateLabel: 'inserted-not-settled',
        toLoadingStateBitmask: 4,
        insertedBitSet: true,
        loadedBitSet: false,
        erroredBitSet: false,
        loadEventDispatched: false,
        errorEventDispatched: false,
        loadingStateMutated: false
      },
      {
        triggerKind: 'load-event',
        fromLoadingStateLabel: 'inserted-not-settled',
        fromLoadingStateBitmask: 4,
        toLoadingStateLabel: 'inserted-loaded',
        toLoadingStateBitmask: 5,
        insertedBitSet: false,
        loadedBitSet: true,
        erroredBitSet: false,
        loadEventDispatched: false,
        errorEventDispatched: false,
        loadingStateMutated: false
      },
      {
        triggerKind: 'error-event',
        fromLoadingStateLabel: 'inserted-not-settled',
        fromLoadingStateBitmask: 4,
        toLoadingStateLabel: 'inserted-errored',
        toLoadingStateBitmask: 6,
        insertedBitSet: false,
        loadedBitSet: false,
        erroredBitSet: true,
        loadEventDispatched: false,
        errorEventDispatched: false,
        loadingStateMutated: false
      }
    ]
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.status,
    resourceFormGate.privateResourceHintHeadStylesheetPrecedenceBlockedStatus
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.precedenceInsertionApplied,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.singletonOwnershipClaimed,
    false
  );
  assert.equal(diagnostic.resourceLifecycleBoundary.modulePreloadRecordCount, 1);
  assert.equal(diagnostic.resourceLifecycleBoundary.moduleScriptRecordCount, 1);
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeDomCommitExecutionRowCount,
    4
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptResourceFakeDomCommitExecutionRowCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .modulePreloadFakeDomCommitExecutionRowCount,
    1
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderExecutionRowCount,
    4
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderDedupeStateCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderPreloadPropsRecordCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderHoistableScriptRecordCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderPreloadPropsAdoptionCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeDomCommitEvidenceRecorded,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.fakeDomCommitApplied,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderingExecuted,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderingApplied,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitOrderRowCount,
    1
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitTransitionCount,
    1
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitExecutionRowCount,
    1
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.stylesheetLoadStateChangeRowCount,
    3
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.stylesheetLoadStateRecordConsumed,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateResourceMapRowsValidated,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitTransitionRecorded,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitExecutionRecorded,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .deterministicStylesheetLoadStateChangesRecorded,
    true
  );
  assert.equal(diagnostic.resourceLifecycleBoundary.fetchStarted, false);
  assert.equal(diagnostic.resourceLifecycleBoundary.preloadStarted, false);
  assert.equal(diagnostic.resourceLifecycleBoundary.modulePreloadStarted, false);
  assert.equal(diagnostic.resourceLifecycleBoundary.scriptExecutionStarted, false);
  assert.equal(
    diagnostic.resourceLifecycleBoundary.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.loadEventSubscribed,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.loadStateMutated,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.preloadOrStyleDomWorkDispatched,
    false
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(diagnostic.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(
    diagnostic.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintResourceMapCommitBlockedCapabilities
  );
  assert.equal(fakeDom.head.childNodes.length, 4);
  assert.equal(JSON.stringify(diagnostic).includes('/style.css'), false);
  assert.equal(JSON.stringify(diagnostic).includes('/script.js'), false);
  assert.equal(JSON.stringify(diagnostic).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-style'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-script'), false);
  assert.equal(JSON.stringify(diagnostic).includes('nonce-module'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintResourceMapCommitGateId
  );
  assert.deepEqual(summary.acceptedRecordKinds, [
    'stylesheet',
    'preload',
    'script'
  ]);
  assert.equal(summary.mutatesRealResourceMaps, false);
  assert.equal(summary.mutatesFakeResourceMaps, false);
  assert.equal(summary.claimsSingletonOwnership, false);
  assert.equal(summary.startsFetchOrPreload, false);
  assert.equal(summary.startsScriptExecution, false);
  assert.equal(summary.mutatesLoadState, false);
  assert.equal(summary.recordsModulePreloadRows, true);
  assert.equal(summary.recordsModuleScriptRows, true);
  assert.equal(summary.recordsModuleResourceMapOrderRows, true);
  assert.equal(summary.recordsModuleResourceMapDedupeKeys, true);
  assert.equal(
    summary.recordsScriptModuleFakeDomCommitExecutionRows,
    true
  );
  assert.equal(summary.recordsScriptFakeDomCommitExecutionRows, true);
  assert.equal(
    summary.recordsModulePreloadFakeDomCommitExecutionRows,
    true
  );
  assert.equal(
    summary.recordsScriptModuleFakeResourceOrderExecutionRows,
    true
  );
  assert.equal(
    summary.recordsScriptModuleFakeResourceDedupeStateRows,
    true
  );
  assert.equal(
    summary.executesPrivateScriptModuleFakeResourceOrdering,
    true
  );
  assert.equal(summary.consumesStylesheetLoadErrorState, true);
  assert.equal(summary.recordsStylesheetLoadStateCommitOrderRows, true);
  assert.equal(
    summary.validatesStylesheetLoadStateResourceMapRows,
    true
  );
  assert.equal(summary.recordsStylesheetLoadStateCommitTransition, true);
  assert.equal(summary.recordsOneFakeResourceMapCommitTransition, true);
  assert.equal(
    summary.recordsStylesheetLoadStateCommitExecutionRows,
    true
  );
  assert.equal(summary.recordsStylesheetLoadStateChangeRows, true);
  assert.equal(
    summary.recordsDeterministicStylesheetLoadStateChanges,
    true
  );
  assert.equal(summary.rejectsMalformedModuleRows, true);
  assert.equal(summary.rejectsConflictingDuplicateRecords, true);
  assert.equal(summary.rejectsDuplicateStylesheetPrecedenceRows, true);
  assert.equal(summary.rejectsStaleStylesheetResourceMapEntries, true);
  assert.equal(summary.rejectsPublicResourceDispatchClaims, true);
  assert.equal(summary.publicScriptModuleResourceDispatch, false);
  assert.equal(summary.dispatchesPreloadOrStyleDomWork, false);
  assert.equal(summary.publicStylesheetLoadStateDispatch, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintResourceMapCommitBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintResourceMapCommitError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintResourceMapCommitGateErrorCode
  );
  assert.equal(error.exportName, 'resource-hint-resource-map-commit');
  assert.equal(error.resourceMapCommitId, 'resource-map-commit:1');
  assert.equal(
    error.sourceStylesheetLoadErrorStateId,
    'resource-map-commit-load-state:1'
  );
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintResourceMapCommitBlockedCapabilities
  );

  assert.throws(
    () =>
      commitGate.recordResourceMapCommitDiagnostic(order, stylesheet, {
        explicitResourceMapCommitDiagnostic: true
      }),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'resource-map commit gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintResourceMapCommitGate()
        .recordResourceMapCommitDiagnostic(order, stylesheet, {
          explicitResourceMapCommitDiagnostic: true,
          resourceMap: throwingProxy('real resource map')
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'resourceMap must not be passed to the resource-map commit gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintResourceMapCommitGate()
        .recordResourceMapCommitDiagnostic(order, stylesheet, {
          explicitResourceMapCommitDiagnostic: true,
          publicResourceHintDomInsertion: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'publicResourceHintDomInsertion must not claim public resource dispatch in the resource-map commit gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintResourceMapCommitGate()
        .recordResourceMapCommitDiagnostic({}, stylesheet, {
          explicitResourceMapCommitDiagnostic: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintResourceMapCommitError(
        {}
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource-map commit rejects duplicate stylesheet precedence rows', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-duplicate-stylesheet',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style-again',
            fetchPriority: 'high'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      }
    ]
  );

  assert.throws(
    () =>
      scenario.commitGate.recordResourceMapCommitDiagnostic(
        scenario.order,
        scenario.stylesheet,
        {
          explicitResourceMapCommitDiagnostic: true
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'duplicate stylesheet precedence rows for hoistable-styles:style:style-main'
    }
  );
  assert.equal(scenario.fakeDom.head.childNodes.length, 1);
});

test('private resource root-map storage preflight records canonical rows only', () => {
  const scenario = createRootMapStoragePreflightScenario(
    'root-map-storage-canonical'
  );
  const preflight = scenario.storageGate.recordRootMapStoragePreflight(
    scenario.commit,
    {
      explicitRootMapStoragePreflight: true,
      preflightId: 'canonical-root-map-storage',
      rootId: 'canonical-resource-root',
      expectedSourceResourceMapCommitRowIds: [
        'resource-map-commit-1',
        'resource-map-commit-3',
        'resource-map-commit-4'
      ]
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintRootMapStoragePreflightGate();

  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintRootMapStoragePreflightRecord(
      preflight
    ),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintRootMapStoragePreflightRecordPayload(
      preflight
    ),
    preflight
  );
  assert.equal(
    preflight.rootMapStoragePreflightId,
    'root-map-storage-canonical-storage:1'
  );
  assert.equal(
    preflight.rootMapStoragePreflightStatus,
    resourceFormGate.privateResourceHintRootMapStoragePreflightStatus
  );
  assert.equal(
    preflight.executionStatus,
    resourceFormGate
      .privateResourceHintRootMapStoragePreflightExecutionStatus
  );
  assert.equal(
    preflight.compatibilityStatus,
    resourceFormGate
      .privateResourceHintRootMapStoragePreflightCompatibilityBlockedStatus
  );
  assert.equal(
    preflight.sourceResourceMapCommitId,
    scenario.commit.resourceMapCommitId
  );
  assert.deepEqual(preflight.acceptedContractIds, [
    'preinit-style',
    'preinit-script',
    'preinit-module-script'
  ]);
  assert.deepEqual(preflight.rootMapStoragePlan, {
    storageKind:
      'react-19.2.6-resource-root-map-storage-preflight',
    targetKind: 'document-head',
    hostTag: 'head',
    rootId: 'canonical-resource-root',
    rootKind: 'document-or-shadow-root',
    ownerRootId: 'canonical-resource-root',
    rootMapStorageRowCount: 3,
    canonicalRootMapStorageRowCount: 3,
    hoistableStylesRootMapRowCount: 1,
    hoistableScriptsRootMapRowCount: 2,
    skippedPreloadPropsRowCount: 2,
    checkedRootMapDedupeKeyCount: 3,
    duplicateRootMapStorageRowCount: 0,
    staleRootMapStorageRowCount: 0,
    foreignRootMapStorageRowCount: 0,
    expectedSourceRowsValidated: true,
    rootOwnerValidated: true,
    rootResourceStorageShapeRecorded: true,
    rootResourceStorageCreated: false,
    rootResourceStorageMutated: false,
    hoistableStylesMapCreated: false,
    hoistableStylesMapMutated: false,
    hoistableScriptsMapCreated: false,
    hoistableScriptsMapMutated: false,
    preloadPropsMapCreated: false,
    preloadPropsMapMutated: false,
    realResourceMapsCreated: false,
    realResourceMapsMutated: false,
    fakeResourceMapsCreated: false,
    fakeResourceMapsMutated: false,
    publicResourceHintDomInsertion: false,
    publicResourceMapCommitBehavior: false,
    publicScriptModuleResourceDispatch: false,
    publicStylesheetLoadStateDispatch: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(
    preflight.rootMapStorageRows.map((row) => ({
      rowId: row.rowId,
      sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
      rootMapName: row.rootMapName,
      rootMapDedupeKey: row.rootMapDedupeKey,
      recordKind: row.recordKind,
      resourceShapeKind: row.resourceShapeKind,
      resourceKey: row.resourceKey,
      scriptKind: row.scriptKind,
      wouldStoreInRootMap: row.wouldStoreInRootMap,
      canonicalRootMapStorageRow: row.canonicalRootMapStorageRow,
      rootResourceStorageMutated: row.rootResourceStorageMutated,
      hoistableStylesMapMutated: row.hoistableStylesMapMutated,
      hoistableScriptsMapMutated: row.hoistableScriptsMapMutated,
      publicResourceHintDomInsertion: row.publicResourceHintDomInsertion,
      publicResourceMapCommitBehavior: row.publicResourceMapCommitBehavior,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch
    })),
    [
      {
        rowId: 'root-map-storage-preflight-0',
        sourceResourceMapCommitRowId: 'resource-map-commit-1',
        rootMapName: 'hoistableStyles',
        rootMapDedupeKey: 'hoistableStyles:style:style-main',
        recordKind: 'stylesheet',
        resourceShapeKind: 'stylesheet-resource',
        resourceKey: 'style:style-main',
        scriptKind: null,
        wouldStoreInRootMap: true,
        canonicalRootMapStorageRow: true,
        rootResourceStorageMutated: false,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        rowId: 'root-map-storage-preflight-1',
        sourceResourceMapCommitRowId: 'resource-map-commit-3',
        rootMapName: 'hoistableScripts',
        rootMapDedupeKey: 'hoistableScripts:script:script-main',
        recordKind: 'script',
        resourceShapeKind: 'script-resource',
        resourceKey: 'script:script-main',
        scriptKind: 'classic',
        wouldStoreInRootMap: true,
        canonicalRootMapStorageRow: true,
        rootResourceStorageMutated: false,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        rowId: 'root-map-storage-preflight-2',
        sourceResourceMapCommitRowId: 'resource-map-commit-4',
        rootMapName: 'hoistableScripts',
        rootMapDedupeKey: 'hoistableScripts:script:module-main',
        recordKind: 'script',
        resourceShapeKind: 'script-resource',
        resourceKey: 'script:module-main',
        scriptKind: 'module',
        wouldStoreInRootMap: true,
        canonicalRootMapStorageRow: true,
        rootResourceStorageMutated: false,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      }
    ]
  );
  assert.deepEqual(
    preflight.skippedPreloadPropsRows.map((row) => ({
      sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
      mapKind: row.mapKind,
      resourceKey: row.resourceKey,
      skippedReason: row.skippedReason,
      wouldStoreInRootMap: row.wouldStoreInRootMap,
      preloadPropsMapMutated: row.preloadPropsMapMutated
    })),
    [
      {
        sourceResourceMapCommitRowId: 'resource-map-commit-0',
        mapKind: 'preload-props',
        resourceKey: 'style:style-main',
        skippedReason: 'preload-props-map-is-not-root-owned-storage',
        wouldStoreInRootMap: false,
        preloadPropsMapMutated: false
      },
      {
        sourceResourceMapCommitRowId: 'resource-map-commit-2',
        mapKind: 'preload-props',
        resourceKey: 'script:script-main',
        skippedReason: 'preload-props-map-is-not-root-owned-storage',
        wouldStoreInRootMap: false,
        preloadPropsMapMutated: false
      }
    ]
  );
  assert.deepEqual(
    {
      hasHoistableStylesMap:
        preflight.rootResourceStorageShape.hasHoistableStylesMap,
      hasHoistableScriptsMap:
        preflight.rootResourceStorageShape.hasHoistableScriptsMap,
      privateInternalRootResourcesKeyWritten:
        preflight.rootResourceStorageShape
          .privateInternalRootResourcesKeyWritten,
      rootResourceStorageMutated:
        preflight.rootResourceStorageShape.rootResourceStorageMutated,
      hoistableStylesMapMutated:
        preflight.rootResourceStorageShape.hoistableStylesMapMutated,
      hoistableScriptsMapMutated:
        preflight.rootResourceStorageShape.hoistableScriptsMapMutated
    },
    {
      hasHoistableStylesMap: true,
      hasHoistableScriptsMap: true,
      privateInternalRootResourcesKeyWritten: false,
      rootResourceStorageMutated: false,
      hoistableStylesMapMutated: false,
      hoistableScriptsMapMutated: false
    }
  );
  assert.equal(
    preflight.rootMapStorageValidationBoundary.status,
    'validated-private-resource-root-map-storage-preflight'
  );
  assert.equal(
    preflight.rootMapStorageValidationBoundary.expectedSourceRowsValidated,
    true
  );
  assert.equal(
    preflight.rootMapPublicBoundary.publicResourceApisReachable,
    false
  );
  assert.equal(
    preflight.rootMapPublicBoundary.rootResourceStorageMutated,
    false
  );
  assert.equal(
    preflight.rootMapPublicBoundary.publicResourceMapCommitBehavior,
    false
  );
  assert.equal(
    preflight.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(preflight.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(preflight.publicHeadBoundary.publicSingletonBehavior, false);
  assert.equal(preflight.sideEffects.rootMapStoragePreflightRecorded, true);
  assert.equal(preflight.sideEffects.rootMapStorageRowsRecorded, true);
  assert.equal(
    preflight.sideEffects.canonicalRootMapStorageRowsRecorded,
    true
  );
  assert.equal(preflight.sideEffects.rootResourceStorageShapeRecorded, true);
  assert.equal(preflight.sideEffects.hoistableStylesRootMapRowsRecorded, true);
  assert.equal(preflight.sideEffects.hoistableScriptsRootMapRowsRecorded, true);
  assert.equal(preflight.sideEffects.preloadPropsRootMapRowsSkipped, true);
  assert.equal(preflight.sideEffects.rootMapStorageValidationRecorded, true);
  assert.equal(preflight.sideEffects.rootResourceStorageMutated, false);
  assert.equal(preflight.sideEffects.hoistableStylesMapMutated, false);
  assert.equal(preflight.sideEffects.hoistableScriptsMapMutated, false);
  assert.equal(preflight.sideEffects.preloadPropsMapMutated, false);
  assert.equal(preflight.sideEffects.realResourceMapsMutated, false);
  assert.equal(preflight.sideEffects.fakeResourceMapsMutated, false);
  assert.equal(preflight.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(preflight.sideEffects.publicResourceMapCommitBehavior, false);
  assert.equal(
    preflight.sideEffects.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(preflight.sideEffects.compatibilityClaimed, false);
  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintRootMapStoragePreflightGateId
  );
  assert.deepEqual(summary.acceptedRootMapNames, [
    'hoistableStyles',
    'hoistableScripts'
  ]);
  assert.equal(summary.recordsCanonicalRootMapStorageRows, true);
  assert.equal(summary.skipsPreloadPropsRootStorage, true);
  assert.equal(summary.mutatesRootResourceStorage, false);
  assert.equal(summary.publicResourceMapCommitBehavior, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintRootMapStoragePreflightBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintRootMapStoragePreflightError(
      preflight
    );
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintRootMapStoragePreflightGateErrorCode
  );
  assert.equal(
    error.rootMapStoragePreflightId,
    preflight.rootMapStoragePreflightId
  );
  assert.equal(
    error.sourceResourceMapCommitId,
    scenario.commit.resourceMapCommitId
  );
  assert.equal(error.rootMapStoragePlan.rootMapStorageRowCount, 3);
  assert.equal(JSON.stringify(preflight).includes('/style.css'), false);
  assert.equal(JSON.stringify(preflight).includes('/script.js'), false);
  assert.equal(JSON.stringify(preflight).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(preflight).includes('sha256-style'), false);
  assert.equal(JSON.stringify(preflight).includes('nonce-module'), false);
});

test('private resource root-map fake metadata negative matrix stays fail-closed after accepted preflight', () => {
  const scenario = createRootMapStoragePreflightScenario(
    'root-map-storage-fake-metadata-negative'
  );
  const headChildCount = scenario.fakeDom.head.childNodes.length;
  const preflight = scenario.storageGate.recordRootMapStoragePreflight(
    scenario.commit,
    {
      explicitRootMapStoragePreflight: true,
      preflightId: 'fake-metadata-negative-root-map',
      rootId: 'fake-metadata-resource-root',
      expectedSourceResourceMapCommitRowIds: [
        'resource-map-commit-1',
        'resource-map-commit-3',
        'resource-map-commit-4'
      ]
    }
  );

  assert.equal(scenario.fakeDom.head.childNodes.length, headChildCount);
  assert.equal(preflight.rootMapStorageRows.length, 3);
  assert.equal(preflight.skippedPreloadPropsRows.length, 2);

  for (const row of preflight.rootMapStorageRows) {
    assert.equal(Object.isFrozen(row), true, row.rowId);
    assert.equal(row.wouldStoreInRootMap, true, row.rowId);
    assert.equal(row.canonicalRootMapStorageRow, true, row.rowId);
    assert.equal(row.rootResourceStorageMutated, false, row.rowId);
    assert.equal(row.hoistableStylesMapMutated, false, row.rowId);
    assert.equal(row.hoistableScriptsMapMutated, false, row.rowId);
    assert.equal(row.preloadPropsMapMutated, false, row.rowId);
    assert.equal(row.fetchStarted, false, row.rowId);
    assert.equal(row.loadEventSubscribed, false, row.rowId);
    assert.equal(row.loadingStateMutated, false, row.rowId);
    assert.equal(row.scriptExecutionStarted, false, row.rowId);
    assert.equal(row.publicResourceHintDomInsertion, false, row.rowId);
    assert.equal(row.publicResourceMapCommitBehavior, false, row.rowId);
    assert.equal(row.publicScriptModuleResourceDispatch, false, row.rowId);
    assert.equal(row.compatibilityClaimed, false, row.rowId);
  }

  for (const row of preflight.skippedPreloadPropsRows) {
    assert.equal(Object.isFrozen(row), true, row.rowId);
    assert.equal(row.mapKind, 'preload-props', row.rowId);
    assert.equal(row.wouldStoreInRootMap, false, row.rowId);
    assert.equal(row.preloadPropsMapMutated, false, row.rowId);
    assert.equal(row.publicResourceDispatchBlocked, true, row.rowId);
    assert.equal(row.publicResourceHintDomInsertion, false, row.rowId);
    assert.equal(row.publicResourceMapCommitBehavior, false, row.rowId);
    assert.equal(row.compatibilityClaimed, false, row.rowId);
  }

  for (const mutate of [
    () => {
      preflight.rootMapStorageRows[0].rootResourceStorageMutated = true;
    },
    () => {
      preflight.rootMapStorageRows[1].loadingStateMutated = true;
    },
    () => {
      preflight.rootMapStorageRows[2].scriptExecutionStarted = true;
    },
    () => {
      preflight.skippedPreloadPropsRows[0].wouldStoreInRootMap = true;
    },
    () => {
      scenario.commit.privateResourceMapRecords[1].fetchStarted = true;
    },
    () => {
      scenario.commit.privateResourceMapRecords[3].scriptExecutionStarted =
        true;
    }
  ]) {
    assert.throws(mutate, TypeError);
  }

  const tamperedLifecycleCommit = {
    ...scenario.commit,
    privateResourceMapRecords:
      scenario.commit.privateResourceMapRecords.map((row, index) =>
        index === 3
          ? {
              ...row,
              scriptExecutionStarted: true
            }
          : row
      )
  };
  assert.equal(
    resourceFormGate.isPrivateResourceHintResourceMapCommitRecord(
      tamperedLifecycleCommit
    ),
    false
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight(tamperedLifecycleCommit, {
          explicitRootMapStoragePreflight: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidRecordCode,
      compatibilityTarget
    }
  );

  const negativeAdmissions = [
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: [
          'resource-map-commit-1',
          'resource-map-commit-3',
          'resource-map-commit-0'
        ]
      },
      reason:
        'stale root-map storage rows: expected source row ids must match canonical storage rows'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        preloadPropsMapMutated: true
      },
      reason:
        'preloadPropsMapMutated must not claim root resource-map storage or preload-props mutation in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        scriptExecutionStarted: true
      },
      reason:
        'scriptExecutionStarted must not claim stylesheet or script lifecycle execution in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        publicHeadMutation: true
      },
      reason:
        'publicHeadMutation must not claim public head or DOM mutation in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        packageExportCompatibilityClaimed: true
      },
      reason:
        'packageExportCompatibilityClaimed must not claim package/export compatibility in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        publicResourceHintDomInsertion: true
      },
      reason:
        'publicResourceHintDomInsertion must not claim public resource dispatch in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        rootResources: throwingProxy('fake root resources')
      },
      reason:
        'rootResources must not be passed to the root-map storage preflight gate'
    }
  ];

  for (const {admission, reason} of negativeAdmissions) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      admission,
      reason
    );
  }

  assert.equal(JSON.stringify(preflight).includes('/style.css'), false);
  assert.equal(JSON.stringify(preflight).includes('/script.js'), false);
  assert.equal(JSON.stringify(preflight).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(preflight).includes('sha256-style'), false);
  assert.equal(JSON.stringify(preflight).includes('nonce-module'), false);
});

test('private resource root-map storage execution mutates deterministic fake maps only', () => {
  const rootContext = createPrivateRootBridgeAdmission();
  const rootLifecycleBinding = {
    rootBridgeAdmission: rootContext.admission,
    rootLifecycleRequestBoundary: rootContext.lifecycleBoundary
  };
  const scenario = createRootMapStoragePreflightScenario(
    'root-map-storage-private-execution'
  );
  const preflight = scenario.storageGate.recordRootMapStoragePreflight(
    scenario.commit,
    {
      explicitRootMapStoragePreflight: true,
      preflightId: 'private-execution-root-map-preflight',
      rootId: rootContext.admission.rootId,
      expectedSourceResourceMapCommitRowIds: [
        'resource-map-commit-1',
        'resource-map-commit-3',
        'resource-map-commit-4'
      ]
    }
  );
  const storageGate = resourceFormGate.createResourceHintRootMapStorageGate({
    requestIdPrefix: 'root-map-storage-private-execution-run'
  });
  const execution = storageGate.recordRootMapStorageExecution(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      executionId: 'private-execution-root-map-storage',
      rootId: rootContext.admission.rootId,
      expectedRootMapStorageRowIds: [
        'root-map-storage-preflight-0',
        'root-map-storage-preflight-1',
        'root-map-storage-preflight-2'
      ]
    },
    rootLifecycleBinding
  );
  const rootIdentityPayload =
    resourceFormGate.getPrivateResourceHintRootMapStorageRootIdentityPayload(
      execution
    );
  const summary =
    resourceFormGate.describePrivateResourceHintRootMapStorageGate();

  assert.equal(
    resourceFormGate.isPrivateResourceHintRootMapStorageRecord(execution),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintRootMapStorageRecordPayload(
      execution
    ),
    execution
  );
  assert.notEqual(rootIdentityPayload, null);
  assert.equal(rootIdentityPayload.rootBridgeAdmission, rootContext.admission);
  assert.equal(
    rootIdentityPayload.rootLifecycleRequestBoundary,
    rootContext.lifecycleBoundary
  );
  assert.equal(
    rootIdentityPayload.rootExecutionBoundary,
    execution.rootExecutionBoundary
  );
  assert.equal(rootIdentityPayload.container, rootContext.container);
  assert.equal(
    execution.rootExecutionBoundary.rootId,
    rootContext.admission.rootId
  );
  assert.equal(
    execution.rootExecutionBoundary.sourceRootBridgeAdmissionId,
    rootContext.admission.requestId
  );
  assert.equal(
    execution.rootExecutionBoundary.sourceRootLifecycleBoundaryId,
    rootContext.lifecycleBoundary.boundaryId
  );
  assert.equal(
    execution.rootExecutionBoundary.rootContainerInfo,
    rootIdentityPayload.containerInfo
  );
  assert.equal(
    execution.rootMapStorageStatus,
    resourceFormGate.privateResourceHintRootMapStorageStatus
  );
  assert.equal(
    execution.executionStatus,
    resourceFormGate.privateResourceHintRootMapStorageExecutionStatus
  );
  assert.equal(
    execution.compatibilityStatus,
    resourceFormGate
      .privateResourceHintRootMapStorageCompatibilityBlockedStatus
  );
  assert.equal(
    execution.sourceRootMapStoragePreflightId,
    preflight.rootMapStoragePreflightId
  );
  assert.equal(preflight.rootMapStoragePlan.rootResourceStorageMutated, false);
  assert.equal(preflight.rootMapStoragePlan.fakeResourceMapsMutated, false);
  assert.equal(preflight.sideEffects.rootResourceStorageMutated, false);
  assert.equal(execution.rootMapStorageExecutionRows.length, 3);
  assert.deepEqual(
    execution.rootMapStorageExecutionRows.map((row) => ({
      sourceRootMapStorageRowId: row.sourceRootMapStorageRowId,
      sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
      rootMapName: row.rootMapName,
      rootMapDedupeKey: row.rootMapDedupeKey,
      storedInRootMap: row.storedInRootMap,
      rootResourceStorageMutated: row.rootResourceStorageMutated,
      hoistableStylesMapMutated: row.hoistableStylesMapMutated,
      hoistableScriptsMapMutated: row.hoistableScriptsMapMutated,
      preloadPropsMapMutated: row.preloadPropsMapMutated,
      publicResourceMapCommitBehavior: row.publicResourceMapCommitBehavior,
      compatibilityClaimed: row.compatibilityClaimed
    })),
    [
      {
        sourceRootMapStorageRowId: 'root-map-storage-preflight-0',
        sourceResourceMapCommitRowId: 'resource-map-commit-1',
        rootMapName: 'hoistableStyles',
        rootMapDedupeKey: 'hoistableStyles:style:style-main',
        storedInRootMap: true,
        rootResourceStorageMutated: true,
        hoistableStylesMapMutated: true,
        hoistableScriptsMapMutated: false,
        preloadPropsMapMutated: false,
        publicResourceMapCommitBehavior: false,
        compatibilityClaimed: false
      },
      {
        sourceRootMapStorageRowId: 'root-map-storage-preflight-1',
        sourceResourceMapCommitRowId: 'resource-map-commit-3',
        rootMapName: 'hoistableScripts',
        rootMapDedupeKey: 'hoistableScripts:script:script-main',
        storedInRootMap: true,
        rootResourceStorageMutated: true,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: true,
        preloadPropsMapMutated: false,
        publicResourceMapCommitBehavior: false,
        compatibilityClaimed: false
      },
      {
        sourceRootMapStorageRowId: 'root-map-storage-preflight-2',
        sourceResourceMapCommitRowId: 'resource-map-commit-4',
        rootMapName: 'hoistableScripts',
        rootMapDedupeKey: 'hoistableScripts:script:module-main',
        storedInRootMap: true,
        rootResourceStorageMutated: true,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: true,
        preloadPropsMapMutated: false,
        publicResourceMapCommitBehavior: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.deepEqual(execution.rootMapStorageSnapshot.hoistableStylesMapKeys, [
    'hoistableStyles:style:style-main'
  ]);
  assert.deepEqual(execution.rootMapStorageSnapshot.hoistableScriptsMapKeys, [
    'hoistableScripts:script:script-main',
    'hoistableScripts:script:module-main'
  ]);
  assert.equal(
    execution.rootMapStorageExecutionPlan.rootResourceStorageMutated,
    true
  );
  assert.equal(
    execution.rootMapStorageExecutionPlan.fakeResourceMapsMutated,
    true
  );
  assert.equal(
    execution.rootMapStorageExecutionPlan.realResourceMapsMutated,
    false
  );
  assert.equal(
    execution.rootMapStorageExecutionPlan.preloadPropsMapMutated,
    false
  );
  assert.equal(
    execution.rootMapStorageExecutionPlan.publicResourceMapCommitBehavior,
    false
  );
  assert.equal(execution.sideEffects.rootMapStorageExecutionRecorded, true);
  assert.equal(
    execution.sideEffects.deterministicFakeRootMapStorageExecuted,
    true
  );
  assert.equal(execution.sideEffects.fakeResourceMapsMutated, true);
  assert.equal(execution.sideEffects.realResourceMapsMutated, false);
  assert.equal(execution.sideEffects.preloadPropsMapMutated, false);
  assert.equal(execution.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(execution.sideEffects.publicResourceMapCommitBehavior, false);
  assert.equal(execution.sideEffects.publicScriptModuleResourceDispatch, false);
  assert.equal(execution.sideEffects.publicStylesheetLoadStateDispatch, false);
  assert.equal(execution.sideEffects.scriptExecutionStarted, false);
  assert.equal(execution.sideEffects.resourceLoadStateMutated, false);
  assert.equal(execution.sideEffects.packageExportsMutated, false);
  assert.equal(execution.sideEffects.compatibilityClaimed, false);
  assert.equal(summary.gateId, resourceFormGate.privateResourceHintRootMapStorageGateId);
  assert.equal(summary.mutatesFakeRootResourceStorage, true);
  assert.equal(summary.acceptsSourceOwnedRootLifecycleBinding, true);
  assert.equal(
    summary.acceptedRootMapStorageRootLifecycleBoundaryRecordType,
    resourceFormGate
      .privateResourceHintRootMapStorageRootLifecycleBoundaryRecordType
  );
  assert.equal(
    summary.acceptedRootMapStorageRootLifecycleBoundaryStatus,
    resourceFormGate
      .privateResourceHintRootMapStorageRootLifecycleBoundaryStatus
  );
  assert.equal(summary.mutatesRealRootResourceStorage, false);
  assert.equal(summary.mutatesPreloadPropsMap, false);
  assert.equal(summary.publicResourceMapCommitBehavior, false);
  assert.deepEqual(
    summary.blockedCapabilities,
    resourceFormGate.resourceHintRootMapStorageBlockedCapabilities
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintRootMapStorageError(
      execution
    );
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintRootMapStorageGateErrorCode
  );
  assert.equal(
    error.rootMapStorageExecutionId,
    execution.rootMapStorageExecutionId
  );
  assert.equal(JSON.stringify(execution).includes('/style.css'), false);
  assert.equal(JSON.stringify(execution).includes('/script.js'), false);
  assert.equal(JSON.stringify(execution).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(execution).includes('sha256-style'), false);
  assert.equal(JSON.stringify(execution).includes('nonce-module'), false);

  assert.throws(
    () =>
      storageGate.recordRootMapStorageExecution(preflight, {
        explicitRootMapStorageExecution: true
      }),
    {
      code:
        resourceFormGate.privateResourceHintRootMapStorageInvalidAdmissionCode,
      compatibilityTarget
    }
  );

  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      executionId: 'private-execution-root-map-storage-missing-lifecycle',
      rootId: rootContext.admission.rootId,
      expectedRootMapStorageRowIds: [
        'root-map-storage-preflight-0',
        'root-map-storage-preflight-1',
        'root-map-storage-preflight-2'
      ]
    },
    undefined,
    'root lifecycle binding for resource root-map storage is required'
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      sourceRootMapStoragePreflightId: 'stale-root-map-preflight'
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      rootId: 'foreign-resource-root'
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      expectedRootMapStorageRowIds: [
        'root-map-storage-preflight-0',
        'stale-root-map-storage-preflight-row',
        'root-map-storage-preflight-2'
      ]
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      fakeRootResources: throwingProxy('fake root resources')
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      publicResourceHintDomInsertion: true
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      packageExportCompatibilityClaimed: true
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      scriptExecutionStarted: true
    }
  );
  const unmountRoot = createPrivateRootBridgeAdmission();
  const unmount = unmountRoot.bridge.unmountContainer(
    unmountRoot.create.handle
  );
  const unmountAdmission = unmountRoot.bridge.admitRequest(unmount);
  const unmountLifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(unmountAdmission);
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      rootId: rootContext.admission.rootId
    },
    {
      rootBridgeAdmission: unmountAdmission,
      rootLifecycleRequestBoundary: unmountLifecycleBoundary
    },
    'root lifecycle binding for resource root-map storage must come from a render operation'
  );
  for (const field of [
    'publicResourceRootMapStorageCompatibilityClaimed',
    'publicResourceMapCommitCompatibilityClaimed',
    'publicResourceDispatchCompatibilityClaimed',
    'publicPackageCompatibilityClaimed',
    'publicPackageExportsCompatibilityClaimed'
  ]) {
    assertRootMapStorageExecutionAdmissionRejects(
      preflight,
      {
        explicitRootMapStorageExecution: true,
        [field]: true
      }
    );
  }
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStorageGate()
        .recordRootMapStorageExecution({...preflight}, {
          explicitRootMapStorageExecution: true
        }),
    {
      code: resourceFormGate.privateResourceHintRootMapStorageInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintRootMapStorageError(
        {...execution}
      ),
    {
      code: resourceFormGate.privateResourceHintRootMapStorageInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource root-map storage preflight rejects stale duplicate and foreign rows', () => {
  const staleScenario = createRootMapStoragePreflightScenario(
    'root-map-storage-stale'
  );
  assert.throws(
    () =>
      staleScenario.storageGate.recordRootMapStoragePreflight(
        staleScenario.commit,
        {
          explicitRootMapStoragePreflight: true,
          rootId: 'stale-resource-root',
          expectedSourceResourceMapCommitRowIds: [
            'resource-map-commit-1',
            'resource-map-commit-3',
            'stale-resource-map-commit-row'
          ]
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stale root-map storage rows: expected source row ids must match canonical storage rows'
    }
  );

  const foreignScenario = createRootMapStoragePreflightScenario(
    'root-map-storage-foreign'
  );
  assert.throws(
    () =>
      foreignScenario.storageGate.recordRootMapStoragePreflight(
        foreignScenario.commit,
        {
          explicitRootMapStoragePreflight: true,
          rootId: 'canonical-resource-root',
          ownerRootId: 'foreign-resource-root'
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'foreign root-map storage owner must match rootId'
    }
  );

  const duplicateScenario = createDuplicateRootMapStoragePreflightScenario();
  assert.throws(
    () =>
      duplicateScenario.storageGate.recordRootMapStoragePreflight(
        duplicateScenario.commit,
        {
          explicitRootMapStoragePreflight: true,
          rootId: 'duplicate-resource-root'
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'duplicate root-map storage row for hoistableScripts:script:script-main'
    }
  );

  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight(staleScenario.commit, {
          explicitRootMapStoragePreflight: true,
          sourceResourceMapCommitId: 'foreign-resource-map-commit:1'
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stale root-map storage preflight source must reference the resource-map commit record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight(staleScenario.commit, {
          explicitRootMapStoragePreflight: true,
          rootResources: throwingProxy('root resources')
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'rootResources must not be passed to the root-map storage preflight gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight({}, {
          explicitRootMapStoragePreflight: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintRootMapStoragePreflightError(
        {}
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidRecordCode,
      compatibilityTarget
    }
  );

  const tamperedMixedKindCommit = {
    ...staleScenario.commit,
    privateResourceMapRecords:
      staleScenario.commit.privateResourceMapRecords.map((row, index) =>
        index === 1
          ? {
              ...row,
              recordKind: 'script',
              mapKind: 'hoistable-styles',
              resourceKind: 'script',
              contractId: 'preinit-script',
              scriptKind: 'classic'
            }
          : row
      )
  };
  assert.equal(
    resourceFormGate.isPrivateResourceHintResourceMapCommitRecord(
      tamperedMixedKindCommit
    ),
    false
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight(tamperedMixedKindCommit, {
          explicitRootMapStoragePreflight: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () => {
      staleScenario.commit.privateResourceMapRecords[1].mapKind =
        'hoistable-scripts';
    },
    TypeError
  );
});

test('private resource root-map storage preflight rejects public claims raw targets and malformed admissions', () => {
  const scenario = createRootMapStoragePreflightScenario(
    'root-map-storage-public-claims'
  );
  const headChildCount = scenario.fakeDom.head.childNodes.length;
  const expectedReactDomPackageExportKeys = [
    '.',
    './client',
    './server',
    './server.browser',
    './server.bun',
    './server.edge',
    './server.node',
    './static',
    './static.browser',
    './static.edge',
    './static.node',
    './profiling',
    './test-utils',
    './package.json'
  ];
  const publicClaimFields = [
    'publicResourceHintDomInsertion',
    'publicResourceMapCommitBehavior',
    'publicStylesheetResourceBehavior',
    'publicStylesheetLoadStateDispatch',
    'publicStylesheetPrecedenceBehavior',
    'publicScriptModuleResourceDispatch',
    'publicResourceApisReachable',
    'compatibilityClaimed'
  ];
  const rootStorageClaimFields = [
    'rootResourceStorageMutated',
    'hoistableStylesMapMutated',
    'hoistableScriptsMapMutated',
    'preloadPropsMapMutated',
    'realResourceMapsMutated',
    'fakeResourceMapsMutated'
  ];
  const headMutationClaimFields = [
    'publicHeadSingletonBehavior',
    'publicSingletonBehavior',
    'singletonResolutionReachable',
    'headChildrenCleared',
    'realDocumentMutated',
    'realHeadMutated',
    'fakeHeadMutated'
  ];
  const lifecycleClaimFields = [
    'resourceFetchStarted',
    'preloadStarted',
    'modulePreloadStarted',
    'scriptPreinitStarted',
    'moduleScriptPreinitStarted',
    'scriptExecutionStarted',
    'resourceLoadStateMutated',
    'stylesheetLoadStateMutated',
    'preloadOrStyleDomWorkDispatched',
    'loadEventSubscribed',
    'errorEventSubscribed'
  ];
  const packageClaimFields = [
    'packageCompatibilityClaimed',
    'packageExportCompatibilityClaimed',
    'packageExportsMutated',
    'packageJsonExportsMutated',
    'rootManifestsOrLockfilesMutated',
    'resourceFormGatesExported',
    'exportsPrivateResourceHintRootMapStoragePreflight'
  ];
  const blockedTargetFields = [
    'root',
    'document',
    'fakeDocument',
    'head',
    'fakeHead',
    'resourceRoot',
    'rootResources',
    'resourceMap',
    'realResourceMap',
    'fakeResourceMap',
    'hoistableStyles',
    'hoistableScripts',
    'stylesheetMap',
    'scriptMap',
    'preloadMap',
    'preloadPropsMap',
    'instance',
    'node',
    'element'
  ];
  const malformedAdmissionCases = [
    [
      null,
      'root-map storage preflight admission metadata must be an object'
    ],
    [
      {},
      'explicitRootMapStoragePreflight must be true'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        preflightKind: 'public-root-map-storage'
      },
      'preflightKind must be deterministic-private-root-map-storage-preflight'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        targetKind: 'document-body'
      },
      'targetKind must be document-head'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        hostTag: 'body'
      },
      'hostTag must be head'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        rootKind: 'live-document'
      },
      'rootKind must be document-or-shadow-root'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: 'resource-map-commit-1'
      },
      'expectedSourceResourceMapCommitRowIds must be an array when provided'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: [
          'resource-map-commit-1',
          ''
        ]
      },
      'expectedSourceResourceMapCommitRowIds must contain non-empty strings'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: [
          'resource-map-commit-1',
          1
        ]
      },
      'expectedSourceResourceMapCommitRowIds must contain non-empty strings'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: [
          'resource-map-commit-1',
          'resource-map-commit-1'
        ]
      },
      'duplicate expected root-map storage source row resource-map-commit-1'
    ]
  ];

  for (const field of publicClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim public resource dispatch in ` +
        'the root-map storage preflight gate'
    );
  }

  for (const field of rootStorageClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim root resource-map storage or ` +
        'preload-props mutation in the root-map storage preflight gate'
    );
  }

  for (const field of headMutationClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim public head or DOM mutation in ` +
        'the root-map storage preflight gate'
    );
  }

  for (const field of lifecycleClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim stylesheet or script lifecycle ` +
        'execution in the root-map storage preflight gate'
    );
  }

  for (const field of packageClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim package/export compatibility in ` +
        'the root-map storage preflight gate'
    );
  }

  for (const field of blockedTargetFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: throwingProxy(`root-map ${field}`)
      },
      `${field} must not be passed to the root-map storage preflight gate`
    );
  }

  for (const [admission, reason] of malformedAdmissionCases) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      admission,
      reason
    );
  }

  const summary =
    resourceFormGate.describePrivateResourceHintRootMapStoragePreflightGate();
  const packageJson = require(path.join(packageRoot, 'package.json'));
  assert.equal(scenario.fakeDom.head.childNodes.length, headChildCount);
  assert.equal(summary.publicResourceHintDomInsertion, false);
  assert.equal(summary.publicResourceMapCommitBehavior, false);
  assert.equal(summary.publicScriptModuleResourceDispatch, false);
  assert.equal(summary.publicStylesheetLoadStateDispatch, false);
  assert.equal(summary.rejectsMixedRootMapRowKinds, true);
  assert.equal(summary.rejectsPreloadPropsRootStorageClaims, true);
  assert.equal(summary.rejectsPublicHeadMutationClaims, true);
  assert.equal(summary.rejectsStylesheetScriptLifecycleClaims, true);
  assert.equal(summary.rejectsPackageCompatibilityClaims, true);
  assert.equal(summary.sideEffects.rootResourceStorageMutated, false);
  assert.equal(summary.sideEffects.realResourceMapsMutated, false);
  assert.equal(summary.sideEffects.fakeResourceMapsMutated, false);
  assert.equal(summary.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(summary.sideEffects.publicResourceMapCommitBehavior, false);
  assert.equal(summary.sideEffects.compatibilityClaimed, false);
  assert.deepEqual(
    Object.keys(packageJson.exports),
    expectedReactDomPackageExportKeys
  );
});

test('private resource-map commit executes deduped preload/preinit/script fake-head order', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-fake-head-load-order',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'L',
        [
          '/script.js',
          'script',
          {
            crossOrigin: undefined,
            integrity: 'sha256-script-preload',
            nonce: undefined,
            type: undefined,
            fetchPriority: undefined,
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'X',
        [
          '/script.js',
          {
            crossOrigin: undefined,
            integrity: 'sha256-script',
            fetchPriority: 'high',
            nonce: 'nonce-script'
          }
        ]
      ],
      [
        'm',
        [
          '/module.mjs',
          {
            as: undefined,
            crossOrigin: '',
            integrity: 'sha256-module-preload'
          }
        ]
      ],
      [
        'M',
        [
          '/module.mjs',
          {
            crossOrigin: '',
            integrity: 'sha256-module',
            nonce: 'nonce-module'
          }
        ]
      ],
      [
        'L',
        [
          '/font.woff2',
          'font',
          {
            crossOrigin: '',
            integrity: undefined,
            nonce: undefined,
            type: 'font/woff2',
            fetchPriority: undefined,
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'script-main'
      },
      {
        sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'script-main'
      },
      {
        sourceAdapterAdmissionId: admissions[4].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'module-main'
      },
      {
        sourceAdapterAdmissionId: admissions[5].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'module-main'
      },
      {
        sourceAdapterAdmissionId: admissions[6].adapterAdmissionId,
        resourceKind: 'font',
        resourceKey: 'font-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'existing-style',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      },
      {
        tagName: 'meta',
        attributes: {
          name: 'description'
        }
      }
    ]
  );
  const diagnostic = scenario.commitGate.recordResourceMapCommitDiagnostic(
    scenario.order,
    scenario.stylesheet,
    {
      explicitResourceMapCommitDiagnostic: true,
      fakeHeadExecution: {
        explicitFakeHeadExecution: true,
        executionId: 'dedupe-load-order-fake-head',
        fakeDocument: scenario.fakeDom.document,
        fakeHead: scenario.fakeDom.head
      }
    }
  );

  assert.equal(
    diagnostic.preloadPreinitFakeHeadExecution.executionStatus,
    resourceFormGate.privateResourceHintPreloadPreinitFakeHeadExecutionStatus
  );
  assert.equal(diagnostic.commitAdmission.fakeHeadExecutionAllowed, true);
  assert.equal(
    diagnostic.commitAdmission.fakeHeadExecution.rawHeadCaptured,
    false
  );
  assert.deepEqual(
    {
      rowCount: diagnostic.preloadPreinitFakeHeadExecution.rowCount,
      insertedElementCount:
        diagnostic.preloadPreinitFakeHeadExecution.insertedElementCount,
      preloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.preloadRowCount,
      preinitRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.preinitRowCount,
      stylesheetPreloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .stylesheetPreloadRowCount,
      stylesheetPreinitRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .stylesheetPreinitRowCount,
      classicScriptPreloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .classicScriptPreloadRowCount,
      classicScriptPreinitRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .classicScriptPreinitRowCount,
      modulePreloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.modulePreloadRowCount,
      moduleScriptPreinitRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .moduleScriptPreinitRowCount,
      otherPreloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.otherPreloadRowCount,
      skippedDedupedRecordCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .skippedDedupedRecordCount,
      beforeRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.fakeHeadBeforeOrder
          .rowCount,
      afterRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.fakeHeadAfterOrder
          .rowCount
    },
    {
      rowCount: 7,
      insertedElementCount: 7,
      preloadRowCount: 4,
      preinitRowCount: 3,
      stylesheetPreloadRowCount: 1,
      stylesheetPreinitRowCount: 1,
      classicScriptPreloadRowCount: 1,
      classicScriptPreinitRowCount: 1,
      modulePreloadRowCount: 1,
      moduleScriptPreinitRowCount: 1,
      otherPreloadRowCount: 1,
      skippedDedupedRecordCount: 0,
      beforeRowCount: 2,
      afterRowCount: 9
    }
  );
  assert.deepEqual(
    diagnostic.preloadPreinitFakeHeadExecution.rows.map((row) => ({
      contractId: row.contractId,
      recordKind: row.recordKind,
      resourceKind: row.resourceKind,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      elementTag: row.elementTag,
      relationshipApplied: row.relationshipApplied,
      fakeDomCommitOperation: row.fakeDomCommitOperation,
      insertionMethod: row.insertionMethod,
      fakeDomCommitApplied: row.fakeDomCommitApplied,
      stylesheetPrecedenceApplied: row.stylesheetPrecedenceApplied,
      modulePreloadStarted: row.modulePreloadStarted,
      scriptPreinitStarted: row.scriptPreinitStarted,
      moduleScriptPreinitStarted: row.moduleScriptPreinitStarted,
      scriptExecutionStarted: row.scriptExecutionStarted,
      publicResourceHintDomInsertion: row.publicResourceHintDomInsertion,
      publicResourceMapCommitBehavior: row.publicResourceMapCommitBehavior,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch
    })),
    [
      {
        contractId: 'preload',
        recordKind: 'preload',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: null,
        elementTag: 'link',
        relationshipApplied: 'preload',
        fakeDomCommitOperation: 'append-stylesheet-preload-link-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preinit-style',
        recordKind: 'stylesheet',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-main',
        elementTag: 'link',
        relationshipApplied: 'stylesheet',
        fakeDomCommitOperation:
          'insert-stylesheet-preinit-with-precedence-fake-head',
        insertionMethod: 'insertBefore',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: true,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preload',
        recordKind: 'preload',
        resourceKind: 'script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        elementTag: 'link',
        relationshipApplied: 'preload',
        fakeDomCommitOperation:
          'append-classic-script-preload-link-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preinit-script',
        recordKind: 'script',
        resourceKind: 'script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        elementTag: 'script',
        relationshipApplied: 'script',
        fakeDomCommitOperation: 'append-classic-script-preinit-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preload-module',
        recordKind: 'preload',
        resourceKind: 'script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        elementTag: 'link',
        relationshipApplied: 'modulepreload',
        fakeDomCommitOperation: 'append-modulepreload-link-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preinit-module-script',
        recordKind: 'script',
        resourceKind: 'script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        elementTag: 'script',
        relationshipApplied: 'module-script',
        fakeDomCommitOperation: 'append-module-script-preinit-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preload',
        recordKind: 'preload',
        resourceKind: 'font',
        resourceKey: 'font:font-main',
        precedenceKey: null,
        elementTag: 'link',
        relationshipApplied: 'preload',
        fakeDomCommitOperation: 'append-font-preload-link-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      }
    ]
  );
  assert.deepEqual(
    scenario.fakeDom.head.childNodes.map((node) => ({
      nodeName: node.nodeName,
      rel: node.attributes.rel || null,
      as: node.attributes.as || null,
      type: node.attributes.type || null,
      resourceKey: node.attributes['data-fast-react-resource-key'] || null,
      precedenceKey:
        node.attributes['data-fast-react-precedence-key'] || null
    })),
    [
      {
        nodeName: 'LINK',
        rel: 'stylesheet',
        as: null,
        type: null,
        resourceKey: 'existing-style',
        precedenceKey: 'precedence-main'
      },
      {
        nodeName: 'LINK',
        rel: 'stylesheet',
        as: null,
        type: null,
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        nodeName: 'META',
        rel: null,
        as: null,
        type: null,
        resourceKey: null,
        precedenceKey: null
      },
      {
        nodeName: 'LINK',
        rel: 'preload',
        as: 'style',
        type: null,
        resourceKey: 'style-main',
        precedenceKey: null
      },
      {
        nodeName: 'LINK',
        rel: 'preload',
        as: 'script',
        type: null,
        resourceKey: 'script-main',
        precedenceKey: null
      },
      {
        nodeName: 'SCRIPT',
        rel: null,
        as: null,
        type: null,
        resourceKey: 'script-main',
        precedenceKey: null
      },
      {
        nodeName: 'LINK',
        rel: 'modulepreload',
        as: null,
        type: null,
        resourceKey: 'module-main',
        precedenceKey: null
      },
      {
        nodeName: 'SCRIPT',
        rel: null,
        as: null,
        type: 'module',
        resourceKey: 'module-main',
        precedenceKey: null
      },
      {
        nodeName: 'LINK',
        rel: 'preload',
        as: 'font',
        type: null,
        resourceKey: 'font-main',
        precedenceKey: null
      }
    ]
  );
  assert.equal(
    scenario.fakeDom.head.childNodes[1].attributes.href,
    '[fast-react-redacted-resource-hint:href]'
  );
  assert.equal(
    scenario.fakeDom.head.childNodes[1].attributes['data-precedence'],
    '[fast-react-redacted-resource-hint:precedence]'
  );
  assert.equal(diagnostic.resourceMapCommitPlan.fakeDomCommitApplied, true);
  assert.equal(diagnostic.resourceLifecycleBoundary.fakeDomCommitApplied, true);
  assert.equal(diagnostic.resourceLifecycleBoundary.hostNodeInserted, true);
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, true);
  assert.equal(diagnostic.sideEffects.fakeResourceElementCreated, true);
  assert.equal(diagnostic.sideEffects.fakeResourceElementInserted, true);
  assert.equal(
    diagnostic.sideEffects.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(diagnostic.sideEffects.scriptExecutionStarted, false);
  assert.equal(
    diagnostic.sideEffects.preloadOrStyleDomWorkDispatched,
    false
  );
  assert.equal(diagnostic.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(
    diagnostic.sideEffects.publicResourceMapCommitBehavior,
    false
  );
  assert.equal(JSON.stringify(diagnostic).includes('/style.css'), false);
  assert.equal(JSON.stringify(diagnostic).includes('/script.js'), false);
  assert.equal(JSON.stringify(diagnostic).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-style'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-script'), false);
  assert.equal(JSON.stringify(diagnostic).includes('nonce-module'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);
});

test('private resource-map commit rejects conflicting script and modulepreload duplicate records', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-conflicting-module',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'L',
        [
          '/shared.js',
          'script',
          {
            crossOrigin: undefined,
            integrity: 'sha256-shared-classic',
            nonce: undefined,
            type: undefined,
            fetchPriority: undefined,
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'm',
        [
          '/shared.js',
          {
            as: undefined,
            crossOrigin: '',
            integrity: 'sha256-shared-module'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'shared'
      },
      {
        sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'shared'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'preload',
          as: 'script',
          'data-fast-react-resource-key': 'shared'
        }
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'modulepreload',
          'data-fast-react-resource-key': 'shared'
        }
      }
    ]
  );

  assert.throws(
    () =>
      scenario.commitGate.recordResourceMapCommitDiagnostic(
        scenario.order,
        scenario.stylesheet,
        {
          explicitResourceMapCommitDiagnostic: true
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'duplicate conflicting resource-map records for preload-props:script:shared'
    }
  );
  assert.equal(scenario.fakeDom.head.childNodes.length, 3);
});

test('private resource-map commit rejects malformed non-script modulepreload rows', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-malformed-module',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'm',
        [
          '/worker.mjs',
          {
            as: 'worker',
            crossOrigin: '',
            integrity: 'sha256-worker-module'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'worker',
        resourceKey: 'worker-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'modulepreload',
          as: 'worker',
          'data-fast-react-resource-key': 'worker-main'
        }
      }
    ]
  );

  assert.throws(
    () =>
      scenario.commitGate.recordResourceMapCommitDiagnostic(
        scenario.order,
        scenario.stylesheet,
        {
          explicitResourceMapCommitDiagnostic: true
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'modulepreload resource-map commit rows must describe script module preload records'
    }
  );
  assert.equal(scenario.order.scriptModulePreinitRows.length, 0);
  assert.equal(scenario.fakeDom.head.childNodes.length, 2);
});

test('private resource-map commit rejects stale stylesheet load-state records', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-stale-load-state',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      }
    ]
  );
  const staleScenario = createStylesheetPrecedenceLoadErrorStateScenario(
    'resource-map-stale-load-state-other'
  );
  const staleLoadStateGate =
    resourceFormGate.createResourceHintStylesheetLoadErrorStateGate({
      requestIdPrefix: 'resource-map-stale-load-state-other'
    });
  const staleLoadState =
    staleLoadStateGate.recordStylesheetLoadErrorStateDiagnostic(
      staleScenario.stylesheetPrecedence,
      {
        explicitStylesheetLoadErrorStateDiagnostic: true
      }
    );

  assert.throws(
    () =>
      scenario.commitGate.recordResourceMapCommitDiagnostic(
        scenario.order,
        scenario.stylesheet,
        {
          explicitResourceMapCommitDiagnostic: true
        },
        staleLoadState
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stale resource-map entries: stylesheet load/error state record must reference the source stylesheet precedence record'
    }
  );
  assert.equal(scenario.fakeDom.head.childNodes.length, 1);
});


test('private stylesheet load/error state diagnostic records fake resource state only', () => {
  const scenario = createStylesheetPrecedenceLoadErrorStateScenario(
    'stylesheet-load-state'
  );
  const loadStateGate =
    resourceFormGate.createResourceHintStylesheetLoadErrorStateGate({
      requestIdPrefix: 'stylesheet-load-state'
    });
  const diagnostic =
    loadStateGate.recordStylesheetLoadErrorStateDiagnostic(
      scenario.stylesheetPrecedence,
      {
        explicitStylesheetLoadErrorStateDiagnostic: true,
        stateKind: 'deterministic-fake-stylesheet-load-error-state',
        stateId: 'stylesheet-load-state',
        targetKind: 'stylesheet-resource-state'
      }
    );
  const summary =
    resourceFormGate
      .describePrivateResourceHintStylesheetLoadErrorStateGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintStylesheetLoadErrorStateRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    resourceFormGate
      .getPrivateResourceHintStylesheetLoadErrorStateRecordPayload(
        diagnostic
      ),
    diagnostic
  );
  assert.equal(
    diagnostic.stylesheetLoadErrorStateId,
    'stylesheet-load-state:1'
  );
  assert.equal(
    diagnostic.stylesheetLoadErrorStateStatus,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateStatus
  );
  assert.equal(
    diagnostic.executionStatus,
    resourceFormGate
      .privateResourceHintStylesheetLoadErrorStateExecutionStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintStylesheetLoadErrorStateSideEffects
  );
  assert.equal(
    diagnostic.sideEffects.fakeStylesheetLoadErrorStateDiagnosticInvoked,
    true
  );
  assert.equal(diagnostic.sideEffects.stylesheetFetchStarted, false);
  assert.equal(diagnostic.sideEffects.stylesheetLoadListenerInstalled, false);
  assert.equal(diagnostic.sideEffects.stylesheetErrorListenerInstalled, false);
  assert.equal(diagnostic.sideEffects.stylesheetPromiseCreated, false);
  assert.equal(diagnostic.sideEffects.stylesheetCommitSuspended, false);
  assert.equal(diagnostic.sideEffects.stylesheetRealTimerScheduled, false);
  assert.deepEqual(
    diagnostic.loadingStateBits.map((row) => [row.name, row.bitmask]),
    [
      ['NotLoaded', 0],
      ['Loaded', 1],
      ['Errored', 2],
      ['Settled', 3],
      ['Inserted', 4]
    ]
  );
  assert.deepEqual(
    diagnostic.resourceStateRows.map((row) => ({
      resourceKey: row.resourceKey,
      type: row.reactResourceShape.type,
      instance: row.reactResourceShape.instance,
      count: row.reactResourceShape.count,
      loading: row.stateShape.loading,
      preload: row.stateShape.preload,
      preloadSeenBefore: row.preloadSeenBefore,
      preinitSeenBefore: row.preinitSeenBefore,
      plannedInsertionCount: row.plannedInsertionCount,
      loadListenerInstalled: row.loadListenerInstalled,
      errorListenerInstalled: row.errorListenerInstalled,
      loadingPromiseCreated: row.loadingPromiseCreated,
      resourceFetchStarted: row.resourceFetchStarted
    })),
    [
      {
        resourceKey: 'style:style-main',
        type: 'stylesheet',
        instance: null,
        count: 1,
        loading: 0,
        preload: null,
        preloadSeenBefore: true,
        preinitSeenBefore: true,
        plannedInsertionCount: 1,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false,
        resourceFetchStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.loadingStateRows.map((row) => ({
      label: row.label,
      bitmask: row.bitmask,
      loaded: row.snapshot.loaded,
      errored: row.snapshot.errored,
      inserted: row.snapshot.inserted,
      loadListenerInstalled: row.loadListenerInstalled,
      errorListenerInstalled: row.errorListenerInstalled,
      loadingPromiseCreated: row.loadingPromiseCreated
    })),
    [
      {
        label: 'not-loaded',
        bitmask: 0,
        loaded: false,
        errored: false,
        inserted: false,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'loaded',
        bitmask: 1,
        loaded: true,
        errored: false,
        inserted: false,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'errored',
        bitmask: 2,
        loaded: false,
        errored: true,
        inserted: false,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'inserted-not-settled',
        bitmask: 4,
        loaded: false,
        errored: false,
        inserted: true,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'inserted-loaded',
        bitmask: 5,
        loaded: true,
        errored: false,
        inserted: true,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'inserted-errored',
        bitmask: 6,
        loaded: false,
        errored: true,
        inserted: true,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      }
    ]
  );
  assert.equal(diagnostic.preloadStateRows[0].preloadWouldBeTracked, true);
  assert.equal(
    diagnostic.preloadStateRows[0].preloadLoadListenerInstalled,
    false
  );
  assert.equal(
    diagnostic.preloadStateRows[0].preloadErrorListenerInstalled,
    false
  );
  assert.equal(diagnostic.preloadStateRows[0].preloadFetchStarted, false);
  assert.equal(
    diagnostic.commitSuspensionRows[0].maySuspendCommitIfNotInserted,
    true
  );
  assert.equal(diagnostic.commitSuspensionRows[0].stylesheetsMapCreated, false);
  assert.equal(
    diagnostic.commitSuspensionRows[0].suspendedStateCountIncremented,
    false
  );
  assert.equal(diagnostic.commitSuspensionRows[0].timerScheduled, false);
  assert.equal(diagnostic.commitSuspensionRows[0].commitSuspended, false);
  assert.deepEqual(diagnostic.suspendedCommitBoundary.stateShape, {
    stylesheets: null,
    count: 0,
    unsuspend: null
  });
  assert.equal(
    diagnostic.suspendedCommitBoundary.realTimerScheduled,
    false
  );
  assert.equal(
    diagnostic.suspendedCommitBoundary.suspendedCommitStarted,
    false
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetLoadErrorStateBlockedCapabilities
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(fakeResourceSourceUsesNoLoadErrorListeners(), true);
  assert.equal(scenario.fakeDom.head.childNodes.length, 2);
  assert.equal(JSON.stringify(diagnostic).includes('/style.css'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-style'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateGateId
  );
  assert.equal(summary.recordsStylesheetResourceShape, true);
  assert.equal(summary.recordsLoadingBitmasks, true);
  assert.equal(summary.installsLoadListeners, false);
  assert.equal(summary.installsErrorListeners, false);
  assert.equal(summary.createsLoadingPromises, false);
  assert.equal(summary.fetchesStylesheets, false);
  assert.equal(summary.suspendsCommits, false);
  assert.equal(summary.rejectsPublicResourceDispatchClaims, true);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintStylesheetLoadErrorStateBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintStylesheetLoadErrorStateError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateGateErrorCode
  );
  assert.equal(error.exportName, 'resource-hint-stylesheet-load-error-state');
  assert.equal(error.stylesheetLoadErrorStateId, 'stylesheet-load-state:1');
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetLoadErrorStateBlockedCapabilities
  );

  assert.throws(
    () =>
      loadStateGate.recordStylesheetLoadErrorStateDiagnostic(
        scenario.stylesheetPrecedence,
        { explicitStylesheetLoadErrorStateDiagnostic: true }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stylesheet load/error state gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintStylesheetLoadErrorStateGate()
        .recordStylesheetLoadErrorStateDiagnostic({}, {
          explicitStylesheetLoadErrorStateDiagnostic: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintStylesheetLoadErrorStateGate()
        .recordStylesheetLoadErrorStateDiagnostic(
          scenario.stylesheetPrecedence,
          {
            explicitStylesheetLoadErrorStateDiagnostic: true,
            element: {}
          }
        ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'element must not be passed to the metadata gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintStylesheetLoadErrorStateGate()
        .recordStylesheetLoadErrorStateDiagnostic(
          scenario.stylesheetPrecedence,
          {
            explicitStylesheetLoadErrorStateDiagnostic: true,
            publicStylesheetResourceBehavior: true
          }
        ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'publicStylesheetResourceBehavior must not claim public resource dispatch in the stylesheet load/error state metadata gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createUnsupportedResourceHintStylesheetLoadErrorStateError({}),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidRecordCode,
      compatibilityTarget
    }
  );
});


test('private resource hint dispatcher metadata rejects malformed or dispatching shapes', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-dispatcher-error-gate'
  });
  const record = gate.recordResourceHintDispatcherRequest('preconnect', [
    'https://connect.example.test',
    ''
  ]);
  const error =
    resourceFormGate.createUnsupportedResourceHintDispatcherMetadataError(
      record
    );

  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintDispatcherMetadataGateErrorCode
  );
  assert.equal(error.entrypoint, 'react-dom/private-internals');
  assert.equal(error.exportName, 'resource-hint-dispatcher.preconnect');
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.equal(error.requestId, 'resource-dispatcher-error-gate:1');
  assert.equal(error.requestSequence, 1);
  assert.equal(error.requestType, 'resource-hint-dispatcher.preconnect');
  assert.equal(error.contractId, 'preconnect');
  assert.equal(error.privateDispatcherKey, 'C');
  assert.deepEqual(error.sideEffects, resourceFormGate.resourceHintDispatcherSideEffects);

  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'fake-dom-adapter-error-gate'
  });
  const adapterAdmission = adapterGate.admitDispatcherRecord(record, {
    explicitAdmission: true,
    adapterKind: 'deterministic-fake-dom',
    adapterId: 'resource-hint-error-adapter',
    targetKind: 'document-head'
  });
  const adapterError =
    resourceFormGate.createUnsupportedResourceHintFakeDomAdapterError(
      adapterAdmission
    );

  assert.equal(adapterError.name, 'FastReactDomUnimplementedError');
  assert.equal(
    adapterError.code,
    resourceFormGate.privateResourceHintFakeDomAdapterGateErrorCode
  );
  assert.equal(adapterError.entrypoint, 'react-dom/private-internals');
  assert.equal(adapterError.exportName, 'resource-hint-fake-dom-adapter.preconnect');
  assert.equal(adapterError.compatibilityTarget, compatibilityTarget);
  assert.equal(adapterError.adapterAdmissionId, 'fake-dom-adapter-error-gate:1');
  assert.equal(adapterError.adapterAdmissionSequence, 1);
  assert.equal(adapterError.sourceRequestId, 'resource-dispatcher-error-gate:1');
  assert.equal(adapterError.sourceRequestSequence, 1);
  assert.equal(adapterError.contractId, 'preconnect');
  assert.equal(adapterError.privateDispatcherKey, 'C');
  assert.equal(
    adapterError.admissionStatus,
    resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus
  );
  assert.equal(
    adapterError.executionStatus,
    resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus
  );
  assert.deepEqual(
    adapterError.sideEffects,
    resourceFormGate.resourceHintFakeDomAdapterSideEffects
  );

  assert.throws(
    () => gate.recordResourceHintDispatcherRequest('L', ['/asset.js', 'script']),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preload',
      privateDispatcherKey: 'L'
    }
  );
  assert.throws(
    () =>
      gate.recordResourceHintDispatcherRequest('L', [
        '/font.woff2',
        'font',
        {
          crossOrigin: undefined,
          integrity: undefined,
          nonce: undefined,
          type: undefined,
          fetchPriority: undefined,
          referrerPolicy: undefined,
          imageSrcSet: undefined,
          imageSizes: undefined,
          media: undefined
        }
      ]),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preload',
      privateDispatcherKey: 'L'
    }
  );
  assert.throws(
    () =>
      gate.recordResourceHintDispatcherRequest('S', [
        '/style.css',
        'theme',
        {
          crossOrigin: '',
          integrity: 'sha256-style'
        }
      ]),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preinit-style',
      privateDispatcherKey: 'S'
    }
  );
  assert.throws(
    () =>
      gate.recordResourceHintDispatcherRequest('C', [
        'https://connect.example.test',
        'anonymous'
      ]),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preconnect',
      privateDispatcherKey: 'C'
    }
  );
  assert.throws(
    () => gate.recordResourceHintDispatcherRequest('M', ['/module.mjs', null]),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preinit-module-script',
      privateDispatcherKey: 'M'
    }
  );
  assert.throws(
    () => adapterGate.admitDispatcherRecord(record, {
      adapterKind: 'deterministic-fake-dom'
    }),
    {
      code: resourceFormGate.privateResourceHintFakeDomAdapterInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'explicitAdmission must be true'
    }
  );
  assert.throws(
    () => adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'real-dom',
      targetKind: 'document-head'
    }),
    {
      code: resourceFormGate.privateResourceHintFakeDomAdapterInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'adapterKind must be deterministic-fake-dom'
    }
  );
  assert.throws(
    () =>
      adapterGate.admitDispatcherRecord(
        gate.recordResourceHintRequest('preload', []),
        {
          explicitAdmission: true,
          adapterKind: 'deterministic-fake-dom',
          targetKind: 'document-head'
        }
      ),
    {
      code: resourceFormGate.privateResourceHintFakeDomAdapterInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintDispatcherMetadataError({}),
    {
      code:
        'FAST_REACT_DOM_RESOURCE_HINT_DISPATCHER_METADATA_INVALID_RECORD',
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintFakeDomAdapterError({}),
    {
      code: resourceFormGate.privateResourceHintFakeDomAdapterInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private form action/reset dispatcher gate rejects real form and action inputs', () => {
  const gate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: 'form-dispatcher-error-gate'
  });
  let actionCalls = 0;
  const action = () => {
    actionCalls++;
  };
  const record = gate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    actionKind: 'none',
    actionSource: 'none',
    submitControlKind: 'none'
  });
  const error =
    resourceFormGate.createUnsupportedFormActionResetDispatcherError(record);

  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateFormActionResetDispatcherGateErrorCode
  );
  assert.equal(error.entrypoint, 'react-dom/private-internals');
  assert.equal(
    error.exportName,
    'form-action-reset-dispatcher.submission'
  );
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.equal(error.requestId, 'form-dispatcher-error-gate:1');
  assert.equal(error.requestSequence, 1);
  assert.equal(error.intentKind, 'submission');
  assert.equal(error.contractId, 'form-action-submission-intent');
  assert.equal(
    error.status,
    resourceFormGate.privateFormActionSubmissionIntentRecordedStatus
  );
  assert.deepEqual(
    error.sideEffects,
    resourceFormGate.formActionSubmissionIntentSideEffects
  );
  assert.match(
    error.message,
    /private form action\/reset dispatcher gate records intent metadata only/u
  );

  assert.throws(
    () =>
      gate.recordSubmissionIntent({
        explicitIntent: true,
        eventName: 'submit',
        actionKind: 'function',
        action
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      contractId: 'form-action-submission-intent',
      intentKind: 'submission',
      reason: 'action must not be passed to the metadata gate'
    }
  );
  assert.equal(actionCalls, 0);
  assert.throws(
    () =>
      gate.recordSubmissionIntent({
        explicitIntent: true,
        eventName: 'submit',
        form: throwingProxy('real form')
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      reason: 'form must not be passed to the metadata gate'
    }
  );
  assert.throws(
    () =>
      gate.recordSubmissionIntent({
        explicitIntent: true,
        eventName: 'submit',
        submitter: throwingProxy('submitter')
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      reason: 'submitter must not be passed to the metadata gate'
    }
  );
  assert.throws(
    () =>
      gate.recordSubmissionIntent({
        explicitIntent: true,
        eventName: 'reset'
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      reason: 'eventName must be submit'
    }
  );
  assert.throws(
    () =>
      gate.recordResetIntent({
        explicitIntent: true,
        dispatcherKey: 'x'
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      contractId: 'form-action-reset-intent',
      intentKind: 'reset',
      reason: 'dispatcherKey must be r'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceFormActionInternalsGate()
        .recordFormActionResetIntent({
          explicitIntent: true,
          form: throwingProxy('reset form')
        }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      contractId: 'form-action-reset-intent',
      intentKind: 'reset',
      reason: 'form must not be passed to the metadata gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedFormActionResetDispatcherError({}),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource/form internals gate errors are deterministic and fail closed', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'error-gate'
  });
  const record = gate.recordFormActionRequest('useFormStatus', []);
  const error =
    resourceFormGate.createUnsupportedResourceFormActionInternalsError(record);

  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(error.code, resourceFormGate.privateResourceFormActionGateErrorCode);
  assert.equal(error.entrypoint, 'react-dom/private-internals');
  assert.equal(error.exportName, 'form-action.useFormStatus');
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.equal(error.requestId, 'error-gate:1');
  assert.equal(error.requestSequence, 1);
  assert.equal(error.requestType, 'form-action.useFormStatus');
  assert.equal(error.behaviorArea, 'form-action');
  assert.equal(error.requestName, 'useFormStatus');
  assert.equal(error.status, resourceFormGate.unsupportedStatus);
  assert.deepEqual(error.sideEffects, resourceFormGate.noSideEffects);
  assert.match(
    error.message,
    /private resource\/form action internals gate records metadata only/u
  );

  assert.throws(
    () => gate.recordResourceHintRequest('unknown-resource', []),
    {
      code: resourceFormGate.privateResourceFormActionGateUnknownRequestCode,
      compatibilityTarget,
      behaviorArea: 'resource-hint',
      requestName: 'unknown-resource'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceFormActionInternalsError({
        requestId: 'not-a-private-record'
      }),
    {
      code: 'FAST_REACT_DOM_RESOURCE_FORM_ACTION_GATE_INVALID_RECORD',
      compatibilityTarget
    }
  );
});

test('private controlled input value-tracker gate errors are deterministic and fail closed', () => {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'tracker-error-gate'
  });
  const record = gate.recordTrackerScenario({
    scenarioId: 'textarea-controlled-value-update',
    phaseId: 'initial',
    hostTag: 'textarea',
    props: {
      value: 'locked',
      onChange() {}
    }
  });
  const error =
    resourceFormGate.createUnsupportedControlledInputValueTrackerError(
      record
    );

  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateControlledInputValueTrackerGateErrorCode
  );
  assert.equal(error.entrypoint, 'react-dom/private-internals');
  assert.equal(error.exportName, 'controlled-value-tracker.textarea');
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.equal(error.requestId, 'tracker-error-gate:1');
  assert.equal(error.requestSequence, 1);
  assert.equal(error.scenarioId, 'textarea-controlled-value-update');
  assert.equal(error.phaseId, 'initial');
  assert.equal(error.hostTag, 'textarea');
  assert.equal(error.controlKind, 'value');
  assert.equal(error.status, resourceFormGate.unsupportedStatus);
  assert.deepEqual(
    error.sideEffects,
    resourceFormGate.controlledInputValueTrackerSideEffects
  );
  assert.match(
    error.message,
    /controlled input value-tracker gate records metadata only/u
  );

  assert.throws(
    () => gate.recordTrackerScenario({hostTag: 'input', controlKind: 'range'}),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerGateUnknownScenarioCode,
      compatibilityTarget,
      hostTag: 'input',
      controlKind: 'range'
    }
  );
  assert.throws(
    () => gate.recordTrackerScenario({hostTag: 'button'}),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerGateInvalidScenarioCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedControlledInputValueTrackerError({
        requestId: 'not-a-private-record'
      }),
    {
      code:
        'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE_INVALID_RECORD',
      compatibilityTarget
    }
  );
});
