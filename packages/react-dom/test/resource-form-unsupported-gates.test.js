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
const propertyPayload = require(path.join(
  sourceRoot,
  'dom-host',
  'property-payload.js'
));
const rootBridge = require(path.join(sourceRoot, 'client', 'root-bridge.js'));
const componentTree = require(path.join(
  sourceRoot,
  'client',
  'component-tree.js'
));
const controlledRestoreQueue = require(path.join(
  sourceRoot,
  'client',
  'controlled-restore-queue.js'
));
const eventListener = require(path.join(
  sourceRoot,
  'events',
  'react-dom-event-listener.js'
));

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
      /\b(?:inputValueTracking|trackValueOnNode|updateValueIfChanged|getTracker|_valueTracker|enqueueStateRestore|restoreStateIfNeeded|restoreControlledState|restoreControlledInputState|restoreControlledSelectState|restoreControlledTextareaState|initInput|updateInput|hydrateInput|validateInputProps|initSelect|updateSelect|postUpdateSelect|validateSelectProps|initTextarea|updateTextarea|hydrateTextarea|validateTextareaProps|internalPropsKey|getFiberCurrentPropsFromNode|updateFiberProps|getInstanceFromNode|ChangeEventPlugin|BeforeInputEventPlugin|SelectEventPlugin)\b/u
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

  assert.equal(
    first.summary.gateId,
    resourceFormGate.controlledInputValueTrackerGateId
  );
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

test('private controlled input fake-DOM value-tracker diagnostic installs observes and detaches record state only', () => {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'fake-tracker'
  });
  const fakeInput = createControlledInputFakeDomTarget({
    value: 'alpha'
  });
  const descriptorBefore = Object.getOwnPropertyDescriptor(fakeInput, 'value');
  const install = gate.installFakeDomTracker(
    {
      scenarioId: 'input-text-controlled-value-fake-dom-diagnostic',
      phaseId: 'diagnostic',
      hostTag: 'input',
      inputType: 'text',
      props: {
        type: 'text',
        value: 'alpha',
        onChange() {}
      }
    },
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'fake-input-diagnostic',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: fakeInput
    }
  );

  fakeInput.value = 'beta';
  const observe = gate.observeFakeDomTracker(install);
  const detach = gate.detachFakeDomTracker(observe);
  const records = [install, observe, detach];
  const summary =
    resourceFormGate.describeControlledInputValueTrackerFakeDomDiagnosticGate();

  for (const record of records) {
    assert.equal(Object.isFrozen(record), true, record.operation);
    assert.equal(
      resourceFormGate.isPrivateControlledInputValueTrackerFakeDomDiagnosticRecord(
        record
      ),
      true,
      record.operation
    );
    assert.equal(
      resourceFormGate.getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload(
        record
      ),
      record,
      record.operation
    );
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.trackerRecord.fakeDomOnly, true);
    assert.equal(record.trackerRecord.fakeTargetCaptured, false);
    assert.equal(record.trackerRecord.realDomNodeTouched, false);
    assert.equal(record.trackerRecord.propertyDescriptorInstalled, false);
    assert.equal(record.sideEffects.hostValueRead, false);
    assert.equal(record.sideEffects.hostValueWritten, false);
    assert.equal(record.sideEffects.propertyDescriptorInstalled, false);
    assert.equal(record.sideEffects.changeEventsObserved, false);
    assert.equal(record.sideEffects.postEventRestoreQueued, false);
    assert.equal(record.sideEffects.publicControlledBehaviorEnabled, false);
    assert.equal(record.sideEffects.publicRootTouched, false);
    assert.equal(record.sideEffects.compatibilityClaimed, false);
    assert.equal(record.sideEffects.fakeDomValueWritten, false);
    assert.equal(record.sideEffects.fakeDomDescriptorInstalled, false);
    assert.equal(record.sideEffects.fakeDomTargetCaptured, false);
    assert.equal(record.sideEffects.realDomNodeTouched, false);
    assert.equal(record.trackerMetadata.deterministicFakeDomOnly, true);
    assert.equal(record.trackerMetadata.liveHostNodeRequired, false);
    assert.equal(record.trackerMetadata.rawTargetCaptured, false);
    assert.equal(record.trackerMetadata.realDomNodeTouched, false);
    assert.equal(record.trackerMetadata.propertyDescriptorInstalled, false);
    assert.equal(record.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(
      record.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
  }

  assert.deepEqual(
    records.map((record) => ({
      requestId: record.requestId,
      requestSequence: record.requestSequence,
      lifecycleId: record.lifecycleId,
      operation: record.operation,
      status: record.status,
      attachedBefore: record.trackerRecord.attachedBefore,
      attachedAfter: record.trackerRecord.attachedAfter,
      changed: record.trackerRecord.changed,
      observedCount: record.trackerRecord.observedCount,
      previousValueSnapshot: record.trackerRecord.previousValueSnapshot,
      currentValueSnapshot: record.trackerRecord.currentValueSnapshot,
      fakeDomTrackerRecordInstalled:
        record.sideEffects.fakeDomTrackerRecordInstalled,
      fakeDomTrackerRecordObserved:
        record.sideEffects.fakeDomTrackerRecordObserved,
      fakeDomTrackerRecordDetached:
        record.sideEffects.fakeDomTrackerRecordDetached,
      fakeDomValueRead: record.sideEffects.fakeDomValueRead,
      trackerAttached: record.trackerMetadata.trackerAttached
    })),
    [
      {
        requestId: 'fake-tracker:1',
        requestSequence: 1,
        lifecycleId: 'fake-tracker:1',
        operation: 'install',
        status:
          resourceFormGate.controlledInputValueTrackerFakeDomInstalledStatus,
        attachedBefore: false,
        attachedAfter: true,
        changed: false,
        observedCount: 0,
        previousValueSnapshot: null,
        currentValueSnapshot: 'alpha',
        fakeDomTrackerRecordInstalled: true,
        fakeDomTrackerRecordObserved: false,
        fakeDomTrackerRecordDetached: false,
        fakeDomValueRead: true,
        trackerAttached: true
      },
      {
        requestId: 'fake-tracker:2',
        requestSequence: 2,
        lifecycleId: 'fake-tracker:1',
        operation: 'observe',
        status:
          resourceFormGate.controlledInputValueTrackerFakeDomObservedStatus,
        attachedBefore: true,
        attachedAfter: true,
        changed: true,
        observedCount: 1,
        previousValueSnapshot: 'alpha',
        currentValueSnapshot: 'beta',
        fakeDomTrackerRecordInstalled: false,
        fakeDomTrackerRecordObserved: true,
        fakeDomTrackerRecordDetached: false,
        fakeDomValueRead: true,
        trackerAttached: true
      },
      {
        requestId: 'fake-tracker:3',
        requestSequence: 3,
        lifecycleId: 'fake-tracker:1',
        operation: 'detach',
        status:
          resourceFormGate.controlledInputValueTrackerFakeDomDetachedStatus,
        attachedBefore: true,
        attachedAfter: false,
        changed: false,
        observedCount: 1,
        previousValueSnapshot: 'beta',
        currentValueSnapshot: 'beta',
        fakeDomTrackerRecordInstalled: false,
        fakeDomTrackerRecordObserved: false,
        fakeDomTrackerRecordDetached: true,
        fakeDomValueRead: false,
        trackerAttached: false
      }
    ]
  );

  assert.equal(install.admission.adapterId, 'fake-input-diagnostic');
  assert.equal(install.admission.rawTargetCaptured, false);
  assert.equal(install.admission.propertyDescriptorInstallationAllowed, false);
  assert.equal(observe.admission, null);
  assert.equal(detach.admission, null);
  assert.equal(Object.hasOwn(fakeInput, '_valueTracker'), false);
  assert.equal(descriptorBefore.get, undefined);
  assert.equal(descriptorBefore.set, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, 'value').get,
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, 'value').set,
    undefined
  );
  assert.equal(
    summary.gateId,
    resourceFormGate.controlledInputValueTrackerFakeDomDiagnosticGateId
  );
  assert.equal(
    summary.status,
    resourceFormGate.controlledInputValueTrackerFakeDomDiagnosticStatus
  );
  assert.deepEqual(summary.acceptedOperations, ['install', 'observe', 'detach']);
  assert.equal(summary.deterministicFakeDomOnly, true);
  assert.equal(summary.liveDomDescriptorInstallation, false);
  assert.equal(summary.realDomNodeAccepted, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.controlledInputValueTrackerFakeDomDiagnosticNoSideEffects
  );
  assert.throws(() => gate.observeFakeDomTracker(install), {
    code:
      resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInactiveRecordCode,
    compatibilityTarget
  });
});

