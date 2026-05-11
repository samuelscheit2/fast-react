'use strict';

const {
  TEXT_NODE,
  assertValidContainer,
  describeContainer
} = require('./dom-container.js');
const {
  inspectHydrationContainerMarkers:
    inspectHydrationContainerMarkersWithContracts,
  readHydrationTextNodeValue,
  resolveHydrationContainerNodePath
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
  HYDRATION_REPLAY_TARGET_DISPATCH_LINK_DIAGNOSTIC_KIND,
  HYDRATION_REPLAY_BLOCKED_CODE,
  PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
  PRIVATE_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_STATUS,
  createHydrationReplayClickDispatchDiagnostic,
  createHydrationDehydratedTargetResolutionDiagnostic,
  createHydrationReplayEventQueueDiagnostic,
  createHydrationReplayTargetDispatchLinkDiagnostic:
    createPluginHydrationReplayTargetDispatchLinkDiagnostic,
  getHydrationReplayClickDispatchDiagnosticPayload,
  getHydrationReplayTargetDispatchLinkDiagnosticPayload:
    getPluginHydrationReplayTargetDispatchLinkDiagnosticPayload
} = require('../events/plugin-event-system.js');
const resourceFormInternalsGate = require('../resource-form-internals-gate.js');

const HYDRATION_MARKER_ORACLE_KIND =
  'react-19.2.6-react-dom-hydration-marker-oracle';
const HYDRATION_MARKER_ORACLE_SCHEMA_VERSION = 1;
const UNSUPPORTED_HYDRATION_ROOT_KIND = 'unsupported-hydration';
const CONCURRENT_ROOT_TAG = 'ConcurrentRoot';
const HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND =
  'FastReactDomHydrationTextMismatchDiagnostics';
const HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND =
  'FastReactDomHydrationTextMismatchRecoverableErrorMetadata';
const HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_RECORD_KIND =
  'FastReactDomHydrationTextMismatchRecoverableErrorPreflightRecord';
const HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_ROUTING_EXECUTION_RECORD_KIND =
  'FastReactDomHydrationTextMismatchRecoverableErrorRoutingExecutionRecord';
const HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_RECORD_KIND =
  'FastReactDomHydrationRecoverableErrorBoundaryAdmissionRecord';
const HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_RECORD_KIND =
  'FastReactDomHydrationTextNodeClaimPatchExecutionRecord';
const HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND =
  'FastReactDomHydrationReplayOwnershipGateDiagnostic';
const HYDRATION_REPLAY_OWNERSHIP_GATE_ENTRY_RECORD_KIND =
  'FastReactDomHydrationReplayOwnershipGateEntryRecord';
const HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_KIND =
  'FastReactDomHydrationTargetClaimingDiagnostic';
const HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION_RECORD_KIND =
  'FastReactDomHydrationClaimedReplayTargetDispatchExecutionRecord';
const HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND =
  'FastReactDomHydrationBoundaryAcceptedMetadataDiagnostics';
const HYDRATION_TEXT_MISMATCH_BLOCKED_REASON =
  'FAST_REACT_DOM_HYDRATION_TEXT_MISMATCH_BLOCKED';
const HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON =
  'FAST_REACT_DOM_HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED';
const INVALID_HYDRATION_BOUNDARY_RECORD_CODE =
  'FAST_REACT_DOM_INVALID_HYDRATION_BOUNDARY_RECORD';
const INVALID_HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_CODE =
  'FAST_REACT_DOM_INVALID_HYDRATION_TARGET_CLAIMING_DIAGNOSTIC';
const INVALID_HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION_CODE =
  'FAST_REACT_DOM_INVALID_HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION';
const INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_ROUTING_EXECUTION_CODE =
  'FAST_REACT_DOM_INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_ROUTING_EXECUTION';
const INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_CODE =
  'FAST_REACT_DOM_INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT';
const INVALID_HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_CODE =
  'FAST_REACT_DOM_INVALID_HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION';
const INVALID_HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_CODE =
  'FAST_REACT_DOM_INVALID_HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION';
const privateHydrationReplayOwnershipGateId =
  'hydration-replay-ownership-private-gate-1';
const privateHydrationTargetClaimingGateId =
  'hydration-target-claiming-private-gate-1';
const privateHydrationTargetClaimingMetadataStatus =
  'accepted-private-hydration-target-claiming-metadata';
const privateHydrationClaimedReplayTargetDispatchExecutionGateId =
  'hydration-claimed-replay-target-dispatch-execution-private-gate-1';
const privateHydrationClaimedReplayTargetDispatchExecutionStatus =
  'blocked-private-hydration-claimed-replay-target-dispatch-execution';
const privateHydrationBoundaryAcceptedMetadataGateId =
  'hydration-boundary-accepted-resource-form-metadata-private-gate-1';
const privateHydrationBoundaryAcceptedMetadataStatus =
  'accepted-private-hydration-boundary-resource-form-metadata-ids';
const privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId =
  'hydration-text-mismatch-recoverable-error-routing-execution-private-gate-1';
const privateHydrationTextMismatchRecoverableErrorRoutingExecutionStatus =
  'executed-private-hydration-text-mismatch-recoverable-error-routing';
const privateHydrationTextMismatchRecoverableErrorRoutingMetadataId =
  'hydration-text-mismatch-recoverable-error-routing';
const privateHydrationTextMismatchRecoverableErrorPreflightGateId =
  'hydration-text-mismatch-recoverable-error-private-preflight-gate-1';
const privateHydrationTextMismatchRecoverableErrorPreflightStatus =
  'preflighted-private-hydration-text-mismatch-recoverable-error-metadata';
const privateHydrationTextMismatchRecoverableErrorPreflightMetadataId =
  'hydration-text-mismatch-recoverable-error-preflight';
const privateHydrationRecoverableErrorBoundaryAdmissionGateId =
  'hydration-recoverable-error-boundary-admission-private-gate-1';
const privateHydrationRecoverableErrorBoundaryAdmissionStatus =
  'accepted-private-hydration-recoverable-error-boundary-admission';
const privateHydrationRecoverableErrorBoundaryAdmissionMetadataId =
  'hydration-recoverable-error-boundary-admission';
const privateHydrationTextNodeClaimPatchExecutionGateId =
  'hydration-text-node-claim-patch-execution-private-gate-1';
const privateHydrationTextNodeClaimPatchExecutionStatus =
  'executed-private-hydration-text-node-claim-patch';
const privateHydrationTextNodeClaimPatchMetadataId =
  'hydration-text-node-claim-patch';
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

const acceptedHydrationBoundaryMetadataContracts = freezeArray([
  acceptedMetadataContract(
    'hydration-replay-ownership',
    'hydration',
    privateHydrationReplayOwnershipGateId,
    HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND,
    'blocked-replay-ownership-retained-through-drain-order',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Retained dehydrated root and boundary ownership rows remain metadata-only.'
  ),
  acceptedMetadataContract(
    privateHydrationTextMismatchRecoverableErrorRoutingMetadataId,
    'hydration',
    privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId,
    HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND,
    'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded',
    HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON,
    'Hydration text mismatch recoverable-error rows require the explicit private routing execution gate before invoking root options.'
  ),
  acceptedMetadataContract(
    privateHydrationRecoverableErrorBoundaryAdmissionMetadataId,
    'hydration',
    privateHydrationRecoverableErrorBoundaryAdmissionGateId,
    HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_RECORD_KIND,
    privateHydrationRecoverableErrorBoundaryAdmissionStatus,
    HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON,
    'Hydration recoverable-error boundary rows require source-owned marker, target, replay, lifecycle, and recoverable-error preflight evidence.'
  ),
  acceptedMetadataContract(
    'resource-map-commit',
    'resource',
    resourceFormInternalsGate.privateResourceHintResourceMapCommitGateId,
    resourceFormInternalsGate.privateResourceHintResourceMapCommitRecordType,
    resourceFormInternalsGate.privateResourceHintResourceMapCommitStatus,
    resourceFormInternalsGate
      .privateResourceHintResourceMapCommitCompatibilityBlockedStatus,
    'Resource map commit rows remain private metadata and do not insert DOM resources.'
  ),
  acceptedMetadataContract(
    'stylesheet-load-error-state',
    'stylesheet',
    resourceFormInternalsGate
      .privateResourceHintStylesheetLoadErrorStateGateId,
    resourceFormInternalsGate
      .privateResourceHintStylesheetLoadErrorStateRecordType,
    resourceFormInternalsGate
      .privateResourceHintStylesheetLoadErrorStateStatus,
    resourceFormInternalsGate
      .privateResourceHintStylesheetLoadErrorStateCompatibilityBlockedStatus,
    'Stylesheet resource state rows remain private metadata without listeners, fetches, or commit suspension.'
  ),
  acceptedMetadataContract(
    'form-action-event-extraction',
    'form',
    resourceFormInternalsGate.privateFormActionEventExtractionGateId,
    resourceFormInternalsGate.privateFormActionEventExtractionRecordType,
    resourceFormInternalsGate
      .privateFormActionEventExtractionRecordedStatus,
    resourceFormInternalsGate.privateFormActionEventExtractionGateErrorCode,
    'Form action extraction rows remain private metadata without event objects, serialized payloads, actions, or transitions.'
  ),
  acceptedMetadataContract(
    'form-reset-queue-commit',
    'form',
    resourceFormInternalsGate.privateFormActionResetQueueCommitGateId,
    resourceFormInternalsGate.privateFormActionResetQueueCommitRecordType,
    resourceFormInternalsGate
      .privateFormActionResetQueueCommitRecordedStatus,
    resourceFormInternalsGate.privateFormActionResetQueueCommitGateErrorCode,
    'Form reset queue and commit rows remain private metadata without update queue writes or real form reset.'
  )
]);

const hydrationBoundaryAcceptedMetadataBlockers = freezeArray([
  metadataBlocker(
    'public-hydration-replay',
    HYDRATION_REPLAY_BLOCKED_CODE,
    'Hydration replay queues remain blocked and are not drained.'
  ),
  metadataBlocker(
    'public-root-render',
    'FAST_REACT_DOM_PUBLIC_ROOT_RENDER_BLOCKED',
    'Accepted private metadata cannot promote public root render compatibility.'
  ),
  metadataBlocker(
    'public-recoverable-error-routing',
    HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON,
    'Recoverable text mismatch callbacks are private-gated and do not promote public hydrateRoot compatibility.'
  ),
  metadataBlocker(
    'resource-dom-insertion',
    resourceFormInternalsGate
      .privateResourceHintResourceMapCommitCompatibilityBlockedStatus,
    'Resource maps and DOM insertion remain blocked outside private diagnostics.'
  ),
  metadataBlocker(
    'stylesheet-runtime-state',
    resourceFormInternalsGate
      .privateResourceHintStylesheetLoadErrorStateCompatibilityBlockedStatus,
    'Stylesheet load/error listeners, promises, fetches, and suspended commits remain blocked.'
  ),
  metadataBlocker(
    'form-action-execution',
    resourceFormInternalsGate.privateFormActionEventExtractionGateErrorCode,
    'Form action event extraction does not inspect real forms or invoke actions.'
  ),
  metadataBlocker(
    'form-reset-commit',
    resourceFormInternalsGate.privateFormActionResetQueueCommitGateErrorCode,
    'Form reset queue writes, commit traversal, and real form reset remain blocked.'
  )
]);

const hydrationBoundaryRecordPayloads = new WeakMap();
const hydrationReplayOwnershipGateDiagnosticPayloads = new WeakMap();
const hydrationTargetClaimingDiagnosticPayloads = new WeakMap();
const hydrationClaimedReplayTargetDispatchExecutionPayloads =
  new WeakMap();
const hydrationTextMismatchRecoverableErrorPreflightPayloads =
  new WeakMap();
const hydrationTextMismatchRecoverableErrorRoutingExecutionPayloads =
  new WeakMap();
const hydrationRecoverableErrorBoundaryAdmissionPayloads = new WeakMap();
const hydrationTextNodeClaimPatchExecutionPayloads = new WeakMap();
let hydrateRootSourceLedgerRootBridgeModule = null;
let hydrateRootSourceLedgerRootBridgeRegistrationCandidate = null;
const hydrateRootSourceLedgerRootBridgeModules = new WeakSet();
const hydrateRootSourceLedgerRootBridgeAuthorityTokens = new WeakMap();
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
    },
    createHydrationTargetClaimingDiagnostic(
      hydrationBoundaryRecord,
      ownershipDiagnostics,
      targetDispatchLinkDiagnostic,
      options
    ) {
      return createHydrationTargetClaimingDiagnostic(
        hydrationBoundaryRecord,
        ownershipDiagnostics,
        targetDispatchLinkDiagnostic,
        options
      );
    },
    createHydrationClaimedReplayTargetDispatchExecutionRecord(
      targetClaimingDiagnostic,
      targetDispatchLinkDiagnostic,
      options
    ) {
      return createHydrationClaimedReplayTargetDispatchExecutionRecord(
        targetClaimingDiagnostic,
        targetDispatchLinkDiagnostic,
        options
      );
    },
    createHydrationTextMismatchRecoverableErrorRoutingExecutionRecord(
      hydrationBoundaryRecord,
      acceptedBoundaryMetadataDiagnostics,
      options
    ) {
      return createHydrationTextMismatchRecoverableErrorRoutingExecutionRecord(
        hydrationBoundaryRecord,
        acceptedBoundaryMetadataDiagnostics,
        options
      );
    },
    createHydrationTextMismatchRecoverableErrorPreflightRecord(
      hydrationBoundaryRecord,
      acceptedBoundaryMetadataDiagnostics,
      recoverableErrorMetadata,
      options
    ) {
      return createHydrationTextMismatchRecoverableErrorPreflightRecord(
        hydrationBoundaryRecord,
        acceptedBoundaryMetadataDiagnostics,
        recoverableErrorMetadata,
        options
      );
    },
    createHydrationRecoverableErrorBoundaryAdmissionRecord(
      hydrationBoundaryRecord,
      acceptedBoundaryMetadataDiagnostics,
      recoverableErrorPreflightRecord,
      targetClaimingDiagnostic,
      replayExecutionRecord,
      options
    ) {
      return createHydrationRecoverableErrorBoundaryAdmissionRecord(
        hydrationBoundaryRecord,
        acceptedBoundaryMetadataDiagnostics,
        recoverableErrorPreflightRecord,
        targetClaimingDiagnostic,
        replayExecutionRecord,
        options
      );
    },
    createHydrationTextNodeClaimPatchExecutionRecord(
      hydrationBoundaryRecord,
      acceptedBoundaryMetadataDiagnostics,
      options
    ) {
      return createHydrationTextNodeClaimPatchExecutionRecord(
        hydrationBoundaryRecord,
        acceptedBoundaryMetadataDiagnostics,
        options
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

function assertPrivateHydrationBoundaryRecord(record) {
  if (isPrivateHydrationBoundaryRecord(record)) {
    return record;
  }

  const error = new Error(
    'Expected a private unsupported hydration boundary record.'
  );
  error.code = INVALID_HYDRATION_BOUNDARY_RECORD_CODE;
  throw error;
}

function createHydrationReplayOwnershipGateDiagnostic(
  hydrationBoundaryRecord,
  dispatchRecords,
  options
) {
  const record = assertPrivateHydrationBoundaryRecord(
    hydrationBoundaryRecord
  );
  const normalizedOptions =
    options && typeof options === 'object' ? options : {};
  const source =
    typeof normalizedOptions.source === 'string'
      ? normalizedOptions.source
      : 'private-hydration-replay-ownership-gate';
  const eventReplayQueueDiagnostics =
    createHydrationReplayEventQueueDiagnostic(dispatchRecords, {
      dehydratedTargetResolution: record.targetResolutionDiagnostics,
      markerReplayTargetCandidates:
        record.replayQueueDiagnostics.markerReplayTargetCandidates,
      source
    });

  return createHydrationReplayOwnershipGateDiagnosticFromQueue({
    eventReplayQueueDiagnostics,
    recordId: record.recordId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    source
  });
}

function createHydrationReplayTargetDispatchLinkDiagnostic(
  hydrationBoundaryRecord,
  dispatchRecord,
  options
) {
  const record = assertPrivateHydrationBoundaryRecord(
    hydrationBoundaryRecord
  );
  const normalizedOptions =
    options && typeof options === 'object' ? options : {};
  const source =
    typeof normalizedOptions.source === 'string'
      ? normalizedOptions.source
      : 'private-hydration-replay-target-dispatch-link';
  const eventReplayQueueDiagnostics =
    createHydrationReplayEventQueueDiagnostic(dispatchRecord, {
      dehydratedTargetResolution: record.targetResolutionDiagnostics,
      markerReplayTargetCandidates:
        record.replayQueueDiagnostics.markerReplayTargetCandidates,
      source
    });

  return createPluginHydrationReplayTargetDispatchLinkDiagnostic(
    eventReplayQueueDiagnostics,
    dispatchRecord,
    {
      inputOrder: 0,
      source,
      targetDispatchPathRecord: normalizedOptions.targetDispatchPathRecord
    }
  );
}

function createHydrationTargetClaimingDiagnostic(
  hydrationBoundaryRecord,
  ownershipDiagnostics,
  targetDispatchLinkDiagnostic,
  options
) {
  const record = assertPrivateHydrationBoundaryRecord(
    hydrationBoundaryRecord
  );
  const normalizedOptions =
    options && typeof options === 'object' ? options : {};
  const targetDispatchLink =
    assertHydrationTargetClaimingDispatchLink(targetDispatchLinkDiagnostic);
  const targetDispatchLinkPayload =
    getPluginHydrationReplayTargetDispatchLinkDiagnosticPayload(
      targetDispatchLink
    );
  const hydrationBoundaryRecordPayload =
    getPrivateHydrationBoundaryRecordPayload(record);
  const ownershipRow = resolveHydrationTargetClaimingOwnershipRow(
    record,
    ownershipDiagnostics,
    targetDispatchLink,
    targetDispatchLinkPayload
  );
  const markerRow = resolveHydrationTargetClaimingMarkerRow(
    record,
    targetDispatchLink,
    normalizedOptions
  );
  const targetPathRecord = resolveSupportedHydrationTargetClaimingPath(
    targetDispatchLink.targetPath
  );
  const markerPathRecord = resolveSupportedHydrationTargetClaimingPath(
    markerRow.path
  );
  const targetPathEvidence = resolveHydrationTargetClaimingPathEvidence(
    hydrationBoundaryRecordPayload,
    targetDispatchLink,
    targetDispatchLinkPayload,
    targetPathRecord
  );
  const boundaryOwner = targetDispatchLink.dehydratedBoundaryOwner;

  if (
    !isSupportedHydrationTargetClaimingBoundaryKind(
      targetDispatchLink.ownerBoundaryKind
    ) ||
    targetDispatchLink.dehydratedBoundaryOwnerId !== boundaryOwner.ownerId ||
    boundaryOwner.path !== markerRow.path ||
    boundaryOwner.contractId !== markerRow.contractId ||
    compareHydrationTargetClaimingPathRecords(
      targetPathRecord,
      markerPathRecord
    ) <= 0
  ) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming requires a marker-owned dehydrated host boundary target.'
    );
  }

  const claimRecord = freezeRecord({
    kind: HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_KIND,
    gateId: privateHydrationTargetClaimingGateId,
    metadataId: 'hydration-target-claiming',
    status: privateHydrationTargetClaimingMetadataStatus,
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-target-claiming-gate',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    publicHydrationCompatibilityClaimed: false,
    publicHydrationReplayCompatibilityClaimed: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    hostInstanceHydrationAttempted: false,
    hasScheduledReplayAttempt: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    eventDispatch: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    rootRecordId: record.recordId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    markerParserEvidenceAccepted:
      record.markerParserEvidence.status ===
      'accepted-marker-parser-evidence-recorded',
    markerDiagnosticsStatus: record.markerDiagnostics.status,
    acceptedMarkerCount: record.markerDiagnostics.acceptedMarkerCount,
    markerId: markerRow.markerId,
    markerKind: markerRow.kind,
    markerPath: markerRow.path,
    markerContractId: markerRow.contractId,
    markerLifecycle: markerRow.lifecycle,
    markerArea: markerRow.area,
    markerRow,
    markerReplayTargetCandidate:
      findHydrationTargetClaimingReplayTargetCandidate(
        record,
        markerRow
      ),
    targetDispatchLinkDiagnostic: targetDispatchLink,
    targetDispatchLinkStatus: targetDispatchLink.status,
    inputOrder: targetDispatchLink.inputOrder,
    replayQueueOrder: targetDispatchLink.replayQueueOrder,
    prioritySortKey: targetDispatchLink.prioritySortKey,
    domEventName: targetDispatchLink.domEventName,
    nativeEventType: targetDispatchLink.nativeEventType,
    queueCategory: targetDispatchLink.queueCategory,
    queueName: targetDispatchLink.queueName,
    queuePolicy: targetDispatchLink.queuePolicy,
    replayableEvent: targetDispatchLink.replayableEvent,
    ownershipDiagnostics,
    ownershipDiagnosticStatus: ownershipDiagnostics.status,
    ownershipRow,
    ownershipRowStatus: ownershipRow.status,
    ownershipRetainedThroughDrainOrder:
      ownershipRow.ownershipRetainedThroughDrainOrder,
    rootOwnershipStatus: targetDispatchLink.rootOwnershipStatus,
    dehydratedRootOwnerStatus:
      targetDispatchLink.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwner: boundaryOwner,
    dehydratedBoundaryOwnerId:
      targetDispatchLink.dehydratedBoundaryOwnerId,
    dehydratedBoundaryOwnerIndex: boundaryOwner.index,
    dehydratedBoundaryOwnerPath: boundaryOwner.path,
    dehydratedBoundaryOwnerStatus:
      targetDispatchLink.dehydratedBoundaryOwnerStatus,
    ownerBoundaryKind: targetDispatchLink.ownerBoundaryKind,
    ownerBoundaryStatus: targetDispatchLink.ownerBoundaryStatus,
    targetPath: targetDispatchLink.targetPath,
    targetPathStatus: targetDispatchLink.targetPathStatus,
    targetPathParentPath: targetPathRecord.parentPath,
    targetPathIndex: targetPathRecord.index,
    targetPathRootIndex: targetPathRecord.rootIndex,
    targetPathSegmentCount: targetPathRecord.segmentCount,
    targetPathSegments: targetPathRecord.segments,
    targetPathResolvedPath: targetPathEvidence.resolvedPath,
    targetPathResolutionStatus: targetPathEvidence.resolutionStatus,
    targetPathResolvedToDispatchTarget:
      targetPathEvidence.resolvedToDispatchTarget,
    targetPathUniqueInContainer: targetPathEvidence.uniqueInContainer,
    targetPathDeterministicallySelected:
      targetPathEvidence.deterministicallySelected,
    targetPathMatchCount: targetPathEvidence.matchCount,
    targetPathMatchedPaths: targetPathEvidence.matchedPaths,
    targetPathParentChainRetained:
      targetPathEvidence.parentChainRetained,
    targetContainerMatchesBoundaryRecord:
      targetPathEvidence.containerMatchesBoundaryRecord,
    hydratableLookupTargetPathRetained:
      targetPathEvidence.hydratableLookupTargetPathRetained,
    targetNodeInfo: targetDispatchLink.targetNodeInfo,
    targetContainerInfo: targetDispatchLink.targetContainerInfo,
    targetContainerMatchesRoot:
      targetDispatchLink.targetContainerMatchesRoot,
    targetWithinRootContainer:
      targetDispatchLink.targetWithinRootContainer,
    targetDispatchPathStatus:
      targetDispatchLink.targetDispatchPathStatus,
    targetDispatchPathLength:
      targetDispatchLink.targetDispatchPathLength,
    eventPathStatus: targetDispatchLink.eventPathStatus,
    eventPathEntryCount: targetDispatchLink.eventPathEntryCount,
    claimRecorded: true,
    claimedTargetMetadata: true,
    targetClaimExecuted: false,
    publicHydrationTargetClaimed: false,
    hydrateInstanceCalled: false,
    hydrateTextInstanceCalled: false,
    replayQueueDrained: false,
    queued: false
  });

  hydrationTargetClaimingDiagnosticPayloads.set(
    claimRecord,
    freezeRecord({
      hydrationBoundaryRecord,
      markerRow,
      ownershipDiagnostics,
      ownershipRow,
      targetPathEvidence,
      targetPathResolution: targetPathEvidence.targetPathResolution,
      targetDispatchLinkDiagnostic: targetDispatchLink,
      targetDispatchLinkPayload
    })
  );

  return claimRecord;
}

