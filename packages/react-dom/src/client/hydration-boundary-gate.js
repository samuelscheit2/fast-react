'use strict';

const {assertValidContainer, describeContainer} = require('./dom-container.js');
const {
  inspectHydrationContainerMarkers:
    inspectHydrationContainerMarkersWithContracts
} = require('./hydration-marker-parser.js');
const {
  duplicateCreateRootWarning,
  getCreateRootWarning,
  hasLegacyRootMarker,
  inspectContainerRootMarker,
  isContainerMarkedAsRoot,
  legacyRootWarning
} = require('./root-markers.js');
const {
  describeRootListenerGuard
} = require('../events/root-listeners.js');
const {
  EVENT_DISPATCH_BLOCKED_CODE,
  EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
  HYDRATION_REPLAY_BLOCKED_CODE,
  createHydrationDehydratedTargetResolutionDiagnostic,
  createHydrationReplayEventQueueDiagnostic
} = require('../events/plugin-event-system.js');

const HYDRATION_MARKER_ORACLE_KIND =
  'react-19.2.6-react-dom-hydration-marker-oracle';
const HYDRATION_MARKER_ORACLE_SCHEMA_VERSION = 1;
const UNSUPPORTED_HYDRATION_ROOT_KIND = 'unsupported-hydration';
const CONCURRENT_ROOT_TAG = 'ConcurrentRoot';

const privateHydrationBoundaryRecordType =
  'fast.react_dom.unsupported_hydration_boundary_record';

const acceptedHydrationMarkerContracts = freezeArray([
  markerContract(
    'activity-start',
    'Activity boundary',
    '<!--&-->',
    '&',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'activity-end',
    'Activity boundary',
    '<!--/&-->',
    '/&',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'suspense-completed-start',
    'Suspense boundary',
    '<!--$-->',
    '$',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'suspense-pending-start',
    'Suspense boundary',
    '<!--$?--><template id="{identifierPrefix}B:{hex}"></template>',
    '$?',
    'template placeholder with boundary id',
    'server-emitted-client-consumed-runtime-mutable'
  ),
  markerContract(
    'suspense-queued-start',
    'Suspense boundary',
    null,
    '$~',
    'existing pending boundary template',
    'runtime-mutated-client-consumed'
  ),
  markerContract(
    'suspense-client-rendered-start',
    'Suspense boundary',
    '<!--$!--><template data-dgst="..." data-msg="..." data-stck="..." data-cstck="..."></template>',
    '$!',
    'template carrying optional error digest/message/stack/component-stack attributes',
    'server-emitted-or-runtime-mutated-client-consumed'
  ),
  markerContract(
    'suspense-end',
    'Suspense boundary',
    '<!--/$-->',
    '/$',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'form-state-matching',
    'Form state',
    '<!--F!-->',
    'F!',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'form-state-not-matching',
    'Form state',
    '<!--F-->',
    'F',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'preamble-html-contribution',
    'Preamble cleanup',
    '<!--html-->',
    'html',
    null,
    'server-emitted-client-boundary-clear-consumed'
  ),
  markerContract(
    'preamble-head-contribution',
    'Preamble cleanup',
    '<!--head-->',
    'head',
    null,
    'server-emitted-client-boundary-clear-consumed'
  ),
  markerContract(
    'preamble-body-contribution',
    'Preamble cleanup',
    '<!--body-->',
    'body',
    null,
    'server-emitted-client-boundary-clear-consumed'
  ),
  markerContract(
    'segment-placeholder',
    'Fizz segment movement',
    '<template id="{identifierPrefix}P:{hex}"></template>',
    null,
    'template placeholder',
    'server-emitted-runtime-consumed'
  ),
  markerContract(
    'external-runtime-complete-segment',
    'Fizz external runtime',
    '<template data-rsi="" data-sid="{identifierPrefix}S:{hex}" data-pid="{identifierPrefix}P:{hex}"></template>',
    null,
    'template carrying segment and placeholder ids',
    'server-emitted-runtime-consumed'
  ),
  markerContract(
    'external-runtime-complete-boundary',
    'Fizz external runtime',
    '<template data-rci="" data-bid="{identifierPrefix}B:{hex}" data-sid="{identifierPrefix}S:{hex}"></template>',
    null,
    'template carrying boundary and segment ids',
    'server-emitted-runtime-consumed'
  ),
  markerContract(
    'external-runtime-complete-boundary-with-styles',
    'Fizz external runtime',
    '<template data-rri="" data-bid="{identifierPrefix}B:{hex}" data-sid="{identifierPrefix}S:{hex}" data-sty="..."></template>',
    null,
    'template carrying boundary id, segment id, and serialized style/resource precedence data',
    'server-emitted-runtime-consumed'
  ),
  markerContract(
    'external-runtime-client-render-boundary',
    'Fizz external runtime',
    '<template data-rxi="" data-bid="{identifierPrefix}B:{hex}" data-dgst="..." data-msg="..." data-stck="..." data-cstck="..."></template>',
    null,
    'template carrying boundary id and optional error evidence',
    'server-emitted-runtime-consumed'
  )
]);