test('private controlled input restore queue diagnostic records fake-DOM observation intent only', () => {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'fake-restore'
  });
  const fakeInput = createControlledInputFakeDomTarget({
    value: 'alpha'
  });
  const descriptorBefore = Object.getOwnPropertyDescriptor(fakeInput, 'value');
  const install = gate.installFakeDomTracker(
    {
      scenarioId: 'input-text-controlled-value-update',
      phaseId: 'update',
      hostTag: 'input',
      inputType: 'text',
      props: {
        type: 'text',
        value: 'alpha',
        onChange() {}
      }
    },
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'fake-input-restore-diagnostic',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: fakeInput
    }
  );

  fakeInput.value = 'beta';
  const changedObservation = gate.observeFakeDomTracker(install);
  const changedIntent =
    gate.recordPostEventRestoreIntentFromFakeDomObservation(
      changedObservation,
      {
        explicitAdmission: true,
        queueKind: 'deterministic-fake-dom-post-event-restore-queue',
        queueId: 'fake-input-restore-queue',
        eventName: 'input',
        targetKind: 'controlled-input-restore-queue'
      }
    );
  const unchangedObservation = gate.observeFakeDomTracker(changedObservation);
  const unchangedIntent =
    gate.recordPostEventRestoreIntentFromFakeDomObservation(
      unchangedObservation,
      {
        explicitAdmission: true,
        queueKind: 'deterministic-fake-dom-post-event-restore-queue',
        targetKind: 'controlled-input-restore-queue'
      }
    );
  const detach = gate.detachFakeDomTracker(unchangedObservation);
  const summary =
    resourceFormGate.describeControlledInputPrivateRestoreQueueDiagnosticGate();

  assert.equal(
    propertyPayload.CONTROLLED_RESTORE_QUEUE_FAKE_DOM_DIAGNOSTIC_STATUS,
    resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticStatus
  );
  assert.deepEqual(
    [changedIntent, unchangedIntent].map((record) => ({
      requestId: record.requestId,
      requestSequence: record.requestSequence,
      sourceTrackerRequestId: record.sourceTrackerRequestId,
      sourceTrackerOperation: record.sourceTrackerOperation,
      status: record.status,
      sourceChanged: record.restoreIntent.sourceChanged,
      intentRecorded: record.restoreIntent.intentRecorded,
      restoreTargetWouldBeQueued:
        record.restoreIntent.restoreTargetWouldBeQueued,
      queuePosition: record.restoreIntent.queuePosition,
      latestPropsLookupRequired:
        record.restoreIntent.latestPropsLookupRequired,
      eventPluginDispatchRequired:
        record.restoreIntent.eventPluginDispatchRequired,
      previousValueSnapshot:
        record.trackerObservation.previousValueSnapshot,
      currentValueSnapshot: record.trackerObservation.currentValueSnapshot,
      fakeDomRestoreIntentRecorded:
        record.sideEffects.fakeDomRestoreIntentRecorded,
      fakeDomRestoreIntentSkipped:
        record.sideEffects.fakeDomRestoreIntentSkipped,
      restoreQueueRecordCreated:
        record.sideEffects.restoreQueueRecordCreated
    })),
    [
      {
        requestId: 'fake-restore:3',
        requestSequence: 3,
        sourceTrackerRequestId: 'fake-restore:2',
        sourceTrackerOperation: 'observe',
        status:
          resourceFormGate.controlledInputPrivateRestoreQueueIntentRecordedStatus,
        sourceChanged: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        latestPropsLookupRequired: true,
        eventPluginDispatchRequired: true,
        previousValueSnapshot: 'alpha',
        currentValueSnapshot: 'beta',
        fakeDomRestoreIntentRecorded: true,
        fakeDomRestoreIntentSkipped: false,
        restoreQueueRecordCreated: true
      },
      {
        requestId: 'fake-restore:5',
        requestSequence: 5,
        sourceTrackerRequestId: 'fake-restore:4',
        sourceTrackerOperation: 'observe',
        status:
          resourceFormGate.controlledInputPrivateRestoreQueueIntentSkippedStatus,
        sourceChanged: false,
        intentRecorded: false,
        restoreTargetWouldBeQueued: false,
        queuePosition: null,
        latestPropsLookupRequired: false,
        eventPluginDispatchRequired: false,
        previousValueSnapshot: 'beta',
        currentValueSnapshot: 'beta',
        fakeDomRestoreIntentRecorded: false,
        fakeDomRestoreIntentSkipped: true,
        restoreQueueRecordCreated: true
      }
    ]
  );

  for (const record of [changedIntent, unchangedIntent]) {
    assert.equal(Object.isFrozen(record), true, record.requestId);
    assert.equal(
      resourceFormGate.isPrivateControlledInputRestoreQueueDiagnosticRecord(
        record
      ),
      true,
      record.requestId
    );
    assert.equal(
      resourceFormGate.getPrivateControlledInputRestoreQueueDiagnosticRecordPayload(
        record
      ),
      record,
      record.requestId
    );
    assert.equal(
      record.gateId,
      resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticGateId
    );
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.trackerObservation.fakeDomOnly, true);
    assert.equal(record.trackerObservation.propertyDescriptorInstalled, false);
    assert.equal(record.trackerObservation.rawTargetCaptured, false);
    assert.equal(record.trackerObservation.realDomNodeTouched, false);
    assert.equal(record.restoreIntent.latestPropsLookupPerformed, false);
    assert.equal(record.restoreIntent.eventPluginDispatchPerformed, false);
    assert.equal(record.restoreIntent.restoreQueueWritten, false);
    assert.equal(record.restoreIntent.restoreStateIfNeededInvoked, false);
    assert.equal(record.restoreIntent.restoreControlledStateInvoked, false);
    assert.equal(record.restoreIntent.restoreFlushed, false);
    assert.equal(record.restoreIntent.rawTargetCaptured, false);
    assert.equal(record.restoreIntent.rawEventCaptured, false);
    assert.equal(record.restoreIntent.realDomNodeTouched, false);
    assert.equal(
      record.restoreIntent.publicControlledBehaviorEnabled,
      false
    );
    assert.equal(record.restoreIntent.compatibilityClaimed, false);
    assert.equal(record.postEventRestoreBoundary.latestPropsLookup, false);
    assert.equal(record.postEventRestoreBoundary.eventPluginDispatch, false);
    assert.equal(record.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(record.postEventRestoreBoundary.restoreFlushed, false);
    assert.equal(record.sideEffects.changeEventsObserved, false);
    assert.equal(record.sideEffects.postEventRestoreQueued, false);
    assert.equal(record.sideEffects.restoreQueueWritten, false);
    assert.equal(record.sideEffects.latestPropsLookup, false);
    assert.equal(record.sideEffects.eventPluginDispatch, false);
    assert.equal(record.sideEffects.restoreStateIfNeededInvoked, false);
    assert.equal(record.sideEffects.restoreControlledStateInvoked, false);
    assert.equal(record.sideEffects.restoreFlushed, false);
    assert.equal(record.sideEffects.hostWrapperInvoked, false);
    assert.equal(record.sideEffects.hostValueWritten, false);
    assert.equal(record.sideEffects.propertyDescriptorInstalled, false);
    assert.equal(
      record.sideEffects.publicControlledBehaviorEnabled,
      false
    );
    assert.equal(record.sideEffects.compatibilityClaimed, false);
    assert.equal(
      record.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
  }

  assert.equal(changedIntent.admission.queueId, 'fake-input-restore-queue');
  assert.equal(changedIntent.admission.eventName, 'input');
  assert.equal(changedIntent.admission.rawTargetCaptured, false);
  assert.equal(changedIntent.admission.rawEventCaptured, false);
  assert.equal(changedIntent.admission.restoreQueueWriteAllowed, false);
  assert.equal(Object.hasOwn(fakeInput, '_valueTracker'), false);
  assert.equal(descriptorBefore.get, undefined);
  assert.equal(descriptorBefore.set, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, 'value').get,
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, 'value').set,
    undefined
  );
  assert.equal(detach.status, resourceFormGate.controlledInputValueTrackerFakeDomDetachedStatus);

  assert.equal(
    summary.gateId,
    resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticGateId
  );
  assert.equal(
    summary.status,
    resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticStatus
  );
  assert.equal(
    summary.acceptedSourceRecordType,
    resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticRecordType
  );
  assert.equal(summary.acceptedSourceOperation, 'observe');
  assert.equal(summary.recordsPostEventRestoreIntent, true);
  assert.equal(summary.deterministicFakeDomOnly, true);
  assert.equal(summary.writesRestoreQueue, false);
  assert.equal(summary.flushesRestoreQueue, false);
  assert.equal(summary.latestPropsLookup, false);
  assert.equal(summary.eventPluginDispatch, false);
  assert.equal(summary.liveDomDescriptorInstallation, false);
  assert.equal(summary.realDomNodeAccepted, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticNoSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedControlledInputRestoreQueueDiagnosticError(
      changedIntent
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateControlledInputRestoreQueueDiagnosticGateErrorCode
  );
  assert.equal(error.exportName, 'controlled-restore-queue.input');
  assert.equal(error.requestId, 'fake-restore:3');
  assert.equal(error.sourceTrackerRequestId, 'fake-restore:2');
  assert.equal(error.restoreIntent.intentRecorded, true);
  assert.deepEqual(error.sideEffects, changedIntent.sideEffects);
});

