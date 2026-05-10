'use strict';

const bindingStatus = 'placeholder';
const packageName = '@fast-react/native';
const nativeAddonName = 'fast_react_napi';
const nodeApiVersionFloor = 8;
const supportedNodeEngineRange = '>=22.0.0';
const unavailableErrorCode = 'FAST_REACT_NATIVE_BINDING_UNIMPLEMENTED';
const rustNativeExportsNotBuiltErrorCode = 'FAST_REACT_NAPI_EXPORTS_NOT_BUILT';
const platformArtifactPolicy =
  'future per-platform optional npm packages; no native addon is built or loaded yet';
const optionalPackagePrefix = '@fast-react/native-';
const nativeRootBridgeRequestShapeGateStatus =
  'admitted-native-root-bridge-js-request-shape';
const nativeRootBridgeHandleAdmissionPreflightStatus =
  'preflighted-native-root-bridge-real-handle-admission';
const nativeRootBridgeRequestValidationModel =
  'fast-react-napi.NativeRootBridgeRequestSequenceValidator';
const nativeRootBridgeHandleTableModel = 'fast-react-napi.BridgeHandleTable';
const nativeRootBridgeRequestShapeErrorCode =
  'FAST_REACT_NATIVE_ROOT_BRIDGE_REQUEST_SHAPE_INVALID';
const nativeRootBridgeRequestKindCreate = 'create';
const nativeRootBridgeRequestKindRender = 'render';
const nativeRootBridgeRequestKindUnmount = 'unmount';
const nativeRootBridgeHandleKindRoot = 'root';
const nativeRootBridgeHandleKindValue = 'value';
const nativeRootBridgeRootHandleStateActive = 'active';
const nativeRootBridgeRootHandleStateRetired = 'retired';
const nativeRootBridgeLifecycleTransitionNoneToActive = 'none->active';
const nativeRootBridgeLifecycleTransitionActiveToActive = 'active->active';
const nativeRootBridgeLifecycleTransitionActiveToRetired = 'active->retired';
const nativeRootBridgeRequestKinds = Object.freeze([
  nativeRootBridgeRequestKindCreate,
  nativeRootBridgeRequestKindRender,
  nativeRootBridgeRequestKindUnmount
]);
const nativeRootBridgeHandleKinds = Object.freeze([
  nativeRootBridgeHandleKindRoot,
  nativeRootBridgeHandleKindValue
]);
const nativeRootBridgeRootHandleStates = Object.freeze([
  nativeRootBridgeRootHandleStateActive,
  nativeRootBridgeRootHandleStateRetired
]);
const nativeRootBridgeLifecycleTransitions = Object.freeze([
  nativeRootBridgeLifecycleTransitionNoneToActive,
  nativeRootBridgeLifecycleTransitionActiveToActive,
  nativeRootBridgeLifecycleTransitionActiveToRetired
]);
const nativeRootBridgeJsRequestRecordFields = Object.freeze([
  'requestId',
  'kind',
  'environmentId',
  'rootHandle',
  'rootId',
  'valueHandle',
  'rootHandleState'
]);
const nativeRootBridgeRustRequestRecordFields = Object.freeze([
  'request_id',
  'kind',
  'environment_id',
  'root_handle',
  'root_id',
  'value_handle',
  'root_handle_state'
]);
const nativeRootBridgeRustValidationRecordFields = Object.freeze([
  'request_id',
  'kind',
  'environment_id',
  'root_handle',
  'root_id',
  'value_handle',
  'root_handle_state',
  'lifecycle_transition',
  'root_handle_validated',
  'value_handle_validated'
]);
const nativeRootBridgeJsHandleFields = Object.freeze([
  'environmentId',
  'slot',
  'generation',
  'kind'
]);
const nativeRootBridgeRustHandleFields = Object.freeze([
  'environment_id',
  'slot',
  'generation',
  'kind'
]);
const nativeRootBridgeHandleAdmissionActions = Object.freeze([
  'admit-root-handle',
  'admit-value-handle',
  'validate-active-root-handle',
  'validate-value-handle',
  'retire-root-handle',
  'validate-retired-root-handle'
]);
const nativeRootBridgeValidationErrorCodes = Object.freeze({
  createAfterRootCreated:
    'FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED',
  handleMismatch: 'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_MISMATCH',
  invalidHandle: 'FAST_REACT_NAPI_INVALID_HANDLE',
  recordEnvironmentMismatch:
    'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ENVIRONMENT_MISMATCH',
  requestAfterUnmount: 'FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT',
  rootHandleStateMismatch:
    'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH',
  rootHandleStillActive:
    'FAST_REACT_NAPI_ROOT_REQUEST_RETIRED_HANDLE_STILL_ACTIVE',
  rootIdMismatch: 'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ROOT_ID_MISMATCH',
  sequenceMustStartWithCreate:
    'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
  sequenceOutOfOrder:
    'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER',
  shapeInvalid: nativeRootBridgeRequestShapeErrorCode,
  staleHandle: 'FAST_REACT_NAPI_STALE_HANDLE',
  unexpectedValueHandle:
    'FAST_REACT_NAPI_ROOT_REQUEST_UNEXPECTED_VALUE_HANDLE',
  wrongEnvironment: 'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
  wrongHandleKind: 'FAST_REACT_NAPI_WRONG_HANDLE_KIND'
});
const nativeRootBridgeHandleAdmissionPreflight = Object.freeze({
  preflightStatus: nativeRootBridgeHandleAdmissionPreflightStatus,
  handleTableModel: nativeRootBridgeHandleTableModel,
  validationModel: nativeRootBridgeRequestValidationModel,
  admissionActions: nativeRootBridgeHandleAdmissionActions
});

