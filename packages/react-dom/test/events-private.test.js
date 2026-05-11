'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const componentTree = require(
  path.join(packageRoot, 'src/client/component-tree.js')
);
const {ELEMENT_NODE, TEXT_NODE} = require(
  path.join(packageRoot, 'src/client/dom-container.js')
);
const controlledRestoreQueue = require(
  path.join(packageRoot, 'src/client/controlled-restore-queue.js')
);
const rootBridge = require(
  path.join(packageRoot, 'src/client/root-bridge.js')
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
const rootMarkers = require(
  path.join(packageRoot, 'src/client/root-markers.js')
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
  const rootCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    rootRegistration,
    'click-gate-route'
  );

  try {
    const gate =
      rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
        rootRegistration,
        fixture.hostOutputPayload,
        listenerRecord,
        {
          rootListenerCurrentnessGateRecord: rootCurrentnessGate
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
    assert.equal(
      gate.rootListenerCurrentnessGateStatus,
      rootListeners.PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_STATUS
    );
    assert.equal(gate.rootListenerCurrentnessSourceOwned, true);
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
    assert.equal(
      payload.rootListenerCurrentnessGateRecord,
      rootCurrentnessGate
    );
    assert.equal(
      payload.rootListenerCurrentnessGatePayload.listenerRegistrationRecord,
      rootRegistration
    );
    assert.equal(
      payload.rootListenerCurrentnessState.listenerRows.length,
      rootCurrentnessGate.listenerRowCount
    );
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

test('private click event delegation accepted order targets root-render fake DOM metadata', () => {
  const fixture = createPrivateRootRenderClickDelegationFixture(
    'click-after-root-render'
  );
  const calls = [];
  const captureListenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      true,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          phase: 'capture',
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      },
      {
        listenerType: 'accepted-private-root-render-click-capture-test'
      }
    );
  const bubbleListenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          phase: 'bubble',
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      },
      {
        listenerType: 'accepted-private-root-render-click-bubble-test'
      }
    );
  const targetRecord =
    componentTree.createPrivateRootHostOutputEventTargetRecord(
      fixture.hostOutputPayload
    );
  const captureDispatchRecord = createPrivateClickDispatchRecord(
    fixture,
    'capture'
  );
  const bubbleDispatchRecord = createPrivateClickDispatchRecord(
    fixture,
    'bubble'
  );

  try {
    const orderRecord =
      pluginEventSystem.invokePrivateClickEventDelegationAcceptedListenerOrder(
        [captureDispatchRecord, bubbleDispatchRecord],
        [bubbleListenerRecord, captureListenerRecord],
        {
          requireRootRenderMetadata: true,
          rootHostOutputEventTargetRecord: targetRecord
        }
      );
    const payload =
      pluginEventSystem
        .getPrivateClickEventDelegationAcceptedListenerOrderPayload(
          orderRecord
        );
    const targetPayload =
      componentTree.getPrivateRootHostOutputEventTargetRecordPayload(
        targetRecord
      );

    assert.equal(
      orderRecord.kind,
      pluginEventSystem
        .PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_RECORD_KIND
    );
    assert.equal(
      orderRecord.status,
      pluginEventSystem
        .PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_STATUS
    );
    assert.equal(
      pluginEventSystem
        .isPrivateClickEventDelegationAcceptedListenerOrderRecord(
          orderRecord
        ),
      true
    );
    assert.equal(orderRecord.acceptedListenerCount, 2);
    assert.equal(orderRecord.listenerInvocationCount, 2);
    assert.deepEqual(orderRecord.phases, ['capture', 'bubble']);
    assert.deepEqual(orderRecord.registrationNames, [
      'onClickCapture',
      'onClick'
    ]);
    assert.equal(orderRecord.selectedFromProcessingOrder, true);
    assert.equal(orderRecord.targetInst, fixture.token);
    assert.equal(orderRecord.targetRecordKind, targetRecord.kind);
    assert.equal(orderRecord.targetRecordStatus, targetRecord.status);
    assert.equal(orderRecord.rootRenderMetadataAvailable, true);
    assert.equal(orderRecord.rootRenderHostOutputActive, true);
    assert.equal(
      orderRecord.rootRenderMetadataStatus,
      'active-private-root-render-host-output'
    );
    assert.equal(orderRecord.publicDispatchEnabled, false);
    assert.equal(orderRecord.publicDispatchBlocked, true);
    assert.equal(orderRecord.browserDomEventCompatibilityClaimed, false);
    assert.equal(orderRecord.compatibilityClaimed, false);
    assert.equal(orderRecord.syntheticEventCount, 0);
    assert.equal(orderRecord.willDispatchPublicEvent, false);
    assert.deepEqual(
      orderRecord.acceptedListenerOrder.map(entry => [
        entry.phase,
        entry.registrationName,
        entry.currentTarget,
        entry.targetInst,
        entry.listenerQueueIndex
      ]),
      [
        [
          'capture',
          'onClickCapture',
          fixture.targetNode,
          fixture.token,
          captureListenerRecord.listenerQueueIndex
        ],
        [
          'bubble',
          'onClick',
          fixture.targetNode,
          fixture.token,
          bubbleListenerRecord.listenerQueueIndex
        ]
      ]
    );
    assert.deepEqual(calls, [
      {
        currentTarget: fixture.targetNode,
        phase: 'capture',
        registrationName: 'onClickCapture',
        target: fixture.targetNode,
        targetInst: fixture.token,
        type: 'click'
      },
      {
        currentTarget: fixture.targetNode,
        phase: 'bubble',
        registrationName: 'onClick',
        target: fixture.targetNode,
        targetInst: fixture.token,
        type: 'click'
      }
    ]);
    assert.equal(payload.dispatchRecords[0], captureDispatchRecord);
    assert.equal(payload.dispatchRecords[1], bubbleDispatchRecord);
    assert.deepEqual(payload.acceptedListenerQueueEntryRecords, [
      bubbleListenerRecord,
      captureListenerRecord
    ]);
    assert.equal(payload.targetRecord, targetRecord);
    assert.equal(targetPayload.hostOutputPayload, fixture.hostOutputPayload);
    assert.equal(targetPayload.rootRenderMetadata.available, true);
    assert.equal(targetPayload.rootRenderMetadata.hostOutputActive, true);
    assert.equal(fixture.container.__registrations.length, 138);
    assert.equal(fixture.document.__registrations.length, 1);
    assert.equal(fixture.targetNode.__registrations.length, 0);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      captureListenerRecord
    );
    listenerRegistry.removePrivateEventListenerQueueEntry(
      bubbleListenerRecord
    );
    cleanupPrivateRootRenderClickDelegationFixture(fixture);
  }
});

