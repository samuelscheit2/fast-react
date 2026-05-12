'use strict';

const {
  assert,
  path,
  test,
  packageRoot,
  reactDomClient,
  rootBridge,
  hydrationGate,
  eventListener,
  eventSystemFlags,
  pluginEventSystem,
  DOCUMENT_NODE,
  ELEMENT_NODE,
  assertHydrateRootTamperedEventReplayMetadataRejected,
  assertHydrateRootTamperedAcceptedMetadataRejected,
  assertHydrateRootTamperedMarkerListenerGuardRejected,
  assertPrivateHydrateRootPublicFacadePreflightRecord,
  assertPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord,
  assertHydrateRootPreflightRowsBlocked,
  assertBridgeDidNotTouchContainer,
  createDocument,
  createElement,
  createCommentNode
} = require('./context.js');

test('private react-dom/client hydrateRoot facade preflight records only blocked diagnostics', () => {
  const document = createDocument('private-client-hydrate-facade-preflight');
  const container = createElement('DIV', document);
  const initialChildren = {
    props: {
      children: 'private hydrate preflight child'
    },
    type: 'span'
  };
  let recoverableErrorCalls = 0;
  const hydrationOptions = {
    identifierPrefix: 'private-hydrate-preflight-',
    onRecoverableError() {
      recoverableErrorCalls++;
    }
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.hydrateRoot,
    rootBridge.privateHydrateRootPublicFacadePreflightSymbol
  );

  assert.equal(
    Object.hasOwn(reactDomClient, 'hydrateRootPublicFacadePreflight'),
    false
  );
  assert.equal(
    Object.hasOwn(
      reactDomClient,
      '__FAST_REACT_PRIVATE_HYDRATE_ROOT_PUBLIC_FACADE_PREFLIGHT__'
    ),
    false
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(
      reactDomClient.createRoot,
      rootBridge.privateHydrateRootPublicFacadePreflightSymbol
    ),
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(
      reactDomClient.hydrateRoot,
      rootBridge.privateRootPublicFacadePreflightSymbol
    ),
    undefined
  );
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(
    descriptor.value,
    rootBridge.createPrivateHydrateRootPublicFacadePreflight
  );

  const preflight = descriptor.value({
    hydrateIdPrefix: 'hydrate-preflight-root',
    publicFacadeHydratePreflightIdPrefix: 'hydrate-facade-preflight',
    requestIdPrefix: 'hydrate-preflight-request'
  });
  assert.equal(
    preflight.$$typeof,
    rootBridge.privateHydrateRootPublicFacadePreflightType
  );
  assert.equal(
    preflight.kind,
    'FastReactDomPrivateHydrateRootPublicFacadePreflight'
  );
  assert.equal(preflight.entrypoint, 'react-dom/client');
  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_READY
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicHydrateRootEnabled, false);
  assert.equal(preflight.acceptedPrivateBridgeDiagnostics, true);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.reconcilerExecution, false);
  assert.equal(preflight.domMutation, false);
  assert.equal(preflight.markerWrites, false);
  assert.equal(preflight.listenerInstallation, false);
  assert.equal(preflight.hydration, false);
  assert.equal(preflight.eventDispatch, false);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(preflight.hydrateRoot.length, 3);
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadePreflight(preflight),
    true
  );
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadePreflight({}),
    false
  );
  assert.equal(Object.isFrozen(preflight), true);

  const hydratePreflight = preflight.hydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const payload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
      hydratePreflight
    );
  const hydratePayload = rootBridge.getPrivateRootRecordPayload(
    payload.requestRecord
  );
  const markerListenerPreflight = hydratePreflight.markerListenerPreflight;
  const markerListenerPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeMarkerListenerPreflightPayload(
      markerListenerPreflight
    );
  const recoverableErrorPreflight =
    hydratePreflight.recoverableErrorPreflight;
  const recoverableErrorPayload =
    rootBridge
      .getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload(
        recoverableErrorPreflight
      );

  assertPrivateHydrateRootPublicFacadePreflightRecord(hydratePreflight, {
    hydrateId: 'hydrate-preflight-root:1',
    preflightId: 'hydrate-facade-preflight:1',
    requestId: 'hydrate-preflight-request:1'
  });
  assert.equal(payload.requestAdmission, hydratePreflight.requestAdmission);
  assert.equal(payload.nativeHandoffRecord, null);
  assert.equal(payload.markerListenerPreflight, markerListenerPreflight);
  assert.equal(payload.recoverableErrorPreflight, recoverableErrorPreflight);
  assert.equal(payload.preflight, preflight);
  assertPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord(
    markerListenerPreflight,
    {
      hydrateId: 'hydrate-preflight-root:1',
      preflightId: 'hydrate-facade-preflight:1',
      requestId: 'hydrate-preflight-request:1'
    }
  );
  assert.equal(markerListenerPayload.bridge, payload.bridge);
  assert.equal(markerListenerPayload.container, container);
  assert.equal(markerListenerPayload.ownerDocument, document);
  assert.equal(markerListenerPayload.preflight, preflight);
  assert.equal(markerListenerPayload.requestRecord, payload.requestRecord);
  assert.equal(
    markerListenerPayload.preconditions,
    markerListenerPreflight.preconditions
  );
  assert.equal(hydratePayload.container, container);
  assert.equal(hydratePayload.initialChildren, initialChildren);
  assert.equal(hydratePayload.hydrationOptions, hydrationOptions);
  assert.equal(
    hydratePayload.hydrationBoundaryRecord,
    hydratePreflight.hydrationBoundaryRecord
  );
  assert.equal(
    payload.requestRecord.acceptedPrivateMetadataDiagnostics,
    hydratePreflight.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    payload.requestRecord.recoverableErrorMetadata,
    hydratePreflight.recoverableErrorMetadata
  );
  assert.equal(
    hydratePayload.hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics,
    hydratePreflight.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    recoverableErrorPreflight.recoverableErrorMetadata,
    hydratePreflight.recoverableErrorMetadata
  );
  assert.equal(
    recoverableErrorPreflight.acceptedBoundaryMetadataDiagnostics,
    hydratePreflight.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    recoverableErrorPreflight.acceptedBoundaryMetadataRow.metadataId,
    hydrationGate.privateHydrationTextMismatchRecoverableErrorRoutingMetadataId
  );
  assert.equal(
    recoverableErrorPreflight.preflightStatus,
    hydrationGate.privateHydrationTextMismatchRecoverableErrorPreflightStatus
  );
  assert.equal(
    recoverableErrorPreflight.kind,
    hydrationGate
      .HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_RECORD_KIND
  );
  assert.equal(
    rootBridge
      .isPrivateHydrationTextMismatchRecoverableErrorPreflightRecord(
        recoverableErrorPreflight
      ),
    true
  );
  assert.equal(
    recoverableErrorPayload.hydrationBoundaryRecord,
    hydratePreflight.hydrationBoundaryRecord
  );
  assert.equal(
    recoverableErrorPayload.hydrationOptions,
    hydrationOptions
  );
  assert.equal(
    recoverableErrorPayload.recoverableErrorMetadata,
    hydratePreflight.recoverableErrorMetadata
  );
  assert.equal(recoverableErrorPreflight.recoverableErrorMetadataAccepted, true);
  assert.equal(recoverableErrorPreflight.recoverableErrorMetadataCount, 1);
  assert.equal(recoverableErrorPreflight.queuedRecoverableErrorCount, 0);
  assert.equal(recoverableErrorPreflight.wouldQueueRecoverableErrorCount, 1);
  assert.equal(recoverableErrorPreflight.recoverableErrorsQueued, false);
  assert.equal(recoverableErrorPreflight.willQueueRecoverableErrors, false);
  assert.equal(recoverableErrorPreflight.onRecoverableErrorConfigured, true);
  assert.equal(recoverableErrorPreflight.onRecoverableErrorInvoked, false);
  assert.equal(
    recoverableErrorPreflight.privateOnRecoverableErrorInvoked,
    false
  );
  assert.equal(
    recoverableErrorPreflight.publicOnRecoverableErrorInvoked,
    false
  );
  assert.equal(recoverableErrorPreflight.rootErrorCallbackInvocationCount, 0);
  assert.equal(recoverableErrorPreflight.publicHydrateRootSupported, false);
  assert.equal(
    recoverableErrorPreflight.publicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(recoverableErrorPreflight.compatibilityClaimed, false);
  assert.equal(recoverableErrorCalls, 0);
  assert.throws(
    () =>
      hydrationGate
        .createHydrationTextMismatchRecoverableErrorPreflightRecord(
          hydratePreflight.hydrationBoundaryRecord,
          hydratePreflight.acceptedPrivateMetadataDiagnostics,
          Object.freeze({
            ...hydratePreflight.recoverableErrorMetadata
          }),
          {
            enableRecoverableErrorPreflight: true,
            hydrationOptions
          }
        ),
    {
      code:
        hydrationGate
          .INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_CODE,
      message: /must match/
    }
  );
  assert.throws(
    () =>
      hydrationGate
        .createHydrationTextMismatchRecoverableErrorPreflightRecord(
          hydratePreflight.hydrationBoundaryRecord,
          hydratePreflight.acceptedPrivateMetadataDiagnostics,
          Object.freeze({
            ...hydratePreflight.recoverableErrorMetadata,
            recoverableErrorRows: Object.freeze(
              hydratePreflight.recoverableErrorMetadata
                .recoverableErrorRows.map((row, index) =>
                  Object.freeze({
                    ...row,
                    publicCallbackInvoked: index === 0
                  })
                )
            )
          }),
          {
            enableRecoverableErrorPreflight: true,
            hydrationOptions
          }
        ),
    {
      code:
        hydrationGate
          .INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_CODE,
      message: /unqueued recoverable mismatch rows/
    }
  );
  assert.deepEqual(preflight.getHydrateRootPreflightRecords(), [
    hydratePreflight
  ]);
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .preflightRecordCount,
    1
  );
  assert.deepEqual(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .markerListenerPreflightRecords,
    [markerListenerPreflight]
  );
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .markerListenerPreflightRecordCount,
    1
  );
  assert.deepEqual(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .recoverableErrorPreflightRecords,
    [recoverableErrorPreflight]
  );
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .recoverableErrorPreflightRecordCount,
    1
  );
  assert.deepEqual(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .preflightRecords,
    [hydratePreflight]
  );
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload({}),
    null
  );
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload({}),
    null
  );
  assert.throws(
    () =>
      payload.bridge.createNativeRequestHandoff(payload.requestRecord),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST',
      message: /diagnostic-only/
    }
  );

  assert.throws(
    () =>
      reactDomClient.hydrateRoot(
        container,
        initialChildren,
        hydrationOptions
      ),
    {
      code: 'FAST_REACT_UNIMPLEMENTED'
    }
  );

  const serialized = JSON.stringify(hydratePreflight);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('__reactContainer$'), false);
  assert.equal(serialized.includes('__reactEvents$'), false);
  assert.equal(serialized.includes('_reactListening'), false);
  assertBridgeDidNotTouchContainer(container, document);
});

