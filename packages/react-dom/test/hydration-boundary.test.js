'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const hydrationGate = require(path.join(
  packageRoot,
  'src/client/hydration-boundary-gate.js'
));
const rootBridge = require(path.join(
  packageRoot,
  'src/client/root-bridge.js'
));
const domContainer = require(path.join(
  packageRoot,
  'src/client/dom-container.js'
));
const rootMarkers = require(path.join(
  packageRoot,
  'src/client/root-markers.js'
));
const listenerRegistry = require(path.join(
  packageRoot,
  'src/events/listener-registry.js'
));
const eventListener = require(path.join(
  packageRoot,
  'src/events/react-dom-event-listener.js'
));
const eventSystemFlags = require(path.join(
  packageRoot,
  'src/events/event-system-flags.js'
));
const pluginEventSystem = require(path.join(
  packageRoot,
  'src/events/plugin-event-system.js'
));
const ReactDOMClient = require(path.join(packageRoot, 'client.js'));

test('unsupported hydrateRoot records bridge hydration parser evidence with root guards', () => {
  const first = createUnsupportedHydrateRootScenario('bridge');
  const second = createUnsupportedHydrateRootScenario('bridge');

  assert.deepEqual(first.record, second.record);
  assert.equal(first.record.operation, 'hydrateRoot');
  assert.equal(first.record.status, 'unsupported');
  assert.equal(first.record.canHydrate, false);
  assert.equal(first.record.publicRootCreated, false);
  assert.equal(first.record.containerMarked, false);
  assert.equal(first.record.listenersAttached, false);
  assert.equal(first.record.domMutated, false);
  assert.equal(first.record.eventsReplayed, false);
  assert.equal(first.record.rootScheduled, false);

  assert.deepEqual(first.record.markerDiagnostics.markers.map(markerContractId), [
    'suspense-completed-start',
    'suspense-end'
  ]);
  assert.equal(first.record.markerDiagnostics.acceptedMarkerCount, 2);
  assert.equal(first.record.markerDiagnostics.diagnosticOnly, true);
  assert.equal(first.record.markerDiagnostics.canHydrate, false);
  assert.equal(first.record.markerDiagnostics.eventReplaySupported, false);
  assert.equal(first.record.markerDiagnostics.domMutationSupported, false);
  assert.deepEqual(first.record.markerParserEvidence, {
    kind: 'FastReactDomHydrationMarkerParserEvidence',
    status: 'accepted-marker-parser-evidence-recorded',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    canHydrate: false,
    parserKind: 'FastReactDomHydrationContainerMarkerDiagnostics',
    parserStatus: 'diagnostic-only',
    traversal: 'container.childNodes depth-first',
    markerContractCount: hydrationGate.acceptedHydrationMarkerContracts.length,
    nodeCount: 2,
    acceptedMarkerCount: 2,
    commentMarkerCount: 2,
    templateMarkerCount: 0,
    unrecognizedMarkerCount: 0,
    contractIds: ['suspense-completed-start', 'suspense-end'],
    acceptedMarkerRows: [
      {
        area: 'Suspense boundary',
        companionStatus: null,
        contractId: 'suspense-completed-start',
        kind: 'comment',
        lifecycle: 'server-emitted-client-consumed',
        path: 'container.childNodes[0]'
      },
      {
        area: 'Suspense boundary',
        companionStatus: null,
        contractId: 'suspense-end',
        kind: 'comment',
        lifecycle: 'server-emitted-client-consumed',
        path: 'container.childNodes[1]'
      }
    ],
    summaryByContract:
      hydrationGate.acceptedHydrationMarkerContracts.map((contract) => ({
        count:
          contract.id === 'suspense-completed-start' ||
          contract.id === 'suspense-end'
            ? 1
            : 0,
        id: contract.id
      }))
  });
  assertHydrationEventReplayBlockers(first.record.eventReplayBlockers, {
    acceptedMarkerCount: 2,
    canInstallRootListeners: true,
    hasRootListeningMarker: true,
    markerReplayTargetCandidateCount: 1
  });
  assertHydrationMarkerReplayQueueDiagnostics(first.record, {
    acceptedMarkerCount: 2,
    hasRootListeningMarker: true,
    isContainerMarkedAsRoot: true,
    markerReplayTargetCandidateCount: 1,
    ownerDocumentHasSelectionChangeMarker: false,
    warningType: 'duplicate-create-root'
  });

  assert.deepEqual(first.record.markerGuard, {
    action: 'defer-mark-container-as-root-for-hydrate-root',
    hasLegacyRootMarker: false,
    isContainerMarkedAsRoot: true,
    rootMarkerSnapshot: {
      inspectable: true,
      nullCount: 0,
      properties: [
        {
          enumerable: true,
          keyPrefix: '__reactContainer$',
          valueState: 'truthy',
          valueType: 'object'
        }
      ],
      propertyCount: 1,
      truthyCount: 1
    },
    warning: {
      message: rootMarkers.duplicateCreateRootWarning,
      type: 'duplicate-create-root'
    }
  });
  assert.deepEqual(first.record.listenerGuard, {
    action: 'defer-listen-to-all-supported-events-for-hydrate-root',
    canInstallRootListeners: true,
    hasRootListeningMarker: true,
    ownerDocumentCanInstallSelectionChange: true,
    ownerDocumentHasSelectionChangeMarker: false,
    ownerDocumentInfo: {
      kind: 'object',
      nodeName: '#document',
      nodeType: domContainer.DOCUMENT_NODE
    },
    rootEventTargetInfo: {
      kind: 'object',
      nodeName: 'DIV',
      nodeType: domContainer.ELEMENT_NODE
    }
  });

  assert.deepEqual(first.container.__registrations, []);
  assert.deepEqual(first.document.__registrations, []);
  assert.equal(rootMarkers.inspectContainerRootMarker(first.container).propertyCount, 1);
  assert.equal(
    listenerRegistry.inspectListeningMarker(first.container).propertyCount,
    1
  );
  assert.equal(
    listenerRegistry.inspectListeningMarker(first.document).propertyCount,
    0
  );
});