test('private nested click event delegation accepted order is deterministic across parent and child', () => {
  const fixture = createPrivateNestedRootRenderClickDelegationFixture(
    'nested-click-order'
  );
  const calls = [];
  const parentCaptureRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.parentNode,
      'click',
      true,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          phase: 'parent-capture',
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      },
      {
        listenerType: 'accepted-private-nested-click-parent-capture-test'
      }
    );
  const childCaptureRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      true,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          phase: 'child-capture',
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      },
      {
        listenerType: 'accepted-private-nested-click-child-capture-test'
      }
    );
  const childBubbleRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          phase: 'child-bubble',
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      },
      {
        listenerType: 'accepted-private-nested-click-child-bubble-test'
      }
    );
  const parentBubbleRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.parentNode,
      'click',
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          phase: 'parent-bubble',
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
      },
      {
        listenerType: 'accepted-private-nested-click-parent-bubble-test'
      }
    );
  const targetRecord =
    componentTree.createPrivateRootHostOutputEventTargetRecord(
      fixture.hostOutputPayload,
      {
        targetNode: fixture.targetNode
      }
    );
  const captureDispatchRecord = createPrivateClickDispatchRecord(
    fixture,
    'capture'
  );
  const bubbleDispatchRecord = createPrivateClickDispatchRecord(
    fixture,
    'bubble'
  );
  const acceptedInputOrder = [
    parentBubbleRecord,
    childCaptureRecord,
    childBubbleRecord,
    parentCaptureRecord
  ];

  try {
    const orderRecord =
      pluginEventSystem.invokePrivateClickEventDelegationAcceptedListenerOrder(
        [captureDispatchRecord, bubbleDispatchRecord],
        acceptedInputOrder,
        {
          requireRootRenderMetadata: true,
          rootHostOutputEventTargetRecord: targetRecord
        }
      );
    const payload =
      pluginEventSystem
        .getPrivateClickEventDelegationAcceptedListenerOrderPayload(
          orderRecord
        );
    const targetPayload =
      componentTree.getPrivateRootHostOutputEventTargetRecordPayload(
        targetRecord
      );

    assert.equal(orderRecord.acceptedListenerCount, 4);
    assert.equal(orderRecord.listenerInvocationCount, 4);
    assert.equal(orderRecord.dispatchRecordCount, 2);
    assert.equal(orderRecord.targetDispatchPathLength, 2);
    assert.equal(orderRecord.nestedDispatchPath, true);
    assert.equal(orderRecord.targetInst, fixture.childToken);
    assert.deepEqual(orderRecord.phases, [
      'capture',
      'capture',
      'bubble',
      'bubble'
    ]);
    assert.deepEqual(orderRecord.registrationNames, [
      'onClickCapture',
      'onClickCapture',
      'onClick',
      'onClick'
    ]);
    assert.equal(orderRecord.ownerRootRequired, true);
    assert.equal(orderRecord.ownerRootPreserved, true);
    assert.equal(
      orderRecord.ownerRootStatus,
      'validated-private-click-owner-root'
    );
    assert.equal(orderRecord.dispatchRecordOwnerRootMatchCount, 2);
    assert.equal(orderRecord.dispatchRecordOwnerRootMismatchCount, 0);
    assert.equal(orderRecord.acceptedListenerOwnerRootMatchCount, 4);
    assert.equal(orderRecord.acceptedListenerOwnerRootMismatchCount, 0);
    assert.equal(orderRecord.targetRootOwnerMatchCount, 2);
    assert.equal(orderRecord.targetRootOwnerMismatchCount, 0);
    assert.equal(orderRecord.targetDispatchPathOwnerRootPreserved, true);
    assert.equal(orderRecord.rootRenderMetadataAvailable, true);
    assert.equal(orderRecord.rootRenderHostOutputActive, true);
    assert.equal(orderRecord.publicDispatchEnabled, false);
    assert.equal(orderRecord.publicDispatchBlocked, true);
    assert.equal(orderRecord.browserDomEventCompatibilityClaimed, false);
    assert.equal(orderRecord.compatibilityClaimed, false);
    assert.equal(orderRecord.syntheticEventCount, 0);
    assert.equal(orderRecord.eventDispatch, false);
    assert.equal(orderRecord.willDispatchPublicEvent, false);
    assert.deepEqual(
      orderRecord.acceptedListenerOrder.map(entry => [
        entry.phase,
        entry.registrationName,
        entry.currentTarget,
        entry.dispatchPathIndex,
        entry.targetInst,
        entry.listenerQueueIndex
      ]),
      [
        [
          'capture',
          'onClickCapture',
          fixture.parentNode,
          1,
          fixture.parentToken,
          parentCaptureRecord.listenerQueueIndex
        ],
        [
          'capture',
          'onClickCapture',
          fixture.targetNode,
          0,
          fixture.childToken,
          childCaptureRecord.listenerQueueIndex
        ],
        [
          'bubble',
          'onClick',
          fixture.targetNode,
          0,
          fixture.childToken,
          childBubbleRecord.listenerQueueIndex
        ],
        [
          'bubble',
          'onClick',
          fixture.parentNode,
          1,
          fixture.parentToken,
          parentBubbleRecord.listenerQueueIndex
        ]
      ]
    );
    assert.deepEqual(calls, [
      {
        currentTarget: fixture.parentNode,
        phase: 'parent-capture',
        registrationName: 'onClickCapture',
        target: fixture.targetNode,
        targetInst: fixture.parentToken,
        type: 'click'
      },
      {
        currentTarget: fixture.targetNode,
        phase: 'child-capture',
        registrationName: 'onClickCapture',
        target: fixture.targetNode,
        targetInst: fixture.childToken,
        type: 'click'
      },
      {
        currentTarget: fixture.targetNode,
        phase: 'child-bubble',
        registrationName: 'onClick',
        target: fixture.targetNode,
        targetInst: fixture.childToken,
        type: 'click'
      },
      {
        currentTarget: fixture.parentNode,
        phase: 'parent-bubble',
        registrationName: 'onClick',
        target: fixture.targetNode,
        targetInst: fixture.parentToken,
        type: 'click'
      }
    ]);
    assert.deepEqual(payload.dispatchRecords, [
      captureDispatchRecord,
      bubbleDispatchRecord
    ]);
    assert.deepEqual(
      payload.acceptedListenerQueueEntryRecords,
      acceptedInputOrder
    );
    assert.deepEqual(
      payload.selections.map(selection => [
        selection.dispatchRecordIndex,
        selection.listenerIndex
      ]),
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1]
      ]
    );
    assert.equal(payload.ownerRootMetadata.ownerRootPreserved, true);
    assert.equal(payload.targetRecord, targetRecord);
    assert.equal(targetRecord.isSourceHostNode, false);
    assert.equal(targetPayload.hostOutputPayload, fixture.hostOutputPayload);
    assert.equal(targetPayload.targetNode, fixture.targetNode);
    assert.equal(fixture.parentNode.__registrations.length, 0);
    assert.equal(fixture.targetNode.__registrations.length, 0);
    assert.equal(fixture.container.__registrations.length, 138);
    assert.equal(fixture.document.__registrations.length, 1);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      parentCaptureRecord
    );
    listenerRegistry.removePrivateEventListenerQueueEntry(
      childCaptureRecord
    );
    listenerRegistry.removePrivateEventListenerQueueEntry(childBubbleRecord);
    listenerRegistry.removePrivateEventListenerQueueEntry(parentBubbleRecord);
    cleanupPrivateRootRenderClickDelegationFixture(fixture);
  }
});

test('private nested click event delegation accepted order rejects stale listener records before invoking', () => {
  const fixture = createPrivateNestedRootRenderClickDelegationFixture(
    'nested-click-order-stale'
  );
  const calls = [];
  const staleRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.parentNode,
      'click',
      true,
      () => {
        calls.push('stale-parent-capture-invoked');
      }
    );
  const childBubbleRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      () => {
        calls.push('child-bubble-invoked');
      }
    );
  const captureDispatchRecord = createPrivateClickDispatchRecord(
    fixture,
    'capture'
  );
  const bubbleDispatchRecord = createPrivateClickDispatchRecord(
    fixture,
    'bubble'
  );

  try {
    listenerRegistry.removePrivateEventListenerQueueEntry(staleRecord);

    assert.throws(
      () =>
        pluginEventSystem
          .invokePrivateClickEventDelegationAcceptedListenerOrder(
            [captureDispatchRecord, bubbleDispatchRecord],
            [staleRecord, childBubbleRecord]
          ),
      {
        code:
          pluginEventSystem
            .INVALID_PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_CODE,
        reason: 'stale-listener-record'
      }
    );
    assert.deepEqual(calls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(staleRecord);
    listenerRegistry.removePrivateEventListenerQueueEntry(childBubbleRecord);
    cleanupPrivateRootRenderClickDelegationFixture(fixture);
  }
});

