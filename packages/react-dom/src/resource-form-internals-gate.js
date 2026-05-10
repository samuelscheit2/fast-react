'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  unimplementedCode
} = require('../placeholder-utils.js');

const hasOwn = Object.prototype.hasOwnProperty;

const resourceFormActionInternalsGateSchemaVersion = 1;
const resourceHintDispatcherMetadataGateSchemaVersion = 1;
const resourceHintFakeDomAdapterGateSchemaVersion = 1;
const resourceHintFakeDomInsertionGateSchemaVersion = 1;
const controlledInputValueTrackerGateSchemaVersion = 1;
const controlledInputPrivateWrapperGateSchemaVersion = 1;
const privateResourceFormActionGateRecordType =
  'fast.react_dom.private_resource_form_action_gate_record';
const privateResourceHintDispatcherMetadataRecordType =
  'fast.react_dom.private_resource_hint_dispatcher_metadata_record';
const privateResourceHintFakeDomAdapterAdmissionRecordType =
  'fast.react_dom.private_resource_hint_fake_dom_adapter_admission_record';
const privateResourceHintFakeDomInsertionRecordType =
  'fast.react_dom.private_resource_hint_fake_dom_insertion_record';
const privateControlledInputValueTrackerGateRecordType =
  'fast.react_dom.private_controlled_input_value_tracker_gate_record';
const privateControlledInputWrapperPropertyPayloadRecordType =
  'fast.react_dom.private_controlled_input_wrapper_property_payload_record';
const privateResourceHintDispatcherMetadataGateId =
  'resource-hint-private-dispatcher-metadata-gate-1';
const privateResourceHintFakeDomAdapterGateId =
  'resource-hint-private-dispatcher-fake-dom-adapter-gate-1';
const privateResourceHintFakeDomInsertionGateId =
  'resource-hint-private-fake-dom-insertion-gate-1';
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
const privateResourceFormActionGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ACTION_GATE';
const privateResourceFormActionGateUnknownRequestCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ACTION_GATE_UNKNOWN_REQUEST';
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
const privateControlledInputValueTrackerGateErrorCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE';
const privateControlledInputValueTrackerGateUnknownScenarioCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE_UNKNOWN_SCENARIO';
const privateControlledInputValueTrackerGateInvalidScenarioCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE_INVALID_SCENARIO';
const unsupportedStatus = 'unsupported';
const controlledInputValueTrackerGateId =
  'controlled-input-value-tracker-private-gate-1';
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
const resourceHintDispatcherMetadataPayloads = new WeakMap();
const resourceHintFakeDomAdapterAdmissionPayloads = new WeakMap();
const resourceHintFakeDomInsertionPayloads = new WeakMap();
const controlledInputValueTrackerRecordPayloads = new WeakMap();
const controlledInputPrivateWrapperPropertyPayloadRecordPayloads =
  new WeakMap();
const defaultGate = createResourceFormActionInternalsGate();
const defaultResourceHintFakeDomAdapterGate =
  createResourceHintFakeDomAdapterGate();
const defaultControlledInputValueTrackerGate =
  createControlledInputValueTrackerGate();

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

