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
const nativeRootBridgeRustHandleTableAdmissionSmokeStatus =
  'mirrored-native-root-bridge-rust-handle-table-admission-smoke';
const nativeRootBridgeJsonTransportSmokeStatus =
  'smoked-native-root-bridge-js-to-rust-json-transport';
const nativeRootBridgeJsonTransportParserGateStatus =
  'parsed-native-root-bridge-json-transport-schema';
const nativeRootBridgeCrossEnvironmentTeardownGateStatus =
  'diagnosed-native-root-bridge-cross-environment-teardown-isolation';
const nativeRootBridgeBatchedJsonTransportGateStatus =
  'validated-native-root-bridge-batched-json-transport-records';
const nativeRootBridgeJsonTransportFormat = 'json';
const nativeRootBridgeJsonTransportSchemaVersion = 1;
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
const nativeRootBridgeJsonTransportBatchLifecycleStateNone = 'none';
const nativeRootBridgeJsonTransportBatchLifecycleStateActive = 'active';
const nativeRootBridgeJsonTransportBatchLifecycleStateRetired = 'retired';
const nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted = 'accepted';
const nativeRootBridgeJsonTransportBatchLifecycleStatusError = 'error';
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
const nativeRootBridgeRustHandleTableAdmissionSmokeRecordFields = Object.freeze([
  'request_id',
  'kind',
  'lifecycle_transition',
  'root_handle_state_before',
  'root_handle_state_after',
  'root_handle_action',
  'root_handle_current_generation',
  'value_handle_action',
  'value_handle_current_generation',
  'retired_root_source_error_code'
]);
const nativeRootBridgeJsonTransportEnvelopeFields = Object.freeze([
  'transport',
  'schemaVersion',
  'requestRecords'
]);
const nativeRootBridgeJsonTransportBatchLifecycleStates = Object.freeze([
  nativeRootBridgeJsonTransportBatchLifecycleStateNone,
  nativeRootBridgeJsonTransportBatchLifecycleStateActive,
  nativeRootBridgeJsonTransportBatchLifecycleStateRetired
]);
const nativeRootBridgeJsonTransportBatchLifecycleStatuses = Object.freeze([
  nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted,
  nativeRootBridgeJsonTransportBatchLifecycleStatusError
]);
const nativeRootBridgeJsonTransportBatchLifecycleRowFields = Object.freeze([
  'id',
  'batchIndex',
  'requestId',
  'kind',
  'lifecycleBefore',
  'lifecycleAfter',
  'lifecycleTransition',
  'status',
  'code',
  'sourceErrorCode',
  'boundaryErrorCode',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'reactBehaviorError'
]);
const nativeRootBridgeEnvironmentTeardownFields = Object.freeze([
  'requestedEnvironmentId',
  'tableEnvironmentId',
  'environmentMatched',
  'rootHandlesInvalidated',
  'valueHandlesInvalidated',
  'totalHandlesInvalidated',
  'toreDownHandles'
]);
const nativeRootBridgeCrossEnvironmentTeardownRowFields = Object.freeze([
  'id',
  'operation',
  'handleKind',
  'tableEnvironmentId',
  'handleEnvironmentId',
  'slot',
  'handleGeneration',
  'currentGeneration',
  'recordId',
  'errorCode',
  'rejectedByHandleTable',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'reactBehaviorError'
]);
const nativeRootBridgeJsonTransportParseErrorCodes = Object.freeze({
  expectedObject:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_EXPECTED_OBJECT',
  invalidFieldType:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_FIELD_TYPE',
  invalidJson:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON',
  missingField:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_MISSING_FIELD',
  unexpectedField:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNEXPECTED_FIELD',
  unsupportedFieldValue:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE'
});
const nativeRootBridgeJsonTransportErrorDiagnosticRowFields = Object.freeze([
  'id',
  'category',
  'phase',
  'name',
  'code',
  'sourceErrorCode',
  'boundaryErrorCode',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'reactBehaviorError'
]);
const nativeRootBridgeJsonTransportErrorDiagnosticCaseIds = Object.freeze([
  'malformed-payload',
  'wrong-environment-root-handle',
  'stale-value-handle-generation',
  'render-before-create-lifecycle-order'
]);
const nativeRootBridgeJsonTransportBatchErrorCaseIds = Object.freeze([
  'batch-render-before-create-lifecycle-order',
  'batch-root-handle-state-mismatch',
  'batch-create-after-create-lifecycle-order',
  'batch-request-after-unmount-lifecycle-order',
  'batch-request-id-out-of-order'
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
const nativeRootBridgeRustHandleTableAdmissionSmoke = Object.freeze({
  smokeStatus: nativeRootBridgeRustHandleTableAdmissionSmokeStatus,
  handleTableModel: nativeRootBridgeHandleTableModel,
  validationModel: nativeRootBridgeRequestValidationModel,
  rustAdmissionSmokeRecordFields:
    nativeRootBridgeRustHandleTableAdmissionSmokeRecordFields,
  stateTransitions: nativeRootBridgeLifecycleTransitions,
  admissionActions: nativeRootBridgeHandleAdmissionActions,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false
});
const nativeRootBridgeBatchedJsonTransportGate = Object.freeze({
  batchGateStatus: nativeRootBridgeBatchedJsonTransportGateStatus,
  validationModel: nativeRootBridgeRequestValidationModel,
  lifecycleStates: nativeRootBridgeJsonTransportBatchLifecycleStates,
  lifecycleStatuses: nativeRootBridgeJsonTransportBatchLifecycleStatuses,
  jsonTransportBatchLifecycleRowFields:
    nativeRootBridgeJsonTransportBatchLifecycleRowFields,
  jsonTransportBatchErrorCaseIds:
    nativeRootBridgeJsonTransportBatchErrorCaseIds,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false
});
const nativeRootBridgeJsonTransportParserGate = Object.freeze({
  parserGateStatus: nativeRootBridgeJsonTransportParserGateStatus,
  transport: nativeRootBridgeJsonTransportFormat,
  schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
  jsonTransportEnvelopeFields: nativeRootBridgeJsonTransportEnvelopeFields,
  jsonTransportRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
  jsonTransportHandleFields: nativeRootBridgeRustHandleFields,
  parseErrorCodes: nativeRootBridgeJsonTransportParseErrorCodes,
  jsonTransportErrorDiagnosticRowFields:
    nativeRootBridgeJsonTransportErrorDiagnosticRowFields,
  jsonTransportErrorDiagnosticCaseIds:
    nativeRootBridgeJsonTransportErrorDiagnosticCaseIds,
  batchedRecordGate: nativeRootBridgeBatchedJsonTransportGate,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false
});
const nativeRootBridgeJsonTransportSmoke = Object.freeze({
  smokeStatus: nativeRootBridgeJsonTransportSmokeStatus,
  transport: nativeRootBridgeJsonTransportFormat,
  schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
  handleTableModel: nativeRootBridgeHandleTableModel,
  validationModel: nativeRootBridgeRequestValidationModel,
  jsonTransportEnvelopeFields: nativeRootBridgeJsonTransportEnvelopeFields,
  jsonTransportRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
  jsonTransportHandleFields: nativeRootBridgeRustHandleFields,
  parserGate: nativeRootBridgeJsonTransportParserGate,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false
});
const nativeRootBridgeCrossEnvironmentTeardownGate = Object.freeze({
  teardownGateStatus: nativeRootBridgeCrossEnvironmentTeardownGateStatus,
  handleTableModel: nativeRootBridgeHandleTableModel,
  environmentTeardownFields: nativeRootBridgeEnvironmentTeardownFields,
  teardownDiagnosticRowFields:
    nativeRootBridgeCrossEnvironmentTeardownRowFields,
  mismatchedTeardown: freezeNativeRootBridgeEnvironmentTeardown({
    requestedEnvironmentId: 1496,
    tableEnvironmentId: 496,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0
  }),
  matchedTeardown: freezeNativeRootBridgeEnvironmentTeardown({
    requestedEnvironmentId: 496,
    tableEnvironmentId: 496,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 1
  }),
  rows: Object.freeze([
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-root-active-after-mismatched-teardown',
      operation: 'mismatched-teardown',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 49601,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-value-active-after-mismatched-teardown',
      operation: 'mismatched-teardown',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 49602,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-root-stale-after-own-teardown',
      operation: 'matched-teardown',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-value-stale-after-own-teardown',
      operation: 'matched-teardown',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-root-wrong-environment-in-peer-table',
      operation: 'wrong-environment-validation',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 1496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: null,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.wrongEnvironment
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-value-wrong-environment-in-peer-table',
      operation: 'wrong-environment-validation',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 1496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: null,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.wrongEnvironment
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'peer-root-active-after-first-teardown',
      operation: 'post-teardown-peer-validation',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 1496,
      handleEnvironmentId: 1496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 149601,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'peer-value-active-after-first-teardown',
      operation: 'post-teardown-peer-validation',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 1496,
      handleEnvironmentId: 1496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 149602,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-root-stale-after-slot-reuse',
      operation: 'post-reuse-stale-validation',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-value-stale-after-slot-reuse',
      operation: 'post-reuse-stale-validation',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'replacement-root-active-after-slot-reuse',
      operation: 'post-reuse-active-validation',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 2,
      currentGeneration: 2,
      recordId: 49603,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'replacement-value-active-after-slot-reuse',
      operation: 'post-reuse-active-validation',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 2,
      currentGeneration: 2,
      recordId: 49604,
      errorCode: null
    })
  ]),
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  reactBehaviorError: false
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

function freezeNativeRootBridgeEnvironmentTeardown({
  requestedEnvironmentId,
  tableEnvironmentId,
  rootHandlesInvalidated,
  valueHandlesInvalidated
}) {
  const totalHandlesInvalidated =
    rootHandlesInvalidated + valueHandlesInvalidated;

  return Object.freeze({
    requestedEnvironmentId,
    tableEnvironmentId,
    environmentMatched: requestedEnvironmentId === tableEnvironmentId,
    rootHandlesInvalidated,
    valueHandlesInvalidated,
    totalHandlesInvalidated,
    toreDownHandles: totalHandlesInvalidated > 0
  });
}

function freezeNativeRootBridgeTeardownDiagnosticRow({
  id,
  operation,
  handleKind,
  tableEnvironmentId,
  handleEnvironmentId,
  slot,
  handleGeneration,
  currentGeneration,
  recordId,
  errorCode
}) {
  return Object.freeze({
    id,
    operation,
    handleKind,
    tableEnvironmentId,
    handleEnvironmentId,
    slot,
    handleGeneration,
    currentGeneration,
    recordId,
    errorCode,
    rejectedByHandleTable: errorCode !== null,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  });
}

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
  rustHandleTableAdmissionSmoke:
    nativeRootBridgeRustHandleTableAdmissionSmoke,
  jsonTransportSmoke: nativeRootBridgeJsonTransportSmoke,
  crossEnvironmentTeardownGate: nativeRootBridgeCrossEnvironmentTeardownGate,
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
  const rustHandleTableAdmissionSmoke =
    createNativeRootBridgeRustHandleTableAdmissionSmoke(
      handleAdmissionPreflight
    );
  const jsonTransportSmoke =
    createNativeRootBridgeJsonTransportSmoke(validationRecords);

  return Object.freeze({
    gateStatus: nativeRootBridgeRequestShapeGateStatus,
    validationModel: nativeRootBridgeRequestValidationModel,
    handleTableModel: nativeRootBridgeHandleTableModel,
    requestCount: validationRecords.length,
    validationRecords: Object.freeze(validationRecords),
    handleAdmissionPreflight,
    rustHandleTableAdmissionSmoke,
    jsonTransportSmoke,
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
  if (isSameNativeRootBridgeHandle(expected, actual)) {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    `Native root bridge request record uses root handle slot ${actual.slot}, expected slot ${expected.slot}.`,
    nativeRootBridgeValidationErrorCodes.handleMismatch,
    { actual, expected, index, requestId }
  );
}

function isSameNativeRootBridgeHandle(expected, actual) {
  return (
    expected.environmentId === actual.environmentId &&
    expected.slot === actual.slot &&
    expected.generation === actual.generation &&
    expected.kind === actual.kind
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

function createNativeRootBridgeRustHandleTableAdmissionSmoke(preflight) {
  const smokeRecords = preflight.admissionRecords.map((record) =>
    freezeNativeRootBridgeRustHandleTableAdmissionSmokeRecord(record)
  );

  return Object.freeze({
    smokeStatus: nativeRootBridgeRustHandleTableAdmissionSmokeStatus,
    handleTableModel: nativeRootBridgeHandleTableModel,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: smokeRecords.length,
    tableEnvironmentId: preflight.tableEnvironmentId,
    rootId: preflight.rootId,
    rootHandle: preflight.rootHandle,
    rootRetired: preflight.rootRetired,
    rustAdmissionSmokeRecordFields:
      nativeRootBridgeRustHandleTableAdmissionSmokeRecordFields,
    smokeRecords: Object.freeze(smokeRecords),
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function freezeNativeRootBridgeRustHandleTableAdmissionSmokeRecord(record) {
  const rootHandleStateBefore =
    record.kind === nativeRootBridgeRequestKindCreate
      ? null
      : nativeRootBridgeRootHandleStateActive;
  const rootHandleStateAfter =
    record.kind === nativeRootBridgeRequestKindUnmount
      ? nativeRootBridgeRootHandleStateRetired
      : nativeRootBridgeRootHandleStateActive;
  const valueHandleAction = record.valueHandleAdmission?.action ?? null;
  const valueHandleCurrentGeneration =
    record.valueHandleAdmission?.currentGeneration ?? null;
  const retiredRootSourceErrorCode =
    record.retiredRootHandleValidation?.sourceErrorCode ?? null;

  return Object.freeze({
    requestId: record.requestId,
    kind: record.kind,
    lifecycleTransition: record.lifecycleTransition,
    rootHandleStateBefore,
    rootHandleStateAfter,
    rootHandleAction: record.rootHandleAdmission.action,
    rootHandleCurrentGeneration:
      record.rootHandleAdmission.currentGeneration,
    valueHandleAction,
    valueHandleCurrentGeneration,
    retiredRootSourceErrorCode,
    rustAdmissionSmokeRecord: Object.freeze({
      request_id: record.requestId,
      kind: record.kind,
      lifecycle_transition: record.lifecycleTransition,
      root_handle_state_before: rootHandleStateBefore,
      root_handle_state_after: rootHandleStateAfter,
      root_handle_action: record.rootHandleAdmission.action,
      root_handle_current_generation:
        record.rootHandleAdmission.currentGeneration,
      value_handle_action: valueHandleAction,
      value_handle_current_generation: valueHandleCurrentGeneration,
      retired_root_source_error_code: retiredRootSourceErrorCode
    })
  });
}

function createNativeRootBridgeJsonTransportSmoke(validationRecords) {
  const requestRecords = Object.freeze(
    validationRecords.map((record) =>
      freezeNativeRootBridgeJsonTransportRequestRecord(record)
    )
  );
  const envelope = Object.freeze({
    transport: nativeRootBridgeJsonTransportFormat,
    schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
    requestRecords
  });
  const json = JSON.stringify(envelope);
  const parserGate = createNativeRootBridgeJsonTransportParserGate(json);
  const decodedRequestRecords = parserGate.decodedRequestRecords;
  const decodedValidationRecords =
    validateNativeRootBridgeJsonTransportRecords(decodedRequestRecords);
  const handleAdmissionPreflight =
    createNativeRootBridgeHandleAdmissionPreflight(decodedValidationRecords);
  const rustHandleTableAdmissionSmoke =
    createNativeRootBridgeRustHandleTableAdmissionSmoke(
      handleAdmissionPreflight
    );

  return Object.freeze({
    smokeStatus: nativeRootBridgeJsonTransportSmokeStatus,
    transport: nativeRootBridgeJsonTransportFormat,
    schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
    handleTableModel: nativeRootBridgeHandleTableModel,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: decodedRequestRecords.length,
    json,
    byteLength: json.length,
    jsonTransportEnvelopeFields: nativeRootBridgeJsonTransportEnvelopeFields,
    jsonTransportRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
    jsonTransportHandleFields: nativeRootBridgeRustHandleFields,
    decodedRequestRecords: Object.freeze(decodedRequestRecords),
    parserGate,
    rustHandleTableAdmissionSmoke,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function freezeNativeRootBridgeJsonTransportRequestRecord(record) {
  const rustRecord = record.rustValidationRecord;

  return Object.freeze({
    request_id: rustRecord.request_id,
    kind: rustRecord.kind,
    environment_id: rustRecord.environment_id,
    root_handle: freezeNativeRootBridgeJsonTransportHandle(
      rustRecord.root_handle
    ),
    root_id: rustRecord.root_id,
    value_handle:
      rustRecord.value_handle === null
        ? null
        : freezeNativeRootBridgeJsonTransportHandle(rustRecord.value_handle),
    root_handle_state: rustRecord.root_handle_state
  });
}

function freezeNativeRootBridgeJsonTransportHandle(handle) {
  return Object.freeze({
    environment_id: handle.environment_id,
    slot: handle.slot,
    generation: handle.generation,
    kind: handle.kind
  });
}

function createNativeRootBridgeJsonTransportParserGate(json) {
  const decodedRequestRecords =
    parseNativeRootBridgeJsonTransportRequestRecords(json);
  const batchedRecordGate =
    createNativeRootBridgeBatchedJsonTransportGate(decodedRequestRecords);

  return Object.freeze({
    parserGateStatus: nativeRootBridgeJsonTransportParserGateStatus,
    transport: nativeRootBridgeJsonTransportFormat,
    schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
    requestCount: decodedRequestRecords.length,
    byteLength: json.length,
    jsonTransportEnvelopeFields: nativeRootBridgeJsonTransportEnvelopeFields,
    jsonTransportRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
    jsonTransportHandleFields: nativeRootBridgeRustHandleFields,
    parseErrorCodes: nativeRootBridgeJsonTransportParseErrorCodes,
    jsonTransportErrorDiagnosticRowFields:
      nativeRootBridgeJsonTransportErrorDiagnosticRowFields,
    jsonTransportErrorDiagnosticCaseIds:
      nativeRootBridgeJsonTransportErrorDiagnosticCaseIds,
    decodedRequestRecords,
    deterministicParseErrors:
      createNativeRootBridgeJsonTransportParseErrorEvidence(),
    deterministicErrorRows:
      createNativeRootBridgeJsonTransportErrorDiagnosticRows(),
    batchedRecordGate,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function createNativeRootBridgeJsonTransportParseErrorEvidence() {
  const cases = [
    {
      id: 'invalid-json',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.invalidJson,
      json: '{'
    },
    {
      id: 'non-object-envelope',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.expectedObject,
      json: '[]'
    },
    {
      id: 'missing-request-records',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.missingField,
      json: '{"transport":"json","schemaVersion":1}'
    },
    {
      id: 'unexpected-envelope-field',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.unexpectedField,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[],"extra":true}'
    },
    {
      id: 'request-records-not-array',
      expectedCode:
        nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      json: '{"transport":"json","schemaVersion":1,"requestRecords":{}}'
    },
    {
      id: 'unsupported-transport',
      expectedCode:
        nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
      json: '{"transport":"binary","schemaVersion":1,"requestRecords":[]}'
    },
    {
      id: 'unknown-request-kind',
      expectedCode:
        nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"hydrate","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    }
  ];

  return Object.freeze(
    cases.map(({ expectedCode, id, json }) => {
      try {
        parseNativeRootBridgeJsonTransportRequestRecords(json);
      } catch (error) {
        assertNativeRootBridgeJsonTransportParserEvidenceError(
          error,
          expectedCode,
          id
        );
        return Object.freeze({
          id,
          code: error.code,
          name: error.name,
          details: error.details,
          nativeAddonLoaded: error.nativeAddonLoaded,
          nativeExecution: error.nativeExecution,
          rendererExecution: error.rendererExecution,
          reconcilerExecution: error.reconcilerExecution
        });
      }

      throw new Error(
        `Expected native root bridge JSON transport parser case ${id} to fail.`
      );
    })
  );
}

function createNativeRootBridgeJsonTransportErrorDiagnosticRows() {
  const cases = [
    {
      id: 'malformed-payload',
      category: 'malformed-payload',
      phase: 'parse',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.invalidJson,
      sourceErrorCode: null,
      boundaryErrorCode: null,
      json: '{'
    },
    {
      id: 'wrong-environment-root-handle',
      category: 'wrong-environment',
      phase: 'validation',
      expectedCode: nativeRootBridgeValidationErrorCodes.wrongEnvironment,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.wrongEnvironment,
      boundaryErrorCode:
        nativeBoundaryErrorCodeMap.rootBridgeWrongEnvironment,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":467,"root_handle":{"environment_id":468,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    },
    {
      id: 'stale-value-handle-generation',
      category: 'stale-handle',
      phase: 'validation',
      expectedCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":467,"root_handle":{"environment_id":467,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":467,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":467,"root_handle":{"environment_id":467,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":467,"slot":2,"generation":2,"kind":"value"},"root_handle_state":"active"}]}'
    },
    {
      id: 'render-before-create-lifecycle-order',
      category: 'lifecycle-order',
      phase: 'validation',
      expectedCode:
        nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate,
      sourceErrorCode:
        nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate,
      boundaryErrorCode:
        nativeBoundaryErrorCodeMap.rootBridgeWrongLifecycleOrder,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"render","environment_id":467,"root_handle":{"environment_id":467,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    }
  ];

  return Object.freeze(
    cases.map((diagnosticCase) => {
      try {
        validateNativeRootBridgeJsonTransportDiagnosticPayload(
          diagnosticCase.json
        );
      } catch (error) {
        assertNativeRootBridgeJsonTransportDiagnosticRowError(
          error,
          diagnosticCase.expectedCode,
          diagnosticCase.id
        );
        return Object.freeze({
          id: diagnosticCase.id,
          category: diagnosticCase.category,
          phase: diagnosticCase.phase,
          name: error.name,
          code: error.code,
          sourceErrorCode: diagnosticCase.sourceErrorCode,
          boundaryErrorCode: diagnosticCase.boundaryErrorCode,
          nativeAddonLoaded: error.nativeAddonLoaded,
          nativeExecution: error.nativeExecution,
          rendererExecution: error.rendererExecution,
          reconcilerExecution: error.reconcilerExecution,
          reactBehaviorError: false
        });
      }

      throw new Error(
        `Expected native root bridge JSON transport diagnostic case ${diagnosticCase.id} to fail.`
      );
    })
  );
}

function createNativeRootBridgeBatchedJsonTransportGate(decodedRequestRecords) {
  const lifecycleRows =
    createNativeRootBridgeBatchedJsonTransportLifecycleRows(
      decodedRequestRecords
    );

  return Object.freeze({
    batchGateStatus: nativeRootBridgeBatchedJsonTransportGateStatus,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: decodedRequestRecords.length,
    lifecycleStates: nativeRootBridgeJsonTransportBatchLifecycleStates,
    lifecycleStatuses: nativeRootBridgeJsonTransportBatchLifecycleStatuses,
    jsonTransportBatchLifecycleRowFields:
      nativeRootBridgeJsonTransportBatchLifecycleRowFields,
    jsonTransportBatchErrorCaseIds:
      nativeRootBridgeJsonTransportBatchErrorCaseIds,
    lifecycleRows,
    errorRows: createNativeRootBridgeBatchedJsonTransportErrorRows(),
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function createNativeRootBridgeBatchedJsonTransportErrorRows() {
  const cases = [
    {
      id: 'batch-render-before-create-lifecycle-order',
      expectedCode:
        nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    },
    {
      id: 'batch-root-handle-state-mismatch',
      expectedCode:
        nativeRootBridgeValidationErrorCodes.rootHandleStateMismatch,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}'
    },
    {
      id: 'batch-create-after-create-lifecycle-order',
      expectedCode:
        nativeRootBridgeValidationErrorCodes.createAfterRootCreated,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"},{"request_id":2,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    },
    {
      id: 'batch-request-after-unmount-lifecycle-order',
      expectedCode: nativeRootBridgeValidationErrorCodes.requestAfterUnmount,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"},{"request_id":2,"kind":"unmount","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"},{"request_id":3,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    },
    {
      id: 'batch-request-id-out-of-order',
      expectedCode: nativeRootBridgeValidationErrorCodes.sequenceOutOfOrder,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":2,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"},{"request_id":1,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    }
  ];

  return Object.freeze(
    cases.map((diagnosticCase) => {
      const records = parseNativeRootBridgeJsonTransportRequestRecords(
        diagnosticCase.json
      );
      const row = createNativeRootBridgeBatchedJsonTransportLifecycleRows(
        records
      ).find(
        (lifecycleRow) =>
          lifecycleRow.status ===
          nativeRootBridgeJsonTransportBatchLifecycleStatusError
      );

      if (row?.code === diagnosticCase.expectedCode) {
        return Object.freeze({
          ...row,
          id: diagnosticCase.id
        });
      }

      throw new Error(
        `Expected native root bridge batched JSON transport diagnostic case ${diagnosticCase.id} to fail.`
      );
    })
  );
}

function createNativeRootBridgeBatchedJsonTransportLifecycleRows(records) {
  const state = {
    lastRequestId: null,
    lifecycle: nativeRootBridgeJsonTransportBatchLifecycleStateNone,
    rootHandle: null,
    rootId: null
  };
  const rows = [];

  for (const [batchIndex, record] of records.entries()) {
    rows.push(
      createNativeRootBridgeBatchedJsonTransportLifecycleRow(
        record,
        batchIndex,
        state
      )
    );

    if (
      rows[rows.length - 1].status ===
      nativeRootBridgeJsonTransportBatchLifecycleStatusError
    ) {
      break;
    }
  }

  return Object.freeze(rows);
}

function createNativeRootBridgeBatchedJsonTransportLifecycleRow(
  record,
  batchIndex,
  state
) {
  const lifecycleBefore = state.lifecycle;
  const errorCode = getNativeRootBridgeBatchedJsonTransportLifecycleErrorCode(
    record,
    state
  );

  if (errorCode !== null) {
    return freezeNativeRootBridgeBatchedJsonTransportLifecycleRow({
      id: `batch-record-${batchIndex}-error`,
      batchIndex,
      requestId: record.requestId,
      kind: record.kind,
      lifecycleBefore,
      lifecycleAfter: lifecycleBefore,
      lifecycleTransition: null,
      status: nativeRootBridgeJsonTransportBatchLifecycleStatusError,
      code: errorCode,
      sourceErrorCode: errorCode,
      boundaryErrorCode:
        getNativeRootBridgeBatchedJsonTransportBoundaryErrorCode(errorCode)
    });
  }

  const lifecycleTransition = getNativeRootBridgeLifecycleTransition(
    record.kind
  );
  const lifecycleAfter =
    record.kind === nativeRootBridgeRequestKindUnmount
      ? nativeRootBridgeJsonTransportBatchLifecycleStateRetired
      : nativeRootBridgeJsonTransportBatchLifecycleStateActive;

  state.lastRequestId = record.requestId;
  if (state.rootHandle === null) {
    state.rootHandle = record.rootHandle;
    state.rootId = record.rootId;
  }
  state.lifecycle = lifecycleAfter;

  return freezeNativeRootBridgeBatchedJsonTransportLifecycleRow({
    id: `batch-record-${batchIndex}-${record.kind}`,
    batchIndex,
    requestId: record.requestId,
    kind: record.kind,
    lifecycleBefore,
    lifecycleAfter,
    lifecycleTransition,
    status: nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted,
    code: null,
    sourceErrorCode: null,
    boundaryErrorCode: null
  });
}

function getNativeRootBridgeBatchedJsonTransportLifecycleErrorCode(
  record,
  state
) {
  if (
    state.lastRequestId !== null &&
    record.requestId <= state.lastRequestId
  ) {
    return nativeRootBridgeValidationErrorCodes.sequenceOutOfOrder;
  }

  if (state.lifecycle === nativeRootBridgeJsonTransportBatchLifecycleStateRetired) {
    return nativeRootBridgeValidationErrorCodes.requestAfterUnmount;
  }

  if (
    state.lifecycle === nativeRootBridgeJsonTransportBatchLifecycleStateNone &&
    record.kind !== nativeRootBridgeRequestKindCreate
  ) {
    return nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate;
  }

  if (
    state.lifecycle === nativeRootBridgeJsonTransportBatchLifecycleStateActive &&
    record.kind === nativeRootBridgeRequestKindCreate
  ) {
    return nativeRootBridgeValidationErrorCodes.createAfterRootCreated;
  }

  if (
    state.rootHandle !== null &&
    !isSameNativeRootBridgeHandle(state.rootHandle, record.rootHandle)
  ) {
    return nativeRootBridgeValidationErrorCodes.handleMismatch;
  }

  if (state.rootId !== null && record.rootId !== state.rootId) {
    return nativeRootBridgeValidationErrorCodes.rootIdMismatch;
  }

  const expectedRootHandleState =
    record.kind === nativeRootBridgeRequestKindUnmount
      ? nativeRootBridgeRootHandleStateRetired
      : nativeRootBridgeRootHandleStateActive;
  if (record.rootHandleState !== expectedRootHandleState) {
    return nativeRootBridgeValidationErrorCodes.rootHandleStateMismatch;
  }

  if (
    record.kind === nativeRootBridgeRequestKindUnmount &&
    record.valueHandle !== null
  ) {
    return nativeRootBridgeValidationErrorCodes.unexpectedValueHandle;
  }

  return null;
}

function getNativeRootBridgeBatchedJsonTransportBoundaryErrorCode(code) {
  if (
    code === nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate ||
    code === nativeRootBridgeValidationErrorCodes.createAfterRootCreated ||
    code === nativeRootBridgeValidationErrorCodes.requestAfterUnmount ||
    code === nativeRootBridgeValidationErrorCodes.sequenceOutOfOrder ||
    code === nativeRootBridgeValidationErrorCodes.rootHandleStateMismatch ||
    code === nativeRootBridgeValidationErrorCodes.rootHandleStillActive
  ) {
    return nativeBoundaryErrorCodeMap.rootBridgeWrongLifecycleOrder;
  }

  if (code === nativeRootBridgeValidationErrorCodes.wrongEnvironment) {
    return nativeBoundaryErrorCodeMap.rootBridgeWrongEnvironment;
  }

  if (code === nativeRootBridgeValidationErrorCodes.staleHandle) {
    return nativeBoundaryErrorCodeMap.rootBridgeStaleHandle;
  }

  return null;
}

function freezeNativeRootBridgeBatchedJsonTransportLifecycleRow({
  id,
  batchIndex,
  requestId,
  kind,
  lifecycleBefore,
  lifecycleAfter,
  lifecycleTransition,
  status,
  code,
  sourceErrorCode,
  boundaryErrorCode
}) {
  return Object.freeze({
    id,
    batchIndex,
    requestId,
    kind,
    lifecycleBefore,
    lifecycleAfter,
    lifecycleTransition,
    status,
    code,
    sourceErrorCode,
    boundaryErrorCode,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  });
}

function validateNativeRootBridgeJsonTransportDiagnosticPayload(json) {
  const decodedRecords = parseNativeRootBridgeJsonTransportRequestRecords(json);
  const validationRecords =
    validateNativeRootBridgeJsonTransportRecords(decodedRecords);
  createNativeRootBridgeHandleAdmissionPreflight(validationRecords);
}

function assertNativeRootBridgeJsonTransportDiagnosticRowError(
  error,
  expectedCode,
  id
) {
  if (
    (error?.name === 'FastReactNativeJsonTransportParserError' ||
      error?.name === 'FastReactNativeRequestShapeError') &&
    error.code === expectedCode &&
    error.nativeAddonLoaded === false &&
    error.nativeExecution === false &&
    error.rendererExecution === false &&
    error.reconcilerExecution === false
  ) {
    return;
  }

  throw new Error(
    `Unexpected native root bridge JSON transport diagnostic error for ${id}.`
  );
}

function assertNativeRootBridgeJsonTransportParserEvidenceError(
  error,
  expectedCode,
  id
) {
  if (
    error?.name === 'FastReactNativeJsonTransportParserError' &&
    error.code === expectedCode &&
    error.nativeExecution === false &&
    error.rendererExecution === false &&
    error.reconcilerExecution === false
  ) {
    return;
  }

  throw new Error(
    `Unexpected native root bridge JSON transport parser error for ${id}.`
  );
}

function parseNativeRootBridgeJsonTransportRequestRecords(json) {
  let envelope;
  try {
    envelope = JSON.parse(json);
  } catch (cause) {
    throwNativeRootBridgeJsonTransportParserError(
      'Native root bridge JSON transport payload is invalid JSON.',
      nativeRootBridgeJsonTransportParseErrorCodes.invalidJson,
      { parser: 'JSON.parse' }
    );
  }

  assertExactPlainObject(
    envelope,
    '$',
    nativeRootBridgeJsonTransportEnvelopeFields
  );
  const transport = readNativeRootBridgeJsonTransportField(
    envelope,
    '$',
    'transport'
  );
  if (typeof transport !== 'string') {
    throwNativeRootBridgeJsonTransportParserError(
      'Native root bridge JSON transport field $.transport must be a string.',
      nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      {
        actual: getJsonTransportValueKind(transport),
        expected: 'string',
        path: '$.transport'
      }
    );
  }
  if (transport !== nativeRootBridgeJsonTransportFormat) {
    throwNativeRootBridgeJsonTransportParserError(
      `Native root bridge JSON transport must use ${nativeRootBridgeJsonTransportFormat} transport.`,
      nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
      {
        actual: transport,
        expected: nativeRootBridgeJsonTransportFormat
      }
    );
  }
  const schemaVersion = readNativeRootBridgeJsonTransportField(
    envelope,
    '$',
    'schemaVersion'
  );
  if (!Number.isSafeInteger(schemaVersion)) {
    throwNativeRootBridgeJsonTransportParserError(
      'Native root bridge JSON transport field $.schemaVersion must be an integer.',
      nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      {
        actual: getJsonTransportValueKind(schemaVersion),
        expected: 'integer',
        path: '$.schemaVersion'
      }
    );
  }
  if (schemaVersion !== nativeRootBridgeJsonTransportSchemaVersion) {
    throwNativeRootBridgeJsonTransportParserError(
      `Native root bridge JSON transport schema version ${String(
        schemaVersion
      )} is unsupported.`,
      nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
      {
        actual: schemaVersion,
        expected: nativeRootBridgeJsonTransportSchemaVersion
      }
    );
  }
  const requestRecords = readNativeRootBridgeJsonTransportField(
    envelope,
    '$',
    'requestRecords'
  );
  if (!Array.isArray(requestRecords)) {
    throwNativeRootBridgeJsonTransportParserError(
      'Native root bridge JSON transport requestRecords must be an array.',
      nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      {
        actual: getJsonTransportValueKind(requestRecords),
        expected: 'array',
        path: '$.requestRecords'
      }
    );
  }

  return Object.freeze(
    requestRecords.map((record, index) =>
      normalizeNativeRootBridgeJsonTransportRequestRecord(record, index)
    )
  );
}

function normalizeNativeRootBridgeJsonTransportRequestRecord(record, index) {
  const path = `$.requestRecords[${index}]`;
  assertExactPlainObject(
    record,
    path,
    nativeRootBridgeRustRequestRecordFields
  );

  const environmentId = assertNativeRootBridgeJsonTransportPositiveSafeInteger(
    readNativeRootBridgeJsonTransportField(record, path, 'environment_id'),
    `${path}.environment_id`
  );
  const kind = assertNativeRootBridgeJsonTransportCode(
    readNativeRootBridgeJsonTransportField(record, path, 'kind'),
    `${path}.kind`,
    nativeRootBridgeRequestKinds
  );
  const rootHandle = normalizeNativeRootBridgeJsonTransportHandle(
    readNativeRootBridgeJsonTransportField(record, path, 'root_handle'),
    nativeRootBridgeHandleKindRoot,
    environmentId,
    `${path}.root_handle`
  );
  const valueHandleValue = readNativeRootBridgeJsonTransportField(
    record,
    path,
    'value_handle'
  );
  const valueHandle =
    valueHandleValue === null
      ? null
      : normalizeNativeRootBridgeJsonTransportHandle(
          valueHandleValue,
          nativeRootBridgeHandleKindValue,
          environmentId,
          `${path}.value_handle`
        );

  return Object.freeze({
    requestId: assertNativeRootBridgeJsonTransportPositiveSafeInteger(
      readNativeRootBridgeJsonTransportField(record, path, 'request_id'),
      `${path}.request_id`
    ),
    kind,
    environmentId,
    rootHandle,
    rootId: assertNativeRootBridgeJsonTransportPositiveSafeInteger(
      readNativeRootBridgeJsonTransportField(record, path, 'root_id'),
      `${path}.root_id`
    ),
    valueHandle,
    rootHandleState: assertNativeRootBridgeJsonTransportCode(
      readNativeRootBridgeJsonTransportField(
        record,
        path,
        'root_handle_state'
      ),
      `${path}.root_handle_state`,
      nativeRootBridgeRootHandleStates
    )
  });
}

function normalizeNativeRootBridgeJsonTransportHandle(
  handle,
  expectedKind,
  expectedEnvironmentId,
  field
) {
  assertExactPlainObject(
    handle,
    field,
    nativeRootBridgeRustHandleFields
  );

  const environmentId = assertNativeRootBridgeJsonTransportPositiveSafeInteger(
    readNativeRootBridgeJsonTransportField(handle, field, 'environment_id'),
    `${field}.environment_id`
  );
  if (environmentId !== expectedEnvironmentId) {
    throwNativeRootBridgeJsonTransportParserError(
      `Native root bridge ${field} belongs to environment ${environmentId}, expected ${expectedEnvironmentId}.`,
      nativeRootBridgeValidationErrorCodes.wrongEnvironment,
      { environmentId, expectedEnvironmentId, field }
    );
  }

  const actualKind = assertNativeRootBridgeJsonTransportCode(
    readNativeRootBridgeJsonTransportField(handle, field, 'kind'),
    `${field}.kind`,
    nativeRootBridgeHandleKinds
  );
  if (actualKind !== expectedKind) {
    throwNativeRootBridgeJsonTransportParserError(
      `Native root bridge ${field} has kind ${String(
        actualKind
      )}, expected ${expectedKind}.`,
      nativeRootBridgeValidationErrorCodes.wrongHandleKind,
      { actual: actualKind, expected: expectedKind, field }
    );
  }

  return Object.freeze({
    environmentId,
    slot: assertNativeRootBridgeJsonTransportPositiveSafeInteger(
      readNativeRootBridgeJsonTransportField(handle, field, 'slot'),
      `${field}.slot`
    ),
    generation: assertNativeRootBridgeJsonTransportPositiveSafeInteger(
      readNativeRootBridgeJsonTransportField(handle, field, 'generation'),
      `${field}.generation`
    ),
    kind: expectedKind
  });
}

function assertExactPlainObject(value, path, expectedFields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throwNativeRootBridgeJsonTransportParserError(
      `Expected native root bridge JSON transport object at ${path}.`,
      nativeRootBridgeJsonTransportParseErrorCodes.expectedObject,
      {
        actual: getJsonTransportValueKind(value),
        path
      }
    );
  }

  for (const field of expectedFields) {
    if (!hasOwn(value, field)) {
      throwNativeRootBridgeJsonTransportParserError(
        `Native root bridge JSON transport object at ${path} is missing required field ${field}.`,
        nativeRootBridgeJsonTransportParseErrorCodes.missingField,
        { field, path }
      );
    }
  }

  for (const field of Object.keys(value).sort()) {
    if (!expectedFields.includes(field)) {
      throwNativeRootBridgeJsonTransportParserError(
        `Native root bridge JSON transport object at ${path} has unexpected field ${field}.`,
        nativeRootBridgeJsonTransportParseErrorCodes.unexpectedField,
        { field, path }
      );
    }
  }
}

function readNativeRootBridgeJsonTransportField(object, path, field) {
  if (hasOwn(object, field)) {
    return object[field];
  }

  throwNativeRootBridgeJsonTransportParserError(
    `Native root bridge JSON transport object at ${path} is missing required field ${field}.`,
    nativeRootBridgeJsonTransportParseErrorCodes.missingField,
    { field, path }
  );
}

function assertNativeRootBridgeJsonTransportPositiveSafeInteger(value, path) {
  if (Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  throwNativeRootBridgeJsonTransportParserError(
    `Expected native root bridge JSON transport field ${path} to be a positive safe integer.`,
    nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
    {
      actual: getJsonTransportValueKind(value),
      expected: 'positive safe integer',
      path,
      value
    }
  );
}

function assertNativeRootBridgeJsonTransportCode(value, path, codes) {
  if (typeof value !== 'string') {
    throwNativeRootBridgeJsonTransportParserError(
      `Expected native root bridge JSON transport field ${path} to be a string.`,
      nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      {
        actual: getJsonTransportValueKind(value),
        expected: 'string',
        path
      }
    );
  }

  if (codes.includes(value)) {
    return value;
  }

  throwNativeRootBridgeJsonTransportParserError(
    `Native root bridge JSON transport field ${path} has unsupported value ${value}.`,
    nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
    {
      actual: value,
      expected: 'known code',
      path
    }
  );
}

function getJsonTransportValueKind(value) {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

function validateNativeRootBridgeJsonTransportRecords(records) {
  const sequenceState = {
    lastRequestId: null,
    rootHandle: null,
    rootId: null,
    rootRetired: false
  };

  return Object.freeze(
    records.map((record, index) =>
      validateNativeRootBridgeRequestShapeRecord(record, sequenceState, index)
    )
  );
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

function throwNativeRootBridgeJsonTransportParserError(
  message,
  code,
  details = {}
) {
  const error = new Error(message);
  error.name = 'FastReactNativeJsonTransportParserError';
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
