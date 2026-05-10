'use strict';

const assert = require('node:assert/strict');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const sourceRoot = path.join(packageRoot, 'src');
const resourceFormGate = require(path.join(
  sourceRoot,
  'resource-form-gates.js'
));
const rootBridge = require(path.join(sourceRoot, 'client', 'root-bridge.js'));

const resourceOracle = require(path.join(
  repoRoot,
  'tests',
  'conformance',
  'oracles',
  'react-19.2.6-react-dom-resource-hints-oracle.json'
));
const formActionsOracle = require(path.join(
  repoRoot,
  'tests',
  'conformance',
  'oracles',
  'react-19.2.6-react-dom-form-actions-oracle.json'
));
const controlledInputOracle = require(path.join(
  repoRoot,
  'tests',
  'conformance',
  'oracles',
  'react-19.2.6-dom-controlled-input-oracle.json'
));

const internalsExport =
  '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE';
const unsupportedCode = 'FAST_REACT_UNIMPLEMENTED';
const compatibilityTarget = 'react-dom@19.2.6';
const placeholderVersion = '0.0.0-fast-react-dom-placeholder';
const implementedVersion = '19.2.6';
const metadataOnlySourceFiles = new Set(['src/resource-form-internals-gate.js']);

const resourceShape = oracleValue(
  resourceOracle,
  'default-node-development',
  'resource-hint-export-shape'
);
const formRootShape = oracleValue(
  formActionsOracle,
  'default-node-development',
  'root-api-descriptors'
);
const formServerRootShape = oracleValue(
  formActionsOracle,
  'react-server-production',
  'root-api-descriptors'
);

const disallowedSourcePatterns = [
  {
    id: 'resource-or-singleton-adapter',
    pattern:
      /\b(?:HostHoistable|HostSingleton|hoistable|Hoistable|singleton|Singleton|getResource|acquireResource|releaseResource|preloadResource|suspendResource|resolveSingletonInstance|acquireSingletonInstance|releaseSingletonInstance)\b/u
  },
  {
    id: 'form-action-adapter',
    pattern:
      /\b(?:requestFormReset|useFormStatus|useFormState|resetFormInstance|reset_form_instance|HostTransition|hostTransition|startHostTransition|FormData|submitter|createFormDataWithSubmitter|formState|form_state)\b/u
  },
  {
    id: 'controlled-control-adapter',
    pattern:
      /\b(?:inputValueTracking|trackValueOnNode|updateValueIfChanged|getTracker|_valueTracker|enqueueStateRestore|restoreStateIfNeeded|restoreControlledState|restoreControlledInputState|initInput|updateInput|hydrateInput|validateInputProps|initSelect|updateSelect|postUpdateSelect|validateSelectProps|initTextarea|updateTextarea|hydrateTextarea|validateTextareaProps|internalPropsKey|getFiberCurrentPropsFromNode|updateFiberProps|getInstanceFromNode|ChangeEventPlugin|BeforeInputEventPlugin|SelectEventPlugin)\b/u
  }
];

test('accepted resource, form, and controlled-control oracles remain non-compatibility evidence', () => {
  assert.equal(resourceOracle.conformanceClaims.realReactDomBehaviorProbed, true);
  assert.equal(resourceOracle.conformanceClaims.fastReactComparedToReactDom, false);
  assert.equal(resourceOracle.conformanceClaims.compatibilityClaimed, false);
  assert.equal(resourceOracle.evidenceClaims.fastReactComparedToReactDom, false);

  assert.equal(formActionsOracle.conformanceClaims.realReactDomBehaviorProbed, true);
  assert.equal(
    formActionsOracle.conformanceClaims.fullClientFormActionOracleExists,
    false
  );
  assert.equal(formActionsOracle.conformanceClaims.compatibilityClaimed, false);
  assert.equal(
    formActionsOracle.evidenceClaims.fastReactComparedToReactDom,
    false
  );

  assert.equal(controlledInputOracle.conformanceClaims.realReactDomBehaviorProbed, true);
  assert.equal(
    controlledInputOracle.conformanceClaims.fastReactComparedToReactDom,
    false
  );
  assert.equal(controlledInputOracle.conformanceClaims.compatibilityClaimed, false);
  assert.equal(controlledInputOracle.evidenceClaims.browserNativeDomUsed, false);
  assert.equal(
    controlledInputOracle.evidenceClaims.deterministicFakeDomSubstrateUsed,
    true
  );
});

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

