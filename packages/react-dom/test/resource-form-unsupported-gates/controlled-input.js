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
      restoreQueueWriteOrderRecorded:
        record.restoreIntent.restoreQueueWriteOrderRecorded,
      restoreQueueFlushOrderRecorded:
        record.restoreIntent.restoreQueueFlushOrderRecorded,
      acceptedRestoreKind:
        record.restoreQueueOrdering.acceptedRestoreKind,
      queueSlot: record.restoreQueueOrdering.writeOrder.queueSlot,
      flushWouldBeRequiredAfterWrite:
        record.restoreQueueOrdering.flushOrder.flushWouldBeRequiredAfterWrite,
      hostWrapperOperation:
        record.restoreQueueOrdering.hostWrapperOrder.wrapperOperation,
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
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: 'input-text-value',
        queueSlot: 'primary',
        flushWouldBeRequiredAfterWrite: true,
        hostWrapperOperation: 'input-value-sync',
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
        restoreQueueWriteOrderRecorded: false,
        restoreQueueFlushOrderRecorded: false,
        acceptedRestoreKind: null,
        queueSlot: null,
        flushWouldBeRequiredAfterWrite: false,
        hostWrapperOperation: 'input-value-sync',
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
  assert.equal(
    intent.restoreQueueOrdering.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWriteFlushOrderingStatus
  );
  assert.equal(intent.restoreQueueOrdering.metadataOnly, true);
  assert.equal(intent.restoreQueueOrdering.acceptedRestoreMetadata, true);
  assert.deepEqual(intent.restoreQueueOrdering.writeOrder.writeSequence, [
    'accept-restore-metadata',
    'record-latest-props-evidence',
    'would-store-primary-restore-target',
    'would-defer-controlled-restore-until-batch-exit'
  ]);
  assert.deepEqual(intent.restoreQueueOrdering.flushOrder.flushSequence, [
    'event-batch-exit',
    'pending-restore-check',
    'synchronous-work-flush',
    'snapshot-and-clear-private-queue',
    'restore-primary-target',
    'restore-additional-targets-in-order',
    'host-wrapper-restore-dispatch'
  ]);
  assert.equal(intent.restoreQueueOrdering.actualQueueWritePerformed, false);
  assert.equal(intent.restoreQueueOrdering.actualQueueFlushPerformed, false);
  assert.equal(intent.restoreQueueOrdering.hostWrapperInvoked, false);
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperRan,
    false
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.wrapperWritePerformed,
    false
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.valueTrackerFieldWritten,
    false
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.browserInputMutated,
    false
  );
  assert.equal(intent.postEventRestoreBoundary.latestPropsLookup, true);
  assert.equal(intent.postEventRestoreBoundary.eventPluginDispatch, false);
  assert.equal(
    intent.postEventRestoreBoundary.restoreQueueWriteOrderRecorded,
    true
  );
  assert.equal(
    intent.postEventRestoreBoundary.restoreQueueFlushOrderRecorded,
    true
  );
  assert.equal(
    intent.postEventRestoreBoundary.hostWrapperRestoreOrderRecorded,
    true
  );
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
  assert.equal(summary.recordsRestoreQueueWriteFlushOrdering, true);
  assert.deepEqual(summary.acceptedRestoreMetadataKinds, [
    'input-text-value',
    'input-checkbox-checked',
    'input-radio-checked',
    'select-single-value',
    'select-multiple-value',
    'textarea-value'
  ]);
  assert.equal(summary.restoreQueueOrdering.recordsQueueWriteOrder, true);
  assert.equal(summary.restoreQueueOrdering.recordsQueueFlushOrder, true);
  assert.equal(summary.restoreQueueOrdering.hostWrapperInvocations, false);
  assert.equal(summary.restoreQueueOrdering.valueTrackerWrites, false);
  assert.equal(summary.restoreQueueOrdering.liveDomMutations, false);
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

test('private controlled checkbox and radio restore queue gate records checkable metadata only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'checkable-restore'
    });
  const rows = [
    {
      domEventName: 'click',
      latestProps: {
        type: 'checkbox',
        checked: true,
        name: 'accepted',
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'checkbox-checkable-restore'
    },
    {
      domEventName: 'click',
      latestProps: {
        type: 'radio',
        checked: true,
        name: 'choice',
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'radio-checkable-restore'
    }
  ];
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch(row);
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, intent};
  });

  assert.deepEqual(
    records.map(({intent}) => ({
      status: intent.status,
      inputType: intent.inputType,
      controlKind: intent.controlKind,
      trackedField: intent.trackedField,
      checkableStatus: intent.checkableRestoreMetadata.status,
      radioGroupRestoreRequired:
        intent.checkableRestoreMetadata.radioGroupRestoreRequired,
      radioGroupIntentRecorded:
        intent.checkableRestoreMetadata.radioGroupIntentRecorded,
      groupIntentStatus: intent.groupIntentRecords[0].status,
      groupKind: intent.groupIntentRecords[0].groupKind,
      skipReason: intent.groupIntentRecords[0].skipReason,
      acceptedRestoreKind:
        intent.restoreQueueOrdering.acceptedRestoreKind,
      hostWrapperOperation:
        intent.restoreQueueOrdering.hostWrapperOrder.wrapperOperation,
      primaryHostWrapperWouldRun:
        intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperWouldRun,
      primaryHostWrapperRan:
        intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperRan,
      radioGroupRestoreWouldFollowPrimaryInputRestore:
        intent.restoreQueueOrdering.hostWrapperOrder
          .radioGroupRestoreWouldFollowPrimaryInputRestore,
      radioValueTrackerRefreshWouldFollowSiblingRestore:
        intent.restoreQueueOrdering.hostWrapperOrder
          .radioValueTrackerRefreshWouldFollowSiblingRestore,
      groupLookupRequired:
        intent.groupIntentRecords[0].groupLookupRequired,
      groupLookupPerformed:
        intent.groupIntentRecords[0].groupLookupPerformed,
      siblingLatestPropsLookupPerformed:
        intent.groupIntentRecords[0].siblingLatestPropsLookupPerformed,
      siblingInputRestorePerformed:
        intent.groupIntentRecords[0].siblingInputRestorePerformed,
      valueTrackerRefreshed:
        intent.groupIntentRecords[0].valueTrackerRefreshed,
      radioGroupRestoreIntentRecorded:
        intent.sideEffects.radioGroupRestoreIntentRecorded,
      radioGroupLookupPerformed:
        intent.sideEffects.radioGroupLookupPerformed,
      radioGroupMembersEnumerated:
        intent.sideEffects.radioGroupMembersEnumerated,
      radioGroupValueTrackerRefreshed:
        intent.sideEffects.radioGroupValueTrackerRefreshed
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        inputType: 'checkbox',
        controlKind: 'checked',
        trackedField: 'checked',
        checkableStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
        radioGroupRestoreRequired: false,
        radioGroupIntentRecorded: false,
        groupIntentStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentSkippedStatus,
        groupKind: 'single-checkable',
        skipReason: 'checkboxes-do-not-restore-radio-groups',
        acceptedRestoreKind: 'input-checkbox-checked',
        hostWrapperOperation: 'input-checked-sync',
        primaryHostWrapperWouldRun: true,
        primaryHostWrapperRan: false,
        radioGroupRestoreWouldFollowPrimaryInputRestore: false,
        radioValueTrackerRefreshWouldFollowSiblingRestore: false,
        groupLookupRequired: false,
        groupLookupPerformed: false,
        siblingLatestPropsLookupPerformed: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        radioGroupRestoreIntentRecorded: false,
        radioGroupLookupPerformed: false,
        radioGroupMembersEnumerated: false,
        radioGroupValueTrackerRefreshed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        inputType: 'radio',
        controlKind: 'checked',
        trackedField: 'checked',
        checkableStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
        radioGroupRestoreRequired: true,
        radioGroupIntentRecorded: true,
        groupIntentStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus,
        groupKind: 'radio-group',
        skipReason: null,
        acceptedRestoreKind: 'input-radio-checked',
        hostWrapperOperation: 'input-checked-sync',
        primaryHostWrapperWouldRun: true,
        primaryHostWrapperRan: false,
        radioGroupRestoreWouldFollowPrimaryInputRestore: true,
        radioValueTrackerRefreshWouldFollowSiblingRestore: true,
        groupLookupRequired: true,
        groupLookupPerformed: false,
        siblingLatestPropsLookupPerformed: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        radioGroupRestoreIntentRecorded: true,
        radioGroupLookupPerformed: false,
        radioGroupMembersEnumerated: false,
        radioGroupValueTrackerRefreshed: false
      }
    ]
  );

  for (const {dispatch, intent} of records) {
    assert.equal(intent.restoreIntent.intentRecorded, true);
    assert.equal(intent.checkableRestoreMetadata.primaryInputRestorePerformed, false);
    assert.equal(intent.checkableRestoreMetadata.checkedWritePerformed, false);
    assert.equal(intent.checkableRestoreMetadata.radioGroupLookupPerformed, false);
    assert.equal(intent.checkableRestoreMetadata.radioGroupMembersEnumerated, false);
    assert.equal(intent.checkableRestoreMetadata.radioValueTrackerRefreshed, false);
    assert.equal(intent.groupIntentRecords[0].realDomQueried, false);
    assert.equal(intent.groupIntentRecords[0].hostValueRead, false);
    assert.equal(intent.groupIntentRecords[0].hostValueWritten, false);
    assert.equal(intent.groupIntentRecords[0].browserInputMutated, false);
    assert.equal(intent.groupIntentRecords[0].rawGroupNodesCaptured, false);
    assert.equal(intent.groupIntentRecords[0].rawNameRetained, false);
    assert.equal(intent.groupIntentRecords[0].compatibilityClaimed, false);
    assert.equal(
      intent.restoreQueueOrdering.writeOrder.restoreQueueWritten,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.flushOrder.restoreQueueFlushed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.wrapperWritePerformed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.radioGroupLookupPerformed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.radioValueTrackerRefreshed,
      false
    );
    assert.equal(intent.sideEffects.hostValueRead, false);
    assert.equal(intent.sideEffects.hostValueWritten, false);
    assert.equal(intent.sideEffects.browserInputMutated, false);
    assert.equal(intent.sideEffects.publicControlledBehaviorEnabled, false);
    assert.equal(intent.sideEffects.compatibilityClaimed, false);
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
});