test('private nested click event delegation accepted order rejects foreign owner records before invoking', () => {
  const source = createPrivateNestedRootRenderClickDelegationFixture(
    'nested-click-order-source'
  );
  const foreign = createPrivateNestedRootRenderClickDelegationFixture(
    'nested-click-order-foreign'
  );
  const calls = [];
  const sourceBubbleRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      source.targetNode,
      'click',
      false,
      () => {
        calls.push('source-child-bubble-invoked');
      }
    );
  const foreignCaptureRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      foreign.parentNode,
      'click',
      true,
      () => {
        calls.push('foreign-parent-capture-invoked');
      }
    );
  const sourceCaptureDispatchRecord = createPrivateClickDispatchRecord(
    source,
    'capture'
  );
  const sourceBubbleDispatchRecord = createPrivateClickDispatchRecord(
    source,
    'bubble'
  );
  const targetRecord =
    componentTree.createPrivateRootHostOutputEventTargetRecord(
      source.hostOutputPayload,
      {
        targetNode: source.targetNode
      }
    );

  try {
    assert.throws(
      () =>
        pluginEventSystem
          .invokePrivateClickEventDelegationAcceptedListenerOrder(
            [sourceCaptureDispatchRecord, sourceBubbleDispatchRecord],
            [sourceBubbleRecord, foreignCaptureRecord],
            {
              rootHostOutputEventTargetRecord: targetRecord
            }
          ),
      {
        code:
          pluginEventSystem
            .INVALID_PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_CODE,
        reason: 'foreign-owner-root'
      }
    );
    assert.deepEqual(calls, []);
    assert.equal(source.parentNode.__registrations.length, 0);
    assert.equal(source.targetNode.__registrations.length, 0);
    assert.equal(foreign.parentNode.__registrations.length, 0);
    assert.equal(foreign.targetNode.__registrations.length, 0);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      sourceBubbleRecord
    );
    listenerRegistry.removePrivateEventListenerQueueEntry(
      foreignCaptureRecord
    );
    cleanupPrivateRootRenderClickDelegationFixture(source);
    cleanupPrivateRootRenderClickDelegationFixture(foreign);
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

test('private root listener currentness gate records source-owned listener evidence only', () => {
  const document = createDocument();
  const container = createNode('DIV', document);
  const sourceRecord = {
    operation: 'createRoot',
    requestId: 'root-listener-currentness:create',
    requestType: 'createRoot'
  };
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(container);

  try {
    const gate =
      rootListeners.createPrivateRootListenerCurrentnessGateRecord(
        rootRegistration,
        {
          sourceKind: 'createRoot',
          sourceRecord
        }
      );
    const payload =
      rootListeners.getPrivateRootListenerCurrentnessGatePayload(gate);
    const clickRows = gate.listenerRows.filter(
      row => row.domEventName === 'click'
    );
    const selectionChangeRows = gate.listenerRows.filter(
      row =>
        row.targetRole === 'owner-document' &&
        row.domEventName === 'selectionchange'
    );

    assert.equal(
      gate.kind,
      'FastReactDomPrivateRootListenerCurrentnessGateRecord'
    );
    assert.equal(
      gate.status,
      rootListeners.PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_STATUS
    );
    assert.equal(
      gate.$$typeof,
      rootListeners.privateRootListenerCurrentnessGateRecordType
    );
    assert.equal(
      rootListeners.isPrivateRootListenerCurrentnessGateRecord(gate),
      true
    );
    assert.equal(gate.sourceKind, 'createRoot');
    assert.equal(gate.sourceOwned, true);
    assert.equal(gate.currentRegistration, true);
    assert.equal(gate.registrationActive, true);
    assert.equal(gate.registrationCount, 139);
    assert.equal(gate.rootRegistrationCount, 138);
    assert.equal(gate.ownerDocumentRegistrationCount, 1);
    assert.equal(gate.listenerRowCount, 139);
    assert.equal(gate.currentListenerRowCount, 139);
    assert.equal(gate.rootListenerRowCount, 138);
    assert.equal(gate.ownerDocumentListenerRowCount, 1);
    assert.equal(gate.ownerDocumentSelectionChangeCurrent, true);
    assert.equal(gate.ownerDocumentSelectionChangeRowCount, 1);
    assert.equal(gate.sameContainerDedupeCurrent, false);
    assert.equal(gate.sameDocumentDedupeCurrent, false);
    assert.equal(gate.listenerStateStable, true);
    assert.equal(gate.gateInstalledBrowserListener, false);
    assert.equal(gate.listenerInstallation, false);
    assert.equal(gate.eventDispatch, false);
    assert.equal(gate.syntheticEventDispatch, false);
    assert.equal(gate.willDispatchPublicEvent, false);
    assert.equal(gate.publicDispatchEnabled, false);
    assert.equal(gate.publicRootBehaviorChanged, false);
    assert.equal(gate.browserDomEventCompatibilityClaimed, false);
    assert.equal(gate.compatibilityClaimed, false);
    assert.deepEqual(clickRows.map(row => row.phase).sort(), [
      'bubble',
      'capture'
    ]);
    assert.equal(selectionChangeRows.length, 1);
    assert.equal(selectionChangeRows[0].phase, 'bubble');
    assert.equal(selectionChangeRows[0].current, true);
    assert.equal(
      gate.listenerRows.every(row =>
        row.current === true &&
        row.sourceOwned === true &&
        row.compatibilityClaimed === false &&
        row.browserDomEventCompatibilityClaimed === false &&
        row.eventDispatch === false &&
        row.gateInstalledBrowserListener === false &&
        row.publicRootBehaviorChanged === false
      ),
      true
    );
    assert.equal(
      gate.targetRows.every(row =>
        row.current === true &&
        row.compatibilityClaimed === false &&
        row.browserDomEventCompatibilityClaimed === false &&
        row.eventDispatch === false &&
        row.gateInstalledBrowserListener === false &&
        row.publicRootBehaviorChanged === false
      ),
      true
    );
    assert.equal(payload.listenerRegistrationRecord, rootRegistration);
    assert.equal(payload.sourceRecord, sourceRecord);
    assert.equal(payload.beforeState.listenerRows.length, 139);
    assert.equal(payload.afterState.listenerRows.length, 139);

    const hydrateGate =
      rootListeners.createPrivateRootListenerCurrentnessGateRecord(
        rootRegistration,
        {
          sourceKind: 'hydrateRoot',
          sourceRecord: {
            facadeCall: 'hydrateRoot',
            operation: 'hydrate-root-marker-listener-preflight',
            requestType: 'hydrateRoot'
          }
        }
      );
    assert.equal(hydrateGate.sourceKind, 'hydrateRoot');
    assert.equal(hydrateGate.sourceRequestType, 'hydrateRoot');
    assert.equal(hydrateGate.currentRegistration, true);
    assert.equal(hydrateGate.publicRootBehaviorChanged, false);
    assert.equal(hydrateGate.eventDispatch, false);
    assert.equal(hydrateGate.browserDomEventCompatibilityClaimed, false);
    assert.equal(hydrateGate.compatibilityClaimed, false);
    assert.equal(container.__registrations.length, 138);
    assert.equal(document.__registrations.length, 1);
  } finally {
    rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
  }
});

