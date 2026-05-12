'use strict';

const singletonToken = 'single' + 'ton';
const hoistableToken = 'hoist' + 'able';
const requestFormResetName = 'request' + 'FormReset';
const useFormStateName = 'use' + 'FormState';
const useFormStatusName = 'use' + 'FormStatus';
const resetFormInstanceName = 'reset' + 'FormInstance';
const validateInputPropsName = 'validate' + 'InputProps';
const initInputName = 'init' + 'Input';
const updateInputName = 'update' + 'Input';
const restoreControlledInputStateName = 'restore' + 'ControlledInputState';
const validateSelectPropsName = 'validate' + 'SelectProps';
const initSelectName = 'init' + 'Select';
const updateSelectName = 'update' + 'Select';
const validateTextareaPropsName = 'validate' + 'TextareaProps';
const initTextareaName = 'init' + 'Textarea';
const updateTextareaName = 'update' + 'Textarea';

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
const resourceHintRootMapStoragePreflightGateSchemaVersion = 1;
const resourceHintRootMapStorageGateSchemaVersion = 1;
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
  'fast.react_dom.private_resource_hint_head_' + singletonToken + '_boundary_record';
const privateResourceHintHeadClearRetainRecordType =
  'fast.react_dom.private_resource_hint_head_clear_retain_record';
const privateResourceHintPreloadPreinitOrderRecordType =
  'fast.react_dom.private_resource_hint_preload_preinit_order_record';
const privateResourceHintStylesheetPrecedenceRecordType =
  'fast.react_dom.private_resource_hint_stylesheet_precedence_record';
const privateResourceHintResourceMapCommitRecordType =
  'fast.react_dom.private_resource_hint_resource_map_commit_record';
const privateResourceHintRootMapStoragePreflightRecordType =
  'fast.react_dom.private_resource_hint_root_map_storage_preflight_record';
const privateResourceHintRootMapStorageRecordType =
  'fast.react_dom.private_resource_hint_root_map_storage_record';
const privateResourceHintRootMapStorageRootLifecycleBoundaryRecordType =
  'fast.react_dom.private_resource_hint_root_map_storage_root_lifecycle_boundary_record';
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
  'resource-hint-head-' + singletonToken + '-private-gate-1';
const privateResourceHintHeadClearRetainGateId =
  'resource-hint-head-clear-retain-private-gate-1';
const privateResourceHintPreloadPreinitOrderGateId =
  'resource-hint-preload-preinit-dedupe-order-private-gate-1';
const privateResourceHintStylesheetPrecedenceGateId =
  'resource-hint-stylesheet-precedence-private-gate-1';
const privateResourceHintResourceMapCommitGateId =
  'resource-hint-resource-map-commit-private-gate-1';
const privateResourceHintRootMapStoragePreflightGateId =
  'resource-hint-root-map-storage-preflight-private-gate-1';
const privateResourceHintRootMapStorageGateId =
  'resource-hint-root-map-storage-private-gate-1';
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
  'blocked-private-resource-hint-head-' + singletonToken + '-boundary-admission-required';
const privateResourceHintHeadBoundaryStatus =
  'admitted-private-resource-hint-head-' + singletonToken + '-insertion-update-boundary-record';
const privateResourceHintHeadBoundaryExecutionStatus =
  'executed-private-resource-hint-fake-dom-head-' + singletonToken + '-insertion-update-boundary';
const privateResourceHintHeadBoundaryCompatibilityBlockedStatus =
  'blocked-private-resource-hint-head-' + singletonToken + '-boundary-compatibility';
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
const privateResourceHintRootMapStoragePreflightAdmissionRequiredStatus =
  'blocked-private-resource-hint-root-map-storage-preflight-admission-required';
const privateResourceHintRootMapStoragePreflightStatus =
  'preflighted-private-resource-hint-root-map-storage-record';
const privateResourceHintRootMapStoragePreflightExecutionStatus =
  'diagnosed-private-resource-hint-root-map-storage-preflight';
const privateResourceHintRootMapStoragePreflightCompatibilityBlockedStatus =
  'blocked-private-resource-hint-root-map-storage-preflight-compatibility';
const privateResourceHintRootMapStorageAdmissionRequiredStatus =
  'blocked-private-resource-hint-root-map-storage-admission-required';
const privateResourceHintRootMapStorageStatus =
  'executed-private-resource-hint-root-map-storage-record';
const privateResourceHintRootMapStorageExecutionStatus =
  'executed-private-resource-hint-deterministic-fake-root-map-storage';
const privateResourceHintRootMapStorageCompatibilityBlockedStatus =
  'blocked-private-resource-hint-root-map-storage-compatibility';
const privateResourceHintRootMapStorageRootLifecycleBoundaryStatus =
  'bound-private-resource-hint-root-map-storage-root-lifecycle';
