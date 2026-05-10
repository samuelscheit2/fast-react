'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const native = require('../index.cjs');
const packageJson = require('../package.json');
const rootBridge = require(path.resolve(
  __dirname,
  '../../../packages/react-dom/src/client/root-bridge.js'
));

const expectedNativeTargetMatrix = [
  {
    target: 'darwin-arm64',
    platform: 'darwin',
    arch: 'arm64',
    libc: null,
    toolchain: null,
    optionalPackageName: '@fast-react/native-darwin-arm64',
    nativeFileName: 'fast_react_napi.darwin-arm64.node'
  },
  {
    target: 'darwin-x64',
    platform: 'darwin',
    arch: 'x64',
    libc: null,
    toolchain: null,
    optionalPackageName: '@fast-react/native-darwin-x64',
    nativeFileName: 'fast_react_napi.darwin-x64.node'
  },
  {
    target: 'linux-arm64-gnu',
    platform: 'linux',
    arch: 'arm64',
    libc: 'gnu',
    toolchain: null,
    optionalPackageName: '@fast-react/native-linux-arm64-gnu',
    nativeFileName: 'fast_react_napi.linux-arm64-gnu.node'
  },
  {
    target: 'linux-arm64-musl',
    platform: 'linux',
    arch: 'arm64',
    libc: 'musl',
    toolchain: null,
    optionalPackageName: '@fast-react/native-linux-arm64-musl',
    nativeFileName: 'fast_react_napi.linux-arm64-musl.node'
  },
  {
    target: 'linux-x64-gnu',
    platform: 'linux',
    arch: 'x64',
    libc: 'gnu',
    toolchain: null,
    optionalPackageName: '@fast-react/native-linux-x64-gnu',
    nativeFileName: 'fast_react_napi.linux-x64-gnu.node'
  },
  {
    target: 'linux-x64-musl',
    platform: 'linux',
    arch: 'x64',
    libc: 'musl',
    toolchain: null,
    optionalPackageName: '@fast-react/native-linux-x64-musl',
    nativeFileName: 'fast_react_napi.linux-x64-musl.node'
  },
  {
    target: 'win32-arm64-msvc',
    platform: 'win32',
    arch: 'arm64',
    libc: null,
    toolchain: 'msvc',
    optionalPackageName: '@fast-react/native-win32-arm64-msvc',
    nativeFileName: 'fast_react_napi.win32-arm64-msvc.node'
  },
  {
    target: 'win32-x64-msvc',
    platform: 'win32',
    arch: 'x64',
    libc: null,
    toolchain: 'msvc',
    optionalPackageName: '@fast-react/native-win32-x64-msvc',
    nativeFileName: 'fast_react_napi.win32-x64-msvc.node'
  }
];

const expectedPlatformPackages = Object.fromEntries(
  expectedNativeTargetMatrix.map((target) => [
    target.target,
    target.optionalPackageName
  ])
);

const expectedPackageExports = {
  '.': {
    import: './index.mjs',
    require: './index.cjs',
    default: './index.mjs'
  },
  './package.json': './package.json'
};

