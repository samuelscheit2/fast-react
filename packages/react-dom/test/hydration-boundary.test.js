'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const packageRoot = path.resolve(__dirname, '..');
const hydrationGate = require(path.join(
  packageRoot,
  'src/client/hydration-boundary-gate.js'
));
const resourceFormGate = require(path.join(
  packageRoot,
  'src/resource-form-gates.js'
));
const rootBridge = require(path.join(
  packageRoot,
  'src/client/root-bridge.js'
));
const hydrateRootSourceLedger = require(path.join(
  packageRoot,
  'src/client/hydrate-root-source-ledger.js'
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
  assertAcceptedPrivateMetadataDiagnostics(
    first.record.acceptedPrivateMetadataDiagnostics,
    {
      ownershipRowCount: 0,
      ownershipStatus: 'blocked-no-replay-ownership-targets-recorded',
      rootRecordId: 'hydration-root-bridge:1'
    }
  );
  assert.equal(
    Object.isFrozen(first.record.acceptedPrivateMetadataDiagnostics),
    true
  );
  assert.deepEqual(
    first.record.acceptedPrivateMetadataIds,
    expectedAcceptedPrivateMetadataIds()
  );
  assert.deepEqual(
    first.record.acceptedPrivateMetadataGateIds,
    expectedAcceptedPrivateMetadataGateIds()
  );
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
        markerId: 'suspense-completed-start@container.childNodes[0]',
        path: 'container.childNodes[0]'
      },
      {
        area: 'Suspense boundary',
        companionStatus: null,
        contractId: 'suspense-end',
        kind: 'comment',
        lifecycle: 'server-emitted-client-consumed',
        markerId: 'suspense-end@container.childNodes[1]',
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
  assertAcceptedPrivateMetadataDiagnostics(
    first.record.hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics,
    {
      ownershipRowCount: 0,
      ownershipStatus: 'blocked-no-replay-ownership-targets-recorded',
      rootRecordId: 'hydration-boundary:1'
    }
  );
  assert.deepEqual(
    first.record.hydrationBoundaryRecord.acceptedPrivateMetadataIds,
    expectedAcceptedPrivateMetadataIds()
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

test('private hydration target resolution records dehydrated ownership without draining replay queues', () => {
  const document = createDocument('target-resolution');
  const container = createElement('DIV', document);
  const buttonTarget = createElement('BUTTON', document);
  const startMarker = createComment('$');
  const endMarker = createComment('/$');
  buttonTarget.parentNode = container;
  container.childNodes = [startMarker, buttonTarget, endMarker];

  const gate = hydrationGate.createHydrationBoundaryGate({
    recordIdPrefix: 'hydration-target'
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    {
      props: {
        children: 'button'
      },
      type: 'App'
    },
    {
      identifierPrefix: 'target-resolution-'
    }
  );
  const wrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      'click',
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapper,
      createNativeEvent('click', buttonTarget)
    );
  const targetResolutionDiagnostics =
    pluginEventSystem.createHydrationDehydratedTargetResolutionDiagnostic(
      dispatchRecord,
      {
        dehydratedTargetResolution: record.targetResolutionDiagnostics,
        source: 'hydration-boundary-test-target-resolution'
      }
    );
  const replayDiagnostics =
    pluginEventSystem.createHydrationReplayEventQueueDiagnostic(
      dispatchRecord,
      {
        dehydratedTargetResolution: record.targetResolutionDiagnostics,
        markerReplayTargetCandidates:
          record.replayQueueDiagnostics.markerReplayTargetCandidates,
        source: 'hydration-boundary-test-target-resolution'
      }
    );

  assertHydrationDehydratedTargetResolutionDiagnostics(
    record.targetResolutionDiagnostics,
    {
      boundaryOwnerCount: 1,
      lookupCount: 0,
      rootRecordId: 'hydration-target:1',
      status: 'blocked-no-hydratable-event-targets-recorded'
    }
  );
  assert.equal(
    record.eventReplayBlockers.targetResolutionDiagnostics,
    record.targetResolutionDiagnostics
  );
  assert.equal(
    record.eventReplayQueueDiagnostics.dehydratedTargetResolutionDiagnostics,
    record.targetResolutionDiagnostics
  );
  assertHydrationDehydratedTargetResolutionDiagnostics(
    targetResolutionDiagnostics,
    {
      boundaryOwnerCount: 1,
      lookupCount: 1,
      rootRecordId: 'hydration-target:1',
      status: 'blocked-hydratable-event-targets-recorded'
    }
  );
  const lookup =
    targetResolutionDiagnostics.hydratableEventTargetLookups[0];
  assert.deepEqual(
    {
      blockedOnKind: lookup.blockedOnKind,
      blockedOnStatus: lookup.blockedOnStatus,
      dehydratedBoundaryOwnerId: lookup.dehydratedBoundaryOwnerId,
      domEventName: lookup.domEventName,
      queueName: lookup.queueName,
      rootOwnershipStatus: lookup.rootOwnershipStatus,
      status: lookup.status,
      targetContainerMatchesRoot: lookup.targetContainerMatchesRoot,
      targetPath: lookup.targetPath,
      targetPathStatus: lookup.targetPathStatus,
      targetResolutionStatus: lookup.targetResolutionStatus,
      willDrainReplayQueues: lookup.willDrainReplayQueues,
      willHydrate: lookup.willHydrate,
      willReplay: lookup.willReplay
    },
    {
      blockedOnKind: 'suspense-boundary',
      blockedOnStatus: 'blocked-on-dehydrated-boundary',
      dehydratedBoundaryOwnerId: 'hydration-target:1:boundary:0',
      domEventName: 'click',
      queueName: 'discrete-hydration-replay-attempt',
      rootOwnershipStatus: 'owned-by-dehydrated-root',
      status: 'blocked-on-dehydrated-boundary',
      targetContainerMatchesRoot: true,
      targetPath: 'container.childNodes[1]',
      targetPathStatus: 'found-in-container-child-list',
      targetResolutionStatus: 'blocked',
      willDrainReplayQueues: false,
      willHydrate: false,
      willReplay: false
    }
  );
  assert.equal(
    lookup.dehydratedBoundaryOwner.contractId,
    'suspense-completed-start'
  );
  assert.equal(replayDiagnostics.targetResolutionDiagnosticsAccepted, true);
  assert.equal(replayDiagnostics.hydratableEventTargetLookupCount, 1);
  assert.equal(
    replayDiagnostics.dehydratedTargetResolutionDiagnostics
      .hydratableEventTargetLookups[0].targetPath,
    'container.childNodes[1]'
  );
  assert.equal(replayDiagnostics.queuedEventReplayTargetCount, 0);
  assert.equal(replayDiagnostics.replayedEventCount, 0);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
});

test('private hydration text mismatch diagnostics record expected actual and recoverable metadata only', () => {
  const document = createDocument('text-mismatch');
  const container = createElement('DIV', document);
  container.childNodes = [createText('server text')];
  let recoverableErrorCalls = 0;
  const initialChildren = {
    props: {
      children: ['client ', 42]
    },
    type: 'App'
  };
  const hydrationOptions = {
    identifierPrefix: 'text-mismatch-',
    onRecoverableError() {
      recoverableErrorCalls++;
    }
  };
  const gate = hydrationGate.createHydrationBoundaryGate({
    recordIdPrefix: 'hydration-text'
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hydrateIdPrefix: 'hydrate-text',
    hydrationRecordIdPrefix: 'hydrate-text-boundary',
    requestIdPrefix: 'hydrate-text-request'
  });
  const bridgeRecord = bridge.createHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const admission = bridge.admitRequest(bridgeRecord);

  assertHydrationTextMismatchDiagnostics(record.textMismatchDiagnostics, {
    actualTextRowCount: 1,
    expectedTextRowCount: 2,
    mismatchCount: 2,
    rootRecordId: 'hydration-text:1'
  });
  assert.deepEqual(
    record.textMismatchDiagnostics.expectedTextRows.map((row) => [
      row.index,
      row.path,
      row.text,
      row.normalizedText
    ]),
    [
      [0, 'initialChildren.props.children[0]', 'client ', 'client '],
      [1, 'initialChildren.props.children[1]', '42', '42']
    ]
  );
  assert.deepEqual(record.textMismatchDiagnostics.actualTextRows, [
    {
      index: 0,
      normalizedText: 'server text',
      normalizedTextLength: 11,
      path: 'container.childNodes[0]',
      source: 'server-actual',
      text: 'server text',
      textLength: 11
    }
  ]);
  assert.deepEqual(
    record.textMismatchDiagnostics.mismatchRows.map((row) => ({
      actualPath: row.actualPath,
      actualText: row.actualText,
      expectedPath: row.expectedPath,
      expectedText: row.expectedText,
      reason: row.reason,
      rowId: row.rowId,
      status: row.status,
      willPatchText: row.willPatchText
    })),
    [
      {
        actualPath: 'container.childNodes[0]',
        actualText: 'server text',
        expectedPath: 'initialChildren.props.children[0]',
        expectedText: 'client ',
        reason: 'text-content-different',
        rowId: 'hydration-text:1:text-mismatch:0',
        status: 'blocked-before-hydrate-text-instance',
        willPatchText: false
      },
      {
        actualPath: null,
        actualText: null,
        expectedPath: 'initialChildren.props.children[1]',
        expectedText: '42',
        reason: 'missing-server-text',
        rowId: 'hydration-text:1:text-mismatch:1',
        status: 'blocked-before-hydrate-text-instance',
        willPatchText: false
      }
    ]
  );
  assertHydrationTextMismatchRecoverableMetadata(
    record.recoverableErrorMetadata,
    {
      callbackPresent: true,
      recoverableErrorMetadataCount: 2,
      rootRecordId: 'hydration-text:1'
    }
  );
  assert.equal(
    record.textMismatchDiagnostics.recoverableErrorMetadata,
    record.recoverableErrorMetadata
  );
  assert.equal(
    bridgeRecord.textMismatchDiagnostics,
    bridgeRecord.hydrationBoundaryRecord.textMismatchDiagnostics
  );
  assert.equal(
    bridgeRecord.recoverableErrorMetadata,
    bridgeRecord.hydrationBoundaryRecord.recoverableErrorMetadata
  );
  assertHydrationTextMismatchDiagnostics(bridgeRecord.textMismatchDiagnostics, {
    actualTextRowCount: 1,
    expectedTextRowCount: 2,
    mismatchCount: 2,
    rootRecordId: 'hydrate-text-boundary:1'
  });
  assert.equal(
    admission.textMismatchDiagnostics,
    bridgeRecord.textMismatchDiagnostics
  );
  assert.equal(
    admission.recoverableErrorMetadata,
    bridgeRecord.recoverableErrorMetadata
  );
  assert.equal(recoverableErrorCalls, 0);
  assert.equal(container.childNodes[0].nodeValue, 'server text');
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
});

test('private hydration recoverable error routing links mismatch rows to root options without callbacks', () => {
  const publicRootErrorCalls = [];

  function onUncaughtError(error) {
    publicRootErrorCalls.push(['uncaught', error.message]);
  }
  function onCaughtError(error) {
    publicRootErrorCalls.push(['caught', error.message]);
  }
  function onRecoverableError(error) {
    publicRootErrorCalls.push(['recoverable', error.message]);
  }

  const scenario = createHydrationRecoverableRoutingScenario({
    actualText: 'server title',
    expectedText: 'client title',
    label: 'recoverable-route',
    hydrationOptions: {
      identifierPrefix: 'recoverable-route-',
      onCaughtError,
      onRecoverableError,
      onUncaughtError
    }
  });
  const routing = scenario.bridge.createHydrationRecoverableErrorRouting(
    scenario.hydrateRecord,
    scenario.hydrateRecord.recoverableErrorMetadata,
    scenario.replayMetadata,
    {
      mismatchLabels: ['title-text'],
      rootOptions: scenario.hydrationOptions,
      source: 'hydration-boundary-test-recoverable-routing'
    }
  );

  assert.equal(
    rootBridge.isPrivateRootHydrationRecoverableErrorRoutingRecord(routing),
    true
  );
  assert.equal(
    routing.$$typeof,
    rootBridge.privateRootHydrationRecoverableErrorRoutingRecordType
  );
  assert.equal(
    routing.routingStatus,
    rootBridge.ROOT_BRIDGE_HYDRATION_RECOVERABLE_ERROR_ROUTING_RECORDED
  );
  assert.equal(routing.sourceRequestId, 'recoverable-route-request:1');
  assert.equal(routing.hydrateId, 'recoverable-route-hydrate:1');
  assert.equal(routing.rootRecordId, 'recoverable-route-boundary:1');
  assert.equal(
    routing.sourceTextMismatchDiagnosticKind,
    hydrationGate.HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND
  );
  assert.equal(
    routing.sourceRecoverableErrorMetadataKind,
    hydrationGate.HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND
  );
  assert.equal(
    routing.sourceHydrationReplayErrorMetadataKind,
    'FastReactDomPrivateRootHydrationReplayErrorMetadataRecord'
  );
  assert.equal(routing.hydrationReplayErrorMetadataAccepted, true);
  assert.equal(routing.textMismatchRowCount, 1);
  assert.equal(routing.recoverableErrorMetadataCount, 1);
  assert.equal(routing.rootErrorOptionCallbackRecordCount, 1);
  assert.equal(routing.rootOptionsHandleStatus, 'matched-hydrate-root-options');
  assert.equal(routing.rootErrorChannel, 'onRecoverableError');
  assert.equal(routing.onUncaughtErrorConfigured, true);
  assert.equal(routing.onCaughtErrorConfigured, true);
  assert.equal(routing.onRecoverableErrorConfigured, true);
  assert.equal(routing.recoverableErrorsQueued, false);
  assert.equal(routing.willInvokeOnRecoverableError, false);
  assert.equal(routing.publicOnRecoverableErrorInvoked, false);
  assert.equal(routing.publicRootErrorCallbacksInvoked, false);
  assert.equal(routing.rootErrorCallbackInvocationCount, 0);
  assert.equal(routing.hydration, false);
  assert.equal(routing.canHydrate, false);
  assert.equal(routing.hydrationCompatibilityClaimed, false);
  assert.equal(routing.domMutation, false);
  assert.equal(routing.compatibilityClaimed, false);
  assert.deepEqual(publicRootErrorCalls, []);
  assert.deepEqual(
    routing.rootErrorOptionCallbackRecords.map((record) => [
      record.phase,
      record.sourceLabel,
      record.textMismatchRowId,
      record.recoverableErrorMetadataId,
      record.textMismatchReason,
      record.expectedText,
      record.actualText,
      record.rootOptionCallbackConfigured,
      record.onRecoverableErrorInvoked,
      record.queuedRecoverableError
    ]),
    [
      [
        'hydration-recoverable-error',
        'title-text',
        'recoverable-route-boundary:1:text-mismatch:0',
        'recoverable-route-boundary:1:recoverable-error:0',
        'text-content-different',
        'client title',
        'server title',
        true,
        false,
        false
      ]
    ]
  );
  assert.equal(
    routing.rootErrorOptionCallbackRecords[0].errorMessage,
    'Hydration failed because the server rendered text did not match the client.'
  );
  assert.equal(
    routing.rootErrorOptionCallbackRecords[0].rootOptionCallbackKey,
    'onRecoverableError'
  );
  assert.equal(
    routing.rootErrorOptionCallbackRecords[0].rootOptionCallbackValueInfo.type,
    'function'
  );
  assert.equal(
    Object.hasOwn(routing.rootErrorOptionCallbackRecords[0], 'error'),
    false
  );

  const payload =
    rootBridge.getPrivateRootHydrationRecoverableErrorRoutingPayload(routing);
  assert.equal(payload.hydrateRootRecord, scenario.hydrateRecord);
  assert.equal(payload.hydrationOptions, scenario.hydrationOptions);
  assert.equal(payload.rootOptions, scenario.hydrationOptions);
  assert.equal(payload.recoverableErrorMetadata, scenario.hydrateRecord.recoverableErrorMetadata);
  assert.equal(payload.hydrationReplayErrorMetadata, scenario.replayMetadata);
  assert.equal(payload.mismatchRows[0], scenario.hydrateRecord.textMismatchDiagnostics.mismatchRows[0]);
  assert.equal(payload.recoverableErrorRows[0], scenario.hydrateRecord.recoverableErrorMetadata.recoverableErrorRows[0]);
  assert.equal(payload.rootErrorOptionCallbackRecords[0], routing.rootErrorOptionCallbackRecords[0]);
  assert.deepEqual(scenario.container.__registrations, []);
  assert.deepEqual(scenario.document.__registrations, []);

  assert.throws(
    () =>
      scenario.bridge.createHydrationRecoverableErrorRouting(
        scenario.hydrateRecord,
        scenario.hydrateRecord.recoverableErrorMetadata,
        scenario.replayMetadata,
        {
          rootOptions: {
            onRecoverableError
          }
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_HYDRATION_RECOVERABLE_ERROR_ROUTING'
    }
  );
  assert.throws(
    () =>
      scenario.bridge.createHydrationRecoverableErrorRouting(
        scenario.hydrateRecord,
        scenario.hydrateRecord.recoverableErrorMetadata,
        scenario.replayMetadata,
        {
          rootErrorCallbackInvocationCount: 1,
          rootOptions: scenario.hydrationOptions
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_HYDRATION_RECOVERABLE_ERROR_ROUTING'
    }
  );

  const noMismatch = createHydrationRecoverableRoutingScenario({
    actualText: 'stable text',
    expectedText: 'stable text',
    label: 'recoverable-route-no-mismatch',
    hydrationOptions: scenario.hydrationOptions
  });
  assert.equal(noMismatch.hydrateRecord.textMismatchDiagnostics.mismatchCount, 0);
  assert.throws(
    () =>
      noMismatch.bridge.createHydrationRecoverableErrorRouting(
        noMismatch.hydrateRecord,
        noMismatch.hydrateRecord.recoverableErrorMetadata,
        noMismatch.replayMetadata,
        {
          rootOptions: scenario.hydrationOptions
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_HYDRATION_RECOVERABLE_ERROR_ROUTING'
    }
  );
});

test('private hydration recoverable error callback invocation gate uses owned root option only', () => {
  const privateInvocationCalls = [];

  function onUncaughtError(error) {
    privateInvocationCalls.push(['uncaught', error.message]);
  }
  function onCaughtError(error) {
    privateInvocationCalls.push(['caught', error.message]);
  }
  function onRecoverableError(error, errorInfo) {
    privateInvocationCalls.push({
      error,
      errorInfo,
      message: error.message,
      name: error.name
    });
  }

  const scenario = createHydrationRecoverableRoutingScenario({
    actualText: 'server heading',
    expectedText: 'client heading',
    label: 'recoverable-callback',
    hydrationOptions: {
      identifierPrefix: 'recoverable-callback-',
      onCaughtError,
      onRecoverableError,
      onUncaughtError
    }
  });
  const routing = scenario.bridge.createHydrationRecoverableErrorRouting(
    scenario.hydrateRecord,
    scenario.hydrateRecord.recoverableErrorMetadata,
    scenario.replayMetadata,
    {
      mismatchLabels: ['heading-text'],
      rootOptions: scenario.hydrationOptions,
      source: 'hydration-boundary-test-recoverable-callback-routing'
    }
  );

  assert.throws(
    () =>
      scenario.bridge.invokeHydrationRecoverableErrorCallbacks(routing, {
        rootOptions: scenario.hydrationOptions
      }),
    {
      code:
        'FAST_REACT_DOM_INVALID_HYDRATION_RECOVERABLE_ERROR_CALLBACK_INVOCATION'
    }
  );
  assert.throws(
    () =>
      scenario.bridge.invokeHydrationRecoverableErrorCallbacks(routing, {
        enableCallbackInvocation: true,
        rootOptions: {
          onRecoverableError
        }
      }),
    {
      code:
        'FAST_REACT_DOM_INVALID_HYDRATION_RECOVERABLE_ERROR_CALLBACK_INVOCATION'
    }
  );
  assert.deepEqual(privateInvocationCalls, []);

  const invocation =
    scenario.bridge.invokeHydrationRecoverableErrorCallbacks(routing, {
      enableCallbackInvocation: true,
      invocationLabels: ['heading-callback'],
      rootOptions: scenario.hydrationOptions,
      source: 'hydration-boundary-test-recoverable-callback-invocation'
    });

  assert.equal(
    rootBridge.isPrivateRootHydrationRecoverableErrorCallbackInvocationRecord(
      invocation
    ),
    true
  );
  assert.equal(
    invocation.$$typeof,
    rootBridge
      .privateRootHydrationRecoverableErrorCallbackInvocationRecordType
  );
  assert.equal(
    invocation.invocationStatus,
    rootBridge
      .ROOT_BRIDGE_HYDRATION_RECOVERABLE_ERROR_CALLBACK_INVOCATION_RECORDED
  );
  assert.equal(invocation.sourceRequestId, 'recoverable-callback-request:1');
  assert.equal(invocation.hydrateId, 'recoverable-callback-hydrate:1');
  assert.equal(invocation.rootRecordId, 'recoverable-callback-boundary:1');
  assert.equal(invocation.rootOptionsHandleStatus, 'matched-hydrate-root-options');
  assert.equal(invocation.rootOptionsOwnershipStatus, 'owned-by-hydrate-root-options');
  assert.equal(invocation.rootOptionCallbackKey, 'onRecoverableError');
  assert.equal(invocation.rootOptionCallbackConfigured, true);
  assert.equal(invocation.onRecoverableErrorConfigured, true);
  assert.equal(invocation.callbackInvocationGateEnabled, true);
  assert.equal(invocation.callbackInvocationRecordCount, 1);
  assert.equal(invocation.callbackInvocationErrorCount, 0);
  assert.equal(invocation.onRecoverableErrorInvocationCount, 1);
  assert.equal(invocation.rootErrorCallbackInvocationCount, 1);
  assert.equal(invocation.privateRootErrorCallbacksInvoked, true);
  assert.equal(invocation.privateOnRecoverableErrorInvoked, true);
  assert.equal(invocation.onRecoverableErrorInvoked, true);
  assert.equal(invocation.publicRootErrorCallbacksInvoked, false);
  assert.equal(invocation.publicOnRecoverableErrorInvoked, false);
  assert.equal(invocation.publicRootExecution, false);
  assert.equal(invocation.publicRootCreated, false);
  assert.equal(invocation.hydration, false);
  assert.equal(invocation.canHydrate, false);
  assert.equal(invocation.hydrationCompatibilityClaimed, false);
  assert.equal(invocation.domMutation, false);
  assert.equal(invocation.recoverableErrorsQueued, false);
  assert.equal(invocation.compatibilityClaimed, false);
  assert.equal(invocation.publicRootBehaviorChanged, false);
  assert.deepEqual(
    invocation.rootOptionOwnershipRecord,
    {
      callbackIdentityMatchesRootOptions: true,
      compatibilityClaimed: false,
      kind:
        'FastReactDomPrivateRootHydrationRecoverableErrorRootOptionOwnershipRecord',
      ownerHydrateId: 'recoverable-callback-hydrate:1',
      ownerRequestId: 'recoverable-callback-request:1',
      ownerRequestType: 'hydrateRoot',
      ownerRootKind: hydrationGate.UNSUPPORTED_HYDRATION_ROOT_KIND,
      ownerRootRecordId: 'recoverable-callback-boundary:1',
      ownerRootTag: rootBridge.CONCURRENT_ROOT_TAG,
      publicHydrateRootCompatibilityClaimed: false,
      publicRootBehaviorChanged: false,
      rootOptionCallbackConfigured: true,
      rootOptionCallbackKey: 'onRecoverableError',
      rootOptionCallbackOwnedByHydrateRoot: true,
      rootOptionCallbackValueInfo: {
        length: 2,
        name: 'onRecoverableError',
        type: 'function'
      },
      rootOptionsHandleStatus: 'matched-hydrate-root-options',
      rootOptionsSource: 'hydrateRoot-options',
      status: 'owned-by-hydrate-root-options'
    }
  );

  assert.equal(privateInvocationCalls.length, 1);
  assert.equal(privateInvocationCalls[0].message, 'Hydration failed because the server rendered text did not match the client.');
  assert.equal(privateInvocationCalls[0].name, 'Error');
  assert.equal(privateInvocationCalls[0].error instanceof Error, true);
  assert.deepEqual(privateInvocationCalls[0].errorInfo, {
    componentStack: null
  });
  assert.equal(Object.hasOwn(privateInvocationCalls[0].errorInfo, 'digest'), false);
  assert.deepEqual(
    invocation.callbackInvocationRecords.map((record) => [
      record.phase,
      record.sourceLabel,
      record.sourceCallbackRecord,
      record.textMismatchRowId,
      record.recoverableErrorMetadataId,
      record.expectedText,
      record.actualText,
      record.errorName,
      record.errorMessage,
      record.errorInfoComponentStack,
      record.callbackReturnStatus,
      record.callbackErrorCaptured,
      record.rootOptionOwnershipStatus,
      record.rootOptionCallbackOwnedByHydrateRoot,
      record.onRecoverableErrorInvoked,
      record.publicOnRecoverableErrorInvoked,
      record.queuedRecoverableError,
      record.compatibilityClaimed
    ]),
    [
      [
        'hydration-recoverable-error-callback-invocation',
        'heading-callback',
        routing.rootErrorOptionCallbackRecords[0],
        'recoverable-callback-boundary:1:text-mismatch:0',
        'recoverable-callback-boundary:1:recoverable-error:0',
        'client heading',
        'server heading',
        'Error',
        'Hydration failed because the server rendered text did not match the client.',
        null,
        'returned-undefined',
        false,
        'owned-by-hydrate-root-options',
        true,
        true,
        false,
        false,
        false
      ]
    ]
  );

  const payload =
    rootBridge
      .getPrivateRootHydrationRecoverableErrorCallbackInvocationPayload(
        invocation
      );
  assert.equal(payload.callback, onRecoverableError);
  assert.equal(payload.routingRecord, routing);
  assert.equal(payload.rootOptions, scenario.hydrationOptions);
  assert.equal(payload.hydrationOptions, scenario.hydrationOptions);
  assert.equal(payload.hydrateRootRecord, scenario.hydrateRecord);
  assert.equal(payload.rootOptionOwnershipRecord, invocation.rootOptionOwnershipRecord);
  assert.equal(payload.sourceRootErrorOptionCallbackRecords[0], routing.rootErrorOptionCallbackRecords[0]);
  assert.equal(payload.callbackInvocationResults[0].callback, onRecoverableError);
  assert.equal(payload.callbackInvocationResults[0].error, privateInvocationCalls[0].error);
  assert.equal(payload.callbackInvocationResults[0].errorInfo, privateInvocationCalls[0].errorInfo);
  assert.equal(payload.callbackInvocationResults[0].returnValue, undefined);
  assert.equal(payload.callbackInvocationResults[0].callbackError, null);
  assert.deepEqual(scenario.container.__registrations, []);
  assert.deepEqual(scenario.document.__registrations, []);

  const noCallback = createHydrationRecoverableRoutingScenario({
    actualText: 'server no callback',
    expectedText: 'client no callback',
    label: 'recoverable-callback-missing',
    hydrationOptions: {
      identifierPrefix: 'recoverable-callback-missing-'
    }
  });
  const noCallbackRouting =
    noCallback.bridge.createHydrationRecoverableErrorRouting(
      noCallback.hydrateRecord,
      noCallback.hydrateRecord.recoverableErrorMetadata,
      noCallback.replayMetadata,
      {
        rootOptions: noCallback.hydrationOptions
      }
    );
  assert.throws(
    () =>
      noCallback.bridge.invokeHydrationRecoverableErrorCallbacks(
        noCallbackRouting,
        {
          enableCallbackInvocation: true,
          rootOptions: noCallback.hydrationOptions
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_HYDRATION_RECOVERABLE_ERROR_CALLBACK_INVOCATION'
    }
  );
});

test('private hydration replay queue drain-order diagnostics sort blocked targets by dehydrated metadata', () => {
  const document = createDocument('drain-order');
  const container = createElement('DIV', document);
  const firstBoundaryTarget = createElement('BUTTON', document);
  const rootTarget = createElement('INPUT', document);
  const secondBoundaryTarget = createElement('A', document);
  firstBoundaryTarget.parentNode = container;
  rootTarget.parentNode = container;
  secondBoundaryTarget.parentNode = container;
  container.childNodes = [
    createComment('$'),
    firstBoundaryTarget,
    createComment('/$'),
    rootTarget,
    createComment('$'),
    secondBoundaryTarget,
    createComment('/$')
  ];

  const gate = hydrationGate.createHydrationBoundaryGate({
    recordIdPrefix: 'hydration-drain'
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    {
      props: {
        children: 'drain'
      },
      type: 'App'
    },
    {
      identifierPrefix: 'drain-order-'
    }
  );
  const secondBoundaryWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      'mouseover',
      0
    );
  const rootWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      'change',
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const firstBoundaryWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      'click',
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const secondBoundaryRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      secondBoundaryWrapper,
      createNativeEvent('mouseover', secondBoundaryTarget)
    );
  const rootRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      rootWrapper,
      createNativeEvent('change', rootTarget)
    );
  const firstBoundaryRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      firstBoundaryWrapper,
      createNativeEvent('click', firstBoundaryTarget)
    );
  const diagnostics =
    pluginEventSystem.createHydrationReplayEventQueueDiagnostic(
      [secondBoundaryRecord, rootRecord, firstBoundaryRecord],
      {
        dehydratedTargetResolution: record.targetResolutionDiagnostics,
        markerReplayTargetCandidates:
          record.replayQueueDiagnostics.markerReplayTargetCandidates,
        source: 'hydration-boundary-test-drain-order'
      }
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      record,
      [secondBoundaryRecord, rootRecord, firstBoundaryRecord],
      {
        source: 'hydration-boundary-test-ownership-gate'
      }
    );

  assertHydrationReplayEventQueueDiagnostics(diagnostics, {
    blockedEventReplayTargetCount: 3,
    markerReplayTargetCandidateCount: 2,
    status: 'blocked-event-replay-targets-recorded'
  });
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.kind,
    pluginEventSystem.HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.orderSource,
    'dehydrated-target-root-metadata'
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.status,
    'blocked-replay-queue-drain-order-recorded'
  );
  assert.equal(diagnostics.drainOrderDiagnosticsAccepted, true);
  assert.equal(
    diagnostics.drainOrder,
    diagnostics.replayQueueDrainOrderDiagnostics.drainOrder
  );
  assert.deepEqual(
    diagnostics.drainOrder.map((entry) => [
      entry.drainOrder,
      entry.inputOrder,
      entry.domEventName,
      entry.queueName,
      entry.targetPath,
      entry.blockedOnStatus,
      entry.blockedOnKind,
      entry.dehydratedBoundaryOwnerId,
      entry.targetPathSortKey,
      entry.willDrainReplayQueues,
      entry.willReplay
    ]),
    [
      [
        0,
        2,
        'click',
        'discrete-hydration-replay-attempt',
        'container.childNodes[1]',
        'blocked-on-dehydrated-boundary',
        'suspense-boundary',
        'hydration-drain:1:boundary:0',
        '00000001',
        false,
        false
      ],
      [
        1,
        1,
        'change',
        'queuedChangeEventTargets',
        'container.childNodes[3]',
        'blocked-on-dehydrated-root',
        'dehydrated-root',
        null,
        '00000003',
        false,
        false
      ],
      [
        2,
        0,
        'mouseover',
        'queuedMouse',
        'container.childNodes[5]',
        'blocked-on-dehydrated-boundary',
        'suspense-boundary',
        'hydration-drain:1:boundary:1',
        '00000005',
        false,
        false
      ]
    ]
  );
  assert.deepEqual(
    diagnostics.blockedEventReplayTargets.map((entry) => [
      entry.inputOrder,
      entry.targetPath,
      entry.blockedOnStatus,
      entry.dehydratedBoundaryOwnerId,
      entry.replayQueueDrained,
      entry.willDrainReplayQueues,
      entry.willReplay
    ]),
    [
      [
        0,
        'container.childNodes[5]',
        'blocked-on-dehydrated-boundary',
        'hydration-drain:1:boundary:1',
        false,
        false,
        false
      ],
      [
        1,
        'container.childNodes[3]',
        'blocked-on-dehydrated-root',
        null,
        false,
        false,
        false
      ],
      [
        2,
        'container.childNodes[1]',
        'blocked-on-dehydrated-boundary',
        'hydration-drain:1:boundary:0',
        false,
        false,
        false
      ]
    ]
  );
  assertHydrationReplayOwnershipGateDiagnostics(ownershipDiagnostics, {
    dehydratedBoundaryOwnershipRequiredCount: 2,
    dehydratedBoundaryOwnershipRetainedCount: 2,
    ownershipRetainedCount: 3,
    ownershipRowCount: 3,
    rootOwnershipRetainedCount: 3,
    rootRecordId: 'hydration-drain:1',
    status: 'blocked-replay-ownership-retained-through-drain-order'
  });
  assert.deepEqual(
    ownershipDiagnostics.eventReplayQueueDiagnostics.drainOrder,
    diagnostics.drainOrder
  );
  assert.deepEqual(
    ownershipDiagnostics.ownershipRows.map((entry) => [
      entry.drainOrder,
      entry.inputOrder,
      entry.domEventName,
      entry.queueName,
      entry.eventQueueRootOwnershipStatus,
      entry.drainOrderRootOwnershipStatus,
      entry.rootOwnershipRetained,
      entry.dehydratedBoundaryOwnershipRequired,
      entry.eventQueueDehydratedBoundaryOwnerId,
      entry.drainOrderDehydratedBoundaryOwnerId,
      entry.dehydratedBoundaryOwnershipRetained,
      entry.dehydratedBoundaryOwnershipStatus,
      entry.eventQueueTargetPath,
      entry.drainOrderTargetPath,
      entry.targetPathRetained,
      entry.queueIdentityRetained,
      entry.blockedOwnerRetained,
      entry.ownershipRetainedThroughDrainOrder,
      entry.replayQueueDrained,
      entry.willDrainReplayQueues,
      entry.willReplay
    ]),
    [
      [
        0,
        2,
        'click',
        'discrete-hydration-replay-attempt',
        'owned-by-dehydrated-root',
        'owned-by-dehydrated-root',
        true,
        true,
        'hydration-drain:1:boundary:0',
        'hydration-drain:1:boundary:0',
        true,
        'retained-dehydrated-boundary-owner',
        'container.childNodes[1]',
        'container.childNodes[1]',
        true,
        true,
        true,
        true,
        false,
        false,
        false
      ],
      [
        1,
        1,
        'change',
        'queuedChangeEventTargets',
        'owned-by-dehydrated-root',
        'owned-by-dehydrated-root',
        true,
        false,
        null,
        null,
        null,
        'not-applicable-blocked-on-dehydrated-root',
        'container.childNodes[3]',
        'container.childNodes[3]',
        true,
        true,
        true,
        true,
        false,
        false,
        false
      ],
      [
        2,
        0,
        'mouseover',
        'queuedMouse',
        'owned-by-dehydrated-root',
        'owned-by-dehydrated-root',
        true,
        true,
        'hydration-drain:1:boundary:1',
        'hydration-drain:1:boundary:1',
        true,
        'retained-dehydrated-boundary-owner',
        'container.childNodes[5]',
        'container.childNodes[5]',
        true,
        true,
        true,
        true,
        false,
        false,
        false
      ]
    ]
  );
  assert.equal(secondBoundaryRecord.hydrationReplay.queued, false);
  assert.equal(rootRecord.hydrationReplay.queued, false);
  assert.equal(firstBoundaryRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
});

test('private hydration replay error metadata connects ownership rows to root options without callbacks', () => {
  const document = createDocument('replay-error-metadata');
  const container = createElement('DIV', document);
  const firstBoundaryTarget = createElement('BUTTON', document);
  const rootTarget = createElement('INPUT', document);
  const secondBoundaryTarget = createElement('A', document);
  const publicRootErrorCalls = [];
  firstBoundaryTarget.parentNode = container;
  rootTarget.parentNode = container;
  secondBoundaryTarget.parentNode = container;
  container.childNodes = [
    createComment('$'),
    firstBoundaryTarget,
    createComment('/$'),
    rootTarget,
    createComment('$'),
    secondBoundaryTarget,
    createComment('/$')
  ];

  function onUncaughtError(error) {
    publicRootErrorCalls.push(['uncaught', error.message]);
  }
  function onCaughtError(error) {
    publicRootErrorCalls.push(['caught', error.message]);
  }
  function onRecoverableError(error) {
    publicRootErrorCalls.push(['recoverable', error.message]);
  }

  const hydrationOptions = {
    identifierPrefix: 'replay-error-',
    onCaughtError,
    onRecoverableError,
    onUncaughtError
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hydrateIdPrefix: 'replay-error-hydrate',
    hydrationRecordIdPrefix: 'replay-error-boundary',
    requestIdPrefix: 'replay-error-request'
  });
  const hydrateRecord = bridge.createHydrateRoot(
    container,
    {
      props: {
        children: 'replay error metadata'
      },
      type: 'App'
    },
    hydrationOptions
  );
  const secondBoundaryRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        'mouseover',
        0
      ),
      createNativeEvent('mouseover', secondBoundaryTarget)
    );
  const rootRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        'change',
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent('change', rootTarget)
    );
  const firstBoundaryRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        'click',
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent('click', firstBoundaryTarget)
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      hydrateRecord.hydrationBoundaryRecord,
      [secondBoundaryRecord, rootRecord, firstBoundaryRecord],
      {
        source: 'hydration-boundary-test-replay-error-metadata'
      }
    );

  const metadata = bridge.createHydrationReplayErrorMetadata(
    hydrateRecord,
    ownershipDiagnostics,
    {
      replayTargetLabels: ['first-boundary', 'root-target', 'second-boundary'],
      source: 'hydration-boundary-test-replay-error-metadata'
    }
  );

  assert.equal(
    rootBridge.isPrivateRootHydrationReplayErrorMetadataRecord(metadata),
    true
  );
  assert.equal(
    metadata.$$typeof,
    rootBridge.privateRootHydrationReplayErrorMetadataRecordType
  );
  assert.equal(
    metadata.metadataStatus,
    rootBridge.ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_RECORDED
  );
  assert.equal(metadata.sourceRequestId, 'replay-error-request:1');
  assert.equal(metadata.hydrateId, 'replay-error-hydrate:1');
  assert.equal(metadata.rootRecordId, 'replay-error-boundary:1');
  assert.equal(metadata.sourceOwnershipDiagnosticKind, ownershipDiagnostics.kind);
  assert.equal(
    metadata.sourceOwnershipDiagnosticStatus,
    'blocked-replay-ownership-retained-through-drain-order'
  );
  assert.equal(metadata.ownershipRowCount, 3);
  assert.equal(metadata.rootOwnershipRetainedCount, 3);
  assert.equal(metadata.dehydratedBoundaryOwnershipRequiredCount, 2);
  assert.equal(metadata.dehydratedBoundaryOwnershipRetainedCount, 2);
  assert.equal(metadata.rootErrorOptionCallbackRecordCount, 3);
  assert.equal(metadata.onUncaughtErrorConfigured, true);
  assert.equal(metadata.onCaughtErrorConfigured, true);
  assert.equal(metadata.onRecoverableErrorConfigured, true);
  assert.equal(metadata.hydration, false);
  assert.equal(metadata.eventDispatch, false);
  assert.equal(metadata.eventsReplayed, false);
  assert.equal(metadata.publicRootErrorCallbacksInvoked, false);
  assert.equal(metadata.rootErrorCallbackInvocationCount, 0);
  assert.equal(metadata.reportGlobalErrorInvoked, false);
  assert.equal(metadata.rootErrorsReported, false);
  assert.equal(metadata.compatibilityClaimed, false);
  assert.deepEqual(publicRootErrorCalls, []);
  assert.deepEqual(
    metadata.rootErrorOptionCallbackRecords.map((record) => [
      record.phase,
      record.sourceLabel,
      record.domEventName,
      record.queueName,
      record.targetPath,
      record.rootOwnershipStatus,
      record.dehydratedBoundaryOwnerId,
      record.rootErrorCallbacksInvoked,
      record.reportGlobalErrorInvoked,
      record.willReplay
    ]),
    [
      [
        'hydration-replay',
        'first-boundary',
        'click',
        'discrete-hydration-replay-attempt',
        'container.childNodes[1]',
        'owned-by-dehydrated-root',
        'replay-error-boundary:1:boundary:0',
        false,
        false,
        false
      ],
      [
        'hydration-replay',
        'root-target',
        'change',
        'queuedChangeEventTargets',
        'container.childNodes[3]',
        'owned-by-dehydrated-root',
        null,
        false,
        false,
        false
      ],
      [
        'hydration-replay',
        'second-boundary',
        'mouseover',
        'queuedMouse',
        'container.childNodes[5]',
        'owned-by-dehydrated-root',
        'replay-error-boundary:1:boundary:1',
        false,
        false,
        false
      ]
    ]
  );
  assert.equal(
    metadata.rootErrorOptionCallbackRecords[0].errorMessage,
    'Hydration replay for click at container.childNodes[1] remained blocked-on-dehydrated-boundary.'
  );
  assert.equal(
    Object.hasOwn(metadata.rootErrorOptionCallbackRecords[0], 'error'),
    false
  );

  const payload =
    rootBridge.getPrivateRootHydrationReplayErrorMetadataPayload(metadata);
  assert.equal(payload.hydrateRootRecord, hydrateRecord);
  assert.equal(payload.hydrationOptions, hydrationOptions);
  assert.equal(payload.ownershipDiagnostics, ownershipDiagnostics);
  assert.equal(payload.rootErrorCallbacks.onUncaughtError.configured, true);
  assert.equal(payload.rootErrorOptionCallbackRecords[0], metadata.rootErrorOptionCallbackRecords[0]);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);

  const otherContainer = createElement('SECTION', document);
  const outsideTarget = createElement('BUTTON', document);
  const unownedRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        otherContainer,
        'click',
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent('click', outsideTarget)
    );
  const unownedOwnership =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      hydrateRecord.hydrationBoundaryRecord,
      unownedRecord,
      {
        source: 'hydration-boundary-test-unowned-replay-target'
      }
    );
  assert.throws(
    () =>
      bridge.createHydrationReplayErrorMetadata(
        hydrateRecord,
        unownedOwnership
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_ERROR_METADATA'
    }
  );
  assert.throws(
    () =>
      bridge.createHydrationReplayErrorMetadata(
        hydrateRecord,
        hydrateRecord.hydrationBoundaryRecord.eventReplayOwnershipDiagnostics
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_ERROR_METADATA'
    }
  );
});

