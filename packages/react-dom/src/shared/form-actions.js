'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  unimplementedCode
} = require('../../placeholder-utils.js');
const internalsGate = require('../resource-form-internals-gate.js');

const hasOwn = Object.prototype.hasOwnProperty;

const formActionFormDataBlockerGateSchemaVersion = 1;
const formActionSubmitDispatchGateSchemaVersion = 1;
const formActionSubmitResetExecutionGateSchemaVersion = 1;
const formActionCallbackActionPreflightGateSchemaVersion = 1;
const formActionAsyncCallbackExecutionGateSchemaVersion = 1;
const formActionRejectedErrorPreflightGateSchemaVersion = 1;
const privateFormActionFormDataBlockerGateId =
  'form-action-formdata-blocker-private-gate-1';
const privateFormActionSubmitDispatchGateId =
  'form-action-submit-dispatch-private-gate-1';
const privateFormActionSubmitResetExecutionGateId =
  'form-action-submit-reset-execution-private-gate-1';
const privateFormActionCallbackActionPreflightGateId =
  'form-action-callback-action-preflight-private-gate-1';
const privateFormActionAsyncCallbackExecutionGateId =
  'form-action-async-callback-execution-private-gate-1';
const privateFormActionRejectedErrorPreflightGateId =
  'form-action-rejected-error-preflight-private-gate-1';
const privateFormActionFormDataBlockerRecordType =
  'fast.react_dom.private_form_action_formdata_blocker_record';
const privateFormActionSubmitDispatchRecordType =
  'fast.react_dom.private_form_action_submit_dispatch_record';
const privateFormActionSubmitResetExecutionRecordType =
  'fast.react_dom.private_form_action_submit_reset_execution_record';
const privateFormActionCallbackActionPreflightRecordType =
  'fast.react_dom.private_form_action_callback_action_preflight_record';
const privateFormActionAsyncCallbackExecutionRecordType =
  'fast.react_dom.private_form_action_async_callback_execution_record';
const privateFormActionRejectedErrorPreflightRecordType =
  'fast.react_dom.private_form_action_rejected_error_preflight_record';
const privateFormActionFormDataBlockerStatus =
  'private-form-action-formdata-blocker-metadata-only';
const privateFormActionSubmitDispatchStatus =
  'private-form-action-submit-dispatch-metadata-only';
const privateFormActionSubmitResetExecutionStatus =
  'private-form-action-submit-reset-execution-fake-form-only';
const privateFormActionCallbackActionPreflightStatus =
  'private-form-action-callback-action-preflight-metadata-only';
const privateFormActionAsyncCallbackExecutionStatus =
  'private-form-action-async-callback-execution-fake-callback-only';
const privateFormActionRejectedErrorPreflightStatus =
  'private-form-action-rejected-error-preflight-metadata-only';
const privateFormActionFormDataBlockerRecordedStatus =
  'recorded-private-form-action-formdata-blocker';
const privateFormActionSubmitDispatchRecordedStatus =
  'recorded-private-form-action-submit-dispatch-boundary';
const privateFormActionSubmitResetExecutionRecordedStatus =
  'executed-private-form-action-submit-reset-fake-form-path';
const privateFormActionCallbackActionPreflightRecordedStatus =
  'recorded-private-form-action-callback-action-preflight';
const privateFormActionAsyncCallbackExecutionRecordedStatus =
  'executed-private-form-action-async-callback-fake-path';
const privateFormActionRejectedErrorPreflightRecordedStatus =
  'recorded-private-form-action-rejected-error-preflight';
const privateFormActionFormDataBlockerGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_FORMDATA_BLOCKER_GATE';
const privateFormActionSubmitDispatchGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_SUBMIT_DISPATCH_GATE';
const privateFormActionSubmitResetExecutionGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_SUBMIT_RESET_EXECUTION_GATE';
const privateFormActionCallbackActionPreflightGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_CALLBACK_ACTION_PREFLIGHT_GATE';
const privateFormActionAsyncCallbackExecutionGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_ASYNC_CALLBACK_EXECUTION_GATE';
const privateFormActionRejectedErrorPreflightGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_REJECTED_ERROR_PREFLIGHT_GATE';
const privateFormActionFormDataBlockerInvalidAdmissionCode =
  'FAST_REACT_DOM_FORM_ACTION_FORMDATA_BLOCKER_INVALID_ADMISSION';
const privateFormActionSubmitDispatchInvalidAdmissionCode =
  'FAST_REACT_DOM_FORM_ACTION_SUBMIT_DISPATCH_INVALID_ADMISSION';
const privateFormActionSubmitResetExecutionInvalidAdmissionCode =
  'FAST_REACT_DOM_FORM_ACTION_SUBMIT_RESET_EXECUTION_INVALID_ADMISSION';
const privateFormActionCallbackActionPreflightInvalidAdmissionCode =
  'FAST_REACT_DOM_FORM_ACTION_CALLBACK_ACTION_PREFLIGHT_INVALID_ADMISSION';
const privateFormActionAsyncCallbackExecutionInvalidAdmissionCode =
  'FAST_REACT_DOM_FORM_ACTION_ASYNC_CALLBACK_EXECUTION_INVALID_ADMISSION';
const privateFormActionRejectedErrorPreflightInvalidAdmissionCode =
  'FAST_REACT_DOM_FORM_ACTION_REJECTED_ERROR_PREFLIGHT_INVALID_ADMISSION';
const privateFormActionFormDataBlockerInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_FORMDATA_BLOCKER_INVALID_RECORD';
const privateFormActionSubmitDispatchInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_SUBMIT_DISPATCH_INVALID_RECORD';
const privateFormActionSubmitResetExecutionInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_SUBMIT_RESET_EXECUTION_INVALID_RECORD';
const privateFormActionCallbackActionPreflightInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_CALLBACK_ACTION_PREFLIGHT_INVALID_RECORD';
const privateFormActionAsyncCallbackExecutionInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_ASYNC_CALLBACK_EXECUTION_INVALID_RECORD';
const privateFormActionRejectedErrorPreflightInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_REJECTED_ERROR_PREFLIGHT_INVALID_RECORD';
const formActionsOracleKind =
  'react-19.2.6-react-dom-form-actions-oracle';

const formActionFormDataBlockerRecordPayloads = new WeakMap();
const formActionSubmitDispatchRecordPayloads = new WeakMap();
const formActionSubmitResetExecutionRecordPayloads = new WeakMap();
const formActionCallbackActionPreflightRecordPayloads = new WeakMap();
const formActionAsyncCallbackExecutionRecordPayloads = new WeakMap();
const formActionRejectedErrorPreflightRecordPayloads = new WeakMap();

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

const blockedSubmitDispatchAdmissionFields = freezeArray([
  ...blockedRawAdmissionFields,
  'callback',
  'dispatchCallback',
  'submitCallback',
  'listener',
  'listeners',
  'dispatchQueue',
  'pendingState',
  'pendingStatus',
  'formInst',
  'targetInst',
  'nativeEventTarget',
  'startHost' + 'Transition'
]);

const blockedSubmitResetExecutionAdmissionFields = freezeArray([
  ...blockedSubmitDispatchAdmissionFields,
  'fakeForm',
  'reset',
  'resetCallback',
  'submitReset',
  'resetExecution',
  'resetEffect',
  'formResetCallback'
]);

const blockedCallbackActionPreflightAdmissionFields = freezeArray([
  ...blockedSubmitResetExecutionAdmissionFields,
  'callbackInvocation',
  'submitCallbackInvocation',
  'actionInvocation',
  'actionExecution',
  'formDataConstruction',
  'host' + 'Transition'
]);

const blockedAsyncCallbackExecutionAdmissionFields = freezeArray([
  ...blockedCallbackActionPreflightAdmissionFields,
  'asyncActionCallbackInvocation',
  'callbackResult',
  'callbackReturnValue',
  'thenable',
  'pendingThenable',
  'settledThenable',
  'publicDispatch',
  'publicDispatcher',
  'reactUpdate',
  'updateQueue'
]);

