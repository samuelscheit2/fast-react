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
const listenerRegistry = require(
  path.join(packageRoot, 'src/events/listener-registry.js')
);
const pluginEventSystem = require(
  path.join(packageRoot, 'src/events/plugin-event-system.js')
);
const rootListeners = require(
  path.join(packageRoot, 'src/events/root-listeners.js')
);
const resourceFormGate = require(
  path.join(packageRoot, 'src/resource-form-internals-gate.js')
);

test('private click event delegation dispatch gate routes one accepted listener record', () => {
  const fixture = createPrivateClickDelegationFixture('click-gate-route');
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          event,
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
        return 'accepted-click';
      },
      {
        listenerType: 'accepted-private-click-delegation-test'
      }
    );
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(fixture.container);

  try {
    const gate =
      rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
        rootRegistration,
        fixture.hostOutputPayload,
        listenerRecord
      );
    const payload =
      rootListeners.getPrivateRootClickEventDelegationDispatchGatePayload(
        gate
      );
    const pluginPayload =
      pluginEventSystem.getPrivateClickEventDelegationDispatchGatePayload(
        payload.pluginGateRecord
      );

    assert.equal(
      gate.kind,
      rootListeners
        .PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND
    );
    assert.equal(
      gate.status,
      rootListeners
        .PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS
    );
    assert.equal(
      rootListeners.isPrivateRootClickEventDelegationDispatchGateRecord(
        gate
      ),
      true
    );
    assert.equal(gate.domEventName, 'click');
    assert.equal(gate.phase, 'bubble');
    assert.equal(gate.eventPriorityName, 'DiscreteEventPriority');
    assert.equal(gate.listenerInvocationCount, 1);
    assert.equal(gate.privateListenerInvoked, true);
    assert.equal(gate.publicDispatchEnabled, false);
    assert.equal(gate.publicRootBehaviorChanged, false);
    assert.equal(gate.browserDomEventCompatibilityClaimed, false);
    assert.equal(gate.syntheticEventCount, 0);
    assert.equal(
      gate.pluginGateRecordKind,
      pluginEventSystem
        .PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND
    );
    assert.equal(
      gate.invocationRecordKind,
      pluginEventSystem.DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND
    );
    assert.equal(payload.acceptedListenerQueueEntryRecord, listenerRecord);
    assert.equal(payload.dispatchRecord.domEventName, 'click');
    assert.equal(payload.dispatchRecord.extractionRecord.domEventName, 'click');
    assert.equal(payload.dispatchListenerRecord.privateListenerQueue, true);
    assert.equal(pluginPayload.dispatchRecord, payload.dispatchRecord);
    assert.equal(pluginPayload.dispatchListenerRecord, payload.dispatchListenerRecord);
    assert.equal(pluginPayload.listenerQueueEntryRecord, listenerRecord);

    assert.deepEqual(calls.map(call => [
      call.type,
      call.registrationName,
      call.currentTarget,
      call.target,
      call.targetInst
    ]), [
      [
        'click',
        'onClick',
        fixture.targetNode,
        fixture.targetNode,
        fixture.token
      ]
    ]);
    assert.equal(Object.isFrozen(calls[0].event), true);
    assert.equal(calls[0].event.syntheticEvent, false);
    assert.equal(Object.hasOwn(calls[0].event, 'nativeEvent'), false);
    assert.equal(fixture.targetNode.__registrations.length, 0);
    assert.equal(fixture.container.__registrations.length, 138);
    assert.equal(fixture.document.__registrations.length, 1);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);
    rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
    componentTree.detachHostInstanceToken(fixture.token);
  }
});

test('private click event delegation dispatch gate rejects stale listener records before invoking', () => {
  const fixture = createPrivateClickDelegationFixture('click-gate-stale');
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      () => {
        calls.push('stale-listener-invoked');
      }
    );
  const dispatchRecord = createPrivateClickDispatchRecord(fixture, 'bubble');
  const dispatchListenerRecord = findPrivateQueueDispatchListenerRecord(
    dispatchRecord,
    listenerRecord
  );

  try {
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);

    assert.throws(
      () =>
        pluginEventSystem.invokePrivateClickEventDelegationDispatchGate(
          dispatchRecord,
          dispatchListenerRecord
        ),
      {
        code:
          pluginEventSystem
            .INVALID_PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
        reason: 'stale-listener-record'
      }
    );
    assert.deepEqual(calls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);
    componentTree.detachHostInstanceToken(fixture.token);
  }
});

