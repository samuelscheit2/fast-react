'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  unimplementedCode
} = require('../placeholder-utils.js');

const resourceFormActionInternalsGateSchemaVersion = 1;
const resourceHintDispatcherMetadataGateSchemaVersion = 1;
const privateResourceFormActionGateRecordType =
  'fast.react_dom.private_resource_form_action_gate_record';
const privateResourceHintDispatcherMetadataRecordType =
  'fast.react_dom.private_resource_hint_dispatcher_metadata_record';
const privateResourceHintDispatcherMetadataGateId =
  'resource-hint-private-dispatcher-metadata-gate-1';
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
const unsupportedStatus = 'unsupported';

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

const contractByAreaAndName = new Map();
indexContracts('resource-hint', resourceHintContracts);
indexContracts('host-singleton', singletonContracts);
indexContracts('form-action', formActionContracts);
indexContracts('controlled-form', controlledFormContracts);

const recordPayloads = new WeakMap();
const resourceHintDispatcherMetadataPayloads = new WeakMap();
const defaultGate = createResourceFormActionInternalsGate();

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

function recordUnsupportedResourceHintRequest(requestName, args) {
  return defaultGate.recordResourceHintRequest(requestName, args);
}

function recordUnsupportedResourceHintDispatcherRequest(requestName, args) {
  return defaultGate.recordResourceHintDispatcherRequest(requestName, args);
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
      singletons: singletonContracts,
      formActions: formActionContracts,
      controlledForms: controlledFormContracts
    }),
    sideEffects: noSideEffects,
    resourceHintDispatcherMetadata:
      describePrivateResourceHintDispatcherMetadataGate(),
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
    missingPrerequisites: resourceHintDispatcherMissingPrerequisites
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
  controlledFormContracts,
  createResourceFormActionInternalsGate,
  createUnsupportedResourceFormActionInternalsError,
  createUnsupportedResourceHintDispatcherMetadataError,
  describePrivateResourceHintDispatcherMetadataGate,
  describeResourceFormActionInternalsGate,
  formActionContracts,
  getPrivateResourceFormActionGateRecordPayload,
  getPrivateResourceHintDispatcherMetadataRecordPayload,
  isPrivateResourceFormActionGateRecord,
  isPrivateResourceHintDispatcherMetadataRecord,
  missingPrerequisites,
  noSideEffects,
  privateResourceFormActionGateErrorCode,
  privateResourceFormActionGateRecordType,
  privateResourceFormActionGateUnknownRequestCode,
  privateResourceHintDispatcherMetadataGateErrorCode,
  privateResourceHintDispatcherMetadataGateId,
  privateResourceHintDispatcherMetadataInvalidShapeCode,
  privateResourceHintDispatcherMetadataRecordType,
  privateResourceHintDispatcherMetadataUnknownRequestCode,
  recordUnsupportedControlledFormRequest,
  recordUnsupportedFormActionRequest,
  recordUnsupportedResourceHintDispatcherRequest,
  recordUnsupportedResourceHintRequest,
  recordUnsupportedSingletonRequest,
  resourceFormActionInternalsGateSchemaVersion,
  resourceHintDispatcherMetadataContracts,
  resourceHintDispatcherMetadataGateSchemaVersion,
  resourceHintDispatcherMissingPrerequisites,
  resourceHintDispatcherSideEffects,
  resourceHintContracts,
  singletonContracts,
  unsupportedStatus
};