const unsupportedHydrationPrerequisites = freezeArray([
  prerequisite(
    'no-hydration-root-constructor',
    'reconciler',
    'Hydration roots need a dedicated constructor and initial hydration scheduling path.'
  ),
  prerequisite(
    'no-hydration-context',
    'reconciler',
    'Hydratable cursor state, mismatch queues, and dehydrated boundary records are not wired.'
  ),
  prerequisite(
    'no-hydration-root-scheduling',
    'reconciler',
    'The special initial hydration update and root scheduling path are not implemented.'
  ),
  prerequisite(
    'no-hydration-marker-consumption',
    'react-dom-client',
    'Fizz marker parsing is diagnostic-only and is not wired to hydration root claiming.'
  ),
  prerequisite(
    'no-boundary-dom-operations',
    'react-dom-host',
    'Boundary clear, hide, unhide, and hydrated commit operations are not implemented.'
  ),
  prerequisite(
    'no-event-replay',
    'react-dom-events',
    'Blocked event replay and explicit hydration target queues are not implemented.'
  ),
  prerequisite(
    'no-form-marker-claiming',
    'react-dom-client',
    'F!/F form marker claiming is not wired to a hydration root path.'
  )
]);

const hydrationEventReplayBlockerContracts = freezeArray([
  replayBlocker(
    'no-dehydrated-host-root',
    'reconciler',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'No dehydrated HostRoot state exists for event replay blocker detection.'
  ),
  replayBlocker(
    'no-dehydrated-boundary-target',
    'reconciler',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Suspense and Activity dehydrated boundary targets are not claimable.'
  ),
  replayBlocker(
    'no-event-target-hydration-resolution',
    'react-dom-events',
    EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    'Event target diagnostics cannot resolve a hydratable boundary target.'
  ),
  replayBlocker(
    'no-explicit-hydration-target-queue',
    'react-dom-events',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Explicit hydration target priority queues are not implemented.'
  ),
  replayBlocker(
    'no-continuous-event-replay-queues',
    'react-dom-events',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Continuous event replay queues and retry scheduling are not implemented.'
  ),
  replayBlocker(
    'no-dispatch-replay-route',
    'react-dom-events',
    EVENT_DISPATCH_BLOCKED_CODE,
    'The accepted event dispatch gate remains blocked before replay execution.'
  )
]);

const hydrationMarkerReplayTargetContractIds = freezeArray([
  'activity-start',
  'suspense-completed-start',
  'suspense-pending-start',
  'suspense-queued-start',
  'suspense-client-rendered-start',
  'form-state-matching',
  'form-state-not-matching'
]);