function createHydrationClaimedReplayTargetDispatchExecutionRecord(
  targetClaimingDiagnostic,
  targetDispatchLinkDiagnostic,
  options
) {
  const normalizedOptions =
    options && typeof options === 'object' ? options : {};
  const claimValidation =
    assertHydrationClaimedReplayTargetDispatchExecutionClaim(
      targetClaimingDiagnostic
    );
  const targetDispatchLink =
    assertHydrationTargetClaimingDispatchLink(targetDispatchLinkDiagnostic);
  const targetDispatchLinkPayload =
    getPluginHydrationReplayTargetDispatchLinkDiagnosticPayload(
      targetDispatchLink
    );

  assertHydrationClaimedReplayTargetDispatchExecutionLink(
    claimValidation,
    targetDispatchLink,
    targetDispatchLinkPayload
  );

  const dispatchRecord = targetDispatchLinkPayload.dispatchRecord;
  assertHydrationClaimedReplayTargetDispatchExecutionDispatchBlocked(
    dispatchRecord,
    targetDispatchLink
  );

  const clickReplayDispatchDiagnostic =
    targetClaimingDiagnostic.domEventName === 'click'
      ? createHydrationReplayClickDispatchDiagnostic(targetDispatchLink, {
          source:
            typeof normalizedOptions.clickReplayDispatchSource === 'string'
              ? normalizedOptions.clickReplayDispatchSource
              : 'private-hydration-claimed-replay-target-click-dispatch',
          targetClaimingDiagnostic
        })
      : null;
  const clickReplayDispatchDiagnosticPayload =
    clickReplayDispatchDiagnostic === null
      ? null
      : getHydrationReplayClickDispatchDiagnosticPayload(
          clickReplayDispatchDiagnostic
        );

  const hydrationBoundaryRecord = claimValidation.hydrationBoundaryRecord;
  const recoverableErrorMetadata =
    hydrationBoundaryRecord.recoverableErrorMetadata;
  const recoverableErrorRows =
    recoverableErrorMetadata &&
    Array.isArray(recoverableErrorMetadata.recoverableErrorRows)
      ? recoverableErrorMetadata.recoverableErrorRows
      : [];
  const onRecoverableErrorOption =
    recoverableErrorMetadata &&
    recoverableErrorMetadata.onRecoverableErrorOption
      ? recoverableErrorMetadata.onRecoverableErrorOption
      : null;

  const executionRecord = freezeRecord({
    kind: HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION_RECORD_KIND,
    gateId: privateHydrationClaimedReplayTargetDispatchExecutionGateId,
    metadataId: 'hydration-claimed-replay-target-dispatch-execution',
    status: privateHydrationClaimedReplayTargetDispatchExecutionStatus,
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-claimed-replay-target-dispatch-execution',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    publicHydrationCompatibilityClaimed: false,
    publicHydrationReplayCompatibilityClaimed: false,
    publicHydrationTargetClaimed: false,
    publicHydrateRootSupported: false,
    publicDispatchEnabled: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    hostInstanceHydrationAttempted: false,
    hasScheduledReplayAttempt: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    eventDispatch: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    rootRecordId: hydrationBoundaryRecord.recordId,
    rootKind: hydrationBoundaryRecord.rootKind,
    rootTag: hydrationBoundaryRecord.rootTag,
    targetClaimingDiagnostic,
    targetClaimingDiagnosticStatus: targetClaimingDiagnostic.status,
    claimGateId: targetClaimingDiagnostic.gateId,
    targetClaimAccepted: true,
    claimRecorded: true,
    claimedTargetMetadata: true,
    targetClaimExecuted: false,
    targetDispatchLinkDiagnostic: targetDispatchLink,
    targetDispatchLinkStatus: targetDispatchLink.status,
    targetDispatchLinkAccepted: true,
    inputOrder: targetClaimingDiagnostic.inputOrder,
    replayQueueOrder: targetClaimingDiagnostic.replayQueueOrder,
    prioritySortKey: targetClaimingDiagnostic.prioritySortKey,
    domEventName: targetClaimingDiagnostic.domEventName,
    nativeEventType: targetClaimingDiagnostic.nativeEventType,
    queueCategory: targetClaimingDiagnostic.queueCategory,
    queueName: targetClaimingDiagnostic.queueName,
    queuePolicy: targetClaimingDiagnostic.queuePolicy,
    replayableEvent: targetClaimingDiagnostic.replayableEvent,
    replayQueueEntry: targetDispatchLinkPayload.replayQueueEntry,
    hydratableEventTargetLookup:
      targetDispatchLinkPayload.hydratableEventTargetLookup,
    ownershipDiagnostics: claimValidation.ownershipDiagnostics,
    ownershipRow: claimValidation.ownershipRow,
    ownershipRowStatus: claimValidation.ownershipRow.status,
    ownershipRetainedThroughDrainOrder:
      claimValidation.ownershipRow.ownershipRetainedThroughDrainOrder,
    markerRow: claimValidation.markerRow,
    markerId: targetClaimingDiagnostic.markerId,
    markerPath: targetClaimingDiagnostic.markerPath,
    markerContractId: targetClaimingDiagnostic.markerContractId,
    dehydratedBoundaryOwner:
      targetClaimingDiagnostic.dehydratedBoundaryOwner,
    dehydratedBoundaryOwnerId:
      targetClaimingDiagnostic.dehydratedBoundaryOwnerId,
    dehydratedBoundaryOwnerPath:
      targetClaimingDiagnostic.dehydratedBoundaryOwnerPath,
    ownerBoundaryKind: targetClaimingDiagnostic.ownerBoundaryKind,
    ownerBoundaryStatus: targetClaimingDiagnostic.ownerBoundaryStatus,
    rootOwnershipStatus: targetClaimingDiagnostic.rootOwnershipStatus,
    targetPath: targetClaimingDiagnostic.targetPath,
    targetPathStatus: targetClaimingDiagnostic.targetPathStatus,
    targetPathParentPath: targetClaimingDiagnostic.targetPathParentPath,
    targetPathIndex: targetClaimingDiagnostic.targetPathIndex,
    targetPathRootIndex: targetClaimingDiagnostic.targetPathRootIndex,
    targetPathSegmentCount: targetClaimingDiagnostic.targetPathSegmentCount,
    targetPathSegments: targetClaimingDiagnostic.targetPathSegments,
    targetPathResolvedPath: targetClaimingDiagnostic.targetPathResolvedPath,
    targetPathResolutionStatus:
      targetClaimingDiagnostic.targetPathResolutionStatus,
    targetPathResolvedToDispatchTarget:
      targetClaimingDiagnostic.targetPathResolvedToDispatchTarget,
    targetPathUniqueInContainer:
      targetClaimingDiagnostic.targetPathUniqueInContainer,
    targetPathDeterministicallySelected:
      targetClaimingDiagnostic.targetPathDeterministicallySelected,
    targetPathMatchCount: targetClaimingDiagnostic.targetPathMatchCount,
    targetPathMatchedPaths: targetClaimingDiagnostic.targetPathMatchedPaths,
    targetPathParentChainRetained:
      targetClaimingDiagnostic.targetPathParentChainRetained,
    targetContainerMatchesBoundaryRecord:
      targetClaimingDiagnostic.targetContainerMatchesBoundaryRecord,
    hydratableLookupTargetPathRetained:
      targetClaimingDiagnostic.hydratableLookupTargetPathRetained,
    targetNodeInfo: targetClaimingDiagnostic.targetNodeInfo,
    targetContainerInfo: targetClaimingDiagnostic.targetContainerInfo,
    targetContainerMatchesRoot:
      targetClaimingDiagnostic.targetContainerMatchesRoot,
    targetWithinRootContainer:
      targetClaimingDiagnostic.targetWithinRootContainer,
    dispatchRecord,
    dispatchRecordStatus: dispatchRecord.status,
    dispatchRecordBlockedReason: dispatchRecord.blockedReason,
    targetDispatchPathRecord:
      targetDispatchLinkPayload.targetDispatchPathRecord,
    targetDispatchPathStatus:
      targetClaimingDiagnostic.targetDispatchPathStatus,
    targetDispatchPathLength:
      targetClaimingDiagnostic.targetDispatchPathLength,
    eventPathStatus: targetClaimingDiagnostic.eventPathStatus,
    eventPathEntryCount: targetClaimingDiagnostic.eventPathEntryCount,
    dispatchBlockerMetadata: targetDispatchLink.dispatchBlockerMetadata,
    dispatchQueueStatus: targetDispatchLink.dispatchQueueStatus,
    dispatchQueueLength: targetDispatchLink.dispatchQueueLength,
    dispatchQueueListenerCount: targetDispatchLink.dispatchQueueListenerCount,
    clickReplayDispatchDiagnostic,
    clickReplayDispatchDiagnosticKind:
      clickReplayDispatchDiagnostic === null
        ? null
        : clickReplayDispatchDiagnostic.kind,
    clickReplayDispatchDiagnosticStatus:
      clickReplayDispatchDiagnostic === null
        ? null
        : clickReplayDispatchDiagnostic.status,
    clickReplayDispatchDiagnosticRecorded:
      clickReplayDispatchDiagnostic !== null,
    clickReplayDispatchDiagnosticBlocked:
      clickReplayDispatchDiagnostic === null
        ? false
        : clickReplayDispatchDiagnostic.clickReplayDispatchDiagnosticBlocked,
    clickReplayDispatchQueueOrderPreserved:
      clickReplayDispatchDiagnostic === null
        ? false
        : clickReplayDispatchDiagnostic.queueOrderPreserved,
    blockedClickReplayDispatchDiagnosticCount:
      clickReplayDispatchDiagnostic === null ? 0 : 1,
    executionRecordCount: 1,
    blockedReplayTargetDispatchExecutionCount: 1,
    replayTargetDispatchExecutionRecorded: true,
    replayTargetDispatchExecutionBlocked: true,
    dispatchExecutionRecorded: true,
    dispatchExecutionBlocked: true,
    targetDispatchExecuted: false,
    eventReplayDispatchAttempted: false,
    pluginDispatchEventForPluginEventSystemCalled: false,
    nativeEventRedispatched: false,
    syntheticEventCreated: false,
    syntheticEventCount: 0,
    listenerInvocationCount: 0,
    willInvokeListeners: false,
    hydrateInstanceCalled: false,
    hydrateTextInstanceCalled: false,
    replayQueueDrained: false,
    queued: false,
    recoverableErrorMetadata,
    recoverableErrorMetadataAccepted:
      recoverableErrorMetadata !== null &&
      recoverableErrorMetadata !== undefined,
    recoverableErrorMetadataStatus:
      recoverableErrorMetadata == null
        ? null
        : recoverableErrorMetadata.status,
    recoverableErrorRowCount: recoverableErrorRows.length,
    queuedRecoverableErrorCount:
      recoverableErrorMetadata == null
        ? 0
        : recoverableErrorMetadata.queuedRecoverableErrorCount,
    wouldQueueRecoverableErrorCount:
      recoverableErrorMetadata == null
        ? 0
        : recoverableErrorMetadata.wouldQueueRecoverableErrorCount,
    recoverableErrorsQueued: false,
    onRecoverableErrorConfigured:
      onRecoverableErrorOption === null
        ? false
        : onRecoverableErrorOption.present === true,
    onRecoverableErrorInvoked: false,
    publicOnRecoverableErrorInvoked: false,
    unsupportedHydrationPrerequisiteCount:
      unsupportedHydrationPrerequisites.length,
    unsupportedHydrationPrerequisites,
    hydrationEventReplayBlockerCount:
      hydrationEventReplayBlockerContracts.length,
    hydrationEventReplayBlockers: hydrationEventReplayBlockerContracts
  });

  hydrationClaimedReplayTargetDispatchExecutionPayloads.set(
    executionRecord,
    freezeRecord({
      dispatchRecord,
      hydrationBoundaryRecord,
      markerRow: claimValidation.markerRow,
      ownershipDiagnostics: claimValidation.ownershipDiagnostics,
      ownershipRow: claimValidation.ownershipRow,
      recoverableErrorMetadata,
      clickReplayDispatchDiagnostic,
      clickReplayDispatchDiagnosticPayload,
      targetClaimingDiagnostic,
      targetClaimingDiagnosticPayload: claimValidation.claimPayload,
      targetDispatchLinkDiagnostic: targetDispatchLink,
      targetDispatchLinkPayload
    })
  );

  return executionRecord;
}

function getPrivateHydrationTargetClaimingDiagnosticPayload(record) {
  return hydrationTargetClaimingDiagnosticPayloads.get(record) || null;
}

function isPrivateHydrationTargetClaimingDiagnostic(value) {
  return hydrationTargetClaimingDiagnosticPayloads.has(value);
}

function assertCanonicalPrivateHydrationTargetClaimingDiagnostic(
  record,
  expected
) {
  const expectedEvidence =
    expected && typeof expected === 'object' ? expected : {};
  const payload = getPrivateHydrationTargetClaimingDiagnosticPayload(record);
  if (
    payload === null ||
    !record ||
    typeof record !== 'object' ||
    !Object.isFrozen(record) ||
    record.kind !== HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_KIND ||
    record.gateId !== privateHydrationTargetClaimingGateId ||
    record.status !== privateHydrationTargetClaimingMetadataStatus ||
    record.diagnosticOnly !== true ||
    record.readOnly !== true ||
    record.compatibilityClaimed !== false ||
    record.browserDomEventCompatibilityClaimed !== false ||
    record.publicRootBehaviorChanged !== false ||
    record.publicHydrationCompatibilityClaimed !== false ||
    record.publicHydrationReplayCompatibilityClaimed !== false ||
    record.eventReplaySupported !== false ||
    record.hydrationReplaySupported !== false ||
    record.queueMutationAllowed !== false ||
    record.replayQueuesDrained !== false ||
    record.eventDispatch !== false ||
    record.willDispatch !== false ||
    record.willHydrate !== false ||
    record.willReplay !== false ||
    record.targetClaimExecuted !== false ||
    record.publicHydrationTargetClaimed !== false ||
    record.claimRecorded !== true ||
    record.claimedTargetMetadata !== true ||
    record.markerRow !== payload.markerRow ||
    record.ownershipDiagnostics !== payload.ownershipDiagnostics ||
    record.ownershipRow !== payload.ownershipRow ||
    record.targetDispatchLinkDiagnostic !==
      payload.targetDispatchLinkDiagnostic ||
    payload.targetDispatchLinkPayload === null ||
    payload.targetDispatchLinkPayload === undefined ||
    !isPrivateHydrationBoundaryRecord(payload.hydrationBoundaryRecord) ||
    !payload.targetPathEvidence ||
    typeof payload.targetPathEvidence !== 'object' ||
    !Object.isFrozen(payload.targetPathEvidence) ||
    !Object.isFrozen(payload.targetPathEvidence.targetPathRecord) ||
    !Object.isFrozen(payload.targetPathEvidence.matchedPaths) ||
    record.targetPathDeterministicallySelected !== true ||
    record.targetPathResolvedToDispatchTarget !== true ||
    record.targetPathUniqueInContainer !== true ||
    record.targetPathParentChainRetained !== true ||
    record.targetContainerMatchesBoundaryRecord !== true ||
    record.hydratableLookupTargetPathRetained !== true
  ) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming requires canonical immutable private target-claiming evidence.'
    );
  }

  if (
    expectedEvidence.hydrationBoundaryRecord !== undefined &&
    payload.hydrationBoundaryRecord !==
      expectedEvidence.hydrationBoundaryRecord
  ) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming evidence must match the expected hydration boundary record.'
    );
  }
  if (
    expectedEvidence.ownershipDiagnostics !== undefined &&
    payload.ownershipDiagnostics !== expectedEvidence.ownershipDiagnostics
  ) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming evidence must match the expected ownership diagnostics.'
    );
  }
  if (
    expectedEvidence.targetDispatchLinkDiagnostic !== undefined &&
    payload.targetDispatchLinkDiagnostic !==
      expectedEvidence.targetDispatchLinkDiagnostic
  ) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming evidence must match the expected target-dispatch link.'
    );
  }

  return payload;
}

function getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload(
  record
) {
  return (
    hydrationClaimedReplayTargetDispatchExecutionPayloads.get(record) ||
    null
  );
}

function isPrivateHydrationClaimedReplayTargetDispatchExecutionRecord(
  value
) {
  return hydrationClaimedReplayTargetDispatchExecutionPayloads.has(value);
}

function assertCanonicalPrivateHydrationClaimedReplayTargetDispatchExecutionRecord(
  record,
  expected
) {
  const expectedEvidence =
    expected && typeof expected === 'object' ? expected : {};
  const payload =
    getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload(record);
  if (
    payload === null ||
    !record ||
    typeof record !== 'object' ||
    !Object.isFrozen(record) ||
    record.kind !==
      HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION_RECORD_KIND ||
    record.gateId !==
      privateHydrationClaimedReplayTargetDispatchExecutionGateId ||
    record.status !==
      privateHydrationClaimedReplayTargetDispatchExecutionStatus ||
    record.diagnosticOnly !== true ||
    record.readOnly !== true ||
    record.compatibilityClaimed !== false ||
    record.browserDomEventCompatibilityClaimed !== false ||
    record.publicRootBehaviorChanged !== false ||
    record.publicHydrationCompatibilityClaimed !== false ||
    record.publicHydrationReplayCompatibilityClaimed !== false ||
    record.publicHydrationTargetClaimed !== false ||
    record.publicHydrateRootSupported !== false ||
    record.publicDispatchEnabled !== false ||
    record.eventReplayInstalled !== false ||
    record.eventReplaySupported !== false ||
    record.hydrationReplaySupported !== false ||
    record.queueMutationAllowed !== false ||
    record.replayQueuesDrained !== false ||
    record.eventsReplayed !== false ||
    record.eventDispatch !== false ||
    record.willDispatch !== false ||
    record.willHydrate !== false ||
    record.willReplay !== false ||
    record.targetClaimAccepted !== true ||
    record.targetClaimExecuted !== false ||
    record.targetDispatchLinkAccepted !== true ||
    record.replayTargetDispatchExecutionRecorded !== true ||
    record.replayTargetDispatchExecutionBlocked !== true ||
    record.dispatchExecutionRecorded !== true ||
    record.dispatchExecutionBlocked !== true ||
    record.targetDispatchExecuted !== false ||
    record.eventReplayDispatchAttempted !== false ||
    record.pluginDispatchEventForPluginEventSystemCalled !== false ||
    record.nativeEventRedispatched !== false ||
    record.syntheticEventCreated !== false ||
    record.listenerInvocationCount !== 0 ||
    record.willInvokeListeners !== false ||
    record.hydrateInstanceCalled !== false ||
    record.hydrateTextInstanceCalled !== false ||
    record.replayQueueDrained !== false ||
    record.queued !== false ||
    record.recoverableErrorsQueued !== false ||
    record.onRecoverableErrorInvoked !== false ||
    record.publicOnRecoverableErrorInvoked !== false ||
    record.targetClaimingDiagnostic !==
      payload.targetClaimingDiagnostic ||
    record.targetDispatchLinkDiagnostic !==
      payload.targetDispatchLinkDiagnostic ||
    record.dispatchRecord !== payload.dispatchRecord ||
    record.markerRow !== payload.markerRow ||
    record.ownershipDiagnostics !== payload.ownershipDiagnostics ||
    record.ownershipRow !== payload.ownershipRow ||
    record.recoverableErrorMetadata !== payload.recoverableErrorMetadata ||
    record.clickReplayDispatchDiagnostic !==
      payload.clickReplayDispatchDiagnostic ||
    !isPrivateHydrationBoundaryRecord(payload.hydrationBoundaryRecord) ||
    payload.targetClaimingDiagnosticPayload === null ||
    payload.targetClaimingDiagnosticPayload === undefined ||
    payload.targetDispatchLinkPayload === null ||
    payload.targetDispatchLinkPayload === undefined ||
    payload.targetDispatchLinkPayload.dispatchRecord !==
      payload.dispatchRecord ||
    payload.targetDispatchLinkPayload.targetDispatchPathRecord !==
      record.targetDispatchPathRecord
  ) {
    throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
      'Hydration claimed replay target-dispatch execution requires canonical immutable private replay metadata.'
    );
  }

  if (
    record.clickReplayDispatchDiagnostic !== null &&
    (payload.clickReplayDispatchDiagnosticPayload === null ||
      payload.clickReplayDispatchDiagnosticPayload === undefined ||
      payload.clickReplayDispatchDiagnosticPayload
        .targetClaimingDiagnostic !== payload.targetClaimingDiagnostic ||
      payload.clickReplayDispatchDiagnosticPayload
        .targetDispatchLinkDiagnostic !==
        payload.targetDispatchLinkDiagnostic ||
      payload.clickReplayDispatchDiagnosticPayload.dispatchRecord !==
        payload.dispatchRecord ||
      record.clickReplayDispatchDiagnostic.publicDispatchEnabled !== false ||
      record.clickReplayDispatchDiagnostic.liveEventListenerInstalled !==
        false ||
      record.clickReplayDispatchDiagnostic.eventReplayInstalled !== false ||
      record.clickReplayDispatchDiagnostic.eventDispatch !== false ||
      record.clickReplayDispatchDiagnostic.targetDispatchExecuted !==
        false ||
      record.clickReplayDispatchDiagnostic
        .eventReplayDispatchAttempted !== false ||
      record.clickReplayDispatchDiagnostic.syntheticEventCreated !== false ||
      record.clickReplayDispatchDiagnostic.listenerInvocationCount !== 0 ||
      record.clickReplayDispatchDiagnostic.willInvokeListeners !== false)
  ) {
    throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
      'Hydration claimed replay target-dispatch execution requires blocked click replay dispatch metadata.'
    );
  }

  if (
    expectedEvidence.hydrationBoundaryRecord !== undefined &&
    payload.hydrationBoundaryRecord !==
      expectedEvidence.hydrationBoundaryRecord
  ) {
    throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
      'Hydration claimed replay target-dispatch execution must match the expected hydration boundary record.'
    );
  }
  if (
    expectedEvidence.targetClaimingDiagnostic !== undefined &&
    payload.targetClaimingDiagnostic !==
      expectedEvidence.targetClaimingDiagnostic
  ) {
    throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
      'Hydration claimed replay target-dispatch execution must match the expected target-claiming diagnostic.'
    );
  }
  if (
    expectedEvidence.targetDispatchLinkDiagnostic !== undefined &&
    payload.targetDispatchLinkDiagnostic !==
      expectedEvidence.targetDispatchLinkDiagnostic
  ) {
    throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
      'Hydration claimed replay target-dispatch execution must match the expected target-dispatch link.'
    );
  }
  if (
    expectedEvidence.dispatchRecord !== undefined &&
    payload.dispatchRecord !== expectedEvidence.dispatchRecord
  ) {
    throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
      'Hydration claimed replay target-dispatch execution must match the expected dispatch record.'
    );
  }

  return payload;
}

function createHydrationTextMismatchRecoverableErrorPreflightRecord(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics,
  recoverableErrorMetadata,
  options
) {
  const preflightOptions =
    normalizeHydrationTextMismatchRecoverableErrorPreflightOptions(options);
  const validation =
    validateHydrationTextMismatchRecoverableErrorPreflight(
      hydrationBoundaryRecord,
      acceptedBoundaryMetadataDiagnostics,
      recoverableErrorMetadata,
      preflightOptions
    );
  if (
    preflightOptions.source ===
    'private-hydrate-root-public-facade-recoverable-error-preflight'
  ) {
    rememberPrivateHydrateRootSourceLedgerRootBridgeModule();
  }
  const preflightId =
    preflightOptions.preflightId ||
    `${validation.hydrationBoundaryRecord.recordId}:recoverable-error-preflight`;
  const onRecoverableErrorOption =
    validation.recoverableErrorMetadata.onRecoverableErrorOption || null;
  const onRecoverableErrorConfigured =
    onRecoverableErrorOption !== null &&
    onRecoverableErrorOption.present === true;

  const preflightRecord = freezeRecord({
    kind: HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_RECORD_KIND,
    gateId: privateHydrationTextMismatchRecoverableErrorPreflightGateId,
    metadataId:
      privateHydrationTextMismatchRecoverableErrorPreflightMetadataId,
    status: privateHydrationTextMismatchRecoverableErrorPreflightStatus,
    preflightStatus:
      privateHydrationTextMismatchRecoverableErrorPreflightStatus,
    source: preflightOptions.source,
    operation:
      'hydration-text-mismatch-recoverable-error-preflight',
    preflightId,
    preflightSequence: preflightOptions.preflightSequence,
    privatePreflight: true,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    publicHydrationCompatibilityClaimed: false,
    publicHydrationReplayCompatibilityClaimed: false,
    publicHydrateRootSupported: false,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    publicRootCreated: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    rootErrorUpdatesScheduled: false,
    hydrationRequested: true,
    hydration: false,
    canHydrate: false,
    hydrationCompatibilityClaimed: false,
    hostInstanceHydrationAttempted: false,
    hydrateTextInstanceCalled: false,
    textPatched: false,
    boundaryCleared: false,
    suspenseHydrationScheduled: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    eventDispatch: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    eventsReplayed: false,
    replayQueuesDrained: false,
    recoverableErrorsQueued: false,
    willQueueRecoverableErrors: false,
    reportGlobalErrorInvoked: false,
    rootErrorsReported: false,
    exposesErrorValue: false,
    exposesHydrationTarget: false,
    exposesRootOptionCallback: false,
    blockedReason: HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON,
    rootRecordId: validation.hydrationBoundaryRecord.recordId,
    rootKind: validation.hydrationBoundaryRecord.rootKind,
    rootTag: validation.hydrationBoundaryRecord.rootTag,
    acceptedBoundaryMetadataConsumed: true,
    acceptedBoundaryMetadataDiagnostics:
      validation.acceptedBoundaryMetadataDiagnostics,
    acceptedBoundaryMetadataGateId:
      validation.acceptedBoundaryMetadataDiagnostics.gateId,
    acceptedBoundaryMetadataStatus:
      validation.acceptedBoundaryMetadataDiagnostics.status,
    acceptedBoundaryMetadataId:
      validation.acceptedBoundaryMetadataRow.metadataId,
    acceptedBoundaryMetadataRow: validation.acceptedBoundaryMetadataRow,
    acceptedBoundaryMetadataIdCount:
      validation.acceptedBoundaryMetadataDiagnostics.metadataIdCount,
    acceptedBoundaryMetadataIds:
      validation.acceptedBoundaryMetadataDiagnostics.metadataIds,
    sourceTextMismatchDiagnosticKind:
      validation.textMismatchDiagnostics.kind,
    sourceTextMismatchDiagnosticStatus:
      validation.textMismatchDiagnostics.status,
    sourceRecoverableErrorMetadataKind:
      validation.recoverableErrorMetadata.kind,
    sourceRecoverableErrorMetadataStatus:
      validation.recoverableErrorMetadata.status,
    recoverableErrorMetadata: validation.recoverableErrorMetadata,
    recoverableErrorMetadataAccepted: true,
    textMismatchRowCount: validation.mismatchRows.length,
    recoverableErrorMetadataCount:
      validation.recoverableErrorRows.length,
    queuedRecoverableErrorCount:
      validation.recoverableErrorMetadata.queuedRecoverableErrorCount,
    onRecoverableErrorInvocationCount: 0,
    wouldQueueRecoverableErrorCount:
      validation.recoverableErrorMetadata.wouldQueueRecoverableErrorCount,
    recoverableErrorRows: validation.recoverableErrorRows,
    rootOptionCallbackKey: 'onRecoverableError',
    rootOptionCallbackConfigured: onRecoverableErrorConfigured,
    rootOptionCallbackValueInfo:
      onRecoverableErrorOption === null
        ? null
        : onRecoverableErrorOption.callbackInfo,
    rootErrorChannel: 'onRecoverableError',
    onRecoverableErrorConfigured,
    callbackInvocationGateEnabled: false,
    callbackInvocationRecordCount: 0,
    callbackInvocationErrorCount: 0,
    callbackInvocationRecords: freezeArray([]),
    privateRootErrorCallbacksInvoked: false,
    privateOnRecoverableErrorInvoked: false,
    rootErrorCallbacksInvoked: false,
    onRecoverableErrorInvoked: false,
    publicRootErrorCallbacksInvoked: false,
    publicOnRecoverableErrorInvoked: false,
    rootErrorCallbackInvocationCount: 0,
    acceptedPrivateMetadataPreflight: true,
    queuedRecoverableErrorPreflight: false,
    callbackInvocationPreflight: false
  });

  hydrationTextMismatchRecoverableErrorPreflightPayloads.set(
    preflightRecord,
    freezeRecord({
      acceptedBoundaryMetadataDiagnostics:
        validation.acceptedBoundaryMetadataDiagnostics,
      acceptedBoundaryMetadataRow: validation.acceptedBoundaryMetadataRow,
      container: validation.container,
      hydrationBoundaryRecord: validation.hydrationBoundaryRecord,
      hydrationOptions: validation.hydrationOptions,
      initialChildren: validation.initialChildren,
      mismatchRows: validation.mismatchRows,
      options: preflightOptions.rawOptions,
      recoverableErrorMetadata: validation.recoverableErrorMetadata,
      recoverableErrorRows: validation.recoverableErrorRows,
      textMismatchDiagnostics: validation.textMismatchDiagnostics
    })
  );

  return preflightRecord;
}

function getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload(
  record
) {
  return (
    hydrationTextMismatchRecoverableErrorPreflightPayloads.get(record) ||
    null
  );
}

function isPrivateHydrationTextMismatchRecoverableErrorPreflightRecord(
  value
) {
  return hydrationTextMismatchRecoverableErrorPreflightPayloads.has(value);
}

function createHydrationTextMismatchRecoverableErrorRoutingExecutionRecord(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics,
  options
) {
  const executionOptions =
    normalizeHydrationTextMismatchRecoverableErrorRoutingExecutionOptions(
      options
    );
  const validation =
    validateHydrationTextMismatchRecoverableErrorRoutingExecution(
      hydrationBoundaryRecord,
      acceptedBoundaryMetadataDiagnostics,
      executionOptions
    );
  const rootOptionOwnershipRecord =
    createHydrationTextMismatchRecoverableErrorRoutingRootOptionOwnershipRecord(
      validation
    );
  const invocationResults = validation.recoverableErrorRows.map(
    (recoverableErrorRow, index) =>
      invokeHydrationTextMismatchRecoverableErrorRoutingCallbackRecord({
        callback: validation.callback,
        executionOptions,
        index,
        mismatchRow: validation.mismatchRows[index],
        recoverableErrorRow,
        rootOptionOwnershipRecord
      })
  );
  const callbackInvocationRecords = freezeArray(
    invocationResults.map((invocationResult) => invocationResult.record)
  );
  const callbackInvocationErrorCount = invocationResults.reduce(
    (count, invocationResult) =>
      invocationResult.callbackErrorCaptured === true ? count + 1 : count,
    0
  );

  const executionRecord = freezeRecord({
    kind:
      HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_ROUTING_EXECUTION_RECORD_KIND,
    gateId:
      privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId,
    metadataId:
      privateHydrationTextMismatchRecoverableErrorRoutingMetadataId,
    status:
      privateHydrationTextMismatchRecoverableErrorRoutingExecutionStatus,
    executionStatus:
      privateHydrationTextMismatchRecoverableErrorRoutingExecutionStatus,
    source: executionOptions.source,
    operation:
      'hydration-text-mismatch-recoverable-error-routing-execution',
    privateExecution: true,
    diagnosticOnly: false,
    readOnly: false,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    publicHydrationCompatibilityClaimed: false,
    publicHydrationReplayCompatibilityClaimed: false,
    publicHydrateRootSupported: false,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    publicRootCreated: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    rootErrorUpdatesScheduled: false,
    hydrationRequested: true,
    hydration: false,
    canHydrate: false,
    hydrationCompatibilityClaimed: false,
    hostInstanceHydrationAttempted: false,
    hydrateTextInstanceCalled: false,
    textPatched: false,
    boundaryCleared: false,
    suspenseHydrationScheduled: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    eventDispatch: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    eventsReplayed: false,
    replayQueuesDrained: false,
    reportGlobalErrorInvoked: false,
    rootErrorsReported: false,
    exposesErrorValue: false,
    exposesHydrationTarget: false,
    exposesRootOptionCallback: false,
    blockedReason: HYDRATION_TEXT_MISMATCH_BLOCKED_REASON,
    rootRecordId: validation.hydrationBoundaryRecord.recordId,
    rootKind: validation.hydrationBoundaryRecord.rootKind,
    rootTag: validation.hydrationBoundaryRecord.rootTag,
    acceptedBoundaryMetadataConsumed: true,
    acceptedBoundaryMetadataDiagnostics:
      validation.acceptedBoundaryMetadataDiagnostics,
    acceptedBoundaryMetadataGateId:
      validation.acceptedBoundaryMetadataDiagnostics.gateId,
    acceptedBoundaryMetadataStatus:
      validation.acceptedBoundaryMetadataDiagnostics.status,
    acceptedBoundaryMetadataId:
      validation.acceptedBoundaryMetadataRow.metadataId,
    acceptedBoundaryMetadataRow: validation.acceptedBoundaryMetadataRow,
    acceptedBoundaryMetadataIdCount:
      validation.acceptedBoundaryMetadataDiagnostics.metadataIdCount,
    acceptedBoundaryMetadataIds:
      validation.acceptedBoundaryMetadataDiagnostics.metadataIds,
    sourceTextMismatchDiagnosticKind:
      validation.textMismatchDiagnostics.kind,
    sourceTextMismatchDiagnosticStatus:
      validation.textMismatchDiagnostics.status,
    sourceRecoverableErrorMetadataKind:
      validation.recoverableErrorMetadata.kind,
    sourceRecoverableErrorMetadataStatus:
      validation.recoverableErrorMetadata.status,
    recoverableErrorMetadata: validation.recoverableErrorMetadata,
    recoverableErrorMetadataAccepted: true,
    textMismatchRowCount: validation.mismatchRows.length,
    recoverableErrorMetadataCount:
      validation.recoverableErrorRows.length,
    queuedRecoverableErrorCount:
      validation.recoverableErrorMetadata.queuedRecoverableErrorCount,
    wouldQueueRecoverableErrorCount:
      validation.recoverableErrorMetadata.wouldQueueRecoverableErrorCount,
    recoverableErrorsQueued: false,
    willQueueRecoverableErrors: false,
    rootOptionOwnershipStatus: rootOptionOwnershipRecord.status,
    rootOptionOwnershipRecord,
    rootOptionCallbackKey: 'onRecoverableError',
    rootOptionCallbackConfigured: true,
    rootOptionCallbackValueInfo:
      validation.rootOptionCallbackValueInfo,
    rootErrorChannel: 'onRecoverableError',
    onRecoverableErrorConfigured: true,
    callbackInvocationGateEnabled: true,
    callbackInvocationRecordCount: callbackInvocationRecords.length,
    callbackInvocationErrorCount,
    callbackInvocationRecords,
    onRecoverableErrorInvocationCount:
      callbackInvocationRecords.length,
    rootErrorCallbackInvocationCount:
      callbackInvocationRecords.length,
    privateRootErrorCallbacksInvoked:
      callbackInvocationRecords.length > 0,
    privateOnRecoverableErrorInvoked:
      callbackInvocationRecords.length > 0,
    rootErrorCallbacksInvoked: callbackInvocationRecords.length > 0,
    onRecoverableErrorInvoked: callbackInvocationRecords.length > 0,
    publicRootErrorCallbacksInvoked: false,
    publicOnRecoverableErrorInvoked: false
  });

  hydrationTextMismatchRecoverableErrorRoutingExecutionPayloads.set(
    executionRecord,
    freezeRecord({
      acceptedBoundaryMetadataDiagnostics:
        validation.acceptedBoundaryMetadataDiagnostics,
      acceptedBoundaryMetadataRow: validation.acceptedBoundaryMetadataRow,
      callback: validation.callback,
      callbackInvocationResults: freezeArray(
        invocationResults.map((invocationResult) => invocationResult.payload)
      ),
      container: validation.container,
      hydrationBoundaryRecord: validation.hydrationBoundaryRecord,
      hydrationOptions: validation.hydrationOptions,
      initialChildren: validation.initialChildren,
      mismatchRows: validation.mismatchRows,
      options: executionOptions.rawOptions,
      recoverableErrorMetadata: validation.recoverableErrorMetadata,
      recoverableErrorRows: validation.recoverableErrorRows,
      rootOptionOwnershipRecord,
      textMismatchDiagnostics: validation.textMismatchDiagnostics
    })
  );

  return executionRecord;
}