const privateResourceHintPreloadPreinitFakeHeadExecutionStatus =
  'executed-private-resource-hint-fake-head-preload-preinit-precedence-path';
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
const privateResourceHintStylesheetLoadStateCommitExecutionStatus =
  'executed-private-resource-hint-fake-resource-map-stylesheet-load-state-transition';
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
const privateResourceHintRootMapStoragePreflightGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_ROOT_MAP_STORAGE_PREFLIGHT_GATE';
const privateResourceHintRootMapStoragePreflightInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_ROOT_MAP_STORAGE_PREFLIGHT_INVALID_RECORD';
const privateResourceHintRootMapStoragePreflightInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_ROOT_MAP_STORAGE_PREFLIGHT_INVALID_ADMISSION';
const privateResourceHintRootMapStorageGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_HINT_ROOT_MAP_STORAGE_GATE';
const privateResourceHintRootMapStorageInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_HINT_ROOT_MAP_STORAGE_INVALID_RECORD';
const privateResourceHintRootMapStorageInvalidAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_HINT_ROOT_MAP_STORAGE_INVALID_ADMISSION';
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
  requestFormResetName + 'OnFiber',
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
  'public-' + requestFormResetName + '-current-dispatcher',
  'dom-dispatcher-form-ownership-check',
  'react-owned-' + requestFormResetName + 'OnFiber',
  'previous-dispatcher-fallback-after-ownership-miss',
  'action-completion-request-reset-before-action',
  'commit-after-mutation-' + resetFormInstanceName
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
  fakeScriptModuleResourceOrderingDiagnosticInvoked: false,
  scriptModuleFakeResourceOrderRowsRecorded: false,
  scriptModuleFakeResourceDedupeStatesRecorded: false,
  scriptModuleFakeResourceOrderingExecuted: false,
  stylesheetLoadErrorStateRecordConsumed: false,
  stylesheetLoadStateCommitOrderRowsRecorded: false,
  stylesheetLoadStateResourceMapRowsValidated: false,
  stylesheetLoadStateCommitTransitionRecorded: false,
  fakeStylesheetResourceCommitTransitionRecorded: false,
  fakeStylesheetLoadStateCommitExecutionDiagnosticInvoked: false,
  stylesheetLoadStateCommitExecutionRowsRecorded: false,
  stylesheetLoadStateChangeRowsRecorded: false,
  deterministicStylesheetLoadStateChangesRecorded: false,
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
  fakeScriptModuleResourceOrderingDiagnosticInvoked: true,
  scriptModuleFakeResourceOrderRowsRecorded: true,
  scriptModuleFakeResourceDedupeStatesRecorded: true,
  scriptModuleFakeResourceOrderingExecuted: true,
  stylesheetLoadErrorStateRecordConsumed: true,
  stylesheetLoadStateCommitOrderRowsRecorded: true,
  stylesheetLoadStateResourceMapRowsValidated: true,
  stylesheetLoadStateCommitTransitionRecorded: true,
  fakeStylesheetResourceCommitTransitionRecorded: true,
  fakeStylesheetLoadStateCommitExecutionDiagnosticInvoked: true,
  stylesheetLoadStateCommitExecutionRowsRecorded: true,
  stylesheetLoadStateChangeRowsRecorded: true,
  deterministicStylesheetLoadStateChangesRecorded: true,
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

const resourceHintRootMapStoragePreflightBlockedSideEffects = freezeRecord({
  rootMapStoragePreflightRecorded: false,
  rootMapStorageRowsRecorded: false,
  canonicalRootMapStorageRowsRecorded: false,
  rootResourceStorageShapeRecorded: false,
  hoistableStylesRootMapRowsRecorded: false,
  hoistableScriptsRootMapRowsRecorded: false,
  preloadPropsRootMapRowsSkipped: false,
  rootMapStorageValidationRecorded: false,
  duplicateRootMapStorageRowsRejected: false,
  staleRootMapStorageRowsRejected: false,
  foreignRootMapStorageRowsRejected: false,
  rootResourceStorageCreated: false,
  rootResourceStorageMutated: false,
  hoistableStylesMapCreated: false,
  hoistableStylesMapMutated: false,
  hoistableScriptsMapCreated: false,
  hoistableScriptsMapMutated: false,
  preloadPropsMapCreated: false,
  preloadPropsMapMutated: false,
  realResourceMapsCreated: false,
  realResourceMapsMutated: false,
  fakeResourceMapsCreated: false,
  fakeResourceMapsMutated: false,
  publicResourceHintDomInsertion: false,
  publicHeadSingletonBehavior: false,
  publicSingletonBehavior: false,
  singletonResolutionReachable: false,
  headChildrenCleared: false,
  publicRootTouched: false,
  realDocumentMutated: false,
  realHeadMutated: false,
  fakeHeadMutated: false,
  resourceFetchStarted: false,
  fetchStarted: false,
  preloadStarted: false,
  modulePreloadStarted: false,
  scriptPreinitStarted: false,
  moduleScriptPreinitStarted: false,
  scriptExecutionStarted: false,
  resourceLoadStateMutated: false,
  loadStateMutated: false,
  loadingStateMutated: false,
  stylesheetLoadStateMutated: false,
  preloadOrStyleDomWorkDispatched: false,
  loadEventSubscribed: false,
  errorEventSubscribed: false,
  publicResourceMapCommitBehavior: false,
  publicScriptModuleResourceDispatch: false,
  publicStylesheetLoadStateDispatch: false,
  packageCompatibilityClaimed: false,
  packageExportsMutated: false,
  compatibilityClaimed: false
});