test('private react-dom/client hydrateRoot target-claiming preflight requires marker/listener gates and canonical evidence', () => {
  const document = createDocument('private-client-hydrate-target-claiming');
  const container = createElement('DIV', document);
  const target = createElement('BUTTON', document);
  const start = createCommentNode('$', document);
  const end = createCommentNode('/$', document);
  start.parentNode = container;
  target.parentNode = container;
  end.parentNode = container;
  container.childNodes = [start, target, end];
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.hydrateRoot,
    rootBridge.privateHydrateRootPublicFacadePreflightSymbol
  );
  const preflight = descriptor.value({
    hydrateIdPrefix: 'hydrate-target-claim-root',
    publicFacadeHydratePreflightIdPrefix: 'hydrate-target-claim-preflight',
    requestIdPrefix: 'hydrate-target-claim-request'
  });
  const hydratePreflight = preflight.hydrateRoot(
    container,
    {
      props: {
        children: 'target claim'
      },
      type: 'App'
    },
    {
      identifierPrefix: 'hydrate-target-claim-',
      onRecoverableError() {}
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
      {
        target,
        type: 'click'
      }
    );

  const targetClaimPreflight = preflight.preflightTargetClaiming(
    hydratePreflight,
    dispatchRecord,
    {
      source: 'hydrate-root-target-claim-preflight-test'
    }
  );
  const payload =
    rootBridge.getPrivateHydrateRootPublicFacadeTargetClaimingPreflightPayload(
      targetClaimPreflight
    );
  const hydratePayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
      hydratePreflight
    );
  const claimPayload =
    rootBridge.getPrivateHydrationTargetClaimingDiagnosticPayload(
      targetClaimPreflight.targetClaimingDiagnostic
    );

  assert.equal(Object.isFrozen(targetClaimPreflight), true);
  assert.equal(
    targetClaimPreflight.$$typeof,
    rootBridge.privateHydrateRootPublicFacadeTargetClaimingPreflightRecordType
  );
  assert.equal(
    targetClaimPreflight.kind,
    'FastReactDomPrivateHydrateRootPublicFacadeTargetClaimingPreflightRecord'
  );
  assert.equal(
    targetClaimPreflight.preflightStatus,
    rootBridge
      .ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_TARGET_CLAIMING_PREFLIGHTED
  );
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadeTargetClaimingPreflightRecord(
      targetClaimPreflight
    ),
    true
  );
  assert.equal(
    targetClaimPreflight.targetClaimingPreflightId,
    'hydrate-target-claim-preflight:1:target-claiming:1'
  );
  assert.equal(
    targetClaimPreflight.preconditions.markerListenerPreflightRequired,
    true
  );
  assert.equal(
    targetClaimPreflight.preconditions.currentStateMatchesMarkerListenerPreflight,
    true
  );
  assert.equal(
    targetClaimPreflight.preconditions.canonicalTargetClaimingEvidence,
    true
  );
  assert.equal(
    targetClaimPreflight.preconditions.targetClaimingDiagnosticImmutable,
    true
  );
  assert.equal(
    targetClaimPreflight.preconditions.targetDispatchLinkDiagnosticImmutable,
    true
  );
  assert.equal(targetClaimPreflight.preconditions.stateUnchanged, true);
  assert.equal(targetClaimPreflight.markerListenerStateUnchanged, true);
  assert.equal(targetClaimPreflight.targetDispatchLinkAccepted, true);
  assert.equal(targetClaimPreflight.targetClaimingPayloadAccepted, true);
  assert.equal(targetClaimPreflight.claimRecorded, true);
  assert.equal(targetClaimPreflight.claimedTargetMetadata, true);
  assert.equal(targetClaimPreflight.targetClaimExecuted, false);
  assert.equal(targetClaimPreflight.publicHydrationTargetClaimed, false);
  assert.equal(targetClaimPreflight.publicHydrateRootEnabled, false);
  assert.equal(targetClaimPreflight.publicHydrationCompatibilityClaimed, false);
  assert.equal(
    targetClaimPreflight.publicHydrationReplayCompatibilityClaimed,
    false
  );
  assert.equal(targetClaimPreflight.eventDispatch, false);
  assert.equal(targetClaimPreflight.eventReplayInstalled, false);
  assert.equal(targetClaimPreflight.replayQueuesDrained, false);
  assert.equal(targetClaimPreflight.compatibilityClaimed, false);
  assert.deepEqual(
    targetClaimPreflight.acceptedCapabilities.map((capability) => capability.id),
    [
      'hydrate-root-marker-listener-preflight-required',
      'hydrate-root-lifecycle-request-boundary-required',
      'hydrate-root-target-dispatch-link-diagnostic',
      'hydrate-root-target-claiming-canonical-evidence',
      'hydrate-root-target-claiming-state-unchanged'
    ]
  );
  assert.equal(targetClaimPreflight.targetPath, 'container.childNodes[1]');
  assert.equal(targetClaimPreflight.targetPathDeterministicallySelected, true);
  assert.equal(targetClaimPreflight.targetPathResolvedToDispatchTarget, true);
  assert.equal(targetClaimPreflight.targetContainerMatchesBoundaryRecord, true);
  assert.equal(targetClaimPreflight.hydratableLookupTargetPathRetained, true);
  assert.equal(targetClaimPreflight.markerPath, 'container.childNodes[0]');
  assert.equal(
    targetClaimPreflight.markerContractId,
    'suspense-completed-start'
  );
  assert.equal(
    targetClaimPreflight.markerListenerPreflight,
    hydratePreflight.markerListenerPreflight
  );
  assert.equal(payload.preflight, preflight);
  assert.equal(payload.requestRecord, hydratePayload.requestRecord);
  assert.equal(payload.dispatchRecord, dispatchRecord);
  assert.equal(payload.targetClaimingDiagnostic, targetClaimPreflight.targetClaimingDiagnostic);
  assert.equal(payload.targetClaimingPayload, claimPayload);
  assert.equal(claimPayload.hydrationBoundaryRecord, hydratePreflight.hydrationBoundaryRecord);
  assert.equal(claimPayload.targetDispatchLinkDiagnostic, targetClaimPreflight.targetDispatchLinkDiagnostic);
  assert.equal(claimPayload.ownershipDiagnostics, targetClaimPreflight.ownershipDiagnostics);
  assert.equal(Object.isFrozen(claimPayload.targetPathEvidence), true);
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .targetClaimingPreflightRecordCount,
    1
  );
  assert.deepEqual(preflight.getHydrateRootTargetClaimingPreflightRecords(), [
    targetClaimPreflight
  ]);
  assert.throws(
    () =>
      preflight.preflightTargetClaiming(
        hydratePayload.requestRecord,
        dispatchRecord
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT',
      message: /marker\/listener/
    }
  );
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
});