function getPrivateHydrationTextMismatchRecoverableErrorRoutingExecutionPayload(
  record
) {
  return (
    hydrationTextMismatchRecoverableErrorRoutingExecutionPayloads.get(
      record
    ) || null
  );
}

function isPrivateHydrationTextMismatchRecoverableErrorRoutingExecutionRecord(
  value
) {
  return hydrationTextMismatchRecoverableErrorRoutingExecutionPayloads.has(
    value
  );
}

function createHydrationRecoverableErrorBoundaryAdmissionRecord(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics,
  recoverableErrorPreflightRecord,
  targetClaimingDiagnostic,
  replayExecutionRecord,
  options
) {
  const admissionOptions =
    normalizeHydrationRecoverableErrorBoundaryAdmissionOptions(options);
  const validation = validateHydrationRecoverableErrorBoundaryAdmission(
    hydrationBoundaryRecord,
    acceptedBoundaryMetadataDiagnostics,
    recoverableErrorPreflightRecord,
    targetClaimingDiagnostic,
    replayExecutionRecord,
    admissionOptions
  );
  const row = freezeRecord({
    kind: 'FastReactDomHydrationRecoverableErrorBoundaryAdmissionRow',
    status: privateHydrationRecoverableErrorBoundaryAdmissionStatus,
    metadataId: privateHydrationRecoverableErrorBoundaryAdmissionMetadataId,
    rootRecordId: validation.hydrationBoundaryRecord.recordId,
    markerId: validation.targetClaimingDiagnostic.markerId,
    markerPath: validation.targetClaimingDiagnostic.markerPath,
    markerContractId: validation.targetClaimingDiagnostic.markerContractId,
    targetPath: validation.targetClaimingDiagnostic.targetPath,
    targetPathStatus: validation.targetClaimingDiagnostic.targetPathStatus,
    targetPathCurrent: validation.currentness.targetPathCurrent,
    markerPathCurrent: validation.currentness.markerPathCurrent,
    sourceRecoverableErrorMetadataKind:
      validation.recoverableErrorMetadata.kind,
    sourceRecoverableErrorMetadataStatus:
      validation.recoverableErrorMetadata.status,
    recoverableErrorMetadataAccepted: true,
    recoverableErrorMetadataCount:
      validation.recoverableErrorRows.length,
    queuedRecoverableErrorCount:
      validation.recoverableErrorMetadata.queuedRecoverableErrorCount,
    wouldQueueRecoverableErrorCount:
      validation.recoverableErrorMetadata.wouldQueueRecoverableErrorCount,
    queuedRecoverableError: false,
    recoverableErrorsQueued: false,
    onRecoverableErrorInvoked: false,
    publicOnRecoverableErrorInvoked: false,
    targetClaimAccepted: true,
    targetClaimExecuted: false,
    replayExecutionAccepted: true,
    replayBlockerCurrentnessAccepted: true,
    replayBlockerReportAccepted: true,
    replayBlockerReportCurrent: true,
    replayTargetDispatchExecutionBlocked: true,
    replayQueueDrained: false,
    eventsReplayed: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });
  const record = freezeRecord({
    kind: HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_RECORD_KIND,
    gateId: privateHydrationRecoverableErrorBoundaryAdmissionGateId,
    metadataId: privateHydrationRecoverableErrorBoundaryAdmissionMetadataId,
    status: privateHydrationRecoverableErrorBoundaryAdmissionStatus,
    admissionStatus: privateHydrationRecoverableErrorBoundaryAdmissionStatus,
    source: admissionOptions.source,
    operation: 'hydration-recoverable-error-boundary-admission',
    privateAdmission: true,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    publicHydrationCompatibilityClaimed: false,
    publicHydrationReplayCompatibilityClaimed: false,
    publicHydrateRootSupported: false,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    publicRootCreated: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    rootErrorUpdatesScheduled: false,
    hydrationRequested: true,
    hydration: false,
    canHydrate: false,
    hydrationCompatibilityClaimed: false,
    hostInstanceHydrationAttempted: false,
    hydrateTextInstanceCalled: false,
    textPatched: false,
    boundaryCleared: false,
    suspenseHydrationScheduled: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    eventDispatch: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    eventsReplayed: false,
    replayQueuesDrained: false,
    recoverableErrorsQueued: false,
    willQueueRecoverableErrors: false,
    reportGlobalErrorInvoked: false,
    rootErrorsReported: false,
    exposesErrorValue: false,
    exposesHydrationTarget: false,
    exposesRootOptionCallback: false,
    blockedReason: HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON,
    rootRecordId: validation.hydrationBoundaryRecord.recordId,
    rootKind: validation.hydrationBoundaryRecord.rootKind,
    rootTag: validation.hydrationBoundaryRecord.rootTag,
    acceptedBoundaryMetadataConsumed: true,
    acceptedBoundaryMetadataDiagnostics:
      validation.acceptedBoundaryMetadataDiagnostics,
    acceptedBoundaryMetadataGateId:
      validation.acceptedBoundaryMetadataDiagnostics.gateId,
    acceptedBoundaryMetadataStatus:
      validation.acceptedBoundaryMetadataDiagnostics.status,
    acceptedBoundaryMetadataId:
      validation.acceptedBoundaryMetadataRow.metadataId,
    acceptedBoundaryMetadataRow: validation.acceptedBoundaryMetadataRow,
    recoverableErrorPreflightRecord:
      validation.recoverableErrorPreflightRecord,
    recoverableErrorPreflightStatus:
      validation.recoverableErrorPreflightRecord.preflightStatus,
    recoverableErrorPreflightAccepted: true,
    targetClaimingDiagnostic: validation.targetClaimingDiagnostic,
    targetClaimingStatus: validation.targetClaimingDiagnostic.status,
    targetClaimAccepted: true,
    targetClaimExecuted: false,
    targetDispatchLinkDiagnostic:
      validation.replayExecutionPayload.targetDispatchLinkDiagnostic,
    targetDispatchLinkStatus:
      validation.replayExecutionPayload.targetDispatchLinkDiagnostic.status,
    replayExecutionRecord: validation.replayExecutionRecord,
    replayExecutionStatus: validation.replayExecutionRecord.status,
    replayExecutionAccepted: true,
    replayTargetDispatchExecutionRecorded: true,
    replayTargetDispatchExecutionBlocked: true,
    replayQueueDrained: false,
    sourceHydrateRootPreflightKind:
      validation.sourceLedger.hydrateRootPreflightRecord.kind,
    sourceHydrateRootPreflightStatus:
      validation.sourceLedger.hydrateRootPreflightRecord.preflightStatus,
    sourceEventReplayPreflightKind:
      validation.sourceLedger.eventReplayPreflightRecord.kind,
    sourceEventReplayPreflightStatus:
      validation.sourceLedger.eventReplayPreflightRecord.preflightStatus,
    sourceReplayBlockerCurrentnessKind:
      validation.sourceLedger.replayBlockerCurrentnessRecord.kind,
    sourceReplayBlockerCurrentnessStatus:
      validation.sourceLedger.replayBlockerCurrentnessRecord
        .currentnessStatus,
    sourceReplayBlockerCurrentnessId:
      validation.sourceLedger.replayBlockerCurrentnessRecord
        .replayBlockerCurrentnessId,
    replayBlockerCurrentness:
      validation.sourceLedger.replayBlockerCurrentnessRecord,
    replayBlockerCurrentnessAccepted: true,
    replayBlockerReport:
      validation.sourceLedger.replayBlockerCurrentnessRecord
        .eventReplayBlockers,
    replayBlockerReportAccepted: true,
    replayBlockerReportCurrent: true,
    replayBlockerReportSourceOwned: true,
    rootListenerReplayAliasRejected: true,
    rootListenerStateDoesNotProveReplay: true,
    sourceExecutionPreflightKind:
      validation.sourceLedger.executionPreflightRecord.kind,
    sourceExecutionPreflightStatus:
      validation.sourceLedger.executionPreflightRecord.preflightStatus,
    sourceLifecycleRequestBoundaryKind:
      validation.sourceLedger.lifecycleRequestBoundary.kind,
    sourceLifecycleRequestBoundaryStatus:
      validation.sourceLedger.lifecycleRequestBoundary.boundaryStatus,
    sourceLifecycleRequestBoundaryId:
      validation.sourceLedger.lifecycleRequestBoundary
        .lifecycleRequestBoundaryId,
    sourceLifecycleBoundarySourceOwned: true,
    sourceLifecycleBoundaryActive: true,
    sourceLifecycleBoundaryCurrent: true,
    sourceLifecycleContainerSnapshotOwned: true,
    sourceLifecycleContainerSnapshotCurrent:
      validation.sourceLedger.lifecycleContainerSnapshotCurrent,
    markerPathCurrent: validation.currentness.markerPathCurrent,
    markerPathCurrentStatus: validation.currentness.markerPathCurrentStatus,
    markerCurrentContractId: validation.currentness.markerContractId,
    targetPathCurrent: validation.currentness.targetPathCurrent,
    targetPathCurrentStatus: validation.currentness.targetPathCurrentStatus,
    targetPathResolvedToDispatchTarget:
      validation.currentness.targetPathResolvedToDispatchTarget,
    targetPathUniqueInContainer:
      validation.currentness.targetPathUniqueInContainer,
    targetPathParentChainRetained:
      validation.currentness.targetPathParentChainRetained,
    targetContainerMatchesBoundaryRecord:
      validation.currentness.targetContainerMatchesBoundaryRecord,
    hydratableLookupTargetPathRetained:
      validation.currentness.hydratableLookupTargetPathRetained,
    markerId: validation.targetClaimingDiagnostic.markerId,
    markerPath: validation.targetClaimingDiagnostic.markerPath,
    markerContractId: validation.targetClaimingDiagnostic.markerContractId,
    targetPath: validation.targetClaimingDiagnostic.targetPath,
    targetPathStatus: validation.targetClaimingDiagnostic.targetPathStatus,
    domEventName: validation.targetClaimingDiagnostic.domEventName,
    queueName: validation.targetClaimingDiagnostic.queueName,
    recoverableErrorMetadata: validation.recoverableErrorMetadata,
    recoverableErrorMetadataAccepted: true,
    recoverableErrorMetadataStatus:
      validation.recoverableErrorMetadata.status,
    recoverableErrorMetadataCount:
      validation.recoverableErrorRows.length,
    queuedRecoverableErrorCount:
      validation.recoverableErrorMetadata.queuedRecoverableErrorCount,
    wouldQueueRecoverableErrorCount:
      validation.recoverableErrorMetadata.wouldQueueRecoverableErrorCount,
    rootOptionCallbackKey: 'onRecoverableError',
    rootOptionCallbackConfigured:
      validation.recoverableErrorPreflightRecord
        .rootOptionCallbackConfigured,
    onRecoverableErrorConfigured:
      validation.recoverableErrorPreflightRecord
        .onRecoverableErrorConfigured,
    onRecoverableErrorInvoked: false,
    publicOnRecoverableErrorInvoked: false,
    callbackInvocationGateEnabled: false,
    callbackInvocationRecordCount: 0,
    rootErrorCallbackInvocationCount: 0,
    recoverableErrorBoundaryRow: row,
    recoverableErrorBoundaryRows: freezeArray([row]),
    recoverableErrorBoundaryRowCount: 1
  });

  hydrationRecoverableErrorBoundaryAdmissionPayloads.set(
    record,
    freezeRecord({
      acceptedBoundaryMetadataDiagnostics:
        validation.acceptedBoundaryMetadataDiagnostics,
      acceptedBoundaryMetadataRow: validation.acceptedBoundaryMetadataRow,
      container: validation.container,
      currentMarkerDiagnostics: validation.currentness.markerDiagnostics,
      currentTargetPathEvidence: validation.currentness.targetPathEvidence,
      hydrationBoundaryRecord: validation.hydrationBoundaryRecord,
      hydrationOptions: validation.hydrationOptions,
      initialChildren: validation.initialChildren,
      options: admissionOptions.rawOptions,
      recoverableErrorBoundaryRow: row,
      recoverableErrorMetadata: validation.recoverableErrorMetadata,
      recoverableErrorPreflightPayload:
        validation.recoverableErrorPreflightPayload,
      recoverableErrorPreflightRecord:
        validation.recoverableErrorPreflightRecord,
      recoverableErrorRows: validation.recoverableErrorRows,
      replayExecutionPayload: validation.replayExecutionPayload,
      replayExecutionRecord: validation.replayExecutionRecord,
      sourceLedger: validation.sourceLedger,
      targetClaimingDiagnostic: validation.targetClaimingDiagnostic,
      targetClaimingPayload: validation.targetClaimingPayload
    })
  );

  return record;
}

function getPrivateHydrationRecoverableErrorBoundaryAdmissionPayload(
  record
) {
  return (
    hydrationRecoverableErrorBoundaryAdmissionPayloads.get(record) ||
    null
  );
}

function isPrivateHydrationRecoverableErrorBoundaryAdmissionRecord(value) {
  return hydrationRecoverableErrorBoundaryAdmissionPayloads.has(value);
}

function createHydrationTextNodeClaimPatchExecutionRecord(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics,
  options
) {
  const executionOptions =
    normalizeHydrationTextNodeClaimPatchExecutionOptions(options);
  const validation = validateHydrationTextNodeClaimPatchExecution(
    hydrationBoundaryRecord,
    acceptedBoundaryMetadataDiagnostics,
    executionOptions
  );
  const patchResult = applyHydrationTextNodeClaimPatch(
    validation.claimedTextNode,
    validation.mismatchRow.expectedText
  );
  if (patchResult.patchApplied !== true) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch execution could not patch the fake text node.'
    );
  }

  const executionRecord = freezeRecord({
    kind: HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_RECORD_KIND,
    gateId: privateHydrationTextNodeClaimPatchExecutionGateId,
    metadataId: privateHydrationTextNodeClaimPatchMetadataId,
    status: privateHydrationTextNodeClaimPatchExecutionStatus,
    executionStatus: privateHydrationTextNodeClaimPatchExecutionStatus,
    source: executionOptions.source,
    operation: 'hydration-text-node-claim-patch-execution',
    privateExecution: true,
    diagnosticOnly: false,
    readOnly: false,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    publicHydrationCompatibilityClaimed: false,
    publicHydrationReplayCompatibilityClaimed: false,
    publicHydrateRootSupported: false,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    publicRootCreated: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    hydrationRequested: true,
    hydration: false,
    canHydrate: false,
    hydrationCompatibilityClaimed: false,
    hostInstanceHydrationAttempted: false,
    hydrateTextInstanceCalled: false,
    diffHydratedTextForDevWarningsCalled: false,
    boundaryCleared: false,
    suspenseHydrationScheduled: false,
    domMutation: false,
    browserDomMutated: false,
    fakeDomOnly: true,
    fakeDomMutation: true,
    fakeTextNodeClaimed: true,
    fakeTextNodePatched: true,
    textNodeClaimRecorded: true,
    textNodeClaimExecuted: true,
    textPatchAdmitted: true,
    textPatchApplied: true,
    textPatched: true,
    markerWrites: false,
    listenerInstallation: false,
    eventDispatch: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    eventsReplayed: false,
    replayQueuesDrained: false,
    recoverableErrorsQueued: false,
    willQueueRecoverableErrors: false,
    onRecoverableErrorInvoked: false,
    publicOnRecoverableErrorInvoked: false,
    blockedReason: HYDRATION_TEXT_MISMATCH_BLOCKED_REASON,
    rootRecordId: validation.hydrationBoundaryRecord.recordId,
    rootKind: validation.hydrationBoundaryRecord.rootKind,
    rootTag: validation.hydrationBoundaryRecord.rootTag,
    acceptedBoundaryMetadataConsumed: true,
    acceptedBoundaryMetadataDiagnostics:
      validation.acceptedBoundaryMetadataDiagnostics,
    acceptedBoundaryMetadataId:
      validation.acceptedBoundaryMetadataRow.metadataId,
    acceptedBoundaryMetadataRow: validation.acceptedBoundaryMetadataRow,
    sourceTextMismatchDiagnosticKind:
      validation.textMismatchDiagnostics.kind,
    sourceTextMismatchDiagnosticStatus:
      validation.textMismatchDiagnostics.status,
    sourceRecoverableErrorMetadataKind:
      validation.recoverableErrorMetadata.kind,
    sourceRecoverableErrorMetadataStatus:
      validation.recoverableErrorMetadata.status,
    recoverableErrorMetadata: validation.recoverableErrorMetadata,
    recoverableErrorMetadataAccepted: true,
    textMismatchRowCount: validation.mismatchRows.length,
    patchedTextMismatchRowCount: 1,
    textMismatchRow: validation.mismatchRow,
    textMismatchRowId: validation.mismatchRow.rowId,
    textMismatchReason: validation.mismatchRow.reason,
    expectedPath: validation.mismatchRow.expectedPath,
    actualPath: validation.mismatchRow.actualPath,
    expectedText: validation.mismatchRow.expectedText,
    actualTextBefore: patchResult.actualTextBefore,
    actualTextAfter: patchResult.actualTextAfter,
    normalizedExpectedText:
      validation.mismatchRow.normalizedExpectedText,
    normalizedActualTextBefore: patchResult.normalizedActualTextBefore,
    normalizedActualTextAfter: patchResult.normalizedActualTextAfter,
    exactTextMatchesBefore:
      patchResult.actualTextBefore === validation.mismatchRow.expectedText,
    exactTextMatchesAfter:
      patchResult.actualTextAfter === validation.mismatchRow.expectedText,
    normalizedTextMatchesBefore:
      patchResult.normalizedActualTextBefore ===
      validation.mismatchRow.normalizedExpectedText,
    normalizedTextMatchesAfter:
      patchResult.normalizedActualTextAfter ===
      validation.mismatchRow.normalizedExpectedText,
    claimedTextNodeInfo: validation.claimedTextNodeInfo,
    claimedTextNodePath: validation.claimedTextNodeResolution.path,
    claimedTextNodePathStatus: validation.claimedTextNodeResolution.status,
    claimedTextNodeParentPath: validation.claimedTextNodeResolution.parentPath,
    claimedTextNodeIndex: validation.claimedTextNodeResolution.index,
    claimedTextNodeSegmentCount:
      validation.claimedTextNodeResolution.segmentCount,
    fakeTextNodeMarkerAccepted: validation.fakeTextNodeMarkerAccepted,
    fakeTextNodeConstructorName:
      validation.fakeTextNodeConstructorName,
    patchWriteProperty: patchResult.patchWriteProperty,
    patchWriteCount: patchResult.patchWriteCount,
    patchWrites: patchResult.patchWrites,
    claimLabel: executionOptions.claimLabel
  });

  hydrationTextNodeClaimPatchExecutionPayloads.set(
    executionRecord,
    freezeRecord({
      acceptedBoundaryMetadataDiagnostics:
        validation.acceptedBoundaryMetadataDiagnostics,
      acceptedBoundaryMetadataRow: validation.acceptedBoundaryMetadataRow,
      claimedTextNode: validation.claimedTextNode,
      claimedTextNodeResolution: validation.claimedTextNodeResolution,
      container: validation.container,
      hydrationBoundaryRecord: validation.hydrationBoundaryRecord,
      hydrationOptions: validation.hydrationOptions,
      initialChildren: validation.initialChildren,
      mismatchRow: validation.mismatchRow,
      options: executionOptions.rawOptions,
      patchResult,
      recoverableErrorMetadata: validation.recoverableErrorMetadata,
      textMismatchDiagnostics: validation.textMismatchDiagnostics
    })
  );

  return executionRecord;
}

function getPrivateHydrationTextNodeClaimPatchExecutionPayload(record) {
  return hydrationTextNodeClaimPatchExecutionPayloads.get(record) || null;
}

function isPrivateHydrationTextNodeClaimPatchExecutionRecord(value) {
  return hydrationTextNodeClaimPatchExecutionPayloads.has(value);
}

function assertHydrationClaimedReplayTargetDispatchExecutionClaim(
  targetClaimingDiagnostic
) {
  const claimPayload =
    getPrivateHydrationTargetClaimingDiagnosticPayload(
      targetClaimingDiagnostic
    );
  if (
    !targetClaimingDiagnostic ||
    typeof targetClaimingDiagnostic !== 'object' ||
    targetClaimingDiagnostic.kind !==
      HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_KIND ||
    targetClaimingDiagnostic.status !==
      privateHydrationTargetClaimingMetadataStatus ||
    claimPayload === null ||
    !isPrivateHydrationBoundaryRecord(claimPayload.hydrationBoundaryRecord) ||
    claimPayload.targetDispatchLinkPayload === null ||
    claimPayload.targetDispatchLinkPayload === undefined ||
    targetClaimingDiagnostic.targetClaimExecuted !== false ||
    targetClaimingDiagnostic.publicHydrationTargetClaimed !== false ||
    targetClaimingDiagnostic.willDispatch !== false ||
    targetClaimingDiagnostic.willHydrate !== false ||
    targetClaimingDiagnostic.willReplay !== false
  ) {
    throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
      'Hydration claimed replay target-dispatch execution requires an accepted private hydration target-claiming diagnostic.'
    );
  }

  return {
    claimPayload,
    hydrationBoundaryRecord: claimPayload.hydrationBoundaryRecord,
    markerRow: claimPayload.markerRow,
    ownershipDiagnostics: claimPayload.ownershipDiagnostics,
    ownershipRow: claimPayload.ownershipRow
  };
}

function assertHydrationClaimedReplayTargetDispatchExecutionLink(
  claimValidation,
  targetDispatchLink,
  targetDispatchLinkPayload
) {
  const claimPayload = claimValidation.claimPayload;
  const claimedTargetDispatchLink =
    claimPayload.targetDispatchLinkDiagnostic;

  if (
    targetDispatchLink !== claimedTargetDispatchLink ||
    targetDispatchLinkPayload !== claimPayload.targetDispatchLinkPayload ||
    targetDispatchLink.replayQueueEntry !==
      targetDispatchLinkPayload.replayQueueEntry ||
    targetDispatchLink.hydratableEventTargetLookup !==
      targetDispatchLinkPayload.hydratableEventTargetLookup ||
    targetDispatchLink.inputOrder !== claimPayload.ownershipRow.inputOrder ||
    targetDispatchLink.targetPath !==
      claimPayload.ownershipRow.eventQueueTargetPath ||
    targetDispatchLink.targetPath !==
      claimPayload.ownershipRow.drainOrderTargetPath ||
    targetDispatchLink.dehydratedBoundaryOwnerId !==
      claimPayload.ownershipRow.eventQueueDehydratedBoundaryOwnerId ||
    targetDispatchLink.dehydratedBoundaryOwnerId !==
      claimPayload.ownershipRow.drainOrderDehydratedBoundaryOwnerId
  ) {
    throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
      'Hydration claimed replay target-dispatch execution rejects stale or mismatched target-dispatch links.'
    );
  }
}

function assertHydrationClaimedReplayTargetDispatchExecutionDispatchBlocked(
  dispatchRecord,
  targetDispatchLink
) {
  if (
    !dispatchRecord ||
    typeof dispatchRecord !== 'object' ||
    dispatchRecord.status !== 'blocked' ||
    dispatchRecord.blockedReason !== EVENT_DISPATCH_BLOCKED_CODE ||
    dispatchRecord.targetResolutionStatus !== 'blocked' ||
    dispatchRecord.targetResolutionBlockedReason !==
      EVENT_TARGET_RESOLUTION_BLOCKED_CODE ||
    targetDispatchLink.eventDispatch !== false ||
    targetDispatchLink.publicDispatchEnabled !== false ||
    targetDispatchLink.willDispatch !== false ||
    targetDispatchLink.willHydrate !== false ||
    targetDispatchLink.willReplay !== false ||
    targetDispatchLink.replayQueueDrained !== false ||
    !targetDispatchLink.dispatchBlockerMetadata ||
    targetDispatchLink.dispatchBlockerMetadata.eventDispatch !== false ||
    targetDispatchLink.dispatchBlockerMetadata.publicDispatchEnabled !==
      false ||
    targetDispatchLink.dispatchBlockerMetadata.willInvokeListeners !== false
  ) {
    throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
      'Hydration claimed replay target-dispatch execution requires a blocked private dispatch record.'
    );
  }
}

function assertHydrationTargetClaimingDispatchLink(targetDispatchLink) {
  if (
    targetDispatchLink &&
    typeof targetDispatchLink === 'object' &&
    targetDispatchLink.kind ===
      HYDRATION_REPLAY_TARGET_DISPATCH_LINK_DIAGNOSTIC_KIND &&
    targetDispatchLink.status ===
      PRIVATE_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_STATUS &&
    targetDispatchLink.compatibilityClaimed === false &&
    targetDispatchLink.browserDomEventCompatibilityClaimed === false &&
    targetDispatchLink.publicRootBehaviorChanged === false &&
    targetDispatchLink.eventDispatch === false &&
    targetDispatchLink.publicDispatchEnabled === false &&
    targetDispatchLink.queueMutationAllowed === false &&
    targetDispatchLink.replayQueuesDrained === false &&
    targetDispatchLink.willDispatch === false &&
    targetDispatchLink.willHydrate === false &&
    targetDispatchLink.willReplay === false &&
    getPluginHydrationReplayTargetDispatchLinkDiagnosticPayload(
      targetDispatchLink
    ) !== null
  ) {
    return targetDispatchLink;
  }

  throwInvalidHydrationTargetClaimingDiagnostic(
    'Hydration target claiming requires a private hydration replay target-dispatch link diagnostic.'
  );
}

function resolveHydrationTargetClaimingOwnershipRow(
  hydrationBoundaryRecord,
  ownershipDiagnostics,
  targetDispatchLink,
  targetDispatchLinkPayload
) {
  const ownershipPayload = assertHydrationTargetClaimingOwnershipDiagnostics(
    hydrationBoundaryRecord,
    ownershipDiagnostics,
    targetDispatchLinkPayload
  );
  const ownershipRows = Array.isArray(ownershipDiagnostics.ownershipRows)
    ? ownershipDiagnostics.ownershipRows
    : [];
  const ownershipRow =
    ownershipRows.find(
      (row) =>
        row &&
        row.kind === HYDRATION_REPLAY_OWNERSHIP_GATE_ENTRY_RECORD_KIND &&
        row.inputOrder === targetDispatchLink.inputOrder &&
        row.eventQueueTargetPath === targetDispatchLink.targetPath &&
        row.drainOrderTargetPath === targetDispatchLink.targetPath &&
        row.eventQueueDehydratedBoundaryOwnerId ===
          targetDispatchLink.dehydratedBoundaryOwnerId &&
        row.drainOrderDehydratedBoundaryOwnerId ===
          targetDispatchLink.dehydratedBoundaryOwnerId
    ) || null;

  if (
    ownershipRow === null ||
    ownershipRow.ownershipRetainedThroughDrainOrder !== true ||
    ownershipRow.dehydratedBoundaryOwnershipRequired !== true ||
    ownershipRow.dehydratedBoundaryOwnershipRetained !== true ||
    ownershipRow.rootOwnershipRetained !== true ||
    ownershipRow.targetPathRetained !== true ||
    ownershipRow.queueIdentityRetained !== true ||
    ownershipRow.blockedOwnerRetained !== true
  ) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming requires a retained dehydrated boundary ownership row.'
    );
  }

  if (!ownershipPayload.ownershipRows.includes(ownershipRow)) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming requires a private ownership row from the accepted replay queue payload.'
    );
  }

  return ownershipRow;
}

function assertHydrationTargetClaimingOwnershipDiagnostics(
  hydrationBoundaryRecord,
  ownershipDiagnostics,
  targetDispatchLinkPayload
) {
  const ownershipPayload =
    hydrationReplayOwnershipGateDiagnosticPayloads.get(ownershipDiagnostics) ||
    null;
  if (
    !ownershipDiagnostics ||
    typeof ownershipDiagnostics !== 'object' ||
    ownershipPayload === null ||
    ownershipDiagnostics.kind !==
      HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND ||
    ownershipDiagnostics.rootRecordId !== hydrationBoundaryRecord.recordId ||
    ownershipDiagnostics.rootKind !== hydrationBoundaryRecord.rootKind ||
    ownershipDiagnostics.rootTag !== hydrationBoundaryRecord.rootTag ||
    ownershipDiagnostics.eventReplayQueueDiagnosticsAccepted !== true ||
    ownershipDiagnostics.targetResolutionDiagnosticsAccepted !== true ||
    ownershipDiagnostics.drainOrderDiagnosticsAccepted !== true ||
    ownershipDiagnostics.compatibilityClaimed !== false ||
    ownershipDiagnostics.browserDomEventCompatibilityClaimed !== false ||
    ownershipDiagnostics.publicRootBehaviorChanged !== false ||
    ownershipDiagnostics.eventReplaySupported !== false ||
    ownershipDiagnostics.hydrationReplaySupported !== false ||
    ownershipDiagnostics.queueMutationAllowed !== false ||
    ownershipDiagnostics.replayQueuesDrained !== false ||
    ownershipDiagnostics.eventsReplayed !== false ||
    targetDispatchLinkPayload === null ||
    targetDispatchLinkPayload === undefined ||
    ownershipDiagnostics.eventReplayQueueDiagnostics !==
      ownershipPayload.eventReplayQueueDiagnostics ||
    ownershipDiagnostics.ownershipRows !== ownershipPayload.ownershipRows ||
    !doesHydrationTargetClaimingOwnershipPayloadContainReplayEntry(
      ownershipPayload,
      targetDispatchLinkPayload.replayQueueEntry
    )
  ) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming requires accepted private replay ownership diagnostics for the same boundary record.'
    );
  }

  return ownershipPayload;
}

function doesHydrationTargetClaimingOwnershipPayloadContainReplayEntry(
  ownershipPayload,
  replayQueueEntry
) {
  if (
    !replayQueueEntry ||
    typeof replayQueueEntry !== 'object' ||
    !Array.isArray(ownershipPayload.blockedTargets)
  ) {
    return false;
  }

  return ownershipPayload.blockedTargets.some(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      entry.kind === replayQueueEntry.kind &&
      entry.inputOrder === replayQueueEntry.inputOrder &&
      entry.replayQueueOrder === replayQueueEntry.replayQueueOrder &&
      entry.prioritySortKey === replayQueueEntry.prioritySortKey &&
      entry.domEventName === replayQueueEntry.domEventName &&
      entry.queueName === replayQueueEntry.queueName &&
      entry.queueCategory === replayQueueEntry.queueCategory &&
      entry.targetPath === replayQueueEntry.targetPath &&
      entry.targetPathStatus === replayQueueEntry.targetPathStatus &&
      entry.dehydratedBoundaryOwnerId ===
        replayQueueEntry.dehydratedBoundaryOwnerId &&
      entry.dehydratedBoundaryOwnerPath ===
        replayQueueEntry.dehydratedBoundaryOwnerPath &&
      entry.blockedOnKind === replayQueueEntry.blockedOnKind &&
      entry.blockedOnStatus === replayQueueEntry.blockedOnStatus
  );
}