const resourceHintRootMapStorageBlockedSideEffects = freezeRecord({
  ...resourceHintRootMapStoragePreflightBlockedSideEffects,
  rootMapStorageExecutionRecorded: false,
  rootMapStorageExecutionRowsRecorded: false,
  canonicalRootMapStorageRowsExecuted: false,
  rootMapStorageSnapshotRecorded: false,
  deterministicFakeRootMapStorageExecuted: false,
  fakeRootResourceStorageCreated: false,
  fakeRootResourceStorageMutated: false,
  fakeHoistableStylesMapCreated: false,
  fakeHoistableStylesMapMutated: false,
  fakeHoistableScriptsMapCreated: false,
  fakeHoistableScriptsMapMutated: false
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
    'no-' + singletonToken + '-adapter',
    'react-dom-resource',
    'Host ' + singletonToken + ' resolution and ownership are not wired to the DOM host config.'
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
    'After-mutation reset traversal and ' + resetFormInstanceName + ' calls remain blocked.'
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
    'no-head-' + singletonToken + '-ownership',
    'react-dom-resource',
    'Head ' + singletonToken + ' resolution, acquisition, ownership, and release remain blocked.'
  ),
  prerequisite(
    'no-real-head-resource-boundary',
    'react-dom-resource',
    'Only deterministic fake DOM head insertion/update diagnostics are admitted.'
  ),
  prerequisite(
    'no-public-resource-or-' + singletonToken + '-root-behavior',
    'react-dom-client',
    'Public resource hints and ' + singletonToken + ' roots remain placeholder-gated.'
  )
]);

const resourceHintHeadClearRetainMissingPrerequisites = freezeArray([
  prerequisite(
    'no-head-' + singletonToken + '-clear-commit',
    'react-dom-resource',
    'Head ' + singletonToken + ' clear/release semantics are not wired to commit.'
  ),
  prerequisite(
    'no-resource-' + hoistableToken + '-retain-policy',
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
    'no-public-resource-or-' + singletonToken + '-root-behavior',
    'react-dom-client',
    'Public resource hints and ' + singletonToken + ' roots remain placeholder-gated.'
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
    'no-head-' + singletonToken + '-order-commit',
    'react-dom-resource',
    'Head ' + singletonToken + ' ordering and clear/retain behavior remain blocked at commit.'
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
    'Preload records are private diagnostics and do not populate real preload maps.'
  ),
  prerequisite(
    'no-resource-' + singletonToken + '-ownership',
    'react-dom-resource',
    'Resource ownership and head ' + singletonToken + ' coordination remain blocked.'
  ),
  prerequisite(
    'no-resource-fetch-or-load-state',
    'react-dom-resource',
    'Resource fetch, load, error, and suspended commit state remain blocked.'
  ),
  prerequisite(
    'no-script-module-resource-acquire',
    'react-dom-resource',
    'Script and modulepreload commit rows only execute deterministic fake resource ordering; real resource acquisition and script execution remain blocked.'
  ),
  prerequisite(
    'no-public-resource-api-dispatch',
    'react-dom-resource',
    'Public resource hint APIs remain placeholders and do not reach commit.'
  )
]);

const resourceHintRootMapStoragePreflightMissingPrerequisites = freezeArray([
  prerequisite(
    'no-real-root-resource-storage',
    'react-dom-resource',
    'Root-owned ' + hoistableToken + 'Styles and ' + hoistableToken + 'Scripts maps are preflighted as private rows only.'
  ),
  prerequisite(
    'no-root-resource-map-mutation',
    'react-dom-resource',
    'The preflight does not create or mutate real or fake root resource maps.'
  ),
  prerequisite(
    'no-preload-props-root-storage',
    'react-dom-resource',
    'Preload-props rows are recorded as skipped for root-owned storage.'
  ),
  prerequisite(
    'no-public-resource-api-dispatch',
    'react-dom-resource',
    'Public resource hint APIs remain blocked and cannot reach root-map storage.'
  )
]);