const expectedNativeRootBridgeRequestShape = {
  gateStatus: 'admitted-native-root-bridge-js-request-shape',
  validationModel: 'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
  handleTableModel: 'fast-react-napi.BridgeHandleTable',
  jsRequestRecordFields: [
    'requestId',
    'kind',
    'environmentId',
    'rootHandle',
    'rootId',
    'valueHandle',
    'rootHandleState'
  ],
  rustRequestRecordFields: [
    'request_id',
    'kind',
    'environment_id',
    'root_handle',
    'root_id',
    'value_handle',
    'root_handle_state'
  ],
  rustValidationRecordFields: [
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
  ],
  jsHandleFields: ['environmentId', 'slot', 'generation', 'kind'],
  rustHandleFields: ['environment_id', 'slot', 'generation', 'kind'],
  requestKinds: ['create', 'render', 'unmount'],
  handleKinds: ['root', 'value'],
  rootHandleStates: ['active', 'retired'],
  lifecycleTransitions: ['none->active', 'active->active', 'active->retired'],
  handleAdmissionPreflight: {
    preflightStatus:
      'preflighted-native-root-bridge-real-handle-admission',
    handleTableModel: 'fast-react-napi.BridgeHandleTable',
    validationModel: 'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
    admissionActions: [
      'admit-root-handle',
      'admit-value-handle',
      'validate-active-root-handle',
      'validate-value-handle',
      'retire-root-handle',
      'validate-retired-root-handle'
    ]
  },
  rustHandleTableAdmissionSmoke: {
    smokeStatus: 'mirrored-native-root-bridge-rust-handle-table-admission-smoke',
    handleTableModel: 'fast-react-napi.BridgeHandleTable',
    validationModel: 'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
    rustAdmissionSmokeRecordFields: [
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
    ],
    stateTransitions: ['none->active', 'active->active', 'active->retired'],
    admissionActions: [
      'admit-root-handle',
      'admit-value-handle',
      'validate-active-root-handle',
      'validate-value-handle',
      'retire-root-handle',
      'validate-retired-root-handle'
    ],
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  },
  jsonTransportSmoke: {
    smokeStatus: 'smoked-native-root-bridge-js-to-rust-json-transport',
    transport: 'json',
    schemaVersion: 1,
    handleTableModel: 'fast-react-napi.BridgeHandleTable',
    validationModel: 'fast-react-napi.NativeRootBridgeRequestSequenceValidator',
    jsonTransportEnvelopeFields: [
      'transport',
      'schemaVersion',
      'requestRecords'
    ],
    jsonTransportRequestRecordFields: [
      'request_id',
      'kind',
      'environment_id',
      'root_handle',
      'root_id',
      'value_handle',
      'root_handle_state'
    ],
    jsonTransportHandleFields: [
      'environment_id',
      'slot',
      'generation',
      'kind'
    ],
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  },
  validationErrorCodes: {
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
    shapeInvalid: 'FAST_REACT_NATIVE_ROOT_BRIDGE_REQUEST_SHAPE_INVALID',
    staleHandle: 'FAST_REACT_NAPI_STALE_HANDLE',
    unexpectedValueHandle:
      'FAST_REACT_NAPI_ROOT_REQUEST_UNEXPECTED_VALUE_HANDLE',
    wrongEnvironment: 'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
    wrongHandleKind: 'FAST_REACT_NAPI_WRONG_HANDLE_KIND'
  }
};