test('private controlled input post-event restore queue gate records event/latest-props intent only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'event-restore'
    });
  const controlled = createControlledInputEventDispatch({
    domEventName: 'input',
    latestProps: {
      type: 'text',
      value: 'alpha',
      onChange() {},
      onInput() {}
    },
    nodeName: 'INPUT',
    value: 'browser-mutated'
  });
  const descriptorBefore = Object.getOwnPropertyDescriptor(
    controlled.targetNode,
    'value'
  );
  const intent =
    gate.recordPostEventRestoreIntentFromEventLatestProps(
      controlled.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: 'event-latest-props-restore-queue',
        eventName: 'input',
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
  const skippedControlled = createControlledInputEventDispatch({
    domEventName: 'click',
    latestProps: {
      type: 'text',
      value: 'alpha',
      onClick() {}
    },
    nodeName: 'INPUT',
    value: 'browser-mutated'
  });
  const skipped = gate.recordPostEventRestoreIntentFromEventLatestProps(
    skippedControlled.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();

  assert.equal(
    propertyPayload.CONTROLLED_POST_EVENT_RESTORE_QUEUE_STATUS,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueStatus
  );
  assert.equal(Object.isFrozen(intent), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueRecord(
      intent
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueRecordPayload(
      intent
    ),
    intent
  );
  assert.deepEqual(
    [intent, skipped].map((record) => ({
      requestId: record.requestId,
      requestSequence: record.requestSequence,
      status: record.status,
      domEventName: record.domEventName,
      hostTag: record.hostTag,
      controlKind: record.controlKind,
      controlledPropName: record.controlledPropName,
      latestPropsEvidenceAccepted:
        record.restoreIntent.latestPropsEvidenceAccepted,
      supportedEventName: record.restoreIntent.supportedEventName,
      intentRecorded: record.restoreIntent.intentRecorded,
      restoreTargetWouldBeQueued:
        record.restoreIntent.restoreTargetWouldBeQueued,
      queuePosition: record.restoreIntent.queuePosition,
      latestPropsLookupPerformed:
        record.restoreIntent.latestPropsLookupPerformed,
      eventDispatchRecordAccepted:
        record.restoreIntent.eventDispatchRecordAccepted,
      eventPluginDispatchPerformed:
        record.restoreIntent.eventPluginDispatchPerformed,
      restoreQueueWritten: record.restoreIntent.restoreQueueWritten,
      controlledStateRestoreInvoked:
        record.restoreIntent.controlledStateRestoreInvoked,
      postEventRestoreIntentRecorded:
        record.sideEffects.postEventRestoreIntentRecorded,
      postEventRestoreIntentSkipped:
        record.sideEffects.postEventRestoreIntentSkipped,
      latestPropsMetadataRead: record.sideEffects.latestPropsMetadataRead
    })),
    [
      {
        requestId: 'event-restore:1',
        requestSequence: 1,
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        domEventName: 'input',
        hostTag: 'input',
        controlKind: 'value',
        controlledPropName: 'value',
        latestPropsEvidenceAccepted: true,
        supportedEventName: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        latestPropsLookupPerformed: true,
        eventDispatchRecordAccepted: true,
        eventPluginDispatchPerformed: false,
        restoreQueueWritten: false,
        controlledStateRestoreInvoked: false,
        postEventRestoreIntentRecorded: true,
        postEventRestoreIntentSkipped: false,
        latestPropsMetadataRead: true
      },
      {
        requestId: 'event-restore:2',
        requestSequence: 2,
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentSkippedStatus,
        domEventName: 'click',
        hostTag: 'input',
        controlKind: 'value',
        controlledPropName: 'value',
        latestPropsEvidenceAccepted: true,
        supportedEventName: false,
        intentRecorded: false,
        restoreTargetWouldBeQueued: false,
        queuePosition: null,
        latestPropsLookupPerformed: true,
        eventDispatchRecordAccepted: true,
        eventPluginDispatchPerformed: false,
        restoreQueueWritten: false,
        controlledStateRestoreInvoked: false,
        postEventRestoreIntentRecorded: false,
        postEventRestoreIntentSkipped: true,
        latestPropsMetadataRead: true
      }
    ]
  );

  assert.equal(
    intent.gateId,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueGateId
  );
  assert.equal(intent.compatibilityTarget, compatibilityTarget);
  assert.equal(intent.unsupportedCode, unsupportedCode);
  assert.equal(
    intent.eventEvidence.sourceRecordKind,
    'FastReactDomEventDispatchRecord'
  );
  assert.equal(intent.eventEvidence.targetResolutionStatus, 'resolved');
  assert.equal(
    intent.eventEvidence.controlledStateRestoreBlockedReason,
    'FAST_REACT_DOM_CONTROLLED_STATE_RESTORE_BLOCKED'
  );
  assert.equal(intent.latestPropsEvidence.latestPropsStatus, 'present');
  assert.equal(intent.latestPropsEvidence.exposesLatestProps, false);
  assert.equal(intent.latestPropsEvidence.rawLatestPropsRetained, false);
  assert.deepEqual(intent.latestPropsEvidence.propKeys, [
    'type',
    'value',
    'onChange',
    'onInput'
  ]);
  assert.deepEqual(intent.latestPropsEvidence.controlledPropSummary.value, {
    present: true,
    value: {type: 'string', empty: false}
  });
  assert.equal(intent.controlledTarget.liveValueTrackerInstalled, false);
  assert.equal(intent.controlledTarget.valueTrackerFieldWritten, false);
  assert.equal(intent.controlledTarget.propertyDescriptorInstalled, false);
  assert.equal(intent.controlledTarget.hostValueRead, false);
  assert.equal(intent.controlledTarget.hostValueWritten, false);
  assert.equal(intent.restoreIntent.rawTargetCaptured, false);
  assert.equal(intent.restoreIntent.rawEventCaptured, false);
  assert.equal(intent.restoreIntent.rawLatestPropsRetained, false);
  assert.equal(intent.postEventRestoreBoundary.latestPropsLookup, true);
  assert.equal(intent.postEventRestoreBoundary.eventPluginDispatch, false);
  assert.equal(intent.postEventRestoreBoundary.restoreQueued, false);
  assert.equal(intent.postEventRestoreBoundary.restoreFlushed, false);
  assert.equal(intent.sideEffects.eventDispatchRecordAccepted, true);
  assert.equal(intent.sideEffects.latestPropsEvidenceAccepted, true);
  assert.equal(intent.sideEffects.restoreQueueRecordCreated, true);
  assert.equal(intent.sideEffects.restoreQueueWritten, false);
  assert.equal(intent.sideEffects.restoreQueueFlushed, false);
  assert.equal(intent.sideEffects.controlledStateRestoreScheduled, false);
  assert.equal(intent.sideEffects.controlledStateRestoreInvoked, false);
  assert.equal(intent.sideEffects.liveValueTrackerInstalled, false);
  assert.equal(intent.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(intent.sideEffects.propertyDescriptorInstalled, false);
  assert.equal(intent.sideEffects.hostValueRead, false);
  assert.equal(intent.sideEffects.hostValueWritten, false);
  assert.equal(intent.sideEffects.browserInputMutated, false);
  assert.equal(intent.sideEffects.rawLatestPropsRetained, false);
  assert.equal(
    intent.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(Object.hasOwn(controlled.targetNode, '_valueTracker'), false);
  assert.equal(descriptorBefore.get, undefined);
  assert.equal(descriptorBefore.set, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(controlled.targetNode, 'value').get,
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(controlled.targetNode, 'value').set,
    undefined
  );

  assert.equal(
    summary.gateId,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueGateId
  );
  assert.equal(
    summary.acceptedSourceRecordType,
    'FastReactDomEventDispatchRecord'
  );
  assert.equal(summary.consumesEventDispatchEvidence, true);
  assert.equal(summary.consumesLatestPropsEvidence, true);
  assert.equal(summary.installsLiveDescriptors, false);
  assert.equal(summary.writesValueTrackerField, false);
  assert.equal(summary.writesRestoreQueue, false);
  assert.equal(summary.flushesRestoreQueue, false);
  assert.equal(summary.publicControlledBehaviorEnabled, false);
  assert.deepEqual(
    summary.sideEffects,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueNoSideEffects
  );

  const error =
    controlledRestoreQueue.createUnsupportedControlledInputPostEventRestoreQueueError(
      intent
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueGateErrorCode
  );
  assert.equal(error.exportName, 'controlled-post-event-restore.input');
  assert.equal(error.requestId, 'event-restore:1');
  assert.equal(error.restoreIntent.intentRecorded, true);
  assert.deepEqual(error.sideEffects, intent.sideEffects);

  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromEventLatestProps(
        {},
        {explicitAdmission: true}
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidEventCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromEventLatestProps(
        controlled.dispatchRecord,
        {
          queueKind:
            'deterministic-event-latest-props-post-event-restore-queue'
        }
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'explicitAdmission must be true'
    }
  );

  componentTree.detachHostInstanceToken(controlled.token);
  componentTree.detachHostInstanceToken(skippedControlled.token);
});

test('private controlled input post-event restore queue gate records select and textarea fake-DOM latest-props intent only', () => {
  const trackerGate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'select-textarea-tracker'
  });
  const restoreGate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'select-textarea-restore'
    });

  const rows = [
    {
      controlKind: 'single',
      eventName: 'change',
      fakeInitial: {value: 'b'},
      fakeNext: {value: 'c'},
      hostTag: 'select',
      latestProps: {
        value: 'c',
        onChange() {}
      },
      nodeName: 'SELECT',
      queueId: 'select-single-fake-dom-latest-props-restore',
      scenarioId: 'select-single-controlled-update'
    },
    {
      controlKind: 'multiple',
      eventName: 'change',
      fakeInitial: {selectedValues: ['b', 'c']},
      fakeNext: {selectedValues: ['a']},
      hostTag: 'select',
      latestProps: {
        multiple: true,
        value: ['a'],
        onChange() {}
      },
      multiple: true,
      nodeName: 'SELECT',
      queueId: 'select-multiple-fake-dom-latest-props-restore',
      scenarioId: 'select-multiple-controlled-update'
    },
    {
      controlKind: 'value',
      eventName: 'input',
      fakeInitial: {value: 'alpha'},
      fakeNext: {value: 'beta'},
      hostTag: 'textarea',
      latestProps: {
        value: 'beta',
        onChange() {},
        onInput() {}
      },
      nodeName: 'TEXTAREA',
      queueId: 'textarea-fake-dom-latest-props-restore',
      scenarioId: 'textarea-controlled-value-update'
    }
  ];

  const records = [];
  const cleanupTokens = [];

  for (const row of rows) {
    const fakeTarget = createControlledInputFakeDomTarget(row.fakeInitial);
    const descriptorBefore = Object.getOwnPropertyDescriptor(
      fakeTarget,
      row.hostTag === 'select' && row.controlKind === 'multiple'
        ? 'selectedValues'
        : 'value'
    );
    const install = trackerGate.installFakeDomTracker(
      {
        scenarioId: row.scenarioId,
        phaseId: 'post-event',
        hostTag: row.hostTag,
        multiple: row.multiple === true,
        controlKind: row.controlKind,
        props: row.latestProps
      },
      {
        explicitAdmission: true,
        adapterKind: 'deterministic-fake-dom',
        adapterId: `${row.scenarioId}-fake-target`,
        targetKind: 'controlled-input-value-tracker',
        fakeTarget
      }
    );
    Object.assign(fakeTarget, row.fakeNext);
    const observation = trackerGate.observeFakeDomTracker(install);
    const latestProps = createControlledLatestPropsLookup({
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      registrationName: row.eventName === 'input' ? 'onInput' : 'onChange'
    });
    cleanupTokens.push(latestProps.token);

    const intent =
      restoreGate.recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
        observation,
        latestProps.lookupRecord,
        {
          explicitAdmission: true,
          queueKind:
            'deterministic-fake-dom-latest-props-post-event-restore-queue',
          queueId: row.queueId,
          eventName: row.eventName,
          targetKind: 'controlled-input-post-event-restore-queue'
        }
      );

    records.push({
      descriptorBefore,
      fakeTarget,
      intent,
      latestProps,
      observation,
      row
    });
  }

  assert.deepEqual(
    records.map(({intent, row}) => ({
      requestId: intent.requestId,
      requestSequence: intent.requestSequence,
      sourceKind: intent.sourceKind,
      status: intent.status,
      domEventName: intent.domEventName,
      hostTag: intent.hostTag,
      multiple: intent.multiple,
      controlKind: intent.controlKind,
      controlledPropName: intent.controlledPropName,
      trackedField: intent.trackedField,
      sourceChanged: intent.restoreIntent.sourceChanged,
      latestPropsEvidenceAccepted:
        intent.restoreIntent.latestPropsEvidenceAccepted,
      latestPropsTargetHostTag:
        intent.restoreIntent.latestPropsTargetHostTag,
      sourceMatchesLatestPropsTarget:
        intent.restoreIntent.sourceMatchesLatestPropsTarget,
      supportedEventName: intent.restoreIntent.supportedEventName,
      intentRecorded: intent.restoreIntent.intentRecorded,
      restoreTargetWouldBeQueued:
        intent.restoreIntent.restoreTargetWouldBeQueued,
      queuePosition: intent.restoreIntent.queuePosition,
      eventDispatchRecordAccepted:
        intent.restoreIntent.eventDispatchRecordAccepted,
      fakeDomTrackerObservationAccepted:
        intent.restoreIntent.fakeDomTrackerObservationAccepted,
      latestPropsLookupPerformed:
        intent.restoreIntent.latestPropsLookupPerformed,
      restoreQueueWritten: intent.restoreIntent.restoreQueueWritten,
      controlledStateRestoreInvoked:
        intent.restoreIntent.controlledStateRestoreInvoked,
      latestPropsMetadataRead: intent.sideEffects.latestPropsMetadataRead,
      fakeDomValueChangeObserved:
        intent.sideEffects.fakeDomValueChangeObserved
    })),
    [
      {
        requestId: 'select-textarea-restore:1',
        requestSequence: 1,
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        domEventName: 'change',
        hostTag: 'select',
        multiple: false,
        controlKind: 'single',
        controlledPropName: 'value',
        trackedField: 'selectedOptions',
        sourceChanged: true,
        latestPropsEvidenceAccepted: true,
        latestPropsTargetHostTag: 'select',
        sourceMatchesLatestPropsTarget: true,
        supportedEventName: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true,
        latestPropsLookupPerformed: true,
        restoreQueueWritten: false,
        controlledStateRestoreInvoked: false,
        latestPropsMetadataRead: true,
        fakeDomValueChangeObserved: true
      },
      {
        requestId: 'select-textarea-restore:2',
        requestSequence: 2,
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        domEventName: 'change',
        hostTag: 'select',
        multiple: true,
        controlKind: 'multiple',
        controlledPropName: 'value',
        trackedField: 'selectedOptions',
        sourceChanged: true,
        latestPropsEvidenceAccepted: true,
        latestPropsTargetHostTag: 'select',
        sourceMatchesLatestPropsTarget: true,
        supportedEventName: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true,
        latestPropsLookupPerformed: true,
        restoreQueueWritten: false,
        controlledStateRestoreInvoked: false,
        latestPropsMetadataRead: true,
        fakeDomValueChangeObserved: true
      },
      {
        requestId: 'select-textarea-restore:3',
        requestSequence: 3,
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        domEventName: 'input',
        hostTag: 'textarea',
        multiple: false,
        controlKind: 'value',
        controlledPropName: 'value',
        trackedField: 'value',
        sourceChanged: true,
        latestPropsEvidenceAccepted: true,
        latestPropsTargetHostTag: 'textarea',
        sourceMatchesLatestPropsTarget: true,
        supportedEventName: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true,
        latestPropsLookupPerformed: true,
        restoreQueueWritten: false,
        controlledStateRestoreInvoked: false,
        latestPropsMetadataRead: true,
        fakeDomValueChangeObserved: true
      }
    ]
  );

  for (const {descriptorBefore, fakeTarget, intent, latestProps, row} of records) {
    assert.equal(Object.isFrozen(intent), true, row.scenarioId);
    assert.equal(
      controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueRecord(
        intent
      ),
      true,
      row.scenarioId
    );
    assert.equal(
      controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueRecordPayload(
        intent
      ),
      intent,
      row.scenarioId
    );
    assert.equal(intent.eventEvidence, null);
    assert.equal(intent.fakeDomObservationEvidence.changed, true);
    assert.equal(intent.latestPropsEvidence.latestPropsStatus, 'present');
    assert.equal(intent.latestPropsEvidence.exposesLatestProps, false);
    assert.equal(intent.latestPropsEvidence.rawLatestPropsRetained, false);
    assert.equal(intent.controlledTarget.liveValueTrackerInstalled, false);
    assert.equal(intent.controlledTarget.valueTrackerFieldWritten, false);
    assert.equal(intent.controlledTarget.propertyDescriptorInstalled, false);
    assert.equal(intent.controlledTarget.hostValueRead, false);
    assert.equal(intent.controlledTarget.hostValueWritten, false);
    assert.equal(intent.restoreIntent.eventPluginDispatchPerformed, false);
    assert.equal(intent.restoreIntent.rawTargetCaptured, false);
    assert.equal(intent.restoreIntent.rawEventCaptured, false);
    assert.equal(intent.restoreIntent.rawLatestPropsRetained, false);
    assert.equal(intent.postEventRestoreBoundary.latestPropsLookup, true);
    assert.equal(intent.postEventRestoreBoundary.eventPluginDispatch, false);
    assert.equal(intent.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(intent.postEventRestoreBoundary.restoreFlushed, false);
    assert.equal(intent.sideEffects.eventDispatchRecordAccepted, false);
    assert.equal(intent.sideEffects.fakeDomTrackerObservationAccepted, true);
    assert.equal(intent.sideEffects.latestPropsEvidenceAccepted, true);
    assert.equal(intent.sideEffects.restoreQueueRecordCreated, true);
    assert.equal(intent.sideEffects.restoreQueueWritten, false);
    assert.equal(intent.sideEffects.restoreQueueFlushed, false);
    assert.equal(intent.sideEffects.controlledStateRestoreScheduled, false);
    assert.equal(intent.sideEffects.controlledStateRestoreInvoked, false);
    assert.equal(intent.sideEffects.hostWrapperInvoked, false);
    assert.equal(intent.sideEffects.hostValueRead, false);
    assert.equal(intent.sideEffects.hostValueWritten, false);
    assert.equal(intent.sideEffects.browserInputMutated, false);
    assert.equal(intent.sideEffects.rawLatestPropsRetained, false);
    assert.equal(
      intent.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
    assert.equal(Object.hasOwn(fakeTarget, '_valueTracker'), false);
    assert.equal(Object.hasOwn(latestProps.targetNode, '_valueTracker'), false);
    assert.equal(descriptorBefore.get, undefined);
    assert.equal(descriptorBefore.set, undefined);
  }

  const skipTarget = createControlledInputFakeDomTarget({value: 'alpha'});
  const skipInstall = trackerGate.installFakeDomTracker(
    {
      scenarioId: 'textarea-default-value-update',
      phaseId: 'post-event',
      hostTag: 'textarea',
      props: {
        defaultValue: 'alpha',
        onChange() {}
      }
    },
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'textarea-uncontrolled-fake-target',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: skipTarget
    }
  );
  skipTarget.value = 'beta';
  const skipObservation = trackerGate.observeFakeDomTracker(skipInstall);
  const skipLatestProps = createControlledLatestPropsLookup({
    latestProps: {
      defaultValue: 'alpha',
      onChange() {}
    },
    nodeName: 'TEXTAREA',
    registrationName: 'onChange'
  });
  cleanupTokens.push(skipLatestProps.token);
  const skipped =
    restoreGate.recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
      skipObservation,
      skipLatestProps.lookupRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-fake-dom-latest-props-post-event-restore-queue',
        queueId: 'textarea-uncontrolled-fake-dom-latest-props-restore',
        eventName: 'input',
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );

  assert.equal(
    skipped.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentSkippedStatus
  );
  assert.equal(skipped.restoreIntent.sourceChanged, true);
  assert.equal(skipped.restoreIntent.controlledPropPresent, false);
  assert.equal(skipped.restoreIntent.intentRecorded, false);
  assert.equal(skipped.restoreIntent.restoreTargetWouldBeQueued, false);
  assert.equal(skipped.restoreIntent.queuePosition, null);
  assert.equal(skipped.sideEffects.postEventRestoreIntentRecorded, false);
  assert.equal(skipped.sideEffects.postEventRestoreIntentSkipped, true);
  assert.equal(skipped.sideEffects.restoreQueueWritten, false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(
    summary.acceptedFakeDomObservationRecordType,
    resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticRecordType
  );
  assert.equal(summary.acceptedFakeDomObservationOperation, 'observe');
  assert.equal(summary.consumesFakeDomTrackerObservation, true);
  assert.equal(summary.consumesLatestPropsEvidence, true);
  assert.equal(summary.consumesEventDispatchEvidence, true);
  assert.equal(summary.writesRestoreQueue, false);
  assert.equal(summary.flushesRestoreQueue, false);

  assert.throws(
    () =>
      restoreGate.recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
        {},
        records[0].latestProps.lookupRecord,
        {explicitAdmission: true}
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidFakeDomObservationCode,
      compatibilityTarget
    }
  );

  for (const token of cleanupTokens) {
    componentTree.detachHostInstanceToken(token);
  }
});

