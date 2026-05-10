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
const eventSystemFlags = require(path.join(
  packageRoot,
  'src/events/event-system-flags.js'
));
const eventListener = require(path.join(
  packageRoot,
  'src/events/react-dom-event-listener.js'
));
const pluginEventSystem = require(path.join(
  packageRoot,
  'src/events/plugin-event-system.js'
));

test('private hydration replay target-dispatch link records one blocked replay candidate', () => {
  const fixture = createHydrationReplayTargetDispatchFixture(
    'target-dispatch-link'
  );
  const dispatchRecord = createDispatchRecord(
    fixture.container,
    'click',
    eventSystemFlags.IS_CAPTURE_PHASE,
    fixture.boundaryTarget
  );
  const diagnostic =
    hydrationGate.createHydrationReplayTargetDispatchLinkDiagnostic(
      fixture.record,
      dispatchRecord,
      {
        source: 'hydration-private-target-dispatch-link'
      }
    );

  assert.equal(
    diagnostic.kind,
    pluginEventSystem.HYDRATION_REPLAY_TARGET_DISPATCH_LINK_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostic.status,
    pluginEventSystem.PRIVATE_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_STATUS
  );
  assert.equal(diagnostic.diagnosticOnly, true);
  assert.equal(diagnostic.readOnly, true);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(diagnostic.browserDomEventCompatibilityClaimed, false);
  assert.equal(diagnostic.publicRootBehaviorChanged, false);
  assert.equal(diagnostic.eventReplaySupported, false);
  assert.equal(diagnostic.hydrationReplaySupported, false);
  assert.equal(diagnostic.queueMutationAllowed, false);
  assert.equal(diagnostic.replayQueuesDrained, false);
  assert.equal(diagnostic.willDrainReplayQueues, false);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.publicDispatchEnabled, false);
  assert.equal(diagnostic.willDispatch, false);
  assert.equal(diagnostic.willHydrate, false);
  assert.equal(diagnostic.willReplay, false);
  assert.equal(diagnostic.queued, false);
  assert.equal(diagnostic.replayQueueDrained, false);
  assert.equal(
    diagnostic.blockedReason,
    pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE
  );
  assert.equal(
    diagnostic.eventDispatchBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(
    diagnostic.eventTargetResolutionBlockedReason,
    pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  );
  assert.equal(
    diagnostic.publicDispatchBlockedReason,
    pluginEventSystem.PUBLIC_EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(diagnostic.eventReplayQueueDiagnosticsAccepted, true);
  assert.equal(diagnostic.targetResolutionDiagnosticsAccepted, true);
  assert.equal(diagnostic.inputOrder, 0);
  assert.equal(diagnostic.domEventName, 'click');
  assert.equal(diagnostic.queueName, 'discrete-hydration-replay-attempt');
  assert.equal(diagnostic.hydratableEventTargetLookupStatus, 'blocked-on-dehydrated-boundary');
  assert.equal(diagnostic.rootOwnershipStatus, 'owned-by-dehydrated-root');
  assert.equal(
    diagnostic.dehydratedBoundaryOwnerId,
    'hydration-link:1:boundary:0'
  );
  assert.equal(
    diagnostic.dehydratedBoundaryOwner.contractId,
    'suspense-completed-start'
  );
  assert.equal(diagnostic.ownerBoundaryKind, 'suspense-boundary');
  assert.equal(diagnostic.ownerBoundaryStatus, 'blocked-on-dehydrated-boundary');
  assert.equal(diagnostic.targetPath, 'container.childNodes[1]');
  assert.equal(diagnostic.targetPathStatus, 'found-in-container-child-list');
  assert.equal(diagnostic.targetDispatchPathRecord, dispatchRecord.targetDispatchPathRecord);
  assert.equal(diagnostic.targetDispatchPathStatus, 'no-mounted-host-instance');
  assert.equal(diagnostic.targetDispatchPathLength, 0);
  assert.equal(diagnostic.eventPathStatus, 'no-mounted-host-instance');
  assert.equal(diagnostic.eventPathEntryCount, 0);
  assert.deepEqual(diagnostic.eventPathEntries, []);
  assert.deepEqual(
    {
      blockedReason: diagnostic.dispatchBlockerMetadata.blockedReason,
      dispatchQueueLength: diagnostic.dispatchBlockerMetadata.dispatchQueueLength,
      eventDispatch: diagnostic.dispatchBlockerMetadata.eventDispatch,
      hydrationReplayQueued:
        diagnostic.dispatchBlockerMetadata.hydrationReplayQueued,
      publicDispatchEnabled:
        diagnostic.dispatchBlockerMetadata.publicDispatchEnabled,
      targetDispatchPathStatus:
        diagnostic.dispatchBlockerMetadata.targetDispatchPathStatus,
      targetResolutionStatus:
        diagnostic.dispatchBlockerMetadata.targetResolutionStatus,
      willInvokeListeners:
        diagnostic.dispatchBlockerMetadata.willInvokeListeners
    },
    {
      blockedReason: pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE,
      dispatchQueueLength: 0,
      eventDispatch: false,
      hydrationReplayQueued: false,
      publicDispatchEnabled: false,
      targetDispatchPathStatus: 'no-mounted-host-instance',
      targetResolutionStatus: 'blocked',
      willInvokeListeners: false
    }
  );

  const payload =
    pluginEventSystem.getHydrationReplayTargetDispatchLinkDiagnosticPayload(
      diagnostic
    );
  assert.equal(payload.dispatchRecord, dispatchRecord);
  assert.equal(payload.eventReplayQueueDiagnostics, diagnostic.eventReplayQueueDiagnostics);
  assert.equal(payload.replayQueueEntry, diagnostic.replayQueueEntry);
  assert.equal(payload.hydratableEventTargetLookup, diagnostic.hydratableEventTargetLookup);
  assert.equal(payload.targetDispatchPathRecord, dispatchRecord.targetDispatchPathRecord);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(fixture.container.__registrations, []);
  assert.deepEqual(fixture.document.__registrations, []);
});

test('private hydration target claiming records one inert dehydrated boundary target', () => {
  const fixture = createHydrationReplayTargetDispatchFixture(
    'target-claiming'
  );
  const dispatchRecord = createDispatchRecord(
    fixture.container,
    'click',
    eventSystemFlags.IS_CAPTURE_PHASE,
    fixture.boundaryTarget
  );
  const targetDispatchLink =
    hydrationGate.createHydrationReplayTargetDispatchLinkDiagnostic(
      fixture.record,
      dispatchRecord,
      {
        source: 'hydration-private-target-claiming-link'
      }
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      fixture.record,
      dispatchRecord,
      {
        source: 'hydration-private-target-claiming-ownership'
      }
    );
  const claim = hydrationGate.createHydrationTargetClaimingDiagnostic(
    fixture.record,
    ownershipDiagnostics,
    targetDispatchLink,
    {
      source: 'hydration-private-target-claiming'
    }
  );

  assert.equal(
    claim.kind,
    hydrationGate.HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_KIND
  );
  assert.equal(claim.gateId, hydrationGate.privateHydrationTargetClaimingGateId);
  assert.equal(claim.metadataId, 'hydration-target-claiming');
  assert.equal(
    claim.status,
    hydrationGate.privateHydrationTargetClaimingMetadataStatus
  );
  assert.equal(Object.isFrozen(claim), true);
  assert.equal(claim.diagnosticOnly, true);
  assert.equal(claim.readOnly, true);
  assert.equal(claim.compatibilityClaimed, false);
  assert.equal(claim.publicHydrationCompatibilityClaimed, false);
  assert.equal(claim.publicHydrationReplayCompatibilityClaimed, false);
  assert.equal(claim.hydrationReplaySupported, false);
  assert.equal(claim.eventReplaySupported, false);
  assert.equal(claim.queueMutationAllowed, false);
  assert.equal(claim.replayQueuesDrained, false);
  assert.equal(claim.willDrainReplayQueues, false);
  assert.equal(claim.eventsReplayed, false);
  assert.equal(claim.willDispatch, false);
  assert.equal(claim.willHydrate, false);
  assert.equal(claim.willReplay, false);
  assert.equal(claim.claimRecorded, true);
  assert.equal(claim.claimedTargetMetadata, true);
  assert.equal(claim.targetClaimExecuted, false);
  assert.equal(claim.publicHydrationTargetClaimed, false);
  assert.equal(claim.hydrateInstanceCalled, false);
  assert.equal(claim.markerParserEvidenceAccepted, true);
  assert.equal(claim.rootRecordId, 'hydration-link:1');
  assert.equal(claim.markerId, 'suspense-completed-start@container.childNodes[0]');
  assert.equal(claim.markerPath, 'container.childNodes[0]');
  assert.equal(claim.markerContractId, 'suspense-completed-start');
  assert.equal(claim.markerReplayTargetCandidate.path, claim.markerPath);
  assert.equal(claim.targetDispatchLinkDiagnostic, targetDispatchLink);
  assert.equal(claim.inputOrder, 0);
  assert.equal(claim.domEventName, 'click');
  assert.equal(claim.queueName, 'discrete-hydration-replay-attempt');
  assert.equal(claim.ownershipDiagnostics, ownershipDiagnostics);
  assert.equal(claim.ownershipRowStatus, 'retained-root-and-boundary-ownership-through-drain-order');
  assert.equal(claim.ownershipRetainedThroughDrainOrder, true);
  assert.equal(claim.rootOwnershipStatus, 'owned-by-dehydrated-root');
  assert.equal(claim.dehydratedBoundaryOwnerId, 'hydration-link:1:boundary:0');
  assert.equal(claim.dehydratedBoundaryOwnerPath, 'container.childNodes[0]');
  assert.equal(claim.ownerBoundaryKind, 'suspense-boundary');
  assert.equal(claim.targetPath, 'container.childNodes[1]');
  assert.equal(claim.targetPathStatus, 'found-in-container-child-list');
  assert.equal(claim.targetPathParentPath, 'container');
  assert.equal(claim.targetPathIndex, 1);
  assert.equal(claim.targetPathSegmentCount, 1);
  assert.equal(claim.targetDispatchPathStatus, 'no-mounted-host-instance');
  assert.equal(claim.targetDispatchPathLength, 0);

  const payload =
    hydrationGate.getPrivateHydrationTargetClaimingDiagnosticPayload(claim);
  assert.equal(payload.hydrationBoundaryRecord, fixture.record);
  assert.equal(payload.markerRow, fixture.record.markerDiagnostics.markers[0]);
  assert.equal(payload.ownershipDiagnostics, ownershipDiagnostics);
  assert.equal(payload.ownershipRow, claim.ownershipRow);
  assert.equal(payload.targetDispatchLinkDiagnostic, targetDispatchLink);
  assert.equal(
    rootBridge.getPrivateHydrationTargetClaimingDiagnosticPayload(claim),
    payload
  );
  assert.equal(rootBridge.isPrivateHydrationTargetClaimingDiagnostic(claim), true);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(fixture.container.__registrations, []);
  assert.deepEqual(fixture.document.__registrations, []);
});

test('private hydration replay target-dispatch link rejects stale queue entries and missing ownership', () => {
  const fixture = createHydrationReplayTargetDispatchFixture(
    'target-dispatch-link-stale'
  );
  const dispatchRecord = createDispatchRecord(
    fixture.container,
    'click',
    eventSystemFlags.IS_CAPTURE_PHASE,
    fixture.boundaryTarget
  );
  const firstQueue =
    pluginEventSystem.createHydrationReplayEventQueueDiagnostic(
      dispatchRecord,
      {
        dehydratedTargetResolution: fixture.record.targetResolutionDiagnostics,
        source: 'hydration-private-target-dispatch-link-first'
      }
    );
  const secondQueue =
    pluginEventSystem.createHydrationReplayEventQueueDiagnostic(
      dispatchRecord,
      {
        dehydratedTargetResolution: fixture.record.targetResolutionDiagnostics,
        source: 'hydration-private-target-dispatch-link-second'
      }
    );

  assert.throws(
    () =>
      pluginEventSystem.createHydrationReplayTargetDispatchLinkDiagnostic(
        secondQueue,
        dispatchRecord,
        {
          replayQueueEntry: firstQueue.blockedEventReplayTargets[0],
          source: 'hydration-private-target-dispatch-link-stale-entry'
        }
      ),
    {
      code:
        pluginEventSystem.INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    }
  );

  const rootOnlyFixture = createHydrationReplayTargetDispatchFixture(
    'target-dispatch-link-root-only',
    {
      targetInsideBoundary: false
    }
  );
  const rootOnlyDispatchRecord = createDispatchRecord(
    rootOnlyFixture.container,
    'click',
    eventSystemFlags.IS_CAPTURE_PHASE,
    rootOnlyFixture.boundaryTarget
  );

  assert.throws(
    () =>
      hydrationGate.createHydrationReplayTargetDispatchLinkDiagnostic(
        rootOnlyFixture.record,
        rootOnlyDispatchRecord,
        {
          source: 'hydration-private-target-dispatch-link-missing-owner'
        }
      ),
    {
      code:
        pluginEventSystem.INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    }
  );
});

test('private hydration replay target-dispatch link rejects foreign dispatch path records', () => {
  const fixture = createHydrationReplayTargetDispatchFixture(
    'target-dispatch-link-foreign-path'
  );
  const dispatchRecord = createDispatchRecord(
    fixture.container,
    'click',
    eventSystemFlags.IS_CAPTURE_PHASE,
    fixture.boundaryTarget
  );
  const otherDocument = createDocument('foreign-path');
  const otherContainer = createElement('SECTION', otherDocument);
  const otherTarget = createElement('BUTTON', otherDocument);
  otherTarget.parentNode = otherContainer;
  otherContainer.childNodes = [otherTarget];
  const foreignDispatchRecord = createDispatchRecord(
    otherContainer,
    'click',
    eventSystemFlags.IS_CAPTURE_PHASE,
    otherTarget
  );

  assert.throws(
    () =>
      hydrationGate.createHydrationReplayTargetDispatchLinkDiagnostic(
        fixture.record,
        dispatchRecord,
        {
          source: 'hydration-private-target-dispatch-link-foreign-path',
          targetDispatchPathRecord: foreignDispatchRecord.targetDispatchPathRecord
        }
      ),
    {
      code:
        pluginEventSystem.INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    }
  );
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(fixture.container.__registrations, []);
  assert.deepEqual(fixture.document.__registrations, []);
});

test('private hydration target claiming rejects stale markers missing ownership and unsupported paths', () => {
  const fixture = createHydrationReplayTargetDispatchFixture(
    'target-claiming-negative'
  );
  const dispatchRecord = createDispatchRecord(
    fixture.container,
    'click',
    eventSystemFlags.IS_CAPTURE_PHASE,
    fixture.boundaryTarget
  );
  const targetDispatchLink =
    hydrationGate.createHydrationReplayTargetDispatchLinkDiagnostic(
      fixture.record,
      dispatchRecord,
      {
        source: 'hydration-private-target-claiming-negative-link'
      }
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      fixture.record,
      dispatchRecord,
      {
        source: 'hydration-private-target-claiming-negative-ownership'
      }
    );
  const staleMarkerFixture = createHydrationReplayTargetDispatchFixture(
    'target-claiming-stale-marker'
  );

  assert.throws(
    () =>
      hydrationGate.createHydrationTargetClaimingDiagnostic(
        fixture.record,
        ownershipDiagnostics,
        targetDispatchLink,
        {
          markerRow: staleMarkerFixture.record.markerDiagnostics.markers[0],
          source: 'hydration-private-target-claiming-stale-marker'
        }
      ),
    {
      code:
        hydrationGate.INVALID_HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_CODE
    }
  );

  assert.throws(
    () =>
      hydrationGate.createHydrationTargetClaimingDiagnostic(
        fixture.record,
        fixture.record.eventReplayOwnershipDiagnostics,
        targetDispatchLink,
        {
          source: 'hydration-private-target-claiming-missing-ownership'
        }
      ),
    {
      code:
        hydrationGate.INVALID_HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_CODE
    }
  );

  const nestedFixture = createHydrationReplayTargetDispatchFixture(
    'target-claiming-nested-path',
    {
      nestedTarget: true
    }
  );
  const nestedDispatchRecord = createDispatchRecord(
    nestedFixture.container,
    'click',
    eventSystemFlags.IS_CAPTURE_PHASE,
    nestedFixture.boundaryTarget
  );
  const nestedTargetDispatchLink =
    hydrationGate.createHydrationReplayTargetDispatchLinkDiagnostic(
      nestedFixture.record,
      nestedDispatchRecord,
      {
        source: 'hydration-private-target-claiming-nested-link'
      }
    );
  const nestedOwnershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      nestedFixture.record,
      nestedDispatchRecord,
      {
        source: 'hydration-private-target-claiming-nested-ownership'
      }
    );

  assert.equal(
    nestedTargetDispatchLink.targetPath,
    'container.childNodes[1].childNodes[0]'
  );
  assert.throws(
    () =>
      hydrationGate.createHydrationTargetClaimingDiagnostic(
        nestedFixture.record,
        nestedOwnershipDiagnostics,
        nestedTargetDispatchLink,
        {
          source: 'hydration-private-target-claiming-unsupported-path'
        }
      ),
    {
      code:
        hydrationGate.INVALID_HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_CODE
    }
  );
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.equal(nestedDispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(fixture.container.__registrations, []);
  assert.deepEqual(fixture.document.__registrations, []);
  assert.deepEqual(nestedFixture.container.__registrations, []);
  assert.deepEqual(nestedFixture.document.__registrations, []);
});

function createHydrationReplayTargetDispatchFixture(label, options) {
  const normalizedOptions = options || {};
  const document = createDocument(label);
  const container = createElement('DIV', document);
  const boundaryTarget = createElement('BUTTON', document);
  if (normalizedOptions.nestedTarget === true) {
    const wrapper = createElement('SPAN', document);
    boundaryTarget.parentNode = wrapper;
    wrapper.parentNode = container;
    wrapper.childNodes = [boundaryTarget];
    container.childNodes = [createComment('$'), wrapper, createComment('/$')];
  } else {
    boundaryTarget.parentNode = container;
    container.childNodes =
      normalizedOptions.targetInsideBoundary === false
        ? [createComment('$'), createComment('/$'), boundaryTarget]
        : [createComment('$'), boundaryTarget, createComment('/$')];
  }

  const gate = hydrationGate.createHydrationBoundaryGate({
    recordIdPrefix: 'hydration-link'
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    {
      props: {
        children: 'link'
      },
      type: 'App'
    },
    {
      identifierPrefix: `${label}-`
    }
  );

  return {
    boundaryTarget,
    container,
    document,
    record
  };
}

function createDispatchRecord(container, domEventName, flags, target) {
  const wrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      domEventName,
      flags
    );

  return pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
    wrapper,
    {
      target,
      type: domEventName
    }
  );
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
    ownerDocument,
    parentNode: null
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