const resourceHintRootMapStorageMissingPrerequisites = freezeArray([
  prerequisite(
    'no-real-root-resource-storage',
    'react-dom-resource',
    'Root-owned ' + hoistableToken + 'Styles and ' + hoistableToken + 'Scripts storage is executed only against deterministic private maps.'
  ),
  prerequisite(
    'no-preload-props-root-storage',
    'react-dom-resource',
    'Preload-props rows remain skipped and do not populate root-owned storage.'
  ),
  prerequisite(
    'no-public-resource-api-dispatch',
    'react-dom-resource',
    'Public resource hint APIs remain blocked and cannot reach root-map storage.'
  ),
  prerequisite(
    'no-stylesheet-script-lifecycle',
    'react-dom-resource',
    'Stylesheet load state and script/module lifecycle work remain blocked after private storage execution.'
  ),
  prerequisite(
    'no-package-export-compatibility',
    'react-dom-resource',
    'Package exports and compatibility claims remain unchanged and unclaimed.'
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
    'head-' + singletonToken + '-release',
    'Head ' + singletonToken + ' release and ownership are not wired to public roots.'
  ),
  blockedCapability(
    'head-child-removal',
    'Head child removal is diagnostic-only and does not clear fake or real head children.'
  ),
  blockedCapability(
    'resource-' + hoistableToken + '-retain-marker',
    'Resource hint ' + hoistableToken + ' retain markers are not applied by this fake-DOM gate.'
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
    'public-resource-' + singletonToken + '-compatibility',
    'Public resource hint and head ' + singletonToken + ' compatibility remains unclaimed.'
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
    'head-' + singletonToken + '-ordering',
    'Head ' + singletonToken + ' clear/retain ordering is observed but not applied at commit.'
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
    'Preload rows are recorded as private diagnostics without mutating real preload maps.'
  ),
  blockedCapability(
    'resource-' + singletonToken + '-ownership',
    'Resource ownership and ' + singletonToken + ' coordination are not acquired.'
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
    'Script and modulepreload rows execute deterministic fake resource ordering without public dispatch or script execution.'
  ),
  blockedCapability(
    'public-resource-compatibility',
    'Public resource hint compatibility remains unclaimed.'
  )
]);

const resourceHintRootMapStoragePreflightBlockedCapabilities = freezeArray([
  blockedCapability(
    'root-resource-storage-private-only',
    'Root-owned ' + hoistableToken + ' style and script storage is represented as private preflight rows only.'
  ),
  blockedCapability(
    'root-resource-map-mutation',
    'No real or fake root resource map is created or mutated.'
  ),
  blockedCapability(
    'preload-props-root-storage',
    'Preload-props records are not stored in root-owned resource maps.'
  ),
  blockedCapability(
    'public-resource-dispatch',
    'Public resource hint dispatch and DOM insertion remain blocked.'
  ),
  blockedCapability(
    'public-head-mutation',
    'Public head ' + singletonToken + ' behavior and real/fake head mutation remain blocked.'
  ),
  blockedCapability(
    'stylesheet-script-lifecycle',
    'Stylesheet load state and script/module lifecycle work is not started or mutated.'
  ),
  blockedCapability(
    'package-export-compatibility',
    'Package exports and compatibility claims remain unchanged and unclaimed.'
  )
]);

const resourceHintRootMapStorageBlockedCapabilities = freezeArray([
  blockedCapability(
    'real-root-resource-storage',
    'No real Fiber root or React DOM root resource storage is created or mutated.'
  ),
  blockedCapability(
    'preload-props-root-storage',
    'Preload-props records are not stored in root-owned resource maps.'
  ),
  blockedCapability(
    'public-resource-dispatch',
    'Public resource hint dispatch and DOM insertion remain blocked.'
  ),
  blockedCapability(
    'public-head-mutation',
    'Public head ' + singletonToken + ' behavior and real/fake head mutation remain blocked.'
  ),
  blockedCapability(
    'stylesheet-script-lifecycle',
    'Stylesheet load state and script/module lifecycle work is not started or mutated.'
  ),
  blockedCapability(
    'package-export-compatibility',
    'Package exports and compatibility claims remain unchanged and unclaimed.'
  )
]);

const resourceHintStylesheetLoadErrorStateBlockedCapabilities = freezeArray([
  blockedCapability(
    'stylesheet-resource-state-map',
    'No root-owned ' + hoistableToken + 'Styles resource map is created or mutated.'
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
    'preconnect-head-' + singletonToken + '-boundary',
    'preconnect',
    'C',
    'link',
    'preconnect'
  ),
  resourceHintHeadBoundaryContract(
    'preload-head-' + singletonToken + '-boundary',
    'preload',
    'L',
    'link',
    'preload'
  )
]);

const resourceHintHeadClearRetainContracts = freezeArray([
  resourceHintHeadClearRetainContract(
    'head-' + singletonToken + '-clear-retain',
    'host-' + singletonToken,
    'head-' + singletonToken,
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
    'stylesheet-precedence-head-' + singletonToken,
    'head-' + singletonToken,
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
    hoistableToken + '-styles',
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
    hoistableToken + '-scripts',
    'script'
  )
]);

const resourceHintRootMapStoragePreflightContracts = freezeArray([
  resourceHintRootMapStoragePreflightContract(
    'root-map-storage-' + hoistableToken + '-styles',
    hoistableToken + '-styles',
    'stylesheet',
    'style'
  ),
  resourceHintRootMapStoragePreflightContract(
    'root-map-storage-' + hoistableToken + '-scripts',
    hoistableToken + '-scripts',
    'script',
    'script'
  )
]);