test('private root click event delegation dispatch gate rejects unsupported phases before invoking', () => {
  const fixture = createPrivateClickDelegationFixture('click-gate-phase');
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      () => {
        calls.push('unsupported-phase-invoked');
      }
    );
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(fixture.container);

  try {
    assert.throws(
      () =>
        rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
          rootRegistration,
          fixture.hostOutputPayload,
          listenerRecord,
          {
            phase: 'target'
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
        reason: 'unsupported-event-phase'
      }
    );
    assert.deepEqual(calls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);
    rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
    componentTree.detachHostInstanceToken(fixture.token);
  }
});

test('private root click event delegation dispatch gate invokes a portal child listener after owner-root validation', () => {
  const fixture = createPrivateClickPortalDelegationFixture(
    'click-gate-portal-child'
  );
  const calls = [];
  const childListenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      },
      {
        listenerType: 'accepted-private-click-portal-child-test'
      }
    );
  const parentListenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.parentNode,
      'click',
      false,
      () => {
        calls.push('parent-listener-invoked');
      },
      {
        listenerType: 'rejected-private-click-portal-parent-test'
      }
    );
  const portalDispatch = createPrivateClickDispatchRecord(
    fixture,
    'bubble'
  );
  const portalOwnerGate =
    pluginEventSystem.createPortalEventOwnerRootGateRecord(
      portalDispatch.targetDispatchPathRecord,
      {
        domEventName: 'click',
        ownerRoot: fixture.rootOwner,
        portalContainer: fixture.portalContainer,
        portalKey: 'click-gate-portal-child',
        rootContainer: fixture.container
      }
    );
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(fixture.container);

  try {
    const gate =
      rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
        rootRegistration,
        fixture.hostOutputPayload,
        childListenerRecord,
        {
          portalEventOwnerRootGateRecord: portalOwnerGate
        }
      );
    const payload =
      rootListeners.getPrivateRootClickEventDelegationDispatchGatePayload(
        gate
      );
    const pluginPayload =
      pluginEventSystem.getPrivateClickEventDelegationDispatchGatePayload(
        payload.pluginGateRecord
      );

    assert.equal(gate.listenerInvocationCount, 1);
    assert.equal(gate.privateListenerInvoked, true);
    assert.equal(gate.portalOwnerRootAvailable, true);
    assert.equal(
      gate.portalOwnerRootStatus,
      pluginEventSystem.PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS
    );
    assert.equal(gate.portalContainerContainsTarget, true);
    assert.equal(gate.rootContainerContainsTarget, false);
    assert.equal(gate.publicPortalBubblingEnabled, false);
    assert.equal(gate.publicPortalBubblingBlocked, true);
    assert.equal(gate.publicDispatchEnabled, false);
    assert.equal(gate.browserDomEventCompatibilityClaimed, false);
    assert.equal(gate.syntheticEventCount, 0);
    assert.equal(gate.targetDispatchPathLength, 2);
    assert.equal(
      gate.targetDispatchPathStatus,
      'resolved-component-tree-dispatch-path'
    );
    assert.equal(payload.dispatchRecord.targetDispatchPathLength, 2);
    assert.equal(payload.pluginGateRecord.portalContainerContainsTarget, true);
    assert.equal(
      payload.pluginGateRecord.portalOwnerRoot.dispatchPathRootOwnerMatchCount,
      2
    );
    assert.equal(
      payload.pluginGateRecord.portalOwnerRoot
        .dispatchPathRootOwnerMismatchCount,
      0
    );
    assert.equal(
      pluginPayload.portalEventOwnerRootGateRecord,
      portalOwnerGate
    );
    assert.equal(
      pluginPayload.dispatchListenerRecord.currentTarget,
      fixture.targetNode
    );

    assert.deepEqual(calls, [
      {
        currentTarget: fixture.targetNode,
        registrationName: 'onClick',
        target: fixture.targetNode,
        targetInst: fixture.childToken,
        type: 'click'
      }
    ]);
    assert.equal(fixture.portalContainer.__registrations.length, 0);
    assert.equal(fixture.parentNode.__registrations.length, 0);
    assert.equal(fixture.targetNode.__registrations.length, 0);
    assert.equal(fixture.container.__registrations.length, 138);
    assert.equal(fixture.document.__registrations.length, 1);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      childListenerRecord
    );
    listenerRegistry.removePrivateEventListenerQueueEntry(
      parentListenerRecord
    );
    rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
    componentTree.detachHostInstanceToken(fixture.childToken);
    componentTree.detachHostInstanceToken(fixture.parentToken);
  }
});