test('private hydration recoverable error boundary admission consumes current hydrateRoot replay lifecycle evidence', () => {
  const recoverableErrorCalls = [];

  function onRecoverableError(error) {
    recoverableErrorCalls.push(error.message);
  }

  const scenario = createHydrationRecoverableBoundaryAdmissionScenario({
    actualText: 'server boundary text',
    expectedText: 'client boundary text',
    hydrationOptions: {
      identifierPrefix: 'recoverable-boundary-admission-',
      onRecoverableError
    },
    label: 'recoverable-boundary-admission'
  });
  const admission = createHydrationRecoverableBoundaryAdmission(scenario, {
    options: {
      source: 'hydration-boundary-test-recoverable-boundary-admission'
    }
  });

  assert.equal(
    hydrationGate
      .isPrivateHydrationRecoverableErrorBoundaryAdmissionRecord(
        admission
      ),
    true
  );
  assert.equal(
    admission.kind,
    hydrationGate.HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_RECORD_KIND
  );
  assert.equal(
    admission.gateId,
    hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionGateId
  );
  assert.equal(
    admission.metadataId,
    hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionMetadataId
  );
  assert.equal(
    admission.status,
    hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionStatus
  );
  assert.equal(Object.isFrozen(admission), true);
  assert.equal(admission.privateAdmission, true);
  assert.equal(admission.diagnosticOnly, true);
  assert.equal(admission.readOnly, true);
  assert.equal(admission.compatibilityClaimed, false);
  assert.equal(admission.publicHydrationCompatibilityClaimed, false);
  assert.equal(admission.publicHydrationReplayCompatibilityClaimed, false);
  assert.equal(admission.publicHydrateRootSupported, false);
  assert.equal(admission.publicRootExecution, false);
  assert.equal(admission.nativeExecution, false);
  assert.equal(admission.reconcilerExecution, false);
  assert.equal(admission.hydration, false);
  assert.equal(admission.domMutation, false);
  assert.equal(admission.eventDispatch, false);
  assert.equal(admission.eventsReplayed, false);
  assert.equal(admission.replayQueuesDrained, false);
  assert.equal(admission.recoverableErrorsQueued, false);
  assert.equal(admission.onRecoverableErrorInvoked, false);
  assert.equal(admission.publicOnRecoverableErrorInvoked, false);
  assert.equal(admission.rootErrorCallbackInvocationCount, 0);
  assert.equal(admission.rootRecordId, 'recoverable-boundary-admission-boundary:1');
  assert.equal(
    admission.acceptedBoundaryMetadataDiagnostics,
    scenario.hydrateRecord.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    admission.acceptedBoundaryMetadataId,
    hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionMetadataId
  );
  assert.equal(
    admission.acceptedBoundaryMetadataRow.recordType,
    hydrationGate.HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_RECORD_KIND
  );
  assert.equal(
    admission.recoverableErrorPreflightRecord,
    scenario.recoverableErrorPreflight
  );
  assert.equal(admission.recoverableErrorPreflightAccepted, true);
  assert.equal(
    admission.targetClaimingDiagnostic,
    scenario.targetClaimingDiagnostic
  );
  assert.equal(admission.targetClaimAccepted, true);
  assert.equal(admission.targetClaimExecuted, false);
  assert.equal(admission.replayExecutionRecord, scenario.replayExecutionRecord);
  assert.equal(admission.replayExecutionAccepted, true);
  assert.equal(admission.replayTargetDispatchExecutionBlocked, true);
  assert.equal(
    admission.sourceHydrateRootPreflightKind,
    'FastReactDomPrivateHydrateRootPublicFacadePreflightRecord'
  );
  assert.equal(
    admission.sourceEventReplayPreflightKind,
    'FastReactDomPrivateHydrateRootPublicFacadeEventReplayPreflightRecord'
  );
  assert.equal(
    admission.sourceExecutionPreflightKind,
    'FastReactDomPrivateHydrateRootPublicFacadeExecutionPreflightRecord'
  );
  assert.equal(
    admission.sourceLifecycleRequestBoundaryKind,
    'FastReactDomPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryRecord'
  );
  assert.equal(admission.sourceLifecycleBoundarySourceOwned, true);
  assert.equal(admission.sourceLifecycleBoundaryActive, true);
  assert.equal(admission.sourceLifecycleBoundaryCurrent, true);
  assert.equal(admission.sourceLifecycleContainerSnapshotCurrent, true);
  assert.equal(admission.markerPathCurrent, true);
  assert.equal(admission.markerPathCurrentStatus, 'current-marker-row-retained');
  assert.equal(admission.targetPathCurrent, true);
  assert.equal(admission.targetPathCurrentStatus, 'current-target-path-retained');
  assert.equal(admission.targetPathResolvedToDispatchTarget, true);
  assert.equal(admission.targetPathUniqueInContainer, true);
  assert.equal(admission.targetPathParentChainRetained, true);
  assert.equal(admission.targetContainerMatchesBoundaryRecord, true);
  assert.equal(admission.hydratableLookupTargetPathRetained, true);
  assert.equal(admission.markerPath, 'container.childNodes[0]');
  assert.equal(admission.targetPath, 'container.childNodes[1]');
  assert.equal(admission.recoverableErrorMetadataAccepted, true);
  assert.equal(admission.recoverableErrorMetadataCount, 1);
  assert.equal(admission.queuedRecoverableErrorCount, 0);
  assert.equal(admission.wouldQueueRecoverableErrorCount, 1);
  assert.equal(admission.rootOptionCallbackConfigured, true);
  assert.deepEqual(
    admission.recoverableErrorBoundaryRows.map((row) => [
      row.metadataId,
      row.markerPath,
      row.targetPath,
      row.markerPathCurrent,
      row.targetPathCurrent,
      row.replayExecutionAccepted,
      row.queuedRecoverableError,
      row.onRecoverableErrorInvoked,
      row.compatibilityClaimed
    ]),
    [
      [
        hydrationGate
          .privateHydrationRecoverableErrorBoundaryAdmissionMetadataId,
        'container.childNodes[0]',
        'container.childNodes[1]',
        true,
        true,
        true,
        false,
        false,
        false
      ]
    ]
  );

  const payload =
    hydrationGate
      .getPrivateHydrationRecoverableErrorBoundaryAdmissionPayload(
        admission
      );
  assert.equal(payload.hydrationBoundaryRecord, scenario.hydrationBoundaryRecord);
  assert.equal(payload.hydrationOptions, scenario.hydrationOptions);
  assert.equal(
    payload.recoverableErrorPreflightRecord,
    scenario.recoverableErrorPreflight
  );
  assert.equal(payload.targetClaimingDiagnostic, scenario.targetClaimingDiagnostic);
  assert.equal(payload.replayExecutionRecord, scenario.replayExecutionRecord);
  assert.equal(
    payload.sourceLedger.lifecycleRequestBoundary,
    scenario.lifecycleRequestBoundary
  );
  assert.equal(
    payload.currentTargetPathEvidence.targetPathResolution.node,
    scenario.boundaryTarget
  );
  assert.deepEqual(recoverableErrorCalls, []);
  assert.deepEqual(scenario.container.__registrations, []);
  assert.deepEqual(scenario.document.__registrations, []);
});