const hydrationMarkerReplayQueueContracts = freezeArray([
  replayQueueContract(
    'explicit-hydration-targets',
    'queuedExplicitHydrationTargets',
    'react-dom-events',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Priority-sorted explicit hydration targets are not queued.'
  ),
  replayQueueContract(
    'continuous-focus',
    'queuedFocus',
    'react-dom-events',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Focus replay keeps only the latest blocked continuous event in React DOM.'
  ),
  replayQueueContract(
    'continuous-drag',
    'queuedDrag',
    'react-dom-events',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Drag replay keeps only the latest blocked continuous event in React DOM.'
  ),
  replayQueueContract(
    'continuous-mouse',
    'queuedMouse',
    'react-dom-events',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Mouse replay keeps only the latest blocked continuous event in React DOM.'
  ),
  replayQueueContract(
    'continuous-pointers',
    'queuedPointers',
    'react-dom-events',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Pointer replay keeps one latest blocked event per pointer id in React DOM.'
  ),
  replayQueueContract(
    'continuous-pointer-captures',
    'queuedPointerCaptures',
    'react-dom-events',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Pointer capture replay keeps one latest blocked event per pointer id in React DOM.'
  ),
  replayQueueContract(
    'change-event-targets',
    'queuedChangeEventTargets',
    'react-dom-events',
    EVENT_DISPATCH_BLOCKED_CODE,
    'Change-event replay targets are not queued or dispatched.'
  ),
  replayQueueContract(
    'form-replaying-queue',
    '$$reactFormReplay',
    'react-dom-events',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Server-form action replay queues are not scheduled or drained.'
  )
]);

const hydrationBoundaryRecordPayloads = new WeakMap();
const defaultHydrationBoundaryGate = createHydrationBoundaryGate();

function createHydrationBoundaryGate(options) {
  const gateState = createGateState(options);

  return Object.freeze({
    inspectContainerMarkers(container) {
      return inspectHydrationContainerMarkers(container, gateState);
    },
    recordUnsupportedHydrateRoot(container, initialChildren, hydrationOptions) {
      return createUnsupportedHydrateRootRecordWithGate(
        gateState,
        container,
        initialChildren,
        hydrationOptions
      );
    }
  });
}

function createUnsupportedHydrateRootRecord(
  container,
  initialChildren,
  hydrationOptions
) {
  return defaultHydrationBoundaryGate.recordUnsupportedHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
}

function getPrivateHydrationBoundaryRecordPayload(record) {
  return hydrationBoundaryRecordPayloads.get(record) || null;
}

function isPrivateHydrationBoundaryRecord(value) {
  return hydrationBoundaryRecordPayloads.has(value);
}

function inspectHydrationContainerMarkers(container, options) {
  return inspectHydrationContainerMarkersWithContracts(container, {
    markerContracts: acceptedHydrationMarkerContracts,
    validationOptions: options && options.validationOptions
  });
}

function assertAcceptedHydrationMarkerOracle(oracle) {
  assertOracleObject(oracle);
  assertOracleField(
    oracle.oracleKind === HYDRATION_MARKER_ORACLE_KIND,
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle kind does not match the accepted React DOM target.'
  );
  assertOracleField(
    oracle.schemaVersion === HYDRATION_MARKER_ORACLE_SCHEMA_VERSION,
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle schema version does not match the accepted contract.'
  );
  assertOracleField(
    oracle.generatedArtifacts === true && oracle.deterministic === true,
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle must be deterministic checked evidence.'
  );

  const claims = oracle.conformanceClaims;
  assertOracleField(
    claims != null && typeof claims === 'object',
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle is missing conformance claims.'
  );
  assertOracleField(
    claims.compatibilityClaimed === false &&
      claims.fastReactHydrationCompatible === false &&
      claims.fullDualRunOracleExists === false,
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle must keep Fast React hydration compatibility claims false.'
  );

  const actualContracts = normalizeMarkerContracts(oracle.markerContracts);
  assertOracleField(
    JSON.stringify(actualContracts) ===
      JSON.stringify(acceptedHydrationMarkerContracts),
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle contracts do not match the accepted marker snapshot.'
  );

  return createMarkerOracleInfo('checked-oracle');
}