test('private click event delegation dispatch gate rejects portal owner mismatch before invoking', () => {
  const source = createPrivateClickDelegationFixture('click-gate-portal-a');
  const foreign = createPrivateClickDelegationFixture('click-gate-portal-b');
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      source.targetNode,
      'click',
      false,
      () => {
        calls.push('portal-mismatch-invoked');
      }
    );
  const sourceDispatch = createPrivateClickDispatchRecord(source, 'bubble');
  const sourceListenerRecord = findPrivateQueueDispatchListenerRecord(
    sourceDispatch,
    listenerRecord
  );
  const foreignDispatch = createPrivateClickDispatchRecord(foreign, 'bubble');
  const foreignPortalGate =
    pluginEventSystem.createPortalEventOwnerRootGateRecord(
      foreignDispatch.targetDispatchPathRecord,
      {
        domEventName: 'click',
        ownerRoot: foreign.rootOwner,
        portalContainer: foreign.container,
        rootContainer: foreign.container
      }
    );

  try {
    assert.throws(
      () =>
        pluginEventSystem.invokePrivateClickEventDelegationDispatchGate(
          sourceDispatch,
          sourceListenerRecord,
          {
            portalEventOwnerRootGateRecord: foreignPortalGate
          }
        ),
      {
        code:
          pluginEventSystem
            .INVALID_PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
        reason: 'portal-owner-root-mismatch'
      }
    );
    assert.deepEqual(calls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);
    componentTree.detachHostInstanceToken(source.token);
    componentTree.detachHostInstanceToken(foreign.token);
  }
});

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