test('private controlled input fake-DOM value-tracker diagnostic rejects live DOM-like or inactive records', () => {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'fake-tracker-error'
  });
  const fakeInput = createControlledInputFakeDomTarget({
    value: 'alpha'
  });

  assert.throws(
    () =>
      gate.installFakeDomTracker(
        {
          hostTag: 'input',
          inputType: 'text'
        },
        {
          explicitAdmission: true,
          adapterKind: 'deterministic-fake-dom',
          targetKind: 'controlled-input-value-tracker',
          fakeTarget: {
            [resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker]:
              true,
            nodeType: 1,
            value: 'live-like'
          }
        }
      ),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'fakeTarget must not be a DOM-like node'
    }
  );

  assert.throws(
    () =>
      gate.installFakeDomTracker(
        {hostTag: 'input', inputType: 'text'},
        {
          explicitAdmission: true,
          adapterKind: 'deterministic-fake-dom',
          targetKind: 'controlled-input-value-tracker',
          fakeTarget: {value: 'missing marker'}
        }
      ),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'fakeTarget must carry the private fake DOM marker'
    }
  );

  assert.throws(() => gate.observeFakeDomTracker({}), {
    code:
      resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInvalidRecordCode,
    compatibilityTarget
  });

  const install = gate.installFakeDomTracker(
    {hostTag: 'input', inputType: 'text'},
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: fakeInput
    }
  );

  assert.throws(
    () =>
      gate.installFakeDomTracker(
        {hostTag: 'input', inputType: 'text'},
        {
          explicitAdmission: true,
          adapterKind: 'deterministic-fake-dom',
          targetKind: 'controlled-input-value-tracker',
          fakeTarget: fakeInput
        }
      ),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'fakeTarget already has an active private fake DOM tracker record'
    }
  );

  const detach = gate.detachFakeDomTracker(install);
  assert.throws(() => gate.detachFakeDomTracker(detach), {
    code:
      resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInactiveRecordCode,
    compatibilityTarget
  });
  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromFakeDomObservation(install, {
        explicitAdmission: true
      }),
    {
      code:
        resourceFormGate.privateControlledInputRestoreQueueDiagnosticInvalidObservationCode,
      compatibilityTarget,
      operation: 'install',
      reason: 'source record must be an observed fake DOM tracker record'
    }
  );
  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromFakeDomObservation({}, {
        explicitAdmission: true
      }),
    {
      code:
        resourceFormGate.privateControlledInputRestoreQueueDiagnosticInvalidRecordCode,
      compatibilityTarget
    }
  );
  const freshInstall = gate.installFakeDomTracker(
    {hostTag: 'input', inputType: 'text'},
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: createControlledInputFakeDomTarget({value: 'fresh'})
    }
  );
  const freshObservation = gate.observeFakeDomTracker(freshInstall);
  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromFakeDomObservation(
        freshObservation,
        {
          queueKind: 'deterministic-fake-dom-post-event-restore-queue'
        }
      ),
    {
      code:
        resourceFormGate.privateControlledInputRestoreQueueDiagnosticInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'explicitAdmission must be true'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedControlledInputRestoreQueueDiagnosticError(
        {}
      ),
    {
      code:
        resourceFormGate.privateControlledInputRestoreQueueDiagnosticInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private controlled input wrapper property-payload gate records blocked rows only', () => {
  const first = createPrivateControlledWrapperPropertyPayloadScenario();
  const second = createPrivateControlledWrapperPropertyPayloadScenario();

  assert.deepEqual(first.records, second.records);
  assert.deepEqual(first.summary, second.summary);

  for (const record of first.records) {
    assert.equal(Object.isFrozen(record), true, record.requestType);
    assert.equal(
      resourceFormGate.isPrivateControlledInputWrapperPropertyPayloadRecord(
        record
      ),
      true,
      record.requestType
    );
    assert.equal(
      resourceFormGate.getPrivateControlledInputWrapperPropertyPayloadRecordPayload(
        record
      ),
      record,
      record.requestType
    );
    assert.equal(record.status, resourceFormGate.unsupportedStatus);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.equal(
      record.gateId,
      resourceFormGate.controlledInputPrivateWrapperGateId
    );
    assert.deepEqual(
      record.sideEffects,
      resourceFormGate.controlledInputPrivateWrapperSideEffects
    );
    assert.equal(record.sideEffects.controlsTracked, false);
    assert.equal(record.sideEffects.trackerAttached, false);
    assert.equal(record.sideEffects.hostValueRead, false);
    assert.equal(record.sideEffects.hostValueWritten, false);
    assert.equal(record.sideEffects.propertyDescriptorInstalled, false);
    assert.equal(record.sideEffects.hostWrapperInvoked, false);
    assert.equal(record.sideEffects.wrapperValidationInvoked, false);
    assert.equal(record.sideEffects.wrapperPropertyWritten, false);
    assert.equal(record.sideEffects.postEventRestoreQueued, false);
    assert.equal(record.sideEffects.latestPropsLookup, false);
    assert.equal(record.wrapperMetadata.deterministicMetadataOnly, true);
    assert.equal(record.wrapperMetadata.propertyPayloadRowAccepted, false);
    assert.equal(record.wrapperMetadata.ordinaryPayloadAccepted, false);
    assert.equal(record.wrapperMetadata.sourceAdapterInvoked, false);
    assert.equal(record.wrapperMetadata.liveHostNodeRequired, false);
    assert.equal(record.wrapperMetadata.rawTargetCaptured, false);
    assert.equal(record.wrapperMetadata.hostWrapperInvoked, false);
    assert.equal(record.wrapperMetadata.wrapperPropertyWritten, false);
    assert.equal(record.wrapperMetadata.trackerAttached, false);
    assert.equal(record.valueTrackerMetadata.trackerAttached, false);
    assert.equal(record.valueTrackerMetadata.currentValueSnapshot, null);
    assert.equal(record.postEventRestoreBoundary.latestPropsLookup, false);
    assert.equal(record.postEventRestoreBoundary.eventPluginDispatch, false);
    assert.equal(record.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(record.postEventRestoreBoundary.restoreFlushed, false);
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
      requestType: record.requestType,
      hostTag: record.hostTag,
      propName: record.propName,
      inputType: record.inputType,
      multiple: record.multiple,
      controlKind: record.controlKind,
      contractId: record.contractId,
      wrapperKind: record.wrapperMetadata.wrapperKind,
      wrapperOperations: record.wrapperMetadata.wrapperOperations,
      valueTrackerContractId:
        record.wrapperMetadata.valueTrackerContractId,
      trackedField: record.wrapperMetadata.trackedField,
      observedPropKeys: record.wrapperMetadata.observedPropKeys,
      propSummary: record.wrapperMetadata.propSummary
    })),
    [
      {
        requestType: 'controlled-wrapper.input.value',
        hostTag: 'input',
        propName: 'value',
        inputType: 'text',
        multiple: false,
        controlKind: 'value',
        contractId: 'input-wrapper-value-payload',
        wrapperKind: 'input-host-wrapper',
        wrapperOperations: ['validateInputProps', 'initInput', 'updateInput'],
        valueTrackerContractId: 'input-value-tracker',
        trackedField: 'value',
        observedPropKeys: ['type', 'value', 'onChange'],
        propSummary: {
          type: {present: true, value: {type: 'string', empty: false}},
          value: {present: true, value: {type: 'string', empty: false}},
          onChange: {present: true, value: {type: 'function'}}
        }
      },
      {
        requestType: 'controlled-wrapper.input.checked',
        hostTag: 'input',
        propName: 'checked',
        inputType: 'checkbox',
        multiple: false,
        controlKind: 'checked',
        contractId: 'input-wrapper-checked-payload',
        wrapperKind: 'input-host-wrapper',
        wrapperOperations: [
          'validateInputProps',
          'initInput',
          'updateInput',
          'restoreControlledInputState'
        ],
        valueTrackerContractId: 'input-checked-tracker',
        trackedField: 'checked',
        observedPropKeys: ['type', 'checked', 'onChange'],
        propSummary: {
          type: {present: true, value: {type: 'string', empty: false}},
          checked: {present: true, value: {type: 'boolean'}},
          onChange: {present: true, value: {type: 'function'}}
        }
      },
      {
        requestType: 'controlled-wrapper.select.multiple',
        hostTag: 'select',
        propName: 'multiple',
        inputType: null,
        multiple: true,
        controlKind: 'multiple',
        contractId: 'select-wrapper-multiple-payload',
        wrapperKind: 'select-host-wrapper',
        wrapperOperations: ['validateSelectProps', 'initSelect', 'updateSelect'],
        valueTrackerContractId: 'select-multiple-value-tracker',
        trackedField: 'selectedOptions',
        observedPropKeys: ['multiple', 'value', 'onChange'],
        propSummary: {
          multiple: {present: true, value: {type: 'boolean'}},
          value: {present: true, value: {type: 'object'}},
          onChange: {present: true, value: {type: 'function'}}
        }
      },
      {
        requestType: 'controlled-wrapper.textarea.value',
        hostTag: 'textarea',
        propName: 'value',
        inputType: null,
        multiple: false,
        controlKind: 'value',
        contractId: 'textarea-wrapper-value-payload',
        wrapperKind: 'textarea-host-wrapper',
        wrapperOperations: [
          'validateTextareaProps',
          'initTextarea',
          'updateTextarea'
        ],
        valueTrackerContractId: 'textarea-value-tracker',
        trackedField: 'value',
        observedPropKeys: ['value', 'onChange'],
        propSummary: {
          value: {present: true, value: {type: 'string', empty: false}},
          onChange: {present: true, value: {type: 'function'}}
        }
      }
    ]
  );

  assert.equal(
    first.summary.gateId,
    resourceFormGate.controlledInputPrivateWrapperGateId
  );
  assert.equal(first.summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(first.summary.contracts.length, 11);
  assert.deepEqual(
    first.summary.contracts.map((contract) => contract.id),
    [
      'input-wrapper-type-payload',
      'input-wrapper-name-payload',
      'input-wrapper-value-payload',
      'input-wrapper-default-value-payload',
      'input-wrapper-checked-payload',
      'input-wrapper-default-checked-payload',
      'select-wrapper-value-payload',
      'select-wrapper-default-value-payload',
      'select-wrapper-multiple-payload',
      'textarea-wrapper-value-payload',
      'textarea-wrapper-default-value-payload'
    ]
  );
  assert.deepEqual(
    first.summary.sideEffects,
    resourceFormGate.controlledInputPrivateWrapperSideEffects
  );
  assert.deepEqual(
    first.summary.postEventRestoreBoundary,
    resourceFormGate.describeControlledInputValueTrackerGate()
      .postEventRestoreBoundary
  );
});

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
      requestId: 'resource-dispatcher-gate:4',
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
      }
    ]
  );
  assert.equal(JSON.stringify(records).includes('/font.woff2'), false);
  assert.equal(JSON.stringify(records).includes('sha256-script'), false);
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
      adapterAdmissionId: 'fake-dom-adapter:4',
      sourceRequestId: 'resource-dispatcher-adapter-source:4',
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
      }
    ]
  );
  assert.equal(JSON.stringify(admissions).includes('/font.woff2'), false);
  assert.equal(JSON.stringify(admissions).includes('sha256-style'), false);
  assert.equal(JSON.stringify(admissions).includes('nonce-script'), false);
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
      'insert-preload'
    ],
    plannedContractIds: [
      'preinit-style',
      'preload',
      'preload',
      'preinit-script',
      'preload'
    ],
    observedNodeNames: ['LINK', 'LINK', 'LINK', 'SCRIPT', 'LINK'],
    resourceMapPlan: {
      uniqueResourceCount: 3,
      preloadResourceCount: 3,
      preinitResourceCount: 2,
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
        relationship: 'preload',
        resourceKey: 'font-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
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
  assert.equal(fakeDom.head.childNodes.length, 5);
  assert.equal(
    JSON.stringify(diagnostic).includes('/style.css'),
    false
  );
  assert.equal(
    JSON.stringify(diagnostic).includes('sha256-style'),
    false
  );
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
    'preinit-style',
    'preinit-script'
  ]);
  assert.equal(summary.mutatesFakeHead, false);
  assert.equal(summary.mutatesRealHead, false);
  assert.equal(summary.recordsDedupeRows, true);
  assert.equal(summary.recordsPrecedenceRows, true);
  assert.equal(summary.recordsHeadOrderRows, true);
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
    () => gate.recordResourceHintDispatcherRequest('M', ['/module.mjs']),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataUnknownRequestCode,
      compatibilityTarget,
      requestName: 'M'
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
  assert.equal(summary.sideEffects.privateDispatcherInvoked, false);
  assert.equal(summary.sideEffects.documentMutated, false);
  assert.equal(summary.sideEffects.headMutated, false);
  assert.equal(summary.sideEffects.stylesheetPrecedenceApplied, false);
  assert.equal(summary.sideEffects.fizzInstructionEmitted, false);
  assert.equal(summary.sideEffects.fakeDomAdapterInvoked, false);
  assert.equal(summary.sideEffects.fakeDocumentRead, false);
  assert.equal(summary.sideEffects.fakeHeadRead, false);
  assert.equal(summary.sideEffects.fakeResourceElementCreated, false);
  assert.equal(summary.sideEffects.fakeResourceElementInserted, false);
  assert.equal(summary.sideEffects.fakeDomInsertionGateInvoked, false);
  assert.equal(
    summary.sideEffects.fakeResourceElementAttributesApplied,
    false
  );
  assert.equal(summary.sideEffects.fakeHeadBoundaryInvoked, false);
  assert.equal(summary.sideEffects.fakeHeadInsertionObserved, false);
  assert.equal(summary.sideEffects.fakeHeadUpdateApplied, false);
  assert.equal(
    summary.sideEffects.fakeHeadClearRetainDiagnosticInvoked,
    false
  );
  assert.equal(summary.sideEffects.fakeHeadChildrenScanned, false);
  assert.equal(summary.sideEffects.fakeHeadChildRemoved, false);
  assert.equal(
    summary.sideEffects.stylesheetPrecedenceBlockedCapabilitiesRecorded,
    false
  );
  assert.equal(
    summary.sideEffects.fakePreloadPreinitOrderDiagnosticInvoked,
    false
  );
  assert.equal(
    summary.sideEffects.fakeHeadInsertionOrderObserved,
    false
  );
  assert.equal(summary.sideEffects.resourceHintDedupeRowsRecorded, false);
  assert.equal(
    summary.sideEffects.resourceHintPrecedenceRowsRecorded,
    false
  );
  assert.equal(
    summary.sideEffects.resourceHintHeadOrderRowsRecorded,
    false
  );
  assert.equal(
    summary.sideEffects.publicPreloadPreinitDedupeBehavior,
    false
  );
  assert.equal(summary.sideEffects.headSingletonResolved, false);
  assert.equal(summary.sideEffects.publicHeadSingletonBehavior, false);
  assert.equal(summary.sideEffects.realDocumentMutated, false);
  assert.equal(summary.sideEffects.publicResourceHintDomInsertion, false);
  assert.deepEqual(
    summary.privateResourceDispatcherBoundary,
    resourceFormGate.describePrivateResourceDispatcherBoundary(null)
  );
  assert.deepEqual(
    summary.privateResourceDispatcherBoundary,
    resourceFormGate.describePrivateResourceHintDispatcherMetadataGate()
  );

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
    resourceHintFakeDomAdapterBoundary: {
      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
      behaviorArea: null,
      metadataGateAvailable: true,
      adapterAdmissionRequired: true,
      adapterRecordsAccepted: true,
      fakeDomOnly: true,
      rawTargetCaptured: false,
      adapterInvoked: false,
      fakeDocumentRead: false,
      fakeHeadRead: false,
      fakeDocumentMutated: false,
      fakeHeadMutated: false,
      resourceElementCreated: false,
      resourceElementInserted: false,
      fakeDomInsertionGateInvoked: false,
      fakeResourceElementAttributesApplied: false,
      fakeHeadBoundaryInvoked: false,
      fakeHeadInsertionObserved: false,
      fakeHeadUpdateApplied: false,
      fakeHeadClearRetainDiagnosticInvoked: false,
      fakeHeadRetainPolicyEvaluated: false,
      fakeHeadChildrenScanned: false,
      fakeHeadClearableChildrenObserved: false,
      fakeHeadRetainedChildrenObserved: false,
      fakeHeadChildRemoved: false,
      fakeHeadChildRetained: false,
      resourceHintClearRetainRowsRecorded: false,
      singletonClearRetainRowsRecorded: false,
      stylesheetPrecedenceBlockedCapabilitiesRecorded: false,
      stylesheetPrecedenceOrderQueried: false,
      stylesheetPrecedenceOrderMutated: false,
      publicStylesheetPrecedenceBehavior: false,
      fakePreloadPreinitOrderDiagnosticInvoked: false,
      fakeHeadInsertionOrderObserved: false,
      fakeHeadInsertionOrderMutated: false,
      resourceHintDedupeRowsRecorded: false,
      resourceHintPrecedenceRowsRecorded: false,
      resourceHintHeadOrderRowsRecorded: false,
      preloadPreinitResourceMapCreated: false,
      preloadPreinitResourceMapMutated: false,
      publicPreloadPreinitDedupeBehavior: false,
      resourceFetchStarted: false,
      realDocumentMutated: false,
      publicResourceHintDomInsertion: false,
      compatibilityClaimed: false,
      adapterGate: resourceFormGate.describePrivateResourceHintFakeDomAdapterGate(),
      insertionGate:
        resourceFormGate.describePrivateResourceHintFakeDomInsertionGate(),
      headBoundaryGate:
        resourceFormGate.describePrivateResourceHintHeadBoundaryGate(),
      headClearRetainGate:
        resourceFormGate.describePrivateResourceHintHeadClearRetainGate(),
      preloadPreinitOrderGate:
        resourceFormGate.describePrivateResourceHintPreloadPreinitOrderGate()
    },
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
      resourceHintAdapterApplies:
        record.sourceAdapterBoundary.resourceHintFakeDomAdapterBoundary !==
        null,
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
        resourceHintAdapterApplies: true,
        trackerBoundaryApplies: false
      },
      {
        behaviorArea: 'form-action',
        requestType: 'form-action.requestFormReset',
        status: resourceFormGate.unsupportedStatus,
        publicRootStatus: resourceFormGate.publicRootFacadeBlockedStatus,
        rootBridgeStatus: resourceFormGate.privateRootBridgeRecordOnlyStatus,
        sourceAdapterStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
        resourceHintAdapterApplies: false,
        trackerBoundaryApplies: false
      },
      {
        behaviorArea: 'controlled-form',
        requestType: 'controlled-form.input',
        status: resourceFormGate.unsupportedStatus,
        publicRootStatus: resourceFormGate.publicRootFacadeBlockedStatus,
        rootBridgeStatus: resourceFormGate.privateRootBridgeRecordOnlyStatus,
        sourceAdapterStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
        resourceHintAdapterApplies: false,
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
    if (blockedRecord.behaviorArea === 'resource-hint') {
      assert.deepEqual(
        blockedRecord.privateResourceDispatcherBoundary,
        resourceFormGate.describePrivateResourceHintDispatcherMetadataGate()
      );
    } else {
      assert.equal(blockedRecord.privateResourceDispatcherBoundary, null);
    }
    assert.equal(blockedRecord.sideEffects.privateDispatcherInvoked, false);
    assert.equal(blockedRecord.sideEffects.documentMutated, false);
    assert.equal(blockedRecord.sideEffects.headMutated, false);
    assert.equal(
      blockedRecord.sideEffects.stylesheetPrecedenceApplied,
      false
    );
    assert.equal(blockedRecord.sideEffects.fizzInstructionEmitted, false);
    assert.equal(blockedRecord.sideEffects.fakeDomAdapterInvoked, false);
    assert.equal(blockedRecord.sideEffects.fakeDocumentRead, false);
    assert.equal(blockedRecord.sideEffects.fakeDocumentMutated, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadRead, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadMutated, false);
    assert.equal(blockedRecord.sideEffects.fakeResourceElementCreated, false);
    assert.equal(blockedRecord.sideEffects.fakeResourceElementInserted, false);
    assert.equal(blockedRecord.sideEffects.fakeDomInsertionGateInvoked, false);
    assert.equal(
      blockedRecord.sideEffects.fakeResourceElementAttributesApplied,
      false
    );
    assert.equal(blockedRecord.sideEffects.fakeHeadBoundaryInvoked, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadInsertionObserved, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadUpdateApplied, false);
    assert.equal(
      blockedRecord.sideEffects.fakeHeadClearRetainDiagnosticInvoked,
      false
    );
    assert.equal(blockedRecord.sideEffects.fakeHeadChildrenScanned, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadChildRemoved, false);
    assert.equal(
      blockedRecord.sideEffects.resourceHintClearRetainRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.singletonClearRetainRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects
        .stylesheetPrecedenceBlockedCapabilitiesRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakePreloadPreinitOrderDiagnosticInvoked,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakeHeadInsertionOrderObserved,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.resourceHintDedupeRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.resourceHintPrecedenceRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.resourceHintHeadOrderRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.publicPreloadPreinitDedupeBehavior,
      false
    );
    assert.equal(blockedRecord.sideEffects.headSingletonResolved, false);
    assert.equal(
      blockedRecord.sideEffects.publicHeadSingletonBehavior,
      false
    );
    assert.equal(blockedRecord.sideEffects.realDocumentMutated, false);
    assert.equal(
      blockedRecord.sideEffects.publicResourceHintDomInsertion,
      false
    );
    assert.equal(blockedRecord.sourceAdapterBoundary.adaptersInvoked, false);
    assert.equal(blockedRecord.sourceAdapterBoundary.rawTargetCaptured, false);
    assert.equal(blockedRecord.sourceAdapterBoundary.publicRootTouched, false);
    assert.equal(
      blockedRecord.sourceAdapterBoundary.compatibilityClaimed,
      false
    );
    if (blockedRecord.behaviorArea === 'resource-hint') {
      const adapterBoundary =
        blockedRecord.sourceAdapterBoundary
          .resourceHintFakeDomAdapterBoundary;
      assert.equal(adapterBoundary.adapterAdmissionRequired, true);
      assert.equal(adapterBoundary.adapterRecordsAccepted, true);
      assert.equal(adapterBoundary.adapterInvoked, false);
      assert.equal(adapterBoundary.fakeDocumentRead, false);
      assert.equal(adapterBoundary.fakeHeadRead, false);
      assert.equal(adapterBoundary.fakeDocumentMutated, false);
      assert.equal(adapterBoundary.fakeHeadMutated, false);
      assert.equal(adapterBoundary.resourceElementCreated, false);
      assert.equal(adapterBoundary.resourceElementInserted, false);
      assert.equal(adapterBoundary.fakeDomInsertionGateInvoked, false);
      assert.equal(
        adapterBoundary.fakeResourceElementAttributesApplied,
        false
      );
      assert.equal(adapterBoundary.fakeHeadBoundaryInvoked, false);
      assert.equal(adapterBoundary.fakeHeadInsertionObserved, false);
      assert.equal(adapterBoundary.fakeHeadUpdateApplied, false);
      assert.equal(
        adapterBoundary.fakeHeadClearRetainDiagnosticInvoked,
        false
      );
      assert.equal(adapterBoundary.fakeHeadChildrenScanned, false);
      assert.equal(adapterBoundary.fakeHeadChildRemoved, false);
      assert.equal(
        adapterBoundary.resourceHintClearRetainRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.singletonClearRetainRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetPrecedenceBlockedCapabilitiesRecorded,
        false
      );
      assert.equal(
        adapterBoundary.fakePreloadPreinitOrderDiagnosticInvoked,
        false
      );
      assert.equal(adapterBoundary.fakeHeadInsertionOrderObserved, false);
      assert.equal(adapterBoundary.resourceHintDedupeRowsRecorded, false);
      assert.equal(
        adapterBoundary.resourceHintPrecedenceRowsRecorded,
        false
      );
      assert.equal(adapterBoundary.resourceHintHeadOrderRowsRecorded, false);
      assert.equal(
        adapterBoundary.publicPreloadPreinitDedupeBehavior,
        false
      );
      assert.equal(adapterBoundary.resourceFetchStarted, false);
      assert.equal(adapterBoundary.realDocumentMutated, false);
      assert.equal(adapterBoundary.publicResourceHintDomInsertion, false);
      assert.deepEqual(
        adapterBoundary.adapterGate,
        resourceFormGate.describePrivateResourceHintFakeDomAdapterGate()
      );
      assert.deepEqual(
        adapterBoundary.insertionGate,
        resourceFormGate.describePrivateResourceHintFakeDomInsertionGate()
      );
      assert.deepEqual(
        adapterBoundary.headBoundaryGate,
        resourceFormGate.describePrivateResourceHintHeadBoundaryGate()
      );
      assert.deepEqual(
        adapterBoundary.headClearRetainGate,
        resourceFormGate.describePrivateResourceHintHeadClearRetainGate()
      );
      assert.deepEqual(
        adapterBoundary.preloadPreinitOrderGate,
        resourceFormGate.describePrivateResourceHintPreloadPreinitOrderGate()
      );
    } else {
      assert.equal(
        blockedRecord.sourceAdapterBoundary.resourceHintFakeDomAdapterBoundary,
        null
      );
    }
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

function createPrivateControlledWrapperPropertyPayloadScenario() {
  const records = [
    resourceFormGate.createControlledInputPrivateWrapperPropertyPayloadRecord({
      hostTag: 'input',
      propName: 'value',
      props: {
        type: 'text',
        value: 'alpha',
        onChange() {}
      },
      target: throwingProxy('input wrapper target')
    }),
    resourceFormGate.createControlledInputPrivateWrapperPropertyPayloadRecord({
      hostTag: 'input',
      propName: 'checked',
      props: {
        type: 'checkbox',
        checked: true,
        onChange() {}
      },
      target: throwingProxy('checkbox wrapper target')
    }),
    resourceFormGate.createControlledInputPrivateWrapperPropertyPayloadRecord({
      hostTag: 'select',
      propName: 'multiple',
      props: {
        multiple: true,
        value: ['a'],
        onChange() {}
      },
      target: throwingProxy('select wrapper target')
    }),
    resourceFormGate.createControlledInputPrivateWrapperPropertyPayloadRecord({
      hostTag: 'textarea',
      propName: 'value',
      props: {
        value: 'alpha',
        onChange() {}
      },
      target: throwingProxy('textarea wrapper target')
    })
  ];

  return {
    records,
    summary:
      resourceFormGate.describeControlledInputPrivateWrapperPropertyPayloadGate()
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
    localName: nodeName.toLowerCase(),
    nodeType: 1,
    ownerDocument,
    parentNode: null,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener) {
      this.__registrations.push({ listener, type });
    }
  };
}