assert.equal(native.packageName, '@fast-react/native');
assert.equal(native.bindingStatus, 'placeholder');
assert.equal(native.nativeAddonName, 'fast_react_napi');
assert.equal(native.nodeApiVersionFloor, 8);
assert.equal(native.supportedNodeEngineRange, '>=22.0.0');
assert.equal(native.platformArtifactPolicy, 'future per-platform optional npm packages; no native addon is built or loaded yet');
assert.equal(native.optionalPackagePrefix, '@fast-react/native-');
assert.equal(packageJson.name, native.packageName);
assert.equal(packageJson.type, 'module');
assert.equal(packageJson.main, './index.cjs');
assert.deepEqual(packageJson.exports, expectedPackageExports);
assert.equal(packageJson.engines.node, native.supportedNodeEngineRange);
assert.equal(packageJson.scripts.build, 'cargo build -p fast-react-napi');
assert.equal(
  packageJson.scripts.check,
  'node ./test/native-loader.test.cjs && node ./test/native-no-load-guard.test.cjs && node ./test/native-loader-esm.test.mjs'
);
for (const lifecycleScript of ['preinstall', 'install', 'postinstall', 'prepare']) {
  assert.equal(
    packageJson.scripts[lifecycleScript],
    undefined,
    `${lifecycleScript} must not create an install-time native build/download path`
  );
}
for (const dependencyField of [
  'dependencies',
  'optionalDependencies',
  'devDependencies',
  'bundleDependencies',
  'bundledDependencies'
]) {
  assert.equal(
    packageJson[dependencyField],
    undefined,
    `${dependencyField} must stay absent while the binding is a placeholder`
  );
}
assert.ok(Object.isFrozen(native.platformPackages));
assert.ok(Object.isFrozen(native.supportedNativeTargets));
assert.ok(Object.isFrozen(native.nativeTargetMatrix));
assert.ok(Object.isFrozen(native.nativeBindingManifest));
assert.ok(Object.isFrozen(native.nativeRootBridgeRequestShape));
assert.deepEqual(native.nativeTargetMatrix, expectedNativeTargetMatrix);
assert.deepEqual(
  native.nativeRootBridgeRequestShape,
  expectedNativeRootBridgeRequestShape
);
assert.deepEqual(
  native.supportedNativeTargets,
  expectedNativeTargetMatrix.map((target) => target.target)
);
assert.deepEqual(native.platformPackages, expectedPlatformPackages);
assert.equal(native.nativeBindingManifest.nativeTargetMatrix, native.nativeTargetMatrix);
assert.equal(
  native.nativeBindingManifest.nativeRootBridgeRequestShape,
  native.nativeRootBridgeRequestShape
);
assert.equal(native.nativeBindingManifest.platformPackages, native.platformPackages);
assert.equal(
  native.nativeBindingManifest.supportedNativeTargets,
  native.supportedNativeTargets
);
assert.equal(native.nativeBindingManifest.nodeApiVersionFloor, native.nodeApiVersionFloor);
assert.equal(
  native.nativeBindingManifest.supportedNodeEngineRange,
  native.supportedNodeEngineRange
);
for (const target of native.nativeTargetMatrix) {
  assert.ok(Object.isFrozen(target));
}
for (const shapeValue of [
  native.nativeRootBridgeRequestShape.jsRequestRecordFields,
  native.nativeRootBridgeRequestShape.rustRequestRecordFields,
  native.nativeRootBridgeRequestShape.rustValidationRecordFields,
  native.nativeRootBridgeRequestShape.jsHandleFields,
  native.nativeRootBridgeRequestShape.rustHandleFields,
  native.nativeRootBridgeRequestShape.requestKinds,
  native.nativeRootBridgeRequestShape.handleKinds,
  native.nativeRootBridgeRequestShape.rootHandleStates,
  native.nativeRootBridgeRequestShape.lifecycleTransitions,
  native.nativeRootBridgeRequestShape.handleAdmissionPreflight,
  native.nativeRootBridgeRequestShape.handleAdmissionPreflight.admissionActions,
  native.nativeRootBridgeRequestShape.rustHandleTableAdmissionSmoke,
  native.nativeRootBridgeRequestShape.rustHandleTableAdmissionSmoke
    .rustAdmissionSmokeRecordFields,
  native.nativeRootBridgeRequestShape.rustHandleTableAdmissionSmoke
    .stateTransitions,
  native.nativeRootBridgeRequestShape.rustHandleTableAdmissionSmoke
    .admissionActions,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke
    .jsonTransportEnvelopeFields,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke
    .jsonTransportRequestRecordFields,
  native.nativeRootBridgeRequestShape.jsonTransportSmoke
    .jsonTransportHandleFields,
  native.nativeRootBridgeRequestShape.validationErrorCodes
]) {
  assert.ok(Object.isFrozen(shapeValue));
}

const document = createDocument('native-request-shape');
const container = createElement('DIV', document);
const bridge = rootBridge.createPrivateRootBridgeShell({
  nativeEnvironmentId: 318,
  nativeHandoffIdPrefix: 'native-shape'
});
const create = bridge.createClientRoot(container);
const render = bridge.renderContainer(create.handle, {
  props: {
    children: 'shape gate'
  },
  type: 'span'
});
const unmount = bridge.unmountContainer(create.handle);
const secondUnmount = bridge.unmountContainer(create.handle);
const createHandoff = bridge.createNativeRequestHandoff(create);
const renderHandoff = bridge.createNativeRequestHandoff(render);
const unmountHandoff = bridge.createNativeRequestHandoff(unmount);
const secondUnmountHandoff = bridge.createNativeRequestHandoff(secondUnmount);
const nativeShapeGate = native.createNativeRootBridgeRequestShapeGate([
  createHandoff,
  renderHandoff.nativeRequestRecord,
  unmountHandoff
]);