test('private react-dom/client hydrateRoot event replay preflight validates blocked dispatch metadata', () => {
  let recoverableErrorCalls = 0;
  const document = createDocument('private-client-hydrate-event-replay');
  const container = createElement('DIV', document);
  const target = createElement('BUTTON', document);
  const start = createCommentNode('$', document);
  const end = createCommentNode('/$', document);
  start.parentNode = container;
  target.parentNode = container;
  end.parentNode = container;
  container.childNodes = [start, target, end];
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.hydrateRoot,
    rootBridge.privateHydrateRootPublicFacadePreflightSymbol
  );
  const preflight = descriptor.value({
    hydrateIdPrefix: 'hydrate-event-replay-root',
    publicFacadeHydratePreflightIdPrefix: 'hydrate-event-replay-preflight',
    requestIdPrefix: 'hydrate-event-replay-request'
  });
  const hydratePreflight = preflight.hydrateRoot(
    container,
    {
      props: {
        children: 'event replay'
      },
      type: 'App'
    },
    {
      identifierPrefix: 'hydrate-event-replay-',
      onRecoverableError() {
        recoverableErrorCalls++;
      }
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
      {
        target,
        type: 'click'
      }
    );
  const targetClaimPreflight = preflight.preflightTargetClaiming(
    hydratePreflight,
    dispatchRecord,
    {
      source: 'hydrate-root-event-replay-target-claiming-test'
    }
  );
  const eventReplayPreflight = preflight.preflightEventReplay(
    targetClaimPreflight,
    {
      source: 'hydrate-root-event-replay-preflight-test'
    }
  );
  const payload =
    rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
      eventReplayPreflight
    );
  const preflightPayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight);
  const executionPayload =
    rootBridge.getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload(
      eventReplayPreflight.replayExecutionRecord
    );
  const replayBlockerCurrentness =
    eventReplayPreflight.replayBlockerCurrentness;
  const replayBlockerCurrentnessPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeReplayBlockerCurrentnessPayload(
      replayBlockerCurrentness
    );

  assert.equal(Object.isFrozen(eventReplayPreflight), true);
  assert.equal(
    eventReplayPreflight.$$typeof,
    rootBridge.privateHydrateRootPublicFacadeEventReplayPreflightRecordType
  );
  assert.equal(
    eventReplayPreflight.kind,
    'FastReactDomPrivateHydrateRootPublicFacadeEventReplayPreflightRecord'
  );
  assert.equal(
    eventReplayPreflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_EVENT_REPLAY_PREFLIGHTED
  );
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadeEventReplayPreflightRecord(
      eventReplayPreflight
    ),
    true
  );
  assert.equal(
    eventReplayPreflight.eventReplayPreflightId,
    'hydrate-event-replay-preflight:1:event-replay:1'
  );
  assert.equal(
    eventReplayPreflight.markerListenerPreflight,
    hydratePreflight.markerListenerPreflight
  );
  assert.equal(
    eventReplayPreflight.targetClaimingPreflight,
    targetClaimPreflight
  );
  assert.equal(
    eventReplayPreflight.preconditions.markerListenerPreflightRequired,
    true
  );
  assert.equal(
    eventReplayPreflight.preconditions.targetClaimingPreflightRequired,
    true
  );
  assert.equal(
    eventReplayPreflight.preconditions.canonicalReplayExecutionMetadata,
    true
  );
  assert.equal(
    eventReplayPreflight.preconditions.replayExecutionRecordImmutable,
    true
  );
  assert.equal(eventReplayPreflight.preconditions.blockedDispatchRecord, true);
  assert.equal(eventReplayPreflight.preconditions.stateUnchanged, true);
  assert.equal(
    eventReplayPreflight.preconditions.replayBlockerCurrentnessAccepted,
    true
  );
  assert.equal(
    eventReplayPreflight.preconditions.replayBlockerReportCurrent,
    true
  );
  assert.equal(eventReplayPreflight.targetDispatchLinkAccepted, true);
  assert.equal(eventReplayPreflight.targetClaimingPayloadAccepted, true);
  assert.equal(eventReplayPreflight.replayExecutionPayloadAccepted, true);
  assert.equal(eventReplayPreflight.replayBlockerCurrentnessAccepted, true);
  assert.equal(eventReplayPreflight.replayBlockerReportAccepted, true);
  assert.equal(eventReplayPreflight.replayBlockerReportCurrent, true);
  assert.equal(eventReplayPreflight.rootListenerReplayAliasRejected, true);
  assert.equal(Object.isFrozen(replayBlockerCurrentness), true);
  assert.equal(
    rootBridge
      .isPrivateHydrateRootPublicFacadeReplayBlockerCurrentnessRecord(
        replayBlockerCurrentness
      ),
    true
  );
  assert.equal(
    replayBlockerCurrentness.status,
    rootBridge
      .ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_REPLAY_BLOCKER_CURRENT
  );
  assert.equal(replayBlockerCurrentness.sourceOwned, true);
  assert.equal(replayBlockerCurrentness.replayBlockerReportAccepted, true);
  assert.equal(replayBlockerCurrentness.replayBlockerReportCurrent, true);
  assert.equal(replayBlockerCurrentness.rootListenerReplayAliasRejected, true);
  assert.equal(
    replayBlockerCurrentness.replayExecutionRecord,
    eventReplayPreflight.replayExecutionRecord
  );
  assert.equal(
    replayBlockerCurrentness.eventReplayBlockers,
    hydratePreflight.eventReplayBlockers
  );
  assert.notEqual(replayBlockerCurrentnessPayload, null);
  assert.equal(
    replayBlockerCurrentnessPayload.eventReplayPreflightRecord,
    eventReplayPreflight
  );
  assert.equal(
    replayBlockerCurrentnessPayload.replayBlockerCurrentness,
    replayBlockerCurrentness
  );
  assert.equal(
    eventReplayPreflight.replayExecutionRecord,
    payload.replayExecutionRecord
  );
  assert.notEqual(executionPayload, null);
  assert.equal(eventReplayPreflight.dispatchRecord, dispatchRecord);
  assert.equal(eventReplayPreflight.dispatchRecordStatus, 'blocked');
  assert.equal(
    eventReplayPreflight.dispatchRecordBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(
    eventReplayPreflight.targetDispatchPathRecord,
    dispatchRecord.targetDispatchPathRecord
  );
  assert.equal(eventReplayPreflight.targetDispatchPathStatus, 'no-mounted-host-instance');
  assert.equal(eventReplayPreflight.targetDispatchExecuted, false);
  assert.equal(eventReplayPreflight.eventReplayDispatchAttempted, false);
  assert.equal(
    eventReplayPreflight.pluginDispatchEventForPluginEventSystemCalled,
    false
  );
  assert.equal(eventReplayPreflight.nativeEventRedispatched, false);
  assert.equal(eventReplayPreflight.syntheticEventCreated, false);
  assert.equal(eventReplayPreflight.listenerInvocationCount, 0);
  assert.equal(eventReplayPreflight.willInvokeListeners, false);
  assert.equal(eventReplayPreflight.hydrateInstanceCalled, false);
  assert.equal(eventReplayPreflight.hydrateTextInstanceCalled, false);
  assert.equal(eventReplayPreflight.rootScheduled, false);
  assert.equal(eventReplayPreflight.suspenseHydrationScheduled, false);
  assert.equal(eventReplayPreflight.replayQueueDrained, false);
  assert.equal(eventReplayPreflight.replayQueuesDrained, false);
  assert.equal(eventReplayPreflight.queued, false);
  assert.equal(eventReplayPreflight.clickReplayDispatchDiagnosticRecorded, true);
  assert.equal(eventReplayPreflight.clickReplayDispatchDiagnosticBlocked, true);
  assert.equal(
    eventReplayPreflight.clickReplayDispatchQueueOrderPreserved,
    true
  );
  assert.equal(
    eventReplayPreflight.blockedClickReplayDispatchDiagnosticCount,
    1
  );
  assert.equal(
    eventReplayPreflight.clickReplayDispatchDiagnostic.publicDispatchEnabled,
    false
  );
  assert.equal(
    eventReplayPreflight.clickReplayDispatchDiagnostic.liveEventListenerInstalled,
    false
  );
  assert.equal(
    eventReplayPreflight.clickReplayDispatchDiagnostic.syntheticEventCreated,
    false
  );
  assert.equal(
    eventReplayPreflight.clickReplayDispatchDiagnostic.listenerInvocationCount,
    0
  );
  assert.equal(eventReplayPreflight.targetPath, 'container.childNodes[1]');
  assert.equal(
    eventReplayPreflight.targetPathDeterministicallySelected,
    true
  );
  assert.equal(
    eventReplayPreflight.targetPathResolvedToDispatchTarget,
    true
  );
  assert.equal(
    eventReplayPreflight.targetContainerMatchesBoundaryRecord,
    true
  );
  assert.equal(eventReplayPreflight.markerPath, 'container.childNodes[0]');
  assert.equal(
    eventReplayPreflight.markerContractId,
    'suspense-completed-start'
  );
  assert.equal(eventReplayPreflight.recoverableErrorsQueued, false);
  assert.equal(eventReplayPreflight.onRecoverableErrorConfigured, true);
  assert.equal(eventReplayPreflight.onRecoverableErrorInvoked, false);
  assert.equal(eventReplayPreflight.publicOnRecoverableErrorInvoked, false);
  assert.equal(recoverableErrorCalls, 0);
  assert.equal(eventReplayPreflight.publicHydrateRootEnabled, false);
  assert.equal(eventReplayPreflight.publicHydrationCompatibilityClaimed, false);
  assert.equal(
    eventReplayPreflight.publicHydrationReplayCompatibilityClaimed,
    false
  );
  assert.equal(eventReplayPreflight.publicHydrationTargetClaimed, false);
  assert.equal(eventReplayPreflight.eventDispatch, false);
  assert.equal(eventReplayPreflight.eventReplayInstalled, false);
  assert.equal(eventReplayPreflight.compatibilityClaimed, false);
  assert.deepEqual(
    eventReplayPreflight.acceptedCapabilities.map(
      (capability) => capability.id
    ),
    [
      'hydrate-root-marker-listener-preflight-required',
      'hydrate-root-lifecycle-request-boundary-required',
      'hydrate-root-target-claiming-preflight-required',
      'hydrate-root-replay-target-dispatch-execution-metadata',
      'hydrate-root-replay-blocker-currentness',
      'hydrate-root-event-replay-state-unchanged'
    ]
  );
  assert.equal(payload.preflight, preflight);
  assert.equal(payload.targetClaimingPreflight, targetClaimPreflight);
  assert.equal(
    payload.targetClaimingPayload,
    rootBridge.getPrivateHydrateRootPublicFacadeTargetClaimingPreflightPayload(
      targetClaimPreflight
    )
  );
  assert.equal(payload.replayExecutionPayload, executionPayload);
  assert.equal(executionPayload.dispatchRecord, dispatchRecord);
  assert.equal(
    executionPayload.targetClaimingDiagnostic,
    targetClaimPreflight.targetClaimingDiagnostic
  );
  assert.deepEqual(preflight.getHydrateRootEventReplayPreflightRecords(), [
    eventReplayPreflight
  ]);
  assert.deepEqual(preflightPayload.eventReplayPreflightRecords, [
    eventReplayPreflight
  ]);
  assert.equal(preflightPayload.eventReplayPreflightRecordCount, 1);
  assert.deepEqual(preflightPayload.replayBlockerCurrentnessRecords, [
    replayBlockerCurrentness
  ]);
  assert.equal(preflightPayload.replayBlockerCurrentnessRecordCount, 1);
  assert.equal(preflightPayload.targetClaimingPreflightRecordCount, 1);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  assert.throws(
    () => reactDomClient.hydrateRoot(container, 'public hydrate still blocked'),
    {
      code: 'FAST_REACT_UNIMPLEMENTED'
    }
  );
});