test('private root listener currentness gate records same-container and same-document dedupe evidence', () => {
  const document = createDocument();
  const firstContainer = createNode('DIV', document);
  const secondContainer = createNode('SECTION', document);
  const firstRegistration =
    rootListeners.registerRootListenersForPrivateRoot(firstContainer);
  const sameContainerRegistration =
    rootListeners.registerRootListenersForPrivateRoot(firstContainer);
  const sameDocumentRegistration =
    rootListeners.registerRootListenersForPrivateRoot(secondContainer);

  try {
    const sameContainerGate =
      rootListeners.createPrivateRootListenerCurrentnessGateRecord(
        sameContainerRegistration,
        {
          sourceKind: 'createRoot',
          sourceRecord: {
            operation: 'createRoot',
            requestType: 'createRoot'
          }
        }
      );
    const sameDocumentGate =
      rootListeners.createPrivateRootListenerCurrentnessGateRecord(
        sameDocumentRegistration,
        {
          sourceKind: 'portal',
          sourceRecord: {
            operation: 'preparePortalMount',
            requestType: 'root.render'
          }
        }
      );
    const sameContainerPayload =
      rootListeners.getPrivateRootListenerCurrentnessGatePayload(
        sameContainerGate
      );
    const sameDocumentPayload =
      rootListeners.getPrivateRootListenerCurrentnessGatePayload(
        sameDocumentGate
      );

    assert.equal(sameContainerGate.registrationCount, 0);
    assert.equal(sameContainerGate.rootRegistrationCount, 0);
    assert.equal(sameContainerGate.ownerDocumentRegistrationCount, 0);
    assert.equal(sameContainerGate.listenerRowCount, 0);
    assert.equal(sameContainerGate.currentListenerRowCount, 0);
    assert.equal(sameContainerGate.sameContainerDedupeCurrent, true);
    assert.equal(sameContainerGate.sameContainerDedupeRowCount, 1);
    assert.equal(sameContainerGate.sameDocumentDedupeCurrent, true);
    assert.equal(sameContainerGate.sameDocumentDedupeRowCount, 1);
    assert.equal(
      sameContainerGate.targetRows.find(
        row => row.targetRole === 'root-container'
      ).sameContainerDedupeEvidence,
      true
    );
    assert.equal(
      sameContainerGate.targetRows.find(
        row => row.targetRole === 'owner-document'
      ).sameDocumentDedupeEvidence,
      true
    );

    assert.equal(sameDocumentGate.sourceKind, 'portal');
    assert.equal(sameDocumentGate.registrationCount, 138);
    assert.equal(sameDocumentGate.rootRegistrationCount, 138);
    assert.equal(sameDocumentGate.ownerDocumentRegistrationCount, 0);
    assert.equal(sameDocumentGate.listenerRowCount, 138);
    assert.equal(sameDocumentGate.ownerDocumentSelectionChangeCurrent, true);
    assert.equal(sameDocumentGate.ownerDocumentSelectionChangeRowCount, 0);
    assert.equal(sameDocumentGate.sameContainerDedupeCurrent, false);
    assert.equal(sameDocumentGate.sameDocumentDedupeCurrent, true);
    assert.equal(sameDocumentGate.sameDocumentDedupeRowCount, 1);
    assert.equal(
      sameDocumentGate.targetRows.find(
        row => row.targetRole === 'owner-document'
      ).ownerDocumentSelectionChangeDedupeEvidence,
      true
    );
    assert.equal(
      sameContainerPayload.listenerRegistrationRecord,
      sameContainerRegistration
    );
    assert.equal(
      sameDocumentPayload.listenerRegistrationRecord,
      sameDocumentRegistration
    );
    assert.equal(firstContainer.__registrations.length, 138);
    assert.equal(secondContainer.__registrations.length, 138);
    assert.equal(document.__registrations.length, 1);
  } finally {
    rootListeners.revertRootListenersForPrivateRoot(
      sameDocumentRegistration
    );
    rootListeners.revertRootListenersForPrivateRoot(
      sameContainerRegistration
    );
    rootListeners.revertRootListenersForPrivateRoot(firstRegistration);
  }
});

test('private root listener currentness gate rejects cloned stale aliased and mutating evidence', () => {
  const cloneFixture = createPrivateRootListenerCurrentnessFixture(
    'root-listener-currentness-clone'
  );
  try {
    assert.throws(
      () =>
        rootListeners.createPrivateRootListenerCurrentnessGateRecord(
          {...cloneFixture.rootRegistration},
          {
            sourceKind: 'createRoot'
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE,
        reason: 'invalid-registration-record'
      }
    );
  } finally {
    rootListeners.revertRootListenersForPrivateRoot(
      cloneFixture.rootRegistration
    );
  }

  const staleFixture = createPrivateRootListenerCurrentnessFixture(
    'root-listener-currentness-stale'
  );
  rootListeners.revertRootListenersForPrivateRoot(
    staleFixture.rootRegistration
  );
  assert.throws(
    () =>
      rootListeners.createPrivateRootListenerCurrentnessGateRecord(
        staleFixture.rootRegistration,
        {
          sourceKind: 'createRoot'
        }
      ),
    {
      code:
        rootListeners
          .INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE,
      reason: 'stale-registration-record'
    }
  );

  const aliasFixture = createPrivateRootListenerCurrentnessFixture(
    'root-listener-currentness-alias'
  );
  try {
    assert.throws(
      () =>
        rootListeners.createPrivateRootListenerCurrentnessGateRecord(
          aliasFixture.rootRegistration,
          {
            sourceKind: 'createRoot',
            sourceRecord: {
              facadeCall: 'hydrateRoot',
              requestType: 'hydrateRoot'
            }
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE,
        reason: 'source-kind-alias-mismatch'
      }
    );
    assert.throws(
      () =>
        rootListeners.createPrivateRootListenerCurrentnessGateRecord(
          aliasFixture.rootRegistration,
          {
            sourceKind: 'hydrateRoot',
            sourceRecord: {
              kind: 'FastReactDomHydrationReplayEventQueueDiagnostic',
              operation: 'private-hydration-replay-target-dispatch-link',
              requestType: 'hydrateRoot',
              status: 'controlled-private-hydration-replay-target-dispatch-link'
            }
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE,
        reason: 'hydration-replay-source-alias'
      }
    );
    assert.throws(
      () =>
        rootListeners.createPrivateRootListenerCurrentnessGateRecord(
          aliasFixture.rootRegistration,
          {
            sourceKind: 'hydrateRoot',
            sourceRecord: {
              facadeCall: 'createRoot',
              requestType: 'createRoot'
            }
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE,
        reason: 'source-kind-alias-mismatch'
      }
    );
    assert.throws(
      () =>
        rootListeners.createPrivateRootListenerCurrentnessGateRecord(
          aliasFixture.rootRegistration,
          {
            eventDispatch: true,
            sourceKind: 'createRoot'
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE,
        reason: 'public-behavior-claimed'
      }
    );

    const beforeMutationRegistrationCount =
      aliasFixture.container.__registrations.length;
    assert.throws(
      () =>
        rootListeners.createPrivateRootListenerCurrentnessGateRecord(
          aliasFixture.rootRegistration,
          {
            afterDiagnosticsHook() {
              aliasFixture.container.__registrations.push({
                listener() {},
                options: false,
                type: 'click'
              });
            },
            sourceKind: 'createRoot'
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE,
        reason: 'listener-state-mutated-during-diagnostics'
      }
    );
    aliasFixture.container.__registrations.length =
      beforeMutationRegistrationCount;
    assert.equal(aliasFixture.container.__registrations.length, 138);
    assert.equal(aliasFixture.document.__registrations.length, 1);
  } finally {
    rootListeners.revertRootListenersForPrivateRoot(
      aliasFixture.rootRegistration
    );
  }
});

test('private root click and focus dispatch gates reject missing currentness before invoking', () => {
  const clickFixture = createPrivateClickDelegationFixture(
    'click-gate-missing-currentness'
  );
  const clickCalls = [];
  const clickListenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      clickFixture.targetNode,
      'click',
      false,
      () => {
        clickCalls.push('missing-click-currentness-invoked');
      }
    );
  const clickRootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(clickFixture.container);

  try {
    assert.throws(
      () =>
        rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
          clickRootRegistration,
          clickFixture.hostOutputPayload,
          clickListenerRecord
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
        reason: 'missing-root-listener-currentness-gate'
      }
    );
    assert.deepEqual(clickCalls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      clickListenerRecord
    );
    rootListeners.revertRootListenersForPrivateRoot(clickRootRegistration);
    componentTree.detachHostInstanceToken(clickFixture.token);
  }

  const focusFixture = createPrivateFocusBlurDelegationFixture(
    'focus-gate-missing-currentness'
  );
  const focusCalls = [];
  const focusListenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      focusFixture.targetNode,
      'focusin',
      false,
      () => {
        focusCalls.push('missing-focus-currentness-invoked');
      }
    );
  const focusRootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(focusFixture.container);

  try {
    assert.throws(
      () =>
        rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
          focusRootRegistration,
          focusFixture.hostOutputPayload,
          focusListenerRecord
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
        reason: 'missing-root-listener-currentness-gate'
      }
    );
    assert.deepEqual(focusCalls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      focusListenerRecord
    );
    rootListeners.revertRootListenersForPrivateRoot(focusRootRegistration);
    componentTree.detachHostInstanceToken(focusFixture.token);
  }
});

test('private root click dispatch gate rejects cloned and foreign currentness before invoking', () => {
  const fixture = createPrivateClickDelegationFixture(
    'click-gate-currentness-source'
  );
  const foreignFixture = createPrivateClickDelegationFixture(
    'click-gate-currentness-foreign'
  );
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      () => {
        calls.push('invalid-currentness-invoked');
      }
    );
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(fixture.container);
  const foreignRootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(
      foreignFixture.container
    );
  const rootCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    rootRegistration,
    'click-gate-currentness-source'
  );
  const foreignCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    foreignRootRegistration,
    'click-gate-currentness-foreign'
  );

  try {
    assert.throws(
      () =>
        rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
          rootRegistration,
          fixture.hostOutputPayload,
          listenerRecord,
          {
            rootListenerCurrentnessGateRecord: {
              ...rootCurrentnessGate
            }
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
        reason: 'invalid-root-listener-currentness-gate'
      }
    );

    assert.throws(
      () =>
        rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
          rootRegistration,
          fixture.hostOutputPayload,
          listenerRecord,
          {
            rootListenerCurrentnessGateRecord: foreignCurrentnessGate
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
        reason: 'root-listener-currentness-registration-mismatch'
      }
    );
    assert.deepEqual(calls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);
    rootListeners.revertRootListenersForPrivateRoot(
      foreignRootRegistration
    );
    rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
    componentTree.detachHostInstanceToken(foreignFixture.token);
    componentTree.detachHostInstanceToken(fixture.token);
  }
});