assert.equal(Object.isFrozen(nativeShapeGate), true);
assert.equal(Object.isFrozen(nativeShapeGate.validationRecords), true);
assert.equal(
  nativeShapeGate.gateStatus,
  native.nativeRootBridgeRequestShape.gateStatus
);
assert.equal(
  nativeShapeGate.validationModel,
  native.nativeRootBridgeRequestShape.validationModel
);
assert.equal(
  nativeShapeGate.handleTableModel,
  native.nativeRootBridgeRequestShape.handleTableModel
);
assert.equal(nativeShapeGate.requestCount, 3);
assert.equal(nativeShapeGate.nativeAddonLoaded, false);
assert.equal(nativeShapeGate.nativeExecution, false);
assert.equal(nativeShapeGate.rendererExecution, false);
assert.equal(nativeShapeGate.reconcilerExecution, false);
assertNativeRootBridgeHandleAdmissionPreflight(
  nativeShapeGate.handleAdmissionPreflight,
  {
    environmentId: 318,
    rootId: 1,
    rootSlot: 1
  }
);
assertNativeRootBridgeRustHandleTableAdmissionSmoke(
  nativeShapeGate.rustHandleTableAdmissionSmoke,
  {
    environmentId: 318,
    rootId: 1,
    rootSlot: 1
  }
);
assertNativeRootBridgeJsonTransportSmoke(nativeShapeGate.jsonTransportSmoke, {
  environmentId: 318,
  rootId: 1,
  rootSlot: 1
});
assert.deepEqual(
  nativeShapeGate.validationRecords.map((record) => record.lifecycleTransition),
  ['none->active', 'active->active', 'active->retired']
);

assertNativeRootBridgeValidationRecord(nativeShapeGate.validationRecords[0], {
  environmentId: 318,
  kind: 'create',
  requestId: 1,
  rootHandleState: 'active',
  rootId: 1,
  rootSlot: 1,
  valueHandleValidated: true,
  valueSlot: 2
});
assertNativeRootBridgeValidationRecord(nativeShapeGate.validationRecords[1], {
  environmentId: 318,
  kind: 'render',
  requestId: 2,
  rootHandleState: 'active',
  rootId: 1,
  rootSlot: 1,
  valueHandleValidated: true,
  valueSlot: 3
});
assertNativeRootBridgeValidationRecord(nativeShapeGate.validationRecords[2], {
  environmentId: 318,
  kind: 'unmount',
  requestId: 3,
  rootHandleState: 'retired',
  rootId: 1,
  rootSlot: 1,
  valueHandleValidated: false,
  valueSlot: null
});
assert.deepEqual(nativeShapeGate.validationRecords[0].rootHandle, {
  environmentId: 318,
  generation: 1,
  kind: 'root',
  slot: 1
});
assert.deepEqual(
  nativeShapeGate.validationRecords[0].rustValidationRecord.root_handle,
  {
    environment_id: 318,
    generation: 1,
    kind: 'root',
    slot: 1
  }
);
assert.equal(
  createHandoff.nativeRequestRecord.rootHandle.$$typeof,
  rootBridge.privateRootNativeBridgeHandleType
);
assert.equal(
  nativeShapeGate.validationRecords[0].rootHandle.$$typeof,
  undefined
);
assertBridgeDidNotTouchContainer(container, document);

assert.throws(
  () => native.createNativeRootBridgeRequestShapeGate([renderHandoff]),
  { code: 'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE' }
);
assert.throws(
  () =>
    native.createNativeRootBridgeRequestShapeGate([
      createHandoff,
      unmountHandoff,
      renderHandoff
    ]),
  { code: 'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER' }
);
assert.throws(
  () =>
    native.createNativeRootBridgeRequestShapeGate([
      createHandoff,
      unmountHandoff,
      secondUnmountHandoff
    ]),
  { code: 'FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT' }
);
assert.throws(
  () =>
    native.createNativeRootBridgeRequestShapeGate([
      createHandoff,
      {
        ...renderHandoff.nativeRequestRecord,
        rootHandleState: 'retired'
      }
    ]),
  { code: 'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH' }
);
assert.throws(
  () =>
    native.createNativeRootBridgeRequestShapeGate([
      createHandoff,
      {
        ...renderHandoff.nativeRequestRecord,
        valueHandle: {
          ...createHandoff.nativeRequestRecord.valueHandle,
          generation: 2
        }
      }
    ]),
  { code: 'FAST_REACT_NAPI_STALE_HANDLE' }
);
assert.throws(
  () =>
    native.createNativeRootBridgeRequestShapeGate([
      {
        ...createHandoff.nativeRequestRecord,
        valueHandle: {
          ...createHandoff.nativeRequestRecord.valueHandle,
          slot: createHandoff.nativeRequestRecord.rootHandle.slot
        }
      }
    ]),
  { code: 'FAST_REACT_NAPI_WRONG_HANDLE_KIND' }
);