function createUnsupportedHydrateRootRecordWithGate(
  gateState,
  container,
  initialChildren,
  hydrationOptions
) {
  assertValidContainer(container, gateState.validationOptions);
  const markerDiagnostics = inspectHydrationContainerMarkers(
    container,
    gateState
  );
  const markerParserEvidence =
    createHydrationMarkerParserEvidence(markerDiagnostics);
  const markerEvidence = createHydrationMarkerEvidence(markerDiagnostics);

  const sequence = gateState.nextRecordSequence++;
  const recordId = `${gateState.recordIdPrefix}:${sequence}`;
  const markerGuard = describeHydrationRootMarkerGuard(
    container,
    gateState.markerOptions
  );
  const listenerGuard = describeRootListenerGuard(container, {
    action: 'defer-listen-to-all-supported-events-for-hydrate-root'
  });
  const replayQueueDiagnostics = createHydrationMarkerReplayQueueDiagnostics({
    listenerGuard,
    markerDiagnostics,
    markerGuard,
    markerParserEvidence
  });
  const targetResolutionDiagnostics =
    createHydrationDehydratedTargetResolutionDiagnostic([], {
      markerDiagnostics,
      markerReplayTargetCandidates:
        replayQueueDiagnostics.markerReplayTargetCandidates,
      rootContainer: container,
      rootKind: UNSUPPORTED_HYDRATION_ROOT_KIND,
      rootRecordId: recordId,
      rootTag: CONCURRENT_ROOT_TAG,
      source: 'unsupported-hydrate-root-boundary-record'
    });
  const eventReplayQueueDiagnostics =
    createHydrationReplayEventQueueDiagnostic([], {
      dehydratedTargetResolution: targetResolutionDiagnostics,
      markerReplayTargetCandidates:
        replayQueueDiagnostics.markerReplayTargetCandidates,
      source: 'unsupported-hydrate-root-boundary-record'
    });
  const eventReplayBlockers = createHydrationEventReplayBlockers({
    eventReplayQueueDiagnostics,
    listenerGuard,
    markerDiagnostics,
    markerParserEvidence,
    replayQueueDiagnostics,
    targetResolutionDiagnostics
  });
  const record = freezeRecord({
    $$typeof: privateHydrationBoundaryRecordType,
    kind: 'FastReactDomUnsupportedHydrationBoundaryRecord',
    operation: 'hydrateRoot',
    status: 'unsupported',
    sequence,
    recordId,
    rootKind: UNSUPPORTED_HYDRATION_ROOT_KIND,
    rootTag: CONCURRENT_ROOT_TAG,
    containerInfo: freezeRecord(describeContainer(container)),
    initialChildrenInfo: describeHydrationValue(initialChildren),
    optionsInfo: describeHydrationValue(hydrationOptions),
    oracleInfo: gateState.markerOracleInfo,
    blockedOn: unsupportedHydrationPrerequisites,
    markerGuard,
    listenerGuard,
    markerDiagnostics,
    markerParserEvidence,
    markerEvidence,
    replayQueueDiagnostics,
    targetResolutionDiagnostics,
    eventReplayQueueDiagnostics,
    eventReplayBlockers,
    canHydrate: false,
    publicRootCreated: false,
    containerMarked: false,
    listenersAttached: false,
    domMutated: false,
    eventsReplayed: false,
    rootScheduled: false,
    suspenseHydrationScheduled: false
  });

  hydrationBoundaryRecordPayloads.set(record, {
    container,
    hydrationOptions,
    initialChildren
  });

  return record;
}

function createGateState(options) {
  return {
    markerOptions: options && options.markerOptions,
    markerOracleInfo:
      options && Object.prototype.hasOwnProperty.call(options, 'markerOracle')
        ? assertAcceptedHydrationMarkerOracle(options.markerOracle)
        : createMarkerOracleInfo('built-in-accepted-marker-snapshot'),
    nextRecordSequence: 1,
    recordIdPrefix: getIdPrefix(
      options && options.recordIdPrefix,
      'hydration'
    ),
    validationOptions: options && options.validationOptions
  };
}