function freezeNativeTarget({ target, platform, arch, libc, toolchain }) {
  return Object.freeze({
    target,
    platform,
    arch,
    libc: libc ?? null,
    toolchain: toolchain ?? null,
    optionalPackageName: `${optionalPackagePrefix}${target}`,
    nativeFileName: `${nativeAddonName}.${target}.node`
  });
}

const nativeTargetMatrix = Object.freeze([
  freezeNativeTarget({ target: 'darwin-arm64', platform: 'darwin', arch: 'arm64' }),
  freezeNativeTarget({ target: 'darwin-x64', platform: 'darwin', arch: 'x64' }),
  freezeNativeTarget({
    target: 'linux-arm64-gnu',
    platform: 'linux',
    arch: 'arm64',
    libc: 'gnu'
  }),
  freezeNativeTarget({
    target: 'linux-arm64-musl',
    platform: 'linux',
    arch: 'arm64',
    libc: 'musl'
  }),
  freezeNativeTarget({
    target: 'linux-x64-gnu',
    platform: 'linux',
    arch: 'x64',
    libc: 'gnu'
  }),
  freezeNativeTarget({
    target: 'linux-x64-musl',
    platform: 'linux',
    arch: 'x64',
    libc: 'musl'
  }),
  freezeNativeTarget({
    target: 'win32-arm64-msvc',
    platform: 'win32',
    arch: 'arm64',
    toolchain: 'msvc'
  }),
  freezeNativeTarget({
    target: 'win32-x64-msvc',
    platform: 'win32',
    arch: 'x64',
    toolchain: 'msvc'
  })
]);

const nativeTargetsByName = Object.freeze(
  Object.fromEntries(nativeTargetMatrix.map((target) => [target.target, target]))
);

const platformPackages = Object.freeze(
  Object.fromEntries(
    nativeTargetMatrix.map((target) => [
      target.target,
      target.optionalPackageName
    ])
  )
);

const supportedNativeTargets = Object.freeze(
  nativeTargetMatrix.map((target) => target.target)
);

const nativeBoundaryErrorCodeMap = Object.freeze({
  unsupportedNativeExecution: unavailableErrorCode,
  rustNativeExportsNotBuilt: rustNativeExportsNotBuiltErrorCode,
  rootBridgeWrongEnvironment:
    'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT',
  rootBridgeStaleHandle: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
  rootBridgeWrongLifecycleOrder:
    'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER'
});

function freezeNativeRootBridgeValidationEvidence({
  scenario,
  sourceErrorCode,
  boundaryErrorCode
}) {
  return Object.freeze({
    scenario,
    sourceErrorCode,
    boundaryErrorCode,
    nativeExecution: false,
    reactBehaviorError: false
  });
}

const nativeRootBridgeValidationEvidence = Object.freeze([
  freezeNativeRootBridgeValidationEvidence({
    scenario: 'wrong-environment-root-handle',
    sourceErrorCode: 'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
    boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeWrongEnvironment
  }),
  freezeNativeRootBridgeValidationEvidence({
    scenario: 'stale-root-or-value-handle',
    sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle
  }),
  freezeNativeRootBridgeValidationEvidence({
    scenario: 'wrong-root-lifecycle-order',
    sourceErrorCode:
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
    boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeWrongLifecycleOrder
  })
]);

const nativeRootBridgeRequestShape = Object.freeze({
  gateStatus: nativeRootBridgeRequestShapeGateStatus,
  validationModel: nativeRootBridgeRequestValidationModel,
  handleTableModel: nativeRootBridgeHandleTableModel,
  jsRequestRecordFields: nativeRootBridgeJsRequestRecordFields,
  rustRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
  rustValidationRecordFields: nativeRootBridgeRustValidationRecordFields,
  jsHandleFields: nativeRootBridgeJsHandleFields,
  rustHandleFields: nativeRootBridgeRustHandleFields,
  requestKinds: nativeRootBridgeRequestKinds,
  handleKinds: nativeRootBridgeHandleKinds,
  rootHandleStates: nativeRootBridgeRootHandleStates,
  lifecycleTransitions: nativeRootBridgeLifecycleTransitions,
  handleAdmissionPreflight: nativeRootBridgeHandleAdmissionPreflight,
  validationErrorCodes: nativeRootBridgeValidationErrorCodes
});