for (const expectedTarget of expectedNativeTargetMatrix) {
  const plan = native.getNativeBindingLoadPlan({
    platform: expectedTarget.platform,
    arch: expectedTarget.arch,
    libc: expectedTarget.libc
  });

  assert.equal(plan.nativeTarget, expectedTarget.target);
  assert.deepEqual(plan.nativeTargetMetadata, expectedTarget);
  assert.equal(plan.platformPackageName, expectedTarget.optionalPackageName);
  assert.equal(plan.nativeFileName, expectedTarget.nativeFileName);
  assert.equal(plan.nodeApiVersionFloor, native.nodeApiVersionFloor);
  assert.equal(plan.supportedNodeEngineRange, native.supportedNodeEngineRange);
  assert.equal(plan.platformArtifactPolicy, native.platformArtifactPolicy);
  assert.deepEqual(plan.candidateSpecifiers, [
    expectedTarget.optionalPackageName,
    `${expectedTarget.optionalPackageName}/${expectedTarget.nativeFileName}`
  ]);
}

const darwinPlan = native.getNativeBindingLoadPlan({
  platform: 'darwin',
  arch: 'arm64'
});

assert.equal(darwinPlan.nativeTarget, 'darwin-arm64');
assert.equal(
  darwinPlan.platformPackageName,
  '@fast-react/native-darwin-arm64'
);
assert.equal(darwinPlan.nativeFileName, 'fast_react_napi.darwin-arm64.node');
assert.deepEqual(darwinPlan.candidateSpecifiers, [
  '@fast-react/native-darwin-arm64',
  '@fast-react/native-darwin-arm64/fast_react_napi.darwin-arm64.node'
]);
assert.ok(Object.isFrozen(darwinPlan));
assert.ok(Object.isFrozen(darwinPlan.candidateSpecifiers));

const linuxGnuPlan = native.getNativeBindingLoadPlan({
  platform: 'linux',
  arch: 'arm64',
  libc: 'glibc'
});

assert.equal(linuxGnuPlan.nativeTarget, 'linux-arm64-gnu');
assert.equal(linuxGnuPlan.nativeTargetMetadata.libc, 'gnu');
assert.equal(
  linuxGnuPlan.platformPackageName,
  '@fast-react/native-linux-arm64-gnu'
);

const linuxMuslPlan = native.getNativeBindingLoadPlan({
  platform: 'linux',
  arch: 'x64',
  libc: 'musl'
});

assert.equal(linuxMuslPlan.nativeTarget, 'linux-x64-musl');
assert.equal(
  linuxMuslPlan.platformPackageName,
  '@fast-react/native-linux-x64-musl'
);

const unsupportedPlan = native.getNativeBindingLoadPlan({
  platform: 'freebsd',
  arch: 'x64'
});

assert.equal(unsupportedPlan.nativeTarget, null);
assert.equal(unsupportedPlan.platformPackageName, null);
assert.deepEqual(unsupportedPlan.candidateSpecifiers, []);

assert.throws(
  () => native.loadNativeBinding({ platform: 'freebsd', arch: 'x64' }),
  (error) => {
    assert.equal(error.name, 'FastReactNativeBindingUnavailableError');
    assert.equal(error.code, native.unavailableErrorCode);
    assert.equal(error.nativeTarget, null);
    assert.match(error.message, /not implemented/);
    assert.match(error.message, /supportedTargets=/);
    return true;
  }
);

const originalLoad = Module._load;
const attemptedPlatformLoads = [];

Module._load = function patchedModuleLoad(request, parent, isMain) {
  if (String(request).startsWith('@fast-react/native-')) {
    attemptedPlatformLoads.push(request);
  }

  return originalLoad.call(this, request, parent, isMain);
};