function resolveHydrationTargetClaimingMarkerRow(
  hydrationBoundaryRecord,
  targetDispatchLink,
  options
) {
  const markerRows = Array.isArray(
    hydrationBoundaryRecord.markerDiagnostics.markers
  )
    ? hydrationBoundaryRecord.markerDiagnostics.markers
    : [];
  const requestedMarker =
    options.markerRow === undefined ? null : options.markerRow;
  const boundaryOwner = targetDispatchLink.dehydratedBoundaryOwner;
  const markerRow =
    requestedMarker === null
      ? markerRows.find(
          (row) =>
            row.path === boundaryOwner.path &&
            row.contractId === boundaryOwner.contractId
        ) || null
      : requestedMarker;

  if (
    markerRow === null ||
    !markerRows.includes(markerRow) ||
    markerRow.path !== boundaryOwner.path ||
    markerRow.contractId !== boundaryOwner.contractId ||
    markerRow.kind !== boundaryOwner.markerKind
  ) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming rejects stale or mismatched marker rows.'
    );
  }

  return markerRow;
}

function resolveSupportedHydrationTargetClaimingPath(path) {
  const segments = parseHydrationTargetClaimingPathSegments(path);
  if (segments === null || segments.length === 0) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming supports only root-container child target paths.'
    );
  }
  const parentSegments = segments.slice(0, -1);
  const parentPath = createHydrationTargetClaimingPathFromSegments(
    parentSegments
  );

  return freezeRecord({
    path,
    parentPath,
    index: segments[segments.length - 1],
    rootIndex: segments[0],
    segmentCount: segments.length,
    segments: freezeArray(segments)
  });
}

function resolveHydrationTargetClaimingPathEvidence(
  hydrationBoundaryRecordPayload,
  targetDispatchLink,
  targetDispatchLinkPayload,
  targetPathRecord
) {
  const container =
    hydrationBoundaryRecordPayload &&
    typeof hydrationBoundaryRecordPayload === 'object'
      ? hydrationBoundaryRecordPayload.container
      : null;
  const dispatchRecord =
    targetDispatchLinkPayload &&
    typeof targetDispatchLinkPayload === 'object'
      ? targetDispatchLinkPayload.dispatchRecord
      : null;
  const hydratableEventTargetLookup =
    targetDispatchLinkPayload &&
    typeof targetDispatchLinkPayload === 'object'
      ? targetDispatchLinkPayload.hydratableEventTargetLookup
      : null;
  const expectedTarget =
    dispatchRecord && typeof dispatchRecord === 'object'
      ? dispatchRecord.nativeEventTarget
      : null;
  const targetPathResolution =
    container === null
      ? null
      : resolveHydrationContainerNodePath(
          container,
          targetDispatchLink.targetPath
        );
  const matchedPaths =
    container === null ||
    expectedTarget === null ||
    typeof expectedTarget !== 'object'
      ? []
      : collectHydrationTargetClaimingNodePaths(
          container,
          expectedTarget,
          2
        );
  const resolvedToDispatchTarget =
    targetPathResolution !== null &&
    targetPathResolution.status === 'resolved' &&
    targetPathResolution.resolvedPath === targetDispatchLink.targetPath &&
    targetPathResolution.node === expectedTarget;
  const parentChainRetained =
    targetPathResolution !== null &&
    doesHydrationTargetClaimingParentChainMatchResolution(
      container,
      targetPathResolution
    );
  const uniqueInContainer =
    matchedPaths.length === 1 && matchedPaths[0] === targetDispatchLink.targetPath;
  const containerMatchesBoundaryRecord =
    dispatchRecord !== null && dispatchRecord.targetContainer === container;
  const hydratableLookupTargetPathRetained =
    hydratableEventTargetLookup !== null &&
    typeof hydratableEventTargetLookup === 'object' &&
    hydratableEventTargetLookup.targetPath === targetDispatchLink.targetPath &&
    hydratableEventTargetLookup.targetPathStatus ===
      targetDispatchLink.targetPathStatus &&
    hydratableEventTargetLookup.dehydratedBoundaryOwnerId ===
      targetDispatchLink.dehydratedBoundaryOwnerId;
  const deterministicallySelected =
    resolvedToDispatchTarget &&
    parentChainRetained &&
    uniqueInContainer &&
    containerMatchesBoundaryRecord &&
    hydratableLookupTargetPathRetained &&
    targetDispatchLink.targetContainerMatchesRoot === true &&
    targetDispatchLink.targetWithinRootContainer === true &&
    targetDispatchLink.targetPathStatus === 'found-in-container-child-list' &&
    targetPathRecord.path === targetDispatchLink.targetPath;

  if (!deterministicallySelected) {
    throwInvalidHydrationTargetClaimingDiagnostic(
      'Hydration target claiming rejects stale, external, or ambiguous target paths.'
    );
  }

  return freezeRecord({
    deterministicallySelected,
    containerMatchesBoundaryRecord,
    hydratableLookupTargetPathRetained,
    matchCount: matchedPaths.length,
    matchedPaths: freezeArray(matchedPaths),
    parentChainRetained,
    resolutionStatus: targetPathResolution.status,
    resolvedPath: targetPathResolution.resolvedPath,
    resolvedToDispatchTarget,
    targetPathRecord,
    targetPathResolution,
    uniqueInContainer
  });
}

function collectHydrationTargetClaimingNodePaths(
  container,
  targetNode,
  maxPathCount
) {
  const paths = [];
  const visitedNodes = new Set();
  collectHydrationTargetClaimingNodePathsFromChildren(
    container,
    'container',
    targetNode,
    visitedNodes,
    paths,
    maxPathCount
  );
  return paths;
}

function collectHydrationTargetClaimingNodePathsFromChildren(
  parentNode,
  parentPath,
  targetNode,
  visitedNodes,
  paths,
  maxPathCount
) {
  if (
    paths.length >= maxPathCount ||
    !isHydrationTargetClaimingObjectLike(parentNode)
  ) {
    return;
  }

  if (visitedNodes.has(parentNode)) {
    return;
  }
  visitedNodes.add(parentNode);

  const childNodes =
    getHydrationTargetClaimingChildNodesSnapshot(parentNode);
  for (let index = 0; index < childNodes.length; index++) {
    const childNode = childNodes[index];
    if (!isHydrationTargetClaimingObjectLike(childNode)) {
      continue;
    }

    const childPath = `${parentPath}.childNodes[${index}]`;
    if (childNode === targetNode) {
      paths.push(childPath);
      if (paths.length >= maxPathCount) {
        return;
      }
    }

    collectHydrationTargetClaimingNodePathsFromChildren(
      childNode,
      childPath,
      targetNode,
      visitedNodes,
      paths,
      maxPathCount
    );
    if (paths.length >= maxPathCount) {
      return;
    }
  }
}

function doesHydrationTargetClaimingParentChainMatchResolution(
  container,
  targetPathResolution
) {
  if (
    targetPathResolution === null ||
    targetPathResolution.node === null ||
    targetPathResolution.parentNode === null ||
    targetPathResolution.node.parentNode !== targetPathResolution.parentNode
  ) {
    return false;
  }

  let currentNode = targetPathResolution.node;
  const visitedNodes = new Set();
  while (isHydrationTargetClaimingObjectLike(currentNode)) {
    if (currentNode === container) {
      return true;
    }
    if (visitedNodes.has(currentNode)) {
      return false;
    }
    visitedNodes.add(currentNode);
    currentNode = isHydrationTargetClaimingObjectLike(currentNode.parentNode)
      ? currentNode.parentNode
      : null;
  }

  return false;
}

function getHydrationTargetClaimingChildNodesSnapshot(node) {
  if (!isHydrationTargetClaimingObjectLike(node)) {
    return [];
  }

  const childNodes = node.childNodes;
  if (Array.isArray(childNodes)) {
    return childNodes.slice();
  }
  if (
    isHydrationTargetClaimingObjectLike(childNodes) &&
    Number.isSafeInteger(childNodes.length) &&
    childNodes.length >= 0
  ) {
    const snapshot = [];
    for (let index = 0; index < childNodes.length; index++) {
      snapshot.push(childNodes[index]);
    }
    return snapshot;
  }

  return [];
}

function parseHydrationTargetClaimingPathSegments(path) {
  if (typeof path !== 'string' || !path.startsWith('container')) {
    return null;
  }

  const suffix = path.slice('container'.length);
  if (suffix === '') {
    return [];
  }

  const segments = [];
  const pathPattern = /\.childNodes\[(\d+)\]/g;
  let offset = 0;
  let match;
  while ((match = pathPattern.exec(suffix)) !== null) {
    if (match.index !== offset) {
      return null;
    }
    segments.push(Number(match[1]));
    offset = match.index + match[0].length;
  }

  return offset === suffix.length ? segments : null;
}

function createHydrationTargetClaimingPathFromSegments(segments) {
  let path = 'container';
  for (const segment of segments) {
    path += `.childNodes[${segment}]`;
  }
  return path;
}

function compareHydrationTargetClaimingPathRecords(a, b) {
  const length = Math.min(a.segments.length, b.segments.length);
  for (let index = 0; index < length; index++) {
    if (a.segments[index] !== b.segments[index]) {
      return a.segments[index] - b.segments[index];
    }
  }
  return a.segments.length - b.segments.length;
}

function isHydrationTargetClaimingObjectLike(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function isSupportedHydrationTargetClaimingBoundaryKind(boundaryKind) {
  return (
    boundaryKind === 'activity-boundary' ||
    boundaryKind === 'suspense-boundary'
  );
}

function findHydrationTargetClaimingReplayTargetCandidate(
  hydrationBoundaryRecord,
  markerRow
) {
  const candidates = Array.isArray(
    hydrationBoundaryRecord.replayQueueDiagnostics
      .markerReplayTargetCandidates
  )
    ? hydrationBoundaryRecord.replayQueueDiagnostics
        .markerReplayTargetCandidates
    : [];

  return (
    candidates.find(
      (candidate) =>
        candidate.path === markerRow.path &&
        candidate.contractId === markerRow.contractId
    ) || null
  );
}

function throwInvalidHydrationTargetClaimingDiagnostic(message) {
  const error = new Error(message);
  error.code = INVALID_HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_CODE;
  throw error;
}

function throwInvalidHydrationClaimedReplayTargetDispatchExecutionRecord(
  message
) {
  const error = new Error(message);
  error.code =
    INVALID_HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION_CODE;
  throw error;
}

function normalizeHydrationTextNodeClaimPatchExecutionOptions(options) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};
  const hasHydrationOptions = Object.prototype.hasOwnProperty.call(
    normalizedOptions,
    'hydrationOptions'
  );

  return freezeRecord({
    enableTextNodeClaimPatchExecution:
      normalizedOptions.enableTextNodeClaimPatchExecution === true,
    claimLabel:
      typeof normalizedOptions.claimLabel === 'string'
        ? normalizedOptions.claimLabel
        : null,
    hasHydrationOptions,
    hydrationOptions: hasHydrationOptions
      ? normalizedOptions.hydrationOptions
      : undefined,
    mismatchRow: normalizedOptions.mismatchRow,
    rawOptions: options,
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-text-node-claim-patch-execution'
  });
}

function validateHydrationTextNodeClaimPatchExecution(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics,
  executionOptions
) {
  const record = assertPrivateHydrationBoundaryRecord(
    hydrationBoundaryRecord
  );
  const payload = getPrivateHydrationBoundaryRecordPayload(record);
  if (executionOptions.enableTextNodeClaimPatchExecution !== true) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch execution requires the explicit private execution gate.'
    );
  }
  if (
    executionOptions.hasHydrationOptions === true &&
    executionOptions.hydrationOptions !== payload.hydrationOptions
  ) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch execution requires the current hydrateRoot options object.'
    );
  }

  const acceptedBoundaryMetadataRow =
    validateHydrationTextNodeClaimPatchAcceptedBoundaryMetadata(
      record,
      acceptedBoundaryMetadataDiagnostics
    );
  const textMismatchDiagnostics = record.textMismatchDiagnostics;
  const recoverableErrorMetadata = record.recoverableErrorMetadata;
  validateHydrationTextNodeClaimPatchMismatchMetadata(
    record,
    textMismatchDiagnostics,
    recoverableErrorMetadata
  );

  const mismatchRows = Array.isArray(textMismatchDiagnostics.mismatchRows)
    ? textMismatchDiagnostics.mismatchRows
    : [];
  const mismatchRow = resolveHydrationTextNodeClaimPatchMismatchRow(
    mismatchRows,
    executionOptions.mismatchRow
  );
  const claimedTextNodeResolution = resolveHydrationContainerNodePath(
    payload.container,
    mismatchRow.actualPath
  );
  const claimedTextNode =
    claimedTextNodeResolution === null
      ? null
      : claimedTextNodeResolution.node;
  validateHydrationTextNodeClaimPatchTarget(
    mismatchRow,
    claimedTextNodeResolution,
    claimedTextNode
  );

  return {
    acceptedBoundaryMetadataDiagnostics,
    acceptedBoundaryMetadataRow,
    claimedTextNode,
    claimedTextNodeInfo: freezeRecord({
      nodeName:
        claimedTextNode && claimedTextNode.nodeName
          ? String(claimedTextNode.nodeName)
          : null,
      nodeType:
        claimedTextNode && typeof claimedTextNode.nodeType === 'number'
          ? claimedTextNode.nodeType
          : null
    }),
    claimedTextNodeResolution,
    container: payload.container,
    fakeTextNodeConstructorName:
      getHydrationTextNodeConstructorName(claimedTextNode),
    fakeTextNodeMarkerAccepted:
      isPrivateFakeHydrationTextNode(claimedTextNode),
    hydrationBoundaryRecord: record,
    hydrationOptions: payload.hydrationOptions,
    initialChildren: payload.initialChildren,
    mismatchRow,
    mismatchRows: freezeArray(mismatchRows),
    recoverableErrorMetadata,
    textMismatchDiagnostics
  };
}

function validateHydrationTextNodeClaimPatchAcceptedBoundaryMetadata(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics
) {
  if (
    acceptedBoundaryMetadataDiagnostics !==
      hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics ||
    !acceptedBoundaryMetadataDiagnostics ||
    typeof acceptedBoundaryMetadataDiagnostics !== 'object' ||
    acceptedBoundaryMetadataDiagnostics.kind !==
      HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND ||
    acceptedBoundaryMetadataDiagnostics.gateId !==
      privateHydrationBoundaryAcceptedMetadataGateId ||
    acceptedBoundaryMetadataDiagnostics.status !==
      privateHydrationBoundaryAcceptedMetadataStatus ||
    acceptedBoundaryMetadataDiagnostics.rootRecordId !==
      hydrationBoundaryRecord.recordId ||
    acceptedBoundaryMetadataDiagnostics.compatibilityClaimed !== false ||
    acceptedBoundaryMetadataDiagnostics.publicHydrationCompatibilityClaimed !==
      false ||
    acceptedBoundaryMetadataDiagnostics
      .publicHydrationReplayCompatibilityClaimed !== false ||
    acceptedBoundaryMetadataDiagnostics.publicRootRenderCompatibilityClaimed !==
      false
  ) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch execution requires accepted boundary metadata for the same hydration record.'
    );
  }

  const metadataRows = Array.isArray(
    acceptedBoundaryMetadataDiagnostics.metadataRows
  )
    ? acceptedBoundaryMetadataDiagnostics.metadataRows
    : [];
  const acceptedBoundaryMetadataRow =
    metadataRows.find(
      (row) =>
        row.metadataId ===
        privateHydrationTextMismatchRecoverableErrorRoutingMetadataId
    ) || null;

  if (
    acceptedBoundaryMetadataRow === null ||
    acceptedBoundaryMetadataRow.category !== 'hydration' ||
    acceptedBoundaryMetadataRow.gateId !==
      privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId ||
    acceptedBoundaryMetadataRow.recordType !==
      HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND ||
    acceptedBoundaryMetadataRow.acceptedStatus !==
      'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded' ||
    acceptedBoundaryMetadataRow.blockedReason !==
      HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON ||
    acceptedBoundaryMetadataRow.metadataRecognized !== true ||
    acceptedBoundaryMetadataRow.compatibilityClaimed !== false ||
    acceptedBoundaryMetadataRow.publicHydrationCompatibilityClaimed !==
      false ||
    acceptedBoundaryMetadataRow.promotesHydration !== false ||
    acceptedBoundaryMetadataRow.promotesRootRender !== false
  ) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch execution requires accepted text mismatch boundary metadata.'
    );
  }

  return acceptedBoundaryMetadataRow;
}

function validateHydrationTextNodeClaimPatchMismatchMetadata(
  hydrationBoundaryRecord,
  textMismatchDiagnostics,
  recoverableErrorMetadata
) {
  if (
    !textMismatchDiagnostics ||
    typeof textMismatchDiagnostics !== 'object' ||
    textMismatchDiagnostics.kind !== HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND ||
    textMismatchDiagnostics.status !==
      'blocked-hydration-text-mismatches-recorded' ||
    textMismatchDiagnostics.blockedReason !==
      HYDRATION_TEXT_MISMATCH_BLOCKED_REASON ||
    textMismatchDiagnostics.recoverableErrorsQueued !== false ||
    textMismatchDiagnostics.onRecoverableErrorInvoked !== false ||
    textMismatchDiagnostics.publicRootCreated !== false ||
    textMismatchDiagnostics.domMutated !== false ||
    textMismatchDiagnostics.textPatched !== false ||
    textMismatchDiagnostics.boundaryCleared !== false
  ) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch execution requires accepted blocked text mismatch diagnostics.'
    );
  }
  if (
    !recoverableErrorMetadata ||
    typeof recoverableErrorMetadata !== 'object' ||
    recoverableErrorMetadata.kind !==
      HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND ||
    recoverableErrorMetadata.status !==
      'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded' ||
    recoverableErrorMetadata.blockedReason !==
      HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON ||
    recoverableErrorMetadata.recoverableErrorsQueued !== false ||
    recoverableErrorMetadata.onRecoverableErrorInvoked !== false ||
    recoverableErrorMetadata.publicRootCreated !== false ||
    recoverableErrorMetadata.hydratingPublicRoot !== false ||
    recoverableErrorMetadata.domMutated !== false
  ) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch execution requires blocked recoverable-error metadata.'
    );
  }
  if (
    recoverableErrorMetadata !==
      hydrationBoundaryRecord.recoverableErrorMetadata ||
    textMismatchDiagnostics !==
      hydrationBoundaryRecord.textMismatchDiagnostics ||
    textMismatchDiagnostics.recoverableErrorMetadata !==
      recoverableErrorMetadata ||
    recoverableErrorMetadata.rootRecordId !==
      hydrationBoundaryRecord.recordId ||
    textMismatchDiagnostics.rootRecordId !== hydrationBoundaryRecord.recordId
  ) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch metadata must match the hydration boundary record.'
    );
  }
}

function resolveHydrationTextNodeClaimPatchMismatchRow(
  mismatchRows,
  requestedMismatchRow
) {
  const row =
    requestedMismatchRow === undefined
      ? mismatchRows.find(isHydrationTextNodeClaimPatchableMismatchRow) ||
        null
      : requestedMismatchRow;

  if (
    row === null ||
    !mismatchRows.includes(row) ||
    !isHydrationTextNodeClaimPatchableMismatchRow(row)
  ) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch execution requires one patchable text-content mismatch row.'
    );
  }

  return row;
}

function isHydrationTextNodeClaimPatchableMismatchRow(row) {
  return (
    row &&
    typeof row === 'object' &&
    typeof row.rowId === 'string' &&
    row.status === 'blocked-before-hydrate-text-instance' &&
    row.reason === 'text-content-different' &&
    typeof row.actualPath === 'string' &&
    typeof row.expectedText === 'string' &&
    typeof row.actualText === 'string' &&
    row.recoverable === true &&
    row.canHydrate === false &&
    row.hydrateTextInstanceCalled === false &&
    row.willPatchText === false &&
    row.domMutated === false
  );
}

function validateHydrationTextNodeClaimPatchTarget(
  mismatchRow,
  claimedTextNodeResolution,
  claimedTextNode
) {
  if (
    claimedTextNodeResolution === null ||
    claimedTextNodeResolution.status !== 'resolved' ||
    claimedTextNodeResolution.path !== mismatchRow.actualPath ||
    !claimedTextNode ||
    typeof claimedTextNode !== 'object' ||
    claimedTextNode.nodeType !== TEXT_NODE ||
    readHydrationTextNodeValue(claimedTextNode) !==
      mismatchRow.actualText ||
    !isPrivateFakeHydrationTextNode(claimedTextNode)
  ) {
    throwInvalidHydrationTextNodeClaimPatchExecution(
      'Hydration text node claim patch execution requires the recorded fake text node target.'
    );
  }
}

function isPrivateFakeHydrationTextNode(node) {
  if (!node || typeof node !== 'object') {
    return false;
  }
  if (node.__fastReactFakeHydrationTextNode === true) {
    return true;
  }

  const constructorName = getHydrationTextNodeConstructorName(node);
  return constructorName === 'PrivateHostOutputText';
}

function getHydrationTextNodeConstructorName(node) {
  return node &&
    typeof node === 'object' &&
    node.constructor &&
    typeof node.constructor.name === 'string'
    ? node.constructor.name
    : null;
}

function applyHydrationTextNodeClaimPatch(node, expectedText) {
  const actualTextBefore = readHydrationTextNodeValue(node);
  const patchWriteProperty = resolveHydrationTextNodePatchWriteProperty(
    node
  );
  node[patchWriteProperty] = expectedText;
  const actualTextAfter = readHydrationTextNodeValue(node);

  return freezeRecord({
    actualTextBefore,
    actualTextAfter,
    normalizedActualTextBefore: normalizeHydrationText(actualTextBefore),
    normalizedActualTextAfter: normalizeHydrationText(actualTextAfter),
    patchApplied: actualTextAfter === expectedText,
    patchWriteCount: 1,
    patchWriteProperty,
    patchWrites: freezeArray([
      freezeRecord({
        property: patchWriteProperty,
        text: expectedText
      })
    ])
  });
}

function resolveHydrationTextNodePatchWriteProperty(node) {
  for (const property of ['nodeValue', 'data', 'textContent']) {
    if (canAssignHydrationTextNodeProperty(node, property)) {
      return property;
    }
  }

  throwInvalidHydrationTextNodeClaimPatchExecution(
    'Hydration text node claim patch execution requires a writable fake text node value property.'
  );
}

function canAssignHydrationTextNodeProperty(node, property) {
  if (!(property in node)) {
    return false;
  }

  const descriptor = findHydrationPropertyDescriptor(node, property);
  if (descriptor === null) {
    return Object.isExtensible(node);
  }
  if (typeof descriptor.set === 'function') {
    return true;
  }
  if (descriptor.writable === true) {
    return true;
  }
  return typeof node[property] === 'string';
}

function findHydrationPropertyDescriptor(node, property) {
  let current = node;
  while (current !== null) {
    const descriptor = Object.getOwnPropertyDescriptor(current, property);
    if (descriptor !== undefined) {
      return descriptor;
    }
    current = Object.getPrototypeOf(current);
  }
  return null;
}

function throwInvalidHydrationTextNodeClaimPatchExecution(message) {
  const error = new Error(message);
  error.code = INVALID_HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_CODE;
  throw error;
}

function normalizeHydrationTextMismatchRecoverableErrorPreflightOptions(
  options
) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};
  const hasHydrationOptions = Object.prototype.hasOwnProperty.call(
    normalizedOptions,
    'hydrationOptions'
  );
  const preflightSequence =
    typeof normalizedOptions.preflightSequence === 'number' &&
    Number.isFinite(normalizedOptions.preflightSequence)
      ? normalizedOptions.preflightSequence
      : null;

  return freezeRecord({
    enableRecoverableErrorPreflight:
      normalizedOptions.enableRecoverableErrorPreflight === true,
    hasHydrationOptions,
    hydrationOptions: hasHydrationOptions
      ? normalizedOptions.hydrationOptions
      : undefined,
    preflightId:
      typeof normalizedOptions.preflightId === 'string' &&
      normalizedOptions.preflightId.length > 0
        ? normalizedOptions.preflightId
        : null,
    preflightSequence,
    rawOptions: options,
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-text-mismatch-recoverable-error-preflight'
  });
}

function validateHydrationTextMismatchRecoverableErrorPreflight(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics,
  recoverableErrorMetadata,
  preflightOptions
) {
  const record = assertPrivateHydrationBoundaryRecord(
    hydrationBoundaryRecord
  );
  const payload = getPrivateHydrationBoundaryRecordPayload(record);
  if (preflightOptions.enableRecoverableErrorPreflight !== true) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight requires the explicit private preflight gate.'
    );
  }
  if (
    preflightOptions.hasHydrationOptions === true &&
    preflightOptions.hydrationOptions !== payload.hydrationOptions
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight requires the current hydrateRoot options object.'
    );
  }

  const acceptedBoundaryMetadataRow =
    validateHydrationTextMismatchRecoverableErrorPreflightAcceptedBoundaryMetadata(
      record,
      acceptedBoundaryMetadataDiagnostics
    );
  const textMismatchDiagnostics = record.textMismatchDiagnostics;
  validateHydrationTextMismatchRecoverableErrorPreflightMetadata(
    record,
    textMismatchDiagnostics,
    recoverableErrorMetadata
  );

  const mismatchRows = Array.isArray(textMismatchDiagnostics.mismatchRows)
    ? textMismatchDiagnostics.mismatchRows
    : [];
  const recoverableErrorRows = Array.isArray(
    recoverableErrorMetadata.recoverableErrorRows
  )
    ? recoverableErrorMetadata.recoverableErrorRows
    : [];
  if (
    mismatchRows.length === 0 ||
    recoverableErrorRows.length === 0 ||
    mismatchRows.length !== textMismatchDiagnostics.mismatchCount ||
    recoverableErrorRows.length !==
      recoverableErrorMetadata.recoverableErrorMetadataCount ||
    recoverableErrorRows.length !== mismatchRows.length
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight requires recorded mismatch rows.'
    );
  }

  for (let index = 0; index < mismatchRows.length; index++) {
    validateHydrationTextMismatchRecoverableErrorPreflightRow(
      mismatchRows[index],
      recoverableErrorRows[index]
    );
  }

  if (
    recoverableErrorMetadata !== record.recoverableErrorMetadata ||
    textMismatchDiagnostics.recoverableErrorMetadata !==
      recoverableErrorMetadata ||
    recoverableErrorMetadata.rootRecordId !== record.recordId ||
    textMismatchDiagnostics.rootRecordId !== record.recordId
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight metadata must match the hydration boundary record.'
    );
  }

  return {
    acceptedBoundaryMetadataDiagnostics,
    acceptedBoundaryMetadataRow,
    container: payload.container,
    hydrationBoundaryRecord: record,
    hydrationOptions: payload.hydrationOptions,
    initialChildren: payload.initialChildren,
    mismatchRows: freezeArray(mismatchRows),
    recoverableErrorMetadata,
    recoverableErrorRows: freezeArray(recoverableErrorRows),
    textMismatchDiagnostics
  };
}

function validateHydrationTextMismatchRecoverableErrorPreflightAcceptedBoundaryMetadata(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics
) {
  if (
    acceptedBoundaryMetadataDiagnostics !==
      hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics ||
    !acceptedBoundaryMetadataDiagnostics ||
    typeof acceptedBoundaryMetadataDiagnostics !== 'object' ||
    acceptedBoundaryMetadataDiagnostics.kind !==
      HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND ||
    acceptedBoundaryMetadataDiagnostics.gateId !==
      privateHydrationBoundaryAcceptedMetadataGateId ||
    acceptedBoundaryMetadataDiagnostics.status !==
      privateHydrationBoundaryAcceptedMetadataStatus ||
    acceptedBoundaryMetadataDiagnostics.rootRecordId !==
      hydrationBoundaryRecord.recordId ||
    acceptedBoundaryMetadataDiagnostics.compatibilityClaimed !== false ||
    acceptedBoundaryMetadataDiagnostics.publicHydrationCompatibilityClaimed !==
      false ||
    acceptedBoundaryMetadataDiagnostics
      .publicHydrationReplayCompatibilityClaimed !== false ||
    acceptedBoundaryMetadataDiagnostics.publicRootRenderCompatibilityClaimed !==
      false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight requires accepted boundary metadata for the same hydration record.'
    );
  }

  const metadataRows = Array.isArray(
    acceptedBoundaryMetadataDiagnostics.metadataRows
  )
    ? acceptedBoundaryMetadataDiagnostics.metadataRows
    : [];
  const acceptedBoundaryMetadataRow =
    metadataRows.find(
      (row) =>
        row.metadataId ===
        privateHydrationTextMismatchRecoverableErrorRoutingMetadataId
    ) || null;

  if (
    acceptedBoundaryMetadataRow === null ||
    acceptedBoundaryMetadataRow.category !== 'hydration' ||
    acceptedBoundaryMetadataRow.gateId !==
      privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId ||
    acceptedBoundaryMetadataRow.recordType !==
      HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND ||
    acceptedBoundaryMetadataRow.acceptedStatus !==
      'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded' ||
    acceptedBoundaryMetadataRow.blockedReason !==
      HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON ||
    acceptedBoundaryMetadataRow.metadataRecognized !== true ||
    acceptedBoundaryMetadataRow.compatibilityClaimed !== false ||
    acceptedBoundaryMetadataRow.publicHydrationCompatibilityClaimed !==
      false ||
    acceptedBoundaryMetadataRow.promotesHydration !== false ||
    acceptedBoundaryMetadataRow.promotesRootRender !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight requires accepted recoverable-error boundary metadata.'
    );
  }

  return acceptedBoundaryMetadataRow;
}

