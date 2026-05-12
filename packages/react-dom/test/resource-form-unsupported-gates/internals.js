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

test('private resource/form internals gate records deterministic unsupported metadata only', () => {
  const first = createPrivateGateScenario();
  const second = createPrivateGateScenario();

  assert.deepEqual(first.records, second.records);
  assert.deepEqual(first.summary, second.summary);

  for (const record of first.records) {
    assert.equal(Object.isFrozen(record), true, record.requestType);
    assert.equal(
      resourceFormGate.isPrivateResourceFormActionGateRecord(record),
      true,
      record.requestType
    );
    assert.equal(
      resourceFormGate.getPrivateResourceFormActionGateRecordPayload(record),
      record,
      record.requestType
    );
    assert.equal(record.status, resourceFormGate.unsupportedStatus);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.deepEqual(record.sideEffects, resourceFormGate.noSideEffects);
    assert.equal(record.sideEffects.resourcesDispatched, false);
    assert.equal(record.sideEffects.singletonsResolved, false);
    assert.equal(record.sideEffects.formsSubmitted, false);
    assert.equal(record.sideEffects.formsReset, false);
    assert.equal(record.sideEffects.controlsTracked, false);
    assert.equal(record.sideEffects.publicRootTouched, false);
    assert.equal(record.sideEffects.compatibilityClaimed, false);
  }

  assert.deepEqual(
    first.records.map((record) => ({
      argumentInfo: record.argumentInfo,
      behaviorArea: record.behaviorArea,
      contractId: record.contractId,
      hostTag: record.hostTag,
      oracleKind: record.oracleKind,
      privateDispatcherKey: record.privateDispatcherKey,
      publicName: record.publicName,
      requestId: record.requestId,
      requestName: record.requestName,
      requestSequence: record.requestSequence,
      requestType: record.requestType
    })),
    [
      {
        argumentInfo: {
          count: 2,
          values: [
            {type: 'string', empty: false},
            {type: 'object'}
          ]
        },
        behaviorArea: 'resource-hint',
        contractId: 'preload',
        hostTag: null,
        oracleKind: 'react-19.2.6-react-dom-resource-hints-oracle',
        privateDispatcherKey: 'L',
        publicName: 'preload',
        requestId: 'gate:1',
        requestName: 'preload',
        requestSequence: 1,
        requestType: 'resource-hint.preload'
      },
      {
        argumentInfo: {
          count: 1,
          values: [{type: 'object'}]
        },
        behaviorArea: 'host-singleton',
        contractId: 'head-singleton',
        hostTag: 'head',
        oracleKind: 'react-19.2.6-react-dom-resource-hints-oracle',
        privateDispatcherKey: null,
        publicName: null,
        requestId: 'gate:2',
        requestName: 'head',
        requestSequence: 2,
        requestType: 'host-singleton.head'
      },
      {
        argumentInfo: {
          count: 1,
          values: [{type: 'object'}]
        },
        behaviorArea: 'form-action',
        contractId: 'request-form-reset',
        hostTag: null,
        oracleKind: 'react-19.2.6-react-dom-form-actions-oracle',
        privateDispatcherKey: 'r',
        publicName: 'requestFormReset',
        requestId: 'gate:3',
        requestName: 'requestFormReset',
        requestSequence: 3,
        requestType: 'form-action.requestFormReset'
      },
      {
        argumentInfo: {
          count: 1,
          values: [{type: 'object'}]
        },
        behaviorArea: 'controlled-form',
        contractId: 'input-controlled-value',
        hostTag: 'input',
        oracleKind: 'react-19.2.6-dom-controlled-input-oracle',
        privateDispatcherKey: null,
        publicName: null,
        requestId: 'gate:4',
        requestName: 'input',
        requestSequence: 4,
        requestType: 'controlled-form.input'
      }
    ]
  );

  assert.equal(first.summary.compatibilityTarget, compatibilityTarget);
  assert.equal(first.summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(first.summary.unsupportedCode, unsupportedCode);
  assert.deepEqual(first.summary.sideEffects, resourceFormGate.noSideEffects);
  assert.deepEqual(
    first.summary.oracleEvidence.map((evidence) => ({
      compatibilityClaimed: evidence.compatibilityClaimed,
      fastReactComparedToReactDom: evidence.fastReactComparedToReactDom,
      oracleKind: evidence.oracleKind
    })),
    [
      {
        compatibilityClaimed: false,
        fastReactComparedToReactDom: false,
        oracleKind: 'react-19.2.6-react-dom-resource-hints-oracle'
      },
      {
        compatibilityClaimed: false,
        fastReactComparedToReactDom: false,
        oracleKind: 'react-19.2.6-react-dom-form-actions-oracle'
      },
      {
        compatibilityClaimed: false,
        fastReactComparedToReactDom: false,
        oracleKind: 'react-19.2.6-dom-controlled-input-oracle'
      }
    ]
  );
});