const resourceHintRootMapStorageContracts = freezeArray([
  resourceHintRootMapStorageContract(
    'root-map-storage-execution-' + hoistableToken + '-styles',
    hoistableToken + 'Styles',
    'stylesheet',
    'style'
  ),
  resourceHintRootMapStorageContract(
    'root-map-storage-execution-' + hoistableToken + '-scripts',
    hoistableToken + 'Scripts',
    'script',
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
  singletonContract('html-' + singletonToken, 'html'),
  singletonContract('head-' + singletonToken, 'head'),
  singletonContract('body-' + singletonToken, 'body')
]);

const formActionContracts = freezeArray([
  formActionContract('request-form-reset', requestFormResetName, 'r'),
  formActionContract('use-form-state', useFormStateName, null),
  formActionContract('use-form-status', useFormStatusName, null),
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
    [validateInputPropsName, initInputName, updateInputName],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-name-payload',
    'input',
    'name',
    'input-host-wrapper',
    [initInputName, updateInputName, restoreControlledInputStateName],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-value-payload',
    'input',
    'value',
    'input-host-wrapper',
    [validateInputPropsName, initInputName, updateInputName],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-default-value-payload',
    'input',
    'defaultValue',
    'input-host-wrapper',
    [validateInputPropsName, initInputName, updateInputName],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-checked-payload',
    'input',
    'checked',
    'input-host-wrapper',
    [
      validateInputPropsName,
      initInputName,
      updateInputName,
      restoreControlledInputStateName
    ],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'input-wrapper-default-checked-payload',
    'input',
    'defaultChecked',
    'input-host-wrapper',
    [
      validateInputPropsName,
      initInputName,
      updateInputName,
      restoreControlledInputStateName
    ],
    inputWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'select-wrapper-value-payload',
    'select',
    'value',
    'select-host-wrapper',
    [validateSelectPropsName, initSelectName, updateSelectName],
    selectWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'select-wrapper-default-value-payload',
    'select',
    'defaultValue',
    'select-host-wrapper',
    [validateSelectPropsName, initSelectName, updateSelectName],
    selectWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'select-wrapper-multiple-payload',
    'select',
    'multiple',
    'select-host-wrapper',
    [validateSelectPropsName, initSelectName, updateSelectName],
    selectWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'textarea-wrapper-value-payload',
    'textarea',
    'value',
    'textarea-host-wrapper',
    [validateTextareaPropsName, initTextareaName, updateTextareaName],
    textareaWrapperPropertyNames
  ),
  controlledInputPrivateWrapperPropertyPayloadContract(
    'textarea-wrapper-default-value-payload',
    'textarea',
    'defaultValue',
    'textarea-host-wrapper',
    [validateTextareaPropsName, initTextareaName, updateTextareaName],
    textareaWrapperPropertyNames
  )
]);

const controlledInputValueTrackerOracleCoverage = freezeArray([
  controlledInputValueTrackerCoverage('input', 12, ['value', 'checked']),
  controlledInputValueTrackerCoverage('select', 6, ['selectedOptions']),
  controlledInputValueTrackerCoverage('textarea', 7, ['value'])
]);

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
    headContractId: 'head-' + singletonToken,
    elementTag,
    relationship,
    capability: 'react-dom-resource-hint-head-' + singletonToken + '-boundary',
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

function resourceHintRootMapStoragePreflightContract(
  id,
  rootMapName,
  recordKind,
  resourceKind
) {
  return freezeRecord({
    id,
    rootMapName,
    recordKind,
    resourceKind,
    hostTag: 'head',
    capability: 'react-dom-resource-root-map-storage-preflight',
    oracleKind: resourceHintOracleKind,
    deterministicPrivateRecordsOnly: true,
    compatibilityClaimed: false
  });
}