test('private root bridge hydrateRoot requests preserve hydration marker evidence record-only', () => {
  const first = createPrivateRootBridgeHydrateScenario('root-bridge');
  const second = createPrivateRootBridgeHydrateScenario('root-bridge');

  assert.deepEqual(first.record, second.record);
  assert.equal(first.record.$$typeof, rootBridge.privateRootHydrateRecordType);
  assert.equal(first.record.kind, 'FastReactDomPrivateRootHydrateRecord');
  assert.equal(first.record.operation, 'hydrate');
  assert.equal(first.record.requestType, 'hydrateRoot');
  assert.equal(first.record.requestId, 'hydration-request:1');
  assert.equal(first.record.hydrateId, 'hydration-root-bridge:1');
  assert.equal(first.record.rootId, null);
  assert.equal(first.record.rootKind, hydrationGate.UNSUPPORTED_HYDRATION_ROOT_KIND);
  assert.equal(
    first.record.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION
  );
  assert.equal(first.record.hydrationRequested, true);
  assert.equal(first.record.hydration, false);
  assert.equal(first.record.reconcilerExecution, false);
  assert.equal(first.record.domMutation, false);
  assert.equal(first.record.markerWrites, false);
  assert.equal(first.record.listenerInstallation, false);
  assert.equal(first.record.eventDispatch, false);
  assert.equal(first.record.compatibilityClaimed, false);

  assert.equal(
    hydrationGate.isPrivateHydrationBoundaryRecord(
      first.record.hydrationBoundaryRecord
    ),
    true
  );
  assert.equal(
    first.record.markerDiagnostics,
    first.record.hydrationBoundaryRecord.markerDiagnostics
  );
  assert.equal(
    first.record.markerParserEvidence,
    first.record.hydrationBoundaryRecord.markerParserEvidence
  );
  assert.deepEqual(first.record.markerEvidence, {
    kind: 'FastReactDomHydrationMarkerEvidence',
    status: 'accepted-marker-evidence-recorded',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    canHydrate: false,
    acceptedMarkerCount: 2,
    commentMarkerCount: 2,
    templateMarkerCount: 0,
    unrecognizedMarkerCount: 0,
    contractIds: ['suspense-completed-start', 'suspense-end']
  });
  assert.equal(
    first.record.eventReplayBlockers,
    first.record.hydrationBoundaryRecord.eventReplayBlockers
  );
  assert.equal(
    first.record.replayQueueDiagnostics,
    first.record.hydrationBoundaryRecord.replayQueueDiagnostics
  );
  assertHydrationEventReplayBlockers(first.record.eventReplayBlockers, {
    acceptedMarkerCount: 2,
    canInstallRootListeners: true,
    hasRootListeningMarker: true,
    markerReplayTargetCandidateCount: 1
  });
  assertHydrationMarkerReplayQueueDiagnostics(first.record, {
    acceptedMarkerCount: 2,
    hasRootListeningMarker: true,
    isContainerMarkedAsRoot: true,
    markerReplayTargetCandidateCount: 1,
    ownerDocumentHasSelectionChangeMarker: false,
    warningType: 'duplicate-create-root'
  });

  assert.deepEqual(
    first.record.markerDiagnostics.markers.map(markerContractId),
    ['suspense-completed-start', 'suspense-end']
  );
  assert.equal(first.record.markerDiagnostics.diagnosticOnly, true);
  assert.equal(first.record.markerDiagnostics.readOnly, true);
  assert.equal(first.record.markerDiagnostics.canHydrate, false);
  assert.equal(first.record.markerDiagnostics.domMutationSupported, false);

  assert.deepEqual(
    {
      admissionStatus: first.admission.admissionStatus,
      compatibilityClaimed: first.admission.compatibilityClaimed,
      executionStatus: first.admission.executionStatus,
      eventReplayBlockers: first.admission.eventReplayBlockers,
      hydrateId: first.admission.hydrateId,
      hydration: first.admission.hydration,
      markerParserEvidence: first.admission.markerParserEvidence,
      markerEvidence: first.admission.markerEvidence,
      operation: first.admission.operation,
      replayQueueDiagnostics: first.admission.replayQueueDiagnostics,
      transition: first.admission.lifecyclePrerequisites.lifecycleTransition
    },
    {
      admissionStatus: rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED,
      compatibilityClaimed: false,
      executionStatus: rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED,
      eventReplayBlockers: first.record.eventReplayBlockers,
      hydrateId: 'hydration-root-bridge:1',
      hydration: false,
      markerParserEvidence: first.record.markerParserEvidence,
      markerEvidence: first.record.markerEvidence,
      operation: 'hydrate',
      replayQueueDiagnostics: first.record.replayQueueDiagnostics,
      transition: 'none->unsupported-hydration'
    }
  );

  const rootPayload = rootBridge.getPrivateRootRecordPayload(first.record);
  assert.equal(rootPayload.container, first.container);
  assert.equal(rootPayload.initialChildren, first.initialChildren);
  assert.equal(rootPayload.hydrationOptions, first.hydrationOptions);
  assert.equal(
    rootPayload.hydrationBoundaryRecord,
    first.record.hydrationBoundaryRecord
  );

  const boundaryPayload =
    hydrationGate.getPrivateHydrationBoundaryRecordPayload(
      first.record.hydrationBoundaryRecord
    );
  assert.equal(boundaryPayload.container, first.container);
  assert.equal(boundaryPayload.initialChildren, first.initialChildren);
  assert.equal(boundaryPayload.hydrationOptions, first.hydrationOptions);

  assert.throws(
    () => first.bridge.createNativeRequestHandoff(first.record),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST'
    }
  );
  assert.deepEqual(first.container.__registrations, []);
  assert.deepEqual(first.document.__registrations, []);
  assert.equal(rootMarkers.inspectContainerRootMarker(first.container).propertyCount, 1);
  assert.equal(
    listenerRegistry.inspectListeningMarker(first.container).propertyCount,
    1
  );
  assert.deepEqual(first.container.childNodes, [
    {data: '$', nodeType: domContainer.COMMENT_NODE},
    {data: '/$', nodeType: domContainer.COMMENT_NODE}
  ]);
});

