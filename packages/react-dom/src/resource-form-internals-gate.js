'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  unimplementedCode
} = require('../placeholder-utils.js');

const hasOwn = Object.prototype.hasOwnProperty;

const resourceFormActionInternalsGateSchemaVersion = 1;
const formActionResetDispatcherGateSchemaVersion = 1;
const formActionEventExtractionGateSchemaVersion = 1;
const formActionResetQueueCommitGateSchemaVersion = 1;
const resourceHintDispatcherMetadataGateSchemaVersion = 1;
const resourceHintFakeDomAdapterGateSchemaVersion = 1;
const resourceHintFakeDomInsertionGateSchemaVersion = 1;
const resourceHintHeadBoundaryGateSchemaVersion = 1;
const resourceHintHeadClearRetainGateSchemaVersion = 1;
const resourceHintPreloadPreinitOrderGateSchemaVersion = 1;
const resourceHintStylesheetPrecedenceGateSchemaVersion = 1;
const resourceHintResourceMapCommitGateSchemaVersion = 1;
const resourceHintStylesheetLoadErrorStateGateSchemaVersion = 1;
const controlledInputValueTrackerGateSchemaVersion = 1;
const controlledInputValueTrackerFakeDomDiagnosticGateSchemaVersion = 1;
const controlledInputPrivateRestoreQueueDiagnosticGateSchemaVersion = 1;
const controlledInputPrivateWrapperGateSchemaVersion = 1;
const privateResourceFormActionGateRecordType =
  'fast.react_dom.private_resource_form_action_gate_record';
const privateFormActionResetDispatcherRecordType =
  'fast.react_dom.private_form_action_reset_dispatcher_record';
const privateFormActionEventExtractionRecordType =
  'fast.react_dom.private_form_action_event_extraction_record';
const privateFormActionResetQueueCommitRecordType =
  'fast.react_dom.private_form_action_reset_queue_commit_record';
const privateResourceHintDispatcherMetadataRecordType =
  'fast.react_dom.private_resource_hint_dispatcher_metadata_record';
const privateResourceHintFakeDomAdapterAdmissionRecordType =
  'fast.react_dom.private_resource_hint_fake_dom_adapter_admission_record';
const privateResourceHintFakeDomInsertionRecordType =
  'fast.react_dom.private_resource_hint_fake_dom_insertion_record';
const privateResourceHintHeadBoundaryRecordType =
  'fast.react_dom.private_resource_hint_head_singleton_boundary_record';
const privateResourceHintHeadClearRetainRecordType =
  'fast.react_dom.private_resource_hint_head_clear_retain_record';
const privateResourceHintPreloadPreinitOrderRecordType =
  'fast.react_dom.private_resource_hint_preload_preinit_order_record';
const privateResourceHintStylesheetPrecedenceRecordType =
  'fast.react_dom.private_resource_hint_stylesheet_precedence_record';
const privateResourceHintResourceMapCommitRecordType =
  'fast.react_dom.private_resource_hint_resource_map_commit_record';
const privateResourceHintStylesheetLoadErrorStateRecordType =
  'fast.react_dom.private_resource_hint_stylesheet_load_error_state_record';
const privateControlledInputValueTrackerGateRecordType =
  'fast.react_dom.private_controlled_input_value_tracker_gate_record';
const privateControlledInputValueTrackerFakeDomDiagnosticRecordType =
  'fast.react_dom.private_controlled_input_value_tracker_fake_dom_diagnostic_record';
const privateControlledInputRestoreQueueDiagnosticRecordType =
  'fast.react_dom.private_controlled_input_restore_queue_diagnostic_record';
const privateControlledInputWrapperPropertyPayloadRecordType =
  'fast.react_dom.private_controlled_input_wrapper_property_payload_record';
const privateResourceHintDispatcherMetadataGateId =
  'resource-hint-private-dispatcher-metadata-gate-1';
const privateResourceHintFakeDomAdapterGateId =
  'resource-hint-private-dispatcher-fake-dom-adapter-gate-1';
const privateResourceHintFakeDomInsertionGateId =
  'resource-hint-private-fake-dom-insertion-gate-1';
const privateResourceHintHeadBoundaryGateId =
  'resource-hint-head-singleton-private-gate-1';
const privateResourceHintHeadClearRetainGateId =
  'resource-hint-head-clear-retain-private-gate-1';
const privateResourceHintPreloadPreinitOrderGateId =
  'resource-hint-preload-preinit-dedupe-order-private-gate-1';
const privateResourceHintStylesheetPrecedenceGateId =
  'resource-hint-stylesheet-precedence-private-gate-1';
const privateResourceHintResourceMapCommitGateId =
  'resource-hint-resource-map-commit-private-gate-1';
const privateResourceHintStylesheetLoadErrorStateGateId =
  'resource-hint-stylesheet-load-error-state-private-gate-1';
const privateFormActionResetDispatcherGateId =
  'form-action-reset-private-dispatcher-gate-1';
const privateFormActionEventExtractionGateId =
  'form-action-event-extraction-private-gate-1';
const privateFormActionResetQueueCommitGateId =
  'form-action-reset-queue-commit-private-gate-1';
const privateResourceHintFakeDomAdapterAdmissionRequiredStatus =
  'blocked-private-resource-hint-fake-dom-adapter-admission-required';
const privateResourceHintFakeDomAdapterAdmissionStatus =
  'admitted-private-resource-hint-fake-dom-adapter-record';
const privateResourceHintFakeDomAdapterExecutionBlockedStatus =
  'blocked-private-resource-hint-fake-dom-adapter-execution';
const privateResourceHintFakeDomAdapterCompatibilityBlockedStatus =
  'blocked-private-resource-hint-fake-dom-adapter-compatibility';
const privateResourceHintFakeDomInsertionAdmissionRequiredStatus =
  'blocked-private-resource-hint-fake-dom-insertion-admission-required';
const privateResourceHintFakeDomInsertionStatus =
  'admitted-private-resource-hint-fake-dom-insertion-record';
const privateResourceHintFakeDomInsertionExecutionStatus =
  'executed-private-resource-hint-deterministic-fake-dom-insertion';
const privateResourceHintFakeDomInsertionCompatibilityBlockedStatus =
  'blocked-private-resource-hint-fake-dom-insertion-compatibility';
const privateResourceHintHeadBoundaryAdmissionRequiredStatus =
  'blocked-private-resource-hint-head-singleton-boundary-admission-required';
const privateResourceHintHeadBoundaryStatus =
  'admitted-private-resource-hint-head-singleton-insertion-update-boundary-record';
const privateResourceHintHeadBoundaryExecutionStatus =
  'executed-private-resource-hint-fake-dom-head-singleton-insertion-update-boundary';
const privateResourceHintHeadBoundaryCompatibilityBlockedStatus =
  'blocked-private-resource-hint-head-singleton-boundary-compatibility';
const privateResourceHintHeadClearRetainAdmissionRequiredStatus =
  'blocked-private-resource-hint-head-clear-retain-admission-required';
const privateResourceHintHeadClearRetainStatus =
  'admitted-private-resource-hint-head-clear-retain-diagnostic-record';
const privateResourceHintHeadClearRetainExecutionStatus =
  'diagnosed-private-resource-hint-fake-dom-head-clear-retain';
const privateResourceHintHeadClearRetainCompatibilityBlockedStatus =
  'blocked-private-resource-hint-head-clear-retain-compatibility';
const privateResourceHintHeadStylesheetPrecedenceBlockedStatus =
  'blocked-private-resource-hint-head-stylesheet-precedence';
const privateResourceHintPreloadPreinitOrderAdmissionRequiredStatus =
  'blocked-private-resource-hint-preload-preinit-dedupe-order-admission-required';
const privateResourceHintPreloadPreinitOrderStatus =
  'admitted-private-resource-hint-preload-preinit-dedupe-order-record';
const privateResourceHintPreloadPreinitOrderExecutionStatus =
  'diagnosed-private-resource-hint-fake-dom-preload-preinit-dedupe-order';
const privateResourceHintPreloadPreinitOrderCompatibilityBlockedStatus =
  'blocked-private-resource-hint-preload-preinit-dedupe-order-compatibility';
const privateResourceHintStylesheetPrecedenceAdmissionRequiredStatus =
  'blocked-private-resource-hint-stylesheet-precedence-admission-required';
const privateResourceHintStylesheetPrecedenceStatus =
  'admitted-private-resource-hint-stylesheet-precedence-record';
const privateResourceHintStylesheetPrecedenceExecutionStatus =
  'diagnosed-private-resource-hint-fake-dom-stylesheet-precedence-order';
const privateResourceHintStylesheetPrecedenceCompatibilityBlockedStatus =
  'blocked-private-resource-hint-stylesheet-precedence-compatibility';
const privateResourceHintResourceMapCommitAdmissionRequiredStatus =
  'blocked-private-resource-hint-resource-map-commit-admission-required';
const privateResourceHintResourceMapCommitStatus =
  'admitted-private-resource-hint-resource-map-commit-record';
const privateResourceHintResourceMapCommitExecutionStatus =
  'diagnosed-private-resource-hint-resource-map-commit-records';
const privateResourceHintResourceMapCommitCompatibilityBlockedStatus =
  'blocked-private-resource-hint-resource-map-commit-compatibility';
const privateResourceHintStylesheetLoadErrorStateAdmissionRequiredStatus =
  'blocked-private-resource-hint-stylesheet-load-error-state-admission-required';
const privateResourceHintStylesheetLoadErrorStateStatus =
  'admitted-private-resource-hint-stylesheet-load-error-state-record';
const privateResourceHintStylesheetLoadErrorStateExecutionStatus =
  'diagnosed-private-resource-hint-fake-dom-stylesheet-load-error-state';
const privateResourceHintStylesheetLoadErrorStateCompatibilityBlockedStatus =
  'blocked-private-resource-hint-stylesheet-load-error-state-compatibility';
const privateResourceHintStylesheetLoadStateCommitTransitionStatus =
  'recorded-private-resource-hint-fake-resource-map-stylesheet-load-state-transition';
const privateFormActionResetDispatcherStatus =
  'private-form-action-reset-dispatcher-metadata-only';
const privateFormActionResetQueueCommitStatus =
  'private-form-action-reset-queue-commit-metadata-only';
const privateFormActionSubmissionIntentRecordedStatus =
  'recorded-private-form-action-submission-intent';
const privateFormActionResetIntentRecordedStatus =
  'recorded-private-form-action-reset-intent';
const privateFormActionEventExtractionStatus =
  'private-form-action-event-extraction-metadata-only';
const privateFormActionEventExtractionRecordedStatus =
  'recorded-private-form-action-event-extraction-metadata';
const privateFormActionResetQueueCommitRecordedStatus =
  'recorded-private-form-action-reset-queue-commit-boundary';
const privateResourceFormActionGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ACTION_GATE';
const privateResourceFormActionGateUnknownRequestCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ACTION_GATE_UNKNOWN_REQUEST';
const privateFormActionResetDispatcherGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_RESET_DISPATCHER_GATE';
const privateFormActionResetDispatcherInvalidIntentCode =
  'FAST_REACT_DOM_FORM_ACTION_RESET_DISPATCHER_INVALID_INTENT';
const privateFormActionResetDispatcherInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_RESET_DISPATCHER_INVALID_RECORD';
const privateFormActionResetDispatcherUnknownIntentCode =
  'FAST_REACT_DOM_FORM_ACTION_RESET_DISPATCHER_UNKNOWN_INTENT';
const privateFormActionEventExtractionGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_EVENT_EXTRACTION_GATE';
const privateFormActionEventExtractionInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_EVENT_EXTRACTION_INVALID_RECORD';
const privateFormActionResetQueueCommitGateErrorCode =
  'FAST_REACT_DOM_FORM_ACTION_RESET_QUEUE_COMMIT_GATE';
const privateFormActionResetQueueCommitInvalidAdmissionCode =
  'FAST_REACT_DOM_FORM_ACTION_RESET_QUEUE_COMMIT_INVALID_ADMISSION';
const privateFormActionResetQueueCommitInvalidRecordCode =
  'FAST_REACT_DOM_FORM_ACTION_RESET_QUEUE_COMMIT_INVALID_RECORD';
const privateResourceHintDispatcherMetadataGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_DISPATCHER_METADATA_GATE';
const privateResourceHintDispatcherMetadataInvalidShapeCode =
  'FAST_REACT_DOM_RESOURCE_HINT_DISPATCHER_METADATA_INVALID_SHAPE';
const privateResourceHintDispatcherMetadataUnknownRequestCode =
  'FAST_REACT_DOM_RESOURCE_HINT_DISPATCHER_METADATA_UNKNOWN_REQUEST';
const privateResourceHintFakeDomAdapterGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_FAKE_DOM_ADAPTER_GATE';
const privateResourceHintFakeDomAdapterInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_FAKE_DOM_ADAPTER_INVALID_RECORD';
const privateResourceHintFakeDomAdapterInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_FAKE_DOM_ADAPTER_INVALID_ADMISSION';
const privateResourceHintFakeDomInsertionGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_FAKE_DOM_INSERTION_GATE';
const privateResourceHintFakeDomInsertionInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_FAKE_DOM_INSERTION_INVALID_RECORD';
const privateResourceHintFakeDomInsertionInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_FAKE_DOM_INSERTION_INVALID_ADMISSION';
const privateResourceHintHeadBoundaryGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_HEAD_SINGLETON_BOUNDARY_GATE';
const privateResourceHintHeadBoundaryInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_HEAD_SINGLETON_BOUNDARY_INVALID_RECORD';
const privateResourceHintHeadBoundaryInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_HEAD_SINGLETON_BOUNDARY_INVALID_ADMISSION';
const privateResourceHintHeadClearRetainGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_HEAD_CLEAR_RETAIN_GATE';
const privateResourceHintHeadClearRetainInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_HEAD_CLEAR_RETAIN_INVALID_RECORD';
const privateResourceHintHeadClearRetainInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_HEAD_CLEAR_RETAIN_INVALID_ADMISSION';
const privateResourceHintPreloadPreinitOrderGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_PRELOAD_PREINIT_ORDER_GATE';
const privateResourceHintPreloadPreinitOrderInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_PRELOAD_PREINIT_ORDER_INVALID_RECORD';
const privateResourceHintPreloadPreinitOrderInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_PRELOAD_PREINIT_ORDER_INVALID_ADMISSION';
const privateResourceHintStylesheetPrecedenceGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_STYLESHEET_PRECEDENCE_GATE';
const privateResourceHintStylesheetPrecedenceInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_STYLESHEET_PRECEDENCE_INVALID_RECORD';
const privateResourceHintStylesheetPrecedenceInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_STYLESHEET_PRECEDENCE_INVALID_ADMISSION';
const privateResourceHintResourceMapCommitGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_RESOURCE_MAP_COMMIT_GATE';
const privateResourceHintResourceMapCommitInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_RESOURCE_MAP_COMMIT_INVALID_RECORD';
const privateResourceHintResourceMapCommitInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_RESOURCE_MAP_COMMIT_INVALID_ADMISSION';
const privateResourceHintStylesheetLoadErrorStateGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_STYLESHEET_LOAD_ERROR_STATE_GATE';
const privateResourceHintStylesheetLoadErrorStateInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_STYLESHEET_LOAD_ERROR_STATE_INVALID_RECORD';
const privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_STYLESHEET_LOAD_ERROR_STATE_INVALID_ADMISSION';
const privateControlledInputValueTrackerGateErrorCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE';
const privateControlledInputValueTrackerGateUnknownScenarioCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE_UNKNOWN_SCENARIO';
const privateControlledInputValueTrackerGateInvalidScenarioCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE_INVALID_SCENARIO';
const privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_FAKE_DOM_DIAGNOSTIC_INVALID_ADMISSION';
const privateControlledInputValueTrackerFakeDomDiagnosticInvalidRecordCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_FAKE_DOM_DIAGNOSTIC_INVALID_RECORD';
const privateControlledInputValueTrackerFakeDomDiagnosticInactiveRecordCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_FAKE_DOM_DIAGNOSTIC_INACTIVE_RECORD';
const privateControlledInputRestoreQueueDiagnosticGateErrorCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_RESTORE_QUEUE_DIAGNOSTIC_GATE';
const privateControlledInputRestoreQueueDiagnosticInvalidAdmissionCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_RESTORE_QUEUE_DIAGNOSTIC_INVALID_ADMISSION';
const privateControlledInputRestoreQueueDiagnosticInvalidObservationCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_RESTORE_QUEUE_DIAGNOSTIC_INVALID_OBSERVATION';
const privateControlledInputRestoreQueueDiagnosticInvalidRecordCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_RESTORE_QUEUE_DIAGNOSTIC_INVALID_RECORD';
const unsupportedStatus = 'unsupported';
const controlledInputValueTrackerGateId =
  'controlled-input-value-tracker-private-gate-1';
const controlledInputValueTrackerFakeDomDiagnosticGateId =
  'controlled-input-value-tracker-fake-dom-diagnostic-gate-1';
const controlledInputPrivateRestoreQueueDiagnosticGateId =
  'controlled-input-private-restore-queue-diagnostic-gate-1';
const controlledInputValueTrackerFakeDomDiagnosticStatus =
  'private-fake-dom-controlled-value-tracker-diagnostic';
const controlledInputPrivateRestoreQueueDiagnosticStatus =
  'private-fake-dom-controlled-restore-queue-diagnostic';
const controlledInputValueTrackerFakeDomInstalledStatus =
  'installed-private-fake-dom-controlled-value-tracker-record';
const controlledInputValueTrackerFakeDomObservedStatus =
  'observed-private-fake-dom-controlled-value-tracker-record';
const controlledInputValueTrackerFakeDomDetachedStatus =
  'detached-private-fake-dom-controlled-value-tracker-record';
const controlledInputPrivateRestoreQueueIntentRecordedStatus =
  'recorded-private-fake-dom-controlled-restore-intent';
const controlledInputPrivateRestoreQueueIntentSkippedStatus =
  'skipped-private-fake-dom-controlled-restore-intent';
const controlledInputValueTrackerFakeDomTargetMarker =
  '__FAST_REACT_CONTROLLED_INPUT_VALUE_TRACKER_FAKE_DOM__';
const controlledInputPrivateWrapperGateId =
  'controlled-input-private-wrapper-property-payload-gate-1';
const controlledInputPrivateWrapperGateStatus =
  'private-controlled-input-wrapper-property-payload-metadata-only';

const resourceHintOracleKind =
  'react-19.2.6-react-dom-resource-hints-oracle';
const formActionsOracleKind =
  'react-19.2.6-react-dom-form-actions-oracle';
const controlledInputOracleKind =
  'react-19.2.6-dom-controlled-input-oracle';
const formActionSubmissionTriggers = freezeArray([
  'submit',
  'requestSubmit',
  'replay',
  'unknown'
]);
const formActionActionKinds = freezeArray([
  'function',
  'string',
  'none',
  'unknown'
]);
const formActionActionSources = freezeArray([
  'form',
  'submit-control',
  'replay',
  'none',
  'unknown'
]);
const formActionSubmitControlKinds = freezeArray([
  'button',
  'input',
  'none',
  'unknown'
]);
const formActionResetOrderingKinds = freezeArray([
  'current-dispatcher-react-owned-first',
  'action-completion-reset-before-action',
  'previous-dispatcher-fallback',
  'unknown'
]);
const formActionResetQueueSources = freezeArray([
  'requestFormResetOnFiber',
  'action-completion',
  'transition',
  'unknown'
]);
const formActionResetQueueCommitPhases = freezeArray([
  'request-reset',
  'queue-reset-state-update',
  'render-detect-reset-state-change',
  'after-mutation-effects',
  'recursive-form-reset',
  'reset-form-instance'
]);
const formActionResetDispatcherOrderingSteps = freezeArray([
  'public-requestFormReset-current-dispatcher',
  'dom-dispatcher-form-ownership-check',
  'react-owned-requestFormResetOnFiber',
  'previous-dispatcher-fallback-after-ownership-miss',
  'action-completion-request-reset-before-action',
  'commit-after-mutation-resetFormInstance'
]);

const noSideEffects = freezeRecord({
  resourcesDispatched: false,
  singletonsResolved: false,
  formsSubmitted: false,
  formsReset: false,
  controlsTracked: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const formActionResetDispatcherBlockedSideEffects = freezeRecord({
  formDispatcherMetadataRecorded: false,
  submissionIntentRecorded: false,
  submitRequestSubmitActionMetadataRecorded: false,
  resetIntentRecorded: false,
  resetDispatcherOrderingRecorded: false,
  formActionEventPluginInvoked: false,
  requestFormResetDispatcherInvoked: false,
  realFormInspected: false,
  submitControlInspected: false,
  formDataConstructed: false,
  syntheticEventCreated: false,
  defaultPrevented: false,
  actionInvoked: false,
  hostTransitionStarted: false,
  resetFiberResolved: false,
  resetStateQueued: false,
  formResetCommitted: false,
  realFormReset: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const formActionSubmissionIntentSideEffects = freezeRecord({
  ...formActionResetDispatcherBlockedSideEffects,
  formDispatcherMetadataRecorded: true,
  submissionIntentRecorded: true,
  submitRequestSubmitActionMetadataRecorded: true
});

const formActionResetIntentSideEffects = freezeRecord({
  ...formActionResetDispatcherBlockedSideEffects,
  formDispatcherMetadataRecorded: true,
  resetIntentRecorded: true,
  resetDispatcherOrderingRecorded: true
});

const formActionEventExtractionBlockedSideEffects = freezeRecord({
  sourceSubmissionIntentConsumed: false,
  eventExtractionMetadataRecorded: false,
  formActionEventPluginInvoked: false,
  nativeEventInspected: false,
  realFormInspected: false,
  submitControlInspected: false,
  formPropsRead: false,
  submitControlPropsRead: false,
  formDataConstructed: false,
  syntheticEventCreated: false,
  listenerDispatchStarted: false,
  defaultPrevented: false,
  actionInvoked: false,
  hostTransitionStarted: false,
  resetStateQueued: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const formActionResetQueueCommitBlockedSideEffects = freezeRecord({
  sourceResetIntentAccepted: false,
  resetQueueCommitMetadataRecorded: false,
  resetQueueBoundaryRecorded: false,
  resetCommitOrderRecorded: false,
  realFormInspected: false,
  formFiberResolved: false,
  formFiberCaptured: false,
  stateHookCreated: false,
  resetStateHookResolved: false,
  resetStateQueueResolved: false,
  updateLaneRequested: false,
  resetUpdateEnqueued: false,
  reactUpdateQueued: false,
  renderFormResetFlagMarked: false,
  afterMutationEffectsVisited: false,
  recursivelyResetFormsCalled: false,
  resetFormInstanceCalled: false,
  formResetCommitted: false,
  realFormReset: false,
  previousDispatcherCalled: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const formActionEventExtractionMetadataSideEffects = freezeRecord({
  ...formActionEventExtractionBlockedSideEffects,
  sourceSubmissionIntentConsumed: true,
  eventExtractionMetadataRecorded: true
});

const formActionResetQueueCommitDiagnosticSideEffects = freezeRecord({
  ...formActionResetQueueCommitBlockedSideEffects,
  sourceResetIntentAccepted: true,
  resetQueueCommitMetadataRecorded: true,
  resetQueueBoundaryRecorded: true,
  resetCommitOrderRecorded: true
});

const resourceHintDispatcherSideEffects = freezeRecord({
  resourcesDispatched: false,
  privateDispatcherInvoked: false,
  sourceAdapterInvoked: false,
  documentMutated: false,
  headMutated: false,
  resourceElementCreated: false,
  stylesheetPrecedenceApplied: false,
  fizzInstructionEmitted: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const resourceHintFakeDomAdapterSideEffects = freezeRecord({
  fakeDomAdapterInvoked: false,
  fakeDocumentRead: false,
  fakeDocumentMutated: false,
  fakeHeadRead: false,
  fakeHeadMutated: false,
  fakeResourceElementCreated: false,
  fakeResourceElementInserted: false,
  resourceFetchStarted: false,
  resourceRecordCommitted: false,
  stylesheetPrecedenceApplied: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const resourceHintFakeDomInsertionBlockedSideEffects = freezeRecord({
  fakeDomInsertionGateInvoked: false,
  fakeDocumentRead: false,
  fakeDocumentMutated: false,
  fakeHeadRead: false,
  fakeHeadMutated: false,
  fakeResourceElementCreated: false,
  fakeResourceElementInserted: false,
  fakeResourceElementAttributesApplied: false,
  resourceFetchStarted: false,
  resourceRecordCommitted: false,
  stylesheetPrecedenceApplied: false,
  realDocumentMutated: false,
  publicResourceHintDomInsertion: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const resourceHintFakeDomInsertionSideEffects = freezeRecord({
  fakeDomInsertionGateInvoked: true,
  fakeDocumentRead: false,
  fakeDocumentMutated: false,
  fakeHeadRead: false,
  fakeHeadMutated: true,
  fakeResourceElementCreated: true,
  fakeResourceElementInserted: true,
  fakeResourceElementAttributesApplied: true,
  resourceFetchStarted: false,
  resourceRecordCommitted: false,
  stylesheetPrecedenceApplied: false,
  realDocumentMutated: false,
  publicResourceHintDomInsertion: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const resourceHintHeadBoundaryBlockedSideEffects = freezeRecord({
  ...resourceHintFakeDomInsertionBlockedSideEffects,
  singletonsResolved: false,
  fakeHeadBoundaryInvoked: false,
  fakeHeadInsertionObserved: false,
  fakeHeadUpdateApplied: false,
  headSingletonResolved: false,
  headSingletonAcquired: false,
  headSingletonReleased: false,
  headChildrenCleared: false,
  publicHeadSingletonBehavior: false
});

const resourceHintHeadBoundarySideEffects = freezeRecord({
  ...resourceHintFakeDomInsertionBlockedSideEffects,
  singletonsResolved: false,
  fakeHeadBoundaryInvoked: true,
  fakeHeadInsertionObserved: true,
  fakeHeadUpdateApplied: true,
  fakeHeadMutated: true,
  fakeResourceElementAttributesApplied: true,
  headSingletonResolved: false,
  headSingletonAcquired: false,
  headSingletonReleased: false,
  headChildrenCleared: false,
  publicHeadSingletonBehavior: false
});

const resourceHintHeadClearRetainBlockedSideEffects = freezeRecord({
  ...resourceHintHeadBoundaryBlockedSideEffects,
  fakeHeadClearRetainDiagnosticInvoked: false,
  fakeHeadRetainPolicyEvaluated: false,
  fakeHeadChildrenScanned: false,
  fakeHeadClearableChildrenObserved: false,
  fakeHeadRetainedChildrenObserved: false,
  fakeHeadChildRemoved: false,
  fakeHeadChildRetained: false,
  resourceHintClearRetainRowsRecorded: false,
  singletonClearRetainRowsRecorded: false,
  stylesheetPrecedenceBlockedCapabilitiesRecorded: false,
  stylesheetPrecedenceOrderQueried: false,
  stylesheetPrecedenceOrderMutated: false,
  publicStylesheetPrecedenceBehavior: false
});

const resourceHintHeadClearRetainSideEffects = freezeRecord({
  ...resourceHintHeadBoundaryBlockedSideEffects,
  fakeHeadRead: true,
  fakeHeadClearRetainDiagnosticInvoked: true,
  fakeHeadRetainPolicyEvaluated: true,
  fakeHeadChildrenScanned: true,
  fakeHeadClearableChildrenObserved: true,
  fakeHeadRetainedChildrenObserved: true,
  fakeHeadChildRemoved: false,
  fakeHeadChildRetained: false,
  resourceHintClearRetainRowsRecorded: true,
  singletonClearRetainRowsRecorded: true,
  stylesheetPrecedenceBlockedCapabilitiesRecorded: true,
  stylesheetPrecedenceOrderQueried: false,
  stylesheetPrecedenceOrderMutated: false,
  publicStylesheetPrecedenceBehavior: false
});

const resourceHintPreloadPreinitOrderBlockedSideEffects = freezeRecord({
  ...resourceHintHeadClearRetainBlockedSideEffects,
  fakePreloadPreinitOrderDiagnosticInvoked: false,
  fakeHeadInsertionOrderObserved: false,
  fakeHeadInsertionOrderMutated: false,
  resourceHintDedupeRowsRecorded: false,
  resourceHintPrecedenceRowsRecorded: false,
  resourceHintHeadOrderRowsRecorded: false,
  scriptModulePreinitRowsRecorded: false,
  scriptModuleFakeHeadOrderRowsRecorded: false,
  preloadPreinitResourceMapCreated: false,
  preloadPreinitResourceMapMutated: false,
  modulePreloadStarted: false,
  scriptPreinitStarted: false,
  moduleScriptPreinitStarted: false,
  scriptExecutionStarted: false,
  publicScriptModuleResourceDispatch: false,
  publicPreloadPreinitDedupeBehavior: false
});

const resourceHintPreloadPreinitOrderSideEffects = freezeRecord({
  ...resourceHintHeadClearRetainBlockedSideEffects,
  fakeHeadRead: true,
  fakeHeadChildrenScanned: true,
  fakePreloadPreinitOrderDiagnosticInvoked: true,
  fakeHeadInsertionOrderObserved: true,
  fakeHeadInsertionOrderMutated: false,
  resourceHintDedupeRowsRecorded: true,
  resourceHintPrecedenceRowsRecorded: true,
  resourceHintHeadOrderRowsRecorded: true,
  scriptModulePreinitRowsRecorded: true,
  scriptModuleFakeHeadOrderRowsRecorded: true,
  stylesheetPrecedenceBlockedCapabilitiesRecorded: true,
  stylesheetPrecedenceOrderQueried: true,
  stylesheetPrecedenceOrderMutated: false,
  preloadPreinitResourceMapCreated: false,
  preloadPreinitResourceMapMutated: false,
  modulePreloadStarted: false,
  scriptPreinitStarted: false,
  moduleScriptPreinitStarted: false,
  scriptExecutionStarted: false,
  publicScriptModuleResourceDispatch: false,
  publicPreloadPreinitDedupeBehavior: false
});

const resourceHintStylesheetPrecedenceBlockedSideEffects = freezeRecord({
  ...resourceHintPreloadPreinitOrderBlockedSideEffects,
  fakeStylesheetPrecedenceDiagnosticInvoked: false,
  stylesheetPrecedenceDedupeRowsRecorded: false,
  stylesheetPrecedenceInsertionRowsRecorded: false,
  stylesheetPrecedenceSingletonOrderRowsRecorded: false,
  stylesheetPrecedenceResourceMapCreated: false,
  stylesheetPrecedenceResourceMapMutated: false
});

const resourceHintStylesheetPrecedenceSideEffects = freezeRecord({
  ...resourceHintPreloadPreinitOrderBlockedSideEffects,
  fakeHeadRead: true,
  fakeHeadChildrenScanned: true,
  fakeHeadInsertionOrderObserved: true,
  resourceHintDedupeRowsRecorded: true,
  resourceHintPrecedenceRowsRecorded: true,
  resourceHintHeadOrderRowsRecorded: true,
  stylesheetPrecedenceBlockedCapabilitiesRecorded: true,
  stylesheetPrecedenceOrderQueried: true,
  stylesheetPrecedenceOrderMutated: false,
  fakeStylesheetPrecedenceDiagnosticInvoked: true,
  stylesheetPrecedenceDedupeRowsRecorded: true,
  stylesheetPrecedenceInsertionRowsRecorded: true,
  stylesheetPrecedenceSingletonOrderRowsRecorded: true,
  stylesheetPrecedenceResourceMapCreated: false,
  stylesheetPrecedenceResourceMapMutated: false
});

const resourceHintResourceMapCommitBlockedSideEffects = freezeRecord({
  ...resourceHintStylesheetPrecedenceBlockedSideEffects,
  fakeResourceMapCommitDiagnosticInvoked: false,
  privateResourceMapCommitRecordsCreated: false,
  resourceMapCommitRowsRecorded: false,
  stylesheetResourceMapCommitRowsRecorded: false,
  preloadResourceMapCommitRowsRecorded: false,
  scriptResourceMapCommitRowsRecorded: false,
  moduleResourceMapOrderRowsRecorded: false,
  moduleResourceMapDedupeKeysRecorded: false,
  fakeScriptModuleCommitExecutionDiagnosticInvoked: false,
  scriptModuleFakeDomCommitRowsRecorded: false,
  scriptResourceFakeDomCommitRowsRecorded: false,
  modulePreloadFakeDomCommitRowsRecorded: false,
  stylesheetLoadErrorStateRecordConsumed: false,
  stylesheetLoadStateCommitOrderRowsRecorded: false,
  stylesheetLoadStateResourceMapRowsValidated: false,
  stylesheetLoadStateCommitTransitionRecorded: false,
  fakeStylesheetResourceCommitTransitionRecorded: false,
  duplicateStylesheetPrecedenceRowsRejected: false,
  staleStylesheetResourceMapEntriesRejected: false,
  realResourceMapsCreated: false,
  realResourceMapsMutated: false,
  fakeResourceMapsCreated: false,
  fakeResourceMapsMutated: false,
  stylesheetRecordOwnershipClaimed: false,
  preloadRecordStarted: false,
  scriptRecordLoaded: false,
  modulePreloadStarted: false,
  scriptPreinitStarted: false,
  moduleScriptPreinitStarted: false,
  scriptExecutionStarted: false,
  publicScriptModuleResourceDispatch: false,
  resourceLoadStateMutated: false,
  preloadOrStyleDomWorkDispatched: false,
  publicStylesheetLoadStateDispatch: false,
  publicResourceMapCommitBehavior: false
});

const resourceHintResourceMapCommitSideEffects = freezeRecord({
  ...resourceHintStylesheetPrecedenceBlockedSideEffects,
  fakeHeadRead: false,
  fakeHeadChildrenScanned: false,
  fakeResourceMapCommitDiagnosticInvoked: true,
  privateResourceMapCommitRecordsCreated: true,
  resourceMapCommitRowsRecorded: true,
  stylesheetResourceMapCommitRowsRecorded: true,
  preloadResourceMapCommitRowsRecorded: true,
  scriptResourceMapCommitRowsRecorded: true,
  moduleResourceMapOrderRowsRecorded: true,
  moduleResourceMapDedupeKeysRecorded: true,
  fakeScriptModuleCommitExecutionDiagnosticInvoked: true,
  scriptModuleFakeDomCommitRowsRecorded: true,
  scriptResourceFakeDomCommitRowsRecorded: true,
  modulePreloadFakeDomCommitRowsRecorded: true,
  stylesheetLoadErrorStateRecordConsumed: true,
  stylesheetLoadStateCommitOrderRowsRecorded: true,
  stylesheetLoadStateResourceMapRowsValidated: true,
  stylesheetLoadStateCommitTransitionRecorded: true,
  fakeStylesheetResourceCommitTransitionRecorded: true,
  duplicateStylesheetPrecedenceRowsRejected: true,
  staleStylesheetResourceMapEntriesRejected: true,
  realResourceMapsCreated: false,
  realResourceMapsMutated: false,
  fakeResourceMapsCreated: false,
  fakeResourceMapsMutated: false,
  stylesheetRecordOwnershipClaimed: false,
  preloadRecordStarted: false,
  scriptRecordLoaded: false,
  modulePreloadStarted: false,
  scriptPreinitStarted: false,
  moduleScriptPreinitStarted: false,
  scriptExecutionStarted: false,
  publicScriptModuleResourceDispatch: false,
  resourceLoadStateMutated: false,
  preloadOrStyleDomWorkDispatched: false,
  publicStylesheetLoadStateDispatch: false,
  publicResourceMapCommitBehavior: false
});

const resourceHintStylesheetLoadErrorStateBlockedSideEffects =
  freezeRecord({
    ...resourceHintStylesheetPrecedenceBlockedSideEffects,
    fakeStylesheetLoadErrorStateDiagnosticInvoked: false,
    stylesheetResourceStateRowsRecorded: false,
    stylesheetLoadingStateRowsRecorded: false,
    stylesheetPreloadStateRowsRecorded: false,
    stylesheetCommitSuspensionRowsRecorded: false,
    stylesheetLoadListenerInstalled: false,
    stylesheetErrorListenerInstalled: false,
    stylesheetPromiseCreated: false,
    stylesheetPreloadListenerInstalled: false,
    stylesheetFetchStarted: false,
    stylesheetCommitSuspended: false,
    stylesheetRealTimerScheduled: false
  });

const resourceHintStylesheetLoadErrorStateSideEffects = freezeRecord({
  ...resourceHintStylesheetPrecedenceBlockedSideEffects,
  fakeStylesheetLoadErrorStateDiagnosticInvoked: true,
  stylesheetResourceStateRowsRecorded: true,
  stylesheetLoadingStateRowsRecorded: true,
  stylesheetPreloadStateRowsRecorded: true,
  stylesheetCommitSuspensionRowsRecorded: true,
  stylesheetLoadListenerInstalled: false,
  stylesheetErrorListenerInstalled: false,
  stylesheetPromiseCreated: false,
  stylesheetPreloadListenerInstalled: false,
  stylesheetFetchStarted: false,
  stylesheetCommitSuspended: false,
  stylesheetRealTimerScheduled: false
});

const controlledInputValueTrackerSideEffects = freezeRecord({
  controlsTracked: false,
  trackerAttached: false,
  hostValueRead: false,
  hostValueWritten: false,
  propertyDescriptorInstalled: false,
  changeEventsObserved: false,
  postEventRestoreQueued: false,
  publicControlledBehaviorEnabled: false,
  publicRootTouched: false,
  compatibilityClaimed: false
});

const controlledInputPrivateWrapperSideEffects = freezeRecord({
  ...controlledInputValueTrackerSideEffects,
  hostWrapperInvoked: false,
  wrapperValidationInvoked: false,
  wrapperInitInvoked: false,
  wrapperUpdateInvoked: false,
  wrapperPropertyWritten: false,
  optionSelectionMutated: false,
  radioGroupQueried: false,
  latestPropsLookup: false
});

const controlledInputValueTrackerFakeDomDiagnosticNoSideEffects = freezeRecord({
  ...controlledInputValueTrackerSideEffects,
  fakeDomTrackerRecordInstalled: false,
  fakeDomTrackerRecordObserved: false,
  fakeDomTrackerRecordDetached: false,
  fakeDomValueRead: false,
  fakeDomValueWritten: false,
  fakeDomDescriptorInstalled: false,
  fakeDomTargetCaptured: false,
  realDomNodeTouched: false
});

const controlledInputPrivateRestoreQueueDiagnosticNoSideEffects = freezeRecord({
  ...controlledInputValueTrackerSideEffects,
  fakeDomTrackerObservationAccepted: false,
  fakeDomRestoreIntentRecorded: false,
  fakeDomRestoreIntentSkipped: false,
  restoreQueueRecordCreated: false,
  restoreQueueWritten: false,
  latestPropsLookup: false,
  eventPluginDispatch: false,
  restoreStateIfNeededInvoked: false,
  restoreControlledStateInvoked: false,
  restoreFlushed: false,
  hostWrapperInvoked: false,
  realDomNodeTouched: false
});

const missingPrerequisites = freezeArray([
  prerequisite(
    'no-resource-dispatcher',
    'react-dom-resource',
    'Resource hint calls are not wired to document, Fizz, or host resource dispatch.'
  ),
  prerequisite(
    'no-singleton-adapter',
    'react-dom-resource',
    'Host singleton resolution and ownership are not wired to the DOM host config.'
  ),
  prerequisite(
    'no-client-form-action-adapter',
    'react-dom-form',
    'React-owned form submission, reset, and host transition state are not wired.'
  ),
  prerequisite(
    'no-controlled-control-tracking',
    'react-dom-form',
    'Controlled form controls do not have value tracking or post-event restore.'
  ),
  prerequisite(
    'no-public-root-integration',
    'react-dom-client',
    'Public roots stay placeholder-gated and do not route these records.'
  )
]);

const resourceHintDispatcherMissingPrerequisites = freezeArray([
  prerequisite(
    'no-private-resource-dispatcher-adapter',
    'react-dom-resource',
    'Private resource hint dispatcher calls are not wired to DOM or native adapter side effects.'
  ),
  prerequisite(
    'no-document-resource-target',
    'react-dom-resource',
    'Document and head ownership for resource hints is not connected to public roots.'
  ),
  prerequisite(
    'no-stylesheet-precedence-adapter',
    'react-dom-resource',
    'Stylesheet precedence ordering is not wired to host resource insertion.'
  ),
  prerequisite(
    'no-fizz-resource-integration',
    'react-dom-resource',
    'Fizz resource emission and preloading are not connected to the package facade.'
  )
]);

const formActionResetDispatcherMissingPrerequisites = freezeArray([
  prerequisite(
    'no-form-action-event-plugin-execution',
    'react-dom-events',
    'Form action event extraction remains metadata-only and does not create SyntheticEvents or invoke listeners.'
  ),
  prerequisite(
    'no-client-form-data-construction',
    'react-dom-form',
    'Client submission intent does not construct form data or inspect form controls.'
  ),
  prerequisite(
    'no-host-transition-form-status',
    'react-dom-form',
    'Host transition pending form status is not wired to public roots.'
  ),
  prerequisite(
    'no-form-reset-fiber-queue',
    'react-dom-form',
    'React-owned form reset requests do not resolve fibers or enqueue reset state.'
  ),
  prerequisite(
    'no-form-reset-commit',
    'react-dom-form',
    'Commit-time form reset effects and real form.reset calls remain blocked.'
  ),
  prerequisite(
    'no-public-form-action-compatibility',
    'react-dom-client',
    'Public form action and reset compatibility remains unclaimed.'
  )
]);

const formActionEventExtractionMissingPrerequisites = freezeArray([
  prerequisite(
    'no-form-action-event-plugin-execution',
    'react-dom-events',
    'Form action event extraction records accepted metadata only and does not invoke the event plugin.'
  ),
  prerequisite(
    'no-synthetic-event-construction',
    'react-dom-events',
    'Submit extraction does not create SyntheticEvents or dispatch listeners.'
  ),
  prerequisite(
    'no-client-form-data-construction',
    'react-dom-form',
    'Client form action extraction does not inspect controls or construct form data.'
  ),
  prerequisite(
    'no-host-transition-form-status',
    'react-dom-form',
    'Host transition pending form status is not wired to public roots.'
  ),
  prerequisite(
    'no-public-form-action-compatibility',
    'react-dom-client',
    'Public form action submit/requestSubmit compatibility remains unclaimed.'
  )
]);

const formActionResetQueueCommitMissingPrerequisites = freezeArray([
  prerequisite(
    'no-live-form-fiber-ownership',
    'react-dom-form',
    'Reset queue diagnostics consume private metadata only and never resolve a live form fiber.'
  ),
  prerequisite(
    'no-reset-state-hook-queue',
    'react-dom-form',
    'Reset state hook and queue handoff is recorded without creating hooks or enqueuing React updates.'
  ),
  prerequisite(
    'no-render-form-reset-flag',
    'react-dom-reconciler',
    'Render-phase FormReset flag detection is recorded as commit-order metadata only.'
  ),
  prerequisite(
    'no-after-mutation-form-reset-commit',
    'react-dom-reconciler',
    'After-mutation reset traversal and resetFormInstance calls remain blocked.'
  ),
  prerequisite(
    'no-real-form-reset',
    'react-dom-form',
    'The diagnostic never calls form.reset() or mutates a DOM form.'
  ),
  prerequisite(
    'no-public-form-action-compatibility',
    'react-dom-client',
    'Public form action and reset compatibility remains unclaimed.'
  )
]);

const resourceHintFakeDomAdapterMissingPrerequisites = freezeArray([
  prerequisite(
    'no-fake-dom-resource-adapter-execution',
    'react-dom-resource',
    'Fake DOM resource adapter records are admitted as metadata only.'
  ),
  prerequisite(
    'no-resource-element-factory',
    'react-dom-resource',
    'Resource element creation and attribute application are not admitted.'
  ),
  prerequisite(
    'no-resource-head-insertion',
    'react-dom-resource',
    'Head insertion, dedupe, and stylesheet precedence are not admitted.'
  ),
  prerequisite(
    'no-resource-fetch-side-effects',
    'react-dom-resource',
    'Resource fetch, preload, and execution side effects are not admitted.'
  ),
  prerequisite(
    'no-public-resource-hint-dom-insertion',
    'react-dom-resource',
    'Public resource hint APIs remain placeholders and do not reach this adapter.'
  )
]);

const resourceHintFakeDomInsertionMissingPrerequisites = freezeArray([
  prerequisite(
    'no-real-document-resource-insertion',
    'react-dom-resource',
    'Only deterministic fake DOM insertion diagnostics are admitted.'
  ),
  prerequisite(
    'no-resource-dedupe-or-precedence',
    'react-dom-resource',
    'Resource dedupe, ordering, and stylesheet precedence are not admitted.'
  ),
  prerequisite(
    'no-resource-fetch-side-effects',
    'react-dom-resource',
    'Fake resource elements use redacted diagnostic attributes and cannot start fetches.'
  ),
  prerequisite(
    'no-public-resource-hint-dom-insertion',
    'react-dom-resource',
    'Public resource hint APIs remain placeholders and do not reach fake or real DOM insertion.'
  )
]);

const resourceHintHeadBoundaryMissingPrerequisites = freezeArray([
  prerequisite(
    'no-head-singleton-ownership',
    'react-dom-resource',
    'Head singleton resolution, acquisition, ownership, and release remain blocked.'
  ),
  prerequisite(
    'no-real-head-resource-boundary',
    'react-dom-resource',
    'Only deterministic fake DOM head insertion/update diagnostics are admitted.'
  ),
  prerequisite(
    'no-public-resource-or-singleton-root-behavior',
    'react-dom-client',
    'Public resource hints and singleton roots remain placeholder-gated.'
  )
]);

const resourceHintHeadClearRetainMissingPrerequisites = freezeArray([
  prerequisite(
    'no-head-singleton-clear-commit',
    'react-dom-resource',
    'Head singleton clear/release semantics are not wired to commit.'
  ),
  prerequisite(
    'no-resource-hoistable-retain-policy',
    'react-dom-resource',
    'Resource hint retain markers are not wired to head clearing.'
  ),
  prerequisite(
    'no-stylesheet-precedence-ordering',
    'react-dom-resource',
    'Stylesheet precedence ordering is recorded as blocked metadata only.'
  ),
  prerequisite(
    'no-real-head-clear-or-retain',
    'react-dom-resource',
    'Only deterministic fake DOM clear/retain diagnostics are admitted.'
  ),
  prerequisite(
    'no-public-resource-or-singleton-root-behavior',
    'react-dom-client',
    'Public resource hints and singleton roots remain placeholder-gated.'
  )
]);

const resourceHintPreloadPreinitOrderMissingPrerequisites = freezeArray([
  prerequisite(
    'no-resource-map-commit',
    'react-dom-resource',
    'Preload and preinit resource maps are not wired to root-owned DOM resources.'
  ),
  prerequisite(
    'no-preload-preinit-dedupe-commit',
    'react-dom-resource',
    'Preload/preinit dedupe is recorded as deterministic fake-DOM metadata only.'
  ),
  prerequisite(
    'no-stylesheet-precedence-insertion',
    'react-dom-resource',
    'Stylesheet precedence order is observed but not applied to fake or real head insertion.'
  ),
  prerequisite(
    'no-real-head-insertion-order',
    'react-dom-resource',
    'Real document head ordering, querySelector, and insertBefore behavior remain blocked.'
  ),
  prerequisite(
    'no-script-module-resource-dispatch',
    'react-dom-resource',
    'Script, modulepreload, and preinitModule diagnostics do not dispatch public resource work or execute scripts.'
  ),
  prerequisite(
    'no-public-resource-hint-dom-insertion',
    'react-dom-resource',
    'Public resource hint APIs remain placeholders and do not reach this diagnostic.'
  )
]);

const resourceHintStylesheetPrecedenceMissingPrerequisites = freezeArray([
  prerequisite(
    'no-stylesheet-resource-map-commit',
    'react-dom-resource',
    'Stylesheet resource maps are not wired to root-owned DOM resources.'
  ),
  prerequisite(
    'no-stylesheet-precedence-dedupe-commit',
    'react-dom-resource',
    'Stylesheet dedupe and preload adoption are recorded as deterministic fake-DOM metadata only.'
  ),
  prerequisite(
    'no-stylesheet-precedence-insertion',
    'react-dom-resource',
    'Stylesheet precedence ordering is diagnosed without insertBefore, load tracking, or commit suspension.'
  ),
  prerequisite(
    'no-head-singleton-order-commit',
    'react-dom-resource',
    'Head singleton ordering and clear/retain behavior remain blocked at commit.'
  ),
  prerequisite(
    'no-real-head-stylesheet-ordering',
    'react-dom-resource',
    'Real document head query and stylesheet insertion order behavior remain blocked.'
  ),
  prerequisite(
    'no-public-resource-hint-dom-insertion',
    'react-dom-resource',
    'Public resource hint APIs remain placeholders and do not reach this diagnostic.'
  )
]);

const resourceHintResourceMapCommitMissingPrerequisites = freezeArray([
  prerequisite(
    'no-root-resource-map-storage',
    'react-dom-resource',
    'Root-owned stylesheet and script resource maps remain blocked.'
  ),
  prerequisite(
    'no-preload-props-map-storage',
    'react-dom-resource',
    'Preload records are private diagnostics and do not populate preload maps.'
  ),
  prerequisite(
    'no-resource-singleton-ownership',
    'react-dom-resource',
    'Resource ownership and head singleton coordination remain blocked.'
  ),
  prerequisite(
    'no-resource-fetch-or-load-state',
    'react-dom-resource',
    'Resource fetch, load, error, and suspended commit state remain blocked.'
  ),
  prerequisite(
    'no-script-module-resource-acquire',
    'react-dom-resource',
    'Script and modulepreload commit rows remain private fake-DOM evidence without resource acquisition or execution.'
  ),
  prerequisite(
    'no-public-resource-api-dispatch',
    'react-dom-resource',
    'Public resource hint APIs remain placeholders and do not reach commit.'
  )
]);

const resourceHintStylesheetLoadErrorStateMissingPrerequisites = freezeArray([
  prerequisite(
    'no-stylesheet-loading-state-commit',
    'react-dom-resource',
    'Stylesheet resource loading bits are recorded as deterministic fake metadata only.'
  ),
  prerequisite(
    'no-stylesheet-load-error-listeners',
    'react-dom-resource',
    'Stylesheet load and error listeners are not installed.'
  ),
  prerequisite(
    'no-stylesheet-preload-state-commit',
    'react-dom-resource',
    'Stylesheet preload element references are not created, captured, or fetched.'
  ),
  prerequisite(
    'no-suspended-stylesheet-commit',
    'react-dom-resource',
    'Suspended stylesheet commit state, timers, and unsuspend callbacks remain blocked.'
  ),
  prerequisite(
    'no-public-resource-compatibility',
    'react-dom-client',
    'Public stylesheet resource compatibility remains unclaimed.'
  )
]);

const resourceHintHeadClearRetainBlockedCapabilities = freezeArray([
  blockedCapability(
    'head-singleton-release',
    'Head singleton release and ownership are not wired to public roots.'
  ),
  blockedCapability(
    'head-child-removal',
    'Head child removal is diagnostic-only and does not clear fake or real head children.'
  ),
  blockedCapability(
    'resource-hoistable-retain-marker',
    'Resource hint hoistable retain markers are not applied by this fake-DOM gate.'
  ),
  blockedCapability(
    'stylesheet-precedence-ordering',
    'Stylesheet precedence maps, ordering, and insertion positions remain blocked.'
  ),
  blockedCapability(
    'real-document-head-mutation',
    'Real document head reads and mutations remain blocked.'
  ),
  blockedCapability(
    'public-resource-singleton-compatibility',
    'Public resource hint and head singleton compatibility remains unclaimed.'
  )
]);

const resourceHintHeadStylesheetPrecedenceBlockedCapabilities = freezeArray([
  blockedCapability(
    'stylesheet-precedence-map',
    'No per-root stylesheet precedence map is created.'
  ),
  blockedCapability(
    'stylesheet-precedence-query',
    'No real querySelectorAll scan for precedence-managed stylesheets is run.'
  ),
  blockedCapability(
    'stylesheet-precedence-insertion',
    'No stylesheet is inserted before or after precedence peers.'
  ),
  blockedCapability(
    'stylesheet-precedence-commit-suspension',
    'Stylesheet load, error, and suspended commit behavior remains blocked.'
  )
]);

const resourceHintPreloadPreinitOrderBlockedCapabilities = freezeArray([
  blockedCapability(
    'preload-preinit-resource-map',
    'No root-owned preload or preinit resource map is created or mutated.'
  ),
  blockedCapability(
    'resource-key-dedupe-commit',
    'Dedupe rows use explicit opaque diagnostic keys and do not commit resource records.'
  ),
  blockedCapability(
    'stylesheet-precedence-insertion',
    'Stylesheet precedence order is recorded without insertBefore or load tracking.'
  ),
  blockedCapability(
    'real-document-head-ordering',
    'Real document head query and insertion order behavior remains blocked.'
  ),
  blockedCapability(
    'script-module-resource-dispatch',
    'Script, modulepreload, and preinitModule rows are recorded without public dispatch, network fetches, or script execution.'
  ),
  blockedCapability(
    'public-resource-compatibility',
    'Public preload/preinit compatibility remains unclaimed.'
  )
]);

const resourceHintStylesheetPrecedenceBlockedCapabilities = freezeArray([
  blockedCapability(
    'stylesheet-resource-map',
    'No root-owned stylesheet resource map is created or mutated.'
  ),
  blockedCapability(
    'stylesheet-dedupe-commit',
    'Stylesheet dedupe rows use explicit opaque diagnostic keys and do not commit resource records.'
  ),
  blockedCapability(
    'stylesheet-precedence-insertion',
    'Stylesheet precedence order is recorded without insertBefore or load tracking.'
  ),
  blockedCapability(
    'head-singleton-ordering',
    'Head singleton clear/retain ordering is observed but not applied at commit.'
  ),
  blockedCapability(
    'suspended-stylesheet-commit',
    'Stylesheet load, error, and suspended commit behavior remains blocked.'
  ),
  blockedCapability(
    'real-document-head-mutation',
    'Real document head query and mutation behavior remains blocked.'
  ),
  blockedCapability(
    'public-resource-compatibility',
    'Public stylesheet resource compatibility remains unclaimed.'
  )
]);

const resourceHintResourceMapCommitBlockedCapabilities = freezeArray([
  blockedCapability(
    'root-resource-map-commit',
    'No real root-owned stylesheet or script resource map is created or mutated.'
  ),
  blockedCapability(
    'preload-map-commit',
    'Preload rows are recorded as private diagnostics without mutating preload maps.'
  ),
  blockedCapability(
    'resource-singleton-ownership',
    'Resource ownership and singleton coordination are not acquired.'
  ),
  blockedCapability(
    'resource-fetch-load-state',
    'Fetch, load, error, and suspended commit state are not started or mutated.'
  ),
  blockedCapability(
    'preload-style-dom-work',
    'No real preload or stylesheet DOM element is created, inserted, fetched, or subscribed.'
  ),
  blockedCapability(
    'script-module-resource-execution',
    'Script and modulepreload rows are recorded as private fake-DOM commit evidence without public dispatch or script execution.'
  ),
  blockedCapability(
    'public-resource-compatibility',
    'Public resource hint compatibility remains unclaimed.'
  )
]);

const resourceHintStylesheetLoadErrorStateBlockedCapabilities = freezeArray([
  blockedCapability(
    'stylesheet-resource-state-map',
    'No root-owned hoistableStyles resource map is created or mutated.'
  ),
  blockedCapability(
    'stylesheet-load-error-listeners',
    'No load or error listeners are installed on stylesheet or preload elements.'
  ),
  blockedCapability(
    'stylesheet-loading-promise',
    'No stylesheet loading promise or _p field is created.'
  ),
  blockedCapability(
    'stylesheet-preload-element',
    'No preload element is created, captured, or fetched.'
  ),
  blockedCapability(
    'suspended-stylesheet-commit',
    'No suspended commit count, timer, or unsuspend callback is scheduled.'
  ),
  blockedCapability(
    'real-document-resource-fetch',
    'No real document, network, timer, or DOM event behavior is used.'
  ),
  blockedCapability(
    'public-resource-compatibility',
    'Public stylesheet resource compatibility remains unclaimed.'
  )
]);

const controlledInputValueTrackerMissingPrerequisites = freezeArray([
  prerequisite(
    'no-live-controlled-value-tracker',
    'react-dom-form',
    'Controlled form controls only record metadata; no host value tracker is attached.'
  ),
  prerequisite(
    'no-controlled-host-wrapper',
    'react-dom-form',
    'Input, select, and textarea wrapper property writes are not wired.'
  ),
  prerequisite(
    'no-controlled-change-event-adapter',
    'react-dom-events',
    'Change events are not routed through controlled form adapters.'
  ),
  prerequisite(
    'no-post-event-controlled-restore',
    'react-dom-events',
    'Post-event restore is not queued or flushed for controlled controls.'
  ),
  prerequisite(
    'no-live-controlled-restore-execution',
    'react-dom-events',
    'Live controlled restore has preflight metadata only; host wrappers and value-tracker writes remain blocked.'
  ),
  prerequisite(
    'no-public-controlled-root-behavior',
    'react-dom-client',
    'Public roots remain placeholder-gated for controlled form behavior.'
  )
]);

const resourceHintContracts = freezeArray([
  resourceHintContract(
    'prefetch-dns',
    'prefetchDNS',
    'D',
    'react-dom-resource-hint'
  ),
  resourceHintContract(
    'preconnect',
    'preconnect',
    'C',
    'react-dom-resource-hint'
  ),
  resourceHintContract(
    'preload',
    'preload',
    'L',
    'react-dom-resource-hint'
  ),
  resourceHintContract(
    'preload-module',
    'preloadModule',
    'm',
    'react-dom-resource-hint'
  ),
  resourceHintContract(
    'preinit-script',
    'preinit',
    'X',
    'react-dom-resource-hint'
  ),
  resourceHintContract(
    'preinit-style',
    'preinit',
    'S',
    'react-dom-resource-hint'
  ),
  resourceHintContract(
    'preinit-module-script',
    'preinitModule',
    'M',
    'react-dom-resource-hint'
  )
]);

const resourceHintDispatcherMetadataContracts = freezeArray([
  resourceHintDispatcherMetadataContract(
    'preconnect',
    'preconnect',
    'C',
    ['href', 'crossOrigin']
  ),
  resourceHintDispatcherMetadataContract(
    'preload',
    'preload',
    'L',
    ['href', 'as', 'options']
  ),
  resourceHintDispatcherMetadataContract(
    'preload-module',
    'preloadModule',
    'm',
    ['href', 'options']
  ),
  resourceHintDispatcherMetadataContract(
    'preinit-style',
    'preinit',
    'S',
    ['href', 'precedence', 'options']
  ),
  resourceHintDispatcherMetadataContract(
    'preinit-script',
    'preinit',
    'X',
    ['href', 'options']
  ),
  resourceHintDispatcherMetadataContract(
    'preinit-module-script',
    'preinitModule',
    'M',
    ['href', 'options']
  )
]);

const resourceHintFakeDomAdapterContracts = freezeArray([
  resourceHintFakeDomAdapterContract(
    'preconnect',
    'C',
    'link',
    'preconnect',
    ['rel', 'href', 'crossOrigin']
  ),
  resourceHintFakeDomAdapterContract(
    'preload',
    'L',
    'link',
    'preload',
    [
      'rel',
      'href',
      'as',
      'crossOrigin',
      'integrity',
      'nonce',
      'type',
      'fetchPriority',
      'referrerPolicy',
      'imageSrcSet',
      'imageSizes',
      'media'
    ]
  ),
  resourceHintFakeDomAdapterContract(
    'preload-module',
    'm',
    'link',
    'modulepreload',
    ['rel', 'href', 'as', 'crossOrigin', 'integrity']
  ),
  resourceHintFakeDomAdapterContract(
    'preinit-style',
    'S',
    'link',
    'stylesheet',
    ['rel', 'href', 'precedence', 'crossOrigin', 'integrity', 'fetchPriority']
  ),
  resourceHintFakeDomAdapterContract(
    'preinit-script',
    'X',
    'script',
    'script',
    ['src', 'async', 'crossOrigin', 'integrity', 'fetchPriority', 'nonce']
  ),
  resourceHintFakeDomAdapterContract(
    'preinit-module-script',
    'M',
    'script',
    'module-script',
    ['src', 'async', 'type', 'crossOrigin', 'integrity', 'nonce']
  )
]);

const resourceHintFakeDomInsertionContracts = freezeArray([
  resourceHintFakeDomInsertionContract(
    'preconnect',
    'C',
    'link',
    'preconnect',
    ['rel', 'href', 'crossOrigin']
  ),
  resourceHintFakeDomInsertionContract(
    'preload',
    'L',
    'link',
    'preload',
    [
      'rel',
      'href',
      'as',
      'crossOrigin',
      'integrity',
      'nonce',
      'type',
      'fetchPriority',
      'referrerPolicy',
      'imageSrcSet',
      'imageSizes',
      'media'
    ]
  )
]);

const resourceHintHeadBoundaryContracts = freezeArray([
  resourceHintHeadBoundaryContract(
    'preconnect-head-singleton-boundary',
    'preconnect',
    'C',
    'link',
    'preconnect'
  ),
  resourceHintHeadBoundaryContract(
    'preload-head-singleton-boundary',
    'preload',
    'L',
    'link',
    'preload'
  )
]);

const resourceHintHeadClearRetainContracts = freezeArray([
  resourceHintHeadClearRetainContract(
    'head-singleton-clear-retain',
    'host-singleton',
    'head-singleton',
    'head',
    null,
    null
  ),
  resourceHintHeadClearRetainContract(
    'preconnect-resource-head-clear-retain',
    'resource-hint',
    'preconnect',
    'link',
    'preconnect',
    'C'
  ),
  resourceHintHeadClearRetainContract(
    'preload-resource-head-clear-retain',
    'resource-hint',
    'preload',
    'link',
    'preload',
    'L'
  )
]);

const resourceHintPreloadPreinitOrderContracts = freezeArray([
  resourceHintPreloadPreinitOrderContract(
    'preload-preinit-order-preload',
    'preload',
    'L',
    'link',
    'preload',
    ['style', 'script', 'font', 'image', 'other']
  ),
  resourceHintPreloadPreinitOrderContract(
    'preload-preinit-order-preload-module',
    'preload-module',
    'm',
    'link',
    'modulepreload',
    [
      'script',
      'worker',
      'serviceworker',
      'sharedworker',
      'audioworklet',
      'paintworklet',
      'other'
    ]
  ),
  resourceHintPreloadPreinitOrderContract(
    'preload-preinit-order-preinit-style',
    'preinit-style',
    'S',
    'link',
    'stylesheet',
    ['style']
  ),
  resourceHintPreloadPreinitOrderContract(
    'preload-preinit-order-preinit-script',
    'preinit-script',
    'X',
    'script',
    'script',
    ['script']
  ),
  resourceHintPreloadPreinitOrderContract(
    'preload-preinit-order-preinit-module-script',
    'preinit-module-script',
    'M',
    'script',
    'module-script',
    ['script']
  )
]);

const resourceHintStylesheetPrecedenceContracts = freezeArray([
  resourceHintStylesheetPrecedenceContract(
    'stylesheet-precedence-preload-style',
    'preload',
    'L',
    'link',
    'preload',
    'style'
  ),
  resourceHintStylesheetPrecedenceContract(
    'stylesheet-precedence-preinit-style',
    'preinit-style',
    'S',
    'link',
    'stylesheet',
    'style'
  ),
  resourceHintStylesheetPrecedenceContract(
    'stylesheet-precedence-head-singleton',
    'head-singleton',
    null,
    'head',
    null,
    'head'
  )
]);

const resourceHintResourceMapCommitContracts = freezeArray([
  resourceHintResourceMapCommitContract(
    'resource-map-commit-stylesheet',
    'stylesheet',
    'hoistable-styles',
    'style'
  ),
  resourceHintResourceMapCommitContract(
    'resource-map-commit-preload',
    'preload',
    'preload-props',
    'preload'
  ),
  resourceHintResourceMapCommitContract(
    'resource-map-commit-script',
    'script',
    'hoistable-scripts',
    'script'
  )
]);

const stylesheetLoadingStateBits = freezeRecord({
  NotLoaded: 0,
  Loaded: 1,
  Errored: 2,
  Settled: 3,
  Inserted: 4
});

const resourceHintStylesheetLoadErrorStateContracts = freezeArray([
  resourceHintStylesheetLoadErrorStateContract(
    'stylesheet-resource-shape',
    'resource',
    'type-instance-count-state',
    ['type', 'instance', 'count', 'state']
  ),
  resourceHintStylesheetLoadErrorStateContract(
    'stylesheet-state-shape',
    'state',
    'loading-and-preload',
    ['loading', 'preload']
  ),
  resourceHintStylesheetLoadErrorStateContract(
    'stylesheet-loading-bits',
    'loading-state',
    'notloaded-loaded-errored-settled-inserted',
    ['NotLoaded', 'Loaded', 'Errored', 'Settled', 'Inserted']
  ),
  resourceHintStylesheetLoadErrorStateContract(
    'stylesheet-suspended-commit-state',
    'suspended-commit',
    'stylesheets-count-unsuspend',
    ['stylesheets', 'count', 'unsuspend']
  )
]);

const singletonContracts = freezeArray([
  singletonContract('html-singleton', 'html'),
  singletonContract('head-singleton', 'head'),
  singletonContract('body-singleton', 'body')
]);

const formActionContracts = freezeArray([
  formActionContract('request-form-reset', 'requestFormReset', 'r'),
  formActionContract('use-form-state', 'useFormState', null),
  formActionContract('use-form-status', 'useFormStatus', null),
  formActionContract('function-form-action', 'formAction', null)
]);

const formActionResetDispatcherContracts = freezeArray([
  formActionResetDispatcherContract(
    'form-action-submission-intent',
    'submission',
    'submit',
    'form-action-event-plugin',
    null
  ),
  formActionResetDispatcherContract(
    'form-action-reset-intent',
    'reset',
    null,
    'request-form-reset-dispatcher',
    'r'
  )
]);

const formActionEventExtractionContracts = freezeArray([
  formActionEventExtractionContract(
    'form-action-submit-event-extraction',
    'submit',
    'form-action-submission-intent'
  )
]);

const formActionResetQueueCommitContracts = freezeArray([
  formActionResetQueueCommitContract(
    'form-action-reset-queue-commit-boundary',
    'reset',
    'form-reset-state-queue',
    'after-mutation-form-reset'
  )
]);

const controlledFormContracts = freezeArray([
  controlledFormContract('input-controlled-value', 'input'),
  controlledFormContract('select-controlled-value', 'select'),
  controlledFormContract('textarea-controlled-value', 'textarea')
]);

const controlledInputValueTrackerContracts = freezeArray([
  controlledInputValueTrackerContract(
    'input-value-tracker',
    'input',
    'value',
    'value',
    'string-current-value',
    ['type', 'value', 'defaultValue', 'onChange']
  ),
  controlledInputValueTrackerContract(
    'input-checked-tracker',
    'input',
    'checked',
    'checked',
    'boolean-string-current-value',
    ['type', 'checked', 'defaultChecked', 'onChange']
  ),
  controlledInputValueTrackerContract(
    'select-single-value-tracker',
    'select',
    'single',
    'selectedOptions',
    'single-option-value',
    ['value', 'defaultValue', 'onChange']
  ),
  controlledInputValueTrackerContract(
    'select-multiple-value-tracker',
    'select',
    'multiple',
    'selectedOptions',
    'array-option-values',
    ['multiple', 'value', 'defaultValue', 'onChange']
  ),
  controlledInputValueTrackerContract(
    'textarea-value-tracker',
    'textarea',
    'value',
    'value',
    'string-current-value',
    ['value', 'defaultValue', 'children', 'onChange']
  )
]);

const inputWrapperPropertyNames = freezeArray([
  'type',
  'name',
  'value',
  'defaultValue',
  'checked',
  'defaultChecked'
]);

const selectWrapperPropertyNames = freezeArray([
  'value',
  'defaultValue',
  'multiple'
]);

const textareaWrapperPropertyNames = freezeArray([
  'value',
  'defaultValue',
  'children'
]);

const controlledInputPrivateWrapperPropertyPayloadContracts = freezeArray([
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-type-payload',
    'input',
    'type',
    'input-host-wrapper',
    ['validateInputProps', 'initInput', 'updateInput'],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-name-payload',
    'input',
    'name',
    'input-host-wrapper',
    ['initInput', 'updateInput', 'restoreControlledInputState'],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-value-payload',
    'input',
    'value',
    'input-host-wrapper',
    ['validateInputProps', 'initInput', 'updateInput'],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-default-value-payload',
    'input',
    'defaultValue',
    'input-host-wrapper',
    ['validateInputProps', 'initInput', 'updateInput'],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-checked-payload',
    'input',
    'checked',
    'input-host-wrapper',
    [
      'validateInputProps',
      'initInput',
      'updateInput',
      'restoreControlledInputState'
    ],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-default-checked-payload',
    'input',
    'defaultChecked',
    'input-host-wrapper',
    [
      'validateInputProps',
      'initInput',
      'updateInput',
      'restoreControlledInputState'
    ],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'select-wrapper-value-payload',
    'select',
    'value',
    'select-host-wrapper',
    ['validateSelectProps', 'initSelect', 'updateSelect'],
    selectWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'select-wrapper-default-value-payload',
    'select',
    'defaultValue',
    'select-host-wrapper',
    ['validateSelectProps', 'initSelect', 'updateSelect'],
    selectWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'select-wrapper-multiple-payload',
    'select',
    'multiple',
    'select-host-wrapper',
    ['validateSelectProps', 'initSelect', 'updateSelect'],
    selectWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'textarea-wrapper-value-payload',
    'textarea',
    'value',
    'textarea-host-wrapper',
    ['validateTextareaProps', 'initTextarea', 'updateTextarea'],
    textareaWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'textarea-wrapper-default-value-payload',
    'textarea',
    'defaultValue',
    'textarea-host-wrapper',
    ['validateTextareaProps', 'initTextarea', 'updateTextarea'],
    textareaWrapperPropertyNames
  )
]);

const controlledInputValueTrackerOracleCoverage = freezeArray([
  controlledInputValueTrackerCoverage('input', 12, ['value', 'checked']),
  controlledInputValueTrackerCoverage('select', 6, ['selectedOptions']),
  controlledInputValueTrackerCoverage('textarea', 7, ['value'])
]);

const contractByAreaAndName = new Map();
indexContracts('resource-hint', resourceHintContracts);
indexContracts('host-singleton', singletonContracts);
indexContracts('form-action', formActionContracts);
indexContracts('controlled-form', controlledFormContracts);

const controlledInputValueTrackerContractByKey = new Map();
indexControlledInputValueTrackerContracts();
const controlledInputPrivateWrapperContractByKey = new Map();
indexControlledInputPrivateWrapperPropertyPayloadContracts();

const recordPayloads = new WeakMap();
const formActionResetDispatcherPayloads = new WeakMap();
const formActionEventExtractionPayloads = new WeakMap();
const formActionResetQueueCommitPayloads = new WeakMap();
const resourceHintDispatcherMetadataPayloads = new WeakMap();
const resourceHintFakeDomAdapterAdmissionPayloads = new WeakMap();
const resourceHintFakeDomInsertionPayloads = new WeakMap();
const resourceHintHeadBoundaryPayloads = new WeakMap();
const resourceHintHeadClearRetainPayloads = new WeakMap();
const resourceHintPreloadPreinitOrderPayloads = new WeakMap();
const resourceHintStylesheetPrecedencePayloads = new WeakMap();
const resourceHintResourceMapCommitPayloads = new WeakMap();
const resourceHintStylesheetLoadErrorStatePayloads = new WeakMap();
const controlledInputValueTrackerRecordPayloads = new WeakMap();
const controlledInputValueTrackerFakeDomDiagnosticPayloads = new WeakMap();
const controlledInputValueTrackerFakeDomDiagnosticStates = new WeakMap();
const controlledInputValueTrackerFakeDomStateByTarget = new WeakMap();
const controlledInputPrivateRestoreQueueDiagnosticPayloads = new WeakMap();
const controlledInputPrivateWrapperPropertyPayloadRecordPayloads =
  new WeakMap();
const defaultGate = createResourceFormActionInternalsGate();
const defaultFormActionResetDispatcherGate =
  createFormActionResetDispatcherGate();
const defaultFormActionEventExtractionGate =
  createFormActionEventExtractionGate();
const defaultFormActionResetQueueCommitGate =
  createFormActionResetQueueCommitGate();
const defaultResourceHintFakeDomAdapterGate =
  createResourceHintFakeDomAdapterGate();
const defaultControlledInputValueTrackerGate =
  createControlledInputValueTrackerGate();
const defaultControlledInputPrivateRestoreQueueDiagnosticGate =
  createControlledInputPrivateRestoreQueueDiagnosticGate();
const defaultResourceHintStylesheetLoadErrorStateGate =
  createResourceHintStylesheetLoadErrorStateGate();

function createResourceFormActionInternalsGate(options) {
  const gateState = createGateState(options);

  return Object.freeze({
    recordResourceHintRequest(requestName, args) {
      return recordUnsupportedRequestWithGate(
        gateState,
        'resource-hint',
        requestName,
        args
      );
    },
    recordResourceHintDispatcherRequest(requestName, args) {
      return recordUnsupportedResourceHintDispatcherRequestWithGate(
        gateState,
        requestName,
        args
      );
    },
    recordSingletonRequest(requestName, args) {
      return recordUnsupportedRequestWithGate(
        gateState,
        'host-singleton',
        requestName,
        args
      );
    },
    recordFormActionRequest(requestName, args) {
      return recordUnsupportedRequestWithGate(
        gateState,
        'form-action',
        requestName,
        args
      );
    },
    recordFormActionSubmissionIntent(intent) {
      return recordFormActionResetDispatcherIntentWithGate(
        gateState,
        'submission',
        intent
      );
    },
    recordFormActionResetIntent(intent) {
      return recordFormActionResetDispatcherIntentWithGate(
        gateState,
        'reset',
        intent
      );
    },
    recordFormActionResetQueueCommit(resetRecord, admission) {
      return recordFormActionResetQueueCommitWithGate(
        gateState,
        resetRecord,
        admission
      );
    },
    recordControlledFormRequest(requestName, args) {
      return recordUnsupportedRequestWithGate(
        gateState,
        'controlled-form',
        requestName,
        args
      );
    }
  });
}

function createFormActionResetDispatcherGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'form-action-reset-dispatcher'
  );

  return Object.freeze({
    recordSubmissionIntent(intent) {
      return recordFormActionResetDispatcherIntentWithGate(
        gateState,
        'submission',
        intent
      );
    },
    recordResetIntent(intent) {
      return recordFormActionResetDispatcherIntentWithGate(
        gateState,
        'reset',
        intent
      );
    }
  });
}

function createFormActionEventExtractionGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'form-action-event-extraction'
  );

  return Object.freeze({
    recordEventExtractionFromSubmissionIntent(record) {
      return recordFormActionEventExtractionWithGate(gateState, record);
    }
  });
}

function createFormActionResetQueueCommitGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'form-action-reset-queue-commit'
  );

  return Object.freeze({
    recordResetQueueCommit(resetRecord, admission) {
      return recordFormActionResetQueueCommitWithGate(
        gateState,
        resetRecord,
        admission
      );
    }
  });
}

function createControlledInputValueTrackerGate(options) {
  const gateState = createGateState(options);

  return Object.freeze({
    recordTrackerScenario(scenario) {
      return recordControlledInputValueTrackerScenarioWithGate(
        gateState,
        scenario
      );
    },
    installFakeDomTracker(scenario, admission) {
      return installControlledInputValueTrackerFakeDomDiagnosticWithGate(
        gateState,
        scenario,
        admission
      );
    },
    observeFakeDomTracker(record) {
      return observeControlledInputValueTrackerFakeDomDiagnosticWithGate(
        gateState,
        record
      );
    },
    detachFakeDomTracker(record) {
      return detachControlledInputValueTrackerFakeDomDiagnosticWithGate(
        gateState,
        record
      );
    },
    recordPostEventRestoreIntentFromFakeDomObservation(record, admission) {
      return recordControlledInputPrivateRestoreQueueIntentWithGate(
        gateState,
        record,
        admission
      );
    }
  });
}

function createControlledInputPrivateRestoreQueueDiagnosticGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'controlled-input-restore-queue'
  );

  return Object.freeze({
    recordPostEventRestoreIntentFromFakeDomObservation(record, admission) {
      return recordControlledInputPrivateRestoreQueueIntentWithGate(
        gateState,
        record,
        admission
      );
    }
  });
}

function createResourceHintFakeDomAdapterGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'resource-hint-fake-dom-adapter'
  );

  return Object.freeze({
    admitDispatcherRecord(record, admission) {
      return admitResourceHintFakeDomAdapterRecordWithGate(
        gateState,
        record,
        admission
      );
    }
  });
}

function createResourceHintFakeDomInsertionGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'resource-hint-fake-dom-insertion'
  );
  gateState.insertionConsumed = false;

  return Object.freeze({
    insertAdapterAdmissionRecord(record, insertion) {
      return insertResourceHintFakeDomAdapterAdmissionRecordWithGate(
        gateState,
        record,
        insertion
      );
    }
  });
}

function createResourceHintHeadBoundaryGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'resource-hint-head-boundary'
  );
  gateState.headBoundaryConsumed = false;

  return Object.freeze({
    recordInsertionUpdateBoundary(insertionRecord, headRecord, boundary) {
      return recordResourceHintHeadBoundaryWithGate(
        gateState,
        insertionRecord,
        headRecord,
        boundary
      );
    }
  });
}

function createResourceHintHeadClearRetainGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'resource-hint-head-clear-retain'
  );
  gateState.headClearRetainConsumed = false;

  return Object.freeze({
    recordHeadClearRetainDiagnostic(headBoundaryRecord, diagnostic) {
      return recordResourceHintHeadClearRetainWithGate(
        gateState,
        headBoundaryRecord,
        diagnostic
      );
    }
  });
}

function createResourceHintPreloadPreinitOrderGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'resource-hint-preload-preinit-order'
  );
  gateState.preloadPreinitOrderConsumed = false;

  return Object.freeze({
    recordPreloadPreinitOrderDiagnostic(records, diagnostic) {
      return recordResourceHintPreloadPreinitOrderWithGate(
        gateState,
        records,
        diagnostic
      );
    }
  });
}

function createResourceHintStylesheetPrecedenceGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'resource-hint-stylesheet-precedence'
  );
  gateState.stylesheetPrecedenceConsumed = false;

  return Object.freeze({
    recordStylesheetPrecedenceDiagnostic(orderRecord, headRecord, diagnostic) {
      return recordResourceHintStylesheetPrecedenceWithGate(
        gateState,
        orderRecord,
        headRecord,
        diagnostic
      );
    }
  });
}

function createResourceHintResourceMapCommitGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'resource-hint-resource-map-commit'
  );
  gateState.resourceMapCommitConsumed = false;

  return Object.freeze({
    recordResourceMapCommitDiagnostic(
      orderRecord,
      stylesheetPrecedenceRecord,
      diagnostic,
      stylesheetLoadErrorStateRecord
    ) {
      return recordResourceHintResourceMapCommitWithGate(
        gateState,
        orderRecord,
        stylesheetPrecedenceRecord,
        diagnostic,
        stylesheetLoadErrorStateRecord
      );
    }
  });
}

function createResourceHintStylesheetLoadErrorStateGate(options) {
  const gateState = createGateStateWithDefaultPrefix(
    options,
    'resource-hint-stylesheet-load-error-state'
  );
  gateState.stylesheetLoadErrorStateConsumed = false;

  return Object.freeze({
    recordStylesheetLoadErrorStateDiagnostic(
      stylesheetPrecedenceRecord,
      diagnostic
    ) {
      return recordResourceHintStylesheetLoadErrorStateWithGate(
        gateState,
        stylesheetPrecedenceRecord,
        diagnostic
      );
    }
  });
}

function recordUnsupportedResourceHintRequest(requestName, args) {
  return defaultGate.recordResourceHintRequest(requestName, args);
}

function recordUnsupportedResourceHintDispatcherRequest(requestName, args) {
  return defaultGate.recordResourceHintDispatcherRequest(requestName, args);
}

function admitResourceHintFakeDomAdapterRecord(record, admission) {
  return defaultResourceHintFakeDomAdapterGate.admitDispatcherRecord(
    record,
    admission
  );
}

function recordUnsupportedSingletonRequest(requestName, args) {
  return defaultGate.recordSingletonRequest(requestName, args);
}

function recordUnsupportedFormActionRequest(requestName, args) {
  return defaultGate.recordFormActionRequest(requestName, args);
}

function recordFormActionSubmissionIntent(intent) {
  return defaultFormActionResetDispatcherGate.recordSubmissionIntent(intent);
}

function recordFormActionResetIntent(intent) {
  return defaultFormActionResetDispatcherGate.recordResetIntent(intent);
}

function recordFormActionEventExtractionFromSubmissionIntent(record) {
  return defaultFormActionEventExtractionGate
    .recordEventExtractionFromSubmissionIntent(record);
}

function recordFormActionResetQueueCommit(resetRecord, admission) {
  return defaultFormActionResetQueueCommitGate.recordResetQueueCommit(
    resetRecord,
    admission
  );
}

function recordUnsupportedControlledFormRequest(requestName, args) {
  return defaultGate.recordControlledFormRequest(requestName, args);
}

function recordControlledInputValueTrackerScenario(scenario) {
  return defaultControlledInputValueTrackerGate.recordTrackerScenario(scenario);
}

function installControlledInputValueTrackerFakeDomDiagnostic(
  scenario,
  admission
) {
  return defaultControlledInputValueTrackerGate.installFakeDomTracker(
    scenario,
    admission
  );
}

function observeControlledInputValueTrackerFakeDomDiagnostic(record) {
  return defaultControlledInputValueTrackerGate.observeFakeDomTracker(record);
}

function detachControlledInputValueTrackerFakeDomDiagnostic(record) {
  return defaultControlledInputValueTrackerGate.detachFakeDomTracker(record);
}

function recordControlledInputPostEventRestoreIntentFromFakeDomObservation(
  record,
  admission
) {
  return defaultControlledInputPrivateRestoreQueueDiagnosticGate
    .recordPostEventRestoreIntentFromFakeDomObservation(record, admission);
}

function recordStylesheetLoadErrorStateDiagnostic(record, diagnostic) {
  return defaultResourceHintStylesheetLoadErrorStateGate
    .recordStylesheetLoadErrorStateDiagnostic(record, diagnostic);
}

function createControlledInputPrivateWrapperPropertyPayloadRecord(row) {
  const normalized =
    normalizeControlledInputPrivateWrapperPropertyPayloadRow(row);
  const contract = getControlledInputPrivateWrapperPropertyPayloadContract(
    normalized.hostTag,
    normalized.propName
  );
  const trackerContract = getControlledInputValueTrackerContract(
    normalized.hostTag,
    normalized.controlKind
  );
  const requestType =
    `controlled-wrapper.${normalized.hostTag}.${normalized.propName}`;

  const payload = freezeRecord({
    schemaVersion: controlledInputPrivateWrapperGateSchemaVersion,
    $$typeof: privateControlledInputWrapperPropertyPayloadRecordType,
    kind: 'FastReactDomPrivateControlledInputWrapperPropertyPayloadRecord',
    gateId: controlledInputPrivateWrapperGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    requestType,
    hostTag: normalized.hostTag,
    propName: normalized.propName,
    inputType: normalized.inputType,
    multiple: normalized.multiple,
    controlKind: normalized.controlKind,
    contractId: contract.id,
    oracleKind: controlledInputOracleKind,
    oracleSchemaVersion: 1,
    wrapperMetadata: createControlledInputPrivateWrapperMetadata(
      contract,
      trackerContract,
      normalized
    ),
    valueTrackerMetadata: createControlledInputValueTrackerMetadata(
      trackerContract,
      normalized
    ),
    postEventRestoreBoundary: createPostEventRestoreBoundary(),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects: controlledInputPrivateWrapperSideEffects,
    missingPrerequisites: controlledInputValueTrackerMissingPrerequisites
  });

  controlledInputPrivateWrapperPropertyPayloadRecordPayloads.set(
    payload,
    payload
  );
  return payload;
}

function getPrivateResourceFormActionGateRecordPayload(record) {
  return recordPayloads.get(record) || null;
}

function isPrivateResourceFormActionGateRecord(value) {
  return recordPayloads.has(value);
}

function getPrivateFormActionResetDispatcherRecordPayload(record) {
  return formActionResetDispatcherPayloads.get(record) || null;
}

function isPrivateFormActionResetDispatcherRecord(value) {
  return formActionResetDispatcherPayloads.has(value);
}

function getPrivateFormActionEventExtractionRecordPayload(record) {
  return formActionEventExtractionPayloads.get(record) || null;
}

function isPrivateFormActionEventExtractionRecord(value) {
  return formActionEventExtractionPayloads.has(value);
}

function getPrivateFormActionResetQueueCommitRecordPayload(record) {
  return formActionResetQueueCommitPayloads.get(record) || null;
}

function isPrivateFormActionResetQueueCommitRecord(value) {
  return formActionResetQueueCommitPayloads.has(value);
}

function getPrivateResourceHintDispatcherMetadataRecordPayload(record) {
  return resourceHintDispatcherMetadataPayloads.get(record) || null;
}

function isPrivateResourceHintDispatcherMetadataRecord(value) {
  return resourceHintDispatcherMetadataPayloads.has(value);
}

function getPrivateResourceHintFakeDomAdapterAdmissionRecordPayload(record) {
  return resourceHintFakeDomAdapterAdmissionPayloads.get(record) || null;
}

function isPrivateResourceHintFakeDomAdapterAdmissionRecord(value) {
  return resourceHintFakeDomAdapterAdmissionPayloads.has(value);
}

function getPrivateResourceHintFakeDomInsertionRecordPayload(record) {
  return resourceHintFakeDomInsertionPayloads.get(record) || null;
}

function isPrivateResourceHintFakeDomInsertionRecord(value) {
  return resourceHintFakeDomInsertionPayloads.has(value);
}

function getPrivateResourceHintHeadBoundaryRecordPayload(record) {
  return resourceHintHeadBoundaryPayloads.get(record) || null;
}

function isPrivateResourceHintHeadBoundaryRecord(value) {
  return resourceHintHeadBoundaryPayloads.has(value);
}

function getPrivateResourceHintHeadClearRetainRecordPayload(record) {
  return resourceHintHeadClearRetainPayloads.get(record) || null;
}

function isPrivateResourceHintHeadClearRetainRecord(value) {
  return resourceHintHeadClearRetainPayloads.has(value);
}

function getPrivateResourceHintPreloadPreinitOrderRecordPayload(record) {
  return resourceHintPreloadPreinitOrderPayloads.get(record) || null;
}

function isPrivateResourceHintPreloadPreinitOrderRecord(value) {
  return resourceHintPreloadPreinitOrderPayloads.has(value);
}

function getPrivateResourceHintStylesheetPrecedenceRecordPayload(record) {
  return resourceHintStylesheetPrecedencePayloads.get(record) || null;
}

function isPrivateResourceHintStylesheetPrecedenceRecord(value) {
  return resourceHintStylesheetPrecedencePayloads.has(value);
}

function getPrivateResourceHintResourceMapCommitRecordPayload(record) {
  return resourceHintResourceMapCommitPayloads.get(record) || null;
}

function isPrivateResourceHintResourceMapCommitRecord(value) {
  return resourceHintResourceMapCommitPayloads.has(value);
}

function getPrivateResourceHintStylesheetLoadErrorStateRecordPayload(record) {
  return resourceHintStylesheetLoadErrorStatePayloads.get(record) || null;
}

function isPrivateResourceHintStylesheetLoadErrorStateRecord(value) {
  return resourceHintStylesheetLoadErrorStatePayloads.has(value);
}

function getPrivateControlledInputValueTrackerRecordPayload(record) {
  return controlledInputValueTrackerRecordPayloads.get(record) || null;
}

function isPrivateControlledInputValueTrackerRecord(value) {
  return controlledInputValueTrackerRecordPayloads.has(value);
}

function getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload(
  record
) {
  return controlledInputValueTrackerFakeDomDiagnosticPayloads.get(record) || null;
}

function isPrivateControlledInputValueTrackerFakeDomDiagnosticRecord(value) {
  return controlledInputValueTrackerFakeDomDiagnosticPayloads.has(value);
}

function getPrivateControlledInputRestoreQueueDiagnosticRecordPayload(record) {
  return controlledInputPrivateRestoreQueueDiagnosticPayloads.get(record) || null;
}

function isPrivateControlledInputRestoreQueueDiagnosticRecord(value) {
  return controlledInputPrivateRestoreQueueDiagnosticPayloads.has(value);
}

function getPrivateControlledInputWrapperPropertyPayloadRecordPayload(record) {
  return (
    controlledInputPrivateWrapperPropertyPayloadRecordPayloads.get(record) ||
    null
  );
}

function isPrivateControlledInputWrapperPropertyPayloadRecord(value) {
  return controlledInputPrivateWrapperPropertyPayloadRecordPayloads.has(value);
}

function describeResourceFormActionInternalsGate() {
  return freezeRecord({
    schemaVersion: resourceFormActionInternalsGateSchemaVersion,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeArray([
      oracleEvidence(resourceHintOracleKind, resourceHintContracts.length),
      oracleEvidence(formActionsOracleKind, formActionContracts.length),
      oracleEvidence(controlledInputOracleKind, controlledFormContracts.length)
    ]),
    contracts: freezeRecord({
      resourceHints: resourceHintContracts,
      resourceHintDispatchers: resourceHintDispatcherMetadataContracts,
      resourceHintFakeDomAdapters: resourceHintFakeDomAdapterContracts,
      resourceHintFakeDomInsertions: resourceHintFakeDomInsertionContracts,
      resourceHintHeadBoundaries: resourceHintHeadBoundaryContracts,
      resourceHintHeadClearRetain: resourceHintHeadClearRetainContracts,
      resourceHintPreloadPreinitOrder:
        resourceHintPreloadPreinitOrderContracts,
      resourceHintStylesheetPrecedence:
        resourceHintStylesheetPrecedenceContracts,
      resourceHintResourceMapCommit:
        resourceHintResourceMapCommitContracts,
      resourceHintStylesheetLoadErrorState:
        resourceHintStylesheetLoadErrorStateContracts,
      singletons: singletonContracts,
      formActions: formActionContracts,
      formActionResetDispatchers: formActionResetDispatcherContracts,
      formActionEventExtractions: formActionEventExtractionContracts,
      formActionResetQueueCommit: formActionResetQueueCommitContracts,
      controlledForms: controlledFormContracts,
      controlledInputValueTrackers: controlledInputValueTrackerContracts,
      controlledInputPrivateWrapperPropertyPayloads:
        controlledInputPrivateWrapperPropertyPayloadContracts
    }),
    sideEffects: noSideEffects,
    resourceHintDispatcherMetadata:
      describePrivateResourceHintDispatcherMetadataGate(),
    resourceHintResourceMapCommit:
      describePrivateResourceHintResourceMapCommitGate(),
    formActionResetDispatcher:
      describePrivateFormActionResetDispatcherGate(),
    formActionEventExtraction:
      describePrivateFormActionEventExtractionGate(),
    formActionResetQueueCommit:
      describePrivateFormActionResetQueueCommitGate(),
    controlledInputValueTracker: describeControlledInputValueTrackerGate(),
    missingPrerequisites
  });
}

function describePrivateFormActionResetDispatcherGate() {
  return freezeRecord({
    schemaVersion: formActionResetDispatcherGateSchemaVersion,
    gateId: privateFormActionResetDispatcherGateId,
    compatibilityTarget,
    status: privateFormActionResetDispatcherStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: oracleEvidence(
      formActionsOracleKind,
      formActionResetDispatcherContracts.length
    ),
    contracts: formActionResetDispatcherContracts,
    acceptedIntentKinds: freezeArray(['submission', 'reset']),
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    recordsSubmissionIntentMetadata: true,
    recordsSubmitRequestSubmitActionMetadata: true,
    recordsResetIntentMetadata: true,
    recordsResetDispatcherOrdering: true,
    resetQueueCommitMetadataGateAvailable: true,
    acceptedSubmissionTriggers: formActionSubmissionTriggers,
    acceptedActionKinds: formActionActionKinds,
    acceptedActionSources: formActionActionSources,
    acceptedSubmitControlKinds: formActionSubmitControlKinds,
    acceptedResetOrderingKinds: formActionResetOrderingKinds,
    resetDispatcherOrderingSteps: formActionResetDispatcherOrderingSteps,
    resetQueueCommit:
      describePrivateFormActionResetQueueCommitGate(),
    invokesActions: false,
    constructsFormData: false,
    startsHostTransition: false,
    resetsForms: false,
    sideEffects: formActionResetDispatcherBlockedSideEffects,
    missingPrerequisites: formActionResetDispatcherMissingPrerequisites
  });
}

function describePrivateFormActionEventExtractionGate() {
  return freezeRecord({
    schemaVersion: formActionEventExtractionGateSchemaVersion,
    gateId: privateFormActionEventExtractionGateId,
    compatibilityTarget,
    status: privateFormActionEventExtractionStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: oracleEvidence(
      formActionsOracleKind,
      formActionEventExtractionContracts.length
    ),
    contracts: formActionEventExtractionContracts,
    acceptedSourceRecordType: privateFormActionResetDispatcherRecordType,
    acceptedSourceGateId: privateFormActionResetDispatcherGateId,
    acceptedSourceStatus: privateFormActionSubmissionIntentRecordedStatus,
    acceptedIntentKind: 'submission',
    acceptedEventName: 'submit',
    acceptedSubmissionTriggers: freezeArray(['submit', 'requestSubmit']),
    consumesSubmitRequestSubmitActionMetadata: true,
    recordsEventExtractionMetadata: true,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    createsSyntheticEvents: false,
    constructsFormData: false,
    invokesActions: false,
    startsHostTransition: false,
    queuesReset: false,
    touchesPublicRoot: false,
    sideEffects: formActionEventExtractionBlockedSideEffects,
    missingPrerequisites: formActionEventExtractionMissingPrerequisites
  });
}

function describePrivateFormActionResetQueueCommitGate() {
  return freezeRecord({
    schemaVersion: formActionResetQueueCommitGateSchemaVersion,
    gateId: privateFormActionResetQueueCommitGateId,
    compatibilityTarget,
    status: privateFormActionResetQueueCommitStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: oracleEvidence(
      formActionsOracleKind,
      formActionResetQueueCommitContracts.length
    ),
    contracts: formActionResetQueueCommitContracts,
    acceptedSourceRecordType: privateFormActionResetDispatcherRecordType,
    acceptedSourceIntentKind: 'reset',
    acceptedSourceStatus: privateFormActionResetIntentRecordedStatus,
    acceptedQueueSources: formActionResetQueueSources,
    commitOrderPhases: formActionResetQueueCommitPhases,
    recordsResetQueueMetadata: true,
    recordsResetCommitOrderMetadata: true,
    recordsRenderFlagHandoffMetadata: true,
    acceptsRealForms: false,
    acceptsFormFibers: false,
    acceptsResetQueues: false,
    acceptsHostInstances: false,
    callsPreviousDispatchers: false,
    queuesReactUpdates: false,
    marksFiberFlags: false,
    commitsFormResets: false,
    callsResetFormInstance: false,
    callsFormReset: false,
    sideEffects: formActionResetQueueCommitBlockedSideEffects,
    missingPrerequisites: formActionResetQueueCommitMissingPrerequisites
  });
}

function describePrivateResourceHintDispatcherMetadataGate() {
  return freezeRecord({
    schemaVersion: resourceHintDispatcherMetadataGateSchemaVersion,
    gateId: privateResourceHintDispatcherMetadataGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: oracleEvidence(
      resourceHintOracleKind,
      resourceHintDispatcherMetadataContracts.length
    ),
    contracts: resourceHintDispatcherMetadataContracts,
    sideEffects: resourceHintDispatcherSideEffects,
    missingPrerequisites: resourceHintDispatcherMissingPrerequisites,
    fakeDomAdapter: describePrivateResourceHintFakeDomAdapterGate()
  });
}

function describePrivateResourceHintFakeDomAdapterGate() {
  return freezeRecord({
    schemaVersion: resourceHintFakeDomAdapterGateSchemaVersion,
    gateId: privateResourceHintFakeDomAdapterGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    admissionStatus: privateResourceHintFakeDomAdapterAdmissionRequiredStatus,
    executionStatus: privateResourceHintFakeDomAdapterExecutionBlockedStatus,
    compatibilityStatus:
      privateResourceHintFakeDomAdapterCompatibilityBlockedStatus,
    acceptedRecordType: privateResourceHintDispatcherMetadataRecordType,
    acceptsNormalizedDispatcherRecords: true,
    deterministicFakeDomOnly: true,
    contracts: resourceHintFakeDomAdapterContracts,
    sideEffects: resourceHintFakeDomAdapterSideEffects,
    missingPrerequisites: resourceHintFakeDomAdapterMissingPrerequisites,
    fakeDomInsertion: describePrivateResourceHintFakeDomInsertionGate(),
    preloadPreinitOrder:
      describePrivateResourceHintPreloadPreinitOrderGate(),
    resourceMapCommit:
      describePrivateResourceHintResourceMapCommitGate()
  });
}

function describePrivateResourceHintFakeDomInsertionGate() {
  return freezeRecord({
    schemaVersion: resourceHintFakeDomInsertionGateSchemaVersion,
    gateId: privateResourceHintFakeDomInsertionGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    admissionStatus:
      privateResourceHintFakeDomInsertionAdmissionRequiredStatus,
    executionStatus: null,
    compatibilityStatus:
      privateResourceHintFakeDomInsertionCompatibilityBlockedStatus,
    acceptedRecordType: privateResourceHintFakeDomAdapterAdmissionRecordType,
    acceptsFakeDomAdapterAdmissions: true,
    acceptsContractIds: freezeArray(['preconnect', 'preload']),
    maxInsertionsPerGate: 1,
    deterministicFakeDomOnly: true,
    rawValuesRetained: false,
    publicResourceHintDomInsertion: false,
    contracts: resourceHintFakeDomInsertionContracts,
    sideEffects: resourceHintFakeDomInsertionBlockedSideEffects,
    missingPrerequisites: resourceHintFakeDomInsertionMissingPrerequisites,
    headBoundary: describePrivateResourceHintHeadBoundaryGate()
  });
}

function describePrivateResourceHintHeadBoundaryGate() {
  return freezeRecord({
    schemaVersion: resourceHintHeadBoundaryGateSchemaVersion,
    gateId: privateResourceHintHeadBoundaryGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    admissionStatus: privateResourceHintHeadBoundaryAdmissionRequiredStatus,
    executionStatus: null,
    compatibilityStatus:
      privateResourceHintHeadBoundaryCompatibilityBlockedStatus,
    acceptedInsertionRecordType: privateResourceHintFakeDomInsertionRecordType,
    acceptedHeadRecordType: privateResourceFormActionGateRecordType,
    acceptedHostTag: 'head',
    acceptsContractIds: freezeArray(['preconnect', 'preload']),
    maxBoundariesPerGate: 1,
    deterministicFakeDomOnly: true,
    rawValuesRetained: false,
    publicResourceHintDomInsertion: false,
    publicHeadSingletonBehavior: false,
    contracts: resourceHintHeadBoundaryContracts,
    sideEffects: resourceHintHeadBoundaryBlockedSideEffects,
    missingPrerequisites: resourceHintHeadBoundaryMissingPrerequisites,
    headClearRetain: describePrivateResourceHintHeadClearRetainGate()
  });
}

function describePrivateResourceHintHeadClearRetainGate() {
  return freezeRecord({
    schemaVersion: resourceHintHeadClearRetainGateSchemaVersion,
    gateId: privateResourceHintHeadClearRetainGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    admissionStatus:
      privateResourceHintHeadClearRetainAdmissionRequiredStatus,
    executionStatus: null,
    compatibilityStatus:
      privateResourceHintHeadClearRetainCompatibilityBlockedStatus,
    acceptedHeadBoundaryRecordType:
      privateResourceHintHeadBoundaryRecordType,
    acceptedHostTag: 'head',
    acceptsContractIds: freezeArray(['preconnect', 'preload']),
    maxDiagnosticsPerGate: 1,
    deterministicFakeDomOnly: true,
    mutatesFakeHead: false,
    mutatesRealHead: false,
    clearsHeadChildren: false,
    recordsSingletonRows: true,
    recordsResourceHintRows: true,
    rawValuesRetained: false,
    publicResourceHintDomInsertion: false,
    publicHeadSingletonBehavior: false,
    stylesheetPrecedenceBoundary:
      createStylesheetPrecedenceBlockedBoundary(false, freezeArray([])),
    blockedCapabilities: resourceHintHeadClearRetainBlockedCapabilities,
    contracts: resourceHintHeadClearRetainContracts,
    sideEffects: resourceHintHeadClearRetainBlockedSideEffects,
    missingPrerequisites: resourceHintHeadClearRetainMissingPrerequisites
  });
}

function describePrivateResourceHintPreloadPreinitOrderGate() {
  return freezeRecord({
    schemaVersion: resourceHintPreloadPreinitOrderGateSchemaVersion,
    gateId: privateResourceHintPreloadPreinitOrderGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    admissionStatus:
      privateResourceHintPreloadPreinitOrderAdmissionRequiredStatus,
    executionStatus: null,
    compatibilityStatus:
      privateResourceHintPreloadPreinitOrderCompatibilityBlockedStatus,
    acceptedRecordType: privateResourceHintFakeDomAdapterAdmissionRecordType,
    acceptsFakeDomAdapterAdmissions: true,
    acceptsContractIds: freezeArray([
      'preload',
      'preload-module',
      'preinit-style',
      'preinit-script',
      'preinit-module-script'
    ]),
    deterministicFakeDomOnly: true,
    mutatesFakeHead: false,
    mutatesRealHead: false,
    recordsDedupeRows: true,
    recordsPrecedenceRows: true,
    recordsHeadOrderRows: true,
    recordsScriptModulePreinitRows: true,
    recordsScriptModuleHeadOrderRows: true,
    rawValuesRetained: false,
    publicResourceHintDomInsertion: false,
    publicScriptModuleResourceDispatch: false,
    publicStylesheetPrecedenceBehavior: false,
    stylesheetPrecedenceBoundary:
      createStylesheetPrecedenceOrderDiagnosticBoundary(
        freezeArray([]),
        freezeArray([])
      ),
    stylesheetPrecedence:
      describePrivateResourceHintStylesheetPrecedenceGate(),
    blockedCapabilities: resourceHintPreloadPreinitOrderBlockedCapabilities,
    contracts: resourceHintPreloadPreinitOrderContracts,
    sideEffects: resourceHintPreloadPreinitOrderBlockedSideEffects,
    missingPrerequisites:
      resourceHintPreloadPreinitOrderMissingPrerequisites
  });
}

function describePrivateResourceHintStylesheetPrecedenceGate() {
  return freezeRecord({
    schemaVersion: resourceHintStylesheetPrecedenceGateSchemaVersion,
    gateId: privateResourceHintStylesheetPrecedenceGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    admissionStatus:
      privateResourceHintStylesheetPrecedenceAdmissionRequiredStatus,
    executionStatus: null,
    compatibilityStatus:
      privateResourceHintStylesheetPrecedenceCompatibilityBlockedStatus,
    acceptedOrderRecordType:
      privateResourceHintPreloadPreinitOrderRecordType,
    acceptedHeadRecordType: privateResourceFormActionGateRecordType,
    acceptedHostTag: 'head',
    deterministicFakeDomOnly: true,
    mutatesFakeHead: false,
    mutatesRealHead: false,
    recordsStylesheetDedupeRows: true,
    recordsStylesheetPrecedenceRows: true,
    recordsStylesheetInsertionRows: true,
    recordsHeadSingletonOrderRows: true,
    rawValuesRetained: false,
    publicResourceHintDomInsertion: false,
    publicStylesheetPrecedenceBehavior: false,
    publicHeadSingletonBehavior: false,
    stylesheetLoadErrorState:
      describePrivateResourceHintStylesheetLoadErrorStateGate(),
    blockedCapabilities: resourceHintStylesheetPrecedenceBlockedCapabilities,
    contracts: resourceHintStylesheetPrecedenceContracts,
    sideEffects: resourceHintStylesheetPrecedenceBlockedSideEffects,
    missingPrerequisites:
      resourceHintStylesheetPrecedenceMissingPrerequisites
  });
}

function describePrivateResourceHintResourceMapCommitGate() {
  return freezeRecord({
    schemaVersion: resourceHintResourceMapCommitGateSchemaVersion,
    gateId: privateResourceHintResourceMapCommitGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    admissionStatus:
      privateResourceHintResourceMapCommitAdmissionRequiredStatus,
    executionStatus: null,
    compatibilityStatus:
      privateResourceHintResourceMapCommitCompatibilityBlockedStatus,
    acceptedOrderRecordType:
      privateResourceHintPreloadPreinitOrderRecordType,
    acceptedStylesheetPrecedenceRecordType:
      privateResourceHintStylesheetPrecedenceRecordType,
    acceptedStylesheetLoadErrorStateRecordType:
      privateResourceHintStylesheetLoadErrorStateRecordType,
    acceptedRecordKinds: freezeArray(['stylesheet', 'preload', 'script']),
    deterministicPrivateRecordsOnly: true,
    recordsPrivateResourceMapRows: true,
    recordsStylesheetRows: true,
    recordsPreloadRows: true,
    recordsScriptRows: true,
    recordsModulePreloadRows: true,
    recordsModuleScriptRows: true,
    recordsModuleResourceMapOrderRows: true,
    recordsModuleResourceMapDedupeKeys: true,
    recordsScriptModuleFakeDomCommitExecutionRows: true,
    recordsScriptFakeDomCommitExecutionRows: true,
    recordsModulePreloadFakeDomCommitExecutionRows: true,
    consumesStylesheetLoadErrorState: true,
    recordsStylesheetLoadStateCommitOrderRows: true,
    validatesStylesheetLoadStateResourceMapRows: true,
    recordsStylesheetLoadStateCommitTransition: true,
    recordsOneFakeResourceMapCommitTransition: true,
    rejectsMalformedModuleRows: true,
    rejectsConflictingDuplicateRecords: true,
    rejectsDuplicateStylesheetPrecedenceRows: true,
    rejectsStaleStylesheetResourceMapEntries: true,
    rejectsPublicResourceDispatchClaims: true,
    mutatesRealResourceMaps: false,
    mutatesFakeResourceMaps: false,
    mutatesFakeHead: false,
    mutatesRealHead: false,
    claimsSingletonOwnership: false,
    startsFetchOrPreload: false,
    startsScriptExecution: false,
    mutatesLoadState: false,
    dispatchesPreloadOrStyleDomWork: false,
    rawValuesRetained: false,
    publicResourceHintDomInsertion: false,
    publicScriptModuleResourceDispatch: false,
    publicStylesheetLoadStateDispatch: false,
    publicResourceMapCommitBehavior: false,
    blockedCapabilities: resourceHintResourceMapCommitBlockedCapabilities,
    contracts: resourceHintResourceMapCommitContracts,
    sideEffects: resourceHintResourceMapCommitBlockedSideEffects,
    missingPrerequisites:
      resourceHintResourceMapCommitMissingPrerequisites
  });
}


function describePrivateResourceHintStylesheetLoadErrorStateGate() {
  return freezeRecord({
    schemaVersion: resourceHintStylesheetLoadErrorStateGateSchemaVersion,
    gateId: privateResourceHintStylesheetLoadErrorStateGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    admissionStatus:
      privateResourceHintStylesheetLoadErrorStateAdmissionRequiredStatus,
    executionStatus: null,
    compatibilityStatus:
      privateResourceHintStylesheetLoadErrorStateCompatibilityBlockedStatus,
    acceptedStylesheetPrecedenceRecordType:
      privateResourceHintStylesheetPrecedenceRecordType,
    deterministicFakeRecordsOnly: true,
    recordsStylesheetResourceShape: true,
    recordsStylesheetStateShape: true,
    recordsLoadingBitmasks: true,
    recordsLoadErrorTransitions: true,
    recordsPreloadStateShape: true,
    recordsSuspendedCommitShape: true,
    installsLoadListeners: false,
    installsErrorListeners: false,
    createsLoadingPromises: false,
    fetchesStylesheets: false,
    suspendsCommits: false,
    schedulesRealTimers: false,
    rejectsPublicResourceDispatchClaims: true,
    rawValuesRetained: false,
    publicResourceHintDomInsertion: false,
    publicStylesheetResourceBehavior: false,
    publicStylesheetPrecedenceBehavior: false,
    loadingStateBits: createStylesheetLoadingStateBitRows(),
    blockedCapabilities:
      resourceHintStylesheetLoadErrorStateBlockedCapabilities,
    contracts: resourceHintStylesheetLoadErrorStateContracts,
    sideEffects: resourceHintStylesheetLoadErrorStateBlockedSideEffects,
    missingPrerequisites:
      resourceHintStylesheetLoadErrorStateMissingPrerequisites
  });
}


function describeControlledInputValueTrackerGate() {
  return freezeRecord({
    schemaVersion: controlledInputValueTrackerGateSchemaVersion,
    gateId: controlledInputValueTrackerGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeArray([
      oracleEvidence(
        controlledInputOracleKind,
        controlledInputValueTrackerContracts.length
      )
    ]),
    oracleCoverage: controlledInputValueTrackerOracleCoverage,
    contracts: controlledInputValueTrackerContracts,
    fakeDomDiagnostic:
      describeControlledInputValueTrackerFakeDomDiagnosticGate(),
    privateRestoreQueueDiagnostic:
      describeControlledInputPrivateRestoreQueueDiagnosticGate(),
    privateWrapperPropertyPayload:
      describeControlledInputPrivateWrapperPropertyPayloadGate(),
    postEventRestoreBoundary: createPostEventRestoreBoundary(),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects: controlledInputValueTrackerSideEffects,
    missingPrerequisites: controlledInputValueTrackerMissingPrerequisites
  });
}

function describeControlledInputValueTrackerFakeDomDiagnosticGate() {
  return freezeRecord({
    schemaVersion: controlledInputValueTrackerFakeDomDiagnosticGateSchemaVersion,
    gateId: controlledInputValueTrackerFakeDomDiagnosticGateId,
    compatibilityTarget,
    status: controlledInputValueTrackerFakeDomDiagnosticStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeArray([
      oracleEvidence(
        controlledInputOracleKind,
        controlledInputValueTrackerContracts.length
      )
    ]),
    contracts: controlledInputValueTrackerContracts,
    acceptedOperations: freezeArray(['install', 'observe', 'detach']),
    deterministicFakeDomOnly: true,
    fakeDomTargetMarker: controlledInputValueTrackerFakeDomTargetMarker,
    liveDomDescriptorInstallation: false,
    realDomNodeAccepted: false,
    restoreQueueDiagnostic:
      describeControlledInputPrivateRestoreQueueDiagnosticGate(),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects: controlledInputValueTrackerFakeDomDiagnosticNoSideEffects,
    missingPrerequisites: controlledInputValueTrackerMissingPrerequisites
  });
}

function describeControlledInputPrivateRestoreQueueDiagnosticGate() {
  return freezeRecord({
    schemaVersion:
      controlledInputPrivateRestoreQueueDiagnosticGateSchemaVersion,
    gateId: controlledInputPrivateRestoreQueueDiagnosticGateId,
    compatibilityTarget,
    status: controlledInputPrivateRestoreQueueDiagnosticStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeArray([
      oracleEvidence(
        controlledInputOracleKind,
        controlledInputValueTrackerContracts.length
      )
    ]),
    acceptedSourceRecordType:
      privateControlledInputValueTrackerFakeDomDiagnosticRecordType,
    acceptedSourceOperation: 'observe',
    recordsPostEventRestoreIntent: true,
    deterministicFakeDomOnly: true,
    writesRestoreQueue: false,
    flushesRestoreQueue: false,
    latestPropsLookup: false,
    eventPluginDispatch: false,
    liveDomDescriptorInstallation: false,
    realDomNodeAccepted: false,
    liveRestoreMutationPreflight:
      createControlledInputLiveRestorePreflightBoundary(),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects: controlledInputPrivateRestoreQueueDiagnosticNoSideEffects,
    missingPrerequisites: controlledInputValueTrackerMissingPrerequisites
  });
}

function describeControlledInputPrivateWrapperPropertyPayloadGate() {
  return freezeRecord({
    schemaVersion: controlledInputPrivateWrapperGateSchemaVersion,
    gateId: controlledInputPrivateWrapperGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    oracleEvidence: freezeArray([
      oracleEvidence(
        controlledInputOracleKind,
        controlledInputPrivateWrapperPropertyPayloadContracts.length
      )
    ]),
    contracts: controlledInputPrivateWrapperPropertyPayloadContracts,
    valueTrackerGateId: controlledInputValueTrackerGateId,
    postEventRestoreBoundary: createPostEventRestoreBoundary(),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects: controlledInputPrivateWrapperSideEffects,
    missingPrerequisites: controlledInputValueTrackerMissingPrerequisites
  });
}

function createUnsupportedResourceFormActionInternalsError(record) {
  const payload = assertPrivateResourceFormActionGateRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was requested',
    'The private resource/form action internals gate records metadata only.'
  );

  error.code = privateResourceFormActionGateErrorCode;
  error.requestId = payload.requestId;
  error.requestSequence = payload.requestSequence;
  error.requestType = payload.requestType;
  error.behaviorArea = payload.behaviorArea;
  error.requestName = payload.requestName;
  error.status = payload.status;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedControlledInputValueTrackerError(record) {
  const payload = assertPrivateControlledInputValueTrackerRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    `controlled-value-tracker.${payload.hostTag}`,
    'was requested',
    'The private controlled input value-tracker gate records metadata only.'
  );

  error.code = privateControlledInputValueTrackerGateErrorCode;
  error.requestId = payload.requestId;
  error.requestSequence = payload.requestSequence;
  error.scenarioId = payload.scenarioId;
  error.phaseId = payload.phaseId;
  error.hostTag = payload.hostTag;
  error.controlKind = payload.controlKind;
  error.status = payload.status;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedFormActionResetDispatcherError(record) {
  const payload = assertPrivateFormActionResetDispatcherRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private form action/reset dispatcher gate records intent metadata only.'
  );

  error.code = privateFormActionResetDispatcherGateErrorCode;
  error.requestId = payload.requestId;
  error.requestSequence = payload.requestSequence;
  error.requestType = payload.requestType;
  error.intentKind = payload.intentKind;
  error.contractId = payload.contractId;
  error.status = payload.status;
  error.intent = payload.intent;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedFormActionEventExtractionError(record) {
  const payload = assertPrivateFormActionEventExtractionRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private form action event-extraction gate records submit metadata only.'
  );

  error.code = privateFormActionEventExtractionGateErrorCode;
  error.extractionId = payload.extractionId;
  error.extractionSequence = payload.extractionSequence;
  error.sourceRequestId = payload.sourceRequestId;
  error.sourceRequestSequence = payload.sourceRequestSequence;
  error.requestType = payload.requestType;
  error.status = payload.status;
  error.eventExtraction = payload.eventExtraction;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedFormActionResetQueueCommitError(record) {
  const payload = assertPrivateFormActionResetQueueCommitRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private form reset queue/commit gate records boundary metadata only.'
  );

  error.code = privateFormActionResetQueueCommitGateErrorCode;
  error.requestId = payload.requestId;
  error.requestSequence = payload.requestSequence;
  error.requestType = payload.requestType;
  error.sourceResetRequestId = payload.sourceResetRequestId;
  error.sourceResetRequestSequence = payload.sourceResetRequestSequence;
  error.sourceResetOrderingKind = payload.sourceResetOrderingKind;
  error.status = payload.status;
  error.queueBoundary = payload.queueBoundary;
  error.commitBoundary = payload.commitBoundary;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedControlledInputRestoreQueueDiagnosticError(record) {
  const payload = assertPrivateControlledInputRestoreQueueDiagnosticRecord(
    record
  );
  const error = createUnsupportedError(
    'react-dom/private-internals',
    `controlled-restore-queue.${payload.hostTag}`,
    'was requested',
    'The private controlled input restore queue diagnostic records fake-DOM intent only.'
  );

  error.code = privateControlledInputRestoreQueueDiagnosticGateErrorCode;
  error.requestId = payload.requestId;
  error.requestSequence = payload.requestSequence;
  error.sourceTrackerRequestId = payload.sourceTrackerRequestId;
  error.sourceTrackerRequestSequence = payload.sourceTrackerRequestSequence;
  error.scenarioId = payload.scenarioId;
  error.phaseId = payload.phaseId;
  error.hostTag = payload.hostTag;
  error.controlKind = payload.controlKind;
  error.status = payload.status;
  error.restoreIntent = payload.restoreIntent;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedResourceHintDispatcherMetadataError(record) {
  const payload = assertPrivateResourceHintDispatcherMetadataRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was requested',
    'The private resource hint dispatcher metadata gate records accepted request shapes only.'
  );

  error.code = privateResourceHintDispatcherMetadataGateErrorCode;
  error.requestId = payload.requestId;
  error.requestSequence = payload.requestSequence;
  error.requestType = payload.requestType;
  error.requestName = payload.requestName;
  error.contractId = payload.contractId;
  error.privateDispatcherKey = payload.privateDispatcherKey;
  error.status = payload.status;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedResourceHintFakeDomAdapterError(record) {
  const payload = assertPrivateResourceHintFakeDomAdapterAdmissionRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was admitted',
    'The private resource hint fake DOM adapter gate admits records only.'
  );

  error.code = privateResourceHintFakeDomAdapterGateErrorCode;
  error.adapterAdmissionId = payload.adapterAdmissionId;
  error.adapterAdmissionSequence = payload.adapterAdmissionSequence;
  error.sourceRequestId = payload.sourceRequestId;
  error.sourceRequestSequence = payload.sourceRequestSequence;
  error.requestType = payload.requestType;
  error.contractId = payload.contractId;
  error.privateDispatcherKey = payload.privateDispatcherKey;
  error.admissionStatus = payload.admissionStatus;
  error.executionStatus = payload.executionStatus;
  error.compatibilityStatus = payload.compatibilityStatus;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedResourceHintFakeDomInsertionError(record) {
  const payload = assertPrivateResourceHintFakeDomInsertionRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was inserted',
    'The private resource hint fake DOM insertion gate is a deterministic fake-DOM diagnostic only.'
  );

  error.code = privateResourceHintFakeDomInsertionGateErrorCode;
  error.insertionId = payload.insertionId;
  error.insertionSequence = payload.insertionSequence;
  error.sourceAdapterAdmissionId = payload.sourceAdapterAdmissionId;
  error.sourceRequestId = payload.sourceRequestId;
  error.sourceRequestSequence = payload.sourceRequestSequence;
  error.requestType = payload.requestType;
  error.contractId = payload.contractId;
  error.privateDispatcherKey = payload.privateDispatcherKey;
  error.insertionStatus = payload.insertionStatus;
  error.executionStatus = payload.executionStatus;
  error.compatibilityStatus = payload.compatibilityStatus;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedResourceHintHeadBoundaryError(record) {
  const payload = assertPrivateResourceHintHeadBoundaryRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private resource hint head singleton boundary gate is a deterministic fake-DOM diagnostic only.'
  );

  error.code = privateResourceHintHeadBoundaryGateErrorCode;
  error.boundaryId = payload.boundaryId;
  error.boundarySequence = payload.boundarySequence;
  error.sourceInsertionId = payload.sourceInsertionId;
  error.sourceHeadRequestId = payload.sourceHeadRequestId;
  error.requestType = payload.requestType;
  error.contractId = payload.contractId;
  error.boundaryContractId = payload.boundaryContractId;
  error.hostTag = payload.hostTag;
  error.boundaryStatus = payload.boundaryStatus;
  error.executionStatus = payload.executionStatus;
  error.compatibilityStatus = payload.compatibilityStatus;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedResourceHintHeadClearRetainError(record) {
  const payload = assertPrivateResourceHintHeadClearRetainRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private resource hint head clear/retain gate is a deterministic fake-DOM diagnostic only.'
  );

  error.code = privateResourceHintHeadClearRetainGateErrorCode;
  error.clearRetainId = payload.clearRetainId;
  error.clearRetainSequence = payload.clearRetainSequence;
  error.sourceBoundaryId = payload.sourceBoundaryId;
  error.sourceInsertionId = payload.sourceInsertionId;
  error.sourceHeadRequestId = payload.sourceHeadRequestId;
  error.requestType = payload.requestType;
  error.contractId = payload.contractId;
  error.hostTag = payload.hostTag;
  error.clearRetainStatus = payload.clearRetainStatus;
  error.executionStatus = payload.executionStatus;
  error.compatibilityStatus = payload.compatibilityStatus;
  error.blockedCapabilities = payload.blockedCapabilities;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedResourceHintPreloadPreinitOrderError(record) {
  const payload = assertPrivateResourceHintPreloadPreinitOrderRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private resource hint preload/preinit dedupe and order gate is a deterministic fake-DOM diagnostic only.'
  );

  error.code = privateResourceHintPreloadPreinitOrderGateErrorCode;
  error.orderDiagnosticId = payload.orderDiagnosticId;
  error.orderDiagnosticSequence = payload.orderDiagnosticSequence;
  error.requestType = payload.requestType;
  error.orderStatus = payload.orderStatus;
  error.executionStatus = payload.executionStatus;
  error.compatibilityStatus = payload.compatibilityStatus;
  error.sourceAdapterAdmissionIds = payload.sourceAdapterAdmissionIds;
  error.blockedCapabilities = payload.blockedCapabilities;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedResourceHintStylesheetPrecedenceError(record) {
  const payload = assertPrivateResourceHintStylesheetPrecedenceRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private resource hint stylesheet precedence gate is a deterministic fake-DOM diagnostic only.'
  );

  error.code = privateResourceHintStylesheetPrecedenceGateErrorCode;
  error.stylesheetPrecedenceId = payload.stylesheetPrecedenceId;
  error.stylesheetPrecedenceSequence =
    payload.stylesheetPrecedenceSequence;
  error.requestType = payload.requestType;
  error.stylesheetPrecedenceStatus = payload.stylesheetPrecedenceStatus;
  error.executionStatus = payload.executionStatus;
  error.compatibilityStatus = payload.compatibilityStatus;
  error.sourceOrderDiagnosticId = payload.sourceOrderDiagnosticId;
  error.sourceHeadRequestId = payload.sourceHeadRequestId;
  error.blockedCapabilities = payload.blockedCapabilities;
  error.sideEffects = payload.sideEffects;

  return error;
}

function createUnsupportedResourceHintResourceMapCommitError(record) {
  const payload = assertPrivateResourceHintResourceMapCommitRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private resource hint resource-map commit gate records private diagnostics only.'
  );

  error.code = privateResourceHintResourceMapCommitGateErrorCode;
  error.resourceMapCommitId = payload.resourceMapCommitId;
  error.resourceMapCommitSequence = payload.resourceMapCommitSequence;
  error.requestType = payload.requestType;
  error.resourceMapCommitStatus = payload.resourceMapCommitStatus;
  error.executionStatus = payload.executionStatus;
  error.compatibilityStatus = payload.compatibilityStatus;
  error.sourceOrderDiagnosticId = payload.sourceOrderDiagnosticId;
  error.sourceStylesheetPrecedenceId =
    payload.sourceStylesheetPrecedenceId;
  error.sourceStylesheetLoadErrorStateId =
    payload.sourceStylesheetLoadErrorStateId;
  error.blockedCapabilities = payload.blockedCapabilities;
  error.sideEffects = payload.sideEffects;

  return error;
}


function createUnsupportedResourceHintStylesheetLoadErrorStateError(record) {
  const payload =
    assertPrivateResourceHintStylesheetLoadErrorStateRecord(record);
  const error = createUnsupportedError(
    'react-dom/private-internals',
    payload.requestType,
    'was recorded',
    'The private resource hint stylesheet load/error state gate is a deterministic fake-record diagnostic only.'
  );

  error.code = privateResourceHintStylesheetLoadErrorStateGateErrorCode;
  error.stylesheetLoadErrorStateId = payload.stylesheetLoadErrorStateId;
  error.stylesheetLoadErrorStateSequence =
    payload.stylesheetLoadErrorStateSequence;
  error.requestType = payload.requestType;
  error.stylesheetLoadErrorStateStatus =
    payload.stylesheetLoadErrorStateStatus;
  error.executionStatus = payload.executionStatus;
  error.compatibilityStatus = payload.compatibilityStatus;
  error.sourceStylesheetPrecedenceId =
    payload.sourceStylesheetPrecedenceId;
  error.blockedCapabilities = payload.blockedCapabilities;
  error.sideEffects = payload.sideEffects;

  return error;
}


function recordUnsupportedRequestWithGate(
  gateState,
  behaviorArea,
  requestName,
  args
) {
  const contract = getAcceptedContract(behaviorArea, requestName);
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const requestType = `${behaviorArea}.${contract.requestName}`;
  const argumentInfo = describeArgumentList(args);

  const payload = freezeRecord({
    schemaVersion: resourceFormActionInternalsGateSchemaVersion,
    $$typeof: privateResourceFormActionGateRecordType,
    kind: 'FastReactDomPrivateResourceFormActionGateRecord',
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    requestType,
    behaviorArea,
    requestName: contract.requestName,
    contractId: contract.id,
    oracleKind: contract.oracleKind,
    oracleSchemaVersion: 1,
    publicName: contract.publicName,
    privateDispatcherKey: contract.privateDispatcherKey,
    hostTag: contract.hostTag,
    sideEffects: noSideEffects,
    missingPrerequisites,
    argumentInfo
  });

  recordPayloads.set(payload, payload);
  return payload;
}

function recordFormActionResetDispatcherIntentWithGate(
  gateState,
  intentKind,
  intent
) {
  const contract = getFormActionResetDispatcherContract(intentKind);
  const normalizedIntent =
    normalizeFormActionResetDispatcherIntent(contract, intent);
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const status =
    intentKind === 'submission'
      ? privateFormActionSubmissionIntentRecordedStatus
      : privateFormActionResetIntentRecordedStatus;
  const sideEffects =
    intentKind === 'submission'
      ? formActionSubmissionIntentSideEffects
      : formActionResetIntentSideEffects;

  const payload = freezeRecord({
    schemaVersion: formActionResetDispatcherGateSchemaVersion,
    $$typeof: privateFormActionResetDispatcherRecordType,
    kind: 'FastReactDomPrivateFormActionResetDispatcherRecord',
    gateId: privateFormActionResetDispatcherGateId,
    compatibilityTarget,
    status,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    requestType: `form-action-reset-dispatcher.${intentKind}`,
    intentKind,
    contractId: contract.id,
    oracleKind: formActionsOracleKind,
    oracleSchemaVersion: 1,
    eventName: contract.eventName,
    dispatcherName: contract.dispatcherName,
    privateDispatcherKey: contract.privateDispatcherKey,
    intent: normalizedIntent,
    dispatcherBoundary:
      createFormActionResetDispatcherBoundary(contract, normalizedIntent),
    sideEffects,
    missingPrerequisites: formActionResetDispatcherMissingPrerequisites
  });

  formActionResetDispatcherPayloads.set(payload, payload);
  return payload;
}

function recordFormActionEventExtractionWithGate(gateState, record) {
  const sourceRecord = assertFormActionSubmissionRecordForEventExtraction(
    record
  );
  const contract = getFormActionEventExtractionContract(
    sourceRecord.contractId
  );
  const extractionSequence = gateState.nextRequestSequence++;
  const extractionId = `${gateState.requestIdPrefix}:${extractionSequence}`;
  const sourceActionMetadata = sourceRecord.intent.actionMetadata;

  const payload = freezeRecord({
    schemaVersion: formActionEventExtractionGateSchemaVersion,
    $$typeof: privateFormActionEventExtractionRecordType,
    kind: 'FastReactDomPrivateFormActionEventExtractionRecord',
    gateId: privateFormActionEventExtractionGateId,
    compatibilityTarget,
    status: privateFormActionEventExtractionRecordedStatus,
    unsupportedCode: unimplementedCode,
    extractionId,
    extractionSequence,
    sourceRequestId: sourceRecord.requestId,
    sourceRequestSequence: sourceRecord.requestSequence,
    sourceRequestType: sourceRecord.requestType,
    sourceGateId: sourceRecord.gateId,
    sourceStatus: sourceRecord.status,
    requestType: `form-action-event-extraction.${contract.eventName}`,
    intentKind: sourceRecord.intentKind,
    contractId: contract.id,
    sourceContractId: sourceRecord.contractId,
    oracleKind: sourceRecord.oracleKind,
    oracleSchemaVersion: sourceRecord.oracleSchemaVersion,
    eventName: contract.eventName,
    submissionTrigger: sourceRecord.intent.submissionTrigger,
    actionKind: sourceRecord.intent.actionKind,
    actionSource: sourceRecord.intent.actionSource,
    submitControlKind: sourceRecord.intent.submitControlKind,
    formActionKind: sourceRecord.intent.formActionKind,
    submitterActionKind: sourceRecord.intent.submitterActionKind,
    submitterActionOverridesFormAction:
      sourceRecord.intent.submitterActionOverridesFormAction,
    sourceActionMetadata:
      createFormActionEventExtractionSourceActionMetadata(
        sourceActionMetadata
      ),
    eventExtraction:
      createFormActionEventExtractionMetadata(sourceRecord),
    eventExtractionBoundary:
      createFormActionEventExtractionBoundary(contract, sourceRecord),
    sideEffects: formActionEventExtractionMetadataSideEffects,
    missingPrerequisites: formActionEventExtractionMissingPrerequisites
  });

  formActionEventExtractionPayloads.set(payload, payload);
  return payload;
}

function recordFormActionResetQueueCommitWithGate(
  gateState,
  resetRecord,
  admission
) {
  const sourceReset = assertFormActionResetIntentRecordForQueueCommit(
    resetRecord
  );
  const normalizedAdmission =
    normalizeFormActionResetQueueCommitAdmission(admission);
  const contract = formActionResetQueueCommitContracts[0];
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const queueBoundary = createFormActionResetQueueBoundary(
    sourceReset,
    normalizedAdmission
  );
  const commitBoundary = createFormActionResetCommitBoundary(
    sourceReset,
    normalizedAdmission
  );

  const payload = freezeRecord({
    schemaVersion: formActionResetQueueCommitGateSchemaVersion,
    $$typeof: privateFormActionResetQueueCommitRecordType,
    kind: 'FastReactDomPrivateFormActionResetQueueCommitRecord',
    gateId: privateFormActionResetQueueCommitGateId,
    compatibilityTarget,
    status: privateFormActionResetQueueCommitRecordedStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    requestType: 'form-action-reset-queue-commit.boundary',
    contractId: contract.id,
    oracleKind: formActionsOracleKind,
    oracleSchemaVersion: 1,
    sourceResetRequestId: sourceReset.requestId,
    sourceResetRequestSequence: sourceReset.requestSequence,
    sourceResetRequestType: sourceReset.requestType,
    sourceResetStatus: sourceReset.status,
    sourceResetOrderingKind: sourceReset.intent.orderingKind,
    sourceResetSource: sourceReset.intent.resetSource,
    sourceTransitionContext: sourceReset.intent.transitionContext,
    sourceResetIntent:
      createFormActionResetQueueCommitSourceReset(sourceReset),
    admission: normalizedAdmission,
    queueBoundary,
    commitBoundary,
    publicFormActionBoundary:
      createPublicFormActionResetQueueCommitBoundary(),
    sideEffects: formActionResetQueueCommitDiagnosticSideEffects,
    missingPrerequisites: formActionResetQueueCommitMissingPrerequisites
  });

  formActionResetQueueCommitPayloads.set(payload, payload);
  return payload;
}

function recordUnsupportedResourceHintDispatcherRequestWithGate(
  gateState,
  requestName,
  args
) {
  const contract = getAcceptedResourceHintDispatcherMetadataContract(
    requestName
  );
  const dispatcherShape = validateResourceHintDispatcherShape(contract, args);
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const requestType = `resource-hint-dispatcher.${contract.id}`;

  const payload = freezeRecord({
    schemaVersion: resourceHintDispatcherMetadataGateSchemaVersion,
    $$typeof: privateResourceHintDispatcherMetadataRecordType,
    kind: 'FastReactDomPrivateResourceHintDispatcherMetadataRecord',
    gateId: privateResourceHintDispatcherMetadataGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    requestType,
    requestName: contract.requestName,
    contractId: contract.id,
    oracleKind: resourceHintOracleKind,
    oracleSchemaVersion: 1,
    publicName: contract.publicName,
    privateDispatcherKey: contract.privateDispatcherKey,
    dispatcherShape,
    sideEffects: resourceHintDispatcherSideEffects,
    missingPrerequisites: resourceHintDispatcherMissingPrerequisites
  });

  resourceHintDispatcherMetadataPayloads.set(payload, payload);
  return payload;
}

function admitResourceHintFakeDomAdapterRecordWithGate(
  gateState,
  record,
  admission
) {
  const dispatcherRecord =
    assertResourceHintDispatcherMetadataRecordForFakeDomAdapter(record);
  const adapterAdmission =
    normalizeResourceHintFakeDomAdapterAdmission(admission);
  const contract = getResourceHintFakeDomAdapterContract(
    dispatcherRecord.contractId
  );
  const requestSequence = gateState.nextRequestSequence++;
  const adapterAdmissionId = `${gateState.requestIdPrefix}:${requestSequence}`;

  const payload = freezeRecord({
    schemaVersion: resourceHintFakeDomAdapterGateSchemaVersion,
    $$typeof: privateResourceHintFakeDomAdapterAdmissionRecordType,
    kind: 'FastReactDomPrivateResourceHintFakeDomAdapterAdmissionRecord',
    gateId: privateResourceHintFakeDomAdapterGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    adapterAdmissionId,
    adapterAdmissionSequence: requestSequence,
    sourceRequestId: dispatcherRecord.requestId,
    sourceRequestSequence: dispatcherRecord.requestSequence,
    sourceRequestType: dispatcherRecord.requestType,
    requestType: `resource-hint-fake-dom-adapter.${contract.id}`,
    requestName: dispatcherRecord.requestName,
    contractId: contract.id,
    oracleKind: dispatcherRecord.oracleKind,
    oracleSchemaVersion: dispatcherRecord.oracleSchemaVersion,
    publicName: dispatcherRecord.publicName,
    privateDispatcherKey: dispatcherRecord.privateDispatcherKey,
    admissionStatus: privateResourceHintFakeDomAdapterAdmissionStatus,
    executionStatus: privateResourceHintFakeDomAdapterExecutionBlockedStatus,
    compatibilityStatus:
      privateResourceHintFakeDomAdapterCompatibilityBlockedStatus,
    dispatcherShape: dispatcherRecord.dispatcherShape,
    adapterAdmission,
    resourceElementPlan: createResourceHintFakeDomResourceElementPlan(contract),
    sideEffects: resourceHintFakeDomAdapterSideEffects,
    missingPrerequisites: resourceHintFakeDomAdapterMissingPrerequisites
  });

  resourceHintFakeDomAdapterAdmissionPayloads.set(payload, payload);
  return payload;
}

function insertResourceHintFakeDomAdapterAdmissionRecordWithGate(
  gateState,
  record,
  insertion
) {
  if (gateState.insertionConsumed === true) {
    throwInvalidResourceHintFakeDomInsertionAdmission(
      'fake DOM insertion gate admits exactly one record'
    );
  }

  const adapterAdmission =
    assertFakeDomAdapterAdmissionRecordForInsertion(record);
  const contract = getResourceHintFakeDomInsertionContract(
    adapterAdmission.contractId
  );
  const insertionAdmission =
    normalizeResourceHintFakeDomInsertionAdmission(insertion);
  const insertedElement = insertFakeDomResourceHintElement(
    contract,
    adapterAdmission,
    insertion.fakeDocument,
    insertion.fakeHead
  );
  gateState.insertionConsumed = true;

  const insertionSequence = gateState.nextRequestSequence++;
  const insertionId = `${gateState.requestIdPrefix}:${insertionSequence}`;

  const payload = freezeRecord({
    schemaVersion: resourceHintFakeDomInsertionGateSchemaVersion,
    $$typeof: privateResourceHintFakeDomInsertionRecordType,
    kind: 'FastReactDomPrivateResourceHintFakeDomInsertionRecord',
    gateId: privateResourceHintFakeDomInsertionGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    insertionId,
    insertionSequence,
    sourceAdapterAdmissionId: adapterAdmission.adapterAdmissionId,
    sourceAdapterAdmissionSequence:
      adapterAdmission.adapterAdmissionSequence,
    sourceRequestId: adapterAdmission.sourceRequestId,
    sourceRequestSequence: adapterAdmission.sourceRequestSequence,
    sourceRequestType: adapterAdmission.sourceRequestType,
    requestType: `resource-hint-fake-dom-insertion.${contract.id}`,
    requestName: adapterAdmission.requestName,
    contractId: contract.id,
    oracleKind: adapterAdmission.oracleKind,
    oracleSchemaVersion: adapterAdmission.oracleSchemaVersion,
    publicName: adapterAdmission.publicName,
    privateDispatcherKey: adapterAdmission.privateDispatcherKey,
    admissionStatus: adapterAdmission.admissionStatus,
    insertionStatus: privateResourceHintFakeDomInsertionStatus,
    executionStatus: privateResourceHintFakeDomInsertionExecutionStatus,
    compatibilityStatus:
      privateResourceHintFakeDomInsertionCompatibilityBlockedStatus,
    dispatcherShape: adapterAdmission.dispatcherShape,
    adapterAdmission: adapterAdmission.adapterAdmission,
    insertionAdmission,
    resourceElementPlan:
      createResourceHintFakeDomInsertedResourceElementPlan(
        contract,
        insertedElement
      ),
    publicResourceBoundary: createPublicResourceHintDomInsertionBoundary(),
    sideEffects: resourceHintFakeDomInsertionSideEffects,
    missingPrerequisites: resourceHintFakeDomInsertionMissingPrerequisites
  });

  resourceHintFakeDomInsertionPayloads.set(payload, payload);
  return payload;
}

function recordResourceHintHeadBoundaryWithGate(
  gateState,
  insertionRecord,
  headRecord,
  boundary
) {
  if (gateState.headBoundaryConsumed === true) {
    throwInvalidResourceHintHeadBoundaryAdmission(
      'head boundary gate admits exactly one insertion/update record'
    );
  }

  const insertion =
    assertFakeDomInsertionRecordForHeadBoundary(insertionRecord);
  const headRequest = assertHeadSingletonRequestRecordForBoundary(headRecord);
  const contract = getResourceHintHeadBoundaryContract(insertion.contractId);
  const boundaryAdmission =
    normalizeResourceHintHeadBoundaryAdmission(boundary);
  const boundaryUpdate = applyFakeDomHeadBoundaryUpdate(
    insertion,
    boundary.fakeDocument,
    boundary.fakeHead
  );
  gateState.headBoundaryConsumed = true;

  const boundarySequence = gateState.nextRequestSequence++;
  const boundaryId = `${gateState.requestIdPrefix}:${boundarySequence}`;

  const payload = freezeRecord({
    schemaVersion: resourceHintHeadBoundaryGateSchemaVersion,
    $$typeof: privateResourceHintHeadBoundaryRecordType,
    kind: 'FastReactDomPrivateResourceHintHeadSingletonBoundaryRecord',
    gateId: privateResourceHintHeadBoundaryGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    boundaryId,
    boundarySequence,
    sourceInsertionId: insertion.insertionId,
    sourceInsertionSequence: insertion.insertionSequence,
    sourceAdapterAdmissionId: insertion.sourceAdapterAdmissionId,
    sourceRequestId: insertion.sourceRequestId,
    sourceRequestSequence: insertion.sourceRequestSequence,
    sourceRequestType: insertion.sourceRequestType,
    sourceHeadRequestId: headRequest.requestId,
    sourceHeadRequestSequence: headRequest.requestSequence,
    sourceHeadRequestType: headRequest.requestType,
    requestType: `resource-hint-head-singleton-boundary.${contract.resourceContractId}`,
    requestName: insertion.requestName,
    contractId: contract.resourceContractId,
    boundaryContractId: contract.id,
    headContractId: headRequest.contractId,
    hostTag: 'head',
    oracleKind: insertion.oracleKind,
    oracleSchemaVersion: insertion.oracleSchemaVersion,
    publicName: insertion.publicName,
    privateDispatcherKey: insertion.privateDispatcherKey,
    boundaryStatus: privateResourceHintHeadBoundaryStatus,
    executionStatus: privateResourceHintHeadBoundaryExecutionStatus,
    compatibilityStatus:
      privateResourceHintHeadBoundaryCompatibilityBlockedStatus,
    dispatcherShape: insertion.dispatcherShape,
    insertionAdmission: insertion.insertionAdmission,
    boundaryAdmission,
    sourceInsertion: createResourceHintHeadBoundarySourceInsertion(insertion),
    sourceHeadRequest:
      createResourceHintHeadBoundarySourceHeadRequest(headRequest),
    resourceElementPlan: createResourceHintHeadBoundaryResourceElementPlan(
      contract,
      boundaryUpdate
    ),
    publicResourceBoundary: createPublicResourceHintDomInsertionBoundary(),
    publicHeadBoundary: createPublicHeadSingletonBoundary(),
    sideEffects: resourceHintHeadBoundarySideEffects,
    missingPrerequisites: resourceHintHeadBoundaryMissingPrerequisites
  });

  resourceHintHeadBoundaryPayloads.set(payload, payload);
  return payload;
}

function recordResourceHintHeadClearRetainWithGate(
  gateState,
  headBoundaryRecord,
  diagnostic
) {
  if (gateState.headClearRetainConsumed === true) {
    throwInvalidResourceHintHeadClearRetainAdmission(
      'head clear/retain gate admits exactly one diagnostic record'
    );
  }

  const headBoundary =
    assertHeadBoundaryRecordForClearRetain(headBoundaryRecord);
  const diagnosticAdmission =
    normalizeResourceHintHeadClearRetainAdmission(diagnostic);
  const clearRetainPlan = createFakeHeadClearRetainPlan(
    headBoundary,
    diagnostic.fakeDocument,
    diagnostic.fakeHead
  );
  gateState.headClearRetainConsumed = true;

  const clearRetainSequence = gateState.nextRequestSequence++;
  const clearRetainId = `${gateState.requestIdPrefix}:${clearRetainSequence}`;

  const payload = freezeRecord({
    schemaVersion: resourceHintHeadClearRetainGateSchemaVersion,
    $$typeof: privateResourceHintHeadClearRetainRecordType,
    kind: 'FastReactDomPrivateResourceHintHeadClearRetainRecord',
    gateId: privateResourceHintHeadClearRetainGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    clearRetainId,
    clearRetainSequence,
    sourceBoundaryId: headBoundary.boundaryId,
    sourceBoundarySequence: headBoundary.boundarySequence,
    sourceInsertionId: headBoundary.sourceInsertionId,
    sourceInsertionSequence: headBoundary.sourceInsertionSequence,
    sourceAdapterAdmissionId: headBoundary.sourceAdapterAdmissionId,
    sourceRequestId: headBoundary.sourceRequestId,
    sourceRequestSequence: headBoundary.sourceRequestSequence,
    sourceRequestType: headBoundary.sourceRequestType,
    sourceHeadRequestId: headBoundary.sourceHeadRequestId,
    sourceHeadRequestSequence: headBoundary.sourceHeadRequestSequence,
    sourceHeadRequestType: headBoundary.sourceHeadRequestType,
    requestType: `resource-hint-head-clear-retain.${headBoundary.contractId}`,
    requestName: headBoundary.requestName,
    contractId: headBoundary.contractId,
    boundaryContractId: headBoundary.boundaryContractId,
    headContractId: headBoundary.headContractId,
    hostTag: 'head',
    oracleKind: headBoundary.oracleKind,
    oracleSchemaVersion: headBoundary.oracleSchemaVersion,
    publicName: headBoundary.publicName,
    privateDispatcherKey: headBoundary.privateDispatcherKey,
    clearRetainStatus: privateResourceHintHeadClearRetainStatus,
    executionStatus: privateResourceHintHeadClearRetainExecutionStatus,
    compatibilityStatus:
      privateResourceHintHeadClearRetainCompatibilityBlockedStatus,
    clearRetainAdmission: diagnosticAdmission,
    sourceHeadBoundary:
      createResourceHintHeadClearRetainSourceBoundary(headBoundary),
    singletonRows: clearRetainPlan.singletonRows,
    resourceHintRows: clearRetainPlan.resourceHintRows,
    headChildRows: clearRetainPlan.headChildRows,
    fakeHeadPlan: clearRetainPlan.fakeHeadPlan,
    stylesheetPrecedenceBoundary:
      clearRetainPlan.stylesheetPrecedenceBoundary,
    publicResourceBoundary: createPublicResourceHintDomInsertionBoundary(),
    publicHeadBoundary: createPublicHeadSingletonBoundary(),
    blockedCapabilities: resourceHintHeadClearRetainBlockedCapabilities,
    sideEffects: resourceHintHeadClearRetainSideEffects,
    missingPrerequisites: resourceHintHeadClearRetainMissingPrerequisites
  });

  resourceHintHeadClearRetainPayloads.set(payload, payload);
  return payload;
}

function recordResourceHintPreloadPreinitOrderWithGate(
  gateState,
  records,
  diagnostic
) {
  if (gateState.preloadPreinitOrderConsumed === true) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'preload/preinit order gate admits exactly one diagnostic record'
    );
  }

  const adapterAdmissions =
    assertFakeDomAdapterAdmissionRecordsForPreloadPreinitOrder(records);
  const diagnosticAdmission =
    normalizeResourceHintPreloadPreinitOrderAdmission(
      diagnostic,
      adapterAdmissions
    );
  const orderPlan = createResourceHintPreloadPreinitOrderPlan(
    adapterAdmissions,
    diagnosticAdmission,
    diagnostic.fakeDocument,
    diagnostic.fakeHead
  );
  gateState.preloadPreinitOrderConsumed = true;

  const orderDiagnosticSequence = gateState.nextRequestSequence++;
  const orderDiagnosticId =
    `${gateState.requestIdPrefix}:${orderDiagnosticSequence}`;

  const payload = freezeRecord({
    schemaVersion: resourceHintPreloadPreinitOrderGateSchemaVersion,
    $$typeof: privateResourceHintPreloadPreinitOrderRecordType,
    kind: 'FastReactDomPrivateResourceHintPreloadPreinitOrderRecord',
    gateId: privateResourceHintPreloadPreinitOrderGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    orderDiagnosticId,
    orderDiagnosticSequence,
    requestType: 'resource-hint-preload-preinit-dedupe-order',
    oracleKind: resourceHintOracleKind,
    oracleSchemaVersion: 1,
    sourceAdapterAdmissionIds: freezeArray(
      adapterAdmissions.map((admission) => admission.adapterAdmissionId)
    ),
    sourceRequestIds: freezeArray(
      adapterAdmissions.map((admission) => admission.sourceRequestId)
    ),
    acceptedContractIds: freezeArray(
      adapterAdmissions.map((admission) => admission.contractId)
    ),
    orderStatus: privateResourceHintPreloadPreinitOrderStatus,
    executionStatus: privateResourceHintPreloadPreinitOrderExecutionStatus,
    compatibilityStatus:
      privateResourceHintPreloadPreinitOrderCompatibilityBlockedStatus,
    orderAdmission: diagnosticAdmission.admission,
    dedupeRows: orderPlan.dedupeRows,
    precedenceRows: orderPlan.precedenceRows,
    scriptModulePreinitRows: orderPlan.scriptModulePreinitRows,
    plannedHeadInsertionOrder: orderPlan.plannedHeadInsertionOrder,
    observedHeadOrder: orderPlan.observedHeadOrder,
    scriptModuleHeadOrder: orderPlan.scriptModuleHeadOrder,
    resourceMapPlan: orderPlan.resourceMapPlan,
    stylesheetPrecedenceBoundary:
      orderPlan.stylesheetPrecedenceBoundary,
    publicScriptModuleDispatchBoundary:
      orderPlan.publicScriptModuleDispatchBoundary,
    publicResourceBoundary: createPublicResourceHintDomInsertionBoundary(),
    publicHeadBoundary: createPublicHeadSingletonBoundary(),
    blockedCapabilities: resourceHintPreloadPreinitOrderBlockedCapabilities,
    sideEffects: resourceHintPreloadPreinitOrderSideEffects,
    missingPrerequisites:
      resourceHintPreloadPreinitOrderMissingPrerequisites
  });

  resourceHintPreloadPreinitOrderPayloads.set(payload, payload);
  return payload;
}

function recordResourceHintStylesheetPrecedenceWithGate(
  gateState,
  orderRecord,
  headRecord,
  diagnostic
) {
  if (gateState.stylesheetPrecedenceConsumed === true) {
    throwInvalidResourceHintStylesheetPrecedenceAdmission(
      'stylesheet precedence gate admits exactly one diagnostic record'
    );
  }

  const order =
    assertPreloadPreinitOrderRecordForStylesheetPrecedence(orderRecord);
  const headRequest =
    assertHeadSingletonRequestRecordForStylesheetPrecedence(headRecord);
  const precedenceAdmission =
    normalizeResourceHintStylesheetPrecedenceAdmission(diagnostic);
  const precedencePlan = createResourceHintStylesheetPrecedencePlan(
    order,
    headRequest,
    diagnostic.fakeDocument,
    diagnostic.fakeHead
  );
  gateState.stylesheetPrecedenceConsumed = true;

  const stylesheetPrecedenceSequence = gateState.nextRequestSequence++;
  const stylesheetPrecedenceId =
    `${gateState.requestIdPrefix}:${stylesheetPrecedenceSequence}`;

  const payload = freezeRecord({
    schemaVersion: resourceHintStylesheetPrecedenceGateSchemaVersion,
    $$typeof: privateResourceHintStylesheetPrecedenceRecordType,
    kind: 'FastReactDomPrivateResourceHintStylesheetPrecedenceRecord',
    gateId: privateResourceHintStylesheetPrecedenceGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    stylesheetPrecedenceId,
    stylesheetPrecedenceSequence,
    sourceOrderDiagnosticId: order.orderDiagnosticId,
    sourceOrderDiagnosticSequence: order.orderDiagnosticSequence,
    sourceHeadRequestId: headRequest.requestId,
    sourceHeadRequestSequence: headRequest.requestSequence,
    sourceHeadRequestType: headRequest.requestType,
    requestType: 'resource-hint-stylesheet-precedence-order',
    hostTag: 'head',
    oracleKind: resourceHintOracleKind,
    oracleSchemaVersion: 1,
    acceptedContractIds: freezeArray(
      precedencePlan.stylesheetDedupeRows.map((row) => row.contractId)
    ),
    stylesheetPrecedenceStatus:
      privateResourceHintStylesheetPrecedenceStatus,
    executionStatus:
      privateResourceHintStylesheetPrecedenceExecutionStatus,
    compatibilityStatus:
      privateResourceHintStylesheetPrecedenceCompatibilityBlockedStatus,
    precedenceAdmission,
    sourceOrderDiagnostic:
      createResourceHintStylesheetPrecedenceSourceOrder(order),
    sourceHeadRequest:
      createResourceHintStylesheetPrecedenceSourceHeadRequest(headRequest),
    stylesheetDedupeRows: precedencePlan.stylesheetDedupeRows,
    precedenceRows: precedencePlan.precedenceRows,
    plannedStylesheetOrder: precedencePlan.plannedStylesheetOrder,
    observedStylesheetOrder: precedencePlan.observedStylesheetOrder,
    headSingletonOrderBoundary:
      precedencePlan.headSingletonOrderBoundary,
    headSingletonOrderRows: precedencePlan.headSingletonOrderRows,
    stylesheetResourceMapPlan:
      precedencePlan.stylesheetResourceMapPlan,
    stylesheetPrecedenceBoundary:
      precedencePlan.stylesheetPrecedenceBoundary,
    publicResourceBoundary: createPublicResourceHintDomInsertionBoundary(),
    publicHeadBoundary: createPublicHeadSingletonBoundary(),
    blockedCapabilities: resourceHintStylesheetPrecedenceBlockedCapabilities,
    sideEffects: resourceHintStylesheetPrecedenceSideEffects,
    missingPrerequisites:
      resourceHintStylesheetPrecedenceMissingPrerequisites
  });

  resourceHintStylesheetPrecedencePayloads.set(payload, payload);
  return payload;
}

function recordResourceHintResourceMapCommitWithGate(
  gateState,
  orderRecord,
  stylesheetPrecedenceRecord,
  diagnostic,
  stylesheetLoadErrorStateRecord
) {
  if (gateState.resourceMapCommitConsumed === true) {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'resource-map commit gate admits exactly one diagnostic record'
    );
  }

  const order =
    assertPreloadPreinitOrderRecordForResourceMapCommit(orderRecord);
  const stylesheetPrecedence =
    assertStylesheetPrecedenceRecordForResourceMapCommit(
      stylesheetPrecedenceRecord,
      order
    );
  const stylesheetLoadErrorState =
    stylesheetLoadErrorStateRecord == null
      ? null
      : assertStylesheetLoadErrorStateRecordForResourceMapCommit(
          stylesheetLoadErrorStateRecord,
          stylesheetPrecedence
        );
  const commitAdmission =
    normalizeResourceHintResourceMapCommitAdmission(diagnostic);
  const commitPlan = createResourceHintResourceMapCommitPlan(
    order,
    stylesheetPrecedence,
    stylesheetLoadErrorState
  );
  gateState.resourceMapCommitConsumed = true;

  const resourceMapCommitSequence = gateState.nextRequestSequence++;
  const resourceMapCommitId =
    `${gateState.requestIdPrefix}:${resourceMapCommitSequence}`;

  const payload = freezeRecord({
    schemaVersion: resourceHintResourceMapCommitGateSchemaVersion,
    $$typeof: privateResourceHintResourceMapCommitRecordType,
    kind: 'FastReactDomPrivateResourceHintResourceMapCommitRecord',
    gateId: privateResourceHintResourceMapCommitGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    resourceMapCommitId,
    resourceMapCommitSequence,
    sourceOrderDiagnosticId: order.orderDiagnosticId,
    sourceOrderDiagnosticSequence: order.orderDiagnosticSequence,
    sourceStylesheetPrecedenceId:
      stylesheetPrecedence.stylesheetPrecedenceId,
    sourceStylesheetPrecedenceSequence:
      stylesheetPrecedence.stylesheetPrecedenceSequence,
    sourceStylesheetLoadErrorStateId:
      stylesheetLoadErrorState === null
        ? null
        : stylesheetLoadErrorState.stylesheetLoadErrorStateId,
    sourceStylesheetLoadErrorStateSequence:
      stylesheetLoadErrorState === null
        ? null
        : stylesheetLoadErrorState.stylesheetLoadErrorStateSequence,
    requestType: 'resource-hint-resource-map-commit',
    hostTag: 'head',
    oracleKind: resourceHintOracleKind,
    oracleSchemaVersion: 1,
    acceptedContractIds: commitPlan.acceptedContractIds,
    resourceMapCommitStatus: privateResourceHintResourceMapCommitStatus,
    executionStatus: privateResourceHintResourceMapCommitExecutionStatus,
    compatibilityStatus:
      privateResourceHintResourceMapCommitCompatibilityBlockedStatus,
    commitAdmission,
    sourceOrderDiagnostic:
      createResourceHintResourceMapCommitSourceOrder(order),
    sourceStylesheetPrecedence:
      createResourceHintResourceMapCommitSourceStylesheetPrecedence(
        stylesheetPrecedence
      ),
    resourceMapCommitPlan: commitPlan.resourceMapCommitPlan,
    privateResourceMapRecords: commitPlan.privateResourceMapRecords,
    stylesheetResourceMapRecords: commitPlan.stylesheetResourceMapRecords,
    preloadResourceMapRecords: commitPlan.preloadResourceMapRecords,
    scriptResourceMapRecords: commitPlan.scriptResourceMapRecords,
    moduleResourceMapOrder: commitPlan.moduleResourceMapOrder,
    scriptModuleFakeDomCommitExecution:
      commitPlan.scriptModuleFakeDomCommitExecution,
    stylesheetLoadStateCommitOrder:
      commitPlan.stylesheetLoadStateCommitOrder,
    resourceMapConflictBoundary: commitPlan.resourceMapConflictBoundary,
    stylesheetPrecedenceBoundary:
      commitPlan.stylesheetPrecedenceBoundary,
    resourceLifecycleBoundary:
      createResourceMapCommitLifecycleBoundary(commitPlan),
    publicResourceBoundary: createPublicResourceHintDomInsertionBoundary(),
    publicHeadBoundary: createPublicHeadSingletonBoundary(),
    blockedCapabilities: resourceHintResourceMapCommitBlockedCapabilities,
    sideEffects: createResourceHintResourceMapCommitSideEffects(
      commitPlan.stylesheetLoadStateCommitOrder
    ),
    missingPrerequisites:
      resourceHintResourceMapCommitMissingPrerequisites
  });

  resourceHintResourceMapCommitPayloads.set(payload, payload);
  return payload;
}

function createResourceHintResourceMapCommitSideEffects(
  stylesheetLoadStateCommitOrder
) {
  const transitionRecorded =
    stylesheetLoadStateCommitOrder.commitTransitionRecorded === true;

  return freezeRecord({
    ...resourceHintResourceMapCommitSideEffects,
    stylesheetLoadErrorStateRecordConsumed:
      stylesheetLoadStateCommitOrder.loadStateConsumed === true,
    stylesheetLoadStateCommitOrderRowsRecorded:
      stylesheetLoadStateCommitOrder.rowCount > 0,
    stylesheetLoadStateResourceMapRowsValidated:
      stylesheetLoadStateCommitOrder.resourceMapEntriesValidated === true,
    stylesheetLoadStateCommitTransitionRecorded: transitionRecorded,
    fakeStylesheetResourceCommitTransitionRecorded: transitionRecorded
  });
}


function recordResourceHintStylesheetLoadErrorStateWithGate(
  gateState,
  stylesheetPrecedenceRecord,
  diagnostic
) {
  if (gateState.stylesheetLoadErrorStateConsumed === true) {
    throwInvalidResourceHintStylesheetLoadErrorStateAdmission(
      'stylesheet load/error state gate admits exactly one diagnostic record'
    );
  }

  const stylesheetPrecedence =
    assertStylesheetPrecedenceRecordForLoadErrorState(
      stylesheetPrecedenceRecord
    );
  const stateAdmission =
    normalizeResourceHintStylesheetLoadErrorStateAdmission(diagnostic);
  const statePlan =
    createResourceHintStylesheetLoadErrorStatePlan(stylesheetPrecedence);
  gateState.stylesheetLoadErrorStateConsumed = true;

  const stylesheetLoadErrorStateSequence = gateState.nextRequestSequence++;
  const stylesheetLoadErrorStateId =
    `${gateState.requestIdPrefix}:${stylesheetLoadErrorStateSequence}`;

  const payload = freezeRecord({
    schemaVersion: resourceHintStylesheetLoadErrorStateGateSchemaVersion,
    $$typeof: privateResourceHintStylesheetLoadErrorStateRecordType,
    kind: 'FastReactDomPrivateResourceHintStylesheetLoadErrorStateRecord',
    gateId: privateResourceHintStylesheetLoadErrorStateGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    stylesheetLoadErrorStateId,
    stylesheetLoadErrorStateSequence,
    sourceStylesheetPrecedenceId:
      stylesheetPrecedence.stylesheetPrecedenceId,
    sourceStylesheetPrecedenceSequence:
      stylesheetPrecedence.stylesheetPrecedenceSequence,
    sourceOrderDiagnosticId:
      stylesheetPrecedence.sourceOrderDiagnosticId,
    sourceHeadRequestId: stylesheetPrecedence.sourceHeadRequestId,
    requestType: 'resource-hint-stylesheet-load-error-state',
    hostTag: 'head',
    oracleKind: resourceHintOracleKind,
    oracleSchemaVersion: 1,
    stylesheetLoadErrorStateStatus:
      privateResourceHintStylesheetLoadErrorStateStatus,
    executionStatus:
      privateResourceHintStylesheetLoadErrorStateExecutionStatus,
    compatibilityStatus:
      privateResourceHintStylesheetLoadErrorStateCompatibilityBlockedStatus,
    stateAdmission,
    sourceStylesheetPrecedence:
      createResourceHintStylesheetLoadErrorStateSourcePrecedence(
        stylesheetPrecedence
      ),
    loadingStateBits: statePlan.loadingStateBits,
    resourceStateRows: statePlan.resourceStateRows,
    loadingStateRows: statePlan.loadingStateRows,
    preloadStateRows: statePlan.preloadStateRows,
    commitSuspensionRows: statePlan.commitSuspensionRows,
    suspendedCommitBoundary: statePlan.suspendedCommitBoundary,
    publicResourceBoundary: createPublicResourceHintDomInsertionBoundary(),
    publicHeadBoundary: createPublicHeadSingletonBoundary(),
    blockedCapabilities:
      resourceHintStylesheetLoadErrorStateBlockedCapabilities,
    sideEffects: resourceHintStylesheetLoadErrorStateSideEffects,
    missingPrerequisites:
      resourceHintStylesheetLoadErrorStateMissingPrerequisites
  });

  resourceHintStylesheetLoadErrorStatePayloads.set(payload, payload);
  return payload;
}


function recordControlledInputValueTrackerScenarioWithGate(gateState, scenario) {
  const normalized = normalizeControlledInputValueTrackerScenario(scenario);
  const contract = getControlledInputValueTrackerContract(
    normalized.hostTag,
    normalized.controlKind
  );
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;

  const payload = freezeRecord({
    schemaVersion: controlledInputValueTrackerGateSchemaVersion,
    $$typeof: privateControlledInputValueTrackerGateRecordType,
    kind: 'FastReactDomPrivateControlledInputValueTrackerGateRecord',
    gateId: controlledInputValueTrackerGateId,
    compatibilityTarget,
    status: unsupportedStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    scenarioId: normalized.scenarioId,
    phaseId: normalized.phaseId,
    hostTag: normalized.hostTag,
    inputType: normalized.inputType,
    multiple: normalized.multiple,
    controlKind: normalized.controlKind,
    contractId: contract.id,
    oracleKind: controlledInputOracleKind,
    oracleSchemaVersion: 1,
    trackerMetadata: createControlledInputValueTrackerMetadata(
      contract,
      normalized
    ),
    postEventRestoreBoundary: createPostEventRestoreBoundary(),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects: controlledInputValueTrackerSideEffects,
    missingPrerequisites: controlledInputValueTrackerMissingPrerequisites
  });

  controlledInputValueTrackerRecordPayloads.set(payload, payload);
  return payload;
}

function installControlledInputValueTrackerFakeDomDiagnosticWithGate(
  gateState,
  scenario,
  admission
) {
  const normalized = normalizeControlledInputValueTrackerScenario(scenario);
  const contract = getControlledInputValueTrackerContract(
    normalized.hostTag,
    normalized.controlKind
  );
  const normalizedAdmission =
    normalizeControlledInputValueTrackerFakeDomAdmission(admission);
  const fakeTarget = normalizedAdmission.fakeTarget;
  const activeState =
    controlledInputValueTrackerFakeDomStateByTarget.get(fakeTarget);
  if (activeState !== undefined && activeState.attached === true) {
    throwInvalidControlledInputValueTrackerFakeDomAdmission(
      'fakeTarget already has an active private fake DOM tracker record'
    );
  }

  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const currentValueSnapshot =
    readControlledInputValueTrackerFakeDomSnapshot(fakeTarget, contract);
  const state = {
    attached: true,
    contract,
    currentValueSnapshot,
    fakeTarget,
    installValueSnapshot: currentValueSnapshot,
    lifecycleId: requestId,
    lifecycleSequence: requestSequence,
    normalized,
    observedCount: 0
  };
  controlledInputValueTrackerFakeDomStateByTarget.set(fakeTarget, state);

  return createControlledInputValueTrackerFakeDomDiagnosticRecord({
    attachedAfter: true,
    attachedBefore: false,
    changed: false,
    normalizedAdmission,
    operation: 'install',
    previousValueSnapshot: null,
    requestId,
    requestSequence,
    state
  });
}

function observeControlledInputValueTrackerFakeDomDiagnosticWithGate(
  gateState,
  record
) {
  const state = assertActiveControlledInputValueTrackerFakeDomDiagnosticRecord(
    record
  );
  const previousValueSnapshot = state.currentValueSnapshot;
  const currentValueSnapshot =
    readControlledInputValueTrackerFakeDomSnapshot(
      state.fakeTarget,
      state.contract
    );
  const changed = !areControlledInputValueSnapshotsEqual(
    previousValueSnapshot,
    currentValueSnapshot
  );

  if (changed) {
    state.currentValueSnapshot = currentValueSnapshot;
  }
  state.observedCount++;

  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  return createControlledInputValueTrackerFakeDomDiagnosticRecord({
    attachedAfter: true,
    attachedBefore: true,
    changed,
    normalizedAdmission: null,
    operation: 'observe',
    previousValueSnapshot,
    requestId,
    requestSequence,
    state
  });
}

function detachControlledInputValueTrackerFakeDomDiagnosticWithGate(
  gateState,
  record
) {
  const state = assertActiveControlledInputValueTrackerFakeDomDiagnosticRecord(
    record
  );
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;

  state.attached = false;
  controlledInputValueTrackerFakeDomStateByTarget.delete(state.fakeTarget);

  return createControlledInputValueTrackerFakeDomDiagnosticRecord({
    attachedAfter: false,
    attachedBefore: true,
    changed: false,
    normalizedAdmission: null,
    operation: 'detach',
    previousValueSnapshot: state.currentValueSnapshot,
    requestId,
    requestSequence,
    state
  });
}

function createControlledInputValueTrackerFakeDomDiagnosticRecord(options) {
  const {
    attachedAfter,
    attachedBefore,
    changed,
    normalizedAdmission,
    operation,
    previousValueSnapshot,
    requestId,
    requestSequence,
    state
  } = options;
  const {contract, normalized} = state;
  const currentValueSnapshot = state.currentValueSnapshot;
  const operationStatus =
    getControlledInputValueTrackerFakeDomDiagnosticOperationStatus(operation);
  const payload = freezeRecord({
    schemaVersion: controlledInputValueTrackerFakeDomDiagnosticGateSchemaVersion,
    $$typeof: privateControlledInputValueTrackerFakeDomDiagnosticRecordType,
    kind: 'FastReactDomPrivateControlledInputValueTrackerFakeDomDiagnosticRecord',
    gateId: controlledInputValueTrackerFakeDomDiagnosticGateId,
    compatibilityTarget,
    status: operationStatus,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    lifecycleId: state.lifecycleId,
    lifecycleSequence: state.lifecycleSequence,
    operation,
    scenarioId: normalized.scenarioId,
    phaseId: normalized.phaseId,
    hostTag: normalized.hostTag,
    inputType: normalized.inputType,
    multiple: normalized.multiple,
    controlKind: normalized.controlKind,
    contractId: contract.id,
    oracleKind: controlledInputOracleKind,
    oracleSchemaVersion: 1,
    admission:
      normalizedAdmission === null
        ? null
        : normalizedAdmission.admissionMetadata,
    trackerMetadata:
      createControlledInputValueTrackerFakeDomDiagnosticMetadata(
        contract,
        normalized,
        currentValueSnapshot,
        attachedAfter
      ),
    trackerRecord: freezeRecord({
      lifecycleId: state.lifecycleId,
      lifecycleSequence: state.lifecycleSequence,
      operation,
      operationStatus,
      operationRequestId: requestId,
      operationRequestSequence: requestSequence,
      fakeDomOnly: true,
      fakeTargetCaptured: false,
      realDomNodeTouched: false,
      propertyDescriptorInstalled: false,
      propertyDescriptorRestored: false,
      attachedBefore,
      attachedAfter,
      detached: attachedAfter === false,
      changed,
      observedCount: state.observedCount,
      initialValueSnapshot: state.installValueSnapshot,
      previousValueSnapshot,
      currentValueSnapshot
    }),
    postEventRestoreBoundary: createPostEventRestoreBoundary(),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects:
      createControlledInputValueTrackerFakeDomDiagnosticSideEffects(operation),
    missingPrerequisites: controlledInputValueTrackerMissingPrerequisites
  });

  controlledInputValueTrackerFakeDomDiagnosticPayloads.set(payload, payload);
  controlledInputValueTrackerFakeDomDiagnosticStates.set(payload, state);
  return payload;
}

function recordControlledInputPrivateRestoreQueueIntentWithGate(
  gateState,
  record,
  admission
) {
  const observation =
    assertControlledInputFakeDomTrackerObservationForRestoreQueue(record);
  const normalizedAdmission =
    normalizeControlledInputPrivateRestoreQueueAdmission(admission);
  const requestSequence = gateState.nextRequestSequence++;
  const requestId = `${gateState.requestIdPrefix}:${requestSequence}`;
  const intentRecorded = observation.trackerRecord.changed === true;
  const status = intentRecorded
    ? controlledInputPrivateRestoreQueueIntentRecordedStatus
    : controlledInputPrivateRestoreQueueIntentSkippedStatus;

  const payload = freezeRecord({
    schemaVersion:
      controlledInputPrivateRestoreQueueDiagnosticGateSchemaVersion,
    $$typeof: privateControlledInputRestoreQueueDiagnosticRecordType,
    kind: 'FastReactDomPrivateControlledInputRestoreQueueDiagnosticRecord',
    gateId: controlledInputPrivateRestoreQueueDiagnosticGateId,
    compatibilityTarget,
    status,
    unsupportedCode: unimplementedCode,
    requestId,
    requestSequence,
    sourceTrackerLifecycleId: observation.lifecycleId,
    sourceTrackerLifecycleSequence: observation.lifecycleSequence,
    sourceTrackerRequestId: observation.requestId,
    sourceTrackerRequestSequence: observation.requestSequence,
    sourceTrackerStatus: observation.status,
    sourceTrackerOperation: observation.operation,
    scenarioId: observation.scenarioId,
    phaseId: observation.phaseId,
    hostTag: observation.hostTag,
    inputType: observation.inputType,
    multiple: observation.multiple,
    controlKind: observation.controlKind,
    contractId: observation.contractId,
    oracleKind: observation.oracleKind,
    oracleSchemaVersion: observation.oracleSchemaVersion,
    admission: normalizedAdmission,
    trackerObservation:
      createControlledInputPrivateRestoreQueueObservationSummary(observation),
    restoreIntent:
      createControlledInputPrivateRestoreQueueIntentSummary(
        observation,
        normalizedAdmission,
        intentRecorded
      ),
    postEventRestoreBoundary:
      createPostEventRestoreQueueDiagnosticBoundary(status, intentRecorded),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects:
      createControlledInputPrivateRestoreQueueDiagnosticSideEffects(
        intentRecorded
      ),
    missingPrerequisites: controlledInputValueTrackerMissingPrerequisites
  });

  controlledInputPrivateRestoreQueueDiagnosticPayloads.set(payload, payload);
  return payload;
}

function getAcceptedContract(behaviorArea, requestName) {
  const key = `${behaviorArea}:${requestName}`;
  const contract = contractByAreaAndName.get(key);
  if (contract !== undefined) {
    return contract;
  }

  const error = new Error(
    `Unknown private React DOM resource/form action internals request: ${key}.`
  );
  error.name = 'FastReactDomResourceFormActionGateError';
  error.code = privateResourceFormActionGateUnknownRequestCode;
  error.behaviorArea = behaviorArea;
  error.requestName = requestName;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getFormActionResetDispatcherContract(intentKind) {
  for (const contract of formActionResetDispatcherContracts) {
    if (contract.intentKind === intentKind) {
      return contract;
    }
  }

  const error = new Error(
    `Unknown private React DOM form action/reset dispatcher intent: ${String(
      intentKind
    )}.`
  );
  error.name = 'FastReactDomFormActionResetDispatcherGateError';
  error.code = privateFormActionResetDispatcherUnknownIntentCode;
  error.intentKind = intentKind;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getControlledInputValueTrackerContract(hostTag, controlKind) {
  const key = `${hostTag}:${controlKind}`;
  const contract = controlledInputValueTrackerContractByKey.get(key);
  if (contract !== undefined) {
    return contract;
  }

  const error = new Error(
    `Unknown private React DOM controlled value-tracker scenario: ${key}.`
  );
  error.name = 'FastReactDomControlledInputValueTrackerGateError';
  error.code = privateControlledInputValueTrackerGateUnknownScenarioCode;
  error.hostTag = hostTag;
  error.controlKind = controlKind;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getControlledInputPrivateWrapperPropertyPayloadContract(
  hostTag,
  propName
) {
  const key = `${hostTag}:${propName}`;
  const contract = controlledInputPrivateWrapperContractByKey.get(key);
  if (contract !== undefined) {
    return contract;
  }

  const error = new Error(
    `Unknown private React DOM controlled wrapper property payload row: ${key}.`
  );
  error.name = 'FastReactDomControlledInputWrapperGateError';
  error.code = privateControlledInputValueTrackerGateUnknownScenarioCode;
  error.hostTag = hostTag;
  error.propName = propName;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getFormActionEventExtractionContract(sourceContractId) {
  for (const contract of formActionEventExtractionContracts) {
    if (contract.sourceContractId === sourceContractId) {
      return contract;
    }
  }

  const error = new Error(
    `Unsupported private React DOM form action event-extraction source contract: ${String(
      sourceContractId
    )}.`
  );
  error.name = 'FastReactDomFormActionEventExtractionGateError';
  error.code = privateFormActionEventExtractionInvalidRecordCode;
  error.sourceContractId = sourceContractId;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateResourceFormActionGateRecord(record) {
  const payload = getPrivateResourceFormActionGateRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource/form action internals gate record.'
  );
  error.name = 'FastReactDomResourceFormActionGateError';
  error.code = 'FAST_REACT_DOM_RESOURCE_FORM_ACTION_GATE_INVALID_RECORD';
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateFormActionResetDispatcherRecord(record) {
  const payload = getPrivateFormActionResetDispatcherRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM form action/reset dispatcher record.'
  );
  error.name = 'FastReactDomFormActionResetDispatcherGateError';
  error.code = privateFormActionResetDispatcherInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateFormActionEventExtractionRecord(record) {
  const payload = getPrivateFormActionEventExtractionRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM form action event-extraction record.'
  );
  error.name = 'FastReactDomFormActionEventExtractionGateError';
  error.code = privateFormActionEventExtractionInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateFormActionResetQueueCommitRecord(record) {
  const payload = getPrivateFormActionResetQueueCommitRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM form reset queue/commit diagnostic record.'
  );
  error.name = 'FastReactDomFormActionResetQueueCommitGateError';
  error.code = privateFormActionResetQueueCommitInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertFormActionSubmissionRecordForEventExtraction(record) {
  const payload = getPrivateFormActionResetDispatcherRecordPayload(record);
  if (payload === null) {
    throwInvalidFormActionEventExtractionRecord(
      'source record must be a private form action submission intent record'
    );
  }

  if (
    payload.intentKind !== 'submission' ||
    payload.status !== privateFormActionSubmissionIntentRecordedStatus ||
    payload.contractId !== 'form-action-submission-intent' ||
    payload.eventName !== 'submit'
  ) {
    throwInvalidFormActionEventExtractionRecord(
      'source record must be a recorded submit action intent',
      payload
    );
  }

  const intent = payload.intent;
  const metadata = intent && intent.actionMetadata;
  if (
    intent == null ||
    metadata == null ||
    metadata.metadataOnly !== true ||
    metadata.eventName !== 'submit'
  ) {
    throwInvalidFormActionEventExtractionRecord(
      'source record must carry worker 492 action metadata',
      payload
    );
  }

  if (
    metadata.submissionTrigger !== 'submit' &&
    metadata.submissionTrigger !== 'requestSubmit'
  ) {
    throwInvalidFormActionEventExtractionRecord(
      'source action metadata must be for submit or requestSubmit',
      payload
    );
  }

  if (
    metadata.requestSubmitWouldDispatchSubmitEvent !==
      (metadata.submissionTrigger === 'requestSubmit')
  ) {
    throwInvalidFormActionEventExtractionRecord(
      'source requestSubmit dispatch metadata is inconsistent',
      payload
    );
  }

  for (const field of [
    'rawFormCaptured',
    'rawEventCaptured',
    'rawSubmitterCaptured',
    'realFormInspected',
    'submitControlInspected',
    'formDataConstructed',
    'syntheticEventCreated',
    'defaultPreventedByGate',
    'actionInvoked',
    'hostTransitionStarted',
    'compatibilityClaimed'
  ]) {
    if (metadata[field] !== false) {
      throwInvalidFormActionEventExtractionRecord(
        `source action metadata ${field} must be false`,
        payload
      );
    }
  }

  for (const field of [
    'formCaptured',
    'rawEventCaptured',
    'rawActionCaptured',
    'realFormInspected',
    'submitControlInspected',
    'formDataConstructed',
    'syntheticEventCreated',
    'defaultPreventedByGate',
    'actionInvoked',
    'hostTransitionStarted',
    'compatibilityClaimed'
  ]) {
    if (intent[field] !== false) {
      throwInvalidFormActionEventExtractionRecord(
        `source intent ${field} must be false`,
        payload
      );
    }
  }

  return payload;
}

function assertFormActionResetIntentRecordForQueueCommit(record) {
  const payload = getPrivateFormActionResetDispatcherRecordPayload(record);
  if (
    payload !== null &&
    payload.intentKind === 'reset' &&
    payload.status === privateFormActionResetIntentRecordedStatus &&
    payload.intent?.resetDispatcherOrdering?.metadataOnly === true &&
    payload.sideEffects?.resetStateQueued === false &&
    payload.sideEffects?.realFormReset === false
  ) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM form reset intent record for queue/commit diagnostics.'
  );
  error.name = 'FastReactDomFormActionResetQueueCommitGateError';
  error.code = privateFormActionResetQueueCommitInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateControlledInputValueTrackerRecord(record) {
  const payload = getPrivateControlledInputValueTrackerRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM controlled input value-tracker gate record.'
  );
  error.name = 'FastReactDomControlledInputValueTrackerGateError';
  error.code = 'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE_INVALID_RECORD';
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateControlledInputValueTrackerFakeDomDiagnosticRecord(record) {
  const payload =
    getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM controlled input fake DOM value-tracker diagnostic record.'
  );
  error.name = 'FastReactDomControlledInputValueTrackerGateError';
  error.code =
    privateControlledInputValueTrackerFakeDomDiagnosticInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateControlledInputRestoreQueueDiagnosticRecord(record) {
  const payload =
    getPrivateControlledInputRestoreQueueDiagnosticRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM controlled input restore queue diagnostic record.'
  );
  error.name = 'FastReactDomControlledInputRestoreQueueDiagnosticGateError';
  error.code = privateControlledInputRestoreQueueDiagnosticInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertControlledInputFakeDomTrackerObservationForRestoreQueue(record) {
  const payload =
    getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload(record);
  if (payload === null) {
    const error = new Error(
      'Expected a private React DOM controlled input fake DOM tracker observation record.'
    );
    error.name = 'FastReactDomControlledInputRestoreQueueDiagnosticGateError';
    error.code = privateControlledInputRestoreQueueDiagnosticInvalidRecordCode;
    error.compatibilityTarget = compatibilityTarget;
    throw error;
  }

  if (
    payload.operation === 'observe' &&
    payload.status === controlledInputValueTrackerFakeDomObservedStatus &&
    payload.trackerRecord.fakeDomOnly === true
  ) {
    return payload;
  }

  const error = new Error(
    'The private controlled input restore queue diagnostic accepts observed fake DOM tracker records only.'
  );
  error.name = 'FastReactDomControlledInputRestoreQueueDiagnosticGateError';
  error.code =
    privateControlledInputRestoreQueueDiagnosticInvalidObservationCode;
  error.compatibilityTarget = compatibilityTarget;
  error.operation = payload.operation;
  error.status = payload.status;
  error.reason = 'source record must be an observed fake DOM tracker record';
  throw error;
}

function assertActiveControlledInputValueTrackerFakeDomDiagnosticRecord(record) {
  assertPrivateControlledInputValueTrackerFakeDomDiagnosticRecord(record);
  const state = controlledInputValueTrackerFakeDomDiagnosticStates.get(record);
  if (state !== undefined && state.attached === true) {
    return state;
  }

  const error = new Error(
    'Expected an active private React DOM controlled input fake DOM value-tracker diagnostic record.'
  );
  error.name = 'FastReactDomControlledInputValueTrackerGateError';
  error.code =
    privateControlledInputValueTrackerFakeDomDiagnosticInactiveRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getAcceptedResourceHintDispatcherMetadataContract(requestName) {
  for (const contract of resourceHintDispatcherMetadataContracts) {
    if (
      requestName === contract.id ||
      requestName === contract.privateDispatcherKey ||
      (requestName === contract.publicName && contract.publicName !== 'preinit')
    ) {
      return contract;
    }
  }

  const error = new Error(
    `Unknown private React DOM resource hint dispatcher metadata request: ${String(
      requestName
    )}.`
  );
  error.name = 'FastReactDomResourceHintDispatcherMetadataGateError';
  error.code = privateResourceHintDispatcherMetadataUnknownRequestCode;
  error.requestName = requestName;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getResourceHintFakeDomAdapterContract(contractId) {
  for (const contract of resourceHintFakeDomAdapterContracts) {
    if (contract.id === contractId) {
      return contract;
    }
  }

  const error = new Error(
    `Unsupported private React DOM resource hint fake DOM adapter contract: ${String(
      contractId
    )}.`
  );
  error.name = 'FastReactDomResourceHintFakeDomAdapterGateError';
  error.code = privateResourceHintFakeDomAdapterInvalidRecordCode;
  error.contractId = contractId;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getResourceHintFakeDomInsertionContract(contractId) {
  for (const contract of resourceHintFakeDomInsertionContracts) {
    if (contract.id === contractId) {
      return contract;
    }
  }

  const error = new Error(
    `Unsupported private React DOM resource hint fake DOM insertion contract: ${String(
      contractId
    )}.`
  );
  error.name = 'FastReactDomResourceHintFakeDomInsertionGateError';
  error.code = privateResourceHintFakeDomInsertionInvalidRecordCode;
  error.contractId = contractId;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getResourceHintHeadBoundaryContract(contractId) {
  for (const contract of resourceHintHeadBoundaryContracts) {
    if (contract.resourceContractId === contractId) {
      return contract;
    }
  }

  const error = new Error(
    `Unsupported private React DOM resource hint head singleton boundary contract: ${String(
      contractId
    )}.`
  );
  error.name = 'FastReactDomResourceHintHeadBoundaryGateError';
  error.code = privateResourceHintHeadBoundaryInvalidRecordCode;
  error.contractId = contractId;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getResourceHintHeadClearRetainResourceContract(contractId) {
  for (const contract of resourceHintHeadClearRetainContracts) {
    if (
      contract.rowType === 'resource-hint' &&
      contract.sourceContractId === contractId
    ) {
      return contract;
    }
  }

  const error = new Error(
    `Unsupported private React DOM resource hint head clear/retain contract: ${String(
      contractId
    )}.`
  );
  error.name = 'FastReactDomResourceHintHeadClearRetainGateError';
  error.code = privateResourceHintHeadClearRetainInvalidRecordCode;
  error.contractId = contractId;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function getResourceHintPreloadPreinitOrderContract(contractId) {
  for (const contract of resourceHintPreloadPreinitOrderContracts) {
    if (contract.sourceContractId === contractId) {
      return contract;
    }
  }

  const error = new Error(
    `Unsupported private React DOM resource hint preload/preinit order contract: ${String(
      contractId
    )}.`
  );
  error.name = 'FastReactDomResourceHintPreloadPreinitOrderGateError';
  error.code = privateResourceHintPreloadPreinitOrderInvalidRecordCode;
  error.contractId = contractId;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateResourceHintDispatcherMetadataRecord(record) {
  const payload =
    getPrivateResourceHintDispatcherMetadataRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint dispatcher metadata record.'
  );
  error.name = 'FastReactDomResourceHintDispatcherMetadataGateError';
  error.code = 'FAST_REACT_DOM_RESOURCE_HINT_DISPATCHER_METADATA_INVALID_RECORD';
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateResourceHintFakeDomAdapterAdmissionRecord(record) {
  const payload =
    getPrivateResourceHintFakeDomAdapterAdmissionRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint fake DOM adapter admission record.'
  );
  error.name = 'FastReactDomResourceHintFakeDomAdapterGateError';
  error.code = privateResourceHintFakeDomAdapterInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateResourceHintFakeDomInsertionRecord(record) {
  const payload =
    getPrivateResourceHintFakeDomInsertionRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint fake DOM insertion record.'
  );
  error.name = 'FastReactDomResourceHintFakeDomInsertionGateError';
  error.code = privateResourceHintFakeDomInsertionInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateResourceHintHeadBoundaryRecord(record) {
  const payload = getPrivateResourceHintHeadBoundaryRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint head singleton boundary record.'
  );
  error.name = 'FastReactDomResourceHintHeadBoundaryGateError';
  error.code = privateResourceHintHeadBoundaryInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateResourceHintHeadClearRetainRecord(record) {
  const payload = getPrivateResourceHintHeadClearRetainRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint head clear/retain record.'
  );
  error.name = 'FastReactDomResourceHintHeadClearRetainGateError';
  error.code = privateResourceHintHeadClearRetainInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateResourceHintPreloadPreinitOrderRecord(record) {
  const payload =
    getPrivateResourceHintPreloadPreinitOrderRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint preload/preinit order record.'
  );
  error.name = 'FastReactDomResourceHintPreloadPreinitOrderGateError';
  error.code = privateResourceHintPreloadPreinitOrderInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateResourceHintStylesheetPrecedenceRecord(record) {
  const payload =
    getPrivateResourceHintStylesheetPrecedenceRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint stylesheet precedence record.'
  );
  error.name = 'FastReactDomResourceHintStylesheetPrecedenceGateError';
  error.code = privateResourceHintStylesheetPrecedenceInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPrivateResourceHintResourceMapCommitRecord(record) {
  const payload =
    getPrivateResourceHintResourceMapCommitRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint resource-map commit record.'
  );
  error.name = 'FastReactDomResourceHintResourceMapCommitGateError';
  error.code = privateResourceHintResourceMapCommitInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}


function assertPrivateResourceHintStylesheetLoadErrorStateRecord(record) {
  const payload =
    getPrivateResourceHintStylesheetLoadErrorStateRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint stylesheet load/error state record.'
  );
  error.name = 'FastReactDomResourceHintStylesheetLoadErrorStateGateError';
  error.code = privateResourceHintStylesheetLoadErrorStateInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}


function assertResourceHintDispatcherMetadataRecordForFakeDomAdapter(record) {
  const payload =
    getPrivateResourceHintDispatcherMetadataRecordPayload(record);
  if (payload !== null) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint dispatcher metadata record for fake DOM adapter admission.'
  );
  error.name = 'FastReactDomResourceHintFakeDomAdapterGateError';
  error.code = privateResourceHintFakeDomAdapterInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertFakeDomAdapterAdmissionRecordForInsertion(record) {
  const payload =
    getPrivateResourceHintFakeDomAdapterAdmissionRecordPayload(record);
  if (
    payload !== null &&
    payload.admissionStatus ===
      privateResourceHintFakeDomAdapterAdmissionStatus &&
    payload.executionStatus ===
      privateResourceHintFakeDomAdapterExecutionBlockedStatus &&
    payload.compatibilityStatus ===
      privateResourceHintFakeDomAdapterCompatibilityBlockedStatus
  ) {
    return payload;
  }

  const error = new Error(
    'Expected an admitted private React DOM resource hint fake DOM adapter record for fake DOM insertion.'
  );
  error.name = 'FastReactDomResourceHintFakeDomInsertionGateError';
  error.code = privateResourceHintFakeDomInsertionInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertFakeDomInsertionRecordForHeadBoundary(record) {
  const payload = getPrivateResourceHintFakeDomInsertionRecordPayload(record);
  if (
    payload !== null &&
    payload.insertionStatus === privateResourceHintFakeDomInsertionStatus &&
    payload.executionStatus ===
      privateResourceHintFakeDomInsertionExecutionStatus &&
    payload.compatibilityStatus ===
      privateResourceHintFakeDomInsertionCompatibilityBlockedStatus &&
    payload.resourceElementPlan?.elementInserted === true &&
    payload.publicResourceBoundary?.publicResourceHintCallsReachable === false
  ) {
    return payload;
  }

  const error = new Error(
    'Expected an executed private React DOM resource hint fake DOM insertion record for the head boundary diagnostic.'
  );
  error.name = 'FastReactDomResourceHintHeadBoundaryGateError';
  error.code = privateResourceHintHeadBoundaryInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertHeadSingletonRequestRecordForBoundary(record) {
  const payload = getPrivateResourceFormActionGateRecordPayload(record);
  if (
    payload !== null &&
    payload.behaviorArea === 'host-singleton' &&
    payload.contractId === 'head-singleton' &&
    payload.hostTag === 'head' &&
    payload.status === unsupportedStatus &&
    payload.sideEffects?.singletonsResolved === false &&
    payload.sideEffects?.compatibilityClaimed === false
  ) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM head singleton gate record for the resource hint head boundary diagnostic.'
  );
  error.name = 'FastReactDomResourceHintHeadBoundaryGateError';
  error.code = privateResourceHintHeadBoundaryInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertHeadBoundaryRecordForClearRetain(record) {
  const payload = getPrivateResourceHintHeadBoundaryRecordPayload(record);
  if (
    payload !== null &&
    payload.boundaryStatus === privateResourceHintHeadBoundaryStatus &&
    payload.executionStatus ===
      privateResourceHintHeadBoundaryExecutionStatus &&
    payload.compatibilityStatus ===
      privateResourceHintHeadBoundaryCompatibilityBlockedStatus &&
    payload.hostTag === 'head' &&
    payload.publicHeadBoundary?.publicSingletonBehavior === false &&
    payload.publicResourceBoundary?.publicResourceHintCallsReachable === false
  ) {
    getResourceHintHeadClearRetainResourceContract(payload.contractId);
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM resource hint head boundary record for the head clear/retain diagnostic.'
  );
  error.name = 'FastReactDomResourceHintHeadClearRetainGateError';
  error.code = privateResourceHintHeadClearRetainInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertFakeDomAdapterAdmissionRecordsForPreloadPreinitOrder(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'records must be a non-empty array of fake DOM adapter admissions'
    );
  }

  const seen = new Set();
  return freezeArray(
    records.map((record) => {
      const payload =
        getPrivateResourceHintFakeDomAdapterAdmissionRecordPayload(record);
      if (
        payload !== null &&
        payload.admissionStatus ===
          privateResourceHintFakeDomAdapterAdmissionStatus &&
        payload.executionStatus ===
          privateResourceHintFakeDomAdapterExecutionBlockedStatus &&
        payload.compatibilityStatus ===
          privateResourceHintFakeDomAdapterCompatibilityBlockedStatus
      ) {
        getResourceHintPreloadPreinitOrderContract(payload.contractId);
        if (seen.has(payload.adapterAdmissionId)) {
          throwInvalidResourceHintPreloadPreinitOrderAdmission(
            'adapter admissions must be unique within the diagnostic'
          );
        }
        seen.add(payload.adapterAdmissionId);
        return payload;
      }

      const error = new Error(
        'Expected admitted private React DOM preload/preinit fake DOM adapter records for the order diagnostic.'
      );
      error.name = 'FastReactDomResourceHintPreloadPreinitOrderGateError';
      error.code = privateResourceHintPreloadPreinitOrderInvalidRecordCode;
      error.compatibilityTarget = compatibilityTarget;
      throw error;
    })
  );
}

function assertPreloadPreinitOrderRecordForStylesheetPrecedence(record) {
  const payload =
    getPrivateResourceHintPreloadPreinitOrderRecordPayload(record);
  if (
    payload !== null &&
    payload.orderStatus === privateResourceHintPreloadPreinitOrderStatus &&
    payload.executionStatus ===
      privateResourceHintPreloadPreinitOrderExecutionStatus &&
    payload.compatibilityStatus ===
      privateResourceHintPreloadPreinitOrderCompatibilityBlockedStatus &&
    payload.publicResourceBoundary?.publicResourceHintCallsReachable === false
  ) {
    if (
      !payload.dedupeRows.some((row) => row.resourceKind === 'style')
    ) {
      throwInvalidResourceHintStylesheetPrecedenceAdmission(
        'source order record must include style resource rows'
      );
    }
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM preload/preinit order record for the stylesheet precedence diagnostic.'
  );
  error.name = 'FastReactDomResourceHintStylesheetPrecedenceGateError';
  error.code = privateResourceHintStylesheetPrecedenceInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertHeadSingletonRequestRecordForStylesheetPrecedence(record) {
  const payload = getPrivateResourceFormActionGateRecordPayload(record);
  if (
    payload !== null &&
    payload.behaviorArea === 'host-singleton' &&
    payload.contractId === 'head-singleton' &&
    payload.hostTag === 'head' &&
    payload.status === unsupportedStatus &&
    payload.sideEffects?.singletonsResolved === false &&
    payload.sideEffects?.compatibilityClaimed === false
  ) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM head singleton gate record for the stylesheet precedence diagnostic.'
  );
  error.name = 'FastReactDomResourceHintStylesheetPrecedenceGateError';
  error.code = privateResourceHintStylesheetPrecedenceInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertPreloadPreinitOrderRecordForResourceMapCommit(record) {
  const payload =
    getPrivateResourceHintPreloadPreinitOrderRecordPayload(record);
  if (
    payload !== null &&
    payload.orderStatus === privateResourceHintPreloadPreinitOrderStatus &&
    payload.executionStatus ===
      privateResourceHintPreloadPreinitOrderExecutionStatus &&
    payload.compatibilityStatus ===
      privateResourceHintPreloadPreinitOrderCompatibilityBlockedStatus &&
    payload.publicResourceBoundary?.publicResourceHintCallsReachable === false
  ) {
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM preload/preinit order record for the resource-map commit diagnostic.'
  );
  error.name = 'FastReactDomResourceHintResourceMapCommitGateError';
  error.code = privateResourceHintResourceMapCommitInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertStylesheetPrecedenceRecordForResourceMapCommit(record, order) {
  const payload =
    getPrivateResourceHintStylesheetPrecedenceRecordPayload(record);
  if (
    payload !== null &&
    payload.stylesheetPrecedenceStatus ===
      privateResourceHintStylesheetPrecedenceStatus &&
    payload.executionStatus ===
      privateResourceHintStylesheetPrecedenceExecutionStatus &&
    payload.compatibilityStatus ===
      privateResourceHintStylesheetPrecedenceCompatibilityBlockedStatus &&
    payload.publicResourceBoundary?.publicResourceHintCallsReachable === false
  ) {
    if (payload.sourceOrderDiagnosticId !== order.orderDiagnosticId) {
      throwInvalidResourceHintResourceMapCommitAdmission(
        'stylesheet precedence record must reference the source order record'
      );
    }
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM stylesheet precedence record for the resource-map commit diagnostic.'
  );
  error.name = 'FastReactDomResourceHintResourceMapCommitGateError';
  error.code = privateResourceHintResourceMapCommitInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertStylesheetLoadErrorStateRecordForResourceMapCommit(
  record,
  stylesheetPrecedence
) {
  const payload =
    getPrivateResourceHintStylesheetLoadErrorStateRecordPayload(record);
  if (
    payload !== null &&
    payload.stylesheetLoadErrorStateStatus ===
      privateResourceHintStylesheetLoadErrorStateStatus &&
    payload.executionStatus ===
      privateResourceHintStylesheetLoadErrorStateExecutionStatus &&
    payload.compatibilityStatus ===
      privateResourceHintStylesheetLoadErrorStateCompatibilityBlockedStatus &&
    payload.publicResourceBoundary?.publicResourceHintCallsReachable === false
  ) {
    if (
      payload.sourceStylesheetPrecedenceId !==
      stylesheetPrecedence.stylesheetPrecedenceId
    ) {
      throwInvalidResourceHintResourceMapCommitAdmission(
        'stale resource-map entries: stylesheet load/error state record must reference the source stylesheet precedence record'
      );
    }

    assertNoPublicResourceDispatchFromStylesheetLoadErrorStateRecord(
      payload
    );
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM stylesheet load/error state record for the resource-map commit diagnostic.'
  );
  error.name = 'FastReactDomResourceHintResourceMapCommitGateError';
  error.code = privateResourceHintResourceMapCommitInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertNoPublicResourceDispatchFromStylesheetLoadErrorStateRecord(
  payload
) {
  if (
    payload.sideEffects?.stylesheetFetchStarted !== false ||
    payload.sideEffects?.stylesheetLoadListenerInstalled !== false ||
    payload.sideEffects?.stylesheetErrorListenerInstalled !== false ||
    payload.sideEffects?.stylesheetCommitSuspended !== false ||
    payload.sideEffects?.publicResourceHintDomInsertion !== false ||
    payload.stateAdmission?.publicResourceHintDomInsertion !== false ||
    payload.stateAdmission?.publicStylesheetResourceBehavior !== false ||
    payload.stateAdmission?.compatibilityClaimed !== false
  ) {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'stylesheet load/error state record must remain fake-state metadata without public resource dispatch'
    );
  }
}


function assertStylesheetPrecedenceRecordForLoadErrorState(record) {
  const payload =
    getPrivateResourceHintStylesheetPrecedenceRecordPayload(record);
  if (
    payload !== null &&
    payload.stylesheetPrecedenceStatus ===
      privateResourceHintStylesheetPrecedenceStatus &&
    payload.executionStatus ===
      privateResourceHintStylesheetPrecedenceExecutionStatus &&
    payload.compatibilityStatus ===
      privateResourceHintStylesheetPrecedenceCompatibilityBlockedStatus &&
    payload.publicResourceBoundary?.publicResourceHintCallsReachable === false
  ) {
    if (payload.stylesheetDedupeRows.length === 0) {
      throwInvalidResourceHintStylesheetLoadErrorStateAdmission(
        'source stylesheet precedence record must include stylesheet rows'
      );
    }
    return payload;
  }

  const error = new Error(
    'Expected a private React DOM stylesheet precedence record for the load/error state diagnostic.'
  );
  error.name = 'FastReactDomResourceHintStylesheetLoadErrorStateGateError';
  error.code = privateResourceHintStylesheetLoadErrorStateInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}


function validateResourceHintDispatcherShape(contract, args) {
  if (!Array.isArray(args)) {
    throwInvalidResourceHintDispatcherShape(
      contract,
      'arguments must be provided as an array'
    );
  }

  const optionalOptionsDispatcher =
    contract.privateDispatcherKey === 'm' ||
    contract.privateDispatcherKey === 'M';
  if (
    optionalOptionsDispatcher
      ? args.length < 1 || args.length > contract.argumentNames.length
      : args.length !== contract.argumentNames.length
  ) {
    throwInvalidResourceHintDispatcherShape(
      contract,
      optionalOptionsDispatcher
        ? `expected between 1 and ${contract.argumentNames.length} arguments`
        : `expected ${contract.argumentNames.length} arguments`
    );
  }

  switch (contract.privateDispatcherKey) {
    case 'C':
      return freezeRecord({
        accepted: true,
        normalized: true,
        privateDispatcherKey: contract.privateDispatcherKey,
        argumentNames: contract.argumentNames,
        arguments: freezeArray([
          describeRequiredStringArgument(contract, args[0], 'href'),
          describeCrossOriginArgument(contract, args[1], {
            allowNull: true,
            fieldName: 'crossOrigin',
            fontResource: false
          })
        ])
      });
    case 'L':
      return validatePreloadDispatcherShape(contract, args);
    case 'm':
      return validatePreloadModuleDispatcherShape(contract, args);
    case 'S':
      return validatePreinitStyleDispatcherShape(contract, args);
    case 'X':
      return validatePreinitScriptDispatcherShape(contract, args);
    case 'M':
      return validatePreinitModuleScriptDispatcherShape(contract, args);
    default:
      throwInvalidResourceHintDispatcherShape(
        contract,
        `unsupported dispatcher key ${contract.privateDispatcherKey}`
      );
  }
}

function validatePreloadDispatcherShape(contract, args) {
  const as = args[1];
  const fontResource = as === 'font';

  return freezeRecord({
    accepted: true,
    normalized: true,
    privateDispatcherKey: contract.privateDispatcherKey,
    argumentNames: contract.argumentNames,
    arguments: freezeArray([
      describeRequiredStringArgument(contract, args[0], 'href'),
      describeRequiredStringArgument(contract, as, 'as'),
      describeOptionsObject(contract, args[2], [
        fieldSpec('crossOrigin', (fieldContract, value) =>
          describeCrossOriginArgument(fieldContract, value, {
            allowNull: false,
            fieldName: 'crossOrigin',
            fontResource
          })
        ),
        fieldSpec('integrity', describeOptionalStringField),
        fieldSpec('nonce', describeOptionalStringField),
        fieldSpec('type', describeOptionalStringField),
        fieldSpec('fetchPriority', describeOptionalStringField),
        fieldSpec('referrerPolicy', describeOptionalStringField),
        fieldSpec('imageSrcSet', describeOptionalStringField),
        fieldSpec('imageSizes', describeOptionalStringField),
        fieldSpec('media', describeOptionalStringField)
      ])
    ])
  });
}

function validatePreloadModuleDispatcherShape(contract, args) {
  return freezeRecord({
    accepted: true,
    normalized: true,
    privateDispatcherKey: contract.privateDispatcherKey,
    argumentNames: contract.argumentNames,
    arguments: freezeArray([
      describeRequiredStringArgument(contract, args[0], 'href'),
      describeOptionalOptionsObject(contract, args[1], [
        fieldSpec('as', describeOptionalStringField),
        fieldSpec('crossOrigin', (fieldContract, value) =>
          describeCrossOriginArgument(fieldContract, value, {
            allowNull: false,
            fieldName: 'crossOrigin',
            fontResource: false
          })
        ),
        fieldSpec('integrity', describeOptionalStringField)
      ])
    ])
  });
}

function validatePreinitStyleDispatcherShape(contract, args) {
  return freezeRecord({
    accepted: true,
    normalized: true,
    privateDispatcherKey: contract.privateDispatcherKey,
    argumentNames: contract.argumentNames,
    arguments: freezeArray([
      describeRequiredStringArgument(contract, args[0], 'href'),
      describeOptionalStringField(contract, args[1], 'precedence'),
      describeOptionsObject(contract, args[2], [
        fieldSpec('crossOrigin', (fieldContract, value) =>
          describeCrossOriginArgument(fieldContract, value, {
            allowNull: false,
            fieldName: 'crossOrigin',
            fontResource: false
          })
        ),
        fieldSpec('integrity', describeOptionalStringField),
        fieldSpec('fetchPriority', describeOptionalStringField)
      ])
    ])
  });
}

function validatePreinitScriptDispatcherShape(contract, args) {
  return freezeRecord({
    accepted: true,
    normalized: true,
    privateDispatcherKey: contract.privateDispatcherKey,
    argumentNames: contract.argumentNames,
    arguments: freezeArray([
      describeRequiredStringArgument(contract, args[0], 'href'),
      describeOptionsObject(contract, args[1], [
        fieldSpec('crossOrigin', (fieldContract, value) =>
          describeCrossOriginArgument(fieldContract, value, {
            allowNull: false,
            fieldName: 'crossOrigin',
            fontResource: false
          })
        ),
        fieldSpec('integrity', describeOptionalStringField),
        fieldSpec('fetchPriority', describeOptionalStringField),
        fieldSpec('nonce', describeOptionalStringField)
      ])
    ])
  });
}

function validatePreinitModuleScriptDispatcherShape(contract, args) {
  return freezeRecord({
    accepted: true,
    normalized: true,
    privateDispatcherKey: contract.privateDispatcherKey,
    argumentNames: contract.argumentNames,
    arguments: freezeArray([
      describeRequiredStringArgument(contract, args[0], 'href'),
      describeOptionalOptionsObject(contract, args[1], [
        fieldSpec('crossOrigin', (fieldContract, value) =>
          describeCrossOriginArgument(fieldContract, value, {
            allowNull: false,
            fieldName: 'crossOrigin',
            fontResource: false
          })
        ),
        fieldSpec('integrity', describeOptionalStringField),
        fieldSpec('nonce', describeOptionalStringField)
      ])
    ])
  });
}

function describeRequiredStringArgument(contract, value, name) {
  if (typeof value !== 'string') {
    throwInvalidResourceHintDispatcherShape(
      contract,
      `${name} must be a string`
    );
  }

  return freezeRecord({
    name,
    type: 'string',
    empty: value.length === 0
  });
}

function describeOptionalStringField(contract, value, name) {
  if (value === undefined) {
    return freezeRecord({
      name,
      type: 'undefined'
    });
  }

  return describeRequiredStringArgument(contract, value, name);
}

function describeCrossOriginArgument(contract, value, options) {
  const {allowNull, fieldName, fontResource} = options;

  if (value === null && allowNull) {
    return freezeRecord({
      name: fieldName,
      type: 'null'
    });
  }

  if (value === undefined) {
    if (fontResource) {
      throwInvalidResourceHintDispatcherShape(
        contract,
        `${fieldName} must be normalized to an empty string for font resources`
      );
    }

    return freezeRecord({
      name: fieldName,
      type: 'undefined'
    });
  }

  if (value !== '' && value !== 'use-credentials') {
    throwInvalidResourceHintDispatcherShape(
      contract,
      `${fieldName} must be normalized before reaching the private dispatcher`
    );
  }

  return freezeRecord({
    name: fieldName,
    type: 'string',
    empty: value.length === 0
  });
}

function describeOptionalOptionsObject(contract, value, fieldSpecs) {
  if (value === undefined) {
    return freezeRecord({
      name: 'options',
      type: 'undefined'
    });
  }

  return describeOptionsObject(contract, value, fieldSpecs);
}

function describeOptionsObject(contract, value, fieldSpecs) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throwInvalidResourceHintDispatcherShape(
      contract,
      'options must be a normalized object'
    );
  }

  const expectedNames = fieldSpecs.map((field) => field.name);
  const ownNames = Object.getOwnPropertyNames(value);
  if (
    Object.getOwnPropertySymbols(value).length !== 0 ||
    ownNames.length !== expectedNames.length
  ) {
    throwInvalidResourceHintDispatcherShape(
      contract,
      'options must have exactly the normalized private dispatcher fields'
    );
  }

  for (let index = 0; index < expectedNames.length; index++) {
    if (ownNames[index] !== expectedNames[index]) {
      throwInvalidResourceHintDispatcherShape(
        contract,
        'options fields must use the normalized private dispatcher order'
      );
    }
  }

  return freezeRecord({
    name: 'options',
    type: 'object',
    exactOwnKeys: freezeArray(expectedNames),
    fields: freezeArray(
      fieldSpecs.map((field) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, field.name);
        if (
          descriptor === undefined ||
          !Object.hasOwn(descriptor, 'value')
        ) {
          throwInvalidResourceHintDispatcherShape(
            contract,
            `options.${field.name} must be a data property`
          );
        }

        return field.describe(contract, descriptor.value, field.name);
      })
    )
  });
}

function fieldSpec(name, describe) {
  return freezeRecord({
    name,
    describe
  });
}

function throwInvalidResourceHintDispatcherShape(contract, reason) {
  const error = new Error(
    `Invalid private React DOM resource hint dispatcher metadata shape for ${contract.id}: ${reason}.`
  );
  error.name = 'FastReactDomResourceHintDispatcherMetadataGateError';
  error.code = privateResourceHintDispatcherMetadataInvalidShapeCode;
  error.compatibilityTarget = compatibilityTarget;
  error.contractId = contract.id;
  error.privateDispatcherKey = contract.privateDispatcherKey;
  error.reason = reason;
  throw error;
}

function normalizeResourceHintFakeDomAdapterAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidResourceHintFakeDomAdapterAdmission(
      'adapter admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwInvalidResourceHintFakeDomAdapterAdmission(
      'explicitAdmission must be true'
    );
  }

  const adapterKind = getAdmissionStringProperty(
    admission,
    'adapterKind',
    'deterministic-fake-dom'
  );
  if (adapterKind !== 'deterministic-fake-dom') {
    throwInvalidResourceHintFakeDomAdapterAdmission(
      'adapterKind must be deterministic-fake-dom'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'document-head'
  );
  if (targetKind !== 'document-head') {
    throwInvalidResourceHintFakeDomAdapterAdmission(
      'targetKind must be document-head'
    );
  }

  return freezeRecord({
    adapterKind,
    adapterId: getAdmissionStringProperty(
      admission,
      'adapterId',
      'anonymous-fake-dom-resource-hint-adapter'
    ),
    targetKind,
    explicitAdmission: true,
    deterministicFakeDomOnly: true,
    rawAdapterCaptured: false,
    rawDocumentCaptured: false,
    rawHeadCaptured: false,
    fakeDocumentRead: false,
    fakeHeadRead: false,
    mutationLogRead: false,
    mutationMethodsCalled: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function createResourceHintFakeDomResourceElementPlan(contract) {
  return freezeRecord({
    adapterContractId: contract.id,
    privateDispatcherKey: contract.privateDispatcherKey,
    targetKind: 'document-head',
    elementTag: contract.elementTag,
    relationship: contract.relationship,
    attributeNames: contract.attributeNames,
    normalizedDispatcherRecordRequired: true,
    rawValuesRetained: false,
    elementCreated: false,
    elementInserted: false,
    resourceFetchStarted: false,
    stylesheetPrecedenceApplied: false,
    compatibilityClaimed: false
  });
}

function normalizeResourceHintFakeDomInsertionAdmission(insertion) {
  if (insertion == null || typeof insertion !== 'object') {
    throwInvalidResourceHintFakeDomInsertionAdmission(
      'insertion admission metadata must be an object'
    );
  }

  if (insertion.explicitInsertion !== true) {
    throwInvalidResourceHintFakeDomInsertionAdmission(
      'explicitInsertion must be true'
    );
  }

  const insertionKind = getAdmissionStringProperty(
    insertion,
    'insertionKind',
    'deterministic-fake-dom-head-append'
  );
  if (insertionKind !== 'deterministic-fake-dom-head-append') {
    throwInvalidResourceHintFakeDomInsertionAdmission(
      'insertionKind must be deterministic-fake-dom-head-append'
    );
  }

  const targetKind = getAdmissionStringProperty(
    insertion,
    'targetKind',
    'document-head'
  );
  if (targetKind !== 'document-head') {
    throwInvalidResourceHintFakeDomInsertionAdmission(
      'targetKind must be document-head'
    );
  }

  assertDeterministicFakeResourceTarget(
    insertion.fakeDocument,
    insertion.fakeHead
  );

  return freezeRecord({
    insertionKind,
    insertionId: getAdmissionStringProperty(
      insertion,
      'insertionId',
      'anonymous-fake-dom-resource-hint-insertion'
    ),
    targetKind,
    explicitInsertion: true,
    deterministicFakeDomOnly: true,
    rawDocumentCaptured: false,
    rawHeadCaptured: false,
    rawElementCaptured: false,
    fakeDocumentHeadRead: false,
    insertionMethod: 'appendChild',
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function assertDeterministicFakeResourceTarget(fakeDocument, fakeHead) {
  if (
    fakeDocument == null ||
    typeof fakeDocument !== 'object' ||
    fakeDocument.__fastReactFakeResourceDocument !== true
  ) {
    throwInvalidResourceHintFakeDomInsertionAdmission(
      'fakeDocument must be an explicit deterministic fake resource document'
    );
  }

  if (
    fakeHead == null ||
    typeof fakeHead !== 'object' ||
    fakeHead.__fastReactFakeResourceHead !== true ||
    fakeHead.ownerDocument !== fakeDocument
  ) {
    throwInvalidResourceHintFakeDomInsertionAdmission(
      'fakeHead must belong to the deterministic fake resource document'
    );
  }

  if (
    typeof fakeDocument.createElement !== 'function' ||
    typeof fakeHead.appendChild !== 'function'
  ) {
    throwInvalidResourceHintFakeDomInsertionAdmission(
      'fake DOM target must expose createElement and appendChild'
    );
  }
}

function insertFakeDomResourceHintElement(
  contract,
  adapterAdmission,
  fakeDocument,
  fakeHead
) {
  const element = fakeDocument.createElement(contract.elementTag);
  assertDeterministicFakeResourceElement(element, fakeDocument, contract);

  const attributes = createResourceHintFakeDomInsertionAttributePlan(
    contract,
    adapterAdmission
  );
  for (const attribute of attributes) {
    element.setAttribute(attribute.name, attribute.value);
  }

  fakeHead.appendChild(element);

  return freezeRecord({
    elementTag: contract.elementTag,
    relationship: contract.relationship,
    insertionMethod: 'appendChild',
    attributeNames: freezeArray(
      attributes.map((attribute) => attribute.name)
    ),
    attributeValueKinds: freezeArray(
      attributes.map((attribute) =>
        freezeRecord({
          name: attribute.name,
          valueKind: attribute.valueKind,
          rawValueRetained: false
        })
      )
    )
  });
}

function assertDeterministicFakeResourceElement(
  element,
  fakeDocument,
  contract
) {
  if (
    element == null ||
    typeof element !== 'object' ||
    element.__fastReactFakeResourceElement !== true ||
    element.ownerDocument !== fakeDocument ||
    typeof element.setAttribute !== 'function'
  ) {
    throwInvalidResourceHintFakeDomInsertionAdmission(
      `fake document must create deterministic fake ${contract.elementTag} resource elements`
    );
  }
}

function createResourceHintFakeDomInsertionAttributePlan(
  contract,
  adapterAdmission
) {
  const attributes = [
    insertionAttribute('rel', 'relationship', contract.relationship),
    insertionAttribute(
      contract.elementTag === 'script' ? 'src' : 'href',
      'redacted-dispatcher-string',
      redactedResourceHintValue('href')
    )
  ];

  if (contract.id === 'preconnect') {
    const crossOrigin = getDispatcherArgumentSummary(
      adapterAdmission.dispatcherShape,
      'crossOrigin'
    );
    appendStringAttributeIfPresent(attributes, 'crossOrigin', crossOrigin);
    return freezeArray(attributes);
  }

  const options = getDispatcherArgumentSummary(
    adapterAdmission.dispatcherShape,
    'options'
  );
  const as =
    getDispatcherArgumentSummary(adapterAdmission.dispatcherShape, 'as') ||
    getDispatcherOptionFieldSummary(options, 'as');
  appendStringAttributeIfPresent(attributes, 'as', as);

  for (const name of contract.attributeNames) {
    if (name === 'rel' || name === 'href' || name === 'as') {
      continue;
    }
    appendStringAttributeIfPresent(
      attributes,
      name,
      getDispatcherOptionFieldSummary(options, name)
    );
  }

  return freezeArray(attributes);
}

function appendStringAttributeIfPresent(attributes, name, summary) {
  if (summary == null || summary.type !== 'string') {
    return;
  }

  attributes.push(
    insertionAttribute(
      name,
      summary.empty ? 'normalized-empty-string' : 'redacted-string',
      summary.empty ? '' : redactedResourceHintValue(name)
    )
  );
}

function insertionAttribute(name, valueKind, value) {
  return freezeRecord({
    name,
    valueKind,
    value
  });
}

function redactedResourceHintValue(name) {
  return `[fast-react-redacted-resource-hint:${name}]`;
}

function getDispatcherArgumentSummary(dispatcherShape, name) {
  for (const argument of dispatcherShape.arguments) {
    if (argument.name === name) {
      return argument;
    }
  }
  return null;
}

function getDispatcherOptionFieldSummary(options, name) {
  if (options == null || options.type !== 'object') {
    return null;
  }

  for (const field of options.fields) {
    if (field.name === name) {
      return field;
    }
  }
  return null;
}

function createResourceHintFakeDomInsertedResourceElementPlan(
  contract,
  insertedElement
) {
  return freezeRecord({
    adapterContractId: contract.id,
    privateDispatcherKey: contract.privateDispatcherKey,
    targetKind: 'document-head',
    elementTag: insertedElement.elementTag,
    relationship: insertedElement.relationship,
    insertionMethod: insertedElement.insertionMethod,
    attributeNames: insertedElement.attributeNames,
    attributeValueKinds: insertedElement.attributeValueKinds,
    normalizedDispatcherRecordRequired: true,
    fakeDocumentMarkerRequired: true,
    fakeHeadMarkerRequired: true,
    rawValuesRetained: false,
    elementCreated: true,
    elementInserted: true,
    resourceFetchStarted: false,
    stylesheetPrecedenceApplied: false,
    publicResourceHintDomInsertion: false,
    compatibilityClaimed: false
  });
}

function createPublicResourceHintDomInsertionBoundary() {
  return freezeRecord({
    status: 'blocked-public-resource-hint-dom-insertion',
    publicResourceHintCallsReachable: false,
    publicDispatcherInvoked: false,
    publicRootTouched: false,
    realDocumentMutated: false,
    realHeadMutated: false,
    resourceFetchStarted: false,
    compatibilityClaimed: false
  });
}

function normalizeResourceHintHeadBoundaryAdmission(boundary) {
  if (boundary == null || typeof boundary !== 'object') {
    throwInvalidResourceHintHeadBoundaryAdmission(
      'head boundary admission metadata must be an object'
    );
  }

  if (boundary.explicitBoundary !== true) {
    throwInvalidResourceHintHeadBoundaryAdmission(
      'explicitBoundary must be true'
    );
  }

  const boundaryKind = getAdmissionStringProperty(
    boundary,
    'boundaryKind',
    'deterministic-fake-dom-head-singleton-insertion-update'
  );
  if (
    boundaryKind !==
    'deterministic-fake-dom-head-singleton-insertion-update'
  ) {
    throwInvalidResourceHintHeadBoundaryAdmission(
      'boundaryKind must be deterministic-fake-dom-head-singleton-insertion-update'
    );
  }

  const targetKind = getAdmissionStringProperty(
    boundary,
    'targetKind',
    'document-head'
  );
  if (targetKind !== 'document-head') {
    throwInvalidResourceHintHeadBoundaryAdmission(
      'targetKind must be document-head'
    );
  }

  const hostTag = getAdmissionStringProperty(boundary, 'hostTag', 'head');
  if (hostTag !== 'head') {
    throwInvalidResourceHintHeadBoundaryAdmission('hostTag must be head');
  }

  assertDeterministicFakeHeadBoundaryTarget(
    boundary.fakeDocument,
    boundary.fakeHead
  );

  return freezeRecord({
    boundaryKind,
    boundaryId: getAdmissionStringProperty(
      boundary,
      'boundaryId',
      'anonymous-fake-dom-head-singleton-boundary'
    ),
    targetKind,
    hostTag,
    explicitBoundary: true,
    deterministicFakeDomOnly: true,
    rawDocumentCaptured: false,
    rawHeadCaptured: false,
    rawElementCaptured: false,
    singletonResolutionAllowed: false,
    singletonAcquisitionAllowed: false,
    singletonReleaseAllowed: false,
    publicHeadSingletonBehavior: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function assertDeterministicFakeHeadBoundaryTarget(fakeDocument, fakeHead) {
  if (
    fakeDocument == null ||
    typeof fakeDocument !== 'object' ||
    fakeDocument.__fastReactFakeResourceDocument !== true
  ) {
    throwInvalidResourceHintHeadBoundaryAdmission(
      'fakeDocument must be an explicit deterministic fake resource document'
    );
  }

  if (
    fakeHead == null ||
    typeof fakeHead !== 'object' ||
    fakeHead.__fastReactFakeResourceHead !== true ||
    fakeHead.ownerDocument !== fakeDocument
  ) {
    throwInvalidResourceHintHeadBoundaryAdmission(
      'fakeHead must belong to the deterministic fake resource document'
    );
  }

  if (!Array.isArray(fakeHead.childNodes)) {
    throwInvalidResourceHintHeadBoundaryAdmission(
      'fakeHead must expose deterministic childNodes for inserted resources'
    );
  }
}

function applyFakeDomHeadBoundaryUpdate(insertionRecord, fakeDocument, fakeHead) {
  const element = findInsertedFakeHeadResourceElement(
    insertionRecord,
    fakeDocument,
    fakeHead
  );
  const updateAttribute = insertionAttribute(
    'data-fast-react-head-boundary',
    'diagnostic-constant',
    '[fast-react-head-boundary:resource-hint-insertion-update]'
  );

  element.node.setAttribute(updateAttribute.name, updateAttribute.value);

  return freezeRecord({
    childIndex: element.index,
    childNodeName: element.node.nodeName,
    insertedElementObserved: true,
    updateApplied: true,
    updateAttributeNames: freezeArray([updateAttribute.name]),
    updateAttributeValueKinds: freezeArray([
      freezeRecord({
        name: updateAttribute.name,
        valueKind: updateAttribute.valueKind,
        rawValueRetained: false
      })
    ])
  });
}

function findInsertedFakeHeadResourceElement(
  insertionRecord,
  fakeDocument,
  fakeHead
) {
  const expectedNodeName =
    insertionRecord.resourceElementPlan.elementTag.toUpperCase();
  const expectedRelationship = insertionRecord.resourceElementPlan.relationship;

  for (let index = fakeHead.childNodes.length - 1; index >= 0; index--) {
    const node = fakeHead.childNodes[index];
    if (
      isDeterministicFakeHeadBoundaryResourceElement(
        node,
        fakeDocument,
        fakeHead,
        expectedNodeName,
        expectedRelationship
      )
    ) {
      return {index, node};
    }
  }

  throwInvalidResourceHintHeadBoundaryAdmission(
    'fakeHead must contain the inserted deterministic resource element'
  );
}

function isDeterministicFakeHeadBoundaryResourceElement(
  node,
  fakeDocument,
  fakeHead,
  expectedNodeName,
  expectedRelationship
) {
  if (
    node == null ||
    typeof node !== 'object' ||
    node.__fastReactFakeResourceElement !== true ||
    node.ownerDocument !== fakeDocument ||
    node.parentNode !== fakeHead ||
    node.nodeName !== expectedNodeName ||
    typeof node.setAttribute !== 'function'
  ) {
    return false;
  }

  const attributes = node.attributes;
  return (
    attributes != null &&
    typeof attributes === 'object' &&
    attributes.rel === expectedRelationship
  );
}

function createResourceHintHeadBoundarySourceInsertion(insertion) {
  return freezeRecord({
    insertionId: insertion.insertionId,
    insertionSequence: insertion.insertionSequence,
    insertionStatus: insertion.insertionStatus,
    executionStatus: insertion.executionStatus,
    compatibilityStatus: insertion.compatibilityStatus,
    contractId: insertion.contractId,
    elementTag: insertion.resourceElementPlan.elementTag,
    relationship: insertion.resourceElementPlan.relationship,
    insertionMethod: insertion.resourceElementPlan.insertionMethod,
    elementInserted: insertion.resourceElementPlan.elementInserted,
    publicResourceHintDomInsertion:
      insertion.resourceElementPlan.publicResourceHintDomInsertion,
    compatibilityClaimed: insertion.resourceElementPlan.compatibilityClaimed,
    sideEffects: insertion.sideEffects
  });
}

function createResourceHintHeadBoundarySourceHeadRequest(headRequest) {
  return freezeRecord({
    requestId: headRequest.requestId,
    requestSequence: headRequest.requestSequence,
    requestType: headRequest.requestType,
    behaviorArea: headRequest.behaviorArea,
    contractId: headRequest.contractId,
    hostTag: headRequest.hostTag,
    status: headRequest.status,
    singletonsResolved: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    sideEffects: headRequest.sideEffects
  });
}

function createResourceHintHeadBoundaryResourceElementPlan(
  contract,
  boundaryUpdate
) {
  return freezeRecord({
    boundaryContractId: contract.id,
    adapterContractId: contract.resourceContractId,
    privateDispatcherKey: contract.privateDispatcherKey,
    targetKind: 'document-head',
    hostTag: 'head',
    elementTag: contract.elementTag,
    relationship: contract.relationship,
    insertionMethod: 'appendChild',
    insertedElementObserved: boundaryUpdate.insertedElementObserved,
    childIndex: boundaryUpdate.childIndex,
    childNodeName: boundaryUpdate.childNodeName,
    updateApplied: boundaryUpdate.updateApplied,
    updateAttributeNames: boundaryUpdate.updateAttributeNames,
    updateAttributeValueKinds: boundaryUpdate.updateAttributeValueKinds,
    normalizedDispatcherRecordRequired: true,
    fakeDocumentMarkerRequired: true,
    fakeHeadMarkerRequired: true,
    rawValuesRetained: false,
    singletonResolutionAllowed: false,
    singletonOwnershipClaimed: false,
    resourceFetchStarted: false,
    stylesheetPrecedenceApplied: false,
    publicResourceHintDomInsertion: false,
    publicHeadSingletonBehavior: false,
    compatibilityClaimed: false
  });
}

function createResourceHintHeadClearRetainSourceBoundary(headBoundary) {
  return freezeRecord({
    boundaryId: headBoundary.boundaryId,
    boundarySequence: headBoundary.boundarySequence,
    boundaryStatus: headBoundary.boundaryStatus,
    executionStatus: headBoundary.executionStatus,
    compatibilityStatus: headBoundary.compatibilityStatus,
    sourceInsertionId: headBoundary.sourceInsertionId,
    sourceHeadRequestId: headBoundary.sourceHeadRequestId,
    contractId: headBoundary.contractId,
    boundaryContractId: headBoundary.boundaryContractId,
    headContractId: headBoundary.headContractId,
    hostTag: headBoundary.hostTag,
    insertedElementObserved:
      headBoundary.resourceElementPlan.insertedElementObserved,
    updateApplied: headBoundary.resourceElementPlan.updateApplied,
    publicResourceHintDomInsertion:
      headBoundary.resourceElementPlan.publicResourceHintDomInsertion,
    publicHeadSingletonBehavior:
      headBoundary.resourceElementPlan.publicHeadSingletonBehavior,
    compatibilityClaimed: headBoundary.resourceElementPlan.compatibilityClaimed,
    sideEffects: headBoundary.sideEffects
  });
}

function createPublicHeadSingletonBoundary() {
  return freezeRecord({
    status: 'blocked-public-head-singleton-boundary',
    hostTag: 'head',
    publicSingletonBehavior: false,
    singletonResolutionReachable: false,
    singletonAcquisitionReachable: false,
    singletonReleaseReachable: false,
    headAttributesMutated: false,
    headChildrenCleared: false,
    realDocumentMutated: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function normalizeResourceHintHeadClearRetainAdmission(diagnostic) {
  if (diagnostic == null || typeof diagnostic !== 'object') {
    throwInvalidResourceHintHeadClearRetainAdmission(
      'head clear/retain admission metadata must be an object'
    );
  }

  if (diagnostic.explicitClearRetain !== true) {
    throwInvalidResourceHintHeadClearRetainAdmission(
      'explicitClearRetain must be true'
    );
  }

  const clearRetainKind = getAdmissionStringProperty(
    diagnostic,
    'clearRetainKind',
    'deterministic-fake-dom-head-clear-retain'
  );
  if (clearRetainKind !== 'deterministic-fake-dom-head-clear-retain') {
    throwInvalidResourceHintHeadClearRetainAdmission(
      'clearRetainKind must be deterministic-fake-dom-head-clear-retain'
    );
  }

  const targetKind = getAdmissionStringProperty(
    diagnostic,
    'targetKind',
    'document-head'
  );
  if (targetKind !== 'document-head') {
    throwInvalidResourceHintHeadClearRetainAdmission(
      'targetKind must be document-head'
    );
  }

  const hostTag = getAdmissionStringProperty(diagnostic, 'hostTag', 'head');
  if (hostTag !== 'head') {
    throwInvalidResourceHintHeadClearRetainAdmission('hostTag must be head');
  }

  assertDeterministicFakeHeadClearRetainTarget(
    diagnostic.fakeDocument,
    diagnostic.fakeHead
  );

  return freezeRecord({
    clearRetainKind,
    clearRetainId: getAdmissionStringProperty(
      diagnostic,
      'clearRetainId',
      'anonymous-fake-dom-head-clear-retain'
    ),
    targetKind,
    hostTag,
    explicitClearRetain: true,
    deterministicFakeDomOnly: true,
    rawDocumentCaptured: false,
    rawHeadCaptured: false,
    rawElementCaptured: false,
    realHeadMutationAllowed: false,
    fakeHeadRemovalAllowed: false,
    singletonReleaseAllowed: false,
    resourceRetainMarkerAllowed: false,
    stylesheetPrecedenceAllowed: false,
    publicHeadSingletonBehavior: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function assertDeterministicFakeHeadClearRetainTarget(fakeDocument, fakeHead) {
  if (
    fakeDocument == null ||
    typeof fakeDocument !== 'object' ||
    fakeDocument.__fastReactFakeResourceDocument !== true
  ) {
    throwInvalidResourceHintHeadClearRetainAdmission(
      'fakeDocument must be an explicit deterministic fake resource document'
    );
  }

  if (
    fakeHead == null ||
    typeof fakeHead !== 'object' ||
    fakeHead.__fastReactFakeResourceHead !== true ||
    fakeHead.ownerDocument !== fakeDocument
  ) {
    throwInvalidResourceHintHeadClearRetainAdmission(
      'fakeHead must belong to the deterministic fake resource document'
    );
  }

  if (!Array.isArray(fakeHead.childNodes)) {
    throwInvalidResourceHintHeadClearRetainAdmission(
      'fakeHead must expose deterministic childNodes for clear/retain diagnostics'
    );
  }
}

function createFakeHeadClearRetainPlan(
  headBoundary,
  fakeDocument,
  fakeHead
) {
  const sourceResource = findHeadBoundaryFakeResourceElement(
    headBoundary,
    fakeDocument,
    fakeHead
  );
  const headChildRows = freezeArray(
    fakeHead.childNodes.map((node, index) =>
      createFakeHeadClearRetainChildRow(
        node,
        index,
        sourceResource.index,
        headBoundary
      )
    )
  );
  const retainedChildRows = headChildRows.filter(
    (row) => row.clearRetainDecision === 'retain'
  );
  const clearableChildRows = headChildRows.filter(
    (row) => row.clearRetainDecision === 'clear'
  );
  const sourceResourceRow = headChildRows[sourceResource.index];
  const stylesheetRows = freezeArray(
    headChildRows.filter((row) => row.stylesheetPrecedenceCandidate === true)
  );

  return freezeRecord({
    singletonRows: freezeArray([
      createHeadSingletonClearRetainRow(
        headBoundary,
        retainedChildRows.length,
        clearableChildRows.length
      )
    ]),
    resourceHintRows: freezeArray([
      createResourceHintClearRetainRow(headBoundary, sourceResourceRow)
    ]),
    headChildRows,
    fakeHeadPlan: createFakeHeadClearRetainSummary(
      headChildRows.length,
      retainedChildRows.length,
      clearableChildRows.length
    ),
    stylesheetPrecedenceBoundary:
      createStylesheetPrecedenceBlockedBoundary(
        stylesheetRows.length > 0,
        stylesheetRows
      )
  });
}

function findHeadBoundaryFakeResourceElement(
  headBoundary,
  fakeDocument,
  fakeHead
) {
  const expectedNodeName =
    headBoundary.resourceElementPlan.elementTag.toUpperCase();
  const expectedRelationship = headBoundary.resourceElementPlan.relationship;

  for (let index = fakeHead.childNodes.length - 1; index >= 0; index--) {
    const node = fakeHead.childNodes[index];
    if (
      isDeterministicFakeHeadBoundaryResourceElement(
        node,
        fakeDocument,
        fakeHead,
        expectedNodeName,
        expectedRelationship
      )
    ) {
      return freezeRecord({index, node});
    }
  }

  throwInvalidResourceHintHeadClearRetainAdmission(
    'fakeHead must contain the deterministic resource element from the head boundary record'
  );
}

function createFakeHeadClearRetainChildRow(
  node,
  childIndex,
  sourceResourceIndex,
  headBoundary
) {
  const nodeName =
    node != null && typeof node.nodeName === 'string'
      ? node.nodeName.toUpperCase()
      : 'UNKNOWN';
  const relationship = getFakeHeadNodeRelationship(node);
  const markedHoistable =
    node != null &&
    typeof node === 'object' &&
    node.__fastReactFakeHoistable === true;
  const stylesheetPrecedenceCandidate =
    nodeName === 'LINK' &&
    relationship === 'stylesheet' &&
    hasFakeHeadNodeAttribute(node, 'data-precedence');
  const sourceResourceHint = childIndex === sourceResourceIndex;
  const retainReason = getFakeHeadRetainReason(
    nodeName,
    relationship,
    markedHoistable
  );
  const clearRetainDecision = retainReason === null ? 'clear' : 'retain';
  const clearReason =
    clearRetainDecision === 'clear'
      ? sourceResourceHint
        ? 'resource-hint-hoistable-marker-blocked'
        : 'unretained-head-child'
      : null;

  return freezeRecord({
    rowId: sourceResourceHint
      ? `resource-hint-${headBoundary.contractId}-head-child`
      : `head-child-${childIndex}`,
    rowType: sourceResourceHint ? 'resource-hint' : 'head-child',
    childIndex,
    nodeName,
    relationship,
    sourceResourceHint,
    sourceBoundaryId: sourceResourceHint ? headBoundary.boundaryId : null,
    contractId: sourceResourceHint ? headBoundary.contractId : null,
    privateDispatcherKey: sourceResourceHint
      ? headBoundary.privateDispatcherKey
      : null,
    clearRetainDecision,
    retainReason,
    clearReason,
    markedHoistable,
    stylesheetPrecedenceCandidate,
    stylesheetPrecedenceApplied: false,
    stylesheetPrecedenceValueRetained: false,
    rawValuesRetained: false,
    actualNodeRemoved: false,
    compatibilityClaimed: false
  });
}

function getFakeHeadRetainReason(nodeName, relationship, markedHoistable) {
  if (markedHoistable) {
    return 'marked-hoistable';
  }
  if (nodeName === 'SCRIPT') {
    return 'script';
  }
  if (nodeName === 'STYLE') {
    return 'style';
  }
  if (nodeName === 'LINK' && relationship === 'stylesheet') {
    return 'stylesheet-link';
  }
  return null;
}

function getFakeHeadNodeRelationship(node) {
  const rel = getFakeHeadNodeAttribute(node, 'rel');
  return typeof rel === 'string' && rel.length > 0 ? rel.toLowerCase() : null;
}

function hasFakeHeadNodeAttribute(node, name) {
  return getFakeHeadNodeAttribute(node, name) !== undefined;
}

function getFakeHeadNodeAttribute(node, name) {
  if (node == null || typeof node !== 'object') {
    return undefined;
  }
  const attributes = node.attributes;
  if (attributes == null || typeof attributes !== 'object') {
    return undefined;
  }
  if (hasOwnProp(attributes, name)) {
    return attributes[name];
  }
  return undefined;
}

function createHeadSingletonClearRetainRow(
  headBoundary,
  retainedChildCount,
  clearableChildCount
) {
  return freezeRecord({
    rowId: 'head-singleton-clear-retain',
    rowType: 'host-singleton',
    hostTag: 'head',
    sourceHeadRequestId: headBoundary.sourceHeadRequestId,
    sourceBoundaryId: headBoundary.boundaryId,
    headContractId: headBoundary.headContractId,
    clearHeadWouldRun: true,
    releaseSingletonWouldRun: true,
    singletonReleaseAllowed: false,
    singletonOwnershipClaimed: false,
    retainedChildCount,
    clearableChildCount,
    actualHeadChildrenCleared: false,
    rawValuesRetained: false,
    compatibilityClaimed: false,
    blockedCapabilities: resourceHintHeadClearRetainBlockedCapabilities
  });
}

function createResourceHintClearRetainRow(headBoundary, sourceResourceRow) {
  return freezeRecord({
    rowId: `${headBoundary.contractId}-resource-head-clear-retain`,
    rowType: 'resource-hint',
    contractId: headBoundary.contractId,
    privateDispatcherKey: headBoundary.privateDispatcherKey,
    sourceInsertionId: headBoundary.sourceInsertionId,
    sourceBoundaryId: headBoundary.boundaryId,
    childIndex: sourceResourceRow.childIndex,
    nodeName: sourceResourceRow.nodeName,
    relationship: sourceResourceRow.relationship,
    clearRetainDecision: sourceResourceRow.clearRetainDecision,
    retainReason: sourceResourceRow.retainReason,
    clearReason: sourceResourceRow.clearReason,
    markedHoistable: sourceResourceRow.markedHoistable,
    resourceHoistableRetentionBlocked: true,
    stylesheetPrecedenceApplied: false,
    stylesheetPrecedenceBlocked: true,
    rawValuesRetained: false,
    actualNodeRemoved: false,
    compatibilityClaimed: false,
    blockedCapabilities: resourceHintHeadClearRetainBlockedCapabilities
  });
}

function createFakeHeadClearRetainSummary(
  childCount,
  retainedChildCount,
  clearableChildCount
) {
  return freezeRecord({
    targetKind: 'document-head',
    hostTag: 'head',
    childCount,
    retainedChildCount,
    clearableChildCount,
    retainPolicy: 'react-19.2.6-clearHead-retain-policy-diagnostic',
    retainedNodeReasons: freezeArray([
      'marked-hoistable',
      'script',
      'style',
      'stylesheet-link'
    ]),
    clearApplied: false,
    fakeHeadMutated: false,
    realHeadMutated: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createStylesheetPrecedenceBlockedBoundary(
  stylesheetPrecedenceRowsObserved,
  stylesheetRows
) {
  return freezeRecord({
    status: privateResourceHintHeadStylesheetPrecedenceBlockedStatus,
    stylesheetPrecedenceRowsObserved,
    stylesheetRowCount: stylesheetRows.length,
    stylesheetRows: freezeArray(
      stylesheetRows.map((row) =>
        freezeRecord({
          rowId: row.rowId,
          childIndex: row.childIndex,
          nodeName: row.nodeName,
          relationship: row.relationship,
          dataPrecedenceAttributePresent:
            row.stylesheetPrecedenceCandidate,
          precedenceValueRetained: false,
          orderingApplied: false
        })
      )
    ),
    precedenceMapCreated: false,
    precedenceQueryRun: false,
    precedenceInsertionApplied: false,
    publicStylesheetPrecedenceBehavior: false,
    compatibilityClaimed: false,
    blockedCapabilities:
      resourceHintHeadStylesheetPrecedenceBlockedCapabilities
  });
}

function normalizeResourceHintPreloadPreinitOrderAdmission(
  diagnostic,
  adapterAdmissions
) {
  if (diagnostic == null || typeof diagnostic !== 'object') {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'preload/preinit order admission metadata must be an object'
    );
  }

  if (diagnostic.explicitOrderDiagnostic !== true) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'explicitOrderDiagnostic must be true'
    );
  }

  const orderKind = getAdmissionStringProperty(
    diagnostic,
    'orderKind',
    'deterministic-fake-dom-preload-preinit-dedupe-order'
  );
  if (
    orderKind !==
    'deterministic-fake-dom-preload-preinit-dedupe-order'
  ) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'orderKind must be deterministic-fake-dom-preload-preinit-dedupe-order'
    );
  }

  const targetKind = getAdmissionStringProperty(
    diagnostic,
    'targetKind',
    'document-head'
  );
  if (targetKind !== 'document-head') {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'targetKind must be document-head'
    );
  }

  assertDeterministicFakePreloadPreinitOrderTarget(
    diagnostic.fakeDocument,
    diagnostic.fakeHead
  );

  const descriptors = normalizePreloadPreinitResourceDescriptors(
    diagnostic.resourceDescriptors,
    adapterAdmissions
  );

  return {
    descriptors,
    admission: freezeRecord({
      orderKind,
      orderId: getAdmissionStringProperty(
        diagnostic,
        'orderId',
        'anonymous-fake-dom-preload-preinit-order'
      ),
      targetKind,
      explicitOrderDiagnostic: true,
      deterministicFakeDomOnly: true,
      rawDocumentCaptured: false,
      rawHeadCaptured: false,
      rawElementCaptured: false,
      rawValuesRetained: false,
      resourceMapCreationAllowed: false,
      resourceMapMutationAllowed: false,
      fakeHeadMutationAllowed: false,
      realHeadMutationAllowed: false,
      publicResourceHintDomInsertion: false,
      publicStylesheetPrecedenceBehavior: false,
      publicRootTouched: false,
      compatibilityClaimed: false,
      resourceDescriptors: descriptors
    })
  };
}

function normalizePreloadPreinitResourceDescriptors(
  descriptors,
  adapterAdmissions
) {
  if (!Array.isArray(descriptors)) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'resourceDescriptors must be an array'
    );
  }

  if (descriptors.length !== adapterAdmissions.length) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'resourceDescriptors must match the adapter admission count'
    );
  }

  return freezeArray(
    descriptors.map((descriptor, index) =>
      normalizePreloadPreinitResourceDescriptor(
        descriptor,
        adapterAdmissions[index],
        index
      )
    )
  );
}

function normalizePreloadPreinitResourceDescriptor(
  descriptor,
  adapterAdmission,
  index
) {
  if (descriptor == null || typeof descriptor !== 'object') {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'resource descriptor metadata must be an object'
    );
  }

  if (
    descriptor.sourceAdapterAdmissionId !==
    adapterAdmission.adapterAdmissionId
  ) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'resource descriptor sourceAdapterAdmissionId must match the adapter admission order'
    );
  }

  const contract = getResourceHintPreloadPreinitOrderContract(
    adapterAdmission.contractId
  );
  const resourceKind = getPreloadPreinitResourceKind(descriptor);
  if (!contract.resourceKinds.includes(resourceKind)) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      `resourceKind ${resourceKind} is not accepted for ${contract.sourceContractId}`
    );
  }

  const precedenceKey = getOptionalOpaqueDiagnosticToken(
    descriptor,
    'precedenceKey'
  );
  if (contract.sourceContractId === 'preinit-style') {
    if (precedenceKey === null) {
      throwInvalidResourceHintPreloadPreinitOrderAdmission(
        'preinit-style descriptors must include precedenceKey'
      );
    }
  } else if (precedenceKey !== null && resourceKind !== 'style') {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'precedenceKey is only accepted for style resources'
    );
  }

  return freezeRecord({
    index,
    sourceAdapterAdmissionId: adapterAdmission.adapterAdmissionId,
    sourceRequestId: adapterAdmission.sourceRequestId,
    contractId: adapterAdmission.contractId,
    privateDispatcherKey: adapterAdmission.privateDispatcherKey,
    resourceKind,
    resourceKey: getOpaqueDiagnosticToken(descriptor, 'resourceKey'),
    precedenceKey,
    rawResourceKeyRetained: false,
    rawPrecedenceValueRetained: false
  });
}

function getPreloadPreinitResourceKind(descriptor) {
  const resourceKind = getOpaqueDiagnosticToken(descriptor, 'resourceKind');
  if (
    resourceKind === 'style' ||
    resourceKind === 'script' ||
    resourceKind === 'worker' ||
    resourceKind === 'serviceworker' ||
    resourceKind === 'sharedworker' ||
    resourceKind === 'audioworklet' ||
    resourceKind === 'paintworklet' ||
    resourceKind === 'font' ||
    resourceKind === 'image' ||
    resourceKind === 'other'
  ) {
    return resourceKind;
  }

  throwInvalidResourceHintPreloadPreinitOrderAdmission(
    'resourceKind must be style, script, worker, serviceworker, sharedworker, audioworklet, paintworklet, font, image, or other'
  );
}

function getOpaqueDiagnosticToken(record, key) {
  const value = record[key];
  if (
    typeof value === 'string' &&
    /^[a-z][a-z0-9-]*$/u.test(value)
  ) {
    return value;
  }

  throwInvalidResourceHintPreloadPreinitOrderAdmission(
    `${key} must be an opaque lowercase diagnostic token`
  );
}

function getOptionalOpaqueDiagnosticToken(record, key) {
  if (!hasOwnProp(record, key) || record[key] == null) {
    return null;
  }
  return getOpaqueDiagnosticToken(record, key);
}

function assertDeterministicFakePreloadPreinitOrderTarget(
  fakeDocument,
  fakeHead
) {
  if (
    fakeDocument == null ||
    typeof fakeDocument !== 'object' ||
    fakeDocument.__fastReactFakeResourceDocument !== true
  ) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'fakeDocument must be an explicit deterministic fake resource document'
    );
  }

  if (
    fakeHead == null ||
    typeof fakeHead !== 'object' ||
    fakeHead.__fastReactFakeResourceHead !== true ||
    fakeHead.ownerDocument !== fakeDocument
  ) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'fakeHead must belong to the deterministic fake resource document'
    );
  }

  if (!Array.isArray(fakeHead.childNodes)) {
    throwInvalidResourceHintPreloadPreinitOrderAdmission(
      'fakeHead must expose deterministic childNodes for order diagnostics'
    );
  }
}

function createResourceHintPreloadPreinitOrderPlan(
  adapterAdmissions,
  diagnosticAdmission,
  fakeDocument,
  fakeHead
) {
  const stateByResourceKey = new Map();
  const dedupeRows = [];
  const plannedRows = [];

  for (let index = 0; index < adapterAdmissions.length; index++) {
    const adapterAdmission = adapterAdmissions[index];
    const descriptor = diagnosticAdmission.descriptors[index];
    const contract = getResourceHintPreloadPreinitOrderContract(
      adapterAdmission.contractId
    );
    const resourceKey = `${descriptor.resourceKind}:${descriptor.resourceKey}`;
    const existingState = stateByResourceKey.get(resourceKey) || null;
    const dedupeDecision = getPreloadPreinitDedupeDecision(
      contract,
      existingState
    );
    const wouldInsert = dedupeDecision.wouldInsert;
    const row = createPreloadPreinitDedupeRow(
      adapterAdmission,
      descriptor,
      contract,
      resourceKey,
      existingState,
      dedupeDecision,
      index
    );

    dedupeRows.push(row);
    if (wouldInsert) {
      plannedRows.push(
        createPlannedPreloadPreinitHeadInsertionRow(row, contract)
      );
    }
    updatePreloadPreinitResourceState(
      stateByResourceKey,
      resourceKey,
      row,
      contract
    );
  }

  const precedenceRows = createPreloadPreinitPrecedenceRows(plannedRows);
  const plannedHeadInsertionOrder =
    createPlannedPreloadPreinitHeadInsertionOrder(
      plannedRows,
      precedenceRows
    );
  const observedHeadOrder =
    createObservedPreloadPreinitFakeHeadOrder(fakeDocument, fakeHead);
  const scriptModulePreinitRows =
    createScriptModulePreinitRows(dedupeRows);
  const scriptModuleHeadOrder = createScriptModuleHeadOrder(
    plannedHeadInsertionOrder.rows,
    observedHeadOrder.rows
  );

  return freezeRecord({
    dedupeRows: freezeArray(dedupeRows),
    precedenceRows,
    scriptModulePreinitRows,
    plannedHeadInsertionOrder,
    observedHeadOrder,
    scriptModuleHeadOrder,
    stylesheetPrecedenceBoundary:
      createStylesheetPrecedenceOrderDiagnosticBoundary(
        precedenceRows,
        observedHeadOrder.rows
      ),
    resourceMapPlan: createPreloadPreinitResourceMapPlan(
      stateByResourceKey,
      dedupeRows
    ),
    publicScriptModuleDispatchBoundary:
      createPublicScriptModuleResourceDispatchBoundary(
        scriptModulePreinitRows
      )
  });
}

function getPreloadPreinitDedupeDecision(contract, existingState) {
  if (contract.resourceStage === 'preload') {
    if (existingState !== null && existingState.preinitRow !== null) {
      return freezeRecord({
        dedupeAction: 'skip-preload-existing-preinit',
        wouldInsert: false,
        matchedSourceAdapterAdmissionId:
          existingState.preinitRow.sourceAdapterAdmissionId
      });
    }
    if (existingState !== null && existingState.preloadRow !== null) {
      return freezeRecord({
        dedupeAction: 'dedupe-preload',
        wouldInsert: false,
        matchedSourceAdapterAdmissionId:
          existingState.preloadRow.sourceAdapterAdmissionId
      });
    }
    return freezeRecord({
      dedupeAction: 'insert-preload',
      wouldInsert: true,
      matchedSourceAdapterAdmissionId: null
    });
  }

  if (existingState !== null && existingState.preinitRow !== null) {
    return freezeRecord({
      dedupeAction: 'dedupe-preinit',
      wouldInsert: false,
      matchedSourceAdapterAdmissionId:
        existingState.preinitRow.sourceAdapterAdmissionId
    });
  }
  if (existingState !== null && existingState.preloadRow !== null) {
    return freezeRecord({
      dedupeAction: 'preinit-adopts-preload',
      wouldInsert: true,
      matchedSourceAdapterAdmissionId:
        existingState.preloadRow.sourceAdapterAdmissionId
    });
  }
  return freezeRecord({
    dedupeAction: 'insert-preinit',
    wouldInsert: true,
    matchedSourceAdapterAdmissionId: null
  });
}

function createPreloadPreinitDedupeRow(
  adapterAdmission,
  descriptor,
  contract,
  resourceKey,
  existingState,
  dedupeDecision,
  index
) {
  return freezeRecord({
    rowId: `preload-preinit-dedupe-${index}`,
    rowType: 'resource-hint',
    inputIndex: index,
    sourceAdapterAdmissionId: adapterAdmission.adapterAdmissionId,
    sourceRequestId: adapterAdmission.sourceRequestId,
    sourceRequestType: adapterAdmission.sourceRequestType,
    contractId: adapterAdmission.contractId,
    privateDispatcherKey: adapterAdmission.privateDispatcherKey,
    publicName: adapterAdmission.publicName,
    resourceStage: contract.resourceStage,
    resourceKind: descriptor.resourceKind,
    resourceKey,
    opaqueResourceKey: descriptor.resourceKey,
    precedenceKey: descriptor.precedenceKey,
    elementTag: contract.elementTag,
    relationship: contract.relationship,
    dedupeAction: dedupeDecision.dedupeAction,
    dedupeMatched: dedupeDecision.matchedSourceAdapterAdmissionId !== null,
    matchedSourceAdapterAdmissionId:
      dedupeDecision.matchedSourceAdapterAdmissionId,
    preloadSeenBefore:
      existingState !== null && existingState.preloadRow !== null,
    preinitSeenBefore:
      existingState !== null && existingState.preinitRow !== null,
    wouldInsertIntoHead: dedupeDecision.wouldInsert,
    resourceMapCreated: false,
    resourceMapMutated: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function updatePreloadPreinitResourceState(
  stateByResourceKey,
  resourceKey,
  row,
  contract
) {
  const existingState = stateByResourceKey.get(resourceKey) || {
    preloadRow: null,
    preinitRow: null
  };

  if (contract.resourceStage === 'preload') {
    if (existingState.preloadRow === null) {
      existingState.preloadRow = row;
    }
  } else if (existingState.preinitRow === null) {
    existingState.preinitRow = row;
  }

  stateByResourceKey.set(resourceKey, existingState);
}

function createPlannedPreloadPreinitHeadInsertionRow(row, contract) {
  const placementKind =
    contract.sourceContractId === 'preinit-style'
      ? 'stylesheet-precedence'
      : 'append';
  return freezeRecord({
    rowId: `planned-head-${row.inputIndex}`,
    sourceDedupeRowId: row.rowId,
    inputIndex: row.inputIndex,
    sourceAdapterAdmissionId: row.sourceAdapterAdmissionId,
    contractId: row.contractId,
    resourceStage: row.resourceStage,
    resourceKind: row.resourceKind,
    resourceKey: row.resourceKey,
    precedenceKey: row.precedenceKey,
    elementTag: row.elementTag,
    relationship: row.relationship,
    placementKind,
    insertionMethod:
      placementKind === 'stylesheet-precedence'
        ? 'insert-before-or-after-precedence-peer'
        : 'appendChild',
    wouldMutateFakeHead: false,
    wouldMutateRealHead: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createPreloadPreinitPrecedenceRows(plannedRows) {
  const rowsByPrecedence = new Map();
  const order = [];
  for (const row of plannedRows) {
    if (row.placementKind !== 'stylesheet-precedence') {
      continue;
    }
    const precedenceKey = row.precedenceKey || 'default-precedence';
    if (!rowsByPrecedence.has(precedenceKey)) {
      rowsByPrecedence.set(precedenceKey, []);
      order.push(precedenceKey);
    }
    rowsByPrecedence.get(precedenceKey).push(row);
  }

  return freezeArray(
    order.map((precedenceKey, index) => {
      const rows = rowsByPrecedence.get(precedenceKey);
      return freezeRecord({
        rowId: `stylesheet-precedence-${index}`,
        precedenceIndex: index,
        precedenceKey,
        sourceAdapterAdmissionIds: freezeArray(
          rows.map((row) => row.sourceAdapterAdmissionId)
        ),
        resourceKeys: freezeArray(rows.map((row) => row.resourceKey)),
        plannedStylesheetCount: rows.length,
        orderingApplied: false,
        precedenceMapCreated: false,
        precedenceQueryRun: false,
        rawPrecedenceValueRetained: false,
        compatibilityClaimed: false
      });
    })
  );
}

function createPlannedPreloadPreinitHeadInsertionOrder(
  plannedRows,
  precedenceRows
) {
  const stylesheetRows = [];
  for (const precedenceRow of precedenceRows) {
    for (const row of plannedRows) {
      if (
        row.placementKind === 'stylesheet-precedence' &&
        (row.precedenceKey || 'default-precedence') ===
          precedenceRow.precedenceKey
      ) {
        stylesheetRows.push(row);
      }
    }
  }

  const appendRows = plannedRows.filter(
    (row) => row.placementKind !== 'stylesheet-precedence'
  );
  const orderedRows = freezeArray(
    stylesheetRows.concat(appendRows).map((row, headOrderIndex) =>
      freezeRecord({
        headOrderIndex,
        sourceDedupeRowId: row.sourceDedupeRowId,
        inputIndex: row.inputIndex,
        sourceAdapterAdmissionId: row.sourceAdapterAdmissionId,
        contractId: row.contractId,
        resourceStage: row.resourceStage,
        resourceKind: row.resourceKind,
        resourceKey: row.resourceKey,
        precedenceKey: row.precedenceKey,
        elementTag: row.elementTag,
        relationship: row.relationship,
        placementKind: row.placementKind,
        insertionMethod: row.insertionMethod,
        insertionApplied: false,
        rawValuesRetained: false,
        compatibilityClaimed: false
      })
    )
  );

  return freezeRecord({
    targetKind: 'document-head',
    hostTag: 'head',
    orderKind:
      'react-19.2.6-preload-preinit-head-order-diagnostic',
    rowCount: orderedRows.length,
    rows: orderedRows,
    fakeHeadMutated: false,
    realHeadMutated: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createObservedPreloadPreinitFakeHeadOrder(fakeDocument, fakeHead) {
  const rows = freezeArray(
    fakeHead.childNodes.map((node, index) =>
      createObservedPreloadPreinitFakeHeadRow(node, index, fakeDocument)
    )
  );

  return freezeRecord({
    targetKind: 'document-head',
    hostTag: 'head',
    rowCount: rows.length,
    rows,
    fakeHeadRead: true,
    fakeHeadMutated: false,
    realHeadMutated: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createObservedPreloadPreinitFakeHeadRow(
  node,
  childIndex,
  fakeDocument
) {
  const nodeName =
    node != null && typeof node.nodeName === 'string'
      ? node.nodeName.toUpperCase()
      : 'UNKNOWN';
  const relationship = getFakeHeadNodeRelationship(node);
  const resourceKey = getOptionalOpaqueFakeHeadAttribute(
    node,
    'data-fast-react-resource-key'
  );
  const precedenceKey = getOptionalOpaqueFakeHeadAttribute(
    node,
    'data-fast-react-precedence-key'
  );
  const resourceKind = getObservedFakeHeadResourceKind(
    nodeName,
    relationship,
    node
  );
  const scriptKind = getObservedFakeHeadScriptKind(
    nodeName,
    relationship,
    node
  );

  return freezeRecord({
    rowId: `observed-head-child-${childIndex}`,
    rowType: 'head-child',
    childIndex,
    nodeName,
    relationship,
    resourceKind,
    scriptKind,
    resourceKey,
    precedenceKey,
    deterministicFakeResourceElement:
      node != null &&
      typeof node === 'object' &&
      node.__fastReactFakeResourceElement === true &&
      node.ownerDocument === fakeDocument,
    stylesheetPrecedenceCandidate:
      (nodeName === 'LINK' || nodeName === 'STYLE') &&
      hasFakeHeadNodeAttribute(node, 'data-precedence'),
    orderObserved: true,
    orderMutated: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function getObservedFakeHeadResourceKind(nodeName, relationship, node) {
  if (nodeName === 'SCRIPT') {
    return 'script';
  }
  if (nodeName === 'STYLE') {
    return 'style';
  }
  if (relationship === 'stylesheet') {
    return 'style';
  }
  if (
    relationship === 'preload' &&
    getFakeHeadNodeAttribute(node, 'as') === 'script'
  ) {
    return 'script';
  }
  if (relationship === 'preload') {
    return 'preload';
  }
  if (relationship === 'modulepreload') {
    return 'script';
  }
  return null;
}

function getObservedFakeHeadScriptKind(nodeName, relationship, node) {
  if (relationship === 'modulepreload') {
    return 'module';
  }
  if (
    relationship === 'preload' &&
    getFakeHeadNodeAttribute(node, 'as') === 'script'
  ) {
    return 'classic';
  }
  if (nodeName !== 'SCRIPT') {
    return null;
  }
  const type = getFakeHeadNodeAttribute(node, 'type');
  return type === 'module' ? 'module' : 'classic';
}

function createScriptModulePreinitRows(dedupeRows) {
  const rows = [];
  for (const row of dedupeRows) {
    const scriptKind = getScriptModulePreinitRowScriptKind(row);
    if (scriptKind === null) {
      continue;
    }

    rows.push(
      freezeRecord({
        rowId: `script-module-preinit-${rows.length}`,
        rowType: 'script-module-resource-hint',
        sourceDedupeRowId: row.rowId,
        inputIndex: row.inputIndex,
        sourceAdapterAdmissionId: row.sourceAdapterAdmissionId,
        sourceRequestId: row.sourceRequestId,
        sourceRequestType: row.sourceRequestType,
        contractId: row.contractId,
        privateDispatcherKey: row.privateDispatcherKey,
        publicName: row.publicName,
        resourceStage: row.resourceStage,
        resourceKind: row.resourceKind,
        scriptKind,
        relationship: row.relationship,
        dedupeKey: row.resourceKey,
        resourceKey: row.resourceKey,
        opaqueResourceKey: row.opaqueResourceKey,
        dedupeAction: row.dedupeAction,
        dedupeMatched: row.dedupeMatched,
        matchedSourceAdapterAdmissionId:
          row.matchedSourceAdapterAdmissionId,
        preloadSeenBefore: row.preloadSeenBefore,
        preinitSeenBefore: row.preinitSeenBefore,
        wouldInsertIntoHead: row.wouldInsertIntoHead,
        modulePreload:
          row.contractId === 'preload-module',
        classicScriptPreinit:
          row.contractId === 'preinit-script',
        moduleScriptPreinit:
          row.contractId === 'preinit-module-script',
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        networkFetchStarted: false,
        loadEventSubscribed: false,
        resourceMapCreated: false,
        resourceMapMutated: false,
        rawValuesRetained: false,
        compatibilityClaimed: false
      })
    );
  }

  return freezeArray(rows);
}

function getScriptModulePreinitRowScriptKind(row) {
  if (
    row.contractId === 'preload-module' &&
    row.resourceKind === 'script'
  ) {
    return 'module';
  }
  if (row.contractId === 'preinit-module-script') {
    return 'module';
  }
  if (row.contractId === 'preinit-script') {
    return 'classic';
  }
  if (row.contractId === 'preload' && row.resourceKind === 'script') {
    return 'classic';
  }
  return null;
}

function createScriptModuleHeadOrder(plannedRows, observedRows) {
  const plannedScriptModuleRows = freezeArray(
    plannedRows
      .filter(isScriptModuleHeadOrderPlannedRow)
      .map((row, scriptModuleHeadOrderIndex) =>
        freezeRecord({
          rowId: `script-module-planned-head-${scriptModuleHeadOrderIndex}`,
          sourceDedupeRowId: row.sourceDedupeRowId,
          headOrderIndex: row.headOrderIndex,
          inputIndex: row.inputIndex,
          sourceAdapterAdmissionId: row.sourceAdapterAdmissionId,
          contractId: row.contractId,
          resourceStage: row.resourceStage,
          resourceKind: row.resourceKind,
          scriptKind: getScriptModuleHeadOrderScriptKind(row),
          resourceKey: row.resourceKey,
          relationship: row.relationship,
          placementKind: row.placementKind,
          insertionMethod: row.insertionMethod,
          insertionApplied: false,
          publicResourceDispatchBlocked: true,
          publicScriptModuleResourceDispatch: false,
          scriptExecutionStarted: false,
          rawValuesRetained: false,
          compatibilityClaimed: false
        })
      )
  );
  const observedScriptModuleRows = freezeArray(
    observedRows
      .filter(isScriptModuleHeadOrderObservedRow)
      .map((row, scriptModuleHeadOrderIndex) =>
        freezeRecord({
          rowId: `script-module-observed-head-${scriptModuleHeadOrderIndex}`,
          sourceObservedHeadRowId: row.rowId,
          childIndex: row.childIndex,
          nodeName: row.nodeName,
          relationship: row.relationship,
          resourceKind: row.resourceKind,
          scriptKind: row.scriptKind,
          resourceKey: row.resourceKey,
          orderObserved: row.orderObserved,
          orderMutated: false,
          publicResourceDispatchBlocked: true,
          publicScriptModuleResourceDispatch: false,
          scriptExecutionStarted: false,
          rawValuesRetained: false,
          compatibilityClaimed: false
        })
      )
  );

  return freezeRecord({
    targetKind: 'document-head',
    hostTag: 'head',
    orderKind:
      'react-19.2.6-script-modulepreload-preinit-head-order-diagnostic',
    plannedRowCount: plannedScriptModuleRows.length,
    observedRowCount: observedScriptModuleRows.length,
    plannedRows: plannedScriptModuleRows,
    observedRows: observedScriptModuleRows,
    fakeHeadRead: true,
    fakeHeadMutated: false,
    realHeadMutated: false,
    publicResourceDispatchBlocked: true,
    publicScriptModuleResourceDispatch: false,
    scriptExecutionStarted: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function isScriptModuleHeadOrderPlannedRow(row) {
  return getScriptModuleHeadOrderScriptKind(row) !== null;
}

function getScriptModuleHeadOrderScriptKind(row) {
  if (
    row.contractId === 'preload-module' &&
    row.resourceKind === 'script'
  ) {
    return 'module';
  }
  if (row.contractId === 'preinit-module-script') {
    return 'module';
  }
  if (row.contractId === 'preinit-script') {
    return 'classic';
  }
  if (row.contractId === 'preload' && row.resourceKind === 'script') {
    return 'classic';
  }
  return null;
}

function isScriptModuleHeadOrderObservedRow(row) {
  return row.resourceKind === 'script' || row.scriptKind !== null;
}

function createPublicScriptModuleResourceDispatchBoundary(
  scriptModulePreinitRows
) {
  return freezeRecord({
    status: 'blocked-public-script-module-resource-dispatch',
    scriptModuleRowCount: scriptModulePreinitRows.length,
    scriptModuleRowsRecorded: scriptModulePreinitRows.length > 0,
    publicResourceDispatchBlocked: true,
    publicScriptModuleResourceDispatch: false,
    publicDispatcherInvoked: false,
    publicResourceApisReachable: false,
    previousDispatcherInvoked: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    networkFetchStarted: false,
    realDocumentMutated: false,
    realHeadMutated: false,
    compatibilityClaimed: false,
    blockedCapabilities: resourceHintPreloadPreinitOrderBlockedCapabilities
  });
}

function getOptionalOpaqueFakeHeadAttribute(node, attributeName) {
  const value = getFakeHeadNodeAttribute(node, attributeName);
  if (value === undefined) {
    return null;
  }
  if (
    typeof value === 'string' &&
    /^[a-z][a-z0-9-]*$/u.test(value)
  ) {
    return value;
  }

  throwInvalidResourceHintPreloadPreinitOrderAdmission(
    `${attributeName} must be an opaque lowercase diagnostic token`
  );
}

function createStylesheetPrecedenceOrderDiagnosticBoundary(
  precedenceRows,
  observedRows
) {
  const observedStylesheetRows = observedRows.filter(
    (row) => row.stylesheetPrecedenceCandidate === true
  );
  return freezeRecord({
    status: privateResourceHintHeadStylesheetPrecedenceBlockedStatus,
    stylesheetPrecedenceRowsObserved:
      precedenceRows.length > 0 || observedStylesheetRows.length > 0,
    stylesheetRowCount: precedenceRows.length,
    observedStylesheetRowCount: observedStylesheetRows.length,
    precedenceRows,
    observedStylesheetRows: freezeArray(
      observedStylesheetRows.map((row) =>
        freezeRecord({
          rowId: row.rowId,
          childIndex: row.childIndex,
          nodeName: row.nodeName,
          relationship: row.relationship,
          precedenceKey: row.precedenceKey,
          precedenceValueRetained: false,
          orderingApplied: false
        })
      )
    ),
    precedenceMapCreated: false,
    precedenceQueryRun: false,
    precedenceInsertionApplied: false,
    publicStylesheetPrecedenceBehavior: false,
    compatibilityClaimed: false,
    blockedCapabilities:
      resourceHintHeadStylesheetPrecedenceBlockedCapabilities
  });
}

function createPreloadPreinitResourceMapPlan(stateByResourceKey, dedupeRows) {
  let preloadResourceCount = 0;
  let preinitResourceCount = 0;
  let modulePreloadResourceCount = 0;
  let scriptPreinitResourceCount = 0;
  let moduleScriptPreinitResourceCount = 0;
  for (const state of stateByResourceKey.values()) {
    if (state.preloadRow !== null) {
      preloadResourceCount++;
      if (state.preloadRow.contractId === 'preload-module') {
        modulePreloadResourceCount++;
      }
    }
    if (state.preinitRow !== null) {
      preinitResourceCount++;
      if (state.preinitRow.contractId === 'preinit-script') {
        scriptPreinitResourceCount++;
      }
      if (state.preinitRow.contractId === 'preinit-module-script') {
        moduleScriptPreinitResourceCount++;
      }
    }
  }

  const scriptModuleRowCount = dedupeRows.filter(
    (row) => getScriptModulePreinitRowScriptKind(row) !== null
  ).length;

  return freezeRecord({
    resourceMapKind:
      'react-19.2.6-preload-preinit-resource-map-diagnostic',
    resourceMapCreated: false,
    resourceMapMutated: false,
    inputRowCount: dedupeRows.length,
    uniqueResourceCount: stateByResourceKey.size,
    preloadResourceCount,
    preinitResourceCount,
    scriptModuleRowCount,
    modulePreloadResourceCount,
    scriptPreinitResourceCount,
    moduleScriptPreinitResourceCount,
    dedupedRowCount: dedupeRows.filter(
      (row) => row.wouldInsertIntoHead === false
    ).length,
    publicScriptModuleResourceDispatch: false,
    scriptExecutionStarted: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function normalizeResourceHintStylesheetPrecedenceAdmission(diagnostic) {
  if (diagnostic == null || typeof diagnostic !== 'object') {
    throwInvalidResourceHintStylesheetPrecedenceAdmission(
      'stylesheet precedence admission metadata must be an object'
    );
  }

  if (diagnostic.explicitStylesheetPrecedenceDiagnostic !== true) {
    throwInvalidResourceHintStylesheetPrecedenceAdmission(
      'explicitStylesheetPrecedenceDiagnostic must be true'
    );
  }

  const precedenceKind = getAdmissionStringProperty(
    diagnostic,
    'precedenceKind',
    'deterministic-fake-dom-stylesheet-precedence-order'
  );
  if (
    precedenceKind !==
    'deterministic-fake-dom-stylesheet-precedence-order'
  ) {
    throwInvalidResourceHintStylesheetPrecedenceAdmission(
      'precedenceKind must be deterministic-fake-dom-stylesheet-precedence-order'
    );
  }

  const targetKind = getAdmissionStringProperty(
    diagnostic,
    'targetKind',
    'document-head'
  );
  if (targetKind !== 'document-head') {
    throwInvalidResourceHintStylesheetPrecedenceAdmission(
      'targetKind must be document-head'
    );
  }

  const hostTag = getAdmissionStringProperty(diagnostic, 'hostTag', 'head');
  if (hostTag !== 'head') {
    throwInvalidResourceHintStylesheetPrecedenceAdmission(
      'hostTag must be head'
    );
  }

  assertDeterministicFakeStylesheetPrecedenceTarget(
    diagnostic.fakeDocument,
    diagnostic.fakeHead
  );

  return freezeRecord({
    precedenceKind,
    precedenceId: getAdmissionStringProperty(
      diagnostic,
      'precedenceId',
      'anonymous-fake-dom-stylesheet-precedence'
    ),
    targetKind,
    hostTag,
    explicitStylesheetPrecedenceDiagnostic: true,
    deterministicFakeDomOnly: true,
    rawDocumentCaptured: false,
    rawHeadCaptured: false,
    rawElementCaptured: false,
    rawValuesRetained: false,
    stylesheetResourceMapCreationAllowed: false,
    stylesheetResourceMapMutationAllowed: false,
    fakeHeadMutationAllowed: false,
    realHeadMutationAllowed: false,
    headSingletonResolutionAllowed: false,
    headSingletonOrderingAllowed: false,
    publicResourceHintDomInsertion: false,
    publicStylesheetPrecedenceBehavior: false,
    publicHeadSingletonBehavior: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function assertDeterministicFakeStylesheetPrecedenceTarget(
  fakeDocument,
  fakeHead
) {
  if (
    fakeDocument == null ||
    typeof fakeDocument !== 'object' ||
    fakeDocument.__fastReactFakeResourceDocument !== true
  ) {
    throwInvalidResourceHintStylesheetPrecedenceAdmission(
      'fakeDocument must be an explicit deterministic fake resource document'
    );
  }

  if (
    fakeHead == null ||
    typeof fakeHead !== 'object' ||
    fakeHead.__fastReactFakeResourceHead !== true ||
    fakeHead.ownerDocument !== fakeDocument
  ) {
    throwInvalidResourceHintStylesheetPrecedenceAdmission(
      'fakeHead must belong to the deterministic fake resource document'
    );
  }

  if (!Array.isArray(fakeHead.childNodes)) {
    throwInvalidResourceHintStylesheetPrecedenceAdmission(
      'fakeHead must expose deterministic childNodes for stylesheet diagnostics'
    );
  }
}

function createResourceHintStylesheetPrecedencePlan(
  order,
  headRequest,
  fakeDocument,
  fakeHead
) {
  const observedStylesheetOrder =
    createObservedStylesheetPrecedenceFakeHeadOrder(fakeDocument, fakeHead);
  const stylesheetDedupeRows = createStylesheetPrecedenceDedupeRows(
    order.dedupeRows
  );
  const precedenceRows = createStylesheetPrecedenceRows(
    order.precedenceRows,
    observedStylesheetOrder.rows
  );
  const plannedStylesheetOrder = createPlannedStylesheetPrecedenceOrder(
    order.plannedHeadInsertionOrder.rows,
    precedenceRows
  );
  const headSingletonOrderRows = createHeadSingletonStylesheetOrderRows(
    headRequest,
    order,
    observedStylesheetOrder.rows
  );
  const headSingletonOrderBoundary =
    createHeadSingletonStylesheetOrderBoundary(
      headRequest,
      order,
      plannedStylesheetOrder.rows,
      headSingletonOrderRows
    );

  return freezeRecord({
    stylesheetDedupeRows,
    precedenceRows,
    plannedStylesheetOrder,
    observedStylesheetOrder,
    headSingletonOrderBoundary,
    headSingletonOrderRows,
    stylesheetResourceMapPlan:
      createStylesheetPrecedenceResourceMapPlan(stylesheetDedupeRows),
    stylesheetPrecedenceBoundary:
      createStylesheetPrecedenceOrderDiagnosticBoundary(
        precedenceRows,
        observedStylesheetOrder.rows
      )
  });
}

function createStylesheetPrecedenceDedupeRows(dedupeRows) {
  return freezeArray(
    dedupeRows
      .filter((row) => row.resourceKind === 'style')
      .map((row, index) =>
        freezeRecord({
          rowId: `stylesheet-dedupe-${index}`,
          rowType: 'stylesheet-dedupe',
          sourceDedupeRowId: row.rowId,
          inputIndex: row.inputIndex,
          sourceAdapterAdmissionId: row.sourceAdapterAdmissionId,
          sourceRequestId: row.sourceRequestId,
          contractId: row.contractId,
          privateDispatcherKey: row.privateDispatcherKey,
          resourceStage: row.resourceStage,
          resourceKind: row.resourceKind,
          resourceKey: row.resourceKey,
          opaqueResourceKey: row.opaqueResourceKey,
          precedenceKey: row.precedenceKey,
          relationship: row.relationship,
          dedupeAction: row.dedupeAction,
          dedupeMatched: row.dedupeMatched,
          matchedSourceAdapterAdmissionId:
            row.matchedSourceAdapterAdmissionId,
          preloadSeenBefore: row.preloadSeenBefore,
          preinitSeenBefore: row.preinitSeenBefore,
          wouldInsertIntoHead: row.wouldInsertIntoHead,
          stylesheetResourceMapCreated: false,
          stylesheetResourceMapMutated: false,
          rawValuesRetained: false,
          compatibilityClaimed: false
        })
      )
  );
}

function createStylesheetPrecedenceRows(precedenceRows, observedRows) {
  return freezeArray(
    precedenceRows.map((row, index) => {
      const observedStylesheetRows = observedRows.filter(
        (observedRow) =>
          observedRow.stylesheetPrecedenceCandidate === true &&
          observedRow.precedenceKey === row.precedenceKey
      );
      return freezeRecord({
        rowId: `stylesheet-precedence-group-${index}`,
        sourcePrecedenceRowId: row.rowId,
        precedenceIndex: row.precedenceIndex,
        precedenceKey: row.precedenceKey,
        sourceAdapterAdmissionIds: row.sourceAdapterAdmissionIds,
        resourceKeys: row.resourceKeys,
        plannedStylesheetCount: row.plannedStylesheetCount,
        observedStylesheetCount: observedStylesheetRows.length,
        firstObservedHeadIndex:
          observedStylesheetRows.length > 0
            ? observedStylesheetRows[0].childIndex
            : null,
        orderingApplied: false,
        precedenceMapCreated: false,
        precedenceQueryRun: false,
        rawPrecedenceValueRetained: false,
        compatibilityClaimed: false
      });
    })
  );
}

function createPlannedStylesheetPrecedenceOrder(plannedRows, precedenceRows) {
  const stylesheetRows = plannedRows.filter(
    (row) => row.placementKind === 'stylesheet-precedence'
  );
  return freezeRecord({
    targetKind: 'document-head',
    hostTag: 'head',
    orderKind:
      'react-19.2.6-stylesheet-precedence-order-diagnostic',
    rowCount: stylesheetRows.length,
    rows: freezeArray(
      stylesheetRows.map((row, index) =>
        freezeRecord({
          rowId: `planned-stylesheet-${index}`,
          sourcePlannedHeadRowId: row.sourceDedupeRowId,
          plannedStylesheetIndex: index,
          plannedHeadOrderIndex: row.headOrderIndex,
          inputIndex: row.inputIndex,
          sourceAdapterAdmissionId: row.sourceAdapterAdmissionId,
          contractId: row.contractId,
          resourceStage: row.resourceStage,
          resourceKind: row.resourceKind,
          resourceKey: row.resourceKey,
          precedenceKey: row.precedenceKey,
          precedenceIndex: getStylesheetPrecedenceIndex(
            precedenceRows,
            row.precedenceKey
          ),
          elementTag: row.elementTag,
          relationship: row.relationship,
          placementKind: row.placementKind,
          insertionMethod: row.insertionMethod,
          insertionApplied: false,
          rawValuesRetained: false,
          compatibilityClaimed: false
        })
      )
    ),
    fakeHeadMutated: false,
    realHeadMutated: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function getStylesheetPrecedenceIndex(precedenceRows, precedenceKey) {
  const key = precedenceKey || 'default-precedence';
  const row = precedenceRows.find(
    (precedenceRow) => precedenceRow.precedenceKey === key
  );
  return row ? row.precedenceIndex : null;
}

function createObservedStylesheetPrecedenceFakeHeadOrder(
  fakeDocument,
  fakeHead
) {
  const rows = freezeArray(
    fakeHead.childNodes.map((node, index) =>
      createObservedStylesheetPrecedenceFakeHeadRow(
        node,
        index,
        fakeDocument
      )
    )
  );
  const stylesheetRows = freezeArray(
    rows.filter((row) => row.stylesheetPrecedenceCandidate === true)
  );

  return freezeRecord({
    targetKind: 'document-head',
    hostTag: 'head',
    rowCount: rows.length,
    stylesheetRowCount: stylesheetRows.length,
    rows,
    stylesheetRows,
    fakeHeadRead: true,
    fakeHeadMutated: false,
    realHeadMutated: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createObservedStylesheetPrecedenceFakeHeadRow(
  node,
  childIndex,
  fakeDocument
) {
  const nodeName =
    node != null && typeof node.nodeName === 'string'
      ? node.nodeName.toUpperCase()
      : 'UNKNOWN';
  const relationship = getFakeHeadNodeRelationship(node);
  const markedHoistable =
    node != null &&
    typeof node === 'object' &&
    node.__fastReactFakeHoistable === true;
  const retainReason = getFakeHeadRetainReason(
    nodeName,
    relationship,
    markedHoistable
  );
  const stylesheetPrecedenceCandidate =
    ((nodeName === 'LINK' && relationship === 'stylesheet') ||
      nodeName === 'STYLE')
      ? hasFakeHeadNodeAttribute(node, 'data-precedence')
      : false;
  const precedenceKey = getOptionalOpaqueFakeHeadAttributeForStylesheet(
    node,
    'data-fast-react-precedence-key'
  );

  return freezeRecord({
    rowId: `stylesheet-observed-head-child-${childIndex}`,
    rowType: 'head-child',
    childIndex,
    nodeName,
    relationship,
    resourceKind: getObservedFakeHeadResourceKind(nodeName, relationship),
    resourceKey: getOptionalOpaqueFakeHeadAttributeForStylesheet(
      node,
      'data-fast-react-resource-key'
    ),
    precedenceKey,
    deterministicFakeResourceElement:
      node != null &&
      typeof node === 'object' &&
      node.__fastReactFakeResourceElement === true &&
      node.ownerDocument === fakeDocument,
    markedHoistable,
    retainReason,
    clearRetainDecision: retainReason === null ? 'clear' : 'retain',
    stylesheetPrecedenceCandidate,
    orderObserved: true,
    orderMutated: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function getOptionalOpaqueFakeHeadAttributeForStylesheet(
  node,
  attributeName
) {
  const value = getFakeHeadNodeAttribute(node, attributeName);
  if (value === undefined) {
    return null;
  }
  if (
    typeof value === 'string' &&
    /^[a-z][a-z0-9-]*$/u.test(value)
  ) {
    return value;
  }

  throwInvalidResourceHintStylesheetPrecedenceAdmission(
    `${attributeName} must be an opaque lowercase diagnostic token`
  );
}

function createHeadSingletonStylesheetOrderRows(
  headRequest,
  order,
  observedRows
) {
  return freezeArray(
    observedRows.map((row) =>
      freezeRecord({
        rowId: `head-singleton-stylesheet-order-${row.childIndex}`,
        rowType: 'head-child',
        sourceHeadRequestId: headRequest.requestId,
        sourceOrderDiagnosticId: order.orderDiagnosticId,
        childIndex: row.childIndex,
        nodeName: row.nodeName,
        relationship: row.relationship,
        resourceKind: row.resourceKind,
        resourceKey: row.resourceKey,
        precedenceKey: row.precedenceKey,
        stylesheetPrecedenceCandidate:
          row.stylesheetPrecedenceCandidate,
        clearRetainDecision: row.clearRetainDecision,
        retainReason: row.retainReason,
        headSingletonResolved: false,
        headChildrenCleared: false,
        singletonOrderingApplied: false,
        orderObserved: true,
        orderMutated: false,
        rawValuesRetained: false,
        compatibilityClaimed: false
      })
    )
  );
}

function createHeadSingletonStylesheetOrderBoundary(
  headRequest,
  order,
  plannedRows,
  orderRows
) {
  const retainedRows = orderRows.filter(
    (row) => row.clearRetainDecision === 'retain'
  );
  const clearableRows = orderRows.filter(
    (row) => row.clearRetainDecision === 'clear'
  );
  const stylesheetRows = orderRows.filter(
    (row) => row.stylesheetPrecedenceCandidate === true
  );

  return freezeRecord({
    rowId: 'head-singleton-stylesheet-order',
    rowType: 'host-singleton',
    hostTag: 'head',
    sourceHeadRequestId: headRequest.requestId,
    sourceOrderDiagnosticId: order.orderDiagnosticId,
    headContractId: headRequest.contractId,
    plannedStylesheetRowCount: plannedRows.length,
    observedStylesheetRowCount: stylesheetRows.length,
    retainedChildCount: retainedRows.length,
    clearableChildCount: clearableRows.length,
    clearHeadWouldRun: true,
    clearHeadWouldRetainStylesheets: true,
    releaseSingletonWouldRun: true,
    headSingletonResolved: false,
    headSingletonAcquired: false,
    headSingletonReleased: false,
    headChildrenCleared: false,
    singletonOrderingApplied: false,
    publicHeadSingletonBehavior: false,
    rawValuesRetained: false,
    compatibilityClaimed: false,
    blockedCapabilities: resourceHintStylesheetPrecedenceBlockedCapabilities
  });
}

function createStylesheetPrecedenceResourceMapPlan(stylesheetDedupeRows) {
  const uniqueResourceKeys = new Set(
    stylesheetDedupeRows.map((row) => row.resourceKey)
  );
  return freezeRecord({
    resourceMapKind:
      'react-19.2.6-stylesheet-precedence-resource-map-diagnostic',
    stylesheetResourceMapCreated: false,
    stylesheetResourceMapMutated: false,
    inputRowCount: stylesheetDedupeRows.length,
    uniqueStylesheetResourceCount: uniqueResourceKeys.size,
    preloadStyleResourceCount: stylesheetDedupeRows.filter(
      (row) => row.resourceStage === 'preload'
    ).length,
    preinitStyleResourceCount: stylesheetDedupeRows.filter(
      (row) => row.resourceStage === 'preinit'
    ).length,
    dedupedStyleRowCount: stylesheetDedupeRows.filter(
      (row) => row.wouldInsertIntoHead === false
    ).length,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createResourceHintStylesheetPrecedenceSourceOrder(order) {
  return freezeRecord({
    orderDiagnosticId: order.orderDiagnosticId,
    orderDiagnosticSequence: order.orderDiagnosticSequence,
    orderStatus: order.orderStatus,
    executionStatus: order.executionStatus,
    compatibilityStatus: order.compatibilityStatus,
    sourceAdapterAdmissionIds: order.sourceAdapterAdmissionIds,
    acceptedContractIds: order.acceptedContractIds,
    dedupeRowCount: order.dedupeRows.length,
    plannedHeadRowCount: order.plannedHeadInsertionOrder.rowCount,
    observedHeadRowCount: order.observedHeadOrder.rowCount,
    stylesheetPrecedenceRowsObserved:
      order.stylesheetPrecedenceBoundary.stylesheetPrecedenceRowsObserved,
    publicResourceHintDomInsertion:
      order.publicResourceBoundary.publicResourceHintCallsReachable,
    compatibilityClaimed: false
  });
}

function createResourceHintStylesheetPrecedenceSourceHeadRequest(headRequest) {
  return freezeRecord({
    requestId: headRequest.requestId,
    requestSequence: headRequest.requestSequence,
    requestType: headRequest.requestType,
    behaviorArea: headRequest.behaviorArea,
    contractId: headRequest.contractId,
    hostTag: headRequest.hostTag,
    status: headRequest.status,
    singletonsResolved: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function normalizeResourceHintResourceMapCommitAdmission(diagnostic) {
  if (diagnostic == null || typeof diagnostic !== 'object') {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'resource-map commit admission metadata must be an object'
    );
  }

  if (diagnostic.explicitResourceMapCommitDiagnostic !== true) {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'explicitResourceMapCommitDiagnostic must be true'
    );
  }

  const commitKind = getAdmissionStringProperty(
    diagnostic,
    'commitKind',
    'deterministic-private-resource-map-commit'
  );
  if (commitKind !== 'deterministic-private-resource-map-commit') {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'commitKind must be deterministic-private-resource-map-commit'
    );
  }

  const targetKind = getAdmissionStringProperty(
    diagnostic,
    'targetKind',
    'document-head'
  );
  if (targetKind !== 'document-head') {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'targetKind must be document-head'
    );
  }

  const hostTag = getAdmissionStringProperty(diagnostic, 'hostTag', 'head');
  if (hostTag !== 'head') {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'hostTag must be head'
    );
  }

  assertNoResourceMapCommitTargets(diagnostic);
  assertNoPublicResourceDispatchClaims(
    diagnostic,
    throwInvalidResourceHintResourceMapCommitAdmission,
    'resource-map commit gate'
  );

  return freezeRecord({
    commitKind,
    commitId: getAdmissionStringProperty(
      diagnostic,
      'commitId',
      'anonymous-private-resource-map-commit'
    ),
    targetKind,
    hostTag,
    explicitResourceMapCommitDiagnostic: true,
    deterministicPrivateRecordsOnly: true,
    rawDocumentCaptured: false,
    rawHeadCaptured: false,
    rawResourceMapCaptured: false,
    rawElementCaptured: false,
    rawValuesRetained: false,
    realResourceMapCreationAllowed: false,
    realResourceMapMutationAllowed: false,
    fakeResourceMapCreationAllowed: false,
    fakeResourceMapMutationAllowed: false,
    privateResourceMapRecordCreationAllowed: true,
    privateResourceMapRecordMutationAllowed: false,
    singletonOwnershipAllowed: false,
    fetchOrPreloadAllowed: false,
    loadStateMutationAllowed: false,
    publicResourceHintDomInsertion: false,
    publicResourceMapCommitBehavior: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function assertNoResourceMapCommitTargets(diagnostic) {
  const blockedTargetFields = [
    'document',
    'fakeDocument',
    'head',
    'fakeHead',
    'resourceRoot',
    'resourceMap',
    'realResourceMap',
    'fakeResourceMap',
    'stylesheetMap',
    'scriptMap',
    'preloadMap',
    'preloadPropsMap'
  ];

  for (const field of blockedTargetFields) {
    if (hasOwnProp(diagnostic, field)) {
      throwInvalidResourceHintResourceMapCommitAdmission(
        `${field} must not be passed to the resource-map commit gate`
      );
    }
  }
}


function normalizeResourceHintStylesheetLoadErrorStateAdmission(diagnostic) {
  if (diagnostic == null || typeof diagnostic !== 'object') {
    throwInvalidResourceHintStylesheetLoadErrorStateAdmission(
      'stylesheet load/error state admission metadata must be an object'
    );
  }

  if (diagnostic.explicitStylesheetLoadErrorStateDiagnostic !== true) {
    throwInvalidResourceHintStylesheetLoadErrorStateAdmission(
      'explicitStylesheetLoadErrorStateDiagnostic must be true'
    );
  }

  assertNoRawStylesheetLoadErrorStateFields(diagnostic);
  assertNoPublicResourceDispatchClaims(
    diagnostic,
    throwInvalidResourceHintStylesheetLoadErrorStateAdmission,
    'stylesheet load/error state metadata gate'
  );

  const stateKind = getAdmissionStringProperty(
    diagnostic,
    'stateKind',
    'deterministic-fake-stylesheet-load-error-state'
  );
  if (stateKind !== 'deterministic-fake-stylesheet-load-error-state') {
    throwInvalidResourceHintStylesheetLoadErrorStateAdmission(
      'stateKind must be deterministic-fake-stylesheet-load-error-state'
    );
  }

  const targetKind = getAdmissionStringProperty(
    diagnostic,
    'targetKind',
    'stylesheet-resource-state'
  );
  if (targetKind !== 'stylesheet-resource-state') {
    throwInvalidResourceHintStylesheetLoadErrorStateAdmission(
      'targetKind must be stylesheet-resource-state'
    );
  }

  return freezeRecord({
    stateKind,
    stateId: getAdmissionStringProperty(
      diagnostic,
      'stateId',
      'anonymous-fake-stylesheet-load-error-state'
    ),
    targetKind,
    explicitStylesheetLoadErrorStateDiagnostic: true,
    deterministicFakeRecordsOnly: true,
    rawDocumentCaptured: false,
    rawHeadCaptured: false,
    rawElementCaptured: false,
    rawPreloadCaptured: false,
    rawPromiseCaptured: false,
    rawValuesRetained: false,
    loadListenerInstallationAllowed: false,
    errorListenerInstallationAllowed: false,
    promiseCreationAllowed: false,
    resourceFetchAllowed: false,
    commitSuspensionAllowed: false,
    realTimerAllowed: false,
    publicResourceHintDomInsertion: false,
    publicStylesheetResourceBehavior: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function assertNoRawStylesheetLoadErrorStateFields(diagnostic) {
  for (const field of [
    'document',
    'head',
    'element',
    'instance',
    'link',
    'node',
    'preload',
    'promise',
    'thenable',
    'loadEvent',
    'errorEvent',
    'timer',
    'timeout',
    'onLoad',
    'onError'
  ]) {
    if (hasOwnProp(diagnostic, field)) {
      throwInvalidResourceHintStylesheetLoadErrorStateAdmission(
        `${field} must not be passed to the metadata gate`
      );
    }
  }
}

function assertNoPublicResourceDispatchClaims(
  diagnostic,
  throwInvalid,
  gateName
) {
  for (const field of [
    'publicResourceHintDomInsertion',
    'publicResourceMapCommitBehavior',
    'publicStylesheetResourceBehavior',
    'publicStylesheetLoadStateDispatch',
    'publicStylesheetPrecedenceBehavior',
    'publicScriptModuleResourceDispatch',
    'publicResourceApisReachable',
    'compatibilityClaimed'
  ]) {
    if (diagnostic[field] === true) {
      throwInvalid(
        `${field} must not claim public resource dispatch in the ${gateName}`
      );
    }
  }
}

function createResourceHintStylesheetLoadErrorStatePlan(stylesheetPrecedence) {
  const resourceStates = collectStylesheetLoadErrorResourceStates(
    stylesheetPrecedence
  );
  const resourceStateRows =
    createStylesheetLoadErrorResourceStateRows(resourceStates);
  const loadingStateRows =
    createStylesheetLoadErrorLoadingStateRows(resourceStateRows);
  const preloadStateRows =
    createStylesheetLoadErrorPreloadStateRows(resourceStateRows);
  const commitSuspensionRows =
    createStylesheetLoadErrorCommitSuspensionRows(resourceStateRows);

  return freezeRecord({
    loadingStateBits: createStylesheetLoadingStateBitRows(),
    resourceStateRows,
    loadingStateRows,
    preloadStateRows,
    commitSuspensionRows,
    suspendedCommitBoundary:
      createStylesheetLoadErrorSuspendedCommitBoundary(
        resourceStateRows,
        commitSuspensionRows
      )
  });
}

function collectStylesheetLoadErrorResourceStates(stylesheetPrecedence) {
  const stateByResourceKey = new Map();
  for (const row of stylesheetPrecedence.stylesheetDedupeRows) {
    let state = stateByResourceKey.get(row.resourceKey);
    if (state === undefined) {
      state = {
        resourceKey: row.resourceKey,
        opaqueResourceKey: row.opaqueResourceKey,
        precedenceKey: row.precedenceKey,
        dedupeRows: [],
        plannedRows: [],
        observedRows: []
      };
      stateByResourceKey.set(row.resourceKey, state);
    }
    state.dedupeRows.push(row);
    if (state.precedenceKey === null && row.precedenceKey !== null) {
      state.precedenceKey = row.precedenceKey;
    }
  }

  for (const row of stylesheetPrecedence.plannedStylesheetOrder.rows) {
    const state = stateByResourceKey.get(row.resourceKey);
    if (state !== undefined) {
      state.plannedRows.push(row);
      if (state.precedenceKey === null && row.precedenceKey !== null) {
        state.precedenceKey = row.precedenceKey;
      }
    }
  }

  for (const row of stylesheetPrecedence.observedStylesheetOrder.stylesheetRows) {
    if (row.resourceKey !== null) {
      const resourceKey = `style:${row.resourceKey}`;
      const state = stateByResourceKey.get(resourceKey);
      if (state !== undefined) {
        state.observedRows.push(row);
        if (state.precedenceKey === null && row.precedenceKey !== null) {
          state.precedenceKey = row.precedenceKey;
        }
      }
    }
  }

  return freezeArray(Array.from(stateByResourceKey.values()));
}

function createStylesheetLoadErrorResourceStateRows(resourceStates) {
  return freezeArray(
    resourceStates.map((state, index) => {
      const preloadRows = state.dedupeRows.filter(
        (row) => row.resourceStage === 'preload'
      );
      const preinitRows = state.dedupeRows.filter(
        (row) => row.resourceStage === 'preinit'
      );
      return freezeRecord({
        rowId: `stylesheet-resource-state-${index}`,
        rowType: 'stylesheet-resource-state',
        resourceIndex: index,
        resourceKey: state.resourceKey,
        opaqueResourceKey: state.opaqueResourceKey,
        precedenceKey: state.precedenceKey,
        sourceStylesheetDedupeRowIds: freezeArray(
          state.dedupeRows.map((row) => row.rowId)
        ),
        sourceAdapterAdmissionIds: freezeArray(
          state.dedupeRows.map((row) => row.sourceAdapterAdmissionId)
        ),
        plannedStylesheetRowIds: freezeArray(
          state.plannedRows.map((row) => row.rowId)
        ),
        observedStylesheetRowIds: freezeArray(
          state.observedRows.map((row) => row.rowId)
        ),
        reactResourceShape: createStylesheetResourceShapeRecord(
          preloadRows,
          preinitRows
        ),
        stateShape: createStylesheetStateShapeRecord(preloadRows),
        preloadSeenBefore: preloadRows.length > 0,
        preinitSeenBefore: preinitRows.length > 0,
        plannedInsertionCount: state.plannedRows.length,
        observedStylesheetCount: state.observedRows.length,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false,
        resourceFetchStarted: false,
        commitSuspensionAllowed: false,
        rawValuesRetained: false,
        compatibilityClaimed: false
      });
    })
  );
}

function createStylesheetResourceShapeRecord(preloadRows, preinitRows) {
  return freezeRecord({
    type: 'stylesheet',
    instance: null,
    instanceCaptured: false,
    instanceWouldBeLinkElement: true,
    count: preinitRows.length > 0 ? 1 : 0,
    countSource:
      preinitRows.length > 0
        ? 'preinit-style-resource-count'
        : 'host-hoistable-resource-count-before-acquire',
    state: createStylesheetStateShapeRecord(preloadRows),
    resourceMapCreated: false,
    resourceMapMutated: false,
    rawInstanceCaptured: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createStylesheetStateShapeRecord(preloadRows) {
  return freezeRecord({
    loading: stylesheetLoadingStateBits.NotLoaded,
    loadingState: createStylesheetLoadingStateSnapshot(
      'not-loaded',
      stylesheetLoadingStateBits.NotLoaded
    ),
    preload: null,
    preloadWouldBeTracked: preloadRows.length > 0,
    preloadElementCaptured: false,
    loadListenerInstalled: false,
    errorListenerInstalled: false,
    promiseCreated: false,
    fetchStarted: false,
    compatibilityClaimed: false
  });
}

function createStylesheetLoadErrorLoadingStateRows(resourceStateRows) {
  return freezeArray(
    resourceStateRows.flatMap((row) =>
      [
        ['not-loaded', stylesheetLoadingStateBits.NotLoaded],
        ['loaded', stylesheetLoadingStateBits.Loaded],
        ['errored', stylesheetLoadingStateBits.Errored],
        ['inserted-not-settled', stylesheetLoadingStateBits.Inserted],
        [
          'inserted-loaded',
          stylesheetLoadingStateBits.Inserted |
            stylesheetLoadingStateBits.Loaded
        ],
        [
          'inserted-errored',
          stylesheetLoadingStateBits.Inserted |
            stylesheetLoadingStateBits.Errored
        ]
      ].map(([label, bitmask]) =>
        createStylesheetLoadErrorLoadingStateRow(row, label, bitmask)
      )
    )
  );
}

function createStylesheetLoadErrorLoadingStateRow(resourceRow, label, bitmask) {
  const snapshot = createStylesheetLoadingStateSnapshot(label, bitmask);
  return freezeRecord({
    rowId: `${resourceRow.rowId}-${label}`,
    rowType: 'stylesheet-loading-state',
    sourceResourceStateRowId: resourceRow.rowId,
    resourceKey: resourceRow.resourceKey,
    label,
    bitmask,
    snapshot,
    loadedBitWouldBeSetByLoadListener: snapshot.loaded,
    erroredBitWouldBeSetByErrorListener: snapshot.errored,
    insertedBitWouldBeSetByInsertion: snapshot.inserted,
    loadListenerInstalled: false,
    errorListenerInstalled: false,
    loadingPromiseCreated: false,
    loadingPromiseSettled: false,
    rawEventCaptured: false,
    compatibilityClaimed: false
  });
}

function createStylesheetLoadErrorPreloadStateRows(resourceStateRows) {
  return freezeArray(
    resourceStateRows.map((row) =>
      freezeRecord({
        rowId: `stylesheet-preload-state-${row.resourceIndex}`,
        rowType: 'stylesheet-preload-state',
        sourceResourceStateRowId: row.rowId,
        resourceKey: row.resourceKey,
        statePreloadField: null,
        preloadWouldBeTracked: row.preloadSeenBefore,
        preloadElementCaptured: false,
        preloadLoadListenerInstalled: false,
        preloadErrorListenerInstalled: false,
        preloadFetchStarted: false,
        preloadLoadingBitWouldSetLoaded: row.preloadSeenBefore,
        preloadLoadingBitWouldSetErrored: row.preloadSeenBefore,
        rawPreloadCaptured: false,
        compatibilityClaimed: false
      })
    )
  );
}

function createStylesheetLoadErrorCommitSuspensionRows(resourceStateRows) {
  return freezeArray(
    resourceStateRows.map((row) =>
      freezeRecord({
        rowId: `stylesheet-commit-suspension-${row.resourceIndex}`,
        rowType: 'stylesheet-commit-suspension',
        sourceResourceStateRowId: row.rowId,
        resourceKey: row.resourceKey,
        mayResourceSuspendCommitWouldCheckInserted: true,
        maySuspendCommitIfNotInserted: row.plannedInsertionCount > 0,
        preloadResourceWouldCheckSettled: true,
        preloadResourceWouldReturnReadyForNotLoaded: false,
        suspendResourceWouldCreateStylesheetMap:
          row.plannedInsertionCount > 0,
        stylesheetsMapCreated: false,
        suspendedStateCountIncremented: false,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        timerScheduled: false,
        unsuspendCallbackRegistered: false,
        insertSuspendedStylesheetsCalled: false,
        commitSuspended: false,
        compatibilityClaimed: false
      })
    )
  );
}

function createStylesheetLoadErrorSuspendedCommitBoundary(
  resourceStateRows,
  commitSuspensionRows
) {
  return freezeRecord({
    rowId: 'stylesheet-suspended-commit-boundary',
    rowType: 'suspended-commit-state',
    stateShape: freezeRecord({
      stylesheets: null,
      count: 0,
      unsuspend: null
    }),
    stylesheetResourceCount: resourceStateRows.length,
    wouldSuspendResourceCount: commitSuspensionRows.filter(
      (row) => row.maySuspendCommitIfNotInserted
    ).length,
    stylesheetsMapCreated: false,
    countIncremented: false,
    realTimerScheduled: false,
    unsuspendCallbackRegistered: false,
    suspendedCommitStarted: false,
    suspendedCommitResolved: false,
    compatibilityClaimed: false,
    blockedCapabilities:
      resourceHintStylesheetLoadErrorStateBlockedCapabilities
  });
}

function createStylesheetLoadingStateBitRows() {
  return freezeArray([
    stylesheetLoadingStateBitRow(
      'NotLoaded',
      stylesheetLoadingStateBits.NotLoaded
    ),
    stylesheetLoadingStateBitRow(
      'Loaded',
      stylesheetLoadingStateBits.Loaded
    ),
    stylesheetLoadingStateBitRow(
      'Errored',
      stylesheetLoadingStateBits.Errored
    ),
    stylesheetLoadingStateBitRow(
      'Settled',
      stylesheetLoadingStateBits.Settled
    ),
    stylesheetLoadingStateBitRow(
      'Inserted',
      stylesheetLoadingStateBits.Inserted
    )
  ]);
}

function stylesheetLoadingStateBitRow(name, bitmask) {
  return freezeRecord({
    name,
    bitmask,
    loaded: (bitmask & stylesheetLoadingStateBits.Loaded) !== 0,
    errored: (bitmask & stylesheetLoadingStateBits.Errored) !== 0,
    settled:
      bitmask === stylesheetLoadingStateBits.Settled ||
      (bitmask & stylesheetLoadingStateBits.Settled) !== 0,
    inserted: (bitmask & stylesheetLoadingStateBits.Inserted) !== 0,
    compatibilityClaimed: false
  });
}

function createStylesheetLoadingStateSnapshot(label, bitmask) {
  return freezeRecord({
    label,
    bitmask,
    notLoaded: bitmask === stylesheetLoadingStateBits.NotLoaded,
    loaded: (bitmask & stylesheetLoadingStateBits.Loaded) !== 0,
    errored: (bitmask & stylesheetLoadingStateBits.Errored) !== 0,
    settled: (bitmask & stylesheetLoadingStateBits.Settled) !== 0,
    inserted: (bitmask & stylesheetLoadingStateBits.Inserted) !== 0,
    loadListenerInstalled: false,
    errorListenerInstalled: false,
    promiseCreated: false,
    eventDispatched: false,
    compatibilityClaimed: false
  });
}

function createResourceHintStylesheetLoadErrorStateSourcePrecedence(
  stylesheetPrecedence
) {
  return freezeRecord({
    stylesheetPrecedenceId:
      stylesheetPrecedence.stylesheetPrecedenceId,
    stylesheetPrecedenceSequence:
      stylesheetPrecedence.stylesheetPrecedenceSequence,
    stylesheetPrecedenceStatus:
      stylesheetPrecedence.stylesheetPrecedenceStatus,
    executionStatus: stylesheetPrecedence.executionStatus,
    compatibilityStatus: stylesheetPrecedence.compatibilityStatus,
    sourceOrderDiagnosticId:
      stylesheetPrecedence.sourceOrderDiagnosticId,
    sourceHeadRequestId: stylesheetPrecedence.sourceHeadRequestId,
    stylesheetDedupeRowCount:
      stylesheetPrecedence.stylesheetDedupeRows.length,
    plannedStylesheetRowCount:
      stylesheetPrecedence.plannedStylesheetOrder.rowCount,
    observedStylesheetRowCount:
      stylesheetPrecedence.observedStylesheetOrder.stylesheetRowCount,
    stylesheetResourceMapCreated:
      stylesheetPrecedence.stylesheetResourceMapPlan
        .stylesheetResourceMapCreated,
    stylesheetResourceMapMutated:
      stylesheetPrecedence.stylesheetResourceMapPlan
        .stylesheetResourceMapMutated,
    publicResourceHintDomInsertion:
      stylesheetPrecedence.publicResourceBoundary
        .publicResourceHintCallsReachable,
    compatibilityClaimed: false
  });
}

function getAdmissionStringProperty(record, key, fallback) {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function normalizeFormActionResetDispatcherIntent(contract, intent) {
  if (intent == null || typeof intent !== 'object') {
    throwInvalidFormActionResetDispatcherIntent(
      contract,
      'intent metadata must be an object'
    );
  }

  if (diagnostic.explicitResourceMapCommitDiagnostic !== true) {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'explicitResourceMapCommitDiagnostic must be true'
    );
  }

  const commitKind = getAdmissionStringProperty(
    diagnostic,
    'commitKind',
    'deterministic-private-resource-map-commit'
  );
  if (commitKind !== 'deterministic-private-resource-map-commit') {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'commitKind must be deterministic-private-resource-map-commit'
    );
  }

  const targetKind = getAdmissionStringProperty(
    diagnostic,
    'targetKind',
    'document-head'
  );
  if (targetKind !== 'document-head') {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'targetKind must be document-head'
    );
  }

  const hostTag = getAdmissionStringProperty(diagnostic, 'hostTag', 'head');
  if (hostTag !== 'head') {
    throwInvalidResourceHintResourceMapCommitAdmission(
      'hostTag must be head'
    );
  }

  assertNoResourceMapCommitTargets(diagnostic);

  return freezeRecord({
    commitKind,
    commitId: getAdmissionStringProperty(
      diagnostic,
      'commitId',
      'anonymous-private-resource-map-commit'
    ),
    targetKind,
    hostTag,
    explicitResourceMapCommitDiagnostic: true,
    deterministicPrivateRecordsOnly: true,
    rawDocumentCaptured: false,
    rawHeadCaptured: false,
    rawResourceMapCaptured: false,
    rawElementCaptured: false,
    rawValuesRetained: false,
    realResourceMapCreationAllowed: false,
    realResourceMapMutationAllowed: false,
    fakeResourceMapCreationAllowed: false,
    fakeResourceMapMutationAllowed: false,
    privateResourceMapRecordCreationAllowed: true,
    privateResourceMapRecordMutationAllowed: false,
    singletonOwnershipAllowed: false,
    fetchOrPreloadAllowed: false,
    loadStateMutationAllowed: false,
    publicResourceHintDomInsertion: false,
    publicResourceMapCommitBehavior: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function assertNoResourceMapCommitTargets(diagnostic) {
  const blockedTargetFields = [
    'document',
    'fakeDocument',
    'head',
    'fakeHead',
    'resourceRoot',
    'resourceMap',
    'realResourceMap',
    'fakeResourceMap',
    'stylesheetMap',
    'scriptMap',
    'preloadMap',
    'preloadPropsMap'
  ];

  for (const field of blockedTargetFields) {
    if (hasOwnProp(diagnostic, field)) {
      throwInvalidResourceHintResourceMapCommitAdmission(
        `${field} must not be passed to the resource-map commit gate`
      );
    }
  }
}

function createResourceHintResourceMapCommitPlan(
  order,
  stylesheetPrecedence,
  stylesheetLoadErrorState
) {
  const privateResourceMapRecords = freezeArray(
    order.dedupeRows
      .map((row, index) =>
        createPrivateResourceMapCommitRecord(
          row,
          index,
          stylesheetPrecedence
        )
      )
      .filter((row) => row !== null)
  );
  const resourceMapConflictBoundary =
    createResourceMapCommitConflictBoundary(privateResourceMapRecords);
  const moduleResourceMapOrder =
    createResourceMapCommitModuleResourceOrder(privateResourceMapRecords);
  const scriptModuleFakeDomCommitExecution =
    createResourceMapCommitScriptModuleFakeDomExecution(
      moduleResourceMapOrder
    );
  const stylesheetLoadStateCommitOrder =
    createResourceMapCommitStylesheetLoadStateOrder(
      privateResourceMapRecords,
      stylesheetLoadErrorState
    );
  const stylesheetResourceMapRecords = freezeArray(
    privateResourceMapRecords.filter((row) => row.recordKind === 'stylesheet')
  );
  const preloadResourceMapRecords = freezeArray(
    privateResourceMapRecords.filter((row) => row.recordKind === 'preload')
  );
  const scriptResourceMapRecords = freezeArray(
    privateResourceMapRecords.filter((row) => row.recordKind === 'script')
  );

  return freezeRecord({
    acceptedContractIds: freezeArray(
      uniqueStrings(privateResourceMapRecords.map((row) => row.contractId))
    ),
    resourceMapCommitPlan:
      createResourceMapCommitPlanSummary(
        privateResourceMapRecords,
        moduleResourceMapOrder,
        scriptModuleFakeDomCommitExecution,
        resourceMapConflictBoundary,
        stylesheetLoadStateCommitOrder
      ),
    privateResourceMapRecords,
    stylesheetResourceMapRecords,
    preloadResourceMapRecords,
    scriptResourceMapRecords,
    moduleResourceMapOrder,
    scriptModuleFakeDomCommitExecution,
    stylesheetLoadStateCommitOrder,
    resourceMapConflictBoundary,
    stylesheetPrecedenceBoundary:
      createResourceMapCommitStylesheetPrecedenceBoundary(
        stylesheetPrecedence
      )
  });
}

function createPrivateResourceMapCommitRecord(
  row,
  index,
  stylesheetPrecedence
) {
  const recordKind = getResourceMapCommitRecordKind(row);
  if (recordKind === null) {
    return null;
  }

  const stylesheetRow =
    recordKind === 'stylesheet'
      ? findStylesheetDedupeRowForResourceMapCommit(
          stylesheetPrecedence,
          row
        )
      : null;

  return freezeRecord({
    rowId: `resource-map-commit-${index}`,
    rowType: 'resource-map-commit',
    resourceMapOrderIndex: index,
    recordKind,
    mapKind: getResourceMapCommitMapKind(recordKind),
    sourceDedupeRowId: row.rowId,
    sourceStylesheetDedupeRowId:
      stylesheetRow === null ? null : stylesheetRow.rowId,
    inputIndex: row.inputIndex,
    sourceAdapterAdmissionId: row.sourceAdapterAdmissionId,
    sourceRequestId: row.sourceRequestId,
    sourceRequestType: row.sourceRequestType,
    contractId: row.contractId,
    privateDispatcherKey: row.privateDispatcherKey,
    publicName: row.publicName,
    resourceStage: row.resourceStage,
    resourceKind: row.resourceKind,
    scriptKind: getScriptModulePreinitRowScriptKind(row),
    modulePreload: row.contractId === 'preload-module',
    moduleScript: row.contractId === 'preinit-module-script',
    classicScriptPreinit: row.contractId === 'preinit-script',
    resourceKey: row.resourceKey,
    dedupeKey: row.resourceKey,
    resourceMapDedupeKey:
      `${getResourceMapCommitMapKind(recordKind)}:${row.resourceKey}`,
    opaqueResourceKey: row.opaqueResourceKey,
    precedenceKey: row.precedenceKey,
    relationship: row.relationship,
    dedupeAction: row.dedupeAction,
    dedupeMatched: row.dedupeMatched,
    matchedSourceAdapterAdmissionId: row.matchedSourceAdapterAdmissionId,
    preloadSeenBefore: row.preloadSeenBefore,
    preinitSeenBefore: row.preinitSeenBefore,
    wouldInsertIntoHead: row.wouldInsertIntoHead,
    privateRecordCreated: true,
    privateRecordMutated: false,
    realResourceMapCreated: false,
    realResourceMapMutated: false,
    fakeResourceMapCreated: false,
    fakeResourceMapMutated: false,
    preloadPropsAdopted: false,
    stylesheetPrecedenceApplied: false,
    singletonOwnershipClaimed: false,
    resourceCountIncremented: false,
    resourceInstanceCreated: false,
    hostNodeInserted: false,
    fetchStarted: false,
    preloadStarted: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    loadEventSubscribed: false,
    loadingStateMutated: false,
    publicResourceDispatchBlocked: true,
    publicScriptModuleResourceDispatch: false,
    rawResourceKeyRetained: false,
    rawPrecedenceValueRetained: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function findStylesheetDedupeRowForResourceMapCommit(
  stylesheetPrecedence,
  row
) {
  const stylesheetRow = stylesheetPrecedence.stylesheetDedupeRows.find(
    (candidate) => candidate.sourceDedupeRowId === row.rowId
  );
  return stylesheetRow || null;
}

function getResourceMapCommitRecordKind(row) {
  if (row.contractId === 'preinit-style') {
    return 'stylesheet';
  }
  if (
    row.contractId === 'preinit-script' ||
    row.contractId === 'preinit-module-script'
  ) {
    return 'script';
  }
  if (row.contractId === 'preload' || row.contractId === 'preload-module') {
    return 'preload';
  }
  return null;
}

function getResourceMapCommitMapKind(recordKind) {
  if (recordKind === 'stylesheet') {
    return 'hoistable-styles';
  }
  if (recordKind === 'script') {
    return 'hoistable-scripts';
  }
  return 'preload-props';
}

function createResourceMapCommitConflictBoundary(privateResourceMapRecords) {
  assertWellFormedResourceMapCommitModuleRows(privateResourceMapRecords);
  const stylesheetPrecedenceValidation =
    assertNoDuplicateStylesheetPrecedenceResourceMapRows(
      privateResourceMapRecords
    );

  const stateByMapDedupeKey = new Map();
  for (const row of privateResourceMapRecords) {
    if (!isResourceMapCommitScriptOrderRecord(row)) {
      continue;
    }

    const signature = getResourceMapCommitConflictSignature(row);
    const existingState = stateByMapDedupeKey.get(row.resourceMapDedupeKey);
    if (
      existingState !== undefined &&
      existingState.signature !== signature
    ) {
      throwInvalidResourceHintResourceMapCommitAdmission(
        `duplicate conflicting resource-map records for ${row.resourceMapDedupeKey}`
      );
    }

    if (existingState === undefined) {
      stateByMapDedupeKey.set(row.resourceMapDedupeKey, {
        signature,
        rowCount: 1
      });
    } else {
      existingState.rowCount++;
    }
  }

  return freezeRecord({
    status: 'validated-private-resource-map-commit-record-conflicts',
    checkedRecordCount: privateResourceMapRecords.length,
    checkedScriptModuleRecordCount:
      Array.from(stateByMapDedupeKey.values()).reduce(
        (count, state) => count + state.rowCount,
        0
      ),
    checkedDedupeKeyCount: stateByMapDedupeKey.size,
    checkedStylesheetPrecedenceRecordCount:
      stylesheetPrecedenceValidation.checkedRecordCount,
    checkedStylesheetPrecedenceKeyCount:
      stylesheetPrecedenceValidation.checkedDedupeKeyCount,
    malformedModuleRowCount: 0,
    conflictingDuplicateRecordCount: 0,
    duplicateStylesheetPrecedenceRowCount: 0,
    validationMutatedRecords: false,
    realResourceMapsMutated: false,
    fakeResourceMapsMutated: false,
    compatibilityClaimed: false
  });
}

function assertNoDuplicateStylesheetPrecedenceResourceMapRows(
  privateResourceMapRecords
) {
  const seenByResourceMapDedupeKey = new Set();
  let checkedRecordCount = 0;
  for (const row of privateResourceMapRecords) {
    if (row.recordKind !== 'stylesheet') {
      continue;
    }

    checkedRecordCount++;
    if (seenByResourceMapDedupeKey.has(row.resourceMapDedupeKey)) {
      throwInvalidResourceHintResourceMapCommitAdmission(
        `duplicate stylesheet precedence rows for ${row.resourceMapDedupeKey}`
      );
    }
    seenByResourceMapDedupeKey.add(row.resourceMapDedupeKey);
  }

  return freezeRecord({
    checkedRecordCount,
    checkedDedupeKeyCount: seenByResourceMapDedupeKey.size
  });
}

function assertWellFormedResourceMapCommitModuleRows(
  privateResourceMapRecords
) {
  for (const row of privateResourceMapRecords) {
    if (row.contractId === 'preload-module') {
      if (
        row.recordKind !== 'preload' ||
        row.mapKind !== 'preload-props' ||
        row.resourceKind !== 'script' ||
        row.scriptKind !== 'module' ||
        row.relationship !== 'modulepreload' ||
        row.modulePreload !== true
      ) {
        throwInvalidResourceHintResourceMapCommitAdmission(
          'modulepreload resource-map commit rows must describe script module preload records'
        );
      }
    } else if (row.contractId === 'preinit-module-script') {
      if (
        row.recordKind !== 'script' ||
        row.mapKind !== 'hoistable-scripts' ||
        row.resourceKind !== 'script' ||
        row.scriptKind !== 'module' ||
        row.relationship !== 'module-script' ||
        row.moduleScript !== true
      ) {
        throwInvalidResourceHintResourceMapCommitAdmission(
          'preinitModule resource-map commit rows must describe script module records'
        );
      }
    }
  }
}

function isResourceMapCommitScriptOrderRecord(row) {
  return (
    row.resourceKind === 'script' &&
    (row.recordKind === 'preload' || row.recordKind === 'script')
  );
}

function getResourceMapCommitConflictSignature(row) {
  if (row.recordKind === 'preload') {
    return `${row.recordKind}:${row.relationship}:${row.scriptKind || 'none'}`;
  }
  if (row.recordKind === 'script') {
    return `${row.recordKind}:${row.scriptKind || 'none'}`;
  }
  return `${row.recordKind}:${row.resourceKind}`;
}

function createResourceMapCommitModuleResourceOrder(
  privateResourceMapRecords
) {
  const rows = freezeArray(
    privateResourceMapRecords
      .filter(isResourceMapCommitScriptOrderRecord)
      .map((row, moduleOrderIndex) =>
        createResourceMapCommitModuleOrderRow(row, moduleOrderIndex)
      )
  );
  const dedupeKeys = createResourceMapCommitModuleDedupeKeyRows(rows);

  return freezeRecord({
    orderKind:
      'react-19.2.6-modulepreload-preinit-module-resource-map-order-diagnostic',
    targetKind: 'document-head',
    hostTag: 'head',
    rowCount: rows.length,
    dedupeKeyCount: dedupeKeys.length,
    rows,
    dedupeKeys,
    malformedModuleRowCount: 0,
    conflictingDuplicateRecordCount: 0,
    headInsertionApplied: false,
    realHeadMutated: false,
    fakeHeadMutated: false,
    realResourceMapsMutated: false,
    fakeResourceMapsMutated: false,
    fetchStarted: false,
    preloadStarted: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    publicResourceDispatchBlocked: true,
    publicScriptModuleResourceDispatch: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createResourceMapCommitModuleOrderRow(row, moduleOrderIndex) {
  return freezeRecord({
    rowId: `module-resource-map-order-${moduleOrderIndex}`,
    rowType: 'module-resource-map-order',
    moduleOrderIndex,
    sourceResourceMapCommitRowId: row.rowId,
    resourceMapOrderIndex: row.resourceMapOrderIndex,
    inputIndex: row.inputIndex,
    sourceAdapterAdmissionId: row.sourceAdapterAdmissionId,
    sourceRequestId: row.sourceRequestId,
    contractId: row.contractId,
    privateDispatcherKey: row.privateDispatcherKey,
    publicName: row.publicName,
    recordKind: row.recordKind,
    mapKind: row.mapKind,
    resourceStage: row.resourceStage,
    resourceKind: row.resourceKind,
    scriptKind: row.scriptKind,
    relationship: row.relationship,
    dedupeKey: row.dedupeKey,
    resourceMapDedupeKey: row.resourceMapDedupeKey,
    modulePreload: row.modulePreload,
    moduleScript: row.moduleScript,
    classicScriptPreinit: row.classicScriptPreinit,
    dedupeAction: row.dedupeAction,
    dedupeMatched: row.dedupeMatched,
    wouldInsertIntoHead: row.wouldInsertIntoHead,
    publicResourceDispatchBlocked: true,
    publicScriptModuleResourceDispatch: false,
    headInsertionApplied: false,
    fetchStarted: false,
    preloadStarted: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createResourceMapCommitModuleDedupeKeyRows(orderRows) {
  const stateByDedupeKey = new Map();
  for (const row of orderRows) {
    let state = stateByDedupeKey.get(row.dedupeKey);
    if (state === undefined) {
      state = {
        dedupeKey: row.dedupeKey,
        sourceRowIds: [],
        resourceMapDedupeKeys: [],
        contractIds: [],
        recordKinds: [],
        mapKinds: [],
        scriptKinds: [],
        relationships: [],
        firstModuleOrderIndex: row.moduleOrderIndex,
        lastModuleOrderIndex: row.moduleOrderIndex,
        hasClassicScriptPreload: false,
        hasModulePreload: false,
        hasClassicScriptPreinit: false,
        hasModuleScriptPreinit: false
      };
      stateByDedupeKey.set(row.dedupeKey, state);
    }

    state.sourceRowIds.push(row.sourceResourceMapCommitRowId);
    state.resourceMapDedupeKeys.push(row.resourceMapDedupeKey);
    state.contractIds.push(row.contractId);
    state.recordKinds.push(row.recordKind);
    state.mapKinds.push(row.mapKind);
    state.scriptKinds.push(row.scriptKind);
    state.relationships.push(row.relationship);
    state.lastModuleOrderIndex = row.moduleOrderIndex;
    if (row.contractId === 'preload' && row.scriptKind === 'classic') {
      state.hasClassicScriptPreload = true;
    }
    if (row.contractId === 'preload-module') {
      state.hasModulePreload = true;
    }
    if (row.contractId === 'preinit-script') {
      state.hasClassicScriptPreinit = true;
    }
    if (row.contractId === 'preinit-module-script') {
      state.hasModuleScriptPreinit = true;
    }
  }

  return freezeArray(
    Array.from(stateByDedupeKey.values()).map((state, dedupeKeyIndex) =>
      freezeRecord({
        rowId: `module-resource-map-dedupe-key-${dedupeKeyIndex}`,
        rowType: 'module-resource-map-dedupe-key',
        dedupeKeyIndex,
        dedupeKey: state.dedupeKey,
        rowCount: state.sourceRowIds.length,
        sourceResourceMapCommitRowIds: freezeArray(state.sourceRowIds),
        resourceMapDedupeKeys: freezeArray(
          uniqueStrings(state.resourceMapDedupeKeys)
        ),
        contractIdsInOrder: freezeArray(state.contractIds),
        recordKindsInOrder: freezeArray(state.recordKinds),
        mapKindsInOrder: freezeArray(state.mapKinds),
        scriptKindsInOrder: freezeArray(state.scriptKinds),
        relationshipsInOrder: freezeArray(state.relationships),
        firstModuleOrderIndex: state.firstModuleOrderIndex,
        lastModuleOrderIndex: state.lastModuleOrderIndex,
        hasClassicScriptPreload: state.hasClassicScriptPreload,
        hasModulePreload: state.hasModulePreload,
        hasClassicScriptPreinit: state.hasClassicScriptPreinit,
        hasModuleScriptPreinit: state.hasModuleScriptPreinit,
        conflictStatus: 'validated-no-conflicting-duplicates',
        rawValuesRetained: false,
        compatibilityClaimed: false
      })
    )
  );
}

function createResourceMapCommitScriptModuleFakeDomExecution(
  moduleResourceMapOrder
) {
  const rows = freezeArray(
    moduleResourceMapOrder.rows.map((row, executionOrderIndex) => {
      const dedupeKeyRow =
        findResourceMapCommitModuleDedupeKeyRow(
          moduleResourceMapOrder.dedupeKeys,
          row.dedupeKey
        );
      return createResourceMapCommitScriptModuleFakeDomExecutionRow(
        row,
        dedupeKeyRow,
        executionOrderIndex
      );
    })
  );
  const scriptResourceRows = rows.filter(
    (row) => row.recordKind === 'script'
  );
  const modulePreloadRows = rows.filter(
    (row) => row.modulePreload === true
  );
  const dedupeOrderBoundary =
    createResourceMapCommitScriptModuleDedupeOrderBoundary(
      moduleResourceMapOrder,
      rows
    );

  return freezeRecord({
    executionKind:
      'react-19.2.6-script-modulepreload-fake-dom-commit-execution-diagnostic',
    targetKind: 'document-head',
    hostTag: 'head',
    sourceModuleResourceMapOrderKind: moduleResourceMapOrder.orderKind,
    sourceModuleResourceMapOrderRowCount:
      moduleResourceMapOrder.rowCount,
    sourceModuleResourceMapDedupeKeyCount:
      moduleResourceMapOrder.dedupeKeyCount,
    rowCount: rows.length,
    scriptResourceMapRowCount: scriptResourceRows.length,
    modulePreloadResourceMapRowCount: modulePreloadRows.length,
    classicScriptPreloadRowCount: rows.filter(
      (row) => row.classicScriptPreload === true
    ).length,
    classicScriptPreinitRowCount: rows.filter(
      (row) => row.classicScriptPreinit === true
    ).length,
    moduleScriptPreinitRowCount: rows.filter(
      (row) => row.moduleScript === true
    ).length,
    rows,
    dedupeOrderBoundary,
    fakeDomCommitEvidenceRecorded: true,
    fakeDomCommitApplied: false,
    fakeHeadRead: false,
    fakeHeadMutated: false,
    realHeadMutated: false,
    realResourceMapsMutated: false,
    fakeResourceMapsMutated: false,
    dedupeRowsMutated: false,
    orderRowsMutated: false,
    resourceInstancesCreated: false,
    preloadPropsMapMutated: false,
    hoistableScriptsMapMutated: false,
    fetchStarted: false,
    preloadStarted: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    publicResourceDispatchBlocked: true,
    publicScriptModuleResourceDispatch: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function findResourceMapCommitModuleDedupeKeyRow(dedupeKeys, dedupeKey) {
  return dedupeKeys.find((row) => row.dedupeKey === dedupeKey) || null;
}

function createResourceMapCommitScriptModuleFakeDomExecutionRow(
  row,
  dedupeKeyRow,
  executionOrderIndex
) {
  const wouldCreatePreloadPropsRecord = row.recordKind === 'preload';
  const wouldCreateHoistableScriptResource = row.recordKind === 'script';
  const wouldAdoptPreloadProps =
    wouldCreateHoistableScriptResource &&
    dedupeKeyRow !== null &&
    (dedupeKeyRow.hasClassicScriptPreload === true ||
      dedupeKeyRow.hasModulePreload === true);

  return freezeRecord({
    rowId: `script-module-fake-dom-commit-${executionOrderIndex}`,
    rowType: 'script-module-fake-dom-commit-execution',
    executionOrderIndex,
    sourceModuleResourceMapOrderRowId: row.rowId,
    sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
    sourceModuleDedupeKeyRowId:
      dedupeKeyRow === null ? null : dedupeKeyRow.rowId,
    resourceMapOrderIndex: row.resourceMapOrderIndex,
    moduleOrderIndex: row.moduleOrderIndex,
    inputIndex: row.inputIndex,
    sourceAdapterAdmissionId: row.sourceAdapterAdmissionId,
    sourceRequestId: row.sourceRequestId,
    contractId: row.contractId,
    privateDispatcherKey: row.privateDispatcherKey,
    publicName: row.publicName,
    recordKind: row.recordKind,
    mapKind: row.mapKind,
    resourceStage: row.resourceStage,
    resourceKind: row.resourceKind,
    scriptKind: row.scriptKind,
    relationship: row.relationship,
    dedupeKey: row.dedupeKey,
    resourceMapDedupeKey: row.resourceMapDedupeKey,
    modulePreload: row.modulePreload,
    moduleScript: row.moduleScript,
    classicScriptPreload:
      row.contractId === 'preload' && row.scriptKind === 'classic',
    classicScriptPreinit: row.classicScriptPreinit,
    dedupeAction: row.dedupeAction,
    dedupeMatched: row.dedupeMatched,
    wouldInsertIntoHead: row.wouldInsertIntoHead,
    fakeDomCommitOperation:
      getScriptModuleFakeDomCommitOperation(row),
    fakeDomCommitEvidenceRecorded: true,
    privateFakeDomCommitOnly: true,
    fakeDomCommitApplied: false,
    dedupeOrderPreserved: true,
    dedupeRowsMutated: false,
    orderRowsMutated: false,
    wouldCreatePreloadPropsRecord,
    wouldCreateHoistableScriptResource,
    wouldAdoptPreloadProps,
    preloadPropsAdoptionBlocked: wouldAdoptPreloadProps,
    preloadPropsMapMutated: false,
    hoistableScriptsMapMutated: false,
    resourceInstanceCreated: false,
    hostNodeInserted: false,
    fakeHeadMutated: false,
    realHeadMutated: false,
    fetchStarted: false,
    preloadStarted: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    publicResourceDispatchBlocked: true,
    publicScriptModuleResourceDispatch: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function getScriptModuleFakeDomCommitOperation(row) {
  if (row.modulePreload === true) {
    return 'record-modulepreload-preload-props-fake-dom-commit';
  }
  if (row.moduleScript === true) {
    return 'record-module-script-hoistable-script-fake-dom-commit';
  }
  if (row.classicScriptPreinit === true) {
    return 'record-classic-script-hoistable-script-fake-dom-commit';
  }
  if (row.contractId === 'preload' && row.scriptKind === 'classic') {
    return 'record-classic-script-preload-props-fake-dom-commit';
  }
  return 'record-script-resource-map-fake-dom-commit';
}

function createResourceMapCommitScriptModuleDedupeOrderBoundary(
  moduleResourceMapOrder,
  executionRows
) {
  return freezeRecord({
    status:
      'preserved-private-script-module-resource-map-dedupe-order-blocker',
    sourceModuleResourceMapOrderRowCount:
      moduleResourceMapOrder.rowCount,
    sourceModuleResourceMapDedupeKeyCount:
      moduleResourceMapOrder.dedupeKeyCount,
    executionRowCount: executionRows.length,
    consumedDedupeKeyCount:
      uniqueStrings(executionRows.map((row) => row.dedupeKey)).length,
    sourceDedupeKeyRowIds: freezeArray(
      moduleResourceMapOrder.dedupeKeys.map((row) => row.rowId)
    ),
    sourceDedupeKeys: freezeArray(
      moduleResourceMapOrder.dedupeKeys.map((row) => row.dedupeKey)
    ),
    dedupeRowsMutated: false,
    orderRowsMutated: false,
    conflictingDuplicateRecordCount:
      moduleResourceMapOrder.conflictingDuplicateRecordCount,
    malformedModuleRowCount:
      moduleResourceMapOrder.malformedModuleRowCount,
    publicScriptModuleResourceDispatch: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createResourceMapCommitStylesheetLoadStateOrder(
  privateResourceMapRecords,
  stylesheetLoadErrorState
) {
  const stylesheetRecords = freezeArray(
    privateResourceMapRecords.filter((row) => row.recordKind === 'stylesheet')
  );

  if (stylesheetLoadErrorState === null) {
    return freezeRecord({
      orderKind:
        'react-19.2.6-stylesheet-load-state-resource-map-commit-order-diagnostic',
      targetKind: 'document-head',
      hostTag: 'head',
      sourceStylesheetLoadErrorStateId: null,
      sourceStylesheetLoadErrorStateSequence: null,
      rowCount: 0,
      stylesheetResourceMapRecordCount: stylesheetRecords.length,
      loadStateResourceCount: 0,
      matchedResourceCount: 0,
      unmatchedLoadStateResourceCount: 0,
      staleResourceMapEntryCount: 0,
      duplicateStylesheetPrecedenceRowCount: 0,
      commitTransitionCount: 0,
      commitTransitionResourceCount: 0,
      rows: freezeArray([]),
      commitTransition: null,
      loadStateConsumed: false,
      resourceMapEntriesValidated: false,
      commitTransitionRecorded: false,
      fakeResourceCommitTransitionRecorded: false,
      loadEventSubscribed: false,
      errorEventSubscribed: false,
      loadingStateMutated: false,
      resourceFetchStarted: false,
      commitSuspended: false,
      publicResourceDispatchBlocked: true,
      publicStylesheetLoadStateDispatch: false,
      rawValuesRetained: false,
      compatibilityClaimed: false
    });
  }

  const stateRowsByResourceKey = new Map();
  for (const row of stylesheetLoadErrorState.resourceStateRows) {
    if (stateRowsByResourceKey.has(row.resourceKey)) {
      throwInvalidResourceHintResourceMapCommitAdmission(
        `duplicate stylesheet load/error state rows for ${row.resourceKey}`
      );
    }
    stateRowsByResourceKey.set(row.resourceKey, row);
  }

  const rows = freezeArray(
    stylesheetRecords.map((row, index) => {
      const stateRow = stateRowsByResourceKey.get(row.resourceKey);
      if (stateRow === undefined) {
        throwInvalidResourceHintResourceMapCommitAdmission(
          `stale resource-map entries for ${row.resourceMapDedupeKey}`
        );
      }

      return createResourceMapCommitStylesheetLoadStateOrderRow(
        row,
        stateRow,
        stylesheetLoadErrorState,
        index
      );
    })
  );
  const commitTransition =
    createResourceMapCommitStylesheetLoadStateTransition(
      stylesheetLoadErrorState,
      rows
    );
  const matchedResourceKeys = new Set(rows.map((row) => row.resourceKey));
  const unmatchedLoadStateResourceCount =
    stylesheetLoadErrorState.resourceStateRows.filter(
      (row) => !matchedResourceKeys.has(row.resourceKey)
    ).length;

  return freezeRecord({
    orderKind:
      'react-19.2.6-stylesheet-load-state-resource-map-commit-order-diagnostic',
    targetKind: 'document-head',
    hostTag: 'head',
    sourceStylesheetLoadErrorStateId:
      stylesheetLoadErrorState.stylesheetLoadErrorStateId,
    sourceStylesheetLoadErrorStateSequence:
      stylesheetLoadErrorState.stylesheetLoadErrorStateSequence,
    rowCount: rows.length,
    stylesheetResourceMapRecordCount: stylesheetRecords.length,
    loadStateResourceCount:
      stylesheetLoadErrorState.resourceStateRows.length,
    matchedResourceCount: rows.length,
    unmatchedLoadStateResourceCount,
    staleResourceMapEntryCount: 0,
    duplicateStylesheetPrecedenceRowCount: 0,
    commitTransitionCount: 1,
    commitTransitionResourceCount: rows.length,
    rows,
    commitTransition,
    loadStateConsumed: true,
    resourceMapEntriesValidated: true,
    commitTransitionRecorded: true,
    fakeResourceCommitTransitionRecorded: true,
    loadEventSubscribed: false,
    errorEventSubscribed: false,
    loadingStateMutated: false,
    resourceFetchStarted: false,
    commitSuspended: false,
    publicResourceDispatchBlocked: true,
    publicStylesheetLoadStateDispatch: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createResourceMapCommitStylesheetLoadStateOrderRow(
  resourceMapRow,
  stateRow,
  stylesheetLoadErrorState,
  index
) {
  const loadingRows = stylesheetLoadErrorState.loadingStateRows.filter(
    (row) => row.sourceResourceStateRowId === stateRow.rowId
  );
  const preloadStateRow =
    stylesheetLoadErrorState.preloadStateRows.find(
      (row) => row.sourceResourceStateRowId === stateRow.rowId
    ) || null;
  const commitSuspensionRow =
    stylesheetLoadErrorState.commitSuspensionRows.find(
      (row) => row.sourceResourceStateRowId === stateRow.rowId
    ) || null;

  return freezeRecord({
    rowId: `stylesheet-load-state-commit-order-${index}`,
    rowType: 'stylesheet-load-state-commit-order',
    sourceResourceMapCommitRowId: resourceMapRow.rowId,
    sourceStylesheetLoadErrorStateRowId: stateRow.rowId,
    sourcePreloadStateRowId:
      preloadStateRow === null ? null : preloadStateRow.rowId,
    sourceCommitSuspensionRowId:
      commitSuspensionRow === null ? null : commitSuspensionRow.rowId,
    resourceMapOrderIndex: resourceMapRow.resourceMapOrderIndex,
    resourceIndex: stateRow.resourceIndex,
    resourceKey: resourceMapRow.resourceKey,
    resourceMapDedupeKey: resourceMapRow.resourceMapDedupeKey,
    precedenceKey: resourceMapRow.precedenceKey,
    mapKind: resourceMapRow.mapKind,
    recordKind: resourceMapRow.recordKind,
    contractId: resourceMapRow.contractId,
    sourceStylesheetDedupeRowId:
      resourceMapRow.sourceStylesheetDedupeRowId,
    fakeLoadingStateBitmasks: freezeArray(
      loadingRows.map((row) => row.bitmask)
    ),
    fakeLoadingStateLabels: freezeArray(
      loadingRows.map((row) => row.label)
    ),
    preloadWouldBeTracked: stateRow.preloadSeenBefore,
    preinitSeenBefore: stateRow.preinitSeenBefore,
    plannedInsertionCount: stateRow.plannedInsertionCount,
    observedStylesheetCount: stateRow.observedStylesheetCount,
    commitOrderConsumesFakeLoadState: true,
    resourceMapEntryStale: false,
    duplicatePrecedenceRow: false,
    loadEventSubscribed: false,
    errorEventSubscribed: false,
    loadingStateMutated: false,
    resourceFetchStarted: false,
    commitSuspended: false,
    publicResourceDispatchBlocked: true,
    publicStylesheetLoadStateDispatch: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createResourceMapCommitStylesheetLoadStateTransition(
  stylesheetLoadErrorState,
  rows
) {
  return freezeRecord({
    transitionId:
      `${stylesheetLoadErrorState.stylesheetLoadErrorStateId}:resource-map-commit-transition`,
    transitionKind:
      'react-19.2.6-stylesheet-load-state-fake-resource-map-commit-transition',
    transitionStatus:
      privateResourceHintStylesheetLoadStateCommitTransitionStatus,
    targetKind: 'document-head',
    hostTag: 'head',
    sourceStylesheetLoadErrorStateId:
      stylesheetLoadErrorState.stylesheetLoadErrorStateId,
    sourceStylesheetLoadErrorStateSequence:
      stylesheetLoadErrorState.stylesheetLoadErrorStateSequence,
    sourceResourceMapCommitRowIds: freezeArray(
      rows.map((row) => row.sourceResourceMapCommitRowId)
    ),
    sourceStylesheetLoadErrorStateRowIds: freezeArray(
      rows.map((row) => row.sourceStylesheetLoadErrorStateRowId)
    ),
    sourcePreloadStateRowIds: freezeArray(
      rows
        .map((row) => row.sourcePreloadStateRowId)
        .filter((rowId) => rowId !== null)
    ),
    sourceCommitSuspensionRowIds: freezeArray(
      rows
        .map((row) => row.sourceCommitSuspensionRowId)
        .filter((rowId) => rowId !== null)
    ),
    fakeResourceRows: freezeArray(
      rows.map((row) =>
        freezeRecord({
          sourceResourceMapCommitRowId:
            row.sourceResourceMapCommitRowId,
          sourceStylesheetLoadErrorStateRowId:
            row.sourceStylesheetLoadErrorStateRowId,
          resourceKey: row.resourceKey,
          resourceMapDedupeKey: row.resourceMapDedupeKey,
          precedenceKey: row.precedenceKey,
          fakeLoadingStateLabels: row.fakeLoadingStateLabels,
          fakeLoadingStateBitmasks: row.fakeLoadingStateBitmasks,
          preloadWouldBeTracked: row.preloadWouldBeTracked,
          commitOrderConsumesFakeLoadState:
            row.commitOrderConsumesFakeLoadState
        })
      )
    ),
    fakeResourceKeys: freezeArray(
      uniqueStrings(rows.map((row) => row.resourceKey))
    ),
    fakeResourceMapDedupeKeys: freezeArray(
      uniqueStrings(rows.map((row) => row.resourceMapDedupeKey))
    ),
    transitionCount: 1,
    fakeResourceCount: rows.length,
    matchedResourceCount: rows.length,
    commitOrderRowCount: rows.length,
    consumesStylesheetLoadErrorStateRecord: true,
    consumesFakeLoadStateRows: true,
    validatesResourceMapRows: true,
    fakeResourceCommitTransitionRecorded: true,
    realResourceMapCreated: false,
    realResourceMapMutated: false,
    fakeResourceMapCreated: false,
    fakeResourceMapMutated: false,
    preloadElementCreated: false,
    preloadElementInserted: false,
    preloadFetchStarted: false,
    stylesheetElementCreated: false,
    stylesheetElementInserted: false,
    stylesheetFetchStarted: false,
    loadEventSubscribed: false,
    errorEventSubscribed: false,
    loadingStateMutated: false,
    commitSuspended: false,
    publicResourceDispatchBlocked: true,
    publicStylesheetLoadStateDispatch: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createResourceMapCommitPlanSummary(
  privateResourceMapRecords,
  moduleResourceMapOrder,
  scriptModuleFakeDomCommitExecution,
  resourceMapConflictBoundary,
  stylesheetLoadStateCommitOrder
) {
  const uniquePrivateRecordKeys = new Set(
    privateResourceMapRecords.map(
      (row) => `${row.recordKind}:${row.resourceKey}`
    )
  );
  const stylesheetRecordCount = privateResourceMapRecords.filter(
    (row) => row.recordKind === 'stylesheet'
  ).length;
  const preloadRecordCount = privateResourceMapRecords.filter(
    (row) => row.recordKind === 'preload'
  ).length;
  const scriptRecordCount = privateResourceMapRecords.filter(
    (row) => row.recordKind === 'script'
  ).length;
  const modulePreloadRecordCount = privateResourceMapRecords.filter(
    (row) => row.modulePreload === true
  ).length;
  const moduleScriptRecordCount = privateResourceMapRecords.filter(
    (row) => row.moduleScript === true
  ).length;

  return freezeRecord({
    resourceMapKind:
      'react-19.2.6-resource-map-commit-diagnostic',
    targetKind: 'document-head',
    hostTag: 'head',
    privateResourceMapRecordCount: privateResourceMapRecords.length,
    uniquePrivateResourceRecordCount: uniquePrivateRecordKeys.size,
    stylesheetRecordCount,
    preloadRecordCount,
    scriptRecordCount,
    modulePreloadRecordCount,
    moduleScriptRecordCount,
    moduleResourceMapOrderRowCount: moduleResourceMapOrder.rowCount,
    moduleResourceMapDedupeKeyCount: moduleResourceMapOrder.dedupeKeyCount,
    scriptModuleFakeDomCommitExecutionRowCount:
      scriptModuleFakeDomCommitExecution.rowCount,
    scriptResourceFakeDomCommitExecutionRowCount:
      scriptModuleFakeDomCommitExecution.scriptResourceMapRowCount,
    modulePreloadFakeDomCommitExecutionRowCount:
      scriptModuleFakeDomCommitExecution.modulePreloadResourceMapRowCount,
    stylesheetLoadStateCommitOrderRowCount:
      stylesheetLoadStateCommitOrder.rowCount,
    stylesheetLoadStateResourceCount:
      stylesheetLoadStateCommitOrder.loadStateResourceCount,
    stylesheetLoadStateCommitTransitionCount:
      stylesheetLoadStateCommitOrder.commitTransitionCount,
    stylesheetLoadStateCommitTransitionResourceCount:
      stylesheetLoadStateCommitOrder.commitTransitionResourceCount,
    unmatchedStylesheetLoadStateResourceCount:
      stylesheetLoadStateCommitOrder.unmatchedLoadStateResourceCount,
    malformedModuleRowCount:
      resourceMapConflictBoundary.malformedModuleRowCount,
    conflictingDuplicateRecordCount:
      resourceMapConflictBoundary.conflictingDuplicateRecordCount,
    duplicateStylesheetPrecedenceRowCount:
      resourceMapConflictBoundary.duplicateStylesheetPrecedenceRowCount,
    staleResourceMapEntryCount:
      stylesheetLoadStateCommitOrder.staleResourceMapEntryCount,
    dedupedRecordCount: privateResourceMapRecords.filter(
      (row) => row.wouldInsertIntoHead === false
    ).length,
    wouldInsertRecordCount: privateResourceMapRecords.filter(
      (row) => row.wouldInsertIntoHead === true
    ).length,
    realResourceMapsCreated: false,
    realResourceMapsMutated: false,
    fakeResourceMapsCreated: false,
    fakeResourceMapsMutated: false,
    hoistableStylesMapCreated: false,
    hoistableStylesMapMutated: false,
    hoistableScriptsMapCreated: false,
    hoistableScriptsMapMutated: false,
    preloadPropsMapCreated: false,
    preloadPropsMapMutated: false,
    scriptModuleFakeDomCommitEvidenceRecorded: true,
    fakeDomCommitApplied: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    publicScriptModuleResourceDispatch: false,
    preloadOrStyleDomWorkDispatched: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
}

function createResourceMapCommitStylesheetPrecedenceBoundary(
  stylesheetPrecedence
) {
  return freezeRecord({
    status: privateResourceHintHeadStylesheetPrecedenceBlockedStatus,
    sourceStylesheetPrecedenceId:
      stylesheetPrecedence.stylesheetPrecedenceId,
    precedenceRowCount: stylesheetPrecedence.precedenceRows.length,
    plannedStylesheetRowCount:
      stylesheetPrecedence.plannedStylesheetOrder.rowCount,
    observedStylesheetRowCount:
      stylesheetPrecedence.observedStylesheetOrder.stylesheetRowCount,
    headSingletonOrderRowCount:
      stylesheetPrecedence.headSingletonOrderRows.length,
    precedenceMapCreated: false,
    precedenceQueryRun: false,
    precedenceInsertionApplied: false,
    singletonOrderingApplied: false,
    publicStylesheetPrecedenceBehavior: false,
    compatibilityClaimed: false,
    blockedCapabilities:
      resourceHintHeadStylesheetPrecedenceBlockedCapabilities
  });
}

function createResourceMapCommitLifecycleBoundary(commitPlan) {
  return freezeRecord({
    resourceRecordCount:
      commitPlan.resourceMapCommitPlan.privateResourceMapRecordCount,
    stylesheetRecordCount:
      commitPlan.resourceMapCommitPlan.stylesheetRecordCount,
    preloadRecordCount: commitPlan.resourceMapCommitPlan.preloadRecordCount,
    scriptRecordCount: commitPlan.resourceMapCommitPlan.scriptRecordCount,
    modulePreloadRecordCount:
      commitPlan.resourceMapCommitPlan.modulePreloadRecordCount,
    moduleScriptRecordCount:
      commitPlan.resourceMapCommitPlan.moduleScriptRecordCount,
    scriptModuleFakeDomCommitExecutionRowCount:
      commitPlan.resourceMapCommitPlan
        .scriptModuleFakeDomCommitExecutionRowCount,
    scriptResourceFakeDomCommitExecutionRowCount:
      commitPlan.resourceMapCommitPlan
        .scriptResourceFakeDomCommitExecutionRowCount,
    modulePreloadFakeDomCommitExecutionRowCount:
      commitPlan.resourceMapCommitPlan
        .modulePreloadFakeDomCommitExecutionRowCount,
    stylesheetLoadStateCommitOrderRowCount:
      commitPlan.resourceMapCommitPlan
        .stylesheetLoadStateCommitOrderRowCount,
    stylesheetLoadStateCommitTransitionCount:
      commitPlan.resourceMapCommitPlan
        .stylesheetLoadStateCommitTransitionCount,
    stylesheetLoadStateRecordConsumed:
      commitPlan.stylesheetLoadStateCommitOrder.loadStateConsumed,
    stylesheetLoadStateResourceMapRowsValidated:
      commitPlan.stylesheetLoadStateCommitOrder.resourceMapEntriesValidated,
    stylesheetLoadStateCommitTransitionRecorded:
      commitPlan.stylesheetLoadStateCommitOrder.commitTransitionRecorded,
    singletonOwnershipClaimed: false,
    resourceCountIncremented: false,
    resourceInstanceCreated: false,
    scriptModuleFakeDomCommitEvidenceRecorded: true,
    fakeDomCommitApplied: false,
    preloadPropsMapMutated: false,
    hoistableScriptsMapMutated: false,
    hostNodeInserted: false,
    fetchStarted: false,
    preloadStarted: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    loadEventSubscribed: false,
    loadStateMutated: false,
    suspendedCommitWaitStarted: false,
    preloadOrStyleDomWorkDispatched: false,
    publicScriptModuleResourceDispatch: false,
    publicResourceApisReachable: false,
    compatibilityClaimed: false,
    blockedCapabilities: resourceHintResourceMapCommitBlockedCapabilities
  });
}

function createResourceHintResourceMapCommitSourceOrder(order) {
  return freezeRecord({
    orderDiagnosticId: order.orderDiagnosticId,
    orderDiagnosticSequence: order.orderDiagnosticSequence,
    orderStatus: order.orderStatus,
    executionStatus: order.executionStatus,
    compatibilityStatus: order.compatibilityStatus,
    sourceAdapterAdmissionIds: order.sourceAdapterAdmissionIds,
    acceptedContractIds: order.acceptedContractIds,
    dedupeRowCount: order.dedupeRows.length,
    plannedHeadRowCount: order.plannedHeadInsertionOrder.rowCount,
    resourceMapKind: order.resourceMapPlan.resourceMapKind,
    uniqueResourceCount: order.resourceMapPlan.uniqueResourceCount,
    preloadResourceCount: order.resourceMapPlan.preloadResourceCount,
    preinitResourceCount: order.resourceMapPlan.preinitResourceCount,
    scriptModuleRowCount: order.scriptModulePreinitRows.length,
    scriptModuleHeadPlannedRowCount:
      order.scriptModuleHeadOrder.plannedRowCount,
    scriptModuleHeadObservedRowCount:
      order.scriptModuleHeadOrder.observedRowCount,
    resourceMapCreated: order.resourceMapPlan.resourceMapCreated,
    resourceMapMutated: order.resourceMapPlan.resourceMapMutated,
    publicScriptModuleResourceDispatch:
      order.publicScriptModuleDispatchBoundary
        .publicScriptModuleResourceDispatch,
    publicResourceHintDomInsertion:
      order.publicResourceBoundary.publicResourceHintCallsReachable,
    compatibilityClaimed: false
  });
}

function createResourceHintResourceMapCommitSourceStylesheetPrecedence(
  stylesheetPrecedence
) {
  return freezeRecord({
    stylesheetPrecedenceId:
      stylesheetPrecedence.stylesheetPrecedenceId,
    stylesheetPrecedenceSequence:
      stylesheetPrecedence.stylesheetPrecedenceSequence,
    stylesheetPrecedenceStatus:
      stylesheetPrecedence.stylesheetPrecedenceStatus,
    executionStatus: stylesheetPrecedence.executionStatus,
    compatibilityStatus: stylesheetPrecedence.compatibilityStatus,
    sourceOrderDiagnosticId:
      stylesheetPrecedence.sourceOrderDiagnosticId,
    stylesheetDedupeRowCount:
      stylesheetPrecedence.stylesheetDedupeRows.length,
    plannedStylesheetRowCount:
      stylesheetPrecedence.plannedStylesheetOrder.rowCount,
    observedStylesheetRowCount:
      stylesheetPrecedence.observedStylesheetOrder.stylesheetRowCount,
    stylesheetResourceMapKind:
      stylesheetPrecedence.stylesheetResourceMapPlan.resourceMapKind,
    uniqueStylesheetResourceCount:
      stylesheetPrecedence.stylesheetResourceMapPlan
        .uniqueStylesheetResourceCount,
    stylesheetResourceMapCreated:
      stylesheetPrecedence.stylesheetResourceMapPlan
        .stylesheetResourceMapCreated,
    stylesheetResourceMapMutated:
      stylesheetPrecedence.stylesheetResourceMapPlan
        .stylesheetResourceMapMutated,
    headSingletonOrderingApplied:
      stylesheetPrecedence.headSingletonOrderBoundary
        .singletonOrderingApplied,
    publicResourceHintDomInsertion:
      stylesheetPrecedence.publicResourceBoundary
        .publicResourceHintCallsReachable,
    compatibilityClaimed: false
  });
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

function getAdmissionStringProperty(record, key, fallback) {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function normalizeFormActionResetDispatcherIntent(contract, intent) {
  if (intent == null || typeof intent !== 'object') {
    throwInvalidFormActionResetDispatcherIntent(
      contract,
      'intent metadata must be an object'
    );
  }

  if (intent.explicitIntent !== true) {
    throwInvalidFormActionResetDispatcherIntent(
      contract,
      'explicitIntent must be true'
    );
  }

  assertNoRawFormActionResetDispatcherFields(contract, intent);

  if (contract.intentKind === 'submission') {
    return normalizeFormActionSubmissionIntent(contract, intent);
  }

  return normalizeFormActionResetIntent(contract, intent);
}

function assertNoRawFormActionResetDispatcherFields(contract, intent) {
  for (const field of [
    'form',
    'nativeEvent',
    'event',
    'action',
    'formData',
    'submitter',
    'submitControl',
    'target'
  ]) {
    if (hasOwnProp(intent, field)) {
      throwInvalidFormActionResetDispatcherIntent(
        contract,
        `${field} must not be passed to the metadata gate`
      );
    }
  }
}

function normalizeFormActionSubmissionIntent(contract, intent) {
  const eventName = getIntentStringProperty(
    contract,
    intent,
    'eventName',
    'submit'
  );
  if (eventName !== 'submit') {
    throwInvalidFormActionResetDispatcherIntent(
      contract,
      'eventName must be submit'
    );
  }

  const replayed = getIntentBooleanProperty(
    contract,
    intent,
    'replayed',
    false
  );
  const submissionTrigger = getIntentEnumProperty(
    contract,
    intent,
    'submissionTrigger',
    formActionSubmissionTriggers,
    replayed ? 'replay' : 'submit'
  );
  const actionKind = getIntentEnumProperty(
    contract,
    intent,
    'actionKind',
    formActionActionKinds,
    'unknown'
  );
  const actionSource = getIntentEnumProperty(
    contract,
    intent,
    'actionSource',
    formActionActionSources,
    'unknown'
  );
  const submitControlKind = getIntentEnumProperty(
    contract,
    intent,
    'submitControlKind',
    formActionSubmitControlKinds,
    'unknown'
  );
  const formActionKind = getIntentEnumProperty(
    contract,
    intent,
    'formActionKind',
    formActionActionKinds,
    getDefaultFormActionKind(actionKind, actionSource)
  );
  const submitterActionKind = getIntentEnumProperty(
    contract,
    intent,
    'submitterActionKind',
    formActionActionKinds,
    getDefaultSubmitterActionKind(actionKind, actionSource)
  );
  const submitterActionOverridesFormAction = getIntentBooleanProperty(
    contract,
    intent,
    'submitterActionOverridesFormAction',
    actionSource === 'submit-control' && submitterActionKind !== 'none'
  );
  const defaultPrevented = getIntentBooleanProperty(
    contract,
    intent,
    'defaultPrevented',
    false
  );
  const transitionScheduled = getIntentBooleanProperty(
    contract,
    intent,
    'transitionScheduled',
    false
  );
  const functionAction = actionKind === 'function';
  const actionMetadata = createFormActionSubmissionMetadata({
    actionKind,
    actionSource,
    defaultPrevented,
    eventName,
    formActionKind,
    functionAction,
    replayed,
    submissionTrigger,
    submitControlKind,
    submitterActionKind,
    submitterActionOverridesFormAction,
    transitionScheduled
  });

  return freezeRecord({
    explicitIntent: true,
    intentKind: 'submission',
    eventName,
    submissionTrigger,
    actionKind,
    actionSource,
    submitControlKind,
    formActionKind,
    submitterActionKind,
    submitterActionOverridesFormAction,
    defaultPrevented,
    transitionScheduled,
    replayed,
    actionMetadata,
    formCaptured: false,
    rawEventCaptured: false,
    rawActionCaptured: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    defaultPreventedByGate: false,
    nativeNavigationWouldBePrevented: functionAction && !defaultPrevented,
    pendingStatusWouldBeSet:
      functionAction || (defaultPrevented && transitionScheduled),
    actionInvocationWouldBeScheduled: functionAction && !defaultPrevented,
    actionInvoked: false,
    hostTransitionStarted: false,
    compatibilityClaimed: false
  });
}

function normalizeFormActionResetIntent(contract, intent) {
  const dispatcherKey = getIntentStringProperty(
    contract,
    intent,
    'dispatcherKey',
    'r'
  );
  if (dispatcherKey !== 'r') {
    throwInvalidFormActionResetDispatcherIntent(
      contract,
      'dispatcherKey must be r'
    );
  }
  const orderingKind = getIntentEnumProperty(
    contract,
    intent,
    'orderingKind',
    formActionResetOrderingKinds,
    getDefaultResetOrderingKind(intent)
  );

  const resetSource = getIntentEnumProperty(
    contract,
    intent,
    'resetSource',
    freezeArray([
      'requestFormReset',
      'action-completion',
      'transition',
      'unknown'
    ]),
    'unknown'
  );
  const formOwnership = getIntentEnumProperty(
    contract,
    intent,
    'formOwnership',
    freezeArray(['not-inspected', 'react-owned', 'not-react-owned', 'unknown']),
    'not-inspected'
  );
  const transitionContext = getIntentEnumProperty(
    contract,
    intent,
    'transitionContext',
    freezeArray(['action', 'transition', 'none', 'unknown']),
    'unknown'
  );
  const resetDispatcherOrdering = createFormActionResetDispatcherOrdering({
    dispatcherKey,
    formOwnership,
    orderingKind,
    resetSource,
    transitionContext
  });

  return freezeRecord({
    explicitIntent: true,
    intentKind: 'reset',
    dispatcherKey,
    orderingKind,
    resetSource,
    formOwnership,
    transitionContext,
    resetDispatcherOrdering,
    formCaptured: false,
    rawDispatcherArgumentCaptured: false,
    realFormInspected: false,
    formFiberResolved: false,
    previousDispatcherCalled: false,
    resetWouldBeRequested: true,
    resetStateWouldBeQueued: transitionContext !== 'none',
    resetCommitWouldRun: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function getDefaultFormActionKind(actionKind, actionSource) {
  if (actionSource === 'form') {
    return actionKind;
  }
  if (actionSource === 'none') {
    return 'none';
  }
  return 'unknown';
}

function getDefaultSubmitterActionKind(actionKind, actionSource) {
  if (actionSource === 'submit-control') {
    return actionKind;
  }
  if (
    actionSource === 'form' ||
    actionSource === 'none' ||
    actionSource === 'replay'
  ) {
    return 'none';
  }
  return 'unknown';
}

function createFormActionSubmissionMetadata(metadata) {
  const submitterValueWouldBeIncludedInFormData =
    metadata.submitControlKind !== 'none' &&
    metadata.submitterActionOverridesFormAction === false;

  return freezeRecord({
    metadataOnly: true,
    submissionTrigger: metadata.submissionTrigger,
    eventName: metadata.eventName,
    requestSubmitWouldDispatchSubmitEvent:
      metadata.submissionTrigger === 'requestSubmit',
    replayed: metadata.replayed,
    resolvedActionKind: metadata.actionKind,
    formActionKind: metadata.formActionKind,
    submitterActionKind: metadata.submitterActionKind,
    actionSource: metadata.actionSource,
    submitControlKind: metadata.submitControlKind,
    submitterActionOverridesFormAction:
      metadata.submitterActionOverridesFormAction,
    submitterValueWouldBeIncludedInFormData,
    nativeNavigationWouldBePrevented:
      metadata.functionAction && !metadata.defaultPrevented,
    pendingStatusWouldBeSet:
      metadata.functionAction ||
      (metadata.defaultPrevented && metadata.transitionScheduled),
    actionInvocationWouldBeScheduled:
      metadata.functionAction && !metadata.defaultPrevented,
    formPropsRead: false,
    submitterPropsRead: false,
    submitterAttributeRead: false,
    rawFormCaptured: false,
    rawEventCaptured: false,
    rawSubmitterCaptured: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    defaultPreventedByGate: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    compatibilityClaimed: false
  });
}

function createFormActionEventExtractionSourceActionMetadata(metadata) {
  return freezeRecord({
    metadataOnly: metadata.metadataOnly,
    submissionTrigger: metadata.submissionTrigger,
    eventName: metadata.eventName,
    requestSubmitWouldDispatchSubmitEvent:
      metadata.requestSubmitWouldDispatchSubmitEvent,
    replayed: metadata.replayed,
    resolvedActionKind: metadata.resolvedActionKind,
    formActionKind: metadata.formActionKind,
    submitterActionKind: metadata.submitterActionKind,
    actionSource: metadata.actionSource,
    submitControlKind: metadata.submitControlKind,
    submitterActionOverridesFormAction:
      metadata.submitterActionOverridesFormAction,
    submitterValueWouldBeIncludedInFormData:
      metadata.submitterValueWouldBeIncludedInFormData,
    nativeNavigationWouldBePrevented:
      metadata.nativeNavigationWouldBePrevented,
    pendingStatusWouldBeSet: metadata.pendingStatusWouldBeSet,
    actionInvocationWouldBeScheduled:
      metadata.actionInvocationWouldBeScheduled,
    formPropsRead: metadata.formPropsRead,
    submitterPropsRead: metadata.submitterPropsRead,
    submitterAttributeRead: metadata.submitterAttributeRead,
    rawFormCaptured: metadata.rawFormCaptured,
    rawEventCaptured: metadata.rawEventCaptured,
    rawSubmitterCaptured: metadata.rawSubmitterCaptured,
    realFormInspected: metadata.realFormInspected,
    submitControlInspected: metadata.submitControlInspected,
    formDataConstructed: metadata.formDataConstructed,
    syntheticEventCreated: metadata.syntheticEventCreated,
    defaultPreventedByGate: metadata.defaultPreventedByGate,
    actionInvoked: metadata.actionInvoked,
    hostTransitionStarted: metadata.hostTransitionStarted,
    compatibilityClaimed: metadata.compatibilityClaimed
  });
}

function createFormActionEventExtractionMetadata(sourceRecord) {
  const metadata = sourceRecord.intent.actionMetadata;

  return freezeRecord({
    metadataOnly: true,
    sourceGateId: sourceRecord.gateId,
    sourceRequestId: sourceRecord.requestId,
    sourceRequestSequence: sourceRecord.requestSequence,
    sourceRequestType: sourceRecord.requestType,
    sourceStatus: sourceRecord.status,
    sourceMetadataOnly: metadata.metadataOnly,
    eventName: metadata.eventName,
    submissionTrigger: metadata.submissionTrigger,
    requestSubmitWouldDispatchSubmitEvent:
      metadata.requestSubmitWouldDispatchSubmitEvent,
    consumedSubmitRequestSubmitActionMetadata: true,
    wouldExtractSubmitEvent: true,
    wouldUseFormActionEventPlugin: true,
    wouldCreateSyntheticEvent: false,
    wouldConstructFormData: false,
    wouldInvokeAction: false,
    wouldStartHostTransition: false,
    sourceDefaultPrevented: sourceRecord.intent.defaultPrevented,
    nativeNavigationWouldBePrevented:
      metadata.nativeNavigationWouldBePrevented,
    pendingStatusWouldBeSet: metadata.pendingStatusWouldBeSet,
    actionInvocationWouldBeScheduled:
      metadata.actionInvocationWouldBeScheduled,
    submitterValueWouldBeIncludedInFormData:
      metadata.submitterValueWouldBeIncludedInFormData,
    formPropsRead: false,
    submitterPropsRead: false,
    submitterAttributeRead: false,
    rawFormCaptured: false,
    rawEventCaptured: false,
    rawSubmitterCaptured: false,
    nativeEventInspected: false,
    targetInspected: false,
    currentTargetInspected: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    defaultPreventedByGate: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function getDefaultResetOrderingKind(intent) {
  if (intent && intent.resetSource === 'action-completion') {
    return 'action-completion-reset-before-action';
  }
  if (intent && intent.formOwnership === 'not-react-owned') {
    return 'previous-dispatcher-fallback';
  }
  if (intent && intent.resetSource === 'requestFormReset') {
    return 'current-dispatcher-react-owned-first';
  }
  return 'unknown';
}

function createFormActionResetDispatcherOrdering(metadata) {
  const actionCompletionResetBeforeAction =
    metadata.orderingKind === 'action-completion-reset-before-action' ||
    metadata.resetSource === 'action-completion';

  return freezeRecord({
    metadataOnly: true,
    orderingKind: metadata.orderingKind,
    dispatcherKey: metadata.dispatcherKey,
    resetSource: metadata.resetSource,
    formOwnership: metadata.formOwnership,
    transitionContext: metadata.transitionContext,
    steps: formActionResetDispatcherOrderingSteps,
    publicRequestFormResetCallsCurrentDispatcherFirst:
      metadata.resetSource === 'requestFormReset',
    domDispatcherChecksReactFormOwnershipBeforeFallback: true,
    previousDispatcherFallbackWouldFollowOwnershipMiss: true,
    actionCompletionRequestsResetBeforeActionInvocation:
      actionCompletionResetBeforeAction,
    resetStateWouldBeQueuedBeforeCommit:
      metadata.transitionContext !== 'none',
    commitResetWouldRunAfterMutationEffects: true,
    formCaptured: false,
    rawDispatcherArgumentCaptured: false,
    realFormInspected: false,
    formFiberResolved: false,
    previousDispatcherCalled: false,
    resetStateQueued: false,
    actionInvoked: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function getIntentStringProperty(contract, record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidFormActionResetDispatcherIntent(
    contract,
    `${key} must be a non-empty string`
  );
}

function getIntentEnumProperty(contract, record, key, allowedValues, fallback) {
  const value = getIntentStringProperty(contract, record, key, fallback);
  if (allowedValues.includes(value)) {
    return value;
  }

  throwInvalidFormActionResetDispatcherIntent(
    contract,
    `${key} must be one of ${allowedValues.join(', ')}`
  );
}

function getIntentBooleanProperty(contract, record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'boolean') {
    return value;
  }

  throwInvalidFormActionResetDispatcherIntent(
    contract,
    `${key} must be a boolean`
  );
}

function createFormActionResetDispatcherBoundary(contract, normalizedIntent) {
  return freezeRecord({
    gateId: privateFormActionResetDispatcherGateId,
    gateStatus: privateFormActionResetDispatcherStatus,
    intentKind: contract.intentKind,
    contractId: contract.id,
    eventName: contract.eventName,
    dispatcherName: contract.dispatcherName,
    privateDispatcherKey: contract.privateDispatcherKey,
    recordsIntentMetadata: true,
    recordsSubmitRequestSubmitActionMetadata:
      contract.intentKind === 'submission',
    recordsResetDispatcherOrdering: contract.intentKind === 'reset',
    formCaptured: normalizedIntent.formCaptured,
    submissionTrigger:
      contract.intentKind === 'submission'
        ? normalizedIntent.submissionTrigger
        : null,
    resetDispatcherOrdering:
      contract.intentKind === 'reset'
        ? normalizedIntent.resetDispatcherOrdering
        : null,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    defaultPrevented: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createFormActionEventExtractionBoundary(contract, sourceRecord) {
  return freezeRecord({
    gateId: privateFormActionEventExtractionGateId,
    gateStatus: privateFormActionEventExtractionStatus,
    contractId: contract.id,
    sourceContractId: contract.sourceContractId,
    sourceRecordType: privateFormActionResetDispatcherRecordType,
    sourceGateId: sourceRecord.gateId,
    sourceStatus: sourceRecord.status,
    sourceIntentKind: sourceRecord.intentKind,
    eventName: contract.eventName,
    submissionTrigger: sourceRecord.intent.submissionTrigger,
    consumesSubmitRequestSubmitActionMetadata: true,
    recordsEventExtractionMetadata: true,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    formCaptured: false,
    rawEventCaptured: false,
    rawActionCaptured: false,
    nativeEventInspected: false,
    realFormInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    defaultPrevented: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    resetStateQueued: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function normalizeFormActionResetQueueCommitAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidFormActionResetQueueCommitAdmission(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwInvalidFormActionResetQueueCommitAdmission(
      'explicitAdmission must be true'
    );
  }

  assertNoRawFormActionResetQueueCommitFields(admission);

  const queueSource = getResetQueueCommitAdmissionEnumProperty(
    admission,
    'queueSource',
    formActionResetQueueSources,
    'requestFormResetOnFiber'
  );
  const queueKind = getResetQueueCommitAdmissionStringProperty(
    admission,
    'queueKind',
    'metadata-only-reset-state-queue'
  );
  if (queueKind !== 'metadata-only-reset-state-queue') {
    throwInvalidFormActionResetQueueCommitAdmission(
      'queueKind must be metadata-only-reset-state-queue'
    );
  }

  const commitKind = getResetQueueCommitAdmissionStringProperty(
    admission,
    'commitKind',
    'after-mutation-form-reset-order'
  );
  if (commitKind !== 'after-mutation-form-reset-order') {
    throwInvalidFormActionResetQueueCommitAdmission(
      'commitKind must be after-mutation-form-reset-order'
    );
  }

  const hostTag = getResetQueueCommitAdmissionStringProperty(
    admission,
    'hostTag',
    'form'
  );
  if (hostTag !== 'form') {
    throwInvalidFormActionResetQueueCommitAdmission('hostTag must be form');
  }

  return freezeRecord({
    explicitAdmission: true,
    queueSource,
    queueKind,
    commitKind,
    hostTag,
    metadataOnly: true,
    deterministicMetadataOnly: true,
    rawFormCaptured: false,
    rawFiberCaptured: false,
    rawQueueCaptured: false,
    rawHostInstanceCaptured: false,
    realFormInspected: false,
    formFiberResolved: false,
    previousDispatcherCalled: false,
    resetStateHookCaptured: false,
    resetStateQueueCaptured: false,
    updateLaneCaptured: false,
    updateObjectCaptured: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function assertNoRawFormActionResetQueueCommitFields(admission) {
  for (const field of [
    'form',
    'formElement',
    'formFiber',
    'fiber',
    'alternate',
    'stateHook',
    'resetStateHook',
    'queue',
    'resetStateQueue',
    'update',
    'lane',
    'root',
    'finishedWork',
    'hostInstance',
    'instance',
    'domNode',
    'dispatcher',
    'previousDispatcher'
  ]) {
    if (hasOwnProp(admission, field)) {
      throwInvalidFormActionResetQueueCommitAdmission(
        `${field} must not be passed to the queue/commit metadata gate`
      );
    }
  }
}

function getResetQueueCommitAdmissionStringProperty(record, key, fallback) {
  if (!hasOwnProp(record, key)) {
    return fallback;
  }

  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwInvalidFormActionResetQueueCommitAdmission(
    `${key} must be a non-empty string`
  );
}

function getResetQueueCommitAdmissionEnumProperty(
  record,
  key,
  allowedValues,
  fallback
) {
  const value = getResetQueueCommitAdmissionStringProperty(
    record,
    key,
    fallback
  );
  if (allowedValues.includes(value)) {
    return value;
  }

  throwInvalidFormActionResetQueueCommitAdmission(
    `${key} must be one of ${allowedValues.join(', ')}`
  );
}

function createFormActionResetQueueCommitSourceReset(sourceReset) {
  return freezeRecord({
    requestId: sourceReset.requestId,
    requestSequence: sourceReset.requestSequence,
    requestType: sourceReset.requestType,
    status: sourceReset.status,
    dispatcherKey: sourceReset.intent.dispatcherKey,
    resetSource: sourceReset.intent.resetSource,
    orderingKind: sourceReset.intent.orderingKind,
    formOwnership: sourceReset.intent.formOwnership,
    transitionContext: sourceReset.intent.transitionContext,
    resetWouldBeRequested: sourceReset.intent.resetWouldBeRequested,
    resetStateWouldBeQueued: sourceReset.intent.resetStateWouldBeQueued,
    resetCommitWouldRun: sourceReset.intent.resetCommitWouldRun,
    realFormInspected: false,
    formFiberResolved: false,
    previousDispatcherCalled: false,
    resetStateQueued: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function createFormActionResetQueueBoundary(sourceReset, admission) {
  return freezeRecord({
    status: 'blocked-private-form-reset-state-queue',
    sourceResetRequestId: sourceReset.requestId,
    sourceResetRequestSequence: sourceReset.requestSequence,
    sourceResetOrderingKind: sourceReset.intent.orderingKind,
    queueSource: admission.queueSource,
    queueKind: admission.queueKind,
    hostTag: admission.hostTag,
    resetStateWouldBeQueued:
      sourceReset.intent.resetStateWouldBeQueued,
    queuePhases: freezeArray([
      'ensureFormComponentIsStateful',
      'reset-state-hook',
      'dispatchSetStateInternal'
    ]),
    statefulHostComponentWouldBeEnsured: true,
    resetStateHookWouldBeUsed: true,
    resetStateObjectWouldChange: true,
    updateLaneWouldBeRequested: true,
    renderWouldDetectResetStateChange: true,
    formResetFlagWouldBeMarked: true,
    rawFormCaptured: false,
    rawFiberCaptured: false,
    realFormInspected: false,
    formFiberResolved: false,
    stateHookCreated: false,
    resetStateHookResolved: false,
    resetStateQueueResolved: false,
    updateLaneRequested: false,
    resetUpdateEnqueued: false,
    reactUpdateQueued: false,
    renderFormResetFlagMarked: false,
    previousDispatcherCalled: false,
    compatibilityClaimed: false
  });
}

function createFormActionResetCommitBoundary(sourceReset, admission) {
  return freezeRecord({
    status: 'blocked-private-form-reset-after-mutation-commit',
    sourceResetRequestId: sourceReset.requestId,
    sourceResetRequestSequence: sourceReset.requestSequence,
    commitKind: admission.commitKind,
    hostTag: admission.hostTag,
    commitOrderPhases: formActionResetQueueCommitPhases,
    resetFlagWouldBeDetectedDuringMutationEffects: true,
    needsFormResetWouldBeSet: true,
    resetTraversalWouldRunAfterMutationEffects: true,
    defaultValueUpdatesWouldPrecedeReset: true,
    resetFormInstanceWouldCallFormReset: true,
    afterMutationEffectsVisited: false,
    recursivelyResetFormsCalled: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false
  });
}

function createPublicFormActionResetQueueCommitBoundary() {
  return freezeRecord({
    status: 'blocked-public-form-reset-queue-commit',
    publicFormActionsEnabled: false,
    publicRequestFormResetReachable: false,
    publicRootTouched: false,
    realFormAccepted: false,
    realFormInspected: false,
    reactUpdateQueued: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function throwInvalidFormActionResetDispatcherIntent(contract, reason) {
  const error = new Error(
    `Invalid private React DOM form action/reset dispatcher intent for ${contract.id}: ${reason}.`
  );
  error.name = 'FastReactDomFormActionResetDispatcherGateError';
  error.code = privateFormActionResetDispatcherInvalidIntentCode;
  error.compatibilityTarget = compatibilityTarget;
  error.contractId = contract.id;
  error.intentKind = contract.intentKind;
  error.reason = reason;
  throw error;
}

function throwInvalidFormActionEventExtractionRecord(reason, sourceRecord) {
  const error = new Error(
    `Invalid private React DOM form action event-extraction source record: ${reason}.`
  );
  error.name = 'FastReactDomFormActionEventExtractionGateError';
  error.code = privateFormActionEventExtractionInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  if (sourceRecord != null) {
    error.sourceRequestId = sourceRecord.requestId;
    error.sourceRequestSequence = sourceRecord.requestSequence;
    error.sourceRequestType = sourceRecord.requestType;
    error.sourceStatus = sourceRecord.status;
  }
  throw error;
}

function throwInvalidFormActionResetQueueCommitAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM form reset queue/commit admission: ${reason}.`
  );
  error.name = 'FastReactDomFormActionResetQueueCommitGateError';
  error.code = privateFormActionResetQueueCommitInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidResourceHintFakeDomInsertionAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM resource hint fake DOM insertion admission: ${reason}.`
  );
  error.name = 'FastReactDomResourceHintFakeDomInsertionGateError';
  error.code = privateResourceHintFakeDomInsertionInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidResourceHintFakeDomAdapterAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM resource hint fake DOM adapter admission: ${reason}.`
  );
  error.name = 'FastReactDomResourceHintFakeDomAdapterGateError';
  error.code = privateResourceHintFakeDomAdapterInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidResourceHintHeadBoundaryAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM resource hint head singleton boundary admission: ${reason}.`
  );
  error.name = 'FastReactDomResourceHintHeadBoundaryGateError';
  error.code = privateResourceHintHeadBoundaryInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidResourceHintHeadClearRetainAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM resource hint head clear/retain admission: ${reason}.`
  );
  error.name = 'FastReactDomResourceHintHeadClearRetainGateError';
  error.code = privateResourceHintHeadClearRetainInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidResourceHintPreloadPreinitOrderAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM resource hint preload/preinit order admission: ${reason}.`
  );
  error.name = 'FastReactDomResourceHintPreloadPreinitOrderGateError';
  error.code = privateResourceHintPreloadPreinitOrderInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidResourceHintStylesheetPrecedenceAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM resource hint stylesheet precedence admission: ${reason}.`
  );
  error.name = 'FastReactDomResourceHintStylesheetPrecedenceGateError';
  error.code = privateResourceHintStylesheetPrecedenceInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidResourceHintResourceMapCommitAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM resource hint resource-map commit admission: ${reason}.`
  );
  error.name = 'FastReactDomResourceHintResourceMapCommitGateError';
  error.code = privateResourceHintResourceMapCommitInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidResourceHintStylesheetLoadErrorStateAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM resource hint stylesheet load/error state admission: ${reason}.`
  );
  error.name = 'FastReactDomResourceHintStylesheetLoadErrorStateGateError';
  error.code = privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function normalizeControlledInputValueTrackerFakeDomAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidControlledInputValueTrackerFakeDomAdmission(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwInvalidControlledInputValueTrackerFakeDomAdmission(
      'explicitAdmission must be true'
    );
  }

  const adapterKind = getAdmissionStringProperty(
    admission,
    'adapterKind',
    'deterministic-fake-dom'
  );
  if (adapterKind !== 'deterministic-fake-dom') {
    throwInvalidControlledInputValueTrackerFakeDomAdmission(
      'adapterKind must be deterministic-fake-dom'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'controlled-input-value-tracker'
  );
  if (targetKind !== 'controlled-input-value-tracker') {
    throwInvalidControlledInputValueTrackerFakeDomAdmission(
      'targetKind must be controlled-input-value-tracker'
    );
  }

  const fakeTarget = admission.fakeTarget;
  if (
    (typeof fakeTarget !== 'object' && typeof fakeTarget !== 'function') ||
    fakeTarget === null
  ) {
    throwInvalidControlledInputValueTrackerFakeDomAdmission(
      'fakeTarget must be an object'
    );
  }

  if (!isExplicitControlledInputValueTrackerFakeDomTarget(fakeTarget)) {
    throwInvalidControlledInputValueTrackerFakeDomAdmission(
      'fakeTarget must carry the private fake DOM marker'
    );
  }

  if (isDomLikeControlledInputValueTrackerTarget(fakeTarget)) {
    throwInvalidControlledInputValueTrackerFakeDomAdmission(
      'fakeTarget must not be a DOM-like node'
    );
  }

  return {
    fakeTarget,
    admissionMetadata: freezeRecord({
      adapterKind,
      adapterId: getAdmissionStringProperty(
        admission,
        'adapterId',
        'anonymous-fake-dom-controlled-value-tracker'
      ),
      targetKind,
      explicitAdmission: true,
      deterministicFakeDomOnly: true,
      rawTargetCaptured: false,
      realDomNodeAccepted: false,
      propertyDescriptorInstallationAllowed: false,
      publicControlledBehaviorEnabled: false,
      compatibilityClaimed: false
    })
  };
}

function isExplicitControlledInputValueTrackerFakeDomTarget(fakeTarget) {
  try {
    return fakeTarget[controlledInputValueTrackerFakeDomTargetMarker] === true;
  } catch (error) {
    return false;
  }
}

function isDomLikeControlledInputValueTrackerTarget(fakeTarget) {
  try {
    return (
      typeof fakeTarget.nodeType === 'number' ||
      fakeTarget.ownerDocument != null ||
      typeof fakeTarget.addEventListener === 'function' ||
      typeof fakeTarget.removeEventListener === 'function'
    );
  } catch (error) {
    return true;
  }
}

function readControlledInputValueTrackerFakeDomSnapshot(fakeTarget, contract) {
  if (contract.hostTag === 'input' && contract.controlKind === 'checked') {
    return fakeTarget.checked === true ? 'true' : 'false';
  }

  if (contract.hostTag === 'select' && contract.controlKind === 'multiple') {
    const selectedValues = hasOwnProp(fakeTarget, 'selectedValues')
      ? fakeTarget.selectedValues
      : fakeTarget.value;
    return coerceControlledInputValueTrackerFakeDomArraySnapshot(
      selectedValues
    );
  }

  const value = fakeTarget.value;
  if (Array.isArray(value)) {
    return coerceControlledInputValueTrackerFakeDomArraySnapshot(value);
  }
  return coerceControlledInputValueTrackerFakeDomStringSnapshot(value);
}

function coerceControlledInputValueTrackerFakeDomArraySnapshot(value) {
  if (!Array.isArray(value)) {
    return freezeArray([
      coerceControlledInputValueTrackerFakeDomStringSnapshot(value)
    ]);
  }

  return freezeArray(
    value.map((item) =>
      coerceControlledInputValueTrackerFakeDomStringSnapshot(item)
    )
  );
}

function coerceControlledInputValueTrackerFakeDomStringSnapshot(value) {
  if (value == null) {
    return '';
  }

  try {
    return String(value);
  } catch (error) {
    throwInvalidControlledInputValueTrackerFakeDomAdmission(
      'fakeTarget value could not be coerced to a string'
    );
  }
}

function areControlledInputValueSnapshotsEqual(previous, next) {
  if (Array.isArray(previous) || Array.isArray(next)) {
    if (!Array.isArray(previous) || !Array.isArray(next)) {
      return false;
    }
    if (previous.length !== next.length) {
      return false;
    }
    for (let index = 0; index < previous.length; index++) {
      if (previous[index] !== next[index]) {
        return false;
      }
    }
    return true;
  }

  return previous === next;
}

function createControlledInputValueTrackerFakeDomDiagnosticMetadata(
  contract,
  normalized,
  currentValueSnapshot,
  attached
) {
  return freezeRecord({
    gateId: controlledInputValueTrackerGateId,
    diagnosticGateId: controlledInputValueTrackerFakeDomDiagnosticGateId,
    contractId: contract.id,
    hostTag: contract.hostTag,
    controlKind: contract.controlKind,
    trackedField: contract.trackedField,
    valueKind: contract.valueKind,
    expectedPropKeys: contract.expectedPropKeys,
    observedPropKeys: normalized.props.propKeys,
    propSummary: normalized.props.controlledPropSummary,
    deterministicFakeDomOnly: true,
    liveHostNodeRequired: false,
    rawTargetCaptured: false,
    realDomNodeTouched: false,
    propertyDescriptorInstalled: false,
    trackerAttached: attached,
    currentValueSnapshot
  });
}

function createControlledInputValueTrackerFakeDomDiagnosticSideEffects(
  operation
) {
  return freezeRecord({
    ...controlledInputValueTrackerFakeDomDiagnosticNoSideEffects,
    fakeDomTrackerRecordInstalled: operation === 'install',
    fakeDomTrackerRecordObserved: operation === 'observe',
    fakeDomTrackerRecordDetached: operation === 'detach',
    fakeDomValueRead: operation === 'install' || operation === 'observe'
  });
}

function getControlledInputValueTrackerFakeDomDiagnosticOperationStatus(
  operation
) {
  switch (operation) {
    case 'install':
      return controlledInputValueTrackerFakeDomInstalledStatus;
    case 'observe':
      return controlledInputValueTrackerFakeDomObservedStatus;
    case 'detach':
      return controlledInputValueTrackerFakeDomDetachedStatus;
    default:
      return controlledInputValueTrackerFakeDomDiagnosticStatus;
  }
}

function throwInvalidControlledInputValueTrackerFakeDomAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM controlled input fake DOM value-tracker diagnostic admission: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputValueTrackerGateError';
  error.code =
    privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function normalizeControlledInputPrivateRestoreQueueAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidControlledInputPrivateRestoreQueueAdmission(
      'admission metadata must be an object'
    );
  }

  if (admission.explicitAdmission !== true) {
    throwInvalidControlledInputPrivateRestoreQueueAdmission(
      'explicitAdmission must be true'
    );
  }

  const queueKind = getAdmissionStringProperty(
    admission,
    'queueKind',
    'deterministic-fake-dom-post-event-restore-queue'
  );
  if (queueKind !== 'deterministic-fake-dom-post-event-restore-queue') {
    throwInvalidControlledInputPrivateRestoreQueueAdmission(
      'queueKind must be deterministic-fake-dom-post-event-restore-queue'
    );
  }

  const targetKind = getAdmissionStringProperty(
    admission,
    'targetKind',
    'controlled-input-restore-queue'
  );
  if (targetKind !== 'controlled-input-restore-queue') {
    throwInvalidControlledInputPrivateRestoreQueueAdmission(
      'targetKind must be controlled-input-restore-queue'
    );
  }

  return freezeRecord({
    queueKind,
    queueId: getAdmissionStringProperty(
      admission,
      'queueId',
      'anonymous-fake-dom-controlled-restore-queue'
    ),
    eventName: getAdmissionStringProperty(
      admission,
      'eventName',
      'change'
    ),
    targetKind,
    explicitAdmission: true,
    deterministicFakeDomOnly: true,
    sourceObservationRequired: true,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    realDomNodeAccepted: false,
    latestPropsLookupAllowed: false,
    eventDispatchAllowed: false,
    restoreQueueWriteAllowed: false,
    restoreFlushAllowed: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function throwInvalidControlledInputPrivateRestoreQueueAdmission(reason) {
  const error = new Error(
    `Invalid private React DOM controlled input restore queue diagnostic admission: ${reason}.`
  );
  error.name = 'FastReactDomControlledInputRestoreQueueDiagnosticGateError';
  error.code = privateControlledInputRestoreQueueDiagnosticInvalidAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function normalizeControlledInputValueTrackerScenario(scenario) {
  if (scenario == null || typeof scenario !== 'object') {
    throwInvalidControlledInputValueTrackerScenario(
      'Controlled value-tracker scenarios must be metadata records.'
    );
  }

  const hostTag = getScenarioStringProperty(scenario, 'hostTag', null);
  if (
    hostTag !== 'input' &&
    hostTag !== 'select' &&
    hostTag !== 'textarea'
  ) {
    throwInvalidControlledInputValueTrackerScenario(
      'Controlled value-tracker scenarios require input, select, or textarea host tags.'
    );
  }

  const inputType = getScenarioStringProperty(
    scenario,
    'inputType',
    hostTag === 'input' ? 'text' : null
  );
  const multiple = getScenarioBooleanProperty(scenario, 'multiple', false);
  const controlKind = getScenarioStringProperty(
    scenario,
    'controlKind',
    inferControlledInputValueTrackerControlKind(
      hostTag,
      inputType,
      multiple
    )
  );

  return freezeRecord({
    scenarioId: getScenarioStringProperty(
      scenario,
      'scenarioId',
      `${hostTag}-${controlKind}-metadata`
    ),
    phaseId: getScenarioStringProperty(scenario, 'phaseId', 'unknown'),
    hostTag,
    inputType,
    multiple,
    controlKind,
    props: describeControlledInputValueTrackerProps(scenario.props)
  });
}

function normalizeControlledInputPrivateWrapperPropertyPayloadRow(row) {
  if (row == null || typeof row !== 'object') {
    throwInvalidControlledInputValueTrackerScenario(
      'Controlled wrapper property payload rows must be metadata records.'
    );
  }

  const hostTag = getScenarioStringProperty(row, 'hostTag', null);
  if (
    hostTag !== 'input' &&
    hostTag !== 'select' &&
    hostTag !== 'textarea'
  ) {
    throwInvalidControlledInputValueTrackerScenario(
      'Controlled wrapper property payload rows require input, select, or textarea host tags.'
    );
  }

  const propName = getScenarioStringProperty(row, 'propName', null);
  if (propName === null) {
    throwInvalidControlledInputValueTrackerScenario(
      'Controlled wrapper property payload rows require a propName.'
    );
  }

  const props = describeControlledInputValueTrackerProps(row.props);
  const inputType = getScenarioStringProperty(
    row,
    'inputType',
    getControlledInputPrivateWrapperInputType(hostTag, row.props)
  );
  const multiple = getScenarioBooleanProperty(
    row,
    'multiple',
    getControlledInputPrivateWrapperMultiple(hostTag, row.props)
  );
  const controlKind = getScenarioStringProperty(
    row,
    'controlKind',
    inferControlledInputPrivateWrapperControlKind(
      hostTag,
      propName,
      inputType,
      multiple
    )
  );

  return freezeRecord({
    hostTag,
    propName,
    inputType,
    multiple,
    controlKind,
    props
  });
}

function inferControlledInputValueTrackerControlKind(
  hostTag,
  inputType,
  multiple
) {
  if (hostTag === 'input') {
    return inputType === 'checkbox' || inputType === 'radio'
      ? 'checked'
      : 'value';
  }

  if (hostTag === 'select') {
    return multiple ? 'multiple' : 'single';
  }

  return 'value';
}

function inferControlledInputPrivateWrapperControlKind(
  hostTag,
  propName,
  inputType,
  multiple
) {
  if (
    hostTag === 'input' &&
    (propName === 'checked' || propName === 'defaultChecked')
  ) {
    return 'checked';
  }

  return inferControlledInputValueTrackerControlKind(
    hostTag,
    inputType,
    multiple
  );
}

function getControlledInputPrivateWrapperInputType(hostTag, props) {
  if (hostTag !== 'input') {
    return null;
  }

  if (hasOwnProp(props, 'type')) {
    try {
      const type = props.type;
      return typeof type === 'string' && type.length > 0 ? type : 'text';
    } catch (error) {
      return 'text';
    }
  }

  return 'text';
}

function getControlledInputPrivateWrapperMultiple(hostTag, props) {
  if (hostTag !== 'select') {
    return false;
  }

  if (hasOwnProp(props, 'multiple')) {
    try {
      return props.multiple === true;
    } catch (error) {
      return false;
    }
  }

  return false;
}

function describeControlledInputValueTrackerProps(props) {
  if (props == null) {
    return freezeRecord({
      source: describeValue(props),
      enumerableKeysAvailable: true,
      propKeys: freezeArray([]),
      controlledPropSummary: freezeRecord({})
    });
  }

  const propsType = typeof props;
  if (propsType !== 'object' && propsType !== 'function') {
    return freezeRecord({
      source: describeValue(props),
      enumerableKeysAvailable: false,
      propKeys: null,
      controlledPropSummary: freezeRecord({})
    });
  }

  let propKeys;
  try {
    propKeys = Object.keys(props);
  } catch (error) {
    return freezeRecord({
      source: describeValue(props),
      enumerableKeysAvailable: false,
      propKeys: null,
      controlledPropSummary: freezeRecord({})
    });
  }

  return freezeRecord({
    source: describeValue(props),
    enumerableKeysAvailable: true,
    propKeys: freezeArray(propKeys),
    controlledPropSummary:
      summarizeControlledInputValueTrackerProps(props)
  });
}

function summarizeControlledInputValueTrackerProps(props) {
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
    'readOnly',
    'disabled'
  ]) {
    if (hasOwnProp(props, propName)) {
      summary[propName] = describePropValueWithoutRawData(props, propName);
    }
  }
  return freezeRecord(summary);
}

function describePropValueWithoutRawData(props, propName) {
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

function hasOwnProp(value, propName) {
  try {
    return hasOwn.call(value, propName);
  } catch (error) {
    return false;
  }
}

function createControlledInputValueTrackerMetadata(contract, normalized) {
  return freezeRecord({
    gateId: controlledInputValueTrackerGateId,
    contractId: contract.id,
    hostTag: contract.hostTag,
    controlKind: contract.controlKind,
    trackedField: contract.trackedField,
    valueKind: contract.valueKind,
    expectedPropKeys: contract.expectedPropKeys,
    observedPropKeys: normalized.props.propKeys,
    propSummary: normalized.props.controlledPropSummary,
    deterministicMetadataOnly: true,
    liveHostNodeRequired: false,
    rawTargetCaptured: false,
    trackerAttached: false,
    currentValueSnapshot: null
  });
}

function createControlledInputPrivateWrapperMetadata(
  contract,
  trackerContract,
  normalized
) {
  return freezeRecord({
    gateId: controlledInputPrivateWrapperGateId,
    contractId: contract.id,
    hostTag: contract.hostTag,
    propName: contract.propName,
    wrapperKind: contract.wrapperKind,
    wrapperOperations: contract.wrapperOperations,
    wrapperPropNames: contract.wrapperPropNames,
    valueTrackerGateId: controlledInputValueTrackerGateId,
    valueTrackerContractId: trackerContract.id,
    trackedField: trackerContract.trackedField,
    valueKind: trackerContract.valueKind,
    observedPropKeys: normalized.props.propKeys,
    propSummary: normalized.props.controlledPropSummary,
    deterministicMetadataOnly: true,
    propertyPayloadRowAccepted: false,
    ordinaryPayloadAccepted: false,
    sourceAdapterInvoked: false,
    liveHostNodeRequired: false,
    rawTargetCaptured: false,
    hostWrapperInvoked: false,
    wrapperValidationInvoked: false,
    wrapperPropertyWritten: false,
    trackerAttached: false,
    currentValueSnapshot: null
  });
}

function createControlledInputPrivateRestoreQueueObservationSummary(
  observation
) {
  return freezeRecord({
    sourceGateId: observation.gateId,
    sourceRecordType:
      privateControlledInputValueTrackerFakeDomDiagnosticRecordType,
    lifecycleId: observation.lifecycleId,
    lifecycleSequence: observation.lifecycleSequence,
    operation: observation.operation,
    operationStatus: observation.status,
    operationRequestId: observation.requestId,
    operationRequestSequence: observation.requestSequence,
    fakeDomOnly: observation.trackerRecord.fakeDomOnly,
    trackerAttached: observation.trackerRecord.attachedAfter,
    propertyDescriptorInstalled:
      observation.trackerRecord.propertyDescriptorInstalled,
    changed: observation.trackerRecord.changed,
    observedCount: observation.trackerRecord.observedCount,
    trackedField: observation.trackerMetadata.trackedField,
    valueKind: observation.trackerMetadata.valueKind,
    previousValueSnapshot: observation.trackerRecord.previousValueSnapshot,
    currentValueSnapshot: observation.trackerRecord.currentValueSnapshot,
    rawTargetCaptured: false,
    realDomNodeTouched: false
  });
}

function createControlledInputPrivateRestoreQueueIntentSummary(
  observation,
  admission,
  intentRecorded
) {
  return freezeRecord({
    source: 'fake-dom-tracker-observation',
    queueKind: admission.queueKind,
    queueId: admission.queueId,
    eventName: admission.eventName,
    hostTag: observation.hostTag,
    controlKind: observation.controlKind,
    trackedField: observation.trackerMetadata.trackedField,
    sourceChanged: observation.trackerRecord.changed,
    intentRecorded,
    restoreTargetWouldBeQueued: intentRecorded,
    queuePosition: intentRecorded ? 'primary' : null,
    latestPropsLookupRequired: intentRecorded,
    latestPropsLookupPerformed: false,
    eventPluginDispatchRequired: intentRecorded,
    eventPluginDispatchPerformed: false,
    restoreQueueWritten: false,
    restoreStateIfNeededInvoked: false,
    restoreControlledStateInvoked: false,
    restoreFlushed: false,
    fakeDomOnly: true,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    realDomNodeTouched: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function createPostEventRestoreQueueDiagnosticBoundary(
  status,
  intentRecorded
) {
  return freezeRecord({
    status: 'blocked-post-event-controlled-restore',
    restoreQueueDiagnosticStatus: status,
    restoreIntentRecorded: intentRecorded,
    latestPropsLookup: false,
    eventPluginDispatch: false,
    restoreQueued: false,
    restoreFlushed: false,
    compatibilityClaimed: false
  });
}

function createControlledInputPrivateRestoreQueueDiagnosticSideEffects(
  intentRecorded
) {
  return freezeRecord({
    ...controlledInputPrivateRestoreQueueDiagnosticNoSideEffects,
    fakeDomTrackerObservationAccepted: true,
    fakeDomRestoreIntentRecorded: intentRecorded,
    fakeDomRestoreIntentSkipped: !intentRecorded,
    restoreQueueRecordCreated: true
  });
}

function createPostEventRestoreBoundary() {
  return freezeRecord({
    status: 'blocked-post-event-controlled-restore',
    latestPropsLookup: false,
    eventPluginDispatch: false,
    restoreQueued: false,
    restoreFlushed: false,
    compatibilityClaimed: false
  });
}

function createControlledInputLiveRestorePreflightBoundary() {
  return freezeRecord({
    status: 'blocked-live-controlled-restore-mutation-preflight',
    preflightOnly: true,
    acceptsLiveDomNodePreflight: true,
    liveDomTargetCaptured: false,
    latestPropsLookup: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    wrapperWritePerformed: false,
    valueTrackerFieldWritten: false,
    propertyDescriptorInstalled: false,
    hostValueRead: false,
    hostValueWritten: false,
    browserInputMutated: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
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

function getScenarioStringProperty(record, key, fallback) {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function getScenarioBooleanProperty(record, key, fallback) {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
}

function throwInvalidControlledInputValueTrackerScenario(message) {
  const error = new Error(message);
  error.name = 'FastReactDomControlledInputValueTrackerGateError';
  error.code = privateControlledInputValueTrackerGateInvalidScenarioCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function describeArgumentList(args) {
  if (args == null) {
    return freezeRecord({
      count: 0,
      values: freezeArray([])
    });
  }

  if (!Array.isArray(args)) {
    return freezeRecord({
      count: 1,
      values: freezeArray([describeValue(args)])
    });
  }

  return freezeRecord({
    count: args.length,
    values: freezeArray(args.map(describeValue))
  });
}

function describeValue(value) {
  if (value === null) {
    return freezeRecord({type: 'null'});
  }

  const valueType = typeof value;
  if (valueType === 'undefined') {
    return freezeRecord({type: 'undefined'});
  }

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

  if (valueType === 'bigint') {
    return freezeRecord({type: 'bigint'});
  }

  if (valueType === 'symbol') {
    return freezeRecord({type: 'symbol'});
  }

  if (valueType === 'function') {
    return freezeRecord({type: 'function'});
  }

  return freezeRecord({type: 'object'});
}

function createGateState(options) {
  return createGateStateWithDefaultPrefix(
    options,
    'resource-form-action-gate'
  );
}

function createGateStateWithDefaultPrefix(options, defaultRequestIdPrefix) {
  return {
    requestIdPrefix: getStringOption(
      options,
      'requestIdPrefix',
      defaultRequestIdPrefix
    ),
    nextRequestSequence: 1
  };
}

function getStringOption(options, key, fallback) {
  if (options == null) {
    return fallback;
  }

  const value = options[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function indexContracts(behaviorArea, contracts) {
  for (const contract of contracts) {
    contractByAreaAndName.set(
      `${behaviorArea}:${contract.requestName}`,
      contract
    );
  }
}

function indexControlledInputValueTrackerContracts() {
  for (const contract of controlledInputValueTrackerContracts) {
    controlledInputValueTrackerContractByKey.set(
      `${contract.hostTag}:${contract.controlKind}`,
      contract
    );
  }
}

function indexControlledInputPrivateWrapperPropertyPayloadContracts() {
  for (const contract of controlledInputPrivateWrapperPropertyPayloadContracts) {
    controlledInputPrivateWrapperContractByKey.set(
      `${contract.hostTag}:${contract.propName}`,
      contract
    );
  }
}

function resourceHintContract(id, publicName, privateDispatcherKey, capability) {
  return freezeRecord({
    id,
    requestName: id,
    publicName,
    privateDispatcherKey,
    hostTag: null,
    capability,
    oracleKind: resourceHintOracleKind
  });
}

function resourceHintDispatcherMetadataContract(
  id,
  publicName,
  privateDispatcherKey,
  argumentNames
) {
  return freezeRecord({
    id,
    requestName: id,
    publicName,
    privateDispatcherKey,
    argumentNames: freezeArray(argumentNames),
    capability: 'react-dom-resource-hint-private-dispatcher',
    oracleKind: resourceHintOracleKind
  });
}

function resourceHintFakeDomAdapterContract(
  id,
  privateDispatcherKey,
  elementTag,
  relationship,
  attributeNames
) {
  return freezeRecord({
    id,
    privateDispatcherKey,
    elementTag,
    relationship,
    attributeNames: freezeArray(attributeNames),
    capability: 'react-dom-resource-hint-fake-dom-adapter',
    oracleKind: resourceHintOracleKind,
    compatibilityClaimed: false
  });
}

function resourceHintFakeDomInsertionContract(
  id,
  privateDispatcherKey,
  elementTag,
  relationship,
  attributeNames
) {
  return freezeRecord({
    id,
    privateDispatcherKey,
    elementTag,
    relationship,
    attributeNames: freezeArray(attributeNames),
    capability: 'react-dom-resource-hint-fake-dom-insertion',
    oracleKind: resourceHintOracleKind,
    deterministicFakeDomOnly: true,
    compatibilityClaimed: false
  });
}

function resourceHintHeadBoundaryContract(
  id,
  resourceContractId,
  privateDispatcherKey,
  elementTag,
  relationship
) {
  return freezeRecord({
    id,
    resourceContractId,
    privateDispatcherKey,
    hostTag: 'head',
    headContractId: 'head-singleton',
    elementTag,
    relationship,
    capability: 'react-dom-resource-hint-head-singleton-boundary',
    oracleKind: resourceHintOracleKind,
    deterministicFakeDomOnly: true,
    compatibilityClaimed: false
  });
}

function resourceHintHeadClearRetainContract(
  id,
  rowType,
  sourceContractId,
  elementTag,
  relationship,
  privateDispatcherKey
) {
  return freezeRecord({
    id,
    rowType,
    sourceContractId,
    privateDispatcherKey,
    hostTag: 'head',
    elementTag,
    relationship,
    capability: 'react-dom-resource-head-clear-retain-diagnostic',
    oracleKind: resourceHintOracleKind,
    deterministicFakeDomOnly: true,
    compatibilityClaimed: false
  });
}

function resourceHintPreloadPreinitOrderContract(
  id,
  sourceContractId,
  privateDispatcherKey,
  elementTag,
  relationship,
  resourceKinds
) {
  return freezeRecord({
    id,
    sourceContractId,
    privateDispatcherKey,
    elementTag,
    relationship,
    resourceKinds: freezeArray(resourceKinds),
    resourceStage:
      sourceContractId === 'preload' || sourceContractId === 'preload-module'
        ? 'preload'
        : 'preinit',
    capability: 'react-dom-resource-preload-preinit-dedupe-order-diagnostic',
    oracleKind: resourceHintOracleKind,
    deterministicFakeDomOnly: true,
    compatibilityClaimed: false
  });
}

function resourceHintStylesheetPrecedenceContract(
  id,
  sourceContractId,
  privateDispatcherKey,
  elementTag,
  relationship,
  resourceKind
) {
  return freezeRecord({
    id,
    sourceContractId,
    privateDispatcherKey,
    elementTag,
    relationship,
    resourceKind,
    hostTag: 'head',
    capability: 'react-dom-resource-stylesheet-precedence-diagnostic',
    oracleKind: resourceHintOracleKind,
    deterministicFakeDomOnly: true,
    compatibilityClaimed: false
  });
}

function resourceHintResourceMapCommitContract(
  id,
  recordKind,
  mapKind,
  resourceKind
) {
  return freezeRecord({
    id,
    recordKind,
    mapKind,
    resourceKind,
    hostTag: 'head',
    capability: 'react-dom-resource-map-commit-diagnostic',
    oracleKind: resourceHintOracleKind,
    deterministicPrivateRecordsOnly: true,
    compatibilityClaimed: false
  });
}


function resourceHintStylesheetLoadErrorStateContract(
  id,
  rowType,
  reactShape,
  trackedFields
) {
  return freezeRecord({
    id,
    rowType,
    reactShape,
    trackedFields: freezeArray(trackedFields),
    sourceRecordType: privateResourceHintStylesheetPrecedenceRecordType,
    hostTag: 'head',
    resourceType: 'stylesheet',
    capability: 'react-dom-resource-stylesheet-load-error-state-diagnostic',
    oracleKind: resourceHintOracleKind,
    deterministicFakeRecordsOnly: true,
    compatibilityClaimed: false
  });
}


function singletonContract(id, hostTag) {
  return freezeRecord({
    id,
    requestName: hostTag,
    publicName: null,
    privateDispatcherKey: null,
    hostTag,
    capability: 'react-dom-host-singleton',
    oracleKind: resourceHintOracleKind
  });
}

function formActionContract(id, publicName, privateDispatcherKey) {
  return freezeRecord({
    id,
    requestName: publicName,
    publicName,
    privateDispatcherKey,
    hostTag: null,
    capability: 'react-dom-form-action',
    oracleKind: formActionsOracleKind
  });
}

function formActionResetDispatcherContract(
  id,
  intentKind,
  eventName,
  dispatcherName,
  privateDispatcherKey
) {
  return freezeRecord({
    id,
    intentKind,
    eventName,
    dispatcherName,
    privateDispatcherKey,
    capability: 'react-dom-form-action-reset-private-dispatcher',
    oracleKind: formActionsOracleKind,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    acceptsActionFunctions: false,
    recordsSubmitRequestSubmitActionMetadata: intentKind === 'submission',
    recordsResetDispatcherOrdering: intentKind === 'reset',
    compatibilityClaimed: false
  });
}

function formActionEventExtractionContract(id, eventName, sourceContractId) {
  return freezeRecord({
    id,
    eventName,
    sourceContractId,
    capability: 'react-dom-form-action-event-extraction',
    oracleKind: formActionsOracleKind,
    acceptedSourceRecordType: privateFormActionResetDispatcherRecordType,
    acceptedSourceStatus: privateFormActionSubmissionIntentRecordedStatus,
    acceptsRealForms: false,
    acceptsRawEvents: false,
    createsSyntheticEvents: false,
    constructsFormData: false,
    invokesActions: false,
    startsHostTransition: false,
    compatibilityClaimed: false
  });
}

function formActionResetQueueCommitContract(
  id,
  sourceIntentKind,
  queueBoundary,
  commitBoundary
) {
  return freezeRecord({
    id,
    sourceIntentKind,
    queueBoundary,
    commitBoundary,
    privateDispatcherKey: 'r',
    hostTag: 'form',
    capability: 'react-dom-form-reset-queue-commit-diagnostic',
    oracleKind: formActionsOracleKind,
    acceptsRealForms: false,
    acceptsFormFibers: false,
    queuesReactUpdates: false,
    commitsFormResets: false,
    callsFormReset: false,
    compatibilityClaimed: false
  });
}

function controlledFormContract(id, hostTag) {
  return freezeRecord({
    id,
    requestName: hostTag,
    publicName: null,
    privateDispatcherKey: null,
    hostTag,
    capability: 'react-dom-controlled-form',
    oracleKind: controlledInputOracleKind
  });
}

function controlledInputValueTrackerContract(
  id,
  hostTag,
  controlKind,
  trackedField,
  valueKind,
  expectedPropKeys
) {
  return freezeRecord({
    id,
    hostTag,
    controlKind,
    trackedField,
    valueKind,
    expectedPropKeys: freezeArray(expectedPropKeys),
    oracleKind: controlledInputOracleKind,
    compatibilityClaimed: false
  });
}

function controlledInputPrivateWrapperPropertyPayloadContract(
  id,
  hostTag,
  propName,
  wrapperKind,
  wrapperOperations,
  wrapperPropNames
) {
  return freezeRecord({
    id,
    hostTag,
    propName,
    wrapperKind,
    wrapperOperations: freezeArray(wrapperOperations),
    wrapperPropNames,
    capability: 'react-dom-controlled-private-wrapper-property-payload',
    oracleKind: controlledInputOracleKind,
    compatibilityClaimed: false
  });
}

function controlledInputValueTrackerCoverage(
  hostTag,
  scenarioCount,
  trackedFields
) {
  return freezeRecord({
    hostTag,
    scenarioCount,
    trackedFields: freezeArray(trackedFields),
    compatibilityClaimed: false
  });
}

function prerequisite(id, area, reason) {
  return freezeRecord({
    id,
    area,
    reason
  });
}

function blockedCapability(id, reason) {
  return freezeRecord({
    id,
    blocked: true,
    reason
  });
}

function oracleEvidence(oracleKind, contractCount) {
  return freezeRecord({
    oracleKind,
    schemaVersion: 1,
    compatibilityClaimed: false,
    fastReactComparedToReactDom: false,
    contractCount
  });
}

function freezeArray(value) {
  return Object.freeze(value);
}

function freezeRecord(value) {
  return Object.freeze(value);
}

module.exports = {
  admitResourceHintFakeDomAdapterRecord,
  controlledFormContracts,
  controlledInputPrivateWrapperGateId,
  controlledInputPrivateWrapperGateSchemaVersion,
  controlledInputPrivateWrapperGateStatus,
  controlledInputPrivateWrapperPropertyPayloadContracts,
  controlledInputPrivateWrapperSideEffects,
  controlledInputPrivateRestoreQueueDiagnosticGateId,
  controlledInputPrivateRestoreQueueDiagnosticGateSchemaVersion,
  controlledInputPrivateRestoreQueueDiagnosticNoSideEffects,
  controlledInputPrivateRestoreQueueDiagnosticStatus,
  controlledInputPrivateRestoreQueueIntentRecordedStatus,
  controlledInputPrivateRestoreQueueIntentSkippedStatus,
  controlledInputValueTrackerContracts,
  controlledInputValueTrackerFakeDomDetachedStatus,
  controlledInputValueTrackerFakeDomDiagnosticGateId,
  controlledInputValueTrackerFakeDomDiagnosticGateSchemaVersion,
  controlledInputValueTrackerFakeDomDiagnosticNoSideEffects,
  controlledInputValueTrackerFakeDomDiagnosticStatus,
  controlledInputValueTrackerFakeDomInstalledStatus,
  controlledInputValueTrackerFakeDomObservedStatus,
  controlledInputValueTrackerFakeDomTargetMarker,
  controlledInputValueTrackerGateId,
  controlledInputValueTrackerGateSchemaVersion,
  controlledInputValueTrackerMissingPrerequisites,
  controlledInputValueTrackerOracleCoverage,
  controlledInputValueTrackerSideEffects,
  createFormActionEventExtractionGate,
  createFormActionResetDispatcherGate,
  createFormActionResetQueueCommitGate,
  createControlledInputPrivateWrapperPropertyPayloadRecord,
  createControlledInputPrivateRestoreQueueDiagnosticGate,
  createControlledInputValueTrackerGate,
  createResourceHintFakeDomAdapterGate,
  createResourceHintFakeDomInsertionGate,
  createResourceHintHeadBoundaryGate,
  createResourceHintHeadClearRetainGate,
  createResourceHintPreloadPreinitOrderGate,
  createResourceHintResourceMapCommitGate,
  createResourceHintStylesheetLoadErrorStateGate,
  createResourceHintStylesheetPrecedenceGate,
  createResourceFormActionInternalsGate,
  createUnsupportedFormActionEventExtractionError,
  createUnsupportedFormActionResetDispatcherError,
  createUnsupportedFormActionResetQueueCommitError,
  createUnsupportedControlledInputValueTrackerError,
  createUnsupportedControlledInputRestoreQueueDiagnosticError,
  createUnsupportedResourceHintFakeDomAdapterError,
  createUnsupportedResourceHintFakeDomInsertionError,
  createUnsupportedResourceHintHeadBoundaryError,
  createUnsupportedResourceHintHeadClearRetainError,
  createUnsupportedResourceHintPreloadPreinitOrderError,
  createUnsupportedResourceHintResourceMapCommitError,
  createUnsupportedResourceHintStylesheetLoadErrorStateError,
  createUnsupportedResourceHintStylesheetPrecedenceError,
  createUnsupportedResourceFormActionInternalsError,
  createUnsupportedResourceHintDispatcherMetadataError,
  describeControlledInputValueTrackerGate,
  describeControlledInputValueTrackerFakeDomDiagnosticGate,
  describeControlledInputPrivateRestoreQueueDiagnosticGate,
  describeControlledInputPrivateWrapperPropertyPayloadGate,
  describePrivateFormActionEventExtractionGate,
  describePrivateFormActionResetDispatcherGate,
  describePrivateFormActionResetQueueCommitGate,
  describePrivateResourceHintFakeDomAdapterGate,
  describePrivateResourceHintFakeDomInsertionGate,
  describePrivateResourceHintHeadBoundaryGate,
  describePrivateResourceHintHeadClearRetainGate,
  describePrivateResourceHintPreloadPreinitOrderGate,
  describePrivateResourceHintResourceMapCommitGate,
  describePrivateResourceHintStylesheetLoadErrorStateGate,
  describePrivateResourceHintStylesheetPrecedenceGate,
  describePrivateResourceHintDispatcherMetadataGate,
  describeResourceFormActionInternalsGate,
  formActionEventExtractionBlockedSideEffects,
  formActionEventExtractionContracts,
  formActionEventExtractionGateSchemaVersion,
  formActionEventExtractionMetadataSideEffects,
  formActionEventExtractionMissingPrerequisites,
  formActionResetDispatcherBlockedSideEffects,
  formActionResetDispatcherContracts,
  formActionResetDispatcherGateSchemaVersion,
  formActionResetDispatcherMissingPrerequisites,
  formActionResetQueueCommitBlockedSideEffects,
  formActionResetQueueCommitContracts,
  formActionResetQueueCommitDiagnosticSideEffects,
  formActionResetQueueCommitGateSchemaVersion,
  formActionResetQueueCommitMissingPrerequisites,
  formActionResetIntentSideEffects,
  formActionSubmissionIntentSideEffects,
  formActionContracts,
  detachControlledInputValueTrackerFakeDomDiagnostic,
  getPrivateControlledInputValueTrackerRecordPayload,
  getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload,
  getPrivateControlledInputRestoreQueueDiagnosticRecordPayload,
  getPrivateControlledInputWrapperPropertyPayloadRecordPayload,
  getPrivateFormActionEventExtractionRecordPayload,
  getPrivateFormActionResetDispatcherRecordPayload,
  getPrivateFormActionResetQueueCommitRecordPayload,
  getPrivateResourceHintFakeDomAdapterAdmissionRecordPayload,
  getPrivateResourceHintFakeDomInsertionRecordPayload,
  getPrivateResourceHintHeadBoundaryRecordPayload,
  getPrivateResourceHintHeadClearRetainRecordPayload,
  getPrivateResourceHintPreloadPreinitOrderRecordPayload,
  getPrivateResourceHintResourceMapCommitRecordPayload,
  getPrivateResourceHintStylesheetLoadErrorStateRecordPayload,
  getPrivateResourceHintStylesheetPrecedenceRecordPayload,
  getPrivateResourceFormActionGateRecordPayload,
  getPrivateResourceHintDispatcherMetadataRecordPayload,
  isPrivateResourceHintFakeDomAdapterAdmissionRecord,
  isPrivateResourceHintFakeDomInsertionRecord,
  isPrivateResourceHintHeadBoundaryRecord,
  isPrivateResourceHintHeadClearRetainRecord,
  isPrivateResourceHintPreloadPreinitOrderRecord,
  isPrivateResourceHintResourceMapCommitRecord,
  isPrivateResourceHintStylesheetLoadErrorStateRecord,
  isPrivateResourceHintStylesheetPrecedenceRecord,
  isPrivateControlledInputValueTrackerRecord,
  isPrivateControlledInputValueTrackerFakeDomDiagnosticRecord,
  isPrivateControlledInputRestoreQueueDiagnosticRecord,
  isPrivateControlledInputWrapperPropertyPayloadRecord,
  isPrivateFormActionEventExtractionRecord,
  isPrivateFormActionResetDispatcherRecord,
  isPrivateFormActionResetQueueCommitRecord,
  isPrivateResourceFormActionGateRecord,
  isPrivateResourceHintDispatcherMetadataRecord,
  missingPrerequisites,
  noSideEffects,
  privateControlledInputValueTrackerGateErrorCode,
  privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode,
  privateControlledInputValueTrackerFakeDomDiagnosticInvalidRecordCode,
  privateControlledInputValueTrackerFakeDomDiagnosticInactiveRecordCode,
  privateControlledInputValueTrackerFakeDomDiagnosticRecordType,
  privateControlledInputRestoreQueueDiagnosticGateErrorCode,
  privateControlledInputRestoreQueueDiagnosticInvalidAdmissionCode,
  privateControlledInputRestoreQueueDiagnosticInvalidObservationCode,
  privateControlledInputRestoreQueueDiagnosticInvalidRecordCode,
  privateControlledInputRestoreQueueDiagnosticRecordType,
  privateControlledInputValueTrackerGateInvalidScenarioCode,
  privateControlledInputValueTrackerGateRecordType,
  privateControlledInputValueTrackerGateUnknownScenarioCode,
  privateControlledInputWrapperPropertyPayloadRecordType,
  privateFormActionEventExtractionGateErrorCode,
  privateFormActionEventExtractionGateId,
  privateFormActionEventExtractionInvalidRecordCode,
  privateFormActionEventExtractionRecordedStatus,
  privateFormActionEventExtractionRecordType,
  privateFormActionEventExtractionStatus,
  privateFormActionResetDispatcherGateErrorCode,
  privateFormActionResetDispatcherGateId,
  privateFormActionResetDispatcherInvalidIntentCode,
  privateFormActionResetDispatcherInvalidRecordCode,
  privateFormActionResetDispatcherRecordType,
  privateFormActionResetDispatcherStatus,
  privateFormActionResetDispatcherUnknownIntentCode,
  privateFormActionResetIntentRecordedStatus,
  privateFormActionResetQueueCommitGateErrorCode,
  privateFormActionResetQueueCommitGateId,
  privateFormActionResetQueueCommitInvalidAdmissionCode,
  privateFormActionResetQueueCommitInvalidRecordCode,
  privateFormActionResetQueueCommitRecordedStatus,
  privateFormActionResetQueueCommitRecordType,
  privateFormActionResetQueueCommitStatus,
  privateFormActionSubmissionIntentRecordedStatus,
  privateResourceFormActionGateErrorCode,
  privateResourceFormActionGateRecordType,
  privateResourceFormActionGateUnknownRequestCode,
  privateResourceHintFakeDomAdapterAdmissionRecordType,
  privateResourceHintFakeDomAdapterAdmissionRequiredStatus,
  privateResourceHintFakeDomAdapterAdmissionStatus,
  privateResourceHintFakeDomAdapterCompatibilityBlockedStatus,
  privateResourceHintFakeDomAdapterExecutionBlockedStatus,
  privateResourceHintFakeDomAdapterGateErrorCode,
  privateResourceHintFakeDomAdapterGateId,
  privateResourceHintFakeDomAdapterInvalidAdmissionCode,
  privateResourceHintFakeDomAdapterInvalidRecordCode,
  privateResourceHintFakeDomInsertionAdmissionRequiredStatus,
  privateResourceHintFakeDomInsertionCompatibilityBlockedStatus,
  privateResourceHintFakeDomInsertionExecutionStatus,
  privateResourceHintFakeDomInsertionGateErrorCode,
  privateResourceHintFakeDomInsertionGateId,
  privateResourceHintFakeDomInsertionInvalidAdmissionCode,
  privateResourceHintFakeDomInsertionInvalidRecordCode,
  privateResourceHintFakeDomInsertionRecordType,
  privateResourceHintFakeDomInsertionStatus,
  privateResourceHintHeadBoundaryAdmissionRequiredStatus,
  privateResourceHintHeadBoundaryCompatibilityBlockedStatus,
  privateResourceHintHeadBoundaryExecutionStatus,
  privateResourceHintHeadBoundaryGateErrorCode,
  privateResourceHintHeadBoundaryGateId,
  privateResourceHintHeadBoundaryInvalidAdmissionCode,
  privateResourceHintHeadBoundaryInvalidRecordCode,
  privateResourceHintHeadBoundaryRecordType,
  privateResourceHintHeadBoundaryStatus,
  privateResourceHintHeadClearRetainAdmissionRequiredStatus,
  privateResourceHintHeadClearRetainCompatibilityBlockedStatus,
  privateResourceHintHeadClearRetainExecutionStatus,
  privateResourceHintHeadClearRetainGateErrorCode,
  privateResourceHintHeadClearRetainGateId,
  privateResourceHintHeadClearRetainInvalidAdmissionCode,
  privateResourceHintHeadClearRetainInvalidRecordCode,
  privateResourceHintHeadClearRetainRecordType,
  privateResourceHintHeadClearRetainStatus,
  privateResourceHintHeadStylesheetPrecedenceBlockedStatus,
  privateResourceHintPreloadPreinitOrderAdmissionRequiredStatus,
  privateResourceHintPreloadPreinitOrderCompatibilityBlockedStatus,
  privateResourceHintPreloadPreinitOrderExecutionStatus,
  privateResourceHintPreloadPreinitOrderGateErrorCode,
  privateResourceHintPreloadPreinitOrderGateId,
  privateResourceHintPreloadPreinitOrderInvalidAdmissionCode,
  privateResourceHintPreloadPreinitOrderInvalidRecordCode,
  privateResourceHintPreloadPreinitOrderRecordType,
  privateResourceHintPreloadPreinitOrderStatus,
  privateResourceHintResourceMapCommitAdmissionRequiredStatus,
  privateResourceHintResourceMapCommitCompatibilityBlockedStatus,
  privateResourceHintResourceMapCommitExecutionStatus,
  privateResourceHintResourceMapCommitGateErrorCode,
  privateResourceHintResourceMapCommitGateId,
  privateResourceHintResourceMapCommitInvalidAdmissionCode,
  privateResourceHintResourceMapCommitInvalidRecordCode,
  privateResourceHintResourceMapCommitRecordType,
  privateResourceHintResourceMapCommitStatus,
  privateResourceHintStylesheetPrecedenceAdmissionRequiredStatus,
  privateResourceHintStylesheetPrecedenceCompatibilityBlockedStatus,
  privateResourceHintStylesheetPrecedenceExecutionStatus,
  privateResourceHintStylesheetPrecedenceGateErrorCode,
  privateResourceHintStylesheetPrecedenceGateId,
  privateResourceHintStylesheetPrecedenceInvalidAdmissionCode,
  privateResourceHintStylesheetPrecedenceInvalidRecordCode,
  privateResourceHintStylesheetPrecedenceRecordType,
  privateResourceHintStylesheetPrecedenceStatus,
  privateResourceHintStylesheetLoadErrorStateAdmissionRequiredStatus,
  privateResourceHintStylesheetLoadErrorStateCompatibilityBlockedStatus,
  privateResourceHintStylesheetLoadErrorStateExecutionStatus,
  privateResourceHintStylesheetLoadErrorStateGateErrorCode,
  privateResourceHintStylesheetLoadErrorStateGateId,
  privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode,
  privateResourceHintStylesheetLoadErrorStateInvalidRecordCode,
  privateResourceHintStylesheetLoadErrorStateRecordType,
  privateResourceHintStylesheetLoadErrorStateStatus,
  privateResourceHintStylesheetLoadStateCommitTransitionStatus,
  privateResourceHintDispatcherMetadataGateErrorCode,
  privateResourceHintDispatcherMetadataGateId,
  privateResourceHintDispatcherMetadataInvalidShapeCode,
  privateResourceHintDispatcherMetadataRecordType,
  privateResourceHintDispatcherMetadataUnknownRequestCode,
  installControlledInputValueTrackerFakeDomDiagnostic,
  observeControlledInputValueTrackerFakeDomDiagnostic,
  recordFormActionEventExtractionFromSubmissionIntent,
  recordFormActionResetIntent,
  recordFormActionResetQueueCommit,
  recordFormActionSubmissionIntent,
  recordControlledInputPostEventRestoreIntentFromFakeDomObservation,
  recordControlledInputValueTrackerScenario,
  recordUnsupportedControlledFormRequest,
  recordUnsupportedFormActionRequest,
  recordUnsupportedResourceHintDispatcherRequest,
  recordUnsupportedResourceHintRequest,
  recordUnsupportedSingletonRequest,
  recordStylesheetLoadErrorStateDiagnostic,
  resourceFormActionInternalsGateSchemaVersion,
  resourceHintFakeDomAdapterContracts,
  resourceHintFakeDomAdapterGateSchemaVersion,
  resourceHintFakeDomAdapterMissingPrerequisites,
  resourceHintFakeDomAdapterSideEffects,
  resourceHintFakeDomInsertionBlockedSideEffects,
  resourceHintFakeDomInsertionContracts,
  resourceHintFakeDomInsertionGateSchemaVersion,
  resourceHintFakeDomInsertionMissingPrerequisites,
  resourceHintFakeDomInsertionSideEffects,
  resourceHintHeadBoundaryBlockedSideEffects,
  resourceHintHeadBoundaryContracts,
  resourceHintHeadBoundaryGateSchemaVersion,
  resourceHintHeadBoundaryMissingPrerequisites,
  resourceHintHeadBoundarySideEffects,
  resourceHintHeadClearRetainBlockedCapabilities,
  resourceHintHeadClearRetainBlockedSideEffects,
  resourceHintHeadClearRetainContracts,
  resourceHintHeadClearRetainGateSchemaVersion,
  resourceHintHeadClearRetainMissingPrerequisites,
  resourceHintHeadClearRetainSideEffects,
  resourceHintHeadStylesheetPrecedenceBlockedCapabilities,
  resourceHintPreloadPreinitOrderBlockedCapabilities,
  resourceHintPreloadPreinitOrderBlockedSideEffects,
  resourceHintPreloadPreinitOrderContracts,
  resourceHintPreloadPreinitOrderGateSchemaVersion,
  resourceHintPreloadPreinitOrderMissingPrerequisites,
  resourceHintPreloadPreinitOrderSideEffects,
  resourceHintResourceMapCommitBlockedCapabilities,
  resourceHintResourceMapCommitBlockedSideEffects,
  resourceHintResourceMapCommitContracts,
  resourceHintResourceMapCommitGateSchemaVersion,
  resourceHintResourceMapCommitMissingPrerequisites,
  resourceHintResourceMapCommitSideEffects,
  resourceHintStylesheetPrecedenceBlockedCapabilities,
  resourceHintStylesheetPrecedenceBlockedSideEffects,
  resourceHintStylesheetPrecedenceContracts,
  resourceHintStylesheetPrecedenceGateSchemaVersion,
  resourceHintStylesheetPrecedenceMissingPrerequisites,
  resourceHintStylesheetPrecedenceSideEffects,
  resourceHintStylesheetLoadErrorStateBlockedCapabilities,
  resourceHintStylesheetLoadErrorStateBlockedSideEffects,
  resourceHintStylesheetLoadErrorStateContracts,
  resourceHintStylesheetLoadErrorStateGateSchemaVersion,
  resourceHintStylesheetLoadErrorStateMissingPrerequisites,
  resourceHintStylesheetLoadErrorStateSideEffects,
  resourceHintDispatcherMetadataContracts,
  stylesheetLoadingStateBits,
  resourceHintDispatcherMetadataGateSchemaVersion,
  resourceHintDispatcherMissingPrerequisites,
  resourceHintDispatcherSideEffects,
  resourceHintContracts,
  singletonContracts,
  unsupportedStatus
};