test('private input/change controlled restore execution flushes one fake-DOM text input', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'event-private-input-change-execution'
    });
  const sources = createPrivateInputChangeRestoreExecutionSources(gate, {
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
  const fakeTarget = createPrivateControlledRestoreFakeDomTarget({
    value: 'browser-mutated'
  });
  const execution = gate.recordInputChangeEventControlledRestoreExecution(
    sources.inputPreflight,
    sources.bridge,
    sources.writeExecution,
    sources.flushBlocker,
    sources.wrapperIntent,
    createPrivateInputChangeExecutionAdmission(fakeTarget)
  );

  assert.equal(Object.isFrozen(execution), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecord(
      execution
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecordPayload(
      execution
    ),
    execution
  );
  assert.equal(execution.requestId, 'event-private-input-change-execution:7');
  assert.equal(
    execution.status,
    controlledRestoreQueue
      .controlledInputPostEventRestoreQueueInputChangeExecutionStatus
  );
  assert.equal(fakeTarget.value, 'alpha');
  assert.equal(execution.latestPropsValidation.currentLatestPropsFresh, true);
  assert.equal(execution.latestPropsValidation.latestPropsValidationAccepted, true);
  assert.equal(execution.restoreQueueWriteEvidence.restoreQueueWritten, true);
  assert.equal(execution.flushIntentEvidence.restoreQueueFlushed, true);
  assert.equal(
    execution.wrapperMutationExecutionEvidence.wrapperWritePerformed,
    true
  );
  assert.deepEqual(
    execution.inputChangeRestoreExecutionRows.map((row) => ({
      acceptedRestoreKind: row.acceptedRestoreKind,
      targetField: row.targetField,
      beforeValueSnapshot: row.beforeValueSnapshot,
      nextValueSnapshot: row.nextValueSnapshot,
      afterValueSnapshot: row.afterValueSnapshot,
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
        acceptedRestoreKind: 'input-text-value',
        targetField: 'value',
        beforeValueSnapshot: 'browser-mutated',
        nextValueSnapshot: 'alpha',
        afterValueSnapshot: 'alpha',
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
  assert.equal(execution.sideEffects.privateRestoreQueueWritten, true);
  assert.equal(execution.sideEffects.privateRestoreQueueFlushed, true);
  assert.equal(execution.sideEffects.restoreQueueWritten, false);
  assert.equal(execution.sideEffects.restoreQueueFlushed, false);
  assert.equal(execution.sideEffects.fakeDomInputMutated, true);
  assert.equal(execution.sideEffects.browserInputMutated, false);
  assert.equal(
    execution.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(sources.container.__registrations.length, 0);
  assert.equal(Object.hasOwn(sources.targetNode, '_valueTracker'), false);

  componentTree.detachHostInstanceToken(sources.token);
});

test('private input/change controlled restore execution flushes one fake-DOM checkbox input', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'event-private-checkbox-change-execution'
    });
  const sources = createPrivateInputChangeRestoreExecutionSources(gate, {
    domEventName: 'click',
    inputType: 'checkbox',
    latestProps: {
      checked: false,
      onChange() {},
      type: 'checkbox'
    },
    targetKind: 'checkbox-input'
  });
  const fakeTarget = createPrivateControlledRestoreFakeDomTarget({
    checked: true
  });
  const execution = gate.recordInputChangeEventControlledRestoreExecution(
    sources.inputPreflight,
    sources.bridge,
    sources.writeExecution,
    sources.flushBlocker,
    sources.wrapperIntent,
    createPrivateInputChangeExecutionAdmission(fakeTarget)
  );

  assert.equal(fakeTarget.checked, false);
  assert.equal(execution.latestPropsValidation.currentLatestPropsFresh, true);
  assert.equal(execution.restoreQueueWriteEvidence.restoreQueueWritten, true);
  assert.equal(execution.flushIntentEvidence.restoreQueueFlushed, true);
  assert.equal(
    execution.wrapperMutationExecutionEvidence.wrapperWritePerformed,
    true
  );
  assert.deepEqual(
    execution.inputChangeRestoreExecutionRows.map((row) => ({
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
  assert.equal(execution.sideEffects.privateRestoreQueueWritten, true);
  assert.equal(execution.sideEffects.privateRestoreQueueFlushed, true);
  assert.equal(execution.sideEffects.restoreQueueWritten, false);
  assert.equal(execution.sideEffects.restoreQueueFlushed, false);
  assert.equal(execution.sideEffects.fakeDomInputMutated, true);
  assert.equal(execution.sideEffects.browserInputMutated, false);
  assert.equal(
    execution.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(sources.container.__registrations.length, 0);
  assert.equal(Object.hasOwn(sources.targetNode, '_valueTracker'), false);

  componentTree.detachHostInstanceToken(sources.token);
});

test('private input/change controlled restore execution rejects stale latest props and live DOM targets before mutation', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'event-private-input-change-execution-reject'
    });
  const staleSources = createPrivateInputChangeRestoreExecutionSources(gate, {
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
  const staleFakeTarget = createPrivateControlledRestoreFakeDomTarget({
    value: 'browser-mutated'
  });
  componentTree.updateLatestPropsForNode(staleSources.targetNode, {
    onChange() {},
    onInput() {},
    type: 'text',
    value: 'fresh'
  });

  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreExecution(
        staleSources.inputPreflight,
        staleSources.bridge,
        staleSources.writeExecution,
        staleSources.flushBlocker,
        staleSources.wrapperIntent,
        createPrivateInputChangeExecutionAdmission(staleFakeTarget)
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidInputChangeExecutionCode,
      reason: 'stale-latest-props-for-execution'
    }
  );
  assert.equal(staleFakeTarget.value, 'browser-mutated');

  const liveSources = createPrivateInputChangeRestoreExecutionSources(gate, {
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
  const liveLikeTarget = createNode('INPUT', liveSources.document);
  liveLikeTarget[
    resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker
  ] = true;
  liveLikeTarget.value = 'browser-mutated';

  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreExecution(
        liveSources.inputPreflight,
        liveSources.bridge,
        liveSources.writeExecution,
        liveSources.flushBlocker,
        liveSources.wrapperIntent,
        createPrivateInputChangeExecutionAdmission(liveLikeTarget)
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidInputChangeExecutionCode,
      reason: 'unsupported-live-dom-node'
    }
  );
  assert.equal(liveLikeTarget.value, 'browser-mutated');

  componentTree.detachHostInstanceToken(staleSources.token);
  componentTree.detachHostInstanceToken(liveSources.token);
});

test('private input/change controlled restore execution rejects radio group ambiguity before mutation', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'event-private-input-change-radio-reject'
    });
  const text = createPrivateInputChangeDispatch({
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
  const radio = createPrivateInputChangeDispatch({
    domEventName: 'click',
    inputType: 'radio',
    latestProps: {
      checked: true,
      name: 'choice',
      onChange() {},
      type: 'radio'
    },
    targetKind: 'radio-input'
  });
  const inputPreflight =
    pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
      text.dispatchRecord
    );
  const textIntent = recordPrivateEventRestoreIntent(
    gate,
    text.dispatchRecord,
    'input',
    'text-radio-reject'
  );
  const radioIntent = recordPrivateEventRestoreIntent(
    gate,
    radio.dispatchRecord,
    'click',
    'radio-reject'
  );
  const writePreflight = recordPrivateWritePreflight(gate, [
    textIntent,
    radioIntent
  ]);
  const bridge = recordPrivateInputChangeBridge(
    gate,
    inputPreflight,
    textIntent,
    writePreflight
  );
  const writeExecution = recordPrivateWriteExecution(gate, writePreflight);
  const flushBlocker = recordPrivateFlushBlocker(gate, writePreflight);
  const wrapperIntent = recordPrivateWrapperMutationIntent(
    gate,
    writeExecution,
    flushBlocker
  );
  const fakeTarget = createPrivateControlledRestoreFakeDomTarget({
    value: 'browser-mutated'
  });

  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreExecution(
        inputPreflight,
        bridge,
        writeExecution,
        flushBlocker,
        wrapperIntent,
        createPrivateInputChangeExecutionAdmission(fakeTarget)
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidInputChangeExecutionCode,
      reason: 'radio-group-ambiguity-before-mutation'
    }
  );
  assert.equal(fakeTarget.value, 'browser-mutated');

  componentTree.detachHostInstanceToken(text.token);
  componentTree.detachHostInstanceToken(radio.token);
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

function createPrivateClickDelegationFixture(label) {
  const document = installEventTargetMethods(createDocument());
  const container = installEventTargetMethods(createNode('DIV', document));
  const targetNode = installEventTargetMethods(createNode('BUTTON', document));
  targetNode.parentNode = container;

  const rootOwner = {kind: `${label}:root`};
  const token = componentTree.createHostInstanceToken(
    {kind: `${label}:host`},
    rootOwner
  );
  componentTree.attachHostInstanceNode(targetNode, token, {});

  return {
    container,
    document,
    hostOutputPayload: {
      hostNode: targetNode,
      hostToken: token,
      rootOwner
    },
    rootOwner,
    targetNode,
    token
  };
}

function createPrivateClickPortalDelegationFixture(label) {
  const document = installEventTargetMethods(createDocument());
  const container = installEventTargetMethods(createNode('DIV', document));
  const portalContainer = installEventTargetMethods(
    createNode('SECTION', document)
  );
  const parentNode = installEventTargetMethods(createNode('DIV', document));
  const targetNode = installEventTargetMethods(createNode('BUTTON', document));
  portalContainer.parentNode = document;
  parentNode.parentNode = portalContainer;
  targetNode.parentNode = parentNode;

  const rootOwner = {kind: `${label}:root`};
  const parentToken = componentTree.createHostInstanceToken(
    {kind: `${label}:parent-host`},
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    {kind: `${label}:child-host`},
    rootOwner
  );
  componentTree.attachHostInstanceNode(parentNode, parentToken, {});
  componentTree.attachHostInstanceNode(targetNode, childToken, {});

  return {
    childToken,
    container,
    document,
    hostOutputPayload: {
      hostNode: targetNode,
      hostToken: childToken,
      rootOwner
    },
    parentNode,
    parentToken,
    portalContainer,
    rootOwner,
    targetNode,
    token: childToken
  };
}

function createPrivateClickDispatchRecord(fixture, phase) {
  const eventSystemFlags =
    phase === 'capture' ? rootListeners.IS_CAPTURE_PHASE : 0;
  const wrapperRecord =
    eventListener.createEventListenerWrapperRecordWithPriority(
      fixture.container,
      'click',
      eventSystemFlags
    );
  return pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
    wrapperRecord,
    createPrivateClickNativeEvent(fixture.targetNode)
  );
}

function findPrivateQueueDispatchListenerRecord(
  dispatchRecord,
  listenerQueueEntryRecord
) {
  for (const entry of dispatchRecord.dispatchQueue.entries) {
    const entryPayload =
      pluginEventSystem.getDispatchQueueEntryRecordPayload(entry);
    const listenerRecord = entryPayload.processingListenerRecords.find(
      candidateRecord => {
        const listenerPayload =
          pluginEventSystem.getDispatchListenerRecordPayload(candidateRecord);
        return (
          listenerPayload !== null &&
          listenerPayload.privateEventListenerQueueEntryRecord ===
            listenerQueueEntryRecord
        );
      }
    );
    if (listenerRecord !== undefined) {
      return listenerRecord;
    }
  }

  throw new Error('Expected a private queue dispatch listener record.');
}

function createPrivateClickNativeEvent(target) {
  return {
    defaultPrevented: false,
    preventDefaultCallCount: 0,
    returnValue: true,
    target,
    type: 'click',
    preventDefault() {
      this.defaultPrevented = true;
      this.preventDefaultCallCount++;
      this.returnValue = false;
    }
  };
}

function installEventTargetMethods(target) {
  if (!Array.isArray(target.__registrations)) {
    target.__registrations = [];
  }
  target.addEventListener = function addEventListener(
    type,
    listener,
    options
  ) {
    this.__registrations.push({
      listener,
      options,
      type
    });
  };
  target.removeEventListener = function removeEventListener(
    type,
    listener,
    options
  ) {
    const index = this.__registrations.findIndex(
      registration =>
        registration.type === type &&
        registration.listener === listener &&
        registration.options === options
    );
    if (index !== -1) {
      this.__registrations.splice(index, 1);
    }
  };
  return target;
}

function createPrivateInputChangeRestoreExecutionSources(gate, options) {
  const dispatch = createPrivateInputChangeDispatch(options);
  const inputPreflight =
    pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
      dispatch.dispatchRecord
    );
  const restoreIntent = recordPrivateEventRestoreIntent(
    gate,
    dispatch.dispatchRecord,
    options.domEventName,
    `${options.targetKind}-execution`
  );
  const writePreflight = recordPrivateWritePreflight(gate, [restoreIntent]);
  const bridge = recordPrivateInputChangeBridge(
    gate,
    inputPreflight,
    restoreIntent,
    writePreflight
  );
  const writeExecution = recordPrivateWriteExecution(gate, writePreflight);
  const flushBlocker = recordPrivateFlushBlocker(gate, writePreflight);
  const wrapperIntent = recordPrivateWrapperMutationIntent(
    gate,
    writeExecution,
    flushBlocker
  );

  return {
    ...dispatch,
    bridge,
    flushBlocker,
    inputPreflight,
    restoreIntent,
    wrapperIntent,
    writeExecution,
    writePreflight
  };
}

function recordPrivateEventRestoreIntent(
  gate,
  dispatchRecord,
  eventName,
  queueId
) {
  return gate.recordPostEventRestoreIntentFromEventLatestProps(
    dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId,
      eventName,
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
}

function recordPrivateWritePreflight(gate, records) {
  return gate.preflightRestoreQueueWrites(records, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'event-private-input-change-write-preflight',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  });
}

function recordPrivateInputChangeBridge(
  gate,
  inputPreflight,
  restoreIntent,
  writePreflight
) {
  return gate.recordInputChangeEventControlledRestoreBridge(
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
}

function recordPrivateWriteExecution(gate, writePreflight) {
  return gate.recordRestoreQueueWriteExecution(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: 'event-private-input-change-write-execution',
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  });
}

function recordPrivateFlushBlocker(gate, writePreflight) {
  return gate.recordRestoreQueueFlushBlocker(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: 'event-private-input-change-flush-blocker',
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  });
}

function recordPrivateWrapperMutationIntent(
  gate,
  writeExecution,
  flushBlocker
) {
  return gate.recordRestoreQueueWrapperMutationIntent(
    writeExecution,
    flushBlocker,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent',
      queueId: 'event-private-input-change-wrapper-intent',
      targetKind:
        'controlled-input-post-event-restore-wrapper-mutation-intent'
    }
  );
}

function createPrivateInputChangeExecutionAdmission(fakeDomTarget) {
  return {
    explicitAdmission: true,
    queueKind:
      'deterministic-input-change-event-controlled-restore-execution',
    queueId: 'event-private-input-change-execution',
    targetKind: 'controlled-input-change-event-restore-queue-execution',
    fakeDomTarget
  };
}

function createPrivateControlledRestoreFakeDomTarget(fields) {
  return {
    [resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker]: true,
    ...fields
  };
}

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