const blockedRejectedErrorPreflightAdmissionFields = freezeArray([
  ...blockedAsyncCallbackExecutionAdmissionFields,
  'asyncActionCallback',
  'callback',
  'error',
  'reason',
  'thrownValue',
  'rejectedThenable',
  'actionQueue',
  'actionNode',
  'errorBoundary',
  'boundaryFiber',
  'rootErrorCallback',
  'onCaughtError',
  'onUncaughtError',
  'onRecoverableError',
  'publicErrorRoute',
  'throwException',
  'createRootErrorUpdate'
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

const formActionSubmitDispatchBlockedSideEffects = freezeRecord({
  sourceFormDataBlockerAccepted: false,
  sourceEventExtractionAccepted: false,
  sourceResetQueueIntentAccepted: false,
  actionIdentityRecorded: false,
  dispatchQueueRowRecorded: false,
  resetQueueIntentLinked: false,
  rawTargetCaptured: false,
  rawEventCaptured: false,
  rawActionCaptured: false,
  rawSubmitControlCaptured: false,
  liveFormAccepted: false,
  nativeEventInspected: false,
  realFormInspected: false,
  submitControlInspected: false,
  unsupportedSubmitControlAccepted: false,
  formPropsRead: false,
  submitControlPropsRead: false,
  formDataConstructed: false,
  syntheticEventCreated: false,
  nativeDefaultPrevented: false,
  callbackDispatchExecuted: false,
  submitCallbackInvoked: false,
  actionFunctionCaptured: false,
  actionInvoked: false,
  hostTransitionStarted: false,
  previousDispatcherCalled: false,
  resetStateQueued: false,
  reactUpdateQueued: false,
  resetFormInstanceCalled: false,
  formResetCommitted: false,
  realFormReset: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const formActionSubmitDispatchDiagnosticSideEffects = freezeRecord({
  ...formActionSubmitDispatchBlockedSideEffects,
  sourceFormDataBlockerAccepted: true,
  sourceEventExtractionAccepted: true,
  sourceResetQueueIntentAccepted: true,
  actionIdentityRecorded: true,
  dispatchQueueRowRecorded: true,
  resetQueueIntentLinked: true
});

const formActionSubmitResetExecutionBlockedSideEffects = freezeRecord({
  sourceSubmitDispatchAccepted: false,
  sourceFormDataBlockerAccepted: false,
  sourceResetQueueIntentAccepted: false,
  acceptedMetadataIdsRecorded: false,
  fakeFormPathAccepted: false,
  blockedFormDataConsumed: false,
  resetIntentMetadataConsumed: false,
  fakeSubmitDispatchConsumed: false,
  fakeFormResetPathExecuted: false,
  fakeFormResetRecorded: false,
  rawTargetCaptured: false,
  rawEventCaptured: false,
  rawActionCaptured: false,
  rawSubmitControlCaptured: false,
  liveFormAccepted: false,
  nativeEventInspected: false,
  realFormInspected: false,
  submitControlInspected: false,
  formPropsRead: false,
  submitControlPropsRead: false,
  formDataConstructed: false,
  syntheticEventCreated: false,
  callbackDispatchExecuted: false,
  submitCallbackInvoked: false,
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

const formActionSubmitResetExecutionDiagnosticSideEffects = freezeRecord({
  ...formActionSubmitResetExecutionBlockedSideEffects,
  sourceSubmitDispatchAccepted: true,
  sourceFormDataBlockerAccepted: true,
  sourceResetQueueIntentAccepted: true,
  acceptedMetadataIdsRecorded: true,
  fakeFormPathAccepted: true,
  blockedFormDataConsumed: true,
  resetIntentMetadataConsumed: true,
  fakeSubmitDispatchConsumed: true,
  fakeFormResetPathExecuted: true,
  fakeFormResetRecorded: true
});

const formActionCallbackActionPreflightBlockedSideEffects = freezeRecord({
  sourceSubmitDispatchAccepted: false,
  sourceSubmitResetExecutionAccepted: false,
  acceptedMetadataIdsRecorded: false,
  submitDispatchMetadataConsumed: false,
  submitResetExecutionMetadataConsumed: false,
  callbackQueuePreflightRecorded: false,
  actionInvocationPreflightRecorded: false,
  rawTargetCaptured: false,
  rawEventCaptured: false,
  rawActionCaptured: false,
  rawSubmitControlCaptured: false,
  liveFormAccepted: false,
  nativeEventInspected: false,
  realFormInspected: false,
  submitControlInspected: false,
  formPropsRead: false,
  submitControlPropsRead: false,
  formDataConstructed: false,
  syntheticEventCreated: false,
  dispatchQueueCaptured: false,
  listenerDispatchStarted: false,
  callbackDispatchExecuted: false,
  submitCallbackInvoked: false,
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

const formActionCallbackActionPreflightDiagnosticSideEffects = freezeRecord({
  ...formActionCallbackActionPreflightBlockedSideEffects,
  sourceSubmitDispatchAccepted: true,
  sourceSubmitResetExecutionAccepted: true,
  acceptedMetadataIdsRecorded: true,
  submitDispatchMetadataConsumed: true,
  submitResetExecutionMetadataConsumed: true,
  callbackQueuePreflightRecorded: true,
  actionInvocationPreflightRecorded: true
});

const formActionAsyncCallbackExecutionBlockedSideEffects = freezeRecord({
  sourceCallbackActionPreflightAccepted: false,
  acceptedMetadataIdsRecorded: false,
  submitDispatchMetadataConsumed: false,
  submitResetExecutionMetadataConsumed: false,
  pendingStatusMetadataRecorded: false,
  resetMetadataConsumed: false,
  privateAsyncActionCallbackAccepted: false,
  privateAsyncActionCallbackInvoked: false,
  privateAsyncActionPayloadCreated: false,
  asyncCallbackThenableObserved: false,
  asyncCallbackThenableFulfilled: false,
  asyncCallbackThenableRejected: false,
  asyncCallbackNonThenableReturned: false,
  asyncCallbackSynchronousThrowCaptured: false,
  failClosedErrorRecorded: false,
  rawTargetCaptured: false,
  rawEventCaptured: false,
  rawActionCaptured: false,
  rawSubmitControlCaptured: false,
  liveFormAccepted: false,
  nativeEventInspected: false,
  realFormInspected: false,
  submitControlInspected: false,
  formPropsRead: false,
  submitControlPropsRead: false,
  formDataConstructed: false,
  syntheticEventCreated: false,
  dispatchQueueCaptured: false,
  listenerDispatchStarted: false,
  callbackDispatchExecuted: false,
  submitCallbackInvoked: false,
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

const formActionAsyncCallbackExecutionFulfilledSideEffects = freezeRecord({
  ...formActionAsyncCallbackExecutionBlockedSideEffects,
  sourceCallbackActionPreflightAccepted: true,
  acceptedMetadataIdsRecorded: true,
  submitDispatchMetadataConsumed: true,
  submitResetExecutionMetadataConsumed: true,
  pendingStatusMetadataRecorded: true,
  resetMetadataConsumed: true,
  privateAsyncActionCallbackAccepted: true,
  privateAsyncActionCallbackInvoked: true,
  privateAsyncActionPayloadCreated: true,
  asyncCallbackThenableObserved: true,
  asyncCallbackThenableFulfilled: true
});

const formActionAsyncCallbackExecutionRejectedSideEffects = freezeRecord({
  ...formActionAsyncCallbackExecutionFulfilledSideEffects,
  asyncCallbackThenableFulfilled: false,
  asyncCallbackThenableRejected: true,
  failClosedErrorRecorded: true
});

const formActionAsyncCallbackExecutionSynchronousThrowSideEffects =
  freezeRecord({
    ...formActionAsyncCallbackExecutionFulfilledSideEffects,
    asyncCallbackThenableObserved: false,
    asyncCallbackThenableFulfilled: false,
    asyncCallbackSynchronousThrowCaptured: true,
    failClosedErrorRecorded: true
  });

const formActionAsyncCallbackExecutionNonThenableSideEffects =
  freezeRecord({
    ...formActionAsyncCallbackExecutionFulfilledSideEffects,
    asyncCallbackThenableObserved: false,
    asyncCallbackThenableFulfilled: false,
    asyncCallbackNonThenableReturned: true,
    failClosedErrorRecorded: true
  });

const formActionRejectedErrorPreflightBlockedSideEffects = freezeRecord({
  sourceAsyncCallbackExecutionAccepted: false,
  sourceRejectedAsyncErrorAccepted: false,
  acceptedMetadataIdsRecorded: false,
  rejectedAsyncErrorMetadataRecorded: false,
  actionErrorPreflightRecorded: false,
  resetActionPublicBlockersRecorded: false,
  asyncCallbackThenableRejected: false,
  failClosedErrorConsumed: false,
  rawTargetCaptured: false,
  rawEventCaptured: false,
  rawActionCaptured: false,
  rawSubmitControlCaptured: false,
  rawErrorCaptured: false,
  liveFormAccepted: false,
  nativeEventInspected: false,
  realFormInspected: false,
  submitControlInspected: false,
  formPropsRead: false,
  submitControlPropsRead: false,
  formDataConstructed: false,
  syntheticEventCreated: false,
  dispatchQueueCaptured: false,
  listenerDispatchStarted: false,
  callbackDispatchExecuted: false,
  submitCallbackInvoked: false,
  privateAsyncActionCallbackInvoked: false,
  actionFunctionCaptured: false,
  actionInvoked: false,
  publicActionInvoked: false,
  publicErrorRoutingStarted: false,
  publicRootErrorCallbackInvoked: false,
  errorBoundaryScheduled: false,
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

const formActionRejectedErrorPreflightDiagnosticSideEffects =
  freezeRecord({
    ...formActionRejectedErrorPreflightBlockedSideEffects,
    sourceAsyncCallbackExecutionAccepted: true,
    sourceRejectedAsyncErrorAccepted: true,
    acceptedMetadataIdsRecorded: true,
    rejectedAsyncErrorMetadataRecorded: true,
    actionErrorPreflightRecorded: true,
    resetActionPublicBlockersRecorded: true,
    asyncCallbackThenableRejected: true,
    failClosedErrorConsumed: true
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

const formActionSubmitDispatchMissingPrerequisites = freezeArray([
  prerequisite(
    'no-live-form-submit-dispatch',
    'react-dom-events',
    'Submit dispatch diagnostics accept only private blocker metadata; no live form, event, or control is captured.'
  ),
  prerequisite(
    'no-unsupported-submit-control-dispatch',
    'react-dom-events',
    'Submit controls must already be classified as button, input, or none before dispatch metadata can be recorded.'
  ),
  prerequisite(
    'no-submit-listener-execution',
    'react-dom-events',
    'The submit dispatch callback row remains blocked and is not invoked.'
  ),
  prerequisite(
    'no-action-function-invocation',
    'react-dom-form',
    'Action function capture and invocation remain blocked after dispatch metadata is accepted.'
  ),
  prerequisite(
    'no-reset-queue-execution',
    'react-dom-form',
    'Reset queue intent is linked as metadata only; no reset update or commit is executed.'
  ),
  prerequisite(
    'no-public-form-action-compatibility',
    'react-dom-client',
    'Public form action compatibility remains unclaimed.'
  )
]);

const formActionSubmitResetExecutionMissingPrerequisites = freezeArray([
  prerequisite(
    'no-live-form-reset-execution',
    'react-dom-form',
    'Submit reset execution accepts one deterministic fake form path only; no live form is captured or reset.'
  ),
  prerequisite(
    'no-client-formdata-construction',
    'react-dom-form',
    'The fake path consumes the accepted data blocker metadata without constructing client form data.'
  ),
  prerequisite(
    'no-submit-listener-execution',
    'react-dom-events',
    'The submit callback row remains blocked and no listener is invoked.'
  ),
  prerequisite(
    'no-action-function-invocation',
    'react-dom-form',
    'The fake path records action identity but does not capture or invoke an action function.'
  ),
  prerequisite(
    'no-reset-queue-execution',
    'react-dom-form',
    'Reset intent metadata is consumed without resolving fibers, queuing React updates, or committing form resets.'
  ),
  prerequisite(
    'no-public-form-action-compatibility',
    'react-dom-client',
    'Public form action compatibility remains unclaimed.'
  )
]);

const formActionCallbackActionPreflightMissingPrerequisites = freezeArray([
  prerequisite(
    'no-synthetic-submit-event-construction',
    'react-dom-events',
    'Callback/action preflight consumes submit dispatch metadata without creating a SyntheticEvent or dispatch queue.'
  ),
  prerequisite(
    'no-submit-listener-execution',
    'react-dom-events',
    'Submit callback metadata is preflighted without invoking listeners or callbacks.'
  ),
  prerequisite(
    'no-client-formdata-construction',
    'react-dom-form',
    'Accepted blocker metadata remains consumed without constructing client form data.'
  ),
  prerequisite(
    'no-action-function-invocation',
    'react-dom-form',
    'Action identity metadata is preflighted without capturing or invoking the action function.'
  ),
  prerequisite(
    'no-host-transition-execution',
    'react-dom-form',
    'Host transition start remains blocked while action invocation metadata is preflighted.'
  ),
  prerequisite(
    'no-real-form-reset-execution',
    'react-dom-form',
    'The preflight consumes the accepted fake reset metadata without executing a live form reset.'
  ),
  prerequisite(
    'no-public-form-action-compatibility',
    'react-dom-client',
    'Public form action compatibility remains unclaimed.'
  )
]);

const formActionAsyncCallbackExecutionMissingPrerequisites = freezeArray([
  prerequisite(
    'private-fake-callback-only',
    'react-dom-form',
    'Async action callback execution is admitted only through a private fake payload, not through public submit dispatch.'
  ),
  prerequisite(
    'no-client-formdata-construction',
    'react-dom-form',
    'Pending status metadata consumes the blocked form data rows without constructing client form data.'
  ),
  prerequisite(
    'no-host-transition-execution',
    'react-dom-form',
    'The fake callback path records pending status metadata without starting host transitions.'
  ),
  prerequisite(
    'no-react-update-or-reset-commit',
    'react-dom-form',
    'Reset metadata is consumed without queuing React updates or committing form resets.'
  ),
  prerequisite(
    'fail-closed-callback-errors',
    'react-dom-form',
    'Rejected, throwing, or non-thenable private callbacks record fail-closed metadata instead of public error routing.'
  ),
  prerequisite(
    'no-public-form-action-compatibility',
    'react-dom-client',
    'Public form action compatibility remains unclaimed.'
  )
]);

const formActionRejectedErrorPreflightMissingPrerequisites = freezeArray([
  prerequisite(
    'rejected-private-async-callback-only',
    'react-dom-form',
    'Rejected form action error preflight consumes only an accepted private fake async callback rejection.'
  ),
  prerequisite(
    'no-public-error-routing',
    'react-dom-client',
    'Rejected action errors are recorded as metadata without scheduling root error updates or invoking public error callbacks.'
  ),
  prerequisite(
    'no-action-function-invocation',
    'react-dom-form',
    'Action invocation remains blocked while rejected action error metadata is preflighted.'
  ),
  prerequisite(
    'no-react-update-or-reset-commit',
    'react-dom-form',
    'Reset metadata remains blocked; no React updates, reset commits, or live form resets are performed.'
  ),
  prerequisite(
    'no-public-form-action-compatibility',
    'react-dom-client',
    'Public form action compatibility remains unclaimed.'
  )
]);

const defaultFormActionFormDataBlockerGate =
  createFormActionFormDataBlockerDiagnosticGate();
const defaultFormActionSubmitDispatchGate =
  createFormActionSubmitDispatchDiagnosticGate();
const defaultFormActionSubmitResetExecutionGate =
  createFormActionSubmitResetExecutionDiagnosticGate();
const defaultFormActionCallbackActionPreflightGate =
  createFormActionCallbackActionPreflightDiagnosticGate();
const defaultFormActionAsyncCallbackExecutionGate =
  createFormActionAsyncCallbackExecutionDiagnosticGate();
const defaultFormActionRejectedErrorPreflightGate =
  createFormActionRejectedErrorPreflightDiagnosticGate();

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

function createFormActionSubmitDispatchDiagnosticGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'form-action-submit-dispatch'
  );

  return Object.freeze({
    recordSubmitDispatchDiagnostic(formDataBlockerRecord, admission) {
      return recordFormActionSubmitDispatchWithGate(
        gateState,
        formDataBlockerRecord,
        admission
      );
    }
  });
}

function createFormActionSubmitResetExecutionDiagnosticGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'form-action-submit-reset-execution'
  );
  gateState.fakeFormPathConsumed = false;

  return Object.freeze({
    recordSubmitResetExecution(submitDispatchRecord, admission) {
      return recordFormActionSubmitResetExecutionWithGate(
        gateState,
        submitDispatchRecord,
        admission
      );
    }
  });
}

function createFormActionCallbackActionPreflightDiagnosticGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'form-action-callback-action-preflight'
  );

  return Object.freeze({
    recordCallbackActionInvocationPreflight(
      submitDispatchRecord,
      submitResetExecutionRecord,
      admission
    ) {
      return recordFormActionCallbackActionPreflightWithGate(
        gateState,
        submitDispatchRecord,
        submitResetExecutionRecord,
        admission
      );
    }
  });
}

function createFormActionAsyncCallbackExecutionDiagnosticGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'form-action-async-callback-execution'
  );

  return Object.freeze({
    async recordAsyncCallbackExecution(preflightRecord, admission) {
      return recordFormActionAsyncCallbackExecutionWithGate(
        gateState,
        preflightRecord,
        admission
      );
    }
  });
}

function createFormActionRejectedErrorPreflightDiagnosticGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'form-action-rejected-error-preflight'
  );
  gateState.consumedRejectedExecutions = new WeakSet();

  return Object.freeze({
    recordRejectedErrorPreflight(asyncCallbackExecutionRecord, admission) {
      return recordFormActionRejectedErrorPreflightWithGate(
        gateState,
        asyncCallbackExecutionRecord,
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

function recordFormActionSubmitDispatchDiagnostic(
  formDataBlockerRecord,
  admission
) {
  return defaultFormActionSubmitDispatchGate
    .recordSubmitDispatchDiagnostic(formDataBlockerRecord, admission);
}

function recordFormActionSubmitResetExecution(
  submitDispatchRecord,
  admission
) {
  return defaultFormActionSubmitResetExecutionGate
    .recordSubmitResetExecution(submitDispatchRecord, admission);
}

function recordFormActionCallbackActionInvocationPreflight(
  submitDispatchRecord,
  submitResetExecutionRecord,
  admission
) {
  return defaultFormActionCallbackActionPreflightGate
    .recordCallbackActionInvocationPreflight(
      submitDispatchRecord,
      submitResetExecutionRecord,
      admission
    );
}

async function recordFormActionAsyncCallbackExecution(
  preflightRecord,
  admission
) {
  return defaultFormActionAsyncCallbackExecutionGate
    .recordAsyncCallbackExecution(preflightRecord, admission);
}

function recordFormActionRejectedErrorPreflight(
  asyncCallbackExecutionRecord,
  admission
) {
  return defaultFormActionRejectedErrorPreflightGate
    .recordRejectedErrorPreflight(asyncCallbackExecutionRecord, admission);
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

function describePrivateFormActionSubmitDispatchGate() {
  return freezeRecord({
    schemaVersion: formActionSubmitDispatchGateSchemaVersion,
    gateId: privateFormActionSubmitDispatchGateId,
    compatibilityTarget,
    status: privateFormActionSubmitDispatchStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeRecord({
      oracleKind: formActionsOracleKind,
      schemaVersion: 1,
      compatibilityClaimed: false,
      fastReactComparedToReactDom: false,
      contractCount: 1
    }),
    acceptedFormDataBlockerRecordType:
      privateFormActionFormDataBlockerRecordType,
    acceptedFormDataBlockerGateId:
      privateFormActionFormDataBlockerGateId,
    acceptedFormDataBlockerStatus:
      privateFormActionFormDataBlockerRecordedStatus,
    acceptedEventExtractionRecordType:
      internalsGate.privateFormActionEventExtractionRecordType,
    acceptedResetQueueCommitRecordType:
      internalsGate.privateFormActionResetQueueCommitRecordType,
    recordsActionIdentity: true,
    recordsFormDataBlockerRows: true,
    recordsResetQueueIntent: true,
    recordsDispatchQueueRow: true,
    submitResetExecutionGateAvailable: true,
    rejectsLiveForms: true,
    rejectsUnsupportedSubmitControls: true,
    blocksCallbackDispatchExecution: true,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    readsFormProps: false,
    readsSubmitControlProps: false,
    constructsFormData: false,
    createsSyntheticEvents: false,
    dispatchesSubmitCallbacks: false,
    invokesActions: false,
    startsHostTransition: false,
    callsPreviousDispatchers: false,
    queuesReactUpdates: false,
    commitsFormResets: false,
    resetsForms: false,
    sideEffects: formActionSubmitDispatchBlockedSideEffects,
    missingPrerequisites: formActionSubmitDispatchMissingPrerequisites,
    formDataBlockerGate: describePrivateFormActionFormDataBlockerGate()
  });
}

function describePrivateFormActionSubmitResetExecutionGate() {
  return freezeRecord({
    schemaVersion: formActionSubmitResetExecutionGateSchemaVersion,
    gateId: privateFormActionSubmitResetExecutionGateId,
    compatibilityTarget,
    status: privateFormActionSubmitResetExecutionStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeRecord({
      oracleKind: formActionsOracleKind,
      schemaVersion: 1,
      compatibilityClaimed: false,
      fastReactComparedToReactDom: false,
      contractCount: 1
    }),
    acceptedSubmitDispatchRecordType:
      privateFormActionSubmitDispatchRecordType,
    acceptedSubmitDispatchGateId:
      privateFormActionSubmitDispatchGateId,
    acceptedSubmitDispatchStatus:
      privateFormActionSubmitDispatchRecordedStatus,
    acceptedFormDataBlockerRecordType:
      privateFormActionFormDataBlockerRecordType,
    acceptedResetOrderingKind:
      'action-completion-reset-before-action',
    recordsAcceptedMetadataIds: true,
    consumesBlockedFormDataMetadata: true,
    consumesResetIntentMetadata: true,
    executesDeterministicFakeFormResetPath: true,
    admitsExactlyOneFakeFormPath: true,
    callbackActionPreflightGateAvailable: true,
    rejectsLiveForms: true,
    rejectsCallbackExecution: true,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    readsFormProps: false,
    readsSubmitControlProps: false,
    constructsFormData: false,
    createsSyntheticEvents: false,
    dispatchesSubmitCallbacks: false,
    invokesActions: false,
    startsHostTransition: false,
    callsPreviousDispatchers: false,
    queuesReactUpdates: false,
    commitsFormResets: false,
    callsResetFormInstance: false,
    resetsForms: false,
    sideEffects: formActionSubmitResetExecutionBlockedSideEffects,
    missingPrerequisites: formActionSubmitResetExecutionMissingPrerequisites,
    submitDispatchGate: describePrivateFormActionSubmitDispatchGate()
  });
}

function describePrivateFormActionCallbackActionPreflightGate() {
  return freezeRecord({
    schemaVersion: formActionCallbackActionPreflightGateSchemaVersion,
    gateId: privateFormActionCallbackActionPreflightGateId,
    compatibilityTarget,
    status: privateFormActionCallbackActionPreflightStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeRecord({
      oracleKind: formActionsOracleKind,
      schemaVersion: 1,
      compatibilityClaimed: false,
      fastReactComparedToReactDom: false,
      contractCount: 1
    }),
    acceptedSubmitDispatchRecordType:
      privateFormActionSubmitDispatchRecordType,
    acceptedSubmitDispatchGateId:
      privateFormActionSubmitDispatchGateId,
    acceptedSubmitDispatchStatus:
      privateFormActionSubmitDispatchRecordedStatus,
    acceptedSubmitResetExecutionRecordType:
      privateFormActionSubmitResetExecutionRecordType,
    acceptedSubmitResetExecutionGateId:
      privateFormActionSubmitResetExecutionGateId,
    acceptedSubmitResetExecutionStatus:
      privateFormActionSubmitResetExecutionRecordedStatus,
    consumesSubmitDispatchMetadata: true,
    consumesSubmitResetExecutionMetadata: true,
    recordsAcceptedMetadataIds: true,
    recordsCallbackQueuePreflight: true,
    recordsActionInvocationPreflight: true,
    provesCallbacksRemainUninvoked: true,
    provesActionsRemainUninvoked: true,
    rejectsLiveForms: true,
    rejectsCallbackExecution: true,
    rejectsActionInvocation: true,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    readsFormProps: false,
    readsSubmitControlProps: false,
    constructsFormData: false,
    createsSyntheticEvents: false,
    dispatchesSubmitCallbacks: false,
    invokesActions: false,
    startsHostTransition: false,
    callsPreviousDispatchers: false,
    queuesReactUpdates: false,
    commitsFormResets: false,
    callsResetFormInstance: false,
    resetsForms: false,
    sideEffects: formActionCallbackActionPreflightBlockedSideEffects,
    missingPrerequisites:
      formActionCallbackActionPreflightMissingPrerequisites,
    submitDispatchGate: describePrivateFormActionSubmitDispatchGate(),
    submitResetExecutionGate:
      describePrivateFormActionSubmitResetExecutionGate()
  });
}

function describePrivateFormActionAsyncCallbackExecutionGate() {
  return freezeRecord({
    schemaVersion: formActionAsyncCallbackExecutionGateSchemaVersion,
    gateId: privateFormActionAsyncCallbackExecutionGateId,
    compatibilityTarget,
    status: privateFormActionAsyncCallbackExecutionStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeRecord({
      oracleKind: formActionsOracleKind,
      schemaVersion: 1,
      compatibilityClaimed: false,
      fastReactComparedToReactDom: false,
      contractCount: 1
    }),
    acceptedCallbackActionPreflightRecordType:
      privateFormActionCallbackActionPreflightRecordType,
    acceptedCallbackActionPreflightGateId:
      privateFormActionCallbackActionPreflightGateId,
    acceptedCallbackActionPreflightStatus:
      privateFormActionCallbackActionPreflightRecordedStatus,
    recordsAcceptedMetadataIds: true,
    consumesSubmitDispatchMetadata: true,
    consumesSubmitResetExecutionMetadata: true,
    recordsPendingStatusMetadata: true,
    recordsResetMetadata: true,
    admitsPrivateAsyncActionCallbacks: true,
    executesPrivateAsyncActionCallbacks: true,
    recordsFulfilledThenableMetadata: true,
    recordsRejectedThenableMetadata: true,
    recordsSynchronousThrowMetadata: true,
    recordsNonThenableFailClosedMetadata: true,
    failClosedErrorsRecorded: true,
    rejectsLiveForms: true,
    rejectsPublicDispatch: true,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    acceptsPrivateAsyncActionCallbacks: true,
    readsFormProps: false,
    readsSubmitControlProps: false,
    constructsFormData: false,
    createsSyntheticEvents: false,
    dispatchesSubmitCallbacks: false,
    invokesActions: false,
    invokesPrivateAsyncActionCallbacks: true,
    startsHostTransition: false,
    callsPreviousDispatchers: false,
    queuesReactUpdates: false,
    commitsFormResets: false,
    callsResetFormInstance: false,
    resetsForms: false,
    sideEffects: formActionAsyncCallbackExecutionBlockedSideEffects,
    missingPrerequisites:
      formActionAsyncCallbackExecutionMissingPrerequisites,
    callbackActionPreflightGate:
      describePrivateFormActionCallbackActionPreflightGate()
  });
}

function describePrivateFormActionRejectedErrorPreflightGate() {
  return freezeRecord({
    schemaVersion: formActionRejectedErrorPreflightGateSchemaVersion,
    gateId: privateFormActionRejectedErrorPreflightGateId,
    compatibilityTarget,
    status: privateFormActionRejectedErrorPreflightStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeRecord({
      oracleKind: formActionsOracleKind,
      schemaVersion: 1,
      compatibilityClaimed: false,
      fastReactComparedToReactDom: false,
      contractCount: 1
    }),
    acceptedAsyncCallbackExecutionRecordType:
      privateFormActionAsyncCallbackExecutionRecordType,
    acceptedAsyncCallbackExecutionGateId:
      privateFormActionAsyncCallbackExecutionGateId,
    acceptedAsyncCallbackExecutionStatus:
      privateFormActionAsyncCallbackExecutionRecordedStatus,
    acceptedRejectedCallbackStatus:
      'failed-private-form-action-async-callback-rejected',
    recordsAcceptedMetadataIds: true,
    consumesRejectedAsyncActionErrorMetadata: true,
    recordsActionErrorPreflight: true,
    recordsResetActionPublicBlockers: true,
    preflightOnly: true,
    rejectsFulfilledAsyncCallbacks: true,
    rejectsStaleRejections: true,
    rejectsForeignRejections: true,
    rejectsMalformedRejections: true,
    rejectsLiveForms: true,
    rejectsPublicDispatch: true,
    rejectsPublicErrorRouting: true,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    acceptsPrivateAsyncActionCallbacks: false,
    readsFormProps: false,
    readsSubmitControlProps: false,
    constructsFormData: false,
    createsSyntheticEvents: false,
    dispatchesSubmitCallbacks: false,
    invokesActions: false,
    invokesPrivateAsyncActionCallbacks: false,
    routesErrors: false,
    startsHostTransition: false,
    callsPreviousDispatchers: false,
    queuesReactUpdates: false,
    commitsFormResets: false,
    callsResetFormInstance: false,
    resetsForms: false,
    publicFormSubmissionEnabled: false,
    publicFormActionCompatibilityClaimed: false,
    sideEffects: formActionRejectedErrorPreflightBlockedSideEffects,
    missingPrerequisites:
      formActionRejectedErrorPreflightMissingPrerequisites,
    asyncCallbackExecutionGate:
      describePrivateFormActionAsyncCallbackExecutionGate()
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

function createUnsupportedFormActionSubmitDispatchError(record) {
  const payload = assertPrivateFormActionSubmitDispatchRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private form action submit dispatch gate records identity and blocker metadata only.'
  );

  error.code = privateFormActionSubmitDispatchGateErrorCode;
  error.dispatchId = payload.dispatchId;
  error.dispatchSequence = payload.dispatchSequence;
  error.requestType = payload.requestType;
  error.status = payload.status;
  error.actionIdentity = payload.actionIdentity;
  error.formDataBlockerLink = payload.formDataBlockerLink;
  error.resetQueueIntentLink = payload.resetQueueIntentLink;
  error.submitDispatchQueue = payload.submitDispatchQueue;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedFormActionSubmitResetExecutionError(record) {
  const payload = assertPrivateFormActionSubmitResetExecutionRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private form action submit reset execution gate records one fake form path only.'
  );

  error.code = privateFormActionSubmitResetExecutionGateErrorCode;
  error.executionId = payload.executionId;
  error.executionSequence = payload.executionSequence;
  error.requestType = payload.requestType;
  error.status = payload.status;
  error.sourceSubmitDispatchId = payload.sourceSubmitDispatchId;
  error.formDataBlockerConsumption =
    payload.formDataBlockerConsumption;
  error.resetIntentConsumption = payload.resetIntentConsumption;
  error.fakeFormResetExecution = payload.fakeFormResetExecution;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedFormActionCallbackActionPreflightError(record) {
  const payload =
    assertPrivateFormActionCallbackActionPreflightRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private form action callback/action invocation preflight records metadata only.'
  );

  error.code = privateFormActionCallbackActionPreflightGateErrorCode;
  error.preflightId = payload.preflightId;
  error.preflightSequence = payload.preflightSequence;
  error.requestType = payload.requestType;
  error.status = payload.status;
  error.sourceSubmitDispatchId = payload.sourceSubmitDispatchId;
  error.sourceSubmitResetExecutionId =
    payload.sourceSubmitResetExecutionId;
  error.callbackDispatchPreflight = payload.callbackDispatchPreflight;
  error.actionInvocationPreflight = payload.actionInvocationPreflight;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedFormActionAsyncCallbackExecutionError(record) {
  const payload =
    assertPrivateFormActionAsyncCallbackExecutionRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private form action async callback execution gate records fake callback metadata only.'
  );

  error.code = privateFormActionAsyncCallbackExecutionGateErrorCode;
  error.executionId = payload.executionId;
  error.executionSequence = payload.executionSequence;
  error.requestType = payload.requestType;
  error.status = payload.status;
  error.sourceCallbackActionPreflightId =
    payload.sourceCallbackActionPreflightId;
  error.pendingStatusMetadata = payload.pendingStatusMetadata;
  error.resetMetadata = payload.resetMetadata;
  error.callbackExecution = payload.callbackExecution;
  error.publicFormActionBoundary = payload.publicFormActionBoundary;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedFormActionRejectedErrorPreflightError(record) {
  const payload =
    assertPrivateFormActionRejectedErrorPreflightRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private form action rejected-error preflight records rejected action error metadata only.'
  );

  error.code = privateFormActionRejectedErrorPreflightGateErrorCode;
  error.preflightId = payload.preflightId;
  error.preflightSequence = payload.preflightSequence;
  error.requestType = payload.requestType;
  error.status = payload.status;
  error.sourceAsyncCallbackExecutionId =
    payload.sourceAsyncCallbackExecutionId;
  error.rejectedAsyncActionError =
    payload.rejectedAsyncActionError;
  error.actionErrorPreflight = payload.actionErrorPreflight;
  error.resetActionPublicBlockers =
    payload.resetActionPublicBlockers;
  error.publicFormActionBoundary = payload.publicFormActionBoundary;
  error.sideEffects = payload.sideEffects;

  return error;
}

function getPrivateFormActionFormDataBlockerRecordPayload(record) {
  return formActionFormDataBlockerRecordPayloads.get(record) || null;
}

function getPrivateFormActionSubmitDispatchRecordPayload(record) {
  return formActionSubmitDispatchRecordPayloads.get(record) || null;
}

function getPrivateFormActionSubmitResetExecutionRecordPayload(record) {
  return formActionSubmitResetExecutionRecordPayloads.get(record) || null;
}

function getPrivateFormActionCallbackActionPreflightRecordPayload(record) {
  return formActionCallbackActionPreflightRecordPayloads.get(record) || null;
}

function getPrivateFormActionAsyncCallbackExecutionRecordPayload(record) {
  return formActionAsyncCallbackExecutionRecordPayloads.get(record) || null;
}

function getPrivateFormActionRejectedErrorPreflightRecordPayload(record) {
  return formActionRejectedErrorPreflightRecordPayloads.get(record) || null;
}

function isPrivateFormActionFormDataBlockerRecord(value) {
  return formActionFormDataBlockerRecordPayloads.has(value);
}

function isPrivateFormActionSubmitDispatchRecord(value) {
  return formActionSubmitDispatchRecordPayloads.has(value);
}

function isPrivateFormActionSubmitResetExecutionRecord(value) {
  return formActionSubmitResetExecutionRecordPayloads.has(value);
}

function isPrivateFormActionCallbackActionPreflightRecord(value) {
  return formActionCallbackActionPreflightRecordPayloads.has(value);
}

function isPrivateFormActionAsyncCallbackExecutionRecord(value) {
  return formActionAsyncCallbackExecutionRecordPayloads.has(value);
}

function isPrivateFormActionRejectedErrorPreflightRecord(value) {
  return formActionRejectedErrorPreflightRecordPayloads.has(value);
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

function recordFormActionSubmitDispatchWithGate(
  gateState,
  formDataBlockerRecord,
  admission
) {
  const blocker =
    assertAcceptedFormActionFormDataBlockerRecord(formDataBlockerRecord);
  const normalizedAdmission =
    normalizeFormActionSubmitDispatchAdmission(blocker, admission);
  const dispatchSequence = gateState.nextRequestSequence++;
  const dispatchId = `${gateState.requestIdPrefix}:${dispatchSequence}`;
  const actionIdentity = createSubmitActionIdentity(blocker);
  const formDataBlockerLink = createFormDataBlockerLink(blocker);
  const resetQueueIntentLink = createResetQueueIntentLink(blocker);
  const submitDispatchQueue = createSubmitDispatchQueueBoundary(
    blocker,
    actionIdentity
  );

  const payload = freezeRecord({
    schemaVersion: formActionSubmitDispatchGateSchemaVersion,
    $$typeof: privateFormActionSubmitDispatchRecordType,
    kind: 'FastReactDomPrivateFormActionSubmitDispatchRecord',
    gateId: privateFormActionSubmitDispatchGateId,
    compatibilityTarget,
    status: privateFormActionSubmitDispatchRecordedStatus,
    unsupportedCode: unimplementedCode,
    dispatchId,
    dispatchSequence,
    requestType: 'form-action-submit-dispatch.diagnostic',
    contractId: 'form-action-submit-dispatch',
    oracleKind: formActionsOracleKind,
    oracleSchemaVersion: 1,
    sourceFormDataBlockerId: blocker.blockerId,
    sourceFormDataBlockerSequence: blocker.blockerSequence,
    sourceEventExtractionId: blocker.sourceEventExtractionId,
    sourceEventExtractionSequence: blocker.sourceEventExtractionSequence,
    sourceSubmissionRequestId: blocker.sourceSubmissionRequestId,
    sourceSubmissionRequestSequence: blocker.sourceSubmissionRequestSequence,
    sourceResetQueueCommitRequestId:
      blocker.sourceResetQueueCommitRequestId,
    sourceResetQueueCommitRequestSequence:
      blocker.sourceResetQueueCommitRequestSequence,
    sourceResetIntentRequestId: blocker.sourceResetIntentRequestId,
    sourceResetIntentRequestSequence:
      blocker.sourceResetIntentRequestSequence,
    admission: normalizedAdmission,
    acceptedMetadataIds: blocker.acceptedMetadataIds,
    actionIdentity,
    formDataBlockerLink,
    resetQueueIntentLink,
    submitDispatchQueue,
    publicFormActionBoundary:
      createPublicFormActionSubmitDispatchBoundary(),
    sideEffects: formActionSubmitDispatchDiagnosticSideEffects,
    missingPrerequisites: formActionSubmitDispatchMissingPrerequisites
  });

  formActionSubmitDispatchRecordPayloads.set(payload, payload);
  return payload;
}

function recordFormActionSubmitResetExecutionWithGate(
  gateState,
  submitDispatchRecord,
  admission
) {
  if (gateState.fakeFormPathConsumed === true) {
    throwInvalidSubmitResetExecutionAdmission(
      'fake form reset execution gate admits exactly one fake form path'
    );
  }

  const submitDispatch =
    assertAcceptedFormActionSubmitDispatchRecordForResetExecution(
      submitDispatchRecord
    );
  const normalizedAdmission =
    normalizeFormActionSubmitResetExecutionAdmission(
      submitDispatch,
      admission
    );
  const executionSequence = gateState.nextRequestSequence++;
  const executionId = `${gateState.requestIdPrefix}:${executionSequence}`;
  const formDataBlockerConsumption =
    createSubmitResetFormDataBlockerConsumption(submitDispatch);
  const resetIntentConsumption =
    createSubmitResetIntentConsumption(submitDispatch);
  const fakeFormResetExecution = createFakeFormResetExecution(
    submitDispatch,
    normalizedAdmission,
    formDataBlockerConsumption,
    resetIntentConsumption
  );
  gateState.fakeFormPathConsumed = true;

  const payload = freezeRecord({
    schemaVersion: formActionSubmitResetExecutionGateSchemaVersion,
    $$typeof: privateFormActionSubmitResetExecutionRecordType,
    kind: 'FastReactDomPrivateFormActionSubmitResetExecutionRecord',
    gateId: privateFormActionSubmitResetExecutionGateId,
    compatibilityTarget,
    status: privateFormActionSubmitResetExecutionRecordedStatus,
    unsupportedCode: unimplementedCode,
    executionId,
    executionSequence,
    requestType: 'form-action-submit-reset-execution.fake-form',
    contractId: 'form-action-submit-reset-fake-form-path',
    oracleKind: formActionsOracleKind,
    oracleSchemaVersion: 1,
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceSubmitDispatchSequence: submitDispatch.dispatchSequence,
    sourceSubmitDispatchStatus: submitDispatch.status,
    sourceFormDataBlockerId: submitDispatch.sourceFormDataBlockerId,
    sourceFormDataBlockerSequence:
      submitDispatch.sourceFormDataBlockerSequence,
    sourceEventExtractionId: submitDispatch.sourceEventExtractionId,
    sourceEventExtractionSequence:
      submitDispatch.sourceEventExtractionSequence,
    sourceResetQueueCommitRequestId:
      submitDispatch.sourceResetQueueCommitRequestId,
    sourceResetQueueCommitRequestSequence:
      submitDispatch.sourceResetQueueCommitRequestSequence,
    sourceResetIntentRequestId:
      submitDispatch.sourceResetIntentRequestId,
    sourceResetIntentRequestSequence:
      submitDispatch.sourceResetIntentRequestSequence,
    acceptedMetadataIds: submitDispatch.acceptedMetadataIds,
    admission: normalizedAdmission,
    sourceSubmitDispatch:
      createSubmitResetSourceSubmitDispatch(submitDispatch),
    formDataBlockerConsumption,
    resetIntentConsumption,
    fakeFormResetExecution,
    publicFormActionBoundary:
      createPublicFormActionSubmitResetExecutionBoundary(),
    sideEffects: formActionSubmitResetExecutionDiagnosticSideEffects,
    missingPrerequisites:
      formActionSubmitResetExecutionMissingPrerequisites
  });

  formActionSubmitResetExecutionRecordPayloads.set(payload, payload);
  return payload;
}

function recordFormActionCallbackActionPreflightWithGate(
  gateState,
  submitDispatchRecord,
  submitResetExecutionRecord,
  admission
) {
  const submitDispatch =
    assertAcceptedFormActionSubmitDispatchRecordForCallbackActionPreflight(
      submitDispatchRecord
    );
  const submitResetExecution =
    assertAcceptedFormActionSubmitResetExecutionRecordForCallbackActionPreflight(
      submitResetExecutionRecord,
      submitDispatch
    );
  const normalizedAdmission =
    normalizeFormActionCallbackActionPreflightAdmission(
      submitDispatch,
      submitResetExecution,
      admission
    );
  const preflightSequence = gateState.nextRequestSequence++;
  const preflightId = `${gateState.requestIdPrefix}:${preflightSequence}`;
  const acceptedMetadataIds =
    createCallbackActionAcceptedMetadataIds(
      submitDispatch,
      submitResetExecution
    );
  const submitDispatchMetadataConsumption =
    createCallbackActionSubmitDispatchConsumption(submitDispatch);
  const submitResetExecutionMetadataConsumption =
    createCallbackActionResetExecutionConsumption(submitResetExecution);
  const callbackDispatchPreflight =
    createCallbackDispatchPreflight(
      submitDispatch,
      submitResetExecution,
      normalizedAdmission
    );
  const actionInvocationPreflight =
    createActionInvocationPreflight(
      submitDispatch,
      submitResetExecution,
      normalizedAdmission
    );

  const payload = freezeRecord({
    schemaVersion: formActionCallbackActionPreflightGateSchemaVersion,
    $$typeof: privateFormActionCallbackActionPreflightRecordType,
    kind: 'FastReactDomPrivateFormActionCallbackActionPreflightRecord',
    gateId: privateFormActionCallbackActionPreflightGateId,
    compatibilityTarget,
    status: privateFormActionCallbackActionPreflightRecordedStatus,
    unsupportedCode: unimplementedCode,
    preflightId,
    preflightSequence,
    requestType: 'form-action-callback-action-preflight.diagnostic',
    contractId: 'form-action-callback-action-invocation-preflight',
    oracleKind: formActionsOracleKind,
    oracleSchemaVersion: 1,
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceSubmitDispatchSequence: submitDispatch.dispatchSequence,
    sourceSubmitDispatchStatus: submitDispatch.status,
    sourceSubmitResetExecutionId: submitResetExecution.executionId,
    sourceSubmitResetExecutionSequence:
      submitResetExecution.executionSequence,
    sourceSubmitResetExecutionStatus: submitResetExecution.status,
    sourceFormDataBlockerId: submitDispatch.sourceFormDataBlockerId,
    sourceFormDataBlockerSequence:
      submitDispatch.sourceFormDataBlockerSequence,
    sourceEventExtractionId: submitDispatch.sourceEventExtractionId,
    sourceEventExtractionSequence:
      submitDispatch.sourceEventExtractionSequence,
    sourceResetQueueCommitRequestId:
      submitDispatch.sourceResetQueueCommitRequestId,
    sourceResetQueueCommitRequestSequence:
      submitDispatch.sourceResetQueueCommitRequestSequence,
    sourceResetIntentRequestId:
      submitDispatch.sourceResetIntentRequestId,
    sourceResetIntentRequestSequence:
      submitDispatch.sourceResetIntentRequestSequence,
    acceptedMetadataIds,
    admission: normalizedAdmission,
    sourceSubmitDispatch:
      createCallbackActionSourceSubmitDispatch(submitDispatch),
    sourceSubmitResetExecution:
      createCallbackActionSourceSubmitResetExecution(
        submitResetExecution
      ),
    submitDispatchMetadataConsumption,
    submitResetExecutionMetadataConsumption,
    callbackDispatchPreflight,
    actionInvocationPreflight,
    publicFormActionBoundary:
      createPublicFormActionCallbackActionPreflightBoundary(),
    sideEffects: formActionCallbackActionPreflightDiagnosticSideEffects,
    missingPrerequisites:
      formActionCallbackActionPreflightMissingPrerequisites
  });

  formActionCallbackActionPreflightRecordPayloads.set(payload, payload);
  return payload;
}

async function recordFormActionAsyncCallbackExecutionWithGate(
  gateState,
  preflightRecord,
  admission
) {
  const preflight =
    assertAcceptedFormActionCallbackActionPreflightRecordForAsyncCallbackExecution(
      preflightRecord
    );
  const normalized =
    normalizeFormActionAsyncCallbackExecutionAdmission(
      preflight,
      admission
    );
  const executionSequence = gateState.nextRequestSequence++;
  const executionId = `${gateState.requestIdPrefix}:${executionSequence}`;
  const acceptedMetadataIds =
    createAsyncCallbackAcceptedMetadataIds(preflight);
  const submitDispatchMetadataConsumption =
    createAsyncCallbackSubmitDispatchConsumption(preflight);
  const submitResetExecutionMetadataConsumption =
    createAsyncCallbackResetExecutionConsumption(preflight);
  const pendingStatusMetadata =
    createAsyncCallbackPendingStatusMetadata(
      preflight,
      normalized.admission
    );
  const resetMetadata =
    createAsyncCallbackResetMetadata(preflight);
  const privateCallbackPayload =
    createAsyncCallbackPrivatePayload(
      preflight,
      executionId,
      normalized.admission,
      pendingStatusMetadata,
      resetMetadata
    );
  const callbackOutcome =
    await invokePrivateAsyncActionCallback(
      normalized.callback,
      privateCallbackPayload
    );
  const callbackExecution =
    createAsyncCallbackExecution(
      preflight,
      normalized.admission,
      privateCallbackPayload,
      callbackOutcome
    );
  const sideEffects =
    createAsyncCallbackExecutionSideEffects(callbackOutcome);

  const payload = freezeRecord({
    schemaVersion: formActionAsyncCallbackExecutionGateSchemaVersion,
    $$typeof: privateFormActionAsyncCallbackExecutionRecordType,
    kind: 'FastReactDomPrivateFormActionAsyncCallbackExecutionRecord',
    gateId: privateFormActionAsyncCallbackExecutionGateId,
    compatibilityTarget,
    status: privateFormActionAsyncCallbackExecutionRecordedStatus,
    unsupportedCode: unimplementedCode,
    executionId,
    executionSequence,
    requestType: 'form-action-async-callback-execution.fake-callback',
    contractId: 'form-action-async-callback-fake-execution',
    oracleKind: formActionsOracleKind,
    oracleSchemaVersion: 1,
    sourceCallbackActionPreflightId: preflight.preflightId,
    sourceCallbackActionPreflightSequence: preflight.preflightSequence,
    sourceCallbackActionPreflightStatus: preflight.status,
    sourceSubmitDispatchId: preflight.sourceSubmitDispatchId,
    sourceSubmitDispatchSequence: preflight.sourceSubmitDispatchSequence,
    sourceSubmitResetExecutionId:
      preflight.sourceSubmitResetExecutionId,
    sourceSubmitResetExecutionSequence:
      preflight.sourceSubmitResetExecutionSequence,
    sourceFormDataBlockerId: preflight.sourceFormDataBlockerId,
    sourceFormDataBlockerSequence:
      preflight.sourceFormDataBlockerSequence,
    sourceEventExtractionId: preflight.sourceEventExtractionId,
    sourceEventExtractionSequence:
      preflight.sourceEventExtractionSequence,
    sourceResetQueueCommitRequestId:
      preflight.sourceResetQueueCommitRequestId,
    sourceResetQueueCommitRequestSequence:
      preflight.sourceResetQueueCommitRequestSequence,
    sourceResetIntentRequestId:
      preflight.sourceResetIntentRequestId,
    sourceResetIntentRequestSequence:
      preflight.sourceResetIntentRequestSequence,
    acceptedMetadataIds,
    admission: normalized.admission,
    sourceCallbackActionPreflight:
      createAsyncCallbackSourcePreflight(preflight),
    submitDispatchMetadataConsumption,
    submitResetExecutionMetadataConsumption,
    pendingStatusMetadata,
    resetMetadata,
    privateCallbackPayload,
    callbackExecution,
    publicFormActionBoundary:
      createPublicFormActionAsyncCallbackExecutionBoundary(),
    sideEffects,
    missingPrerequisites:
      formActionAsyncCallbackExecutionMissingPrerequisites
  });

  formActionAsyncCallbackExecutionRecordPayloads.set(payload, payload);
  return payload;
}

function recordFormActionRejectedErrorPreflightWithGate(
  gateState,
  asyncCallbackExecutionRecord,
  admission
) {
  const asyncExecution =
    assertAcceptedFormActionAsyncCallbackExecutionRecordForRejectedErrorPreflight(
      asyncCallbackExecutionRecord
    );

  if (
    gateState.consumedRejectedExecutions.has(asyncCallbackExecutionRecord)
  ) {
    throwInvalidRejectedErrorPreflightRecord(
      'source rejected async callback execution was already consumed by this preflight gate'
    );
  }

  const normalizedAdmission =
    normalizeFormActionRejectedErrorPreflightAdmission(
      asyncExecution,
      admission
    );
  const preflightSequence = gateState.nextRequestSequence++;
  const preflightId = `${gateState.requestIdPrefix}:${preflightSequence}`;
  const acceptedMetadataIds =
    createRejectedErrorPreflightAcceptedMetadataIds(asyncExecution);
  const rejectedAsyncActionError =
    createRejectedAsyncActionErrorMetadata(
      asyncExecution,
      normalizedAdmission
    );
  const actionErrorPreflight =
    createRejectedActionErrorPreflight(
      asyncExecution,
      normalizedAdmission,
      rejectedAsyncActionError
    );
  const resetActionPublicBlockers =
    createRejectedErrorResetActionPublicBlockers(asyncExecution);

  gateState.consumedRejectedExecutions.add(asyncCallbackExecutionRecord);

  const payload = freezeRecord({
    schemaVersion: formActionRejectedErrorPreflightGateSchemaVersion,
    $$typeof: privateFormActionRejectedErrorPreflightRecordType,
    kind: 'FastReactDomPrivateFormActionRejectedErrorPreflightRecord',
    gateId: privateFormActionRejectedErrorPreflightGateId,
    compatibilityTarget,
    status: privateFormActionRejectedErrorPreflightRecordedStatus,
    unsupportedCode: unimplementedCode,
    preflightId,
    preflightSequence,
    requestType: 'form-action-rejected-error-preflight.diagnostic',
    contractId: 'form-action-rejected-error-preflight',
    oracleKind: formActionsOracleKind,
    oracleSchemaVersion: 1,
    sourceAsyncCallbackExecutionId: asyncExecution.executionId,
    sourceAsyncCallbackExecutionSequence:
      asyncExecution.executionSequence,
    sourceAsyncCallbackExecutionStatus: asyncExecution.status,
    sourceCallbackActionPreflightId:
      asyncExecution.sourceCallbackActionPreflightId,
    sourceCallbackActionPreflightSequence:
      asyncExecution.sourceCallbackActionPreflightSequence,
    sourceSubmitDispatchId: asyncExecution.sourceSubmitDispatchId,
    sourceSubmitDispatchSequence:
      asyncExecution.sourceSubmitDispatchSequence,
    sourceSubmitResetExecutionId:
      asyncExecution.sourceSubmitResetExecutionId,
    sourceSubmitResetExecutionSequence:
      asyncExecution.sourceSubmitResetExecutionSequence,
    sourceFormDataBlockerId: asyncExecution.sourceFormDataBlockerId,
    sourceFormDataBlockerSequence:
      asyncExecution.sourceFormDataBlockerSequence,
    sourceEventExtractionId: asyncExecution.sourceEventExtractionId,
    sourceEventExtractionSequence:
      asyncExecution.sourceEventExtractionSequence,
    sourceResetQueueCommitRequestId:
      asyncExecution.sourceResetQueueCommitRequestId,
    sourceResetQueueCommitRequestSequence:
      asyncExecution.sourceResetQueueCommitRequestSequence,
    sourceResetIntentRequestId:
      asyncExecution.sourceResetIntentRequestId,
    sourceResetIntentRequestSequence:
      asyncExecution.sourceResetIntentRequestSequence,
    acceptedMetadataIds,
    admission: normalizedAdmission,
    sourceAsyncCallbackExecution:
      createRejectedErrorSourceAsyncCallbackExecution(asyncExecution),
    rejectedAsyncActionError,
    actionErrorPreflight,
    resetActionPublicBlockers,
    publicFormActionBoundary:
      createPublicFormActionRejectedErrorPreflightBoundary(),
    sideEffects: formActionRejectedErrorPreflightDiagnosticSideEffects,
    missingPrerequisites:
      formActionRejectedErrorPreflightMissingPrerequisites
  });

  formActionRejectedErrorPreflightRecordPayloads.set(payload, payload);
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

function assertAcceptedFormActionFormDataBlockerRecord(record) {
  const payload = getPrivateFormActionFormDataBlockerRecordPayload(record);
  if (
    payload !== null &&
    payload.status === privateFormActionFormDataBlockerRecordedStatus &&
    payload.admission?.metadataOnly === true &&
    payload.sourceEventExtraction?.consumedSubmitRequestSubmitActionMetadata ===
      true &&
    payload.sourceEventExtraction?.formDataConstructed === false &&
    payload.formDataConstructionBlocker?.constructorCallBlocked === true &&
    payload.formDataConstructionBlocker?.formDataConstructed === false &&
    payload.actionInvocationBlocker?.actionFunctionCaptured === false &&
    payload.actionInvocationBlocker?.actionInvoked === false &&
    payload.actionInvocationBlocker?.hostTransitionStarted === false &&
    payload.resetExecutionBlocker?.reactUpdateQueued === false &&
    payload.resetExecutionBlocker?.resetFormInstanceCalled === false &&
    payload.resetExecutionBlocker?.realFormReset === false &&
    payload.sideEffects?.sourceEventExtractionAccepted === true &&
    payload.sideEffects?.sourceResetQueueCommitAccepted === true &&
    payload.sideEffects?.formDataConstructed === false &&
    payload.sideEffects?.actionInvoked === false &&
    payload.sideEffects?.realFormReset === false
  ) {
    assertSupportedSubmitControlForDispatch(payload);
    return payload;
  }

  throwInvalidSubmitDispatchRecord(
    'source data blocker must be accepted metadata-only submit blocker'
  );
}

function assertAcceptedFormActionSubmitDispatchRecordForResetExecution(record) {
  const payload = getPrivateFormActionSubmitDispatchRecordPayload(record);
  if (
    payload !== null &&
    payload.status === privateFormActionSubmitDispatchRecordedStatus &&
    payload.admission?.metadataOnly === true &&
    payload.actionIdentity?.resolvedActionKind === 'function' &&
    payload.actionIdentity?.actionInvocationWouldBeScheduled === true &&
    payload.actionIdentity?.actionFunctionCaptured === false &&
    payload.actionIdentity?.actionInvoked === false &&
    payload.formDataBlockerLink?.formDataConstructionBlocked === true &&
    payload.formDataBlockerLink?.formDataConstructed === false &&
    payload.resetQueueIntentLink?.sourceResetOrderingKind ===
      'action-completion-reset-before-action' &&
    payload.resetQueueIntentLink?.sourceResetSource ===
      'action-completion' &&
    payload.resetQueueIntentLink?.resetStateWouldBeQueued === true &&
    payload.resetQueueIntentLink?.resetStateQueued === false &&
    payload.resetQueueIntentLink?.realFormReset === false &&
    payload.submitDispatchQueue?.callbackDispatchBlocked === true &&
    payload.submitDispatchQueue?.callbackDispatchExecuted === false &&
    payload.submitDispatchQueue?.submitCallbackInvoked === false &&
    payload.submitDispatchQueue?.formDataConstructed === false &&
    payload.submitDispatchQueue?.actionInvoked === false &&
    payload.sideEffects?.sourceFormDataBlockerAccepted === true &&
    payload.sideEffects?.sourceResetQueueIntentAccepted === true &&
    payload.sideEffects?.callbackDispatchExecuted === false &&
    payload.sideEffects?.actionInvoked === false &&
    payload.sideEffects?.realFormReset === false
  ) {
    return payload;
  }

  throwInvalidSubmitResetExecutionRecord(
    'source submit dispatch must be accepted metadata-only action-completion reset dispatch'
  );
}

function assertAcceptedFormActionSubmitDispatchRecordForCallbackActionPreflight(
  record
) {
  const payload = getPrivateFormActionSubmitDispatchRecordPayload(record);
  if (
    payload !== null &&
    payload.status === privateFormActionSubmitDispatchRecordedStatus &&
    payload.admission?.metadataOnly === true &&
    payload.actionIdentity?.resolvedActionKind === 'function' &&
    payload.actionIdentity?.actionInvocationWouldBeScheduled === true &&
    payload.actionIdentity?.actionFunctionCaptured === false &&
    payload.actionIdentity?.actionInvoked === false &&
    payload.actionIdentity?.hostTransitionStarted === false &&
    payload.formDataBlockerLink?.formDataConstructionBlocked === true &&
    payload.formDataBlockerLink?.formDataConstructed === false &&
    payload.submitDispatchQueue?.callbackDispatchBlocked === true &&
    payload.submitDispatchQueue?.callbackDispatchExecuted === false &&
    payload.submitDispatchQueue?.submitCallbackInvoked === false &&
    payload.submitDispatchQueue?.syntheticEventCreated === false &&
    payload.submitDispatchQueue?.formDataConstructed === false &&
    payload.submitDispatchQueue?.actionFunctionCaptured === false &&
    payload.submitDispatchQueue?.actionInvoked === false &&
    payload.sideEffects?.sourceFormDataBlockerAccepted === true &&
    payload.sideEffects?.dispatchQueueRowRecorded === true &&
    payload.sideEffects?.callbackDispatchExecuted === false &&
    payload.sideEffects?.submitCallbackInvoked === false &&
    payload.sideEffects?.actionInvoked === false &&
    payload.sideEffects?.realFormReset === false
  ) {
    return payload;
  }

  throwInvalidCallbackActionPreflightRecord(
    'source submit dispatch must be accepted metadata-only submit dispatch'
  );
}

function assertAcceptedFormActionSubmitResetExecutionRecordForCallbackActionPreflight(
  record,
  submitDispatch
) {
  const payload =
    getPrivateFormActionSubmitResetExecutionRecordPayload(record);
  if (
    payload !== null &&
    payload.status === privateFormActionSubmitResetExecutionRecordedStatus &&
    payload.sourceSubmitDispatchId === submitDispatch.dispatchId &&
    payload.sourceSubmitDispatchSequence ===
      submitDispatch.dispatchSequence &&
    payload.admission?.deterministicFakeFormOnly === true &&
    payload.sourceSubmitDispatch?.callbackDispatchExecuted === false &&
    payload.sourceSubmitDispatch?.actionInvoked === false &&
    payload.formDataBlockerConsumption?.blockedFormDataConsumed === true &&
    payload.formDataBlockerConsumption?.formDataConstructed === false &&
    payload.resetIntentConsumption?.resetIntentMetadataConsumed === true &&
    payload.resetIntentConsumption?.resetStateQueued === false &&
    payload.resetIntentConsumption?.realFormReset === false &&
    payload.fakeFormResetExecution?.fakeSubmitDispatchConsumed === true &&
    payload.fakeFormResetExecution?.fakeFormResetPathExecuted === true &&
    payload.fakeFormResetExecution?.fakeFormResetRecorded === true &&
    payload.fakeFormResetExecution?.formDataConstructed === false &&
    payload.fakeFormResetExecution?.syntheticEventCreated === false &&
    payload.fakeFormResetExecution?.callbackDispatchExecuted === false &&
    payload.fakeFormResetExecution?.submitCallbackInvoked === false &&
    payload.fakeFormResetExecution?.actionFunctionCaptured === false &&
    payload.fakeFormResetExecution?.actionInvoked === false &&
    payload.fakeFormResetExecution?.hostTransitionStarted === false &&
    payload.fakeFormResetExecution?.resetStateQueued === false &&
    payload.fakeFormResetExecution?.resetFormInstanceCalled === false &&
    payload.fakeFormResetExecution?.realFormReset === false &&
    payload.sideEffects?.sourceSubmitDispatchAccepted === true &&
    payload.sideEffects?.blockedFormDataConsumed === true &&
    payload.sideEffects?.resetIntentMetadataConsumed === true &&
    payload.sideEffects?.callbackDispatchExecuted === false &&
    payload.sideEffects?.actionInvoked === false &&
    payload.sideEffects?.realFormReset === false
  ) {
    return payload;
  }

  throwInvalidCallbackActionPreflightRecord(
    'source submit reset execution must be accepted metadata-only fake reset execution'
  );
}

function assertAcceptedFormActionCallbackActionPreflightRecordForAsyncCallbackExecution(
  record
) {
  const payload =
    getPrivateFormActionCallbackActionPreflightRecordPayload(record);
  if (
    payload !== null &&
    payload.status === privateFormActionCallbackActionPreflightRecordedStatus &&
    payload.admission?.metadataOnly === true &&
    payload.sourceSubmitDispatch?.actionInvocationWouldBeScheduled === true &&
    payload.sourceSubmitDispatch?.pendingStatusWouldBeSet === true &&
    payload.sourceSubmitDispatch?.callbackDispatchExecuted === false &&
    payload.sourceSubmitDispatch?.actionInvoked === false &&
    payload.sourceSubmitResetExecution?.fakeFormResetPathExecuted === true &&
    payload.sourceSubmitResetExecution?.callbackDispatchExecuted === false &&
    payload.sourceSubmitResetExecution?.actionInvoked === false &&
    payload.sourceSubmitResetExecution?.realFormReset === false &&
    payload.submitDispatchMetadataConsumption
      ?.submitDispatchMetadataConsumed === true &&
    payload.submitResetExecutionMetadataConsumption
      ?.submitResetExecutionMetadataConsumed === true &&
    payload.callbackDispatchPreflight?.callbackDispatchPreflighted === true &&
    payload.callbackDispatchPreflight?.callbackDispatchExecuted === false &&
    payload.callbackDispatchPreflight?.submitCallbackInvoked === false &&
    payload.actionInvocationPreflight?.actionInvocationPreflighted === true &&
    payload.actionInvocationPreflight?.actionInvocationWouldBeScheduled ===
      true &&
    payload.actionInvocationPreflight?.pendingStatusWouldBeSet === true &&
    payload.actionInvocationPreflight?.resetWouldRunBeforeActionInvocation ===
      true &&
    payload.actionInvocationPreflight?.formDataConstructed === false &&
    payload.actionInvocationPreflight?.actionInvoked === false &&
    payload.actionInvocationPreflight?.hostTransitionStarted === false &&
    payload.publicFormActionBoundary?.publicFormActionsEnabled === false &&
    payload.publicFormActionBoundary?.callbackDispatchExecuted === false &&
    payload.publicFormActionBoundary?.actionInvoked === false &&
    payload.publicFormActionBoundary?.realFormReset === false &&
    payload.sideEffects?.callbackQueuePreflightRecorded === true &&
    payload.sideEffects?.actionInvocationPreflightRecorded === true &&
    payload.sideEffects?.formDataConstructed === false &&
    payload.sideEffects?.callbackDispatchExecuted === false &&
    payload.sideEffects?.submitCallbackInvoked === false &&
    payload.sideEffects?.actionInvoked === false &&
    payload.sideEffects?.hostTransitionStarted === false &&
    payload.sideEffects?.realFormReset === false
  ) {
    return payload;
  }

  throwInvalidAsyncCallbackExecutionRecord(
    'source callback/action preflight must be accepted metadata-only preflight'
  );
}

function assertAcceptedFormActionAsyncCallbackExecutionRecordForRejectedErrorPreflight(
  record
) {
  const payload =
    getPrivateFormActionAsyncCallbackExecutionRecordPayload(record);
  if (
    payload !== null &&
    payload.status === privateFormActionAsyncCallbackExecutionRecordedStatus &&
    payload.admission?.deterministicFakeCallbackOnly === true &&
    payload.pendingStatusMetadata?.metadataOnly === true &&
    payload.pendingStatusMetadata?.formDataConstructed === false &&
    payload.resetMetadata?.resetIntentMetadataConsumed === true &&
    payload.resetMetadata?.resetStateQueued === false &&
    payload.resetMetadata?.realFormReset === false &&
    payload.callbackExecution?.status ===
      'failed-private-form-action-async-callback-rejected' &&
    payload.callbackExecution?.thenableObserved === true &&
    payload.callbackExecution?.rejected === true &&
    payload.callbackExecution?.failClosed === true &&
    payload.callbackExecution?.errorInfo !== null &&
    payload.callbackExecution?.formDataConstructed === false &&
    payload.callbackExecution?.publicActionInvoked === false &&
    payload.callbackExecution?.hostTransitionStarted === false &&
    payload.callbackExecution?.reactUpdateQueued === false &&
    payload.callbackExecution?.resetStateQueued === false &&
    payload.callbackExecution?.resetFormInstanceCalled === false &&
    payload.callbackExecution?.realFormReset === false &&
    payload.publicFormActionBoundary?.publicFormActionsEnabled === false &&
    payload.publicFormActionBoundary
      ?.privateAsyncActionCallbackPubliclyReachable === false &&
    payload.publicFormActionBoundary?.actionInvoked === false &&
    payload.publicFormActionBoundary?.realFormReset === false &&
    payload.sideEffects?.asyncCallbackThenableRejected === true &&
    payload.sideEffects?.failClosedErrorRecorded === true &&
    payload.sideEffects?.actionInvoked === false &&
    payload.sideEffects?.reactUpdateQueued === false &&
    payload.sideEffects?.realFormReset === false
  ) {
    return payload;
  }

  throwInvalidRejectedErrorPreflightRecord(
    'source async callback execution must be an accepted rejected fake callback execution'
  );
}

function assertSupportedSubmitControlForDispatch(blocker) {
  const controlKind = blocker.submitterShape?.controlKind;
  if (
    controlKind === 'button' ||
    controlKind === 'input' ||
    controlKind === 'none'
  ) {
    return;
  }

  throwInvalidSubmitDispatchRecord(
    'source submit control kind must be button, input, or none'
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

function assertPrivateFormActionSubmitDispatchRecord(record) {
  const payload = getPrivateFormActionSubmitDispatchRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  throwInvalidSubmitDispatchRecord(
    'expected a private form action submit dispatch diagnostic record'
  );
}

function assertPrivateFormActionSubmitResetExecutionRecord(record) {
  const payload =
    getPrivateFormActionSubmitResetExecutionRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  throwInvalidSubmitResetExecutionRecord(
    'expected a private form action submit reset execution record'
  );
}

function assertPrivateFormActionCallbackActionPreflightRecord(record) {
  const payload =
    getPrivateFormActionCallbackActionPreflightRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  throwInvalidCallbackActionPreflightRecord(
    'expected a private form action callback/action invocation preflight record'
  );
}

function assertPrivateFormActionAsyncCallbackExecutionRecord(record) {
  const payload =
    getPrivateFormActionAsyncCallbackExecutionRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  throwInvalidAsyncCallbackExecutionRecord(
    'expected a private form action async callback execution record'
  );
}

function assertPrivateFormActionRejectedErrorPreflightRecord(record) {
  const payload =
    getPrivateFormActionRejectedErrorPreflightRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  throwInvalidRejectedErrorPreflightRecord(
    'expected a private form action rejected-error preflight record'
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

function normalizeFormActionSubmitDispatchAdmission(blocker, admission) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidSubmitDispatchAdmission('admission metadata must be an object');
  }

  if (admission.explicitFormActionSubmitDispatch !== true) {
    throwInvalidSubmitDispatchAdmission(
      'explicitFormActionSubmitDispatch must be true'
    );
  }

  assertNoSubmitDispatchRawAdmissionFields(admission);

  if (admission.callbackDispatchExecutionRequested === true) {
    throwInvalidSubmitDispatchAdmission(
      'callback dispatch execution must remain blocked'
    );
  }

  const sourceSubmitControlKind = blocker.submitterShape.controlKind;
  const submitControlKind = getSubmitDispatchStringProperty(
    admission,
    'submitControlKind',
    sourceSubmitControlKind
  );
  if (submitControlKind !== sourceSubmitControlKind) {
    throwInvalidSubmitDispatchAdmission(
      'submitControlKind must match the source blocker metadata'
    );
  }
  if (
    submitControlKind !== 'button' &&
    submitControlKind !== 'input' &&
    submitControlKind !== 'none'
  ) {
    throwInvalidSubmitDispatchAdmission(
      'submitControlKind must be button, input, or none'
    );
  }

  return freezeRecord({
    explicitFormActionSubmitDispatch: true,
    metadataOnly: true,
    diagnosticKind:
      getSubmitDispatchStringProperty(
        admission,
        'diagnosticKind',
        'metadata-only-submit-action-dispatch'
      ),
    sourceFormDataBlockerId: blocker.blockerId,
    sourceEventExtractionId: blocker.sourceEventExtractionId,
    sourceResetQueueCommitRequestId:
      blocker.sourceResetQueueCommitRequestId,
    submitControlKind,
    callbackDispatchExecutionRequested: false,
    dispatchQueueCaptured: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawActionCaptured: false,
    rawSubmitControlCaptured: false,
    liveFormAccepted: false,
    realFormInspected: false,
    unsupportedSubmitControlAccepted: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    submitCallbackInvoked: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    previousDispatcherCalled: false,
    resetStateQueued: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function normalizeFormActionSubmitResetExecutionAdmission(
  submitDispatch,
  admission
) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidSubmitResetExecutionAdmission(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitFormActionSubmitResetExecution !== true) {
    throwInvalidSubmitResetExecutionAdmission(
      'explicitFormActionSubmitResetExecution must be true'
    );
  }

  assertNoSubmitResetExecutionRawAdmissionFields(admission);

  if (admission.callbackDispatchExecutionRequested === true) {
    throwInvalidSubmitResetExecutionAdmission(
      'callback dispatch execution must remain blocked'
    );
  }

  const fakeFormPath = normalizeSubmitResetExecutionFakeFormPath(
    submitDispatch,
    admission.fakeFormPath
  );

  return freezeRecord({
    explicitFormActionSubmitResetExecution: true,
    deterministicFakeFormOnly: true,
    diagnosticKind:
      getSubmitResetExecutionStringProperty(
        admission,
        'diagnosticKind',
        'deterministic-fake-form-submit-reset-execution'
      ),
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceFormDataBlockerId: submitDispatch.sourceFormDataBlockerId,
    sourceResetQueueCommitRequestId:
      submitDispatch.sourceResetQueueCommitRequestId,
    sourceResetIntentRequestId:
      submitDispatch.sourceResetIntentRequestId,
    fakeFormPath,
    callbackDispatchExecutionRequested: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawActionCaptured: false,
    rawSubmitControlCaptured: false,
    liveFormAccepted: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    previousDispatcherCalled: false,
    resetStateQueued: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function normalizeFormActionCallbackActionPreflightAdmission(
  submitDispatch,
  submitResetExecution,
  admission
) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidCallbackActionPreflightAdmission(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitFormActionCallbackActionPreflight !== true) {
    throwInvalidCallbackActionPreflightAdmission(
      'explicitFormActionCallbackActionPreflight must be true'
    );
  }

  assertNoCallbackActionPreflightRawAdmissionFields(admission);

  if (admission.callbackDispatchExecutionRequested === true) {
    throwInvalidCallbackActionPreflightAdmission(
      'callback dispatch execution must remain blocked'
    );
  }
  if (admission.callbackInvocationRequested === true) {
    throwInvalidCallbackActionPreflightAdmission(
      'callback invocation must remain blocked'
    );
  }
  if (
    admission.actionInvocationRequested === true ||
    admission.actionExecutionRequested === true
  ) {
    throwInvalidCallbackActionPreflightAdmission(
      'action invocation must remain blocked'
    );
  }
  if (admission.formDataConstructionRequested === true) {
    throwInvalidCallbackActionPreflightAdmission(
      'form data construction must remain blocked'
    );
  }
  if (admission.hostTransitionRequested === true) {
    throwInvalidCallbackActionPreflightAdmission(
      'host transition start must remain blocked'
    );
  }
  if (admission.resetExecutionRequested === true) {
    throwInvalidCallbackActionPreflightAdmission(
      'reset execution must remain blocked'
    );
  }

  return freezeRecord({
    explicitFormActionCallbackActionPreflight: true,
    metadataOnly: true,
    diagnosticKind:
      getCallbackActionPreflightStringProperty(
        admission,
        'diagnosticKind',
        'metadata-only-callback-action-invocation-preflight'
      ),
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceSubmitResetExecutionId: submitResetExecution.executionId,
    callbackQueueKind:
      getCallbackActionPreflightStringProperty(
        admission,
        'callbackQueueKind',
        'metadata-only-submit-callback-row'
      ),
    actionInvocationKind:
      getCallbackActionPreflightStringProperty(
        admission,
        'actionInvocationKind',
        'metadata-only-form-action-invocation-row'
      ),
    callbackDispatchExecutionRequested: false,
    callbackInvocationRequested: false,
    actionInvocationRequested: false,
    actionExecutionRequested: false,
    formDataConstructionRequested: false,
    hostTransitionRequested: false,
    resetExecutionRequested: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawActionCaptured: false,
    rawSubmitControlCaptured: false,
    liveFormAccepted: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    dispatchQueueCaptured: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function normalizeFormActionAsyncCallbackExecutionAdmission(
  preflight,
  admission
) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidAsyncCallbackExecutionAdmission(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitFormActionAsyncCallbackExecution !== true) {
    throwInvalidAsyncCallbackExecutionAdmission(
      'explicitFormActionAsyncCallbackExecution must be true'
    );
  }

  assertNoAsyncCallbackExecutionRawAdmissionFields(admission);

  const callback = admission.asyncActionCallback;
  if (typeof callback !== 'function') {
    throwInvalidAsyncCallbackExecutionAdmission(
      'asyncActionCallback must be a function'
    );
  }

  if (admission.publicDispatchRequested === true) {
    throwInvalidAsyncCallbackExecutionAdmission(
      'public submit dispatch must remain blocked'
    );
  }
  if (admission.formDataConstructionRequested === true) {
    throwInvalidAsyncCallbackExecutionAdmission(
      'form data construction must remain blocked'
    );
  }
  if (admission.hostTransitionRequested === true) {
    throwInvalidAsyncCallbackExecutionAdmission(
      'host transition start must remain blocked'
    );
  }
  if (admission.reactUpdateRequested === true) {
    throwInvalidAsyncCallbackExecutionAdmission(
      'react update queueing must remain blocked'
    );
  }
  if (admission.resetExecutionRequested === true) {
    throwInvalidAsyncCallbackExecutionAdmission(
      'reset execution must remain blocked'
    );
  }

  return {
    callback,
    admission: freezeRecord({
      explicitFormActionAsyncCallbackExecution: true,
      deterministicFakeCallbackOnly: true,
      diagnosticKind:
        getAsyncCallbackExecutionStringProperty(
          admission,
          'diagnosticKind',
          'deterministic-private-async-action-callback-execution'
        ),
      executionKind:
        getAsyncCallbackExecutionStringProperty(
          admission,
          'executionKind',
          'deterministic-private-async-action-callback'
        ),
      payloadKind:
        getAsyncCallbackExecutionStringProperty(
          admission,
          'payloadKind',
          'blocked-formdata-metadata-token'
        ),
      sourceCallbackActionPreflightId: preflight.preflightId,
      callbackQueueKind: preflight.admission.callbackQueueKind,
      actionInvocationKind: preflight.admission.actionInvocationKind,
      asyncActionCallbackAccepted: true,
      asyncActionCallbackArity: callback.length,
      asyncActionCallbackName:
        typeof callback.name === 'string' && callback.name.length > 0
          ? callback.name
          : 'anonymous',
      asyncActionCallbackDeclaredAsync:
        callback.constructor?.name === 'AsyncFunction',
      pendingStatusMetadataRequested: true,
      resetMetadataRequested: true,
      publicDispatchRequested: false,
      callbackDispatchExecutionRequested: false,
      formDataConstructionRequested: false,
      hostTransitionRequested: false,
      reactUpdateRequested: false,
      resetExecutionRequested: false,
      rawTargetCaptured: false,
      rawEventCaptured: false,
      rawActionCaptured: false,
      rawSubmitControlCaptured: false,
      liveFormAccepted: false,
      realFormInspected: false,
      submitControlInspected: false,
      formDataConstructed: false,
      syntheticEventCreated: false,
      dispatchQueueCaptured: false,
      callbackDispatchExecuted: false,
      submitCallbackInvoked: false,
      actionFunctionCaptured: false,
      actionInvoked: false,
      hostTransitionStarted: false,
      resetStateQueued: false,
      realFormReset: false,
      compatibilityClaimed: false
    })
  };
}

function normalizeFormActionRejectedErrorPreflightAdmission(
  asyncExecution,
  admission
) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidRejectedErrorPreflightAdmission(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitFormActionRejectedErrorPreflight !== true) {
    throwInvalidRejectedErrorPreflightAdmission(
      'explicitFormActionRejectedErrorPreflight must be true'
    );
  }

  assertNoRejectedErrorPreflightRawAdmissionFields(admission);

  const sourceAsyncCallbackExecutionId =
    getRejectedErrorPreflightStringProperty(
      admission,
      'sourceAsyncCallbackExecutionId',
      asyncExecution.executionId
    );
  if (sourceAsyncCallbackExecutionId !== asyncExecution.executionId) {
    throwInvalidRejectedErrorPreflightAdmission(
      'sourceAsyncCallbackExecutionId must match the rejected async callback execution record'
    );
  }

  if (admission.publicDispatchRequested === true) {
    throwInvalidRejectedErrorPreflightAdmission(
      'public submit dispatch must remain blocked'
    );
  }
  if (admission.publicErrorRoutingRequested === true) {
    throwInvalidRejectedErrorPreflightAdmission(
      'public error routing must remain blocked'
    );
  }
  if (admission.actionInvocationRequested === true) {
    throwInvalidRejectedErrorPreflightAdmission(
      'action invocation must remain blocked'
    );
  }
  if (admission.formDataConstructionRequested === true) {
    throwInvalidRejectedErrorPreflightAdmission(
      'form data construction must remain blocked'
    );
  }
  if (admission.hostTransitionRequested === true) {
    throwInvalidRejectedErrorPreflightAdmission(
      'host transition start must remain blocked'
    );
  }
  if (admission.reactUpdateRequested === true) {
    throwInvalidRejectedErrorPreflightAdmission(
      'react update queueing must remain blocked'
    );
  }
  if (admission.resetExecutionRequested === true) {
    throwInvalidRejectedErrorPreflightAdmission(
      'reset execution must remain blocked'
    );
  }
  if (admission.publicRequestFormResetRequested === true) {
    throwInvalidRejectedErrorPreflightAdmission(
      'public reset request must remain blocked'
    );
  }

  return freezeRecord({
    explicitFormActionRejectedErrorPreflight: true,
    metadataOnly: true,
    preflightOnly: true,
    diagnosticKind:
      getRejectedErrorPreflightStringProperty(
        admission,
        'diagnosticKind',
        'metadata-only-rejected-action-error-preflight'
      ),
    errorChannel:
      getRejectedErrorPreflightStringProperty(
        admission,
        'errorChannel',
        'private-async-action-rejection'
      ),
    sourceAsyncCallbackExecutionId,
    sourceCallbackActionPreflightId:
      asyncExecution.sourceCallbackActionPreflightId,
    publicDispatchRequested: false,
    publicErrorRoutingRequested: false,
    actionInvocationRequested: false,
    formDataConstructionRequested: false,
    hostTransitionRequested: false,
    reactUpdateRequested: false,
    resetExecutionRequested: false,
    publicRequestFormResetRequested: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawActionCaptured: false,
    rawSubmitControlCaptured: false,
    rawErrorCaptured: false,
    liveFormAccepted: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    publicActionInvoked: false,
    publicErrorRoutingStarted: false,
    rootErrorCallbackInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
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

function assertNoSubmitDispatchRawAdmissionFields(admission) {
  for (const field of blockedSubmitDispatchAdmissionFields) {
    if (hasOwnProp(admission, field)) {
      throwInvalidSubmitDispatchAdmission(
        `${field} must not be passed to the submit dispatch metadata gate`
      );
    }
  }
}

function assertNoSubmitResetExecutionRawAdmissionFields(admission) {
  for (const field of blockedSubmitResetExecutionAdmissionFields) {
    if (hasOwnProp(admission, field)) {
      throwInvalidSubmitResetExecutionAdmission(
        `${field} must not be passed to the submit reset execution fake form gate`
      );
    }
  }
}

function assertNoCallbackActionPreflightRawAdmissionFields(admission) {
  for (const field of blockedCallbackActionPreflightAdmissionFields) {
    if (hasOwnProp(admission, field)) {
      throwInvalidCallbackActionPreflightAdmission(
        `${field} must not be passed to the callback/action invocation preflight gate`
      );
    }
  }
}

function assertNoAsyncCallbackExecutionRawAdmissionFields(admission) {
  for (const field of blockedAsyncCallbackExecutionAdmissionFields) {
    if (hasOwnProp(admission, field)) {
      throwInvalidAsyncCallbackExecutionAdmission(
        `${field} must not be passed to the async callback execution gate`
      );
    }
  }
}

function assertNoRejectedErrorPreflightRawAdmissionFields(admission) {
  for (const field of blockedRejectedErrorPreflightAdmissionFields) {
    if (hasOwnProp(admission, field)) {
      throwInvalidRejectedErrorPreflightAdmission(
        `${field} must not be passed to the rejected-error preflight gate`
      );
    }
  }
}

function normalizeSubmitResetExecutionFakeFormPath(
  submitDispatch,
  fakeFormPath
) {
  const record = fakeFormPath == null ? Object.create(null) : fakeFormPath;
  if (typeof record !== 'object') {
    throwInvalidSubmitResetExecutionAdmission(
      'fakeFormPath must be an object when present'
    );
  }

  const pathKind = getSubmitResetExecutionShapeStringProperty(
    record,
    'pathKind',
    'action-completion-submit-reset'
  );
  if (pathKind !== 'action-completion-submit-reset') {
    throwInvalidSubmitResetExecutionAdmission(
      'fakeFormPath.pathKind must be action-completion-submit-reset'
    );
  }

  const hostTag = getSubmitResetExecutionShapeStringProperty(
    record,
    'hostTag',
    'form'
  );
  if (hostTag !== 'form') {
    throwInvalidSubmitResetExecutionAdmission(
      'fakeFormPath.hostTag must be form'
    );
  }

  const resetMode = getSubmitResetExecutionShapeStringProperty(
    record,
    'resetMode',
    'record-only-fake-reset'
  );
  if (resetMode !== 'record-only-fake-reset') {
    throwInvalidSubmitResetExecutionAdmission(
      'fakeFormPath.resetMode must be record-only-fake-reset'
    );
  }

  return freezeRecord({
    deterministicFakeFormOnly: true,
    pathKind,
    pathId: getSubmitResetExecutionShapeStringProperty(
      record,
      'pathId',
      'fake-form-action-completion-reset'
    ),
    hostTag,
    resetMode,
    submitControlKind:
      submitDispatch.admission.submitControlKind,
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceFormDataBlockerId: submitDispatch.sourceFormDataBlockerId,
    sourceResetIntentRequestId:
      submitDispatch.sourceResetIntentRequestId,
    formDataBlockerConsumed: true,
    resetIntentMetadataConsumed: true,
    actionCompletionResetBeforeAction: true,
    rawFormCaptured: false,
    liveFormAccepted: false,
    realFormInspected: false,
    formDataConstructed: false,
    actionInvoked: false,
    resetStateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
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

function createSubmitActionIdentity(blocker) {
  const source = blocker.sourceEventExtraction;
  const invocation = blocker.actionInvocationBlocker;
  return freezeRecord({
    metadataOnly: true,
    sourceFormDataBlockerId: blocker.blockerId,
    sourceEventExtractionId: blocker.sourceEventExtractionId,
    sourceSubmissionRequestId: blocker.sourceSubmissionRequestId,
    eventName: source.eventName,
    submissionTrigger: source.submissionTrigger,
    resolvedActionKind: source.actionKind,
    actionSource: source.actionSource,
    formActionKind: source.formActionKind,
    submitControlActionKind: source.submitterActionKind,
    submitControlOverridesFormAction:
      source.submitterActionOverridesFormAction,
    nativeNavigationWouldBePrevented:
      invocation.nativeNavigationWouldBePrevented,
    pendingStatusWouldBeSet: invocation.pendingStatusWouldBeSet,
    actionInvocationWouldBeScheduled:
      invocation.actionInvocationWouldBeScheduled,
    formDataBlockerId: blocker.blockerId,
    rawActionCaptured: false,
    actionFunctionCaptured: false,
    callbackCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    compatibilityClaimed: false
  });
}

function createFormDataBlockerLink(blocker) {
  return freezeRecord({
    metadataOnly: true,
    blockerId: blocker.blockerId,
    blockerSequence: blocker.blockerSequence,
    blockerStatus: blocker.status,
    sourceEventExtractionId: blocker.sourceEventExtractionId,
    sourceResetQueueCommitRequestId:
      blocker.sourceResetQueueCommitRequestId,
    targetKind: blocker.formTargetShape.targetKind,
    submitControlKind: blocker.submitterShape.controlKind,
    formDataConstructionStatus:
      blocker.formDataConstructionBlocker.status,
    formDataConstructionBlocked:
      blocker.formDataConstructionBlocker.constructorCallBlocked,
    wouldConstructForPendingStatus:
      blocker.formDataConstructionBlocker
        .wouldConstructForPendingStatus,
    wouldConstructForActionInvocation:
      blocker.formDataConstructionBlocker
        .wouldConstructForActionInvocation,
    formDataConstructed: false,
    realFormInspected: false,
    submitControlInspected: false,
    compatibilityClaimed: false
  });
}

function createResetQueueIntentLink(blocker) {
  const sourceReset = blocker.sourceResetQueueCommit;
  const resetExecution = blocker.resetExecutionBlocker;
  return freezeRecord({
    metadataOnly: true,
    sourceFormDataBlockerId: blocker.blockerId,
    sourceResetQueueCommitRequestId:
      blocker.sourceResetQueueCommitRequestId,
    sourceResetQueueCommitRequestSequence:
      blocker.sourceResetQueueCommitRequestSequence,
    sourceResetIntentRequestId: blocker.sourceResetIntentRequestId,
    sourceResetIntentRequestSequence:
      blocker.sourceResetIntentRequestSequence,
    sourceResetOrderingKind: sourceReset.sourceResetOrderingKind,
    sourceResetSource: sourceReset.sourceResetSource,
    sourceTransitionContext: sourceReset.sourceTransitionContext,
    resetStateWouldBeQueued:
      resetExecution.resetStateWouldBeQueued,
    resetTraversalWouldRunAfterMutationEffects:
      resetExecution.resetTraversalWouldRunAfterMutationEffects,
    actionCompletionResetBeforeAction:
      sourceReset.sourceResetOrderingKind ===
      'action-completion-reset-before-action',
    previousDispatcherCalled: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createSubmitDispatchQueueBoundary(blocker, actionIdentity) {
  return freezeRecord({
    status: 'blocked-private-form-action-submit-dispatch',
    sourceFormDataBlockerId: blocker.blockerId,
    sourceEventExtractionId: blocker.sourceEventExtractionId,
    eventName: actionIdentity.eventName,
    submissionTrigger: actionIdentity.submissionTrigger,
    actionIdentityRecorded: true,
    dispatchQueueEntryWouldBeCreated: true,
    listenerWouldRunAfterSyntheticEvent: true,
    nativeNavigationWouldBePrevented:
      actionIdentity.nativeNavigationWouldBePrevented,
    pendingStatusWouldBeSet:
      actionIdentity.pendingStatusWouldBeSet,
    actionInvocationWouldBeScheduled:
      actionIdentity.actionInvocationWouldBeScheduled,
    callbackDispatchBlocked: true,
    dispatchQueueCaptured: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    defaultPreventedByGate: false,
    nativeDefaultPrevented: false,
    formDataConstructed: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    blockedReason: 'no-submit-listener-execution'
  });
}

function createSubmitResetSourceSubmitDispatch(submitDispatch) {
  return freezeRecord({
    dispatchId: submitDispatch.dispatchId,
    dispatchSequence: submitDispatch.dispatchSequence,
    status: submitDispatch.status,
    requestType: submitDispatch.requestType,
    sourceFormDataBlockerId: submitDispatch.sourceFormDataBlockerId,
    sourceEventExtractionId: submitDispatch.sourceEventExtractionId,
    sourceResetQueueCommitRequestId:
      submitDispatch.sourceResetQueueCommitRequestId,
    sourceResetIntentRequestId:
      submitDispatch.sourceResetIntentRequestId,
    actionIdentityRecorded: true,
    resolvedActionKind:
      submitDispatch.actionIdentity.resolvedActionKind,
    actionSource: submitDispatch.actionIdentity.actionSource,
    submitControlKind: submitDispatch.admission.submitControlKind,
    metadataOnly: submitDispatch.admission.metadataOnly,
    formDataConstructionBlocked:
      submitDispatch.formDataBlockerLink.formDataConstructionBlocked,
    resetStateWouldBeQueued:
      submitDispatch.resetQueueIntentLink.resetStateWouldBeQueued,
    actionCompletionResetBeforeAction:
      submitDispatch.resetQueueIntentLink
        .actionCompletionResetBeforeAction,
    callbackDispatchBlocked:
      submitDispatch.submitDispatchQueue.callbackDispatchBlocked,
    callbackDispatchExecuted: false,
    formDataConstructed: false,
    actionInvoked: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createSubmitResetFormDataBlockerConsumption(submitDispatch) {
  const link = submitDispatch.formDataBlockerLink;
  return freezeRecord({
    metadataOnly: true,
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceFormDataBlockerId: link.blockerId,
    sourceFormDataBlockerSequence: link.blockerSequence,
    sourceEventExtractionId: link.sourceEventExtractionId,
    sourceResetQueueCommitRequestId:
      link.sourceResetQueueCommitRequestId,
    targetKind: link.targetKind,
    submitControlKind: link.submitControlKind,
    formDataConstructionStatus: link.formDataConstructionStatus,
    formDataConstructionBlocked:
      link.formDataConstructionBlocked,
    wouldConstructForPendingStatus:
      link.wouldConstructForPendingStatus,
    wouldConstructForActionInvocation:
      link.wouldConstructForActionInvocation,
    blockedFormDataConsumed: true,
    formDataConstructed: false,
    realFormInspected: false,
    submitControlInspected: false,
    compatibilityClaimed: false
  });
}

function createSubmitResetIntentConsumption(submitDispatch) {
  const link = submitDispatch.resetQueueIntentLink;
  return freezeRecord({
    metadataOnly: true,
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceFormDataBlockerId: link.sourceFormDataBlockerId,
    sourceResetQueueCommitRequestId:
      link.sourceResetQueueCommitRequestId,
    sourceResetQueueCommitRequestSequence:
      link.sourceResetQueueCommitRequestSequence,
    sourceResetIntentRequestId: link.sourceResetIntentRequestId,
    sourceResetIntentRequestSequence:
      link.sourceResetIntentRequestSequence,
    sourceResetOrderingKind: link.sourceResetOrderingKind,
    sourceResetSource: link.sourceResetSource,
    sourceTransitionContext: link.sourceTransitionContext,
    actionCompletionResetBeforeAction:
      link.actionCompletionResetBeforeAction,
    resetStateWouldBeQueued: link.resetStateWouldBeQueued,
    resetTraversalWouldRunAfterMutationEffects:
      link.resetTraversalWouldRunAfterMutationEffects,
    resetIntentMetadataConsumed: true,
    previousDispatcherCalled: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createFakeFormResetExecution(
  submitDispatch,
  admission,
  formDataBlockerConsumption,
  resetIntentConsumption
) {
  const fakeFormPath = admission.fakeFormPath;
  return freezeRecord({
    status:
      'executed-private-form-action-submit-reset-fake-form-path',
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceFormDataBlockerId:
      formDataBlockerConsumption.sourceFormDataBlockerId,
    sourceResetIntentRequestId:
      resetIntentConsumption.sourceResetIntentRequestId,
    fakeFormPathId: fakeFormPath.pathId,
    pathKind: fakeFormPath.pathKind,
    hostTag: fakeFormPath.hostTag,
    resetMode: fakeFormPath.resetMode,
    deterministicFakeFormOnly: true,
    blockedFormDataConsumed:
      formDataBlockerConsumption.blockedFormDataConsumed,
    resetIntentMetadataConsumed:
      resetIntentConsumption.resetIntentMetadataConsumed,
    actionCompletionResetBeforeAction:
      resetIntentConsumption.actionCompletionResetBeforeAction,
    resetWouldRunBeforeActionInvocation: true,
    fakeSubmitDispatchConsumed: true,
    fakeFormResetPathExecuted: true,
    fakeFormResetRecorded: true,
    dispatchQueueCaptured: false,
    rawFormCaptured: false,
    rawEventCaptured: false,
    rawActionCaptured: false,
    rawSubmitControlCaptured: false,
    liveFormAccepted: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
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
}

function createCallbackActionAcceptedMetadataIds(
  submitDispatch,
  submitResetExecution
) {
  return freezeRecord({
    eventExtractionId: submitDispatch.acceptedMetadataIds.eventExtractionId,
    eventExtractionSequence:
      submitDispatch.acceptedMetadataIds.eventExtractionSequence,
    submissionIntentRequestId:
      submitDispatch.acceptedMetadataIds.submissionIntentRequestId,
    submissionIntentRequestSequence:
      submitDispatch.acceptedMetadataIds.submissionIntentRequestSequence,
    resetQueueCommitRequestId:
      submitDispatch.acceptedMetadataIds.resetQueueCommitRequestId,
    resetQueueCommitRequestSequence:
      submitDispatch.acceptedMetadataIds.resetQueueCommitRequestSequence,
    resetIntentRequestId:
      submitDispatch.acceptedMetadataIds.resetIntentRequestId,
    resetIntentRequestSequence:
      submitDispatch.acceptedMetadataIds.resetIntentRequestSequence,
    eventExtractionGateId:
      submitDispatch.acceptedMetadataIds.eventExtractionGateId,
    resetQueueCommitGateId:
      submitDispatch.acceptedMetadataIds.resetQueueCommitGateId,
    submitDispatchId: submitDispatch.dispatchId,
    submitDispatchSequence: submitDispatch.dispatchSequence,
    submitDispatchGateId: submitDispatch.gateId,
    submitResetExecutionId: submitResetExecution.executionId,
    submitResetExecutionSequence: submitResetExecution.executionSequence,
    submitResetExecutionGateId: submitResetExecution.gateId
  });
}

function createCallbackActionSourceSubmitDispatch(submitDispatch) {
  return freezeRecord({
    dispatchId: submitDispatch.dispatchId,
    dispatchSequence: submitDispatch.dispatchSequence,
    status: submitDispatch.status,
    requestType: submitDispatch.requestType,
    sourceFormDataBlockerId: submitDispatch.sourceFormDataBlockerId,
    sourceEventExtractionId: submitDispatch.sourceEventExtractionId,
    sourceResetQueueCommitRequestId:
      submitDispatch.sourceResetQueueCommitRequestId,
    sourceResetIntentRequestId:
      submitDispatch.sourceResetIntentRequestId,
    actionIdentityRecorded: true,
    resolvedActionKind:
      submitDispatch.actionIdentity.resolvedActionKind,
    actionSource: submitDispatch.actionIdentity.actionSource,
    submitControlKind: submitDispatch.admission.submitControlKind,
    actionInvocationWouldBeScheduled:
      submitDispatch.actionIdentity.actionInvocationWouldBeScheduled,
    pendingStatusWouldBeSet:
      submitDispatch.actionIdentity.pendingStatusWouldBeSet,
    formDataConstructionBlocked:
      submitDispatch.formDataBlockerLink.formDataConstructionBlocked,
    resetStateWouldBeQueued:
      submitDispatch.resetQueueIntentLink.resetStateWouldBeQueued,
    actionCompletionResetBeforeAction:
      submitDispatch.resetQueueIntentLink
        .actionCompletionResetBeforeAction,
    dispatchQueueEntryWouldBeCreated:
      submitDispatch.submitDispatchQueue.dispatchQueueEntryWouldBeCreated,
    callbackDispatchBlocked:
      submitDispatch.submitDispatchQueue.callbackDispatchBlocked,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    formDataConstructed: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createCallbackActionSourceSubmitResetExecution(
  submitResetExecution
) {
  return freezeRecord({
    executionId: submitResetExecution.executionId,
    executionSequence: submitResetExecution.executionSequence,
    status: submitResetExecution.status,
    requestType: submitResetExecution.requestType,
    sourceSubmitDispatchId:
      submitResetExecution.sourceSubmitDispatchId,
    sourceFormDataBlockerId:
      submitResetExecution.sourceFormDataBlockerId,
    sourceResetIntentRequestId:
      submitResetExecution.sourceResetIntentRequestId,
    blockedFormDataConsumed:
      submitResetExecution.formDataBlockerConsumption
        .blockedFormDataConsumed,
    resetIntentMetadataConsumed:
      submitResetExecution.resetIntentConsumption
        .resetIntentMetadataConsumed,
    fakeSubmitDispatchConsumed:
      submitResetExecution.fakeFormResetExecution
        .fakeSubmitDispatchConsumed,
    fakeFormResetPathExecuted:
      submitResetExecution.fakeFormResetExecution
        .fakeFormResetPathExecuted,
    fakeFormResetRecorded:
      submitResetExecution.fakeFormResetExecution
        .fakeFormResetRecorded,
    resetWouldRunBeforeActionInvocation:
      submitResetExecution.fakeFormResetExecution
        .resetWouldRunBeforeActionInvocation,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createCallbackActionSubmitDispatchConsumption(submitDispatch) {
  return freezeRecord({
    metadataOnly: true,
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceSubmitDispatchSequence: submitDispatch.dispatchSequence,
    sourceFormDataBlockerId: submitDispatch.sourceFormDataBlockerId,
    sourceEventExtractionId: submitDispatch.sourceEventExtractionId,
    sourceResetIntentRequestId:
      submitDispatch.sourceResetIntentRequestId,
    actionIdentityRecorded: true,
    dispatchQueueRowRecorded: true,
    submitDispatchMetadataConsumed: true,
    callbackDispatchBlocked:
      submitDispatch.submitDispatchQueue.callbackDispatchBlocked,
    dispatchQueueEntryWouldBeCreated:
      submitDispatch.submitDispatchQueue.dispatchQueueEntryWouldBeCreated,
    listenerWouldRunAfterSyntheticEvent:
      submitDispatch.submitDispatchQueue.listenerWouldRunAfterSyntheticEvent,
    formDataConstructionBlocked:
      submitDispatch.formDataBlockerLink.formDataConstructionBlocked,
    resetStateWouldBeQueued:
      submitDispatch.resetQueueIntentLink.resetStateWouldBeQueued,
    syntheticEventCreated: false,
    dispatchQueueCaptured: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    formDataConstructed: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createCallbackActionResetExecutionConsumption(
  submitResetExecution
) {
  return freezeRecord({
    metadataOnly: true,
    sourceSubmitResetExecutionId: submitResetExecution.executionId,
    sourceSubmitResetExecutionSequence:
      submitResetExecution.executionSequence,
    sourceSubmitDispatchId:
      submitResetExecution.sourceSubmitDispatchId,
    sourceFormDataBlockerId:
      submitResetExecution.sourceFormDataBlockerId,
    sourceResetIntentRequestId:
      submitResetExecution.sourceResetIntentRequestId,
    submitResetExecutionMetadataConsumed: true,
    blockedFormDataConsumed:
      submitResetExecution.formDataBlockerConsumption
        .blockedFormDataConsumed,
    resetIntentMetadataConsumed:
      submitResetExecution.resetIntentConsumption
        .resetIntentMetadataConsumed,
    fakeSubmitDispatchConsumed:
      submitResetExecution.fakeFormResetExecution
        .fakeSubmitDispatchConsumed,
    fakeFormResetPathExecuted:
      submitResetExecution.fakeFormResetExecution
        .fakeFormResetPathExecuted,
    fakeFormResetRecorded:
      submitResetExecution.fakeFormResetExecution
        .fakeFormResetRecorded,
    resetWouldRunBeforeActionInvocation:
      submitResetExecution.fakeFormResetExecution
        .resetWouldRunBeforeActionInvocation,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createCallbackDispatchPreflight(
  submitDispatch,
  submitResetExecution,
  admission
) {
  const queue = submitDispatch.submitDispatchQueue;
  return freezeRecord({
    status: 'preflighted-private-form-action-callback-dispatch-blocked',
    metadataOnly: true,
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceSubmitResetExecutionId: submitResetExecution.executionId,
    callbackQueueKind: admission.callbackQueueKind,
    eventName: queue.eventName,
    submissionTrigger: queue.submissionTrigger,
    actionIdentityRecorded: true,
    dispatchQueueEntryWouldBeCreated:
      queue.dispatchQueueEntryWouldBeCreated,
    listenerWouldRunAfterSyntheticEvent:
      queue.listenerWouldRunAfterSyntheticEvent,
    nativeNavigationWouldBePrevented:
      queue.nativeNavigationWouldBePrevented,
    pendingStatusWouldBeSet: queue.pendingStatusWouldBeSet,
    actionInvocationWouldBeScheduled:
      queue.actionInvocationWouldBeScheduled,
    resetWouldRunBeforeActionInvocation:
      submitResetExecution.fakeFormResetExecution
        .resetWouldRunBeforeActionInvocation,
    callbackDispatchBlocked: true,
    callbackDispatchWouldExecute: true,
    callbackDispatchPreflighted: true,
    syntheticEventRequiredBeforeDispatch: true,
    syntheticEventCreated: false,
    dispatchQueueCaptured: false,
    listenerDispatchStarted: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    defaultPreventedByGate: false,
    nativeDefaultPrevented: false,
    formDataConstructed: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    blockedReason: 'no-submit-listener-execution'
  });
}

function createActionInvocationPreflight(
  submitDispatch,
  submitResetExecution,
  admission
) {
  const identity = submitDispatch.actionIdentity;
  return freezeRecord({
    status: 'preflighted-private-form-action-invocation-blocked',
    metadataOnly: true,
    sourceSubmitDispatchId: submitDispatch.dispatchId,
    sourceSubmitResetExecutionId: submitResetExecution.executionId,
    sourceFormDataBlockerId: submitDispatch.sourceFormDataBlockerId,
    actionInvocationKind: admission.actionInvocationKind,
    resolvedActionKind: identity.resolvedActionKind,
    actionSource: identity.actionSource,
    formActionKind: identity.formActionKind,
    submitControlActionKind: identity.submitControlActionKind,
    submitControlOverridesFormAction:
      identity.submitControlOverridesFormAction,
    nativeNavigationWouldBePrevented:
      identity.nativeNavigationWouldBePrevented,
    pendingStatusWouldBeSet: identity.pendingStatusWouldBeSet,
    actionInvocationWouldBeScheduled:
      identity.actionInvocationWouldBeScheduled,
    resetWouldRunBeforeActionInvocation:
      submitResetExecution.fakeFormResetExecution
        .resetWouldRunBeforeActionInvocation,
    blockedFormDataConsumed:
      submitResetExecution.formDataBlockerConsumption
        .blockedFormDataConsumed,
    resetIntentMetadataConsumed:
      submitResetExecution.resetIntentConsumption
        .resetIntentMetadataConsumed,
    fakeResetMetadataConsumed: true,
    actionInvocationPreflighted: true,
    formDataRequiredBeforeAction: true,
    rawActionCaptured: false,
    actionFunctionCaptured: false,
    callbackCaptured: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    defaultPreventedByGate: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    blockedReason: 'no-action-function-invocation'
  });
}

function createAsyncCallbackAcceptedMetadataIds(preflight) {
  return freezeRecord({
    ...preflight.acceptedMetadataIds,
    callbackActionPreflightId: preflight.preflightId,
    callbackActionPreflightSequence: preflight.preflightSequence,
    callbackActionPreflightGateId: preflight.gateId
  });
}

function createAsyncCallbackSourcePreflight(preflight) {
  return freezeRecord({
    preflightId: preflight.preflightId,
    preflightSequence: preflight.preflightSequence,
    status: preflight.status,
    requestType: preflight.requestType,
    sourceSubmitDispatchId: preflight.sourceSubmitDispatchId,
    sourceSubmitResetExecutionId:
      preflight.sourceSubmitResetExecutionId,
    sourceFormDataBlockerId: preflight.sourceFormDataBlockerId,
    sourceEventExtractionId: preflight.sourceEventExtractionId,
    sourceResetIntentRequestId: preflight.sourceResetIntentRequestId,
    callbackQueuePreflighted:
      preflight.callbackDispatchPreflight.callbackDispatchPreflighted,
    actionInvocationPreflighted:
      preflight.actionInvocationPreflight.actionInvocationPreflighted,
    pendingStatusWouldBeSet:
      preflight.actionInvocationPreflight.pendingStatusWouldBeSet,
    actionInvocationWouldBeScheduled:
      preflight.actionInvocationPreflight
        .actionInvocationWouldBeScheduled,
    resetWouldRunBeforeActionInvocation:
      preflight.actionInvocationPreflight
        .resetWouldRunBeforeActionInvocation,
    blockedFormDataConsumed:
      preflight.actionInvocationPreflight.blockedFormDataConsumed,
    resetIntentMetadataConsumed:
      preflight.actionInvocationPreflight.resetIntentMetadataConsumed,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    formDataConstructed: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createAsyncCallbackSubmitDispatchConsumption(preflight) {
  const source = preflight.submitDispatchMetadataConsumption;
  return freezeRecord({
    metadataOnly: true,
    sourceCallbackActionPreflightId: preflight.preflightId,
    sourceSubmitDispatchId: source.sourceSubmitDispatchId,
    sourceSubmitDispatchSequence: source.sourceSubmitDispatchSequence,
    sourceFormDataBlockerId: source.sourceFormDataBlockerId,
    sourceEventExtractionId: source.sourceEventExtractionId,
    sourceResetIntentRequestId: source.sourceResetIntentRequestId,
    submitDispatchMetadataConsumed: true,
    actionIdentityRecorded: source.actionIdentityRecorded,
    dispatchQueueRowRecorded: source.dispatchQueueRowRecorded,
    dispatchQueueEntryWouldBeCreated:
      source.dispatchQueueEntryWouldBeCreated,
    listenerWouldRunAfterSyntheticEvent:
      source.listenerWouldRunAfterSyntheticEvent,
    formDataConstructionBlocked:
      source.formDataConstructionBlocked,
    resetStateWouldBeQueued: source.resetStateWouldBeQueued,
    syntheticEventCreated: false,
    dispatchQueueCaptured: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    formDataConstructed: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createAsyncCallbackResetExecutionConsumption(preflight) {
  const source = preflight.submitResetExecutionMetadataConsumption;
  return freezeRecord({
    metadataOnly: true,
    sourceCallbackActionPreflightId: preflight.preflightId,
    sourceSubmitResetExecutionId:
      source.sourceSubmitResetExecutionId,
    sourceSubmitResetExecutionSequence:
      source.sourceSubmitResetExecutionSequence,
    sourceSubmitDispatchId: source.sourceSubmitDispatchId,
    sourceFormDataBlockerId: source.sourceFormDataBlockerId,
    sourceResetIntentRequestId: source.sourceResetIntentRequestId,
    submitResetExecutionMetadataConsumed: true,
    blockedFormDataConsumed: source.blockedFormDataConsumed,
    resetIntentMetadataConsumed: source.resetIntentMetadataConsumed,
    fakeSubmitDispatchConsumed: source.fakeSubmitDispatchConsumed,
    fakeFormResetPathExecuted: source.fakeFormResetPathExecuted,
    fakeFormResetRecorded: source.fakeFormResetRecorded,
    resetWouldRunBeforeActionInvocation:
      source.resetWouldRunBeforeActionInvocation,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createAsyncCallbackPendingStatusMetadata(preflight, admission) {
  const source = preflight.actionInvocationPreflight;
  return freezeRecord({
    status: 'recorded-private-form-action-pending-status-metadata',
    metadataOnly: true,
    sourceCallbackActionPreflightId: preflight.preflightId,
    sourceSubmitDispatchId: preflight.sourceSubmitDispatchId,
    sourceSubmitResetExecutionId:
      preflight.sourceSubmitResetExecutionId,
    payloadKind: admission.payloadKind,
    pendingStatusWouldBeSet: source.pendingStatusWouldBeSet,
    pendingStatusRecorded: true,
    pending: true,
    dataWouldUseBlockedFormDataMetadata: true,
    blockedFormDataConsumed: source.blockedFormDataConsumed,
    actionReferenceWouldBeStored: true,
    methodWouldReadFormMethod: true,
    methodKind: 'unknown',
    formDataConstructed: false,
    realFormInspected: false,
    formPropsRead: false,
    actionFunctionCaptured: false,
    hostTransitionStarted: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function createAsyncCallbackResetMetadata(preflight) {
  const source = preflight.actionInvocationPreflight;
  return freezeRecord({
    status: 'recorded-private-form-action-reset-metadata',
    metadataOnly: true,
    sourceCallbackActionPreflightId: preflight.preflightId,
    sourceSubmitResetExecutionId:
      preflight.sourceSubmitResetExecutionId,
    sourceResetIntentRequestId: preflight.sourceResetIntentRequestId,
    resetIntentMetadataConsumed: source.resetIntentMetadataConsumed,
    fakeResetMetadataConsumed: source.fakeResetMetadataConsumed,
    resetWouldRunBeforeActionInvocation:
      source.resetWouldRunBeforeActionInvocation,
    resetMetadataLinkedBeforeCallback: true,
    resetStateWouldBeQueued:
      preflight.sourceSubmitDispatch.resetStateWouldBeQueued,
    previousDispatcherCalled: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createAsyncCallbackPrivatePayload(
  preflight,
  executionId,
  admission,
  pendingStatusMetadata,
  resetMetadata
) {
  return freezeRecord({
    $$typeof:
      'fast.react_dom.private_form_action_async_callback_payload',
    payloadId: `${executionId}:payload`,
    payloadKind: admission.payloadKind,
    metadataOnly: true,
    sourceCallbackActionPreflightId: preflight.preflightId,
    sourceSubmitDispatchId: preflight.sourceSubmitDispatchId,
    sourceSubmitResetExecutionId:
      preflight.sourceSubmitResetExecutionId,
    pendingStatusMetadataStatus: pendingStatusMetadata.status,
    resetMetadataStatus: resetMetadata.status,
    blockedFormDataConsumed:
      pendingStatusMetadata.blockedFormDataConsumed,
    resetIntentMetadataConsumed:
      resetMetadata.resetIntentMetadataConsumed,
    fakeResetMetadataConsumed: resetMetadata.fakeResetMetadataConsumed,
    formDataConstructed: false,
    syntheticEventCreated: false,
    realFormInspected: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

async function invokePrivateAsyncActionCallback(callback, payload) {
  let callbackResult;
  try {
    callbackResult = callback(payload);
  } catch (error) {
    return freezeRecord({
      outcome: 'threw',
      initialThenableStatus: 'not-created',
      finalThenableStatus: 'threw',
      thenableObserved: false,
      fulfilled: false,
      rejected: false,
      synchronousThrow: true,
      nonThenable: false,
      failClosed: true,
      valueInfo: null,
      errorInfo: describeThrownValue(error)
    });
  }

  let thenMethod;
  try {
    thenMethod =
      callbackResult !== null &&
      (typeof callbackResult === 'object' ||
        typeof callbackResult === 'function')
        ? callbackResult.then
        : null;
  } catch (error) {
    return freezeRecord({
      outcome: 'thenable-inspection-threw',
      initialThenableStatus: 'inspection-threw',
      finalThenableStatus: 'inspection-threw',
      thenableObserved: false,
      fulfilled: false,
      rejected: false,
      synchronousThrow: false,
      nonThenable: false,
      failClosed: true,
      valueInfo: null,
      errorInfo: describeThrownValue(error)
    });
  }

  if (typeof thenMethod !== 'function') {
    return freezeRecord({
      outcome: 'non-thenable',
      initialThenableStatus: 'not-thenable',
      finalThenableStatus: 'not-thenable',
      thenableObserved: false,
      fulfilled: false,
      rejected: false,
      synchronousThrow: false,
      nonThenable: true,
      failClosed: true,
      valueInfo: describeCallbackValue(callbackResult),
      errorInfo: null
    });
  }

  const initialThenableStatus = getThenableStatusLabel(callbackResult);
  try {
    const value = await callbackResult;
    return freezeRecord({
      outcome: 'fulfilled',
      initialThenableStatus,
      finalThenableStatus:
        getThenableStatusLabel(callbackResult) === 'untracked'
          ? 'fulfilled'
          : getThenableStatusLabel(callbackResult),
      thenableObserved: true,
      fulfilled: true,
      rejected: false,
      synchronousThrow: false,
      nonThenable: false,
      failClosed: false,
      valueInfo: describeCallbackValue(value),
      errorInfo: null
    });
  } catch (error) {
    return freezeRecord({
      outcome: 'rejected',
      initialThenableStatus,
      finalThenableStatus:
        getThenableStatusLabel(callbackResult) === 'untracked'
          ? 'rejected'
          : getThenableStatusLabel(callbackResult),
      thenableObserved: true,
      fulfilled: false,
      rejected: true,
      synchronousThrow: false,
      nonThenable: false,
      failClosed: true,
      valueInfo: null,
      errorInfo: describeThrownValue(error)
    });
  }
}

function createAsyncCallbackExecution(
  preflight,
  admission,
  privateCallbackPayload,
  outcome
) {
  return freezeRecord({
    status: createAsyncCallbackExecutionStatus(outcome),
    executionKind: admission.executionKind,
    metadataOnly: false,
    deterministicFakeCallbackOnly: true,
    sourceCallbackActionPreflightId: preflight.preflightId,
    sourceSubmitDispatchId: preflight.sourceSubmitDispatchId,
    sourceSubmitResetExecutionId:
      preflight.sourceSubmitResetExecutionId,
    privateCallbackPayloadId: privateCallbackPayload.payloadId,
    payloadKind: privateCallbackPayload.payloadKind,
    asyncActionCallbackAccepted: true,
    asyncActionCallbackInvoked: true,
    asyncActionCallbackArity: admission.asyncActionCallbackArity,
    asyncActionCallbackName: admission.asyncActionCallbackName,
    asyncActionCallbackDeclaredAsync:
      admission.asyncActionCallbackDeclaredAsync,
    pendingStatusMetadataRecorded: true,
    resetMetadataConsumed: true,
    pendingStatusWouldBeSet:
      preflight.actionInvocationPreflight.pendingStatusWouldBeSet,
    resetWouldRunBeforeActionInvocation:
      preflight.actionInvocationPreflight
        .resetWouldRunBeforeActionInvocation,
    thenableObserved: outcome.thenableObserved,
    initialThenableStatus: outcome.initialThenableStatus,
    finalThenableStatus: outcome.finalThenableStatus,
    callbackOutcome: outcome.outcome,
    fulfilled: outcome.fulfilled,
    rejected: outcome.rejected,
    synchronousThrow: outcome.synchronousThrow,
    nonThenable: outcome.nonThenable,
    failClosed: outcome.failClosed,
    valueInfo: outcome.valueInfo,
    errorInfo: outcome.errorInfo,
    syntheticEventCreated: false,
    dispatchQueueCaptured: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    formDataConstructed: false,
    publicActionFunctionCaptured: false,
    publicActionInvoked: false,
    hostTransitionStarted: false,
    reactUpdateQueued: false,
    resetStateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function createAsyncCallbackExecutionStatus(outcome) {
  if (outcome.fulfilled === true) {
    return 'executed-private-form-action-async-callback-fulfilled';
  }
  if (outcome.rejected === true) {
    return 'failed-private-form-action-async-callback-rejected';
  }
  if (outcome.synchronousThrow === true) {
    return 'failed-private-form-action-async-callback-threw';
  }
  if (outcome.nonThenable === true) {
    return 'failed-private-form-action-async-callback-non-thenable';
  }
  return 'failed-private-form-action-async-callback-inspection';
}

function createAsyncCallbackExecutionSideEffects(outcome) {
  if (outcome.fulfilled === true) {
    return formActionAsyncCallbackExecutionFulfilledSideEffects;
  }
  if (outcome.rejected === true) {
    return formActionAsyncCallbackExecutionRejectedSideEffects;
  }
  if (outcome.synchronousThrow === true) {
    return formActionAsyncCallbackExecutionSynchronousThrowSideEffects;
  }
  return formActionAsyncCallbackExecutionNonThenableSideEffects;
}

function createRejectedErrorPreflightAcceptedMetadataIds(asyncExecution) {
  return freezeRecord({
    ...asyncExecution.acceptedMetadataIds,
    asyncCallbackExecutionId: asyncExecution.executionId,
    asyncCallbackExecutionSequence: asyncExecution.executionSequence,
    asyncCallbackExecutionGateId: asyncExecution.gateId,
    callbackActionPreflightId:
      asyncExecution.sourceCallbackActionPreflightId
  });
}

function createRejectedErrorSourceAsyncCallbackExecution(asyncExecution) {
  const callbackExecution = asyncExecution.callbackExecution;
  return freezeRecord({
    executionId: asyncExecution.executionId,
    executionSequence: asyncExecution.executionSequence,
    status: asyncExecution.status,
    requestType: asyncExecution.requestType,
    sourceCallbackActionPreflightId:
      asyncExecution.sourceCallbackActionPreflightId,
    sourceSubmitDispatchId: asyncExecution.sourceSubmitDispatchId,
    sourceSubmitResetExecutionId:
      asyncExecution.sourceSubmitResetExecutionId,
    pendingStatusRecorded:
      asyncExecution.pendingStatusMetadata.pendingStatusRecorded,
    resetMetadataConsumed:
      asyncExecution.resetMetadata.resetIntentMetadataConsumed,
    callbackExecutionStatus: callbackExecution.status,
    callbackOutcome: callbackExecution.callbackOutcome,
    thenableObserved: callbackExecution.thenableObserved,
    initialThenableStatus: callbackExecution.initialThenableStatus,
    finalThenableStatus: callbackExecution.finalThenableStatus,
    rejected: callbackExecution.rejected,
    failClosed: callbackExecution.failClosed,
    errorInfo: callbackExecution.errorInfo,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionInvoked: false,
    publicActionInvoked: false,
    hostTransitionStarted: false,
    reactUpdateQueued: false,
    resetStateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createRejectedAsyncActionErrorMetadata(
  asyncExecution,
  admission
) {
  const callbackExecution = asyncExecution.callbackExecution;
  return freezeRecord({
    status: 'preflighted-private-form-action-rejected-error-metadata',
    metadataOnly: true,
    preflightOnly: true,
    errorChannel: admission.errorChannel,
    sourceAsyncCallbackExecutionId: asyncExecution.executionId,
    sourceCallbackActionPreflightId:
      asyncExecution.sourceCallbackActionPreflightId,
    sourceSubmitDispatchId: asyncExecution.sourceSubmitDispatchId,
    sourceSubmitResetExecutionId:
      asyncExecution.sourceSubmitResetExecutionId,
    callbackOutcome: callbackExecution.callbackOutcome,
    thenableObserved: callbackExecution.thenableObserved,
    initialThenableStatus: callbackExecution.initialThenableStatus,
    finalThenableStatus: callbackExecution.finalThenableStatus,
    rejected: callbackExecution.rejected,
    failClosed: callbackExecution.failClosed,
    errorInfo: callbackExecution.errorInfo,
    rawErrorCaptured: false,
    errorObjectExposed: false,
    publicErrorRoutingStarted: false,
    publicRootErrorCallbackInvoked: false,
    errorBoundaryScheduled: false,
    compatibilityClaimed: false
  });
}

function createRejectedActionErrorPreflight(
  asyncExecution,
  admission,
  rejectedAsyncActionError
) {
  const preflight = asyncExecution.sourceCallbackActionPreflight;
  return freezeRecord({
    status: 'preflighted-private-form-action-rejected-action-error-blocked',
    metadataOnly: true,
    preflightOnly: true,
    diagnosticKind: admission.diagnosticKind,
    sourceAsyncCallbackExecutionId: asyncExecution.executionId,
    sourceCallbackActionPreflightId:
      asyncExecution.sourceCallbackActionPreflightId,
    sourceSubmitDispatchId: asyncExecution.sourceSubmitDispatchId,
    sourceSubmitResetExecutionId:
      asyncExecution.sourceSubmitResetExecutionId,
    rejectedErrorMetadataStatus: rejectedAsyncActionError.status,
    actionInvocationWouldBeScheduled:
      preflight.actionInvocationWouldBeScheduled,
    pendingStatusWouldBeSet: preflight.pendingStatusWouldBeSet,
    resetWouldRunBeforeActionInvocation:
      preflight.resetWouldRunBeforeActionInvocation,
    blockedFormDataConsumed: preflight.blockedFormDataConsumed,
    resetIntentMetadataConsumed:
      preflight.resetIntentMetadataConsumed,
    callbackOutcome: rejectedAsyncActionError.callbackOutcome,
    rejected: rejectedAsyncActionError.rejected,
    failClosed: rejectedAsyncActionError.failClosed,
    rawErrorCaptured: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    publicActionInvoked: false,
    hostTransitionStarted: false,
    publicErrorRoutingWouldBeRequired: true,
    publicErrorRoutingStarted: false,
    rootErrorUpdateScheduled: false,
    publicRootErrorCallbackInvoked: false,
    errorBoundaryScheduled: false,
    reactUpdateQueued: false,
    resetStateQueued: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    blockedReason: 'no-public-error-routing'
  });
}

function createRejectedErrorResetActionPublicBlockers(asyncExecution) {
  return freezeRecord({
    status:
      'blocked-public-form-action-reset-and-rejected-error-routing',
    metadataOnly: true,
    sourceAsyncCallbackExecutionId: asyncExecution.executionId,
    sourceSubmitResetExecutionId:
      asyncExecution.sourceSubmitResetExecutionId,
    sourceResetIntentRequestId:
      asyncExecution.sourceResetIntentRequestId,
    publicFormActionsEnabled: false,
    publicFormSubmissionReachable: false,
    publicSubmitDispatchReachable: false,
    publicRequestFormResetReachable: false,
    publicActionInvocationReachable: false,
    publicErrorRoutingReachable: false,
    publicRootTouched: false,
    formDataConstructed: false,
    actionInvoked: false,
    publicActionInvoked: false,
    hostTransitionStarted: false,
    previousDispatcherCalled: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    rootErrorUpdateScheduled: false,
    publicRootErrorCallbackInvoked: false,
    errorBoundaryScheduled: false,
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

function createPublicFormActionSubmitDispatchBoundary() {
  return freezeRecord({
    status: 'blocked-public-form-action-submit-dispatch-compatibility',
    publicFormActionsEnabled: false,
    publicRequestFormResetReachable: false,
    publicRootTouched: false,
    realFormAccepted: false,
    realFormInspected: false,
    submitDispatchReachable: false,
    callbackDispatchExecuted: false,
    formDataConstructed: false,
    actionInvoked: false,
    reactUpdateQueued: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createPublicFormActionSubmitResetExecutionBoundary() {
  return freezeRecord({
    status:
      'blocked-public-form-action-submit-reset-execution-compatibility',
    publicFormActionsEnabled: false,
    publicRequestFormResetReachable: false,
    publicRootTouched: false,
    realFormAccepted: false,
    realFormInspected: false,
    submitDispatchReachable: false,
    callbackDispatchExecuted: false,
    formDataConstructed: false,
    actionInvoked: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createPublicFormActionCallbackActionPreflightBoundary() {
  return freezeRecord({
    status:
      'blocked-public-form-action-callback-action-preflight-compatibility',
    publicFormActionsEnabled: false,
    publicRequestFormResetReachable: false,
    publicRootTouched: false,
    realFormAccepted: false,
    realFormInspected: false,
    submitDispatchReachable: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createPublicFormActionAsyncCallbackExecutionBoundary() {
  return freezeRecord({
    status:
      'blocked-public-form-action-async-callback-execution-compatibility',
    publicFormActionsEnabled: false,
    publicRequestFormResetReachable: false,
    publicRootTouched: false,
    realFormAccepted: false,
    realFormInspected: false,
    submitDispatchReachable: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    privateAsyncActionCallbackPubliclyReachable: false,
    hostTransitionStarted: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createPublicFormActionRejectedErrorPreflightBoundary() {
  return freezeRecord({
    status:
      'blocked-public-form-action-rejected-error-preflight-compatibility',
    publicFormActionsEnabled: false,
    publicRequestFormResetReachable: false,
    publicFormSubmissionReachable: false,
    publicSubmitDispatchReachable: false,
    publicErrorRoutingReachable: false,
    publicRootTouched: false,
    realFormAccepted: false,
    realFormInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    publicActionInvoked: false,
    privateAsyncActionCallbackPubliclyReachable: false,
    hostTransitionStarted: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    rootErrorUpdateScheduled: false,
    publicRootErrorCallbackInvoked: false,
    errorBoundaryScheduled: false,
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

function getSubmitDispatchStringProperty(record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidSubmitDispatchAdmission(`${key} must be a non-empty string`);
}

function getSubmitResetExecutionStringProperty(record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidSubmitResetExecutionAdmission(
    `${key} must be a non-empty string`
  );
}

function getSubmitResetExecutionShapeStringProperty(record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidSubmitResetExecutionAdmission(
    `fakeFormPath.${key} must be a non-empty string`
  );
}

function getCallbackActionPreflightStringProperty(record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidCallbackActionPreflightAdmission(
    `${key} must be a non-empty string`
  );
}

function getAsyncCallbackExecutionStringProperty(record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidAsyncCallbackExecutionAdmission(
    `${key} must be a non-empty string`
  );
}

function getRejectedErrorPreflightStringProperty(record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidRejectedErrorPreflightAdmission(
    `${key} must be a non-empty string`
  );
}

function getThenableStatusLabel(value) {
  if (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof value.status === 'string' &&
    value.status.length > 0
  ) {
    return value.status;
  }
  return 'untracked';
}

function describeCallbackValue(value) {
  if (value === null) {
    return freezeRecord({ type: 'null' });
  }
  const type = typeof value;
  if (type === 'string') {
    return freezeRecord({ type, length: value.length });
  }
  if (type === 'number' || type === 'boolean' || type === 'undefined') {
    return freezeRecord({ type });
  }
  if (type === 'symbol') {
    return freezeRecord({ type });
  }
  if (type === 'function') {
    return freezeRecord({
      type,
      name: value.name || 'anonymous',
      length: value.length
    });
  }
  if (Array.isArray(value)) {
    return freezeRecord({
      type: 'array',
      length: value.length
    });
  }
  return freezeRecord({
    type,
    constructorName:
      value.constructor && typeof value.constructor.name === 'string'
        ? value.constructor.name
        : null,
    ownKeyCount: Object.keys(value).length
  });
}

function describeThrownValue(value) {
  if (value instanceof Error) {
    return freezeRecord({
      type: 'error',
      name: value.name,
      message: value.message
    });
  }
  return freezeRecord({
    type: typeof value,
    message: String(value)
  });
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

function throwInvalidSubmitDispatchAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM form action submit dispatch admission: ${reason}.`
  );
  error.name = 'FastReactDomFormActionSubmitDispatchGateError';
  error.code = privateFormActionSubmitDispatchInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidSubmitDispatchRecord(reason) {
  const error = new Error(
    `Invalid private React DOM form action submit dispatch record: ${reason}.`
  );
  error.name = 'FastReactDomFormActionSubmitDispatchGateError';
  error.code = privateFormActionSubmitDispatchInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidSubmitResetExecutionAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM form action submit reset execution admission: ${reason}.`
  );
  error.name = 'FastReactDomFormActionSubmitResetExecutionGateError';
  error.code = privateFormActionSubmitResetExecutionInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidSubmitResetExecutionRecord(reason) {
  const error = new Error(
    `Invalid private React DOM form action submit reset execution record: ${reason}.`
  );
  error.name = 'FastReactDomFormActionSubmitResetExecutionGateError';
  error.code = privateFormActionSubmitResetExecutionInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidCallbackActionPreflightAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM form action callback/action invocation preflight admission: ${reason}.`
  );
  error.name = 'FastReactDomFormActionCallbackActionPreflightGateError';
  error.code =
    privateFormActionCallbackActionPreflightInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidCallbackActionPreflightRecord(reason) {
  const error = new Error(
    `Invalid private React DOM form action callback/action invocation preflight record: ${reason}.`
  );
  error.name = 'FastReactDomFormActionCallbackActionPreflightGateError';
  error.code = privateFormActionCallbackActionPreflightInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidAsyncCallbackExecutionAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM form action async callback execution admission: ${reason}.`
  );
  error.name = 'FastReactDomFormActionAsyncCallbackExecutionGateError';
  error.code = privateFormActionAsyncCallbackExecutionInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidAsyncCallbackExecutionRecord(reason) {
  const error = new Error(
    `Invalid private React DOM form action async callback execution record: ${reason}.`
  );
  error.name = 'FastReactDomFormActionAsyncCallbackExecutionGateError';
  error.code = privateFormActionAsyncCallbackExecutionInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidRejectedErrorPreflightAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM form action rejected-error preflight admission: ${reason}.`
  );
  error.name = 'FastReactDomFormActionRejectedErrorPreflightGateError';
  error.code =
    privateFormActionRejectedErrorPreflightInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidRejectedErrorPreflightRecord(reason) {
  const error = new Error(
    `Invalid private React DOM form action rejected-error preflight record: ${reason}.`
  );
  error.name = 'FastReactDomFormActionRejectedErrorPreflightGateError';
  error.code = privateFormActionRejectedErrorPreflightInvalidRecordCode;
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
  createFormActionAsyncCallbackExecutionDiagnosticGate,
  createFormActionCallbackActionPreflightDiagnosticGate,
  createFormActionFormDataBlockerDiagnosticGate,
  createFormActionRejectedErrorPreflightDiagnosticGate,
  createFormActionSubmitDispatchDiagnosticGate,
  createFormActionSubmitResetExecutionDiagnosticGate,
  createUnsupportedFormActionAsyncCallbackExecutionError,
  createUnsupportedFormActionCallbackActionPreflightError,
  createUnsupportedFormActionFormDataBlockerError,
  createUnsupportedFormActionRejectedErrorPreflightError,
  createUnsupportedFormActionSubmitDispatchError,
  createUnsupportedFormActionSubmitResetExecutionError,
  describePrivateFormActionAsyncCallbackExecutionGate,
  describePrivateFormActionCallbackActionPreflightGate,
  describePrivateFormActionFormDataBlockerGate,
  describePrivateFormActionRejectedErrorPreflightGate,
  describePrivateFormActionSubmitDispatchGate,
  describePrivateFormActionSubmitResetExecutionGate,
  formActionAsyncCallbackExecutionBlockedSideEffects,
  formActionAsyncCallbackExecutionFulfilledSideEffects,
  formActionAsyncCallbackExecutionGateSchemaVersion,
  formActionAsyncCallbackExecutionMissingPrerequisites,
  formActionAsyncCallbackExecutionNonThenableSideEffects,
  formActionAsyncCallbackExecutionRejectedSideEffects,
  formActionAsyncCallbackExecutionSynchronousThrowSideEffects,
  formActionCallbackActionPreflightBlockedSideEffects,
  formActionCallbackActionPreflightDiagnosticSideEffects,
  formActionCallbackActionPreflightGateSchemaVersion,
  formActionCallbackActionPreflightMissingPrerequisites,
  formActionFormDataBlockerBlockedSideEffects,
  formActionFormDataBlockerDiagnosticSideEffects,
  formActionFormDataBlockerGateSchemaVersion,
  formActionFormDataBlockerMissingPrerequisites,
  formActionRejectedErrorPreflightBlockedSideEffects,
  formActionRejectedErrorPreflightDiagnosticSideEffects,
  formActionRejectedErrorPreflightGateSchemaVersion,
  formActionRejectedErrorPreflightMissingPrerequisites,
  formActionSubmitDispatchBlockedSideEffects,
  formActionSubmitDispatchDiagnosticSideEffects,
  formActionSubmitDispatchGateSchemaVersion,
  formActionSubmitDispatchMissingPrerequisites,
  formActionSubmitResetExecutionBlockedSideEffects,
  formActionSubmitResetExecutionDiagnosticSideEffects,
  formActionSubmitResetExecutionGateSchemaVersion,
  formActionSubmitResetExecutionMissingPrerequisites,
  getPrivateFormActionAsyncCallbackExecutionRecordPayload,
  getPrivateFormActionCallbackActionPreflightRecordPayload,
  getPrivateFormActionFormDataBlockerRecordPayload,
  getPrivateFormActionRejectedErrorPreflightRecordPayload,
  getPrivateFormActionSubmitDispatchRecordPayload,
  getPrivateFormActionSubmitResetExecutionRecordPayload,
  isPrivateFormActionAsyncCallbackExecutionRecord,
  isPrivateFormActionCallbackActionPreflightRecord,
  isPrivateFormActionFormDataBlockerRecord,
  isPrivateFormActionRejectedErrorPreflightRecord,
  isPrivateFormActionSubmitDispatchRecord,
  isPrivateFormActionSubmitResetExecutionRecord,
  privateFormActionAsyncCallbackExecutionGateErrorCode,
  privateFormActionAsyncCallbackExecutionGateId,
  privateFormActionAsyncCallbackExecutionInvalidAdmissionCode,
  privateFormActionAsyncCallbackExecutionInvalidRecordCode,
  privateFormActionAsyncCallbackExecutionRecordedStatus,
  privateFormActionAsyncCallbackExecutionRecordType,
  privateFormActionAsyncCallbackExecutionStatus,
  privateFormActionCallbackActionPreflightGateErrorCode,
  privateFormActionCallbackActionPreflightGateId,
  privateFormActionCallbackActionPreflightInvalidAdmissionCode,
  privateFormActionCallbackActionPreflightInvalidRecordCode,
  privateFormActionCallbackActionPreflightRecordedStatus,
  privateFormActionCallbackActionPreflightRecordType,
  privateFormActionCallbackActionPreflightStatus,
  privateFormActionFormDataBlockerGateErrorCode,
  privateFormActionFormDataBlockerGateId,
  privateFormActionFormDataBlockerInvalidAdmissionCode,
  privateFormActionFormDataBlockerInvalidRecordCode,
  privateFormActionFormDataBlockerRecordedStatus,
  privateFormActionFormDataBlockerRecordType,
  privateFormActionFormDataBlockerStatus,
  privateFormActionRejectedErrorPreflightGateErrorCode,
  privateFormActionRejectedErrorPreflightGateId,
  privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
  privateFormActionRejectedErrorPreflightInvalidRecordCode,
  privateFormActionRejectedErrorPreflightRecordedStatus,
  privateFormActionRejectedErrorPreflightRecordType,
  privateFormActionRejectedErrorPreflightStatus,
  privateFormActionSubmitDispatchGateErrorCode,
  privateFormActionSubmitDispatchGateId,
  privateFormActionSubmitDispatchInvalidAdmissionCode,
  privateFormActionSubmitDispatchInvalidRecordCode,
  privateFormActionSubmitDispatchRecordedStatus,
  privateFormActionSubmitDispatchRecordType,
  privateFormActionSubmitDispatchStatus,
  privateFormActionSubmitResetExecutionGateErrorCode,
  privateFormActionSubmitResetExecutionGateId,
  privateFormActionSubmitResetExecutionInvalidAdmissionCode,
  privateFormActionSubmitResetExecutionInvalidRecordCode,
  privateFormActionSubmitResetExecutionRecordedStatus,
  privateFormActionSubmitResetExecutionRecordType,
  privateFormActionSubmitResetExecutionStatus,
  recordFormActionAsyncCallbackExecution,
  recordFormActionCallbackActionInvocationPreflight,
  recordFormActionFormDataBlockerDiagnostic,
  recordFormActionRejectedErrorPreflight,
  recordFormActionSubmitDispatchDiagnostic,
  recordFormActionSubmitResetExecution
};