function createControlledInputEventDispatch(options) {
  const document = createRootBridgeDocument();
  const container = createRootBridgeElement('DIV', document);
  const targetNode = createRootBridgeElement(options.nodeName, document);
  targetNode.parentNode = container;
  if (Object.hasOwn(options, 'value')) {
    targetNode.value = options.value;
  }
  const token = componentTree.createHostInstanceToken(
    {kind: 'ControlledEventHost'},
    {kind: 'ControlledEventRoot'}
  );
  componentTree.attachHostInstanceNode(
    targetNode,
    token,
    options.latestProps
  );
  const wrapperRecord =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      options.domEventName,
      0
    );

  return {
    container,
    dispatchRecord: eventListener.dispatchEvent(wrapperRecord, {
      target: targetNode,
      type: options.domEventName
    }),
    document,
    targetNode,
    token
  };
}

function createControlledLatestPropsLookup(options) {
  const document = createRootBridgeDocument();
  const targetNode = createRootBridgeElement(options.nodeName, document);
  const token = componentTree.createHostInstanceToken(
    {kind: 'ControlledLatestPropsHost'},
    {kind: 'ControlledLatestPropsRoot'}
  );
  componentTree.attachHostInstanceNode(
    targetNode,
    token,
    options.latestProps
  );
  const normalizationRecord =
    componentTree.createEventTargetNormalizationRecord(targetNode);
  const lookupRecord = componentTree.createEventListenerTargetLookupRecord(
    normalizationRecord,
    options.registrationName
  );

  return {
    document,
    lookupRecord,
    normalizationRecord,
    targetNode,
    token
  };
}