function createControlledInputValueTrackerGate(options) {
  const gateState = createGateState(options);

  return Object.freeze({
    recordTrackerScenario(scenario) {
      return recordControlledInputValueTrackerScenarioWithGate(
        gateState,
        scenario
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

function recordUnsupportedControlledFormRequest(requestName, args) {
  return defaultGate.recordControlledFormRequest(requestName, args);
}

function recordControlledInputValueTrackerScenario(scenario) {
  return defaultControlledInputValueTrackerGate.recordTrackerScenario(scenario);
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

function getPrivateControlledInputValueTrackerRecordPayload(record) {
  return controlledInputValueTrackerRecordPayloads.get(record) || null;
}

function isPrivateControlledInputValueTrackerRecord(value) {
  return controlledInputValueTrackerRecordPayloads.has(value);
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
      singletons: singletonContracts,
      formActions: formActionContracts,
      controlledForms: controlledFormContracts,
      controlledInputValueTrackers: controlledInputValueTrackerContracts,
      controlledInputPrivateWrapperPropertyPayloads:
        controlledInputPrivateWrapperPropertyPayloadContracts
    }),
    sideEffects: noSideEffects,
    resourceHintDispatcherMetadata:
      describePrivateResourceHintDispatcherMetadataGate(),
    controlledInputValueTracker: describeControlledInputValueTrackerGate(),
    missingPrerequisites
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
    fakeDomInsertion: describePrivateResourceHintFakeDomInsertionGate()
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
    missingPrerequisites: resourceHintFakeDomInsertionMissingPrerequisites
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
    privateWrapperPropertyPayload:
      describeControlledInputPrivateWrapperPropertyPayloadGate(),
    postEventRestoreBoundary: createPostEventRestoreBoundary(),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects: controlledInputValueTrackerSideEffects,
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

function getAdmissionStringProperty(record, key, fallback) {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
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
  controlledInputValueTrackerContracts,
  controlledInputValueTrackerGateId,
  controlledInputValueTrackerGateSchemaVersion,
  controlledInputValueTrackerMissingPrerequisites,
  controlledInputValueTrackerOracleCoverage,
  controlledInputValueTrackerSideEffects,
  createControlledInputPrivateWrapperPropertyPayloadRecord,
  createControlledInputValueTrackerGate,
  createResourceHintFakeDomAdapterGate,
  createResourceHintFakeDomInsertionGate,
  createResourceFormActionInternalsGate,
  createUnsupportedControlledInputValueTrackerError,
  createUnsupportedResourceHintFakeDomAdapterError,
  createUnsupportedResourceHintFakeDomInsertionError,
  createUnsupportedResourceFormActionInternalsError,
  createUnsupportedResourceHintDispatcherMetadataError,
  describeControlledInputValueTrackerGate,
  describeControlledInputPrivateWrapperPropertyPayloadGate,
  describePrivateResourceHintFakeDomAdapterGate,
  describePrivateResourceHintFakeDomInsertionGate,
  describePrivateResourceHintDispatcherMetadataGate,
  describeResourceFormActionInternalsGate,
  formActionContracts,
  getPrivateControlledInputValueTrackerRecordPayload,
  getPrivateControlledInputWrapperPropertyPayloadRecordPayload,
  getPrivateResourceHintFakeDomAdapterAdmissionRecordPayload,
  getPrivateResourceHintFakeDomInsertionRecordPayload,
  getPrivateResourceFormActionGateRecordPayload,
  getPrivateResourceHintDispatcherMetadataRecordPayload,
  isPrivateResourceHintFakeDomAdapterAdmissionRecord,
  isPrivateResourceHintFakeDomInsertionRecord,
  isPrivateControlledInputValueTrackerRecord,
  isPrivateControlledInputWrapperPropertyPayloadRecord,
  isPrivateResourceFormActionGateRecord,
  isPrivateResourceHintDispatcherMetadataRecord,
  missingPrerequisites,
  noSideEffects,
  privateControlledInputValueTrackerGateErrorCode,
  privateControlledInputValueTrackerGateInvalidScenarioCode,
  privateControlledInputValueTrackerGateRecordType,
  privateControlledInputValueTrackerGateUnknownScenarioCode,
  privateControlledInputWrapperPropertyPayloadRecordType,
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
  privateResourceHintDispatcherMetadataGateErrorCode,
  privateResourceHintDispatcherMetadataGateId,
  privateResourceHintDispatcherMetadataInvalidShapeCode,
  privateResourceHintDispatcherMetadataRecordType,
  privateResourceHintDispatcherMetadataUnknownRequestCode,
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
  resourceHintDispatcherMetadataContracts,
  resourceHintDispatcherMetadataGateSchemaVersion,
  resourceHintDispatcherMissingPrerequisites,
  resourceHintDispatcherSideEffects,
  resourceHintContracts,
  singletonContracts,
  unsupportedStatus
};