test('private hydration replay event queue diagnostics record blocked event target order', () => {
  const {container, document, record} =
    createUnsupportedHydrateRootScenario('replay-events');
  const hoverTarget = createElement('BUTTON', document);
  hoverTarget.parentNode = container;
  const clickTarget = createElement('INPUT', document);
  clickTarget.parentNode = container;
  const hoverWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      'mouseover',
      0
    );
  const clickWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      'click',
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const hoverRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      hoverWrapper,
      createNativeEvent('mouseover', hoverTarget)
    );
  const clickRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      clickWrapper,
      createNativeEvent('click', clickTarget)
    );
  const diagnostics =
    pluginEventSystem.createHydrationReplayEventQueueDiagnostic(
      [hoverRecord, clickRecord],
      {
        markerReplayTargetCandidates:
          record.replayQueueDiagnostics.markerReplayTargetCandidates,
        source: 'hydration-boundary-test'
      }
    );

  assertHydrationReplayEventQueueDiagnostics(record.eventReplayQueueDiagnostics, {
    blockedEventReplayTargetCount: 0,
    markerReplayTargetCandidateCount: 1,
    status: 'blocked-no-event-replay-targets-recorded'
  });
  assert.equal(
    record.eventReplayBlockers.eventReplayQueueDiagnostics,
    record.eventReplayQueueDiagnostics
  );
  assert.equal(record.eventReplayBlockers.eventReplayQueueDiagnosticsAccepted, true);
  assert.equal(record.eventReplayBlockers.blockedEventReplayTargetCount, 0);

  assertHydrationReplayEventQueueDiagnostics(diagnostics, {
    blockedEventReplayTargetCount: 2,
    markerReplayTargetCandidateCount: 1,
    status: 'blocked-event-replay-targets-recorded'
  });
  assert.equal(diagnostics.source, 'hydration-boundary-test');
  assert.deepEqual(
    diagnostics.eventQueueOrder.map((entry) => [
      entry.inputOrder,
      entry.domEventName,
      entry.queueName,
      entry.targetResolutionStatus
    ]),
    [
      [0, 'mouseover', 'queuedMouse', 'blocked'],
      [1, 'click', 'discrete-hydration-replay-attempt', 'blocked']
    ]
  );
  assert.deepEqual(
    diagnostics.priorityQueueOrder.map((entry) => [
      entry.priorityOrder,
      entry.domEventName,
      entry.prioritySortKey
    ]),
    [
      [0, 'click', 2],
      [1, 'mouseover', 8]
    ]
  );
  assert.deepEqual(
    diagnostics.blockedEventReplayTargets.map((entry) => ({
      domEventName: entry.domEventName,
      nativeEventTargetInfo: entry.nativeEventTargetInfo,
      queueCategory: entry.queueCategory,
      queueName: entry.queueName,
      queued: entry.queued,
      targetInstStatus: entry.targetInstStatus,
      targetResolutionBlockedReason: entry.targetResolutionBlockedReason,
      targetResolutionStatus: entry.targetResolutionStatus,
      willHydrate: entry.willHydrate,
      willReplay: entry.willReplay
    })),
    [
      {
        domEventName: 'mouseover',
        nativeEventTargetInfo: {
          kind: 'object',
          nodeName: 'BUTTON',
          nodeType: domContainer.ELEMENT_NODE
        },
        queueCategory: 'continuous-event',
        queueName: 'queuedMouse',
        queued: false,
        targetInstStatus: 'not-resolved',
        targetResolutionBlockedReason:
          pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
        targetResolutionStatus: 'blocked',
        willHydrate: false,
        willReplay: false
      },
      {
        domEventName: 'click',
        nativeEventTargetInfo: {
          kind: 'object',
          nodeName: 'INPUT',
          nodeType: domContainer.ELEMENT_NODE
        },
        queueCategory: 'discrete-event',
        queueName: 'discrete-hydration-replay-attempt',
        queued: false,
        targetInstStatus: 'not-resolved',
        targetResolutionBlockedReason:
          pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
        targetResolutionStatus: 'blocked',
        willHydrate: false,
        willReplay: false
      }
    ]
  );
  assert.equal(hoverRecord.hydrationReplay.queued, false);
  assert.equal(clickRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
});

