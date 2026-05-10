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
const controlledInputPostEventRestoreQueueInvalidEventCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_EVENT';
const controlledInputPostEventRestoreQueueInvalidFakeDomObservationCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_FAKE_DOM_OBSERVATION';
const controlledInputPostEventRestoreQueueInvalidAdmissionCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_ADMISSION';
const controlledInputPostEventRestoreQueueInvalidLatestPropsCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_LATEST_PROPS';
const controlledInputPostEventRestoreQueueInvalidRecordCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_INVALID_RECORD';
const controlledInputPostEventRestoreQueueGateErrorCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_POST_EVENT_RESTORE_QUEUE_GATE';

const supportedHostTags = new Set(['input', 'select', 'textarea']);
const controlledInputPostEventRestoreQueueRecordPayloads = new WeakMap();
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
  restoreQueueWritten: false,
  restoreQueueFlushed: false,
  controlledStateRestoreScheduled: false,
  controlledStateRestoreInvoked: false,
  hostWrapperInvoked: false,
  checkableRestoreMetadataRecorded: false,
  radioGroupRestoreIntentRecorded: false,
  radioGroupLookupRequired: false,
  radioGroupLookupPerformed: false,
  radioGroupMembersEnumerated: false,
  radioGroupSiblingMetadataRead: false,
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
  const groupIntentRecords = createCheckableGroupIntentRecords(
    controlledTarget,
    latestPropsEvidence,
    normalizedAdmission,
    intentRecorded
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
    groupIntentRecords,
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
      groupIntentRecords
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
  const groupIntentRecords = createCheckableGroupIntentRecords(
    controlledTarget,
    latestPropsEvidence,
    normalizedAdmission,
    intentRecorded
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
    groupIntentRecords,
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
        groupIntentRecords
      )
  });

  controlledInputPostEventRestoreQueueRecordPayloads.set(payload, payload);
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
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    installsLiveDescriptors: false,
    writesValueTrackerField: false,
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

function isPrivateControlledInputPostEventRestoreQueueRecord(record) {
  return (
    getPrivateControlledInputPostEventRestoreQueueRecordPayload(record) !== null
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

function createCheckableGroupIntentRecords(
  controlledTarget,
  latestPropsEvidence,
  admission,
  intentRecorded
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
    restoreQueued: false,
    restoreFlushed: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueSideEffects(
  latestPropsEvidence,
  intentRecorded,
  controlledTarget,
  groupIntentRecords
) {
  const radioGroupIntent = getRecordedRadioGroupIntent(groupIntentRecords);
  const checkable = isCheckableControlledTarget(controlledTarget);

  return freezeRecord({
    ...controlledInputPostEventRestoreQueueNoSideEffects,
    eventDispatchRecordAccepted: true,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    latestPropsMetadataRead: latestPropsEvidence.accepted,
    postEventRestoreIntentRecorded: intentRecorded,
    postEventRestoreIntentSkipped: !intentRecorded,
    restoreQueueRecordCreated: true,
    checkableRestoreMetadataRecorded: checkable,
    radioGroupRestoreIntentRecorded: radioGroupIntent !== null,
    radioGroupLookupRequired:
      radioGroupIntent === null
        ? false
        : radioGroupIntent.groupLookupRequired,
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
  groupIntentRecords
) {
  const radioGroupIntent = getRecordedRadioGroupIntent(groupIntentRecords);
  const checkable = isCheckableControlledTarget(controlledTarget);

  return freezeRecord({
    ...controlledInputPostEventRestoreQueueNoSideEffects,
    fakeDomTrackerObservationAccepted: true,
    fakeDomValueChangeObserved: observationRecord.trackerRecord.changed === true,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    latestPropsMetadataRead: latestPropsEvidence.accepted,
    postEventRestoreIntentRecorded: intentRecorded,
    postEventRestoreIntentSkipped: !intentRecorded,
    restoreQueueRecordCreated: true,
    checkableRestoreMetadataRecorded: checkable,
    radioGroupRestoreIntentRecorded: radioGroupIntent !== null,
    radioGroupLookupRequired:
      radioGroupIntent === null
        ? false
        : radioGroupIntent.groupLookupRequired,
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
  controlledInputPostEventRestoreQueueInvalidFakeDomObservationCode,
  controlledInputPostEventRestoreQueueInvalidLatestPropsCode,
  controlledInputPostEventRestoreQueueInvalidRecordCode,
  controlledInputPostEventRestoreQueueNoSideEffects,
  controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus,
  controlledInputPostEventRestoreQueueRadioGroupIntentSkippedStatus,
  controlledInputPostEventRestoreQueueStatus,
  createControlledInputPostEventRestoreQueueGate,
  createUnsupportedControlledInputPostEventRestoreQueueError,
  describeControlledInputPostEventRestoreQueueGate,
  getPrivateControlledInputPostEventRestoreQueueRecordPayload,
  isPrivateControlledInputPostEventRestoreQueueRecord,
  privateControlledInputPostEventRestoreQueueRecordType,
  recordControlledInputPostEventRestoreIntentFromEventLatestProps,
  recordControlledInputPostEventRestoreIntentFromFakeDomObservationLatestProps
};