test('private hydration recoverable error boundary admission rejects stale cloned cross-root lifecycle and alias evidence', () => {
  const scenario = createHydrationRecoverableBoundaryAdmissionScenario({
    actualText: 'server stale text',
    expectedText: 'client stale text',
    hydrationOptions: {
      identifierPrefix: 'recoverable-boundary-negative-',
      onRecoverableError() {}
    },
    label: 'recoverable-boundary-negative'
  });
  const other = createHydrationRecoverableBoundaryAdmissionScenario({
    actualText: 'server other text',
    expectedText: 'client other text',
    hydrationOptions: {
      identifierPrefix: 'recoverable-boundary-other-',
      onRecoverableError() {}
    },
    label: 'recoverable-boundary-other'
  });
  const invalidAdmission = {
    code:
      hydrationGate.INVALID_HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_CODE
  };

  assert.throws(
    () =>
      createHydrationRecoverableBoundaryAdmission(scenario, {
        recoverableErrorPreflightRecord: Object.freeze({
          ...scenario.recoverableErrorPreflight
        })
      }),
    invalidAdmission
  );
  assert.throws(
    () =>
      createHydrationRecoverableBoundaryAdmission(scenario, {
        targetClaimingDiagnostic: Object.freeze({
          ...scenario.targetClaimingDiagnostic
        })
      }),
    invalidAdmission
  );
  assert.throws(
    () =>
      createHydrationRecoverableBoundaryAdmission(scenario, {
        replayExecutionRecord: Object.freeze({
          ...scenario.replayExecutionRecord
        })
      }),
    invalidAdmission
  );
  assert.throws(
    () =>
      createHydrationRecoverableBoundaryAdmission(scenario, {
        options: {
          lifecycleRequestBoundary: undefined
        }
      }),
    invalidAdmission
  );
  for (const mixedSourceLedgerOptions of [
    {
      eventReplayPreflightRecord: other.eventReplayPreflightRecord
    },
    {
      executionPreflightRecord: other.executionPreflightRecord
    },
    {
      hydrateRootPreflightRecord: other.hydrateRecord
    },
    {
      lifecycleRequestBoundary: other.lifecycleRequestBoundary
    }
  ]) {
    assert.throws(
      () =>
        createHydrationRecoverableBoundaryAdmission(scenario, {
          options: mixedSourceLedgerOptions
        }),
      invalidAdmission
    );
  }
  assert.equal(
    hydrateRootSourceLedger.registerPrivateHydrateRootSourceLedgerRecord,
    undefined
  );
  assert.equal(
    hydrateRootSourceLedger
      .installPrivateHydrateRootSourceLedgerPayloadReaders,
    undefined
  );
  assert.deepEqual(Object.getOwnPropertySymbols(hydrateRootSourceLedger), []);
  assert.equal(
    hydrateRootSourceLedger[
      Symbol.for('fast.react_dom.private_hydrate_root_source_ledger_register')
    ],
    undefined
  );
  assert.equal(
    hydrateRootSourceLedger[
      Symbol.for(
        'fast.react_dom.private_hydrate_root_source_ledger_payload_reader'
      )
    ],
    undefined
  );
  assert.throws(
    () =>
      vm.runInNewContext(
        'hydrateRootSourceLedger.installPrivateHydrateRootSourceLedgerPayloadReaders({});',
        {hydrateRootSourceLedger},
        {filename: '/tmp/root-bridge.js'}
      ),
    {
      name: 'TypeError',
      message:
        /installPrivateHydrateRootSourceLedgerPayloadReaders is not a function/
    }
  );
  const clonedLifecycleRequestBoundary = Object.freeze({
    ...scenario.lifecycleRequestBoundary
  });
  const clonedHydrateRootPreflightRecord = Object.freeze({
    ...scenario.hydrateRecord,
    lifecycleRequestBoundary: clonedLifecycleRequestBoundary
  });
  const clonedEventReplayPreflightRecord = Object.freeze({
    ...scenario.eventReplayPreflightRecord,
    lifecycleRequestBoundary: clonedLifecycleRequestBoundary
  });
  const clonedExecutionPreflightRecord = Object.freeze({
    ...scenario.executionPreflightRecord,
    eventReplayPreflight: clonedEventReplayPreflightRecord,
    lifecycleRequestBoundary: clonedLifecycleRequestBoundary
  });
  const sourceLedgerGetterNames = [
    'getPrivateHydrateRootPublicFacadePreflightRecordPayload',
    'getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload',
    'getPrivateHydrateRootPublicFacadeExecutionPreflightPayload',
    'getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload'
  ];
  const sourceLedgerFakePayloads = new Map([
    [
      'getPrivateHydrateRootPublicFacadePreflightRecordPayload',
      rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
        scenario.hydrateRecord
      )
    ],
    [
      'getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload',
      rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
        scenario.eventReplayPreflightRecord
      )
    ],
    [
      'getPrivateHydrateRootPublicFacadeExecutionPreflightPayload',
      rootBridge.getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(
        scenario.executionPreflightRecord
      )
    ],
    [
      'getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload',
      rootBridge
        .getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload(
          scenario.lifecycleRequestBoundary
        )
    ]
  ]);
  for (const getterName of sourceLedgerGetterNames) {
    const descriptor = Object.getOwnPropertyDescriptor(rootBridge, getterName);
    const fakePayloadGetter = () => sourceLedgerFakePayloads.get(getterName);
    assert.equal(typeof rootBridge[getterName], 'function');
    assert.equal(descriptor.configurable, false);
    assert.equal(descriptor.writable, false);
    assert.throws(() => {
      rootBridge[getterName] = fakePayloadGetter;
    }, TypeError);
    assert.throws(
      () =>
        Object.defineProperty(rootBridge, getterName, {
          value: fakePayloadGetter
        }),
      TypeError
    );
  }
  const rootBridgePath = path.join(
    packageRoot,
    'src/client/root-bridge.js'
  );
  const rootBridgeCacheKey = require.resolve(rootBridgePath);
  const rootBridgeCacheEntry = require.cache[rootBridgeCacheKey];
  const fakeRootBridgeCacheExports = Object.freeze(
    Object.fromEntries(
      sourceLedgerGetterNames.map((getterName) => [
        getterName,
        () => sourceLedgerFakePayloads.get(getterName)
      ])
    )
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(rootBridgeCacheEntry, 'exports')
      .writable,
    false
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(rootBridgeCacheEntry, 'exports')
      .configurable,
    false
  );
  assert.equal(
    Reflect.set(
      rootBridgeCacheEntry,
      'exports',
      fakeRootBridgeCacheExports
    ),
    false
  );
  assert.throws(() => {
    rootBridgeCacheEntry.exports = fakeRootBridgeCacheExports;
  }, TypeError);
  assert.equal(require(rootBridgePath), rootBridge);
  assert.equal(
    hydrationGate.registerPrivateHydrateRootSourceLedgerRecordForRootBridge,
    undefined
  );
  const spoofedHydrateRootPayload = Object.freeze({
    ...rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
      scenario.hydrateRecord
    ),
    ledgerKind: 'hydrate-root-public-facade-preflight-record',
    record: clonedHydrateRootPreflightRecord
  });
  assert.equal(
    vm.runInNewContext(
      `
(() => {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = () => rootBridgePath;
  try {
    const register =
      hydrationGate.registerPrivateHydrateRootSourceLedgerRecordForRootBridge;
    if (typeof register !== 'function') {
      return 'missing-registrar';
    }
    return register(
      clonedHydrateRootPreflightRecord,
      spoofedHydrateRootPayload,
      callerAuthorityToken
    ) === clonedHydrateRootPreflightRecord
      ? 'registered'
      : 'rejected';
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace;
  }
})()
      `,
      {
        callerAuthorityToken: Object.freeze({source: 'caller-first-token'}),
        clonedHydrateRootPreflightRecord,
        hydrationGate,
        rootBridgePath,
        spoofedHydrateRootPayload
      },
      {filename: rootBridgePath}
    ),
    'missing-registrar'
  );
  assert.equal(
    hydrateRootSourceLedger.getPrivateHydrateRootSourceLedgerRecordPayload(
      scenario.hydrateRecord
    ),
    null
  );
  for (const clonedSourceLedgerRecord of [
    clonedHydrateRootPreflightRecord,
    clonedEventReplayPreflightRecord,
    clonedExecutionPreflightRecord,
    clonedLifecycleRequestBoundary
  ]) {
    assert.equal(
      hydrateRootSourceLedger.getPrivateHydrateRootSourceLedgerRecordPayload(
        clonedSourceLedgerRecord
      ),
      null
    );
  }
  assert.throws(
    () =>
      createHydrationRecoverableBoundaryAdmission(scenario, {
        options: {
          eventReplayPreflightRecord: clonedEventReplayPreflightRecord,
          executionPreflightRecord: clonedExecutionPreflightRecord,
          hydrateRootPreflightRecord: clonedHydrateRootPreflightRecord,
          lifecycleRequestBoundary: clonedLifecycleRequestBoundary
        }
      }),
    invalidAdmission
  );
  assert.equal(require(rootBridgePath), rootBridge);
  assert.throws(
    () =>
      createHydrationRecoverableBoundaryAdmission(scenario, {
        options: {
          eventReplayPreflightRecord: other.eventReplayPreflightRecord,
          executionPreflightRecord: other.executionPreflightRecord,
          hydrateRootPreflightRecord: other.hydrateRecord,
          lifecycleRequestBoundary: other.lifecycleRequestBoundary
        }
      }),
    invalidAdmission
  );
  assert.throws(
    () =>
      createHydrationRecoverableBoundaryAdmission(scenario, {
        options: {
          onRecoverableError: scenario.hydrationOptions.onRecoverableError
        }
      }),
    invalidAdmission
  );
  assert.throws(
    () =>
      createHydrationRecoverableBoundaryAdmission(scenario, {
        options: {
          rootOptions: scenario.hydrationOptions
        }
      }),
    invalidAdmission
  );

  const staleMarker = createHydrationRecoverableBoundaryAdmissionScenario({
    actualText: 'server stale marker text',
    expectedText: 'client stale marker text',
    hydrationOptions: {
      identifierPrefix: 'recoverable-boundary-stale-marker-',
      onRecoverableError() {}
    },
    label: 'recoverable-boundary-stale-marker'
  });
  staleMarker.container.childNodes[0] = createComment('&');
  assert.throws(
    () => createHydrationRecoverableBoundaryAdmission(staleMarker),
    invalidAdmission
  );

  const staleTarget = createHydrationRecoverableBoundaryAdmissionScenario({
    actualText: 'server stale target text',
    expectedText: 'client stale target text',
    hydrationOptions: {
      identifierPrefix: 'recoverable-boundary-stale-target-',
      onRecoverableError() {}
    },
    label: 'recoverable-boundary-stale-target'
  });
  const replacementTarget = createElement('BUTTON', staleTarget.document);
  replacementTarget.parentNode = staleTarget.container;
  staleTarget.container.childNodes[1] = replacementTarget;
  assert.throws(
    () => createHydrationRecoverableBoundaryAdmission(staleTarget),
    invalidAdmission
  );

  assert.deepEqual(scenario.container.__registrations, []);
  assert.deepEqual(scenario.document.__registrations, []);
  assert.deepEqual(other.container.__registrations, []);
  assert.deepEqual(other.document.__registrations, []);
});