function validateHydrationTextMismatchRecoverableErrorPreflightMetadata(
  hydrationBoundaryRecord,
  textMismatchDiagnostics,
  recoverableErrorMetadata
) {
  if (
    !textMismatchDiagnostics ||
    typeof textMismatchDiagnostics !== 'object' ||
    textMismatchDiagnostics.kind !== HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND ||
    textMismatchDiagnostics.status !==
      'blocked-hydration-text-mismatches-recorded' ||
    textMismatchDiagnostics.blockedReason !==
      HYDRATION_TEXT_MISMATCH_BLOCKED_REASON ||
    textMismatchDiagnostics.recoverableErrorsQueued !== false ||
    textMismatchDiagnostics.onRecoverableErrorInvoked !== false ||
    textMismatchDiagnostics.publicRootCreated !== false ||
    textMismatchDiagnostics.domMutated !== false ||
    textMismatchDiagnostics.textPatched !== false ||
    textMismatchDiagnostics.boundaryCleared !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight requires accepted blocked text mismatch diagnostics.'
    );
  }
  if (
    !recoverableErrorMetadata ||
    typeof recoverableErrorMetadata !== 'object' ||
    recoverableErrorMetadata.kind !==
      HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND ||
    recoverableErrorMetadata.status !==
      'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded' ||
    recoverableErrorMetadata.blockedReason !==
      HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON ||
    recoverableErrorMetadata.recoverableErrorsQueued !== false ||
    recoverableErrorMetadata.onRecoverableErrorInvoked !== false ||
    recoverableErrorMetadata.publicRootCreated !== false ||
    recoverableErrorMetadata.hydratingPublicRoot !== false ||
    recoverableErrorMetadata.domMutated !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight requires accepted blocked recoverable-error metadata.'
    );
  }
}

function validateHydrationTextMismatchRecoverableErrorPreflightRow(
  mismatchRow,
  recoverableErrorRow
) {
  if (
    !mismatchRow ||
    typeof mismatchRow !== 'object' ||
    typeof mismatchRow.rowId !== 'string' ||
    mismatchRow.status !== 'blocked-before-hydrate-text-instance' ||
    mismatchRow.recoverable !== true ||
    mismatchRow.canHydrate !== false ||
    mismatchRow.hydrateTextInstanceCalled !== false ||
    mismatchRow.willPatchText !== false ||
    mismatchRow.domMutated !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight requires blocked text mismatch rows.'
    );
  }
  if (
    !recoverableErrorRow ||
    typeof recoverableErrorRow !== 'object' ||
    recoverableErrorRow.id !== mismatchRow.recoverableErrorMetadataId ||
    recoverableErrorRow.textMismatchRowId !== mismatchRow.rowId ||
    recoverableErrorRow.queuedRecoverableError !== false ||
    recoverableErrorRow.onRecoverableErrorInvoked !== false ||
    recoverableErrorRow.publicCallbackInvoked !== false ||
    recoverableErrorRow.recoveredByClientRender !== false ||
    recoverableErrorRow.surfacedToUI !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
      'Hydration text mismatch recoverable-error preflight requires unqueued recoverable mismatch rows.'
    );
  }
}

function throwInvalidHydrationTextMismatchRecoverableErrorPreflight(
  message
) {
  const error = new Error(message);
  error.code = INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_CODE;
  throw error;
}

function normalizeHydrationTextMismatchRecoverableErrorRoutingExecutionOptions(
  options
) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};
  const mismatchLabels = Array.isArray(normalizedOptions.mismatchLabels)
    ? normalizedOptions.mismatchLabels.map((label) =>
        typeof label === 'string' ? label : null
      )
    : [];
  const hasHydrationOptions = Object.prototype.hasOwnProperty.call(
    normalizedOptions,
    'hydrationOptions'
  );

  return freezeRecord({
    enableRecoverableErrorRoutingExecution:
      normalizedOptions.enableRecoverableErrorRoutingExecution === true,
    hasHydrationOptions,
    hydrationOptions: hasHydrationOptions
      ? normalizedOptions.hydrationOptions
      : undefined,
    mismatchLabels: freezeArray(mismatchLabels),
    rawOptions: options,
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-text-mismatch-recoverable-error-routing-execution'
  });
}

function validateHydrationTextMismatchRecoverableErrorRoutingExecution(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics,
  executionOptions
) {
  const record = assertPrivateHydrationBoundaryRecord(
    hydrationBoundaryRecord
  );
  const payload = getPrivateHydrationBoundaryRecordPayload(record);
  if (executionOptions.enableRecoverableErrorRoutingExecution !== true) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires the explicit private execution gate.'
    );
  }
  if (
    executionOptions.hasHydrationOptions === true &&
    executionOptions.hydrationOptions !== payload.hydrationOptions
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires the current hydrateRoot options object.'
    );
  }

  const acceptedBoundaryMetadataRow =
    validateHydrationTextMismatchRecoverableErrorAcceptedBoundaryMetadata(
      record,
      acceptedBoundaryMetadataDiagnostics
    );
  const textMismatchDiagnostics = record.textMismatchDiagnostics;
  const recoverableErrorMetadata = record.recoverableErrorMetadata;
  validateHydrationTextMismatchRecoverableErrorMetadata(
    record,
    textMismatchDiagnostics,
    recoverableErrorMetadata
  );

  const mismatchRows = Array.isArray(textMismatchDiagnostics.mismatchRows)
    ? textMismatchDiagnostics.mismatchRows
    : [];
  const recoverableErrorRows = Array.isArray(
    recoverableErrorMetadata.recoverableErrorRows
  )
    ? recoverableErrorMetadata.recoverableErrorRows
    : [];
  if (
    mismatchRows.length === 0 ||
    recoverableErrorRows.length === 0 ||
    mismatchRows.length !== textMismatchDiagnostics.mismatchCount ||
    recoverableErrorRows.length !==
      recoverableErrorMetadata.recoverableErrorMetadataCount ||
    mismatchRows.length !== recoverableErrorRows.length
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires recorded mismatch rows.'
    );
  }

  for (let index = 0; index < mismatchRows.length; index++) {
    validateHydrationTextMismatchRecoverableErrorRoutingRow(
      mismatchRows[index],
      recoverableErrorRows[index]
    );
  }

  const hydrationOptions =
    payload.hydrationOptions !== null &&
    typeof payload.hydrationOptions === 'object' &&
    !Array.isArray(payload.hydrationOptions)
      ? payload.hydrationOptions
      : null;
  const callback =
    hydrationOptions !== null &&
    Object.prototype.hasOwnProperty.call(
      hydrationOptions,
      'onRecoverableError'
    )
      ? hydrationOptions.onRecoverableError
      : undefined;
  if (typeof callback !== 'function') {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires an owned onRecoverableError function.'
    );
  }

  return {
    acceptedBoundaryMetadataDiagnostics,
    acceptedBoundaryMetadataRow,
    callback,
    container: payload.container,
    hydrationBoundaryRecord: record,
    hydrationOptions,
    initialChildren: payload.initialChildren,
    mismatchRows: freezeArray(mismatchRows),
    recoverableErrorMetadata,
    recoverableErrorRows: freezeArray(recoverableErrorRows),
    rootOptionCallbackValueInfo: describeHydrationValue(callback),
    textMismatchDiagnostics
  };
}

function validateHydrationTextMismatchRecoverableErrorAcceptedBoundaryMetadata(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics
) {
  if (
    acceptedBoundaryMetadataDiagnostics !==
      hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics ||
    !acceptedBoundaryMetadataDiagnostics ||
    typeof acceptedBoundaryMetadataDiagnostics !== 'object' ||
    acceptedBoundaryMetadataDiagnostics.kind !==
      HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND ||
    acceptedBoundaryMetadataDiagnostics.gateId !==
      privateHydrationBoundaryAcceptedMetadataGateId ||
    acceptedBoundaryMetadataDiagnostics.status !==
      privateHydrationBoundaryAcceptedMetadataStatus ||
    acceptedBoundaryMetadataDiagnostics.rootRecordId !==
      hydrationBoundaryRecord.recordId ||
    acceptedBoundaryMetadataDiagnostics.compatibilityClaimed !== false ||
    acceptedBoundaryMetadataDiagnostics.publicHydrationCompatibilityClaimed !==
      false ||
    acceptedBoundaryMetadataDiagnostics
      .publicHydrationReplayCompatibilityClaimed !== false ||
    acceptedBoundaryMetadataDiagnostics.publicRootRenderCompatibilityClaimed !==
      false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires accepted boundary metadata for the same hydration record.'
    );
  }

  const metadataRows = Array.isArray(
    acceptedBoundaryMetadataDiagnostics.metadataRows
  )
    ? acceptedBoundaryMetadataDiagnostics.metadataRows
    : [];
  const acceptedBoundaryMetadataRow =
    metadataRows.find(
      (row) =>
        row.metadataId ===
        privateHydrationTextMismatchRecoverableErrorRoutingMetadataId
    ) || null;

  if (
    acceptedBoundaryMetadataRow === null ||
    acceptedBoundaryMetadataRow.category !== 'hydration' ||
    acceptedBoundaryMetadataRow.gateId !==
      privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId ||
    acceptedBoundaryMetadataRow.recordType !==
      HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND ||
    acceptedBoundaryMetadataRow.acceptedStatus !==
      'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded' ||
    acceptedBoundaryMetadataRow.blockedReason !==
      HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON ||
    acceptedBoundaryMetadataRow.metadataRecognized !== true ||
    acceptedBoundaryMetadataRow.compatibilityClaimed !== false ||
    acceptedBoundaryMetadataRow.publicHydrationCompatibilityClaimed !==
      false ||
    acceptedBoundaryMetadataRow.promotesHydration !== false ||
    acceptedBoundaryMetadataRow.promotesRootRender !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires accepted recoverable-error boundary metadata.'
    );
  }

  return acceptedBoundaryMetadataRow;
}

function validateHydrationTextMismatchRecoverableErrorMetadata(
  hydrationBoundaryRecord,
  textMismatchDiagnostics,
  recoverableErrorMetadata
) {
  if (
    !textMismatchDiagnostics ||
    typeof textMismatchDiagnostics !== 'object' ||
    textMismatchDiagnostics.kind !== HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND ||
    textMismatchDiagnostics.status !==
      'blocked-hydration-text-mismatches-recorded' ||
    textMismatchDiagnostics.blockedReason !==
      HYDRATION_TEXT_MISMATCH_BLOCKED_REASON ||
    textMismatchDiagnostics.recoverableErrorsQueued !== false ||
    textMismatchDiagnostics.onRecoverableErrorInvoked !== false ||
    textMismatchDiagnostics.publicRootCreated !== false ||
    textMismatchDiagnostics.domMutated !== false ||
    textMismatchDiagnostics.textPatched !== false ||
    textMismatchDiagnostics.boundaryCleared !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires accepted blocked text mismatch diagnostics.'
    );
  }
  if (
    !recoverableErrorMetadata ||
    typeof recoverableErrorMetadata !== 'object' ||
    recoverableErrorMetadata.kind !==
      HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND ||
    recoverableErrorMetadata.status !==
      'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded' ||
    recoverableErrorMetadata.blockedReason !==
      HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON ||
    recoverableErrorMetadata.recoverableErrorsQueued !== false ||
    recoverableErrorMetadata.onRecoverableErrorInvoked !== false ||
    recoverableErrorMetadata.publicRootCreated !== false ||
    recoverableErrorMetadata.hydratingPublicRoot !== false ||
    recoverableErrorMetadata.domMutated !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires accepted blocked recoverable-error metadata.'
    );
  }
  if (
    recoverableErrorMetadata !==
      hydrationBoundaryRecord.recoverableErrorMetadata ||
    textMismatchDiagnostics !==
      hydrationBoundaryRecord.textMismatchDiagnostics ||
    textMismatchDiagnostics.recoverableErrorMetadata !==
      recoverableErrorMetadata ||
    recoverableErrorMetadata.rootRecordId !==
      hydrationBoundaryRecord.recordId ||
    textMismatchDiagnostics.rootRecordId !== hydrationBoundaryRecord.recordId
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error metadata must match the hydration boundary record.'
    );
  }
}

function validateHydrationTextMismatchRecoverableErrorRoutingRow(
  mismatchRow,
  recoverableErrorRow
) {
  if (
    !mismatchRow ||
    typeof mismatchRow !== 'object' ||
    typeof mismatchRow.rowId !== 'string' ||
    mismatchRow.status !== 'blocked-before-hydrate-text-instance' ||
    mismatchRow.recoverable !== true ||
    mismatchRow.canHydrate !== false ||
    mismatchRow.hydrateTextInstanceCalled !== false ||
    mismatchRow.willPatchText !== false ||
    mismatchRow.domMutated !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires blocked text mismatch rows.'
    );
  }
  if (
    !recoverableErrorRow ||
    typeof recoverableErrorRow !== 'object' ||
    recoverableErrorRow.id !== mismatchRow.recoverableErrorMetadataId ||
    recoverableErrorRow.textMismatchRowId !== mismatchRow.rowId ||
    recoverableErrorRow.queuedRecoverableError !== false ||
    recoverableErrorRow.onRecoverableErrorInvoked !== false ||
    recoverableErrorRow.publicCallbackInvoked !== false ||
    recoverableErrorRow.recoveredByClientRender !== false ||
    recoverableErrorRow.surfacedToUI !== false
  ) {
    throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
      'Hydration text mismatch recoverable-error routing execution requires unqueued recoverable mismatch rows.'
    );
  }
}

function createHydrationTextMismatchRecoverableErrorRoutingRootOptionOwnershipRecord(
  validation
) {
  return freezeRecord({
    kind:
      'FastReactDomHydrationTextMismatchRecoverableErrorRoutingRootOptionOwnershipRecord',
    status: 'owned-by-hydrate-root-options',
    rootOptionsSource: 'hydrateRoot-options',
    rootOptionsHandleStatus: 'matched-hydrate-root-options',
    ownerRootRecordId: validation.hydrationBoundaryRecord.recordId,
    ownerRootKind: validation.hydrationBoundaryRecord.rootKind,
    ownerRootTag: validation.hydrationBoundaryRecord.rootTag,
    rootOptionCallbackKey: 'onRecoverableError',
    rootOptionCallbackConfigured: true,
    rootOptionCallbackOwnedByHydrateRoot: true,
    rootOptionCallbackValueInfo: validation.rootOptionCallbackValueInfo,
    callbackIdentityMatchesHydrationOptions:
      validation.hydrationOptions.onRecoverableError ===
      validation.callback,
    publicHydrateRootCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    compatibilityClaimed: false
  });
}

function invokeHydrationTextMismatchRecoverableErrorRoutingCallbackRecord({
  callback,
  executionOptions,
  index,
  mismatchRow,
  recoverableErrorRow,
  rootOptionOwnershipRecord
}) {
  const sourceLabel =
    executionOptions.mismatchLabels[index] === undefined
      ? null
      : executionOptions.mismatchLabels[index];
  const error =
    createHydrationTextMismatchRecoverableErrorForCallback(
      recoverableErrorRow
    );
  const errorInfo =
    createHydrationTextMismatchRecoverableErrorInfoForCallback(
      recoverableErrorRow
    );
  let returnValue;
  let callbackError = null;
  try {
    returnValue = callback(error, errorInfo);
  } catch (caughtError) {
    callbackError = caughtError;
  }
  const callbackErrorSummary =
    callbackError === null
      ? null
      : describeHydrationRecoverableErrorCallbackThrownValue(callbackError);
  const callbackReturnStatus =
    callbackError !== null
      ? 'threw'
      : returnValue === undefined
        ? 'returned-undefined'
        : 'returned-value';
  const record = freezeRecord({
    kind:
      'FastReactDomHydrationTextMismatchRecoverableErrorRoutingExecutionEntry',
    status:
      privateHydrationTextMismatchRecoverableErrorRoutingExecutionStatus,
    phase:
      'hydration-text-mismatch-recoverable-error-routing-execution',
    invocationIndex: index,
    sourceLabel,
    textMismatchRowId: mismatchRow.rowId,
    recoverableErrorMetadataId: recoverableErrorRow.id,
    textMismatchReason: mismatchRow.reason,
    expectedPath: mismatchRow.expectedPath,
    actualPath: mismatchRow.actualPath,
    expectedText: mismatchRow.expectedText,
    actualText: mismatchRow.actualText,
    normalizedExpectedText: mismatchRow.normalizedExpectedText,
    normalizedActualText: mismatchRow.normalizedActualText,
    exactTextMatches: mismatchRow.exactTextMatches,
    normalizedTextMatches: mismatchRow.normalizedTextMatches,
    errorName: error.name,
    errorMessage: error.message,
    errorInfoComponentStack: errorInfo.componentStack,
    callbackReturnStatus,
    callbackErrorCaptured: callbackError !== null,
    callbackErrorName:
      callbackErrorSummary === null ? null : callbackErrorSummary.name,
    callbackErrorMessage:
      callbackErrorSummary === null ? null : callbackErrorSummary.message,
    callbackErrorCode:
      callbackErrorSummary === null ? null : callbackErrorSummary.code,
    rootOptionOwnershipStatus: rootOptionOwnershipRecord.status,
    rootOptionCallbackKey: 'onRecoverableError',
    rootOptionCallbackConfigured: true,
    rootOptionCallbackOwnedByHydrateRoot: true,
    rootErrorCallbacksInvoked: true,
    privateRootErrorCallbacksInvoked: true,
    publicRootErrorCallbacksInvoked: false,
    onRecoverableErrorInvoked: true,
    privateOnRecoverableErrorInvoked: true,
    publicOnRecoverableErrorInvoked: false,
    rootErrorCallbackInvocationCount: 1,
    rootErrorUpdatesScheduled: false,
    queuedRecoverableError: false,
    recoverableErrorsQueued: false,
    recoverableErrorCompatibilityClaimed: false,
    publicErrorBoundariesEnabled: false,
    publicRootBehaviorChanged: false,
    compatibilityClaimed: false,
    hydration: false,
    canHydrate: false,
    hydrateTextInstanceCalled: false,
    textPatched: false,
    domMutated: false,
    exposesErrorValue: false,
    exposesHydrationTarget: false,
    exposesRootOptionCallback: false
  });

  return {
    callbackErrorCaptured: callbackError !== null,
    payload: freezeRecord({
      callback,
      callbackError,
      error,
      errorInfo,
      mismatchRow,
      recoverableErrorRow,
      returnValue,
      rootOptionOwnershipRecord
    }),
    record
  };
}

function createHydrationTextMismatchRecoverableErrorForCallback(
  recoverableErrorRow
) {
  const error = new Error(recoverableErrorRow.messageTemplate);
  if (
    typeof recoverableErrorRow.errorName === 'string' &&
    recoverableErrorRow.errorName.length > 0
  ) {
    error.name = recoverableErrorRow.errorName;
  }
  const digest =
    recoverableErrorRow.errorInfo &&
    typeof recoverableErrorRow.errorInfo.digest === 'string'
      ? recoverableErrorRow.errorInfo.digest
      : null;
  if (digest !== null) {
    error.digest = digest;
  }
  return error;
}

function createHydrationTextMismatchRecoverableErrorInfoForCallback(
  recoverableErrorRow
) {
  const componentStack =
    recoverableErrorRow.errorInfo &&
    Object.prototype.hasOwnProperty.call(
      recoverableErrorRow.errorInfo,
      'componentStack'
    )
      ? recoverableErrorRow.errorInfo.componentStack
      : null;

  return freezeRecord({
    componentStack
  });
}

function describeHydrationRecoverableErrorCallbackThrownValue(value) {
  const valueInfo = describeHydrationValue(value);
  if (value !== null && typeof value === 'object') {
    return freezeRecord({
      code:
        Object.prototype.hasOwnProperty.call(value, 'code') &&
        value.code != null
          ? String(value.code)
          : null,
      message:
        typeof value.message === 'string' ? value.message : String(value),
      name: typeof value.name === 'string' ? value.name : null,
      valueInfo
    });
  }

  return freezeRecord({
    code: null,
    message: String(value),
    name: null,
    valueInfo
  });
}

function throwInvalidHydrationTextMismatchRecoverableErrorRoutingExecution(
  message
) {
  const error = new Error(message);
  error.code =
    INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_ROUTING_EXECUTION_CODE;
  throw error;
}

function normalizeHydrationRecoverableErrorBoundaryAdmissionOptions(
  options
) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};
  const hasHydrationOptions = Object.prototype.hasOwnProperty.call(
    normalizedOptions,
    'hydrationOptions'
  );
  const aliasKey = findHydrationRecoverableErrorBoundaryAdmissionAliasKey(
    normalizedOptions
  );
  const publicClaimAliasKey =
    findHydrationRecoverableErrorBoundaryAdmissionPublicClaimAliasKey(
      normalizedOptions
    );

  return freezeRecord({
    aliasKey,
    enableRecoverableErrorBoundaryAdmission:
      normalizedOptions.enableRecoverableErrorBoundaryAdmission === true,
    eventReplayPreflightRecord:
      normalizedOptions.eventReplayPreflightRecord,
    executionPreflightRecord: normalizedOptions.executionPreflightRecord,
    hasHydrationOptions,
    hydrationOptions: hasHydrationOptions
      ? normalizedOptions.hydrationOptions
      : undefined,
    hydrateRootPreflightRecord:
      normalizedOptions.hydrateRootPreflightRecord,
    lifecycleRequestBoundary: normalizedOptions.lifecycleRequestBoundary,
    publicClaimAliasKey,
    rawOptions: options,
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-recoverable-error-boundary-admission'
  });
}

function findHydrationRecoverableErrorBoundaryAdmissionAliasKey(options) {
  for (const key of [
    'callback',
    'error',
    'errorInfo',
    'hydrateRootSourceLedgerContext',
    'onRecoverableError',
    'recoverableError',
    'recoverableErrorCallback',
    'rootOptions',
    'sourceLedger',
    'sourceLedgerPayload',
    'sourceLedgerReader'
  ]) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      return key;
    }
  }
  return null;
}

function findHydrationRecoverableErrorBoundaryAdmissionPublicClaimAliasKey(
  options
) {
  if (!options || (typeof options !== 'object' && typeof options !== 'function')) {
    return null;
  }

  let ownKeys;
  try {
    ownKeys = Reflect.ownKeys(options);
  } catch (error) {
    return 'proxy-own-keys';
  }

  const blockedOwnKeys = new Set([
    'browserDomEventCompatibilityClaimed',
    'browserDomMutation',
    'compatibilityClaimed',
    'domMutated',
    'domMutation',
    'eventDispatch',
    'eventReplayInstalled',
    'eventReplaySupported',
    'eventsReplayed',
    'hydration',
    'hydrationCompatibilityClaimed',
    'hydrationReplaySupported',
    'nativeExecution',
    'packageCompatibility',
    'publicHydrateRootSupported',
    'publicHydrationCompatibilityClaimed',
    'publicHydrationReplayCompatibilityClaimed',
    'publicPackageCompatibilityClaimed',
    'publicRootCompatibilitySurface',
    'publicRootCreated',
    'publicRootExecution',
    'publicRootObjectExposed',
    'reconcilerExecution',
    'replayBlocker',
    'replayBlockerReport',
    'replayQueuesDrained',
    'rootListenerCurrentness',
    'rootListenerDispatchCurrentness',
    'rootListenerReplayAlias',
    'rootListenerReplayCurrentness',
    'rootScheduled',
    'rustExecution',
    'suspenseHydrationScheduled'
  ]);

  for (const key of ownKeys) {
    if (typeof key === 'symbol') {
      return key.description || String(key);
    }
    if (blockedOwnKeys.has(key)) {
      return key;
    }
  }

  for (const key of blockedOwnKeys) {
    let value;
    try {
      value = options[key];
    } catch (error) {
      return key;
    }
    if (value === true || (typeof value === 'number' && value > 0)) {
      return key;
    }
  }

  return null;
}

function validateHydrationRecoverableErrorBoundaryAdmission(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics,
  recoverableErrorPreflightRecord,
  targetClaimingDiagnostic,
  replayExecutionRecord,
  admissionOptions
) {
  const record = assertPrivateHydrationBoundaryRecord(
    hydrationBoundaryRecord
  );
  const payload = getPrivateHydrationBoundaryRecordPayload(record);
  if (admissionOptions.enableRecoverableErrorBoundaryAdmission !== true) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires the explicit private admission gate.'
    );
  }
  if (admissionOptions.aliasKey !== null) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission rejects callback or value alias options.'
    );
  }
  if (admissionOptions.publicClaimAliasKey !== null) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission rejects source-ledger, root-listener, public hydration, browser, native, package, or replay compatibility aliases.'
    );
  }
  if (
    admissionOptions.hasHydrationOptions === true &&
    admissionOptions.hydrationOptions !== payload.hydrationOptions
  ) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires the current hydrateRoot options object.'
    );
  }

  const acceptedBoundaryMetadataRow =
    validateHydrationRecoverableErrorBoundaryAdmissionAcceptedBoundaryMetadata(
      record,
      acceptedBoundaryMetadataDiagnostics
    );
  const recoverablePreflight =
    validateHydrationRecoverableErrorBoundaryAdmissionPreflight(
      record,
      payload,
      recoverableErrorPreflightRecord
    );
  let targetClaimingPayload;
  try {
    targetClaimingPayload =
      assertCanonicalPrivateHydrationTargetClaimingDiagnostic(
        targetClaimingDiagnostic,
        {
          hydrationBoundaryRecord: record
        }
      );
  } catch (error) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires canonical private target-claiming evidence.'
    );
  }

  let replayExecutionPayload;
  try {
    replayExecutionPayload =
      assertCanonicalPrivateHydrationClaimedReplayTargetDispatchExecutionRecord(
        replayExecutionRecord,
        {
          dispatchRecord:
            targetClaimingPayload.targetDispatchLinkPayload.dispatchRecord,
          hydrationBoundaryRecord: record,
          targetClaimingDiagnostic,
          targetDispatchLinkDiagnostic:
            targetClaimingPayload.targetDispatchLinkDiagnostic
        }
      );
  } catch (error) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires canonical private blocked replay execution evidence.'
    );
  }
  validateHydrationRecoverableErrorBoundaryAdmissionReplayExecution(
    record,
    recoverablePreflight.recoverableErrorMetadata,
    replayExecutionRecord,
    replayExecutionPayload
  );
  const currentness =
    validateHydrationRecoverableErrorBoundaryAdmissionCurrentness(
      payload,
      targetClaimingDiagnostic,
      targetClaimingPayload,
      replayExecutionRecord,
      replayExecutionPayload
    );
  const sourceLedger =
    validateHydrationRecoverableErrorBoundaryAdmissionSourceLedger(
      record,
      payload,
      recoverableErrorPreflightRecord,
      targetClaimingDiagnostic,
      replayExecutionRecord,
      targetClaimingPayload,
      replayExecutionPayload,
      admissionOptions,
      currentness
    );

  return {
    acceptedBoundaryMetadataDiagnostics,
    acceptedBoundaryMetadataRow,
    container: payload.container,
    currentness,
    hydrationBoundaryRecord: record,
    hydrationOptions: payload.hydrationOptions,
    initialChildren: payload.initialChildren,
    recoverableErrorMetadata: recoverablePreflight.recoverableErrorMetadata,
    recoverableErrorPreflightPayload: recoverablePreflight.preflightPayload,
    recoverableErrorPreflightRecord,
    recoverableErrorRows: recoverablePreflight.recoverableErrorRows,
    replayExecutionPayload,
    replayExecutionRecord,
    sourceLedger,
    targetClaimingDiagnostic,
    targetClaimingPayload
  };
}

function validateHydrationRecoverableErrorBoundaryAdmissionAcceptedBoundaryMetadata(
  hydrationBoundaryRecord,
  acceptedBoundaryMetadataDiagnostics
) {
  if (
    acceptedBoundaryMetadataDiagnostics !==
      hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics ||
    !acceptedBoundaryMetadataDiagnostics ||
    typeof acceptedBoundaryMetadataDiagnostics !== 'object' ||
    acceptedBoundaryMetadataDiagnostics.kind !==
      HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND ||
    acceptedBoundaryMetadataDiagnostics.gateId !==
      privateHydrationBoundaryAcceptedMetadataGateId ||
    acceptedBoundaryMetadataDiagnostics.status !==
      privateHydrationBoundaryAcceptedMetadataStatus ||
    acceptedBoundaryMetadataDiagnostics.rootRecordId !==
      hydrationBoundaryRecord.recordId ||
    acceptedBoundaryMetadataDiagnostics.compatibilityClaimed !== false ||
    acceptedBoundaryMetadataDiagnostics.publicHydrationCompatibilityClaimed !==
      false ||
    acceptedBoundaryMetadataDiagnostics
      .publicHydrationReplayCompatibilityClaimed !== false ||
    acceptedBoundaryMetadataDiagnostics.publicRootRenderCompatibilityClaimed !==
      false
  ) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires accepted boundary metadata for the same hydration record.'
    );
  }

  const metadataRows = Array.isArray(
    acceptedBoundaryMetadataDiagnostics.metadataRows
  )
    ? acceptedBoundaryMetadataDiagnostics.metadataRows
    : [];
  const acceptedBoundaryMetadataRow =
    metadataRows.find(
      (row) =>
        row.metadataId ===
        privateHydrationRecoverableErrorBoundaryAdmissionMetadataId
    ) || null;

  if (
    acceptedBoundaryMetadataRow === null ||
    acceptedBoundaryMetadataRow.category !== 'hydration' ||
    acceptedBoundaryMetadataRow.gateId !==
      privateHydrationRecoverableErrorBoundaryAdmissionGateId ||
    acceptedBoundaryMetadataRow.recordType !==
      HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_RECORD_KIND ||
    acceptedBoundaryMetadataRow.acceptedStatus !==
      privateHydrationRecoverableErrorBoundaryAdmissionStatus ||
    acceptedBoundaryMetadataRow.blockedReason !==
      HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON ||
    acceptedBoundaryMetadataRow.metadataRecognized !== true ||
    acceptedBoundaryMetadataRow.compatibilityClaimed !== false ||
    acceptedBoundaryMetadataRow.publicHydrationCompatibilityClaimed !==
      false ||
    acceptedBoundaryMetadataRow.promotesHydration !== false ||
    acceptedBoundaryMetadataRow.promotesRootRender !== false
  ) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires accepted private boundary-admission metadata.'
    );
  }

  return acceptedBoundaryMetadataRow;
}