const nativeBindingManifest = Object.freeze({
  status: bindingStatus,
  packageName,
  nativeAddonName,
  nodeApiVersionFloor,
  supportedNodeEngineRange,
  platformArtifactPolicy,
  optionalPackagePrefix,
  nativeTargetMatrix,
  nativeRootBridgeRequestShape,
  platformPackages,
  supportedNativeTargets,
  nativeBoundaryErrorCodeMap,
  nativeRootBridgeValidationEvidence
});

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function createNativeRootBridgeRequestShapeGate(requests) {
  const requestList = Array.isArray(requests) ? requests : [requests];
  const sequenceState = {
    lastRequestId: null,
    rootHandle: null,
    rootId: null,
    rootRetired: false
  };
  const validationRecords = requestList.map((request, index) =>
    validateNativeRootBridgeRequestShapeRecord(request, sequenceState, index)
  );
  const handleAdmissionPreflight =
    createNativeRootBridgeHandleAdmissionPreflight(validationRecords);

  return Object.freeze({
    gateStatus: nativeRootBridgeRequestShapeGateStatus,
    validationModel: nativeRootBridgeRequestValidationModel,
    handleTableModel: nativeRootBridgeHandleTableModel,
    requestCount: validationRecords.length,
    validationRecords: Object.freeze(validationRecords),
    handleAdmissionPreflight,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function validateNativeRootBridgeRequestShapeRecord(input, sequenceState, index) {
  assertBlockedNativeRootBridgeHandoff(input);
  const record = getNativeRootBridgeRequestRecord(input);
  assertPlainObject(record, 'Expected a native root bridge request record.');

  const requestId = assertPositiveSafeInteger(
    record.requestId,
    'requestId'
  );
  validateRequestSequenceOrder(sequenceState, requestId);

  if (sequenceState.rootRetired) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge request ${requestId} was recorded after root unmount.`,
      nativeRootBridgeValidationErrorCodes.requestAfterUnmount,
      { index, requestId }
    );
  }

  const kind = assertNativeRootBridgeRequestKind(record.kind, index);
  const environmentId = assertPositiveSafeInteger(
    record.environmentId,
    'environmentId'
  );
  const rootHandle = normalizeNativeRootBridgeHandle(
    record.rootHandle,
    nativeRootBridgeHandleKindRoot,
    environmentId,
    'rootHandle'
  );
  const rootId = assertPositiveSafeInteger(record.rootId, 'rootId');
  const expectedRootHandleState =
    kind === nativeRootBridgeRequestKindUnmount
      ? nativeRootBridgeRootHandleStateRetired
      : nativeRootBridgeRootHandleStateActive;

  if (record.rootHandleState !== expectedRootHandleState) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge ${kind} request has root handle state ${String(
        record.rootHandleState
      )}, expected ${expectedRootHandleState}.`,
      nativeRootBridgeValidationErrorCodes.rootHandleStateMismatch,
      {
        actual: record.rootHandleState,
        expected: expectedRootHandleState,
        index,
        requestId
      }
    );
  }

  const valueHandle =
    record.valueHandle == null
      ? null
      : normalizeNativeRootBridgeHandle(
          record.valueHandle,
          nativeRootBridgeHandleKindValue,
          environmentId,
          'valueHandle'
        );

  if (sequenceState.rootHandle === null) {
    if (kind !== nativeRootBridgeRequestKindCreate) {
      throwNativeRootBridgeRequestShapeError(
        `Native root bridge request sequence must start with create, got ${kind}.`,
        nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate,
        { actual: kind, index, requestId }
      );
    }
  } else {
    if (kind === nativeRootBridgeRequestKindCreate) {
      throwNativeRootBridgeRequestShapeError(
        `Native root bridge request ${requestId} attempted to create another root in an active sequence.`,
        nativeRootBridgeValidationErrorCodes.createAfterRootCreated,
        { index, requestId }
      );
    }

    validateSameNativeRootBridgeHandle(
      sequenceState.rootHandle,
      rootHandle,
      index,
      requestId
    );
    if (rootId !== sequenceState.rootId) {
      throwNativeRootBridgeRequestShapeError(
        `Native root bridge request record has root id ${rootId}, expected ${sequenceState.rootId}.`,
        nativeRootBridgeValidationErrorCodes.rootIdMismatch,
        {
          actual: rootId,
          expected: sequenceState.rootId,
          index,
          requestId
        }
      );
    }
  }

  if (kind === nativeRootBridgeRequestKindUnmount && valueHandle !== null) {
    throwNativeRootBridgeRequestShapeError(
      'Native root bridge unmount record cannot carry a value handle.',
      nativeRootBridgeValidationErrorCodes.unexpectedValueHandle,
      { index, requestId }
    );
  }

  const lifecycleTransition = getNativeRootBridgeLifecycleTransition(kind);
  const valueHandleValidated = valueHandle !== null;
  const rustValidationRecord = Object.freeze({
    request_id: requestId,
    kind,
    environment_id: environmentId,
    root_handle: toRustNativeRootBridgeHandle(rootHandle),
    root_id: rootId,
    value_handle:
      valueHandle === null ? null : toRustNativeRootBridgeHandle(valueHandle),
    root_handle_state: expectedRootHandleState,
    lifecycle_transition: lifecycleTransition,
    root_handle_validated: true,
    value_handle_validated: valueHandleValidated
  });
  const validationRecord = Object.freeze({
    requestId,
    kind,
    environmentId,
    rootHandle,
    rootId,
    valueHandle,
    rootHandleState: expectedRootHandleState,
    lifecycleTransition,
    rootHandleValidated: true,
    valueHandleValidated,
    rustValidationRecord
  });

  sequenceState.lastRequestId = requestId;
  if (sequenceState.rootHandle === null) {
    sequenceState.rootHandle = rootHandle;
    sequenceState.rootId = rootId;
  }
  if (kind === nativeRootBridgeRequestKindUnmount) {
    sequenceState.rootRetired = true;
  }

  return validationRecord;
}

function getNativeRootBridgeRequestRecord(input) {
  if (
    input &&
    typeof input === 'object' &&
    input.nativeRequestRecord &&
    typeof input.nativeRequestRecord === 'object'
  ) {
    return input.nativeRequestRecord;
  }

  return input;
}

function assertBlockedNativeRootBridgeHandoff(input) {
  if (!input || typeof input !== 'object' || !hasOwn(input, 'nativeRequestRecord')) {
    return;
  }

  for (const flag of [
    'nativeExecution',
    'reconcilerExecution',
    'domMutation',
    'markerWrites',
    'listenerInstallation',
    'hydration',
    'eventDispatch',
    'compatibilityClaimed'
  ]) {
    if (input[flag] === true) {
      throwNativeRootBridgeRequestShapeError(
        `Native root bridge handoff must not claim ${flag}.`,
        nativeRootBridgeRequestShapeErrorCode,
        { flag }
      );
    }
  }
}

function validateRequestSequenceOrder(sequenceState, requestId) {
  const previousRequestId = sequenceState.lastRequestId;
  if (previousRequestId === null || requestId > previousRequestId) {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    `Native root bridge request id ${requestId} must be greater than previous request id ${previousRequestId}.`,
    nativeRootBridgeValidationErrorCodes.sequenceOutOfOrder,
    { previousRequestId, requestId }
  );
}

function assertNativeRootBridgeRequestKind(kind, index) {
  if (nativeRootBridgeRequestKinds.includes(kind)) {
    return kind;
  }

  throwNativeRootBridgeRequestShapeError(
    `Unsupported native root bridge request kind: ${String(kind)}.`,
    nativeRootBridgeRequestShapeErrorCode,
    { index, kind }
  );
}

function normalizeNativeRootBridgeHandle(
  handle,
  expectedKind,
  expectedEnvironmentId,
  field
) {
  assertPlainObject(handle, `Expected ${field} to be a native bridge handle.`);

  const environmentId = assertPositiveSafeInteger(
    handle.environmentId,
    `${field}.environmentId`
  );
  if (environmentId !== expectedEnvironmentId) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge ${field} belongs to environment ${environmentId}, expected ${expectedEnvironmentId}.`,
      nativeRootBridgeValidationErrorCodes.wrongEnvironment,
      { environmentId, expectedEnvironmentId, field }
    );
  }

  if (handle.kind !== expectedKind) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge ${field} has kind ${String(
        handle.kind
      )}, expected ${expectedKind}.`,
      nativeRootBridgeValidationErrorCodes.wrongHandleKind,
      { actual: handle.kind, expected: expectedKind, field }
    );
  }

  return Object.freeze({
    environmentId,
    slot: assertPositiveSafeInteger(handle.slot, `${field}.slot`),
    generation: assertPositiveSafeInteger(
      handle.generation,
      `${field}.generation`
    ),
    kind: expectedKind
  });
}