function describeHydrationRootMarkerGuard(container, options) {
  const warningMessage = getCreateRootWarning(container, options);
  return freezeRecord({
    action: 'defer-mark-container-as-root-for-hydrate-root',
    hasLegacyRootMarker: hasLegacyRootMarker(container),
    isContainerMarkedAsRoot: isContainerMarkedAsRoot(container),
    rootMarkerSnapshot: describeContainerRootMarkerSnapshot(container),
    warning: describeCreateRootWarning(warningMessage)
  });
}

function describeContainerRootMarkerSnapshot(container) {
  const snapshot = inspectContainerRootMarker(container);
  return freezeRecord({
    inspectable: snapshot.inspectable,
    nullCount: snapshot.nullCount,
    properties: freezeArray(
      snapshot.properties.map((property) => freezeRecord({...property}))
    ),
    propertyCount: snapshot.propertyCount,
    truthyCount: snapshot.truthyCount
  });
}

function describeCreateRootWarning(message) {
  if (message === null) {
    return null;
  }

  let warningType = 'unknown';
  if (message === duplicateCreateRootWarning) {
    warningType = 'duplicate-create-root';
  } else if (message === legacyRootWarning) {
    warningType = 'legacy-root-container';
  }

  return freezeRecord({
    message,
    type: warningType
  });
}

function createHydrationMarkerEvidence(markerDiagnostics) {
  return freezeRecord({
    kind: 'FastReactDomHydrationMarkerEvidence',
    status: 'accepted-marker-evidence-recorded',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    canHydrate: false,
    acceptedMarkerCount: markerDiagnostics.acceptedMarkerCount,
    commentMarkerCount: markerDiagnostics.commentMarkerCount,
    templateMarkerCount: markerDiagnostics.templateMarkerCount,
    unrecognizedMarkerCount: markerDiagnostics.unrecognizedMarkerCount,
    contractIds: freezeArray(
      markerDiagnostics.markers.map((marker) => marker.contractId)
    )
  });
}

function createHydrationMarkerParserEvidence(markerDiagnostics) {
  return freezeRecord({
    kind: 'FastReactDomHydrationMarkerParserEvidence',
    status: 'accepted-marker-parser-evidence-recorded',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    canHydrate: false,
    parserKind: markerDiagnostics.kind,
    parserStatus: markerDiagnostics.status,
    traversal: markerDiagnostics.traversal,
    markerContractCount: markerDiagnostics.markerContractCount,
    nodeCount: markerDiagnostics.nodeCount,
    acceptedMarkerCount: markerDiagnostics.acceptedMarkerCount,
    commentMarkerCount: markerDiagnostics.commentMarkerCount,
    templateMarkerCount: markerDiagnostics.templateMarkerCount,
    unrecognizedMarkerCount: markerDiagnostics.unrecognizedMarkerCount,
    contractIds: freezeArray(
      markerDiagnostics.markers.map((marker) => marker.contractId)
    ),
    acceptedMarkerRows: freezeArray(
      markerDiagnostics.markers.map((marker) =>
        freezeRecord({
          area: marker.area,
          companionStatus:
            marker.companion === null ? null : marker.companion.status,
          contractId: marker.contractId,
          kind: marker.kind,
          lifecycle: marker.lifecycle,
          path: marker.path
        })
      )
    ),
    summaryByContract: freezeArray(
      markerDiagnostics.summaryByContract.map((summary) =>
        freezeRecord({
          count: summary.count,
          id: summary.id
        })
      )
    )
  });
}