function resourceHintRootMapStorageContract(
  id,
  rootMapName,
  recordKind,
  resourceKind
) {
  return freezeRecord({
    id,
    rootMapName,
    recordKind,
    resourceKind,
    hostTag: 'head',
    capability: 'react-dom-resource-root-map-storage-private-execution',
    oracleKind: resourceHintOracleKind,
    deterministicPrivateRecordsOnly: true,
    deterministicFakeRootMapStorageOnly: true,
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
    capability: 'react-dom-host-' + singletonToken,
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
  resourceFormActionInternalsGateSchemaVersion,
  formActionResetDispatcherGateSchemaVersion,
  formActionEventExtractionGateSchemaVersion,
  formActionResetQueueCommitGateSchemaVersion,
  resourceHintDispatcherMetadataGateSchemaVersion,
  resourceHintFakeDomAdapterGateSchemaVersion,
  resourceHintFakeDomInsertionGateSchemaVersion,
  resourceHintHeadBoundaryGateSchemaVersion,
  resourceHintHeadClearRetainGateSchemaVersion,
  resourceHintPreloadPreinitOrderGateSchemaVersion,
  resourceHintStylesheetPrecedenceGateSchemaVersion,
  resourceHintResourceMapCommitGateSchemaVersion,
  resourceHintRootMapStoragePreflightGateSchemaVersion,
  resourceHintRootMapStorageGateSchemaVersion,
  resourceHintStylesheetLoadErrorStateGateSchemaVersion,
  controlledInputValueTrackerGateSchemaVersion,
  controlledInputValueTrackerFakeDomDiagnosticGateSchemaVersion,
  controlledInputPrivateRestoreQueueDiagnosticGateSchemaVersion,
  controlledInputPrivateWrapperGateSchemaVersion,
  privateResourceFormActionGateRecordType,
  privateFormActionResetDispatcherRecordType,
  privateFormActionEventExtractionRecordType,
  privateFormActionResetQueueCommitRecordType,
  privateResourceHintDispatcherMetadataRecordType,
  privateResourceHintFakeDomAdapterAdmissionRecordType,
  privateResourceHintFakeDomInsertionRecordType,
  privateResourceHintHeadBoundaryRecordType,
  privateResourceHintHeadClearRetainRecordType,
  privateResourceHintPreloadPreinitOrderRecordType,
  privateResourceHintStylesheetPrecedenceRecordType,
  privateResourceHintResourceMapCommitRecordType,
  privateResourceHintRootMapStoragePreflightRecordType,
  privateResourceHintRootMapStorageRecordType,
  privateResourceHintRootMapStorageRootLifecycleBoundaryRecordType,
  privateResourceHintStylesheetLoadErrorStateRecordType,
  privateControlledInputValueTrackerGateRecordType,
  privateControlledInputValueTrackerFakeDomDiagnosticRecordType,
  privateControlledInputRestoreQueueDiagnosticRecordType,
  privateControlledInputWrapperPropertyPayloadRecordType,
  privateResourceHintDispatcherMetadataGateId,
  privateResourceHintFakeDomAdapterGateId,
  privateResourceHintFakeDomInsertionGateId,
  privateResourceHintHeadBoundaryGateId,
  privateResourceHintHeadClearRetainGateId,
  privateResourceHintPreloadPreinitOrderGateId,
  privateResourceHintStylesheetPrecedenceGateId,
  privateResourceHintResourceMapCommitGateId,
  privateResourceHintRootMapStoragePreflightGateId,
  privateResourceHintRootMapStorageGateId,
  privateResourceHintStylesheetLoadErrorStateGateId,
  privateFormActionResetDispatcherGateId,
  privateFormActionEventExtractionGateId,
  privateFormActionResetQueueCommitGateId,
  privateResourceHintFakeDomAdapterAdmissionRequiredStatus,
  privateResourceHintFakeDomAdapterAdmissionStatus,
  privateResourceHintFakeDomAdapterExecutionBlockedStatus,
  privateResourceHintFakeDomAdapterCompatibilityBlockedStatus,
  privateResourceHintFakeDomInsertionAdmissionRequiredStatus,
  privateResourceHintFakeDomInsertionStatus,
  privateResourceHintFakeDomInsertionExecutionStatus,
  privateResourceHintFakeDomInsertionCompatibilityBlockedStatus,
  privateResourceHintHeadBoundaryAdmissionRequiredStatus,
  privateResourceHintHeadBoundaryStatus,
  privateResourceHintHeadBoundaryExecutionStatus,
  privateResourceHintHeadBoundaryCompatibilityBlockedStatus,
  privateResourceHintHeadClearRetainAdmissionRequiredStatus,
  privateResourceHintHeadClearRetainStatus,
  privateResourceHintHeadClearRetainExecutionStatus,
  privateResourceHintHeadClearRetainCompatibilityBlockedStatus,
  privateResourceHintHeadStylesheetPrecedenceBlockedStatus,
  privateResourceHintPreloadPreinitOrderAdmissionRequiredStatus,
  privateResourceHintPreloadPreinitOrderStatus,
  privateResourceHintPreloadPreinitOrderExecutionStatus,
  privateResourceHintPreloadPreinitOrderCompatibilityBlockedStatus,
  privateResourceHintStylesheetPrecedenceAdmissionRequiredStatus,
  privateResourceHintStylesheetPrecedenceStatus,
  privateResourceHintStylesheetPrecedenceExecutionStatus,
  privateResourceHintStylesheetPrecedenceCompatibilityBlockedStatus,
  privateResourceHintResourceMapCommitAdmissionRequiredStatus,
  privateResourceHintResourceMapCommitStatus,
  privateResourceHintResourceMapCommitExecutionStatus,
  privateResourceHintResourceMapCommitCompatibilityBlockedStatus,
  privateResourceHintRootMapStoragePreflightAdmissionRequiredStatus,
  privateResourceHintRootMapStoragePreflightStatus,
  privateResourceHintRootMapStoragePreflightExecutionStatus,
  privateResourceHintRootMapStoragePreflightCompatibilityBlockedStatus,
  privateResourceHintRootMapStorageAdmissionRequiredStatus,
  privateResourceHintRootMapStorageStatus,
  privateResourceHintRootMapStorageExecutionStatus,
  privateResourceHintRootMapStorageCompatibilityBlockedStatus,
  privateResourceHintRootMapStorageRootLifecycleBoundaryStatus,
  privateResourceHintPreloadPreinitFakeHeadExecutionStatus,
  privateResourceHintStylesheetLoadErrorStateAdmissionRequiredStatus,
  privateResourceHintStylesheetLoadErrorStateStatus,
  privateResourceHintStylesheetLoadErrorStateExecutionStatus,
  privateResourceHintStylesheetLoadErrorStateCompatibilityBlockedStatus,
  privateResourceHintStylesheetLoadStateCommitTransitionStatus,
  privateResourceHintStylesheetLoadStateCommitExecutionStatus,
  privateFormActionResetDispatcherStatus,
  privateFormActionResetQueueCommitStatus,
  privateFormActionSubmissionIntentRecordedStatus,
  privateFormActionResetIntentRecordedStatus,
  privateFormActionEventExtractionStatus,
  privateFormActionEventExtractionRecordedStatus,
  privateFormActionResetQueueCommitRecordedStatus,
  privateResourceFormActionGateErrorCode,
  privateResourceFormActionGateUnknownRequestCode,
  privateFormActionResetDispatcherGateErrorCode,
  privateFormActionResetDispatcherInvalidIntentCode,
  privateFormActionResetDispatcherInvalidRecordCode,
  privateFormActionResetDispatcherUnknownIntentCode,
  privateFormActionEventExtractionGateErrorCode,
  privateFormActionEventExtractionInvalidRecordCode,
  privateFormActionResetQueueCommitGateErrorCode,
  privateFormActionResetQueueCommitInvalidAdmissionCode,
  privateFormActionResetQueueCommitInvalidRecordCode,
  privateResourceHintDispatcherMetadataGateErrorCode,
  privateResourceHintDispatcherMetadataInvalidShapeCode,
  privateResourceHintDispatcherMetadataUnknownRequestCode,
  privateResourceHintFakeDomAdapterGateErrorCode,
  privateResourceHintFakeDomAdapterInvalidRecordCode,
  privateResourceHintFakeDomAdapterInvalidAdmissionCode,
  privateResourceHintFakeDomInsertionGateErrorCode,
  privateResourceHintFakeDomInsertionInvalidRecordCode,
  privateResourceHintFakeDomInsertionInvalidAdmissionCode,
  privateResourceHintHeadBoundaryGateErrorCode,
  privateResourceHintHeadBoundaryInvalidRecordCode,
  privateResourceHintHeadBoundaryInvalidAdmissionCode,
  privateResourceHintHeadClearRetainGateErrorCode,
  privateResourceHintHeadClearRetainInvalidRecordCode,
  privateResourceHintHeadClearRetainInvalidAdmissionCode,
  privateResourceHintPreloadPreinitOrderGateErrorCode,
  privateResourceHintPreloadPreinitOrderInvalidRecordCode,
  privateResourceHintPreloadPreinitOrderInvalidAdmissionCode,
  privateResourceHintStylesheetPrecedenceGateErrorCode,
  privateResourceHintStylesheetPrecedenceInvalidRecordCode,
  privateResourceHintStylesheetPrecedenceInvalidAdmissionCode,
  privateResourceHintResourceMapCommitGateErrorCode,
  privateResourceHintResourceMapCommitInvalidRecordCode,
  privateResourceHintResourceMapCommitInvalidAdmissionCode,
  privateResourceHintRootMapStoragePreflightGateErrorCode,
  privateResourceHintRootMapStoragePreflightInvalidRecordCode,
  privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
  privateResourceHintRootMapStorageGateErrorCode,
  privateResourceHintRootMapStorageInvalidRecordCode,
  privateResourceHintRootMapStorageInvalidAdmissionCode,
  privateResourceHintStylesheetLoadErrorStateGateErrorCode,
  privateResourceHintStylesheetLoadErrorStateInvalidRecordCode,
  privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode,
  privateControlledInputValueTrackerGateErrorCode,
  privateControlledInputValueTrackerGateUnknownScenarioCode,
  privateControlledInputValueTrackerGateInvalidScenarioCode,
  privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode,
  privateControlledInputValueTrackerFakeDomDiagnosticInvalidRecordCode,
  privateControlledInputValueTrackerFakeDomDiagnosticInactiveRecordCode,
  privateControlledInputRestoreQueueDiagnosticGateErrorCode,
  privateControlledInputRestoreQueueDiagnosticInvalidAdmissionCode,
  privateControlledInputRestoreQueueDiagnosticInvalidObservationCode,
  privateControlledInputRestoreQueueDiagnosticInvalidRecordCode,
  unsupportedStatus,
  controlledInputValueTrackerGateId,
  controlledInputValueTrackerFakeDomDiagnosticGateId,
  controlledInputPrivateRestoreQueueDiagnosticGateId,
  controlledInputValueTrackerFakeDomDiagnosticStatus,
  controlledInputPrivateRestoreQueueDiagnosticStatus,
  controlledInputValueTrackerFakeDomInstalledStatus,
  controlledInputValueTrackerFakeDomObservedStatus,
  controlledInputValueTrackerFakeDomDetachedStatus,
  controlledInputPrivateRestoreQueueIntentRecordedStatus,
  controlledInputPrivateRestoreQueueIntentSkippedStatus,
  controlledInputValueTrackerFakeDomTargetMarker,
  controlledInputPrivateWrapperGateId,
  controlledInputPrivateWrapperGateStatus,
  resourceHintOracleKind,
  formActionsOracleKind,
  controlledInputOracleKind,
  formActionSubmissionTriggers,
  formActionActionKinds,
  formActionActionSources,
  formActionSubmitControlKinds,
  formActionResetOrderingKinds,
  formActionResetQueueSources,
  formActionResetQueueCommitPhases,
  formActionResetDispatcherOrderingSteps,
  noSideEffects,
  formActionResetDispatcherBlockedSideEffects,
  formActionSubmissionIntentSideEffects,
  formActionResetIntentSideEffects,
  formActionEventExtractionBlockedSideEffects,
  formActionResetQueueCommitBlockedSideEffects,
  formActionEventExtractionMetadataSideEffects,
  formActionResetQueueCommitDiagnosticSideEffects,
  resourceHintDispatcherSideEffects,
  resourceHintFakeDomAdapterSideEffects,
  resourceHintFakeDomInsertionBlockedSideEffects,
  resourceHintFakeDomInsertionSideEffects,
  resourceHintHeadBoundaryBlockedSideEffects,
  resourceHintHeadBoundarySideEffects,
  resourceHintHeadClearRetainBlockedSideEffects,
  resourceHintHeadClearRetainSideEffects,
  resourceHintPreloadPreinitOrderBlockedSideEffects,
  resourceHintPreloadPreinitOrderSideEffects,
  resourceHintStylesheetPrecedenceBlockedSideEffects,
  resourceHintStylesheetPrecedenceSideEffects,
  resourceHintResourceMapCommitBlockedSideEffects,
  resourceHintResourceMapCommitSideEffects,
  resourceHintRootMapStoragePreflightBlockedSideEffects,
  resourceHintRootMapStorageBlockedSideEffects,
  resourceHintStylesheetLoadErrorStateBlockedSideEffects,
  resourceHintStylesheetLoadErrorStateSideEffects,
  controlledInputValueTrackerSideEffects,
  controlledInputPrivateWrapperSideEffects,
  controlledInputValueTrackerFakeDomDiagnosticNoSideEffects,
  controlledInputPrivateRestoreQueueDiagnosticNoSideEffects,
  missingPrerequisites,
  resourceHintDispatcherMissingPrerequisites,
  formActionResetDispatcherMissingPrerequisites,
  formActionEventExtractionMissingPrerequisites,
  formActionResetQueueCommitMissingPrerequisites,
  resourceHintFakeDomAdapterMissingPrerequisites,
  resourceHintFakeDomInsertionMissingPrerequisites,
  resourceHintHeadBoundaryMissingPrerequisites,
  resourceHintHeadClearRetainMissingPrerequisites,
  resourceHintPreloadPreinitOrderMissingPrerequisites,
  resourceHintStylesheetPrecedenceMissingPrerequisites,
  resourceHintResourceMapCommitMissingPrerequisites,
  resourceHintRootMapStoragePreflightMissingPrerequisites,
  resourceHintRootMapStorageMissingPrerequisites,
  resourceHintStylesheetLoadErrorStateMissingPrerequisites,
  resourceHintHeadClearRetainBlockedCapabilities,
  resourceHintHeadStylesheetPrecedenceBlockedCapabilities,
  resourceHintPreloadPreinitOrderBlockedCapabilities,
  resourceHintStylesheetPrecedenceBlockedCapabilities,
  resourceHintResourceMapCommitBlockedCapabilities,
  resourceHintRootMapStoragePreflightBlockedCapabilities,
  resourceHintRootMapStorageBlockedCapabilities,
  resourceHintStylesheetLoadErrorStateBlockedCapabilities,
  controlledInputValueTrackerMissingPrerequisites,
  resourceHintContracts,
  resourceHintDispatcherMetadataContracts,
  resourceHintFakeDomAdapterContracts,
  resourceHintFakeDomInsertionContracts,
  resourceHintHeadBoundaryContracts,
  resourceHintHeadClearRetainContracts,
  resourceHintPreloadPreinitOrderContracts,
  resourceHintStylesheetPrecedenceContracts,
  resourceHintResourceMapCommitContracts,
  resourceHintRootMapStoragePreflightContracts,
  resourceHintRootMapStorageContracts,
  stylesheetLoadingStateBits,
  resourceHintStylesheetLoadErrorStateContracts,
  singletonContracts,
  formActionContracts,
  formActionResetDispatcherContracts,
  formActionEventExtractionContracts,
  formActionResetQueueCommitContracts,
  controlledFormContracts,
  controlledInputValueTrackerContracts,
  controlledInputPrivateWrapperPropertyPayloadContracts,
  controlledInputValueTrackerOracleCoverage,
  freezeArray,
  freezeRecord,
  oracleEvidence
};