function validateSameNativeRootBridgeHandle(expected, actual, index, requestId) {
  if (
    expected.environmentId === actual.environmentId &&
    expected.slot === actual.slot &&
    expected.generation === actual.generation &&
    expected.kind === actual.kind
  ) {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    `Native root bridge request record uses root handle slot ${actual.slot}, expected slot ${expected.slot}.`,
    nativeRootBridgeValidationErrorCodes.handleMismatch,
    { actual, expected, index, requestId }
  );
}

function getNativeRootBridgeLifecycleTransition(kind) {
  if (kind === nativeRootBridgeRequestKindCreate) {
    return nativeRootBridgeLifecycleTransitionNoneToActive;
  }
  if (kind === nativeRootBridgeRequestKindRender) {
    return nativeRootBridgeLifecycleTransitionActiveToActive;
  }
  return nativeRootBridgeLifecycleTransitionActiveToRetired;
}

function toRustNativeRootBridgeHandle(handle) {
  return Object.freeze({
    environment_id: handle.environmentId,
    slot: handle.slot,
    generation: handle.generation,
    kind: handle.kind
  });
}

function createNativeRootBridgeHandleAdmissionPreflight(validationRecords) {
  const table = createNativeRootBridgeHandleAdmissionTable();
  const admissionRecords = validationRecords.map((record, index) =>
    preflightNativeRootBridgeHandleAdmissionRecord(record, table, index)
  );

  return Object.freeze({
    preflightStatus: nativeRootBridgeHandleAdmissionPreflightStatus,
    handleTableModel: nativeRootBridgeHandleTableModel,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: admissionRecords.length,
    tableEnvironmentId: table.environmentId,
    rootId: table.rootId,
    rootHandle: table.rootHandle,
    rootRetired: table.rootRetired,
    admissionRecords: Object.freeze(admissionRecords),
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function createNativeRootBridgeHandleAdmissionTable() {
  return {
    environmentId: null,
    rootHandle: null,
    rootId: null,
    rootRetired: false,
    slots: new Map()
  };
}

function preflightNativeRootBridgeHandleAdmissionRecord(record, table, index) {
  ensureNativeRootBridgeHandleTableEnvironment(
    table,
    record.environmentId,
    index,
    record.requestId
  );

  let rootHandleAdmission = null;
  let valueHandleAdmission = null;
  let retiredRootHandleValidation = null;

  if (record.kind === nativeRootBridgeRequestKindCreate) {
    rootHandleAdmission = admitNativeRootBridgeHandleTableRecord({
      action: 'admit-root-handle',
      expectedKind: nativeRootBridgeHandleKindRoot,
      field: 'rootHandle',
      handle: record.rootHandle,
      index,
      requestId: record.requestId,
      rootId: record.rootId,
      table
    });
    if (record.valueHandle !== null) {
      valueHandleAdmission = admitNativeRootBridgeHandleTableRecord({
        action: 'admit-value-handle',
        expectedKind: nativeRootBridgeHandleKindValue,
        field: 'valueHandle',
        handle: record.valueHandle,
        index,
        requestId: record.requestId,
        rootId: null,
        table
      });
    }
  } else if (record.kind === nativeRootBridgeRequestKindRender) {
    rootHandleAdmission = validateActiveNativeRootBridgeHandleTableRecord({
      action: 'validate-active-root-handle',
      expectedKind: nativeRootBridgeHandleKindRoot,
      field: 'rootHandle',
      handle: record.rootHandle,
      index,
      requestId: record.requestId,
      rootId: record.rootId,
      table
    });
    if (record.valueHandle !== null) {
      valueHandleAdmission = admitNativeRootBridgeHandleTableRecord({
        action: 'admit-value-handle',
        expectedKind: nativeRootBridgeHandleKindValue,
        field: 'valueHandle',
        handle: record.valueHandle,
        index,
        requestId: record.requestId,
        rootId: null,
        table
      });
    }
  } else {
    rootHandleAdmission = retireNativeRootBridgeRootHandle({
      handle: record.rootHandle,
      index,
      requestId: record.requestId,
      rootId: record.rootId,
      table
    });
    retiredRootHandleValidation = validateRetiredNativeRootBridgeRootHandle({
      handle: record.rootHandle,
      index,
      requestId: record.requestId,
      table
    });
  }

  return Object.freeze({
    requestId: record.requestId,
    kind: record.kind,
    environmentId: record.environmentId,
    rootId: record.rootId,
    lifecycleTransition: record.lifecycleTransition,
    rootHandleAdmission,
    valueHandleAdmission,
    retiredRootHandleValidation,
    rustValidationRecord: record.rustValidationRecord
  });
}

function ensureNativeRootBridgeHandleTableEnvironment(
  table,
  environmentId,
  index,
  requestId
) {
  if (table.environmentId === null) {
    table.environmentId = environmentId;
    return;
  }

  if (table.environmentId === environmentId) {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    `Native root bridge request record belongs to environment ${environmentId}, expected environment ${table.environmentId}.`,
    nativeRootBridgeValidationErrorCodes.recordEnvironmentMismatch,
    {
      expectedEnvironmentId: table.environmentId,
      index,
      recordEnvironmentId: environmentId,
      requestId
    }
  );
}

function admitNativeRootBridgeHandleTableRecord({
  action,
  expectedKind,
  field,
  handle,
  index,
  requestId,
  rootId,
  table
}) {
  validateNativeRootBridgeHandleEnvironment(table, handle, field, index, requestId);
  const existing = getNativeRootBridgeHandleTableSlot(table, handle);

  if (existing === null) {
    table.slots.set(handle.slot, {
      generation: handle.generation,
      handle,
      kind: expectedKind,
      rootId,
      state: 'occupied'
    });
    if (expectedKind === nativeRootBridgeHandleKindRoot) {
      table.rootHandle = handle;
      table.rootId = rootId;
    }
    return freezeNativeRootBridgeHandleAdmissionRecord({
      action,
      currentGeneration: handle.generation,
      handle,
      rootHandleState: expectedKind === nativeRootBridgeHandleKindRoot ? 'active' : null,
      rootId,
      sourceErrorCode: null
    });
  }

  validateNativeRootBridgeHandleTableSlot({
    expectedKind,
    field,
    handle,
    index,
    requestId,
    slot: existing
  });

  if (
    expectedKind === nativeRootBridgeHandleKindRoot &&
    existing.rootId !== rootId
  ) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge request record has root id ${rootId}, expected ${existing.rootId}.`,
      nativeRootBridgeValidationErrorCodes.rootIdMismatch,
      {
        actual: rootId,
        expected: existing.rootId,
        index,
        requestId
      }
    );
  }
  if (
    expectedKind === nativeRootBridgeHandleKindRoot &&
    table.rootHandle === null
  ) {
    table.rootHandle = handle;
    table.rootId = rootId;
  }

  return freezeNativeRootBridgeHandleAdmissionRecord({
    action: action === 'admit-value-handle' ? 'validate-value-handle' : action,
    currentGeneration: existing.generation,
    handle,
    rootHandleState: expectedKind === nativeRootBridgeHandleKindRoot ? 'active' : null,
    rootId: existing.rootId,
    sourceErrorCode: null
  });
}

function validateActiveNativeRootBridgeHandleTableRecord({
  action,
  expectedKind,
  field,
  handle,
  index,
  requestId,
  rootId,
  table
}) {
  validateNativeRootBridgeHandleEnvironment(table, handle, field, index, requestId);
  const slot = getNativeRootBridgeHandleTableSlot(table, handle);
  if (slot === null) {
    throwNativeRootBridgeInvalidHandleError(handle, field, index, requestId);
  }

  validateNativeRootBridgeHandleTableSlot({
    expectedKind,
    field,
    handle,
    index,
    requestId,
    slot
  });

  if (expectedKind === nativeRootBridgeHandleKindRoot && slot.rootId !== rootId) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge request record has root id ${rootId}, expected ${slot.rootId}.`,
      nativeRootBridgeValidationErrorCodes.rootIdMismatch,
      {
        actual: rootId,
        expected: slot.rootId,
        index,
        requestId
      }
    );
  }

  return freezeNativeRootBridgeHandleAdmissionRecord({
    action,
    currentGeneration: slot.generation,
    handle,
    rootHandleState: expectedKind === nativeRootBridgeHandleKindRoot ? 'active' : null,
    rootId: slot.rootId,
    sourceErrorCode: null
  });
}

function retireNativeRootBridgeRootHandle({
  handle,
  index,
  requestId,
  rootId,
  table
}) {
  const activeAdmission = validateActiveNativeRootBridgeHandleTableRecord({
    action: 'retire-root-handle',
    expectedKind: nativeRootBridgeHandleKindRoot,
    field: 'rootHandle',
    handle,
    index,
    requestId,
    rootId,
    table
  });
  const nextGeneration = handle.generation + 1;
  if (!Number.isSafeInteger(nextGeneration)) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge root handle slot ${handle.slot} cannot allocate another generation.`,
      nativeRootBridgeRequestShapeErrorCode,
      { index, requestId, slot: handle.slot }
    );
  }

  table.slots.set(handle.slot, {
    kind: nativeRootBridgeHandleKindRoot,
    nextGeneration,
    previousGeneration: handle.generation,
    rootId,
    state: 'vacant'
  });
  table.rootRetired = true;

  return Object.freeze({
    ...activeAdmission,
    currentGeneration: nextGeneration,
    rootHandleState: nativeRootBridgeRootHandleStateRetired
  });
}

function validateRetiredNativeRootBridgeRootHandle({
  handle,
  index,
  requestId,
  table
}) {
  const slot = getNativeRootBridgeHandleTableSlot(table, handle);
  if (slot === null) {
    throwNativeRootBridgeInvalidHandleError(handle, 'rootHandle', index, requestId);
  }

  if (slot.state !== 'vacant') {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge unmount record did not retire root handle slot ${handle.slot}.`,
      nativeRootBridgeValidationErrorCodes.rootHandleStillActive,
      { index, requestId, slot: handle.slot }
    );
  }

  if (slot.nextGeneration === handle.generation) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge retired root handle slot ${handle.slot} still matches the active generation.`,
      nativeRootBridgeValidationErrorCodes.rootHandleStillActive,
      { index, requestId, slot: handle.slot }
    );
  }

  return freezeNativeRootBridgeHandleAdmissionRecord({
    action: 'validate-retired-root-handle',
    currentGeneration: slot.nextGeneration,
    handle,
    rootHandleState: nativeRootBridgeRootHandleStateRetired,
    rootId: slot.rootId,
    sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle
  });
}

function validateNativeRootBridgeHandleEnvironment(
  table,
  handle,
  field,
  index,
  requestId
) {
  if (handle.environmentId === table.environmentId) {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    `Native root bridge ${field} belongs to environment ${handle.environmentId}, expected ${table.environmentId}.`,
    nativeRootBridgeValidationErrorCodes.wrongEnvironment,
    {
      environmentId: handle.environmentId,
      expectedEnvironmentId: table.environmentId,
      field,
      index,
      requestId
    }
  );
}

function getNativeRootBridgeHandleTableSlot(table, handle) {
  return table.slots.get(handle.slot) ?? null;
}

function validateNativeRootBridgeHandleTableSlot({
  expectedKind,
  field,
  handle,
  index,
  requestId,
  slot
}) {
  if (slot.state === 'vacant') {
    throwNativeRootBridgeStaleHandleError(
      handle,
      slot.nextGeneration,
      field,
      index,
      requestId
    );
  }

  if (handle.generation !== slot.generation) {
    throwNativeRootBridgeStaleHandleError(
      handle,
      slot.generation,
      field,
      index,
      requestId
    );
  }

  if (slot.kind !== expectedKind) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge ${field} has kind ${slot.kind}, expected ${expectedKind}.`,
      nativeRootBridgeValidationErrorCodes.wrongHandleKind,
      {
        actual: slot.kind,
        expected: expectedKind,
        field,
        index,
        requestId
      }
    );
  }
}