function createHydrationMarkerReplayQueueDiagnostics({
  listenerGuard,
  markerDiagnostics,
  markerGuard,
  markerParserEvidence
}) {
  const replayTargetCandidates =
    createHydrationMarkerReplayTargetCandidates(markerDiagnostics);
  return freezeRecord({
    kind: 'FastReactDomHydrationMarkerReplayQueueDiagnostics',
    status: 'blocked-before-hydration-marker-replay-queues',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    rootBridgeStateSource: 'private-root-marker-and-listener-guards',
    markerGuardAction: markerGuard.action,
    listenerGuardAction: listenerGuard.action,
    rootMarkerState: describeRootMarkerReplayQueueState(markerGuard),
    rootListenerState: describeRootListenerReplayQueueState(listenerGuard),
    markerParserEvidenceAccepted:
      markerParserEvidence.status ===
      'accepted-marker-parser-evidence-recorded',
    acceptedMarkerCount: markerDiagnostics.acceptedMarkerCount,
    markerReplayTargetCandidateCount: replayTargetCandidates.length,
    markerReplayTargetCandidates: replayTargetCandidates,
    queueContractCount: hydrationMarkerReplayQueueContracts.length,
    queueContracts: hydrationMarkerReplayQueueContracts,
    queueMutationAllowed: false,
    hydrationReplaySupported: false,
    eventReplaySupported: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    hasScheduledReplayAttempt: false,
    explicitHydrationTargetsQueued: false,
    queuedExplicitHydrationTargetCount: 0,
    discreteEventReplayQueued: false,
    queuedDiscreteEventCount: 0,
    continuousEventReplayQueued: false,
    queuedContinuousEventCount: 0,
    changeEventTargetsQueued: false,
    queuedChangeEventTargetCount: 0,
    formReplayQueued: false,
    queuedFormActionCount: 0,
    replayQueueBlockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  });
}

function describeRootMarkerReplayQueueState(markerGuard) {
  return freezeRecord({
    sourceGuardAccepted: true,
    action: markerGuard.action,
    hasLegacyRootMarker: markerGuard.hasLegacyRootMarker,
    isContainerMarkedAsRoot: markerGuard.isContainerMarkedAsRoot,
    rootMarkerSnapshot: markerGuard.rootMarkerSnapshot,
    rootMarkerPropertyCount: markerGuard.rootMarkerSnapshot.propertyCount,
    rootMarkerTruthyCount: markerGuard.rootMarkerSnapshot.truthyCount,
    warningType: markerGuard.warning === null ? null : markerGuard.warning.type
  });
}

function describeRootListenerReplayQueueState(listenerGuard) {
  return freezeRecord({
    sourceGuardAccepted: true,
    action: listenerGuard.action,
    canInstallRootListeners: listenerGuard.canInstallRootListeners,
    hasRootListeningMarker: listenerGuard.hasRootListeningMarker,
    ownerDocumentCanInstallSelectionChange:
      listenerGuard.ownerDocumentCanInstallSelectionChange,
    ownerDocumentHasSelectionChangeMarker:
      listenerGuard.ownerDocumentHasSelectionChangeMarker,
    ownerDocumentInfo: listenerGuard.ownerDocumentInfo,
    rootEventTargetInfo: listenerGuard.rootEventTargetInfo
  });
}

function createHydrationMarkerReplayTargetCandidates(markerDiagnostics) {
  return freezeArray(
    markerDiagnostics.markers
      .filter((marker) =>
        hydrationMarkerReplayTargetContractIds.includes(marker.contractId)
      )
      .map((marker) =>
        freezeRecord({
          area: marker.area,
          blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
          contractId: marker.contractId,
          kind: marker.kind,
          path: marker.path,
          queued: false,
          queueEligible: false,
          replayTargetKind: getHydrationMarkerReplayTargetKind(marker.contractId)
        })
      )
  );
}

function getHydrationMarkerReplayTargetKind(contractId) {
  if (contractId.startsWith('activity-')) {
    return 'activity-boundary';
  }
  if (contractId.startsWith('suspense-')) {
    return 'suspense-boundary';
  }
  if (contractId.startsWith('form-state-')) {
    return 'form-state';
  }
  return 'unknown';
}

