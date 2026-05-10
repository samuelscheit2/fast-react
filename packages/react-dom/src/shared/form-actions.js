'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  unimplementedCode
} = require('../../placeholder-utils.js');
const internalsGate = require('../resource-form-internals-gate.js');

const hasOwn = Object.prototype.hasOwnProperty;

const formActionFormDataBlockerGateSchemaVersion = 1;
const privateFormActionFormDataBlockerGateId =
  'form-action-formdata-blocker-private-gate-1';
const privateFormActionFormDataBlockerRecordType =
  'fast.react_dom.private_form_action_formdata_blocker_record';
const privateFormActionFormDataBlockerStatus =
  'private-form-action-formdata-blocker-metadata-only';
const privateFormActionFormDataBlockerRecordedStatus =
  'recorded-private-form-action-formdata-blocker';
const privateFormActionFormDataBlockerGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_FORMDATA_BLOCKER_GATE';
const privateFormActionFormDataBlockerInvalidAdmissionCode =
  'FAST_REACT_DOM_FORM_ACTION_FORMDATA_BLOCKER_INVALID_ADMISSION';
const privateFormActionFormDataBlockerInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_FORMDATA_BLOCKER_INVALID_RECORD';
const formActionsOracleKind =
  'react-19.2.6-react-dom-form-actions-oracle';

const formActionFormDataBlockerRecordPayloads = new WeakMap();

const blockedRawAdmissionFields = freezeArray([
  'form',
  'formElement',
  'target',
  'currentTarget',
  'nativeEvent',
  'event',
  'action',
  'formData',
  'formAction',
  'submitControl',
  'submit' + 'ter',
  'fiber',
  'formFiber',
  'queue',
  'resetQueue',
  'dispatcher',
  'previousDispatcher',
  'hostInstance',
  'instance',
  'domNode',
  'root'
]);

const formActionFormDataBlockerBlockedSideEffects = freezeRecord({
  sourceEventExtractionAccepted: false,
  sourceResetQueueCommitAccepted: false,
  acceptedMetadataIdsRecorded: false,
  targetShapeRecorded: false,
  submitterShapeRecorded: false,
  rawTargetCaptured: false,
  rawEventCaptured: false,
  rawActionCaptured: false,
  rawSubmitControlCaptured: false,
  nativeEventInspected: false,
  realFormInspected: false,
  submitControlInspected: false,
  formPropsRead: false,
  submitControlPropsRead: false,
  submitControlAttributeRead: false,
  formDataConstructionBlocked: true,
  formDataConstructed: false,
  temporarySubmitControlInserted: false,
  formdataEventDispatched: false,
  defaultPrevented: false,
  actionFunctionCaptured: false,
  actionInvoked: false,
  hostTransitionStarted: false,
  previousDispatcherCalled: false,
  resetFiberResolved: false,
  resetStateQueued: false,
  reactUpdateQueued: false,
  resetFormInstanceCalled: false,
  formResetCommitted: false,
  realFormReset: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const formActionFormDataBlockerDiagnosticSideEffects = freezeRecord({
  ...formActionFormDataBlockerBlockedSideEffects,
  sourceEventExtractionAccepted: true,
  sourceResetQueueCommitAccepted: true,
  acceptedMetadataIdsRecorded: true,
  targetShapeRecorded: true,
  submitterShapeRecorded: true
});

const formActionFormDataBlockerMissingPrerequisites = freezeArray([
  prerequisite(
    'no-live-form-target-read',
    'react-dom-form',
    'Form target shape is accepted as private metadata only; no form element is captured or inspected.'
  ),
  prerequisite(
    'no-submit-control-read',
    'react-dom-form',
    'Submit control shape is accepted as private metadata only; no control props or attributes are read.'
  ),
  prerequisite(
    'no-client-formdata-construction',
    'react-dom-form',
    'Client form data construction remains blocked after submit metadata is accepted.'
  ),
  prerequisite(
    'no-action-function-invocation',
    'react-dom-form',
    'Action function capture and invocation remain blocked after submit metadata is accepted.'
  ),
  prerequisite(
    'no-reset-queue-execution',
    'react-dom-form',
    'Reset queue and after-mutation reset execution remain blocked after reset metadata is accepted.'
  ),
  prerequisite(
    'no-public-form-action-compatibility',
    'react-dom-client',
    'Public form action compatibility remains unclaimed.'
  )
]);

const defaultFormActionFormDataBlockerGate =
  createFormActionFormDataBlockerDiagnosticGate();

function createFormActionFormDataBlockerDiagnosticGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'form-action-formdata-blocker'
  );

  return Object.freeze({
    recordFormDataBlockerDiagnostic(
      eventExtractionRecord,
      resetQueueCommitRecord,
      admission
    ) {
      return recordFormActionFormDataBlockerWithGate(
        gateState,
        eventExtractionRecord,
        resetQueueCommitRecord,
        admission
      );
    }
  });
}