test('hydrateRoot source ledger rejects forged context and cache poisoning', () => {
  const script = `
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');

const packageRoot = ${JSON.stringify(packageRoot)};
const rootBridgePath = path.join(packageRoot, 'src/client/root-bridge.js');
const rootBridgeCacheKey = require.resolve(rootBridgePath);
const sourceLedgerPath = path.join(
  packageRoot,
  'src/client/hydrate-root-source-ledger.js'
);
const sourceLedgerCacheKey = require.resolve(sourceLedgerPath);
const sourceLedgerFakePayloads = new WeakMap();
const fakeRootBridgeCacheExports = Object.freeze({
  getPrivateHydrateRootPublicFacadePreflightRecordPayload(record) {
    return sourceLedgerFakePayloads.get(record) || null;
  },
  getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(record) {
    return sourceLedgerFakePayloads.get(record) || null;
  },
  getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(record) {
    return sourceLedgerFakePayloads.get(record) || null;
  },
  getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload(record) {
    return sourceLedgerFakePayloads.get(record) || null;
  }
});
const fakeHydrateRootSourceLedgerExports = Object.freeze({
  getPrivateHydrateRootSourceLedgerRecordPayload() {
    return null;
  },
  isPrivateHydrateRootSourceLedgerRecord() {
    return false;
  },
  [Symbol.for('fast.react_dom.private_hydrate_root_source_ledger_register')](
    record,
    payload
  ) {
    sourceLedgerFakePayloads.set(record, payload);
    return record;
  },
  [Symbol.for(
    'fast.react_dom.private_hydrate_root_source_ledger_payload_reader'
  )](record) {
    return sourceLedgerFakePayloads.get(record) || null;
  }
});

require.cache[rootBridgeCacheKey] = {
  id: rootBridgeCacheKey,
  filename: rootBridgeCacheKey,
  loaded: true,
  exports: fakeRootBridgeCacheExports
};
require.cache[sourceLedgerCacheKey] = {
  id: sourceLedgerCacheKey,
  filename: sourceLedgerCacheKey,
  loaded: true,
  exports: fakeHydrateRootSourceLedgerExports
};

const hydrationGate = require(path.join(
  packageRoot,
  'src/client/hydration-boundary-gate.js'
));
const hydrateRootSourceLedger = require(path.join(
  packageRoot,
  'src/client/hydrate-root-source-ledger.js'
));
assert.equal(require(rootBridgePath), fakeRootBridgeCacheExports);
assert.equal(hydrateRootSourceLedger, fakeHydrateRootSourceLedgerExports);
delete require.cache[rootBridgeCacheKey];
const rootBridge = require(rootBridgePath);
assert.notEqual(rootBridge, fakeRootBridgeCacheExports);
const domContainer = require(path.join(
  packageRoot,
  'src/client/dom-container.js'
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

const scenario = createScenario('first-load-source-ledger-cache-poison');
const clonedLifecycleRequestBoundary = Object.freeze({
  ...scenario.lifecycleRequestBoundary
});
const clonedHydrateRootPreflightRecord = Object.freeze({
  ...scenario.hydrateRecord,
  lifecycleRequestBoundary: clonedLifecycleRequestBoundary
});
const clonedEventReplayPreflightRecord = Object.freeze({
  ...scenario.eventReplayPreflightRecord,
  lifecycleRequestBoundary: clonedLifecycleRequestBoundary
});
const clonedExecutionPreflightRecord = Object.freeze({
  ...scenario.executionPreflightRecord,
  eventReplayPreflight: clonedEventReplayPreflightRecord,
  lifecycleRequestBoundary: clonedLifecycleRequestBoundary
});
const spoofedHydrateRootPayload = Object.freeze({
  ...rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
    scenario.hydrateRecord
  ),
  ledgerKind: 'hydrate-root-public-facade-preflight-record',
  record: clonedHydrateRootPreflightRecord
});

assert.equal(
  hydrationGate.registerPrivateHydrateRootSourceLedgerRecordForRootBridge,
  undefined
);
assert.equal(
  vm.runInNewContext(
    \`
(() => {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = () => rootBridgePath;
  try {
    const register =
      hydrationGate.registerPrivateHydrateRootSourceLedgerRecordForRootBridge;
    if (typeof register !== 'function') {
      return 'missing-registrar';
    }
    return register(
      clonedHydrateRootPreflightRecord,
      spoofedHydrateRootPayload,
      callerAuthorityToken
    ) === clonedHydrateRootPreflightRecord
      ? 'registered'
      : 'rejected';
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace;
  }
})()
    \`,
    {
      callerAuthorityToken: Object.freeze({source: 'caller-first-token'}),
      clonedHydrateRootPreflightRecord,
      hydrationGate,
      rootBridgePath,
      spoofedHydrateRootPayload
    },
    {filename: rootBridgePath}
  ),
  'missing-registrar'
);

sourceLedgerFakePayloads.set(
  scenario.hydrateRecord,
  rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
    scenario.hydrateRecord
  )
);
sourceLedgerFakePayloads.set(
  scenario.eventReplayPreflightRecord,
  rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
    scenario.eventReplayPreflightRecord
  )
);
sourceLedgerFakePayloads.set(
  scenario.executionPreflightRecord,
  rootBridge.getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(
    scenario.executionPreflightRecord
  )
);
sourceLedgerFakePayloads.set(
  scenario.lifecycleRequestBoundary,
  rootBridge.getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload(
    scenario.lifecycleRequestBoundary
  )
);
sourceLedgerFakePayloads.set(
  clonedHydrateRootPreflightRecord,
  Object.freeze({
    ...rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
      scenario.hydrateRecord
    ),
    lifecycleRequestBoundary: clonedLifecycleRequestBoundary
  })
);
sourceLedgerFakePayloads.set(
  clonedEventReplayPreflightRecord,
  Object.freeze({
    ...rootBridge
      .getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
        scenario.eventReplayPreflightRecord
      ),
    lifecycleRequestBoundary: clonedLifecycleRequestBoundary
  })
);
sourceLedgerFakePayloads.set(
  clonedExecutionPreflightRecord,
  Object.freeze({
    ...rootBridge
      .getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(
        scenario.executionPreflightRecord
      ),
    eventReplayPreflight: clonedEventReplayPreflightRecord,
    lifecycleRequestBoundary: clonedLifecycleRequestBoundary
  })
);
sourceLedgerFakePayloads.set(
  clonedLifecycleRequestBoundary,
  Object.freeze({
    ...rootBridge
      .getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload(
        scenario.lifecycleRequestBoundary
      )
  })
);
const postLoadFakeRootBridgeCacheExports = Object.freeze({
  getPrivateHydrateRootPublicFacadePreflightRecordPayload(record) {
    return sourceLedgerFakePayloads.get(record) || null;
  },
  getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(record) {
    return sourceLedgerFakePayloads.get(record) || null;
  },
  getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(record) {
    return sourceLedgerFakePayloads.get(record) || null;
  },
  getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload(record) {
    return sourceLedgerFakePayloads.get(record) || null;
  },
  isPrivateHydrateRootPublicFacadePreflightRecord(record) {
    return sourceLedgerFakePayloads.has(record);
  },
  isPrivateHydrateRootPublicFacadeEventReplayPreflightRecord(record) {
    return sourceLedgerFakePayloads.has(record);
  },
  isPrivateHydrateRootPublicFacadeExecutionPreflightRecord(record) {
    return sourceLedgerFakePayloads.has(record);
  },
  isPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryRecord(record) {
    return sourceLedgerFakePayloads.has(record);
  }
});
delete require.cache[rootBridgeCacheKey];
require.cache[rootBridgeCacheKey] = {
  id: rootBridgeCacheKey,
  filename: rootBridgeCacheKey,
  loaded: true,
  exports: postLoadFakeRootBridgeCacheExports
};
assert.equal(require(rootBridgePath), postLoadFakeRootBridgeCacheExports);

const forgedPreflightState = {
  bridge: Object.freeze({kind: 'forged-bridge'}),
  eventReplayPreflightRecords: [],
  executionPreflightRecords: [],
  lifecycleRequestBoundaryRecords: [],
  preflight: Object.freeze({kind: 'forged-preflight'}),
  records: []
};
const forgedRecoverableErrorPreflight =
  hydrationGate.createHydrationTextMismatchRecoverableErrorPreflightRecord(
    scenario.hydrationBoundaryRecord,
    scenario.hydrateRecord.acceptedPrivateMetadataDiagnostics,
    scenario.hydrationBoundaryRecord.recoverableErrorMetadata,
    {
      enableRecoverableErrorPreflight: true,
      hydrateRootSourceLedgerContext: Object.freeze({
        bridge: forgedPreflightState.bridge,
        lifecycleRequestBoundary: clonedLifecycleRequestBoundary,
        preflight: forgedPreflightState.preflight,
        preflightState: forgedPreflightState,
        requestAdmission: scenario.lifecycleRequestBoundary.requestAdmission,
        requestPayload: Object.freeze({
          container: scenario.container,
          hydrationOptions: scenario.hydrationOptions,
          initialChildren: scenario.initialChildren
        }),
        requestRecord: scenario.hydrateRecord
      }),
      hydrationOptions: scenario.hydrationOptions,
      preflightId: 'forged-caller-context-recoverable-error-preflight',
      source: 'forged-caller-context'
    }
  );
const forgedClonedLifecycleRequestBoundary = Object.freeze({
  ...scenario.lifecycleRequestBoundary
});
const forgedClonedHydrateRootPreflightRecord = Object.freeze({
  ...scenario.hydrateRecord,
  lifecycleRequestBoundary: forgedClonedLifecycleRequestBoundary,
  recoverableErrorPreflight: forgedRecoverableErrorPreflight
});
const forgedClonedEventReplayPreflightRecord = Object.freeze({
  ...scenario.eventReplayPreflightRecord,
  lifecycleRequestBoundary: forgedClonedLifecycleRequestBoundary
});
const forgedClonedExecutionPreflightRecord = Object.freeze({
  ...scenario.executionPreflightRecord,
  eventReplayPreflight: forgedClonedEventReplayPreflightRecord,
  lifecycleRequestBoundary: forgedClonedLifecycleRequestBoundary
});
forgedPreflightState.records.push(forgedClonedHydrateRootPreflightRecord);
forgedPreflightState.eventReplayPreflightRecords.push(
  forgedClonedEventReplayPreflightRecord
);
forgedPreflightState.executionPreflightRecords.push(
  forgedClonedExecutionPreflightRecord
);
forgedPreflightState.lifecycleRequestBoundaryRecords.push(
  forgedClonedLifecycleRequestBoundary
);
Object.freeze(forgedPreflightState.records);
Object.freeze(forgedPreflightState.eventReplayPreflightRecords);
Object.freeze(forgedPreflightState.executionPreflightRecords);
Object.freeze(forgedPreflightState.lifecycleRequestBoundaryRecords);
Object.freeze(forgedPreflightState);

assert.equal(
  hydrateRootSourceLedger.getPrivateHydrateRootSourceLedgerRecordPayload(
    scenario.hydrateRecord
  ),
  null
);
for (const clonedSourceLedgerRecord of [
  clonedHydrateRootPreflightRecord,
  clonedEventReplayPreflightRecord,
  clonedExecutionPreflightRecord,
  clonedLifecycleRequestBoundary
]) {
  assert.equal(
    hydrateRootSourceLedger.getPrivateHydrateRootSourceLedgerRecordPayload(
      clonedSourceLedgerRecord
    ),
    null
  );
}

assert.equal(
  createAdmission(scenario).status,
  hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionStatus
);
assert.throws(
  () =>
    hydrationGate.createHydrationRecoverableErrorBoundaryAdmissionRecord(
      scenario.hydrationBoundaryRecord,
      scenario.hydrateRecord.acceptedPrivateMetadataDiagnostics,
      forgedRecoverableErrorPreflight,
      scenario.targetClaimingDiagnostic,
      scenario.replayExecutionRecord,
      {
        enableRecoverableErrorBoundaryAdmission: true,
        eventReplayPreflightRecord: forgedClonedEventReplayPreflightRecord,
        executionPreflightRecord: forgedClonedExecutionPreflightRecord,
        hydrateRootPreflightRecord: forgedClonedHydrateRootPreflightRecord,
        hydrationOptions: scenario.hydrationOptions,
        lifecycleRequestBoundary: forgedClonedLifecycleRequestBoundary
      }
    ),
  {
    code:
      hydrationGate
        .INVALID_HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_CODE
  }
);
assert.throws(
  () =>
    createAdmission(scenario, {
      eventReplayPreflightRecord: clonedEventReplayPreflightRecord,
      executionPreflightRecord: clonedExecutionPreflightRecord,
      hydrateRootPreflightRecord: clonedHydrateRootPreflightRecord,
      lifecycleRequestBoundary: clonedLifecycleRequestBoundary
    }),
  {
    code:
      hydrationGate
        .INVALID_HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_CODE
  }
);

function createScenario(label) {
  const document = createDocument(label);
  const container = createElement('DIV', document);
  const boundaryTarget = createElement('BUTTON', document);
  boundaryTarget.parentNode = container;
  container.childNodes = [
    createComment('$'),
    boundaryTarget,
    createComment('/$'),
    createText('server text')
  ];
  const preflight =
    rootBridge.createPrivateHydrateRootPublicFacadePreflight({
      hydrateIdPrefix: label + '-hydrate',
      hydrationRecordIdPrefix: label + '-boundary',
      publicFacadeHydratePreflightIdPrefix: label + '-preflight',
      requestIdPrefix: label + '-request'
    });
  const hydrationOptions = {
    identifierPrefix: label + '-',
    onRecoverableError() {}
  };
  const initialChildren = {
    props: {
      children: 'client text'
    },
    type: 'App'
  };
  const hydrateRecord = preflight.hydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        'click',
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      {
        target: boundaryTarget,
        type: 'click'
      }
    );
  const targetClaimingPreflightRecord = preflight.preflightTargetClaiming(
    hydrateRecord,
    dispatchRecord,
    {
      source: label + '-target-claiming-preflight'
    }
  );
  const eventReplayPreflightRecord = preflight.preflightEventReplay(
    targetClaimingPreflightRecord,
    {
      source: label + '-event-replay-preflight'
    }
  );
  const executionPreflightRecord = preflight.preflightExecution(
    eventReplayPreflightRecord,
    {
      source: label + '-execution-preflight'
    }
  );

  return {
    eventReplayPreflightRecord,
    executionPreflightRecord,
    hydrateRecord,
    hydrationBoundaryRecord: hydrateRecord.hydrationBoundaryRecord,
    hydrationOptions,
    initialChildren,
    container,
    lifecycleRequestBoundary: hydrateRecord.lifecycleRequestBoundary,
    recoverableErrorPreflight: hydrateRecord.recoverableErrorPreflight,
    replayExecutionRecord: eventReplayPreflightRecord.replayExecutionRecord,
    targetClaimingDiagnostic:
      targetClaimingPreflightRecord.targetClaimingDiagnostic
  };
}

function createAdmission(scenario, options) {
  return hydrationGate.createHydrationRecoverableErrorBoundaryAdmissionRecord(
    scenario.hydrationBoundaryRecord,
    scenario.hydrateRecord.acceptedPrivateMetadataDiagnostics,
    scenario.recoverableErrorPreflight,
    scenario.targetClaimingDiagnostic,
    scenario.replayExecutionRecord,
    {
      enableRecoverableErrorBoundaryAdmission: true,
      eventReplayPreflightRecord: scenario.eventReplayPreflightRecord,
      executionPreflightRecord: scenario.executionPreflightRecord,
      hydrateRootPreflightRecord: scenario.hydrateRecord,
      hydrationOptions: scenario.hydrationOptions,
      lifecycleRequestBoundary: scenario.lifecycleRequestBoundary,
      ...(options || {})
    }
  );
}

function createComment(data) {
  return {
    data,
    nodeType: domContainer.COMMENT_NODE
  };
}

function createText(nodeValue) {
  return {
    nodeType: domContainer.TEXT_NODE,
    nodeValue
  };
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: '#document',
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.defaultView = createEventTarget({
    label: label + '-window'
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
`;

  childProcess.execFileSync(process.execPath, ['-e', script], {
    cwd: packageRoot,
    stdio: 'pipe'
  });
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

function expectedAcceptedPrivateMetadataIds() {
  return [
    'hydration-replay-ownership',
    hydrationGate
      .privateHydrationTextMismatchRecoverableErrorRoutingMetadataId,
    hydrationGate
      .privateHydrationRecoverableErrorBoundaryAdmissionMetadataId,
    'resource-map-commit',
    'stylesheet-load-error-state',
    'form-action-event-extraction',
    'form-reset-queue-commit'
  ];
}

function expectedAcceptedPrivateMetadataGateIds() {
  return [
    hydrationGate.privateHydrationReplayOwnershipGateId,
    hydrationGate
      .privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId,
    hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionGateId,
    resourceFormGate.privateResourceHintResourceMapCommitGateId,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateGateId,
    resourceFormGate.privateFormActionEventExtractionGateId,
    resourceFormGate.privateFormActionResetQueueCommitGateId
  ];
}

function assertAcceptedPrivateMetadataDiagnostics(diagnostics, expected) {
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    hydrationGate.HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostics.gateId,
    hydrationGate.privateHydrationBoundaryAcceptedMetadataGateId
  );
  assert.equal(
    diagnostics.status,
    hydrationGate.privateHydrationBoundaryAcceptedMetadataStatus
  );
  assert.equal(diagnostics.rootRecordId, expected.rootRecordId);
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(diagnostics.comparedToReactDomOracle, false);
  assert.equal(diagnostics.publicRootCompatibilitySurface, false);
  assert.equal(diagnostics.publicRootRenderCompatibilityClaimed, false);
  assert.equal(diagnostics.publicHydrationCompatibilityClaimed, false);
  assert.equal(
    diagnostics.publicHydrationReplayCompatibilityClaimed,
    false
  );
  assert.equal(diagnostics.publicEventCompatibilityClaimed, false);
  assert.equal(diagnostics.publicResourceCompatibilityClaimed, false);
  assert.equal(
    diagnostics.publicResourceDomInsertionCompatibilityClaimed,
    false
  );
  assert.equal(diagnostics.publicStylesheetCompatibilityClaimed, false);
  assert.equal(diagnostics.publicFormCompatibilityClaimed, false);
  assert.equal(diagnostics.publicFormActionCompatibilityClaimed, false);
  assert.equal(diagnostics.publicFormResetCompatibilityClaimed, false);
  assert.equal(diagnostics.publicControlledInputCompatibilityClaimed, false);
  assert.equal(diagnostics.hydrationReplaySupported, false);
  assert.equal(diagnostics.eventsReplayed, false);
  assert.equal(diagnostics.rootScheduled, false);
  assert.equal(diagnostics.resourceDomInsertion, false);
  assert.equal(diagnostics.resourceMapsCreated, false);
  assert.equal(diagnostics.resourceMapCommitted, false);
  assert.equal(diagnostics.stylesheetLoadListenersInstalled, false);
  assert.equal(diagnostics.stylesheetErrorListenersInstalled, false);
  assert.equal(diagnostics.stylesheetFetchStarted, false);
  assert.equal(diagnostics.stylesheetCommitSuspended, false);
  assert.equal(diagnostics.formActionEventPluginInvoked, false);
  assert.equal(diagnostics.formActionExtracted, false);
  assert.equal(diagnostics.formDataConstructed, false);
  assert.equal(diagnostics.actionInvoked, false);
  assert.equal(diagnostics.hostTransitionStarted, false);
  assert.equal(diagnostics.resetStateQueued, false);
  assert.equal(diagnostics.resetUpdateEnqueued, false);
  assert.equal(diagnostics.resetQueueCommitted, false);
  assert.equal(diagnostics.formResetCommitted, false);
  assert.equal(diagnostics.realFormReset, false);
  assert.equal(diagnostics.metadataIdCount, 7);
  assert.deepEqual(
    diagnostics.metadataIds,
    expectedAcceptedPrivateMetadataIds()
  );
  assert.deepEqual(
    diagnostics.gateIds,
    expectedAcceptedPrivateMetadataGateIds()
  );
  assert.deepEqual(diagnostics.acceptedRecordTypes, [
    hydrationGate.HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND,
    hydrationGate.HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND,
    hydrationGate.HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_RECORD_KIND,
    resourceFormGate.privateResourceHintResourceMapCommitRecordType,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateRecordType,
    resourceFormGate.privateFormActionEventExtractionRecordType,
    resourceFormGate.privateFormActionResetQueueCommitRecordType
  ]);
  assert.deepEqual(diagnostics.acceptedStatuses, [
    'blocked-replay-ownership-retained-through-drain-order',
    'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded',
    hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionStatus,
    resourceFormGate.privateResourceHintResourceMapCommitStatus,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateStatus,
    resourceFormGate.privateFormActionEventExtractionRecordedStatus,
    resourceFormGate.privateFormActionResetQueueCommitRecordedStatus
  ]);
  assert.deepEqual(
    diagnostics.metadataRows.map((row) => ({
      metadataId: row.metadataId,
      category: row.category,
      gateId: row.gateId,
      recordType: row.recordType,
      acceptedStatus: row.acceptedStatus,
      compatibilityClaimed: row.compatibilityClaimed,
      promotesHydration: row.promotesHydration,
      promotesRootRender: row.promotesRootRender
    })),
    [
      {
        metadataId: 'hydration-replay-ownership',
        category: 'hydration',
        gateId: hydrationGate.privateHydrationReplayOwnershipGateId,
        recordType:
          hydrationGate.HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND,
        acceptedStatus:
          'blocked-replay-ownership-retained-through-drain-order',
        compatibilityClaimed: false,
        promotesHydration: false,
        promotesRootRender: false
      },
      {
        metadataId:
          hydrationGate
            .privateHydrationTextMismatchRecoverableErrorRoutingMetadataId,
        category: 'hydration',
        gateId:
          hydrationGate
            .privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId,
        recordType:
          hydrationGate.HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND,
        acceptedStatus:
          'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded',
        compatibilityClaimed: false,
        promotesHydration: false,
        promotesRootRender: false
      },
      {
        metadataId:
          hydrationGate
            .privateHydrationRecoverableErrorBoundaryAdmissionMetadataId,
        category: 'hydration',
        gateId:
          hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionGateId,
        recordType:
          hydrationGate
            .HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_RECORD_KIND,
        acceptedStatus:
          hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionStatus,
        compatibilityClaimed: false,
        promotesHydration: false,
        promotesRootRender: false
      },
      {
        metadataId: 'resource-map-commit',
        category: 'resource',
        gateId: resourceFormGate.privateResourceHintResourceMapCommitGateId,
        recordType:
          resourceFormGate.privateResourceHintResourceMapCommitRecordType,
        acceptedStatus:
          resourceFormGate.privateResourceHintResourceMapCommitStatus,
        compatibilityClaimed: false,
        promotesHydration: false,
        promotesRootRender: false
      },
      {
        metadataId: 'stylesheet-load-error-state',
        category: 'stylesheet',
        gateId:
          resourceFormGate.privateResourceHintStylesheetLoadErrorStateGateId,
        recordType:
          resourceFormGate
            .privateResourceHintStylesheetLoadErrorStateRecordType,
        acceptedStatus:
          resourceFormGate.privateResourceHintStylesheetLoadErrorStateStatus,
        compatibilityClaimed: false,
        promotesHydration: false,
        promotesRootRender: false
      },
      {
        metadataId: 'form-action-event-extraction',
        category: 'form',
        gateId: resourceFormGate.privateFormActionEventExtractionGateId,
        recordType: resourceFormGate.privateFormActionEventExtractionRecordType,
        acceptedStatus:
          resourceFormGate.privateFormActionEventExtractionRecordedStatus,
        compatibilityClaimed: false,
        promotesHydration: false,
        promotesRootRender: false
      },
      {
        metadataId: 'form-reset-queue-commit',
        category: 'form',
        gateId: resourceFormGate.privateFormActionResetQueueCommitGateId,
        recordType:
          resourceFormGate.privateFormActionResetQueueCommitRecordType,
        acceptedStatus:
          resourceFormGate.privateFormActionResetQueueCommitRecordedStatus,
        compatibilityClaimed: false,
        promotesHydration: false,
        promotesRootRender: false
      }
    ]
  );
  assert.deepEqual(
    diagnostics.blockedCapabilities.map((capability) => [
      capability.id,
      capability.blocked
    ]),
    [
      ['public-hydration-replay', true],
      ['public-root-render', true],
      ['public-recoverable-error-routing', true],
      ['resource-dom-insertion', true],
      ['stylesheet-runtime-state', true],
      ['form-action-execution', true],
      ['form-reset-commit', true]
    ]
  );
  assert.deepEqual(diagnostics.hydrationOwnership, {
    metadataId: 'hydration-replay-ownership',
    gateId: hydrationGate.privateHydrationReplayOwnershipGateId,
    diagnosticKind:
      hydrationGate.HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND,
    diagnosticStatus: expected.ownershipStatus,
    diagnosticSource: 'unsupported-hydrate-root-boundary-record',
    ownershipRowCount: expected.ownershipRowCount,
    ownershipRetainedCount: 0,
    ownershipRetainedThroughDrainOrder: false,
    hydrationReplaySupported: false,
    eventsReplayed: false,
    compatibilityClaimed: false
  });
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
  assert.equal(blockers.drainOrderDiagnosticsAccepted, true);
  assert.equal(
    blockers.replayQueueDrainOrderDiagnostics.kind,
    pluginEventSystem.HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND
  );
  assert.equal(blockers.drainOrderCount, 0);
  assert.deepEqual(blockers.drainOrder, []);
  assert.equal(blockers.eventReplayOwnershipDiagnosticsAccepted, true);
  assert.equal(
    blockers.eventReplayOwnershipDiagnostics.kind,
    hydrationGate.HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND
  );
  assert.equal(blockers.replayOwnershipRowCount, 0);
  assert.equal(blockers.ownershipRetainedThroughDrainOrder, false);
  assert.equal(blockers.rootOwnershipRetainedCount, 0);
  assert.equal(blockers.dehydratedBoundaryOwnershipRetainedCount, 0);
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
  assert.equal(diagnostics.replayQueuesDrained, false);
  assert.equal(diagnostics.willDrainReplayQueues, false);
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
  assert.equal(diagnostics.drainOrderDiagnosticsAccepted, true);
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.kind,
    pluginEventSystem.HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.status,
    expected.blockedEventReplayTargetCount === 0
      ? 'blocked-no-replay-queue-drain-order-targets-recorded'
      : 'blocked-replay-queue-drain-order-recorded'
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.replayQueuesDrained,
    false
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.willDrainReplayQueues,
    false
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.eventsReplayed,
    false
  );
  assert.equal(
    diagnostics.drainOrderCount,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(
    diagnostics.drainOrder.length,
    expected.blockedEventReplayTargetCount
  );
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

function assertHydrationReplayOwnershipGateDiagnostics(
  diagnostics,
  expected
) {
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    hydrationGate.HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostics.gateId,
    hydrationGate.privateHydrationReplayOwnershipGateId
  );
  assert.equal(diagnostics.metadataId, 'hydration-replay-ownership');
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
  assert.equal(diagnostics.replayQueuesDrained, false);
  assert.equal(diagnostics.willDrainReplayQueues, false);
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
  assert.equal(diagnostics.rootRecordId, expected.rootRecordId);
  assert.equal(
    diagnostics.rootKind,
    hydrationGate.UNSUPPORTED_HYDRATION_ROOT_KIND
  );
  assert.equal(diagnostics.rootTag, hydrationGate.CONCURRENT_ROOT_TAG);
  assert.equal(diagnostics.eventReplayQueueDiagnosticsAccepted, true);
  assert.equal(diagnostics.targetResolutionDiagnosticsAccepted, true);
  assert.equal(diagnostics.drainOrderDiagnosticsAccepted, true);
  assert.equal(diagnostics.orderSource, 'dehydrated-target-root-metadata');
  assert.equal(
    diagnostics.blockedEventReplayTargetCount,
    expected.ownershipRowCount
  );
  assert.equal(diagnostics.drainOrderCount, expected.ownershipRowCount);
  assert.equal(diagnostics.ownershipRowCount, expected.ownershipRowCount);
  assert.equal(
    diagnostics.ownershipRetainedCount,
    expected.ownershipRetainedCount
  );
  assert.equal(
    diagnostics.ownershipRetainedThroughDrainOrder,
    expected.ownershipRetainedCount === expected.ownershipRowCount
  );
  assert.equal(
    diagnostics.rootOwnershipRetainedCount,
    expected.rootOwnershipRetainedCount
  );
  assert.equal(
    diagnostics.dehydratedBoundaryOwnershipRequiredCount,
    expected.dehydratedBoundaryOwnershipRequiredCount
  );
  assert.equal(
    diagnostics.dehydratedBoundaryOwnershipRetainedCount,
    expected.dehydratedBoundaryOwnershipRetainedCount
  );
  assert.equal(diagnostics.queuedEventReplayTargetCount, 0);
  assert.equal(diagnostics.replayedEventCount, 0);
  assert.equal(diagnostics.ownershipRows.length, expected.ownershipRowCount);
  for (const row of diagnostics.ownershipRows) {
    assert.equal(
      row.kind,
      hydrationGate.HYDRATION_REPLAY_OWNERSHIP_GATE_ENTRY_RECORD_KIND
    );
    assert.equal(
      row.gateId,
      hydrationGate.privateHydrationReplayOwnershipGateId
    );
    assert.equal(row.metadataId, 'hydration-replay-ownership');
    assert.equal(row.diagnosticOnly, true);
    assert.equal(row.readOnly, true);
    assert.equal(row.compatibilityClaimed, false);
    assert.equal(row.browserDomEventCompatibilityClaimed, false);
    assert.equal(row.publicRootBehaviorChanged, false);
    assert.equal(row.queued, false);
    assert.equal(row.replayQueueDrained, false);
    assert.equal(row.willDrainReplayQueues, false);
    assert.equal(row.willDispatch, false);
    assert.equal(row.willHydrate, false);
    assert.equal(row.willReplay, false);
  }
}

function assertHydrationDehydratedTargetResolutionDiagnostics(
  diagnostics,
  expected
) {
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    pluginEventSystem.HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND
  );
  assert.equal(diagnostics.status, expected.status);
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(diagnostics.browserDomEventCompatibilityClaimed, false);
  assert.equal(diagnostics.publicRootBehaviorChanged, false);
  assert.equal(diagnostics.eventTargetResolutionSupported, false);
  assert.equal(diagnostics.hydrationReplaySupported, false);
  assert.equal(diagnostics.eventReplaySupported, false);
  assert.equal(diagnostics.queueMutationAllowed, false);
  assert.equal(diagnostics.replayQueuesDrained, false);
  assert.equal(diagnostics.willDrainReplayQueues, false);
  assert.equal(diagnostics.eventsReplayed, false);
  assert.equal(diagnostics.willDispatchEvents, false);
  assert.equal(diagnostics.willHydrateHostInstances, false);
  assert.equal(
    diagnostics.blockedReason,
    pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.hydrationReplayBlockedReason,
    pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.eventDispatchBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(diagnostics.rootRecordId, expected.rootRecordId);
  assert.equal(diagnostics.rootKind, hydrationGate.UNSUPPORTED_HYDRATION_ROOT_KIND);
  assert.equal(diagnostics.rootTag, hydrationGate.CONCURRENT_ROOT_TAG);
  assert.equal(
    diagnostics.dehydratedRootOwner.kind,
    pluginEventSystem.HYDRATION_DEHYDRATED_ROOT_OWNER_RECORD_KIND
  );
  assert.equal(
    diagnostics.dehydratedRootOwner.status,
    'recorded-unsupported-dehydrated-root-owner'
  );
  assert.equal(diagnostics.dehydratedRootOwner.dehydrated, true);
  assert.equal(diagnostics.dehydratedRootOwner.unsupported, true);
  assert.equal(diagnostics.dehydratedRootOwner.canHydrate, false);
  assert.equal(diagnostics.dehydratedRootOwner.targetResolutionSupported, false);
  assert.equal(
    diagnostics.dehydratedRootOwnerStatus,
    'recorded-unsupported-dehydrated-root-owner'
  );
  assert.equal(
    diagnostics.markerReplayTargetCandidateCount,
    expected.boundaryOwnerCount
  );
  assert.equal(
    diagnostics.dehydratedBoundaryOwnerCount,
    expected.boundaryOwnerCount
  );
  assert.equal(
    diagnostics.dehydratedBoundaryOwners.length,
    expected.boundaryOwnerCount
  );
  for (const owner of diagnostics.dehydratedBoundaryOwners) {
    assert.equal(
      owner.kind,
      pluginEventSystem.HYDRATION_DEHYDRATED_BOUNDARY_OWNER_RECORD_KIND
    );
    assert.equal(
      owner.status,
      'recorded-marker-derived-dehydrated-boundary-owner'
    );
    assert.equal(owner.dehydrated, true);
    assert.equal(owner.rootOwned, true);
    assert.equal(owner.canHydrate, false);
    assert.equal(owner.queued, false);
    assert.equal(owner.queueEligible, false);
  }
  assert.equal(
    diagnostics.eventDispatchRecordCount,
    expected.lookupCount
  );
  assert.equal(
    diagnostics.hydratableEventTargetLookupCount,
    expected.lookupCount
  );
  assert.equal(
    diagnostics.hydratableEventTargetLookups.length,
    expected.lookupCount
  );
  assert.equal(diagnostics.queuedEventReplayTargetCount, 0);
  assert.equal(diagnostics.replayedEventCount, 0);
}

function assertHydrationTextMismatchDiagnostics(diagnostics, expected) {
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    hydrationGate.HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostics.status,
    expected.mismatchCount === 0
      ? 'blocked-no-hydration-text-mismatches-recorded'
      : 'blocked-hydration-text-mismatches-recorded'
  );
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(diagnostics.canHydrate, false);
  assert.equal(diagnostics.hydrateTextInstanceCalled, false);
  assert.equal(diagnostics.diffHydratedTextForDevWarningsCalled, false);
  assert.equal(diagnostics.recoverableErrorsQueued, false);
  assert.equal(diagnostics.onRecoverableErrorInvoked, false);
  assert.equal(diagnostics.publicRootCreated, false);
  assert.equal(diagnostics.domMutated, false);
  assert.equal(diagnostics.textPatched, false);
  assert.equal(diagnostics.boundaryCleared, false);
  assert.equal(
    diagnostics.blockedReason,
    hydrationGate.HYDRATION_TEXT_MISMATCH_BLOCKED_REASON
  );
  assert.equal(diagnostics.rootRecordId, expected.rootRecordId);
  assert.equal(
    diagnostics.source,
    'unsupported-hydrate-root-boundary-record'
  );
  assert.equal(diagnostics.expectedTextSource, 'initialChildren');
  assert.equal(
    diagnostics.actualTextSource,
    'container.childNodes text nodes depth-first'
  );
  assert.equal(diagnostics.markerDiagnosticsAccepted, true);
  assert.equal(diagnostics.expectedTextRowCount, expected.expectedTextRowCount);
  assert.equal(diagnostics.actualTextRowCount, expected.actualTextRowCount);
  assert.equal(diagnostics.mismatchCount, expected.mismatchCount);
  assert.equal(diagnostics.expectedTextRows.length, expected.expectedTextRowCount);
  assert.equal(diagnostics.actualTextRows.length, expected.actualTextRowCount);
  assert.equal(diagnostics.mismatchRows.length, expected.mismatchCount);
  assert.equal(
    diagnostics.recoverableErrorMetadata.kind,
    hydrationGate.HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND
  );
}