function createHydrationEventReplayBlockers({
  eventReplayQueueDiagnostics,
  listenerGuard,
  markerDiagnostics,
  markerParserEvidence,
  replayQueueDiagnostics,
  targetResolutionDiagnostics
}) {
  return freezeRecord({
    kind: 'FastReactDomHydrationEventReplayBlockers',
    status: 'blocked-after-private-root-and-event-gates',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    hydrationReplaySupported: false,
    eventsReplayed: false,
    explicitHydrationTargetsQueued: false,
    continuousEventReplayQueued: false,
    formReplayQueued: false,
    rootListenerGateAccepted: true,
    rootListenerInstallationDeferred: true,
    eventDispatchGateAccepted: true,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    hydrationReplayBlockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    markerParserEvidenceAccepted:
      markerParserEvidence.status ===
      'accepted-marker-parser-evidence-recorded',
    targetResolutionDiagnostics,
    targetResolutionDiagnosticsAccepted:
      targetResolutionDiagnostics.status ===
        'blocked-no-hydratable-event-targets-recorded' ||
      targetResolutionDiagnostics.status ===
        'blocked-hydratable-event-targets-recorded',
    dehydratedRootOwnerStatus:
      targetResolutionDiagnostics.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwnerCount:
      targetResolutionDiagnostics.dehydratedBoundaryOwnerCount,
    hydratableEventTargetLookupCount:
      targetResolutionDiagnostics.hydratableEventTargetLookupCount,
    eventReplayQueueDiagnostics,
    eventReplayQueueDiagnosticsAccepted:
      eventReplayQueueDiagnostics.status ===
        'blocked-no-event-replay-targets-recorded' ||
      eventReplayQueueDiagnostics.status ===
        'blocked-event-replay-targets-recorded',
    blockedEventReplayTargetCount:
      eventReplayQueueDiagnostics.blockedEventReplayTargetCount,
    queuedEventReplayTargetCount:
      eventReplayQueueDiagnostics.queuedEventReplayTargetCount,
    eventQueueOrder: eventReplayQueueDiagnostics.eventQueueOrder,
    priorityQueueOrder: eventReplayQueueDiagnostics.priorityQueueOrder,
    replayQueueDrainOrderDiagnostics:
      eventReplayQueueDiagnostics.replayQueueDrainOrderDiagnostics,
    drainOrderDiagnosticsAccepted:
      eventReplayQueueDiagnostics.drainOrderDiagnosticsAccepted,
    drainOrderCount: eventReplayQueueDiagnostics.drainOrderCount,
    drainOrder: eventReplayQueueDiagnostics.drainOrder,
    replayQueueDiagnostics,
    replayQueueDiagnosticsAccepted:
      replayQueueDiagnostics.status ===
      'blocked-before-hydration-marker-replay-queues',
    acceptedMarkerCount: markerDiagnostics.acceptedMarkerCount,
    markerReplayTargetCandidateCount:
      replayQueueDiagnostics.markerReplayTargetCandidateCount,
    queuedExplicitHydrationTargetCount:
      replayQueueDiagnostics.queuedExplicitHydrationTargetCount,
    queuedContinuousEventCount:
      replayQueueDiagnostics.queuedContinuousEventCount,
    queuedDiscreteEventCount: replayQueueDiagnostics.queuedDiscreteEventCount,
    queuedFormActionCount: replayQueueDiagnostics.queuedFormActionCount,
    canInstallRootListeners: listenerGuard.canInstallRootListeners,
    hasRootListeningMarker: listenerGuard.hasRootListeningMarker,
    blockerCount: hydrationEventReplayBlockerContracts.length,
    blockers: hydrationEventReplayBlockerContracts
  });
}