function recordFormActionFormDataBlockerDiagnostic(
  eventExtractionRecord,
  resetQueueCommitRecord,
  admission
) {
  return defaultFormActionFormDataBlockerGate
    .recordFormDataBlockerDiagnostic(
      eventExtractionRecord,
      resetQueueCommitRecord,
      admission
    );
}

function describePrivateFormActionFormDataBlockerGate() {
  return freezeRecord({
    schemaVersion: formActionFormDataBlockerGateSchemaVersion,
    gateId: privateFormActionFormDataBlockerGateId,
    compatibilityTarget,
    status: privateFormActionFormDataBlockerStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeRecord({
      oracleKind: formActionsOracleKind,
      schemaVersion: 1,
      compatibilityClaimed: false,
      fastReactComparedToReactDom: false,
      contractCount: 1
    }),
    acceptedEventExtractionRecordType:
      internalsGate.privateFormActionEventExtractionRecordType,
    acceptedEventExtractionGateId:
      internalsGate.privateFormActionEventExtractionGateId,
    acceptedEventExtractionStatus:
      internalsGate.privateFormActionEventExtractionRecordedStatus,
    acceptedResetQueueCommitRecordType:
      internalsGate.privateFormActionResetQueueCommitRecordType,
    acceptedResetQueueCommitGateId:
      internalsGate.privateFormActionResetQueueCommitGateId,
    acceptedResetQueueCommitStatus:
      internalsGate.privateFormActionResetQueueCommitRecordedStatus,
    recordsAcceptedMetadataIds: true,
    recordsFormTargetShape: true,
    recordsSubmitterShape: true,
    blocksFormDataConstruction: true,
    blocksActionInvocation: true,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    readsFormProps: false,
    readsSubmitControlProps: false,
    constructsFormData: false,
    invokesActions: false,
    startsHostTransition: false,
    callsPreviousDispatchers: false,
    queuesReactUpdates: false,
    commitsFormResets: false,
    resetsForms: false,
    sideEffects: formActionFormDataBlockerBlockedSideEffects,
    missingPrerequisites: formActionFormDataBlockerMissingPrerequisites,
    eventExtractionGate:
      internalsGate.describePrivateFormActionEventExtractionGate(),
    resetQueueCommitGate:
      internalsGate.describePrivateFormActionResetQueueCommitGate()
  });
}

function createUnsupportedFormActionFormDataBlockerError(record) {
  const payload = assertPrivateFormActionFormDataBlockerRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private form action data blocker records shape and blocker metadata only.'
  );

  error.code = privateFormActionFormDataBlockerGateErrorCode;
  error.blockerId = payload.blockerId;
  error.blockerSequence = payload.blockerSequence;
  error.requestType = payload.requestType;
  error.status = payload.status;
  error.acceptedMetadataIds = payload.acceptedMetadataIds;
  error.formDataConstructionBlocker =
    payload.formDataConstructionBlocker;
  error.actionInvocationBlocker = payload.actionInvocationBlocker;
  error.sideEffects = payload.sideEffects;

  return error;
}