function createThrowingFakeResourceDocument(log) {
  return {
    get head() {
      log.push('document.head');
      throw new Error('Unexpected fake resource document head read');
    },
    createElement(tagName) {
      log.push(`document.createElement:${tagName}`);
      throw new Error('Unexpected fake resource element creation');
    },
    querySelector(selector) {
      log.push(`document.querySelector:${selector}`);
      throw new Error('Unexpected fake resource document query');
    }
  };
}

function createThrowingFakeResourceHead(log) {
  return {
    appendChild(child) {
      log.push(['head.appendChild', child]);
      throw new Error('Unexpected fake resource head append');
    },
    insertBefore(child, before) {
      log.push(['head.insertBefore', child, before]);
      throw new Error('Unexpected fake resource head insert');
    },
    querySelector(selector) {
      log.push(`head.querySelector:${selector}`);
      throw new Error('Unexpected fake resource head query');
    }
  };
}

function createDeterministicFakeResourceDom() {
  const log = [];
  const document = {
    __fastReactFakeResourceDocument: true,
    nodeName: '#document',
    nodeType: 9,
    createElement(tagName) {
      log.push({tagName, type: 'document.createElement'});
      return createDeterministicFakeResourceElement(tagName, document, log);
    }
  };
  const head = {
    __fastReactFakeResourceHead: true,
    nodeName: 'HEAD',
    nodeType: 1,
    ownerDocument: document,
    childNodes: [],
    appendChild(child) {
      this.childNodes.push(child);
      child.parentNode = this;
      log.push({child: child.nodeName, type: 'head.appendChild'});
      return child;
    }
  };
  document.head = head;

  return {
    document,
    head,
    log
  };
}

