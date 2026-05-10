'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  unimplementedCode
} = require('../placeholder-utils.js');

const hasOwn = Object.prototype.hasOwnProperty;

const resourceFormActionInternalsGateSchemaVersion = 1;
const formActionResetDispatcherGateSchemaVersion = 1;
const resourceHintDispatcherMetadataGateSchemaVersion = 1;
const resourceHintFakeDomAdapterGateSchemaVersion = 1;
const resourceHintFakeDomInsertionGateSchemaVersion = 1;
const resourceHintHeadBoundaryGateSchemaVersion = 1;
const resourceHintHeadClearRetainGateSchemaVersion = 1;
const resourceHintPreloadPreinitOrderGateSchemaVersion = 1;
const controlledInputValueTrackerGateSchemaVersion = 1;
const controlledInputValueTrackerFakeDomDiagnosticGateSchemaVersion = 1;
const controlledInputPrivateRestoreQueueDiagnosticGateSchemaVersion = 1;
const controlledInputPrivateWrapperGateSchemaVersion = 1;
const privateResourceFormActionGateRecordType =
  'fast.react_dom.private_resource_form_action_gate_record';
const privateFormActionResetDispatcherRecordType =
  'fast.react_dom.private_form_action_reset_dispatcher_record';
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
const privateFormActionResetDispatcherGateId =
  'form-action-reset-private-dispatcher-gate-1';
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
const privateFormActionResetDispatcherStatus =
  'private-form-action-reset-dispatcher-metadata-only';
const privateFormActionSubmissionIntentRecordedStatus =
  'recorded-private-form-action-submission-intent';
const privateFormActionResetIntentRecordedStatus =
  'recorded-private-form-action-reset-intent';
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
  resetIntentRecorded: false,
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
  submissionIntentRecorded: true
});

const formActionResetIntentSideEffects = freezeRecord({
  ...formActionResetDispatcherBlockedSideEffects,
  formDispatcherMetadataRecorded: true,
  resetIntentRecorded: true
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
  preloadPreinitResourceMapCreated: false,
  preloadPreinitResourceMapMutated: false,
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
  stylesheetPrecedenceBlockedCapabilitiesRecorded: true,
  stylesheetPrecedenceOrderQueried: true,
  stylesheetPrecedenceOrderMutated: false,
  preloadPreinitResourceMapCreated: false,
  preloadPreinitResourceMapMutated: false,
  publicPreloadPreinitDedupeBehavior: false
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
    'no-public-resource-hint-dom-insertion',
    'react-dom-resource',
    'Public resource hint APIs remain placeholders and do not reach this diagnostic.'
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
    'public-resource-compatibility',
    'Public preload/preinit compatibility remains unclaimed.'
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
const resourceHintDispatcherMetadataPayloads = new WeakMap();
const resourceHintFakeDomAdapterAdmissionPayloads = new WeakMap();
const resourceHintFakeDomInsertionPayloads = new WeakMap();
const resourceHintHeadBoundaryPayloads = new WeakMap();
const resourceHintHeadClearRetainPayloads = new WeakMap();
const resourceHintPreloadPreinitOrderPayloads = new WeakMap();
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
const defaultResourceHintFakeDomAdapterGate =
  createResourceHintFakeDomAdapterGate();
const defaultControlledInputValueTrackerGate =
  createControlledInputValueTrackerGate();
const defaultControlledInputPrivateRestoreQueueDiagnosticGate =
  createControlledInputPrivateRestoreQueueDiagnosticGate();

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
      singletons: singletonContracts,
      formActions: formActionContracts,
      formActionResetDispatchers: formActionResetDispatcherContracts,
      controlledForms: controlledFormContracts,
      controlledInputValueTrackers: controlledInputValueTrackerContracts,
      controlledInputPrivateWrapperPropertyPayloads:
        controlledInputPrivateWrapperPropertyPayloadContracts
    }),
    sideEffects: noSideEffects,
    resourceHintDispatcherMetadata:
      describePrivateResourceHintDispatcherMetadataGate(),
    formActionResetDispatcher:
      describePrivateFormActionResetDispatcherGate(),
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
    recordsResetIntentMetadata: true,
    invokesActions: false,
    constructsFormData: false,
    startsHostTransition: false,
    resetsForms: false,
    sideEffects: formActionResetDispatcherBlockedSideEffects,
    missingPrerequisites: formActionResetDispatcherMissingPrerequisites
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
      describePrivateResourceHintPreloadPreinitOrderGate()
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
      'preinit-style',
      'preinit-script'
    ]),
    deterministicFakeDomOnly: true,
    mutatesFakeHead: false,
    mutatesRealHead: false,
    recordsDedupeRows: true,
    recordsPrecedenceRows: true,
    recordsHeadOrderRows: true,
    rawValuesRetained: false,
    publicResourceHintDomInsertion: false,
    publicStylesheetPrecedenceBehavior: false,
    stylesheetPrecedenceBoundary:
      createStylesheetPrecedenceOrderDiagnosticBoundary(
        freezeArray([]),
        freezeArray([])
      ),
    blockedCapabilities: resourceHintPreloadPreinitOrderBlockedCapabilities,
    contracts: resourceHintPreloadPreinitOrderContracts,
    sideEffects: resourceHintPreloadPreinitOrderBlockedSideEffects,
    missingPrerequisites:
      resourceHintPreloadPreinitOrderMissingPrerequisites
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
    plannedHeadInsertionOrder: orderPlan.plannedHeadInsertionOrder,
    observedHeadOrder: orderPlan.observedHeadOrder,
    resourceMapPlan: orderPlan.resourceMapPlan,
    stylesheetPrecedenceBoundary:
      orderPlan.stylesheetPrecedenceBoundary,
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