function throwNativeRootBridgeInvalidHandleError(handle, field, index, requestId) {
  throwNativeRootBridgeRequestShapeError(
    `Native root bridge ${field} slot ${handle.slot} is invalid.`,
    nativeRootBridgeValidationErrorCodes.invalidHandle,
    { field, handle, index, requestId }
  );
}

function throwNativeRootBridgeStaleHandleError(
  handle,
  currentGeneration,
  field,
  index,
  requestId
) {
  throwNativeRootBridgeRequestShapeError(
    `Native root bridge ${field} slot ${handle.slot} generation ${handle.generation} is stale; current generation is ${currentGeneration}.`,
    nativeRootBridgeValidationErrorCodes.staleHandle,
    {
      currentGeneration,
      field,
      handle,
      index,
      requestId
    }
  );
}

function freezeNativeRootBridgeHandleAdmissionRecord({
  action,
  currentGeneration,
  handle,
  rootHandleState,
  rootId,
  sourceErrorCode
}) {
  return Object.freeze({
    action,
    currentGeneration,
    handle,
    rustHandle: toRustNativeRootBridgeHandle(handle),
    rootHandleState,
    rootId,
    sourceErrorCode
  });
}

function assertPlainObject(value, message) {
  if (value && typeof value === 'object') {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    message,
    nativeRootBridgeRequestShapeErrorCode
  );
}

