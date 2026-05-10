'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const componentTree = require(
  path.join(packageRoot, 'src/client/component-tree.js')
);
const {ELEMENT_NODE} = require(
  path.join(packageRoot, 'src/client/dom-container.js')
);
const controlledRestoreQueue = require(
  path.join(packageRoot, 'src/client/controlled-restore-queue.js')
);
const eventListener = require(
  path.join(packageRoot, 'src/events/react-dom-event-listener.js')
);
const pluginEventSystem = require(
  path.join(packageRoot, 'src/events/plugin-event-system.js')
);

test('private input/change extraction preflight records text input and checkbox metadata only', () => {
  const calls = [];
  const cases = [
    {
      controlledPropName: 'value',
      domEventName: 'input',
      expectedDomEventNames: ['input', 'change'],
      getTargetInstFunctionName: 'getTargetInstForInputOrChangeEvent',
      inputType: 'text',
      latestProps: {
        onChange() {
          calls.push('text-change');
        },
        type: 'text',
        value: 'typed'
      },
      propKeys: ['onChange', 'type', 'value'],
      targetKind: 'text-input'
    },
    {
      controlledPropName: 'checked',
      domEventName: 'click',
      expectedDomEventNames: ['click'],
      getTargetInstFunctionName: 'getTargetInstForClickEvent',
      inputType: 'checkbox',
      latestProps: {
        checked: true,
        onChange() {
          calls.push('checkbox-change');
        },
        type: 'checkbox'
      },
      propKeys: ['checked', 'onChange', 'type'],
      targetKind: 'checkbox-input'
    }
  ];

  for (const testCase of cases) {
    const {container, dispatchRecord, targetNode} =
      createPrivateInputChangeDispatch(testCase);
    const preflight =
      pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
        dispatchRecord
      );
    const payload =
      pluginEventSystem.getInputChangeEventExtractionPreflightRecordPayload(
        preflight
      );

    assert.equal(Object.isFrozen(preflight), true, testCase.domEventName);
    assert.equal(
      pluginEventSystem.isInputChangeEventExtractionPreflightRecord(
        preflight
      ),
      true,
      testCase.domEventName
    );
    assert.equal(
      preflight.kind,
      pluginEventSystem
        .INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND
    );
    assert.equal(
      preflight.status,
      pluginEventSystem
        .PRIVATE_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_STATUS
    );
    assert.equal(
      preflight.blockedReason,
      pluginEventSystem
        .INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_BLOCKED_CODE
    );
    assert.equal(preflight.pluginName, 'change-event-plugin');
    assert.equal(preflight.reactEventType, 'change');
    assert.equal(preflight.reactName, 'onChange');
    assert.equal(preflight.domEventName, testCase.domEventName);
    assert.equal(preflight.nativeEventType, testCase.domEventName);
    assert.equal(preflight.eventType, testCase.domEventName);
    assert.equal(preflight.targetTag, 'input');
    assert.equal(preflight.targetType, testCase.inputType);
    assert.equal(preflight.targetMetadata.hostTag, 'input');
    assert.equal(preflight.targetMetadata.inputType, testCase.inputType);
    assert.equal(preflight.targetMetadata.targetKind, testCase.targetKind);
    assert.deepEqual(
      preflight.targetMetadata.expectedDomEventNames,
      testCase.expectedDomEventNames
    );
    assert.equal(preflight.targetMetadata.supportedTarget, true);
    assert.equal(preflight.targetMetadata.supportedEventType, true);

    assert.equal(preflight.latestPropsEvidence.accepted, true);
    assert.deepEqual(preflight.latestPropsEvidence.propKeys, testCase.propKeys);
    assert.equal(preflight.latestPropsEvidence.exposesLatestProps, false);
    assert.equal(preflight.latestPropsEvidence.rawLatestPropsRetained, false);
    assert.equal(preflight.controlledMetadataAvailable, true);
    assert.equal(
      preflight.controlledMetadata.controlledPropName,
      testCase.controlledPropName
    );
    assert.equal(preflight.controlledMetadata.controlledPropPresent, true);
    assert.equal(preflight.controlledMetadata.controlledPropIsNonNull, true);
    assert.equal(preflight.controlledMetadata.controlled, true);
    assert.equal(preflight.controlledMetadata.onChangeListenerPresent, true);
    assert.equal(preflight.controlledMetadata.onChangePropType, 'function');
    assert.equal(
      preflight.controlledMetadata.controlledRestoreBlockedReason,
      pluginEventSystem.CONTROLLED_STATE_RESTORE_BLOCKED_CODE
    );
    assert.equal(
      preflight.controlledMetadata.controlledStateRestoreScheduled,
      false
    );

    assert.equal(
      preflight.extractionMetadata.getTargetInstFunctionName,
      testCase.getTargetInstFunctionName
    );
    assert.equal(preflight.extractionMetadata.targetEligible, true);
    assert.equal(
      preflight.extractionMetadata.status,
      'blocked-before-value-tracker-change-check'
    );
    assert.equal(
      preflight.extractionMetadata.valueChangeCheckRequired,
      true
    );
    assert.equal(preflight.extractionMetadata.valueTrackerUpdated, false);
    assert.equal(
      preflight.extractionMetadata.syntheticEventCreated,
      false
    );
    assert.equal(
      preflight.extractionMetadata.enqueueStateRestoreScheduled,
      false
    );
    assert.deepEqual(preflight.extractionMetadata.registrationNames, [
      'onChangeCapture',
      'onChange'
    ]);
    assert.equal(
      preflight.controlledRestoreQueuePreflightBridge.bridgeEligible,
      true
    );
    assert.equal(
      preflight.controlledRestoreQueuePreflightBridge
        .latestPropsEvidenceAccepted,
      true
    );
    assert.equal(
      preflight.controlledRestoreQueuePreflightBridge.bridgeRecordCreated,
      false
    );
    assert.equal(
      preflight.controlledRestoreQueuePreflightBridge.restoreQueueWritten,
      false
    );

    assert.equal(preflight.dispatchBehavior.eventDispatch, false);
    assert.equal(preflight.dispatchBehavior.syntheticEventDispatch, false);
    assert.equal(preflight.dispatchBehavior.dispatchQueueMutated, false);
    assert.equal(preflight.dispatchBehavior.listenerInvocationCount, 0);
    assert.equal(
      preflight.dispatchBehavior.publicDispatchBlockedReason,
      pluginEventSystem.PUBLIC_EVENT_DISPATCH_BLOCKED_CODE
    );
    assert.equal(
      preflight.defaultBehavior.blockedReason,
      pluginEventSystem.DEFAULT_PREVENTED_DIAGNOSTIC_BLOCKED_CODE
    );
    assert.equal(preflight.defaultBehavior.preventDefaultCalled, false);
    assert.equal(preflight.defaultBehavior.defaultBehaviorChanged, false);
    assert.equal(preflight.sideEffects.browserListenerInstallation, false);
    assert.equal(preflight.sideEffects.syntheticEventCreated, false);
    assert.equal(preflight.sideEffects.syntheticEventDispatched, false);
    assert.equal(preflight.sideEffects.controlledStateRestoreScheduled, false);
    assert.equal(
      preflight.sideEffects.controlledRestoreQueuePreflightBridgeRecorded,
      false
    );
    assert.equal(preflight.sideEffects.defaultBehaviorChanged, false);
    assert.equal(preflight.sideEffects.valueTrackerFieldWritten, false);
    assert.equal(preflight.sideEffects.browserInputMutated, false);
    assert.equal(preflight.browserDomEventCompatibilityClaimed, false);
    assert.equal(preflight.publicRootBehaviorChanged, false);
    assert.equal(preflight.compatibilityClaimed, false);
    assert.equal(Object.hasOwn(preflight, 'nativeEvent'), false);
    assert.equal(Object.hasOwn(preflight, 'syntheticEvent'), false);
    assert.equal(Object.hasOwn(preflight, 'latestProps'), false);
    assert.equal(Object.hasOwn(preflight.targetMetadata, 'targetNode'), false);

    assert.equal(payload.dispatchRecord, dispatchRecord);
    assert.equal(
      payload.targetListenerLookupRecord,
      dispatchRecord.targetListenerLookupRecord
    );
    assert.equal(Object.hasOwn(payload, 'latestProps'), false);
    assert.equal(container.__registrations.length, 0);
    assert.equal(Object.hasOwn(targetNode, '_valueTracker'), false);
  }

  assert.deepEqual(calls, []);
});