function assertHydrationTextMismatchRecoverableMetadata(metadata, expected) {
  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(
    metadata.kind,
    hydrationGate.HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND
  );
  assert.equal(
    metadata.status,
    'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded'
  );
  assert.equal(metadata.diagnosticOnly, true);
  assert.equal(metadata.readOnly, true);
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(
    metadata.blockedReason,
    hydrationGate.HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON
  );
  assert.equal(metadata.rootRecordId, expected.rootRecordId);
  assert.equal(
    metadata.source,
    'ReactFiberHydrationContext.throwOnHydrationMismatch/queueRecoverableErrors'
  );
  assert.equal(
    metadata.onRecoverableErrorOption.present,
    expected.callbackPresent
  );
  assert.equal(metadata.onRecoverableErrorOption.callbackInfo.type, 'function');
  assert.equal(metadata.onRecoverableErrorOption.callbackInvoked, false);
  assert.equal(metadata.onRecoverableErrorOption.publicCallbackInvoked, false);
  assert.equal(
    metadata.recoverableErrorMetadataCount,
    expected.recoverableErrorMetadataCount
  );
  assert.equal(metadata.queuedRecoverableErrorCount, 0);
  assert.equal(metadata.onRecoverableErrorInvocationCount, 0);
  assert.equal(
    metadata.wouldQueueRecoverableErrorCount,
    expected.recoverableErrorMetadataCount
  );
  assert.equal(
    metadata.recoverableErrorRows.length,
    expected.recoverableErrorMetadataCount
  );
  for (const row of metadata.recoverableErrorRows) {
    assert.equal(row.status, 'metadata-recorded-callback-not-invoked');
    assert.equal(row.errorName, 'Error');
    assert.equal(row.messageCategory, 'hydration-text-mismatch');
    assert.equal(row.errorInfo.componentStack, null);
    assert.equal(row.errorInfo.digest, null);
    assert.equal(row.queuedRecoverableError, false);
    assert.equal(row.onRecoverableErrorInvoked, false);
    assert.equal(row.publicCallbackInvoked, false);
    assert.equal(row.recoveredByClientRender, false);
    assert.equal(row.surfacedToUI, false);
  }
  assert.equal(metadata.recoverableErrorsQueued, false);
  assert.equal(metadata.onRecoverableErrorInvoked, false);
  assert.equal(metadata.publicRootCreated, false);
  assert.equal(metadata.hydratingPublicRoot, false);
  assert.equal(metadata.domMutated, false);
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
  assert.equal(diagnostics.replayQueuesDrained, false);
  assert.equal(diagnostics.willDrainReplayQueues, false);
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

function createHydrationRecoverableRoutingScenario({
  actualText,
  expectedText,
  hydrationOptions,
  label
}) {
  const document = createDocument(label);
  const container = createElement('DIV', document);
  const boundaryTarget = createElement('BUTTON', document);
  boundaryTarget.parentNode = container;
  container.childNodes = [
    createComment('$'),
    boundaryTarget,
    createComment('/$'),
    createText(actualText)
  ];

  const bridge = rootBridge.createPrivateRootBridgeShell({
    hydrateIdPrefix: `${label}-hydrate`,
    hydrationRecordIdPrefix: `${label}-boundary`,
    requestIdPrefix: `${label}-request`
  });
  const initialChildren = {
    props: {
      children: expectedText
    },
    type: 'App'
  };
  const hydrateRecord = bridge.createHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        'click',
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent('click', boundaryTarget)
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      hydrateRecord.hydrationBoundaryRecord,
      dispatchRecord,
      {
        source: `${label}-replay-ownership`
      }
    );
  const replayMetadata = bridge.createHydrationReplayErrorMetadata(
    hydrateRecord,
    ownershipDiagnostics,
    {
      replayTargetLabels: [`${label}-button`],
      source: `${label}-replay-error-metadata`
    }
  );

  return {
    bridge,
    container,
    dispatchRecord,
    document,
    hydrateRecord,
    hydrationOptions,
    initialChildren,
    ownershipDiagnostics,
    replayMetadata
  };
}