function assertPositiveSafeInteger(value, field) {
  if (Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  throwNativeRootBridgeRequestShapeError(
    `Expected ${field} to be a positive safe integer.`,
    nativeRootBridgeRequestShapeErrorCode,
    { field, value }
  );
}

function throwNativeRootBridgeRequestShapeError(message, code, details = {}) {
  const error = new Error(message);
  error.name = 'FastReactNativeRequestShapeError';
  error.code = code;
  error.details = Object.freeze({ ...details });
  error.nativeAddonLoaded = false;
  error.nativeExecution = false;
  error.rendererExecution = false;
  error.reconcilerExecution = false;
  throw error;
}

function detectLinuxLibc() {
  try {
    const report = process.report?.getReport?.();
    return report?.header?.glibcVersionRuntime ? 'gnu' : 'musl';
  } catch {
    return 'musl';
  }
}

function normalizeLinuxLibc(libc) {
  return libc === 'musl' ? 'musl' : 'gnu';
}

function resolveNativeTarget(platform, arch, libc) {
  if (platform === 'darwin' && (arch === 'arm64' || arch === 'x64')) {
    return `darwin-${arch}`;
  }

  if (platform === 'linux' && (arch === 'arm64' || arch === 'x64')) {
    return `linux-${arch}-${normalizeLinuxLibc(libc)}`;
  }

  if (platform === 'win32' && (arch === 'arm64' || arch === 'x64')) {
    return `win32-${arch}-msvc`;
  }

  return null;
}

function getNativeTargetMetadata(nativeTarget) {
  return nativeTarget && hasOwn(nativeTargetsByName, nativeTarget)
    ? nativeTargetsByName[nativeTarget]
    : null;
}

function getNativeBindingLoadPlan(options = {}) {
  const loadOptions = options ?? {};
  const platform = loadOptions.platform ?? process.platform;
  const arch = loadOptions.arch ?? process.arch;
  const libc =
    loadOptions.libc ?? (platform === 'linux' ? detectLinuxLibc() : null);
  const nativeTarget = resolveNativeTarget(platform, arch, libc);
  const nativeTargetMetadata = getNativeTargetMetadata(nativeTarget);
  const platformPackageName =
    nativeTargetMetadata?.optionalPackageName ?? null;
  const nativeFileName = nativeTargetMetadata?.nativeFileName ?? null;
  const candidateSpecifiers = platformPackageName
    ? Object.freeze([
        platformPackageName,
        `${platformPackageName}/${nativeFileName}`
      ])
    : Object.freeze([]);

  return Object.freeze({
    status: bindingStatus,
    packageName,
    nativeAddonName,
    nativeTarget,
    platform,
    arch,
    libc,
    nativeTargetMetadata,
    platformPackageName,
    nativeFileName,
    candidateSpecifiers,
    supportedNativeTargets,
    nodeApiVersionFloor,
    supportedNodeEngineRange,
    platformArtifactPolicy,
    nativeExecution: false,
    unsupportedNativeExecutionCode:
      nativeBoundaryErrorCodeMap.unsupportedNativeExecution,
    reason: 'Fast React native artifacts are intentionally not built or loaded yet.'
  });
}

function formatUnavailableMessage(loadPlan) {
  if (!loadPlan.nativeTarget || !loadPlan.platformPackageName) {
    return [
      '[fast-react] Native binding is not implemented for this platform yet.',
      `package=${packageName}`,
      `platform=${loadPlan.platform}`,
      `arch=${loadPlan.arch}`,
      `supportedTargets=${supportedNativeTargets.join(',')}`
    ].join(' ');
  }

  return [
    '[fast-react] Native binding is not implemented yet.',
    `package=${packageName}`,
    `target=${loadPlan.nativeTarget}`,
    `optionalPackage=${loadPlan.platformPackageName}`,
    `artifact=${loadPlan.nativeFileName}`,
    `napi>=${nodeApiVersionFloor}`
  ].join(' ');
}

class FastReactNativeBindingUnavailableError extends Error {
  constructor(loadPlan = getNativeBindingLoadPlan()) {
    super(formatUnavailableMessage(loadPlan));
    this.name = 'FastReactNativeBindingUnavailableError';
    this.code = unavailableErrorCode;
    this.packageName = packageName;
    this.nativeTarget = loadPlan.nativeTarget;
    this.platformPackageName = loadPlan.platformPackageName;
    this.nativeFileName = loadPlan.nativeFileName;
    this.bindingStatus = bindingStatus;
    this.nodeApiVersionFloor = nodeApiVersionFloor;
    this.supportedNodeEngineRange = supportedNodeEngineRange;
    this.reason = loadPlan.reason;
    this.nativeExecution = loadPlan.nativeExecution;
    this.nativeBoundaryErrorCode = loadPlan.unsupportedNativeExecutionCode;
    this.loadPlan = loadPlan;
  }
}

function loadNativeBinding(options) {
  const loadPlan = getNativeBindingLoadPlan(options);
  throw new FastReactNativeBindingUnavailableError(loadPlan);
}

module.exports = {
  FastReactNativeBindingUnavailableError,
  bindingStatus,
  createNativeRootBridgeRequestShapeGate,
  getNativeBindingLoadPlan,
  loadNativeBinding,
  nativeAddonName,
  nativeBindingManifest,
  nativeRootBridgeRequestShape,
  nativeTargetMatrix,
  nodeApiVersionFloor,
  optionalPackagePrefix,
  packageName,
  platformArtifactPolicy,
  platformPackages,
  supportedNativeTargets,
  supportedNodeEngineRange,
  unavailableErrorCode
};