test('private root click dispatch gate rejects listener registration changes after currentness capture', () => {
  const fixture = createPrivateClickDelegationFixture(
    'click-gate-currentness-changed'
  );
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      () => {
        calls.push('changed-currentness-invoked');
      }
    );
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(fixture.container);
  const rootCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    rootRegistration,
    'click-gate-currentness-changed'
  );
  const registrationCountBeforeMutation =
    fixture.container.__registrations.length;

  try {
    fixture.container.__registrations.push({
      listener() {},
      options: false,
      type: 'click'
    });

    assert.throws(
      () =>
        rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
          rootRegistration,
          fixture.hostOutputPayload,
          listenerRecord,
          {
            rootListenerCurrentnessGateRecord: rootCurrentnessGate
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
        reason: 'root-listener-currentness-changed-after-capture'
      }
    );
    assert.deepEqual(calls, []);
  } finally {
    fixture.container.__registrations.length =
      registrationCountBeforeMutation;
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);
    rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
    componentTree.detachHostInstanceToken(fixture.token);
  }
});

test('private root focus/blur dispatch execution rejects stale registrations and missing root shells before invoking', () => {
  const staleFixture = createPrivateFocusBlurDelegationFixture(
    'focus-gate-stale-registration'
  );
  const staleCalls = [];
  const staleListenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      staleFixture.targetNode,
      'focusin',
      false,
      () => {
        staleCalls.push('stale-registration-invoked');
      }
    );
  const staleRootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(staleFixture.container);
  const staleCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    staleRootRegistration,
    'focus-gate-stale-registration'
  );

  rootListeners.revertRootListenersForPrivateRoot(staleRootRegistration);
  try {
    assert.throws(
      () =>
        rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
          staleRootRegistration,
          staleFixture.hostOutputPayload,
          staleListenerRecord,
          {
            domEventName: 'focusin',
            rootListenerCurrentnessGateRecord: staleCurrentnessGate
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
        reason: 'stale-registration-record'
      }
    );
    assert.deepEqual(staleCalls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      staleListenerRecord
    );
    componentTree.detachHostInstanceToken(staleFixture.token);
  }

  const shellFixture = createPrivateFocusBlurDelegationFixture(
    'focus-gate-missing-shells'
  );
  const shellCalls = [];
  const shellListenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      shellFixture.targetNode,
      'focusout',
      false,
      () => {
        shellCalls.push('missing-shell-invoked');
      }
    );
  const firstRootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(shellFixture.container);
  const sameContainerRootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(shellFixture.container);
  const sameContainerCurrentnessGate =
    createPrivateRootDispatchCurrentnessGate(
      sameContainerRootRegistration,
      'focus-gate-missing-shells'
    );

  try {
    assert.equal(sameContainerCurrentnessGate.registrationCount, 0);
    assert.equal(
      sameContainerCurrentnessGate.sameContainerDedupeCurrent,
      true
    );
    assert.throws(
      () =>
        rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
          sameContainerRootRegistration,
          shellFixture.hostOutputPayload,
          shellListenerRecord,
          {
            domEventName: 'focusout',
            rootListenerCurrentnessGateRecord:
              sameContainerCurrentnessGate
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
        reason: 'missing-root-listener-shell'
      }
    );
    assert.deepEqual(shellCalls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      shellListenerRecord
    );
    rootListeners.revertRootListenersForPrivateRoot(
      sameContainerRootRegistration
    );
    rootListeners.revertRootListenersForPrivateRoot(firstRootRegistration);
    componentTree.detachHostInstanceToken(shellFixture.token);
  }
});

test('private root focus/blur dispatch execution rejects forged currentness listener and phase aliases before invoking', () => {
  const fixture = createPrivateFocusBlurDelegationFixture(
    'focus-gate-currentness-source'
  );
  const foreignFixture = createPrivateFocusBlurDelegationFixture(
    'focus-gate-currentness-foreign'
  );
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'focusin',
      false,
      () => {
        calls.push('invalid-focus-currentness-invoked');
      }
    );
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(fixture.container);
  const foreignRootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(
      foreignFixture.container
    );
  const rootCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    rootRegistration,
    'focus-gate-currentness-source'
  );
  const foreignCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    foreignRootRegistration,
    'focus-gate-currentness-foreign'
  );
  const registrationCountBeforeMutation =
    fixture.container.__registrations.length;

  try {
    assert.throws(
      () =>
        rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
          rootRegistration,
          fixture.hostOutputPayload,
          listenerRecord,
          {
            domEventName: 'focusin',
            rootListenerCurrentnessGateRecord: {
              ...rootCurrentnessGate
            }
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
        reason: 'invalid-root-listener-currentness-gate'
      }
    );

    assert.throws(
      () =>
        rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
          rootRegistration,
          fixture.hostOutputPayload,
          listenerRecord,
          {
            domEventName: 'focusin',
            rootListenerCurrentnessGateRecord: foreignCurrentnessGate
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
        reason: 'root-listener-currentness-registration-mismatch'
      }
    );

    fixture.container.__registrations.push({
      listener() {},
      options: false,
      type: 'focusin'
    });
    assert.throws(
      () =>
        rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
          rootRegistration,
          fixture.hostOutputPayload,
          listenerRecord,
          {
            domEventName: 'focusin',
            rootListenerCurrentnessGateRecord: rootCurrentnessGate
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
        reason: 'root-listener-currentness-changed-after-capture'
      }
    );
    fixture.container.__registrations.length =
      registrationCountBeforeMutation;

    assert.throws(
      () =>
        rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
          rootRegistration,
          fixture.hostOutputPayload,
          {...listenerRecord},
          {
            domEventName: 'focusin',
            rootListenerCurrentnessGateRecord: rootCurrentnessGate
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
        reason: 'stale-listener-record'
      }
    );

    assert.throws(
      () =>
        rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
          rootRegistration,
          fixture.hostOutputPayload,
          listenerRecord,
          {
            domEventName: 'focusin',
            phase: 'capture',
            rootListenerCurrentnessGateRecord: rootCurrentnessGate
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
        reason: 'unsupported-event-phase'
      }
    );

    assert.throws(
      () =>
        rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
          rootRegistration,
          fixture.hostOutputPayload,
          listenerRecord,
          {
            domEventName: 'focusout',
            rootListenerCurrentnessGateRecord: rootCurrentnessGate
          }
        ),
      {
        code:
          rootListeners
            .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
        reason: 'unsupported-event-type'
      }
    );
    assert.deepEqual(calls, []);
  } finally {
    fixture.container.__registrations.length =
      registrationCountBeforeMutation;
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);
    rootListeners.revertRootListenersForPrivateRoot(
      foreignRootRegistration
    );
    rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
    componentTree.detachHostInstanceToken(foreignFixture.token);
    componentTree.detachHostInstanceToken(fixture.token);
  }
});