test('private react-dom/client hydrateRoot preflight matrix composes blocked rows only', () => {
  const recoverableErrorCalls = [];
  const document = createDocument('private-client-hydrate-preflight-matrix');
  const container = createElement('DIV', document);
  const target = createElement('BUTTON', document);
  const start = createCommentNode('$', document);
  const end = createCommentNode('/$', document);
  start.parentNode = container;
  target.parentNode = container;
  end.parentNode = container;
  container.childNodes = [start, target, end];
  const hydrationOptions = {
    identifierPrefix: 'hydrate-preflight-matrix-',
    onRecoverableError(error) {
      recoverableErrorCalls.push(error);
    }
  };
  const preflight =
    rootBridge.createPrivateHydrateRootPublicFacadePreflight({
      hydrateIdPrefix: 'hydrate-preflight-matrix-root',
      publicFacadeHydratePreflightIdPrefix:
        'hydrate-preflight-matrix',
      requestIdPrefix: 'hydrate-preflight-matrix-request'
    });
  const hydratePreflight = preflight.hydrateRoot(
    container,
    {
      props: {
        children: 'matrix child'
      },
      type: 'App'
    },
    hydrationOptions
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
      {
        target,
        type: 'click'
      }
    );
  const targetClaimPreflight = preflight.preflightTargetClaiming(
    hydratePreflight,
    dispatchRecord,
    {
      source: 'hydrate-root-preflight-matrix-target-claim'
    }
  );
  const eventReplayPreflight = preflight.preflightEventReplay(
    targetClaimPreflight,
    {
      source: 'hydrate-root-preflight-matrix-event-replay'
    }
  );

  const preflightPayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight);
  const hydratePayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
      hydratePreflight
    );
  const markerListenerPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeMarkerListenerPreflightPayload(
      hydratePreflight.markerListenerPreflight
    );
  const recoverableErrorPayload =
    rootBridge
      .getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload(
        hydratePreflight.recoverableErrorPreflight
      );
  const targetClaimPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeTargetClaimingPreflightPayload(
      targetClaimPreflight
    );
  const claimPayload =
    rootBridge.getPrivateHydrationTargetClaimingDiagnosticPayload(
      targetClaimPreflight.targetClaimingDiagnostic
    );
  const eventReplayPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
      eventReplayPreflight
    );
  const executionPayload =
    rootBridge.getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload(
      eventReplayPreflight.replayExecutionRecord
    );

  assert.deepEqual(preflightPayload.preflightRecords, [hydratePreflight]);
  assert.deepEqual(preflightPayload.markerListenerPreflightRecords, [
    hydratePreflight.markerListenerPreflight
  ]);
  assert.deepEqual(preflightPayload.recoverableErrorPreflightRecords, [
    hydratePreflight.recoverableErrorPreflight
  ]);
  assert.deepEqual(preflightPayload.targetClaimingPreflightRecords, [
    targetClaimPreflight
  ]);
  assert.deepEqual(preflightPayload.eventReplayPreflightRecords, [
    eventReplayPreflight
  ]);
  assert.equal(hydratePayload.preflight, preflight);
  assert.equal(hydratePayload.requestRecord.hydrationBoundaryRecord, hydratePreflight.hydrationBoundaryRecord);
  assert.equal(markerListenerPayload.preflight, preflight);
  assert.equal(markerListenerPayload.requestRecord, hydratePayload.requestRecord);
  assert.equal(markerListenerPayload.container, container);
  assert.equal(markerListenerPayload.ownerDocument, document);
  assert.equal(markerListenerPayload.preconditions.accepted, true);
  assert.equal(markerListenerPayload.preconditions.stateUnchanged, true);

  assert.equal(
    recoverableErrorPayload.hydrationBoundaryRecord,
    hydratePreflight.hydrationBoundaryRecord
  );
  assert.equal(recoverableErrorPayload.hydrationOptions, hydrationOptions);
  assert.equal(
    recoverableErrorPayload.recoverableErrorMetadata,
    hydratePreflight.recoverableErrorMetadata
  );
  assert.equal(
    recoverableErrorPayload.acceptedBoundaryMetadataDiagnostics,
    hydratePreflight.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    hydratePreflight.recoverableErrorPreflight.acceptedBoundaryMetadataRow
      .metadataId,
    hydrationGate.privateHydrationTextMismatchRecoverableErrorRoutingMetadataId
  );
  assert.equal(
    hydratePreflight.recoverableErrorPreflight.acceptedBoundaryMetadataRow
      .gateId,
    hydrationGate
      .privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId
  );

  assert.equal(targetClaimPayload.preflight, preflight);
  assert.equal(targetClaimPayload.requestRecord, hydratePayload.requestRecord);
  assert.equal(
    targetClaimPayload.markerListenerPreflight,
    hydratePreflight.markerListenerPreflight
  );
  assert.equal(targetClaimPayload.markerListenerPayload, markerListenerPayload);
  assert.equal(targetClaimPayload.dispatchRecord, dispatchRecord);
  assert.equal(targetClaimPayload.targetClaimingPayload, claimPayload);
  assert.equal(
    claimPayload.hydrationBoundaryRecord,
    hydratePreflight.hydrationBoundaryRecord
  );
  assert.equal(
    claimPayload.targetDispatchLinkDiagnostic,
    targetClaimPreflight.targetDispatchLinkDiagnostic
  );
  assert.equal(
    claimPayload.ownershipDiagnostics,
    targetClaimPreflight.ownershipDiagnostics
  );

  assert.equal(eventReplayPayload.preflight, preflight);
  assert.equal(
    eventReplayPayload.markerListenerPreflight,
    hydratePreflight.markerListenerPreflight
  );
  assert.equal(eventReplayPayload.targetClaimingPreflight, targetClaimPreflight);
  assert.equal(eventReplayPayload.targetClaimingPayload, targetClaimPayload);
  assert.equal(eventReplayPayload.replayExecutionPayload, executionPayload);
  assert.equal(executionPayload.dispatchRecord, dispatchRecord);
  assert.equal(
    executionPayload.hydrationBoundaryRecord,
    hydratePreflight.hydrationBoundaryRecord
  );
  assert.equal(
    executionPayload.targetClaimingDiagnostic,
    targetClaimPreflight.targetClaimingDiagnostic
  );
  assert.equal(executionPayload.targetClaimingDiagnosticPayload, claimPayload);
  assert.equal(
    executionPayload.targetDispatchLinkDiagnostic,
    targetClaimPreflight.targetDispatchLinkDiagnostic
  );
  assert.equal(
    executionPayload.targetDispatchLinkPayload,
    claimPayload.targetDispatchLinkPayload
  );
  assert.equal(
    executionPayload.recoverableErrorMetadata,
    hydratePreflight.recoverableErrorMetadata
  );

  assertHydrateRootPreflightRowsBlocked([
    hydratePreflight,
    hydratePreflight.markerListenerPreflight,
    hydratePreflight.recoverableErrorPreflight,
    targetClaimPreflight.targetDispatchLinkDiagnostic,
    targetClaimPreflight.ownershipDiagnostics,
    targetClaimPreflight.targetClaimingDiagnostic,
    targetClaimPreflight,
    eventReplayPreflight.replayExecutionRecord,
    eventReplayPreflight
  ]);
  assert.equal(eventReplayPreflight.replayQueueDrained, false);
  assert.equal(eventReplayPreflight.replayQueuesDrained, false);
  assert.equal(eventReplayPreflight.listenerInvocationCount, 0);
  assert.equal(recoverableErrorCalls.length, 0);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
});