function getPrivateFormActionFormDataBlockerRecordPayload(record) {
  return formActionFormDataBlockerRecordPayloads.get(record) || null;
}

function isPrivateFormActionFormDataBlockerRecord(value) {
  return formActionFormDataBlockerRecordPayloads.has(value);
}

function recordFormActionFormDataBlockerWithGate(
  gateState,
  eventExtractionRecord,
  resetQueueCommitRecord,
  admission
) {
  const eventExtraction =
    assertAcceptedFormActionEventExtractionRecord(eventExtractionRecord);
  const resetQueueCommit =
    assertAcceptedFormActionResetQueueCommitRecord(resetQueueCommitRecord);
  const normalizedAdmission =
    normalizeFormActionFormDataBlockerAdmission(
      eventExtraction,
      resetQueueCommit,
      admission
    );
  const blockerSequence = gateState.nextRequestSequence++;
  const blockerId = `${gateState.requestIdPrefix}:${blockerSequence}`;
  const acceptedMetadataIds = createAcceptedMetadataIds(
    eventExtraction,
    resetQueueCommit
  );
  const formTargetShape = createFormTargetShape(
    eventExtraction,
    normalizedAdmission
  );
  const submitterShape = createSubmitterShape(
    eventExtraction,
    normalizedAdmission
  );
  const formDataConstructionBlocker =
    createFormDataConstructionBlocker(
      eventExtraction,
      resetQueueCommit,
      formTargetShape,
      submitterShape
    );

  const payload = freezeRecord({
    schemaVersion: formActionFormDataBlockerGateSchemaVersion,
    $$typeof: privateFormActionFormDataBlockerRecordType,
    kind: 'FastReactDomPrivateFormActionFormDataBlockerRecord',
    gateId: privateFormActionFormDataBlockerGateId,
    compatibilityTarget,
    status: privateFormActionFormDataBlockerRecordedStatus,
    unsupportedCode: unimplementedCode,
    blockerId,
    blockerSequence,
    requestType: 'form-action-formdata-blocker.diagnostic',
    contractId: 'form-action-formdata-blocker',
    oracleKind: formActionsOracleKind,
    oracleSchemaVersion: 1,
    sourceEventExtractionId: eventExtraction.extractionId,
    sourceEventExtractionSequence: eventExtraction.extractionSequence,
    sourceEventExtractionStatus: eventExtraction.status,
    sourceSubmissionRequestId: eventExtraction.sourceRequestId,
    sourceSubmissionRequestSequence: eventExtraction.sourceRequestSequence,
    sourceResetQueueCommitRequestId: resetQueueCommit.requestId,
    sourceResetQueueCommitRequestSequence:
      resetQueueCommit.requestSequence,
    sourceResetIntentRequestId: resetQueueCommit.sourceResetRequestId,
    sourceResetIntentRequestSequence:
      resetQueueCommit.sourceResetRequestSequence,
    acceptedMetadataIds,
    admission: normalizedAdmission,
    sourceEventExtraction:
      createSourceEventExtractionSummary(eventExtraction),
    sourceResetQueueCommit:
      createSourceResetQueueCommitSummary(resetQueueCommit),
    formTargetShape,
    submitterShape,
    formDataConstructionBlocker,
    actionInvocationBlocker:
      createActionInvocationBlocker(eventExtraction),
    resetExecutionBlocker:
      createResetExecutionBlocker(resetQueueCommit),
    publicFormActionBoundary:
      createPublicFormActionBlockerBoundary(),
    sideEffects: formActionFormDataBlockerDiagnosticSideEffects,
    missingPrerequisites: formActionFormDataBlockerMissingPrerequisites
  });

  formActionFormDataBlockerRecordPayloads.set(payload, payload);
  return payload;
}