function validateResourceHintDispatcherShape(contract, args) {
  if (!Array.isArray(args)) {
    throwInvalidResourceHintDispatcherShape(
      contract,
      'arguments must be provided as an array'
    );
  }

  if (args.length !== contract.argumentNames.length) {
    throwInvalidResourceHintDispatcherShape(
      contract,
      `expected ${contract.argumentNames.length} arguments`
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
    case 'S':
      return validatePreinitStyleDispatcherShape(contract, args);
    case 'X':
      return validatePreinitScriptDispatcherShape(contract, args);
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

  const as = getDispatcherArgumentSummary(
    adapterAdmission.dispatcherShape,
    'as'
  );
  appendStringAttributeIfPresent(attributes, 'as', as);

  const options = getDispatcherArgumentSummary(
    adapterAdmission.dispatcherShape,
    'options'
  );
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
    resourceKind === 'font' ||
    resourceKind === 'image' ||
    resourceKind === 'other'
  ) {
    return resourceKind;
  }

  throwInvalidResourceHintPreloadPreinitOrderAdmission(
    'resourceKind must be style, script, font, image, or other'
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

  return freezeRecord({
    dedupeRows: freezeArray(dedupeRows),
    precedenceRows,
    plannedHeadInsertionOrder,
    observedHeadOrder,
    stylesheetPrecedenceBoundary:
      createStylesheetPrecedenceOrderDiagnosticBoundary(
        precedenceRows,
        observedHeadOrder.rows
      ),
    resourceMapPlan: createPreloadPreinitResourceMapPlan(
      stateByResourceKey,
      dedupeRows
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
  const resourceKind = getObservedFakeHeadResourceKind(nodeName, relationship);

  return freezeRecord({
    rowId: `observed-head-child-${childIndex}`,
    rowType: 'head-child',
    childIndex,
    nodeName,
    relationship,
    resourceKind,
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

function getObservedFakeHeadResourceKind(nodeName, relationship) {
  if (nodeName === 'SCRIPT') {
    return 'script';
  }
  if (relationship === 'stylesheet') {
    return 'style';
  }
  if (relationship === 'preload') {
    return 'preload';
  }
  return null;
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
  for (const state of stateByResourceKey.values()) {
    if (state.preloadRow !== null) {
      preloadResourceCount++;
    }
    if (state.preinitRow !== null) {
      preinitResourceCount++;
    }
  }

  return freezeRecord({
    resourceMapKind:
      'react-19.2.6-preload-preinit-resource-map-diagnostic',
    resourceMapCreated: false,
    resourceMapMutated: false,
    inputRowCount: dedupeRows.length,
    uniqueResourceCount: stateByResourceKey.size,
    preloadResourceCount,
    preinitResourceCount,
    dedupedRowCount: dedupeRows.filter(
      (row) => row.wouldInsertIntoHead === false
    ).length,
    rawValuesRetained: false,
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

  const actionKind = getIntentEnumProperty(
    contract,
    intent,
    'actionKind',
    freezeArray(['function', 'string', 'none', 'unknown']),
    'unknown'
  );
  const actionSource = getIntentEnumProperty(
    contract,
    intent,
    'actionSource',
    freezeArray(['form', 'submit-control', 'replay', 'none', 'unknown']),
    'unknown'
  );
  const submitControlKind = getIntentEnumProperty(
    contract,
    intent,
    'submitControlKind',
    freezeArray(['button', 'input', 'none', 'unknown']),
    'unknown'
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
  const replayed = getIntentBooleanProperty(
    contract,
    intent,
    'replayed',
    false
  );
  const functionAction = actionKind === 'function';

  return freezeRecord({
    explicitIntent: true,
    intentKind: 'submission',
    eventName,
    actionKind,
    actionSource,
    submitControlKind,
    defaultPrevented,
    transitionScheduled,
    replayed,
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

  return freezeRecord({
    explicitIntent: true,
    intentKind: 'reset',
    dispatcherKey,
    resetSource,
    formOwnership,
    transitionContext,
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
    formCaptured: normalizedIntent.formCaptured,
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
      sourceContractId === 'preload' ? 'preload' : 'preinit',
    capability: 'react-dom-resource-preload-preinit-dedupe-order-diagnostic',
    oracleKind: resourceHintOracleKind,
    deterministicFakeDomOnly: true,
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
  createFormActionResetDispatcherGate,
  createControlledInputPrivateWrapperPropertyPayloadRecord,
  createControlledInputPrivateRestoreQueueDiagnosticGate,
  createControlledInputValueTrackerGate,
  createResourceHintFakeDomAdapterGate,
  createResourceHintFakeDomInsertionGate,
  createResourceHintHeadBoundaryGate,
  createResourceHintHeadClearRetainGate,
  createResourceHintPreloadPreinitOrderGate,
  createResourceFormActionInternalsGate,
  createUnsupportedFormActionResetDispatcherError,
  createUnsupportedControlledInputValueTrackerError,
  createUnsupportedControlledInputRestoreQueueDiagnosticError,
  createUnsupportedResourceHintFakeDomAdapterError,
  createUnsupportedResourceHintFakeDomInsertionError,
  createUnsupportedResourceHintHeadBoundaryError,
  createUnsupportedResourceHintHeadClearRetainError,
  createUnsupportedResourceHintPreloadPreinitOrderError,
  createUnsupportedResourceFormActionInternalsError,
  createUnsupportedResourceHintDispatcherMetadataError,
  describeControlledInputValueTrackerGate,
  describeControlledInputValueTrackerFakeDomDiagnosticGate,
  describeControlledInputPrivateRestoreQueueDiagnosticGate,
  describeControlledInputPrivateWrapperPropertyPayloadGate,
  describePrivateFormActionResetDispatcherGate,
  describePrivateResourceHintFakeDomAdapterGate,
  describePrivateResourceHintFakeDomInsertionGate,
  describePrivateResourceHintHeadBoundaryGate,
  describePrivateResourceHintHeadClearRetainGate,
  describePrivateResourceHintPreloadPreinitOrderGate,
  describePrivateResourceHintDispatcherMetadataGate,
  describeResourceFormActionInternalsGate,
  formActionResetDispatcherBlockedSideEffects,
  formActionResetDispatcherContracts,
  formActionResetDispatcherGateSchemaVersion,
  formActionResetDispatcherMissingPrerequisites,
  formActionResetIntentSideEffects,
  formActionSubmissionIntentSideEffects,
  formActionContracts,
  detachControlledInputValueTrackerFakeDomDiagnostic,
  getPrivateControlledInputValueTrackerRecordPayload,
  getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload,
  getPrivateControlledInputRestoreQueueDiagnosticRecordPayload,
  getPrivateControlledInputWrapperPropertyPayloadRecordPayload,
  getPrivateFormActionResetDispatcherRecordPayload,
  getPrivateResourceHintFakeDomAdapterAdmissionRecordPayload,
  getPrivateResourceHintFakeDomInsertionRecordPayload,
  getPrivateResourceHintHeadBoundaryRecordPayload,
  getPrivateResourceHintHeadClearRetainRecordPayload,
  getPrivateResourceHintPreloadPreinitOrderRecordPayload,
  getPrivateResourceFormActionGateRecordPayload,
  getPrivateResourceHintDispatcherMetadataRecordPayload,
  isPrivateResourceHintFakeDomAdapterAdmissionRecord,
  isPrivateResourceHintFakeDomInsertionRecord,
  isPrivateResourceHintHeadBoundaryRecord,
  isPrivateResourceHintHeadClearRetainRecord,
  isPrivateResourceHintPreloadPreinitOrderRecord,
  isPrivateControlledInputValueTrackerRecord,
  isPrivateControlledInputValueTrackerFakeDomDiagnosticRecord,
  isPrivateControlledInputRestoreQueueDiagnosticRecord,
  isPrivateControlledInputWrapperPropertyPayloadRecord,
  isPrivateFormActionResetDispatcherRecord,
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
  privateFormActionResetDispatcherGateErrorCode,
  privateFormActionResetDispatcherGateId,
  privateFormActionResetDispatcherInvalidIntentCode,
  privateFormActionResetDispatcherInvalidRecordCode,
  privateFormActionResetDispatcherRecordType,
  privateFormActionResetDispatcherStatus,
  privateFormActionResetDispatcherUnknownIntentCode,
  privateFormActionResetIntentRecordedStatus,
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
  privateResourceHintDispatcherMetadataGateErrorCode,
  privateResourceHintDispatcherMetadataGateId,
  privateResourceHintDispatcherMetadataInvalidShapeCode,
  privateResourceHintDispatcherMetadataRecordType,
  privateResourceHintDispatcherMetadataUnknownRequestCode,
  installControlledInputValueTrackerFakeDomDiagnostic,
  observeControlledInputValueTrackerFakeDomDiagnostic,
  recordFormActionResetIntent,
  recordFormActionSubmissionIntent,
  recordControlledInputPostEventRestoreIntentFromFakeDomObservation,
  recordControlledInputValueTrackerScenario,
  recordUnsupportedControlledFormRequest,
  recordUnsupportedFormActionRequest,
  recordUnsupportedResourceHintDispatcherRequest,
  recordUnsupportedResourceHintRequest,
  recordUnsupportedSingletonRequest,
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
  resourceHintDispatcherMetadataContracts,
  resourceHintDispatcherMetadataGateSchemaVersion,
  resourceHintDispatcherMissingPrerequisites,
  resourceHintDispatcherSideEffects,
  resourceHintContracts,
  singletonContracts,
  unsupportedStatus
};