test('public hydrateRoot remains an unsupported placeholder with no guard side effects', () => {
  const document = createDocument('public');
  const container = createElement('DIV', document);
  container.childNodes = [createComment('$'), createComment('/$')];

  assert.throws(
    () => ReactDOMClient.hydrateRoot(container, 'child'),
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'hydrateRoot'
    }
  );
  assert.deepEqual(rootMarkers.inspectContainerRootMarker(container), {
    inspectable: true,
    nullCount: 0,
    properties: [],
    propertyCount: 0,
    truthyCount: 0
  });
  assert.deepEqual(listenerRegistry.inspectListeningMarker(container), {
    inspectable: true,
    propertyCount: 0,
    trueValueCount: 0
  });
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.deepEqual(container.childNodes, [
    {data: '$', nodeType: domContainer.COMMENT_NODE},
    {data: '/$', nodeType: domContainer.COMMENT_NODE}
  ]);
});

function markerContractId(marker) {
  return marker.contractId;
}

function assertHydrationEventReplayBlockers(blockers, expected) {
  assert.equal(Object.isFrozen(blockers), true);
  assert.equal(blockers.kind, 'FastReactDomHydrationEventReplayBlockers');
  assert.equal(
    blockers.status,
    'blocked-after-private-root-and-event-gates'
  );
  assert.equal(blockers.diagnosticOnly, true);
  assert.equal(blockers.readOnly, true);
  assert.equal(blockers.compatibilityClaimed, false);
  assert.equal(blockers.hydrationReplaySupported, false);
  assert.equal(blockers.eventsReplayed, false);
  assert.equal(blockers.explicitHydrationTargetsQueued, false);
  assert.equal(blockers.continuousEventReplayQueued, false);
  assert.equal(blockers.formReplayQueued, false);
  assert.equal(blockers.rootListenerGateAccepted, true);
  assert.equal(blockers.rootListenerInstallationDeferred, true);
  assert.equal(blockers.eventDispatchGateAccepted, true);
  assert.equal(
    blockers.eventDispatchBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(
    blockers.eventTargetResolutionBlockedReason,
    pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  );
  assert.equal(
    blockers.hydrationReplayBlockedReason,
    pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE
  );
  assert.equal(blockers.markerParserEvidenceAccepted, true);
  assert.equal(blockers.eventReplayQueueDiagnosticsAccepted, true);
  assert.equal(
    blockers.eventReplayQueueDiagnostics.kind,
    pluginEventSystem.HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND
  );
  assert.equal(blockers.blockedEventReplayTargetCount, 0);
  assert.equal(blockers.queuedEventReplayTargetCount, 0);
  assert.deepEqual(blockers.eventQueueOrder, []);
  assert.deepEqual(blockers.priorityQueueOrder, []);
  assert.equal(blockers.replayQueueDiagnosticsAccepted, true);
  assert.equal(
    blockers.replayQueueDiagnostics.kind,
    'FastReactDomHydrationMarkerReplayQueueDiagnostics'
  );
  assert.equal(blockers.acceptedMarkerCount, expected.acceptedMarkerCount);
  assert.equal(
    blockers.markerReplayTargetCandidateCount,
    expected.markerReplayTargetCandidateCount
  );
  assert.equal(blockers.queuedExplicitHydrationTargetCount, 0);
  assert.equal(blockers.queuedContinuousEventCount, 0);
  assert.equal(blockers.queuedDiscreteEventCount, 0);
  assert.equal(blockers.queuedFormActionCount, 0);
  assert.equal(
    blockers.canInstallRootListeners,
    expected.canInstallRootListeners
  );
  assert.equal(blockers.hasRootListeningMarker, expected.hasRootListeningMarker);
  assert.equal(
    blockers.blockerCount,
    hydrationGate.hydrationEventReplayBlockerContracts.length
  );
  assert.equal(
    blockers.blockers,
    hydrationGate.hydrationEventReplayBlockerContracts
  );
  assert.deepEqual(
    blockers.blockers.map((blocker) => blocker.id),
    [
      'no-dehydrated-host-root',
      'no-dehydrated-boundary-target',
      'no-event-target-hydration-resolution',
      'no-explicit-hydration-target-queue',
      'no-continuous-event-replay-queues',
      'no-dispatch-replay-route'
    ]
  );
}

function assertHydrationReplayEventQueueDiagnostics(diagnostics, expected) {
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    pluginEventSystem.HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND
  );
  assert.equal(diagnostics.status, expected.status);
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(diagnostics.browserDomEventCompatibilityClaimed, false);
  assert.equal(diagnostics.publicRootBehaviorChanged, false);
  assert.equal(diagnostics.eventReplayInstalled, false);
  assert.equal(diagnostics.eventReplaySupported, false);
  assert.equal(diagnostics.hydrationReplaySupported, false);
  assert.equal(diagnostics.hostInstanceHydrationAttempted, false);
  assert.equal(diagnostics.hasScheduledReplayAttempt, false);
  assert.equal(diagnostics.queueMutationAllowed, false);
  assert.equal(diagnostics.eventsReplayed, false);
  assert.equal(diagnostics.willDispatchEvents, false);
  assert.equal(diagnostics.willHydrateHostInstances, false);
  assert.equal(
    diagnostics.blockedReason,
    pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.eventDispatchBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.eventTargetResolutionBlockedReason,
    pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.markerReplayTargetCandidateCount,
    expected.markerReplayTargetCandidateCount
  );
  assert.equal(
    diagnostics.blockedEventReplayTargetCount,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(
    diagnostics.eventDispatchRecordCount,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(diagnostics.queuedEventReplayTargetCount, 0);
  assert.equal(diagnostics.replayedEventCount, 0);
  assert.equal(
    diagnostics.blockedEventReplayTargets.length,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(
    diagnostics.eventQueueOrder.length,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(
    diagnostics.priorityQueueOrder.length,
    expected.blockedEventReplayTargetCount
  );
}

function assertHydrationMarkerReplayQueueDiagnostics(record, expected) {
  const diagnostics = record.replayQueueDiagnostics;
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    'FastReactDomHydrationMarkerReplayQueueDiagnostics'
  );
  assert.equal(
    diagnostics.status,
    'blocked-before-hydration-marker-replay-queues'
  );
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(
    diagnostics.rootBridgeStateSource,
    'private-root-marker-and-listener-guards'
  );
  assert.equal(diagnostics.markerGuardAction, record.markerGuard.action);
  assert.equal(diagnostics.listenerGuardAction, record.listenerGuard.action);
  assert.equal(diagnostics.rootMarkerState.sourceGuardAccepted, true);
  assert.equal(diagnostics.rootMarkerState.action, record.markerGuard.action);
  assert.equal(
    diagnostics.rootMarkerState.rootMarkerSnapshot,
    record.markerGuard.rootMarkerSnapshot
  );
  assert.equal(
    diagnostics.rootMarkerState.isContainerMarkedAsRoot,
    expected.isContainerMarkedAsRoot
  );
  assert.equal(diagnostics.rootMarkerState.warningType, expected.warningType);
  assert.equal(diagnostics.rootMarkerState.rootMarkerPropertyCount, 1);
  assert.equal(diagnostics.rootMarkerState.rootMarkerTruthyCount, 1);

  assert.equal(diagnostics.rootListenerState.sourceGuardAccepted, true);
  assert.equal(diagnostics.rootListenerState.action, record.listenerGuard.action);
  assert.equal(
    diagnostics.rootListenerState.rootEventTargetInfo,
    record.listenerGuard.rootEventTargetInfo
  );
  assert.equal(
    diagnostics.rootListenerState.ownerDocumentInfo,
    record.listenerGuard.ownerDocumentInfo
  );
  assert.equal(
    diagnostics.rootListenerState.hasRootListeningMarker,
    expected.hasRootListeningMarker
  );
  assert.equal(
    diagnostics.rootListenerState.ownerDocumentHasSelectionChangeMarker,
    expected.ownerDocumentHasSelectionChangeMarker
  );

  assert.equal(diagnostics.markerParserEvidenceAccepted, true);
  assert.equal(diagnostics.acceptedMarkerCount, expected.acceptedMarkerCount);
  assert.equal(
    diagnostics.markerReplayTargetCandidateCount,
    expected.markerReplayTargetCandidateCount
  );
  assert.deepEqual(diagnostics.markerReplayTargetCandidates, [
    {
      area: 'Suspense boundary',
      blockedReason: pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE,
      contractId: 'suspense-completed-start',
      kind: 'comment',
      path: 'container.childNodes[0]',
      queued: false,
      queueEligible: false,
      replayTargetKind: 'suspense-boundary'
    }
  ]);
  assert.equal(
    diagnostics.queueContractCount,
    hydrationGate.hydrationMarkerReplayQueueContracts.length
  );
  assert.equal(
    diagnostics.queueContracts,
    hydrationGate.hydrationMarkerReplayQueueContracts
  );
  assert.deepEqual(
    diagnostics.queueContracts.map((queue) => queue.queueName),
    [
      'queuedExplicitHydrationTargets',
      'queuedFocus',
      'queuedDrag',
      'queuedMouse',
      'queuedPointers',
      'queuedPointerCaptures',
      'queuedChangeEventTargets',
      '$$reactFormReplay'
    ]
  );
  assert.equal(diagnostics.queueMutationAllowed, false);
  assert.equal(diagnostics.hydrationReplaySupported, false);
  assert.equal(diagnostics.eventReplaySupported, false);
  assert.equal(diagnostics.eventsReplayed, false);
  assert.equal(diagnostics.hasScheduledReplayAttempt, false);
  assert.equal(diagnostics.explicitHydrationTargetsQueued, false);
  assert.equal(diagnostics.queuedExplicitHydrationTargetCount, 0);
  assert.equal(diagnostics.discreteEventReplayQueued, false);
  assert.equal(diagnostics.queuedDiscreteEventCount, 0);
  assert.equal(diagnostics.continuousEventReplayQueued, false);
  assert.equal(diagnostics.queuedContinuousEventCount, 0);
  assert.equal(diagnostics.changeEventTargetsQueued, false);
  assert.equal(diagnostics.queuedChangeEventTargetCount, 0);
  assert.equal(diagnostics.formReplayQueued, false);
  assert.equal(diagnostics.queuedFormActionCount, 0);
  assert.equal(
    diagnostics.replayQueueBlockedReason,
    pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.eventDispatchBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.eventTargetResolutionBlockedReason,
    pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  );
}

function createUnsupportedHydrateRootScenario(label) {
  const document = createDocument(label);
  const container = createElement('DIV', document);
  container.childNodes = [createComment('$'), createComment('/$')];

  rootMarkers.markContainerAsRoot(
    Object.freeze({
      rootId: `${label}:existing-root`
    }),
    container
  );
  listenerRegistry.markTargetAsListening(container);

  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOptions: {
      development: true
    },
    recordIdPrefix: 'hydration-root-bridge'
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    {
      props: {
        children: 'hello'
      },
      type: 'App'
    },
    {
      identifierPrefix: `${label}-`
    }
  );

  return {
    container,
    document,
    record
  };
}

function createPrivateRootBridgeHydrateScenario(label) {
  const document = createDocument(label);
  const container = createElement('DIV', document);
  container.childNodes = [createComment('$'), createComment('/$')];

  rootMarkers.markContainerAsRoot(
    Object.freeze({
      rootId: `${label}:existing-root`
    }),
    container
  );
  listenerRegistry.markTargetAsListening(container);

  const bridge = rootBridge.createPrivateRootBridgeShell({
    hydrateIdPrefix: 'hydration-root-bridge',
    hydrationRecordIdPrefix: 'hydration-boundary',
    markerOptions: {
      development: true
    },
    requestIdPrefix: 'hydration-request'
  });
  const initialChildren = {
    props: {
      children: 'hello'
    },
    type: 'App'
  };
  const hydrationOptions = {
    identifierPrefix: `${label}-`
  };
  const record = bridge.createHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );

  return {
    admission: bridge.admitRequest(record),
    bridge,
    container,
    document,
    hydrationOptions,
    initialChildren,
    record
  };
}

function createComment(data) {
  return {
    data,
    nodeType: domContainer.COMMENT_NODE
  };
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: '#document',
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.defaultView = createEventTarget({
    label: `${label}-window`
  });
  document.ownerDocument = document;
  return document;
}

function createElement(nodeName, ownerDocument) {
  return createEventTarget({
    childNodes: [],
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createNativeEvent(type, target) {
  return {
    target,
    type
  };
}

function createEventTarget(fields) {
  return {
    ...fields,
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    }
  };
}