function assertAcceptedFormActionEventExtractionRecord(record) {
  const payload =
    internalsGate.getPrivateFormActionEventExtractionRecordPayload(record);
  if (
    payload !== null &&
    payload.status ===
      internalsGate.privateFormActionEventExtractionRecordedStatus &&
    payload.eventExtraction?.metadataOnly === true &&
    payload.eventExtraction
      .consumedSubmitRequestSubmitActionMetadata === true &&
    payload.eventExtraction.formDataConstructed === false &&
    payload.eventExtraction.actionInvoked === false &&
    payload.eventExtraction.hostTransitionStarted === false &&
    payload.sideEffects?.realFormInspected === false &&
    payload.sideEffects?.formDataConstructed === false &&
    payload.sideEffects?.actionInvoked === false
  ) {
    return payload;
  }

  throwInvalidRecord(
    'source event extraction must be accepted metadata-only submit extraction'
  );
}

function assertAcceptedFormActionResetQueueCommitRecord(record) {
  const payload =
    internalsGate.getPrivateFormActionResetQueueCommitRecordPayload(record);
  if (
    payload !== null &&
    payload.status ===
      internalsGate.privateFormActionResetQueueCommitRecordedStatus &&
    payload.admission?.metadataOnly === true &&
    payload.queueBoundary?.reactUpdateQueued === false &&
    payload.commitBoundary?.resetFormInstanceCalled === false &&
    payload.commitBoundary?.realFormReset === false &&
    payload.sideEffects?.previousDispatcherCalled === false &&
    payload.sideEffects?.resetUpdateEnqueued === false &&
    payload.sideEffects?.realFormReset === false
  ) {
    return payload;
  }

  throwInvalidRecord(
    'source reset queue/commit must be accepted metadata-only reset boundary'
  );
}

function assertPrivateFormActionFormDataBlockerRecord(record) {
  const payload = getPrivateFormActionFormDataBlockerRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  throwInvalidRecord(
    'expected a private form action data blocker diagnostic record'
  );
}