test('private react-dom/client hydrateRoot event replay preflight rejects stale foreign or tampered replay evidence', () => {
  const document = createDocument(
    'private-client-hydrate-event-replay-negative'
  );
  const container = createElement('DIV', document);
  const target = createElement('BUTTON', document);
  const start = createCommentNode('$', document);
  const end = createCommentNode('/$', document);
  start.parentNode = container;
  target.parentNode = container;
  end.parentNode = container;
  container.childNodes = [start, target, end];
  const preflight =
    rootBridge.createPrivateHydrateRootPublicFacadePreflight({
      publicFacadeHydratePreflightIdPrefix:
        'hydrate-event-replay-negative'
    });
  const hydratePreflight = preflight.hydrateRoot(
    container,
    {
      props: {
        children: 'event replay negative'
      },
      type: 'App'
    },
    {
      identifierPrefix: 'hydrate-event-replay-negative-'
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
      {
        target,
        type: 'click'
      }
    );
  const targetClaimPreflight = preflight.preflightTargetClaiming(
    hydratePreflight,
    dispatchRecord
  );

  assert.throws(
    () => preflight.preflightEventReplay(hydratePreflight),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT',
      message: /target-claiming/
    }
  );
  assert.throws(
    () => preflight.preflightEventReplay(Object.freeze({...targetClaimPreflight})),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT',
      message: /target-claiming/
    }
  );

  const otherDocument = createDocument(
    'private-client-hydrate-event-replay-foreign'
  );
  const otherContainer = createElement('DIV', otherDocument);
  const otherTarget = createElement('BUTTON', otherDocument);
  const otherStart = createCommentNode('$', otherDocument);
  const otherEnd = createCommentNode('/$', otherDocument);
  otherStart.parentNode = otherContainer;
  otherTarget.parentNode = otherContainer;
  otherEnd.parentNode = otherContainer;
  otherContainer.childNodes = [otherStart, otherTarget, otherEnd];
  const otherPreflight =
    rootBridge.createPrivateHydrateRootPublicFacadePreflight({
      publicFacadeHydratePreflightIdPrefix:
        'hydrate-event-replay-foreign'
    });
  const otherHydratePreflight = otherPreflight.hydrateRoot(
    otherContainer,
    {
      props: {
        children: 'foreign event replay'
      },
      type: 'App'
    },
    {
      identifierPrefix: 'hydrate-event-replay-foreign-'
    }
  );
  const otherWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      otherContainer,
      'click',
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const otherDispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      otherWrapper,
      {
        target: otherTarget,
        type: 'click'
      }
    );
  const foreignTargetClaimPreflight = otherPreflight.preflightTargetClaiming(
    otherHydratePreflight,
    otherDispatchRecord
  );

  assert.throws(
    () => preflight.preflightEventReplay(foreignTargetClaimPreflight),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT',
      message: /target-claiming/
    }
  );

  const staleStateBridge = rootBridge.createPrivateRootBridgeShell({
    sideEffectIdPrefix: 'hydrate-event-replay-stale-state'
  });
  const staleStateCreateRecord =
    staleStateBridge.createClientRoot(container);
  const staleStateSideEffects =
    staleStateBridge.applyCreateRootSideEffects(staleStateCreateRecord);
  assert.throws(
    () => preflight.preflightEventReplay(targetClaimPreflight),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT',
      message: /lifecycle container snapshot|current marker\/listener state/
    }
  );
  staleStateBridge.revertCreateRootSideEffects(staleStateSideEffects);

  assertHydrateRootTamperedEventReplayMetadataRejected();
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.equal(otherDispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.deepEqual(otherContainer.__registrations, []);
  assert.deepEqual(otherDocument.__registrations, []);
});