function validateHydrationRecoverableErrorBoundaryAdmissionPreflight(
  hydrationBoundaryRecord,
  hydrationBoundaryPayload,
  recoverableErrorPreflightRecord
) {
  const preflightPayload =
    getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload(
      recoverableErrorPreflightRecord
    );
  if (
    preflightPayload === null ||
    !recoverableErrorPreflightRecord ||
    typeof recoverableErrorPreflightRecord !== 'object' ||
    !Object.isFrozen(recoverableErrorPreflightRecord) ||
    recoverableErrorPreflightRecord.kind !==
      HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_RECORD_KIND ||
    recoverableErrorPreflightRecord.gateId !==
      privateHydrationTextMismatchRecoverableErrorPreflightGateId ||
    recoverableErrorPreflightRecord.status !==
      privateHydrationTextMismatchRecoverableErrorPreflightStatus ||
    recoverableErrorPreflightRecord.privatePreflight !== true ||
    recoverableErrorPreflightRecord.diagnosticOnly !== true ||
    recoverableErrorPreflightRecord.readOnly !== true ||
    recoverableErrorPreflightRecord.compatibilityClaimed !== false ||
    recoverableErrorPreflightRecord.publicHydrationCompatibilityClaimed !==
      false ||
    recoverableErrorPreflightRecord.publicHydrationReplayCompatibilityClaimed !==
      false ||
    recoverableErrorPreflightRecord.publicHydrateRootSupported !== false ||
    recoverableErrorPreflightRecord.publicRootExecution !== false ||
    recoverableErrorPreflightRecord.nativeExecution !== false ||
    recoverableErrorPreflightRecord.reconcilerExecution !== false ||
    recoverableErrorPreflightRecord.domMutation !== false ||
    recoverableErrorPreflightRecord.eventDispatch !== false ||
    recoverableErrorPreflightRecord.eventReplayInstalled !== false ||
    recoverableErrorPreflightRecord.replayQueuesDrained !== false ||
    recoverableErrorPreflightRecord.recoverableErrorsQueued !== false ||
    recoverableErrorPreflightRecord.willQueueRecoverableErrors !== false ||
    recoverableErrorPreflightRecord.onRecoverableErrorInvoked !== false ||
    recoverableErrorPreflightRecord.publicOnRecoverableErrorInvoked !==
      false ||
    recoverableErrorPreflightRecord.callbackInvocationGateEnabled !== false ||
    recoverableErrorPreflightRecord.callbackInvocationRecordCount !== 0 ||
    recoverableErrorPreflightRecord.rootErrorCallbackInvocationCount !== 0 ||
    recoverableErrorPreflightRecord.rootRecordId !==
      hydrationBoundaryRecord.recordId ||
    recoverableErrorPreflightRecord.acceptedBoundaryMetadataDiagnostics !==
      hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics ||
    recoverableErrorPreflightRecord.recoverableErrorMetadata !==
      hydrationBoundaryRecord.recoverableErrorMetadata ||
    preflightPayload.hydrationBoundaryRecord !== hydrationBoundaryRecord ||
    preflightPayload.container !== hydrationBoundaryPayload.container ||
    preflightPayload.initialChildren !==
      hydrationBoundaryPayload.initialChildren ||
    preflightPayload.hydrationOptions !==
      hydrationBoundaryPayload.hydrationOptions ||
    preflightPayload.recoverableErrorMetadata !==
      hydrationBoundaryRecord.recoverableErrorMetadata ||
    preflightPayload.textMismatchDiagnostics !==
      hydrationBoundaryRecord.textMismatchDiagnostics
  ) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires canonical private recoverable-error preflight evidence.'
    );
  }

  const textMismatchDiagnostics =
    hydrationBoundaryRecord.textMismatchDiagnostics;
  const recoverableErrorMetadata =
    hydrationBoundaryRecord.recoverableErrorMetadata;
  validateHydrationRecoverableErrorBoundaryAdmissionRecoverableMetadata(
    hydrationBoundaryRecord,
    textMismatchDiagnostics,
    recoverableErrorMetadata
  );
  const recoverableErrorRows = Array.isArray(
    recoverableErrorMetadata.recoverableErrorRows
  )
    ? recoverableErrorMetadata.recoverableErrorRows
    : [];
  if (
    recoverableErrorRows.length === 0 ||
    recoverableErrorRows.length !==
      recoverableErrorMetadata.recoverableErrorMetadataCount ||
    recoverableErrorPreflightRecord.recoverableErrorMetadataCount !==
      recoverableErrorRows.length ||
    recoverableErrorPreflightRecord.recoverableErrorRows !==
      preflightPayload.recoverableErrorRows
  ) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires recorded recoverable-error rows.'
    );
  }

  return {
    preflightPayload,
    recoverableErrorMetadata,
    recoverableErrorRows: freezeArray(recoverableErrorRows)
  };
}

function validateHydrationRecoverableErrorBoundaryAdmissionRecoverableMetadata(
  hydrationBoundaryRecord,
  textMismatchDiagnostics,
  recoverableErrorMetadata
) {
  if (
    !textMismatchDiagnostics ||
    typeof textMismatchDiagnostics !== 'object' ||
    textMismatchDiagnostics.kind !== HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND ||
    textMismatchDiagnostics.status !==
      'blocked-hydration-text-mismatches-recorded' ||
    textMismatchDiagnostics.blockedReason !==
      HYDRATION_TEXT_MISMATCH_BLOCKED_REASON ||
    textMismatchDiagnostics.recoverableErrorsQueued !== false ||
    textMismatchDiagnostics.onRecoverableErrorInvoked !== false ||
    textMismatchDiagnostics.publicRootCreated !== false ||
    textMismatchDiagnostics.domMutated !== false ||
    textMismatchDiagnostics.textPatched !== false ||
    textMismatchDiagnostics.boundaryCleared !== false ||
    !recoverableErrorMetadata ||
    typeof recoverableErrorMetadata !== 'object' ||
    recoverableErrorMetadata.kind !==
      HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND ||
    recoverableErrorMetadata.status !==
      'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded' ||
    recoverableErrorMetadata.blockedReason !==
      HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON ||
    recoverableErrorMetadata.recoverableErrorsQueued !== false ||
    recoverableErrorMetadata.onRecoverableErrorInvoked !== false ||
    recoverableErrorMetadata.publicRootCreated !== false ||
    recoverableErrorMetadata.hydratingPublicRoot !== false ||
    recoverableErrorMetadata.domMutated !== false ||
    recoverableErrorMetadata.source !==
      'ReactFiberHydrationContext.throwOnHydrationMismatch/queueRecoverableErrors'
  ) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires accepted blocked recoverable-error diagnostics.'
    );
  }
  if (
    recoverableErrorMetadata !==
      hydrationBoundaryRecord.recoverableErrorMetadata ||
    textMismatchDiagnostics !==
      hydrationBoundaryRecord.textMismatchDiagnostics ||
    textMismatchDiagnostics.recoverableErrorMetadata !==
      recoverableErrorMetadata ||
    recoverableErrorMetadata.rootRecordId !==
      hydrationBoundaryRecord.recordId ||
    textMismatchDiagnostics.rootRecordId !== hydrationBoundaryRecord.recordId
  ) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission metadata must match the hydration boundary record.'
    );
  }
}

function validateHydrationRecoverableErrorBoundaryAdmissionReplayExecution(
  hydrationBoundaryRecord,
  recoverableErrorMetadata,
  replayExecutionRecord,
  replayExecutionPayload
) {
  if (
    replayExecutionRecord.recoverableErrorMetadata !==
      recoverableErrorMetadata ||
    replayExecutionPayload.hydrationBoundaryRecord !==
      hydrationBoundaryRecord ||
    replayExecutionPayload.recoverableErrorMetadata !==
      recoverableErrorMetadata ||
    replayExecutionRecord.replayTargetDispatchExecutionRecorded !== true ||
    replayExecutionRecord.replayTargetDispatchExecutionBlocked !== true ||
    replayExecutionRecord.dispatchExecutionBlocked !== true ||
    replayExecutionRecord.eventReplayDispatchAttempted !== false ||
    replayExecutionRecord.targetDispatchExecuted !== false ||
    replayExecutionRecord.eventsReplayed !== false ||
    replayExecutionRecord.replayQueuesDrained !== false ||
    replayExecutionRecord.replayQueueDrained !== false ||
    replayExecutionRecord.recoverableErrorsQueued !== false ||
    replayExecutionRecord.onRecoverableErrorInvoked !== false ||
    replayExecutionRecord.publicOnRecoverableErrorInvoked !== false
  ) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires blocked replay execution evidence for the same boundary.'
    );
  }
}

function validateHydrationRecoverableErrorBoundaryAdmissionCurrentness(
  hydrationBoundaryPayload,
  targetClaimingDiagnostic,
  targetClaimingPayload,
  replayExecutionRecord,
  replayExecutionPayload
) {
  const markerDiagnostics = inspectHydrationContainerMarkers(
    hydrationBoundaryPayload.container
  );
  const markerRow = targetClaimingPayload.markerRow;
  const currentMarkerRow = findHydrationRecoverableErrorBoundaryCurrentMarkerRow(
    markerDiagnostics,
    markerRow
  );
  if (currentMarkerRow === null) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission rejected stale marker evidence.'
    );
  }

  let targetPathEvidence;
  try {
    const targetPathRecord = resolveSupportedHydrationTargetClaimingPath(
      replayExecutionRecord.targetPath
    );
    targetPathEvidence = resolveHydrationTargetClaimingPathEvidence(
      hydrationBoundaryPayload,
      replayExecutionPayload.targetDispatchLinkDiagnostic,
      replayExecutionPayload.targetDispatchLinkPayload,
      targetPathRecord
    );
  } catch (error) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission rejected stale target-claiming evidence.'
    );
  }

  return freezeRecord({
    hydratableLookupTargetPathRetained:
      targetPathEvidence.hydratableLookupTargetPathRetained,
    markerContractId: currentMarkerRow.contractId,
    markerDiagnostics,
    markerPathCurrent: true,
    markerPathCurrentStatus: 'current-marker-row-retained',
    targetContainerMatchesBoundaryRecord:
      targetPathEvidence.containerMatchesBoundaryRecord,
    targetPathCurrent: true,
    targetPathCurrentStatus: 'current-target-path-retained',
    targetPathEvidence,
    targetPathParentChainRetained: targetPathEvidence.parentChainRetained,
    targetPathResolvedToDispatchTarget:
      targetPathEvidence.resolvedToDispatchTarget,
    targetPathUniqueInContainer: targetPathEvidence.uniqueInContainer
  });
}

function findHydrationRecoverableErrorBoundaryCurrentMarkerRow(
  markerDiagnostics,
  markerRow
) {
  const rows = Array.isArray(markerDiagnostics.markers)
    ? markerDiagnostics.markers
    : [];
  return (
    rows.find(
      (row) =>
        row.path === markerRow.path &&
        row.contractId === markerRow.contractId &&
        row.kind === markerRow.kind &&
        row.markerId === markerRow.markerId
    ) || null
  );
}

function validateHydrationRecoverableErrorBoundaryAdmissionSourceLedger(
  hydrationBoundaryRecord,
  hydrationBoundaryPayload,
  recoverableErrorPreflightRecord,
  targetClaimingDiagnostic,
  replayExecutionRecord,
  targetClaimingPayload,
  replayExecutionPayload,
  admissionOptions,
  currentness
) {
  const hydrateRootPreflightRecord =
    admissionOptions.hydrateRootPreflightRecord;
  const eventReplayPreflightRecord =
    admissionOptions.eventReplayPreflightRecord;
  const executionPreflightRecord =
    admissionOptions.executionPreflightRecord;
  const lifecycleRequestBoundary =
    admissionOptions.lifecycleRequestBoundary;
  const replayBlockerCurrentnessRecord =
    eventReplayPreflightRecord &&
    typeof eventReplayPreflightRecord === 'object'
      ? eventReplayPreflightRecord.replayBlockerCurrentness
      : null;
  const hydrateRootSourceLedgerPayload =
    getPrivateHydrateRootSourceLedgerRecordPayloadForAdmission(
      hydrationBoundaryRecord,
      hydrateRootPreflightRecord,
      'hydrate-root-public-facade-preflight-record',
      targetClaimingPayload,
      replayExecutionPayload,
      replayExecutionRecord
    );
  const eventReplaySourceLedgerPayload =
    getPrivateHydrateRootSourceLedgerRecordPayloadForAdmission(
      hydrationBoundaryRecord,
      eventReplayPreflightRecord,
      'hydrate-root-public-facade-event-replay-preflight-record',
      targetClaimingPayload,
      replayExecutionPayload,
      replayExecutionRecord
    );
  const executionSourceLedgerPayload =
    getPrivateHydrateRootSourceLedgerRecordPayloadForAdmission(
      hydrationBoundaryRecord,
      executionPreflightRecord,
      'hydrate-root-public-facade-execution-preflight-record',
      targetClaimingPayload,
      replayExecutionPayload,
      replayExecutionRecord
    );
  const lifecycleSourceLedgerPayload =
    getPrivateHydrateRootSourceLedgerRecordPayloadForAdmission(
      hydrationBoundaryRecord,
      lifecycleRequestBoundary,
      'hydrate-root-public-facade-lifecycle-request-boundary',
      targetClaimingPayload,
      replayExecutionPayload,
      replayExecutionRecord
    );
  const replayBlockerSourceLedgerPayload =
    getPrivateHydrateRootSourceLedgerRecordPayloadForAdmission(
      hydrationBoundaryRecord,
      replayBlockerCurrentnessRecord,
      'hydrate-root-public-facade-replay-blocker-currentness-record',
      targetClaimingPayload,
      replayExecutionPayload,
      replayExecutionRecord
    );

  if (
    !isHydrationRecoverableErrorBoundaryAdmissionSourceLedgerPayload(
      hydrateRootSourceLedgerPayload,
      hydrateRootPreflightRecord,
      'hydrate-root-public-facade-preflight-record'
    ) ||
    !isHydrationRecoverableErrorBoundaryAdmissionSourceLedgerPayload(
      eventReplaySourceLedgerPayload,
      eventReplayPreflightRecord,
      'hydrate-root-public-facade-event-replay-preflight-record'
    ) ||
    !isHydrationRecoverableErrorBoundaryAdmissionSourceLedgerPayload(
      executionSourceLedgerPayload,
      executionPreflightRecord,
      'hydrate-root-public-facade-execution-preflight-record'
    ) ||
    !isHydrationRecoverableErrorBoundaryAdmissionSourceLedgerPayload(
      lifecycleSourceLedgerPayload,
      lifecycleRequestBoundary,
      'hydrate-root-public-facade-lifecycle-request-boundary'
    ) ||
    !isHydrationRecoverableErrorBoundaryAdmissionSourceLedgerPayload(
      replayBlockerSourceLedgerPayload,
      replayBlockerCurrentnessRecord,
      'hydrate-root-public-facade-replay-blocker-currentness-record'
    ) ||
    !isHydrationRecoverableErrorBoundaryAdmissionHydrateRootPreflight(
      hydrateRootPreflightRecord
    ) ||
    !isHydrationRecoverableErrorBoundaryAdmissionEventReplayPreflight(
      eventReplayPreflightRecord
    ) ||
    !isHydrationRecoverableErrorBoundaryAdmissionExecutionPreflight(
      executionPreflightRecord
    ) ||
    !isHydrationRecoverableErrorBoundaryAdmissionLifecycleBoundary(
      lifecycleRequestBoundary
    ) ||
    !isHydrationRecoverableErrorBoundaryAdmissionReplayBlockerCurrentness(
      replayBlockerCurrentnessRecord
    ) ||
    hydrateRootPreflightRecord.hydrationBoundaryRecord !==
      hydrationBoundaryRecord ||
    hydrateRootSourceLedgerPayload.hydrationBoundaryRecord !==
      hydrationBoundaryRecord ||
    hydrateRootSourceLedgerPayload.eventReplayBlockers !==
      hydrationBoundaryRecord.eventReplayBlockers ||
    eventReplaySourceLedgerPayload.hydrationBoundaryRecord !==
      hydrationBoundaryRecord ||
    executionSourceLedgerPayload.hydrationBoundaryRecord !==
      hydrationBoundaryRecord ||
    lifecycleSourceLedgerPayload.hydrationBoundaryRecord !==
      hydrationBoundaryRecord ||
    replayBlockerSourceLedgerPayload.hydrationBoundaryRecord !==
      hydrationBoundaryRecord ||
    hydrateRootSourceLedgerPayload.preflight !==
      eventReplaySourceLedgerPayload.preflight ||
    hydrateRootSourceLedgerPayload.preflight !==
      executionSourceLedgerPayload.preflight ||
    hydrateRootSourceLedgerPayload.preflight !==
      lifecycleSourceLedgerPayload.preflight ||
    hydrateRootSourceLedgerPayload.preflight !==
      replayBlockerSourceLedgerPayload.preflight ||
    hydrateRootSourceLedgerPayload.bridge !==
      eventReplaySourceLedgerPayload.bridge ||
    hydrateRootSourceLedgerPayload.bridge !==
      executionSourceLedgerPayload.bridge ||
    hydrateRootSourceLedgerPayload.bridge !==
      lifecycleSourceLedgerPayload.bridge ||
    hydrateRootSourceLedgerPayload.bridge !==
      replayBlockerSourceLedgerPayload.bridge ||
    hydrateRootSourceLedgerPayload.requestRecord !==
      eventReplaySourceLedgerPayload.requestRecord ||
    hydrateRootSourceLedgerPayload.requestRecord !==
      executionSourceLedgerPayload.requestRecord ||
    hydrateRootSourceLedgerPayload.requestRecord !==
      lifecycleSourceLedgerPayload.requestRecord ||
    hydrateRootSourceLedgerPayload.requestRecord !==
      replayBlockerSourceLedgerPayload.requestRecord ||
    hydrateRootSourceLedgerPayload.requestAdmission !==
      lifecycleSourceLedgerPayload.requestAdmission ||
    hydrateRootPreflightRecord.recoverableErrorPreflight !==
      recoverableErrorPreflightRecord ||
    hydrateRootSourceLedgerPayload.recoverableErrorPreflight !==
      recoverableErrorPreflightRecord ||
    hydrateRootPreflightRecord.acceptedPrivateMetadataDiagnostics !==
      hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics ||
    hydrateRootPreflightRecord.recoverableErrorMetadata !==
      hydrationBoundaryRecord.recoverableErrorMetadata ||
    hydrateRootPreflightRecord.lifecycleRequestBoundary !==
      lifecycleRequestBoundary ||
    hydrateRootSourceLedgerPayload.lifecycleRequestBoundary !==
      lifecycleRequestBoundary ||
    hydrateRootPreflightRecord.requestAdmission !==
      lifecycleRequestBoundary.requestAdmission ||
    eventReplayPreflightRecord.lifecycleRequestBoundary !==
      lifecycleRequestBoundary ||
    eventReplaySourceLedgerPayload.lifecycleRequestBoundary !==
      lifecycleRequestBoundary ||
    eventReplayPreflightRecord.targetClaimingDiagnostic !==
      targetClaimingDiagnostic ||
    !eventReplaySourceLedgerPayload.targetClaimingPayload ||
    eventReplaySourceLedgerPayload.targetClaimingPayload
      .targetClaimingDiagnostic !== targetClaimingDiagnostic ||
    eventReplayPreflightRecord.replayExecutionRecord !==
      replayExecutionRecord ||
    eventReplaySourceLedgerPayload.replayExecutionRecord !==
      replayExecutionRecord ||
    eventReplayPreflightRecord.replayBlockerCurrentness !==
      replayBlockerCurrentnessRecord ||
    eventReplayPreflightRecord.replayBlockerCurrentnessAccepted !== true ||
    eventReplayPreflightRecord.replayBlockerReportAccepted !== true ||
    eventReplaySourceLedgerPayload.replayBlockerCurrentness !==
      replayBlockerCurrentnessRecord ||
    executionPreflightRecord.lifecycleRequestBoundary !==
      lifecycleRequestBoundary ||
    executionSourceLedgerPayload.lifecycleRequestBoundary !==
      lifecycleRequestBoundary ||
    executionPreflightRecord.eventReplayPreflight !==
      eventReplayPreflightRecord ||
    executionSourceLedgerPayload.eventReplayPreflight !==
      eventReplayPreflightRecord ||
    executionPreflightRecord.replayExecutionRecord !==
      replayExecutionRecord ||
    executionSourceLedgerPayload.replayExecutionRecord !==
      replayExecutionRecord ||
    executionPreflightRecord.replayBlockerCurrentness !==
      replayBlockerCurrentnessRecord ||
    executionPreflightRecord.replayBlockerCurrentnessAccepted !== true ||
    executionPreflightRecord.replayBlockerReportAccepted !== true ||
    executionSourceLedgerPayload.replayBlockerCurrentness !==
      replayBlockerCurrentnessRecord ||
    executionPreflightRecord.recoverableErrorMetadata !==
      hydrationBoundaryRecord.recoverableErrorMetadata ||
    replayBlockerCurrentnessRecord.eventReplayBlockers !==
      hydrationBoundaryRecord.eventReplayBlockers ||
    replayBlockerCurrentnessRecord.lifecycleRequestBoundary !==
      lifecycleRequestBoundary ||
    replayBlockerCurrentnessRecord.replayExecutionRecord !==
      replayExecutionRecord ||
    replayBlockerCurrentnessRecord.targetClaimingDiagnostic !==
      targetClaimingDiagnostic ||
    replayBlockerCurrentnessRecord.targetDispatchLinkDiagnostic !==
      targetClaimingPayload.targetDispatchLinkDiagnostic ||
    replayBlockerSourceLedgerPayload.eventReplayBlockers !==
      hydrationBoundaryRecord.eventReplayBlockers ||
    replayBlockerSourceLedgerPayload.eventReplayPreflightRecord !==
      eventReplayPreflightRecord ||
    replayBlockerSourceLedgerPayload.lifecycleRequestBoundary !==
      lifecycleRequestBoundary ||
    replayBlockerSourceLedgerPayload.replayExecutionRecord !==
      replayExecutionRecord ||
    replayBlockerSourceLedgerPayload.targetClaimingDiagnostic !==
      targetClaimingDiagnostic ||
    replayBlockerSourceLedgerPayload.targetDispatchLinkDiagnostic !==
      targetClaimingPayload.targetDispatchLinkDiagnostic ||
    lifecycleRequestBoundary.hydrationBoundaryRecord !==
      hydrationBoundaryRecord ||
    lifecycleRequestBoundary.acceptedPrivateMetadataDiagnostics !==
      hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics ||
    lifecycleRequestBoundary.markerGuard !==
      hydrationBoundaryRecord.markerGuard ||
    lifecycleRequestBoundary.listenerGuard !==
      hydrationBoundaryRecord.listenerGuard ||
    lifecycleRequestBoundary.rootRecordId !==
      hydrationBoundaryRecord.recordId ||
    lifecycleRequestBoundary.requestAdmission !==
      hydrateRootPreflightRecord.requestAdmission ||
    lifecycleSourceLedgerPayload.requestAdmission !==
      hydrateRootPreflightRecord.requestAdmission ||
    lifecycleSourceLedgerPayload.lifecycleContainerSnapshot !==
      lifecycleRequestBoundary.lifecycleContainerSnapshot ||
    lifecycleSourceLedgerPayload.container !==
      hydrationBoundaryPayload.container ||
    lifecycleRequestBoundary.lifecycleContainerSnapshot.childCount !==
      getHydrationRecoverableErrorBoundaryAdmissionChildCount(
        hydrationBoundaryPayload.container
      ) ||
    currentness.markerPathCurrent !== true ||
    currentness.targetPathCurrent !== true
  ) {
    throwInvalidHydrationRecoverableErrorBoundaryAdmission(
      'Hydration recoverable-error boundary admission requires source-owned current hydrateRoot lifecycle and replay source-ledger evidence.'
    );
  }

  return freezeRecord({
    eventReplayPreflightRecord,
    eventReplaySourceLedgerPayload,
    executionPreflightRecord,
    executionSourceLedgerPayload,
    hydrateRootPreflightRecord,
    hydrateRootSourceLedgerPayload,
    lifecycleContainerSnapshotCurrent: true,
    lifecycleRequestBoundary,
    lifecycleSourceLedgerPayload,
    replayBlockerCurrentnessRecord,
    replayBlockerSourceLedgerPayload,
    sourceOwnedLedgerPayloads: true
  });
}

function isHydrationRecoverableErrorBoundaryAdmissionSourceLedgerPayload(
  payload,
  record,
  ledgerKind
) {
  return (
    payload &&
    typeof payload === 'object' &&
    payload.record === record &&
    payload.ledgerKind === ledgerKind
  );
}

function getPrivateHydrateRootSourceLedgerRecordPayloadForAdmission(
  hydrationBoundaryRecord,
  record,
  ledgerKind,
  targetClaimingPayload,
  replayExecutionPayload,
  replayExecutionRecord
) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  if (ledgerKind === 'hydrate-root-public-facade-preflight-record') {
    return createHydrateRootPreflightSourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind
    );
  }
  if (
    ledgerKind ===
    'hydrate-root-public-facade-event-replay-preflight-record'
  ) {
    return createHydrateRootEventReplaySourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind,
      targetClaimingPayload,
      replayExecutionPayload,
      replayExecutionRecord
    );
  }
  if (
    ledgerKind === 'hydrate-root-public-facade-execution-preflight-record'
  ) {
    return createHydrateRootExecutionSourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind,
      replayExecutionPayload,
      replayExecutionRecord
    );
  }
  if (
    ledgerKind === 'hydrate-root-public-facade-lifecycle-request-boundary'
  ) {
    return createHydrateRootLifecycleSourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind
    );
  }
  if (
    ledgerKind ===
    'hydrate-root-public-facade-replay-blocker-currentness-record'
  ) {
    return createHydrateRootReplayBlockerCurrentnessSourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind,
      targetClaimingPayload,
      replayExecutionPayload,
      replayExecutionRecord
    );
  }

  return null;
}

function createHydrateRootPreflightSourceLedgerPayload(
  hydrationBoundaryRecord,
  record,
  ledgerKind
) {
  const sourceLedgerPayload =
    readPrivateHydrateRootSourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind
    );
  if (
    sourceLedgerPayload === null ||
    record.requestAdmission !== sourceLedgerPayload.requestAdmission ||
    record.lifecycleRequestBoundary !==
      sourceLedgerPayload.lifecycleRequestBoundary
  ) {
    return null;
  }

  return freezeRecord({
    bridge: sourceLedgerPayload.bridge,
    eventReplayBlockers: sourceLedgerPayload.eventReplayBlockers,
    hydrationBoundaryRecord: sourceLedgerPayload.hydrationBoundaryRecord,
    ledgerKind,
    lifecycleRequestBoundary: record.lifecycleRequestBoundary,
    markerListenerPreflight: record.markerListenerPreflight,
    nativeHandoffRecord: record.nativeHandoffRecord,
    preflight: sourceLedgerPayload.preflight,
    recoverableErrorPreflight: record.recoverableErrorPreflight,
    requestAdmission: sourceLedgerPayload.requestAdmission,
    requestRecord: sourceLedgerPayload.requestRecord,
    record
  });
}

function createHydrateRootReplayBlockerCurrentnessSourceLedgerPayload(
  hydrationBoundaryRecord,
  record,
  ledgerKind,
  targetClaimingPayload,
  replayExecutionPayload,
  replayExecutionRecord
) {
  const sourceLedgerPayload =
    readPrivateHydrateRootSourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind
    );
  if (
    sourceLedgerPayload === null ||
    record.lifecycleRequestBoundary !==
      sourceLedgerPayload.lifecycleRequestBoundary ||
    record.eventReplayBlockers !==
      sourceLedgerPayload.eventReplayBlockers ||
    record.replayExecutionRecord !== replayExecutionRecord ||
    record.targetClaimingDiagnostic !==
      replayExecutionPayload.targetClaimingDiagnostic ||
    sourceLedgerPayload.replayExecutionRecord !== replayExecutionRecord ||
    sourceLedgerPayload.targetClaimingDiagnostic !==
      replayExecutionPayload.targetClaimingDiagnostic ||
    sourceLedgerPayload.targetDispatchLinkDiagnostic !==
      targetClaimingPayload.targetDispatchLinkDiagnostic
  ) {
    return null;
  }

  return freezeRecord({
    bridge: sourceLedgerPayload.bridge,
    eventReplayBlockers: sourceLedgerPayload.eventReplayBlockers,
    eventReplayPreflightRecord:
      sourceLedgerPayload.eventReplayPreflightRecord,
    hydrationBoundaryRecord: sourceLedgerPayload.hydrationBoundaryRecord,
    ledgerKind,
    lifecycleRequestBoundary: sourceLedgerPayload.lifecycleRequestBoundary,
    preflight: sourceLedgerPayload.preflight,
    replayBlockerCurrentness: record,
    replayExecutionPayload,
    replayExecutionRecord: sourceLedgerPayload.replayExecutionRecord,
    requestRecord: sourceLedgerPayload.requestRecord,
    targetClaimingDiagnostic:
      sourceLedgerPayload.targetClaimingDiagnostic,
    targetClaimingPayload: freezeRecord({
      ...targetClaimingPayload,
      targetClaimingDiagnostic:
        replayExecutionPayload.targetClaimingDiagnostic,
      targetDispatchLinkDiagnostic:
        sourceLedgerPayload.targetDispatchLinkDiagnostic
    }),
    targetClaimingPreflight: sourceLedgerPayload.targetClaimingPreflight,
    targetDispatchLinkDiagnostic:
      sourceLedgerPayload.targetDispatchLinkDiagnostic,
    record
  });
}

function createHydrateRootEventReplaySourceLedgerPayload(
  hydrationBoundaryRecord,
  record,
  ledgerKind,
  targetClaimingPayload,
  replayExecutionPayload,
  replayExecutionRecord
) {
  const sourceLedgerPayload =
    readPrivateHydrateRootSourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind
    );
  if (
    sourceLedgerPayload === null ||
    record.lifecycleRequestBoundary !==
      sourceLedgerPayload.lifecycleRequestBoundary ||
    record.targetClaimingDiagnostic !==
      replayExecutionPayload.targetClaimingDiagnostic ||
    record.replayExecutionRecord !== replayExecutionRecord
  ) {
    return null;
  }

  return freezeRecord({
    bridge: sourceLedgerPayload.bridge,
    hydrationBoundaryRecord: sourceLedgerPayload.hydrationBoundaryRecord,
    ledgerKind,
    lifecycleRequestBoundary: record.lifecycleRequestBoundary,
    preflight: sourceLedgerPayload.preflight,
    replayBlockerCurrentness: sourceLedgerPayload.replayBlockerCurrentness,
    replayExecutionPayload,
    replayExecutionRecord: record.replayExecutionRecord,
    requestRecord: sourceLedgerPayload.requestRecord,
    targetClaimingPayload: freezeRecord({
      ...targetClaimingPayload,
      targetClaimingDiagnostic: replayExecutionPayload.targetClaimingDiagnostic
    }),
    targetClaimingPreflight: record.targetClaimingPreflight,
    record
  });
}