test('private controlled input value-tracker gate records deterministic metadata only', () => {
  const first = createPrivateControlledValueTrackerScenario();
  const second = createPrivateControlledValueTrackerScenario();

  assert.deepEqual(first.records, second.records);
  assert.deepEqual(first.summary, second.summary);

  for (const record of first.records) {
    assert.equal(Object.isFrozen(record), true, record.scenarioId);
    assert.equal(
      resourceFormGate.isPrivateControlledInputValueTrackerRecord(record),
      true,
      record.scenarioId
    );
    assert.equal(
      resourceFormGate.getPrivateControlledInputValueTrackerRecordPayload(
        record
      ),
      record,
      record.scenarioId
    );
    assert.equal(record.status, resourceFormGate.unsupportedStatus);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.deepEqual(
      record.sideEffects,
      resourceFormGate.controlledInputValueTrackerSideEffects
    );
    assert.equal(record.sideEffects.controlsTracked, false);
    assert.equal(record.sideEffects.trackerAttached, false);
    assert.equal(record.sideEffects.hostValueRead, false);
    assert.equal(record.sideEffects.hostValueWritten, false);
    assert.equal(record.sideEffects.propertyDescriptorInstalled, false);
    assert.equal(record.sideEffects.changeEventsObserved, false);
    assert.equal(record.sideEffects.postEventRestoreQueued, false);
    assert.equal(
      record.sideEffects.publicControlledBehaviorEnabled,
      false
    );
    assert.equal(record.sideEffects.publicRootTouched, false);
    assert.equal(record.sideEffects.compatibilityClaimed, false);
    assert.equal(record.trackerMetadata.deterministicMetadataOnly, true);
    assert.equal(record.trackerMetadata.liveHostNodeRequired, false);
    assert.equal(record.trackerMetadata.rawTargetCaptured, false);
    assert.equal(record.trackerMetadata.trackerAttached, false);
    assert.equal(record.trackerMetadata.currentValueSnapshot, null);
    assert.equal(record.postEventRestoreBoundary.latestPropsLookup, false);
    assert.equal(record.postEventRestoreBoundary.eventPluginDispatch, false);
    assert.equal(record.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(record.postEventRestoreBoundary.restoreFlushed, false);
    assert.equal(
      record.publicControlledBehaviorBoundary.rootRenderReachable,
      false
    );
    assert.equal(
      record.publicControlledBehaviorBoundary.hostWrapperWrites,
      false
    );
    assert.equal(
      record.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
  }

  assert.deepEqual(
    first.records.map((record) => ({
      requestId: record.requestId,
      requestSequence: record.requestSequence,
      scenarioId: record.scenarioId,
      phaseId: record.phaseId,
      hostTag: record.hostTag,
      inputType: record.inputType,
      multiple: record.multiple,
      controlKind: record.controlKind,
      contractId: record.contractId,
      trackerMetadata: {
        trackedField: record.trackerMetadata.trackedField,
        valueKind: record.trackerMetadata.valueKind,
        expectedPropKeys: record.trackerMetadata.expectedPropKeys,
        observedPropKeys: record.trackerMetadata.observedPropKeys,
        propSummary: record.trackerMetadata.propSummary
      }
    })),
    [
      {
        requestId: 'tracker-gate:1',
        requestSequence: 1,
        scenarioId: 'input-text-controlled-value-update',
        phaseId: 'initial',
        hostTag: 'input',
        inputType: 'text',
        multiple: false,
        controlKind: 'value',
        contractId: 'input-value-tracker',
        trackerMetadata: {
          trackedField: 'value',
          valueKind: 'string-current-value',
          expectedPropKeys: ['type', 'value', 'defaultValue', 'onChange'],
          observedPropKeys: ['type', 'value', 'onChange'],
          propSummary: {
            type: {present: true, value: {type: 'string', empty: false}},
            value: {present: true, value: {type: 'string', empty: false}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      },
      {
        requestId: 'tracker-gate:2',
        requestSequence: 2,
        scenarioId: 'checkbox-controlled-checked-update',
        phaseId: 'initial',
        hostTag: 'input',
        inputType: 'checkbox',
        multiple: false,
        controlKind: 'checked',
        contractId: 'input-checked-tracker',
        trackerMetadata: {
          trackedField: 'checked',
          valueKind: 'boolean-string-current-value',
          expectedPropKeys: ['type', 'checked', 'defaultChecked', 'onChange'],
          observedPropKeys: ['type', 'checked', 'onChange'],
          propSummary: {
            type: {present: true, value: {type: 'string', empty: false}},
            checked: {present: true, value: {type: 'boolean'}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      },
      {
        requestId: 'tracker-gate:3',
        requestSequence: 3,
        scenarioId: 'select-single-controlled-update',
        phaseId: 'initial',
        hostTag: 'select',
        inputType: null,
        multiple: false,
        controlKind: 'single',
        contractId: 'select-single-value-tracker',
        trackerMetadata: {
          trackedField: 'selectedOptions',
          valueKind: 'single-option-value',
          expectedPropKeys: ['value', 'defaultValue', 'onChange'],
          observedPropKeys: ['value', 'onChange'],
          propSummary: {
            value: {present: true, value: {type: 'string', empty: false}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      },
      {
        requestId: 'tracker-gate:4',
        requestSequence: 4,
        scenarioId: 'select-multiple-controlled-update',
        phaseId: 'update',
        hostTag: 'select',
        inputType: null,
        multiple: true,
        controlKind: 'multiple',
        contractId: 'select-multiple-value-tracker',
        trackerMetadata: {
          trackedField: 'selectedOptions',
          valueKind: 'array-option-values',
          expectedPropKeys: [
            'multiple',
            'value',
            'defaultValue',
            'onChange'
          ],
          observedPropKeys: ['multiple', 'value', 'onChange'],
          propSummary: {
            multiple: {present: true, value: {type: 'boolean'}},
            value: {present: true, value: {type: 'object'}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      },
      {
        requestId: 'tracker-gate:5',
        requestSequence: 5,
        scenarioId: 'textarea-controlled-value-update',
        phaseId: 'initial',
        hostTag: 'textarea',
        inputType: null,
        multiple: false,
        controlKind: 'value',
        contractId: 'textarea-value-tracker',
        trackerMetadata: {
          trackedField: 'value',
          valueKind: 'string-current-value',
          expectedPropKeys: [
            'value',
            'defaultValue',
            'children',
            'onChange'
          ],
          observedPropKeys: ['value', 'onChange'],
          propSummary: {
            value: {present: true, value: {type: 'string', empty: false}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      }
    ]
  );

  assert.equal(first.summary.gateId, resourceFormGate.controlledInputValueTrackerGateId);
  assert.equal(first.summary.compatibilityTarget, compatibilityTarget);
  assert.equal(first.summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(first.summary.unsupportedCode, unsupportedCode);
  assert.deepEqual(
    first.summary.sideEffects,
    resourceFormGate.controlledInputValueTrackerSideEffects
  );
  assert.deepEqual(
    first.summary.oracleCoverage,
    [
      {
        hostTag: 'input',
        scenarioCount: 12,
        trackedFields: ['value', 'checked'],
        compatibilityClaimed: false
      },
      {
        hostTag: 'select',
        scenarioCount: 6,
        trackedFields: ['selectedOptions'],
        compatibilityClaimed: false
      },
      {
        hostTag: 'textarea',
        scenarioCount: 7,
        trackedFields: ['value'],
        compatibilityClaimed: false
      }
    ]
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

test('resource/form root bridge boundary metadata matches accepted blocked root gates', async () => {
  const rootFacadeGate = await import(
    pathToFileURL(
      path.join(
        repoRoot,
        'tests',
        'conformance',
        'src',
        'react-dom-root-render-e2e-conformance-gate.mjs'
      )
    ).href
  );
  const summary = resourceFormGate.describeResourceFormRootBridgeBlockedGate();

  assert.equal(summary.schemaVersion, 1);
  assert.equal(
    summary.gateId,
    resourceFormGate.resourceFormRootBridgeBlockedGateId
  );
  assert.equal(summary.compatibilityTarget, compatibilityTarget);
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(summary.unsupportedCode, unsupportedCode);
  assert.deepEqual(summary.sideEffects, resourceFormGate.rootBoundarySideEffects);

  assert.deepEqual(summary.publicRootBoundary, {
    gateId: rootFacadeGate.REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_GATE_ID,
    gateStatus: rootFacadeGate.REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    rootObjectCreated: false,
    renderReachable: false,
    unmountReachable: false,
    compatibilityClaimed: false
  });
  assert.equal(
    summary.privateRootBridgeBoundary.gateStatus,
    rootFacadeGate.REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS
  );
  assert.equal(
    summary.privateRootBridgeBoundary.executionStatus,
    rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED
  );
  assert.equal(
    summary.privateRootBridgeBoundary.compatibilityStatus,
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED
  );
  assert.equal(summary.privateRootBridgeBoundary.admittedRootRequest, false);
  assert.equal(summary.privateRootBridgeBoundary.nativeExecution, false);
  assert.equal(summary.privateRootBridgeBoundary.reconcilerExecution, false);
  assert.equal(summary.privateRootBridgeBoundary.domMutation, false);
  assert.equal(summary.privateRootBridgeBoundary.markerWrites, false);
  assert.equal(summary.privateRootBridgeBoundary.listenerInstallation, false);
  assert.equal(summary.privateRootBridgeBoundary.hydration, false);
  assert.equal(summary.privateRootBridgeBoundary.eventDispatch, false);
  assert.equal(summary.privateRootBridgeBoundary.compatibilityClaimed, false);
  assert.deepEqual(
    summary.privateRootBridgeBoundary.blockedCapabilities,
    rootBridge.ROOT_BRIDGE_BLOCKED_CAPABILITIES
  );
  assert.deepEqual(summary.sourceAdapterBoundary, {
    gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
    behaviorArea: null,
    supportedBehaviorAreas: [
      'resource-hint',
      'form-action',
      'controlled-form'
    ],
    adaptersInvoked: false,
    rawTargetCaptured: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    controlledValueTrackerBoundary: {
      gateStatus: resourceFormGate.privateControlledValueTrackerBlockedStatus,
      behaviorArea: null,
      supportedBehaviorArea: 'controlled-form',
      appliesToRequest: false,
      metadataGateAvailable: true,
      trackerRecordsAccepted: true,
      liveHostNodeRequired: false,
      rawTargetCaptured: false,
      trackerAttached: false,
      hostValueRead: false,
      hostValueWritten: false,
      postEventRestoreQueued: false,
      publicControlledBehaviorEnabled: false,
      compatibilityClaimed: false
    }
  });
});

test('resource/form requests stay fail-closed with accepted private root bridge admission', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'root-boundary-gate'
  });
  const { admission, container, document } = createPrivateRootBridgeAdmission();
  const requests = [
    gate.recordResourceHintRequest('preload', [
      'https://fast-react.invalid/app.js',
      throwingProxy('resource options')
    ]),
    gate.recordFormActionRequest('requestFormReset', [
      throwingProxy('form element')
    ]),
    gate.recordControlledFormRequest('input', [
      throwingProxy('controlled props')
    ])
  ];

  const blockedRecords = requests.map((request) =>
    resourceFormGate.recordResourceFormRootBridgeBlockedRequest(request, {
      rootBridgeAdmission: admission
    })
  );

  assert.deepEqual(
    blockedRecords.map((record) => ({
      behaviorArea: record.behaviorArea,
        requestType: record.requestType,
        status: record.status,
        publicRootStatus: record.publicRootBoundary.gateStatus,
        rootBridgeStatus: record.rootBridgeBoundary.gateStatus,
        sourceAdapterStatus: record.sourceAdapterBoundary.gateStatus,
        trackerBoundaryApplies:
          record.sourceAdapterBoundary.controlledValueTrackerBoundary
            .appliesToRequest
      })),
    [
      {
        behaviorArea: 'resource-hint',
        requestType: 'resource-hint.preload',
        status: resourceFormGate.unsupportedStatus,
        publicRootStatus: resourceFormGate.publicRootFacadeBlockedStatus,
        rootBridgeStatus: resourceFormGate.privateRootBridgeRecordOnlyStatus,
        sourceAdapterStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
        trackerBoundaryApplies: false
      },
      {
        behaviorArea: 'form-action',
        requestType: 'form-action.requestFormReset',
        status: resourceFormGate.unsupportedStatus,
        publicRootStatus: resourceFormGate.publicRootFacadeBlockedStatus,
        rootBridgeStatus: resourceFormGate.privateRootBridgeRecordOnlyStatus,
        sourceAdapterStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
        trackerBoundaryApplies: false
      },
      {
        behaviorArea: 'controlled-form',
        requestType: 'controlled-form.input',
        status: resourceFormGate.unsupportedStatus,
        publicRootStatus: resourceFormGate.publicRootFacadeBlockedStatus,
        rootBridgeStatus: resourceFormGate.privateRootBridgeRecordOnlyStatus,
        sourceAdapterStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
        trackerBoundaryApplies: true
      }
    ]
  );

  for (const blockedRecord of blockedRecords) {
    assert.equal(Object.isFrozen(blockedRecord), true);
    assert.equal(
      resourceFormGate.isResourceFormRootBridgeBlockedRecord(blockedRecord),
      true
    );
    assert.equal(
      resourceFormGate.getResourceFormRootBridgeBlockedRecordPayload(
        blockedRecord
      ),
      blockedRecord
    );
    assert.equal(blockedRecord.compatibilityTarget, compatibilityTarget);
    assert.equal(blockedRecord.unsupportedCode, unsupportedCode);
    assert.deepEqual(
      blockedRecord.sideEffects,
      resourceFormGate.rootBoundarySideEffects
    );
    assert.equal(blockedRecord.publicRootBoundary.rootObjectCreated, false);
    assert.equal(blockedRecord.publicRootBoundary.renderReachable, false);
    assert.equal(blockedRecord.publicRootBoundary.unmountReachable, false);
    assert.equal(blockedRecord.publicRootBoundary.compatibilityClaimed, false);
    assert.equal(blockedRecord.rootBridgeBoundary.admittedRootRequest, true);
    assert.equal(
      blockedRecord.rootBridgeBoundary.admissionStatus,
      rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
    );
    assert.equal(
      blockedRecord.rootBridgeBoundary.executionStatus,
      rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED
    );
    assert.equal(blockedRecord.rootBridgeBoundary.nativeExecution, false);
    assert.equal(blockedRecord.rootBridgeBoundary.reconcilerExecution, false);
    assert.equal(blockedRecord.rootBridgeBoundary.domMutation, false);
    assert.equal(blockedRecord.rootBridgeBoundary.markerWrites, false);
    assert.equal(blockedRecord.rootBridgeBoundary.listenerInstallation, false);
    assert.equal(blockedRecord.rootBridgeBoundary.hydration, false);
    assert.equal(blockedRecord.rootBridgeBoundary.eventDispatch, false);
    assert.equal(blockedRecord.rootBridgeBoundary.compatibilityClaimed, false);
    assert.equal(blockedRecord.sourceAdapterBoundary.adaptersInvoked, false);
    assert.equal(blockedRecord.sourceAdapterBoundary.rawTargetCaptured, false);
    assert.equal(blockedRecord.sourceAdapterBoundary.publicRootTouched, false);
    assert.equal(
      blockedRecord.sourceAdapterBoundary.compatibilityClaimed,
      false
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .gateStatus,
      resourceFormGate.privateControlledValueTrackerBlockedStatus
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .trackerAttached,
      false
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .hostValueRead,
      false
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .hostValueWritten,
      false
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .postEventRestoreQueued,
      false
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .publicControlledBehaviorEnabled,
      false
    );
  }

  assert.equal(container.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  assert.throws(
    () =>
      resourceFormGate.recordResourceFormRootBridgeBlockedRequest(requests[0], {
        rootBridgeAdmission: {
          ...admission,
          compatibilityClaimed: true
        }
      }),
    {
      code: resourceFormGate.rootBoundaryInvalidRootMetadataCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.recordResourceFormRootBridgeBlockedRequest(requests[0], {
        publicRootGateStatus: 'matched-react-dom-root'
      }),
    {
      code: resourceFormGate.rootBoundaryInvalidPublicMetadataCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () => resourceFormGate.recordResourceFormRootBridgeBlockedRequest({}),
    {
      code: resourceFormGate.rootBoundaryInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('resource hint entrypoints keep accepted public shape but never dispatch resource work', () => {
  for (const entrypoint of [
    {
      entrypoint: 'react-dom',
      fileName: 'index.js'
    },
    {
      entrypoint: 'react-dom/profiling',
      fileName: 'profiling.js'
    }
  ]) {
    const moduleExports = requireFresh(entrypoint.fileName);
    assertPlaceholderMetadata(moduleExports, entrypoint.entrypoint);
    assert.equal(moduleExports.version, implementedVersion);

    assert.deepEqual(
      Object.keys(moduleExports[internalsExport].d),
      resourceShape.dispatcher.dispatcherOwnKeys
    );

    const dispatchCalls = replaceDispatcherWithSpies(moduleExports);

    for (const apiName of resourceOracle.resourceHintApis) {
      assertFunctionMatchesOracle(moduleExports, apiName, {
        descriptor: resourceShape.module.exports[apiName].descriptor,
        entrypoint: entrypoint.entrypoint
      });
      assertUnsupportedThrow(
        () =>
          moduleExports[apiName](
            'https://fast-react.invalid/resource',
            throwingProxy(`${apiName} options`)
          ),
        {
          entrypoint: entrypoint.entrypoint,
          exportName: apiName
        }
      );
    }

    assert.deepEqual(dispatchCalls, [], `${entrypoint.entrypoint} dispatch calls`);
  }
});

test('form action entrypoints keep accepted public shape but never inspect forms or reset dispatchers', () => {
  for (const entrypoint of [
    {
      entrypoint: 'react-dom',
      fileName: 'index.js'
    },
    {
      entrypoint: 'react-dom/profiling',
      fileName: 'profiling.js'
    }
  ]) {
    const moduleExports = requireFresh(entrypoint.fileName);
    assertPlaceholderMetadata(moduleExports, entrypoint.entrypoint);
    assert.equal(moduleExports.version, implementedVersion);

    const dispatchCalls = replaceDispatcherWithSpies(moduleExports);

    for (const apiName of formActionsOracle.apiNames) {
      assertFunctionMatchesOracle(moduleExports, apiName, {
        descriptor: formRootShape.selectedAPIs[apiName],
        entrypoint: entrypoint.entrypoint
      });
    }

    assertUnsupportedThrow(
      () => moduleExports.requestFormReset(throwingProxy('form element')),
      {
        entrypoint: entrypoint.entrypoint,
        exportName: 'requestFormReset'
      }
    );
    assertUnsupportedThrow(
      () =>
        moduleExports.useFormState(
          throwingProxy('form action'),
          throwingProxy('initial state'),
          throwingProxy('permalink')
        ),
      {
        entrypoint: entrypoint.entrypoint,
        exportName: 'useFormState'
      }
    );
    assertUnsupportedThrow(
      () => moduleExports.useFormStatus(throwingProxy('unexpected argument')),
      {
        entrypoint: entrypoint.entrypoint,
        exportName: 'useFormStatus'
      }
    );

    assert.deepEqual(dispatchCalls, [], `${entrypoint.entrypoint} dispatch calls`);
  }
});

test('react-server root stays fail-closed for resources and omits form action APIs', () => {
  const moduleExports = requireFresh('react-dom.react-server.js');
  assertPlaceholderMetadata(moduleExports, 'react-dom');
  assert.equal(moduleExports.version, placeholderVersion);

  for (const apiName of resourceOracle.resourceHintApis) {
    assert.equal(typeof moduleExports[apiName], 'function', apiName);
    assert.equal(moduleExports[apiName].length, 0, apiName);
    assert.equal(moduleExports[apiName].name, apiName, apiName);
    assertUnsupportedThrow(
      () => moduleExports[apiName](throwingProxy(`${apiName} href`)),
      {
        entrypoint: 'react-dom',
        exportName: apiName
      }
    );
  }

  for (const apiName of formActionsOracle.apiNames) {
    assert.equal(
      Object.hasOwn(moduleExports, apiName),
      false,
      `react-server must omit ${apiName}`
    );
  }
  assert.deepEqual(
    Object.keys(moduleExports),
    formServerRootShape.module.exportKeys
  );
});

test('controlled-control paths stay blocked at public roots and source adapter boundaries', () => {
  const client = requireFresh('client.js');
  assertPlaceholderMetadata(client, 'react-dom/client');
  assert.equal(client.version, placeholderVersion);

  assertUnsupportedThrow(
    () =>
      client.createRoot(
        throwingProxy('controlled root container'),
        throwingProxy('root options')
      ),
    {
      entrypoint: 'react-dom/client',
      exportName: 'createRoot'
    }
  );
  assertUnsupportedThrow(
    () =>
      client.hydrateRoot(
        throwingProxy('controlled root container'),
        {
          type: 'input',
          props: {
            value: 'blocked'
          }
        },
        throwingProxy('hydrate options')
      ),
    {
      entrypoint: 'react-dom/client',
      exportName: 'hydrateRoot'
    }
  );

  const matches = findDisallowedSourceMatches();
  assert.deepEqual(matches, [], formatSourceMatches(matches));
});

function assertFunctionMatchesOracle(moduleExports, exportName, expected) {
  const descriptor = Object.getOwnPropertyDescriptor(moduleExports, exportName);
  assert.ok(descriptor, `${expected.entrypoint}.${exportName} descriptor`);
  assert.deepEqual(dataDescriptorFields(descriptor), {
    configurable: expected.descriptor.configurable,
    enumerable: expected.descriptor.enumerable,
    writable: expected.descriptor.writable
  });
  assert.equal(typeof descriptor.value, 'function');
  assert.equal(
    descriptor.value.length,
    expected.descriptor.value.length,
    `${expected.entrypoint}.${exportName} length`
  );
  assert.equal(
    descriptor.value.name,
    expected.descriptor.value.name,
    `${expected.entrypoint}.${exportName} name`
  );
  assert.deepEqual(
    Object.getOwnPropertyNames(descriptor.value),
    expected.descriptor.value.ownPropertyNames,
    `${expected.entrypoint}.${exportName} own property names`
  );
}

function assertPlaceholderMetadata(moduleExports, entrypoint) {
  assert.equal(moduleExports.__FAST_REACT_PLACEHOLDER__, true, entrypoint);
  assert.equal(moduleExports.__FAST_REACT_ENTRYPOINT__, entrypoint, entrypoint);
  assert.equal(moduleExports.compatibilityTarget, compatibilityTarget, entrypoint);
  assert.equal(
    Object.keys(moduleExports).includes('__FAST_REACT_PLACEHOLDER__'),
    false
  );
  assert.equal(
    Object.keys(moduleExports).includes('__FAST_REACT_ENTRYPOINT__'),
    false
  );
  assert.equal(Object.keys(moduleExports).includes('compatibilityTarget'), false);
}

function assertUnsupportedThrow(callback, { entrypoint, exportName }) {
  assert.throws(callback, (error) => {
    assert.equal(error.name, 'FastReactDomUnimplementedError', exportName);
    assert.equal(error.code, unsupportedCode, exportName);
    assert.equal(error.entrypoint, entrypoint, exportName);
    assert.equal(error.exportName, exportName, exportName);
    assert.equal(error.compatibilityTarget, compatibilityTarget, exportName);
    assert.match(
      error.message,
      /placeholder has no React DOM behavior implementation yet/u,
      exportName
    );
    return true;
  });
}

function replaceDispatcherWithSpies(moduleExports) {
  const dispatchCalls = [];
  const dispatcher = moduleExports[internalsExport].d;
  for (const key of Object.keys(dispatcher)) {
    dispatcher[key] = function fastReactUnexpectedDispatcherCall(...args) {
      dispatchCalls.push({
        args,
        key
      });
    };
  }
  return dispatchCalls;
}

function createPrivateGateScenario() {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'gate'
  });
  const records = [
    gate.recordResourceHintRequest('preload', [
      'https://fast-react.invalid/app.js',
      throwingProxy('resource options')
    ]),
    gate.recordSingletonRequest('head', [throwingProxy('singleton props')]),
    gate.recordFormActionRequest('requestFormReset', [
      throwingProxy('form element')
    ]),
    gate.recordControlledFormRequest('input', [
      throwingProxy('controlled props')
    ])
  ];

  return {
    records,
    summary: resourceFormGate.describeResourceFormActionInternalsGate()
  };
}

function createPrivateControlledValueTrackerScenario() {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'tracker-gate'
  });
  const records = [
    gate.recordTrackerScenario({
      scenarioId: 'input-text-controlled-value-update',
      phaseId: 'initial',
      hostTag: 'input',
      inputType: 'text',
      props: {
        type: 'text',
        value: 'alpha',
        onChange() {}
      },
      target: throwingProxy('input target')
    }),
    gate.recordTrackerScenario({
      scenarioId: 'checkbox-controlled-checked-update',
      phaseId: 'initial',
      hostTag: 'input',
      inputType: 'checkbox',
      props: {
        type: 'checkbox',
        checked: true,
        onChange() {}
      },
      target: throwingProxy('checkbox target')
    }),
    gate.recordTrackerScenario({
      scenarioId: 'select-single-controlled-update',
      phaseId: 'initial',
      hostTag: 'select',
      props: {
        value: 'b',
        onChange() {}
      },
      target: throwingProxy('select target')
    }),
    gate.recordTrackerScenario({
      scenarioId: 'select-multiple-controlled-update',
      phaseId: 'update',
      hostTag: 'select',
      multiple: true,
      props: {
        multiple: true,
        value: ['a'],
        onChange() {}
      },
      target: throwingProxy('select multiple target')
    }),
    gate.recordTrackerScenario({
      scenarioId: 'textarea-controlled-value-update',
      phaseId: 'initial',
      hostTag: 'textarea',
      props: {
        value: 'alpha',
        onChange() {}
      },
      target: throwingProxy('textarea target')
    })
  ];

  return {
    records,
    summary: resourceFormGate.describeControlledInputValueTrackerGate()
  };
}

function createPrivateRootBridgeAdmission() {
  const document = createRootBridgeDocument();
  const container = createRootBridgeElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    requestIdPrefix: 'root-gate-request',
    rootIdPrefix: 'root-gate',
    updateIdPrefix: 'root-gate-update'
  });
  const create = bridge.createClientRoot(container, {
    identifierPrefix: 'resource-form-'
  });
  const render = bridge.renderContainer(create.handle, {
    props: {
      children: 'blocked'
    },
    type: 'span'
  });

  return {
    admission: bridge.admitRequest(render),
    container,
    document
  };
}

function createRootBridgeDocument() {
  const document = {
    nodeName: '#document',
    nodeType: 9,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener) {
      this.__registrations.push({ listener, type });
    }
  };
  document.ownerDocument = document;
  return document;
}

function createRootBridgeElement(nodeName, ownerDocument) {
  return {
    nodeName,
    nodeType: 1,
    ownerDocument,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener) {
      this.__registrations.push({ listener, type });
    }
  };
}

function throwingProxy(label) {
  return new Proxy(Object.create(null), {
    get(_target, property) {
      throw new Error(`Unexpected ${label}.${String(property)} read`);
    },
    getPrototypeOf() {
      throw new Error(`Unexpected ${label} prototype read`);
    },
    has(_target, property) {
      throw new Error(`Unexpected ${label}.${String(property)} presence check`);
    },
    ownKeys() {
      throw new Error(`Unexpected ${label} key enumeration`);
    },
    set(_target, property) {
      throw new Error(`Unexpected ${label}.${String(property)} write`);
    }
  });
}

function oracleValue(oracle, modeId, scenarioId) {
  const observation = oracle.observations[modeId].find(
    (entry) => entry.scenarioId === scenarioId
  );
  assert.ok(observation, `${modeId}:${scenarioId}`);
  assert.equal(observation.result.status, 'ok', `${modeId}:${scenarioId}`);
  return observation.result.value;
}

function requireFresh(fileName) {
  const absolutePath = path.join(packageRoot, fileName);
  delete require.cache[require.resolve(absolutePath)];
  return require(absolutePath);
}

function findDisallowedSourceMatches() {
  const matches = [];
  for (const filePath of listJavaScriptFiles(sourceRoot)) {
    const packageRelativeFile = path
      .relative(packageRoot, filePath)
      .split(path.sep)
      .join('/');
    if (metadataOnlySourceFiles.has(packageRelativeFile)) {
      continue;
    }

    const contents = readFileSync(filePath, 'utf8');
    for (const { id, pattern } of disallowedSourcePatterns) {
      const match = pattern.exec(contents);
      if (match !== null) {
        matches.push({
          file: path.relative(repoRoot, filePath).split(path.sep).join('/'),
          id,
          match: match[0]
        });
      }
    }
  }
  return matches;
}

function formatSourceMatches(matches) {
  if (matches.length === 0) {
    return 'React DOM resource/form/control unsupported source gate passed.';
  }
  return [
    'React DOM resource/form/control unsupported source gate found implementation tokens:',
    ...matches.map(
      (match) =>
        `${match.file}: ${match.id} matched ${JSON.stringify(match.match)}`
    )
  ].join('\n');
}

function listJavaScriptFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry);
    const entryStat = statSync(entryPath);
    if (entryStat.isDirectory()) {
      files.push(...listJavaScriptFiles(entryPath));
    } else if (entryStat.isFile() && entryPath.endsWith('.js')) {
      files.push(entryPath);
    }
  }
  return files;
}

function dataDescriptorFields(descriptor) {
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}