try {
  assert.throws(
    () => native.loadNativeBinding({ platform: 'darwin', arch: 'arm64' }),
    (error) => {
      assert.equal(error.name, 'FastReactNativeBindingUnavailableError');
      assert.equal(error.code, native.unavailableErrorCode);
      assert.equal(error.packageName, '@fast-react/native');
      assert.equal(error.nativeTarget, 'darwin-arm64');
      assert.equal(
        error.platformPackageName,
        '@fast-react/native-darwin-arm64'
      );
      assert.equal(
        error.nativeFileName,
        'fast_react_napi.darwin-arm64.node'
      );
      assert.equal(error.bindingStatus, 'placeholder');
      assert.equal(error.nodeApiVersionFloor, 8);
      assert.equal(error.supportedNodeEngineRange, '>=22.0.0');
      assert.match(error.reason, /not built or loaded/);
      assert.deepEqual(error.loadPlan, darwinPlan);
      assert.match(error.message, /@fast-react\/native-darwin-arm64/);
      assert.match(error.message, /fast_react_napi\.darwin-arm64\.node/);
      return true;
    }
  );
} finally {
  Module._load = originalLoad;
}

assert.deepEqual(
  attemptedPlatformLoads,
  [],
  'placeholder loader must not attempt platform package loading yet'
);

function assertNativeRootBridgeValidationRecord(record, expected) {
  assert.equal(Object.isFrozen(record), true);
  assert.equal(Object.isFrozen(record.rootHandle), true);
  assert.equal(Object.isFrozen(record.rustValidationRecord), true);
  assert.equal(record.requestId, expected.requestId);
  assert.equal(record.kind, expected.kind);
  assert.equal(record.environmentId, expected.environmentId);
  assert.equal(record.rootId, expected.rootId);
  assert.equal(record.rootHandleState, expected.rootHandleState);
  assert.equal(record.rootHandleValidated, true);
  assert.equal(record.valueHandleValidated, expected.valueHandleValidated);
  assert.deepEqual(record.rootHandle, {
    environmentId: expected.environmentId,
    generation: 1,
    kind: 'root',
    slot: expected.rootSlot
  });
  assert.deepEqual(record.rustValidationRecord.root_handle, {
    environment_id: expected.environmentId,
    generation: 1,
    kind: 'root',
    slot: expected.rootSlot
  });
  assert.deepEqual(
    Object.keys(record.rustValidationRecord),
    [
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
    ]
  );
  if (expected.valueSlot === null) {
    assert.equal(record.valueHandle, null);
    assert.equal(record.rustValidationRecord.value_handle, null);
  } else {
    assert.equal(Object.isFrozen(record.valueHandle), true);
    assert.deepEqual(record.valueHandle, {
      environmentId: expected.environmentId,
      generation: 1,
      kind: 'value',
      slot: expected.valueSlot
    });
    assert.deepEqual(record.rustValidationRecord.value_handle, {
      environment_id: expected.environmentId,
      generation: 1,
      kind: 'value',
      slot: expected.valueSlot
    });
  }
}

function assertNativeRootBridgeHandleAdmissionPreflight(preflight, expected) {
  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(Object.isFrozen(preflight.admissionRecords), true);
  assert.equal(
    preflight.preflightStatus,
    'preflighted-native-root-bridge-real-handle-admission'
  );
  assert.equal(preflight.handleTableModel, 'fast-react-napi.BridgeHandleTable');
  assert.equal(
    preflight.validationModel,
    'fast-react-napi.NativeRootBridgeRequestSequenceValidator'
  );
  assert.equal(preflight.requestCount, 3);
  assert.equal(preflight.tableEnvironmentId, expected.environmentId);
  assert.equal(preflight.rootId, expected.rootId);
  assert.equal(preflight.rootRetired, true);
  assert.deepEqual(preflight.rootHandle, {
    environmentId: expected.environmentId,
    generation: 1,
    kind: 'root',
    slot: expected.rootSlot
  });
  assert.deepEqual(
    preflight.admissionRecords.map((record) => record.rootHandleAdmission.action),
    [
      'admit-root-handle',
      'validate-active-root-handle',
      'retire-root-handle'
    ]
  );
  assert.deepEqual(
    preflight.admissionRecords.map(
      (record) => record.valueHandleAdmission?.action ?? null
    ),
    ['admit-value-handle', 'admit-value-handle', null]
  );
  assert.equal(
    preflight.admissionRecords[0].rustValidationRecord,
    nativeShapeGate.validationRecords[0].rustValidationRecord
  );

  const retiredValidation =
    preflight.admissionRecords[2].retiredRootHandleValidation;
  assert.equal(Object.isFrozen(retiredValidation), true);
  assert.deepEqual(retiredValidation, {
    action: 'validate-retired-root-handle',
    currentGeneration: 2,
    handle: {
      environmentId: expected.environmentId,
      generation: 1,
      kind: 'root',
      slot: expected.rootSlot
    },
    rustHandle: {
      environment_id: expected.environmentId,
      generation: 1,
      kind: 'root',
      slot: expected.rootSlot
    },
    rootHandleState: 'retired',
    rootId: expected.rootId,
    sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE'
  });
}