test('private root dispatch gates reject forged public synthetic and browser claims before invoking', () => {
  const fixture = createPrivateClickDelegationFixture(
    'click-gate-forged-claims'
  );
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'click',
      false,
      () => {
        calls.push('forged-click-claim-invoked');
      }
    );
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(fixture.container);
  const rootCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    rootRegistration,
    'click-gate-forged-claims'
  );
  const forgedClaimOptions = [
    {
      browserDomEventCompatibilityClaimed: true
    },
    {
      publicDispatchEnabled: true
    },
    {
      syntheticEventDispatch: true
    },
    {
      syntheticEventCount: 1
    },
    {
      packageCompatibilityClaimed: true
    },
    {
      syntheticEventCompatibilityClaimed: true
    }
  ];

  try {
    for (const forgedClaimOption of forgedClaimOptions) {
      assert.throws(
        () =>
          rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
            rootRegistration,
            fixture.hostOutputPayload,
            listenerRecord,
            {
              rootListenerCurrentnessGateRecord: rootCurrentnessGate,
              ...forgedClaimOption
            }
          ),
        {
          code:
            rootListeners
              .INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
          reason: 'public-behavior-claimed'
        }
      );
    }
    assert.deepEqual(calls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);
    rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
    componentTree.detachHostInstanceToken(fixture.token);
  }

  const focusFixture = createPrivateFocusBlurDelegationFixture(
    'focus-gate-forged-claims'
  );
  const focusCalls = [];
  const focusListenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      focusFixture.targetNode,
      'focusout',
      false,
      () => {
        focusCalls.push('forged-focus-claim-invoked');
      }
    );
  const focusRootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(focusFixture.container);
  const focusCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    focusRootRegistration,
    'focus-gate-forged-claims'
  );

  const focusForgedClaimOptions = [
    {
      packageCompatibilityClaimed: true
    },
    {
      publicEventCompatibilityClaimed: true
    },
    {
      syntheticEventCompatibilityClaimed: true
    },
    {
      syntheticFocusEventCreation: true
    },
    {
      willCreateSyntheticFocusEvent: true
    }
  ];

  try {
    for (const forgedClaimOption of focusForgedClaimOptions) {
      assert.throws(
        () =>
          rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
            focusRootRegistration,
            focusFixture.hostOutputPayload,
            focusListenerRecord,
            {
              domEventName: 'focusout',
              rootListenerCurrentnessGateRecord: focusCurrentnessGate,
              ...forgedClaimOption
            }
          ),
        {
          code:
            rootListeners
              .INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
          reason: 'public-behavior-claimed'
        }
      );
    }
    assert.deepEqual(focusCalls, []);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(
      focusListenerRecord
    );
    rootListeners.revertRootListenersForPrivateRoot(
      focusRootRegistration
    );
    componentTree.detachHostInstanceToken(focusFixture.token);
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
  const rootCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    rootRegistration,
    'click-gate-portal-child'
  );

  try {
    const gate =
      rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
        rootRegistration,
        fixture.hostOutputPayload,
        childListenerRecord,
        {
          rootListenerCurrentnessGateRecord: rootCurrentnessGate,
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
    assert.equal(
      gate.rootListenerCurrentnessGateStatus,
      rootListeners.PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_STATUS
    );
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

test('private click delegation preserves portal owner root across a secondary fake root', () => {
  const fixture = createPrivateClickPortalDelegationFixture(
    'click-gate-secondary-root-portal'
  );
  const secondaryRootOwner = {
    kind: 'click-gate-secondary-root:root'
  };
  const calls = [];
  let rootRegistration = null;
  let childListenerRecord = null;

  try {
    rootMarkers.markContainerAsRoot(
      secondaryRootOwner,
      fixture.portalContainer
    );
    childListenerRecord =
      listenerRegistry.registerPrivateEventListenerQueueEntry(
        fixture.targetNode,
        'click',
        false,
        event => {
          calls.push({
            currentTarget: event.currentTarget,
            target: event.target,
            targetInst: event.targetInst
          });
        },
        {
          listenerType: 'accepted-private-click-secondary-root-portal-test'
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
          portalKey: 'click-gate-secondary-root-portal',
          rootContainer: fixture.container
        }
    );
    rootRegistration =
      rootListeners.registerRootListenersForPrivateRoot(fixture.container);
    const rootCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
      rootRegistration,
      'click-gate-secondary-root-portal'
    );
    const gate =
      rootListeners.invokePrivateRootClickEventDelegationDispatchGate(
        rootRegistration,
        fixture.hostOutputPayload,
        childListenerRecord,
        {
          rootListenerCurrentnessGateRecord: rootCurrentnessGate,
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

    assert.equal(
      portalDispatch.targetDispatchPathRecord.containerRootBoundaryNode,
      fixture.portalContainer
    );
    assert.equal(
      portalDispatch.targetDispatchPathRecord.containerRootBoundaryOwner,
      secondaryRootOwner
    );
    assert.equal(
      portalDispatch.targetDispatchPathRecord
        .containerRootOwnerMatchesTargetRoot,
      false
    );
    assert.equal(
      portalDispatch.targetDispatchPathRecord
        .ownerRootPreservedAcrossForeignContainerRoot,
      true
    );
    assert.equal(
      portalDispatch.targetDispatchPathRecord.rootOwner,
      fixture.rootOwner
    );
    assert.equal(
      portalDispatch.targetDispatchPathRecord.targetRootOwnerMatchCount,
      2
    );
    assert.equal(
      portalDispatch.targetDispatchPathRecord.targetRootOwnerMismatchCount,
      0
    );

    assert.equal(portalOwnerGate.portalContainerContainsTarget, true);
    assert.equal(
      portalOwnerGate.portalContainerMatchesDispatchRootBoundary,
      true
    );
    assert.equal(portalOwnerGate.portalContainerOwnedBySecondaryRoot, true);
    assert.equal(portalOwnerGate.portalContainerRootOwnerPresent, true);
    assert.equal(
      portalOwnerGate.portalContainerRootOwnerMatchesPortalOwner,
      false
    );
    assert.equal(
      portalOwnerGate.ownerRootPreservedAcrossPortalContainerRoot,
      true
    );
    assert.equal(
      portalOwnerGate.ownerRootPreservedAcrossSecondaryPortalRoot,
      true
    );
    assert.equal(portalOwnerGate.publicPortalBubblingEnabled, false);
    assert.equal(portalOwnerGate.publicDispatchEnabled, false);
    assert.equal(portalOwnerGate.eventDispatch, false);
    assert.equal(portalOwnerGate.listenerInvocationCount, 0);
    assert.equal(portalOwnerGate.syntheticEventCount, 0);

    assert.equal(gate.listenerInvocationCount, 1);
    assert.equal(gate.privateListenerInvoked, true);
    assert.equal(
      payload.pluginGateRecord.portalContainerOwnedBySecondaryRoot,
      true
    );
    assert.equal(
      payload.pluginGateRecord.ownerRootPreservedAcrossSecondaryPortalRoot,
      true
    );
    assert.equal(gate.publicPortalBubblingEnabled, false);
    assert.equal(gate.publicDispatchEnabled, false);
    assert.equal(gate.eventDispatch, false);
    assert.equal(
      gate.rootListenerCurrentnessGateStatus,
      rootListeners.PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_STATUS
    );
    assert.equal(gate.syntheticEventCount, 0);
    assert.equal(
      pluginPayload.portalEventOwnerRootGateRecord,
      portalOwnerGate
    );
    assert.equal(
      pluginPayload.portalEventOwnerRootGateRecord.portalContainerRootBoundary
        .portalContainerRootOwner,
      secondaryRootOwner
    );
    assert.deepEqual(calls, [
      {
        currentTarget: fixture.targetNode,
        target: fixture.targetNode,
        targetInst: fixture.childToken
      }
    ]);
    assert.equal(fixture.portalContainer.__registrations.length, 0);
    assert.equal(fixture.parentNode.__registrations.length, 0);
    assert.equal(fixture.targetNode.__registrations.length, 0);
    assert.equal(fixture.container.__registrations.length, 138);
    assert.equal(
      rootMarkers.getContainerRoot(fixture.portalContainer),
      secondaryRootOwner
    );
  } finally {
    if (childListenerRecord !== null) {
      listenerRegistry.removePrivateEventListenerQueueEntry(
        childListenerRecord
      );
    }
    if (rootRegistration !== null) {
      rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
    }
    rootMarkers.unmarkContainerAsRoot(fixture.portalContainer);
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

test('private focus/blur dispatch execution routes one accepted fake focus listener', () => {
  const fixture = createPrivateFocusBlurDelegationFixture(
    'focus-blur-execution-route'
  );
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'focusin',
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          event,
          registrationName: event.registrationName,
          syntheticEvent: event.syntheticEvent,
          target: event.target,
          targetInst: event.targetInst,
          type: event.type
        });
        return 'accepted-focus';
      },
      {
        listenerType: 'accepted-private-focus-blur-execution-test'
      }
    );
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(fixture.container);
  const rootCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    rootRegistration,
    'focus-blur-execution-route'
  );

  try {
    const execution =
      rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
        rootRegistration,
        fixture.hostOutputPayload,
        listenerRecord,
        {
          domEventName: 'focusin',
          rootListenerCurrentnessGateRecord: rootCurrentnessGate
        }
      );
    const payload =
      rootListeners.getPrivateRootFocusBlurEventDispatchExecutionPayload(
        execution
      );
    const pluginPayload =
      pluginEventSystem.getPrivateFocusBlurEventDispatchExecutionPayload(
        payload.pluginExecutionRecord
      );

    assert.equal(
      execution.kind,
      rootListeners
        .PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_RECORD_KIND
    );
    assert.equal(
      execution.status,
      rootListeners.PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_STATUS
    );
    assert.equal(
      rootListeners.isPrivateRootFocusBlurEventDispatchExecutionRecord(
        execution
      ),
      true
    );
    assert.equal(execution.domEventName, 'focusin');
    assert.equal(execution.phase, 'bubble');
    assert.equal(execution.reactName, 'onFocus');
    assert.equal(execution.registrationName, 'onFocus');
    assert.equal(execution.syntheticEventType, 'focus');
    assert.equal(execution.eventPriorityName, 'DiscreteEventPriority');
    assert.equal(execution.listenerInvocationCount, 1);
    assert.equal(execution.privateListenerInvoked, true);
    assert.equal(execution.publicDispatchEnabled, false);
    assert.equal(execution.publicEventCompatibilityClaimed, false);
    assert.equal(execution.publicPackageCompatibilityClaimed, false);
    assert.equal(execution.publicRootBehaviorChanged, false);
    assert.equal(execution.publicSyntheticEventCompatibilityClaimed, false);
    assert.equal(execution.browserDomEventCompatibilityClaimed, false);
    assert.equal(execution.packageCompatibilityClaimed, false);
    assert.equal(execution.hydrationReplayQueued, false);
    assert.equal(execution.hydrationReplayStatus, 'blocked');
    assert.equal(
      execution.rootListenerCurrentnessGateStatus,
      rootListeners.PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_STATUS
    );
    assert.equal(execution.rootListenerCurrentnessSourceKind, 'createRoot');
    assert.equal(execution.rootListenerCurrentnessSourceOwned, true);
    assert.equal(execution.rootListenerShellPairCurrent, true);
    assert.equal(execution.rootListenerCaptureShellOwned, true);
    assert.equal(execution.rootListenerBubbleShellOwned, true);
    assert.equal(execution.syntheticEventCount, 0);
    assert.equal(execution.syntheticEventCompatibilityClaimed, false);
    assert.equal(execution.syntheticFocusEventCreation, false);
    assert.equal(execution.pluginDispatchMetadataSourceOwned, true);
    assert.equal(execution.sourceOwnedPluginDispatchMetadata, true);
    assert.equal(
      execution.pluginExecutionRecordKind,
      pluginEventSystem
        .PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_RECORD_KIND
    );
    assert.equal(
      execution.invocationRecordKind,
      pluginEventSystem.DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND
    );
    assert.equal(payload.acceptedListenerQueueEntryRecord, listenerRecord);
    assert.equal(
      payload.rootListenerCurrentnessGateRecord,
      rootCurrentnessGate
    );
    assert.equal(
      payload.rootListenerCurrentnessGatePayload.listenerRegistrationRecord,
      rootRegistration
    );
    assert.equal(
      payload.rootListenerShellBinding.captureListenerSetKey,
      execution.rootListenerCaptureSetKey
    );
    assert.equal(
      payload.rootListenerShellBinding.bubbleListenerSetKey,
      execution.rootListenerBubbleSetKey
    );
    assert.equal(payload.rootListenerShellBinding.shellPairCurrent, true);
    assert.equal(payload.dispatchRecord.domEventName, 'focusin');
    assert.equal(
      payload.dispatchRecord.extractionRecord.domEventName,
      'focusin'
    );
    assert.equal(payload.dispatchListenerRecord.privateListenerQueue, true);
    assert.equal(pluginPayload.dispatchRecord, payload.dispatchRecord);
    assert.equal(
      pluginPayload.dispatchListenerRecord,
      payload.dispatchListenerRecord
    );
    assert.equal(pluginPayload.listenerQueueEntryRecord, listenerRecord);
    assert.equal(
      payload.pluginExecutionRecord.sourceOwnedPluginDispatchMetadata,
      true
    );
    assert.equal(
      payload.pluginExecutionRecord.syntheticEventCompatibilityClaimed,
      false
    );
    assert.equal(
      payload.pluginExecutionRecord.packageCompatibilityClaimed,
      false
    );

    assert.deepEqual(calls.map(call => [
      call.type,
      call.registrationName,
      call.syntheticEvent,
      call.currentTarget,
      call.target,
      call.targetInst
    ]), [
      [
        'focusin',
        'onFocus',
        false,
        fixture.targetNode,
        fixture.targetNode,
        fixture.token
      ]
    ]);
    assert.equal(Object.isFrozen(calls[0].event), true);
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

test('private focus/blur dispatch execution routes capture blur through current root shells', () => {
  const fixture = createPrivateFocusBlurDelegationFixture(
    'focus-blur-execution-capture-blur'
  );
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      fixture.targetNode,
      'focusout',
      true,
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
        listenerType:
          'accepted-private-focus-blur-capture-execution-test'
      }
    );
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(fixture.container);
  const rootCurrentnessGate = createPrivateRootDispatchCurrentnessGate(
    rootRegistration,
    'focus-blur-execution-capture-blur'
  );

  try {
    const execution =
      rootListeners.invokePrivateRootFocusBlurEventDispatchExecution(
        rootRegistration,
        fixture.hostOutputPayload,
        listenerRecord,
        {
          domEventName: 'focusout',
          phase: 'capture',
          rootListenerCurrentnessGateRecord: rootCurrentnessGate
        }
      );
    const payload =
      rootListeners.getPrivateRootFocusBlurEventDispatchExecutionPayload(
        execution
      );

    assert.equal(execution.domEventName, 'focusout');
    assert.equal(execution.phase, 'capture');
    assert.equal(execution.inCapturePhase, true);
    assert.equal(execution.reactName, 'onBlur');
    assert.equal(execution.registrationName, 'onBlurCapture');
    assert.equal(execution.syntheticEventType, 'blur');
    assert.equal(execution.eventPriorityName, 'DiscreteEventPriority');
    assert.equal(execution.listenerInvocationCount, 1);
    assert.equal(execution.privateListenerInvoked, true);
    assert.equal(execution.rootListenerShellPairCurrent, true);
    assert.equal(
      execution.rootListenerSetKey,
      execution.rootListenerCaptureSetKey
    );
    assert.equal(execution.rootListenerCurrentnessSourceKind, 'createRoot');
    assert.equal(execution.publicDispatchEnabled, false);
    assert.equal(execution.publicEventCompatibilityClaimed, false);
    assert.equal(execution.publicPackageCompatibilityClaimed, false);
    assert.equal(execution.syntheticEventCompatibilityClaimed, false);
    assert.equal(execution.willCreateSyntheticFocusEvent, false);
    assert.equal(execution.willInvokePublicListeners, false);
    assert.equal(payload.rootListenerRecord.isCapturePhaseListener, true);
    assert.equal(payload.rootListenerShellBinding.shellPairCurrent, true);
    assert.equal(payload.dispatchRecord.domEventName, 'focusout');
    assert.equal(payload.dispatchListenerRecord.phase, 'capture');
    assert.equal(
      payload.pluginExecutionRecord.sourceOwnedPluginDispatchMetadata,
      true
    );

    assert.deepEqual(calls, [
      {
        currentTarget: fixture.targetNode,
        registrationName: 'onBlurCapture',
        target: fixture.targetNode,
        targetInst: fixture.token,
        type: 'focusout'
      }
    ]);
    assert.equal(fixture.targetNode.__registrations.length, 0);
    assert.equal(fixture.container.__registrations.length, 138);
    assert.equal(fixture.document.__registrations.length, 1);
  } finally {
    listenerRegistry.removePrivateEventListenerQueueEntry(listenerRecord);
    rootListeners.revertRootListenersForPrivateRoot(rootRegistration);
    componentTree.detachHostInstanceToken(fixture.token);
  }
});

test('private focus/blur dispatch execution rejects portal owner mismatch before invoking', () => {
  const source = createPrivateFocusBlurDelegationFixture(
    'focus-blur-execution-portal-a'
  );
  const foreign = createPrivateFocusBlurDelegationFixture(
    'focus-blur-execution-portal-b'
  );
  const calls = [];
  const listenerRecord =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      source.targetNode,
      'focusout',
      false,
      () => {
        calls.push('portal-mismatch-invoked');
      }
    );
  const sourceDispatch = createPrivateFocusBlurDispatchRecord(
    source,
    'focusout',
    'bubble'
  );
  const sourceListenerRecord = findPrivateQueueDispatchListenerRecord(
    sourceDispatch,
    listenerRecord
  );
  const foreignDispatch = createPrivateFocusBlurDispatchRecord(
    foreign,
    'focusout',
    'bubble'
  );
  const foreignPortalGate =
    pluginEventSystem.createPortalEventOwnerRootGateRecord(
      foreignDispatch.targetDispatchPathRecord,
      {
        domEventName: 'focusout',
        ownerRoot: foreign.rootOwner,
        portalContainer: foreign.container,
        rootContainer: foreign.container
      }
    );

  try {
    assert.throws(
      () =>
        pluginEventSystem.invokePrivateFocusBlurEventDispatchExecutionRecord(
          sourceDispatch,
          sourceListenerRecord,
          {
            portalEventOwnerRootGateRecord: foreignPortalGate
          }
        ),
      {
        code:
          pluginEventSystem
            .INVALID_PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
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

function createPrivateRootDispatchCurrentnessGate(
  rootRegistration,
  label,
  sourceKind = 'createRoot'
) {
  return rootListeners.createPrivateRootListenerCurrentnessGateRecord(
    rootRegistration,
    {
      sourceKind,
      sourceRecord: {
        operation: sourceKind,
        requestId: `${label}:root-listener-currentness`,
        requestType: sourceKind
      }
    }
  );
}

function createPrivateRootListenerCurrentnessFixture(label) {
  const document = createDocument();
  const container = createNode('DIV', document);
  return {
    container,
    document,
    rootRegistration:
      rootListeners.registerRootListenersForPrivateRoot(container),
    sourceRecord: {
      operation: 'createRoot',
      requestId: `${label}:create`,
      requestType: 'createRoot'
    }
  };
}

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

function createPrivateRootRenderClickDelegationFixture(label) {
  const document = createDocument();
  const container = createNode('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: `${label}:admission`,
    initialHostOutputIdPrefix: `${label}:output`,
    requestIdPrefix: `${label}:request`,
    rootIdPrefix: `${label}:root`,
    sideEffectIdPrefix: `${label}:side-effect`,
    updateIdPrefix: `${label}:update`
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const element = {
    props: {
      children: `${label} target`,
      id: `${label}-target`,
      title: 'Private root-render delegated click target'
    },
    type: 'button'
  };
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);

  return {
    bridge,
    container,
    create,
    document,
    element,
    handoff,
    hostOutputPayload,
    render,
    rootOwner: hostOutputPayload.rootOwner,
    sideEffects,
    targetNode: hostOutputPayload.hostNode,
    token: hostOutputPayload.hostToken
  };
}

function createPrivateNestedRootRenderClickDelegationFixture(label) {
  const document = createDocument();
  const container = createNode('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: `${label}:admission`,
    initialHostOutputIdPrefix: `${label}:output`,
    requestIdPrefix: `${label}:request`,
    rootIdPrefix: `${label}:root`,
    sideEffectIdPrefix: `${label}:side-effect`,
    updateIdPrefix: `${label}:update`
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const childElement = {
    props: {
      children: `${label} nested target`,
      id: `${label}-child`,
      title: 'Private nested delegated click target'
    },
    type: 'span'
  };
  const element = {
    props: {
      children: childElement,
      id: `${label}-parent`,
      title: 'Private nested delegated click parent'
    },
    type: 'section'
  };
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);

  return {
    bridge,
    childElement,
    childToken: hostOutputPayload.childHostToken,
    container,
    create,
    document,
    element,
    handoff,
    hostOutputPayload,
    parentNode: hostOutputPayload.hostNode,
    parentToken: hostOutputPayload.hostToken,
    render,
    rootOwner: hostOutputPayload.rootOwner,
    sideEffects,
    targetNode: hostOutputPayload.childHostNode,
    textNode: hostOutputPayload.textNode,
    token: hostOutputPayload.childHostToken
  };
}

function cleanupPrivateRootRenderClickDelegationFixture(fixture) {
  fixture.bridge.cleanupInitialRenderHostOutput(fixture.handoff);
  fixture.bridge.revertCreateRootSideEffects(fixture.sideEffects);
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

function createPrivateFocusBlurDelegationFixture(label) {
  const document = installEventTargetMethods(createDocument());
  const container = installEventTargetMethods(createNode('DIV', document));
  const targetNode = installEventTargetMethods(createNode('INPUT', document));
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

function createPrivateFocusBlurDispatchRecord(fixture, domEventName, phase) {
  const eventSystemFlags =
    phase === 'capture' ? rootListeners.IS_CAPTURE_PHASE : 0;
  const wrapperRecord =
    eventListener.createEventListenerWrapperRecordWithPriority(
      fixture.container,
      domEventName,
      eventSystemFlags
    );
  return pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
    wrapperRecord,
    createPrivateFocusBlurNativeEvent(fixture.targetNode, domEventName)
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

function createPrivateFocusBlurNativeEvent(target, domEventName) {
  return {
    defaultPrevented: false,
    preventDefaultCallCount: 0,
    relatedTarget: null,
    returnValue: true,
    target,
    type: domEventName,
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
    __registrations: [],
    localName: '#document',
    nodeName: '#document',
    nodeType: 9
  };
  document.ownerDocument = document;
  document.defaultView = {__registrations: []};
  installEventTargetMethods(document.defaultView);
  installEventTargetMethods(document);
  document.createElement = function createElement(tagName) {
    return createNode(String(tagName).toUpperCase(), document);
  };
  document.createTextNode = function createTextNode(text) {
    const node = createNode('#text', document, TEXT_NODE);
    let textValue = String(text);
    Object.defineProperties(node, {
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
    return node;
  };
  return document;
}

function createNode(nodeName, ownerDocument, nodeType = ELEMENT_NODE) {
  const node = {
    __registrations: [],
    attributeLog: [],
    attributes: new Map(),
    childNodes: [],
    localName: nodeName.toLowerCase(),
    nodeName,
    nodeType,
    ownerDocument,
    parentNode: null,
    appendChild(child) {
      detachNodeFromParent(child);
      this.childNodes.push(child);
      child.parentNode = this;
      return child;
    },
    removeChild(child) {
      if (child.parentNode !== this) {
        throw new Error('Cannot remove a child from another parent.');
      }
      detachNodeFromParent(child);
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
    hasAttribute(name) {
      return this.attributes.has(String(name));
    },
    getAttribute(name) {
      const attributeName = String(name);
      return this.attributes.has(attributeName)
        ? this.attributes.get(attributeName)
        : null;
    }
  };
  Object.defineProperties(node, {
    firstChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[0] || null;
      }
    },
    lastChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[this.childNodes.length - 1] || null;
      }
    },
    textContent: {
      configurable: true,
      enumerable: true,
      get() {
        if (this.childNodes.length > 0) {
          return this.childNodes.map(child => child.textContent).join('');
        }
        return this._textContent || '';
      },
      set(value) {
        for (const child of [...this.childNodes]) {
          detachNodeFromParent(child);
        }
        this._textContent = String(value);
      }
    }
  });
  installEventTargetMethods(node);
  return node;
}

function detachNodeFromParent(child) {
  if (child == null || typeof child !== 'object') {
    throw new Error('Expected a fake-DOM child object.');
  }
  if (child.parentNode == null) {
    child.parentNode = null;
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = Array.isArray(siblings) ? siblings.indexOf(child) : -1;
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}