function normalizeFormActionFormDataBlockerAdmission(
  eventExtraction,
  resetQueueCommit,
  admission
) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidAdmission('admission metadata must be an object');
  }

  if (admission.explicitFormActionFormDataBlocker !== true) {
    throwInvalidAdmission('explicitFormActionFormDataBlocker must be true');
  }

  assertNoRawAdmissionFields(admission);

  return freezeRecord({
    explicitFormActionFormDataBlocker: true,
    metadataOnly: true,
    diagnosticKind:
      getAdmissionStringProperty(
        admission,
        'diagnosticKind',
        'metadata-only-form-action-data-blocker'
      ),
    sourceEventExtractionId: eventExtraction.extractionId,
    sourceResetQueueCommitRequestId: resetQueueCommit.requestId,
    targetShape: normalizeFormTargetShape(
      eventExtraction,
      admission.formTargetShape
    ),
    submitterShape: normalizeSubmitterShape(
      eventExtraction,
      admission.submitterShape
    ),
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawActionCaptured: false,
    rawSubmitControlCaptured: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    actionInvoked: false,
    previousDispatcherCalled: false,
    resetExecutionAllowed: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function assertNoRawAdmissionFields(admission) {
  for (const field of blockedRawAdmissionFields) {
    if (hasOwnProp(admission, field)) {
      throwInvalidAdmission(
        `${field} must not be passed to the form action data blocker gate`
      );
    }
  }
}

function normalizeFormTargetShape(eventExtraction, shape) {
  const record = shape == null ? Object.create(null) : shape;
  if (typeof record !== 'object') {
    throwInvalidAdmission('formTargetShape must be an object when present');
  }

  const targetKind = getShapeStringProperty(
    record,
    'targetKind',
    'form'
  );
  if (targetKind !== 'form') {
    throwInvalidAdmission('formTargetShape.targetKind must be form');
  }

  const hostTag = getShapeStringProperty(record, 'hostTag', 'form');
  if (hostTag !== 'form') {
    throwInvalidAdmission('formTargetShape.hostTag must be form');
  }

  return freezeRecord({
    metadataOnly: true,
    targetKind,
    hostTag,
    eventName: eventExtraction.eventName,
    submissionTrigger: eventExtraction.submissionTrigger,
    actionKind: eventExtraction.actionKind,
    actionSource: eventExtraction.actionSource,
    formActionKind: eventExtraction.formActionKind,
    methodKind: getShapeStringProperty(record, 'methodKind', 'unknown'),
    encodingKind: getShapeStringProperty(
      record,
      'encodingKind',
      'unknown'
    ),
    targetMatchesCurrentEventTarget: true,
    formPropsWouldBeRead: true,
    methodWouldPopulatePendingStatus:
      eventExtraction.eventExtraction.pendingStatusWouldBeSet,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    nativeEventInspected: false,
    realFormInspected: false,
    formPropsRead: false,
    formDataConstructed: false,
    compatibilityClaimed: false
  });
}

function normalizeSubmitterShape(eventExtraction, shape) {
  const record = shape == null ? Object.create(null) : shape;
  if (typeof record !== 'object') {
    throwInvalidAdmission('submitterShape must be an object when present');
  }

  const controlKind = getShapeStringProperty(
    record,
    'controlKind',
    eventExtraction.submitControlKind
  );
  const hostTag = getShapeStringProperty(
    record,
    'hostTag',
    getDefaultSubmitControlHostTag(controlKind)
  );

  if (
    controlKind !== 'button' &&
    controlKind !== 'input' &&
    controlKind !== 'none' &&
    controlKind !== 'unknown'
  ) {
    throwInvalidAdmission(
      'submitterShape.controlKind must be button, input, none, or unknown'
    );
  }
  if (
    hostTag !== 'button' &&
    hostTag !== 'input' &&
    hostTag !== 'none' &&
    hostTag !== 'unknown'
  ) {
    throwInvalidAdmission(
      'submitterShape.hostTag must be button, input, none, or unknown'
    );
  }

  return freezeRecord({
    metadataOnly: true,
    controlKind,
    hostTag,
    sourceSubmitControlKind: eventExtraction.submitControlKind,
    actionKind: eventExtraction.submitterActionKind,
    actionOverridesFormAction:
      eventExtraction.submitterActionOverridesFormAction,
    nameKind: getShapeStringProperty(record, 'nameKind', 'unknown'),
    valueKind: getShapeStringProperty(record, 'valueKind', 'unknown'),
    valueWouldBeIncludedInFormData:
      eventExtraction.eventExtraction.submitterValueWouldBeIncludedInFormData,
    temporaryControlWouldBeInserted:
      eventExtraction.eventExtraction.submitterValueWouldBeIncludedInFormData,
    propsWouldBeRead:
      eventExtraction.submitControlKind !== 'none',
    attributeWouldBeRead:
      eventExtraction.submitControlKind !== 'none',
    rawSubmitControlCaptured: false,
    submitControlInspected: false,
    propsRead: false,
    attributeRead: false,
    compatibilityClaimed: false
  });
}

function createAcceptedMetadataIds(eventExtraction, resetQueueCommit) {
  return freezeRecord({
    eventExtractionId: eventExtraction.extractionId,
    eventExtractionSequence: eventExtraction.extractionSequence,
    submissionIntentRequestId: eventExtraction.sourceRequestId,
    submissionIntentRequestSequence: eventExtraction.sourceRequestSequence,
    resetQueueCommitRequestId: resetQueueCommit.requestId,
    resetQueueCommitRequestSequence: resetQueueCommit.requestSequence,
    resetIntentRequestId: resetQueueCommit.sourceResetRequestId,
    resetIntentRequestSequence: resetQueueCommit.sourceResetRequestSequence,
    eventExtractionGateId: eventExtraction.gateId,
    resetQueueCommitGateId: resetQueueCommit.gateId
  });
}

function createSourceEventExtractionSummary(eventExtraction) {
  return freezeRecord({
    extractionId: eventExtraction.extractionId,
    extractionSequence: eventExtraction.extractionSequence,
    sourceRequestId: eventExtraction.sourceRequestId,
    sourceRequestSequence: eventExtraction.sourceRequestSequence,
    sourceStatus: eventExtraction.sourceStatus,
    eventName: eventExtraction.eventName,
    submissionTrigger: eventExtraction.submissionTrigger,
    actionKind: eventExtraction.actionKind,
    actionSource: eventExtraction.actionSource,
    submitControlKind: eventExtraction.submitControlKind,
    formActionKind: eventExtraction.formActionKind,
    submitterActionKind: eventExtraction.submitterActionKind,
    submitterActionOverridesFormAction:
      eventExtraction.submitterActionOverridesFormAction,
    metadataOnly: eventExtraction.eventExtraction.metadataOnly,
    consumedSubmitRequestSubmitActionMetadata:
      eventExtraction.eventExtraction
        .consumedSubmitRequestSubmitActionMetadata,
    formDataConstructed: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    compatibilityClaimed: false
  });
}

function createSourceResetQueueCommitSummary(resetQueueCommit) {
  return freezeRecord({
    requestId: resetQueueCommit.requestId,
    requestSequence: resetQueueCommit.requestSequence,
    sourceResetRequestId: resetQueueCommit.sourceResetRequestId,
    sourceResetRequestSequence:
      resetQueueCommit.sourceResetRequestSequence,
    sourceResetOrderingKind:
      resetQueueCommit.sourceResetOrderingKind,
    sourceResetSource: resetQueueCommit.sourceResetSource,
    sourceTransitionContext:
      resetQueueCommit.sourceTransitionContext,
    queueStatus: resetQueueCommit.queueBoundary.status,
    commitStatus: resetQueueCommit.commitBoundary.status,
    resetStateWouldBeQueued:
      resetQueueCommit.queueBoundary.resetStateWouldBeQueued,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createFormTargetShape(eventExtraction, admission) {
  return freezeRecord({
    ...admission.targetShape,
    sourceEventExtractionId: eventExtraction.extractionId,
    acceptedMetadataIdsRecorded: true
  });
}

function createSubmitterShape(eventExtraction, admission) {
  return freezeRecord({
    ...admission.submitterShape,
    sourceEventExtractionId: eventExtraction.extractionId,
    acceptedMetadataIdsRecorded: true
  });
}

function createFormDataConstructionBlocker(
  eventExtraction,
  resetQueueCommit,
  formTargetShape,
  submitterShape
) {
  return freezeRecord({
    status: 'blocked-private-form-action-formdata-construction',
    sourceEventExtractionId: eventExtraction.extractionId,
    sourceResetQueueCommitRequestId: resetQueueCommit.requestId,
    targetKind: formTargetShape.targetKind,
    submitControlKind: submitterShape.controlKind,
    wouldConstructForPendingStatus:
      eventExtraction.eventExtraction.pendingStatusWouldBeSet,
    wouldConstructForActionInvocation:
      eventExtraction.eventExtraction.actionInvocationWouldBeScheduled,
    wouldUseSubmitControlValue:
      submitterShape.valueWouldBeIncludedInFormData,
    wouldInsertTemporarySubmitControl:
      submitterShape.temporaryControlWouldBeInserted,
    constructorCallBlocked: true,
    rawTargetCaptured: false,
    rawSubmitControlCaptured: false,
    realFormInspected: false,
    submitControlInspected: false,
    formPropsRead: false,
    submitControlPropsRead: false,
    formDataConstructed: false,
    temporarySubmitControlInserted: false,
    formdataEventDispatched: false,
    compatibilityClaimed: false,
    blockedReason: 'no-client-formdata-construction'
  });
}

function createActionInvocationBlocker(eventExtraction) {
  return freezeRecord({
    status: 'blocked-private-form-action-invocation',
    sourceEventExtractionId: eventExtraction.extractionId,
    actionKind: eventExtraction.actionKind,
    actionSource: eventExtraction.actionSource,
    nativeNavigationWouldBePrevented:
      eventExtraction.eventExtraction.nativeNavigationWouldBePrevented,
    pendingStatusWouldBeSet:
      eventExtraction.eventExtraction.pendingStatusWouldBeSet,
    actionInvocationWouldBeScheduled:
      eventExtraction.eventExtraction.actionInvocationWouldBeScheduled,
    defaultPreventedByGate: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    blockedReason: 'no-action-function-invocation'
  });
}

function createResetExecutionBlocker(resetQueueCommit) {
  return freezeRecord({
    status: 'blocked-private-form-action-reset-execution',
    sourceResetQueueCommitRequestId: resetQueueCommit.requestId,
    sourceResetIntentRequestId: resetQueueCommit.sourceResetRequestId,
    resetStateWouldBeQueued:
      resetQueueCommit.queueBoundary.resetStateWouldBeQueued,
    resetTraversalWouldRunAfterMutationEffects:
      resetQueueCommit.commitBoundary
        .resetTraversalWouldRunAfterMutationEffects,
    previousDispatcherCalled: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    afterMutationEffectsVisited: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createPublicFormActionBlockerBoundary() {
  return freezeRecord({
    status: 'blocked-public-form-action-formdata-compatibility',
    publicFormActionsEnabled: false,
    publicRequestFormResetReachable: false,
    publicRootTouched: false,
    realFormAccepted: false,
    realFormInspected: false,
    formDataConstructed: false,
    actionInvoked: false,
    reactUpdateQueued: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function getDefaultSubmitControlHostTag(controlKind) {
  if (controlKind === 'button' || controlKind === 'input') {
    return controlKind;
  }
  if (controlKind === 'none') {
    return 'none';
  }
  return 'unknown';
}

function getAdmissionStringProperty(record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidAdmission(`${key} must be a non-empty string`);
}

function getShapeStringProperty(record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidAdmission(`${key} must be a non-empty string`);
}

function throwInvalidAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM form action data blocker admission: ${reason}.`
  );
  error.name = 'FastReactDomFormActionFormDataBlockerGateError';
  error.code = privateFormActionFormDataBlockerInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidRecord(reason) {
  const error = new Error(
    `Invalid private React DOM form action data blocker record: ${reason}.`
  );
  error.name = 'FastReactDomFormActionFormDataBlockerGateError';
  error.code = privateFormActionFormDataBlockerInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function prerequisite(id, area, reason) {
  return freezeRecord({ id, area, reason });
}

function createGateStateWithDefaultPrefix(options, defaultPrefix) {
  const prefix =
    options && typeof options.requestIdPrefix === 'string'
      ? options.requestIdPrefix
      : defaultPrefix;

  return {
    requestIdPrefix: prefix,
    nextRequestSequence: 1
  };
}

function hasOwnProp(record, key) {
  return hasOwn.call(record, key);
}

function freezeArray(value) {
  return Object.freeze(value);
}

function freezeRecord(value) {
  return Object.freeze(value);
}

module.exports = {
  createFormActionFormDataBlockerDiagnosticGate,
  createUnsupportedFormActionFormDataBlockerError,
  describePrivateFormActionFormDataBlockerGate,
  formActionFormDataBlockerBlockedSideEffects,
  formActionFormDataBlockerDiagnosticSideEffects,
  formActionFormDataBlockerGateSchemaVersion,
  formActionFormDataBlockerMissingPrerequisites,
  getPrivateFormActionFormDataBlockerRecordPayload,
  isPrivateFormActionFormDataBlockerRecord,
  privateFormActionFormDataBlockerGateErrorCode,
  privateFormActionFormDataBlockerGateId,
  privateFormActionFormDataBlockerInvalidAdmissionCode,
  privateFormActionFormDataBlockerInvalidRecordCode,
  privateFormActionFormDataBlockerRecordedStatus,
  privateFormActionFormDataBlockerRecordType,
  privateFormActionFormDataBlockerStatus,
  recordFormActionFormDataBlockerDiagnostic
};