function assertNativeRootBridgeRustHandleTableAdmissionSmoke(smoke, expected) {
  assert.equal(Object.isFrozen(smoke), true);
  assert.equal(Object.isFrozen(smoke.smokeRecords), true);
  assert.equal(
    smoke.smokeStatus,
    'mirrored-native-root-bridge-rust-handle-table-admission-smoke'
  );
  assert.equal(smoke.handleTableModel, 'fast-react-napi.BridgeHandleTable');
  assert.equal(
    smoke.validationModel,
    'fast-react-napi.NativeRootBridgeRequestSequenceValidator'
  );
  assert.equal(smoke.requestCount, 3);
  assert.equal(smoke.tableEnvironmentId, expected.environmentId);
  assert.equal(smoke.rootId, expected.rootId);
  assert.equal(smoke.rootRetired, true);
  assert.deepEqual(smoke.rootHandle, {
    environmentId: expected.environmentId,
    generation: 1,
    kind: 'root',
    slot: expected.rootSlot
  });
  assert.equal(
    smoke.rustAdmissionSmokeRecordFields,
    native.nativeRootBridgeRequestShape.rustHandleTableAdmissionSmoke
      .rustAdmissionSmokeRecordFields
  );
  assert.deepEqual(
    smoke.smokeRecords.map((record) => record.lifecycleTransition),
    ['none->active', 'active->active', 'active->retired']
  );
  assert.deepEqual(
    smoke.smokeRecords.map((record) => record.rootHandleStateBefore),
    [null, 'active', 'active']
  );
  assert.deepEqual(
    smoke.smokeRecords.map((record) => record.rootHandleStateAfter),
    ['active', 'active', 'retired']
  );
  assert.deepEqual(
    smoke.smokeRecords.map((record) => record.rootHandleAction),
    [
      'admit-root-handle',
      'validate-active-root-handle',
      'retire-root-handle'
    ]
  );
  assert.deepEqual(
    smoke.smokeRecords.map((record) => record.rootHandleCurrentGeneration),
    [1, 1, 2]
  );
  assert.deepEqual(
    smoke.smokeRecords.map((record) => record.valueHandleAction),
    ['admit-value-handle', 'admit-value-handle', null]
  );
  assert.deepEqual(
    smoke.smokeRecords.map((record) => record.valueHandleCurrentGeneration),
    [1, 1, null]
  );
  assert.equal(
    smoke.smokeRecords[2].retiredRootSourceErrorCode,
    'FAST_REACT_NAPI_STALE_HANDLE'
  );
  assert.deepEqual(smoke.smokeRecords[2].rustAdmissionSmokeRecord, {
    kind: 'unmount',
    lifecycle_transition: 'active->retired',
    request_id: 3,
    retired_root_source_error_code: 'FAST_REACT_NAPI_STALE_HANDLE',
    root_handle_action: 'retire-root-handle',
    root_handle_current_generation: 2,
    root_handle_state_after: 'retired',
    root_handle_state_before: 'active',
    value_handle_action: null,
    value_handle_current_generation: null
  });
  for (const record of smoke.smokeRecords) {
    assert.equal(Object.isFrozen(record), true);
    assert.equal(Object.isFrozen(record.rustAdmissionSmokeRecord), true);
    assert.deepEqual(
      Object.keys(record.rustAdmissionSmokeRecord),
      native.nativeRootBridgeRequestShape.rustHandleTableAdmissionSmoke
        .rustAdmissionSmokeRecordFields
    );
  }
}

