'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  unimplementedCode
} = require('../placeholder-utils.js');

const hasOwn = Object.prototype.hasOwnProperty;

const resourceFormActionInternalsGateSchemaVersion = 1;
const controlledInputValueTrackerGateSchemaVersion = 1;
const privateResourceFormActionGateRecordType =
  'fast.react_dom.private_resource_form_action_gate_record';
const privateControlledInputValueTrackerGateRecordType =
  'fast.react_dom.private_controlled_input_value_tracker_gate_record';
const privateResourceFormActionGateErrorCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ACTION_GATE';
const privateResourceFormActionGateUnknownRequestCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ACTION_GATE_UNKNOWN_REQUEST';
const privateControlledInputValueTrackerGateErrorCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE';
const privateControlledInputValueTrackerGateUnknownScenarioCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE_UNKNOWN_SCENARIO';
const privateControlledInputValueTrackerGateInvalidScenarioCode =
  'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE_INVALID_SCENARIO';
const unsupportedStatus = 'unsupported';
const controlledInputValueTrackerGateId =
  'controlled-input-value-tracker-private-gate-1';

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

const recordPayloads = new WeakMap();
const controlledInputValueTrackerRecordPayloads = new WeakMap();
const defaultGate = createResourceFormActionInternalsGate();
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

function recordUnsupportedResourceHintRequest(requestName, args) {
  return defaultGate.recordResourceHintRequest(requestName, args);
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

function getPrivateResourceFormActionGateRecordPayload(record) {
  return recordPayloads.get(record) || null;
}

function isPrivateResourceFormActionGateRecord(value) {
  return recordPayloads.has(value);
}

function getPrivateControlledInputValueTrackerRecordPayload(record) {
  return controlledInputValueTrackerRecordPayloads.get(record) || null;
}

function isPrivateControlledInputValueTrackerRecord(value) {
  return controlledInputValueTrackerRecordPayloads.has(value);
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
      singletons: singletonContracts,
      formActions: formActionContracts,
      controlledForms: controlledFormContracts,
      controlledInputValueTrackers: controlledInputValueTrackerContracts
    }),
    sideEffects: noSideEffects,
    missingPrerequisites
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
    postEventRestoreBoundary: createPostEventRestoreBoundary(),
    publicControlledBehaviorBoundary:
      createPublicControlledBehaviorBoundary(),
    sideEffects: controlledInputValueTrackerSideEffects,
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
  return {
    requestIdPrefix: getStringOption(
      options,
      'requestIdPrefix',
      'resource-form-action-gate'
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
  controlledInputValueTrackerContracts,
  controlledInputValueTrackerGateId,
  controlledInputValueTrackerGateSchemaVersion,
  controlledInputValueTrackerMissingPrerequisites,
  controlledInputValueTrackerOracleCoverage,
  controlledInputValueTrackerSideEffects,
  controlledFormContracts,
  createControlledInputValueTrackerGate,
  createResourceFormActionInternalsGate,
  createUnsupportedControlledInputValueTrackerError,
  createUnsupportedResourceFormActionInternalsError,
  describeControlledInputValueTrackerGate,
  describeResourceFormActionInternalsGate,
  formActionContracts,
  getPrivateControlledInputValueTrackerRecordPayload,
  getPrivateResourceFormActionGateRecordPayload,
  isPrivateControlledInputValueTrackerRecord,
  isPrivateResourceFormActionGateRecord,
  missingPrerequisites,
  noSideEffects,
  privateControlledInputValueTrackerGateErrorCode,
  privateControlledInputValueTrackerGateInvalidScenarioCode,
  privateControlledInputValueTrackerGateRecordType,
  privateControlledInputValueTrackerGateUnknownScenarioCode,
  privateResourceFormActionGateErrorCode,
  privateResourceFormActionGateRecordType,
  privateResourceFormActionGateUnknownRequestCode,
  recordControlledInputValueTrackerScenario,
  recordUnsupportedControlledFormRequest,
  recordUnsupportedFormActionRequest,
  recordUnsupportedResourceHintRequest,
  recordUnsupportedSingletonRequest,
  resourceFormActionInternalsGateSchemaVersion,
  resourceHintContracts,
  singletonContracts,
  unsupportedStatus
};