test('private react-dom/client hydrateRoot target-claiming preflight rejects non-canonical claim evidence', () => {
  const rootBridgePath = path.join(
    packageRoot,
    'src/client/root-bridge.js'
  );
  const hydrationGatePath = path.join(
    packageRoot,
    'src/client/hydration-boundary-gate.js'
  );
  const rootBridgeCacheKey = require.resolve(rootBridgePath);
  const rootBridgeCacheEntry = require.cache[rootBridgeCacheKey];
  const hydrationGate = require(hydrationGatePath);
  const originalCreateHydrationBoundaryGate =
    hydrationGate.createHydrationBoundaryGate;

  hydrationGate.createHydrationBoundaryGate =
    function createNonCanonicalTargetClaimingGate(options) {
      const gate = originalCreateHydrationBoundaryGate(options);
      return Object.freeze({
        ...gate,
        createHydrationTargetClaimingDiagnostic(...args) {
          const claim = gate.createHydrationTargetClaimingDiagnostic(...args);
          return Object.freeze({...claim});
        }
      });
    };

  delete require.cache[rootBridgeCacheKey];
  try {
    const freshRootBridge = require(rootBridgePath);
    const document = createDocument(
      'private-client-hydrate-target-claiming-noncanonical'
    );
    const container = createElement('DIV', document);
    const target = createElement('BUTTON', document);
    const start = createCommentNode('$', document);
    const end = createCommentNode('/$', document);
    start.parentNode = container;
    target.parentNode = container;
    end.parentNode = container;
    container.childNodes = [start, target, end];
    const preflight =
      freshRootBridge.createPrivateHydrateRootPublicFacadePreflight({
        publicFacadeHydratePreflightIdPrefix:
          'hydrate-target-claim-noncanonical'
      });
    const hydratePreflight = preflight.hydrateRoot(
      container,
      {
        props: {
          children: 'target claim'
        },
        type: 'App'
      },
      {
        identifierPrefix: 'hydrate-target-claim-noncanonical-'
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
        {
          target,
          type: 'click'
        }
      );

    assert.throws(
      () => preflight.preflightTargetClaiming(hydratePreflight, dispatchRecord),
      {
        code:
          hydrationGate.INVALID_HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_CODE,
        message: /canonical immutable/
      }
    );
  } finally {
    hydrationGate.createHydrationBoundaryGate =
      originalCreateHydrationBoundaryGate;
    delete require.cache[rootBridgeCacheKey];
    if (rootBridgeCacheEntry !== undefined) {
      require.cache[rootBridgeCacheKey] = rootBridgeCacheEntry;
    }
  }
});

test('private react-dom/client hydrateRoot facade preflight records existing marker/listener preconditions without writes', () => {
  const document = createDocument(
    'private-client-hydrate-existing-marker-listener'
  );
  const container = createElement('DIV', document);
  const existingBridge = rootBridge.createPrivateRootBridgeShell({
    sideEffectIdPrefix: 'hydrate-existing-side-effect'
  });
  const existingCreate = existingBridge.createClientRoot(container);
  const sideEffects =
    existingBridge.applyCreateRootSideEffects(existingCreate);
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.hydrateRoot,
    rootBridge.privateHydrateRootPublicFacadePreflightSymbol
  );
  const beforeRegistrationCount = container.__registrations.length;
  const beforeDocumentRegistrationCount = document.__registrations.length;

  const preflight = descriptor.value({
    hydrateIdPrefix: 'hydrate-existing-root',
    publicFacadeHydratePreflightIdPrefix: 'hydrate-existing-preflight',
    requestIdPrefix: 'hydrate-existing-request'
  });
  const record = preflight.hydrateRoot(container, 'hydrated text', {});
  const markerListenerPreflight = record.markerListenerPreflight;

  assert.equal(markerListenerPreflight.markerWrites, false);
  assert.equal(markerListenerPreflight.listenerInstallation, false);
  assert.equal(markerListenerPreflight.preconditions.accepted, true);
  assert.equal(markerListenerPreflight.preconditions.stateUnchanged, true);
  assert.equal(
    markerListenerPreflight.preconditions.isContainerMarkedAsRoot,
    true
  );
  assert.equal(
    markerListenerPreflight.preconditions.rootMarkerPropertyCount,
    1
  );
  assert.equal(
    markerListenerPreflight.preconditions.rootMarkerTruthyCount,
    1
  );
  assert.equal(
    markerListenerPreflight.preconditions.rootListeningMarkerPresent,
    true
  );
  assert.equal(
    markerListenerPreflight.preconditions
      .ownerDocumentListeningMarkerPresent,
    true
  );
  assert.equal(
    markerListenerPreflight.preconditions.rootListenerRegistrationCount,
    138
  );
  assert.equal(
    markerListenerPreflight.preconditions
      .ownerDocumentListenerRegistrationCount,
    1
  );
  assert.equal(container.__registrations.length, beforeRegistrationCount);
  assert.equal(
    document.__registrations.length,
    beforeDocumentRegistrationCount
  );
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
  assert.equal(record.markerWrites, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.publicHydrateRootEnabled, false);
  assert.equal(record.compatibilityClaimed, false);

  existingBridge.revertCreateRootSideEffects(sideEffects);
  assertBridgeDidNotTouchContainer(container, document);
});