function createHydrationRecoverableBoundaryAdmissionScenario({
  actualText,
  expectedText,
  hydrationOptions,
  label
}) {
  const document = createDocument(label);
  const container = createElement('DIV', document);
  const boundaryTarget = createElement('BUTTON', document);
  boundaryTarget.parentNode = container;
  container.childNodes = [
    createComment('$'),
    boundaryTarget,
    createComment('/$'),
    createText(actualText)
  ];

  const preflight = rootBridge.createPrivateHydrateRootPublicFacadePreflight({
    hydrateIdPrefix: `${label}-hydrate`,
    hydrationRecordIdPrefix: `${label}-boundary`,
    publicFacadeHydratePreflightIdPrefix: `${label}-preflight`,
    requestIdPrefix: `${label}-request`
  });
  const initialChildren = {
    props: {
      children: expectedText
    },
    type: 'App'
  };
  const hydrateRecord = preflight.hydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const dispatchRecord = createHydrationClickDispatchRecord(
    container,
    boundaryTarget
  );
  const targetClaimingPreflightRecord = preflight.preflightTargetClaiming(
    hydrateRecord,
    dispatchRecord,
    {
      source: `${label}-target-claiming-preflight`
    }
  );
  const eventReplayPreflightRecord = preflight.preflightEventReplay(
    targetClaimingPreflightRecord,
    {
      source: `${label}-event-replay-preflight`
    }
  );
  const executionPreflightRecord = preflight.preflightExecution(
    eventReplayPreflightRecord,
    {
      source: `${label}-execution-preflight`
    }
  );

  return {
    boundaryTarget,
    container,
    dispatchRecord,
    document,
    eventReplayPreflightRecord,
    executionPreflightRecord,
    hydrateRecord,
    hydrationBoundaryRecord: hydrateRecord.hydrationBoundaryRecord,
    hydrationOptions,
    initialChildren,
    lifecycleRequestBoundary: hydrateRecord.lifecycleRequestBoundary,
    preflight,
    recoverableErrorPreflight: hydrateRecord.recoverableErrorPreflight,
    replayExecutionRecord: eventReplayPreflightRecord.replayExecutionRecord,
    targetClaimingDiagnostic:
      targetClaimingPreflightRecord.targetClaimingDiagnostic,
    targetClaimingPreflightRecord
  };
}

