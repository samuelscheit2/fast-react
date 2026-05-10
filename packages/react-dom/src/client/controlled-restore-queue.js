'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  unimplementedCode
} = require('../../placeholder-utils.js');
const {
  EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
  getEventListenerTargetLookupRecordPayload,
  getLatestPropsFromNode
} = require('./component-tree.js');
const {
  controlledInputValueTrackerFakeDomTargetMarker,
  controlledInputValueTrackerFakeDomObservedStatus,
  getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload,
  privateControlledInputValueTrackerFakeDomDiagnosticRecordType
} = require('../resource-form-internals-gate.js');
const {
  CHANGE_EVENT_PLUGIN_NAME,
  CONTROLLED_STATE_RESTORE_BLOCKED_CODE,
  EVENT_DISPATCH_BLOCKED_CODE,
  EVENT_DISPATCH_RECORD_KIND,
  INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_BLOCKED_CODE,
  INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND,
  PLUGIN_EXTRACTION_BLOCKED_CODE,
  PRIVATE_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_STATUS,
  getInputChangeEventExtractionPreflightRecordPayload
} = require('../events/plugin-event-system.js');

const controlledInputPostEventRestoreQueueGateSchemaVersion = 1;
const controlledInputPostEventRestoreQueueGateId =
  'controlled-input-post-event-restore-queue-gate-1';
const privateControlledInputPostEventRestoreQueueRecordType =
  'fast.react_dom.private_controlled_input_post_event_restore_queue_record';
const privateControlledInputPostEventRestoreQueueWritePreflightRecordType =
  'fast.react_dom.private_controlled_input_post_event_restore_queue_write_preflight_record';
const privateControlledInputPostEventRestoreQueueWriteIntentRowType =
  'fast.react_dom.private_controlled_input_post_event_restore_queue_write_intent_row';
const privateControlledInputPostEventRestoreQueueWriteExecutionRecordType =
  'fast.react_dom.private_controlled_input_post_event_restore_queue_write_execution_record';
const privateControlledInputPostEventRestoreQueueWriteExecutionRowType =
  'fast.react_dom.private_controlled_input_post_event_restore_queue_write_execution_row';
const privateControlledInputPostEventRestoreQueueFlushBlockerRecordType =
  'fast.react_dom.private_controlled_input_post_event_restore_queue_flush_blocker_record';
const privateControlledInputPostEventRestoreQueueInputChangeBridgeRecordType =
  'fast.react_dom.private_controlled_input_change_event_restore_queue_bridge_record';
const privateControlledInputPostEventRestoreQueueInputChangeBridgeRowType =
  'fast.react_dom.private_controlled_input_change_event_restore_queue_bridge_row';
const privateControlledInputPostEventRestoreQueueInputChangeExecutionRecordType =
  'fast.react_dom.private_controlled_input_change_event_restore_queue_execution_record';
const privateControlledInputPostEventRestoreQueueInputChangeExecutionRowType =
  'fast.react_dom.private_controlled_input_change_event_restore_queue_execution_row';
const privateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordType =
  'fast.react_dom.private_controlled_input_post_event_restore_wrapper_mutation_intent_record';
const privateControlledInputPostEventRestoreQueueWrapperMutationIntentRowType =
  'fast.react_dom.private_controlled_input_post_event_restore_wrapper_mutation_intent_row';
const controlledInputPostEventRestoreQueueStatus =
  'private-controlled-input-post-event-restore-queue-intent';
const controlledInputPostEventRestoreQueueIntentRecordedStatus =
  'recorded-private-controlled-input-post-event-restore-intent';
const controlledInputPostEventRestoreQueueIntentSkippedStatus =
  'skipped-private-controlled-input-post-event-restore-intent';
const controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus =
  'private-controlled-checkable-input-restore-metadata';
const controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus =
  'recorded-private-controlled-radio-group-restore-intent';
const controlledInputPostEventRestoreQueueRadioGroupIntentSkippedStatus =
  'skipped-private-controlled-radio-group-restore-intent';
const controlledInputPostEventRestoreQueueWriteFlushOrderingStatus =
  'private-controlled-input-post-event-restore-queue-write-flush-ordering';
const controlledInputPostEventRestoreQueueRadioSiblingPropsLookupRecordedStatus =
  'recorded-private-controlled-radio-sibling-props-lookup-intent';
const controlledInputPostEventRestoreQueueRadioSiblingPropsLookupSkippedStatus =
  'skipped-private-controlled-radio-sibling-props-lookup-intent';
const controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceAcceptedStatus =
  'accepted-private-controlled-radio-sibling-props-evidence';
const controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus =
  'skipped-private-controlled-radio-sibling-props-evidence';
const controlledInputPostEventRestoreQueueWritePreflightStatus =
  'private-controlled-input-post-event-restore-queue-write-preflight';
const controlledInputPostEventRestoreQueueWriteIntentRowStatus =
  'recorded-private-controlled-input-post-event-restore-queue-write-intent';
const controlledInputPostEventRestoreQueueWriteExecutionStatus =
  'private-controlled-input-post-event-restore-queue-write-execution';
const controlledInputPostEventRestoreQueueWriteExecutionRowStatus =
  'recorded-private-controlled-input-post-event-restore-queue-write-execution-row';
const controlledInputPostEventRestoreQueueFlushBlockerStatus =
  'private-controlled-input-post-event-restore-queue-flush-blocker';
const controlledInputPostEventRestoreQueueInputChangeBridgeStatus =
  'private-controlled-input-change-event-restore-queue-bridge';
const controlledInputPostEventRestoreQueueInputChangeBridgeRowStatus =
  'recorded-private-input-change-event-controlled-restore-latest-props-bridge-row';
const controlledInputPostEventRestoreQueueInputChangeExecutionStatus =
  'private-controlled-input-change-event-restore-queue-execution';
const controlledInputPostEventRestoreQueueInputChangeExecutionRowStatus =
  'executed-private-input-change-event-controlled-restore-row';
const controlledInputPostEventRestoreQueueWrapperMutationIntentStatus =
  'private-controlled-input-post-event-restore-wrapper-mutation-intent';
const controlledInputPostEventRestoreQueueWrapperMutationIntentRowStatus =
  'recorded-private-controlled-input-post-event-restore-wrapper-mutation-intent-row';
const controlledInputPostEventRestoreQueueInvalidEventCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_EVENT';
const controlledInputPostEventRestoreQueueInvalidFakeDomObservationCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_FAKE_DOM_OBSERVATION';
const controlledInputPostEventRestoreQueueInvalidAdmissionCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_ADMISSION';
const controlledInputPostEventRestoreQueueInvalidWritePreflightCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_WRITE_PREFLIGHT';
const controlledInputPostEventRestoreQueueInvalidWriteExecutionCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_WRITE_EXECUTION';
const controlledInputPostEventRestoreQueueInvalidFlushBlockerCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_FLUSH_BLOCKER';
const controlledInputPostEventRestoreQueueInvalidInputChangeBridgeCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_CHANGE_EVENT_RESTORE_QUEUE_INVALID_BRIDGE';
const controlledInputPostEventRestoreQueueInvalidInputChangeExecutionCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_CHANGE_EVENT_RESTORE_QUEUE_INVALID_EXECUTION';
const controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_WRAPPER_MUTATION_INTENT';
const controlledInputPostEventRestoreQueueInvalidLatestPropsCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_LATEST_PROPS';
const controlledInputPostEventRestoreQueueInvalidRecordCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_RECORD';
const controlledInputPostEventRestoreQueueGateErrorCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_GATE';

const supportedHostTags = new Set(['input', 'select', 'textarea']);
const controlledInputPostEventRestoreQueueAcceptedRestoreMetadataKinds =
  freezeArray([
    'input-text-value',
    'input-checkbox-checked',
    'input-radio-checked',
    'select-single-value',
    'select-multiple-value',
    'textarea-value'
  ]);
const controlledInputPostEventRestoreQueueAcceptedRestoreMetadataKindSet =
  new Set(controlledInputPostEventRestoreQueueAcceptedRestoreMetadataKinds);
const controlledInputPostEventRestoreQueueRecordPayloads = new WeakMap();
const controlledInputPostEventRestoreQueueWritePreflightPayloads =
  new WeakMap();
const controlledInputPostEventRestoreQueueWriteExecutionPayloads =
  new WeakMap();
const controlledInputPostEventRestoreQueueFlushBlockerPayloads =
  new WeakMap();
const controlledInputPostEventRestoreQueueInputChangeBridgePayloads =
  new WeakMap();
const controlledInputPostEventRestoreQueueInputChangeExecutionPayloads =
  new WeakMap();
const controlledInputPostEventRestoreQueueWrapperMutationIntentPayloads =
  new WeakMap();
const defaultControlledInputPostEventRestoreQueueGate =
  createControlledInputPostEventRestoreQueueGate();

const controlledInputPostEventRestoreQueueNoSideEffects = freezeRecord({
  eventDispatchRecordAccepted: false,
  fakeDomTrackerObservationAccepted: false,
  inputChangeEventExtractionPreflightAccepted: false,
  latestPropsEvidenceAccepted: false,
  latestPropsMetadataRead: false,
  inputChangeControlledRestoreBridgeRecorded: false,
  inputChangeControlledRestoreBridgeRowsCreated: false,
  postEventRestoreIntentRecorded: false,
  postEventRestoreIntentSkipped: false,
  fakeDomValueChangeObserved: false,
  restoreQueueRecordCreated: false,
  sourceRestoreQueueWritePreflightAccepted: false,
  sourceRestoreQueueWriteIntentRowsAccepted: false,
  restoreQueueWritePreflightRecorded: false,
  restoreQueueWriteIntentRowsCreated: false,
  restoreQueueWriteIntentRowCount: 0,
  restoreQueueWriteExecutionRecorded: false,
  restoreQueueFlushBlockerRecorded: false,
  sourceRestoreQueueWriteExecutionAccepted: false,
  sourceRestoreQueueFlushBlockerAccepted: false,
  restoreQueueSnapshotRecorded: false,
  restoreQueueIntendedFlushOrderRecorded: false,
  restoreQueueMutationIntentRecorded: false,
  restoreWrapperMutationIntentRecorded: false,
  wrapperMutationIntentRowsCreated: false,
  wrapperMutationIntentRowCount: 0,
  inputChangeControlledRestoreExecutionRecorded: false,
  inputChangeControlledRestoreExecutionRowsCreated: false,
  latestPropsValidationAccepted: false,
  privateRestoreQueueWritten: false,
  privateRestoreQueueFlushed: false,
  privateControlledStateRestoreInvoked: false,
  wrapperMutationExecuted: false,
  wrapperWritePerformed: false,
  fakeDomInputMutated: false,
  wrapperOperationNamesRecorded: false,
  wrapperIntendedValueUpdateRecorded: false,
  wrapperIntendedCheckedUpdateRecorded: false,
  wrapperSideEffectsBlocked: false,
  restoreTargetMutationRecorded: false,
  restoreQueueAppendMutationRecorded: false,
  metadataRestoreTargetWritten: false,
  metadataRestoreQueueWritten: false,
  restoreQueueWriteOrderRecorded: false,
  restoreQueueFlushOrderRecorded: false,
  restoreQueueWritten: false,
  restoreQueueFlushed: false,
  controlledStateRestoreScheduled: false,
  controlledStateRestoreInvoked: false,
  hostWrapperInvoked: false,
  hostWrapperRestoreOrderRecorded: false,
  checkableRestoreMetadataRecorded: false,
  radioGroupRestoreIntentRecorded: false,
  radioGroupLookupRequired: false,
  radioGroupLookupPerformed: false,
  radioGroupMembersEnumerated: false,
  radioGroupSiblingMetadataRead: false,
  radioGroupSiblingPropsEvidenceAccepted: false,
  radioGroupSiblingPropsSameNameSameFormRecorded: false,
  radioGroupFormBoundaryMetadataRead: false,
  radioGroupFormTraversalPerformed: false,
  radioGroupLivePropsLookupPerformed: false,
  radioGroupValueTrackerRefreshRequired: false,
  radioGroupValueTrackerRefreshed: false,
  liveValueTrackerInstalled: false,
  valueTrackerFieldWritten: false,
  propertyDescriptorInstalled: false,
  hostValueRead: false,
  hostValueWritten: false,
  browserInputMutated: false,
  rawTargetCaptured: false,
  rawEventCaptured: false,
  rawLatestPropsRetained: false,
  publicRootTouched: false,
  publicControlledBehaviorEnabled: false,
  compatibilityClaimed: false
});

function createControlledInputPostEventRestoreQueueGate(options) {
  const gateState = createGateState(options);

  return Object.freeze({
    recordPostEventRestoreIntentFromEventLatestProps(dispatchRecord, admission) {
      return recordControlledInputPostEventRestoreIntentFromEventLatestPropsWithGate(
        gateState,
        dispatchRecord,
        admission
      );
    },
    recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
      observationRecord,
      latestPropsRecord,
      admission
    ) {
      return recordControlledInputPostEventRestoreIntentFromFakeDomObservationLatestPropsWithGate(
        gateState,
        observationRecord,
        latestPropsRecord,
        admission
      );
    },
    preflightRestoreQueueWrites(records, admission) {
      return preflightControlledInputPostEventRestoreQueueWritesWithGate(
        gateState,
        records,
        admission
      );
    },
    recordRestoreQueueWriteExecution(preflightRecord, admission) {
      return recordControlledInputPostEventRestoreQueueWriteExecutionWithGate(
        gateState,
        preflightRecord,
        admission
      );
    },
    recordRestoreQueueFlushBlocker(preflightRecord, admission) {
      return recordControlledInputPostEventRestoreQueueFlushBlockerWithGate(
        gateState,
        preflightRecord,
        admission
      );
    },
    recordInputChangeEventControlledRestoreBridge(
      inputChangePreflightRecord,
      restoreRecord,
      writePreflightRecord,
      admission
    ) {
      return recordControlledInputChangeEventRestoreQueueBridgeWithGate(
        gateState,
        inputChangePreflightRecord,
        restoreRecord,
        writePreflightRecord,
        admission
      );
    },
    recordInputChangeEventControlledRestoreExecution(
      inputChangePreflightRecord,
      bridgeRecord,
      writeExecutionRecord,
      flushBlockerRecord,
      wrapperMutationIntentRecord,
      admission
    ) {
      return recordControlledInputChangeEventRestoreQueueExecutionWithGate(
        gateState,
        inputChangePreflightRecord,
        bridgeRecord,
        writeExecutionRecord,
        flushBlockerRecord,
        wrapperMutationIntentRecord,
        admission
      );
    },
    recordRestoreQueueWrapperMutationIntent(
      writeExecutionRecord,
      flushBlockerRecord,
      admission
    ) {
      return recordControlledInputPostEventRestoreQueueWrapperMutationIntentWithGate(
        gateState,
        writeExecutionRecord,
        flushBlockerRecord,
        admission
      );
    }
  });
}

function recordControlledInputPostEventRestoreIntentFromEventLatestProps(
  dispatchRecord,
  admission
) {
  return defaultControlledInputPostEventRestoreQueueGate
    .recordPostEventRestoreIntentFromEventLatestProps(
      dispatchRecord,
      admission
    );
}

function recordControlledInputPostEventRestoreIntentFromFakeDomObservationLatestProps(
  observationRecord,
  latestPropsRecord,
  admission
) {
  return defaultControlledInputPostEventRestoreQueueGate
    .recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
      observationRecord,
      latestPropsRecord,
      admission
    );
}

function preflightControlledInputPostEventRestoreQueueWrites(
  records,
  admission
) {
  return defaultControlledInputPostEventRestoreQueueGate
    .preflightRestoreQueueWrites(records, admission);
}

function recordControlledInputPostEventRestoreQueueWriteExecution(
  preflightRecord,
  admission
) {
  return defaultControlledInputPostEventRestoreQueueGate
    .recordRestoreQueueWriteExecution(preflightRecord, admission);
}

function recordControlledInputPostEventRestoreQueueFlushBlocker(
  preflightRecord,
  admission
) {
  return defaultControlledInputPostEventRestoreQueueGate
    .recordRestoreQueueFlushBlocker(preflightRecord, admission);
}

function recordControlledInputChangeEventRestoreQueueBridge(
  inputChangePreflightRecord,
  restoreRecord,
  writePreflightRecord,
  admission
) {
  return defaultControlledInputPostEventRestoreQueueGate
    .recordInputChangeEventControlledRestoreBridge(
      inputChangePreflightRecord,
      restoreRecord,
      writePreflightRecord,
      admission
    );
}

function recordControlledInputChangeEventRestoreQueueExecution(
  inputChangePreflightRecord,
  bridgeRecord,
  writeExecutionRecord,
  flushBlockerRecord,
  wrapperMutationIntentRecord,
  admission
) {
  return defaultControlledInputPostEventRestoreQueueGate
    .recordInputChangeEventControlledRestoreExecution(
      inputChangePreflightRecord,
      bridgeRecord,
      writeExecutionRecord,
      flushBlockerRecord,
      wrapperMutationIntentRecord,
      admission
    );
}

function recordControlledInputPostEventRestoreQueueWrapperMutationIntent(
  writeExecutionRecord,
  flushBlockerRecord,
  admission
) {
  return defaultControlledInputPostEventRestoreQueueGate
    .recordRestoreQueueWrapperMutationIntent(
      writeExecutionRecord,
      flushBlockerRecord,
      admission
    );
}

function recordControlledInputPostEventRestoreIntentFromEventLatestPropsWithGate(
  gateState,
  dispatchRecord,
  admission
) {
  const eventEvidence =
    assertEventDispatchRecordForPostEventRestore(dispatchRecord);
  const normalizedAdmission = normalizePostEventRestoreQueueAdmission(
    admission
  );
  const latestPropsEvidence = createLatestPropsEvidence(eventEvidence);
  const controlledTarget = createControlledTargetEvidence(
    eventEvidence,
    latestPropsEvidence
  );
  const intentRecorded = shouldRecordRestoreIntent(
    eventEvidence,
    latestPropsEvidence,
    controlledTarget
  );
  const checkableRestoreMetadata = createCheckableRestoreMetadata(
    controlledTarget,
    latestPropsEvidence,
    intentRecorded
  );
  const radioGroupSiblingPropsLookup = createRadioGroupSiblingPropsLookup(
    controlledTarget,
    latestPropsEvidence,
    admission,
    intentRecorded
  );
  const groupIntentRecords = createCheckableGroupIntentRecords(
    controlledTarget,
    latestPropsEvidence,
    normalizedAdmission,
    intentRecorded,
    radioGroupSiblingPropsLookup
  );
  const restoreQueueOrdering = createPostEventRestoreQueueOrdering(
    'private-event-dispatch-latest-props-evidence',
    controlledTarget,
    normalizedAdmission,
    intentRecorded,
    groupIntentRecords
  );
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const status = intentRecorded
    ? controlledInputPostEventRestoreQueueIntentRecordedStatus
    : controlledInputPostEventRestoreQueueIntentSkippedStatus;

  const payload = freezeRecord({
    schemaVersion: controlledInputPostEventRestoreQueueGateSchemaVersion,
    $$typeof: privateControlledInputPostEventRestoreQueueRecordType,
    kind: 'FastReactDomPrivateControlledInputPostEventRestoreQueueRecord',
    gateId: controlledInputPostEventRestoreQueueGateId,
    compatibilityTarget,
    status,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    sourceEventKind: eventEvidence.kind,
    sourceEventStatus: eventEvidence.status,
    domEventName: eventEvidence.domEventName,
    nativeEventType: eventEvidence.nativeEventType,
    hostTag: controlledTarget.hostTag,
    inputType: controlledTarget.inputType,
    multiple: controlledTarget.multiple,
    controlKind: controlledTarget.controlKind,
    trackedField: controlledTarget.trackedField,
    controlledPropName: controlledTarget.controlledPropName,
    admission: normalizedAdmission,
    eventEvidence: createEventEvidenceSummary(eventEvidence),
    latestPropsEvidence: latestPropsEvidence.record,
    controlledTarget,
    checkableRestoreMetadata,
    radioGroupSiblingPropsLookup,
    groupIntentRecords,
    restoreQueueOrdering,
    restoreIntent: createPostEventRestoreIntentSummary(
      eventEvidence,
      latestPropsEvidence,
      controlledTarget,
      normalizedAdmission,
      intentRecorded
    ),
    postEventRestoreBoundary: createPostEventRestoreBoundary(
      latestPropsEvidence,
      intentRecorded,
      status
    ),
    publicControlledBehaviorBoundary: createPublicControlledBehaviorBoundary(),
    sideEffects: createPostEventRestoreQueueSideEffects(
      latestPropsEvidence,
      intentRecorded,
      controlledTarget,
      groupIntentRecords,
      radioGroupSiblingPropsLookup
    )
  });

  controlledInputPostEventRestoreQueueRecordPayloads.set(payload, payload);
  return payload;
}

function recordControlledInputPostEventRestoreIntentFromFakeDomObservationLatestPropsWithGate(
  gateState,
  observationRecord,
  latestPropsRecord,
  admission
) {
  const observationEvidence =
    assertFakeDomTrackerObservationForPostEventRestore(observationRecord);
  const normalizedAdmission = normalizePostEventRestoreQueueAdmission(
    admission
  );
  const latestPropsEvidence =
    createLatestPropsEvidenceFromLookupRecord(latestPropsRecord);
  const controlledTarget =
    createControlledTargetEvidenceFromFakeDomObservation(
      observationEvidence,
      latestPropsEvidence,
      normalizedAdmission
    );
  const intentRecorded = shouldRecordRestoreIntentFromFakeDomObservation(
    observationEvidence,
    latestPropsEvidence,
    controlledTarget
  );
  const checkableRestoreMetadata = createCheckableRestoreMetadata(
    controlledTarget,
    latestPropsEvidence,
    intentRecorded
  );
  const radioGroupSiblingPropsLookup = createRadioGroupSiblingPropsLookup(
    controlledTarget,
    latestPropsEvidence,
    admission,
    intentRecorded
  );
  const groupIntentRecords = createCheckableGroupIntentRecords(
    controlledTarget,
    latestPropsEvidence,
    normalizedAdmission,
    intentRecorded,
    radioGroupSiblingPropsLookup
  );
  const restoreQueueOrdering = createPostEventRestoreQueueOrdering(
    'private-fake-dom-observation-latest-props-evidence',
    controlledTarget,
    normalizedAdmission,
    intentRecorded,
    groupIntentRecords
  );
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const status = intentRecorded
    ? controlledInputPostEventRestoreQueueIntentRecordedStatus
    : controlledInputPostEventRestoreQueueIntentSkippedStatus;

  const payload = freezeRecord({
    schemaVersion: controlledInputPostEventRestoreQueueGateSchemaVersion,
    $$typeof: privateControlledInputPostEventRestoreQueueRecordType,
    kind: 'FastReactDomPrivateControlledInputPostEventRestoreQueueRecord',
    gateId: controlledInputPostEventRestoreQueueGateId,
    compatibilityTarget,
    status,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    sourceKind: 'private-fake-dom-observation-latest-props-evidence',
    sourceEventKind: null,
    sourceEventStatus: null,
    sourceObservationKind: observationEvidence.kind,
    sourceObservationStatus: observationEvidence.status,
    sourceObservationOperation: observationEvidence.operation,
    domEventName: normalizedAdmission.eventName,
    nativeEventType: null,
    hostTag: controlledTarget.hostTag,
    inputType: controlledTarget.inputType,
    multiple: controlledTarget.multiple,
    controlKind: controlledTarget.controlKind,
    trackedField: controlledTarget.trackedField,
    controlledPropName: controlledTarget.controlledPropName,
    admission: normalizedAdmission,
    eventEvidence: null,
    fakeDomObservationEvidence:
      createFakeDomObservationEvidenceSummary(observationEvidence),
    latestPropsEvidence: latestPropsEvidence.record,
    controlledTarget,
    checkableRestoreMetadata,
    radioGroupSiblingPropsLookup,
    groupIntentRecords,
    restoreQueueOrdering,
    restoreIntent:
      createPostEventRestoreIntentSummaryFromFakeDomObservation(
        observationEvidence,
        latestPropsEvidence,
        controlledTarget,
        normalizedAdmission,
        intentRecorded
      ),
    postEventRestoreBoundary: createPostEventRestoreBoundary(
      latestPropsEvidence,
      intentRecorded,
      status
    ),
    publicControlledBehaviorBoundary: createPublicControlledBehaviorBoundary(),
    sideEffects:
      createPostEventRestoreQueueSideEffectsFromFakeDomObservation(
        observationEvidence,
        latestPropsEvidence,
        intentRecorded,
        controlledTarget,
        groupIntentRecords,
        radioGroupSiblingPropsLookup
      )
  });

  controlledInputPostEventRestoreQueueRecordPayloads.set(payload, payload);
  return payload;
}

function preflightControlledInputPostEventRestoreQueueWritesWithGate(
  gateState,
  records,
  admission
) {
  const normalizedAdmission =
    normalizePostEventRestoreQueueWritePreflightAdmission(admission);
  const sourceRecords =
    normalizePostEventRestoreQueueWritePreflightRecords(records);
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const writeIntentRows = freezeArray(
    sourceRecords.map((sourceRecord, index) =>
      createPostEventRestoreQueueWriteIntentRow(
        requestId,
        requestSequence,
        sourceRecord,
        normalizedAdmission,
        index
      )
    )
  );
  const payload = freezeRecord({
    schemaVersion: controlledInputPostEventRestoreQueueGateSchemaVersion,
    $$typeof:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    kind:
      'FastReactDomPrivateControlledInputPostEventRestoreQueueWritePreflightRecord',
    gateId: controlledInputPostEventRestoreQueueGateId,
    compatibilityTarget,
    status: controlledInputPostEventRestoreQueueWritePreflightStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    queueKind: normalizedAdmission.queueKind,
    queueId: normalizedAdmission.queueId,
    admission: normalizedAdmission,
    acceptedSourceRecordType:
      privateControlledInputPostEventRestoreQueueRecordType,
    acceptedRecordCount: sourceRecords.length,
    acceptedRestoreKinds: freezeArray(
      writeIntentRows.map((row) => row.acceptedRestoreKind)
    ),
    sourceRequestIds: freezeArray(
      sourceRecords.map((record) => record.requestId)
    ),
    writeIntentRows,
    writePlan: createPostEventRestoreQueueWritePreflightPlan(
      normalizedAdmission,
      writeIntentRows
    ),
    postEventRestoreBoundary:
      createPostEventRestoreQueueWritePreflightBoundary(writeIntentRows),
    publicControlledBehaviorBoundary: createPublicControlledBehaviorBoundary(),
    sideEffects:
      createPostEventRestoreQueueWritePreflightSideEffects(writeIntentRows)
  });

  controlledInputPostEventRestoreQueueWritePreflightPayloads.set(
    payload,
    payload
  );
  return payload;
}

function recordControlledInputPostEventRestoreQueueWriteExecutionWithGate(
  gateState,
  preflightRecord,
  admission
) {
  const sourcePreflight =
    assertPrivateControlledInputPostEventRestoreQueueWritePreflightRecordForExecution(
      preflightRecord
    );
  const normalizedAdmission =
    normalizePostEventRestoreQueueWriteExecutionAdmission(admission);
  assertPostEventRestoreQueueWriteExecutionPreflight(sourcePreflight);

  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const writeExecutionRows = freezeArray(
    sourcePreflight.writeIntentRows.map((sourceRow, index) =>
      createPostEventRestoreQueueWriteExecutionRow(
        requestId,
        requestSequence,
        sourcePreflight,
        sourceRow,
        normalizedAdmission,
        index
      )
    )
  );
  const payload = freezeRecord({
    schemaVersion: controlledInputPostEventRestoreQueueGateSchemaVersion,
    $$typeof:
      privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
    kind:
      'FastReactDomPrivateControlledInputPostEventRestoreQueueWriteExecutionRecord',
    gateId: controlledInputPostEventRestoreQueueGateId,
    compatibilityTarget,
    status: controlledInputPostEventRestoreQueueWriteExecutionStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    queueKind: normalizedAdmission.queueKind,
    queueId: normalizedAdmission.queueId,
    admission: normalizedAdmission,
    acceptedSourceRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    acceptedSourceRowType:
      privateControlledInputPostEventRestoreQueueWriteIntentRowType,
    sourcePreflightRequestId: sourcePreflight.requestId,
    sourcePreflightRequestSequence: sourcePreflight.requestSequence,
    sourcePreflightStatus: sourcePreflight.status,
    sourceWriteIntentRowCount: sourcePreflight.writeIntentRows.length,
    acceptedRestoreKinds: freezeArray(
      writeExecutionRows.map((row) => row.acceptedRestoreKind)
    ),
    sourceRequestIds: freezeArray(
      writeExecutionRows.map((row) => row.sourceRequestId)
    ),
    sourcePreflightRows:
      createPostEventRestoreQueueWriteExecutionSourceRows(
        sourcePreflight.writeIntentRows
      ),
    writeExecutionRows,
    restoreTargetMutation:
      createPostEventRestoreQueueRestoreTargetMutation(writeExecutionRows),
    restoreQueueMutations:
      createPostEventRestoreQueueRestoreQueueMutations(writeExecutionRows),
    queueMutationPlan:
      createPostEventRestoreQueueWriteExecutionPlan(
        normalizedAdmission,
        sourcePreflight,
        writeExecutionRows
      ),
    postEventRestoreBoundary:
      createPostEventRestoreQueueWriteExecutionBoundary(
        sourcePreflight,
        writeExecutionRows
      ),
    publicControlledBehaviorBoundary: createPublicControlledBehaviorBoundary(),
    sideEffects:
      createPostEventRestoreQueueWriteExecutionSideEffects(writeExecutionRows)
  });

  controlledInputPostEventRestoreQueueWriteExecutionPayloads.set(
    payload,
    payload
  );
  return payload;
}

function recordControlledInputPostEventRestoreQueueFlushBlockerWithGate(
  gateState,
  preflightRecord,
  admission
) {
  const normalizedAdmission =
    normalizePostEventRestoreQueueFlushBlockerAdmission(admission);
  const sourcePreflight =
    assertPostEventRestoreQueueFlushBlockerSourceRecord(preflightRecord);
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const queueSnapshot =
    createPostEventRestoreQueueFlushBlockerSnapshot(sourcePreflight);
  const intendedFlushOrder =
    createPostEventRestoreQueueFlushBlockerIntendedOrder(
      sourcePreflight,
      queueSnapshot
    );
  const wrapperRestoreBlocker =
    createPostEventRestoreQueueWrapperRestoreBlocker(
      sourcePreflight,
      queueSnapshot
    );
  const payload = freezeRecord({
    schemaVersion: controlledInputPostEventRestoreQueueGateSchemaVersion,
    $$typeof:
      privateControlledInputPostEventRestoreQueueFlushBlockerRecordType,
    kind:
      'FastReactDomPrivateControlledInputPostEventRestoreQueueFlushBlockerRecord',
    gateId: controlledInputPostEventRestoreQueueGateId,
    compatibilityTarget,
    status: controlledInputPostEventRestoreQueueFlushBlockerStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    queueKind: normalizedAdmission.queueKind,
    queueId: normalizedAdmission.queueId,
    admission: normalizedAdmission,
    acceptedSourceRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    sourcePreflightRequestId: sourcePreflight.requestId,
    sourcePreflightRequestSequence: sourcePreflight.requestSequence,
    acceptedRecordCount: sourcePreflight.acceptedRecordCount,
    acceptedRestoreKinds: sourcePreflight.acceptedRestoreKinds,
    sourceRequestIds: sourcePreflight.sourceRequestIds,
    queueSnapshot,
    intendedFlushOrder,
    wrapperRestoreBlocker,
    postEventRestoreBoundary:
      createPostEventRestoreQueueFlushBlockerBoundary(sourcePreflight),
    publicControlledBehaviorBoundary: createPublicControlledBehaviorBoundary(),
    sideEffects:
      createPostEventRestoreQueueFlushBlockerSideEffects(sourcePreflight)
  });

  controlledInputPostEventRestoreQueueFlushBlockerPayloads.set(
    payload,
    payload
  );
  return payload;
}