test('private input/change extraction bridge links controlled restore latest-props evidence without side effects', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'event-private-input-change-bridge'
    });
  const {container, dispatchRecord, targetNode, token} =
    createPrivateInputChangeDispatch({
      domEventName: 'input',
      inputType: 'text',
      latestProps: {
        onChange() {},
        onInput() {},
        type: 'text',
        value: 'alpha'
      },
      targetKind: 'text-input'
    });
  const inputPreflight =
    pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
      dispatchRecord
    );
  const restoreIntent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'event-private-input-change-restore',
      eventName: 'input',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  const writePreflight = gate.preflightRestoreQueueWrites([restoreIntent], {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'event-private-input-change-write-preflight',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  });
  const bridge = gate.recordInputChangeEventControlledRestoreBridge(
    inputPreflight,
    restoreIntent,
    writePreflight,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-input-change-event-controlled-restore-bridge',
      queueId: 'event-private-input-change-bridge',
      targetKind: 'controlled-input-change-event-restore-queue-bridge'
    }
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
  assert.equal(bridge.requestId, 'event-private-input-change-bridge:3');
  assert.equal(
    bridge.sourceInputChangePreflight.controlledRestoreBridgeEligible,
    true
  );
  assert.equal(
    bridge.sourceInputChangePreflight.restoreQueuePreflightRecordedBeforeLink,
    false
  );
  assert.equal(
    bridge.latestPropsEvidenceBridge.latestPropsEvidenceLinked,
    true
  );
  assert.equal(
    bridge.latestPropsEvidenceBridge.latestPropsEvidenceMatch,
    true
  );
  assert.deepEqual(bridge.latestPropsEvidenceBridge.inputPropKeys, [
    'onChange',
    'onInput',
    'type',
    'value'
  ]);
  assert.deepEqual(bridge.bridgeRows.map((row) => ({
    rowId: row.rowId,
    sourceRestoreRequestId: row.sourceRestoreRequestId,
    sourceWriteIntentRowId: row.sourceWriteIntentRowId,
    domEventName: row.domEventName,
    hostTag: row.hostTag,
    inputType: row.inputType,
    controlKind: row.controlKind,
    acceptedRestoreKind: row.acceptedRestoreKind,
    queueSlot: row.queueSlot,
    latestPropsEvidenceLinked: row.latestPropsEvidenceLinked,
    restoreWritePreflightFresh: row.restoreWritePreflightFresh,
    eventDispatch: row.eventDispatch,
    valueTrackerFieldWritten: row.valueTrackerFieldWritten,
    restoreQueueWritten: row.restoreQueueWritten,
    restoreQueueFlushed: row.restoreQueueFlushed,
    browserInputMutated: row.browserInputMutated
  })), [
    {
      rowId: 'event-private-input-change-bridge:3:row:1',
      sourceRestoreRequestId: 'event-private-input-change-bridge:1',
      sourceWriteIntentRowId: 'event-private-input-change-bridge:2:row:1',
      domEventName: 'input',
      hostTag: 'input',
      inputType: 'text',
      controlKind: 'value',
      acceptedRestoreKind: 'input-text-value',
      queueSlot: 'restore-target',
      latestPropsEvidenceLinked: true,
      restoreWritePreflightFresh: true,
      eventDispatch: false,
      valueTrackerFieldWritten: false,
      restoreQueueWritten: false,
      restoreQueueFlushed: false,
      browserInputMutated: false
    }
  ]);
  assert.equal(bridge.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(bridge.postEventRestoreBoundary.restoreQueueFlushed, false);
  assert.equal(bridge.sideEffects.inputChangeControlledRestoreBridgeRecorded, true);
  assert.equal(bridge.sideEffects.latestPropsEvidenceAccepted, true);
  assert.equal(bridge.sideEffects.restoreQueueWritten, false);
  assert.equal(bridge.sideEffects.restoreQueueFlushed, false);
  assert.equal(bridge.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(bridge.sideEffects.browserInputMutated, false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(Object.hasOwn(targetNode, '_valueTracker'), false);

  componentTree.detachHostInstanceToken(token);
});

test('private input/change extraction preflight rejects foreign records', () => {
  assert.throws(
    () =>
      pluginEventSystem.createInputChangeEventExtractionPreflightRecord({}),
    {
      code: pluginEventSystem.INVALID_EVENT_DISPATCH_RECORD_CODE
    }
  );
  assert.equal(
    pluginEventSystem.getInputChangeEventExtractionPreflightRecordPayload(
      {}
    ),
    null
  );
  assert.equal(
    pluginEventSystem.isInputChangeEventExtractionPreflightRecord({}),
    false
  );
});

function createPrivateInputChangeDispatch(options) {
  const document = createDocument();
  const container = createNode('DIV', document);
  const targetNode = createNode('INPUT', document);
  targetNode.parentNode = container;
  targetNode.type = options.inputType;

  const token = componentTree.createHostInstanceToken(
    {kind: `${options.targetKind}:host`},
    {kind: `${options.targetKind}:root`}
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
      defaultPrevented: false,
      preventDefaultCallCount: 0,
      returnValue: true,
      target: targetNode,
      type: options.domEventName
    }),
    document,
    targetNode,
    token
  };
}

function createDocument() {
  const document = {
    localName: '#document',
    nodeName: '#document',
    nodeType: 9
  };
  document.ownerDocument = document;
  return document;
}

function createNode(nodeName, ownerDocument) {
  return {
    __registrations: [],
    localName: nodeName.toLowerCase(),
    nodeName,
    nodeType: ELEMENT_NODE,
    ownerDocument,
    parentNode: null
  };
}