function createHydrationRecoverableBoundaryAdmission(
  scenario,
  overrides
) {
  const overrideValues =
    overrides && typeof overrides === 'object' ? overrides : {};
  const options = {
    enableRecoverableErrorBoundaryAdmission: true,
    eventReplayPreflightRecord: scenario.eventReplayPreflightRecord,
    executionPreflightRecord: scenario.executionPreflightRecord,
    hydrateRootPreflightRecord: scenario.hydrateRecord,
    hydrationOptions: scenario.hydrationOptions,
    lifecycleRequestBoundary: scenario.lifecycleRequestBoundary,
    ...(overrideValues.options || {})
  };

  return hydrationGate.createHydrationRecoverableErrorBoundaryAdmissionRecord(
    overrideValues.hydrationBoundaryRecord ||
      scenario.hydrationBoundaryRecord,
    overrideValues.acceptedBoundaryMetadataDiagnostics ||
      scenario.hydrateRecord.acceptedPrivateMetadataDiagnostics,
    overrideValues.recoverableErrorPreflightRecord ||
      scenario.recoverableErrorPreflight,
    overrideValues.targetClaimingDiagnostic ||
      scenario.targetClaimingDiagnostic,
    overrideValues.replayExecutionRecord || scenario.replayExecutionRecord,
    options
  );
}

function createHydrationClickDispatchRecord(container, target) {
  return pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      'click',
      eventSystemFlags.IS_CAPTURE_PHASE
    ),
    createNativeEvent('click', target)
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

function createText(nodeValue) {
  return {
    nodeType: domContainer.TEXT_NODE,
    nodeValue
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