function recordControlledInputChangeEventRestoreQueueBridgeWithGate(
  gateState,
  inputChangePreflightRecord,
  restoreRecord,
  writePreflightRecord,
  admission
) {
  const normalizedAdmission =
    normalizeInputChangeEventRestoreQueueBridgeAdmission(admission);
  const inputPreflight =
    assertInputChangeEventExtractionPreflightForRestoreQueueBridge(
      inputChangePreflightRecord
    );
  const sourceRestoreRecord =
    assertPrivateControlledInputPostEventRestoreQueueRecord(restoreRecord);
  const sourceWritePreflight =
    assertInputChangeEventRestoreQueueBridgeWritePreflight(
      writePreflightRecord
    );
  const sourceWriteRow =
    findInputChangeEventRestoreQueueBridgeWriteIntentRow(
      sourceWritePreflight,
      sourceRestoreRecord
    );
  assertInputChangeEventRestoreQueueBridgeSources(
    inputPreflight,
    sourceRestoreRecord,
    sourceWritePreflight,
    sourceWriteRow
  );

  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const bridgeRows = freezeArray([
    createInputChangeEventRestoreQueueBridgeRow(
      requestId,
      requestSequence,
      inputPreflight,
      sourceRestoreRecord,
      sourceWritePreflight,
      sourceWriteRow
    )
  ]);
  const payload = freezeRecord({
    schemaVersion: controlledInputPostEventRestoreQueueGateSchemaVersion,
    $$typeof:
      privateControlledInputPostEventRestoreQueueInputChangeBridgeRecordType,
    kind:
      'FastReactDomPrivateControlledInputChangeEventRestoreQueueBridgeRecord',
    gateId: controlledInputPostEventRestoreQueueGateId,
    compatibilityTarget,
    status: controlledInputPostEventRestoreQueueInputChangeBridgeStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    queueKind: normalizedAdmission.queueKind,
    queueId: normalizedAdmission.queueId,
    admission: normalizedAdmission,
    acceptedInputChangePreflightRecordKind:
      INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND,
    acceptedRestoreQueueRecordType:
      privateControlledInputPostEventRestoreQueueRecordType,
    acceptedWritePreflightRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    acceptedWriteIntentRowType:
      privateControlledInputPostEventRestoreQueueWriteIntentRowType,
    sourceInputChangePreflight:
      createInputChangeEventPreflightBridgeSourceSummary(inputPreflight),
    sourceRestoreQueueRecord:
      createInputChangeEventRestoreQueueBridgeRestoreSummary(
        sourceRestoreRecord
      ),
    sourceWritePreflight:
      createInputChangeEventRestoreQueueBridgeWritePreflightSummary(
        sourceWritePreflight,
        sourceWriteRow
      ),
    bridgeRows,
    latestPropsEvidenceBridge:
      createInputChangeEventRestoreQueueLatestPropsEvidenceBridge(
        inputPreflight,
        sourceRestoreRecord,
        sourceWriteRow
      ),
    postEventRestoreBoundary:
      createInputChangeEventRestoreQueueBridgeBoundary(
        sourceWritePreflight,
        bridgeRows
      ),
    publicControlledBehaviorBoundary: createPublicControlledBehaviorBoundary(),
    sideEffects: createInputChangeEventRestoreQueueBridgeSideEffects(
      bridgeRows
    )
  });

  controlledInputPostEventRestoreQueueInputChangeBridgePayloads.set(
    payload,
    payload
  );
  return payload;
}

function recordControlledInputChangeEventRestoreQueueExecutionWithGate(
  gateState,
  inputChangePreflightRecord,
  bridgeRecord,
  writeExecutionRecord,
  flushBlockerRecord,
  wrapperMutationIntentRecord,
  admission
) {
  const normalizedAdmission =
    normalizeInputChangeEventRestoreQueueExecutionAdmission(admission);
  const inputPreflight =
    assertInputChangeEventExtractionPreflightForRestoreQueueBridge(
      inputChangePreflightRecord
    );
  const sourceBridge =
    assertInputChangeEventRestoreQueueExecutionBridgeRecord(bridgeRecord);
  const sourceWriteExecution =
    assertInputChangeEventRestoreQueueExecutionWriteExecutionRecord(
      writeExecutionRecord
    );
  const sourceFlushBlocker =
    assertInputChangeEventRestoreQueueExecutionFlushBlockerRecord(
      flushBlockerRecord
    );
  const sourceWrapperIntent =
    assertInputChangeEventRestoreQueueExecutionWrapperMutationIntentRecord(
      wrapperMutationIntentRecord
    );
  const latestPropsValidation =
    createInputChangeEventRestoreQueueExecutionLatestPropsValidation(
      inputPreflight,
      sourceBridge
    );
  assertInputChangeEventRestoreQueueExecutionSources(
    inputPreflight,
    sourceBridge,
    sourceWriteExecution,
    sourceFlushBlocker,
    sourceWrapperIntent,
    normalizedAdmission,
    latestPropsValidation
  );

  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const bridgeRow = sourceBridge.bridgeRows[0];
  const writeExecutionRow =
    findInputChangeEventRestoreQueueExecutionWriteRow(
      sourceWriteExecution,
      bridgeRow
    );
  const wrapperIntentRow =
    findInputChangeEventRestoreQueueExecutionWrapperRow(
      sourceWrapperIntent,
      bridgeRow
    );
  const executionResult =
    executeInputChangeEventControlledRestoreOnFakeDom(
      gateState,
      normalizedAdmission,
      latestPropsValidation,
      sourceWriteExecution,
      sourceFlushBlocker,
      sourceWrapperIntent,
      bridgeRow,
      writeExecutionRow,
      wrapperIntentRow
    );
  const executionRows = freezeArray([
    createInputChangeEventRestoreQueueExecutionRow(
      requestId,
      requestSequence,
      sourceBridge,
      sourceWriteExecution,
      sourceFlushBlocker,
      sourceWrapperIntent,
      bridgeRow,
      writeExecutionRow,
      wrapperIntentRow,
      executionResult
    )
  ]);
  const eventExtractionEvidence =
    createInputChangeEventRestoreQueueExecutionExtractionEvidence(
      inputPreflight,
      sourceBridge
    );
  const restoreQueueWriteEvidence =
    createInputChangeEventRestoreQueueExecutionWriteEvidence(
      sourceWriteExecution,
      executionRows,
      executionResult
    );
  const flushIntentEvidence =
    createInputChangeEventRestoreQueueExecutionFlushIntentEvidence(
      sourceFlushBlocker,
      executionRows,
      executionResult
    );
  const wrapperMutationExecutionEvidence =
    createInputChangeEventRestoreQueueExecutionWrapperEvidence(
      sourceWrapperIntent,
      executionRows,
      executionResult
    );
  const sideEffects =
    createInputChangeEventRestoreQueueExecutionSideEffects(
      executionRows,
      executionResult
    );
  const postEventRestoreBoundary =
    createInputChangeEventRestoreQueueExecutionBoundary(
      executionRows,
      executionResult
    );
  const admissionRecord = normalizedAdmission.record;
  const payload = freezeRecord({
    schemaVersion: controlledInputPostEventRestoreQueueGateSchemaVersion,
    $$typeof:
      privateControlledInputPostEventRestoreQueueInputChangeExecutionRecordType,
    kind:
      'FastReactDomPrivateControlledInputChangeEventRestoreQueueExecutionRecord',
    gateId: controlledInputPostEventRestoreQueueGateId,
    compatibilityTarget,
    status: controlledInputPostEventRestoreQueueInputChangeExecutionStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    queueKind: admissionRecord.queueKind,
    queueId: admissionRecord.queueId,
    admission: admissionRecord,
    acceptedInputChangePreflightRecordKind:
      INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND,
    acceptedSourceRecordTypes: freezeArray([
      privateControlledInputPostEventRestoreQueueInputChangeBridgeRecordType,
      privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
      privateControlledInputPostEventRestoreQueueFlushBlockerRecordType,
      privateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordType
    ]),
    acceptedSourceRowTypes: freezeArray([
      privateControlledInputPostEventRestoreQueueInputChangeBridgeRowType,
      privateControlledInputPostEventRestoreQueueWriteExecutionRowType,
      privateControlledInputPostEventRestoreQueueWrapperMutationIntentRowType
    ]),
    sourceInputChangeBridgeRequestId: sourceBridge.requestId,
    sourceWriteExecutionRequestId: sourceWriteExecution.requestId,
    sourceFlushBlockerRequestId: sourceFlushBlocker.requestId,
    sourceWrapperMutationIntentRequestId: sourceWrapperIntent.requestId,
    sourcePreflightRequestId:
      sourceWriteExecution.sourcePreflightRequestId,
    sourceBridgeStatus: sourceBridge.status,
    sourceWriteExecutionStatus: sourceWriteExecution.status,
    sourceFlushBlockerStatus: sourceFlushBlocker.status,
    sourceWrapperMutationIntentStatus: sourceWrapperIntent.status,
    executionRowCount: executionRows.length,
    acceptedRestoreKinds: freezeArray(
      executionRows.map((row) => row.acceptedRestoreKind)
    ),
    sourceRequestIds: freezeArray(
      executionRows.map((row) => row.sourceRequestId)
    ),
    eventExtractionEvidence,
    latestPropsValidation: latestPropsValidation.record,
    restoreQueueWriteEvidence,
    flushIntentEvidence,
    wrapperMutationExecutionEvidence,
    inputChangeRestoreExecutionRows: executionRows,
    postEventRestoreBoundary,
    publicControlledBehaviorBoundary: createPublicControlledBehaviorBoundary(),
    sideEffects
  });

  controlledInputPostEventRestoreQueueInputChangeExecutionPayloads.set(
    payload,
    payload
  );
  return payload;
}

function recordControlledInputPostEventRestoreQueueWrapperMutationIntentWithGate(
  gateState,
  writeExecutionRecord,
  flushBlockerRecord,
  admission
) {
  const normalizedAdmission =
    normalizePostEventRestoreQueueWrapperMutationIntentAdmission(
      admission
    );
  const sourceWriteExecution =
    assertPostEventRestoreQueueWrapperMutationIntentWriteExecutionRecord(
      writeExecutionRecord
    );
  const sourceFlushBlocker =
    assertPostEventRestoreQueueWrapperMutationIntentFlushBlockerRecord(
      flushBlockerRecord
    );
  assertPostEventRestoreQueueWrapperMutationIntentSources(
    sourceWriteExecution,
    sourceFlushBlocker
  );

  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const wrapperMutationIntentRows = freezeArray(
    sourceWriteExecution.writeExecutionRows.map((sourceRow, index) =>
      createPostEventRestoreQueueWrapperMutationIntentRow(
        requestId,
        requestSequence,
        sourceWriteExecution,
        sourceFlushBlocker,
        sourceRow,
        normalizedAdmission,
        index
      )
    )
  );
  const payload = freezeRecord({
    schemaVersion: controlledInputPostEventRestoreQueueGateSchemaVersion,
    $$typeof:
      privateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordType,
    kind:
      'FastReactDomPrivateControlledInputPostEventRestoreWrapperMutationIntentRecord',
    gateId: controlledInputPostEventRestoreQueueGateId,
    compatibilityTarget,
    status: controlledInputPostEventRestoreQueueWrapperMutationIntentStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    queueKind: normalizedAdmission.queueKind,
    queueId: normalizedAdmission.queueId,
    admission: normalizedAdmission,
    acceptedSourceRecordTypes: freezeArray([
      privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
      privateControlledInputPostEventRestoreQueueFlushBlockerRecordType
    ]),
    acceptedSourceRowTypes: freezeArray([
      privateControlledInputPostEventRestoreQueueWriteExecutionRowType
    ]),
    sourceWriteExecutionRequestId: sourceWriteExecution.requestId,
    sourceWriteExecutionRequestSequence:
      sourceWriteExecution.requestSequence,
    sourceFlushBlockerRequestId: sourceFlushBlocker.requestId,
    sourceFlushBlockerRequestSequence: sourceFlushBlocker.requestSequence,
    sourcePreflightRequestId: sourceWriteExecution.sourcePreflightRequestId,
    sourcePreflightRequestSequence:
      sourceWriteExecution.sourcePreflightRequestSequence,
    sourceWriteExecutionStatus: sourceWriteExecution.status,
    sourceFlushBlockerStatus: sourceFlushBlocker.status,
    acceptedRecordCount: wrapperMutationIntentRows.length,
    acceptedRestoreKinds: freezeArray(
      wrapperMutationIntentRows.map((row) => row.acceptedRestoreKind)
    ),
    wrapperOperationNames: freezeArray(
      wrapperMutationIntentRows.map((row) => row.wrapperOperationName)
    ),
    sourceRequestIds: freezeArray(
      wrapperMutationIntentRows.map((row) => row.sourceRequestId)
    ),
    sourceRecords:
      createPostEventRestoreQueueWrapperMutationIntentSourceRecords(
        sourceWriteExecution,
        sourceFlushBlocker
      ),
    wrapperMutationIntentRows,
    wrapperMutationPlan:
      createPostEventRestoreQueueWrapperMutationIntentPlan(
        normalizedAdmission,
        sourceWriteExecution,
        sourceFlushBlocker,
        wrapperMutationIntentRows
      ),
    blockedSideEffects:
      createPostEventRestoreQueueWrapperMutationIntentBlockedSideEffects(
        wrapperMutationIntentRows
      ),
    postEventRestoreBoundary:
      createPostEventRestoreQueueWrapperMutationIntentBoundary(
        sourceWriteExecution,
        sourceFlushBlocker,
        wrapperMutationIntentRows
      ),
    publicControlledBehaviorBoundary: createPublicControlledBehaviorBoundary(),
    sideEffects:
      createPostEventRestoreQueueWrapperMutationIntentSideEffects(
        wrapperMutationIntentRows
      )
  });

  controlledInputPostEventRestoreQueueWrapperMutationIntentPayloads.set(
    payload,
    payload
  );
  return payload;
}

function describeControlledInputPostEventRestoreQueueGate() {
  return freezeRecord({
    schemaVersion: controlledInputPostEventRestoreQueueGateSchemaVersion,
    gateId: controlledInputPostEventRestoreQueueGateId,
    compatibilityTarget,
    status: controlledInputPostEventRestoreQueueStatus,
    unsupportedCode: unimplementedCode,
    acceptedSourceRecordType: EVENT_DISPATCH_RECORD_KIND,
    acceptedFakeDomObservationRecordType:
      privateControlledInputValueTrackerFakeDomDiagnosticRecordType,
    acceptedFakeDomObservationOperation: 'observe',
    acceptedLatestPropsEvidenceRecordType:
      EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
    recordsPostEventRestoreIntent: true,
    deterministicMetadataOnly: true,
    consumesEventDispatchEvidence: true,
    consumesFakeDomTrackerObservation: true,
    consumesLatestPropsEvidence: true,
    recordsCheckableRestoreMetadata: true,
    recordsRadioGroupIntentMetadata: true,
    recordsRestoreQueueWriteFlushOrdering: true,
    recordsRestoreQueueWritePreflight: true,
    recordsRestoreQueueWriteExecution: true,
    recordsRestoreQueueFlushBlocker: true,
    recordsInputChangeEventControlledRestoreBridge: true,
    recordsInputChangeEventControlledRestoreExecution: true,
    recordsRestoreWrapperMutationIntent: true,
    acceptedRestoreMetadataKinds:
      controlledInputPostEventRestoreQueueAcceptedRestoreMetadataKinds,
    acceptedWritePreflightSourceRecordType:
      privateControlledInputPostEventRestoreQueueRecordType,
    acceptedWriteExecutionSourceRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    acceptedFlushBlockerSourceRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    acceptedWrapperMutationIntentSourceRecordTypes: freezeArray([
      privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
      privateControlledInputPostEventRestoreQueueFlushBlockerRecordType
    ]),
    writePreflightRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    writeIntentRowRecordType:
      privateControlledInputPostEventRestoreQueueWriteIntentRowType,
    writeExecutionRecordType:
      privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
    writeExecutionRowRecordType:
      privateControlledInputPostEventRestoreQueueWriteExecutionRowType,
    flushBlockerRecordType:
      privateControlledInputPostEventRestoreQueueFlushBlockerRecordType,
    wrapperMutationIntentRecordType:
      privateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordType,
    wrapperMutationIntentRowRecordType:
      privateControlledInputPostEventRestoreQueueWrapperMutationIntentRowType,
    restoreQueueOrdering: createPostEventRestoreQueueGateOrderingSummary(),
    recordsRadioSiblingPropsLookupMetadata: true,
    acceptsRadioSiblingPropsAdmissionMetadata: true,
    restoreQueueWritePreflight:
      createPostEventRestoreQueueWritePreflightSummary(),
    restoreQueueWriteExecution:
      createPostEventRestoreQueueWriteExecutionSummary(),
    restoreQueueFlushBlocker:
      createPostEventRestoreQueueFlushBlockerSummary(),
    inputChangeEventControlledRestoreBridge:
      createInputChangeEventRestoreQueueBridgeSummary(),
    inputChangeEventControlledRestoreExecution:
      createInputChangeEventRestoreQueueExecutionSummary(),
    restoreWrapperMutationIntent:
      createPostEventRestoreQueueWrapperMutationIntentSummary(),
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    installsLiveDescriptors: false,
    writesValueTrackerField: false,
    performsRadioSiblingPropsLookup: false,
    performsFormTraversal: false,
    readsHostValue: false,
    writesHostValue: false,
    writesRestoreQueue: false,
    flushesRestoreQueue: false,
    invokesControlledStateRestore: false,
    publicControlledBehaviorEnabled: false,
    sideEffects: controlledInputPostEventRestoreQueueNoSideEffects
  });
}

function getPrivateControlledInputPostEventRestoreQueueRecordPayload(record) {
  return controlledInputPostEventRestoreQueueRecordPayloads.get(record) || null;
}

function getPrivateControlledInputPostEventRestoreQueueWritePreflightRecordPayload(
  record
) {
  return (
    controlledInputPostEventRestoreQueueWritePreflightPayloads.get(record) ||
    null
  );
}

function getPrivateControlledInputPostEventRestoreQueueWriteExecutionRecordPayload(
  record
) {
  return (
    controlledInputPostEventRestoreQueueWriteExecutionPayloads.get(record) ||
    null
  );
}

function getPrivateControlledInputPostEventRestoreQueueFlushBlockerRecordPayload(
  record
) {
  return (
    controlledInputPostEventRestoreQueueFlushBlockerPayloads.get(record) ||
    null
  );
}

function getPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecordPayload(
  record
) {
  return (
    controlledInputPostEventRestoreQueueInputChangeBridgePayloads.get(
      record
    ) || null
  );
}

function getPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordPayload(
  record
) {
  return (
    controlledInputPostEventRestoreQueueWrapperMutationIntentPayloads.get(
      record
    ) || null
  );
}

function isPrivateControlledInputPostEventRestoreQueueRecord(record) {
  return (
    getPrivateControlledInputPostEventRestoreQueueRecordPayload(record) !== null
  );
}

function isPrivateControlledInputPostEventRestoreQueueWritePreflightRecord(
  record
) {
  return (
    getPrivateControlledInputPostEventRestoreQueueWritePreflightRecordPayload(
      record
    ) !== null
  );
}

function isPrivateControlledInputPostEventRestoreQueueWriteExecutionRecord(
  record
) {
  return (
    getPrivateControlledInputPostEventRestoreQueueWriteExecutionRecordPayload(
      record
    ) !== null
  );
}

function isPrivateControlledInputPostEventRestoreQueueFlushBlockerRecord(
  record
) {
  return (
    getPrivateControlledInputPostEventRestoreQueueFlushBlockerRecordPayload(
      record
    ) !== null
  );
}

function isPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecord(
  record
) {
  return (
    getPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecordPayload(
      record
    ) !== null
  );
}

function getPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecordPayload(
  record
) {
  return (
    controlledInputPostEventRestoreQueueInputChangeExecutionPayloads.get(
      record
    ) || null
  );
}

function isPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecord(
  record
) {
  return (
    getPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecordPayload(
      record
    ) !== null
  );
}

function isPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecord(
  record
) {
  return (
    getPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordPayload(
      record
    ) !== null
  );
}

function createUnsupportedControlledInputPostEventRestoreQueueError(record) {
  const payload =
    assertPrivateControlledInputPostEventRestoreQueueRecord(record);
  const exportHostTag = payload.hostTag === null ? 'unknown' : payload.hostTag;
  const error = createUnsupportedError(
    'react-dom/private-internals',
    `controlled-post-event-restore.${exportHostTag}`,
    'was requested',
    'The private controlled input post-event restore queue gate records event/latest-props intent only.'
  );

  error.code = controlledInputPostEventRestoreQueueGateErrorCode;
  error.requestId = payload.requestId;
  error.requestSequence = payload.requestSequence;
  error.domEventName = payload.domEventName;
  error.nativeEventType = payload.nativeEventType;
  error.hostTag = payload.hostTag;
  error.controlKind = payload.controlKind;
  error.status = payload.status;
  error.restoreIntent = payload.restoreIntent;
  error.sideEffects = payload.sideEffects;

  return error;
}

