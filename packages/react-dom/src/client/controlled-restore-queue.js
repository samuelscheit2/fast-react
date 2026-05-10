'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  unimplementedCode
} = require('../../placeholder-utils.js');
const {
  EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
  getEventListenerTargetLookupRecordPayload
} = require('./component-tree.js');
const {
  controlledInputValueTrackerFakeDomObservedStatus,
  getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload,
  privateControlledInputValueTrackerFakeDomDiagnosticRecordType
} = require('../resource-form-internals-gate.js');
const {
  CONTROLLED_STATE_RESTORE_BLOCKED_CODE,
  EVENT_DISPATCH_BLOCKED_CODE,
  EVENT_DISPATCH_RECORD_KIND,
  PLUGIN_EXTRACTION_BLOCKED_CODE
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
const controlledInputPostEventRestoreQueueWrapperMutationIntentPayloads =
  new WeakMap();
const defaultControlledInputPostEventRestoreQueueGate =
  createControlledInputPostEventRestoreQueueGate();

const controlledInputPostEventRestoreQueueNoSideEffects = freezeRecord({
  eventDispatchRecordAccepted: false,
  fakeDomTrackerObservationAccepted: false,
  latestPropsEvidenceAccepted: false,
  latestPropsMetadataRead: false,
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
  getPrivateControlledInputPostEventRestoreQueueRecordPayload,
  getPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordPayload,
  getPrivateControlledInputPostEventRestoreQueueWriteExecutionRecordPayload,
  getPrivateControlledInputPostEventRestoreQueueWritePreflightRecordPayload,
  isPrivateControlledInputPostEventRestoreQueueFlushBlockerRecord,
  isPrivateControlledInputPostEventRestoreQueueRecord,
  isPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecord,
  isPrivateControlledInputPostEventRestoreQueueWriteExecutionRecord,
  isPrivateControlledInputPostEventRestoreQueueWritePreflightRecord,
  privateControlledInputPostEventRestoreQueueFlushBlockerRecordType,
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
  recordControlledInputPostEventRestoreIntentFromEventLatestProps,
  recordControlledInputPostEventRestoreIntentFromFakeDomObservationLatestProps
};