function createMarkerOracleInfo(source) {
  const markerContractIds = freezeArray(
    acceptedHydrationMarkerContracts.map((contract) => contract.id)
  );
  const commentMarkers = freezeArray(
    acceptedHydrationMarkerContracts
      .filter((contract) => contract.commentData !== null)
      .map((contract) =>
        freezeRecord({
          commentData: contract.commentData,
          id: contract.id
        })
      )
  );
  const templateMarkers = freezeArray(
    acceptedHydrationMarkerContracts
      .filter((contract) => contract.commentData === null)
      .map((contract) =>
        freezeRecord({
          companionNode: contract.companionNode,
          id: contract.id,
          serializedMarker: contract.serializedMarker
        })
      )
  );

  return freezeRecord({
    oracleKind: HYDRATION_MARKER_ORACLE_KIND,
    schemaVersion: HYDRATION_MARKER_ORACLE_SCHEMA_VERSION,
    source,
    deterministic: true,
    compatibilityClaimed: false,
    fastReactHydrationCompatible: false,
    fullDualRunOracleExists: false,
    markerContractCount: acceptedHydrationMarkerContracts.length,
    markerContractIds,
    commentMarkers,
    templateMarkers
  });
}

function markerContract(
  id,
  area,
  serializedMarker,
  commentData,
  companionNode,
  lifecycle
) {
  return freezeRecord({
    id,
    area,
    serializedMarker,
    commentData,
    companionNode,
    lifecycle
  });
}

function prerequisite(id, owner, reason) {
  return freezeRecord({
    id,
    owner,
    reason
  });
}

function replayBlocker(id, owner, blockedReason, reason) {
  return freezeRecord({
    blocked: true,
    blockedReason,
    id,
    owner,
    reason
  });
}

function replayQueueContract(id, queueName, owner, blockedReason, reason) {
  return freezeRecord({
    blocked: true,
    blockedReason,
    id,
    owner,
    queueName,
    queuedCount: 0,
    reason
  });
}

function normalizeMarkerContracts(markerContracts) {
  assertOracleField(
    Array.isArray(markerContracts),
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle must expose a markerContracts array.'
  );
  return markerContracts.map((contract) =>
    markerContract(
      contract && contract.id,
      contract && contract.area,
      contract && contract.serializedMarker,
      contract && contract.commentData,
      contract && contract.companionNode,
      contract && contract.lifecycle
    )
  );
}

function assertOracleObject(oracle) {
  assertOracleField(
    oracle != null && typeof oracle === 'object',
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle must be an object.'
  );
}

function assertOracleField(condition, code, message) {
  if (condition) {
    return;
  }

  const error = new Error(message);
  error.code = code;
  throw error;
}

function getIdPrefix(value, fallback) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function describeHydrationValue(value) {
  if (value === null) {
    return freezeRecord({
      type: 'null'
    });
  }

  const type = typeof value;
  if (type === 'undefined') {
    return freezeRecord({
      type: 'undefined'
    });
  }

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return freezeRecord({
      type,
      value
    });
  }

  if (type === 'bigint') {
    return freezeRecord({
      type,
      value: value.toString()
    });
  }

  if (type === 'function') {
    return freezeRecord({
      length: value.length,
      name: value.name || '',
      type: 'function'
    });
  }

  if (type === 'symbol') {
    return freezeRecord({
      description: value.description || null,
      type: 'symbol'
    });
  }

  if (Array.isArray(value)) {
    return freezeRecord({
      length: value.length,
      type: 'array'
    });
  }

  return freezeRecord({
    keys: Object.keys(value).sort(),
    type: 'object'
  });
}

function freezeArray(values) {
  return Object.freeze(values.slice());
}

function freezeRecord(record) {
  return Object.freeze(record);
}

module.exports = {
  CONCURRENT_ROOT_TAG,
  HYDRATION_MARKER_ORACLE_KIND,
  HYDRATION_MARKER_ORACLE_SCHEMA_VERSION,
  UNSUPPORTED_HYDRATION_ROOT_KIND,
  acceptedHydrationMarkerContracts,
  assertAcceptedHydrationMarkerOracle,
  createHydrationBoundaryGate,
  createUnsupportedHydrateRootRecord,
  getPrivateHydrationBoundaryRecordPayload,
  hydrationEventReplayBlockerContracts,
  hydrationMarkerReplayQueueContracts,
  inspectHydrationContainerMarkers,
  isPrivateHydrationBoundaryRecord,
  privateHydrationBoundaryRecordType,
  unsupportedHydrationPrerequisites
};