function assertPrivateControlledInputPostEventRestoreQueueRecord(record) {
  const payload =
    getPrivateControlledInputPostEventRestoreQueueRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM controlled input post-event restore queue record.'
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code = controlledInputPostEventRestoreQueueInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertEventDispatchRecordForPostEventRestore(dispatchRecord) {
  if (
    !isObjectLike(dispatchRecord) ||
    dispatchRecord.kind !== EVENT_DISPATCH_RECORD_KIND
  ) {
    throwPostEventRestoreEventError(
      'Expected a private React DOM event dispatch record.'
    );
  }

  if (
    dispatchRecord.blockedReason !== EVENT_DISPATCH_BLOCKED_CODE ||
    !isObjectLike(dispatchRecord.controlledStateRestore) ||
    dispatchRecord.controlledStateRestore.blockedReason !==
      CONTROLLED_STATE_RESTORE_BLOCKED_CODE ||
    dispatchRecord.controlledStateRestore.scheduled !== false ||
    dispatchRecord.controlledStateRestore.status !== 'blocked'
  ) {
    throwPostEventRestoreEventError(
      'Expected an event dispatch record with controlled state restore still blocked.'
    );
  }

  return dispatchRecord;
}

function assertFakeDomTrackerObservationForPostEventRestore(record) {
  const payload =
    getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload(
      record
    );
  if (payload === null) {
    throwPostEventRestoreFakeDomObservationError(
      'Expected a private React DOM controlled input fake DOM tracker observation record.'
    );
  }

  if (
    payload.operation !== 'observe' ||
    payload.status !== controlledInputValueTrackerFakeDomObservedStatus ||
    !isObjectLike(payload.trackerRecord) ||
    payload.trackerRecord.fakeDomOnly !== true
  ) {
    throwPostEventRestoreFakeDomObservationError(
      'Expected an observed fake DOM tracker record.'
    );
  }

  return payload;
}

function createLatestPropsEvidence(dispatchRecord) {
  const lookupRecord = dispatchRecord.targetListenerLookupRecord;
  if (lookupRecord === null || lookupRecord === undefined) {
    return {
      latestProps: null,
      accepted: false,
      targetHostTag: null,
      targetHostInstanceStatus: null,
      targetResolved: false,
      record: freezeRecord({
        sourceRecordKind: null,
        latestPropsStatus: 'missing',
        latestPropsObject: false,
        listenerLookupStatus: 'not-applicable',
        targetHostInstanceStatus: null,
        targetHostTag: null,
        targetResolved: false,
        propKeys: freezeArray([]),
        controlledPropSummary: freezeRecord({}),
        exposesLatestProps: false,
        rawLatestPropsRetained: false,
        reason: 'missing-target-listener-lookup-record'
      })
    };
  }

  return createLatestPropsEvidenceFromLookupRecord(lookupRecord);
}

function createLatestPropsEvidenceFromLookupRecord(lookupRecord) {
  if (
    !isObjectLike(lookupRecord) ||
    lookupRecord.kind !== EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND
  ) {
    throwLatestPropsEvidenceError(
      'Expected a private React DOM event listener target lookup record.'
    );
  }

  const lookupPayload =
    getEventListenerTargetLookupRecordPayload(lookupRecord);
  if (lookupPayload === null) {
    throwLatestPropsEvidenceError(
      'Expected event listener target lookup payload metadata.'
    );
  }

  const latestProps = lookupPayload.latestProps;
  const latestPropsIsObject = isObjectLike(latestProps);
  const propDescription = describeLatestProps(latestProps);
  const accepted =
    lookupRecord.latestPropsStatus === 'present' && latestPropsIsObject;
  const targetHostTag = getHostTagFromTargetNode(
    lookupRecord.targetHostInstanceNode
  );
  const targetResolved =
    lookupRecord.targetHostInstanceStatus === 'mounted-host-instance';

  return {
    latestProps,
    accepted,
    targetHostTag,
    targetHostInstanceStatus: lookupRecord.targetHostInstanceStatus,
    targetResolved,
    record: freezeRecord({
      sourceRecordKind: lookupRecord.kind,
      latestPropsStatus: lookupRecord.latestPropsStatus,
      latestPropsObject: latestPropsIsObject,
      listenerLookupStatus: lookupRecord.listenerStatus,
      listenerFound: lookupRecord.listenerFound,
      registrationName: lookupRecord.registrationName,
      targetHostInstanceStatus: lookupRecord.targetHostInstanceStatus,
      targetHostTag,
      targetResolved,
      propKeys: propDescription.propKeys,
      controlledPropSummary: propDescription.controlledPropSummary,
      exposesLatestProps: false,
      rawLatestPropsRetained: false,
      accepted
    })
  };
}

function createControlledTargetEvidence(dispatchRecord, latestPropsEvidence) {
  const props = latestPropsEvidence.latestProps;
  const hostTag = getHostTagFromEventRecord(dispatchRecord);
  const inputType = getInputType(hostTag, props);
  const multiple = getSelectMultiple(hostTag, props);
  const controlKind = inferControlKind(hostTag, inputType, multiple, props);
  const controlledPropName = getControlledPropName(
    hostTag,
    controlKind,
    props
  );
  const controlledPropPresent =
    controlledPropName !== null &&
    isObjectLike(props) &&
    hasOwnProp(props, controlledPropName);
  const controlledPropIsNonNull =
    controlledPropPresent && props[controlledPropName] != null;
  const supportedEventName = isSupportedPostEventRestoreTrigger(
    dispatchRecord.domEventName,
    hostTag,
    controlKind
  );
  const supportedHostTag = supportedHostTags.has(hostTag);

  return freezeRecord({
    hostTag,
    inputType,
    multiple,
    controlKind,
    controlledPropName,
    controlledPropPresent,
    controlledPropIsNonNull,
    controlled: controlledPropIsNonNull,
    supportedHostTag,
    supportedEventName,
    targetResolved: dispatchRecord.targetResolutionStatus === 'resolved',
    targetInstStatus: dispatchRecord.targetInstStatus,
    targetHostInstanceStatus: dispatchRecord.targetHostInstanceStatus,
    trackedField: getTrackedField(hostTag, controlKind),
    valueKind: getValueKind(hostTag, controlKind),
    wrapperKind: getWrapperKind(hostTag),
    liveValueTrackerRequired: true,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    rawTargetCaptured: false,
    rawLatestPropsRetained: false
  });
}

function createControlledTargetEvidenceFromFakeDomObservation(
  observationRecord,
  latestPropsEvidence,
  admission
) {
  const props = latestPropsEvidence.latestProps;
  const hostTag = observationRecord.hostTag;
  const inputType =
    hostTag === 'input'
      ? observationRecord.inputType || getInputType(hostTag, props)
      : null;
  const multiple =
    hostTag === 'select'
      ? observationRecord.multiple === true
      : false;
  const latestPropsMultiple = getSelectMultiple(hostTag, props);
  const latestPropsControlKind = inferControlKind(
    hostTag,
    inputType,
    latestPropsMultiple,
    props
  );
  const controlKind = observationRecord.controlKind;
  const controlledPropName = getControlledPropName(
    hostTag,
    latestPropsControlKind,
    props
  );
  const controlledPropPresent =
    controlledPropName !== null &&
    isObjectLike(props) &&
    hasOwnProp(props, controlledPropName);
  const controlledPropIsNonNull =
    controlledPropPresent && props[controlledPropName] != null;
  const supportedEventName = isSupportedPostEventRestoreTrigger(
    admission.eventName,
    hostTag,
    controlKind
  );
  const supportedHostTag = supportedHostTags.has(hostTag);
  const latestPropsTargetHostTag = latestPropsEvidence.targetHostTag;
  const sourceMatchesLatestPropsTarget =
    latestPropsTargetHostTag === hostTag &&
    latestPropsControlKind === controlKind;

  return freezeRecord({
    hostTag,
    inputType,
    multiple,
    latestPropsMultiple,
    controlKind,
    latestPropsControlKind,
    controlledPropName,
    controlledPropPresent,
    controlledPropIsNonNull,
    controlled: controlledPropIsNonNull,
    supportedHostTag,
    supportedEventName,
    targetResolved: latestPropsEvidence.targetResolved === true,
    targetInstStatus: null,
    targetHostInstanceStatus: latestPropsEvidence.targetHostInstanceStatus,
    latestPropsTargetHostTag,
    sourceMatchesLatestPropsTarget,
    sourceObservationChanged: observationRecord.trackerRecord.changed === true,
    sourceObservationStatus: observationRecord.status,
    sourceObservationOperation: observationRecord.operation,
    trackedField: getTrackedField(hostTag, controlKind),
    valueKind: getValueKind(hostTag, controlKind),
    wrapperKind: getWrapperKind(hostTag),
    liveValueTrackerRequired: true,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    rawTargetCaptured: false,
    rawLatestPropsRetained: false
  });
}

function shouldRecordRestoreIntent(
  dispatchRecord,
  latestPropsEvidence,
  controlledTarget
) {
  return (
    dispatchRecord.targetResolutionStatus === 'resolved' &&
    latestPropsEvidence.accepted === true &&
    controlledTarget.supportedHostTag === true &&
    controlledTarget.supportedEventName === true &&
    controlledTarget.controlled === true
  );
}

function shouldRecordRestoreIntentFromFakeDomObservation(
  observationRecord,
  latestPropsEvidence,
  controlledTarget
) {
  return (
    observationRecord.trackerRecord.changed === true &&
    latestPropsEvidence.accepted === true &&
    controlledTarget.targetResolved === true &&
    controlledTarget.supportedHostTag === true &&
    controlledTarget.supportedEventName === true &&
    controlledTarget.controlled === true &&
    controlledTarget.sourceMatchesLatestPropsTarget === true
  );
}

function createEventEvidenceSummary(dispatchRecord) {
  const extractionRecord = dispatchRecord.extractionRecord;
  const pluginRecords = Array.isArray(extractionRecord?.pluginRecords)
    ? freezeArray(
        extractionRecord.pluginRecords.map((record) =>
          freezeRecord({
            pluginName: record.pluginName,
            extractionStatus: record.extractionStatus,
            blockedReason: record.blockedReason
          })
        )
      )
    : freezeArray([]);

  return freezeRecord({
    sourceRecordKind: dispatchRecord.kind,
    sourceRecordStatus: dispatchRecord.status,
    blockedReason: dispatchRecord.blockedReason,
    domEventName: dispatchRecord.domEventName,
    nativeEventType: dispatchRecord.nativeEventType,
    eventPriorityName: dispatchRecord.eventPriorityName,
    eventPriorityLane: dispatchRecord.eventPriorityLane,
    eventSystemFlags: dispatchRecord.eventSystemFlags,
    extractionRecordKind: extractionRecord?.kind || null,
    extractionStatus: extractionRecord?.status || null,
    extractionBlockedReason: extractionRecord?.blockedReason || null,
    pluginExtractionBlockedReason: PLUGIN_EXTRACTION_BLOCKED_CODE,
    pluginRecords,
    targetDispatchPathStatus: dispatchRecord.targetDispatchPathStatus,
    targetDispatchPathLength: dispatchRecord.targetDispatchPathLength,
    targetResolutionStatus: dispatchRecord.targetResolutionStatus,
    targetResolutionBlockedReason: dispatchRecord.targetResolutionBlockedReason,
    targetInstStatus: dispatchRecord.targetInstStatus,
    targetListenerLookupStatus: dispatchRecord.targetListenerLookupStatus,
    controlledStateRestoreStatus:
      dispatchRecord.controlledStateRestore.status,
    controlledStateRestoreScheduled:
      dispatchRecord.controlledStateRestore.scheduled,
    controlledStateRestoreBlockedReason:
      dispatchRecord.controlledStateRestore.blockedReason,
    publicRootBehaviorChanged: dispatchRecord.publicRootBehaviorChanged,
    browserDomEventCompatibilityClaimed:
      dispatchRecord.browserDomEventCompatibilityClaimed,
    syntheticEventCount: dispatchRecord.syntheticEventCount,
    listenerInvocationCount: dispatchRecord.listenerInvocationCount,
    willInvokeListeners: dispatchRecord.willInvokeListeners
  });
}

function createFakeDomObservationEvidenceSummary(observationRecord) {
  return freezeRecord({
    sourceRecordKind: observationRecord.kind,
    sourceRecordStatus: observationRecord.status,
    sourceGateId: observationRecord.gateId,
    operation: observationRecord.operation,
    lifecycleId: observationRecord.lifecycleId,
    lifecycleSequence: observationRecord.lifecycleSequence,
    operationRequestId: observationRecord.requestId,
    operationRequestSequence: observationRecord.requestSequence,
    scenarioId: observationRecord.scenarioId,
    phaseId: observationRecord.phaseId,
    hostTag: observationRecord.hostTag,
    inputType: observationRecord.inputType,
    multiple: observationRecord.multiple,
    controlKind: observationRecord.controlKind,
    contractId: observationRecord.contractId,
    fakeDomOnly: observationRecord.trackerRecord.fakeDomOnly,
    trackerAttached: observationRecord.trackerRecord.attachedAfter,
    changed: observationRecord.trackerRecord.changed,
    observedCount: observationRecord.trackerRecord.observedCount,
    trackedField: observationRecord.trackerMetadata.trackedField,
    valueKind: observationRecord.trackerMetadata.valueKind,
    previousValueSnapshot:
      observationRecord.trackerRecord.previousValueSnapshot,
    currentValueSnapshot:
      observationRecord.trackerRecord.currentValueSnapshot,
    propertyDescriptorInstalled:
      observationRecord.trackerRecord.propertyDescriptorInstalled,
    rawTargetCaptured: false,
    realDomNodeTouched: false
  });
}

function createPostEventRestoreIntentSummary(
  dispatchRecord,
  latestPropsEvidence,
  controlledTarget,
  admission,
  intentRecorded
) {
  return freezeRecord({
    source: 'private-event-dispatch-latest-props-evidence',
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    admissionEventName: admission.eventName,
    domEventName: dispatchRecord.domEventName,
    nativeEventType: dispatchRecord.nativeEventType,
    hostTag: controlledTarget.hostTag,
    inputType: controlledTarget.inputType,
    multiple: controlledTarget.multiple,
    controlKind: controlledTarget.controlKind,
    trackedField: controlledTarget.trackedField,
    controlledPropName: controlledTarget.controlledPropName,
    targetResolved: controlledTarget.targetResolved,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    controlledPropPresent: controlledTarget.controlledPropPresent,
    controlledPropIsNonNull: controlledTarget.controlledPropIsNonNull,
    supportedHostTag: controlledTarget.supportedHostTag,
    supportedEventName: controlledTarget.supportedEventName,
    intentRecorded,
    restoreTargetWouldBeQueued: intentRecorded,
    queuePosition: intentRecorded ? 'primary' : null,
    restoreQueueWriteOrderRecorded: intentRecorded,
    restoreQueueFlushOrderRecorded: intentRecorded,
    hostWrapperRestoreOrderRecorded: intentRecorded,
    latestPropsLookupRequired: true,
    latestPropsLookupPerformed: latestPropsEvidence.accepted,
    eventDispatchRecordAccepted: true,
    eventPluginDispatchPerformed: false,
    restoreQueueWritten: false,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked: false,
    restoreFlushed: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreIntentSummaryFromFakeDomObservation(
  observationRecord,
  latestPropsEvidence,
  controlledTarget,
  admission,
  intentRecorded
) {
  return freezeRecord({
    source: 'private-fake-dom-observation-latest-props-evidence',
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    admissionEventName: admission.eventName,
    domEventName: admission.eventName,
    nativeEventType: null,
    hostTag: controlledTarget.hostTag,
    inputType: controlledTarget.inputType,
    multiple: controlledTarget.multiple,
    latestPropsMultiple: controlledTarget.latestPropsMultiple,
    controlKind: controlledTarget.controlKind,
    latestPropsControlKind: controlledTarget.latestPropsControlKind,
    trackedField: controlledTarget.trackedField,
    controlledPropName: controlledTarget.controlledPropName,
    targetResolved: controlledTarget.targetResolved,
    latestPropsTargetHostTag: controlledTarget.latestPropsTargetHostTag,
    sourceMatchesLatestPropsTarget:
      controlledTarget.sourceMatchesLatestPropsTarget,
    sourceChanged: observationRecord.trackerRecord.changed,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    controlledPropPresent: controlledTarget.controlledPropPresent,
    controlledPropIsNonNull: controlledTarget.controlledPropIsNonNull,
    supportedHostTag: controlledTarget.supportedHostTag,
    supportedEventName: controlledTarget.supportedEventName,
    intentRecorded,
    restoreTargetWouldBeQueued: intentRecorded,
    queuePosition: intentRecorded ? 'primary' : null,
    restoreQueueWriteOrderRecorded: intentRecorded,
    restoreQueueFlushOrderRecorded: intentRecorded,
    hostWrapperRestoreOrderRecorded: intentRecorded,
    latestPropsLookupRequired: observationRecord.trackerRecord.changed === true,
    latestPropsLookupPerformed: latestPropsEvidence.accepted,
    fakeDomTrackerObservationAccepted: true,
    eventDispatchRecordAccepted: false,
    eventPluginDispatchRequired: observationRecord.trackerRecord.changed === true,
    eventPluginDispatchPerformed: false,
    restoreQueueWritten: false,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked: false,
    restoreFlushed: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createCheckableRestoreMetadata(
  controlledTarget,
  latestPropsEvidence,
  intentRecorded
) {
  if (!isCheckableControlledTarget(controlledTarget)) {
    return null;
  }

  const props = latestPropsEvidence.latestProps;
  const checkedProp = describeMetadataProp(props, 'checked');
  const defaultCheckedProp = describeMetadataProp(props, 'defaultChecked');
  const nameProp = describeMetadataProp(props, 'name');
  const radioGroupRestoreRequired =
    controlledTarget.inputType === 'radio' && nameProp.nonNull === true;

  return freezeRecord({
    status: controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
    hostTag: controlledTarget.hostTag,
    inputType: controlledTarget.inputType,
    controlKind: controlledTarget.controlKind,
    trackedField: controlledTarget.trackedField,
    controlledPropName: controlledTarget.controlledPropName,
    checkedProp,
    defaultCheckedProp,
    nameProp,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    targetResolved: controlledTarget.targetResolved,
    restoreIntentRecorded: intentRecorded,
    primaryInputRestoreRequired: intentRecorded,
    primaryInputRestorePerformed: false,
    checkedWriteWouldBeRequired: intentRecorded,
    checkedWritePerformed: false,
    radioGroupRestoreRequired,
    radioGroupIntentRecorded:
      radioGroupRestoreRequired === true && intentRecorded === true,
    radioGroupLookupRequired: radioGroupRestoreRequired,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    radioSiblingMetadataRead: false,
    radioSiblingInputRestoreRequired: radioGroupRestoreRequired,
    radioSiblingInputRestorePerformed: false,
    radioValueTrackerRefreshRequired: radioGroupRestoreRequired,
    radioValueTrackerRefreshed: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    rawTargetCaptured: false,
    rawGroupNodesCaptured: false,
    rawNameRetained: false,
    compatibilityClaimed: false
  });
}

function createRadioGroupSiblingPropsLookup(
  controlledTarget,
  latestPropsEvidence,
  admission,
  intentRecorded
) {
  const props = latestPropsEvidence.latestProps;
  const nameProp = describeMetadataProp(props, 'name');
  const radioGroupRestoreRequired =
    isCheckableControlledTarget(controlledTarget) &&
    controlledTarget.inputType === 'radio' &&
    nameProp.nonNull === true;
  const radioGroupIntentRecorded =
    radioGroupRestoreRequired === true && intentRecorded === true;
  const primaryFormKey = getOptionalAdmissionStringProperty(
    admission,
    'radioGroupFormKey'
  );
  const siblingEntries = getRadioGroupSiblingPropsAdmissionEntries(
    admission
  );
  const siblingRecords = siblingEntries.map((entry, index) =>
    createRadioGroupSiblingPropsRecord(
      entry,
      index,
      props,
      nameProp,
      primaryFormKey,
      radioGroupRestoreRequired,
      radioGroupIntentRecorded
    )
  );
  const acceptedSameNameSameFormCount = siblingRecords.filter(
    (record) =>
      record.status ===
        controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceAcceptedStatus &&
      record.sameName === true &&
      record.sameForm === true
  ).length;
  const acceptedSiblingPropsEvidenceCount = siblingRecords.filter(
    (record) =>
      record.status ===
      controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceAcceptedStatus
  ).length;
  const evidenceProvided = siblingRecords.length > 0;

  return freezeRecord({
    status:
      radioGroupIntentRecorded === true && evidenceProvided === true
        ? controlledInputPostEventRestoreQueueRadioSiblingPropsLookupRecordedStatus
        : controlledInputPostEventRestoreQueueRadioSiblingPropsLookupSkippedStatus,
    source: 'private-controlled-radio-group-restore-intent',
    hostTag: controlledTarget.hostTag,
    inputType: controlledTarget.inputType,
    controlKind: controlledTarget.controlKind,
    trackedField: controlledTarget.trackedField,
    groupRestoreRequired: radioGroupRestoreRequired,
    groupRestoreIntentRecorded: radioGroupIntentRecorded,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    targetResolved: controlledTarget.targetResolved,
    primaryNameProp: nameProp,
    primaryFormKeyStatus: describeOptionalStringStatus(primaryFormKey),
    evidenceProvided,
    candidateCount: siblingRecords.length,
    acceptedSameNameSameFormCount,
    acceptedSiblingPropsEvidenceCount,
    skippedCandidateCount:
      siblingRecords.length - acceptedSiblingPropsEvidenceCount,
    expectedSiblingShape: freezeRecord({
      hostTag: 'input',
      inputType: 'radio',
      sameNameRequired: radioGroupRestoreRequired,
      sameFormRequired: radioGroupRestoreRequired,
      skipPrimaryNodeRequired: radioGroupRestoreRequired,
      latestPropsEvidenceRequired: radioGroupRestoreRequired,
      wrapperExecutionRequired: false,
      valueTrackerRefreshRequired: radioGroupRestoreRequired
    }),
    records: freezeArray(siblingRecords),
    sameNameSameFormSiblingMetadataRead:
      acceptedSameNameSameFormCount > 0,
    siblingLatestPropsLookupRequired: radioGroupRestoreRequired,
    siblingLatestPropsLookupPerformed: false,
    livePropsLookupPerformed: false,
    formBoundaryCheckRequired: radioGroupRestoreRequired,
    formBoundaryMetadataRead: evidenceProvided,
    formTraversalPerformed: false,
    groupLookupRequired: radioGroupRestoreRequired,
    groupLookupPerformed: false,
    groupMembersEnumerated: false,
    wrapperExecuted: false,
    siblingInputRestorePerformed: false,
    valueTrackerRefreshRequired: radioGroupRestoreRequired,
    valueTrackerRefreshed: false,
    realDomQueried: false,
    rawGroupNodesCaptured: false,
    rawNameRetained: false,
    rawLatestPropsRetained: false,
    compatibilityClaimed: false
  });
}

function createRadioGroupSiblingPropsRecord(
  entry,
  index,
  primaryProps,
  primaryNameProp,
  primaryFormKey,
  radioGroupRestoreRequired,
  radioGroupIntentRecorded
) {
  const siblingProps = isObjectLike(entry.props) ? entry.props : null;
  const hostTag = getAdmissionStringOrDefault(entry, 'hostTag', 'input');
  const inputType = getInputType(hostTag, siblingProps);
  const nameProp = describeMetadataProp(siblingProps, 'name');
  const checkedProp = describeMetadataProp(siblingProps, 'checked');
  const defaultCheckedProp = describeMetadataProp(
    siblingProps,
    'defaultChecked'
  );
  const valueProp = describeMetadataProp(siblingProps, 'value');
  const siblingFormKey = getOptionalAdmissionStringProperty(
    entry,
    'formKey'
  );
  const targetRole = entry.isPrimary === true ? 'primary' : 'sibling';
  const primaryNameValue = getComparablePropString(primaryProps, 'name');
  const siblingNameValue = getComparablePropString(siblingProps, 'name');
  const sameName =
    primaryNameValue !== null &&
    siblingNameValue !== null &&
    primaryNameValue === siblingNameValue;
  const sameForm =
    primaryFormKey === null || siblingFormKey === null
      ? false
      : primaryFormKey === siblingFormKey;
  const validRadioSibling =
    hostTag === 'input' &&
    inputType === 'radio' &&
    nameProp.nonNull === true &&
    sameName === true &&
    sameForm === true &&
    targetRole === 'sibling';
  const evidenceAccepted =
    radioGroupIntentRecorded === true && validRadioSibling === true;

  return freezeRecord({
    status: evidenceAccepted
      ? controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceAcceptedStatus
      : controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus,
    source: 'private-controlled-radio-sibling-props-admission',
    candidateIndex: index,
    targetRole,
    hostTag,
    inputType,
    controlKind: inferControlKind(hostTag, inputType, false, siblingProps),
    trackedField: getTrackedField(
      hostTag,
      inferControlKind(hostTag, inputType, false, siblingProps)
    ),
    latestPropsObject: siblingProps !== null,
    latestPropsEvidenceAccepted: siblingProps !== null,
    propKeys:
      siblingProps === null
        ? freezeArray([])
        : describeLatestProps(siblingProps).propKeys,
    controlledPropSummary:
      siblingProps === null
        ? freezeRecord({})
        : describeLatestProps(siblingProps).controlledPropSummary,
    nameProp,
    checkedProp,
    defaultCheckedProp,
    valueProp,
    primaryNameProp,
    sameName,
    sameForm,
    sameTarget: targetRole === 'primary',
    formKeyStatus: describeOptionalStringStatus(siblingFormKey),
    primaryFormKeyStatus: describeOptionalStringStatus(primaryFormKey),
    formBoundarySource: 'admission-form-key',
    skipReason: getRadioGroupSiblingPropsSkipReason(
      radioGroupRestoreRequired,
      radioGroupIntentRecorded,
      siblingProps,
      hostTag,
      inputType,
      nameProp,
      sameName,
      sameForm,
      targetRole
    ),
    siblingPropsShapeAccepted: validRadioSibling,
    siblingWouldReceiveRestore: evidenceAccepted,
    siblingLatestPropsLookupRequired: radioGroupRestoreRequired,
    siblingLatestPropsLookupPerformed: false,
    livePropsLookupPerformed: false,
    formBoundaryCheckRequired: radioGroupRestoreRequired,
    formBoundaryMetadataRead: true,
    formTraversalPerformed: false,
    wrapperExecutionRequired: evidenceAccepted,
    wrapperExecuted: false,
    siblingInputRestoreRequired: evidenceAccepted,
    siblingInputRestorePerformed: false,
    valueTrackerRefreshRequired: radioGroupRestoreRequired,
    valueTrackerRefreshed: false,
    realDomQueried: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    rawTargetCaptured: false,
    rawLatestPropsRetained: false,
    rawFormRetained: false,
    rawNameRetained: false,
    compatibilityClaimed: false
  });
}

function createCheckableGroupIntentRecords(
  controlledTarget,
  latestPropsEvidence,
  admission,
  intentRecorded,
  radioGroupSiblingPropsLookup
) {
  if (!isCheckableControlledTarget(controlledTarget)) {
    return freezeArray([]);
  }

  const props = latestPropsEvidence.latestProps;
  const nameProp = describeMetadataProp(props, 'name');
  const checkedProp = describeMetadataProp(props, 'checked');
  const radioGroupRestoreRequired =
    controlledTarget.inputType === 'radio' && nameProp.nonNull === true;
  const radioGroupIntentRecorded =
    radioGroupRestoreRequired === true && intentRecorded === true;

  return freezeArray([
    freezeRecord({
      status: radioGroupIntentRecorded
        ? controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus
        : controlledInputPostEventRestoreQueueRadioGroupIntentSkippedStatus,
      source: 'private-controlled-checkable-restore-metadata',
      queueKind: admission.queueKind,
      queueId: admission.queueId,
      hostTag: controlledTarget.hostTag,
      inputType: controlledTarget.inputType,
      controlKind: controlledTarget.controlKind,
      trackedField: controlledTarget.trackedField,
      groupKind:
        controlledTarget.inputType === 'radio'
          ? 'radio-group'
          : 'single-checkable',
      skipReason: getCheckableGroupIntentSkipReason(
        controlledTarget,
        latestPropsEvidence,
        nameProp,
        intentRecorded
      ),
      latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
      targetResolved: controlledTarget.targetResolved,
      sourceMatchesLatestPropsTarget:
        controlledTarget.sourceMatchesLatestPropsTarget ?? null,
      supportedEventName: controlledTarget.supportedEventName,
      controlledPropPresent: controlledTarget.controlledPropPresent,
      controlledPropIsNonNull: controlledTarget.controlledPropIsNonNull,
      checkedProp,
      nameProp,
      restoreIntentRecorded: intentRecorded,
      groupRestoreRequired: radioGroupRestoreRequired,
      groupRestoreIntentRecorded: radioGroupIntentRecorded,
      primaryInputRestoreWouldRun: intentRecorded,
      primaryInputRestoreRan: false,
      groupRootWalkRequired: radioGroupRestoreRequired,
      groupRootWalkPerformed: false,
      groupLookupRequired: radioGroupRestoreRequired,
      groupLookupPerformed: false,
      groupMembersEnumerated: false,
      siblingLatestPropsLookupRequired: radioGroupRestoreRequired,
      siblingLatestPropsLookupPerformed: false,
      siblingInputRestoreRequired: radioGroupRestoreRequired,
      siblingInputRestorePerformed: false,
      mixedReactRadioValidationRequired: radioGroupRestoreRequired,
      mixedReactRadioValidationPerformed: false,
      valueTrackerRefreshRequired: radioGroupRestoreRequired,
      valueTrackerRefreshed: false,
      formBoundaryCheckRequired: radioGroupRestoreRequired,
      formBoundaryChecked: false,
      siblingPropsLookup: radioGroupSiblingPropsLookup,
      realDomQueried: false,
      hostValueRead: false,
      hostValueWritten: false,
      browserInputMutated: false,
      rawGroupNodesCaptured: false,
      rawNameRetained: false,
      compatibilityClaimed: false
    })
  ]);
}

function getCheckableGroupIntentSkipReason(
  controlledTarget,
  latestPropsEvidence,
  nameProp,
  intentRecorded
) {
  if (controlledTarget.inputType !== 'radio') {
    return 'checkboxes-do-not-restore-radio-groups';
  }
  if (latestPropsEvidence.accepted !== true) {
    return 'latest-props-evidence-not-accepted';
  }
  if (controlledTarget.targetResolved !== true) {
    return 'target-not-resolved';
  }
  if (controlledTarget.supportedEventName !== true) {
    return 'unsupported-event-name';
  }
  if (controlledTarget.controlled !== true) {
    return 'input-is-not-controlled';
  }
  if (nameProp.nonNull !== true) {
    return 'radio-name-prop-missing';
  }
  if (intentRecorded !== true) {
    return 'restore-intent-not-recorded';
  }
  return null;
}

function getRadioGroupSiblingPropsSkipReason(
  radioGroupRestoreRequired,
  radioGroupIntentRecorded,
  siblingProps,
  hostTag,
  inputType,
  nameProp,
  sameName,
  sameForm,
  targetRole
) {
  if (radioGroupRestoreRequired !== true) {
    return 'radio-group-restore-not-required';
  }
  if (radioGroupIntentRecorded !== true) {
    return 'radio-group-restore-intent-not-recorded';
  }
  if (siblingProps === null) {
    return 'sibling-latest-props-missing';
  }
  if (targetRole === 'primary') {
    return 'primary-radio-is-not-a-sibling';
  }
  if (hostTag !== 'input') {
    return 'sibling-host-tag-is-not-input';
  }
  if (inputType !== 'radio') {
    return 'sibling-input-type-is-not-radio';
  }
  if (nameProp.nonNull !== true) {
    return 'sibling-radio-name-prop-missing';
  }
  if (sameName !== true) {
    return 'sibling-radio-name-does-not-match';
  }
  if (sameForm !== true) {
    return 'sibling-radio-form-does-not-match';
  }
  return null;
}

function getRadioGroupSiblingPropsAdmissionEntries(admission) {
  if (!isObjectLike(admission)) {
    return freezeArray([]);
  }

  const entries = admission.radioGroupSiblingProps;
  if (entries == null) {
    return freezeArray([]);
  }
  if (!Array.isArray(entries)) {
    throwInvalidAdmission('radioGroupSiblingProps must be an array');
  }

  for (const entry of entries) {
    if (!isObjectLike(entry)) {
      throwInvalidAdmission('radioGroupSiblingProps entries must be objects');
    }
  }
  return freezeArray(entries);
}

function createRadioGroupSiblingPropsAdmissionSummary(admission) {
  const entries = getRadioGroupSiblingPropsAdmissionEntries(admission);
  const primaryFormKey = getOptionalAdmissionStringProperty(
    admission,
    'radioGroupFormKey'
  );

  return freezeRecord({
    provided: entries.length > 0,
    candidateCount: entries.length,
    primaryFormKeyStatus: describeOptionalStringStatus(primaryFormKey),
    deterministicMetadataOnly: true,
    propsRedacted: true,
    rawSiblingPropsRetained: false,
    rawFormRetained: false,
    livePropsLookupAllowed: false,
    formTraversalAllowed: false,
    wrapperExecutionAllowed: false
  });
}

function createPostEventRestoreBoundary(
  latestPropsEvidence,
  intentRecorded,
  status
) {
  return freezeRecord({
    status: 'blocked-post-event-controlled-restore',
    restoreQueueGateStatus: status,
    eventDispatchRecordAccepted: true,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    restoreIntentRecorded: intentRecorded,
    latestPropsLookup: latestPropsEvidence.accepted,
    eventPluginDispatch: false,
    restoreQueueWriteOrderRecorded: intentRecorded,
    restoreQueueFlushOrderRecorded: intentRecorded,
    hostWrapperRestoreOrderRecorded: intentRecorded,
    restoreQueued: false,
    restoreFlushed: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueOrdering(
  source,
  controlledTarget,
  admission,
  intentRecorded,
  groupIntentRecords
) {
  const acceptedRestoreKind = getAcceptedRestoreMetadataKind(
    controlledTarget
  );
  const radioGroupIntent = getRecordedRadioGroupIntent(groupIntentRecords);
  const orderingRecorded = intentRecorded === true;

  return freezeRecord({
    status:
      controlledInputPostEventRestoreQueueWriteFlushOrderingStatus,
    source,
    metadataOnly: true,
    acceptedRestoreMetadata: orderingRecorded,
    acceptedRestoreKind: orderingRecorded ? acceptedRestoreKind : null,
    hostTag: controlledTarget.hostTag,
    inputType: controlledTarget.inputType,
    multiple: controlledTarget.multiple,
    controlKind: controlledTarget.controlKind,
    trackedField: controlledTarget.trackedField,
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    writeOrder: createRestoreQueueWriteOrdering(
      admission,
      orderingRecorded,
      acceptedRestoreKind
    ),
    flushOrder: createRestoreQueueFlushOrdering(
      orderingRecorded,
      acceptedRestoreKind
    ),
    hostWrapperOrder: createHostWrapperRestoreOrdering(
      controlledTarget,
      orderingRecorded,
      acceptedRestoreKind,
      radioGroupIntent
    ),
    actualQueueWritePerformed: false,
    actualQueueFlushPerformed: false,
    hostWrapperInvoked: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createRestoreQueueWriteOrdering(
  admission,
  orderingRecorded,
  acceptedRestoreKind
) {
  return freezeRecord({
    status:
      controlledInputPostEventRestoreQueueWriteFlushOrderingStatus,
    metadataOnly: true,
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    acceptedRestoreKind: orderingRecorded ? acceptedRestoreKind : null,
    targetWouldBeQueued: orderingRecorded,
    queueSlot: orderingRecorded ? 'primary' : null,
    primaryTargetWriteWouldPrecedeAdditionalTargets: orderingRecorded,
    additionalTargetsWouldAppendInInsertionOrder: orderingRecorded,
    writeWouldPrecedePostEventFlush: orderingRecorded,
    writeSequence: createRestoreQueueWriteSequence(orderingRecorded),
    restoreQueueWritten: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    liveDomNodeAccepted: false,
    compatibilityClaimed: false
  });
}

function createRestoreQueueFlushOrdering(
  orderingRecorded,
  acceptedRestoreKind
) {
  return freezeRecord({
    status:
      controlledInputPostEventRestoreQueueWriteFlushOrderingStatus,
    metadataOnly: true,
    acceptedRestoreKind: orderingRecorded ? acceptedRestoreKind : null,
    flushWouldBeRequiredAfterWrite: orderingRecorded,
    pendingRestoreCheckWouldRunAfterEventBatch: orderingRecorded,
    syncWorkFlushWouldPrecedeControlledRestore: orderingRecorded,
    queueSnapshotWouldPrecedeHostWrapperRestore: orderingRecorded,
    queueClearWouldPrecedeHostWrapperRestore: orderingRecorded,
    primaryTargetWouldFlushBeforeAdditionalTargets: orderingRecorded,
    additionalTargetsWouldFlushInInsertionOrder: orderingRecorded,
    flushSequence: createRestoreQueueFlushSequence(orderingRecorded),
    controlledStateRestoreInvoked: false,
    restoreQueueFlushed: false,
    hostWrapperInvoked: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createHostWrapperRestoreOrdering(
  controlledTarget,
  orderingRecorded,
  acceptedRestoreKind,
  radioGroupIntent
) {
  const radioGroupOrderingRecorded = radioGroupIntent !== null;

  return freezeRecord({
    status:
      controlledInputPostEventRestoreQueueWriteFlushOrderingStatus,
    metadataOnly: true,
    acceptedRestoreKind: orderingRecorded ? acceptedRestoreKind : null,
    hostTag: controlledTarget.hostTag,
    inputType: controlledTarget.inputType,
    multiple: controlledTarget.multiple,
    controlKind: controlledTarget.controlKind,
    wrapperKind: controlledTarget.wrapperKind,
    wrapperOperation: getHostWrapperRestoreOperation(controlledTarget),
    wrapperDispatchWouldFollowQueueSnapshot: orderingRecorded,
    primaryHostWrapperWouldRun: orderingRecorded,
    primaryHostWrapperRan: false,
    wrapperWriteWouldBeRequired: orderingRecorded,
    wrapperWritePerformed: false,
    radioGroupRestoreWouldFollowPrimaryInputRestore:
      radioGroupOrderingRecorded,
    radioGroupLookupRequired:
      radioGroupIntent === null
        ? false
        : radioGroupIntent.groupLookupRequired,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    radioSiblingPropsRead: false,
    radioSiblingHostWrapperWouldRun: radioGroupOrderingRecorded,
    radioSiblingHostWrapperRan: false,
    radioValueTrackerRefreshWouldFollowSiblingRestore:
      radioGroupOrderingRecorded,
    radioValueTrackerRefreshed: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueGateOrderingSummary() {
  return freezeRecord({
    status:
      controlledInputPostEventRestoreQueueWriteFlushOrderingStatus,
    metadataOnly: true,
    recordsQueueWriteOrder: true,
    recordsQueueFlushOrder: true,
    recordsHostWrapperRestoreOrder: true,
    queueWriteBeforePostEventFlush: true,
    pendingRestoreCheckAfterEventBatch: true,
    syncWorkFlushBeforeControlledRestore: true,
    queueSnapshotBeforeHostWrapperRestore: true,
    primaryTargetBeforeAdditionalTargets: true,
    additionalTargetsInInsertionOrder: true,
    radioGroupRestoreAfterPrimaryInputRestore: true,
    radioValueTrackerRefreshAfterSiblingRestore: true,
    actualQueueWrites: false,
    actualQueueFlushes: false,
    hostWrapperInvocations: false,
    valueTrackerWrites: false,
    liveDomMutations: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWritePreflightSummary() {
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueWritePreflightStatus,
    metadataOnly: true,
    validatesQueueableRestoreRecords: true,
    acceptedRestoreMetadataKinds:
      controlledInputPostEventRestoreQueueAcceptedRestoreMetadataKinds,
    recordsWriteIntentRows: true,
    writeIntentRowsDeterministic: true,
    derivesRowsFromRestoreOrderingMetadata: true,
    firstQueueableRecordBecomesRestoreTarget: true,
    additionalQueueableRecordsAppendToRestoreQueue: true,
    flushPreflightOnly: true,
    actualQueueWrites: false,
    actualQueueFlushes: false,
    hostWrapperInvocations: false,
    radioGroupQueries: false,
    valueTrackerWrites: false,
    liveDomMutations: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWritePreflightPlan(
  admission,
  writeIntentRows
) {
  const additionalRowCount =
    writeIntentRows.length > 0 ? writeIntentRows.length - 1 : 0;

  return freezeRecord({
    status: controlledInputPostEventRestoreQueueWritePreflightStatus,
    metadataOnly: true,
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    writeIntentRowCount: writeIntentRows.length,
    acceptedRestoreKinds: freezeArray(
      writeIntentRows.map((row) => row.acceptedRestoreKind)
    ),
    sourceRequestIds: freezeArray(
      writeIntentRows.map((row) => row.sourceRequestId)
    ),
    firstQueueableRecordBecomesRestoreTarget:
      writeIntentRows.length > 0,
    additionalQueueableRecordsAppendToRestoreQueue:
      additionalRowCount > 0,
    additionalQueueableRecordCount: additionalRowCount,
    flushWouldBeRequiredAfterWrite: writeIntentRows.length > 0,
    writeSequence:
      createRestoreQueueWritePreflightSequence(writeIntentRows.length),
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWritePreflightBoundary(
  writeIntentRows
) {
  return freezeRecord({
    status: 'blocked-post-event-controlled-restore-queue-write-preflight',
    restoreQueueGateStatus:
      controlledInputPostEventRestoreQueueWritePreflightStatus,
    sourceRestoreRecordsAccepted: writeIntentRows.length,
    writeIntentRowsRecorded: writeIntentRows.length,
    restoreQueueWritePreflightRecorded: true,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    radioGroupLookupPerformed: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWritePreflightSideEffects(
  writeIntentRows
) {
  return freezeRecord({
    eventDispatchRecordAccepted: false,
    fakeDomTrackerObservationAccepted: false,
    latestPropsEvidenceAccepted: false,
    latestPropsMetadataRead: false,
    postEventRestoreIntentRecorded: false,
    postEventRestoreIntentSkipped: false,
    fakeDomValueChangeObserved: false,
    restoreQueueRecordCreated: false,
    restoreQueueWritePreflightRecorded: true,
    restoreQueueWriteIntentRowsCreated: writeIntentRows.length > 0,
    restoreQueueWriteIntentRowCount: writeIntentRows.length,
    restoreQueueWriteOrderRecorded: true,
    restoreQueueFlushOrderRecorded: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    hostWrapperRestoreOrderRecorded: false,
    checkableRestoreMetadataRecorded: false,
    radioGroupRestoreIntentRecorded: writeIntentRows.some(
      (row) => row.radioGroupRestoreIntentRecorded
    ),
    radioGroupLookupRequired: writeIntentRows.some(
      (row) => row.radioGroupLookupRequired
    ),
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    radioGroupSiblingMetadataRead: false,
    radioGroupValueTrackerRefreshRequired: writeIntentRows.some(
      (row) => row.radioGroupValueTrackerRefreshRequired
    ),
    radioGroupValueTrackerRefreshed: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    publicRootTouched: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWriteExecutionSummary() {
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueWriteExecutionStatus,
    metadataOnly: true,
    acceptedSourceRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    acceptedSourceRowType:
      privateControlledInputPostEventRestoreQueueWriteIntentRowType,
    writeExecutionRecordType:
      privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
    writeExecutionRowRecordType:
      privateControlledInputPostEventRestoreQueueWriteExecutionRowType,
    consumesWritePreflightRows: true,
    recordsSourcePreflightRows: true,
    recordsQueueMutationIntent: true,
    recordsRestoreTargetVsRestoreQueueOrder: true,
    recordsTargetAndControlKind: true,
    recordsBlockedFlushAndWrapperSideEffects: true,
    firstQueueableRecordBecomesRestoreTarget: true,
    additionalQueueableRecordsAppendToRestoreQueue: true,
    flushExecutionBlocked: true,
    actualQueueWrites: false,
    actualQueueFlushes: false,
    hostWrapperInvocations: false,
    radioGroupQueries: false,
    hostValueReads: false,
    hostValueWrites: false,
    valueTrackerWrites: false,
    liveDomMutations: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueFlushBlockerSummary() {
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueFlushBlockerStatus,
    metadataOnly: true,
    acceptsWritePreflightMetadata: true,
    recordsQueueSnapshot: true,
    recordsIntendedFlushOrder: true,
    recordsWrapperOperationNames: true,
    recordsWrapperBlockerReasons: true,
    provesFlushBlockedAfterAcceptedWriteMetadata: true,
    actualQueueWrites: false,
    actualQueueFlushes: false,
    hostWrapperInvocations: false,
    radioGroupQueries: false,
    valueTrackerWrites: false,
    liveDomMutations: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueBridgeSummary() {
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueInputChangeBridgeStatus,
    metadataOnly: true,
    acceptedInputChangePreflightRecordKind:
      INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND,
    acceptedRestoreQueueRecordType:
      privateControlledInputPostEventRestoreQueueRecordType,
    acceptedWritePreflightRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    bridgeRecordType:
      privateControlledInputPostEventRestoreQueueInputChangeBridgeRecordType,
    bridgeRowType:
      privateControlledInputPostEventRestoreQueueInputChangeBridgeRowType,
    consumesChangeEventExtractionPreflight: true,
    consumesControlledRestoreLatestPropsEvidence: true,
    consumesWritePreflightMetadata: true,
    rejectsUnsupportedInputTypes: true,
    rejectsStaleWritePreflightMetadata: true,
    recordsLatestPropsEvidenceBridgeRows: true,
    eventDispatches: false,
    syntheticEventCreation: false,
    valueTrackerWrites: false,
    restoreQueueWrites: false,
    restoreQueueFlushes: false,
    hostWrapperInvocations: false,
    liveDomMutations: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueExecutionSummary() {
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueInputChangeExecutionStatus,
    metadataOnly: false,
    deterministicFakeDomOnly: true,
    acceptedBridgeRecordType:
      privateControlledInputPostEventRestoreQueueInputChangeBridgeRecordType,
    acceptedWriteExecutionRecordType:
      privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
    acceptedFlushBlockerRecordType:
      privateControlledInputPostEventRestoreQueueFlushBlockerRecordType,
    acceptedWrapperMutationIntentRecordType:
      privateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordType,
    executionRecordType:
      privateControlledInputPostEventRestoreQueueInputChangeExecutionRecordType,
    executionRowType:
      privateControlledInputPostEventRestoreQueueInputChangeExecutionRowType,
    consumesChangeEventExtractionBridge: true,
    validatesLatestPropsEvidence: true,
    consumesWriteExecutionMetadata: true,
    consumesFlushIntentMetadata: true,
    consumesWrapperMutationIntentMetadata: true,
    rejectsStaleLatestProps: true,
    rejectsRadioGroupAmbiguity: true,
    rejectsLiveDomNodesBeforeMutation: true,
    acceptedRestoreMetadataKinds: freezeArray([
      'input-text-value',
      'input-checkbox-checked'
    ]),
    eventDispatches: false,
    syntheticEventCreation: false,
    restoreQueueWrites: true,
    restoreQueueFlushes: true,
    hostWrapperInvocations: true,
    wrapperWrites: true,
    hostValueReads: true,
    hostValueWrites: true,
    valueTrackerWrites: false,
    fakeDomMutations: true,
    liveDomMutations: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWrapperMutationIntentSummary() {
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueWrapperMutationIntentStatus,
    metadataOnly: true,
    acceptsWriteExecutionMetadata: true,
    acceptsFlushBlockerMetadata: true,
    recordsWrapperOperationNames: true,
    recordsTargetAndControlMetadata: true,
    recordsIntendedValueUpdates: true,
    recordsIntendedCheckedUpdates: true,
    recordsBlockedWrapperSideEffects: true,
    rejectsStaleSourcePairs: true,
    rejectsForeignSourcePairs: true,
    rejectsUnsupportedWrapperRows: true,
    actualQueueWrites: false,
    actualQueueFlushes: false,
    hostWrapperInvocations: false,
    wrapperWrites: false,
    radioGroupQueries: false,
    hostValueReads: false,
    hostValueWrites: false,
    valueTrackerWrites: false,
    liveDomMutations: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWriteExecutionSourceRows(sourceRows) {
  return freezeArray(
    sourceRows.map((row) =>
      freezeRecord({
        rowId: row.rowId,
        rowSequence: row.rowSequence,
        sourceRequestId: row.sourceRequestId,
        sourceRequestSequence: row.sourceRequestSequence,
        sourceStatus: row.sourceStatus,
        sourceKind: row.sourceKind,
        sourceQueueKind: row.sourceQueueKind,
        sourceQueueId: row.sourceQueueId,
        queueSlot: row.queueSlot,
        queueSlotIndex: row.queueSlotIndex,
        restoreQueueLengthBeforeWrite: row.restoreQueueLengthBeforeWrite,
        restoreQueueLengthAfterWrite: row.restoreQueueLengthAfterWrite,
        hostTag: row.hostTag,
        inputType: row.inputType,
        multiple: row.multiple,
        controlKind: row.controlKind,
        trackedField: row.trackedField,
        controlledPropName: row.controlledPropName,
        controlledPropSummary: row.controlledPropSummary,
        acceptedRestoreKind: row.acceptedRestoreKind,
        hostWrapperOperation: row.hostWrapperOperation,
        writeIntentRecorded: row.writeIntentRecorded,
        writeWouldRun: row.writeWouldRun,
        restoreTargetWouldBeSet: row.restoreTargetWouldBeSet,
        restoreQueueWouldBeAppended: row.restoreQueueWouldBeAppended,
        restoreQueueWritten: row.restoreQueueWritten,
        restoreQueueFlushed: row.restoreQueueFlushed,
        hostWrapperInvoked: row.hostWrapperInvoked,
        radioGroupLookupRequired: row.radioGroupLookupRequired,
        radioGroupLookupPerformed: row.radioGroupLookupPerformed,
        hostValueRead: row.hostValueRead,
        hostValueWritten: row.hostValueWritten,
        browserInputMutated: row.browserInputMutated
      })
    )
  );
}

function createPostEventRestoreQueueWriteExecutionPlan(
  admission,
  sourcePreflight,
  writeExecutionRows
) {
  const restoreQueueRows = writeExecutionRows.filter(
    (row) => row.queueSlot === 'restore-queue'
  );

  return freezeRecord({
    status: controlledInputPostEventRestoreQueueWriteExecutionStatus,
    metadataOnly: true,
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    sourcePreflightRequestId: sourcePreflight.requestId,
    sourcePreflightRequestSequence: sourcePreflight.requestSequence,
    sourcePreflightStatus: sourcePreflight.status,
    sourceWriteIntentRowCount: writeExecutionRows.length,
    acceptedRestoreKinds: freezeArray(
      writeExecutionRows.map((row) => row.acceptedRestoreKind)
    ),
    sourceRequestIds: freezeArray(
      writeExecutionRows.map((row) => row.sourceRequestId)
    ),
    writeSequence:
      createRestoreQueueWriteExecutionSequence(writeExecutionRows.length),
    restoreTargetWriteRecorded: writeExecutionRows.length > 0,
    restoreQueueAppendRecorded: restoreQueueRows.length > 0,
    restoreQueueAppendCount: restoreQueueRows.length,
    restoreTargetWriteOrder: writeExecutionRows.length > 0 ? 1 : null,
    restoreQueueWriteOrder: freezeArray(
      restoreQueueRows.map((row) => row.writeOrder)
    ),
    firstQueueableRecordBecomesRestoreTarget:
      writeExecutionRows.length > 0,
    additionalQueueableRecordsAppendToRestoreQueue:
      restoreQueueRows.length > 0,
    additionalTargetsAppendInInsertionOrder:
      restoreQueueRows.length > 0,
    restoreQueueLengthAfterWrites: restoreQueueRows.length,
    queueMutationIntentRecorded: writeExecutionRows.length > 0,
    metadataRestoreTargetWritten: writeExecutionRows.length > 0,
    metadataRestoreQueueWritten: restoreQueueRows.length > 0,
    flushWouldBeRequiredAfterWrite: writeExecutionRows.length > 0,
    postEventFlushBlocked: true,
    controlledStateRestoreBlocked: true,
    hostWrapperInvocationBlocked: true,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWriteExecutionBoundary(
  sourcePreflight,
  writeExecutionRows
) {
  const restoreQueueRows = writeExecutionRows.filter(
    (row) => row.queueSlot === 'restore-queue'
  );

  return freezeRecord({
    status: 'blocked-post-event-controlled-restore-queue-write-execution',
    restoreQueueGateStatus:
      controlledInputPostEventRestoreQueueWriteExecutionStatus,
    sourcePreflightAccepted: true,
    sourcePreflightRequestId: sourcePreflight.requestId,
    sourceWriteIntentRowsAccepted: writeExecutionRows.length,
    restoreTargetMutationRecorded: writeExecutionRows.length > 0,
    restoreQueueAppendMutationRecorded: restoreQueueRows.length > 0,
    restoreQueueWriteExecutionRecorded: true,
    restoreQueueMutationIntentRecorded: writeExecutionRows.length > 0,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    radioGroupLookupPerformed: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWriteExecutionSideEffects(
  writeExecutionRows
) {
  const restoreQueueRows = writeExecutionRows.filter(
    (row) => row.queueSlot === 'restore-queue'
  );

  return freezeRecord({
    ...controlledInputPostEventRestoreQueueNoSideEffects,
    sourceRestoreQueueWritePreflightAccepted: true,
    sourceRestoreQueueWriteIntentRowsAccepted:
      writeExecutionRows.length > 0,
    restoreQueueWriteIntentRowCount: writeExecutionRows.length,
    restoreQueueWriteExecutionRecorded: true,
    restoreQueueMutationIntentRecorded: writeExecutionRows.length > 0,
    restoreTargetMutationRecorded: writeExecutionRows.length > 0,
    restoreQueueAppendMutationRecorded: restoreQueueRows.length > 0,
    metadataRestoreTargetWritten: writeExecutionRows.length > 0,
    metadataRestoreQueueWritten: restoreQueueRows.length > 0,
    restoreQueueWriteOrderRecorded: true,
    restoreQueueFlushOrderRecorded: true,
    hostWrapperRestoreOrderRecorded: true,
    radioGroupRestoreIntentRecorded: writeExecutionRows.some(
      (row) => row.radioGroupRestoreIntentRecorded
    ),
    radioGroupLookupRequired: writeExecutionRows.some(
      (row) => row.radioGroupLookupRequired
    ),
    radioGroupValueTrackerRefreshRequired: writeExecutionRows.some(
      (row) => row.radioGroupValueTrackerRefreshRequired
    )
  });
}

function createPostEventRestoreQueueFlushBlockerSnapshot(preflightRecord) {
  const entries = freezeArray(
    preflightRecord.writeIntentRows.map((row, index) =>
      createPostEventRestoreQueueFlushBlockerSnapshotEntry(row, index)
    )
  );
  const additionalEntries = freezeArray(entries.slice(1));

  return freezeRecord({
    status: 'blocked-post-event-controlled-restore-queue-snapshot',
    metadataOnly: true,
    snapshotSource: 'accepted-write-preflight-metadata',
    sourcePreflightRequestId: preflightRecord.requestId,
    sourcePreflightRequestSequence: preflightRecord.requestSequence,
    queueKind: preflightRecord.queueKind,
    queueId: preflightRecord.queueId,
    acceptedRecordCount: preflightRecord.acceptedRecordCount,
    snapshotEntryCount: entries.length,
    sourceRequestIds: preflightRecord.sourceRequestIds,
    acceptedRestoreKinds: preflightRecord.acceptedRestoreKinds,
    wrapperOperationNames: freezeArray(
      entries.map((entry) => entry.hostWrapperOperation)
    ),
    restoreTarget: entries.length > 0 ? entries[0] : null,
    restoreQueue: additionalEntries,
    restoreQueueLength: additionalEntries.length,
    entries,
    queueSnapshotWouldPrecedeHostWrapperRestore: entries.length > 0,
    queueClearWouldPrecedeHostWrapperRestore: entries.length > 0,
    actualRestoreQueueRead: false,
    actualRestoreQueueCleared: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    rawTargetCaptured: false,
    rawLatestPropsRetained: false,
    liveDomNodeAccepted: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueFlushBlockerSnapshotEntry(row, index) {
  return freezeRecord({
    entryId: row.rowId,
    rowSequence: row.rowSequence,
    snapshotIndex: index,
    sourceRequestId: row.sourceRequestId,
    sourceQueueId: row.sourceQueueId,
    queueSlot: row.queueSlot,
    queueSlotIndex: row.queueSlotIndex,
    restoreTargetWouldBeSet: row.restoreTargetWouldBeSet,
    restoreQueueWouldBeAppended: row.restoreQueueWouldBeAppended,
    restoreQueueLengthBeforeWrite: row.restoreQueueLengthBeforeWrite,
    restoreQueueLengthAfterWrite: row.restoreQueueLengthAfterWrite,
    hostTag: row.hostTag,
    inputType: row.inputType,
    multiple: row.multiple,
    controlKind: row.controlKind,
    trackedField: row.trackedField,
    controlledPropName: row.controlledPropName,
    controlledPropSummary: row.controlledPropSummary,
    acceptedRestoreKind: row.acceptedRestoreKind,
    hostWrapperOperation: row.hostWrapperOperation,
    writeIntentAccepted: row.writeIntentRecorded === true,
    writeWouldPrecedePostEventFlush:
      row.writeWouldPrecedePostEventFlush === true,
    radioGroupRestoreIntentRecorded:
      row.radioGroupRestoreIntentRecorded === true,
    radioGroupLookupRequired: row.radioGroupLookupRequired === true,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    radioGroupValueTrackerRefreshRequired:
      row.radioGroupValueTrackerRefreshRequired === true,
    radioGroupValueTrackerRefreshed: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    rawTargetCaptured: false,
    rawLatestPropsRetained: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueFlushBlockerIntendedOrder(
  preflightRecord,
  queueSnapshot
) {
  const flushEntries = freezeArray(
    queueSnapshot.entries.map((entry, index) =>
      createPostEventRestoreQueueFlushBlockerIntendedEntry(entry, index)
    )
  );

  return freezeRecord({
    status: 'blocked-post-event-controlled-restore-flush-order',
    metadataOnly: true,
    sourcePreflightRequestId: preflightRecord.requestId,
    queueKind: preflightRecord.queueKind,
    queueId: preflightRecord.queueId,
    acceptedRecordCount: preflightRecord.acceptedRecordCount,
    flushWouldBeRequiredAfterWrite: flushEntries.length > 0,
    pendingRestoreCheckWouldRunAfterEventBatch: flushEntries.length > 0,
    syncWorkFlushWouldPrecedeControlledRestore: flushEntries.length > 0,
    queueSnapshotWouldPrecedeHostWrapperRestore: flushEntries.length > 0,
    queueClearWouldPrecedeHostWrapperRestore: flushEntries.length > 0,
    primaryTargetWouldFlushBeforeAdditionalTargets: flushEntries.length > 0,
    additionalTargetsWouldFlushInInsertionOrder: flushEntries.length > 1,
    flushSequence: createRestoreQueueFlushSequence(flushEntries.length > 0),
    wrapperOperationNames: queueSnapshot.wrapperOperationNames,
    targetFlushOrder: flushEntries,
    controlledStateRestoreInvoked: false,
    restoreQueueFlushed: false,
    hostWrapperInvoked: false,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueFlushBlockerIntendedEntry(entry, index) {
  return freezeRecord({
    flushIndex: index,
    rowSequence: entry.rowSequence,
    sourceRequestId: entry.sourceRequestId,
    queueSlot: entry.queueSlot,
    acceptedRestoreKind: entry.acceptedRestoreKind,
    hostTag: entry.hostTag,
    inputType: entry.inputType,
    multiple: entry.multiple,
    controlKind: entry.controlKind,
    trackedField: entry.trackedField,
    hostWrapperOperation: entry.hostWrapperOperation,
    flushStep:
      index === 0 ? 'restore-primary-target' : 'restore-additional-target',
    wrapperWouldRunAfterQueueSnapshot: true,
    radioGroupLookupRequired: entry.radioGroupLookupRequired,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    wrapperWritePerformed: false,
    radioGroupLookupPerformed: false,
    valueTrackerFieldWritten: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWrapperRestoreBlocker(
  preflightRecord,
  queueSnapshot
) {
  const blockerReasons =
    createPostEventRestoreQueueFlushBlockerReasons(preflightRecord);

  return freezeRecord({
    status: 'blocked-post-event-controlled-wrapper-restore-execution',
    metadataOnly: true,
    sourcePreflightRequestId: preflightRecord.requestId,
    queueKind: preflightRecord.queueKind,
    queueId: preflightRecord.queueId,
    acceptedRecordCount: preflightRecord.acceptedRecordCount,
    actualWrapperRestoreBlocked: true,
    actualWrapperRestoreBlockedReason:
      'controlled-restore-flush-execution-remains-blocked',
    blockerReasons,
    wrapperOperationNames: queueSnapshot.wrapperOperationNames,
    wrapperRows: freezeArray(
      queueSnapshot.entries.map((entry) =>
        createPostEventRestoreQueueWrapperRestoreBlockerRow(
          entry,
          blockerReasons
        )
      )
    ),
    queueSnapshotRequiredBeforeWrapperRestore: true,
    queueSnapshotRecordedFromMetadata: true,
    restoreQueueWriteMetadataAccepted: true,
    restoreQueueWriteCommittedToLiveQueue: false,
    restoreFlushExecutionAllowed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvocationAllowed: false,
    hostWrapperInvoked: false,
    radioGroupLookupAllowed: false,
    radioGroupLookupRequired:
      preflightRecord.sideEffects.radioGroupLookupRequired === true,
    radioGroupLookupPerformed: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWrapperRestoreBlockerRow(
  entry,
  blockerReasons
) {
  return freezeRecord({
    rowSequence: entry.rowSequence,
    sourceRequestId: entry.sourceRequestId,
    acceptedRestoreKind: entry.acceptedRestoreKind,
    hostTag: entry.hostTag,
    inputType: entry.inputType,
    multiple: entry.multiple,
    controlKind: entry.controlKind,
    trackedField: entry.trackedField,
    hostWrapperOperation: entry.hostWrapperOperation,
    wrapperWouldRunAfterQueueSnapshot: true,
    wrapperInvocationBlocked: true,
    actualWrapperRestoreBlockedReason:
      'controlled-restore-flush-execution-remains-blocked',
    blockerReasons,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    wrapperWritePerformed: false,
    radioGroupLookupRequired: entry.radioGroupLookupRequired,
    radioGroupLookupPerformed: false,
    radioGroupValueTrackerRefreshRequired:
      entry.radioGroupValueTrackerRefreshRequired,
    radioGroupValueTrackerRefreshed: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueFlushBlockerReasons(preflightRecord) {
  const reasons = [
    'metadata-only-diagnostic',
    'accepted-write-metadata-did-not-write-live-queue',
    'restore-flush-execution-disabled',
    'host-wrapper-invocation-disabled',
    'live-host-node-not-accepted',
    'public-controlled-behavior-disabled'
  ];

  if (preflightRecord.sideEffects.radioGroupLookupRequired === true) {
    reasons.push('radio-group-lookup-disabled');
  }

  return freezeArray(reasons);
}

function createPostEventRestoreQueueFlushBlockerBoundary(preflightRecord) {
  return freezeRecord({
    status: 'blocked-post-event-controlled-restore-queue-flush-blocker',
    restoreQueueGateStatus:
      controlledInputPostEventRestoreQueueFlushBlockerStatus,
    sourceWritePreflightRequestId: preflightRecord.requestId,
    sourceRestoreRecordsAccepted: preflightRecord.acceptedRecordCount,
    writeIntentRowsAccepted: preflightRecord.writeIntentRows.length,
    queueSnapshotRecorded: true,
    intendedFlushOrderRecorded: true,
    wrapperBlockerReasonsRecorded: true,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    radioGroupLookupPerformed: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueFlushBlockerSideEffects(
  preflightRecord
) {
  return freezeRecord({
    ...controlledInputPostEventRestoreQueueNoSideEffects,
    restoreQueueWritePreflightAccepted: true,
    restoreQueueFlushBlockerRecorded: true,
    restoreQueueSnapshotRecorded: true,
    restoreQueueIntendedFlushOrderRecorded: true,
    restoreQueueWriteIntentRowCount: preflightRecord.writeIntentRows.length,
    restoreQueueWriteOrderRecorded: true,
    restoreQueueFlushOrderRecorded: true,
    hostWrapperRestoreOrderRecorded: true,
    radioGroupRestoreIntentRecorded:
      preflightRecord.sideEffects.radioGroupRestoreIntentRecorded === true,
    radioGroupLookupRequired:
      preflightRecord.sideEffects.radioGroupLookupRequired === true,
    radioGroupValueTrackerRefreshRequired:
      preflightRecord.sideEffects.radioGroupValueTrackerRefreshRequired ===
      true
  });
}

function createInputChangeEventPreflightBridgeSourceSummary(
  inputPreflight
) {
  return freezeRecord({
    sourceRecordKind: inputPreflight.kind,
    sourceRecordStatus: inputPreflight.status,
    blockedReason: inputPreflight.blockedReason,
    pluginName: inputPreflight.pluginName,
    reactName: inputPreflight.reactName,
    reactEventType: inputPreflight.reactEventType,
    domEventName: inputPreflight.domEventName,
    nativeEventType: inputPreflight.nativeEventType,
    eventSystemFlags: inputPreflight.eventSystemFlags,
    hostTag: inputPreflight.targetTag,
    inputType: inputPreflight.targetType,
    targetKind: inputPreflight.targetMetadata.targetKind,
    targetEligible: inputPreflight.extractionMetadata.targetEligible,
    controlledPropName:
      inputPreflight.controlledMetadata.controlledPropName,
    controlled: inputPreflight.controlledMetadata.controlled,
    latestPropsEvidenceAccepted:
      inputPreflight.latestPropsEvidence.accepted,
    latestPropsPropKeys:
      normalizeBridgePropKeys(inputPreflight.latestPropsEvidence.propKeys),
    controlledRestoreBridgeEligible:
      inputPreflight.controlledRestoreQueuePreflightBridge.bridgeEligible,
    bridgeRecordCreatedBeforeLink:
      inputPreflight.controlledRestoreQueuePreflightBridge.bridgeRecordCreated,
    restoreQueuePreflightRecordedBeforeLink:
      inputPreflight.controlledRestoreQueuePreflightBridge
        .restoreQueuePreflightRecorded,
    eventDispatch: inputPreflight.eventDispatch,
    syntheticEventCount: inputPreflight.syntheticEventCount,
    listenerInvocationCount: inputPreflight.listenerInvocationCount,
    restoreQueueWritten: inputPreflight.sideEffects.postEventRestoreQueueWritten,
    valueTrackerFieldWritten:
      inputPreflight.sideEffects.valueTrackerFieldWritten,
    browserInputMutated: inputPreflight.sideEffects.browserInputMutated,
    compatibilityClaimed: inputPreflight.compatibilityClaimed
  });
}

function createInputChangeEventRestoreQueueBridgeRestoreSummary(
  restoreRecord
) {
  return freezeRecord({
    sourceRecordType:
      privateControlledInputPostEventRestoreQueueRecordType,
    sourceRecordKind: restoreRecord.kind,
    sourceRecordStatus: restoreRecord.status,
    sourceKind:
      restoreRecord.sourceKind || restoreRecord.restoreIntent.source,
    requestId: restoreRecord.requestId,
    requestSequence: restoreRecord.requestSequence,
    domEventName: restoreRecord.domEventName,
    nativeEventType: restoreRecord.nativeEventType,
    hostTag: restoreRecord.hostTag,
    inputType: restoreRecord.inputType,
    controlKind: restoreRecord.controlKind,
    controlledPropName: restoreRecord.controlledPropName,
    trackedField: restoreRecord.trackedField,
    acceptedRestoreKind:
      restoreRecord.restoreQueueOrdering.acceptedRestoreKind,
    latestPropsEvidenceAccepted:
      restoreRecord.latestPropsEvidence.accepted,
    latestPropsPropKeys:
      normalizeBridgePropKeys(restoreRecord.latestPropsEvidence.propKeys),
    eventDispatchRecordAccepted:
      restoreRecord.restoreIntent.eventDispatchRecordAccepted,
    eventPluginDispatchPerformed:
      restoreRecord.restoreIntent.eventPluginDispatchPerformed,
    restoreIntentRecorded: restoreRecord.restoreIntent.intentRecorded,
    restoreQueueWritten: restoreRecord.restoreIntent.restoreQueueWritten,
    restoreQueueFlushed: restoreRecord.restoreIntent.restoreFlushed,
    controlledStateRestoreInvoked:
      restoreRecord.restoreIntent.controlledStateRestoreInvoked,
    hostWrapperInvoked: restoreRecord.sideEffects.hostWrapperInvoked,
    valueTrackerFieldWritten:
      restoreRecord.sideEffects.valueTrackerFieldWritten,
    browserInputMutated: restoreRecord.sideEffects.browserInputMutated,
    compatibilityClaimed: restoreRecord.sideEffects.compatibilityClaimed
  });
}

function createInputChangeEventRestoreQueueBridgeWritePreflightSummary(
  writePreflight,
  writeRow
) {
  return freezeRecord({
    sourceRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    sourceRecordKind: writePreflight.kind,
    sourceRecordStatus: writePreflight.status,
    requestId: writePreflight.requestId,
    requestSequence: writePreflight.requestSequence,
    acceptedRecordCount: writePreflight.acceptedRecordCount,
    sourceRequestIds: writePreflight.sourceRequestIds,
    matchedSourceRequestId: writeRow.sourceRequestId,
    matchedRowId: writeRow.rowId,
    matchedRowSequence: writeRow.rowSequence,
    matchedQueueSlot: writeRow.queueSlot,
    matchedAcceptedRestoreKind: writeRow.acceptedRestoreKind,
    restoreQueueWritten: writePreflight.writePlan.restoreQueueWritten,
    restoreQueueFlushed: writePreflight.writePlan.restoreQueueFlushed,
    hostWrapperInvoked: writePreflight.writePlan.hostWrapperInvoked,
    valueTrackerFieldWritten:
      writePreflight.sideEffects.valueTrackerFieldWritten,
    browserInputMutated: writePreflight.sideEffects.browserInputMutated,
    compatibilityClaimed: writePreflight.sideEffects.compatibilityClaimed
  });
}

function createInputChangeEventRestoreQueueLatestPropsEvidenceBridge(
  inputPreflight,
  restoreRecord,
  writeRow
) {
  const inputPropKeys = normalizeBridgePropKeys(
    inputPreflight.latestPropsEvidence.propKeys
  );
  const restorePropKeys = normalizeBridgePropKeys(
    restoreRecord.latestPropsEvidence.propKeys
  );

  return freezeRecord({
    status:
      'linked-input-change-extraction-to-controlled-restore-latest-props-evidence',
    metadataOnly: true,
    sourceInputChangePreflightRecordKind: inputPreflight.kind,
    sourceRestoreQueueRecordType:
      privateControlledInputPostEventRestoreQueueRecordType,
    sourceWritePreflightRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    sourceRestoreRequestId: restoreRecord.requestId,
    sourceWritePreflightRequestId: writeRow.preflightRequestId,
    sourceWriteIntentRowId: writeRow.rowId,
    latestPropsEvidenceLinked: true,
    latestPropsEvidenceMatch: bridgeArraysEqual(
      inputPropKeys,
      restorePropKeys
    ),
    inputLatestPropsEvidenceAccepted:
      inputPreflight.latestPropsEvidence.accepted,
    restoreLatestPropsEvidenceAccepted:
      restoreRecord.latestPropsEvidence.accepted,
    inputLatestPropsStatus:
      inputPreflight.latestPropsEvidence.latestPropsStatus,
    restoreLatestPropsStatus:
      restoreRecord.latestPropsEvidence.latestPropsStatus,
    inputPropKeys,
    restorePropKeys,
    latestPropsExposed: false,
    rawLatestPropsRetained: false,
    eventDispatch: false,
    syntheticEventCreated: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    valueTrackerFieldWritten: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueBridgeRow(
  bridgeRequestId,
  bridgeRequestSequence,
  inputPreflight,
  restoreRecord,
  writePreflight,
  writeRow
) {
  const inputPropKeys = normalizeBridgePropKeys(
    inputPreflight.latestPropsEvidence.propKeys
  );
  const restorePropKeys = normalizeBridgePropKeys(
    restoreRecord.latestPropsEvidence.propKeys
  );

  return freezeRecord({
    $$typeof:
      privateControlledInputPostEventRestoreQueueInputChangeBridgeRowType,
    kind:
      'FastReactDomPrivateControlledInputChangeEventRestoreQueueBridgeRow',
    status:
      controlledInputPostEventRestoreQueueInputChangeBridgeRowStatus,
    bridgeRequestId,
    bridgeRequestSequence,
    rowId: `${bridgeRequestId}:row:1`,
    rowSequence: 1,
    sourceInputChangePreflightRecordKind: inputPreflight.kind,
    sourceInputChangePreflightStatus: inputPreflight.status,
    sourceInputChangePreflightBlockedReason:
      inputPreflight.blockedReason,
    sourceRestoreRequestId: restoreRecord.requestId,
    sourceRestoreRequestSequence: restoreRecord.requestSequence,
    sourceRestoreStatus: restoreRecord.status,
    sourceWritePreflightRequestId: writePreflight.requestId,
    sourceWritePreflightRequestSequence: writePreflight.requestSequence,
    sourceWritePreflightStatus: writePreflight.status,
    sourceWriteIntentRowId: writeRow.rowId,
    sourceWriteIntentRowSequence: writeRow.rowSequence,
    sourceWriteIntentRowStatus: writeRow.status,
    domEventName: inputPreflight.domEventName,
    nativeEventType: inputPreflight.nativeEventType,
    pluginName: inputPreflight.pluginName,
    reactName: inputPreflight.reactName,
    reactEventType: inputPreflight.reactEventType,
    hostTag: restoreRecord.hostTag,
    inputType: restoreRecord.inputType,
    controlKind: restoreRecord.controlKind,
    trackedField: restoreRecord.trackedField,
    controlledPropName: restoreRecord.controlledPropName,
    acceptedRestoreKind: writeRow.acceptedRestoreKind,
    hostWrapperOperation: writeRow.hostWrapperOperation,
    queueSlot: writeRow.queueSlot,
    queueSlotIndex: writeRow.queueSlotIndex,
    latestPropsEvidenceLinked: true,
    latestPropsEvidenceMatch: bridgeArraysEqual(
      inputPropKeys,
      restorePropKeys
    ),
    inputLatestPropsEvidenceAccepted:
      inputPreflight.latestPropsEvidence.accepted,
    restoreLatestPropsEvidenceAccepted:
      restoreRecord.latestPropsEvidence.accepted,
    inputLatestPropsPropKeys: inputPropKeys,
    restoreLatestPropsPropKeys: restorePropKeys,
    targetMetadataMatches: true,
    restoreWritePreflightFresh: true,
    inputChangeExtractionPreflightAccepted: true,
    controlledRestoreIntentAccepted: true,
    restoreQueueWritePreflightAccepted: true,
    restoreQueueWriteIntentRowAccepted: true,
    eventDispatch: false,
    syntheticEventCreated: false,
    syntheticEventDispatched: false,
    dispatchQueueMutated: false,
    listenerInvocationCount: 0,
    valueChangeCheckPerformed: false,
    valueTrackerUpdated: false,
    valueTrackerFieldWritten: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueBridgeBoundary(
  writePreflight,
  bridgeRows
) {
  return freezeRecord({
    status:
      'blocked-input-change-event-controlled-restore-queue-bridge',
    restoreQueueGateStatus:
      controlledInputPostEventRestoreQueueInputChangeBridgeStatus,
    sourceWritePreflightRequestId: writePreflight.requestId,
    bridgeRowsRecorded: bridgeRows.length,
    latestPropsEvidenceLinked: bridgeRows.length > 0,
    restoreQueueWritePreflightAccepted: true,
    eventDispatch: false,
    syntheticEventCreated: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    valueTrackerFieldWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueBridgeSideEffects(bridgeRows) {
  return freezeRecord({
    ...controlledInputPostEventRestoreQueueNoSideEffects,
    inputChangeEventExtractionPreflightAccepted: bridgeRows.length > 0,
    sourceRestoreQueueWritePreflightAccepted: bridgeRows.length > 0,
    sourceRestoreQueueWriteIntentRowsAccepted: bridgeRows.length > 0,
    latestPropsEvidenceAccepted: bridgeRows.length > 0,
    latestPropsMetadataRead: bridgeRows.length > 0,
    inputChangeControlledRestoreBridgeRecorded: true,
    inputChangeControlledRestoreBridgeRowsCreated: bridgeRows.length > 0,
    restoreQueueWriteIntentRowCount: bridgeRows.length,
    restoreQueueWriteOrderRecorded: bridgeRows.length > 0,
    restoreQueueFlushOrderRecorded: bridgeRows.length > 0,
    hostWrapperRestoreOrderRecorded: bridgeRows.length > 0
  });
}

function executeInputChangeEventControlledRestoreOnFakeDom(
  gateState,
  admission,
  latestPropsValidation,
  writeExecutionRecord,
  flushBlockerRecord,
  wrapperIntentRecord,
  bridgeRow,
  writeExecutionRow,
  wrapperIntentRow
) {
  const fakeDomTarget = admission.fakeDomTarget;
  const targetField = getInputChangeRestoreExecutionTargetField(bridgeRow);
  const beforeValueSnapshot = readInputChangeRestoreFakeDomField(
    fakeDomTarget,
    targetField
  );
  const nextValueSnapshot = getInputChangeRestoreNextValue(
    latestPropsValidation.latestProps,
    bridgeRow
  );
  const queueEntry = createInputChangeRestoreQueueEntry(
    bridgeRow,
    writeExecutionRow,
    wrapperIntentRow,
    targetField,
    beforeValueSnapshot,
    nextValueSnapshot
  );

  const restoreQueueLengthBeforeWrite =
    gateState.inputChangeRestoreQueue.length;
  gateState.inputChangeRestoreTarget = queueEntry;
  const restoreQueueLengthAfterWrite =
    gateState.inputChangeRestoreQueue.length;
  const queueSnapshot = freezeRecord({
    status:
      'private-input-change-controlled-restore-queue-snapshot-before-wrapper',
    sourceWriteExecutionRequestId: writeExecutionRecord.requestId,
    sourceFlushBlockerRequestId: flushBlockerRecord.requestId,
    sourceWrapperMutationIntentRequestId: wrapperIntentRecord.requestId,
    restoreTarget: createInputChangeRestoreQueueEntrySummary(queueEntry),
    restoreQueue: freezeArray(
      gateState.inputChangeRestoreQueue.map(
        createInputChangeRestoreQueueEntrySummary
      )
    ),
    restoreQueueLength: gateState.inputChangeRestoreQueue.length,
    queueSnapshotBeforeWrapperRestore: true,
    queueClearedBeforeWrapperRestore: true,
    rawTargetCaptured: false,
    liveDomNodeAccepted: false
  });

  gateState.inputChangeRestoreTarget = null;
  gateState.inputChangeRestoreQueue = [];
  writeInputChangeRestoreFakeDomField(
    fakeDomTarget,
    targetField,
    nextValueSnapshot
  );
  const afterValueSnapshot = readInputChangeRestoreFakeDomField(
    fakeDomTarget,
    targetField
  );

  return freezeRecord({
    targetField,
    beforeValueSnapshot,
    nextValueSnapshot,
    afterValueSnapshot,
    queueEntry,
    queueSnapshot,
    restoreQueueLengthBeforeWrite,
    restoreQueueLengthAfterWrite,
    restoreQueueWritten: true,
    restoreQueueFlushed: true,
    controlledStateRestoreInvoked: true,
    hostWrapperInvoked: true,
    wrapperWritePerformed: true,
    fakeDomInputMutated: true,
    hostValueRead: true,
    hostValueWritten: true,
    browserInputMutated: false,
    valueTrackerFieldWritten: false,
    liveDomNodeAccepted: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueExecutionExtractionEvidence(
  inputPreflight,
  bridgeRecord
) {
  return freezeRecord({
    status:
      'accepted-input-change-event-extraction-for-controlled-restore-execution',
    sourceInputChangePreflightRecordKind: inputPreflight.kind,
    sourceInputChangePreflightStatus: inputPreflight.status,
    blockedReason: inputPreflight.blockedReason,
    sourceBridgeRequestId: bridgeRecord.requestId,
    pluginName: inputPreflight.pluginName,
    reactName: inputPreflight.reactName,
    reactEventType: inputPreflight.reactEventType,
    domEventName: inputPreflight.domEventName,
    nativeEventType: inputPreflight.nativeEventType,
    hostTag: inputPreflight.targetTag,
    inputType: inputPreflight.targetType,
    targetKind: inputPreflight.targetMetadata.targetKind,
    inputChangeExtractionPreflightAccepted: true,
    eventDispatch: false,
    syntheticEventCreated: false,
    syntheticEventDispatched: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueExecutionRow(
  executionRequestId,
  executionRequestSequence,
  bridgeRecord,
  writeExecutionRecord,
  flushBlockerRecord,
  wrapperIntentRecord,
  bridgeRow,
  writeExecutionRow,
  wrapperIntentRow,
  executionResult
) {
  return freezeRecord({
    $$typeof:
      privateControlledInputPostEventRestoreQueueInputChangeExecutionRowType,
    kind:
      'FastReactDomPrivateControlledInputChangeEventRestoreQueueExecutionRow',
    status:
      controlledInputPostEventRestoreQueueInputChangeExecutionRowStatus,
    executionRequestId,
    executionRequestSequence,
    rowId: `${executionRequestId}:row:1`,
    rowSequence: 1,
    sourceBridgeRequestId: bridgeRecord.requestId,
    sourceBridgeRowId: bridgeRow.rowId,
    sourceRestoreRequestId: bridgeRow.sourceRestoreRequestId,
    sourceRequestId: bridgeRow.sourceRestoreRequestId,
    sourceWritePreflightRequestId:
      bridgeRow.sourceWritePreflightRequestId,
    sourceWriteIntentRowId: bridgeRow.sourceWriteIntentRowId,
    sourceWriteExecutionRequestId: writeExecutionRecord.requestId,
    sourceWriteExecutionRowId: writeExecutionRow.rowId,
    sourceFlushBlockerRequestId: flushBlockerRecord.requestId,
    sourceWrapperMutationIntentRequestId: wrapperIntentRecord.requestId,
    sourceWrapperMutationIntentRowId: wrapperIntentRow.rowId,
    domEventName: bridgeRow.domEventName,
    nativeEventType: bridgeRow.nativeEventType,
    pluginName: bridgeRow.pluginName,
    reactName: bridgeRow.reactName,
    reactEventType: bridgeRow.reactEventType,
    hostTag: bridgeRow.hostTag,
    inputType: bridgeRow.inputType,
    controlKind: bridgeRow.controlKind,
    trackedField: bridgeRow.trackedField,
    controlledPropName: bridgeRow.controlledPropName,
    acceptedRestoreKind: bridgeRow.acceptedRestoreKind,
    hostWrapperOperation: bridgeRow.hostWrapperOperation,
    wrapperMutationKind: wrapperIntentRow.wrapperMutationKind,
    intendedUpdateKind: wrapperIntentRow.intendedUpdateKind,
    targetField: executionResult.targetField,
    beforeValueSnapshot: executionResult.beforeValueSnapshot,
    nextValueSnapshot: executionResult.nextValueSnapshot,
    afterValueSnapshot: executionResult.afterValueSnapshot,
    queueSlot: bridgeRow.queueSlot,
    queueSlotIndex: bridgeRow.queueSlotIndex,
    latestPropsEvidenceLinked: bridgeRow.latestPropsEvidenceLinked,
    latestPropsEvidenceMatch: bridgeRow.latestPropsEvidenceMatch,
    latestPropsStale: false,
    radioGroupAmbiguous: false,
    fakeDomTargetAccepted: true,
    fakeDomTargetCaptured: false,
    eventExtractionAccepted: true,
    restoreQueueWriteExecutionAccepted: true,
    flushIntentAccepted: true,
    wrapperMutationIntentAccepted: true,
    wrapperMutationExecutionRecorded: true,
    restoreTargetMutationRecorded:
      writeExecutionRow.restoreTargetMutationRecorded,
    restoreQueueAppendMutationRecorded:
      writeExecutionRow.restoreQueueAppendMutationRecorded,
    metadataRestoreTargetWritten:
      writeExecutionRow.metadataRestoreTargetWritten,
    metadataRestoreQueueWritten:
      writeExecutionRow.metadataRestoreQueueWritten,
    wrapperMutationIntentRecorded: true,
    eventDispatch: false,
    syntheticEventCreated: false,
    syntheticEventDispatched: false,
    restoreQueueWritten: executionResult.restoreQueueWritten,
    restoreQueueFlushed: executionResult.restoreQueueFlushed,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked:
      executionResult.controlledStateRestoreInvoked,
    hostWrapperInvoked: executionResult.hostWrapperInvoked,
    wrapperWritePerformed: executionResult.wrapperWritePerformed,
    radioGroupLookupRequired: false,
    radioGroupLookupPerformed: false,
    valueTrackerFieldWritten: false,
    hostValueRead: executionResult.hostValueRead,
    hostValueWritten: executionResult.hostValueWritten,
    fakeDomInputMutated: executionResult.fakeDomInputMutated,
    browserInputMutated: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    liveDomNodeAccepted: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueExecutionLatestPropsValidation(
  inputPreflight,
  bridgeRecord
) {
  const preflightPayload =
    getInputChangeEventExtractionPreflightRecordPayload(inputPreflight);
  const lookupRecord =
    preflightPayload === null
      ? null
      : preflightPayload.targetListenerLookupRecord;
  const lookupPayload =
    lookupRecord == null
      ? null
      : getEventListenerTargetLookupRecordPayload(lookupRecord);
  const latestProps =
    lookupPayload === null ? null : lookupPayload.latestProps;
  const targetNode =
    lookupPayload === null ? null : lookupPayload.hostInstanceNode;
  const currentLatestProps = getLatestPropsFromNode(targetNode);
  const latestPropsObject = isObjectLike(latestProps);
  const currentLatestPropsFresh =
    latestPropsObject === true && currentLatestProps === latestProps;
  const propDescription = describeLatestProps(latestProps);
  const propKeys = normalizeBridgePropKeys(propDescription.propKeys);
  const inputPropKeys = normalizeBridgePropKeys(
    bridgeRecord.latestPropsEvidenceBridge?.inputPropKeys
  );
  const restorePropKeys = normalizeBridgePropKeys(
    bridgeRecord.latestPropsEvidenceBridge?.restorePropKeys
  );
  const propKeysMatch =
    bridgeArraysEqual(propKeys, inputPropKeys) === true &&
    bridgeArraysEqual(propKeys, restorePropKeys) === true;
  const bridgeRow = Array.isArray(bridgeRecord.bridgeRows)
    ? bridgeRecord.bridgeRows[0]
    : null;
  const controlledPropName =
    bridgeRow === null ? null : bridgeRow.controlledPropName;
  const controlledProp =
    controlledPropName === null
      ? freezeRecord({present: false, nonNull: false})
      : describeMetadataProp(latestProps, controlledPropName);
  const rejectionReason =
    getInputChangeEventRestoreQueueExecutionLatestPropsRejectionReason(
      lookupPayload,
      latestPropsObject,
      currentLatestPropsFresh,
      propKeysMatch,
      controlledProp,
      bridgeRow
    );
  const accepted = rejectionReason === null;

  return {
    accepted,
    latestProps,
    targetNode,
    record: freezeRecord({
      status: accepted
        ? 'validated-input-change-controlled-restore-latest-props'
        : 'rejected-input-change-controlled-restore-latest-props',
      sourceInputChangePreflightRecordKind: inputPreflight.kind,
      sourceBridgeRequestId: bridgeRecord.requestId,
      latestPropsValidationAccepted: accepted,
      rejectionReason,
      targetHostInstanceStatus:
        lookupRecord == null ? null : lookupRecord.targetHostInstanceStatus,
      targetHostTag: getHostTagFromTargetNode(targetNode),
      latestPropsObject,
      currentLatestPropsFresh,
      propKeys,
      inputPropKeys,
      restorePropKeys,
      propKeysMatch,
      controlledPropName,
      controlledProp,
      latestPropsEvidenceLinked:
        bridgeRecord.latestPropsEvidenceBridge.latestPropsEvidenceLinked,
      latestPropsEvidenceMatch:
        bridgeRecord.latestPropsEvidenceBridge.latestPropsEvidenceMatch,
      staleLatestPropsRejected: true,
      latestPropsExposed: false,
      rawLatestPropsRetained: false,
      compatibilityClaimed: false
    })
  };
}

function createInputChangeEventRestoreQueueExecutionWriteEvidence(
  writeExecutionRecord,
  executionRows,
  executionResult
) {
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueWriteExecutionStatus,
    sourceWriteExecutionRequestId: writeExecutionRecord.requestId,
    sourcePreflightRequestId: writeExecutionRecord.sourcePreflightRequestId,
    rowCount: executionRows.length,
    restoreQueueWriteExecutionAccepted: true,
    restoreTarget: createInputChangeRestoreQueueEntrySummary(
      executionResult.queueEntry
    ),
    restoreQueueLengthBeforeWrite:
      executionResult.restoreQueueLengthBeforeWrite,
    restoreQueueLengthAfterWrite:
      executionResult.restoreQueueLengthAfterWrite,
    metadataRestoreTargetWritten: executionRows.some(
      (row) => row.metadataRestoreTargetWritten
    ),
    metadataRestoreQueueWritten: executionRows.some(
      (row) => row.metadataRestoreQueueWritten
    ),
    restoreQueueWritten: executionResult.restoreQueueWritten,
    restoreQueueFlushed: false,
    hostWrapperInvoked: false,
    fakeDomInputMutated: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueExecutionFlushIntentEvidence(
  flushBlockerRecord,
  executionRows,
  executionResult
) {
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueFlushBlockerStatus,
    sourceFlushBlockerRequestId: flushBlockerRecord.requestId,
    sourcePreflightRequestId: flushBlockerRecord.sourcePreflightRequestId,
    rowCount: executionRows.length,
    flushIntentAccepted: true,
    intendedFlushSequence:
      flushBlockerRecord.intendedFlushOrder.flushSequence,
    queueSnapshot: executionResult.queueSnapshot,
    restoreQueueFlushed: executionResult.restoreQueueFlushed,
    controlledStateRestoreInvoked:
      executionResult.controlledStateRestoreInvoked,
    hostWrapperInvoked: false,
    fakeDomInputMutated: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueExecutionWrapperEvidence(
  wrapperIntentRecord,
  executionRows,
  executionResult
) {
  return freezeRecord({
    status:
      controlledInputPostEventRestoreQueueWrapperMutationIntentStatus,
    sourceWrapperMutationIntentRequestId: wrapperIntentRecord.requestId,
    sourceWriteExecutionRequestId:
      wrapperIntentRecord.sourceWriteExecutionRequestId,
    sourceFlushBlockerRequestId:
      wrapperIntentRecord.sourceFlushBlockerRequestId,
    rowCount: executionRows.length,
    wrapperMutationExecutionRecorded: executionRows.length > 0,
    wrapperOperationNames: freezeArray(
      executionRows.map((row) => row.hostWrapperOperation)
    ),
    targetField: executionResult.targetField,
    beforeValueSnapshot: executionResult.beforeValueSnapshot,
    nextValueSnapshot: executionResult.nextValueSnapshot,
    afterValueSnapshot: executionResult.afterValueSnapshot,
    hostWrapperInvoked: executionResult.hostWrapperInvoked,
    wrapperWritePerformed: executionResult.wrapperWritePerformed,
    hostValueRead: executionResult.hostValueRead,
    hostValueWritten: executionResult.hostValueWritten,
    fakeDomInputMutated: executionResult.fakeDomInputMutated,
    browserInputMutated: false,
    valueTrackerFieldWritten: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueExecutionBoundary(
  executionRows,
  executionResult
) {
  return freezeRecord({
    status:
      'executed-private-input-change-event-controlled-restore-queue',
    restoreQueueGateStatus:
      controlledInputPostEventRestoreQueueInputChangeExecutionStatus,
    executionRowsRecorded: executionRows.length,
    fakeDomOnly: true,
    eventExtractionAccepted: executionRows.length > 0,
    latestPropsValidated: executionRows.length > 0,
    restoreQueueWriteExecutionAccepted: executionRows.length > 0,
    flushIntentAccepted: executionRows.length > 0,
    wrapperMutationExecutionRecorded: executionRows.length > 0,
    restoreQueueWritten: executionResult.restoreQueueWritten,
    restoreQueueFlushed: executionResult.restoreQueueFlushed,
    controlledStateRestoreInvoked:
      executionResult.controlledStateRestoreInvoked,
    hostWrapperInvoked: executionResult.hostWrapperInvoked,
    wrapperWritePerformed: executionResult.wrapperWritePerformed,
    hostValueWritten: executionResult.hostValueWritten,
    fakeDomInputMutated: executionResult.fakeDomInputMutated,
    browserInputMutated: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventRestoreQueueExecutionSideEffects(
  executionRows,
  executionResult
) {
  return freezeRecord({
    ...controlledInputPostEventRestoreQueueNoSideEffects,
    inputChangeEventExtractionPreflightAccepted: executionRows.length > 0,
    latestPropsEvidenceAccepted: executionRows.length > 0,
    latestPropsMetadataRead: executionRows.length > 0,
    latestPropsValidationAccepted: executionRows.length > 0,
    inputChangeControlledRestoreBridgeRecorded: executionRows.length > 0,
    inputChangeControlledRestoreBridgeRowsCreated:
      executionRows.length > 0,
    inputChangeControlledRestoreExecutionRecorded:
      executionRows.length > 0,
    inputChangeControlledRestoreExecutionRowsCreated:
      executionRows.length > 0,
    restoreQueueWriteExecutionRecorded: executionRows.length > 0,
    restoreQueueMutationIntentRecorded: executionRows.length > 0,
    restoreQueueFlushBlockerRecorded: executionRows.length > 0,
    restoreWrapperMutationIntentRecorded: executionRows.length > 0,
    wrapperMutationIntentRowsCreated: executionRows.length > 0,
    wrapperMutationIntentRowCount: executionRows.length,
    wrapperOperationNamesRecorded: executionRows.length > 0,
    wrapperMutationExecuted: executionRows.length > 0,
    wrapperWritePerformed: executionResult.wrapperWritePerformed,
    metadataRestoreTargetWritten: executionRows.some(
      (row) => row.metadataRestoreTargetWritten
    ),
    metadataRestoreQueueWritten: executionRows.some(
      (row) => row.metadataRestoreQueueWritten
    ),
    restoreQueueWriteOrderRecorded: executionRows.length > 0,
    restoreQueueFlushOrderRecorded: executionRows.length > 0,
    hostWrapperRestoreOrderRecorded: executionRows.length > 0,
    privateRestoreQueueWritten: executionResult.restoreQueueWritten,
    privateRestoreQueueFlushed: executionResult.restoreQueueFlushed,
    privateControlledStateRestoreInvoked:
      executionResult.controlledStateRestoreInvoked,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: executionResult.hostWrapperInvoked,
    hostValueRead: executionResult.hostValueRead,
    hostValueWritten: executionResult.hostValueWritten,
    fakeDomInputMutated: executionResult.fakeDomInputMutated,
    browserInputMutated: false
  });
}

function createInputChangeRestoreQueueEntry(
  bridgeRow,
  writeExecutionRow,
  wrapperIntentRow,
  targetField,
  beforeValueSnapshot,
  nextValueSnapshot
) {
  return freezeRecord({
    status: 'queued-private-input-change-controlled-restore-target',
    sourceRestoreRequestId: bridgeRow.sourceRestoreRequestId,
    sourceWritePreflightRequestId: bridgeRow.sourceWritePreflightRequestId,
    sourceWriteExecutionRowId: writeExecutionRow.rowId,
    sourceWrapperMutationIntentRowId: wrapperIntentRow.rowId,
    queueSlot: bridgeRow.queueSlot,
    queueSlotIndex: bridgeRow.queueSlotIndex,
    hostTag: bridgeRow.hostTag,
    inputType: bridgeRow.inputType,
    controlKind: bridgeRow.controlKind,
    controlledPropName: bridgeRow.controlledPropName,
    acceptedRestoreKind: bridgeRow.acceptedRestoreKind,
    hostWrapperOperation: bridgeRow.hostWrapperOperation,
    wrapperMutationKind: wrapperIntentRow.wrapperMutationKind,
    targetField,
    beforeValueSnapshot,
    nextValueSnapshot,
    fakeDomOnly: true,
    rawTargetCaptured: false,
    liveDomNodeAccepted: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createInputChangeRestoreQueueEntrySummary(entry) {
  return freezeRecord({
    status: entry.status,
    sourceRestoreRequestId: entry.sourceRestoreRequestId,
    sourceWritePreflightRequestId: entry.sourceWritePreflightRequestId,
    sourceWriteExecutionRowId: entry.sourceWriteExecutionRowId,
    sourceWrapperMutationIntentRowId:
      entry.sourceWrapperMutationIntentRowId,
    queueSlot: entry.queueSlot,
    queueSlotIndex: entry.queueSlotIndex,
    hostTag: entry.hostTag,
    inputType: entry.inputType,
    controlKind: entry.controlKind,
    controlledPropName: entry.controlledPropName,
    acceptedRestoreKind: entry.acceptedRestoreKind,
    hostWrapperOperation: entry.hostWrapperOperation,
    wrapperMutationKind: entry.wrapperMutationKind,
    targetField: entry.targetField,
    beforeValueSnapshot: entry.beforeValueSnapshot,
    nextValueSnapshot: entry.nextValueSnapshot,
    fakeDomOnly: true,
    rawTargetCaptured: false,
    liveDomNodeAccepted: false,
    compatibilityClaimed: false
  });
}

function getInputChangeEventRestoreQueueExecutionLatestPropsRejectionReason(
  lookupPayload,
  latestPropsObject,
  currentLatestPropsFresh,
  propKeysMatch,
  controlledProp,
  bridgeRow
) {
  if (lookupPayload === null) {
    return 'missing-input-change-latest-props-lookup';
  }
  if (latestPropsObject !== true) {
    return 'input-change-latest-props-not-object';
  }
  if (currentLatestPropsFresh !== true) {
    return 'stale-latest-props-for-execution';
  }
  if (bridgeRow === null) {
    return 'missing-input-change-restore-bridge-row';
  }
  if (propKeysMatch !== true) {
    return 'latest-props-evidence-keys-mismatch';
  }
  if (
    !isObjectLike(controlledProp) ||
    controlledProp.present !== true ||
    controlledProp.nonNull !== true
  ) {
    return 'latest-props-controlled-prop-not-accepted';
  }
  return null;
}

function getInputChangeRestoreExecutionTargetField(bridgeRow) {
  return bridgeRow.controlledPropName === 'checked' ? 'checked' : 'value';
}

function getInputChangeRestoreNextValue(latestProps, bridgeRow) {
  const propName = bridgeRow.controlledPropName;
  const value = latestProps[propName];
  if (propName === 'checked') {
    return value === true;
  }
  return coerceInputChangeRestoreStringValue(value);
}

function coerceInputChangeRestoreStringValue(value) {
  if (typeof value === 'function' || typeof value === 'symbol') {
    return '';
  }
  if (value == null) {
    return '';
  }
  try {
    return String(value);
  } catch (error) {
    throwInputChangeEventRestoreQueueExecutionError(
      'latest-props-value-string-coercion-failed'
    );
  }
}

function readInputChangeRestoreFakeDomField(fakeDomTarget, targetField) {
  try {
    return targetField === 'checked'
      ? fakeDomTarget.checked === true
      : coerceInputChangeRestoreStringValue(fakeDomTarget.value);
  } catch (error) {
    throwInputChangeEventRestoreQueueExecutionError(
      'fake-dom-target-field-read-failed'
    );
  }
}

function writeInputChangeRestoreFakeDomField(
  fakeDomTarget,
  targetField,
  nextValue
) {
  try {
    fakeDomTarget[targetField] = nextValue;
  } catch (error) {
    throwInputChangeEventRestoreQueueExecutionError(
      'fake-dom-wrapper-mutation-failed'
    );
  }
}

function createPostEventRestoreQueueWrapperMutationIntentSourceRecords(
  writeExecutionRecord,
  flushBlockerRecord
) {
  return freezeRecord({
    writeExecution: freezeRecord({
      requestId: writeExecutionRecord.requestId,
      requestSequence: writeExecutionRecord.requestSequence,
      status: writeExecutionRecord.status,
      sourcePreflightRequestId:
        writeExecutionRecord.sourcePreflightRequestId,
      sourcePreflightRequestSequence:
        writeExecutionRecord.sourcePreflightRequestSequence,
      writeExecutionRowCount:
        writeExecutionRecord.writeExecutionRows.length,
      queueMutationIntentRecorded:
        writeExecutionRecord.queueMutationPlan
          .queueMutationIntentRecorded === true,
      restoreQueueWritten: false,
      restoreQueueFlushed: false,
      hostWrapperInvoked: false,
      browserInputMutated: false
    }),
    flushBlocker: freezeRecord({
      requestId: flushBlockerRecord.requestId,
      requestSequence: flushBlockerRecord.requestSequence,
      status: flushBlockerRecord.status,
      sourcePreflightRequestId:
        flushBlockerRecord.sourcePreflightRequestId,
      sourcePreflightRequestSequence:
        flushBlockerRecord.sourcePreflightRequestSequence,
      snapshotEntryCount: flushBlockerRecord.queueSnapshot.entries.length,
      wrapperRowsAccepted:
        flushBlockerRecord.wrapperRestoreBlocker.wrapperRows.length,
      actualWrapperRestoreBlocked:
        flushBlockerRecord.wrapperRestoreBlocker
          .actualWrapperRestoreBlocked === true,
      restoreQueueWritten: false,
      restoreQueueFlushed: false,
      hostWrapperInvoked: false,
      browserInputMutated: false
    })
  });
}

function createPostEventRestoreQueueWrapperMutationIntentPlan(
  admission,
  writeExecutionRecord,
  flushBlockerRecord,
  wrapperRows
) {
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueWrapperMutationIntentStatus,
    metadataOnly: true,
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    sourceWriteExecutionRequestId: writeExecutionRecord.requestId,
    sourceFlushBlockerRequestId: flushBlockerRecord.requestId,
    sourcePreflightRequestId: writeExecutionRecord.sourcePreflightRequestId,
    wrapperIntentRowCount: wrapperRows.length,
    wrapperOperationNames: freezeArray(
      wrapperRows.map((row) => row.wrapperOperationName)
    ),
    acceptedRestoreKinds: freezeArray(
      wrapperRows.map((row) => row.acceptedRestoreKind)
    ),
    wrapperSequence:
      createWrapperMutationIntentSequence(wrapperRows.length),
    valueUpdateIntentCount: wrapperRows.filter(
      (row) => row.intendedValueUpdate !== null
    ).length,
    checkedUpdateIntentCount: wrapperRows.filter(
      (row) => row.intendedCheckedUpdate !== null
    ).length,
    sourceWriteExecutionAccepted: true,
    sourceFlushBlockerAccepted: true,
    sourceRecordsSharePreflight: true,
    queueMutationMetadataAccepted: true,
    queueFlushBlockerMetadataAccepted: true,
    wrapperMutationIntentRecorded: wrapperRows.length > 0,
    wrapperSideEffectsBlocked: true,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    wrapperWritePerformed: false,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWrapperMutationIntentBlockedSideEffects(
  wrapperRows
) {
  return freezeRecord({
    status:
      'blocked-post-event-controlled-wrapper-mutation-side-effects',
    metadataOnly: true,
    wrapperIntentRowCount: wrapperRows.length,
    blockerReasons:
      createPostEventRestoreQueueWrapperMutationIntentBlockerReasons(
        wrapperRows
      ),
    restoreQueueWriteMetadataAccepted: true,
    restoreQueueFlushBlockerAccepted: true,
    wrapperOperationNamesRecorded: true,
    liveDomReadBlocked: true,
    liveDomWriteBlocked: true,
    valueTrackerWriteBlocked: true,
    radioGroupLookupBlocked: wrapperRows.some(
      (row) => row.radioGroupLookupRequired === true
    ),
    queueFlushBlocked: true,
    hostWrapperInvocationBlocked: true,
    compatibilityClaimBlocked: true,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    wrapperWritePerformed: false,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWrapperMutationIntentBlockerReasons(
  wrapperRows
) {
  const reasons = [
    'metadata-only-diagnostic',
    'accepted-write-execution-did-not-write-live-queue',
    'accepted-flush-blocker-kept-queue-flush-disabled',
    'host-wrapper-invocation-disabled',
    'wrapper-property-write-disabled',
    'live-host-node-not-accepted',
    'value-tracker-write-disabled',
    'public-controlled-behavior-disabled'
  ];

  if (
    wrapperRows.some((row) => row.radioGroupLookupRequired === true) ===
    true
  ) {
    reasons.push('radio-group-lookup-disabled');
  }

  return freezeArray(reasons);
}

function createPostEventRestoreQueueWrapperMutationIntentBoundary(
  writeExecutionRecord,
  flushBlockerRecord,
  wrapperRows
) {
  return freezeRecord({
    status: 'blocked-post-event-controlled-wrapper-mutation-intent',
    restoreQueueGateStatus:
      controlledInputPostEventRestoreQueueWrapperMutationIntentStatus,
    sourceWriteExecutionRequestId: writeExecutionRecord.requestId,
    sourceFlushBlockerRequestId: flushBlockerRecord.requestId,
    sourcePreflightRequestId: writeExecutionRecord.sourcePreflightRequestId,
    sourceRecordsSharePreflight: true,
    sourceWriteExecutionAccepted: true,
    sourceFlushBlockerAccepted: true,
    wrapperMutationIntentRowsAccepted: wrapperRows.length,
    wrapperOperationNamesRecorded: true,
    intendedValueUpdateRecorded: wrapperRows.some(
      (row) => row.intendedValueUpdate !== null
    ),
    intendedCheckedUpdateRecorded: wrapperRows.some(
      (row) => row.intendedCheckedUpdate !== null
    ),
    blockedSideEffectsRecorded: true,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    wrapperWritePerformed: false,
    radioGroupLookupPerformed: false,
    valueTrackerFieldWritten: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWrapperMutationIntentSideEffects(
  wrapperRows
) {
  return freezeRecord({
    ...controlledInputPostEventRestoreQueueNoSideEffects,
    sourceRestoreQueueWriteExecutionAccepted: true,
    sourceRestoreQueueFlushBlockerAccepted: true,
    restoreQueueWriteExecutionRecorded: true,
    restoreQueueFlushBlockerRecorded: true,
    restoreWrapperMutationIntentRecorded: true,
    wrapperMutationIntentRowsCreated: wrapperRows.length > 0,
    wrapperMutationIntentRowCount: wrapperRows.length,
    wrapperOperationNamesRecorded: true,
    wrapperIntendedValueUpdateRecorded: wrapperRows.some(
      (row) => row.intendedValueUpdate !== null
    ),
    wrapperIntendedCheckedUpdateRecorded: wrapperRows.some(
      (row) => row.intendedCheckedUpdate !== null
    ),
    wrapperSideEffectsBlocked: true,
    restoreQueueWriteIntentRowCount: wrapperRows.length,
    restoreQueueWriteOrderRecorded: true,
    restoreQueueFlushOrderRecorded: true,
    hostWrapperRestoreOrderRecorded: true,
    radioGroupRestoreIntentRecorded: wrapperRows.some(
      (row) => row.radioGroupRestoreIntentRecorded === true
    ),
    radioGroupLookupRequired: wrapperRows.some(
      (row) => row.radioGroupLookupRequired === true
    ),
    radioGroupValueTrackerRefreshRequired: wrapperRows.some(
      (row) => row.radioGroupValueTrackerRefreshRequired === true
    )
  });
}

function createPostEventRestoreQueueWrapperMutationIntentRow(
  wrapperIntentRequestId,
  wrapperIntentRequestSequence,
  writeExecutionRecord,
  flushBlockerRecord,
  sourceRow,
  admission,
  index
) {
  const rowSequence = index + 1;
  const flushEntry = flushBlockerRecord.intendedFlushOrder.targetFlushOrder[
    index
  ];
  const snapshotEntry = flushBlockerRecord.queueSnapshot.entries[index];
  const blockerRow = flushBlockerRecord.wrapperRestoreBlocker.wrapperRows[
    index
  ];
  const wrapperOperationName = sourceRow.hostWrapperOperation;
  const wrapperKind = getWrapperKind(sourceRow.hostTag);
  const wrapperMutationKind =
    getWrapperMutationKindForAcceptedRestoreKind(
      sourceRow.acceptedRestoreKind
    );
  const intendedValueUpdate =
    sourceRow.controlledPropName === 'checked'
      ? null
      : createPostEventRestoreQueueIntendedValueUpdate(sourceRow);
  const intendedCheckedUpdate =
    sourceRow.controlledPropName === 'checked'
      ? createPostEventRestoreQueueIntendedCheckedUpdate(sourceRow)
      : null;

  return freezeRecord({
    $$typeof:
      privateControlledInputPostEventRestoreQueueWrapperMutationIntentRowType,
    kind:
      'FastReactDomPrivateControlledInputPostEventRestoreWrapperMutationIntentRow',
    status: controlledInputPostEventRestoreQueueWrapperMutationIntentRowStatus,
    wrapperIntentRequestId,
    wrapperIntentRequestSequence,
    rowId: `${wrapperIntentRequestId}:row:${rowSequence}`,
    rowSequence,
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    sourceWriteExecutionRequestId: writeExecutionRecord.requestId,
    sourceWriteExecutionRequestSequence: writeExecutionRecord.requestSequence,
    sourceWriteExecutionRowId: sourceRow.rowId,
    sourceWriteExecutionRowSequence: sourceRow.rowSequence,
    sourceFlushBlockerRequestId: flushBlockerRecord.requestId,
    sourceFlushBlockerRequestSequence: flushBlockerRecord.requestSequence,
    sourceSnapshotEntryId: snapshotEntry.entryId,
    sourceFlushIndex: flushEntry.flushIndex,
    sourcePreflightRequestId: sourceRow.sourcePreflightRequestId,
    sourcePreflightRequestSequence: sourceRow.sourcePreflightRequestSequence,
    sourcePreflightRowId: sourceRow.sourcePreflightRowId,
    sourceRequestId: sourceRow.sourceRequestId,
    sourceRequestSequence: sourceRow.sourceRequestSequence,
    sourceQueueId: sourceRow.sourceQueueId,
    queueSlot: sourceRow.queueSlot,
    queueSlotIndex: sourceRow.queueSlotIndex,
    flushStep: flushEntry.flushStep,
    writeOrder: sourceRow.writeOrder,
    wrapperOrder: rowSequence,
    hostTag: sourceRow.hostTag,
    inputType: sourceRow.inputType,
    multiple: sourceRow.multiple,
    controlKind: sourceRow.controlKind,
    trackedField: sourceRow.trackedField,
    controlledPropName: sourceRow.controlledPropName,
    controlledPropSummary: sourceRow.controlledPropSummary,
    acceptedRestoreKind: sourceRow.acceptedRestoreKind,
    wrapperKind,
    wrapperOperationName,
    hostWrapperOperation: wrapperOperationName,
    wrapperMutationKind,
    intendedValueUpdate,
    intendedCheckedUpdate,
    intendedUpdateKind:
      intendedCheckedUpdate === null ? 'value' : 'checked',
    wrapperWouldRunAfterQueueSnapshot: true,
    wrapperMutationIntentRecorded: true,
    wrapperInvocationBlocked:
      blockerRow.wrapperInvocationBlocked === true,
    wrapperWriteBlocked: true,
    actualWrapperRestoreBlockedReason:
      blockerRow.actualWrapperRestoreBlockedReason,
    sourceQueueMutationIntentRecorded:
      sourceRow.queueMutationIntentRecorded === true,
    sourceFlushBlockerAccepted: true,
    radioGroupRestoreIntentRecorded:
      sourceRow.radioGroupRestoreIntentRecorded === true,
    radioGroupLookupRequired: sourceRow.radioGroupLookupRequired === true,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    radioGroupValueTrackerRefreshRequired:
      sourceRow.radioGroupValueTrackerRefreshRequired === true,
    radioGroupValueTrackerRefreshed: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    wrapperWritePerformed: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    liveDomNodeAccepted: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueIntendedValueUpdate(sourceRow) {
  return freezeRecord({
    status: 'blocked-controlled-wrapper-value-update-intent',
    metadataOnly: true,
    hostTag: sourceRow.hostTag,
    inputType: sourceRow.inputType,
    multiple: sourceRow.multiple,
    controlKind: sourceRow.controlKind,
    trackedField: sourceRow.trackedField,
    controlledPropName: sourceRow.controlledPropName,
    controlledPropSummary: sourceRow.controlledPropSummary,
    acceptedRestoreKind: sourceRow.acceptedRestoreKind,
    wrapperOperationName: sourceRow.hostWrapperOperation,
    valueKind: getValueKind(sourceRow.hostTag, sourceRow.controlKind),
    targetField: getWrapperMutationTargetField(sourceRow),
    sourceValueFromLatestPropsMetadata: true,
    wouldApplyLatestPropsValue: true,
    rawValueRetained: false,
    hostValueRead: false,
    hostValueWritten: false,
    wrapperWritePerformed: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueIntendedCheckedUpdate(sourceRow) {
  return freezeRecord({
    status: 'blocked-controlled-wrapper-checked-update-intent',
    metadataOnly: true,
    hostTag: sourceRow.hostTag,
    inputType: sourceRow.inputType,
    controlKind: sourceRow.controlKind,
    trackedField: sourceRow.trackedField,
    controlledPropName: sourceRow.controlledPropName,
    controlledPropSummary: sourceRow.controlledPropSummary,
    acceptedRestoreKind: sourceRow.acceptedRestoreKind,
    wrapperOperationName: sourceRow.hostWrapperOperation,
    valueKind: getValueKind(sourceRow.hostTag, sourceRow.controlKind),
    targetField: 'checked',
    sourceCheckedFromLatestPropsMetadata: true,
    wouldApplyLatestPropsChecked: true,
    radioGroupLookupRequired: sourceRow.radioGroupLookupRequired === true,
    radioGroupLookupPerformed: false,
    radioGroupValueTrackerRefreshRequired:
      sourceRow.radioGroupValueTrackerRefreshRequired === true,
    radioGroupValueTrackerRefreshed: false,
    rawValueRetained: false,
    hostValueRead: false,
    hostValueWritten: false,
    wrapperWritePerformed: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueRestoreTargetMutation(
  writeExecutionRows
) {
  if (writeExecutionRows.length === 0) {
    return null;
  }

  const row = writeExecutionRows[0];
  return freezeRecord({
    status: controlledInputPostEventRestoreQueueWriteExecutionStatus,
    metadataOnly: true,
    slot: 'restoreTarget',
    mutationKind: 'set-restore-target',
    writeOrder: row.writeOrder,
    sourcePreflightRowId: row.sourcePreflightRowId,
    sourceRequestId: row.sourceRequestId,
    sourceQueueId: row.sourceQueueId,
    hostTag: row.hostTag,
    inputType: row.inputType,
    multiple: row.multiple,
    controlKind: row.controlKind,
    trackedField: row.trackedField,
    controlledPropName: row.controlledPropName,
    controlledPropSummary: row.controlledPropSummary,
    acceptedRestoreKind: row.acceptedRestoreKind,
    hostWrapperOperation: row.hostWrapperOperation,
    mutationIntentRecorded: true,
    restoreTargetWouldBeSet: true,
    restoreQueueWouldBeAppended: false,
    metadataRestoreTargetWritten: true,
    metadataRestoreQueueWritten: false,
    restoreTargetWritten: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    rawTargetCaptured: false,
    liveDomNodeAccepted: false,
    browserInputMutated: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueRestoreQueueMutations(
  writeExecutionRows
) {
  return freezeArray(
    writeExecutionRows
      .filter((row) => row.queueSlot === 'restore-queue')
      .map((row) =>
        freezeRecord({
          status: controlledInputPostEventRestoreQueueWriteExecutionStatus,
          metadataOnly: true,
          slot: 'restoreQueue',
          mutationKind: 'append-restore-queue',
          writeOrder: row.writeOrder,
          appendOrder: row.restoreQueueWriteOrder,
          queueIndex: row.queueSlotIndex,
          sourcePreflightRowId: row.sourcePreflightRowId,
          sourceRequestId: row.sourceRequestId,
          sourceQueueId: row.sourceQueueId,
          restoreQueueLengthBeforeWrite:
            row.restoreQueueLengthBeforeWrite,
          restoreQueueLengthAfterWrite:
            row.restoreQueueLengthAfterWrite,
          hostTag: row.hostTag,
          inputType: row.inputType,
          multiple: row.multiple,
          controlKind: row.controlKind,
          trackedField: row.trackedField,
          controlledPropName: row.controlledPropName,
          controlledPropSummary: row.controlledPropSummary,
          acceptedRestoreKind: row.acceptedRestoreKind,
          hostWrapperOperation: row.hostWrapperOperation,
          mutationIntentRecorded: true,
          restoreTargetWouldBeSet: false,
          restoreQueueWouldBeAppended: true,
          metadataRestoreTargetWritten: false,
          metadataRestoreQueueWritten: true,
          restoreTargetWritten: false,
          restoreQueueWritten: false,
          restoreQueueFlushed: false,
          controlledStateRestoreInvoked: false,
          hostWrapperInvoked: false,
          rawTargetCaptured: false,
          liveDomNodeAccepted: false,
          browserInputMutated: false,
          compatibilityClaimed: false
        })
      )
  );
}

function createPostEventRestoreQueueWriteExecutionRow(
  executionRequestId,
  executionRequestSequence,
  sourcePreflight,
  sourceRow,
  admission,
  index
) {
  const rowSequence = index + 1;
  const restoreTargetMutationRecorded =
    sourceRow.queueSlot === 'restore-target';
  const restoreQueueAppendMutationRecorded =
    sourceRow.queueSlot === 'restore-queue';

  return freezeRecord({
    $$typeof:
      privateControlledInputPostEventRestoreQueueWriteExecutionRowType,
    kind:
      'FastReactDomPrivateControlledInputPostEventRestoreQueueWriteExecutionRow',
    status: controlledInputPostEventRestoreQueueWriteExecutionRowStatus,
    executionRequestId,
    executionRequestSequence,
    rowId: `${executionRequestId}:row:${rowSequence}`,
    rowSequence,
    writeOrder: rowSequence,
    sourcePreflightRequestId: sourcePreflight.requestId,
    sourcePreflightRequestSequence: sourcePreflight.requestSequence,
    sourcePreflightStatus: sourcePreflight.status,
    sourcePreflightRowId: sourceRow.rowId,
    sourcePreflightRowSequence: sourceRow.rowSequence,
    sourcePreflightRowStatus: sourceRow.status,
    sourceRequestId: sourceRow.sourceRequestId,
    sourceRequestSequence: sourceRow.sourceRequestSequence,
    sourceStatus: sourceRow.sourceStatus,
    sourceKind: sourceRow.sourceKind,
    sourceQueueKind: sourceRow.sourceQueueKind,
    sourceQueueId: sourceRow.sourceQueueId,
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    hostTag: sourceRow.hostTag,
    inputType: sourceRow.inputType,
    multiple: sourceRow.multiple,
    controlKind: sourceRow.controlKind,
    trackedField: sourceRow.trackedField,
    controlledPropName: sourceRow.controlledPropName,
    controlledPropSummary: sourceRow.controlledPropSummary,
    acceptedRestoreKind: sourceRow.acceptedRestoreKind,
    hostWrapperOperation: sourceRow.hostWrapperOperation,
    sourceQueueSlot: sourceRow.queueSlot,
    queueSlot: sourceRow.queueSlot,
    queueSlotIndex: sourceRow.queueSlotIndex,
    queueMutationKind: restoreTargetMutationRecorded
      ? 'set-restore-target'
      : 'append-restore-queue',
    restoreTargetWriteOrder: restoreTargetMutationRecorded ? 1 : null,
    restoreQueueWriteOrder: restoreQueueAppendMutationRecorded
      ? sourceRow.queueSlotIndex + 1
      : null,
    restoreQueueLengthBeforeWrite:
      sourceRow.restoreQueueLengthBeforeWrite,
    restoreQueueLengthAfterWrite:
      sourceRow.restoreQueueLengthAfterWrite,
    firstQueueableRecord: sourceRow.firstQueueableRecord,
    sourceWriteIntentRecorded: sourceRow.writeIntentRecorded,
    sourceWriteWouldRun: sourceRow.writeWouldRun,
    sourceWriteOrderAccepted: sourceRow.sourceWriteOrderAccepted,
    sourceFlushOrderAccepted: sourceRow.sourceFlushOrderAccepted,
    sourceHostWrapperOrderAccepted:
      sourceRow.sourceHostWrapperOrderAccepted,
    writeExecutionRecorded: true,
    queueMutationIntentRecorded: true,
    restoreTargetMutationRecorded,
    restoreQueueAppendMutationRecorded,
    restoreTargetWouldBeSet: sourceRow.restoreTargetWouldBeSet,
    restoreQueueWouldBeAppended: sourceRow.restoreQueueWouldBeAppended,
    metadataRestoreTargetWritten: restoreTargetMutationRecorded,
    metadataRestoreQueueWritten: restoreQueueAppendMutationRecorded,
    radioGroupRestoreIntentRecorded:
      sourceRow.radioGroupRestoreIntentRecorded,
    radioGroupLookupRequired: sourceRow.radioGroupLookupRequired,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    radioGroupValueTrackerRefreshRequired:
      sourceRow.radioGroupValueTrackerRefreshRequired,
    radioGroupValueTrackerRefreshed: false,
    restoreTargetWritten: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueWriteIntentRow(
  preflightRequestId,
  preflightRequestSequence,
  sourceRecord,
  admission,
  index
) {
  const rowSequence = index + 1;
  const queueSlot = index === 0 ? 'restore-target' : 'restore-queue';
  const restoreQueueLengthBeforeWrite = index === 0 ? 0 : index - 1;
  const restoreQueueLengthAfterWrite = index === 0 ? 0 : index;
  const radioGroupRestoreIntentRecorded =
    sourceRecord.sideEffects.radioGroupRestoreIntentRecorded === true;
  const radioGroupLookupRequired =
    sourceRecord.sideEffects.radioGroupLookupRequired === true;
  const radioGroupValueTrackerRefreshRequired =
    sourceRecord.sideEffects.radioGroupValueTrackerRefreshRequired === true;

  return freezeRecord({
    $$typeof: privateControlledInputPostEventRestoreQueueWriteIntentRowType,
    kind:
      'FastReactDomPrivateControlledInputPostEventRestoreQueueWriteIntentRow',
    status: controlledInputPostEventRestoreQueueWriteIntentRowStatus,
    preflightRequestId,
    preflightRequestSequence,
    rowId: `${preflightRequestId}:row:${rowSequence}`,
    rowSequence,
    sourceRequestId: sourceRecord.requestId,
    sourceRequestSequence: sourceRecord.requestSequence,
    sourceStatus: sourceRecord.status,
    sourceKind:
      sourceRecord.sourceKind || 'private-event-dispatch-latest-props-evidence',
    sourceQueueKind: sourceRecord.admission.queueKind,
    sourceQueueId: sourceRecord.admission.queueId,
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    hostTag: sourceRecord.hostTag,
    inputType: sourceRecord.inputType,
    multiple: sourceRecord.multiple,
    controlKind: sourceRecord.controlKind,
    trackedField: sourceRecord.trackedField,
    controlledPropName: sourceRecord.controlledPropName,
    controlledPropSummary:
      getControlledPropSummaryFromSourceRecord(sourceRecord),
    acceptedRestoreKind:
      sourceRecord.restoreQueueOrdering.acceptedRestoreKind,
    hostWrapperOperation:
      sourceRecord.restoreQueueOrdering.hostWrapperOrder.wrapperOperation,
    queueable: true,
    writeIntentRecorded: true,
    writeWouldRun: true,
    queueSlot,
    queueSlotIndex: queueSlot === 'restore-target' ? 0 : index - 1,
    firstQueueableRecord: index === 0,
    restoreTargetWouldBeSet: index === 0,
    restoreQueueWouldBeAppended: index > 0,
    restoreQueueLengthBeforeWrite,
    restoreQueueLengthAfterWrite,
    writeWouldPrecedePostEventFlush: true,
    sourceWriteOrderAccepted:
      sourceRecord.restoreQueueOrdering.writeOrder.targetWouldBeQueued ===
      true,
    sourceFlushOrderAccepted:
      sourceRecord.restoreQueueOrdering.flushOrder
        .flushWouldBeRequiredAfterWrite === true,
    sourceHostWrapperOrderAccepted:
      sourceRecord.restoreQueueOrdering.hostWrapperOrder
        .primaryHostWrapperWouldRun === true,
    radioGroupRestoreIntentRecorded,
    radioGroupLookupRequired,
    radioGroupLookupPerformed: false,
    radioGroupMembersEnumerated: false,
    radioGroupValueTrackerRefreshRequired,
    radioGroupValueTrackerRefreshed: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    liveValueTrackerInstalled: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createRestoreQueueWriteSequence(orderingRecorded) {
  if (orderingRecorded !== true) {
    return freezeArray([]);
  }

  return freezeArray([
    'accept-restore-metadata',
    'record-latest-props-evidence',
    'would-store-primary-restore-target',
    'would-defer-controlled-restore-until-batch-exit'
  ]);
}

function createRestoreQueueWritePreflightSequence(writeIntentRowCount) {
  if (writeIntentRowCount === 0) {
    return freezeArray([]);
  }

  const sequence = [
    'validate-queueable-restore-records',
    'record-restore-target-write-intent'
  ];
  if (writeIntentRowCount > 1) {
    sequence.push('record-additional-restore-queue-write-intents');
  }
  sequence.push('keep-post-event-controlled-restore-flush-blocked');
  return freezeArray(sequence);
}

function createRestoreQueueWriteExecutionSequence(writeExecutionRowCount) {
  if (writeExecutionRowCount === 0) {
    return freezeArray([]);
  }

  const sequence = [
    'consume-restore-queue-write-preflight',
    'record-restore-target-mutation-intent'
  ];
  if (writeExecutionRowCount > 1) {
    sequence.push('record-restore-queue-append-mutation-intents');
  }
  sequence.push('keep-post-event-controlled-restore-flush-blocked');
  sequence.push('keep-host-wrapper-restore-blocked');
  return freezeArray(sequence);
}

function createRestoreQueueFlushSequence(orderingRecorded) {
  if (orderingRecorded !== true) {
    return freezeArray([]);
  }

  return freezeArray([
    'event-batch-exit',
    'pending-restore-check',
    'synchronous-work-flush',
    'snapshot-and-clear-private-queue',
    'restore-primary-target',
    'restore-additional-targets-in-order',
    'host-wrapper-restore-dispatch'
  ]);
}

function createWrapperMutationIntentSequence(wrapperIntentRowCount) {
  if (wrapperIntentRowCount === 0) {
    return freezeArray([]);
  }

  return freezeArray([
    'consume-restore-queue-write-execution',
    'consume-restore-queue-flush-blocker',
    'cross-check-shared-source-preflight',
    'record-wrapper-operation-mutation-intents',
    'keep-wrapper-invocation-blocked',
    'keep-live-wrapper-writes-blocked'
  ]);
}

function createPostEventRestoreQueueSideEffects(
  latestPropsEvidence,
  intentRecorded,
  controlledTarget,
  groupIntentRecords,
  radioGroupSiblingPropsLookup
) {
  const radioGroupIntent = getRecordedRadioGroupIntent(groupIntentRecords);
  const checkable = isCheckableControlledTarget(controlledTarget);
  const siblingPropsAccepted =
    radioGroupSiblingPropsLookup.acceptedSiblingPropsEvidenceCount > 0;

  return freezeRecord({
    ...controlledInputPostEventRestoreQueueNoSideEffects,
    eventDispatchRecordAccepted: true,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    latestPropsMetadataRead: latestPropsEvidence.accepted,
    postEventRestoreIntentRecorded: intentRecorded,
    postEventRestoreIntentSkipped: !intentRecorded,
    restoreQueueRecordCreated: true,
    restoreQueueWriteOrderRecorded: intentRecorded,
    restoreQueueFlushOrderRecorded: intentRecorded,
    hostWrapperRestoreOrderRecorded: intentRecorded,
    checkableRestoreMetadataRecorded: checkable,
    radioGroupRestoreIntentRecorded: radioGroupIntent !== null,
    radioGroupLookupRequired:
      radioGroupIntent === null
        ? false
        : radioGroupIntent.groupLookupRequired,
    radioGroupSiblingMetadataRead:
      radioGroupSiblingPropsLookup.sameNameSameFormSiblingMetadataRead,
    radioGroupSiblingPropsEvidenceAccepted: siblingPropsAccepted,
    radioGroupSiblingPropsSameNameSameFormRecorded:
      radioGroupSiblingPropsLookup.acceptedSameNameSameFormCount > 0,
    radioGroupFormBoundaryMetadataRead:
      radioGroupSiblingPropsLookup.formBoundaryMetadataRead,
    radioGroupValueTrackerRefreshRequired:
      radioGroupIntent === null
        ? false
        : radioGroupIntent.valueTrackerRefreshRequired
  });
}

function createPostEventRestoreQueueSideEffectsFromFakeDomObservation(
  observationRecord,
  latestPropsEvidence,
  intentRecorded,
  controlledTarget,
  groupIntentRecords,
  radioGroupSiblingPropsLookup
) {
  const radioGroupIntent = getRecordedRadioGroupIntent(groupIntentRecords);
  const checkable = isCheckableControlledTarget(controlledTarget);
  const siblingPropsAccepted =
    radioGroupSiblingPropsLookup.acceptedSiblingPropsEvidenceCount > 0;

  return freezeRecord({
    ...controlledInputPostEventRestoreQueueNoSideEffects,
    fakeDomTrackerObservationAccepted: true,
    fakeDomValueChangeObserved: observationRecord.trackerRecord.changed === true,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    latestPropsMetadataRead: latestPropsEvidence.accepted,
    postEventRestoreIntentRecorded: intentRecorded,
    postEventRestoreIntentSkipped: !intentRecorded,
    restoreQueueRecordCreated: true,
    restoreQueueWriteOrderRecorded: intentRecorded,
    restoreQueueFlushOrderRecorded: intentRecorded,
    hostWrapperRestoreOrderRecorded: intentRecorded,
    checkableRestoreMetadataRecorded: checkable,
    radioGroupRestoreIntentRecorded: radioGroupIntent !== null,
    radioGroupLookupRequired:
      radioGroupIntent === null
        ? false
        : radioGroupIntent.groupLookupRequired,
    radioGroupSiblingMetadataRead:
      radioGroupSiblingPropsLookup.sameNameSameFormSiblingMetadataRead,
    radioGroupSiblingPropsEvidenceAccepted: siblingPropsAccepted,
    radioGroupSiblingPropsSameNameSameFormRecorded:
      radioGroupSiblingPropsLookup.acceptedSameNameSameFormCount > 0,
    radioGroupFormBoundaryMetadataRead:
      radioGroupSiblingPropsLookup.formBoundaryMetadataRead,
    radioGroupValueTrackerRefreshRequired:
      radioGroupIntent === null
        ? false
        : radioGroupIntent.valueTrackerRefreshRequired
  });
}

function createPublicControlledBehaviorBoundary() {
  return freezeRecord({
    status: 'blocked-public-controlled-form-behavior',
    rootRenderReachable: false,
    hostWrapperWrites: false,
    warningsEmitted: false,
    nativeFormIntegration: false,
    compatibilityClaimed: false
  });
}

function normalizeInputChangeEventRestoreQueueBridgeAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwInputChangeEventRestoreQueueBridgeError(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwInputChangeEventRestoreQueueBridgeError(
      'explicitAdmission must be true'
    );
  }

  const queueKind = getAdmissionStringProperty(
    admission,
    'queueKind',
    'deterministic-input-change-event-controlled-restore-bridge'
  );
  if (
    queueKind !==
    'deterministic-input-change-event-controlled-restore-bridge'
  ) {
    throwInputChangeEventRestoreQueueBridgeError(
      'queueKind must be deterministic-input-change-event-controlled-restore-bridge'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'controlled-input-change-event-restore-queue-bridge'
  );
  if (targetKind !== 'controlled-input-change-event-restore-queue-bridge') {
    throwInputChangeEventRestoreQueueBridgeError(
      'targetKind must be controlled-input-change-event-restore-queue-bridge'
    );
  }

  return freezeRecord({
    queueKind,
    queueId: getAdmissionStringProperty(
      admission,
      'queueId',
      'anonymous-input-change-controlled-restore-bridge'
    ),
    targetKind,
    explicitAdmission: true,
    deterministicMetadataOnly: true,
    acceptedInputChangePreflightRecordKind:
      INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND,
    acceptedRestoreQueueRecordType:
      privateControlledInputPostEventRestoreQueueRecordType,
    acceptedWritePreflightRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    recordsLatestPropsEvidenceBridgeRows: true,
    eventDispatchAllowed: false,
    syntheticEventCreationAllowed: false,
    valueTrackerFieldWriteAllowed: false,
    restoreQueueWriteAllowed: false,
    restoreFlushAllowed: false,
    hostWrapperInvocationAllowed: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    realDomNodeAccepted: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function normalizeInputChangeEventRestoreQueueExecutionAdmission(
  admission
) {
  if (admission == null || typeof admission !== 'object') {
    throwInputChangeEventRestoreQueueExecutionError(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwInputChangeEventRestoreQueueExecutionError(
      'explicitAdmission must be true'
    );
  }

  const queueKind = getAdmissionStringProperty(
    admission,
    'queueKind',
    'deterministic-input-change-event-controlled-restore-execution'
  );
  if (
    queueKind !==
    'deterministic-input-change-event-controlled-restore-execution'
  ) {
    throwInputChangeEventRestoreQueueExecutionError(
      'queueKind must be deterministic-input-change-event-controlled-restore-execution'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'controlled-input-change-event-restore-queue-execution'
  );
  if (
    targetKind !==
    'controlled-input-change-event-restore-queue-execution'
  ) {
    throwInputChangeEventRestoreQueueExecutionError(
      'targetKind must be controlled-input-change-event-restore-queue-execution'
    );
  }

  const fakeDomTarget = admission.fakeDomTarget;
  if (!isObjectLike(fakeDomTarget)) {
    throwInputChangeEventRestoreQueueExecutionError(
      'fakeDomTarget must be an object'
    );
  }
  if (isExplicitControlledRestoreFakeDomTarget(fakeDomTarget) !== true) {
    throwInputChangeEventRestoreQueueExecutionError(
      'fakeDomTarget must carry the private fake DOM marker'
    );
  }
  if (isLikelyLiveDomNode(fakeDomTarget)) {
    throwInputChangeEventRestoreQueueExecutionError(
      'unsupported-live-dom-node'
    );
  }

  return {
    fakeDomTarget,
    record: freezeRecord({
      queueKind,
      queueId: getAdmissionStringProperty(
        admission,
        'queueId',
        'anonymous-input-change-controlled-restore-execution'
      ),
      targetKind,
      explicitAdmission: true,
      deterministicFakeDomOnly: true,
      fakeDomTargetAccepted: true,
      fakeDomTargetCaptured: false,
      acceptedSourceRecordTypes: freezeArray([
        privateControlledInputPostEventRestoreQueueInputChangeBridgeRecordType,
        privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
        privateControlledInputPostEventRestoreQueueFlushBlockerRecordType,
        privateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordType
      ]),
      recordsEventExtraction: true,
      recordsLatestPropsValidation: true,
      recordsRestoreQueueWriteExecution: true,
      recordsFlushIntent: true,
      recordsWrapperMutationExecutionEvidence: true,
      rejectsStaleLatestProps: true,
      rejectsRadioGroupAmbiguity: true,
      rejectsLiveDomNodesBeforeMutation: true,
      restoreQueueWriteAllowed: true,
      restoreFlushAllowed: true,
      hostWrapperInvocationAllowed: true,
      wrapperWriteAllowed: true,
      radioGroupLookupAllowed: false,
      liveDescriptorInstallationAllowed: false,
      valueTrackerFieldWriteAllowed: false,
      hostValueReadAllowed: true,
      hostValueWriteAllowed: true,
      rawTargetCaptured: false,
      rawLatestPropsRetained: false,
      realDomNodeAccepted: false,
      publicControlledBehaviorEnabled: false,
      compatibilityClaimed: false
    })
  };
}

function normalizePostEventRestoreQueueAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidAdmission('admission metadata must be an object');
  }

  if (admission.explicitAdmission !== true) {
    throwInvalidAdmission('explicitAdmission must be true');
  }

  const queueKind = getAdmissionStringProperty(
    admission,
    'queueKind',
    'deterministic-event-latest-props-post-event-restore-queue'
  );
  if (
    queueKind !==
      'deterministic-event-latest-props-post-event-restore-queue' &&
    queueKind !==
      'deterministic-fake-dom-latest-props-post-event-restore-queue'
  ) {
    throwInvalidAdmission(
      'queueKind must be a deterministic post-event restore queue'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'controlled-input-post-event-restore-queue'
  );
  if (targetKind !== 'controlled-input-post-event-restore-queue') {
    throwInvalidAdmission(
      'targetKind must be controlled-input-post-event-restore-queue'
    );
  }

  return freezeRecord({
    queueKind,
    queueId: getAdmissionStringProperty(
      admission,
      'queueId',
      'anonymous-event-latest-props-controlled-restore-queue'
    ),
    eventName: getAdmissionStringProperty(
      admission,
      'eventName',
      'change'
    ),
    targetKind,
    explicitAdmission: true,
    deterministicMetadataOnly: true,
    radioGroupSiblingPropsEvidence:
      createRadioGroupSiblingPropsAdmissionSummary(admission),
    sourceEventRecordRequired:
      queueKind ===
      'deterministic-event-latest-props-post-event-restore-queue',
    sourceFakeDomObservationRecordRequired:
      queueKind ===
      'deterministic-fake-dom-latest-props-post-event-restore-queue',
    latestPropsEvidenceRequired: true,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    realDomNodeAccepted: false,
    liveDescriptorInstallationAllowed: false,
    valueTrackerFieldWriteAllowed: false,
    hostValueReadAllowed: false,
    hostValueWriteAllowed: false,
    restoreQueueWriteAllowed: false,
    restoreFlushAllowed: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function normalizePostEventRestoreQueueWritePreflightAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwPostEventRestoreQueueWritePreflightError(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwPostEventRestoreQueueWritePreflightError(
      'explicitAdmission must be true'
    );
  }

  const queueKind = getAdmissionStringProperty(
    admission,
    'queueKind',
    'deterministic-controlled-input-post-event-restore-queue-write-preflight'
  );
  if (
    queueKind !==
    'deterministic-controlled-input-post-event-restore-queue-write-preflight'
  ) {
    throwPostEventRestoreQueueWritePreflightError(
      'queueKind must be deterministic-controlled-input-post-event-restore-queue-write-preflight'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'controlled-input-post-event-restore-queue-write-preflight'
  );
  if (
    targetKind !==
    'controlled-input-post-event-restore-queue-write-preflight'
  ) {
    throwPostEventRestoreQueueWritePreflightError(
      'targetKind must be controlled-input-post-event-restore-queue-write-preflight'
    );
  }

  return freezeRecord({
    queueKind,
    queueId: getAdmissionStringProperty(
      admission,
      'queueId',
      'anonymous-controlled-restore-queue-write-preflight'
    ),
    targetKind,
    explicitAdmission: true,
    deterministicMetadataOnly: true,
    acceptedSourceRecordType:
      privateControlledInputPostEventRestoreQueueRecordType,
    acceptedRestoreMetadataKinds:
      controlledInputPostEventRestoreQueueAcceptedRestoreMetadataKinds,
    validatesQueueableRestoreRecords: true,
    recordsWriteIntentRows: true,
    restoreQueueWriteAllowed: false,
    restoreFlushAllowed: false,
    hostWrapperInvocationAllowed: false,
    radioGroupLookupAllowed: false,
    liveDescriptorInstallationAllowed: false,
    valueTrackerFieldWriteAllowed: false,
    hostValueReadAllowed: false,
    hostValueWriteAllowed: false,
    rawTargetCaptured: false,
    rawLatestPropsRetained: false,
    realDomNodeAccepted: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function normalizePostEventRestoreQueueWriteExecutionAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwPostEventRestoreQueueWriteExecutionError(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwPostEventRestoreQueueWriteExecutionError(
      'explicitAdmission must be true'
    );
  }

  const queueKind = getAdmissionStringProperty(
    admission,
    'queueKind',
    'deterministic-controlled-input-post-event-restore-queue-write-execution'
  );
  if (
    queueKind !==
    'deterministic-controlled-input-post-event-restore-queue-write-execution'
  ) {
    throwPostEventRestoreQueueWriteExecutionError(
      'queueKind must be deterministic-controlled-input-post-event-restore-queue-write-execution'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'controlled-input-post-event-restore-queue-write-execution'
  );
  if (
    targetKind !==
    'controlled-input-post-event-restore-queue-write-execution'
  ) {
    throwPostEventRestoreQueueWriteExecutionError(
      'targetKind must be controlled-input-post-event-restore-queue-write-execution'
    );
  }

  return freezeRecord({
    queueKind,
    queueId: getAdmissionStringProperty(
      admission,
      'queueId',
      'anonymous-controlled-restore-queue-write-execution'
    ),
    targetKind,
    explicitAdmission: true,
    deterministicMetadataOnly: true,
    acceptedSourceRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    acceptedSourceRowType:
      privateControlledInputPostEventRestoreQueueWriteIntentRowType,
    recordsQueueMutationIntent: true,
    recordsRestoreTargetVsRestoreQueueOrder: true,
    recordsSourcePreflightRows: true,
    recordsTargetAndControlKind: true,
    restoreQueueWriteAllowed: false,
    restoreFlushAllowed: false,
    hostWrapperInvocationAllowed: false,
    radioGroupLookupAllowed: false,
    liveDescriptorInstallationAllowed: false,
    valueTrackerFieldWriteAllowed: false,
    hostValueReadAllowed: false,
    hostValueWriteAllowed: false,
    rawTargetCaptured: false,
    rawLatestPropsRetained: false,
    realDomNodeAccepted: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function normalizePostEventRestoreQueueFlushBlockerAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwPostEventRestoreQueueFlushBlockerError(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwPostEventRestoreQueueFlushBlockerError(
      'explicitAdmission must be true'
    );
  }

  const queueKind = getAdmissionStringProperty(
    admission,
    'queueKind',
    'deterministic-controlled-input-post-event-restore-queue-flush-blocker'
  );
  if (
    queueKind !==
    'deterministic-controlled-input-post-event-restore-queue-flush-blocker'
  ) {
    throwPostEventRestoreQueueFlushBlockerError(
      'queueKind must be deterministic-controlled-input-post-event-restore-queue-flush-blocker'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'controlled-input-post-event-restore-queue-flush-blocker'
  );
  if (
    targetKind !==
    'controlled-input-post-event-restore-queue-flush-blocker'
  ) {
    throwPostEventRestoreQueueFlushBlockerError(
      'targetKind must be controlled-input-post-event-restore-queue-flush-blocker'
    );
  }

  return freezeRecord({
    queueKind,
    queueId: getAdmissionStringProperty(
      admission,
      'queueId',
      'anonymous-controlled-restore-queue-flush-blocker'
    ),
    targetKind,
    explicitAdmission: true,
    deterministicMetadataOnly: true,
    acceptedSourceRecordType:
      privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
    consumesAcceptedWriteMetadata: true,
    recordsQueueSnapshot: true,
    recordsIntendedFlushOrder: true,
    recordsWrapperOperationNames: true,
    recordsWrapperBlockerReasons: true,
    restoreQueueWriteAllowed: false,
    restoreFlushAllowed: false,
    hostWrapperInvocationAllowed: false,
    radioGroupLookupAllowed: false,
    liveDescriptorInstallationAllowed: false,
    valueTrackerFieldWriteAllowed: false,
    hostValueReadAllowed: false,
    hostValueWriteAllowed: false,
    rawTargetCaptured: false,
    rawLatestPropsRetained: false,
    realDomNodeAccepted: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function normalizePostEventRestoreQueueWrapperMutationIntentAdmission(
  admission
) {
  if (admission == null || typeof admission !== 'object') {
    throwPostEventRestoreQueueWrapperMutationIntentError(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwPostEventRestoreQueueWrapperMutationIntentError(
      'explicitAdmission must be true'
    );
  }

  const queueKind = getAdmissionStringProperty(
    admission,
    'queueKind',
    'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent'
  );
  if (
    queueKind !==
    'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent'
  ) {
    throwPostEventRestoreQueueWrapperMutationIntentError(
      'queueKind must be deterministic-controlled-input-post-event-restore-wrapper-mutation-intent'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'controlled-input-post-event-restore-wrapper-mutation-intent'
  );
  if (
    targetKind !==
    'controlled-input-post-event-restore-wrapper-mutation-intent'
  ) {
    throwPostEventRestoreQueueWrapperMutationIntentError(
      'targetKind must be controlled-input-post-event-restore-wrapper-mutation-intent'
    );
  }

  return freezeRecord({
    queueKind,
    queueId: getAdmissionStringProperty(
      admission,
      'queueId',
      'anonymous-controlled-restore-wrapper-mutation-intent'
    ),
    targetKind,
    explicitAdmission: true,
    deterministicMetadataOnly: true,
    acceptedSourceRecordTypes: freezeArray([
      privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
      privateControlledInputPostEventRestoreQueueFlushBlockerRecordType
    ]),
    recordsWrapperOperationNames: true,
    recordsTargetAndControlMetadata: true,
    recordsIntendedValueAndCheckedUpdates: true,
    recordsBlockedSideEffects: true,
    restoreQueueWriteAllowed: false,
    restoreFlushAllowed: false,
    hostWrapperInvocationAllowed: false,
    wrapperWriteAllowed: false,
    radioGroupLookupAllowed: false,
    liveDescriptorInstallationAllowed: false,
    valueTrackerFieldWriteAllowed: false,
    hostValueReadAllowed: false,
    hostValueWriteAllowed: false,
    rawTargetCaptured: false,
    rawLatestPropsRetained: false,
    realDomNodeAccepted: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function normalizePostEventRestoreQueueWritePreflightRecords(records) {
  const inputRecords = Array.isArray(records) ? records : [records];
  if (inputRecords.length === 0) {
    throwPostEventRestoreQueueWritePreflightError(
      'at least one restore queue record is required'
    );
  }

  return freezeArray(
    inputRecords.map((record) => {
      const sourceRecord =
        assertPrivateControlledInputPostEventRestoreQueueRecord(record);
      const rejectionReason =
        getPostEventRestoreQueueWritePreflightRejectionReason(sourceRecord);
      if (rejectionReason !== null) {
        throwPostEventRestoreQueueWritePreflightError(
          rejectionReason,
          sourceRecord
        );
      }
      return sourceRecord;
    })
  );
}

function assertInputChangeEventExtractionPreflightForRestoreQueueBridge(
  record
) {
  const payload =
    getInputChangeEventExtractionPreflightRecordPayload(record);
  if (payload === null) {
    throwInputChangeEventRestoreQueueBridgeError(
      'expected a private input/change event extraction preflight record'
    );
  }

  const rejectionReason =
    getInputChangeEventExtractionPreflightBridgeRejectionReason(record);
  if (rejectionReason !== null) {
    throwInputChangeEventRestoreQueueBridgeError(
      rejectionReason,
      record
    );
  }

  return record;
}

function getInputChangeEventExtractionPreflightBridgeRejectionReason(record) {
  if (
    record.kind !== INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND ||
    record.status !== PRIVATE_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_STATUS ||
    record.blockedReason !==
      INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_BLOCKED_CODE ||
    record.pluginName !== CHANGE_EVENT_PLUGIN_NAME ||
    record.reactName !== 'onChange' ||
    record.reactEventType !== 'change'
  ) {
    return 'input-change-preflight-record-not-accepted';
  }
  if (
    !isObjectLike(record.targetMetadata) ||
    record.targetMetadata.supportedTarget !== true ||
    record.targetMetadata.supportedEventType !== true ||
    isAcceptedInputChangeEventRestoreQueueBridgeTarget(record) !== true
  ) {
    return 'unsupported-input-change-target-or-event';
  }
  if (
    !isObjectLike(record.latestPropsEvidence) ||
    record.latestPropsEvidence.accepted !== true ||
    !isObjectLike(record.controlledMetadata) ||
    record.controlledMetadata.controlledMetadataAvailable !== true ||
    record.controlledMetadata.controlled !== true
  ) {
    return 'input-change-latest-props-evidence-not-accepted';
  }
  if (
    !isObjectLike(record.extractionMetadata) ||
    record.extractionMetadata.targetEligible !== true ||
    record.extractionMetadata.syntheticEventCreated !== false ||
    record.extractionMetadata.enqueueStateRestoreScheduled !== false ||
    record.extractionMetadata.valueTrackerUpdated !== false
  ) {
    return 'input-change-extraction-preflight-not-blocked';
  }
  if (
    !isObjectLike(record.controlledRestoreQueuePreflightBridge) ||
    record.controlledRestoreQueuePreflightBridge.bridgeEligible !== true ||
    record.controlledRestoreQueuePreflightBridge.bridgeRecordCreated !==
      false ||
    record.controlledRestoreQueuePreflightBridge.restoreQueueWritten !==
      false ||
    record.controlledRestoreQueuePreflightBridge.restoreQueueFlushed !==
      false
  ) {
    return 'input-change-controlled-restore-bridge-metadata-not-accepted';
  }
  if (
    record.eventDispatch !== false ||
    record.willInvokeListeners !== false ||
    record.syntheticEventCount !== 0 ||
    !isObjectLike(record.dispatchBehavior) ||
    record.dispatchBehavior.eventDispatch !== false ||
    record.dispatchBehavior.syntheticEventDispatch !== false ||
    record.dispatchBehavior.dispatchQueueMutated !== false ||
    !isObjectLike(record.sideEffects) ||
    record.sideEffects.controlledStateRestoreScheduled !== false ||
    record.sideEffects.postEventRestoreQueueWritten !== false ||
    record.sideEffects.valueTrackerFieldWritten !== false ||
    record.sideEffects.hostValueWritten !== false ||
    record.sideEffects.browserInputMutated !== false ||
    record.sideEffects.compatibilityClaimed !== false
  ) {
    return 'input-change-preflight-already-has-side-effects';
  }

  return null;
}

function isAcceptedInputChangeEventRestoreQueueBridgeTarget(record) {
  return (
    record.targetTag === 'input' &&
    ((record.targetType === 'text' &&
      record.controlledMetadata.controlledPropName === 'value') ||
      (record.targetType === 'checkbox' &&
        record.controlledMetadata.controlledPropName === 'checked'))
  );
}

function assertInputChangeEventRestoreQueueBridgeWritePreflight(record) {
  const preflightRecord =
    getPrivateControlledInputPostEventRestoreQueueWritePreflightRecordPayload(
      record
    );
  if (preflightRecord === null) {
    throwInputChangeEventRestoreQueueBridgeError(
      'expected a private controlled restore queue write preflight record'
    );
  }

  const rejectionReason =
    getPostEventRestoreQueueFlushBlockerRejectionReason(preflightRecord);
  if (rejectionReason !== null) {
    throwInputChangeEventRestoreQueueBridgeError(
      rejectionReason,
      preflightRecord
    );
  }

  return preflightRecord;
}

function findInputChangeEventRestoreQueueBridgeWriteIntentRow(
  writePreflight,
  restoreRecord
) {
  const row = writePreflight.writeIntentRows.find(
    (candidate) => candidate.sourceRequestId === restoreRecord.requestId
  );

  if (row === undefined) {
    throwInputChangeEventRestoreQueueBridgeError(
      'stale-restore-queue-preflight-source-missing',
      writePreflight
    );
  }

  return row;
}

function assertInputChangeEventRestoreQueueBridgeSources(
  inputPreflight,
  restoreRecord,
  writePreflight,
  writeRow
) {
  const rejectionReason =
    getInputChangeEventRestoreQueueBridgeRejectionReason(
      inputPreflight,
      restoreRecord,
      writePreflight,
      writeRow
    );

  if (rejectionReason !== null) {
    throwInputChangeEventRestoreQueueBridgeError(
      rejectionReason,
      restoreRecord
    );
  }
}

function getInputChangeEventRestoreQueueBridgeRejectionReason(
  inputPreflight,
  restoreRecord,
  writePreflight,
  writeRow
) {
  const restoreSourceKind =
    restoreRecord.sourceKind || restoreRecord.restoreIntent?.source;

  if (
    restoreSourceKind !==
      'private-event-dispatch-latest-props-evidence' ||
    restoreRecord.status !==
      controlledInputPostEventRestoreQueueIntentRecordedStatus ||
    !isObjectLike(restoreRecord.restoreIntent) ||
    restoreRecord.restoreIntent.eventDispatchRecordAccepted !== true ||
    restoreRecord.restoreIntent.eventPluginDispatchPerformed !== false ||
    restoreRecord.restoreIntent.intentRecorded !== true ||
    restoreRecord.restoreIntent.restoreQueueWritten !== false ||
    restoreRecord.restoreIntent.restoreFlushed !== false ||
    restoreRecord.restoreIntent.controlledStateRestoreInvoked !== false
  ) {
    return 'controlled-restore-intent-not-accepted';
  }
  if (
    !isObjectLike(restoreRecord.latestPropsEvidence) ||
    restoreRecord.latestPropsEvidence.accepted !== true
  ) {
    return 'controlled-restore-latest-props-evidence-not-accepted';
  }
  if (
    inputPreflight.domEventName !== restoreRecord.domEventName ||
    inputPreflight.nativeEventType !== restoreRecord.nativeEventType ||
    inputPreflight.targetTag !== restoreRecord.hostTag ||
    inputPreflight.targetType !== restoreRecord.inputType ||
    inputPreflight.controlledMetadata.controlledPropName !==
      restoreRecord.controlledPropName
  ) {
    return 'input-change-restore-target-mismatch';
  }
  if (
    (inputPreflight.controlledMetadata.controlledPropName === 'value'
      ? 'value'
      : 'checked') !== restoreRecord.controlKind
  ) {
    return 'input-change-restore-control-kind-mismatch';
  }
  if (
    bridgeArraysEqual(
      normalizeBridgePropKeys(inputPreflight.latestPropsEvidence.propKeys),
      normalizeBridgePropKeys(restoreRecord.latestPropsEvidence.propKeys)
    ) !== true
  ) {
    return 'input-change-restore-latest-props-evidence-mismatch';
  }
  if (
    writeRow.preflightRequestId !== writePreflight.requestId ||
    writeRow.sourceRequestId !== restoreRecord.requestId ||
    writeRow.hostTag !== restoreRecord.hostTag ||
    writeRow.inputType !== restoreRecord.inputType ||
    writeRow.controlKind !== restoreRecord.controlKind ||
    writeRow.controlledPropName !== restoreRecord.controlledPropName ||
    writeRow.acceptedRestoreKind !==
      restoreRecord.restoreQueueOrdering.acceptedRestoreKind ||
    writeRow.restoreQueueWritten !== false ||
    writeRow.restoreQueueFlushed !== false ||
    writeRow.hostWrapperInvoked !== false ||
    writeRow.valueTrackerFieldWritten !== false ||
    writeRow.browserInputMutated !== false
  ) {
    return 'stale-restore-queue-preflight-row-mismatch';
  }

  return null;
}

function assertInputChangeEventRestoreQueueExecutionBridgeRecord(record) {
  const payload =
    getPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecordPayload(
      record
    );
  if (payload === null) {
    throwInputChangeEventRestoreQueueExecutionError(
      'expected a private input/change controlled restore bridge record'
    );
  }
  return payload;
}

function assertInputChangeEventRestoreQueueExecutionWriteExecutionRecord(
  record
) {
  const payload =
    getPrivateControlledInputPostEventRestoreQueueWriteExecutionRecordPayload(
      record
    );
  if (payload === null) {
    throwInputChangeEventRestoreQueueExecutionError(
      'expected a private controlled restore queue write execution record'
    );
  }
  return payload;
}

function assertInputChangeEventRestoreQueueExecutionFlushBlockerRecord(
  record
) {
  const payload =
    getPrivateControlledInputPostEventRestoreQueueFlushBlockerRecordPayload(
      record
    );
  if (payload === null) {
    throwInputChangeEventRestoreQueueExecutionError(
      'expected a private controlled restore queue flush blocker record'
    );
  }
  return payload;
}

function assertInputChangeEventRestoreQueueExecutionWrapperMutationIntentRecord(
  record
) {
  const payload =
    getPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordPayload(
      record
    );
  if (payload === null) {
    throwInputChangeEventRestoreQueueExecutionError(
      'expected a private controlled restore wrapper mutation intent record'
    );
  }
  return payload;
}

function assertInputChangeEventRestoreQueueExecutionSources(
  inputPreflight,
  bridgeRecord,
  writeExecutionRecord,
  flushBlockerRecord,
  wrapperIntentRecord,
  admission,
  latestPropsValidation
) {
  const rejectionReason =
    getInputChangeEventRestoreQueueExecutionRejectionReason(
      inputPreflight,
      bridgeRecord,
      writeExecutionRecord,
      flushBlockerRecord,
      wrapperIntentRecord,
      admission,
      latestPropsValidation
    );
  if (rejectionReason !== null) {
    throwInputChangeEventRestoreQueueExecutionError(
      rejectionReason,
      bridgeRecord,
      writeExecutionRecord,
      flushBlockerRecord
    );
  }
}

function getInputChangeEventRestoreQueueExecutionRejectionReason(
  inputPreflight,
  bridgeRecord,
  writeExecutionRecord,
  flushBlockerRecord,
  wrapperIntentRecord,
  admission,
  latestPropsValidation
) {
  if (
    bridgeRecord.status !==
      controlledInputPostEventRestoreQueueInputChangeBridgeStatus ||
    !Array.isArray(bridgeRecord.bridgeRows) ||
    bridgeRecord.bridgeRows.length !== 1 ||
    !isObjectLike(bridgeRecord.latestPropsEvidenceBridge) ||
    bridgeRecord.latestPropsEvidenceBridge.latestPropsEvidenceLinked !==
      true ||
    bridgeRecord.latestPropsEvidenceBridge.latestPropsEvidenceMatch !== true
  ) {
    return 'input-change-restore-bridge-not-accepted';
  }

  if (
    bridgeRecord.sourceInputChangePreflight.sourceRecordKind !==
      inputPreflight.kind ||
    bridgeRecord.sourceInputChangePreflight.sourceRecordStatus !==
      inputPreflight.status ||
    bridgeRecord.sourceInputChangePreflight.domEventName !==
      inputPreflight.domEventName ||
    bridgeRecord.sourceInputChangePreflight.nativeEventType !==
      inputPreflight.nativeEventType
  ) {
    return 'stale-input-change-extraction-preflight-source';
  }

  if (latestPropsValidation.accepted !== true) {
    return latestPropsValidation.record.rejectionReason;
  }

  if (
    writeExecutionRecord.sourcePreflightRequestId !==
      bridgeRecord.sourceWritePreflight.requestId ||
    flushBlockerRecord.sourcePreflightRequestId !==
      bridgeRecord.sourceWritePreflight.requestId ||
    wrapperIntentRecord.sourcePreflightRequestId !==
      bridgeRecord.sourceWritePreflight.requestId
  ) {
    return 'stale-latest-props-or-restore-preflight-source';
  }

  if (
    wrapperIntentRecord.sourceWriteExecutionRequestId !==
      writeExecutionRecord.requestId ||
    wrapperIntentRecord.sourceFlushBlockerRequestId !==
      flushBlockerRecord.requestId
  ) {
    return 'stale-wrapper-mutation-intent-source';
  }

  if (
    inputChangeEventRestoreQueueExecutionHasRadioAmbiguity(
      writeExecutionRecord,
      flushBlockerRecord,
      wrapperIntentRecord
    )
  ) {
    return 'radio-group-ambiguity-before-mutation';
  }

  if (
    !Array.isArray(writeExecutionRecord.writeExecutionRows) ||
    !Array.isArray(flushBlockerRecord.queueSnapshot?.entries) ||
    !Array.isArray(wrapperIntentRecord.wrapperMutationIntentRows) ||
    writeExecutionRecord.writeExecutionRows.length !== 1 ||
    flushBlockerRecord.queueSnapshot.entries.length !== 1 ||
    wrapperIntentRecord.wrapperMutationIntentRows.length !== 1
  ) {
    return 'unsupported-multiple-restore-targets-before-mutation';
  }

  const bridgeRow = bridgeRecord.bridgeRows[0];
  const writeExecutionRow =
    findInputChangeEventRestoreQueueExecutionWriteRow(
      writeExecutionRecord,
      bridgeRow
    );
  const wrapperIntentRow =
    findInputChangeEventRestoreQueueExecutionWrapperRow(
      wrapperIntentRecord,
      bridgeRow
    );
  if (writeExecutionRow === null || wrapperIntentRow === null) {
    return 'stale-input-change-execution-row-source';
  }

  if (
    bridgeRow.inputType === 'radio' ||
    writeExecutionRow.inputType === 'radio' ||
    writeExecutionRow.radioGroupLookupRequired === true ||
    wrapperIntentRow.radioGroupLookupRequired === true
  ) {
    return 'radio-group-ambiguity-before-mutation';
  }

  if (
    (bridgeRow.acceptedRestoreKind !== 'input-text-value' &&
      bridgeRow.acceptedRestoreKind !== 'input-checkbox-checked') ||
    bridgeRow.hostTag !== 'input' ||
    (bridgeRow.acceptedRestoreKind === 'input-text-value' &&
      (bridgeRow.inputType !== 'text' ||
        bridgeRow.controlKind !== 'value' ||
        bridgeRow.controlledPropName !== 'value')) ||
    (bridgeRow.acceptedRestoreKind === 'input-checkbox-checked' &&
      (bridgeRow.inputType !== 'checkbox' ||
        bridgeRow.controlKind !== 'checked' ||
        bridgeRow.controlledPropName !== 'checked')) ||
    bridgeRow.acceptedRestoreKind !==
      writeExecutionRow.acceptedRestoreKind ||
    bridgeRow.acceptedRestoreKind !== wrapperIntentRow.acceptedRestoreKind
  ) {
    return 'unsupported-input-change-execution-target';
  }

  if (
    admission.record.fakeDomTargetAccepted !== true ||
    bridgeRow.restoreQueueWritten !== false ||
    bridgeRow.restoreQueueFlushed !== false ||
    writeExecutionRow.restoreQueueWritten !== false ||
    writeExecutionRow.restoreQueueFlushed !== false ||
    writeExecutionRow.hostWrapperInvoked !== false ||
    wrapperIntentRow.wrapperWritePerformed !== false ||
    wrapperIntentRow.hostValueWritten !== false ||
    wrapperIntentRow.browserInputMutated !== false
  ) {
    return 'input-change-execution-source-already-mutated';
  }

  return null;
}

function inputChangeEventRestoreQueueExecutionHasRadioAmbiguity(
  writeExecutionRecord,
  flushBlockerRecord,
  wrapperIntentRecord
) {
  const writeRows = Array.isArray(writeExecutionRecord.writeExecutionRows)
    ? writeExecutionRecord.writeExecutionRows
    : [];
  const snapshotEntries = Array.isArray(flushBlockerRecord.queueSnapshot?.entries)
    ? flushBlockerRecord.queueSnapshot.entries
    : [];
  const wrapperRows = Array.isArray(wrapperIntentRecord.wrapperMutationIntentRows)
    ? wrapperIntentRecord.wrapperMutationIntentRows
    : [];

  return [...writeRows, ...snapshotEntries, ...wrapperRows].some(
    (row) =>
      isObjectLike(row) &&
      (row.inputType === 'radio' ||
        row.acceptedRestoreKind === 'input-radio-checked' ||
        row.radioGroupLookupRequired === true)
  );
}

function findInputChangeEventRestoreQueueExecutionWriteRow(
  writeExecutionRecord,
  bridgeRow
) {
  return (
    writeExecutionRecord.writeExecutionRows.find(
      (row) =>
        row.sourceRequestId === bridgeRow.sourceRestoreRequestId &&
        row.sourcePreflightRowId === bridgeRow.sourceWriteIntentRowId
    ) || null
  );
}

function findInputChangeEventRestoreQueueExecutionWrapperRow(
  wrapperIntentRecord,
  bridgeRow
) {
  return (
    wrapperIntentRecord.wrapperMutationIntentRows.find(
      (row) => row.sourceRequestId === bridgeRow.sourceRestoreRequestId
    ) || null
  );
}

function assertPrivateControlledInputPostEventRestoreQueueWritePreflightRecordForExecution(
  record
) {
  const payload =
    getPrivateControlledInputPostEventRestoreQueueWritePreflightRecordPayload(
      record
    );
  if (payload !== null) {
    return payload;
  }

  throwPostEventRestoreQueueWriteExecutionError(
    'expected a private controlled restore queue write preflight record'
  );
}

function assertPostEventRestoreQueueWriteExecutionPreflight(preflightRecord) {
  const rejectionReason =
    getPostEventRestoreQueueWriteExecutionPreflightRejectionReason(
      preflightRecord
    );
  if (rejectionReason !== null) {
    throwPostEventRestoreQueueWriteExecutionError(
      rejectionReason,
      preflightRecord
    );
  }
}

function getPostEventRestoreQueueWriteExecutionPreflightRejectionReason(
  preflightRecord
) {
  const rows = preflightRecord.writeIntentRows;

  if (
    preflightRecord.status !==
    controlledInputPostEventRestoreQueueWritePreflightStatus
  ) {
    return 'source-preflight-not-recorded';
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return 'source-preflight-has-no-write-intent-rows';
  }
  if (preflightRecord.acceptedRecordCount !== rows.length) {
    return 'source-preflight-row-count-mismatch';
  }
  if (
    !isObjectLike(preflightRecord.writePlan) ||
    preflightRecord.writePlan.restoreQueueWritten !== false ||
    preflightRecord.writePlan.restoreQueueFlushed !== false ||
    preflightRecord.writePlan.hostWrapperInvoked !== false
  ) {
    return 'source-preflight-write-plan-not-blocked';
  }
  if (
    !isObjectLike(preflightRecord.postEventRestoreBoundary) ||
    preflightRecord.postEventRestoreBoundary.restoreQueueWritten !== false ||
    preflightRecord.postEventRestoreBoundary.restoreQueueFlushed !== false ||
    preflightRecord.postEventRestoreBoundary.hostWrapperInvoked !== false
  ) {
    return 'source-preflight-boundary-not-blocked';
  }
  if (
    !isObjectLike(preflightRecord.sideEffects) ||
    preflightRecord.sideEffects.restoreQueueWritten !== false ||
    preflightRecord.sideEffects.restoreQueueFlushed !== false ||
    preflightRecord.sideEffects.hostWrapperInvoked !== false ||
    preflightRecord.sideEffects.hostValueWritten !== false ||
    preflightRecord.sideEffects.browserInputMutated !== false
  ) {
    return 'source-preflight-already-has-side-effects';
  }

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const expectedQueueSlot =
      index === 0 ? 'restore-target' : 'restore-queue';
    const expectedQueueSlotIndex = index === 0 ? 0 : index - 1;

    if (!isObjectLike(row)) {
      return 'source-preflight-row-not-object';
    }
    if (
      row.$$typeof !==
        privateControlledInputPostEventRestoreQueueWriteIntentRowType ||
      row.status !==
        controlledInputPostEventRestoreQueueWriteIntentRowStatus
    ) {
      return 'source-preflight-row-type-not-accepted';
    }
    if (
      row.preflightRequestId !== preflightRecord.requestId ||
      row.preflightRequestSequence !== preflightRecord.requestSequence ||
      row.rowSequence !== index + 1
    ) {
      return 'source-preflight-row-order-mismatch';
    }
    if (
      row.queueable !== true ||
      row.writeIntentRecorded !== true ||
      row.writeWouldRun !== true
    ) {
      return 'source-preflight-row-not-queueable';
    }
    if (
      row.queueSlot !== expectedQueueSlot ||
      row.queueSlotIndex !== expectedQueueSlotIndex ||
      row.restoreTargetWouldBeSet !== (index === 0) ||
      row.restoreQueueWouldBeAppended !== (index > 0)
    ) {
      return 'source-preflight-row-queue-slot-mismatch';
    }
    if (
      controlledInputPostEventRestoreQueueAcceptedRestoreMetadataKindSet.has(
        row.acceptedRestoreKind
      ) !== true
    ) {
      return 'source-preflight-row-restore-kind-not-accepted';
    }
    if (
      row.restoreQueueWritten !== false ||
      row.restoreQueueFlushed !== false ||
      row.controlledStateRestoreInvoked !== false ||
      row.hostWrapperInvoked !== false ||
      row.valueTrackerFieldWritten !== false ||
      row.hostValueWritten !== false ||
      row.browserInputMutated !== false
    ) {
      return 'source-preflight-row-already-has-side-effects';
    }
  }

  return null;
}

function assertPostEventRestoreQueueFlushBlockerSourceRecord(record) {
  const preflightRecord =
    getPrivateControlledInputPostEventRestoreQueueWritePreflightRecordPayload(
      record
    );
  if (preflightRecord === null) {
    throwPostEventRestoreQueueFlushBlockerError(
      'Expected a private React DOM controlled input post-event restore queue write preflight record.'
    );
  }

  const rejectionReason =
    getPostEventRestoreQueueFlushBlockerRejectionReason(preflightRecord);
  if (rejectionReason !== null) {
    throwPostEventRestoreQueueFlushBlockerError(
      rejectionReason,
      preflightRecord
    );
  }

  return preflightRecord;
}

function getPostEventRestoreQueueFlushBlockerRejectionReason(
  preflightRecord
) {
  if (
    preflightRecord.status !==
    controlledInputPostEventRestoreQueueWritePreflightStatus
  ) {
    return 'write-preflight-not-recorded';
  }
  if (
    !Array.isArray(preflightRecord.writeIntentRows) ||
    preflightRecord.writeIntentRows.length === 0 ||
    preflightRecord.writeIntentRows.length !==
      preflightRecord.acceptedRecordCount
  ) {
    return 'write-preflight-rows-not-accepted';
  }
  if (
    !isObjectLike(preflightRecord.writePlan) ||
    preflightRecord.writePlan.restoreQueueWritten !== false ||
    preflightRecord.writePlan.restoreQueueFlushed !== false ||
    preflightRecord.writePlan.controlledStateRestoreInvoked !== false ||
    preflightRecord.writePlan.hostWrapperInvoked !== false ||
    preflightRecord.writePlan.radioGroupLookupPerformed !== false ||
    preflightRecord.writePlan.browserInputMutated !== false
  ) {
    return 'write-preflight-plan-not-blocked';
  }
  if (
    !isObjectLike(preflightRecord.postEventRestoreBoundary) ||
    preflightRecord.postEventRestoreBoundary.restoreQueueWritten !== false ||
    preflightRecord.postEventRestoreBoundary.restoreQueueFlushed !== false ||
    preflightRecord.postEventRestoreBoundary.controlledStateRestoreInvoked !==
      false ||
    preflightRecord.postEventRestoreBoundary.hostWrapperInvoked !== false ||
    preflightRecord.postEventRestoreBoundary.radioGroupLookupPerformed !==
      false ||
    preflightRecord.postEventRestoreBoundary.browserInputMutated !== false
  ) {
    return 'write-preflight-boundary-not-blocked';
  }
  if (
    !isObjectLike(preflightRecord.sideEffects) ||
    preflightRecord.sideEffects.restoreQueueWritten !== false ||
    preflightRecord.sideEffects.restoreQueueFlushed !== false ||
    preflightRecord.sideEffects.hostWrapperInvoked !== false ||
    preflightRecord.sideEffects.radioGroupLookupPerformed !== false ||
    preflightRecord.sideEffects.valueTrackerFieldWritten !== false ||
    preflightRecord.sideEffects.browserInputMutated !== false ||
    preflightRecord.sideEffects.compatibilityClaimed !== false
  ) {
    return 'write-preflight-side-effects-not-blocked';
  }

  for (const row of preflightRecord.writeIntentRows) {
    const rowRejectionReason =
      getPostEventRestoreQueueFlushBlockerRowRejectionReason(row);
    if (rowRejectionReason !== null) {
      return rowRejectionReason;
    }
  }

  return null;
}

function getPostEventRestoreQueueFlushBlockerRowRejectionReason(row) {
  if (
    !isObjectLike(row) ||
    row.$$typeof !==
      privateControlledInputPostEventRestoreQueueWriteIntentRowType ||
    row.status !== controlledInputPostEventRestoreQueueWriteIntentRowStatus ||
    row.writeIntentRecorded !== true ||
    row.writeWouldRun !== true ||
    typeof row.hostWrapperOperation !== 'string' ||
    row.hostWrapperOperation.length === 0
  ) {
    return 'write-intent-row-not-accepted';
  }
  if (
    row.restoreQueueWritten !== false ||
    row.restoreQueueFlushed !== false ||
    row.controlledStateRestoreInvoked !== false ||
    row.hostWrapperInvoked !== false ||
    row.radioGroupLookupPerformed !== false ||
    row.valueTrackerFieldWritten !== false ||
    row.hostValueWritten !== false ||
    row.browserInputMutated !== false ||
    row.publicControlledBehaviorEnabled !== false ||
    row.compatibilityClaimed !== false
  ) {
    return 'write-intent-row-not-blocked';
  }

  return null;
}

function assertPostEventRestoreQueueWrapperMutationIntentWriteExecutionRecord(
  record
) {
  const writeExecutionRecord =
    getPrivateControlledInputPostEventRestoreQueueWriteExecutionRecordPayload(
      record
    );
  if (writeExecutionRecord !== null) {
    return writeExecutionRecord;
  }

  throwPostEventRestoreQueueWrapperMutationIntentError(
    'expected a private controlled restore queue write execution record'
  );
}

function assertPostEventRestoreQueueWrapperMutationIntentFlushBlockerRecord(
  record
) {
  const flushBlockerRecord =
    getPrivateControlledInputPostEventRestoreQueueFlushBlockerRecordPayload(
      record
    );
  if (flushBlockerRecord !== null) {
    return flushBlockerRecord;
  }

  throwPostEventRestoreQueueWrapperMutationIntentError(
    'expected a private controlled restore queue flush blocker record'
  );
}

function assertPostEventRestoreQueueWrapperMutationIntentSources(
  writeExecutionRecord,
  flushBlockerRecord
) {
  const rejectionReason =
    getPostEventRestoreQueueWrapperMutationIntentRejectionReason(
      writeExecutionRecord,
      flushBlockerRecord
    );
  if (rejectionReason !== null) {
    throwPostEventRestoreQueueWrapperMutationIntentError(
      rejectionReason,
      writeExecutionRecord,
      flushBlockerRecord
    );
  }
}

function getPostEventRestoreQueueWrapperMutationIntentRejectionReason(
  writeExecutionRecord,
  flushBlockerRecord
) {
  if (
    writeExecutionRecord.status !==
    controlledInputPostEventRestoreQueueWriteExecutionStatus
  ) {
    return 'write-execution-not-recorded';
  }
  if (
    flushBlockerRecord.status !==
    controlledInputPostEventRestoreQueueFlushBlockerStatus
  ) {
    return 'flush-blocker-not-recorded';
  }
  if (
    writeExecutionRecord.sourcePreflightRequestSequence !==
    flushBlockerRecord.sourcePreflightRequestSequence
  ) {
    return writeExecutionRecord.sourcePreflightRequestSequence >
      flushBlockerRecord.sourcePreflightRequestSequence
      ? 'stale-flush-blocker-source'
      : 'stale-write-execution-source';
  }
  if (
    writeExecutionRecord.sourcePreflightRequestId !==
    flushBlockerRecord.sourcePreflightRequestId
  ) {
    return 'foreign-source-preflight';
  }
  if (
    !Array.isArray(writeExecutionRecord.writeExecutionRows) ||
    !Array.isArray(flushBlockerRecord.queueSnapshot?.entries) ||
    !Array.isArray(flushBlockerRecord.intendedFlushOrder?.targetFlushOrder) ||
    !Array.isArray(flushBlockerRecord.wrapperRestoreBlocker?.wrapperRows)
  ) {
    return 'source-record-rows-missing';
  }
  if (
    writeExecutionRecord.writeExecutionRows.length === 0 ||
    writeExecutionRecord.writeExecutionRows.length !==
      flushBlockerRecord.queueSnapshot.entries.length ||
    writeExecutionRecord.writeExecutionRows.length !==
      flushBlockerRecord.intendedFlushOrder.targetFlushOrder.length ||
    writeExecutionRecord.writeExecutionRows.length !==
      flushBlockerRecord.wrapperRestoreBlocker.wrapperRows.length
  ) {
    return 'source-row-count-mismatch';
  }
  if (
    arrayShallowEqual(
      writeExecutionRecord.acceptedRestoreKinds,
      flushBlockerRecord.acceptedRestoreKinds
    ) !== true ||
    arrayShallowEqual(
      writeExecutionRecord.sourceRequestIds,
      flushBlockerRecord.sourceRequestIds
    ) !== true
  ) {
    return 'source-accepted-metadata-mismatch';
  }
  if (
    !isObjectLike(writeExecutionRecord.queueMutationPlan) ||
    writeExecutionRecord.queueMutationPlan.restoreQueueWritten !== false ||
    writeExecutionRecord.queueMutationPlan.restoreQueueFlushed !== false ||
    writeExecutionRecord.queueMutationPlan.hostWrapperInvoked !== false ||
    writeExecutionRecord.queueMutationPlan.hostValueWritten !== false ||
    writeExecutionRecord.queueMutationPlan.browserInputMutated !== false ||
    writeExecutionRecord.queueMutationPlan.compatibilityClaimed !== false
  ) {
    return 'write-execution-plan-not-blocked';
  }
  if (
    !isObjectLike(writeExecutionRecord.sideEffects) ||
    writeExecutionRecord.sideEffects.restoreQueueWritten !== false ||
    writeExecutionRecord.sideEffects.restoreQueueFlushed !== false ||
    writeExecutionRecord.sideEffects.hostWrapperInvoked !== false ||
    writeExecutionRecord.sideEffects.hostValueWritten !== false ||
    writeExecutionRecord.sideEffects.browserInputMutated !== false ||
    writeExecutionRecord.sideEffects.compatibilityClaimed !== false
  ) {
    return 'write-execution-side-effects-not-blocked';
  }
  if (
    !isObjectLike(flushBlockerRecord.wrapperRestoreBlocker) ||
    flushBlockerRecord.wrapperRestoreBlocker.actualWrapperRestoreBlocked !==
      true ||
    flushBlockerRecord.wrapperRestoreBlocker.restoreFlushExecutionAllowed !==
      false ||
    flushBlockerRecord.wrapperRestoreBlocker.hostWrapperInvocationAllowed !==
      false ||
    flushBlockerRecord.wrapperRestoreBlocker.hostWrapperInvoked !== false ||
    flushBlockerRecord.wrapperRestoreBlocker.hostValueWritten !== false ||
    flushBlockerRecord.wrapperRestoreBlocker.browserInputMutated !== false ||
    flushBlockerRecord.wrapperRestoreBlocker.compatibilityClaimed !== false
  ) {
    return 'flush-blocker-wrapper-boundary-not-blocked';
  }
  if (
    !isObjectLike(flushBlockerRecord.sideEffects) ||
    flushBlockerRecord.sideEffects.restoreQueueWritten !== false ||
    flushBlockerRecord.sideEffects.restoreQueueFlushed !== false ||
    flushBlockerRecord.sideEffects.hostWrapperInvoked !== false ||
    flushBlockerRecord.sideEffects.hostValueWritten !== false ||
    flushBlockerRecord.sideEffects.browserInputMutated !== false ||
    flushBlockerRecord.sideEffects.compatibilityClaimed !== false
  ) {
    return 'flush-blocker-side-effects-not-blocked';
  }

  for (
    let index = 0;
    index < writeExecutionRecord.writeExecutionRows.length;
    index++
  ) {
    const rowRejectionReason =
      getPostEventRestoreQueueWrapperMutationIntentRowRejectionReason(
        writeExecutionRecord.writeExecutionRows[index],
        flushBlockerRecord.queueSnapshot.entries[index],
        flushBlockerRecord.intendedFlushOrder.targetFlushOrder[index],
        flushBlockerRecord.wrapperRestoreBlocker.wrapperRows[index],
        index
      );
    if (rowRejectionReason !== null) {
      return rowRejectionReason;
    }
  }

  return null;
}

function getPostEventRestoreQueueWrapperMutationIntentRowRejectionReason(
  writeExecutionRow,
  snapshotEntry,
  flushEntry,
  blockerRow,
  index
) {
  if (
    !isObjectLike(writeExecutionRow) ||
    writeExecutionRow.$$typeof !==
      privateControlledInputPostEventRestoreQueueWriteExecutionRowType ||
    writeExecutionRow.status !==
      controlledInputPostEventRestoreQueueWriteExecutionRowStatus ||
    writeExecutionRow.writeExecutionRecorded !== true ||
    writeExecutionRow.queueMutationIntentRecorded !== true
  ) {
    return 'write-execution-row-not-accepted';
  }
  if (
    writeExecutionRow.rowSequence !== index + 1 ||
    writeExecutionRow.writeOrder !== index + 1
  ) {
    return 'write-execution-row-order-mismatch';
  }
  if (
    !isSupportedWrapperMutationIntentRow(writeExecutionRow)
  ) {
    return 'unsupported-wrapper-mutation-intent-row';
  }
  if (
    !isObjectLike(snapshotEntry) ||
    !isObjectLike(flushEntry) ||
    !isObjectLike(blockerRow) ||
    snapshotEntry.sourceRequestId !== writeExecutionRow.sourceRequestId ||
    flushEntry.sourceRequestId !== writeExecutionRow.sourceRequestId ||
    blockerRow.sourceRequestId !== writeExecutionRow.sourceRequestId ||
    snapshotEntry.acceptedRestoreKind !==
      writeExecutionRow.acceptedRestoreKind ||
    flushEntry.acceptedRestoreKind !==
      writeExecutionRow.acceptedRestoreKind ||
    blockerRow.acceptedRestoreKind !==
      writeExecutionRow.acceptedRestoreKind ||
    snapshotEntry.hostWrapperOperation !==
      writeExecutionRow.hostWrapperOperation ||
    flushEntry.hostWrapperOperation !==
      writeExecutionRow.hostWrapperOperation ||
    blockerRow.hostWrapperOperation !==
      writeExecutionRow.hostWrapperOperation
  ) {
    return 'wrapper-source-row-mismatch';
  }
  if (
    writeExecutionRow.restoreQueueWritten !== false ||
    writeExecutionRow.restoreQueueFlushed !== false ||
    writeExecutionRow.controlledStateRestoreInvoked !== false ||
    writeExecutionRow.hostWrapperInvoked !== false ||
    writeExecutionRow.valueTrackerFieldWritten !== false ||
    writeExecutionRow.hostValueRead !== false ||
    writeExecutionRow.hostValueWritten !== false ||
    writeExecutionRow.browserInputMutated !== false ||
    writeExecutionRow.compatibilityClaimed !== false ||
    snapshotEntry.restoreQueueWritten !== false ||
    snapshotEntry.restoreQueueFlushed !== false ||
    snapshotEntry.hostWrapperInvoked !== false ||
    snapshotEntry.hostValueWritten !== false ||
    snapshotEntry.browserInputMutated !== false ||
    flushEntry.restoreQueueFlushed !== false ||
    flushEntry.hostWrapperInvoked !== false ||
    flushEntry.wrapperWritePerformed !== false ||
    flushEntry.hostValueWritten !== false ||
    flushEntry.browserInputMutated !== false ||
    blockerRow.hostWrapperInvoked !== false ||
    blockerRow.wrapperWritePerformed !== false ||
    blockerRow.valueTrackerFieldWritten !== false ||
    blockerRow.hostValueWritten !== false ||
    blockerRow.browserInputMutated !== false ||
    blockerRow.compatibilityClaimed !== false
  ) {
    return 'wrapper-source-row-side-effects-not-blocked';
  }

  return null;
}

function isSupportedWrapperMutationIntentRow(row) {
  const expectedOperation =
    getExpectedWrapperOperationForAcceptedRestoreKind(
      row.acceptedRestoreKind
    );
  if (
    expectedOperation === null ||
    row.hostWrapperOperation !== expectedOperation ||
    getWrapperMutationKindForAcceptedRestoreKind(
      row.acceptedRestoreKind
    ) === null
  ) {
    return false;
  }

  if (row.acceptedRestoreKind === 'input-text-value') {
    return (
      row.hostTag === 'input' &&
      row.controlKind === 'value' &&
      row.controlledPropName === 'value'
    );
  }
  if (row.acceptedRestoreKind === 'input-checkbox-checked') {
    return (
      row.hostTag === 'input' &&
      row.inputType === 'checkbox' &&
      row.controlKind === 'checked' &&
      row.controlledPropName === 'checked'
    );
  }
  if (row.acceptedRestoreKind === 'input-radio-checked') {
    return (
      row.hostTag === 'input' &&
      row.inputType === 'radio' &&
      row.controlKind === 'checked' &&
      row.controlledPropName === 'checked'
    );
  }
  if (row.acceptedRestoreKind === 'select-single-value') {
    return (
      row.hostTag === 'select' &&
      row.multiple === false &&
      row.controlKind === 'single' &&
      row.controlledPropName === 'value'
    );
  }
  if (row.acceptedRestoreKind === 'select-multiple-value') {
    return (
      row.hostTag === 'select' &&
      row.multiple === true &&
      row.controlKind === 'multiple' &&
      row.controlledPropName === 'value'
    );
  }
  return (
    row.acceptedRestoreKind === 'textarea-value' &&
    row.hostTag === 'textarea' &&
    row.controlKind === 'value' &&
    row.controlledPropName === 'value'
  );
}

function getPostEventRestoreQueueWritePreflightRejectionReason(record) {
  const restoreIntent = record.restoreIntent;
  const ordering = record.restoreQueueOrdering;
  const boundary = record.postEventRestoreBoundary;
  const sideEffects = record.sideEffects;

  if (record.status !== controlledInputPostEventRestoreQueueIntentRecordedStatus) {
    return 'restore-intent-not-recorded';
  }
  if (
    !isObjectLike(restoreIntent) ||
    restoreIntent.intentRecorded !== true ||
    restoreIntent.restoreTargetWouldBeQueued !== true
  ) {
    return 'restore-target-would-not-be-queued';
  }
  if (isAcceptedWritePreflightRestoreTarget(record) !== true) {
    return 'unsupported-restore-metadata';
  }
  if (
    !isObjectLike(ordering) ||
    ordering.metadataOnly !== true ||
    ordering.acceptedRestoreMetadata !== true ||
    controlledInputPostEventRestoreQueueAcceptedRestoreMetadataKindSet.has(
      ordering.acceptedRestoreKind
    ) !== true
  ) {
    return 'restore-ordering-metadata-not-accepted';
  }
  if (
    !isObjectLike(ordering.writeOrder) ||
    ordering.writeOrder.targetWouldBeQueued !== true ||
    ordering.writeOrder.restoreQueueWritten !== false
  ) {
    return 'restore-write-order-not-preflightable';
  }
  if (
    !isObjectLike(ordering.flushOrder) ||
    ordering.flushOrder.restoreQueueFlushed !== false
  ) {
    return 'restore-flush-order-not-blocked';
  }
  if (
    !isObjectLike(ordering.hostWrapperOrder) ||
    ordering.hostWrapperOrder.primaryHostWrapperRan !== false ||
    ordering.hostWrapperOrder.wrapperWritePerformed !== false
  ) {
    return 'host-wrapper-order-not-blocked';
  }
  if (
    restoreIntent.restoreQueueWritten !== false ||
    restoreIntent.controlledStateRestoreInvoked !== false ||
    restoreIntent.restoreFlushed !== false ||
    restoreIntent.valueTrackerFieldWritten !== false ||
    restoreIntent.hostValueWritten !== false
  ) {
    return 'restore-intent-already-has-side-effects';
  }
  if (
    !isObjectLike(boundary) ||
    boundary.restoreQueued !== false ||
    boundary.restoreFlushed !== false
  ) {
    return 'post-event-restore-boundary-not-blocked';
  }
  if (
    !isObjectLike(sideEffects) ||
    sideEffects.restoreQueueWritten !== false ||
    sideEffects.restoreQueueFlushed !== false ||
    sideEffects.hostWrapperInvoked !== false ||
    sideEffects.valueTrackerFieldWritten !== false ||
    sideEffects.hostValueWritten !== false ||
    sideEffects.browserInputMutated !== false
  ) {
    return 'source-record-already-has-side-effects';
  }

  return null;
}

function isAcceptedWritePreflightRestoreTarget(record) {
  if (record.hostTag === 'input') {
    if (
      record.controlKind === 'value' &&
      record.inputType === 'text' &&
      record.restoreQueueOrdering.acceptedRestoreKind === 'input-text-value'
    ) {
      return true;
    }
    if (
      record.controlKind === 'checked' &&
      record.inputType === 'checkbox' &&
      record.restoreQueueOrdering.acceptedRestoreKind ===
        'input-checkbox-checked'
    ) {
      return true;
    }
    return (
      record.controlKind === 'checked' &&
      record.inputType === 'radio' &&
      record.restoreQueueOrdering.acceptedRestoreKind ===
        'input-radio-checked'
    );
  }

  if (record.hostTag === 'select') {
    if (
      record.controlKind === 'multiple' &&
      record.multiple === true &&
      record.restoreQueueOrdering.acceptedRestoreKind ===
        'select-multiple-value'
    ) {
      return true;
    }
    return (
      record.controlKind === 'single' &&
      record.multiple === false &&
      record.restoreQueueOrdering.acceptedRestoreKind ===
        'select-single-value'
    );
  }

  return (
    record.hostTag === 'textarea' &&
    record.controlKind === 'value' &&
    record.restoreQueueOrdering.acceptedRestoreKind === 'textarea-value'
  );
}

function describeLatestProps(props) {
  if (!isObjectLike(props)) {
    return freezeRecord({
      propKeys: freezeArray([]),
      controlledPropSummary: freezeRecord({})
    });
  }

  let propKeys;
  try {
    propKeys = Object.keys(props);
  } catch (error) {
    return freezeRecord({
      propKeys: null,
      controlledPropSummary: freezeRecord({})
    });
  }

  return freezeRecord({
    propKeys: freezeArray(propKeys),
    controlledPropSummary: summarizeControlledProps(props)
  });
}

function normalizeBridgePropKeys(propKeys) {
  if (!Array.isArray(propKeys)) {
    return freezeArray([]);
  }

  return freezeArray(
    propKeys
      .filter((propKey) => typeof propKey === 'string')
      .slice()
      .sort()
  );
}

function bridgeArraysEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false;
  }
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

function summarizeControlledProps(props) {
  const summary = {};
  for (const propName of [
    'type',
    'value',
    'defaultValue',
    'checked',
    'defaultChecked',
    'multiple',
    'children',
    'onChange',
    'onInput',
    'readOnly',
    'disabled'
  ]) {
    if (hasOwnProp(props, propName)) {
      summary[propName] = describePropValue(props, propName);
    }
  }
  return freezeRecord(summary);
}

function describePropValue(props, propName) {
  try {
    return freezeRecord({
      present: true,
      value: describeValue(props[propName])
    });
  } catch (error) {
    return freezeRecord({
      present: true,
      value: freezeRecord({type: 'inaccessible'})
    });
  }
}

function describeValue(value) {
  if (value === null) {
    return freezeRecord({type: 'null'});
  }
  const valueType = typeof value;
  if (valueType === 'string') {
    return freezeRecord({
      type: 'string',
      empty: value.length === 0
    });
  }
  if (valueType === 'number') {
    return freezeRecord({
      type: 'number',
      finite: Number.isFinite(value)
    });
  }
  if (valueType === 'boolean') {
    return freezeRecord({type: 'boolean'});
  }
  if (valueType === 'undefined') {
    return freezeRecord({type: 'undefined'});
  }
  if (valueType === 'function') {
    return freezeRecord({type: 'function'});
  }
  if (valueType === 'symbol') {
    return freezeRecord({type: 'symbol'});
  }
  if (Array.isArray(value)) {
    return freezeRecord({
      type: 'array',
      length: value.length
    });
  }
  return freezeRecord({type: valueType});
}

function getHostTagFromEventRecord(dispatchRecord) {
  return getHostTagFromTargetNode(dispatchRecord.targetHostInstanceNode);
}

function getHostTagFromTargetNode(targetNode) {
  if (!isObjectLike(targetNode)) {
    return null;
  }

  if (typeof targetNode.localName === 'string' && targetNode.localName !== '') {
    return targetNode.localName.toLowerCase();
  }

  if (typeof targetNode.nodeName === 'string' && targetNode.nodeName !== '') {
    return targetNode.nodeName.toLowerCase();
  }

  if (typeof targetNode.tagName === 'string' && targetNode.tagName !== '') {
    return targetNode.tagName.toLowerCase();
  }

  return null;
}

function getInputType(hostTag, props) {
  if (hostTag !== 'input') {
    return null;
  }
  if (isObjectLike(props) && hasOwnProp(props, 'type')) {
    const type = props.type;
    return typeof type === 'string' && type.length > 0 ? type : 'text';
  }
  return 'text';
}

function getSelectMultiple(hostTag, props) {
  if (hostTag !== 'select') {
    return false;
  }
  return isObjectLike(props) && props.multiple === true;
}

function inferControlKind(hostTag, inputType, multiple, props) {
  if (hostTag === 'input') {
    const checkable = inputType === 'checkbox' || inputType === 'radio';
    if (checkable && isObjectLike(props) && props.checked != null) {
      return 'checked';
    }
    return 'value';
  }

  if (hostTag === 'select') {
    return multiple ? 'multiple' : 'single';
  }

  if (hostTag === 'textarea') {
    return 'value';
  }

  return null;
}

function getControlledPropName(hostTag, controlKind, props) {
  if (hostTag === 'input') {
    return controlKind === 'checked' ? 'checked' : 'value';
  }

  if (hostTag === 'select' || hostTag === 'textarea') {
    return 'value';
  }

  return null;
}

function getTrackedField(hostTag, controlKind) {
  if (hostTag === 'input' && controlKind === 'checked') {
    return 'checked';
  }
  if (hostTag === 'select') {
    return 'selectedOptions';
  }
  if (hostTag === 'input' || hostTag === 'textarea') {
    return 'value';
  }
  return null;
}

function getValueKind(hostTag, controlKind) {
  if (hostTag === 'input' && controlKind === 'checked') {
    return 'boolean-string-current-value';
  }
  if (hostTag === 'select' && controlKind === 'multiple') {
    return 'array-option-values';
  }
  if (hostTag === 'select') {
    return 'single-option-value';
  }
  if (hostTag === 'input' || hostTag === 'textarea') {
    return 'string-current-value';
  }
  return null;
}

function getWrapperKind(hostTag) {
  if (hostTag === 'input') {
    return 'input-host-wrapper';
  }
  if (hostTag === 'select') {
    return 'select-host-wrapper';
  }
  if (hostTag === 'textarea') {
    return 'textarea-host-wrapper';
  }
  return null;
}

function getAcceptedRestoreMetadataKind(controlledTarget) {
  if (controlledTarget.hostTag === 'input') {
    if (controlledTarget.controlKind === 'checked') {
      if (controlledTarget.inputType === 'radio') {
        return 'input-radio-checked';
      }
      return 'input-checkbox-checked';
    }
    return 'input-text-value';
  }

  if (controlledTarget.hostTag === 'select') {
    return controlledTarget.controlKind === 'multiple'
      ? 'select-multiple-value'
      : 'select-single-value';
  }

  if (controlledTarget.hostTag === 'textarea') {
    return 'textarea-value';
  }

  return null;
}

function getHostWrapperRestoreOperation(controlledTarget) {
  if (controlledTarget.hostTag === 'input') {
    return controlledTarget.controlKind === 'checked'
      ? 'input-checked-sync'
      : 'input-value-sync';
  }

  if (controlledTarget.hostTag === 'select') {
    return controlledTarget.controlKind === 'multiple'
      ? 'select-multiple-options-sync'
      : 'select-single-options-sync';
  }

  if (controlledTarget.hostTag === 'textarea') {
    return 'textarea-value-sync';
  }

  return null;
}

function getWrapperMutationKindForAcceptedRestoreKind(acceptedRestoreKind) {
  if (acceptedRestoreKind === 'input-checkbox-checked') {
    return 'checked-property-sync';
  }
  if (acceptedRestoreKind === 'input-radio-checked') {
    return 'checked-property-sync';
  }
  if (acceptedRestoreKind === 'input-text-value') {
    return 'value-property-sync';
  }
  if (acceptedRestoreKind === 'select-single-value') {
    return 'single-option-selection-sync';
  }
  if (acceptedRestoreKind === 'select-multiple-value') {
    return 'multiple-option-selection-sync';
  }
  if (acceptedRestoreKind === 'textarea-value') {
    return 'textarea-value-property-sync';
  }
  return null;
}

function getWrapperMutationTargetField(sourceRow) {
  if (sourceRow.hostTag === 'select') {
    return 'selectedOptions';
  }
  return sourceRow.controlledPropName;
}

function getExpectedWrapperOperationForAcceptedRestoreKind(
  acceptedRestoreKind
) {
  if (acceptedRestoreKind === 'input-text-value') {
    return 'input-value-sync';
  }
  if (
    acceptedRestoreKind === 'input-checkbox-checked' ||
    acceptedRestoreKind === 'input-radio-checked'
  ) {
    return 'input-checked-sync';
  }
  if (acceptedRestoreKind === 'select-single-value') {
    return 'select-single-options-sync';
  }
  if (acceptedRestoreKind === 'select-multiple-value') {
    return 'select-multiple-options-sync';
  }
  if (acceptedRestoreKind === 'textarea-value') {
    return 'textarea-value-sync';
  }
  return null;
}

function getControlledPropSummaryFromSourceRecord(sourceRecord) {
  const propName = sourceRecord.controlledPropName;
  const summary = sourceRecord.latestPropsEvidence?.controlledPropSummary;
  if (
    propName === null ||
    !isObjectLike(summary) ||
    hasOwnProp(summary, propName) !== true
  ) {
    return null;
  }
  return summary[propName];
}

function isSupportedPostEventRestoreTrigger(domEventName, hostTag, controlKind) {
  if (hostTag === 'input' && controlKind === 'checked') {
    return domEventName === 'click' || domEventName === 'change';
  }

  if (hostTag === 'input' && controlKind === 'value') {
    return domEventName === 'input' || domEventName === 'change';
  }

  if (hostTag === 'select') {
    return domEventName === 'change';
  }

  if (hostTag === 'textarea') {
    return domEventName === 'input' || domEventName === 'change';
  }

  return false;
}

function isCheckableControlledTarget(controlledTarget) {
  return (
    isObjectLike(controlledTarget) &&
    controlledTarget.hostTag === 'input' &&
    controlledTarget.controlKind === 'checked' &&
    (controlledTarget.inputType === 'checkbox' ||
      controlledTarget.inputType === 'radio')
  );
}

function describeMetadataProp(props, propName) {
  if (!isObjectLike(props) || !hasOwnProp(props, propName)) {
    return freezeRecord({
      propName,
      present: false,
      nonNull: false,
      value: freezeRecord({type: 'missing'})
    });
  }

  try {
    const value = props[propName];
    return freezeRecord({
      propName,
      present: true,
      nonNull: value != null,
      value: describeValue(value)
    });
  } catch (error) {
    return freezeRecord({
      propName,
      present: true,
      nonNull: false,
      value: freezeRecord({type: 'inaccessible'})
    });
  }
}

function getRecordedRadioGroupIntent(groupIntentRecords) {
  if (!Array.isArray(groupIntentRecords)) {
    return null;
  }

  for (const record of groupIntentRecords) {
    if (
      isObjectLike(record) &&
      record.status ===
        controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus
    ) {
      return record;
    }
  }

  return null;
}

function getAdmissionStringProperty(record, key, fallback) {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function getAdmissionStringOrDefault(record, key, fallback) {
  if (!isObjectLike(record)) {
    return fallback;
  }
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function getOptionalAdmissionStringProperty(record, key) {
  if (!isObjectLike(record)) {
    return null;
  }

  const value = record[key];
  if (value == null) {
    return null;
  }
  if (typeof value !== 'string') {
    throwInvalidAdmission(`${key} must be a string when provided`);
  }
  return value.length > 0 ? value : null;
}

function describeOptionalStringStatus(value) {
  return freezeRecord({
    present: value !== null,
    empty: value === ''
  });
}

function getComparablePropString(props, propName) {
  if (!isObjectLike(props) || !hasOwnProp(props, propName)) {
    return null;
  }

  try {
    const value = props[propName];
    return value == null ? null : String(value);
  } catch (error) {
    return null;
  }
}

function hasOwnProp(value, propName) {
  try {
    return Object.prototype.hasOwnProperty.call(value, propName);
  } catch (error) {
    return false;
  }
}

function throwPostEventRestoreEventError(reason) {
  const error = new Error(
    `Invalid private React DOM controlled input post-event restore queue event evidence: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code = controlledInputPostEventRestoreQueueInvalidEventCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwPostEventRestoreFakeDomObservationError(reason) {
  const error = new Error(
    `Invalid private React DOM controlled input post-event restore queue fake DOM observation evidence: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code =
    controlledInputPostEventRestoreQueueInvalidFakeDomObservationCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwLatestPropsEvidenceError(reason) {
  const error = new Error(
    `Invalid private React DOM controlled input post-event restore queue latest-props evidence: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code = controlledInputPostEventRestoreQueueInvalidLatestPropsCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM controlled input post-event restore queue admission: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code = controlledInputPostEventRestoreQueueInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwPostEventRestoreQueueWritePreflightError(reason, record) {
  const error = new Error(
    `Invalid private React DOM controlled input post-event restore queue write preflight: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code = controlledInputPostEventRestoreQueueInvalidWritePreflightCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  if (record !== undefined) {
    error.sourceRequestId = record.requestId;
    error.sourceRequestSequence = record.requestSequence;
    error.sourceStatus = record.status;
    error.hostTag = record.hostTag;
    error.inputType = record.inputType;
    error.controlKind = record.controlKind;
    error.acceptedRestoreKind =
      record.restoreQueueOrdering?.acceptedRestoreKind || null;
  }
  throw error;
}

function throwPostEventRestoreQueueWriteExecutionError(reason, record) {
  const error = new Error(
    `Invalid private React DOM controlled input post-event restore queue write execution: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code = controlledInputPostEventRestoreQueueInvalidWriteExecutionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  if (record !== undefined) {
    error.sourcePreflightRequestId = record.requestId;
    error.sourcePreflightRequestSequence = record.requestSequence;
    error.sourcePreflightStatus = record.status;
    error.sourceWriteIntentRowCount = Array.isArray(record.writeIntentRows)
      ? record.writeIntentRows.length
      : null;
  }
  throw error;
}

function throwPostEventRestoreQueueFlushBlockerError(reason, record) {
  const error = new Error(
    `Invalid private React DOM controlled input post-event restore queue flush blocker: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code = controlledInputPostEventRestoreQueueInvalidFlushBlockerCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  if (record !== undefined) {
    error.sourcePreflightRequestId = record.requestId;
    error.sourcePreflightRequestSequence = record.requestSequence;
    error.sourceStatus = record.status;
    error.acceptedRecordCount = record.acceptedRecordCount;
    error.acceptedRestoreKinds = record.acceptedRestoreKinds || null;
  }
  throw error;
}

function throwInputChangeEventRestoreQueueBridgeError(reason, record) {
  const error = new Error(
    `Invalid private React DOM input/change event controlled restore queue bridge: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code =
    controlledInputPostEventRestoreQueueInvalidInputChangeBridgeCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  if (record !== undefined) {
    error.sourceRequestId = record.requestId || null;
    error.sourceRequestSequence = record.requestSequence || null;
    error.sourceStatus = record.status || null;
    error.hostTag = record.hostTag || record.targetTag || null;
    error.inputType = record.inputType || record.targetType || null;
    error.controlKind = record.controlKind || null;
    error.acceptedRestoreKind =
      record.restoreQueueOrdering?.acceptedRestoreKind ||
      record.acceptedRestoreKind ||
      null;
  }
  throw error;
}

function throwInputChangeEventRestoreQueueExecutionError(
  reason,
  bridgeRecord,
  writeExecutionRecord,
  flushBlockerRecord
) {
  const error = new Error(
    `Invalid private React DOM input/change event controlled restore queue execution: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code =
    controlledInputPostEventRestoreQueueInvalidInputChangeExecutionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  if (bridgeRecord !== undefined) {
    error.sourceInputChangeBridgeRequestId = bridgeRecord.requestId || null;
    error.sourceInputChangeBridgeRequestSequence =
      bridgeRecord.requestSequence || null;
    error.sourceInputChangeBridgeStatus = bridgeRecord.status || null;
  }
  if (writeExecutionRecord !== undefined) {
    error.sourceWriteExecutionRequestId =
      writeExecutionRecord.requestId || null;
    error.sourceWriteExecutionRequestSequence =
      writeExecutionRecord.requestSequence || null;
    error.sourceWriteExecutionStatus =
      writeExecutionRecord.status || null;
    error.sourcePreflightRequestId =
      writeExecutionRecord.sourcePreflightRequestId || null;
  }
  if (flushBlockerRecord !== undefined) {
    error.sourceFlushBlockerRequestId =
      flushBlockerRecord.requestId || null;
    error.sourceFlushBlockerRequestSequence =
      flushBlockerRecord.requestSequence || null;
    error.sourceFlushBlockerStatus = flushBlockerRecord.status || null;
    error.flushBlockerSourcePreflightRequestId =
      flushBlockerRecord.sourcePreflightRequestId || null;
  }
  throw error;
}

function throwPostEventRestoreQueueWrapperMutationIntentError(
  reason,
  writeExecutionRecord,
  flushBlockerRecord
) {
  const error = new Error(
    `Invalid private React DOM controlled input post-event restore wrapper mutation intent: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputPostEventRestoreQueueGateError';
  error.code =
    controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  if (writeExecutionRecord !== undefined) {
    error.sourceWriteExecutionRequestId = writeExecutionRecord.requestId;
    error.sourceWriteExecutionRequestSequence =
      writeExecutionRecord.requestSequence;
    error.sourceWriteExecutionStatus = writeExecutionRecord.status;
    error.sourcePreflightRequestId =
      writeExecutionRecord.sourcePreflightRequestId || null;
    error.sourcePreflightRequestSequence =
      writeExecutionRecord.sourcePreflightRequestSequence || null;
  }
  if (flushBlockerRecord !== undefined) {
    error.sourceFlushBlockerRequestId = flushBlockerRecord.requestId;
    error.sourceFlushBlockerRequestSequence =
      flushBlockerRecord.requestSequence;
    error.sourceFlushBlockerStatus = flushBlockerRecord.status;
    error.flushBlockerSourcePreflightRequestId =
      flushBlockerRecord.sourcePreflightRequestId || null;
    error.flushBlockerSourcePreflightRequestSequence =
      flushBlockerRecord.sourcePreflightRequestSequence || null;
  }
  throw error;
}

function createGateState(options) {
  const prefix =
    options && typeof options.requestIdPrefix === 'string'
      ? options.requestIdPrefix
      : 'controlled-post-event-restore-queue';

  return {
    inputChangeRestoreQueue: [],
    inputChangeRestoreTarget: null,
    nextRequestSequence: 1,
    requestIdPrefix: prefix
  };
}

function isObjectLike(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function isLikelyLiveDomNode(value) {
  if (!isObjectLike(value)) {
    return false;
  }

  try {
    return (
      typeof value.nodeType === 'number' ||
      value.ownerDocument != null ||
      typeof value.addEventListener === 'function' ||
      typeof value.removeEventListener === 'function'
    );
  } catch (error) {
    return true;
  }
}

function isExplicitControlledRestoreFakeDomTarget(value) {
  try {
    return value[controlledInputValueTrackerFakeDomTargetMarker] === true;
  } catch (error) {
    return false;
  }
}

function arrayShallowEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false;
  }
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function freezeArray(values) {
  return Object.freeze(values.slice());
}

module.exports = {
  controlledInputPostEventRestoreQueueGateErrorCode,
  controlledInputPostEventRestoreQueueGateId,
  controlledInputPostEventRestoreQueueGateSchemaVersion,
  controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
  controlledInputPostEventRestoreQueueIntentRecordedStatus,
  controlledInputPostEventRestoreQueueIntentSkippedStatus,
  controlledInputPostEventRestoreQueueInvalidAdmissionCode,
  controlledInputPostEventRestoreQueueInvalidEventCode,
  controlledInputPostEventRestoreQueueInvalidFlushBlockerCode,
  controlledInputPostEventRestoreQueueInvalidFakeDomObservationCode,
  controlledInputPostEventRestoreQueueInvalidInputChangeBridgeCode,
  controlledInputPostEventRestoreQueueInvalidInputChangeExecutionCode,
  controlledInputPostEventRestoreQueueInvalidLatestPropsCode,
  controlledInputPostEventRestoreQueueInvalidRecordCode,
  controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
  controlledInputPostEventRestoreQueueInvalidWriteExecutionCode,
  controlledInputPostEventRestoreQueueInvalidWritePreflightCode,
  controlledInputPostEventRestoreQueueNoSideEffects,
  controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus,
  controlledInputPostEventRestoreQueueRadioGroupIntentSkippedStatus,
  controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceAcceptedStatus,
  controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus,
  controlledInputPostEventRestoreQueueRadioSiblingPropsLookupRecordedStatus,
  controlledInputPostEventRestoreQueueRadioSiblingPropsLookupSkippedStatus,
  controlledInputPostEventRestoreQueueFlushBlockerStatus,
  controlledInputPostEventRestoreQueueInputChangeBridgeRowStatus,
  controlledInputPostEventRestoreQueueInputChangeBridgeStatus,
  controlledInputPostEventRestoreQueueInputChangeExecutionRowStatus,
  controlledInputPostEventRestoreQueueInputChangeExecutionStatus,
  controlledInputPostEventRestoreQueueStatus,
  controlledInputPostEventRestoreQueueWrapperMutationIntentRowStatus,
  controlledInputPostEventRestoreQueueWrapperMutationIntentStatus,
  controlledInputPostEventRestoreQueueWriteExecutionRowStatus,
  controlledInputPostEventRestoreQueueWriteExecutionStatus,
  controlledInputPostEventRestoreQueueWriteFlushOrderingStatus,
  controlledInputPostEventRestoreQueueWriteIntentRowStatus,
  controlledInputPostEventRestoreQueueWritePreflightStatus,
  createControlledInputPostEventRestoreQueueGate,
  createUnsupportedControlledInputPostEventRestoreQueueError,
  describeControlledInputPostEventRestoreQueueGate,
  getPrivateControlledInputPostEventRestoreQueueFlushBlockerRecordPayload,
  getPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecordPayload,
  getPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecordPayload,
  getPrivateControlledInputPostEventRestoreQueueRecordPayload,
  getPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordPayload,
  getPrivateControlledInputPostEventRestoreQueueWriteExecutionRecordPayload,
  getPrivateControlledInputPostEventRestoreQueueWritePreflightRecordPayload,
  isPrivateControlledInputPostEventRestoreQueueFlushBlockerRecord,
  isPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecord,
  isPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecord,
  isPrivateControlledInputPostEventRestoreQueueRecord,
  isPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecord,
  isPrivateControlledInputPostEventRestoreQueueWriteExecutionRecord,
  isPrivateControlledInputPostEventRestoreQueueWritePreflightRecord,
  privateControlledInputPostEventRestoreQueueFlushBlockerRecordType,
  privateControlledInputPostEventRestoreQueueInputChangeBridgeRecordType,
  privateControlledInputPostEventRestoreQueueInputChangeBridgeRowType,
  privateControlledInputPostEventRestoreQueueInputChangeExecutionRecordType,
  privateControlledInputPostEventRestoreQueueInputChangeExecutionRowType,
  privateControlledInputPostEventRestoreQueueRecordType,
  privateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordType,
  privateControlledInputPostEventRestoreQueueWrapperMutationIntentRowType,
  privateControlledInputPostEventRestoreQueueWriteExecutionRecordType,
  privateControlledInputPostEventRestoreQueueWriteExecutionRowType,
  privateControlledInputPostEventRestoreQueueWriteIntentRowType,
  privateControlledInputPostEventRestoreQueueWritePreflightRecordType,
  preflightControlledInputPostEventRestoreQueueWrites,
  recordControlledInputPostEventRestoreQueueFlushBlocker,
  recordControlledInputPostEventRestoreQueueWrapperMutationIntent,
  recordControlledInputPostEventRestoreQueueWriteExecution,
  recordControlledInputChangeEventRestoreQueueBridge,
  recordControlledInputChangeEventRestoreQueueExecution,
  recordControlledInputPostEventRestoreIntentFromEventLatestProps,
  recordControlledInputPostEventRestoreIntentFromFakeDomObservationLatestProps
};
