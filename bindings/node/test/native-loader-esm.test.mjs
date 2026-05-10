import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import nativeDefault, {
  FastReactNativeBindingUnavailableError,
  bindingStatus,
  createNativeRootBridgeRequestShapeGate,
  getNativeBindingLoadPlan,
  loadNativeBinding,
  nativeAddonName,
  nativeBindingManifest,
  nativeRootBridgeRequestShape,
  nativeTargetMatrix,
  packageName,
  platformArtifactPolicy,
  platformPackages,
  supportedNativeTargets,
  unavailableErrorCode
} from '../index.mjs';

const require = createRequire(import.meta.url);
const cjsBinding = require('../index.cjs');

assert.equal(nativeDefault, cjsBinding);
assert.equal(
  FastReactNativeBindingUnavailableError,
  cjsBinding.FastReactNativeBindingUnavailableError
);
assert.equal(bindingStatus, 'placeholder');
assert.equal(packageName, '@fast-react/native');
assert.equal(nativeAddonName, 'fast_react_napi');
assert.equal(nativeBindingManifest, cjsBinding.nativeBindingManifest);
assert.equal(
  nativeRootBridgeRequestShape,
  cjsBinding.nativeRootBridgeRequestShape
);
assert.equal(nativeTargetMatrix, cjsBinding.nativeTargetMatrix);
assert.equal(
  createNativeRootBridgeRequestShapeGate,
  cjsBinding.createNativeRootBridgeRequestShapeGate
);
assert.equal(getNativeBindingLoadPlan, cjsBinding.getNativeBindingLoadPlan);
assert.equal(loadNativeBinding, cjsBinding.loadNativeBinding);
assert.equal(platformArtifactPolicy, cjsBinding.platformArtifactPolicy);
assert.equal(platformPackages, cjsBinding.platformPackages);
assert.equal(supportedNativeTargets, cjsBinding.supportedNativeTargets);
assert.equal(unavailableErrorCode, cjsBinding.unavailableErrorCode);

const plan = getNativeBindingLoadPlan({
  platform: 'win32',
  arch: 'x64'
});

assert.equal(plan.nativeTarget, 'win32-x64-msvc');
assert.equal(plan.platformPackageName, '@fast-react/native-win32-x64-msvc');

assert.throws(
  () => loadNativeBinding({ platform: 'win32', arch: 'x64' }),
  FastReactNativeBindingUnavailableError
);

const rootHandle = Object.freeze({
  environmentId: 418,
  generation: 1,
  kind: 'root',
  slot: 1
});
const createValueHandle = Object.freeze({
  environmentId: 418,
  generation: 1,
  kind: 'value',
  slot: 2
});
const renderValueHandle = Object.freeze({
  environmentId: 418,
  generation: 1,
  kind: 'value',
  slot: 3
});
const shapeGate = createNativeRootBridgeRequestShapeGate([
  {
    environmentId: 418,
    kind: 'create',
    requestId: 1,
    rootHandle,
    rootHandleState: 'active',
    rootId: 1,
    valueHandle: createValueHandle
  },
  {
    environmentId: 418,
    kind: 'render',
    requestId: 2,
    rootHandle,
    rootHandleState: 'active',
    rootId: 1,
    valueHandle: renderValueHandle
  },
  {
    environmentId: 418,
    kind: 'unmount',
    requestId: 3,
    rootHandle,
    rootHandleState: 'retired',
    rootId: 1,
    valueHandle: null
  }
]);

assert.equal(shapeGate.gateStatus, nativeRootBridgeRequestShape.gateStatus);
assert.equal(shapeGate.validationModel, nativeRootBridgeRequestShape.validationModel);
assert.equal(shapeGate.nativeAddonLoaded, false);
assert.equal(
  shapeGate.handleAdmissionPreflight.preflightStatus,
  nativeRootBridgeRequestShape.handleAdmissionPreflight.preflightStatus
);
assert.equal(
  shapeGate.handleAdmissionPreflight.handleTableModel,
  'fast-react-napi.BridgeHandleTable'
);
assert.equal(
  shapeGate.rustHandleTableAdmissionSmoke.smokeStatus,
  nativeRootBridgeRequestShape.rustHandleTableAdmissionSmoke.smokeStatus
);
assert.equal(
  shapeGate.rustHandleTableAdmissionSmoke.handleTableModel,
  'fast-react-napi.BridgeHandleTable'
);
assert.equal(shapeGate.handleAdmissionPreflight.tableEnvironmentId, 418);
assert.equal(shapeGate.handleAdmissionPreflight.rootRetired, true);
assert.equal(shapeGate.rustHandleTableAdmissionSmoke.tableEnvironmentId, 418);
assert.equal(shapeGate.rustHandleTableAdmissionSmoke.rootRetired, true);
assert.deepEqual(
  shapeGate.handleAdmissionPreflight.admissionRecords.map(
    (record) => record.rootHandleAdmission.action
  ),
  [
    'admit-root-handle',
    'validate-active-root-handle',
    'retire-root-handle'
  ]
);
assert.deepEqual(
  shapeGate.rustHandleTableAdmissionSmoke.smokeRecords.map(
    (record) => record.rootHandleAction
  ),
  [
    'admit-root-handle',
    'validate-active-root-handle',
    'retire-root-handle'
  ]
);
assert.deepEqual(
  shapeGate.rustHandleTableAdmissionSmoke.smokeRecords.map(
    (record) => record.rootHandleStateAfter
  ),
  ['active', 'active', 'retired']
);
assert.equal(
  shapeGate.handleAdmissionPreflight.admissionRecords[2]
    .retiredRootHandleValidation.sourceErrorCode,
  'FAST_REACT_NAPI_STALE_HANDLE'
);
assert.equal(
  shapeGate.rustHandleTableAdmissionSmoke.smokeRecords[2]
    .retiredRootSourceErrorCode,
  'FAST_REACT_NAPI_STALE_HANDLE'
);
assert.deepEqual(
  shapeGate.rustHandleTableAdmissionSmoke.smokeRecords[2]
    .rustAdmissionSmokeRecord,
  {
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
  }
);
assert.deepEqual(
  shapeGate.validationRecords.map((record) => record.lifecycleTransition),
  ['none->active', 'active->active', 'active->retired']
);
assert.deepEqual(shapeGate.validationRecords[0].rustValidationRecord, {
  environment_id: 418,
  kind: 'create',
  lifecycle_transition: 'none->active',
  request_id: 1,
  root_handle: {
    environment_id: 418,
    generation: 1,
    kind: 'root',
    slot: 1
  },
  root_handle_state: 'active',
  root_handle_validated: true,
  root_id: 1,
  value_handle: {
    environment_id: 418,
    generation: 1,
    kind: 'value',
    slot: 2
  },
  value_handle_validated: true
});
assert.throws(
  () =>
    createNativeRootBridgeRequestShapeGate([
      shapeGate.validationRecords[0],
      {
        ...shapeGate.validationRecords[1],
        rootId: 2
      }
    ]),
  { code: 'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ROOT_ID_MISMATCH' }
);

console.log('Fast React native ESM loader placeholder checks passed.');