function createHydrateRootExecutionSourceLedgerPayload(
  hydrationBoundaryRecord,
  record,
  ledgerKind,
  replayExecutionPayload,
  replayExecutionRecord
) {
  const sourceLedgerPayload =
    readPrivateHydrateRootSourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind
    );
  if (
    sourceLedgerPayload === null ||
    record.lifecycleRequestBoundary !==
      sourceLedgerPayload.lifecycleRequestBoundary ||
    record.replayExecutionRecord !== replayExecutionRecord
  ) {
    return null;
  }

  return freezeRecord({
    bridge: sourceLedgerPayload.bridge,
    eventReplayPreflight: record.eventReplayPreflight,
    hydrationBoundaryRecord: sourceLedgerPayload.hydrationBoundaryRecord,
    ledgerKind,
    lifecycleRequestBoundary: record.lifecycleRequestBoundary,
    preflight: sourceLedgerPayload.preflight,
    replayBlockerCurrentness: sourceLedgerPayload.replayBlockerCurrentness,
    replayExecutionPayload,
    replayExecutionRecord: record.replayExecutionRecord,
    requestRecord: sourceLedgerPayload.requestRecord,
    record
  });
}

function createHydrateRootLifecycleSourceLedgerPayload(
  hydrationBoundaryRecord,
  record,
  ledgerKind
) {
  const sourceLedgerPayload =
    readPrivateHydrateRootSourceLedgerPayload(
      hydrationBoundaryRecord,
      record,
      ledgerKind
    );
  if (
    sourceLedgerPayload === null ||
    record.requestAdmission !== sourceLedgerPayload.requestAdmission
  ) {
    return null;
  }

  return freezeRecord({
    bridge: sourceLedgerPayload.bridge,
    container: sourceLedgerPayload.container,
    hydrationBoundaryRecord: sourceLedgerPayload.hydrationBoundaryRecord,
    ledgerKind,
    lifecycleContainerSnapshot: record.lifecycleContainerSnapshot,
    preflight: sourceLedgerPayload.preflight,
    requestAdmission: sourceLedgerPayload.requestAdmission,
    requestPayload: sourceLedgerPayload.requestPayload,
    requestRecord: sourceLedgerPayload.requestRecord,
    record
  });
}

function readPrivateHydrateRootSourceLedgerPayload(
  hydrationBoundaryRecord,
  record,
  ledgerKind
) {
  const rootBridge = getPrivateHydrateRootSourceLedgerRootBridgeModule();
  const payload = getPrivateHydrateRootSourceLedgerRootBridgePayload(
    rootBridge,
    record,
    ledgerKind
  );
  const sourceHydrationBoundaryRecord =
    payload &&
    typeof payload === 'object' &&
    payload.hydrationBoundaryRecord
      ? payload.hydrationBoundaryRecord
      : payload &&
          typeof payload === 'object' &&
          payload.requestRecord &&
          typeof payload.requestRecord === 'object'
        ? payload.requestRecord.hydrationBoundaryRecord
        : null;
  if (
    !payload ||
    typeof payload !== 'object' ||
    payload.ledgerKind !== ledgerKind ||
    sourceHydrationBoundaryRecord !== hydrationBoundaryRecord ||
    !payload.requestRecord ||
    typeof payload.requestRecord !== 'object' ||
    payload.requestRecord.hydrationBoundaryRecord !==
      hydrationBoundaryRecord
  ) {
    return null;
  }

  return freezeRecord({
    ...payload,
    hydrationBoundaryRecord,
    ledgerKind,
    record
  });
}

function getPrivateHydrateRootSourceLedgerRootBridgeModule() {
  if (hydrateRootSourceLedgerRootBridgeModule !== null) {
    return hydrateRootSourceLedgerRootBridgeModule;
  }
  try {
    return rememberPrivateHydrateRootSourceLedgerRootBridgeModule();
  } catch (error) {
    return null;
  }
}

function rememberPrivateHydrateRootSourceLedgerRootBridgeModule() {
  if (hydrateRootSourceLedgerRootBridgeModule !== null) {
    return hydrateRootSourceLedgerRootBridgeModule;
  }
  const rootBridgePath = require.resolve('./root-bridge.js');
  const cacheEntry = require.cache[rootBridgePath];
  if (
    cacheEntry &&
    isTrustedPrivateHydrateRootSourceLedgerRootBridgeModule(
      cacheEntry.exports
    ) &&
    isCanonicalPrivateHydrateRootSourceLedgerRootBridgeModule(
      cacheEntry.exports
    ) &&
    isPrivateHydrateRootSourceLedgerRootBridgeCacheEntry(
      rootBridgePath,
      cacheEntry.exports
    )
  ) {
    hydrateRootSourceLedgerRootBridgeModule = cacheEntry.exports;
    return hydrateRootSourceLedgerRootBridgeModule;
  }

  if (
    cacheEntry &&
    !isCanonicalPrivateHydrateRootSourceLedgerRootBridgeModule(
      cacheEntry.exports
    )
  ) {
    delete require.cache[rootBridgePath];
  }
  const rootBridge = require(rootBridgePath);
  const previousRegistrationCandidate =
    hydrateRootSourceLedgerRootBridgeRegistrationCandidate;
  hydrateRootSourceLedgerRootBridgeRegistrationCandidate = rootBridge;
  try {
    requestPrivateHydrateRootSourceLedgerRootBridgeModuleRegistration(
      rootBridge
    );
  } finally {
    hydrateRootSourceLedgerRootBridgeRegistrationCandidate =
      previousRegistrationCandidate;
  }
  if (
    !isTrustedPrivateHydrateRootSourceLedgerRootBridgeModule(rootBridge) ||
    !isCanonicalPrivateHydrateRootSourceLedgerRootBridgeModule(rootBridge) ||
    !isPrivateHydrateRootSourceLedgerRootBridgeCacheEntry(
      rootBridgePath,
      rootBridge
    )
  ) {
    delete require.cache[rootBridgePath];
    return null;
  }
  hydrateRootSourceLedgerRootBridgeModule = rootBridge;
  return hydrateRootSourceLedgerRootBridgeModule;
}

function isCanonicalPrivateHydrateRootSourceLedgerRootBridgeModule(
  rootBridge
) {
  return (
    isPrivateHydrateRootSourceLedgerRootBridgeModule(rootBridge) &&
    rootBridge.CLIENT_ROOT_KIND === 'client' &&
    rootBridge.CONCURRENT_ROOT_TAG === 'ConcurrentRoot' &&
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED ===
      'admitted-private-root-bridge-request-record' &&
    rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED ===
      'blocked-private-root-bridge-execution' &&
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED ===
      'blocked-private-root-bridge-compatibility' &&
    rootBridge.privateRootAdmissionRecordType ===
      'fast.react_dom.private_root_admission_record' &&
    rootBridge.privateRootHydrateRecordType ===
      'fast.react_dom.private_root_hydrate_record' &&
    rootBridge.privateHydrateRootPublicFacadePreflightRecordType ===
      'fast.react_dom.private_hydrate_root_public_facade_preflight_record' &&
    rootBridge.privateHydrateRootPublicFacadeEventReplayPreflightRecordType ===
      'fast.react_dom.private_hydrate_root_public_facade_event_replay_preflight_record' &&
    rootBridge.privateHydrateRootPublicFacadeReplayBlockerCurrentnessRecordType ===
      'fast.react_dom.private_hydrate_root_public_facade_replay_blocker_currentness_record' &&
    rootBridge.privateHydrateRootPublicFacadeExecutionPreflightRecordType ===
      'fast.react_dom.private_hydrate_root_public_facade_execution_preflight_record' &&
    typeof rootBridge.admitPrivateCreateRenderPath === 'function' &&
    typeof rootBridge.admitRootBridgeRequestRecord === 'function' &&
    typeof rootBridge.createHydrateRootRecord === 'function' &&
    typeof rootBridge.createPrivateRootPublicFacadePreflight === 'function' &&
    typeof rootBridge.getPrivateRootRecordPayload === 'function' &&
    typeof rootBridge.isPrivateRootBridgeAdmissionRecord === 'function' &&
    typeof rootBridge.renderPrivateRootHostOutput === 'function'
  );
}

function isCanonicalPrivateHydrateRootSourceLedgerRootBridgeRegistrationCandidate(
  rootBridge
) {
  if (hydrateRootSourceLedgerRootBridgeModule !== null) {
    return rootBridge === hydrateRootSourceLedgerRootBridgeModule;
  }
  return rootBridge === hydrateRootSourceLedgerRootBridgeRegistrationCandidate;
}

function isPrivateHydrateRootSourceLedgerRootBridgeCacheEntry(
  rootBridgePath,
  rootBridge
) {
  const cacheEntry = require.cache[rootBridgePath];
  const path = require('node:path');
  if (
    !cacheEntry ||
    !(cacheEntry instanceof module.constructor) ||
    cacheEntry.filename !== rootBridgePath ||
    cacheEntry.loaded !== true ||
    cacheEntry.path !== path.dirname(rootBridgePath)
  ) {
    return false;
  }
  const exportsDescriptor = Object.getOwnPropertyDescriptor(
    cacheEntry,
    'exports'
  );
  return (
    exportsDescriptor !== undefined &&
    exportsDescriptor.value === rootBridge &&
    exportsDescriptor.writable === false &&
    exportsDescriptor.configurable === false
  );
}

function isPrivateHydrateRootSourceLedgerRootBridgeModule(rootBridge) {
  return (
    rootBridge &&
    typeof rootBridge === 'object' &&
    Object.isFrozen(rootBridge) &&
    rootBridge.ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_PREFLIGHT_ACCEPTED_CAPABILITIES !==
      undefined &&
    rootBridge.ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_PREFLIGHT_BLOCKED_CAPABILITIES !==
      undefined &&
    typeof rootBridge.createPrivateHydrateRootPublicFacadePreflight ===
      'function' &&
    typeof rootBridge.createPrivateRootBridgeShell === 'function' &&
    typeof rootBridge.isPrivateHydrateRootPublicFacadePreflightRecord ===
      'function' &&
    typeof rootBridge
      .getPrivateHydrateRootPublicFacadePreflightRecordPayload ===
      'function' &&
    typeof rootBridge
      .isPrivateHydrateRootPublicFacadeEventReplayPreflightRecord ===
      'function' &&
    typeof rootBridge
      .getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload ===
      'function' &&
    typeof rootBridge
      .isPrivateHydrateRootPublicFacadeReplayBlockerCurrentnessRecord ===
      'function' &&
    typeof rootBridge
      .getPrivateHydrateRootPublicFacadeReplayBlockerCurrentnessPayload ===
      'function' &&
    typeof rootBridge
      .isPrivateHydrateRootPublicFacadeExecutionPreflightRecord ===
      'function' &&
    typeof rootBridge
      .getPrivateHydrateRootPublicFacadeExecutionPreflightPayload ===
      'function' &&
    typeof rootBridge
      .isPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryRecord ===
      'function' &&
    typeof rootBridge
      .getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload ===
      'function' &&
    typeof rootBridge.readPrivateHydrateRootPublicFacadeSourceLedgerPayload ===
      'function'
  );
}

function registerPrivateHydrateRootSourceLedgerRootBridgeModule(
  rootBridge,
  authorityToken
) {
  if (
    !rootBridge ||
    (typeof rootBridge !== 'object' && typeof rootBridge !== 'function') ||
    !authorityToken ||
    (typeof authorityToken !== 'object' &&
      typeof authorityToken !== 'function') ||
    !isPrivateHydrateRootSourceLedgerRootBridgeModule(rootBridge) ||
    (rootBridge !== hydrateRootSourceLedgerRootBridgeModule &&
      rootBridge !== hydrateRootSourceLedgerRootBridgeRegistrationCandidate)
  ) {
    return false;
  }
  trustPrivateHydrateRootSourceLedgerRootBridgeModule(
    rootBridge,
    authorityToken
  );
  hydrateRootSourceLedgerRootBridgeModule = rootBridge;
  return true;
}

function requestPrivateHydrateRootSourceLedgerRootBridgeModuleRegistration(
  rootBridge
) {
  if (
    !isCanonicalPrivateHydrateRootSourceLedgerRootBridgeRegistrationCandidate(
      rootBridge
    ) ||
    typeof rootBridge
      .registerPrivateHydrateRootSourceLedgerRootBridgeModule !== 'function'
  ) {
    return false;
  }
  const previousRegistrationCandidate =
    hydrateRootSourceLedgerRootBridgeRegistrationCandidate;
  hydrateRootSourceLedgerRootBridgeRegistrationCandidate = rootBridge;
  try {
    return (
      rootBridge.registerPrivateHydrateRootSourceLedgerRootBridgeModule(
        registerPrivateHydrateRootSourceLedgerRootBridgeModule
      ) === true &&
      isTrustedPrivateHydrateRootSourceLedgerRootBridgeModule(rootBridge)
    );
  } finally {
    hydrateRootSourceLedgerRootBridgeRegistrationCandidate =
      previousRegistrationCandidate;
  }
}

function trustPrivateHydrateRootSourceLedgerRootBridgeModule(
  rootBridge,
  authorityToken
) {
  if (
    rootBridge &&
    (typeof rootBridge === 'object' || typeof rootBridge === 'function') &&
    authorityToken &&
    (typeof authorityToken === 'object' ||
      typeof authorityToken === 'function') &&
    isCanonicalPrivateHydrateRootSourceLedgerRootBridgeModule(rootBridge)
  ) {
    hydrateRootSourceLedgerRootBridgeModules.add(rootBridge);
    hydrateRootSourceLedgerRootBridgeAuthorityTokens.set(
      rootBridge,
      authorityToken
    );
  }
}

function isTrustedPrivateHydrateRootSourceLedgerRootBridgeModule(
  rootBridge
) {
  return (
    rootBridge &&
    (typeof rootBridge === 'object' || typeof rootBridge === 'function') &&
    hydrateRootSourceLedgerRootBridgeModules.has(rootBridge) &&
    isCanonicalPrivateHydrateRootSourceLedgerRootBridgeModule(rootBridge)
  );
}

function getPrivateHydrateRootSourceLedgerRootBridgePayload(
  rootBridge,
  record,
  ledgerKind
) {
  if (
    !rootBridge ||
    typeof rootBridge !== 'object' ||
    !isPrivateHydrateRootSourceLedgerRootBridgeModule(rootBridge) ||
    !record ||
    typeof record !== 'object' ||
    !Object.isFrozen(record) ||
    typeof ledgerKind !== 'string'
  ) {
    return null;
  }

  try {
    const payload =
      rootBridge.readPrivateHydrateRootPublicFacadeSourceLedgerPayload(
        record,
        ledgerKind
      );
    const authorityToken =
      hydrateRootSourceLedgerRootBridgeAuthorityTokens.get(rootBridge);
    if (
      !payload ||
      typeof payload !== 'object' ||
      authorityToken === undefined ||
      payload.sourceLedgerAuthorityToken !== authorityToken
    ) {
      return null;
    }
    const {sourceLedgerAuthorityToken, ...trustedPayload} = payload;
    return trustedPayload;
  } catch (error) {
    return null;
  }
}

function isHydrationRecoverableErrorBoundaryAdmissionHydrateRootPreflight(
  record
) {
  return (
    record &&
    typeof record === 'object' &&
    Object.isFrozen(record) &&
    record.kind ===
      'FastReactDomPrivateHydrateRootPublicFacadePreflightRecord' &&
    record.facadeCall === 'hydrateRoot' &&
    record.requestType === 'hydrateRoot' &&
    record.preflightStatus ===
      'accepted-private-react-dom-client-root-public-facade-preflight' &&
    record.executionStatus === 'blocked-private-root-bridge-execution' &&
    record.compatibilityStatus ===
      'blocked-private-root-bridge-compatibility' &&
    record.recoverableErrorPreflightAccepted === true &&
    record.markerListenerPreconditionsAccepted === true &&
    record.markerListenerStateUnchanged === true &&
    record.lifecycleRequestBoundaryAccepted === true &&
    record.lifecycleRequestBoundarySourceOwned === true &&
    record.lifecycleContainerSnapshotOwned === true &&
    record.requestAdmissionStatus ===
      'admitted-private-root-bridge-request-record' &&
    record.publicHydrateRootEnabled === false &&
    record.publicRootCreated === false &&
    record.nativeExecution === false &&
    record.reconcilerExecution === false &&
    record.domMutation === false &&
    record.markerWrites === false &&
    record.listenerInstallation === false &&
    record.hydration === false &&
    record.eventDispatch === false &&
    record.compatibilityClaimed === false
  );
}

function isHydrationRecoverableErrorBoundaryAdmissionEventReplayPreflight(
  record
) {
  return (
    record &&
    typeof record === 'object' &&
    Object.isFrozen(record) &&
    record.kind ===
      'FastReactDomPrivateHydrateRootPublicFacadeEventReplayPreflightRecord' &&
    record.facadeCall === 'hydrateRoot' &&
    record.requestType === 'hydrateRoot' &&
    record.preflightStatus ===
      'preflighted-private-hydrate-root-public-facade-event-replay-gate' &&
    record.executionStatus === 'blocked-private-root-bridge-execution' &&
    record.compatibilityStatus ===
      'blocked-private-root-bridge-compatibility' &&
    record.preconditions &&
    record.preconditions.accepted === true &&
    record.preconditions.stateUnchanged === true &&
    record.replayExecutionPayloadAccepted === true &&
    record.replayBlockerCurrentnessAccepted === true &&
    record.replayBlockerReportAccepted === true &&
    record.replayBlockerReportCurrent === true &&
    record.rootListenerReplayAliasRejected === true &&
    record.lifecycleRequestBoundaryAccepted === true &&
    record.lifecycleRequestBoundarySourceOwned === true &&
    record.lifecycleContainerSnapshotOwned === true &&
    record.targetClaimAccepted === true &&
    record.targetClaimExecuted === false &&
    record.replayTargetDispatchExecutionBlocked === true &&
    record.eventReplaySupported === false &&
    record.hydrationReplaySupported === false &&
    record.eventReplayInstalled === false &&
    record.replayQueuesDrained === false &&
    record.eventsReplayed === false &&
    record.eventDispatch === false &&
    record.publicRootCreated === false &&
    record.publicRootExecution === false &&
    record.nativeExecution === false &&
    record.reconcilerExecution === false &&
    record.domMutation === false &&
    record.rootScheduled === false &&
    record.browserDomEventCompatibilityClaimed === false &&
    record.publicHydrationCompatibilityClaimed === false &&
    record.publicHydrationReplayCompatibilityClaimed === false &&
    record.compatibilityClaimed === false
  );
}

function isHydrationRecoverableErrorBoundaryAdmissionExecutionPreflight(
  record
) {
  return (
    record &&
    typeof record === 'object' &&
    Object.isFrozen(record) &&
    record.kind ===
      'FastReactDomPrivateHydrateRootPublicFacadeExecutionPreflightRecord' &&
    record.facadeCall === 'hydrateRoot' &&
    record.requestType === 'hydrateRoot' &&
    record.preflightStatus ===
      'preflighted-private-hydrate-root-public-facade-execution-gate' &&
    record.executionStatus === 'blocked-private-root-bridge-execution' &&
    record.compatibilityStatus ===
      'blocked-private-root-bridge-compatibility' &&
    record.executionPreflightAccepted === true &&
    record.eventReplayPreconditionsAccepted === true &&
    record.eventReplayStateUnchanged === true &&
    record.replayExecutionPayloadAccepted === true &&
    record.replayBlockerCurrentnessAccepted === true &&
    record.replayBlockerReportAccepted === true &&
    record.replayBlockerReportCurrent === true &&
    record.rootListenerReplayAliasRejected === true &&
    record.lifecycleRequestBoundaryAccepted === true &&
    record.lifecycleRequestBoundarySourceOwned === true &&
    record.lifecycleContainerSnapshotOwned === true &&
    record.targetClaimAccepted === true &&
    record.targetClaimExecuted === false &&
    record.replayTargetDispatchExecutionBlocked === true &&
    record.eventReplayInstalled === false &&
    record.replayQueuesDrained === false &&
    record.eventsReplayed === false &&
    record.eventDispatch === false &&
    record.recoverableErrorsQueued === false &&
    record.onRecoverableErrorInvoked === false &&
    record.publicOnRecoverableErrorInvoked === false &&
    record.rootErrorCallbackInvocationCount === 0 &&
    record.publicHydrateRootSupported === false &&
    record.publicRootExecution === false &&
    record.publicRootCreated === false &&
    record.nativeExecution === false &&
    record.reconcilerExecution === false &&
    record.domMutation === false &&
    record.rootScheduled === false &&
    record.browserDomEventCompatibilityClaimed === false &&
    record.publicHydrationCompatibilityClaimed === false &&
    record.publicHydrationReplayCompatibilityClaimed === false &&
    record.hydration === false &&
    record.compatibilityClaimed === false
  );
}

function isHydrationRecoverableErrorBoundaryAdmissionLifecycleBoundary(
  record
) {
  return (
    record &&
    typeof record === 'object' &&
    Object.isFrozen(record) &&
    record.kind ===
      'FastReactDomPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryRecord' &&
    record.facadeCall === 'hydrateRoot' &&
    record.requestType === 'hydrateRoot' &&
    record.boundaryStatus ===
      'accepted-private-hydrate-root-public-facade-lifecycle-request-boundary' &&
    record.sourceOwned === true &&
    record.active === true &&
    record.sourceTokenOwnership === 'weakmap-root-bridge-admission' &&
    record.requestAdmissionStatus ===
      'admitted-private-root-bridge-request-record' &&
    record.lifecyclePrerequisitesAccepted === true &&
    record.lifecycleStatusBefore === null &&
    record.lifecycleStatusAfter === UNSUPPORTED_HYDRATION_ROOT_KIND &&
    record.lifecycleTransition === 'none->unsupported-hydration' &&
    record.lifecycleContainerSnapshotOwned === true &&
    record.publicHydrateRootEnabled === false &&
    record.publicHydrateRootSupported === false &&
    record.publicRootCreated === false &&
    record.publicRootExecution === false &&
    record.nativeExecution === false &&
    record.reconcilerExecution === false &&
    record.domMutation === false &&
    record.markerWrites === false &&
    record.listenerInstallation === false &&
    record.hydration === false &&
    record.eventDispatch === false &&
    record.compatibilityClaimed === false &&
    record.publicHydrationCompatibilityClaimed === false &&
    record.publicHydrationReplayCompatibilityClaimed === false &&
    record.lifecycleContainerSnapshot &&
    typeof record.lifecycleContainerSnapshot === 'object'
  );
}

function isHydrationRecoverableErrorBoundaryAdmissionReplayBlockerCurrentness(
  record
) {
  return (
    record &&
    typeof record === 'object' &&
    Object.isFrozen(record) &&
    record.kind ===
      'FastReactDomPrivateHydrateRootReplayBlockerCurrentnessRecord' &&
    record.facadeCall === 'hydrateRoot' &&
    record.requestType === 'hydrateRoot' &&
    record.status ===
      'accepted-private-hydrate-root-replay-blocker-currentness' &&
    record.currentnessStatus ===
      'accepted-private-hydrate-root-replay-blocker-currentness' &&
    record.sourceOwned === true &&
    record.diagnosticOnly === true &&
    record.readOnly === true &&
    record.replayBlockerReportAccepted === true &&
    record.replayBlockerReportSourceOwned === true &&
    record.replayBlockerReportCurrent === true &&
    record.lifecycleRequestBoundaryAccepted === true &&
    record.lifecycleRequestBoundarySourceOwned === true &&
    record.lifecycleContainerSnapshotOwned === true &&
    record.lifecycleContainerSnapshotCurrent === true &&
    record.markerListenerStateCurrent === true &&
    record.rootListenerReplayAliasRejected === true &&
    record.rootListenerStateDoesNotProveReplay === true &&
    record.rootListenerDispatchAliasAccepted === false &&
    record.sourceLedgerRequired === true &&
    record.hydrateRootPreflightSourceLedgerRequired === true &&
    record.eventReplayPreflightSourceLedgerRequired === true &&
    record.executionPreflightSourceLedgerRequired === true &&
    record.lifecycleSourceLedgerRequired === true &&
    record.replayBlockerSourceLedgerRequired === true &&
    record.targetClaimAccepted === true &&
    record.targetClaimExecuted === false &&
    record.replayExecutionAccepted === true &&
    record.replayTargetDispatchExecutionBlocked === true &&
    record.eventReplayBlockers &&
    typeof record.eventReplayBlockers === 'object' &&
    Object.isFrozen(record.eventReplayBlockers) &&
    record.eventReplayBlockers.kind ===
      'FastReactDomHydrationEventReplayBlockers' &&
    record.eventReplayBlockers.status ===
      'blocked-after-private-root-and-event-gates' &&
    record.eventReplayBlockers.compatibilityClaimed === false &&
    record.eventReplayBlockers.browserDomEventCompatibilityClaimed === false &&
    record.eventReplayBlockers.publicHydrationCompatibilityClaimed === false &&
    record.eventReplayBlockers
      .publicHydrationReplayCompatibilityClaimed === false &&
    record.eventReplayBlockers.publicHydrateRootSupported === false &&
    record.eventReplayBlockers.publicRootExecution === false &&
    record.eventReplayBlockers.publicRootCreated === false &&
    record.eventReplayBlockers.publicRootObjectExposed === false &&
    record.eventReplayBlockers.publicPackageCompatibilityClaimed === false &&
    record.eventReplayBlockers.packageCompatibility === false &&
    record.eventReplayBlockers.nativeExecution === false &&
    record.eventReplayBlockers.rustExecution === false &&
    record.eventReplayBlockers.reconcilerExecution === false &&
    record.eventReplayBlockers.rootScheduled === false &&
    record.eventReplayBlockers.hydration === false &&
    record.eventReplayBlockers.domMutation === false &&
    record.eventReplayBlockers.domMutated === false &&
    record.eventReplayBlockers.browserDomMutation === false &&
    record.eventReplayBlockers.eventDispatch === false &&
    record.eventReplayBlockers.eventReplayInstalled === false &&
    record.eventReplayBlockers.eventReplaySupported === false &&
    record.eventReplayBlockers.hydrationReplaySupported === false &&
    record.eventReplayBlockers.eventsReplayed === false &&
    record.eventReplayBlockers.replayQueuesDrained === false &&
    record.eventReplayBlockers.rootListenerReplayAliasAccepted === false &&
    record.compatibilityClaimed === false &&
    record.browserDomEventCompatibilityClaimed === false &&
    record.publicHydrationCompatibilityClaimed === false &&
    record.publicHydrationReplayCompatibilityClaimed === false &&
    record.publicHydrateRootSupported === false &&
    record.publicRootExecution === false &&
    record.publicRootObjectExposed === false &&
    record.publicRootCreated === false &&
    record.publicPackageCompatibilityClaimed === false &&
    record.packageCompatibility === false &&
    record.nativeExecution === false &&
    record.rustExecution === false &&
    record.reconcilerExecution === false &&
    record.rootScheduled === false &&
    record.hydration === false &&
    record.canHydrate === false &&
    record.domMutation === false &&
    record.domMutated === false &&
    record.browserDomMutation === false &&
    record.eventDispatch === false &&
    record.eventReplayInstalled === false &&
    record.eventReplaySupported === false &&
    record.hydrationReplaySupported === false &&
    record.eventsReplayed === false &&
    record.replayQueuesDrained === false &&
    record.recoverableErrorsQueued === false &&
    record.onRecoverableErrorInvoked === false &&
    record.publicOnRecoverableErrorInvoked === false
  );
}

function getHydrationRecoverableErrorBoundaryAdmissionChildCount(
  container
) {
  if (!container || typeof container !== 'object') {
    return 0;
  }
  const childNodes = container.childNodes;
  if (Array.isArray(childNodes)) {
    return childNodes.length;
  }
  if (
    childNodes &&
    typeof childNodes === 'object' &&
    Number.isSafeInteger(childNodes.length) &&
    childNodes.length >= 0
  ) {
    return childNodes.length;
  }
  return 0;
}