function assertNativeRootBridgeJsonTransportSmoke(smoke, expected) {
  assert.equal(Object.isFrozen(smoke), true);
  assert.equal(Object.isFrozen(smoke.decodedRequestRecords), true);
  assert.equal(
    smoke.smokeStatus,
    'smoked-native-root-bridge-js-to-rust-json-transport'
  );
  assert.equal(smoke.transport, 'json');
  assert.equal(smoke.schemaVersion, 1);
  assert.equal(smoke.handleTableModel, 'fast-react-napi.BridgeHandleTable');
  assert.equal(
    smoke.validationModel,
    'fast-react-napi.NativeRootBridgeRequestSequenceValidator'
  );
  assert.equal(smoke.requestCount, 3);
  assert.equal(smoke.nativeAddonLoaded, false);
  assert.equal(smoke.nativeExecution, false);
  assert.equal(smoke.rendererExecution, false);
  assert.equal(smoke.reconcilerExecution, false);
  assert.equal(smoke.byteLength, smoke.json.length);
  assert.equal(
    smoke.jsonTransportEnvelopeFields,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke
      .jsonTransportEnvelopeFields
  );
  assert.equal(
    smoke.jsonTransportRequestRecordFields,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke
      .jsonTransportRequestRecordFields
  );
  assert.equal(
    smoke.jsonTransportHandleFields,
    native.nativeRootBridgeRequestShape.jsonTransportSmoke
      .jsonTransportHandleFields
  );

  const envelope = JSON.parse(smoke.json);
  assert.deepEqual(Object.keys(envelope), [
    'transport',
    'schemaVersion',
    'requestRecords'
  ]);
  assert.equal(envelope.transport, 'json');
  assert.equal(envelope.schemaVersion, 1);
  assert.deepEqual(
    envelope.requestRecords,
    smoke.decodedRequestRecords.map((record) => ({
      environment_id: record.environmentId,
      kind: record.kind,
      request_id: record.requestId,
      root_handle: {
        environment_id: record.rootHandle.environmentId,
        generation: record.rootHandle.generation,
        kind: record.rootHandle.kind,
        slot: record.rootHandle.slot
      },
      root_handle_state: record.rootHandleState,
      root_id: record.rootId,
      value_handle:
        record.valueHandle === null
          ? null
          : {
              environment_id: record.valueHandle.environmentId,
              generation: record.valueHandle.generation,
              kind: record.valueHandle.kind,
              slot: record.valueHandle.slot
            }
    }))
  );
  assert.deepEqual(
    smoke.decodedRequestRecords.map((record) => record.kind),
    ['create', 'render', 'unmount']
  );
  assert.deepEqual(
    smoke.decodedRequestRecords.map((record) => record.rootHandleState),
    ['active', 'active', 'retired']
  );
  assert.deepEqual(smoke.decodedRequestRecords[0], {
    requestId: 1,
    kind: 'create',
    environmentId: expected.environmentId,
    rootHandle: {
      environmentId: expected.environmentId,
      generation: 1,
      kind: 'root',
      slot: expected.rootSlot
    },
    rootId: expected.rootId,
    valueHandle: {
      environmentId: expected.environmentId,
      generation: 1,
      kind: 'value',
      slot: 2
    },
    rootHandleState: 'active'
  });
  assert.deepEqual(
    smoke.rustHandleTableAdmissionSmoke,
    nativeShapeGate.rustHandleTableAdmissionSmoke
  );
  assertNativeRootBridgeRustHandleTableAdmissionSmoke(
    smoke.rustHandleTableAdmissionSmoke,
    expected
  );
}

function assertBridgeDidNotTouchContainer(container, document) {
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.deepEqual(container.__mutationLog, []);
  assert.deepEqual(document.__mutationLog, []);
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: '#document',
    nodeType: 9
  });
  document.ownerDocument = document;
  document.defaultView = createEventTarget({ label: `${label}-window` });
  return document;
}

function createElement(nodeName, ownerDocument) {
  return createEventTarget({
    nodeName,
    nodeType: 1,
    ownerDocument
  });
}

function createEventTarget(fields) {
  return {
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({ listener, options, type });
    },
    removeEventListener() {},
    ...fields
  };
}

console.log('Fast React native CJS loader placeholder checks passed.');