test('private react-dom/client hydrateRoot facade preflight rejects row-level public metadata claims', () => {
  assertHydrateRootTamperedAcceptedMetadataRejected({
    mutateRow(row, index) {
      return {
        ...row,
        publicCompatibilityClaimed: index === 0
      };
    }
  });
});

test('private react-dom/client hydrateRoot facade preflight rejects top-level granular public metadata claims', () => {
  assertHydrateRootTamperedAcceptedMetadataRejected({
    metadataOverrides: {
      publicResourceDomInsertionCompatibilityClaimed: true
    }
  });
});

test('private react-dom/client hydrateRoot facade preflight rejects tampered marker/listener guards', () => {
  assertHydrateRootTamperedMarkerListenerGuardRejected({
    markerGuardOverrides: {
      isContainerMarkedAsRoot: true
    },
    message: /marker guard/
  });
  assertHydrateRootTamperedMarkerListenerGuardRejected({
    markerGuardOverrides: {
      rootMarkerSnapshot: Object.freeze({
        inspectable: true,
        nullCount: 0,
        properties: Object.freeze([
          Object.freeze({
            enumerable: true,
            keyPrefix: '__reactContainer$',
            valueState: 'truthy',
            valueType: 'object'
          })
        ]),
        propertyCount: 0,
        truthyCount: 0
      })
    },
    message: /marker guard/
  });
  assertHydrateRootTamperedMarkerListenerGuardRejected({
    listenerGuardOverrides: {
      hasRootListeningMarker: true
    },
    message: /listener guard/
  });
  assertHydrateRootTamperedMarkerListenerGuardRejected({
    listenerGuardOverrides: {
      ownerDocumentInfo: Object.freeze({
        kind: 'object',
        nodeName: 'DIV',
        nodeType: ELEMENT_NODE
      }),
      rootEventTargetInfo: Object.freeze({
        kind: 'object',
        nodeName: '#document',
        nodeType: DOCUMENT_NODE
      })
    },
    message: /listener guard/
  });
});