function throwInvalidHydrationRecoverableErrorBoundaryAdmission(message) {
  const error = new Error(message);
  error.code = INVALID_HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_CODE;
  throw error;
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
  const sequence = gateState.nextRecordSequence++;
  const recordId = `${gateState.recordIdPrefix}:${sequence}`;
  const markerDiagnostics = inspectHydrationContainerMarkers(
    container,
    gateState
  );
  const markerParserEvidence =
    createHydrationMarkerParserEvidence(markerDiagnostics);
  const markerEvidence = createHydrationMarkerEvidence(markerDiagnostics);
  const textMismatchDiagnostics = createHydrationTextMismatchDiagnostics({
    container,
    hydrationOptions,
    initialChildren,
    markerDiagnostics,
    recordId
  });
  const recoverableErrorMetadata =
    textMismatchDiagnostics.recoverableErrorMetadata;

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
  const eventReplayOwnershipDiagnostics =
    createHydrationReplayOwnershipGateDiagnosticFromQueue({
      eventReplayQueueDiagnostics,
      recordId,
      rootKind: UNSUPPORTED_HYDRATION_ROOT_KIND,
      rootTag: CONCURRENT_ROOT_TAG,
      source: 'unsupported-hydrate-root-boundary-record'
    });
  const eventReplayBlockers = createHydrationEventReplayBlockers({
    eventReplayQueueDiagnostics,
    eventReplayOwnershipDiagnostics,
    listenerGuard,
    markerDiagnostics,
    markerParserEvidence,
    replayQueueDiagnostics,
    targetResolutionDiagnostics
  });
  const acceptedPrivateMetadataDiagnostics =
    createHydrationBoundaryAcceptedMetadataDiagnostics({
      eventReplayOwnershipDiagnostics,
      recordId
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
    textMismatchDiagnostics,
    recoverableErrorMetadata,
    replayQueueDiagnostics,
    targetResolutionDiagnostics,
    eventReplayQueueDiagnostics,
    eventReplayOwnershipDiagnostics,
    eventReplayBlockers,
    acceptedPrivateMetadataDiagnostics,
    acceptedPrivateMetadataIds:
      acceptedPrivateMetadataDiagnostics.metadataIds,
    acceptedPrivateMetadataGateIds:
      acceptedPrivateMetadataDiagnostics.gateIds,
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
          markerId: marker.markerId,
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

function createHydrationTextMismatchDiagnostics({
  container,
  hydrationOptions,
  initialChildren,
  markerDiagnostics,
  recordId
}) {
  const expectedTextRows = collectExpectedHydrationTextRows(initialChildren);
  const actualTextRows = collectActualHydrationTextRows(container);
  const mismatchRows = createHydrationTextMismatchRows({
    actualTextRows,
    expectedTextRows,
    recordId
  });
  const recoverableErrorMetadata =
    createHydrationTextMismatchRecoverableErrorMetadata({
      hydrationOptions,
      mismatchRows,
      recordId
    });

  return freezeRecord({
    kind: HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND,
    status:
      mismatchRows.length === 0
        ? 'blocked-no-hydration-text-mismatches-recorded'
        : 'blocked-hydration-text-mismatches-recorded',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    canHydrate: false,
    hydrateTextInstanceCalled: false,
    diffHydratedTextForDevWarningsCalled: false,
    recoverableErrorsQueued: false,
    onRecoverableErrorInvoked: false,
    publicRootCreated: false,
    domMutated: false,
    textPatched: false,
    boundaryCleared: false,
    blockedReason: HYDRATION_TEXT_MISMATCH_BLOCKED_REASON,
    rootRecordId: recordId,
    source: 'unsupported-hydrate-root-boundary-record',
    expectedTextSource: 'initialChildren',
    actualTextSource: 'container.childNodes text nodes depth-first',
    markerDiagnosticsAccepted:
      markerDiagnostics.status === 'diagnostic-only',
    acceptedMarkerCount: markerDiagnostics.acceptedMarkerCount,
    expectedTextRowCount: expectedTextRows.length,
    actualTextRowCount: actualTextRows.length,
    mismatchCount: mismatchRows.length,
    expectedTextRows,
    actualTextRows,
    mismatchRows,
    recoverableErrorMetadata
  });
}

function collectExpectedHydrationTextRows(initialChildren) {
  const state = {
    rows: [],
    visitedObjects: new Set()
  };
  collectExpectedHydrationTextValue(initialChildren, 'initialChildren', state);
  return freezeArray(state.rows);
}

function collectExpectedHydrationTextValue(value, path, state) {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    state.rows.push(
      createHydrationTextRow({
        index: state.rows.length,
        path,
        source: 'client-expected',
        text: String(value)
      })
    );
    return;
  }

  if (value == null || typeof value !== 'object') {
    return;
  }

  if (state.visitedObjects.has(value)) {
    return;
  }
  state.visitedObjects.add(value);

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      collectExpectedHydrationTextValue(
        value[index],
        `${path}[${index}]`,
        state
      );
    }
    return;
  }

  const props = value.props;
  if (props != null && typeof props === 'object') {
    if (state.visitedObjects.has(props)) {
      return;
    }
    state.visitedObjects.add(props);
    if (Object.prototype.hasOwnProperty.call(props, 'children')) {
      collectExpectedHydrationTextValue(
        props.children,
        `${path}.props.children`,
        state
      );
    }
    return;
  }

  if (Object.prototype.hasOwnProperty.call(value, 'children')) {
    collectExpectedHydrationTextValue(
      value.children,
      `${path}.children`,
      state
    );
  }
}

function collectActualHydrationTextRows(container) {
  const state = {
    rows: [],
    visitedObjects: new Set()
  };
  collectActualHydrationTextNode(container, 'container', state);
  return freezeArray(state.rows);
}

function collectActualHydrationTextNode(node, path, state) {
  if (node == null || typeof node !== 'object') {
    return;
  }
  if (state.visitedObjects.has(node)) {
    return;
  }
  state.visitedObjects.add(node);

  if (node.nodeType === TEXT_NODE) {
    state.rows.push(
      createHydrationTextRow({
        index: state.rows.length,
        path,
        source: 'server-actual',
        text: readTextNodeValue(node)
      })
    );
    return;
  }

  const childNodes = Array.isArray(node.childNodes) ? node.childNodes : [];
  for (let index = 0; index < childNodes.length; index++) {
    collectActualHydrationTextNode(
      childNodes[index],
      `${path}.childNodes[${index}]`,
      state
    );
  }
}

function readTextNodeValue(node) {
  if (typeof node.nodeValue === 'string') {
    return node.nodeValue;
  }
  if (typeof node.data === 'string') {
    return node.data;
  }
  if (typeof node.textContent === 'string') {
    return node.textContent;
  }
  return '';
}

function createHydrationTextRow({index, path, source, text}) {
  const normalizedText = normalizeHydrationText(text);
  return freezeRecord({
    index,
    path,
    source,
    text,
    textLength: text.length,
    normalizedText,
    normalizedTextLength: normalizedText.length
  });
}

function createHydrationTextMismatchRows({
  actualTextRows,
  expectedTextRows,
  recordId
}) {
  const rows = [];
  const rowCount = Math.max(expectedTextRows.length, actualTextRows.length);
  for (let index = 0; index < rowCount; index++) {
    const expected = expectedTextRows[index] || null;
    const actual = actualTextRows[index] || null;
    if (expected !== null && actual !== null) {
      const exactTextMatches = actual.text === expected.text;
      const normalizedTextMatches =
        actual.normalizedText === expected.normalizedText;
      if (normalizedTextMatches) {
        continue;
      }
      rows.push(
        createHydrationTextMismatchRow({
          actual,
          exactTextMatches,
          expected,
          index,
          normalizedTextMatches,
          reason: 'text-content-different',
          recordId
        })
      );
      continue;
    }

    rows.push(
      createHydrationTextMismatchRow({
        actual,
        exactTextMatches: false,
        expected,
        index,
        normalizedTextMatches: false,
        reason:
          expected === null
            ? 'unexpected-server-text'
            : 'missing-server-text',
        recordId
      })
    );
  }
  return freezeArray(rows);
}

function createHydrationTextMismatchRow({
  actual,
  exactTextMatches,
  expected,
  index,
  normalizedTextMatches,
  reason,
  recordId
}) {
  return freezeRecord({
    rowId: `${recordId}:text-mismatch:${index}`,
    index,
    status: 'blocked-before-hydrate-text-instance',
    reason,
    expectedPath: expected === null ? null : expected.path,
    actualPath: actual === null ? null : actual.path,
    expectedText: expected === null ? null : expected.text,
    actualText: actual === null ? null : actual.text,
    normalizedExpectedText: expected === null ? null : expected.normalizedText,
    normalizedActualText: actual === null ? null : actual.normalizedText,
    exactTextMatches,
    normalizedTextMatches,
    recoverable: true,
    canHydrate: false,
    hydrateTextInstanceCalled: false,
    willPatchText: false,
    domMutated: false,
    recoverableErrorMetadataId: `${recordId}:recoverable-error:${index}`
  });
}

function createHydrationTextMismatchRecoverableErrorMetadata({
  hydrationOptions,
  mismatchRows,
  recordId
}) {
  const recoverableErrorRows = freezeArray(
    mismatchRows.map((row, index) =>
      freezeRecord({
        id: `${recordId}:recoverable-error:${index}`,
        textMismatchRowId: row.rowId,
        status: 'metadata-recorded-callback-not-invoked',
        errorName: 'Error',
        messageCategory: 'hydration-text-mismatch',
        messageTemplate:
          'Hydration failed because the server rendered text did not match the client.',
        errorInfo: freezeRecord({
          componentStack: null,
          digest: null
        }),
        sourceFiber: null,
        queuedRecoverableError: false,
        onRecoverableErrorInvoked: false,
        publicCallbackInvoked: false,
        recoveredByClientRender: false,
        surfacedToUI: false
      })
    )
  );

  return freezeRecord({
    kind: HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND,
    status:
      recoverableErrorRows.length === 0
        ? 'blocked-no-hydration-text-mismatch-recoverable-errors-recorded'
        : 'blocked-hydration-text-mismatch-recoverable-error-metadata-recorded',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    blockedReason: HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON,
    rootRecordId: recordId,
    source:
      'ReactFiberHydrationContext.throwOnHydrationMismatch/queueRecoverableErrors',
    onRecoverableErrorOption: describeRecoverableErrorOption(
      hydrationOptions
    ),
    recoverableErrorMetadataCount: recoverableErrorRows.length,
    queuedRecoverableErrorCount: 0,
    onRecoverableErrorInvocationCount: 0,
    wouldQueueRecoverableErrorCount: recoverableErrorRows.length,
    recoverableErrorRows,
    recoverableErrorsQueued: false,
    onRecoverableErrorInvoked: false,
    publicRootCreated: false,
    hydratingPublicRoot: false,
    domMutated: false
  });
}

function describeRecoverableErrorOption(hydrationOptions) {
  const hasOptions =
    hydrationOptions !== null &&
    typeof hydrationOptions === 'object' &&
    !Array.isArray(hydrationOptions);
  const hasCallback =
    hasOptions &&
    Object.prototype.hasOwnProperty.call(
      hydrationOptions,
      'onRecoverableError'
    );
  const callback =
    hasCallback === true ? hydrationOptions.onRecoverableError : undefined;

  return freezeRecord({
    present: hasCallback,
    callbackInfo: hasCallback ? describeHydrationValue(callback) : null,
    callbackInvoked: false,
    publicCallbackInvoked: false,
    invocationBlockedReason:
      HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON
  });
}

function normalizeHydrationText(text) {
  return text.replace(/\r\n?/g, '\n').replace(/\u0000|\uFFFD/g, '');
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
  eventReplayOwnershipDiagnostics,
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
    browserDomEventCompatibilityClaimed: false,
    publicHydrationCompatibilityClaimed: false,
    publicHydrationReplayCompatibilityClaimed: false,
    publicHydrateRootSupported: false,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    publicRootCreated: false,
    publicRootCompatibilitySurface: false,
    publicPackageCompatibilityClaimed: false,
    packageCompatibility: false,
    nativeExecution: false,
    rustExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    suspenseHydrationScheduled: false,
    hydration: false,
    canHydrate: false,
    domMutation: false,
    domMutated: false,
    browserDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    listenersAttached: false,
    eventDispatch: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    eventsReplayed: false,
    replayQueueDrained: false,
    replayQueuesDrained: false,
    queueMutationAllowed: false,
    explicitHydrationTargetsQueued: false,
    continuousEventReplayQueued: false,
    formReplayQueued: false,
    recoverableErrorsQueued: false,
    onRecoverableErrorInvoked: false,
    publicOnRecoverableErrorInvoked: false,
    rootListenerReplayAliasAccepted: false,
    rootListenerStateDoesNotProveReplay: true,
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
    eventReplayOwnershipDiagnostics,
    eventReplayOwnershipDiagnosticsAccepted:
      eventReplayOwnershipDiagnostics.kind ===
      HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND,
    replayOwnershipRowCount:
      eventReplayOwnershipDiagnostics.ownershipRowCount,
    ownershipRetainedThroughDrainOrder:
      eventReplayOwnershipDiagnostics.ownershipRetainedThroughDrainOrder,
    rootOwnershipRetainedCount:
      eventReplayOwnershipDiagnostics.rootOwnershipRetainedCount,
    dehydratedBoundaryOwnershipRetainedCount:
      eventReplayOwnershipDiagnostics
        .dehydratedBoundaryOwnershipRetainedCount,
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

function createHydrationBoundaryAcceptedMetadataDiagnostics({
  eventReplayOwnershipDiagnostics,
  recordId
}) {
  const metadataRows = freezeArray(
    acceptedHydrationBoundaryMetadataContracts.map((contract) =>
      createHydrationBoundaryAcceptedMetadataRow(contract)
    )
  );
  const metadataIds = freezeArray(
    metadataRows.map((row) => row.metadataId)
  );
  const gateIds = freezeArray(metadataRows.map((row) => row.gateId));

  return freezeRecord({
    kind: HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND,
    gateId: privateHydrationBoundaryAcceptedMetadataGateId,
    status: privateHydrationBoundaryAcceptedMetadataStatus,
    source: 'unsupported-hydrate-root-boundary-record',
    rootRecordId: recordId,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    comparedToReactDomOracle: false,
    publicRootCompatibilitySurface: false,
    publicRootRenderCompatibilityClaimed: false,
    publicHydrationCompatibilityClaimed: false,
    publicHydrationReplayCompatibilityClaimed: false,
    publicEventCompatibilityClaimed: false,
    publicResourceCompatibilityClaimed: false,
    publicResourceDomInsertionCompatibilityClaimed: false,
    publicStylesheetCompatibilityClaimed: false,
    publicFormCompatibilityClaimed: false,
    publicFormActionCompatibilityClaimed: false,
    publicFormResetCompatibilityClaimed: false,
    publicControlledInputCompatibilityClaimed: false,
    hydrationReplaySupported: false,
    eventReplayInstalled: false,
    eventsReplayed: false,
    rootScheduled: false,
    resourceDomInsertion: false,
    resourceMapsCreated: false,
    resourceMapCommitted: false,
    stylesheetLoadListenersInstalled: false,
    stylesheetErrorListenersInstalled: false,
    stylesheetFetchStarted: false,
    stylesheetCommitSuspended: false,
    formActionEventPluginInvoked: false,
    formActionExtracted: false,
    formDataConstructed: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    resetUpdateEnqueued: false,
    resetQueueCommitted: false,
    formResetCommitted: false,
    realFormReset: false,
    metadataIdCount: metadataRows.length,
    metadataIds,
    gateIds,
    acceptedRecordTypes: freezeArray(
      metadataRows.map((row) => row.recordType)
    ),
    acceptedStatuses: freezeArray(
      metadataRows.map((row) => row.acceptedStatus)
    ),
    hydrationOwnership: freezeRecord({
      metadataId: 'hydration-replay-ownership',
      gateId: privateHydrationReplayOwnershipGateId,
      diagnosticKind: eventReplayOwnershipDiagnostics.kind,
      diagnosticStatus: eventReplayOwnershipDiagnostics.status,
      diagnosticSource: eventReplayOwnershipDiagnostics.source,
      ownershipRowCount: eventReplayOwnershipDiagnostics.ownershipRowCount,
      ownershipRetainedCount:
        eventReplayOwnershipDiagnostics.ownershipRetainedCount,
      ownershipRetainedThroughDrainOrder:
        eventReplayOwnershipDiagnostics.ownershipRetainedThroughDrainOrder,
      hydrationReplaySupported: false,
      eventsReplayed: false,
      compatibilityClaimed: false
    }),
    metadataRows,
    blockedCapabilities: hydrationBoundaryAcceptedMetadataBlockers
  });
}

function createHydrationBoundaryAcceptedMetadataRow(contract) {
  return freezeRecord({
    metadataId: contract.metadataId,
    category: contract.category,
    gateId: contract.gateId,
    recordType: contract.recordType,
    acceptedStatus: contract.acceptedStatus,
    blockedReason: contract.blockedReason,
    reason: contract.reason,
    metadataRecognized: true,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    publicCompatibilityClaimed: false,
    publicRootRenderCompatibilityClaimed: false,
    publicHydrationCompatibilityClaimed: false,
    publicResourceCompatibilityClaimed: false,
    publicFormCompatibilityClaimed: false,
    promotesHydration: false,
    promotesRootRender: false
  });
}

function createHydrationReplayOwnershipGateDiagnosticFromQueue({
  eventReplayQueueDiagnostics,
  recordId,
  rootKind,
  rootTag,
  source
}) {
  const blockedTargets = Array.isArray(
    eventReplayQueueDiagnostics.blockedEventReplayTargets
  )
    ? eventReplayQueueDiagnostics.blockedEventReplayTargets
    : [];
  const blockedTargetsByInputOrder = new Map(
    blockedTargets.map((entry) => [entry.inputOrder, entry])
  );
  const drainOrderEntries = Array.isArray(eventReplayQueueDiagnostics.drainOrder)
    ? eventReplayQueueDiagnostics.drainOrder
    : [];
  const ownershipRows = freezeArray(
    drainOrderEntries.map((drainEntry) =>
      createHydrationReplayOwnershipGateEntryRecord(
        drainEntry,
        blockedTargetsByInputOrder.get(drainEntry.inputOrder) || null
      )
    )
  );
  const rootOwnershipRetainedCount = ownershipRows.filter(
    (row) => row.rootOwnershipRetained
  ).length;
  const dehydratedBoundaryOwnershipRequiredCount = ownershipRows.filter(
    (row) => row.dehydratedBoundaryOwnershipRequired
  ).length;
  const dehydratedBoundaryOwnershipRetainedCount = ownershipRows.filter(
    (row) => row.dehydratedBoundaryOwnershipRetained === true
  ).length;
  const ownershipRetainedCount = ownershipRows.filter(
    (row) => row.ownershipRetainedThroughDrainOrder
  ).length;
  const ownershipRetainedThroughDrainOrder =
    ownershipRows.length > 0 && ownershipRetainedCount === ownershipRows.length;

  const record = freezeRecord({
    kind: HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND,
    gateId: privateHydrationReplayOwnershipGateId,
    metadataId: 'hydration-replay-ownership',
    status:
      ownershipRows.length === 0
        ? 'blocked-no-replay-ownership-targets-recorded'
        : ownershipRetainedThroughDrainOrder
          ? 'blocked-replay-ownership-retained-through-drain-order'
          : 'blocked-replay-ownership-mismatch-through-drain-order',
    source:
      typeof source === 'string'
        ? source
        : 'private-hydration-replay-ownership-gate',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    hostInstanceHydrationAttempted: false,
    hasScheduledReplayAttempt: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    rootRecordId: typeof recordId === 'string' ? recordId : null,
    rootKind: typeof rootKind === 'string' ? rootKind : null,
    rootTag: typeof rootTag === 'string' ? rootTag : null,
    eventReplayQueueDiagnostics,
    eventReplayQueueDiagnosticsAccepted:
      eventReplayQueueDiagnostics.status ===
        'blocked-no-event-replay-targets-recorded' ||
      eventReplayQueueDiagnostics.status ===
        'blocked-event-replay-targets-recorded',
    targetResolutionDiagnosticsAccepted:
      eventReplayQueueDiagnostics.targetResolutionDiagnosticsAccepted ===
      true,
    drainOrderDiagnosticsAccepted:
      eventReplayQueueDiagnostics.drainOrderDiagnosticsAccepted === true,
    orderSource:
      eventReplayQueueDiagnostics.replayQueueDrainOrderDiagnostics
        .orderSource,
    blockedEventReplayTargetCount:
      eventReplayQueueDiagnostics.blockedEventReplayTargetCount,
    drainOrderCount: eventReplayQueueDiagnostics.drainOrderCount,
    ownershipRowCount: ownershipRows.length,
    ownershipRetainedCount,
    ownershipRetainedThroughDrainOrder,
    rootOwnershipRetainedCount,
    dehydratedBoundaryOwnershipRequiredCount,
    dehydratedBoundaryOwnershipRetainedCount,
    queuedEventReplayTargetCount: 0,
    replayedEventCount: 0,
    ownershipRows
  });

  hydrationReplayOwnershipGateDiagnosticPayloads.set(
    record,
    freezeRecord({
      blockedTargets: freezeArray(blockedTargets),
      drainOrderEntries: freezeArray(drainOrderEntries),
      eventReplayQueueDiagnostics,
      ownershipRows,
      recordId: record.rootRecordId,
      rootKind: record.rootKind,
      rootTag: record.rootTag
    })
  );

  return record;
}

function createHydrationReplayOwnershipGateEntryRecord(
  drainOrderEntry,
  eventQueueEntry
) {
  const hasEventQueueEntry = eventQueueEntry !== null;
  const rootOwnershipRetained =
    hasEventQueueEntry &&
    eventQueueEntry.rootOwnershipStatus ===
      drainOrderEntry.rootOwnershipStatus &&
    drainOrderEntry.rootOwnershipStatus === 'owned-by-dehydrated-root';
  const dehydratedBoundaryOwnershipRequired =
    drainOrderEntry.blockedOnKind === 'activity-boundary' ||
    drainOrderEntry.blockedOnKind === 'suspense-boundary';
  const dehydratedBoundaryOwnershipRetained =
    dehydratedBoundaryOwnershipRequired
      ? hasEventQueueEntry &&
        eventQueueEntry.dehydratedBoundaryOwnerId ===
          drainOrderEntry.dehydratedBoundaryOwnerId &&
        eventQueueEntry.dehydratedBoundaryOwnerStatus ===
          drainOrderEntry.dehydratedBoundaryOwnerStatus &&
        eventQueueEntry.dehydratedBoundaryOwnerPath ===
          drainOrderEntry.dehydratedBoundaryOwnerPath
      : null;
  const targetPathRetained =
    hasEventQueueEntry &&
    eventQueueEntry.targetPath === drainOrderEntry.targetPath &&
    eventQueueEntry.targetPathStatus === drainOrderEntry.targetPathStatus;
  const queueIdentityRetained =
    hasEventQueueEntry &&
    eventQueueEntry.domEventName === drainOrderEntry.domEventName &&
    eventQueueEntry.queueName === drainOrderEntry.queueName &&
    eventQueueEntry.queueCategory === drainOrderEntry.queueCategory;
  const blockedOwnerRetained =
    hasEventQueueEntry &&
    eventQueueEntry.blockedOnKind === drainOrderEntry.blockedOnKind &&
    eventQueueEntry.blockedOnStatus === drainOrderEntry.blockedOnStatus;
  const ownershipRetainedThroughDrainOrder =
    rootOwnershipRetained &&
    targetPathRetained &&
    queueIdentityRetained &&
    blockedOwnerRetained &&
    (dehydratedBoundaryOwnershipRetained === true ||
      dehydratedBoundaryOwnershipRetained === null);

  return freezeRecord({
    kind: HYDRATION_REPLAY_OWNERSHIP_GATE_ENTRY_RECORD_KIND,
    gateId: privateHydrationReplayOwnershipGateId,
    metadataId: 'hydration-replay-ownership',
    status: ownershipRetainedThroughDrainOrder
      ? dehydratedBoundaryOwnershipRequired
        ? 'retained-root-and-boundary-ownership-through-drain-order'
        : 'retained-root-ownership-through-drain-order'
      : 'mismatched-ownership-through-drain-order',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    inputOrder: drainOrderEntry.inputOrder,
    drainOrder: drainOrderEntry.drainOrder,
    replayQueueOrder: drainOrderEntry.replayQueueOrder,
    prioritySortKey: drainOrderEntry.prioritySortKey,
    domEventName: drainOrderEntry.domEventName,
    nativeEventType: drainOrderEntry.nativeEventType,
    queueCategory: drainOrderEntry.queueCategory,
    queueName: drainOrderEntry.queueName,
    queuePolicy: drainOrderEntry.queuePolicy,
    replayableEvent: drainOrderEntry.replayableEvent,
    eventQueueEntryFound: hasEventQueueEntry,
    eventQueueRootOwnershipStatus: hasEventQueueEntry
      ? eventQueueEntry.rootOwnershipStatus
      : null,
    drainOrderRootOwnershipStatus: drainOrderEntry.rootOwnershipStatus,
    rootOwnershipRetained,
    eventQueueDehydratedRootOwnerStatus: hasEventQueueEntry
      ? eventQueueEntry.dehydratedRootOwnerStatus
      : null,
    drainOrderDehydratedRootOwnerStatus:
      drainOrderEntry.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwnershipRequired,
    dehydratedBoundaryOwnershipRetained,
    dehydratedBoundaryOwnershipStatus:
      dehydratedBoundaryOwnershipRequired
        ? dehydratedBoundaryOwnershipRetained
          ? 'retained-dehydrated-boundary-owner'
          : 'mismatched-dehydrated-boundary-owner'
        : drainOrderEntry.blockedOnKind === 'dehydrated-root'
          ? 'not-applicable-blocked-on-dehydrated-root'
          : 'not-applicable-no-dehydrated-boundary-owner',
    eventQueueDehydratedBoundaryOwnerId: hasEventQueueEntry
      ? eventQueueEntry.dehydratedBoundaryOwnerId
      : null,
    drainOrderDehydratedBoundaryOwnerId:
      drainOrderEntry.dehydratedBoundaryOwnerId,
    eventQueueDehydratedBoundaryOwnerIndex: hasEventQueueEntry
      ? eventQueueEntry.dehydratedBoundaryOwnerIndex
      : null,
    drainOrderDehydratedBoundaryOwnerIndex:
      drainOrderEntry.dehydratedBoundaryOwnerIndex,
    eventQueueDehydratedBoundaryOwnerPath: hasEventQueueEntry
      ? eventQueueEntry.dehydratedBoundaryOwnerPath
      : null,
    drainOrderDehydratedBoundaryOwnerPath:
      drainOrderEntry.dehydratedBoundaryOwnerPath,
    eventQueueDehydratedBoundaryOwnerStatus: hasEventQueueEntry
      ? eventQueueEntry.dehydratedBoundaryOwnerStatus
      : null,
    drainOrderDehydratedBoundaryOwnerStatus:
      drainOrderEntry.dehydratedBoundaryOwnerStatus,
    blockedOnKind: drainOrderEntry.blockedOnKind,
    blockedOnStatus: drainOrderEntry.blockedOnStatus,
    blockedOnSortKey: drainOrderEntry.blockedOnSortKey,
    blockedOwnerRetained,
    eventQueueTargetPath: hasEventQueueEntry ? eventQueueEntry.targetPath : null,
    drainOrderTargetPath: drainOrderEntry.targetPath,
    eventQueueTargetPathStatus: hasEventQueueEntry
      ? eventQueueEntry.targetPathStatus
      : null,
    drainOrderTargetPathStatus: drainOrderEntry.targetPathStatus,
    targetPathRetained,
    targetPathSortKey: drainOrderEntry.targetPathSortKey,
    queueIdentityRetained,
    ownershipRetainedThroughDrainOrder,
    queued: false,
    replayQueueDrained: false,
    willDrainReplayQueues: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false
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

function acceptedMetadataContract(
  metadataId,
  category,
  gateId,
  recordType,
  acceptedStatus,
  blockedReason,
  reason
) {
  return freezeRecord({
    metadataId,
    category,
    gateId,
    recordType,
    acceptedStatus,
    blockedReason,
    reason
  });
}

function metadataBlocker(id, blockedReason, reason) {
  return freezeRecord({
    blocked: true,
    blockedReason,
    id,
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
  HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON,
  HYDRATION_MARKER_ORACLE_KIND,
  HYDRATION_MARKER_ORACLE_SCHEMA_VERSION,
  HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND,
  HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION_RECORD_KIND,
  HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND,
  HYDRATION_REPLAY_OWNERSHIP_GATE_ENTRY_RECORD_KIND,
  HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_KIND,
  HYDRATION_TEXT_MISMATCH_BLOCKED_REASON,
  HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND,
  HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_RECORD_KIND,
  HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND,
  HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_RECORD_KIND,
  HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_ROUTING_EXECUTION_RECORD_KIND,
  HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_RECORD_KIND,
  INVALID_HYDRATION_BOUNDARY_RECORD_CODE,
  INVALID_HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION_CODE,
  INVALID_HYDRATION_RECOVERABLE_ERROR_BOUNDARY_ADMISSION_CODE,
  INVALID_HYDRATION_TARGET_CLAIMING_DIAGNOSTIC_CODE,
  INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_ROUTING_EXECUTION_CODE,
  INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_CODE,
  INVALID_HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_CODE,
  UNSUPPORTED_HYDRATION_ROOT_KIND,
  acceptedHydrationBoundaryMetadataContracts,
  acceptedHydrationMarkerContracts,
  assertAcceptedHydrationMarkerOracle,
  assertCanonicalPrivateHydrationClaimedReplayTargetDispatchExecutionRecord,
  assertCanonicalPrivateHydrationTargetClaimingDiagnostic,
  createHydrationClaimedReplayTargetDispatchExecutionRecord,
  createHydrationReplayOwnershipGateDiagnostic,
  createHydrationReplayTargetDispatchLinkDiagnostic,
  createHydrationRecoverableErrorBoundaryAdmissionRecord,
  createHydrationTextMismatchRecoverableErrorPreflightRecord,
  createHydrationTextMismatchRecoverableErrorRoutingExecutionRecord,
  createHydrationTextNodeClaimPatchExecutionRecord,
  createHydrationTargetClaimingDiagnostic,
  createHydrationBoundaryGate,
  createUnsupportedHydrateRootRecord,
  getPrivateHydrationBoundaryRecordPayload,
  getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload,
  getPrivateHydrationRecoverableErrorBoundaryAdmissionPayload,
  getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload,
  getPrivateHydrationTextMismatchRecoverableErrorRoutingExecutionPayload,
  getPrivateHydrationTextNodeClaimPatchExecutionPayload,
  getPrivateHydrationTargetClaimingDiagnosticPayload,
  hydrationBoundaryAcceptedMetadataBlockers,
  hydrationEventReplayBlockerContracts,
  hydrationMarkerReplayQueueContracts,
  inspectHydrationContainerMarkers,
  isPrivateHydrationBoundaryRecord,
  isPrivateHydrationClaimedReplayTargetDispatchExecutionRecord,
  isPrivateHydrationRecoverableErrorBoundaryAdmissionRecord,
  isPrivateHydrationTextMismatchRecoverableErrorPreflightRecord,
  isPrivateHydrationTextMismatchRecoverableErrorRoutingExecutionRecord,
  isPrivateHydrationTextNodeClaimPatchExecutionRecord,
  isPrivateHydrationTargetClaimingDiagnostic,
  privateHydrationBoundaryAcceptedMetadataGateId,
  privateHydrationBoundaryAcceptedMetadataStatus,
  privateHydrationBoundaryRecordType,
  privateHydrationClaimedReplayTargetDispatchExecutionGateId,
  privateHydrationClaimedReplayTargetDispatchExecutionStatus,
  privateHydrationRecoverableErrorBoundaryAdmissionGateId,
  privateHydrationRecoverableErrorBoundaryAdmissionMetadataId,
  privateHydrationRecoverableErrorBoundaryAdmissionStatus,
  privateHydrationReplayOwnershipGateId,
  privateHydrationTargetClaimingGateId,
  privateHydrationTargetClaimingMetadataStatus,
  privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId,
  privateHydrationTextMismatchRecoverableErrorRoutingExecutionStatus,
  privateHydrationTextMismatchRecoverableErrorRoutingMetadataId,
  privateHydrationTextMismatchRecoverableErrorPreflightGateId,
  privateHydrationTextMismatchRecoverableErrorPreflightMetadataId,
  privateHydrationTextMismatchRecoverableErrorPreflightStatus,
  privateHydrationTextNodeClaimPatchExecutionGateId,
  privateHydrationTextNodeClaimPatchExecutionStatus,
  privateHydrationTextNodeClaimPatchMetadataId,
  requestPrivateHydrateRootSourceLedgerRootBridgeModuleRegistration,
  unsupportedHydrationPrerequisites
};