test('private controlled radio sibling-props lookup diagnostics stay metadata-only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'radio-sibling-props'
    });
  const latestProps = {
    type: 'radio',
    name: 'choice',
    checked: true,
    onChange() {},
    onClick() {}
  };
  const dispatch = createControlledInputEventDispatch({
    domEventName: 'click',
    latestProps,
    nodeName: 'INPUT'
  });
  const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    dispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'radio-sibling-props-restore',
      eventName: 'click',
      targetKind: 'controlled-input-post-event-restore-queue',
      radioGroupFormKey: 'form:checkout',
      radioGroupSiblingProps: [
        {
          formKey: 'form:checkout',
          props: {
            type: 'radio',
            name: 'choice',
            checked: false,
            defaultChecked: false,
            value: 'card',
            onChange() {}
          }
        },
        {
          formKey: 'form:other',
          props: {
            type: 'radio',
            name: 'choice',
            checked: false,
            onChange() {}
          }
        },
        {
          formKey: 'form:checkout',
          props: {
            type: 'radio',
            name: 'shipping',
            checked: false,
            onChange() {}
          }
        },
        {
          formKey: 'form:checkout',
          isPrimary: true,
          props: latestProps
        }
      ]
    }
  );
  const lookup = intent.radioGroupSiblingPropsLookup;
  const groupIntent = intent.groupIntentRecords[0];

  assert.equal(Object.isFrozen(lookup), true);
  assert.equal(Object.isFrozen(lookup.records), true);
  for (const record of lookup.records) {
    assert.equal(Object.isFrozen(record), true);
    assert.equal(Object.isFrozen(record.nameProp), true);
    assert.equal(Object.isFrozen(record.controlledPropSummary), true);
  }
  assert.deepEqual(intent.admission.radioGroupSiblingPropsEvidence, {
    provided: true,
    candidateCount: 4,
    primaryFormKeyStatus: {present: true, empty: false},
    deterministicMetadataOnly: true,
    propsRedacted: true,
    rawSiblingPropsRetained: false,
    rawFormRetained: false,
    livePropsLookupAllowed: false,
    formTraversalAllowed: false,
    wrapperExecutionAllowed: false
  });
  assert.equal(
    lookup.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsLookupRecordedStatus
  );
  assert.equal(lookup.groupRestoreRequired, true);
  assert.equal(lookup.groupRestoreIntentRecorded, true);
  assert.equal(lookup.candidateCount, 4);
  assert.equal(lookup.acceptedSameNameSameFormCount, 1);
  assert.equal(lookup.acceptedSiblingPropsEvidenceCount, 1);
  assert.equal(lookup.skippedCandidateCount, 3);
  assert.deepEqual(
    lookup.records.map((record) => ({
      status: record.status,
      targetRole: record.targetRole,
      hostTag: record.hostTag,
      inputType: record.inputType,
      sameName: record.sameName,
      sameForm: record.sameForm,
      sameTarget: record.sameTarget,
      skipReason: record.skipReason,
      siblingWouldReceiveRestore: record.siblingWouldReceiveRestore,
      siblingLatestPropsLookupPerformed:
        record.siblingLatestPropsLookupPerformed,
      livePropsLookupPerformed: record.livePropsLookupPerformed,
      formTraversalPerformed: record.formTraversalPerformed,
      wrapperExecuted: record.wrapperExecuted,
      siblingInputRestorePerformed: record.siblingInputRestorePerformed,
      valueTrackerRefreshed: record.valueTrackerRefreshed,
      realDomQueried: record.realDomQueried,
      rawLatestPropsRetained: record.rawLatestPropsRetained,
      rawFormRetained: record.rawFormRetained,
      rawNameRetained: record.rawNameRetained,
      compatibilityClaimed: record.compatibilityClaimed
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceAcceptedStatus,
        targetRole: 'sibling',
        hostTag: 'input',
        inputType: 'radio',
        sameName: true,
        sameForm: true,
        sameTarget: false,
        skipReason: null,
        siblingWouldReceiveRestore: true,
        siblingLatestPropsLookupPerformed: false,
        livePropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        rawFormRetained: false,
        rawNameRetained: false,
        compatibilityClaimed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus,
        targetRole: 'sibling',
        hostTag: 'input',
        inputType: 'radio',
        sameName: true,
        sameForm: false,
        sameTarget: false,
        skipReason: 'sibling-radio-form-does-not-match',
        siblingWouldReceiveRestore: false,
        siblingLatestPropsLookupPerformed: false,
        livePropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        rawFormRetained: false,
        rawNameRetained: false,
        compatibilityClaimed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus,
        targetRole: 'sibling',
        hostTag: 'input',
        inputType: 'radio',
        sameName: false,
        sameForm: true,
        sameTarget: false,
        skipReason: 'sibling-radio-name-does-not-match',
        siblingWouldReceiveRestore: false,
        siblingLatestPropsLookupPerformed: false,
        livePropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        rawFormRetained: false,
        rawNameRetained: false,
        compatibilityClaimed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus,
        targetRole: 'primary',
        hostTag: 'input',
        inputType: 'radio',
        sameName: true,
        sameForm: true,
        sameTarget: true,
        skipReason: 'primary-radio-is-not-a-sibling',
        siblingWouldReceiveRestore: false,
        siblingLatestPropsLookupPerformed: false,
        livePropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        rawFormRetained: false,
        rawNameRetained: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.equal(groupIntent.siblingPropsLookup, lookup);
  assert.equal(groupIntent.groupLookupPerformed, false);
  assert.equal(groupIntent.siblingLatestPropsLookupPerformed, false);
  assert.equal(groupIntent.siblingInputRestorePerformed, false);
  assert.equal(groupIntent.valueTrackerRefreshed, false);
  assert.equal(intent.sideEffects.radioGroupSiblingMetadataRead, true);
  assert.equal(intent.sideEffects.radioGroupSiblingPropsEvidenceAccepted, true);
  assert.equal(
    intent.sideEffects.radioGroupSiblingPropsSameNameSameFormRecorded,
    true
  );
  assert.equal(intent.sideEffects.radioGroupFormBoundaryMetadataRead, true);
  assert.equal(intent.sideEffects.radioGroupLivePropsLookupPerformed, false);
  assert.equal(intent.sideEffects.radioGroupFormTraversalPerformed, false);
  assert.equal(intent.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(intent.sideEffects.radioGroupMembersEnumerated, false);
  assert.equal(intent.sideEffects.radioGroupValueTrackerRefreshed, false);
  assert.equal(intent.sideEffects.hostWrapperInvoked, false);
  assert.equal(intent.sideEffects.browserInputMutated, false);
  assert.equal(intent.sideEffects.compatibilityClaimed, false);
  assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);

  componentTree.detachHostInstanceToken(dispatch.token);
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
      restoreQueueWriteOrderRecorded:
        intent.restoreIntent.restoreQueueWriteOrderRecorded,
      restoreQueueFlushOrderRecorded:
        intent.restoreIntent.restoreQueueFlushOrderRecorded,
      acceptedRestoreKind:
        intent.restoreQueueOrdering.acceptedRestoreKind,
      queueSlot: intent.restoreQueueOrdering.writeOrder.queueSlot,
      flushWouldBeRequiredAfterWrite:
        intent.restoreQueueOrdering.flushOrder.flushWouldBeRequiredAfterWrite,
      hostWrapperOperation:
        intent.restoreQueueOrdering.hostWrapperOrder.wrapperOperation,
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
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: 'select-single-value',
        queueSlot: 'primary',
        flushWouldBeRequiredAfterWrite: true,
        hostWrapperOperation: 'select-single-options-sync',
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
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: 'select-multiple-value',
        queueSlot: 'primary',
        flushWouldBeRequiredAfterWrite: true,
        hostWrapperOperation: 'select-multiple-options-sync',
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
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: 'textarea-value',
        queueSlot: 'primary',
        flushWouldBeRequiredAfterWrite: true,
        hostWrapperOperation: 'textarea-value-sync',
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
    assert.equal(intent.restoreQueueOrdering.metadataOnly, true);
    assert.equal(
      intent.restoreQueueOrdering.writeOrder.restoreQueueWritten,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.flushOrder.restoreQueueFlushed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperRan,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.wrapperWritePerformed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.hostValueWritten,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.browserInputMutated,
      false
    );
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

test('private controlled checkbox and radio fake-DOM latest-props restore records group intent only', () => {
  const trackerGate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'checkable-fake-tracker'
  });
  const restoreGate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'checkable-fake-restore'
    });
  const rows = [
    {
      eventName: 'click',
      fakeInitial: {checked: false},
      fakeNext: {checked: true},
      inputType: 'checkbox',
      latestProps: {
        type: 'checkbox',
        checked: true,
        onChange() {},
        onClick() {}
      },
      queueId: 'checkbox-fake-latest-props-restore',
      scenarioId: 'checkbox-controlled-checked-update'
    },
    {
      eventName: 'click',
      fakeInitial: {checked: false},
      fakeNext: {checked: true},
      inputType: 'radio',
      latestProps: {
        type: 'radio',
        name: 'choice',
        checked: true,
        onChange() {},
        onClick() {}
      },
      queueId: 'radio-fake-latest-props-restore',
      scenarioId: 'radio-controlled-checked-restore-diagnostic'
    }
  ];
  const cleanupTokens = [];
  const records = rows.map((row) => {
    const fakeTarget = createControlledInputFakeDomTarget(row.fakeInitial);
    const install = trackerGate.installFakeDomTracker(
      {
        scenarioId: row.scenarioId,
        phaseId: 'post-event',
        hostTag: 'input',
        inputType: row.inputType,
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
      nodeName: 'INPUT',
      registrationName: 'onClick'
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

    return {fakeTarget, intent, latestProps, row};
  });

  assert.deepEqual(
    records.map(({intent}) => ({
      sourceKind: intent.sourceKind,
      status: intent.status,
      inputType: intent.inputType,
      controlKind: intent.controlKind,
      sourceChanged: intent.restoreIntent.sourceChanged,
      sourceMatchesLatestPropsTarget:
        intent.restoreIntent.sourceMatchesLatestPropsTarget,
      checkableStatus: intent.checkableRestoreMetadata.status,
      radioGroupRestoreRequired:
        intent.checkableRestoreMetadata.radioGroupRestoreRequired,
      groupIntentStatus: intent.groupIntentRecords[0].status,
      groupKind: intent.groupIntentRecords[0].groupKind,
      skipReason: intent.groupIntentRecords[0].skipReason,
      groupLookupRequired:
        intent.groupIntentRecords[0].groupLookupRequired,
      siblingInputRestorePerformed:
        intent.groupIntentRecords[0].siblingInputRestorePerformed,
      valueTrackerRefreshed:
        intent.groupIntentRecords[0].valueTrackerRefreshed,
      eventDispatchRecordAccepted:
        intent.restoreIntent.eventDispatchRecordAccepted,
      fakeDomTrackerObservationAccepted:
        intent.restoreIntent.fakeDomTrackerObservationAccepted
    })),
    [
      {
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        inputType: 'checkbox',
        controlKind: 'checked',
        sourceChanged: true,
        sourceMatchesLatestPropsTarget: true,
        checkableStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
        radioGroupRestoreRequired: false,
        groupIntentStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentSkippedStatus,
        groupKind: 'single-checkable',
        skipReason: 'checkboxes-do-not-restore-radio-groups',
        groupLookupRequired: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true
      },
      {
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        inputType: 'radio',
        controlKind: 'checked',
        sourceChanged: true,
        sourceMatchesLatestPropsTarget: true,
        checkableStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
        radioGroupRestoreRequired: true,
        groupIntentStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus,
        groupKind: 'radio-group',
        skipReason: null,
        groupLookupRequired: true,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true
      }
    ]
  );

  for (const {fakeTarget, intent, latestProps} of records) {
    assert.equal(intent.eventEvidence, null);
    assert.equal(intent.sideEffects.fakeDomTrackerObservationAccepted, true);
    assert.equal(intent.sideEffects.checkableRestoreMetadataRecorded, true);
    assert.equal(intent.sideEffects.radioGroupLookupPerformed, false);
    assert.equal(intent.sideEffects.radioGroupMembersEnumerated, false);
    assert.equal(intent.sideEffects.radioGroupValueTrackerRefreshed, false);
    assert.equal(intent.sideEffects.hostValueRead, false);
    assert.equal(intent.sideEffects.hostValueWritten, false);
    assert.equal(intent.sideEffects.browserInputMutated, false);
    assert.equal(intent.groupIntentRecords[0].realDomQueried, false);
    assert.equal(intent.groupIntentRecords[0].rawGroupNodesCaptured, false);
    assert.equal(intent.groupIntentRecords[0].rawNameRetained, false);
    assert.equal(Object.hasOwn(fakeTarget, '_valueTracker'), false);
    assert.equal(Object.hasOwn(latestProps.targetNode, '_valueTracker'), false);
  }

  for (const token of cleanupTokens) {
    componentTree.detachHostInstanceToken(token);
  }
});

test('private controlled restore queue write preflight records deterministic write intents only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'write-preflight'
    });
  const rows = [
    {
      domEventName: 'input',
      expectedRestoreKind: 'input-text-value',
      expectedWrapperOperation: 'input-value-sync',
      latestProps: {
        type: 'text',
        value: 'alpha',
        onChange() {},
        onInput() {}
      },
      nodeName: 'INPUT',
      queueId: 'text-write-preflight'
    },
    {
      domEventName: 'click',
      expectedRestoreKind: 'input-checkbox-checked',
      expectedWrapperOperation: 'input-checked-sync',
      latestProps: {
        type: 'checkbox',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'checkbox-write-preflight'
    },
    {
      domEventName: 'click',
      expectedRestoreKind: 'input-radio-checked',
      expectedWrapperOperation: 'input-checked-sync',
      latestProps: {
        type: 'radio',
        name: 'choice',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'radio-write-preflight'
    },
    {
      domEventName: 'change',
      expectedRestoreKind: 'select-single-value',
      expectedWrapperOperation: 'select-single-options-sync',
      latestProps: {
        value: 'b',
        onChange() {}
      },
      nodeName: 'SELECT',
      queueId: 'select-single-write-preflight'
    },
    {
      domEventName: 'change',
      expectedRestoreKind: 'select-multiple-value',
      expectedWrapperOperation: 'select-multiple-options-sync',
      latestProps: {
        multiple: true,
        value: ['a', 'c'],
        onChange() {}
      },
      nodeName: 'SELECT',
      queueId: 'select-multiple-write-preflight'
    },
    {
      domEventName: 'input',
      expectedRestoreKind: 'textarea-value',
      expectedWrapperOperation: 'textarea-value-sync',
      latestProps: {
        value: 'body',
        onChange() {},
        onInput() {}
      },
      nodeName: 'TEXTAREA',
      queueId: 'textarea-write-preflight'
    }
  ];
  const admission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'controlled-write-preflight-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  };
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch({
      domEventName: row.domEventName,
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      value: 'browser-mutated'
    });
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, intent, row};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    admission
  );

  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueWritePreflightRecord(
      preflight
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueWritePreflightRecordPayload(
      preflight
    ),
    preflight
  );
  assert.equal(
    preflight.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueWritePreflightRecordType
  );
  assert.equal(
    preflight.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWritePreflightStatus
  );
  assert.equal(preflight.requestId, 'write-preflight:7');
  assert.equal(preflight.acceptedRecordCount, 6);
  assert.deepEqual(
    preflight.acceptedRestoreKinds,
    rows.map((row) => row.expectedRestoreKind)
  );
  assert.deepEqual(preflight.sourceRequestIds, [
    'write-preflight:1',
    'write-preflight:2',
    'write-preflight:3',
    'write-preflight:4',
    'write-preflight:5',
    'write-preflight:6'
  ]);
  assert.deepEqual(
    preflight.writeIntentRows.map((row) => ({
      rowId: row.rowId,
      rowSequence: row.rowSequence,
      sourceRequestId: row.sourceRequestId,
      sourceQueueId: row.sourceQueueId,
      queueSlot: row.queueSlot,
      queueSlotIndex: row.queueSlotIndex,
      restoreTargetWouldBeSet: row.restoreTargetWouldBeSet,
      restoreQueueWouldBeAppended: row.restoreQueueWouldBeAppended,
      restoreQueueLengthBeforeWrite: row.restoreQueueLengthBeforeWrite,
      restoreQueueLengthAfterWrite: row.restoreQueueLengthAfterWrite,
      acceptedRestoreKind: row.acceptedRestoreKind,
      hostWrapperOperation: row.hostWrapperOperation,
      radioGroupLookupRequired: row.radioGroupLookupRequired,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: 'write-preflight:7:row:1',
        rowSequence: 1,
        sourceRequestId: 'write-preflight:1',
        sourceQueueId: 'text-write-preflight',
        queueSlot: 'restore-target',
        queueSlotIndex: 0,
        restoreTargetWouldBeSet: true,
        restoreQueueWouldBeAppended: false,
        restoreQueueLengthBeforeWrite: 0,
        restoreQueueLengthAfterWrite: 0,
        acceptedRestoreKind: 'input-text-value',
        hostWrapperOperation: 'input-value-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:2',
        rowSequence: 2,
        sourceRequestId: 'write-preflight:2',
        sourceQueueId: 'checkbox-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 0,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 0,
        restoreQueueLengthAfterWrite: 1,
        acceptedRestoreKind: 'input-checkbox-checked',
        hostWrapperOperation: 'input-checked-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:3',
        rowSequence: 3,
        sourceRequestId: 'write-preflight:3',
        sourceQueueId: 'radio-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 1,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 1,
        restoreQueueLengthAfterWrite: 2,
        acceptedRestoreKind: 'input-radio-checked',
        hostWrapperOperation: 'input-checked-sync',
        radioGroupLookupRequired: true,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:4',
        rowSequence: 4,
        sourceRequestId: 'write-preflight:4',
        sourceQueueId: 'select-single-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 2,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 2,
        restoreQueueLengthAfterWrite: 3,
        acceptedRestoreKind: 'select-single-value',
        hostWrapperOperation: 'select-single-options-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:5',
        rowSequence: 5,
        sourceRequestId: 'write-preflight:5',
        sourceQueueId: 'select-multiple-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 3,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 3,
        restoreQueueLengthAfterWrite: 4,
        acceptedRestoreKind: 'select-multiple-value',
        hostWrapperOperation: 'select-multiple-options-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:6',
        rowSequence: 6,
        sourceRequestId: 'write-preflight:6',
        sourceQueueId: 'textarea-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 4,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 4,
        restoreQueueLengthAfterWrite: 5,
        acceptedRestoreKind: 'textarea-value',
        hostWrapperOperation: 'textarea-value-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(preflight.writePlan.writeSequence, [
    'validate-queueable-restore-records',
    'record-restore-target-write-intent',
    'record-additional-restore-queue-write-intents',
    'keep-post-event-controlled-restore-flush-blocked'
  ]);
  assert.equal(preflight.writePlan.flushWouldBeRequiredAfterWrite, true);
  assert.equal(preflight.writePlan.restoreQueueWritten, false);
  assert.equal(preflight.writePlan.restoreQueueFlushed, false);
  assert.equal(preflight.writePlan.hostWrapperInvoked, false);
  assert.equal(preflight.writePlan.radioGroupLookupPerformed, false);
  assert.equal(preflight.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(preflight.postEventRestoreBoundary.restoreQueueFlushed, false);
  assert.equal(preflight.postEventRestoreBoundary.hostWrapperInvoked, false);
  assert.equal(preflight.sideEffects.restoreQueueWritePreflightRecorded, true);
  assert.equal(preflight.sideEffects.restoreQueueWriteIntentRowCount, 6);
  assert.equal(preflight.sideEffects.restoreQueueWritten, false);
  assert.equal(preflight.sideEffects.restoreQueueFlushed, false);
  assert.equal(preflight.sideEffects.hostWrapperInvoked, false);
  assert.equal(preflight.sideEffects.radioGroupLookupRequired, true);
  assert.equal(preflight.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(preflight.sideEffects.radioGroupMembersEnumerated, false);
  assert.equal(preflight.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(preflight.sideEffects.browserInputMutated, false);

  const flushBlocker = gate.recordRestoreQueueFlushBlocker(preflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: 'controlled-flush-blocker-queue',
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  });

  assert.equal(Object.isFrozen(flushBlocker), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueFlushBlockerRecord(
      flushBlocker
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueFlushBlockerRecordPayload(
      flushBlocker
    ),
    flushBlocker
  );
  assert.equal(
    flushBlocker.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueFlushBlockerRecordType
  );
  assert.equal(
    flushBlocker.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueFlushBlockerStatus
  );
  assert.equal(flushBlocker.requestId, 'write-preflight:8');
  assert.equal(flushBlocker.sourcePreflightRequestId, 'write-preflight:7');
  assert.equal(flushBlocker.acceptedRecordCount, 6);
  assert.deepEqual(
    flushBlocker.queueSnapshot.wrapperOperationNames,
    rows.map((row) => row.expectedWrapperOperation)
  );
  assert.deepEqual(
    {
      status: flushBlocker.queueSnapshot.status,
      metadataOnly: flushBlocker.queueSnapshot.metadataOnly,
      snapshotSource: flushBlocker.queueSnapshot.snapshotSource,
      snapshotEntryCount: flushBlocker.queueSnapshot.snapshotEntryCount,
      restoreQueueLength: flushBlocker.queueSnapshot.restoreQueueLength,
      restoreTargetKind:
        flushBlocker.queueSnapshot.restoreTarget.acceptedRestoreKind,
      restoreTargetWrapper:
        flushBlocker.queueSnapshot.restoreTarget.hostWrapperOperation,
      restoreQueueKinds: flushBlocker.queueSnapshot.restoreQueue.map(
        (entry) => entry.acceptedRestoreKind
      ),
      actualRestoreQueueRead:
        flushBlocker.queueSnapshot.actualRestoreQueueRead,
      actualRestoreQueueCleared:
        flushBlocker.queueSnapshot.actualRestoreQueueCleared,
      restoreQueueWritten: flushBlocker.queueSnapshot.restoreQueueWritten,
      restoreQueueFlushed: flushBlocker.queueSnapshot.restoreQueueFlushed,
      hostWrapperInvoked: flushBlocker.queueSnapshot.hostWrapperInvoked,
      radioGroupLookupPerformed:
        flushBlocker.queueSnapshot.radioGroupLookupPerformed,
      browserInputMutated: flushBlocker.queueSnapshot.browserInputMutated
    },
    {
      status: 'blocked-post-event-controlled-restore-queue-snapshot',
      metadataOnly: true,
      snapshotSource: 'accepted-write-preflight-metadata',
      snapshotEntryCount: 6,
      restoreQueueLength: 5,
      restoreTargetKind: 'input-text-value',
      restoreTargetWrapper: 'input-value-sync',
      restoreQueueKinds: [
        'input-checkbox-checked',
        'input-radio-checked',
        'select-single-value',
        'select-multiple-value',
        'textarea-value'
      ],
      actualRestoreQueueRead: false,
      actualRestoreQueueCleared: false,
      restoreQueueWritten: false,
      restoreQueueFlushed: false,
      hostWrapperInvoked: false,
      radioGroupLookupPerformed: false,
      browserInputMutated: false
    }
  );
  assert.deepEqual(
    flushBlocker.intendedFlushOrder.targetFlushOrder.map((entry) => ({
      flushIndex: entry.flushIndex,
      sourceRequestId: entry.sourceRequestId,
      acceptedRestoreKind: entry.acceptedRestoreKind,
      hostWrapperOperation: entry.hostWrapperOperation,
      flushStep: entry.flushStep,
      hostWrapperInvoked: entry.hostWrapperInvoked,
      wrapperWritePerformed: entry.wrapperWritePerformed,
      radioGroupLookupPerformed: entry.radioGroupLookupPerformed,
      browserInputMutated: entry.browserInputMutated
    })),
    [
      {
        flushIndex: 0,
        sourceRequestId: 'write-preflight:1',
        acceptedRestoreKind: 'input-text-value',
        hostWrapperOperation: 'input-value-sync',
        flushStep: 'restore-primary-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 1,
        sourceRequestId: 'write-preflight:2',
        acceptedRestoreKind: 'input-checkbox-checked',
        hostWrapperOperation: 'input-checked-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 2,
        sourceRequestId: 'write-preflight:3',
        acceptedRestoreKind: 'input-radio-checked',
        hostWrapperOperation: 'input-checked-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 3,
        sourceRequestId: 'write-preflight:4',
        acceptedRestoreKind: 'select-single-value',
        hostWrapperOperation: 'select-single-options-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 4,
        sourceRequestId: 'write-preflight:5',
        acceptedRestoreKind: 'select-multiple-value',
        hostWrapperOperation: 'select-multiple-options-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 5,
        sourceRequestId: 'write-preflight:6',
        acceptedRestoreKind: 'textarea-value',
        hostWrapperOperation: 'textarea-value-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(flushBlocker.intendedFlushOrder.flushSequence, [
    'event-batch-exit',
    'pending-restore-check',
    'synchronous-work-flush',
    'snapshot-and-clear-private-queue',
    'restore-primary-target',
    'restore-additional-targets-in-order',
    'host-wrapper-restore-dispatch'
  ]);
  assert.deepEqual(flushBlocker.wrapperRestoreBlocker.blockerReasons, [
    'metadata-only-diagnostic',
    'accepted-write-metadata-did-not-write-live-queue',
    'restore-flush-execution-disabled',
    'host-wrapper-invocation-disabled',
    'live-host-node-not-accepted',
    'public-controlled-behavior-disabled',
    'radio-group-lookup-disabled'
  ]);
  assert.deepEqual(
    flushBlocker.wrapperRestoreBlocker.wrapperRows.map((row) => ({
      sourceRequestId: row.sourceRequestId,
      acceptedRestoreKind: row.acceptedRestoreKind,
      hostWrapperOperation: row.hostWrapperOperation,
      wrapperInvocationBlocked: row.wrapperInvocationBlocked,
      actualWrapperRestoreBlockedReason:
        row.actualWrapperRestoreBlockedReason,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    rows.map((row, index) => ({
      sourceRequestId: `write-preflight:${index + 1}`,
      acceptedRestoreKind: row.expectedRestoreKind,
      hostWrapperOperation: row.expectedWrapperOperation,
      wrapperInvocationBlocked: true,
      actualWrapperRestoreBlockedReason:
        'controlled-restore-flush-execution-remains-blocked',
      hostWrapperInvoked: false,
      wrapperWritePerformed: false,
      radioGroupLookupPerformed: false,
      valueTrackerFieldWritten: false,
      hostValueWritten: false,
      browserInputMutated: false
    }))
  );
  assert.equal(
    flushBlocker.wrapperRestoreBlocker.restoreFlushExecutionAllowed,
    false
  );
  assert.equal(
    flushBlocker.wrapperRestoreBlocker.hostWrapperInvocationAllowed,
    false
  );
  assert.equal(flushBlocker.wrapperRestoreBlocker.radioGroupLookupAllowed, false);
  assert.equal(flushBlocker.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(flushBlocker.postEventRestoreBoundary.restoreQueueFlushed, false);
  assert.equal(flushBlocker.postEventRestoreBoundary.hostWrapperInvoked, false);
  assert.equal(
    flushBlocker.postEventRestoreBoundary.radioGroupLookupPerformed,
    false
  );
  assert.equal(flushBlocker.sideEffects.restoreQueueFlushBlockerRecorded, true);
  assert.equal(flushBlocker.sideEffects.restoreQueueSnapshotRecorded, true);
  assert.equal(
    flushBlocker.sideEffects.restoreQueueIntendedFlushOrderRecorded,
    true
  );
  assert.equal(flushBlocker.sideEffects.restoreQueueWritten, false);
  assert.equal(flushBlocker.sideEffects.restoreQueueFlushed, false);
  assert.equal(flushBlocker.sideEffects.hostWrapperInvoked, false);
  assert.equal(flushBlocker.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(flushBlocker.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(flushBlocker.sideEffects.hostValueWritten, false);
  assert.equal(flushBlocker.sideEffects.browserInputMutated, false);
  assert.equal(
    flushBlocker.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(summary.recordsRestoreQueueWritePreflight, true);
  assert.equal(summary.recordsRestoreQueueFlushBlocker, true);
  assert.equal(
    summary.restoreQueueWritePreflight.recordsWriteIntentRows,
    true
  );
  assert.equal(
    summary.restoreQueueWritePreflight.actualQueueWrites,
    false
  );
  assert.equal(
    summary.restoreQueueWritePreflight.actualQueueFlushes,
    false
  );
  assert.equal(
    summary.restoreQueueWritePreflight.hostWrapperInvocations,
    false
  );
  assert.equal(summary.restoreQueueWritePreflight.radioGroupQueries, false);
  assert.equal(summary.restoreQueueWritePreflight.liveDomMutations, false);
  assert.equal(
    summary.restoreQueueFlushBlocker.recordsQueueSnapshot,
    true
  );
  assert.equal(
    summary.restoreQueueFlushBlocker.recordsIntendedFlushOrder,
    true
  );
  assert.equal(
    summary.restoreQueueFlushBlocker.recordsWrapperOperationNames,
    true
  );
  assert.equal(
    summary.restoreQueueFlushBlocker.recordsWrapperBlockerReasons,
    true
  );
  assert.equal(summary.restoreQueueFlushBlocker.actualQueueFlushes, false);
  assert.equal(summary.restoreQueueFlushBlocker.hostWrapperInvocations, false);
  assert.equal(summary.restoreQueueFlushBlocker.radioGroupQueries, false);
  assert.equal(summary.restoreQueueFlushBlocker.liveDomMutations, false);

  const skippedDispatch = createControlledInputEventDispatch({
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
    skippedDispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'skipped-write-preflight',
      eventName: 'click',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  assert.throws(
    () => gate.preflightRestoreQueueWrites([skipped], admission),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWritePreflightCode,
      compatibilityTarget,
      reason: 'restore-intent-not-recorded',
      sourceRequestId: 'write-preflight:9'
    }
  );

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
  assert.equal(Object.hasOwn(skippedDispatch.targetNode, '_valueTracker'), false);
  componentTree.detachHostInstanceToken(skippedDispatch.token);
});

test('private input/change controlled restore bridge records latest-props links only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'input-change-bridge'
    });
  const bridgeAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-input-change-event-controlled-restore-bridge',
    queueId: 'input-change-controlled-restore-bridge',
    targetKind: 'controlled-input-change-event-restore-queue-bridge'
  };
  const rows = [
    {
      domEventName: 'input',
      latestProps: {
        type: 'text',
        value: 'alpha',
        onChange() {},
        onInput() {}
      },
      nodeName: 'INPUT',
      queueId: 'text-input-change-bridge'
    },
    {
      domEventName: 'click',
      latestProps: {
        type: 'checkbox',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'checkbox-input-change-bridge'
    }
  ];
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch({
      domEventName: row.domEventName,
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      value: 'browser-mutated'
    });
    const inputPreflight =
      createControlledInputChangePreflight(
        dispatch,
        `${row.queueId}-input-change-preflight`
      );
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, inputPreflight, intent, row};
  });
  const writePreflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-queue-write-preflight',
      queueId: 'input-change-bridge-write-preflight',
      targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
    }
  );
  const bridge = gate.recordInputChangeEventControlledRestoreBridge(
    records[1].inputPreflight,
    records[1].intent,
    writePreflight,
    bridgeAdmission
  );

  assert.equal(Object.isFrozen(bridge), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecord(
      bridge
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecordPayload(
      bridge
    ),
    bridge
  );
  assert.equal(
    bridge.$$typeof,
    controlledRestoreQueue
      .privateControlledInputPostEventRestoreQueueInputChangeBridgeRecordType
  );
  assert.equal(
    bridge.status,
    controlledRestoreQueue
      .controlledInputPostEventRestoreQueueInputChangeBridgeStatus
  );
  assert.equal(bridge.requestId, 'input-change-bridge:4');
  assert.equal(
    bridge.sourceInputChangePreflight.sourceRecordKind,
    pluginEventSystem.INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND
  );
  assert.equal(
    bridge.sourceInputChangePreflight.controlledRestoreBridgeEligible,
    true
  );
  assert.equal(
    bridge.sourceRestoreQueueRecord.requestId,
    'input-change-bridge:2'
  );
  assert.equal(
    bridge.sourceWritePreflight.matchedRowId,
    'input-change-bridge:3:row:2'
  );
  assert.deepEqual(bridge.bridgeRows.map((row) => ({
    rowId: row.rowId,
    sourceRestoreRequestId: row.sourceRestoreRequestId,
    sourceWriteIntentRowId: row.sourceWriteIntentRowId,
    domEventName: row.domEventName,
    inputType: row.inputType,
    controlKind: row.controlKind,
    acceptedRestoreKind: row.acceptedRestoreKind,
    queueSlot: row.queueSlot,
    queueSlotIndex: row.queueSlotIndex,
    latestPropsEvidenceLinked: row.latestPropsEvidenceLinked,
    latestPropsEvidenceMatch: row.latestPropsEvidenceMatch,
    restoreWritePreflightFresh: row.restoreWritePreflightFresh,
    eventDispatch: row.eventDispatch,
    syntheticEventCreated: row.syntheticEventCreated,
    valueTrackerFieldWritten: row.valueTrackerFieldWritten,
    restoreQueueWritten: row.restoreQueueWritten,
    restoreQueueFlushed: row.restoreQueueFlushed,
    hostWrapperInvoked: row.hostWrapperInvoked,
    browserInputMutated: row.browserInputMutated
  })), [
    {
      rowId: 'input-change-bridge:4:row:1',
      sourceRestoreRequestId: 'input-change-bridge:2',
      sourceWriteIntentRowId: 'input-change-bridge:3:row:2',
      domEventName: 'click',
      inputType: 'checkbox',
      controlKind: 'checked',
      acceptedRestoreKind: 'input-checkbox-checked',
      queueSlot: 'restore-queue',
      queueSlotIndex: 0,
      latestPropsEvidenceLinked: true,
      latestPropsEvidenceMatch: true,
      restoreWritePreflightFresh: true,
      eventDispatch: false,
      syntheticEventCreated: false,
      valueTrackerFieldWritten: false,
      restoreQueueWritten: false,
      restoreQueueFlushed: false,
      hostWrapperInvoked: false,
      browserInputMutated: false
    }
  ]);
  assert.equal(
    bridge.latestPropsEvidenceBridge.latestPropsEvidenceLinked,
    true
  );
  assert.equal(
    bridge.latestPropsEvidenceBridge.latestPropsEvidenceMatch,
    true
  );
  assert.deepEqual(bridge.latestPropsEvidenceBridge.restorePropKeys, [
    'checked',
    'onChange',
    'onClick',
    'type'
  ]);
  assert.equal(bridge.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(bridge.postEventRestoreBoundary.restoreQueueFlushed, false);
  assert.equal(bridge.sideEffects.inputChangeEventExtractionPreflightAccepted, true);
  assert.equal(bridge.sideEffects.inputChangeControlledRestoreBridgeRecorded, true);
  assert.equal(bridge.sideEffects.inputChangeControlledRestoreBridgeRowsCreated, true);
  assert.equal(bridge.sideEffects.latestPropsEvidenceAccepted, true);
  assert.equal(bridge.sideEffects.restoreQueueWritten, false);
  assert.equal(bridge.sideEffects.restoreQueueFlushed, false);
  assert.equal(bridge.sideEffects.hostWrapperInvoked, false);
  assert.equal(bridge.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(bridge.sideEffects.browserInputMutated, false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(
    summary.recordsInputChangeEventControlledRestoreBridge,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreBridge
      .consumesChangeEventExtractionPreflight,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreBridge
      .consumesControlledRestoreLatestPropsEvidence,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreBridge.restoreQueueWrites,
    false
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreBridge.liveDomMutations,
    false
  );

  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreBridge(
        {},
        records[0].intent,
        writePreflight,
        bridgeAdmission
      ),
    {
      code:
        controlledRestoreQueue
          .controlledInputPostEventRestoreQueueInvalidInputChangeBridgeCode,
      compatibilityTarget,
      reason:
        'expected a private input/change event extraction preflight record'
    }
  );

  const unsupportedDispatch = createControlledInputEventDispatch({
    domEventName: 'change',
    latestProps: {
      type: 'file',
      value: 'ignored',
      onChange() {}
    },
    nodeName: 'INPUT'
  });
  const unsupportedPreflight =
    createControlledInputChangePreflight(
      unsupportedDispatch,
      'unsupported-input-change-bridge-preflight'
    );
  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreBridge(
        unsupportedPreflight,
        records[0].intent,
        writePreflight,
        bridgeAdmission
      ),
    {
      code:
        controlledRestoreQueue
          .controlledInputPostEventRestoreQueueInvalidInputChangeBridgeCode,
      compatibilityTarget,
      reason: 'unsupported-input-change-target-or-event'
    }
  );

  const staleDispatch = createControlledInputEventDispatch({
    domEventName: 'input',
    latestProps: {
      type: 'text',
      value: 'fresh',
      onChange() {},
      onInput() {}
    },
    nodeName: 'INPUT'
  });
  const stalePreflight =
    createControlledInputChangePreflight(
      staleDispatch,
      'stale-input-change-bridge-preflight'
    );
  const staleIntent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    staleDispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'stale-input-change-bridge',
      eventName: 'input',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreBridge(
        stalePreflight,
        staleIntent,
        writePreflight,
        bridgeAdmission
      ),
    {
      code:
        controlledRestoreQueue
          .controlledInputPostEventRestoreQueueInvalidInputChangeBridgeCode,
      compatibilityTarget,
      reason: 'stale-restore-queue-preflight-source-missing'
    }
  );

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
  assert.equal(Object.hasOwn(unsupportedDispatch.targetNode, '_valueTracker'), false);
  assert.equal(Object.hasOwn(staleDispatch.targetNode, '_valueTracker'), false);
  componentTree.detachHostInstanceToken(unsupportedDispatch.token);
  componentTree.detachHostInstanceToken(staleDispatch.token);
});

test('private controlled restore queue write execution records mutation intent only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'write-execution'
    });
  const rows = [
    {
      domEventName: 'input',
      latestProps: {
        type: 'text',
        value: 'alpha',
        onChange() {},
        onInput() {}
      },
      nodeName: 'INPUT',
      queueId: 'text-write-execution'
    },
    {
      domEventName: 'click',
      latestProps: {
        type: 'radio',
        name: 'choice',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'radio-write-execution'
    },
    {
      domEventName: 'input',
      latestProps: {
        value: 'body',
        onChange() {},
        onInput() {}
      },
      nodeName: 'TEXTAREA',
      queueId: 'textarea-write-execution'
    }
  ];
  const preflightAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'controlled-write-execution-preflight-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  };
  const executionAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: 'controlled-write-execution-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  };
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch({
      domEventName: row.domEventName,
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      value: 'browser-mutated'
    });
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, intent};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    preflightAdmission
  );
  const execution = gate.recordRestoreQueueWriteExecution(
    preflight,
    executionAdmission
  );

  assert.equal(Object.isFrozen(execution), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueWriteExecutionRecord(
      execution
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueWriteExecutionRecordPayload(
      execution
    ),
    execution
  );
  assert.equal(
    execution.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueWriteExecutionRecordType
  );
  assert.equal(
    execution.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWriteExecutionStatus
  );
  assert.equal(execution.requestId, 'write-execution:5');
  assert.equal(execution.sourcePreflightRequestId, 'write-execution:4');
  assert.equal(execution.sourceWriteIntentRowCount, 3);
  assert.deepEqual(execution.acceptedRestoreKinds, [
    'input-text-value',
    'input-radio-checked',
    'textarea-value'
  ]);
  assert.deepEqual(
    execution.sourcePreflightRows.map((row) => ({
      rowId: row.rowId,
      sourceRequestId: row.sourceRequestId,
      queueSlot: row.queueSlot,
      queueSlotIndex: row.queueSlotIndex,
      hostTag: row.hostTag,
      controlKind: row.controlKind,
      acceptedRestoreKind: row.acceptedRestoreKind,
      writeWouldRun: row.writeWouldRun,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: 'write-execution:4:row:1',
        sourceRequestId: 'write-execution:1',
        queueSlot: 'restore-target',
        queueSlotIndex: 0,
        hostTag: 'input',
        controlKind: 'value',
        acceptedRestoreKind: 'input-text-value',
        writeWouldRun: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-execution:4:row:2',
        sourceRequestId: 'write-execution:2',
        queueSlot: 'restore-queue',
        queueSlotIndex: 0,
        hostTag: 'input',
        controlKind: 'checked',
        acceptedRestoreKind: 'input-radio-checked',
        writeWouldRun: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-execution:4:row:3',
        sourceRequestId: 'write-execution:3',
        queueSlot: 'restore-queue',
        queueSlotIndex: 1,
        hostTag: 'textarea',
        controlKind: 'value',
        acceptedRestoreKind: 'textarea-value',
        writeWouldRun: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(
    execution.writeExecutionRows.map((row) => ({
      rowId: row.rowId,
      sourcePreflightRowId: row.sourcePreflightRowId,
      sourceRequestId: row.sourceRequestId,
      writeOrder: row.writeOrder,
      queueSlot: row.queueSlot,
      queueMutationKind: row.queueMutationKind,
      restoreTargetWriteOrder: row.restoreTargetWriteOrder,
      restoreQueueWriteOrder: row.restoreQueueWriteOrder,
      restoreTargetMutationRecorded:
        row.restoreTargetMutationRecorded,
      restoreQueueAppendMutationRecorded:
        row.restoreQueueAppendMutationRecorded,
      metadataRestoreTargetWritten: row.metadataRestoreTargetWritten,
      metadataRestoreQueueWritten: row.metadataRestoreQueueWritten,
      hostTag: row.hostTag,
      controlKind: row.controlKind,
      acceptedRestoreKind: row.acceptedRestoreKind,
      radioGroupLookupRequired: row.radioGroupLookupRequired,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      hostValueRead: row.hostValueRead,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: 'write-execution:5:row:1',
        sourcePreflightRowId: 'write-execution:4:row:1',
        sourceRequestId: 'write-execution:1',
        writeOrder: 1,
        queueSlot: 'restore-target',
        queueMutationKind: 'set-restore-target',
        restoreTargetWriteOrder: 1,
        restoreQueueWriteOrder: null,
        restoreTargetMutationRecorded: true,
        restoreQueueAppendMutationRecorded: false,
        metadataRestoreTargetWritten: true,
        metadataRestoreQueueWritten: false,
        hostTag: 'input',
        controlKind: 'value',
        acceptedRestoreKind: 'input-text-value',
        radioGroupLookupRequired: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-execution:5:row:2',
        sourcePreflightRowId: 'write-execution:4:row:2',
        sourceRequestId: 'write-execution:2',
        writeOrder: 2,
        queueSlot: 'restore-queue',
        queueMutationKind: 'append-restore-queue',
        restoreTargetWriteOrder: null,
        restoreQueueWriteOrder: 1,
        restoreTargetMutationRecorded: false,
        restoreQueueAppendMutationRecorded: true,
        metadataRestoreTargetWritten: false,
        metadataRestoreQueueWritten: true,
        hostTag: 'input',
        controlKind: 'checked',
        acceptedRestoreKind: 'input-radio-checked',
        radioGroupLookupRequired: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-execution:5:row:3',
        sourcePreflightRowId: 'write-execution:4:row:3',
        sourceRequestId: 'write-execution:3',
        writeOrder: 3,
        queueSlot: 'restore-queue',
        queueMutationKind: 'append-restore-queue',
        restoreTargetWriteOrder: null,
        restoreQueueWriteOrder: 2,
        restoreTargetMutationRecorded: false,
        restoreQueueAppendMutationRecorded: true,
        metadataRestoreTargetWritten: false,
        metadataRestoreQueueWritten: true,
        hostTag: 'textarea',
        controlKind: 'value',
        acceptedRestoreKind: 'textarea-value',
        radioGroupLookupRequired: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(
    {
      slot: execution.restoreTargetMutation.slot,
      mutationKind: execution.restoreTargetMutation.mutationKind,
      writeOrder: execution.restoreTargetMutation.writeOrder,
      sourceRequestId: execution.restoreTargetMutation.sourceRequestId,
      acceptedRestoreKind:
        execution.restoreTargetMutation.acceptedRestoreKind,
      metadataRestoreTargetWritten:
        execution.restoreTargetMutation.metadataRestoreTargetWritten,
      restoreQueueWritten:
        execution.restoreTargetMutation.restoreQueueWritten,
      hostWrapperInvoked:
        execution.restoreTargetMutation.hostWrapperInvoked
    },
    {
      slot: 'restoreTarget',
      mutationKind: 'set-restore-target',
      writeOrder: 1,
      sourceRequestId: 'write-execution:1',
      acceptedRestoreKind: 'input-text-value',
      metadataRestoreTargetWritten: true,
      restoreQueueWritten: false,
      hostWrapperInvoked: false
    }
  );
  assert.deepEqual(
    execution.restoreQueueMutations.map((row) => ({
      slot: row.slot,
      mutationKind: row.mutationKind,
      writeOrder: row.writeOrder,
      appendOrder: row.appendOrder,
      queueIndex: row.queueIndex,
      sourceRequestId: row.sourceRequestId,
      acceptedRestoreKind: row.acceptedRestoreKind,
      metadataRestoreQueueWritten: row.metadataRestoreQueueWritten,
      restoreQueueWritten: row.restoreQueueWritten,
      hostWrapperInvoked: row.hostWrapperInvoked
    })),
    [
      {
        slot: 'restoreQueue',
        mutationKind: 'append-restore-queue',
        writeOrder: 2,
        appendOrder: 1,
        queueIndex: 0,
        sourceRequestId: 'write-execution:2',
        acceptedRestoreKind: 'input-radio-checked',
        metadataRestoreQueueWritten: true,
        restoreQueueWritten: false,
        hostWrapperInvoked: false
      },
      {
        slot: 'restoreQueue',
        mutationKind: 'append-restore-queue',
        writeOrder: 3,
        appendOrder: 2,
        queueIndex: 1,
        sourceRequestId: 'write-execution:3',
        acceptedRestoreKind: 'textarea-value',
        metadataRestoreQueueWritten: true,
        restoreQueueWritten: false,
        hostWrapperInvoked: false
      }
    ]
  );
  assert.deepEqual(execution.queueMutationPlan.writeSequence, [
    'consume-restore-queue-write-preflight',
    'record-restore-target-mutation-intent',
    'record-restore-queue-append-mutation-intents',
    'keep-post-event-controlled-restore-flush-blocked',
    'keep-host-wrapper-restore-blocked'
  ]);
  assert.equal(execution.queueMutationPlan.restoreTargetWriteRecorded, true);
  assert.equal(execution.queueMutationPlan.restoreQueueAppendRecorded, true);
  assert.equal(execution.queueMutationPlan.restoreQueueAppendCount, 2);
  assert.equal(execution.queueMutationPlan.postEventFlushBlocked, true);
  assert.equal(execution.queueMutationPlan.hostWrapperInvocationBlocked, true);
  assert.equal(execution.queueMutationPlan.restoreQueueWritten, false);
  assert.equal(execution.queueMutationPlan.restoreQueueFlushed, false);
  assert.equal(execution.queueMutationPlan.hostWrapperInvoked, false);
  assert.equal(execution.queueMutationPlan.radioGroupLookupPerformed, false);
  assert.equal(execution.postEventRestoreBoundary.sourcePreflightAccepted, true);
  assert.equal(
    execution.postEventRestoreBoundary.restoreQueueWriteExecutionRecorded,
    true
  );
  assert.equal(execution.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(execution.postEventRestoreBoundary.restoreQueueFlushed, false);
  assert.equal(execution.postEventRestoreBoundary.hostWrapperInvoked, false);
  assert.equal(
    execution.sideEffects.sourceRestoreQueueWritePreflightAccepted,
    true
  );
  assert.equal(execution.sideEffects.restoreQueueWriteExecutionRecorded, true);
  assert.equal(execution.sideEffects.restoreQueueMutationIntentRecorded, true);
  assert.equal(execution.sideEffects.restoreTargetMutationRecorded, true);
  assert.equal(execution.sideEffects.restoreQueueAppendMutationRecorded, true);
  assert.equal(execution.sideEffects.metadataRestoreTargetWritten, true);
  assert.equal(execution.sideEffects.metadataRestoreQueueWritten, true);
  assert.equal(execution.sideEffects.restoreQueueWritten, false);
  assert.equal(execution.sideEffects.restoreQueueFlushed, false);
  assert.equal(execution.sideEffects.hostWrapperInvoked, false);
  assert.equal(execution.sideEffects.radioGroupLookupRequired, true);
  assert.equal(execution.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(execution.sideEffects.hostValueRead, false);
  assert.equal(execution.sideEffects.hostValueWritten, false);
  assert.equal(execution.sideEffects.browserInputMutated, false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(summary.recordsRestoreQueueWriteExecution, true);
  assert.equal(
    summary.restoreQueueWriteExecution.consumesWritePreflightRows,
    true
  );
  assert.equal(
    summary.restoreQueueWriteExecution.recordsRestoreTargetVsRestoreQueueOrder,
    true
  );
  assert.equal(summary.restoreQueueWriteExecution.actualQueueWrites, false);
  assert.equal(summary.restoreQueueWriteExecution.actualQueueFlushes, false);
  assert.equal(
    summary.restoreQueueWriteExecution.hostWrapperInvocations,
    false
  );
  assert.equal(summary.restoreQueueWriteExecution.radioGroupQueries, false);
  assert.equal(summary.restoreQueueWriteExecution.liveDomMutations, false);

  assert.throws(
    () =>
      gate.recordRestoreQueueWriteExecution(
        records[0].intent,
        executionAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWriteExecutionCode,
      compatibilityTarget,
      reason:
        'expected a private controlled restore queue write preflight record'
    }
  );

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
});

test('private controlled restore wrapper mutation intent consumes execution and flush blockers only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'wrapper-intent'
    });
  const rows = [
    {
      domEventName: 'input',
      latestProps: {
        type: 'text',
        value: 'alpha',
        onChange() {},
        onInput() {}
      },
      nodeName: 'INPUT',
      queueId: 'text-wrapper-intent'
    },
    {
      domEventName: 'click',
      latestProps: {
        type: 'radio',
        name: 'choice',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'radio-wrapper-intent'
    },
    {
      domEventName: 'change',
      latestProps: {
        multiple: true,
        value: ['a', 'c'],
        onChange() {}
      },
      nodeName: 'SELECT',
      queueId: 'select-wrapper-intent'
    }
  ];
  const preflightAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'controlled-wrapper-intent-preflight-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  };
  const executionAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: 'controlled-wrapper-intent-execution-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  };
  const flushBlockerAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: 'controlled-wrapper-intent-flush-blocker-queue',
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  };
  const wrapperIntentAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent',
    queueId: 'controlled-wrapper-mutation-intent-queue',
    targetKind: 'controlled-input-post-event-restore-wrapper-mutation-intent'
  };
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch({
      domEventName: row.domEventName,
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      value: 'browser-mutated'
    });
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, intent};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    preflightAdmission
  );
  const execution = gate.recordRestoreQueueWriteExecution(
    preflight,
    executionAdmission
  );
  const flushBlocker = gate.recordRestoreQueueFlushBlocker(
    preflight,
    flushBlockerAdmission
  );
  const wrapperIntent = gate.recordRestoreQueueWrapperMutationIntent(
    execution,
    flushBlocker,
    wrapperIntentAdmission
  );

  assert.equal(Object.isFrozen(wrapperIntent), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecord(
      wrapperIntent
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordPayload(
      wrapperIntent
    ),
    wrapperIntent
  );
  assert.equal(
    wrapperIntent.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordType
  );
  assert.equal(
    wrapperIntent.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWrapperMutationIntentStatus
  );
  assert.equal(wrapperIntent.requestId, 'wrapper-intent:7');
  assert.equal(wrapperIntent.sourceWriteExecutionRequestId, 'wrapper-intent:5');
  assert.equal(wrapperIntent.sourceFlushBlockerRequestId, 'wrapper-intent:6');
  assert.equal(wrapperIntent.sourcePreflightRequestId, 'wrapper-intent:4');
  assert.deepEqual(wrapperIntent.wrapperOperationNames, [
    'input-value-sync',
    'input-checked-sync',
    'select-multiple-options-sync'
  ]);
  assert.deepEqual(
    wrapperIntent.wrapperMutationIntentRows.map((row) => ({
      rowId: row.rowId,
      sourceWriteExecutionRowId: row.sourceWriteExecutionRowId,
      sourceFlushIndex: row.sourceFlushIndex,
      sourceRequestId: row.sourceRequestId,
      acceptedRestoreKind: row.acceptedRestoreKind,
      wrapperOperationName: row.wrapperOperationName,
      wrapperMutationKind: row.wrapperMutationKind,
      hostTag: row.hostTag,
      controlKind: row.controlKind,
      trackedField: row.trackedField,
      controlledPropName: row.controlledPropName,
      intendedUpdateKind: row.intendedUpdateKind,
      valueTargetField: row.intendedValueUpdate?.targetField || null,
      valueKind: row.intendedValueUpdate?.valueKind || null,
      checkedTargetField: row.intendedCheckedUpdate?.targetField || null,
      checkedValueKind: row.intendedCheckedUpdate?.valueKind || null,
      wrapperInvocationBlocked: row.wrapperInvocationBlocked,
      wrapperWriteBlocked: row.wrapperWriteBlocked,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      radioGroupLookupRequired: row.radioGroupLookupRequired,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      hostValueRead: row.hostValueRead,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: 'wrapper-intent:7:row:1',
        sourceWriteExecutionRowId: 'wrapper-intent:5:row:1',
        sourceFlushIndex: 0,
        sourceRequestId: 'wrapper-intent:1',
        acceptedRestoreKind: 'input-text-value',
        wrapperOperationName: 'input-value-sync',
        wrapperMutationKind: 'value-property-sync',
        hostTag: 'input',
        controlKind: 'value',
        trackedField: 'value',
        controlledPropName: 'value',
        intendedUpdateKind: 'value',
        valueTargetField: 'value',
        valueKind: 'string-current-value',
        checkedTargetField: null,
        checkedValueKind: null,
        wrapperInvocationBlocked: true,
        wrapperWriteBlocked: true,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        rowId: 'wrapper-intent:7:row:2',
        sourceWriteExecutionRowId: 'wrapper-intent:5:row:2',
        sourceFlushIndex: 1,
        sourceRequestId: 'wrapper-intent:2',
        acceptedRestoreKind: 'input-radio-checked',
        wrapperOperationName: 'input-checked-sync',
        wrapperMutationKind: 'checked-property-sync',
        hostTag: 'input',
        controlKind: 'checked',
        trackedField: 'checked',
        controlledPropName: 'checked',
        intendedUpdateKind: 'checked',
        valueTargetField: null,
        valueKind: null,
        checkedTargetField: 'checked',
        checkedValueKind: 'boolean-string-current-value',
        wrapperInvocationBlocked: true,
        wrapperWriteBlocked: true,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupRequired: true,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        rowId: 'wrapper-intent:7:row:3',
        sourceWriteExecutionRowId: 'wrapper-intent:5:row:3',
        sourceFlushIndex: 2,
        sourceRequestId: 'wrapper-intent:3',
        acceptedRestoreKind: 'select-multiple-value',
        wrapperOperationName: 'select-multiple-options-sync',
        wrapperMutationKind: 'multiple-option-selection-sync',
        hostTag: 'select',
        controlKind: 'multiple',
        trackedField: 'selectedOptions',
        controlledPropName: 'value',
        intendedUpdateKind: 'value',
        valueTargetField: 'selectedOptions',
        valueKind: 'array-option-values',
        checkedTargetField: null,
        checkedValueKind: null,
        wrapperInvocationBlocked: true,
        wrapperWriteBlocked: true,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(wrapperIntent.wrapperMutationPlan.wrapperSequence, [
    'consume-restore-queue-write-execution',
    'consume-restore-queue-flush-blocker',
    'cross-check-shared-source-preflight',
    'record-wrapper-operation-mutation-intents',
    'keep-wrapper-invocation-blocked',
    'keep-live-wrapper-writes-blocked'
  ]);
  assert.equal(wrapperIntent.wrapperMutationPlan.valueUpdateIntentCount, 2);
  assert.equal(wrapperIntent.wrapperMutationPlan.checkedUpdateIntentCount, 1);
  assert.equal(wrapperIntent.wrapperMutationPlan.restoreQueueFlushed, false);
  assert.equal(wrapperIntent.wrapperMutationPlan.hostWrapperInvoked, false);
  assert.equal(wrapperIntent.wrapperMutationPlan.wrapperWritePerformed, false);
  assert.equal(wrapperIntent.blockedSideEffects.liveDomReadBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.liveDomWriteBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.valueTrackerWriteBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.queueFlushBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.hostWrapperInvoked, false);
  assert.equal(wrapperIntent.blockedSideEffects.hostValueWritten, false);
  assert.equal(wrapperIntent.blockedSideEffects.browserInputMutated, false);
  assert.equal(
    wrapperIntent.postEventRestoreBoundary.sourceRecordsSharePreflight,
    true
  );
  assert.equal(
    wrapperIntent.sideEffects.sourceRestoreQueueWriteExecutionAccepted,
    true
  );
  assert.equal(
    wrapperIntent.sideEffects.sourceRestoreQueueFlushBlockerAccepted,
    true
  );
  assert.equal(
    wrapperIntent.sideEffects.restoreWrapperMutationIntentRecorded,
    true
  );
  assert.equal(wrapperIntent.sideEffects.wrapperMutationIntentRowCount, 3);
  assert.equal(
    wrapperIntent.sideEffects.wrapperIntendedValueUpdateRecorded,
    true
  );
  assert.equal(
    wrapperIntent.sideEffects.wrapperIntendedCheckedUpdateRecorded,
    true
  );
  assert.equal(wrapperIntent.sideEffects.wrapperSideEffectsBlocked, true);
  assert.equal(wrapperIntent.sideEffects.restoreQueueFlushed, false);
  assert.equal(wrapperIntent.sideEffects.hostWrapperInvoked, false);
  assert.equal(wrapperIntent.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(wrapperIntent.sideEffects.hostValueWritten, false);
  assert.equal(wrapperIntent.sideEffects.browserInputMutated, false);
  assert.equal(
    wrapperIntent.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(summary.recordsRestoreWrapperMutationIntent, true);
  assert.equal(
    summary.restoreWrapperMutationIntent.acceptsWriteExecutionMetadata,
    true
  );
  assert.equal(
    summary.restoreWrapperMutationIntent.acceptsFlushBlockerMetadata,
    true
  );
  assert.equal(
    summary.restoreWrapperMutationIntent.recordsIntendedCheckedUpdates,
    true
  );
  assert.equal(
    summary.restoreWrapperMutationIntent.rejectsStaleSourcePairs,
    true
  );
  assert.equal(summary.restoreWrapperMutationIntent.wrapperWrites, false);
  assert.equal(summary.restoreWrapperMutationIntent.hostValueWrites, false);
  assert.equal(summary.restoreWrapperMutationIntent.liveDomMutations, false);

  assert.throws(
    () =>
      gate.recordRestoreQueueWrapperMutationIntent(
        preflight,
        flushBlocker,
        wrapperIntentAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
      compatibilityTarget,
      reason:
        'expected a private controlled restore queue write execution record'
    }
  );
  assert.throws(
    () =>
      gate.recordRestoreQueueWrapperMutationIntent(
        execution,
        execution,
        wrapperIntentAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
      compatibilityTarget,
      reason: 'expected a private controlled restore queue flush blocker record'
    }
  );

  const stale = createWrapperMutationIntentSources('stale-wrapper', rows);
  assert.throws(
    () =>
      stale.gate.recordRestoreQueueWrapperMutationIntent(
        stale.later.execution,
        stale.earlier.flushBlocker,
        wrapperIntentAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
      compatibilityTarget,
      reason: 'stale-flush-blocker-source'
    }
  );
  const foreignASources = createWrapperMutationIntentSources(
    'foreign-wrapper-a',
    rows
  );
  const foreignBSources = createWrapperMutationIntentSources(
    'foreign-wrapper-b',
    rows
  );
  const foreignA = foreignASources.earlier;
  const foreignB = foreignBSources.earlier;
  assert.throws(
    () =>
      foreignA.gate.recordRestoreQueueWrapperMutationIntent(
        foreignA.execution,
        foreignB.flushBlocker,
        wrapperIntentAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
      compatibilityTarget,
      reason: 'foreign-controlled-restore-queue-record'
    }
  );

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
  stale.cleanup();
  foreignASources.cleanup();
  foreignBSources.cleanup();
});

test('private input/change controlled restore execution consumes fake-DOM text path only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'input-change-execution'
    });
  const dispatch = createControlledInputEventDispatch({
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
  const inputPreflight =
    createControlledInputChangePreflight(
      dispatch,
      'input-change-execution-preflight'
    );
  const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    dispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'input-change-execution-restore',
      eventName: 'input',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  const writePreflight = gate.preflightRestoreQueueWrites([intent], {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'input-change-execution-preflight',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  });
  const bridge = gate.recordInputChangeEventControlledRestoreBridge(
    inputPreflight,
    intent,
    writePreflight,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-input-change-event-controlled-restore-bridge',
      queueId: 'input-change-execution-bridge',
      targetKind: 'controlled-input-change-event-restore-queue-bridge'
    }
  );
  const execution = gate.recordRestoreQueueWriteExecution(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: 'input-change-execution-write',
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  });
  const flushBlocker = gate.recordRestoreQueueFlushBlocker(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: 'input-change-execution-flush',
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  });
  const wrapperIntent = gate.recordRestoreQueueWrapperMutationIntent(
    execution,
    flushBlocker,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent',
      queueId: 'input-change-execution-wrapper',
      targetKind: 'controlled-input-post-event-restore-wrapper-mutation-intent'
    }
  );
  const fakeTarget = createControlledInputFakeDomTarget({
    value: 'browser-mutated'
  });
  const restoreExecution =
    gate.recordInputChangeEventControlledRestoreExecution(
      inputPreflight,
      bridge,
      execution,
      flushBlocker,
      wrapperIntent,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-input-change-event-controlled-restore-execution',
        queueId: 'input-change-execution-final',
        targetKind: 'controlled-input-change-event-restore-queue-execution',
        fakeDomTarget: fakeTarget
      }
    );

  assert.equal(
    restoreExecution.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueInputChangeExecutionStatus
  );
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecord(
      restoreExecution
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecordPayload(
      restoreExecution
    ),
    restoreExecution
  );
  assert.equal(fakeTarget.value, 'alpha');
  assert.equal(dispatch.targetNode.value, 'browser-mutated');
  assert.equal(restoreExecution.executionRowCount, 1);
  assert.deepEqual(
    restoreExecution.inputChangeRestoreExecutionRows.map((row) => ({
      acceptedRestoreKind: row.acceptedRestoreKind,
      targetField: row.targetField,
      beforeValueSnapshot: row.beforeValueSnapshot,
      nextValueSnapshot: row.nextValueSnapshot,
      afterValueSnapshot: row.afterValueSnapshot,
      fakeDomTargetAccepted: row.fakeDomTargetAccepted,
      latestPropsEvidenceMatch: row.latestPropsEvidenceMatch,
      restoreQueueWriteExecutionAccepted:
        row.restoreQueueWriteExecutionAccepted,
      flushIntentAccepted: row.flushIntentAccepted,
      wrapperMutationExecutionRecorded:
        row.wrapperMutationExecutionRecorded,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      fakeDomInputMutated: row.fakeDomInputMutated,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        acceptedRestoreKind: 'input-text-value',
        targetField: 'value',
        beforeValueSnapshot: 'browser-mutated',
        nextValueSnapshot: 'alpha',
        afterValueSnapshot: 'alpha',
        fakeDomTargetAccepted: true,
        latestPropsEvidenceMatch: true,
        restoreQueueWriteExecutionAccepted: true,
        flushIntentAccepted: true,
        wrapperMutationExecutionRecorded: true,
        restoreQueueWritten: true,
        restoreQueueFlushed: true,
        hostWrapperInvoked: true,
        wrapperWritePerformed: true,
        fakeDomInputMutated: true,
        browserInputMutated: false
      }
    ]
  );
  assert.equal(
    restoreExecution.latestPropsValidation.staleLatestPropsRejected,
    true
  );
  assert.equal(
    restoreExecution.latestPropsValidation.latestPropsValidationAccepted,
    true
  );
  assert.equal(
    restoreExecution.latestPropsValidation.currentLatestPropsFresh,
    true
  );
  assert.equal(
    restoreExecution.wrapperMutationExecutionEvidence
      .wrapperMutationExecutionRecorded,
    true
  );
  assert.equal(
    restoreExecution.wrapperMutationExecutionEvidence.wrapperWritePerformed,
    true
  );
  assert.equal(restoreExecution.postEventRestoreBoundary.fakeDomOnly, true);
  assert.equal(
    restoreExecution.postEventRestoreBoundary.restoreQueueWritten,
    true
  );
  assert.equal(
    restoreExecution.postEventRestoreBoundary.restoreQueueFlushed,
    true
  );
  assert.equal(restoreExecution.sideEffects.restoreQueueWritten, false);
  assert.equal(restoreExecution.sideEffects.restoreQueueFlushed, false);
  assert.equal(restoreExecution.sideEffects.privateRestoreQueueWritten, true);
  assert.equal(restoreExecution.sideEffects.privateRestoreQueueFlushed, true);
  assert.equal(restoreExecution.sideEffects.hostWrapperInvoked, true);
  assert.equal(restoreExecution.sideEffects.fakeDomInputMutated, true);
  assert.equal(restoreExecution.sideEffects.browserInputMutated, false);
  assert.equal(
    restoreExecution.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(
    summary.recordsInputChangeEventControlledRestoreExecution,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreExecution
      .rejectsLiveDomNodesBeforeMutation,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreExecution.liveDomMutations,
    false
  );
  assert.equal(
    summary.recordsLiveControlledRestoreMutationPreflight,
    true
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight
      .acceptsLiveDomNodePreflight,
    true
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight
      .liveDomTargetCaptured,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.restoreQueueWrites,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.hostValueReads,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.hostValueWrites,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.valueTrackerWrites,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.valueTrackerAccess,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.descriptorAccess,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.liveDomMutations,
    false
  );

  const restoreDiagnosticSummary =
    resourceFormGate.describeControlledInputPrivateRestoreQueueDiagnosticGate();
  assert.equal(
    restoreDiagnosticSummary.liveRestoreMutationPreflight
      .acceptsLiveDomNodePreflight,
    true
  );
  assert.equal(
    restoreDiagnosticSummary.liveRestoreMutationPreflight
      .liveDomTargetCaptured,
    false
  );
  assert.equal(
    restoreDiagnosticSummary.liveRestoreMutationPreflight
      .valueTrackerFieldWritten,
    false
  );
  assert.equal(
    restoreDiagnosticSummary.liveRestoreMutationPreflight
      .browserInputMutated,
    false
  );

  const preflightDocument = createRootBridgeDocument();
  preflightDocument.defaultView = {};
  const preflightLiveNode = createRootBridgeElement(
    'INPUT',
    preflightDocument
  );
  const guardedReads = [];
  const guardedWrites = [];
  const guardedDescriptorReads = [];
  const guardedPresenceChecks = [];
  const guardedLiveNode = new Proxy(preflightLiveNode, {
    defineProperty(target, property, descriptor) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedWrites.push(String(property));
        throw new Error(`Unexpected live preflight define ${String(property)}`);
      }
      return Reflect.defineProperty(target, property, descriptor);
    },
    getOwnPropertyDescriptor(target, property) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedDescriptorReads.push(String(property));
        throw new Error(
          `Unexpected live preflight descriptor ${String(property)}`
        );
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    get(target, property, receiver) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedReads.push(String(property));
        throw new Error(`Unexpected live preflight read ${String(property)}`);
      }
      return Reflect.get(target, property, receiver);
    },
    has(target, property) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedPresenceChecks.push(String(property));
        throw new Error(`Unexpected live preflight has ${String(property)}`);
      }
      return Reflect.has(target, property);
    },
    set(target, property, value, receiver) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedWrites.push(String(property));
        throw new Error(`Unexpected live preflight write ${String(property)}`);
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
  const livePreflight =
    gate.preflightLiveControlledInputRestoreMutation(
      inputPreflight,
      bridge,
      execution,
      flushBlocker,
      wrapperIntent,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-controlled-input-post-event-restore-live-mutation-preflight',
        queueId: 'input-change-live-preflight',
        targetKind:
          'controlled-input-post-event-restore-live-mutation-preflight',
        liveDomTarget: guardedLiveNode
      }
    );

  assert.deepEqual(guardedReads, []);
  assert.deepEqual(guardedWrites, []);
  assert.deepEqual(guardedDescriptorReads, []);
  assert.deepEqual(guardedPresenceChecks, []);
  assert.equal(Object.hasOwn(preflightLiveNode, '_valueTracker'), false);
  assert.equal(Object.isFrozen(livePreflight), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueLiveMutationPreflightRecord(
      livePreflight
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueLiveMutationPreflightRecordPayload(
      livePreflight
    ),
    livePreflight
  );
  assert.equal(
    livePreflight.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueLiveMutationPreflightRecordType
  );
  assert.equal(
    livePreflight.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueLiveMutationPreflightStatus
  );
  assert.equal(livePreflight.admission.liveDomNodeAccepted, true);
  assert.equal(livePreflight.admission.liveDomTargetCaptured, false);
  assert.equal(livePreflight.admission.realDomMutationAllowed, false);
  assert.equal(livePreflight.admission.hostValueReadAllowed, false);
  assert.equal(livePreflight.admission.hostValueWriteAllowed, false);
  assert.equal(livePreflight.admission.liveDescriptorAccessAllowed, false);
  assert.equal(livePreflight.admission.valueTrackerFieldAccessAllowed, false);
  assert.equal(
    livePreflight.admission.valueTrackerFieldWriteAllowed,
    false
  );
  assert.deepEqual(
    livePreflight.liveMutationPreflightRows.map((row) => ({
      status: row.status,
      acceptedRestoreKind: row.acceptedRestoreKind,
      targetField: row.targetField,
      nextValueSnapshot: row.nextValueSnapshot,
      liveDomNodeAccepted: row.liveDomNodeAccepted,
      liveDomTargetCaptured: row.liveDomTargetCaptured,
      liveMutationBlocked: row.liveMutationBlocked,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      valueTrackerAccessBlocked: row.valueTrackerAccessBlocked,
      valueTrackerFieldAccessed: row.valueTrackerFieldAccessed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      descriptorAccessBlocked: row.descriptorAccessBlocked,
      propertyDescriptorAccessed: row.propertyDescriptorAccessed,
      propertyDescriptorInstalled: row.propertyDescriptorInstalled,
      hostValueRead: row.hostValueRead,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueLiveMutationPreflightRowStatus,
        acceptedRestoreKind: 'input-text-value',
        targetField: 'value',
        nextValueSnapshot: 'alpha',
        liveDomNodeAccepted: true,
        liveDomTargetCaptured: false,
        liveMutationBlocked: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        valueTrackerAccessBlocked: true,
        valueTrackerFieldAccessed: false,
        valueTrackerFieldWritten: false,
        descriptorAccessBlocked: true,
        propertyDescriptorAccessed: false,
        propertyDescriptorInstalled: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(livePreflight.blockerEvidence.blockerReasons, [
    'live-host-node-admitted-for-preflight-only',
    'accepted-write-execution-did-not-write-live-queue',
    'accepted-flush-blocker-kept-queue-flush-disabled',
    'host-wrapper-invocation-disabled',
    'wrapper-property-write-disabled',
    'host-value-read-disabled',
    'host-value-write-disabled',
    'live-descriptor-access-disabled',
    'live-descriptor-installation-disabled',
    'value-tracker-access-disabled',
    'value-tracker-write-disabled',
    'browser-input-mutation-disabled',
    'public-controlled-behavior-disabled'
  ]);
  assert.equal(
    livePreflight.blockerEvidence.liveDomNodeAcceptedForPreflight,
    true
  );
  assert.equal(livePreflight.blockerEvidence.liveDomTargetCaptured, false);
  assert.equal(
    livePreflight.blockerEvidence.liveMutationExecutionBlocked,
    true
  );
  assert.equal(livePreflight.blockerEvidence.hostValueRead, false);
  assert.equal(livePreflight.blockerEvidence.hostValueWritten, false);
  assert.equal(
    livePreflight.blockerEvidence.valueTrackerAccessBlocked,
    true
  );
  assert.equal(
    livePreflight.blockerEvidence.valueTrackerFieldAccessed,
    false
  );
  assert.equal(
    livePreflight.blockerEvidence.valueTrackerFieldWritten,
    false
  );
  assert.equal(
    livePreflight.blockerEvidence.descriptorAccessBlocked,
    true
  );
  assert.equal(
    livePreflight.blockerEvidence.propertyDescriptorAccessed,
    false
  );
  assert.equal(
    livePreflight.blockerEvidence.propertyDescriptorInstalled,
    false
  );
  assert.equal(livePreflight.blockerEvidence.browserInputMutated, false);
  assert.equal(
    livePreflight.postEventRestoreBoundary.liveMutationExecutionBlocked,
    true
  );
  assert.equal(
    livePreflight.postEventRestoreBoundary.restoreQueueWritten,
    false
  );
  assert.equal(livePreflight.postEventRestoreBoundary.hostValueRead, false);
  assert.equal(livePreflight.postEventRestoreBoundary.hostValueWritten, false);
  assert.equal(
    livePreflight.postEventRestoreBoundary.valueTrackerFieldAccessed,
    false
  );
  assert.equal(
    livePreflight.postEventRestoreBoundary.propertyDescriptorAccessed,
    false
  );
  assert.equal(livePreflight.sideEffects.liveMutationPreflightRecorded, true);
  assert.equal(livePreflight.sideEffects.liveMutationPreflightRowCount, 1);
  assert.equal(livePreflight.sideEffects.restoreQueueWritten, false);
  assert.equal(livePreflight.sideEffects.restoreQueueFlushed, false);
  assert.equal(livePreflight.sideEffects.hostWrapperInvoked, false);
  assert.equal(livePreflight.sideEffects.valueTrackerFieldAccessed, false);
  assert.equal(livePreflight.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(livePreflight.sideEffects.propertyDescriptorAccessed, false);
  assert.equal(livePreflight.sideEffects.propertyDescriptorInstalled, false);
  assert.equal(livePreflight.sideEffects.hostValueRead, false);
  assert.equal(livePreflight.sideEffects.hostValueWritten, false);
  assert.equal(livePreflight.sideEffects.browserInputMutated, false);
  assert.equal(
    livePreflight.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );

  const liveDocument = createRootBridgeDocument();
  liveDocument.defaultView = {};
  const liveNode = createRootBridgeElement('INPUT', liveDocument);
  liveNode[resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker] =
    true;
  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreExecution(
        inputPreflight,
        bridge,
        execution,
        flushBlocker,
        wrapperIntent,
        {
          explicitAdmission: true,
          queueKind:
            'deterministic-input-change-event-controlled-restore-execution',
          queueId: 'input-change-live-reject',
          targetKind:
            'controlled-input-change-event-restore-queue-execution',
          fakeDomTarget: liveNode
        }
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidInputChangeExecutionCode,
      compatibilityTarget,
      reason: 'unsupported-live-dom-node'
    }
  );

  componentTree.detachHostInstanceToken(dispatch.token);
});

test('private input/change controlled restore execution consumes fake-DOM checkbox path only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'checkbox-input-change-execution'
    });
  const dispatch = createControlledInputEventDispatch({
    domEventName: 'click',
    latestProps: {
      type: 'checkbox',
      checked: false,
      onChange() {}
    },
    nodeName: 'INPUT'
  });
  const inputPreflight =
    createControlledInputChangePreflight(
      dispatch,
      'checkbox-input-change-execution-preflight'
    );
  const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    dispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'checkbox-input-change-execution-restore',
      eventName: 'click',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  const writePreflight = gate.preflightRestoreQueueWrites([intent], {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'checkbox-input-change-execution-preflight',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  });
  const bridge = gate.recordInputChangeEventControlledRestoreBridge(
    inputPreflight,
    intent,
    writePreflight,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-input-change-event-controlled-restore-bridge',
      queueId: 'checkbox-input-change-execution-bridge',
      targetKind: 'controlled-input-change-event-restore-queue-bridge'
    }
  );
  const execution = gate.recordRestoreQueueWriteExecution(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: 'checkbox-input-change-execution-write',
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  });
  const flushBlocker = gate.recordRestoreQueueFlushBlocker(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: 'checkbox-input-change-execution-flush',
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  });
  const wrapperIntent = gate.recordRestoreQueueWrapperMutationIntent(
    execution,
    flushBlocker,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent',
      queueId: 'checkbox-input-change-execution-wrapper',
      targetKind: 'controlled-input-post-event-restore-wrapper-mutation-intent'
    }
  );
  const fakeTarget = createControlledInputFakeDomTarget({
    checked: true
  });
  const restoreExecution =
    gate.recordInputChangeEventControlledRestoreExecution(
      inputPreflight,
      bridge,
      execution,
      flushBlocker,
      wrapperIntent,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-input-change-event-controlled-restore-execution',
        queueId: 'checkbox-input-change-execution-final',
        targetKind: 'controlled-input-change-event-restore-queue-execution',
        fakeDomTarget: fakeTarget
      }
    );

  assert.equal(fakeTarget.checked, false);
  assert.equal(restoreExecution.executionRowCount, 1);
  assert.deepEqual(
    restoreExecution.inputChangeRestoreExecutionRows.map((row) => ({
      acceptedRestoreKind: row.acceptedRestoreKind,
      targetField: row.targetField,
      valueRestoreExecuted: row.valueRestoreExecuted,
      checkedRestoreExecuted: row.checkedRestoreExecuted,
      beforeValueSnapshot: row.beforeValueSnapshot,
      nextValueSnapshot: row.nextValueSnapshot,
      afterValueSnapshot: row.afterValueSnapshot,
      hostWrapperOperation: row.hostWrapperOperation,
      wrapperMutationKind: row.wrapperMutationKind,
      intendedUpdateKind: row.intendedUpdateKind,
      fakeDomTargetAccepted: row.fakeDomTargetAccepted,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      fakeDomInputMutated: row.fakeDomInputMutated,
      browserInputMutated: row.browserInputMutated,
      compatibilityClaimed: row.compatibilityClaimed
    })),
    [
      {
        acceptedRestoreKind: 'input-checkbox-checked',
        targetField: 'checked',
        valueRestoreExecuted: false,
        checkedRestoreExecuted: true,
        beforeValueSnapshot: true,
        nextValueSnapshot: false,
        afterValueSnapshot: false,
        hostWrapperOperation: 'input-checked-sync',
        wrapperMutationKind: 'checked-property-sync',
        intendedUpdateKind: 'checked',
        fakeDomTargetAccepted: true,
        restoreQueueWritten: true,
        restoreQueueFlushed: true,
        hostWrapperInvoked: true,
        wrapperWritePerformed: true,
        fakeDomInputMutated: true,
        browserInputMutated: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.equal(
    restoreExecution.wrapperMutationExecutionEvidence.targetField,
    'checked'
  );
  assert.equal(
    restoreExecution.wrapperMutationExecutionEvidence.nextValueSnapshot,
    false
  );
  assert.equal(
    restoreExecution.postEventRestoreBoundary.restoreQueueWritten,
    true
  );
  assert.equal(
    restoreExecution.postEventRestoreBoundary.restoreQueueFlushed,
    true
  );
  assert.equal(restoreExecution.sideEffects.restoreQueueWritten, false);
  assert.equal(restoreExecution.sideEffects.restoreQueueFlushed, false);
  assert.equal(restoreExecution.sideEffects.privateRestoreQueueWritten, true);
  assert.equal(restoreExecution.sideEffects.privateRestoreQueueFlushed, true);
  assert.equal(restoreExecution.sideEffects.hostWrapperInvoked, true);
  assert.equal(restoreExecution.sideEffects.fakeDomInputMutated, true);
  assert.equal(restoreExecution.sideEffects.browserInputMutated, false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(
    summary.inputChangeEventControlledRestoreExecution
      .acceptsCheckboxCheckedFakeDomPath,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreExecution
      .acceptedRestoreMetadataKinds.includes('input-checkbox-checked'),
    true
  );
  assert.equal(
    restoreExecution.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);

  componentTree.detachHostInstanceToken(dispatch.token);
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