function createDeterministicFakeResourceElement(tagName, ownerDocument, log) {
  const nodeName = tagName.toUpperCase();
  return {
    __fastReactFakeResourceElement: true,
    nodeName,
    tagName: nodeName,
    ownerDocument,
    parentNode: null,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      log.push({name, type: 'element.setAttribute', value: String(value)});
    }
  };
}

function appendFakeHeadChild(fakeDom, tagName, attributes = {}) {
  const element = fakeDom.document.createElement(tagName);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  fakeDom.head.appendChild(element);
  return element;
}

function createControlledInputFakeDomTarget(fields) {
  return {
    [resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker]: true,
    ...fields
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

function summarizeDispatcherRecord(record) {
  return {
    requestId: record.requestId,
    requestType: record.requestType,
    contractId: record.contractId,
    publicName: record.publicName,
    privateDispatcherKey: record.privateDispatcherKey,
    argumentNames: record.dispatcherShape.argumentNames,
    argumentSummaries: record.dispatcherShape.arguments.map(
      summarizeDispatcherArgument
    )
  };
}

function summarizeDispatcherArgument(argument) {
  const summary = {
    name: argument.name,
    type: argument.type
  };

  if (Object.hasOwn(argument, 'empty')) {
    summary.empty = argument.empty;
  }
  if (Object.hasOwn(argument, 'exactOwnKeys')) {
    summary.exactOwnKeys = argument.exactOwnKeys;
  }
  if (Object.hasOwn(argument, 'fields')) {
    summary.fields = argument.fields.map(summarizeDispatcherArgument);
  }

  return summary;
}

function summarizeFakeDomAdapterAdmission(admission) {
  return {
    adapterAdmissionId: admission.adapterAdmissionId,
    sourceRequestId: admission.sourceRequestId,
    requestType: admission.requestType,
    contractId: admission.contractId,
    privateDispatcherKey: admission.privateDispatcherKey,
    admissionStatus: admission.admissionStatus,
    executionStatus: admission.executionStatus,
    elementPlan: {
      elementTag: admission.resourceElementPlan.elementTag,
      relationship: admission.resourceElementPlan.relationship,
      attributeNames: admission.resourceElementPlan.attributeNames
    }
  };
}

function summarizeFakeDomInsertion(insertion) {
  return {
    insertionId: insertion.insertionId,
    sourceAdapterAdmissionId: insertion.sourceAdapterAdmissionId,
    sourceRequestId: insertion.sourceRequestId,
    requestType: insertion.requestType,
    contractId: insertion.contractId,
    privateDispatcherKey: insertion.privateDispatcherKey,
    insertionStatus: insertion.insertionStatus,
    executionStatus: insertion.executionStatus,
    elementPlan: {
      elementTag: insertion.resourceElementPlan.elementTag,
      relationship: insertion.resourceElementPlan.relationship,
      insertionMethod: insertion.resourceElementPlan.insertionMethod,
      attributeNames: insertion.resourceElementPlan.attributeNames
    }
  };
}

function summarizeHeadBoundary(boundary) {
  return {
    boundaryId: boundary.boundaryId,
    sourceInsertionId: boundary.sourceInsertionId,
    sourceHeadRequestId: boundary.sourceHeadRequestId,
    requestType: boundary.requestType,
    contractId: boundary.contractId,
    boundaryContractId: boundary.boundaryContractId,
    headContractId: boundary.headContractId,
    hostTag: boundary.hostTag,
    boundaryStatus: boundary.boundaryStatus,
    executionStatus: boundary.executionStatus,
    elementPlan: {
      elementTag: boundary.resourceElementPlan.elementTag,
      relationship: boundary.resourceElementPlan.relationship,
      insertedElementObserved:
        boundary.resourceElementPlan.insertedElementObserved,
      updateApplied: boundary.resourceElementPlan.updateApplied,
      updateAttributeNames:
        boundary.resourceElementPlan.updateAttributeNames
    }
  };
}

function summarizeHeadClearRetain(diagnostic) {
  const singletonRow = diagnostic.singletonRows[0];
  const resourceHintRow = diagnostic.resourceHintRows[0];
  return {
    clearRetainId: diagnostic.clearRetainId,
    sourceBoundaryId: diagnostic.sourceBoundaryId,
    sourceInsertionId: diagnostic.sourceInsertionId,
    sourceHeadRequestId: diagnostic.sourceHeadRequestId,
    requestType: diagnostic.requestType,
    contractId: diagnostic.contractId,
    hostTag: diagnostic.hostTag,
    clearRetainStatus: diagnostic.clearRetainStatus,
    executionStatus: diagnostic.executionStatus,
    singletonRow: {
      rowType: singletonRow.rowType,
      retainedChildCount: singletonRow.retainedChildCount,
      clearableChildCount: singletonRow.clearableChildCount,
      actualHeadChildrenCleared: singletonRow.actualHeadChildrenCleared
    },
    resourceHintRow: {
      rowType: resourceHintRow.rowType,
      childIndex: resourceHintRow.childIndex,
      nodeName: resourceHintRow.nodeName,
      relationship: resourceHintRow.relationship,
      clearRetainDecision: resourceHintRow.clearRetainDecision,
      clearReason: resourceHintRow.clearReason,
      resourceHoistableRetentionBlocked:
        resourceHintRow.resourceHoistableRetentionBlocked
    },
    fakeHeadPlan: {
      childCount: diagnostic.fakeHeadPlan.childCount,
      retainedChildCount: diagnostic.fakeHeadPlan.retainedChildCount,
      clearableChildCount: diagnostic.fakeHeadPlan.clearableChildCount,
      clearApplied: diagnostic.fakeHeadPlan.clearApplied
    }
  };
}

function summarizePreloadPreinitOrder(diagnostic) {
  return {
    orderDiagnosticId: diagnostic.orderDiagnosticId,
    requestType: diagnostic.requestType,
    orderStatus: diagnostic.orderStatus,
    executionStatus: diagnostic.executionStatus,
    dedupeActions: diagnostic.dedupeRows.map((row) => row.dedupeAction),
    plannedContractIds: diagnostic.plannedHeadInsertionOrder.rows.map(
      (row) => row.contractId
    ),
    observedNodeNames: diagnostic.observedHeadOrder.rows.map(
      (row) => row.nodeName
    ),
    resourceMapPlan: {
      uniqueResourceCount: diagnostic.resourceMapPlan.uniqueResourceCount,
      preloadResourceCount: diagnostic.resourceMapPlan.preloadResourceCount,
      preinitResourceCount: diagnostic.resourceMapPlan.preinitResourceCount,
      dedupedRowCount: diagnostic.resourceMapPlan.dedupedRowCount
    }
  };
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
